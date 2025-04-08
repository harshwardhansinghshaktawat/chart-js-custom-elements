class VerticalBarChartElement extends HTMLElement {
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
            xAxisTitle: 'Categories',
            yAxisTitle: 'Values',
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
                console.log('Datasets updated:', this.settings.datasets);
            } else if (name === 'options') {
                const newOptions = JSON.parse(newValue);
                Object.assign(this.settings, newOptions);
                this.style.height = `${this.settings.chartHeight}px`;
                console.log('Options updated:', this.settings);
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
        if (!rawData) {
            console.error('No raw data provided');
            return null;
        }
        const entries = rawData.split(';');
        const labels = [];
        const data = [];
        entries.forEach(entry => {
            const [label, value] = entry.split(',');
            if (label && !isNaN(value)) {
                labels.push(label);
                data.push(parseFloat(value));
            } else {
                console.warn(`Invalid entry: ${entry}`);
            }
        });
        console.log('Parsed dataset:', { labels, data });
        return data.length > 0 ? { labels, data } : null;
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
        console.log('Canvas dimensions:', { width: rect.width, height: rect.height });

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

        if (datasets.length === 0) {
            console.error('No valid datasets to render');
            return;
        }

        const uniqueLabels = [...new Set(datasets.flatMap(ds => this.parseDataset(this.settings.datasets[datasets.indexOf(ds)]).labels))];
        console.log('Chart data:', { labels: uniqueLabels, datasets });

        console.log('Rendering chart with yAxisTitle:', this.settings.yAxisTitle);

        this.chart = new Chart(ctx, {
            type: 'bar',
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
                        align: 'top'
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
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: this.settings.yAxisTitle,
                            font: { size: this.settings.fontSize + 2, family: this.settings.fontFamily },
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
                        },
                        beginAtZero: true
                    }
                },
                animation: { duration: this.settings.enableAnimations ? 1000 : 0, easing: 'easeInOutQuart' }
            }
        });
        console.log('Chart initialized with yAxisTitle:', this.chart.options.scales.y.title.text);
    }

    updateChartSize() {
        if (this.chart) {
            const rect = this.getBoundingClientRect();
            this.chart.canvas.width = rect.width;
            this.chart.canvas.height = rect.height;
            this.chart.resize();
            console.log('Chart resized:', { width: rect.width, height: rect.height });
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
        console.log('Updating chart with:', { labels: uniqueLabels, datasets });
        console.log('Updating chart with yAxisTitle:', this.settings.yAxisTitle);

        this.chart.data.labels = uniqueLabels;
        this.chart.data.datasets = datasets;
        
        // Explicitly update axis titles
        this.chart.options.scales.x.title.text = this.settings.xAxisTitle;
        this.chart.options.scales.y.title.text = this.settings.yAxisTitle;

        // Force update by resetting the scales configuration
        this.chart.options.scales.y = {
            title: {
                display: true,
                text: this.settings.yAxisTitle,
                font: { size: this.settings.fontSize + 2, family: this.settings.fontFamily },
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
            },
            beginAtZero: true
        };

        this.chart.update();
        console.log('Chart updated with yAxisTitle:', this.chart.options.scales.y.title.text);

        // Fallback: If update doesn’t work, force a full re-render
        if (this.chart.options.scales.y.title.text !== this.settings.yAxisTitle) {
            console.warn('Y-axis title update failed, forcing re-render');
            this.chart.destroy();
            this.renderChart();
        }
    }

    disconnectedCallback() {
        if (this.chart) this.chart.destroy();
        window.removeEventListener('resize', this.onResize);
    }
}

customElements.define('vertical-bar-chart', VerticalBarChartElement);
