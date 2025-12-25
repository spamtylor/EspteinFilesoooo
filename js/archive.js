// Master Archive - High-Density Browser with Featured Carousel
let archiveData = { records: [] };
let filteredRecords = [];
let currentPage = 1;
const recordsPerPage = 100;

// Featured items for carousel
let featuredItems = [];
let carouselIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    const archiveContainer = document.getElementById('archiveContainer');
    const recordCountDisplay = document.getElementById('recordCount');

    // Fetch and Initialize
    fetch('data/master_archive.json')
        .then(res => res.json())
        .then(data => {
            archiveData = data;

            // Select featured items (mix of types)
            selectFeaturedItems();
            renderCarousel();

            // Dynamic Collection Filter Generation
            const collections = [...new Set(data.records.map(r => r.collection))].sort();
            const filterList = document.getElementById('collectionFilters');
            if (filterList) {
                filterList.innerHTML = `<li><a href="#" data-collection="all" class="active">All Collections</a></li>` +
                    collections.map(col => `<li><a href="#" data-collection="${col.toLowerCase().replace(/ /g, '_')}">${col}</a></li>`).join('');
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
    setupCarouselControls();
});

function selectFeaturedItems() {
    // Get a mix of images, videos, and PDFs for the carousel
    const images = archiveData.records.filter(r => r.type === 'image').slice(0, 4);
    const videos = archiveData.records.filter(r => r.type === 'video').slice(0, 3);
    const docs = archiveData.records.filter(r => r.type === 'document').slice(0, 3);
    featuredItems = [...images, ...videos, ...docs].slice(0, 10);
}

function renderCarousel() {
    const carousel = document.getElementById('featuredCarousel');
    if (!carousel || featuredItems.length === 0) return;

    carousel.innerHTML = featuredItems.map((item, idx) => `
        <div class="carousel-item" onclick="openModal('${item.path}', '${item.type}', '${item.name.replace(/'/g, "\\'")}')">
            <div class="carousel-item-preview">
                ${item.type === 'image' ?
            `<img src="${item.path}" alt="${item.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'type-icon\\'>🖼</div>'">` :
            item.type === 'video' ?
                `<div class="type-icon">🎬</div>` :
                `<div class="type-icon">📄</div>`
        }
            </div>
            <div class="carousel-item-info">
                <span class="type-badge">${item.type}</span>
                <h4>${item.name}</h4>
            </div>
        </div>
    `).join('');

    updateCarouselIndicator();
}

function setupCarouselControls() {
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const carousel = document.getElementById('featuredCarousel');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -300, behavior: 'smooth' });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }
}

function updateCarouselIndicator() {
    const indicator = document.getElementById('carouselIndicator');
    if (indicator) {
        indicator.textContent = `${featuredItems.length} Featured`;
    }
}

function setupFilters() {
    // Type Filters (Sidebar)
    document.getElementById('typeFilters')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();

        // Update active state
        document.querySelectorAll('#typeFilters a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Apply filters immediately
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

    // Source Filters (Sidebar)
    document.getElementById('sourceFilters')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();

        document.querySelectorAll('#sourceFilters a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        applyFilters();
    });

    // Person Filters (Sidebar)
    document.getElementById('personFilters')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        e.preventDefault();

        document.querySelectorAll('#personFilters a').forEach(a => a.classList.remove('active'));
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
    // Get current filter values
    const typeFilter = document.querySelector('#typeFilters a.active')?.dataset.filter || 'all';
    const collectionFilter = document.querySelector('#collectionFilters a.active')?.dataset.collection || 'all';
    const sourceFilter = document.querySelector('#sourceFilters a.active')?.dataset.source || 'all';
    const personFilter = document.querySelector('#personFilters a.active')?.dataset.person || 'all';
    const sortParams = document.querySelector('#sortOptions a.active')?.dataset.sort || 'date-desc';
    const searchQuery = document.getElementById('archiveSearch')?.value.toLowerCase() || '';

    // Initialize Fuse if not ready (and we have data)
    if (!window.fuse && archiveData.records.length > 0) {
        const options = {
            keys: ['name', 'tags', 'description', 'collection'],
            threshold: 0.4,
            ignoreLocation: true
        };
        window.fuse = new Fuse(archiveData.records, options);
    }

    // Start with all records
    let results = archiveData.records;

    // Apply Search First (if any)
    if (searchQuery && window.fuse) {
        results = window.fuse.search(searchQuery).map(result => result.item);
    }

    // Apply Filters - FIXED LOGIC
    filteredRecords = results.filter(record => {
        // Type filter
        const matchesType = typeFilter === 'all' || record.type === typeFilter;

        // Collection filter - normalize both sides for comparison
        const recordCollection = record.collection.toLowerCase().replace(/ /g, '_');
        const matchesCollection = collectionFilter === 'all' ||
            recordCollection.includes(collectionFilter.replace(/_/g, ' ').toLowerCase()) ||
            recordCollection.includes(collectionFilter);

        // Source filter
        const matchesSource = sourceFilter === 'all' || (record.source && record.source === sourceFilter);

        // Person filter - check tags array
        const matchesPerson = personFilter === 'all' ||
            (record.tags && record.tags.includes(personFilter));

        return matchesType && matchesCollection && matchesSource && matchesPerson;
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
                return searchQuery ? 0 : new Date(b.date) - new Date(a.date);
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });

    currentPage = 1;
    document.getElementById('recordCount').textContent = `Found ${filteredRecords.length.toLocaleString()} records`;
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

    container.innerHTML += pageItems.map(record => {
        // Determine the thumbnail/icon to show
        let thumbnailHtml = '';
        if (record.type === 'image') {
            thumbnailHtml = `<div class="archive-item-preview">
                <img src="${record.path}" alt="${record.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'archive-item-icon\\'>🖼</div>'">
            </div>`;
        } else if (record.type === 'video') {
            thumbnailHtml = `<div class="archive-item-icon video">🎬</div>`;
        } else if (record.type === 'document') {
            thumbnailHtml = `<div class="archive-item-icon document">📄</div>`;
        } else {
            thumbnailHtml = `<div class="archive-item-icon other">📁</div>`;
        }

        return `
        <div class="archive-item" onclick="openModal('${record.path}', '${record.type}', '${record.name.replace(/'/g, "\\'")}')">
            ${thumbnailHtml}
            <div class="archive-item-content">
                <div class="archive-item-header">
                    <span class="record-id">${record.id}</span>
                    <span class="record-date">${record.date}</span>
                </div>
                <h3>${record.name}</h3>
                <p>${record.description}</p>
                <div class="archive-item-footer">
                    <span class="source-tag">${record.source.toUpperCase()}</span>
                    ${record.tags.slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            </div>
            <div class="archive-item-actions" onclick="event.stopPropagation();">
                <a href="${record.path}" download class="btn-icon" title="Download Record">📥</a>
                <a href="${record.path}" target="_blank" class="btn-icon" title="Open in New Tab">↗</a>
            </div>
        </div>
    `;
    }).join('');

    const loadMore = document.getElementById('loadMore');
    if (end >= filteredRecords.length) {
        loadMore.style.display = 'none';
    } else {
        loadMore.style.display = 'block';
    }
}

// Modal Viewer Functions
function openModal(url, type, name) {
    const modal = document.getElementById('mediaModal');
    const content = document.getElementById('modalContent');

    let html = '';
    if (type === 'image' || url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        html = `<img src="${url}" alt="${name}" style="max-width: 100%; max-height: 85vh; object-fit: contain;">
                <p style="color: #888; margin-top: 16px; font-size: 0.9rem;">${name}</p>`;
    } else if (type === 'video' || url.match(/\.(mp4|mov|webm|avi)$/i)) {
        html = `<video src="${url}" controls autoplay style="max-width: 100%; max-height: 85vh;">Your browser does not support video.</video>
                <p style="color: #888; margin-top: 16px; font-size: 0.9rem;">${name}</p>`;
    } else if (type === 'document' || url.match(/\.pdf$/i)) {
        html = `<iframe src="${url}" style="width: 80vw; height: 85vh; border: none; background: #fff;"></iframe>
                <p style="color: #888; margin-top: 16px; font-size: 0.9rem;">${name}</p>`;
    } else {
        window.open(url, '_blank');
        return;
    }

    content.innerHTML = html;
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('mediaModal');
    const content = document.getElementById('modalContent');
    content.innerHTML = '';
    modal.style.display = 'none';
}

// Close modal on background click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('mediaModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
