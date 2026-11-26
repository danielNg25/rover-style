import React from 'react';
import {Stage, KitShot, liveness, refSpace, camPush, Rect, RoundRect, Poly, Disc, Diamond, Stroke, bezier, LightShaft, BlobShadow, PopIn,
  track, twos, hash, deg} from '../../../../kit';
import type {Pt, V3} from '../../../../kit';
import {Puppet, act, mix, beatFrames, lintBeats, puppetAttach} from '../../../../puppet';
import {KING, KING_FACE, KingBeat, KingPose} from '../../../../chars/_lib/king';
import {SHOT, PAIR, BUNDLE, bundlePts, COLORS, SCALE} from '../../shared';

/* S9 (film 435-480): THE ORDINARY KING'S STONE ROOM, redress 'royal birth'. A copy of src/shots/KingRoom.tsx rebuilt
 * on the kit as flat unlit cards (exact colours, no lit boxes, no lamp brackets, no torches), plus the hero group:
 * a tent-shaped red-and-gold canopy over a gold cradle. One motivated light: the right-hand window and its one shaft.
 * The PAIR triangle (apex 640,144; base 345.6..934.4 on y 576) is laid out with the camera of frame 0. */

const M = SHOT.S9, LEN = M.len;
const CAM_Z = 13, FOV = 30;
const m = refSpace({cam: [0, 0, CAM_Z], fov: FOV});
const PPU = m.ppu(0);                                   // 103.4 px per world unit on the hero plane
const CAM_Y = (PAIR.px.groundY - 360) / PPU;            // ground line of the hero plane on y = 576
const APEX_Y = (PAIR.px.groundY - PAIR.px.apex[1]) / PPU, HALF = PAIR.px.base / 2 / PPU;   // 4.18 high, 2.85 half base
const cam = camPush({pos: [0, CAM_Y, CAM_Z], look: [0, CAM_Y, 0], fov: FOV}, {pctPerSec: PAIR.cam.pctPerSec});
/** world point seen at a frame pixel (y down) at depth z on frame 0 */
const at = (px: number, py: number, z: number): V3 => [(px - 640) / m.ppu(z), CAM_Y - (py - 360) / m.ppu(z), z];

/** saturation of a colour pulled toward its own grey (k = share kept): the reds and golds sit 14 % calmer than the
 *  shared hexes so the throne and canopy do not shout over the grey stone */
const ds = (hex: string, k = 0.86): string => {
  const v = parseInt(hex.slice(1), 16), c = [(v >> 16) & 255, (v >> 8) & 255, v & 255], g = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  return '#' + c.map((x) => Math.round(g + (x - g) * k).toString(16).padStart(2, '0')).join('');
};
const dsAll = <T extends Record<string, string>>(o: T): T => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ds(v)])) as T;
const C = dsAll(COLORS.kingRoom);
const STONE = {mortar: '#4d4752', tones: ['#5e5660', '#645c67', '#58515b', '#686069'], dark: ['#4f4853', '#544d58', '#4a444e', '#575059'], plinth: '#6d6570', plinthTop: '#827a85', floor: '#857e7c', floor2: '#8e8785', joint: '#756e6f'};
const GOLD = dsAll({a: '#efbd46', b: '#d9a23a', c: '#c48f2e', hi: '#f6d168'}), RED = dsAll({a: '#a8152b', b: '#8a1024', carpet: '#86142a'});
const PILLAR = {body: '#463f4e', shade: '#39333f', edge: '#6a6272', joint: '#2f2a35'};
const BLUE = {flag: '#2c3f8c', flag2: '#263677', pane: '#31428f', pane2: '#4f61b0'};

// ------------------------------------------------------------------------------------------------ the room
const Wall: React.FC = () => {
  const out: React.ReactNode[] = [];
  const cw = 2.4, ch = 1.3;
  for (let r = 0; r < 7; r++) for (let i = -6; i <= 6; i++) {
    const x = i * cw + (r % 2 ? cw / 2 : 0), y = 0.5 + r * ch + ch / 2, k = hash(i + 20, r);
    // one flat darker band: the top courses and the far corners fall away from the window light
    const dim = r >= 4 || Math.abs(x) > 7.4;
    out.push(<Rect key={`b${r}.${i}`} w={cw - 0.07} h={ch - 0.07} pos={[x, y, -3.98]} color={(dim ? STONE.dark : STONE.tones)[Math.floor(k * 4) % 4]} />);
    if (hash(i, r + 9) > 0.8) out.push(<Poly key={`c${r}.${i}`} pts={[[-cw / 2 + 0.04, ch / 2 - 0.04], [-cw / 2 + 0.5, ch / 2 - 0.04], [-cw / 2 + 0.04, ch / 2 - 0.36]]} color={STONE.mortar} pos={[x, y, -3.975]} />);
    if (hash(i, r + 31) > 0.86) out.push(<Rect key={`l${r}.${i}`} w={cw - 0.07} h={0.09} pos={[x, y + ch / 2 - 0.08, -3.975]} color="#716973" />);
  }
  return (
    <group>
      <Rect w={32} h={16} pos={[0, 6, -4]} color={STONE.mortar} />
      <Rect w={32} h={9} pos={[0, 5.7 + 4.5, -3.99]} color="#423c47" />
      {out}
      {/* plinth course and skirting */}
      <Rect w={32} h={0.5} pos={[0, 0.25, -3.96]} color={STONE.plinth} />
      <Rect w={32} h={0.08} pos={[0, 0.5, -3.955]} color={STONE.plinthTop} />
      {[-9.5, -6.3, -3.1, 0.2, 3.3, 6.5, 9.6].map((x) => <Rect key={x} w={0.05} h={0.44} pos={[x, 0.25, -3.955]} color={STONE.mortar} />)}
      {/* two old cracks */}
      <Stroke pts={[[1.2, 5.05], [1.32, 4.6], [1.18, 4.3], [1.3, 3.95]]} width={0.045} color="#3f3a45" pos={[0, 0, -3.97]} />
      <Stroke pts={[[6.1, 2.45], [5.95, 2.1], [6.08, 1.8]]} width={0.04} color="#3f3a45" pos={[0, 0, -3.97]} />
    </group>
  );
};

const Floor: React.FC = () => (
  <group rotation={[-Math.PI / 2, 0, 0]}>
    {/* local x = world x, local y = -world z, local z = world y */}
    <Rect w={34} h={24} pos={[0, -3, 0]} color={STONE.floor} />
    {[-3.2, -1.6, 0, 1.6, 3.2, 4.8, 6.4, 8].map((z, r) => (
      <group key={z}>
        <Rect w={34} h={0.05} pos={[0, -z, 0.004]} color={STONE.joint} />
        {[-12, -9, -6, -3, 0, 3, 6, 9, 12].map((x) => <Rect key={x} w={0.05} h={1.6} pos={[x + (r % 2 ? 1.5 : 0), -z - 0.8, 0.004]} color={STONE.joint} />)}
        {[-9, -3, 6].map((x, i) => (hash(r, i) > 0.45 ? <Rect key={`s${x}`} w={2.95} h={1.55} pos={[x + (r % 2 ? 3 : 1.5) , -z - 0.8, 0.003]} color={STONE.floor2} /> : null))}
      </group>
    ))}
    {/* the red carpet with gold borders: a runner from the throne, a wide rug under the canopy */}
    <Rect w={2.1} h={12} pos={[-4.75, -4.2, 0.008]} color={GOLD.b} /><Rect w={1.76} h={12} pos={[-4.75, -4.2, 0.012]} color={RED.carpet} />
    <Rect w={9.0} h={4.3} pos={[0, -0.55, 0.016]} color={GOLD.b} /><Rect w={8.6} h={3.9} pos={[0, -0.55, 0.02]} color={RED.carpet} />
    <Rect w={7.9} h={0.07} pos={[0, -0.55 + 1.6, 0.024]} color={GOLD.c} /><Rect w={7.9} h={0.07} pos={[0, -0.55 - 1.6, 0.024]} color={GOLD.c} />
    {[-3.95, 3.95].map((x) => <Rect key={x} w={0.07} h={3.27} pos={[x, -0.55, 0.024]} color={GOLD.c} />)}
    {[-3.2, 3.2].map((x) => <Diamond key={x} w={0.3} h={0.42} pos={[x, -1.75, 0.024]} color={GOLD.c} />)}
  </group>
);

const Window: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Rect w={1.8} h={2.35} color="#7f7782" />
    <Poly pts={[[-0.9, 1.175], [0, 1.62], [0.9, 1.175]]} color="#7f7782" />
    <Rect w={1.42} h={2.0} pos={[0, 0, 0.004]} color="#453f4b" />
    <Rect w={1.26} h={1.84} pos={[0, 0, 0.008]} color={BLUE.pane} />
    <Rect w={1.26} h={0.62} pos={[0, -0.61, 0.012]} color={BLUE.pane2} />
    <Poly pts={[[-0.63, -0.92], [-0.63, -0.6], [-0.3, -0.25], [-0.05, -0.55], [0.22, -0.32], [0.63, -0.72], [0.63, -0.92]]} color="#8e9cc4" pos={[0, 0, 0.016]} />
    <Poly pts={[[-0.3, -0.25], [-0.4, -0.36], [-0.3, -0.34], [-0.22, -0.4], [-0.19, -0.34]]} color="#f6f8fd" pos={[0, 0, 0.018]} />
    <Rect w={0.07} h={1.84} pos={[0, 0, 0.02]} color="#5a5462" />
    {[-0.3, 0.32].map((y) => <Rect key={y} w={1.26} h={0.06} pos={[0, y, 0.02]} color="#5a5462" />)}
    <Rect w={2.1} h={0.2} pos={[0, -1.26, 0.024]} color="#958d97" /><Rect w={1.9} h={0.09} pos={[0, -1.4, 0.022]} color="#514a56" />
  </group>
);

/** Blue pennant with gold trim: a triangle fixed along its top edge, the point sways on twos */
const Pennant: React.FC<{pos: V3; w: number; h: number; f: number; seed: number; amp: number}> = ({pos, w, h, f, seed, amp}) => {
  // cloth is on twos like everything else, but on the OFF beat (odd frames): it never changes on the king's frames
  const ph = (twos(f + 1) / 2) * 0.42 + seed * 2.3, N = 6;
  const off = (v: number) => amp * w * v * v * Math.sin(ph - v * 1.4);
  const edge = (k: number): Pt[] => { const L: Pt[] = [], R: Pt[] = []; for (let j = 0; j <= N; j++) { const v = j / N; L.push([-(w / 2) * k * (1 - v) + off(v * k), -v * h * k]); R.push([(w / 2) * k * (1 - v) + off(v * k), -v * h * k]); } return [...L, ...R.reverse().slice(1)]; };
  return (
    <group position={pos}>
      <Poly pts={edge(1)} color={GOLD.b} />
      <group position={[0, -0.001, 0.004]}><Poly pts={edge(0.8)} color={BLUE.flag} /></group>
      <Rect w={w * 0.8} h={0.14} pos={[0, -0.07, 0.008]} color={BLUE.flag2} />
      <Diamond w={0.2} h={0.28} pos={[off(0.4), -h * 0.36, 0.008]} color={GOLD.a} />
      <Rect w={w + 0.5} h={0.12} pos={[0, 0.04, 0.01]} color="#3f3a45" />
    </group>
  );
};

/** The gold throne with the red back, flat: 3 golds, 2 reds (shapes of KingThrone, no lit solids) */
const Throne: React.FC = () => (
  <group>
    {/* stone dais, two steps */}
    <Rect w={7.4} h={0.42} pos={[0, 0.21, 1.3]} color="#766e79" /><Rect w={7.4} h={0.07} pos={[0, 0.42, 1.31]} color="#9a929c" />
    <Rect w={8.6} h={0.2} pos={[0, 0.1, 1.5]} color="#6a626d" /><Rect w={8.6} h={0.05} pos={[0, 0.2, 1.51]} color="#8a828c" />
    <group position={[0, 0.42, 0]}>
      {/* back: red panel between two gold posts, closed by a gold crest rail and a pointed pediment */}
      <Rect w={2.7} h={7.6} pos={[0, 3.8, -0.4]} color={RED.a} />
      <Rect w={2.7} h={0.5} pos={[0, 1.4, -0.39]} color={RED.b} />
      <Rect w={0.5} h={7.6} pos={[1.1, 3.8, -0.39]} color={RED.b} />
      {[0, 1, 2, 3, 4].map((r) => [-0.7, 0, 0.7].map((x) => <Diamond key={`${r}${x}`} w={0.11} h={0.17} pos={[x + (r % 2 ? 0.35 : 0), 2.4 + r * 0.95, -0.38]} color={GOLD.b} />))}
      <Rect w={4.9} h={0.42} pos={[0, 7.75, -0.17]} color={GOLD.a} /><Rect w={4.9} h={0.12} pos={[0, 7.6, -0.16]} color={GOLD.c} />
      <Poly pts={[[-1.5, 7.96], [0, 9.0], [1.5, 7.96]]} color={GOLD.b} pos={[0, 0, -0.18]} />
      <Poly pts={[[-1.0, 7.96], [0, 8.66], [1.0, 7.96]]} color={RED.a} pos={[0, 0, -0.17]} />
      <Disc r={0.2} pos={[0, 9.12, -0.16]} color={GOLD.hi} seg={24} />
      {[-1, 1].map((k) => (
        <group key={k}>
          <Rect w={1.04} h={7.6} pos={[k * 1.86, 3.8, -0.2]} color={GOLD.a} />
          <Rect w={0.32} h={7.6} pos={[k * 1.5, 3.8, -0.19]} color={GOLD.b} />
          <Rect w={0.12} h={7.6} pos={[k * 2.3, 3.8, -0.19]} color={GOLD.hi} />
          {[2.9, 5.2].map((y) => <Rect key={y} w={1.1} h={0.16} pos={[k * 1.86, y, -0.18]} color={GOLD.c} />)}
          <Disc r={0.3} pos={[k * 1.86, 8.3, -0.16]} color={GOLD.a} seg={24} /><Rect w={0.5} h={0.14} pos={[k * 1.86, 8.0, -0.15]} color={GOLD.c} />
          {/* arm block with its knob */}
          <Rect w={1.53} h={1.68} pos={[k * 1.66, 0.84, 0.5]} color={GOLD.a} />
          <Rect w={0.3} h={1.68} pos={[k * 1.05, 0.84, 0.51]} color={GOLD.b} />
          <Rect w={1.53} h={0.14} pos={[k * 1.66, 1.75, 0.51]} color={GOLD.hi} />
          <Rect w={1.53} h={0.18} pos={[k * 1.66, 0.09, 0.51]} color={GOLD.c} />
          <Disc r={0.25} pos={[k * 2.12, 1.38, 0.52]} color={GOLD.b} seg={28} />
        </group>
      ))}
      {/* seat: red cushion with a lighter top edge, gold apron below */}
      <Rect w={1.9} h={1.15} pos={[0, 0.575, 0.3]} color={RED.b} /><Rect w={1.9} h={0.16} pos={[0, 1.2, 0.31]} color={ds('#b8243a')} />
      <Rect w={1.9} h={0.3} pos={[0, 0.15, 0.31]} color={GOLD.c} />
    </group>
  </group>
);

const Shield: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    {[-1, 1].map((k) => (
      <group key={k} rotation={[0, 0, deg(k * 32)]}>
        <Rect w={0.06} h={3.1} color="#8f8890" /><Poly pts={[[-0.11, 1.55], [0, 1.95], [0.11, 1.55]]} color="#b9b2bc" />
      </group>
    ))}
    <Poly pts={[[-0.6, 0.62], [0.6, 0.62], [0.6, -0.05], [0, -0.78], [-0.6, -0.05]]} color={GOLD.b} pos={[0, 0, 0.004]} />
    <Poly pts={[[-0.5, 0.52], [0.5, 0.52], [0.5, -0.02], [0, -0.64], [-0.5, -0.02]]} color={BLUE.flag} pos={[0, 0, 0.008]} />
    <Poly pts={[[0, 0.52], [0.5, 0.52], [0.5, -0.02], [0, -0.64]]} color={BLUE.flag2} pos={[0, 0, 0.01]} />
    <Poly pts={[[-0.5, 0.22], [0, -0.1], [0.5, 0.22], [0.5, 0.02], [0, -0.3], [-0.5, 0.02]]} color={GOLD.a} pos={[0, 0, 0.012]} />
  </group>
);

/** A birth gift at the wall: banded chest with folded linen on its lid */
const Chest: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <Rect w={1.9} h={1.0} pos={[0, 0.5, 0]} color="#5c3f35" /><Rect w={1.9} h={0.3} pos={[0, 1.15, 0]} color="#6d4c3f" />
    <Rect w={1.9} h={0.07} pos={[0, 1.0, 0.004]} color="#3c2a26" />
    {[-0.7, 0.7].map((x) => <Rect key={x} w={0.16} h={1.3} pos={[x, 0.65, 0.006]} color={GOLD.c} />)}
    <Rect w={0.26} h={0.3} pos={[0, 0.95, 0.008]} color={GOLD.a} />
    <Rect w={1.3} h={0.16} pos={[0, 1.38, 0.004]} color="#f3eee0" /><Rect w={1.2} h={0.14} pos={[0.04, 1.53, 0.004]} color="#c9d6ea" /><Rect w={1.1} h={0.13} pos={[-0.03, 1.665, 0.004]} color="#f3eee0" />
  </group>
);

// ------------------------------------------------------------------------------------------------ the hero group
const tri = (y: number) => HALF * (1 - y / APEX_Y);          // half width of the PAIR triangle at height y
const HOOD_Y = 2.75, TIE: Pt = [-1.82, 1.5];
const INNER = bezier(TIE, [-0.72, 1.86], [-0.5, HOOD_Y], 14);
const CURTAIN: Pt[] = [[-tri(HOOD_Y), HOOD_Y], [-HALF, 0], [-2.12, 0], ...INNER];

const Canopy: React.FC<{f: number}> = ({f}) => {
  const ph = (twos(f + 1) / 2) * 0.5, sway = (i: number) => 7 * Math.sin(ph - i * 0.55) + 3 * Math.sin(ph * 1.7 + i);
  return (
    <group>
      {/* inside back cloth with a sparse gold diamond pattern */}
      <group position={[0, 0, -0.3]}>
        <Poly pts={[[0, 4.02], [-2.62, 0], [2.62, 0]]} color={ds('#7a1f22')} />
        <Poly pts={[[0, 4.02], [0, 0], [2.62, 0]]} color={ds('#6d1b1f')} pos={[0, 0, 0.004]} />
        {[0, 1, 2, 3].map((r) => { const y = 1.75 + r * 0.5, n = 3 - Math.floor(r * 0.8); return Array.from({length: n * 2 + 1}, (_, j) => j - n).map((j) => <Diamond key={`${r}${j}`} w={0.07} h={0.11} pos={[j * 0.46 + (r % 2 ? 0.23 : 0), y, 0.008]} color={C.gold2} />); })}
      </group>
      {/* side curtains, tied back: light side left, shade side right */}
      {[-1, 1].map((k) => (
        <group key={k} position={[0, 0, 0.25]} scale={[-k, 1, 1]}>
          <Poly pts={CURTAIN} color={k < 0 ? C.canopyRed : ds('#a62f2b')} />
          <Poly pts={[TIE, [-2.12, 0], [-2.42, 0], [-2.04, 1.56]]} color={C.canopyRed2} pos={[0, 0, 0.004]} />
          <Poly pts={[[-0.92, HOOD_Y], [-1.36, 1.74], [-1.5, 1.7], [-1.06, HOOD_Y]]} color={C.canopyRed2} pos={[0, 0, 0.004]} />
          <Poly pts={[[-1.45, HOOD_Y - 0.9], [-2.3, 0.7], [-2.42, 0.62], [-1.56, HOOD_Y - 0.95]]} color={C.canopyRed2} pos={[0, 0, 0.004]} />
          <Stroke pts={INNER} width={0.085} color={C.gold} pos={[0, 0, 0.008]} />
          <Rect w={0.75} h={0.1} pos={[-2.47, 0.05, 0.008]} color={C.gold2} />
          {/* tie-back cord and its tassel */}
          <group position={[TIE[0] - 0.08, TIE[1], 0.012]}>
            <RoundRect w={0.42} h={0.13} r={0.06} rot={[0, 0, deg(-18)]} color={C.gold} />
            <group position={[-0.1, -0.06, 0.004]} rotation={[0, 0, deg(-k * sway(k + 3) * 0.8)]}>
              <Rect w={0.05} h={0.26} pos={[0, -0.13, 0]} color={C.gold2} /><Disc r={0.085} pos={[0, -0.28, 0]} color={C.gold} seg={18} />
              <Poly pts={[[-0.085, -0.3], [0.085, -0.3], [0.12, -0.6], [-0.12, -0.6]]} color={C.gold2} />
            </group>
          </group>
        </group>
      ))}
      {/* hood: the pointed top, with a gold band, an emblem and the swaying gold fringe */}
      <group position={[0, 0, 0.27]}>
        <Poly pts={[[0, APEX_Y], [-tri(HOOD_Y), HOOD_Y], [tri(HOOD_Y), HOOD_Y]]} color={C.canopyRed} />
        <Poly pts={[[0, APEX_Y], [0, HOOD_Y], [tri(HOOD_Y), HOOD_Y]]} color={ds('#a62f2b')} pos={[0, 0, 0.004]} />
        <Poly pts={[[-tri(HOOD_Y), HOOD_Y], [tri(HOOD_Y), HOOD_Y], [tri(HOOD_Y + 0.15), HOOD_Y + 0.15], [-tri(HOOD_Y + 0.15), HOOD_Y + 0.15]]} color={C.gold} pos={[0, 0, 0.008]} />
        <Poly pts={[[-tri(HOOD_Y + 0.24), HOOD_Y + 0.24], [tri(HOOD_Y + 0.24), HOOD_Y + 0.24], [tri(HOOD_Y + 0.29), HOOD_Y + 0.29], [-tri(HOOD_Y + 0.29), HOOD_Y + 0.29]]} color={C.gold2} pos={[0, 0, 0.008]} />
        <Poly pts={[[-0.2, 3.22], [-0.2, 3.44], [-0.1, 3.34], [0, 3.52], [0.1, 3.34], [0.2, 3.44], [0.2, 3.22]]} color={C.gold} pos={[0, 0, 0.008]} />
        {Array.from({length: 13}, (_, i) => {
          const x = -0.9 + i * 0.15, long = i % 2 === 0;
          return (
            <group key={i} position={[x, HOOD_Y + 0.01, 0.012]} rotation={[0, 0, deg(sway(i))]}>
              <Rect w={0.07} h={long ? 0.3 : 0.2} pos={[0, long ? -0.15 : -0.1, 0]} color={long ? C.gold : C.gold2} />
            </group>
          );
        })}
      </group>
      {/* two thin gold poles, crossing at the peak like tent poles */}
      {[-1, 1].map((k) => (
        <group key={k} position={[0, 0, 0.3 + (k > 0 ? 0.004 : 0)]}>
          <Stroke pts={[[k * HALF, 0], [-k * 0.13, APEX_Y + 0.19]]} width={0.085} color={k < 0 ? C.gold : C.gold2} />
          <Disc r={0.075} pos={[-k * 0.13, APEX_Y + 0.21, 0.004]} color={C.crown} seg={16} />
        </group>
      ))}
    </group>
  );
};

const BW = (BUNDLE.widthFrac * 1280) / PPU;                   // the bundle drawn 9 % of frame width wide
const bpt = (x: number, y: number): Pt => [(x - 0.5) * BW, ((0.5 - y) * BW) / BUNDLE.aspect];
const ROCKER: Pt[] = (() => { const R = 5.4, a: Pt[] = [], b: Pt[] = []; for (let i = 0; i <= 12; i++) { const x = -1.8 + i * 0.3, y = R - Math.sqrt(R * R - x * x); a.push([x, y]); b.push([x, y + 0.17]); } return [...a, ...b.reverse()]; })();

const Cradle: React.FC<{f: number; rock: number; crownAt: number}> = ({f, rock, crownAt}) => (
  <group rotation={[0, 0, deg(rock)]}>
    {/* rockers with curled ends */}
    <Poly pts={ROCKER} color={C.gold2} />
    {[-1.8, 1.8].map((x) => <Disc key={x} r={0.13} pos={[x, 0.42, 0.002]} color={C.gold2} seg={18} />)}
    {/* legs */}
    {[-1.05, 1.05].map((x) => <Rect key={x} w={0.2} h={0.32} pos={[x, 0.26, 0.002]} color={C.gold2} />)}
    {/* headboard (left) and footboard (right) */}
    <RoundRect w={0.5} h={1.5} r={0.22} pos={[-1.36, 1.12, 0.004]} color={C.gold2} />
    <Disc r={0.13} pos={[-1.36, 1.95, 0.004]} color={C.crown} seg={18} />
    <RoundRect w={0.42} h={1.1} r={0.18} pos={[1.36, 0.92, 0.004]} color={C.gold2} />
    <Disc r={0.11} pos={[1.36, 1.54, 0.004]} color={C.crown} seg={18} />
    {/* body */}
    <Poly pts={[[-1.22, 0.36], [1.22, 0.36], [1.42, 1.1], [-1.42, 1.1]]} color={C.gold} pos={[0, 0, 0.008]} />
    <Poly pts={[[-1.22, 0.36], [1.22, 0.36], [1.26, 0.5], [-1.26, 0.5]]} color={C.gold2} pos={[0, 0, 0.012]} />
    <Poly pts={[[-1.3, 0.62], [1.3, 0.62], [1.36, 0.86], [-1.36, 0.86]]} color={C.canopyRed} pos={[0, 0, 0.012]} />
    {[-0.9, -0.3, 0.3, 0.9].map((x) => <Diamond key={x} w={0.1} h={0.085} pos={[x, 0.74, 0.016]} color={C.crown} />)}
    {[-0.6, 0, 0.6].map((x) => <Disc key={x} r={0.065} pos={[x, 0.74, 0.016]} color={C.crown} seg={14} />)}
    <Rect w={2.95} h={0.13} pos={[0, 1.1, 0.016]} color={C.crown} />
    {/* pillow, linen over the rim, the bundle (no face), then the crown */}
    <RoundRect w={0.85} h={0.34} r={0.15} pos={[-0.72, 1.3, 0.014]} color="#e2dccb" />
    <Poly pts={[[-1.05, 1.17], [1.05, 1.17], [1.05, 1.0], [0.84, 0.9], [0.63, 1.0], [0.42, 0.9], [0.21, 1.0], [0, 0.9], [-0.21, 1.0], [-0.42, 0.9], [-0.63, 1.0], [-0.84, 0.9], [-1.05, 1.0]]} color={BUNDLE.s9.fill} pos={[0, 0, 0.02]} />
    <Rect w={2.1} h={0.045} pos={[0, 1.08, 0.022]} color={BUNDLE.s9.fold} />
    <group position={[-0.02, 1.4, 0.026]}>
      <Poly pts={bundlePts(BW)} color={BUNDLE.s9.fill} />
      <Poly pts={[bpt(0.3, 0.02), bpt(0.47, 0.0), bpt(0.72, 1), bpt(0.54, 1)]} color={BUNDLE.s9.fold} pos={[0, 0, 0.004]} />
      <Poly pts={[bpt(0, 0.5), bpt(0.12, 0.15), bpt(0.2, 0.56)]} color={BUNDLE.s9.fold} pos={[0, 0, 0.004]} />
      <PopIn f={f} f0={crownAt} pos={[0.1, 0.22, 0.01]} puff="#f3eee0" puffR={0.3}>
        <Poly pts={[[-0.19, 0], [-0.19, 0.2], [-0.095, 0.11], [0, 0.27], [0.095, 0.11], [0.19, 0.2], [0.19, 0]]} color={C.crown} />
        <Rect w={0.38} h={0.07} pos={[0, 0.035, 0.004]} color={C.gold2} />
      </PopIn>
    </group>
    {/* rocking bar with a knob: the king's hand rests here */}
    <Rect w={1.0} h={0.09} pos={[1.86, 1.33, 0.3]} color={C.gold2} />
    <Disc r={0.12} pos={[2.37, 1.33, 0.304]} color={C.crown} seg={18} />
  </group>
);

// ------------------------------------------------------------------------------------------------ the king
const KING_Z = 0.5, KING_H = (SCALE.frameShare.S9.king * 720) / m.ppu(KING_Z), KING_X = 3.75;
const CROWN_AT = 22, THROW_AT = 34, JOY_AT = THROW_AT + 2;
const rockDeg = (f: number) => BUNDLE.rock.deg * Math.sin((twos(f) / BUNDLE.rock.period) * Math.PI * 2);
/* The arm throw is STAGED (bible 8.5): 32 anticipation (arms tuck in, knees dip) | 34 the in-between drawing: the
 * hanging arms flung out to shoulder height, face unchanged | 36 the raised-arm drawings land beside the head and
 * the face flips to joy | 38-40 they carry on up past the pose (overshoot) | 42-46 settle. The whole-arm drawings are
 * swapped, so the in-between is the old drawing turned at the shoulder (raw part turn on top of the channel). */
const BEATS: KingBeat[] = [
  {f: 0, note: 'rocking the cradle with the hanging arm, smug', ...KING_FACE.smug, handL: 'rest', handR: 'rest', shL: 0, shR: 2},
  {f: 8, note: "'Kings': proud, eyes half shut, small hop (cycle)", ...KING_FACE.squint, lean: -1.5},
  {f: 20, blink: true, note: 'looks down at the bundle as the crown lands', ...KING_FACE.smug, lean: -2.5},
  {f: 32, note: 'anticipation: lets go of the cradle, dips (cycle)', lean: -1},
  {f: JOY_AT, note: "'castles': arms up beside the head, eyes shut in a laugh (joy face drawn over the calm head)", eyeOpen: 0, sel: {head: 'calm'}, handL: 'up', handR: 'up', shL: 33, shR: 31, lean: 0},
  {f: 44, note: 'settles out of the overshoot', shL: 27, shR: 25},
];
/** A small hop on twos for a tall single-body rig (the kit hop squashes 10 %, which on this 986 px rig moves the
 *  crown about 100 px in one drawing and fails the pop check): crouch, up, top, down, land, settle. h in rig px. */
const smallHop = (f: number, f0: number, h: number): KingBeat | Record<string, never> => {
  const i = Math.floor((twos(f) - f0) / 2);
  const seq = [{squash: 0.02}, {bodyY: h * 0.7, squash: -0.01}, {bodyY: h, squash: -0.015}, {bodyY: h * 0.6}, {squash: 0.025}, {squash: 0.01}];
  return i >= 0 && i < seq.length ? (seq[i] as KingBeat) : {};
};
const RIG_PX = KING.height / (SCALE.frameShare.S9.king * 720);   // rig px per frame px
const armStage = (f: number): KingPose => {
  const q = twos(f);
  if (q < 32) return {shL: 17 + 4.4 * rockDeg(f)};
  if (q < 34) return {shL: 5, shR: -8};
  if (q < JOY_AT) return {shL: 35, shR: 33, parts: {restL: {rot: 42}, restR: {rot: -42}}};
  // the raised-arm drawings turned further at the shoulder: beside the head on landing, past the ears on the overshoot
  const up = q < 38 ? 4 : q < 42 ? 12 : 8, lift = q < 38 ? 0 : q < 42 ? -46 : -32;
  return {parts: {upL: {rot: up, y: lift}, upR: {rot: -up, y: lift}}};
};
const extra = (f: number) => mix(armStage(f), smallHop(f, 8, 5 * RIG_PX), smallHop(f, 32, 6 * RIG_PX));
const kingAt = (f: number) => mix(act(BEATS, f, {rig: KING, seed: 3}), extra(f));
const problems = lintBeats({king: {beats: BEATS, rig: KING, seed: 3, extra}}, LEN);

/** The joy face, drawn over the calm head from JOY_AT: laughing eyes shut into two arcs (the rig's lids close under
 *  them), lifted cheeks, a wide open smile with teeth and tongue. Flat shapes in the body picture's own pixels,
 *  riding on the body piece, so it hops, leans and squashes with him on twos. */
const J = (x: number, y: number): Pt => [x - 265, 260 - y];
const MOUTH: Pt[] = [...bezier(J(204, 298), J(266, 420), J(328, 298), 16), ...bezier(J(328, 298), J(266, 322), J(204, 298), 10).slice(1, -1)];
const TEETH: Pt[] = [...bezier(J(222, 306), J(266, 320), J(310, 306), 8), ...bezier(J(304, 316), J(266, 336), J(228, 316), 8)];
const JoyFace: React.FC<{f: number}> = ({f}) => {
  const a = puppetAttach(KING, kingAt(f), 'body', [265, 260], KING_H, [KING_X, 0, KING_Z], false, 1), s = KING_H / KING.height;
  return (
    <group position={a.pos} rotation={[0, 0, a.rot]} scale={[s, s, 1]}>
      {[207, 324].map((x) => <Disc key={`s${x}`} r={57} sy={0.62} pos={[...J(x, 228), 0]} color="#ecb08b" seg={28} />)}
      {[207, 324].map((x) => <Stroke key={x} pts={bezier(J(x - 36, 242), J(x, 192), J(x + 36, 242), 12)} width={11} color="#4a2616" pos={[0, 0, 0.002]} />)}
      {[168, 362].map((x) => <Disc key={x} r={24} sy={0.62} pos={[...J(x, 272), 0]} color="#f2a48c" seg={24} />)}
      <Poly pts={MOUTH} color="#5a1b1b" />
      <Poly pts={TEETH} color="#f7f0e2" pos={[0, 0, 0.002]} />
      <Disc r={25} sy={0.55} pos={[...J(266, 344), 0.002]} color="#ee7f86" seg={24} />
    </group>
  );
};

const Scene: React.FC<{f: number; t: number}> = ({f}) => {
  if (problems.length) throw new Error(`S9 king: ${problems.join('; ')}`);
  const gust = track(f, [[0, 0], [JOY_AT, 1], [JOY_AT + 6, 0]], 4);     // the pennants catch his arm throw
  const win = at(832, 138, -3.9), pL = at(452, -6, -3.6), pR = at(1150, -6, -3.6), fg = (77 - 640) / m.ppu(8);
  return (
    <Stage cam={cam} f={f} len={LEN} mood="dayInterior" bg={STONE.mortar} name={M.comp}>
      <Wall />
      <Floor />
      <Window pos={at(150, 138, -3.9)} />
      <Window pos={win} />
      <LightShaft pos={[win[0] + 0.1, win[1] - 1.3, -3.86]} angle={24} w0={1.3} w1={2.5} len={5.4} f={f} color="#d8cdd9" opacity={0.15} />
      <Pennant pos={pL} w={3.1} h={1.9} f={f} seed={1} amp={0.035 + gust * 0.05} />
      <Pennant pos={pR} w={3.1} h={1.9} f={f} seed={2} amp={0.035 + gust * 0.07} />
      <Shield pos={at(1218, 268, -3.8)} />
      <Chest pos={[7.0, 0, -2.6]} />
      <group position={[-4.75, 0, -2.5]} scale={0.6}><Throne /></group>
      {/* hero group on the centre line */}
      <BlobShadow pos={[0, 0.03, 0.35]} r={2.7} sy={0.3} opacity={0.3} />
      <Canopy f={f} />
      <Cradle f={f} rock={rockDeg(f)} crownAt={CROWN_AT} />
      <BlobShadow pos={[KING_X, 0.035, KING_Z + 0.1]} r={1.05} sy={0.28} opacity={0.32} />
      <Puppet rig={KING} pose={kingAt} height={KING_H} pos={[KING_X, 0, KING_Z]} shadow={false} tint="#efe4e6" />
      {twos(f) >= JOY_AT ? <JoyFace f={f} /> : null}
      {/* foreground stone pillar edge, sharp, leftmost 6 % of the frame on frame 0 */}
      <group position={[fg, 0, 8]}>
        <Rect w={3} h={12} pos={[-1.5, 3, 0]} color={PILLAR.body} />
        <Rect w={0.04} h={12} pos={[-0.02, 3, 0.004]} color={PILLAR.edge} />
        <Rect w={0.13} h={12} pos={[-0.105, 3, 0.004]} color={PILLAR.shade} />
        {[1.55, 2.2, 2.85].map((y) => <Rect key={y} w={3} h={0.022} pos={[-1.5, y, 0.006]} color={PILLAR.joint} />)}
        {[1.85, 2.5].map((y) => <Rect key={y} w={0.02} h={0.62} pos={[-0.21, y + 0.02, 0.006]} color={PILLAR.joint} />)}
        {/* stepped base and the start of the capital: both stand out past the shaft, so the edge reads as a near pillar */}
        <Rect w={3} h={1.25} pos={[-1.5 + 0.13, 0.625, 0.008]} color={PILLAR.body} /><Rect w={3} h={0.05} pos={[-1.5 + 0.13, 1.25, 0.01]} color={PILLAR.edge} />
        <Rect w={3} h={1.0} pos={[-1.5 + 0.21, 0.5, 0.012]} color={PILLAR.shade} /><Rect w={3} h={0.04} pos={[-1.5 + 0.21, 1.0, 0.014]} color={PILLAR.edge} />
        <Rect w={3} h={3} pos={[-1.5 + 0.12, 3.16 + 1.5, 0.008]} color={PILLAR.body} /><Rect w={3} h={0.05} pos={[-1.5 + 0.12, 3.16, 0.01]} color={PILLAR.shade} />
        <Rect w={3} h={3} pos={[-1.5 + 0.2, 3.3 + 1.5, 0.012]} color={PILLAR.shade} />
      </group>
    </Stage>
  );
};

export const S9_SHOT: KitShot = {id: M.comp, len: LEN, bg: STONE.mortar, Scene, liveness: liveness('medium', [
  {name: 'camera', kind: 'camera', note: 'drift-push 1 %/s on the apex column (PAIR.cam); the foreground pillar edge parallaxes'},
  {name: 'king', kind: 'puppet', beats: beatFrames(BEATS).filter((b) => b > 0), note: '8 proud + hop, 20 blink and look, 32 anticipation, 34 arms flung out (in-between), 36 arms up and joy face, 44 settle'},
  {name: 'blue pennants, canopy fringe and tie-back tassels', kind: 'ambient', family: 'cloth', note: 'pennants swing wider from 37'},
  {name: 'cradle rocking with the bundle', kind: 'ambient', family: 'mechanical', note: 'plus and minus 4 degrees, period 16 f, on twos'},
  {name: 'window light shaft', kind: 'ambient', family: 'light', note: 'the one shaft, 15 %'},
  {name: 'crown pops onto the bundle', kind: 'effect', beats: [CROWN_AT], note: 'film 457 (458 on twos), flat puff, no sparkle'},
])};
