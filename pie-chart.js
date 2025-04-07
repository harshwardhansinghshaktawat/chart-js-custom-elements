class PieChartElement extends HTMLElement {
    constructor() {
        super();
        this.chart = null;
        this.settings = {
            dataset: '',
            enableAnimations: true,
            showDataLabels: false,
            fontFamily: 'Arial',
            fontSize: 12,
            chartHeight: 400,
            colors: ['#ff6384'], // Single fallback color
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
                const datasets = JSON.parse(newValue);
                this.settings.dataset = datasets[0] || '';
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
        const backgroundColors = [];
        entries.forEach((entry, index) => {
            const [label, value, color] = entry.split(',');
            if (label && !isNaN(value) && color) {
                labels.push(label);
                data.push(parseFloat(value));
                backgroundColors.push(color); // Use provided color
            } else {
                console.warn(`Invalid entry: ${entry}, using fallback color`);
                labels.push(label || `Segment ${index + 1}`);
                data.push(parseFloat(value) || 0);
                backgroundColors.push(this.settings.colors[0]); // Single fallback color
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

        const parsed = this.parseDataset(this.settings.dataset);
        if (!parsed) {
            console.error('No valid dataset to render');
            return;
        }

        const dataset = {
            data: parsed.data,
            backgroundColor: parsed.backgroundColors, // Use per-segment colors
            borderColor: '#fff',
            borderWidth: 1
        };

        console.log('Chart data:', { labels: parsed.labels, dataset });

        try {
            this.chart = new Chart(ctx, {
                type: 'pie',
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
                                // Default legend behavior uses segment colors
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
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    return `${label}: ${value}`;
                                }
                            }
                        }
                    },
                    animation: { duration: this.settings.enableAnimations ? 1000 : 0, easing: 'easeInOutQuart' }
                }
            });
            console.log('Chart initialized:', this.chart);
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

        const parsed = this.parseDataset(this.settings.dataset);
        if (!parsed) {
            console.error('No valid dataset to update');
            return;
        }

        const dataset = {
            data: parsed.data,
            backgroundColor: parsed.backgroundColors,
            borderColor: '#fff',
            borderWidth: 1
        };

        console.log('Updating chart with:', { labels: parsed.labels, dataset });

        this.chart.data.labels = parsed.labels;
        this.chart.data.datasets = [dataset];
        this.chart.update();
    }

    disconnectedCallback() {
        if (this.chart) this.chart.destroy();
        window.removeEventListener('resize', this.onResize);
    }
}

customElements.define('pie-chart', PieChartElement);
