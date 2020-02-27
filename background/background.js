import * as settings from '../component/settings.js';
import * as tracker from '../component/tracker.js';
import { parseHostname } from '../component/util.js';
import { add } from '../component/activity.js';
import * as alarm from '../component/alarm.js';

const minIdleTime = 1000; //ms
let _idleTimeout;
let _settings;
let _sessionStorage = [];

async function init() {
  _settings = await settings.get();
}

async function onUserInteraction() {
  let activeTabs = await browser.tabs.query({ active: true });

  for (let i = 0; i < activeTabs.length; i++) {
    let hostname = parseHostname(activeTabs[i].url);
    
    // Continue to next active tab if hostname is not tracked
    if (await tracker.isTracked(hostname) === false){
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
        alarm.init({hostname : hostname});
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
    let sessionMatch = activeTabs.filter(element => parseHostname(element.url) === session.hostname );
    if (sessionMatch.length === 0) {
      // Make sure to clear all alarms for the ended sessions.
      alarm.clear({ hostname: session.hostname });

      const duration = Math.round((new Date() - session.created));
      console.log("Session ended: " + session.hostname, duration / 1000);
      await add(session.hostname, session.created.toJSON(), duration);
      _sessionStorage.splice(i, 1);
    }
  };
}

async function OnTabActivated(activeInfo) {
  clearTimeout(_idleTimeout);
  _idleTimeout = setTimeout(onUserInteraction, minIdleTime);
}

async function OnTabUpdated(tabId, changeInfo, tabInfo) {
  if (changeInfo.status && changeInfo.status === "complete") {
    clearTimeout(_idleTimeout);
    _idleTimeout = setTimeout(onUserInteraction, minIdleTime);
  }
}

async function OnWindowFocusChanged(windowId) {
  clearTimeout(_idleTimeout);
  _idleTimeout = setTimeout(onUserInteraction, minIdleTime);
}

async function logStorageChange(changes, area) {
  console.log("Change in storage area: " + area);
  var changedItems = Object.keys(changes);

  for (var item of changedItems) {
    console.log(item + " has changed:");
    console.log("Old value: ");
    console.log(changes[item].oldValue);
    console.log("New value: ");
    console.log(changes[item].newValue);
  }
}

browser.tabs.onUpdated.addListener(OnTabUpdated);
browser.tabs.onActivated.addListener(OnTabActivated);
browser.windows.onFocusChanged.addListener(OnWindowFocusChanged);
//browser.storage.onChanged.addListener(logStorageChange);
init();