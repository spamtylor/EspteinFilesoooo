// Chart.js Visualization Engine
// Provides bar chart for entity mentions and pie chart for file types

// Load Chart.js from CDN if not already loaded
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

// Entity Mention Frequency Bar Chart
async function createMentionsChart(canvasId) {
    await loadChartJS();

    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Top mentioned entities (from persons.json data)
    const data = {
        labels: [
            'G. Maxwell', 'L. Menninger', 'C. Everdell', 'Judge Nathan',
            'J. Pagliuca', 'A. Strauss', 'D. Shea', 'Prince Andrew',
            'V. Giuffre', 'R. Weingarten'
        ],
        datasets: [{
            label: 'Mentions in PDFs',
            data: [1057, 220, 215, 170, 136, 88, 83, 77, 65, 62],
            backgroundColor: [
                '#dc2626', // Maxwell - red (co-conspirator)
                '#0284c7', // Legal
                '#059669', // Prosecution
                '#1d4ed8', // Judge
                '#0284c7', // Defense
                '#059669', // Prosecution
                '#0891b2', // Law enforcement
                '#f59e0b', // Associate
                '#7c3aed', // Victim
                '#0284c7'  // Legal
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
                    text: 'Top 10 Entity Mentions (Excluding Primary Subject)',
                    font: { size: 16, weight: '600' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Mentions'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Entity'
                    }
                }
            }
        }
    });
}

// File Type Distribution Pie Chart
async function createFileTypesChart(canvasId) {
    await loadChartJS();

    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = {
        labels: ['PDF Documents', 'JPG Images', 'MP4 Videos', 'DAT Records', 'Other'],
        datasets: [{
            data: [14700, 6775, 887, 29408, 780],
            backgroundColor: [
                '#d32f2f', // Red - PDFs
                '#1565c0', // Blue - Images
                '#7b1fa2', // Purple - Videos
                '#388e3c', // Green - DAT
                '#f57c00'  // Orange - Other
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
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'File Type Distribution (18,550 Files)',
                    font: { size: 16, weight: '600' }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Category Distribution Doughnut Chart
async function createCategoryChart(canvasId) {
    await loadChartJS();

    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = {
        labels: ['Associates', 'Legal (All)', 'Victims', 'Law Enforcement', 'Government', 'Other'],
        datasets: [{
            data: [35, 28, 10, 5, 6, 7],
            backgroundColor: [
                '#f59e0b', // Orange - Associates
                '#0284c7', // Blue - Legal
                '#7c3aed', // Purple - Victims
                '#0891b2', // Cyan - Law Enforcement
                '#4f46e5', // Indigo - Government
                '#6b7280'  // Gray - Other
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Person Database by Category (91 Individuals)',
                    font: { size: 16, weight: '600' }
                }
            }
        }
    });
}

// Initialize all charts on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check for chart containers and initialize
    if (document.getElementById('mentionsChart')) {
        createMentionsChart('mentionsChart');
    }
    if (document.getElementById('fileTypesChart')) {
        createFileTypesChart('fileTypesChart');
    }
    if (document.getElementById('categoryChart')) {
        createCategoryChart('categoryChart');
    }
});
