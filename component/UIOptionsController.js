import * as settings from './settings.js';
import * as tracker from './tracker.js';
import * as activity from './/activity.js';

let _settings, _hostname; 
let UIButtonEnableTracking = document.getElementById("enableTracking");
let UIButtonDisableTracking = document.getElementById("disableTracking");

UIButtonEnableTracking.addEventListener("click", track);
UIButtonDisableTracking.addEventListener("click", untrack);

/* 
    Add current hostname to the tracking list
*/
async function track() {
    await tracker.track(_hostname);
    location.reload();
}

/* 
    Remove current hostname from the tracking list
*/
async function untrack() {
    await tracker.untrack(_hostname);
    await activity.clear(_hostname);
    location.reload();
}

export async function init(hostname){
    _hostname = hostname; 
}