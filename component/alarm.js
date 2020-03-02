import { get } from './activity.js';
import { isSameDay } from './util.js';
import * as settings from '../component/settings.js';

export var alarms = [];

/* 
    Clear all alarms for the given hostname
*/
export async function clear(hostname) {
    if (hostname === undefined) {
        throw new Error("Hostname is not provided.");
    }

    var filteredAlarms = alarms.filter(alarm => alarm.hostname === hostname);
    for (let i = 0; i < filteredAlarms.length; i++) {
        const a = filteredAlarms[i];
        clearTimeout(a.alarm);
        alarms.splice(alarms.indexOf(a), 1);
    }
}

/* 
    Create alarms for the given hostname
*/
export async function set(hostname) {
    if (hostname === undefined) {
        throw new Error("Hostname is not provided.");
    }

    let _settings = await settings.get();
    let hostSettings = _settings.hosts.filter(element => element.hostname === hostname)[0];
    let activity = await get({ hostname: hostname });
    let sessions = activity.sessions || [];
    var now = new Date();

    if (hostSettings.limits === undefined)
        return;

    hostSettings.limits.forEach(limitation => {
        let currentUsage = sessions.reduce(function (accumulator, session) {
            let created = new Date(session.created);

            if (limitation.period === 'day') {
                return isSameDay(now, created) ? accumulator + session.duration : accumulator;
            } else {
                throw new Error("Limitation type not suppoed.");
            }
        }, 0);


        if (currentUsage >= limitation.threshold) {
            onDailyLimitReached({
                hostname: hostname,
                blockAfter: limitation.blockAfter
            });
        } else {
            var timeLeft = limitation.threshold - currentUsage;
            console.log("current usage [m] " + currentUsage / 1000 / 60);
            console.log("time left [m] " + timeLeft / 1000 / 60);
            console.log("Setting an alarm for s: " + timeLeft / 1000);

            if (limitation.blockAfter === true) {
                var wt = timeLeft - 60000 <= 0 ? 50 : timeLeft - 60000;
                var t = setTimeout(sessionExpirationWarning, wt, {
                    hostname: hostname,
                    timeLeft: 60
                });
                alarms.push({
                    hostname: hostname,
                    alarm: t
                })
            }

            var t = setTimeout(onDailyLimitReached, timeLeft, {
                hostname: hostname,
                blockAfter: limitation.blockAfter
            });

            alarms.push({
                hostname: hostname,
                alarm: t
            })
        }
    });
}

/* 
    Clear notification with the unique id
*/
async function ClearNotificationWithUID(uid) {
    browser.notifications.clear(uid);
}

/* 
    Create and show a notification for an already expired session
*/
async function sessionExpirationWarning(options) {
    var uid = "warning_" + options.hostname;
    ClearNotificationWithUID(uid);

    browser.notifications.create(uid, {
        "type": "basic",
        "iconUrl": browser.runtime.getURL("icons/font-awesome_4-7-0_hourglass-half_48.png"),
        "title": "Reminder",
        "message": "Your daily limit on " + options.hostname + " will be reached in " + options.timeLeft + " seconds."
    });

    setTimeout(ClearNotificationWithUID, 10000, uid);
}

/*
    Create and show an expiration notification warning
*/
async function onDailyLimitReached(options) {
    var uid = "expired_" + options.hostname;
    ClearNotificationWithUID(uid);

    browser.notifications.create(uid, {
        "type": "basic",
        "iconUrl": browser.runtime.getURL("icons/font-awesome_4-7-0_hourglass-half_48.png"),
        "title": "Daily limit reached",
        "message": "You've reached your daily limit for " + options.hostname + "."
    });

    setTimeout(ClearNotificationWithUID, 10000, uid);

    if (options.blockAfter === true) {
        let tabIds = [];
        let tabs = await browser.tabs.query({ url: "*://*." + options.hostname + "/*" });

        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            let executing = browser.tabs.executeScript(tab.id, {
                code: 'document.body.style.border = "10px solid yellow"; document.body.textContent = "Website blocked by Screen Time."; document.body.style.padding = "10px"; document.body.style.textAlign = "center"'
            });
            tabIds.push(tab.id);
        }
        //browser.tabs.remove(tabIds);
    }

}