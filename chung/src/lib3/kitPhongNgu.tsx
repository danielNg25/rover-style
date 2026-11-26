import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {FacetLathe, Halo} from './look';
import {rnd, Ctx} from './depth';
import {B, Flame} from './kit';
import {tex} from './kitLab';
import {Timber} from './kitForge';
import {HALL, HallLook} from './kitSanhNgai';
import {GlassVial} from './kitLeuThayLang';

/** lib3/kitPhongNgu: THE BARONESS'S BEDCHAMBER in the Baron's castle at night (first used by src/demo/PhongNguNamTuoc.tsx,
 *  chapters 3 and 4 of "Lịch sử Doctor Doom"). Same castle as the throne hall (src/lib3/kitSanhNgai.tsx, state 'namTuoc'): the
 *  cloth is the Baron's dark red with his plain gold diamond, the stone is HALL_STONE. Metres, y up; a thing that hangs on a wall
 *  lies in its own x-y plane facing +z. Every piece takes a HallLook (default HALL.namTuoc), so another lord's room is a palette. */
type V3 = [number, number, number];
const NT = HALL.namTuoc;
const shade = (hex: string, k: number) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const diamond = (c: Ctx, x: number, y: number, w: number, h: number) => { c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w, y); c.lineTo(x, y + h); c.lineTo(x - w, y); c.closePath(); };

// ---------------------------------------------------------------- velvet
/** Red velvet embroidered with the Baron's gold diamonds (the curtains of the bed, its valance, the back cloth, the tapestry):
 *  a deep pile with a sheen, a lattice of thin gold couched lines, a gold diamond with a dark heart in every other cell, a gold
 *  border band with a running stitch along the edges named in `border` ('l', 'r', 'b', 't'), worn paler where hands touch.
 *  Wm x Hm = size of the cloth in metres (the pattern keeps its size whatever the canvas). */
export const paintVelvet = (Wm: number, Hm: number, look: HallLook = NT, seed = 1, border = 'b') => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm;
  c.fillStyle = look.cloth; c.fillRect(0, 0, W, H);
  // pile: short strokes, darker and lighter, and soft blotches of sheen
  for (let k = 0; k < W * H / 50; k++) { c.fillStyle = r() < 0.55 ? 'rgba(20,0,0,0.12)' : 'rgba(255,200,190,0.05)'; c.fillRect(r() * W, r() * H, 1 + r() * 2, 2 + r() * 3); }
  for (let k = 0; k < 10; k++) { const x = r() * W, y = r() * H, q = (0.2 + r() * 0.4) * ppm, g = c.createRadialGradient(x, y, 0, x, y, q); g.addColorStop(0, r() < 0.5 ? 'rgba(255,170,150,0.10)' : 'rgba(30,0,0,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - q, y - q, q * 2, q * 2); }
  // the lattice: gold couched lines on the diagonals, a diamond in every other cell
  const cw = 0.34 * ppm, ch = 0.46 * ppm;
  c.strokeStyle = look.goldDark; c.lineWidth = Math.max(1, 0.008 * ppm); c.globalAlpha = 0.75;
  for (let x = -H; x < W + H; x += cw) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + H * cw / ch, H); c.stroke(); c.beginPath(); c.moveTo(x, 0); c.lineTo(x - H * cw / ch, H); c.stroke(); }
  c.globalAlpha = 1;
  for (let j = 0, y = ch / 2; y < H + ch; y += ch / 2, j++) for (let x = (j % 2 ? 0 : cw / 2); x < W + cw; x += cw) {
    if ((Math.round(x / cw) + j) % 2) continue;
    c.fillStyle = look.gold; diamond(c, x, y, cw * 0.17, ch * 0.2); c.fill();
    c.fillStyle = 'rgba(255,250,220,0.35)'; c.beginPath(); c.moveTo(x, y - ch * 0.2); c.lineTo(x + cw * 0.17, y); c.lineTo(x, y); c.closePath(); c.fill();
    c.fillStyle = look.clothDark; diamond(c, x, y, cw * 0.06, ch * 0.07); c.fill();
  }
  // border bands with a running stitch
  const bw = 0.07 * ppm, band = (x: number, y: number, w: number, h: number) => { c.fillStyle = look.gold; c.fillRect(x, y, w, h); c.strokeStyle = look.goldDark; c.lineWidth = Math.max(1, 0.006 * ppm); c.setLineDash([0.02 * ppm, 0.015 * ppm]); c.strokeRect(x + bw * 0.25, y + bw * 0.25, Math.max(1, w - bw * 0.5), Math.max(1, h - bw * 0.5)); c.setLineDash([]); };
  if (border.includes('b')) band(0, H - bw * 1.2, W, bw);
  if (border.includes('t')) band(0, bw * 0.2, W, bw);
  if (border.includes('l')) band(bw * 0.2, 0, bw, H);
  if (border.includes('r')) band(W - bw * 1.2, 0, bw, H);
  // wear: the pile rubbed paler at hand height on one side, a darker damp hem
  const g = c.createLinearGradient(0, H, 0, H - 0.4 * ppm); g.addColorStop(0, 'rgba(10,0,0,0.3)'); g.addColorStop(1, 'rgba(10,0,0,0)'); c.fillStyle = g; c.fillRect(0, H - 0.4 * ppm, W, 0.4 * ppm);
  const wx = W * (0.2 + r() * 0.6), wy = H * 0.55, wq = 0.25 * ppm, wg = c.createRadialGradient(wx, wy, 0, wx, wy, wq); wg.addColorStop(0, 'rgba(255,200,180,0.12)'); wg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = wg; c.fillRect(wx - wq, wy - wq, wq * 2, wq * 2);
};
const velvetMat = (key: string, Wm: number, Hm: number, look: HallLook, seed: number, border: string, glow = 0) => {
  const map = tex(`pn-velvet-${key}-${look.cloth}`, Math.round(Math.min(1400, Wm * 420)), Math.round(Math.min(2400, Hm * 420)), paintVelvet(Wm, Hm, look, seed, border));
  return new THREE.MeshPhongMaterial({map, shininess: 14, specular: new THREE.Color('#3a1a18'), side: THREE.DoubleSide, emissiveMap: glow ? map : null, emissive: new THREE.Color(glow ? '#ffc48a' : '#000000'), emissiveIntensity: glow});
};

/** A curtain of the bed. Closed (gather 1): a flat panel w wide hanging from y 0 down to -h, soft folds. Gathered (gather 0):
 *  the same cloth drawn to its `anchor` side ('l' or 'r' = the edge at the post), tied at tieY (from the top, negative) with a
 *  gold cord: narrow at the tie, a little wider above and below, deep folds. Origin = the top middle of the closed panel; a
 *  gathered panel bunches towards its anchor edge. */
const drapeGeo = (w: number, h: number, gather: number, anchor: 'l' | 'r', tieY: number, folds: number, seed: number) => {
  const r = rnd(seed), g = new THREE.PlaneGeometry(w, h, 40, 24), p = g.attributes.position as THREE.BufferAttribute, ph = r() * 6, side = anchor === 'l' ? -1 : 1, ax = side * w / 2;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i) - h / 2, u = Math.abs(x - ax) / w;   // u: 0 at the anchor edge, 1 at the free edge
    // width of the bunch at this height (closed: w); the tie pinches it, the hem flares
    const t = (y - tieY) / Math.max(0.01, y > tieY ? -tieY : h + tieY), shape = y > tieY ? 0.3 + 0.12 * t : 0.18 + 0.2 * Math.pow(Math.abs(t), 0.8), bw = w * (gather + (1 - gather) * shape);
    const nx = ax - side * u * bw, amp = (0.025 + (1 - gather) * 0.05) * (y > tieY ? 1 : 1.1);
    const z = amp * Math.sin(u * folds * Math.PI * 2 + ph + y * 0.3) + (1 - gather) * 0.04 * Math.sin(u * Math.PI);
    p.setXYZ(i, nx, y, z);
  }
  g.computeVertexNormals(); return g;
};
export const BedCurtain: React.FC<{pos: V3; rotY?: number; w: number; h: number; gather?: number; anchor?: 'l' | 'r'; tieY?: number; look?: HallLook; seed?: number; glow?: number; id: string}> =
  ({pos, rotY = 0, w, h, gather = 1, anchor = 'l', tieY = -1.4, look = NT, seed = 1, glow = 0, id}) => {
    const geo = useMemo(() => drapeGeo(w, h, gather, anchor, tieY, gather > 0.5 ? Math.max(3, Math.round(w * 4)) : 6, seed), [w, h, gather, anchor, tieY, seed]);
    const mat = useMemo(() => velvetMat(id, w, h, look, seed, anchor === 'l' ? 'br' : 'bl', glow), [id, w, h, look, seed, glow]);
    const side = anchor === 'l' ? -1 : 1, tx = side * w / 2 - side * w * (0.18 + 0.02);
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <mesh geometry={geo} material={mat} castShadow receiveShadow />
        {gather < 0.5 ? <group position={[tx, tieY, 0.07]}>
          {/* the tie: a gold cord wound twice, a tassel hanging from the knot */}
          <B p={[0, 0.02, 0]} s={[w * 0.24, 0.03, 0.05]} c={look.gold} />
          <B p={[0, -0.03, 0]} s={[w * 0.22, 0.025, 0.05]} c={look.goldDark} />
          <B p={[-side * w * 0.04, -0.1, 0.02]} s={[0.012, 0.14, 0.012]} c={look.gold} cast={false} />
          <FacetLathe pos={[-side * w * 0.04, -0.32, 0.02]} profile={[[0.004, 0.18], [0.025, 0.14], [0.03, 0.04], [0.04, 0]]} sides={8} color={look.gold} contact={false} cast={false} tones={[1.1, 1, 0.8]} />
        </group> : null}
      </group>
    );
  };

/** A valance (pelmet) of velvet round the top of the bed: scalloped foot, a gold braid above the scallops and a gold fringe
 *  hanging from them. Canvas transparent below the fringe. */
export const paintValance = (Wm: number, look: HallLook = NT, seed = 1) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, sc = 0.27 * ppm, body = H * 0.62, dip = H * 0.16, fr = H * 0.2;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, body);
  for (let x = W; x > 0; x -= sc) c.quadraticCurveTo(x - sc / 2, body + dip * 2, x - sc, body);
  c.closePath(); c.save(); c.clip();
  c.fillStyle = look.cloth; c.fillRect(0, 0, W, H);
  for (let k = 0; k < W * H / 60; k++) { c.fillStyle = r() < 0.55 ? 'rgba(20,0,0,0.12)' : 'rgba(255,200,190,0.05)'; c.fillRect(r() * W, r() * H, 1 + r() * 2, 2 + r() * 3); }
  // gold braid top and above the scallops, a diamond on each scallop
  c.fillStyle = look.gold; c.fillRect(0, H * 0.04, W, H * 0.07); c.fillRect(0, body - H * 0.14, W, H * 0.05);
  c.fillStyle = look.goldDark; for (let x = 0; x < W; x += 0.04 * ppm) { c.fillRect(x, H * 0.06, 0.015 * ppm, H * 0.03); c.fillRect(x + 0.02 * ppm, body - H * 0.13, 0.015 * ppm, H * 0.03); }
  for (let x = W - sc / 2; x > 0; x -= sc) { c.fillStyle = look.gold; diamond(c, x, body - H * 0.32, sc * 0.16, H * 0.13); c.fill(); c.fillStyle = look.clothDark; diamond(c, x, body - H * 0.32, sc * 0.06, H * 0.05); c.fill(); }
  for (let k = 0; k < 4; k++) { const x = W * (0.1 + k * 0.27 + (r() - 0.5) * 0.05), g = c.createLinearGradient(x - W * 0.05, 0, x + W * 0.05, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - W * 0.05, 0, W * 0.1, H); }
  c.restore();
  // fringe: gold threads hanging from the scallop edge
  for (let x = 0; x < W; x += 0.012 * ppm) { const k = (x % sc) / sc, y0 = body + dip * 2 * (1 - Math.pow(2 * k - 1, 2)) * 0.5; c.strokeStyle = r() < 0.7 ? look.gold : look.goldDark; c.lineWidth = Math.max(1, 0.006 * ppm); c.beginPath(); c.moveTo(x, y0 - 2); c.lineTo(x + (r() - 0.5) * 3, y0 + fr * (0.8 + r() * 0.4)); c.stroke(); }
};
const Valance: React.FC<{p: V3; w: number; h: number; rotY?: number; look: HallLook; seed: number}> = ({p, w, h, rotY = 0, look, seed}) => {
  const map = useMemo(() => tex(`pn-valance-${w.toFixed(2)}-${look.cloth}-${seed}`, Math.round(w * 400), Math.round(h * 400), paintValance(w, look, seed)), [w, h, look, seed]);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(w, h, 24, 1), q = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < q.count; i++) q.setZ(i, 0.025 * Math.sin((q.getX(i) / w) * Math.PI * w * 3.7)); g.computeVertexNormals(); return g; }, [w, h]);
  return <mesh position={p} rotation={[0, rotY, 0]} geometry={geo} castShadow receiveShadow><meshPhongMaterial map={map} transparent alphaTest={0.4} shininess={12} specular="#3a1a18" side={THREE.DoubleSide} /></mesh>;
};

// ---------------------------------------------------------------- the bed linen
/** The coverlet seen from the foot of the bed: ivory damask with a lattice of pale gold diamonds, a broad border of the Baron's red
 *  embroidered with gold near the edges, and at the head (canvas top) the turned-down linen sheet with a lace edge. Creases run
 *  along its length. Wm across, Lm along (canvas y = from the head down to the foot). */
export const paintCoverlet = (Wm: number, Lm: number, look: HallLook = NT, seed = 3) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, sheet = 0.2 * ppm;
  c.fillStyle = '#d8ccb0'; c.fillRect(0, 0, W, H);
  // damask: a lattice of slightly darker diamonds with a pale gold seed in each
  const cw = 0.2 * ppm, ch = 0.26 * ppm;
  for (let j = 0, y = 0; y < H + ch; y += ch / 2, j++) for (let x = (j % 2 ? 0 : cw / 2); x < W + cw; x += cw) {
    c.strokeStyle = 'rgba(150,120,70,0.35)'; c.lineWidth = Math.max(1, 0.004 * ppm); diamond(c, x, y, cw * 0.42, ch * 0.42); c.stroke();
    c.fillStyle = 'rgba(190,150,70,0.45)'; diamond(c, x, y, cw * 0.08, ch * 0.08); c.fill();
  }
  // the red border with gold embroidery, a hand's width in from both long edges and the foot
  const bx = 0.12 * ppm, bw = 0.1 * ppm;
  const band = (x: number, y: number, w: number, h: number) => { c.fillStyle = look.cloth; c.fillRect(x, y, w, h); c.strokeStyle = look.gold; c.lineWidth = Math.max(1, 0.008 * ppm); c.strokeRect(x + 2, y + 2, w - 4, h - 4);
    const vert = h > w, n = Math.floor((vert ? h : w) / (0.09 * ppm)); for (let k = 0; k < n; k++) { const cx = vert ? x + w / 2 : x + (k + 0.5) * w / n, cy = vert ? y + (k + 0.5) * h / n : y + h / 2; c.fillStyle = look.gold; diamond(c, cx, cy, (vert ? w : h) * 0.22, (vert ? w : h) * 0.3); c.fill(); } };
  band(bx, sheet + 0.06 * ppm, bw, H - sheet - 0.06 * ppm - bx); band(W - bx - bw, sheet + 0.06 * ppm, bw, H - sheet - 0.06 * ppm - bx); band(bx, H - bx - bw, W - bx * 2, bw);
  // creases along the length, a soft hollow down each side of the body
  for (let k = 0; k < 9; k++) { const x = W * (0.05 + r() * 0.9), g = c.createLinearGradient(x - 0.04 * ppm, 0, x + 0.04 * ppm, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(70,50,30,${0.1 + r() * 0.12})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 0.04 * ppm, sheet, 0.08 * ppm, H - sheet); }
  // the turned-down sheet: white linen, a lace edge and a line of red drawn-thread work
  c.fillStyle = '#f2eee4'; c.fillRect(0, 0, W, sheet);
  c.fillStyle = 'rgba(120,110,95,0.25)'; c.fillRect(0, sheet - 0.012 * ppm, W, 0.012 * ppm);
  c.strokeStyle = look.clothLight; c.lineWidth = Math.max(1, 0.005 * ppm); c.setLineDash([0.012 * ppm, 0.008 * ppm]); c.beginPath(); c.moveTo(0, sheet * 0.55); c.lineTo(W, sheet * 0.55); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#faf7ef'; for (let x = 0; x < W; x += 0.035 * ppm) { c.beginPath(); c.arc(x + 0.017 * ppm, sheet, 0.016 * ppm, 0, Math.PI); c.fill(); }
  c.fillStyle = 'rgba(140,130,110,0.5)'; for (let x = 0; x < W; x += 0.035 * ppm) { c.beginPath(); c.arc(x + 0.017 * ppm, sheet + 0.006 * ppm, 0.004 * ppm, 0, 7); c.fill(); }
  for (let k = 0; k < 5; k++) { const x = r() * W; c.fillStyle = 'rgba(90,80,70,0.12)'; c.fillRect(x, 0, 0.03 * ppm, sheet * 0.9); }
};
/** The pillows, painted flat (soft things are flat: skill 2), with the sleeper's long hair spread on them: two big square pillows
 *  of white linen with red and gold embroidered borders and a gold diamond, a long bolster across in front, lace edges, soft
 *  creases; the hair falls from round the head (hx, hy, hr = where the head is, as shares of the canvas) down both sides and
 *  over the bolster in long wavy locks. hair = null: no one in the bed. */
export const paintPillows = (Wm: number, Hm: number, hair: string | null, look: HallLook = NT, hx = 0.5, hy = 0.36, hr = 0.15, seed = 5) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm;
  const pillow = (x: number, y: number, w: number, h: number, base: string, emb: boolean) => {
    const rr = Math.min(w, h) * 0.22;
    c.save(); c.beginPath(); c.moveTo(x + rr, y); c.quadraticCurveTo(x + w / 2, y + h * 0.06, x + w - rr, y); c.quadraticCurveTo(x + w, y, x + w, y + rr); c.quadraticCurveTo(x + w - w * 0.03, y + h / 2, x + w, y + h - rr); c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h); c.quadraticCurveTo(x + w / 2, y + h - h * 0.05, x + rr, y + h); c.quadraticCurveTo(x, y + h, x, y + h - rr); c.quadraticCurveTo(x + w * 0.03, y + h / 2, x, y + rr); c.quadraticCurveTo(x, y, x + rr, y); c.closePath();
    c.fillStyle = base; c.fill(); c.clip();
    const g = c.createRadialGradient(x + w * 0.4, y + h * 0.35, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(0.7, 'rgba(120,110,100,0.05)'); g.addColorStop(1, 'rgba(70,60,55,0.35)'); c.fillStyle = g; c.fillRect(x, y, w, h);
    for (let k = 0; k < 5; k++) { c.strokeStyle = 'rgba(110,100,90,0.25)'; c.lineWidth = Math.max(1, 0.006 * ppm); c.beginPath(); const sx = x + w * (0.1 + r() * 0.8), sy = y + h * (0.1 + r() * 0.8); c.moveTo(sx, sy); c.quadraticCurveTo(sx + (r() - 0.5) * w * 0.3, sy + (r() - 0.5) * h * 0.3, sx + (r() - 0.5) * w * 0.4, sy + (r() - 0.5) * h * 0.4); c.stroke(); }
    if (emb) { const m = Math.min(w, h) * 0.1; c.strokeStyle = look.cloth; c.lineWidth = Math.max(2, 0.014 * ppm); c.strokeRect(x + m, y + m, w - m * 2, h - m * 2); c.strokeStyle = look.gold; c.lineWidth = Math.max(1, 0.005 * ppm); c.strokeRect(x + m * 1.35, y + m * 1.35, w - m * 2.7, h - m * 2.7);
      c.fillStyle = look.gold; diamond(c, x + w / 2, y + h / 2, w * 0.07, h * 0.1); c.fill(); c.fillStyle = look.cloth; diamond(c, x + w / 2, y + h / 2, w * 0.03, h * 0.045); c.fill(); }
    c.restore();
    // lace round the edge
    c.fillStyle = 'rgba(250,247,238,0.9)'; for (let t = 0; t < 1; t += 0.03) { c.beginPath(); c.arc(x + w * t, y - 2, 0.01 * ppm, 0, 7); c.fill(); }
  };
  pillow(W * 0.02, H * 0.02, W * 0.5, H * 0.52, '#d6d2c8', true);
  pillow(W * 0.48, H * 0.04, W * 0.5, H * 0.5, '#d0ccc2', true);
  pillow(W * 0.0, H * 0.42, W * 1.0, H * 0.4, '#dad4c8', false);
  // a red bolster cover end with a gold tassel at each end
  for (const x of [W * 0.03, W * 0.97]) { c.fillStyle = look.cloth; c.beginPath(); c.ellipse(x, H * 0.62, W * 0.025, H * 0.16, 0, 0, 7); c.fill(); c.fillStyle = look.gold; c.fillRect(x - 2, H * 0.74, 4, H * 0.08); }
  if (hair) {
    const cx = W * hx, cy = H * hy, R = W * hr, dark = shade(hair, 0.62), light = shade(hair, 1.22);
    // a soft shadow of the head pressed into the pillow
    const sg = c.createRadialGradient(cx, cy + R * 0.2, R * 0.3, cx, cy + R * 0.2, R * 1.5); sg.addColorStop(0, 'rgba(60,50,45,0.35)'); sg.addColorStop(1, 'rgba(60,50,45,0)'); c.fillStyle = sg; c.fillRect(cx - R * 1.6, cy - R * 1.4, R * 3.2, R * 3.2);
    // the mass of hair round the head, then locks falling down both sides to the foot of the canvas (hidden there by the covers)
    c.fillStyle = dark; c.beginPath(); c.ellipse(cx, cy + R * 0.25, R * 1.32, R * 1.25, 0, 0, 7); c.fill();
    for (const s of [-1, 1]) for (let k = 0; k < 9; k++) {
      const x0 = cx + s * R * (0.75 + r() * 0.4), y0 = cy - R * (0.2 - r() * 0.6), x1 = cx + s * R * (1.2 + r() * 1.1), y1 = H * (0.82 + r() * 0.2), wdt = R * (0.22 + r() * 0.18);
      c.fillStyle = k % 3 === 0 ? dark : hair; c.beginPath(); c.moveTo(x0 - wdt * 0.5, y0); c.bezierCurveTo(x0 + s * R * 0.7, y0 + (y1 - y0) * 0.3, x1 - s * R * 0.6, y1 - (y1 - y0) * 0.35, x1, y1); c.bezierCurveTo(x1 - s * wdt * 0.6, y1 - (y1 - y0) * 0.3, x0 + s * R * 0.3 + wdt, y0 + (y1 - y0) * 0.3, x0 + wdt * 0.5, y0); c.closePath(); c.fill();
    }
    // strands: light and dark lines along the locks, a gloss band
    for (let k = 0; k < 90; k++) { const s = r() < 0.5 ? -1 : 1, x0 = cx + s * R * (0.6 + r() * 0.5), y0 = cy - R * (0.3 - r() * 0.8), x1 = cx + s * R * (1.1 + r() * 1.3), y1 = H * (0.75 + r() * 0.3);
      c.strokeStyle = r() < 0.45 ? light : r() < 0.6 ? dark : hair; c.lineWidth = Math.max(1, (0.003 + r() * 0.004) * ppm); c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + s * R * 0.6, y0 + (y1 - y0) * 0.35, x1 - s * R * 0.5, y1 - (y1 - y0) * 0.3, x1, y1); c.stroke(); }
    c.strokeStyle = 'rgba(255,240,200,0.35)'; c.lineWidth = R * 0.12; c.beginPath(); c.arc(cx, cy + R * 0.1, R * 1.15, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  }
};

// ---------------------------------------------------------------- the bed
/** Measures of the bed (world, as placed by the bedchamber): x0..x1 across, z0 (head, at the wall) .. z1 (foot), the mattress,
 *  the covers sloping from the foot up to the sleeper's chin, the posts and the tester. */
export const BED = {x0: -1.42, x1: 0.22, z0: -6.9, z1: -4.8, post: 0.12, top: 2.6, mattress: 0.58, footCover: 0.66, chin: 0.9, chinZ: -6.42, head: 1.82, pillowZ: -6.78};
/** state: 'open' = curtains drawn back (the foot curtain to the left foot post, the side curtains to the head posts), 'closed' =
 *  all drawn, lit through from inside (glow); sleeper = her hair spread on the pillows (null: an empty bed). The bed lamp hangs
 *  from the tester at the head, left of the pillows (lamp.pos). inner = how much the drawn curtains glow from inside (1 at night;
 *  less by day, when the sun lights them from outside). */
export const BED_LAMP: V3 = [-1.27, 1.42, -6.66];
export const FOOT_CURTAIN = {x0: BED.x0 - 0.06, x1: BED.x1 + 0.06, z: BED.z1 + 0.13, y0: 0.0, y1: 2.3};
const postProfile = (h: number): [number, number][] => [[0.07, 0], [0.07, 0.5], [0.05, 0.54], [0.085, 0.7], [0.1, 0.86], [0.085, 1.0], [0.05, 1.06], [0.045, 1.5], [0.06, 1.54], [0.045, 1.58], [0.04, h - 0.25], [0.06, h - 0.2], [0.06, h], [0.07, h + 0.02], [0.05, h + 0.06], [0.06, h + 0.14], [0.03, h + 0.24], [0.004, h + 0.32]];
export const CanopyBed: React.FC<{look?: HallLook; state?: 'open' | 'closed'; sleeper?: string | null; f?: number; lamp?: boolean; inner?: number}> = ({look = NT, state = 'open', sleeper = '#d8b25c', f = 0, lamp = true, inner = 1}) => {
  const {x0, x1, z0, z1, top} = BED, W = x1 - x0, L = z1 - z0, cx = (x0 + x1) / 2, closed = state === 'closed';
  const coverMap = useMemo(() => tex(`pn-cover-${look.cloth}`, 1300, Math.round(1300 * (z1 - BED.chinZ + 0.1) / (W + 0.06)), paintCoverlet(W + 0.06, z1 - BED.chinZ + 0.1, look)), [look]);
  const pillowMap = useMemo(() => tex(`pn-pillows-${sleeper ?? 'none'}`, 1400, 760, paintPillows(W + 0.04, 0.88, sleeper, look, (-0.6 - x0 + 0.02) / (W + 0.04), 0.3, 0.13)), [sleeper, look]);
  // the covers: a sloped surface from the foot (low) up to the chin line, a long mound where the body lies, creases
  const coverGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W + 0.06, z1 - BED.chinZ + 0.1, 30, 30), p = g.attributes.position as THREE.BufferAttribute, len = z1 - BED.chinZ + 0.1;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), v = p.getY(i) / len + 0.5;   // v: 0 at the foot, 1 at the chin
      const body = Math.exp(-Math.pow((x - (-0.6 - cx)) / 0.32, 2)) * (0.05 + 0.04 * Math.sin(v * Math.PI)), crease = 0.008 * Math.sin(x * 23 + v * 3) + 0.006 * Math.sin(x * 41);
      p.setXYZ(i, x, BED.footCover + (BED.chin - BED.footCover) * v + body + crease, -(v * len) + 0.0); }
    g.computeVertexNormals(); return g;
  }, []);
  const drape = (w: number, h: number, seed: number) => { const g = new THREE.PlaneGeometry(w, h, 30, 6), p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = (h / 2 - y) / h; p.setZ(i, 0.03 * k * Math.sin(p.getX(i) * 9 + seed) + 0.012 * Math.sin(p.getX(i) * 23)); } g.computeVertexNormals(); return g; };
  const drapeMat = useMemo(() => new THREE.MeshLambertMaterial({map: tex(`pn-drape-${look.cloth}`, 600, 200, (c, Wc, Hc) => { c.fillStyle = '#e0d5bc'; c.fillRect(0, 0, Wc, Hc); c.fillStyle = look.cloth; c.fillRect(0, Hc * 0.62, Wc, Hc * 0.24); c.fillStyle = look.gold; c.fillRect(0, Hc * 0.64, Wc, Hc * 0.03); c.fillRect(0, Hc * 0.81, Wc, Hc * 0.03); for (let x = 10; x < Wc; x += 26) { diamond(c, x, Hc * 0.74, 7, 9); c.fill(); } c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, Hc * 0.9, Wc, Hc * 0.1); }), side: THREE.DoubleSide}), [look]);
  const coverMat = useMemo(() => new THREE.MeshLambertMaterial({map: coverMap, side: THREE.DoubleSide}), [coverMap]);
  const posts: [number, number][] = [[x0 - 0.04, z0 + 0.02], [x1 + 0.04, z0 + 0.02], [x0 - 0.04, z1], [x1 + 0.04, z1]];
  const cH = top - 0.3;   // curtains hang from under the valance
  const sideDrapes = useMemo(() => [drape(L, 0.6, 0), drape(L, 0.6, 1)], []), footDrape = useMemo(() => drape(W + 0.06, 0.58, 3), []);
  const backMat = useMemo(() => velvetMat('back', W, top - BED.head, look, 11, ''), [look]);
  const crestShape = useMemo(() => { const s = new THREE.Shape(), w = W + 0.2; s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, 0.12); s.quadraticCurveTo(w * 0.22, 0.14, 0.16, 0.3); s.quadraticCurveTo(0.06, 0.44, 0, 0.5); s.quadraticCurveTo(-0.06, 0.44, -0.16, 0.3); s.quadraticCurveTo(-w * 0.22, 0.14, -w / 2, 0.12); s.closePath(); return s; }, []);
  return (
    <group>
      {/* frame: four turned posts with gold rings on square feet; side rails and a foot board under the drapes */}
      {posts.map(([x, z], i) => <group key={i} position={[x, 0, z]}>
        <Timber p={[0, 0.25, 0]} s={[0.15, 0.5, 0.15]} seed={i} />
        <FacetLathe pos={[0, 0, 0]} profile={postProfile(top)} sides={10} color="#4a2e1c" contact={false} tones={[0.8, 1, 1.15, 1, 0.85, 1, 0.9, 1.1]} />
        {[0.52, 1.52, top - 0.22].map((y) => <FacetLathe key={y} pos={[0, y, 0]} profile={[[0.062, 0], [0.072, 0.015], [0.072, 0.035], [0.062, 0.05]]} sides={10} color={look.gold} contact={false} cast={false} />)}
        <FacetLathe pos={[0, top + 0.24, 0]} profile={[[0.03, 0], [0.04, 0.04], [0.02, 0.1], [0.004, 0.14]]} sides={8} color={look.gold} contact={false} cast={false} />
      </group>)}
      <Timber p={[cx, 0.32, z1]} s={[W + 0.1, 0.22, 0.07]} seed={5} />
      {[x0, x1].map((x, i) => <Timber key={x} p={[x, 0.32, (z0 + z1) / 2]} s={[0.07, 0.22, L]} seed={6 + i} />)}
      <B p={[cx, 0.47, (z0 + z1) / 2]} s={[W - 0.04, 0.22, L - 0.04]} c="#d8cfba" />
      {/* the headboard: carved dark wood, three arched panels with gold diamonds, a crest; the red back cloth above it */}
      <Timber p={[cx, (BED.mattress + BED.head) / 2, z0 - 0.02]} s={[W + 0.04, BED.head - BED.mattress, 0.07]} seed={9} />
      {[-1, 0, 1].map((k) => <group key={k} position={[cx + k * W * 0.31, 1.2, z0 + 0.03]}>
        <B p={[0, 0, 0]} s={[W * 0.26, 0.85, 0.02]} c="#3a2214" />
        <B p={[0, 0.43, 0]} s={[W * 0.2, 0.05, 0.025]} c="#5a3a24" cast={false} />
        <mesh position={[0, 0.25, 0.015]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.09, 0.09, 0.012]} /><meshLambertMaterial color={look.gold} /></mesh>
      </group>)}
      <B p={[cx, BED.head + 0.03, z0 + 0.01]} s={[W + 0.12, 0.06, 0.12]} c={look.goldDark} />
      <mesh position={[cx, top - 0.25 - (top - 0.25 - BED.head) / 2, z0 - 0.07]} receiveShadow material={backMat}><planeGeometry args={[W, top - 0.25 - BED.head + 0.1]} /></mesh>
      {/* the pillows (flat picture) leaning on the headboard, the sleeper's hair on them */}
      <mesh position={[cx, 0.98, BED.pillowZ]} rotation={[-0.12, 0, 0]} receiveShadow><planeGeometry args={[W + 0.04, 0.88]} /><meshLambertMaterial map={pillowMap} transparent alphaTest={0.3} /></mesh>
      {/* the covers, their drapes down the sides and the foot */}
      <mesh geometry={coverGeo} material={coverMat} position={[cx, 0, z1 + 0.03]} receiveShadow castShadow />
      {[x0 - 0.03, x1 + 0.03].map((x, i) => <mesh key={x} geometry={sideDrapes[i]} material={drapeMat} position={[x, 0.38, (z0 + z1) / 2 + 0.02]} rotation={[0, i ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow castShadow />)}
      <mesh geometry={footDrape} material={drapeMat} position={[cx, 0.38, z1 + 0.04]} receiveShadow castShadow />
      {/* the tester: a wooden frame, a red ceiling cloth, the valance round it; a carved crest with the gold diamond at the head */}
      {[z0 + 0.02, z1].map((z) => <Timber key={z} p={[cx, top - 0.04, z]} s={[W + 0.2, 0.08, 0.08]} seed={3} />)}
      {[x0 - 0.04, x1 + 0.04].map((x) => <Timber key={x} p={[x, top - 0.04, (z0 + z1) / 2]} s={[0.08, 0.08, L + 0.1]} seed={4} />)}
      <B p={[cx, top + 0.01, (z0 + z1) / 2]} s={[W + 0.16, 0.02, L + 0.06]} c={look.clothDark} />
      <Valance p={[cx, top - 0.16, z1 + 0.18]} w={W + 0.26} h={0.4} look={look} seed={1} />
      {[x0 - 0.11, x1 + 0.11].map((x, i) => <Valance key={x} p={[x, top - 0.16, (z0 + z1) / 2]} w={L + 0.14} h={0.4} rotY={i ? Math.PI / 2 : -Math.PI / 2} look={look} seed={2 + i} />)}
      <group position={[cx, top + 0.02, z0 - 0.02]}>
        <mesh castShadow><extrudeGeometry args={[crestShape, {depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1}]} /><meshLambertMaterial color="#3e2616" /></mesh>
        <mesh position={[0, 0.26, 0.08]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.14, 0.14, 0.02]} /><meshLambertMaterial color={look.gold} /></mesh>
        <mesh position={[0, 0.26, 0.092]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.06, 0.06, 0.01]} /><meshLambertMaterial color={look.clothDark} /></mesh>
        <B p={[0, 0.02, 0.08]} s={[W + 0.18, 0.025, 0.02]} c={look.gold} cast={false} />
      </group>
      {/* curtains */}
      {closed ? <>
        <BedCurtain id="foot-l" pos={[cx - W * 0.27, top - 0.28, FOOT_CURTAIN.z]} w={W * 0.56 + 0.1} h={cH} gather={1} anchor="l" look={look} seed={21} glow={0.55 * inner} />
        <BedCurtain id="foot-r" pos={[cx + W * 0.27, top - 0.28, FOOT_CURTAIN.z + 0.025]} w={W * 0.56 + 0.1} h={cH} gather={1} anchor="r" look={look} seed={22} glow={0.55 * inner} />
        {/* the warm line of light where the two halves meet */}
        <mesh position={[cx + 0.01, top / 2 - 0.2, FOOT_CURTAIN.z - 0.04]}><planeGeometry args={[0.05, cH - 0.3]} /><meshBasicMaterial color="#ffcf8a" toneMapped={false} /></mesh>
        <Halo pos={[cx, 1.2, FOOT_CURTAIN.z + 0.06]} r={1.1} color="#ffb870" strength={0.16} order={4} />
        {[x0 - 0.07, x1 + 0.07].map((x, i) => <BedCurtain key={x} id={`side-${i}`} pos={[x, top - 0.28, (z0 + z1) / 2]} rotY={i ? Math.PI / 2 : -Math.PI / 2} w={L} h={cH} gather={1} anchor="l" look={look} seed={23 + i} glow={0.35 * inner} />)}
      </> : <>
        {/* the foot curtain drawn to the LEFT foot post and tied; the side curtains drawn to the head posts */}
        <BedCurtain id="foot-open" pos={[x0 + 0.3, top - 0.28, z1 + 0.09]} w={0.72} h={cH} gather={0} anchor="l" tieY={-1.25} look={look} seed={31} />
        <BedCurtain id="side-open-l" pos={[x0 - 0.1, top - 0.28, z0 + 0.36]} rotY={-Math.PI / 2} w={0.7} h={cH} gather={0} anchor="r" tieY={-1.2} look={look} seed={32} />
        <BedCurtain id="side-open-r" pos={[x1 + 0.1, top - 0.28, z0 + 0.36]} rotY={Math.PI / 2} w={0.7} h={cH} gather={0} anchor="l" tieY={-1.2} look={look} seed={33} />
      </>}
      {/* the bed lamp: a small brass oil lamp on a chain from the tester, left of the pillows */}
      {lamp ? <BedLamp pos={BED_LAMP} f={f} k={closed ? 1.25 : 1} /> : null}
    </group>
  );
};
/** A small brass oil lamp hung on a chain: a font, a glass chimney, a flame and its halo, a warm shadow-casting light. pos = foot
 *  of the lamp; the chain runs straight up to `top` (y). */
/** bui (mặc định true): đèn tự đăng ký nguồn bụi (lib3/buiNguon) tại thân đèn ('nen': đèn dầu). */
export const BedLamp: React.FC<{pos: V3; top?: number; f?: number; k?: number; bui?: boolean}> = ({pos, top = BED.top - 0.05, f = 0, k = 1, bui = true}) => {
  const fl = 1 + 0.06 * Math.sin(f * 0.9) + 0.04 * Math.sin(f * 2.3 + 1);
  return (
    <group position={pos}>
      {Array.from({length: Math.round((top - pos[1] - 0.28) / 0.05)}, (_, i) => <B key={i} p={[0, 0.3 + i * 0.05, 0]} s={[i % 2 ? 0.012 : 0.004, 0.04, i % 2 ? 0.004 : 0.012]} c="#5a4628" cast={false} />)}
      <FacetLathe profile={[[0.001, 0], [0.05, 0.005], [0.075, 0.04], [0.07, 0.07], [0.035, 0.085], [0.03, 0.1]]} sides={10} color="#b8913e" contact={false} cast={false} />
      <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.03, 0.04, 0.12, 10, 1, true]} /><meshPhongMaterial color="#fff6e0" transparent opacity={0.35} shininess={90} emissive="#ffcc77" emissiveIntensity={0.5} side={THREE.DoubleSide} /></mesh>
      <FacetLathe pos={[0, 0.22, 0]} profile={[[0.045, 0], [0.055, 0.02], [0.025, 0.06], [0.01, 0.08]]} sides={8} color="#7a6232" contact={false} cast={false} />
      <mesh position={[0, 0.15, 0]} scale={[1, fl, 1]}><coneGeometry args={[0.014, 0.055, 8]} /><meshBasicMaterial color="#ffe6a0" toneMapped={false} /></mesh>
      <Halo pos={[0, 0.15, 0.02]} r={0.34 * k} color="#ffc878" strength={0.5} />{bui ? <NguonBui kieu="nen" pos={[0, 0.15, 0]} mau="#ffc878" /> : null}
      <Halo pos={[0, 0.15, 0.03]} r={0.1} color="#fff0c0" strength={0.8} />
      <pointLight position={[0, 0.15, 0.05]} color="#ffbf78" intensity={1.7 * k * fl} distance={7} decay={1.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} shadow-radius={3} />
    </group>
  );
};

// ---------------------------------------------------------------- the bedside table and what is on it
/** A small carved table: a moulded top, a drawer with a brass ring, a carved apron, four turned legs on a low stretcher shelf
 *  holding a closed book. pos = middle of the foot; top at 0.7. children sit on the top (local y = TABLE_TOP). */
export const TABLE_TOP = 0.72;
export const BedsideTable: React.FC<{pos: V3; rotY?: number; children?: React.ReactNode}> = ({pos, rotY = 0, children}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Timber p={[0, TABLE_TOP - 0.025, 0]} s={[0.66, 0.05, 0.48]} seed={2} />
    <B p={[0, TABLE_TOP - 0.06, 0]} s={[0.62, 0.025, 0.44]} c="#2e1c10" />
    <Timber p={[0, TABLE_TOP - 0.14, 0.01]} s={[0.56, 0.13, 0.4]} seed={3} />
    <B p={[0, TABLE_TOP - 0.14, 0.215]} s={[0.36, 0.09, 0.01]} c="#3a2414" />
    <mesh position={[0, TABLE_TOP - 0.15, 0.225]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.018, 0.004, 4, 12]} /><meshLambertMaterial color="#c29a48" /></mesh>
    {Array.from({length: 6}, (_, i) => <B key={i} p={[-0.25 + i * 0.1, TABLE_TOP - 0.21, 0.215]} s={[0.05, 0.025, 0.012]} c="#5a3a22" cast={false} />)}
    {[[-0.27, -0.18], [0.27, -0.18], [-0.27, 0.18], [0.27, 0.18]].map(([x, z], i) => <FacetLathe key={i} pos={[x, 0, z]} profile={[[0.03, 0], [0.035, 0.03], [0.022, 0.08], [0.03, 0.18], [0.022, 0.26], [0.035, 0.36], [0.022, 0.44], [0.025, TABLE_TOP - 0.2]]} sides={8} color="#3e2616" contact={false} tones={[0.9, 1.1, 0.9, 1.1, 0.9]} />)}
    <Timber p={[0, 0.14, 0]} s={[0.56, 0.03, 0.38]} seed={4} />
    <B p={[0.04, 0.18, 0.02]} s={[0.26, 0.05, 0.19]} c="#5a2420" />
    <B p={[0.04, 0.18, 0.02]} s={[0.25, 0.042, 0.2]} c="#e2d8c0" cast={false} />
    <B p={[0.04, 0.205, 0.02]} s={[0.27, 0.01, 0.2]} c="#4a1c18" />
    <group position={[0, TABLE_TOP, 0]}>{children}</group>
  </group>
);
/** A tall wax candle in a brass pricket holder with drips and a live flame, its halo and a warm shadow-casting light. */
export const TallCandle: React.FC<{pos: V3; h?: number; f?: number; light?: boolean; k?: number}> = ({pos, h = 0.28, f = 0, light = true, k = 1}) => {
  const fl = 1 + 0.09 * Math.sin(f * 0.53) + 0.05 * Math.sin(f * 1.31 + 2);
  return (
    <group position={pos}>
      <FacetLathe profile={[[0.08, 0], [0.08, 0.015], [0.05, 0.03], [0.02, 0.05], [0.018, 0.12], [0.035, 0.13], [0.06, 0.15], [0.055, 0.16]]} sides={12} color="#c09440" tones={[0.8, 1.1, 0.9, 1, 1.15, 1, 0.85]} />
      <FacetLathe pos={[0, 0.16, 0]} profile={[[0.028, 0], [0.028, h], [0.022, h + 0.012]]} sides={10} color="#efe7d2" contact={false} tones={[1, 1.04]} />
      {[[0.024, h - 0.06, 0.012], [-0.02, h - 0.1, 0.015], [0.01, h - 0.03, -0.02]].map(([x, y, z], i) => <B key={i} p={[x, 0.16 + y, z]} s={[0.012, 0.07, 0.012]} c="#f6f0e0" cast={false} />)}
      <group position={[0, 0.16 + h, 0.005]} scale={[fl * 0.9, fl * 1.1, 1]}><Flame f={f + 7} w={0.05} /></group>
      <Halo pos={[0, 0.16 + h + 0.05, 0.03]} r={0.28 * fl * k} color="#ffbe62" strength={0.5} />
      <Halo pos={[0, 0.16 + h + 0.04, 0.04]} r={0.07} color="#fff2c8" strength={0.8} />
      {light ? <pointLight position={[0.05, 0.16 + h + 0.08, 0.12]} color="#ffb464" intensity={2.4 * k * fl} distance={6} decay={1.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.002} shadow-radius={4} /> : null}
    </group>
  );
};
/** A wide brass basin of water with a linen cloth hung over its rim (a dark wet patch on the cloth). */
export const BrassBasin: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const cloth = useMemo(() => tex('pn-cloth', 200, 300, (c, W, H) => { c.fillStyle = '#ece6d6'; c.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 6) { c.fillStyle = 'rgba(120,110,90,0.12)'; c.fillRect(0, y, W, 2); } c.fillStyle = 'rgba(120,120,130,0.3)'; c.beginPath(); c.ellipse(W * 0.5, H * 0.75, W * 0.35, H * 0.2, 0, 0, 7); c.fill(); c.fillStyle = '#a8342c'; c.fillRect(0, H - 22, W, 6); c.fillRect(0, H - 12, W, 3); }), []);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <FacetLathe profile={[[0.06, 0], [0.07, 0.01], [0.12, 0.05], [0.15, 0.08], [0.155, 0.09], [0.14, 0.09]]} sides={16} color="#b38a3c" tones={[0.8, 1, 1.15, 1.2, 0.9]} />
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.135, 16]} /><meshPhongMaterial color="#3a4a52" shininess={80} specular="#a0b0c0" /></mesh>
      <mesh position={[0.11, 0.03, 0.09]} rotation={[0.25, 0.6, 0.12]} castShadow><planeGeometry args={[0.12, 0.2]} /><meshLambertMaterial map={cloth} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};
/** A pewter goblet on a stem. */
export const Goblet: React.FC<{pos: V3}> = ({pos}) => <FacetLathe pos={pos} profile={[[0.035, 0], [0.035, 0.01], [0.008, 0.02], [0.007, 0.07], [0.02, 0.08], [0.035, 0.11], [0.037, 0.14], [0.033, 0.14]]} sides={12} color="#8e9294" tones={[0.8, 1, 1.1, 1.2, 1, 0.9]} />;
/** The bedside table dressed for a sickbed: the tall candle (light), the basin with the cloth, three medicine bottles (green,
 *  amber, brown: GlassVial of the healer's tent) and a goblet. */
export const SickbedTable: React.FC<{pos: V3; f?: number; light?: boolean}> = ({pos, f = 0, light = true}) => (
  <BedsideTable pos={pos}>
    <TallCandle pos={[-0.2, 0, -0.1]} f={f} light={light} />
    <BrassBasin pos={[0.12, 0, -0.06]} rotY={-0.4} />
    <GlassVial pos={[-0.05, 0, 0.12]} color="#4f9a52" h={0.15} />
    <GlassVial pos={[0.06, 0, 0.16]} color="#c88a2e" kind="flask" h={0.14} />
    <GlassVial pos={[0.2, 0, 0.14]} color="#6a4426" kind="jar" h={0.13} />
    <Goblet pos={[-0.22, 0, 0.13]} />
  </BedsideTable>
);

// ---------------------------------------------------------------- the window
/** The night outside the bedchamber window (a flat picture far behind the wall): a deep blue sky with stars and a big moon in its
 *  halo, a range of snow peaks lit on their left faces, a dark wooded ridge, and far below in the valley the orange dots of the
 *  nomads' fires with a thread of smoke (the camp of chapter 2 seen from the castle). Wm x Hm metres. */
export const paintNightView = (Wm: number, Hm: number, seed = 4) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1428'); g.addColorStop(0.55, '#1d2e52'); g.addColorStop(1, '#33476e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 220; k++) { const s = r(); c.fillStyle = `rgba(235,240,255,${0.3 + s * 0.6})`; c.fillRect(r() * W, r() * H * 0.6, 1 + s * 2, 1 + s * 2); }
  const mx = W * 0.62, my = H * 0.2, mr = H * 0.07, mg = c.createRadialGradient(mx, my, mr, mx, my, mr * 5); mg.addColorStop(0, 'rgba(200,215,255,0.45)'); mg.addColorStop(1, 'rgba(200,215,255,0)'); c.fillStyle = mg; c.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
  c.fillStyle = '#eef2ff'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill(); c.fillStyle = 'rgba(150,165,200,0.35)'; for (const [dx, dy, q] of [[-0.3, -0.2, 0.25], [0.25, 0.1, 0.18], [-0.05, 0.35, 0.15]]) { c.beginPath(); c.arc(mx + dx * mr, my + dy * mr, q * mr, 0, 7); c.fill(); }
  // far peaks: snow, lit left faces, shadowed right faces
  const peaks = (base: number, n: number, hh: number, light: string, dark: string, snow: boolean) => { let x = -W * 0.05; while (x < W * 1.05) { const w = W * (0.12 + r() * 0.12), h = H * hh * (0.7 + r() * 0.5), px = x + w * (0.4 + r() * 0.2);
    c.fillStyle = dark; c.beginPath(); c.moveTo(x, base); c.lineTo(px, base - h); c.lineTo(x + w, base); c.closePath(); c.fill();
    c.fillStyle = light; c.beginPath(); c.moveTo(x, base); c.lineTo(px, base - h); c.lineTo(px - w * 0.05, base - h * 0.4); c.lineTo(px + w * 0.03, base); c.closePath(); c.fill();
    if (snow) { c.fillStyle = '#dfe8f8'; c.beginPath(); c.moveTo(px, base - h); c.lineTo(px - w * 0.14, base - h * 0.72); c.lineTo(px - w * 0.04, base - h * 0.76); c.lineTo(px + w * 0.02, base - h * 0.68); c.lineTo(px + w * 0.13, base - h * 0.74); c.closePath(); c.fill(); c.fillStyle = '#9fb0d0'; c.beginPath(); c.moveTo(px, base - h); c.lineTo(px + w * 0.13, base - h * 0.74); c.lineTo(px + w * 0.02, base - h * 0.68); c.closePath(); c.fill(); }
    x += w * (0.55 + r() * 0.3); void n; } };
  peaks(H * 0.66, 8, 0.3, '#6a7ea8', '#3a4a70', true);
  peaks(H * 0.74, 8, 0.16, '#3e4c6c', '#2a3654', false);
  // the dark ridge with pines, the valley floor
  c.fillStyle = '#18223a'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.78); for (let x = 0; x <= W; x += W / 40) c.lineTo(x, H * (0.78 + 0.03 * Math.sin(x * 0.01) + (r() - 0.5) * 0.012)); c.lineTo(W, H); c.closePath(); c.fill();
  for (let k = 0; k < 70; k++) { const x = r() * W, y = H * (0.79 + r() * 0.04), h = H * (0.02 + r() * 0.03); c.fillStyle = r() < 0.5 ? '#101a2e' : '#1a2640'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + h * 0.35, y); c.lineTo(x - h * 0.35, y); c.closePath(); c.fill(); }
  c.fillStyle = '#212c46'; c.fillRect(0, H * 0.86, W, H * 0.14);
  // the camp far below: fires, their glow, a thread of smoke
  for (let k = 0; k < 6; k++) { const x = W * (0.25 + k * 0.07 + (r() - 0.5) * 0.03), y = H * (0.9 + r() * 0.03), q = H * 0.03, fg = c.createRadialGradient(x, y, 0, x, y, q); fg.addColorStop(0, 'rgba(255,170,80,0.7)'); fg.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = fg; c.fillRect(x - q, y - q, q * 2, q * 2); c.fillStyle = '#ffd28a'; c.fillRect(x - 1.5, y - 1.5, 3, 3); }
  c.strokeStyle = 'rgba(160,170,190,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.35, H * 0.9); c.bezierCurveTo(W * 0.36, H * 0.84, W * 0.33, H * 0.8, W * 0.36, H * 0.74); c.stroke();
  void Wm; void Hm;
};
/** The view from the bedchamber window by DAY (afternoon, chapter 4 by day): a clear blue sky paler at the horizon with a few soft
 *  clouds, a range of snow peaks lit warm on their left faces, a sunlit green-brown ridge with pines, and the valley below with
 *  the nomads' tents and a thread of smoke. Wm x Hm metres (canvas any size). */
export const paintDayView = (Wm: number, Hm: number, seed = 4) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6f9fd8'); g.addColorStop(0.55, '#a9c8ea'); g.addColorStop(1, '#dbe8f2'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 5; k++) { const x = r() * W, y = H * (0.08 + r() * 0.3), w = W * (0.08 + r() * 0.1); c.fillStyle = 'rgba(255,255,255,0.85)'; for (let j = 0; j < 5; j++) { c.beginPath(); c.ellipse(x + (j - 2) * w * 0.22, y + (j % 2) * w * 0.05, w * 0.22, w * 0.11, 0, 0, 7); c.fill(); } c.fillStyle = 'rgba(170,190,215,0.5)'; c.fillRect(x - w * 0.5, y + w * 0.06, w, w * 0.04); }
  const peaks = (base: number, hh: number, light: string, dark: string, snow: boolean) => { let x = -W * 0.05; while (x < W * 1.05) { const w = W * (0.12 + r() * 0.12), h = H * hh * (0.7 + r() * 0.5), px = x + w * (0.4 + r() * 0.2);
    c.fillStyle = dark; c.beginPath(); c.moveTo(x, base); c.lineTo(px, base - h); c.lineTo(x + w, base); c.closePath(); c.fill();
    c.fillStyle = light; c.beginPath(); c.moveTo(x, base); c.lineTo(px, base - h); c.lineTo(px - w * 0.05, base - h * 0.4); c.lineTo(px + w * 0.03, base); c.closePath(); c.fill();
    if (snow) { c.fillStyle = '#fbfaf4'; c.beginPath(); c.moveTo(px, base - h); c.lineTo(px - w * 0.16, base - h * 0.68); c.lineTo(px - w * 0.05, base - h * 0.74); c.lineTo(px + w * 0.02, base - h * 0.64); c.lineTo(px + w * 0.14, base - h * 0.72); c.closePath(); c.fill(); c.fillStyle = '#b8c8de'; c.beginPath(); c.moveTo(px, base - h); c.lineTo(px + w * 0.14, base - h * 0.72); c.lineTo(px + w * 0.02, base - h * 0.64); c.closePath(); c.fill(); }
    x += w * (0.55 + r() * 0.3); } };
  peaks(H * 0.66, 0.3, '#b4bfd2', '#7d8ba6', true);
  peaks(H * 0.74, 0.16, '#7f9a6a', '#5c7650', false);
  c.fillStyle = '#5e7a48'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.78); for (let x = 0; x <= W; x += W / 40) c.lineTo(x, H * (0.78 + 0.03 * Math.sin(x * 0.01) + (r() - 0.5) * 0.012)); c.lineTo(W, H); c.closePath(); c.fill();
  for (let k = 0; k < 70; k++) { const x = r() * W, y = H * (0.79 + r() * 0.04), h = H * (0.02 + r() * 0.03); c.fillStyle = r() < 0.5 ? '#2f4a32' : '#3e5c3a'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + h * 0.35, y); c.lineTo(x - h * 0.35, y); c.closePath(); c.fill(); }
  c.fillStyle = '#8a9a5c'; c.fillRect(0, H * 0.86, W, H * 0.14);
  for (let k = 0; k < 6; k++) { const x = W * (0.25 + k * 0.07 + (r() - 0.5) * 0.03), y = H * (0.91 + r() * 0.03), s = H * 0.018; c.fillStyle = k % 2 ? '#c8b48a' : '#a8764e'; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y - s * 1.2); c.lineTo(x + s, y); c.closePath(); c.fill(); }
  c.strokeStyle = 'rgba(230,230,235,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.35, H * 0.9); c.bezierCurveTo(W * 0.36, H * 0.84, W * 0.33, H * 0.8, W * 0.36, H * 0.74); c.stroke();
  void Wm; void Hm;
};
/** Leaded glass for a two-light arched window seen from inside at night: diamond quarries in thin lead, the glass faintly tinted
 *  and mostly clear (the night shows through), a few panes greener or paler, the stone tracery of the head (two small arches and
 *  a quatrefoil) dark against the sky. w = width, h = sill to top of the arch (half circle of radius w/2). Transparent outside. */
export const paintLeadedGlass = (w: number, h: number, seed = 2) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / w, R = W / 2, spring = R, stone = '#23272a';
  c.save(); c.beginPath(); c.moveTo(0, H); c.lineTo(0, spring); c.arc(R, spring, R, Math.PI, 0); c.lineTo(W, H); c.closePath(); c.clip();
  c.fillStyle = 'rgba(150,175,200,0.10)'; c.fillRect(0, 0, W, H);
  const qw = 0.13 * ppm, qh = 0.19 * ppm;
  for (let j = 0, y = H; y > -qh; y -= qh / 2, j++) for (let x = (j % 2 ? 0 : qw / 2); x < W + qw; x += qw) { const k = r(); if (k < 0.12) { c.fillStyle = k < 0.05 ? 'rgba(160,200,170,0.16)' : 'rgba(255,230,190,0.10)'; diamond(c, x, y, qw / 2, qh / 2); c.fill(); } }
  c.strokeStyle = 'rgba(30,32,34,0.95)'; c.lineWidth = Math.max(1.5, 0.007 * ppm);
  for (let x = -H; x < W + H; x += qw) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + H * qw / qh, 0); c.stroke(); c.beginPath(); c.moveTo(x, H); c.lineTo(x - H * qw / qh, 0); c.stroke(); }
  // tracery: the two lights' small arches meeting at the mullion, a quatrefoil above, the frame round the edge
  c.strokeStyle = stone; c.lineWidth = 0.05 * ppm; const sr = W / 4;
  for (const cx of [W / 4, W * 3 / 4]) { c.beginPath(); c.arc(cx, spring + sr * 0.2, sr, Math.PI, 0); c.stroke(); }
  c.fillStyle = stone; c.beginPath(); c.moveTo(W / 2 - sr * 0.08, spring); c.lineTo(W / 2 + sr * 0.08, spring); c.lineTo(W / 2 + sr * 0.6, spring - R * 0.45); c.lineTo(W / 2 - sr * 0.6, spring - R * 0.45); c.closePath(); c.globalAlpha = 0.0; c.fill(); c.globalAlpha = 1;
  const qx = W / 2, qy = spring - R * 0.5, qr = R * 0.17; c.lineWidth = 0.035 * ppm; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.beginPath(); c.arc(qx + Math.cos(a) * qr * 0.75, qy + Math.sin(a) * qr * 0.75, qr * 0.62, 0, 7); c.stroke(); }
  c.lineWidth = 0.06 * ppm; c.beginPath(); c.moveTo(0.03 * ppm, H); c.lineTo(0.03 * ppm, spring); c.arc(R, spring, R - 0.03 * ppm, Math.PI, 0); c.lineTo(W - 0.03 * ppm, H); c.stroke();
  // a pale sheen of the room's candle on the inside of the glass
  const g = c.createRadialGradient(W * 0.75, H * 0.75, 0, W * 0.75, H * 0.75, W * 0.6); g.addColorStop(0, 'rgba(255,200,140,0.10)'); g.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
};
/** The window itself, set in an arched hole of the wall (origin = middle of the sill on the wall face): the leaded glass set back
 *  in the wall, a stone mullion up to the springing, a deep stone sill with a guttered candle stub and a pewter jug on it. */
export const MullionWindow: React.FC<{w: number; h: number; depth?: number; seed?: number}> = ({w, h, depth = 0.3, seed = 2}) => {
  const map = useMemo(() => tex(`pn-leaded-${w}-${h}`, Math.round(w * 320), Math.round(h * 320), paintLeadedGlass(w, h, seed)), [w, h]);
  const spring = h - w / 2;
  return (
    <group>
      <mesh position={[0, h / 2, -depth]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} /></mesh>
      <B p={[0, spring / 2, -depth + 0.02]} s={[0.09, spring, 0.14]} c="#3c4442" />
      <B p={[0, 0.03, -depth / 2 + 0.02]} s={[w + 0.12, 0.06, depth + 0.16]} c="#4c5452" />
      <FacetLathe pos={[-w * 0.3, 0.06, -0.05]} profile={[[0.04, 0], [0.04, 0.012], [0.02, 0.02], [0.02, 0.07], [0.016, 0.08]]} sides={8} color="#9a8a5a" contact={false} />
      <FacetLathe pos={[w * 0.28, 0.06, -0.08]} profile={[[0.04, 0], [0.05, 0.05], [0.04, 0.12], [0.025, 0.15], [0.035, 0.17]]} sides={10} color="#7e8486" contact={false} />
    </group>
  );
};

// ---------------------------------------------------------------- the door
/** An oak door in a round-arched opening (w wide, h to the top of the arch): vertical planks with grain, three iron straps with
 *  split ends, rows of iron studs, a ring pull on a round plate, a keyhole. open = angle the leaf has swung INTO the room about
 *  its hinge on the right (0 = shut). Origin = middle of the opening's foot on the wall face; the leaf sits `inset` into the wall. */
export const paintOakDoor = (w: number, h: number, seed = 3) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / w, n = 6, pw = W / n;
  for (let i = 0; i < n; i++) { const base = shade('#4a3220', 0.85 + r() * 0.3); c.fillStyle = base; c.fillRect(i * pw, 0, pw, H);
    for (let k = 0; k < 40; k++) { const x = i * pw + r() * pw; c.strokeStyle = r() < 0.6 ? 'rgba(20,10,4,0.35)' : 'rgba(140,100,60,0.18)'; c.lineWidth = 1 + r() * 2; c.beginPath(); c.moveTo(x, 0); for (let y = 0; y <= H; y += H / 10) c.lineTo(x + Math.sin(y * 0.01 + k) * 3, y); c.stroke(); }
    c.fillStyle = 'rgba(10,5,2,0.8)'; c.fillRect(i * pw - 2, 0, 4, H); c.fillStyle = 'rgba(160,120,80,0.2)'; c.fillRect(i * pw + 2, 0, 3, H); }
  for (const yy of [0.18, 0.5, 0.8]) { const y = H - yy * h * ppm; c.fillStyle = '#1e1e20'; c.fillRect(0, y - 0.035 * ppm, W * 0.92, 0.07 * ppm);
    c.beginPath(); c.moveTo(W * 0.92, y - 0.035 * ppm); c.lineTo(W * 0.97, y - 0.07 * ppm); c.lineTo(W * 0.95, y); c.lineTo(W * 0.97, y + 0.07 * ppm); c.lineTo(W * 0.92, y + 0.035 * ppm); c.closePath(); c.fill();
    c.fillStyle = 'rgba(160,160,170,0.25)'; c.fillRect(0, y - 0.035 * ppm, W * 0.92, 0.012 * ppm);
    for (let x = 0.06 * ppm; x < W * 0.9; x += 0.12 * ppm) { c.fillStyle = '#2a2a2c'; c.beginPath(); c.arc(x, y, 0.012 * ppm, 0, 7); c.fill(); c.fillStyle = 'rgba(200,200,210,0.4)'; c.beginPath(); c.arc(x - 2, y - 2, 0.004 * ppm, 0, 7); c.fill(); } }
  for (let x = 0.08 * ppm; x < W; x += 0.18 * ppm) for (const yy of [0.33, 0.66]) { const y = H - yy * h * ppm; c.fillStyle = '#2a2a2c'; c.beginPath(); c.arc(x, y, 0.014 * ppm, 0, 7); c.fill(); }
  const hx = W * 0.18, hy = H - 1.0 * ppm; c.fillStyle = '#26262a'; c.beginPath(); c.arc(hx, hy, 0.07 * ppm, 0, 7); c.fill(); c.strokeStyle = '#3a3a3e'; c.lineWidth = 0.014 * ppm; c.beginPath(); c.arc(hx, hy + 0.08 * ppm, 0.06 * ppm, 0, 7); c.stroke(); c.fillStyle = '#0a0a0a'; c.fillRect(hx - 0.008 * ppm, hy - 0.2 * ppm, 0.016 * ppm, 0.04 * ppm);
  const g = c.createLinearGradient(0, H, 0, H - 0.4 * ppm); g.addColorStop(0, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, H - 0.4 * ppm, W, 0.4 * ppm);
};
const archShape = (w: number, h: number) => { const s = new THREE.Shape(), R = w / 2; s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h - R); s.absarc(R, h - R, R, 0, Math.PI, false); s.lineTo(0, 0); return s; };
export const ArchDoor: React.FC<{w: number; h: number; open?: number; inset?: number}> = ({w, h, open = 0, inset = 0.16}) => {
  const [geo, mats] = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(archShape(w, h), {depth: 0.08, bevelEnabled: false, curveSegments: 16});
    const t = tex(`pn-door-${w}-${h}`, Math.round(w * 300), Math.round(h * 300), paintOakDoor(w, h)).clone(); t.needsUpdate = true; t.repeat.set(1 / w, 1 / h);
    return [g, [new THREE.MeshLambertMaterial({map: t}), new THREE.MeshLambertMaterial({color: '#2e1e12'})]];
  }, [w, h]);
  return (
    <group position={[w / 2, 0, -inset]} rotation={[0, open, 0]}>
      <mesh geometry={geo} material={mats} position={[-w, 0, -0.04]} castShadow receiveShadow />
    </group>
  );
};

// ---------------------------------------------------------------- on the walls
/** A tapestry: the Baron's red with a great gold diamond, a border of small diamonds, a deep gold fringe at the foot, hung from an
 *  iron rod; worn and faded towards the top where the smoke rises. Canvas W x H. */
export const paintTapestry = (Wm: number, Hm: number, look: HallLook = NT, seed = 6) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), ppm = W / Wm, fr = 0.12 * ppm, body = H - fr;
  c.fillStyle = look.cloth; c.fillRect(0, 0, W, body);
  for (let k = 0; k < W * body / 40; k++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,220,200,0.05)'; c.fillRect(r() * W, r() * body, 2, 1 + r() * 2); }
  // woven border: dark band with small gold diamonds
  const bw = 0.11 * ppm; c.fillStyle = look.clothDark; c.fillRect(0, 0, W, bw); c.fillRect(0, body - bw, W, bw); c.fillRect(0, 0, bw, body); c.fillRect(W - bw, 0, bw, body);
  c.fillStyle = look.gold; for (let x = bw; x < W - bw / 2; x += bw * 1.2) { diamond(c, x, bw / 2, bw * 0.25, bw * 0.32); c.fill(); diamond(c, x, body - bw / 2, bw * 0.25, bw * 0.32); c.fill(); }
  for (let y = bw * 1.5; y < body - bw; y += bw * 1.2) { diamond(c, bw / 2, y, bw * 0.25, bw * 0.32); c.fill(); diamond(c, W - bw / 2, y, bw * 0.25, bw * 0.32); c.fill(); }
  c.strokeStyle = look.gold; c.lineWidth = Math.max(1, 0.01 * ppm); c.strokeRect(bw * 1.15, bw * 1.15, W - bw * 2.3, body - bw * 2.3);
  // the great diamond with an inner line, a dark heart, and two rampant gold sprigs either side
  const ex = W / 2, ey = body * 0.48, ew = W * 0.27, eh = body * 0.3;
  c.fillStyle = look.gold; diamond(c, ex, ey, ew, eh); c.fill();
  c.strokeStyle = look.goldDark; c.lineWidth = Math.max(2, 0.012 * ppm); diamond(c, ex, ey, ew * 0.82, eh * 0.82); c.stroke();
  c.fillStyle = look.clothDark; diamond(c, ex, ey, ew * 0.36, eh * 0.36); c.fill();
  c.fillStyle = 'rgba(255,250,220,0.3)'; c.beginPath(); c.moveTo(ex, ey - eh); c.lineTo(ex - ew, ey); c.lineTo(ex, ey); c.closePath(); c.fill();
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const y = body * (0.25 + k * 0.12); c.fillStyle = look.gold; c.beginPath(); c.ellipse(ex + s * W * 0.36, y, W * 0.035, body * 0.018, s * 0.6, 0, 7); c.fill(); }
  // folds and age
  for (let k = 0; k < 5; k++) { const x = W * (0.1 + k * 0.2 + (r() - 0.5) * 0.05), g = c.createLinearGradient(x - W * 0.07, 0, x + W * 0.07, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(255,230,210,0.06)'); g.addColorStop(0.6, 'rgba(0,0,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - W * 0.07, 0, W * 0.14, body); }
  const sg = c.createLinearGradient(0, 0, 0, body * 0.35); sg.addColorStop(0, 'rgba(20,14,10,0.35)'); sg.addColorStop(1, 'rgba(20,14,10,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, body * 0.35);
  // fringe
  for (let x = 2; x < W - 2; x += 0.012 * ppm) { c.strokeStyle = r() < 0.7 ? look.gold : look.goldDark; c.lineWidth = Math.max(1, 0.006 * ppm); c.beginPath(); c.moveTo(x, body - 2); c.lineTo(x + (r() - 0.5) * 3, body + fr * (0.75 + r() * 0.25)); c.stroke(); }
};
export const Tapestry: React.FC<{pos: V3; w: number; h: number; look?: HallLook; seed?: number}> = ({pos, w, h, look = NT, seed = 6}) => {
  const map = useMemo(() => tex(`pn-tapestry-${w}-${h}-${look.cloth}`, Math.round(w * 380), Math.round(h * 380), paintTapestry(w, h, look, seed)), [w, h, look]);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(w, h, 12, 1), p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, 0.035 * Math.sin((p.getX(i) / w + 0.5) * Math.PI * 4)); g.computeVertexNormals(); return g; }, [w, h]);
  return (
    <group position={pos}>
      <mesh geometry={geo} position={[0, -h / 2 - 0.03, 0.06]} castShadow receiveShadow><meshLambertMaterial map={map} transparent alphaTest={0.4} side={THREE.DoubleSide} /></mesh>
      <B p={[0, 0, 0.07]} s={[w + 0.22, 0.03, 0.03]} c="#26241f" />
      {[-1, 1].map((k) => <group key={k}><B p={[k * (w / 2 - 0.04), 0, 0.035]} s={[0.03, 0.03, 0.07]} c="#26241f" /><FacetLathe pos={[k * (w / 2 + 0.11), 0, 0.07]} profile={[[0.016, -0.03], [0.03, 0], [0.02, 0.04], [0.004, 0.07]]} sides={8} color={look.gold} contact={false} cast={false} /></group>)}
    </group>
  );
};
/** A heater shield carved in stone and painted: the Baron's red field with his gold diamond, a gold rim; on a stone corbel.
 *  pos = middle of its top edge on the wall. */
export const WallShield: React.FC<{pos: V3; s?: number; look?: HallLook}> = ({pos, s = 0.55, look = NT}) => {
  const shape = useMemo(() => { const q = new THREE.Shape(), w = s / 2; q.moveTo(-w, 0); q.lineTo(w, 0); q.lineTo(w, -s * 0.45); q.quadraticCurveTo(w * 0.9, -s * 0.95, 0, -s * 1.15); q.quadraticCurveTo(-w * 0.9, -s * 0.95, -w, -s * 0.45); q.closePath(); return q; }, [s]);
  return (
    <group position={pos}>
      <mesh position={[0, 0, 0]} castShadow><extrudeGeometry args={[shape, {depth: 0.04, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.02, bevelSegments: 1}]} /><meshLambertMaterial color={look.gold} /></mesh>
      <mesh position={[0, -0.01, 0.045]} scale={[0.86, 0.88, 1]}><shapeGeometry args={[shape]} /><meshLambertMaterial color={look.cloth} /></mesh>
      <mesh position={[0, -s * 0.5, 0.05]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[s * 0.3, s * 0.3, 0.015]} /><meshLambertMaterial color={look.gold} /></mesh>
      <mesh position={[0, -s * 0.5, 0.058]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[s * 0.11, s * 0.11, 0.01]} /><meshLambertMaterial color={look.clothDark} /></mesh>
      <B p={[0, -s * 1.2, 0.04]} s={[s * 0.5, 0.08, 0.12]} c="#4c5452" />
    </group>
  );
};

// ---------------------------------------------------------------- free-standing things
/** A tall wrought-iron candle stand: three splayed feet with scrolled toes, a twisted shaft with two collars, a drip pan and three
 *  prickets with candles (live flames, halos, a weak warm light). pos = foot; h = height of the pan. */
export const IronCandleStand: React.FC<{pos: V3; h?: number; f?: number; light?: boolean}> = ({pos, h = 1.55, f = 0, light = true}) => (
  <group position={pos}>
    {[0, 2.09, 4.19].map((a) => <group key={a} rotation={[0, a, 0]}>
      <B p={[0.13, 0.09, 0]} s={[0.28, 0.025, 0.025]} r={[0, 0, 0.55]} c="#1e1d1c" />
      <B p={[0.27, 0.02, 0]} s={[0.07, 0.025, 0.03]} c="#1e1d1c" />
      <mesh position={[0.3, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.025, 0.008, 4, 10, Math.PI * 1.4]} /><meshLambertMaterial color="#1e1d1c" /></mesh>
    </group>)}
    <FacetLathe profile={[[0.03, 0.15], [0.016, 0.2], [0.014, h * 0.45], [0.032, h * 0.47], [0.014, h * 0.49], [0.013, h * 0.8], [0.03, h * 0.82], [0.013, h * 0.84], [0.014, h - 0.03]]} sides={6} color="#262422" contact={false} tones={[1, 0.8, 1.1, 0.8, 1, 0.8, 1.1, 0.8]} />
    <FacetLathe profile={[[0.02, h - 0.04], [0.2, h - 0.01], [0.21, h + 0.02], [0.18, h + 0.02]]} sides={12} color="#2a2826" contact={false} />
    {[[-0.12, 0.2], [0, 0.27], [0.12, 0.17]].map(([x, ch], i) => { const fl = 1 + 0.1 * Math.sin(f * 0.47 + i * 2.3); return <group key={i} position={[x, h + 0.02, 0]}>
      <FacetLathe profile={[[0.026, 0], [0.026, ch], [0.02, ch + 0.01]]} sides={8} color="#ebe2cc" contact={false} />
      <B p={[0.02, ch - 0.05, 0.015]} s={[0.01, 0.07, 0.01]} c="#f4eedd" cast={false} />
      <group position={[0, ch + 0.008, 0.01]} scale={[fl * 0.85, fl * 1.05, 1]}><Flame f={f + i * 11} w={0.045} /></group>
      <Halo pos={[0, ch + 0.06, 0.03]} r={0.16 * fl} color="#ffc060" strength={0.42} />
    </group>; })}
    {light ? <pointLight position={[0, h + 0.4, 0.15]} color="#ffb860" intensity={1.0} distance={3.5} decay={1.6} /> : null}
  </group>
);
/** A long carved chest (a bench at the foot of the bed, or against a wall): dark oak with arcaded panels on the front, iron corner
 *  straps, a gold diamond lock plate, a red cushion with gold tassels on the lid. pos = middle of the foot. */
export const CarvedChest: React.FC<{pos: V3; w?: number; d?: number; h?: number; rotY?: number; cushion?: boolean; look?: HallLook}> = ({pos, w = 1.3, d = 0.44, h = 0.46, rotY = 0, cushion = true, look = NT}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <Timber p={[0, h / 2, 0]} s={[w, h - 0.04, d]} seed={7} />
    <Timber p={[0, h - 0.01, 0]} s={[w + 0.05, 0.05, d + 0.05]} seed={8} />
    <B p={[0, 0.03, 0]} s={[w + 0.04, 0.06, d + 0.04]} c="#24160c" />
    {Array.from({length: 4}, (_, i) => { const pw = (w - 0.2) / 4, x = -w / 2 + 0.1 + pw * (i + 0.5); return <group key={i} position={[x, h * 0.52, d / 2 + 0.008]}>
      <B p={[0, 0, 0]} s={[pw - 0.06, h * 0.6, 0.012]} c="#3a2414" />
      <B p={[0, h * 0.3 - 0.02, 0.006]} s={[pw - 0.1, 0.025, 0.012]} c="#5a3a22" cast={false} />
      {[-1, 1].map((k) => <B key={k} p={[k * (pw / 2 - 0.05), -0.02, 0.006]} s={[0.02, h * 0.5, 0.012]} c="#5a3a22" cast={false} />)}
    </group>; })}
    {[-1, 1].map((k) => <B key={k} p={[k * (w / 2 - 0.02), h / 2, d / 2 + 0.012]} s={[0.05, h - 0.06, 0.01]} c="#1e1e20" />)}
    <mesh position={[0, h * 0.66, d / 2 + 0.02]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.08, 0.08, 0.012]} /><meshLambertMaterial color={look.gold} /></mesh>
    {cushion ? <>
      <B p={[0, h + 0.05, 0]} s={[w - 0.08, 0.07, d - 0.06]} c={look.cloth} />
      <B p={[0, h + 0.05, d / 2 - 0.028]} s={[w - 0.08, 0.012, 0.012]} c={look.gold} cast={false} />
      {[-1, 1].map((k) => <FacetLathe key={k} pos={[k * (w / 2 - 0.06), h - 0.08, d / 2 - 0.02]} profile={[[0.003, 0.12], [0.018, 0.09], [0.022, 0.02], [0.028, 0]]} sides={8} color={look.gold} contact={false} cast={false} />)}
    </> : null}
  </group>
);
/** The Baron's sword hanging at his hip, to put beside a figure (it is not part of the mould): a gold pommel and cross-guard, a
 *  grip wound with dark leather, a red leather scabbard with a gold chape and locket. pos = the middle of the cross-guard;
 *  tilt = lean of the blade (radians, positive = point to the right of the screen). Stand it 0.15 m IN FRONT of the figure's
 *  card (closer is a magenta mark in the physics check). */
export const HipSword: React.FC<{pos: V3; tilt?: number; look?: HallLook}> = ({pos, tilt = -0.18, look = NT}) => (
  <group position={pos} rotation={[0, 0, tilt]}>
    <B p={[0, 0, 0]} s={[0.2, 0.03, 0.03]} c={look.gold} />
    <FacetLathe pos={[0, 0.015, 0]} profile={[[0.016, 0], [0.014, 0.05], [0.016, 0.1], [0.014, 0.13]]} sides={8} color="#2a1a14" contact={false} tones={[1, 0.8, 1.1, 0.8]} />
    <FacetLathe pos={[0, 0.14, 0]} profile={[[0.012, 0], [0.032, 0.02], [0.03, 0.045], [0.008, 0.06]]} sides={8} color={look.gold} contact={false} />
    <B p={[0, -0.04, 0]} s={[0.055, 0.06, 0.03]} c={look.gold} />
    <B p={[0, -0.42, 0]} s={[0.045, 0.72, 0.025]} c="#5a1e1a" />
    <B p={[0, -0.42, 0.014]} s={[0.012, 0.7, 0.003]} c="#3e1412" cast={false} />
    <B p={[0, -0.82, 0]} s={[0.05, 0.1, 0.03]} c={look.gold} />
  </group>
);
