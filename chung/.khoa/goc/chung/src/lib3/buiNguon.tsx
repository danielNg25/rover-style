// BỤI THEO NGUỒN SÁNG VÀ THEO MÔI TRƯỜNG (24/11/2026).
// Vì sao có: các phiên dựng rải hạt bừa (chấm xanh lá rải đều khắp khung giữa ban ngày). Hạt trong không khí chỉ hiện ở chỗ có
// ánh sáng làm nó hiện: bụi be trong vệt nắng, tàn lửa sát lửa, vài hạt vàng quanh ngọn nến, bụi mịn trong quầng đèn, hạt màu
// quấn quanh phép màu. Ngoài các chỗ đó chỉ còn một lớp nền rất thưa theo nơi và giờ.
//
// CÁCH DÙNG: người dựng KHÔNG tự rải hạt. Đặt đèn, lửa, nắng như thường và gọi `datNoiBui(noi)` ở đầu bối cảnh (lib3/mauBui).
//  - Tự đăng ký (mỗi món tự báo nguồn của nó, tắt bằng prop `bui={false}`):
//      Sun (room)           -> 'nang'  bụi chỉ trong khối nắng (thử từng hạt: đường tới mặt trời có bị tường, trần che không);
//                              ánh trăng (Sun màu lạnh) trong nhà không có bụi, ngoài trời còn ít và nhạt
//      Flame (kit)          -> 'lua' khi ngọn rộng >= 0,15 m (Fire, lò rèn, đuốc), 'nen' khi nhỏ hơn (nến)
//      Lantern, StationLamp lit (kit) -> 'den';   HandLantern lit (kit) -> 'nen'
//      Halo (look)          -> quầng lớn (r >= 0,45 m, strength >= 0,2): màu ấm là 'den', màu khác là 'phep'. Quầng nằm sát một nguồn
//                              đã đăng ký (lửa, đèn) thì nhường nguồn đó, không vẽ thêm.
//      SceneLight (look)    -> báo loại nơi (grade) cho lớp nền.
//      Motes, Fireflies (kit), AirLayer, CampAir (kitCamp) -> báo "cảnh đã có lớp hạt riêng": lớp nền tắt, bụi nắng còn một nửa.
//  - Đăng ký tay: <NguonBui kieu="phep" pos={[x, y, z]} mau="#7feaff" r={0.6} />  (k = độ dày, mặc định 1).
//  - Bụi theo NHÂN VẬT, CHỈ CHO CẢNH SIGNATURE (Daniel 25/11: "bụi vẫn phải bay linh tinh trong phòng"; cảnh signature chứ không lạm
//    dụng): <BuiNhanVat kieu="tim" /> (hoặc mau="#a85cff") đổi lớp bụi bay tự do khắp khung trước máy sang màu nhân vật, dày như các cảnh
//    Purple Man của doom-1 (15-25 hạt mỗi khung). Không phải hạt toát ra hay quấn quanh người. Cảnh thường không đặt: chỉ có bụi của nguồn sáng.
//  - Bụi theo CÂY, HOA, CỎ (ngoài trời): Sprite tự nhận loại theo tên (tree, pine, poplar, palm, bamboo, hedge -> 'la'; bush, flower, hoa ->
//    'phan-hoa', bụi không có hoa thì 'la'; tuft, grass -> 'hat-co') và lấy màu từ chính bức vẽ (tán lá, chấm hoa); prop bui={false} tắt,
//    bui="la" | "phan-hoa" | "hat-co" chỉ định. Scatter kind="meadow" và Tuft (nature) là 'hat-co'. Khi có các nguồn này, lớp nền ngoài trời
//    chung (hạt phấn lơ lửng không gắn nguồn) bỏ hẳn. Trong nhà (chậu cây, bó hoa) và nơi tuyết không sinh hạt.
//  - Bụi theo CẢNH: lớp nền lấy màu từ kieu của datNoiBui(noi, kieu) (bảng MAU_BUI của mauBui: vang-nen, tim, xanh, kem, cat, lua, may;
//    'khong' tắt lớp nền). Một cảnh quay muốn màu khác bối cảnh dùng chung: đặt <MauBuiCanh kieu="tim" /> trong canvas (ví dụ trong
//    `inside` của Shot); dấu này thắng datNoiBui và vẫn vẽ cả khi bối cảnh đã có lớp hạt riêng.
//  - Vẽ: StageCam (kit) tự đặt <BuiNguon />. Canvas không dùng StageCam thì đặt <BuiNguon /> vào trong canvas.
//  - Tắt cả lớp cho một canvas: <BuiNguonCtx.Provider value={{bat: false}}> bọc nội dung canvas.
//  - Composition khớp `datBuiAm` (tập đã duyệt, mức bụi đã khoá): BuiNguon không vẽ gì, các nguồn không thêm gì vào cảnh.
//
// KỸ THUẬT: các nguồn chỉ là một group rỗng mang userData (không vẽ gì). BuiNguon, trong useLayoutEffect của mỗi khung (sau khi cả
// cây cảnh đã gắn, trước khi @remotion/three vẽ khung), đi qua cảnh tìm các group đó, lấy toạ độ thế giới, rồi tính vị trí từng hạt
// bằng hàm của khung f (đời hạt: sinh, trôi, mờ vào, mờ ra, sinh lại chỗ khác; lệch nhịp nhau; không Math.random). Hạt là một
// THREE.Points (lõi, trộn thường) và một lớp quầng (cộng sáng), cùng renderOrder 6 như BuiKhi: vẽ trước nhân vật (500) nên không đè mặt
// người; có thử chiều sâu nên tường che hạt ở sau. Cỡ hạt tính theo mét và theo máy, nên ảnh cỡ 0,5 hay 1 vẫn như nhau.
import React, {createContext, useContext, useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {useCurrentFrame} from 'remotion';
import {useBuiKhoa, noiBuiHienTai, MAU_BUI, type NoiBui, type GioBui, type KieuBui} from './mauBui';
import {GradeCtx, type Grade} from './look';

type V3 = [number, number, number];
export type KieuNguon = 'nang' | 'lua' | 'nen' | 'den' | 'phep' | KieuCay;
/** Nguồn ngoài trời (Daniel 25/11: "ngoài trời có cây cối, hoa thì bụi theo cây cối và hoa đó"): lá rơi từ tán, phấn / cánh hoa bay lên sát
 *  bụi hoa, hạt cỏ / bồ công anh trôi ngang. Chỉ ở ngoài trời, trong 40 m quanh máy. */
export type KieuCay = 'la' | 'phan-hoa' | 'hat-co';
/** Một nguồn bụi. pos = chỗ nguồn (toạ độ của cha). mau = màu ánh của nguồn. r = bán kính quầng (đèn, phép), w = bề ngang ngọn lửa.
 *  tu / toi (chỉ 'nang'): chỗ mặt trời và chỗ nắng rơi tới, cùng hệ toạ độ với pos. k = độ dày (1 = chuẩn). uuTien: 2 = nguồn thật
 *  (lửa, đèn, nắng, tay); 1 = đoán từ quầng (nhường nguồn thật ở gần). */
export type NguonBuiProps = {kieu: KieuNguon; pos?: V3; mau?: string; r?: number; w?: number; tu?: V3; toi?: V3; k?: number; uuTien?: number; h?: number; bang?: string[]};
type Nguon = {kieu: KieuNguon; p: THREE.Vector3; mau: THREE.Color; r: number; w: number; k: number; uu: number; tu?: THREE.Vector3; toi?: THREE.Vector3; h: number; bang: THREE.Color[]};

/** Bật / tắt cả lớp cho một canvas (cảnh thử TRƯỚC/SAU); k nhân độ dày mọi nguồn. */
export const BuiNguonCtx = createContext<{bat: boolean; k?: number}>({bat: true});

/** Nguồn bụi đăng ký tay (hoặc do các món có sẵn tự đặt). Không vẽ gì: chỉ là dấu cho BuiNguon. */
export const NguonBui: React.FC<NguonBuiProps> = ({pos, ...o}) => {
  if (useBuiKhoa()) return null;
  return <group position={pos} userData={{buiNguon: o}} />;
};
/** Dấu "cảnh đã có lớp hạt không khí riêng" (Motes, Fireflies, AirLayer, CampAir): lớp nền của BuiNguon tắt, bụi nắng còn một nửa. */
export const DaCoKhi: React.FC = () => (useBuiKhoa() ? null : <group userData={{buiKhi: true}} />);
/** Dấu loại nơi (SceneLight đặt): BuiNguon đọc giờ và trong / ngoài từ đây trước GradeCtx. */
export const TroiBui: React.FC<{grade: Grade}> = ({grade}) => (useBuiKhoa() ? null : <group userData={{buiTroi: grade}} />);
/** Màu bụi của lớp nền cho riêng cảnh quay này (thắng kieu của datNoiBui). kieu = 'khong' tắt lớp nền; mau = bảng màu riêng.
 *  dam = mật độ cảnh signature (xem BuiNhanVat). */
export const MauBuiCanh: React.FC<{kieu?: KieuBui; mau?: string[]; dam?: boolean}> = ({kieu, mau, dam}) => (useBuiKhoa() ? null : <group userData={{buiMau: mau ?? kieu ?? 'khong', buiDam: !!dam}} />);
/** CHỈ CHO NHÂN VẬT SIGNATURE TRONG CẢNH SIGNATURE (dùng sức mạnh, xuất hiện lần đầu, cơn giận; Purple Man tím, Doom xanh). Danh sách cảnh
 *  dùng phải ghi rõ trong bảng phân cảnh của tập. Không bật mặc định ở đâu cả.
 *  Đặt trong canvas của cảnh đó: lớp bụi bay tự do khắp khung (2-6 m trước máy) đổi sang màu nhân vật, mật độ như các cảnh Purple Man của
 *  doom-1 (15-25 hạt mỗi khung, nhỏ, quầng nhẹ, vài mảnh thoi). kieu theo bảng MAU_BUI ('tim', 'xanh', ...) hoặc mau = một màu bất kỳ.
 *  Hạt không gắn vào người: Daniel 25/11 "ý mình là bụi vẫn phải bay linh tinh trong phòng". */
export const BuiNhanVat: React.FC<{kieu?: Exclude<KieuBui, 'khong'>; mau?: string}> = ({kieu, mau}) =>
  <MauBuiCanh kieu={kieu} dam mau={mau ? [mau, '#' + new THREE.Color(mau).lerp(new THREE.Color('#ffffff'), 0.3).getHexString(), '#' + new THREE.Color(mau).multiplyScalar(0.85).getHexString()] : undefined} />;
/** Loại nguồn của một Sprite theo tên của nó (null: không phải cây, hoa, cỏ). */
// Bảng tên quét từ mọi Sprite đang dùng trong src/ và kenh/ (25/11/2026). Tên lạ không khớp thì Sprite tự đặt bui="la" | "phan-hoa" | "hat-co".
export const kieuCayTheoTen = (name: string): KieuCay | null =>
  /tuft|grass|reed|wheat|meadow|fern|weed|thorn/i.test(name) ? 'hat-co'
  : /bush|shrub|flower|flw|hoa|bouquet|rose|geranium|(^|-)ger|hyd|lily|lotus|(^|-)pot|chau|(^|-)bui(\d|-|$)|-(b|can)\d+$/i.test(name) ? 'phan-hoa'
  : /tree|pine|pino|poplar|palm|bamboo|hedge|ivy|vine|cay|thong|canopy|banyan|sakura|(^|-)sak\d|maple|willow|twigs|cyp|(^|-)lem|limao|(^|-)nho|(^|-)tan\d|(^|-)tre(-|\d|$)|banana|(^|-)xanh\d/i.test(name) ? 'la' : null;
const MAU_TRANH = new Map<string, {la: string[]; hoa: string[]}>();
/** Màu lá (xanh của tán) và màu hoa (chấm không xanh: hồng, vàng, trắng) đọc từ bức vẽ của Sprite; đọc một lần cho mỗi tên. */
export const mauTranh = (key: string, cv: HTMLCanvasElement | undefined) => {
  const c0 = MAU_TRANH.get(key); if (c0) return c0;
  const out = {la: [] as string[], hoa: [] as string[]};
  try {
    const W = cv!.width, H = cv!.height, d = cv!.getContext('2d')!.getImageData(0, 0, W, H).data, st = Math.max(1, Math.floor(Math.min(W, H) / 48));
    const la: THREE.Color[] = [], hoa: THREE.Color[] = [], hsl = {h: 0, s: 0, l: 0}; let tong = 0;
    for (let y = 0; y < H * 0.88; y += st) for (let x = 0; x < W; x += st) {
      const i = (y * W + x) * 4; if (d[i + 3] < 200) continue; tong++;
      const c = new THREE.Color().setRGB(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, THREE.SRGBColorSpace); c.getHSL(hsl);
      const xanh = hsl.h > 0.14 && hsl.h < 0.5 && hsl.s > 0.12;
      if (xanh) la.push(c); else if ((hsl.s > 0.35 && hsl.l > 0.4) || hsl.l > 0.82) hoa.push(c);
    }
    const bac = (a: THREE.Color[]) => { const b = [...a].sort((p, q) => p.getHSL(hsl).l - q.getHSL({h: 0, s: 0, l: 0}).l); return [0.35, 0.6, 0.85].map((k) => '#' + b[Math.min(b.length - 1, Math.floor(k * b.length))].getHexString(THREE.SRGBColorSpace)); };
    if (la.length) out.la = bac(la);
    if (hoa.length > tong * 0.006) out.hoa = bac(hoa);
  } catch { /* bức vẽ không đọc được: dùng màu mặc định */ }
  MAU_TRANH.set(key, out); return out;
};
/** Dấu nguồn của một Sprite cây, hoa, cỏ: w, h = cỡ bức vẽ; cv = canvas của bức vẽ (để lấy màu). */
export const NguonCay: React.FC<{ten: string; kieu: KieuCay; w: number; h: number; cv?: HTMLCanvasElement}> = ({ten, kieu, w, h, cv}) => {
  if (useBuiKhoa()) return null;
  const m = mauTranh(ten, cv), k = kieu === 'phan-hoa' && !m.hoa.length ? 'la' : kieu;
  // cây có tán không xanh (sakura, cây hoa): cánh rơi mang màu hoa
  const bang = k === 'phan-hoa' ? m.hoa : k === 'la' ? (m.la.length ? m.la : m.hoa.length ? m.hoa : ['#6f9a3a', '#8fae48']) : ['#f4efdc', '#ece4c8'];
  return <NguonBui kieu={k} r={w / 2} w={0} h={h} mau={bang[0]} bang={bang} k={kieu === 'phan-hoa' && k === 'la' ? 0.5 : 1} />;
};
/** Màu ấm (vàng, cam, đỏ cam): quầng ấm là đèn, quầng màu khác là phép / ánh máy. */
export const mauAm = (c: string | THREE.Color) => { const x = new THREE.Color(c), h = {h: 0, s: 0, l: 0}; x.getHSL(h); return h.s > 0.15 && (h.h < 0.17 || h.h > 0.97); };

// ---------------------------------------------------------------- số ngẫu nhiên theo (hạt, đời, hạt giống): cùng khung là cùng kết quả
const hs = (a: number, b: number, c = 0) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x); };
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** đời của hạt thứ i: u = 0..1 trong đời hiện tại, n = số thứ tự đời (mỗi đời sinh ở chỗ khác), a = số khung đã sống */
const doi = (f: number, i: number, seed: number, life: number) => { const L = life * (0.7 + 0.6 * hs(i, seed, 1)), q = f + hs(i, seed, 2) * L, n = Math.floor(q / L), a = q - n * L; return {u: a / L, n, a, L}; };
const moVaoRa = (u: number, vao = 0.15, ra = 0.25) => sm(0, vao, u) * (1 - sm(1 - ra, 1, u));

// ---------------------------------------------------------------- lớp vẽ: một Points lõi + một Points quầng, chung một hình
const MAX = 640;
const VS = /* glsl */ `
uniform float uScale; uniform float uGlow; uniform float uH;
attribute vec3 aCol; attribute float aSize; attribute float aAlpha; attribute float aShape; attribute float aRot; attribute float aCap;
varying vec3 vCol; varying float vAlpha; varying float vShape; varying float vRot;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float px = aSize * 2.0 * uScale / max(0.05, -mv.z), a = aAlpha;
  if (uGlow > 0.5) { px *= 3.0; a *= aShape > 1.5 ? 0.0 : 0.22; }
  if (px < 1.8) { a *= (px / 1.8) * (px / 1.8); px = 1.8; }   // hạt xa nhỏ hơn một điểm ảnh: giữ cỡ, giảm độ đậm
  gl_PointSize = min(px, uH * aCap * (uGlow > 0.5 ? 2.0 : 1.0));   // cỡ tối đa theo từng hạt (phần chiều cao ảnh)
  vCol = aCol; vAlpha = a; vShape = aShape; vRot = aRot;
}`;
const FS = /* glsl */ `
uniform float uGlow;
varying vec3 vCol; varying float vAlpha; varying float vShape; varying float vRot;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  if (uGlow > 0.5) { float g = 1.0 - length(p); if (g <= 0.0) discard; gl_FragColor = vec4(vCol, vAlpha * g * g); }
  else {
    float c = cos(vRot), s = sin(vRot); vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    float d = vShape < 0.5 ? length(q) : vShape < 1.5 ? abs(q.x) + abs(q.y) : length(vec2(q.x, q.y * 1.9));   // tròn, thoi, lá
    float e = 1.0 - smoothstep(0.6, 1.0, d); if (e <= 0.0) discard;
    gl_FragColor = vec4(vCol, vAlpha * e);
  }
  #include <colorspace_fragment>
}`;
const taoLop = () => {
  const g = new THREE.BufferGeometry(), at = (n: number) => new THREE.BufferAttribute(new Float32Array(MAX * n), n).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', at(3)); g.setAttribute('aCol', at(3)); g.setAttribute('aSize', at(1)); g.setAttribute('aAlpha', at(1)); g.setAttribute('aShape', at(1)); g.setAttribute('aRot', at(1)); g.setAttribute('aCap', at(1));
  g.setDrawRange(0, 0);
  const mat = (glow: boolean) => new THREE.ShaderMaterial({vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: true, toneMapped: false, fog: false,
    blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: {uScale: {value: 1}, uGlow: {value: glow ? 1 : 0}, uH: {value: 720}}});
  const mk = (glow: boolean) => { const p = new THREE.Points(g, mat(glow)); p.frustumCulled = false; p.renderOrder = glow ? 5 : 6; p.matrixAutoUpdate = false; p.matrixWorldAutoUpdate = false; p.userData.noRecv = true; p.raycast = () => {}; return p; };
  return {g, loi: mk(false), quang: mk(true)};
};

// ---------------------------------------------------------------- nơi và giờ của lớp nền
type Nen = {noi: NoiBui | 'khong'; gio: GioBui};
const docNen = (grade: Grade, haze: THREE.Color | null): Nen => {
  const nb = noiBuiHienTai(), trong = grade === 'darkInterior' || grade === 'brightInterior';
  const hz = haze ? {r: haze.r, b: haze.b, l: 0.2126 * haze.r + 0.7152 * haze.g + 0.0722 * haze.b} : {r: 0.5, b: 0.5, l: 0.5};
  const gio: GioBui = nb.daDat && nb.gio ? nb.gio : grade === 'nightExterior' ? 'dem' : grade === 'darkInterior' ? (hz.l < 0.05 ? 'dem' : 'chang-vang')
    : grade === 'lateDay' ? (hz.r - hz.b > 0.18 ? 'chang-vang' : 'ngay') : grade === 'snowExterior' ? 'dem' : 'ngay';
  const noi: Nen['noi'] = nb.daDat ? nb.noi : trong ? 'trong-nha' : grade === 'snowExterior' ? 'tuyet' : 'ngoai-troi';
  return {noi: noi === 'tuyet' || noi === 'vu-tru' ? 'khong' : noi, gio};
};

// ---------------------------------------------------------------- BuiNguon
/** Vẽ hạt cho mọi nguồn đã đăng ký trong cảnh của canvas này, cộng lớp nền rất thưa theo nơi và giờ. StageCam tự đặt. */
export const BuiNguon: React.FC = () => {
  const khoa = useBuiKhoa(), ctx = useContext(BuiNguonCtx), gradeCtx = useContext(GradeCtx), f = useCurrentFrame();
  const {scene, camera, gl} = useThree();
  const lop = useMemo(taoLop, []);
  const tat = khoa || !ctx.bat;
  useLayoutEffect(() => {
    if (tat) return;
    tinhHat(lop, f, scene, camera as THREE.PerspectiveCamera, gl, gradeCtx, ctx.k ?? 1);
  });
  useLayoutEffect(() => () => { lop.g.dispose(); (lop.loi.material as THREE.Material).dispose(); (lop.quang.material as THREE.Material).dispose(); }, [lop]);
  if (tat) return null;
  return <><primitive object={lop.loi} /><primitive object={lop.quang} /></>;
};

const V = () => new THREE.Vector3();
const tmp = {a: V(), b: V(), c: V(), s: V(), q: new THREE.Quaternion(), ray: new THREE.Raycaster(), buf: new THREE.Vector2(), col: new THREE.Color()};
const C = (h: string) => new THREE.Color(h);
const BE = [C('#d9c9a8'), C('#cdbb98'), C('#e6d8b8')], AM_NANG = C('#f2e4c2'), LANH = [C('#c8d0ea'), C('#d8dcf0')], VANG_NEN = [C('#ffe49a'), C('#ffd36e'), C('#fff1c4')];
const LA = [C('#a8b832'), C('#d0a23a'), C('#c27a34')]   /* lá non vàng chanh, lá úa vàng, nâu cam: lá xanh đậm lẫn vào cỏ cây */, PHAN = [C('#f2c45a'), C('#ffd36e'), C('#e6b450')], DOM = C('#f4f08a'), CAT = [C('#d8b98f'), C('#c7a27c')], MAY = [C('#fff5ea'), C('#ffeeda')];
const TAN = [C('#fff0b0'), C('#ffc060'), C('#ff8a3a'), C('#d8502a')];

function tinhHat(lop: ReturnType<typeof taoLop>, f: number, scene: THREE.Scene, cam: THREE.PerspectiveCamera, gl: THREE.WebGLRenderer, gradeCtx: Grade, kChung: number) {
  // 0. ma trận thế giới: ở khung đầu tiên của một trang (ảnh tĩnh) cảnh chưa vẽ lần nào, phải tự cập nhật trước khi lấy toạ độ và thử nắng
  scene.updateMatrixWorld(true);
  // 1. dấu của các nguồn trong cảnh (bỏ qua món đang ẩn)
  const raw: Nguon[] = []; let coKhi = false, troi: Grade | null = null, mauCanh: KieuBui | string[] | null = null, damCanh = false;
  scene.traverseVisible((o) => {
    const u = o.userData; if (!u) return;
    if (u.buiKhi) coKhi = true;
    if (u.buiTroi) troi = u.buiTroi as Grade;
    if (u.buiMau) { mauCanh = u.buiMau as KieuBui | string[]; damCanh = damCanh || !!u.buiDam; }
    const b = u.buiNguon as Omit<NguonBuiProps, 'pos'> | undefined; if (!b) return;
    o.updateWorldMatrix(true, false); o.matrixWorld.decompose(tmp.a, tmp.q, tmp.s);
    const sc = (Math.abs(tmp.s.x) + Math.abs(tmp.s.y)) / 2, p = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const n: Nguon = {kieu: b.kieu, p, mau: new THREE.Color(b.mau ?? (b.kieu === 'lua' ? '#ff9a4a' : b.kieu === 'nen' ? '#ffd27a' : '#ffffff')), r: (b.r ?? 0.6) * sc, w: (b.w ?? 0.3) * sc, k: (b.k ?? 1) * kChung, uu: b.uuTien ?? 2, h: (b.h ?? 1.7) * sc,
      bang: (b.bang ?? [b.mau ?? '#ffffff']).map((x) => new THREE.Color(x))};
    if (n.kieu === 'lua' && n.w < 0.15) { n.kieu = 'nen'; n.p.y += n.w * 0.5; }   // ngọn nhỏ (nến): vài hạt quanh ngọn, không tàn lửa
    if (b.kieu === 'nang' && b.tu && b.toi) { const par = o.parent ?? o; n.tu = par.localToWorld(new THREE.Vector3(...b.tu)); n.toi = par.localToWorld(new THREE.Vector3(...b.toi)); }
    if (n.k > 0) raw.push(n);
  });
  // 2. nguồn đoán từ quầng nhường nguồn thật ở gần; nguồn cùng loại sát nhau gộp lại (một chùm nến là một nguồn dày hơn)
  const that = raw.filter((n) => n.uu >= 2 && n.kieu !== 'nang');
  const ds: Nguon[] = [];
  raw.forEach((n) => {
    if (n.uu < 2 && that.some((t) => t.p.distanceTo(n.p) < Math.max(0.9, n.r * 0.8, t.r))) return;
    const gan = n.kieu === 'nang' || n.kieu === 'phep' || n.kieu === 'la' || n.kieu === 'phan-hoa' || n.kieu === 'hat-co' ? undefined : ds.find((d) => d.kieu === n.kieu && d.p.distanceTo(n.p) < (n.kieu === 'nen' ? 0.7 : 0.8));
    if (gan) { gan.k = Math.min(gan.k + n.k * 0.35, 2.2); gan.r = Math.max(gan.r, n.r); gan.w = Math.max(gan.w, n.w); return; }
    ds.push(n);
  });

  // 3. máy: điểm (u, v) trên khung ở độ sâu d; độ sâu của một điểm
  cam.updateMatrixWorld(); const eye = cam.getWorldPosition(V()), fwd = cam.getWorldDirection(V());
  const diemKhung = (u: number, v: number, d: number) => { const p = V().set(u * 2 - 1, v * 2 - 1, 0.5).unproject(cam).sub(eye).normalize(); return p.multiplyScalar(d / Math.max(0.2, p.dot(fwd))).add(eye); };
  const sau = (p: THREE.Vector3) => tmp.c.copy(p).sub(eye).dot(fwd);
  const trongKhung = (p: THREE.Vector3) => { const q = tmp.c.copy(p).project(cam); return q.z < 1 && Math.abs(q.x) < 1.08 && Math.abs(q.y) < 1.08; };

  // 4. ghi hạt
  const g = lop.g, P = g.attributes.position.array as Float32Array, CO = g.attributes.aCol.array as Float32Array, SZ = g.attributes.aSize.array as Float32Array,
    AL = g.attributes.aAlpha.array as Float32Array, SH = g.attributes.aShape.array as Float32Array, RO = g.attributes.aRot.array as Float32Array, CP = g.attributes.aCap.array as Float32Array;
  let n = 0;
  const day = (p: THREE.Vector3, c: THREE.Color, r: number, a: number, hinh = 0, rot = 0, sang = 1, cap = 0.015) => {
    if (n >= MAX || a <= 0.01) return;
    const d = sau(p); if (d < 0.3) return;
    a *= sm(1.3, 2.4, d);   // gần máy thì mờ đi, không thành đốm to trước ống kính
    if (a <= 0.01) return;
    P[n * 3] = p.x; P[n * 3 + 1] = p.y; P[n * 3 + 2] = p.z; CO[n * 3] = c.r * sang; CO[n * 3 + 1] = c.g * sang; CO[n * 3 + 2] = c.b * sang;
    SZ[n] = r; AL[n] = Math.min(1, a); SH[n] = hinh; RO[n] = rot; CP[n] = cap; n++;
  };
  const sec = f / 24;

  // vật che nắng: khối đặc đổ hoặc nhận bóng (VSM vẽ cả vật nhận bóng vào bản đồ bóng); bỏ tấm trong suốt: lá cắt giấy, tấm dán, hạt)
  const nangs = ds.filter((d) => d.kieu === 'nang' && d.tu && d.toi);
  const che: THREE.Object3D[] = [];
  if (nangs.length) {
    scene.traverseVisible((o) => { const m = o as THREE.Mesh; if (!m.isMesh || !(m.castShadow || m.receiveShadow)) return; const mt = m.material as THREE.Material | THREE.Material[]; if ((Array.isArray(mt) ? mt : [mt]).some((x) => x.transparent)) return; che.push(m); });
  }
  const ray = tmp.ray; ray.far = 80;
  const coNang = (p: THREE.Vector3, huong: THREE.Vector3) => { ray.set(p, huong); return ray.intersectObjects(che, false).length === 0; };

  const nen = docNen(troi ?? gradeCtx, scene.background instanceof THREE.Color ? scene.background : null);
  const ngoai = nen.noi !== 'trong-nha';

  // ---- 'nang': bụi be ấm chỉ trong khối nắng; trôi rất chậm; sáng lên khi đi qua chỗ nắng, lấp lánh
  nangs.forEach((s, si) => {
    // ánh trăng (màu lạnh): ít hạt và nhạt hơn nhiều, không thì chấm trắng rải khắp đọc thành tuyết (Daniel: "bụi trắng là tuyết")
    const lanh = s.mau.b > s.mau.r, huong = s.tu!.clone().sub(s.toi!).normalize(), mau = AM_NANG.clone().lerp(s.mau, lanh ? 0.6 : 0.35);
    if (lanh && !ngoai) return;   // trăng trong nhà: không bụi (Daniel 25/11)
    const N = Math.round(110 * s.k * (ngoai ? 0.3 : 1) * (coKhi ? 0.5 : 1) * (lanh ? 0.35 : 1));
    for (let i = 0; i < N; i++) {
      const {u, n: dn, a} = doi(f, i, 101 + si * 7, 260), sd = dn * 13 + i;
      // chỗ sinh: thử sáu chỗ trong khung (độ sâu 2-10 m, quanh chỗ nắng rơi), lấy chỗ đầu tiên có nắng
      let p0: THREE.Vector3 | null = null;
      for (let t = 0; t < 6 && !p0; t++) {
        const q = diemKhung(0.04 + 0.92 * hs(sd, t, 3), 0.06 + 0.88 * hs(sd, t, 4), 2 + 8 * hs(sd, t, 5));
        if (q.distanceTo(s.toi!) < 9 && coNang(q, huong)) p0 = q;
      }
      if (!p0) continue;
      const vx = (hs(sd, 6) - 0.5) * 0.05, vy = (hs(sd, 7) - 0.45) * 0.03, vz = (hs(sd, 8) - 0.5) * 0.04, ph = hs(sd, 9) * 6.28, t = a / 24;
      const p = V().set(p0.x + vx * t + Math.sin(sec * 0.5 + ph) * 0.03, p0.y + vy * t + Math.sin(sec * 0.37 + ph * 2) * 0.025, p0.z + vz * t);
      if (!coNang(p, huong)) continue;   // trôi ra khỏi vệt nắng thì tắt (không có ánh thì không thấy bụi)
      const lap = 0.7 + 0.3 * Math.pow(Math.max(0, Math.sin(sec * (1.2 + hs(sd, 10)) + ph)), 6) * 2;   // lấp lánh: thỉnh thoảng loé
      const thoi = hs(sd, 11) < 0.3;
      day(p, mau, (0.008 + 0.01 * hs(sd, 12)) * (thoi ? 1.5 : 1), (lanh ? 0.55 : 0.85) * moVaoRa(u, 0.12, 0.2) * lap, thoi ? 1 : 0, ph + sec * 0.8, lanh ? 0.9 : 1.12);
    }
  });

  // ---- 'lua': tàn lửa cam bốc lên từ nguồn, lắc theo gió, nhạt dần rồi tắt; chỉ trong vài mét quanh lửa
  ds.filter((d) => d.kieu === 'lua').forEach((s, si) => {
    const w = Math.min(1.6, Math.max(0.15, s.w)), N = Math.min(22, Math.round((4 + 7 * w) * s.k));
    for (let i = 0; i < N; i++) {
      const {u, n: dn} = doi(f, i, 211 + si * 5, 40 + 22 * w), sd = dn * 17 + i;
      const ang = hs(sd, 1) * 6.28, rr = Math.sqrt(hs(sd, 2)) * 0.28 * w, len = (0.7 + 1.5 * w) * (0.55 + 0.45 * hs(sd, 3)), ph = hs(sd, 4) * 6.28;
      const lac = Math.sin(u * 7 + ph) * (0.06 + 0.12 * w) * u, gio = 0.18 * w * u;
      const p = V().set(s.p.x + Math.cos(ang) * rr + lac + gio, s.p.y + 0.3 * w + len * u, s.p.z + Math.sin(ang) * rr * 0.6 + 0.05);
      const k = Math.min(TAN.length - 1.001, u * 3.2), c = tmp.col.copy(TAN[Math.floor(k)]).lerp(TAN[Math.floor(k) + 1], k % 1);
      day(p, c, (0.012 + 0.012 * hs(sd, 5)) * (0.7 + 0.3 * w) * (1 - 0.55 * u), sm(0, 0.08, u) * Math.pow(1 - u, 1.2) * (0.75 + 0.25 * Math.sin(f * 0.9 + ph)), 0, 0, 1.15);
    }
  });

  // ---- 'nen': vài hạt vàng ấm lơ lửng sát ngọn lửa
  ds.filter((d) => d.kieu === 'nen').forEach((s, si) => {
    const N = Math.min(7, Math.round(3 * s.k));
    for (let i = 0; i < N; i++) {
      const {u, n: dn, a} = doi(f, i, 307 + si * 3, 130), sd = dn * 19 + i, R = 0.1 + 0.2 * hs(sd, 1), ph = hs(sd, 2) * 6.28, t = a / 24;
      const p = V().set(s.p.x + Math.cos(ph + t * 0.5) * R, s.p.y + 0.06 + R * 0.6 * hs(sd, 3) + t * 0.025 + Math.sin(t * 0.9 + ph) * 0.02, s.p.z + Math.sin(ph + t * 0.5) * R * 0.5 + 0.04);
      day(p, VANG_NEN[sd % 3], 0.006 + 0.004 * hs(sd, 4), 0.85 * moVaoRa(u, 0.2, 0.3), 0, 0, 1.1);
    }
  });

  // ---- 'den': bụi mịn trong quầng đèn, sáng hơn khi gần bóng đèn
  ds.filter((d) => d.kieu === 'den').forEach((s, si) => {
    const R = Math.min(2.2, Math.max(0.45, s.r * 1.1)), N = Math.min(12, Math.round((4 + 3 * R) * s.k)), mau = s.mau.clone().lerp(C('#ffffff'), 0.45);
    for (let i = 0; i < N; i++) {
      const {u, n: dn, a} = doi(f, i, 401 + si * 11, 200), sd = dn * 23 + i, t = a / 24;
      const th = hs(sd, 1) * 6.28, ph = Math.acos(2 * hs(sd, 2) - 1), rr = R * Math.cbrt(hs(sd, 3));
      const p = V().set(s.p.x + rr * Math.sin(ph) * Math.cos(th) + Math.sin(t * 0.4 + th) * 0.05, s.p.y + rr * Math.cos(ph) + t * 0.01 + Math.sin(t * 0.3 + th) * 0.04, s.p.z + rr * Math.sin(ph) * Math.sin(th) * 0.6);
      const gan = 1 - Math.min(1, p.distanceTo(s.p) / R);
      day(p, mau, 0.005 + 0.005 * hs(sd, 4), 0.9 * moVaoRa(u) * (0.25 + 0.75 * gan * gan), 0, 0, 1.1);
    }
  });

  // ---- 'phep': hạt màu theo màu nguồn, quấn quanh nguồn rồi bốc lên
  // nhiều quầng phép sát nhau (các cuộn dây quanh vòng máy): mỗi quầng giữ hạt của nó (không gộp), số hạt chia theo căn số quầng
  const pheps = ds.filter((d) => d.kieu === 'phep'), chia = Math.sqrt(Math.max(1, pheps.length));
  pheps.forEach((s, si) => {
    const R = Math.min(2.5, Math.max(0.35, s.r)), N = Math.min(20, Math.max(4, Math.round(((8 + 5 * R) * s.k) / chia * 2.4))), mau = s.mau.clone().lerp(C('#ffffff'), 0.15);
    // màu đậm cùng sắc với nguồn: đọc được trên nền sáng chính màu đó (nền xanh sáng của máy làm hạt nhạt chìm mất)
    const hsl = {h: 0, s: 0, l: 0}; s.mau.getHSL(hsl); const dam = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.1 + 0.1), 0.38);
    for (let i = 0; i < N; i++) {
      const {u, n: dn, a} = doi(f, i, 503 + si * 13, 96), sd = dn * 29 + i, t = a / 24, chieu = hs(sd, 1) < 0.5 ? 1 : -1;
      const rr = R * (0.45 + 0.6 * hs(sd, 2)) * (1 - 0.35 * u), goc = hs(sd, 3) * 6.28 + chieu * t * (0.8 + 0.6 * hs(sd, 4)), nghieng = (hs(sd, 5) - 0.5) * 0.9;
      // nửa trước của nguồn (vật phát sáng thường che nửa sau)
      const p = V().set(s.p.x + Math.cos(goc) * rr, s.p.y + Math.sin(goc) * rr * nghieng + (u - 0.3) * R * 0.7, s.p.z + 0.08 + Math.abs(Math.sin(goc)) * rr * 0.5);
      // đậm hơn (Daniel 25/11): hạt to hơn, đặc, lõi sáng; một phần ba là lõi gần trắng để còn đọc được trên nền xanh sáng
      const thoi = hs(sd, 6) < 0.4, q = hs(sd, 7), c = q < 0.2 ? C('#ffffff').lerp(mau, 0.3) : q < 0.7 ? dam : mau;
      day(p, c, (0.013 + 0.012 * hs(sd, 8)) * (thoi ? 1.4 : 1), moVaoRa(u, 0.12, 0.3) * (0.85 + 0.15 * Math.sin(f * 0.5 + i)), thoi ? 1 : 0, goc * 2, 1.3);
    }
  });

  // ---- cây, hoa, cỏ ngoài trời: lá rơi từ tán, phấn / cánh hoa bay lên sát bụi hoa, hạt cỏ trôi ngang. Chỉ nguồn gần (< 40 m) và trong khung;
  // gần trước, mỗi loại có trần số hạt.
  const ngoaiTroi = nen.noi !== 'trong-nha' && nen.noi !== 'khong';
  const thay = (d: Nguon) => { const q = tmp.c.set(d.p.x, d.p.y + d.h * 0.5, d.p.z).project(cam); return q.z < 1 && Math.abs(q.x) < 1.25 && Math.abs(q.y) < 1.4; };
  const cays = ngoaiTroi ? ds.filter((d) => (d.kieu === 'la' || d.kieu === 'phan-hoa' || d.kieu === 'hat-co') && d.p.distanceTo(eye) < 40 && thay(d)).sort((a, b) => a.p.distanceTo(eye) - b.p.distanceTo(eye)) : [];
  const tran: Record<KieuCay, number> = {la: 26, 'phan-hoa': 30, 'hat-co': 12}, dem: Record<KieuCay, number> = {la: 0, 'phan-hoa': 0, 'hat-co': 0};
  cays.forEach((s, si) => {
    const kc = s.kieu as KieuCay, r = Math.max(0.15, s.r), h = Math.max(0.2, s.h), vung = s.w > 0.5;   // vung: Scatter đồng cỏ (r, w = nửa bề ngang, nửa bề sâu); cây, hoa, bụi cỏ lẻ đăng ký w = 0
    let N = kc === 'la' ? Math.min(6, Math.max(2, Math.round(1 + r * 1.2))) : kc === 'phan-hoa' ? Math.min(8, Math.max(4, Math.round(3 + r * 3))) : vung ? Math.min(8, Math.max(3, Math.round((r * s.w) / 4))) : 1;
    N = Math.min(Math.round(N * s.k), tran[kc] - dem[kc]); if (N <= 0) return; dem[kc] += N;
    for (let i = 0; i < N; i++) {
      if (kc === 'la') {   // lá cùng màu tán, rơi chậm từ dưới tán xuống đất, lắc và xoay
        const {u, n: dn, a} = doi(f, i, 901 + si * 7, 210), sd = dn * 43 + i, t = a / 24, ph = hs(sd, 1) * 6.28, y0 = h * (0.42 + 0.4 * hs(sd, 2));
        const p = V().set(s.p.x + (hs(sd, 3) - 0.5) * 1.5 * r + Math.sin(t * 1.3 + ph) * 0.22 * (0.4 + 0.6 * u) + 0.06 * t, s.p.y + y0 * (1 - 0.96 * u), s.p.z + 0.15 + 0.5 * hs(sd, 4));
        // cùng họ màu tán nhưng sáng hơn hoặc ngả vàng: đúng màu tán thì lá lẫn vào tán và cỏ
        const q = hs(sd, 5), c = tmp.col.copy(s.bang[sd % s.bang.length]); if (q < 0.45) c.lerp(C('#e8f0a0'), 0.4); else if (q < 0.8) c.lerp(C('#d8a83a'), 0.6); else c.lerp(C('#ffffff'), 0.2);
        day(p, c, 0.055 + 0.025 * hs(sd, 6), moVaoRa(u, 0.06, 0.12), 2, ph + t * 2.4 * (hs(sd, 7) < 0.5 ? 1 : -1), 1, 0.036);
      } else if (kc === 'phan-hoa') {   // phấn và cánh hoa nhỏ cùng màu hoa bay lên lững lờ sát bụi hoa
        const {u, n: dn, a} = doi(f, i, 951 + si * 5, 130), sd = dn * 47 + i, t = a / 24, ph = hs(sd, 1) * 6.28, canh = hs(sd, 2) < 0.3;
        const p = V().set(s.p.x + (hs(sd, 3) - 0.5) * 1.5 * r + Math.sin(t * 0.9 + ph) * 0.08, s.p.y + h * (0.35 + 0.5 * hs(sd, 4)) + u * 0.55 + Math.sin(t * 1.1 + ph) * 0.04, s.p.z + 0.1 + 0.3 * hs(sd, 5));
        day(p, s.bang[sd % s.bang.length], (0.017 + 0.009 * hs(sd, 6)) * (canh ? 1.6 : 1), moVaoRa(u, 0.18, 0.3), canh ? 2 : 0, ph + t * 1.5, 1.1, 0.024);
      } else {   // hạt cỏ, bồ công anh trắng ngà trôi ngang theo gió
        const {u, n: dn, a} = doi(f, i, 991 + si * 3, 190), sd = dn * 53 + i, t = a / 24, ph = hs(sd, 1) * 6.28;
        const x0 = s.p.x + (hs(sd, 2) - 0.5) * 2 * (vung ? r : r * 0.6), z0 = s.p.z + (vung ? (hs(sd, 3) - 0.5) * 2 * s.w : 0.1);
        const p = V().set(x0 + 0.26 * t + Math.sin(t * 0.7 + ph) * 0.06, s.p.y + (vung ? 0.25 + 0.6 * hs(sd, 4) : h * (0.7 + 0.4 * hs(sd, 4))) + 0.05 * t + Math.sin(t * 0.8 + ph) * 0.08, z0);
        day(p, s.bang[sd % s.bang.length], 0.016 + 0.006 * hs(sd, 5), 0.9 * moVaoRa(u, 0.15, 0.25), 0, 0, 1.1, 0.022);
      }
    }
  });

  // ---- lớp nền theo nơi và giờ (rất thưa; tắt khi cảnh đã có lớp hạt riêng hoặc ở nơi tuyết, vũ trụ).
  // Màu theo cảnh: <MauBuiCanh> của cảnh quay > kieu của datNoiBui > màu mặc định theo nơi và giờ. 'khong' tắt lớp nền.
  const nbu = noiBuiHienTai(), kieuCanh: KieuBui | string[] | null = mauCanh ?? (nbu.daDat && nbu.kieu ? nbu.kieu : null);
  const bangCanh = Array.isArray(kieuCanh) ? kieuCanh.map(C) : kieuCanh && kieuCanh !== 'khong' ? MAU_BUI[kieuCanh].map(C) : null;
  if (kieuCanh !== 'khong' && bangCanh && (mauCanh || !coKhi) && (damCanh || nen.noi !== 'khong')) {
    // lớp nền có màu chỉ định (như bụi khí của chương 15-17): thưa, hạt nhỏ, hai phần năm hình thoi; sinh trong 2-6 m trước máy.
    // Cảnh signature (BuiNhanVat): dày như các cảnh Purple Man của doom-1, 15-25 hạt thấy được mỗi khung, hạt lớn hơn một chút.
    const N = damCanh ? 30 : nen.noi === 'trong-nha' ? 16 : 12, to = damCanh ? 1.3 : 1;
    for (let i = 0; i < N; i++) {
      const {u, n: dn, a} = doi(f, i, 801, 200), sd = dn * 41 + i, t = a / 24, ph = hs(sd, 1) * 6.28;
      const p = diemKhung(0.05 + 0.9 * hs(sd, 2), 0.08 + 0.84 * hs(sd, 3), 2 + 4 * hs(sd, 4))   /* 2-6 m trước máy như BuiKhi: ở xa tường che mất */.add(V().set(0.03 * t + Math.sin(t * 0.6 + ph) * 0.05, 0.01 * t + Math.sin(t * 0.45 + ph * 2) * 0.04, 0));
      if (!trongKhung(p)) continue;
      const thoi = i % 5 < 2;
      day(p, bangCanh[sd % bangCanh.length], (0.007 + 0.006 * hs(sd, 5)) * (thoi ? 1.6 : 1) * to, 0.85 * moVaoRa(u, 0.2, 0.3), thoi ? 1 : 0, ph + t * 0.5, 1.1);
    }
  } else if (!coKhi && nen.noi !== 'khong' && kieuCanh !== 'khong') {
    type Lop = {N: number; mau: THREE.Color[]; r: [number, number]; a: number; hinh?: number; gio?: [number, number]; dom?: boolean; sang?: number; xa?: number; cap?: number};
    const L: Lop[] = [];
    if (nen.noi === 'trong-nha') L.push({N: nangs.length ? 3 : 6, mau: nen.gio === 'dem' ? LANH : BE, r: [0.006, 0.011], a: nen.gio === 'dem' ? 0.45 : 0.6});
    else if (nen.noi === 'battleworld') L.push({N: 9, mau: CAT, r: [0.008, 0.014], a: 0.7, gio: [0.25, 0.02]});
    else if (nen.noi === 'tren-may') L.push({N: 5, mau: MAY, r: [0.008, 0.013], a: 0.6});
    else if (nen.gio === 'ngay') { /* ngoài trời ban ngày: không có lớp chung (Daniel 25/11: hạt phấn lơ lửng không gắn nguồn nào thì bỏ); lá, phấn, hạt cỏ đến từ cây, hoa, cỏ */ }
    else if (nen.gio === 'chang-vang') { L.push({N: 6, mau: [C('#ffd9a0'), C('#ffe6c0')], r: [0.008, 0.013], a: 0.65}); L.push({N: 5, mau: [DOM], r: [0.012, 0.018], a: 1, dom: true, sang: 1.2}); }
    else L.push({N: 7, mau: LANH, r: [0.007, 0.012], a: 0.5});
    L.forEach((l, li) => {
      for (let i = 0; i < l.N; i++) {
        const {u, n: dn, a} = doi(f, i, 601 + li * 31, l.dom ? 150 : 220), sd = dn * 31 + i, t = a / 24, ph = hs(sd, 1) * 6.28;
        // đom đóm ở thấp (dưới tầm mắt), hạt khác rải trong khung ở độ sâu 2,5-13 m
        const p0 = diemKhung(0.05 + 0.9 * hs(sd, 2), l.dom ? 0.08 + 0.4 * hs(sd, 3) : 0.08 + 0.84 * hs(sd, 3), 2.5 + (l.xa ?? 10.5) * hs(sd, 4));
        const gx = l.gio ? l.gio[0] : 0.03, gy = l.gio ? l.gio[1] : 0.008;
        const p = p0.add(V().set(gx * t + Math.sin(t * 0.6 + ph) * 0.06, gy * t + Math.sin(t * 0.45 + ph * 2) * 0.045, Math.sin(t * 0.3 + ph) * 0.04));
        if (!trongKhung(p)) continue;
        let al = l.a * moVaoRa(u, 0.2, 0.3); if (l.dom) al *= Math.pow(Math.max(0, Math.sin(a * 0.11 + ph)), 2);
        day(p, l.mau[sd % l.mau.length], l.r[0] + (l.r[1] - l.r[0]) * hs(sd, 5), al, l.hinh ?? 0, l.hinh === 2 ? ph + t * 2.2 : 0, l.sang ?? 1, l.cap ?? 0.015);
      }
    });
  }

  // 5. đưa lên GPU
  g.setDrawRange(0, n);
  ['position', 'aCol', 'aSize', 'aAlpha', 'aShape', 'aRot', 'aCap'].forEach((k) => { (g.attributes[k] as THREE.BufferAttribute).needsUpdate = true; });
  // cỡ tối đa của lõi (aCap, mặc định 1,5% chiều cao ảnh) và quầng (gấp đôi): hạt gần máy không thành đốm mờ to
  gl.getDrawingBufferSize(tmp.buf);
  const scale = cam.projectionMatrix.elements[5] * tmp.buf.y * 0.5;
  [lop.loi, lop.quang].forEach((o, k) => { const m = o.material as THREE.ShaderMaterial; m.uniforms.uScale.value = scale; m.uniforms.uH.value = tmp.buf.y; });
}
