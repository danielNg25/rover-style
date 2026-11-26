import React, {useMemo} from 'react';
import * as THREE from 'three';
import {FacetLathe, Halo} from './look';
import {rnd, Ctx, Sprite} from './depth';
import {B, Flame} from './kit';
import {tex} from './kitLab';
import {StoneBox, StoneLook} from './kitForge';
import {Embers} from './fx';

/** lib3/kitSanhNgai: THE THRONE HALL of a castle at night (first used by src/demo/SanhNgai.tsx, passage d1mo, Doctor Doom
 *  as the tyrant; chapter 2 will reuse the same hall in the Baron's colours). Metres, y up; things that hang on a wall lie in
 *  their own x-y plane facing +z. Every piece takes a HALL palette, so a new state of the hall is a palette, not new pieces:
 *  HALL.doom = green and gold; HALL.namTuoc = the Baron's dark red and gold. */
type V3 = [number, number, number];
/** emblem: whose badge the hall carries: 'ring' (default) = Doom's gold ring round a diamond; 'diamond' = the Baron's plain gold diamond */
export type HallLook = {cloth: string; clothDark: string; clothLight: string; gold: string; goldDark: string; glass: string[]; glassGold: string[]; light: string; emblem?: 'ring' | 'diamond'};
export const HALL: Record<'doom' | 'namTuoc', HallLook> = {
  doom: {cloth: '#2f7a40', clothDark: '#1d4c2a', clothLight: '#45944f', gold: '#e2b843', goldDark: '#9a7426', glass: ['#46b45a', '#6ccf66', '#38974c', '#8ae27a', '#2f8a46'], glassGold: ['#f2c840', '#fadc72', '#e4a92e'], light: '#c4e39c'},
  namTuoc: {cloth: '#7a2a26', clothDark: '#521a18', clothLight: '#94382f', gold: '#e2b843', goldDark: '#9a7426', glass: ['#b8382e', '#d4503e', '#962a24', '#e8705a', '#7a2420'], glassGold: ['#f2c840', '#fadc72', '#e4a92e'], light: '#e8b89a', emblem: 'diamond'},
};
/** cold green-grey castle stone, painted LIGHT enough that the hall reads at night (the reference hall at 884 s: mid green
 *  walls; brightness pass 23/11/2026, Y 88-105): cool, only warm round the fires */
export const HALL_STONE: Partial<StoneLook> = {tones: ['#6f8a7e', '#68827a', '#779286', '#627c72', '#7c968a', '#82998e', '#5e766c', '#728c80'], mortar: '#36463f'};
const shade = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

// ---------------------------------------------------------------- the stained glass
/** A lancet window of stained glass, lit from outside, in the reference's manner: BIG rectangular panes in two columns,
 *  yellow and green in turn, each with a diamond of the other colour, heavy black leading; brighter towards the middle; a gold
 *  border; in the arch head a rose of gold and colour; dust at the foot, one cracked pane. Transparent outside the arch.
 *  w = width, h = height from the sill to the arch's top (the arch is a half circle on the top w/2). */
export const paintStainedGlass = (w: number, h: number, look: HallLook, seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / w, R = W / 2, spring = R;   // canvas y runs down: the arch centre is R below the top
  const arch = () => { c.beginPath(); c.moveTo(0, H); c.lineTo(0, spring); c.arc(R, spring, R, Math.PI, 0); c.lineTo(W, H); c.closePath(); };
  c.save(); arch(); c.clip();
  c.fillStyle = '#10120c'; c.fillRect(0, 0, W, H);
  const lead = 0.05 * ppm, bw = 0.07 * ppm, cols = w > 2 ? 3 : 2, pw = (W - 2 * bw - (cols + 1) * lead) / cols, rows = Math.max(3, Math.round((H - spring) / (pw * 1.25))), ph = (H - spring - bw - (rows + 1) * lead) / rows;
  const bright = (x: number, y: number) => 1.08 - 0.45 * Math.hypot((x - R) / W, (y - H * 0.55) / H) + (r() - 0.5) * 0.1;
  const pane = (x: number, y: number, pwid: number, phgt: number, k: number) => {
    const gold = k % 2 === 0, base = gold ? look.glassGold : look.glass, other = gold ? look.glass : look.glassGold, b = bright(x + pwid / 2, y + phgt / 2);
    c.fillStyle = '#' + new THREE.Color(base[Math.floor(r() * 2)]).multiplyScalar(b).getHexString(); c.fillRect(x, y, pwid, phgt);
    // the old glass is not even: a lighter streak and a darker corner
    c.fillStyle = 'rgba(255,255,235,0.16)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + pwid * 0.45, y); c.lineTo(x, y + phgt * 0.4); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.moveTo(x + pwid, y + phgt); c.lineTo(x + pwid * 0.6, y + phgt); c.lineTo(x + pwid, y + phgt * 0.65); c.closePath(); c.fill();
    const cx = x + pwid / 2, cy = y + phgt / 2, dw = pwid * 0.3, dh = phgt * 0.36;
    c.fillStyle = '#10120c'; c.beginPath(); c.moveTo(cx, cy - dh - lead * 0.5); c.lineTo(cx + dw + lead * 0.5, cy); c.lineTo(cx, cy + dh + lead * 0.5); c.lineTo(cx - dw - lead * 0.5, cy); c.closePath(); c.fill();
    c.fillStyle = '#' + new THREE.Color(other[Math.floor(r() * 2)]).multiplyScalar(b).getHexString(); c.beginPath(); c.moveTo(cx, cy - dh); c.lineTo(cx + dw, cy); c.lineTo(cx, cy + dh); c.lineTo(cx - dw, cy); c.closePath(); c.fill();
  };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pane(bw + lead + i * (pw + lead), H - bw * 0.2 - (j + 1) * (ph + lead), pw, ph, i + j);
  // the arch head: a rose of eight petals round a gold eye, the spandrels in green
  c.fillStyle = '#' + new THREE.Color(look.glass[0]).multiplyScalar(0.8).getHexString(); c.fillRect(0, 0, W, spring + lead);
  const rr = Math.min(R * 0.7, 0.55 * ppm), ry = spring - R * 0.18;
  c.fillStyle = '#10120c'; c.beginPath(); c.arc(R, ry, rr + lead, 0, 7); c.fill();
  for (let k = 0; k < 8; k++) { const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2; c.fillStyle = k % 2 ? look.glass[1] : look.glassGold[0]; c.beginPath(); c.moveTo(R, ry); c.arc(R, ry, rr, a0 + 0.06, a1 - 0.06); c.closePath(); c.fill(); }
  c.fillStyle = '#10120c'; c.beginPath(); c.arc(R, ry, rr * 0.4, 0, 7); c.fill();
  c.fillStyle = look.glassGold[1]; c.beginPath(); c.arc(R, ry, rr * 0.32, 0, 7); c.fill();
  c.strokeStyle = '#10120c'; c.lineWidth = lead; c.beginPath(); c.moveTo(0, spring + lead / 2); c.lineTo(W, spring + lead / 2); c.stroke();
  // gold border round the whole light
  c.lineWidth = bw; c.strokeStyle = look.glassGold[2]; c.beginPath(); c.moveTo(bw / 2, H); c.lineTo(bw / 2, spring); c.arc(R, spring, R - bw / 2, Math.PI, 0); c.lineTo(W - bw / 2, H); c.stroke();
  // dust towards the foot, one cracked pane
  const dg = c.createLinearGradient(0, H, 0, H - 0.6 * ppm); dg.addColorStop(0, 'rgba(16,18,12,0.45)'); dg.addColorStop(1, 'rgba(16,18,12,0)'); c.fillStyle = dg; c.fillRect(0, H - 0.6 * ppm, W, 0.6 * ppm);
  c.strokeStyle = 'rgba(250,250,230,0.7)'; c.lineWidth = 0.008 * ppm; c.beginPath(); let x = W * 0.28, y = H * 0.7; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.3) * 0.08 * ppm; y += 0.06 * ppm; c.lineTo(x, y); } c.stroke();
  c.restore();
};
/** The window itself: the glass (self-lit, it does not cast a shadow so the moon behind it passes) set back in its opening,
 *  a stone mullion, a halo of coloured light on the wall round it. Origin = the middle of the sill on the wall face (z 0);
 *  the glass lies at z -depth. h = sill to top of the arch. */
export const StainedWindow: React.FC<{w: number; h: number; look: HallLook; seed?: number; depth?: number; glow?: number; id: string}> = ({w, h, look, seed = 3, depth = 0.4, glow = 1, id}) => {
  const map = useMemo(() => tex(`hall-glass2-${id}`, Math.round(w * 260), Math.round(h * 260), paintStainedGlass(w, h, look, seed)), [id, w, h]);
  return (
    <group>
      <mesh position={[0, h / 2, -depth]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} transparent alphaTest={0.5} color={new THREE.Color(1, 1, 1).multiplyScalar(glow)} toneMapped={false} /></mesh>
      <Halo pos={[0, h * 0.5, 0.05]} r={Math.max(w, h) * 0.7} color={look.glass[3]} strength={0.2 * glow} order={2} />
      <Halo pos={[0, h * 0.5, 0.06]} r={Math.max(w, h) * 0.4} color={look.glassGold[1]} strength={0.14 * glow} order={2} />
    </group>
  );
};

// ---------------------------------------------------------------- cloth
/** A tall banner: cloth with a gold border, a swallowtail foot with gold tassels, the emblem (a gold ring round a diamond),
 *  folds as soft light and dark bands, a little fraying. Canvas W x H (the tails are cut out). */
export const paintBanner = (look: HallLook, seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), tail = H * 0.1, bw = W * 0.07;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(W / 2, H - tail); c.lineTo(0, H); c.closePath(); c.save(); c.clip();
  c.fillStyle = look.cloth; c.fillRect(0, 0, W, H);
  // weave
  for (let k = 0; k < 900; k++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'; c.fillRect(r() * W, r() * H, 1 + r() * 3, 1); }
  // gold border, its own stitched lines
  c.strokeStyle = look.gold; c.lineWidth = bw; c.beginPath(); c.moveTo(bw / 2, 0); c.lineTo(bw / 2, H - bw * 0.3); c.lineTo(W / 2, H - tail - bw * 0.3); c.lineTo(W - bw / 2, H - bw * 0.3); c.lineTo(W - bw / 2, 0); c.stroke();
  c.strokeStyle = look.goldDark; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(bw * 1.15, 0); c.lineTo(bw * 1.15, H - bw * 1.3); c.lineTo(W / 2, H - tail - bw * 1.2); c.lineTo(W - bw * 1.15, H - bw * 1.3); c.lineTo(W - bw * 1.15, 0); c.stroke(); c.setLineDash([]);
  // a top band
  c.fillStyle = look.clothDark; c.fillRect(0, 0, W, H * 0.06); c.fillStyle = look.gold; c.fillRect(0, H * 0.06, W, H * 0.012);
  // the emblem: a gold ring with eight rays round a diamond
  const ex = W / 2, ey = H * 0.36, er = W * 0.27;
  if (look.emblem === 'diamond') {   // the Baron's badge: one big gold diamond with a dark heart and a thin inner line
    c.fillStyle = look.gold; c.beginPath(); c.moveTo(ex, ey - er * 1.3); c.lineTo(ex + er * 0.85, ey); c.lineTo(ex, ey + er * 1.3); c.lineTo(ex - er * 0.85, ey); c.closePath(); c.fill();
    c.strokeStyle = look.goldDark; c.lineWidth = W * 0.012; c.beginPath(); c.moveTo(ex, ey - er * 1.1); c.lineTo(ex + er * 0.7, ey); c.lineTo(ex, ey + er * 1.1); c.lineTo(ex - er * 0.7, ey); c.closePath(); c.stroke();
    c.fillStyle = look.clothDark; c.beginPath(); c.moveTo(ex, ey - er * 0.45); c.lineTo(ex + er * 0.3, ey); c.lineTo(ex, ey + er * 0.45); c.lineTo(ex - er * 0.3, ey); c.closePath(); c.fill();
  } else {
  c.strokeStyle = look.gold; c.lineWidth = W * 0.045; c.beginPath(); c.arc(ex, ey, er, 0, 7); c.stroke();
  c.strokeStyle = look.goldDark; c.lineWidth = W * 0.012; c.beginPath(); c.arc(ex, ey, er - W * 0.03, 0, 7); c.stroke();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.fillStyle = look.gold; c.beginPath(); c.moveTo(ex + Math.cos(a) * er * 1.08, ey + Math.sin(a) * er * 1.08); c.lineTo(ex + Math.cos(a + 0.12) * er * 1.32, ey + Math.sin(a + 0.12) * er * 1.32); c.lineTo(ex + Math.cos(a - 0.12) * er * 1.32, ey + Math.sin(a - 0.12) * er * 1.32); c.closePath(); c.fill(); }
  c.fillStyle = look.gold; c.beginPath(); c.moveTo(ex, ey - er * 0.62); c.lineTo(ex + er * 0.42, ey); c.lineTo(ex, ey + er * 0.62); c.lineTo(ex - er * 0.42, ey); c.closePath(); c.fill();
  c.fillStyle = look.clothDark; c.beginPath(); c.moveTo(ex, ey - er * 0.36); c.lineTo(ex + er * 0.22, ey); c.lineTo(ex, ey + er * 0.36); c.lineTo(ex - er * 0.22, ey); c.closePath(); c.fill();
  }
  // a gold bar device lower down
  c.fillStyle = look.gold; c.fillRect(W * 0.3, H * 0.66, W * 0.4, H * 0.012); c.fillRect(W * 0.38, H * 0.69, W * 0.24, H * 0.008);
  // folds: vertical bands of light and shade
  for (let k = 0; k < 4; k++) { const x = W * (0.12 + k * 0.25 + (r() - 0.5) * 0.06), g = c.createLinearGradient(x - W * 0.12, 0, x + W * 0.12, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(255,255,240,0.10)'); g.addColorStop(0.6, 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - W * 0.12, 0, W * 0.24, H); }
  // age: a darker foot, a moth hole
  const fg = c.createLinearGradient(0, H, 0, H * 0.75); fg.addColorStop(0, 'rgba(0,0,0,0.3)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = fg; c.fillRect(0, H * 0.75, W, H * 0.25);
  c.fillStyle = 'rgba(10,8,6,0.8)'; c.beginPath(); c.ellipse(W * 0.72, H * 0.55, 3, 2, 0, 0, 7); c.fill();
  c.restore();
};
/** A banner hanging on the wall: the cloth (a slightly bowed plane), an iron rod on two brackets with turned gold finials,
 *  two gold tassels at the tails. pos = the middle of the rod at the wall. */
export const HallBanner: React.FC<{pos: V3; w?: number; h?: number; look: HallLook; seed?: number; id: string; sway?: number}> = ({pos, w = 0.95, h = 3.2, look, seed = 1, id, sway = 0}) => {
  const map = useMemo(() => tex(`hall-banner-${id}`, 380, Math.round(380 * h / w), paintBanner(look, seed)), [id, w, h]);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(w, h, 8, 1), p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, 0.03 * Math.sin((p.getX(i) / w + 0.5) * Math.PI * 3)); g.computeVertexNormals(); return g; }, [w, h]);
  return (
    <group position={pos} rotation={[0, 0, sway]}>
      <mesh geometry={geo} position={[0, -h / 2 - 0.04, 0.09]} castShadow receiveShadow><meshLambertMaterial map={map} transparent alphaTest={0.5} side={THREE.DoubleSide} /></mesh>
      <B p={[0, 0, 0.09]} s={[w + 0.3, 0.035, 0.035]} c="#2a2826" />
      {[-1, 1].map((k) => <group key={k}>
        <B p={[k * (w / 2 - 0.05), 0, 0.045]} s={[0.03, 0.03, 0.09]} c="#2a2826" />
        <FacetLathe profile={[[0.018, 0], [0.04, 0.03], [0.03, 0.07], [0.005, 0.1]]} sides={8} color={look.gold} pos={[k * (w / 2 + 0.15), 0, 0.09]} rotY={0} contact={false} />
        <group position={[k * w * 0.48, -h - 0.02, 0.1]}><B p={[0, 0, 0]} s={[0.012, 0.1, 0.012]} c={look.goldDark} /><FacetLathe profile={[[0.005, -0.2], [0.035, -0.16], [0.02, -0.06], [0.01, -0.04]]} sides={8} color={look.gold} contact={false} /></group>
      </group>)}
    </group>
  );
};
/** The carpet runner: cloth with a gold border, a repeat of small gold diamonds, worn paler down the walking line. */
export const paintRunner = (look: HallLook, Lm: number, seed: number) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = H / Lm;
  c.fillStyle = look.cloth; c.fillRect(0, 0, W, H);
  for (let k = 0; k < W * H / 60; k++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.05)'; c.fillRect(r() * W, r() * H, 2, 1 + r() * 2); }
  const bw = W * 0.09;
  c.fillStyle = look.gold; c.fillRect(0, 0, bw, H); c.fillRect(W - bw, 0, bw, H);
  c.fillStyle = look.clothDark; c.fillRect(bw, 0, W * 0.03, H); c.fillRect(W - bw - W * 0.03, 0, W * 0.03, H);
  c.fillStyle = look.goldDark; for (let y = 0; y < H; y += 0.12 * ppm) { c.fillRect(bw * 0.3, y, bw * 0.4, 0.04 * ppm); c.fillRect(W - bw * 0.7, y, bw * 0.4, 0.04 * ppm); }
  for (let y = 0.3 * ppm, k = 0; y < H; y += 0.55 * ppm, k++) for (const x of [W * 0.33, W * 0.67]) {
    const xx = k % 2 ? W / 2 : x; if (k % 2 && x > W / 2) continue;
    c.fillStyle = look.gold; c.beginPath(); c.moveTo(xx, y - 0.09 * ppm); c.lineTo(xx + 0.06 * ppm, y); c.lineTo(xx, y + 0.09 * ppm); c.lineTo(xx - 0.06 * ppm, y); c.closePath(); c.fill();
    c.fillStyle = look.clothDark; c.beginPath(); c.arc(xx, y, 0.018 * ppm, 0, 7); c.fill();
  }
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0.25, 'rgba(255,255,230,0)'); g.addColorStop(0.5, 'rgba(255,255,230,0.08)'); g.addColorStop(0.75, 'rgba(255,255,230,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 6; k++) { const y = r() * H; c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, y, W, 0.02 * ppm); }
};

// ---------------------------------------------------------------- the dais and the throne
/** A broad dais of three stone steps against the back wall, the full width between the far columns (the reference's wide
 *  stair). Step k (0 = lowest) is `rise` high, spans x ±half[k], comes forward to z = front[k] (from the back z = back). Dressed
 *  stone; a GOLD strip along the nosing of every step and a dark shadow line under it. pos = (x of the middle, 0, 0). */
export const DAIS = {rise: 0.18, half: [4.6, 4.2, 3.8], front: [-8.6, -9.0, -9.4], back: -12};
export const Dais: React.FC<{x?: number; look?: HallLook}> = ({x = 0, look = HALL.doom}) => (
  <group position={[x, 0, 0]}>
    {DAIS.half.map((hw, k) => { const d = DAIS.front[k] - DAIS.back, y = DAIS.rise * (k + 0.5), top = DAIS.rise * (k + 1);
      return <group key={k}>
        <StoneBox id={`hall-step2-${k}`} p={[0, y, DAIS.back + d / 2]} s={[hw * 2, DAIS.rise, d]} look={{...HALL_STONE, seed: 31 + k * 7, course: [0.18, 0.18], len: [0.7, 1.3], damp: 0, streaks: 0}} />
        {/* 24/11/2026: mặt trước dải vàng từng TRÙNG mặt trước bậc đá (z-fighting, Daniel thấy bậc thềm nhấp nháy ở chương 16): nay nhô ra 8 mm, vạch tối nhô 14 mm */}
        <B p={[0, top - 0.015, DAIS.front[k] - 0.05 + 0.008]} s={[hw * 2 + 0.02, 0.035, 0.1]} c={look.gold} />
        <B p={[0, top - 0.045, DAIS.front[k] + 0.014]} s={[hw * 2 + 0.02, 0.025, 0.012]} c={look.goldDark} cast={false} />
      </group>; })}
  </group>
);
export const DAIS_TOP = DAIS.rise * 3;
/** THE THRONE, built big as the reference's: a stone seat 0.55 high with a cushion; two broad block arm rests (low, 0.42, so the
 *  seated mould's hands, about 0.43 m above the floor it stands on, lie on their gold caps) with a gold diamond on the front;
 *  a back 1.6 wide and 3.3 high, faced with a tall cloth panel striped and diamonded in gold inside a riveted gold frame; a
 *  pointed crest with a big gold emblem (ring round a diamond) and gold finials. Smooth painted stone (green-grey), like the
 *  reference. pos = the middle of the FRONT EDGE OF THE SEAT on the floor it stands on; the sitter's mark is 0.15 m in front. */
export const THRONE = {seat: 0.55, w: 1.6, d: 0.75, armH: 0.42, armX: 0.74, armW: 0.56, tall: 3.3};
const crestGeo = (w: number, h: number) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h * 0.3); s.quadraticCurveTo(w * 0.2, h * 0.5, 0, h); s.quadraticCurveTo(-w * 0.2, h * 0.5, -w / 2, h * 0.3); s.closePath(); return new THREE.ExtrudeGeometry(s, {depth: 0.24, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 1}); };
const THRONE_STONE = '#6e8279';
export const Throne: React.FC<{pos: V3; look: HallLook}> = ({pos, look}) => {
  const {seat, w, d, armH, armX, armW, tall} = THRONE, backZ = -d - 0.1, ph = tall - seat - 0.25, pw = w - 0.36;
  const panelMap = useMemo(() => tex(`hall-throne-panel2-${look.cloth}`, 300, Math.round(300 * ph / pw), (c, W, H) => {
    const r = rnd(4); c.fillStyle = look.cloth; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 900; k++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.05)'; c.fillRect(r() * W, r() * H, 2, 2); }
    // two darker side bands, a gold strip down the middle and either side, gold diamonds down each band
    c.fillStyle = look.clothDark; c.fillRect(0, 0, W * 0.3, H); c.fillRect(W * 0.7, 0, W * 0.3, H);
    c.fillStyle = look.gold; c.fillRect(W * 0.46, 0, W * 0.08, H); c.fillRect(W * 0.29, 0, W * 0.025, H); c.fillRect(W * 0.685, 0, W * 0.025, H);
    for (const cx of [W * 0.15, W * 0.85, W * 0.375, W * 0.625]) for (let y = H * 0.08; y < H; y += H * 0.16) { const dw = W * 0.06, dh = H * 0.045, side = cx < W * 0.3 || cx > W * 0.7;
      if (!side && (y / (H * 0.16)) % 2 > 1) continue;
      c.fillStyle = look.gold; c.beginPath(); c.moveTo(cx, y - dh); c.lineTo(cx + dw, y); c.lineTo(cx, y + dh); c.lineTo(cx - dw, y); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,250,220,0.35)'; c.beginPath(); c.moveTo(cx, y - dh); c.lineTo(cx + dw, y); c.lineTo(cx, y); c.closePath(); c.fill(); }
    // folds and a soft light from above
    for (let k = 0; k < 5; k++) { const x = W * (0.1 + k * 0.2), g = c.createLinearGradient(x - W * 0.08, 0, x + W * 0.08, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - W * 0.08, 0, W * 0.16, H); }
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,230,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }), [look.cloth]);
  const crest = useMemo(() => crestGeo(w + 0.1, 0.8), [w]);
  const studs = (x0: number, x1: number, y0: number, y1: number, n: number, z: number) => Array.from({length: n}, (_, i) => { const t = (i + 0.5) / n; return <mesh key={i} position={[x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z]}><cylinderGeometry args={[0.018, 0.018, 0.02, 8]} /><meshLambertMaterial color={look.goldDark} /></mesh>; });
  const diamond = (p: V3, s: number, col: string) => <mesh position={p} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[s, s, 0.02]} /><meshLambertMaterial color={col} /></mesh>;
  return (
    <group position={pos}>
      {/* plinth under the whole throne, a gold edge */}
      <B p={[0, 0.06, -(d + 0.4) / 2]} s={[w + armW * 2 + 0.2, 0.12, d + 0.4]} c={shade(THRONE_STONE, 0.85)} />
      <B p={[0, 0.115, -0.01]} s={[w + armW * 2 + 0.22, 0.02, 0.03]} c={look.gold} cast={false} />
      {/* seat block and cushion */}
      <B p={[0, (seat - 0.1) / 2 + 0.06, -d / 2]} s={[w - 0.1, seat - 0.22, d]} c={THRONE_STONE} />
      <B p={[0, seat - 0.08, -d / 2 + 0.02]} s={[w - 0.12, 0.16, d - 0.02]} c={look.cloth} />
      <B p={[0, seat - 0.08, 0.012]} s={[w - 0.1, 0.035, 0.03]} c={look.gold} cast={false} />
      {/* arm rests: broad blocks set back 0.08 (the front of the cap stays 0.15 m behind the sitter's card) */}
      {[-1, 1].map((k) => <group key={k} position={[k * armX, 0, -0.08]}>
        <B p={[0, armH / 2 + 0.06, -d / 2 + 0.02]} s={[armW, armH - 0.06, d + 0.04]} c={THRONE_STONE} />
        <B p={[0, armH + 0.03, -d / 2 + 0.02]} s={[armW + 0.06, 0.05, d + 0.1]} c={look.gold} />
        <B p={[0, armH + 0.0, -d / 2 + 0.02]} s={[armW + 0.04, 0.02, d + 0.08]} c={look.goldDark} cast={false} />
        <B p={[0, armH * 0.45 + 0.06, 0.045]} s={[armW - 0.12, armH * 0.62, 0.01]} c={shade(THRONE_STONE, 0.82)} cast={false} />
        {diamond([0, armH * 0.45 + 0.06, 0.055], 0.15, look.gold)}
        <B p={[k * (armW / 2 + 0.003), armH * 0.5 + 0.06, -d / 2]} s={[0.008, armH * 0.6, d * 0.7]} c={look.goldDark} cast={false} />
      </group>)}
      {/* the back: a stone slab, the cloth panel in a gold frame with studs, a gold cornice on top */}
      <B p={[0, tall / 2 + 0.06, backZ - 0.12]} s={[w, tall, 0.26]} c={shade(THRONE_STONE, 0.95)} />
      <mesh position={[0, seat + 0.1 + ph / 2, backZ + 0.012]} receiveShadow><planeGeometry args={[pw, ph]} /><meshLambertMaterial map={panelMap} /></mesh>
      {[-1, 1].map((k) => <B key={k} p={[k * (pw / 2 + 0.045), seat + 0.1 + ph / 2, backZ + 0.02]} s={[0.07, ph + 0.1, 0.04]} c={look.gold} />)}
      <B p={[0, seat + 0.1 + ph + 0.03, backZ + 0.02]} s={[pw + 0.16, 0.07, 0.04]} c={look.gold} />
      {[-1, 1].map((k) => <group key={`s${k}`}>{studs(k * (pw / 2 + 0.045), k * (pw / 2 + 0.045), seat + 0.2, seat + ph, 9, backZ + 0.045)}</group>)}
      <B p={[0, tall + 0.04, backZ - 0.1]} s={[w + 0.12, 0.1, 0.32]} c={look.goldDark} />
      <B p={[0, tall + 0.1, backZ - 0.1]} s={[w + 0.06, 0.04, 0.28]} c={look.gold} />
      {/* crest: pointed, the emblem big and gold, finials */}
      <mesh geometry={crest} position={[0, tall + 0.12, backZ - 0.22]} castShadow receiveShadow><meshLambertMaterial color={shade(THRONE_STONE, 0.92)} /></mesh>
      {look.emblem === 'diamond' ? null : <mesh position={[0, tall + 0.4, backZ + 0.05]}><torusGeometry args={[0.2, 0.035, 8, 28]} /><meshLambertMaterial color={look.gold} /></mesh>}
      {diamond([0, tall + 0.4, backZ + 0.05], look.emblem === 'diamond' ? 0.27 : 0.17, look.gold)}
      {diamond([0, tall + 0.4, backZ + 0.065], 0.08, look.clothDark)}
      {[-1, 1].map((k) => <FacetLathe key={k} profile={[[0.08, 0], [0.1, 0.06], [0.06, 0.14], [0.09, 0.2], [0.035, 0.32], [0.005, 0.44]]} sides={10} color={look.gold} pos={[k * (w / 2 + 0.02), tall + 0.12, backZ - 0.1]} contact={false} />)}
      <FacetLathe profile={[[0.07, 0], [0.1, 0.07], [0.055, 0.16], [0.08, 0.23], [0.025, 0.36], [0.004, 0.5]]} sides={10} color={look.gold} pos={[0, tall + 0.9, backZ - 0.1]} contact={false} />
    </group>
  );
};

// ---------------------------------------------------------------- columns, torches, armour
/** A round stone column: a square plinth, a moulded base, a shaft of drums (each its own tone) and a cushion capital with a
 *  square abacus. pos = foot; h = height to the top of the abacus. */
export const HallColumn: React.FC<{pos: V3; h?: number; r?: number; seed?: number; band?: string}> = ({pos, h = 6.2, r = 0.32, seed = 1, band}) => {
  const R = rnd(seed), drums = Math.round((h - 1.1) / 0.55), dh = (h - 1.1) / drums;
  return (
    <group position={pos}>
      <StoneBox id={`hall-col-plinth-${seed}`} p={[0, 0.17, 0]} s={[r * 2.6, 0.34, r * 2.6]} look={{...HALL_STONE, seed: seed + 3, course: [0.34, 0.34], len: [0.4, 0.5], damp: 0.3}} />
      <FacetLathe profile={[[r * 1.25, 0.34], [r * 1.25, 0.42], [r * 1.12, 0.48], [r * 1.16, 0.54], [r, 0.62]]} sides={18} color="#7f8c88" contact={false} />
      {Array.from({length: drums}, (_, i) => { const t = 0.88 + R() * 0.22; return <FacetLathe key={i} profile={[[r * 0.985, 0.62 + i * dh], [r, 0.62 + i * dh + 0.02], [r, 0.62 + (i + 1) * dh - 0.02], [r * 0.985, 0.62 + (i + 1) * dh]]} sides={18} color={shade('#7c8a86', t)} contact={false} tones={[0.8, 1, 0.8]} />; })}
      <FacetLathe profile={[[r, h - 0.48], [r * 1.08, h - 0.42], [r * 1.35, h - 0.24], [r * 1.4, h - 0.2]]} sides={18} color="#84918d" contact={false} />
      <StoneBox id={`hall-col-abacus-${seed}`} p={[0, h - 0.1, 0]} s={[r * 3, 0.2, r * 3]} look={{...HALL_STONE, seed: seed + 9, course: [0.2, 0.2], len: [0.5, 0.6], damp: 0}} />
      {/* band = a gold ring round the shaft at 2 m and under the capital */}
      {band ? [2.0, h - 0.56].map((y) => <FacetLathe key={y} profile={[[r * 1.04, y], [r * 1.07, y + 0.03], [r * 1.07, y + 0.09], [r * 1.04, y + 0.12]]} sides={18} color={band} contact={false} tones={[1.15, 1, 0.85]} />) : null}
      {/* damp and moss at the foot */}
      <FacetLathe profile={[[r * 1.3, 0.335], [r * 1.31, 0.345]]} sides={18} color="#3d4a3a" contact={false} cast={false} />
    </group>
  );
};
/** A torch in an iron wall bracket: a cup on a bent arm, a wrapped wooden torch, a live flame (f), embers, a warm halo and its
 *  own light. pos = where the bracket meets the wall; out = the direction it points (+z of its group); rotY turns it. */
/** lean = the flame bent sideways by a draught (radians, 0 = upright); out = the torch burnt out (the bracket and the black head only) */
export const WallTorch: React.FC<{pos: V3; rotY?: number; f?: number; k?: number; light?: boolean; seed?: number; lean?: number; out?: boolean}> = ({pos, rotY = 0, f = 0, k = 1, light = true, seed = 1, lean = 0, out = false}) => {
  const fl = 1 + 0.07 * Math.sin(f * 0.37 + seed) + 0.04 * Math.sin(f * 0.83 + seed * 2);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0, 0.03]} s={[0.14, 0.22, 0.04]} c="#232220" />
      <B p={[0, 0.06, 0.16]} s={[0.03, 0.03, 0.26]} r={[0.5, 0, 0]} c="#2a2826" />
      <B p={[0, -0.06, 0.12]} s={[0.03, 0.03, 0.2]} r={[-0.3, 0, 0]} c="#2a2826" />
      <group position={[0, 0.12, 0.27]} rotation={[0.18, 0, 0]}>
        <FacetLathe profile={[[0.02, -0.34], [0.028, -0.1], [0.05, 0.0], [0.062, 0.1], [0.058, 0.12]]} sides={8} color="#3a2a1e" contact={false} tones={[0.8, 1, 1.1, 0.9]} />
        <FacetLathe profile={[[0.045, 0.02], [0.07, 0.11], [0.074, 0.13]]} sides={10} color="#2a2826" contact={false} />
        {out ? null : <>
        <group position={[0, 0.1, 0]} rotation={[0, 0, lean]} scale={[k * fl, k * fl * 1.1, 1]}><Flame f={f + seed * 17} w={0.2} /></group>
        <Halo pos={[0, 0.25, 0.08]} r={0.55 * fl * k} color="#ffa24a" strength={0.42} order={4} />
        <Embers f={f + seed * 9} box={[-0.12, 0.12, 0.25, 1.1, -0.05, 0.08]} n={5} size={0.014} life={44} seed={seed + 3} />
        </>}
      </group>
      {light && !out ? <pointLight position={[0, 0.5, 0.45]} color="#ffac66" intensity={3.0 * k * fl} distance={7.5} decay={1.4} /> : null}
    </group>
  );
};
/** A STATUE OF ARMOUR on a stone pedestal, as in the reference: chunky plate in green-grey steel with lighter edges and rivets,
 *  sabatons, greaves with knee cops, a skirt of tassets with a gold diamond, a breastplate with a centre ridge and a GOLD MEDALLION,
 *  a gold belt, round pauldrons, gauntlets; the right hand rests on a tall halberd, the left holds a kite shield with the emblem;
 *  a closed helm with a T-slit and a green plume. pos = foot of the pedestal; side = +1: halberd on the viewer's right. */
export const ArmourStand: React.FC<{pos: V3; side?: 1 | -1; look?: HallLook; steel?: string; scale?: number}> = ({pos, side = 1, look = HALL.doom, steel = '#7f8c88', scale = 1}) => {
  const lit = shade(steel, 1.22), dark = shade(steel, 0.68), y0 = 0.5, rv = (p: V3, i: number) => <mesh key={i} position={p}><cylinderGeometry args={[0.012, 0.012, 0.012, 6]} /><meshLambertMaterial color={lit} /></mesh>;
  const plate = (p: V3, s: V3, c = steel, r?: V3) => <B p={p} s={s} c={c} r={r} />;
  const edge = (p: V3, s: V3) => <B p={p} s={s} c={lit} cast={false} />;
  return (
    <group position={pos} scale={scale}>
      {/* the pedestal: a moulded block with a gold band and a darker die */}
      <StoneBox id={`hall-armour-ped-${side}`} p={[0, 0.06, 0]} s={[0.95, 0.12, 0.75]} look={{...HALL_STONE, seed: 44 + side, course: [0.12, 0.12], len: [0.5, 0.6], damp: 0.1}} />
      <B p={[0, 0.29, 0]} s={[0.82, 0.34, 0.62]} c="#4a5551" /><B p={[0, 0.29, 0.312]} s={[0.6, 0.2, 0.01]} c="#3e4844" cast={false} />
      <B p={[0, 0.47, 0]} s={[0.9, 0.06, 0.7]} c="#56625d" /><B p={[0, 0.445, 0.352]} s={[0.9, 0.02, 0.01]} c={look.gold} cast={false} />
      {/* legs */}
      {[-1, 1].map((k) => <group key={k} position={[k * 0.13, y0, 0]}>
        {plate([0, 0.05, 0.05], [0.15, 0.1, 0.3], dark)}
        {plate([0, 0.3, 0], [0.13, 0.42, 0.15])}{edge([k * 0.066, 0.3, 0.06], [0.01, 0.4, 0.02])}
        {plate([0, 0.54, 0.02], [0.16, 0.12, 0.17], lit)}
        {plate([0, 0.78, 0], [0.15, 0.38, 0.16])}
        {rv([0, 0.54, 0.11], 0)}
      </group>)}
      {/* tassets: a skirt of three lames, a gold diamond on the front */}
      {[0, 1, 2].map((i) => plate([0, y0 + 0.98 - i * 0.08, 0.01 + i * 0.005], [0.46 + i * 0.03, 0.09, 0.26 + i * 0.01], i % 2 ? steel : lit))}
      <mesh position={[0, y0 + 0.9, 0.15]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.09, 0.09, 0.02]} /><meshLambertMaterial color={look.gold} /></mesh>
      {/* belt */}
      <B p={[0, y0 + 1.06, 0]} s={[0.47, 0.06, 0.28]} c={look.goldDark} /><B p={[0, y0 + 1.06, 0.142]} s={[0.08, 0.05, 0.01]} c={look.gold} cast={false} />
      {/* breastplate: a broad block, a lit ridge, the medallion, rivets round the edge */}
      {plate([0, y0 + 1.36, 0], [0.44, 0.4, 0.3])}{plate([0, y0 + 1.16, 0], [0.36, 0.16, 0.27])}
      {plate([0, y0 + 1.36, 0.15], [0.36, 0.34, 0.02], lit)}
      <B p={[0, y0 + 1.32, 0.166]} s={[0.03, 0.4, 0.015]} c={shade(steel, 1.4)} cast={false} />
      <mesh position={[0, y0 + 1.38, 0.172]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.075, 0.075, 0.02, 20]} /><meshLambertMaterial color={look.gold} /></mesh>
      <mesh position={[0, y0 + 1.38, 0.184]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 0.01, 16]} /><meshLambertMaterial color={look.goldDark} /></mesh>
      {[[-0.19, 1.52], [0.19, 1.52], [-0.19, 1.13], [0.19, 1.13], [-0.2, 1.32], [0.2, 1.32]].map(([x, y], i) => rv([x, y0 + y, 0.17], i + 10))}
      <B p={[0, y0 + 1.58, 0]} s={[0.24, 0.05, 0.2]} c={dark} />
      {/* pauldrons and arms */}
      {[-1, 1].map((k) => <group key={k} position={[k * 0.34, y0 + 1.48, 0]}>
        <FacetLathe profile={[[0.02, 0.1], [0.12, 0.07], [0.15, -0.02], [0.14, -0.1], [0.12, -0.12]]} sides={10} color={steel} squash={0.85} contact={false} tones={[1.2, 1.05, 0.9, 0.75]} />
        {plate([k * 0.01, -0.3, 0], [0.12, 0.34, 0.13])}{edge([k * 0.065, -0.3, 0.03], [0.01, 0.32, 0.03])}
        {plate([k * 0.01, -0.48, 0.01], [0.14, 0.07, 0.14], lit)}
      </group>)}
      {/* right arm forward to the halberd, left arm to the shield */}
      {plate([side * 0.36, y0 + 0.88, 0.07], [0.12, 0.28, 0.13], steel, [0.25, 0, 0])}
      {plate([side * 0.37, y0 + 0.74, 0.12], [0.13, 0.12, 0.13], dark)}
      {plate([-side * 0.36, y0 + 0.88, 0.07], [0.12, 0.28, 0.13], steel, [0.2, 0, 0])}
      {/* helm: a box with bevelled lit cheek plates, a T-slit, a gold band, a green plume */}
      {plate([0, y0 + 1.79, 0], [0.24, 0.3, 0.26])}
      {plate([0, y0 + 1.79, 0.13], [0.21, 0.27, 0.02], lit)}
      <B p={[0, y0 + 1.83, 0.142]} s={[0.15, 0.025, 0.01]} c="#0b0c0c" cast={false} />
      <B p={[0, y0 + 1.76, 0.142]} s={[0.025, 0.1, 0.01]} c="#0b0c0c" cast={false} />
      <B p={[0, y0 + 1.95, 0]} s={[0.26, 0.03, 0.27]} c={look.gold} />
      <FacetLathe profile={[[0.13, 0], [0.11, 0.05], [0.06, 0.08], [0.01, 0.09]]} sides={8} color={steel} pos={[0, y0 + 1.95, 0]} contact={false} />
      <group position={[0, y0 + 2.02, 0]}>{[0, 1, 2, 3].map((i) => <B key={i} p={[0, 0.08 + i * 0.07, -0.02 - i * 0.04]} s={[0.05, 0.14, 0.09]} r={[-0.3 - i * 0.18, 0, 0]} c={shade(look.cloth, 1.25 - i * 0.1)} />)}</group>
      {/* the halberd */}
      <group position={[side * 0.4, 0.5, 0.18]}>
        <B p={[0, 1.25, 0]} s={[0.04, 2.5, 0.04]} c="#3e2c1e" />
        <B p={[0, 2.6, 0]} s={[0.025, 0.28, 0.025]} c="#b9c2c0" />
        <B p={[side * 0.13, 2.36, 0]} s={[0.22, 0.26, 0.015]} c="#a7b1ae" /><B p={[side * 0.13, 2.36, 0.009]} s={[0.2, 0.02, 0.004]} c="#d8dedc" cast={false} />
        <B p={[-side * 0.08, 2.38, 0]} s={[0.13, 0.04, 0.015]} c="#8e9895" />
        <B p={[0, 2.2, 0]} s={[0.06, 0.06, 0.06]} c={look.gold} /><B p={[0, 1.0, 0]} s={[0.055, 0.05, 0.055]} c={look.goldDark} />
      </group>
      {/* the kite shield with the emblem, held at the other side */}
      <group position={[-side * 0.42, y0 + 0.72, 0.2]} rotation={[0, side * 0.25, 0]}>
        <mesh geometry={useMemo(() => { const s = new THREE.Shape(); s.moveTo(-0.2, 0.3); s.lineTo(0.2, 0.3); s.lineTo(0.2, -0.05); s.quadraticCurveTo(0.15, -0.3, 0, -0.42); s.quadraticCurveTo(-0.15, -0.3, -0.2, -0.05); s.closePath(); return new THREE.ExtrudeGeometry(s, {depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 1}); }, [])} castShadow receiveShadow><meshLambertMaterial color={look.cloth} /></mesh>
        {look.emblem === 'diamond' ? null : <mesh position={[0, 0.02, 0.066]}><torusGeometry args={[0.1, 0.018, 6, 22]} /><meshLambertMaterial color={look.gold} /></mesh>}
        <mesh position={[0, 0.02, 0.066]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.08, 0.08, 0.015]} /><meshLambertMaterial color={look.gold} /></mesh>
        <B p={[0, 0.3, 0.04]} s={[0.42, 0.03, 0.03]} c={look.gold} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- light effects
/** A shaft of light falling from high up (a slit in the vault) onto the throne: a soft cone of light in the air, brighter at
 *  the top, with dust specks in it. top / bottom = centres; r = radius at the bottom. Drawn additively, never writes depth. */
export const LightShaft: React.FC<{top: V3; bottom: V3; r: number; color?: string; strength?: number; f?: number}> = ({top, bottom, r, color = '#f4ecd2', strength = 0.12, f = 0}) => {
  const len = Math.hypot(bottom[0] - top[0], bottom[1] - top[1], bottom[2] - top[2]), mid: V3 = [(top[0] + bottom[0]) / 2, (top[1] + bottom[1]) / 2, (top[2] + bottom[2]) / 2];
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(bottom[0] - top[0], bottom[1] - top[1], bottom[2] - top[2]).normalize()), [top.join(), bottom.join()]);
  const map = useMemo(() => tex('hall-shaft', 64, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.7, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }), []);
  const specks = useMemo(() => { const R = rnd(13); return Array.from({length: 26}, () => [R(), R() * 6.28, R(), 0.006 + R() * 0.008] as const); }, []);
  return (
    <group>
      <mesh position={mid} quaternion={q} renderOrder={4}><coneGeometry args={[r, len, 24, 1, true]} /><meshBasicMaterial map={map} color={color} transparent opacity={strength} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} /></mesh>
      {specks.map(([t, a, d, s], i) => { const tt = (t + f * 0.0015 * (1 + d)) % 1, rr = r * tt * 0.8 * d, y = top[1] + (bottom[1] - top[1]) * tt; return <mesh key={i} position={[top[0] + (bottom[0] - top[0]) * tt + Math.cos(a + f * 0.01) * rr, y, top[2] + (bottom[2] - top[2]) * tt + Math.sin(a) * rr * 0.5]} renderOrder={4}><circleGeometry args={[s, 6]} /><meshBasicMaterial color="#fff6dc" transparent opacity={0.55} depthWrite={false} /></mesh>; })}
    </group>
  );
};
/** A tall gold candle stand (the reference has rows of them along the carpet): a stepped round foot, a shaft with three knops,
 *  a broad tray with three white candles (the middle one taller), drips of wax, live flames (f), a warm halo and a small warm
 *  light. pos = foot on the floor; h = height of the tray. */
/** `tat` (24/11/2026, chương 17): the candles are out: no flame, no halo (the smoke is drawn by the scene). */
export const Candelabra: React.FC<{pos: V3; h?: number; f?: number; look?: HallLook; seed?: number; light?: boolean; tat?: boolean}> = ({pos, h = 1.55, f = 0, look = HALL.doom, seed = 1, light = true, tat = false}) => {
  const g = look.gold;
  return (
    <group position={pos}>
      <FacetLathe profile={[[0.22, 0], [0.22, 0.04], [0.16, 0.08], [0.15, 0.12], [0.07, 0.18], [0.04, 0.22]]} sides={12} color={g} tones={[0.75, 1.1, 0.9, 1.15, 0.95]} />
      <FacetLathe profile={[[0.035, 0.2], [0.03, h * 0.35], [0.07, h * 0.37], [0.03, h * 0.39], [0.028, h * 0.66], [0.06, h * 0.68], [0.028, h * 0.7], [0.03, h - 0.08], [0.08, h - 0.04]]} sides={10} color={g} contact={false} tones={[0.9, 1.15, 0.85, 1.0, 1.15, 0.85, 1.0, 1.1]} />
      <FacetLathe profile={[[0.06, h - 0.06], [0.26, h - 0.02], [0.27, h + 0.02], [0.22, h + 0.02]]} sides={14} color={g} contact={false} tones={[0.85, 1.15, 1.0]} />
      {[[-0.16, 0.22], [0, 0.32], [0.16, 0.24]].map(([x, ch], i) => { const fl = 1 + 0.12 * Math.sin(f * 0.41 + i * 2.1 + seed);
        return <group key={i} position={[x, h + 0.02, 0]}>
          <FacetLathe profile={[[0.035, 0], [0.035, ch], [0.03, ch + 0.012]]} sides={10} color="#ece6d4" contact={false} tones={[1, 1.05]} />
          <B p={[0.03, ch - 0.04, 0.02]} s={[0.012, 0.06, 0.012]} c="#f4efe0" cast={false} />
          {tat ? null : <><group position={[0, ch + 0.01, 0.01]} scale={[fl * 0.9, fl * 1.1, 1]}><Flame f={f + i * 13 + seed * 7} w={0.055} dy={0} dz={0.004} /></group>
          <Halo pos={[0, ch + 0.07, 0.03]} r={0.2 * fl} color="#ffc060" strength={0.45} /></>}
        </group>; })}
      {light ? <pointLight position={[0, h + 0.5, 0.2]} color="#ffb860" intensity={2.6} distance={5} decay={1.5} /> : null}
    </group>
  );
};
/** A BEAM of coloured light through a window, in the air: from the window's opening down along the moon's direction `dir`
 *  (unit, pointing into the hall and down) to the floor, as two additive faces (from the top edge and from the sill) with dust
 *  specks drifting in it. win = {x, sill, top, w} on the wall at z = wallZ. Never writes depth. */
export const WindowBeam: React.FC<{x: number; sill: number; top: number; w: number; wallZ: number; dir: V3; look: HallLook; strength?: number; f?: number; seed?: number}> = ({x, sill, top, w, wallZ, dir, look, strength = 0.1, f = 0, seed = 1}) => {
  const map = useMemo(() => tex(`hall-beam-${look.cloth}-${look.glass[1]}-${look.glassGold[1]}`, 128, 256, (c, W, H) => {
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? look.glass[1] : look.glassGold[1]; c.fillRect((i * W) / 8, 0, W / 8 + 1, H); }
    c.globalCompositeOperation = 'destination-in'; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }), [look.cloth, look.glass[1], look.glassGold[1]]);
  const land = (y: number): V3 => { const t = y / -dir[1]; return [x + dir[0] * t, 0.02, wallZ + dir[2] * t]; };
  const face = (y: number) => { const a: V3 = [x, y, wallZ], b = land(y), g = new THREE.BufferGeometry(), hw = w / 2;
    g.setAttribute('position', new THREE.Float32BufferAttribute([a[0] - hw, a[1], a[2], a[0] + hw, a[1], a[2], b[0] - hw, b[1], b[2], b[0] + hw, b[1], b[2]], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2)); g.setIndex([0, 2, 1, 1, 2, 3]); return g; };
  const geos = useMemo(() => [face(top), face(sill)], [x, sill, top, w, wallZ, dir.join()]);
  const specks = useMemo(() => { const R = rnd(seed + 50); return Array.from({length: 24}, () => [R(), R() - 0.5, R(), 0.006 + R() * 0.007] as const); }, [seed]);
  return (
    <group>
      {geos.map((g, i) => <mesh key={i} geometry={g} renderOrder={4}><meshBasicMaterial map={map} transparent opacity={strength * (i ? 0.8 : 1)} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} /></mesh>)}
      {specks.map(([t0, u, v, s], i) => { const t = (t0 + f * 0.0012) % 1, y = sill + (top - sill) * v, p = land(y), q: V3 = [x + u * w, y, wallZ];
        return <mesh key={`d${i}`} position={[q[0] + (p[0] - q[0]) * t, q[1] + (p[1] - q[1]) * t + Math.sin(f * 0.03 + i) * 0.03, q[2] + (p[2] - q[2]) * t]} renderOrder={4}><circleGeometry args={[s, 6]} /><meshBasicMaterial color="#fff8dc" transparent opacity={0.5 * (1 - t * 0.6)} depthWrite={false} /></mesh>; })}
    </group>
  );
};
/** Where a window's light lands on the floor: the window's own picture (its texture) stretched along the light, added on top of
 *  the floor (a glow that also reads as the polished stone reflecting the glass). `shadow` = a dark silhouette (fraction of the
 *  width, fraction of the length from the near end) cut into it, e.g. the throne in front of the window. */
export const FloorPool: React.FC<{x: number; sill: number; top: number; w: number; wallZ: number; dir: V3; look: HallLook; strength?: number; shadow?: [number, number]; id: string}> = ({x, sill, top, w, wallZ, dir, look, strength = 0.5, shadow, id}) => {
  const t0 = sill / -dir[1], t1 = top / -dir[1], z0 = wallZ + dir[2] * t0, z1 = wallZ + dir[2] * t1, xs = x + dir[0] * (t0 + t1) / 2, len = z1 - z0;
  const map = useMemo(() => tex(`hall-pool-${id}`, 256, 512, (c, W, H) => {
    const r = rnd(7); for (let j = 0; j < 8; j++) for (let i = 0; i < 2; i++) { c.fillStyle = (i + j) % 2 ? look.glass[1] : look.glassGold[1]; c.fillRect(i * W / 2 + 6, j * H / 8 + 6, W / 2 - 12, H / 8 - 12); }
    c.globalCompositeOperation = 'destination-out';
    // canvas top = the far end (by the wall), where the lowest rays land: the thing in front of the window shades from there
    if (shadow) { const sw = W * shadow[0], sl = H * shadow[1]; c.fillStyle = 'rgba(0,0,0,0.92)'; c.beginPath(); c.moveTo(W / 2 - sw / 2, 0); c.lineTo(W / 2 - sw / 2, sl * 0.8); c.lineTo(W / 2, sl); c.lineTo(W / 2 + sw / 2, sl * 0.8); c.lineTo(W / 2 + sw / 2, 0); c.closePath(); c.fill(); }
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(0.18, 'rgba(0,0,0,0)'); g.addColorStop(0.82, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.9)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(0,0,0,${r() * 0.3})`; c.fillRect(r() * W, r() * H, 20 + r() * 40, 3); }
  }), [id]);
  return <mesh position={[xs, 0.012, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}><planeGeometry args={[w * 1.05, len]} /><meshBasicMaterial map={map} transparent opacity={strength} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} polygonOffset polygonOffsetFactor={-2} /></mesh>;
};

// ---------------------------------------------------------------- additions of 23/11/2026 (chapters 10-13): banquet, globe stand, paper scraps, a hoisted flag, a column of light, glass blends
/** the stained glass turned to white and violet by a strange light (chapter 13 scene 3): k 0..1, quantised by the caller so that textures are cached per step */
export const glassBlend = (look: HallLook, k: number): HallLook => {
  const mix = (a: string, b: string) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
  const W = ['#efe6ff', '#f8f2ff', '#dccffb', '#ffffff', '#cdbdf8'], G = ['#fff4ff', '#ffffff', '#f0e0ff'];
  return {...look, glass: look.glass.map((c, i) => mix(c, W[i % W.length])), glassGold: look.glassGold.map((c, i) => mix(c, G[i % G.length])), light: mix(look.light, '#e6dcff')};
};
const paintFeast = (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); const s = H / 100, r = rnd(6);
  const platter = (cx: number, w: number) => { c.fillStyle = '#9aa3aa'; c.beginPath(); c.ellipse(cx, 84 * s, w, 10 * s, 0, 0, 7); c.fill(); c.fillStyle = '#d5dade'; c.beginPath(); c.ellipse(cx, 81 * s, w * 0.93, 8 * s, 0, 0, 7); c.fill(); };
  // roast fowl in the middle
  platter(W * 0.5, 30 * s); c.fillStyle = '#b4682c'; c.beginPath(); c.ellipse(W * 0.5, 62 * s, 22 * s, 17 * s, 0, 0, 7); c.fill(); c.fillStyle = '#d9913c'; c.beginPath(); c.ellipse(W * 0.5 - 3 * s, 58 * s, 17 * s, 11 * s, 0, 0, 7); c.fill();
  c.fillStyle = '#b4682c'; c.beginPath(); c.ellipse(W * 0.5 - 24 * s, 70 * s, 7 * s, 4 * s, -0.5, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * 0.5 + 24 * s, 70 * s, 7 * s, 4 * s, 0.5, 0, 7); c.fill(); c.fillStyle = '#f0e8d0'; c.fillRect(W * 0.5 - 31 * s, 71 * s, 4 * s, 4 * s); c.fillRect(W * 0.5 + 27 * s, 71 * s, 4 * s, 4 * s);
  // fruit trays on either side, built of flat discs
  [W * 0.22, W * 0.78].forEach((cx, k) => { platter(cx, 28 * s); const cols = ['#d8453a', '#e8b83a', '#8fbf4a', '#7a3a8a', '#e8803a']; for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row * 1.5; i++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; c.beginPath(); c.arc(cx - (5 - row * 1.5) * 5 * s + i * 10 * s, (76 - row * 8) * s, 6 * s, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(cx - (5 - row * 1.5) * 5 * s + i * 10 * s - 2 * s, (74 - row * 8) * s, 2 * s, 0, 7); c.fill(); } c.fillStyle = '#3f7a3c'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(cx - 18 * s + i * 12 * s, 52 * s + (i % 2) * 4 * s, 5 * s, 2.4 * s, 0.4 * (i % 2 ? 1 : -1), 0, 7); c.fill(); } void k; });
  // golden cups, jugs, loaves in the gaps
  [W * 0.36, W * 0.42, W * 0.58, W * 0.64, W * 0.07, W * 0.93].forEach((cx) => { c.fillStyle = '#e2b843'; c.beginPath(); c.moveTo(cx - 6 * s, 56 * s); c.lineTo(cx + 6 * s, 56 * s); c.lineTo(cx + 3 * s, 72 * s); c.lineTo(cx - 3 * s, 72 * s); c.closePath(); c.fill(); c.fillRect(cx - 1 * s, 72 * s, 2 * s, 8 * s); c.fillRect(cx - 5 * s, 80 * s, 10 * s, 3 * s); c.fillStyle = '#fbe08a'; c.fillRect(cx - 4 * s, 57 * s, 2 * s, 9 * s); c.fillStyle = '#7a1f2c'; c.fillRect(cx - 5.4 * s, 56 * s, 10.8 * s, 3 * s); });
  [W * 0.31, W * 0.69].forEach((cx) => { c.fillStyle = '#3a6aa8'; c.beginPath(); c.moveTo(cx - 6 * s, 82 * s); c.lineTo(cx - 8 * s, 56 * s); c.lineTo(cx - 3 * s, 46 * s); c.lineTo(cx + 3 * s, 46 * s); c.lineTo(cx + 8 * s, 56 * s); c.lineTo(cx + 6 * s, 82 * s); c.fill(); c.fillStyle = '#e2b843'; c.fillRect(cx - 7 * s, 58 * s, 14 * s, 3 * s); });
  [W * 0.12, W * 0.88, W * 0.46, W * 0.54].forEach((cx, i) => { c.fillStyle = '#c98a44'; c.beginPath(); c.ellipse(cx, 80 * s, 9 * s, 4 * s, 0, 0, 7); c.fill(); c.fillStyle = '#e2a85c'; c.beginPath(); c.ellipse(cx - s, 78.5 * s, 7 * s, 2.4 * s, 0, 0, 7); c.fill(); void i; });
};
/** THE BANQUET TABLE (chapter 12 scene 14): 4.6 m x 0.9 m, 0.78 high, blue cloth with a gold border and fringe hanging to 0.4 m, food as flat shapes standing on it (roast fowl, two fruit trays, gold cups, a jug each side, bread),
 *  two stands of three candles. pos = the middle of the table's foot; the table lies along x; the food faces +z. */
/** 24/11/2026: `vai` = [cloth, top] colours (default the blue of the banquet; the council table of chương 16 uses green), `ten` = a name for the drawn-food sprite so a second custom table does not share the first one's picture. */
export const BanquetTable: React.FC<{pos: V3; look?: HallLook; f?: number; len?: number; an?: (c: Ctx, W: number, H: number) => void; vai?: [string, string]; ten?: string}> = ({pos, look = HALL.doom, f = 0, len = 4.6, an, vai, ten}) => {
  const VA = vai ?? ['#2a5a9a', '#336aae'], sfx = vai ? `-${VA[0]}` : '';
  const cloth = useMemo(() => tex('hall-banquet-cloth' + sfx, 512, 128, (c, W, H) => { c.fillStyle = VA[0]; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,0.06)'; for (let x = 0; x < W; x += 32) c.fillRect(x, 0, 16, H); c.fillStyle = '#e2b843'; c.fillRect(0, 0, W, H * 0.12); c.fillRect(0, H * 0.2, W, H * 0.03); for (let x = 8; x < W; x += 16) { c.fillStyle = '#e2b843'; c.fillRect(x, H * 0.74, 2, H * 0.26); c.beginPath(); c.arc(x + 1, H * 0.98, 3, 0, 7); c.fill(); } c.fillStyle = '#9a7426'; c.fillRect(0, H * 0.72, W, 3); for (let x = 40; x < W; x += 80) { c.fillStyle = '#e2b843'; c.beginPath(); c.moveTo(x, H * 0.4); c.lineTo(x + 10, H * 0.5); c.lineTo(x, H * 0.6); c.lineTo(x - 10, H * 0.5); c.fill(); } }), []);
  const top = useMemo(() => tex('hall-banquet-top' + sfx, 256, 64, (c, W, H) => { c.fillStyle = VA[1]; c.fillRect(0, 0, W, H); c.fillStyle = '#e2b843'; c.fillRect(0, 0, W, 4); c.fillRect(0, H - 4, W, 4); }), []);
  const mats = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshLambertMaterial(i === 4 ? {map: cloth} : i === 2 ? {map: top} : {color: VA[0]})), [cloth, top]);
  return (
    <group position={pos}>
      <mesh position={[0, 0.39, 0]} castShadow receiveShadow material={mats}><boxGeometry args={[len, 0.78, 0.9]} /></mesh>
      <B p={[0, 0.79, 0]} s={[len + 0.06, 0.03, 0.96]} c={look.goldDark} cast={false} />
      <Sprite name={ten ?? (an ? 'hall-feast-rieng' : 'hall-feast')} art={an ?? paintFeast} px={[1200, 300]} w={len * 0.94} pos={[0, 0.8, 0.06]} shade={0} lit={false} cast={false} />
      {(an ? [-2.0, 2.0] : [-1.5, 1.5]).map((x, i) => <Candelabra key={x} pos={[x, 0.8, 0.0]} h={0.5} f={f} look={look} seed={i + 9} light={i === 0} />)}
    </group>
  );
};
/** the stand of the world globe (chapter 11 scenes 1, 13): a wooden tripod with brass feet and a cup, a stem, a brass half-ring behind the globe's disc and two pivot pins; pos = the globe's centre (the disc is drawn by DiaCau), the stand reaches the floor */
export const GiaDiaCau: React.FC<{pos: V3; r?: number}> = ({pos, r = 0.42}) => {
  const y0 = pos[1], wood = '#7a5230', brass = '#c9a02c', ring = r + 0.05, collar = -(y0 - 0.66);
  const bar = (a: V3, b: V3, w: number, c: string, key: string) => { const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return <mesh key={key} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q} castShadow><boxGeometry args={[w, d.length(), w]} /><meshLambertMaterial color={c} /></mesh>; };
  return (
    <group position={pos}>
      {[0, 1, 2].map((i) => { const a = (i / 3) * 6.2832 + 0.52, fx = Math.cos(a) * 0.5, fz = Math.sin(a) * 0.4 - 0.05; return <group key={i}>{bar([0, collar, -0.04], [fx, -y0 + 0.03, fz], 0.07, wood, `l${i}`)}<B p={[fx, -y0 + 0.03, fz]} s={[0.11, 0.07, 0.11]} c={brass} /></group>; })}
      <B p={[0, collar, -0.04]} s={[0.22, 0.12, 0.22]} c={brass} /><B p={[0, collar + 0.5 * (-r - 0.1 - collar) + 0.05, -0.04]} s={[0.07, -r - 0.1 - collar, 0.07]} c={wood} />
      {Array.from({length: 18}, (_, i) => { const t = (i / 18) * 6.2832; return <B key={i} p={[Math.cos(t) * ring, Math.sin(t) * ring, -0.07]} s={[0.075, 0.075, 0.035]} c={brass} r={[0, 0, t]} cast={false} />; })}
      <B p={[0, ring + 0.05, -0.07]} s={[0.06, 0.1, 0.06]} c={brass} /><B p={[0, -ring - 0.04, -0.07]} s={[0.12, 0.08, 0.1]} c={brass} />
    </group>
  );
};
/** crumpled paper and blueprints thrown onto the steps (chapter 11 scenes 30-32): irregular pale lumps and a few crumpled blue sheets, lying on the three steps and below them */
export const PaperScraps: React.FC<{n?: number; seed?: number}> = ({n = 24, seed = 4}) => {
  const bits = useMemo(() => { const R = rnd(seed); return Array.from({length: n}, (_, i) => { const k = Math.floor(R() * 4); const z = -8.2 - R() * 1.6, step = z < -9.4 ? 2 : z < -9.0 ? 1 : z < -8.6 ? 0 : -1, y = step < 0 ? 0 : DAIS.rise * (step + 1); return {x: (R() - 0.5) * 3.2, z: step < 0 ? -7.2 - R() * 1.0 : z, y: y + 0.08 + R() * 0.03, s: 0.16 + R() * 0.16, ry: R() * 6, rx: R() * 1.2, col: i % 4 === 0 ? '#c9d6e4' : ['#f0ead8', '#e6dfc9', '#f6f1e2'][i % 3], i, k}; }); }, [n, seed]);
  return <>{bits.map((b) => <group key={b.i} position={[b.x, b.y, b.z]} rotation={[b.rx, b.ry, 0]}><B p={[0, 0, 0]} s={[b.s, b.s * 0.7, b.s * 0.85]} c={b.col} /><B p={[b.s * 0.3, b.s * 0.25, 0]} s={[b.s * 0.7, b.s * 0.5, b.s * 0.6]} c={b.col} r={[0.5, 0.7, 0.3]} /><B p={[-b.s * 0.2, b.s * 0.3, b.s * 0.2]} s={[b.s * 0.5, b.s * 0.4, b.s * 0.5]} c="#ffffff" r={[0.2, 1.1, 0.6]} cast={false} /></group>)}</>;
};
/** a pennant hoisted on a rope beside a column (chapter 11 scene 1): `k` 0..1 = how high it is (from 1.3 to 5.6 m); the rope runs from a pulley at the top down to `hand` (where a robot holds it) */
export const ColumnFlag: React.FC<{x: number; z: number; k: number; hand: V3; look?: HallLook; f?: number}> = ({x, z, k, hand, look = HALL.doom, f = 0}) => {
  const y = 1.3 + k * 4.3, top: V3 = [x, 6.3, z];
  const flagMap = useMemo(() => tex('hall-hoist-flag', 128, 80, (c, W, H) => { c.fillStyle = look.cloth; c.fillRect(0, 0, W, H); c.fillStyle = look.gold; c.fillRect(0, 0, W, 8); c.fillRect(0, H - 8, W, 8); c.beginPath(); c.moveTo(W * 0.5, H * 0.2); c.lineTo(W * 0.64, H * 0.5); c.lineTo(W * 0.5, H * 0.8); c.lineTo(W * 0.36, H * 0.5); c.closePath(); c.fill(); }), [look.cloth]);
  const rope = (a: V3, b: V3, key: string) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize()); return <mesh key={key} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} quaternion={q}><cylinderGeometry args={[0.01, 0.01, len, 4]} /><meshBasicMaterial color="#c9b890" /></mesh>; };
  return (
    <group>
      <B p={[x, 6.3, z]} s={[0.12, 0.12, 0.12]} c="#2a2826" />
      {rope(top, [x, y + 0.5, z], 'a')}{rope([x, y - 0.3, z], hand, 'b')}
      <group position={[x, y, z]}><B p={[0, 0.25, 0]} s={[0.03, 0.7, 0.03]} c="#3a2a1e" /><mesh position={[0.34, 0.18, 0.02]} rotation={[0, Math.sin(f * 0.12) * 0.15, 0]}><planeGeometry args={[0.68, 0.43]} /><meshLambertMaterial map={flagMap} side={THREE.DoubleSide} /></mesh></group>
    </group>
  );
};
/** the pillar of white light that seizes a figure (chapter 13 scene 6): a wide column from the vault to the floor on `x`, `z`, strength k 0..1, with specks streaming upward (f) and a pool of light at its foot */
export const LightColumn: React.FC<{x: number; z: number; y0?: number; k: number; f?: number; r?: number}> = ({x, z, y0 = 0, k, f = 0, r = 0.95}) => {
  const map = useMemo(() => tex('hall-column-light', 64, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.2, 'rgba(255,255,255,0.8)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(0.8, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }), []);
  if (k <= 0.001) return null;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (9 + y0) / 2, 0]} renderOrder={5}><planeGeometry args={[r * 2, 9 - y0]} /><meshBasicMaterial map={map} color="#f4f0ff" transparent opacity={0.7 * k} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <mesh position={[0, (9 + y0) / 2, 0.02]} rotation={[0, Math.PI / 2, 0]} renderOrder={5}><planeGeometry args={[r * 2, 9 - y0]} /><meshBasicMaterial map={map} color="#e6dcff" transparent opacity={0.4 * k} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <mesh position={[0, y0 + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}><circleGeometry args={[r * 1.7, 12]} /><meshBasicMaterial color="#f4f0ff" transparent opacity={0.6 * k} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
      <Halo pos={[0, y0 + 1.2, 0.3]} r={3.6} color="#f4f0ff" strength={0.45 * k} />
      {Array.from({length: 26}, (_, i) => { const R = rnd(i * 7 + 3), t = ((f * 0.022 * (0.6 + R()) + R() * 3) % 1), px = (R() - 0.5) * r * 1.6; return <mesh key={i} position={[px, y0 + 0.2 + t * 6.8, 0.1]} renderOrder={6}><circleGeometry args={[0.025 + R() * 0.02, 6]} /><meshBasicMaterial color="#fff" transparent opacity={k * Math.sin(Math.PI * t)} depthWrite={false} toneMapped={false} /></mesh>; })}
      <pointLight position={[0, y0 + 2.4, 1.2]} color="#e8e0ff" intensity={14 * k} distance={10} decay={1.4} />
    </group>
  );
};
