const fs = require('fs');
const path = require('path');

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
        if (item.style) {
            styleCountsByDate[item.createdAt][item.style]++;
        }
    });

    const yearlyStats = {};
    Object.entries(styleCountsByDate).forEach(([date, styles]) => {
        const year = date.split(' ')[2];
        const total = Object.values(styles).reduce((sum, count) => sum + count, 0);
        const dominantStyle = Object.entries(styles).reduce((max, [style, count]) => 
            count > max.count ? { style, count } : max, 
            { style: '', count: -1 }
        );

        if (!yearlyStats[year]) {
            yearlyStats[year] = { total: 0, dominantStyle: '', percentage: 0 };
        }
        yearlyStats[year].total += total;
        if (dominantStyle.count > yearlyStats[year].percentage) {
            yearlyStats[year].dominantStyle = dominantStyle.style;
            yearlyStats[year].percentage = ((dominantStyle.count / total) * 100).toFixed(1);
        }
    });

    return { styleCountsByDate, yearlyStats };
}

const StyleTrendsChart = `
function StyleTrendsChart({ data }) {
    const [chartData, setChartData] = React.useState([]);
    const [yearlyTotals, setYearlyTotals] = React.useState([]);
    const [activePoint, setActivePoint] = React.useState(null);
    const [activeStyles, setActiveStyles] = React.useState([]);
    const [activeYear, setActiveYear] = React.useState(null);
    const [yearlyStyleBreakdowns, setYearlyStyleBreakdowns] = React.useState({});

    React.useEffect(() => {
        const processData = () => {
            const { styleCountsByDate, yearlyStats } = data;
            const chartData = Object.entries(styleCountsByDate).map(([date, styles]) => ({
                date,
                ...styles,
            }));

            // Determine which styles actually have data
            const allStyles = new Set();
            chartData.forEach(entry => {
                Object.entries(entry).forEach(([key, value]) => {
                    if (key !== 'date' && value > 0) {
                        allStyles.add(key);
                    }
                });
            });
            setActiveStyles(Array.from(allStyles));

            // Calculate detailed yearly breakdowns
            const breakdowns = {};
            Object.entries(styleCountsByDate).forEach(([date, styles]) => {
                const year = date.split(' ')[2];
                if (!breakdowns[year]) {
                    breakdowns[year] = {};
                    Object.keys(styles).forEach(style => {
                        if (allStyles.has(style)) {  // Only track styles that exist in data
                            breakdowns[year][style] = 0;
                        }
                    });
                }
                Object.entries(styles).forEach(([style, count]) => {
                    if (style !== 'date' && allStyles.has(style)) {
                        breakdowns[year][style] = (breakdowns[year][style] || 0) + count;
                    }
                });
            });

            // Calculate percentages for each style in each year
            Object.keys(breakdowns).forEach(year => {
                const total = Object.values(breakdowns[year]).reduce((sum, count) => sum + count, 0);
                const stylePercentages = {};
                Object.entries(breakdowns[year]).forEach(([style, count]) => {
                    if (count > 0) {  // Only include styles with non-zero counts
                        stylePercentages[style] = {
                            count,
                            percentage: ((count / total) * 100).toFixed(1)
                        };
                    }
                });
                breakdowns[year] = stylePercentages;
            });

            setYearlyStyleBreakdowns(breakdowns);

            const totals = Object.entries(yearlyStats).map(([year, stats]) => ({
                year,
                total: stats.total,
                dominantStyle: stats.dominantStyle,
                percentage: stats.percentage
            }));

            setChartData(chartData.sort((a, b) => new Date(a.date) - new Date(b.date)));
            setYearlyTotals(totals);
        };

        processData();
    }, [data]);

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

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 80, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const getX = (index) => (index / (chartData.length - 1)) * chartWidth;
    const getY = (value, maxValue) => chartHeight - (value / maxValue) * chartHeight;

    const maxValue = chartData.length > 0 ? 
        Math.max(...chartData.flatMap(d => activeStyles.map(style => d[style]))) : 0;

    const generatePath = (style) => {
        return chartData.map((d, i) => {
            const x = getX(i);
            const y = getY(d[style], maxValue);
            return \`\${i === 0 ? 'M' : 'L'} \${x} \${y}\`;
        }).join(' ');
    };

    return React.createElement('div', { 
        className: 'w-full space-y-8 p-4'
    }, [
        React.createElement('div', { 
            key: 'chart-section',
            className: 'w-full bg-gray-800 rounded-lg shadow p-4'
        }, [
            React.createElement('h2', { 
                key: 'title',
                className: 'text-2xl font-bold mb-4 text-pink-500'
            }, 'Style Evolution'),
            React.createElement('div', { 
                key: 'chart-container',
                className: 'relative h-96'
            }, [
                React.createElement('svg', { 
                    width: width,
                    height: height,
                    className: 'overflow-visible'
                }, [
                    React.createElement('g', {
                        transform: \`translate(\${margin.left}, \${margin.top})\`
                    }, [
                        ...[...Array(6)].map((_, i) => {
                            const y = (chartHeight / 5) * i;
                            const value = Math.round(maxValue - (maxValue / 5) * i);
                            return React.createElement('g', { key: \`grid-\${i}\` }, [
                                React.createElement('line', {
                                    key: \`grid-line-\${i}\`,
                                    x1: 0,
                                    y1: y,
                                    x2: chartWidth,
                                    y2: y,
                                    stroke: '#4a5568',
                                    strokeDasharray: '4,4'
                                }),
                                React.createElement('text', {
                                    key: \`grid-label-\${i}\`,
                                    x: -10,
                                    y: y,
                                    textAnchor: 'end',
                                    alignmentBaseline: 'middle',
                                    className: 'text-xs text-pink-500'
                                }, value)
                            ]);
                        }),

                        ...chartData.map((d, i) => 
                            React.createElement('text', {
                                key: \`x-label-\${i}\`,
                                x: getX(i),
                                y: chartHeight + 20,
                                textAnchor: 'middle',
                                className: 'text-xs text-pink-500'
                            }, d.date)
                        ),

                        ...activeStyles.map(style => 
                            React.createElement('path', {
                                key: \`line-\${style}\`,
                                d: generatePath(style),
                                stroke: colors[style],
                                fill: 'none',
                                strokeWidth: 2
                            })
                        ),

                        ...activeStyles.flatMap(style => 
                            chartData.map((d, i) => 
                                React.createElement('circle', {
                                    key: \`point-\${style}-\${i}\`,
                                    cx: getX(i),
                                    cy: getY(d[style], maxValue),
                                    r: 4,
                                    fill: colors[style],
                                    onMouseEnter: () => {
                                        setActivePoint({
                                            date: d.date,
                                            style: style,
                                            value: d[style],
                                            x: getX(i),
                                            y: getY(d[style], maxValue)
                                        });
                                    },
                                    onMouseLeave: () => setActivePoint(null),
                                    className: 'cursor-pointer hover:r-6 transition-all'
                                })
                            )
                        )
                    ])
                ]),

                activePoint && React.createElement('div', {
                    className: 'absolute bg-gray-700 p-2 rounded shadow-lg text-sm text-pink-500',
                    style: {
                        left: \`\${activePoint.x + margin.left}px\`,
                        top: \`\${activePoint.y + margin.top - 40}px\`,
                        transform: 'translate(-50%, -50%)'
                    }
                }, [
                    React.createElement('div', { className: 'font-bold' }, activePoint.date),
                    React.createElement('div', {}, 
                        \`\${activePoint.style}: \${activePoint.value}\`
                    )
                ])
            ]),

            React.createElement('div', { 
                key: 'legend',
                className: 'flex flex-wrap gap-4 mt-4'
            }, activeStyles.map(style => 
                React.createElement('div', { 
                    key: \`legend-\${style}\`,
                    className: 'flex items-center text-gray-300'
                }, [
                    React.createElement('div', {
                        key: \`color-\${style}\`,
                        className: 'w-4 h-4 rounded-full mr-2',
                        style: { backgroundColor: colors[style] }
                    }),
                    React.createElement('span', { key: \`label-\${style}\` }, style)
                ])
            ))
        ]),

        React.createElement('div', { 
            key: 'summary-section',
            className: 'bg-gray-800 rounded-lg shadow p-4'
        }, [
            React.createElement('h2', { 
                key: 'summary-title',
                className: 'text-2xl font-bold mb-4 text-pink-500'
            }, 'Style Summary'),
            React.createElement('div', { 
                key: 'summary-content',
                className: 'space-y-4'
            }, yearlyTotals.map(({ year, total }) =>
                React.createElement('div', {
                    key: \`year-\${year}\`,
                    className: 'bg-gray-700 rounded-lg transition-all duration-200 hover:bg-gray-600',
                    onMouseEnter: () => setActiveYear(year),
                    onMouseLeave: () => setActiveYear(null)
                }, [
                    React.createElement('div', {
                        className: 'p-4 border border-gray-600 rounded-lg'
                    }, [
                        React.createElement('div', { 
                            className: 'flex items-center justify-between mb-2'
                        }, [
                            React.createElement('div', { 
                                className: 'font-medium text-pink-500'
                            }, year),
                            React.createElement('div', { 
                                className: 'text-pink-500'
                            }, \`Total Pins: \${total}\`)
                        ]),
                        activeYear === year && yearlyStyleBreakdowns[year] && 
                        React.createElement('div', {
                            className: 'mt-4 space-y-2'
                        }, 
                            Object.entries(yearlyStyleBreakdowns[year])
                                .sort(([, a], [, b]) => parseFloat(b.percentage) - parseFloat(a.percentage))
                                .map(([style, data]) =>
                                    React.createElement('div', {
                                        key: \`\${year}-\${style}\`,
                                        className: 'flex items-center justify-between text-sm'
                                    }, [
                                        React.createElement('div', {
                                            className: 'flex items-center gap-2'
                                        }, [
                                            React.createElement('div', {
                                                className: 'w-3 h-3 rounded-full',
                                                style: { backgroundColor: colors[style] }
                                            }),
                                            React.createElement('span', {
                                                className: 'text-gray-300'
                                            }, style)
                                        ]),
                                        React.createElement('div', {
                                            className: 'text-gray-400'
                                        }, \`\${data.percentage}% (\${data.count} pins)\`)
                                    ])
                                )
                        )
                    ])
                ])
            ))
        ])
    ]);
}`;

function generateChart(data) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Style Trends</title>
        <script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
            body {
                background-color: #111827;  /* matches Tailwind's gray-900 */
                color: #e5e5e5;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
            }
            #root {
                background-color: #111827;
                width: 100%;
                max-width: 900px;
            }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script>
            ${StyleTrendsChart}
            
            const data = ${JSON.stringify(data)};
            ReactDOM.render(
                React.createElement(StyleTrendsChart, { data: data }),
                document.getElementById('root')
            );
        </script>
    </body>
    </html>`;

    const outputPath = path.join(__dirname, 'style-trends.html');
    fs.writeFileSync(outputPath, html);
    return `file://${outputPath}`;
}

module.exports = { loadData, prepareChartData, generateChart };