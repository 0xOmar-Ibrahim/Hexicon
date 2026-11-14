import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion';
import './theme';
import { Caption, TitleCard } from './lib/ui';
import { SceneOpen, OPEN_DURATION } from './scenes/Open';
import { SceneHero, HERO_DURATION } from './scenes/Hero';
import { SceneLibrary, LIBRARY_DURATION, TYPE_START, FILTER_START } from './scenes/Library';
import { SceneCveScroll, CVE_SCROLL_DURATION, SCROLL1 } from './scenes/CveScroll';
import { SceneCveDetail, DETAIL_DURATION, DETAIL_STOPS } from './scenes/CveDetail';
import { SceneBounty, BOUNTY_DURATION, CUES, LAST_LAND } from './scenes/Bounty';
import { SceneLanguages, LANG_DURATION, SWEEP_LEN, sweepStart } from './scenes/Languages';
import { SceneOutro, OUTRO_DURATION, STAMP } from './scenes/Outro';

const CARD = 55; // title cards ≈ 1.8s (paper-title-card)

// Single source of truth for the timeline; everything else is relative to it.
const ORDER = [
  ['open', OPEN_DURATION], ['hero', HERO_DURATION], ['card1', CARD], ['library', LIBRARY_DURATION],
  ['card2', CARD], ['cveScroll', CVE_SCROLL_DURATION], ['detail', DETAIL_DURATION], ['card3', CARD],
  ['bounty', BOUNTY_DURATION], ['languages', LANG_DURATION], ['card4', CARD], ['outro', OUTRO_DURATION],
] as const;
type ShotId = (typeof ORDER)[number][0];
export const SHOTS = {} as Record<ShotId, { from: number; duration: number }>;
let acc = 0;
for (const [id, duration] of ORDER) { SHOTS[id] = { from: acc, duration }; acc += duration; }
export const TOTAL = acc;

export const TITLE_CARDS: Record<'card1' | 'card2' | 'card3' | 'card4', { text: string; sub: string }> = {
  card1: { text: '564 hand-picked resources, sorted by *level.*', sub: 'Courses · tools · books · labs · cheatsheets' },
  card2: { text: '1,116 exploited CVEs, ranked by *real* risk.', sub: 'From the CISA Known Exploited Vulnerabilities catalog' },
  card3: { text: 'One bug bounty *methodology,* built from the best.', sub: 'Red Nexus · zseano · TBHM · Intigriti · XHack · more' },
  card4: { text: 'Kept fresh *every week,* automatically.', sub: 'CISA · NVD · EPSS · link checks · GitHub stats' },
};

const S = SHOTS;
const ls = (i: number) => S.languages.from + sweepStart(i) + SWEEP_LEN - 4; // language label switch
export const CAPTIONS: { from: number; duration: number; text: string; top?: number }[] = [
  { from: S.hero.from + 22, duration: 66, text: 'Free, open source and community-curated' },
  { from: S.hero.from + 100, duration: 56, text: 'Made for beginners, useful to professionals' },
  { from: S.library.from + 62, duration: 112, text: 'Search, then filter by level, cost and language' },
  { from: S.cveScroll.from + 16, duration: 128, text: 'Ranked by real-world exploitation (EPSS)' },
  { from: S.detail.from + 6, duration: 52, text: 'One clear page for every CVE' },
  { from: S.detail.from + DETAIL_STOPS[1].at - 4, duration: 52, text: 'Is it being exploited?' },
  { from: S.detail.from + DETAIL_STOPS[2].at - 4, duration: 52, text: 'Check it, practise it, detect it' },
  { from: S.detail.from + DETAIL_STOPS[3].at - 4, duration: 50, text: 'And exactly how to fix it' },
  { from: S.bounty.from + 40, duration: 96, text: 'Every phase credits the methodology behind it', top: 40 },
  { from: S.languages.from + 6, duration: ls(1) - S.languages.from - 6, text: 'The whole site, in five languages' },
  { from: ls(1), duration: ls(2) - ls(1), text: 'Deutsch' },
  { from: ls(2), duration: ls(3) - ls(2), text: 'Français' },
  { from: ls(3), duration: ls(4) - ls(3), text: 'العربية · right to left' },
  { from: ls(4), duration: S.languages.from + LANG_DURATION - ls(4), text: 'Русский' },
];

// Sound pinned to picture, always relative to a shot start (sound-design §4.5).
export const SFX: { from: number; src: string; volume: number; dur?: number }[] = [
  { from: S.open.from + 2, src: 'transition-soft.mp3', volume: 0.4 }, // mark draws, wordmark presses
  { from: S.open.from + 86, src: 'whoosh-fast.mp3', volume: 0.45 }, // lockup lifts away
  { from: S.hero.from + 6, src: 'whoosh-big.mp3', volume: 0.4 }, // glide back from the headline
  { from: S.hero.from + 112, src: 'whoosh-fast.mp3', volume: 0.32 }, // push into the stats
  ...(['card1', 'card2', 'card3', 'card4'] as const).map((c) => ({ from: S[c].from, src: 'swoosh-quick.mp3', volume: 0.4 })),
  { from: S.library.from + 2, src: 'transition-soft.mp3', volume: 0.35 },
  { from: S.library.from + TYPE_START, src: 'keyboard.mp3', volume: 0.45, dur: 14 }, // 4 chars × 3f
  { from: S.library.from + FILTER_START, src: 'whoosh-fast.mp3', volume: 0.38 }, // grid filters away
  { from: S.library.from + FILTER_START + 14, src: 'pop.mp3', volume: 0.34 }, // results land
  { from: S.library.from + FILTER_START + 18, src: 'pop.mp3', volume: 0.3 },
  { from: S.library.from + FILTER_START + 22, src: 'pop.mp3', volume: 0.26 },
  { from: S.cveScroll.from + 8, src: 'riser-cine.mp3', volume: 0.32, dur: SCROLL1 - 6 }, // high-speed run-up
  { from: S.cveScroll.from + 12, src: 'whoosh-big.mp3', volume: 0.45 },
  { from: S.cveScroll.from + SCROLL1 - 1, src: 'hit-weak.mp3', volume: 0.6 }, // the brake
  { from: S.cveScroll.from + 88, src: 'click-camera.mp3', volume: 0.5 }, // rank tag pops
  { from: S.detail.from + 2, src: 'transition-soft.mp3', volume: 0.38 },
  ...DETAIL_STOPS.slice(1).map((s) => ({ from: S.detail.from + s.at - 22, src: 'whoosh-fast.mp3', volume: 0.26 })),
  { from: S.bounty.from + 2, src: 'transition-soft.mp3', volume: 0.38 },
  ...CUES.slice(0, 5).map((c, i) => ({ from: S.bounty.from + c + 18, src: 'pop.mp3', volume: 0.4 - i * 0.035 })), // first landings, countable
  { from: S.bounty.from + CUES[5] + 10, src: 'whoosh-fast.mp3', volume: 0.32 }, // dense tail blurs into one swoosh
  { from: S.bounty.from + LAST_LAND + 6, src: 'click-camera.mp3', volume: 0.5 }, // counter lands on 10
  ...[1, 2, 3, 4].map((i) => ({ from: S.languages.from + sweepStart(i), src: 'sweep-fast.mp3', volume: i % 2 ? 0.42 : 0.36 })),
  { from: S.outro.from + 4, src: 'riser-cine.mp3', volume: 0.5 },
  { from: S.outro.from + STAMP, src: 'impact-deep-whoosh.mp3', volume: 0.6 }, // wordmark stamp, loudest beat
  { from: S.outro.from + STAMP + 18, src: 'sparkle.mp3', volume: 0.35 }, // rule glint
];

export const HexiconPromo: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <AbsoluteFill style={{ background: '#0B1020' }}>
    {bgm ? (
      <Audio src={staticFile('audio/cat-walk.mp3')} volume={(f) => 0.3 * interpolate(f, [0, 30, TOTAL - 50, TOTAL - 4], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
    ) : null}
    {SFX.map((s, i) => (
      <Sequence key={`sfx${i}`} from={s.from} durationInFrames={s.dur ?? 90}>
        <Audio src={staticFile(`audio/${s.src}`)} volume={s.volume} />
      </Sequence>
    ))}
    <Sequence from={S.open.from} durationInFrames={S.open.duration}><SceneOpen /></Sequence>
    <Sequence from={S.hero.from} durationInFrames={S.hero.duration}><SceneHero /></Sequence>
    <Sequence from={S.library.from} durationInFrames={S.library.duration}><SceneLibrary /></Sequence>
    <Sequence from={S.cveScroll.from} durationInFrames={S.cveScroll.duration}><SceneCveScroll /></Sequence>
    <Sequence from={S.detail.from} durationInFrames={S.detail.duration}><SceneCveDetail /></Sequence>
    <Sequence from={S.bounty.from} durationInFrames={S.bounty.duration}><SceneBounty /></Sequence>
    <Sequence from={S.languages.from} durationInFrames={S.languages.duration}><SceneLanguages /></Sequence>
    <Sequence from={S.outro.from} durationInFrames={S.outro.duration}><SceneOutro /></Sequence>
    {(Object.keys(TITLE_CARDS) as (keyof typeof TITLE_CARDS)[]).map((c) => (
      <Sequence key={c} from={S[c].from} durationInFrames={S[c].duration}>
        <TitleCard duration={S[c].duration} text={TITLE_CARDS[c].text} sub={TITLE_CARDS[c].sub} />
      </Sequence>
    ))}
    {CAPTIONS.map((c) => (
      <Sequence key={`cap${c.from}`} from={c.from} durationInFrames={c.duration}>
        <Caption text={c.text} duration={c.duration} top={c.top} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
