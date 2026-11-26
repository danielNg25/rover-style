import React, {useMemo} from 'react';
import {Composition, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {GradeCtx, GRADES, Ground, Halo} from '../lib3/look';
import {Plate, Sprite, rnd, P, Ctx, paintCloud} from '../lib3/depth';
import {StageCam, B, Motes} from '../lib3/kit';
import {useSurface} from '../lib3/detail';
import {Shot} from '../lib3/shot';
import {BulbHalo} from '../lib3/fx';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import type {Spec} from '../mould/draw';
import {Palace, palaceBulbs, DomeHall, domeBulbs, DOME, BulbField, Lake, Mirror, Searchlight, Balustrade, FairLamp, paintGoldStatue, paintWalkers, fairWave, FAIR_DARK, FAIR_LIT, FairPower, FairBulb} from '../lib3/kitChicagoFair';
import {TESLA_FAIR, WESTINGHOUSE, HEIGHT, extra} from '../episodes/teslaCast';

/** Set HC of episodes/tesla-danh-sach-canh.md: the "White City" of the Chicago fair, 1893, at dusk. ONE set, two states (toi =
 *  nothing lit yet, sang = every bulb burning) with the switching-on between them as a parameter (power), three camera views.
 *  Plan (metres; x right, y up, the lens looks along -z):
 *    the head of the water: a paved square z +40..-16 with the waiting crowd (backs to the camera) at z -9.5..-14.5;
 *    a stone balustrade across the head of the lake at z -16 (x -18..18) with lamps on pedestals at x +-1.5, +-10.5, +-16.5 (none at +-3..+-5: they would rise out of the heads in view c);
 *    the lake x -18..18, z -16.6..-165, water 0.55 below the ground, the golden statue on its pedestal at z -150;
 *    promenades x +-18..+-26 along both sides with a low railing and three-globe lamps every 12 m at x +-19;
 *    the two white palaces, fronts at x = -26 and +26 facing the water, from z -20 to -150 (centre pavilions at z -85);
 *    the domed hall across the far end: front at z -175, dome over z -190, top of the lantern 43.6 m;
 *    searchlights on the right palace's roof (x 33, z -128) and on the domed hall's roof behind the dome (x 12, z -202).
 *  Marks (from the list, kept): Tesla [-1.0, 0, -7.2], Westinghouse [0.9, 0, -7.6]: 8.4 m in front of the balustrade.
 *  Changed from the list: the balustrade stands at z -16 (the list: -10) and the crowd at z -9.5..-14.5 (the list: -4..-9), so
 *  that the high wide view of shot 11 sees the crowd's heads at the bottom of the frame; see the stage notes. */
type V3 = [number, number, number];
export type FairView = 'a' | 'b' | 'c';
/** a = shot 11, high and wide from the head of the water; b = shot 12, low behind the balustrade, right of the axis;
 *  c = shot 13, the two-shot of Tesla and Westinghouse at shoulder height (soft background). focus / reach = where the
 *  shadow-casting light is aimed and how far its shadows reach. */
export const FAIR_VIEWS: Record<FairView, {eye: V3; focus: V3; reach: number}> = {
  a: {eye: [0, 8, 18], focus: [0, 0, -40], reach: 70},
  b: {eye: [7, 3.3, -2], focus: [2, 0, -30], reach: 50},
  c: {eye: [-0.05, 1.42, -2.4], focus: [0, 0, -9], reach: 14},
};
export const FAIR_MARKS = {tesla: [-1.0, 0, -7.2] as V3, westinghouse: [0.9, 0, -7.6] as V3};
export const FAIR = {balustrade: -16, lake: {x: [-18, 18] as [number, number], z: [-16.6, -165] as [number, number], level: -0.55}, palaceX: 26, palaceZ: -85, palaceL: 130, domeZ: -175, statueZ: -150,
  railPosts: [-16.5, -10.5, -1.5, 1.5, 10.5, 16.5], walkLamps: Array.from({length: 12}, (_, i) => -22 - i * 12)};
const PAL_L: V3 = [-FAIR.palaceX, 0, FAIR.palaceZ], PAL_R: V3 = [FAIR.palaceX, 0, FAIR.palaceZ], ROT_L = Math.PI / 2, ROT_R = -Math.PI / 2, DOME_AT: V3 = [0, 0, FAIR.domeZ];
/** every bulb of the fair (world positions), built once */
export const FAIR_BULBS: FairBulb[] = (() => { const a = palaceBulbs(PAL_L, ROT_L, FAIR.palaceL, 0), b = palaceBulbs(PAL_R, ROT_R, FAIR.palaceL, 5000), c = domeBulbs(DOME_AT, 10000); return [...a, ...b, ...c]; })();
const SEARCH: {pos: V3; tilt: number; lean: number; k: number}[] = [{pos: [33, 19.2, -128], tilt: -0.55, lean: 0.12, k: 1}, {pos: [12, 17.2, -202], tilt: 0.38, lean: 0.25, k: 2}];

/** The waiting crowd (backs to the camera): position, height, look. The acting of shot 12 can take them from here
 *  (people={false} on the set, then its own Puppet3 for each, heads up at frame 20, cheering at 46). Kept clear of the marks of
 *  Tesla and Westinghouse and of the line from view b to the dome (x 5.6..8.6). */
const coats = ['#2c2a34', '#3a3036', '#2a3040', '#463a30', '#34302c', '#3c2e2e', '#2e3630', '#40384a'], hairs = ['#2a2420', '#6b4a2a', '#1f1c22', '#4a3a2a', '#8a8278', '#3a2a22'];
export const FAIR_CROWD: {pos: V3; h: number; spec: Spec}[] = (() => {
  const r = rnd(23), out: {pos: V3; h: number; spec: Spec}[] = [];
  const spots: [number, number][] = [[-12.4, -10.2], [-10.6, -11.6], [-9.0, -10.0], [-7.6, -12.4], [-6.1, -10.6], [-4.4, -11.9], [-3.0, -10.1], [-1.6, -12.8], [-0.2, -10.9], [1.4, -12.2], [2.8, -10.3], [4.2, -11.6],
    [9.2, -10.4], [10.6, -12.0], [12.2, -10.8], [13.6, -12.6], [-5.2, -14.0], [0.8, -14.2], [-11.4, -13.8], [11.4, -14.1], [5.0, -13.9], [9.8, -14.4], [3.6, -13.2], [10.4, -11.2], [4.6, -10.6], [12.6, -13.4]];
  spots.forEach(([x, z], i) => { const bun = r() < 0.35, coat = coats[i % coats.length], hair = hairs[Math.floor(r() * hairs.length)];
    const s: Spec = {...extra(coat, hair, r() < 0.3 ? 'sweep' : 'level'), view: 'back', ...(bun ? {hair: 'bun' as const} : {})};
    out.push({pos: [x, 0, z], h: bun ? HEIGHT.extraShort - 0.04 : r() < 0.5 ? HEIGHT.extra : HEIGHT.extraShort, spec: s}); });
  return out;
})();

// ---------------------------------------------------------------- painted layers
const SKY_COLORS = {top: '#1e2546', mid: '#3a4370', low: '#6a6c96', pink: 'rgba(214,150,160,'};
const sky = (c: Ctx) => {
  const g = c.createLinearGradient(0, -260, 0, 560), r = rnd(9);
  g.addColorStop(0, SKY_COLORS.top); g.addColorStop(0.55, SKY_COLORS.mid); g.addColorStop(1, SKY_COLORS.low); c.fillStyle = g; c.fillRect(-400, -300, 2400, 1500);
  for (let i = 0; i < 110; i++) { c.beginPath(); c.arc(-300 + r() * 2200, -260 + r() * 560, 1.1 + r() * 1.8, 0, 7); c.fillStyle = `rgba(232,236,250,${0.3 + r() * 0.55})`; c.fill(); }
  // the last pink of the sunset low behind the dome, fading out to the sides
  const p = c.createRadialGradient(800, 560, 40, 800, 560, 760); p.addColorStop(0, SKY_COLORS.pink + '0.55)'); p.addColorStop(0.5, SKY_COLORS.pink + '0.22)'); p.addColorStop(1, SKY_COLORS.pink + '0)'); c.fillStyle = p; c.fillRect(-400, 200, 2400, 600);
  paintCloud(c, -120, 140, 1.2, {light: '#454e74', dark: '#3a4266'}); paintCloud(c, 1180, 60, 1.4, {light: '#434b70', dark: '#373f62'}); paintCloud(c, 420, 300, 0.6, {light: '#59618a', dark: '#4c5480'}); paintCloud(c, 1420, 330, 0.7, {light: '#5b628a', dark: '#4e557c'});
};
/** the far side: the flat horizon of Lake Michigan behind the dome, low white pavilions with small domes far off on both sides
 *  (their outlines in dots of light when the fair is lit), painted for this view's eye */
const far = (lit: boolean, eyeY: number, vx: number, d: number) => (c: Ctx) => {
  const base = 450 + (eyeY / (0.4986 * d)) * 900, px = (x: number) => 800 + ((x - vx) / (0.887 * d)) * 1600, s = 900 / (0.4986 * d), r = rnd(31);
  c.fillStyle = '#7a7c9c'; c.fillRect(-400, 446, 2400, base - 446 + 2);   // the lake's far water, a pale band
  c.fillStyle = 'rgba(200,190,210,0.35)'; c.fillRect(-400, 446, 2400, 3);
  const pav = (x: number, w: number, h: number, dome: boolean) => {
    const X = px(x), W = w * s, H = h * s; P(c, [[X - W / 2, base], [X - W / 2, base - H], [X + W / 2, base - H], [X + W / 2, base]], '#8a8aa6');
    P(c, [[X - W / 2, base - H], [X + W / 2, base - H], [X + W / 2, base - H * 0.94], [X - W / 2, base - H * 0.94]], '#9c9cb6');
    if (dome) { c.beginPath(); c.ellipse(X, base - H, W * 0.16, H * 0.5, 0, Math.PI, 0); c.fillStyle = '#8f8a9c'; c.fill(); }
    if (lit) { c.fillStyle = 'rgba(255,214,140,0.95)'; for (let u = -W / 2; u <= W / 2; u += 3.2) c.fillRect(X + u, base - H - 1, 1.6, 1.6); for (let q = 0; q < 6; q++) { const u = -W / 2 + (q / 5) * W; for (let v = 0; v < H; v += 4) c.fillRect(X + u, base - v, 1.4, 1.4); } }
  };
  [[-95, 60, 18, true], [-150, 70, 16, false], [-210, 80, 20, true], [95, 60, 18, false], [150, 70, 22, true], [220, 80, 16, false], [-60, 30, 12, false], [64, 30, 14, true]].forEach(([x, w, h, dm]) => pav(x as number, w as number, h as number, dm as boolean));
  // trees between them
  for (let x = -300; x < 300; x += 8 + r() * 10) { if (Math.abs(x) < 40) continue; const X = px(x), h = (6 + r() * 5) * s; c.beginPath(); c.ellipse(X, base - h * 0.5, h * 0.45, h * 0.55, 0, 0, 7); c.fillStyle = '#4a4f6c'; c.fill(); }
};

// ---------------------------------------------------------------- lights: one key with its shadows aimed at the view's focus
const Lights: React.FC<{dir: V3; focus: V3; reach: number; wash: number}> = ({dir, focus, reach, wash}) => {
  const g = GRADES.nightExterior, target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(...focus); target.updateMatrixWorld();
  return (
    <>
      <hemisphereLight args={[g.sky, g.ground, g.fill * (1 - 0.12 * wash)]} />
      <primitive object={target} />
      <directionalLight position={[focus[0] + dir[0] * 6, focus[1] + dir[1] * 6, focus[2] + dir[2] * 6]} target={target} intensity={g.key * (1 - 0.15 * wash)} color={g.keyColor} castShadow shadow-mapSize={[4096, 4096]} shadow-radius={1.6} shadow-blurSamples={12} shadow-bias={-0.0005}
        shadow-camera-left={-reach} shadow-camera-right={reach} shadow-camera-top={reach} shadow-camera-bottom={-reach} shadow-camera-near={1} shadow-camera-far={200} />
      {/* the fair's own light on the white fronts: a few weak warm lamps along each front and before the dome (not painted on) */}
      {wash > 0 ? <>
        {[-35, -65, -95, -125].map((z) => [-1, 1].map((s) => <pointLight key={`${z}${s}`} position={[s * 20.5, 9, z]} color="#ffc27a" intensity={20 * wash} distance={30} decay={1.2} />))}
        <pointLight position={[0, 14, -160]} color="#ffc27a" intensity={45 * wash} distance={44} decay={1.2} />
        <pointLight position={[0, 6, -20]} color="#ffcf8a" intensity={10 * wash} distance={22} decay={1.2} />
      </> : null}
    </>
  );
};
const HAZE = '#4a5276';

// ---------------------------------------------------------------- the set
/** power = the level of every bulb, lamp, beam and wash (fairWave in lib3/kitChicagoFair; FAIR_DARK = state toi, FAIR_LIT =
 *  state sang); f = the frame (ripples, twinkling, the searchlights' sweep); people = the waiting crowd; view = which camera
 *  view the far plates and the shadows are painted for (must match the shot's camera). */
export const ChicagoFair: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; view?: FairView; power?: FairPower; people?: boolean}> =
  ({children, f = 0, dx, dz, view = 'a', power = FAIR_DARK, people = true}) => {
    const V = FAIR_VIEWS[view], EYE = V.eye, slabs = useSurface('slabs', 4), stone = useSurface('stone', 6);
    const lv = (kind: FairBulb['kind'], x = 0, y = 0, z = 0, k = 0) => Math.min(1.6, power({kind, x, y, z, t: 0, k}));
    const wash = lv('wash'), lit = wash > 0.5, search = lv('search');
    const sweep = (k: number) => 0.14 * Math.sin((f + k * 40) * (Math.PI / 60));
    const plazaMap = useMemo(() => { const t = slabs.clone(); t.needsUpdate = true; return t; }, [slabs]);
    const walkMap = useMemo(() => { const t = stone.clone(); t.needsUpdate = true; return t; }, [stone]);
    const lake = FAIR.lake, statueZ = FAIR.statueZ;
    const buildings = (mirror: boolean) => <>
      <Palace pos={PAL_L} rotY={ROT_L} L={FAIR.palaceL} warm={wash} glow={wash} seed={1} />
      <Palace pos={PAL_R} rotY={ROT_R} L={FAIR.palaceL} warm={wash} glow={wash} seed={2} />
      <DomeHall pos={DOME_AT} warm={wash} glow={wash} />
      <B p={[0, 2.6, statueZ]} s={[4.2, 5.2, 4.2]} c="#d8d0c0" /><B p={[0, 5.3, statueZ]} s={[4.8, 0.3, 4.8]} c="#e8e2d4" />
      {mirror ? null : <Sprite name={`hc-statue-${lit ? 'lit' : 'dusk'}`} art={paintGoldStatue(lit)} px={[300, 920]} w={5} pos={[0, 5.45, statueZ]} cast={false} shade={0} />}
    </>;
    return (
      <GradeCtx.Provider value="nightExterior">
        <Lights dir={[-5, 7, 4]} focus={V.focus} reach={V.reach} wash={wash} />
        <StageCam eye={EYE} haze={HAZE} fog={[70, 470]} dx={dx} dz={dz} />
        <Plate from={EYE} id={`hc-sky-${view}`} d={520} paint={sky} fog={false} />
        {/* the sky looks darker once the lights burn: a dark veil over it, 15 % at most */}
        <mesh position={[EYE[0], EYE[1], EYE[2] - 510]} renderOrder={0}><planeGeometry args={[1200, 700]} /><meshBasicMaterial color="#05060e" transparent opacity={0.15 * wash} depthWrite={false} fog={false} /></mesh>
        <Plate from={EYE} id={`hc-far-${view}-${lit ? 1 : 0}`} d={EYE[2] + 262} paint={far(lit, EYE[1], EYE[0], EYE[2] + 262)} fog={false} />
        {/* the grounds: the square, the promenades, the far end (never over the water) */}
        <Ground near="#c9c2b2" far="#b4ae9e" pos={[0, 0, 12]} size={[140, 57.4]} swell={0.02} patch={0.05} map={plazaMap} tile={3} seed={2} />
        {[-1, 1].map((s) => <Ground key={s} near="#c4bdae" far="#aaa496" pos={[s * 59, 0, -128]} size={[82, 224]} swell={0.02} patch={0.05} map={walkMap} tile={2.4} seed={3 + s} />)}
        <Ground near="#bdb6a6" far="#a8a294" pos={[0, 0, -202.7]} size={[36.4, 75]} swell={0.02} patch={0.05} map={plazaMap} tile={3} seed={6} />
        <Lake x={lake.x} z={lake.z} level={lake.level} f={f} />
        <Mirror level={lake.level}>{buildings(true)}</Mirror>
        {buildings(false)}
        {/* the bulbs and their reflections */}
        <BulbField bulbs={FAIR_BULBS} power={power} f={f} water={lake.level} />
        {lv('tip') > 0 ? <>
          <BulbHalo pos={[0, DOME.top + 0.5, FAIR.domeZ - DOME.d / 2 + 1.7]} r={1.4 * Math.min(1.3, lv('tip'))} f={f} color="#ffd27a" core="#fff8e4" />
          <Halo pos={[0, DOME.top + 0.5, FAIR.domeZ - DOME.d / 2 + 1.7]} r={9 * Math.min(1.3, lv('tip'))} color="#ffcc70" strength={0.5} />
        </> : null}
        {lv('ring') > 0 ? <Halo pos={[0, 31, FAIR.domeZ + 4]} r={34 * Math.min(1.3, lv('ring'))} color="#ffc060" strength={0.32 * Math.min(1, lv('ring'))} /> : null}
        {SEARCH.map((s) => <Searchlight key={s.k} pos={s.pos} tilt={s.tilt + sweep(s.k)} lean={s.lean} on={Math.min(1, search)} />)}
        {/* the balustrade at the head of the water and its lamps */}
        <Balustrade x={[-18.6, 18.6]} z={FAIR.balustrade} posts={FAIR.railPosts} />
        {FAIR.railPosts.map((x, i) => <FairLamp key={i} pos={[x, 1.29, FAIR.balustrade]} h={2.4} level={lv('rail', x, 0, FAIR.balustrade)} f={f} seed={i} light={view !== 'a'} />)}
        {/* the promenades: a low railing on the water's edge, lamps every 12 m, far walkers */}
        {[-1, 1].map((s) => <React.Fragment key={s}>
          <B p={[s * 18.75, 0.82, -90.8]} s={[0.08, 0.08, 148.4]} c="#2c3034" cast={false} />
          <B p={[s * 18.75, 0.45, -90.8]} s={[0.05, 0.05, 148.4]} c="#2c3034" cast={false} />
          {Array.from({length: 50}, (_, i) => <B key={i} p={[s * 18.75, 0.42, -17 - i * 3]} s={[0.07, 0.84, 0.07]} c="#2c3034" cast={false} />)}
          {FAIR.walkLamps.map((z, i) => <FairLamp key={i} pos={[s * 19.3, 0, z]} h={3.4} level={lv('post', s * 19.3, 0, z)} f={f} seed={i + (s > 0 ? 20 : 0)} />)}
          {[-34, -58, -79, -104, -131].map((z, i) => <Sprite key={i} name={`hc-walkers-${s}-${i}`} art={paintWalkers(i * 2 + (s > 0 ? 1 : 0) + 3)} px={[360, 120]} w={4.4} pos={[s * (21.5 + (i % 2) * 1.6), 0, z]} cast={false} shade={0.15} />)}
        </React.Fragment>)}
        {/* the crowd */}
        {people ? FAIR_CROWD.map((p, i) => <Puppet3 key={i} height={p.h} pos={p.pos} spec={p.spec} />) : null}
        {children}
      </GradeCtx.Provider>
    );
  };

// ---------------------------------------------------------------- the light plans of the three shots
/** shot 11: nothing lit; ONE bulb on top of the dome flashes on at frame 44 */
export const powerShot11 = (f: number): FairPower => { const p = fairWave({f, tip: 44}); return (b) => (b.kind === 'tip' ? p(b) : 0); };
/** shot 12: the tip burns from the start; the ring at 8 (with the big halo), ribs 10-22, the wave along the palaces 16-56
 *  (cornice first, colonnade 4 frames later, columns bottom up after it), searchlights at 28, warm wash and darker sky 40-60,
 *  balustrade lamps 52-58 far to near, then a few bulbs twinkle */
export const powerShot12 = (f: number): FairPower => fairWave({f});
/** shot 13: everything burns (the end of shot 12), a few bulbs twinkle */
export const powerShot13 = (f: number): FairPower => fairWave({f: f + 200});

// ---------------------------------------------------------------- the stills
const ViewA: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="nightExterior" eye={FAIR_VIEWS.a.eye} finish={{warm: ''}} set={(inside, cam) => <ChicagoFair view="a" f={f} power={powerShot11(f)} dx={cam.dx} dz={cam.dz}>{inside}</ChicagoFair>} figures={null} />; };
const ViewALit: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="nightExterior" eye={FAIR_VIEWS.a.eye} finish={{warm: ''}} set={(inside, cam) => <ChicagoFair view="a" f={f} power={powerShot13(f)} dx={cam.dx} dz={cam.dz}>{inside}</ChicagoFair>} figures={null} />; };
const ViewB: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="nightExterior" eye={FAIR_VIEWS.b.eye} finish={{warm: ''}} set={(inside, cam) => <ChicagoFair view="b" f={f} power={powerShot12(f)} dx={cam.dx} dz={cam.dz}>{inside}</ChicagoFair>} figures={null} />; };
const ViewBLit: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="nightExterior" eye={FAIR_VIEWS.b.eye} finish={{warm: ''}} set={(inside, cam) => <ChicagoFair view="b" f={f} power={powerShot13(f)} dx={cam.dx} dz={cam.dz}>{inside}</ChicagoFair>} figures={null} />; };
const look = (s: Spec, gaze: [number, number], expr = s.expr): Spec => ({...s, expr: {...expr, gaze}});
const ViewC: React.FC = () => { const f = useCurrentFrame();
  return <Shot grade="nightExterior" eye={FAIR_VIEWS.c.eye} soft={1.6} finish={{warm: ''}} set={(inside, cam) => <ChicagoFair view="c" f={f} power={powerShot13(f)} people={false} dx={cam.dx} dz={cam.dz}>{inside}</ChicagoFair>}
    figures={<>
      {/* the warm light of the lamps and buildings behind the camera, on their faces (a lamp on the lens side, skill 3) */}
      <pointLight position={[0, 2.4, -4.2]} color="#ffc77a" intensity={5} distance={8} decay={1.3} />
      <Puppet3 height={HEIGHT.tesla} pos={FAIR_MARKS.tesla} res={3} spec={look(TESLA_FAIR, [0, -30], EXPR.shock)} />
      <Puppet3 height={HEIGHT.westinghouse} pos={FAIR_MARKS.westinghouse} res={3} flip spec={look(WESTINGHOUSE, [0, -30], EXPR.shock)} />
      <Motes f={f} box={[-2.2, 2.2, 0.6, 2.6, -9.5, -5.5]} n={18} color="#ffe2a0" size={0.012} drift={0.25} glow={0.35} seed={5} />
    </>} />; };
export const ChicagoFairComps: React.FC = () => <>
  <Composition id="hc-toi-a" component={ViewA} width={1280} height={720} fps={24} durationInFrames={50} />
  <Composition id="hc-sang-a" component={ViewALit} width={1280} height={720} fps={24} durationInFrames={50} />
  <Composition id="hc-b" component={ViewB} width={1280} height={720} fps={24} durationInFrames={96} />
  <Composition id="hc-sang-b" component={ViewBLit} width={1280} height={720} fps={24} durationInFrames={96} />
  <Composition id="hc-sang-c" component={ViewC} width={1280} height={720} fps={24} durationInFrames={44} />
</>;
