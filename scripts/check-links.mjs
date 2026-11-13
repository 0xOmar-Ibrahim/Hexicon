// Link health for every URL on the CVE pages (curated references, vendor advisories, patch links,
// walkthroughs …), written to data/link-health.json (generated — don't edit).
//
//   live      answers with 2xx/3xx
//   blocked   bot protection (401/403/429/503) — treated as alive, a browser can open it
//   dead      no answer or 4xx/5xx, confirmed by a second try at the end of the run
//
// For dead links the closest Wayback Machine snapshot is looked up. The website then shows the
// archived copy instead, or hides the link when no snapshot exists and it failed on two runs in a row.
// Library resources are checked by scripts/enrich-resources.mjs.
// Usage: npm run check:links            (add --only-dead to check only links that failed last time or are new)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data/link-health.json');
const TODAY = new Date().toISOString().slice(0, 10);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const onlyDead = process.argv.includes('--only-dead');
// Generated from ids, always valid, or checked elsewhere — no need to probe.
const SKIP = /^https?:\/\/(nvd\.nist\.gov\/vuln\/detail|www\.cve\.org|cve\.mitre\.org|attack\.mitre\.org|web\.archive\.org)\//i;

// ---------- collect ----------
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.yml') ? [path.join(dir, e.name)] : []);
const where = new Map(); // url -> [CVE ids]
const collect = (v, id) => {
  if (typeof v === 'string') { if (/^https?:\/\/\S+$/.test(v) && !SKIP.test(v)) (where.get(v) ?? where.set(v, []).get(v)).push(id); }
  else if (Array.isArray(v)) v.forEach((x) => collect(x, id));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collect(x, id));
};
for (const f of walk(path.join(ROOT, 'data/cves'))) collect(YAML.parse(fs.readFileSync(f, 'utf8')), path.basename(f, '.yml'));

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
let urls = [...where.keys()];
if (onlyDead) urls = urls.filter((u) => !previous[u] || previous[u].status === 'dead');
console.log(`Checking ${urls.length} URLs from ${new Set([...where.values()].flat()).size} CVE pages…`);

// ---------- probe ----------
async function pool(items, size, fn) {
  let i = 0, done = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const it = items[i++]; await fn(it); if (++done % 250 === 0) console.log(`  ${done}/${items.length}`); }
  }));
}
async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(20000) });
      res.body?.cancel?.().catch(() => {});
      if (res.status < 400) return res.status;
      if (method === 'HEAD') continue;
      return res.status;
    } catch { if (method === 'HEAD') continue; }
  }
  try { // TLS quirks some sites have with Node: let curl decide
    return Number(execFileSync('curl', ['-s', '-o', '/dev/null', '-L', '-m', '25', '-A', UA, '-w', '%{http_code}', url], { encoding: 'utf8', timeout: 40000 }).trim()) || 0;
  } catch { return 0; }
}
const verdict = (code) => (code >= 200 && code < 400 ? 'live' : [401, 403, 429, 503].includes(code) ? 'blocked' : 'dead');

const result = {};
await pool(urls, 16, async (u) => { const code = await probe(u); result[u] = { code, status: verdict(code) }; });

// Second chance for dead links (temporary outages, rate limits).
const retry = urls.filter((u) => result[u].status === 'dead');
if (retry.length) {
  console.log(`Re-checking ${retry.length} dead links…`);
  await new Promise((r) => setTimeout(r, 15000));
  await pool(retry, 6, async (u) => { const code = await probe(u); if (verdict(code) !== 'dead') result[u] = { code, status: verdict(code) }; });
}

// ---------- Wayback Machine for dead links ----------
async function snapshot(url) {
  try {
    const res = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'hexicon-links' }, signal: AbortSignal.timeout(30000) });
    const s = (await res.json())?.archived_snapshots?.closest;
    return s?.available && String(s.status).startsWith('2') ? s.url.replace(/^http:/, 'https:') : null;
  } catch { return null; }
}
const dead = urls.filter((u) => result[u].status === 'dead');
await pool(dead, 3, async (u) => { result[u].archive = previous[u]?.archive ?? (await snapshot(u)); });

// ---------- merge & write ----------
const health = {};
for (const u of where.keys()) {
  const prev = previous[u];
  const r = result[u];
  if (!r) { if (prev) health[u] = prev; continue; }
  health[u] = {
    status: r.status, code: r.code, checked: TODAY,
    ...(r.status !== 'dead' ? { last_ok: TODAY } : prev?.last_ok ? { last_ok: prev.last_ok } : {}),
    // At most one failure per day, so a re-run doesn't count as a second weekly check.
    fails: r.status === 'dead' ? (prev?.fails ?? 0) + (prev?.status === 'dead' && prev.checked === TODAY ? 0 : 1) : 0,
    ...(r.archive && { archive: r.archive }),
  };
}
fs.writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(health).sort()), null, 1) + '\n');

// ---------- report ----------
const rows = Object.entries(health).filter(([, h]) => h.status === 'dead');
let md = '<!-- Generated by scripts/check-links.mjs. Do not edit by hand. -->\n\n# CVE page link report\n\n';
const count = (s) => Object.values(health).filter((h) => h.status === s).length;
md += `Checked ${TODAY}: ${Object.keys(health).length} URLs on CVE pages — ${count('live')} live · ${count('blocked')} blocked by bot protection (fine in a browser) · ${count('dead')} dead.\n\n`;
md += 'Dead links are replaced on the website by their Wayback Machine snapshot. Links with no snapshot are hidden after failing on two runs in a row.\n\n';
md += '| URL | HTTP | Failed runs | Archived copy | Used on |\n|---|---|---|---|---|\n';
md += rows.map(([u, h]) => `| ${u} | ${h.code || 'no response'} | ${h.fails} | ${h.archive ? `[snapshot](${h.archive})` : '—'} | ${where.get(u).slice(0, 3).join(', ')}${where.get(u).length > 3 ? ' …' : ''} |`).join('\n') || '| — | — | — | — | — |';
fs.writeFileSync(path.join(ROOT, 'docs/cve-link-report.md'), md + '\n');
console.log(`Done: ${count('live')} live · ${count('blocked')} blocked · ${count('dead')} dead (${rows.filter(([, h]) => h.archive).length} with an archived copy)`);
