// Fills the `official:` block of every data/cves/**/CVE-*.yml from authoritative sources:
//   CISA KEV (listing, date, ransomware use) and FIRST EPSS — refreshed for every page, in bulk;
//   NVD API 2.0 (published date, CVSS, CWE) — only for pages that are missing it or older than --max-age days.
// Curated fields are never touched. Progress is saved after every page, so the run can be resumed.
//
//   npm run sync:cves                         → default (NVD for pages missing CVSS or older than 30 days)
//   npm run sync:cves -- --max-age 0          → force NVD refresh for every page
//   npm run sync:cves -- --limit 200          → at most 200 NVD calls this run
//   npm run sync:cves -- --feeds              → use NVD yearly bulk feeds (fast; recommended for many pages)
// Set NVD_API_KEY to go ~10x faster.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { readNvdFeed } from './lib-nvd.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data/cves');
const KEY = process.env.NVD_API_KEY;
const DELAY = KEY ? 700 : 6500; // NVD public rate limit: 5 requests / 30 s
const TODAY = new Date().toISOString().slice(0, 10);
const arg = (name, def) => { const i = process.argv.indexOf(name); return i > 0 ? Number(process.argv[i + 1]) : def; };
const MAX_AGE = arg('--max-age', 30);
const NVD_LIMIT = arg('--limit', Infinity);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const files = fs.readdirSync(DIR, { recursive: true })
  .filter((f) => /CVE-\d{4}-\d+\.yml$/.test(f))
  .map((f) => path.join(DIR, f))
  .sort();
const ids = files.map((f) => path.basename(f, '.yml'));

async function getJson(url, headers = {}) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'hexicon-cve-sync', ...headers } });
      if (res.ok) return res.json();
      if (res.status === 404) return null;
      if (attempt < 4 && (res.status === 403 || res.status === 429 || res.status >= 500)) { await sleep(DELAY * 3); continue; }
      throw new Error(`${res.status} ${url}`);
    } catch (err) {
      if (attempt === 4) throw err;
      await sleep(DELAY * 2);
    }
  }
}

function pickCvss(metrics = {}) {
  for (const [key, version] of [['cvssMetricV40', '4.0'], ['cvssMetricV31', '3.1'], ['cvssMetricV30', '3.0'], ['cvssMetricV2', '2.0']]) {
    const list = metrics[key];
    if (!list?.length) continue;
    const m = list.find((x) => x.type === 'Primary') ?? list[0];
    const d = m.cvssData;
    const severity = (d.baseSeverity ?? m.baseSeverity ?? '').toLowerCase() || undefined;
    return { version, score: d.baseScore, vector: d.vectorString, ...(severity && { severity }) };
  }
  return undefined;
}

// Bulk sources
const kev = await getJson('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
const kevById = new Map(kev.vulnerabilities.map((v) => [v.cveID, v]));
const epssById = new Map();
for (let i = 0; i < ids.length; i += 100) {
  const res = await getJson(`https://api.first.org/data/v1/epss?cve=${ids.slice(i, i + 100).join(',')}&limit=100`);
  for (const e of res?.data ?? []) epssById.set(e.cve, { score: Number(e.epss), percentile: Number(e.percentile), date: e.date });
}

// --feeds: use NVD's yearly JSON 2.0 bulk feeds instead of one API call per CVE (minutes instead of hours).
const FEEDS = process.argv.includes('--feeds');
const feedCves = new Map();
if (FEEDS) {
  const zlib = await import('node:zlib');
  const cacheDir = path.join(ROOT, '.cache', 'nvd');
  fs.mkdirSync(cacheDir, { recursive: true });
  const wanted = new Set(ids);
  const years = [...new Set(ids.map((id) => id.split('-')[1]))].sort();
  for (const year of years) {
    const file = path.join(cacheDir, `nvdcve-2.0-${year}.json.gz`);
    const fresh = fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 864e5;
    if (!fresh) {
      const res = await fetch(`https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-${year}.json.gz`, { headers: { 'User-Agent': 'hexicon-cve-sync' } });
      if (!res.ok) { console.warn(`! feed ${year}: HTTP ${res.status}`); continue; }
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    let hits = 0;
    for (const v of readNvdFeed(file, wanted)) { feedCves.set(v.cve.id, v.cve); hits++; }
    console.log(`feed ${year}: ${hits} matching CVEs`);
  }
}

const ageDays = (d) => (d ? (Date.now() - new Date(d).getTime()) / 864e5 : Infinity);
let nvdCalls = 0, updated = 0;

for (const [i, file] of files.entries()) {
  const id = ids[i];
  const doc = YAML.parseDocument(fs.readFileSync(file, 'utf8'));
  const prev = doc.get('official')?.toJSON?.() ?? {};
  let { published, cvss, cwe } = prev;

  const needsNvd = !cvss || ageDays(prev.nvd_synced_on ?? prev.synced_on) > MAX_AGE || MAX_AGE === 0;
  let nvdDate = prev.nvd_synced_on;
  if (FEEDS ? needsNvd || feedCves.has(id) : needsNvd && nvdCalls < NVD_LIMIT) {
    let cve;
    if (FEEDS) {
      cve = feedCves.get(id);
    } else {
      if (nvdCalls > 0) await sleep(DELAY);
      nvdCalls++;
      const nvd = await getJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${id}`, KEY ? { apiKey: KEY } : {});
      cve = nvd?.vulnerabilities?.[0]?.cve;
    }
    if (cve) {
      published = cve.published.slice(0, 10);
      cvss = pickCvss(cve.metrics) ?? cvss;
      const w = [...new Set((cve.weaknesses ?? []).flatMap((x) => x.description.map((d) => d.value)))]
        .filter((c) => /^(CWE-\d+|NVD-CWE-Other|NVD-CWE-noinfo)$/.test(c));
      if (w.length) cwe = w;
      nvdDate = TODAY;
    } else {
      console.warn(`! ${id}: not found in NVD`);
    }
  }

  const k = kevById.get(id);
  const e = epssById.get(id);
  const official = {
    ...(published && { published }),
    ...(cvss && { cvss }),
    ...(cwe?.length && { cwe }),
    kev: k ? { listed: true, date_added: k.dateAdded, ransomware_use: k.knownRansomwareCampaignUse === 'Known' ? 'Known' : 'Unknown' } : { listed: false },
    ...(e && { epss: e }),
    ...(nvdDate && { nvd_synced_on: nvdDate }),
    synced_on: TODAY,
  };

  const before = JSON.stringify(prev);
  if (JSON.stringify(official) !== before) {
    doc.set('official', doc.createNode(official));
    fs.writeFileSync(file, doc.toString({ lineWidth: 0 }));
    updated++;
  }
  if (!FEEDS && needsNvd && nvdCalls % 25 === 0) console.log(`… ${i + 1}/${files.length} pages, ${nvdCalls} NVD calls`);
}
console.log(`Synced ${files.length} CVE pages (${updated} updated, ${nvdCalls} NVD calls).`);
