document.addEventListener('DOMContentLoaded', () => {
    let timelineData = [];
    const timelineContainer = document.getElementById('timelineContainer');
    const filterTabs = document.querySelector('.filter-tabs');

    // Fetch and Initialize
    fetch('data/timeline.json')
        .then(res => res.json())
        .then(data => {
            timelineData = data;
            renderTimeline('all');
        });

    // Filtering logic
    filterTabs?.addEventListener('click', (e) => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;

        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        renderTimeline(tab.dataset.category);
    });

    function renderTimeline(category) {
        if (!timelineContainer) return;

        const filtered = category === 'all'
            ? timelineData
            : timelineData.filter(item => item.category === category);

        timelineContainer.innerHTML = filtered.map(item => `
            <div class="timeline-item" id="${item.id}">
                <div class="timeline-dot ${item.category}"></div>
                <span class="date">${item.date}</span>
                <span class="category-badge ${item.category}">${item.category.toUpperCase()}</span>
                <h4>${item.title}</h4>
                <p>${item.description}</p>
                <div class="timeline-meta">
                    <span class="source-tag">Source: ${item.source}</span>
                </div>
            </div>
        `).join('');
    }
});
