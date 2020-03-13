/* 
    Default chart options
*/
let defaultOptions = {
    tooltips: {
        mode: 'index',
        intersect: false,
    },
    hover: {
        mode: 'nearest',
        intersect: true
    },
    legend: {
        display: false
    },
    scales: {
        x: {
            distribution: 'series',
            offset: true,
            gridLines: {
                display: false,
                drawBorder: false
            }
        },
        y: {
            display: true,
            ticks: {
                beginAtZero: true
            },
            gridLines: {
                display: false,
                drawBorder: true
            }
        }
    }
}; 

/*
let defaultOptions = {
    tooltips: {
        callbacks: {
            label: function (tooltipItem) {
                return tooltipItem.yLabel + " on " + tooltipItem.xLabel;
            }
        }
    },
    scales: {
        xAxes: [{
            
            type: 'time',
            time: {
                displayFormats: {
                    day: 'ddd',
                    hour: 'H'
                },
                unit: 'day',
                tooltipFormat: 'dddd'
            }
        }],
    }
};*/


/* 
    Get a customized chart options based on number of days. 1: today, 7: week, 30: month
*/
export function get(nDays) {
    return defaultOptions;
    let options = defaultOptions;
    if (nDays === 1) {
        //delete (options.tooltips);
        //delete (options.scales.xAxes[0].time.tooltipFormat);
        //options.scales.xAxes[0].time.unit = "hour";
        return options;
    } else if (nDays > 1 && nDays < 8) {
        return defaultOptions;
    } else {
        //options.scales.xAxes[0].time.displayFormats.day = "D";
        return options;
    }
}