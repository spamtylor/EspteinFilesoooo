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

function renderContactBook(names) {
    const tbody = document.getElementById('contactBookList');
    if (!tbody) return;

    // Look up if person exists in key_persons for their sources
    tbody.innerHTML = names.map(name => {
        // Try to find this person in key_persons
        const person = allPersons.find(p =>
            p.name.toLowerCase() === name.toLowerCase() ||
            name.toLowerCase().includes(p.name.split(',')[0].toLowerCase())
        );

        let sourceLinks = '';
        if (person && person.sources) {
            sourceLinks = person.sources.map(sourceKey => {
                const source = getSourceLink(sourceKey);
                if (!source) return '';
                return `<a href="${source.file}" target="_blank">${source.name}</a>`;
            }).filter(Boolean).join(', ');
        } else {
            // Default to contact book
            const contactSource = sourceDocuments['contact_book'];
            sourceLinks = contactSource ?
                `<a href="${contactSource.file}" target="_blank">${contactSource.name}</a>` :
                'Contact Book';
        }

        return `
            <tr>
                <td>${name}</td>
                <td>${sourceLinks}</td>
            </tr>
        `;
    }).join('');
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
