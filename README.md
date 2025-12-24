# Epstein Investigation Dashboard

A comprehensive data analysis dashboard visualizing 18,550 files from the Epstein investigation.

## Features

- **Key Persons Tracker** - 23 individuals categorized by role (subjects, legal, associates)
- **Critical Findings** - 8 major discoveries from document analysis
- **Evidence Categories** - Media counts and file type breakdown
- **Hidden Emails** - Discovered email addresses from redaction scans
- **Location Mapping** - Key properties and sites

## Data Summary

| Metric | Count |
|--------|-------|
| Total Files | 18,550 |
| PDF Documents | 14,700 |
| Videos | 887 |
| Images | 6,775 |
| DAT Records | 29,408 |

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Deploy from the dashboard directory:

   ```bash
   cd dashboard
   vercel
   ```

3. Follow the prompts to connect your account and deploy.

### Local Development

Simply open `index.html` in a browser, or use a local server:

```bash
cd dashboard
npx serve
```

## Technology Stack

- Pure HTML/CSS/JavaScript (no framework dependencies)
- Modern CSS Grid layout
- Dark theme with gold accent color scheme
- Responsive design for mobile/tablet/desktop

## Data Sources

- DOJ Productions
- USVI Productions  
- Estate Productions
- Maxwell case exhibits

## License

This dashboard visualizes publicly released documents. Use responsibly.
