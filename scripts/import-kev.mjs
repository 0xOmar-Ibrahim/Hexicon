// Imports the most-exploited CVEs from the CISA Known Exploited Vulnerabilities catalog,
// ranked by FIRST EPSS (probability of exploitation in the next 30 days).
//
//   npm run import:kev            → top 1000
//   npm run import:kev -- 1500    → top 1500
//
// Pages are written to data/cves/<year>/<CVE>.yml with `source: kev-import`.
// Curated pages (no `source`, or `source: curated`) are never overwritten.
// CVSS / CWE / published date are filled afterwards by `npm run sync:cves`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { localizedSummaries } from './vuln-types.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data/cves');
const LIMIT = Number(process.argv[2]) || 1000;
const TODAY = new Date().toISOString().slice(0, 10);
const HEADER = '# Imported from CISA KEV by scripts/import-kev.mjs. `official` is synced from NVD, CISA KEV and FIRST EPSS.\n' +
  '# To curate this page by hand, improve it and set `source: curated` — the importer will then leave it alone.\n';

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'hexicon-kev-import' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const kev = (await getJson('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json')).vulnerabilities;
console.log(`CISA KEV: ${kev.length} entries`);

// EPSS in batches of 100
const epss = new Map();
for (let i = 0; i < kev.length; i += 100) {
  const ids = kev.slice(i, i + 100).map((v) => v.cveID).join(',');
  const res = await getJson(`https://api.first.org/data/v1/epss?cve=${ids}&limit=100`);
  for (const e of res.data) epss.set(e.cve, { score: Number(e.epss), percentile: Number(e.percentile), date: e.date });
}
console.log(`EPSS scores: ${epss.size}`);

const ranked = kev
  .map((v) => ({ v, e: epss.get(v.cveID) }))
  .sort((a, b) =>
    (b.e?.score ?? 0) - (a.e?.score ?? 0) ||
    Number(b.v.knownRansomwareCampaignUse === 'Known') - Number(a.v.knownRansomwareCampaignUse === 'Known') ||
    b.v.dateAdded.localeCompare(a.v.dateAdded))
  .slice(0, LIMIT);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const urlsFromNotes = (notes = '') =>
  [...new Set(notes.split(/\s*;\s*|\s+/).filter((u) => /^https:\/\/\S+$/.test(u)))]
    .filter((u) => !u.includes('cisa.gov/known-exploited-vulnerabilities') && !u.includes('nvd.nist.gov'))
    .slice(0, 3);

let written = 0, kept = 0;
for (const [rank, { v, e }] of ranked.entries()) {
  const id = v.cveID;
  const file = path.join(DIR, id.split('-')[1], `${id}.yml`);
  let previous = null;
  if (fs.existsSync(file)) {
    previous = YAML.parse(fs.readFileSync(file, 'utf8'));
    if ((previous.source ?? 'curated') === 'curated') {
      // Curated page: only record its rank, never touch the hand-written content.
      const doc = YAML.parseDocument(fs.readFileSync(file, 'utf8'));
      if (doc.get('rank') !== rank + 1) { doc.set('rank', rank + 1); fs.writeFileSync(file, doc.toString({ lineWidth: 0 })); }
      kept++;
      continue;
    }
  }
  const prevOfficial = previous?.official ?? {};
  const cwes = (v.cwes ?? []).filter((c) => /^CWE-\d+$/.test(c));
  const { type, summaries } = localizedSummaries({
    name: v.vulnerabilityName, vendor: v.vendorProject, product: v.product,
    dateAdded: v.dateAdded, ransomware: v.knownRansomwareCampaignUse === 'Known',
  });
  const page = {
    id,
    name: v.vulnerabilityName,
    source: 'kev-import',
    official: {
      ...(prevOfficial.published && { published: prevOfficial.published }),
      ...(prevOfficial.cvss && { cvss: prevOfficial.cvss }),
      ...((prevOfficial.cwe ?? cwes).length && { cwe: prevOfficial.cwe ?? cwes }),
      kev: { listed: true, date_added: v.dateAdded, ransomware_use: v.knownRansomwareCampaignUse === 'Known' ? 'Known' : 'Unknown' },
      ...(e && { epss: e }),
      synced_on: TODAY,
    },
    affected: [{ vendor: v.vendorProject, product: v.product }],
    vuln_type: type,
    summary: { en: v.shortDescription.length >= 40 ? v.shortDescription : `${v.vulnerabilityName}. ${v.shortDescription}`, ...summaries },
    references: [
      { kind: 'advisory', url: `https://nvd.nist.gov/vuln/detail/${id}`, title: 'NVD entry' },
      ...urlsFromNotes(v.notes).map((url) => ({ kind: 'advisory', url, title: 'Vendor / CISA reference' })),
    ],
    tags: [...new Set([slug(v.vendorProject), slug(v.product), ...(v.knownRansomwareCampaignUse === 'Known' ? ['ransomware'] : [])])].filter(Boolean),
    rank: rank + 1,
    added_by: '@hexicon-bot',
    added_on: previous?.added_on ?? TODAY,
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, HEADER + YAML.stringify(page, { lineWidth: 0 }));
  written++;
}
// Pages that fell out of the top N lose their rank (they stay in the library).
const inTop = new Set(ranked.map(({ v }) => v.cveID));
let unranked = 0;
for (const f of fs.readdirSync(DIR, { recursive: true }).filter((x) => /CVE-\d{4}-\d+\.yml$/.test(x))) {
  const file = path.join(DIR, f);
  if (inTop.has(path.basename(f, '.yml'))) continue;
  const doc = YAML.parseDocument(fs.readFileSync(file, 'utf8'));
  if (doc.has('rank')) { doc.delete('rank'); fs.writeFileSync(file, doc.toString({ lineWidth: 0 })); unranked++; }
}
console.log(`Top ${LIMIT}: ${written} pages written, ${kept} curated pages kept (rank only), ${unranked} pages un-ranked.`);
