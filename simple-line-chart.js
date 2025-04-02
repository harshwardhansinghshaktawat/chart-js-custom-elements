class SimpleLineChartElement extends HTMLElement {
    constructor() {
        super();
        this.chart = null;
        this.settings = {
            datasets: [],
            showGrid: true,
            gridLineWidth: 1,
            gridLineColor: '#ecf0f1',
            showPoints: true,
            pointStyle: 'circle',
            lineTension: 0.4,
            steppedLine: false,
            fillArea: false,
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
            chartTitle: 'Simple Line Chart',
            chartHeight: 400,
            xAxisTitle: 'Months',
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
            height: `${this.settings.chartHeight}px`,
            position: 'relative',
            overflow: 'hidden',
            padding: '0',
            margin: '0',
            background: '#f0f0f0' // Light background to see if element renders
        });

        this.loadChartJs(() => {
            console.log('Chart.js loaded, rendering chart');
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
                const newOptions = JSON.parse(newValue);
                Object.assign(this.settings, newOptions);
                this.style.height = `${this.settings.chartHeight}px`;
            }
            if (this.chart) {
                console.log('Updating chart with new attributes');
                this.updateChart();
            } else {
                console.log('Rendering chart with new attributes');
                this.renderChart();
            }
        }
    }

    loadChartJs(callback) {
        if (window.Chart) {
            console.log('Chart.js already loaded');
            callback();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
        script.onload = () => {
            console.log('Chart.js script loaded successfully');
            callback();
        };
        script.onerror = () => console.error('Failed to load Chart.js from CDN');
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
        console.log('Attempting to render chart');
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }

        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            margin: '0',
            padding: '0'
        });
        this.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Failed to get 2D context for canvas');
            return;
        }

        const rect = this.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.error('Custom element has zero size:', rect);
            return;
        }
        canvas.width = rect.width;
        canvas.height = rect.height;
        console.log('Canvas size set to:', canvas.width, 'x', canvas.height);

        const datasets = this.settings.datasets
            .map((rawData, index) => {
                const parsed = this.parseDataset(rawData);
                if (!parsed) return null;
                const borderColor = this.settings.colors[index % this.settings.colors.length] || '#000000';
                const fillColor = this.settings.fillColors[index % this.settings.fillColors.length] || borderColor;
                const opacityHex = Math.round(this.settings.areaOpacity * 255).toString(16).padStart(2, '0');
                return {
                    label: this.settings.legends[index] || `Dataset ${index + 1}`,
                    data: parsed.data,
                    borderColor: borderColor,
                    backgroundColor: this.settings.fillArea ? `${fillColor}${opacityHex}` : 'transparent',
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

        if (datasets.length === 0) {
            console.warn('No valid datasets to render');
            return;
        }

        const uniqueLabels = [...new Set(datasets.flatMap(ds => ds.data.length > 0 ? ds.data.map((_, i) => this.settings.datasets[datasets.indexOf(ds)].split(';')[i].split(',')[0]) : []))];
        console.log('Labels:', uniqueLabels);
        console.log('Datasets:', datasets);

        try {
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
                            top: 30,
                            bottom: 10,
                            left: 10,
                            right: 10
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
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
                        },
                        tooltip: {
                            enabled: true,
                            position: 'nearest',
                            callbacks: {
                                label: context => {
                                    const dataset = context.dataset;
                                    const value = context.parsed.y;
                                    return `${dataset.label}: ${value}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: this.settings.xAxisTitle,
                                font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily },
                                color: this.settings.xAxisColor
                            },
                            grid: {
                                display: this.settings.showGrid,
                                lineWidth: this.settings.gridLineWidth,
                                color: this.settings.gridLineColor
                            },
                            ticks: {
                                color: this.settings.xAxisColor,
                                font: { size: this.settings.fontSize, family: this.settings.fontFamily }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Values',
                                font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily },
                                color: this.settings.yAxisColor
                            },
                            grid: {
                                display: this.settings.showGrid,
                                lineWidth: this.settings.gridLineWidth,
                                color: this.settings.gridLineColor
                            },
                            ticks: {
                                color: this.settings.yAxisColor,
                                font: { size: this.settings.fontSize, family: this.settings.fontFamily }
                            }
                        }
                    },
                    animation: { duration: this.settings.enableAnimations ? 1500 : 0, easing: 'easeInOutQuart' },
                    plugins: [{
                        id: 'crosshair',
                        afterDatasetsDraw: (chart) => {
                            const { ctx, chartArea, scales } = chart;
                            const activeElements = chart.tooltip._active;
                            if (activeElements && activeElements.length) {
                                const x = activeElements[0].element.x;
                                ctx.save();
                                ctx.beginPath();
                                ctx.moveTo(x, chartArea.top);
                                ctx.lineTo(x, chartArea.bottom);
                                ctx.lineWidth = 1;
                                ctx.strokeStyle = '#666';
                                ctx.stroke();
                                ctx.restore();
                            }
                        }
                    }]
                }
            });
            console.log('Chart initialized successfully');
        } catch (error) {
            console.error('Error initializing Chart.js:', error);
        }

        this.onResize = () => this.updateChartSize();
        window.addEventListener('resize', this.onResize);
    }

    updateChartSize() {
        if (this.chart) {
            const rect = this.getBoundingClientRect();
            this.chart.canvas.width = rect.width;
            this.chart.canvas.height = rect.height;
            console.log('Resizing chart to:', rect.width, 'x', rect.height);
            this.chart.resize();
        }
    }

    updateChart() {
        if (!this.chart) {
            console.warn('No chart instance to update, attempting to render');
            this.renderChart();
            return;
        }

        const rect = this.getBoundingClientRect();
        this.chart.canvas.width = rect.width;
        this.chart.canvas.height = rect.height;

        const datasets = this.settings.datasets
            .map((rawData, index) => {
                const parsed = this.parseDataset(rawData);
                if (!parsed) return null;
                const borderColor = this.settings.colors[index % this.settings.colors.length] || '#000000';
                const fillColor = this.settings.fillColors[index % this.settings.fillColors.length] || borderColor;
                const opacityHex = Math.round(this.settings.areaOpacity * 255).toString(16).padStart(2, '0');
                return {
                    label: this.settings.legends[index] || `Dataset ${index + 1}`,
                    data: parsed.data,
                    borderColor: borderColor,
                    backgroundColor: this.settings.fillArea ? `${fillColor}${opacityHex}` : 'transparent',
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
                    top: 30,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            },
            plugins: {
                ...this.chart.options.plugins,
                legend: {
                    display: true,
                    position: 'top',
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
                    title: {
                        display: true,
                        text: this.settings.xAxisTitle,
                        font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily },
                        color: this.settings.xAxisColor
                    },
                    grid: {
                        display: this.settings.showGrid,
                        lineWidth: this.settings.gridLineWidth,
                        color: this.settings.gridLineColor
                    },
                    ticks: { color: this.settings.xAxisColor, font: { size: this.settings.fontSize, family: this.settings.fontFamily } }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Values',
                        font: { size: this.settings.fontSize + 4, family: this.settings.fontFamily },
                        color: this.settings.yAxisColor
                    },
                    grid: {
                        display: this.settings.showGrid,
                        lineWidth: this.settings.gridLineWidth,
                        color: this.settings.gridLineColor
                    },
                    ticks: { color: this.settings.yAxisColor, font: { size: this.settings.fontSize, family: this.settings.fontFamily } }
                }
            },
            animation: { duration: this.settings.enableAnimations ? 1500 : 0 }
        };
        console.log('Updating chart with new data');
        this.chart.update();
    }

    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
            console.log('Chart destroyed');
        }
        window.removeEventListener('resize', this.onResize);
    }
}

customElements.define('simple-line-chart', SimpleLineChartElement);
