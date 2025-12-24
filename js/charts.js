// Chart.js Visualization Engine
// Bar chart for entity mentions, pie chart for file types

function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Entity Mention Bar Chart - Excluding Maxwell (too dominant)
async function createMentionsChart(canvasId) {
    await loadChartJS();

    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Diverse set of key figures (excluding Maxwell who dominates at 1057)
    const data = {
        labels: [
            'L. Menninger', 'C. Everdell', 'Judge Nathan', 'J. Pagliuca',
            'W. Sweeney Jr', 'A. Strauss', 'D. Shea', 'Prince Andrew',
            'V. Giuffre', 'R. Weingarten', 'Judge Berman', 'M. Cohen'
        ],
        datasets: [{
            label: 'Mentions',
            data: [220, 215, 170, 136, 94, 88, 83, 77, 65, 62, 65, 63],
            backgroundColor: [
                '#0284c7', // Defense
                '#059669', // Prosecution
                '#1d4ed8', // Judge
                '#0284c7', // Defense
                '#0891b2', // Law enforcement
                '#059669', // Prosecution
                '#0891b2', // Law enforcement
                '#f59e0b', // Associate
                '#7c3aed', // Victim
                '#0284c7', // Legal
                '#1d4ed8', // Judge
                '#0284c7'  // Defense
            ],
            borderWidth: 0
        }]
    };

    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Key Figures by Mention Count',
                    font: { size: 14, weight: '600' }
                },
                subtitle: {
                    display: true,
                    text: 'Excludes primary subjects (Epstein, Maxwell)',
                    font: { size: 11 },
                    color: '#666'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Mentions'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// File Type Pie Chart
async function createFileTypesChart(canvasId) {
    await loadChartJS();

    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = {
        labels: ['PDF Documents', 'JPG Images', 'MP4 Videos', 'DAT Records', 'Other'],
        datasets: [{
            data: [14700, 6775, 887, 29408, 780],
            backgroundColor: [
                '#d32f2f',
                '#1565c0',
                '#7b1fa2',
                '#388e3c',
                '#f57c00'
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: { size: 11 }
                    }
                },
                title: {
                    display: true,
                    text: 'File Type Distribution',
                    font: { size: 14, weight: '600' }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('mentionsChart')) {
        createMentionsChart('mentionsChart');
    }
    if (document.getElementById('fileTypesChart')) {
        createFileTypesChart('fileTypesChart');
    }
});
