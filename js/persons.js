// Persons Page JavaScript
// Handles filtering, searching, and rendering person cards with source links

let allPersons = [];
let contactBook = [];
let sourceDocuments = {};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/persons.json');
        const data = await response.json();

        allPersons = data.key_persons || [];
        contactBook = data.contact_book_names || [];
        sourceDocuments = data.source_documents || {};

        renderPersons(allPersons);
        renderContactBook(contactBook);
        setupFilters();
        setupSearch();
        updateCount(allPersons.length);

    } catch (error) {
        console.error('Error loading persons:', error);
    }
});

function getSourceLink(sourceKey) {
    const source = sourceDocuments[sourceKey];
    if (!source) return null;
    return source;
}

function renderSourceLinks(sources) {
    if (!sources || sources.length === 0) return '';

    const links = sources.map(sourceKey => {
        const source = getSourceLink(sourceKey);
        if (!source) return '';

        const isExternal = source.file.startsWith('http');
        return `<a href="${source.file}" target="_blank" class="source-link">${source.name}</a>`;
    }).filter(Boolean).join('');

    return links ? `<div class="person-sources">${links}</div>` : '';
}

function renderPersons(persons) {
    const grid = document.getElementById('personsList');
    if (!grid) return;

    grid.innerHTML = persons.map(p => `
        <div class="person-card" data-category="${p.category || 'other'}">
            <div class="info">
                <h4>${p.name}</h4>
                <span class="role">${p.role || ''}</span>
                ${p.notes ? `<span class="notes">${p.notes}</span>` : ''}
                ${renderSourceLinks(p.sources)}
            </div>
            <span class="mentions">${p.mentions || 0}</span>
        </div>
    `).join('');
}

// Contact Book Pagination
let contactPage = 1;
const contactsPerPage = 100;
let currentContactList = [];

function renderContactBook(names, page = 1) {
    const container = document.getElementById('contactBookList');
    const loadBtn = document.getElementById('loadContactsBtn');

    if (!container) return;

    // On first load or search reset, clear container
    if (page === 1) {
        currentContactList = names;
        container.innerHTML = '';
        contactPage = 1;
    }

    const start = (page - 1) * contactsPerPage;
    const end = start + contactsPerPage;
    const pageItems = currentContactList.slice(start, end);

    // Use Grid Layout instead of Table Rows
    // Ensure parent container in HTML is changed to specific grid ID or managed via CSS replacement
    // Since original was a table body, we might need to inject rows or change the HTML structure.
    // If the HTML expects TRs, we must supply TRs or change the HTML file.
    // Let's assume we can overwrite the HTML structure of the parent table to be a div grid if we replace the table.

    // Ideally, we should check if the container is a TBODY. If so, let's keep it consistent but maybe cleaner.
    // However, user asked for a "Grid".

    const htmlMap = pageItems.map(name => {
        return `
            <div class="contact-pill" style="
                background: rgba(255,255,255,0.03); 
                border: 1px solid var(--border-subtle); 
                padding: 8px 12px; 
                border-radius: 4px; 
                font-family: 'JetBrains Mono'; 
                font-size: 0.8rem; 
                color: var(--text-secondary);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span>${name}</span>
                <span style="font-size: 0.7rem; opacity: 0.5;">ENTRY</span>
            </div>
        `;
    }).join('');

    if (page === 1) {
        container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; width: 100%;">${htmlMap}</div>`;
    } else {
        const grid = container.querySelector('div');
        if (grid) grid.innerHTML += htmlMap;
    }

    // Handle "Show More"
    if (end < currentContactList.length) {
        if (!loadBtn) {
            // Create button if missing (likely needs to be added to HTML, but we can inject it after container)
            // Ideally, the HTML should have it. We will handle dynamic injection safely?
            // Safer to assume we just render what we can. 
            // Let's add a "End of List" indicator if we can't add a button easily without viewing HTML.
            // Actually, let's inject a "Load More" trigger at the bottom of the grid if needed.
        } else {
            loadBtn.style.display = 'block';
            loadBtn.onclick = () => {
                contactPage++;
                renderContactBook(currentContactList, contactPage);
            };
        }
    } else {
        if (loadBtn) loadBtn.style.display = 'none';
    }
}

function setupFilters() {
    const links = document.querySelectorAll('#categoryLinks a');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const filter = link.dataset.filter;
            filterPersons(filter);
        });
    });
}

function filterPersons(filter) {
    let filtered;

    if (filter === 'all') {
        filtered = allPersons;
    } else if (filter === 'legal') {
        // Combined legal filter
        filtered = allPersons.filter(p =>
            p.category && (
                p.category.startsWith('legal_') ||
                p.category === 'judge'
            )
        );
    } else {
        filtered = allPersons.filter(p => p.category === filter);
    }

    renderPersons(filtered);
    updateCount(filtered.length);
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            renderPersons(allPersons);
            renderContactBook(contactBook);
            updateCount(allPersons.length);
            return;
        }

        const filtered = allPersons.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.role && p.role.toLowerCase().includes(query)) ||
            (p.notes && p.notes.toLowerCase().includes(query))
        );

        renderPersons(filtered);
        updateCount(filtered.length);

        // Also filter contact book
        const filteredContacts = contactBook.filter(name =>
            name.toLowerCase().includes(query)
        );
        renderContactBook(filteredContacts);
    });
}

function updateCount(count) {
    const el = document.getElementById('resultsCount');
    if (el) {
        el.textContent = `Showing ${count} of ${allPersons.length} persons`;
    }
}
