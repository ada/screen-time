import * as settings from '../component/settings.js';
import * as tracker from '../component/tracker.js';
import { parseHostname } from '../component/util.js';
import { add } from '../component/activity.js';
import * as alarm from '../component/alarm.js';

let t;
let sessionStorage = [];
const minIdleTime = 1000; //ms
let _settings;

async function init() {
  _settings = await settings.get();
}

async function onUserInteraction() {
  let tabs = await chrome.tabs.query({ active: true });

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const hostname = parseHostname(tab.url);

    //check if hostname is tracked
    if (await tracker.isTracked(hostname) === false)
      continue;

    let match = sessionStorage.filter(session => session.hostname === hostname);
    let FilterhostSettings = _settings.hosts.filter(element => element.hostname === hostname);

    // check if it is restricted      
    if (FilterhostSettings.length) {
      let hostSettings = FilterhostSettings[0];

      if (hostSettings.activeHours.length && false) {
        let block = true;
        let now = new Date();
        let tnow = now.getHours() + ":" + now.getMinutes();

        for (let j = 0; j < hostSettings.activeHours.length; j++) {
          const rule = hostSettings.activeHours[j];
          if ((rule.day === "" || rule.day === now.getDay()) &&
            tnow >= rule.start &&
            tnow < rule.end) {
            block = false;
            break;
          }
        }

        if (block === true) {
          let expiredTabs = await chrome.tabs.query({ url: "*://*." + hostname + "/*" });
          expiredTabs.forEach(element => {
            chrome.tabs.executeScript(element.id, {
              code: 'document.body.style.border = "5px solid red"'
            });
          });
        
          chrome.notifications.create("uid", {
            "type": "basic",
            "iconUrl": chrome.runtime.getURL("icons/beasts-48.png"),
            "title": "Access denied",
            "message": "Access to " + hostname + " was blocked. "
          });
        }
      }}


      if (match.length === 0) {

        //check if it has alarms
        if (FilterhostSettings.length) {
          alarm.init(FilterhostSettings[0]);
        }

        console.log("session started: " + hostname);
        sessionStorage.push({
          hostname: hostname,
          created: new Date()
        });
      }
    
  };

  for (let i = 0; i < sessionStorage.length; i++) {
    const session = sessionStorage[i];
    let match = tabs.filter(t => { return parseHostname(t.url) === session.hostname });
    if (match.length === 0) {
      
      // Make sure to clear all alarms for the ended sessions.
      alarm.clear({hostname : session.hostname});
      
      const duration = Math.round((new Date() - session.created));
      console.log("session ended: " + session.hostname, duration/1000);
      await add(session.hostname, session.created.toJSON(), duration);
      sessionStorage.splice(i, 1);
    }
  };
}

async function OnTabActivated(activeInfo) {
  clearTimeout(t);
  t = setTimeout(onUserInteraction, minIdleTime);
}

async function OnTabUpdated(tabId, changeInfo, tabInfo) {
  if (changeInfo.status && changeInfo.status === "complete") {
    clearTimeout(t);
    t = setTimeout(onUserInteraction, minIdleTime);
  }
}

async function OnWindowFocusChanged(windowId) {
  clearTimeout(t);
  t = setTimeout(onUserInteraction, minIdleTime);
}

chrome.tabs.onUpdated.addListener(OnTabUpdated);
chrome.tabs.onActivated.addListener(OnTabActivated);
chrome.windows.onFocusChanged.addListener(OnWindowFocusChanged);
function logStorageChange(changes, area) {
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

chrome.storage.onChanged.addListener(logStorageChange);
init();