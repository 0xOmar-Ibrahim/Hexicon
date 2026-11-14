// Hexicon "Midnight Cartographer" tokens, copied from site/styles.css so the
// film speaks the product's own visual language (navy + brass + teal,
// Fraunces display, Inter body, JetBrains Mono kickers).
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { loadFont as loadArabic } from '@remotion/google-fonts/IBMPlexSansArabic';

loadFraunces('normal', { weights: ['600', '700'], subsets: ['latin'] });
loadFraunces('italic', { weights: ['600'], subsets: ['latin'] });
loadInter('normal', { weights: ['500', '600'], subsets: ['latin', 'cyrillic'] });
loadMono('normal', { weights: ['500'], subsets: ['latin'] });
loadArabic('normal', { weights: ['500', '600'], subsets: ['arabic'] });

export const C = {
  bg: '#0B1020',
  bg2: '#0F1629',
  surface: '#131B31',
  surface2: '#19223C',
  line: 'rgba(232, 163, 61, 0.16)',
  lineStrong: 'rgba(232, 163, 61, 0.38)',
  text: '#ECE6D9',
  muted: '#98A1B7',
  brass: '#E8A33D',
  teal: '#2DD4BF',
  coral: '#F25F5C',
  glow: 'rgba(232, 163, 61, 0.22)',
};

export const F = {
  display: '"Fraunces", "IBM Plex Sans Arabic", Georgia, serif',
  body: '"Inter", "IBM Plex Sans Arabic", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Consolas, monospace',
};

// Motion personality: "professional & trustworthy" preset (B2B / security),
// nudged one notch calmer — ~21f main moves, no overshoot on plain fades,
// real overshoot (y1 > 1) only where something physically lands.
export const EASE = {
  enter: [0, 0, 0.2, 1] as const,
  press: [0.2, 0.75, 0.3, 1] as const,
  land: [0.34, 1.4, 0.44, 1] as const,
  cam: [0.33, 0, 0.15, 1] as const,
};

export const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
