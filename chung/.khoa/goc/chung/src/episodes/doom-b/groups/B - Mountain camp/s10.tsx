import React from 'react';
import {Stage, KitShot, liveness, Poly, Disc, Stroke, Rect, Arc, Smoke, Puff, StarField, track, trackStep, twos, deg, rand, circlePts} from '../../../../kit';
import type {Pt, V3} from '../../../../kit';
import {MotherShadow} from './mother';
import {SHOT, SNOW, PAIR, COLORS, SCALE, PINES, FINISH} from '../../shared';
import {CAM0, Layer, At, Fx, Y, wpos, wlen, NIGHT as P, Sky, Peaks, Ridge, Forest, Pine, Patch, Ground, Tent, Drift, Campfire, WashingLine, StickPile, Crate, Barrel,
  Rock, Tuft, Steps, StovePipe, camPushTo, pen} from './set';

/* S10 (film 480-545, 65 f): the patched tent on the S9 canopy's triangle (PAIR), the night he was born.
 * Beats (in-shot): 0 dark tent, heavy snow | 8 'Victor': the inside light comes on in 2 steps, the mother's shadow
 * rocks the bundle | 20 the baby's arms wave | 34 'born': a gust whips the flap and the patch corner, the light dips
 * and recovers | 46 'tent': the roof's snow slab slides off (6 f), lands with a flat puff at 52; the roof sags, the
 * stovepipe tips and coughs | 50 she curls over the bundle | 59 the light dips and holds. */
const LEN = SHOT.S10.len;
const [AX, AY] = PAIR.px.apex, [LX, GY] = PAIR.px.baseL, RX = PAIR.px.baseR[0];
const cam = camPushTo(CAM0, wpos(AX, AY, 0), PAIR.cam.pctPerSec);
const C = COLORS.camp;

// the light inside: 0 dark, 1 first step, 2 dipped, 3 full
const light = (f: number) => trackStep(f, [[0, 0], [8, 1], [10, 3], [34, 2], [38, 3], [59, 2]]);
const CANVAS = [P.canvas, '#b7b3a6', C.canvasLitDim, C.canvasLit], HEM = [P.canvasShade, '#9d9a8e', '#c2b587', '#d6c898'], SEAM = [P.seam, '#a5a195', '#cabd8c', '#dccf9e'];
const GREEN = [P.green, '#3f8f52', '#4f9d5a', '#5aa862'], OCHRE = [P.ochre, '#9a8862', '#c29f5c', '#cfab62'], RUST = [P.rust, '#8a6c6a', '#c08a6c', '#cc9472'];
const SHADOW = '#2f2b3a';                       // the mother pieces' own tone; the bundle takes the same one

// the shadow: 38 % of frame height, sitting on the tent floor a little left of the centre line
const MK = (SCALE.frameShare.S10.motherShadow * 720) / 270, MX = 592;
/** the baby's arms, three poses on twos (degrees from straight up: screen-left arm, screen-right arm): open, half, shut */
const WAVE: [number, number][] = [[-66, 40], [-40, 18], [-14, -4], [-40, 18]];

/** the gust on 'born' (in-shot 34): how far the loose cloth is whipped (degrees), on twos; a little flutter otherwise */
const whipAt = (f: number) => (f >= 34 && f < 44 ? [29, 26, 14, 6, 2][Math.floor((f - 34) / 2)] : [0, 3, 1, 4][Math.floor(f / 4) % 4]);
/** sideways push the gust gives the falling snow (px), kept afterwards so nothing jumps back */
const gustX = (f: number) => (f < 34 ? 0 : f < 38 ? (f - 33) * 15 : f < 42 ? 60 + (f - 37) * 6 : 84);
const streak = (f: number) => (f >= 34 && f < 38 ? 20 : f >= 38 && f < 42 ? 9 : 0);
/** one depth layer of snow (the set's SnowLayer plus the gust: the flakes are pushed sideways and drawn as short slanted strokes while it blows) */
const GustSnow: React.FC<{f: number; count: number; seed: number; r: number; speed: number; color: string; wind?: number}> = ({f, count, seed, r, speed, color, wind = 0.5}) => {
  const ps = React.useMemo(() => { const q = rand(seed * 53 + 11); return Array.from({length: count}, () => ({x: q(), y: q(), v: 0.75 + q() * 0.5, ph: q() * 6.28, k: 0.8 + q() * 0.4})); }, [count, seed]);
  const top = 780, H = 820, x0 = -160, Wd = 1600, st = streak(f), gx = gustX(f) * (speed / 3);
  return <>{ps.map((p, i) => {
    const d = (p.y * H + f * speed * p.v) % H, y = top - d;
    const x = x0 + ((((p.x * Wd + d * wind + gx + Math.sin(f * 0.07 + p.ph) * 7) % Wd) + Wd) % Wd);
    return st ? <Stroke key={i} pts={[[x - st * p.k, y + st * 0.35 * p.k], [x, y]]} width={r * p.k * 1.7} color={color} pos={[0, 0, (i % 7) * 0.2]} />
      : <Disc key={i} r={r * p.k} color={color} pos={[x, y, (i % 7) * 0.2]} seg={10} />;
  })}</>;
};

/** the wagon at the left frame edge (about 7 % of the width at f0): slate-brown plank wall in two tones, a corner post
 *  with iron straps, the canvas arch above with its snow, part of a wheel below. Sharp, no blur. */
const WX = 90, WAGON = (() => {
  const g: React.ReactElement[] = [], add = (e: React.ReactElement) => g.push(React.cloneElement(e, {key: g.length}));
  const z = () => g.length * 0.12;
  // canvas arch over the body, its rib and its snow
  add(<Poly pts={[[-320, Y(232)], [-320, Y(-60)], [-60, Y(-60)], [10, Y(-10)], [56, Y(70)], [WX - 8, Y(232)]]} color="#6f7193" pos={[0, 0, z()]} />);
  add(<Poly pts={[[10, Y(-10)], [56, Y(70)], [WX - 8, Y(232)], [WX - 34, Y(232)], [26, Y(84)], [-10, Y(20)]]} color="#585b80" pos={[0, 0, z()]} />);
  add(<Stroke pts={[[-40, Y(232)], [-52, Y(120)], [-90, Y(20)]]} width={3} color="#585b80" pos={[0, 0, z()]} />);
  add(<Poly pts={[[-80, Y(-60)], [-60, Y(-60)], [10, Y(-10)], [56, Y(70)], [70, Y(120)], [50, Y(96)], [14, Y(26)], [-40, Y(-22)]]} color={P.pineSnow} pos={[0, 0, z()]} />);
  add(<Poly pts={[[40, Y(112)], [50, Y(96)], [70, Y(120)], [78, Y(160)], [60, Y(140)]]} color={P.pineSnowShade} pos={[0, 0, z()]} />);
  // plank wall: two plank tones, gaps, the corner post, top and bottom rails
  add(<Rect w={420} h={370} color="#4d4458" pos={[WX - 210, Y(415), z()]} />);
  [262, 334, 406, 478, 550].forEach((y, i) => { if (i % 2 === 0) add(<Rect w={420} h={70} color="#433b50" pos={[WX - 210, Y(y + 35), z()]} />); });
  [262, 334, 406, 478, 550].forEach((y) => add(<Rect w={420} h={3.4} color="#352f42" pos={[WX - 210, Y(y), z()]} />));
  add(<Rect w={22} h={390} color="#5c5268" pos={[WX - 11, Y(415), z()]} />);
  add(<Rect w={6} h={390} color="#6b6078" pos={[WX - 3, Y(415), z()]} />);
  add(<Rect w={420} h={16} color="#352f42" pos={[WX - 210, Y(236), z()]} />);
  add(<Rect w={420} h={16} color="#352f42" pos={[WX - 210, Y(598), z()]} />);
  [300, 520].forEach((y) => { add(<Rect w={50} h={12} color="#6c7190" pos={[WX - 25, Y(y), z()]} />); [-8, -36].forEach((x) => add(<Disc r={3.2} color="#8f97b4" pos={[WX + x, Y(y), z()]} seg={10} />)); });
  // a knot hole and a nail row so the wall is wood, not a border
  add(<Disc r={6} sy={0.6} color="#352f42" pos={[30, Y(446), z()]} seg={12} />);
  // wheel: part of the rim, spokes and hub under the body, snow on the rim
  add(<Poly pts={circlePts([14, Y(668)], 122, 0, 360, 40)} color="#3a3348" pos={[0, 0, z()]} />);
  add(<Poly pts={circlePts([14, Y(668)], 100, 0, 360, 40)} color="#2e2a40" pos={[0, 0, z()]} />);
  [20, 65, 110, 155].forEach((a) => add(<Rect w={206} h={11} color="#4d4458" pos={[14, Y(668), z()]} rot={[0, 0, deg(a)]} />));
  add(<Disc r={24} color="#3a3348" pos={[14, Y(668), z()]} seg={20} />); add(<Disc r={9} color="#6c7190" pos={[14, Y(668), z()]} seg={14} />);
  add(<group position={[14, Y(668), z()]}><Arc r1={122} r2={131} a0={28} a1={80} color={P.pineSnow} /></group>);
  return g;
})();

const Scene: React.FC<{f: number; t: number}> = ({f}) => {
  const L = light(f), lit = L > 0, canvas = CANVAS[L];
  const whip = whipAt(f), wr = deg(whip);
  const sag = track(f, [[0, 0], [46, 8]], 4);
  const tip = track(f, [[0, 0], [50, 12]], 4);
  // the slab slides down the right slope from 46 (6 f), is a heap on the ground from 52
  const sd = [0, 14, 44, 96, 170, 262][Math.max(0, Math.min(5, f - 46))], slid = f >= 52;
  const ux = (RX - AX) / Math.hypot(RX - AX, GY - AY), uy = (GY - AY) / Math.hypot(RX - AX, GY - AY);   // down the right slope (y down)
  const on = (t: number, out = 0, side = 1): Pt => [AX + side * (RX - AX) * t + side * uy * out, Y(AY + (GY - AY) * t - ux * out)];
  const arms = f >= 20 && f < 34 ? WAVE[Math.floor((f - 20) / 2) % 4] : null;
  const cough = twos(f) - 50;
  const g = pen(), g2 = pen();
  // guy ropes and pegs
  ([-1, 1] as const).forEach((s) => { const a = on(0.5, 0, s), b: Pt = [AX + s * 392, Y(GY + 14)]; g.line([a, b], 2.4, P.rope); g.rect(b[0], b[1] + 6, 6, 20, P.woodDark, s * 22); });
  // stovepipe behind the right slope, crooked; it tips when the slab goes
  g.put((z) => <group position={[on(0.3)[0] + 8, on(0.3)[1] - 26, z]}><StovePipe pal={P} s={1.25} tip={tip} snow={f < 50} /></group>).skip(7);
  // the gable: one flat shape (dark canvas, then lit cream), hem, seams, lacing down the middle
  g.poly([[LX, Y(GY)], [AX, Y(AY)], [on(0.5)[0] - sag * uy, on(0.5)[1] - sag * ux], [RX, Y(GY)]], canvas);
  g2.poly([[LX, Y(GY)], [LX + 16, Y(GY - 24)], [RX - 16, Y(GY - 24)], [RX, Y(GY)]], HEM[L]);
  [-0.5, 0.5].forEach((t) => g.line([[AX, Y(AY + 8)], [AX + t * 300, Y(GY)]], 2.4, SEAM[L]));
  g.line([[AX, Y(AY + 150)], [AX, Y(GY)]], 2.4, lit ? '#b9a878' : P.canvasDark);
  [0, 1, 2, 3, 4].forEach((i) => g.rect(AX, Y(AY + 190 + i * 52), 13, 3.4, lit ? '#a8966a' : P.canvasDark, 20));
  // patches: the big green one low on the left with a loose corner, ochre, rust
  g.put((z) => <group position={[440, Y(532), z]}><Patch w={58} h={50} rot={-6} color={GREEN[L]} stitch={lit ? '#2f7a48' : P.green2} /></group>).skip(3);
  g.put((z) => <group position={[466, Y(552), z]} rotation={[0, 0, -wr * 1.1]}>
    <Poly pts={[[-2, 0], [2, 50], [30, 62], [22, 26]]} color={lit ? '#3f8f52' : P.green2} /><Poly pts={[[2, 50], [30, 62], [26, 44]]} color={lit ? '#2f7a48' : '#1d5232'} pos={[0, 0, 0.1]} />
  </group>).skip(2);
  g.put((z) => <group position={[812, Y(534), z]}><Patch w={46} h={40} rot={9} color={OCHRE[L]} stitch={lit ? '#a8824a' : P.ochre2} /></group>).skip(3);
  g.put((z) => <group position={[672, Y(236), z]}><Patch w={26} h={22} rot={-12} color={RUST[L]} stitch={lit ? '#a8765a' : P.canvasDark} /></group>).skip(3);
  // loose storm flap at the right foot of the gable, flapping
  g2.put((z) => <group position={[RX - 66, Y(GY), z]} rotation={[0, 0, -wr]}>
    <Poly pts={[[0, 0], [60, 0], [46, 44], [18, 70]]} color={SEAM[L]} /><Poly pts={[[18, 70], [46, 44], [30, 34]]} color={HEM[L]} pos={[0, 0, 0.1]} />
  </group>).skip(2);
  // pole top and knot
  g.rect(AX, Y(AY - 14), 9, 42, P.woodDark).rect(AX, Y(AY + 2), 22, 6, P.rope);
  g.put((z) => <group position={[AX + 8, Y(AY + 2), z]} rotation={[0, 0, deg(-58 + whip * 2.2)]}><Poly pts={[[0, -3], [34, -5], [40, 0], [34, 5], [0, 3]]} color={P.rust} /></group>).skip(1);
  // snow on the roof: left slope stays, apex cap stays, the right slab goes
  g.poly([on(0.04, 0, -1), on(0.02, 14, -1), on(0.3, 17, -1), on(0.6, 13, -1), on(0.66, 0, -1)], P.pineSnow);
  g.poly([on(0.3, 0, -1), on(0.3, 6, -1), on(0.6, 5, -1), on(0.66, 0, -1)], P.pineSnowShade);
  g.poly([[AX - 26, Y(AY + 22)], [AX - 14, Y(AY - 6)], [AX + 2, Y(AY - 12)], [AX + 18, Y(AY - 2)], [AX + 28, Y(AY + 26)], [AX, Y(AY + 12)]], P.pineSnow);
  if (!slid) g.put((z) => <group position={[ux * sd, -uy * sd, z]}>
    <Poly pts={[on(0.05), on(0.03, 15), on(0.32, 19), on(0.6, 14), on(0.66, 0)]} color={P.pineSnow} />
    <Poly pts={[on(0.05), on(0.3, 0), on(0.32, 7), on(0.6, 6), on(0.66, 0)]} color={P.pineSnowShade} pos={[0, 0, 0.1]} />
  </group>);
  return (
    <Stage cam={cam} f={f} len={LEN} mood="nightExterior" bg={P.sky[1]} name={SHOT.S10.comp}>
      {/* night sky with about 20 constant stars, the hall's peaks pale behind */}
      <Layer z={-70}><Sky pal={P} top={820} bottom={Y(360)} /></Layer>
      <StarField pos={wpos(640, 150, -69)} size={[wlen(1500, -69), wlen(300, -69)]} count={FINISH.starsCampNight} seed={11} px={[5, 9]} colors={['#dfe6fa', '#c3cdf0']} />
      <Layer z={-55}><Peaks pal={P} k={6} peak={[214, 132]} /></Layer>
      <Layer z={-42}><Ridge top={[[-300, 330], [-60, 300], [120, 326], [300, 296], [470, 330], [660, 304], [850, 334], [1010, 300], [1190, 326], [1370, 298], [1600, 330]]} base={500} color={P.ridge1} hi={P.ridge1Hi}
        shelves={[[40, 330, 110], [330, 322, 90], [900, 328, 110], [1200, 340, 110]]} /></Layer>
      <Layer z={-32}><Ridge top={[[-300, 366], [-40, 352], [180, 374], [420, 356], [640, 378], [900, 360], [1120, 380], [1340, 358], [1600, 372]]} base={510} color={P.ridge2} hi={P.ridge2Hi}
        shelves={[[100, 378, 110], [960, 380, 110]]} /></Layer>
      <Layer z={-22}><Forest pal={P} y={404} base={520} seed={7} /></Layer>
      {/* tree line: the three pines, far snow */}
      <Layer z={-12}>
        <Ground top={[[-300, 436], [200, 430], [520, 438], [900, 430], [1600, 436]]} color={P.snowShade} lip={P.snow} />
        <At x={1010} y={452} dz={2}><Pine h={250 * PINES.heights[0]} pal={P} /></At>
        <At x={1110} y={454} dz={4}><Pine h={250 * PINES.heights[1]} pal={P} /></At>
        <At x={1212} y={452} dz={6}><Pine h={250 * PINES.heights[2]} pal={P} /></At>
        <At x={236} y={450} dz={3}><Pine h={150} pal={P} /></At>
        <GustSnow f={f} count={SNOW.countS10 / 2} seed={3} r={1.6} speed={3.0} color="#aab6dc" />
      </Layer>
      {/* mid-ground: bare washing line, a dark small tent, the stick pile under snow */}
      <Layer z={-6}>
        <Ground top={[[-300, 486], [140, 480], [420, 490], [760, 482], [1080, 490], [1600, 484]]} color={P.snow} lip={P.snowLight} />
        <group position={[0, 0, 4]}><WashingLine a={[130, 404]} b={[392, 398]} pal={P} f={f} cloths={false} sag={14} posts={[[132, 512], [390, 510]]} /></group>
        <At x={1130} y={512} dz={8}><Tent w={170} h={132} pal={P} side={1} f={f} patches={1} /></At>
        <At x={262} y={514} dz={10}><StickPile w={66} pal={P} /></At>
        <At x={186} y={518} dz={11}><Barrel w={32} pal={P} /></At>
        <At x={980} y={518} dz={9}><Tuft h={16} pal={P} seed={4} /></At>
        <At x={850} y={506} dz={9}><Rock w={40} pal={P} /></At>
        <At x={470} y={512} dz={9}><Drift w={130} pal={P} /></At>
        <At x={1040} y={520} dz={12}><Crate w={40} pal={P} snow /></At>
        <At x={340} y={520} dz={9}><Tuft h={14} pal={P} seed={6} /></At>
      </Layer>
      {/* character plane: the hero tent on the pair's triangle, the dead fire, crate, drifts */}
      <Layer z={0}>
        <group position={[0, 0, -40]}>
          <Ground top={[[-300, 552], [160, 546], [440, 556], [840, 548], [1120, 556], [1600, 548]]} color={P.snow} lip={P.snowLight} />
          {/* the lit canvas throws one flat pale shape on the snow in front */}
          {lit ? <Poly pts={[[LX + 30, Y(GY)], [RX - 30, Y(GY)], [RX + 70, Y(680)], [LX - 70, Y(680)]]} color={L === 3 ? '#8d98c8' : '#838ec0'} pos={[0, 0, 0.4]} /> : null}
          <Poly pts={[[610, Y(GY)], [672, Y(GY)], [760, Y(700)], [640, Y(700)]]} color={P.path} pos={[0, 0, 0.6]} />
          <group position={[0, 0, 0.8]}><Steps pal={P} pts={[[652, 600], [676, 618], [680, 644], [706, 662]]} /></group>
          <Poly pts={[[-300, Y(596)], [80, Y(588)], [300, Y(600)], [60, Y(606)], [-300, Y(612)]]} color={P.snowShade} pos={[0, 0, 0.2]} />
          <Poly pts={[[1000, Y(668)], [1300, Y(656)], [1600, Y(668)], [1600, Y(684)], [1290, Y(672)], [1020, Y(682)]]} color={P.snowShade} pos={[0, 0, 0.2]} />
          <group position={[0, 0, 0.8]}><Steps pal={P} pts={[[380, 640], [404, 626], [436, 620], [462, 606], [498, 600], [884, 626], [912, 640], [946, 644], [972, 660]]} /></group>
          <At x={860} y={600} dz={1}><Drift w={150} pal={P} /></At>
          <At x={560} y={664} dz={1}><Drift w={170} pal={P} /></At>
          <At x={170} y={612} dz={1}><Drift w={240} pal={P} /></At>
          <At x={1150} y={640} dz={1}><Drift w={280} pal={P} /></At>
        </group>
        <group position={[0, 0, -30]}>{g.out}</group>
        {/* hem and storm flap sit in front of the shadow, so its lap line is hidden */}
        <group position={[0, 0, -10]}>{g2.out}</group>
        {/* stovepipe smoke, and the one cough when it tips */}
        <group position={[on(0.3)[0] + 30 + tip * 2.4, on(0.3)[1] + 62, -34]}><Fx><Smoke pos={[0, 0, 0]} f={f} count={5} size={13} rise={120} spread={34} tones={P.smoke} seed={2} life={52} /></Fx></group>
        {cough >= 0 && cough < 12 ? <Disc r={(12 + cough * 1.6) * (cough > 7 ? (12 - cough) / 5 : 1)} color={P.smoke[0]} pos={[on(0.3)[0] + 62 + cough * 4, on(0.3)[1] + 74 + cough * 5, -8]} seg={24} /> : null}
        {/* the slab on the ground and its flat puff */}
        {slid ? <group position={[RX + 44, Y(GY + 22), 6]}>
          <Poly pts={[[-66, 0], [-52, 22], [-20, 34], [16, 30], [48, 18], [66, 0]]} color={P.pineSnow} /><Poly pts={[[6, 0], [16, 30], [48, 18], [66, 0]]} color={P.pineSnowShade} pos={[0, 0, 0.2]} />
          <Poly pts={[[-84, 0], [-74, 10], [-58, 0]]} color={P.pineSnow} pos={[0, 0, 0.3]} /><Poly pts={[[70, 0], [82, 9], [92, 0]]} color={P.pineSnow} pos={[0, 0, 0.3]} />
        </group> : null}
        <group position={[RX + 44, Y(GY + 14), 8]}><Fx><Puff pos={[0, 0, 0]} f={f} f0={52} dur={10} r={58} count={7} color={P.snowLight} seed={3} /></Fx></group>
        <At x={356} y={664} dz={20} s={0.82}><Campfire pal={P} f={f} lit={false} /></At>
        <At x={1056} y={612} dz={10}><Crate w={66} pal={P} snow /></At>
        <At x={1004} y={618} dz={11}><Rock w={40} pal={P} /></At>
        <At x={236} y={628} dz={14}><Rock w={52} pal={P} /></At>
        {[[220, 600, 18, 1], [480, 690, 22, 3], [860, 670, 20, 4], [1170, 600, 18, 6], [980, 690, 22, 7], [560, 690, 16, 8], [130, 668, 20, 9], [740, 640, 16, 10], [1230, 676, 22, 12], [300, 590, 14, 14], [1100, 660, 16, 15]].map(([x, y, h, s]) => <At key={s} x={x} y={y} dz={30}><Tuft h={h} pal={P} seed={s} /></At>)}
      </Layer>
      {/* the shadow on the lit canvas: the mother, the bundle (the S9 polygon, dark), the baby's arms */}
      {lit ? <Layer z={0}><group position={[MX, Y(GY - 10), -20]} scale={[MK, MK, 1]}><MotherShadow f={f} color={SHADOW} curlAt={50} arms={arms} /></group></Layer> : null}
      {/* foreground: near snow bank, then the wagon's dark edge over the leftmost 6 % (sharp) */}
      <Layer z={4}>
        <Ground top={[[-300, 700], [220, 690], [600, 706], [940, 694], [1600, 702]]} color={P.snowLight} />
        {[[420, 708, 28, 11], [1080, 706, 28, 13]].map(([x, y, h, s]) => <At key={s} x={x} y={y} dz={2}><Tuft h={h} pal={P} n={6} seed={s} /></At>)}
        <GustSnow f={f} count={SNOW.countS10 / 2} seed={8} r={2.4} speed={5.2} color="#d3dbf0" />
      </Layer>
      <Layer z={6}>{WAGON}</Layer>
    </Stage>
  );
};

export const S10: KitShot = {id: SHOT.S10.comp, len: LEN, bg: P.sky[1], Scene, liveness: liveness('medium', [
  {name: 'camera', kind: 'camera', note: 'drift-push 1 %/s centred on the apex column (PAIR), same as S9'},
  {name: 'mother shadow', kind: 'puppet', beats: [8, 50], note: 'film 488 appears rocking, 530 curls over the bundle: head down and forward, shoulders rounded, bundle to her chest (2 steps on twos)'},
  {name: 'baby shadow arms', kind: 'puppet', beats: [20], note: 'film 501 waves (21; 20 on twos)'},
  {name: 'heavy snow, 60 flakes', kind: 'ambient', family: 'weather'},
  {name: 'storm flap, green patch corner, rope tail on the pole', kind: 'ambient', family: 'cloth', beats: [34], note: 'film 514 gust: whipped about 28 degrees for 4 frames, the snow slants'},
  {name: 'inside light', kind: 'ambient', family: 'light', beats: [8, 34, 59], note: 'film 488 on, 514 dips in the gust, 539 dips and holds'},
  {name: 'stovepipe smoke', kind: 'ambient', family: 'smoke'},
  {name: 'snow slab slides and lands', kind: 'effect', beats: [46, 52], note: 'film 526 slides, 532 puff; roof sags, stovepipe tips and coughs at 50'},
])};
