import * as settings from "./settings.js";

export async function isTracked(hostname) {

    if (!hostname || hostname.length === 0 || hostname.indexOf(".") === -1)
        return false;

    let _settings = await settings.get();

    if (_settings.track.all === true || _settings.hosts.filter(e => e.hostname == hostname &&  e.track === true).length > 1) {
        return true;
    } else {
        return false;
    }
}

export async function track(hostname) {
    let _settings = await settings.get();
    if (_settings.track.hosts.indexOf(hostname) === -1) {
        _settings.track.hosts.push(hostname);
        await settings.set(_settings);
    }
}

export async function untrack() {
    let _settings = await settings.get();
    let index = _settings.track.hosts.indexOf(hostname);

    if (index > -1)
        _settings.track.hosts.splice(index, 1);

    await settings.set(_settings);
}