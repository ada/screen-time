import * as settings from "../component/settings.js";
import * as activity from '../component/activity.js';

// Local copy of the global settings
let _settings; 

// UI References
let UICheckboxTrackAll = document.getElementById("checkboxTrackAll"); 
let UISelectBoxDefaultChartView = document.getElementById("defaultChartView"); 
let UIRangeTrackingDuration = document.getElementById("trackingDuration"); 
let UILabelTrackingDuration = document.getElementById("trackingDurationLabel");

/* 
    Event listeners
*/
async function initEventListeners(){
    document.querySelector("form").addEventListener("reset", reset);
    UICheckboxTrackAll.addEventListener("change", onOptionsChanged);
    UISelectBoxDefaultChartView.addEventListener("change", onOptionsChanged);
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
    initEventListeners();
}

/* 
    Reset extension settings and clear all data
*/
async function reset() {
    await settings.set(settings.defaults);
    await activity.set([]);
    await init(); 
}

/*
    Save new settings
*/
async function onOptionsChanged(){
    _settings.track.all = UICheckboxTrackAll.checked;
    _settings.track.duration = UIRangeTrackingDuration.value;
    _settings.chart.nDays = UISelectBoxDefaultChartView.value;
    await settings.set(_settings); 
}

/* 
    Update label on duration slider change
*/
async function onTrackingDurationChanged(){
    UILabelTrackingDuration.textContent = UIRangeTrackingDuration.value;
}


init(); 