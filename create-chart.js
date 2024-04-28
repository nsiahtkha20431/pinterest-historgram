const fs = require('fs');
const path = require('path');
const plotly = require('plotly.js-basic-dist');

// Function to load and parse the JSON data
function loadData(filePath) {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
}

// Function to aggregate the data for charting
function prepareChartData(data) {
    const styleCountsByDate = {};

    data.forEach(item => {
        if (!styleCountsByDate[item.createdAt]) {
            styleCountsByDate[item.createdAt] = { 'chic style': 0, 'goth style': 0, 'kawaii style': 0, 'vintage style': 0 };
        }
        styleCountsByDate[item.createdAt][item.style]++;
    });

    return styleCountsByDate;
}

// Function to generate the chart
function generateChart(data) {
    const dates = Object.keys(data).sort();
    const traces = [];

    ['chic style', 'goth style', 'kawaii style', 'vintage style'].forEach(style => {
        const yData = dates.map(date => data[date][style]);
        traces.push({
            x: dates,
            y: yData,
            type: 'scatter',
            mode: 'lines+markers',
            name: style
        });
    });

    const layout = {
        title: 'Pin Styles Over Time',
        xaxis: {
            title: 'Date'
        },
        yaxis: {
            title: 'Number of Pins'
        }
    };

    const graphOptions = {layout: layout, filename: path.join(__dirname, 'style-trends.html'), fileopt: 'overwrite'};
    plotly.plot(traces, graphOptions, function (error, msg) {
        if (error) return console.error(error);
        console.log('Graph saved: ' + msg.url);
    });
}

const filePath = path.join(__dirname, 'metadata.json');
const data = loadData(filePath);
const chartData = prepareChartData(data);
generateChart(chartData);
