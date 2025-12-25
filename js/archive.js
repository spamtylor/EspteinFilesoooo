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
    setupSort();
});

function setupFilters() {
    // Type Filters (Sidebar)
    document.getElementById('typeFilters')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();
        document.querySelectorAll('#typeFilters a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        applyFilters();
    });

    // Collection Filters (Sidebar)
    document.getElementById('collectionFilters')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();
        document.querySelectorAll('#collectionFilters a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        applyFilters();
    });


    // Source Filters (Sidebar - NEW)
    document.getElementById('sourceFilters')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();
        document.querySelectorAll('#sourceFilters a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        applyFilters();
    });

    // Load More
    document.getElementById('loadMore')?.addEventListener('click', () => {
        currentPage++;
        renderArchive();
    });
}

function setupSort() {
    document.getElementById('sortOptions')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();

        // Update Active State
        document.querySelectorAll('#sortOptions a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        applyFilters();
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
    const sourceFilter = document.querySelector('#sourceFilters a.active')?.dataset.source || 'all';
    const sortParams = document.querySelector('#sortOptions a.active')?.dataset.sort || 'date-desc';
    const searchQuery = document.getElementById('archiveSearch')?.value.toLowerCase() || '';

    // Initialize Fuse if not ready (and we have data)
    if (!window.fuse && archiveData.records.length > 0) {
        const options = {
            keys: ['name', 'tags', 'description', 'collection'],
            threshold: 0.4, // Increased sensitivity for "island", "plane"
            ignoreLocation: true
        };
        window.fuse = new Fuse(archiveData.records, options);
    }

    // filtering logic
    let results = archiveData.records;

    // Apply Search First (if any)
    if (searchQuery && window.fuse) {
        // Fuse returns { item: ... } structure
        results = window.fuse.search(searchQuery).map(result => result.item);
    }

    // Apply Filters
    filteredRecords = results.filter(record => {
        const matchesType = typeFilter === 'all' || record.type === typeFilter;
        const matchesSource = sourceFilter === 'all' || record.source === sourceFilter;
        const matchesCollection = collectionFilter === 'all' || record.collection === collectionFilter;

        return matchesType && matchesSource && matchesCollection;
    });

    // Apply Sort
    filteredRecords.sort((a, b) => {
        switch (sortParams) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'relevance':
                // Use default order (Fuse results are already by relevance)
                // If not searching, relevance = date-desc usually
                return searchQuery ? 0 : new Date(b.date) - new Date(a.date);
            default:
                return new Date(b.date) - new Date(a.date);
        }
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
            ${(record.type === 'image' || record.tags.includes('jpg') || record.tags.includes('png')) ?
            `<div class="archive-item-preview">
                    <img src="${record.path}" alt="${record.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'archive-item-icon image\'></div>'">
                 </div>` :
            `<div class="archive-item-icon ${record.type}"></div>`
        }
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
