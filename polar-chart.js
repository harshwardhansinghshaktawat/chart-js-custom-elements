class RadarChartElement extends HTMLElement {
    constructor() {
        super();
        this.chart = null;
        this.settings = {
            dataset: '',
            showGrid: true,
            gridLineWidth: 1,
            gridLineColor: '#e0e0e0',
            enableAnimations: true,
            showDataLabels: false,
            fontFamily: 'Arial',
            fontSize: 12,
            axisColor: '#666',
            chartHeight: 400,
            colors: ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff'], // Colors for segments
            legends: ['Dataset 1'] // Not used directly for segment legends
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
                const datasets = JSON.parse(newValue);
                this.settings.dataset = datasets[0] || ''; // Only first dataset
                console.log('Dataset updated:', this.settings.dataset);
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

        const parsed = this.parseDataset(this.settings.dataset);
        if (!parsed) {
            console.error('No valid dataset to render');
            return;
        }

        const dataset = {
            data: parsed.data,
            backgroundColor: this.settings.colors.map(color => `${color}33`), // 20% opacity for fill
            borderColor: this.settings.colors,
            borderWidth: 2,
            pointBackgroundColor: this.settings.colors,
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 4
        };

        console.log('Chart data:', { labels: parsed.labels, dataset });

        this.chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: parsed.labels, // Each segment gets its own label
                datasets: [dataset] // Single dataset
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
                            padding: 10,
                            generateLabels: (chart) => {
                                const dataset = chart.data.datasets[0];
                                return chart.data.labels.map((label, index) => ({
                                    text: label,
                                    fillStyle: dataset.backgroundColor[index],
                                    strokeStyle: dataset.borderColor[index],
                                    lineWidth: dataset.borderWidth,
                                    datasetIndex: 0,
                                    index: index
                                }));
                            }
                        }
                    },
                    datalabels: {
                        display: this.settings.showDataLabels,
                        font: { size: this.settings.fontSize, family: this.settings.fontFamily },
                        color: '#666',
                        anchor: 'center',
                        align: 'center'
                    },
                    tooltip: {
                        enabled: true,
                        position: 'nearest',
                        callbacks: {
                            label: context => {
                                const label = context.label || '';
                                const value = context.parsed.r;
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: this.settings.gridLineColor,
                            lineWidth: this.settings.gridLineWidth
                        },
                        grid: {
                            display: this.settings.showGrid,
                            color: this.settings.gridLineColor,
                            lineWidth: this.settings.gridLineWidth
                        },
                        pointLabels: {
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily },
                            color: this.settings.axisColor
                        },
                        ticks: {
                            display: true,
                            color: this.settings.axisColor,
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily }
                        },
                        beginAtZero: true
                    }
                },
                animation: { duration: this.settings.enableAnimations ? 1000 : 0, easing: 'easeInOutQuart' }
            }
        });
        console.log('Chart initialized:', this.chart);

        this.onResize = () => this.updateChartSize();
        window.addEventListener('resize', this.onResize);
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

        const parsed = this.parseDataset(this.settings.dataset);
        if (!parsed) {
            console.error('No valid dataset to update');
            return;
        }

        const dataset = {
            data: parsed.data,
            backgroundColor: this.settings.colors.map(color => `${color}33`), // 20% opacity for fill
            borderColor: this.settings.colors,
            borderWidth: 2,
            pointBackgroundColor: this.settings.colors,
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 4
        };

        console.log('Updating chart with:', { labels: parsed.labels, dataset });

        this.chart.data.labels = parsed.labels;
        this.chart.data.datasets = [dataset];
        this.chart.options.scales.r = {
            angleLines: {
                display: true,
                color: this.settings.gridLineColor,
                lineWidth: this.settings.gridLineWidth
            },
            grid: {
                display: this.settings.showGrid,
                color: this.settings.gridLineColor,
                lineWidth: this.settings.gridLineWidth
            },
            pointLabels: {
                font: { size: this.settings.fontSize, family: this.settings.fontFamily },
                color: this.settings.axisColor
            },
            ticks: {
                display: true,
                color: this.settings.axisColor,
                font: { size: this.settings.fontSize, family: this.settings.fontFamily }
            },
            beginAtZero: true
        };
        this.chart.update();
    }

    disconnectedCallback() {
        if (this.chart) this.chart.destroy();
        window.removeEventListener('resize', this.onResize);
    }
}

customElements.define('polar-chart', RadarChartElement);
