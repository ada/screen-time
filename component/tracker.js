import * as settings from "./settings.js";

async function isTracked(hostname) {
    if (hostname.length === 0)
        return false;

    let _settings = await settings.read();

    if (_settings.track.all === true || _settings.track.hosts.indexOf(hostname) > -1) {
        return true;
    } else {
        return false;
    }
}

async function track(hostname) {
    let _settings = await settings.read();
    if (_settings.track.hosts.indexOf(hostname) === -1) {
        _settings.track.hosts.push(hostname);
        await settings.write(_settings);
    }
}

async function untrack() {
    let _settings = await settings.read();
    let index = _settings.track.hosts.indexOf(hostname);

    if (index > -1)
        _settings.track.hosts.splice(index, 1);

    await settings.write(_settings);

}

export { isTracked, track, untrack };