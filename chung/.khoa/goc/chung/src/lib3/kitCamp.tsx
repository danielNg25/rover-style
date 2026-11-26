import React, {useMemo} from 'react';
import * as THREE from 'three';
import {FacetLathe, Halo, ContactShade} from './look';
import {rnd, Ctx, Sprite, paintTuft} from './depth';
import {B, Flame} from './kit';
import {DaCoKhi, NguonBui} from './buiNguon';
import {tex, EmberBed} from './kitLab';

/** lib3/kitCamp: the poor nomads' camp of the Doom episodes (rebuild of `Camp`, 22/11/2026). Daniel on the first camp:
 *  "các căn lều đang quá đơn giản, và ít đồ vật, các đồ vật như thùng hay hộp gỗ surface chưa đủ đẹp, miếng vá trên lều còn
 *  bị lệch". So every surface here carries the three sizes of detail of skill 1: the big form (poles, sagging panels, planks,
 *  staves), the middle pieces (seams, trims, patches, battens, hoops, nails) and the small grain (stitches, wood grain, knots,
 *  rain streaks, soot, dust). Patches and trims are PAINTED INTO the cover's own texture, so they can never float off it. */
type V3 = [number, number, number];

// ---------------------------------------------------------------- colour helpers
const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
/** a colour times k (k < 1 darker), as an rgba string */
const tone = (h: string, k: number, a = 1) => { const [r, g, b] = hex(h), f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgba(${f(r)},${f(g)},${f(b)},${a})`; };
const toneHex = (h: string, k: number) => '#' + hex(h).map((v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')).join('');
const mixHex = (a: string, b: string, t: number) => { const A = hex(a), Bc = hex(b); return '#' + A.map((v, i) => Math.round(v + (Bc[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const blob = (c: Ctx, x: number, y: number, rad: number, col: string) => { const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
const mat = (map: THREE.Texture, extra: Partial<THREE.MeshLambertMaterialParameters> = {}) => <meshLambertMaterial map={map} {...extra} />;
/** a thin straight piece (rope, stick, strap) from a to b */
/** recv = false also keeps it out of the shadow map: with VSMShadowMap three.js draws every shadow RECEIVER into the map too */
const Stick: React.FC<{a: THREE.Vector3; b: THREE.Vector3; t: number; c: string; cast?: boolean; recv?: boolean}> = ({a, b, t, c, cast = false, recv = true}) => {
  const d = b.clone().sub(a), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return <mesh position={a.clone().add(b).multiplyScalar(0.5)} quaternion={q} castShadow={cast} receiveShadow={recv} userData={{noRecv: !recv}}><boxGeometry args={[t, d.length(), t]} /><meshLambertMaterial color={c} /></mesh>;
};
const v3 = (p: number[]) => new THREE.Vector3(p[0], p[1], p[2]);

// ---------------------------------------------------------------- wood
export type WoodLook = {base: string; n: number; vertical?: boolean; knots?: number; nails?: boolean; age?: number};
/** Planks for any wooden surface, in three sizes of detail: each plank its own tone with broad lighter and darker streaks;
 *  grain lines, knots with rings, a split; dark gaps between planks, a worn light top edge, nails at the ends; then, over the
 *  whole face, dirt rising from the bottom, stains and water streaks. n planks across; vertical = planks stand upright. */
export const paintPlanks = (seed: number, o: WoodLook) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), age = o.age ?? 0.5, vert = !!o.vertical;
  c.save(); if (vert) { c.translate(W, 0); c.rotate(Math.PI / 2); }
  const L = vert ? H : W, T = vert ? W : H, n = o.n, pw = T / n, gap = Math.max(2, pw * 0.05);
  for (let i = 0; i < n; i++) {
    const y0 = i * pw, k = 0.82 + r() * 0.3;
    c.save(); c.beginPath(); c.rect(0, y0, L, pw); c.clip();
    c.fillStyle = tone(o.base, k); c.fillRect(0, y0, L, pw);
    for (let s = 0; s < 4; s++) { const yy = y0 + r() * pw, hh = pw * (0.12 + r() * 0.3); c.fillStyle = tone(o.base, k * (r() < 0.5 ? 0.88 : 1.1), 0.5); c.fillRect(0, yy, L, hh); }
    const ng = 7 + Math.floor(r() * 7);
    for (let g = 0; g < ng; g++) {
      const yy = y0 + pw * (0.06 + r() * 0.88), amp = pw * (0.015 + r() * 0.05), fr = 1 + r() * 3, ph = r() * 6.28, dark = r() < 0.75;
      c.strokeStyle = dark ? tone(o.base, k * 0.66, 0.5) : tone(o.base, k * 1.2, 0.45); c.lineWidth = Math.max(1, pw * (0.012 + r() * 0.02));
      c.beginPath(); for (let x = -10; x <= L + 10; x += L / 48) { const y = yy + Math.sin((x / L) * fr * 6.28 + ph) * amp; if (x < 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    }
    if (r() < (o.knots ?? 0.55)) {
      const kx = L * (0.12 + r() * 0.76), ky = y0 + pw * (0.3 + r() * 0.4), rx = Math.min(pw * (0.1 + r() * 0.08), L * 0.05), ry = rx * 0.6;
      for (let q = 3; q >= 1; q--) { c.strokeStyle = tone(o.base, k * 0.6, 0.4); c.lineWidth = Math.max(1, pw * 0.015); c.beginPath(); c.ellipse(kx, ky, rx * (1 + q * 0.9), ry * (1 + q * 0.9), 0, 0, 7); c.stroke(); }
      c.fillStyle = tone(o.base, k * 0.45); c.beginPath(); c.ellipse(kx, ky, rx, ry, 0, 0, 7); c.fill();
      c.fillStyle = tone(o.base, k * 0.7); c.beginPath(); c.ellipse(kx - rx * 0.2, ky - ry * 0.2, rx * 0.45, ry * 0.45, 0, 0, 7); c.fill();
    }
    if (r() < 0.5) { const a = L * r() * 0.6, yy = y0 + pw * (0.3 + r() * 0.4); c.strokeStyle = tone(o.base, 0.32, 0.8); c.lineWidth = Math.max(1, pw * 0.02); c.beginPath(); c.moveTo(a, yy); c.lineTo(a + L * (0.1 + r() * 0.25), yy + (r() - 0.5) * pw * 0.1); c.stroke(); }
    c.fillStyle = tone(o.base, k * 1.28, 0.75); c.fillRect(0, y0 + gap * 0.5, L, Math.max(1.5, pw * 0.035));
    c.fillStyle = tone(o.base, k * 0.58, 0.7); c.fillRect(0, y0 + pw - gap * 0.5 - pw * 0.05, L, pw * 0.05);
    // chipped edges: a few small dark notches along the plank's edges
    for (let q = 0; q < 3; q++) { const x = r() * L, w = pw * (0.1 + r() * 0.25); c.fillStyle = tone(o.base, 0.4, 0.8); c.beginPath(); c.moveTo(x, y0 + pw); c.lineTo(x + w / 2, y0 + pw - w * 0.35); c.lineTo(x + w, y0 + pw); c.fill(); }
    c.restore();
    c.fillStyle = '#1a120c'; c.fillRect(0, y0 + pw - gap / 2, L, gap); if (i === 0) c.fillRect(0, 0, L, gap / 2);
    if (o.nails) for (const x of [pw * 0.35, L - pw * 0.35]) for (const q of n === 1 ? [0.5] : [0.32, 0.68]) {
      const ny = y0 + pw * q, nr = Math.max(2, pw * (n === 1 ? 0.09 : 0.06));
      c.fillStyle = 'rgba(120,60,30,0.35)'; c.beginPath(); c.ellipse(x, ny, nr * 2, nr * 1.6, 0, 0, 7); c.fill();
      c.fillStyle = '#26221f'; c.beginPath(); c.arc(x, ny, nr, 0, 7); c.fill(); c.fillStyle = 'rgba(190,185,175,0.8)'; c.beginPath(); c.arc(x - nr * 0.3, ny - nr * 0.3, nr * 0.35, 0, 7); c.fill();
    }
  }
  c.restore();
  const g = c.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, 'rgba(40,28,18,0)'); g.addColorStop(1, `rgba(40,28,18,${0.25 + 0.35 * age})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 3 + age * 6; k++) blob(c, r() * W, r() * H, (0.08 + r() * 0.2) * Math.max(W, H), `rgba(30,20,12,${0.1 + r() * 0.14})`);
  for (let k = 0; k < age * 7; k++) { const x = r() * W, w = 3 + r() * W * 0.02, h = H * (0.2 + r() * 0.5); const gg = c.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, 'rgba(25,18,12,0.28)'); gg.addColorStop(1, 'rgba(25,18,12,0)'); c.fillStyle = gg; c.fillRect(x, 0, w, h); }
};
const woodTex = (key: string, w: number, h: number, seed: number, o: WoodLook) => tex(`camp-wood-${key}-${seed}-${o.base}-${o.n}-${o.vertical ? 'v' : 'h'}`, w, h, paintPlanks(seed, o));

/** A box made of a plank texture whose grain runs along the box's longest side. */
const Board: React.FC<{p: V3; s: V3; r?: V3; base: string; seed: number; nails?: boolean; cast?: boolean}> = ({p, s, r: rot, base, seed, nails, cast = true}) => {
  const vert = s[1] >= s[0] && s[1] >= s[2], t = vert ? woodTex('board', 64, 512, seed, {base, n: 1, vertical: true, nails, knots: 0.4}) : woodTex('board', 512, 64, seed, {base, n: 1, nails, knots: 0.4});
  return <mesh position={p} rotation={rot} castShadow={cast} receiveShadow><boxGeometry args={s} />{mat(t)}</mesh>;
};

/** A packing crate of planks: the body of horizontal planks (grain, knots, gaps, dirt), a frame of darker battens at the edges
 *  of every face, a diagonal brace on the front and on one side, nail heads where battens cross. size = [w, h, d]. */
export const PlankCrate: React.FC<{pos: V3; size?: V3; rotY?: number; seed?: number; base?: string; age?: number}> = ({pos, size = [0.8, 0.66, 0.66], rotY = 0, seed = 1, base = '#a27b52', age = 0.5}) => {
  const [w, h, d] = size, n = Math.max(2, Math.round(h / 0.15)), body = woodTex('crate', 512, 512, seed, {base, n, age}), dark = toneHex(base, 0.78), bw = 0.07, t = 0.028;
  const face = (ax: 'x' | 'z', sign: number, brace: boolean) => {
    const W = ax === 'z' ? w : d, out = (ax === 'z' ? d : w) / 2 + t / 2, at = (u: number, y: number, o = 0): V3 => (ax === 'z' ? [u, y, sign * (out + o)] : [sign * (out + o), y, u]);
    const sz = (a: number, b: number, c: number): V3 => (ax === 'z' ? [a, b, c] : [c, b, a]);
    const iw = W - 2 * bw, ih = h - 2 * bw, L = Math.hypot(iw, ih) - bw * 0.4, ang = Math.atan2(ih, iw) * (sign > 0 ? 1 : -1) * (ax === 'z' ? 1 : -1);
    const nails: [number, number][] = [[-W / 2 + bw / 2, bw / 2], [W / 2 - bw / 2, bw / 2], [-W / 2 + bw / 2, h - bw / 2], [W / 2 - bw / 2, h - bw / 2]];
    return (
      <group key={ax + sign}>
        {[-1, 1].map((k) => <Board key={k} p={at(k * (W / 2 - bw / 2), h / 2)} s={sz(bw, h, t)} base={dark} seed={seed + k + 3} />)}
        {[bw / 2, h - bw / 2].map((y, k) => <Board key={y} p={at(0, y, 0.004)} s={sz(iw + 0.002, bw, t)} base={dark} seed={seed + k + 7} />)}
        {brace ? <Board p={at(0, h / 2, 0.008)} s={sz(L, bw * 0.9, t)} r={ax === 'z' ? [0, 0, ang] : [ang, 0, 0]} base={toneHex(base, 0.86)} seed={seed + 11} /> : null}
        {nails.map(([u, y], i) => <mesh key={i} position={at(u, y, t / 2 + 0.006)}><boxGeometry args={sz(0.022, 0.022, 0.008)} /><meshLambertMaterial color="#2a2724" /></mesh>)}
      </group>
    );
  };
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[w - 0.01, h, d - 0.01]} />{mat(body)}</mesh>
      {face('z', 1, true)}{face('z', -1, false)}{face('x', 1, seed % 2 === 0)}{face('x', -1, seed % 2 === 1)}
      <ContactShade r={Math.max(w, d) * 0.78} />
    </group>
  );
};

// ---------------------------------------------------------------- staved things: casks and buckets
/** One flat strip per stave (a facet), a hair-line gap between staves showing the dark inside; u runs across the staves of a
 *  texture painted with n = staves upright planks, so every stave has its own tone and grain. */
const stavedGeo = (h: number, rB: number, rM: number, rT: number, N: number, gap: number, seed: number) => {
  const r0 = rnd(seed), rad = (y: number) => { const t = y / h; return rB * 2 * (t - 0.5) * (t - 1) + rM * -4 * t * (t - 1) + rT * 2 * t * (t - 0.5); };
  const P: number[] = [], U: number[] = [], I: number[] = [], nv = 10;
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI * 2 + gap / 2 + Math.PI, a1 = ((k + 1) / N) * Math.PI * 2 - gap / 2 + Math.PI, j = 1 + (r0() - 0.5) * 0.02, base = P.length / 3, top = h * (1 + (r0() - 0.5) * 0.03);
    for (let i = 0; i <= nv; i++) { const y = (i / nv) * top, rr = rad(Math.min(y, h)) * j; [a0, a1].forEach((a, q) => { P.push(Math.sin(a) * rr, y, Math.cos(a) * rr); U.push((k + q) / N, i / nv); }); }
    for (let i = 0; i < nv; i++) { const a = base + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return {g, rad};
};
const IRON = '#3d414b';
const Staved: React.FC<{h: number; rB: number; rM: number; rT: number; N: number; hoops: number[]; base: string; seed: number; open?: boolean; age?: number}> = ({h, rB, rM, rT, N, hoops, base, seed, open, age = 0.6}) => {
  const {g, rad} = useMemo(() => stavedGeo(h, rB, rM, rT, N, 0.012, seed), [h, rB, rM, rT, N, seed]);
  const st = tex(`camp-staves-${seed}-${base}-${N}-${hoops.join(',')}`, 1024, 512, (c, W, H) => {
    paintPlanks(seed, {base, n: N, vertical: true, knots: 0.35, age})(c, W, H);
    const r = rnd(seed + 9);   // rust running down from under each hoop
    hoops.forEach((y) => { const Y = H * (1 - y / h) + 10; for (let k = 0; k < N * 0.8; k++) { const x = r() * W, len = 20 + r() * 90, gg = c.createLinearGradient(0, Y, 0, Y + len); gg.addColorStop(0, `rgba(120,58,26,${0.35 + r() * 0.3})`); gg.addColorStop(1, 'rgba(120,58,26,0)'); c.fillStyle = gg; c.fillRect(x, Y, 3 + r() * 7, len); } });
  });
  const head = woodTex('head', 256, 256, seed + 2, {base: toneHex(base, 0.9), n: 4, age});
  const rmin = Math.min(rB, rT, rM) * 0.96;
  return (
    <group>
      <mesh geometry={g} castShadow receiveShadow>{mat(st, {side: THREE.DoubleSide})}</mesh>
      <mesh position={[0, h * 0.44, 0]}><cylinderGeometry args={[rmin, rmin, h * 0.86, N]} /><meshLambertMaterial color="#21160f" /></mesh>
      {open ? <mesh position={[0, h * 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[rad(h * 0.82) * 0.97, 20]} /><meshLambertMaterial color="#2d3542" /></mesh>
        : <mesh position={[0, h - 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[rad(h - 0.035) * 0.97, 24]} />{mat(head)}</mesh>}
      {hoops.map((y, i) => { const hh = 0.04, a = rad(Math.max(0, y - hh / 2)) + 0.008, b = rad(Math.min(h, y + hh / 2)) + 0.008; return (
        <group key={i}>
          <mesh position={[0, y, 0]} castShadow receiveShadow><cylinderGeometry args={[b, a, hh, 36, 1, true]} /><meshLambertMaterial color={i % 2 ? toneHex(IRON, 1.12) : IRON} side={THREE.DoubleSide} /></mesh>
          {[-0.7, 0, 0.7, 2.2, -2.2].map((ang) => <mesh key={ang} position={[Math.sin(ang) * (rad(y) + 0.016), y, Math.cos(ang) * (rad(y) + 0.016)]} rotation={[0, ang, 0]}><boxGeometry args={[0.016, 0.016, 0.008]} /><meshLambertMaterial color="#8d8a86" /></mesh>)}
        </group>
      ); })}
      <ContactShade r={rB * 1.7} />
    </group>
  );
};
/** A wine or water cask of bent staves: every stave a facet with its own tone and grain, hair-line gaps, four iron hoops with
 *  rivets and rust running down under them, the head of planks sunk inside the chime. */
export const Cask: React.FC<{pos: V3; s?: number; rotY?: number; seed?: number; base?: string}> = ({pos, s = 1, rotY = 0, seed = 1, base = '#9a6a3e'}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={s}><Staved h={1.0} rB={0.3} rM={0.37} rT={0.3} N={16} hoops={[0.08, 0.27, 0.73, 0.92]} base={base} seed={seed} />
    <mesh position={[Math.sin(0.4) * 0.372, 0.5, Math.cos(0.4) * 0.372]} rotation={[0, 0.4, 0]}><circleGeometry args={[0.035, 10]} /><meshLambertMaterial color="#1a120c" /></mesh></group>
);
/** A water bucket of staves with two hoops, open (dark water inside), a rope handle. */
export const Bucket: React.FC<{pos: V3; s?: number; rotY?: number; seed?: number; base?: string}> = ({pos, s = 1, rotY = 0, seed = 2, base = '#8f6a44'}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={s}>
    <Staved h={0.36} rB={0.16} rM={0.185} rT={0.2} N={11} hoops={[0.06, 0.29]} base={base} seed={seed} open />
    <mesh position={[0, 0.36, 0]} rotation={[0, 0.35, 0]}><torusGeometry args={[0.2, 0.011, 5, 16, Math.PI]} /><meshLambertMaterial color="#b8a47a" /></mesh>
  </group>
);

// ---------------------------------------------------------------- turned things with a painted surface
/** a lathe whose seam is at the back (u = 0.5 faces the lens) */
const turned = (profile: [number, number][], sides: number) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), sides, Math.PI, Math.PI * 2);
const POTS: Record<string, [number, number][]> = {
  jar: [[0.001, 0], [0.15, 0], [0.24, 0.1], [0.27, 0.26], [0.23, 0.42], [0.14, 0.5], [0.12, 0.56], [0.15, 0.6], [0.13, 0.62]],
  jug: [[0.001, 0], [0.1, 0], [0.16, 0.08], [0.18, 0.2], [0.14, 0.32], [0.07, 0.4], [0.065, 0.48], [0.09, 0.52], [0.075, 0.53]],
  bowl: [[0.001, 0], [0.1, 0], [0.2, 0.06], [0.25, 0.14], [0.24, 0.15]],
  pot: [[0.001, 0], [0.13, 0], [0.2, 0.06], [0.22, 0.18], [0.2, 0.27], [0.215, 0.29], [0.2, 0.3]],
};
/** Clay pots, jugs, bowls: faceted earthenware with a lighter slip band and a zig-zag painted on it, chips at the rim, soot or
 *  dirt at the foot. kind = jar | jug | bowl | pot; iron = a black cooking pot instead of clay. */
export const ClayPot: React.FC<{pos: V3; kind?: keyof typeof POTS; s?: number; color?: string; band?: string; seed?: number; iron?: boolean; rotY?: number}> = ({pos, kind = 'jar', s = 1, color = '#9a5a3a', band = '#d9b98a', seed = 1, iron, rotY = 0}) => {
  const prof = POTS[kind], geo = useMemo(() => turned(prof, 11), [kind]);
  const m = tex(`camp-pot-${kind}-${color}-${band}-${seed}-${iron ? 1 : 0}`, 512, 256, (c, W, H) => {
    const r = rnd(seed); c.fillStyle = iron ? '#3a3634' : color; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 14; k++) blob(c, r() * W, r() * H, 30 + r() * 60, iron ? 'rgba(90,84,80,0.25)' : `rgba(255,235,200,${0.08 + r() * 0.1})`);
    if (!iron) { const y0 = H * 0.38, y1 = H * 0.5; c.fillStyle = band; c.fillRect(0, y0, W, y1 - y0); c.strokeStyle = tone(color, 0.55); c.lineWidth = 5; c.beginPath(); for (let x = 0; x <= W; x += 24) c.lineTo(x, x % 48 ? y0 + 6 : y1 - 6); c.stroke();
      c.fillStyle = tone(color, 0.6); c.fillRect(0, y0 - 6, W, 4); c.fillRect(0, y1 + 2, W, 4); }
    for (let k = 0; k < 6; k++) { const x = r() * W; c.fillStyle = iron ? 'rgba(140,90,60,0.5)' : tone(band, 1.05); c.beginPath(); c.ellipse(x, 6 + r() * 10, 8 + r() * 14, 5 + r() * 6, 0, 0, 7); c.fill(); }
    const g = c.createLinearGradient(0, H * 0.7, 0, H); g.addColorStop(0, 'rgba(20,16,14,0)'); g.addColorStop(1, iron ? 'rgba(10,10,10,0.6)' : 'rgba(30,22,16,0.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 10; k++) { const x = r() * W; c.fillStyle = 'rgba(30,22,16,0.25)'; c.fillRect(x, H * (0.2 + r() * 0.4), 2 + r() * 4, 20 + r() * 50); }
  });
  return <group position={pos} rotation={[0, rotY, 0]} scale={s}><mesh geometry={geo} castShadow receiveShadow>{mat(m, {side: THREE.DoubleSide, flatShading: true})}</mesh><ContactShade r={prof[1][0] * 1.8} /></group>;
};

/** A wicker basket: woven rows of short lighter and darker strokes over upright stakes, a twisted rim; filled with a folded
 *  cloth (fill = its colour) or empty. */
export const Basket: React.FC<{pos: V3; s?: number; tall?: boolean; fill?: string; seed?: number; rotY?: number}> = ({pos, s = 1, tall, fill, seed = 1, rotY = 0}) => {
  const prof: [number, number][] = tall ? [[0.001, 0], [0.17, 0], [0.2, 0.2], [0.24, 0.48], [0.25, 0.5]] : [[0.001, 0], [0.2, 0], [0.26, 0.12], [0.3, 0.26], [0.305, 0.27]];
  const geo = useMemo(() => turned(prof, 14), [tall]), top = prof[prof.length - 1];
  const m = tex(`camp-wicker-${seed}`, 512, 256, (c, W, H) => {
    const r = rnd(seed); c.fillStyle = '#8a6c3e'; c.fillRect(0, 0, W, H);
    const rows = 14, rh = H / rows, cw = W / 32;
    for (let j = 0; j < rows; j++) for (let i = 0; i < 32; i++) { const x = i * cw + (j % 2 ? cw / 2 : 0), y = j * rh, l = 0.85 + r() * 0.3; c.fillStyle = tone('#c4a466', l); c.beginPath(); c.ellipse(x, y + rh / 2, cw * 0.46, rh * 0.42, 0, 0, 7); c.fill(); c.fillStyle = tone('#e0c58a', l, 0.6); c.fillRect(x - cw * 0.3, y + rh * 0.25, cw * 0.5, rh * 0.12); }
    c.fillStyle = 'rgba(60,40,20,0.55)'; for (let i = 0; i < 32; i++) c.fillRect(i * cw - 2, 0, 3, H);
    const g = c.createLinearGradient(0, H * 0.6, 0, H); g.addColorStop(0, 'rgba(40,28,14,0)'); g.addColorStop(1, 'rgba(40,28,14,0.5)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  });
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      <mesh geometry={geo} castShadow receiveShadow>{mat(m, {side: THREE.DoubleSide, flatShading: true})}</mesh>
      <mesh position={[0, top[1], 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[top[0], 0.022, 5, 18]} /><meshLambertMaterial color="#7a5c32" /></mesh>
      {fill ? <FacetLathe profile={[[top[0] * 0.92, top[1] - 0.06], [top[0] * 0.8, top[1] + 0.05], [top[0] * 0.4, top[1] + 0.1], [0.02, top[1] + 0.11]]} sides={7} wobble={0.18} seed={seed} color={fill} contact={false} /> : null}
      <ContactShade r={prof[1][0] * 1.8} />
    </group>
  );
};

/** A three-legged milking stool: a round seat of two planks, splayed legs. */
export const Stool: React.FC<{pos: V3; rotY?: number; seed?: number}> = ({pos, rotY = 0, seed = 4}) => {
  const top = woodTex('stool', 256, 256, seed, {base: '#8e6a46', n: 2});
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow><cylinderGeometry args={[0.19, 0.18, 0.05, 11]} />{mat(top)}</mesh>
      {[0, 2.1, 4.2].map((a) => <Stick key={a} a={new THREE.Vector3(Math.sin(a) * 0.1, 0.41, Math.cos(a) * 0.1)} b={new THREE.Vector3(Math.sin(a) * 0.2, 0, Math.cos(a) * 0.2)} t={0.04} c="#5e432c" cast />)}
      <ContactShade r={0.3} />
    </group>
  );
};

// ---------------------------------------------------------------- firewood, the chopping block and the axe
const barkTex = (seed: number) => tex(`camp-bark-${seed}`, 256, 256, (c, W, H) => { const r = rnd(seed); c.fillStyle = '#4e3a2a'; c.fillRect(0, 0, W, H); for (let k = 0; k < 40; k++) { const y = r() * H; c.fillStyle = r() < 0.5 ? 'rgba(30,20,14,0.6)' : 'rgba(120,96,70,0.4)'; c.fillRect(0, y, W, 2 + r() * 5); } for (let k = 0; k < 12; k++) blob(c, r() * W, r() * H, 20 + r() * 30, 'rgba(90,100,70,0.25)'); });
const endTex = (seed: number) => tex(`camp-endgrain-${seed}`, 128, 128, (c, W) => { const r = rnd(seed); c.fillStyle = '#c9a272'; c.fillRect(0, 0, W, W); c.fillStyle = '#5a3f2a'; c.beginPath(); c.arc(64, 64, 64, 0, 7); c.arc(64, 64, 56, 0, 7, true); c.fill(); for (let q = 1; q < 6; q++) { c.strokeStyle = `rgba(120,80,45,${0.3 + r() * 0.3})`; c.lineWidth = 1.5; c.beginPath(); c.arc(64 + r() * 4, 64 + r() * 4, q * 9, 0, 7); c.stroke(); } c.strokeStyle = 'rgba(70,45,25,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + 50 * Math.cos(r() * 6), 64 + 50 * Math.sin(r() * 6)); c.stroke(); });
const Log: React.FC<{p: V3; r: number; L: number; rot?: V3; seed?: number}> = ({p, r, L, rot = [0, 0, Math.PI / 2], seed = 1}) => (
  <mesh position={p} rotation={rot} castShadow receiveShadow><cylinderGeometry args={[r, r * 1.04, L, 8]} /><meshLambertMaterial attach="material-0" map={barkTex(seed % 3)} /><meshLambertMaterial attach="material-1" map={endTex(seed % 4)} /><meshLambertMaterial attach="material-2" map={endTex((seed + 1) % 4)} /></mesh>
);
/** A pile of split logs lying along x, three rows, end grain with rings facing the lens. */
export const LogPile: React.FC<{pos: V3; rotY?: number; seed?: number; rows?: number}> = ({pos, rotY = 0, seed = 1, rows = 3}) => {
  const logs = useMemo(() => { const r = rnd(seed), out: [V3, number, number][] = []; for (let j = 0; j < rows; j++) for (let i = 0; i < rows + 1 - j; i++) { const rr = 0.09 + r() * 0.03; out.push([[(i - (rows - j) / 2) * 0.22 + (r() - 0.5) * 0.04, 0.1 + j * 0.18, (r() - 0.5) * 0.08], rr, 0.9 + r() * 0.25]); } return out; }, [seed, rows]);
  return <group position={pos} rotation={[0, rotY, 0]}>{logs.map(([p, rr, L], i) => <Log key={i} p={[p[0], p[1], p[2]]} r={rr} L={L} rot={[Math.PI / 2, 0, 0]} seed={seed + i} />)}<ContactShade r={0.7} /></group>;
};
/** A bundle of thin firewood sticks tied with two rope bands, lying on the ground. */
export const StickBundle: React.FC<{pos: V3; rotY?: number; seed?: number}> = ({pos, rotY = 0, seed = 1}) => {
  const st = useMemo(() => { const r = rnd(seed); return Array.from({length: 13}, (_, i) => { const a = (i / 13) * 6.28 * 1.7, q = i < 6 ? 0.07 : 0.14; return [Math.cos(a) * q, 0.16 + Math.sin(a) * q * 0.9, (r() - 0.5) * 0.16, 0.025 + r() * 0.015, 0.95 + r() * 0.3] as const; }); }, [seed]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {st.map(([y, z0, x, rr, L], i) => <Log key={i} p={[x, z0, y]} r={rr} L={L} seed={seed + i} />)}
      {[-0.28, 0.26].map((x) => <mesh key={x} position={[x, 0.16, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.17, 0.013, 5, 16]} /><meshLambertMaterial color="#b29e72" /></mesh>)}
      <ContactShade r={0.6} />
    </group>
  );
};
/** A chopping block (a stump with bark and end grain) with an axe bitten into its top, chips round its foot. */
/** cast = false: the axe casts no shadow (by a low sun its shadow on a tent reads as a strange blob, d1c4 shot 10) */
export const ChopBlock: React.FC<{pos: V3; rotY?: number; seed?: number; cast?: boolean}> = ({pos, rotY = 0, seed = 2, cast = true}) => {
  const head = useMemo(() => { const s = new THREE.Shape(); s.moveTo(0, -0.03); s.lineTo(0.13, -0.07); s.quadraticCurveTo(0.17, 0, 0.13, 0.07); s.lineTo(0, 0.03); s.lineTo(-0.05, 0.03); s.lineTo(-0.05, -0.03); return new THREE.ExtrudeGeometry(s, {depth: 0.03, bevelEnabled: false}); }, []);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Log p={[0, 0.24, 0]} r={0.27} L={0.48} rot={[0, 0, 0]} seed={seed} />
      <group position={[0.02, 0.5, 0.02]} rotation={[0, 0.3, -0.55]}>
        <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={cast}><boxGeometry args={[0.04, 0.03, 0.06]} /><meshLambertMaterial color="#3a3836" /></mesh>
        <mesh geometry={head} position={[-0.03, 0, -0.015]} rotation={[0, 0, -Math.PI / 2]} castShadow={cast}><meshLambertMaterial color="#55575c" /></mesh>
        <mesh position={[-0.05, 0.36, 0]} castShadow={cast}><boxGeometry args={[0.035, 0.7, 0.03]} /><meshLambertMaterial color="#9a7a52" /></mesh>
      </group>
      {[[0.38, 0.1, 0.2], [-0.3, 0.25, -0.6], [0.2, -0.36, 1.1], [0.45, -0.15, 2]].map(([x, z, a], i) => <B key={i} p={[x, 0.012, z]} s={[0.12, 0.02, 0.05]} c={i % 2 ? '#c9a272' : '#a7825a'} r={[0, a, 0]} cast={false} />)}
      <ContactShade r={0.45} />
    </group>
  );
};

// ---------------------------------------------------------------- cloth: rugs, blankets, washing
type ClothKind = 'shirt' | 'pants' | 'cloth' | 'blanket' | 'rug';
const paintCloth = (kind: ClothKind, col: string, col2: string, seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), S = (pts: number[][], f: string) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H))); c.closePath(); c.fillStyle = f; c.fill(); };
  if (kind === 'shirt') { S([[0.08, 0], [0.92, 0], [0.9, 0.62], [0.78, 0.66], [0.62, 0.66], [0.5, 0.74], [0.38, 0.66], [0.22, 0.66], [0.1, 0.62]], col); S([[0.0, 0.04], [0.1, 0.02], [0.14, 0.96], [0.02, 1.0]], tone(col, 0.9)); S([[0.9, 0.02], [1.0, 0.04], [0.98, 1.0], [0.86, 0.96]], tone(col, 0.9)); }
  else if (kind === 'pants') { S([[0.1, 0], [0.9, 0], [0.92, 0.12], [0.86, 1.0], [0.58, 1.0], [0.5, 0.36], [0.42, 1.0], [0.14, 1.0], [0.08, 0.12]], col); c.fillStyle = tone(col, 0.75); c.fillRect(0.1 * W, 0, 0.8 * W, 0.08 * H); S([[0.56, 0.7], [0.8, 0.68], [0.8, 0.86], [0.57, 0.88]], tone(col2, 1)); }
  else { c.fillStyle = col; c.fillRect(0, 0, W, H * (kind === 'cloth' ? 0.94 : 0.92)); }
  if (kind === 'blanket' || kind === 'rug') {   // woven stripes, a border of lozenges, a fringe
    const bands = kind === 'rug' ? [0.08, 0.2, 0.72, 0.84] : [0.12, 0.3, 0.5, 0.7];
    bands.forEach((y, i) => { c.fillStyle = i % 2 ? col2 : tone(col2, 0.6); c.fillRect(0, y * H, W, H * 0.05); });
    if (kind === 'rug') for (let x = W * 0.06; x < W; x += W * 0.11) { c.fillStyle = tone(col2, 1.15); c.beginPath(); c.moveTo(x, H * 0.38); c.lineTo(x + W * 0.04, H * 0.46); c.lineTo(x, H * 0.54); c.lineTo(x - W * 0.04, H * 0.46); c.fill(); c.fillStyle = tone(col, 0.7); c.fillRect(x - 3, H * 0.44, 6, H * 0.04); }
    c.strokeStyle = tone(col2, 1.1); c.lineWidth = 3; for (let x = 4; x < W; x += 10) { c.beginPath(); c.moveTo(x, H * 0.92); c.lineTo(x + (r() - 0.5) * 6, H * (0.97 + r() * 0.03)); c.stroke(); }
  }
  if (kind === 'cloth') { c.strokeStyle = tone(col2, 1); c.lineWidth = 4; c.setLineDash([8, 6]); c.strokeRect(W * 0.05, H * 0.05, W * 0.9, H * 0.84); c.setLineDash([]); }
  c.globalCompositeOperation = 'source-atop';
  for (let k = 0; k < 7; k++) { const x = r() * W, w = W * (0.03 + r() * 0.08); const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(20,16,24,${0.12 + r() * 0.15})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - w, 0, w * 2, H); }
  for (let k = 0; k < 4; k++) { const x = r() * W; c.fillStyle = 'rgba(255,250,235,0.12)'; c.fillRect(x, 0, W * 0.02, H); }
  for (let k = 0; k < 3; k++) blob(c, r() * W, r() * H, W * 0.12, 'rgba(60,45,30,0.18)');
  const g = c.createLinearGradient(0, 0, 0, H * 0.12); g.addColorStop(0, 'rgba(20,16,20,0.3)'); g.addColorStop(1, 'rgba(20,16,20,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H * 0.12);
  c.globalCompositeOperation = 'source-over';
};
const CLOTH: Record<ClothKind, [number, number]> = {shirt: [0.62, 0.62], pants: [0.5, 0.82], cloth: [0.5, 0.46], blanket: [1.0, 0.9], rug: [1.1, 0.8]};
const clothTex = (kind: ClothKind, col: string, col2: string, seed: number) => tex(`camp-cloth-${kind}-${col}-${col2}-${seed}`, 256, Math.round(256 * CLOTH[kind][1] / CLOTH[kind][0]), paintCloth(kind, col, col2, seed));
export type Wash = {k: ClothKind; c: string; c2?: string};
/** A washing line between two forked sticks, the rope sagging, the washing hung on it with pegs: shirts, trousers, cloths,
 *  a striped blanket, a rug. a, b = the feet of the two sticks; h = rope height. */
export const ClothesLine: React.FC<{a: V3; b: V3; h?: number; sag?: number; items: Wash[]; seed?: number}> = ({a, b, h = 1.9, sag = 0.22, items, seed = 1}) => {
  const A = v3(a), Bv = v3(b), yaw = -Math.atan2(Bv.z - A.z, Bv.x - A.x), at = (s: number) => A.clone().lerp(Bv, s).setY(h - sag * 4 * s * (1 - s));
  const pole = (p: THREE.Vector3, k: number) => <group key={k}><Stick a={p.clone().setY(0)} b={p.clone().setY(h + 0.12)} t={0.06} c="#5a4430" cast /><Stick a={p.clone().setY(h - 0.05)} b={p.clone().add(new THREE.Vector3(0.1, h + 0.2, 0))} t={0.04} c="#5a4430" /><Stick a={p.clone().setY(h - 0.05)} b={p.clone().add(new THREE.Vector3(-0.1, h + 0.2, 0))} t={0.04} c="#5a4430" /></group>;
  const N = 10, rope = Array.from({length: N}, (_, i) => <Stick key={i} a={at(i / N)} b={at((i + 1) / N)} t={0.014} c="#cbbd98" />);
  const total = items.reduce((s, it) => s + CLOTH[it.k][0] + 0.12, 0), L = A.distanceTo(Bv), start = (L - total) / 2 / L;
  let acc = start * L;
  return (
    <group>
      {pole(A, 0)}{pole(Bv, 1)}{rope}
      {items.map((it, i) => {
        const [w, hh] = CLOTH[it.k], s = (acc + 0.06 + w / 2) / L; acc += w + 0.12;
        const p = at(s), slope = (at(s + 0.02).y - at(s - 0.02).y) / (0.04 * L), m = clothTex(it.k, it.c, it.c2 ?? '#d8c8a0', seed + i);
        return (
          <group key={i} position={[p.x, p.y + 0.01, p.z]} rotation={[0, yaw + (i % 2 ? 0.08 : -0.06), Math.atan(slope) * 0.8]}>
            <mesh position={[0, -hh / 2, 0]} castShadow receiveShadow><planeGeometry args={[w, hh]} />{mat(m, {transparent: true, alphaTest: 0.4, side: THREE.DoubleSide})}</mesh>
            {[-w * 0.4, w * 0.4].map((x) => <B key={x} p={[x, 0, 0.01]} s={[0.025, 0.07, 0.025]} c="#a88a5e" cast={false} />)}
          </group>
        );
      })}
    </group>
  );
};
/** A rug or a blanket laid on the ground (a doorstep mat, a sitting place by the fire). */
export const GroundRug: React.FC<{pos: V3; w?: number; d?: number; rotY?: number; c?: string; c2?: string; seed?: number}> = ({pos, w = 1.1, d = 0.8, rotY = 0, c = '#7a3428', c2 = '#d6b47a', seed = 3}) => (
  <mesh position={[pos[0], pos[1] + 0.014, pos[2]]} rotation={[-Math.PI / 2, 0, rotY]} receiveShadow><planeGeometry args={[w, d]} />{mat(clothTex('rug', c, c2, seed), {transparent: true, alphaTest: 0.4})}</mesh>
);

// ---------------------------------------------------------------- saddle on its trestle, the hand cart
/** A riding saddle thrown over a wooden trestle on a striped saddle blanket; stirrups hang on their leathers; a bridle with
 *  its reins hangs from the end of the beam. The beam runs along x. */
export const SaddleRack: React.FC<{pos: V3; rotY?: number; seed?: number}> = ({pos, rotY = 0, seed = 3}) => {
  const seat = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-0.32, 0); s.lineTo(-0.3, 0.2); s.quadraticCurveTo(-0.24, 0.24, -0.18, 0.12); s.quadraticCurveTo(0.02, 0.04, 0.2, 0.1); s.quadraticCurveTo(0.3, 0.2, 0.34, 0.18); s.lineTo(0.3, 0); return new THREE.ExtrudeGeometry(s, {depth: 0.3, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1}); }, []);
  const blanket = clothTex('blanket', '#3f5a6e', '#c99a4a', seed), H = 0.86;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Board p={[0, H, 0]} s={[1.3, 0.1, 0.1]} base="#7a5a3a" seed={seed} nails />
      {[-0.55, 0.55].map((x) => [-1, 1].map((k) => <Stick key={x + '' + k} a={new THREE.Vector3(x, H - 0.02, 0)} b={new THREE.Vector3(x + Math.sign(x) * 0.08, 0, k * 0.3)} t={0.06} c="#5e432c" cast />))}
      {[-1, 1].map((k) => <mesh key={k} position={[0, H - 0.2, k * 0.1]} rotation={[-k * 0.28, 0, 0]} castShadow receiveShadow><planeGeometry args={[0.8, 0.5]} />{mat(blanket, {side: THREE.DoubleSide})}</mesh>)}
      <mesh geometry={seat} position={[0, H + 0.06, -0.15]} castShadow receiveShadow><meshLambertMaterial color="#6e4226" /></mesh>
      {[-1, 1].map((k) => <group key={k}>
        <mesh position={[0.02, H - 0.1, k * 0.17]} rotation={[-k * 0.2, 0, 0]} castShadow><boxGeometry args={[0.42, 0.34, 0.015]} /><meshLambertMaterial color="#5a3420" /></mesh>
        <Stick a={new THREE.Vector3(0.02, H + 0.05, k * 0.19)} b={new THREE.Vector3(0.04, H - 0.46, k * 0.3)} t={0.03} c="#4a2c1a" />
        <mesh position={[0.04, H - 0.52, k * 0.3]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.07, 0.012, 4, 10]} /><meshLambertMaterial color="#8d8f94" /></mesh>
      </group>)}
      <group position={[0.66, H - 0.02, 0.06]}>
        <mesh position={[0, -0.22, 0]} scale={[0.6, 1, 1]}><torusGeometry args={[0.2, 0.012, 4, 16]} /><meshLambertMaterial color="#3e2616" /></mesh>
        <mesh position={[0.02, -0.4, 0.02]}><torusGeometry args={[0.05, 0.01, 4, 10]} /><meshLambertMaterial color="#9a9ca2" /></mesh>
        <mesh position={[0.03, -0.42, 0]} scale={[0.35, 1, 1]}><torusGeometry args={[0.38, 0.01, 4, 20]} /><meshLambertMaterial color="#4a2c1a" /></mesh>
      </group>
      <ContactShade r={0.8} />
    </group>
  );
};
/** A two-wheeled hand cart, nose down on its shafts: a plank bed with side boards and stakes, spoked wheels with iron tyres,
 *  loaded with sacks, a rolled blanket and a small crate. Its length runs along x, the shafts towards +x. */
export const HandCart: React.FC<{pos: V3; rotY?: number; seed?: number; load?: boolean}> = ({pos, rotY = 0, seed = 5, load = true}) => {
  const R = 0.44, tilt = -0.2, base = '#8a6640', bed = woodTex('cartbed', 512, 512, seed, {base, n: 5, vertical: true});
  const roll = clothTex('blanket', '#8a3a2c', '#d8c290', seed + 1);
  const Wheel = ({z}: {z: number}) => (
    <group position={[0, R, z]}>
      <mesh castShadow><torusGeometry args={[R - 0.03, 0.035, 5, 24]} /><meshLambertMaterial color="#6a4a2e" /></mesh>
      <mesh><torusGeometry args={[R, 0.016, 4, 28]} /><meshLambertMaterial color={IRON} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.16, 8]} /><meshLambertMaterial color="#4a3422" /></mesh>
      {Array.from({length: 8}, (_, i) => <mesh key={i} rotation={[0, 0, (i * Math.PI) / 8 + seed]}><boxGeometry args={[(R - 0.05) * 2, 0.035, 0.03]} /><meshLambertMaterial color="#7a5a38" /></mesh>)}
    </group>
  );
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Wheel z={0.58} /><Wheel z={-0.58} />
      <group position={[0, R + 0.06, 0]} rotation={[0, 0, tilt]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.06, 1.0]} />{mat(bed)}</mesh>
        {[-1, 1].map((k) => <Board key={k} p={[0, 0.2, k * 0.5]} s={[1.5, 0.3, 0.04]} base={base} seed={seed + k + 2} nails />)}
        <Board p={[-0.75, 0.2, 0]} s={[0.04, 0.3, 1.0]} base={toneHex(base, 0.9)} seed={seed + 6} />
        {[-0.72, 0, 0.72].map((x) => [-1, 1].map((k) => <B key={x + '' + k} p={[x, 0.22, k * 0.53]} s={[0.05, 0.42, 0.04]} c="#5a4028" />))}
        {[-1, 1].map((k) => <Board key={k} p={[1.3, -0.04, k * 0.42]} s={[1.3, 0.06, 0.06]} base="#6a4c30" seed={seed + 9} />)}
        {load ? <>
          <group position={[-0.3, 0.03, -0.18]}><FacetLathe profile={[[0.2, 0], [0.32, 0.12], [0.33, 0.38], [0.22, 0.6], [0.12, 0.66], [0.15, 0.74], [0.02, 0.76]]} sides={9} wobble={0.12} seed={seed} color="#bba475" contact={false} /></group>
          <group position={[0.25, 0.03, 0.2]} rotation={[0, 0, 0.3]}><FacetLathe profile={[[0.18, 0], [0.28, 0.1], [0.3, 0.32], [0.2, 0.52], [0.1, 0.58], [0.02, 0.6]]} sides={9} wobble={0.14} seed={seed + 3} color="#a89466" contact={false} /></group>
          <mesh position={[0.35, 0.18, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.13, 0.13, 0.85, 10]} />{mat(roll)}</mesh>
        </> : null}
      </group>
      <ContactShade r={0.9} />
    </group>
  );
};

// ---------------------------------------------------------------- lights and things that hang at a door
/** Bunch of herbs hung head down to dry: stalks tied at the top, grey-green and dull ochre leaves, a few dry flower heads. */
const herbTex = (seed: number, dry = false) => tex(`camp-herbs-${seed}${dry ? '-dry' : ''}`, 128, 256, (c, W, H) => {
  const r = rnd(seed); c.strokeStyle = '#6e5a3a'; c.lineWidth = 2;
  for (let k = 0; k < 16; k++) { const x1 = W / 2 + (r() - 0.5) * W * 0.8, y1 = H * (0.6 + r() * 0.38); c.beginPath(); c.moveTo(W / 2, 14); c.quadraticCurveTo(W / 2 + (x1 - W / 2) * 0.3, H * 0.4, x1, y1); c.stroke();
    for (let q = 0; q < 5; q++) { const t = 0.3 + q * 0.15, x = W / 2 + (x1 - W / 2) * t, y = 14 + (y1 - 14) * t; c.fillStyle = r() < 0.6 ? tone(dry ? '#3e3a2e' : '#7d8a5e', 0.8 + r() * 0.4) : tone(dry ? '#4a3e2a' : '#a8915a', 0.8 + r() * 0.4); c.beginPath(); c.ellipse(x + (r() - 0.5) * 8, y, 6 + r() * 4, 11 + r() * 6, (r() - 0.5) * 1.2, 0, 7); c.fill(); }
    if (r() < 0.4) { c.fillStyle = dry ? '#5a4a40' : '#c9a0b0'; c.beginPath(); c.arc(x1, y1, 5, 0, 7); c.fill(); } }
  c.fillStyle = '#c8b48a'; c.fillRect(W / 2 - 12, 6, 24, 12); c.fillStyle = '#8a744e'; c.fillRect(W / 2 - 12, 12, 24, 3);
});
/** a charm: a disc with an eye on it and a red tassel under it */
const charmTex = () => tex('camp-charm', 64, 160, (c, W) => { c.fillStyle = '#b9302a'; for (let k = 0; k < 9; k++) c.fillRect(20 + k * 3, 70, 2, 80 + (k % 3) * 6); c.fillStyle = '#c9a04a'; c.fillRect(18, 62, 28, 10); c.fillStyle = '#2c4f8a'; c.beginPath(); c.arc(W / 2, 32, 28, 0, 7); c.fill(); c.fillStyle = '#e8e4d6'; c.beginPath(); c.arc(W / 2, 32, 18, 0, 7); c.fill(); c.fillStyle = '#6fa0d0'; c.beginPath(); c.arc(W / 2, 32, 11, 0, 7); c.fill(); c.fillStyle = '#141414'; c.beginPath(); c.arc(W / 2, 32, 5, 0, 7); c.fill(); });
const Bell: React.FC<{p: V3; quiet?: boolean}> = ({p, quiet}) => <group position={p}><Stick a={new THREE.Vector3(0, 0, 0)} b={new THREE.Vector3(0, -0.12, 0)} t={0.006} c="#3a2c20" recv={!quiet} />{quiet ? <mesh position={[0, -0.16, 0]}><cylinderGeometry args={[0.014, 0.045, 0.08, 8]} /><meshLambertMaterial color="#b88a3a" /></mesh> : <FacetLathe profile={[[0.045, -0.2], [0.04, -0.17], [0.028, -0.13], [0.012, -0.12]]} sides={8} color="#b88a3a" contact={false} cast={false} />}</group>;
/** A crooked pole stuck in the ground beside a tent door with an arm reaching towards it: a small lantern hangs from the end
 *  (dim, so the lit door stays the brightest thing), and from the arm hang a bunch of drying herbs, two bells and an
 *  eye charm. arm = length and direction of the arm along x (negative = towards -x). glow 0 = unlit. */
/** shadow 'none' = the pole and everything on it cast no shadow. By a low sun from the left the upright's shadow is stretched
 *  sideways across tent A's door into a thick bar ending in a knob (the pole top and arm) that nobody could read (d1c4 shot 10,
 *  23/11/2026); 'pole' = only the upright casts. */
export const DoorPole: React.FC<{pos: V3; arm?: number; h?: number; glow?: number; herbs?: boolean; dry?: boolean; shadow?: 'full' | 'pole' | 'none'; bui?: boolean}> = ({pos, arm = 0.75, h = 2.05, glow = 1, herbs = true, dry = false, bui = true, shadow = 'full'}) => {
  const all = shadow === 'full';
  const top = new THREE.Vector3(0.04, h, 0), end = new THREE.Vector3(arm, h - 0.04, 0), L = h - 0.28;
  return (
    <group position={pos}>
      <Stick a={new THREE.Vector3(0, 0, 0)} b={top} t={0.07} c="#4e3a28" cast={shadow !== 'none'} recv={shadow !== 'none'} />
      <Stick a={top.clone().setY(h - 0.06)} b={end} t={0.05} c="#4e3a28" cast={all} recv={all} />
      <Stick a={end} b={end.clone().setY(L + 0.18)} t={0.008} c="#2a2420" recv={all} />
      <group position={[end.x, L, end.z]}>
        <B p={[0, 0.17, 0]} s={[0.17, 0.035, 0.17]} c="#2f2a24" cast={all} recv={all} /><B p={[0, -0.12, 0]} s={[0.19, 0.04, 0.19]} c="#2f2a24" cast={all} recv={all} />
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => <B key={a + '' + b} p={[a * 0.075, 0.025, b * 0.075]} s={[0.018, 0.28, 0.018]} c="#2f2a24" cast={false} recv={all} />)}
        <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.12, 0.22, 0.12]} /><meshBasicMaterial color={glow > 0 ? '#f6c977' : '#4a443a'} /></mesh>
        {glow > 0 ? <>{bui ? <NguonBui kieu="nen" pos={[0, 0.02, 0]} mau="#ffb860" k={Math.min(1, glow)} /> : null}<Halo pos={[0, 0.02, 0.15]} r={0.55} strength={0.28 * glow} /><pointLight position={[0, 0, 0.35]} color="#ffb860" intensity={1.6 * glow} distance={4} decay={2} /></> : null}
      </group>
      {herbs ? <mesh position={[arm * 0.45, h - 0.36, 0.03]} castShadow={all}><planeGeometry args={[0.26, 0.52]} />{mat(herbTex(3, dry), {transparent: true, alphaTest: 0.4, side: THREE.DoubleSide})}</mesh> : null}
      {all ? <><Bell p={[arm * 0.2, h - 0.08, 0.02]} /><Bell p={[arm * 0.72, h - 0.07, 0.02]} /></> : <><Bell p={[arm * 0.2, h - 0.08, 0.02]} quiet /><Bell p={[arm * 0.72, h - 0.07, 0.02]} quiet /></>}
      <Stick a={new THREE.Vector3(arm * 0.86, h - 0.06, 0.02)} b={new THREE.Vector3(arm * 0.86, h - 0.2, 0.02)} t={0.006} c="#3a2c20" recv={all} />
      <mesh position={[arm * 0.86, h - 0.36, 0.03]}><planeGeometry args={[0.1, 0.25]} />{mat(charmTex(), {transparent: true, alphaTest: 0.4, side: THREE.DoubleSide})}</mesh>
    </group>
  );
};

const puffTex = () => tex('camp-puff', 128, 128, (c, W) => { const g = c.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });
/** Thin smoke out of a smoke hole: grey discs rising, swelling and fading, drifting with the wind (f = frame). */
export const TentSmoke: React.FC<{pos: V3; f?: number; n?: number; wind?: number}> = ({pos, f = 0, n = 9, wind = 0.5}) => (
  <group position={pos}>{Array.from({length: n}, (_, i) => {
    const life = 120, u = (((f + (i * life) / n) % life) + life) % life / life, y = u * 2.6, x = u * u * wind * 2 + Math.sin(u * 5 + i) * 0.08, rr = 0.12 + u * 0.5;
    return <mesh key={i} position={[x, y, 0.02 * i]} renderOrder={4}><planeGeometry args={[rr * 2.4, rr * 2.4]} /><meshBasicMaterial map={puffTex()} color="#b3b8c8" transparent opacity={0.32 * Math.min(1, u * 6) * (1 - u)} depthWrite={false} /></mesh>;
  })}</group>
);

/** A small cooking hearth: a ring of stones round ash and glowing embers, a tripod of sticks with a black pot hanging on a
 *  chain. glow 0 = cold. Dimmer than any lit door. */
export const CookHearth: React.FC<{pos: V3; f?: number; glow?: number; seed?: number}> = ({pos, f = 0, glow = 1, seed = 2}) => {
  const st = useMemo(() => { const r = rnd(seed); return Array.from({length: 8}, (_, i) => { const a = (i / 8) * 6.28 + r() * 0.3; return [Math.cos(a) * 0.42, Math.sin(a) * 0.36, 0.1 + r() * 0.06, r()] as const; }); }, [seed]);
  const k = 1 + 0.08 * Math.sin(f * 0.23) + 0.05 * Math.sin(f * 0.41), top = new THREE.Vector3(0, 1.25, 0);
  return (
    <group position={pos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><circleGeometry args={[0.38, 16]} /><meshLambertMaterial color="#4a4648" /></mesh>
      {st.map(([x, z, s, q], i) => <FacetLathe key={i} pos={[x, 0, z]} profile={[[s, 0], [s * 1.1, s * 0.5], [s * 0.6, s], [0.01, s * 1.04]]} sides={6} wobble={0.28} seed={seed + i} color={q < 0.5 ? '#6f7180' : '#5f6170'} contact={false} />)}
      {glow > 0 ? <>
        {Array.from({length: 7}, (_, i) => <mesh key={i} position={[Math.sin(i * 2.3) * 0.16, 0.03, Math.cos(i * 2.3) * 0.12]} rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[0.05 + (i % 3) * 0.02, 6]} /><meshBasicMaterial color={i % 2 ? '#ff7a2e' : '#ffb04a'} /></mesh>)}
        <Halo pos={[0, 0.2, 0.1]} r={0.7 * k} color="#ff8a3c" strength={0.3 * glow} order={2} />
        <pointLight position={[0, 0.35, 0.4]} color="#ff8a40" intensity={2.4 * glow * k} distance={3.2} decay={2} />
      </> : null}
      {[0.4, 2.5, 4.4].map((a) => <Stick key={a} a={new THREE.Vector3(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.52)} b={top.clone().add(new THREE.Vector3(Math.cos(a) * 0.06, 0.12, Math.sin(a) * 0.06))} t={0.045} c="#3a2a1e" cast />)}
      <Stick a={top} b={new THREE.Vector3(0, 0.62, 0)} t={0.01} c="#2a2624" />
      <ClayPot pos={[0, 0.34, 0]} kind="pot" s={1.1} iron seed={seed} />
      <TentSmoke pos={[0, 0.7, 0]} f={f} n={5} wind={0.3} />
    </group>
  );
};

// ---------------------------------------------------------------- the nomad tent
export type NomadTentProps = {
  pos: V3; s?: number; rotY?: number; seed?: number;
  /** canvas colour (it fades unevenly from it), trim colours of the painted borders, how worn (0-1) */
  cloth?: string; trim?: [string, string]; age?: number;
  /** pattern of the border: 0 triangles, 1 lozenges, 2 zig-zag, 3 plain bands */
  pattern?: number; patches?: number; lit?: boolean; poles?: number; res?: number;
  /** 0 = standing; 0-1 = being struck (the crossing sinks, the cloth spreads and crumples); 1 = down: a heap of cloth with the
   *  poles laid beside it */
  down?: number;
  /** what shows in an unlit door: 'dark' (night) or 'day' (the dim warm inside: a rug, a chest, a pot, herbs) */
  inside?: 'dark' | 'day';
  /** the door flaps let down and closed (an empty tent) */
  closed?: boolean;
  /** the tent's smoke rising (frame number), only when smoke is set */
  smoke?: boolean; f?: number;
};
type Look = Required<Omit<NomadTentProps, 'pos' | 'rotY' | 's' | 'smoke' | 'f' | 'down' | 'closed'>>;
const R0 = 2.0, HT = 3.3, YC = 2.72, Y0 = 0.04, DOORTOP = 1.55;
/** the frame of one tent: pole feet (a little uneven), the apex leaning back, and the cover surface as a function */
const tentFrame = (seed: number, N: number, down = 0) => {
  const r = rnd(seed * 7 + 1), apex = new THREE.Vector3((r() - 0.5) * 0.06, HT * (1 - 0.74 * down), -0.14), feet = Array.from({length: N}, (_, k) => { const a = (k - 0.5) * (Math.PI * 2 / N), rr = R0 * (1 + (r() - 0.5) * 0.06); return new THREE.Vector3(Math.sin(a) * rr, 0, Math.cos(a) * rr); });
  const da = (Math.PI * 2) / N, pole = (k: number, y: number) => feet[((k % N) + N) % N].clone().lerp(apex, y / HT);
  const sagAt = (t: number, y: number, j: number) => (0.035 + 0.02 * ((j * 37) % 5) / 5) * Math.sin(Math.PI * t) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, (y - Y0) / (YC - Y0))));
  /** a point of the cover at angle a (0 = the door, facing +z) and height y, pushed out by off along the normal */
  const at = (a: number, y: number, off = 0) => {
    const q = a / da + 0.5, j = Math.floor(q), t = q - j, L = pole(j, y), Rr = pole(j + 1, y), p = L.clone().lerp(Rr, t), axis = apex.clone().multiplyScalar(y / HT);
    const inward = new THREE.Vector3(p.x - axis.x, 0, p.z - axis.z); const s = sagAt(t, y, ((j % N) + N) % N) * (1 + 2.5 * down); p.x -= inward.x * s; p.z -= inward.z * s;
    if (down > 0) {   // coming down: the cloth spreads out at the foot and crumples into folds
      const k = (y - Y0) / (YC - Y0), spread = 1 + down * 0.4 * (1 - k) * (1 - k), crumple = down * 0.16 * Math.sin(a * 11 + y * 6 + seed) * Math.sin(Math.PI * Math.min(1, k + 0.05));
      p.x = axis.x + (p.x - axis.x) * spread + (inward.x / Math.max(0.01, inward.length())) * crumple; p.z = axis.z + (p.z - axis.z) * spread + (inward.z / Math.max(0.01, inward.length())) * crumple;
      p.y = Math.max(0.02, p.y + down * 0.06 * Math.sin(a * 7 + y * 13));
    }
    if (off) { const n = new THREE.Vector3(inward.x, (inward.length() * R0) / HT, inward.z).normalize(); p.addScaledVector(n, off); }
    return p;
  };
  /** width of a panel at height y (chord between its poles) */
  const pw = (y: number) => 2 * R0 * Math.sin(da / 2) * (1 - y / HT);
  return {apex, feet, pole, at, pw, da, sagAt};
};
const coverGeo = (seed: number, N: number, down = 0) => {
  const F = tentFrame(seed, N, down), r = rnd(seed + 3), P: number[] = [], U: number[] = [], I: number[] = [], nt = 10, nv = 18;
  for (let j = 0; j < N; j++) {
    const base = P.length / 3;
    for (let i = 0; i <= nv; i++) for (let k = 0; k <= nt; k++) {
      const t = k / nt, y = Y0 + (YC - Y0) * (i / nv), a = (j - 0.5 + t) * F.da, p = F.at(a, y);
      if (i === 0) p.y -= r() * 0.03;   // the hem is not cut straight
      P.push(p.x, p.y, p.z); U.push((j + t) / N + UOFF(N) - (j >= Math.ceil(N / 2) ? 1 : 0), i / nv);
    }
    for (let i = 0; i < nv; i++) for (let k = 0; k < nt; k++) { const a = base + i * (nt + 1) + k, b = a + nt + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
};
/** canvas position of the cover point at angle a, height y */
/** u offset: the door (a = 0) near u = 0.5 and the seam of the texture on a pole at the back */
const UOFF = (N: number) => 0.5 - (N % 2 ? 0.5 / N : 0);
const uvAt = (a: number, y: number, N: number, TW: number, TH: number): [number, number] => { const da = (Math.PI * 2) / N, u = (a / da + 0.5) / N + UOFF(N); return [(((u % 1) + 1) % 1) * TW, (1 - (y - Y0) / (YC - Y0)) * TH]; };
const doorHW = (y: number) => { const q = (y - Y0) / (DOORTOP - Y0); return q >= 1 ? 0 : 0.43 * Math.pow(1 - q * q, 0.55); };
const paintCover = (o: Look, TW: number, TH: number, emissive: boolean) => (c: Ctx, W: number, H: number) => {
  const N = o.poles, F = tentFrame(o.seed, N), r = rnd(o.seed * 13 + 5), px = (a: number, y: number) => uvAt(a, y, N, W, H), aW = (w: number, y: number) => (w / Math.max(0.05, F.pw(y))) * F.da;
  const Y = (y: number) => (1 - (y - Y0) / (YC - Y0)) * H, path = (pts: [number, number][]) => { c.beginPath(); pts.forEach(([a, y], i) => { const [X, Yy] = px(a, y); if (i) c.lineTo(X, Yy); else c.moveTo(X, Yy); }); c.closePath(); };
  // the opening of the door, as a closed outline of cover points
  const door: [number, number][] = []; for (let i = 0; i <= 16; i++) { const y = Y0 + (DOORTOP - Y0) * (i / 16); door.push([-aW(doorHW(y), y), y]); } for (let i = 16; i >= 0; i--) { const y = Y0 + (DOORTOP - Y0) * (i / 16); door.push([aW(doorHW(y), y), y]); }
  if (emissive) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); if (!o.lit) return;
    path(door); c.save(); c.clip(); const [dx, dy] = px(0, Y0), g = c.createRadialGradient(dx, dy, 10, dx, dy, H * 0.55); g.addColorStop(0, '#fff0c0'); g.addColorStop(0.55, '#ffcf78'); g.addColorStop(1, '#e8963e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // inside, seen against the lamp: a striped rug hung on the left with a fringe, a chest with a lid and a strap on the right,
    // a round pot on the floor, bunches of herbs hanging from a beam; all a little darker than the light, never black
    const [x0] = px(-aW(0.4, 0.3), 0.3), [x1] = px(aW(0.4, 0.3), 0.3), dw = x1 - x0;
    c.fillStyle = 'rgba(150,62,34,0.42)'; c.fillRect(x0, Y(1.32), dw * 0.3, Y(0.3) - Y(1.32));
    for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? 'rgba(210,160,80,0.35)' : 'rgba(110,40,22,0.4)'; c.fillRect(x0, Y(1.2 - k * 0.2), dw * 0.3, 10); }
    c.fillStyle = 'rgba(120,50,26,0.4)'; for (let x = x0 + 4; x < x0 + dw * 0.3; x += 9) c.fillRect(x, Y(0.3), 3, 16);
    c.fillStyle = 'rgba(96,52,26,0.5)'; c.fillRect(x0 + dw * 0.56, Y(0.42), dw * 0.36, Y(Y0) - Y(0.42)); c.fillStyle = 'rgba(70,36,18,0.5)'; c.fillRect(x0 + dw * 0.54, Y(0.46), dw * 0.4, Y(0.38) - Y(0.46)); c.fillRect(x0 + dw * 0.72, Y(0.46), dw * 0.05, Y(Y0) - Y(0.46));
    c.fillStyle = 'rgba(80,40,20,0.45)'; c.beginPath(); c.ellipse(x0 + dw * 0.43, Y(0.16), dw * 0.09, (Y(Y0) - Y(0.3)) * 0.55, 0, 0, 7); c.fill(); c.fillRect(x0 + dw * 0.4, Y(0.33), dw * 0.06, 12);
    c.fillStyle = 'rgba(110,70,30,0.4)'; c.fillRect(x0 - 20, Y(1.42), dw + 40, 7);
    for (let k = 0; k < 4; k++) { const hx = x0 + dw * (0.38 + k * 0.12); c.strokeStyle = 'rgba(90,70,40,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx, Y(1.42)); c.lineTo(hx, Y(1.34)); c.stroke(); c.fillStyle = 'rgba(100,110,60,0.35)'; c.beginPath(); c.moveTo(hx - 10, Y(1.34)); c.lineTo(hx + 10, Y(1.34)); c.lineTo(hx + 4, Y(1.12)); c.lineTo(hx - 4, Y(1.12)); c.fill(); }
    c.restore(); return;
  }
  // 1. the strips of cloth the cover was sewn from, each its own tone; the canvas fades unevenly
  const bolts = [Y0, 0.52, 1.02, 1.5, 1.96, 2.38, YC + 0.1];
  for (let b = 0; b < bolts.length - 1; b++) { c.fillStyle = tone(o.cloth, 0.93 + r() * 0.13); c.fillRect(0, Y(bolts[b + 1]), W, Y(bolts[b]) - Y(bolts[b + 1]) + 1); }
  for (let k = 0; k < 26; k++) blob(c, r() * W, r() * H, H * (0.12 + r() * 0.35), r() < 0.5 ? `rgba(255,246,222,${0.06 + 0.08 * o.age})` : `rgba(60,44,30,${0.05 + 0.08 * o.age})`);
  // the weave: fine horizontal and vertical threads
  c.globalAlpha = 0.07; for (let y = 0; y < H; y += 3) { c.fillStyle = y % 6 ? '#000' : '#fff'; c.fillRect(0, y, W, 1); } for (let x = 0; x < W; x += 4) { c.fillStyle = '#000'; c.fillRect(x, 0, 1, H); } c.globalAlpha = 1;
  // creases from the pole tops down into the panels (the cloth pulls from the poles)
  for (let j = 0; j < N; j++) for (let q = 0; q < 3; q++) { const a = (j - 0.5) * F.da + (r() - 0.5) * F.da * 0.3, y0 = 1.2 + r() * 1.3, y1 = y0 - 0.5 - r() * 0.7, a1 = a + (r() < 0.5 ? 1 : -1) * F.da * (0.12 + r() * 0.12); const [X0, Ya] = px(a, y0), [X1, Yb] = px(a1, y1); c.strokeStyle = `rgba(40,30,22,${0.08 + r() * 0.08})`; c.lineWidth = 3 + r() * 5; c.beginPath(); c.moveTo(X0, Ya); c.quadraticCurveTo((X0 + X1) / 2 + (r() - 0.5) * 30, (Ya + Yb) / 2, X1, Yb); c.stroke(); }
  // 2. painted border(s): a band near the hem with a pattern, faded and worn
  const band = (yA: number, yB: number, pat: number) => {
    c.fillStyle = tone(o.trim[0], 1, 0.85); c.fillRect(0, Y(yB), W, Y(yA) - Y(yB)); const hgt = Y(yA) - Y(yB), step = hgt * 1.2;
    c.fillStyle = tone(o.trim[1], 1, 0.9); c.strokeStyle = tone(o.trim[1], 1, 0.9); c.lineWidth = hgt * 0.14;
    for (let x = 0; x < W + step; x += step) {
      if (pat === 0) { c.beginPath(); c.moveTo(x, Y(yA) - hgt * 0.1); c.lineTo(x + step / 2, Y(yB) + hgt * 0.15); c.lineTo(x + step, Y(yA) - hgt * 0.1); c.fill(); }
      else if (pat === 1) { const m = (Y(yA) + Y(yB)) / 2; c.beginPath(); c.moveTo(x, m); c.lineTo(x + step * 0.35, Y(yB) + hgt * 0.12); c.lineTo(x + step * 0.7, m); c.lineTo(x + step * 0.35, Y(yA) - hgt * 0.12); c.fill(); }
      else if (pat === 2) { c.beginPath(); c.moveTo(x, Y(yA) - hgt * 0.25); c.lineTo(x + step / 2, Y(yB) + hgt * 0.25); c.lineTo(x + step, Y(yA) - hgt * 0.25); c.stroke(); }
    }
    c.fillStyle = tone(o.trim[1], 0.8, 0.9); c.fillRect(0, Y(yB) - 3, W, 5); c.fillRect(0, Y(yA) - 2, W, 5);
    c.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 40 * o.age; k++) blob(c, r() * W, Y(yA) - r() * hgt, hgt * (0.4 + r()), 'rgba(0,0,0,0.5)'); c.globalCompositeOperation = 'source-over';
  };
  // (the band is drawn on its own layer so worn spots show the cloth under it)
  const lay = document.createElement('canvas'); lay.width = W; lay.height = H; const lc = lay.getContext('2d')!; const keep = c; c = lc;
  band(0.24, 0.44, o.pattern); if (o.pattern !== 3) band(2.0, 2.1, 3);
  c = keep; c.drawImage(lay, 0, 0);
  // 3. seams between the strips: a dark fold line, a light ridge, running stitches
  for (let b = 1; b < bolts.length - 1; b++) { const y = Y(bolts[b]); c.fillStyle = 'rgba(50,38,26,0.45)'; c.fillRect(0, y - 2, W, 4); c.fillStyle = 'rgba(255,245,220,0.25)'; c.fillRect(0, y + 3, W, 3); c.fillStyle = 'rgba(70,56,40,0.55)'; for (let x = r() * 8; x < W; x += 12) c.fillRect(x, y + 8, 6, 2); }
  // lacing pins from the door to the smoke hole: the overlap of the two edges of the cover, closed with wooden pins
  { const [x0, ya] = px(0, DOORTOP + 0.04), [, yb] = px(0, YC); c.fillStyle = 'rgba(50,38,26,0.5)'; c.fillRect(x0 - 3, yb, 6, ya - yb); c.fillStyle = 'rgba(255,245,220,0.2)'; c.fillRect(x0 + 4, yb, 3, ya - yb);
    for (let y = DOORTOP + 0.1; y < YC - 0.05; y += 0.17) { const [X, Yy] = px(0, y); c.fillStyle = '#7a5a3a'; c.fillRect(X - 16, Yy - 3, 32, 6); c.fillStyle = '#c9a672'; c.fillRect(X - 16, Yy - 3, 32, 2); } }
  // 4. rain streaks running down, more from the top
  for (let k = 0; k < 90 + 120 * o.age; k++) { const x = r() * W, y0 = r() * H * 0.5, len = H * (0.15 + r() * 0.5), w = 2 + r() * 6, g = c.createLinearGradient(0, y0, 0, y0 + len); const dk = r() < 0.75; g.addColorStop(0, dk ? `rgba(55,45,38,${0.13 + r() * 0.17})` : 'rgba(255,250,235,0.13)'); g.addColorStop(1, 'rgba(55,45,38,0)'); c.fillStyle = g; c.fillRect(x, y0, w, len); }
  // 5. soot round the smoke hole, running down
  { const g = c.createLinearGradient(0, 0, 0, H * 0.3); g.addColorStop(0, 'rgba(28,24,22,0.85)'); g.addColorStop(0.4, 'rgba(28,24,22,0.35)'); g.addColorStop(1, 'rgba(28,24,22,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H * 0.3);
    for (let k = 0; k < 60; k++) { const x = r() * W, len = H * (0.1 + r() * 0.3), gg = c.createLinearGradient(0, 0, 0, len); gg.addColorStop(0, 'rgba(28,24,22,0.4)'); gg.addColorStop(1, 'rgba(28,24,22,0)'); c.fillStyle = gg; c.fillRect(x, 0, 4 + r() * 12, len); } }
  // 6. dust and mud splashed up from the ground
  { const g = c.createLinearGradient(0, Y(0.6), 0, H); g.addColorStop(0, 'rgba(70,52,36,0)'); g.addColorStop(1, `rgba(70,52,36,${0.4 + 0.25 * o.age})`); c.fillStyle = g; c.fillRect(0, Y(0.6), W, H - Y(0.6));
    for (let k = 0; k < 300; k++) { c.fillStyle = `rgba(60,44,30,${0.15 + r() * 0.3})`; c.beginPath(); c.arc(r() * W, H - Math.pow(r(), 2) * H * 0.2, 1 + r() * 3, 0, 7); c.fill(); } }
  // 7. patches sewn on: each lies in the cloth, a woven texture of its own, a shadow under its lower edge, stitches all round
  const PC = ['#6e4a32', '#8c3b2c', '#5d6a78', '#a08850', '#6a7250', '#7d5a6a'];
  const spots: [number, number][] = [[-1.05, 0.75], [1.1, 1.05], [-0.7, 1.95], [0.85, 0.42], [2.1, 1.4], [-2.0, 0.9], [-1.5, 1.45], [0.4, 2.15], [1.6, 0.7]];
  for (let p = 0; p < o.patches; p++) {
    const [ac, yc] = spots[(p + o.seed) % spots.length], a0 = ac * F.da * 0.9 + (r() - 0.5) * 0.08, y0 = yc + (r() - 0.5) * 0.15, w = 0.22 + r() * 0.24, h = 0.18 + r() * 0.2, rot = (r() - 0.5) * 0.3, col = PC[Math.floor(r() * PC.length)];
    // corners in the local (metres) frame of the cloth, then onto the canvas
    const corner = (u: number, v: number): [number, number] => { const x = u * Math.cos(rot) - v * Math.sin(rot), yy = u * Math.sin(rot) + v * Math.cos(rot); return [a0 + aW(x, y0 + yy), y0 + yy]; };
    const edge = (inset: number) => { const pts: [number, number][] = []; const hw = w / 2 - inset, hh = h / 2 - inset; for (let i = 0; i <= 6; i++) pts.push(corner(-hw + (2 * hw * i) / 6, -hh)); for (let i = 0; i <= 6; i++) pts.push(corner(hw, -hh + (2 * hh * i) / 6)); for (let i = 0; i <= 6; i++) pts.push(corner(hw - (2 * hw * i) / 6, hh)); for (let i = 0; i <= 6; i++) pts.push(corner(-hw, hh - (2 * hh * i) / 6)); return pts; };
    c.save(); c.translate(0, 5); path(edge(0)); c.fillStyle = 'rgba(30,22,16,0.35)'; c.fill(); c.restore();
    path(edge(0)); c.fillStyle = col; c.fill(); c.save(); c.clip(); c.globalAlpha = 0.18; for (let y = 0; y < H; y += 4) { c.fillStyle = '#000'; c.fillRect(0, y, W, 1.5); } c.globalAlpha = 1;
    for (let k = 0; k < 5; k++) blob(c, ...px(a0 + (r() - 0.5) * aW(w, y0), y0 + (r() - 0.5) * h), 30, 'rgba(255,240,210,0.12)'); c.restore();
    c.strokeStyle = 'rgba(30,22,16,0.5)'; c.lineWidth = 2; path(edge(0)); c.stroke();
    c.strokeStyle = '#e6d6aa'; c.lineWidth = 2.5; c.setLineDash([7, 6]); path(edge(0.025)); c.stroke(); c.setLineDash([]);
    // cross stitches at the corners where the patch pulls
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([u, v]) => { const [X, Yy] = px(...corner(u * (w / 2 - 0.03), v * (h / 2 - 0.03))); c.strokeStyle = '#e6d6aa'; c.lineWidth = 2; c.beginPath(); c.moveTo(X - 6, Yy - 6); c.lineTo(X + 6, Yy + 6); c.moveTo(X + 6, Yy - 6); c.lineTo(X - 6, Yy + 6); c.stroke(); });
  }
  // 8. the door: a dark opening (the lit glow is in the emissive map), a bound edge of trim colour stitched down
  if (o.inside === 'day') {   // by day the opening shows the dim warm inside of the tent, not a black hole (23/11/2026)
    const [x0] = px(-aW(0.42, 0.3), 0.3), [x1] = px(aW(0.42, 0.3), 0.3), dw = x1 - x0, yt = Y(DOORTOP), yb = Y(Y0);
    c.save(); path(door); c.clip();
    const g = c.createLinearGradient(0, yt, 0, yb); g.addColorStop(0, '#4e3a2c'); g.addColorStop(0.5, '#6e5240'); g.addColorStop(1, '#5e4434'); c.fillStyle = g; c.fillRect(0, yt - 10, W, yb - yt + 20);
    const lg = c.createLinearGradient(x0, 0, x1, 0); lg.addColorStop(0, 'rgba(255,230,180,0.16)'); lg.addColorStop(0.5, 'rgba(255,230,180,0)'); lg.addColorStop(1, 'rgba(20,12,8,0.2)'); c.fillStyle = lg; c.fillRect(x0 - 20, yt, dw + 40, yb - yt);
    c.fillStyle = 'rgba(140,58,36,0.6)'; c.fillRect(x0, Y(1.3), dw * 0.3, Y(0.3) - Y(1.3)); for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? 'rgba(200,150,80,0.5)' : 'rgba(100,40,24,0.5)'; c.fillRect(x0, Y(1.2 - k * 0.2), dw * 0.3, 9); }
    c.fillStyle = 'rgba(120,70,40,0.85)'; c.fillRect(x0 + dw * 0.56, Y(0.42), dw * 0.36, Y(Y0) - Y(0.42)); c.fillStyle = 'rgba(160,110,64,0.85)'; c.fillRect(x0 + dw * 0.54, Y(0.46), dw * 0.4, Y(0.38) - Y(0.46)); c.fillStyle = 'rgba(70,40,22,0.8)'; c.fillRect(x0 + dw * 0.72, Y(0.46), dw * 0.05, Y(Y0) - Y(0.46));
    c.fillStyle = 'rgba(110,60,36,0.85)'; c.beginPath(); c.ellipse(x0 + dw * 0.43, Y(0.16), dw * 0.09, (Y(Y0) - Y(0.3)) * 0.55, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(150,64,40,0.7)'; c.fillRect(x0 - 10, Y(0.09), dw + 20, Y(Y0) - Y(0.09));
    c.fillStyle = 'rgba(90,60,30,0.7)'; c.fillRect(x0 - 20, Y(1.42), dw + 40, 7);
    for (let k = 0; k < 4; k++) { const hx = x0 + dw * (0.38 + k * 0.12); c.fillStyle = 'rgba(100,110,60,0.7)'; c.beginPath(); c.moveTo(hx - 10, Y(1.34)); c.lineTo(hx + 10, Y(1.34)); c.lineTo(hx + 4, Y(1.12)); c.lineTo(hx - 4, Y(1.12)); c.fill(); }
    const v = c.createRadialGradient((x0 + x1) / 2, Y(0.6), dw * 0.2, (x0 + x1) / 2, Y(0.6), dw * 0.9); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,12,8,0.35)'); c.fillStyle = v; c.fillRect(x0 - 40, yt, dw + 80, yb - yt);
    c.restore();
  } else { path(door); c.fillStyle = '#1b1410'; c.fill(); }
  const rim: [number, number][] = []; for (let i = 0; i <= 16; i++) { const y = Y0 + (DOORTOP - Y0) * (i / 16); rim.push([-aW(doorHW(y) + 0.07, y), y]); } rim.push([0, DOORTOP + 0.07]); for (let i = 16; i >= 0; i--) { const y = Y0 + (DOORTOP - Y0) * (i / 16); rim.push([aW(doorHW(y) + 0.07, y), y]); }
  if (o.inside !== 'day') { c.save(); path(rim); c.clip(); c.fillStyle = tone(o.trim[0], 0.85); c.fillRect(0, 0, W, H); path(door); c.fillStyle = '#1b1410'; c.fill(); c.restore(); }
  else { c.save(); const rp = new Path2D(), add = (pts: [number, number][]) => pts.forEach(([a, y], i) => { const [X, Yy] = px(a, y); if (i) rp.lineTo(X, Yy); else rp.moveTo(X, Yy); }); add(rim); rp.closePath(); add(door); rp.closePath(); c.clip(rp, 'evenodd'); c.fillStyle = tone(o.trim[0], 0.85); c.fillRect(0, 0, W, H); c.restore(); }
  c.strokeStyle = '#e6d6aa'; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); rim.forEach(([a, y], i) => { const [X, Yy] = px(a, y); if (i) c.lineTo(X, Yy); else c.moveTo(X, Yy); }); c.stroke(); c.setLineDash([]);
  // 9. the frayed hem: loose threads and torn notches (cut out; the material uses alphaTest)
  c.globalCompositeOperation = 'destination-out';
  const [dl] = px(-aW(doorHW(Y0) + 0.12, Y0), Y0), [dr] = px(aW(doorHW(Y0) + 0.12, Y0), Y0), off = (x: number) => x > dl && x < dr;
  for (let x = 0; x < W; x += 4 + r() * 12) { if (off(x)) continue; const d = 3 + Math.pow(r(), 4) * 18; c.fillRect(x, H - d, 2 + r() * 3, d); }
  for (let k = 0; k < 7; k++) { const x = r() * W, w = 10 + r() * 24; if (off(x) || off(x + w)) continue; c.beginPath(); c.moveTo(x, H); c.lineTo(x + w / 2, H - 8 - r() * 16); c.lineTo(x + w, H); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  // loose threads hanging from the hem
  for (let k = 0; k < 120; k++) { const x = r() * W; if (off(x)) continue; c.strokeStyle = tone(o.cloth, 0.75, 0.8); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, H - 14); c.lineTo(x + (r() - 0.5) * 8, H - 2); c.stroke(); }
};
/** a door flap let down: canvas a little darker than the cover, folds, the bound edge along the middle, a tie near the foot */
const shutTex = (o: Look) => tex(`camp-shut-${o.seed}-${o.cloth}-${o.trim.join()}`, 256, 512, (c, W, H) => {
  const r = rnd(o.seed + 61); c.fillStyle = tone(o.cloth, 0.8); c.fillRect(0, 0, W, H);
  for (let k = 0; k < 8; k++) { const x = r() * W, g = c.createLinearGradient(x - 16, 0, x + 16, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(30,22,16,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 16, 0, 32, H); }
  c.fillStyle = tone(o.trim[0], 0.8); c.fillRect(0, 0, W * 0.12, H); c.strokeStyle = '#e6d6aa'; c.lineWidth = 3; c.setLineDash([8, 7]); c.beginPath(); c.moveTo(W * 0.14, 0); c.lineTo(W * 0.14, H); c.stroke(); c.setLineDash([]);
  const g2 = c.createLinearGradient(0, H * 0.7, 0, H); g2.addColorStop(0, 'rgba(70,52,36,0)'); g2.addColorStop(1, 'rgba(70,52,36,0.55)'); c.fillStyle = g2; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 40; k++) blob(c, r() * W, r() * H, 20 + r() * 40, 'rgba(90,80,64,0.12)');
  c.fillStyle = '#2e241a'; c.fillRect(0, H * 0.8, W * 0.4, 10);
});
/** a smoke flap: canvas blackened by smoke, darkest along its top, a hem stitched round it */
const earTex = (o: Look) => tex(`camp-ear-${o.seed}-${o.cloth}`, 128, 128, (c, W, H) => {
  const r = rnd(o.seed + 51); c.fillStyle = tone(o.cloth, 0.8); c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, H, 0, 0); g.addColorStop(0, 'rgba(28,24,22,0.35)'); g.addColorStop(1, 'rgba(28,24,22,0.85)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 10; k++) { c.fillStyle = 'rgba(28,24,22,0.3)'; c.fillRect(r() * W, 0, 3 + r() * 5, H * (0.4 + r() * 0.6)); }
  c.strokeStyle = 'rgba(230,214,170,0.5)'; c.lineWidth = 2; c.setLineDash([5, 5]); c.strokeRect(6, 6, W - 12, H - 12); c.setLineDash([]);
});
/** The flaps of the door, folded back to both sides and tied: a cloth lining, a fold line along the door edge, a tie. */
const flapTex = (o: Look) => tex(`camp-flap-${o.seed}-${o.cloth}-${o.trim.join()}`, 256, 512, (c, W, H) => {
  const r = rnd(o.seed + 41); c.fillStyle = tone(o.cloth, 0.86); c.fillRect(0, 0, W, H);
  for (let k = 0; k < 7; k++) { const x = r() * W, g = c.createLinearGradient(x - 20, 0, x + 20, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(30,22,16,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 20, 0, 40, H); }
  c.fillStyle = tone(o.trim[0], 0.85); c.fillRect(0, 0, W * 0.18, H); c.strokeStyle = '#e6d6aa'; c.lineWidth = 3; c.setLineDash([8, 7]); c.beginPath(); c.moveTo(W * 0.2, 0); c.lineTo(W * 0.2, H); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(255,245,220,0.35)'; c.fillRect(0, 0, 6, H);
  const g = c.createLinearGradient(W * 0.75, 0, W, 0); g.addColorStop(0, 'rgba(25,18,12,0)'); g.addColorStop(1, 'rgba(25,18,12,0.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const g2 = c.createLinearGradient(0, H * 0.75, 0, H); g2.addColorStop(0, 'rgba(70,52,36,0)'); g2.addColorStop(1, 'rgba(70,52,36,0.5)'); c.fillStyle = g2; c.fillRect(0, 0, W, H);
  c.fillStyle = '#2e241a'; c.fillRect(0, H * 0.44, W, 18); c.fillStyle = '#c9b68a'; c.fillRect(0, H * 0.44, W, 5); c.fillStyle = '#2e241a'; c.beginPath(); c.ellipse(W * 0.82, H * 0.45, 16, 13, 0, 0, 7); c.fill();
  c.strokeStyle = '#2e241a'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * 0.82, H * 0.46); c.lineTo(W * 0.76, H * 0.56); c.moveTo(W * 0.84, H * 0.46); c.lineTo(W * 0.9, H * 0.55); c.stroke();
});
/** A nomad's tent of the poor (tipi kind): ten poles leaning to a crossing with a rope bound round it and their tops sticking
 *  out of the smoke hole; the cover sewn from strips of canvas with seams and stitches, sagging between the poles, lacing
 *  pins over the door; two smoke flaps on their own poles; a painted border near the hem; patches of other cloths sewn on
 *  flat in the cover, stitched all round; soot round the smoke hole, rain streaks, mud splashed up, a frayed hem held by pegs
 *  and stones; the door bound with trim, its flaps folded back and tied; guy ropes to pegs. Lit = a lamp burns inside. */
export const NomadTent: React.FC<NomadTentProps> = ({pos, s = 1, rotY = 0, seed = 1, cloth = '#b99a68', trim = ['#8c3b2c', '#d8b468'], age = 0.6, pattern = 0, patches = 3, lit: lit0, poles = 10, res = 2048, smoke: smoke0, f = 0, down = 0, closed = false, inside = 'dark'}) => {
  const lit = lit0 && down === 0, smoke = smoke0 && down === 0, dn = Math.round(Math.min(1, Math.max(0, down)) * 60) / 60;
  const o: Look = {seed, cloth, trim, age, pattern, patches, lit: !!lit0, poles, res, inside: lit0 ? 'dark' : inside};
  const key = `${seed}-${cloth}-${trim.join()}-${age}-${pattern}-${patches}-${poles}-${res}${o.inside === 'day' ? '-day' : ''}`;
  const F = useMemo(() => tentFrame(seed, poles, dn), [seed, poles, dn]), geo = useMemo(() => coverGeo(seed, poles, dn), [seed, poles, dn]);
  const map = tex(`camp-cover-${key}`, res, 1024, paintCover(o, res, 1024, false)), emi = tex(`camp-cover-emi-${key}-${lit0 ? 1 : 0}`, res, 1024, paintCover(o, res, 1024, true));
  const r = rnd(seed + 17);
  // pole tops out of the smoke hole: the line through the foot and the crossing, carried on beyond it
  // struck: the poles lie side by side on the ground beside the heap
  const laid = dn >= 1 ? F.feet.map((_, k) => { const z = R0 + 0.35 + k * 0.07, x0 = -2.2 + (k % 3) * 0.15; return <Stick key={k} a={new THREE.Vector3(x0, 0.035, z + 0.03 * Math.sin(k))} b={new THREE.Vector3(x0 + 3.6 + (k % 2) * 0.3, 0.035, z + 0.18)} t={0.065} c={k % 3 ? '#5a4430' : '#4a3626'} cast />; }) : null;
  const poleTops = dn >= 1 ? null : F.feet.map((ft, k) => { const d = F.apex.clone().sub(ft).normalize(), a = F.apex.clone().addScaledVector(d, -(HT - YC + 0.15) / d.y), b = F.apex.clone().addScaledVector(d, 0.45 + r() * 0.45); return <Stick key={k} a={a} b={b} t={0.065} c={k % 3 ? '#5a4430' : '#4a3626'} cast />; });
  // the smoke flaps: two cloth ears beside the lacing line, held out by their own long poles behind the tent
  const ears = [-1, 1].map((k) => {
    const a0 = k * 0.06, a1 = k * 0.75, b0 = F.at(a0, YC), b1 = F.at(a1, YC - 0.05), t0 = F.at(a0 * 0.5, YC).add(new THREE.Vector3(k * 0.05, 0.55, 0.1)), t1 = b1.clone().add(new THREE.Vector3(k * 0.3, 0.42, 0.18));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([b0, b1, t1, b0, t1, t0].flatMap((v) => [v.x, v.y, v.z]), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 0.06, 0.45, 0.04, 0.45, 0, 0.5, 0.06, 0.45, 0, 0.5, 0], 2)); g.computeVertexNormals();
    const foot = new THREE.Vector3(k * 1.4, 0, -R0 - 1.2);
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    return <group key={k}><mesh geometry={g} castShadow receiveShadow>{mat(earTex(o), {side: THREE.DoubleSide})}</mesh><Stick a={foot} b={t1.clone().add(new THREE.Vector3(k * 0.02, 0.08, 0.02))} t={0.038} c="#4e3a28" /></group>;
  });
  // the door flaps, laid on the cover just outside the opening, from the hem to the top of the door
  // closed: the two flaps let down over the opening, overlapping in the middle, a tie at the bottom
  const shut = closed ? [-1, 1].map((k) => {
    const P: number[] = [], U: number[] = [], I: number[] = [], nv = 8, nq = 5;
    for (let i = 0; i <= nv; i++) for (let q = 0; q <= nq; q++) {
      const y = Y0 + (DOORTOP + 0.06 - Y0) * (i / nv), edge = doorHW(Math.min(y, DOORTOP - 0.01)) + 0.09, w = -0.05 * k + (q / nq) * (edge + 0.05), p = F.at(k * (w / Math.max(0.05, F.pw(y))) * F.da, y, 0.02 + (k > 0 ? 0.012 : 0) + 0.015 * Math.sin((Math.PI * q) / nq));
      P.push(p.x, p.y, p.z); U.push(q / nq, i / nv);
    }
    for (let i = 0; i < nv; i++) for (let q = 0; q < nq; q++) { const a = i * (nq + 1) + q, b = a + nq + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    return <mesh key={'shut' + k} geometry={g} castShadow receiveShadow>{mat(shutTex(o), {side: THREE.DoubleSide})}</mesh>;
  }) : null;
  const flaps = closed ? shut : [-1, 1].map((k) => {
    const P: number[] = [], U: number[] = [], I: number[] = [], nv = 8, nq = 4;
    for (let i = 0; i <= nv; i++) for (let q = 0; q <= nq; q++) {
      const y = Y0 + 0.02 + (DOORTOP - 0.02 - Y0) * (i / nv), wdt = 0.07 + 0.48 * (1 - i / nv) * (1 - (i / nv) * 0.3), w = doorHW(y) + (q / nq) * wdt, p = F.at(k * (w / Math.max(0.05, F.pw(y))) * F.da, y, 0.03 + 0.03 * Math.sin((Math.PI * q) / nq));
      P.push(p.x, p.y, p.z); U.push(q / nq, i / nv);
    }
    for (let i = 0; i < nv; i++) for (let q = 0; q < nq; q++) { const a = i * (nq + 1) + q, b = a + nq + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
    return <mesh key={k} geometry={g} castShadow receiveShadow>{mat(flapTex(o), {side: THREE.DoubleSide})}</mesh>;
  });
  // guy ropes from the sides and the back to pegs; pegs all round the hem; stones holding the hem down
  const ropes = [1.25, -1.25, 2.4, -2.4].map((a, i) => { const top = F.at(a, 1.55, 0.02), peg = new THREE.Vector3(Math.sin(a) * (R0 + 1.25), 0.06, Math.cos(a) * (R0 + 1.25) - 0.1), mid = top.clone().lerp(peg, 0.5).add(new THREE.Vector3(0, -0.06, 0));
    return <group key={i}><Stick a={top} b={mid} t={0.016} c="#9c8f70" /><Stick a={mid} b={peg} t={0.016} c="#9c8f70" /><Stick a={peg.clone().setY(-0.05)} b={peg.clone().add(new THREE.Vector3(Math.sin(a) * 0.08, 0.2, Math.cos(a) * 0.08))} t={0.045} c="#5a4633" /></group>; });
  const pegs = Array.from({length: poles * 2}, (_, k) => { const a = ((k + 0.5) / (poles * 2)) * Math.PI * 2, p = F.at(a, Y0 + 0.02, 0.06); if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.32) return null; return <B key={k} p={[p.x, 0.07, p.z]} s={[0.035, 0.16, 0.035]} c={k % 2 ? '#5a4633' : '#6b5440'} r={[Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]} cast={false} />; });
  const stones = Array.from({length: 9}, (_, k) => { const a = 0.55 + (k / 9) * (Math.PI * 2 - 1.1) + (r() - 0.5) * 0.25, p = F.at(a, Y0, 0.05), q = 0.1 + r() * 0.09; return <FacetLathe key={k} pos={[p.x, 0, p.z]} profile={[[q, 0], [q * 1.1, q * 0.45], [q * 0.6, q * 0.9], [0.01, q]]} sides={6} wobble={0.3} seed={seed * 10 + k} color={r() < 0.5 ? '#767887' : '#686a78'} />; });
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      <mesh geometry={geo} castShadow receiveShadow>{mat(map, {emissiveMap: emi, emissive: new THREE.Color(lit ? '#ffffff' : '#000000'), alphaTest: 0.5, side: THREE.DoubleSide})}</mesh>
      {poleTops}{laid}{dn < 0.25 ? ears : null}{flaps}{dn < 0.5 ? ropes : null}{pegs}{stones}
      {dn >= 1 ? null : <><mesh position={F.apex} rotation={[Math.PI / 2, 0, 0.3]}><torusGeometry args={[0.08, 0.026, 5, 10]} /><meshLambertMaterial color="#a8946a" /></mesh>
      <mesh position={F.apex.clone().add(new THREE.Vector3(0, -0.06, 0))} rotation={[Math.PI / 2 + 0.4, 0, 0]}><torusGeometry args={[0.09, 0.022, 5, 10]} /><meshLambertMaterial color="#8f7c56" /></mesh></>}
      {lit ? <><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, R0 + 0.75]} scale={[1, 1.4, 1]}><circleGeometry args={[0.75, 24]} /><meshBasicMaterial color="#f3c06a" transparent opacity={0.22} depthWrite={false} /></mesh><pointLight position={[0, 0.9, R0 + 0.4]} color="#ffc070" intensity={2.2} distance={4.5} decay={2} /></> : null}
      {smoke ? <TentSmoke pos={[F.apex.x, F.apex.y + 0.1, F.apex.z]} f={f} /> : null}
      <ContactShade r={R0 * 1.25} strength={0.3} />
    </group>
  );
};

// ---------------------------------------------------------------- the camp breaking up, the camp in the morning (d1c2)
// ---------------------------------------------------------------- the family caravan (vardo), rebuilt 22/11/2026
// Daniel: "chiếc xe còn khá xấu, chỉ là 1 khối hộp nhìn phẳng". Same place and size as the old `Wagon` (body 3.1 x 1.6 x 1.7,
// wheels at x +-1), but built in three sizes of detail: plank walls with posts, rails and painted folk ornament; a barrel
// roof with overhang, scalloped valance and carved gable boards; window with frame, muntins and open shutters; a door with
// steps at the front; shafts, axles, spoked wheels with iron tyres; a hanging lamp, a stove pipe, things lashed on the roof.
const WREAD = '#9a3426', WTRIM = '#d8ae4a', WGREEN = '#2f5a44';
/** the side wall: red upright planks with grain, a vine of yellow scrolls and leaves along the bottom, a flower medallion in
 *  the wide panel, a row of small dentils under the eaves */
const wagonWallTex = (side: number) => tex(`camp-vardo-wall-${side}`, 1024, 512, (c, W, H) => {
  paintPlanks(30 + side, {base: WREAD, n: 18, vertical: true, knots: 0.25, age: 0.45})(c, W, H);
  const X = (x: number) => ((x + 1.55) / 3.1) * W, Y = (y: number) => H * (1 - y / 1.6);
  c.lineCap = 'round';
  // the vine along the bottom panel
  c.strokeStyle = WTRIM; c.lineWidth = 6; c.beginPath(); for (let x = -1.5; x <= 1.5; x += 0.02) { const y = 0.3 + Math.sin(x * 9) * 0.07; if (x === -1.5) c.moveTo(X(x), Y(y)); else c.lineTo(X(x), Y(y)); } c.stroke();
  for (let x = -1.45; x < 1.5; x += 0.35) { const y = 0.3 + Math.sin(x * 9) * 0.07; c.strokeStyle = WTRIM; c.lineWidth = 4; c.beginPath(); c.arc(X(x + 0.06), Y(y + 0.06), 14, 0, 4.4); c.stroke();
    c.fillStyle = '#4a7a50'; c.beginPath(); c.ellipse(X(x + 0.12), Y(y - 0.06), 16, 7, 0.6, 0, 7); c.fill(); c.fillStyle = '#3a5a9a'; c.beginPath(); c.arc(X(x + 0.18), Y(y + 0.1), 5, 0, 7); c.fill(); }
  // a medallion in the wide panel (x 0.1 - 1.45): flower with eight petals in a yellow ring
  const mx = X(side ? -0.75 : 0.78), my = Y(1.15);
  c.strokeStyle = WTRIM; c.lineWidth = 7; c.beginPath(); c.ellipse(mx, my, 95, 120, 0, 0, 7); c.stroke(); c.lineWidth = 3; c.beginPath(); c.ellipse(mx, my, 80, 104, 0, 0, 7); c.stroke();
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.fillStyle = k % 2 ? '#e8c860' : '#f0e0b0'; c.beginPath(); c.ellipse(mx + Math.cos(a) * 34, my + Math.sin(a) * 40, 22, 12, a, 0, 7); c.fill(); }
  c.fillStyle = '#3a5a9a'; c.beginPath(); c.arc(mx, my, 18, 0, 7); c.fill(); c.fillStyle = '#e8c860'; c.beginPath(); c.arc(mx, my, 8, 0, 7); c.fill();
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([u, v]) => { c.fillStyle = '#4a7a50'; c.beginPath(); c.ellipse(mx + u * 70, my + v * 92, 18, 8, u * v * 0.7, 0, 7); c.fill(); });
  // dentils under the eaves and a thin line above the vine
  for (let x = -1.55; x < 1.55; x += 0.06) { c.fillStyle = WTRIM; c.fillRect(X(x), Y(1.6), X(x + 0.03) - X(x), 14); }
  c.fillStyle = WTRIM; c.fillRect(0, Y(0.52), W, 4); c.fillRect(0, Y(0.1), W, 4);
  // weather: dust up from the bottom, a few scuffs
  const g = c.createLinearGradient(0, H * 0.75, 0, H); g.addColorStop(0, 'rgba(50,36,24,0)'); g.addColorStop(1, 'rgba(50,36,24,0.45)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
});
const wagonEndTex = () => tex('camp-vardo-end', 512, 512, (c, W, H) => {
  paintPlanks(41, {base: WREAD, n: 10, vertical: true, knots: 0.25, age: 0.45})(c, W, H);
  c.strokeStyle = WTRIM; c.lineWidth = 6; c.strokeRect(24, 24, W - 48, H - 48); c.lineWidth = 3; c.strokeRect(40, 40, W - 80, H - 80);
  for (let k = 0; k < 4; k++) { c.fillStyle = WTRIM; c.beginPath(); c.arc(k % 2 ? W - 40 : 40, k < 2 ? 40 : H - 40, 12, 0, 7); c.fill(); }
});
const roofTex = () => tex('camp-vardo-roof', 1024, 256, (c, W, H) => {
  c.fillStyle = WGREEN; c.fillRect(0, 0, W, H); const r = rnd(44);
  for (let x = 0; x < W; x += 64) { c.fillStyle = 'rgba(15,30,22,0.5)'; c.fillRect(x, 0, 4, H); c.fillStyle = 'rgba(120,170,140,0.2)'; c.fillRect(x + 4, 0, 3, H); }   // canvas laps over the roof bows
  for (let k = 0; k < 30; k++) blob(c, r() * W, r() * H, 30 + r() * 60, r() < 0.5 ? 'rgba(20,30,25,0.25)' : 'rgba(150,180,160,0.15)');
  c.fillStyle = WTRIM; c.fillRect(0, 0, W, 6); c.fillRect(0, H - 6, W, 6);
});
const shutterTex = () => tex('camp-vardo-shutter', 128, 256, (c, W, H) => {
  c.fillStyle = WGREEN; c.fillRect(0, 0, W, H); c.strokeStyle = WTRIM; c.lineWidth = 6; c.strokeRect(8, 8, W - 16, H - 16);
  c.fillStyle = WTRIM; c.beginPath(); c.moveTo(W / 2, H * 0.3); c.lineTo(W * 0.78, H / 2); c.lineTo(W / 2, H * 0.7); c.lineTo(W * 0.22, H / 2); c.fill(); c.fillStyle = '#9a3426'; c.beginPath(); c.arc(W / 2, H / 2, 10, 0, 7); c.fill();
  for (let y = 20; y < H; y += 22) { c.fillStyle = 'rgba(10,25,18,0.25)'; c.fillRect(10, y, W - 20, 3); }
});
const Wheel: React.FC<{p: V3; r: number; turn: number}> = ({p, r, turn}) => (
  <group position={p} rotation={[0, 0, turn]}>
    <mesh castShadow><torusGeometry args={[r - 0.04, 0.045, 6, 28]} /><meshLambertMaterial color="#7a2a1c" /></mesh>
    <mesh><torusGeometry args={[r, 0.022, 4, 32]} /><meshLambertMaterial color={IRON} /></mesh>
    {Array.from({length: 12}, (_, i) => <mesh key={i} position={[0, 0, 0]} rotation={[0, 0, (i * Math.PI) / 12]}><boxGeometry args={[(r - 0.06) * 2, 0.04, 0.035]} /><meshLambertMaterial color={i % 2 ? '#b0472a' : '#a63e26'} /></mesh>)}
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.12, 0.2, 10]} /><meshLambertMaterial color={WTRIM} /></mesh>
    <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.055, 0.055, 0.04, 8]} /><meshLambertMaterial color={IRON} /></mesh>
    {[0, 2.1, 4.2].map((a) => <mesh key={a} position={[Math.cos(a) * r, Math.sin(a) * r, 0.03]}><boxGeometry args={[0.03, 0.03, 0.02]} /><meshLambertMaterial color="#8d8a86" /></mesh>)}
  </group>
);
/** The nomad family's caravan (vardo). Body along x, the door end at +x with steps between the shafts; the window side faces
 *  +z. roll = metres rolled towards its own -x (the wheels turn with it); lit = window and lamp burning; load = what is lashed
 *  on the roof: 'light' (a rolled tarp, a basket, a spare wheel) or 'full' (packed for the road: crates, sacks, a chest,
 *  rolled blankets). */
/** bui (mặc định true): đèn dầu treo ở đuôi xe tự đăng ký nguồn bụi 'nen' (lib3/buiNguon). */
export const NomadWagon: React.FC<{pos: V3; rotY?: number; roll?: number; lit?: boolean; load?: 'light' | 'full'; bui?: boolean}> = ({pos, rotY = 0, roll = 0, lit = true, load = 'light', bui = true}) => {
  const dir = new THREE.Vector3(-Math.cos(rotY), 0, Math.sin(rotY)), at = new THREE.Vector3(...pos).addScaledVector(dir, roll);
  const F0 = 0.8, WT = 2.4, L = 3.1, D = 1.7, RISE = 0.42, HALF = 1.02, R = (HALF * HALF + RISE * RISE) / (2 * RISE), TH = Math.asin(HALF / R), YC = WT + RISE - R, RL = 3.7;
  const gable = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-D / 2, 0); for (let i = 0; i <= 16; i++) { const z = -D / 2 + (D * i) / 16; sh.lineTo(z, YC + Math.sqrt(R * R - z * z) - WT - 0.02); } sh.lineTo(D / 2, 0); return new THREE.ShapeGeometry(sh); }, []);
  const wall = (side: 1 | -1) => <mesh position={[0, (F0 + WT) / 2, side * D / 2]} castShadow receiveShadow><boxGeometry args={[L, WT - F0, 0.06]} />{mat(wagonWallTex(side > 0 ? 0 : 1))}</mesh>;
  const post = (x: number, z: number, k: string) => <Board key={k} p={[x, (F0 + WT) / 2, z]} s={[0.09, WT - F0 + 0.04, 0.09]} base={WTRIM} seed={50 + x * 10} />;
  const winX = -0.45, winY = 1.68;
  return (
    <group position={at} rotation={[0, rotY, 0]}>
      {/* undercarriage: beams, axles, the pan box, wheels (rear big, front small) */}
      {[-0.55, 0.55].map((z) => <Board key={z} p={[0, F0 - 0.08, z]} s={[L + 0.2, 0.14, 0.12]} base="#5a3a26" seed={60} />)}
      {[-1.0, 1.05].map((x) => <mesh key={x} position={[x, x < 0 ? 0.66 : 0.54, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.05, 0.05, 2.1, 8]} /><meshLambertMaterial color={IRON} /></mesh>)}
      {[-1.0, 1.05].map((x) => <B key={x} p={[x, (F0 + (x < 0 ? 0.66 : 0.54)) / 2, 0]} s={[0.12, F0 - (x < 0 ? 0.66 : 0.54), 1.2]} c="#4a3020" />)}
      <PlankCrate pos={[0, 0.18, 0]} size={[1.2, 0.5, 1.1]} seed={61} base="#6a3a26" />
      {[-1, 1].map((k) => <React.Fragment key={k}><Wheel p={[-1.0, 0.66, k * 1.0]} r={0.66} turn={roll / 0.66} /><Wheel p={[1.05, 0.54, k * 1.0]} r={0.54} turn={roll / 0.54} /></React.Fragment>)}
      {/* shafts, from the front axle forward to the ground, with a cross bar */}
      {[-0.42, 0.42].map((z) => <Stick key={z} a={new THREE.Vector3(1.0, 0.62, z)} b={new THREE.Vector3(3.35, 0.06, z * 1.25)} t={0.08} c="#6a4228" cast />)}
      <Stick a={new THREE.Vector3(1.9, 0.42, -0.47)} b={new THREE.Vector3(1.9, 0.42, 0.47)} t={0.06} c="#6a4228" />
      {/* the floor and the four walls, posts at the corners and beside the window, rails at sill and eaves */}
      <Board p={[0, F0, 0]} s={[L + 0.08, 0.08, D + 0.08]} base="#5a3a26" seed={62} />
      {wall(1)}{wall(-1)}
      {[-1, 1].map((k) => <mesh key={k} position={[k * L / 2, (F0 + WT) / 2, 0]} castShadow receiveShadow><boxGeometry args={[0.06, WT - F0, D]} />{mat(wagonEndTex())}</mesh>)}
      {[-1.53, -0.98, 0.08, 1.53].flatMap((x) => [post(x, D / 2 + 0.02, 'a' + x), post(x, -D / 2 - 0.02, 'b' + x)])}
      {[-1, 1].map((k) => [F0 + 0.05, WT - 0.04, 1.3].map((y) => <Board key={k + '' + y} p={[0, y, k * (D / 2 + 0.045)]} s={[L + 0.1, 0.07, 0.05]} base={WTRIM} seed={70} />))}
      {[-1, 1].map((k) => [-0.83, 0.83].map((z) => <Board key={k + '' + z} p={[k * (L / 2 + 0.03), (F0 + WT) / 2, z]} s={[0.07, WT - F0 + 0.04, 0.08]} base={WTRIM} seed={71} />))}
      {/* the barrel roof with overhang, gables, scalloped valance, brackets, a stove pipe */}
      <mesh position={[0, YC, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow><cylinderGeometry args={[R, R, RL, 28, 1, true, (3 * Math.PI) / 2 - TH, 2 * TH]} />{mat(roofTex(), {side: THREE.DoubleSide})}</mesh>
      <mesh position={[0, YC - 0.05, 0]} rotation={[0, 0, -Math.PI / 2]}><cylinderGeometry args={[R - 0.05, R - 0.05, RL - 0.02, 28, 1, true, (3 * Math.PI) / 2 - TH, 2 * TH]} /><meshLambertMaterial color="#5a3a26" side={THREE.DoubleSide} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} geometry={gable} position={[k * L / 2, WT, 0]} rotation={[0, k * Math.PI / 2, 0]}><meshLambertMaterial color={WTRIM} side={THREE.DoubleSide} /></mesh>)}
      {[-1, 1].map((k) => [-0.5, 0, 0.5].map((z) => <Stick key={k + '' + z} a={new THREE.Vector3(k * (L / 2 + 0.01), WT, z)} b={new THREE.Vector3(k * (L / 2 + 0.01), YC + Math.sqrt(R * R - z * z) - 0.06, z * 0.9)} t={0.035} c="#9a3426" />))}
      {[-1, 1].map((k) => <mesh key={k} position={[k * RL / 2, YC, 0]} rotation={[0, 0, -Math.PI / 2]}><cylinderGeometry args={[R + 0.01, R + 0.01, 0.06, 28, 1, true, (3 * Math.PI) / 2 - TH, 2 * TH]} /><meshLambertMaterial color={WTRIM} side={THREE.DoubleSide} /></mesh>)}
      {[-1, 1].map((k) => Array.from({length: 26}, (_, i) => <mesh key={k + '-' + i} position={[-RL / 2 + 0.07 + i * 0.14, WT - 0.005, k * (HALF + 0.005)]} rotation={[0, 0, Math.PI]}><circleGeometry args={[0.07, 8, 0, Math.PI]} /><meshLambertMaterial color={i % 2 ? WTRIM : '#c99a3a'} side={THREE.DoubleSide} /></mesh>))}
      {[-1.53, 1.53].flatMap((x) => [-1, 1].map((k) => <Stick key={x + '' + k} a={new THREE.Vector3(x, WT - 0.25, k * (D / 2 + 0.06))} b={new THREE.Vector3(x + Math.sign(x) * 0.12, WT - 0.02, k * (HALF - 0.02))} t={0.05} c={WTRIM} />))}
      <group position={[-1.0, YC + R - 0.05, -0.35]}><mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.06, 0.06, 0.5, 8]} /><meshLambertMaterial color="#2a2624" /></mesh><mesh position={[0, 0.53, 0]}><cylinderGeometry args={[0.12, 0.08, 0.08, 8]} /><meshLambertMaterial color="#2a2624" /></mesh></group>
      {/* the window on the +z side: frame, cross bars, sill, a little hood, two shutters folded back flat on the wall */}
      <mesh position={[winX, winY, D / 2 + 0.035]}><planeGeometry args={[0.86, 0.68]} /><meshBasicMaterial color={lit ? '#ffe2a0' : '#3a3a46'} /></mesh>
      {lit ? <Halo pos={[winX, winY, D / 2 + 0.2]} r={0.9} strength={0.25} /> : null}
      {[[0, 0.37, 0.96, 0.07], [0, -0.37, 0.96, 0.07], [-0.45, 0, 0.07, 0.8], [0.45, 0, 0.07, 0.8], [0, 0, 0.035, 0.7], [0, 0, 0.9, 0.035]].map(([x, y, w, h], i) => <B key={i} p={[winX + x, winY + y, D / 2 + 0.06]} s={[w, h, 0.04]} c={i < 4 ? WTRIM : '#5a3a26'} cast={false} />)}
      <B p={[winX, winY - 0.45, D / 2 + 0.09]} s={[1.06, 0.06, 0.14]} c={WTRIM} /><B p={[winX, winY + 0.47, D / 2 + 0.09]} s={[1.08, 0.08, 0.16]} c={WGREEN} />
      {[-1, 1].map((k) => <mesh key={k} position={[winX + k * 0.7, winY, D / 2 + 0.075]} castShadow><boxGeometry args={[0.42, 0.7, 0.03]} />{mat(shutterTex())}</mesh>)}
      {/* the door at the +x end, with a small window, painted diamond, handle; steps down between the shafts */}
      <group position={[L / 2 + 0.04, 0, 0]}>
        <mesh position={[0, F0 + 0.7, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><boxGeometry args={[0.72, 1.36, 0.04]} />{mat(shutterTex())}</mesh>
        <mesh position={[0.025, F0 + 1.1, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.38, 0.32]} /><meshBasicMaterial color={lit ? '#ffd890' : '#3a3a46'} /></mesh>
        {[[0, 1.42, 0.86, 0.07], [0, -0.03, 0.86, 0.07], [-0.4, 0.7, 0.07, 1.5], [0.4, 0.7, 0.07, 1.5]].map(([z, y, w, h], i) => <B key={i} p={[0.03, F0 + y, z]} s={[0.05, h, w]} c={WTRIM} cast={false} />)}
        <B p={[0.06, F0 + 0.62, -0.25]} s={[0.04, 0.04, 0.08]} c="#c9a24a" cast={false} />
        {[0, 1, 2].map((i) => <Board key={i} p={[0.25 + i * 0.22, F0 - 0.2 - i * 0.2, 0]} s={[0.24, 0.05, 0.6]} base="#7a5a3a" seed={80 + i} />)}
        {[-1, 1].map((k) => <Stick key={k} a={new THREE.Vector3(0.12, F0 - 0.05, k * 0.31)} b={new THREE.Vector3(0.78, 0.08, k * 0.31)} t={0.05} c="#5a3a26" />)}
      </group>
      {/* a small window on the back end */}
      <mesh position={[-L / 2 - 0.035, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.5, 0.42]} /><meshBasicMaterial color={lit ? '#ffe2a0' : '#3a3a46'} /></mesh>
      {[[0, 0.24, 0.62, 0.06], [0, -0.24, 0.62, 0.06], [-0.28, 0, 0.06, 0.52], [0.28, 0, 0.06, 0.52]].map(([z, y, w, h], i) => <B key={i} p={[-L / 2 - 0.05, 1.7 + y, z]} s={[0.04, h, w]} c={WTRIM} cast={false} />)}
      {/* the lamp on a bracket at the front corner, a bucket hung under the back */}
      <group position={[L / 2 + 0.1, WT - 0.1, D / 2 + 0.1]}>
        <B p={[0.12, 0, 0]} s={[0.3, 0.04, 0.04]} c="#2a2420" /><Stick a={new THREE.Vector3(0.25, 0, 0)} b={new THREE.Vector3(0.25, -0.16, 0)} t={0.01} c="#2a2420" />
        <group position={[0.25, -0.34, 0]}><B p={[0, 0.15, 0]} s={[0.15, 0.03, 0.15]} c="#2f2a24" /><B p={[0, -0.11, 0]} s={[0.17, 0.035, 0.17]} c="#2f2a24" />
          <mesh><boxGeometry args={[0.11, 0.2, 0.11]} /><meshBasicMaterial color={lit ? '#f6c977' : '#6a6458'} /></mesh>
          {lit ? <>{bui ? <NguonBui kieu="nen" mau="#ffb860" /> : null}<Halo pos={[0, 0, 0.15]} r={0.5} strength={0.3} /><pointLight position={[0.2, 0, 0.3]} color="#ffb860" intensity={1.4} distance={4} decay={2} /></> : null}</group>
      </group>
      <group position={[-1.75, 0.75, 0.35]}><Stick a={new THREE.Vector3(0, 0.05, 0)} b={new THREE.Vector3(0, -0.1, 0)} t={0.01} c="#2a2420" /><Bucket pos={[0, -0.46, 0]} s={0.9} seed={14} /></group>
      {/* on the roof */}
      {load === 'light' ? <>
        <mesh position={[0.35, WT + RISE + 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.15, 0.15, 1.3, 10]} />{mat(clothTex('blanket', '#6a5a3a', '#c9b080', 23))}</mesh>
        <Basket pos={[-0.55, WT + RISE - 0.02, 0.1]} s={0.8} seed={9} />
        <mesh position={[0.9, WT + RISE + 0.02, -0.1]} rotation={[-Math.PI / 2 + 0.15, 0, 0]}><torusGeometry args={[0.34, 0.035, 5, 20]} /><meshLambertMaterial color="#7a2a1c" /></mesh>
        {[0.05, 0.75].map((x) => <B key={x} p={[x, WT + RISE + 0.08, 0]} s={[0.03, 0.03, 1.4]} c="#b8a47a" cast={false} />)}
      </> : <>
        <PlankCrate pos={[-0.95, WT + RISE - 0.06, 0.05]} size={[0.8, 0.6, 0.66]} rotY={0.1} seed={8} /><PlankCrate pos={[-0.9, WT + RISE + 0.54, 0.0]} size={[0.56, 0.42, 0.5]} rotY={-0.2} seed={9} base="#9a7650" />
        <group position={[0.05, WT + RISE - 0.06, -0.25]}><FacetLathe profile={[[0.22, 0], [0.34, 0.12], [0.35, 0.38], [0.24, 0.6], [0.13, 0.66], [0.16, 0.74], [0.02, 0.76]]} sides={9} wobble={0.12} seed={3} color="#bba475" contact={false} /></group>
        <group position={[0.35, WT + RISE - 0.06, 0.35]} rotation={[0, 0, 0.35]}><FacetLathe profile={[[0.2, 0], [0.3, 0.1], [0.31, 0.32], [0.2, 0.5], [0.1, 0.56], [0.02, 0.58]]} sides={9} wobble={0.14} seed={4} color="#a89466" contact={false} /></group>
        <mesh position={[0.95, WT + RISE + 0.1, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.17, 0.17, 1.2, 10]} />{mat(clothTex('blanket', '#8a3a2c', '#d8c290', 21))}</mesh>
        <mesh position={[0.95, WT + RISE + 0.08, -0.32]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.15, 0.15, 1.1, 10]} />{mat(clothTex('blanket', '#3f5a6e', '#c99a4a', 22))}</mesh>
        <B p={[0.35, WT + RISE + 0.2, 0]} s={[0.9, 0.36, 0.55]} c="#5a3a26" /><B p={[0.35, WT + RISE + 0.39, 0]} s={[0.94, 0.04, 0.59]} c="#3a2618" /><B p={[0.35, WT + RISE + 0.25, 0.28]} s={[0.12, 0.12, 0.02]} c="#b89a4a" cast={false} />
        {[-0.45, 0.7].map((x) => <React.Fragment key={x}><Stick a={new THREE.Vector3(x, WT + 0.02, -HALF + 0.02)} b={new THREE.Vector3(x, WT + RISE + 0.66, -0.12)} t={0.025} c="#b8a47a" /><Stick a={new THREE.Vector3(x, WT + RISE + 0.66, -0.12)} b={new THREE.Vector3(x, WT + RISE + 0.66, 0.12)} t={0.025} c="#b8a47a" /><Stick a={new THREE.Vector3(x, WT + RISE + 0.66, 0.12)} b={new THREE.Vector3(x, WT + 0.02, HALF - 0.02)} t={0.025} c="#b8a47a" /></React.Fragment>)}
      </>}
      <ContactShade r={2.2} />
    </group>
  );
};
/** The caravan packed for the road (NomadWagon with load 'full', window and lamp out); roll as NomadWagon. */
export const LoadedWagon: React.FC<{pos: V3; rotY?: number; roll?: number; lit?: boolean}> = ({pos, rotY = 0, roll = 0, lit = false}) => <NomadWagon pos={pos} rotY={rotY} roll={roll} lit={lit} load="full" />;
/** A camp fire put out: the ring of stones, charred logs, a bed of embers still glowing in spots, smoke rising (f = frame). */
export const DousedFire: React.FC<{pos: V3; f?: number; glow?: number}> = ({pos, f = 0, glow = 1}) => {
  const st = useMemo(() => { const r = rnd(9); return Array.from({length: 7}, (_, i) => { const a = (i / 7) * Math.PI * 2 + 0.3; return [Math.cos(a) * 0.74, Math.sin(a) * 0.5, r() * 0.8, 0.2 + r() * 0.12] as const; }); }, []);
  const embers = useMemo(() => { const r = rnd(5); return Array.from({length: 26}, () => [(r() - 0.5) * 0.8, 0.05 + r() * 0.06, (r() - 0.5) * 0.5] as V3); }, []);
  const k = 0.85 + 0.15 * Math.sin(f * 0.21) + 0.08 * Math.sin(f * 0.47);
  return (
    <group position={pos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><circleGeometry args={[0.7, 20]} /><meshLambertMaterial color="#3a3638" /></mesh>
      {st.map(([x, z, ry, h], i) => <B key={i} p={[x, h / 2, z]} s={[0.3, h, 0.24]} c={i % 2 ? '#6d707c' : '#5e626e'} r={[0, ry, 0]} />)}
      {[0.5, -0.6, 1.4].map((r, i) => <B key={i} p={[0, 0.08 + i * 0.03, 0.04]} s={[0.9, 0.12, 0.14]} c={i === 1 ? '#2a201a' : '#1e1a18'} r={[0, r, 0.06]} />)}
      {glow > 0 ? <><EmberBed pts={embers} heat={glow * k} size={0.03} /><pointLight position={[0, 0.3, 0.5]} color="#ff6a30" intensity={2.2 * glow * k} distance={3.5} decay={2} /></> : null}
      <TentSmoke pos={[0, 0.2, 0]} f={f} n={11} wind={0.7} />
    </group>
  );
};
/** A lantern on a post (as `Lantern` of lib3/kit) that can be out: lit = false leaves the glass dull and no light. */
/** bui (mặc định true): đèn tự đăng ký nguồn bụi (lib3/buiNguon) tại thân đèn ('nen': đèn dầu). */
export const PostLantern: React.FC<{pos: V3; h?: number; lit?: boolean; bui?: boolean}> = ({pos, h = 2.3, lit = false, bui = true}) => (
  <group position={pos}>{lit && bui ? <NguonBui kieu="nen" pos={[0.4, h - 0.38, 0]} mau="#ffc070" /> : null}
    <B p={[0, h / 2, 0]} s={[0.07, h, 0.07]} c="#2a2420" /><B p={[0.2, h, 0]} s={[0.46, 0.06, 0.06]} c="#2a2420" /><B p={[0.4, h - 0.12, 0]} s={[0.03, 0.2, 0.03]} c="#2a2420" />
    <B p={[0.4, h - 0.2, 0]} s={[0.24, 0.05, 0.24]} c="#3a3026" cast={false} /><B p={[0.4, h - 0.56, 0]} s={[0.22, 0.05, 0.22]} c="#3a3026" cast={false} />
    {lit ? <><mesh position={[0.4, h - 0.38, 0]}><boxGeometry args={[0.17, 0.3, 0.17]} /><meshBasicMaterial color="#ffe0a0" /></mesh><Halo pos={[0.4, h - 0.38, 0.2]} r={0.85} strength={0.5} /><pointLight position={[0.4, h - 0.4, 0.4]} color="#ffc070" intensity={3} distance={5} decay={2} /></>
      : <mesh position={[0.4, h - 0.38, 0]}><boxGeometry args={[0.17, 0.3, 0.17]} /><meshLambertMaterial color="#9a9488" /></mesh>}
  </group>
);
/** A row of small lights travelling along a path far away (torches coming down a hill, lanterns of people leaving): each a
 *  bright core with a halo, flickering; they move `speed` metres a frame along `path` (world points), `gap` metres apart, and
 *  only show while on the path. torch = orange and restless; otherwise a steady yellow lantern. */
export const FarLights: React.FC<{f: number; path: V3[]; n?: number; gap?: number; speed?: number; start?: number; torch?: boolean; size?: number}> = ({f, path, n = 7, gap = 1.6, speed = 0.09, start = 0, torch = true, size = 0.12}) => {
  const P = path.map((p) => new THREE.Vector3(...p)), seg = P.slice(1).map((p, i) => p.distanceTo(P[i])), L = seg.reduce((a, b) => a + b, 0);
  const point = (d: number) => { let k = 0; while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; } return P[k].clone().lerp(P[k + 1], Math.min(1, d / seg[k])); };
  return <>{Array.from({length: n}, (_, i) => {
    const d = start + f * speed - i * gap; if (d < 0 || d > L) return null;
    const p = point(d), fl = torch ? 0.8 + 0.2 * Math.sin(f * 0.9 + i * 2.1) + 0.1 * Math.sin(f * 1.7 + i) : 1, bob = Math.abs(Math.sin(f * 0.25 + i * 1.3)) * size * 0.4;
    return <group key={i} position={[p.x, p.y + bob, p.z]}>
      <mesh renderOrder={5}><circleGeometry args={[size * fl, 8]} /><meshBasicMaterial color={torch ? '#ffd27a' : '#fff0b8'} fog={false} transparent depthWrite={false} /></mesh>
      <Halo pos={[0, 0, 0.02]} r={size * 6 * fl} color={torch ? '#ff8a3a' : '#ffd070'} strength={0.55} order={5} />
    </group>;
  })}</>;
};
/** A point painted on a background plate (screen units 1600 x 900 of the plate's own camera `from`, plate distance d) as a
 *  world point a little in front of the plate: to set real things (walkers, lights) on a painted hill. */
export const onPlate = (from: V3, d: number, u: number, v: number, front = 0.6): V3 => { const H = 2 * Math.tan((28 * Math.PI) / 360) * d; return [from[0] + ((u - 800) / 900) * H, from[1] - ((v - 450) / 900) * H, from[2] - d + front]; };
/** a tiny far-off walker: the mould's big head, a coat, a bundle or a stick; no face */
const walkerTex = (k: number) => tex(`camp-walker-${k}`, 64, 128, (c, W, H) => {
  const coats = ['#6a4a3a', '#4a5a6a', '#7a5a2a', '#5a3a4a', '#4a5a3a', '#6a3a2a'], hair = ['#2a2220', '#8a8580', '#3a2a20', '#c9c0b0'][k % 4], skin = ['#d9a37c', '#c08a64', '#e0b494'][k % 3];
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(W / 2, H - 3, 18, 3, 0, 0, 7); c.fill();
  c.fillStyle = '#2a2420'; c.fillRect(W / 2 - 9, H - 30, 7, 28); c.fillRect(W / 2 + 2, H - 30, 7, 28);
  c.fillStyle = coats[k % coats.length]; c.beginPath(); c.moveTo(W / 2 - 13, H - 26); c.lineTo(W / 2 - 10, H - 70); c.lineTo(W / 2 + 10, H - 70); c.lineTo(W / 2 + 13, H - 26); c.fill();
  c.fillStyle = skin; c.beginPath(); c.arc(W / 2, H - 88, 19, 0, 7); c.fill(); c.fillStyle = hair; c.beginPath(); c.arc(W / 2, H - 92, 19, Math.PI, 0); c.fill();
  if (k % 2) { c.fillStyle = '#b8a070'; c.beginPath(); c.ellipse(W / 2 + 10, H - 62, 12, 14, 0, 0, 7); c.fill(); } else { c.strokeStyle = '#6a5030'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 - 16, H - 66); c.lineTo(W / 2 - 22, H - 2); c.stroke(); }
});
/** a tiny far-off soldier of the Baron: iron helmet, red tunic with a gold spot, dark legs, a spear over the shoulder */
const soldierWalkerTex = (k: number) => tex(`camp-walker-soldier-${k}`, 64, 128, (c, W, H) => {
  const skin = ['#d9a37c', '#c08a64', '#e0b494'][k % 3];
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(W / 2, H - 3, 18, 3, 0, 0, 7); c.fill();
  c.strokeStyle = '#5a4430'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 + 14, H - 30); c.lineTo(W / 2 + 22, 4); c.stroke(); c.fillStyle = '#b8bcc4'; c.beginPath(); c.moveTo(W / 2 + 22, 0); c.lineTo(W / 2 + 26, 10); c.lineTo(W / 2 + 19, 9); c.fill();
  c.fillStyle = '#2a2224'; c.fillRect(W / 2 - 9, H - 30, 7, 28); c.fillRect(W / 2 + 2, H - 30, 7, 28);
  c.fillStyle = '#9a2a26'; c.beginPath(); c.moveTo(W / 2 - 14, H - 26); c.lineTo(W / 2 - 11, H - 70); c.lineTo(W / 2 + 11, H - 70); c.lineTo(W / 2 + 14, H - 26); c.fill(); c.fillStyle = '#e2b843'; c.fillRect(W / 2 - 4, H - 56, 8, 8);
  c.fillStyle = skin; c.beginPath(); c.arc(W / 2, H - 87, 18, 0, 7); c.fill(); c.fillStyle = '#8a9096'; c.beginPath(); c.arc(W / 2, H - 91, 20, Math.PI, 0); c.fill(); c.fillRect(W / 2 - 22, H - 92, 44, 5); c.fillRect(W / 2 - 2, H - 92, 4, 14);
});
/** People walking in along a path painted on a far hill (positions are world points on the path, e.g. from onPlate): each a
 *  small flat figure, bobbing as it walks, moving `speed` metres a frame towards the END of the path. */
export const HillWalkers: React.FC<{f: number; path: V3[]; n?: number; gap?: number; speed?: number; h?: number; kind?: 'people' | 'soldiers'}> = ({f, path, n = 5, gap = 2.6, speed = 0.035, h = 1.7, kind = 'people'}) => {
  const P = path.map((p) => new THREE.Vector3(...p)), seg = P.slice(1).map((p, i) => p.distanceTo(P[i])), L = seg.reduce((a, b) => a + b, 0);
  const point = (d: number) => { let k = 0; while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; } return P[k].clone().lerp(P[k + 1], Math.min(1, d / seg[k])); };
  return <>{Array.from({length: n}, (_, i) => {
    const d = L * 0.12 + i * gap + f * speed; if (d > L) return null;
    const p = point(d), bob = Math.abs(Math.sin(f * 0.45 + i * 1.7)) * h * 0.03, left = P[P.length - 1].x < P[0].x;
    return <mesh key={i} position={[p.x, p.y + h / 2 + bob, p.z]} scale={[left ? -1 : 1, 1, 1]} renderOrder={1}><planeGeometry args={[h * 0.5, h]} /><meshBasicMaterial map={kind === 'soldiers' ? soldierWalkerTex(i) : walkerTex(i)} transparent alphaTest={0.1} depthWrite={false} /></mesh>;
  })}</>;
};

// ---------------------------------------------------------------- d1c3, d1c4: the ritual place at the left edge of the camp, Cynthia's grave
/** CYNTHIA'S YELLOW HEADSCARF as a thing: yellow cloth with rust-red borders, small dark paisley drops, a fringe; faded 0-1
 *  greys it, frays the edges and tears a corner (years on a grave). */
const scarfTex = (faded: number) => { const q = Math.round(faded * 10) / 10; return tex(`camp-scarf-v2-${q}`, 256, 512, (c, W, H) => {
  // faded keeps it THE SAME scarf, old (d1c3 shot 17, 23/11/2026: the first faded version read as fur or bark): the yellow goes
  // pale straw, not grey; the drops and the red border stay, only softer; edges fray and a corner tears
  const r = rnd(77), base = mixHex('#d9a531', '#d6c48c', q), bord = mixHex('#8c3b2c', '#b88470', q), dot = mixHex('#7a4a1e', '#b0946a', q), hi = mixHex('#f0c860', '#e8dcb0', q);
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  for (let y = 44; y < H - 60; y += 78) for (let x = 46 + ((y / 78) % 2) * 50; x < W - 30; x += 100) { c.fillStyle = dot; c.beginPath(); c.ellipse(x, y, 11, 18, 0.5, 0, 7); c.fill(); c.fillStyle = hi; c.beginPath(); c.ellipse(x - 2, y + 2, 4, 8, 0.5, 0, 7); c.fill(); c.fillStyle = dot; c.beginPath(); c.arc(x + 12, y - 20, 5, 0, 7); c.fill(); }
  c.fillStyle = bord; c.fillRect(0, 0, 18, H); c.fillRect(W - 18, 0, 18, H); c.fillRect(0, H - 52, W, 12); c.fillStyle = hi; c.fillRect(20, 0, 3, H); c.fillRect(W - 23, 0, 3, H);
  for (let k = 0; k < 4; k++) { const x = 40 + r() * (W - 80), g = c.createLinearGradient(x - 24, 0, x + 24, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(70,50,20,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 24, 0, 48, H); }
  for (let k = 0; k < 4 + q * 6; k++) blob(c, r() * W, r() * H, 26 + r() * 40, `rgba(120,96,60,${0.05 + q * 0.07})`);
  c.strokeStyle = bord; c.lineWidth = 3; for (let x = 6; x < W; x += 14) { c.beginPath(); c.moveTo(x, H - 40); c.lineTo(x + (r() - 0.5) * 5, H - 4 - r() * (4 + q * 8)); c.stroke(); }
  c.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 8 * q; k++) { const y = r() * H, side = r() < 0.5 ? 0 : W; c.beginPath(); c.arc(side, y, 4 + r() * 8, 0, 7); c.fill(); }
  if (q > 0.5) { c.beginPath(); c.moveTo(W, H * 0.8); c.lineTo(W * 0.62, H); c.lineTo(W, H); c.fill(); for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(40 + r() * (W - 80), 60 + r() * (H - 160), 3 + r() * 4, 0, 7); c.fill(); } }
  c.globalCompositeOperation = 'source-over';
}); };
/** a strip of cloth along a path of points (width w, across the direction `across`); the part after `free` (0-1 of the
 *  length) flutters in the wind with frame f, more towards the end */
const Ribbon: React.FC<{path: V3[]; w: number; across?: V3; f?: number; free?: number; wind?: V3; map: THREE.Texture; amp?: number}> = ({path, w, across = [1, 0, 0], f = 0, free = 0.5, wind = [-1, 0, 0], map, amp = 1}) => {
  const geo = useMemo(() => {
    const n = 24, P = path.map((p) => new THREE.Vector3(...p)), seg = P.slice(1).map((p, i) => p.distanceTo(P[i])), L = seg.reduce((a, b) => a + b, 0);
    const at = (d: number) => { let k = 0; while (k < seg.length - 1 && d > seg[k]) { d -= seg[k]; k++; } return P[k].clone().lerp(P[k + 1], Math.min(1, d / seg[k])); };
    const A = new THREE.Vector3(...across).normalize(), Wd = new THREE.Vector3(...wind), pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, c = at(t * L), k = Math.max(0, (t - free) / (1 - free));
      if (k > 0) { c.addScaledVector(Wd, 0.05 * amp * k * Math.sin(f * 0.16 - i * 0.7)); c.y += 0.04 * amp * k * Math.sin(f * 0.21 - i * 0.9); }
      const tw = 0.25 * k * Math.sin(f * 0.13 - i * 0.6) / amp, a = A.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), tw), half = (w / 2) * (1 - 0.25 * t);
      [-1, 1].forEach((sd) => { const p = c.clone().addScaledVector(a, sd * half); pos.push(p.x, p.y, p.z); uv.push(sd < 0 ? 0 : 1, 1 - t); });
      if (i < n) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }, [JSON.stringify(path), w, f, free, amp]);
  return <mesh geometry={geo} castShadow receiveShadow>{mat(map, {side: THREE.DoubleSide, transparent: true, alphaTest: 0.4})}</mesh>;
};
/** Cynthia's yellow scarf as a thing in the scene. on = 'post' (knotted round the top of a grave post: a band, a knot, two
 *  tails, one blowing), 'stone' (thrown over the top of a standing stone, one end blowing), 'hook' (hung from a hook, two
 *  ends down). pos = the top of the post or stone or the hook; faded 0-1; f = frame for the flutter; wind = blowing
 *  direction (default to screen left). */
/** blow 0-1 (post): how far the free tail is carried out by the wind (0 = both tails hang along the post) */
export const CynthiaScarf: React.FC<{pos: V3; on?: 'post' | 'stone' | 'hook'; faded?: number; f?: number; wind?: V3; rotY?: number; blow?: number}> = ({pos, on = 'post', faded = 0, f = 0, wind = [-1, 0, 0], rotY = 0, blow = 0.25}) => {
  const b = blow;
  const m = scarfTex(faded), col = mixHex('#d9a531', '#d0bc82', faded);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {on === 'post' ? <>
        {[[0, 0.047], [0.057, 0], [0, -0.047], [-0.057, 0]].map(([x, z], i) => <B key={i} p={[x, -0.09, z]} s={[i % 2 ? 0.012 : 0.115, 0.06, i % 2 ? 0.095 : 0.012]} c={col} cast={false} />)}
        <FacetLathe pos={[0.01, -0.13, 0.07]} profile={[[0.04, 0], [0.055, 0.03], [0.04, 0.06], [0.01, 0.07]]} sides={6} wobble={0.2} seed={3} color={col} contact={false} />
        <Ribbon path={[[0.0, -0.1, 0.08], [-0.02 - 0.1 * b, -0.25 + 0.06 * b, 0.1], [-0.04 - 0.22 * b, -0.4 + 0.12 * b, 0.11], [-0.09 - 0.32 * b, -0.52 + 0.16 * b, 0.11]]} w={0.13} f={f} free={0.4 - 0.15 * b} wind={wind} map={m} amp={1 + 0.35 * b} />
        <Ribbon path={[[0.03, -0.1, 0.075], [0.05 - 0.03 * b, -0.26, 0.09], [0.06 - 0.08 * b, -0.4 + 0.04 * b, 0.09]]} w={0.11} f={f + 30} free={0.5} wind={wind} map={m} amp={1 + 0.5 * b} />
      </> : on === 'stone' ? <>
        <Ribbon path={[[0.02, 0.0, -0.12], [0.0, 0.025, -0.02], [-0.01, 0.02, 0.12], [-0.02, -0.12, 0.16], [-0.03, -0.3, 0.18], [-0.06, -0.42, 0.2], [-0.16, -0.48, 0.21], [-0.27, -0.5, 0.2]]} w={0.24} f={f} free={0.72} wind={wind} map={m} />
      </> : <>
        <Ribbon path={[[0, 0, 0.03], [-0.04, -0.3, 0.05], [-0.06, -0.62, 0.05]]} w={0.18} f={f} free={0.6} wind={wind} map={m} />
        <Ribbon path={[[0.02, 0, 0.02], [0.07, -0.25, 0.04], [0.1, -0.5, 0.04]]} w={0.15} f={f + 20} free={0.6} wind={wind} map={m} />
      </>}
    </group>
  );
};
/** a standing stone's surface: grey with speckles, cracks and lichen; charcoal signs drawn on the face towards the lens;
 *  scorch = blackened on one side (after the fire), moss = green creeping up from the foot (years on) */
const stoneTex = (seed: number, scorch: boolean, moss: boolean) => tex(`camp-rstone-${seed}-${scorch ? 1 : 0}-${moss ? 1 : 0}`, 512, 256, (c, W, H) => {
  const r = rnd(seed); c.fillStyle = '#80828c'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 400; k++) { c.fillStyle = r() < 0.5 ? 'rgba(40,40,50,0.25)' : 'rgba(220,220,225,0.2)'; c.fillRect(r() * W, r() * H, 2 + r() * 4, 2 + r() * 3); }
  for (let k = 0; k < 6; k++) blob(c, r() * W, r() * H, 30 + r() * 50, k % 2 ? 'rgba(150,160,110,0.25)' : 'rgba(40,40,50,0.2)');
  c.strokeStyle = 'rgba(30,30,36,0.6)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { let x = r() * W, y = r() * H * 0.4; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 30; y += 20 + r() * 20; c.lineTo(x, y); } c.stroke(); }
  if (!moss) runes(c, W, H, seed, '#1a1614', 7);
  if (scorch) { const g = c.createLinearGradient(W * 0.1, 0, W * 0.55, 0); g.addColorStop(0, 'rgba(15,12,10,0)'); g.addColorStop(0.5, 'rgba(15,12,10,0.6)'); g.addColorStop(1, 'rgba(15,12,10,0.15)'); c.fillStyle = g; c.fillRect(0, 0, W, H); const g2 = c.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, 'rgba(10,8,8,0.35)'); g2.addColorStop(1, 'rgba(10,8,8,0)'); c.fillStyle = g2; c.fillRect(0, 0, W, H); }
  if (moss) { for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(90,120,60,${0.3 + r() * 0.4})`; c.beginPath(); c.arc(r() * W, H - Math.pow(r(), 2) * H * 0.5, 4 + r() * 10, 0, 7); c.fill(); } }
});
/** charcoal signs on the face of a stone (u 0.36-0.64 of the texture faces the lens): a circle with a cross, zig-zags, horns */
const runes = (c: Ctx, W: number, H: number, seed: number, col: string, lw: number) => {
  const r = rnd(seed + 5), x0 = W * 0.42, x1 = W * 0.58, cx = W / 2; c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round';
  const kind = seed % 4; c.beginPath();
  if (kind === 0) { c.arc(cx, H * 0.4, 26, 0, 7); c.moveTo(cx, H * 0.4 - 36); c.lineTo(cx, H * 0.4 + 36); c.moveTo(cx - 36, H * 0.4); c.lineTo(cx + 36, H * 0.4); }
  else if (kind === 1) { for (let i = 0; i < 5; i++) { const y = H * (0.2 + i * 0.12); c.moveTo(x0, y); c.lineTo(cx, y + 14); c.lineTo(x1, y); } }
  else if (kind === 2) { c.moveTo(cx - 30, H * 0.25); c.quadraticCurveTo(cx - 8, H * 0.45, cx, H * 0.7); c.quadraticCurveTo(cx + 8, H * 0.45, cx + 30, H * 0.25); c.moveTo(cx - 22, H * 0.75); c.lineTo(cx + 22, H * 0.75); }
  else { c.moveTo(cx, H * 0.18); c.lineTo(cx, H * 0.78); c.moveTo(cx, H * 0.35); c.lineTo(cx - 28, H * 0.22); c.moveTo(cx, H * 0.35); c.lineTo(cx + 28, H * 0.22); c.moveTo(cx - 20, H * 0.6); c.lineTo(cx + 20, H * 0.6); }
  c.stroke(); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x0 + r() * (x1 - x0), H * (0.82 + r() * 0.08), 5, 0, 7); c.fillStyle = col; c.fill(); }
};
const runeGlowTex = (seed: number) => tex(`camp-rglow-${seed}`, 512, 256, (c, W, H) => { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.shadowColor = '#ff6a2a'; c.shadowBlur = 18; runes(c, W, H, seed, '#ffb070', 9); c.shadowBlur = 0; runes(c, W, H, seed, '#fff0c0', 3); });
/** A candle on a stone: cream wax with drips; lit = a small flame with a halo and a little light; boost > 1 = flaring
 *  taller and leaning (towards `lean`, radians about z); melted = a short stub with a wax pool, no flame. */
const Candle: React.FC<{pos: V3; f: number; lit: boolean; boost?: number; lean?: number; melted?: boolean}> = ({pos, f, lit, boost = 1, lean = 0, melted}) => {
  const h = melted ? 0.035 : 0.13;
  return (
    <group position={pos}>
      <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[0.022, 0.025, h, 8]} /><meshLambertMaterial color="#e8dcc0" /></mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[melted ? 0.07 : 0.04, 10]} /><meshLambertMaterial color="#d8ccb0" /></mesh>
      {[0.6, 2.4, 4.4].map((a) => <B key={a} p={[Math.cos(a) * 0.024, h * 0.7, Math.sin(a) * 0.024]} s={[0.008, h * 0.45, 0.008]} c="#efe4cc" cast={false} />)}
      {lit ? <group position={[0, h, 0]} rotation={[0, 0, lean * (boost - 1)]} scale={[1, boost, 1]}>
        <group scale={0.18}><Flame f={f * 1.3} w={0.5} /></group>
        <Halo pos={[0, 0.06, 0.02]} r={0.18 * boost} color="#ffb860" strength={0.45} />
        <pointLight position={[0, 0.1, 0.15]} color="#ffb060" intensity={0.5 * boost} distance={2.2} decay={2} />
      </group> : null}
    </group>
  );
};
/** the stones of the ring: angle from +z (towards the lens), height, seed; the tallest stands at the front right */
const RING_STONES: [number, number, number][] = [[0.73, 0.7, 1], [-0.25, 0.45, 2], [-1.15, 0.6, 3], [-2.05, 0.5, 4], [2.95, 0.65, 5], [2.05, 0.4, 6], [1.45, 0.55, 7]];
const ringPos = (a: number, r = 1.2): V3 => [Math.sin(a) * r, 0, Math.cos(a) * r];
/** a crack in the ground: a branching line of segments from near the centre outwards */
const crackLines = (seed: number) => { const r = rnd(seed), out: [THREE.Vector3, THREE.Vector3][] = []; for (let b = 0; b < 11; b++) { let a = (b / 11) * Math.PI * 2 + r() * 0.4, p = new THREE.Vector3(Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3); for (let k = 0; k < 6; k++) { a += (r() - 0.5) * 0.7; const q = p.clone().add(new THREE.Vector3(Math.sin(a) * (0.22 + r() * 0.15), 0, Math.cos(a) * (0.22 + r() * 0.15))); out.push([p, q]); if (r() < 0.25) { const a2 = a + (r() < 0.5 ? 0.9 : -0.9); out.push([q, q.clone().add(new THREE.Vector3(Math.sin(a2) * 0.2, 0, Math.cos(a2) * 0.2))]); } p = q; } } return out; };
/** THE RITUAL PLACE at the camp's edge (d1c3): a ring of seven standing stones (radius 1.2) with charcoal signs on the face
 *  to the lens, candles on three of them, blackened earth in the middle. state:
 *  'phep' (the night of the summoning): candles burning (boost = flare, lean towards the centre), cracks in the ground round
 *  the ring and the signs on the stones glowing red by glow 0-1 (driven by the shot);
 *  'phep-chay' (the morning after): stones scorched on one side, candles melted to stubs, a patch of ash and cold coals with a
 *  thin smoke, a ring of burnt grass, Cynthia's scarf thrown over the tallest stone;
 *  'mo' (her grave, years on): a low mound of piled stones with earth, a wooden post 1.0 m with the scarf knotted at its top,
 *  the old stones mossy; faded 0-1 greys the scarf and grows weeds, a thorn bush and a creeper round the post; snow 0-1 lies
 *  on the post, the mound and the stones. f = frame (candles, smoke, the scarf's flutter). */
export const RitualSite: React.FC<{pos: V3; state: 'phep' | 'phep-chay' | 'mo'; f?: number; glow?: number; boost?: number; faded?: number; snow?: number; postDx?: number; scarfWind?: number}> = ({pos, state, f = 0, glow = 0, boost = 1, faded = 0, snow = 0, postDx = 0, scarfWind}) => {
  const phep = state === 'phep', chay = state === 'phep-chay', mo = state === 'mo';
  const cracks = useMemo(() => crackLines(7), []);
  const mound = useMemo(() => { const r = rnd(12), out: [V3, number, number][] = []; for (let i = 0; i < 22; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.62, h = 0.36 * (1 - (d / 0.75) ** 2); out.push([[Math.sin(a) * d, Math.max(0, h - 0.07), Math.cos(a) * d * 0.85], 0.08 + r() * 0.06, i]); } return out; }, []);
  const SNOW = '#eef1f6';
  return (
    <group position={pos}>
      {/* the middle: blackened earth (night), ash and cold coals (morning after), the grave mound (years on) */}
      {!mo ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow><circleGeometry args={[chay ? 0.85 : 0.75, 20]} /><meshLambertMaterial color={chay ? '#7a7672' : '#2e2826'} /></mesh> : null}
      {chay ? <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}><ringGeometry args={[1.0, 2.3, 32]} /><meshLambertMaterial color="#5e5040" transparent opacity={0.8} /></mesh>
        {[0.4, -0.7, 1.6, 2.6].map((a, i) => <B key={i} p={[Math.sin(a) * 0.25, 0.04, Math.cos(a) * 0.2]} s={[0.45, 0.07, 0.08]} c="#1c1816" r={[0, a, 0.05]} />)}
        <TentSmoke pos={[0, 0.05, 0]} f={f} n={6} wind={0.25} />
      </> : null}
      {phep ? <>
        {cracks.map(([a, b], i) => { const m = a.clone().add(b).multiplyScalar(0.5), d = b.clone().sub(a); return <group key={i} position={[m.x, 0.016, m.z]} rotation={[0, Math.atan2(d.x, d.z), 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.035, d.length()]} /><meshBasicMaterial color="#120c0a" /></mesh>
          {glow > 0 ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} renderOrder={4}><planeGeometry args={[0.05, d.length()]} /><meshBasicMaterial color="#ff7a30" transparent opacity={Math.min(1, glow * 1.2)} depthWrite={false} /></mesh> : null}
        </group>; })}
        {glow > 0 ? <><Halo pos={[0, 0.1, 0]} r={2.6 * glow} color="#ff5a24" strength={0.35 * glow} order={2} /><pointLight position={[0, 0.4, 0.3]} color="#ff5a2a" intensity={4 * glow} distance={5} decay={2} /></> : null}
      </> : null}
      {mo ? <>
        <FacetLathe profile={[[0.82, 0], [0.7, 0.14], [0.42, 0.28], [0.02, 0.34]]} sides={11} wobble={0.12} seed={5} color={faded > 0.5 ? '#5a5040' : '#6a5a46'} squash={0.85} />
        {mound.map(([p, q, i]) => <FacetLathe key={i} pos={p} profile={[[q, 0], [q * 1.1, q * 0.45], [q * 0.6, q * 0.9], [0.01, q]]} sides={6} wobble={0.3} seed={40 + i} color={i % 3 ? '#7c7e88' : '#6a6c78'} contact={false} />)}
        {snow > 0 ? <FacetLathe profile={[[0.6, 0.18], [0.42, 0.3], [0.02, 0.39]]} sides={11} wobble={0.2} seed={6} color={SNOW} squash={0.85} contact={false} /> : null}
        <group position={[postDx, 0, 0]}>
          <Board p={[0, 0.5, 0]} s={[0.1, 1.0, 0.08]} base="#6a5038" seed={90} />
          <B p={[0, 1.005, 0]} s={[0.07, 0.03, 0.06]} c="#5a4430" />
          {snow > 0 ? <FacetLathe pos={[0, 1.02, 0]} profile={[[0.062, 0], [0.055, 0.025 * snow + 0.008], [0.03, 0.04 * snow + 0.012], [0.005, 0.045 * snow + 0.014]]} sides={7} wobble={0.15} seed={2} color={SNOW} squash={0.8} contact={false} cast={false} /> : null}
          <CynthiaScarf pos={[0, 0.98, 0]} on="post" faded={faded} f={f} blow={scarfWind ?? (faded > 0.5 ? 0.9 : 0.25)} />
          {faded > 0.5 ? Array.from({length: 7}, (_, i) => <Stick key={i} a={new THREE.Vector3(Math.sin(i * 1.6) * 0.06, 0.1 + i * 0.09, Math.cos(i * 1.6) * 0.05)} b={new THREE.Vector3(Math.sin(i * 1.6 + 1.6) * 0.06, 0.19 + i * 0.09, Math.cos(i * 1.6 + 1.6) * 0.05)} t={0.012} c="#4a5a30" />) : null}
        </group>
        {faded > 0.5 ? <>
          {[[-0.7, 0.35, 0.5], [0.75, 0.3, 0.45], [0.2, 0.62, 0.4], [-0.35, -0.5, 0.5]].map(([x, z, w], i) => <Sprite key={i} name="grave-weed" art={(c, W, H) => paintTuft(c, W, H, {light: '#9a9a6a', dark: '#7a7a50'})} px={[160, 110]} w={w} pos={[x, 0, z]} flip={i % 2 === 0} cast={false} shade={0} />)}
          <Sprite name="grave-thorn" art={paintThorn} px={[300, 220]} w={0.75} pos={[0.55, 0, 0.15]} />
        </> : null}
      </> : null}
      {/* the standing stones, signs to the lens; candles on three; the scarf over the tallest the morning after */}
      {RING_STONES.map(([a, h, sd]) => { const p = ringPos(a), m = stoneTex(sd, chay, mo); return (
        <group key={sd} position={p}>
          <mesh position={[0, h / 2, 0]} rotation={[0, Math.PI / 6, 0]} castShadow receiveShadow><cylinderGeometry args={[0.13, 0.2, h, 6, 1, false, Math.PI, Math.PI * 2]} /><meshLambertMaterial map={m} emissiveMap={phep ? runeGlowTex(sd) : null} emissive={new THREE.Color(phep && glow > 0 ? '#ff7a40' : '#000000')} emissiveIntensity={phep ? glow : 0} flatShading key={phep && glow > 0 ? 'g' : 'n'} /></mesh>
          {snow > 0 ? <FacetLathe pos={[0, h - 0.02, 0]} profile={[[0.14, 0], [0.1, 0.03 * snow + 0.01], [0.01, 0.04 * snow + 0.02]]} sides={6} color={SNOW} contact={false} cast={false} /> : null}
          {[1, 3, 5].includes(sd) && !mo ? <Candle pos={[0, h, 0.02]} f={f + sd * 7} lit={phep} boost={boost} lean={-Math.sign(p[0]) * 0.3} melted={chay} /> : null}
          {chay && sd === 1 ? <CynthiaScarf pos={[0, h, 0]} on="stone" f={f} /> : null}
        </group>
      ); })}
    </group>
  );
};
/** a dry thorn bush: dark wiry stems with spines and a few dead leaves */
const paintThorn = (c: Ctx, W: number, H: number) => { const r = rnd(8); c.strokeStyle = '#3a3026'; c.lineCap = 'round';
  for (let k = 0; k < 14; k++) { let x = W / 2 + (r() - 0.5) * 40, y = H; const a0 = -Math.PI / 2 + (r() - 0.5) * 1.8; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); let a = a0; for (let j = 0; j < 6; j++) { a += (r() - 0.5) * 0.6; x += Math.cos(a) * 22; y += Math.sin(a) * 22; c.lineTo(x, y); } c.stroke();
    for (let j = 0; j < 4; j++) { const px = W / 2 + (x - W / 2) * (0.3 + j * 0.18), py = H + (y - H) * (0.3 + j * 0.18); c.lineWidth = 2; c.beginPath(); c.moveTo(px, py); c.lineTo(px + (r() - 0.5) * 16, py - 8 - r() * 6); c.stroke(); }
    if (r() < 0.5) { c.fillStyle = r() < 0.5 ? '#6a5a36' : '#5a4a30'; c.beginPath(); c.ellipse(x, y, 6, 3, a, 0, 7); c.fill(); } } };
/** A rotten log lying on the ground (bark, moss, end grain), for the dark front corner of a forest edge. */
export const RottenLog: React.FC<{pos: V3; rotY?: number; L?: number; r?: number}> = ({pos, rotY = 0, L = 1.8, r = 0.2}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Log p={[0, r * 0.85, 0]} r={r} L={L} seed={11} />
    {[[-0.3, 0.05], [0.25, -0.04], [0.6, 0.03]].map(([x, z], i) => <mesh key={i} position={[x, r * 1.7, z]} rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[0.1 + i * 0.03, 7]} /><meshLambertMaterial color="#4a5a34" /></mesh>)}
    <ContactShade r={L * 0.55} />
  </group>
);

// ---------------------------------------------------------------- the camp fire whose pot a soldier knocks off (d1c3 shot 3)
/** The camp fire of `Fire` (lib3/kit: stones, logs, flame, embers, light) with its tripod and pot as separate pieces, so the
 *  tripod can tip and the pot fly and roll. knock = frames since the blow (< 0 or undefined: standing as `Fire`). The pot
 *  flies 0.6 m to the left in an arc over 8 frames, lands on its side, rolls a little and stops; the tripod tilts over 6
 *  frames to 0.35 rad; a dark wet patch spreads where the pot spilled. */
export const KnockFire: React.FC<{pos: V3; f?: number; knock?: number}> = ({pos, f = 0, knock = -1}) => {
  const st = useMemo(() => { const r = rnd(9); return Array.from({length: 7}, (_, i) => { const a = (i / 7) * Math.PI * 2 + 0.3; return [Math.cos(a) * 0.74, Math.sin(a) * 0.5, r() * 0.8, 0.2 + r() * 0.12] as const; }); }, []);
  const breathe = 1 + 0.05 * Math.sin(f * 0.19) + 0.025 * Math.sin(f * 0.37) + (knock >= 0 && knock < 12 ? 0.25 * (1 - knock / 12) : 0);
  const k = Math.max(0, knock), tip = knock < 0 ? 0 : 0.35 * Math.min(1, k / 6), fly = knock < 0 ? 0 : Math.min(1, k / 8), roll = knock < 8 ? 0 : Math.min(1, (k - 8) / 10);
  const top = new THREE.Vector3(0, 2.15, 0), leg = (a: number, i: number) => { const foot = new THREE.Vector3(Math.cos(a) * 1.0, 0, Math.sin(a) * 0.8), d = foot.clone().sub(top), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return <mesh key={i} position={top.clone().add(foot).multiplyScalar(0.5)} quaternion={q} castShadow><boxGeometry args={[0.06, d.length(), 0.06]} /><meshLambertMaterial color="#2a2420" /></mesh>; };
  // the pot: hanging 1.2 m up; after the blow along an arc to (-0.6 - roll 0.25, ground) turning onto its side
  const px = -0.6 * fly - 0.25 * (1 - (1 - roll) ** 2), py = knock < 0 ? 1.2 : (1 - fly) * 1.2 + Math.sin(Math.PI * fly) * 0.35 + fly * 0.2, rz = knock < 0 ? 0 : fly * (Math.PI / 2) + roll * 1.2;
  return (
    <group position={pos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.3]} scale={breathe}><circleGeometry args={[3.0, 40]} /><meshBasicMaterial color="#f2a35a" transparent opacity={0.2} depthWrite={false} /></mesh>
      {st.map(([x, z, ry, h], i) => <B key={i} p={[x, h / 2, z]} s={[0.3, h, 0.24]} c={i % 2 ? '#7d8190' : '#6c7080'} r={[0, ry, 0]} />)}
      {[0.5, -0.6].map((r, i) => <B key={i} p={[0, 0.1, 0.05]} s={[1.0, 0.14, 0.16]} c="#3b2a20" r={[0, r, 0.08]} />)}
      <group scale={[1, breathe, 1]}><Flame f={f} w={1.25} /></group>
      <group scale={breathe}><Halo pos={[0, 0.85, 0.02]} r={2.0} color="#ffab5c" strength={0.42} order={2} /></group>
      {Array.from({length: 9}, (_, i) => { const life = 70 + (i % 4) * 16, q = f + i * 23, u = (q % life) / life, n = Math.floor(q / life), x = Math.sin(n * 12.9 + i * 4.1) * 0.32 + Math.sin(u * 5 + i) * 0.1 * u, s = (1 - u) * (0.6 + (i % 3) * 0.2); return <mesh key={`e${i}`} position={[x, 0.9 + u * 2.6, 0.12]} scale={s} renderOrder={5}><circleGeometry args={[0.03, 8]} /><meshBasicMaterial color={i % 2 ? '#ffc060' : '#ff9440'} transparent depthWrite={false} /></mesh>; })}
      <group position={[-0.9, 0, 0]} rotation={[0, 0, tip]}><group position={[0.9, 0, 0]}>{leg(0.6, 1)}{leg(2.7, 2)}{leg(4.7, 3)}{knock < 0 ? <B p={[0, 1.78, 0]} s={[0.02, 0.6, 0.02]} c="#1f1c1a" cast={false} /> : <B p={[0, 1.95, 0]} s={[0.02, 0.35, 0.02]} c="#1f1c1a" cast={false} r={[0, 0, 0.3]} />}</group></group>
      <group position={[px, py, 0.1]} rotation={[0, 0, rz]}><FacetLathe profile={[[0.1, 0], [0.24, 0.08], [0.26, 0.26], [0.2, 0.3]]} sides={9} color="#2c2a2e" contact={false} /></group>
      {knock >= 6 ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.7, 0.011, 0.15]} scale={[1, 0.6, 1]}><circleGeometry args={[0.2 + 0.25 * Math.min(1, (k - 6) / 14), 16]} /><meshLambertMaterial color="#2a2420" /></mesh> : null}
      <pointLight position={[0, 0.9, 0.7]} color="#ff9a4a" intensity={16 * breathe} distance={10} decay={2} />
    </group>
  );
};
/** the cloth of Cynthia's headscarf (the same texture CynthiaScarf uses), for other shapes of the same scarf (FoldedScarf of
 *  kitLeuThayLang). faded 0-1. Added 22/11/2026 so the whole episode has ONE scarf. */
export const cynthiaScarfTex = (faded = 0) => scarfTex(faded);

// ---------------------------------------------------------------- the air of the camp (23/11/2026)
// Daniel: "các cảnh ở trại thiếu các bụi bay quá". The reference's camp scenes always have something in the air: dust in the
// sun, fireflies at dusk, sparks round a fire. Each particle is born, drifts with a slow wind and its own wobble, fades in and
// out, and is born again somewhere else; layers by depth: the near layer sparse and faint (never over a face), the middle one
// clearest, the far one small and many.
const airDot = () => tex('camp-air-dot', 64, 64, (c, W) => { const g = c.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });
type AirLayerProps = {f: number; box: [number, number, number, number, number, number]; n: number; color: string | string[]; size: number; life?: number; wind?: [number, number]; wob?: number; opacity?: number; seed?: number; add?: boolean; blink?: boolean; leaf?: boolean};
/** one layer of drifting particles in a box [x0, x1, y0, y1, z0, z1]; size = radius in metres; life in frames; wind in m/s */
export const AirLayer: React.FC<AirLayerProps> = ({f, box, n, color, size, life = 150, wind = [0.06, 0.01], wob = 0.12, opacity = 0.7, seed = 1, add = false, blink = false, leaf = false}) => {
  const cols = Array.isArray(color) ? color : [color];
  return <><DaCoKhi />{/* cảnh đã có lớp hạt riêng: lớp nền của BuiNguon tắt */}{Array.from({length: Math.max(0, Math.round(n))}, (_, i) => {
    const r0 = rnd(seed * 131 + i * 17), L = life * (0.7 + r0() * 0.6), ph = r0() * L, q = f + ph, cyc = Math.floor(q / L), a = q - cyc * L, t = a / L;
    const r = rnd(seed * 977 + i * 29 + cyc * 7), x0 = box[0] + r() * (box[1] - box[0]), y0 = box[2] + r() * (box[3] - box[2]), z0 = box[4] + r() * (box[5] - box[4]), s = size * (0.6 + r() * 0.8), w = r() * 6.28, col = cols[Math.floor(r() * cols.length)];
    const sec = a / 24, x = x0 + wind[0] * sec + Math.sin(a * 0.05 + w) * wob, y = y0 + wind[1] * sec + Math.sin(a * 0.037 + w * 2) * wob * 0.7;
    let op = opacity * Math.sin(Math.PI * t); if (blink) op *= Math.pow(Math.max(0, Math.sin(a * 0.11 + w)), 2);
    if (op < 0.02) return null;
    return <mesh key={i} position={[x, y, z0]} rotation={[0, 0, leaf ? a * 0.08 + w : 0]} scale={leaf ? [s * 2.6, s * 1.1, 1] : [s * 2, s * 2, 1]} renderOrder={6}>
      <planeGeometry /><meshBasicMaterial map={leaf ? null : airDot()} color={col} transparent opacity={op} depthWrite={false} fog={false} blending={add ? THREE.AdditiveBlending : THREE.NormalBlending} side={THREE.DoubleSide} />
    </mesh>;
  })}</>;
};
/** The camp's air for a kind of light: 'day' (pale gold dust in three depths, a few leaves and seed fluff crossing), 'dusk'
 *  (warm dust, fireflies blinking in the darker places), 'night' (fewer, cooler motes, fireflies). k = density. sparks = places
 *  [x, y, z] with sparks rising (a fire, candles). */
export const CampAir: React.FC<{f: number; mode: 'day' | 'dusk' | 'night'; k?: number; sparks?: V3[]}> = ({f, mode, k = 1, sparks = []}) => {
  const day = mode === 'day', dusk = mode === 'dusk', dust = day ? ['#f6cc62', '#ffd780', '#fbe6a8'] : dusk ? ['#ffd9a0', '#ffc888', '#ffe6c0'] : ['#d8dcf0', '#c8d0ea'];
  return <>
    <AirLayer f={f} box={[-18, 15, 0.4, 4.5, -19, -10]} n={(day ? 170 : 120) * k} color={dust} size={0.075} life={170} wind={[0.07, 0.012]} opacity={day ? 0.65 : 0.55} seed={11} />
    <AirLayer f={f} box={[-15, 12, 0.3, 3.4, -10, -3.2]} n={(day ? 170 : 100) * k} color={dust} size={day ? 0.058 : 0.05} life={150} wind={[0.06, 0.015]} opacity={day ? 0.95 : 0.8} seed={12} />
    <AirLayer f={f} box={[-11, 9, 0.6, 2.8, -3.2, 1.8]} n={(day ? 18 : 12) * k} color={dust} size={0.022} life={130} wind={[0.05, 0.01]} opacity={0.4} seed={13} />
    {day ? <AirLayer f={f} box={[-16, 13, 0.6, 3.6, -13, -2.5]} n={26 * k} color={['#c9b45a', '#a9b858', '#e0c070', '#f4f0e0']} size={0.05} life={110} wind={[0.4, -0.04]} wob={0.2} opacity={0.9} seed={14} leaf /> : null}
    {!day ? <AirLayer f={f} box={[-18, 13, 0.4, 2.4, -15, -3.5]} n={(dusk ? 34 : 26) * k} color={['#eef27a', '#d8f07a']} size={0.05} life={160} wind={[0.02, 0.01]} wob={0.35} opacity={1} seed={15} add blink /> : null}
    {sparks.map((p, i) => <AirLayer key={i} f={f} box={[p[0] - 0.35, p[0] + 0.35, p[1], p[1] + 0.3, p[2] - 0.2, p[2] + 0.2]} n={10 * k} color={['#ffb24a', '#ff8a30', '#ffd070']} size={0.03} life={55} wind={[0.05, 0.55]} wob={0.08} opacity={1} seed={20 + i} add />)}
  </>;
};
