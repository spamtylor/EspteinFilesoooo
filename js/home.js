// Executive Briefing - Entity Intelligence Preview
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/persons.json');
        const data = await response.json();

        // Show highest impact entities (sorted by mentions)
        const preview = document.getElementById('personsPreview');
        if (preview && data.persons) {
            const highImpact = data.persons
                .sort((a, b) => b.mentions - a.mentions)
                .slice(0, 8);

            preview.innerHTML = highImpact.map(person => `
                <div class="person-card" style="border-left: 3px solid var(--accent-gold);">
                    <div class="info">
                        <span class="role" style="font-family: 'JetBrains Mono'; font-size: 0.7rem; color: var(--accent-gold);">${person.role.toUpperCase()}</span>
                        <h4 style="margin: 4px 0 8px 0;">${person.name}</h4>
                        <div style="display: flex; align-items: center; gap: 8px;">
                             <span class="stat-tag" style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${person.mentions} CITATIONS</span>
                        </div>
                    </div>
                    <div class="card-footer" style="margin-top: 16px; display: flex; gap: 8px;">
                        <a href="persons.html?name=${encodeURIComponent(person.name)}" class="btn btn-sm" style="font-size: 0.7rem; padding: 4px 10px; background: var(--bg-glass); border: 1px solid var(--border-subtle);">ANALYZE</a>
                        <a href="archive.html?q=${encodeURIComponent(person.name)}" class="btn btn-sm" style="font-size: 0.7rem; padding: 4px 10px; background: var(--bg-glass); border: 1px solid var(--border-subtle);">RECORDS</a>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Core Intelligence Loading Error:', error);
    }
});
