import * as settings from './settings.js';

export var UIRangeAlarm = document.getElementById("alarm");
let UIRangeAlarmLabel = document.getElementById("alarmLabel");
let _settings, _hostname; 
UIRangeAlarm.addEventListener("change", onAlarmSettingsChanged);
UIRangeAlarm.addEventListener("input", updateAlarmLabel);

/* 
    Handle alarms settings changes
*/
async function onAlarmSettingsChanged() {
    let i = _settings.hosts.findIndex(element => element.hostname === _hostname);
    let limitArray = [{
            period: "day",
            threshold: UIRangeAlarm.value * 60 * 1000,
            blockAfter: false
        }];

    if (UIRangeAlarm.value === 0) {
        limitArray = [];
    }

    if (i === -1) {
        _settings.hosts.push(
            {
                hostname: _hostname,
                limits: limitArray,
                accessRules: []
            }
        );
    } else {
        _settings.hosts[i].limits = limitArray
    }

    await settings.set(_settings);
    browser.runtime.sendMessage({ id: "RESET_ALARM_FOR_HOSTNAME", hostname: _hostname });
}


/* 
   Update Alarm range slider label
*/
export async function updateAlarmLabel() {
    UIRangeAlarmLabel.innerHTML = UIRangeAlarm.value > 0 ? UIRangeAlarm.value + " minutes" : "";
    //updateChart();
}


/* 
    Retrieve host settings for the current hostname
*/
export async function init(hostname) {
    _settings = await settings.get();
    _hostname = hostname; 

    let i = _settings.hosts.findIndex(host => host.hostname === _hostname);
    if (i > -1) {
        if (_settings.hosts[i].limits.length > 0) {
            UIRangeAlarm.value = _settings.hosts[i].limits[0].threshold / 1000 / 60;
        } else {
            UIRangeAlarm.value = 0;
        }
        updateAlarmLabel();
    }
}