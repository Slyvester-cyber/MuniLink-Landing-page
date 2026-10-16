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

On submit the form validates the fields, then POSTs them as JSON to FormSubmit's AJAX endpoint
(`FORM_ENDPOINT` in `form.js`, free, no account), which emails them to munilink.agency@gmail.com
with the subject "New MuniLink discovery request – {municipality}". A hidden `_honey` field
catches bots. If the request fails (offline, blocked, form not activated) the visitor's email app
opens with a prefilled message instead. Set `FORM_ENDPOINT = ""` to use only the mailto flow.
FormSubmit sends a one-time activation email to the inbox on the first submission.

## Booking link

`BOOKING_URL` in `form.js` (https://cal.com/munilink/munilink-discovery-call) drives every "Book a 20-minute call" button (`data-booking`): nav, hero, thank-you state and checklist page. They open Cal.com in a new tab; the intake form (`#intake`) stays as the "Or send us a note" route.

## Checklist capture

`checklist.html` keeps all 15 items open. An optional form ("Email me the printable version…")
posts name, work email, municipality and POPIA consent to the same endpoint with the subject
"Checklist request – {municipality}".

## Notes
- Open Graph tags use the relative path `assets/og-image.png`; replace with an absolute URL once the domain is known.
- No runtime dependencies or build step. The hero uses a small raw WebGL shader with a CSS
  fallback and becomes static when reduced motion is preferred.
