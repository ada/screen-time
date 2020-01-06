import * as settings from "../component/settings.js";

let UICheckboxTrackAll = document.getElementById("checkboxTrackAll"); 
let _settings; 

async function save(e) {
    if(e)
        e.preventDefault();
    await settings.write(_settings); 
}

async function load() {
    _settings = await settings.read(); 
    document.getElementById("checkboxTrackAll").checked = _settings.track.all;
}

async function reset() {
    await settings.write(settings.defaultSettings);
    await load(); 
}

async function toggleTrackAll(){
    _settings.track.all = UICheckboxTrackAll.checked;
    await save(); 
}

document.addEventListener("DOMContentLoaded", load);
document.querySelector("form").addEventListener("reset", reset);
UICheckboxTrackAll.addEventListener("change", toggleTrackAll);