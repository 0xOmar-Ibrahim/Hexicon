# Hexicon — Roadmap

Decisions taken (2026-11-10):

- **Format:** structured YAML → generated READMEs + website.
- **Scope:** all 14 domains (13 + CVEs), each built to "strong" before calling it done — quality over speed.
- **Languages:** English, German, French, Arabic (RTL), Russian.
- **Audience:** both learners (learning paths) and practitioners (tools & references).
- **Website:** custom, animated, professional, with its own colour palette.

## Phase 0 — Foundation
- [x] Taxonomy (14 domains, subdomains, 5 languages)
- [x] JSON Schemas: resource, CVE
- [x] README, CONTRIBUTING, Code of Conduct, licenses
- [x] Issue forms & PR template
- [x] `hexicon-curator` Claude Code skill
- [ ] Learning-path schema
- [ ] Review & install the Masriyan cybersecurity skills (MIT) for domain-expert curation
- [ ] First push to GitHub

## Phase 1 — Seed content (per domain, until "strong")
"Strong" means: ≥ 40 resources, every subdomain covered, all levels represented, at least 1 lab/practice resource per subdomain, ≥ 1 learning path.

- [ ] 01 Fundamentals  ·  [ ] 02 Offensive  ·  [ ] 03 Defensive  ·  [ ] 04 DFIR & Malware
- [ ] 05 Reverse Eng.  ·  [ ] 06 AppSec  ·  [ ] 07 Cloud  ·  [ ] 08 Threat Intel & OSINT
- [ ] 09 Cryptography  ·  [ ] 10 AI Security  ·  [ ] 11 ICS/OT  ·  [ ] 12 GRC  ·  [ ] 13 Career
- [ ] 14 CVEs: ~50 named/KEV pages first (Log4Shell, EternalBlue, Heartbleed, Shellshock, ProxyLogon, Citrix Bleed, MOVEit…)

## Phase 2 — Automation
- [ ] `scripts/validate` — schema + taxonomy + duplicate URL check (runs on every PR)
- [ ] `scripts/build-readmes` — generate `docs/<domain>.md` per language
- [ ] `scripts/link-check` — weekly, opens an issue listing dead links
- [ ] `scripts/sync-cves` — weekly: NVD API 2.0 + CISA KEV JSON + FIRST EPSS → `official:` blocks
- [ ] `scripts/kev-suggest` — propose new CVE pages for fresh KEV entries
- [ ] Issue-form → PR bot for non-Git contributors
- [ ] OffsecCyber (Apache-2.0) mining: extract CVE ids + reference URLs as *candidates* only; facts always re-sourced from NVD/KEV

## Phase 3 — Website
- [ ] Astro + Tailwind, i18n routing (`/en`, `/de`, `/fr`, `/ar` RTL, `/ru`)
- [ ] Pagefind full-text search + facet filters (type, level, cost, language, tags)
- [ ] Animated landing (animated "chart" of the 14 domains — Midnight Cartographer palette), domain pages, resource cards, CVE pages, learning paths
- [ ] New colour palette, light/dark, accessible contrast, reduced-motion support
- [ ] Deploy to GitHub Pages via Actions

## Phase 4 — Community & launch
- [ ] Labels, `good-first-issue` backlog, domain maintainers via CODEOWNERS
- [ ] Discord / GitHub Discussions
- [ ] Launch posts: r/netsec, r/cybersecurity, LinkedIn, X, Hacker News
- [ ] Monthly "What's new in Hexicon" changelog
