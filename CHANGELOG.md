# Changelog

All notable changes to the MuniLink landing page. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are SAST (UTC+2). Newest first. History before 29 Oct 2026 is reconstructed from the git log and pull requests.

**Rule (see `AGENTS.md`):** every change (feature, fix, refactor, data, docs) adds an entry here and updates any affected section of `README.md`, `docs/PROJECT_CONTEXT.md` and `docs/ARCHITECTURE.md` in the same commit.

Template for new entries (put them under `[Unreleased]`):

```
### Added | Changed | Fixed | Removed | Docs
- YYYY-MM-DD, PR #N (or "no PR"): what changed, in plain words. Files: ...
```

## [Unreleased]

### Docs
- 2026-10-29, branch `docs/agent-handbook`: agent handbook. Rewrote `README.md` (kept the run/validate instructions and the WebGL note); added `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md` and this file. No change to the page, scripts, styles or tests; `npm test` 6 passing.

## [1.0.0] - 2026-07-19, PR #1 (`23363eb`)

### Added
- `60135de` (2026-07-18): first build of the landing page (`index.html`, `styles.css`, `app.js`, `scripts/server.mjs`, `test/site.test.mjs`, `package.json`).
- `9ddeffd`: richer municipal landing experience.
- `024810b`: official MuniLink logo (SVG + PNG).
- `1a2bedb`: design skills for coding agents in `.agents/skills/` with `skills-lock.json`.
- `bc6790d`: sharper landing page hierarchy.
- `23363eb` (2026-07-19): launch version of the page.

## 2026-07-19 (`15adad0`)
- Initial commit.

## Not merged (open branches)
- PR #2 `ara/agent/repo-engineer-for-slyvester-cybe-ff4bb5c7` (2026-07-19): self-host brand typefaces (`f00f104`), exclude local agent skills from the repo (`68d7862`), audit request workflow (`edc2109`).
- PR #3 `hark/redesign-preview` (2026-10-15 to 2026-10-16): audit-evidence redesign (problem-first hero, checklist page, intake form with `form.js`, privacy page, booking buttons, checklist PDF, OG image, larger test suite).
- `preview/contract-register-checker` (2026-10-18): preview copy of an offline tool page under `tools/`.
