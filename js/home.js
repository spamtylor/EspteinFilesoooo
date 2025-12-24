// Homepage functionality
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/persons.json');
        const data = await response.json();

        // Show first 6 persons on homepage
        const preview = document.getElementById('personsPreview');
        if (preview && data.persons) {
            preview.innerHTML = data.persons.slice(0, 6).map(person => `
                <div class="person-card" data-category="${person.category}">
                    <div class="info">
                        <h4>${person.name}</h4>
                        <span class="role">${person.role}</span>
                    </div>
                    <span class="mentions">${person.mentions}×</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.log('Data loading:', error.message);
    }
});
