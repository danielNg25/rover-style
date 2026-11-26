import React, {useMemo, useContext, createContext} from 'react';
import * as THREE from 'three';
import {ContactShade, GradeCtx} from './look';
import {VongCtx} from './duongMay';
import {NguonCay, kieuCayTheoTen, type KieuCay} from './buiNguon';

/** lib3/depth: BACKGROUNDS IN LAYERS. A place is a stack of flat pictures standing at real, different distances from the
 *  camera (sky, far range, landmark, hills, tree lines, the set, the foreground), not one row of objects.
 *  Three things carry the depth and all three come from the construction, not from hand tuning:
 *    - haze: the scene has fog in the colour of the sky near the horizon, so every layer pales with its distance;
 *    - scale and overlap: nearer layers are bigger on screen and hide part of the layer behind them;
 *    - parallax: the layers stand at real depths, so any camera move slides the near ones faster.
 *  Every shape is drawn big and simple in two tones, light face to the LEFT (the key light comes from the front-left). */
type V3 = [number, number, number];
export type Ctx = CanvasRenderingContext2D;
export const VIEW = {cam: [0, 1.9, 9] as V3, fov: 28, W: 1600, H: 900};
const TAN = Math.tan((VIEW.fov * Math.PI) / 360);
/** A SHOT re-frames a set: when this context holds an eye, the stage camera stands there instead of at the set's own standard
 *  position (see lib3/shot.tsx), and the set's foreground plates (order 900 and up), which were painted for the standard view,
 *  are left out. */
export const ShotCtx = createContext<{eye: V3} | null>(null);
/** RISE: how far the horizon is pushed DOWN from the middle of the frame, as a share of the frame height (0 = level view,
 *  0.26 = horizon three quarters of the way down). The camera stays level, so uprights stay upright, but it sees more of what
 *  is above it: a tall building fits in the frame from close by, and a figure near the camera sits large at the lower edge.
 *  Without it a level 28-degree lens has to stand 60-70 m back to hold a tower, and half the frame is empty ground. */
export const RiseCtx = createContext(0);
export const rnd = (seed: number) => { let s = (seed * 9301 + 49297) % 233280; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const path = (c: Ctx, pts: number[][]) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
export const P = (c: Ctx, pts: number[][], fill: string) => { path(c, pts); c.fillStyle = fill; c.fill(); };
const mix = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const disc = (c: Ctx, x: number, y: number, r: number, f: string) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = f; c.fill(); };

/** A plate: one layer painted in SCREEN units (1600 x 900 = the frame at the standard camera VIEW.cam) and stood at the
 *  distance d from that camera (from = the scene's own standard camera, when it is not VIEW.cam). It is 30 % larger than the
 *  frame on every side, so the camera can move. */
export const Plate: React.FC<{d: number; paint: (c: Ctx) => void; fog?: boolean; id: string; order?: number; from?: V3}> = ({d, paint, fog = true, id, order = 0, from = VIEW.cam}) => {
  const M = 1.3, tex = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 2600; cv.height = 1463; const c = cv.getContext('2d')!, s = cv.width / M / VIEW.W;
    c.setTransform(s, 0, 0, s, (cv.width - VIEW.W * s) / 2, (cv.height - VIEW.H * s) / 2); paint(c);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }, [id]);
  const h = 2 * TAN * d * M, w = (h * VIEW.W) / VIEW.H, shot = useContext(ShotCtx), rise = useContext(RiseCtx), vong = useContext(VongCtx);
  if (shot && order >= 900) return null;
  // with a rise the frame reaches higher: the sky (the one far layer without fog) is enlarged about the horizon so that it still fills it
  const k = rise > 0 && !fog && order < 900 ? 1 + 2.2 * rise : 1;
  const mesh = <mesh position={[from[0], from[1], from[2] - d]} renderOrder={order} scale={[k, k, 1]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} transparent depthWrite={false} fog={fog} /></mesh>;
  // máy đi vòng (lib3/kieuMay, VongCtx): tấm quay theo máy một phần quanh chủ thể; không có vòng thì trả đúng mesh như cũ
  if (!vong) return mesh;
  const e = shot ? shot.eye : from, px = e[0], pz = e[2] - vong.D;
  return <group position={[px, 0, pz]} rotation={[0, vong.nen, 0]}><group position={[-px, 0, -pz]}>{mesh}</group></group>;
};
/** VẬT GẮN LÊN TẤM (điểm lấy từ onPlate: đèn cửa sổ, cờ, người đi trên đồi vẽ…): bọc trong <TheoTam from={from của tấm}> để khi máy
 *  đi vòng (VongCtx) chúng quay cùng tấm Plate, không trượt khỏi chỗ vẽ. Không có vòng thì trả nguyên children. */
export const TheoTam: React.FC<{from?: V3; children?: React.ReactNode}> = ({from = VIEW.cam, children}) => {
  const shot = useContext(ShotCtx), vong = useContext(VongCtx);
  if (!vong) return <>{children}</>;
  const e = shot ? shot.eye : from, px = e[0], pz = e[2] - vong.D;
  return <group position={[px, 0, pz]} rotation={[0, vong.nen, 0]}><group position={[-px, 0, -pz]}>{children}</group></group>;
};

const CACHE = new Map<string, THREE.CanvasTexture>();
/** LỚP CHE (26/11/2026, Daniel: "các vật khác nhau luôn phải xếp trước sau trên nền 3d"). Hình phẳng tự nó không ghi chiều sâu, còn NGƯỜI thì
 *  vẽ sau cùng (thứ tự 500), nên trước đây người đè lên mọi Sprite dù Sprite đứng TRƯỚC người. Mỗi Sprite có thêm một tấm chỉ GHI CHIỀU SÂU ở
 *  phần đặc của hình (alpha từ 0,5), không vẽ màu, vẽ ở thứ tự 499: ngay trước người và sau mọi thứ khác (hình phẳng 3, quầng sáng 4, bụi 5–6, hiệu ứng
 *  tới 16). Nhờ vậy người đứng sau một Sprite bị che đúng theo vị trí 3D, còn bụi, quầng sáng và mép mềm của các hình phẳng vẽ y như cũ.
 *  Hình trong mờ cố ý (khói, sương) thì `che={false}`. colorWrite khoá cứng ở false vì `Ghost` (shot.tsx) và lớp của Lab bật tắt colorWrite của mọi
 *  vật liệu trong bối cảnh. */
export const THU_TU_CHE = 499;
const VL_CHE = new WeakMap<THREE.Texture, THREE.MeshBasicMaterial>();
const vatLieuChe = (map: THREE.Texture) => { let m = VL_CHE.get(map); if (!m) { m = new THREE.MeshBasicMaterial({map, alphaTest: 0.5, side: THREE.DoubleSide, transparent: true, depthWrite: true}); Object.defineProperty(m, 'colorWrite', {get: () => false, set: () => {}}); VL_CHE.set(map, m); } return m; };
const LOP_CU = process.env.REMOTION_SOI_BONG === 'luat-cu';   // dựng ảnh TRƯỚC để so: không có lớp che
/** A sprite: one flat picture standing on the ground at a real place (a tree, a bush, a haystack). art paints it on a canvas
 *  of px = [width, height]; w = its width in the world; the picture's bottom edge stands on pos. */
/** bui: cây, hoa, cỏ tự đăng ký nguồn bụi ngoài trời theo tên (lib3/buiNguon kieuCayTheoTen: lá rơi, phấn hoa, hạt cỏ); false tắt,
 *  'la' | 'phan-hoa' | 'hat-co' chỉ định. */
export const Sprite: React.FC<{name: string; art: (c: Ctx, W: number, H: number) => void; px: [number, number]; w: number; pos: V3; flip?: boolean; cast?: boolean; shade?: number; rotY?: number; lit?: boolean; bui?: false | KieuCay; che?: boolean}> =
  ({name, art, px, w, pos, flip, cast = true, shade = 0.24, rotY = 0, lit, bui, che = true}) => {
    // rotY: a picture that hangs ON something lies in that thing's plane (a bag on the side of a desk faces sideways); only
    // free-standing things face the lens. lit: indoors a flat picture takes the room's light and its shadows like the boxes
    // around it (an unlit picture glows in a room); outdoors the pictures keep their own drawn light.
    const grade = useContext(GradeCtx), isLit = lit ?? (grade === 'brightInterior' || grade === 'darkInterior');
    const tex = useMemo(() => { let t = CACHE.get(name); if (!t) { const cv = document.createElement('canvas'); cv.width = px[0]; cv.height = px[1]; art(cv.getContext('2d')!, px[0], px[1]); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; CACHE.set(name, t); } return t; }, [name]);
    const h = (w * px[1]) / px[0], kieuCay = bui === false ? null : bui ?? kieuCayTheoTen(name);
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <mesh position={[0, h / 2, 0]} scale={[flip ? -1 : 1, 1, 1]} castShadow={cast} receiveShadow={isLit} userData={{noRecv: !isLit}} renderOrder={3}><planeGeometry args={[w, h]} />{isLit ? <meshLambertMaterial map={tex} transparent alphaTest={0.06} depthWrite={false} side={THREE.DoubleSide} /> : <meshBasicMaterial map={tex} transparent alphaTest={0.06} depthWrite={false} side={THREE.DoubleSide} />}</mesh>
        {che && !LOP_CU ? <mesh position={[0, h / 2, 0]} scale={[flip ? -1 : 1, 1, 1]} material={vatLieuChe(tex)} renderOrder={THU_TU_CHE} userData={{noRecv: true, lopChe: true}}><planeGeometry args={[w, h]} /></mesh> : null}
        {shade > 0 && <group scale={[1, 1, 0.4]}><ContactShade r={w * 0.22} strength={shade} /></group>}
        {kieuCay ? <NguonCay ten={name} kieu={kieuCay} w={w} h={h} cv={tex.image as HTMLCanvasElement} /> : null}
      </group>
    );
  };

// ---------------------------------------------------------------- painters (usable on plates at any size and in sprites)
export type Two = {light: string; dark: string};
/** A mountain: one big massif, light face left of its ridge, dark face right, an optional broad band of snow down the lit slope. */
export const paintPeak = (c: Ctx, x: number, yt: number, hw: number, base: number, t: Two & {snow?: string; snowShade?: string; motSac?: boolean}) => {
  const h = base - yt, L = [x - hw, base], Rr = [x + hw * 1.08, base], ls = [x - hw * 0.5, yt + h * 0.54], rs = [x + hw * 0.46, yt + h * 0.4], A = [x, yt];
  if (t.motSac) {
    // luật 13 (26/11/2026): núi xa MỘT SẮC, không sống dọc chia hai màu; chỏm tuyết một sắc, mép dưới gãy khúc
    P(c, [L, ls, A, rs, Rr], t.light);
    if (t.snow) {
      const a = mix(A, ls, 0.62), b = mix(A, rs, 0.7), n = 6, mep: number[][] = [];
      for (let i = 1; i < n; i++) { const u = i / n, q = mix(a, b, u); mep.push([q[0], q[1] + (i % 2 ? h * 0.07 : -h * 0.02)]); }
      P(c, [A, a, ...mep, b], t.snow);
    }
    return;
  }
  P(c, [L, ls, A, rs, Rr], t.dark);
  const ridge = [[x + hw * 0.07, yt + h * 0.28], [x - hw * 0.06, yt + h * 0.56], [x + hw * 0.1, base]];
  P(c, [L, ls, A, ...ridge], t.light);
  if (t.snow) {
    const onL = (u: number) => (u < 0.54 ? mix(A, ls, u / 0.54) : mix(ls, L, (u - 0.54) / 0.46)), a = onL(0.66);
    P(c, [A, a, [a[0] + hw * 0.2, a[1] - h * 0.01], [x - hw * 0.24, yt + h * 0.34], [x - hw * 0.1, yt + h * 0.43], ridge[0]], t.snow);
    P(c, [A, ridge[0], [x + hw * 0.2, yt + h * 0.37], mix(A, rs, 0.6)], t.snowShade ?? t.snow);
  }
};
/** A line of hills as straight-edged planes: slopes that rise to the right face the light. */
export const paintHills = (c: Ctx, pts: number[][], base: number, t: Two) => {
  const n = pts.length - 1; P(c, [...pts, [pts[n][0], base], [pts[0][0], base]], t.dark);
  for (let i = 1; i <= n; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; if (y1 < y0) P(c, [[x0, y0], [x1, y1], [x1 + (x1 - x0) * 0.16, base], [x0, base]], t.light); }
};
/** A conifer in tiers: flat, two greens split down the middle, a notched lower edge on every tier. */
export const paintPine = (c: Ctx, cx: number, base: number, h: number, w: number, t: Two & {trunk: string}, tiers = 4) => {
  const tw = w * 0.1; c.fillStyle = t.trunk; c.fillRect(cx - tw / 2, base - h * 0.16, tw, h * 0.16);
  const top = base - h, step = (h * 0.9) / (tiers * 0.78 + 0.22);
  for (let k = tiers - 1; k >= 0; k--) {
    const yt = top + k * step * 0.78 - (k ? step * 0.12 : 0), yb = top + k * step * 0.78 + step, hw = (w / 2) * (0.4 + (0.6 * (k + 1)) / tiers);
    const shape = [[cx, yt], [cx + hw, yb], [cx + hw * 0.55, yb - step * 0.13], [cx + hw * 0.12, yb + step * 0.03], [cx - hw * 0.5, yb - step * 0.12], [cx - hw, yb]];
    P(c, shape, t.dark); c.save(); path(c, shape); c.clip(); P(c, [[cx, yt - 2], [cx + hw * 0.1, yb + step * 0.2], [cx - hw - 2, yb + step * 0.2]], t.light); c.restore();
  }
};
/** A broadleaf tree: a trunk with a fork, a crown of overlapping flat discs in three greens, lightest to the upper left. */
export const paintTree = (c: Ctx, W: number, H: number, g: [string, string, string] = ['#3f7046', '#4f8a54', '#66a25f'], trunk: Two = {light: '#6f5239', dark: '#553d2b'}) => {
  const u = W / 600, T = (x: number, y: number) => [x * u, H - (720 - y) * u];
  P(c, [T(266, 720), T(334, 720), T(320, 440), T(360, 360), T(338, 350), T(304, 410), T(290, 350), T(250, 300), T(236, 318), T(280, 440)], trunk.light);
  P(c, [T(302, 720), T(334, 720), T(320, 440), T(360, 360), T(338, 350), T(304, 430)], trunk.dark);
  const D = (list: number[][], f: string) => list.forEach(([x, y, r]) => { const [a, b] = T(x, y); disc(c, a, b, r * u, f); });
  // many overlapping discs: big ones give the mass, smaller ones a lobed outline, small light clumps and a few dark gaps the leafage
  D([[300, 262, 190], [165, 305, 122], [436, 300, 128], [300, 150, 132], [120, 230, 70], [480, 220, 74], [210, 110, 78], [400, 120, 80], [250, 400, 70], [370, 395, 66]], g[0]);
  D([[268, 236, 150], [156, 282, 92], [412, 270, 98], [288, 140, 100], [200, 330, 60], [350, 330, 62], [110, 225, 48], [470, 215, 50], [215, 105, 56], [392, 112, 56]], g[1]);
  D([[228, 190, 84], [146, 256, 50], [380, 226, 56], [278, 108, 58], [196, 100, 34], [100, 214, 28], [330, 160, 40], [452, 200, 30], [250, 290, 34]], g[2]);
  D([[300, 232, 16], [190, 212, 12], [352, 252, 13], [250, 152, 11], [410, 180, 12]], g[0]);
};
export const paintBush = (c: Ctx, W: number, H: number, g: [string, string, string] = ['#3f7046', '#4f8a54', '#66a25f'], flowers?: string) => {
  const u = W / 400, k = (H - 240 * u);
  const D = (list: number[][], f: string) => list.forEach(([x, y, r]) => disc(c, x * u, k + y * u, r * u, f));
  D([[200, 150, 95], [108, 172, 68], [300, 170, 70]], g[0]); D([[184, 134, 76], [102, 160, 50], [290, 156, 52]], g[1]); D([[164, 112, 42], [92, 148, 26], [280, 136, 28]], g[2]);
  c.fillStyle = g[0]; c.fillRect(20 * u, k + 200 * u, 360 * u, 40 * u);
  if (flowers) [[120, 120], [210, 92], [262, 150], [160, 170], [318, 128], [70, 168]].forEach(([x, y]) => disc(c, x * u, k + y * u, 7 * u, flowers));
};
export const paintHaystack = (c: Ctx, W: number, H: number) => {
  const dome = (f: string) => { c.beginPath(); c.moveTo(W * 0.08, H); c.quadraticCurveTo(W * 0.04, H * 0.42, W * 0.5, H * 0.12); c.quadraticCurveTo(W * 0.96, H * 0.42, W * 0.92, H); c.closePath(); c.fillStyle = f; c.fill(); };
  dome('#bfa560'); c.save(); c.beginPath(); c.moveTo(W * 0.08, H); c.quadraticCurveTo(W * 0.04, H * 0.42, W * 0.5, H * 0.12); c.quadraticCurveTo(W * 0.96, H * 0.42, W * 0.92, H); c.clip();
  P(c, [[0, H], [0, 0], [W * 0.5, 0], [W * 0.62, H]], '#d2ba74'); c.restore();
  c.strokeStyle = '#a89052'; c.lineWidth = W * 0.012; [[0.3, 0.5, 0.26, 0.74], [0.5, 0.36, 0.48, 0.6], [0.66, 0.52, 0.7, 0.78], [0.42, 0.7, 0.4, 0.9], [0.78, 0.66, 0.8, 0.86]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(W * a, H * b); c.lineTo(W * d, H * e); c.stroke(); });
  c.fillStyle = '#6b4f38'; c.fillRect(W * 0.485, 0, W * 0.03, H * 0.16);
};
export const paintRock = (c: Ctx, W: number, H: number, t: [string, string, string] = ['#a7aaa6', '#8b8f8c', '#727673']) => {
  P(c, [[W * 0.04, H], [W * 0.12, H * 0.5], [W * 0.36, H * 0.12], [W * 0.68, H * 0.06], [W * 0.92, H * 0.44], [W * 0.98, H]], t[1]);
  P(c, [[W * 0.04, H], [W * 0.12, H * 0.5], [W * 0.36, H * 0.12], [W * 0.5, H * 0.46], [W * 0.38, H]], t[0]);
  P(c, [[W * 0.68, H * 0.06], [W * 0.92, H * 0.44], [W * 0.98, H], [W * 0.7, H], [W * 0.76, H * 0.5]], t[2]);
};
/** A house small enough to be far: a lit wall and a shaded wall, a two-tone roof, a door, windows, a chimney. */
export const paintHouse = (c: Ctx, x: number, base: number, w: number, h: number, wall: Two, roof: Two, mark = '#5d6470') => {
  c.fillStyle = wall.light; c.fillRect(x, base - h, w * 0.62, h); c.fillStyle = wall.dark; c.fillRect(x + w * 0.62, base - h, w * 0.38, h);
  P(c, [[x - w * 0.06, base - h], [x + w * 0.31, base - h * 1.75], [x + w * 0.68, base - h]], wall.light);
  P(c, [[x + w * 0.31, base - h * 1.75], [x + w * 0.73, base - h * 1.62], [x + w * 1.06, base - h * 0.96], [x + w * 0.68, base - h]], roof.dark);
  P(c, [[x - w * 0.1, base - h * 0.94], [x + w * 0.31, base - h * 1.82], [x + w * 0.36, base - h * 1.72], [x - w * 0.02, base - h * 0.9]], roof.light);
  c.fillStyle = mark; c.fillRect(x + w * 0.24, base - h * 0.5, w * 0.14, h * 0.5); c.fillRect(x + w * 0.06, base - h * 0.74, w * 0.1, h * 0.22); c.fillRect(x + w * 0.76, base - h * 0.7, w * 0.1, h * 0.22);
  c.fillStyle = roof.dark; c.fillRect(x + w * 0.74, base - h * 1.78, w * 0.1, h * 0.3);
};
/** A castle read as a silhouette first: a curtain wall with teeth, towers of different heights under slate cones, a gate, flags.
 *  s = size of one unit on the canvas (the castle is 240 units wide). */
export const paintCastle = (c: Ctx, x0: number, base: number, s: number, t: {stone: string; shade: string; roof: string; roofShade: string; mark: string; flag: string}) => {
  const Rr = (x: number, y: number, w: number, h: number, f: string) => { c.fillStyle = f; c.fillRect(x0 + x * s, base - (y + h) * s, w * s, h * s + 0.5); };
  const Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => [x0 + x * s, base - y * s]), f);
  const r = rnd(7);
  const tower = (x: number, w: number, h: number, rh: number, flag?: boolean) => {
    Rr(x, 0, w, h, t.stone); Rr(x + w * 0.62, 0, w * 0.38, h, t.shade); Rr(x - 3, h - 9, w + 6, 9, t.stone); Rr(x - 3 + (w + 6) * 0.62, h - 9, (w + 6) * 0.38, 9, t.shade);
    Q([[x - 6, h], [x + w / 2, h + rh], [x + w + 6, h]], t.roof); Q([[x + w / 2, h + rh], [x + w + 6, h], [x + w * 0.56, h]], t.roofShade);
    Rr(x + w * 0.28, h * 0.5, 4, 13, t.mark); Rr(x + w * 0.28, h * 0.78, 4, 11, t.mark);
    if (flag) { Rr(x + w / 2 - 0.8, h + rh, 1.6, 20, t.mark); Q([[x + w / 2 + 0.8, h + rh + 20], [x + w / 2 + 17, h + rh + 15], [x + w / 2 + 0.8, h + rh + 10]], t.flag); }
  };
  Rr(0, 0, 240, 58, t.stone); Rr(150, 0, 90, 58, t.shade); for (let i = 2; i < 238; i += 14) Rr(i, 58, 8, 7, i > 150 ? t.shade : t.stone);
  for (let i = 0; i < 26; i++) Rr(6 + r() * 222, 6 + r() * 44, 7, 3, t.shade);
  tower(-8, 44, 112, 50, true); tower(150, 50, 134, 54); tower(214, 40, 98, 46, true); tower(70, 62, 168, 64, true);
  Rr(104, 0, 46, 78, t.stone); Rr(134, 0, 16, 78, t.shade); for (let i = 104; i < 148; i += 12) Rr(i, 78, 7, 6, t.stone);
  c.fillStyle = t.mark; c.beginPath(); c.moveTo(x0 + 116 * s, base); c.lineTo(x0 + 116 * s, base - 26 * s); c.arc(x0 + 127 * s, base - 26 * s, 11 * s, Math.PI, 0); c.lineTo(x0 + 138 * s, base); c.closePath(); c.fill();
};
/** Flat cloud: a stack of long pills, a shaded underside. */
export const paintCloud = (c: Ctx, x: number, y: number, s: number, t: Two) => {
  const pill = (px: number, py: number, w: number, h: number, f: string) => { c.beginPath(); c.roundRect(x + px * s, y + py * s, w * s, h * s, (h * s) / 2); c.fillStyle = f; c.fill(); };
  pill(0, 26, 300, 34, t.dark); pill(40, 8, 190, 36, t.dark); pill(0, 20, 300, 32, t.light); pill(46, 0, 180, 38, t.light); pill(150, 10, 120, 30, t.light);
};
/** A tuft of grass: a fan of blades in two tones. */
export const paintTuft = (c: Ctx, W: number, H: number, t: Two = {light: '#6a9a58', dark: '#557f4a'}) => {
  [[0.5, 0.0, 0], [0.26, 0.3, -1], [0.74, 0.24, 1], [0.1, 0.56, -1], [0.9, 0.5, 1], [0.38, 0.16, 0], [0.63, 0.36, 1]].forEach(([x, top, k], i) => P(c, [[W * 0.5 - W * 0.09 + k * W * 0.08, H], [W * x, H * top], [W * 0.5 + W * 0.09 + k * W * 0.08, H]], i % 2 ? t.dark : t.light));
};

// ---------------------------------------------------------------- more painters: limestone country, bamboo, palms, animals
/** A limestone tower (karst): steep sides, a rounded top, light face left; cap = a colour for growth on its top. */
export const paintKarst = (c: Ctx, x: number, yt: number, hw: number, base: number, t: Two & {cap?: string}) => {
  const h = base - yt, S = [[x - hw, base], [x - hw * 0.9, yt + h * 0.5], [x - hw * 0.62, yt + h * 0.14], [x - hw * 0.26, yt], [x + hw * 0.2, yt + h * 0.05], [x + hw * 0.6, yt + h * 0.22], [x + hw * 0.88, yt + h * 0.52], [x + hw, base]];
  P(c, S, t.dark); P(c, [S[0], S[1], S[2], S[3], [x - hw * 0.04, yt + h * 0.34], [x - hw * 0.2, yt + h * 0.68], [x - hw * 0.02, base]], t.light);
  if (t.cap) { c.save(); path(c, S); c.clip(); [[-0.52, 0.2, 0.22], [-0.14, 0.03, 0.26], [0.3, 0.12, 0.22], [0.64, 0.34, 0.16], [-0.7, 0.5, 0.14]].forEach(([dx, dy, r]) => disc(c, x + hw * dx, yt + h * dy, hw * r, t.cap!)); c.restore(); }
};
const lens = (c: Ctx, x0: number, y0: number, x1: number, y1: number, bow: number, belly: number, f: string) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx + nx * bow, my + ny * bow, x1, y1); c.quadraticCurveTo(mx + nx * (bow + belly), my + ny * (bow + belly), x0, y0); c.closePath(); c.fillStyle = f; c.fill(); };
/** A clump of bamboo: slim jointed culms that lean out from one foot, sprays of narrow leaves towards the tops. */
export const paintBamboo = (c: Ctx, W: number, H: number, seed = 1, t = {a: '#a3b565', b: '#84994d', leaf: '#629c4d', leafDark: '#4b8241'}) => {
  const r = rnd(seed), n = 8, sprays: number[][] = [];
  for (let i = 0; i < n; i++) {
    const x0 = W * (0.42 + 0.16 * (i / (n - 1))), bend = (i / (n - 1) - 0.5) * W * 0.8 + (r() - 0.5) * W * 0.12, top = H * (0.05 + r() * 0.2), w = W * 0.014 + r() * W * 0.007, pt = (u: number) => [x0 + bend * u * u, H - (H - top) * u];
    for (let k = 0; k < 11; k++) { const a = pt(k / 11), b = pt((k + 1) / 11); P(c, [[a[0] - w, a[1]], [a[0] + w, a[1]], [b[0] + w * 0.92, b[1] + 1.5], [b[0] - w * 0.92, b[1] + 1.5]], k % 2 ? t.a : t.b); }
    [0.5, 0.66, 0.8, 0.92, 1].forEach((u) => { if (r() < 0.85) sprays.push([...pt(u), bend >= 0 ? 1 : -1]); });
  }
  sprays.forEach(([x, y, side], i) => { const L = W * (0.1 + r() * 0.05); for (let j = 0; j < 6; j++) { const a = ((-80 + j * 32 + r() * 16) * Math.PI) / 180, tx = x + Math.sin(a) * L * side, ty = y + (0.35 + Math.cos(a) * 0.65) * L * 0.8; lens(c, x, y, tx, ty, L * 0.06, L * 0.14, (i + j) % 2 ? t.leaf : t.leafDark); } });
};
/** An areca palm: a slim ringed trunk, a small crown of drooping fronds, a bunch of nuts under it. */
export const paintPalm = (c: Ctx, W: number, H: number) => {
  const top = H * 0.22, X = (u: number) => W * 0.46 + Math.sin(u * 1.5) * W * 0.07, Y = (u: number) => H - (H - top) * u;
  for (let k = 0; k < 16; k++) { const u0 = k / 16, u1 = (k + 1) / 16, w = W * 0.034 * (1 - u0 * 0.3); P(c, [[X(u0) - w, Y(u0)], [X(u0) + w, Y(u0)], [X(u1) + w, Y(u1) + 1.5], [X(u1) - w, Y(u1) + 1.5]], k % 2 ? '#a19a7c' : '#8a846a'); }
  const hx = X(1), hy = top, L = W * 0.47;
  [[-168, 1], [152, 0], [-140, 0], [-18, 1], [-112, 1], [-44, 0], [-88, 0], [-66, 1], [12, 0], [176, 1]].forEach(([deg, k]) => { const a = (deg * Math.PI) / 180, tx = hx + Math.cos(a) * L, ty = hy + Math.sin(a) * L * 0.8 + L * 0.34; lens(c, hx, hy, tx, ty, (Math.cos(a) > 0 ? -1 : 1) * L * 0.3, (Math.cos(a) > 0 ? -1 : 1) * L * 0.13, k ? '#5c9650' : '#487d43'); });
  [[-10, 16], [6, 22], [-2, 30], [12, 12], [-16, 26]].forEach(([dx, dy]) => disc(c, hx + dx * W * 0.004, hy + dy * W * 0.004, W * 0.022, '#d98a3a'));
};
/** A banana plant: a short thick stem and a few BROAD blades that arch out and droop, each with a pale midrib. */
export const paintBanana = (c: Ctx, W: number, H: number) => {
  P(c, [[W * 0.43, H], [W * 0.57, H], [W * 0.54, H * 0.5], [W * 0.46, H * 0.5]], '#9ab862'); P(c, [[W * 0.5, H], [W * 0.57, H], [W * 0.54, H * 0.5], [W * 0.5, H * 0.5]], '#7f9c50');
  const hx = W * 0.5, hy = H * 0.52, L = W * 0.46;
  ([[-160, 0.95, 0], [-20, 0.95, 1], [-128, 1.05, 1], [-52, 1.05, 0], [-92, 1.0, 1]] as number[][]).forEach(([deg, k, lt]) => {
    const a = (deg * Math.PI) / 180, droop = Math.abs(Math.cos(a)) * 0.5, cx = hx + Math.cos(a) * L * k * 0.5, cy = hy + Math.sin(a) * L * k * 0.5 + droop * L * 0.12, rot = a + Math.sign(Math.cos(a)) * droop * 0.5;
    c.save(); c.translate(cx, cy); c.rotate(rot); c.beginPath(); c.ellipse(0, 0, L * k * 0.52, L * 0.17, 0, 0, 7); c.fillStyle = lt ? '#63a052' : '#4f8c47'; c.fill(); c.beginPath(); c.ellipse(0, L * 0.05, L * k * 0.5, L * 0.1, 0, 0, Math.PI); c.fillStyle = lt ? '#559548' : '#447f40'; c.fill();
    c.strokeStyle = '#b4d184'; c.lineWidth = W * 0.008; c.beginPath(); c.moveTo(-L * k * 0.5, 0); c.lineTo(L * k * 0.5, 0); c.stroke(); c.restore();
  });
};
/** A banyan: a broad trunk on buttress roots, heavy boughs, hanging roots, a wide crown of flat discs in three greens. */
export const paintBanyan = (c: Ctx, W: number, H: number) => {
  const u = W / 1120, T = (x: number, y: number) => [(x + 60) * u, H - (860 - y) * u], Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => T(x, y)), f), D = (l: number[][], f: string) => l.forEach(([x, y, r]) => { const [a, b] = T(x, y); disc(c, a, b, r * u, f); });
  c.lineCap = 'round'; ([[450, 410, 215, 300, 46], [600, 400, 800, 292, 46], [520, 400, 520, 250, 40]] as number[][]).forEach(([x0, y0, x1, y1, w]) => { const [a, b] = T(x0, y0), [d, e] = T(x1, y1); c.strokeStyle = '#6b5644'; c.lineWidth = w * u; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  ([[180, 330, 600], [236, 320, 760], [292, 330, 520], [730, 322, 560], [792, 312, 790], [850, 326, 500], [660, 360, 640], [388, 372, 690]] as number[][]).forEach(([x, y0, y1], i) => { const [a, b] = T(x, y0), [d, e] = T(x + (i % 2 ? 6 : -6), y1); c.strokeStyle = i % 2 ? '#7a6650' : '#6a5744'; c.lineWidth = (5 + (i % 3)) * u; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  Q([[330, 860], [362, 700], [402, 560], [384, 430], [450, 380], [520, 402], [600, 380], [642, 440], [622, 560], [662, 700], [704, 860]], '#6f5a47');
  Q([[520, 402], [600, 380], [642, 440], [622, 560], [662, 700], [704, 860], [566, 860], [544, 600]], '#58463a');
  Q([[296, 860], [352, 752], [386, 860]], '#6f5a47'); Q([[646, 860], [684, 762], [748, 860]], '#58463a'); Q([[448, 860], [484, 786], [524, 860]], '#63503f'); Q([[470, 700], [486, 600], [502, 700]], '#4a3a2f');
  D([[500, 212, 212], [250, 252, 172], [762, 252, 176], [118, 300, 112], [892, 300, 112], [380, 120, 132], [642, 120, 136]], '#3d6b40');
  D([[470, 190, 170], [240, 230, 130], [742, 226, 134], [360, 110, 100], [630, 105, 104], [130, 284, 70], [880, 282, 72]], '#4d8550');
  D([[420, 150, 90], [210, 200, 70], [700, 186, 76], [330, 80, 56], [600, 72, 58], [110, 268, 36], [860, 262, 38], [520, 250, 50]], '#63a05c');
  // leafage: many small clumps over the big discs (a big plain disc is a flat area), lobes along the outline, a few dark gaps
  { const r = rnd(77), big = [[500, 212, 212], [250, 252, 172], [762, 252, 176], [118, 300, 112], [892, 300, 112], [380, 120, 132], [642, 120, 136]]; for (let i = 0; i < 110; i++) { const [bx, by, br] = big[i % 7], a = r() * 6.283, q = Math.sqrt(r()) * br * 1.02, x = bx + Math.cos(a) * q, y = by + Math.sin(a) * q * 0.9, lit = (x - bx) * -0.6 + (y - by) * -1 > -br * 0.2; D([[x, y, 16 + r() * 22]], lit ? (r() < 0.5 ? '#5a9658' : '#6eaa62') : (r() < 0.5 ? '#457a48' : '#3d6b40')); } }
  D([[460, 236, 14], [300, 190, 12], [660, 246, 13], [560, 150, 11], [180, 286, 10], [800, 270, 11]], '#33603a');
};
/** A water buffalo seen from the side, an egret riding on its back. */
export const paintBuffalo = (c: Ctx, W: number, H: number) => {
  const u = W / 400, R2 = (x: number, y: number, w: number, h: number, r: number, f: string) => { c.beginPath(); c.roundRect(x * u, y * u, w * u, h * u, r * u); c.fillStyle = f; c.fill(); }, Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => [x * u, y * u]), f);
  R2(118, 170, 26, 82, 6, '#474b52'); R2(270, 170, 26, 82, 6, '#474b52'); R2(80, 72, 252, 122, 54, '#5c6068'); R2(102, 72, 200, 40, 20, '#6d7179'); R2(104, 154, 206, 38, 19, '#4f535b');
  R2(150, 170, 28, 88, 6, '#565a62'); R2(300, 170, 28, 88, 6, '#565a62'); [150, 300, 118, 270].forEach((x) => R2(x, 246, 28, 12, 3, '#2e3035'));
  Q([[96, 86], [42, 108], [14, 150], [22, 178], [62, 182], [100, 152]], '#5c6068'); Q([[14, 150], [22, 178], [50, 181], [40, 152]], '#494d54'); disc(c, 58 * u, 128 * u, 4.5 * u, '#1f2023'); Q([[84, 98], [106, 84], [102, 108]], '#4f535b');
  c.lineCap = 'round'; c.strokeStyle = '#bdb6a4'; c.lineWidth = 10 * u; c.beginPath(); c.moveTo(86 * u, 98 * u); c.quadraticCurveTo(102 * u, 60 * u, 152 * u, 58 * u); c.stroke();
  c.strokeStyle = '#d8d1be'; c.lineWidth = 12 * u; c.beginPath(); c.moveTo(66 * u, 100 * u); c.quadraticCurveTo(70 * u, 48 * u, 130 * u, 42 * u); c.stroke();
  c.strokeStyle = '#494d54'; c.lineWidth = 7 * u; c.beginPath(); c.moveTo(328 * u, 100 * u); c.quadraticCurveTo(352 * u, 130 * u, 346 * u, 172 * u); c.stroke(); disc(c, 346 * u, 178 * u, 8 * u, '#3a3d43');
  c.beginPath(); c.ellipse(222 * u, 56 * u, 24 * u, 13 * u, -0.1, 0, 7); c.fillStyle = '#f6f6f2'; c.fill(); c.strokeStyle = '#f6f6f2'; c.lineWidth = 6 * u; c.beginPath(); c.moveTo(240 * u, 52 * u); c.quadraticCurveTo(252 * u, 40 * u, 248 * u, 22 * u); c.stroke(); disc(c, 249 * u, 20 * u, 6 * u, '#f6f6f2'); Q([[253, 17], [272, 21], [253, 24]], '#e6b84a');
  c.strokeStyle = '#3a3d43'; c.lineWidth = 2.4 * u; [214, 226].forEach((x) => { c.beginPath(); c.moveTo(x * u, 66 * u); c.lineTo(x * u, 76 * u); c.stroke(); });
};
export const paintEgret = (c: Ctx, W: number, H: number) => {
  const u = W / 120; c.lineCap = 'round'; c.strokeStyle = '#4a4a44'; c.lineWidth = 2.6 * u; [52, 66].forEach((x) => { c.beginPath(); c.moveTo(x * u, 100 * u); c.lineTo((x + 3) * u, H); c.stroke(); });
  c.beginPath(); c.ellipse(58 * u, 86 * u, 30 * u, 18 * u, -0.25, 0, 7); c.fillStyle = '#f6f6f2'; c.fill(); c.strokeStyle = '#f6f6f2'; c.lineWidth = 8 * u; c.beginPath(); c.moveTo(80 * u, 78 * u); c.quadraticCurveTo(98 * u, 56 * u, 84 * u, 30 * u); c.stroke(); disc(c, 84 * u, 26 * u, 8 * u, '#f6f6f2'); P(c, [[90 * u, 22 * u], [114 * u, 28 * u], [90 * u, 31 * u]], '#e6b84a');
};
export const paintChicken = (c: Ctx, W: number, H: number, body = '#b9743a', wing = '#9a5c2c') => {
  const u = W / 140; c.strokeStyle = '#d9a43a'; c.lineWidth = 3 * u; [60, 80].forEach((x) => { c.beginPath(); c.moveTo(x * u, 96 * u); c.lineTo(x * u, H - 2); c.lineTo((x + 8) * u, H - 2); c.stroke(); });
  P(c, [[34 * u, 62 * u], [6 * u, 30 * u], [44 * u, 46 * u]], wing); c.beginPath(); c.ellipse(70 * u, 70 * u, 40 * u, 29 * u, 0, 0, 7); c.fillStyle = body; c.fill(); c.beginPath(); c.ellipse(64 * u, 74 * u, 22 * u, 15 * u, 0.2, 0, 7); c.fillStyle = wing; c.fill();
  disc(c, 104 * u, 44 * u, 14 * u, body); P(c, [[98 * u, 32 * u], [104 * u, 20 * u], [110 * u, 30 * u], [116 * u, 22 * u], [116 * u, 36 * u]], '#c8443a'); P(c, [[116 * u, 42 * u], [132 * u, 47 * u], [116 * u, 51 * u]], '#e6b84a'); disc(c, 114 * u, 56 * u, 4.5 * u, '#c8443a'); disc(c, 107 * u, 42 * u, 2.2 * u, '#1f1c1a');
};
/** A tower pagoda far off: stacked storeys under eaves that turn up at the tips, a spire. s = size of a unit. */
export const paintPagoda = (c: Ctx, x: number, base: number, s: number, t: {wall: string; shade: string; roof: string}) => {
  let y = base;
  for (let i = 0; i < 5; i++) { const hw = (26 - i * 3.6) * s, h = (24 - i * 1.5) * s, e = y - h; c.fillStyle = t.wall; c.fillRect(x - hw, e, hw * 2, h); c.fillStyle = t.shade; c.fillRect(x + hw * 0.24, e, hw * 0.76, h); c.fillStyle = t.roof; c.fillRect(x - 2.5 * s, e + h * 0.4, 5 * s, h * 0.6);
    P(c, [[x - hw - 13 * s, e - 6 * s], [x - hw, e + 3 * s], [x + hw, e + 3 * s], [x + hw + 13 * s, e - 6 * s], [x + hw * 0.62, e - 9 * s], [x - hw * 0.62, e - 9 * s]], t.roof); y = e - 8 * s; }
  P(c, [[x - 3 * s, y], [x, y - 30 * s], [x + 3 * s, y]], t.roof);
};

// ---------------------------------------------------------------- interiors and schools (added for the classroom test)
/** A long two-storey school block seen across a yard: walls lit left / shaded right of a corner, a red tiled roof in two
 *  tones, an open corridor on each floor with a railing, square pillars, doors and windows. Screen units. */
export const paintSchoolBlock = (c: Ctx, x: number, base: number, w: number, h: number, t: {wall: string; shade: string; roof: string; roofShade: string; mark: string; rail: string}) => {
  const fh = h / 2, r = rnd(31);
  c.fillStyle = t.wall; c.fillRect(x, base - h, w, h); c.fillStyle = t.shade; c.fillRect(x + w * 0.86, base - h, w * 0.14, h);
  for (let f = 0; f < 2; f++) {
    const y0 = base - (f + 1) * fh;
    c.fillStyle = t.mark; c.fillRect(x, y0 + fh * 0.22, w * 0.86, fh * 0.78);                                   // the deep shade of the corridor
    for (let px = x; px < x + w * 0.86; px += w * 0.1) { c.fillStyle = t.wall; c.fillRect(px, y0 + fh * 0.18, w * 0.022, fh * 0.82); }   // pillars
    for (let dx = x + w * 0.04; dx < x + w * 0.8; dx += w * 0.1) { c.fillStyle = r() < 0.5 ? '#7a5a3e' : '#5d6e74'; c.fillRect(dx, y0 + fh * 0.42, w * 0.032, fh * 0.56); c.fillStyle = '#9fb0b4'; c.fillRect(dx + w * 0.045, y0 + fh * 0.44, w * 0.03, fh * 0.26); }
    c.fillStyle = t.rail; c.fillRect(x, y0 + fh * 0.7, w * 0.86, fh * 0.05); for (let px = x; px < x + w * 0.86; px += w * 0.018) c.fillRect(px, y0 + fh * 0.72, w * 0.004, fh * 0.28);
    c.fillStyle = t.wall; c.fillRect(x, y0 + fh * 0.98, w * 0.86, fh * 0.06);
  }
  c.fillStyle = t.shade; for (let k = 0; k < 3; k++) c.fillRect(x + w * (0.9 + k * 0.03), base - h * 0.85, w * 0.018, h * 0.26);   // windows on the end wall
  P(c, [[x - w * 0.02, base - h], [x + w * 0.04, base - h - fh * 0.62], [x + w * 0.9, base - h - fh * 0.62], [x + w * 1.02, base - h]], t.roof);
  P(c, [[x + w * 0.86, base - h], [x + w * 0.9, base - h - fh * 0.62], [x + w * 1.02, base - h]], t.roofShade);
  c.strokeStyle = t.roofShade; c.lineWidth = 1.5; for (let k = 1; k < 4; k++) { const yy = base - h - fh * 0.155 * k; c.beginPath(); c.moveTo(x + w * 0.01 * k, yy); c.lineTo(x + w * (0.9 + 0.04 * (1 - k / 4)), yy); c.stroke(); }
};
/** A tropical almond (bàng) as schools have: a stout trunk, branches in flat horizontal tiers, leaves green and, in late
 *  autumn, some turned red-orange. */
export const paintAlmondTree = (c: Ctx, W: number, H: number, seed = 1) => {
  const r = rnd(seed), u = W / 600;
  P(c, [[W * 0.44, H], [W * 0.56, H], [W * 0.53, H * 0.5], [W * 0.5, H * 0.3], [W * 0.47, H * 0.5]], '#6d5a48'); P(c, [[W * 0.5, H], [W * 0.56, H], [W * 0.53, H * 0.5], [W * 0.5, H * 0.3]], '#57473a');
  const tiers = [[0.62, 0.42], [0.46, 0.36], [0.31, 0.3], [0.17, 0.22], [0.06, 0.13]];
  tiers.forEach(([y, hw], i) => {
    c.strokeStyle = '#5e4c3c'; c.lineWidth = 9 * u; c.beginPath(); c.moveTo(W * 0.5, H * (y + 0.04)); c.lineTo(W * (0.5 - hw * 0.8), H * (y + 0.02)); c.moveTo(W * 0.5, H * (y + 0.04)); c.lineTo(W * (0.5 + hw * 0.8), H * (y + 0.03)); c.stroke();
    for (let k = 0; k < 26; k++) { const t = (r() - 0.5) * 2, x = W * (0.5 + t * hw), yy = H * (y - 0.02 + r() * 0.05) + Math.abs(t) * H * 0.02, q = (16 + r() * 18) * u, red = r() < 0.16 + i * 0.03;
      c.beginPath(); c.ellipse(x, yy, q * 1.5, q * 0.62, 0, 0, 7); c.fillStyle = red ? (r() < 0.5 ? '#c9603a' : '#d8873f') : t < -0.1 ? (r() < 0.5 ? '#6fa35a' : '#5d9450') : (r() < 0.5 ? '#4d8247' : '#5a8e4d'); c.fill(); }
  });
};
/** A school backpack seen from the front: body, flap, front pocket with a light top edge, two side straps, a buckle. */
export const paintSchoolbag = (c: Ctx, W: number, H: number, col = '#3f6aa8', dark = '#2f5282', trim = '#e6c04a') => {
  c.beginPath(); c.roundRect(W * 0.1, H * 0.12, W * 0.8, H * 0.86, W * 0.16); c.fillStyle = col; c.fill();
  c.beginPath(); c.roundRect(W * 0.62, H * 0.14, W * 0.28, H * 0.84, W * 0.12); c.fillStyle = dark; c.fill();
  c.strokeStyle = dark; c.lineWidth = W * 0.07; c.beginPath(); c.arc(W * 0.5, H * 0.14, W * 0.18, Math.PI, 0); c.stroke();
  c.beginPath(); c.roundRect(W * 0.08, H * 0.12, W * 0.84, H * 0.3, [W * 0.16, W * 0.16, W * 0.06, W * 0.06]); c.fillStyle = dark; c.fill();
  c.beginPath(); c.roundRect(W * 0.2, H * 0.56, W * 0.6, H * 0.36, W * 0.08); c.fillStyle = dark; c.fill(); c.fillStyle = trim; c.fillRect(W * 0.2, H * 0.56, W * 0.6, H * 0.04);
  c.fillStyle = trim; c.fillRect(W * 0.44, H * 0.36, W * 0.12, H * 0.1);
};
/** A clay pot with a leafy plant: tapering pot in two tones with a rim, broad pointed leaves in three greens. */
export const paintPotPlant = (c: Ctx, W: number, H: number, seed = 1) => {
  const r = rnd(seed);
  P(c, [[W * 0.28, H], [W * 0.72, H], [W * 0.8, H * 0.62], [W * 0.2, H * 0.62]], '#b8683e'); P(c, [[W * 0.52, H], [W * 0.72, H], [W * 0.8, H * 0.62], [W * 0.56, H * 0.62]], '#9a5432');
  c.fillStyle = '#c97a4c'; c.fillRect(W * 0.16, H * 0.58, W * 0.68, H * 0.07);
  for (let k = 0; k < 11; k++) { const a = (-160 + k * 14 + r() * 10) * (Math.PI / 180), L = W * (0.3 + r() * 0.16), x0 = W * 0.5, y0 = H * 0.6; lens(c, x0, y0, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L * 1.3, L * 0.1, L * 0.3, ['#3f7a45', '#4f8f50', '#68a65e'][k % 3]); }
};
/** A bunch of flowers in a jar (the day after Teachers' Day): stems, leaves, round blooms in two or three colours. */
export const paintBouquet = (c: Ctx, W: number, H: number, cols: string[] = ['#e2566a', '#f2c94c', '#f6f0e4', '#d2456a']) => {
  const r = rnd(5);
  for (let k = 0; k < 9; k++) { const tx = W * (0.15 + r() * 0.7), ty = H * (0.08 + r() * 0.32); c.strokeStyle = '#4f7d43'; c.lineWidth = W * 0.02; c.beginPath(); c.moveTo(W * 0.5, H); c.quadraticCurveTo(W * 0.5, H * 0.55, tx, ty); c.stroke(); lens(c, (W * 0.5 + tx) / 2, (H * 0.7 + ty) / 2, (W * 0.5 + tx) / 2 + (tx < W / 2 ? -1 : 1) * W * 0.14, (H * 0.7 + ty) / 2 - H * 0.04, W * 0.02, W * 0.05, '#5b9450'); }
  const rr = rnd(9); for (let k = 0; k < 9; k++) { const x = W * (0.15 + rr() * 0.7), y = H * (0.08 + rr() * 0.32), q = W * (0.07 + rr() * 0.04), f = cols[k % cols.length]; disc(c, x, y, q, f); disc(c, x - q * 0.25, y - q * 0.25, q * 0.55, 'rgba(255,255,255,0.25)'); disc(c, x, y, q * 0.25, '#b0603a'); }
};
/** A broom of dried grass standing on its tip: a straight handle and a fanned, tied head. */
export const paintBroom = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#a5844e'; c.fillRect(W * 0.46, 0, W * 0.08, H * 0.62);
  P(c, [[W * 0.42, H * 0.58], [W * 0.58, H * 0.58], [W * 0.95, H], [W * 0.05, H]], '#c9ad6a'); P(c, [[W * 0.5, H * 0.58], [W * 0.58, H * 0.58], [W * 0.95, H], [W * 0.5, H]], '#ad9254');
  c.strokeStyle = '#8e7740'; c.lineWidth = W * 0.02; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(W * 0.5, H * 0.62); c.lineTo(W * (0.1 + k * 0.13), H); c.stroke(); }
  c.fillStyle = '#b8453a'; c.fillRect(W * 0.4, H * 0.6, W * 0.2, H * 0.04);
};

// ---------------------------------------------------------------- railway station test: a flame tree, a water tower, smoke
/** A flame tree (phượng vĩ): a short leaning trunk that forks into long low boughs, a WIDE flat umbrella crown of fine
 *  feathery green in three tones, and clusters of scarlet blossom over the lit (left, upper) part of the crown. seed varies it. */
export const paintFlameTree = (c: Ctx, W: number, H: number, seed = 1) => {
  const r = rnd(seed), u = W / 900, T = (x: number, y: number) => [x * u, H - (640 - y) * u];
  const Q = (pts: number[][], f: string) => P(c, pts.map(([x, y]) => T(x, y)), f);
  // trunk and the forked boughs, lit face left
  Q([[400, 640], [470, 640], [462, 470], [500, 360], [478, 352], [446, 430], [420, 330], [396, 336], [420, 470]], '#7a6150');
  Q([[440, 640], [470, 640], [462, 470], [500, 360], [478, 352], [446, 440]], '#5e4a3d');
  c.lineCap = 'round'; ([[452, 430, 250, 250, 20], [470, 400, 690, 240, 18], [430, 350, 360, 190, 14], [486, 362, 560, 180, 13], [300, 280, 150, 250, 9], [640, 262, 790, 236, 9]] as number[][]).forEach(([x0, y0, x1, y1, w]) => { const [a, b] = T(x0, y0), [d, e] = T(x1, y1); c.strokeStyle = '#6a5444'; c.lineWidth = w * u; c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo((a + d) / 2, Math.min(b, e) - 20 * u, d, e); c.stroke(); });
  // the crown: a broad low dome built from many flattened discs, darker underneath, lighter on top-left
  const blob = (x: number, y: number, rx: number, ry: number, f: string) => { const [a, b] = T(x, y); c.beginPath(); c.ellipse(a, b, rx * u, ry * u, 0, 0, 7); c.fillStyle = f; c.fill(); };
  for (let i = 0; i < 46; i++) { const x = 70 + r() * 760, y = 200 + r() * 70 + Math.abs(x - 450) * 0.08; blob(x, y, 60 + r() * 50, 30 + r() * 18, r() < 0.5 ? '#3f6a3c' : '#355d35'); }
  for (let i = 0; i < 52; i++) { const x = 90 + r() * 720, y = 150 + r() * 80 + Math.abs(x - 430) * 0.1; blob(x, y, 46 + r() * 40, 22 + r() * 14, r() < 0.5 ? '#4f8048' : '#5a8c4e'); }
  for (let i = 0; i < 40; i++) { const x = 120 + r() * 560, y = 110 + r() * 70 + Math.abs(x - 400) * 0.12; blob(x, y, 30 + r() * 30, 14 + r() * 10, r() < 0.5 ? '#6c9e58' : '#7aab60'); }
  // feathery edge: small leaf sprays hanging from the rim of the crown
  for (let i = 0; i < 60; i++) { const x = 60 + r() * 780, y = 250 + Math.abs(x - 450) * 0.08 + r() * 30; blob(x, y, 14 + r() * 10, 6 + r() * 4, r() < 0.5 ? '#355d35' : '#2f5330'); }
  // a few dark gaps in the leafage, then the blossom: clusters of three reds, thickest on the lit side and the top
  for (let i = 0; i < 8; i++) blob(160 + r() * 580, 190 + r() * 50, 14 + r() * 10, 6 + r() * 4, '#2a4a2c');
  // each cluster is a loose spray of small petals, not one round blob (a big red disc reads as a balloon)
  for (let i = 0; i < 95; i++) { const x = 90 + r() * 700, y = 115 + r() * 135 + Math.abs(x - 420) * 0.08, lit = x < 520 || r() < 0.4; if (!lit && r() < 0.5) continue; const n = 4 + Math.floor(r() * 4), spread = 14 + r() * 14;
    for (let k = 0; k < n; k++) { const px = x + (r() - 0.5) * spread * 2, py = y + (r() - 0.5) * spread, q = 4 + r() * 5; blob(px + 1.5, py + 1.5, q * 1.3, q * 0.8, '#9c2a24'); blob(px, py, q * 1.2, q * 0.75, k % 3 ? '#d9442e' : '#c4362a'); if (r() < 0.45) blob(px - q * 0.3, py - q * 0.25, q * 0.5, q * 0.32, '#f2804e'); } }
  // fallen petals at the foot
  for (let i = 0; i < 12; i++) blob(330 + r() * 220, 632 + r() * 6, 5 + r() * 4, 2, r() < 0.5 ? '#c9402c' : '#e0603a');
};
/** An old station water tower, small enough to sit on a far plate: a tapering column on a plinth, a round tank with
 *  bands and a conical cap, a ladder. x = centre, base = foot on the plate, s = size (the tower is 100 units tall at s 1). */
export const paintWaterTower = (c: Ctx, x: number, base: number, s: number, t: {light: string; dark: string; tank: string; tankDark: string; cap: string}) => {
  const Y = (v: number) => base - v * s, X = (v: number) => x + v * s;
  P(c, [[X(-16), Y(0)], [X(16), Y(0)], [X(16), Y(8)], [X(-16), Y(8)]], t.dark);
  P(c, [[X(-12), Y(8)], [X(12), Y(8)], [X(9), Y(62)], [X(-9), Y(62)]], t.light); P(c, [[X(2), Y(8)], [X(12), Y(8)], [X(9), Y(62)], [X(1), Y(62)]], t.dark);
  P(c, [[X(-20), Y(62)], [X(20), Y(62)], [X(20), Y(86)], [X(-20), Y(86)]], t.tank); P(c, [[X(4), Y(62)], [X(20), Y(62)], [X(20), Y(86)], [X(4), Y(86)]], t.tankDark);
  [68, 76].forEach((v) => { c.fillStyle = t.tankDark; c.fillRect(X(-20), Y(v + 1.4), 40 * s, 1.6 * s); });
  P(c, [[X(-23), Y(86)], [X(23), Y(86)], [X(0), Y(100)]], t.cap); P(c, [[X(0), Y(100)], [X(23), Y(86)], [X(4), Y(86)]], t.tankDark);
  c.fillStyle = t.dark; c.fillRect(X(-4), Y(30), 5 * s, 10 * s);   // a small door-like opening in the column
  c.strokeStyle = t.dark; c.lineWidth = Math.max(1, 1.2 * s); c.beginPath(); c.moveTo(X(-14), Y(8)); c.lineTo(X(-14), Y(62)); c.moveTo(X(-11), Y(8)); c.lineTo(X(-11), Y(62)); c.stroke();
};
/** A puff of smoke or steam: overlapping round billows, a light top-left and a shaded lower right; grows wider upwards. */
export const paintSmoke = (c: Ctx, W: number, H: number, t: {light: string; mid: string; dark: string} = {light: '#f1ece4', mid: '#dcd5cc', dark: '#bdb6ae'}) => {
  const r = rnd(3);
  for (let i = 0; i < 9; i++) { const k = i / 8, x = W * (0.5 + (r() - 0.5) * 0.2 + k * 0.12), y = H * (0.86 - k * 0.6), q = W * (0.1 + k * 0.15); disc(c, x + q * 0.18, y + q * 0.16, q, t.dark); disc(c, x, y, q * 0.92, t.mid); disc(c, x - q * 0.24, y - q * 0.22, q * 0.55, t.light); }
};
