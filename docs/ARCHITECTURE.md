# Architecture: MuniLink landing page

How the page is put together, as on `main` at `23363eb` (19 Jul 2026) plus this docs pass. Update this file in the same commit as any change to the page structure, scripts, styles, server or tests (see `AGENTS.md`).

## 1. Shape in one picture

```
index.html ── <link styles.css> ── <script app.js> ── assets/munilink-logo.svg (+ .png fallback, favicon)
     │                                   │
     │                                   ├─ header / mobile menu / contact <dialog> (View Transitions when available)
     │                                   ├─ TopographicShader: WebGL2 → WebGL → CSS .terrain fallback
     │                                   └─ tilt + spotlight pointer effects, footer year
     ▼
npm start ── scripts/server.mjs (static files from the current folder, port $PORT or 4173)
npm test  ── node --test ── test/site.test.mjs (reads the files as text; no browser)
```

No build step, no runtime dependencies. External requests on `main`: Google Fonts (Outfit, Inter).

## 2. File-by-file map

| Path | Role |
|---|---|
| `index.html` | The page (321 lines). |
| `styles.css` | All styles (design tokens, layout, components, motion; 453 lines). |
| `app.js` | All behaviour (262 lines). |
| `assets/munilink-logo.svg` | Logo, used via `<picture>` `srcset`. |
| `assets/munilink-logo.png` | Logo fallback `src` and favicon (`rel="icon"`). |
| `scripts/server.mjs` | Dependency-free Node static server: maps `/` to `index.html`, refuses paths outside the root, 404 for missing files or folders, `cache-control: no-cache`, MIME types for css/html/js/svg. |
| `test/site.test.mjs` | Six `node:test` tests (section 6). |
| `package.json` | `name munilink-landing-page`, `type: module`, scripts `start` (`node scripts/server.mjs`) and `test` (`node --test`). No dependencies. |
| `.agents/skills/<name>/SKILL.md` (+ `stitch-design-taste/DESIGN.md`) | 13 design skills for coding agents (brandkit, design-taste-frontend, design-taste-frontend-v1, full-output-enforcement, gpt-taste, high-end-visual-design, image-to-code, imagegen-frontend-mobile, imagegen-frontend-web, industrial-brutalist-ui, minimalist-ui, redesign-existing-projects, stitch-design-taste). Not loaded by the page. |
| `skills-lock.json` | Source (`Leonxlnx/taste-skill`), path and hash for each skill. |
| `README.md`, `AGENTS.md`, `CHANGELOG.md`, `docs/*` | Overview, rules, history, handbook. |

## 3. Page structure (`index.html`)

- `<head>`: charset, viewport, `theme-color #020617`, description, favicon, Google Fonts preconnect + stylesheet (Inter 400/500/600, Outfit 500/600/700), `styles.css`.
- Skip target `#main`; header `[data-header]` with logo, `nav.primary-nav[aria-label="Primary navigation"]#primary-navigation` (Approach, Services, Evidence, Pricing), `.menu-toggle` button, "Request an AI audit" (`[data-open-dialog]`).
- `section.hero#top` with `h1#hero-title` ("Make AI useful."), canvas `#terrain` (`aria-hidden`), SVG gradients `#glow` and `#coast` in the decorative artwork, `[data-tilt]` stage.
- Statement `h2#statement-title` ("Start with the municipal decision.") and the `.decision-lens` block with three questions.
- `section.process#approach` (`h2#process-title`, four `.process-number` / `.process-title` / `.process-meta` steps).
- `section.services#services` (`h2#services-title`, `[data-spotlight]` cards).
- `section.evidence#evidence` (`h2#evidence-title` "Evidence, without overclaiming.", items labelled In progress).
- `section.pricing#pricing` (`h2#pricing-title`; "Public pricing has not yet been published").
- Resources (`h2#resources-title`), `section.contact#contact` (`h2#contact-title`).
- `dialog.contact-dialog[data-dialog]` (`h2#dialog-title` "The contact channel is almost ready.", close buttons `[data-close-dialog]`).
- Footer with `[data-year]`.

## 4. `app.js`

1. `motionQuery` = `prefers-reduced-motion: reduce`; `transition(cb)` wraps DOM changes in `document.startViewTransition` when available and motion is allowed.
2. Header gets `is-scrolled` after 120 px.
3. Mobile menu: `.menu-toggle` toggles `aria-expanded` and `.primary-nav.is-open`; clicking a nav link closes it.
4. Dialog: `[data-open-dialog]` → `showModal()`, `[data-close-dialog]` or a backdrop click → `close()`.
5. `[data-year]` = current year.
6. `class TopographicShader`: tries `getContext("webgl2")`, then `getContext("webgl")`; does not start when reduced motion is preferred, WebGL is missing, or `navigator.connection?.saveData` is true (CSS `.terrain { display: none }` fallback). Device pixel ratio capped at 1.5; resizes with the canvas bounds.
7. `[data-tilt]` stage tilts with the pointer (`--tilt-x`, `--tilt-y`, resting at `0deg` / `-3deg`); `[data-spotlight]` cards follow the pointer.

## 5. `styles.css`

- Tokens: `--slate-950 #020617`, `--slate-900 #0f172a`, `--slate-850 #131d31`, `--slate-800 #1e293b` ... `--slate-50 #f8fafc`; `--cyan-400 #22d3ee`, `--cyan-300 #67e8f9`, `--cyan-500 #06b6d4`, `--cyan-600 #0891b2`, `--cyan-700 #0e7490`, `--cyan-oklch 72% 0.14 205`; `--shell min(1240px, calc(100vw - 48px))`; `--display "Outfit"`, `--body "Inter"`; `--ease`, `--ease-spring` (CSS `linear()` spring).
- Section themes: `section-light`, `section-dark`, `section-mist`.
- Media queries: `max-width 1040px` / `min-width 1041px` (navigation), `max-width 760px`, `prefers-reduced-motion: reduce`, `prefers-contrast: more`.

## 6. Tests (`test/site.test.mjs`)

| Test | Checks |
|---|---|
| single h1 and labelled navigation | exactly one `<h1`; `<nav ... aria-label="Primary navigation">` |
| in-page targets exist | every `href="#x"` has `id="x"` |
| motion and rendering fallbacks | `prefers-reduced-motion: reduce` in CSS; `.terrain { display: none`; `getContext("webgl2"` and `getContext("webgl"` and `navigator.connection?.saveData` in JS |
| key sections and honest qualifiers | ids approach, services, evidence, pricing, contact; "In progress"; "Public pricing has not yet been published"; "has not been provided yet" |
| decision lens | `class="page-shell decision-lens`; the three questions |
| branding | both logo files non-empty; SVG `srcset`, PNG `src`, PNG favicon |

Result on 29 Oct 2026: 6 passing (`npm test`).

## 7. Deploy

Nothing in this repository configures hosting (no workflow, no host config file). Any static host can serve the folder as is.

## 8. Accessibility

One `h1`, labelled navigation, "Skip to content" link to `#main`, native `<dialog>` with labelled title and close button, `aria-expanded` on the menu button, reduced-motion and high-contrast media queries, static fallback for the shader, decorative layers kept out of the reading order.
