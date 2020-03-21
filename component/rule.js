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
    const currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    for (let i = 0; i < hostSettings.rules.length; i++) {
        const rule = hostSettings.rules[i];
        if ((Number(rule.day) === -1 || 
            Number(rule.day) == currentDay) && 
            currentTime >= rule.start && 
            currentTime < rule.end) {
            grantAccess = true;
        }
    }
    return grantAccess;
}

export async function blockHostname(hostname, cause){
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }

    const style = `document.body.style.background = "lightgray"; document.body.style.color = "gray"; document.body.style.textAlign = "center"; document.body.style.padding = "50px"`;
    let message = '';

    switch (cause) {
        case 'RULES_NOT_MATCHED':
            message = 'No rules were satisfied.';
            break;
        case 'ALARM_TIMEOUT': 
            message = 'You have reached your daily limit.'; 
            break; 
        default:
            message = cause;
            break;
    }

    let tabs = await browser.tabs.query({ url: "*://*." + hostname + "/*" });
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      browser.tabs.executeScript(tab.id, {
        code: `document.body.textContent = "Website blocked by Web Time. ${message}"; ${style}`
      });
    }
}