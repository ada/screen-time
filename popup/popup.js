import * as settings from '../component/settings.js';
import { isTracked } from '../component/tracker.js';
import { get } from '../component/activity.js';
import { get as getChartOptions } from '../component/chartOptions.js';
import { isSameDay, isSameHour, parseHostname } from '../component/util.js';
import * as alarm from '../component/alarm.js';

let _hostname;
let _host;
let _chart;
let _settings;

let UIRangeAlarm = document.getElementById("alarm");
let UIRangeAlarmLabel = document.getElementById("alarmLabel"); 
let UICheckboxBlockAfter = document.getElementById("blockAfter");
let UIButtonViewDay = document.getElementById("view-day");
let UIButtonViewWeek = document.getElementById("view-week");
let UIButtonViewMonth = document.getElementById("view-month");
let UICanvasChart = document.getElementById('cchart'); 
let UITitle = document.getElementById("title");
let UISubtitle = document.getElementById("subtitle");

function initEventListeners() {
    UIRangeAlarm.addEventListener("change", onAlarmSettingsChanged);
    UIRangeAlarm.addEventListener("input", updateAlarmLabel);
    UICheckboxBlockAfter.addEventListener("change", onAlarmSettingsChanged);
    UIButtonViewDay.addEventListener("click", onChartSettingsChanged);
    UIButtonViewWeek.addEventListener("click", onChartSettingsChanged);
    UIButtonViewMonth.addEventListener("click", onChartSettingsChanged);
}

async function onAlarmSettingsChanged() {
    let i = _settings.hosts.findIndex(element => element.hostname === _hostname);
    let limitArray = [
        {
            period: "day",
            threshold: UIRangeAlarm.value * 60 * 1000,
            blockAfter: UICheckboxBlockAfter.checked
        }
    ]; 

    if (i === -1) {
        _settings.hosts.push(
            {
                hostname: _hostname,
                limits: limitArray,
                accessRules: []
            }
        );
    } else {
        _settings.hosts[i].limits = limitArray
    }

    await settings.set(_settings);
}

function updateAlarmLabel() {
    let minutes = UIRangeAlarm.value;
    UIRangeAlarmLabel.innerHTML = minutes == 0 ? "set below." : "of <strong>" + minutes + " minutes</strong>.";
}

function prepareGraphData(sessions, nDays) {
    var data = { xdata: [], ydata: [] };

    let max = nDays === 1 ? 24 : nDays;
    for (var i = 0; i < max; i++) {
        let date = new Date();
        if (nDays === 1) {
            date.setHours(i);
        } else {
            date.setDate(date.getDate() - i);
        }

        let duration = sessions.reduce(function (accumulator, element) {
            let created = new Date(element.created);
            let sameDay = isSameDay(created, date);

            if (nDays === 1 && sameDay === true && isSameHour(created, date)) {
                return accumulator + element.duration;
            } else if (nDays > 1 && sameDay === true) {
                return accumulator + element.duration;
            }

            return accumulator;
        }, 0);

        let _y = Math.round((duration / 1000) / 60); //convert to minutes
        data.xdata.push(date);
        data.ydata.push(_y);
    }

    return data;
}

function updateSubtitle(data, nDays) {
    let tot = data.ydata.reduce((accumulator, entry) => accumulator + entry, 0);
    let average = Math.round(tot / nDays);
    let msg = "";

    if (nDays === 1) {
        msg = "You spent a total of <strong>" + tot + " minutes</strong> on this webpage today.";
    } else {
        msg = "On average you spent <strong>" + average + " minutes/day</strong> on this webpage during the last " + nDays + " days.";
    }
    
    UISubtitle.innerHTML = msg;
}

function updateChart(data, nDays) {
    _chart.data.datasets[0].data = data.ydata;
    _chart.data.labels = data.xdata;
    _chart.options = getChartOptions(nDays);
    _chart.update();
}

function onChartSettingsChanged(e) {
    let nDays = 7;
    switch (e.srcElement.id) {
        case "view-day":
            nDays = 1;
            break;
        case "view-month":
            nDays = 30;
            break;
        default:
            nDays = 7;
            break;
    }

    let _cp = document.getElementById("chartPeriod").getElementsByClassName("btn-link");
    for (let index = 0; index < _cp.length; index++) {
        const element = _cp[index];
        element.disabled = false;
        element.classList.remove("btn-disabled");
    }
    let _curr = document.getElementById(e.srcElement.id);
    _curr.classList.add("btn-disabled");
    _curr.disabled = true;

    let data = prepareGraphData(_host.sessions, nDays);
    updateChart(data, nDays);
    updateSubtitle(data, nDays);
}

async function initChart(data, nDays) {
    let UICanvasChartContext = UICanvasChart.getContext('2d');
    _chart = new Chart(UICanvasChartContext, {
        type: 'bar',
        data: {
            "labels": data.xdata,
            "datasets": [{
                "label": "data1",
                "data": data.ydata,
                "borderWidth": 0,
                "backgroundColor": function (context) {
                    var index = context.dataIndex;
                    var value = context.dataset.data[index];
                    var min = Math.min(...context.dataset.data);
                    var max = Math.max(...context.dataset.data);
                    var opacity = value / max + 0.1;
                    var color = "rgba(65, 131, 196, " + opacity.toString() + ")";
                    return color;
                },
            }]
        },
        options: getChartOptions(nDays)
    });
}

async function initHostSettings(){
    let i = _settings.hosts.findIndex(host => host.hostname === _hostname);
    if (i > -1) {
        UIRangeAlarm.value = _settings.hosts[i].limits[0].threshold/1000/60;
        UICheckboxBlockAfter.checked = _settings.hosts[i].limits[0].blockAfter;
        updateAlarmLabel();
    }
}

async function init(tabs) {
    _hostname = parseHostname(tabs[0].url);
    if (_hostname.length === 0 || _hostname.indexOf(".") === -1)
        window.close();

    if (await isTracked(_hostname) === false) {
        document.getElementById("schart").hidden = true;
        document.getElementById("stime").hidden = true;
        document.getElementById("strack").hidden = false;
        return;
    }

    UITitle.textContent = "Time on " + _hostname;
    _host = await get({ hostname: _hostname });
    _settings = await settings.get();
    let data = prepareGraphData(_host.sessions, _settings.chart.nDays);
    
    initChart(data, _settings.chart.nDays);
    updateSubtitle(data, _settings.chart.nDays);
    initEventListeners();
    initHostSettings();
}

let tabs = browser.tabs.query({ active: true, currentWindow: true }).then(init);