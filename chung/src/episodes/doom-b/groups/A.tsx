import React from 'react';
import {Stage, KitShot, liveness, camPush, camPull, camTruck, camHold, idle, Poly, Rect, Disc, Stroke, Diamond, track, trackStep, prog, twos, deg} from '../../../kit';
import type {V3, Pt, CamPose} from '../../../kit';
import {Puppet, act, mix, hop, beatFrames, lintBeats, puppetPoint, singlePicture} from '../../../puppet';
import type {Beat} from '../../../puppet';
import {DOOM_FACE, DoomBeat} from '../../../chars/_lib/doom';
import {DOOM_A as DOOM} from './A - Throne hall/doomA';
import {SHOT, SCALE, SNOW, COLORS} from '../shared';
import {Hall, HALL, PAL, Column, BoxShade, FigureShade} from './A - Throne hall/hall';
import {HallClouds, Snow, SnowLayer, CloudSpot} from './A - Throne hall/weather';
import {MaskClose, S1_CAM} from './A - Throne hall/maskClose';

/* Build group A: Throne hall (S1-S5, film frames 0-305). No new art: the ruler is the DOOM rig (front and back view),
 * the queen one picture, everything else is drawn in code. The set lives in ./A - Throne hall/ (a kit copy of the
 * hub with the finish of bible section 8). Beats below are frames INSIDE the shot; the design's film frames are in
 * the notes. Design beats on odd frames are moved to the even frame before them (drawings change on twos). */

const NIGHT = 'nightExterior' as const;
/** flake diameters in px of the 720p frame, far and near layer (larger than shared SNOW.px720 = [2.67, 4.67], which did not read: see the report) */
const FLAKE_PX: [number, number] = [5.5, 10];
const H_R = SCALE.rulerWorldH, H_Q = SCALE.queenWorldH;

/** The queen in white: one picture (public/queen/q-1.png) with blink lids. */
const QUEEN = singlePicture({name: 'queen', skin: '#f0c5a3', src: 'doom-b/A/queen/q-1.png', size: [741, 1491], eyes: [{at: [285, 331], r: [93, 84]}, {at: [462, 331], r: [93, 84]}]});
type QueenBeat = Beat;
const QSC = 1491 / 520;
const guard = (name: string, bad: string[]) => { if (bad.length) throw new Error(`doom-b ${name}: ${bad.join('; ')}`); };

/** where the hall's people and things stand in this episode (world units) */
const RING = {name: 'sun ring turning', kind: 'ambient' as const, family: 'mechanical' as const, note: 'slow turn on twos, 0.3 degrees per frame'};
const POS = {
  rulerLane: [HALL.laneX, 0, 1.0] as V3,          // on the lane below the steps (S3, S4, S5)
  queen: [6.0, HALL.daisY, -4.6] as V3,            // on the dais, right of the small throne
  rulerS2: [0.9, 0, 5.7] as V3,                    // nearer the camera on the lane (S2)
};
/** the three conjured clouds over the hall (shared.ts CLOUDS: pop at film 167 / 169 / 171) */
const CLOUD_SPOTS: CloudSpot[] = [{pos: [-8.6, 13.4, -26], s: 1.55}, {pos: [0.2, 15.0, -28], s: 1.95}, {pos: [9.0, 13.2, -27], s: 1.45}];
const CLOUD_BASE: [number, number] = [12.2, -27];   // y of the cloud undersides and their depth: the snow starts on this line

/** a snow layer at depth z for a camera: covers the frame (with margin), flakes of `px` diameter falling `pxPerSec` */
const snowLayer = (cam: CamPose, z: number, o: {px: number; pxPerSec: number; bottom?: number; top?: number; widen?: number}): SnowLayer => {
  const d = [cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]], t = (z - cam.pos[2]) / d[2];
  const cx = cam.pos[0] + d[0] * t, cy = cam.pos[1] + d[1] * t, dist = Math.hypot(d[0], d[1], d[2]) * t;
  const hh = dist * Math.tan(deg(cam.fov / 2)), hw = hh * (16 / 9) * (o.widen ?? 1.2), ppu = 360 / hh;
  const ray = cam.pos[1] + (CLOUD_BASE[0] - cam.pos[1]) * ((z - cam.pos[2]) / (CLOUD_BASE[1] - cam.pos[2]));
  return {x0: cx - hw, x1: cx + hw, top: o.top ?? Math.min(ray, cy + hh * 1.1), bottom: o.bottom ?? cy - hh * 1.1, z, r: o.px / 2 / ppu, speed: o.pxPerSec / 24 / ppu};
};

// =====================================================================================================================
// S1  film 0-60. Extreme close on the screen-left eye slit. Anchor 'scarred' @36.
// =====================================================================================================================
const S1_LEN = SHOT.S1.len;
// push 3 %/s; the small truck keeps the slit (left of centre) as the still point of the push
const s1Cam = camTruck(camPush(S1_CAM, {pctPerSec: 3}), {pctPerSec: 0.63, dir: -1});
const S1Scene: React.FC<{f: number; t: number}> = ({f}) => (
  <Stage cam={s1Cam} f={f} len={S1_LEN} mood={NIGHT} bg={PAL.sky} name={SHOT.S1.comp}>
    <MaskClose f={f} />
  </Stage>
);
export const S1: KitShot = {id: SHOT.S1.comp, len: S1_LEN, bg: PAL.sky, Scene: S1Scene, liveness: liveness('close', [
  {name: 'camera', kind: 'camera', note: 'push 3 %/s, still point on the screen-left slit'},
  {name: 'ruler eye', kind: 'puppet', beats: [10, 26, 48, 52], note: 'pupil snap 10, head turn 26 (design 27), lid drop and brow step 48, pupil dart 52'},
  {name: 'hood edge', kind: 'ambient', family: 'cloth', note: 'sways on twos; follows the turn 4 f late'},
  {name: 'lantern flame far right', kind: 'ambient', family: 'flame', note: 'flat, no halo'},
  {name: 'light inside the slit', kind: 'state', beats: [36], note: 'shadow to lit, 4 drawings over 8 f, clipped to the slit'},
])};

// =====================================================================================================================
// S2  film 60-132. Medium: he mends the cracked column with one thought, then stops his own hand. Anchor 'single' @84 (24).
// =====================================================================================================================
const S2_LEN = SHOT.S2.len;
// floor under his feet (the first build cut the boots on the frame edge): the camera looks level from chest height
const S2_BASE: CamPose = {pos: [2.56, 1.84, 15.1], look: [2.56, 1.84, -4.0], fov: 28};
// a real move: push 1.3 %/s on the space between him and the column, with a slow slide to the left (it keeps the near column in frame while the push sweeps it outward), so the near
// column edge at the left frame edge visibly travels against the scene on every frame
const s2Cam = camTruck(camPush(S2_BASE, {pctPerSec: 1.3}), {pctPerSec: 0.22, dir: -1});
/** the cracked column of this shot: a hall column standing on the floor before the dais, in the right third */
const S2_COL: V3 = [6.6, 0, 2.3];
const S2_RULER: DoomBeat[] = [
  {f: 0, note: 'neutral, eyes front, hands at his sides', ...DOOM_FACE.neutral, handL: 'fist', handR: 'fist'},
  {f: 4, note: "film 65 'fix': pupils dart to the cracked column, head tilts 3 degrees toward it", px: 0.9, turn: 0.35, headTilt: 3},
  {f: 24, note: "film 84 'single': one brow lifts, nothing else", browYR: 9, browR: -8},
  {f: 38, note: 'film 98 (design 100): eyes front, head level, brow back', px: 0, turn: 0, headTilt: 0, browYR: 1, browR: 2},
  {f: 44, note: "film 104-114 'but'@109: his open hand rises along the OUTSIDE of his body, elbow out, palm to his face; the head turns a little to it; fingertips stop a hand's width from the jaw edge of the mask", shL: 106, elL: 80, wrL: 64, handL: 'open', turn: -0.3, headTilt: -3, px: -0.9, py: -0.5, lean: -1},
  {f: 54, note: 'film 114-120: held, 6 f; only the eyes close a little (he will not do it)', eyeOpen: 0.7, browL: -8, browR: -8},
  {f: 60, note: "film 120 'hasn't' (design 119): the hand drops the way it came", shL: 0, elL: 0, wrL: 0, turn: 0, headTilt: 0, lean: 0, py: -0.3, px: 0},
  {f: 68, note: 'film 128 (design 127): fist at his side, face sad, pupils low', handL: 'fist', ...DOOM_FACE.sad, py: -0.7},
];
const s2Hem = (f: number) => ({cloth: idle(f, 71, 4) * 2.4});   // the cloak hem sways on twos
const s2Ruler = (f: number) => mix(act(S2_RULER, f, {rig: DOOM, seed: 2}), s2Hem(f));
/** the crack on the screen-right column: a jagged path from its top end down to the base, plus two side branches */
const S2_FORE_X = -0.1;
const CRACK: Pt[] = [[0.06, 2.05], [-0.1, 1.72], [0.12, 1.42], [-0.04, 1.12], [0.16, 0.82], [-0.12, 0.5], [0.05, 0.24], [-0.06, 0]];
const S2Scene: React.FC<{f: number; t: number}> = ({f}) => {
  guard('S2', lintBeats({ruler: {beats: S2_RULER, rig: DOOM, seed: 2, extra: s2Hem}}, S2_LEN));
  // film 89 'thought' (in-shot 28): the crack zips shut bottom to top in 4 drawings; chips fly back up; spark 28-36
  const shut = f < 28 ? 0 : prog(f, 28, 8), col = S2_COL, face = col[2] + HALL.colW / 2 + 0.03, y0 = col[1] + 0.75;
  const chip = f < 28 ? 0 : prog(f, 28, 6);
  return (
    <Stage cam={s2Cam} f={f} len={S2_LEN} mood={NIGHT} bg={PAL.sky} name={SHOT.S2.comp}>
      <Hall f={f} stars={110} starSeed={9} starBox={[30, 22, 110, 40]} fore={[{x: S2_FORE_X, z: 10.5}]} noColR winOff={(tw, w) => (tw === 8 && (w === 0 || w === 3 || (w === 1 && f >= 40)))} />
      <Column pos={S2_COL} banner={false} />
      <BoxShade x={S2_COL[0]} z={S2_COL[2]} w={2.13} d={2.13} len={3.6} y={0.022} />
      <FigureShade pos={POS.rulerS2} r={1.0} />
      {shut < 1 ? (
        <group position={[col[0], y0, face]}>
          <Stroke pts={CRACK} width={0.1} taper={0.35} p={1 - shut} color="#4a4350" />
          <Stroke pts={CRACK.map(([x, y]) => [x + 0.035, y] as Pt)} width={0.035} taper={0.5} p={1 - shut} color="#9d9484" pos={[0, 0, 0.004]} />
          {shut < 0.5 ? <Stroke pts={[[0.16, 0.82], [0.34, 0.66], [0.3, 0.46]]} width={0.05} color="#4a4350" /> : null}
          {shut < 0.75 ? <Stroke pts={[[-0.1, 1.72], [-0.3, 1.5]]} width={0.05} color="#4a4350" /> : null}
          {shut < 0.3 ? <Poly pts={[[-0.14, 0], [0.02, 0.2], [0.14, 0]]} color="#4a4350" /> : null}
        </group>
      ) : null}
      {/* where the crack was: a pale mended seam that is gone in two drawings (flat, no glow) */}
      {f >= 36 && f < 40 ? <group position={[col[0], y0, face]}><Stroke pts={CRACK} width={f < 38 ? 0.05 : 0.028} taper={0.4} color={f < 38 ? '#efe6c4' : '#d3ccb6'} /></group> : null}
      {/* two fallen chips on the floor by the column; they fly back up into the crack */}
      {chip < 1 ? ([[0.62, 0.16, 0.2, 0.5], [-0.48, 0.12, 0.16, 1.1]] as const).map(([x, y, s, ty], i) => (
        <group key={i} position={[col[0] + x * (1 - chip), y0 - 0.75 + y + (ty + 0.75 - y) * chip, face + 0.4 * (1 - chip) + 0.02]} rotation={[0, 0, chip * 3 * (i ? -1 : 1)]} scale={1 - chip * 0.5}>
          <Poly pts={[[-s, -s * 0.5], [-s * 0.3, s * 0.7], [s, s * 0.3], [s * 0.6, -s * 0.6]]} color={PAL.col} />
          <Poly pts={[[-s, -s * 0.5], [s * 0.6, -s * 0.6], [s * 0.2, -s * 0.1]]} color={PAL.colSide} pos={[0, 0, 0.004]} />
        </group>
      )) : null}
      {f >= 28 && f < 36 ? (
        <group position={[col[0] + 0.06, y0 + 2.05, face + 0.05]} scale={[1, 0.62, 0.86, 0.5][Math.floor((f - 28) / 2)] ?? 1} rotation={[0, 0, twos(f) * 0.2]}>
          {[0, 60, 120].map((a) => <Poly key={a} pts={[[0, 0.52], [0.1, 0], [0, -0.52], [-0.1, 0]]} color={PAL.goldL} rot={[0, 0, deg(a)]} />)}
          <Disc r={0.15} color="#fff3c4" pos={[0, 0, 0.01]} />
        </group>
      ) : null}
      <Puppet rig={DOOM} pose={s2Ruler} height={H_R} pos={POS.rulerS2} />
    </Stage>
  );
};
export const S2: KitShot = {id: SHOT.S2.comp, len: S2_LEN, bg: PAL.sky, Scene: S2Scene, liveness: liveness('medium', [
  {name: 'camera', kind: 'camera', note: 'push 1.3 %/s with a 0.22 %/s slide left; the left foreground column edge slides against the scene'},
  {name: 'ruler', kind: 'puppet', beats: beatFrames(S2_RULER), note: 'film 65 pupils and tilt, 84 brow, 98 back, 104-114 hand toward his jaw, 114 held, 120 drop, 128 fist and sad'},
  {name: 'lantern flame', kind: 'ambient', family: 'flame'},
  {name: 'small throne drape edge', kind: 'ambient', family: 'cloth'}, RING,
  {name: 'crack closes, chips fly back, spark', kind: 'effect', beats: [28], note: 'film 88-96 (design 89-97); cream-gold flat spark, no glow; a pale seam fades in two drawings after it (96-100)'},
  {name: 'tower window off', kind: 'state', beats: [40], note: 'film 100 (design 104; moved off the frame his hand starts on), flat swap'},
])};

// =====================================================================================================================
// S3  film 132-194. Wide: a bored flick of the hand calls clouds, then snow. Anchor 'man' @156 (24).
// =====================================================================================================================
const S3_LEN = SHOT.S3.len;
const S3_BASE: CamPose = {pos: [0.64, 3.3, 18.35], look: [0.64, 3.8, 4.95], fov: 33.2};
const s3Cam = camTruck(S3_BASE, {pctPerSec: 2, dir: 1, ease: true, len: S3_LEN});
const S3_RULER: DoomBeat[] = [
  {f: 0, note: 'head down, fists at his sides (carried from S2)', ...DOOM_FACE.sad, up: -0.7, py: -0.7, headY: -5, headTilt: 3, handL: 'fist', handR: 'fist'},
  {f: 24, note: "film 156 'man': head and shoulders lift to the sky", up: 1, py: 1, headY: 5, headTilt: -2, squash: -0.04, ...DOOM_FACE.neutral, n: 6},   // the head tilts back INSIDE the hood (5 px), the whole figure stretches 4 % (shoulders up): no gap at the collar
  {f: 34, note: "film 167 'power': forearm flicks out sideways from the hip, hand open", shL: 12, elL: 44, wrL: 14, handL: 'open'},
  {f: 40, note: 'the hand returns (down by film 177)', shL: 0, elL: 0, wrL: 0},
  {f: 46, note: "film 179 'anything': head drops back to the floor", up: -0.7, py: -0.7, headY: -5, headTilt: 3, squash: 0, handL: 'fist', ...DOOM_FACE.sad, n: 6},
];
const S3_QUEEN: QueenBeat[] = [
  {f: 0, note: 'stands by the small throne'},
  {f: 10, note: "film 143 'why': tilts toward him", lean: -4},
  {f: 42, note: 'film 172-174: startled hop as the clouds pop in (no blink: the one-picture lids have no lid line and left her without eyes)', lean: -1},
  {f: 54, note: 'film 186: leans back to watch the snow, small sink', lean: 3.5, squash: 0.03},
];
const s3Ruler = (f: number) => act(S3_RULER, f, {rig: DOOM, seed: 3});
const s3Queen = (f: number) => mix(act(S3_QUEEN, f, {rig: QUEEN, seed: 5}), hop(f, 40, {height: 26, dur: 6, sc: QSC}));
const S3Scene: React.FC<{f: number; t: number}> = ({f}) => {
  guard('S3', lintBeats({ruler: {beats: S3_RULER, rig: DOOM, seed: 3}, queen: {beats: S3_QUEEN, rig: QUEEN, seed: 5, extra: (g) => hop(g, 40, {height: 26, dur: 6, sc: QSC})}}, S3_LEN));
  const F = SHOT.S3.f0 + f, cam = S3_BASE;
  return (
    <Stage cam={s3Cam} f={f} len={S3_LEN} mood={NIGHT} bg={PAL.sky} name={SHOT.S3.comp}>
      <Hall f={f} stars={150} fore={[{x: 6.75, z: 8}]} />
      <HallClouds F={F} spots={CLOUD_SPOTS} pop />
      <Snow F={F} emit count={72} near={snowLayer(cam, 4, {px: FLAKE_PX[1], pxPerSec: 170, bottom: 0.05})} far={snowLayer(cam, -3, {px: FLAKE_PX[0], pxPerSec: 115, bottom: 0.95})} />
      <FigureShade pos={POS.rulerLane} r={1.2} />
      <FigureShade pos={POS.queen} r={0.8} />
      <Puppet rig={DOOM} pose={s3Ruler} height={H_R} pos={POS.rulerLane} />
      <Puppet rig={QUEEN} pose={s3Queen} height={H_Q} pos={POS.queen} />
    </Stage>
  );
};
export const S3: KitShot = {id: SHOT.S3.comp, len: S3_LEN, bg: PAL.sky, Scene: S3Scene, liveness: liveness('wideInterior', [
  {name: 'camera', kind: 'camera', note: 'truck right 2 %/s, eased, past the column edge at right'},
  {name: 'ruler', kind: 'puppet', beats: beatFrames(S3_RULER), note: 'film 156 head and shoulders lift, 166 flick (design 167), 172 hand back, 178 head drop (design 179)'},
  {name: 'queen', kind: 'puppet', beats: [10, 42, 54], note: 'film 142 tilt (design 143), 172 hop, 186 looks up'},
  {name: 'lantern flames', kind: 'ambient', family: 'flame'},
  {name: 'armillary rings', kind: 'ambient', family: 'mechanical'}, RING,
  {name: 'clouds drifting right', kind: 'ambient', family: 'sky'},
  {name: 'snow', kind: 'ambient', family: 'weather', note: 'from film 176'},
  {name: 'green throne drape', kind: 'ambient', family: 'cloth'},
  {name: 'clouds pop in', kind: 'effect', beats: [35, 37, 39], note: 'film 167, 169, 171, each with a puff'},
  {name: 'snow starts', kind: 'state', beats: [44], note: 'film 176-180: the band under the clouds fills from the top in three drawings, then falls (design 179)'},
])};

// =====================================================================================================================
// S4  film 194-256. Close on the masked face: hate, then grief. Anchor 'one' @204 (10), 'hates' @221 (26).
// =====================================================================================================================
const S4_LEN = SHOT.S4.len, S4_YAW = 22;
const S4_BASE: CamPose = {pos: [-3.18, 1.83, 5.6], look: [-1.31, 2.33, 0.955], fov: 16};
const s4Cam = camPush(S4_BASE, {pctPerSec: 2});
const S4_RULER: DoomBeat[] = [
  {f: 0, note: "slits half closed, pupils low (carry-over of 'sad')", ...DOOM_FACE.sad, eyeOpen: 0.45, py: -0.6, handL: 'fist', handR: 'fist'},
  {f: 4, note: 'film 198: lids open fully', eyeOpen: 1},
  {f: 10, note: "film 204 'one thing': pupils slide down-left toward his own cheek and hold", px: -0.8, py: -1},
  {f: 26, note: "film 220 'hates' (design 221): snap to angry, slits squint, head jolts, shoulders rise", eyeSlant: 13, eyeOpen: 0.5, browL: 22, browR: 22, browYL: -4, browYR: -4, headY: 3},   // only brows, slits, pupils and a 3 px jolt: the mask keeps its size and outline
  {f: 36, note: "film 230 'most' (design 231): brows let go to sad, pupils drop, head lowers", ...DOOM_FACE.sad, eyeOpen: 0.8, px: -0.3, py: -1, headY: -4},
];
const s4Ruler = (f: number) => act(S4_RULER, f, {rig: DOOM, seed: 4});
/** the one snowflake: falls in, lands on the cheek plate below the screen-left slit at in-shot 14, sits, slides off from 46 (mask-piece pixels) */
const FLAKE: [number, Pt | null][] = [[0, null], [8, [170, 36]], [10, [166, 84]], [12, [163, 124]], [14, [161, 152]], [46, [160, 166]], [48, [158, 184]], [50, [156, 202]], [52, [155, 218]], [54, [155, 246]], [56, [155, 280]], [58, null]];
/** the landed flake: a flat six-point shape about 17 px across (0.034 world units here). It squashes for one drawing
 *  as it lands (14-15), sits, and from 46 slides to the jaw as a short streak. */
const CheekFlake: React.FC<{pos: V3; f: number}> = ({pos, f}) => {
  const r = 0.017, land = f >= 14 && f < 16, slide = f >= 46, fall = f < 14;
  return (
    <group position={pos}>
      {slide || fall ? <Rect w={r * 0.5} h={r * (slide ? 3.2 : 2.2)} color={SNOW.colorFar} pos={[0.002, r * (slide ? 1.9 : 1.5), -0.0005]} /> : null}
      <group scale={[land ? 1.35 : 1, land ? 0.6 : slide ? 1.15 : 1, 1]} rotation={[0, 0, 0.26]}>
        {[0, 60, 120].map((a) => <Rect key={a} w={r * 0.44} h={r * 2} color={SNOW.color} rot={[0, 0, deg(a)]} />)}
        <Disc r={r * 0.52} color="#f7f9fd" pos={[0, 0, 0.0006]} seg={6} />
      </group>
    </group>
  );
};
const S4Scene: React.FC<{f: number; t: number}> = ({f}) => {
  guard('S4', lintBeats({ruler: {beats: S4_RULER, rig: DOOM, seed: 4}}, S4_LEN));
  const F = SHOT.S4.f0 + f, cam = S4_BASE, fl = trackStep(f, FLAKE);
  const flake = fl ? puppetPoint(DOOM, s4Ruler(f), 'mask', fl, H_R, [0, 0, 0]) : null;
  return (
    <Stage cam={s4Cam} f={f} len={S4_LEN} mood={NIGHT} bg={PAL.sky} name={SHOT.S4.comp}>
      <Hall f={f} stars={60} starSeed={12} />
      <HallClouds F={F} spots={CLOUD_SPOTS} />
      <Snow F={F} count={70} near={snowLayer(cam, -1.5, {px: 6, pxPerSec: 110, widen: 1.5})} far={snowLayer(cam, -6, {px: 3.6, pxPerSec: 70, widen: 1.5})} />
      {/* the puppet is a flat card: it is turned to face this camera, which looks across the hall at an angle */}
      <group position={POS.rulerLane} rotation={[0, -deg(S4_YAW), 0]}>
        <Puppet rig={DOOM} pose={s4Ruler} height={H_R} pos={[0, 0, 0]} shadow={false} />
        {flake ? <CheekFlake pos={flake} f={f} /> : null}
      </group>
    </Stage>
  );
};
export const S4: KitShot = {id: SHOT.S4.comp, len: S4_LEN, bg: PAL.sky, Scene: S4Scene, liveness: liveness('close', [
  {name: 'camera', kind: 'camera', note: 'push 2 %/s'},
  {name: 'ruler face', kind: 'puppet', beats: beatFrames(S4_RULER), note: 'film 198 lids open, 204 pupils to his cheek, 220 angry snap, 230 sad'},
  {name: 'snow, 2 layers', kind: 'ambient', family: 'weather'},
  {name: 'lantern flame behind', kind: 'ambient', family: 'flame'},
  {name: 'hood and cape', kind: 'ambient', family: 'cloth', note: 'follow the head one drawing late'},
  {name: 'landed snowflake', kind: 'effect', beats: [14, 46], note: 'film 208 lands, 240 slides off the jaw'},
])};

// =====================================================================================================================
// S5  film 256-305. Axial wide pull-back: lanterns out, snow hangs, then rises. Anchor 'leave' @280 (24).
// =====================================================================================================================
const S5_LEN = SHOT.S5.len;
const S5_BASE: CamPose = {pos: [HALL.laneX, 3.3, 21.7], look: [HALL.laneX, 3.9, 1.0], fov: 32.5};
/** the two foreground columns stand just outside the first frame and 4.7 units from the camera, so the 3 %/s pull brings each about 10 % into frame by the cut */
const S5_FORE = {dx: 3.62, z: 17};
const COOL_TINT = '#c6cde6';
const s5Cam = camPull(S5_BASE, {pctPerSec: 3});
const S5_RULER: DoomBeat[] = [
  {f: 0, note: 'back view, still; hem sways', view: 'back'},
  {f: 24, note: "film 280 'leave': the HOOD (its own piece) turns 9 degrees toward the peaks at screen-left, the shoulders shift after it; 3 drawings on twos", headTilt: -9, headX: -26, lean: -1.5, bodyX: -16, n: 6},
];
const S5_QUEEN: QueenBeat[] = [
  {f: 0, note: 'small white figure by the small throne'},
  {f: 30, note: 'film 286: tilts up at the hanging snow (no blink: see S3)', lean: 3.5, squash: -0.02},
];
const s5Ruler = (f: number) => act(S5_RULER, f, {rig: DOOM, seed: 6});
const s5Queen = (f: number) => act(S5_QUEEN, f, {rig: QUEEN, seed: 7});
const S5Scene: React.FC<{f: number; t: number}> = ({f}) => {
  guard('S5', lintBeats({ruler: {beats: S5_RULER, rig: DOOM, seed: 6}, queen: {beats: S5_QUEEN, rig: QUEEN, seed: 7}}, S5_LEN));
  const F = SHOT.S5.f0 + f, cam = S5_BASE;
  // film 259 'that': left lantern off; 266: right lantern off and the floor drops one cool step (flat swaps)
  const left = f < 3, right = f < 10;
  return (
    <Stage cam={s5Cam} f={f} len={S5_LEN} mood={NIGHT} bg={PAL.sky} name={SHOT.S5.comp}>
      <Hall f={f} stars={150} lanterns={[left, right]} cool={!right} fore={[{x: HALL.laneX - S5_FORE.dx, z: S5_FORE.z}, {x: HALL.laneX + S5_FORE.dx, z: S5_FORE.z}]} />
      <HallClouds F={F} spots={CLOUD_SPOTS} />
      {/* no flake of either layer in front of the two figures (a hanging flake there reads as a spot on them) */}
      <Snow F={F} count={96} near={{...snowLayer(cam, 5, {px: FLAKE_PX[1], pxPerSec: 150, bottom: 0.05, widen: 1.3}), skip: [[HALL.laneX - 0.85, HALL.laneX + 0.85], [2.95, 3.85]]}}
        far={{...snowLayer(cam, -3, {px: FLAKE_PX[0], pxPerSec: 100, bottom: 0.95, widen: 1.3}), skip: [[5.0, 6.2]]}} />
      <FigureShade pos={POS.rulerLane} r={1.2} k={right ? 1 : 0.8} />
      <FigureShade pos={POS.queen} r={0.8} k={right ? 1 : 0.8} />
      <Puppet rig={DOOM} pose={s5Ruler} height={H_R} pos={POS.rulerLane} tint={right ? undefined : COOL_TINT} />
      <Puppet rig={QUEEN} pose={s5Queen} height={H_Q} pos={POS.queen} tint={right ? undefined : COOL_TINT} />
    </Stage>
  );
};
export const S5: KitShot = {id: SHOT.S5.comp, len: S5_LEN, bg: PAL.sky, Scene: S5Scene, liveness: liveness('wideInterior', [
  {name: 'camera', kind: 'camera', note: 'pull 3 %/s on the axis; a column enters at each frame edge'},
  {name: 'ruler back view', kind: 'puppet', beats: [24], note: 'film 280: hood turns to the peaks'},
  {name: 'queen', kind: 'puppet', beats: [30], note: 'film 286: tilts up at the hanging snow'},
  {name: 'snow', kind: 'ambient', family: 'weather', note: 'falls, hangs at film 280, rises from 291'},
  {name: 'lantern flames until off', kind: 'ambient', family: 'flame'},
  {name: 'armillary rings', kind: 'ambient', family: 'mechanical'}, RING,
  {name: 'green throne drape', kind: 'ambient', family: 'cloth'},
  {name: 'clouds, drifting back from film 291', kind: 'ambient', family: 'sky'},
  {name: 'lanterns switch off', kind: 'state', beats: [3, 10], note: 'film 259 left, 266 right; their light pools go with them; floor, steps and both figures one cool step darker at 266'},
  {name: 'snow hangs, then rises', kind: 'state', beats: [24, 35], note: 'film 280, 291'},
])};

export const GROUP_A: KitShot[] = [S1, S2, S3, S4, S5];
void [Diamond, track, COLORS, camHold, Stroke];
