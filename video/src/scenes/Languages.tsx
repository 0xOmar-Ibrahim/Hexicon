// theme-sweep-toggle used as a LANGUAGE sweep: the same homepage, captured for
// real in each language, is wiped on in place by a 15° brass boundary —
// English → Deutsch → Français → العربية (layout mirrors right-to-left) → Русский.
// Deviation from the card (≤1 theme switch per film): here the sweep IS the
// feature (five languages), so it runs four times with a hold between each.
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, CL } from '../theme';

export const LANGS = ['en', 'de', 'fr', 'ar', 'ru'] as const;
export const SWEEP_LEN = 28;
export const SWEEP_GAP = 44; // sweep + ~0.5s hold to read each language
export const SWEEP_FIRST = 34;
export const sweepStart = (i: number) => SWEEP_FIRST + (i - 1) * SWEEP_GAP; // i = 1..4
export const LANG_DURATION = sweepStart(4) + SWEEP_LEN + 46; // ≈ 240
const SLANT = 1080 * Math.tan((15 * Math.PI) / 180);

export const SceneLanguages: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, LANG_DURATION], [1.0, 1.05], CL);
  const fadeIn = interpolate(frame, [0, 8], [0, 1], CL);
  return (
    <AbsoluteFill style={{ background: C.bg, opacity: fadeIn }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Img src={staticFile('textures/hero-en.png')} style={{ position: 'absolute', inset: 0, width: 1920, height: 1080 }} />
        {LANGS.slice(1).map((lang, k) => {
          const i = k + 1;
          const s = sweepStart(i);
          if (frame < s) return null;
          const p = interpolate(frame, [s, s + SWEEP_LEN], [-20, 1920 + SLANT + 40], { ...CL, easing: Easing.out(Easing.poly(3)) });
          const settle = interpolate(frame, [s + SWEEP_LEN, s + SWEEP_LEN + 1, s + SWEEP_LEN + 12], [1, 0.988, 1], { ...CL, easing: Easing.out(Easing.cubic) });
          const lineOp = interpolate(frame, [s, s + 4, s + SWEEP_LEN - 4, s + SWEEP_LEN + 2], [0, 1, 1, 0], CL);
          return (
            <React.Fragment key={lang}>
              <AbsoluteFill style={{ clipPath: `polygon(0 0, ${p}px 0, ${p - SLANT}px 1080px, 0 1080px)`, transform: `scale(${settle})` }}>
                <Img src={staticFile(`textures/hero-${lang}.png`)} style={{ position: 'absolute', inset: 0, width: 1920, height: 1080 }} />
              </AbsoluteFill>
              {lineOp > 0 ? (
                <div style={{ position: 'absolute', left: p - SLANT / 2 - 2, top: -80, width: 4, height: 1240, background: C.brass, boxShadow: `0 0 22px 6px rgba(232,163,61,0.7)`, transform: 'rotate(15deg)', opacity: lineOp }} />
              ) : null}
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
