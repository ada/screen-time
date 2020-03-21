import * as settings from "../component/settings.js";
import * as activity from '../component/activity.js';

// Local copy of the global settings
let _settings; 

// UI References
let UICheckboxTrackAll = document.getElementById("checkboxTrackAll"); 
let UISelectBoxDefaultChartView = document.getElementById("defaultChartView"); 
let UIRangeTrackingDuration = document.getElementById("trackingDuration"); 
let UILabelTrackingDuration = document.getElementById("trackingDurationLabel");
let UIButtonResetSettings = document.getElementById("resetSettings"); 
let UIButtonResetData = document.getElementById("resetData");
let UICheckboxBlockAfter = document.getElementById("blockAfter");
/* 
    Event listeners
*/
async function initEventListeners(){
    UIButtonResetData.addEventListener("click", resetData);
    UIButtonResetSettings.addEventListener("click", resetSettings);
    UICheckboxTrackAll.addEventListener("change", onOptionsChanged);
    UISelectBoxDefaultChartView.addEventListener("change", onOptionsChanged);
    UIRangeTrackingDuration.addEventListener("change", onOptionsChanged);
    UIRangeTrackingDuration.addEventListener("input", onTrackingDurationChanged);
    UICheckboxBlockAfter.addEventListener("change", onOptionsChanged);
}

/* 
    Runs once during the initializtion
*/
async function init() {
    _settings = await settings.get(); 
    UICheckboxTrackAll.checked = _settings.track.all;
    UICheckboxBlockAfter.checked = _settings.blockAfter; 
    UISelectBoxDefaultChartView.value = _settings.chart.nDays; 
    UIRangeTrackingDuration.value = _settings.track.duration; 
    UILabelTrackingDuration.textContent = _settings.track.duration;
    initEventListeners();
}

/* 
    Reset settings to default settings
*/
async function resetSettings() {
    await settings.reset(); 
    init(); 
}

/* 
    Clear all collected data
*/
async function resetData() {
    await activity.set([]);
}

/*
    Save new settings
*/
async function onOptionsChanged(){
    _settings.track.all = UICheckboxTrackAll.checked;
    _settings.blockAfter = UICheckboxBlockAfter.checked; 
    _settings.track.duration = Number(UIRangeTrackingDuration.value);
    _settings.chart.nDays = Number(UISelectBoxDefaultChartView.value);
    await settings.set(_settings); 
}

/* 
    Update label on duration slider change
*/
async function onTrackingDurationChanged(){
    UILabelTrackingDuration.textContent = UIRangeTrackingDuration.value;
}


init(); 