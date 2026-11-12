// Enriches every data/cves/**/CVE-*.yml with an `intel:` block built from public sources:
//
//   affected versions & patch references  NVD JSON 2.0 yearly feeds (cached by sync-cves --feeds)
//   required action & due date            CISA Known Exploited Vulnerabilities catalog
//   public exploit availability           Exploit-DB index, Metasploit module metadata (links only, no code)
//   scanner templates                     ProjectDiscovery nuclei-templates
//   practice labs                         Vulhub
//   detection rules                       SigmaHQ
//   ATT&CK techniques                     MITRE CTID Mappings Explorer (KEV → ATT&CK)
//   patch priority                        computed here from KEV, ransomware use, EPSS and CVSS
//
// `intel:` is generated — never edit it by hand. Usage: npm run enrich:cves
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'data/cves');
const CACHE = path.join(ROOT, '.cache', 'enrich');
const NVD_CACHE = path.join(ROOT, '.cache', 'nvd');
const TODAY = new Date().toISOString().slice(0, 10);
const CVE_RE = /CVE[-_](\d{4})[-_](\d{4,})/gi;
fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(NVD_CACHE, { recursive: true });

const SOURCES = {
  nuclei: 'https://raw.githubusercontent.com/projectdiscovery/nuclei-templates/main/cves.json',
  exploitdb: 'https://gitlab.com/exploit-database/exploitdb/-/raw/main/files_exploits.csv',
  metasploit: 'https://raw.githubusercontent.com/rapid7/metasploit-framework/master/db/modules_metadata_base.json',
  vulhub: 'https://api.github.com/repos/vulhub/vulhub/git/trees/master?recursive=1',
  sigma: 'https://api.github.com/repos/SigmaHQ/sigma/git/trees/master?recursive=1',
  ctid: 'https://raw.githubusercontent.com/center-for-threat-informed-defense/mappings-explorer/main/mappings/kev/attack-16.1/kev-07.28.2025/enterprise/kev-07.28.2025_attack-16.1-enterprise.json',
  kev: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
};

// Download with a one-day cache.
async function cached(name, url) {
  const file = path.join(CACHE, name);
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 864e5) return fs.readFileSync(file, 'utf8');
  const res = await fetch(url, { headers: { 'User-Agent': 'hexicon-enrich', Accept: '*/*' } });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(file, text);
  return text;
}

const norm = (y, n) => `CVE-${y}-${n}`;
const push = (map, key, val) => { if (!map.has(key)) map.set(key, []); map.get(key).push(val); };

// Minimal RFC 4180 CSV parser (handles quoted fields with commas, quotes and newlines).
function parseCsv(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const files = fs.readdirSync(DIR, { recursive: true }).filter((f) => /CVE-\d{4}-\d+\.yml$/.test(f)).map((f) => path.join(DIR, f)).sort();
const ids = new Set(files.map((f) => path.basename(f, '.yml')));
console.log(`Enriching ${ids.size} CVE pages…`);

// --- Nuclei templates
const nuclei = new Map();
for (const line of (await cached('nuclei.jsonl', SOURCES.nuclei)).split('\n')) {
  if (!line.trim()) continue;
  try { const o = JSON.parse(line); if (ids.has(o.ID)) push(nuclei, o.ID, o.file_path); } catch { /* skip */ }
}

// --- Exploit-DB (existence + metadata only)
const edb = new Map();
const csv = parseCsv(await cached('exploitdb.csv', SOURCES.exploitdb));
const H = Object.fromEntries(csv[0].map((h, i) => [h, i]));
for (const r of csv.slice(1)) {
  const codes = r[H.codes] ?? '';
  for (const m of codes.matchAll(CVE_RE)) {
    const id = norm(m[1], m[2]);
    if (ids.has(id)) push(edb, id, { id: Number(r[H.id]), title: r[H.description], date: r[H.date_published], type: r[H.type], verified: r[H.verified] === '1' });
  }
}

// --- Metasploit modules (name and type only)
const msf = new Map();
const msfData = JSON.parse(await cached('metasploit.json', SOURCES.metasploit));
const RANKS = { 600: 'excellent', 500: 'great', 400: 'good', 300: 'normal', 200: 'average', 100: 'low', 0: 'manual' };
for (const m of Object.values(msfData)) {
  for (const ref of m.references ?? []) {
    const mm = /^CVE-(\d{4})-(\d+)$/i.exec(String(ref));
    if (mm && ids.has(norm(mm[1], mm[2]))) push(msf, norm(mm[1], mm[2]), { name: m.fullname, type: m.type, rank: RANKS[m.rank] ?? null, path: m.path });
  }
}

// --- Vulhub labs (directory per CVE)
const vulhub = new Map();
for (const e of JSON.parse(await cached('vulhub.json', SOURCES.vulhub)).tree ?? []) {
  if (e.type !== 'tree') continue;
  const m = /(?:^|\/)CVE-(\d{4})-(\d+)$/i.exec(e.path);
  if (m && ids.has(norm(m[1], m[2]))) push(vulhub, norm(m[1], m[2]), e.path);
}

// --- Sigma detection rules
const sigma = new Map();
for (const e of JSON.parse(await cached('sigma.json', SOURCES.sigma)).tree ?? []) {
  if (e.type !== 'blob' || !e.path.endsWith('.yml')) continue;
  for (const m of e.path.matchAll(CVE_RE)) {
    const id = norm(m[1], m[2]);
    if (ids.has(id) && !(sigma.get(id) ?? []).includes(e.path)) push(sigma, id, e.path);
  }
}

// --- ATT&CK techniques (MITRE CTID KEV mappings)
const attack = new Map();
for (const m of JSON.parse(await cached('ctid-kev.json', SOURCES.ctid)).mapping_objects ?? []) {
  if (!ids.has(m.capability_id) || !m.attack_object_id) continue;
  const list = attack.get(m.capability_id) ?? [];
  if (!list.some((x) => x.id === m.attack_object_id && x.role === m.mapping_type)) {
    list.push({ id: m.attack_object_id, name: m.attack_object_name, role: m.mapping_type });
    attack.set(m.capability_id, list);
  }
}

// --- CISA KEV required action
const kev = new Map(JSON.parse(await cached('kev.json', SOURCES.kev)).vulnerabilities.map((v) => [v.cveID, v]));

// --- NVD feeds: affected versions and patch references
const nvd = new Map();
for (const year of [...new Set([...ids].map((id) => id.split('-')[1]))].sort()) {
  const file = path.join(NVD_CACHE, `nvdcve-2.0-${year}.json.gz`);
  if (!fs.existsSync(file) || Date.now() - fs.statSync(file).mtimeMs > 7 * 864e5) {
    const res = await fetch(`https://nvd.nist.gov/feeds/json/cve/2.0/nvdcve-2.0-${year}.json.gz`, { headers: { 'User-Agent': 'hexicon-enrich' } });
    if (!res.ok) { console.warn(`! NVD feed ${year}: HTTP ${res.status}`); continue; }
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  for (const v of JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')).vulnerabilities ?? []) {
    if (ids.has(v.cve.id)) nvd.set(v.cve.id, v.cve);
  }
}

// cpe:2.3:a:vendor:product:version:... → readable "Product version range"
const pretty = (s) => s.replace(/\\/g, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
function affectedFrom(cve) {
  const out = new Set();
  const walk = (nodes = []) => {
    for (const n of nodes) {
      for (const m of n.cpeMatch ?? []) {
        if (!m.vulnerable) continue;
        const [, , part, , product, version] = m.criteria.split(':');
        if (part === 'o' && /^(windows|linux|android|ios|macos)/.test(product) === false && !m.versionEndExcluding && !m.versionEndIncluding && version === '*') continue;
        let range = '';
        if (m.versionStartIncluding) range += `≥ ${m.versionStartIncluding}`;
        if (m.versionStartExcluding) range += `> ${m.versionStartExcluding}`;
        if (m.versionEndExcluding) range += `${range ? ', ' : ''}< ${m.versionEndExcluding}`;
        if (m.versionEndIncluding) range += `${range ? ', ' : ''}≤ ${m.versionEndIncluding}`;
        if (!range && version && version !== '*' && version !== '-') range = version;
        out.add(`${pretty(product)}${range ? ' ' + range : ' (all versions listed by NVD)'}`);
      }
      walk(n.children);
    }
  };
  for (const c of cve.configurations ?? []) walk(c.nodes);
  return [...out];
}
function patchRefs(cve) {
  const want = ['Patch', 'Vendor Advisory', 'Mitigation', 'Release Notes'];
  const seen = new Set();
  return (cve.references ?? [])
    .filter((r) => r.url.startsWith('https://') && (r.tags ?? []).some((t) => want.includes(t)))
    .filter((r) => !seen.has(r.url) && seen.add(r.url))
    .slice(0, 6)
    .map((r) => ({ url: r.url, tags: (r.tags ?? []).filter((t) => want.includes(t)) }));
}

// --- Patch priority: P1 patch immediately, P2 this week, P3 on schedule
function priority(official, hasExploit) {
  const cvss = official?.cvss?.score ?? 0;
  const epss = official?.epss?.score ?? 0;
  const inKev = !!official?.kev?.listed;
  const rw = official?.kev?.ransomware_use === 'Known';
  const reasons = [];
  if (inKev) reasons.push('exploited');
  if (rw) reasons.push('ransomware');
  if (epss >= 0.5) reasons.push('epss-high');
  if (cvss >= 9) reasons.push('cvss-critical'); else if (cvss >= 7) reasons.push('cvss-high');
  if (hasExploit) reasons.push('public-exploit');
  // P1: ransomware + critical, or near-certain exploitation of a critical flaw with a public exploit.
  // P3: exploited but lower severity and no ransomware use. Everything else: P2.
  let level = 'P2';
  if ((rw && cvss >= 9) || (epss >= 0.97 && cvss >= 9 && hasExploit)) level = 'P1';
  else if (cvss > 0 && cvss < 7 && !rw) level = 'P3';
  return { level, reasons };
}

const cap = (arr, n) => ({ count: arr.length, items: arr.slice(0, n) });
// Words of the page's own product (e.g. "Log4j 2" → ["log4j"]), used to list the main product first.
const productWords = (doc) => String(doc.get('affected')?.toJSON?.()?.[0]?.product ?? '')
  .toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !/^(and|the|for|server|software|multiple|products?)$/.test(w));
const relevance = (text, words) => words.filter((w) => text.toLowerCase().includes(w)).length;
let changed = 0;
const stats = { exploitdb: 0, metasploit: 0, nuclei: 0, vulhub: 0, sigma: 0, attack: 0, affected: 0, P1: 0, P2: 0, P3: 0 };

for (const file of files) {
  const id = path.basename(file, '.yml');
  const doc = YAML.parseDocument(fs.readFileSync(file, 'utf8'));
  const official = doc.get('official')?.toJSON?.() ?? {};
  const cve = nvd.get(id);
  const k = kev.get(id);

  const words = productWords(doc);
  const e = (edb.get(id) ?? []).sort((a, b) => relevance(b.title, words) - relevance(a.title, words) ||
    Number(b.verified) - Number(a.verified) || (b.date ?? '').localeCompare(a.date ?? ''));
  const ms = msf.get(id) ?? [];
  const nu = [...new Set(nuclei.get(id) ?? [])];
  const vh = [...new Set(vulhub.get(id) ?? [])];
  const sg = sigma.get(id) ?? [];
  const at = attack.get(id) ?? [];
  const aff = (cve ? affectedFrom(cve) : []).sort((a, b) => relevance(b, words) - relevance(a, words));
  const prio = priority(official, e.length > 0 || ms.length > 0);

  const intel = {
    priority: prio.level,
    reasons: prio.reasons,
    ...(aff.length && { affected: cap(aff, 12) }),
    exploits: {
      exploitdb: cap(e.map(({ id: eid, title, date, type, verified }) => ({ id: eid, title, date, type, verified })), 5),
      metasploit: cap(ms.map(({ name, type, rank }) => ({ name, type, ...(rank && { rank }) })), 5),
    },
    ...(nu.length && { scanners: { nuclei: nu.slice(0, 5) } }),
    ...(vh.length && { labs: { vulhub: vh.slice(0, 5) } }),
    ...(sg.length && { detections: { sigma: cap(sg, 8) } }),
    ...(at.length && { attack: at }),
    fix: {
      ...(k?.requiredAction && { required_action: k.requiredAction }),
      ...(k?.dueDate && { due_date: k.dueDate }),
      ...(cve && patchRefs(cve).length && { references: patchRefs(cve) }),
    },
    enriched_on: TODAY,
  };

  stats.exploitdb += e.length > 0; stats.metasploit += ms.length > 0; stats.nuclei += nu.length > 0;
  stats.vulhub += vh.length > 0; stats.sigma += sg.length > 0; stats.attack += at.length > 0; stats.affected += aff.length > 0;
  stats[prio.level]++;

  const before = JSON.stringify({ ...(doc.get('intel')?.toJSON?.() ?? {}), enriched_on: null });
  if (JSON.stringify({ ...intel, enriched_on: null }) !== before) {
    doc.set('intel', doc.createNode(intel));
    fs.writeFileSync(file, doc.toString({ lineWidth: 0 }));
    changed++;
  }
}

const pct = (n) => `${n} (${Math.round((n / ids.size) * 100)}%)`;
console.log(`Done — ${changed} pages updated.
  affected versions ${pct(stats.affected)} · ATT&CK ${pct(stats.attack)}
  public exploit: Exploit-DB ${pct(stats.exploitdb)} · Metasploit ${pct(stats.metasploit)}
  Nuclei templates ${pct(stats.nuclei)} · Vulhub labs ${pct(stats.vulhub)} · Sigma rules ${pct(stats.sigma)}
  priority: P1 ${stats.P1} · P2 ${stats.P2} · P3 ${stats.P3}`);
