// brand-ink-open, reskinned: the Hexicon mark draws itself (in place of the
// demo's crosshair), the wordmark letterpresses glyph by glyph, the mono
// kicker types on, the lockup holds a full second, then lifts away.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { Backdrop, HexMark } from '../lib/ui';
import { C, CL, F } from '../theme';

export const OPEN_DURATION = 100;
const WORDMARK = 'Hexicon';
const KICKER = 'THE OPEN LEXICON OF SECURITY';

export const SceneOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, 18], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const needle = interpolate(frame, [14, 24], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.4, 0.44, 1) });

  const perChar = 0.7; // decorative kicker only (interaction typing is 3f/char)
  const kickStart = 36;
  const kickChars = Math.floor(Math.max(0, frame - kickStart) / perChar);
  const kickDone = kickStart + KICKER.length * perChar; // ≈ 56
  const cursorOn = frame >= kickStart && frame <= 86 && (frame < kickDone || Math.floor((frame - kickDone) / 2) % 2 === 0);

  // wordmark completes at 12 + 6*3 + 12 = 42; kicker ≈ 56; hold the full lockup 56 → 88 (> 1s)
  const out = interpolate(frame, [88, 96], [0, 1], { ...CL, easing: Easing.bezier(0.4, 0, 0.5, 1) });

  return (
    <AbsoluteFill>
      <Backdrop drift={0.6} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', opacity: 1 - out, transform: `translateY(${-out * 40}px) scale(${1 - out * 0.12})` }}>
          <HexMark size={124} draw={draw} needle={needle} style={{ margin: '0 auto 30px', display: 'block', filter: `drop-shadow(0 0 ${18 * needle}px ${C.glow})` }} />
          <div style={{ fontFamily: F.display, fontSize: 176, fontWeight: 600, color: C.text, letterSpacing: '-0.015em', lineHeight: 1, display: 'inline-flex', alignItems: 'flex-end' }}>
            {WORDMARK.split('').map((ch, i) => {
              const d = 12 + i * 3;
              const t = interpolate(frame, [d, d + 12], [0, 1], { ...CL, easing: Easing.bezier(0.2, 0.7, 0.25, 1) });
              const gc = d + 12;
              const glint = interpolate(frame, [gc - 4, gc, gc + 4], [0, 1, 0], CL);
              return (
                <span key={i} style={{ position: 'relative', display: 'inline-block', opacity: t, transform: `scale(${1.6 - 0.6 * t})`, transformOrigin: 'center bottom', filter: `blur(${(1 - t) * 6}px)` }}>
                  {ch}
                  <span style={{ position: 'absolute', left: '50%', bottom: -10, transform: 'translateX(-50%)', width: `${glint * 100}%`, height: 3, background: C.brass, opacity: glint, borderRadius: 2 }} />
                </span>
              );
            })}
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 36, letterSpacing: '0.16em', color: C.brass, marginTop: 34, height: 44, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ whiteSpace: 'pre' }}>{KICKER.slice(0, kickChars)}</span>
            <span style={{ display: 'inline-block', width: 18, height: 34, marginLeft: 6, background: C.teal, opacity: cursorOn ? 0.85 : 0 }} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
