# Founder Era — signup form

A single-page, sunlit signup form for the Founder Era community. Static HTML/CSS/JS, no framework, no build step. Submissions land in a Google Sheet via a Google Apps Script Web App.

## Files

| File | What it is |
|---|---|
| `index.html` | The page (form state + "you're on the list." state) |
| `styles.css` | All the warmth: gradients, grid texture, grain, sheen |
| `app.js` | Form logic, city autocomplete, validation, Sheet POST — **paste your endpoint URL here** |
| `cities.js` | Bundled world-cities list (~4,850 cities, India-first ordering) |
| `apps-script.gs` | The Google Apps Script backend — paste into script.google.com |
| `fonts/` | Self-hosted Fraunces + Inter (latin subsets) |
| `og.png` / `favicon.svg` | Social preview image + tab icon |

## Connect the Google Sheet (one-time, ~5 minutes)

1. **Create the Sheet** — go to [sheets.new](https://sheets.new), name it something like `Founder Era signups`.
2. **Open Apps Script** — in that Sheet: **Extensions → Apps Script**. A code editor opens.
3. **Paste the script** — delete the placeholder `myFunction` code and paste the entire contents of `apps-script.gs`. Save (Ctrl/Cmd+S).
4. **Deploy as Web App** — click **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**. Set:
   - *Description:* anything
   - *Execute as:* **Me**
   - *Who has access:* **Anyone** ← important, this is what lets the form post to it
   Click **Deploy**.
5. **Authorize** — Google will ask you to authorize the script. Choose your account → "Advanced" → "Go to … (unsafe)" → **Allow**. (It's your own script; the scary wording is standard.)
6. **Copy the Web App URL** — it looks like `https://script.google.com/macros/s/AKfycb…/exec`. Copy it.
7. **Paste it into the form** — open `app.js` and set the first line of config:
   ```js
   const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycb…/exec";
   ```
   Commit/redeploy. Done — every submission now appends a row: **Timestamp · Name · Date of birth · City · Journey stage · LinkedIn · Email · WhatsApp · Submissions · Last updated**.

Until the endpoint is set, the form runs in **preview mode**: the confirmation screen works, but submissions are only logged to the browser console, not saved.

**Duplicates:** if the same email submits twice, the script updates the existing row (latest answers win) and bumps its "Submissions" count instead of adding a new row.

**To update the script later:** edit the code, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (the URL stays the same).

## Deploying the page

Any static host works — the whole site is this folder.

- **Vercel:** [vercel.com/new](https://vercel.com/new) → import this GitHub repo → framework preset "Other" → Deploy.
- **Netlify:** [app.netlify.com/start](https://app.netlify.com/start) → import this repo → no build command, publish directory `/` → Deploy.
- **GitHub Pages:** repo Settings → Pages → deploy from branch.

## Regenerating the city list

`cities.js` is generated from GeoNames data via the `all-the-cities` npm package: all Indian cities ≥ 50k population (largest first), then world cities ≥ 100k. The autocomplete is a convenience, not a gate — free-typed cities are always accepted.
