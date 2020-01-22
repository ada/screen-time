import * as settings from "../component/settings.js";
import {set} from '../component/activity.js';


  
let UICheckboxTrackAll = document.getElementById("checkboxTrackAll"); 
let UISelectBoxDefaultChartView = document.getElementById("defaultChartView"); 
let _settings; 

async function init() {
    _settings = await settings.get(); 
    UICheckboxTrackAll.checked = _settings.track.all;
    UISelectBoxDefaultChartView.value = _settings.chart.nDays; 
}

async function reset() {
    await settings.set(settings.defaults);
    await set([]);
    await init(); 
}

async function onSettingsChanged(){
    _settings.track.all = UICheckboxTrackAll.checked;
    _settings.chart.nDays = UISelectBoxDefaultChartView.value;
    await settings.set(_settings); 
}

document.addEventListener("DOMContentLoaded", init);
document.querySelector("form").addEventListener("reset", reset);
UICheckboxTrackAll.addEventListener("change", onSettingsChanged);
UISelectBoxDefaultChartView.addEventListener("change", onSettingsChanged)