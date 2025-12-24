// Load data and populate dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        populatePersons(data.key_persons);
        populateContactNames(data.contact_book_names);
        populateFindings(data.key_findings);
        populateEvidence(data.evidence_categories);
        populateEmails(data.hidden_emails_found);
        populateLocations(data.locations);
        
        setupFilters(data.key_persons);
    } catch (error) {
        console.error('Error loading data:', error);
    }
});

function populatePersons(persons) {
    const container = document.getElementById('personsList');
    container.innerHTML = persons.map(person => `
        <div class="person-item ${person.category}" data-category="${person.category}">
            <div>
                <div class="name">${person.name}</div>
                <div class="role">${person.role}</div>
            </div>
            <div class="mentions">${person.mentions}×</div>
        </div>
    `).join('');
}

function populateContactNames(names) {
    const container = document.getElementById('contactNames');
    container.innerHTML = names.map(name => `
        <span class="tag">${name}</span>
    `).join('');
}

function populateFindings(findings) {
    const container = document.getElementById('findingsList');
    container.innerHTML = findings.map(finding => `
        <div class="finding-item ${finding.significance === 'Critical' ? 'critical' : ''}">
            <h3>${finding.title}</h3>
            <p>${finding.description}</p>
            <div class="source">Source: ${finding.source}</div>
        </div>
    `).join('');
}

function populateEvidence(categories) {
    const container = document.getElementById('evidenceGrid');
    container.innerHTML = categories
        .filter(cat => cat.count)
        .map(cat => `
            <div class="evidence-item">
                <div class="count">${cat.count.toLocaleString()}</div>
                <div class="label">${cat.category}</div>
            </div>
        `).join('');
}

function populateEmails(emails) {
    const container = document.getElementById('emailsList');
    container.innerHTML = emails.map(email => `
        <div class="email-item">
            <div class="email">${email.email}</div>
            <div class="associated">→ ${email.associated}</div>
        </div>
    `).join('');
}

function populateLocations(locations) {
    const container = document.getElementById('locationsList');
    const icons = {
        'Residence': '🏠',
        'Private Island': '🏝️',
        'Property': '🏗️'
    };
    
    container.innerHTML = locations.map(loc => `
        <div class="location-item">
            <div class="icon">${icons[loc.type] || '📍'}</div>
            <div>
                <div class="name">${loc.name}</div>
                <div class="type">${loc.type}${loc.location ? ` • ${loc.location}` : ''}</div>
            </div>
        </div>
    `).join('');
}

function setupFilters(persons) {
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter persons
            const filter = btn.dataset.filter;
            const items = document.querySelectorAll('.person-item');
            
            items.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}
