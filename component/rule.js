import * as settings from '../component/settings.js';
let _hostname;

export async function check(hostname) {
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }

    _hostname = hostname;

    const _settings = await settings.get();
    const hostSettings = _settings.hosts.filter(element => element.hostname === hostname)[0];

    if (!hostSettings || hostSettings === undefined) {
        return;
    }

    if (!hostSettings.hasOwnProperty('rules')) {
        return;
    }

    let passed = false;
    //10:22:00.000
    var now = new Date();
    var currentDay = now.getDay();
    var currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;

    for (let i = 0; i < hostSettings.rules.length; i++) {
        const rule = hostSettings.rules[i];
        if ((Number(rule.day) === -1 || Number(rule.day) == currentDay) && currentTime > rule.start && currentTime < rule.end) {
            passed = true;
        }
    }

    if (passed === true) {
        console.log("Access granted.");
    } else {
        console.log("Access denied."); 
        let tabs = await browser.tabs.query({ url: "*://*." + hostname + "/*" });
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            browser.tabs.executeScript(tab.id, {
                code: 'document.body.textContent = "Website blocked by Web Time."; document.body.style.background = "black"; document.body.style.color = "gray"; document.body.style.textAlign = "center"'
            });
        }
    }
    return passed;
}