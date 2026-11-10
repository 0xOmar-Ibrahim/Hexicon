# Hexicon — Roadmap v2

_Re-planned 2026-11-10 after the first build-out (533 resources, 18 CVE pages, 5 paths, website ready to deploy)._

Hexicon has two jobs:

1. **The Library** — every good security resource, structured, verified and translated.
2. **The Roadmaps** — opinionated, role-based routes through that library, from zero to job-ready.

Version 1 built the library. Version 2 turns it into a **career navigator**.

---

## Guiding principles

- **Roles, not topics.** Roadmaps follow real jobs, mapped to [NICE Framework](https://niccs.cisa.gov/workforce-development/nice-framework) work roles so they line up with how employers hire.
- **Build, don't just read.** Every stage ends with a hands-on project you can put in a portfolio (inspired by project-based roadmaps such as [soc-roadmap-2026](https://github.com/Ak-cybe/soc-roadmap-2026)).
- **Time-honest.** Each stage has a week estimate at ~10 hours/week, so learners can plan.
- **Free first.** Every stage can be completed with free resources; paid options and certifications are optional checkpoints.
- **One source of truth.** Roadmaps only reference resources that exist in `data/resources/` — the build fails otherwise.
- **Defensive by default.** Offensive skills are always paired with how to detect and prevent them.

---

## ✅ Done (v1)

- 14-domain taxonomy in 5 languages · JSON Schemas · contributor docs & issue forms
- 533 link-checked resources across all 14 domains (incl. 56 books, 45 defensive, 22 Android)
- 18 curated CVE pages with NVD / CISA KEV / EPSS facts synced weekly
- 5 learning paths · animated multilingual website (RTL Arabic) · generated Markdown docs
- CI build check on every PR · manual GitHub Pages deploy

---

## Phase A — Role Roadmaps (now)

Upgrade "paths" into **staged role roadmaps**:

| Field | Meaning |
|---|---|
| `nice_roles` | Matching NICE work roles |
| `stages[]` | 3–5 milestones, each with `weeks`, `goal`, `skills[]`, a `project` and `steps[]` |
| `checkpoint` | Optional certification that fits the end of a stage |
| `next` | Roadmaps that naturally follow (career transitions) |

### The 14 roadmaps

| # | Roadmap | NICE role (closest) | Track |
|---|---|---|---|
| 0 | Security Foundations | — (prerequisite for all) | Core |
| 1 | SOC Analyst | Defensive Cybersecurity | Defend |
| 2 | Detection Engineer & Threat Hunter | Threat Analysis · Defensive Cybersecurity | Defend |
| 3 | Incident Responder & DFIR | Incident Response · Digital Forensics | Defend |
| 4 | Malware Analyst & Reverse Engineer | Cyber Defense Forensics · Exploitation Analysis | Defend |
| 5 | Threat Intelligence Analyst | Threat Analysis · All-Source Analysis | Defend |
| 6 | Penetration Tester | Vulnerability Analysis | Attack (authorized) |
| 7 | Web & API Security / Bug Bounty | Vulnerability Analysis · Secure Software Development | Attack / Build |
| 8 | Mobile (Android) Security | Vulnerability Analysis | Attack / Build |
| 9 | Cloud Security Engineer | Systems Security Analysis · Security Architecture | Build |
| 10 | DevSecOps & Supply-Chain Security | Secure Software Development | Build |
| 11 | AI & LLM Security | Secure Software Development · Vulnerability Analysis | Build / Attack |
| 12 | GRC Analyst | Cybersecurity Policy & Planning · Risk Management | Govern |
| 13 | ICS / OT Security | Operational Technology Cybersecurity | Defend |

- [ ] Schema v2 (`stages`, `nice_roles`, `checkpoint`, `next`) with backwards compatibility
- [ ] Website: stage timeline, skills checklist, project card, "what's next" links
- [ ] Migrate the 5 existing paths, then add the remaining 9
- [ ] Translate roadmap titles/descriptions into DE · FR · AR · RU
- [ ] Per-viewer progress tracking (tick off steps; stored in the browser)

## Phase B — Close content gaps (rolling)

A domain counts as **strong** at: ≥ 40 resources, every subdomain covered, all three levels, ≥ 1 lab per subdomain, ≥ 1 roadmap.

| Domain | Now | Target | Priority |
|---|---|---|---|
| CVE pages | 18 | 50 (KEV + named, each with a lab or detection) | 🔴 |
| ICS / OT | 21 | 40 | 🔴 |
| AI & LLM security | 28 | 45 (agent/MCP security, AI red-team labs) | 🔴 |
| Cryptography | 28 | 40 | 🟠 |
| Cloud | 30 | 40 (more Azure / GCP) | 🟠 |
| AppSec | 34 | 40 | 🟠 |
| iOS security | — | new batch alongside Android | 🟠 |
| Native-language resources (AR/DE/FR/RU) | ~15 | 50+ | 🟡 |
| Translated descriptions | 25 featured | all featured + every roadmap step | 🟡 |

Also re-check links that were unreachable from the build machine (DEF CON, Let's Encrypt, Sigstore, Maltego, ICS Village, ACSC Essential Eight, UAE CSC, FSTEC/BDU).

## Phase C — Platform

- [ ] Schema validation script in CI (resources, CVEs, roadmaps) + duplicate-URL check
- [ ] Weekly link checker that opens an issue listing dead links
- [ ] Issue-form → pull-request bot, so non-Git users can contribute
- [ ] Per-domain, per-roadmap and per-CVE pages on the website (shareable URLs, SEO)
- [ ] Search across descriptions in all languages
- [ ] Enable GitHub Pages and automatic deploy on push

## Phase D — Community & launch

- [ ] Labels, `good-first-issue` backlog, CODEOWNERS per domain (domain maintainers)
- [ ] GitHub Discussions; monthly "What's new in Hexicon" changelog
- [ ] Launch: r/netsec, r/cybersecurity, LinkedIn, X, Hacker News, Arabic security communities
- [ ] Each roadmap reviewed by a working practitioner in that role

---

## Sources that informed this plan

- [NICE Workforce Framework](https://niccs.cisa.gov/workforce-development/nice-framework) and the [NICCS career pathway tools](https://niccs.cisa.gov/workforce-development/career-pathway-roadmap) — role definitions and transitions
- [CyberSeek](https://www.cyberseek.org/) — common entry roles and transitions
- [roadmap.sh Cyber Security](https://roadmap.sh/cyber-security) — topic coverage for foundations
- [soc-roadmap-2026](https://github.com/Ak-cybe/soc-roadmap-2026) (MIT) — project per stage, time-boxed tracks
- [supabash AI/LLM security notes](https://github.com/devcore24/supabash/blob/main/docs/ai-llm-security-roadmap.md) — AI security scope: prompt injection, output handling, tool/MCP misuse, RAG poisoning
- [Cybersecurity-Roadmap (carlcastanas)](https://github.com/carlcastanas/Cybersecurity-Roadmap) — 2026 emphasis on identity, zero trust, cloud-native and PQC
