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
    let alarmsArray = [{
        period: "day",
        value: UIRangeAlarm.value * 60 * 1000,
        blockAfter: false
    }];

    if (UIRangeAlarm.value === 0) {
        alarmsArray = [];
    }

    if (i === -1) {
        _settings.hosts.push(
            {
                hostname: _hostname,
                alarms: alarmsArray,
                rules: []
            }
        );
    } else {
        _settings.hosts[i].alarms = alarmsArray;
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
        if (_settings.hosts[i].alarms.length > 0) {
            UIRangeAlarm.value = _settings.hosts[i].alarms[0].value / 1000 / 60;
        } else {
            UIRangeAlarm.value = 0;
        }
        updateAlarmLabel();
    }
}