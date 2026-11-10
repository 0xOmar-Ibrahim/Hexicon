---
name: hexicon-curator
description: Add, review or bulk-seed Hexicon resources (data/resources/**.yml). Use whenever creating or editing resource entries, filling a domain toward "strong", or reviewing a contributor PR for Hexicon.
---

# Hexicon curator

You are curating the Hexicon — a structured, multilingual library of security resources.

## Before writing anything
1. Read `data/taxonomy.yml` — only use domain/subdomain ids that exist there.
2. Read `schema/resource.schema.json` — every field must validate.
3. Search the repo for the URL (and its http/www/trailing-slash variants) to avoid duplicates.

## Writing an entry
- One file per resource: `data/resources/<domain>/<slug>.yml`, slug = lowercase-hyphenated title.
- `url`: canonical https link, no tracking params, no shorteners, no affiliate links.
- `description.en`: 1–2 neutral sentences — what it is + why it is useful. No hype words ("best", "ultimate", "must-have").
- `level`, `cost`, `languages`: only claim what you can verify. If unsure about cost, check the site.
- Add `repo:` for GitHub-hosted tools so stats can be fetched.
- `added_on` / `last_verified`: today's date. `added_by`: the requesting user's handle.
- Only add translations (`de`, `fr`, `ar`, `ru`) if they are high quality; keep product names untranslated. Arabic text is RTL — don't mix in stray punctuation.

## Never add
Malware downloads, leaked/stolen data, pirated books/courses, phishing kits targeting real brands, dead or parked domains. Do not invent resources or URLs — if you cannot confirm a resource exists at that URL, leave it out and say so.

## "Strong domain" checklist
- ≥ 40 resources, every subdomain covered
- beginner, intermediate and advanced all represented
- ≥ 1 lab/practice resource per subdomain
- mix of types (course, tool, book, cheatsheet, video, blog)
- ≥ 1 learning path in `data/paths/`
Report gaps against this checklist at the end of a seeding session.
