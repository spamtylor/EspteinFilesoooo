// Master Archive - High-Density Browser
let archiveData = { records: [] };
let filteredRecords = [];
let currentPage = 1;
const recordsPerPage = 100;

document.addEventListener('DOMContentLoaded', () => {
    const archiveContainer = document.getElementById('archiveContainer');
    const recordCountDisplay = document.getElementById('recordCount');

    // Fetch and Initialize
    fetch('data/master_archive.json')
        .then(res => res.json())
        .then(data => {
            archiveData = data;

            // Dynamic Collection Filter Generation
            const collections = [...new Set(data.records.map(r => r.collection))].sort();
            const filterList = document.getElementById('collectionFilters');
            if (filterList) {
                filterList.innerHTML = `<li><a href="#" data-collection="all" class="active">All Collections</a></li>` +
                    collections.map(col => `<li><a href="#" data-collection="${col}">${col}</a></li>`).join('');
            }

            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');
            if (query) {
                document.getElementById('archiveSearch').value = query;
            }
            applyFilters();
        });

    setupFilters();
    setupSearch();
});

function setupFilters() {
    document.getElementById('typeFilters')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();
        document.querySelectorAll('#typeFilters a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        applyFilters();
    });

    document.getElementById('collectionFilters')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();
        document.querySelectorAll('#collectionFilters a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        applyFilters();
    });

    document.querySelector('.filter-tabs')?.addEventListener('click', (e) => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        applyFilters();
    });

    document.getElementById('loadMore')?.addEventListener('click', () => {
        currentPage++;
        renderArchive();
    });
}

function setupSearch() {
    const searchInput = document.getElementById('archiveSearch');
    let timeout = null;
    searchInput?.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            applyFilters();
        }, 300);
    });
}

function applyFilters() {
    const typeFilter = document.querySelector('#typeFilters a.active')?.dataset.filter || 'all';
    const collectionFilter = document.querySelector('#collectionFilters a.active')?.dataset.collection || 'all';
    const sourceFilter = document.querySelector('.filter-tab.active')?.dataset.source || 'all';
    const searchQuery = document.getElementById('archiveSearch')?.value.toLowerCase() || '';

    filteredRecords = archiveData.records.filter(record => {
        const matchesType = typeFilter === 'all' || record.type === typeFilter;
        const matchesSource = sourceFilter === 'all' || record.source === sourceFilter;
        const matchesCollection = collectionFilter === 'all' || record.tags.includes(collectionFilter);

        if (!matchesType || !matchesSource || !matchesCollection) return false;

        if (searchQuery) {
            const searchText = `${record.name} ${record.tags.join(' ')}`.toLowerCase();
            return searchText.includes(searchQuery);
        }

        return true;
    });

    currentPage = 1;
    document.getElementById('recordCount').textContent = `Found ${filteredRecords.length} records`;
    renderArchive();
}

function renderArchive() {
    const container = document.getElementById('archiveContainer');
    if (!container) return;

    if (currentPage === 1) container.innerHTML = '';

    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const pageItems = filteredRecords.slice(start, end);

    if (pageItems.length === 0 && currentPage === 1) {
        container.innerHTML = '<div class="empty-state">No records found matching your criteria.</div>';
        return;
    }

    container.innerHTML += pageItems.map(record => `
        <div class="archive-item">
            <div class="archive-item-icon ${record.type}"></div>
            <div class="archive-item-content">
                <div class="archive-item-header">
                    <span class="record-id">${record.id}</span>
                    <span class="record-date">${record.date}</span>
                </div>
                <h3><a href="${record.path}" target="_blank">${record.name}</a></h3>
                <p>${record.description}</p>
                <div class="archive-item-footer">
                    <span class="source-tag">${record.source.toUpperCase()}</span>
                    ${record.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            </div>
            <div class="archive-item-actions">
                <a href="${record.path}" download class="btn-icon" title="Download Record">📥</a>
                <a href="${record.path}" target="_blank" class="btn-icon" title="Open in New Tab">↗</a>
            </div>
        </div>
    `).join('');

    const loadMore = document.getElementById('loadMore');
    if (end >= filteredRecords.length) {
        loadMore.style.display = 'none';
    } else {
        loadMore.style.display = 'block';
    }
}
