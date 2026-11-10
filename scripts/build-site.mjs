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
// Roadmaps: v2 files have `stages`; v1 files with a flat `steps` list become a single stage.
const resolve = (file, ref) => {
  const r = byKey.get(ref);
  if (!r) throw new Error(`${path.basename(file)}: "${ref}" does not match any resource`);
  return r;
};
const asText = (v) => (v == null ? null : typeof v === 'string' ? { en: v } : v);
const paths = walk(path.join(ROOT, 'data/paths')).map((f) => {
  const p = read(f);
  const rawStages = p.stages ?? [{ title: 'Route', weeks: p.hours ? Math.max(1, Math.round(p.hours / 10)) : 1, goal: '', steps: p.steps }];
  const stages = rawStages.map((s) => {
    const cp = s.checkpoint ? resolve(f, s.checkpoint) : null;
    return {
      title: asText(s.title), weeks: s.weeks, goal: asText(s.goal), skills: s.skills ?? [], project: asText(s.project),
      checkpoint: cp ? { title: cp.title, url: cp.url } : null,
      steps: s.steps.map((st) => {
        const r = resolve(f, st.resource);
        return { id: `${r.domain}/${r.id}`, title: r.title, url: r.url, type: r.type, cost: r.cost, note: asText(st.note) };
      }),
    };
  });
  return {
    id: p.id, order: p.order ?? 99, icon: p.icon ?? 'compass', track: p.track ?? 'core', level: p.level,
    title: p.title, description: p.description, nice_roles: p.nice_roles ?? [],
    prerequisites: p.prerequisites ?? [], next: p.next ?? [],
    weeks: stages.reduce((n, s) => n + s.weeks, 0), stages,
  };
});
const pathIds = new Set(paths.map((p) => p.id));
for (const p of paths) for (const ref of [...p.prerequisites, ...p.next])
  if (!pathIds.has(ref)) throw new Error(`${p.id}.yml: linked roadmap "${ref}" does not exist`);
paths.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

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
