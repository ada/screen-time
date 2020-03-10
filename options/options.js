import * as settings from "../component/settings.js";
import * as activity from '../component/activity.js';

// Local copy of the global settings
let _settings; 

// UI References
let UICheckboxTrackAll = document.getElementById("checkboxTrackAll"); 
let UISelectBoxDefaultChartView = document.getElementById("defaultChartView"); 
let UIRangeTrackingDuration = document.getElementById("trackingDuration"); 
let UILabelTrackingDuration = document.getElementById("trackingDurationLabel");
let UISelectBoxTheme = document.getElementById("theme");
let UIButtonResetSettings = document.getElementById("resetSettings"); 
let UIButtonResetData = document.getElementById("resetData");
/* 
    Event listeners
*/
async function initEventListeners(){
    UIButtonResetData.addEventListener("click", resetData);
    UIButtonResetSettings.addEventListener("click", resetSettings);
    UICheckboxTrackAll.addEventListener("change", onOptionsChanged);
    UISelectBoxDefaultChartView.addEventListener("change", onOptionsChanged);
    UISelectBoxTheme.addEventListener("change", onOptionsChanged);
    UIRangeTrackingDuration.addEventListener("change", onOptionsChanged);
    UIRangeTrackingDuration.addEventListener("input", onTrackingDurationChanged);
}

/* 
    Runs once during the initializtion
*/
async function init() {
    _settings = await settings.get(); 
    UICheckboxTrackAll.checked = _settings.track.all;
    UISelectBoxDefaultChartView.value = _settings.chart.nDays; 
    UIRangeTrackingDuration.value = _settings.track.duration; 
    UILabelTrackingDuration.textContent = _settings.track.duration;
    UISelectBoxTheme.value = _settings.theme; 
    initEventListeners();
}

/* 
    Reset settings to default settings
*/
async function resetSettings() {
    await settings.set(settings.defaults);
    init(); 
}

/* 
    Clear all collected data
*/
async function resetData() {
    activity.set([]);
}

/*
    Save new settings
*/
async function onOptionsChanged(){
    _settings.track.all = UICheckboxTrackAll.checked;
    _settings.track.duration = Number(UIRangeTrackingDuration.value);
    _settings.chart.nDays = Number(UISelectBoxDefaultChartView.value);
    _settings.theme = UISelectBoxTheme.value === "dark" ? "dark" : "light"; 
    await settings.set(_settings); 
}

/* 
    Update label on duration slider change
*/
async function onTrackingDurationChanged(){
    UILabelTrackingDuration.textContent = UIRangeTrackingDuration.value;
}


init(); 