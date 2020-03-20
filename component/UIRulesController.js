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
}


function formatTime(time) {
    return time.substring(0, 5);
}

async function list() {
    let html = `<thead><tr><th width="25%">Day</th><th width="25%">Start</th><th width="25%">End</th><th width="25%">Action</th></tr></thead><tbody>`;
    for (let i = 0; i < _rules.length; i++) {
        const r = _rules[i];
        html += `<tr><td>${r.day > -1 ? days[r.day] : "Any"}</td><td>${formatTime(r.start)}</td><td>${formatTime(r.end)}</td><td class="text-center"><button class="buttonDeleteRule btn btn-link" alt="Delete${i}">Delete</button> | <button class="btnEditRule btn btn-link" alt="Edit${i}">Edit</button></td></tr>`;
    }
    html += `</tbody>`;
    UITableRules.innerHTML = html;

    UITableRules.querySelectorAll("button.buttonDeleteRule").forEach(function (el) {
        el.addEventListener("click", del);
    });

    UITableRules.querySelectorAll("button.btnEditRule").forEach(function (el) {
        el.addEventListener("click", edit);
    });

    onRulesChanged();
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
        start: start,
        end: end, 
        allow : true
    };

    if (_operation === "add") {
        _rules.push(rule);
    } else if (_operation === "edit") {
        _rules[_selectedIndex] = rule;
    }

    list();
    _operation = "add";
}


async function del(e) {
    _selectedIndex = parseInt(e.srcElement.attributes.alt.value.replace("Delete", ""));
    _rules.splice(_selectedIndex, 1);
    list();
}

async function edit(e) {
    _operation = "edit";
    _selectedIndex = parseInt(e.srcElement.attributes.alt.value.replace("Edit", ""));
    const rule = _rules[_selectedIndex];
    UIInputRuleDay.value = rule.day;
    UIInputRuleStartTime.value = rule.start;
    UIInputRuleEndTime.value = rule.end;
}

export async function init(hostname) {
    _hostname = hostname;
    UIButtonAddRule.addEventListener("click", onFormSubmit);
    
    let _settings = await settings.get();
    let i = _settings.hosts.findIndex(host => host.hostname === hostname);
    if (i > -1) {
        _rules = _settings.hosts[i].rules; 
        list(); 
    }
}