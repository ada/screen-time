import { isEmptyObject } from "./util.js";

/* 
    Default settings when using the extension for the first time
*/
export const defaults = {
    chart: {
        nDays: 7
    },
    track: {
        all: true,
        duration: 30
    },
    hosts: [],
    blocketAfter: false
}

/* 
    // Example host object
    [{
        hostname: "example.com",
        alarms: [
            {period: "day", value: 1 * 60 * 1000, blockAfter: false}
        ],
        rules: [
            {day: "3", start: "10:22:00.000", end: "10:25:00.000"}
        ]
    }]
*/

/* 
    Set settings object
*/
export async function set(obj) {
    await browser.storage.sync.set({
        "settings": obj
    });

    console.log("Settings saved.");
}

/* 
    Reset settings
*/
export async function reset() {
    await set(defaults);
}

/*
    Get settings object. Return default settings if no settings where found. 
*/
export async function get() {
    let obj = await browser.storage.sync.get(["settings"]);
    if (isEmptyObject(obj) === true) {
        await set(defaults);
        return defaults;
    }
    return obj.settings;
}