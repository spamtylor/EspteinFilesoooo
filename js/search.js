document.addEventListener('DOMContentLoaded', () => {
    const headerSearch = document.getElementById('headerSearch');

    if (headerSearch) {
        headerSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = headerSearch.value.trim();
                if (query) {
                    window.location.href = `archive.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Auto-sync search input on Archive page
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const archiveSearch = document.getElementById('archiveSearch');

    if (query && archiveSearch) {
        archiveSearch.value = query;
        headerSearch.value = query;
        // The actual filtering is handled by archive.js which listens for DOMContentLoaded
    }
});
