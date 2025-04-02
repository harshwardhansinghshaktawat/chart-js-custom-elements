class FloatingBarChartElement extends HTMLElement {
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
            const [label, range] = entry.split(',');
            if (label && range) {
                const [start, end] = range.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    labels.push(label);
                    data.push([start, end]); // Floating bar range as [start, end]
                }
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
                        align: 'top',
                        formatter: (value) => `${value[0]} - ${value[1]}` // Show range
                    },
                    tooltip: {
                        enabled: true,
                        position: 'nearest',
                        callbacks: {
                            label: context => {
                                const dataset = context.dataset;
                                const value = context.parsed.y;
                                return `${dataset.label}: ${value[0]} - ${value[1]}`;
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
                            text: 'Values
