import { get as settings_get } from '../component/settings.js';
import { isTracked as tracker_isTracked } from '../component/tracker.js';
import { parseHostname as util_parseHostname } from '../component/util.js';
import { add as activity_add, clearEntries as activity_clearEntries } from '../component/activity.js';
import { clear as alarm_clear, set as alarm_set } from '../component/alarm.js';
import { check as rule_check, blockHostname } from '../component/rule.js';

// Minimum idle time in milliseconds to trigger user interactivity
const minIdleTime = 1000;

// Timer for idle time detection
let _idleTimeout;

// Extension settings
let _settings;

// Temporary cache storage for sessions
let _sessionCache = [];

// Last time a user interacted with the browser
let _lastUserInteractionTime;

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
  _settings = await settings_get();

  //Clear old entries
  var threshold = new Date();
  threshold.setDate(threshold.getDate() - _settings.track.duration);
  activity_clearEntries(threshold);

  /* 
    For test only. clear newer entries.
  */
  //threshold = new Date();
  //threshold.setHours(0,0,0);
  //activity_clearEntries(threshold, false);

  // Write cache to storage periodically in case of browser or OS crash
  var intervalID = setInterval(writeCacheToStorage, 15 * 60000);

  // Write cache to storage at midnight
  await midnightTask();

  // Detect if user is idle every minute
  setInterval(detectIdleUser, 60000);
  //setInterval(updateBadgeText, 5000);
}

/* 
  Update badge text
*/
async function updateBadgeText() {
  let activeTabs = await browser.tabs.query({ active: true });
  await initializeNewSessions(activeTabs);
}

/*
  Acquire active tabs and process them on user interaction
*/
async function onUserInteraction() {
  _lastUserInteractionTime = new Date();
  let activeTabs = await browser.tabs.query({ active: true });
  _settings = await settings_get();
  initializeNewSessions(activeTabs);
  finalizeDeadSessions(activeTabs);
}

/* 
  Initialize new sessions
*/
async function initializeNewSessions(activeTabs) {
  for (let i = 0; i < activeTabs.length; i++) {
    const hostname = util_parseHostname(activeTabs[i].url);
    const sessionMatch = _sessionCache.filter(element => element.hostname === hostname);

    // Continue to next active tab if hostname is not tracked or if it's already in cache
    if (await tracker_isTracked(hostname) === false || sessionMatch.length > 0) {
      continue;
    }

    // Check host settings
    const hostSettingsIndex = _settings.hosts.findIndex(element => element.hostname === hostname);

    // hostname has settings
    if (hostSettingsIndex > -1) {
      const hostSettings = _settings.hosts[hostSettingsIndex];
      //console.log(hostSettings);
      
      // process access rules
      if (hostSettings.rules.length) {
        const grantAccess = await rule_check(hostname);
        if (grantAccess === false) {
          blockHostname(hostname, "RULES_NOT_MATCHED");
          continue;
        }
      }

      // process alarms
      if (hostSettings.alarms.length) {
        await alarm_clear(hostname);
        await alarm_set(hostname);
      }
    }

    // Add to cache
    _sessionCache.push({
      hostname: hostname,
      created: new Date()
    });

    console.log("Session started: " + hostname);
  }
}

/* 
  Finalize dead sessions
*/
async function finalizeDeadSessions(activeTabs) {
  for (let i = 0; i < _sessionCache.length; i++) {
    const session = _sessionCache[i];
    let sessionMatch = activeTabs.filter(element => util_parseHostname(element.url) === session.hostname);
    if (sessionMatch.length === 0) {
      // Make sure to clear all alarms for the ended sessions.
      alarm_clear(session.hostname);

      const duration = Math.round((new Date() - session.created));
      console.log("Session ended: " + session.hostname, duration);
      await activity_add(session.hostname, session.created.toJSON(), duration);
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
  Trigger user interaction when window focus changes.
*/
async function OnWindowFocusChanged(windowId) {
  clearTimeout(_idleTimeout);
  _idleTimeout = setTimeout(onUserInteraction, minIdleTime);
}

/* 
  Messages from popup or other modules are handled here.
*/
async function handleMessage(message) {
  console.log(message);
  switch (message.id) {
    case 'WRITE_CACHE_TO_STORAGE':
      await writeCacheToStorage();
      break;
    case 'RESET_ALARM_FOR_HOSTNAME':
      await alarm_clear(message.hostname);
      await alarm_set(message.hostname);
      break;
    case 'HOST_SETTINGS_CHANGED':
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      await browser.tabs.update(tabs[0].id, { url: tabs[0].url });
      onUserInteraction();
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
async function writeCacheToStorage(flush = false) {
  if (_sessionCache.length === 0) {
    return;
  }

  for (let i = 0; i < _sessionCache.length; i++) {
    const session = _sessionCache[i];
    const duration = Math.round((new Date() - session.created));
    //console.log("Session written to storage: " + session.hostname, duration);
    await activity_add(session.hostname, session.created.toJSON(), duration);

    if (flush === true) {
      _sessionCache.splice(i, 1);
    } else {
      _sessionCache[i].created = new Date();
    }
  }
}

/* 
  Flush cache to storage if use has been inactive
*/
async function detectIdleUser() {
  var now = new Date();
  if (now - _lastUserInteractionTime > 60 * 1000) {
    console.log("User is idle. Flushing cache...");
    await writeCacheToStorage(true);
  } else {
    //console.log("user is active.")
  }
}

/* 
  Task to run at midnight to create new sessions for the new day
*/
async function midnightTask() {
  await writeCacheToStorage();
  // Write cache to storage at midnight
  let now = new Date();
  let midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  let msTillMidnight = midnight.getTime() - now.getTime(); // difference in milliseconds
  let midnightTimeout = setTimeout(midnightTask, msTillMidnight);
  //console.log(`Midnight task will run in ${msTillMidnight / 1000 / 60} minutes`);
}

/* 
  On browser suspend
*/
browser.runtime.onSuspend.addListener(function () {
  console.log("Unloading extension");
  writeCacheToStorage(true);
});


init();