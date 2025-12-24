// Media Gallery - Virtual Folder Browser
document.addEventListener('DOMContentLoaded', async () => {
    const folderGrid = document.getElementById('folderGrid');
    const mediaGrid = document.getElementById('mediaGrid');
    const breadcrumb = document.getElementById('breadcrumb');
    const mediaModal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('modalContent');
    const modalClose = document.querySelector('.modal-close');

    let allMedia = [];
    let currentFolder = 'root';

    // 1. Initial Data Load
    async function loadMedia() {
        try {
            const response = await fetch('data/master_archive.json');
            const data = await response.json();

            // Access via records key
            const records = data.records || [];

            // Filter only media types
            allMedia = records.filter(item =>
                item.type === 'image' ||
                item.type === 'video' ||
                item.path.endsWith('.jpg') ||
                item.path.endsWith('.mp4')
            );

            renderFolders();
        } catch (error) {
            console.error('Gallery Engine Error:', error);
            mediaGrid.innerHTML = '<div class="error">Failed to load media manifest.</div>';
        }
    }

    // 2. Folder Extraction & Rendering
    function renderFolders() {
        mediaGrid.style.display = 'none';
        folderGrid.style.display = 'grid';
        breadcrumb.textContent = 'Root / Collections';

        // Unique collections from tags or path
        const collections = [...new Set(allMedia.map(item => item.collection || 'Uncategorized'))];

        folderGrid.innerHTML = collections.map(col => `
            <div class="folder-card" onclick="openFolder('${col}')" style="background: var(--bg-glass); border: 1px solid var(--border-subtle); padding: 20px; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s;">
                <div style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 12px;">📁</div>
                <div style="font-weight: 700; font-size: 0.85rem; text-transform: uppercase; color: var(--text-primary);">${col}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${allMedia.filter(m => m.collection === col).length} FILES</div>
            </div>
        `).join('');
    }

    // 3. Open Folder & Render Media
    window.openFolder = function (collection) {
        currentFolder = collection;
        folderGrid.style.display = 'none';
        mediaGrid.style.display = 'grid';
        breadcrumb.innerHTML = `<span onclick="location.reload()" style="cursor:pointer; text-decoration: underline;">Root</span> / ${collection}`;

        const folderItems = allMedia.filter(item => item.collection === collection);

        mediaGrid.innerHTML = folderItems.map(item => {
            const isVideo = item.path.endsWith('.mp4') || item.type === 'video';
            const thumb = isVideo ? 'https://placehold.co/400x225/12121a/fff?text=VIDEO+READY' : item.path;

            return `
                <div class="media-item" onclick="openModal('${item.path}', '${isVideo ? 'video' : 'image'}')" style="background: var(--bg-glass); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-subtle); cursor: pointer; transition: transform 0.2s;">
                    <div style="aspect-ratio: 16/9; background: #000; position: relative; overflow: hidden;">
                        <img src="${thumb}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
                        ${isVideo ? '<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #fff; background: rgba(0,0,0,0.3);">▶</div>' : ''}
                    </div>
                    <div style="padding: 12px;">
                        <div style="font-size: 0.7rem; font-family: 'JetBrains Mono'; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span style="font-size: 0.6rem; background: var(--accent-blue); padding: 1px 4px; border-radius: 2px;">${item.type.toUpperCase()}</span>
                            <span style="font-size: 0.6rem; color: var(--text-muted);">${item.id}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // 4. Modal Logic
    window.openModal = function (path, type) {
        mediaModal.style.display = 'flex';
        if (type === 'video') {
            modalContent.innerHTML = `
                <video controls autoplay style="max-width: 100%; border: 4px solid var(--accent-gold); border-radius: 8px;">
                    <source src="${path}" type="video/mp4">
                </video>
                <div style="padding: 20px; color: #fff;">PRODUCTION FILE: ${path}</div>
            `;
        } else {
            modalContent.innerHTML = `
                <img src="${path}" style="max-width: 100%; max-height: 80vh; border: 4px solid var(--accent-blue); border-radius: 8px;">
                <div style="padding: 20px; color: #fff;">EVIDENCE SNAPSHOT: ${path}</div>
            `;
        }
    };

    modalClose.onclick = () => mediaModal.style.display = 'none';
    mediaModal.onclick = (e) => { if (e.target === mediaModal) mediaModal.style.display = 'none'; };

    // Initial Start
    loadMedia();
});
