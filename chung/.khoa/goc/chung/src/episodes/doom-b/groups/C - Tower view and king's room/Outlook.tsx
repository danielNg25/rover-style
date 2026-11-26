import React from 'react';
import {Stage, KitShot, liveness, refSpace, Rect, Poly, Disc, Diamond, Flame, Smoke, Puff, PopIn, ClothSway,
  track, idle, hash, deg} from '../../../../kit';
import type {Pt} from '../../../../kit';
import {SHOT, MOUNTAINS, TOWERS, PINES, CLOUDS, SNOW, COLORS, FINISH} from '../../shared';
import {Layer, P, Y, camPushTo} from './lib';

/* S6 (film 305-349): HALL OUTLOOK, state 'rewind'. The hall's own far cards (range, caps, facet, front ridge, snow
 * field, green hill band, towers, cloud lumps) copied as POLYGONS from ../../shared.ts and enlarged, laid out in
 * frame pixels of frame 0 on planes with real depth. Everything is an unlit flat card: no light, no blur, no glow.
 * Depth bands (camera at z = 100): sky -400 | cloud -300 | range -200 | ridge and snow field -120 / -110 |
 * green hill -50 | far snow -25 | towers and pines 0 | fore hill +12 | near snow +45. */

const M = SHOT.S6, LEN = M.len;
const m = refSpace({cam: [0, 0, 100], fov: 20});

/** the three hall towers this shot uses (h / w ratios of TOWERS.near[0], near[1], near[2]), in frame pixels:
 *  total height (body + cap + roof = h + 2.55 w) is 70 / 55 / 45 percent of the frame */
export const S6_TOWERS = [
  {x: 575, base: 590, w: 75, h: 312.8, c: TOWERS.near[0].c, off: 4, pop: 16},    // 504 px, tallest, just left of centre
  {x: 815, base: 600, w: 61.3, h: 239.7, c: TOWERS.near[1].c, off: 6, pop: 22},  // 396 px
  {x: 365, base: 596, w: 48.6, h: 200.1, c: TOWERS.near[2].c, off: 8, pop: 28},  // 324 px
];
/** pines left to right, heights 1 : 0.8 : 0.9 (PINES.heights), where the two shorter towers stood */
const S6_PINES = [{x: 318, base: 592, H: 236, at: 32}, {x: 418, base: 598, H: 189, at: 34}, {x: 815, base: 598, H: 212, at: 36}];
/* The design's own fallback (remaining_issues: 'if missed, move both to f339'): the fire and the figure come in at
 * in-shot 34 (film 339), which gives them 10 frames instead of 6. */
const FIRE_AT = 34, FIRE: Pt = [575, 568];

/** NIGHT GRADE. The hall's cards are pale day colours; here every land colour goes through n(): darker and bluer,
 *  so snow lands on a mid blue-grey and only the windows and the fire stay warm and light. */
const n = (hex: string, k = 1): string => {
  const v = parseInt(hex.slice(1), 16), c = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  const g = [0.5, 0.57, 0.74].map((m, i) => Math.max(0, Math.min(255, Math.round(c[i] * m * k))));
  return '#' + g.map((x) => x.toString(16).padStart(2, '0')).join('');
};

const cam = camPushTo({pos: [0, 0, 100], fov: 20}, m.pt(S6_TOWERS[0].x, S6_TOWERS[0].base, 0), {pctPerSec: M.pct});

// ---- the hall's range, enlarged 9 px per hall unit; summit of the tallest peak just above the top of frame
const K = 9, RX = (u: number) => 560 + (u - MOUNTAINS.tallest[0]) * K, RY = (v: number) => -60 + (MOUNTAINS.tallest[1] - v) * K;
const rangePts = (pts: [number, number][]) => P(pts.map(([u, v]) => [RX(u), RY(v)]));
const RANGE: [number, number][] = [...MOUNTAINS.range.pts.slice(0, -1), [170, 0], [170, -60], [-170, -60]];
const FACETS: [number, number][][] = [MOUNTAINS.facet.pts, [[-128, 30], [-104, 14], [-116, 14], [-124, 22]], [[-28, 30], [-4, 12], [-18, 12], [-25, 21]]];
// [u0, v0, u1, v1, width] in the range card's own units
const GULLIES: [number, number, number, number, number][] = [[-84, 29, -92, 17, 3], [-80, 27, -83, 13, 2.4], [-132, 24, -140, 13, 3], [-125, 21, -127, 11, 2.2], [-33, 24, -41, 12, 3], [-27, 21, -29, 10, 2.2], [20, 28, 12, 16, 3]];
const RIBS: [number, number, number, number, number][] = [[-100, 12, -98, 0, 4], [-74, 16, -78, 0, 5], [-66, 8, -60, 0, 4], [-134, 10, -130, 0, 4], [-22, 14, -20, 0, 5], [-36, 10, -40, 0, 4], [16, 20, 20, 0, 5], [-158, 6, -162, 0, 4], [-96, 19, -106, 2, 7], [-88, 14, -90, 0, 6], [-62, 12, -56, 0, 6], [-142, 14, -152, 0, 7], [-116, 10, -112, 0, 5], [-44, 14, -52, 0, 6], [-12, 9, -8, 0, 5], [8, 16, 0, 0, 7]];
const FOOT: [number, number][] = [[-175, 0], [-150, 9], [-132, 4], [-112, 11], [-96, 5], [-80, 10], [-64, 3], [-46, 9], [-30, 4], [-12, 10], [6, 5], [24, 11], [44, 4], [70, 9], [175, 0], [175, -40], [-175, -40]];
/** the hall's pine forest, far off: a near row at the edge of the snow field and a paler row on the ridge,
 *  both kept clear of the tall tower's gap (x 450-720) so the fire point reads alone. [x, y, height] */
/** pine CLUMPS on the snow field: [x, base y, height, width factor, tiers]; grouped, varied, clear of x 450-720 */
const CLUMPS: [number, number, number, number, number][] = [
  [40, 500, 96, 1.0, 4], [84, 508, 62, 1.15, 3], [-6, 512, 70, 0.9, 3], [128, 498, 44, 1.1, 3],
  [236, 470, 52, 1.0, 3], [268, 476, 78, 0.9, 4], [305, 468, 40, 1.2, 3],
  [400, 486, 34, 1.1, 3], [428, 492, 50, 0.95, 3],
  [752, 478, 58, 1.0, 3], [790, 486, 88, 0.92, 4], [832, 474, 46, 1.15, 3],
  [985, 500, 108, 0.95, 4], [1040, 508, 70, 1.1, 3], [1082, 496, 52, 1.0, 3], [938, 494, 42, 1.2, 3],
  [1205, 474, 60, 1.0, 3], [1246, 482, 84, 0.9, 4], [1296, 476, 48, 1.1, 3],
];
/** far pines on the ridge, three loose groups: [x, y, height] */
const RIDGE_TREES: [number, number, number][] = [[62, 384, 26], [84, 388, 19], [108, 383, 30], [136, 389, 17], [372, 372, 22], [394, 376, 30], [420, 374, 18],
  [842, 380, 20], [866, 376, 29], [892, 381, 23], [918, 384, 15], [1150, 368, 27], [1176, 372, 20], [1204, 370, 31], [1232, 376, 16]];
/** wind-packed drift edges on the snow field: [x, y, width] */
const DRIFTS: [number, number, number][] = Array.from({length: 14}, (_, i) => [hash(i, 61) * 1340 - 30, 478 + hash(i, 62) * 84, 40 + hash(i, 63) * 60] as [number, number, number]);
/** grass tufts and pebbles on the green hill: [x, y, size, tone] */
const TUFTS: [number, number, number, number][] = Array.from({length: 110}, (_, i) => [hash(i, 41) * 1340 - 30, 606 + hash(i, 42) * 100, 5 + hash(i, 43) * 5, i % 3] as [number, number, number, number]).filter(([x]) => x < 540 || x > 650) as [number, number, number, number][];
/** course marks on a tower body: [x share of w, y share of h] */
const BRICKS: [number, number][] = Array.from({length: 16}, (_, i) => [(hash(i, 51) - 0.5) * 0.62 - 0.1, 0.06 + (i + hash(i, 52) * 0.6) / 17 * 0.9] as [number, number]);
const RIDGE: [number, number][] = MOUNTAINS.frontRidge.pts.slice(0, 8).concat([[170, -40], [-170, -40]]) as [number, number][];
const FIELD: [number, number][] = MOUNTAINS.snowField.pts.slice(0, 7).concat([[170, -40], [-170, -40]]) as [number, number][];

const CREST: [number, number][] = [[-60, 600], [120, 562], [260, 586], [365, 572], [470, 592], [575, 578], [700, 596], [815, 576], [960, 592], [1120, 556], [1340, 586]];
const G = {hill: PINES.greens[0], light: PINES.greens[1], dark: '#27694a', deep: '#215a40'};
const STARS: [number, number, number][] = [[60, 26, 4], [250, 38, 5], [338, 96, 4], [402, 28, 3.6], [770, 48, 5], [900, 34, 4], [1150, 58, 4.4], [1232, 120, 3.6]];
if (STARS.length !== FINISH.starsS6) throw new Error('S6: star count differs from shared FINISH.starsS6');

/** Far layers: the small stacking offsets inside a layer are stretched along z, because at 200-500 units from the
 *  camera a 0.3 px offset is below the depth buffer's precision and coplanar cards flicker for single frames. */
const Far: React.FC<{z: number; k?: number; children: React.ReactNode}> = ({z, k = 10, children}) => <Layer m={m} z={z}><group scale={[1, 1, k]}>{children}</group></Layer>;
const shade = (c: string) => (c === '#b9bfe6' ? '#a3aad8' : '#989fd0');
const STONE_D = '#6f76a8', STONE_L = '#c9cdf0';

/** One hall tower, night-graded, with what stands at its foot: stepped plinth, a buttress and a broken wall stub
 *  (all pop out with it). `side` = which way the wall stub runs. */
const Tower: React.FC<{w: number; h: number; c: string; lit: boolean; f: number; flag?: boolean; side: number}> = ({w, h, c, lit, f, flag, side}) => (
  <group>
    {/* broken curtain-wall stub with two merlons and a fallen block */}
    <group scale={[side, 1, 1]}>
      <Poly pts={[[w * 0.4, 0], [w * 2.25, 0], [w * 2.3, w * 0.5], [w * 2.0, w * 0.62], [w * 1.9, w * 0.95], [w * 0.4, w * 0.95]]} color={n(shade(c))} pos={[0, 0, -0.4]} />
      <Poly pts={[[w * 0.4, w * 0.95], [w * 1.9, w * 0.95], [w * 1.9, w * 0.82], [w * 0.4, w * 0.82]]} color={n(STONE_D)} pos={[0, 0, -0.3]} />
      {[0.72, 1.3].map((k) => <Rect key={k} w={w * 0.3} h={w * 0.26} pos={[w * k, w * 1.08, -0.4]} color={n(shade(c))} />)}
      {[0.72, 1.3].map((k) => <Rect key={`s${k}`} w={w * 0.34} h={w * 0.07} pos={[w * k, w * 1.24, -0.3]} color={n(SNOW.color)} />)}
      {[[0.8, 0.3], [1.5, 0.55], [1.1, 0.6], [1.85, 0.25]].map(([a, b], j) => <Rect key={`b${j}`} w={w * 0.24} h={w * 0.09} pos={[w * a, w * b, -0.3]} color={n(j % 2 ? STONE_D : c)} />)}
      <Poly pts={[[w * 2.5, 0], [w * 2.56, w * 0.2], [w * 2.82, w * 0.24], [w * 2.9, 0]]} color={n(STONE_D)} pos={[0, 0, -0.3]} />
      <Poly pts={[[w * 2.56, w * 0.2], [w * 2.82, w * 0.24], [w * 2.76, w * 0.3], [w * 2.6, w * 0.27]]} color={n(SNOW.color)} pos={[0, 0, -0.2]} />
      {/* buttress on the other side */}
      <Poly pts={[[-w * 0.48, 0], [-w * 0.92, 0], [-w * 0.84, w * 0.5], [-w * 0.48, h * 0.34]]} color={n(shade(c))} pos={[0, 0, -0.2]} />
      <Poly pts={[[-w * 0.92, 0], [-w * 0.84, w * 0.5], [-w * 0.7, w * 0.44], [-w * 0.74, 0]]} color={n(c)} pos={[0, 0, -0.1]} />
    </group>
    <Rect w={w} h={h} pos={[0, h / 2, 0]} color={n(c)} />
    <Rect w={w * 0.26} h={h} pos={[w * 0.37, h / 2, 0.2]} color={n(shade(c))} />
    {/* stepped plinth */}
    <Rect w={w * 1.34} h={w * 0.16} pos={[0, w * 0.08, 0.4]} color={n(STONE_D)} />
    <Rect w={w * 1.16} h={w * 0.14} pos={[0, w * 0.23, 0.4]} color={n(shade(c))} />
    <Rect w={w * 1.16} h={w * 0.035} pos={[0, w * 0.31, 0.5]} color={n(STONE_L)} />
    {[0.3, 0.65].map((k) => <Rect key={k} w={w} h={w * 0.045} pos={[0, h * k, 0.4]} color={n(shade(c))} />)}
    {BRICKS.map(([bx, by], i) => <Rect key={i} w={w * 0.2} h={w * 0.07} pos={[bx * w, by * h, 0.3]} color={n(i % 3 ? shade(c) : STONE_L)} />)}
    {/* arrow slits */}
    {[0.2, 0.5].map((k) => <Rect key={`a${k}`} w={w * 0.05} h={w * 0.24} pos={[w * 0.3, h * k, 0.5]} color={n('#5f648c')} />)}
    {/* door with its arch stones and step */}
    <Rect w={w * 0.34} h={w * 0.34} pos={[-w * 0.12, w * 0.47, 0.55]} color={n(STONE_L)} />
    <Disc r={w * 0.17} pos={[-w * 0.12, w * 0.64, 0.55]} color={n(STONE_L)} />
    <Rect w={w * 0.26} h={w * 0.34} pos={[-w * 0.12, w * 0.47, 0.6]} color="#2a2f55" />
    <Disc r={w * 0.13} pos={[-w * 0.12, w * 0.64, 0.6]} color="#2a2f55" />
    <Rect w={w * 0.03} h={w * 0.4} pos={[-w * 0.12, w * 0.5, 0.65]} color="#3a4070" />
    {/* cap with corbels and its shadow line */}
    <Rect w={w} h={w * 0.07} pos={[0, h - w * 0.185, 0.5]} color={n('#8d93c4')} />
    <Rect w={w * 1.2} h={w * 0.3} pos={[0, h, 0.6]} color={n(STONE_L)} />
    <Rect w={w * 1.2} h={w * 0.08} pos={[0, h - w * 0.11, 0.7]} color={n(c)} />
    {[-0.45, -0.15, 0.15, 0.45].map((k) => <Rect key={`c${k}`} w={w * 0.1} h={w * 0.12} pos={[w * k, h - w * 0.21, 0.7]} color={n(STONE_D)} />)}
    {/* roof: 4-sided cone seen flat, lit and shaded half, shingle courses, snow on the lit edge */}
    <Poly pts={[[-w * 0.62, h + w * 0.15], [w * 0.62, h + w * 0.15], [0, h + w * 2.55]]} color={n(TOWERS.roof, 1.1)} pos={[0, 0, 0.8]} />
    <Poly pts={[[0, h + w * 0.15], [w * 0.62, h + w * 0.15], [0, h + w * 2.55]]} color={n('#77747c')} pos={[0, 0, 1]} />
    {[0.25, 0.5, 0.72].map((k) => <Rect key={`r${k}`} w={w * 1.24 * (1 - k) + 1} h={w * 0.035} pos={[0, h + w * (0.15 + 2.4 * k), 1.1]} color={n('#6a6770')} />)}
    <Poly pts={[[-w * 0.62, h + w * 0.15], [-w * 0.3, h + w * 1.38], [-w * 0.36, h + w * 0.72], [-w * 0.46, h + w * 0.5]]} color={n(SNOW.color)} pos={[0, 0, 1.15]} />
    <Poly pts={[[0, h + w * 2.55], [-w * 0.13, h + w * 2.05], [-w * 0.02, h + w * 2.14], [w * 0.07, h + w * 2.27]]} color={n(SNOW.color)} pos={[0, 0, 1.15]} />
    <Rect w={w * 1.32} h={w * 0.06} pos={[0, h + w * 0.17, 1.2]} color={n('#a7a4a8')} />
    {TOWERS.windowHeights.map((k, i) => (
      <group key={i} position={[(i % 2 ? 0.2 : -0.2) * w, h * k, 1]}>
        <Diamond w={w * 0.17} h={w * 0.25} color={n(STONE_D)} />
        <Diamond w={w * 0.11} h={w * 0.18} pos={[0, 0, 0.1]} color={lit ? TOWERS.window : n(TOWERS.windowOff, 0.8)} />
      </group>
    ))}
    {flag ? (
      <group position={[0, h + w * 2.5, 0.6]}>
        <Rect w={2.4} h={30} pos={[0, 15, 0]} color={n(STONE_L)} />
        <ClothSway kind="flag" pos={[1.2, 23, 0.2]} w={26} h={13} f={f} color={n(COLORS.hall.green, 1.2)} stripe={n(COLORS.hall.gold, 1.3)} amp={0.09} seed={2} />
      </group>
    ) : null}
  </group>
);

/** A pine in stacked ragged tiers, lit half and shade half, a snow slab on the lit edge of every tier.
 *  far = paler and bluer (the field clumps). */
const Pine: React.FC<{H: number; wf?: number; tiers?: number; far?: boolean}> = ({H, wf = 1, tiers = 4, far}) => {
  const lit = far ? '#2c5a62' : n(PINES.greens[1], 1.15), dark = far ? '#234a56' : n(PINES.greens[0], 0.85), snow = far ? '#93a6cc' : n(PINES.cap, 1.08), snowD = far ? '#7286b2' : n(PINES.cap, 0.8);
  return (
    <group>
      <Rect w={H * 0.05} h={H * 0.16} pos={[0, H * 0.08, 0]} color={far ? '#2a2c44' : '#2b2530'} />
      {Array.from({length: tiers}, (_, i) => {
        const yb = H * (0.11 + (0.6 * i) / tiers), yt = i === tiers - 1 ? H : yb + H * (0.46 - 0.03 * i), hw = H * PINES.halfBaseOverHeight * wf * (1 - (0.62 * i) / tiers), d = H * 0.035, z = 0.4 + i * 0.5;
        const e = (s: number, dx = 0, dy = 0): Pt => [-hw * (1 - s) + dx, yb + (yt - yb) * s + dy];
        return (
          <group key={i}>
            <Poly pts={[[-hw, yb], [-hw * 0.5, yb + d], [0, yb - d * 0.3], [hw * 0.5, yb + d], [hw, yb], [0, yt]]} color={lit} pos={[0, 0, z]} />
            <Poly pts={[[0, yb - d * 0.3], [hw * 0.5, yb + d], [hw, yb], [0, yt]]} color={dark} pos={[0, 0, z + 0.12]} />
            <Poly pts={[e(0), e(0.36), e(0.3, hw * 0.24, -d * 0.3), e(0.08, hw * 0.34, d * 0.1)]} color={snow} pos={[0, 0, z + 0.24]} />
            <Poly pts={[[hw, yb], [hw * 0.7, yb + (yt - yb) * 0.3], [hw * 0.52, yb + (yt - yb) * 0.22], [hw * 0.62, yb + d * 0.9]]} color={snowD} pos={[0, 0, z + 0.24]} />
            {i === tiers - 1 ? <Poly pts={[[0, yt], [hw * 0.2, yt - (yt - yb) * 0.2], [hw * 0.06, yt - (yt - yb) * 0.15], [-hw * 0.08, yt - (yt - yb) * 0.25], [-hw * 0.25, yt - (yt - yb) * 0.25]]} color={snow} pos={[0, 0, z + 0.3]} /> : null}
          </group>
        );
      })}
    </group>
  );
};

/** A faceted boulder: dark body, lit facet, snow lying on top. w = width */
const Rock: React.FC<{w: number; k?: number; flip?: boolean}> = ({w, k = 1, flip}) => (
  <group scale={[flip ? -1 : 1, 1, 1]}>
    <Poly pts={[[-w * 0.5, 0], [-w * 0.42, w * 0.3 * k], [-w * 0.12, w * 0.5 * k], [w * 0.24, w * 0.42 * k], [w * 0.5, w * 0.12 * k], [w * 0.54, 0]]} color="#2b3156" />
    <Poly pts={[[-w * 0.5, 0], [-w * 0.42, w * 0.3 * k], [-w * 0.12, w * 0.5 * k], [-w * 0.02, w * 0.22 * k], [-w * 0.16, 0]]} color="#3d456f" pos={[0, 0, 0.1]} />
    <Poly pts={[[-w * 0.42, w * 0.3 * k], [-w * 0.12, w * 0.5 * k], [w * 0.24, w * 0.42 * k], [w * 0.36, w * 0.3 * k], [w * 0.1, w * 0.36 * k], [-w * 0.06, w * 0.3 * k], [-w * 0.26, w * 0.34 * k]]} color={n(SNOW.color)} pos={[0, 0, 0.2]} />
  </group>
);

/** One cloud of the hall (CLOUDS lumps), 2 tones, y up, in cloud units; moonless night tones */
const CL = {top: n(CLOUDS.tones.top, 1.12), under: n(CLOUDS.tones.under, 0.95)};
const HallCloud: React.FC<{s: number}> = ({s}) => (
  <group scale={s}>
    {CLOUDS.lumpsUnder.map(([x, y, r], i) => <Disc key={`u${i}`} r={r} pos={[x, y, 0]} color={CL.under} seg={36} />)}
    <Rect w={CLOUDS.base.w * 0.8} h={0.5} pos={[0, -0.95, 0.004]} color={CL.under} />
    {CLOUDS.lumpsTop.map(([x, y, r], i) => <Disc key={`t${i}`} r={r} pos={[x, y, 0.01]} color={CL.top} seg={36} />)}
    <Rect w={4.6} h={0.75} pos={[0, -0.35, 0.012]} color={CL.top} />
    {[[-1.5, -0.42, 0.5], [0.3, -0.3, 0.62], [1.7, -0.45, 0.46]].map(([x, y, r], i) => (
      <group key={`f${i}`} position={[x, y, 0.014]}><Disc r={r} color={CL.under} seg={30} /><Disc r={r} pos={[0.05, 0.1, 0.002]} color={CL.top} seg={30} /></group>
    ))}
  </group>
);

/** The film's snow field run UPWARD: crisp discs on every frame, one depth layer per call. */
const RisingSnow: React.FC<{f: number; n: number; r: number; speed: number; color: string; seed: number}> = ({f, n: count, r, speed, color, seed}) => (
  <group>
    {Array.from({length: count}, (_, i) => {
      const v = 0.75 + 0.5 * hash(i, seed + 2), y = ((hash(i, seed + 1) * 800 + f * speed * v) % 800) - 40;
      const x = hash(i, seed) * 1400 - 60 + Math.sin(f * 0.07 + i * 1.7) * 3 - (y / 800) * 20;
      return <Disc key={i} r={r * (0.8 + 0.45 * hash(i, seed + 3))} pos={[x, y, 0]} color={color} seg={12} />;
    })}
  </group>
);

/** far tree line along the top edge of the snow field: stands with gaps. [x, y, height, tone] */
const fieldTop = (x: number) => { const u = MOUNTAINS.tallest[0] + (x - 560) / K, p = MOUNTAINS.snowField.pts; for (let i = 0; i < 6; i++) if (u <= p[i + 1][0] || i === 5) { const t = (u - p[i][0]) / (p[i + 1][0] - p[i][0]); return 482 - (p[i][1] + (p[i + 1][1] - p[i][1]) * t) * K; } return 470; };
const TREELINE: [number, number, number, number][] = Array.from({length: 150}, (_, i) => {
  const x = -40 + i * 9.2 + hash(i, 71) * 6;
  return [x, fieldTop(x) + 5 + hash(i, 72) * 5, 20 + hash(i, 73) * 26 + 10 * Math.sin(x * 0.02), i % 2] as [number, number, number, number];
}).filter(([x]) => Math.sin(x * 0.012 + 0.6) + 0.6 * Math.sin(x * 0.033 + 2) > -0.55);
/** large wind drifts on the snow field: [x0, x1, y, rise] lit crest with a shade band under it */
const BIG_DRIFTS: [number, number, number, number][] = [[-60, 520, 506, 16], [380, 1010, 536, 20], [840, 1340, 498, 15]];
/** snow patches on the hill, each its own outline: [x, y, w, h, skew] */
const PATCHES: [number, number, number, number, number][] = [[175, 606, 120, 16, 8], [468, 626, 64, 9, -5], [700, 622, 150, 18, 10], [935, 612, 76, 11, -8], [1105, 592, 170, 20, 6], [1228, 628, 54, 8, 4], [44, 634, 96, 12, -6]];

const Scene: React.FC<{f: number; t: number}> = ({f}) => {
  // tiny figure: shifts on twos, leans to the fire at in-shot 40 (film 345)
  const lean = track(f, [[0, 0], [40, 1]], 4), sh = idle(f, 7, 6);
  const cloudX = 1215 - f * 1.5;
  const S = {field: '#788fc0', far: '#677db2', lit: '#a3b8de', shade: '#566a9e'};
  return (
    <Stage cam={cam} f={f} len={LEN} mood="nightExterior" bg={COLORS.hall.sky} name={M.comp}>
      {/* SKY: three flat navy bands, 8 constant stars */}
      <Far z={-400} k={10}>
        <Rect w={1700} h={900} pos={[640, 360, 0]} color="#262d7c" />
        <Rect w={1700} h={300} pos={[640, Y(60), 0.5]} color="#1e2468" />
        <Rect w={1700} h={300} pos={[640, Y(-95), 1]} color="#181c58" />
        {STARS.map(([x, y, w], i) => <Diamond key={i} w={w} h={w * 1.25} pos={[x, Y(y), 2]} color={i % 3 === 1 ? '#dfe6ff' : '#f6f1dc'} />)}
      </Far>
      {/* CLOUD EDGE: the lowest conjured cloud, sliding backwards (right to left) */}
      <Far z={-300}><group position={[cloudX, Y(66), 0]}><HallCloud s={60} /></group></Far>
      {/* RANGE: the tallest peak's flanks, cap, facet */}
      <Far z={-200} k={10}>
        <Poly pts={rangePts(RANGE)} color={n(MOUNTAINS.range.color, 0.92)} />
        {FACETS.map((ft, i) => <Poly key={i} pts={rangePts(ft)} color={n(MOUNTAINS.facet.color, 0.92)} pos={[0, 0, 0.5]} />)}
        {MOUNTAINS.summits.map(([u, v], i) => <Poly key={i} pts={P(MOUNTAINS.cap.pts.map(([a, b]) => [RX(u + a * 1.15), RY(v + b * 1.15)]))} color={n(MOUNTAINS.cap.color, 1.12)} pos={[0, 0, 1]} />)}
        {/* snow gullies running down from the caps, and dark rock ribs: both follow the flanks */}
        {GULLIES.map(([u0, v0, u1, v1, w], i) => <Poly key={i} pts={rangePts([[u0 - w / 2, v0], [u0 + w / 2, v0], [u1, v1]])} color={n(i % 2 ? '#dfe6f6' : MOUNTAINS.facet.color)} pos={[0, 0, 0.7]} />)}
        {RIBS.map(([u0, v0, u1, v1, w], i) => <Poly key={i} pts={rangePts([[u0, v0], [u1 - w / 2, v1], [u1 + w / 2, v1]])} color="#2f3b6c" pos={[0, 0, 0.6]} />)}
        {/* the flank turned away from the light: one flat darker facet under every summit */}
        {MOUNTAINS.summits.map(([u, v], i) => <Poly key={`sh${i}`} pts={rangePts([[u, v], [u - 26, v - 27], [u - 15, v - 30], [u - 6, v - 20], [u - 3, v - 30], [u + 2, v - 14]])} color="#34407a" pos={[0, 0, 0.55]} />)}
      </Far>
      {/* FOOTHILLS: one flat tone between the range and the ridge */}
      <Far z={-160} k={10}>
        <Poly pts={P(FOOT.map(([u, v]) => [RX(u), 300 - v * K]))} color="#3a4a82" />
        {FOOT.slice(1, 14).map(([u, v], i) => (
          <group key={i}>
            <Poly pts={P([[RX(u), 300 - v * K], [RX(u + 5), 300 - (v - 5) * K], [RX(u + 1.5), 300 - (v - 5) * K]])} color="#2c3868" pos={[0, 0, 0.3]} />
            {i % 2 ? <Poly pts={P([[RX(u), 300 - v * K], [RX(u - 4), 300 - (v - 3) * K], [RX(u - 1), 300 - (v - 2.4) * K]])} color="#6177ae" pos={[0, 0, 0.3]} /> : null}
          </group>
        ))}
      </Far>
      {/* FRONT RIDGE and SNOW FIELD = the peak's foot */}
      <Far z={-120} k={10}>
        <Poly pts={P(RIDGE.map(([u, v]) => [RX(u), 400 - v * K]))} color="#5a70a8" />
        {[[150, 372, 120], [470, 352, 150], [760, 366, 110], [1010, 340, 160], [1210, 372, 90]].map(([x, y, w], i) => <Poly key={i} pts={P([[x - w / 2, y], [x, y - 9], [x + w / 2, y + 2], [x + w * 0.2, y + 7], [x - w * 0.3, y + 6]])} color="#7c93c6" pos={[0, 0, 0.5]} />)}
        {RIDGE_TREES.map(([x, y, h], i) => (
          <group key={`t${i}`} position={[x, Y(y), 0.7]}>
            <Poly pts={[[-h * 0.3, 0], [h * 0.3, 0], [0, h * 0.7]]} color="#2f4e68" /><Poly pts={[[-h * 0.22, h * 0.4], [h * 0.22, h * 0.4], [0, h]]} color="#2f4e68" />
            <Poly pts={[[0, h], [h * 0.1, h * 0.66], [-h * 0.12, h * 0.6]]} color={n('#dfe6f6')} pos={[0, 0, 0.2]} />
          </group>
        ))}
        {[[610, 322, 20], [1020, 322, 30], [240, 330, 16], [760, 334, 13]].map(([x, y, w], i) => <group key={i} position={[x, Y(y + 8), 0.6]} scale={0.8}><Rock w={w * 1.6} k={i % 2 ? 1.2 : 0.9} flip={i % 2 === 0} /></group>)}
      </Far>
      <Far z={-110} k={10}>
        <Poly pts={P(FIELD.map(([u, v]) => [RX(u), 482 - v * K]))} color={S.field} />
        {/* the tree line at the far edge of the field: dark stands of pines with gaps between them */}
        {TREELINE.map(([x, y, h, k], i) => (
          <group key={`tl${i}`} position={[x, Y(y), 0.3]}>
            <Poly pts={[[-h * 0.3, -2], [h * 0.3, -2], [0, h * 0.72]]} color={k ? '#1d3150' : '#27405f'} /><Poly pts={[[-h * 0.2, h * 0.4], [h * 0.2, h * 0.4], [0, h]]} color={k ? '#1d3150' : '#27405f'} />
            {i % 4 === 0 ? <Poly pts={[[0, h], [h * 0.1, h * 0.7], [-h * 0.1, h * 0.64]]} color="#a3b8de" pos={[0, 0, 0.15]} /> : null}
          </group>
        ))}
        {/* three large wind drifts: a lit crest and the shade it throws below */}
        {BIG_DRIFTS.map(([x0, x1, y, r], i) => { const w = x1 - x0; return (
          <group key={`D${i}`}>
            <Poly pts={P([[x0, y + 6], [x0 + w * 0.18, y - r * 0.5], [x0 + w * 0.45, y - r], [x0 + w * 0.72, y - r * 0.55], [x1, y + 4], [x0 + w * 0.8, y + 16], [x0 + w * 0.5, y + 22], [x0 + w * 0.2, y + 15]])} color={S.shade} pos={[0, 0, 0.4]} />
            <Poly pts={P([[x0, y + 6], [x0 + w * 0.18, y - r * 0.5], [x0 + w * 0.45, y - r], [x0 + w * 0.72, y - r * 0.55], [x1, y + 4], [x0 + w * 0.7, y + 1], [x0 + w * 0.45, y - r * 0.35], [x0 + w * 0.2, y + 2]])} color={S.lit} pos={[0, 0, 0.5]} />
          </group>); })}
        {DRIFTS.map(([x, y, w], i) => <Poly key={`d${i}`} pts={P([[x - w / 2, y], [x - w * 0.2, y - 5], [x + w * 0.3, y - 4], [x + w / 2, y + 1], [x + w * 0.1, y + 3]])} color={i % 2 ? S.shade : S.far} pos={[0, 0, 0.6]} />)}
        {/* boulders, each its own size */}
        {[[205, 516, 44, 1], [690, 482, 30, 1.3], [1130, 520, 58, 0.9], [352, 498, 22, 1.2], [905, 512, 26, 1]].map(([x, y, w, k], i) => <group key={i} position={[x, Y(y), 0.8]}><Rock w={w} k={k} flip={i % 2 === 1} /></group>)}
        {/* the forest: clumps of pines at the edge of the field (kept clear of the tall tower's gap) */}
        {CLUMPS.slice().sort((a, b) => a[1] - b[1]).map(([x, y, h, wf, tr], i) => <group key={`p${i}`} position={[x, Y(y), 1 + i * 0.2]}><Pine H={h} wf={wf} tiers={tr} far /></group>)}
        {/* from film 339: the fire with its smoke thread, the snow it lights, and someone sitting at it */}
        {f >= FIRE_AT ? (
          <group position={[FIRE[0], Y(FIRE[1]), 5.5]}>
            {/* firelight lying on the snow: two flat warm tones (a lit ground patch, not a halo) */}
            <Disc r={78} sy={0.17} pos={[12, -3, 0]} color="#a3859a" seg={40} />
            <Disc r={46} sy={0.17} pos={[8, -3, 0.1]} color="#d6a383" seg={36} />
            <PopIn f={f} f0={FIRE_AT} puff={false}>
              {[-15, 13, -3].map((x, i) => <Poly key={i} pts={[[-6, 0], [-4, 5], [3, 6], [6, 0]]} color="#2b3156" pos={[x, -2 - (i === 2 ? 3 : 0), 0.25]} />)}
              <Rect w={40} h={6.5} pos={[0, 3, 0.3]} rot={[0, 0, deg(10)]} color="#2c2430" />
              <Rect w={40} h={6.5} pos={[0, 3, 0.4]} rot={[0, 0, deg(-12)]} color="#43343a" />
              <Flame pos={[0, 3, 0.6]} w={17} h={50} f={f} seed={4} colors={[COLORS.camp.fire[2], COLORS.camp.fire[1], COLORS.camp.fire[0]]} embers={3} />
            </PopIn>
            <Smoke pos={[2, 58, 0.2]} f={f - FIRE_AT + 30} count={4} size={8} rise={120} spread={18} tones={[n('#c3cde6', 1.1), n('#aab6d6', 1.1)]} seed={3} />
            <PopIn f={f} f0={FIRE_AT} pos={[50, -3, 0.5]} puff={false}>
              {/* seated figure in the green shawl, knees up, warm edge on the fire side */}
              <group position={[sh * 1 - lean * 3, 0, 0]} rotation={[0, 0, deg(lean * 8)]} scale={2.1}>
                <Poly pts={[[-8, 0], [-6.5, 9], [-1.5, 13], [4, 11.5], [8, 4.5], [9.5, 0]]} color={COLORS.tinyFigure.body} />
                <Poly pts={[[-8, 0], [-13.5, 0], [-12, 4.2], [-7.3, 5]]} color={COLORS.tinyFigure.body} />
                <Poly pts={[[-8, 0], [-6.5, 9], [-1.5, 13], [-4.6, 8.5], [-6.4, 0]]} color="#c9a05a" pos={[0, 0, 0.1]} />
                <Disc r={4.6} pos={[-0.5 - lean * 0.6, 15.2 + Math.max(0, sh) * 0.8, 0.3]} color={COLORS.tinyFigure.head} seg={20} />
                <Disc r={4.6} sy={0.9} pos={[-1.6 - lean * 0.6, 15.2 + Math.max(0, sh) * 0.8, 0.2]} color="#d9a877" seg={20} />
              </group>
            </PopIn>
          </group>
        ) : null}
      </Far>
      {/* GREEN HILL BAND the towers stand on: flat greens, snow patches, bushes, rocks, the path to the tall tower's door */}
      <Far z={-50} k={4}>
        <Poly pts={P([...CREST, [1340, 780], [-60, 780]])} color={n(G.hill)} />
        <Poly pts={P([...CREST, ...CREST.slice().reverse().map(([x, y], i) => [x, y + 9 + (i % 2) * 8] as [number, number])])} color={n(G.light, 1.1)} pos={[0, 0, 0.3]} />
        <Poly pts={P([[-60, 646], [150, 630], [330, 652], [560, 636], [760, 656], [980, 634], [1160, 650], [1340, 630], [1340, 780], [-60, 780]])} color={n(G.dark)} pos={[0, 0, 0.5]} />
        <Poly pts={P([[567, 594], [583, 594], [588, 612], [612, 632], [628, 652], [598, 652], [584, 634], [562, 614]])} color={n(COLORS.camp.path, 0.9)} pos={[0, 0, 0.7]} />
        {PATCHES.map(([x, y, w, h, sk], i) => (
          <group key={i} position={[x, Y(y), 0.8]}>
            <Poly pts={[[-w / 2, 0], [-w * 0.3, h * 0.55], [w * 0.05 + sk, h * 0.7], [w * 0.36, h * 0.4], [w / 2, -h * 0.1], [w * 0.22, -h * 0.55], [-w * 0.2 - sk, -h * 0.5]]} color={S.shade} />
            <Poly pts={[[-w * 0.44, h * 0.1], [-w * 0.28, h * 0.5], [w * 0.05 + sk, h * 0.62], [w * 0.3, h * 0.35], [w * 0.1, -h * 0.1], [-w * 0.2, -h * 0.15]]} color={S.field} pos={[0, 0, 0.2]} />
          </group>
        ))}
        {[[250, 600], [1010, 596], [118, 578], [1178, 572]].map(([x, y], i) => (
          <group key={i} position={[x, Y(y), 1]} scale={[0.8 + (i % 3) * 0.25, 0.8 + (i % 2) * 0.3, 1]}>
            <Disc r={13} pos={[-11, 4, 0]} color={n(G.dark, 0.85)} seg={20} /><Disc r={17} pos={[4, 7, 0.1]} color={n(G.dark, 0.85)} seg={20} /><Disc r={11} pos={[20, 3, 0.2]} color={n(G.dark, 0.85)} seg={20} />
            <Disc r={15} sy={0.5} pos={[2, 17, 0.3]} color={S.field} seg={20} /><Rect w={50} h={8} pos={[4, -3, 0.4]} color={n(G.dark, 0.85)} />
          </group>
        ))}
        {TUFTS.filter((_, i) => i % 2 === 0).map(([x, y, r, k], i) => (k === 2
          ? <Poly key={`g${i}`} pts={[[-r * 0.9, 0], [-r * 0.4, r * 0.7], [r * 0.5, r * 0.8], [r, 0]]} color={n('#8a8fb5')} pos={[x, Y(y), 0.9]} />
          : <Poly key={`g${i}`} pts={[[-r, 0], [-r * 0.75, r * 1.5], [-r * 0.3, 0.2 * r], [0, r * 2], [r * 0.35, 0.2 * r], [r * 0.8, r * 1.4], [r, 0]]} color={n(y > 650 ? (k ? G.hill : G.light) : (k ? G.dark : G.light), 1.1)} pos={[x, Y(y), 0.9]} />))}
        {/* a rock outcrop beside the tall tower, and loose boulders */}
        <group position={[752, Y(618), 1]}><Rock w={112} k={1.1} /><group position={[52, -4, 0.4]}><Rock w={52} k={0.9} flip /></group><group position={[-58, -6, 0.4]}><Rock w={34} k={1.1} /></group></group>
        {[[505, 618, 26, 1], [900, 630, 38, 0.8], [160, 640, 30, 1.2], [1080, 640, 22, 1]].map(([x, y, w, k], i) => <group key={i} position={[x, Y(y), 1]}><Rock w={w} k={k} flip={i % 2 === 0} /></group>)}
      </Far>
      {/* FAR SNOW LAYER, rising behind the towers */}
      <Layer m={m} z={-25}><RisingSnow f={f} n={SNOW.count / 2} r={SNOW.px720[0] / 2 + 0.25} speed={1.5} color={n(SNOW.colorFar, 1.25)} seed={21} /></Layer>
      {/* TOWERS: windows off (4, 6, 8), then pop out tallest first (16, 22, 28) */}
      <Layer m={m} z={0}>
        {S6_TOWERS.map((tw, i) => {
          const q = f - tw.pop, H = tw.h + tw.w * 2.55;
          const sc: [number, number, number] | null = q < 0 ? [1, 1, 1] : q < 2 ? [1.1, 0.93, 1] : q < 4 ? [0.62, 1.07, 1] : null;
          return (
            <group key={i} position={[tw.x, Y(tw.base), i * 3]}>
              {sc ? <group scale={sc}><Tower w={tw.w} h={tw.h} c={tw.c} lit={f < tw.off} f={f} flag={i === 0} side={i === 1 ? -1 : 1} /></group> : null}
              {[0.12, 0.45, 0.8].map((k, j) => <Puff key={j} pos={[(j - 1) * tw.w * 0.25, H * k, 6 + j]} f={f} f0={tw.pop + 2 + (j % 2) * 2} dur={10} r={tw.w * (1.05 - j * 0.15)} count={7} color={j === 1 ? n('#d5daf4', 1.2) : CL.top} seed={i * 5 + j} />)}
            </group>
          );
        })}
        {S6_PINES.map((p, i) => <PopIn key={i} f={f} f0={p.at} pos={[p.x, Y(p.base), 12 + i]} puff={CL.top} puffR={p.H * 0.2}><Pine H={p.H} tiers={i === 1 ? 4 : 5} wf={i === 1 ? 1.1 : 1} /></PopIn>)}
      </Layer>
      {/* FORE HILL: the near shoulder, darkest green, with snow lying in its hollows, dead grass and stones */}
      <Layer m={m} z={12}>
        <Poly pts={P([[-60, 690], [180, 672], [420, 694], [640, 680], [860, 698], [1080, 676], [1340, 692], [1340, 790], [-60, 790]])} color={n(G.deep, 0.9)} />
        {[[330, 702, 150, 14, 6], [1010, 706, 190, 16, -8], [690, 712, 90, 9, 4]].map(([x, y, w, h, sk], i) => (
          <group key={i} position={[x, Y(y), 0.4]}>
            <Poly pts={[[-w / 2, 0], [-w * 0.3, h * 0.55], [w * 0.05 + sk, h * 0.7], [w * 0.36, h * 0.4], [w / 2, -h * 0.1], [w * 0.22, -h * 0.55], [-w * 0.2 - sk, -h * 0.5]]} color={S.far} />
          </group>
        ))}
        {[[120, 684, 46], [860, 700, 34], [1210, 690, 60], [520, 696, 28]].map(([x, y, w], i) => <group key={`r${i}`} position={[x, Y(y), 0.6]}><Rock w={w} k={i % 2 ? 1.1 : 0.85} flip={i % 2 === 0} /></group>)}
        {[60, 240, 450, 600, 780, 960, 1150, 1290].map((x, i) => <Poly key={`w${i}`} pts={[[-7, 0], [-10, 16], [-3, 3], [0, 22], [3, 3], [9, 14], [7, 0]]} color={n(G.light, 1.2)} pos={[x + (i % 3) * 14, Y(690 + (i % 2) * 8), 0.7]} />)}
      </Layer>
      {/* NEAR SNOW LAYER, rising in front of everything */}
      <Layer m={m} z={45}><RisingSnow f={f} n={SNOW.count / 2} r={SNOW.px720[1] / 2} speed={2.5} color={n(SNOW.color, 1.35)} seed={5} /></Layer>
    </Stage>
  );
};

export const S6_SHOT: KitShot = {id: M.comp, len: LEN, bg: COLORS.hall.sky, Scene, liveness: liveness('insert', [
  {name: 'camera', kind: 'camera', note: 'push 3 %/s at the tallest tower base (off the lens axis), 5-band parallax'},
  {name: 'rising snow, 2 layers', kind: 'ambient', family: 'weather', note: 'the film snow run upward'},
  {name: 'cloud edge drifting right to left', kind: 'ambient', family: 'sky'},
  {name: 'hall-green flag on the tallest roof', kind: 'ambient', family: 'cloth', note: 'until the tower pops out at 16'},
  {name: 'fire', kind: 'ambient', family: 'flame', note: 'from 34, flat, no glow; a flat lit patch on the snow'},
  {name: 'smoke thread', kind: 'ambient', family: 'smoke', note: 'from 34'},
  {name: 'tiny seated figure', kind: 'ambient', family: 'extras', note: 'from 34, shifts on twos, leans to the fire at 40'},
  {name: 'tower windows switch off', kind: 'state', beats: S6_TOWERS.map((t) => t.off), note: 'film 309, 311, 313'},
  {name: 'towers pop out', kind: 'effect', beats: S6_TOWERS.map((t) => t.pop), note: 'film 321, 327, 333 with flat puffs'},
  {name: 'pines pop in', kind: 'effect', beats: S6_PINES.map((p) => p.at), note: 'film 337, 339, 341'},
  {name: 'fire and figure appear', kind: 'state', beats: [FIRE_AT], note: 'film 339 (the design fallback for 343)'},
])};
