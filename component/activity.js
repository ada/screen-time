import { isEmptyObject, isSameDay, isSameHour } from "./util.js";
/* 
    Set activities
*/
export async function set(e) {
    try {
        await browser.storage.local.set({
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
        let res = await browser.storage.local.get(["sessions"]);

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
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }
    
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
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }

    let sessions = await get();

    if (hostname.length > 0) {
        let index = sessions.findIndex(element => element.hostname === hostname);
        sessions.splice(index, 1);
    } else {
        sessions = [];
    }

    await set(sessions);
}

export async function clearEntries(threshold, pre = true){
    let sessions = await get();
    for (let i = 0; i < sessions.length; i++) {
        for (let j = 0; j < sessions[i].sessions.length; j++) {
            var creationDate = new Date(sessions[i].sessions[j].created); 
            if (pre === true) {
                if (creationDate < threshold) {
                    console.log("Deleting ", sessions[i].sessions[j]);
                    sessions[i].sessions.splice(j, 1);
                }
            }else{
                if (creationDate > threshold) {
                    console.log("Deleting ", sessions[i].sessions[j]);
                    sessions[i].sessions.splice(j, 1);
                }
                
            }
        }
    }

    await set(sessions);
}


/* 
    Get daily usage in minutes for a hostname between two dates
*/
export async function getDailyUsage(sessions, start, end, format) {
    let data = { x: [], y: [] };
    let loop = start;
    for (let i = start; i <= end; i.setDate(i.getDate() + 1)) {
        let duration = sessions.reduce(function (accumulator, element) {
            let created = new Date(element.created);
            if (isSameDay(created, i)) {
                return accumulator + element.duration;
            }
            return accumulator;
        }, 0);

        let x = moment(i).format(format);
        let y = Math.round((duration / 1000) / 60);

        data.y.push(y);
        data.x.push(x);
    }
    return data;
}

/* 
    Get hourly usage between two dates. (usually the same day)
*/
export async function getHourlyUsage(sessions, start, end, format){
    let data = { x: [], y: [] };
    let loop = start;
    for (let i = start; i <= end; i.setHours(i.getHours() + 1)) {
        let duration = sessions.reduce(function (accumulator, element) {
            let created = new Date(element.created);
            if (isSameDay(created, i) && isSameHour(created, i)) {
                return accumulator + element.duration;
            }
            return accumulator;
        }, 0);

        let x = moment(i).format(format);
        let y = Math.round((duration / 1000) / 60);

        data.y.push(y);
        data.x.push(x);
    }
    return data;
}