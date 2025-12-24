document.addEventListener('DOMContentLoaded', () => {
    const headerSearch = document.getElementById('headerSearch');

    if (headerSearch) {
        headerSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = headerSearch.value.trim();
                window.location.href = `archive.html?q=${encodeURIComponent(query)}`;
            }
        });
    }

    // Auto-focus archive search if parameters exist
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query && document.getElementById('archiveSearch')) {
        const archiveSearch = document.getElementById('archiveSearch');
        archiveSearch.value = query;
        // Trigger the search logic in archive.js by dispatching an input event
        setTimeout(() => {
            archiveSearch.dispatchEvent(new Event('input'));
        }, 100);
    }
});
