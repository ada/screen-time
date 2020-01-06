import { parseHostname } from '../component/parser.js';
import { isTracked } from '../component/tracker.js';
import { get } from '../component/activity.js';
import { get as getChartOptions } from '../component/chartOptions.js';
var alarmInputChangeListener; 
var alarmInputListener; 
var daysInputChangeListener; 
var daysInputListener; 
var timer; 
var nDays = 1;
/*function listenForClicks() {
    document.addEventListener("click", (e) => {
        console.log(e.target.id);
    });
}

listenForClicks();
*/
function plot(activityData) {
    var xdata = [];
    var ydata = [];

    activityData.forEach(element => {
        xdata.push(element.x);
        ydata.push(element.y);
    });

    var data = {
        "labels": xdata,
        "datasets": [{
            "label": "data1",
            "data": ydata,
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
    };

    let ctx = document.getElementById('cchart').getContext('2d');
    let chart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: getChartOptions(nDays)
    });
}

function setAlarm(element) {
    let minutes = document.getElementById("alarm").value;
    document.getElementById("alarmLabel").textContent = minutes == 0 ? "Off" : minutes + " minutes";
}

function updateAlarmIndicator() {
    let minutes = document.getElementById("alarm").value;
    document.getElementById("alarmLabel").innerHTML = minutes == 0 ? "set below." : "of <strong>" + minutes + " minutes</strong>.";
}


function updateGraph(){
    let a = document.getElementById("test").value;
    console.log(a);
}

function isSameHour(created, date){
    return created.getHours() == date.getHours();
}
function isSameDay(created, date){
    return created.getFullYear() == date.getFullYear() &&
                created.getMonth() == date.getMonth() &&
                created.getDate() == date.getDate();
}

function prepareGraphData(data, nDays) {
    let res = [];
    let max = nDays === 1 ? 24:nDays;
    for (var i = 0; i < max; i++) {
        let date = new Date();
        if (nDays === 1) {
            date.setHours(i);
        }else{
            date.setDate(date.getDate() - i);
        }
        
        let duration = data.reduce(function (accumulator, element) {
            let created = new Date(element.created);
            let sameDay = isSameDay(created, date); 
            
            if (nDays === 1 && sameDay === true && isSameHour(created, date)) {
                return accumulator + element.duration;
            }else if(nDays > 1 && sameDay === true){
                return accumulator + element.duration;
            }

            return accumulator;
        }, 0);
        res.push({ "x": date, "y": Math.round(duration / 60) });
    }
    return res;
}

async function configureUIForHostname(hostname) {
    if (hostname.length === 0) {
        //window.close();
        //throw new Error("Empty hostname");
    }

    document.getElementById("title").textContent = "Time on " + hostname;

    if (await isTracked(hostname) === false) {
        document.getElementById("strack").hidden = false;
        document.getElementById("schart").hidden = true;
        document.getElementById("stime").hidden = true;
    }
}




function initEventListeners(){
    alarmInputChangeListener = document.getElementById("alarm").addEventListener("change", setAlarm);
    alarmInputListener = document.getElementById("alarm").addEventListener("input", updateAlarmIndicator);
}

async function init(tabs) {
    try {
        let hostname = parseHostname(tabs[0].url);
        await configureUIForHostname(hostname);
        let entry = await get({ hostname: hostname });
        if (entry && entry.sessions) {
            let graphData = prepareGraphData(entry.sessions, nDays);
            let tot = graphData.reduce((accumulator, entry) => accumulator + entry.y, 0);
            let dailyAverage = Math.ceil(tot / nDays);
            document.getElementById("subtitle").innerHTML = "On average you spent <strong>" + dailyAverage + " minutes per day</strong> on this webpage during the last week.";
            plot(graphData);
        }

        initEventListeners();
    } catch (error) {
        console.error(error);
    }
}

function onError(error){
    console.error(error);
}

let tabs = browser.tabs.query({ active: true, currentWindow: true }).then(init).catch(onError);