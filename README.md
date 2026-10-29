# MuniLink landing page

A fast, accessible, single-page landing site for MuniLink, a venture serving South African local government. Static HTML, CSS and JavaScript with no runtime dependencies and no build step. The hero uses a small raw WebGL shader with a CSS fallback and becomes static when reduced motion or data saving is preferred.

| | |
|---|---|
| Repo | `Slyvester-cyber/MuniLink-Landing-page` (public), default branch `main` |
| Version on `main` | The July 2026 landing page ("Make AI useful." hero; sections Approach, Services, Evidence, Pricing, Contact). Last change on `main`: 19 Jul 2026. |
| Newer work | Branch `hark/redesign-preview` (open PR #3) rewrites the page around audit-evidence readiness with a checklist page, intake form and privacy page. Branch `ara/agent/repo-engineer-for-slyvester-cybe-ff4bb5c7` (open PR #2) self-hosts the fonts and adds an audit request flow. Neither is merged. |
| Tests | `npm test`: 6 passing (Node's built-in test runner). |
| Agents start at | `AGENTS.md`, then `docs/PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, `CHANGELOG.md` |

## Run locally

```bash
npm start
```

Open <http://localhost:4173> (set `PORT` to change it). The server is a tiny dependency-free static file server (`scripts/server.mjs`).

## Validate

```bash
npm test
```

The tests read `index.html`, `styles.css`, `app.js` and the logo files and check structure, in-page link targets, motion fallbacks, key sections and honest qualifiers, the decision-lens copy, and the logo wiring.

## What is on the page (`main`)

1. Header with the MuniLink logo, primary navigation (Approach, Services, Evidence, Pricing) and a "Request an AI audit" button that opens a dialog.
2. Hero (`#top`) with the WebGL "terrain" shader (CSS fallback).
3. Statement: "Start with the municipal decision.", with a decision lens of three questions (Is the need specific? Are the conditions real? Can people stay accountable?).
4. Approach (`#approach`): a four-step process.
5. Services (`#services`).
6. Evidence (`#evidence`): "Evidence, without overclaiming.", with items marked In progress.
7. Pricing (`#pricing`): says public pricing has not yet been published; scope comes before a number.
8. Resources and Contact (`#contact`); the contact dialog says the contact channel is almost ready.
9. Footer with the year.

## Files

| Path | Role |
|---|---|
| `index.html` | The page. |
| `styles.css` | All styles (design tokens, layout, motion, print/contrast/motion media queries). |
| `app.js` | Header state, mobile menu, contact dialog, WebGL shader, tilt and spotlight effects, year. |
| `assets/munilink-logo.svg`, `assets/munilink-logo.png` | Logo (SVG with PNG fallback; PNG also the favicon). |
| `scripts/server.mjs` | Local static server for `npm start`. |
| `test/site.test.mjs` | Tests for `npm test`. |
| `package.json` | Scripts `start` and `test`; no dependencies. |
| `.agents/skills/*`, `skills-lock.json` | Design skills used by coding agents when the page was built (from `Leonxlnx/taste-skill`), pinned by hash. Not part of the site. |

## Documentation

- [`AGENTS.md`](AGENTS.md): rules for coding agents and the mandatory change-log rule.
- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md): purpose, audience, glossary, status, roadmap, limits.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): file map, page structure, scripts, styles, tests, accessibility.
- [`CHANGELOG.md`](CHANGELOG.md): history.
