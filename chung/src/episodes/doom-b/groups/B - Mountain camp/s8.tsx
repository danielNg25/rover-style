import React from 'react';
import {Stage, KitShot, camHold, liveness, Poly, Disc, Stroke, Rect, ClothSway, NameTag, trackStep, prog, twos, hash} from '../../../../kit';
import type {Pt, V3} from '../../../../kit';
import {Puppet, act, mix, puppetPoint} from '../../../../puppet';
import {VICTOR_FACE} from '../../../../chars/_lib/doom-b-victor';
import {VICTOR_FX, VictorFxBeat} from './boy';
import {SHOT, SNOW, SCALE} from '../../shared';
import {CAM0, Layer, At, Fx, Y, wpos, wlen, DUSK as P, Sky, Peaks, Ridge, Forest, Pine, Patch, SnowLayer, Ground, Tent, Drift, Campfire, StickPile, WashingLine, Tuft, Rock, Steps, Barrel, pen} from './set';

/* S8 (film 391-435, 44 f): the boy from the front for the first time, close, at the left slope of the hero tent:
 * its canvas wall fills the right two thirds, the camp (fire, a small tent, pines, the peak) is open at screen left.
 * Beats (in-shot): 0 blows into his cupped hands held at his mouth (puff at 2), tag arrow draws on | 8 blink |
 * 10-12 the hands drop out of frame in two poses | 12 'boy': eyes up, the ruler's glare | 22 a snowflake lands on his
 * nose: eyes cross, brows up | 34-38 shakes it off (head left, middle, right; the flake flies off on the second
 * pose; the tag bumps at 35, 'Victor') | 40 the glare snaps back, eyes up-right at his own name. */
const LEN = SHOT.S8.len;
const cam = camHold(CAM0, {driftPctPerSec: SHOT.S8.pct, seed: 3});

// the rig's head (tuft to chin, 640 px of 1478) is 70 % of the frame height
const K = (SCALE.frameShare.S8.boyFace * 720) / 640, RIG_PX = 1478 * K, FEET_Y = 46 + RIG_PX, BX = 575, BZ = 0;
const H = wlen(RIG_PX, BZ), POS: V3 = wpos(BX, FEET_Y, BZ);
/** frame pixel of a rig canvas point (rest pose) */
const cv = (x: number, y: number): Pt => [BX + (x - 450) * K, 46 + y * K];

const BEATS: VictorFxBeat[] = [
  {f: 0, ...VICTOR_FACE.soft, py: -0.6, headTilt: 3, headY: 8, note: 'blowing into his cupped hands'},
  {f: 8, blink: true},
  {f: 12, ...VICTOR_FACE.glare, py: 0, headTilt: 0, headY: 0, note: "'boy': eyes to camera, the mask's brows"},
  {f: 22, ...VICTOR_FACE.wide, py: -0.55, note: 'a snowflake lands on his nose: the glare breaks'},
  {f: 34, eyeOpen: 0.03, mouth: 'flat', note: 'shakes it off'},
  {f: 40, ...VICTOR_FACE.glare, px: 0.8, py: 0.75, note: 'glare back, up-right at his own name'},
];
/** the shake: left, through the middle, right, settle (canvas px; 22 px = 17 px on screen per drawing) */
const shakeX = (f: number) => trackStep(f, [[0, 0], [34, -22], [36, 0], [38, 22], [40, 8], [42, 0]]);
const pose = (f: number) => mix(act(BEATS, f, {rig: VICTOR_FX, seed: 3}), {
  headX: shakeX(f), headTilt: trackStep(f, [[0, 0], [34, -5], [36, 1], [38, 5], [40, -1], [42, -2]]),
  sel: {glow: hash(Math.floor(f / 4), 7) > 0.45 ? 'a' : 'b', arms: f < 14 ? 'up' : 'none'},
  parts: {
    // a small lift as he blows, then the hands drop out of frame in two drawings
    armsUp: {y: trackStep(f, [[0, 0], [2, -9], [4, 0], [6, -5], [8, 0], [10, 130], [12, 310]])},
    // the hair lags the head by one drawing
    hair: {x: (shakeX(f - 2) - shakeX(f)) * 0.3},
    pupilL: {x: trackStep(f, [[0, 0], [22, 15], [34, 0]])}, pupilR: {x: trackStep(f, [[0, 0], [22, -15], [34, 0]])},
  },
});

const edge = (y: number) => 430 - (y + 60) * 0.357;     // the tent's left slope, frame px

const Scene: React.FC<{f: number; t: number}> = ({f}) => {
  const warm = hash(Math.floor(f / 4), 7) > 0.45;                         // two flat values, changing on twos
  const nose = (ff: number) => puppetPoint(VICTOR_FX, pose(ff), '', 'nose', H, POS);
  // the one flake that lands on his nose; it flies off on the second pose of the shake
  const n22 = nose(22), fr = wlen(9, BZ);
  let flake: V3 | null;
  if (f < 22) { const u = f / 22; flake = [n22[0] + wlen(70 * (1 - u) + Math.sin(f * 0.3) * 6 * (1 - u), BZ), n22[1] + wlen(470 * (1 - u), BZ) + fr * 0.6, n22[2]]; }
  else if (f < 36) { const n = nose(f); flake = [n[0], n[1] + fr * 0.6, n[2]]; }
  else { const n = nose(34), d = (twos(f) - 34) / 2; flake = [n[0] - wlen(30 + d * 34, BZ), n[1] + wlen(26 - (d - 1.6) * (d - 1.6) * 14, BZ), n[2]]; }
  // breath: one small puff rising from between his hands, past the cheek
  const b = twos(f) - 2, [hx, hy] = cv(450, 590);
  const breath = b >= 0 && b < 12 ? {x: hx + 34 + b * 7, y: hy - 14 - b * 7, r: (10 + b * 1.7) * (b > 7 ? (12 - b) / 5 : 1)} : null;
  // tag bump on 'Victor' (film 426): three steps on twos, settled by 432
  const bump = trackStep(f, [[0, 1], [35, 1.16], [37, 0.95], [39, 1.04], [41, 1]]);
  const g = pen();
  // the canvas wall: one flat cream, a shade strip along the slope, seams that follow the slope, a hem band
  g.poly([[edge(-60), Y(-60)], [1700, Y(-60)], [1700, Y(780)], [edge(780), Y(780)]], P.canvas);
  g.poly([[edge(-60), Y(-60)], [edge(-60) + 22, Y(-60)], [edge(780) + 22, Y(780)], [edge(780), Y(780)]], P.canvasShade);
  [330, 700].forEach((d) => g.line([[edge(-60) + d, Y(-60)], [edge(780) + d, Y(780)]], 3, P.seam));
  g.poly([[edge(660), Y(660)], [1700, Y(660)], [1700, Y(780)], [edge(780), Y(780)]], P.canvasShade).line([[edge(660), Y(660)], [1700, Y(660)]], 3, P.seam);
  // a pale reinforcing band with stitches, level across the wall
  g.poly([[edge(404) + 22, Y(404)], [1700, Y(404)], [1700, Y(438)], [edge(438) + 22, Y(438)]], '#e3dac2');
  for (let x = 300; x < 1320; x += 34) { g.line([[x, Y(399)], [x, Y(409)]], 2.4, P.seam); g.line([[x + 17, Y(433)], [x + 17, Y(443)]], 2.4, P.seam); }
  // firelight from screen left: a warm flat wedge on the canvas beside the slope
  g.poly([[edge(300) + 22, Y(300)], [edge(300) + 80, Y(350)], [edge(780) + 250, Y(780)], [edge(780) + 22, Y(780)]], warm ? '#efd29a' : '#e8c98f');
  // his shadow, thrown on the canvas by the fire at screen left: one flat darker shape
  g.poly([[690, Y(250)], [780, Y(190)], [880, Y(210)], [930, Y(300)], [926, Y(430)], [880, Y(520)], [950, Y(600)], [980, Y(780)], [640, Y(780)], [640, Y(330)]], '#bfb597');
  // patches: the big green one whole, behind his shoulder; ochre and rust further off; a mended tear
  g.put((z) => <group position={[1010, Y(545), z]}><Patch w={150} h={126} rot={-7} color={P.green} stitch={P.green2} /></group>).skip(3);
  g.put((z) => <group position={[1196, Y(318), z]}><Patch w={96} h={80} rot={11} color={P.ochre} stitch={P.ochre2} /></group>).skip(3);
  g.put((z) => <group position={[1180, Y(628), z]}><Patch w={84} h={70} rot={-10} color={P.rust} stitch={P.canvasDark} /></group>).skip(3);
  g.line([[1150, Y(440)], [1168, Y(486)], [1160, Y(530)]], 3, P.canvasDark);
  [452, 470, 490, 510].forEach((y, i) => g.line([[1146 + i * 3, Y(y)], [1172 + (i % 2) * 4, Y(y + 6)]], 2.5, P.seam));
  // eyelets down the slope, a tie strap, snow lying on the slope's edge
  [90, 250, 410, 570].forEach((y) => g.disc(edge(y) + 44, Y(y), 6, P.canvasDark).disc(edge(y) + 44, Y(y), 2.6, P.soot));
  g.put((z) => <group position={[edge(250) + 44, Y(254), z]}><Fx><ClothSway kind="banner" pos={[0, 0, 0]} w={14} h={84} f={f} color={P.rope} notch={false} amp={0.16} seed={3} /></Fx></group>).skip(2);
  ([[-60, 60], [96, 190], [300, 372], [520, 640]] as Pt[]).forEach(([a, c]) => g.poly([[edge(a) - 9, Y(a)], [edge(a) + 4, Y(a - 8)], [edge(c) + 6, Y(c - 4)], [edge(c) + 2, Y(c + 8)], [edge(c) - 12, Y(c)]], P.pineSnow));
  // guy rope from the slope down to its peg in the snow, swaying a little on twos, snow sitting on it
  const sway = Math.sin((twos(f) / 2) * 0.55) * 4, r0: Pt = [edge(196) + 4, Y(196)], r1: Pt = [34, Y(548)], rm: Pt = [(r0[0] + r1[0]) / 2 + sway * 0.4, (r0[1] + r1[1]) / 2 - 12 + sway];
  return (
    <Stage cam={cam} f={f} len={LEN} mood="dusk" bg={P.canvas} name={SHOT.S8.comp}>
      {/* the camp beside the tent: dusk sky, the peak, ridges, the forest band */}
      <Layer z={-60}><Sky pal={P} top={820} bottom={Y(430)} /></Layer>
      <Layer z={-48}><Peaks pal={P} k={6.2} peak={[150, 96]} /></Layer>
      <Layer z={-38}><Ridge top={[[-300, 318], [-100, 290], [60, 312], [220, 282], [400, 316], [600, 290], [800, 320]]} base={560} color={P.ridge1} hi={P.ridge1Hi} shelves={[[-60, 312, 100], [230, 300, 90]]} /></Layer>
      <Layer z={-30}><Ridge top={[[-300, 356], [-60, 340], [150, 362], [380, 344], [640, 366], [800, 350]]} base={580} color={P.ridge2} hi={P.ridge2Hi} shelves={[[40, 364, 110]]} /></Layer>
      <Layer z={-22}><Forest pal={P} y={398} base={600} x0={-300} x1={760} hMin={40} hMax={78} seed={5} /></Layer>
      <Layer z={-14}>
        <Ground top={[[-300, 446], [0, 440], [260, 448], [520, 442], [800, 448]]} color={P.snowShade} lip={P.snow} />
        <At x={62} y={470} dz={3}><Pine h={300} pal={P} /></At>
        <At x={-60} y={468} dz={2}><Pine h={230} pal={P} /></At>
        <At x={300} y={462} dz={2}><Pine h={190} pal={P} /></At>
        <SnowLayer f={f} count={SNOW.count / 2} seed={5} r={1.8} speed={2.2} color={SNOW.colorFar} x0={-200} x1={700} />
      </Layer>
      {/* nearer: a small tent with a lit door, the wood pile, the fire with its pot, trampled snow */}
      <Layer z={-9}>
        <Ground top={[[-300, 500], [-20, 494], [240, 504], [480, 496], [800, 502]]} color={P.snow} lip={P.snowLight} />
        <At x={226} y={530} dz={4}><Tent w={170} h={136} pal={P} side={-1} door="lit" f={f} patches={1} front="#cdbf9f" /></At>
        <At x={112} y={540} dz={6}><StickPile w={56} pal={P} /></At>
        <group position={[0, 0, 3]}><WashingLine a={[-70, 436]} b={[150, 428]} pal={P} f={f} posts={[[-66, 536]]} amp={0.2} sag={16} /></group>
        <At x={330} y={546} dz={6}><Barrel w={28} pal={P} /></At>
        <At x={-30} y={536} dz={5}><Drift w={150} pal={P} /></At>
      </Layer>
      <Layer z={-6}>
        <Ground top={[[-300, 572], [-40, 566], [200, 578], [460, 568], [800, 576]]} color="#c3cde8" lip={P.snowLight} />
        {/* the fire's warm flat patch on the snow */}
        <Disc r={150} sy={0.26} color="#dcc3bd" pos={[92, Y(668), 0.3]} seg={40} />
        <Disc r={98} sy={0.26} color={warm ? '#efc8a0' : '#e8c09a'} pos={[92, Y(668), 0.5]} seg={40} />
        <group position={[0, 0, 0.7]}><Steps pal={P} pts={[[190, 640], [214, 628], [246, 622], [270, 610], [30, 612], [58, 602]]} /></group>
        <At x={92} y={668} dz={4} s={1.05}><Campfire pal={P} f={f} size={1.1} /></At>
        <At x={236} y={676} dz={8}><Rock w={44} pal={P} /></At>
        <At x={200} y={604} dz={3}><Tuft h={18} pal={P} seed={4} /></At>
        <At x={-10} y={700} dz={9}><Tuft h={24} pal={P} seed={7} /></At>
      </Layer>
      {/* the hero tent's canvas wall, sharp */}
      <Layer z={-4}>
        {g.out}
        <Stroke pts={[r0, rm, r1]} width={6} color={P.rope} pos={[0, 0, 12]} />
        <Rect w={16} h={10} color={P.woodDark} pos={[r0[0], r0[1], 12.5]} rot={[0, 0, 0.5]} />
        <Rect w={10} h={34} color={P.woodDark} pos={[r1[0] - 2, r1[1] - 6, 11.5]} rot={[0, 0, 0.5]} />
        <Poly pts={[[rm[0] + 34, rm[1] + 20], [rm[0] + 12, rm[1] + 15], [rm[0] - 18, rm[1] - 8], [rm[0] + 6, rm[1] + 2]]} color={P.pineSnow} pos={[0, 0, 13]} />
      </Layer>
      <Layer z={-2}><SnowLayer f={f} count={SNOW.count / 2 + 6} seed={2} r={3} speed={3.4} color="#f4f7fd" /></Layer>
      <Puppet rig={VICTOR_FX} pose={pose} height={H} pos={POS} shadow={false} />
      {flake ? <Disc r={fr} color="#f1f4fb" pos={flake} seg={16} /> : null}
      {breath ? <Layer z={0.4}><Disc r={breath.r} color="#eef1f8" pos={[breath.x, Y(breath.y), 0]} seg={24} /><Disc r={breath.r * 0.55} color="#dfe5f1" pos={[breath.x + breath.r * 0.9, Y(breath.y + breath.r * 0.5), 0.2]} seg={20} /></Layer> : null}
      {/* the film's name tag, in the clear canvas at upper right: text there from frame 0, arrow draws on over 12 f */}
      <group position={wpos(985, 150, 0.6)} scale={bump}>
        <NameTag text={SCALE.tag.text} pos={[-wlen(118, 0.6), -wlen(20, 0.6), 0]} height={wlen(76, 0.6)} to={[-wlen(52, 0.6), -wlen(96, 0.6)]} p={prog(f, 0, 12)} tone="black" />
      </group>
      <Layer z={2}><SnowLayer f={f} count={14} seed={9} r={3.8} speed={4.2} color="#f7f9fe" /></Layer>
    </Stage>
  );
};

export const S8: KitShot = {id: SHOT.S8.comp, len: LEN, bg: P.canvas, Scene, liveness: liveness('close', [
  {name: 'camera', kind: 'camera', note: 'hold with drift-push 0.8 %/s'},
  {name: 'boy face', kind: 'puppet', beats: [10, 12, 22, 34, 40], note: 'film 401 hands drop, 403 glare, 414 flake on nose (23; 22 on twos), 426 shakes it off (35; 34 on twos), 431 glare back'},
  {name: 'snow over the canvas', kind: 'ambient', family: 'weather'},
  {name: 'tie strap, guy rope, washing in the camp', kind: 'ambient', family: 'cloth'},
  {name: 'campfire beside the tent', kind: 'ambient', family: 'flame', note: 'flat, no halo'},
  {name: 'firelight tone on the cheek, shoulder and canvas', kind: 'ambient', family: 'light', note: '2 flat values on twos'},
  {name: 'breath puff', kind: 'effect', beats: [2], note: 'film 393'},
  {name: 'name tag arrow and bump', kind: 'effect', beats: [0, 35], note: 'draw-on 12 f from 391, bump at film 426'},
])};
