# Hexicon — Roadmap v3

_Re-planned 2026-11-14. Replaces v2 (2026-11-10)._

Hexicon has two jobs:

1. **The Library**: every good security resource, structured, checked and translated, easy for a newcomer to use.
2. **The CVE field guide**: for every vulnerability attackers actually exploit, one page that says what it is, whether you're affected, and how to check, practise, detect and fix it.

Version 1 built the library. Version 2 added the CVE field guide and made the site simple for newcomers. **Version 3 is about depth and trust**: better coverage where it matters, translations people can rely on, and a community that keeps it alive.

---

## Guiding principles

- **Newcomers first, practitioners welcome.** Plain language, beginner-first sorting, nothing that needs a glossary to understand.
- **One language at a time.** When you switch language, the whole site switches. No half-translated pages.
- **Facts from official sources.** CVE facts come from CISA, NVD and FIRST, and are re-synced weekly, never typed by hand.
- **Links, not payloads.** We point to exploits so defenders know they exist; we never host exploit code, malware or pirated material.
- **Defensive by default.** Offensive skills are always paired with how to detect and prevent them.
- **Automate the boring parts.** Anything that can go stale (CVE data, links, GitHub stats) is refreshed by a weekly job.

---

## ✅ Done

### v1: the library (2026-11-10)
- 14-domain taxonomy in 5 languages · JSON Schemas · contributor docs and 4 issue forms
- 533 resources across all 14 domains (57 books, 45 defensive, 22 Android)
- Animated multilingual website (Arabic right-to-left) · generated Markdown docs · CI build check

### v2: the CVE field guide and a simpler site (2026-11-10 → 11-14)
- **1,116 CVE pages**: top 1,000 of CISA KEV ranked by EPSS, plus every KEV addition from the last 180 days (marked *New*)
- Official data synced weekly from NVD yearly feeds, CISA KEV and FIRST EPSS
- **CVE intel on every page**: affected versions (100%), ATT&CK techniques (100%, inferred ones labelled), public exploit links (Exploit-DB 36%, Metasploit 45%), Nuclei checks (46%), detections (Sigma + Elastic, 12%), practice (Vulhub, Metarget, Hack The Box walkthroughs: 13%), Project Zero root-cause analyses (2%)
- **Patch priority** P1 / P2 / P3 (246 / 805 / 65), with the reasons shown
- CVE names, summaries and **CISA's required action translated** into DE · FR · AR · RU (1,115 / 1,115)
- Full CVE detail page with shareable `?cve=` URLs; CVE table becomes cards on phones
- **Simplified layout for newcomers**: "Start here" steps, topic sidebar, beginner and free filters, level meter
- **Quality signals**: GitHub stars and last update for 170 projects, archived and stale warnings, sort by popular or recently updated
- **Link health**: weekly checks of 533 resource links and 1,779 CVE page links; dead CVE links fall back to a Wayback Machine copy
- Deployed on Vercel with Web Analytics · poster and launch posts

### Paused
- **Role roadmaps** (14 roadmaps, NICE-mapped, with stages and projects) are kept in `data/paths/` but **removed from the website**. They need practitioner review and full translation before they come back.

---

## Phase A: Trust (now)

Make what we already have reliable.

- [ ] **Schema validation in CI** for resources, CVEs and roadmaps, plus a duplicate-URL check
- [ ] **Native-speaker review** of AR / DE / FR / RU translations (CVE summaries, CISA actions, UI)
- [ ] **Hand-written translations** for resource descriptions: 507 currently use a generated fallback line. Beginner resources first.
- [ ] Weekly link job **opens an issue** listing dead links instead of only writing a report
- [ ] Translate new one-off CISA instructions as they appear (flag them in the weekly report)
- [ ] Re-check links that block automated checks (DEF CON, Let's Encrypt, Sigstore, Maltego, ICS Village, ACSC Essential Eight, UAE CSC, FSTEC/BDU)

## Phase B: Coverage (rolling)

A domain counts as **strong** at: ≥ 40 resources, every subdomain covered, all three levels, ≥ 1 lab per subdomain.

| Area | Now | Target | Priority |
|---|---|---|---|
| ICS / OT resources | 21 | 40 | 🔴 |
| AI & LLM security | 28 | 45 (agent / MCP security, AI red-team labs) | 🔴 |
| CVE detections | 12% | 25% (more rule sources: Splunk, Microsoft Sentinel, Suricata / Snort) | 🔴 |
| Curated CVE field notes | 18 | 50 hand-written pages for the most important CVEs | 🟠 |
| Cryptography | 28 | 40 | 🟠 |
| Cloud | 30 | 40 (more Azure / GCP) | 🟠 |
| AppSec | 34 | 40 | 🟠 |
| iOS security | — | new batch alongside Android | 🟠 |
| CVE practice labs | 13% | 20% (more lab sources as they appear) | 🟡 |
| Native-language resources (AR / DE / FR / RU) | ~15 | 50+ | 🟡 |

Practice coverage is capped by reality: most exploited CVEs are in commercial appliances (Ivanti, Fortinet, Cisco…) that can't be packaged as free labs. Detections are the better lever.

## Phase C: Platform

- [ ] Issue form → pull-request bot, so non-Git users' suggestions become PRs automatically
- [ ] Static pages per domain and per CVE (better sharing previews and search-engine visibility)
- [ ] Search across descriptions in all languages
- [ ] "What changed this week" feed: new KEV entries, new resources, newly archived projects
- [ ] Bring role roadmaps back once reviewed and fully translated
- [ ] Clean up the manual-only GitHub Pages workflow (the site lives on Vercel)

## Phase D: Community

- [ ] Labels, a `good-first-issue` backlog, and CODEOWNERS per domain (domain maintainers)
- [ ] GitHub Discussions and a monthly "What's new in Hexicon" changelog
- [ ] Share in r/netsec, r/cybersecurity, LinkedIn, X, Hacker News and Arabic security communities
- [ ] Practitioner reviewers for each domain

---

## Sources that shaped this plan

- [CISA Known Exploited Vulnerabilities](https://www.cisa.gov/known-exploited-vulnerabilities-catalog), [FIRST EPSS](https://www.first.org/epss/) and [NVD](https://nvd.nist.gov/): what "most exploited" means and where the facts come from
- [MITRE CTID Mappings Explorer](https://center-for-threat-informed-defense.github.io/mappings-explorer/): KEV → ATT&CK
- [NICE Workforce Framework](https://niccs.cisa.gov/workforce-development/nice-framework) and [CyberSeek](https://www.cyberseek.org/): role definitions for the (paused) roadmaps
- [roadmap.sh Cyber Security](https://roadmap.sh/cyber-security), [soc-roadmap-2026](https://github.com/Ak-cybe/soc-roadmap-2026) and [supabash AI/LLM security notes](https://github.com/devcore24/supabash/blob/main/docs/ai-llm-security-roadmap.md): topic coverage
