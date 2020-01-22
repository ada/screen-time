import * as settings from '../component/settings.js';
import { isTracked } from '../component/tracker.js';
import { get } from '../component/activity.js';
import { get as getChartOptions } from '../component/chartOptions.js';
import { isSameDay, isSameHour, parseHostname } from '../component/util.js';

let ctx;
let chart;
let host;
let _settings;
let hostname; 

async function setAlarm(element) {
    let minutes = document.getElementById("alarm").value;
    _settings = await settings.get();
    let i = _settings.hosts.findIndex(host => host.hostname === hostname);
    let limitArray = [
        {
            period: "day",
            threshold: minutes*60*1000,
            blockAfter: true
        }
    ]; 

    if (i === -1) {
        _settings.hosts.push(
            {
                hostname: hostname,
                limits: limitArray,
                activeHours: []
            }
        );
    }else{
        _settings.hosts[i].limits = limitArray
    }

    await settings.set(_settings);
    console.log(_settings);
}

function updateAlarmIndicator() {
    let minutes = document.getElementById("alarm").value;
    document.getElementById("alarmLabel").innerHTML = minutes == 0 ? "set below." : "of <strong>" + minutes + " minutes</strong>.";
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
    configUI('SUBTITLE', {subtitle : msg});
}

function updateChart(data, nDays) {
    chart.data.datasets[0].data = data.ydata;
    chart.data.labels = data.xdata;
    chart.options = getChartOptions(nDays);
    chart.update();
}

function setChartPeriod(e) {
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

    let data = prepareGraphData(host.sessions, nDays);
    updateChart(data, nDays);
    updateSubtitle(data, nDays);
}

function initEventListeners() {
    document.getElementById("alarm").addEventListener("change", setAlarm);
    document.getElementById("alarm").addEventListener("input", updateAlarmIndicator);
    document.getElementById("view-day").addEventListener("click", setChartPeriod);
    document.getElementById("view-week").addEventListener("click", setChartPeriod);
    document.getElementById("view-month").addEventListener("click", setChartPeriod);
}

async function initChart(data, nDays) {
    ctx = document.getElementById('cchart').getContext('2d');
    chart = new Chart(ctx, {
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

async function init(tabs) {
    hostname = parseHostname(tabs[0].url);
    if (hostname.length === 0)
        window.close();

    if (await isTracked(hostname) === false) {
        configUI('HOSTNAME_NOT_TRACKED');
        return;
    }

    configUI("HOSTNAME", {hostname : hostname});
    host = await get({ hostname: hostname });
    _settings = await settings.get();
    let data = prepareGraphData(host.sessions, _settings.chart.nDays);
    initChart(data, _settings.chart.nDays);
    updateSubtitle(data, _settings.chart.nDays);
    initEventListeners();
    initHostSettings();
}

async function initHostSettings(){
    let i = _settings.hosts.findIndex(host => host.hostname === hostname);
    if (i > -1) {
        document.getElementById("alarm").value = _settings.hosts[i].limits[0].threshold/1000/60;
    }
}

function configUI(state, options) {
    switch (state) {
        case 'HOSTNAME_NOT_TRACKED':
            document.getElementById("schart").hidden = true;
            document.getElementById("stime").hidden = true;
            document.getElementById("strack").hidden = false;
            break;
        case 'HOSTNAME':
            document.getElementById("title").textContent = "Time on " + options.hostname;
            break;
        case 'SUBTITLE': 
            document.getElementById("subtitle").innerHTML = options.subtitle;
            break;
        default:
            throw Error("The provided state is not implemented");
    }
}

let tabs = chrome.tabs.query({ active: true, currentWindow: true }).then(init);