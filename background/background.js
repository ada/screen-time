import * as settings from '../component/settings.js';
import * as tracker from '../component/tracker.js';
import { parseHostname } from '../component/util.js';
import { add, clearEntries } from '../component/activity.js';
import * as alarm from '../component/alarm.js';

// Minimum idle time in milliseconds to trigger user interactivity
const minIdleTime = 1000;

// Timer for idle time detection
let _idleTimeout;

// Copy of global settings
let _settings;

// Temporary cache storage for sessions
let _sessionCache = [];

// Register listeners
browser.tabs.onUpdated.addListener(OnTabUpdated);
browser.tabs.onActivated.addListener(OnTabActivated);
browser.windows.onFocusChanged.addListener(OnWindowFocusChanged);
browser.runtime.onMessage.addListener(handleMessage);

/*
  Run initialization once when browser starts. 
*/
async function init() {
  // Update local settings
  _settings = await settings.get();

  //Clear old entries
  var threshold = new Date();
  threshold.setDate(threshold.getDate() - _settings.track.duration);
  clearEntries(threshold);

  /* 
    For test only. clear newer entries.
  */
  //threshold = new Date();
  //threshold.setHours(0,0,0);
  //clearEntries(threshold, false);

  // Write cache to storage periodically in case of browser or OS crash
  var intervalID = setInterval(writeCacheToStorage, 15 * 60000);

  // Write cache to storage at midnight
  let now = new Date();
  let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  let msTillMidnight = midnight.getTime() - now.getTime(); // difference in milliseconds
  let midnightTimeout = setTimeout(writeCacheToStorage, msTillMidnight);
  //console.log(`Midnight task in ${msTillMidnight/1000} seconds.`);
}

/*
  Acquire active tabs and process them on user interaction
*/
async function onUserInteraction() {
  let activeTabs = await browser.tabs.query({ active: true });

  for (let i = 0; i < activeTabs.length; i++) {
    let hostname = parseHostname(activeTabs[i].url);

    // Continue to next active tab if hostname is not tracked
    if (await tracker.isTracked(hostname) === false) {
      continue;
    }

    let sessionMatch = _sessionCache.filter(element => element.hostname === hostname);
    let filteredHostSettings = _settings.hosts.filter(element => element.hostname === hostname);
    let hostSettings;

    if (filteredHostSettings.length) {
      hostSettings = filteredHostSettings[0];
    }

    if (sessionMatch.length === 0) {
      console.log("Session started: " + hostname);
      _sessionCache.push({
        hostname: hostname,
        created: new Date()
      });

      // Init alarms when it's a new session
      if (hostSettings && hostSettings.limits.length) {
        alarm.clear(hostname);
        alarm.set(hostname);
      }
    }
  };

  // Finalize dead sessions
  for (let i = 0; i < _sessionCache.length; i++) {
    const session = _sessionCache[i];
    let sessionMatch = activeTabs.filter(element => parseHostname(element.url) === session.hostname);
    if (sessionMatch.length === 0) {
      // Make sure to clear all alarms for the ended sessions.
      alarm.clear(session.hostname);

      const duration = Math.round((new Date() - session.created));
      console.log("Session ended: " + session.hostname, duration);
      await add(session.hostname, session.created.toJSON(), duration);
      _sessionCache.splice(i, 1);
    }
  };
}


/* 
  Trigger user interaction when tab gets activated
*/
async function OnTabActivated(activeInfo) {
  clearTimeout(_idleTimeout);
  _idleTimeout = setTimeout(onUserInteraction, minIdleTime);
}

/* 
  Trigger user interaction when tab is updated
*/
async function OnTabUpdated(tabId, changeInfo, tabInfo) {
  if (changeInfo.status && changeInfo.status === "complete") {
    clearTimeout(_idleTimeout);
    _idleTimeout = setTimeout(onUserInteraction, minIdleTime);
  }
}

/* 
  Trigger user interaction when window focus changes
*/
async function OnWindowFocusChanged(windowId) {
  clearTimeout(_idleTimeout);
  _idleTimeout = setTimeout(onUserInteraction, minIdleTime);
}

async function handleMessage(message) {
  //console.log(message);
  switch (message.id) {
    case 'WRITE_CACHE_TO_STORAGE':
      await writeCacheToStorage();
      break;
    case 'RESET_ALARM_FOR_HOSTNAME':
      await alarm.clear(message.data);
      await alarm.set(message.data);
      break;
    default:
      throw new Error(`Message id "${message.id}" is not implementd.`)
      break;
  }
}

/* 
  Write all cache entries to local storage and reset creation date. 
  This is useful when clocks changes from 23:59:59 to 00:00:00 thus seperating dates.
*/
async function writeCacheToStorage() {
  for (let i = 0; i < _sessionCache.length; i++) {
    const session = _sessionCache[i];
    const duration = Math.round((new Date() - session.created));
    //console.log("Session written to storage: " + session.hostname, duration);
    await add(session.hostname, session.created.toJSON(), duration);
    _sessionCache[i].created = new Date();
  }
}

browser.runtime.onSuspend.addListener(function () {
  console.log("Unloading.");
});

init();