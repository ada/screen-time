import { isEmptyObject } from "./util.js";

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
    accessRules : []
}