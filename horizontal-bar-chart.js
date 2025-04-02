class HorizontalBarChartElement extends HTMLElement {
    constructor() {
        super();
        this.chart = null;
        this.settings = {
            datasets: [],
            showGrid: true,
            gridLineWidth: 1,
            gridLineColor: '#e0e0e0',
            enableAnimations: true,
            showDataLabels: false,
            fontFamily: 'Arial',
            fontSize: 12,
            xAxisColor: '#666',
            yAxisColor: '#666',
            chartHeight: 400,
            xAxisTitle: 'Values',
            yAxisTitle: 'Categories',
            colors: ['#ff6384', '#36a2eb'],
            legends: ['Dataset 1', 'Dataset 2']
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
                const newOptions = JSON.parse(newValue);
                Object.assign(this.settings, newOptions);
                this.style.height = `${this.settings.chartHeight}px`;
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
            if (label && !isNaN(value)) {
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
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            margin: '0',
            padding: '0'
        });
        this.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const rect = this.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const datasets = this.settings.datasets
            .map((rawData, index) => {
                const parsed = this.parseDataset(rawData);
                if (!parsed) return null;
                const backgroundColor = this.settings.colors[index % this.settings.colors.length] || '#000000';
                return {
                    label: this.settings.legends[index] || `Dataset ${index + 1}`,
                    data: parsed.data,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor,
                    borderWidth: 1
                };
            })
            .filter(dataset => dataset !== null);

        if (datasets.length === 0) return;

        const uniqueLabels = [...new Set(datasets.flatMap(ds => this.parseDataset(this.settings.datasets[datasets.indexOf(ds)]).labels))];

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: uniqueLabels,
                datasets: datasets
            },
            options: {
                indexAxis: 'y', // Makes it a horizontal bar chart
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
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily },
                            color: '#666',
                            padding: 10
                        }
                    },
                    datalabels: {
                        display: this.settings.showDataLabels,
                        font: { size: this.settings.fontSize, family: this.settings.fontFamily },
                        color: '#666',
                        anchor: 'end',
                        align: 'right'
                    },
                    tooltip: {
                        enabled: true,
                        position: 'nearest',
                        callbacks: {
                            label: context => {
                                const dataset = context.dataset;
                                const value = context.parsed.x; // Horizontal bar uses x for values
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
                            font: { size: this.settings.fontSize + 2, family: this.settings.fontFamily },
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
                        },
                        beginAtZero: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.settings.yAxisTitle,
                            font: { size: this.settings.fontSize + 2, family: this.settings.fontFamily },
                            color: this.settings.yAxisColor
                        },
                        grid: {
                            display: false // No vertical grid lines in Chart.js example
                        },
                        ticks: {
                            color: this.settings.yAxisColor,
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily }
                        }
                    }
                },
                animation: { duration: this.settings.enableAnimations ? 1000 : 0, easing: 'easeInOutQuart' }
            }
        });

        this.onResize = () => this.updateChartSize();
        window.addEventListener('resize', this.onResize);
    }

    updateChartSize() {
        if (this.chart) {
            const rect = this.getBoundingClientRect();
            this.chart.canvas.width = rect.width;
            this.chart.canvas.height = rect.height;
            this.chart.resize();
        }
    }

    updateChart() {
        if (!this.chart) return;

        const rect = this.getBoundingClientRect();
        this.chart.canvas.width = rect.width;
        this.chart.canvas.height = rect.height;

        const datasets = this.settings.datasets
            .map((rawData, index) => {
                const parsed = this.parseDataset(rawData);
                if (!parsed) return null;
                const backgroundColor = this.settings.colors[index % this.settings.colors.length] || '#000000';
                return {
                    label: this.settings.legends[index] || `Dataset ${index + 1}`,
                    data: parsed.data,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor,
                    borderWidth: 1
                };
            })
            .filter(dataset => dataset !== null);

        const uniqueLabels = [...new Set(datasets.flatMap(ds => this.parseDataset(this.settings.datasets[datasets.indexOf(ds)]).labels))];

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
                        font: { size: this.settings.fontSize, family: this.settings.fontFamily },
                        color: '#666',
                        padding: 10
                    }
                },
                datalabels: { 
                    display: this.settings.showDataLabels, 
                    font: { size: this.settings.fontSize, family: this.settings.fontFamily }, 
                    color: '#666',
                    anchor: 'end',
                    align: 'right'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: this.settings.xAxisTitle,
                        font: { size: this.settings.fontSize + 2, family: this.settings.fontFamily },
                        color: this.settings.xAxisColor
                    },
                    grid: {
                        display: this.settings.showGrid,
                        lineWidth: this.settings.gridLineWidth,
                        color: this.settings.gridLineColor
                    },
                    ticks: { color: this.settings.xAxisColor, font: { size: this.settings.fontSize, family: this.settings.fontFamily } },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: this.settings.yAxisTitle,
                        font: { size: this.settings.fontSize + 2, family: this.settings.fontFamily },
                        color: this.settings.yAxisColor
                    },
                    grid: {
                        display: false
                    },
                    ticks: { color: this.settings.yAxisColor, font: { size: this.settings.fontSize, family: this.settings.fontFamily } }
                }
            },
            animation: { duration: this.settings.enableAnimations ? 1000 : 0 }
        };
        this.chart.update();
    }

    disconnectedCallback() {
        if (this.chart) this.chart.destroy();
        window.removeEventListener('resize', this.onResize);
    }
}

customElements.define('horizontal-bar-chart', HorizontalBarChartElement);
