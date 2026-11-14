// Copies the music bed and sound effects used by the promo from the
// video-shotcraft skill library (Mixkit free licence) into public/audio.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = process.env.SHOTCRAFT_AUDIO ?? path.join(os.homedir(), '.claude/plugins/synced/d55e9227-09f8-4955-8632-2ce0afbc7e03_64eb4534-f9f6-4cd4-8a47-8fd08d202451/74655670-1540-4e3d-8509-c2f446898c2c/assets/audio');
const OUT = path.resolve(HERE, '../public/audio');
const FILES = [
  'bgm/cat-walk.mp3', // "Cat Walk" by Arulo, Mixkit Stock Music Free License
  'sfx/transition/transition-soft.mp3', 'sfx/transition/whoosh-fast.mp3', 'sfx/transition/whoosh-big.mp3',
  'sfx/transition/swoosh-quick.mp3', 'sfx/transition/sweep-fast.mp3', 'sfx/riser/riser-cine.mp3',
  'sfx/impact/impact-deep-whoosh.mp3', 'sfx/impact/hit-weak.mp3', 'sfx/light/sparkle.mp3',
  'sfx/text/keyboard.mp3', 'sfx/camera/click-camera.mp3', 'sfx/ui/pop.mp3',
];
fs.mkdirSync(OUT, { recursive: true });
for (const f of FILES) fs.copyFileSync(path.join(SKILL, f), path.join(OUT, path.basename(f)));
console.log(`copied ${FILES.length} files to public/audio`);
