/* 
    Default chart options
*/
export var defaultChartOptions = {
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