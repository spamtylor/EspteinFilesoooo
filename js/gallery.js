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
            // Updated to fetch the new Production Manifest
            const response = await fetch('manifest.json');
            const data = await response.json();

            // Access via files key (new schema)
            const records = data.files || [];

            // Filter only media types
            allMedia = records.filter(item =>
                item.file_type === 'image' ||
                item.file_type === 'video' ||
                item.file_type === 'document' ||
                item.filename.endsWith('.jpg') ||
                item.filename.endsWith('.mp4') ||
                item.filename.endsWith('.pdf')
            );

            renderFolders();
        } catch (error) {
            console.error('Gallery Engine Error:', error);
            // Fallback to old archive if manifest fails
            console.warn('Manifest failed, trying master_archive.json fallback...');
            try {
                const response = await fetch('data/master_archive.json');
                const data = await response.json();
                allMedia = (data.records || []).map(r => ({
                    filename: r.name,
                    relative_path: r.path,
                    collection_name: r.collection,
                    file_type: r.type
                }));
                renderFolders();
            } catch (e) {
                mediaGrid.innerHTML = '<div class="error">Failed to load media manifest.</div>';
            }
        }
    }

    // 2. Folder Extraction & Rendering
    function renderFolders() {
        mediaGrid.style.display = 'none';
        folderGrid.style.display = 'grid';
        breadcrumb.textContent = 'Root / Collections';

        // Unique collections
        const collections = [...new Set(allMedia.map(item => item.collection_name || 'Uncategorized'))].sort();

        // Render Grid
        folderGrid.innerHTML = collections.map(col => `
            <div class="folder-card" onclick="openFolder('${col}')" style="background: var(--bg-glass); border: 1px solid var(--border-subtle); padding: 20px; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s;">
                <div style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 12px;">📁</div>
                <div style="font-weight: 700; font-size: 0.85rem; text-transform: uppercase; color: var(--text-primary);">${col}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${allMedia.filter(m => m.collection_name === col).length} FILES</div>
            </div>
        `).join('');

        // Render Sidebar Filters (Dynamic)
        renderSidebar(collections);
    }

    function renderSidebar(collections) {
        const sidebarList = document.getElementById('productionFilters');
        if (sidebarList) {
            // Keep the 'All Collections' link (first child)
            const allLink = sidebarList.firstElementChild.outerHTML;

            const dynamicLinks = collections.map(col => `
                <li><a href="#" data-folder="${col}">${col}</a></li>
             `).join('');

            sidebarList.innerHTML = allLink + dynamicLinks;
        }
    }

    // 3. Open Folder & Render Media
    window.openFolder = function (collection) {
        currentFolder = collection;
        folderGrid.style.display = 'none';
        mediaGrid.style.display = 'grid';
        breadcrumb.innerHTML = `<span onclick="location.reload()" style="cursor:pointer; text-decoration: underline;">Root</span> / ${collection}`;

        const folderItems = allMedia.filter(item => item.collection_name === collection);
        renderMediaList(folderItems);
    };

    // 4. Modal Logic
    window.openModal = function (path, type) {
        mediaModal.style.display = 'flex';
        // Ensure path is properly encoded
        const safePath = encodeURI(path);

        if (type === 'video') {
            modalContent.innerHTML = `
                <video id="modalVideoPlayer" controls autoplay style="max-width: 100%; border: 4px solid var(--accent-gold); border-radius: 8px; box-shadow: 0 0 30px rgba(226,183,64,0.2);">
                    <source src="${safePath}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div style="padding: 20px; color: #fff; font-family: 'JetBrains Mono';">PRODUCTION FILE: ${path}</div>
            `;
        } else if (type === 'document' || type === 'pdf') {
            modalContent.innerHTML = `
                <iframe src="${safePath}" style="width: 100%; height: 80vh; border: 4px solid var(--accent-gold); border-radius: 8px; background: white;"></iframe>
                <div style="padding: 20px; color: #fff; font-family: 'JetBrains Mono';">EVIDENCE RECORD: ${path}</div>
            `;
        } else {
            modalContent.innerHTML = `
                <img src="${safePath}" style="max-width: 100%; max-height: 80vh; border: 4px solid var(--accent-blue); border-radius: 8px; box-shadow: 0 0 30px rgba(59,130,246,0.2);">
                <div style="padding: 20px; color: #fff; font-family: 'JetBrains Mono';">EVIDENCE SNAPSHOT: ${path}</div>
            `;
        }
    };

    function closeModal() {
        mediaModal.style.display = 'none';
        modalContent.innerHTML = ''; // Clear content to stop video
    }

    modalClose.onclick = closeModal;
    mediaModal.onclick = (e) => { if (e.target === mediaModal) closeModal(); };

    // 5. Sidebar Filter Logic
    document.querySelector('.sidebar')?.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        e.preventDefault();

        // Update active state
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        const folder = link.dataset.folder;
        const type = link.dataset.type;

        if (folder) {
            if (folder === 'root') {
                renderFolders();
            } else {
                // Direct match for dynamic folders
                openFolder(folder);
            }
        }

        if (type) {
            // Filter global media by type
            folderGrid.style.display = 'none';
            mediaGrid.style.display = 'grid';
            breadcrumb.textContent = `Root / Filter: ${type.toUpperCase()}`;

            const typeItems = allMedia.filter(item => item.filename.endsWith(type) || item.file_type === type);
            renderMediaList(typeItems);
        }
    });

    function renderMediaList(items) {
        if (items.length === 0) {
            mediaGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">No media found for this filter.</div>';
            return;
        }

        // Pagination or limiting for performance (render first 100)
        const displayItems = items.slice(0, 100);

        mediaGrid.innerHTML = displayItems.map(item => {
            const isVideo = item.filename.endsWith('.mp4') || item.file_type === 'video';
            const isPdf = item.filename.endsWith('.pdf') || item.file_type === 'document';

            // Determine Thumbnail
            let thumb = item.relative_path;
            let typeLabel = 'IMAGE';
            let typeIcon = '';

            if (isVideo) {
                thumb = 'https://placehold.co/400x225/12121a/fff?text=VIDEO+PLAYER';
                typeLabel = 'VIDEO';
                typeIcon = '<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #fff; background: rgba(0,0,0,0.3);">▶</div>';
            } else if (isPdf) {
                thumb = 'https://placehold.co/400x225/2a1212/fff?text=PDF+DOCUMENT';
                typeLabel = 'PDF';
            }

            return `
                <div class="media-item" onclick="openModal('${item.relative_path}', '${isVideo ? 'video' : (isPdf ? 'pdf' : 'image')}')" style="background: var(--bg-glass); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-subtle); cursor: pointer; transition: transform 0.2s;">
                    <div style="aspect-ratio: 16/9; background: #000; position: relative; overflow: hidden;">
                        <img src="${thumb}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
                        ${typeIcon}
                    </div>
                    <div style="padding: 12px;">
                        <div style="font-size: 0.7rem; font-family: 'JetBrains Mono'; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.filename}</div>
                         <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span style="font-size: 0.6rem; background: var(--accent-blue); padding: 1px 4px; border-radius: 2px;">${typeLabel}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (items.length > 100) {
            mediaGrid.innerHTML += `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-muted);">+${items.length - 100} more items (Filter to see specific files)</div>`;
        }
    }

    // Initial Start
    loadMedia();
});
