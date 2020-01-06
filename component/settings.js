import {isEmptyObject} from "./helper.js";


let defaultSettings = {
    track : {
        all : true, 
        hosts : []
    }
};

async function write(obj){
    await browser.storage.sync.set({
        "settings" : obj
    });
}

async function read(){
    let obj = await browser.storage.sync.get("settings"); 
    if(isEmptyObject(obj) === true)
        return defaultSettings;
    return obj.settings;
}

export {defaultSettings, write, read};