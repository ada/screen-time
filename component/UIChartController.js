import * as settings from './settings.js';
import { defaultChartOptions } from './chartOptions.js';
import * as activity from './/activity.js';

let _settings, _nDays, _chart, _host, _hostname;
let UIButtonViewDay = document.getElementById("view-day");
let UIButtonViewWeek = document.getElementById("view-week");
let UIButtonViewMonth = document.getElementById("view-month");
let UICanvasChart = document.getElementById('cchart');
let UITitle = document.getElementById("title");
let UISubtitle = document.getElementById("subtitle");
let UIRangeAlarm = document.getElementById("alarm");

UIButtonViewDay.addEventListener("click", onChartSettingsChanged);
UIButtonViewWeek.addEventListener("click", onChartSettingsChanged);
UIButtonViewMonth.addEventListener("click", onChartSettingsChanged);

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
    Update chart based on the selected active view
*/
async function updateChart() {
    let data = await prepareGraphData(_host.sessions);
    _chart.data.datasets[0].data = data.y;
    _chart.data.datasets[1].data = data.yLimit;
    _chart.data.datasets[2].data = data.yCompare;
    _chart.data.datasets[2].label = getComparisionLabel(_nDays);
    _chart.data.labels = data.x;
    _chart.options = defaultChartOptions;
    _chart.update();
    updateSubtitle(data);
    updateChartSubtitle();
}

/* 
    Init chart
*/
export async function init(hostname) {
    if (hostname === undefined) {
        throw new Error("Hostname is undefined.");
    }

    /* 
        Notify background.js to write current cache to disk. This to get the most recent data.
    */
    browser.runtime.sendMessage({ id: "WRITE_CACHE_TO_STORAGE", hostname: hostname });

    _hostname = hostname;
    _settings = await settings.get();
    _nDays = _settings.chart.nDays;
    _host = await activity.get({ hostname: hostname });
    
    

    _settings = settings;
    UITitle.textContent = "Time on " + hostname;
    let data = await prepareGraphData(_host.sessions);

    let datasets = [{
        label: "Web time",
        order: 2,
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
        order: 0,
        borderColor: 'rgba(255, 0, 0, 0.3)',
        borderDash: [5],
        borderWidth: 1,
        fill: false,
        radius: 0,
    },
    {
        type: 'line',
        label: getComparisionLabel(_nDays),
        data: data.yCompare,
        order: 1,
        borderColor: 'rgba(233, 241, 246, 0)',
        borderWidth: 0,
        fill: true,
        radius: 0,
        backgroundColor: function (context) {
            var index = context.dataIndex;
            var value = context.dataset.data[index];
            var min = Math.min(...context.dataset.data);
            var max = Math.max(...context.dataset.data);
            var opacity = value / max;
            opacity = opacity * 0.5;
            var color = "rgba(118, 89, 255, " + opacity.toString() + ")";
            return color;
        }, 
        backgroundColor: "rgba(118, 89, 255, 0.3)"
    }];

    let UICanvasChartContext = UICanvasChart.getContext('2d');
    _chart = new Chart(UICanvasChartContext, {
        type: 'bar',
        data: {
            labels: data.x,
            datasets: datasets
        },
        options: defaultChartOptions
    });

    await updateSubtitle(data);
    await updateChartSubtitle();
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
    High light the button corresponding to the active nDays
*/
async function updateChartSubtitle() {
    let _cp = document.getElementById("chartViewOptions").getElementsByTagName("button")

    for (let index = 0; index < _cp.length; index++) {
        const element = _cp[index];
        element.disabled = false;
        element.classList.remove("button-active");
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
    _curr.classList.add("button-active");
    _curr.disabled = true;
}


function getComparisionLabel(nDays){
    switch (nDays) {
        case 1:
            return "Yesterday";
        case 7:
            return "Last week";
        case 30:
            return "Last month";
        default:
            return "Comparision";
    }
}