# Project context: MuniLink landing page

For coding agents (Command Code, Hark) and humans picking this repo up cold. Read `AGENTS.md` first. This repository is **public**, so this file only describes what the repository itself shows. Anything not built is marked **planned**; ideas are marked **suggestion**.

## 1. MuniLink in brief

MuniLink is a South African venture serving **local government** (municipalities). The page on `main` presents it as helping municipalities evaluate and adopt practical technology with clear oversight, starting from the municipal decision rather than the tool. The newer redesign on branch `hark/redesign-preview` presents MuniLink as helping municipalities get their **audit evidence ready before the auditors arrive** (SCM award files, records and approvals).

Principles visible in the repository: honest qualifiers instead of claims, no published prices yet, accountability kept with people, South African municipal context, accessible and lightweight pages.

## 2. This project's purpose

A single, fast landing page that introduces MuniLink, explains its approach, and invites a first conversation. It is the earlier of MuniLink's web properties; MuniLink's main website is maintained in a separate (private) repository.

## 3. Audience and scenarios

| Audience | Scenario |
|---|---|
| Municipal managers and senior officials | Read the statement and decision lens, then the four-step approach, then make contact. |
| Finance, supply chain and ICT officials | Check the services and evidence sections for what is actually offered and what is still in progress. |
| Partners and reviewers | Look at the evidence section for honest, stage-labelled claims. |

## 4. Glossary

| Term | Meaning |
|---|---|
| **Decision lens** | The three questions on the page: Is the need specific? Are the conditions real? Can people stay accountable? |
| **Terrain** | The WebGL topographic shader in the hero (`TopographicShader` in `app.js`), with a CSS fallback. |
| **Reduced motion** | The user's OS preference; the page stops animation and shows a static hero. |
| **Save-Data** | Browser data-saving hint (`navigator.connection.saveData`); the shader does not start when it is on. |
| **SCM** | Supply chain management (municipal procurement). Used on the redesign branch. |
| **AGSA** | Auditor-General of South Africa. Used on the redesign branch. |
| **POPIA** | Protection of Personal Information Act. Used on the redesign branch's privacy page. |
| **Taste skills** | Design guidance files for coding agents in `.agents/skills/`, pinned in `skills-lock.json`. |

## 5. Current status (29 Oct 2026)

- `main` at `23363eb` (19 Jul 2026) before this docs pass: the July landing page built through PR #1.
- `npm test`: **6 tests passing**.
- Open PR #2 (`ara/agent/...`, July 2026): self-hosted fonts, audit request flow.
- Open PR #3 (`hark/redesign-preview`, October 2026): audit-evidence redesign with `checklist.html`, `privacy.html`, `form.js`, a checklist PDF, an OG image and a larger test suite.
- Branch `preview/contract-register-checker` (October 2026): adds a preview copy of an offline tool page under `tools/`.
- Docs: this agent handbook added 29 Oct 2026.

## 6. Roadmap

| Item | State |
|---|---|
| Decide PR #3 (redesign) and PR #2 (fonts and audit request flow) | open, owner to decide |
| Self-host fonts (Google Fonts are requested from the network on `main`) | planned in PR #2 |
| A working contact channel (the dialog on `main` says it is almost ready) | planned (PR #2 / PR #3 add one) |

## 7. Known limitations (as built on `main`)

- The contact dialog has no working form; it says the channel is almost ready.
- Fonts load from Google Fonts, so the page makes third-party requests and falls back to system fonts offline.
- The copy on `main` predates the redesign branch and leads with AI, which the newer branch moved away from.
- No `.gitignore` on `main`.
- No CI; tests run locally only.

## 8. Ideas for upgrades (suggestions only, not agreed)

1. Merge or close the open PRs so `main` reflects the version that should be public.
2. Add a GitHub Actions workflow running `npm test` on pull requests.
3. Add Open Graph tags with absolute URLs once the final address is settled.
4. Add a Lighthouse or axe accessibility check to the test suite.
