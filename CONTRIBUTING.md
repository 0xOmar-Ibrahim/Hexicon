# Contributing to Hexicon

Thank you for helping map the security world. 🧭

## Ways to contribute

| You want to… | Do this |
|---|---|
| Suggest a resource (no Git) | Open the **Suggest a resource** issue form |
| Add a resource yourself | PR with a new file in `data/resources/<domain>/` |
| Add / improve a CVE page | PR in `data/cves/<year>/CVE-YYYY-NNNN.yml` |
| Translate | Add `de` / `fr` / `ar` / `ru` keys to `description`, or translate UI strings in `i18n/` |
| Report a dead link | Open the **Broken link** issue form |
| Propose a learning path | PR a file in `data/paths/` (schema: [`schema/path.schema.json`](schema/path.schema.json)) — each step points to an existing resource as `domain/file-name` |

## Adding a resource

1. Pick the domain and subdomain(s) from [`data/taxonomy.yml`](data/taxonomy.yml).
2. Create `data/resources/<domain>/<slug>.yml`, where `<slug>` is the lowercase title with hyphens (e.g. `portswigger-web-security-academy.yml`).
3. Fill in the fields — the schema is [`schema/resource.schema.json`](schema/resource.schema.json):

```yaml
title: Example Resource
url: https://example.com/            # https only, canonical URL (no tracking params)
type: course                         # tool | course | book | video | lab | cheatsheet | …
domain: offensive
subdomains: [web]
level: [beginner]                    # beginner | intermediate | advanced
cost: free                           # free | freemium | paid
languages: [en]                      # language of the resource itself
description:
  en: One or two neutral sentences saying what it is and why it is useful.
tags: [xss, labs]
added_by: "@your-github-handle"
added_on: 2026-11-10
```

4. Open a PR. CI checks the schema, the taxonomy ids, duplicates and the link.

## Inclusion criteria

A resource is accepted when it is:

- **Useful** — it teaches, enables or documents something real.
- **Alive** — maintained, or a recognised classic (mark old-but-gold as `status: archived`).
- **Accessible** — reachable without dubious sign-up walls; paid resources are fine if marked `cost: paid`.
- **Honest** — descriptions are neutral. No marketing copy, no "best ever".

Not accepted: malware binaries or download links, leaked/stolen data, pirated books/courses, phishing kits aimed at real brands, link shorteners, affiliate links, or self-promotion with no real value.

**Self-promotion:** you may add your own work — say so in the PR. Maintainers judge it like any other entry.

## CVE pages

CVE pages are **curated**, not a mirror of NVD. Add one when a vulnerability is notable (CISA KEV, widely exploited, named, or a great learning case).

- Don't edit the `official:` block — it is synced automatically from NVD, CISA KEV and FIRST EPSS.
- Do add: `summary`, `affected`, and `references` (advisories, write-ups, labs, detection rules, patches).
- PoC links must point to well-known public sources (e.g. vendor advisories, Vulhub, reputable researchers). Never paste exploit code into Hexicon.

## Translations

- English (`en`) is required; `de`, `fr`, `ar`, `ru` are optional and welcome.
- Translate meaning, not word-for-word. Keep tool names, CVE ids and product names in their original form.
- A native speaker review is requested for every translation PR (label `i18n:<lang>`).

## PR checklist

- [ ] One topic per PR (up to ~10 resources of the same domain is fine).
- [ ] Files validate locally (`npm run validate` once scripts land).
- [ ] No duplicates — search the repo for the URL first.
- [ ] `added_by` is your GitHub handle.

By contributing you agree your contribution is licensed under CC BY 4.0 (content) / MIT (code), and you follow our [Code of Conduct](CODE_OF_CONDUCT.md).
