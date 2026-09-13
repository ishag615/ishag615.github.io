# Isha Gupta Portfolio

A bright, interactive static portfolio for GitHub Pages. The About page is the landing page, with dedicated pages for computer science projects, art, student leadership, life outside the laptop, and awards. Contact links live in the footer on every page.

## Customize

- Replace placeholder copy in `index.html` with your real bio.
- Add real technical work to `projects.html`, organized by AI, web, data, systems, or whatever categories fit you best.
- Add artwork to `art.html`, organized by watercolor, acrylic, charcoal, pencil, photography, and experiments.
- Add initiatives to `leadership.html`, organized by professional, cultural, technical, and service work.
- Add recipes, workouts, hiking logs, and photography notes to `life.html`.
- Add honors, scholarships, certifications, and recognitions to `awards.html`.
- Replace the SVG placeholders in `assets/` with your real photos and project images. Keep the same filenames if you want the page to update automatically.
- Replace `assets/Isha-Gupta-Resume.pdf` with your real resume PDF.
- Update contact links in each page footer.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

To run the suggestion backend and admin view:

```bash
SUGGESTIONS_ADMIN_TOKEN="choose-a-long-random-token" npm start
```

Then visit:

- Site: `http://127.0.0.1:3000/projects.html`
- Admin suggestions: `http://127.0.0.1:3000/suggestions-admin.html`

Suggestions are saved locally to `data/suggestions.jsonl`, which is intentionally ignored by git. The admin page requires the same `SUGGESTIONS_ADMIN_TOKEN` value.

## Publish on GitHub Pages

1. Push this repository to GitHub.
2. Go to repository `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select the `main` branch and `/root` folder.
5. Save. GitHub will publish the site at your Pages URL.
