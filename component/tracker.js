import * as settings from "./settings.js";

/*
    Check wheter a hostname is tracked by the extension
*/
export async function isTracked(hostname) {

    if (!hostname || hostname.length === 0 || hostname.indexOf(".") === -1)
        return false;

    let _settings = await settings.get();

    if (_settings.track.all === true || _settings.hosts.findIndex(e => e.hostname === hostname) > -1) {
        return true;
    } else {
        return false;
    }
}

/* 
    Track a hostname
*/
export async function track(hostname) {
    let _settings = await settings.get();
    if (_settings.hosts.indexOf(hostname) === -1) {
        _settings.hosts.push({
            accessRules: [],
            hostname: hostname,
            limits: [],
        });
        await settings.set(_settings);
    }
}

/* 
    Stop tracking a hostname
*/
export async function untrack(hostname) {
    let _settings = await settings.get();
    let index = _settings.hosts.findIndex(e => e.hostname === hostname);

    if (index > -1) {
        _settings.hosts.splice(index, 1);
        
    }

    await settings.set(_settings);
}