class DoughnutChartElement extends HTMLElement {
    constructor() {
        super();
        this.chart = null;
        this.settings = {
            datasets: [],
            enableAnimations: true,
            showDataLabels: false,
            fontFamily: 'Arial',
            fontSize: 12,
            chartHeight: 400,
            colors: ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff'], // Fallback colors
            legends: ['Dataset 1', 'Dataset 2', 'Dataset 3', 'Dataset 4', 'Dataset 5']
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
            boxSizing: 'border-box'
        });

        this.loadChartJs(() => {
            setTimeout(() => this.renderChart(), 100);
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
        const backgroundColors = [];
        entries.forEach((entry, index) => {
            const parts = entry.split(',');
            const [label, value, color] = parts;
            if (parts.length === 3 && label && !isNaN(value) && color) {
                labels.push(label);
                data.push(parseFloat(value));
                backgroundColors.push(color); // Use provided color
                console.log(`Parsed entry ${index}:`, { label, value: parseFloat(value), color });
            } else {
                console.warn(`Invalid entry: ${entry}, using fallback`);
                labels.push(label || `Segment ${index + 1}`);
                data.push(parseFloat(value) || 0);
                backgroundColors.push(this.settings.colors[index % this.settings.colors.length]); // Fallback color
            }
        });
        console.log('Parsed dataset:', { labels, data, backgroundColors });
        return data.length > 0 ? { labels, data, backgroundColors } : null;
    }

    renderChart() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }

        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            display: 'block',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: '0',
            left: '0',
            margin: '0',
            padding: '0'
        });
        this.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const rect = this.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn('Custom element has zero dimensions:', { width: rect.width, height: rect.height });
            return;
        }
        canvas.width = rect.width;
        canvas.height = rect.height;
        console.log('Custom element dimensions:', { width: rect.width, height: rect.height });
        console.log('Canvas dimensions set to:', { width: canvas.width, height: canvas.height });

        const datasets = this.settings.datasets
            .map((rawData, index) => {
                const parsed = this.parseDataset(rawData);
                if (!parsed) return null;
                return {
                    label: this.settings.legends[index] || `Dataset ${index + 1}`,
                    data: parsed.data,
                    backgroundColor: parsed.backgroundColors, // Use per-segment colors
                    borderColor: '#fff',
                    borderWidth: 2
                };
            })
            .filter(dataset => dataset !== null);

        if (datasets.length === 0) {
            console.error('No valid datasets to render');
            return;
        }

        const uniqueLabels = [...new Set(datasets.flatMap(ds => this.parseDataset(this.settings.datasets[datasets.indexOf(ds)]).labels))];
        console.log('Chart data:', { labels: uniqueLabels, datasets });

        try {
            this.chart = new Chart(ctx, {
                type: 'doughnut',
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
                                padding: 10,
                                // Ensure legend colors match segment colors
                                generateLabels: chart => {
                                    const dataset = chart.data.datasets[0]; // Assuming single dataset for legend clarity
                                    return chart.data.labels.map((label, i) => ({
                                        text: label,
                                        fillStyle: dataset.backgroundColor[i],
                                        strokeStyle: dataset.borderColor,
                                        lineWidth: dataset.borderWidth,
                                        hidden: isNaN(dataset.data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                                        index: i
                                    }));
                                }
                            }
                        },
                        datalabels: {
                            display: this.settings.showDataLabels,
                            font: { size: this.settings.fontSize, family: this.settings.fontFamily },
                            color: '#fff',
                            anchor: 'center',
                            align: 'center'
                        },
                        tooltip: {
                            enabled: true,
                            position: 'nearest',
                            callbacks: {
                                label: context => {
                                    const dataset = context.dataset;
                                    const value = context.parsed;
                                    return `${dataset.label}: ${value}`;
                                }
                            }
                        }
                    },
                    animation: { duration: this.settings.enableAnimations ? 1000 : 0, easing: 'easeInOutQuart' }
                }
            });
            console.log('Chart initialized:', this.chart);
            console.log('Chart canvas dimensions after init:', { width: this.chart.canvas.width, height: this.chart.canvas.height });
        } catch (error) {
            console.error('Error initializing chart:', error);
        }

        this.onResize = () => this.updateChartSize();
        window.addEventListener('resize', this.onResize);
    }

    updateChartSize() {
        if (this.chart) {
            const rect = this.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                console.warn('Custom element has zero dimensions on resize:', { width: rect.width, height: rect.height });
                return;
            }
            this.chart.canvas.width = rect.width;
            this.chart.canvas.height = rect.height;
            this.chart.resize();
            console.log('Chart resized to:', { width: rect.width, height: rect.height });
        }
    }

    updateChart() {
        if (!this.chart) return;

        const rect = this.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn('Custom element has zero dimensions on update:', { width: rect.width, height: rect.height });
            return;
        }
        this.chart.canvas.width = rect.width;
        this.chart.canvas.height = rect.height;

        const datasets = this.settings.datasets
            .map((rawData, index) => {
                const parsed = this.parseDataset(rawData);
                if (!parsed) return null;
                return {
                    label: this.settings.legends[index] || `Dataset ${index + 1}`,
                    data: parsed.data,
                    backgroundColor: parsed.backgroundColors,
                    borderColor: '#fff',
                    borderWidth: 2
                };
            })
            .filter(dataset => dataset !== null);

        const uniqueLabels = [...new Set(datasets.flatMap(ds => this.parseDataset(this.settings.datasets[datasets.indexOf(ds)]).labels))];
        console.log('Updating chart with:', { labels: uniqueLabels, datasets });

        this.chart.data.labels = uniqueLabels;
        this.chart.data.datasets = datasets;
        this.chart.update();
    }

    disconnectedCallback() {
        if (this.chart) this.chart.destroy();
        window.removeEventListener('resize', this.onResize);
    }
}

customElements.define('doughnut-chart', DoughnutChartElement);
