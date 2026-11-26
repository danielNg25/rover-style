import React from 'react';
import {Stage, KitShot, camTruck, liveness, Smoke, Poly, Disc, Stroke, Rect, track, bezier} from '../../../../kit';
import {Puppet, act} from '../../../../puppet';
import {VICTOR_BACK2, BackBeat} from './boy';
import {SHOT, SNOW, PINES} from '../../shared';
import {CAM0, Layer, At, Fx, Y, wpos, wlen, DUSK as P, Sky, Peaks, Ridge, Forest, Pine, Tent, Wagon, Campfire, WashingLine, Crate, Sack, Barrel, StickPile,
  Rock, Tuft, Drift, Steps, Branch, SnowLayer, Cloud, Ground} from './set';
import {FolkA, FolkB} from './folk';

/* S7 (film 349-391, 42 f): establishing wide of the camp at dusk. Anchor 'camp' at in-shot 20.
 * Beats (in-shot): 8 folk B stamps twice | 20 folk A leans to the pot, fire steps one size up | 32 the boy tips back to look up. */
const LEN = SHOT.S7.len;
const cam = camTruck(CAM0, {pctPerSec: SHOT.S7.pct, dir: -1, ease: true, len: LEN});

const BOY_PX = 144;                                     // 20 % of frame height
/** the boy from behind: on 'mountains' the head tips back toward the peak in three drawings and lifts off the collar */
const BOY_BEATS: BackBeat[] = [{f: 0}, {f: 32, headTilt: -14, headY: 26, headX: -6, lean: -2, dip: false, note: "'mountains': tips his head back to look up at the peaks"}];
const boyPose = (f: number) => act(BOY_BEATS, f, {rig: VICTOR_BACK2, seed: 6});
const SNOW_MID = '#c3cde8', SNOW_TRAMPLED = '#aebbd9', RUT = '#9fb0d0';

/** chopping block with an axe stuck in it and two split logs */
const Chop: React.FC = () => (
  <>
    <Poly pts={[[-17, 0], [-19, 20], [19, 20], [17, 0]]} color={P.wood2} /><Disc r={19} sy={0.32} color={P.wood} pos={[0, 20, 0.2]} seg={20} /><Disc r={11} sy={0.32} color="#a37c5e" pos={[0, 20, 0.3]} seg={16} />
    <Poly pts={[[6, 0], [7, 20], [19, 20], [17, 0]]} color={P.woodDark} pos={[0, 0, 0.1]} />
    <Stroke pts={[[-2, 22], [20, 52]]} width={3.4} color={P.wood} pos={[0, 0, 0.5]} /><Poly pts={[[-10, 20], [-1, 30], [6, 22], [-3, 17]]} color={P.tin} pos={[0, 0, 0.6]} /><Poly pts={[[-10, 20], [-3, 17], [-1, 21]]} color={P.tin2} pos={[0, 0, 0.7]} />
    <Poly pts={[[26, 0], [24, 7], [50, 11], [53, 4]]} color={P.wood} pos={[0, 0, 0.3]} /><Poly pts={[[26, 0], [53, 4], [52, 0]]} color={P.woodDark} pos={[0, 0, 0.4]} />
    <Poly pts={[[-44, 2], [-46, 9], [-24, 10], [-22, 3]]} color={P.wood2} pos={[0, 0, 0.3]} /><Disc r={4} sy={0.9} color="#a37c5e" pos={[-45, 5.5, 0.5]} seg={10} />
    <Poly pts={[[-52, 0], [-40, 5], [-20, 5], [-14, 0]]} color={P.snowLight} pos={[0, 0, 0.2]} />
  </>
);
/** tin bucket with a rope handle, snow on its rim */
const Bucket: React.FC = () => (
  <>
    <Poly pts={[[-11, 0], [-14, 24], [14, 24], [11, 0]]} color={P.tin} /><Poly pts={[[3, 0], [4, 24], [14, 24], [11, 0]]} color={P.tin2} pos={[0, 0, 0.1]} />
    <Rect w={27} h={3} color={P.tin2} pos={[0, 9, 0.2]} /><Disc r={14} sy={0.3} color={P.soot} pos={[0, 24, 0.3]} seg={16} /><Poly pts={[[-13, 24], [-6, 28], [4, 27], [13, 24], [2, 23]]} color={P.pineSnow} pos={[0, 0, 0.4]} />
    <Stroke pts={bezier([-13, 24], [0, 44], [13, 24], 8)} width={1.8} color={P.rope} pos={[0, 0, 0.5]} />
  </>
);
/** a small wooden sledge with a tied sack on it */
const Sledge: React.FC = () => (
  <>
    <Stroke pts={[[-46, 3], [38, 3], [50, 10], [54, 20]]} width={3.4} color={P.woodDark} />
    {[-34, -8, 20].map((x) => <Rect key={x} w={3.4} h={12} color={P.wood2} pos={[x, 10, 0.1]} />)}
    <Rect w={84} h={4.5} color={P.wood} pos={[-4, 17, 0.2]} /><Rect w={84} h={2} color={P.wood2} pos={[-4, 15, 0.3]} />
    <Poly pts={[[-34, 19], [-38, 36], [-26, 46], [-6, 46], [6, 36], [2, 19]]} color={P.canvasShade} pos={[0, 0, 0.4]} /><Poly pts={[[-14, 19], [-10, 46], [-6, 46], [6, 36], [2, 19]]} color={P.canvasDark} pos={[0, 0, 0.5]} />
    <Rect w={12} h={3} color={P.rust} pos={[-16, 46, 0.6]} /><Poly pts={[[-36, 38], [-26, 47], [-8, 47], [-2, 41], [-16, 43]]} color={P.pineSnow} pos={[0, 0, 0.7]} />
    <Stroke pts={[[54, 20], [78, 4], [96, 2]]} width={1.8} color={P.rope} pos={[0, 0, 0.1]} />
  </>
);

const Scene: React.FC<{f: number; t: number}> = ({f}) => {
  const fire = f >= 20 ? 1.25 : 1;
  const hem = track(f, [[0, 0], [36, -5]], 4);          // the trailing shawl end follows the tilt 3-4 frames late
  return (
    <Stage cam={cam} f={f} len={LEN} mood="dusk" bg={P.sky[1]} name={SHOT.S7.comp}>
      {/* 1 sky: flat dusk bands, two pale clouds, no stars */}
      <Layer z={-70}>
        <Sky pal={P} top={800} bottom={Y(338)} />
        <At x={840} y={98} dz={3}><Cloud w={230} pal={P} f={f} /></At>
        <At x={110} y={176} dz={3}><Cloud w={150} pal={P} f={f} speed={0.09} /></At>
      </Layer>
      {/* 2 the hall's peaks, tallest at screen left, then two ridge bands and the forest band */}
      <Layer z={-55}><Peaks pal={P} k={6.5} peak={[360, 66]} /></Layer>
      <Layer z={-42}><Ridge top={[[-300, 300], [-80, 268], [90, 292], [240, 262], [420, 296], [600, 270], [790, 300], [960, 266], [1150, 290], [1330, 262], [1600, 300]]} base={470} color={P.ridge1} hi={P.ridge1Hi}
        shelves={[[-40, 300, 110], [250, 286, 90], [520, 304, 130], [900, 290, 110], [1180, 306, 120]]} /></Layer>
      <Layer z={-32}><Ridge top={[[-300, 332], [-40, 318], [180, 342], [420, 322], [640, 346], [900, 326], [1120, 348], [1340, 324], [1600, 340]]} base={480} color={P.ridge2} hi={P.ridge2Hi}
        shelves={[[60, 346, 120], [470, 344, 100], [760, 350, 120], [1210, 346, 100]]} /></Layer>
      <Layer z={-22}><Forest pal={P} y={372} base={480} /></Layer>
      {/* 3 tree line: far snow and the three pines of S6 (heights 1 : 0.8 : 0.9, same order) */}
      <Layer z={-12}>
        <Ground top={[[-300, 404], [120, 398], [420, 406], [760, 398], [1080, 404], [1600, 398]]} color={P.snowShade} lip={P.snow} />
        <At x={318} y={418} dz={2}><Pine h={236 * PINES.heights[0]} pal={P} /></At>
        <At x={420} y={420} dz={4}><Pine h={236 * PINES.heights[1]} pal={P} /></At>
        <At x={1140} y={420} dz={6}><Pine h={236 * PINES.heights[2]} pal={P} /></At>
        <At x={745} y={412} dz={1}><Rock w={46} pal={P} /></At>
        {/* smaller pines of the same wood further back along the tree line */}
        <At x={52} y={414} dz={1}><Pine h={150} pal={P} /></At>
        <At x={858} y={414} dz={1}><Pine h={170} pal={P} /></At>
        <At x={-110} y={416} dz={1}><Pine h={190} pal={P} /></At>
        <At x={905} y={414} dz={1}><Drift w={120} pal={P} /></At>
        <SnowLayer f={f} count={SNOW.count / 2} seed={3} r={1.5} speed={1.9} color={SNOW.colorFar} />
      </Layer>
      {/* 4 mid-ground: wagon, washing line, a small tent with a lit door, stick pile, a second small tent */}
      <Layer z={-6}>
        <Ground top={[[-300, 452], [60, 446], [330, 456], [560, 448], [820, 458], [1100, 450], [1600, 456]]} color={P.snow} lip={P.snowLight} />
        <At x={140} y={490} dz={6}><Wagon w={236} pal={P} /></At>
        <group position={[0, 0, 5]}><WashingLine a={[262, 376]} b={[508, 372]} pal={P} f={f} posts={[[506, 478]]} amp={0.34} /></group>
        <At x={596} y={470} dz={8}><Tent w={178} h={140} pal={P} side={-1} door="lit" f={f} front="#cdbf9f" /></At>
        <At x={712} y={474} dz={10}><StickPile w={62} pal={P} /></At>
        <At x={1268} y={472} dz={7}><Tent w={170} h={134} pal={P} side={-1} f={f} patches={1} front="#c4bfae" /></At>
        <At x={292} y={492} dz={12}><Barrel w={30} pal={P} /></At>
        <At x={330} y={496} dz={13}><Sack w={30} pal={P} /></At>
        <At x={364} y={494} dz={12.5}><Sack w={25} pal={P} tone={P.canvas} /></At>
        <At x={440} y={488} dz={11}><Tuft h={16} pal={P} seed={2} /></At>
        <At x={800} y={480} dz={11}><Tuft h={14} pal={P} seed={5} /></At>
      </Layer>
      {/* 5 character plane: trampled clearing, path fire -> hero tent, the fire, the hero tent, the boy's crate */}
      <Layer z={0}>
        <group position={[0, 0, -40]}>
          <Ground top={[[-300, 512], [140, 504], [470, 516], [760, 506], [1040, 514], [1600, 506]]} color={SNOW_MID} lip={P.snowLight} />
          {/* painted path from the fire to the hero tent, and prints on it */}
          <Poly pts={[[610, Y(602)], [700, Y(570)], [860, Y(548)], [985, Y(530)], [1040, Y(530)], [930, Y(566)], [770, Y(598)], [680, Y(622)]]} color={P.path} pos={[0, 0, 0.3]} />
          <group position={[0, 0, 0.5]}><Steps pal={P} pts={[[742, 590], [770, 578], [812, 574], [842, 562], [886, 558], [914, 548], [958, 544], [470, 640], [498, 628], [532, 626], [562, 614], [240, 566], [268, 558]]} /></group>
          {/* trampled snow round the fire, and long blue drift shadows that break the clearing up */}
          <Disc r={150} sy={0.3} color={SNOW_TRAMPLED} pos={[640, Y(596), 0.2]} seg={40} />
          {/* the fire's light on the snow: two flat warm tones */}
          <Disc r={128} sy={0.3} color="#d7bdb9" pos={[640, Y(596), 0.34]} seg={40} />
          <Disc r={88} sy={0.3} color={fire > 1 ? '#f0c79c' : '#e9c09a'} pos={[640, Y(596), 0.38]} seg={40} />
          {/* the wagon's ruts across the clearing to the foreground, with a pale lip */}
          {[0, 26].map((o) => { const pts = bezier([150 + o, Y(520)], [330 + o, Y(600)], [300 + o * 1.5, Y(730)], 14); return <group key={o}><Stroke pts={pts.map(([x, y]) => [x + 3, y + 1] as [number, number])} width={7} color="#d3dbee" pos={[0, 0, 0.26]} /><Stroke pts={pts} width={6} color={RUT} pos={[0, 0, 0.3]} /></group>; })}
          <Poly pts={[[-300, Y(566)], [60, Y(560)], [330, Y(572)], [300, Y(584)], [40, Y(576)], [-300, Y(584)]]} color={SNOW_TRAMPLED} pos={[0, 0, 0.2]} />
          <Poly pts={[[1080, Y(640)], [1330, Y(628)], [1600, Y(640)], [1600, Y(660)], [1320, Y(646)], [1100, Y(656)]]} color={SNOW_TRAMPLED} pos={[0, 0, 0.2]} />
          <Poly pts={[[520, Y(684)], [800, Y(676)], [1010, Y(688)], [790, Y(694)]]} color={SNOW_TRAMPLED} pos={[0, 0, 0.2]} />
          <At x={250} y={540} dz={1}><Drift w={210} pal={P} /></At>
          <At x={1190} y={610} dz={1}><Drift w={260} pal={P} /></At>
          <At x={600} y={668} dz={1}><Drift w={190} pal={P} /></At>
          <At x={-20} y={640} dz={1}><Drift w={230} pal={P} /></At>
        </group>
        <At x={1012} y={530} dz={-30}><Tent w={330} h={262} pal={P} side={-1} hero f={f} flapSide={-1} warm={-1} /></At>
        <group position={[838, Y(336), -24]}><Fx><Smoke pos={[0, 0, 0]} f={f} count={5} size={13} rise={120} spread={34} tones={P.smoke} seed={2} life={52} /></Fx></group>
        <At x={1196} y={548} dz={-8}><Crate w={64} pal={P} snow /></At>
        <At x={1150} y={556} dz={-5}><Barrel w={34} pal={P} /></At>
        <At x={880} y={540} dz={-10}><Sack w={30} pal={P} /></At>
        <At x={640} y={592} dz={0} s={0.8}><Campfire pal={P} f={f} size={fire} /></At>
        <At x={558} y={604} dz={12}><Crate w={40} h={22} pal={P} /></At>
        {/* shadows of the figures: flat darker snow */}
        {[[708, 596, 40], [796, 606, 38], [410, 668, 64]].map(([x, y, r], i) => <Disc key={i} r={r} sy={0.2} color={P.snowShade} pos={[x, Y(y), 14]} seg={24} />)}
        <At x={712} y={595} dz={16}><FolkA f={f} leanAt={20} back={28} /></At>
        <At x={798} y={605} dz={24}><FolkB f={f} stampAt={8} snow={P.snowLight} /></At>
        {/* more camp life in the clearing: chopping block with an axe, split logs, a bucket, a sledge */}
        <At x={530} y={636} dz={34}><Chop /></At>
        <At x={884} y={642} dz={36}><Bucket /></At>
        <At x={1010} y={690} dz={50}><Sledge /></At>
        <At x={410} y={668} dz={56}><Crate w={86} h={44} pal={P} /></At>
        {/* the trailing end of the shawl on the snow */}
        <Poly pts={[[438, Y(648)], [478 + hem, Y(656)], [496 + hem * 2, Y(668)], [470 + hem, Y(673)], [432, Y(670)]]} color="#34481f" pos={[0, 0, 60]} />
        <Poly pts={[[450, Y(654)], [478 + hem, Y(656)], [488 + hem * 2, Y(664)], [456, Y(664)]]} color="#40582a" pos={[0, 0, 60.2]} />
        <At x={196} y={612} dz={20}><Rock w={54} pal={P} /></At>
        <At x={946} y={646} dz={40}><Rock w={34} pal={P} /></At>
        {[[130, 560, 18, 1], [300, 640, 22, 3], [700, 650, 20, 4], [1010, 600, 18, 6], [1100, 664, 22, 7], [860, 620, 14, 8], [520, 560, 14, 9]].map(([x, y, h, s]) => <At key={s} x={x} y={y} dz={30}><Tuft h={h} pal={P} seed={s} /></At>)}
      </Layer>
      <Puppet rig={VICTOR_BACK2} pose={boyPose} height={wlen(BOY_PX, 1.0)} pos={wpos(410, 650, 1.0)} shadow={false} />
      {/* 6 foreground: near snow bank with dry grass, the snowy pine branch across the top right corner (sharp) */}
      <Layer z={3}>
        <Ground top={[[-300, 700], [180, 688], [520, 704], [860, 692], [1200, 702], [1600, 690]]} color="#d6deef" lip={P.snowLight} />
        <Poly pts={[[-300, Y(712)], [200, Y(700)], [470, Y(714)], [180, Y(712)], [-300, Y(722)]]} color={SNOW_MID} pos={[0, 0, 0.4]} />
        <Poly pts={[[760, Y(706)], [1010, Y(698)], [1280, Y(708)], [1010, Y(708)]]} color={SNOW_MID} pos={[0, 0, 0.4]} />
        {[[90, 700, 30, 11], [640, 712, 26, 12], [1040, 704, 30, 13], [1230, 712, 24, 14]].map(([x, y, h, s]) => <At key={s} x={x} y={y} dz={2}><Tuft h={h} pal={P} n={6} seed={s} /></At>)}
        <At x={1150} y={716} dz={3}><Rock w={70} pal={P} /></At>
        <SnowLayer f={f} count={SNOW.count / 2} seed={8} r={2.3} speed={3.2} color={SNOW.color} />
      </Layer>
      <Layer z={7}><At x={1330} y={24}><Branch len={330} pal={P} /></At></Layer>
    </Stage>
  );
};

export const S7: KitShot = {id: SHOT.S7.comp, len: LEN, bg: P.sky[1], Scene, liveness: liveness('wideExterior', [
  {name: 'camera', kind: 'camera', note: 'truck left 2.5 %/s eased, pine branch and band parallax'},
  {name: 'camp folk B', kind: 'puppet', beats: [8, 12, 24], note: 'film 358 pulls her arms in and stamps twice with a snow puff (9 on film; 8 on twos), 24 hands back to the fire'},
  {name: 'camp folk A', kind: 'puppet', beats: [20, 28], note: 'film 369 leans to the pot (7.5 degrees about the feet), 28 back; stirs on twos'},
  {name: 'boy from behind', kind: 'puppet', beats: [32], note: 'film 382 head tips back 14 degrees and lifts in 3 drawings (33; 32 on twos)'},
  {name: 'snow, 48 flakes in 2 layers', kind: 'ambient', family: 'weather'},
  {name: 'campfire', kind: 'ambient', family: 'flame', note: 'flat, no halo'},
  {name: 'pot steam and stovepipe smoke', kind: 'ambient', family: 'smoke'},
  {name: 'washing line and tent flaps', kind: 'ambient', family: 'cloth'},
  {name: 'dusk clouds', kind: 'ambient', family: 'sky'},
  {name: 'fire steps one size up', kind: 'state', beats: [20], note: 'film 369'},
])};
