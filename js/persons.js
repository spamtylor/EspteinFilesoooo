// Persons page functionality
let allPersons = [];
let contactBookNames = [];
let categories = {};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/persons.json');
        const data = await response.json();
        allPersons = data.persons;
        contactBookNames = data.contact_book_names || [];
        categories = data.categories || {};

        updateFilterCounts();
        renderPersons(allPersons);
        renderContactBook(contactBookNames);
        setupFilters();
        setupSearch();
    } catch (error) {
        console.error('Error loading data:', error);
    }
});

function updateFilterCounts() {
    // Update button counts
    const counts = {
        all: allPersons.length,
        coconspirator: 0,
        victim: 0,
        associate: 0,
        legal_prosecution: 0,
        legal_defense: 0,
        legal_victim: 0,
        judge: 0,
        law_enforcement: 0,
        government: 0,
        family: 0,
        witness: 0,
        media: 0
    };

    allPersons.forEach(p => {
        if (counts[p.category] !== undefined) {
            counts[p.category]++;
        }
    });

    // Update button text with counts
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filter = btn.dataset.filter;
        if (filter === 'all') {
            btn.textContent = `All (${counts.all})`;
        }
    });
}

function renderPersons(persons) {
    const container = document.getElementById('personsList');
    if (!container) return;

    if (persons.length === 0) {
        container.innerHTML = '<p class="text-muted">No persons match your search.</p>';
        return;
    }

    container.innerHTML = persons.map(person => `
        <div class="person-card" data-category="${person.category}" data-name="${person.name.toLowerCase()}">
            <div class="info">
                <h4>${person.name}</h4>
                <span class="role">${person.role}</span>
                ${person.notes ? `<span class="notes">${person.notes}</span>` : ''}
            </div>
            <span class="mentions">${person.mentions}×</span>
        </div>
    `).join('');
}

function renderContactBook(names) {
    const container = document.getElementById('contactBookList');
    if (!container || !names.length) return;

    container.innerHTML = names.map(name => `
        <tr>
            <td>${name}</td>
            <td><a href="docs/C. Contact Book_Redacted_0.pdf" target="_blank" download>Contact Book (PDF)</a></td>
        </tr>
    `).join('');
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            let filtered;

            if (filter === 'all') {
                filtered = allPersons;
            } else if (filter === 'legal') {
                // Legal includes prosecution, defense, and victim attorneys
                filtered = allPersons.filter(p =>
                    p.category.startsWith('legal_') || p.category === 'judge'
                );
            } else {
                filtered = allPersons.filter(p => p.category === filter);
            }

            renderPersons(filtered);
        });
    });
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allPersons.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.role.toLowerCase().includes(query) ||
            (p.notes && p.notes.toLowerCase().includes(query))
        );
        renderPersons(filtered);

        // Also filter contact book
        filterContactBook(query);
    });
}

function filterContactBook(query) {
    const container = document.getElementById('contactBookList');
    if (!container) return;

    const filtered = query
        ? contactBookNames.filter(n => n.toLowerCase().includes(query))
        : contactBookNames;

    container.innerHTML = filtered.map(name => `
        <tr>
            <td>${name}</td>
            <td><a href="docs/C. Contact Book_Redacted_0.pdf" target="_blank" download>Contact Book (PDF)</a></td>
        </tr>
    `).join('');
}
