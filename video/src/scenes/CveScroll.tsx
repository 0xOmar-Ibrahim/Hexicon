// changelog-scroll-brake (A) on the real ranked CVE table: ~95 rows rush past
// (out-exp deceleration, velocity-driven blur), brake exactly on Log4Shell
// (#14) centred in frame, which lifts with a brass outline while the rest dims.
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, CL, F } from '../theme';
import layout from '../layout.json';

export const CVE_SCROLL_DURATION = 150;
const T = layout.cveTable;
const ROW = T.rows[T.target];
const Z = 1.32; // table zoom on screen
const W = T.w * Z;
const LEFT = (1920 - W) / 2;
const SCROLL0 = 12;
export const SCROLL1 = 74; // brake frame
const LIFT0 = 78;
const LIFT1 = 92;

// translateY (screen px) that puts CSS row-y `y` at screen centre
const yFor = (cssY: number) => 540 - cssY * Z;
// start on the deepest row that still leaves a full screen of table below it
const startRow = T.rows.reduce((best, r, i) => (r.y + 540 / Z + 20 < T.h ? i : best), 0);
const START = yFor(T.rows[startRow].y);
const END = yFor(ROW.y + ROW.h / 2);
const scrollAt = (f: number) => interpolate(f, [SCROLL0, SCROLL1], [START, END], { ...CL, easing: Easing.out(Easing.exp) });

export const SceneCveScroll: React.FC = () => {
  const frame = useCurrentFrame();
  const ty = scrollAt(frame);
  const v = Math.abs(scrollAt(frame) - scrollAt(frame - 1));
  const blur = Math.min(v / 60, 1) * 6;
  const lift = interpolate(frame, [LIFT0, LIFT1], [0, 1], { ...CL, easing: Easing.out(Easing.cubic) });
  const fadeIn = interpolate(frame, [0, 8], [0, 1], CL);
  const tag = interpolate(frame, [LIFT1 - 4, LIFT1 + 8], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.4, 0.44, 1) });

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: fadeIn }}>
      <div style={{ position: 'absolute', left: LEFT, top: 0, width: W, height: T.h * Z, transform: `translateY(${ty}px)`, filter: blur > 0.15 ? `blur(${blur}px)` : undefined }}>
        <Img src={staticFile('textures/cve-table.png')} style={{ width: W, height: T.h * Z, display: 'block', opacity: 1 - 0.62 * lift }} />
      </div>
      {/* the stopped row lifts off the table */}
      {lift > 0 ? (
        <div style={{ position: 'absolute', left: LEFT, top: 540 - (ROW.h * Z) / 2, width: W, height: ROW.h * Z, transform: `scale(${1 + 0.035 * lift})`, borderRadius: 12, overflow: 'hidden', border: `3px solid rgba(232,163,61,${lift})`, boxShadow: `0 ${8 + 24 * lift}px ${20 + 50 * lift}px rgba(0,0,0,${0.3 + 0.35 * lift}), 0 0 ${40 * lift}px rgba(232,163,61,${0.25 * lift})`, background: C.surface }}>
          <Img src={staticFile('textures/cve-row-log4shell.png')} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      ) : null}
      {/* rank tag pops above the row */}
      {tag > 0 ? (
        <div style={{ position: 'absolute', left: LEFT + 20, top: 540 - (ROW.h * Z) / 2 - 78, transform: `scale(${tag})`, transformOrigin: 'left bottom', display: 'flex', gap: 14, alignItems: 'center', fontFamily: F.mono, fontWeight: 500, fontSize: 34, letterSpacing: '0.06em' }}>
          <span style={{ background: C.coral, color: '#1a0606', padding: '6px 16px', borderRadius: 10 }}>P1 · PATCH NOW</span>
          <span style={{ color: C.text, background: C.bg, border: `1px solid ${C.lineStrong}`, padding: '6px 16px', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>#14 most exploited · Log4Shell</span>
        </div>
      ) : null}
      {/* soft top/bottom edges so the list reads as an endless ranking */}
      <AbsoluteFill style={{ background: `linear-gradient(${C.bg} 0%, rgba(11,16,32,0) 16%, rgba(11,16,32,0) 84%, ${C.bg} 100%)`, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
