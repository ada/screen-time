import { get } from './activity.js';
import { isSameDay } from './util.js';

export var alarms = [];

export async function clear(hostSettings){
    console.log(alarms);
    var filteredAlarms = alarms.filter(alarm => alarm.hostname === hostSettings.hostname);
    for (let i = 0; i < filteredAlarms.length; i++) {
        const a = filteredAlarms[i];
        clearTimeout(a.alarm);
        alarms.splice(alarms.indexOf(a),1);
    }
    console.log(alarms);
}

export async function init(hostSettings) {
    if (hostSettings.limits.length) {
        let host = await get({ hostname: hostSettings.hostname });
        
        let sessions = host.sessions || [];
        var now = new Date();

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
                console.log("wesite blocked.");
            } else {
                var timeLeft = limitation.threshold - currentUsage;
                console.log("current usage [m] " + currentUsage / 1000 / 60);
                console.log("time left [m] " + timeLeft / 1000 / 60);
                console.log("Setting an alarm for s: " + timeLeft/1000);

                if (limitation.blockAfter === true) {
                    var wt = timeLeft - 60000 <= 0 ? 50 : timeLeft - 60000;
                    var t = setTimeout(sessionExpirationWarning, wt, {
                        hostname: hostSettings.hostname,
                        timeLeft: 60
                    });
                    alarms.push({
                        hostname: hostSettings.hostname,
                        alarm: t
                    })
                }

                var t = setTimeout(onDailyLimitReached, timeLeft, {
                    hostname: hostSettings.hostname,
                    blockAfter: limitation.blockAfter
                });

                alarms.push({
                    hostname: hostSettings.hostname,
                    alarm: t
                })
            }
        });
    }
}

function clearSessionExpirationWarning(name){
    chrome.notifications.clear(name);
}

function sessionExpirationWarning(options) {
    var uid = "warning_"+options.hostname;
    chrome.notifications.create(uid, {
        "type": "basic",
        "iconUrl": chrome.runtime.getURL("icons/beasts-48.png"),
        "title": "Reminder",
        "message": "Your daily limit on " + options.hostname + " will be reached in " + options.timeLeft + " seconds."
    });
    setTimeout(clearSessionExpirationWarning, 10000, uid);
}

function onDailyLimitReached(options) {
    var uid = "expired_"+options.hostname;
    chrome.notifications.create(uid, {
        "type": "basic",
        "iconUrl": chrome.runtime.getURL("icons/beasts-48.png"),
        "title": "Daily limit reached",
        "message": "You've reached your daily limit for " + options.hostname
    });
}