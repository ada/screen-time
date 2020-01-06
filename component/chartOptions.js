let defaultOptions = {
    legend: {
        display: false
    },
    tooltips: {
        callbacks: {
            label: function (tooltipItem) {
                return tooltipItem.yLabel + " on " + tooltipItem.xLabel;
            }
        }
    },
    scales: {
        xAxes: [{
            offset: true,
            type: 'time',
            time: {
                displayFormats: {
                    day: 'ddd',
                    hour: 'H'
                },
                unit: 'day',
                tooltipFormat: 'dddd'
            },
            gridLines: {
                display: false,
                drawBorder: false
            }
        }],
        yAxes: [{
            ticks: {
                min: 0
            },
            gridLines: {
                display: false
            }
        }]
    }
};

function get(nDays){
    let options = defaultOptions; 
    if (nDays === 1) {
        delete(options.tooltips);
        options.scales.xAxes[0].time.unit = "hour";
        delete(options.scales.xAxes[0].time.tooltipFormat);
        return options; 
    } else if (nDays > 1 && nDays <= 7) {
        return options; 
    }else{
        options.scales.xAxes[0].time.displayFormats.day = "D";
        return options;
    }
}

export {get}