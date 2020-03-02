import * as settings from '../component/settings.js';
import * as tracker from '../component/tracker.js';
import { parseHostname } from '../component/util.js';
import { add } from '../component/activity.js';
import * as alarm from '../component/alarm.js';

// Minimum idle time in milliseconds to trigger user interactivity
const minIdleTime = 1000;

// Timer for idle time detection
let _idleTimeout;

// Copy of global settings
let _settings;

// Temporary storage for sessions
let _sessionStorage = [];

/*
  Run initialization once when browser starts. 
*/
async function init() {
  // Update local settings
  _settings = await settings.get();

  // Register listeners
  browser.tabs.onUpdated.addListener(OnTabUpdated);
  browser.tabs.onActivated.addListener(OnTabActivated);
  browser.windows.onFocusChanged.addListener(OnWindowFocusChanged);
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

    let sessionMatch = _sessionStorage.filter(element => element.hostname === hostname);
    let filteredHostSettings = _settings.hosts.filter(element => element.hostname === hostname);
    let hostSettings;

    if (filteredHostSettings.length) {
      hostSettings = filteredHostSettings[0];
    }

    // Init alarms when it's a new session
    if (sessionMatch.length === 0) {
      if (hostSettings && hostSettings.limits.length) {
        alarm.set(hostname);
      }

      console.log("Session started: " + hostname);
      _sessionStorage.push({
        hostname: hostname,
        created: new Date()
      });
    }
  };

  // Finalize dead sessions
  for (let i = 0; i < _sessionStorage.length; i++) {
    const session = _sessionStorage[i];
    let sessionMatch = activeTabs.filter(element => parseHostname(element.url) === session.hostname);
    if (sessionMatch.length === 0) {
      // Make sure to clear all alarms for the ended sessions.
      alarm.clear(session.hostname);

      const duration = Math.round((new Date() - session.created));
      console.log("Session ended: " + session.hostname, duration / 1000);
      await add(session.hostname, session.created.toJSON(), duration);
      _sessionStorage.splice(i, 1);
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


init();