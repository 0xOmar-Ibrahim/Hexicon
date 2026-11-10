// Fills the `official:` block of every data/cves/**/CVE-*.yml from authoritative sources:
//   NVD API 2.0 (published date, CVSS, CWE) · CISA KEV (listing, date, ransomware use) · FIRST EPSS.
// Curated fields are never touched. Usage: npm run sync:cves  (optional env NVD_API_KEY).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data/cves');
const KEY = process.env.NVD_API_KEY;
const DELAY = KEY ? 700 : 6500; // NVD public rate limit: 5 requests / 30 s
const TODAY = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const files = fs.readdirSync(DIR, { recursive: true })
  .filter((f) => /CVE-\d{4}-\d+\.yml$/.test(f))
  .map((f) => path.join(DIR, f));

async function getJson(url, headers = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'hexicon-cve-sync', ...headers } });
    if (res.ok) return res.json();
    if (attempt < 3 && (res.status === 403 || res.status === 429 || res.status >= 500)) { await sleep(DELAY * 2); continue; }
    throw new Error(`${res.status} ${url}`);
  }
}

function pickCvss(metrics = {}) {
  for (const [key, version] of [['cvssMetricV40', '4.0'], ['cvssMetricV31', '3.1'], ['cvssMetricV30', '3.0'], ['cvssMetricV2', '2.0']]) {
    const list = metrics[key];
    if (!list?.length) continue;
    const m = list.find((x) => x.type === 'Primary') ?? list[0];
    const d = m.cvssData;
    const severity = (d.baseSeverity ?? m.baseSeverity ?? '').toLowerCase() || undefined;
    return { version, score: d.baseScore, vector: d.vectorString, severity };
  }
  return undefined;
}

const kev = await getJson('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
const kevById = new Map(kev.vulnerabilities.map((v) => [v.cveID, v]));
const ids = files.map((f) => path.basename(f, '.yml'));
const epss = await getJson(`https://api.first.org/data/v1/epss?cve=${ids.join(',')}`);
const epssById = new Map(epss.data.map((e) => [e.cve, e]));

let changed = 0;
for (const [i, file] of files.entries()) {
  const id = ids[i];
  const doc = YAML.parseDocument(fs.readFileSync(file, 'utf8'));
  const nvd = await getJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${id}`, KEY ? { apiKey: KEY } : {});
  const cve = nvd.vulnerabilities?.[0]?.cve;
  if (!cve) { console.warn(`! ${id}: not found in NVD`); continue; }

  const cwe = [...new Set((cve.weaknesses ?? []).flatMap((w) => w.description.map((d) => d.value)))];
  const k = kevById.get(id);
  const e = epssById.get(id);
  const official = {
    published: cve.published.slice(0, 10),
    ...(pickCvss(cve.metrics) && { cvss: pickCvss(cve.metrics) }),
    ...(cwe.length && { cwe }),
    kev: k ? { listed: true, date_added: k.dateAdded, ransomware_use: k.knownRansomwareCampaignUse === 'Known' ? 'Known' : 'Unknown' } : { listed: false },
    ...(e && { epss: { score: Number(e.epss), percentile: Number(e.percentile), date: e.date } }),
    synced_on: TODAY,
  };

  const before = JSON.stringify(doc.get('official')?.toJSON?.() ?? null);
  doc.set('official', doc.createNode(official, { flow: false }));
  if (JSON.stringify(official) !== before) {
    fs.writeFileSync(file, doc.toString({ lineWidth: 0 }));
    changed++;
  }
  console.log(`✓ ${id}  CVSS ${official.cvss?.score ?? '—'}  KEV ${official.kev.listed ? 'yes' : 'no'}  EPSS ${official.epss?.score ?? '—'}`);
  if (i < files.length - 1) await sleep(DELAY);
}
console.log(`Synced ${files.length} CVE pages, ${changed} updated.`);
