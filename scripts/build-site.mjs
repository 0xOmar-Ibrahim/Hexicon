// Builds the static website into dist/:
//   - copies site/ (HTML, CSS, JS, assets)
//   - writes dist/data.json from data/taxonomy.yml, data/resources and data/cves
//   - copies i18n/ui.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { TYPE_NAMES } from './vuln-types.mjs';

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

// Generated quality signals (scripts/enrich-resources.mjs): stars, last push, archived, link health.
const QUALITY = fs.existsSync(path.join(ROOT, 'data/resource-stats.json'))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/resource-stats.json'), 'utf8')) : {};
// Link health for CVE page URLs (scripts/check-links.mjs): dead links point to their Wayback Machine
// snapshot; dead links without a snapshot are dropped once they failed on two runs in a row.
const LINKS = fs.existsSync(path.join(ROOT, 'data/link-health.json'))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/link-health.json'), 'utf8')) : {};
function healLinks(v) {
  if (Array.isArray(v)) return v.map(healLinks).filter((x) => x !== undefined);
  if (!v || typeof v !== 'object') return v;
  const out = {};
  for (const [k, x] of Object.entries(v)) out[k] = healLinks(x);
  const h = typeof v.url === 'string' ? LINKS[v.url] : null;
  if (h?.status === 'dead') {
    if (h.archive) return { ...out, url: h.archive, original: v.url, archived: true };
    if ((h.fails ?? 0) >= 2) return undefined;
  }
  return out;
}
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
    ...(() => {
      const q = QUALITY[`${r.domain}/${path.basename(f, '.yml')}`];
      if (!q) return {};
      return {
        ...(q.repo?.stars != null && { stars: q.repo.stars }),
        ...(q.repo?.pushed && { pushed: q.repo.pushed }),
        ...(q.health && q.health !== 'unknown' && { health: q.health }),
      };
    })(),
  };
});

const allCves = walk(path.join(ROOT, 'data/cves')).map((f) => {
  const c = read(f);
  return {
    id: c.id,
    nickname: c.nickname ?? null,
    name: c.name ?? null,
    curated: (c.source ?? 'curated') === 'curated',
    rank: c.rank ?? null,
    recent: !!c.recent,
    vendor: c.affected?.[0]?.vendor ?? null,
    product: c.affected?.[0]?.product ?? null,
    severity: c.official?.cvss?.severity ?? null,
    score: c.official?.cvss?.score ?? null,
    kev: !!c.official?.kev?.listed,
    ransomware: c.official?.kev?.ransomware_use === 'Known',
    epss: c.official?.epss?.score ?? null,
    published: iso(c.official?.published),
    added: iso(c.official?.kev?.date_added),
    type: c.vuln_type ?? null,
    priority: c.intel?.priority ?? null,
    summary: c.summary ?? {},
    references: healLinks((c.references ?? []).map((r) => ({ kind: r.kind, url: r.url, title: r.title ?? r.url }))),
    // Full record for the detail page (written to dist/cve/<ID>.json).
    detail: healLinks({
      id: c.id, nickname: c.nickname ?? null, name: c.name ?? null, type: c.vuln_type ?? null,
      curated: (c.source ?? 'curated') === 'curated', rank: c.rank ?? null, recent: !!c.recent,
      affected_product: c.affected ?? [],
      official: {
        published: iso(c.official?.published) ?? null,
        cvss: c.official?.cvss ?? null,
        cwe: c.official?.cwe ?? [],
        kev: c.official?.kev ? { ...c.official.kev, date_added: iso(c.official.kev.date_added) } : null,
        epss: c.official?.epss ? { ...c.official.epss, date: iso(c.official.epss.date) } : null,
      },
      summary: c.summary ?? {},
      references: (c.references ?? []).map((r) => ({ kind: r.kind, url: r.url, title: r.title ?? r.url })),
      mitre_attack: c.mitre_attack ?? [],
      intel: c.intel ? JSON.parse(JSON.stringify(c.intel, (k, v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))) : null,
    }),
  };
});
// Curated field notes go into data.json; the full ranked list is a separate, lazily loaded file.
const cves = allCves.filter((c) => c.curated);
// Top-ranked CVEs first, then recent KEV additions (newest first).
const ranked = allCves.filter((c) => c.rank || c.recent)
  .sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || (b.added ?? '').localeCompare(a.added ?? ''));
// One index per language: localized name (vulnerability type + product) and summary, English original kept as `o`.
const cveIndexFor = (lang) => ranked.map(({ id, nickname, name, type, curated, rank, recent, vendor, product, severity, score, ransomware, epss, published, added, summary, priority }) => {
  const localName = lang === 'en' || nickname || !type ? (nickname ?? name) : `${TYPE_NAMES[type][lang]} — ${product}`;
  return {
    id, n: localName, ...(localName !== (nickname ?? name) && { o: nickname ?? name }),
    c: curated ? 1 : 0, r: rank, ...(recent && { nw: 1 }), v: vendor, p: product, sv: severity, s: score, rw: ransomware ? 1 : 0,
    e: epss, pub: published, kev: added, d: summary[lang] ?? summary.en, pr: priority,
  };
});
const cveIndex = cveIndexFor('en');

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
  // Beginner-friendly first, then featured, then A–Z — so newcomers see approachable resources first.
  resources: resources.sort((a, b) =>
    Number(b.level.includes('beginner')) - Number(a.level.includes('beginner')) ||
    Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title)),
  cves: cves.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
};

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'site'), DIST, { recursive: true });
data.cveTotal = allCves.length;
data.cveRanked = cveIndex.length;
fs.writeFileSync(path.join(DIST, 'data.json'), JSON.stringify(data));
for (const lang of taxonomy.languages) fs.writeFileSync(path.join(DIST, `cves.${lang}.json`), JSON.stringify(cveIndexFor(lang)));
// One detail file per CVE, loaded on demand by the CVE page.
fs.mkdirSync(path.join(DIST, 'cve'), { recursive: true });
for (const c of allCves) fs.writeFileSync(path.join(DIST, 'cve', `${c.id}.json`), JSON.stringify(c.detail));
fs.copyFileSync(path.join(ROOT, 'i18n/ui.json'), path.join(DIST, 'ui.json'));

console.log(`Built dist/ — ${resources.length} resources, ${allCves.length} CVE pages (${cves.length} curated, ${cveIndex.length} ranked), ${paths.length} paths, ${data.domains.length} domains.`);
