import * as settings from '../component/settings.js';

export async function check(hostname) {
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }

    const _settings = await settings.get();
    const hostSettingsIndex = _settings.hosts.findIndex(element => element.hostname === hostname);

    if (hostSettingsIndex === -1) {
        return;
    }

    let grantAccess = false;
    const hostSettings = _settings.hosts[hostSettingsIndex];
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;

    for (let i = 0; i < hostSettings.rules.length; i++) {
        const rule = hostSettings.rules[i];
        if ((Number(rule.day) === -1 || 
            Number(rule.day) == currentDay) && 
            currentTime > rule.start && 
            currentTime < rule.end) {
            grantAccess = true;
        }
    }

    return grantAccess;
}