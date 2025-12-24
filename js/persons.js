// Persons page functionality
let allPersons = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/persons.json');
        const data = await response.json();
        allPersons = data.persons;

        renderPersons(allPersons);
        renderContactBook(data.contact_book_names);
        setupFilters();
        setupSearch();
    } catch (error) {
        console.error('Error loading data:', error);
    }
});

function renderPersons(persons) {
    const container = document.getElementById('personsList');
    if (!container) return;

    container.innerHTML = persons.map(person => `
        <div class="person-card" data-category="${person.category}" data-name="${person.name.toLowerCase()}">
            <div class="info">
                <h4>${person.name}</h4>
                <span class="role">${person.role}</span>
            </div>
            <span class="mentions">${person.mentions}×</span>
        </div>
    `).join('');
}

function renderContactBook(names) {
    const container = document.getElementById('contactBookList');
    if (!container) return;

    container.innerHTML = names.map(name => `
        <tr>
            <td>${name}</td>
            <td><a href="docs/C_Contact_Book.pdf">Contact Book (PDF)</a></td>
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
            const filtered = filter === 'all'
                ? allPersons
                : allPersons.filter(p => p.category === filter);

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
            p.role.toLowerCase().includes(query)
        );
        renderPersons(filtered);
    });
}
