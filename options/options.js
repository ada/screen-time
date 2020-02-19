import * as settings from "../component/settings.js";
import * as activity from '../component/activity.js';

let _settings; 
let UICheckboxTrackAll = document.getElementById("checkboxTrackAll"); 
let UISelectBoxDefaultChartView = document.getElementById("defaultChartView"); 
let UIRangeTrackingDuration = document.getElementById("trackingDuration"); 
let UILabelTrackingDuration = document.getElementById("trackingDurationLabel");

async function initEventListeners(){
    document.querySelector("form").addEventListener("reset", reset);
    UICheckboxTrackAll.addEventListener("change", onOptionsChanged);
    UISelectBoxDefaultChartView.addEventListener("change", onOptionsChanged);
    UIRangeTrackingDuration.addEventListener("change", onOptionsChanged);
    UIRangeTrackingDuration.addEventListener("input", onTrackingDurationChanged);
}

async function init() {
    _settings = await settings.get(); 
    UICheckboxTrackAll.checked = _settings.track.all;
    UISelectBoxDefaultChartView.value = _settings.chart.nDays; 
    UIRangeTrackingDuration.value = _settings.track.duration; 
    UILabelTrackingDuration.textContent = _settings.track.duration;
    initEventListeners();
}

async function reset() {
    await settings.set(settings.defaults);
    await activity.set([]);
    await init(); 
}

async function onOptionsChanged(){
    _settings.track.all = UICheckboxTrackAll.checked;
    _settings.track.duration = UIRangeTrackingDuration.value;
    _settings.chart.nDays = UISelectBoxDefaultChartView.value;
    await settings.set(_settings); 
}

async function onTrackingDurationChanged(){
    UILabelTrackingDuration.textContent = UIRangeTrackingDuration.value;
}

document.addEventListener("DOMContentLoaded", init);