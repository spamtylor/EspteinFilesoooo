// Networks Page JavaScript
// Displays relationship network with filtering by circle, industry, and location

let networkData = null;
let currentFilters = {
    circle: 'all',
    industry: 'all',
    location: 'all'
};

const circleColors = {
    inner: '#e53935',
    enablers: '#ff9800',
    victims: '#7c4dff',
    network: '#42a5f5',
    legal: '#00c853'
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/networks.json');
        networkData = await response.json();

        renderFigures(networkData.key_figures);
        renderLocations(networkData.locations);
        setupCircleFilters();
        setupIndustryFilters();
        setupLocationFilters();
        updateCount(networkData.key_figures.length);

    } catch (error) {
        console.error('Error loading network data:', error);
    }
});

function applyFilters() {
    let filtered = [...networkData.key_figures];

    // Filter by circle
    if (currentFilters.circle !== 'all') {
        filtered = filtered.filter(f => f.circle === currentFilters.circle);
    }

    // Filter by industry
    if (currentFilters.industry !== 'all') {
        filtered = filtered.filter(f => f.industry === currentFilters.industry);
    }

    // Filter by location
    if (currentFilters.location !== 'all') {
        filtered = filtered.filter(f => f.location === currentFilters.location);
    }

    renderFigures(filtered);
    updateCount(filtered.length);
}

function renderFigures(figures) {
    const grid = document.getElementById('figuresGrid');
    if (!grid) return;

    // Sort by relevance
    const sorted = [...figures].sort((a, b) => b.relevance - a.relevance);

    grid.innerHTML = sorted.map(fig => {
        const circle = networkData.circles[fig.circle];
        const color = circleColors[fig.circle] || '#666';

        return `
            <div class="network-card" data-circle="${fig.circle}" style="border-left-color: ${color}">
                <div class="network-header">
                    <h3>${fig.name}</h3>
                    <span class="relevance-score" style="background: ${color}">${fig.relevance}/10</span>
                </div>
                <span class="circle-badge" style="background: ${color}20; color: ${color}">${circle?.name || fig.circle}</span>
                ${fig.industry ? `<span class="industry-badge">${fig.industry}</span>` : ''}
                ${fig.location ? `<span class="location-badge">📍 ${fig.location}</span>` : ''}
                <p class="relationship">${fig.relationship}</p>
                <p class="time-period">${fig.time_period}</p>
                
                ${fig.key_facts ? `
                    <ul class="key-facts">
                        ${fig.key_facts.slice(0, 3).map(f => `<li>${f}</li>`).join('')}
                    </ul>
                ` : ''}
                
                ${fig.connections && fig.connections.length > 0 ? `
                    <div class="connections">
                        <span class="connections-label">Connected to:</span>
                        ${fig.connections.map(c => {
            const connected = networkData.key_figures.find(f => f.id === c);
            return connected ? `<span class="connection-chip">${connected.name.split(' ')[0]}</span>` : '';
        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderLocations(locations) {
    const grid = document.getElementById('locationsGrid');
    if (!grid) return;

    grid.innerHTML = locations.map(loc => `
        <div class="location-card">
            <h4>${loc.name}</h4>
            <p class="address">${loc.address}</p>
            <p class="significance">${loc.significance}</p>
            ${loc.connected_figures ? `
                <div class="connected-figures">
                    ${loc.connected_figures.map(id => {
        const fig = networkData.key_figures.find(f => f.id === id);
        return fig ? `<span class="connection-chip">${fig.name.split(' ')[0]}</span>` : '';
    }).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function setupCircleFilters() {
    const links = document.querySelectorAll('#circleLinks a');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentFilters.circle = link.dataset.filter;
            applyFilters();
        });
    });
}

function setupIndustryFilters() {
    const tabs = document.querySelectorAll('#industryTabs .filter-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilters.industry = tab.dataset.industry;
            applyFilters();
        });
    });
}

function setupLocationFilters() {
    const tabs = document.querySelectorAll('#locationTabs .filter-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilters.location = tab.dataset.location;
            applyFilters();
        });
    });
}

function updateCount(count) {
    const el = document.getElementById('figureCount');
    if (el) {
        el.textContent = `${count} key figures`;
    }
}
