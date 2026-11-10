<div align="center">

# 🧭 Hexicon

**The open lexicon of security** — a community-curated, multilingual library of cybersecurity knowledge.

Courses · Tools · Books · Labs · Cheatsheets · Papers · Certifications · CVEs — organised, tagged, verified, and translated.

🇬🇧 English · 🇩🇪 Deutsch · 🇫🇷 Français · 🇸🇦 العربية · 🇷🇺 Русский

</div>

---

## Why another list?

Most security lists are a single huge Markdown file that slowly rots. Hexicon is different:

- **Structured** — every resource is a small YAML file with metadata (type, level, cost, language, tags).
- **Filterable** — find "free, beginner, Active Directory, video" in seconds on the website.
- **Verified** — CI validates every contribution; a weekly job flags dead links.
- **Multilingual** — interface and descriptions in English, German, French, Arabic and Russian.
- **Learning paths** — curated roadmaps from zero to job-ready, built from Hexicon entries.
- **CVE pages** — notable vulnerabilities with advisories, write-ups, labs, detections and patches in one place.

## The map

| # | Domain | | # | Domain |
|---|---|---|---|---|
| 01 | Fundamentals | | 08 | Threat Intel & OSINT |
| 02 | Offensive Security | | 09 | Cryptography |
| 03 | Defensive Security | | 10 | AI & LLM Security |
| 04 | DFIR & Malware | | 11 | ICS / OT Security |
| 05 | Reverse Engineering | | 12 | GRC & Privacy |
| 06 | AppSec & DevSecOps | | 13 | Career & Community |
| 07 | Cloud & Containers | | 14 | CVEs & Vulnerabilities |

Full taxonomy (with subdomains and translations): [`data/taxonomy.yml`](data/taxonomy.yml).

## Contributing

Hexicon lives on contributions. You can:

1. **Suggest a resource** with the [issue form](../../issues/new/choose) — no Git needed.
2. **Open a PR** adding a YAML file under `data/resources/<domain>/` — see [CONTRIBUTING.md](CONTRIBUTING.md).
3. **Translate** descriptions or the website into DE / FR / AR / RU.
4. **Curate a CVE page** under `data/cves/<year>/`.

## Repository layout

```
data/resources/<domain>/<slug>.yml   resources (one file each)
data/cves/<year>/CVE-*.yml           curated CVE pages
data/paths/                          learning paths
data/taxonomy.yml                    domains, subdomains, translations
schema/                              JSON Schemas used by CI
scripts/                             validate · build · link-check · sync-cves
site/                                website
```

See [ROADMAP.md](ROADMAP.md) for where the project is heading.

## Responsible use

Hexicon links to offensive-security material for **education, authorized testing and defense**. It never hosts malware, leaked data or pirated content. Only use these resources on systems you own or are authorized to test.

## License

- Content (`data/`, docs): [CC BY 4.0](LICENSE-CONTENT)
- Code (`scripts/`, `site/`, `schema/`): [MIT](LICENSE)
