import * as settings from './settings.js';

let _settings;
let UIButtonViewChart = document.getElementById("view-chart");
let UIButtonViewAlarm = document.getElementById("view-alarm");
let UIButtonViewOptions = document.getElementById("view-options");
let UIBUttonViewRules = document.getElementById("view-rules")
let UIButtonViewSettings = document.getElementById("view-settings");
let UIButtonAddRule = document.getElementById("button-add-rule");

UIButtonViewChart.addEventListener("click", onTabNavigation);
UIButtonViewAlarm.addEventListener("click", onTabNavigation);
UIButtonViewOptions.addEventListener("click", onTabNavigation);
UIBUttonViewRules.addEventListener("click", onTabNavigation);
UIButtonViewSettings.addEventListener("click", openSettings);

/* 
    Open global extensions options
*/
async function openSettings(e) {
    browser.runtime.openOptionsPage();
}

async function onTabNavigation(e) {
    let tabcontent = document.getElementsByClassName("tabContent");

    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    let tabItems = document.getElementsByClassName("tab-link");

    for (let i = 0; i < tabItems.length; i++) {
        const element = tabItems[i];
        element.disabled = false;
        element.classList.remove("btn-active");
    }

    let targetId = e.srcElement.id.replace("view-", "") + "View";
    document.getElementById(targetId).style.display = "block";
    e.currentTarget.className += " btn-active";
    customizeTabBarForView(targetId);
}

async function customizeTabBarForView(view){
    switch (view) {
        case 'rulesView':
            UIButtonAddRule.hidden = false; 
            UIButtonViewSettings.hidden = true; 
            break;
        default:
            UIButtonAddRule.hidden = true;
            UIButtonViewSettings.hidden = false;  
            break;
    }
}

export async function init(isTracked){
    _settings = await settings.get();

    if (isTracked === true) {
        UIButtonViewChart.click();
        if(_settings.track.all === true){
            var element = document.getElementById("view-options"); 
            element.parentElement.removeChild(element);
        } else{
            var element = document.getElementById("enableTracking"); 
            element.parentElement.removeChild(element);
        }
    } else {
        UIButtonViewOptions.click();
        var elementsToRemove = ["disableTracking", "view-chart", "view-alarm", "view-rules"]; 
        
        for (let i = 0; i < elementsToRemove.length; i++) {
            const elementId = elementsToRemove[i];
            var element = document.getElementById(elementId); 
            element.parentElement.removeChild(element);
        }
    }
}