# Ownership prototype — README

This workspace contains a responsive multi-page prototype for the Ownership / LAGNAF entry flow:

- `index.html` — splash with pixelate logo
- `gateway.html` — choose a gateway (gated modal)
- `packages.html` — choose a package for the selected gateway
- `signup.html` — intake / CRM capture form
- `css/styles.css`, `js/app.js` — shared assets
- `api/send.js` — serverless handler that saves leads to SQLite and optionally sends email via Resend
- `server.js`, `package.json` — a minimal local dev server for testing
- `data/leads.db` — generated SQLite database used by the lead capture flow

Quick local test (node >= 18 recommended):

1. Install dependencies:

```powershell
cd "c:\Users\blunt\Desktop\lagnaf-entry"
npm install
```

2. Set your `RESEND_API_KEY` environment variable (recommended) and start the dev server:

```powershell
$env:RESEND_API_KEY = 'your_real_resend_api_key_here'
node server.js
```

3. Open http://localhost:3000 in your browser and walk through the flow.

Notes on the email handler:
- `api/send.js` stores every submission in SQLite first, then posts to Resend's `POST /emails` endpoint when `RESEND_API_KEY` is set.
- If the email step is unavailable, the request still stays in the database and the client receives a stored-only response.
- For hosting, deploy to a provider that supports serverless functions (Vercel, Netlify, Cloud Run) and set the env var there.

Fallbacks and safety:
- The client-side `signup.html` attempts to POST to `/api/send`. If that fails it saves captured leads to `localStorage` and exposes a `Download capture` button.
- Do not commit your API key to source control. Use environment variables in CI/CD or the host's secret manager.

Accessibility & simplicity:
- The site uses clear CTAs and step gating so a user can understand each doorway before continuing.
- To make the content even simpler for broader audiences (e.g., plain-language explanations for a child), edit the copy in each HTML file (`page-title`, `lead`, CTAs) to a simpler form.

Next recommended steps:
- Replace the demo `from` email in `api/send.js` with a verified sender for Resend.
- Add server-side persistence (database) and idempotency checks to avoid duplicates.
- Add automated tests around the API handler.
