# AGENTS.md: rules for any coding agent (Command Code, Hark, others)

This is MuniLink's public landing page repository. These rules bind every agent and every human contributor.

## Read in this order

1. `AGENTS.md` (this file): the rules.
2. `docs/PROJECT_CONTEXT.md`: purpose, audience, glossary, status, roadmap, limits.
3. `BRIEF.md`: none in this repo.
4. `docs/ARCHITECTURE.md`: file map, page structure, `app.js`, `styles.css`, server, tests, accessibility.
5. `CHANGELOG.md`: what changed, when and why.

## Mandatory: log every change

**Every change (feature, fix, refactor, data, docs) must add an entry to CHANGELOG.md and update any affected section of README.md, docs/PROJECT_CONTEXT.md and docs/ARCHITECTURE.md in the same commit. A PR that changes behaviour without updating these files is incomplete.**

Add the entry under `## [Unreleased]` in `CHANGELOG.md` (Added / Changed / Fixed / Removed / Docs) with the date (YYYY-MM-DD, SAST), the PR number if any, and what changed in plain words.

## This repository is public

- Never commit private business information: prices or price lists, client or prospect names, outreach plans, funding, personal details, email inboxes or form endpoints that are not already public, credentials or API keys.
- Never commit real municipal data.
- Keep copy honest: no unsupported claims, no promised audit outcomes, no invented results or testimonials. The tests check that honest qualifiers stay on the page ("In progress", "Public pricing has not yet been published", "has not been provided yet").

## Technical rules

- Static HTML/CSS/JS, no runtime dependencies, no build step. `package.json` has no dependencies; keep it that way unless agreed.
- Accessibility is tested: one `h1`, labelled primary navigation (`aria-label="Primary navigation"`), every `href="#x"` must have a matching `id="x"`, `prefers-reduced-motion` fallbacks, WebGL2 → WebGL → CSS fallback, and respect for `navigator.connection.saveData`.
- Logo: `assets/munilink-logo.svg` with `assets/munilink-logo.png` fallback (also the favicon).
- Brand: slate grounds (`#020617`, `#0f172a`), cyan accent (`#22d3ee`), Outfit display and Inter body (see `styles.css` tokens). Do not invent new colours.
- `.agents/skills/` holds design skills pinned in `skills-lock.json`; they guide agents, they are not site code. Do not edit them by hand.

## Workflow

1. Feature branch + pull request into `main`. Never push to `main` directly. The repo owner approves merges.
2. Tests first for new behaviour; screenshots (desktop and mobile) for visual changes.
3. PR body: Summary, Evidence (test output, screenshots), Merge danger.
4. Do not change page behaviour in a docs-only change.

## Run and test

```bash
npm start     # http://localhost:4173
npm test      # node --test, 6 tests
```

## Open branches to know about

- `hark/redesign-preview` (PR #3, open): the audit-evidence redesign (checklist page, intake form, privacy page, more tests). It also rewrites `README.md`; when it is merged, resolve the README conflict by keeping this handbook's structure and updating its content.
- `ara/agent/repo-engineer-for-slyvester-cybe-ff4bb5c7` (PR #2, open): self-hosted fonts, audit request flow, `.gitignore` for local agent skills.
- `preview/contract-register-checker`: a preview copy of an offline tool page under `tools/`; not intended for `main`.
