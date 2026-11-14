// QA stills: bundle once, render many frames → out/qa/<label>/f<frame>.jpg
import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const frames = process.argv.slice(3).map(Number);
const label = process.argv[2] ?? 'v1';
const browserExecutable = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'HexiconPromo', inputProps: { bgm: false }, browserExecutable });
fs.mkdirSync(`out/qa/${label}`, { recursive: true });
for (const frame of frames) {
  await renderStill({ composition, serveUrl, frame, output: `out/qa/${label}/f${frame}.jpg`, imageFormat: 'jpeg', jpegQuality: 88, inputProps: { bgm: false }, browserExecutable, chromiumOptions: { gl: 'angle' } });
  console.log('still', frame);
}
