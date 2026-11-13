// Quality signals for every library resource, written to data/resource-stats.json (generated — don't edit):
//
//   repo   GitHub stars, forks, last push, archived flag, license   (ecosyste.ms public API, no token needed)
//   link   live / blocked / dead, HTTP status, date checked         (HEAD, then GET, then curl fallback)
//   health maintained / stale / archived / broken                   (computed)
//
// Also writes docs/link-report.md listing dead links and archived or stale projects for maintainers.
// Usage: npm run enrich:resources   (add --repos-only or --links-only to run one half)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data/resource-stats.json');
const TODAY = new Date().toISOString().slice(0, 10);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const reposOnly = process.argv.includes('--repos-only');
const linksOnly = process.argv.includes('--links-only');

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.yml') ? [path.join(dir, e.name)] : []);
const resources = walk(path.join(ROOT, 'data/resources')).map((f) => {
  const r = YAML.parse(fs.readFileSync(f, 'utf8'));
  return { key: `${path.basename(path.dirname(f))}/${path.basename(f, '.yml')}`, title: r.title, url: r.url, repo: r.repo };
});
const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const stats = Object.fromEntries(resources.map((r) => [r.key, previous[r.key] ?? {}]));

// Run async jobs with limited concurrency.
async function pool(items, size, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) { const it = items[i++]; await fn(it); } }));
}

// ---------- GitHub repository health ----------
const ghRepo = (r) => {
  const m = /github\.com\/([^/#?]+)\/([^/#?]+)/i.exec(r.repo || r.url || '');
  return m && !['orgs', 'topics', 'advisories', 'sponsors'].includes(m[1].toLowerCase()) ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : null;
};
if (!linksOnly) {
  const withRepo = resources.filter(ghRepo);
  let ok = 0;
  await pool(withRepo, 6, async (r) => {
    const full = ghRepo(r);
    try {
      const res = await fetch(`https://repos.ecosyste.ms/api/v1/hosts/GitHub/repositories/${encodeURIComponent(full)}`, { headers: { 'User-Agent': 'hexicon-quality' } });
      if (!res.ok) return;
      const d = await res.json();
      stats[r.key].repo = {
        name: d.full_name ?? full,
        stars: d.stargazers_count ?? null,
        forks: d.forks_count ?? null,
        pushed: (d.pushed_at ?? '').slice(0, 10) || null,
        archived: !!d.archived,
        license: d.license ?? null,
        language: d.language ?? null,
        checked: TODAY,
      };
      ok++;
    } catch { /* keep previous data */ }
  });
  console.log(`repos: ${ok}/${withRepo.length} refreshed`);
}

// ---------- Link health ----------
async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(20000) });
      if (res.status < 400) return res.status;
      if (method === 'HEAD' && [400, 403, 404, 405, 429, 500, 501, 503].includes(res.status)) continue;
      return res.status;
    } catch { if (method === 'HEAD') continue; }
  }
  try { // TLS quirks some sites have with Node: let curl decide
    const code = execFileSync('curl', ['-s', '-o', '/dev/null', '-L', '-m', '25', '-A', UA, '-w', '%{http_code}', url], { encoding: 'utf8', timeout: 40000 }).trim();
    return Number(code) || 0;
  } catch { return 0; }
}
if (!reposOnly) {
  const counts = { live: 0, blocked: 0, dead: 0 };
  await pool(resources, 12, async (r) => {
    const code = await probe(r.url);
    const status = code >= 200 && code < 400 ? 'live' : [401, 403, 429, 503].includes(code) ? 'blocked' : 'dead';
    const prev = stats[r.key].link;
    stats[r.key].link = {
      status, code, checked: TODAY,
      ...(status === 'live' ? { last_ok: TODAY } : prev?.last_ok ? { last_ok: prev.last_ok } : {}),
      fails: status === 'dead' ? (prev?.fails ?? 0) + 1 : 0,
    };
    counts[status]++;
  });
  console.log(`links: ${counts.live} live · ${counts.blocked} blocked by bot protection · ${counts.dead} dead`);
}

// ---------- Health verdict ----------
const monthsSince = (d) => (d ? (Date.now() - new Date(d).getTime()) / (30.44 * 864e5) : null);
for (const s of Object.values(stats)) {
  const age = monthsSince(s.repo?.pushed);
  s.health = s.link?.status === 'dead' && (s.link.fails ?? 0) >= 2 ? 'broken'
    : s.repo?.archived ? 'archived'
    : age != null && age > 24 ? 'stale'
    : age != null ? 'maintained'
    : 'unknown';
}
fs.writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(stats).sort()), null, 1) + '\n');

// ---------- Maintainer report ----------
const byKey = Object.fromEntries(resources.map((r) => [r.key, r]));
const rows = (pred) => Object.entries(stats).filter(([, s]) => pred(s)).map(([k, s]) => ({ k, s, r: byKey[k] }));
const dead = rows((s) => s.link?.status === 'dead');
const archived = rows((s) => s.repo?.archived);
const stale = rows((s) => s.health === 'stale');
let md = '<!-- Generated by scripts/enrich-resources.mjs. Do not edit by hand. -->\n\n# Link & maintenance report\n\n';
md += `Checked ${TODAY}. ${dead.length} dead links · ${archived.length} archived projects · ${stale.length} projects without a push in 2+ years.\n\n`;
md += 'Links that fail on two weekly checks in a row are marked *broken* on the website. Please fix the URL or mark the resource `status: archived`.\n\n';
md += '## Dead links\n\n| Resource | URL | HTTP | Failed checks |\n|---|---|---|---|\n';
md += dead.map(({ k, s, r }) => `| \`${k}\` | ${r.url} | ${s.link.code || 'no response'} | ${s.link.fails} |`).join('\n') || '| — | — | — | — |';
md += '\n\n## Archived repositories\n\n| Resource | Repository |\n|---|---|\n';
md += archived.map(({ k, s }) => `| \`${k}\` | https://github.com/${s.repo.name} |`).join('\n') || '| — | — |';
md += '\n\n## No push in 2+ years\n\n| Resource | Repository | Last push |\n|---|---|---|\n';
md += stale.map(({ k, s }) => `| \`${k}\` | https://github.com/${s.repo.name} | ${s.repo.pushed} |`).join('\n') || '| — | — | — |';
fs.writeFileSync(path.join(ROOT, 'docs/link-report.md'), md + '\n');

const h = Object.values(stats).reduce((a, s) => ((a[s.health] = (a[s.health] ?? 0) + 1), a), {});
console.log('health:', h);
