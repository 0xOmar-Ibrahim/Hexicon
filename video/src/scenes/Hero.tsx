// Opening product shot (single subject, full arc ≥ 3s, Q5/R3): the camera
// starts on the headline from an oblique left angle, glides back and levels
// to the whole homepage, holds, then pushes into the stats row.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { PageCam, CamKey } from '../lib/PageCam';
import { CL } from '../theme';

export const HERO_DURATION = 160;

const KEYS: CamKey[] = [
  { frame: 0, cx: 640, cy: 330, zoom: 1.75, rotY: 16, rotX: 3, persp: 1700 },
  { frame: 18, cx: 660, cy: 340, zoom: 1.68, rotY: 13, rotX: 2.5, persp: 1700 },
  { frame: 84, cx: 960, cy: 540, zoom: 1.0, rotY: 0, rotX: 0, persp: 1700 },
  { frame: 112, cx: 960, cy: 540, zoom: 1.0, rotY: 0, rotX: 0, persp: 1700 },
  { frame: 146, cx: 600, cy: 905, zoom: 1.6, rotY: 0, rotX: 0, persp: 1700 },
  { frame: 160, cx: 600, cy: 905, zoom: 1.62, rotY: 0, rotX: 0, persp: 1700 },
];

export const SceneHero: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], CL);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <PageCam src="textures/hero-en.png" pageH={1080} keys={KEYS} />
    </AbsoluteFill>
  );
};
