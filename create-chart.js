require('dotenv').config();
const fs = require('fs');
const path = require('path');

const StyleTrendsChart = ({ data }) => {
    const [chartData, setChartData] = React.useState([]);
    const [yearlyTotals, setYearlyTotals] = React.useState([]);
    const [activePoint, setActivePoint] = React.useState(null);
  
    React.useEffect(() => {
      const processData = () => {
        const { styleCountsByDate, yearlyStats } = data;
        const chartData = Object.entries(styleCountsByDate).map(([date, styles]) => ({
          date,
          ...styles,
        }));
  
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
  
    const styles = Object.keys(colors);
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 80, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
  
    const getX = (index) => {
      return (index / (chartData.length - 1)) * chartWidth;
    };
  
    const getY = (value, maxValue) => {
      return chartHeight - (value / maxValue) * chartHeight;
    };
  
    if (chartData.length === 0) return null;
  
    const maxValue = Math.max(
      ...chartData.flatMap(d => styles.map(style => d[style]))
    );
  
    const generatePath = (style) => {
      return chartData.map((d, i) => {
        const x = getX(i);
        const y = getY(d[style], maxValue);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
    };
  
    const handleMouseMove = (e, date, values) => {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setActivePoint({
        date,
        values,
        x: x + margin.left,
        y
      });
    };
  
    const handleMouseLeave = () => {
      setActivePoint(null);
    };
  
    return (
      <div className="space-y-8">
        <div className="relative bg-white p-4 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Style Evolution Over Time</h2>
          <svg width={width} height={height}>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Grid lines */}
              {[...Array(6)].map((_, i) => {
                const y = (chartHeight / 5) * i;
                return (
                  <g key={i}>
                    <line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={-10}
                      y={y}
                      textAnchor="end"
                      alignmentBaseline="middle"
                      className="text-xs text-gray-500"
                    >
                      {Math.round(maxValue - (maxValue / 5) * i)}
                    </text>
                  </g>
                );
              })}
  
              {/* X-axis labels */}
              {chartData.map((d, i) => (
                <text
                  key={i}
                  x={getX(i)}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs text-gray-500"
                >
                  {d.date}
                </text>
              ))}
  
              {/* Lines */}
              {styles.map(style => (
                <path
                  key={style}
                  d={generatePath(style)}
                  fill="none"
                  stroke={colors[style]}
                  strokeWidth={2}
                />
              ))}
  
              {/* Data points */}
              {styles.map(style => 
                chartData.map((d, i) => (
                  <circle
                    key={`${style}-${i}`}
                    cx={getX(i)}
                    cy={getY(d[style], maxValue)}
                    r={4}
                    fill={colors[style]}
                    onMouseMove={(e) => handleMouseMove(e, d.date, d)}
                    onMouseLeave={handleMouseLeave}
                    className="cursor-pointer hover:r-6 transition-all"
                  />
                ))
              )}
            </g>
          </svg>
  
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {styles.map(style => (
              <div key={style} className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: colors[style] }}
                />
                <span className="text-sm text-gray-700">{style}</span>
              </div>
            ))}
          </div>
  
          {/* Tooltip */}
          {activePoint && (
            <div
              className="absolute bg-white p-2 rounded shadow-lg text-sm"
              style={{
                left: `${activePoint.x}px`,
                top: `${activePoint.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="font-bold">{activePoint.date}</div>
              {styles.map(style => 
                activePoint.values[style] > 0 && (
                  <div key={style} className="flex items-center">
                    <div
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: colors[style] }}
                    />
                    <span>{style}: {activePoint.values[style]}</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
  
        {/* Yearly Summary */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Yearly Style Summary</h2>
          <div className="grid gap-4">
            {yearlyTotals.map(({ year, total, dominantStyle, percentage }) => (
              <div
                key={year}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="font-medium">{year}</div>
                <div className="text-sm text-gray-600">
                  Total pins: {total}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors[dominantStyle] }}
                  />
                  <div>
                    Dominant: {dominantStyle} ({percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  export default StyleTrendsChart;

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

function generateChart(data) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Style Trends</title>
        <script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body>
        <div id="root"></div>
        <script>
            ${StyleTrendsChart}
            
            ReactDOM.render(
                React.createElement(StyleTrendsChart, { data: ${JSON.stringify(data)} }),
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