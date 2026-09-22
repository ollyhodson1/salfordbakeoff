# Great Salford Bake Off

A static React website designed for GitHub Pages, with Google Sheets acting as the control panel/database through a Google Apps Script web app.

## Structure

- `docs/` — deploy this folder with GitHub Pages.
- `docs/config.js` — paste the deployed Apps Script web-app URL here and change `DEMO_MODE` to `false`.
- `google-apps-script/Code.gs` — backend that reads the control Google Sheet and records votes.

## GitHub Pages

1. Upload this project to a GitHub repository.
2. Go to **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Choose the main branch and the `/docs` folder.
5. Save.

No build step is required. The website uses React modules directly in the browser.
