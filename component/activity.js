import { isEmptyObject } from "./util.js";

async function set(e) {
    try {
        await browser.storage.sync.set({
            "sessions": e
        });
    } catch (error) {
        console.error(error);
    }
}

async function get(options) {
    try {
        let res = await browser.storage.sync.get(["sessions"]);
        
        if (isEmptyObject(res) === true)
            return [];

        if (options && options.hostname) {
            let index = res.sessions.findIndex(element => element.hostname === options.hostname);
            return index === -1 ? {sessions:[], hostname:options.hostname} : res.sessions[index];
        }

        return res.sessions;
    } catch (error) {
        console.error(error);
    }
}

async function add(hostname, created, duration) {
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



export { set, get, add };