import { parseHostname } from '../component/parser.js';
import { isTracked } from '../component/tracker.js';
import { add } from '../component/activity.js';

var t;
var sessionStorage = [];
const minIdleTime = 1000;

async function onUserInteraction() {
  let tabs = await browser.tabs.query({ active: true });

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const hostname = parseHostname(tab.url);

    if (await isTracked(hostname) === false) {
      continue;
    }

    let match = sessionStorage.filter(session => { return session.hostname === hostname });

    if (match.length === 0) {
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
      const duration = Math.round((new Date() - session.created) / 1000);
      console.log("session ended: " + session.hostname, duration);
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

var faked = true;
async function OnWindowFocusChanged() {
  clearTimeout(t);
  t = setTimeout(onUserInteraction, minIdleTime);

  if (faked === false) {
    const hostname = parseHostname("https://stackoverflow.com/");
    for (let index = 0; index < 1; index++) {
      let a = new Date();
      a.setHours(Math.floor(Math.random() * 23) + 1);
      let d = Math.floor(Math.random() * 3000) + 1;
      console.log(hostname, a, d);
      await add(hostname, a, d);
    }

    for (let index = 0; index < 30; index++) {
      let a = new Date();
      a.setDate(a.getDate()-index);
      let d = Math.floor(Math.random() * 3000) + 1;
      console.log(hostname, a, d);
      await add(hostname, a, d);
    }
    faked = true;
  }

}

browser.tabs.onUpdated.addListener(OnTabUpdated);
browser.tabs.onActivated.addListener(OnTabActivated);
browser.windows.onFocusChanged.addListener(OnWindowFocusChanged);

 // var reminderNotification = "test";
/*browser.notifications.create(reminderNotification, {
"type": "basic",
"iconUrl": browser.runtime.getURL("icons/beasts-48.png"),
"title": "Time for cake!",
"message": "Something something cake"
});*/