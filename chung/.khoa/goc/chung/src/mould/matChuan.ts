import {registerAddOn} from './draw';
import type {Brow, Spec} from './draw';

/** MẮT CHUẨN (Daniel duyệt 25/11/2026). Số đo lấy từ chín mặt của video gốc (Rover Explains): mỗi mắt rộng khoảng 0,40 bề ngang mặt,
 *  hai mắt LUÔN chạm nhau ở giữa (cặp mắt 0,75–0,90 bề ngang mặt), mắt tròn, tròng khoảng 0,3 bề ngang mắt. Mặt bình thường thì mắt
 *  mở tròn, không có nét mí kẻ ngang; mí chỉ hạ khi nét mặt cần (giận, buồn, chán, nheo) và nét mí không thò ra ngoài mắt.
 *
 *  KHÔNG ĐỔI CÁC SỐ NÀY và không kênh nào tự vẽ lại mắt. Ngày 23/11 một phiên chữa lời chê "mắt như đeo kính bảo hộ" bằng cách thu mắt còn
 *  0,24 bề ngang mặt, tách hai mắt ra: cả dàn nhân vật lệch khỏi video gốc, Daniel bắt làm lại và dặn "đừng để điều này lặp lại".
 *  Bị chê về mặt thì đặt mặt cạnh `skills/bang-cham/mat-chuan.jpg`, làm mẫu nhỏ, hỏi Daniel; `python3 tools/kiem_mat.py` canh các số này.
 *
 *  Dùng: `matChuan(spec)` (tắt mắt của bộ khuôn bằng `noEyes`, cắm lớp `mat-chuan` vẽ mắt và lông mày). Nhân vật có lông mày riêng thì
 *  cắm `{id: 'mat-chuan', opt: {may: false}}` hoặc gọi thẳng `veMat` trong lớp `head` của mình. Bề ngang mặt của bộ khuôn là 382. */
export const MAT_CHUAN = {rx: 76, ry: 80, y: 300, tam: 278};
export const MAT = {L: MAT_CHUAN.tam - MAT_CHUAN.rx, R: MAT_CHUAN.tam + MAT_CHUAN.rx, y: MAT_CHUAN.y, rx: MAT_CHUAN.rx, ry: MAT_CHUAN.ry};
/** nhan: nếp dưới mắt 0..1; may: độ dày lông mày (1 = thường), false = không vẽ (nhân vật có mày riêng); mi: có mi dù spec không bật `lashes` */
export type MatOpt = {nhan?: number; may?: number | false; mi?: boolean};

type C2 = CanvasRenderingContext2D;
const net = (c: C2, p: [number, number][], col: string, w: number) => { c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
const cong = (c: C2, x0: number, y0: number, qx: number, qy: number, x1: number, y1: number, col: string, w: number) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(qx, qy, x1, y1); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.stroke(); };
/** mí của bộ khuôn (đo theo mắt cũ, −58 là mặt bình thường) đổi sang mắt chuẩn: −58 thành mở hết, +80 vẫn là nhắm; đi liền nên chớp mắt không giật */
const MO = (v: number) => -80 + (v + 58) * (160 / 138);

/** hai mắt, vẽ trong hệ toạ độ đầu của bộ khuôn (lớp `head`) */
export const veMat = (c: C2, s: Spec, o: MatOpt = {}) => {
  const K = s.palette ?? {}, e = s.expr, {rx, ry} = MAT, y0 = MAT.y + (s.faceDy ?? 0) * 0.4, kx = rx / 86, nhan = o.nhan ?? 0;
  if (!s.noEyes) {   // spec cũ chưa tắt mắt của bộ khuôn: tô da che đi (đường lui; nên dùng `matChuan(spec)` để khỏi cần)
    const da = K.skinB ?? '#cb9875';   // một màu da phẳng, như mặt
    c.beginPath(); c.ellipse(196, 292, 96, s.beard ? 84 : 96, 0, 0, Math.PI * 2); c.ellipse(361, 292, 96, s.beard ? 84 : 96, 0, 0, Math.PI * 2); c.fillStyle = da; c.fill();
  }
  const coMi = !!(s.lashes || o.mi), vien = K.lidEdge ?? '#85624b', mi = coMi ? (K.brow ?? '#2a1f18') : vien, trang = s.whites ?? '#f6f2ea';
  ([['L', MAT.L], ['R', MAT.R]] as ['L' | 'R', number][]).forEach(([sd, cx]) => {
    const cy = y0, out = sd === 'L' ? -1 : 1;
    if (nhan > 0.03) cong(c, cx - rx * 0.62, cy + ry + 6, cx, cy + ry + 16, cx + rx * 0.62, cy + ry + 6, `rgba(92,58,42,${0.38 * nhan})`, 4);
    if (e.closed) {   // nhắm: một cung mềm lõm xuống; người có mi thì vài sợi cụp ở khoé ngoài
      cong(c, cx - rx * 0.8, cy + 8, cx, cy + 52, cx + rx * 0.8, cy + 8, mi, coMi ? 8 : 7);
      if (coMi) [[0, 16], [-12, 20], [-24, 16]].forEach(([dx, l]) => cong(c, cx + out * (rx * 0.8 + dx * 0.4), cy + 12 - dx * 0.2, cx + out * (rx * 0.86 + dx * 0.4), cy + 12 + l * 0.6, cx + out * (rx * 0.9 + dx * 0.4 + l * 0.3), cy + 12 + l, mi, 4));
      return;
    }
    const lid0 = (sd === 'L' ? e.lidL : e.lidR) ?? (e.upper === 'none' ? null : e.upper === 'angry' ? [-72, -18] : e.upper === 'sad' ? [-13, -52] : [10, 10]);
    const lid = lid0 ? [MO(lid0[0]), MO(lid0[1])] : null, coMiTren = !!lid && Math.max(lid[0], lid[1]) > -78;
    const ty = (v: number) => cy + v * (ry / 80), xo = cx + out * rx, xi = cx - out * rx, yo = coMiTren ? ty(lid![0]) : cy - 2 * ry, yi = coMiTren ? ty(lid![1]) : cy - 2 * ry;
    const amt = e.lower === 'curve' ? e.lowerAmt ?? 1 : 0, day = e.lower === 'flat' ? cy + ry * 0.68 : cy + ry + 2 - 10 * amt;
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
    c.beginPath(); c.moveTo(xo, yo); c.lineTo(xi, yi); c.lineTo(xi, day); c.quadraticCurveTo(cx, day - 20 * amt, xo, day); c.closePath(); c.clip();
    c.fillStyle = trang; c.fillRect(cx - rx - 4, cy - ry - 4, rx * 2 + 8, ry * 2 + 8);
    if (!e.blank) {
      const [gx, gy] = e.gaze ?? [-out * 6, 12], px = cx + gx * kx, py = cy + gy * kx, r = (e.pupil === 'dot' ? 0.11 : e.pupil === 'small' ? 0.22 : 0.31) * rx;
      c.fillStyle = K.iris ?? '#69442e'; c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = K.pupil ?? '#161110'; c.beginPath(); c.arc(px, py, r * 0.54, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(px - r * 0.32, py - r * 0.36, r * 0.22, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    // nét mí và nét mí dưới: cắt trong hình mắt, không thò ra ngoài thành một vạch suốt mặt
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx + 3, ry + 3, 0, 0, Math.PI * 2); c.clip();
    if (coMiTren) net(c, [[xo, yo], [xi, yi]], vien, 6);
    if (e.lower === 'flat') net(c, [[cx - rx, day], [cx + rx, day]], vien, 5);
    if (amt > 0) cong(c, xi + out * rx * 0.3, day - 6 * amt, cx, day - 13 * amt, xo - out * rx * 0.3, day - 6 * amt, vien, 5);
    c.restore();
    if (coMi) {   // ba mi ngắn ở khoé ngoài
      const yl = coMiTren ? Math.max(yo, cy - ry * 0.6) : cy - ry * 0.6, xl = cx + out * rx * 0.8;
      [[30, 22], [56, 22], [80, 18]].forEach(([deg, len]) => { const a = (deg * Math.PI) / 180, x0 = xl - out * (deg - 30) * 0.2; net(c, [[x0, yl + 1], [x0 + out * Math.cos(a) * len, yl - Math.sin(a) * len]], mi, 5); });
    }
  });
};

/** lông mày: nét dày tròn đầu, nằm ngay trên mắt, tách khỏi mắt; đọc `brow` và `browY` của nét mặt. k = độ dày (1 = thường) */
export const veMay = (c: C2, s: Spec, k = 1) => {
  const e = s.expr, kind: Brow = e.brow; if (kind === 'none') return;
  const K = s.palette ?? {}, {rx, ry} = MAT, w = (s.lashes ? 11 : 16) * k, by = MAT.y + (s.faceDy ?? 0) * 0.4 - ry - 16 + (e.browY ?? 0) * 0.5;
  const [oy, iy, bend] = ({arc: [0, 0, -16], sad: [20, -18, -6], angry: [-22, 26, 2]} as Record<string, number[]>)[kind] ?? [0, 0, -12];
  ([[MAT.L, -1], [MAT.R, 1]] as [number, number][]).forEach(([cx, out]) => cong(c, cx + out * rx * 0.66, by + oy, cx, by + (oy + iy) / 2 + bend, cx - out * rx * 0.66, by + iy, K.brow ?? '#2a1f18', w));
};

registerAddOn('mat-chuan', {head: (c, s, opt) => { const o = opt as MatOpt; veMat(c, s, o); if (o.may !== false) veMay(c, s, o.may ?? 1); }});

/** đưa một nhân vật sang mắt chuẩn: tắt mắt của bộ khuôn, cắm lớp `mat-chuan` (không đổi gì khác) */
export const matChuan = (s: Spec, opt: MatOpt = {}): Spec => ({...s, noEyes: true, addOns: s.addOns?.some((a) => a.id === 'mat-chuan') ? s.addOns : [...(s.addOns ?? []), {id: 'mat-chuan', opt: opt as Record<string, unknown>}]});
