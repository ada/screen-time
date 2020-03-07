import { isEmptyObject } from "./util.js";

/* 
    Set activities
*/
export async function set(e) {
    try {
        await browser.storage.sync.set({
            "sessions": e
        });
    } catch (error) {
        console.error(error);
    }
}

/*
    Get activites
*/
export async function get(options) {
    try {
        let res = await browser.storage.sync.get(["sessions"]);

        if (isEmptyObject(res) === true)
            return [];

        if (options && options.hostname) {
            let index = res.sessions.findIndex(element => element.hostname === options.hostname);
            return index === -1 ? { sessions: [], hostname: options.hostname } : res.sessions[index];
        }

        return res.sessions;
    } catch (error) {
        console.error(error);
    }
}

/*
    Add a new activity
*/
export async function add(hostname, created, duration) {
    try {
        let sessions = await get();
        let index = sessions.findIndex(element => element.hostname === hostname);

        if (index === -1) {
            sessions.push({
                "hostname": hostname,
                "sessions": [{ "created": created, "duration": duration }]
            })
        } else {
            sessions[index].sessions.push({ "created": created, "duration": duration })
        }

        await set(sessions);
    } catch (error) {
        console.error(error);
    }
}

/* 
    Clear activities for a hostname or all activites
*/
export async function clear(hostname) {
    let sessions = await get();

    if (hostname.length > 0) {
        let index = sessions.findIndex(element => element.hostname === hostname);
        sessions.splice(index, 1);
    } else {
        sessions = [];
    }

    await set(sessions);
}

export async function clearOldEntries(threshold){
    let sessions = await get();
    console.log("Clearing entries older than: ", threshold);
    for (let i = 0; i < sessions.length; i++) {
        console.log("Analyzing " + sessions[i].hostname);
        for (let j = 0; j < sessions[i].sessions.length; j++) {
            if (sessions[i].sessions[j].created < threshold) {
                console.log("Deleting ", sessions[i].sessions[j]);
                sessions[i].sessions.splice(j, 1);
            }
        }
    }

    await set(sessions);
}