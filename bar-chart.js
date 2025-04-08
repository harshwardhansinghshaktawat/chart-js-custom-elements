class MultiAxisChartElement extends HTMLElement {
    constructor() {
        super();
        this.chart = null;
        this.settings = {
            datasets: [],
            showLegend: true,
            legendPosition: 'top',
            showGrid: true,
            showPoints: true,
            pointStyle: 'circle',
            lineTension: 0.4,
            steppedLine: false,
            fillArea: false,
            primaryAxisTitle: 'Values (Left)',
            secondaryAxisTitle: 'Values (Right)',
            enableAnimations: true,
            showDataLabels: false,
            fontFamily: 'Arial',
            fontSize: 12,
            lineWidth: 2,
            pointRadius: 5,
            areaOpacity: 0.2,
            dashedLine: false,
            xAxisColor: '#34495e',
            yAxisColor: '#34495e',
            chartTitle: 'Multi-Axis Line Chart',
            colors: [
                '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6',
                '#1abc9c', '#e67e22', '#34495e', '#8e44ad', '#2c3e50'
            ],
            fillColors: [
                '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6',
                '#1abc9c', '#e67e22', '#34495e', '#8e44ad', '#2c3e50'
            ],
            legends: [
                'Sales', 'Revenue', 'Profit', 'Expenses', 'Growth',
                'Loss', 'Investment', 'Returns', 'Costs', 'Savings'
            ]
        };
    }

    connectedCallback() {
        Object.assign(this.style, {
            display: 'block',
            width: '100%',
            height: '100%',
            minWidth: '250px',
            minHeight: '250px',
            position: 'relative',
            overflow: 'hidden',
            padding: '0',
            margin: '0'
        });

        this.loadChartJs(() => {
            this.renderChart();
        });
    }

    static get observedAttributes() {
        return ['data', 'options'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'data') {
                this.settings.datasets = JSON.parse(newValue);
            } else if (name === 'options') {
                Object.assign(this.settings, JSON.parse(newValue));
            }
            if (this.chart) {
                this.updateChart();
            } else {
                this.renderChart();
            }
        }
    }

    loadChartJs(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
        script.onload = () => callback();
        script.onerror = () => console.error('Failed to load Chart.js');
        document.head.appendChild(script);
    }

    parseDataset(rawData) {
        if (!rawData) return null;
        const entries = rawData.split(';');
        const labels = [];
        const data = [];
        entries.forEach(entry => {
            const [label, value] = entry.split(',');
            if (label && value) {
                labels.push(label);
                data.push(parseFloat(value));
            }
        });
        return { labels, data };
    }

    renderChart() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }

        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            width: '100%',
            height: '100%',
            minWidth: '250px',
            minHeight: '250px',
            position: 'absolute',
            top: '0',
            left: '0',
            margin: '0',
            padding: '0'
        });
        this.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const datasets = this.settings.datasets
            .map((rawData, index) => {
                const parsed = this.parseDataset(rawData);
                if (!parsed) return null;
                const borderColor = this.settings.colors[index % this.settings.colors.length];
                const fillColor = this.settings.fillColors[index % this.settings.fillColors.length];
                const opacityHex = Math.round(this.settings.areaOpacity * 255).toString(16).padStart(2, '0');
                return {
                    label: this.settings.legends[index] || `Dataset ${index + 1}`,
                    data: parsed.data,
                    borderColor: borderColor,
                    backgroundColor: this.settings.fillArea ? `${fillColor}${opacityHex}` : 'transparent',
                    yAxisID: `y${index % 2 === 0 ? '' : 1}`,
                    tension: this.settings.lineTension,
                    stepped: this.settings.steppedLine,
                    pointStyle: this.settings.pointStyle,
                    pointRadius: this.settings.showPoints ? this.settings.pointRadius : 0,
                    borderWidth: this.settings.lineWidth,
                    borderDash: this.settings.dashedLine ? [5, 5] : [],
                    fill: this.settings.fillArea ? 'origin' : false
                };
            })
            .filter(dataset => dataset !== null);

        if (datasets.length === 0) return;

        const uniqueLabels = [...new Set(datasets.flatMap(ds => ds.data.length > 0 ? ds.data.map((_, i) => this.settings.datasets[datasets.indexOf(ds)].split(';')[i].split(',')[0]) : []))];

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: uniqueLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: this.settings.legendPosition === 'top' ? 30 : 10, // Increased padding for top legend
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                plugins: {
                    legend: {
                        display: this.settings.showLegend,
                        position: this.settings.legendPosition,
                        labels: {
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily, weight: 'bold' },
                            color: '#333',
                            padding: 10
                        }
                    },
                    title: { 
                        display: true, 
                        text: this.settings.chartTitle, 
                        font: { size: 20, family: this.settings.fontFamily, weight: 'bold' }, 
                        color: '#2c3e50',
                        padding: { top: 10, bottom: 10 }
                    },
                    datalabels: { 
                        display: this.settings.showDataLabels, 
                        font: { size: this.settings.fontSize, family: this.settings.fontFamily }, 
                        color: '#333' 
                    }
                },
                scales: {
                    x: {
                        title: { 
                            display: true, 
                            text: 'Months', 
                            font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily }, 
                            color: this.settings.xAxisColor 
                        },
                        grid: { display: this.settings.showGrid, color: '#ecf0f1' },
                        ticks: { 
                            color: this.settings.xAxisColor, 
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily } 
                        }
                    },
                    y: {
                        title: { 
                            display: true, 
                            text: this.settings.primaryAxisTitle, 
                            font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily }, 
                            color: this.settings.yAxisColor 
                        },
                        grid: { display: this.settings.showGrid, color: '#ecf0f1' },
                        ticks: { 
                            color: this.settings.yAxisColor, 
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily } 
                        },
                        position: 'left'
                    },
                    y1: {
                        title: { 
                            display: true, 
                            text: this.settings.secondaryAxisTitle, 
                            font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily }, 
                            color: this.settings.yAxisColor 
                        },
                        grid: { display: false },
                        ticks: { 
                            color: this.settings.yAxisColor, 
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily } 
                        },
                        position: 'right'
                    }
                },
                animation: { duration: this.settings.enableAnimations ? 1500 : 0, easing: 'easeInOutQuart' }
            }
        });
    }

    updateChart() {
        if (!this.chart) return;

        const datasets = this.settings.datasets
            .map((rawData, index) => {
                const parsed = this.parseDataset(rawData);
                if (!parsed) return null;
                const borderColor = this.settings.colors[index % this.settings.colors.length];
                const fillColor = this.settings.fillColors[index % this.settings.fillColors.length];
                const opacityHex = Math.round(this.settings.areaOpacity * 255).toString(16).padStart(2, '0');
                return {
                    label: this.settings.legends[index] || `Dataset ${index + 1}`,
                    data: parsed.data,
                    borderColor: borderColor,
                    backgroundColor: this.settings.fillArea ? `${fillColor}${opacityHex}` : 'transparent',
                    yAxisID: `y${index % 2 === 0 ? '' : 1}`,
                    tension: this.settings.lineTension,
                    stepped: this.settings.steppedLine,
                    pointStyle: this.settings.pointStyle,
                    pointRadius: this.settings.showPoints ? this.settings.pointRadius : 0,
                    borderWidth: this.settings.lineWidth,
                    borderDash: this.settings.dashedLine ? [5, 5] : [],
                    fill: this.settings.fillArea ? 'origin' : false
                };
            })
            .filter(dataset => dataset !== null);

        const uniqueLabels = [...new Set(datasets.flatMap(ds => ds.data.length > 0 ? ds.data.map((_, i) => this.settings.datasets[datasets.indexOf(ds)].split(';')[i].split(',')[0]) : []))];

        this.chart.data.labels = uniqueLabels;
        this.chart.data.datasets = datasets;
        this.chart.options = {
            ...this.chart.options,
            layout: {
                padding: {
                    top: this.settings.legendPosition === 'top' ? 30 : 10,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            },
            plugins: {
                ...this.chart.options.plugins,
                legend: {
                    display: this.settings.showLegend,
                    position: this.settings.legendPosition,
                    labels: { 
                        font: { size: this.settings.fontSize, family: this.settings.fontFamily, weight: 'bold' }, 
                        color: '#333',
                        padding: 10
                    }
                },
                title: { 
                    display: true, 
                    text: this.settings.chartTitle, 
                    font: { size: 20, family: this.settings.fontFamily, weight: 'bold' }, 
                    color: '#2c3e50',
                    padding: { top: 10, bottom: 10 }
                },
                datalabels: { display: this.settings.showDataLabels, font: { size: this.settings.fontSize, family: this.settings.fontFamily }, color: '#333' }
            },
            scales: {
                x: {
                    ...this.chart.options.scales.x,
                    title: { display: true, text: 'Months', font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily }, color: this.settings.xAxisColor },
                    grid: { display: this.settings.showGrid },
                    ticks: { color: this.settings.xAxisColor, font: { size: this.settings.fontSize, family: this.settings.fontFamily } }
                },
                y: {
                    ...this.chart.options.scales.y,
                    title: { display: true, text: this.settings.primaryAxisTitle, font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily }, color: this.settings.yAxisColor },
                    grid: { display: this.settings.showGrid },
                    ticks: { color: this.settings.yAxisColor, font: { size: this.settings.fontSize, family: this.settings.fontFamily } }
                },
                y1: {
                    ...this.chart.options.scales.y1,
                    title: { display: true, text: this.settings.secondaryAxisTitle, font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily }, color: this.settings.yAxisColor },
                    ticks: { color: this.settings.yAxisColor, font: { size: this.settings.fontSize, family: this.settings.fontFamily } }
                }
            },
            animation: { duration: this.settings.enableAnimations ? 1500 : 0 }
        };
        this.chart.update();
    }

    disconnectedCallback() {
        if (this.chart) this.chart.destroy();
    }
}

customElements.define('multi-axis-chart', MultiAxisChartElement);

export const STYLE = `
    :host {
        display: block;
        width: 100%;
        height: 100%;
        min-width: 250px;
        min-height: 250px;
        position: relative;
        overflow: hidden;
        padding: 0;
        margin: 0;
    }
    canvas {
        width: 100% !important;
        height: 100% !important;
        min-width: 250px !important;
        min-height: 250px !important;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        background: #fff;
        position: absolute;
        top: 0;
        left: 0;
    }
`;
