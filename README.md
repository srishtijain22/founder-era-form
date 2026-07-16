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
| `fonts/` | Self-hosted Fraunces + Inter (latin subsets) — stand-ins for the brand fonts (see below) |
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

**WhatsApp `#ERROR!` fix:** phone numbers begin with `+`, which Google Sheets reads as the start of a formula. The current script forces the WhatsApp column to plain-text format so the `+countrycode` is stored literally. If you deployed an older script and see `#ERROR!` in that column, paste the latest `apps-script.gs`, then in the editor pick the `healWhatsApp` function from the dropdown and click **Run** once — it recovers the numbers from the broken cells and rewrites the column as text. Then redeploy (**Manage deployments → ✏️ → New version**) so new submissions use the fix.

**To update the script later:** edit the code, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (the URL stays the same).

## Deploying the page

Any static host works — the whole site is this folder.

- **Vercel:** [vercel.com/new](https://vercel.com/new) → import this GitHub repo → framework preset "Other" → Deploy.
- **Netlify:** [app.netlify.com/start](https://app.netlify.com/start) → import this repo → no build command, publish directory `/` → Deploy.
- **GitHub Pages:** repo Settings → Pages → deploy from branch.

## Brand fonts (Canela + Söhne)

The brand type system is **Canela Display / Canela Italic** (Commercial Type) and **Söhne** (Klim). Both are licensed fonts, so this repo ships free stand-ins: Fraunces (for Canela) and Inter (for Söhne). The CSS font stacks list the real fonts first — if you buy web licenses, drop the `Canela`/`Söhne` woff2 files in `fonts/`, add matching `@font-face` rules at the top of `styles.css`, and the whole site upgrades automatically with no other changes.

## Regenerating the city list

`cities.js` is generated from GeoNames data via the `all-the-cities` npm package: all Indian cities ≥ 50k population (largest first), then world cities ≥ 100k. The autocomplete is a convenience, not a gate — free-typed cities are always accepted.
