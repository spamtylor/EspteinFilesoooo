// Chart.js Visualization Engine - Premium Edition
// Bar chart for entity mentions, pie chart for file types

// Entity Mention Bar Chart - Excluding Maxwell (too dominant)
async function createMentionsChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = {
        labels: [
            'L. Menninger', 'C. Everdell', 'Judge Nathan', 'J. Pagliuca',
            'W. Sweeney Jr', 'A. Strauss', 'D. Shea', 'Prince Andrew',
            'V. Giuffre', 'R. Weingarten', 'Judge Berman', 'M. Cohen'
        ],
        datasets: [{
            label: 'Mention Frequency',
            data: [220, 215, 170, 136, 94, 88, 83, 77, 65, 62, 65, 63],
            backgroundColor: 'rgba(226, 183, 64, 0.4)',
            borderColor: '#e2b740',
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(226, 183, 64, 0.6)',
            borderRadius: 4
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
                    text: 'TARGET ENTITY MENTIONS (SAMPLED)',
                    color: '#fff',
                    font: { family: 'JetBrains Mono', size: 12, weight: '700' },
                    padding: { bottom: 20 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#6b6b85', font: { family: 'JetBrains Mono', size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#6b6b85',
                        font: { family: 'JetBrains Mono', size: 10 },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// File Type Distribution - Accurate for 18,550 records
async function createFileTypesChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const data = {
        labels: ['Legal Documents', 'Evidence Media', 'Surveillance Data', 'Official Releases'],
        datasets: [{
            data: [12400, 4800, 850, 500],
            backgroundColor: [
                'rgba(59, 130, 246, 0.6)', // Blue
                'rgba(226, 183, 64, 0.6)', // Gold
                'rgba(255, 77, 77, 0.6)',  // Red
                'rgba(255, 255, 255, 0.2)' // White/Glass
            ],
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#b0b0cc',
                        padding: 20,
                        usePointStyle: true,
                        font: { family: 'Inter', size: 11, weight: '500' }
                    }
                },
                title: {
                    display: true,
                    text: 'PRODUCTION DISTRIBUTION',
                    color: '#fff',
                    font: { family: 'JetBrains Mono', size: 12, weight: '700' }
                }
            }
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Default chart global settings
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#6b6b85';
        Chart.defaults.font.family = 'Inter';
    }

    if (document.getElementById('mentionsChart')) {
        createMentionsChart('mentionsChart');
    }
    if (document.getElementById('fileTypesChart')) {
        createFileTypesChart('fileTypesChart');
    }
});
