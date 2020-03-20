import { get } from './activity.js';
import { isSameDay } from './util.js';
import * as settings from '../component/settings.js';

export var alarms = [];
var UID_PREFIX_EXPIRED = "expired_";
var UID_PREFIX_REMINDER = "reminder_";

/* 
    Print all alarms
*/
export async function print() {
    console.log(alarms);
}

/* 
    Clear all alarms for the given hostname
*/
export async function clear(hostname) {
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }

    ClearNotificationWithUID(UID_PREFIX_EXPIRED + hostname);
    ClearNotificationWithUID(UID_PREFIX_REMINDER + hostname);

    var filteredAlarms = alarms.filter(alarm => alarm.hostname === hostname);
    for (let i = 0; i < filteredAlarms.length; i++) {
        const a = filteredAlarms[i];
        clearTimeout(a.alarm);
        alarms.splice(alarms.indexOf(a), 1);
    }

    //print();
}

/* 
    Create alarms for the given hostname
*/
export async function set(hostname) {
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }

    let timeLeft = -1;
    let _settings = await settings.get();
    let hostSettings = _settings.hosts.filter(element => element.hostname === hostname)[0];

    if (!hostSettings || hostSettings === undefined) {
        return;
    }

    if (!hostSettings.hasOwnProperty('alarms')) {
        return;
    }

    let activity = await get({ hostname: hostname });
    let sessions = activity.sessions || [];
    var now = new Date();

    hostSettings.alarms.forEach(alarm => {
        if (alarm.value !== 0) {
            let currentUsage = sessions.reduce(function (accumulator, session) {
                let created = new Date(session.created);

                if (alarm.period === 'day') {
                    return isSameDay(now, created) ? accumulator + session.duration : accumulator;
                } else {
                    throw new Error("alarm type not suppoed.");
                }
            }, 0);

            if (currentUsage >= alarm.value) {
                onDailyLimitReached({
                    hostname: hostname,
                    blockAfter: _settings.blockAfter
                });
            } else {
                timeLeft = alarm.value - currentUsage;
                console.log(`current usage: ${currentUsage / 1000 / 60} minutes`);
                console.log(`time left: ${timeLeft / 1000 / 60} minutes`);
                
                if (_settings.blockAfter === true) {
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
                    blockAfter: _settings.blockAfter
                });

                alarms.push({
                    hostname: hostname,
                    alarm: t
                })
            }
        }
    });

    return timeLeft;
    //print();
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
    var uid = UID_PREFIX_REMINDER + options.hostname;
    //ClearNotificationWithUID(uid);

    browser.notifications.create(uid, {
        "type": "basic",
        "iconUrl": browser.runtime.getURL("icons/font-awesome_4-7-0_hourglass-half_48.png"),
        "title": "Reminder",
        "message": "Your daily limit on " + options.hostname + " will be reached in " + options.timeLeft + " seconds."
    });

    //setTimeout(ClearNotificationWithUID, 10000, uid);
}

/*
    Create and show an expiration notification warning
*/
async function onDailyLimitReached(options) {
    var uid = UID_PREFIX_EXPIRED + options.hostname;
    //ClearNotificationWithUID(uid);

    browser.notifications.create(uid, {
        "type": "basic",
        "iconUrl": browser.runtime.getURL("icons/font-awesome_4-7-0_hourglass-half_48.png"),
        "title": "Daily limit reached",
        "message": "You've reached your daily limit for " + options.hostname + "."
    });

    //setTimeout(ClearNotificationWithUID, 30000, uid);

    if (options.blockAfter === true) {
        let tabs = await browser.tabs.query({ url: "*://*." + options.hostname + "/*" });
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            browser.tabs.executeScript(tab.id, {
                code: 'document.body.textContent = "Website blocked by Web Time."; document.body.style.background = "black"; document.body.style.color = "gray"; document.body.style.textAlign = "center"'
            });
        }
    }

}