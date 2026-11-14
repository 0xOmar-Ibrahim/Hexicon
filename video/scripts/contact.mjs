// Contact sheet of out/qa/final/*.jpg (4 per row) → out/qa/final/sheet.png
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
const dir = path.resolve('out/qa/final');
const files = fs.readdirSync(dir).filter((f) => /^f\d+\.jpg$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
const html = `<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(4,640px);gap:4px;font:14px monospace;color:#fff">${files.map((f) => `<div style="position:relative"><img src="${f}" style="display:block;width:640px"><span style="position:absolute;left:6px;top:4px;background:#000a;padding:2px 6px">${f}</span></div>`).join('')}</body>`;
fs.writeFileSync(path.join(dir, 'sheet.html'), html);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--allow-file-access-from-files'] });
const p = await b.newPage();
await p.setViewport({ width: 2572, height: 400 });
await p.goto('file:///' + path.join(dir, 'sheet.html').split(path.sep).join('/'), { waitUntil: 'load' });
await p.screenshot({ path: path.join(dir, 'sheet.png'), fullPage: true });
await b.close();
