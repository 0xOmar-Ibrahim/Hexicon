// Builds the static website into dist/:
//   - copies site/ (HTML, CSS, JS, assets)
//   - writes dist/data.json from data/taxonomy.yml, data/resources and data/cves
//   - copies i18n/ui.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const read = (f) => YAML.parse(fs.readFileSync(f, 'utf8'));
const walk = (dir) =>
  !fs.existsSync(dir)
    ? []
    : fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.yml') ? [path.join(dir, e.name)] : []
      );
const iso = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);

const taxonomy = read(path.join(ROOT, 'data/taxonomy.yml'));

const resources = walk(path.join(ROOT, 'data/resources')).map((f) => {
  const r = read(f);
  return {
    id: path.basename(f, '.yml'),
    title: r.title,
    url: r.url,
    type: r.type,
    domain: r.domain,
    subdomains: r.subdomains ?? [],
    level: r.level ?? [],
    cost: r.cost,
    languages: r.languages ?? ['en'],
    description: r.description ?? {},
    tags: r.tags ?? [],
    featured: !!r.featured,
    added_on: iso(r.added_on),
  };
});

const cves = walk(path.join(ROOT, 'data/cves')).map((f) => {
  const c = read(f);
  return {
    id: c.id,
    nickname: c.nickname ?? null,
    severity: c.official?.cvss?.severity ?? null,
    score: c.official?.cvss?.score ?? null,
    kev: !!c.official?.kev?.listed,
    epss: c.official?.epss?.score ?? null,
    published: iso(c.official?.published),
    summary: c.summary ?? {},
    references: (c.references ?? []).map((r) => ({ kind: r.kind, url: r.url, title: r.title ?? r.url })),
  };
});

const byKey = new Map(resources.map((r) => [`${r.domain}/${r.id}`, r]));
const paths = walk(path.join(ROOT, 'data/paths')).map((f) => {
  const p = read(f);
  const steps = p.steps.map((s) => {
    const r = byKey.get(s.resource);
    if (!r) throw new Error(`${path.basename(f)}: step "${s.resource}" does not match any resource`);
    return { title: r.title, url: r.url, type: r.type, cost: r.cost, note: s.note ?? '' };
  });
  return { id: p.id, icon: p.icon ?? 'compass', level: p.level, hours: p.hours ?? null, title: p.title, description: p.description, steps };
});
const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };
paths.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || (a.hours ?? 0) - (b.hours ?? 0));

const counts = Object.fromEntries(taxonomy.domains.map((d) => [d.id, 0]));
for (const r of resources) if (r.domain in counts) counts[r.domain]++;

const data = {
  generated: new Date().toISOString(),
  languages: taxonomy.languages,
  rtl: taxonomy.rtl_languages ?? [],
  domains: taxonomy.domains
    .sort((a, b) => a.order - b.order)
    .map((d) => ({ id: d.id, order: d.order, icon: d.icon, name: d.name, subdomains: d.subdomains, count: counts[d.id] })),
  resources: resources.sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title)),
  cves: cves.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
  paths,
};

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'site'), DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'data.json'), JSON.stringify(data));
fs.copyFileSync(path.join(ROOT, 'i18n/ui.json'), path.join(DIST, 'ui.json'));

console.log(`Built dist/ — ${resources.length} resources, ${cves.length} CVE pages, ${paths.length} paths, ${data.domains.length} domains.`);
