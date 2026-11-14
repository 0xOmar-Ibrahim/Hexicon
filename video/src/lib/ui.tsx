import React from 'react';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, CL, EASE, F } from '../theme';

const bz = (e: readonly number[]) => Easing.bezier(e[0], e[1], e[2], e[3]);

/** Navy field with the site's faint brass/teal contour lines (deterministic). */
export const Backdrop: React.FC<{ drift?: number }> = ({ drift = 0 }) => {
  const frame = useCurrentFrame();
  const lines = Array.from({ length: 9 }, (_, i) => {
    const y0 = 110 + i * 112;
    const amp = 26 + ((i * 37) % 30);
    const ph = (i * 1.7) % 6.28;
    const off = drift * frame * (0.4 + (i % 3) * 0.2);
    let d = '';
    for (let x = -40; x <= 1960; x += 40) {
      const y = y0 + Math.sin(x / 260 + ph + off / 90) * amp + Math.sin(x / 97 + ph * 2) * 6;
      d += `${x === -40 ? 'M' : 'L'}${x},${y.toFixed(1)} `;
    }
    return { d, teal: i === 2 || i === 6, op: 0.1 + ((i * 13) % 7) * 0.012 };
  });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: 'radial-gradient(1100px 700px at 50% 45%, rgba(232,163,61,0.07), transparent 70%)' }} />
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {lines.map((l, i) => (
          <path key={i} d={l.d} fill="none" stroke={l.teal ? C.teal : C.brass} strokeWidth={1.2} opacity={l.op} />
        ))}
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(1500px 950px at 50% 50%, transparent 55%, rgba(3,5,12,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};

/** Hexicon mark: brass hexagon + teal compass needle (from site/index.html). */
export const HexMark: React.FC<{ size: number; draw?: number; needle?: number; style?: React.CSSProperties }> = ({ size, draw = 1, needle = 1, style }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={style}>
    <path d="M16 2l12 7v14l-12 7-12-7V9z" fill="none" stroke={C.brass} strokeWidth={1.6} strokeLinejoin="round"
      pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - draw)} />
    <path d="M16 8l3 8-3 8-3-8z" fill={C.teal} opacity={needle}
      style={{ transformOrigin: '16px 16px', transform: `scale(${0.6 + 0.4 * needle})` }} />
  </svg>
);

/** Screen-space narration caption. 58px so it survives a phone-sized feed (Q11). */
export const Caption: React.FC<{ text: string; duration: number; bottom?: number; top?: number; dir?: 'ltr' | 'rtl' }> = ({ text, duration, bottom = 64, top, dir = 'ltr' }) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 9], [0, 1], { ...CL, easing: bz(EASE.enter) });
  const outT = interpolate(frame, [duration - 8, duration], [1, 0], CL);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, ...(top !== undefined ? { top } : { bottom }), display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div
        dir={dir}
        style={{
          display: 'flex', alignItems: 'center', gap: 22, padding: '16px 34px 18px', borderRadius: 18,
          background: 'rgba(11,16,32,0.86)', border: `1px solid ${C.lineStrong}`,
          boxShadow: '0 18px 50px rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
          fontFamily: F.body, fontWeight: 600, fontSize: 58, lineHeight: 1.1, color: C.text, letterSpacing: '-0.01em',
          opacity: inT * outT, transform: `translateY(${(1 - inT) * (top !== undefined ? -14 : 14)}px)`,
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 3, background: C.brass, flexShrink: 0 }} />
        <span>{text}</span>
      </div>
    </div>
  );
};

/** paper-title-card, reskinned to the dark site: word-by-word letterpress, one brass italic accent, short rule. */
export const TitleCard: React.FC<{ duration: number; text: string; sub?: string }> = ({ duration, text, sub }) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).map((w) => { const m = w.match(/^\*(.+)\*(\W*)$/); return m ? { t: m[1] + m[2], accent: true } : { t: w, accent: false }; });
  const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], CL);
  const rule = interpolate(frame, [16, 34], [0, 1], { ...CL, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const subT = interpolate(frame, [14, 26], [0, 1], CL);
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 1560 }}>
          <div style={{ fontFamily: F.display, fontSize: 112, fontWeight: 600, lineHeight: 1.12, color: C.text, letterSpacing: '-0.015em', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.26em' }}>
            {words.map((w, i) => {
              const d = 4 + i * 4;
              const t = interpolate(frame, [d, d + 9], [0, 1], { ...CL, easing: bz(EASE.press) });
              return (
                <span key={i} style={{ display: 'inline-block', opacity: t, transform: `scale(${1.28 - 0.28 * t})`, filter: `blur(${(1 - t) * 7}px)`, color: w.accent ? C.brass : undefined, fontStyle: w.accent ? 'italic' : 'normal' }}>
                  {w.t}
                </span>
              );
            })}
          </div>
          <div style={{ height: 6, width: 220, margin: '40px auto 0', borderRadius: 3, background: C.brass, transform: `scaleX(${rule})` }} />
          {sub ? (
            <div style={{ fontFamily: F.mono, fontSize: 36, letterSpacing: '0.08em', color: C.muted, marginTop: 34, opacity: subT, textTransform: 'uppercase' }}>{sub}</div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A rectangle cut out of a 2x page texture, drawn at CSS size (no extra screenshot needed). */
export const Crop: React.FC<{ src: string; pageW?: number; pageH: number; x: number; y: number; w: number; h: number; style?: React.CSSProperties }> = ({ src, pageW = 1920, pageH, x, y, w, h, style }) => (
  <div style={{ width: w, height: h, backgroundImage: `url(${staticFile(src)})`, backgroundSize: `${pageW}px ${pageH}px`, backgroundPosition: `${-x}px ${-y}px`, backgroundRepeat: 'no-repeat', ...style }} />
);
