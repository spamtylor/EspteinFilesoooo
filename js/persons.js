// Persons Page JavaScript
// Handles filtering, searching, and rendering person cards

let allPersons = [];
let contactBook = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/persons.json');
        const data = await response.json();

        allPersons = data.key_persons || [];
        contactBook = data.contact_book_names || [];

        renderPersons(allPersons);
        renderContactBook(contactBook);
        setupFilters();
        setupSearch();
        updateCount(allPersons.length);

    } catch (error) {
        console.error('Error loading persons:', error);
    }
});

function renderPersons(persons) {
    const grid = document.getElementById('personsList');
    if (!grid) return;

    grid.innerHTML = persons.map(p => `
        <div class="person-card" data-category="${p.category || 'other'}">
            <div class="info">
                <h4>${p.name}</h4>
                <span class="role">${p.role || ''}</span>
                ${p.notes ? `<span class="notes">${p.notes}</span>` : ''}
            </div>
            <span class="mentions">${p.mentions || 0}</span>
        </div>
    `).join('');
}

function renderContactBook(names) {
    const tbody = document.getElementById('contactBookList');
    if (!tbody) return;

    tbody.innerHTML = names.map(name => `
        <tr>
            <td>${name}</td>
            <td><a href="docs/C. Contact Book_Redacted_0.pdf" target="_blank">Contact Book</a></td>
        </tr>
    `).join('');
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
