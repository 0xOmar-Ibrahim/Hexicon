// The Log4Shell field-guide page, read top to bottom with a level, front-on
// camera (information-dense, Q6): four stops, each held long enough to read.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { PageCam, CamKey } from '../lib/PageCam';
import { CL } from '../theme';
import layout from '../layout.json';

const blocks = layout.detail.blocks.filter((b) => b.h > 30);
const at = (needle: string) => blocks.find((b) => b.text.startsWith(needle))!.y;
const Z = 1.5;
const VIEW = 1080 / Z;
const stop = (y: number) => y + VIEW / 2 - 50; // section header just under the top edge

// [frame where the camera arrives, section top]
export const DETAIL_STOPS = [
  { at: 0, y: layout.detail.blocks[0].y - 20 },
  { at: 64, y: at('Is it being exploited?') },
  { at: 118, y: at('Check, practise, detect') },
  { at: 172, y: at('How do I fix it?') },
];
export const DETAIL_DURATION = 220;
const MOVE = 22;

const KEYS: CamKey[] = DETAIL_STOPS.flatMap((s, i) => {
  const k = { cx: 960, cy: stop(s.y), zoom: Z };
  return i === 0 ? [{ frame: 0, ...k, cy: k.cy + 40, zoom: Z + 0.06 }, { frame: 30, ...k }] : [{ frame: s.at - MOVE, cx: 960, cy: stop(DETAIL_STOPS[i - 1].y), zoom: Z }, { frame: s.at, ...k }];
});
KEYS.push({ frame: DETAIL_DURATION, cx: 960, cy: stop(DETAIL_STOPS[3].y) + 30, zoom: Z });

export const SceneCveDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], CL);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <PageCam src="textures/cve-detail.png" pageH={layout.detail.pageH} keys={KEYS} />
    </AbsoluteFill>
  );
};
