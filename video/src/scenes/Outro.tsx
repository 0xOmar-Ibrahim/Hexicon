// outro-group-photo-launch: one real element from every feature shown flies
// in from its side and settles around the wordmark (Q8) — nav, library search,
// a library card, the CVE detail header, the Log4Shell row, a bounty phase,
// the Arabic headline, a topic tile — under a crane-in camera, brass stage
// light and deterministic dust. Wordmark letterpress, rule, URL; 1s+ hold.
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Crop, HexMark } from '../lib/ui';
import { C, CL, F } from '../theme';
import layout from '../layout.json';

export const OUTRO_DURATION = 170;
const FLY = Easing.bezier(0.34, 1.4, 0.44, 1);
const CRANE = Easing.bezier(0.3, 0, 0.2, 1);
const LETTERS = 'Hexicon'.split('');
export const STAMP = 42; // wordmark starts landing

type El = { key: string; w: number; h: number; cx: number; cy: number; scale: number; rot: number; dx: number; dy: number; cue: number; node: React.ReactNode };
const L = layout;
const det = L.detail.blocks[0];
const bc = L.library.typedCards[1];
const tile = L.domains.tiles[1];
const ar = L.hero.ar.h1;
const img = (f: string) => <Img src={staticFile(`textures/${f}`)} style={{ width: '100%', height: '100%', display: 'block' }} />;

// render order = cue order (later arrivals on top)
const ELS: El[] = [
  { key: 'nav', w: 1920, h: 68, cx: 960, cy: 70, scale: 0.6, rot: 0, dx: 0, dy: -140, cue: 4, node: img('nav.png') },
  { key: 'search', w: L.library.q.w + 80, h: 54, cx: 690, cy: 205, scale: 0.72, rot: -1.5, dx: -120, dy: -260, cue: 7, node: <Crop src="textures/library-typed.png" pageH={1080} x={L.library.q.x - 48} y={L.library.q.y - 2} w={L.library.q.w + 80} h={54} style={{ borderRadius: 11 }} /> },
  { key: 'card', w: bc.w, h: bc.h, cx: 300, cy: 440, scale: 0.78, rot: -4, dx: -520, dy: 0, cue: 10, node: <Crop src="textures/library-typed.png" pageH={1080} x={bc.x} y={bc.y} w={bc.w} h={bc.h} /> },
  { key: 'detail', w: det.w, h: det.h, cx: 1610, cy: 430, scale: 0.42, rot: 3, dx: 520, dy: 0, cue: 13, node: <Crop src="textures/cve-detail.png" pageH={L.detail.pageH} x={det.x} y={det.y} w={det.w} h={det.h} /> },
  { key: 'ar', w: ar.w + 40, h: ar.h + 20, cx: 330, cy: 800, scale: 0.46, rot: 2, dx: -420, dy: 300, cue: 16, node: <Crop src="textures/hero-ar.png" pageH={1080} x={ar.x - 20} y={ar.y - 10} w={ar.w + 40} h={ar.h + 20} style={{ backgroundColor: C.bg }} /> },
  { key: 'row', w: L.cveTable.w, h: L.cveTable.rows[L.cveTable.target].h, cx: 1470, cy: 790, scale: 0.6, rot: -2, dx: 460, dy: 280, cue: 19, node: img('cve-row-log4shell.png') },
  { key: 'phase', w: L.bounty.phases[2].w, h: L.bounty.phases[2].h, cx: 900, cy: 950, scale: 0.6, rot: 1, dx: 0, dy: 340, cue: 22, node: img('phase-2.png') },
  { key: 'tile', w: tile.w, h: tile.h, cx: 1560, cy: 190, scale: 0.72, rot: 2.5, dx: 380, dy: -220, cue: 25, node: <Crop src="textures/domains.png" pageH={1080} x={tile.x} y={tile.y} w={tile.w} h={tile.h} /> },
];

const DUST = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 439 + 137) % 1920, y0: (i * 613 + 271) % 1080, rise: 0.3 + (i % 5) * 0.11,
  amp: 9 + (i % 4) * 5, freq: 0.022 + (i % 3) * 0.008, ph: (i * 0.83) % 6.283, size: 2 + (i % 3) * 0.6, op: 0.18 + ((i * 7) % 5) * 0.06,
}));

export const SceneOutro: React.FC<{ hold?: boolean }> = () => {
  const frame = useCurrentFrame();
  const d = OUTRO_DURATION;
  const bgBlur = interpolate(frame, [0, 24], [0, 14], { ...CL, easing: Easing.bezier(0.4, 0, 0.4, 1) });
  const craneT = interpolate(frame, [0, 40], [0, 1], { ...CL, easing: CRANE });
  const pushT = interpolate(frame, [40, d], [0, 1], CL);
  const recede = interpolate(frame, [STAMP, STAMP + 8], [0, 1], CL);
  const sweepX = interpolate(frame, [2, 14], [-700, 2020], { ...CL, easing: Easing.bezier(0.4, 0, 0.6, 1) });
  const sweepOp = interpolate(frame, [2, 5, 11, 14], [0, 0.16, 0.16, 0], CL);
  const stage = interpolate(frame, [STAMP, STAMP + 8, STAMP + 16], [0, 0.55, 0.3], CL);
  const mark = interpolate(frame, [STAMP - 8, STAMP + 6], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const rule = interpolate(frame, [STAMP + 16, STAMP + 28], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const ext = interpolate(frame, [STAMP + 16, STAMP + 24], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const extFade = interpolate(frame, [STAMP + 24, STAMP + 30], [1, 0], CL);
  const url = interpolate(frame, [STAMP + 26, STAMP + 38], [0, 1], { ...CL, easing: Easing.bezier(0, 0, 0.2, 1) });
  const sub = interpolate(frame, [STAMP + 34, STAMP + 46], [0, 1], CL);
  const spacing = interpolate(frame, [STAMP + 20, STAMP + 24], [-0.015, 0], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const fadeIn = interpolate(frame, [0, 6], [0, 1], CL);

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: fadeIn }}>
      <AbsoluteFill style={{ transform: `perspective(1400px) rotateX(${4 * (1 - craneT)}deg) scale(${1.06 - 0.06 * craneT + 0.035 * pushT})`, transformOrigin: '50% 45%' }}>
        <Img src={staticFile('textures/hero-en.png')} style={{ position: 'absolute', inset: 0, width: 1920, height: 1080, filter: `blur(${bgBlur}px)` }} />
        <AbsoluteFill style={{ background: 'radial-gradient(1200px 800px at 50% 48%, rgba(11,16,32,0.86), rgba(11,16,32,0.62) 60%, rgba(11,16,32,0.45))' }} />
        {ELS.map((el) => {
          if (frame < el.cue) return null;
          const t = interpolate(frame, [el.cue, el.cue + 12], [0, 1], { ...CL, easing: FLY });
          const lin = interpolate(frame, [el.cue, el.cue + 12], [0, 1], CL);
          const op = interpolate(frame, [el.cue, el.cue + 3], [0, 1], CL) * (1 - 0.14 * recede);
          const air = Math.max(0, 1 - t);
          const tf = (k: number) => `translate(${el.dx * (1 - t) + el.dx * k}px, ${el.dy * (1 - t) + el.dy * k}px) rotate(${el.rot * (2 - t)}deg) scale(${el.scale * (1.12 - 0.12 * t)})`;
          const glow = interpolate(frame, [el.cue + 12, el.cue + 18], [0.4, 0], CL);
          const base: React.CSSProperties = { position: 'absolute', left: el.cx - el.w / 2, top: el.cy - el.h / 2, width: el.w, height: el.h, transformOrigin: 'center', borderRadius: 14, overflow: 'hidden' };
          return (
            <React.Fragment key={el.key}>
              {lin > 0.05 && lin < 0.95 ? <div style={{ ...base, transform: tf(0.08), opacity: 0.22 * (1 - lin), filter: 'blur(8px)' }}>{el.node}</div> : null}
              <div style={{ ...base, transform: tf(0), opacity: op, filter: `saturate(${1 - 0.1 * recede})`, border: `1px solid ${C.line}`, boxShadow: `0 ${10 + 26 * air}px ${24 + 46 * air}px rgba(0,0,0,${0.45 + 0.2 * air})${glow > 0 && frame >= el.cue + 12 ? `, 0 0 ${60 * glow}px rgba(232,163,61,${glow})` : ''}` }}>{el.node}</div>
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
      {/* dust */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {DUST.map((p, i) => (
          <div key={i} style={{ position: 'absolute', left: p.x + Math.sin(frame * p.freq + p.ph) * p.amp, top: (((p.y0 - frame * p.rise) % 1080) + 1080) % 1080, width: p.size, height: p.size, borderRadius: '50%', background: C.brass, opacity: p.op }} />
        ))}
      </AbsoluteFill>
      {sweepOp > 0 ? (
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: sweepX - 300, width: 600, background: 'linear-gradient(90deg, rgba(255,226,170,0), rgba(255,226,170,1) 50%, rgba(255,226,170,0))', opacity: sweepOp, mixBlendMode: 'screen' }} />
      ) : null}
      {stage > 0 ? <AbsoluteFill style={{ background: 'radial-gradient(760px 420px at 960px 500px, rgba(232,163,61,0.42), rgba(232,163,61,0.12) 55%, rgba(232,163,61,0) 78%)', opacity: stage, mixBlendMode: 'screen' }} /> : null}
      {/* wordmark sign-off */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginTop: -30 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
            <HexMark size={140} draw={mark} needle={mark} style={{ filter: `drop-shadow(0 0 ${20 * mark}px rgba(45,212,191,0.35))` }} />
            <div style={{ fontFamily: F.display, fontSize: 170, fontWeight: 600, color: C.text, letterSpacing: `${spacing}em`, display: 'flex', lineHeight: 1 }}>
              {LETTERS.map((ch, i) => {
                const dl = Math.round(STAMP + i * 1.8);
                const t = interpolate(frame, [dl, dl + 8], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
                return <span key={i} style={{ display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 28}px) scale(${1.35 - 0.35 * t})`, filter: `blur(${(1 - t) * 8}px)` }}>{ch}</span>;
              })}
            </div>
          </div>
          <div style={{ position: 'relative', height: 6, width: 300, margin: '38px auto 0' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: C.brass, transform: `scaleX(${rule})` }} />
            {ext > 0 && extFade > 0 ? (
              <>
                <div style={{ position: 'absolute', top: 2.5, height: 1, right: '100%', width: 200 * ext, background: C.brass, opacity: extFade }} />
                <div style={{ position: 'absolute', top: 2.5, height: 1, left: '100%', width: 200 * ext, background: C.brass, opacity: extFade }} />
              </>
            ) : null}
          </div>
          <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 60, color: C.text, marginTop: 34, opacity: url, transform: `translateY(${(1 - url) * 12}px)`, letterSpacing: '-0.01em' }}>hexicon-murex.vercel.app</div>
          <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 34, letterSpacing: '0.08em', color: C.brass, marginTop: 22, opacity: sub }}>FREE · OPEN SOURCE · github.com/0xOmar-Ibrahim/Hexicon</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
