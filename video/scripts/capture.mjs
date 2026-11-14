// Captures real Hexicon pages as 2x textures + element cutouts + layout.json
// for the promo video. Serves ../dist (run `npm run build` in the repo first)
// and drives the locally installed Edge through puppeteer-core.
//
//   node scripts/capture.mjs            # everything
//   node scripts/capture.mjs hero cve   # only some scenes
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '../../dist');
const OUT = path.resolve(HERE, '../public/textures');
const LAYOUT = path.resolve(HERE, '../src/layout.json');
const EDGE = process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 4390;
const ONLY = process.argv.slice(2);
const want = (s) => !ONLY.length || ONLY.includes(s);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

fs.mkdirSync(OUT, { recursive: true });
const layout = fs.existsSync(LAYOUT) ? JSON.parse(fs.readFileSync(LAYOUT, 'utf8')) : {};

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);

// Reveal-on-scroll content and the hero canvas must be fully drawn in every shot.
const SETTLE_CSS = `.reveal{opacity:1!important;transform:none!important;filter:none!important}
*{transition:none!important;animation-duration:0s!important;animation-delay:0s!important;caret-color:transparent!important}`;

async function open(url, wait = 900) {
  await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: SETTLE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, wait));
}
const rect = (sel, root = null) => page.evaluate((s, r) => {
  const base = r ? document.querySelector(r).getBoundingClientRect() : { left: 0, top: -window.scrollY };
  const e = document.querySelector(s); if (!e) return null;
  const b = e.getBoundingClientRect();
  return { x: Math.round(b.left - base.left), y: Math.round(b.top - base.top), w: Math.round(b.width), h: Math.round(b.height) };
}, sel, root);
async function cut(sel, file, pad = 0) {
  const b = await rect(sel);
  if (!b) throw new Error(`missing ${sel}`);
  await page.screenshot({ path: path.join(OUT, file), clip: { x: b.x - pad, y: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2 }, captureBeyondViewport: true });
  return b;
}
// Screenshot one viewport at the current scroll position; returns rects relative to it.
async function shot(file) {
  await page.screenshot({ path: path.join(OUT, file) });
}
async function scrollTo(sel, offset = 0) {
  await page.evaluate((s, o) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - o); }, sel, offset);
  await new Promise((r) => setTimeout(r, 400));
}
const vrect = (sel) => page.evaluate((s) => { const b = document.querySelector(s)?.getBoundingClientRect(); return b && { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; }, sel);

// ---- 1. hero in all five languages (the language sweep + opening push-in)
if (want('hero')) {
  layout.hero = {};
  for (const lang of ['en', 'de', 'fr', 'ar', 'ru']) {
    await open(`/?lang=${lang}`, 1400);
    await shot(`hero-${lang}.png`);
    layout.hero[lang] = { h1: await vrect('.hero h1'), nav: await vrect('header.nav') };
  }
  await open('/?lang=en');
  await cut('header.nav', 'nav.png');
  console.log('hero ok');
}

// ---- 2. library: empty search, then a typed search (type-and-filter)
if (want('library')) {
  await open('/?lang=en');
  await scrollTo('#explore', 40);
  layout.library = { q: await vrect('#q'), cards: await vrect('#cards'), count: await vrect('#count') };
  await shot('library-empty.png');
  layout.library.firstCards = await page.evaluate(() => [...document.querySelectorAll('#cards > *')].slice(0, 6).map((e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; }));
  await cut('#cards > *:first-child', 'card-first.png');
  await page.type('#q', 'burp', { delay: 30 });
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => document.activeElement.blur());
  await scrollTo('#explore', 40);
  await shot('library-typed.png');
  layout.library.typedCount = await page.$eval('#count', (e) => e.textContent);
  layout.library.typedCards = await page.evaluate(() => [...document.querySelectorAll('#cards > *')].slice(0, 6).map((e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; }));
  console.log('library ok', layout.library.typedCount);
}

// ---- 3. domain grid (14 topics)
if (want('domains')) {
  await open('/?lang=en');
  await scrollTo('#domains', 40);
  await shot('domains.png');
  layout.domains = { grid: await vrect('#domain-grid'), tiles: await page.evaluate(() => [...document.querySelectorAll('#domain-grid > *')].map((e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; })) };
  console.log('domains ok', layout.domains.tiles.length);
}

// ---- 4. CVE explorer: long ranked table (scroll-brake), target row = Log4Shell
if (want('cve')) {
  await open('/?lang=en');
  await scrollTo('#cves', 0); // the CVE index loads lazily when the section nears the viewport
  await page.waitForSelector('#kev-rows > tr', { timeout: 15000 });
  for (let i = 0; i < 4; i++) {
    const more = await page.$('#kmore:not([hidden])');
    if (!more) break;
    await more.click(); await new Promise((r) => setTimeout(r, 250));
  }
  const table = await rect('#kev table');
  const rows = await page.evaluate(() => [...document.querySelectorAll('#kev-rows > tr')].map((tr) => ({ id: (tr.textContent.match(/CVE-\d{4}-\d+/) ?? [''])[0], y: Math.round(tr.getBoundingClientRect().top + window.scrollY), h: Math.round(tr.getBoundingClientRect().height) })));
  await page.screenshot({ path: path.join(OUT, 'cve-table.png'), clip: { x: table.x, y: table.y, width: table.w, height: Math.min(table.h, 7800) }, captureBeyondViewport: true });
  layout.cveTable = { x: table.x, w: table.w, h: Math.min(table.h, 7800), rows: rows.map((r) => ({ ...r, y: r.y - table.y })) };
  const t = layout.cveTable.rows.findIndex((r) => r.id === 'CVE-2021-44228');
  layout.cveTable.target = t;
  if (t >= 0) {
    const r = layout.cveTable.rows[t];
    await page.screenshot({ path: path.join(OUT, 'cve-row-log4shell.png'), clip: { x: table.x, y: table.y + r.y, width: table.w, height: r.h }, captureBeyondViewport: true });
  }
  console.log('cve table ok', rows.length, 'rows, log4shell at', t);
}

// ---- 5. CVE detail page for Log4Shell
if (want('detail')) {
  await open('/?cve=CVE-2021-44228&lang=en', 1200);
  const info = await page.evaluate(() => {
    const v = document.querySelector('#cve-view');
    const sc = [v, document.scrollingElement].find((e) => e && e.scrollHeight > e.clientHeight + 10);
    return { viewScroll: sc === v, h: (sc ?? document.scrollingElement).scrollHeight };
  });
  // Screenshot the detail view as one tall page by growing the viewport.
  await page.setViewport({ width: 1920, height: Math.min(info.h, 7800), deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(OUT, 'cve-detail.png') });
  layout.detail = {
    pageH: Math.min(info.h, 7800),
    blocks: await page.evaluate(() => [...document.querySelectorAll('#cv-body > *, #cv-body section, #cv-body .cv-card')].slice(0, 40).map((e) => { const b = e.getBoundingClientRect(); return { cls: e.className, text: e.textContent.trim().slice(0, 40), x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; })),
  };
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  console.log('detail ok', layout.detail.pageH);
}

// ---- 6. bug bounty: section with every phase collapsed + one cutout per phase
if (want('bounty')) {
  await open('/?lang=en');
  await page.evaluate(() => document.querySelectorAll('#bb-phases details').forEach((d) => { d.open = false; }));
  await scrollTo('#bb-phases', 150);
  await shot('bounty.png');
  layout.bounty = { phases: await page.evaluate(() => [...document.querySelectorAll('#bb-phases > li')].map((e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; })) };
  const n = layout.bounty.phases.length;
  for (let i = 0; i < n; i++) await cut(`#bb-phases > li:nth-child(${i + 1})`, `phase-${i}.png`);
  await scrollTo('#bounty', 40);
  await shot('bounty-top.png');
  console.log('bounty ok', n, 'phases');
}

fs.writeFileSync(LAYOUT, JSON.stringify(layout, null, 2));
await browser.close();
server.close();
console.log('wrote', path.relative(process.cwd(), LAYOUT));
