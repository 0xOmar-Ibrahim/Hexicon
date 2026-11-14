// list-stack-press on the real bug bounty workflow: the ten phase rows fly up
// from below into their real slots (Q9), each landing presses the settled
// stack 6px; a brass odometer counts phases. Ten cards is a batch, so the cue
// spacing accelerates (R2) instead of the card's even 12f beat.
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { PageCam, CamKey } from '../lib/PageCam';
import { C, CL, F } from '../theme';
import layout from '../layout.json';

export const BOUNTY_DURATION = 140;
const P = layout.bounty.phases;
export const CUES = [8, 18, 27, 35, 42, 48, 53, 57, 61, 64];
const DUR = 20;
const FLY = Easing.bezier(0.45, 0.05, 0.25, 1.12);
export const LAST_LAND = CUES[CUES.length - 1] + DUR; // 84

const KEYS: CamKey[] = [
  { frame: 0, cx: 960, cy: 300, zoom: 1.3 },
  { frame: 14, cx: 960, cy: 360, zoom: 1.16 },
  { frame: 70, cx: 960, cy: 600, zoom: 0.98 },
  { frame: BOUNTY_DURATION, cx: 960, cy: 620, zoom: 0.96 },
];

const DIGITS = '01234567890123456789';
const Roll: React.FC<{ pos: number; size: number }> = ({ pos, size }) => {
  const lh = size * 1.12;
  return (
    <span style={{ display: 'inline-block', height: lh, overflow: 'hidden' }}>
      <span style={{ display: 'block', transform: `translateY(${-pos * lh}px)` }}>
        {DIGITS.split('').map((d, j) => <span key={j} style={{ display: 'block', fontSize: size, lineHeight: `${lh}px`, fontVariantNumeric: 'tabular-nums' }}>{d}</span>)}
      </span>
    </span>
  );
};

export const SceneBounty: React.FC = () => {
  const frame = useCurrentFrame();
  // continuous odometer position: +1 per landing, 6f roll (< smallest cue gap)
  let pos = 0;
  for (const c of CUES) pos += interpolate(frame, [c + DUR, c + DUR + 6], [0, 1], { ...CL, easing: Easing.bezier(0.25, 0.8, 0.25, 1) });
  const units = pos; // the 0–19 strip already wraps 9 → 0 visually
  const tens = interpolate(pos, [9, 10], [0, 1], CL);
  const ant = interpolate(frame, [0, 7], [0, 1], { ...CL, easing: Easing.out(Easing.quad) });
  const press = (i: number) => {
    let p = 0;
    for (let j = i + 1; j < CUES.length; j++) p = Math.max(p, interpolate(frame, [CUES[j] + DUR - 2, CUES[j] + DUR + 2, CUES[j] + DUR + 7], [0, 6, 0], CL));
    return p;
  };
  const glazeX = interpolate(frame, [LAST_LAND + 4, LAST_LAND + 20], [-600, 2400], { ...CL, easing: Easing.bezier(0.45, 0, 0.35, 1) });
  const glazeOp = interpolate(frame, [LAST_LAND + 3, LAST_LAND + 8, LAST_LAND + 16, LAST_LAND + 20], [0, 1, 1, 0], CL);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <PageCam src="textures/bounty.png" pageH={1080} keys={KEYS}>
        {/* clear the baked rows so empty slots fill up */}
        <div style={{ position: 'absolute', left: P[0].x - 8, top: P[0].y - 6, width: P[0].w + 16, height: 1080 - P[0].y + 6, background: C.bg }} />
        {P.map((r, i) => {
          const t = interpolate(frame, [CUES[i], CUES[i] + DUR], [0, 1], { ...CL, easing: FLY });
          if (frame < CUES[i]) return null;
          const settled = frame >= CUES[i] + DUR;
          const air = Math.max(0, 1 - t);
          return (
            <div key={i} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 16, overflow: 'hidden', transform: `translateY(${620 * (1 - t) + (settled ? press(i) : 0)}px) rotate(${(i % 2 ? -2 : 2) * air}deg) scale(${1.06 - 0.06 * t})`, boxShadow: settled ? '0 2px 8px rgba(0,0,0,.25)' : `0 32px 64px rgba(0,0,0,${0.5 * air + 0.15})` }}>
              <Img src={staticFile(`textures/phase-${i}.png`)} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          );
        })}
        {/* one glaze across the finished stack (the shot's only light sweep, Q4) */}
        <div style={{ position: 'absolute', left: P[0].x, top: P[0].y, width: P[0].w, height: P[9].y + P[9].h - P[0].y, overflow: 'hidden', borderRadius: 16, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -200, height: 1400, left: glazeX - P[0].x, width: 380, transform: 'rotate(14deg)', opacity: glazeOp * 0.35, mixBlendMode: 'screen', background: 'linear-gradient(90deg, transparent, rgba(232,163,61,0.55) 50%, transparent)' }} />
        </div>
      </PageCam>
      {/* screen-space odometer, right gutter */}
      <div style={{ position: 'absolute', right: 34, top: 330, width: 250, textAlign: 'center', opacity: 0.3 + 0.7 * ant, transform: `scale(${0.96 + 0.04 * ant})` }}>
        <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 32, letterSpacing: '0.12em', color: C.muted }}>PHASES</div>
        <div style={{ fontFamily: F.display, fontWeight: 600, color: C.brass, display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <Roll pos={tens} size={150} />
          <Roll pos={units} size={150} />
        </div>
        <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 32, letterSpacing: '0.12em', color: C.muted, marginTop: 6 }}>44 STEPS</div>
      </div>
    </AbsoluteFill>
  );
};
