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
let _isTracked;

// Local copy of the global settings
let _settings;

// Usage duration from the current session cache storage
let _sessionCache = {};

// UI references
let UIRangeAlarm = document.getElementById("alarm");
let UIRangeAlarmLabel = document.getElementById("alarmLabel");
let UIButtonViewDay = document.getElementById("view-day");
let UIButtonViewWeek = document.getElementById("view-week");
let UIButtonViewMonth = document.getElementById("view-month");
let UICanvasChart = document.getElementById('cchart');
let UITitle = document.getElementById("title");
let UISubtitle = document.getElementById("subtitle");
let UIButtonEnableTracking = document.getElementById("enableTracking");
let UIButtonDisableTracking = document.getElementById("disableTracking");
let UIButtonViewChart = document.getElementById("view-chart");
let UIButtonViewAlarm = document.getElementById("view-alarm");
let UIButtonViewOptions = document.getElementById("view-options");
let UIButtonViewSettings = document.getElementById("view-settings");

/* 
    Initialize event listeners
*/
UIRangeAlarm.addEventListener("change", onAlarmSettingsChanged);
UIRangeAlarm.addEventListener("input", updateAlarmLabel);
UIButtonViewDay.addEventListener("click", onChartSettingsChanged);
UIButtonViewWeek.addEventListener("click", onChartSettingsChanged);
UIButtonViewMonth.addEventListener("click", onChartSettingsChanged);
UIButtonEnableTracking.addEventListener("click", track, true);
UIButtonDisableTracking.addEventListener("click", untrack, false);
UIButtonViewChart.addEventListener("click", onTabNavigation);
UIButtonViewAlarm.addEventListener("click", onTabNavigation);
UIButtonViewOptions.addEventListener("click", onTabNavigation);
UIButtonViewSettings.addEventListener("click", openSettings);

/* 
    Open global extensions options
*/
async function openSettings(e) {
    browser.runtime.openOptionsPage();
}

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
    let limitArray = [{
            period: "day",
            threshold: UIRangeAlarm.value * 60 * 1000,
            blockAfter: false
        }];

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
    UIRangeAlarmLabel.innerHTML = UIRangeAlarm.value > 0 ? UIRangeAlarm.value + " minutes" : "";
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
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        let format = "H";
        let hourlyUsage = await activity.getHourlyUsage(sessions, start, end, format);
        data.y = hourlyUsage.y;
        data.x = hourlyUsage.x;

        start.setDate(start.getDate() - 2);
        end.setDate(end.getDate() - 1);
        let dailyUsagePast = await activity.getHourlyUsage(sessions, start, end, format);
        data.yCompare = dailyUsagePast.y;
    } else {
        start.setDate(start.getDate() - _nDays + 1);
        start.setHours(0, 0, 0, 0);

        let format = _nDays < 14 ? "ddd" : "D";
        let dailyusage = await activity.getDailyUsage(sessions, start, end, format);
        data.y = dailyusage.y;
        data.x = dailyusage.x;

        start.setDate(start.getDate() - _nDays * 2);
        end.setDate(end.getDate() - _nDays);
        console.log(start);
        console.log(end);
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
}


/* 
    High light the button corresponding to the active nDays
*/
async function updateChartSubtitle() {
    let _cp = document.getElementById("chartViewOptions").getElementsByClassName("btn-link");

    for (let index = 0; index < _cp.length; index++) {
        const element = _cp[index];
        element.disabled = false;
        element.classList.remove("btn-active");
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
    _curr.classList.add("btn-active");
    _curr.disabled = true;
}

/* 
    Init chart
*/
async function initChart(data, nDays) {
    let datasets = [{
        label: "Web time",
        order: 0,
        data: data.y,
        borderWidth: 0,
        backgroundColor: function (context) {
            var index = context.dataIndex;
            var value = context.dataset.data[index];
            var min = Math.min(...context.dataset.data);
            var max = Math.max(...context.dataset.data);
            var opacity = value / max + 0.1;
            var color = "rgba(32, 165, 250, " + opacity.toString() + ")";
            return color;
        }
    },
    {
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
    },
    {
        label: "Compare",
        data: data.yCompare,
        type: 'line',
        order: 2,
        borderColor: 'rgba(233, 241, 246, 1)',
        borderWidth: 1,
        backgroundColor: 'rgba(233, 241, 246, 1)',
        fill: true,
        radius: 0,
    }];

    let UICanvasChartContext = UICanvasChart.getContext('2d');
    _chart = new Chart(UICanvasChartContext, {
        type: 'bar',
        data: {
            labels: data.x,
            datasets: datasets
        },
        options: getChartOptions(nDays)
    });
}

/* 
    Update chart based on the selected active view
*/
async function updateChart() {
    let data = await prepareGraphData(_host.sessions);
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
        } else {
            UIRangeAlarm.value = 0;
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

    if (_hostname.length === 0 || _hostname.indexOf(".") === -1) {
        window.close();
    }

    _isTracked = await tracker.isTracked(_hostname);

    if (_isTracked) {
        UIButtonViewChart.click();
        UITitle.textContent = "Time on " + _hostname;
        _host = await activity.get({ hostname: _hostname });
        let data = await prepareGraphData(_host.sessions);
        await initHostSettings();
        await initChart(data);
        await updateSubtitle(data);
        await updateChartSubtitle();

        if(_settings.track.all === true){
            var element = document.getElementById("view-options"); 
            element.parentElement.removeChild(element);
        } else{
            var element = document.getElementById("enableTracking"); 
            element.parentElement.removeChild(element);
        }

    } else {
        UIButtonViewOptions.click();
        var elementsToRemove = ["disableTracking", "view-chart", "view-alarm"]; 
        
        for (let i = 0; i < elementsToRemove.length; i++) {
            const elementId = elementsToRemove[i];
            var element = document.getElementById(elementId); 
            element.parentElement.removeChild(element);
        }
    }
}

/* 
    Notify background.js to write current cache to disk. This to get the most recent data.
*/
browser.runtime.sendMessage({ id: "WRITE_CACHE_TO_STORAGE", hostname: _hostname });

/* 
    Retrieve the active tab where the popup is shown
*/
browser.tabs.query({ active: true, currentWindow: true }).then(init);
