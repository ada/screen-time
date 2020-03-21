import * as settings from './settings.js';

let _hostname;
let _rules = [];
let _operation = "add";
let _selectedIndex = -1;
const days = ["Sunday", "Monday", "Teusday", "Wednesday", "Thursday", "Friday", "Saturday"];

let UIButtonAddRule = document.getElementById("ruleFormSubmit");
let UIInputRuleEndTime = document.getElementById("ruleTimeEnd");
let UIInputRuleStartTime = document.getElementById("ruleTimeStart");
let UIInputRuleDay = document.getElementById("ruleDay");
let UITableRules = document.getElementById("rulesTable");
let UITabItemAddRule = document.getElementById("button-add-rule");
let UIButtonCancelForm = document.getElementById("ruleFormCancel"); 

async function onRulesChanged() {
    let _settings = await settings.get(); 
    let index = _settings.hosts.findIndex(element => element.hostname === _hostname);

    if (index === -1) {
        _settings.hosts.push(
            {
                hostname: _hostname,
                alarms: [],
                rules: _rules
            }
        );
    } else {
        _settings.hosts[index].rules = _rules
    }

    await settings.set(_settings);
    browser.runtime.sendMessage({ id: "HOST_SETTINGS_CHANGED", hostname: _hostname });
}

async function list() {
    let html = "";

    if ( _rules.length === 0) {
        html = `<p class="text-center text-gray text-lead">No rules have been set for this hostname. To create a new rule, click the "+" button.</p> `;
    } else {
        html = `<table  class="table-bordered table-stripped"><thead><tr><th width="25%">Day</th><th width="25%">Start</th><th width="25%">End</th><th width="25%">Action</th></tr></thead><tbody>`;
    
        for (let i = 0; i < _rules.length; i++) {
            const r = _rules[i];
            html += `<tr><td>${r.day > -1 ? days[r.day] : "Any"}</td><td>${r.start}</td><td>${r.end}</td><td><button type="button" class="btn btn-link btnEditRule" alt="Edit${i}">Edit</button> | <button type="button" class="btn btn-link buttonDeleteRule" alt="Delete${i}">Delete</button></td></tr>`;
        }

        html += `</tbody></table>`;
    }

    
    UITableRules.innerHTML = html;

    UITableRules.querySelectorAll("button.buttonDeleteRule").forEach(function (el) {
        el.addEventListener("click", del);
    });

    UITableRules.querySelectorAll("button.btnEditRule").forEach(function (el) {
        el.addEventListener("click", edit);
    });
}

async function onFormSubmit(e) {
    e.preventDefault();
    const start = UIInputRuleStartTime.value;
    const end = UIInputRuleEndTime.value;

    if (start === "" || end === "" || start >= end) {
        return;
    }

    let rule = {
        day: UIInputRuleDay.value,
        start: start.replace(".000",""),
        end: end.replace(".000",""), 
        allow : true
    };

    if (_operation === "add") {
        _rules.push(rule);
    } else if (_operation === "edit") {
        _rules[_selectedIndex] = rule;
    }

    list();
    onRulesChanged();
    hideForm();
    _operation = "add";
}


async function del(e) {
    _selectedIndex = parseInt(e.srcElement.attributes.alt.value.replace("Delete", ""));
    _rules.splice(_selectedIndex, 1);
    list();
    onRulesChanged();
}

async function edit(e) {
    _operation = "edit";
    _selectedIndex = parseInt(e.srcElement.attributes.alt.value.replace("Edit", ""));
    const rule = _rules[_selectedIndex];
    UIInputRuleDay.value = rule.day;
    UIInputRuleStartTime.value = rule.start;
    UIInputRuleEndTime.value = rule.end;
    showForm();
}

function showForm(){
    document.getElementById("ruleForm").hidden = false; 
    document.getElementById("rulesTable").hidden = true; 
}

function hideForm(){
    _operation = "add"; 
    document.getElementById("ruleForm").hidden = true; 
    document.getElementById("rulesTable").hidden = false; 
}

export async function init(hostname) {
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }
    
    _hostname = hostname;
    UIButtonAddRule.addEventListener("click", onFormSubmit);
    UITabItemAddRule.addEventListener("click", showForm);
    UIButtonCancelForm.addEventListener("click", hideForm); 
    
    let _settings = await settings.get();
    let index = _settings.hosts.findIndex(host => host.hostname === hostname);

    if (index > -1) {
        _rules = _settings.hosts[index].rules;   
    }

    list(); 
}



