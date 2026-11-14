<div align="center">

# 🧭 Hexicon

**The open lexicon of security**: a free, community-curated, multilingual library of cybersecurity knowledge.

Courses · Tools · Books · Labs · Cheatsheets · Papers · Certifications · Exploited CVEs, organised, checked and translated.

🇬🇧 English · 🇩🇪 Deutsch · 🇫🇷 Français · 🇸🇦 العربية · 🇷🇺 Русский

**[🌐 Open the website](https://hexicon-murex.vercel.app)** · [How it works](HOW-IT-WORKS.md) · [Roadmap](ROADMAP.md) · [Contribute](CONTRIBUTING.md)

</div>

---

## What's inside

| | |
|---|---|
| **533 resources** | Hand-picked courses, tools, books (57), labs, cheatsheets, papers and certifications across 14 domains, each tagged by type, level, cost and language. |
| **1,116 CVE pages** | The 1,000 most-exploited vulnerabilities from the CISA KEV catalog, ranked by EPSS, plus every CVE CISA added in the last 180 days. Each page answers: *What is it? Am I affected? Is it exploited? How do I check, practise, detect and fix it?* |
| **5 languages** | The whole website switches language, including Arabic right-to-left. CVE names, summaries and CISA's required actions are translated. |
| **Quality signals** | GitHub stars, last update, archived and stale warnings, and weekly link checks. Dead links on CVE pages fall back to a Wayback Machine copy. |

## Why another list?

Most security lists are one huge Markdown file that slowly rots. Hexicon is different:

- **Structured**: every resource is a small YAML file with metadata, so it can be filtered, sorted and translated.
- **Beginner-friendly**: "Start here" steps, beginner-first sorting, plain-language descriptions and a level meter on every card.
- **Kept fresh automatically**: weekly jobs re-sync CVE data from CISA, NVD and FIRST EPSS, re-check every link and refresh GitHub stats.
- **Practical CVE intel**: affected versions, public exploit availability (links only), Nuclei checks, practice labs and Hack The Box walkthroughs, Sigma and Elastic detections, MITRE ATT&CK techniques, and a patch priority (P1 / P2 / P3).
- **Responsible**: offensive material is always paired with detection and defence. We link to sources and never host exploit code.

## The map

| # | Domain | | # | Domain |
|---|---|---|---|---|
| 01 | [Fundamentals](docs/fundamentals.md) | | 08 | [Threat Intel & OSINT](docs/threat-intel.md) |
| 02 | [Offensive Security](docs/offensive.md) | | 09 | [Cryptography](docs/cryptography.md) |
| 03 | [Defensive Security](docs/defensive.md) | | 10 | [AI & LLM Security](docs/ai-security.md) |
| 04 | [DFIR & Malware](docs/dfir.md) | | 11 | [ICS / OT Security](docs/ics-ot.md) |
| 05 | [Reverse Engineering](docs/reverse-engineering.md) | | 12 | [GRC & Privacy](docs/grc.md) |
| 06 | [AppSec & DevSecOps](docs/appsec.md) | | 13 | [Career & Community](docs/career.md) |
| 07 | [Cloud & Containers](docs/cloud.md) | | 14 | [CVEs & Vulnerabilities](docs/cves.md) |

Everything is also browsable as Markdown: [library index](docs/README.md) · [top exploited CVEs](docs/cves-top.md).
Maintainers: [link & maintenance report](docs/link-report.md) · [CVE page link report](docs/cve-link-report.md).

## Contributing

Hexicon lives on contributions, and you don't need Git:

1. **Suggest a resource, a CVE, a translation or a broken link** with the [issue forms](../../issues/new/choose).
2. **Open a pull request** adding a YAML file under `data/resources/<domain>/`. See [CONTRIBUTING.md](CONTRIBUTING.md).
3. **Translate** descriptions into DE / FR / AR / RU. Native-speaker review of existing translations is very welcome.
4. **Curate a CVE page**: hand-written field notes under `data/cves/<year>/`.

New to the codebase? Read [HOW-IT-WORKS.md](HOW-IT-WORKS.md) first.

## Run it locally

```bash
npm install
npm run dev      # builds dist/ and serves it at http://127.0.0.1:4321
npm run build    # builds dist/ only
npm run docs     # regenerates the Markdown in docs/
```

On Windows PowerShell, use `npm.cmd run dev` if script execution is disabled.
Share a page in one language with `?lang=de|fr|ar|ru`, and link a CVE directly with `?cve=CVE-2021-44228`.

<details>
<summary>Data pipeline commands (maintainers)</summary>

| Command | What it does |
|---|---|
| `npm run import:kev` | Pull the CISA KEV catalog, rank by EPSS, create/refresh the top 1,000 + recent CVE pages |
| `npm run sync:cves -- --feeds` | Sync CVSS, CWE, dates, KEV and EPSS from NVD's yearly feeds |
| `npm run enrich:cves` | Add intel: affected versions, exploits (links), scanners, labs, detections, ATT&CK, fix, priority |
| `npm run enrich:resources` | GitHub stars / last push / archived, and link checks for library resources |
| `npm run check:links` | Check every URL on CVE pages; find Wayback copies for dead ones (`-- --only-dead` for a quick re-run) |

These run automatically every week in GitHub Actions.
</details>

## Repository layout

```
data/resources/<domain>/<slug>.yml   library resources (one file each)
data/cves/<year>/CVE-*.yml           CVE pages (curated notes + generated official and intel blocks)
data/taxonomy.yml                    domains, subdomains and their translations
data/i18n/kev-actions.json           translations of CISA's required actions
data/resource-stats.json             generated: GitHub stats and link health of resources
data/link-health.json                generated: link health of CVE page URLs
data/paths/                          role roadmaps (kept as data, not shown on the website for now)
i18n/ui.json                         every website label in 5 languages
schema/                              JSON Schemas for resources, CVEs and roadmaps
scripts/                             build · docs · import · sync · enrich · link checks
site/                                the website (vanilla HTML, CSS, JS)
docs/                                generated Markdown views and reports
```

## Responsible use

Hexicon links to offensive-security material for **education, authorized testing and defence**. It never hosts malware, exploit code, leaked data or pirated content. Only use these resources on systems you own or are explicitly authorized to test.

## License

- Content (`data/`, docs): [CC BY 4.0](LICENSE-CONTENT)
- Code (`scripts/`, `site/`, `schema/`): [MIT](LICENSE)

Created by **Omar Ibrahim** ([@0xOmar-Ibrahim](https://github.com/0xOmar-Ibrahim)) and the Hexicon community.
