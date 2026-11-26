import React, {useEffect, useMemo, useState} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {continueRender, delayRender, staticFile} from 'remotion';

/** lib3/khoiTuAnh: ẢNH CODEX -> KHỐI 3D (Daniel 25/11/2026: "các đồ vật này là 3D chứ không phải 2D").
 *  Ảnh Codex là BẢN THIẾT KẾ và NGUỒN TEXTURE; món thật là khối có độ dày, xoay máy thấy cạnh bên, đổ và nhận bóng.
 *  - KhoiDun:  đùn viền (kênh alpha) của ảnh thành khối có bevel bo tròn. Cho đá, vách, bàn, hộp, kệ, giá.
 *  - KhoiTien: tiện theo nửa bề ngang từng hàng của alpha (món đối xứng trục). Cho lọ, bình, nến, cuộn giấy (trục ngang).
 *  - Cả hai nhận `vung` = [x0, y0, x1, y1] (tỉ lệ 0..1 của ảnh) để lấy MỘT PHẦN của ảnh: một tấm Codex có kệ + ba lọ thì
 *    kệ là KhoiDun vùng thấp, mỗi lọ là KhoiTien một vùng; mọi phần cùng khung ảnh nên tự khớp nhau.
 *  - Mặt trước dán chính ảnh (chiếu phẳng theo khung ảnh, kể cả phần bo); mặt sau dán ảnh lật, tối hơn; thành bên (đùn) tô theo
 *    màu viền ảnh tối đi `toi`. Mọi mesh castShadow + receiveShadow. w = bề ngang ngoài đời, mét; pos = giữa cạnh đáy.
 *  - Nặng chỉ làm MỘT LẦN: ảnh phân tích theo src (alpha, lưới màu, texture đã bù viền), hình học cache theo thông số.
 *  Không sửa component có sẵn. Món Kabuto: MON_HANG + MonHang ở cuối file. */
type V3 = [number, number, number];
type Vung = [number, number, number, number];
type P2 = [number, number];

// ------------------------------------------------------------------ phân tích ảnh (một lần theo src)
const LUOI = 200;   // số ô theo cạnh dài của lưới alpha/màu
type Anh = {
  src: string; wpx: number; hpx: number; ar: number; gw: number; gh: number;
  alpha: Float32Array; rgb: Float32Array;          // lưới (gw x gh): alpha 0..1, màu 0..255 (3 số mỗi ô, chưa nhân alpha)
  tex: THREE.CanvasTexture; texSau: THREE.CanvasTexture;
  hinh: Map<string, Hinh>;
};
type Hinh = {loops: {pts: P2[]; ho: boolean; dt: number}[]};   // toạ độ lưới (ô), gốc trái-trên
const CACHE_ANH = new Map<string, Promise<Anh>>();
const CACHE_GEO = new Map<string, THREE.BufferGeometry>();

const phanTichAnh = (src: string, img: HTMLImageElement): Anh => {
  const wpx = img.naturalWidth, hpx = img.naturalHeight, cv = document.createElement('canvas'); cv.width = wpx; cv.height = hpx;
  const c = cv.getContext('2d', {willReadFrequently: true})!; c.drawImage(img, 0, 0);
  const id = c.getImageData(0, 0, wpx, hpx), d = id.data;
  // bỏ viền hồng sót lại của nền #FF00FF: điểm gần hồng thì coi như trong suốt
  for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; if (r - g > 26 && b - g > 16 && b > 90) d[i + 3] = 0; }
  const k = LUOI / Math.max(wpx, hpx), gw = Math.max(2, Math.round(wpx * k)), gh = Math.max(2, Math.round(hpx * k));
  const alpha = new Float32Array(gw * gh), rgb = new Float32Array(gw * gh * 3), cnt = new Float32Array(gw * gh), tot = new Float32Array(gw * gh);
  for (let y = 0; y < hpx; y++) for (let x = 0; x < wpx; x++) {
    const i = (y * wpx + x) * 4, a = d[i + 3] / 255, j = Math.min(gh - 1, Math.floor((y * gh) / hpx)) * gw + Math.min(gw - 1, Math.floor((x * gw) / wpx));
    tot[j]++; alpha[j] += a; if (a > 0.3) { cnt[j] += a; rgb[j * 3] += d[i] * a; rgb[j * 3 + 1] += d[i + 1] * a; rgb[j * 3 + 2] += d[i + 2] * a; }
  }
  for (let j = 0; j < gw * gh; j++) { alpha[j] /= tot[j] || 1; if (cnt[j] > 0) { rgb[j * 3] /= cnt[j]; rgb[j * 3 + 1] /= cnt[j]; rgb[j * 3 + 2] /= cnt[j]; } }
  // bù màu ra ngoài viền (tràn 4 vòng) để lấy mẫu sát mép không lòi hồng/đen
  const ok = new Uint8Array(wpx * hpx);
  for (let i = 0; i < wpx * hpx; i++) ok[i] = d[i * 4 + 3] >= 230 ? 1 : 0;
  for (let pass = 0; pass < 5; pass++) {
    const nx = ok.slice(), cp = new Uint8ClampedArray(d);
    for (let y = 0; y < hpx; y++) for (let x = 0; x < wpx; x++) {
      const p = y * wpx + x; if (ok[p]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= wpx || yy >= hpx) continue; const q = yy * wpx + xx; if (ok[q]) { r += cp[q * 4]; g += cp[q * 4 + 1]; b += cp[q * 4 + 2]; n++; } }
      if (n) { d[p * 4] = r / n; d[p * 4 + 1] = g / n; d[p * 4 + 2] = b / n; nx[p] = 1; }
    }
    ok.set(nx);
  }
  for (let i = 0; i < wpx * hpx; i++) d[i * 4 + 3] = 255;
  c.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const texSau = tex.clone(); texSau.wrapS = THREE.RepeatWrapping; texSau.repeat.set(-1, 1); texSau.offset.set(1, 0); texSau.needsUpdate = true;   // ảnh lật: nhìn từ sau vẫn là món đó, không bị soi gương
  return {src, wpx, hpx, ar: hpx / wpx, gw, gh, alpha, rgb, tex, texSau, hinh: new Map()};
};

const napAnh = (src: string): Promise<Anh> => {
  let p = CACHE_ANH.get(src);
  if (!p) {
    p = new Promise<Anh>((ok, ko) => { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => ok(phanTichAnh(src, img)); img.onerror = () => ko(new Error('khoiTuAnh: không nạp được ' + src)); img.src = staticFile(src); });
    CACHE_ANH.set(src, p);
  }
  return p;
};

/** Nạp + phân tích một ảnh; giữ khung render của Remotion tới khi xong (như useTextures). Trả null khi chưa xong. */
export const useAnh = (src: string): Anh | null => {
  const [a, setA] = useState<Anh | null>(null);
  const [handle] = useState(() => delayRender('khoiTuAnh ' + src));
  const advance = useThree((st) => st.advance);
  useEffect(() => { let alive = true; napAnh(src).then((r) => { if (alive) setA(r); }); return () => { alive = false; }; }, [src]);
  useEffect(() => { if (a) { advance(performance.now()); continueRender(handle); } }, [a, advance, handle]);
  return a;
};

// ------------------------------------------------------------------ viền từ alpha: marching squares, chỉ lấy vòng đủ lớn
const lamMo = (g: Float32Array, gw: number, gh: number, r: number) => {
  if (r < 1) return g;
  for (let pass = 0; pass < 2; pass++) for (const ngang of [true, false]) {
    const o = new Float32Array(g.length), n = ngang ? gw : gh, m = ngang ? gh : gw;
    for (let l = 0; l < m; l++) for (let i = 0; i < n; i++) { let t = 0; for (let k = -r; k <= r; k++) { const q = Math.min(n - 1, Math.max(0, i + k)); t += ngang ? g[l * gw + q] : g[q * gw + l]; } o[ngang ? l * gw + i : i * gw + l] = t / (2 * r + 1); }
    g = o;
  }
  return g;
};
const trongVung = (a: Anh, vung?: Vung) => {
  const g = new Float32Array(a.gw * a.gh);
  const [x0, y0, x1, y1] = vung ?? [0, 0, 1, 1];
  for (let y = 0; y < a.gh; y++) for (let x = 0; x < a.gw; x++) {
    const u = (x + 0.5) / a.gw, v = (y + 0.5) / a.gh;
    if (u >= x0 && u <= x1 && v >= y0 && v <= y1) g[y * a.gw + x] = a.alpha[y * a.gw + x];
  }
  return g;
};
const rdp = (p: P2[], eps: number, kin: boolean): P2[] => {
  if (p.length < 4) return p;
  const gt = (a: number, b: number): P2[] => {
    if (b <= a + 1) return [p[a]];
    let mx = 0, mi = a; const [ax, ay] = p[a], [bx, by] = p[b], L = Math.hypot(bx - ax, by - ay) || 1e-9;
    for (let i = a + 1; i < b; i++) { const dd = Math.abs((p[i][0] - ax) * (by - ay) - (p[i][1] - ay) * (bx - ax)) / L; if (dd > mx) { mx = dd; mi = i; } }
    return mx > eps ? [...gt(a, mi), ...gt(mi, b)] : [p[a]];
  };
  if (!kin) return [...gt(0, p.length - 1), p[p.length - 1]];
  const h = Math.floor(p.length / 2); return [...gt(0, h), ...gt(h, p.length - 1), p[p.length - 1]];
};
const chaikin = (p: P2[], n: number): P2[] => {
  let q = p;
  for (let k = 0; k < n; k++) { const o: P2[] = []; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } q = o; }
  return q;
};
const dienTich = (p: P2[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const trongDa = (pt: P2, poly: P2[]) => { let in_ = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) in_ = !in_; } return in_; };

const layHinh = (a: Anh, vung?: Vung, mo = 0): Hinh => {
  const key = (vung ?? [0, 0, 1, 1]).join(',') + '|' + mo;
  const co = a.hinh.get(key); if (co) return co;
  const g = lamMo(trongVung(a, vung), a.gw, a.gh, mo), W = a.gw + 2, H = a.gh + 2, val = (i: number, j: number) => (i < 1 || j < 1 || i > a.gw || j > a.gh ? 0 : g[(j - 1) * a.gw + (i - 1)]);
  // cạnh: ngang h(i,j) nối (i,j)-(i+1,j); dọc v(i,j) nối (i,j)-(i,j+1). Khoá = số nguyên.
  const kh = (i: number, j: number) => (j * W + i) * 2, kv = (i: number, j: number) => (j * W + i) * 2 + 1;
  const diem = (k: number): P2 => {
    const ngang = (k & 1) === 0, n = k >> 1, i = n % W, j = Math.floor(n / W);
    const t = (p: number, q: number) => (0.5 - p) / ((q - p) || 1e-9);
    if (ngang) { const t_ = t(val(i, j), val(i + 1, j)); return [i + t_ - 1 + 0.5, j - 1 + 0.5]; }
    const t_ = t(val(i, j), val(i, j + 1)); return [i - 1 + 0.5, j + t_ - 1 + 0.5];
  };
  const seg: [number, number][] = [];
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
    const ca = val(i, j) >= 0.5 ? 1 : 0, cb = val(i + 1, j) >= 0.5 ? 2 : 0, cc = val(i + 1, j + 1) >= 0.5 ? 4 : 0, cd = val(i, j + 1) >= 0.5 ? 8 : 0, cs = ca | cb | cc | cd;
    if (cs === 0 || cs === 15) continue;
    const T = kh(i, j), B = kh(i, j + 1), L = kv(i, j), R = kv(i + 1, j);
    const tab: Record<number, [number, number][]> = {1: [[L, T]], 2: [[T, R]], 3: [[L, R]], 4: [[R, B]], 5: [[L, T], [B, R]], 6: [[T, B]], 7: [[L, B]], 8: [[L, B]], 9: [[T, B]], 10: [[T, R], [L, B]], 11: [[R, B]], 12: [[L, R]], 13: [[T, R]], 14: [[L, T]]};
    seg.push(...tab[cs]);
  }
  const lien = new Map<number, number[]>(); seg.forEach(([p, q], s) => { (lien.get(p) ?? lien.set(p, []).get(p)!).push(s); (lien.get(q) ?? lien.set(q, []).get(q)!).push(s); });
  const dung = new Uint8Array(seg.length), loops: {pts: P2[]; ho: boolean; dt: number}[] = [];
  for (let s0 = 0; s0 < seg.length; s0++) {
    if (dung[s0]) continue; dung[s0] = 1; const start = seg[s0][0]; let cur = seg[s0][1]; const ks = [start];
    for (let guard = 0; cur !== start && guard < 100000; guard++) {
      ks.push(cur); const nx = (lien.get(cur) ?? []).find((s) => !dung[s]); if (nx === undefined) break;
      dung[nx] = 1; cur = seg[nx][0] === cur ? seg[nx][1] : seg[nx][0];
    }
    if (ks.length < 6) continue;
    let pts = ks.map(diem); pts = rdp(pts, 0.55, true); if (pts.length < 4) continue; pts = chaikin(pts, 1);
    loops.push({pts, ho: false, dt: Math.abs(dienTich(pts))});
  }
  const tong = loops.reduce((m, l) => Math.max(m, l.dt), 0), giu = loops.filter((l) => l.dt > tong * 0.004 && l.dt > 6);   // bỏ đốm li ti
  giu.forEach((l, i) => { let sau = 0; giu.forEach((o, j) => { if (i !== j && o.dt > l.dt && trongDa(l.pts[0], o.pts)) sau++; }); l.ho = sau % 2 === 1; });
  const r = {loops: giu}; a.hinh.set(key, r); return r;
};

// ------------------------------------------------------------------ màu thành bên: lấy mẫu màu ảnh gần điểm (ô lưới)
const mauGan = (a: Anh, gx: number, gy: number): THREE.Color => {
  let bi = -1, bd = 1e9; const cx = Math.round(gx), cy = Math.round(gy);
  for (let r = 0; r <= 9 && bi < 0; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= a.gw || y >= a.gh) continue;
    const j = y * a.gw + x; if (a.alpha[j] < 0.97) continue; const R_ = a.rgb[j * 3], G_ = a.rgb[j * 3 + 1], B_ = a.rgb[j * 3 + 2]; if (R_ - G_ > 14 && B_ - G_ > 10) continue; const dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; bi = j; }
  }
  if (bi < 0) return new THREE.Color('#6a6258');
  return new THREE.Color().setRGB(a.rgb[bi * 3] / 255, a.rgb[bi * 3 + 1] / 255, a.rgb[bi * 3 + 2] / 255, THREE.SRGBColorSpace);
};

// ------------------------------------------------------------------ hình học
/** gán UV chiếu phẳng theo khung ảnh (x: -w/2..w/2, y: 0..h) cho mọi đỉnh */
const uvPhang = (geo: THREE.BufferGeometry, w: number, h: number) => {
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / w + 0.5; uv[i * 2 + 1] = p.getY(i) / h; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
};

type DunO = {w: number; depth: number; bo: number; bz?: number; vung?: Vung; seg: number};
const hinhDun = (a: Anh, o: DunO): THREE.BufferGeometry => {
  const key = ['dun', a.src, o.w, o.depth, o.bo, o.bz ?? 0, o.seg, (o.vung ?? []).join(',')].join('|'), co = CACHE_GEO.get(key); if (co) return co;
  const h = o.w * a.ar, hinh = layHinh(a, o.vung, Math.min(18, Math.round((o.bo / (o.w / a.gw)) * 1.0))), gx = (x: number) => (x / a.gw - 0.5) * o.w, gy = (y: number) => (1 - y / a.gh) * h;
  const outers = hinh.loops.filter((l) => !l.ho), shapes = outers.map((l) => {
    const sh = new THREE.Shape(l.pts.map(([x, y]) => new THREE.Vector2(gx(x), gy(y))));
    hinh.loops.filter((m) => m.ho && trongDa(m.pts[0], l.pts)).forEach((m) => sh.holes.push(new THREE.Path(m.pts.map(([x, y]) => new THREE.Vector2(gx(x), gy(y))))));
    return sh;
  });
  const bs = o.bo, bt = o.bz ?? o.bo * 0.9;
  const ex = new THREE.ExtrudeGeometry(shapes, {depth: o.depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelOffset: -bs, bevelSegments: o.seg, curveSegments: 4, steps: 1});
  ex.deleteAttribute('uv'); ex.deleteAttribute('normal');
  const g = mergeVertices(ex, 1e-4); g.computeVertexNormals();
  // tâm theo chiều sâu về z = 0
  const tong = o.depth + 2 * bt; g.translate(0, 0, -(o.depth / 2));
  const idx = g.index!, pos = g.attributes.position, tr = idx.count / 3, tru: number[] = [], sau: number[] = [], tuong: number[] = [], zf = o.depth / 2 - 1e-4, zb = -o.depth / 2 + 1e-4;
  for (let t = 0; t < tr; t++) {
    const a0 = idx.getX(t * 3), a1 = idx.getX(t * 3 + 1), a2 = idx.getX(t * 3 + 2), z0 = pos.getZ(a0), z1 = pos.getZ(a1), z2 = pos.getZ(a2);
    if (Math.min(z0, z1, z2) >= zf) tru.push(a0, a1, a2); else if (Math.max(z0, z1, z2) <= zb) sau.push(a0, a1, a2); else tuong.push(a0, a1, a2);
  }
  g.setIndex([...tru, ...sau, ...tuong]); g.clearGroups(); g.addGroup(0, tru.length, 0); g.addGroup(tru.length, sau.length, 1); g.addGroup(tru.length + sau.length, tuong.length, 2);
  uvPhang(g, o.w, h);
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const c = mauGan(a, (pos.getX(i) / o.w + 0.5) * a.gw, (1 - pos.getY(i) / h) * a.gh); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  void tong; CACHE_GEO.set(key, g); return g;
};

type TienO = {w: number; vung?: Vung; ngang: boolean; seg: number; day: number};
const hinhTien = (a: Anh, o: TienO): {geoT: THREE.BufferGeometry; geoS: THREE.BufferGeometry} => {
  const key = ['tien', a.src, o.w, o.ngang, o.seg, o.day, (o.vung ?? []).join(',')].join('|'), t0 = CACHE_GEO.get(key + 'T');
  if (t0) return {geoT: t0, geoS: CACHE_GEO.get(key + 'S')!};
  const g = trongVung(a, o.vung), h = o.w * a.ar, ox = o.w / a.gw;
  // quét: mỗi hàng (hoặc cột nếu ngang) lấy hai mép trong/ngoài của alpha
  const nS = o.ngang ? a.gw : a.gh, nD = o.ngang ? a.gh : a.gw, lo = new Float32Array(nS).fill(-1), hi = new Float32Array(nS).fill(-1);
  for (let s = 0; s < nS; s++) for (let d = 0; d < nD; d++) { const v = o.ngang ? g[d * a.gw + s] : g[s * a.gw + d]; if (v >= 0.5) { if (lo[s] < 0) lo[s] = d; hi[s] = d + 1; } }
  const cs = [] as number[]; for (let s = 0; s < nS; s++) if (lo[s] >= 0) cs.push((lo[s] + hi[s]) / 2);
  const ws = [] as number[]; for (let s = 0; s < nS; s++) if (lo[s] >= 0) ws.push(hi[s] - lo[s]);
  const wmax = Math.max(...ws), thang = [] as number[]; for (let s = 0; s < nS; s++) if (lo[s] >= 0 && hi[s] - lo[s] > wmax * 0.35) thang.push((lo[s] + hi[s]) / 2);
  thang.sort((p, q) => p - q); const axis = thang[Math.floor(thang.length / 2)];   // trục = trung vị tâm các hàng rộng (nút dây, quai lệch một bên không kéo trục)
  let r: {s: number; r: number}[] = []; for (let s = 0; s < nS; s++) if (lo[s] >= 0) r.push({s, r: Math.max(0.4, Math.min(axis - lo[s], hi[s] - axis))});
  for (let k = 0; k < 6; k++) r = r.map((p, i) => ({s: p.s, r: (r[Math.max(0, i - 1)].r + p.r * 2 + r[Math.min(r.length - 1, i + 1)].r) / 4}));
  // điểm profile trong mét. Dọc: s = hàng (từ trên xuống) -> y từ đáy; ngang: s = cột -> toạ độ dọc trục (sẽ xoay)
  const toa = (s: number) => (o.ngang ? (s + 0.5 - a.gw / 2) * ox : (a.gh - (s + 0.5)) * ox);
  const ord = o.ngang ? r : [...r].reverse();
  const pts = [new THREE.Vector2(0, toa(ord[0].s)), ...ord.map((p) => new THREE.Vector2(p.r * ox, toa(p.s))), new THREE.Vector2(0, toa(ord[ord.length - 1].s))];
  const mk = (p0: number) => {
    const L = new THREE.LatheGeometry(pts, o.seg, p0, Math.PI);
    if (o.ngang) { L.rotateZ(-Math.PI / 2); L.translate(0, (a.gh - axis) * ox, 0); } else L.translate((axis - a.gw / 2) * ox, 0, 0);
    L.scale(1, 1, o.day); uvPhang(L, o.w, h); return L;
  };
  const T = mk(-Math.PI / 2), S = mk(Math.PI / 2);
  CACHE_GEO.set(key + 'T', T); CACHE_GEO.set(key + 'S', S); return {geoT: T, geoS: S};
};

// ------------------------------------------------------------------ component
/** Chỗ giữ khối khi ảnh còn đang nạp: hộp vô hình đúng cỡ, để khung xem trước (Catalog Fit) tính máy đúng ngay lần đầu. */
const GiuCho: React.FC<{w: number; h: number; d: number}> = ({w, h, d}) => <mesh position={[0, h / 2, 0]} visible={false} userData={{noRecv: true}}><boxGeometry args={[w, h, d]} /><meshBasicMaterial /></mesh>;

export const KhoiDun: React.FC<{src: string; w: number; pos?: V3; rotY?: number; depth?: number; bo?: number; bz?: number; seg?: number; vung?: Vung; toi?: number; toiSau?: number; ar?: number; shadow?: boolean}> = ({src, w, pos = [0, 0, 0], rotY = 0, depth = 0.3, bo, bz, seg = 5, vung, toi = 0.7, toiSau = 0.75, ar, shadow = true}) => {
  const a = useAnh(src), b = bo ?? Math.min(0.04, depth * 0.2);
  const geo = useMemo(() => (a ? hinhDun(a, {w, depth, bo: b, bz, vung, seg}) : null), [a, w, depth, b, bz, vung?.join(','), seg]);
  const mats = useMemo(() => (a ? [
    new THREE.MeshLambertMaterial({map: a.tex, side: THREE.DoubleSide}), new THREE.MeshLambertMaterial({vertexColors: true, color: new THREE.Color().setScalar(toiSau), side: THREE.DoubleSide}), new THREE.MeshLambertMaterial({vertexColors: true, color: new THREE.Color().setScalar(toi), side: THREE.DoubleSide}),
  ] : null), [a, toi, toiSau]);
  const h0 = w * (ar ?? 1);
  if (!a || !geo || !mats) return <group position={pos} rotation={[0, rotY, 0]}><GiuCho w={w} h={h0} d={depth} /></group>;
  return <group position={pos} rotation={[0, rotY, 0]}><mesh geometry={geo} material={mats} position={[0, 0, 0]} castShadow={shadow} receiveShadow={shadow} /></group>;
};

export const KhoiTien: React.FC<{src: string; w: number; pos?: V3; rotY?: number; vung?: Vung; ngang?: boolean; seg?: number; day?: number; toiSau?: number; ar?: number; shadow?: boolean}> = ({src, w, pos = [0, 0, 0], rotY = 0, vung, ngang = false, seg = 28, day = 1, toiSau = 0.75, ar, shadow = true}) => {
  const a = useAnh(src);
  const g = useMemo(() => (a ? hinhTien(a, {w, vung, ngang, seg, day}) : null), [a, w, vung?.join(','), ngang, seg, day]);
  const mats = useMemo(() => (a ? [new THREE.MeshLambertMaterial({map: a.tex}), new THREE.MeshLambertMaterial({map: a.tex, color: new THREE.Color().setScalar(toiSau)})] : null), [a, toiSau]);
  if (!a || !g || !mats) return <group position={pos} rotation={[0, rotY, 0]}><GiuCho w={w} h={w * (ar ?? 1)} d={w * day} /></group>;
  return <group position={pos} rotation={[0, rotY, 0]}><mesh geometry={g.geoT} material={mats[0]} castShadow={shadow} receiveShadow={shadow} /><mesh geometry={g.geoS} material={mats[1]} castShadow={shadow} receiveShadow={shadow} /></group>;
};

// ------------------------------------------------------------------ 13 món hang Kabuto (ảnh Codex public/shisui/hang/)
export type KieuMon = 'da' | 'dun' | 'tien';
type Phan = {k: 'dun'; depth: number; bo: number; bz?: number; vung?: Vung; seg?: number; toi?: number} | {k: 'tien'; vung?: Vung; ngang?: boolean; day?: number};
export type MonTin = {src: string; w: number; ar: number; ten: string; loai: '3D khối' | '3D khối tiện'; phan: Phan[]};
const H1 = 'shisui/hang/hang1-', H2 = 'shisui/hang/hang2-';
export const MON_HANG: Record<string, MonTin> = {
  'da-vach-hang-cao-hai-khoi-bo-reu': {src: H1 + '1.png', w: 3.2, ar: 431 / 404, ten: 'Vách đá cao hai khối', loai: '3D khối', phan: [{k: 'dun', depth: 0.3, bo: 0.26, bz: 0.75, seg: 8}]},
  'da-vach-hang-thap-rong-vet-nuoc-chay': {src: H1 + '2.png', w: 3.6, ar: 304 / 537, ten: 'Vách đá thấp rộng', loai: '3D khối', phan: [{k: 'dun', depth: 0.3, bo: 0.24, bz: 0.65, seg: 8}]},
  'cum-nhu-da-ba-mui-nhon-co-reu-treo': {src: H1 + '3.png', w: 2.2, ar: 389 / 470, ten: 'Cụm nhũ đá có rễ', loai: '3D khối', phan: [{k: 'dun', depth: 0.45, bo: 0.05, seg: 4}]},
  'tang-da-tron-lon-mot-khoi-bo': {src: H1 + '4.png', w: 1.3, ar: 299 / 410, ten: 'Tảng đá tròn', loai: '3D khối', phan: [{k: 'dun', depth: 0.1, bo: 0.15, bz: 0.4, seg: 8}]},
  'ban-da-phang-mot-tam-hai-chan-tho': {src: H1 + '5.png', w: 1.2, ar: 202 / 499, ten: 'Bàn đá', loai: '3D khối', phan: [{k: 'dun', depth: 0.35, bo: 0.04, bz: 0.06, seg: 5}]},
  'cum-ba-hon-da-tron-chong-len-nhau': {src: H1 + '6.png', w: 1.2, ar: 268 / 424, ten: 'Cụm ba hòn đá', loai: '3D khối', phan: [{k: 'dun', depth: 0.15, bo: 0.1, bz: 0.3, seg: 7}]},
  'gia-duoc-go-ba-chan-chen-sat-rong': {src: H2 + '1.png', w: 0.5, ar: 446 / 194, ten: 'Giá đuốc gỗ', loai: '3D khối', phan: [{k: 'dun', depth: 0.07, bo: 0.012, seg: 3}]},
  'nen-trang-ngan-tren-da-det-chua-chay': {src: H2 + '2.png', w: 0.2, ar: 257 / 235, ten: 'Nến trên đá', loai: '3D khối tiện', phan: [{k: 'tien'}]},
  'lo-dat-nung-nut-ban': {src: H2 + '3.png', w: 0.28, ar: 336 / 270, ten: 'Lọ đất nung nút bần', loai: '3D khối tiện', phan: [{k: 'tien'}]},
  'binh-gom-co-hep-buoc-day-men-xam-xanh': {src: H2 + '4.png', w: 0.2, ar: 408 / 182, ten: 'Bình gốm cổ buộc dây', loai: '3D khối tiện', phan: [{k: 'tien'}]},
  'hop-go-mo-nap-ba-cuon-giay': {src: H2 + '5.png', w: 0.4, ar: 273 / 362, ten: 'Hộp gỗ có cuộn giấy', loai: '3D khối', phan: [{k: 'dun', depth: 0.28, bo: 0.02, seg: 3}]},
  'hai-cuon-giay-chong-buoc-day-do': {src: H2 + '6.png', w: 0.45, ar: 214 / 368, ten: 'Hai cuộn giấy buộc dây', loai: '3D khối tiện', phan: [{k: 'tien', ngang: true, vung: [0, 0, 1, 0.5], day: 1}, {k: 'tien', ngang: true, vung: [0, 0.46, 1, 1], day: 1}]},
  'ke-go-thap-ba-lo-dat-nau-do-xam': {src: H2 + '7.png', w: 0.9, ar: 322 / 589, ten: 'Kệ gỗ ba lọ', loai: '3D khối', phan: [{k: 'dun', depth: 0.28, bo: 0.015, seg: 3, vung: [0, 0.6, 1, 1]}, {k: 'tien', vung: [0, 0, 0.448, 0.66]}, {k: 'tien', vung: [0.448, 0, 0.71, 0.66]}, {k: 'tien', vung: [0.71, 0, 1, 0.66]}]},
};
/** Một món hang Kabuto theo id kho. mon = khoá của MON_HANG; scale nhân cỡ ngoài đời (mặc định 1). */
export const MonHang: React.FC<{mon: string; pos?: V3; rotY?: number; scale?: number}> = ({mon, pos = [0, 0, 0], rotY = 0, scale = 1}) => {
  const m = MON_HANG[mon]; if (!m) throw new Error('MonHang: không có món ' + mon);
  const w = m.w * scale;
  return <group position={pos} rotation={[0, rotY, 0]}>{m.phan.map((p, i) => p.k === 'dun'
    ? <KhoiDun key={i} src={m.src} w={w} ar={m.ar} depth={p.depth * scale} bo={p.bo * scale} bz={p.bz ? p.bz * scale : undefined} seg={p.seg} vung={p.vung} toi={p.toi} />
    : <KhoiTien key={i} src={m.src} w={w} ar={m.ar} vung={p.vung} ngang={p.ngang} day={p.day} />)}</group>;
};
