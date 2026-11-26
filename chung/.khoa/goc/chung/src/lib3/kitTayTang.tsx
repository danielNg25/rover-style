import React, {useMemo} from 'react';
import * as THREE from 'three';
import {NguonBui} from './buiNguon';
import {Halo} from './look';
import {rnd, Ctx, P, TheoTam} from './depth';
import {tex} from './kitLab';
import {Embers, SparkBurst} from './fx';

/** lib3/kitTayTang: small shared pieces for the Tibet chapter (d1c9): the monastery painted on the far shoulder, prayer flags,
 *  a hand lantern, a blanket, the old headband burning, the lowercase name turning to ash, the sizzling water drop.
 *  The shapes are plain and invented here: whitewashed stepped blocks with a maroon band under the parapet, gilt roofs,
 *  small black trapezoid windows; nothing is copied from a particular film or book, and no sacred figure is drawn. World in metres, y up. */
type V3 = [number, number, number];
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const dotTex = () => tex('tt-dot', 64, 64, (c, W) => { const g = c.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, W); });

// ---------------------------------------------------------------- the monastery on the far shoulder
export type TuVienPal = {wall: string; wallShade: string; band: string; bandShade: string; roof: string; roofShade: string; rock: string; rockLit: string; snow: string; win: string; flag: string[];
  red: string; redShade: string; stone: string; stoneShade: string; wood: string};
/** Painted in SCREEN units of the 1600 x 900 frame of the standard eye: `region` = [x0, y0, w, h] is the part of the frame the canvas covers; the drawing below is authored in screen
 *  units (apex of the hill about (300, 70), the gate at the foot (330, 330)). A cut-paper monastery climbing a spur: a rock hill with snow on its ledges; three stone ramparts; four tiers
 *  of battered whitewashed and red-ochre walls with a maroon band under the parapet, rows of black trapezoid windows with a small awning and a curtain, wooden balconies; at the top
 *  the great hall with two gilt roofs, a finial and a pennant, gilt pavilions on the tier below; a zigzag stone stair from the foot to the gate; white bell stupas along the way;
 *  prayer flags between the roofs; thin smoke from the kitchens. lit = how many windows glow warm (0..7, from the great hall outwards). Invented here, not any real building. */
export const paintTuVien = (pal: TuVienPal, lit: number, region: [number, number, number, number] = [-160, -30, 980, 520]) => (c: Ctx, W: number, H: number) => {
  const [x0, y0, rw, rh] = region; c.setTransform(W / rw, 0, 0, H / rh, (-x0 * W) / rw, (-y0 * H) / rh);
  c.translate(330, 372); c.scale(1.13, 1.13); c.translate(-330, -330);   // a little larger, and lower so the finial stays inside the frame
  const r = rnd(31), wins: [number, number][] = [];
  // ---- the hill: faceted rock, lit towards the upper left, snow on the ledges
  const hill = [[-200, 540], [-170, 380], [-100, 330], [-20, 270], [60, 240], [130, 190], [200, 130], [270, 82], [330, 68], [400, 120], [470, 190], [560, 250], [660, 300], [760, 350], [840, 400], [900, 450], [900, 540]];
  P(c, hill, pal.rock);
  for (let i = 1; i < hill.length - 2; i++) { const [xa, ya] = hill[i - 1], [xb, yb] = hill[i]; P(c, [[xa, ya], [xb, yb], [xb - 30, 540], [xa - 40, 540]], yb <= ya ? pal.rockLit : pal.rock); }
  for (let i = 0; i < 40; i++) { const x = -160 + r() * 1000, hy = 70 + Math.abs(x - 330) * 0.62, y = hy + 20 + r() * 140, s = 14 + r() * 30; P(c, [[x, y], [x + s, y + 6], [x + s * 0.4, y + s]], r() < 0.5 ? pal.rockLit : pal.rock); P(c, [[x - 2, y - 1], [x + s, y + 5], [x + s * 0.6, y + 7]], pal.snow); }
  // ---- helpers
  const face = (xa: number, xb: number, base: number, h: number, bat: number, lit_: string, shade_: string, sw: number) => {
    P(c, [[xa, base], [xa + bat, base - h], [xb - sw - bat, base - h], [xb - sw, base]], lit_);
    P(c, [[xb - sw, base], [xb - sw - bat, base - h], [xb, base - h + 3], [xb, base]], shade_);
  };
  const windows = (xa: number, xb: number, base: number, h: number, rows: number, balcony: boolean) => {
    const n = Math.max(2, Math.floor((xb - xa) / 26));
    for (let rI = 0; rI < rows; rI++) for (let i = 0; i < n; i++) {
      const wx = xa + 8 + i * ((xb - xa - 30) / Math.max(1, n - 1)), wy = base - h * (0.78 - rI * 0.36) - 8;
      P(c, [[wx - 1, wy + 15], [wx + 2, wy], [wx + 8, wy], [wx + 11, wy + 15]], '#241b26');
      P(c, [[wx - 3, wy - 1], [wx + 13, wy - 1], [wx + 12, wy - 5], [wx - 2, wy - 5]], (i + rI) % 2 ? pal.band : '#efe8dc');           // the awning
      if ((i + rI) % 3 === 0) P(c, [[wx + 7, wy + 1], [wx + 10, wy + 1], [wx + 10, wy + 14], [wx + 7, wy + 14]], '#efe8dc');            // a curtain half drawn
      wins.push([wx, wy]);
    }
    if (balcony) { c.fillStyle = pal.wood; c.fillRect(xa + 4, base - h * 0.44, xb - xa - 14, 4); c.fillRect(xa + 4, base - h * 0.44 - 9, xb - xa - 14, 2); for (let x = xa + 6; x < xb - 12; x += 7) c.fillRect(x, base - h * 0.44 - 9, 1.5, 9); }
  };
  const block = (xa: number, xb: number, base: number, h: number, red: boolean, rows = 2, balcony = false) => {
    face(xa, xb, base, h, 3, red ? pal.red : pal.wall, red ? pal.redShade : pal.wallShade, (xb - xa) * 0.16);
    for (let i = 0; i < 4; i++) { const sx = xa + 8 + r() * (xb - xa - 20); c.fillStyle = red ? pal.redShade : pal.wallShade; c.globalAlpha = 0.28; c.fillRect(sx, base - h + 2, 2 + r() * 3, h * (0.4 + r() * 0.5)); c.globalAlpha = 1; }   // weathering streaks
    P(c, [[xa - 3, base - h], [xb + 1, base - h], [xb + 1, base - h - 10], [xa - 3, base - h - 10]], pal.band); P(c, [[xb - (xb - xa) * 0.16, base - h], [xb + 1, base - h], [xb + 1, base - h - 10], [xb - (xb - xa) * 0.16, base - h - 10]], pal.bandShade);
    for (let x = xa; x < xb - 6; x += 9) { c.fillStyle = '#d6a742'; c.fillRect(x + 2, base - h - 7, 3, 3); }                           // the gilt studs on the band
    P(c, [[xa - 4, base - h - 10], [xb + 2, base - h - 10], [xb + 2, base - h - 15], [xa - 4, base - h - 15]], pal.snow);              // the parapet, snow on it
    windows(xa, xb, base, h, rows, balcony);
  };
  const rampart = (xa: number, xb: number, base: number, h: number) => {
    P(c, [[xa, base], [xa + 4, base - h], [xb - 4, base - h], [xb, base]], pal.stone); P(c, [[xb - 30, base], [xb - 34, base - h], [xb - 4, base - h], [xb, base]], pal.stoneShade);
    c.strokeStyle = pal.stoneShade; c.lineWidth = 1; for (let y = base - h + 8; y < base; y += 9) { c.beginPath(); c.moveTo(xa + 3, y); c.lineTo(xb - 3, y); c.stroke(); for (let x = xa + 6 + (y % 2) * 8; x < xb - 6; x += 16) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 9); c.stroke(); } }
    for (let x = xa + 4; x < xb - 8; x += 12) P(c, [[x, base - h], [x + 7, base - h], [x + 7, base - h - 5], [x, base - h - 5]], pal.stone);
    P(c, [[xa, base - h - 5], [xb, base - h - 5], [xb, base - h - 8], [xa, base - h - 8]], pal.snow);
  };
  // a gilt roof of several tiers with upturned corners, a finial, a pennant
  const roof = (cx: number, base: number, w: number, tiers: number) => {
    for (let t = 0; t < tiers; t++) { const ww = w * (1 - t * 0.28), yb = base - t * 24, hh = 20;
      P(c, [[cx - ww / 2 - 13, yb + 3], [cx - ww / 2 + 6, yb - hh * 0.45], [cx - ww * 0.3, yb - hh], [cx + ww * 0.3, yb - hh], [cx + ww / 2 - 6, yb - hh * 0.45], [cx + ww / 2 + 13, yb + 3], [cx + ww / 2, yb + 7], [cx - ww / 2, yb + 7]], pal.roof);
      P(c, [[cx + 2, yb - hh], [cx + ww * 0.3, yb - hh], [cx + ww / 2 - 6, yb - hh * 0.45], [cx + ww / 2 + 13, yb + 3], [cx + ww / 2, yb + 7], [cx + 2, yb + 7]], pal.roofShade);
      P(c, [[cx - ww * 0.3, yb - hh], [cx + ww * 0.3, yb - hh], [cx + ww * 0.3 - 4, yb - hh - 3], [cx - ww * 0.3 + 4, yb - hh - 3]], pal.snow);
      P(c, [[cx - ww / 2 - 13, yb + 3], [cx - ww / 2 + 6, yb - hh * 0.45], [cx - ww / 2 + 12, yb - hh * 0.3], [cx - ww / 2 - 4, yb + 5]], pal.band);           // the dark eave edge
    }
    const top = base - (tiers - 1) * 24 - 20;
    P(c, [[cx - 7, top], [cx + 7, top], [cx + 4, top - 11], [cx - 4, top - 11]], pal.roofShade); c.fillStyle = pal.roof; c.fillRect(cx - 1.5, top - 26, 3, 15); P(c, [[cx - 6, top - 11], [cx + 6, top - 11], [cx, top - 24]], pal.roof);
    c.fillStyle = '#4a3a30'; c.fillRect(cx - 0.6, top - 44, 1.2, 20); P(c, [[cx + 0.6, top - 44], [cx + 17, top - 40], [cx + 0.6, top - 35]], '#b83a30');
  };
  const chorten = (x: number, base: number, s: number) => {
    P(c, [[x - 17 * s, base], [x + 17 * s, base], [x + 13 * s, base - 7 * s], [x - 13 * s, base - 7 * s]], pal.wall); P(c, [[x + 4 * s, base], [x + 17 * s, base], [x + 13 * s, base - 7 * s], [x + 4 * s, base - 7 * s]], pal.wallShade);
    P(c, [[x - 12 * s, base - 7 * s], [x + 12 * s, base - 7 * s], [x + 8 * s, base - 14 * s], [x - 8 * s, base - 14 * s]], pal.wall); P(c, [[x - 9 * s, base - 14 * s], [x + 9 * s, base - 14 * s], [x + 11 * s, base - 30 * s], [x + 6 * s, base - 33 * s], [x - 6 * s, base - 33 * s], [x - 11 * s, base - 30 * s]], pal.wall);
    P(c, [[x + 2 * s, base - 14 * s], [x + 9 * s, base - 14 * s], [x + 11 * s, base - 30 * s], [x + 6 * s, base - 33 * s], [x + 2 * s, base - 33 * s]], pal.wallShade); P(c, [[x - 4 * s, base - 22 * s], [x + 4 * s, base - 22 * s], [x + 4 * s, base - 27 * s], [x - 4 * s, base - 27 * s]], pal.band);
    P(c, [[x - 7 * s, base - 33 * s], [x + 7 * s, base - 33 * s], [x + 3 * s, base - 40 * s], [x - 3 * s, base - 40 * s]], pal.roof); P(c, [[x - 2 * s, base - 40 * s], [x + 2 * s, base - 40 * s], [x, base - 53 * s]], pal.roof); P(c, [[x - 12 * s, base - 14 * s], [x + 12 * s, base - 14 * s], [x + 9 * s, base - 17 * s], [x - 9 * s, base - 17 * s]], pal.snow);
  };
  // ---- the buildings, from the lowest tier up (each in front of the rock, behind the tier below)
  rampart(-60, 700, 400, 40); rampart(50, 600, 350, 40);
  block(300, 372, 330, 40, true, 1);                                                   // the gate tower: dark red, a gilt hip roof on it
  P(c, [[322, 330], [322, 312], [335, 305], [348, 312], [348, 330]], '#241b26');
  block(110, 230, 330, 60, false, 2, true); block(230, 300, 330, 66, true, 2); block(372, 440, 330, 60, false, 2, true); block(440, 530, 330, 54, true, 2);
  roof(336, 285, 64, 1);
  rampart(130, 560, 268, 34);
  block(170, 270, 264, 60, false, 2, true); block(270, 360, 264, 66, true, 2); block(360, 450, 264, 56, false, 2, true);
  block(215, 290, 196, 56, false, 2); block(290, 372, 196, 62, true, 2, true);
  roof(240, 130, 56, 1); roof(402, 130, 50, 1);                                         // the gilt pavilions on the tier below the hall
  block(242, 352, 138, 52, true, 2); roof(297, 86, 124, 3);                                // the great hall: red walls, three-tier gilt roof
  block(-90, -10, 330, 40, false, 1); roof(-50, 288, 40, 1);                              // outlying buildings
  block(560, 650, 322, 36, false, 1, true); roof(605, 286, 46, 1);
  // ---- stupas along the way, the stair, flags
  chorten(40, 338, 1.1); chorten(-10, 352, 0.8); chorten(690, 322, 1.0); chorten(735, 336, 0.8); chorten(80, 394, 0.7); chorten(610, 394, 0.7);
  c.strokeStyle = pal.stone; c.lineCap = 'round'; c.lineJoin = 'round';
  const stair = [[330, 430], [215, 412], [440, 394], [190, 376], [455, 360], [240, 346], [410, 334], [336, 330]];
  c.lineWidth = 11; c.strokeStyle = pal.stoneShade; c.beginPath(); stair.forEach(([x, y], i) => (i ? c.lineTo(x, y + 2) : c.moveTo(x, y + 2))); c.stroke();
  c.lineWidth = 8; c.strokeStyle = pal.snow; c.beginPath(); stair.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  c.lineWidth = 1; c.strokeStyle = pal.stoneShade; for (let i = 1; i < stair.length; i++) { const [xa, ya] = stair[i - 1], [xb, yb] = stair[i], n = Math.floor(Math.hypot(xb - xa, yb - ya) / 5); for (let k = 0; k < n; k++) { const t = k / n, x = xa + (xb - xa) * t, y = ya + (yb - ya) * t; c.beginPath(); c.moveTo(x - 1, y - 3); c.lineTo(x + 1, y + 3); c.stroke(); } }
  const flags = (ax: number, ay: number, bx: number, by: number, n: number, sag: number) => {
    c.strokeStyle = '#2a2430'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag * 2, bx, by); c.stroke();
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * ((ax + bx) / 2) + t * t * bx, y = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * ((ay + by) / 2 + sag * 2) + t * t * by; P(c, [[x - 4, y], [x + 4, y + 1], [x + 3, y + 10], [x - 5, y + 8]], pal.flag[i % 5]); }
  };
  flags(297, 62, 40, 306, 16, 30); flags(297, 62, 690, 296, 18, 34); flags(240, 112, 402, 112, 12, 10); flags(110, 270, 530, 270, 20, 14);
  // ---- smoke from the kitchens (wind from the right: it leans left), thin and pale
  [[500, 276, 2], [196, 176, 5], [338, 118, 8]].forEach(([x, y, sd]) => { const q = rnd(sd); for (let k = 0; k < 9; k++) { c.globalAlpha = 0.22 * (1 - k / 9); c.fillStyle = '#e8e4ea'; c.beginPath(); c.ellipse(x - k * 6 - q() * 4, y - k * 11, 5 + k * 2.2, 4 + k * 1.6, 0, 0, 7); c.fill(); } c.globalAlpha = 1; });
  // ---- lit windows: nearest the great hall first
  wins.sort((a, b) => Math.hypot(a[0] - 297, a[1] - 150) - Math.hypot(b[0] - 297, b[1] - 150));
  wins.slice(0, lit).forEach(([x, y]) => { const g = c.createRadialGradient(x + 5, y + 8, 0, x + 5, y + 8, 30); g.addColorStop(0, 'rgba(255,214,140,0.3)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.fillRect(x - 22, y - 18, 54, 52); P(c, [[x - 1, y + 15], [x + 2, y], [x + 8, y], [x + 11, y + 15]], pal.win); });
};
/** the plate: stands the painted monastery at distance d from `from`, over the screen region [x0, y0, w, h] of the 1600 x 900 frame (high resolution, so the camera can fly into it) */
export const TuVienPlate: React.FC<{from: V3; d: number; region: [number, number, number, number]; pal: TuVienPal; lit: number}> = ({from, d, region, pal, lit}) => {
  const [x0, y0, w, h] = region, key = `tt-tuvien2-${lit}-${pal.wall}`;
  const t = useMemo(() => tex(key, 3200, Math.round(3200 * (h / w)), paintTuVien(pal, lit, region)), [key]);
  const H = 2 * Math.tan((28 * Math.PI) / 360) * d, k = H / 900;
  return <TheoTam from={from}><mesh position={[from[0] + (x0 + w / 2 - 800) * k, from[1] - (y0 + h / 2 - 450) * k, from[2] - d]} renderOrder={0}><planeGeometry args={[w * k, h * k]} /><meshBasicMaterial map={t} transparent depthWrite={false} /></mesh></TheoTam>;   // quay cùng các tấm khi máy đi vòng
};

// ---------------------------------------------------------------- prayer flags
export const FLAG5 = ['#3a6ab0', '#ece7d8', '#c23a30', '#3f8a4a', '#e0b23a'];
/** A string of five-colour prayer flags between two poles; they stream with the wind (wind > 0 blows towards screen left). */
export const CoPhuon: React.FC<{a: V3; b: V3; f: number; wind?: number; n?: number; sag?: number; tone?: number; poles?: boolean}> = ({a, b, f, wind = 1, n = 12, sag = 0.35, tone = 1, poles = true}) => {
  const pt = (t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t];
  const cols = useMemo(() => FLAG5.map((c) => new THREE.Color(c).multiplyScalar(tone)), [tone]);
  return (
    <group>
      {poles ? [a, b].map((p, i) => <mesh key={i} position={[p[0], p[1] / 2 - 0.1, p[2]]} castShadow><boxGeometry args={[0.07, p[1] + 0.2, 0.07]} /><meshLambertMaterial color="#4a3626" /></mesh>) : null}
      {Array.from({length: 16}, (_, i) => { const p0 = pt(i / 16), p1 = pt((i + 1) / 16), len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
        return <mesh key={i} position={[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2]} rotation={[0, 0, Math.atan2(p1[1] - p0[1], p1[0] - p0[0])]}><boxGeometry args={[len, 0.012, 0.012]} /><meshBasicMaterial color="#2a2428" /></mesh>; })}
      {Array.from({length: n}, (_, i) => { const t = (i + 0.5) / n, p = pt(t), flap = Math.sin(f * 0.55 + i * 1.3) * 0.18 * wind, lean = -(0.95 * Math.pow(Math.min(1, wind), 1.3) + flap);
        return <group key={i} position={p} rotation={[0, 0, lean]}><mesh position={[0, -0.14, 0]} rotation={[0, Math.sin(f * 0.37 + i) * 0.35 * wind, 0]}><planeGeometry args={[0.2, 0.26]} /><meshLambertMaterial color={cols[i % 5]} side={THREE.DoubleSide} /></mesh></group>; })}
    </group>
  );
};

// ---------------------------------------------------------------- a lantern carried in the hand
/** Paper-and-bamboo lantern: red caps, warm paper, dark ribs. pos = the hand's grip (the top of the cord); it hangs 0.14 m below.
 *  Its own warm point light and a halo; the flicker follows f. s = size factor. */
/** bui (mặc định true): đèn tự đăng ký nguồn bụi (lib3/buiNguon) tại thân đèn ('den': đèn lồng giấy, khi sáng). */
export const DenLongCam: React.FC<{pos: V3; f?: number; s?: number; lit?: boolean; light?: boolean; bui?: boolean}> = ({pos, f = 0, s = 1, lit = true, light = true, bui = true}) => {
  const paper = useMemo(() => tex('tt-lantern-paper', 128, 192, (c, W, H) => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#ffcf7a'); g.addColorStop(0.5, '#fff0b8'); g.addColorStop(1, '#ffc060'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#7a4a22'; for (let y = 24; y < H; y += 28) c.fillRect(0, y, W, 3); for (let x = 0; x <= W; x += W / 3) c.fillRect(x - 1.5, 0, 3, H); }), []);
  const flick = 0.9 + 0.1 * Math.sin(f * 0.7) + 0.05 * Math.sin(f * 1.9);
  return (
    <group position={pos} scale={s}>
      <mesh position={[0, -0.07, 0]}><boxGeometry args={[0.006, 0.14, 0.006]} /><meshBasicMaterial color="#2a2018" /></mesh>
      <group position={[0, -0.14, 0]}>
        <mesh position={[0, 0.0, 0]}><boxGeometry args={[0.17, 0.02, 0.17]} /><meshLambertMaterial color="#9a2f26" /></mesh>
        <mesh position={[0, -0.15, 0]}><boxGeometry args={[0.17, 0.02, 0.17]} /><meshLambertMaterial color="#9a2f26" /></mesh>
        <mesh position={[0, -0.075, 0]}><boxGeometry args={[0.15, 0.13, 0.15]} />{lit ? <meshBasicMaterial map={paper} color={new THREE.Color().setScalar(flick)} /> : <meshLambertMaterial map={paper} />}</mesh>
        {[[-0.075, -0.075], [0.075, -0.075], [-0.075, 0.075], [0.075, 0.075]].map(([x, z], i) => <mesh key={i} position={[x, -0.075, z]}><boxGeometry args={[0.008, 0.14, 0.008]} /><meshBasicMaterial color="#5a3418" /></mesh>)}
        {[-0.03, -0.075, -0.12].map((y) => <mesh key={y} position={[0, y, 0.077]}><boxGeometry args={[0.15, 0.006, 0.002]} /><meshBasicMaterial color="#8a5a2a" /></mesh>)}
        {lit ? <>{bui ? <NguonBui kieu="den" pos={[0, -0.075, 0]} r={0.6} mau="#ffbe62" /> : null}<Halo pos={[0, -0.075, 0.12]} r={0.7} color="#ffbe62" strength={0.5 * flick} /><Halo pos={[0, -0.075, 0.1]} r={0.22} color="#fff0b0" strength={0.7 * flick} />
          {light ? <pointLight position={[0, -0.075, 0.35]} color="#ffb860" intensity={2.4 * flick} distance={4.5} decay={1.6} /> : null}</> : null}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- a blanket
/** A woven blanket (saffron, maroon and cream stripes with a fringe) laid over a lying body: w along x, d along z, with soft folds that
 *  follow a body under it (lift = how high the middle sits). pos = the middle of its lower face. */
export const TamChan: React.FC<{pos: V3; w?: number; d?: number; lift?: number; seed?: number; rotY?: number}> = ({pos, w = 1.4, d = 0.9, lift = 0.1, seed = 1, rotY = 0}) => {
  const map = useMemo(() => tex(`tt-blanket-${seed}`, 512, 256, (c, W, H) => { const r = rnd(seed * 7 + 3), cols = ['#d9a03a', '#8c2f2a', '#efe3c4', '#8c2f2a', '#c47a2a'];
    c.fillStyle = '#d9a03a'; c.fillRect(0, 0, W, H); let x = 0, i = 0; while (x < W) { const w2 = 18 + r() * 30; c.fillStyle = cols[i % cols.length]; c.fillRect(x, 0, w2, H); x += w2; i++; }
    c.fillStyle = 'rgba(60,30,20,0.22)'; for (let y = 6; y < H; y += 10) c.fillRect(0, y, W, 2); c.fillStyle = '#efe3c4'; c.fillRect(0, 0, W, 12); c.fillRect(0, H - 12, W, 12); }), [seed]);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(w, d, 28, 10), p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (w / 2), y = p.getY(i) / (d / 2), z = lift * Math.max(0, 1 - y * y) * (0.55 + 0.45 * Math.cos(x * 1.6)) + 0.02 * Math.sin(x * 9 + seed) * (1 - y * y) - 0.05 * y * y; p.setZ(i, z); }
    g.computeVertexNormals(); return g; }, [w, d, lift, seed]);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} castShadow receiveShadow><meshLambertMaterial map={map} side={THREE.DoubleSide} /></mesh>
      {[-1, 1].map((sx) => Array.from({length: 14}, (_, i) => <mesh key={`${sx}${i}`} position={[sx * (w / 2 + 0.015), 0.012, -d / 2 + 0.03 + i * ((d - 0.06) / 13)]}><boxGeometry args={[0.03, 0.006, 0.012]} /><meshLambertMaterial color="#efe3c4" /></mesh>))}
    </group>
  );
};

// ---------------------------------------------------------------- the old headband burning
const bandTex = () => tex('tt-band', 512, 96, (c, W, H) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(120,100,70,0.35)'; c.lineWidth = 2; for (let x = 0; x < W; x += 9) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 9) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.fillStyle = 'rgba(150,110,70,0.3)'; c.fillRect(0, 0, W, 8); c.fillRect(0, H - 8, W, 8); c.fillStyle = 'rgba(110,90,60,0.5)'; c.fillRect(30, 34, 60, 6); c.fillRect(260, 56, 40, 5); });
/** The old headband (cream cloth, 0.62 m long) hung from the hand at `pos` and then dropped into a fire at `fire`. chay 0..1 = how far it has burnt
 *  from its lower end up; f = frame for flames and embers. The cloth curls as it burns. */
export const DaiBangChay: React.FC<{pos: V3; f?: number; chay?: number; len?: number; curl?: number; embers?: boolean}> = ({pos, f = 0, chay = 0, len = 0.62, curl = 0, embers = true}) => {
  const W = len, H = 0.1, n = 20, burnt = clamp(chay);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(W, H, n, 2), p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) / W + 0.5; p.setZ(i, Math.sin(u * 5 + curl * 2) * 0.012 + curl * 0.1 * Math.pow(1 - u, 2) * Math.sin(u * 7)); p.setY(i, p.getY(i) * (1 - curl * 0.5 * (1 - u))); }
    g.computeVertexNormals(); return g; }, [W, curl]);
  const map = useMemo(() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const c = cv.getContext('2d')!, src = bandTex().image as HTMLCanvasElement;
    c.drawImage(src, 0, 0); const r = rnd(5); const edge = burnt * 540 - 14;     // the burnt front moves from the left end (u = 0) to the right
    if (burnt > 0) { for (let x = 0; x < 512; x += 3) { const front = edge + (Math.sin(x * 0.19) + r() - 0.5) * 18, e2 = front;  // ragged
        if (x < e2 - 26) { c.clearRect(x, 0, 3, 96); } else if (x < e2) { c.fillStyle = `rgba(${20 + (e2 - x) * 0}, 16, 14, 1)`; c.fillRect(x, 0, 3, 96); } else if (x < e2 + 16) { c.fillStyle = `rgba(255,${140 + (x - e2) * 6},40,0.9)`; c.fillRect(x, 0, 3, 96); } } }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }, [Math.round(burnt * 60)]);
  const fx = -W / 2 + burnt * W;      // x of the burning front (local)
  return (
    <group position={pos}>
      <mesh geometry={geo} castShadow><meshLambertMaterial map={map} side={THREE.DoubleSide} transparent alphaTest={0.05} emissive="#ff6a1a" emissiveIntensity={burnt > 0 ? 0.25 : 0} emissiveMap={map} /></mesh>
      {burnt > 0 && burnt < 1 ? <>
        {Array.from({length: 5}, (_, i) => { const k = 0.8 + 0.4 * Math.sin(f * 0.6 + i * 2); return <mesh key={i} position={[fx + (i - 2) * 0.004, 0.04 + 0.03 * k, 0.02]} scale={[0.05 * k, 0.12 * k + 0.04, 1]} renderOrder={6}><planeGeometry /><meshBasicMaterial map={dotTex()} color={i % 2 ? '#ff7a22' : '#ffc050'} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>; })}
        <Halo pos={[fx, 0.02, 0.1]} r={0.5} color="#ff9a3a" strength={0.55} />
        {embers ? <Embers f={f} box={[pos[0] + fx - 0.12, pos[0] + fx + 0.12, pos[1] - 0.05, pos[1] + 0.5, pos[2] - 0.03, pos[2] + 0.1]} n={10} size={0.012} life={34} seed={4} color="#ffb24a" /> : null}</> : null}
    </group>
  );
};

// ---------------------------------------------------------------- the name turning to ash
/** The lowercase label "victor" (the d1c9 name label) burning away: burn 0..1 moves a ragged glowing edge from its left end across; what lies behind it is gone.
 *  Flakes of ash rise from it. pos = the centre; w = width in metres. */
export const ChuChay: React.FC<{pos: V3; burn?: number; f?: number; w?: number; text?: string; rotY?: number}> = ({pos, burn = 0, f = 0, w = 0.62, text = 'victor', rotY = 0}) => {
  const b = clamp(burn), h = w * 0.34;
  const map = useMemo(() => { const W = 256, H = 88, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d')!;
    c.fillStyle = '#f3ead2'; c.beginPath(); c.roundRect(2, 2, W - 4, H - 4, 10); c.fill(); c.strokeStyle = '#3a3128'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#26211c'; c.font = `bold ${Math.min(54, Math.floor(236 / (text.length * 0.58)))}px "Trebuchet MS", "Helvetica Neue", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2 + 3);
    if (b > 0) { const id = c.getImageData(0, 0, W, H), d = id.data, nz = (x: number, y: number) => 0.5 + 0.25 * Math.sin(x * 0.11 + y * 0.07) + 0.25 * Math.sin(x * 0.043 - y * 0.13 + 1.7);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, u = x / W + 0.2 * (nz(x, y) - 0.5), v = u - b * 1.25 + 0.05;   // v < 0: burnt
          if (v < -0.06) d[i + 3] = 0; else if (v < 0) { d[i] = 40; d[i + 1] = 28; d[i + 2] = 24; } else if (v < 0.05) { const k = 1 - v / 0.05; d[i] = 255; d[i + 1] = 120 + 110 * (1 - k); d[i + 2] = 30 + 60 * (1 - k); } }
      c.putImageData(id, 0, 0); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }, [Math.round(b * 80), text]);
  const front = -w / 2 + (b * 1.25 - 0.12) * w;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh renderOrder={6}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} transparent depthWrite={false} /></mesh>
      {b > 0 && b < 1 ? <>
        <Halo pos={[Math.max(-w / 2, Math.min(w / 2, front)), 0, 0.03]} r={0.34} color="#ff9a3a" strength={0.5} />
        {Array.from({length: 18}, (_, i) => { const r = rnd(i * 13 + 2), life = 40, a = ((f + Math.floor(r() * life)) % life) / life, x = -w / 2 + r() * (b * 1.1 * w); return <mesh key={i} position={[x + Math.sin(a * 6 + i) * 0.03, 0.02 + a * 0.5, 0.04]} rotation={[0, 0, a * 3 + i]} scale={[0.018 + r() * 0.018, 0.012 + r() * 0.012, 1]} renderOrder={7}><planeGeometry /><meshBasicMaterial color={r() < 0.5 ? '#2a2420' : '#ffb24a'} transparent opacity={(1 - a) * 0.95} depthWrite={false} /></mesh>; })}</> : null}
    </group>
  );
};

// ---------------------------------------------------------------- a drop of water on hot iron
/** A drop falls from `from` to `to` (frames at-9 .. at), then at frame `at` it hisses: a burst of steam and a few sparks. */
export const GiotXeo: React.FC<{f: number; at: number; from: V3; to: V3}> = ({f, at, from, to}) => {
  const t = clamp((f - (at - 9)) / 9), p: V3 = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t * t, from[2] + (to[2] - from[2]) * t], d = f - at;
  return (
    <>
      {f >= at - 9 && f < at ? <mesh position={p} scale={[0.016, 0.03, 1]} renderOrder={540}><planeGeometry /><meshBasicMaterial color="#cfe6ff" transparent opacity={0.95} depthWrite={false} /></mesh> : null}
      {/* the hiss: ten puffs of steam rise and thin over about 30 frames, and a ring of white flash for the first two */}
      {d >= 0 && d < 34 ? Array.from({length: 10}, (_, i) => { const r = rnd(i * 7 + 3), born = Math.floor(r() * 12), a = d - born; if (a < 0 || a > 24) return null; const k = a / 24, sz = 0.13 + 0.3 * k;
        return <mesh key={i} position={[to[0] + (r() - 0.5) * 0.18 + Math.sin(a * 0.3 + i) * 0.02, to[1] + 0.04 + 0.5 * k, to[2] + 0.14]} scale={[sz, sz, 1]} renderOrder={560}><planeGeometry /><meshBasicMaterial map={dotTex()} color="#f4f0ea" transparent opacity={0.95 * (1 - k) * (k < 0.1 ? k / 0.1 : 1)} depthWrite={false} /></mesh>; }) : null}
      {d >= 0 && d < 3 ? <mesh position={[to[0], to[1], to[2] + 0.12]} scale={[0.16, 0.16, 1]} renderOrder={565}><planeGeometry /><meshBasicMaterial map={dotTex()} color="#ffffff" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh> : null}
      <SparkBurst f={f} at={at} pos={[to[0], to[1], to[2] + 0.1]} n={14} speed={0.9} seed={6} />
    </>
  );
};

// ---------------------------------------------------------------- carved stones piled by the path
/** A low heap of flat slate slabs (mani stones: each slab a little different, a pale painted band on some) with snow lying on top; w = its width in metres. Invented shapes, no inscription. */
export const DongDaKhac: React.FC<{pos: V3; w?: number; seed?: number; rotY?: number}> = ({pos, w = 1.4, seed = 1, rotY = 0}) => {
  const q = rnd(seed * 7 + 2), cols = ['#6e7088', '#80829a', '#5c5e76', '#8a8ca2'];
  const slabs = Array.from({length: 11}, (_, i) => { const row = i < 5 ? 0 : i < 9 ? 1 : 2, n = row === 0 ? 5 : row === 1 ? 4 : 2, k = row === 0 ? i : row === 1 ? i - 5 : i - 9, ww = (w / 5.2) * (0.8 + q() * 0.4);
    return {x: (k - (n - 1) / 2) * (w / 5.4) + (q() - 0.5) * 0.05, y: 0.07 + row * 0.13, z: (q() - 0.5) * 0.12, ww, c: cols[Math.floor(q() * 4)], band: q() < 0.4}; });
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {slabs.map((b, i) => <group key={i} position={[b.x, b.y, b.z]} rotation={[0, (q() - 0.5) * 0.4, (q() - 0.5) * 0.1]}>
        <mesh castShadow receiveShadow><boxGeometry args={[b.ww, 0.12, 0.26]} /><meshLambertMaterial color={b.c} /></mesh>
        {b.band ? <mesh position={[0, 0.01, 0.131]}><planeGeometry args={[b.ww * 0.8, 0.035]} /><meshLambertMaterial color="#e8e4ea" /></mesh> : null}
      </group>)}
      <mesh position={[0, 0.4, 0]} scale={[1, 0.4, 1]}><boxGeometry args={[w * 0.42, 0.1, 0.3]} /><meshLambertMaterial color="#f4f2f8" /></mesh>
      <mesh position={[0, 0.15, 0.04]} scale={[1, 0.3, 1]}><boxGeometry args={[w * 0.95, 0.1, 0.36]} /><meshLambertMaterial color="#f4f2f8" /></mesh>
    </group>
  );
};
