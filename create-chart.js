require('dotenv').config();

const fs = require('fs');
const path = require('path');
const plotly = require('plotly')(process.env.PLOTLY_USERNAME, process.env.PLOTLY_API_KEY);

// Function to load and parse the JSON data
function loadData(filePath) {
    try {
        const rawData = fs.readFileSync(filePath);
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

function prepareChartData(data) {
    const styleCountsByDate = {};

    data.forEach(item => {
        if (!styleCountsByDate[item.createdAt]) {
            styleCountsByDate[item.createdAt] = { 
                'chic style': 0, 
                'goth style': 0, 
                'kawaii style': 0, 
                'vintage style': 0,
                'punk style': 0,
                'avante-garde style': 0,
                'grunge style': 0,
                'emo style': 0 
            };
        }
        if (item.style && styleCountsByDate[item.createdAt][item.style] !== undefined) {
            styleCountsByDate[item.createdAt][item.style]++;
        }
    });

    // Sort dates chronologically
    // const sortedData = {};
    // Object.keys(styleCountsByDate)
    //     .sort((a, b) => new Date(a) - new Date(b))
    //     .forEach(date => {
    //         sortedData[date] = styleCountsByDate[date];
    //     });

    // return sortedData;
    return styleCountsByDate;
}

function generateChart(data) {
    return generateSimpleHTMLChart(data);
}

function generateSimpleHTMLChart(data) {
    // Sort dates chronologically
    const dates = Object.keys(data).sort((a, b) => new Date(a) - new Date(b)).reverse();
    const maxCount = Math.max(...dates.flatMap(date => Object.values(data[date])));
    const styles = [
        'chic style', 
        'goth style', 
        'kawaii style', 
        'vintage style',
        'punk style',
        'avante-garde style',
        'grunge style',
        'emo style'
    ];

    const colors = {
        'chic style': '#FF6B6B',
        'goth style': '#4ECDC4',
        'kawaii style': '#45B7D1',
        'vintage style': '#96CEB4',
        'punk style': '#FF4081',
        'avante-garde style': '#7C4DFF',
        'grunge style': '#795548',
        'emo style': '#424242'
    };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Style Trends</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                background-color: #f5f5f5;
            }
            .chart-container {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .bar-group {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                height: 40px;
                padding: 5px 0;
            }
            .bar-group:hover {
                background-color: #f8f9fa;
            }
            .date-label {
                font-weight: bold;
                margin-right: 20px;
                width: 120px;
                text-align: right;
                color: #333;
            }
            .bars-container {
                display: flex;
                align-items: center;
                flex-grow: 1;
                gap: 5px;
            }
            .bar-wrapper {
                display: flex;
                align-items: center;
                margin-right: 10px;
            }
            .bar {
                height: 30px;
                line-height: 30px;
                color: white;
                text-align: center;
                border-radius: 4px;
                transition: all 0.3s ease;
                min-width: 30px;
                font-weight: 500;
                text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
            }
            .bar:hover {
                opacity: 0.8;
                transform: translateY(-2px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .legend {
                margin-top: 30px;
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 4px;
            }
            .legend-item {
                display: flex;
                align-items: center;
                padding: 5px 10px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            .legend-item:hover {
                background-color: #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .legend-color {
                width: 20px;
                height: 20px;
                margin-right: 8px;
                border-radius: 3px;
            }
            h2 {
                text-align: center;
                color: #333;
                margin-bottom: 30px;
                font-size: 24px;
            }
        </style>
    </head>
    <body>
        <div class="chart-container">
            <h2>Style Trends</h2>
            ${dates.map(date => `
                <div class="bar-group">
                    <div class="date-label">${date}</div>
                    <div class="bars-container">
                        ${styles.map(style => {
                            const value = data[date][style];
                            return value > 0 ? `
                                <div class="bar-wrapper">
                                    <div class="bar" 
                                         style="background-color: ${colors[style]}; 
                                                width: ${Math.max((value / maxCount) * 400, 30)}px;">
                                        ${value}
                                    </div>
                                </div>
                            ` : '';
                        }).join('')}
                    </div>
                </div>
            `).join('')}
            
            <div class="legend">
                ${styles.map(style => `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${colors[style]}"></div>
                        <div>${style}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </body>
    </html>
    `;

    const outputPath = path.join(__dirname, 'style-trends.html');
    fs.writeFileSync(outputPath, html);
    return `file://${outputPath}`;
}

module.exports = { loadData, prepareChartData, generateChart };
