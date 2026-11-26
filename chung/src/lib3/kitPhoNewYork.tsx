import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {B} from './kit';
import {tex} from './kitLab';
import {Wall} from './detail';
import {Awning} from './detail';
import {Ctx, P, rnd, paintCloud} from './depth';
import {FacetLathe} from './look';

/** lib3/kitPhoNewYork: pieces of a NEW YORK STREET OF THE 1960s (the street in front of the Fantastic Four's headquarters).
 *  Nothing here is 1880s (that is kitNyStreet: gas lamps, cobbles): steel lamp posts, plate-glass shopfronts, striped awnings,
 *  fire escapes, TV aerials, parking meters, cars with tail fins. Flat shapes in two or three tones, hard edges.
 *  Local frame of a building: the street front at z = 0 facing +z, centred on x = 0, `d` deep behind it (-z). */
type V3 = [number, number, number];

export const FF_BLUE = '#2a5db0', FF_BLUE_DK = '#1d4584', FF_WHITE = '#f4f1e8';

// ---------------------------------------------------------------- the emblem: a ring and a numeral 4, drawn with strokes (no font)
export const paintEmblem = (c: Ctx, W: number, H: number, bg: string | null = FF_BLUE, ring = FF_WHITE, ink = FF_WHITE) => {
  if (bg) { c.fillStyle = bg; c.fillRect(0, 0, W, H); }
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
  c.lineCap = 'butt'; c.lineJoin = 'miter';
  c.strokeStyle = ring; c.lineWidth = R * 0.14; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  // the numeral: a stem, a bar, a slanted stroke
  const s = R * 0.62, w = R * 0.2; c.strokeStyle = ink; c.lineWidth = w;
  c.beginPath(); c.moveTo(cx + s * 0.28, cy - s * 1.0); c.lineTo(cx + s * 0.28, cy + s * 1.0); c.stroke();
  c.beginPath(); c.moveTo(cx - s * 0.95, cy + s * 0.42); c.lineTo(cx + s * 0.95, cy + s * 0.42); c.stroke();
  c.beginPath(); c.moveTo(cx + s * 0.28, cy - s * 1.0); c.lineTo(cx - s * 0.95, cy + s * 0.42); c.stroke();
};
const emblemTex = (key: string, bg: string | null, ring = FF_WHITE, ink = FF_WHITE) => tex(key, 256, 256, (c, W, H) => paintEmblem(c, W, H, bg, ring, ink));

/** the round badge, standing on a wall (faces +z) */
export const Badge: React.FC<{pos: V3; r?: number; flat?: boolean}> = ({pos, r = 0.9}) => {
  const m = emblemTex('pny-badge', null);
  return (
    <group position={pos}>
      <mesh position={[0, 0, 0.02]}><circleGeometry args={[r, 40]} /><meshLambertMaterial color={FF_BLUE} /></mesh>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[r * 2, r * 2]} /><meshBasicMaterial map={m} transparent depthWrite={false} /></mesh>
      <mesh position={[0, 0, 0.012]}><ringGeometry args={[r, r * 1.1, 40]} /><meshLambertMaterial color="#c9a54a" /></mesh>
    </group>
  );
};

/** a long banner with the emblem hanging from a short pole out of the wall. buoc 0..1 = how far it is let down (0 = rolled up on its pole), f = frame for the sway */
export const Banner: React.FC<{pos: V3; w?: number; len?: number; buoc?: number; f?: number; seed?: number}> = ({pos, w = 1.3, len = 4.2, buoc = 1, f = 0, seed = 1}) => {
  const m = useMemo(() => tex('pny-banner', 256, 640, (c, W, H) => {
    c.fillStyle = FF_BLUE; c.fillRect(0, 0, W, H); c.fillStyle = FF_BLUE_DK; c.fillRect(0, 0, 22, H); c.fillStyle = '#c9a54a'; c.fillRect(W - 14, 0, 14, H);
    c.save(); c.translate(0, 70); paintEmblem(c, W, W, null); c.restore();
    c.fillStyle = FF_WHITE; c.fillRect(30, H - 70, W - 60, 10); c.fillStyle = '#c9a54a'; for (let x = 30; x < W - 30; x += 24) { c.beginPath(); c.moveTo(x, H - 50); c.lineTo(x + 10, H - 22); c.lineTo(x + 20, H - 50); c.fill(); }
  }), []);
  const L = Math.max(0.12, len * buoc), sway = Math.sin(f * 0.07 + seed) * 0.05 * buoc, flap = Math.sin(f * 0.19 + seed * 2) * 0.04;
  return (
    <group position={pos}>
      <B p={[0, 0, 0.12]} s={[w + 0.5, 0.06, 0.06]} c="#2a2a30" />
      {[-1, 1].map((k) => <B key={k} p={[k * (w / 2 + 0.2), 0, 0.12]} s={[0.1, 0.1, 0.1]} c="#c9a54a" cast={false} />)}
      <group position={[0, -0.04, 0.14]} rotation={[0, sway, 0]}>
        <mesh position={[0, -L / 2, 0]} rotation={[flap, 0, 0]} castShadow><planeGeometry args={[w, L]} /><meshLambertMaterial map={m} side={THREE.DoubleSide} /></mesh>
        {buoc < 0.98 ? <mesh position={[0, -L - 0.05, 0.02]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, w, 10]} /><meshLambertMaterial color={FF_BLUE_DK} /></mesh> : null}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- the headquarters
export const HQ = {w: 10.4, d: 10, h: 24, tower: 38, landing: 0.6, canopy: [0, 4.9, 0] as V3, oCua: [0, 9.1, 0.12] as V3, door: [0, 0.6, 0.1] as V3};
const stone = '#cfc2a2', stoneLt = '#e4dac0', stoneDk = '#a99a7a', glass = '#7fa6bb', glassDk = '#4d7388', steel = '#3d464d';
const glassTex = () => tex('pny-glass', 128, 256, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#a9cde0'); g.addColorStop(0.55, '#7ca2b8'); g.addColorStop(1, '#5e8399'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,0.28)'; c.beginPath(); c.moveTo(0, H * 0.7); c.lineTo(W * 0.5, 0); c.lineTo(W * 0.78, 0); c.lineTo(0, H); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.moveTo(W * 0.3, H); c.lineTo(W, H * 0.25); c.lineTo(W, H * 0.45); c.lineTo(W * 0.55, H); c.fill();
});
const lobbyTex = () => tex('pny-lobby', 512, 512, (c, W, H) => {
  // warm interior seen through the glass: a pale wall, a wood-panel dado, a big mural with the emblem, a reception desk, plants, hanging lamps, a staircase to the left
  c.fillStyle = '#f3e3bc'; c.fillRect(0, 0, W, H); c.fillStyle = '#e4cf9c'; c.fillRect(0, 0, W, H * 0.1);
  c.fillStyle = '#9a7a52'; c.fillRect(0, H * 0.66, W, H * 0.34); c.fillStyle = '#b8935f'; c.fillRect(0, H * 0.66, W, H * 0.03);
  c.fillStyle = '#c9a54a'; c.fillRect(W * 0.34, H * 0.16, W * 0.34, H * 0.4); c.fillStyle = '#2a5db0'; c.fillRect(W * 0.355, H * 0.19, W * 0.31, H * 0.34);
  c.save(); c.translate(W * 0.355, H * 0.21); c.scale(0.31 * W / 256, 0.31 * W / 256); c.strokeStyle = '#f4f1e8'; c.lineWidth = 10; c.beginPath(); c.arc(128, 100, 68, 0, 7); c.stroke(); c.lineWidth = 15; c.beginPath(); c.moveTo(138, 54); c.lineTo(138, 146); c.moveTo(80, 120); c.lineTo(168, 120); c.moveTo(138, 54); c.lineTo(80, 120); c.stroke(); c.restore();
  c.fillStyle = '#6a4a30'; c.fillRect(W * 0.3, H * 0.58, W * 0.42, H * 0.09); c.fillStyle = '#e8dcc0'; c.fillRect(W * 0.3, H * 0.575, W * 0.42, H * 0.018);
  c.fillStyle = '#c9c2b0'; for (let i = 0; i < 6; i++) c.fillRect(W * 0.02 + i * W * 0.022, H * (0.52 + i * 0.022), W * 0.12 - i * W * 0.022 * 0.0, H * 0.02);
  [[0.1, 0.5], [0.9, 0.52]].forEach(([x, y]) => { c.fillStyle = '#5a4332'; c.fillRect(W * x - 8, H * (y + 0.08), 16, H * 0.1); c.fillStyle = '#4f8a4a'; [[0, 0], [-22, 12], [22, 10], [-10, -18], [12, -16]].forEach(([dx, dy]) => { c.beginPath(); c.ellipse(W * x + dx, H * y + dy + 30, 22, 28, 0.3, 0, 7); c.fill(); }); });
  [0.28, 0.5, 0.72].forEach((x) => { c.fillStyle = '#2a2a30'; c.fillRect(W * x - 1.5, 0, 3, H * 0.08); c.fillStyle = '#fff4cf'; c.beginPath(); c.ellipse(W * x, H * 0.09, 16, 10, 0, 0, 7); c.fill(); });
  c.fillStyle = '#3d6aa8'; c.fillRect(W * 0.76, H * 0.48, W * 0.08, H * 0.2); c.fillStyle = '#d98a3a'; c.fillRect(W * 0.78, H * 0.52, W * 0.1, H * 0.16);
});

/** the front of the headquarters, a block of stone and glass with a tall lobby, a canopy over the doors (the badge on its fascia), five floors of ribbon windows and a setback tower.
 *  oCuaLit 0..1 = the middle window of the second floor flashes (shot 25 of d1c12). Landing at y = HQ.landing (the steps stand in front, see `BacThem`). */
export const Headquarters: React.FC<{pos: V3; oCuaLit?: number; f?: number; banners?: number}> = ({pos, oCuaLit = 0, f = 0, banners = 1}) => {
  const {w, d, h, tower, landing} = HQ, G = 5.0, floors = 5, fh = 3.7, bays = 6, bw = (w - 1.2) / bays, gm = glassTex(), lm = lobbyTex();
  const r = useMemo(() => rnd(31), []);
  const wins = useMemo(() => Array.from({length: floors * bays}, () => ({blind: r() < 0.25 ? 0.25 + r() * 0.4 : 0, lamp: r() < 0.22})), [r]);
  return (
    <group position={[pos[0], pos[1], pos[2]]}>
      {/* the block */}
      <B p={[0, (h + 1) / 2 - 1, -d / 2]} s={[w, h + 1, d]} c={stone} />
      <B p={[0, 0.3, 0.2]} s={[w + 0.6, 0.6, 0.5]} c={stoneDk} />
      {/* lobby: tall glass with a lit interior behind it, steel mullions, two pairs of doors */}
      <mesh position={[0, G / 2 + 0.2, 0.04]}><planeGeometry args={[w - 1.4, G - 0.4]} /><meshBasicMaterial map={lm} /></mesh>
      <mesh position={[0, G / 2 + 0.2, 0.09]}><planeGeometry args={[w - 1.4, G - 0.4]} /><meshBasicMaterial map={gm} transparent opacity={0.46} depthWrite={false} /></mesh>
      {Array.from({length: 9}, (_, i) => <B key={i} p={[-(w - 1.4) / 2 + ((w - 1.4) * i) / 8, G / 2 + 0.2, 0.12]} s={[0.07, G - 0.3, 0.1]} c={steel} cast={false} />)}
      {[0.9, 2.6, 4.6].map((y) => <B key={y} p={[0, y, 0.12]} s={[w - 1.3, 0.07, 0.1]} c={steel} cast={false} />)}
      {[-1, 1].map((k) => <group key={k} position={[k * 0.75, 1.4, 0.15]}><mesh><planeGeometry args={[1.4, 2.6]} /><meshBasicMaterial color="#9cc0cc" transparent opacity={0.3} depthWrite={false} /></mesh>{[-0.68, 0.68].map((q) => <B key={q} p={[q, 0, 0.01]} s={[0.06, 2.6, 0.05]} c={steel} cast={false} />)}<B p={[0, 1.27, 0.01]} s={[1.4, 0.06, 0.05]} c={steel} cast={false} /><B p={[0, -1.27, 0.01]} s={[1.4, 0.14, 0.05]} c={steel} cast={false} /><B p={[0, 0, 0.03]} s={[0.06, 2.6, 0.04]} c={steel} cast={false} /><B p={[-k * 0.55, 0, 0.05]} s={[0.05, 0.9, 0.05]} c="#d9d4c4" cast={false} /></group>)}
      {/* pilasters, stone frame round the lobby */}
      {[-4.7, -2.9, 2.9, 4.7].map((x) => <B key={x} p={[x, G / 2 + 0.2, 0.2]} s={[0.55, G + 0.4, 0.4]} c={stoneLt} />)}
      <B p={[0, G + 0.45, 0.2]} s={[w + 0.2, 0.5, 0.45]} c={stoneLt} />
      {/* the canopy over the doors: a slab, a fascia with the badge, steel rods up to the wall, little downlights */}
      <B p={[0, 4.55, 1.2]} s={[7.4, 0.22, 2.4]} c="#dcd2b8" />
      <B p={[0, 4.55, 2.43]} s={[7.5, 0.7, 0.14]} c={FF_BLUE} />
      <B p={[0, 4.2, 2.43]} s={[7.5, 0.06, 0.16]} c="#c9a54a" cast={false} />
      <Badge pos={[0, 4.58, 2.52]} r={0.3} />
      <Badge pos={[0, 5.9, 0.28]} r={1.15} />
      {[-3.4, 3.4].map((x) => <B key={x} p={[x, 4.0, 2.2]} s={[0.07, 0.6, 0.07]} c={steel} cast={false} />)}
      {[-2.4, 0, 2.4].map((x) => <mesh key={x} position={[x, 4.4, 1.8]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.18, 12]} /><meshBasicMaterial color="#fff2c4" /></mesh>)}
      {/* five floors of ribbon windows: stone piers, steel frames, blue-green glass with a sky streak, spandrel panels between floors */}
      {Array.from({length: floors}, (_, fl) => {
        const y0 = G + 0.7 + fl * fh;
        return (
          <group key={fl}>
            <B p={[0, y0 - 0.2, 0.08]} s={[w, 0.4, 0.2]} c={fl % 2 ? '#bfb292' : stoneDk} cast={false} />
            {Array.from({length: bays}, (_, bI) => {
              const x = -w / 2 + 0.6 + bw * (bI + 0.5), q = wins[fl * bays + bI], lit = fl === 1 && bI === 3 ? oCuaLit : 0;
              return (
                <group key={bI} position={[x, y0 + (fh - 0.8) / 2 + 0.1, 0.04]}>
                  <mesh><planeGeometry args={[bw - 0.5, fh - 1.0]} /><meshBasicMaterial map={gm} /></mesh>
                  {lit > 0 ? <mesh position={[0, 0, 0.012]}><planeGeometry args={[bw - 0.5, fh - 1.0]} /><meshBasicMaterial color="#fffbe6" transparent opacity={Math.min(1, lit)} depthWrite={false} /></mesh> : null}
                  {q.blind > 0 ? <mesh position={[0, (fh - 1.0) / 2 - (fh - 1.0) * q.blind / 2, 0.02]}><planeGeometry args={[bw - 0.52, (fh - 1.0) * q.blind]} /><meshLambertMaterial color="#e8dcc0" /></mesh> : null}
                  {q.lamp ? <mesh position={[0.2, -0.3, 0.02]}><planeGeometry args={[0.5, 0.3]} /><meshBasicMaterial color="#fff0c0" transparent opacity={0.8} depthWrite={false} /></mesh> : null}
                  <B p={[0, 0, 0.03]} s={[0.05, fh - 1.0, 0.07]} c={steel} cast={false} />
                  <B p={[0, (fh - 1.0) / 2, 0.04]} s={[bw - 0.4, 0.07, 0.08]} c={steel} cast={false} /><B p={[0, -(fh - 1.0) / 2, 0.04]} s={[bw - 0.4, 0.07, 0.08]} c={steel} cast={false} />
                  <B p={[-(bw - 0.5) / 2, 0, 0.04]} s={[0.07, fh - 1.0, 0.08]} c={steel} cast={false} /><B p={[(bw - 0.5) / 2, 0, 0.04]} s={[0.07, fh - 1.0, 0.08]} c={steel} cast={false} />
                  <B p={[0, -(fh - 1.0) / 2 - 0.12, 0.1]} s={[bw - 0.3, 0.1, 0.22]} c={stoneLt} />
                </group>
              );
            })}
            {Array.from({length: bays + 1}, (_, bI) => <B key={bI} p={[-w / 2 + 0.6 + bw * bI, y0 + fh / 2 - 0.2, 0.14]} s={[0.32, fh, 0.3]} c={stoneLt} />)}
          </group>
        );
      })}
      {/* cornice and the blue frieze with a row of little badges */}
      <B p={[0, G + 0.7 + floors * fh + 0.2, 0.3]} s={[w + 0.8, 0.5, 0.9]} c={stoneLt} />
      <B p={[0, G + 0.7 + floors * fh - 0.15, 0.16]} s={[w, 0.5, 0.1]} c={FF_BLUE} cast={false} />
      {[-3.6, -1.2, 1.2, 3.6].map((x) => <Badge key={x} pos={[x, G + 0.7 + floors * fh - 0.15, 0.2]} r={0.2} />)}
      {/* banners let down either side of the doors from poles out of the second floor */}
      {[-4.45, 4.45].map((x, i) => <Banner key={x} pos={[x, G + 1.9, 0.3]} buoc={banners} f={f} seed={i * 3 + 1} />)}
      {/* the setback tower and the roof */}
      <B p={[0, (h + tower) / 2, -d + 3.2]} s={[7.4, tower - h, 6.4]} c={stoneDk} />
      {Array.from({length: 4}, (_, i) => <B key={i} p={[-2.7 + i * 1.8, h + 4.4, -d + 6.45]} s={[1.0, 4.4, 0.06]} c={glassDk} cast={false} />)}
      <B p={[0, tower + 0.15, -d + 3.2]} s={[7.8, 0.3, 6.8]} c={stoneLt} />
      <Badge pos={[0, h + 8.6, -d + 6.45]} r={1.4} />
      <B p={[0, tower + 4.2, -d + 3.2]} s={[0.12, 8.4, 0.12]} c="#c8c8cc" /><B p={[0, tower + 6.0, -d + 3.2]} s={[1.3, 0.08, 0.08]} c="#c8c8cc" /><B p={[0, tower + 7.2, -d + 3.2]} s={[0.8, 0.08, 0.08]} c="#c8c8cc" />
      {[0, 1, 2].map((i) => <B key={i} p={[0, tower + 3 + i * 2.2, -d + 3.2]} s={[0.14, 0.7, 0.14]} c={i % 2 ? '#e8e4dc' : '#c83a2e'} cast={false} />)}
      {[-2.4, 1.6].map((x, i) => <B key={x} p={[x, h + 0.7, -3]} s={[1.5, 1.4, 1.1]} c={i ? '#9aa0a4' : '#b4b8b8'} />)}
      <B p={[3.4, h + 1.2, -6]} s={[0.3, 2.4, 0.3]} c="#8c8f92" />
    </group>
  );
};

// ---------------------------------------------------------------- steps, the platform, ropes
/** the wide stone steps up to the landing in front of the doors (z from 0 to 4.1 in front of the building; the landing is at y = HQ.landing) */
export const BacThem: React.FC<{pos: V3; w?: number}> = ({pos, w = 12}) => {
  const L = HQ.landing;
  return (
    <group position={pos}>
      <B p={[0, L / 2, 1.0]} s={[w, L, 2.0]} c="#d8cfb6" />
      {[0, 1, 2].map((k) => { const top = L - 0.15 * (k + 1); return <B key={k} p={[0, top / 2, 2.35 + k * 0.7]} s={[w, top, 0.7]} c={k % 2 ? '#d2c8ae' : '#dcd3ba'} />; })}
      {/* risers drawn as darker edges */}
      {[0, 1, 2, 3].map((k) => <B key={`n${k}`} p={[0, L - 0.15 * k - 0.04, 2.0 + k * 0.7 + (k ? -0.0 : 0)]} s={[w, 0.05, 0.06]} c="#b0a68a" cast={false} />)}
      {/* low walls with planters either end, a brass rail, two globe lamps at the foot */}
      {[-1, 1].map((k) => <group key={k} position={[k * (w / 2 + 0.5), 0, 1.6]}>
        <B p={[0, 0.5, 0]} s={[1.0, 1.0, 3.8]} c={stoneLt} /><B p={[0, 1.04, 0]} s={[1.1, 0.1, 3.9]} c={stone} />
        <B p={[0, 1.2, 0]} s={[0.8, 0.3, 3.4]} c="#4a3a2a" />
        {Array.from({length: 6}, (_, i) => { const q = rnd(i + (k > 0 ? 9 : 2))(); return <mesh key={i} position={[(q - 0.5) * 0.4, 1.5 + (i % 2) * 0.1, -1.5 + i * 0.6]}><icosahedronGeometry args={[0.32 + (i % 3) * 0.06, 0]} /><meshLambertMaterial color={['#4f8a4a', '#3f7340', '#5b9a52'][i % 3]} flatShading /></mesh>; })}
        {[0, 1, 2].map((i) => <mesh key={i} position={[-0.2 + i * 0.2, 1.62 + (i % 2) * 0.18, -0.6 + i * 0.5]}><icosahedronGeometry args={[0.07, 0]} /><meshBasicMaterial color={['#e2566a', '#f2c94c', '#f6f0e4'][i]} /></mesh>)}
      </group>)}
      {[-4.4, -1.5, 1.5, 4.4].map((x) => <B key={x} p={[x, L + 0.5, 0.1 + 0]} s={[0.05, 1.0, 0.05]} c="#c9a54a" cast={false} />)}
      {[-1, 1].map((k) => <group key={k} position={[k * (w / 2 + 0.5), 1.1, 3.9]}><B p={[0, 0.4, 0]} s={[0.12, 0.8, 0.12]} c="#2a2a30" /><mesh position={[0, 1.0, 0]}><sphereGeometry args={[0.22, 10, 8]} /><meshBasicMaterial color="#fff4cf" /></mesh></group>)}
    </group>
  );
};

/** the platform for the four, covered in blue cloth with a pleated white skirt and gold trim, two low steps at the front, a lectern with microphones.
 *  Local: centre of the platform's floor plan on the ground; the top is at y = 0.6. */
export const BucVai: React.FC<{pos: V3; w?: number; d?: number}> = ({pos, w = 6.2, d = 2.6}) => {
  const hh = 0.6, skirt = useMemo(() => tex('pny-skirt', 512, 64, (c, W, H) => { for (let x = 0; x < W; x += 16) { c.fillStyle = (x / 16) % 2 ? '#f4f1e8' : '#e0dccd'; c.fillRect(x, 0, 16, H); } c.fillStyle = '#c9a54a'; c.fillRect(0, 0, W, 7); }), []);
  return (
    <group position={pos}>
      <B p={[0, hh / 2 - 0.03, 0]} s={[w, hh - 0.06, d]} c="#e8e2d0" />
      <B p={[0, hh - 0.04, 0]} s={[w + 0.05, 0.08, d + 0.05]} c={FF_BLUE} />
      <B p={[0, hh - 0.095, d / 2 + 0.03]} s={[w + 0.06, 0.06, 0.04]} c="#c9a54a" cast={false} /><B p={[w / 2 + 0.03, hh - 0.095, 0]} s={[0.04, 0.06, d + 0.06]} c="#c9a54a" cast={false} /><B p={[-w / 2 - 0.03, hh - 0.095, 0]} s={[0.04, 0.06, d + 0.06]} c="#c9a54a" cast={false} />
      <mesh position={[0, hh / 2 - 0.12, d / 2 + 0.012]}><planeGeometry args={[w, hh - 0.24]} /><meshLambertMaterial map={skirt} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * (w / 2 + 0.012), hh / 2 - 0.12, 0]} rotation={[0, k * Math.PI / 2, 0]}><planeGeometry args={[d, hh - 0.24]} /><meshLambertMaterial map={skirt} /></mesh>)}
      {[-0.6, 0.6].map((x) => <group key={x}><B p={[x * 2, 0.12, d / 2 + 0.38]} s={[1.8, 0.24, 0.5]} c="#e8e2d0" /><B p={[x * 2, 0.25, d / 2 + 0.38]} s={[1.84, 0.04, 0.54]} c={FF_BLUE} /></group>)}
      {/* a lectern at the right end, two microphones, a pitcher of water */}
      <group position={[w / 2 - 0.5, hh, -d / 2 + 0.7]}>
        <B p={[0, 0.5, 0]} s={[0.55, 1.0, 0.4]} c="#6a4a30" /><B p={[0, 1.02, 0.02]} s={[0.7, 0.06, 0.5]} c="#7a5a3a" r={[-0.25, 0, 0]} />
        {[-0.14, 0.14].map((x) => <group key={x}><B p={[x, 1.2, 0.05]} s={[0.012, 0.3, 0.012]} c="#303034" r={[-0.3, 0, 0]} /><mesh position={[x, 1.34, 0.13]}><sphereGeometry args={[0.04, 8, 6]} /><meshLambertMaterial color="#5a5a62" /></mesh></group>)}
        <Badge pos={[0, 0.5, 0.215]} r={0.14} />
      </group>
    </group>
  );
};

/** a rope barrier: chromed posts with round heads and a red rope hanging between them. from -> to along x (or z). */
export const RaoDay: React.FC<{a: V3; b: V3; n?: number; rope?: string; sag?: number}> = ({a, b, n = 4, rope = '#a5262e', sag = 0.16}) => {
  const posts = Array.from({length: n + 1}, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1], a[2] + ((b[2] - a[2]) * i) / n] as V3);
  return (
    <group>
      {posts.map((p, i) => <group key={i} position={p}>
        <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.035, 0.045, 0.9, 8]} /><meshLambertMaterial color="#c8ccd0" /></mesh>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.16, 0.18, 0.04, 10]} /><meshLambertMaterial color="#9ea3a8" /></mesh>
        <mesh position={[0, 0.93, 0]}><sphereGeometry args={[0.07, 8, 6]} /><meshLambertMaterial color="#e2c25a" /></mesh>
      </group>)}
      {posts.slice(0, -1).map((p, i) => {
        const q = posts[i + 1], pts = [0, 0.25, 0.5, 0.75, 1].map((t) => new THREE.Vector3(p[0] + (q[0] - p[0]) * t, 0.82 - Math.sin(t * Math.PI) * sag, p[2] + (q[2] - p[2]) * t));
        return <mesh key={i} castShadow><tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 14, 0.028, 6, false]} /><meshLambertMaterial color={rope} /></mesh>;
      })}
    </group>
  );
};

// ---------------------------------------------------------------- a car with tail fins (seen from the side; the body is one extruded side profile)
const carShape = (pts: [number, number][]) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };
const BODY: [number, number][] = [[-2.3, 0.28], [-2.32, 0.62], [-2.18, 0.86], [-1.55, 0.88], [-1.3, 0.96], [-0.5, 0.96], [-0.35, 0.88], [1.5, 0.9], [2.1, 0.82], [2.32, 0.62], [2.3, 0.3]];
const CABIN: [number, number][] = [[-1.45, 0.88], [-1.05, 1.42], [0.55, 1.46], [1.15, 0.9]];
const GLASS: [number, number][] = [[-1.3, 0.94], [-0.98, 1.36], [-0.12, 1.4], [-0.12, 0.94]];
const GLASS2: [number, number][] = [[0.0, 0.94], [0.0, 1.4], [0.5, 1.4], [0.98, 0.94]];
/** a 1960s sedan. Length 4.6 along x, nose to the right. lat = turned on its roof (a wreck); wheels = their colour. */
export const Xe60: React.FC<{pos: V3; rotY?: number; body?: string; trim?: string; lat?: boolean; tilt?: number; roofLift?: number; wreck?: boolean}> = ({pos, rotY = 0, body = '#e9e0c8', trim = '#5aa9a0', lat = false, tilt = 0, wreck = false}) => {
  const geo = useMemo(() => ({
    body: new THREE.ExtrudeGeometry(carShape(BODY), {depth: 1.74, bevelEnabled: false}),
    cabin: new THREE.ExtrudeGeometry(carShape(CABIN), {depth: 1.5, bevelEnabled: false}),
    g1: new THREE.ExtrudeGeometry(carShape(GLASS), {depth: 1.56, bevelEnabled: false}),
    g2: new THREE.ExtrudeGeometry(carShape(GLASS2), {depth: 1.56, bevelEnabled: false}),
    fin: new THREE.ExtrudeGeometry(carShape([[-2.3, 0.86], [-2.42, 1.12], [-1.95, 0.88]]), {depth: 0.07, bevelEnabled: false}),
    stripe: new THREE.ExtrudeGeometry(carShape([[-2.28, 0.5], [2.28, 0.5], [2.3, 0.58], [-2.3, 0.58]]), {depth: 1.78, bevelEnabled: false}),
  }), []);
  return (
    <group position={pos} rotation={[0, rotY, lat ? Math.PI : tilt]} {...(lat ? {} : {})}>
      <group position={[0, lat ? -1.3 : 0, -0.87]}>
        <mesh geometry={geo.body} castShadow receiveShadow><meshLambertMaterial color={body} /></mesh>
        <mesh geometry={geo.stripe} position={[0, 0, -0.02]}><meshLambertMaterial color={trim} /></mesh>
        <mesh geometry={geo.cabin} position={[0, 0, 0.12]} castShadow><meshLambertMaterial color={body} /></mesh>
        <mesh geometry={geo.g1} position={[0, 0, 0.09]}><meshLambertMaterial color={wreck ? '#3a4e5a' : '#5a7f94'} /></mesh>
        <mesh geometry={geo.g2} position={[0, 0, 0.09]}><meshLambertMaterial color={wreck ? '#3a4e5a' : '#5a7f94'} /></mesh>
        {[0.0, 1.67].map((z) => <mesh key={z} geometry={geo.fin} position={[0, 0, z]}><meshLambertMaterial color={body} /></mesh>)}
        {/* chrome: bumpers, grille, headlamps, tail lamps, door line, side strip */}
        <B p={[2.36, 0.4, 0.87]} s={[0.14, 0.14, 1.9]} c="#d4d8dc" /><B p={[-2.36, 0.4, 0.87]} s={[0.14, 0.14, 1.9]} c="#d4d8dc" />
        <B p={[2.3, 0.62, 0.87]} s={[0.06, 0.2, 1.1]} c="#b8bcc2" cast={false} />
        {[0.28, 1.46].map((z) => <mesh key={z} position={[2.31, 0.7, z]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.13, 12]} /><meshBasicMaterial color="#fff6d8" /></mesh>)}
        {[0.2, 1.54].map((z) => <B key={z} p={[-2.32, 0.7, z]} s={[0.04, 0.12, 0.3]} c="#c83a2e" cast={false} />)}
        {[0, 1.74].map((z, i) => <group key={z}><B p={[0, 0.66, z + (i ? 0.012 : -0.012)]} s={[4.4, 0.03, 0.02]} c="#d4d8dc" cast={false} /><B p={[-0.2, 0.9, z + (i ? 0.012 : -0.012)]} s={[0.02, 0.5, 0.02]} c="#a5aaa8" cast={false} /></group>)}
        {/* wheels: black tyre, white wall, chrome cap */}
        {[-1.45, 1.4].flatMap((x) => [0.08, 1.66].map((z) => <group key={`${x}${z}`} position={[x, 0.33, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow><cylinderGeometry args={[0.33, 0.33, 0.22, 16]} /><meshLambertMaterial color="#1f1f24" /></mesh>
          <mesh position={[0, z < 1 ? -0.115 : 0.115, 0]}><cylinderGeometry args={[0.24, 0.24, 0.01, 16]} /><meshLambertMaterial color="#efece2" /></mesh>
          <mesh position={[0, z < 1 ? -0.125 : 0.125, 0]}><cylinderGeometry args={[0.13, 0.13, 0.01, 12]} /><meshLambertMaterial color="#c8ccd0" /></mesh>
        </group>))}
        <B p={[0, 0.2, 0.87]} s={[4.2, 0.3, 1.5]} c="#2a2a30" cast={false} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- an ordinary 1960s building front, with shops, fire escape, aerials, a water tank
export type ShopSpec = {awning?: [string, string]; board: string; ink: string; glass?: string; goods?: string[]};
const SHOP_SETS: ShopSpec[] = [
  {awning: ['#c8463c', '#f1ead8'], board: '#2f3a4a', ink: '#f2d36a', goods: ['#d9a441', '#c8463c', '#4f8a8f']},
  {awning: ['#3f6a5a', '#efe4cc'], board: '#6a2f3a', ink: '#f6e9c8', goods: ['#e9e0c8', '#d98a8a', '#6f9fb8']},
  {board: '#e4d29a', ink: '#2f3a4a', goods: ['#8a5a3a', '#c9a54a', '#f4f1e8']},
  {awning: ['#2f5da8', '#f1ead8'], board: '#f4f1e8', ink: '#2f5da8', goods: ['#4f8a4a', '#e2566a', '#f2c94c']},
  {awning: ['#c8923a', '#f1e8d2'], board: '#1f3a2c', ink: '#e7c96a', goods: ['#a5262e', '#e9e0c8', '#3d6aa8']},
  {board: '#3a3a40', ink: '#f2a23a', goods: ['#9ec4d6', '#f2a23a', '#e9e0c8']},
];
/** a glass shopfront: dark metal frame, plate glass with the goods on shelves behind it, a door, a signboard of coloured bars (no real words) */
const Shop: React.FC<{x: number; w: number; G: number; s: ShopSpec; seed: number; broken?: boolean; fire?: number}> = ({x, w, G, s, seed, broken, fire = 0}) => {
  const r = useMemo(() => rnd(seed * 5 + 3), [seed]), gw = w - 1.1, glassC = s.glass ?? '#8db4c4';
  const bars = useMemo(() => Array.from({length: 4}, () => ({x: r() * 0.5, w: 0.1 + r() * 0.2})), [r]);
  return (
    <group position={[x, 0, 0]}>
      <B p={[0, 1.55, 0.02]} s={[w - 0.3, 3.1, 0.08]} c="#2f3840" cast={false} />
      <mesh position={[-w * 0.1, 1.45, 0.075]}><planeGeometry args={[gw * 0.74, 2.5]} /><meshBasicMaterial color={broken ? '#1d1a18' : glassC} /></mesh>
      {!broken && (s.goods ?? []).map((g, i) => <group key={i}><B p={[-w * 0.1 - gw * 0.28 + i * gw * 0.28, 0.95, 0.35]} s={[0.5 + r() * 0.3, 0.5 + r() * 0.5, 0.4]} c={g} cast={false} /><B p={[-w * 0.1 - gw * 0.28 + i * gw * 0.28, 1.9, 0.35]} s={[0.4, 0.34 + r() * 0.3, 0.3]} c={g} cast={false} /></group>)}
      {!broken ? <mesh position={[-w * 0.1, 1.5, 0.09]}><planeGeometry args={[gw * 0.74, 2.5]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} /></mesh> : null}
      {!broken ? <mesh position={[-w * 0.1 - gw * 0.1, 1.9, 0.095]} rotation={[0, 0, 0.9]}><planeGeometry args={[0.35, 2.6]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} /></mesh> : null}
      <B p={[w / 2 - 0.55, 1.1, 0.07]} s={[0.8, 2.2, 0.05]} c="#8a98a0" cast={false} /><B p={[w / 2 - 0.55, 1.1, 0.1]} s={[0.55, 1.7, 0.03]} c={broken ? '#1d1a18' : glassC} cast={false} />
      {/* signboard: dark board with bars of colour for lettering, and a blade sign */}
      <B p={[0, 3.55, 0.1]} s={[w - 0.2, 0.7, 0.12]} c={s.board} />
      {bars.map((q, i) => <B key={i} p={[-w * 0.3 + i * w * 0.18 + q.x * 0.2, 3.55, 0.18]} s={[q.w + 0.18, 0.32, 0.02]} c={s.ink} cast={false} />)}
      {s.awning ? <group position={[0, 0, 0.1]}><Awning x={0} y={3.2} w={w - 0.5} depth={1.0} drop={0.5} a={s.awning[0]} b={s.awning[1]} /></group> : null}
      <B p={[-w / 2 + 0.55, 3.3, 0.5]} s={[0.04, 0.04, 0.8]} c="#2a2a30" cast={false} /><B p={[-w / 2 + 0.55, 3.05, 0.9]} s={[0.04, 0.5, 0.5]} c={s.ink} cast={false} />
      {fire > 0 ? <>{/* soot above the opening */}<mesh position={[-w * 0.1, 3.0, 0.1]}><planeGeometry args={[gw * 0.8, 0.9]} /><meshBasicMaterial color="#1a1614" transparent opacity={0.55 * fire} depthWrite={false} /></mesh></> : null}
    </group>
  );
};
const winTex = () => tex('pny-win', 96, 128, (c, W, H) => {
  c.fillStyle = '#e9e2d0'; c.fillRect(0, 0, W, H); c.fillStyle = '#6f8da0'; c.fillRect(8, 8, W - 16, H - 16);
  c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.moveTo(8, H - 8); c.lineTo(W * 0.6, 8); c.lineTo(W - 8, 8); c.lineTo(W - 8, H * 0.3); c.lineTo(W * 0.3, H - 8); c.fill();
  c.fillStyle = '#e9e2d0'; c.fillRect(0, H / 2 - 3, W, 6); c.fillRect(W / 2 - 2, 0, 4, H);
});
/** a building of the street: brick or stone, shops at the foot, windows with curtains, blinds, plant boxes and air-conditioners, a fire escape zig-zag, a cornice and a roof with aerials. */
export const NhaPho: React.FC<{pos: V3; w: number; h?: number; d?: number; color: string; kind?: 'brick' | 'stone'; seed?: number; shops?: number; escape?: boolean; tank?: boolean; fireShop?: number; fireAt?: number; lod?: boolean; rotY?: number; sang?: number}> =
  ({pos, w, h = 18, d = 12, color, kind = 'brick', seed = 1, shops = 1, escape = false, tank = false, fireShop = 0, fireAt, lod = false, rotY = 0, sang = 0}) => {
    const r = useMemo(() => rnd(seed * 7 + 5), [seed]), G = 4.2, floors = Math.max(2, Math.round((h - G - 1.0) / 3.1)), fh = (h - G - 1.0) / floors, cols = Math.max(2, Math.round(w / 2.7)), wm = winTex();
    const trim = kind === 'brick' ? '#e4dac2' : '#f0e8d4', dark = kind === 'brick' ? '#5a2a22' : '#7a6a4a';
    const wins = useMemo(() => Array.from({length: floors * cols}, () => ({curtain: r() < 0.45 ? ['#e8d8b0', '#d98a8a', '#9ec4d6', '#f0e6d0'][Math.floor(r() * 4)] : '', blind: r() < 0.3 ? 0.25 + r() * 0.4 : 0, plant: r() < 0.2, ac: r() < 0.22, open: r() < 0.12, flag: r() < 0.04})), [r, floors, cols]);
    const shopW = w / shops;
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <B p={[0, h / 2, -d / 2 - 0.02]} s={[w, h, d]} c={color} />
        <Wall pos={[0, 0, 0]} w={w} h={h} color={color} kind={kind} tile={kind === 'brick' ? 2.6 : 3.4} seed={seed + 2} trim={trim} />
        {/* the foot: shops */}
        {Array.from({length: shops}, (_, i) => <Shop key={i} x={-w / 2 + shopW * (i + 0.5)} w={shopW} G={G} s={SHOP_SETS[(seed + i * 2) % SHOP_SETS.length]} seed={seed + i} broken={fireShop > 0 && i === (fireAt ?? shops - 1)} fire={fireShop > 0 && i === (fireAt ?? shops - 1) ? fireShop : 0} />)}
        <B p={[0, G + 0.04, 0.12]} s={[w, 0.16, 0.26]} c={trim} />
        {/* the floors */}
        {!lod ? Array.from({length: floors}, (_, f) => Array.from({length: cols}, (_, c) => {
          const q = wins[f * cols + c], x = -w / 2 + (w * (c + 0.5)) / cols, y = G + fh * (f + 0.5) + 0.3, ww = 1.1, hh = Math.min(1.9, fh - 0.9);
          return (
            <group key={`${f}-${c}`} position={[x, y, 0.02]}>
              <B p={[0, 0, 0.03]} s={[ww + 0.28, hh + 0.28, 0.08]} c={trim} cast={false} />
              <mesh position={[0, 0, 0.08]}><planeGeometry args={[ww, hh]} /><meshBasicMaterial map={wm} /></mesh>
              {sang > 0 && ((f * 7 + c * 13 + seed * 5) % 10) / 10 < sang * 0.7 ? <mesh position={[0, 0, 0.086]}><planeGeometry args={[ww * 0.92, hh * 0.92]} /><meshBasicMaterial color="#ffd98a" transparent opacity={0.82} toneMapped={false} /></mesh> : null}
              {q.curtain ? <><mesh position={[-ww * 0.32, 0.1, 0.09]}><planeGeometry args={[ww * 0.34, hh * 0.8]} /><meshLambertMaterial color={q.curtain} /></mesh><mesh position={[ww * 0.32, 0.1, 0.09]}><planeGeometry args={[ww * 0.34, hh * 0.8]} /><meshLambertMaterial color={q.curtain} /></mesh></> : null}
              {q.blind > 0 ? <mesh position={[0, hh / 2 - (hh * q.blind) / 2, 0.095]}><planeGeometry args={[ww - 0.1, hh * q.blind]} /><meshLambertMaterial color="#e8dcc0" /></mesh> : null}
              {q.open ? <B p={[ww * 0.3, 0.1, 0.18]} s={[0.4, hh * 0.4, 0.04]} c="#e9e2d0" r={[0, -0.7, 0]} cast={false} /> : null}
              <B p={[0, -hh / 2 - 0.16, 0.14]} s={[ww + 0.4, 0.1, 0.3]} c={kind === 'brick' ? '#d6c9ac' : '#e4dac4'} />
              {q.plant ? <><B p={[0, -hh / 2 - 0.02, 0.28]} s={[ww * 0.8, 0.22, 0.2]} c="#7a4a2e" /><mesh position={[0, -hh / 2 + 0.2, 0.28]}><icosahedronGeometry args={[0.24, 0]} /><meshLambertMaterial color="#4f8a4a" flatShading /></mesh><mesh position={[0.25, -hh / 2 + 0.28, 0.3]}><icosahedronGeometry args={[0.1, 0]} /><meshBasicMaterial color="#e2566a" /></mesh></> : null}
              {q.ac ? <B p={[-ww * 0.3, -hh / 2 + 0.28, 0.32]} s={[0.62, 0.42, 0.4]} c="#a9adab" /> : null}
              {q.flag ? <><B p={[ww / 2 + 0.2, hh / 2 - 0.2, 0.3]} s={[0.04, 0.04, 0.5]} c="#2a2a30" cast={false} /><mesh position={[ww / 2 + 0.2, hh / 2 - 0.5, 0.52]}><planeGeometry args={[0.04, 0.5]} /><meshLambertMaterial color={FF_BLUE} /></mesh></> : null}
            </group>
          );
        })) : Array.from({length: floors}, (_, f) => <mesh key={f} position={[0, G + fh * (f + 0.5) + 0.3, 0.03]}><planeGeometry args={[w - 1.2, fh * 0.55]} /><meshLambertMaterial color="#7f98a8" /></mesh>)}
        {/* corner piers and cornice */}
        {[-1, 1].map((k) => <B key={k} p={[k * (w / 2 - 0.12), h / 2, 0.08]} s={[0.26, h, 0.18]} c={color === '#a4503c' ? '#8c4132' : trim} cast={false} />)}
        <B p={[0, h - 0.5, 0.1]} s={[w, 0.5, 0.2]} c={trim} />
        <B p={[0, h - 0.04, 0.3]} s={[w + 0.3, 0.28, 0.7]} c={trim} />
        <B p={[0, h + 0.5, -0.1]} s={[w, 0.5, 0.3]} c={dark} />
        {/* fire escape: landings with railings and zig-zag ladders on the front */}
        {escape && !lod ? <group position={[w * 0.22, 0, 0.2]}>
          {Array.from({length: floors}, (_, f) => { const y = G + fh * f + 0.3; return (
            <group key={f}>
              <B p={[0, y, 0.55]} s={[2.4, 0.06, 1.1]} c="#1f2024" /><B p={[0, y + 0.5, 1.08]} s={[2.4, 0.05, 0.04]} c="#1f2024" cast={false} />
              {[-1.15, -0.4, 0.4, 1.15].map((x) => <B key={x} p={[x, y + 0.25, 1.08]} s={[0.03, 0.5, 0.03]} c="#1f2024" cast={false} />)}
              <B p={[-1.18, y + 0.25, 0.55]} s={[0.03, 0.5, 1.0]} c="#1f2024" cast={false} /><B p={[1.18, y + 0.25, 0.55]} s={[0.03, 0.5, 1.0]} c="#1f2024" cast={false} />
              {f > 0 ? <B p={[f % 2 ? -0.7 : 0.7, y - fh / 2, 0.8]} s={[0.5, fh * 1.04, 0.05]} c="#1f2024" r={[0, 0, f % 2 ? 0.5 : -0.5]} cast={false} /> : null}
            </group>); })}
        </group> : null}
        {/* the roof: parapet, TV aerials, a tank on legs, a stack */}
        {!lod ? <>
          {[-w * 0.3, w * 0.1].map((x, i) => <group key={i} position={[x, h + 0.75, -3 - i * 2]}>
            <B p={[0, 0.8, 0]} s={[0.06, 1.6, 0.06]} c="#303034" cast={false} />
            {[0.5, 0.9, 1.3].map((y, k) => <B key={y} p={[0, y, 0]} s={[0.04, 0.04, 0.9 - k * 0.2]} c="#303034" cast={false} />)}
          </group>)}
          {[0.5].map((k) => <group key={k} position={[w * 0.32, h + 0.75, -d * 0.45]}><B p={[0, 1.0, 0]} s={[0.9, 2.0, 0.9]} c={dark} /><B p={[0, 2.05, 0]} s={[1.05, 0.12, 1.05]} c={trim} /></group>)}
        </> : null}
        {tank ? <group position={[-w * 0.25, h + 0.75, -d * 0.45]}>
          {[-0.9, 0.9].flatMap((x) => [-0.7, 0.7].map((z) => <B key={`${x}${z}`} p={[x, 0.9, z]} s={[0.08, 1.8, 0.08]} c="#26262c" cast={false} />))}
          <FacetLathe profile={[[1.6, 1.8], [1.7, 2.2], [1.7, 3.6], [1.55, 3.7]]} sides={14} color="#7a5a40" contact={false} />
          <FacetLathe profile={[[1.62, 3.66], [0.8, 4.3], [0.0, 4.6]]} sides={14} color="#4a4038" contact={false} />
          {[2.4, 3.0].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[1.74, 1.74, 0.06, 14]} /><meshLambertMaterial color="#26262c" /></mesh>)}
        </group> : null}
      </group>
    );
  };

// ---------------------------------------------------------------- street furniture
/** the steel street lamp: a curved arm out over the road with a flat "cobra" head (1960s, no gas) */
/** on: đèn sáng (chỉ để báo nguồn bụi); bui (mặc định true): khi on, đèn tự đăng ký nguồn bụi 'den' (lib3/buiNguon) dưới chao đèn. */
export const DenPho: React.FC<{pos: V3; arm?: 1 | -1; h?: number; on?: boolean; bui?: boolean}> = ({pos, arm = 1, h = 7.6, on, bui = true}) => (
  <group position={pos}>{on && bui ? <NguonBui kieu="den" pos={[arm * 1.55, h + 0.3, 0]} r={1.4} mau="#fff0c0" /> : null}
    <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[0.08, 0.13, h, 8]} /><meshLambertMaterial color="#5a6a60" /></mesh>
    <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.2, 0.24, 1.0, 8]} /><meshLambertMaterial color="#4a5850" /></mesh>
    {[0, 1, 2, 3, 4].map((i) => { const t = i / 4; return <B key={i} p={[arm * (0.1 + t * 1.3), h + Math.sin(t * 2.2) * 0.55, 0]} s={[0.35, 0.07, 0.07]} c="#5a6a60" r={[0, 0, arm * (0.7 - t * 1.2)]} cast={false} />; })}
    <B p={[arm * 1.55, h + 0.52, 0]} s={[0.85, 0.16, 0.34]} c="#aeb4b0" /><B p={[arm * 1.55, h + 0.4, 0]} s={[0.7, 0.04, 0.26]} c="#fff0c0" cast={false} />
    <B p={[0, 3.2, 0.1]} s={[0.04, 0.5, 0.28]} c="#c8c8cc" cast={false} />
  </group>
);
export const Hydrant: React.FC<{pos: V3; col?: string}> = ({pos, col = '#c8352a'}) => (
  <group position={pos}>
    <FacetLathe profile={[[0.17, 0], [0.18, 0.1], [0.14, 0.14], [0.13, 0.55], [0.17, 0.6], [0.1, 0.72], [0.0, 0.76]]} sides={10} color={col} contact={false} />
    {[-1, 1].map((k) => <mesh key={k} position={[k * 0.2, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.065, 0.065, 0.12, 8]} /><meshLambertMaterial color="#b0b4b8" /></mesh>)}
    <mesh position={[0, 0.34, 0.16]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.075, 0.075, 0.12, 8]} /><meshLambertMaterial color="#b0b4b8" /></mesh>
  </group>
);
export const Mailbox: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 0.5, 0]} s={[0.55, 0.9, 0.48]} c="#2b5aa8" /><mesh position={[0, 0.95, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.24, 0.24, 0.55, 12, 1, false, 0, Math.PI]} /><meshLambertMaterial color="#2b5aa8" /></mesh>
    <B p={[0, 0.7, 0.245]} s={[0.36, 0.05, 0.02]} c="#161820" cast={false} /><B p={[0, 0.4, 0.245]} s={[0.4, 0.08, 0.02]} c="#e8e4dc" cast={false} />
    <B p={[0, 0.06, 0]} s={[0.4, 0.12, 0.34]} c="#3a3a40" />
  </group>
);
export const Meter: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}><B p={[0, 0.55, 0]} s={[0.05, 1.1, 0.05]} c="#6a6e70" /><B p={[0, 1.2, 0]} s={[0.2, 0.28, 0.14]} c="#8a8e90" /><mesh position={[0, 1.22, 0.075]}><circleGeometry args={[0.07, 10]} /><meshBasicMaterial color="#efe6c8" /></mesh><B p={[0, 1.38, 0]} s={[0.22, 0.06, 0.16]} c="#c8352a" cast={false} /></group>
);
export const Bin: React.FC<{pos: V3; fallen?: boolean}> = ({pos, fallen}) => (
  <group position={pos} rotation={fallen ? [0, 0.6, Math.PI / 2] : [0, 0, 0]}>
    <mesh position={[0, fallen ? 0.35 : 0.4, 0]} castShadow><cylinderGeometry args={[0.28, 0.24, 0.8, 10, 1, true]} /><meshLambertMaterial color="#5a6a60" side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.28, 0.025, 6, 12]} /><meshLambertMaterial color="#aeb4b0" /></mesh>
    {[0.15, 0.4, 0.62].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.285, 0.265, 0.02, 10]} /><meshLambertMaterial color="#414c46" /></mesh>)}
  </group>
);
export const PhoneBooth: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 1.15, 0]} s={[0.95, 2.3, 0.95]} c="#c0c4c4" cast={false} />
    <B p={[0, 2.38, 0]} s={[1.0, 0.16, 1.0]} c="#3a4a58" />
    {[[0, 0.48], [0, -0.48]].map(([x, z], i) => <mesh key={i} position={[x, 1.25, z]} rotation={[0, i ? Math.PI : 0, 0]}><planeGeometry args={[0.82, 1.8]} /><meshBasicMaterial color="#8db4c4" transparent opacity={0.6} /></mesh>)}
    <B p={[0, 1.2, -0.3]} s={[0.4, 0.5, 0.2]} c="#2a2a30" /><B p={[0.0, 2.38, 0.52]} s={[0.6, 0.12, 0.02]} c="#f2d36a" cast={false} />
    {[[-0.47, -0.47], [0.47, -0.47], [-0.47, 0.47], [0.47, 0.47]].map(([x, z], i) => <B key={i} p={[x, 1.2, z]} s={[0.05, 2.3, 0.05]} c="#2a2a30" cast={false} />)}
  </group>
);
/** a news stand: a little kiosk with a striped awning and rows of coloured magazines (flat blocks of colour) */
export const QuayBao: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 0.5, 0]} s={[2.0, 1.0, 1.0]} c="#3f6a5a" />
    <B p={[0, 1.05, 0.0]} s={[2.1, 0.1, 1.1]} c="#2f5448" />
    {Array.from({length: 12}, (_, i) => <B key={i} p={[-0.88 + (i % 6) * 0.35, 1.34 + Math.floor(i / 6) * 0.3, 0.3]} s={[0.3, 0.26, 0.04]} c={['#e2566a', '#f2c94c', '#4f8fc8', '#f6f0e4', '#4f8a4a', '#c8463c'][(i * 5) % 6]} cast={false} r={[-0.25, 0, 0]} />)}
    <B p={[0, 1.7, -0.3]} s={[2.1, 0.9, 0.08]} c="#9a6a40" cast={false} />
    <group position={[0, 0, 0.5]}><Awning x={0} y={2.15} w={2.2} depth={0.8} drop={0.4} a="#c8463c" b="#f1ead8" /></group>
    {[-0.95, 0.95].map((x) => <B key={x} p={[x, 1.6, 0.45]} s={[0.05, 1.2, 0.05]} c="#2a2a30" cast={false} />)}
    <B p={[0, 0.7, 0.52]} s={[1.9, 0.08, 0.1]} c="#e9e0c8" cast={false} />
  </group>
);
export const TrafficLight: React.FC<{pos: V3; h?: number; arm?: 1 | -1; state?: 'r' | 'g'}> = ({pos, h = 4.6, arm = -1, state = 'r'}) => (
  <group position={pos}>
    <B p={[0, h / 2, 0]} s={[0.12, h, 0.12]} c="#2a2e30" />
    <B p={[arm * 0.8, h, 0]} s={[1.6, 0.08, 0.08]} c="#2a2e30" cast={false} />
    <group position={[arm * 1.5, h - 0.65, 0]}><B p={[0, 0, 0]} s={[0.34, 1.1, 0.3]} c="#e2b82a" />
      {[0.35, 0, -0.35].map((y, i) => <mesh key={i} position={[0, y, 0.16]}><circleGeometry args={[0.12, 12]} /><meshBasicMaterial color={i === 0 ? (state === 'r' ? '#ff4a3a' : '#3a2a28') : i === 2 ? (state === 'g' ? '#4aff7a' : '#223a2a') : '#3a3420'} /></mesh>)}</group>
    <B p={[0.2, 2.2, 0.1]} s={[0.4, 0.5, 0.04]} c="#e8e4dc" cast={false} />
  </group>
);
export const Tree: React.FC<{pos: V3; h?: number; seed?: number}> = ({pos, h = 5.2, seed = 1}) => {
  const q = rnd(seed * 11 + 2);
  return (
    <group position={pos}>
      <B p={[0, 0.08, 0]} s={[1.4, 0.16, 1.4]} c="#6a6e70" />
      <mesh position={[0, h * 0.28, 0]} castShadow><cylinderGeometry args={[0.1, 0.17, h * 0.56, 7]} /><meshLambertMaterial color="#5a4332" /></mesh>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = q() * 6.28, rr = 0.4 + q() * 0.9; return <mesh key={i} position={[Math.cos(a) * rr, h * 0.62 + q() * h * 0.28, Math.sin(a) * rr * 0.8]} scale={[1.2 + q() * 0.5, 1, 1.1]} castShadow><icosahedronGeometry args={[0.8 + q() * 0.5, 0]} /><meshLambertMaterial color={['#4f8a4a', '#5b9a52', '#3f7340'][i % 3]} flatShading /></mesh>; })}
    </group>
  );
};
/** a row of pennants along a wire */
export const Pennants: React.FC<{a: V3; b: V3; sag?: number; n?: number; f?: number}> = ({a, b, sag = 0.7, n = 20, f = 0}) => {
  const cols = [FF_BLUE, '#f4f1e8', '#c8352a', '#f2c94c'];
  const pts = Array.from({length: 9}, (_, i) => { const t = i / 8; return new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t); });
  return (
    <group>
      <mesh><tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 24, 0.012, 4, false]} /><meshBasicMaterial color="#2a2a30" /></mesh>
      {Array.from({length: n}, (_, i) => {
        const t = (i + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, z = a[2] + (b[2] - a[2]) * t, sw = Math.sin(f * 0.14 + i * 0.8) * 0.12;
        return <mesh key={i} position={[x, y - 0.14, z]} rotation={[sw, 0, 0]}><shapeGeometry args={[(() => { const s = new THREE.Shape(); s.moveTo(-0.13, 0.14); s.lineTo(0.13, 0.14); s.lineTo(0, -0.18); return s; })()]} /><meshBasicMaterial color={cols[i % 4]} side={THREE.DoubleSide} /></mesh>;
      })}
    </group>
  );
};

// ---------------------------------------------------------------- balloons and confetti (the cheering crowd of scene 7)
export const Balloons: React.FC<{f: number; box: [number, number, number, number]; n?: number; seed?: number}> = ({f, box, n = 9, seed = 3}) => {
  const cols = ['#e2566a', '#f2c94c', '#4f8fc8', '#f6f0e4', '#4f8a4a', '#d9763a'], L = useMemo(() => { const r = rnd(seed); return Array.from({length: n}, () => ({x: r(), z: r(), y0: 1 + r() * 7, sp: 0.35 + r() * 0.4, c: Math.floor(r() * 6), s: 0.8 + r() * 0.5, ph: r() * 6})); }, [seed, n]);
  return <>{L.map((q, i) => {
    const y = ((q.y0 + (f / 24) * q.sp) % 14) + 2.0, x = box[0] + q.x * (box[1] - box[0]) + Math.sin(f * 0.05 + q.ph) * 0.3, z = box[2] + q.z * (box[3] - box[2]), s = 0.34 * q.s;
    return (
      <group key={i} position={[x, y, z]}>
        <mesh scale={[s, s * 1.2, 1]}><circleGeometry args={[1, 14]} /><meshBasicMaterial color={cols[q.c]} /></mesh>
        <mesh position={[-s * 0.3, s * 0.35, 0.01]} scale={[s * 0.32, s * 0.5, 1]} rotation={[0, 0, 0.5]}><circleGeometry args={[1, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.4} /></mesh>
        <mesh position={[0, -s * 1.28, 0]}><circleGeometry args={[s * 0.18, 3]} /><meshBasicMaterial color={cols[q.c]} /></mesh>
        <mesh position={[0, -s * 2.4, 0]}><planeGeometry args={[0.012, s * 2.2]} /><meshBasicMaterial color="#e8e4dc" /></mesh>
      </group>
    );
  })}</>;
};

// ---------------------------------------------------------------- fire: flat flames in layers (orange, yellow, white core) and smoke columns
const flameTex = (k: number) => tex(`pny-flame-${k}`, 128, 256, (c, W, H) => {
  const body = (sx: number, sy: number, col: string) => { c.fillStyle = col; c.beginPath(); c.moveTo(W / 2, H * (0.02 + sy)); c.bezierCurveTo(W * (0.5 + 0.34 * sx), H * (0.32 + sy), W * (0.5 + 0.5 * sx), H * 0.62, W * (0.5 + 0.34 * sx), H * 0.98); c.lineTo(W * (0.5 - 0.34 * sx), H * 0.98); c.bezierCurveTo(W * (0.5 - 0.5 * sx), H * 0.62, W * (0.5 - 0.34 * sx), H * (0.32 + sy), W / 2, H * (0.02 + sy)); c.fill(); };
  c.save(); if (k) { c.translate(W, 0); c.scale(-1, 1); }
  body(1, 0, '#e2531e'); body(0.78, 0.16, '#f58a26'); body(0.5, 0.36, '#ffd54a'); body(0.26, 0.58, '#fff4c4');
  c.restore();
});
/** a patch of flame: three tongues in layers that flicker with the frame. w = width, h = height of the tallest */
export const Lua: React.FC<{pos: V3; w?: number; h?: number; f?: number; seed?: number; k?: number}> = ({pos, w = 1.2, h = 1.6, f = 0, seed = 1, k = 1}) => (
  <group position={pos}>{[0, 1, 2].map((i) => {
    const a = f * (0.37 + i * 0.11) + seed * 3 + i * 2.1, sy = (0.8 + 0.3 * Math.sin(a) * 0.5 + 0.18 * Math.sin(a * 2.3)) * k, sx = 1 + 0.12 * Math.sin(a * 1.7);
    return <mesh key={i} position={[(i - 1) * w * 0.3, (h * (i === 1 ? 1.0 : 0.72) * sy) / 2, i * 0.02]} scale={[sx, sy, 1]} rotation={[0, 0, Math.sin(a * 0.8) * 0.1]} renderOrder={7}><planeGeometry args={[w * (i === 1 ? 0.62 : 0.5), h * (i === 1 ? 1 : 0.72)]} /><meshBasicMaterial map={flameTex((i + seed) % 2)} transparent depthWrite={false} fog={false} /></mesh>;
  })}</group>
);
/** a column of smoke: puffs rising and widening, flat dark grey in two tones, thin enough to see through. */
export const Khoi: React.FC<{f: number; pos: V3; h?: number; w?: number; n?: number; color?: string; dark?: string; opacity?: number; seed?: number; lean?: number}> = ({f, pos, h = 12, w = 1.2, n = 9, color = '#6a6460', dark = '#46413e', opacity = 0.7, seed = 1, lean = 1.4}) => {
  const m = useMemo(() => tex('pny-puff', 128, 128, (c, W, H) => { const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.7, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }), []);
  return <>{Array.from({length: n}, (_, i) => {
    const r = rnd(i * 17 + seed * 5), life = 90, a = ((f + Math.floor(r() * life) + i * (life / n)) % life) / life, s = (w * 0.9 + a * w * 2.4) * (0.8 + r() * 0.5);
    return <mesh key={i} renderOrder={6} position={[pos[0] + a * lean + (r() - 0.5) * w * 0.5 + Math.sin(f * 0.05 + i) * 0.15, pos[1] + a * h, pos[2] + (r() - 0.5) * 0.6]} rotation={[0, 0, i + f * 0.004]} scale={[s, s * 0.85, 1]}>
      <planeGeometry /><meshBasicMaterial map={m} color={i % 3 ? color : dark} transparent opacity={opacity * Math.min(1, a * 6) * (1 - a * 0.7)} depthWrite={false} fog={false} /></mesh>;
  })}</>;
};

// ---------------------------------------------------------------- the ground: cracks, glass, rubble, a spray of water
export const crackTex = () => tex('pny-crack', 512, 512, (c, W, H) => {
  const r = rnd(41); c.clearRect(0, 0, W, H); c.lineCap = 'round'; c.lineJoin = 'round';
  const branch = (x: number, y: number, a: number, len: number, wd: number, depth: number) => {
    if (len < 14 || depth > 4) return; const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len, mx = (x + nx) / 2 + (r() - 0.5) * len * 0.3, my = (y + ny) / 2 + (r() - 0.5) * len * 0.3;
    c.strokeStyle = '#1a1816'; c.lineWidth = wd; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, nx, ny); c.stroke();
    c.strokeStyle = 'rgba(210,205,190,0.55)'; c.lineWidth = Math.max(1, wd * 0.28); c.beginPath(); c.moveTo(x + 2, y + 2); c.quadraticCurveTo(mx + 2, my + 2, nx + 2, ny + 2); c.stroke();
    branch(nx, ny, a + (r() - 0.5) * 0.5, len * 0.7, wd * 0.72, depth + 1); if (r() < 0.75) branch(nx, ny, a + (r() < 0.5 ? 0.8 : -0.8) * (0.6 + r() * 0.5), len * 0.55, wd * 0.6, depth + 1);
  };
  for (let i = 0; i < 9; i++) branch(W / 2, H / 2, (i / 9) * Math.PI * 2 + (r() - 0.5) * 0.3, 90 + r() * 70, 9 - (i % 3), 0);
  c.fillStyle = '#25221f'; c.beginPath(); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = 14 + r() * 12; c.lineTo(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); } c.fill();
});
export const Rubble: React.FC<{pos: V3; area: [number, number]; n?: number; seed?: number; colors?: string[]}> = ({pos, area, n = 18, seed = 1, colors = ['#9a9488', '#b3ad9e', '#7e786e', '#c4bdac']}) => {
  const L = useMemo(() => { const r = rnd(seed * 13 + 1); return Array.from({length: n}, () => ({x: (r() - 0.5) * area[0], z: (r() - 0.5) * area[1], s: 0.08 + r() * r() * 0.5, ry: r() * 6, rx: r() * 0.6, c: Math.floor(r() * 4)})); }, [n, seed, area[0], area[1]]);
  return <group position={pos}>{L.map((q, i) => <mesh key={i} position={[q.x, q.s * 0.35, q.z]} rotation={[q.rx, q.ry, q.rx * 0.5]} castShadow><dodecahedronGeometry args={[q.s, 0]} /><meshLambertMaterial color={colors[q.c]} flatShading /></mesh>)}</group>;
};
/** broken glass: small bright shards flat on the ground */
export const Shards: React.FC<{pos: V3; area: [number, number]; n?: number; seed?: number}> = ({pos, area, n = 40, seed = 2}) => {
  const L = useMemo(() => { const r = rnd(seed * 3 + 8); return Array.from({length: n}, () => ({x: (r() - 0.5) * area[0], z: (r() - 0.5) * area[1], s: 0.05 + r() * 0.12, ry: r() * 6, c: r() < 0.5 ? '#cfe6ee' : '#9ec4d6'})); }, [n, seed, area[0], area[1]]);
  return <group position={pos}>{L.map((q, i) => <mesh key={i} position={[q.x, 0.012, q.z]} rotation={[-Math.PI / 2, 0, q.ry]}><circleGeometry args={[q.s, 3]} /><meshBasicMaterial color={q.c} /></mesh>)}</group>;
};
/** a hydrant gushing: a fan of white-blue spray falling in an arc, droplets flickering */
export const Spray: React.FC<{pos: V3; f: number; dir?: 1 | -1}> = ({pos, f, dir = 1}) => (
  <group position={pos}>{Array.from({length: 26}, (_, i) => {
    const r = rnd(i * 9 + 4), life = 22, a = ((f + Math.floor(r() * life)) % life) / life, vx = dir * (1.4 + r() * 1.2), vy = 3.2 + r() * 1.6, x = vx * a * 1.1, y = vy * a * 1.1 - 6.2 * a * a * 0.55, s = 0.05 + r() * 0.06;
    return <mesh key={i} position={[x, Math.max(0.02, y), (r() - 0.5) * 0.3]} renderOrder={7}><circleGeometry args={[s * (1 - a * 0.3), 6]} /><meshBasicMaterial color={i % 3 ? '#e4f4fb' : '#a8d4ea'} transparent opacity={1 - a * a} depthWrite={false} /></mesh>;
  })}</group>
);

// ---------------------------------------------------------------- layers behind: sky and skyline (plates, painted in metres)
const TAN = Math.tan((28 * Math.PI) / 360);
export type NySky = 'ngay' | 'khoi' | 'chang-vang' | 'dem' | 'binh-minh';
export const paintSkyNy = (kind: NySky) => (c: Ctx) => {
  const g = c.createLinearGradient(0, -200, 0, 560);
  if (kind === 'ngay') { g.addColorStop(0, '#7fb0de'); g.addColorStop(0.55, '#a9cdee'); g.addColorStop(1, '#e4ecf0'); }
  else if (kind === 'khoi') { g.addColorStop(0, '#8fa6bd'); g.addColorStop(0.5, '#b4bfc4'); g.addColorStop(1, '#d6cfc0'); }
  else if (kind === 'binh-minh') { g.addColorStop(0, '#86a4cc'); g.addColorStop(0.35, '#c8b0c8'); g.addColorStop(0.7, '#f4c4a0'); g.addColorStop(1, '#ffe2a8'); }
  else if (kind === 'chang-vang') { g.addColorStop(0, '#5a5f9a'); g.addColorStop(0.4, '#c8789a'); g.addColorStop(0.75, '#f0a068'); g.addColorStop(1, '#ffd08a'); }
  else { g.addColorStop(0, '#1e2650'); g.addColorStop(0.6, '#3a4a82'); g.addColorStop(1, '#6a7aa8'); }
  c.fillStyle = g; c.fillRect(-400, -300, 2400, 1500);
  if (kind === 'dem') { const r = rnd(8); for (let i = 0; i < 70; i++) { c.beginPath(); c.arc(-300 + r() * 2200, -200 + r() * 520, 1 + r() * 1.6, 0, 7); c.fillStyle = `rgba(236,240,255,${0.35 + r() * 0.5})`; c.fill(); } }
  const cl = kind === 'ngay' ? {light: '#ffffff', dark: '#dde9f4'} : kind === 'binh-minh' ? {light: '#ffdcc4', dark: '#e8a4b4'} : kind === 'khoi' ? {light: '#dcdcd8', dark: '#b9bab8'} : kind === 'chang-vang' ? {light: '#ffb8a0', dark: '#d8789a'} : {light: '#4a5a90', dark: '#3a4878'};
  [[-100, 70, 1.5], [420, 20, 1.1], [900, 110, 1.7], [1380, 40, 1.2], [1700, 150, 1.3], [200, 230, 0.8], [1150, 270, 0.9]].forEach(([x, y, s]) => paintCloud(c, x, y, s, cl));
  if (kind === 'ngay' || kind === 'khoi') {
    c.strokeStyle = kind === 'ngay' ? 'rgba(255,255,255,0.45)' : 'rgba(230,230,226,0.4)'; c.lineWidth = 5; c.lineCap = 'round';
    [[100, 40, 360], [980, 20, 300], [1300, 90, 260]].forEach(([x, y, l]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y - 14); c.stroke(); });
  }
  if (kind === 'khoi') { const sm = c.createLinearGradient(0, 200, 0, 520); sm.addColorStop(0, 'rgba(90,86,84,0)'); sm.addColorStop(1, 'rgba(90,86,84,0.4)'); c.fillStyle = sm; c.fillRect(-400, 200, 2400, 330); }
  if (kind === 'binh-minh') { const sg = c.createRadialGradient(1230, 470, 10, 1230, 470, 520); sg.addColorStop(0, 'rgba(255,236,180,0.85)'); sg.addColorStop(0.3, 'rgba(255,196,130,0.45)'); sg.addColorStop(1, 'rgba(255,170,120,0)'); c.fillStyle = sg; c.fillRect(500, 0, 1500, 900); }
  if (kind === 'chang-vang') { const sg = c.createRadialGradient(1050, 470, 10, 1050, 470, 420); sg.addColorStop(0, 'rgba(255,240,190,0.95)'); sg.addColorStop(0.25, 'rgba(255,200,130,0.5)'); sg.addColorStop(1, 'rgba(255,170,110,0)'); c.fillStyle = sg; c.fillRect(300, 0, 1500, 900); c.beginPath(); c.arc(1050, 470, 46, 0, 7); c.fillStyle = '#fff6d0'; c.fill(); }
};
/** towers painted for an eye at height eyeY standing at x = vx; plate distance d from the eye. rank 0 = far and pale, 1 = nearer and darker. Sizes in metres. */
export const paintSkylineNy = (eyeY: number, vx: number, d: number, rank: 0 | 1, kind: NySky, seed = 3) => (c: Ctx) => {
  const k = 900 / (2 * TAN * d), base = 450 + eyeY * k, X = (m: number) => 800 + (m - vx) * k, r = rnd(seed + rank * 17);
  const lit = kind === 'dem' || kind === 'chang-vang' || kind === 'binh-minh';
  const T = kind === 'ngay'
    ? (rank ? {a: '#a7b4be', b: '#8d9eab', c: '#c4ccd0', win: 'rgba(60,84,104,0.45)'} : {a: '#bfcbd6', b: '#aab9c6', c: '#d4dce2', win: 'rgba(90,110,130,0.3)'})
    : kind === 'binh-minh' ? (rank ? {a: '#8a7a9a', b: '#6e6084', c: '#a48aa6', win: 'rgba(255,214,140,0.7)'} : {a: '#b8a4bc', b: '#9c8aa8', c: '#d0b8c0', win: 'rgba(255,214,150,0.45)'})
    : kind === 'chang-vang' ? (rank ? {a: '#7a5a8a', b: '#5e4674', c: '#9a6a90', win: 'rgba(255,214,120,0.8)'} : {a: '#a07a98', b: '#8a6486', c: '#b88aa0', win: 'rgba(255,214,140,0.55)'})
    : kind === 'dem' ? (rank ? {a: '#2c3566', b: '#222a54', c: '#3a4478', win: 'rgba(255,224,140,0.85)'} : {a: '#3e4878', b: '#323b68', c: '#4c5688', win: 'rgba(255,224,150,0.6)'})
    : (rank ? {a: '#9a9fa4', b: '#80868c', c: '#b4b6b6', win: 'rgba(50,56,64,0.4)'} : {a: '#aeb2b6', b: '#9a9fa4', c: '#c4c6c4', win: 'rgba(80,86,94,0.3)'});
  const span = 1500 / k * 0.5 + 30;
  for (let m = vx - span - 40; m < vx + span + 40; m += (rank ? 14 : 20) + r() * (rank ? 22 : 30)) {
    const w = (rank ? 14 : 18) + r() * (rank ? 22 : 30), h = (rank ? 40 : 70) + r() * (rank ? 70 : 110), x0 = X(m), wp = w * k, hp = h * k, y1 = base - hp;
    // body in two tones, a stepped top (a setback or two), mast
    P(c, [[x0, base + 40], [x0, y1], [x0 + wp, y1], [x0 + wp, base + 40]], T.a); P(c, [[x0 + wp * 0.62, base + 40], [x0 + wp * 0.62, y1], [x0 + wp, y1], [x0 + wp, base + 40]], T.b);
    const sb = r() < 0.7 ? 1 + Math.floor(r() * 2) : 0; let cx = x0 + wp * 0.1, cw = wp * 0.8, cy = y1;
    for (let i = 0; i < sb; i++) { const hh = hp * (0.1 + r() * 0.1); P(c, [[cx, cy], [cx, cy - hh], [cx + cw, cy - hh], [cx + cw, cy]], T.c); P(c, [[cx + cw * 0.62, cy], [cx + cw * 0.62, cy - hh], [cx + cw, cy - hh], [cx + cw, cy]], T.b); cy -= hh; cx += cw * 0.15; cw *= 0.7; }
    if (r() < 0.55) { c.fillStyle = T.b; c.fillRect(cx + cw / 2 - 1.5, cy - hp * 0.14, 3, hp * 0.14); }
    if (rank && r() < 0.5) { c.fillStyle = T.b; c.fillRect(x0 + wp * 0.3, y1 - hp * 0.04, wp * 0.3, hp * 0.04); }
    c.fillStyle = T.win; const rows = Math.floor(hp / (3.6 * k)), cols = Math.max(2, Math.floor(w / 3));
    for (let rr = 1; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) if (lit ? r() < 0.4 : r() < 0.8) c.fillRect(x0 + wp * 0.08 + (cc * wp * 0.84) / cols, y1 + rr * 3.6 * k + 1, (wp * 0.84) / cols * 0.55, 3.6 * k * 0.45);
  }
  c.fillStyle = T.a; c.fillRect(-300, base, 2300, 80);
};

// ---------------------------------------------------------------- flat ground pieces
export const Slab: React.FC<{x: [number, number]; z: [number, number]; y: number; color: string; map?: THREE.Texture; tile?: number; opacity?: number}> = ({x, z, y, color, map, tile = 2, opacity = 1}) => {
  const m = useMemo(() => { if (!map) return null; const t = map.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set((x[1] - x[0]) / tile, (z[1] - z[0]) / tile); return t; }, [map, x[0], x[1], z[0], z[1], tile]);
  return <mesh position={[(x[0] + x[1]) / 2, y, (z[0] + z[1]) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[x[1] - x[0], z[1] - z[0]]} /><meshLambertMaterial color={color} map={m} transparent={opacity < 1} opacity={opacity} /></mesh>;
};

/** a pigeon: grey body, darker wings, a green-purple neck patch, a small head and beak; faces +x (flip to turn) */
export const Pigeon: React.FC<{pos: V3; flip?: boolean; s?: number; peck?: number}> = ({pos, flip, s = 1, peck = 0}) => (
  <group position={pos} scale={[flip ? -s : s, s, s]}>
    <mesh position={[0, 0.1, 0]} scale={[1.5, 1, 1]}><icosahedronGeometry args={[0.08, 0]} /><meshLambertMaterial color="#8d939a" flatShading /></mesh>
    <mesh position={[-0.06, 0.12, 0]} rotation={[0, 0, 0.3]} scale={[1.5, 0.6, 1.1]}><icosahedronGeometry args={[0.07, 0]} /><meshLambertMaterial color="#6d737a" flatShading /></mesh>
    <mesh position={[-0.15, 0.1, 0]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.04, 0.12, 4]} /><meshLambertMaterial color="#5d636a" flatShading /></mesh>
    <group position={[0.1, 0.16 - peck * 0.08, 0]} rotation={[0, 0, -peck * 0.7]}>
      <mesh position={[0.02, 0.02, 0]}><icosahedronGeometry args={[0.045, 0]} /><meshLambertMaterial color="#7d8a98" flatShading /></mesh>
      <mesh position={[0.02, 0.0, 0]}><icosahedronGeometry args={[0.048, 0]} /><meshLambertMaterial color="#6a8a70" flatShading /></mesh>
      <mesh position={[0.075, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.012, 0.045, 4]} /><meshLambertMaterial color="#d8c27a" /></mesh>
    </group>
    {[-0.015, 0.025].map((x) => <mesh key={x} position={[x, 0.02, 0]}><cylinderGeometry args={[0.006, 0.006, 0.05, 4]} /><meshBasicMaterial color="#c8786a" /></mesh>)}
  </group>
);
