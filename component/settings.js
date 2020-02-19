import { isEmptyObject } from "./util.js";

export async function set(obj) {
    await browser.storage.sync.set({
        "settings": obj
    });
    
    console.log("Settings saved.");
}

export async function get() {
    let obj = await browser.storage.sync.get(["settings"]);
    if (isEmptyObject(obj) === true) {
        await set(defaults);
        return defaults;
    }
    return obj.settings;
}

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