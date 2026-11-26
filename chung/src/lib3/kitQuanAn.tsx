import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {B} from './kit';
import {tex} from './kitLab';
import {Ctx, P, rnd, Sprite} from './depth';
import {FacetLathe} from './look';

/** lib3/kitQuanAn: QUÁN ĂN VEN ĐƯỜNG KIỂU MỸ giữa thế kỉ 20. Gạch men kem, sơn bạc hà, sàn ca rô, quầy đỏ viền thép, ghế đẩu đỏ, két tiền đồng kiểu cũ,
 *  đồ ăn vẽ phẳng ba bốn sắc có điểm sáng (bánh anh đào, bánh mì kẹp, cà phê), cùng con phố nắng ngoài cửa kính. Các món cầm tay (xấp tiền, ví, miếng bánh, ổ bánh)
 *  nhận `pos` để đặt theo bàn tay từng khung. Kiểu cắt giấy: mảng phẳng, mép sắc, không khối cầu. */
type V3 = [number, number, number];
const CHROME = '#c7d1d6', CHROME_DK = '#78858c', CHROME_HI = '#f0f5f6', RED = '#c9322f', RED_DK = '#8e1f25', CREAM = '#f2e8d0', CREAM_DK = '#d6c8a6', INK = '#2c3038', BRASS = '#cb9c48', BRASS_DK = '#86601f', BRASS_HI = '#f0cf80';

const tron = (c: Ctx, x: number, y: number, r: number, f: string) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = f; c.fill(); };
const elip = (c: Ctx, x: number, y: number, rx: number, ry: number, f: string, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fillStyle = f; c.fill(); };
const hop = (c: Ctx, x: number, y: number, w: number, h: number, f: string) => { c.fillStyle = f; c.fillRect(x, y, w, h); };

/** một tấm phẳng có hình, nằm trên một bề mặt */
export const Tam: React.FC<{k: string; px: [number, number]; paint: (c: Ctx, W: number, H: number) => void; p: V3; s: [number, number]; r?: V3; lit?: boolean; alpha?: boolean; order?: number; op?: number}> =
  ({k, px, paint, p, s, r, lit = true, alpha = false, order, op = 1}) => {
    const t = tex(k, px[0], px[1], paint);
    return <mesh position={p} rotation={r} receiveShadow={lit} userData={{noRecv: !lit}} renderOrder={order}><planeGeometry args={s} />{lit ? <meshLambertMaterial map={t} transparent={alpha} opacity={op} depthWrite={!alpha} /> : <meshBasicMaterial map={t} transparent={alpha} opacity={op} depthWrite={!alpha} />}</mesh>;
  };

// ---------------------------------------------------------------- bề mặt của phòng
/** tường: gạch men kem ô vuông tới 1,2 m, nẹp đỏ đen, trên sơn bạc hà có vệt lăn, gờ trắng dưới trần, chân tường tối */
export const paintTuongQuan = (wM: number, hM: number, seed = 1) => (c: Ctx, W: number, H: number) => {
  const sx = W / wM, sy = H / hM, top = H - 1.2 * sy, r = rnd(seed);
  hop(c, 0, 0, W, top, '#aee0cf');
  for (let x = 0; x < W;) { const w = (0.3 + r() * 0.55) * sx; hop(c, x, 0, w, top, r() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(40,118,102,0.055)'); x += w; }
  for (let i = 0; i < 9; i++) { const x = r() * W, y = 0.3 * sy + r() * (top - 0.6 * sy); hop(c, x, y, (0.03 + r() * 0.05) * sx, (0.12 + r() * 0.3) * sy, 'rgba(70,130,112,0.08)'); }
  hop(c, 0, 0, W, 0.11 * sy, '#83c6b1'); hop(c, 0, 0.11 * sy, W, 0.04 * sy, '#f6f1e2'); hop(c, 0, 0.15 * sy, W, 0.012 * sy, '#68a895');
  const t = 0.15, tones = ['#f6eeda', '#f1e8d1', '#ebe1c8', '#f8f2e2', '#efe5cc'], tw = t * sx, th = t * sy;
  for (let j = 0; j * t < 1.2; j++) for (let i = 0; i * t < wM; i++) {
    const x = i * tw, y = top + j * th; hop(c, x, y, tw, th, tones[Math.floor(r() * tones.length)]); hop(c, x + 3, y + 3, tw * 0.42, 2, 'rgba(255,255,255,0.65)');
    if (r() < 0.035) hop(c, x + tw * r() * 0.6, y + th * 0.55, tw * 0.3, th * 0.3, 'rgba(150,126,86,0.2)');
  }
  c.fillStyle = '#baae90'; for (let i = 0; i * t <= wM; i++) c.fillRect(i * tw - 1, top, 2, H - top); for (let j = 0; j * t <= 1.2; j++) c.fillRect(0, top + j * th - 1, W, 2);
  hop(c, 0, top - 0.035 * sy, W, 0.05 * sy, RED); hop(c, 0, top - 0.035 * sy, W, 0.012 * sy, '#e8675a'); hop(c, 0, top + 0.015 * sy, W, 0.012 * sy, INK);
  hop(c, 0, H - 0.11 * sy, W, 0.11 * sy, '#474c55'); hop(c, 0, H - 0.11 * sy, W, 0.015 * sy, '#7b828b');
};
/** sàn ca rô đen trắng: mỗi ô một sắc hơi khác, vết giày, chỗ mòn trước quầy */
export const paintSanCaRo = (c: Ctx, W: number, H: number) => {
  const n = 24, m = Math.round(n * H / W), tw = W / n, th = H / m, r = rnd(5), dark = ['#3b414b', '#434954', '#373d46', '#3f4550'], light = ['#f1ead8', '#ebe3cf', '#f5efdf', '#e6dec8'];
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { const a = (i + j) % 2 === 0; hop(c, i * tw, j * th, tw + 1, th + 1, (a ? dark : light)[Math.floor(r() * 4)]); hop(c, i * tw + 3, j * th + 3, tw * 0.35, 2, a ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'); }
  c.strokeStyle = 'rgba(30,32,38,0.34)'; c.lineWidth = 1.4; for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * tw, 0); c.lineTo(i * tw, H); c.stroke(); } for (let j = 0; j <= m; j++) { c.beginPath(); c.moveTo(0, j * th); c.lineTo(W, j * th); c.stroke(); }
  c.lineCap = 'round'; for (let i = 0; i < 46; i++) { const x = r() * W, y = r() * H, a = r() * 6.3, l = 8 + r() * 26; c.strokeStyle = r() < 0.5 ? 'rgba(25,26,30,0.2)' : 'rgba(255,255,255,0.16)'; c.lineWidth = 1.5 + r() * 2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.6, y + Math.sin(a) * l * 0.2, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
};
/** trần thiếc dập ô vuông, kem */
export const paintTranThiec = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#f3edda'); const u = W / 18;
  for (let j = 0; j * u < H; j++) for (let i = 0; i < 18; i++) { const x = i * u, y = j * u; hop(c, x + 3, y + 3, u - 6, u - 6, (i + j) % 2 ? '#efe7d2' : '#f6f0df'); P(c, [[x + u / 2, y + u * 0.16], [x + u * 0.84, y + u / 2], [x + u / 2, y + u * 0.84], [x + u * 0.16, y + u / 2]], '#e2d8bf'); P(c, [[x + u / 2, y + u * 0.3], [x + u * 0.7, y + u / 2], [x + u / 2, y + u * 0.7], [x + u * 0.3, y + u / 2]], '#f8f3e5'); }
  c.fillStyle = '#c9bea2'; for (let i = 0; i <= 18; i++) c.fillRect(i * u - 1, 0, 2, H); for (let j = 0; j * u <= H; j++) c.fillRect(0, j * u - 1, W, 2);
};
const paintVanQuay = (c: Ctx, W: number, H: number) => {
  const r = rnd(9); let x = 0; while (x < W) { const w = W / 60 * (0.9 + r() * 0.2); hop(c, x, 0, w, H, ['#f3ead4', '#ece2c9', '#f6efdd', '#e8ddc2'][Math.floor(r() * 4)]); hop(c, x, 0, 2, H, '#b8ab8b'); hop(c, x + 3, 0, 2, H, 'rgba(255,255,255,0.6)'); if (r() < 0.4) hop(c, x + w * 0.5, H * r() * 0.7, 1.5, H * 0.18, 'rgba(160,136,96,0.3)'); x += w; }
  hop(c, 0, H * 0.84, W, H * 0.16, 'rgba(120,96,60,0.09)');
  for (let i = 0; i < 26; i++) { const a = r() * W, b = H * 0.62 + r() * H * 0.36; c.strokeStyle = 'rgba(70,60,48,0.2)'; c.lineWidth = 2; c.beginPath(); c.moveTo(a, b); c.lineTo(a + 8 + r() * 22, b + (r() - 0.5) * 8); c.stroke(); }
};
/** mặt quầy formica đỏ, hoa văn boomerang nhỏ */
const paintMatQuay = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#cf3733'); const r = rnd(12);
  for (let i = 0; i < 420; i++) { const x = r() * W, y = r() * H, a = r() * 6.3, l = 5 + r() * 7; c.strokeStyle = ['#e2605a', '#a7262a', '#ee8a7c'][Math.floor(r() * 3)]; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); c.lineTo(x, y); c.lineTo(x + Math.cos(a + 1) * l, y + Math.sin(a + 1) * l); c.stroke(); }
  for (let i = 0; i < 7; i++) { const x = r() * W; P(c, [[x, 0], [x + 26, 0], [x - 34, H], [x - 60, H]], 'rgba(255,255,255,0.075)'); }
};

// ---------------------------------------------------------------- phố ngoài cửa kính (tấm thật theo độ sâu, có thị sai khi máy đi)
const paintTroiPho = (c: Ctx, W: number, H: number) => {
  ['#8fcdec', '#a4d8f0', '#b9e2f3', '#cfebf4', '#e2f2f3'].forEach((f, i) => hop(c, 0, (H * i) / 5, W, H / 5 + 1, f));
  const r = rnd(4); for (let i = 0; i < 12; i++) { const x = r() * W, y = H * (0.12 + r() * 0.5), s = 40 + r() * 80; [[0, 0, 1], [-0.9, 0.16, 0.66], [0.9, 0.16, 0.72], [1.7, 0.26, 0.42]].forEach(([a, b, k]) => elip(c, x + a * s, y + b * s, s * k, s * k * 0.42, '#fbfdf9')); hop(c, x - s * 2, y + s * 0.26, s * 4.4, s * 0.16, '#fbfdf9'); }
};
const paintPhoXa = (c: Ctx, W: number, H: number) => {
  const r = rnd(8); let x = -10;
  while (x < W) { const w = 50 + r() * 110, h = H * (0.32 + r() * 0.6), y = H - h, f = ['#a9c2d4', '#b6cbd9', '#9db9cc', '#c2d3de'][Math.floor(r() * 4)]; hop(c, x, y, w, h, f); hop(c, x + w * 0.72, y, w * 0.28, h, 'rgba(70,104,132,0.15)'); if (r() < 0.4) hop(c, x + w * 0.42, y - 18, 5, 18, f); for (let a = y + 8; a < H - 6; a += 12) for (let b = x + 6; b < x + w - 7; b += 11) if (r() < 0.62) hop(c, b, a, 5, 6, 'rgba(84,118,146,0.42)'); x += w + r() * 4; }
};
/** dãy cửa hàng gạch bên kia đường: cửa sổ tầng trên, mái hiên sọc, tủ kính, gờ tường */
const paintMatPho = (c: Ctx, W: number, H: number) => {
  const r = rnd(21), cols = [['#b4583f', '#96452f'], ['#c9a877', '#ab8a5c'], ['#a84f42', '#8a3d34'], ['#8f9aa0', '#747f85'], ['#c06c4a', '#a15638'], ['#d3b98f', '#b59a70']];
  let x = 0, n = 0;
  while (x < W) {
    const w = 300 + r() * 170, [f, d] = cols[n++ % cols.length], top = H * (0.04 + r() * 0.14), base = H * 0.6; hop(c, x, top, w, H - top, f);
    for (let a = top + 6; a < base; a += 7) { const off = Math.round((a - top) / 7) % 2 ? 0 : 7; for (let b = x + off; b < x + w; b += 15) hop(c, b, a, 1, 6, 'rgba(70,32,24,0.2)'); hop(c, x, a, w, 1, 'rgba(70,32,24,0.17)'); }
    hop(c, x, top, w, 11, d); hop(c, x - 2, top + 11, w + 4, 4, '#ece2cc'); hop(c, x + w - 5, top, 5, H - top, 'rgba(50,30,24,0.3)');
    for (let b = x + 26; b < x + w - 52; b += 66) for (const a of [top + 28, top + 92]) if (a + 44 < base - 8) { hop(c, b - 3, a - 3, 42, 54, '#ece2cc'); hop(c, b, a, 36, 46, '#7fa5b8'); P(c, [[b, a + 30], [b + 22, a], [b + 34, a], [b, a + 44]], '#b9d7e2'); hop(c, b + 17, a, 2, 46, '#ece2cc'); hop(c, b, a + 22, 36, 2, '#ece2cc'); hop(c, b - 5, a + 49, 46, 5, d); }
    const sh = base + 28; hop(c, x + 8, sh, w - 16, H - sh, '#8fb3c2'); P(c, [[x + 14, H], [x + 74, sh], [x + 112, sh], [x + 52, H]], '#c3dde4'); P(c, [[x + 130, H], [x + 190, sh], [x + 204, sh], [x + 144, H]], '#b5d3dc');
    for (let b = x + 18; b < x + w - 26; b += 24) { const t = 8 + r() * 20; hop(c, b, H - 12 - t, 15, t, ['#e0c05e', '#d8664e', '#7fc0a8', '#f0e8d6'][Math.floor(r() * 4)]); }
    const dw = 44, dx = x + w * 0.56; hop(c, dx, sh - 2, dw, H - sh + 2, '#6c3f2c'); hop(c, dx + 7, sh + 7, dw - 14, 54, '#a9c9d4');
    const aw = n % 2 ? [RED, '#f6efe0'] : ['#2f7f79', '#f6efe0'], s = (w - 8) / 16; for (let i = 0; i < 16; i++) P(c, [[x + 4 + i * s, base], [x + 4 + (i + 1) * s, base], [x + (i + 1) * s * 1.02, base + 34], [x + i * s * 1.02, base + 34]], aw[i % 2]); hop(c, x + 2, base + 34, w - 4, 4, 'rgba(40,30,28,0.4)');
    hop(c, x + w * 0.16, base - 26, w * 0.68, 21, '#f3e6c6'); hop(c, x + w * 0.16, base - 26, w * 0.68, 3, d); hop(c, x + w * 0.23, base - 19, w * 0.32, 5, d); hop(c, x + w * 0.58, base - 19, w * 0.18, 5, d);
    x += w;
  }
};
const paintDuongPho = (c: Ctx, W: number, H: number) => {
  const zy = (z: number) => ((-6 - z) / 19) * H, r = rnd(6), near = H - zy(-9.6) , far = H - zy(-22);
  hop(c, 0, 0, W, H, '#e0d8c6');
  for (let x = 0; x < W; x += 54) hop(c, x, 0, 2, H, 'rgba(120,108,88,0.45)'); for (let y = 0; y < H; y += 26) hop(c, 0, y, W, 2, 'rgba(120,108,88,0.36)');
  hop(c, 0, far, W, near - far, '#6e7379'); for (let i = 0; i < 900; i++) hop(c, r() * W, far + r() * (near - far), 3 + r() * 5, 1.5, r() < 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(25,28,32,0.14)');
  const mid = (far + near) / 2; for (let x = 8; x < W; x += 76) hop(c, x, mid - 2.5, 42, 5, '#efdf9b');
  hop(c, 0, near - 7, W, 7, '#b7b2a6'); hop(c, 0, near - 2, W, 2, '#4d5057'); hop(c, 0, far, W, 6, '#b7b2a6'); hop(c, 0, far + 6, W, 2, '#4d5057');
};
/** xe hơi tròn trĩnh màu bạc hà, nhìn ngang, mui trắng, cản mạ, lốp viền trắng */
export const paintXeBacHa = (c: Ctx, W: number, H: number) => {
  const u = W / 1000, X = (x: number) => x * u, Y = (y: number) => y * u;
  const body = (f: string) => { c.beginPath(); c.moveTo(X(26), Y(258)); c.quadraticCurveTo(X(16), Y(186), X(112), Y(168)); c.lineTo(X(250), Y(150)); c.quadraticCurveTo(X(318), Y(60), X(410), Y(50)); c.lineTo(X(630), Y(50)); c.quadraticCurveTo(X(716), Y(62), X(778), Y(146)); c.lineTo(X(900), Y(166)); c.quadraticCurveTo(X(978), Y(182), X(974), Y(262)); c.lineTo(X(26), Y(262)); c.closePath(); c.fillStyle = f; c.fill(); };
  elip(c, X(500), Y(322), X(450), Y(18), 'rgba(40,44,48,0.42)'); body('#8fd6c0');
  c.save(); body('#8fd6c0'); c.clip(); hop(c, 0, Y(214), W, Y(60), '#62ad97'); hop(c, 0, 0, W, Y(136), '#f4f0e2'); P(c, [[X(130), Y(150)], [X(860), Y(150)], [X(910), Y(182)], [X(100), Y(182)]], '#b9ecdb'); c.restore();
  c.beginPath(); c.moveTo(X(282), Y(150)); c.quadraticCurveTo(X(335), Y(78), X(414), Y(70)); c.lineTo(X(494), Y(70)); c.lineTo(X(494), Y(150)); c.closePath(); c.fillStyle = '#4f7f96'; c.fill();
  c.beginPath(); c.moveTo(X(514), Y(70)); c.lineTo(X(626), Y(70)); c.quadraticCurveTo(X(696), Y(84), X(744), Y(150)); c.lineTo(X(514), Y(150)); c.closePath(); c.fill();
  P(c, [[X(330), Y(148)], [X(392), Y(76)], [X(430), Y(74)], [X(372), Y(148)]], '#a8d8e4'); P(c, [[X(560), Y(148)], [X(612), Y(74)], [X(640), Y(76)], [X(592), Y(148)]], '#a8d8e4');
  hop(c, X(150), Y(198), X(700), Y(7), CHROME_HI); hop(c, X(150), Y(205), X(700), Y(3), CHROME_DK); hop(c, X(496), Y(152), X(4), Y(100), '#4f8f7d'); hop(c, X(440), Y(170), X(34), Y(7), CHROME_HI); hop(c, X(700), Y(170), X(34), Y(7), CHROME_HI);
  [[218, 268], [782, 268]].forEach(([x, y]) => { c.beginPath(); c.arc(X(x), Y(y), X(84), Math.PI, 0); c.fillStyle = '#3f6f61'; c.fill(); tron(c, X(x), Y(y), X(62), '#23262b'); tron(c, X(x), Y(y), X(42), '#f6f3ea'); tron(c, X(x), Y(y), X(27), CHROME); tron(c, X(x), Y(y), X(9), CHROME_DK); });
  hop(c, X(6), Y(246), X(116), Y(20), CHROME); hop(c, X(6), Y(246), X(116), Y(6), CHROME_HI); hop(c, X(884), Y(246), X(110), Y(20), CHROME); hop(c, X(884), Y(246), X(110), Y(6), CHROME_HI);
  elip(c, X(58), Y(198), X(20), Y(17), '#fff4c6'); elip(c, X(952), Y(204), X(13), Y(16), '#e24a3f');
};
const paintCotDien = (c: Ctx, W: number, H: number) => {
  const cx = W / 2, top = H * 0.05, g = '#6b5a48', w = W / 280;
  hop(c, cx - w, top, w * 2, H - top, g); hop(c, cx - w, top, w * 0.7, H - top, '#8b7760');
  [0.1, 0.17].forEach((k) => { hop(c, cx - W * 0.03, H * k, W * 0.06, H * 0.012, g); [-1, -0.45, 0.45, 1].forEach((a) => hop(c, cx + a * W * 0.028 - 2, H * k - 7, 4, 8, '#dfe6e6')); });
  hop(c, cx + w, H * 0.25, W * 0.008, H * 0.08, '#8d969b');
  c.strokeStyle = 'rgba(46,50,56,0.75)'; c.lineWidth = 2; [[0.1, -1], [0.1, -0.45], [0.1, 0.45], [0.1, 1], [0.17, -1], [0.17, 1]].forEach(([k, a]) => { const x = cx + a * W * 0.028, y = H * k - 7; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (a < 0 ? -1 : 1) * W * 0.25, y + H * 0.12, a < 0 ? 0 : W, y + H * 0.03); c.stroke(); });
};
const paintCayPho = (c: Ctx, W: number, H: number) => {
  const r = rnd(14); P(c, [[W * 0.47, H], [W * 0.46, H * 0.46], [W * 0.54, H * 0.46], [W * 0.53, H]], '#6a4f3a'); P(c, [[W * 0.5, H], [W * 0.495, H * 0.46], [W * 0.54, H * 0.46], [W * 0.53, H]], '#4f3a2b');
  P(c, [[W * 0.49, H * 0.6], [W * 0.3, H * 0.4], [W * 0.33, H * 0.38], [W * 0.5, H * 0.53]], '#5a4332'); P(c, [[W * 0.51, H * 0.56], [W * 0.72, H * 0.38], [W * 0.74, H * 0.41], [W * 0.53, H * 0.62]], '#4f3a2b');
  const blobs: [number, number, number, string][] = []; for (let i = 0; i < 36; i++) { const a = r() * 6.3, d = Math.sqrt(r()), x = W * 0.5 + Math.cos(a) * d * W * 0.38, y = H * 0.3 + Math.sin(a) * d * H * 0.22; blobs.push([x, y, W * (0.07 + r() * 0.06), y < H * 0.25 ? '#7fb564' : x > W * 0.56 ? '#4b8650' : '#62a058']); }
  blobs.sort((a, b) => b[1] - a[1]).forEach(([x, y, s, f]) => tron(c, x, y, s, f)); for (let i = 0; i < 60; i++) { const a = r() * 6.3, d = Math.sqrt(r()); tron(c, W * 0.5 + Math.cos(a) * d * W * 0.38, H * 0.28 + Math.sin(a) * d * H * 0.22, W * 0.012, r() < 0.5 ? '#a4cf7f' : '#3f7646'); }
  hop(c, W * 0.34, H * 0.975, W * 0.32, H * 0.025, '#7d6d58');
};
const paintVoiNuoc = (c: Ctx, W: number, H: number) => {
  hop(c, W * 0.28, H * 0.86, W * 0.44, H * 0.14, '#a82a26'); hop(c, W * 0.34, H * 0.28, W * 0.32, H * 0.6, RED); hop(c, W * 0.34, H * 0.28, W * 0.1, H * 0.6, '#e15d50'); hop(c, W * 0.57, H * 0.28, W * 0.09, H * 0.6, RED_DK);
  hop(c, W * 0.14, H * 0.48, W * 0.72, H * 0.16, RED); hop(c, W * 0.14, H * 0.48, W * 0.72, H * 0.05, '#e15d50'); hop(c, W * 0.08, H * 0.5, W * 0.1, H * 0.12, CHROME); hop(c, W * 0.82, H * 0.5, W * 0.1, H * 0.12, CHROME);
  c.beginPath(); c.moveTo(W * 0.3, H * 0.28); c.quadraticCurveTo(W * 0.5, H * 0.02, W * 0.7, H * 0.28); c.closePath(); c.fillStyle = '#e15d50'; c.fill(); hop(c, W * 0.45, 0, W * 0.1, H * 0.1, RED_DK);
};
const paintDongHoDo = (c: Ctx, W: number, H: number) => {
  hop(c, W * 0.44, H * 0.5, W * 0.12, H * 0.5, '#596268'); hop(c, W * 0.44, H * 0.5, W * 0.04, H * 0.5, '#7a848a');
  P(c, [[W * 0.2, H * 0.38], [W * 0.32, H * 0.08], [W * 0.68, H * 0.08], [W * 0.8, H * 0.38], [W * 0.66, H * 0.52], [W * 0.34, H * 0.52]], '#5f696f'); P(c, [[W * 0.36, H * 0.16], [W * 0.64, H * 0.16], [W * 0.68, H * 0.32], [W * 0.32, H * 0.32]], '#e9edd8'); hop(c, W * 0.47, H * 0.2, W * 0.06, H * 0.08, RED);
};
const paintHopBao = (c: Ctx, W: number, H: number) => {
  hop(c, W * 0.12, H * 0.72, W * 0.1, H * 0.28, '#4a5158'); hop(c, W * 0.78, H * 0.72, W * 0.1, H * 0.28, '#4a5158'); hop(c, W * 0.06, H * 0.08, W * 0.88, H * 0.68, '#2f6fa4'); hop(c, W * 0.06, H * 0.08, W * 0.26, H * 0.68, '#4b8dc1'); hop(c, W * 0.06, H * 0.08, W * 0.88, H * 0.07, '#1e4c74');
  hop(c, W * 0.16, H * 0.2, W * 0.68, H * 0.32, '#c9dde4'); hop(c, W * 0.22, H * 0.25, W * 0.56, H * 0.24, '#f3efe2'); hop(c, W * 0.27, H * 0.29, W * 0.46, H * 0.04, INK); hop(c, W * 0.27, H * 0.36, W * 0.22, H * 0.09, '#8d8f8a'); hop(c, W * 0.53, H * 0.36, W * 0.2, H * 0.015, '#8d8f8a'); hop(c, W * 0.53, H * 0.4, W * 0.2, H * 0.015, '#8d8f8a');
  hop(c, W * 0.4, H * 0.58, W * 0.2, H * 0.05, CHROME);
};
const paintBoCau = (c: Ctx, W: number, H: number) => { elip(c, W * 0.46, H * 0.56, W * 0.34, H * 0.28, '#8d97a4'); P(c, [[W * 0.3, H * 0.46], [W * 0.78, H * 0.52], [W, H * 0.72], [W * 0.46, H * 0.74]], '#6c7785'); tron(c, W * 0.18, H * 0.34, W * 0.13, '#5d7d8c'); P(c, [[W * 0.06, H * 0.32], [0, H * 0.4], [W * 0.09, H * 0.42]], '#d9a14a'); hop(c, W * 0.38, H * 0.82, W * 0.03, H * 0.18, '#c8574a'); hop(c, W * 0.52, H * 0.82, W * 0.03, H * 0.18, '#c8574a'); };

/** phố ngoài cửa kính: trời, nhà xa, dãy cửa hàng gạch, lòng đường, xe bạc hà, cột điện, cây, trụ nước, hộp báo, bồ câu. Tự sáng, không ăn đèn trong quán */
export const PhoNgoaiKinh: React.FC = () => (
  <group>
    <Tam k="qa-troi" px={[1600, 700]} paint={paintTroiPho} p={[0, 17, -72]} s={[170, 74]} lit={false} />
    <Tam k="qa-pho-xa" px={[2200, 320]} paint={paintPhoXa} p={[0, 9.8, -46]} s={[132, 19.2]} lit={false} alpha order={1} />
    <Tam k="qa-mat-pho" px={[3200, 460]} paint={paintMatPho} p={[0, 5.6, -25]} s={[78, 11.2]} lit={false} />
    <Tam k="qa-duong" px={[2100, 570]} paint={paintDuongPho} p={[0, -0.02, -15.5]} s={[78, 19]} r={[-Math.PI / 2, 0, 0]} lit={false} />
    <Sprite name="qa-cay-pho" art={paintCayPho} px={[520, 760]} w={3.2} pos={[0.95, 0, -8.8]} lit={false} cast={false} shade={0.16} />
    <Tam k="qa-cot-dien" px={[3000, 720]} paint={paintCotDien} p={[5.0, 4.2, -8.9]} s={[35, 8.4]} lit={false} alpha order={2} />
    <Sprite name="qa-xe-bac-ha" art={paintXeBacHa} px={[1000, 340]} w={4.7} pos={[4.9, -0.02, -11.3]} lit={false} cast={false} shade={0} />
    <Sprite name="qa-tru-nuoc" art={paintVoiNuoc} px={[150, 220]} w={0.42} pos={[3.72, 0, -8.5]} lit={false} cast={false} shade={0.16} />
    <Sprite name="qa-dong-ho-do" art={paintDongHoDo} px={[120, 340]} w={0.42} pos={[1.68, 0, -9.3]} lit={false} cast={false} shade={0.1} />
    <Sprite name="qa-hop-bao" art={paintHopBao} px={[240, 300]} w={0.62} pos={[3.15, 0, -7.2]} lit={false} cast={false} shade={0.18} />
    <Sprite name="qa-bo-cau-1" art={paintBoCau} px={[120, 90]} w={0.3} pos={[2.15, 0, -7.6]} lit={false} cast={false} shade={0.1} />
    <Sprite name="qa-bo-cau-2" art={paintBoCau} px={[120, 90]} w={0.27} pos={[2.62, 0, -8.0]} flip lit={false} cast={false} shade={0.1} />
  </group>
);

// ---------------------------------------------------------------- cửa kính, chuông, ô kính
const paintChuNguoc = (c: Ctx, W: number, H: number) => { c.save(); c.translate(W, 0); c.scale(-1, 1); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${H * 0.62}px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif`; c.lineJoin = 'round'; c.lineWidth = H * 0.11; c.strokeStyle = 'rgba(255,248,226,0.82)'; c.strokeText('ĂN UỐNG', W / 2, H * 0.54); c.fillStyle = 'rgba(205,54,46,0.86)'; c.fillText('ĂN UỐNG', W / 2, H * 0.54); c.restore(); };
const paintPhanChieu = (c: Ctx, W: number, H: number) => { P(c, [[W * 0.1, H], [W * 0.46, 0], [W * 0.62, 0], [W * 0.26, H]], 'rgba(255,255,255,0.13)'); P(c, [[W * 0.33, H], [W * 0.69, 0], [W * 0.74, 0], [W * 0.38, H]], 'rgba(255,255,255,0.1)'); };

export const ChuongCua: React.FC<{pos: V3; lac?: number}> = ({pos, lac = 0}) => (
  <group position={pos}>
    <B p={[0, 0.03, -0.05]} s={[0.05, 0.05, 0.12]} c={BRASS_DK} cast={false} />
    <B p={[0, 0.03, 0.02]} s={[0.16, 0.014, 0.022]} c={BRASS_HI} cast={false} />
    <group rotation={[0, 0, lac * 0.55]}>
      <B p={[0, -0.03, 0.02]} s={[0.012, 0.08, 0.012]} c={BRASS_DK} cast={false} />
      <FacetLathe profile={[[0.012, 0.13], [0.035, 0.115], [0.046, 0.075], [0.058, 0.03], [0.082, 0]]} sides={10} color={BRASS} pos={[0, -0.2, 0.02]} cast={false} contact={false} />
      <B p={[-0.024, -0.135, 0.078]} s={[0.012, 0.075, 0.004]} c={BRASS_HI} cast={false} />
      <B p={[lac * 0.02, -0.215, 0.02]} s={[0.02, 0.03, 0.02]} c={BRASS_DK} cast={false} />
    </group>
  </group>
);
/** cửa kính khung nhôm, bản lề bên phải, mở ra phía phố; chữ ĂN UỐNG ngược ngang ngực người đứng ngoài. mo 0..1 */
export const CuaKinhQuan: React.FC<{mo?: number; chuong?: number}> = ({mo = 0, chuong = 0}) => {
  const L = 1.04, Hd = 2.26;
  return (
    <group>
      <B p={[1.85, 1.16, -6.11]} s={[0.07, 2.32, 0.16]} c={CHROME_DK} /><B p={[2.95, 1.16, -6.11]} s={[0.07, 2.32, 0.16]} c={CHROME_DK} /><B p={[2.4, 2.32, -6.11]} s={[1.17, 0.07, 0.16]} c={CHROME_DK} />
      <B p={[1.835, 1.16, -6.02]} s={[0.018, 2.32, 0.012]} c={CHROME_HI} cast={false} /><B p={[2.4, 2.305, -6.02]} s={[1.14, 0.016, 0.012]} c={CHROME_HI} cast={false} />
      <group position={[2.92, 0.02, -6.12]} rotation={[0, -mo * 1.2, 0]}>
        <B p={[-0.03, Hd / 2, 0]} s={[0.06, Hd, 0.05]} c={CHROME} /><B p={[-L + 0.03, Hd / 2, 0]} s={[0.06, Hd, 0.05]} c={CHROME} /><B p={[-L / 2, Hd - 0.03, 0]} s={[L, 0.06, 0.05]} c={CHROME} />
        <B p={[-L / 2, 0.16, 0]} s={[L, 0.32, 0.05]} c={CHROME} /><B p={[-L / 2, 0.31, 0.027]} s={[L - 0.12, 0.014, 0.004]} c={CHROME_DK} cast={false} />{[0.08, 0.14, 0.2, 0.26].map((y) => <B key={y} p={[-L / 2, y, 0.027]} s={[L - 0.2, 0.006, 0.003]} c={CHROME_DK} cast={false} />)}
        <mesh position={[-L / 2, 1.3, 0]} renderOrder={6}><planeGeometry args={[L - 0.12, 1.9]} /><meshBasicMaterial color="#d9f2f4" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} /></mesh>
        <Tam k="qa-phan-chieu-cua" px={[260, 460]} paint={paintPhanChieu} p={[-L / 2, 1.3, 0.004]} s={[L - 0.12, 1.9]} lit={false} alpha order={7} />
        <Tam k="qa-chu-nguoc" px={[720, 180]} paint={paintChuNguoc} p={[-L / 2, 1.3, 0.008]} s={[0.86, 0.215]} lit={false} alpha order={8} />
        <B p={[-L + 0.13, 1.06, 0.06]} s={[0.035, 0.34, 0.025]} c={CHROME_HI} /><B p={[-L + 0.13, 1.2, 0.04]} s={[0.03, 0.02, 0.05]} c={CHROME_DK} cast={false} /><B p={[-L + 0.13, 0.92, 0.04]} s={[0.03, 0.02, 0.05]} c={CHROME_DK} cast={false} />
      </group>
      <ChuongCua pos={[2.08, 2.36, -5.97]} lac={chuong} />
    </group>
  );
};
/** ô kính lớn có khung nhôm, bậu kem, vệt phản chiếu */
export const OKinh: React.FC<{x0: number; x1: number; y0: number; y1: number; k: string}> = ({x0, x1, y0, y1, k}) => {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0;
  return (
    <group>
      {[x0, x1].map((x) => <B key={x} p={[x, cy, -6.11]} s={[0.065, h + 0.07, 0.15]} c={CHROME_DK} />)}
      <B p={[cx, y1, -6.11]} s={[w + 0.07, 0.065, 0.15]} c={CHROME_DK} /><B p={[cx, y0 - 0.02, -5.95]} s={[w + 0.14, 0.05, 0.2]} c="#f4eddc" /><B p={[cx, y0 - 0.05, -5.92]} s={[w + 0.12, 0.012, 0.16]} c="#9d927c" cast={false} />
      <mesh position={[cx, cy, -6.12]} renderOrder={6}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#d9f2f4" transparent opacity={0.1} depthWrite={false} /></mesh>
      <Tam k={`qa-phan-chieu-${k}`} px={[360, 460]} paint={paintPhanChieu} p={[cx, cy, -6.115]} s={[w, h]} lit={false} alpha order={7} />
    </group>
  );
};

// ---------------------------------------------------------------- vệt nắng cắt giấy
const catVung = (pts: number[][], x0: number, x1: number, z0: number, z1: number) => {
  const cut = (poly: number[][], inside: (a: number[]) => boolean, at: (a: number[], b: number[]) => number[]) => { const out: number[][] = []; poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) out.push(at(a, b)); }); return out; };
  const atX = (v: number) => (a: number[], b: number[]) => [v, a[1] + ((b[1] - a[1]) * (v - a[0])) / (b[0] - a[0])], atZ = (v: number) => (a: number[], b: number[]) => [a[0] + ((b[0] - a[0]) * (v - a[1])) / (b[1] - a[1]), v];
  let p = cut(pts, (a) => a[0] >= x0, atX(x0)); if (p.length) p = cut(p, (a) => a[0] <= x1, atX(x1)); if (p.length) p = cut(p, (a) => a[1] >= z0, atZ(z0)); if (p.length) p = cut(p, (a) => a[1] <= z1, atZ(z1));
  return p;
};
/** hình các ô cửa in lên một mặt ngang cao h theo hướng nắng, mép sắc. o = [x0, x1, y0, y1] của từng ô ở mặt kính z -6,1; vung = [x0, x1, z0, z1] giữ vệt trong mặt đó */
export const VetNang: React.FC<{o: [number, number, number, number][]; h: number; vung: [number, number, number, number]; color?: string; op?: number; order?: number}> = ({o, h, vung, color = '#ffe9b0', op = 0.34, order = 2}) => {
  const geo = useMemo(() => {
    const v: number[] = [], D = (y: number) => (y - h) * 2.7, X = (x: number, y: number) => x - D(y) * 0.543;
    o.forEach(([x0, x1, y0, y1]) => { const a = Math.max(y0, h), q = catVung([[X(x0, a), -6.1 + D(a)], [X(x1, a), -6.1 + D(a)], [X(x1, y1), -6.1 + D(y1)], [X(x0, y1), -6.1 + D(y1)]], vung[0], vung[1], vung[2], vung[3]); for (let i = 1; i + 1 < q.length; i++) v.push(q[0][0], h, q[0][1], q[i][0], h, q[i][1], q[i + 1][0], h, q[i + 1][1]); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); return g;
  }, [JSON.stringify(o), h, JSON.stringify(vung)]);
  return <mesh geometry={geo} renderOrder={order}><meshBasicMaterial color={color} transparent opacity={op} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
};

// ---------------------------------------------------------------- bếp sau ô chuyển món
const paintTuongBep = (c: Ctx, W: number, H: number) => {
  const r = rnd(3), u = W / 16; for (let j = 0; j * u < H; j++) for (let i = 0; i < 16; i++) hop(c, i * u, j * u, u, u, ['#f6e9c9', '#f2e2bc', '#f9efd6'][Math.floor(r() * 3)]);
  c.fillStyle = '#c8b48c'; for (let i = 0; i <= 16; i++) c.fillRect(i * u - 1, 0, 2, H); for (let j = 0; j * u <= H; j++) c.fillRect(0, j * u - 1, W, 2);
  for (let i = 0; i < 5; i++) { const x = r() * W; P(c, [[x, H * 0.3], [x + 16, H * 0.3], [x + 28, H], [x - 6, H]], 'rgba(160,120,70,0.13)'); }
};
export const BepSau: React.FC = () => (
  <group>
    <B p={[-2.4, 1.75, -7.65]} s={[2.5, 2.2, 0.1]} c="#f1dfb7" />
    <Tam k="qa-tuong-bep" px={[800, 700]} paint={paintTuongBep} p={[-2.4, 1.75, -7.59]} s={[2.5, 2.2]} lit={false} />
    <B p={[-3.65, 1.75, -6.9]} s={[0.1, 2.2, 1.4]} c="#d9c69c" /><B p={[-1.15, 1.75, -6.9]} s={[0.1, 2.2, 1.4]} c="#d9c69c" /><B p={[-2.4, 2.85, -6.9]} s={[2.6, 0.1, 1.4]} c="#d3bf95" /><B p={[-2.4, 0.86, -6.9]} s={[2.6, 0.2, 1.4]} c="#7d8589" />
    {/* bếp lò và chụp hút */}
    <B p={[-2.65, 1.1, -7.2]} s={[1.5, 0.3, 0.7]} c="#8c969b" /><B p={[-2.65, 1.26, -7.2]} s={[1.52, 0.03, 0.72]} c="#3a3f46" />
    <B p={[-2.65, 2.45, -7.25]} s={[1.5, 0.28, 0.62]} c="#b6c0c5" /><B p={[-2.65, 2.3, -7.05]} s={[1.56, 0.04, 0.32]} c={CHROME_DK} /><B p={[-2.65, 2.72, -7.3]} s={[0.62, 0.3, 0.4]} c="#a3adb2" />
    <FacetLathe profile={[[0.13, 0], [0.15, 0.02], [0.15, 0.17], [0.16, 0.18]]} sides={12} color="#a7b0b5" pos={[-3.05, 1.28, -7.15]} contact={false} /><B p={[-2.83, 1.42, -7.15]} s={[0.22, 0.022, 0.03]} c="#3a3f46" />
    <FacetLathe profile={[[0.17, 0], [0.19, 0.02], [0.19, 0.09], [0.2, 0.1]]} sides={12} color="#50565d" pos={[-2.32, 1.28, -7.12]} contact={false} /><B p={[-2.05, 1.36, -7.12]} s={[0.26, 0.022, 0.03]} c="#2d3036" />
    {/* xoong chảo, muôi treo trên thanh */}
    <B p={[-1.75, 2.12, -7.5]} s={[0.92, 0.024, 0.024]} c={CHROME_DK} />
    {[[-2.08, 0.15, '#6c7379'], [-1.8, 0.2, '#b67845'], [-1.5, 0.13, '#8c959a']].map(([x, r, col]) => <group key={x as number}><B p={[x as number, 1.98, -7.48]} s={[0.018, 0.26, 0.012]} c="#4b5057" cast={false} /><mesh position={[x as number, 1.86 - (r as number), -7.47]}><circleGeometry args={[r as number, 16]} /><meshLambertMaterial color={col as string} /></mesh><mesh position={[(x as number) - 0.02, 1.87 - (r as number), -7.462]}><circleGeometry args={[(r as number) * 0.7, 16]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.13} /></mesh></group>)}
    <pointLight position={[-2.3, 2.05, -6.65]} color="#ffe4b0" intensity={5} distance={3.2} decay={1.2} />
  </group>
);
/** kệ thép ở ô chuyển món, có chuông bàn, thanh kẹp phiếu order, đĩa đang chờ bưng */
export const KeChuyenMon: React.FC<{x0: number; x1: number; y0: number; y1: number}> = ({x0, x1, y0, y1}) => {
  const cx = (x0 + x1) / 2, w = x1 - x0;
  return (
    <group>
      <B p={[cx, y0 - 0.02, -6.0]} s={[w + 0.16, 0.05, 0.44]} c={CHROME} /><B p={[cx, y0 + 0.008, -5.78]} s={[w + 0.16, 0.012, 0.012]} c={CHROME_HI} cast={false} /><B p={[cx, y0 - 0.06, -5.79]} s={[w + 0.16, 0.03, 0.012]} c={CHROME_DK} cast={false} />
      {[x0, x1].map((x) => <B key={x} p={[x, (y0 + y1) / 2, -6.08]} s={[0.07, y1 - y0 + 0.07, 0.3]} c={CHROME_DK} />)}<B p={[cx, y1, -6.08]} s={[w + 0.07, 0.07, 0.3]} c={CHROME_DK} /><B p={[cx, y1 - 0.075, -5.94]} s={[w, 0.03, 0.03]} c={CHROME_HI} />
      {[0.14, 0.4, 0.7].map((u, i) => <group key={u} position={[x0 + w * u, y1 - 0.1, -5.92]} rotation={[0, 0, (i - 1) * 0.05]}><mesh position={[0, -0.075, 0]}><planeGeometry args={[0.11, 0.16]} /><meshLambertMaterial color={i === 1 ? '#fbe9a8' : '#fbf8ec'} /></mesh>{[0.03, 0.005, -0.02, -0.045].map((d) => <B key={d} p={[0, -0.075 + d, 0.002]} s={[0.075, 0.008, 0.001]} c="#6b6a68" cast={false} />)}</group>)}
      <FacetLathe profile={[[0.06, 0], [0.058, 0.012], [0.05, 0.035], [0.03, 0.058], [0.008, 0.066], [0.006, 0.08]]} sides={12} color="#d5dde0" pos={[x1 - 0.22, y0 + 0.006, -5.9]} contact={false} />
      <Sprite name="qa-dia-cho" art={paintDiaKep} px={[420, 260]} w={0.42} pos={[x0 + 0.44, y0 + 0.006, -5.92]} cast={false} shade={0} />
    </group>
  );
};

// ---------------------------------------------------------------- đồ trên tường
const paintThucDon = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#262a31'); for (let y = 7; y < H; y += 13) hop(c, 0, y, W, 2, '#31363e');
  hop(c, W * 0.06, H * 0.04, W * 0.88, H * 0.1, RED); hop(c, W * 0.06, H * 0.04, W * 0.88, H * 0.02, '#ea6b5d'); hop(c, W * 0.2, H * 0.075, W * 0.6, H * 0.035, '#fff5da');
  const r = rnd(7); [0, 1].forEach((col) => { let y = H * 0.2; const x0 = W * (0.07 + col * 0.46), w = W * 0.4; for (let s = 0; s < 3; s++) { hop(c, x0, y, w * 0.56, H * 0.024, '#f0c95e'); y += H * 0.048; for (let i = 0; i < 4; i++) { hop(c, x0, y, w * (0.42 + r() * 0.3), H * 0.014, '#f4f1e6'); hop(c, x0 + w * 0.84, y, w * 0.15, H * 0.014, '#a9e5cf'); y += H * 0.033; } y += H * 0.024; } });
};
const paintHomNay = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#fbf3df'); hop(c, W * 0.05, H * 0.05, W * 0.9, H * 0.2, RED); hop(c, W * 0.05, H * 0.05, W * 0.9, H * 0.035, '#ea6b5d'); hop(c, W * 0.22, H * 0.12, W * 0.56, H * 0.07, '#fff5da');
  [0.34, 0.47, 0.6, 0.73].forEach((y, i) => { hop(c, W * 0.12, H * y, W * (0.5 + (i % 2) * 0.1), H * 0.035, '#2c3a4a'); hop(c, W * 0.74, H * y, W * 0.15, H * 0.035, '#c9322f'); });
  P(c, [[W * 0.62, H * 0.97], [W * 0.68, H * 0.86], [W * 0.92, H * 0.86], [W * 0.92, H * 0.97]], '#e5a44a'); hop(c, W * 0.64, H * 0.92, W * 0.28, H * 0.05, '#a9202c');
};
export const BangThucDon: React.FC<{pos: V3; w?: number; h?: number}> = ({pos, w = 0.95, h = 1.22}) => (
  <group position={pos}>
    <B p={[0, 0, -0.018]} s={[w + 0.1, h + 0.1, 0.05]} c="#6c4a33" /><B p={[0, h / 2 + 0.035, 0.012]} s={[w + 0.1, 0.016, 0.006]} c="#9b7253" cast={false} />
    <Tam k="qa-thuc-don" px={[520, 668]} paint={paintThucDon} p={[0, 0, 0.012]} s={[w, h]} />
  </group>
);
/** bảng món hôm nay màu kem treo bằng hai xích trước ô kính: mảng sáng sau đầu người ở cận mặt */
export const BangHomNay: React.FC<{pos: V3; w?: number; h?: number; top?: number}> = ({pos, w = 0.62, h = 0.66, top = 2.55}) => (
  <group position={pos}>
    {[-1, 1].map((a) => <B key={a} p={[a * w * 0.38, (top - pos[1] + h / 2) / 2, 0]} s={[0.012, top - pos[1] - h / 2, 0.012]} c={CHROME_DK} cast={false} />)}
    <B p={[0, 0, -0.012]} s={[w + 0.05, h + 0.05, 0.024]} c="#8e1f25" cast={false} />
    <Tam k="qa-hom-nay" px={[340, 360]} paint={paintHomNay} p={[0, 0, 0.003]} s={[w, h]} />
  </group>
);
export const DongHoQuan: React.FC<{pos: V3; r?: number; f?: number}> = ({pos, r = 0.19, f = 0}) => {
  const giay = (f / 24) * (Math.PI / 30);
  return (
    <group position={pos}>
      <mesh position={[0, 0, 0.012]}><circleGeometry args={[r, 28]} /><meshLambertMaterial color={RED} /></mesh><mesh position={[0, 0, 0.018]}><circleGeometry args={[r * 0.87, 28]} /><meshLambertMaterial color="#fdf8ea" /></mesh>
      {Array.from({length: 12}, (_, i) => { const a = (i / 12) * Math.PI * 2, b = i % 3 === 0; return <B key={i} p={[Math.sin(a) * r * 0.72, Math.cos(a) * r * 0.72, 0.022]} s={[b ? 0.012 : 0.006, b ? 0.032 : 0.018, 0.001]} r={[0, 0, -a]} c={INK} cast={false} />; })}
      <group rotation={[0, 0, 1.1]}><B p={[0, r * 0.22, 0.025]} s={[0.018, r * 0.48, 0.002]} c={INK} cast={false} /></group><group rotation={[0, 0, -2.25]}><B p={[0, r * 0.32, 0.027]} s={[0.012, r * 0.68, 0.002]} c={INK} cast={false} /></group>
      <group rotation={[0, 0, -giay]}><B p={[0, r * 0.3, 0.029]} s={[0.004, r * 0.72, 0.001]} c={RED} cast={false} /></group><mesh position={[0, 0, 0.031]}><circleGeometry args={[0.012, 10]} /><meshBasicMaterial color={RED} /></mesh>
    </group>
  );
};
const paintLich = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#fbf7ea'); hop(c, 0, 0, W, H * 0.3, '#2f7f79'); hop(c, W * 0.3, H * 0.11, W * 0.4, H * 0.08, '#fbf7ea'); hop(c, W * 0.46, H * 0.02, W * 0.08, H * 0.05, '#2c3038');
  for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) hop(c, W * (0.08 + i * 0.12), H * (0.36 + j * 0.12), W * 0.08, H * 0.07, i === 6 ? RED : '#6d6d6a'); c.strokeStyle = RED; c.lineWidth = 3; c.strokeRect(W * 0.43, H * 0.59, W * 0.16, H * 0.13);
};
const paintKhungAnh = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#7b5438'); hop(c, W * 0.06, H * 0.06, W * 0.88, H * 0.88, '#f5ecd8'); hop(c, W * 0.16, H * 0.16, W * 0.68, H * 0.68, '#8fc9d8'); hop(c, W * 0.16, H * 0.56, W * 0.68, H * 0.28, '#d9c08a');
  P(c, [[W * 0.2, H * 0.58], [W * 0.27, H * 0.44], [W * 0.56, H * 0.44], [W * 0.72, H * 0.55], [W * 0.8, H * 0.58], [W * 0.8, H * 0.68], [W * 0.2, H * 0.68]], '#c9322f'); hop(c, W * 0.32, H * 0.47, W * 0.26, H * 0.09, '#d9f0f4'); tron(c, W * 0.34, H * 0.69, W * 0.06, '#26282e'); tron(c, W * 0.68, H * 0.69, W * 0.06, '#26282e');
};
const paintDayXoan = (c: Ctx, W: number, H: number) => { c.strokeStyle = '#23262c'; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); for (let y = 0; y <= H; y += 3) { const x = W / 2 + Math.sin(y * 0.3) * W * 0.3 + Math.sin(y * 0.012) * W * 0.06; if (y) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); };
/** điện thoại treo tường đen, dây xoắn */
export const DienThoaiTuong: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <B p={[0, 0, 0.03]} s={[0.17, 0.25, 0.06]} c="#2f333a" /><B p={[-0.05, 0, 0.061]} s={[0.012, 0.23, 0.002]} c="#5a606a" cast={false} />
    <mesh position={[0, -0.04, 0.062]}><circleGeometry args={[0.058, 18]} /><meshLambertMaterial color="#e9e4d4" /></mesh><mesh position={[0, -0.04, 0.064]}><circleGeometry args={[0.024, 14]} /><meshLambertMaterial color="#2f333a" /></mesh>
    {Array.from({length: 9}, (_, i) => { const a = 0.6 + i * 0.58; return <mesh key={i} position={[Math.cos(a) * 0.042, -0.04 + Math.sin(a) * 0.042, 0.065]}><circleGeometry args={[0.007, 8]} /><meshBasicMaterial color="#2f333a" /></mesh>; })}
    <B p={[0, 0.095, 0.075]} s={[0.21, 0.035, 0.035]} c="#23262c" /><B p={[-0.1, 0.085, 0.078]} s={[0.05, 0.05, 0.05]} c="#23262c" /><B p={[0.1, 0.085, 0.078]} s={[0.05, 0.05, 0.05]} c="#23262c" />
    <Tam k="qa-day-xoan" px={[60, 460]} paint={paintDayXoan} p={[0.105, -0.13, 0.08]} s={[0.05, 0.38]} lit={false} alpha />
  </group>
);
const paintBienCoc = (c: Ctx, W: number, H: number) => {
  tron(c, W / 2, H / 2, W * 0.5, RED_DK); tron(c, W / 2, H / 2, W * 0.46, RED); tron(c, W / 2, H / 2, W * 0.37, '#f7ecd2'); c.beginPath(); c.arc(W / 2, H / 2, W * 0.42, 0, 7); c.strokeStyle = '#f7ecd2'; c.lineWidth = 3; c.setLineDash([7, 7]); c.stroke(); c.setLineDash([]);
  P(c, [[W * 0.3, H * 0.42], [W * 0.64, H * 0.42], [W * 0.58, H * 0.68], [W * 0.36, H * 0.68]], '#2f6f7a'); P(c, [[W * 0.52, H * 0.42], [W * 0.64, H * 0.42], [W * 0.58, H * 0.68], [W * 0.5, H * 0.68]], '#1f5560'); c.strokeStyle = '#2f6f7a'; c.lineWidth = W * 0.035; c.beginPath(); c.arc(W * 0.66, H * 0.52, W * 0.065, -1.3, 1.3); c.stroke(); hop(c, W * 0.27, H * 0.7, W * 0.42, H * 0.03, '#2f6f7a');
  [0.4, 0.5].forEach((x, i) => { c.strokeStyle = '#c9322f'; c.lineWidth = W * 0.022; c.beginPath(); c.moveTo(W * x, H * 0.37); c.quadraticCurveTo(W * (x + (i ? 0.05 : -0.05)), H * 0.31, W * x, H * 0.24); c.stroke(); });
};
const paintBienBanh = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#1f5560'); hop(c, W * 0.03, H * 0.05, W * 0.94, H * 0.9, '#2f7f79'); hop(c, W * 0.07, H * 0.13, W * 0.86, H * 0.74, '#f7ecd2');
  elip(c, W / 2, H * 0.66, W * 0.3, H * 0.13, '#c98a3f'); elip(c, W / 2, H * 0.57, W * 0.3, H * 0.16, '#e6ad5a'); c.save(); c.beginPath(); c.ellipse(W / 2, H * 0.56, W * 0.25, H * 0.12, 0, 0, 7); c.clip(); hop(c, 0, 0, W, H, '#b3202f'); c.strokeStyle = '#f2ca80'; c.lineWidth = W * 0.022; for (let i = -6; i < 7; i++) { c.beginPath(); c.moveTo(W * 0.5 + i * W * 0.08, H * 0.3); c.lineTo(W * 0.5 + i * W * 0.08 + W * 0.15, H * 0.8); c.stroke(); c.beginPath(); c.moveTo(W * 0.5 + i * W * 0.08, H * 0.3); c.lineTo(W * 0.5 + i * W * 0.08 - W * 0.15, H * 0.8); c.stroke(); } c.restore();
  [0.32, 0.42, 0.52, 0.62].forEach((x) => { c.strokeStyle = '#c9322f'; c.lineWidth = W * 0.012; c.beginPath(); c.moveTo(W * x, H * 0.36); c.quadraticCurveTo(W * (x + 0.03), H * 0.3, W * x, H * 0.22); c.stroke(); });
};
/** biển thiếc treo tường, chỉ có hình: cốc cà phê, bánh */
export const BienThiec: React.FC = () => (
  <group>
    <Tam k="qa-bien-coc" px={[240, 240]} paint={paintBienCoc} p={[-4.0, 2.66, -5.985]} s={[0.5, 0.5]} alpha />
    <Tam k="qa-bien-banh" px={[320, 220]} paint={paintBienBanh} p={[-3.05, 2.66, -5.985]} s={[0.62, 0.43]} />
  </group>
);
export const DoTreoTuong: React.FC = () => (
  <group>
    <Tam k="qa-lich" px={[200, 260]} paint={paintLich} p={[0.56, 2.42, -5.985]} s={[0.3, 0.39]} />
    <Tam k="qa-anh-xe" px={[260, 200]} paint={paintKhungAnh} p={[-0.1, 2.2, -5.985]} s={[0.28, 0.215]} />
    <DienThoaiTuong pos={[0.63, 1.45, -5.99]} />
  </group>
);
const CocXep: React.FC<{p: V3; n: number; c0?: string}> = ({p, n, c0 = '#f6f2e6'}) => <group position={p}>{Array.from({length: n}, (_, i) => <group key={i} position={[(i % 2) * 0.004, i * 0.062, 0]}><FacetLathe profile={[[0.036, 0], [0.045, 0.012], [0.05, 0.07]]} sides={10} color={c0} contact={false} cast={i === 0} /><B p={[0, 0.066, 0.05]} s={[0.1, 0.006, 0.002]} c="#3f7fb8" cast={false} /></group>)}</group>;
/** kệ gỗ treo tường có cốc xếp chồng, ly, bình */
export const KeCoc: React.FC<{pos: V3; w?: number; seed?: number}> = ({pos, w = 1.0, seed = 1}) => {
  const r = useMemo(() => rnd(seed), [seed]), items = useMemo(() => Array.from({length: Math.floor(w / 0.15)}, (_, i) => ({x: -w / 2 + 0.1 + i * 0.15, n: 1 + Math.floor(r() * 3), k: r()})), [w, seed]);
  return (
    <group position={pos}>
      <B p={[0, 0, 0.11]} s={[w, 0.035, 0.22]} c="#8b6242" /><B p={[0, -0.012, 0.222]} s={[w, 0.014, 0.004]} c="#6b4930" cast={false} /><B p={[0, 0.012, 0.222]} s={[w, 0.006, 0.004]} c="#b5875e" cast={false} />
      {[-w * 0.42, w * 0.42].map((x) => <B key={x} p={[x, -0.075, 0.05]} s={[0.025, 0.12, 0.1]} c="#6b4930" />)}
      {items.map((o) => o.k < 0.62 ? <CocXep key={o.x} p={[o.x, 0.018, 0.11]} n={o.n} c0={o.k < 0.2 ? '#e6efe9' : '#f6f2e6'} /> : <group key={o.x} position={[o.x, 0.018, 0.11]}><FacetLathe profile={[[0.035, 0], [0.035, 0.012], [0.03, 0.03], [0.042, 0.15]]} sides={10} color="#c6e4e6" contact={false} /><B p={[-0.018, 0.08, 0.04]} s={[0.006, 0.1, 0.002]} c="#ffffff" cast={false} /></group>)}
    </group>
  );
};

// ---------------------------------------------------------------- tủ dưới tường sau và đồ trên đó
const BinhCaPhe: React.FC<{p: V3; f?: number}> = ({p, f = 0}) => (
  <group position={p}>
    <FacetLathe profile={[[0.13, 0], [0.15, 0.03], [0.15, 0.08], [0.11, 0.1], [0.135, 0.13], [0.145, 0.42], [0.12, 0.46], [0.06, 0.5], [0.02, 0.56]]} sides={14} color="#c7d0d4" contact={false} />
    <B p={[-0.07, 0.26, 0.128]} s={[0.022, 0.28, 0.006]} c={CHROME_HI} cast={false} /><B p={[0.05, 0.28, 0.135]} s={[0.012, 0.3, 0.004]} c={CHROME_DK} cast={false} />
    <B p={[0, 0.095, 0.16]} s={[0.05, 0.05, 0.05]} c={RED_DK} /><B p={[0, 0.125, 0.18]} s={[0.018, 0.04, 0.018]} c={INK} />
    <mesh position={[0.075, 0.38, 0.14]}><circleGeometry args={[0.018, 10]} /><meshBasicMaterial color="#ff6b4a" /></mesh>
    <SoiHoi pos={[0, 0.58, 0]} f={f} h={0.34} w={0.05} seed={2} />
  </group>
);
const MayLamSua: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <B p={[0, 0.025, 0]} s={[0.2, 0.05, 0.2]} c="#6fb7a4" /><B p={[0, 0.2, -0.065]} s={[0.075, 0.3, 0.07]} c="#83cdb9" /><B p={[0, 0.39, -0.015]} s={[0.1, 0.11, 0.2]} c="#83cdb9" /><B p={[-0.03, 0.2, -0.028]} s={[0.012, 0.28, 0.002]} c="#c2eadc" cast={false} />
    <B p={[0, 0.3, 0.05]} s={[0.012, 0.1, 0.012]} c={CHROME} /><FacetLathe profile={[[0.035, 0], [0.058, 0.18]]} sides={10} color={CHROME} pos={[0, 0.06, 0.05]} contact={false} />
  </group>
);
const LoNuongBanh: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <B p={[0, 0.11, 0]} s={[0.3, 0.2, 0.17]} c="#c7d0d4" /><B p={[-0.09, 0.11, 0.086]} s={[0.05, 0.18, 0.002]} c={CHROME_HI} cast={false} /><B p={[0, 0.012, 0]} s={[0.32, 0.024, 0.19]} c={INK} /><B p={[0.158, 0.13, 0]} s={[0.014, 0.05, 0.03]} c={INK} />
    <B p={[-0.05, 0.225, 0]} s={[0.13, 0.05, 0.03]} c="#d39a55" /><B p={[0.07, 0.235, 0]} s={[0.13, 0.07, 0.03]} c="#e0ae68" /><B p={[0.07, 0.268, 0]} s={[0.13, 0.008, 0.032]} c="#a56b34" cast={false} />
  </group>
);
const ChongDia: React.FC<{p: V3; n?: number}> = ({p, n = 8}) => <group position={p}>{Array.from({length: n}, (_, i) => <group key={i} position={[(i % 3) * 0.004, i * 0.014, 0]}><FacetLathe profile={[[0.06, 0], [0.11, 0.008], [0.125, 0.018]]} sides={14} color={i % 2 ? '#f8f4e8' : '#efe9d9'} contact={false} cast={i === 0} /></group>)}<B p={[0, n * 0.014 + 0.002, 0.118]} s={[0.2, 0.004, 0.002]} c="#3f7fb8" cast={false} /></group>;
const LoBanhQuy: React.FC<{p: V3; c0?: string; seed?: number}> = ({p, c0 = '#d7a35f', seed = 1}) => {
  const r = useMemo(() => { const q = rnd(seed); return Array.from({length: 9}, () => [(q() - 0.5) * 0.11, 0.035 + q() * 0.1, q()] as const); }, [seed]);
  return <group position={p}><FacetLathe profile={[[0.07, 0], [0.08, 0.02], [0.08, 0.17], [0.055, 0.2], [0.055, 0.22]]} sides={10} color="#d3ecec" contact={false} />{r.map(([x, y, k], i) => <mesh key={i} position={[x, y, 0.085]}><circleGeometry args={[0.024, 8]} /><meshLambertMaterial color={k < 0.5 ? c0 : '#a86f35'} /></mesh>)}<B p={[0, 0.235, 0]} s={[0.1, 0.03, 0.1]} c={RED} /><B p={[-0.036, 0.11, 0.087]} s={[0.008, 0.11, 0.002]} c="#ffffff" cast={false} /></group>;
};
export const TuSauQuay: React.FC<{x0: number; x1: number; f?: number}> = ({x0, x1, f = 0}) => {
  const w = x1 - x0, cx = (x0 + x1) / 2, n = Math.round(w / 0.62), z = -5.63;
  return (
    <group>
      <B p={[cx, 0.05, z]} s={[w, 0.1, 0.62]} c="#454a53" /><B p={[cx, 0.5, z]} s={[w, 0.8, 0.68]} c="#e9dfc6" />
      <B p={[cx, 0.925, z + 0.02]} s={[w + 0.04, 0.05, 0.74]} c={CHROME} /><B p={[cx, 0.948, z + 0.39]} s={[w + 0.04, 0.008, 0.006]} c={CHROME_HI} cast={false} />
      {Array.from({length: n}, (_, i) => { const a = x0 + ((i + 0.5) * w) / n; return <group key={i}><B p={[a, 0.5, z + 0.343]} s={[w / n - 0.05, 0.68, 0.012]} c="#f4ecd9" /><B p={[a, 0.5, z + 0.351]} s={[w / n - 0.15, 0.56, 0.004]} c="#dfd3b6" cast={false} /><B p={[a, 0.72, z + 0.365]} s={[0.13, 0.016, 0.022]} c={CHROME_DK} /></group>; })}
      <ChongDia p={[-4.2, 0.95, z]} /><ChongDia p={[-3.95, 0.95, z + 0.08]} n={5} /><LoNuongBanh p={[-3.55, 0.95, z]} /><MayLamSua p={[-3.03, 0.95, z - 0.02]} />
      <LoBanhQuy p={[-2.62, 0.95, z]} /><LoBanhQuy p={[-2.42, 0.95, z + 0.06]} c0="#c98a55" seed={4} />
      <group position={[-2.02, 0.95, z]}><B p={[0, 0.12, 0]} s={[0.42, 0.24, 0.26]} c="#b9c2c6" /><B p={[0, 0.17, 0.132]} s={[0.36, 0.11, 0.004]} c="#e8eff0" cast={false} /><B p={[0, 0.17, 0.136]} s={[0.1, 0.018, 0.012]} c={INK} cast={false} /></group>
      {[-1.63, -1.54, -1.45].map((x, i) => <group key={x} position={[x, 0.95, z + 0.05]}><FacetLathe profile={[[0.04, 0], [0.04, 0.13], [0.018, 0.17], [0.016, 0.23]]} sides={8} color={['#a4632a', '#c23b2e', '#6c8a3e'][i]} contact={false} /><B p={[-0.012, 0.075, 0.04]} s={[0.008, 0.09, 0.002]} c="#ffffff" cast={false} /><B p={[0, 0.07, 0.042]} s={[0.058, 0.05, 0.001]} c="#f7f0dc" cast={false} /></group>)}
      <BinhCaPhe p={[-1.14, 0.95, z]} f={f} />
    </group>
  );
};

// ---------------------------------------------------------------- quầy đỏ viền thép, ghế đẩu
/** quầy dài trục x, tâm z; mặt quầy ở y = 1,05 (mép trước z + 0,35), thân ván kem, nẹp thép, thanh gác chân */
export const QuayQuan: React.FC<{x0: number; x1: number; z: number}> = ({x0, x1, z}) => {
  const w = x1 - x0, cx = (x0 + x1) / 2, d = 0.7, fz = z + d / 2;
  return (
    <group>
      <B p={[cx, 0.06, z]} s={[w, 0.12, d - 0.08]} c="#3e434c" /><B p={[cx, 0.53, z]} s={[w, 0.82, d - 0.02]} c="#e7dcc2" />
      <Tam k="qa-van-quay" px={[2200, 330]} paint={paintVanQuay} p={[cx, 0.535, fz - 0.005]} s={[w, 0.81]} />
      <B p={[cx, 0.14, fz - 0.002]} s={[w, 0.035, 0.014]} c={CHROME} /><B p={[cx, 0.15, fz + 0.006]} s={[w, 0.008, 0.002]} c={CHROME_HI} cast={false} />
      <B p={[cx, 0.92, fz - 0.002]} s={[w, 0.05, 0.016]} c={RED} /><B p={[cx, 0.895, fz + 0.007]} s={[w, 0.008, 0.002]} c={CHROME} cast={false} />
      <B p={[cx, 1.01, z + 0.03]} s={[w + 0.08, 0.05, d + 0.1]} c={RED_DK} />
      <B p={[cx, 0.985, fz + 0.085]} s={[w + 0.08, 0.03, 0.022]} c={CHROME} /><B p={[cx, 1.012, fz + 0.087]} s={[w + 0.08, 0.026, 0.022]} c={CHROME_HI} /><B p={[cx, 1.038, fz + 0.087]} s={[w + 0.08, 0.024, 0.02]} c={CHROME_DK} />
      <Tam k="qa-mat-quay" px={[2200, 340]} paint={paintMatQuay} p={[cx, 1.051, z + 0.03]} s={[w + 0.08, d + 0.1]} r={[-Math.PI / 2, 0, 0]} />
      <B p={[x1 + 0.04, 0.55, z]} s={[0.04, 0.9, d + 0.04]} c={CHROME} /><B p={[x1 + 0.062, 0.55, z]} s={[0.006, 0.86, d - 0.04]} c={CHROME_HI} cast={false} />
      {Array.from({length: Math.floor(w / 1.02) + 1}, (_, i) => { const x = x0 + 0.04 + (i * (w - 0.08)) / Math.floor(w / 1.02); return <group key={i}><B p={[x, 0.53, fz + 0.006]} s={[0.05, 0.71, 0.012]} c={CHROME} /><B p={[x - 0.012, 0.53, fz + 0.013]} s={[0.012, 0.7, 0.002]} c={CHROME_HI} cast={false} /><B p={[x, 0.53, fz + 0.014]} s={[0.07, 0.07, 0.004]} r={[0, 0, Math.PI / 4]} c={RED} cast={false} /><B p={[x, 0.53, fz + 0.017]} s={[0.03, 0.03, 0.002]} r={[0, 0, Math.PI / 4]} c="#f6e7c8" cast={false} /></group>; })}
      <B p={[cx, 0.24, fz + 0.16]} s={[w - 0.1, 0.03, 0.03]} c={CHROME} /><B p={[cx, 0.248, fz + 0.172]} s={[w - 0.1, 0.008, 0.006]} c={CHROME_HI} cast={false} />
      {Array.from({length: Math.floor(w / 1.1) + 1}, (_, i) => <B key={i} p={[x0 + 0.3 + (i * (w - 0.6)) / Math.floor(w / 1.1), 0.24, fz + 0.08]} s={[0.025, 0.025, 0.16]} c={CHROME_DK} />)}
    </group>
  );
};
export const GheDau: React.FC<{pos: V3; turn?: number}> = ({pos, turn = 0}) => (
  <group position={pos} rotation={[0, turn, 0]}>
    <FacetLathe profile={[[0.17, 0], [0.175, 0.012], [0.12, 0.03], [0.045, 0.055]]} sides={14} color={CHROME} />
    <FacetLathe profile={[[0.03, 0.05], [0.03, 0.66]]} sides={10} color={CHROME} contact={false} /><B p={[-0.015, 0.36, 0.028]} s={[0.008, 0.58, 0.002]} c={CHROME_HI} cast={false} />
    <FacetLathe profile={[[0.13, 0.25], [0.14, 0.26], [0.13, 0.275], [0.12, 0.26]]} sides={14} color={CHROME_DK} contact={false} />
    <FacetLathe profile={[[0.05, 0.66], [0.17, 0.69], [0.185, 0.71]]} sides={16} color={CHROME_DK} contact={false} />
    <FacetLathe profile={[[0.185, 0.705], [0.195, 0.725], [0.185, 0.75], [0.135, 0.785], [0, 0.795]]} sides={16} color={RED} contact={false} />
    <FacetLathe profile={[[0.188, 0.72], [0.198, 0.725], [0.188, 0.732]]} sides={16} color={CHROME_HI} contact={false} />
    <B p={[-0.07, 0.777, 0.1]} s={[0.1, 0.006, 0.04]} r={[0.35, 0, 0]} c="#ee6d60" cast={false} />
  </group>
);

// ---------------------------------------------------------------- tủ bánh mặt kính dốc
export const TuBanhKinh: React.FC<{pos: V3; w?: number}> = ({pos, w = 0.96}) => {
  const d = 0.46, h = 0.48, front = d / 2, back = -d / 2, topZ = back + 0.17, slope = Math.hypot(front - topZ, h - 0.09), a = Math.atan2(front - topZ, h - 0.09);
  return (
    <group position={pos}>
      <B p={[0, 0.045, 0]} s={[w, 0.09, d]} c={CHROME} /><B p={[0, 0.09, front - 0.004]} s={[w, 0.008, 0.008]} c={CHROME_HI} cast={false} /><B p={[0, 0.04, front + 0.002]} s={[w - 0.1, 0.02, 0.002]} c={CHROME_DK} cast={false} />
      <B p={[0, h / 2 + 0.03, back + 0.008]} s={[w, h - 0.06, 0.016]} c="#f6efdc" /><B p={[0, h + 0.005, (back + topZ) / 2]} s={[w + 0.02, 0.018, topZ - back + 0.03]} c={CHROME} />
      <B p={[0, 0.27, -0.05]} s={[w - 0.04, 0.012, 0.28]} c="#d9e7e8" />
      <Sprite name="qa-banh-nguyen" art={paintBanhNguyen} px={[420, 230]} w={0.36} pos={[-0.25, 0.1, 0.07]} cast={false} shade={0} />
      <Sprite name="qa-banh-chanh" art={paintBanhChanh} px={[420, 240]} w={0.34} pos={[0.21, 0.1, 0.07]} cast={false} shade={0} />
      <Sprite name="qa-donut" art={paintDonut} px={[240, 150]} w={0.14} pos={[-0.3, 0.28, -0.04]} cast={false} shade={0} />
      <Sprite name="qa-donut" art={paintDonut} px={[240, 150]} w={0.14} pos={[-0.14, 0.28, -0.06]} cast={false} shade={0} />
      <Sprite name="qa-banh-quy" art={paintBanhNuong} px={[260, 150]} w={0.17} pos={[0.1, 0.28, -0.05]} cast={false} shade={0} />
      <Sprite name="qa-banh-quy" art={paintBanhNuong} px={[260, 150]} w={0.17} pos={[0.28, 0.28, -0.05]} cast={false} shade={0} />
      {[-w / 2, w / 2].map((x) => <B key={x} p={[x, (h + 0.09) / 2, (front + topZ) / 2]} s={[0.014, slope, 0.014]} r={[a, 0, 0]} c={CHROME_DK} />)}
      <group position={[0, (h + 0.09) / 2, (front + topZ) / 2]} rotation={[-(Math.PI / 2 - Math.atan2(h - 0.09, front - topZ)), 0, 0]}>
        <mesh renderOrder={7}><planeGeometry args={[w, slope]} /><meshBasicMaterial color="#dff3f4" transparent opacity={0.13} depthWrite={false} /></mesh>
        <mesh position={[-w * 0.2, 0, 0.002]} renderOrder={8}><planeGeometry args={[w * 0.1, slope]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} /></mesh>
        <mesh position={[-w * 0.08, 0, 0.002]} renderOrder={8}><planeGeometry args={[w * 0.035, slope]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} /></mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- KÉT TIỀN
/** điểm trên két, tính từ gốc đặt két (giữa đáy): để cảnh quay đặt tay lên đúng chỗ. phim = phím số 0, ngan = tay kéo ngăn lúc đóng */
export const KET = {w: 0.36, h: 0.42, phim: [0.111, 0.21, 0.084] as V3, ngan: [0, 0.056, 0.19] as V3, tien: [0, 0.095, 0.25] as V3};
const paintDayKet = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, BRASS); hop(c, 0, 0, W, H * 0.12, BRASS_HI); hop(c, 0, H * 0.88, W, H * 0.12, BRASS_DK);
  c.strokeStyle = BRASS_DK; c.lineWidth = 3; for (let i = 0; i < 11; i++) { const x = (i + 0.5) * W / 11; c.beginPath(); c.moveTo(x, H * 0.5); c.quadraticCurveTo(x + W * 0.03, H * 0.22, x + W * 0.05, H * 0.5); c.quadraticCurveTo(x + W * 0.03, H * 0.78, x, H * 0.5); c.stroke(); tron(c, x + W * 0.025, H * 0.5, 3, BRASS_HI); }
};
const paintKhayTien = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#3a3f47'); const k = 5, u = W / k;
  for (let i = 0; i < k; i++) { hop(c, i * u + 4, 4, u - 8, H - 8, '#23262c'); hop(c, i * u + 4, 4, u - 8, 4, '#15171b'); }
  [0, 1, 2].forEach((i) => { const x = i * u + 8, w = u - 16; for (let j = 0; j < 4; j++) { hop(c, x + j, 12 + j * 3, w - 2, H - 26, ['#6ea77c', '#5d9970', '#83b98c', '#79b084'][j]); } hop(c, x + 3, 22, w - 6, H - 46, '#8fc69b'); c.strokeStyle = '#3f7654'; c.lineWidth = 2; c.strokeRect(x + 6, 26, w - 12, H - 54); tron(c, x + w / 2, H / 2, Math.min(w, H) * 0.14, '#3f7654'); });
  [3, 4].forEach((i) => { const x = i * u + u / 2; [[0, -0.22, '#d9b45a'], [-0.14, 0.05, '#c9ced2'], [0.15, 0.08, '#d9b45a'], [0, 0.3, '#c9ced2']].forEach(([dx, dy, f]) => { tron(c, x + (dx as number) * u, H / 2 + (dy as number) * H, u * 0.17, '#6d6442'); tron(c, x + (dx as number) * u, H / 2 + (dy as number) * H - 2, u * 0.15, f as string); tron(c, x + (dx as number) * u - 3, H / 2 + (dy as number) * H - 5, u * 0.045, '#fff8df'); }); });
};
const Phim: React.FC<{x: number; y: number; on?: boolean; c0?: string}> = ({x, y, on, c0 = '#fbf5e3'}) => (
  <group position={[x, y, on ? -0.004 : 0]}>
    <mesh position={[0, 0, 0.002]}><circleGeometry args={[0.019, 12]} /><meshLambertMaterial color={BRASS_DK} /></mesh>
    <mesh position={[0, 0, 0.008]}><circleGeometry args={[0.015, 12]} /><meshLambertMaterial color={c0} /></mesh>
    <mesh position={[-0.004, 0.004, 0.009]}><circleGeometry args={[0.004, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
    <B p={[0, 0, 0.009]} s={[0.012, 0.004, 0.001]} c={c0 === RED ? '#fff3df' : INK} cast={false} />
  </group>
);
/** Két đồng kiểu cũ: thân đồng có hoa văn, mặt phím dốc bốn cột phím tròn, hòm cờ số trên đỉnh, tay quay bên phải, ngăn kéo bật ra có tiền và xu.
 *  ngan 0..1 = ngăn kéo, co 0..1 = cờ số 0 bật lên, phim = chỉ số phím đang nhấn (-1 không; 7 là phím số 0), quay = góc tay quay. Gốc ở giữa đáy, đặt trên mặt quầy. */
export const KetTien: React.FC<{pos: V3; ngan?: number; co?: number; phim?: number; quay?: number}> = ({pos, ngan = 0, co = 0, phim = -1, quay = 0}) => {
  const W = KET.w, D = 0.32, open = ngan * 0.17;
  return (
    <group position={pos}>
      <B p={[0, 0.006, 0]} s={[W + 0.03, 0.012, D + 0.03]} c={BRASS_DK} /><B p={[0, 0.058, -0.01]} s={[W, 0.095, D - 0.02]} c={BRASS} />
      <B p={[0, 0.058, D / 2 - 0.016]} s={[W - 0.03, 0.082, 0.004]} c="#1d1f24" cast={false} />
      <group position={[0, 0, open]}>
        <B p={[0, 0.058, D / 2 - 0.08]} s={[W - 0.05, 0.066, 0.17]} c="#50565e" />
        <Tam k="qa-khay-tien" px={[420, 200]} paint={paintKhayTien} p={[0, 0.0925, D / 2 - 0.08]} s={[W - 0.06, 0.16]} r={[-Math.PI / 2, 0, 0]} />
        <B p={[0, 0.056, D / 2 + 0.008]} s={[W - 0.018, 0.084, 0.018]} c={BRASS} />
        <Tam k="qa-day-ket" px={[420, 96]} paint={paintDayKet} p={[0, 0.056, D / 2 + 0.018]} s={[W - 0.018, 0.084]} />
        <B p={[0, 0.056, D / 2 + 0.03]} s={[0.075, 0.016, 0.018]} c={CHROME_HI} /><B p={[-0.042, 0.056, D / 2 + 0.024]} s={[0.012, 0.022, 0.012]} c={BRASS_DK} /><B p={[0.042, 0.056, D / 2 + 0.024]} s={[0.012, 0.022, 0.012]} c={BRASS_DK} />
      </group>
      {/* thân và mặt phím dốc */}
      <B p={[0, 0.2, -0.075]} s={[W, 0.2, D - 0.15]} c={BRASS_DK} />
      <group position={[0, 0.205, 0.075]} rotation={[-0.55, 0, 0]}>
        <B p={[0, 0, -0.012]} s={[W, 0.2, 0.024]} c={BRASS} /><B p={[0, 0.096, 0.001]} s={[W, 0.012, 0.004]} c={BRASS_HI} cast={false} /><B p={[-W / 2 + 0.008, 0, 0.001]} s={[0.012, 0.19, 0.004]} c={BRASS_HI} cast={false} />
        <mesh position={[0, 0, 0.001]}><planeGeometry args={[W - 0.036, 0.17]} /><meshLambertMaterial color="#3b3430" /></mesh>
        {Array.from({length: 12}, (_, i) => { const col = i % 4, row = Math.floor(i / 4); return <Phim key={i} x={-0.111 + col * 0.074} y={0.052 - row * 0.052} on={phim === i} c0={i === 7 ? RED : col === 3 ? '#f6d776' : '#fbf5e3'} />; })}
      </group>
      <B p={[0, 0.318, -0.045]} s={[W, 0.03, D - 0.1]} c={BRASS_HI} />
      {/* hòm cờ số trên đỉnh, ô kính */}
      <B p={[0, 0.375, -0.06]} s={[W * 0.78, 0.085, 0.11]} c={BRASS} /><B p={[0, 0.42, -0.06]} s={[W * 0.82, 0.014, 0.125]} c={BRASS_HI} /><B p={[0, 0.335, -0.002]} s={[W * 0.82, 0.008, 0.006]} c={BRASS_DK} cast={false} />
      <mesh position={[0, 0.378, -0.003]}><planeGeometry args={[W * 0.62, 0.052]} /><meshBasicMaterial color="#1f2126" /></mesh>
      {[-0.06, 0, 0.06].map((x, i) => { const up = i === 1 ? co : 0; return <group key={x} position={[x, 0.356 + up * 0.024, 0]}><mesh position={[0, 0, 0.001]}><planeGeometry args={[0.046, 0.04]} /><meshBasicMaterial color={i === 1 ? '#fff6dc' : '#6d6a60'} /></mesh>{i === 1 ? <><mesh position={[0, 0, 0.002]}><ringGeometry args={[0.009, 0.014, 12]} /><meshBasicMaterial color={RED} /></mesh></> : null}</group>; })}
      <B p={[0, 0.348, 0.0005]} s={[W * 0.64, 0.016, 0.004]} c={BRASS} cast={false} />
      {/* tay quay */}
      <group position={[W / 2 + 0.018, 0.17, -0.02]} rotation={[quay, 0, 0]}><B p={[0, 0, 0]} s={[0.022, 0.03, 0.03]} c={CHROME_DK} /><B p={[0.012, 0.05, 0]} s={[0.012, 0.11, 0.014]} c={CHROME} /><FacetLathe profile={[[0.012, 0], [0.018, 0.012], [0.012, 0.034]]} sides={8} color={RED} pos={[0.012, 0.1, 0]} contact={false} /></group>
    </group>
  );
};

// ---------------------------------------------------------------- ĐỒ ĂN (hình phẳng 3-4 sắc, có điểm sáng)
/** vỏ bánh đan ô: nền nhân đỏ, các dải vỏ đan trên dưới, trong vùng đã clip */
const danO = (c: Ctx, W: number, H: number, u: number, ax: number) => {
  c.lineCap = 'butt'; const vec = (a: number) => [Math.cos(a), Math.sin(a)], A = vec(ax), B2 = vec(ax + 1.25), D = Math.hypot(W, H);
  const strip = (cx: number, cy: number, d: number[], l: number) => { const n = [-d[1], d[0]], hw = u * 0.3; P(c, [[cx - d[0] * l + n[0] * hw, cy - d[1] * l + n[1] * hw], [cx + d[0] * l + n[0] * hw, cy + d[1] * l + n[1] * hw], [cx + d[0] * l - n[0] * hw, cy + d[1] * l - n[1] * hw], [cx - d[0] * l - n[0] * hw, cy - d[1] * l - n[1] * hw]], '#efc272'); P(c, [[cx - d[0] * l + n[0] * hw, cy - d[1] * l + n[1] * hw], [cx + d[0] * l + n[0] * hw, cy + d[1] * l + n[1] * hw], [cx + d[0] * l + n[0] * hw * 0.45, cy + d[1] * l + n[1] * hw * 0.45], [cx - d[0] * l + n[0] * hw * 0.45, cy - d[1] * l + n[1] * hw * 0.45]], '#ffe2a0'); P(c, [[cx - d[0] * l - n[0] * hw, cy - d[1] * l - n[1] * hw], [cx + d[0] * l - n[0] * hw, cy + d[1] * l - n[1] * hw], [cx + d[0] * l - n[0] * hw * 0.5, cy + d[1] * l - n[1] * hw * 0.5], [cx - d[0] * l - n[0] * hw * 0.5, cy - d[1] * l - n[1] * hw * 0.5]], '#c78438'); };
  for (let i = -20; i <= 20; i++) strip(W / 2 + B2[0] * i * u, H / 2 + B2[1] * i * u, A, D);
  for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) if ((i + j) % 2 === 0) strip(W / 2 + A[0] * i * u + B2[0] * j * u, H / 2 + A[1] * i * u + B2[1] * j * u, B2, u * 0.56);
};
const quaAnhDao = (c: Ctx, x: number, y: number, r: number) => { tron(c, x, y, r, '#6f0f1e'); c.beginPath(); c.arc(x, y, r, Math.PI * 0.75, Math.PI * 1.75); c.closePath(); c.fillStyle = '#a81a2b'; c.fill(); tron(c, x - r * 0.34, y - r * 0.36, r * 0.24, '#ffb6a8'); };
const dia = (c: Ctx, W: number, H: number, cy = 0.68) => {
  const cx = W / 2, y = H * cy, rx = W * 0.47, ry = H * 0.27; elip(c, cx, y + ry * 0.2, rx * 0.99, ry, 'rgba(50,34,28,0.32)');
  elip(c, cx, y, rx, ry, '#3f7fb8'); elip(c, cx, y - ry * 0.035, rx * 0.965, ry * 0.92, '#fdfaf0'); elip(c, cx, y, rx * 0.86, ry * 0.76, '#3f7fb8'); elip(c, cx, y, rx * 0.845, ry * 0.735, '#f4efe2'); elip(c, cx, y + ry * 0.05, rx * 0.68, ry * 0.56, '#e3dccb');
  c.beginPath(); c.ellipse(cx, y, rx * 0.93, ry * 0.86, 0, Math.PI * 1.05, Math.PI * 1.42); c.strokeStyle = '#ffffff'; c.lineWidth = H * 0.018; c.stroke();
};
/** miếng bánh anh đào (không đĩa), nhìn chếch: mặt đan ô, mặt cắt nhân đỏ có quả, vành vỏ gợn, đường rắc */
export const paintMiengBanh = (c: Ctx, W: number, H: number, ox = 0, oy = 0, s = 1) => {
  c.save(); c.translate(ox, oy); c.scale(s, s); const U = W / 640;
  const T = [108 * U, 208 * U], L = [224 * U, 54 * U], R = [545 * U, 118 * U], hh = 92 * U, top = () => { c.beginPath(); c.moveTo(T[0], T[1]); c.lineTo(L[0], L[1]); c.quadraticCurveTo(405 * U, 28 * U, R[0], R[1]); c.closePath(); };
  P(c, [[T[0], T[1]], [R[0], R[1]], [R[0], R[1] + hh], [T[0], T[1] + hh]], '#a81b2c');
  c.save(); c.beginPath(); c.moveTo(T[0], T[1]); c.lineTo(R[0], R[1]); c.lineTo(R[0], R[1] + hh); c.lineTo(T[0], T[1] + hh); c.closePath(); c.clip();
  P(c, [[T[0], T[1] + 8 * U], [R[0], R[1] + 8 * U], [R[0], R[1] + hh * 0.42], [T[0], T[1] + hh * 0.42]], '#d42f39');
  P(c, [[T[0], T[1] + 12 * U], [R[0], R[1] + 12 * U], [R[0], R[1] + 24 * U], [T[0], T[1] + 24 * U]], '#f0605a');
  [[0.1, 0.52, 21], [0.25, 0.3, 25], [0.4, 0.58, 27], [0.56, 0.3, 24], [0.71, 0.56, 26], [0.87, 0.34, 23]].forEach(([u, v, r]) => quaAnhDao(c, T[0] + (R[0] - T[0]) * u, T[1] + (R[1] - T[1]) * u + hh * v, r * U));
  P(c, [[T[0], T[1] + hh * 0.78], [R[0], R[1] + hh * 0.78], [R[0], R[1] + hh], [T[0], T[1] + hh]], '#c98a3f'); P(c, [[T[0], T[1] + hh * 0.78], [R[0], R[1] + hh * 0.78], [R[0], R[1] + hh * 0.85], [T[0], T[1] + hh * 0.85]], '#efc477'); c.restore();
  c.save(); top(); c.fillStyle = '#b3202f'; c.fill(); c.clip(); for (let i = 0; i < 12; i++) quaAnhDao(c, (130 + (i * 71) % 400) * U, (56 + (i * 43) % 150) * U, 15 * U); c.scale(1, 1); danO(c, W, 260 * U, 54 * U, 0.34);
  P(c, [[T[0], T[1]], [R[0], R[1]], [R[0] - 24 * U, R[1] - 12 * U], [T[0] + 16 * U, T[1] - 15 * U]], 'rgba(150,70,20,0.3)'); c.restore();
  c.lineCap = 'round'; c.strokeStyle = '#c88539'; c.lineWidth = 34 * U; c.beginPath(); c.moveTo(L[0] + 3 * U, L[1] + 6 * U); c.quadraticCurveTo(405 * U, 35 * U, R[0] - 4 * U, R[1] + 3 * U); c.stroke();
  c.strokeStyle = '#efbe6c'; c.lineWidth = 25 * U; c.beginPath(); c.moveTo(L[0] + 2 * U, L[1] + 2 * U); c.quadraticCurveTo(405 * U, 30 * U, R[0] - 4 * U, R[1]); c.stroke();
  for (let i = 0; i <= 11; i++) { const t = i / 11, q = 1 - t, x = q * q * L[0] + 2 * q * t * 405 * U + t * t * R[0], y = q * q * L[1] + 2 * q * t * 30 * U + t * t * R[1]; c.fillStyle = '#ffdf99'; c.beginPath(); c.ellipse(x, y - 4 * U, 11 * U, 8 * U, 0.2, 0, 7); c.fill(); c.fillStyle = '#aa6c2a'; c.fillRect(x + 11 * U, y - 12 * U, 3 * U, 22 * U); }
  const r = rnd(17); c.fillStyle = '#fffaf0'; for (let i = 0; i < 32; i++) { const a = r(), b = r() * (1 - a), x = T[0] + (L[0] - T[0]) * a + (R[0] - T[0]) * b, y = T[1] + (L[1] - T[1]) * a + (R[1] - T[1]) * b; c.fillRect(x, y, 3 * U, 3 * U); }
  c.restore();
};
/** đĩa trắng viền xanh có miếng bánh anh đào, sốt đỏ chảy, thìa. miếng = false: đĩa còn vụn và vệt sốt */
export const paintDiaBanh = (mieng = true) => (c: Ctx, W: number, H: number) => {
  dia(c, W, H, 0.66);
  P(c, [[W * 0.62, H * 0.86], [W * 0.82, H * 0.73], [W * 0.84, H * 0.75], [W * 0.65, H * 0.88]], '#b9c3c8'); elip(c, W * 0.84, H * 0.71, W * 0.045, H * 0.03, '#dfe6e8', -0.5); elip(c, W * 0.835, H * 0.705, W * 0.022, H * 0.012, '#ffffff', -0.5);
  if (mieng) { P(c, [[W * 0.2, H * 0.735], [W * 0.68, H * 0.625], [W * 0.76, H * 0.65], [W * 0.3, H * 0.79]], 'rgba(84,40,30,0.36)'); c.beginPath(); c.moveTo(W * 0.36, H * 0.67); c.quadraticCurveTo(W * 0.33, H * 0.76, W * 0.38, H * 0.775); c.quadraticCurveTo(W * 0.46, H * 0.77, W * 0.47, H * 0.65); c.closePath(); c.fillStyle = '#a81b2c'; c.fill(); elip(c, W * 0.395, H * 0.755, W * 0.03, H * 0.012, '#ef6058'); paintMiengBanh(c, W, H, W * 0.115, H * 0.235, 0.71); }
  else { c.beginPath(); c.moveTo(W * 0.32, H * 0.66); c.quadraticCurveTo(W * 0.5, H * 0.58, W * 0.66, H * 0.64); c.quadraticCurveTo(W * 0.5, H * 0.72, W * 0.32, H * 0.66); c.fillStyle = 'rgba(176,30,46,0.82)'; c.fill(); const r = rnd(8); for (let i = 0; i < 16; i++) hop(c, W * (0.3 + r() * 0.42), H * (0.6 + r() * 0.15), 3 + r() * 6, 3 + r() * 4, r() < 0.5 ? '#e5ad5e' : '#c98a3f'); }
};
export const paintMiengBanhRoi = (c: Ctx, W: number, H: number) => paintMiengBanh(c, W, H);
export const paintManhVo = (c: Ctx, W: number, H: number) => { P(c, [[W * 0.08, H * 0.48], [W * 0.34, H * 0.1], [W * 0.82, H * 0.2], [W * 0.94, H * 0.62], [W * 0.56, H * 0.9], [W * 0.18, H * 0.82]], '#c98a3f'); P(c, [[W * 0.08, H * 0.48], [W * 0.34, H * 0.1], [W * 0.82, H * 0.2], [W * 0.7, H * 0.46], [W * 0.28, H * 0.54]], '#f0c678'); hop(c, W * 0.42, H * 0.27, W * 0.16, H * 0.07, '#fff0c4'); tron(c, W * 0.7, H * 0.66, W * 0.1, '#a81b2c'); };
const paintBanhNguyen = (c: Ctx, W: number, H: number) => {
  elip(c, W / 2, H * 0.82, W * 0.48, H * 0.14, 'rgba(62,40,30,0.3)'); elip(c, W / 2, H * 0.7, W * 0.47, H * 0.25, '#e9e3d4'); hop(c, W * 0.09, H * 0.52, W * 0.82, H * 0.18, '#c98a3f'); elip(c, W / 2, H * 0.72, W * 0.41, H * 0.18, '#c98a3f'); elip(c, W / 2, H * 0.48, W * 0.42, H * 0.3, '#c98a3f');
  c.save(); c.beginPath(); c.ellipse(W / 2, H * 0.46, W * 0.39, H * 0.27, 0, 0, 7); c.clip(); hop(c, 0, 0, W, H, '#b3202f'); for (let i = 0; i < 16; i++) quaAnhDao(c, W * (0.14 + ((i * 37) % 73) / 100), H * (0.22 + ((i * 29) % 47) / 100), W * 0.035); danO(c, W, H * 0.92, W * 0.09, 0.2); c.restore();
  c.save(); c.beginPath(); c.moveTo(W / 2, H * 0.46); c.lineTo(W * 0.96, H * 0.42); c.lineTo(W * 0.92, H * 0.92); c.lineTo(W * 0.62, H * 0.9); c.closePath(); c.clip(); elip(c, W / 2, H * 0.72, W * 0.46, H * 0.24, '#e9e3d4'); c.restore();
  P(c, [[W / 2, H * 0.46], [W * 0.87, H * 0.45], [W * 0.87, H * 0.6], [W / 2, H * 0.61]], '#a81b2c'); P(c, [[W / 2, H * 0.46], [W * 0.87, H * 0.45], [W * 0.87, H * 0.5], [W / 2, H * 0.52]], '#ea5555'); P(c, [[W / 2, H * 0.46], [W * 0.66, H * 0.76], [W * 0.66, H * 0.92], [W / 2, H * 0.61]], '#8f1727'); [0.58, 0.68, 0.78].forEach((x) => quaAnhDao(c, W * x, H * 0.54, W * 0.024));
  for (let i = 0; i < 34; i++) { const a = Math.PI * (0.55 + (i / 34) * 1.62), x = W / 2 + Math.cos(a) * W * 0.41, y = H * 0.46 + Math.sin(a) * H * 0.285; elip(c, x, y, W * 0.018, H * 0.024, i % 2 ? '#f0c678' : '#d99f4f'); }
};
const paintBanhChanh = (c: Ctx, W: number, H: number) => {
  elip(c, W / 2, H * 0.83, W * 0.48, H * 0.13, 'rgba(62,40,30,0.3)'); elip(c, W / 2, H * 0.72, W * 0.46, H * 0.22, '#c98a3f'); hop(c, W * 0.06, H * 0.5, W * 0.88, H * 0.22, '#f0d65e'); elip(c, W / 2, H * 0.5, W * 0.44, H * 0.2, '#f6e27f');
  const r = rnd(5); for (let i = 0; i < 18; i++) { const a = r() * 6.3, d = Math.sqrt(r()) * 0.8, x = W / 2 + Math.cos(a) * d * W * 0.36, y = H * 0.38 + Math.sin(a) * d * H * 0.14, s = W * (0.05 + r() * 0.035); P(c, [[x - s, y + s * 0.55], [x - s * 0.15, y - s * 1.0], [x + s, y + s * 0.55]], '#fbf4e0'); P(c, [[x - s * 0.15, y - s], [x + s, y + s * 0.55], [x + s * 0.2, y + s * 0.5]], '#e8cf9b'); elip(c, x - s * 0.25, y - s * 0.4, s * 0.14, s * 0.1, '#ffffff'); }
};
const paintDonut = (c: Ctx, W: number, H: number) => { elip(c, W / 2, H * 0.66, W * 0.47, H * 0.32, '#b97935'); elip(c, W / 2, H * 0.54, W * 0.47, H * 0.34, '#e88aa0'); P(c, [[W * 0.12, H * 0.42], [W * 0.46, H * 0.25], [W * 0.56, H * 0.3], [W * 0.2, H * 0.56]], '#f7bac8'); elip(c, W / 2, H * 0.53, W * 0.13, H * 0.09, '#6d4a31'); const r = rnd(3); for (let i = 0; i < 20; i++) { const a = r() * 6.3, d = 0.55 + r() * 0.35; hop(c, W / 2 + Math.cos(a) * d * W * 0.42, H * 0.53 + Math.sin(a) * d * H * 0.26, 7, 2.5, ['#fff6d6', '#6fc7c0', '#f6d65e', '#d9423c'][i % 4]); } };
const paintBanhNuong = (c: Ctx, W: number, H: number) => { P(c, [[W * 0.05, H * 0.9], [W * 0.12, H * 0.48], [W * 0.88, H * 0.48], [W * 0.95, H * 0.9]], '#c98a3f'); c.beginPath(); c.moveTo(W * 0.05, H * 0.52); c.quadraticCurveTo(W * 0.1, H * 0.08, W * 0.5, H * 0.08); c.quadraticCurveTo(W * 0.9, H * 0.08, W * 0.95, H * 0.52); c.closePath(); c.fillStyle = '#e8ad5c'; c.fill(); P(c, [[W * 0.22, H * 0.38], [W * 0.42, H * 0.18], [W * 0.6, H * 0.18], [W * 0.34, H * 0.44]], '#ffdf9c'); const r = rnd(2); for (let i = 0; i < 8; i++) tron(c, W * (0.2 + r() * 0.6), H * (0.25 + r() * 0.28), W * 0.022, '#5a3320'); };
/** đĩa bánh mì kẹp và khoai chiên */
function paintDiaKep(c: Ctx, W: number, H: number) {
  dia(c, W, H, 0.7); const x = W * 0.34, b = H * 0.68, w = W * 0.2;
  P(c, [[x - w, b], [x + w, b], [x + w * 0.92, b - H * 0.07], [x - w * 0.92, b - H * 0.07]], '#d29347'); P(c, [[x - w * 1.08, b - H * 0.06], [x + w * 1.05, b - H * 0.07], [x + w * 0.88, b - H * 0.13], [x - w * 0.9, b - H * 0.12]], '#5b3324'); P(c, [[x - w * 1.14, b - H * 0.12], [x - w * 0.6, b - H * 0.19], [x, b - H * 0.13], [x + w * 0.56, b - H * 0.19], [x + w * 1.12, b - H * 0.11], [x + w * 0.5, b - H * 0.095], [x, b - H * 0.075], [x - w * 0.56, b - H * 0.09]], '#6aad4f');
  P(c, [[x - w * 1.02, b - H * 0.15], [x + w, b - H * 0.15], [x + w * 0.92, b - H * 0.21], [x - w * 0.96, b - H * 0.2]], '#e4503f');
  c.beginPath(); c.moveTo(x - w, b - H * 0.2); c.quadraticCurveTo(x - w * 0.8, b - H * 0.5, x, b - H * 0.51); c.quadraticCurveTo(x + w * 0.8, b - H * 0.5, x + w, b - H * 0.2); c.closePath(); c.fillStyle = '#e4a750'; c.fill(); P(c, [[x - w * 0.72, b - H * 0.3], [x - w * 0.34, b - H * 0.43], [x - w * 0.02, b - H * 0.45], [x - w * 0.42, b - H * 0.3]], '#ffdf9c'); const r = rnd(6); for (let i = 0; i < 9; i++) elip(c, x + (r() - 0.5) * w * 1.3, b - H * (0.3 + r() * 0.14), 3.5, 2, '#fff6dc', r() * 3);
  for (let i = 0; i < 13; i++) { const fx = W * (0.62 + r() * 0.2), a = -0.5 + r() * 1.0, l = H * 0.18; c.save(); c.translate(fx, H * 0.7); c.rotate(a); hop(c, -5, -l, 10, l, i % 3 === 0 ? '#e7a93f' : '#f4cd67'); hop(c, -5, -l, 3, l, '#ffe69d'); c.restore(); }
}
/** cốc cà phê sứ trên đĩa lót */
const paintCocCaPhe = (c: Ctx, W: number, H: number) => {
  elip(c, W / 2, H * 0.86, W * 0.46, H * 0.11, 'rgba(50,34,28,0.3)'); elip(c, W / 2, H * 0.82, W * 0.46, H * 0.12, '#3f7fb8'); elip(c, W / 2, H * 0.805, W * 0.43, H * 0.1, '#fbf8ee');
  c.strokeStyle = '#ece6d6'; c.lineWidth = W * 0.05; c.beginPath(); c.arc(W * 0.76, H * 0.47, W * 0.11, -1.2, 1.3); c.stroke(); c.strokeStyle = '#c9c1ad'; c.lineWidth = W * 0.016; c.beginPath(); c.arc(W * 0.76, H * 0.47, W * 0.085, -1.1, 1.2); c.stroke();
  P(c, [[W * 0.2, H * 0.24], [W * 0.8, H * 0.24], [W * 0.68, H * 0.78], [W * 0.32, H * 0.78]], '#fbf8ee'); P(c, [[W * 0.58, H * 0.24], [W * 0.8, H * 0.24], [W * 0.68, H * 0.78], [W * 0.56, H * 0.78]], '#e3dcc9'); P(c, [[W * 0.27, H * 0.3], [W * 0.33, H * 0.3], [W * 0.38, H * 0.7], [W * 0.34, H * 0.7]], '#ffffff'); hop(c, W * 0.215, H * 0.325, W * 0.57, H * 0.018, '#3f7fb8');
  elip(c, W / 2, H * 0.24, W * 0.3, H * 0.075, '#fbf8ee'); elip(c, W / 2, H * 0.245, W * 0.265, H * 0.055, '#4a2a1b'); elip(c, W * 0.44, H * 0.235, W * 0.11, H * 0.018, '#8a5a3a');
};
export const paintLyNuocNgot = (c: Ctx, W: number, H: number) => {
  P(c, [[W * 0.14, H * 0.06], [W * 0.86, H * 0.06], [W * 0.72, H * 0.97], [W * 0.28, H * 0.97]], '#cfe9ea'); P(c, [[W * 0.18, H * 0.22], [W * 0.82, H * 0.22], [W * 0.71, H * 0.92], [W * 0.29, H * 0.92]], '#6d3a24'); P(c, [[W * 0.6, H * 0.22], [W * 0.82, H * 0.22], [W * 0.71, H * 0.92], [W * 0.58, H * 0.92]], '#4b2719');
  hop(c, W * 0.26, H * 0.26, W * 0.2, H * 0.11, '#d6efee'); hop(c, W * 0.52, H * 0.3, W * 0.17, H * 0.1, '#bfe2e2'); P(c, [[W * 0.26, H * 0.42], [W * 0.31, H * 0.42], [W * 0.36, H * 0.88], [W * 0.33, H * 0.88]], 'rgba(255,255,255,0.48)'); P(c, [[W * 0.62, 0], [W * 0.68, 0], [W * 0.53, H * 0.6], [W * 0.47, H * 0.6]], '#e65a4d'); P(c, [[W * 0.65, 0], [W * 0.68, 0], [W * 0.53, H * 0.6], [W * 0.5, H * 0.6]], '#fbf3e6');
};

/** sợi hơi mảnh cắt giấy, uốn lên theo khung */
export const SoiHoi: React.FC<{pos: V3; f: number; h?: number; w?: number; seed?: number; color?: string; op?: number; day?: number}> = ({pos, f, h = 0.24, w = 0.035, seed = 1, color = '#ffffff', op = 0.58, day = 0.009}) => {
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(), N = 18, idx: number[] = []; for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((N + 1) * 6), 3)); g.setIndex(idx); return g; }, []);
  useLayoutEffect(() => { const p = geo.attributes.position as THREE.BufferAttribute, N = 18; for (let i = 0; i <= N; i++) { const t = i / N, x = Math.sin(t * 5.2 + f * 0.11 + seed * 1.9) * w * (0.2 + t) + Math.sin(t * 11 - f * 0.07 + seed) * w * 0.22 * t, hw = day * Math.sin(Math.PI * Math.min(1, t * 1.02)) * (1.15 - t * 0.6) + 0.001; p.setXYZ(i * 2, x - hw, t * h, 0); p.setXYZ(i * 2 + 1, x + hw, t * h, 0); } p.needsUpdate = true; geo.computeBoundingSphere(); }, [geo, f, h, w, seed, day]);
  return <mesh geometry={geo} position={pos} renderOrder={9}><meshBasicMaterial color={color} transparent opacity={op} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
};
/** đĩa bánh anh đào đặt trên mặt quầy (điểm nhấn cảnh 5). pos = chân đĩa. mieng: còn miếng bánh không */
export const DiaBanhAnhDao: React.FC<{pos: V3; mieng?: boolean; w?: number}> = ({pos, mieng = true, w = 0.3}) => <Sprite name={mieng ? 'qa-dia-banh-v2' : 'qa-dia-banh-trong-v2'} art={paintDiaBanh(mieng)} px={[960, 660]} w={w} pos={pos} cast={false} shade={0.1} />;
/** miếng bánh rời, để tay nhón và đút vào túi */
export const MiengBanhAnhDao: React.FC<{pos: V3; w?: number; rot?: number}> = ({pos, w = 0.17, rot = 0}) => <group position={pos} rotation={[0, 0, rot]}><Sprite name="qa-mieng-banh-v2" art={paintMiengBanhRoi} px={[640, 340]} w={w} pos={[0, -w * 0.26, 0]} cast={false} shade={0} /></group>;
export const ManhVoBanh: React.FC<{pos: V3; w?: number; rot?: number}> = ({pos, w = 0.05, rot = 0}) => <group position={pos} rotation={[0, 0, rot]}><Sprite name="qa-manh-vo" art={paintManhVo} px={[120, 90]} w={w} pos={[0, -w * 0.37, 0]} cast={false} shade={0} /></group>;
export const CocCaPhe: React.FC<{pos: V3; f?: number; w?: number; hoi?: boolean}> = ({pos, f = 0, w = 0.16, hoi = true}) => (
  <group position={pos}>
    <Sprite name="qa-coc-ca-phe" art={paintCocCaPhe} px={[320, 300]} w={w} pos={[0, 0, 0]} cast={false} shade={0.08} />
    {hoi ? <><SoiHoi pos={[-w * 0.08, w * 0.74, 0.004]} f={f} h={w * 1.2} w={w * 0.16} seed={1} day={w * 0.04} /><SoiHoi pos={[w * 0.1, w * 0.74, 0.006]} f={f + 16} h={w * 1.0} w={w * 0.14} seed={3} day={w * 0.035} /></> : null}
  </group>
);
export const DiaBanhKep: React.FC<{pos: V3; w?: number}> = ({pos, w = 0.34}) => <Sprite name="qa-dia-kep" art={paintDiaKep} px={[420, 260]} w={w} pos={pos} cast={false} shade={0.08} />;
export const LyNuocNgot: React.FC<{pos: V3; h?: number}> = ({pos, h = 0.18}) => <Sprite name="qa-ly-ngot" art={paintLyNuocNgot} px={[110, 200]} w={(h * 110) / 200} pos={pos} cast={false} shade={0.06} />;

// ---------------------------------------------------------------- gia vị và đồ nhỏ trên quầy
export const ChaiTuong: React.FC<{p: V3; c0?: string; cap?: string}> = ({p, c0 = '#c4302b', cap = '#f4f0e4'}) => <group position={p}><FacetLathe profile={[[0.03, 0], [0.034, 0.012], [0.034, 0.1], [0.018, 0.145], [0.012, 0.175]]} sides={8} color={c0} contact={false} /><B p={[-0.014, 0.065, 0.031]} s={[0.006, 0.08, 0.002]} c="#ffffff" cast={false} /><B p={[0, 0.06, 0.035]} s={[0.05, 0.042, 0.001]} c="#f7f0dc" cast={false} /><B p={[0, 0.185, 0]} s={[0.026, 0.024, 0.026]} c={cap} /></group>;
export const LoDuong: React.FC<{p: V3}> = ({p}) => <group position={p}><FacetLathe profile={[[0.045, 0], [0.052, 0.012], [0.052, 0.085], [0.035, 0.112], [0.028, 0.12]]} sides={10} color="#d4eeee" contact={false} /><FacetLathe profile={[[0.05, 0.004], [0.049, 0.06]]} sides={10} color="#fbf8ee" contact={false} /><FacetLathe profile={[[0.03, 0.118], [0.036, 0.125], [0.03, 0.15], [0.008, 0.162]]} sides={10} color={CHROME} contact={false} /><B p={[-0.026, 0.05, 0.046]} s={[0.006, 0.06, 0.002]} c="#ffffff" cast={false} /></group>;
const MuoiTieu: React.FC<{p: V3}> = ({p}) => <group position={p}>{[[-0.035, '#f4f1e8'], [0.035, '#5b534c']].map(([x, col]) => <group key={x as number} position={[x as number, 0, 0]}><FacetLathe profile={[[0.022, 0], [0.024, 0.01], [0.02, 0.07]]} sides={8} color="#d3ecec" contact={false} /><FacetLathe profile={[[0.021, 0.003], [0.019, 0.04]]} sides={8} color={col as string} contact={false} /><FacetLathe profile={[[0.021, 0.07], [0.016, 0.085], [0.004, 0.09]]} sides={8} color={CHROME} contact={false} /></group>)}</group>;
export const HopGiayAn: React.FC<{p: V3}> = ({p}) => <group position={p}><B p={[0, 0.07, 0]} s={[0.13, 0.14, 0.09]} c={CHROME} /><B p={[-0.04, 0.07, 0.046]} s={[0.018, 0.13, 0.002]} c={CHROME_HI} cast={false} /><B p={[0, 0.07, 0.047]} s={[0.1, 0.09, 0.002]} c="#fbf8ec" cast={false} /><B p={[0, 0.112, 0.05]} s={[0.05, 0.012, 0.004]} c={CHROME_DK} cast={false} /><B p={[0, 0.005, 0]} s={[0.15, 0.01, 0.11]} c={CHROME_DK} /></group>;
/** cụm gia vị đặt trên quầy, trên bàn */
export const CumGiaVi: React.FC<{p: V3}> = ({p}) => <group position={p}><HopGiayAn p={[0, 0, -0.04]} /><ChaiTuong p={[0.13, 0, -0.02]} /><ChaiTuong p={[0.21, 0, 0.0]} c0="#e7b92f" cap="#c4302b" /><MuoiTieu p={[-0.16, 0, 0.0]} /></group>;

// ---------------------------------------------------------------- bàn góc, giá báo tiền cảnh
export const BanGoc: React.FC<{pos: V3}> = ({pos}) => {
  const Gh: React.FC<{z: number; dir: number}> = ({z, dir}) => (
    <group position={[0, 0, z]}>
      <B p={[0, 0.22, 0]} s={[1.36, 0.44, 0.5]} c="#7b1b22" /><B p={[0, 0.47, 0]} s={[1.38, 0.1, 0.52]} c={RED} /><B p={[0, 0.525, 0.25 * dir]} s={[1.38, 0.012, 0.02]} c={CHROME_HI} cast={false} />
      <B p={[0, 0.82, -0.2 * dir]} s={[1.38, 0.74, 0.14]} c={RED} />{[-0.46, -0.23, 0, 0.23, 0.46].map((x) => <B key={x} p={[x, 0.84, -0.13 * dir]} s={[0.012, 0.66, 0.006]} c={RED_DK} cast={false} />)}<B p={[0, 1.2, -0.2 * dir]} s={[1.4, 0.03, 0.16]} c={CHROME} />
    </group>
  );
  return (
    <group position={pos}>
      <Gh z={-0.82} dir={1} /><Gh z={0.82} dir={-1} />
      <FacetLathe profile={[[0.24, 0], [0.26, 0.015], [0.08, 0.04], [0.05, 0.1], [0.05, 0.7]]} sides={12} color={CHROME} /><B p={[0, 0.735, 0]} s={[1.22, 0.04, 0.82]} c="#f0e8d4" /><B p={[0, 0.76, 0.416]} s={[1.24, 0.012, 0.012]} c={CHROME_HI} cast={false} /><B p={[0, 0.72, 0.416]} s={[1.24, 0.03, 0.01]} c={CHROME} />
      <CumGiaVi p={[-0.28, 0.755, -0.14]} /><LyNuocNgot pos={[0.28, 0.755, 0.1]} /><LyNuocNgot pos={[0.08, 0.755, 0.2]} h={0.16} />
      <group position={[0.42, 0.755, -0.22]}><B p={[0, 0.08, 0]} s={[0.17, 0.16, 0.1]} c="#c9d1d4" /><B p={[0, 0.11, 0.052]} s={[0.13, 0.07, 0.002]} c="#f4e6b4" cast={false} />{[-0.045, 0, 0.045].map((x) => <B key={x} p={[x, 0.04, 0.052]} s={[0.03, 0.03, 0.002]} c={RED} cast={false} />)}<B p={[0, 0.165, 0]} s={[0.18, 0.012, 0.11]} c={CHROME_HI} /></group>
    </group>
  );
};
const paintChongBao = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#f2ecdc'); hop(c, W * 0.05, H * 0.08, W * 0.9, H * 0.13, INK); hop(c, W * 0.05, H * 0.24, W * 0.9, H * 0.02, INK); hop(c, W * 0.06, H * 0.3, W * 0.42, H * 0.36, '#9aa1a3'); P(c, [[W * 0.06, H * 0.66], [W * 0.2, H * 0.42], [W * 0.33, H * 0.54], [W * 0.48, H * 0.36], [W * 0.48, H * 0.66]], '#6c7377');
  for (let i = 0; i < 11; i++) hop(c, W * 0.54, H * (0.31 + i * 0.05), W * 0.4, H * 0.016, '#7a7a76'); for (let i = 0; i < 4; i++) hop(c, W * 0.06, H * (0.72 + i * 0.05), W * 0.42, H * 0.016, '#7a7a76');
};
export const GiaBaoTruoc: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <B p={[0, 0.42, 0]} s={[1.1, 0.84, 0.46]} c="#7a5236" /><B p={[0, 0.85, 0]} s={[1.14, 0.03, 0.5]} c="#9b6f4c" />{[-0.45, -0.22, 0, 0.22, 0.45].map((x) => <B key={x} p={[x, 0.42, 0.232]} s={[0.012, 0.8, 0.004]} c="#5a3b27" cast={false} />)}
    {[[-0.2, 0.08], [0.3, -0.08]].map(([x, a], k) => <group key={k} position={[x, 0.865, 0.03]} rotation={[0, a, 0]}>{Array.from({length: 6}, (_, i) => <B key={i} p={[i * 0.002, i * 0.008, 0]} s={[0.44, 0.008, 0.33]} c={i % 2 ? '#e7e0cf' : '#f4eedf'} />)}<Tam k="qa-chong-bao" px={[360, 280]} paint={paintChongBao} p={[0.01, 0.052, 0]} s={[0.43, 0.32]} r={[-Math.PI / 2, 0, 0]} /></group>)}
  </group>
);

// ---------------------------------------------------------------- món cầm tay
const paintToTien = (c: Ctx, W: number, H: number) => {
  hop(c, 0, 0, W, H, '#79b488'); hop(c, W * 0.03, H * 0.06, W * 0.94, H * 0.88, '#a6d7ab'); c.strokeStyle = '#3e7a55'; c.lineWidth = Math.max(2, W * 0.012); c.strokeRect(W * 0.07, H * 0.14, W * 0.86, H * 0.72);
  elip(c, W / 2, H / 2, W * 0.18, H * 0.3, '#3e7a55'); elip(c, W / 2, H / 2, W * 0.14, H * 0.24, '#cdeac8'); hop(c, W * 0.47, H * 0.34, W * 0.06, H * 0.32, '#3e7a55'); hop(c, W * 0.42, H * 0.42, W * 0.16, H * 0.05, '#3e7a55'); hop(c, W * 0.42, H * 0.54, W * 0.16, H * 0.05, '#3e7a55');
  [[0.14, 0.26], [0.86, 0.26], [0.14, 0.74], [0.86, 0.74]].forEach(([x, y]) => tron(c, W * x, H * y, H * 0.1, '#3e7a55')); for (let i = 0; i < 3; i++) { hop(c, W * 0.2, H * (0.34 + i * 0.13), W * 0.09, H * 0.035, '#5d9970'); hop(c, W * 0.71, H * (0.34 + i * 0.13), W * 0.09, H * 0.035, '#5d9970'); }
};
const paintXapTien = (c: Ctx, W: number, H: number) => {
  const r = rnd(5); for (let i = 7; i >= 1; i--) { const dx = (r() - 0.5) * 8, dy = i * H * 0.022; hop(c, W * 0.02 + dx, H * 0.08 + dy, W * 0.95, H * 0.76, i % 2 ? '#5f9e74' : '#88c294'); }
  c.save(); c.translate(0, H * 0.04); paintToTienIn(c, W, H * 0.8); c.restore();
  hop(c, W * 0.4, 0, W * 0.2, H, '#f4ead0'); hop(c, W * 0.4, 0, W * 0.035, H, '#fff9e6'); hop(c, W * 0.565, 0, W * 0.035, H, '#c9b98f'); hop(c, W * 0.45, H * 0.42, W * 0.1, H * 0.1, RED);
};
const paintToTienIn = (c: Ctx, W: number, H: number) => { c.save(); c.translate(W * 0.015, H * 0.02); paintToTien(c, W * 0.965, H * 0.96); c.restore(); };
const paintVi = (c: Ctx, W: number, H: number) => {
  P(c, [[W * 0.2, H * 0.2], [W * 0.58, H * 0.03], [W * 0.84, H * 0.03], [W * 0.84, H * 0.3], [W * 0.2, H * 0.34]], '#88c294'); P(c, [[W * 0.46, H * 0.11], [W * 0.68, H * 0.03], [W * 0.84, H * 0.03], [W * 0.84, H * 0.14]], '#a6d7ab'); hop(c, W * 0.62, H * 0.08, W * 0.12, H * 0.04, '#3e7a55');
  P(c, [[W * 0.03, H * 0.22], [W * 0.97, H * 0.2], [W, H * 0.92], [W * 0.05, H * 0.97]], '#7a4b2e'); P(c, [[W * 0.03, H * 0.22], [W * 0.5, H * 0.21], [W * 0.52, H * 0.95], [W * 0.05, H * 0.97]], '#99643e'); P(c, [[W * 0.5, H * 0.21], [W * 0.54, H * 0.21], [W * 0.55, H * 0.95], [W * 0.52, H * 0.95]], '#55321e');
  c.strokeStyle = '#e5c48c'; c.lineWidth = Math.max(2, W * 0.012); c.setLineDash([W * 0.03, W * 0.018]); c.strokeRect(W * 0.08, H * 0.29, W * 0.84, H * 0.59); c.setLineDash([]); P(c, [[W * 0.07, H * 0.26], [W * 0.4, H * 0.25], [W * 0.13, H * 0.42]], 'rgba(255,226,176,0.42)'); hop(c, W * 0.62, H * 0.48, W * 0.26, H * 0.2, '#65402a'); hop(c, W * 0.66, H * 0.53, W * 0.18, H * 0.04, '#d6a65a');
};
/** ổ bánh mì: vỏ vàng cam ba sắc, ba vết rạch sáng. can = true: một đầu đã cắn, lộ ruột kem */
export const paintOBanh = (can = false) => (c: Ctx, W: number, H: number) => {
  const shape = () => { c.beginPath(); c.moveTo(W * 0.05, H * 0.66); c.quadraticCurveTo(W * 0.03, H * 0.32, W * 0.23, H * 0.18); c.quadraticCurveTo(W * 0.5, H * 0.02, W * 0.78, H * 0.17); c.quadraticCurveTo(W * 0.98, H * 0.3, W * 0.95, H * 0.68); c.quadraticCurveTo(W * 0.92, H * 0.92, W * 0.68, H * 0.93); c.lineTo(W * 0.28, H * 0.93); c.quadraticCurveTo(W * 0.07, H * 0.91, W * 0.05, H * 0.66); c.closePath(); };
  shape(); c.fillStyle = '#d98a2f'; c.fill(); c.save(); shape(); c.clip();
  P(c, [[0, 0], [W, 0], [W, H * 0.34], [W * 0.7, H * 0.5], [W * 0.3, H * 0.54], [0, H * 0.5]], '#f0ae4b'); P(c, [[0, H * 0.74], [W * 0.3, H * 0.8], [W * 0.7, H * 0.78], [W, H * 0.66], [W, H], [0, H]], '#a9591f');
  P(c, [[W * 0.14, H * 0.3], [W * 0.5, H * 0.1], [W * 0.68, H * 0.13], [W * 0.26, H * 0.38]], '#ffd27e'); c.restore();
  [[0.27, 0.42, 0.42], [0.5, 0.36, 0.34], [0.73, 0.42, 0.26]].forEach(([x, y, q]) => { c.save(); c.translate(W * x, H * y); c.rotate(q); const l = H * 0.25, k = W * 0.04, lens = (m: number, f: string) => { c.beginPath(); c.moveTo(0, -l * m); c.quadraticCurveTo(k * m, 0, 0, l * m); c.quadraticCurveTo(-k * m, 0, 0, -l * m); c.closePath(); c.fillStyle = f; c.fill(); }; c.translate(W * 0.006, H * 0.012); lens(1.08, '#8b4a1d'); c.translate(-W * 0.006, -H * 0.012); lens(1, '#f7d58f'); lens(0.68, '#fff0c8'); c.restore(); });
  const r = rnd(11); for (let i = 0; i < 26; i++) { const x = W * (0.12 + r() * 0.76), y = H * (0.2 + r() * 0.62); hop(c, x, y, W * 0.008, H * 0.012, r() < 0.5 ? '#b56a26' : '#ffdc98'); }
  if (can) { c.globalCompositeOperation = 'destination-out'; [[0.93, 0.28, 0.13], [0.99, 0.5, 0.15], [0.92, 0.72, 0.13]].forEach(([x, y, s]) => tron(c, W * x, H * y, W * s, '#000')); c.globalCompositeOperation = 'source-atop'; [[0.93, 0.28, 0.155], [0.99, 0.5, 0.175], [0.92, 0.72, 0.155]].forEach(([x, y, s]) => tron(c, W * x, H * y, W * s, '#f7e6bd')); c.globalCompositeOperation = 'source-over'; for (let i = 0; i < 14; i++) hop(c, W * (0.78 + r() * 0.1), H * (0.22 + r() * 0.55), W * 0.008, H * 0.012, '#d7b478'); }
};
/** xấp tiền xanh có đai giấy. pos = giữa xấp, rot = nghiêng */
export const XapTien: React.FC<{pos: V3; w?: number; rot?: number}> = ({pos, w = 0.24, rot = 0}) => <group position={pos} rotation={[0, 0, rot]}><Sprite name="qa-xap-tien" art={paintXapTien} px={[420, 210]} w={w} pos={[0, -w * 0.25, 0]} cast={false} shade={0} /></group>;
/** một tờ tiền rời cho lúc xấp bung (rotY để lật, rot để xoay) */
export const ToTien: React.FC<{pos: V3; w?: number; rot?: number; lat?: number}> = ({pos, w = 0.17, rot = 0, lat = 0}) => <group position={pos} rotation={[lat, 0, rot]}><Sprite name="qa-to-tien" art={paintToTien} px={[320, 150]} w={w} pos={[0, -w * 0.234, 0]} cast={false} shade={0} /></group>;
/** ví da nâu mở hé, thò một tờ tiền */
export const ViDa: React.FC<{pos: V3; w?: number; rot?: number; flip?: boolean}> = ({pos, w = 0.17, rot = 0, flip}) => <group position={pos} rotation={[0, 0, rot]}><Sprite name="qa-vi-da" art={paintVi} px={[300, 240]} w={w} pos={[0, -w * 0.4, 0]} flip={flip} cast={false} shade={0} /></group>;
/** ổ bánh mì; can = đã cắn; hoi = hai sợi hơi ấm theo f */
export const OBanhMi: React.FC<{pos: V3; w?: number; rot?: number; can?: boolean; hoi?: boolean; f?: number}> = ({pos, w = 0.34, rot = 0, can = false, hoi = true, f = 0}) => (
  <group position={pos} rotation={[0, 0, rot]}>
    <Sprite name={can ? 'qa-o-banh-can' : 'qa-o-banh'} art={paintOBanh(can)} px={[560, 280]} w={w} pos={[0, -w * 0.25, 0]} cast={false} shade={0} />
    {hoi ? <><SoiHoi pos={[-w * 0.16, w * 0.21, 0.004]} f={f} h={w * 0.72} w={w * 0.075} seed={2} day={w * 0.022} /><SoiHoi pos={[w * 0.14, w * 0.22, 0.006]} f={f + 14} h={w * 0.6} w={w * 0.065} seed={5} day={w * 0.019} /></> : null}
  </group>
);
