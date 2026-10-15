# MuniLink landing page

Conversion page for MuniLink: **Audit evidence, ready before the auditors arrive.**
Problem-first hero → three pains (SCM award files, records, approvals) → how a readiness
check works → free SCM award-file checklist (`checklist.html`) → discovery-call intake form.

## Run locally

```bash
npm start
```

Open <http://localhost:4173>.

## Validate

```bash
npm test
```

## Intake form

The form needs no backend. On submit it validates the fields, then opens the visitor's email
app with a prefilled message to munilink.agency@gmail.com and shows a thank-you state linking
to the checklist. The logic lives in `form.js` (pure functions, unit tested).

To switch to a form service later, set `FORM_ENDPOINT` in `form.js`:
- **Formspree**: `"https://formspree.io/f/<id>"` – the form is POSTed as JSON.
- **Google Forms**: `"https://docs.google.com/forms/d/e/<FORM_ID>/formResponse"` and fill
  `GOOGLE_FORM_ENTRY_IDS` with each question's `entry.<id>`.

When an endpoint is set, update the line under the submit button ("This opens your email app…").

## Notes
- Open Graph tags use the relative path `assets/og-image.png`; replace with an absolute URL once the domain is known.
- No runtime dependencies or build step. The hero uses a small raw WebGL shader with a CSS
  fallback and becomes static when reduced motion is preferred.
