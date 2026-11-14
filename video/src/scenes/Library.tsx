// type-and-filter on the real library page: the camera moves onto the search
// box, "burp" is typed at human speed (3f/char), a breath, then the grid
// filters — old cards fade+sink in reading order, the three real results
// rise into their actual slots (Q9) — and the camera settles on them.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { PageCam, CamKey } from '../lib/PageCam';
import { Crop } from '../lib/ui';
import { C, CL, F } from '../theme';
import layout from '../layout.json';

export const LIBRARY_DURATION = 180;
const L = layout.library;
const QUERY = 'burp';
export const TYPE_START = 30;
export const FILTER_START = TYPE_START + QUERY.length * 3 + 11; // 53: typed, then a breath

const KEYS: CamKey[] = [
  { frame: 0, cx: 960, cy: 560, zoom: 1.0 },
  { frame: 26, cx: 1060, cy: 400, zoom: 1.6 },
  { frame: FILTER_START + 4, cx: 1060, cy: 400, zoom: 1.6 },
  { frame: FILTER_START + 34, cx: 1100, cy: 620, zoom: 1.28 },
  { frame: LIBRARY_DURATION, cx: 1100, cy: 640, zoom: 1.33 },
];

export const SceneLibrary: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = frame < TYPE_START ? 0 : Math.min(QUERY.length, Math.floor((frame - TYPE_START) / 3) + 1);
  const caretOn = frame >= TYPE_START - 2 && (frame <= TYPE_START + 12 || Math.floor((frame - TYPE_START - 12) / 8) % 2 === 0);
  const filtered = frame >= FILTER_START;
  const q = L.q;
  // the empty-state card area is replaced by real crops once filtering starts
  const gridTop = L.firstCards[0].y - 6;

  return (
    <AbsoluteFill>
      <PageCam src={filtered ? 'textures/library-typed.png' : 'textures/library-empty.png'} pageH={1080} keys={KEYS}>
        {filtered ? (
          <>
            {/* clear the result grid of the "after" page, then animate both states over it */}
            <div style={{ position: 'absolute', left: 676, top: gridTop, width: 850, height: 1080 - gridTop, background: C.bg }} />
            {L.firstCards.map((c, i) => {
              const cue = FILTER_START + i * 1.5;
              const t = interpolate(frame, [cue, cue + 7], [0, 1], { ...CL, easing: Easing.inOut(Easing.quad) });
              if (t >= 1) return null;
              return (
                <div key={`o${i}`} style={{ position: 'absolute', left: c.x, top: c.y, opacity: 1 - t, transform: `translateY(${10 * t}px)` }}>
                  <Crop src="textures/library-empty.png" pageH={1080} x={c.x} y={c.y} w={c.w} h={Math.min(c.h, 1080 - c.y)} />
                </div>
              );
            })}
            {L.typedCards.map((c, i) => {
              const cue = FILTER_START + 9 + i * 4;
              const t = interpolate(frame, [cue, cue + 14], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.25, 0.44, 1) });
              const op = interpolate(frame, [cue, cue + 6], [0, 1], CL);
              const air = 1 - Math.min(1, t);
              return (
                <div key={`n${i}`} style={{ position: 'absolute', left: c.x, top: c.y, opacity: op, transform: `translateY(${26 * air}px) scale(${1 + 0.03 * air})`, borderRadius: 14, boxShadow: `0 ${4 + 24 * air}px ${12 + 36 * air}px rgba(0,0,0,${0.25 + 0.2 * air})` }}>
                  <Crop src="textures/library-typed.png" pageH={1080} x={c.x} y={c.y} w={c.w} h={c.h} style={{ borderRadius: 14 }} />
                </div>
              );
            })}
          </>
        ) : null}
        {/* search box: cover the baked placeholder / text, type on top (Inter 500 16px like the site) */}
        <div style={{ position: 'absolute', left: q.x - 2, top: q.y + 5, width: q.w + 2, height: q.h - 10, background: C.surface }} />
        <div style={{ position: 'absolute', left: q.x, top: q.y, height: q.h, display: 'flex', alignItems: 'center', fontFamily: F.body, fontWeight: 500, fontSize: 16, color: typed ? C.text : C.muted }}>
          <span style={{ whiteSpace: 'pre' }}>{typed ? QUERY.slice(0, typed) : frame < TYPE_START - 2 ? 'Search: Linux, web, Wireshark…' : ''}</span>
          {caretOn ? <span style={{ display: 'inline-block', width: 2, height: 20, marginLeft: 2, background: C.brass }} /> : null}
        </div>
        {/* the focused search box gets the site's brass focus ring while typing */}
        <div style={{ position: 'absolute', left: q.x - 47, top: q.y - 1, width: q.w + 62, height: q.h + 2, borderRadius: 11, border: `1px solid ${C.brass}`, opacity: interpolate(frame, [TYPE_START - 4, TYPE_START], [0, 1], CL), pointerEvents: 'none' }} />
      </PageCam>
    </AbsoluteFill>
  );
};
