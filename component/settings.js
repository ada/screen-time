import { isEmptyObject } from "./util.js";

export async function set(obj) {
    await browser.storage.sync.set({
        "settings": obj
    });
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
        duration: 10
    },
    hosts: [
        
    ], 
    activeHours : [
        { 
            title: "Social media",
            day: [], 
            start : "08:00", 
            end : "10:00"
        }, 
        { 
            title: "News",
            day: [], 
            start : "08:00", 
            end : "22:00"
        }
    ]
}


/* 
{
            hostname: "stackoverflow.com",
            track: true,
            limits: [
                {
                    period: "day",
                    threshold: 10,
                    blockAfter: true
                }
            ],
            activeHours: [
                { 
                    day: "", 
                    start : "14:00", 
                    end : "18:00"
                }
            ]
        }*/