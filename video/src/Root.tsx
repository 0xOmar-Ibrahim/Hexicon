import React from 'react';
import { Composition } from 'remotion';
import { HexiconPromo, TOTAL } from './Main';

export const Root: React.FC = () => (
  <Composition id="HexiconPromo" component={HexiconPromo} defaultProps={{ bgm: true }} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
);
