import * as settings from '../component/settings.js';
import * as tracker from '../component/tracker.js';
import * as activity from '../component/activity.js';
import { get as getChartOptions } from '../component/chartOptions.js';
import { parseHostname } from '../component/util.js';

// Current hostname string
let _hostname;

// Host object containg host information and alarms
let _host;

// Chart object
let _chart;
let _nDays; 

// Local copy of the global settings
let _settings;

// Usage duration from the current session cache storage
let _sessionCache = {};

// UI references
let UIRangeAlarm = document.getElementById("alarm");
let UIRangeAlarmLabel = document.getElementById("alarmLabel");
let UICheckboxBlockAfter = document.getElementById("blockAfter");
let UIButtonViewDay = document.getElementById("view-day");
let UIButtonViewWeek = document.getElementById("view-week");
let UIButtonViewMonth = document.getElementById("view-month");
let UICanvasChart = document.getElementById('cchart');
let UITitle = document.getElementById("title");
let UISubtitle = document.getElementById("subtitle");
let UIButtonEnableTracking = document.getElementById("enableTracking");
let UIButtonDisableTracking = document.getElementById("disableTracking");

/* 
    Initialize event listeners
*/
UIRangeAlarm.addEventListener("change", onAlarmSettingsChanged);
UIRangeAlarm.addEventListener("input", updateAlarmLabel);
UICheckboxBlockAfter.addEventListener("change", onAlarmSettingsChanged);
UIButtonViewDay.addEventListener("click", onChartSettingsChanged);
UIButtonViewWeek.addEventListener("click", onChartSettingsChanged);
UIButtonViewMonth.addEventListener("click", onChartSettingsChanged);
UIButtonEnableTracking.addEventListener("click", track, true);
UIButtonDisableTracking.addEventListener("click", untrack, false);

/* 
    Add current hostname to the tracking list
*/
async function track(track) {
    tracker.track(_hostname);
    location.reload();
}

/* 
    Remove current hostname from the tracking list
*/
async function untrack(track) {
    tracker.untrack(_hostname);
    activity.clear(_hostname);
    location.reload();
}


/* 
    Handle alarms settings changes
*/
async function onAlarmSettingsChanged() {
    let i = _settings.hosts.findIndex(element => element.hostname === _hostname);
    let limitArray = [
        {
            period: "day",
            threshold: UIRangeAlarm.value * 60 * 1000,
            blockAfter: UICheckboxBlockAfter.checked
        }
    ];

    if (UIRangeAlarm.value === 0) {
        limitArray = [];
    }

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
    browser.runtime.sendMessage({ id: "RESET_ALARM_FOR_HOSTNAME", hostname: _hostname });
}

/* 
   Update Alarm range slider label
*/
async function updateAlarmLabel() {
    let minutes = UIRangeAlarm.value;
    UIRangeAlarmLabel.innerHTML = minutes == 0 ? "set below." : "of <strong>" + minutes + " minutes</strong>.";
    updateChart();
}

/* 
    Prepare the X and Y data for chart
*/
async function prepareGraphData(sessions) {
    let data = { x: [], y: [], yLimit: [], yCompare: [] };
    var end = new Date();
    var start = new Date();

    if (_nDays === 1) {
        start.setHours(0,0,0,0); 
        end.setHours(23,59,59,999); 
        let format = "H";
        let hourlyUsage = await activity.getHourlyUsage(sessions, start, end, format); 
        data.y = hourlyUsage.y; 
        data.x = hourlyUsage.x; 

        start.setDate(start.getDate() - 1);
        end.setDate(start.getDate() - 1);
        let dailyUsagePast = await activity.getHourlyUsage(sessions, start, end, format);
        data.yCompare = dailyUsagePast.y; 
    } else {
        start.setDate(start.getDate() - _nDays);
        let format = _nDays < 14 ? "ddd" : "D";
        let dailyusage = await activity.getDailyUsage(sessions, start, end, format);
        data.y = dailyusage.y;
        data.x = dailyusage.x;

        start.setDate(start.getDate() - _nDays * 2);
        end.setDate(start.getDate() - _nDays);
        let dailyUsagePast = await activity.getDailyUsage(sessions, start, end, format);
        data.yCompare = dailyUsagePast.y; 
    }
    
    data.yLimit = Array.from({ length: data.x.length }, (v, i) => UIRangeAlarm.value);
    return data;
}

/* 
    Update the subtitle based on active view and number of days. 
*/
async function updateSubtitle(data) {
    let tot = data.y.reduce((accumulator, entry) => accumulator + entry, 0);
    let average = Math.round(tot / _nDays);
    let msg = "";

    if (_nDays === 1) {
        msg = "You spent a total of <strong>" + tot + " minutes</strong> on this webpage today.";
    } else {
        msg = "On average you spent <strong>" + average + " minutes/day</strong> on this webpage during the last " + _nDays + " days.";
    }

    UISubtitle.innerHTML = msg;
}

/* 
    Handle active view change
*/
async function onChartSettingsChanged(e) {
    switch (e.srcElement.id) {
        case "view-day":
            _nDays = 1;
            break;
        case "view-month":
            _nDays = 30;
            break;
        default:
            _nDays = 7;
            break;
    }
    updateChart();
    
}

/* 
    High light the button corresponding to the active nDays
*/
async function updateChartSubtitle() {
    let _cp = document.getElementById("chartPeriod").getElementsByClassName("btn-link");

    for (let index = 0; index < _cp.length; index++) {
        const element = _cp[index];
        element.disabled = false;
        element.classList.remove("btn-disabled");
    }

    let selectedId = "view-week";
    switch (_nDays) {
        case 1:
            selectedId = "view-day";
            break;
        case 30:
            selectedId = "view-month";
            break;
        default:
            selectedId = "view-week";
            break;
    }

    let _curr = document.getElementById(selectedId);
    _curr.classList.add("btn-disabled");
    _curr.disabled = true;
}

/* 
    Init chart
*/
async function initChart(data, nDays) {
    let datasets = [{
        "label": "Web time",
        "data": data.y,
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
    }];

    if (true) {
        datasets.push({
            label: "Limit",
            data: data.yLimit,
            type: 'line',
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
            order: 1,
            borderColor: 'rgba(255, 0, 0, 0.3)',
            borderDash: [6],
            borderWidth: 1,
            fill: false,
            radius: 0,
        });
    }

    if(true){
        datasets.push({
            label: "Compare",
            data: data.yCompare,
            type: 'line',
            order: 3,
            borderColor: 'rgba(0, 0, 0, 0.3)',
            borderDash: [6],
            borderWidth: 1,
            fill: false,
            radius: 0,
        });
    }

    let UICanvasChartContext = UICanvasChart.getContext('2d');
    _chart = new Chart(UICanvasChartContext, {
        type: 'bar',
        data: {
            "labels": data.x,
            "datasets": datasets
        },
        options: getChartOptions(nDays)
    });
}

/* 
    Update chart based on the selected active view
*/
async function updateChart() {
    let data = await prepareGraphData(_host.sessions, _nDays);
    _chart.data.datasets[0].data = data.y;
    _chart.data.datasets[1].data = data.yLimit;
    _chart.data.datasets[2].data = data.yCompare;
    _chart.data.labels = data.x;
    _chart.options = getChartOptions(_nDays);
    _chart.update();
    updateSubtitle(data);
    updateChartSubtitle();
}

/* 
    Retrieve host settings for the current hostname
*/
async function initHostSettings() {
    let i = _settings.hosts.findIndex(host => host.hostname === _hostname);
    if (i > -1) {
        if (_settings.hosts[i].limits.length > 0) {
            UIRangeAlarm.value = _settings.hosts[i].limits[0].threshold / 1000 / 60;
            UICheckboxBlockAfter.checked = _settings.hosts[i].limits[0].blockAfter;

        } else {
            UIRangeAlarm.value = 0;
            UICheckboxBlockAfter.checked = false;
        }

        updateAlarmLabel();
    }
}

/* 
    Run initialization once when the popup is shown. 
    Init chart, subtitle, etc.
*/
async function init(tabs) {
    _settings = await settings.get();
    _nDays = _settings.chart.nDays; 
    _hostname = parseHostname(tabs[0].url);

    if (_hostname.length === 0 || _hostname.indexOf(".") === -1)
        window.close();

    if (await tracker.isTracked(_hostname) === false) {
        document.getElementById("schart").hidden = true;
        document.getElementById("stime").hidden = true;
        document.getElementById("strack").hidden = false;
        return;
    } else {
        if (_settings.track.all === false) {
            document.getElementById("suntrack").hidden = false;
        }
    }

    UITitle.textContent = "Time on " + _hostname;
    _host = await activity.get({ hostname: _hostname });
    await initHostSettings();

    
    let data = await prepareGraphData(_host.sessions);
    await initChart(data);
    await updateSubtitle(data);
    await updateChartSubtitle();
}

/* 
    Notify background.js to write current cache to disk. This to get the most recent data.
*/
browser.runtime.sendMessage({ id: "WRITE_CACHE_TO_STORAGE", hostname: _hostname });

/* 
    Retrieve the active tab where the popup is shown
*/
browser.tabs.query({ active: true, currentWindow: true }).then(init);
