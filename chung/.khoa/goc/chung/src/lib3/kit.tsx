import React, {useMemo, useContext, useLayoutEffect} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {useCurrentFrame} from 'remotion';
import {FacetLathe, Halo, tuPhiaMay, BONG_MAC_DINH} from './look';
import {Sprite, VIEW, rnd, Ctx, ShotCtx, RiseCtx} from './depth';
import {XoayCtx, NgocCtx, NangCtx, MayCtx} from './duongMay';
import {useBui, useBuiKhi} from './mauBui';
import {BuiNguon, NguonBui, DaCoKhi} from './buiNguon';

/** lib3/kit: the BUILT pieces every scene can call (boxes that take the light and cast shadows), and the stage camera.
 *  They were first written inside the sample scenes (valley, camp, village); a scene file should only hold its own layers and
 *  layout. Each piece follows the detail standard of CACH-DUNG-CANH-XEP-LOP.md: three tones, a secondary structure, one trace
 *  of life, nothing perfectly regular. */
type V3 = [number, number, number];
/** A box: position, size, colour, optional rotation; cast / recv switch its shadow off for thin trim. */
export const B: React.FC<{p: V3; s: V3; c: string; r?: V3; cast?: boolean; recv?: boolean}> = ({p, s, c, r, cast = true, recv = true}) => <mesh position={p} rotation={r} castShadow={cast} receiveShadow={recv} userData={{noRecv: !recv}}><boxGeometry args={s} /><meshLambertMaterial color={c} /></mesh>;
/** Bật nhận bóng cho mọi mesh đặc nhận sáng (Lambert, Phong, Standard, Toon). three.js để receiveShadow TẮT mặc định: mesh quên
 *  bật thì bóng của vật khác không hiện trên nó mà không báo lỗi, mặt tường, sàn trông phẳng như giấy dán. Bỏ qua: mesh đã nhận
 *  bóng, mesh có userData.noRecv (helper tắt nhận bóng phải gắn cờ này), tấm trong suốt không ghi chiều sâu (mảnh cắt giấy, Sprite,
 *  tấm dán: chúng tự quyết bóng). Lưu ý VSMShadowMap vẽ cả vật nhận bóng vào bản đồ bóng, nên vật được bật cũng che nắng. */
/** MÉP BÓNG MỀM: bề rộng dải nhoè ở mép bóng, tính bằng CM THẬT trên mặt đất (Daniel chốt 6 cm ngày 25/11/2026, sau khi so với video gốc:
 *  video gốc 0/109 cảnh có bóng cứng). three đo `shadow.radius` bằng số Ô của bản đồ bóng, nên cùng một con số cho ra độ nhoè khác nhau ở
 *  mỗi đèn: đèn nắng (`Sun`) 4096 ô phủ 18 m, mỗi ô 4,4 mm, radius 1,1 chỉ là 0,5 cm (mép cắt dao). Ở đây mọi đèn song song và đèn chiếu có
 *  đổ bóng được đặt lại radius = MEP_BONG_CM / cỡ ô, mỗi lần dựng (cùng chỗ với `autoReceive`), nên cảnh nào, kênh nào cũng ra cùng một độ mềm.
 *  KHÔNG tự đặt `shadow-radius` ở cảnh và không vá three ở kênh (kiem_bong.py báo `bong-va`). Đèn thật sự cần mức riêng: `userData.bongRieng = true`. */
export const MEP_BONG_CM = 6;
/** Dựng với biến môi trường REMOTION_SOI_BONG=luat-cu để tắt cả ba điều của luật bóng (mép 6 cm, gộp vệt, bẻ hướng): chỉ dùng để làm ảnh TRƯỚC khi so. */
const LUAT_CU = typeof process !== 'undefined' && process.env.REMOTION_SOI_BONG === 'luat-cu';
const mepBong = (l: THREE.Light) => {
  const sh = (l as THREE.DirectionalLight).shadow;
  if (!l.castShadow || !sh || l.userData?.bongRieng) return;
  let rong = 0;   // bề ngang (m) mà bản đồ bóng phủ
  if ((l as THREE.DirectionalLight).isDirectionalLight) { const c = sh.camera as THREE.OrthographicCamera; rong = c.right - c.left; }
  else if ((l as THREE.SpotLight).isSpotLight) { const sp = l as THREE.SpotLight, d = sp.position.distanceTo(sp.target.position) || 5; rong = 2 * d * Math.tan(Math.min(1.45, sp.angle)); }
  if (!(rong > 0)) return;
  const r = MEP_BONG_CM / 100 / (rong / sh.mapSize.x);
  sh.radius = r; sh.blurSamples = Math.min(64, Math.max(12, Math.round(r * 1.2)));
};
/** MỖI CHỖ MỘT VỆT BÓNG VẼ (Daniel 25/11/2026: "bóng thì một cục tròn dưới chân", "lỗi bóng bị mấy cái đè nhau"). Vệt tiếp đất (`ContactShade`,
 *  gắn `userData.vetBong` = bán kính) của người và đồ có sẵn; đặt thêm một vệt chồng lên thì thành cục đen. Ở đây: vệt nào có tâm nằm trong lõi
 *  (60 % bán kính) của một vệt to hơn cùng mặt đất thì bị ẩn, nên chồng mấy vệt cũng chỉ còn một. */
const _p = new THREE.Vector3(), _s = new THREE.Vector3();
const hienThat = (o: THREE.Object3D) => { for (let x: THREE.Object3D | null = o.parent; x; x = x.parent) if (!x.visible) return false; return true; };
const gopVetBong = (ds: THREE.Mesh[]) => {
  const a = ds.filter(hienThat).map((m) => { m.visible = true; m.getWorldPosition(_p); m.getWorldScale(_s); const r = m.userData.vetBong as number; return {m, x: _p.x, y: _p.y, z: _p.z, rx: r * _s.x, rz: r * _s.y}; })
    .sort((p, q) => q.rx * q.rz - p.rx * p.rz);
  for (let i = 0; i < a.length; i++) {
    const A = a[i]; if (!A.m.visible || !(A.rx > 0 && A.rz > 0)) continue;
    for (let j = i + 1; j < a.length; j++) {
      const B = a[j]; if (!B.m.visible || Math.abs(A.y - B.y) > 0.08) continue;
      const dx = (B.x - A.x) / (A.rx * 0.6), dz = (B.z - A.z) / (A.rz * 0.6);
      if (dx * dx + dz * dz < 1) B.m.visible = false;
    }
  }
};
/** BÓNG ĐỔ RA SAU (Daniel 25/11/2026: "nhiều lúc thấy bóng đổ ra phía trước mặt, đáng ra nó phải phía sau"). Máy luôn nhìn về -z, nên đèn chính phải
 *  đến từ phía máy (z của đèn lớn hơn z của đích) thì bóng mới ngả ra sau và sang ngang. `SceneLight` tự bẻ hướng (look.tsx `tuPhiaMay`); `Sun` ở NGOÀI TRỜI
 *  cũng tự lật ra phía máy (room.tsx). `Sun` trong nhà và đèn `directionalLight` tự đặt thì KHÔNG tự dời (nắng trong phòng phải đi qua đúng ô cửa, đèn tự đặt
 *  có thể là đèn viền): đặt sai thì ở đây báo một lần trên console và `tools/kiem_bong.py` báo LOI `bong-ve-may`.
 *  Cảnh ngược sáng thật (khung hình có cửa sổ ở tường sau, mặt trời thấp phía sau) thì khai `nguocSang` trên đèn. */
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const baoNguocSang = (l: THREE.Light) => {
  const d = l as THREE.DirectionalLight;
  if (!d.isDirectionalLight || !d.castShadow || d.userData?.nguocSang || d.userData?.daBaoNguoc) return;
  d.getWorldPosition(_a); d.target.getWorldPosition(_b); const dx = _a.x - _b.x, dz = _a.z - _b.z;
  if (dz < -0.15 * Math.hypot(dx, dz)) { d.userData.daBaoNguoc = true; console.warn(`[luật bóng] đèn đổ bóng đặt PHÍA SAU sân khấu (lệch z ${dz.toFixed(1)}): bóng sẽ đổ về phía máy. Dời đèn về phía máy, hoặc khai nguocSang nếu khung hình có nguồn sáng phía sau.`); }
};
/** BÓNG CỦA NGƯỜI (Daniel 25/11/2026: mỗi người một bóng, ngả ra sau; trong nhà vẫn có bóng, mờ hơn theo độ sáng của cảnh).
 *  Bóng thật của đèn không tới được người ở rất nhiều cảnh (phòng có trần, đèn cảnh tự đặt lệch ngang, người đứng trên thảm không nhận bóng), nên
 *  bóng của người KHÔNG lấy từ bản đồ bóng nữa: `Puppet3` vẽ một tấm mang chính hình bóng của nhân vật (đúng tư thế đang diễn, mép nhoè), và ở đây,
 *  mỗi lần dựng, tấm đó được ngả xuống đất theo hướng của đèn chính đã kéo vào KHUNG_BONG (look.tsx). Video gốc cũng làm vậy: bóng là hình người bị
 *  kéo xiên, mép mềm. Cảnh không có đèn đổ bóng: hướng mặc định BONG_MAC_DINH. Cảnh khai nguocSang: bóng ngả về phía máy như đèn đã đặt. */
const _LOC = new THREE.Matrix4(), _M1 = new THREE.Matrix4(), _SH = new THREE.Matrix4(), _INV = new THREE.Matrix4();
const _tia = new THREE.Raycaster(), XUONG = new THREE.Vector3(0, -1, 0), nhoBong = new WeakMap<THREE.Object3D, {k: string; t: number}>();
/** Bóng chỉ nằm trên chỗ CÓ ĐẤT: dò vài điểm dọc theo bóng (30, 50, 75, 100 % độ dài); tới điểm nào dưới đó không còn mặt đất ngang chân người
 *  (mép bờ sông, mép bục, mép bậc) thì bóng dừng ở điểm trước đó, không vắt ra ngoài mép. Kết quả nhớ theo chỗ đứng và hướng. */
const coDat = (x: number, y0: number, z: number, cacMesh: THREE.Object3D[]) => {
  _tia.set(_a.set(x, y0 + 0.25, z), XUONG); _tia.near = 0; _tia.far = 0.5;
  for (const h of _tia.intersectObjects(cacMesh, false)) if (Math.abs(h.point.y - y0) <= 0.06) return true;
  return false;
};
const datBongNguoi = (ds: THREE.Mesh[], den: THREE.Light | null, cacMesh: THREE.Object3D[]) => {
  let a = BONG_MAC_DINH[0], b = BONG_MAC_DINH[1];
  if (den) {
    const d = den as THREE.DirectionalLight; d.getWorldPosition(_a); d.target.getWorldPosition(_b);
    const v0: [number, number, number] = [_a.x - _b.x, _a.y - _b.y, _a.z - _b.z], v = d.userData?.nguocSang ? v0 : tuPhiaMay(v0);
    if (v[1] > 0.05) { a = -v[0] / v[1]; b = v[2] / v[1]; const dai = Math.hypot(a, b); if (dai > 0.8) { a *= 0.8 / dai; b *= 0.8 / dai; } }
  }
  for (const m of ds) {
    const p = m.parent, q = m.userData.bongChieu as {cx: number; cy: number; yOff: number; sy: number; fx: number; cao: number};
    if (!p || !q) continue;
    p.updateWorldMatrix(true, false); const PW = p.matrixWorld, x0 = PW.elements[12], y0 = PW.elements[13], z0 = PW.elements[14];
    const khoa = `${x0.toFixed(2)},${y0.toFixed(2)},${z0.toFixed(2)},${a.toFixed(2)},${b.toFixed(2)}`; let n = nhoBong.get(m);
    if (!n || n.k !== khoa) {
      let t = 0.2;
      for (const s of [0.3, 0.5, 0.75, 1]) { if (coDat(x0 + s * q.cao * a, y0, z0 - s * q.cao * b, cacMesh)) t = s; else break; }
      n = {k: khoa, t}; nhoBong.set(m, n);
    }
    const aa = a * n.t, bb = b * n.t;
    _LOC.makeTranslation(0, q.yOff, 0).multiply(_M1.makeScale(1, q.sy, 1)).multiply(_M1.makeTranslation(q.cx, q.cy, 0)).multiply(_M1.makeScale(q.fx, 1, 1));
    _SH.set(1, aa, 0, -aa * y0,   0, 0, 0, y0 + 0.012,   0, -bb, 1, bb * y0,   0, 0, 0, 1);   // điểm cao Y trên người rơi xuống đất, lệch (aa, -bb) nhân (Y - y0)
    m.matrix.copy(_INV.copy(PW).invert()).multiply(_SH).multiply(PW).multiply(_LOC); m.matrixWorldNeedsUpdate = true; m.visible = true;
  }
};
export const autoReceive = (root: THREE.Object3D) => {
  const vet: THREE.Mesh[] = [], bongNguoi: THREE.Mesh[] = [], cacMesh: THREE.Object3D[] = []; let denChinh: THREE.Light | null = null;
  root.traverse((o) => {
    if ((o as THREE.Light).isLight) {
      const l = o as THREE.DirectionalLight;
      if (!LUAT_CU) { mepBong(l); baoNguocSang(l); }
      if (l.castShadow && l.visible && l.intensity > 0 && (l.isDirectionalLight || (l as any).isSpotLight) && (!denChinh || l.intensity > denChinh.intensity)) denChinh = l;
      return;
    }
    if (o.userData?.vetBong) { vet.push(o as THREE.Mesh); return; }
    if (o.userData?.bongChieu) { bongNguoi.push(o as THREE.Mesh); return; }
    if ((o as THREE.Mesh).isMesh && !o.userData?.laNguoi) cacMesh.push(o);
    const m = o as THREE.Mesh; if (!m.isMesh || m.receiveShadow || m.userData?.noRecv) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    if (mats.some((x: any) => !x || !(x.isMeshLambertMaterial || x.isMeshPhongMaterial || x.isMeshStandardMaterial || x.isMeshToonMaterial))) return;
    if (mats.some((x) => x.transparent && x.depthWrite === false)) return;   // mảnh cắt giấy, sprite, tấm dán tự quyết bóng
    m.receiveShadow = true;
    // soi lỗi (chỉ khi dựng với biến môi trường REMOTION_SOI_BONG): 'to' = tô hồng mesh vừa được bật; 'khong-che' = nhận bóng nhưng không vào bản đồ bóng
    const soi = typeof process !== 'undefined' ? process.env.REMOTION_SOI_BONG : undefined;
    if (soi === 'to') m.material = SOI_HONG;
    if (soi === 'khong-che') m.customDepthMaterial = KHONG_CHE;
  });
  if (vet.length > 1 && !LUAT_CU) gopVetBong(vet);
  if (bongNguoi.length && !LUAT_CU) { root.updateMatrixWorld(); datBongNguoi(bongNguoi, denChinh, cacMesh); }
};
const SOI_HONG = new THREE.MeshBasicMaterial({color: '#ff00ff'}), KHONG_CHE = new THREE.MeshDepthMaterial({colorWrite: false, depthWrite: false});
/** Đặt trong canvas nào không dùng StageCam: chạy autoReceive sau mỗi lần dựng. */
export const AutoRecv = () => { const scene = useThree((t) => t.scene); useLayoutEffect(() => autoReceive(scene)); return null; };
/** The stage camera: the fixed 28-degree lens looking straight down -z from `eye`, the haze colour as background and as fog
 *  (far things pale by distance), dx / dz = a slide or push away from the standard position. Layers (`Plate`) are built for
 *  exactly this camera, so it never turns: to look at a room diagonally, turn the room. */
export const StageCam: React.FC<{eye: V3; haze: string; fog: [number, number]; dx?: number; dz?: number; dy?: number}> = ({eye, haze, fog, dx = 0, dz = 0, dy = 0}) => {
  // a shot (lib3/shot.tsx) may put the camera somewhere else in the same set; dx / dz then still slide and push from there
  const {camera, scene, size} = useThree(), c = camera as THREE.PerspectiveCamera, shot = useContext(ShotCtx), e = shot ? shot.eye : eye, rise = useContext(RiseCtx), yaw = useContext(XoayCtx);   // yaw: chỉ đường máy lượn (lib3/duongMay) mới khác 0
  // pitch / nâng máy (lib3/kieuMay: nâng, hạ): 0 khi không dùng, khi ấy vị trí và hướng nhìn giống hệt trước
  const pitch = useContext(NgocCtx), y = e[1] + dy + useContext(NangCtx), cp = Math.cos(pitch);
  c.position.set(e[0] + dx, y, e[2] + dz); c.near = 0.1; c.far = 900; c.lookAt(e[0] + dx - 100 * Math.sin(yaw) * cp, y + 100 * Math.sin(pitch), e[2] + dz - 100 * Math.cos(yaw) * cp);
  // rise (see RiseCtx): the frame is the TOP part of a taller level view, so the horizon sits lower and nothing converges
  const tall = 1 + 2 * rise; c.fov = (Math.atan(Math.tan((VIEW.fov * Math.PI) / 360) * tall) * 360) / Math.PI; c.aspect = size.width / (size.height * tall);
  if (rise > 0) c.setViewOffset(size.width, size.height * tall, 0, 0, size.width, size.height); else c.clearViewOffset();
  c.updateProjectionMatrix();
  scene.background = useMemo(() => new THREE.Color(haze), [haze]); scene.fog = useMemo(() => new THREE.Fog(haze, fog[0], fog[1]), [haze, fog[0], fog[1]]);
  useLayoutEffect(() => autoReceive(scene));   // không có mảng phụ thuộc: chạy mỗi lần dựng, bắt cả mesh mới xuất hiện giữa cảnh
  return <><BuiKhi e={e} /><BuiNguon /></>;   // BuiNguon: bụi theo nguồn sáng và môi trường (lib3/buiNguon); tự tắt ở tập đã khoá bụi
};
/** Bụi khí theo mẫu chương 10–14: ít hạt, nhỏ, quầng nhẹ, hai phần năm là mảnh hình thoi; đứng trong không gian trước máy, trôi chậm và quấn vòng.
 *  Vẽ trước nhân vật (order < 500) nên không đè lên mặt người. Số hạt và màu: useBuiKhi (mauBui). */
const BuiKhi: React.FC<{e: V3}> = ({e}) => {
  const f = useCurrentFrame(), {n, mau, seed} = useBuiKhi(), may = useContext(MayCtx);
  const L = useMemo(() => { const r = rnd(seed + 41); return Array.from({length: n}, (_, k) => { const q = r(); return {u: r(), v: r(), d: 1.9 + r() * 4.2 /* gần máy: để xa thì tường phía sau che mất hạt */, q: q * q, ph: r() * 6.28, sp: 0.6 + r() * 0.8, c: Math.floor(r() * 99), thoi: k % 5 < 2}; }); }, [n, seed]);
  if (!n) return null;
  const hat = <>{L.map((h, i) => {
    const u = (((h.u + (f / 24) * 0.014 * h.sp) % 1) + 1) % 1, v = (((h.v + (f / 24) * 0.009 * h.sp) % 1) + 1) % 1, ria = Math.min(1, Math.min(u, 1 - u, v, 1 - v) / 0.06);
    const x = e[0] + (u - 0.5) * 0.98 * h.d + Math.sin(f * 0.03 + h.ph) * 0.014 * h.d, y = e[1] + (v - 0.5) * 0.56 * h.d + Math.sin(f * 0.041 + h.ph * 2) * 0.01 * h.d, nhap = 0.8 + 0.2 * Math.sin(f * 0.11 + h.ph * 3), r = ((1.8 + 3 * h.q) * h.d) / 1440, c = mau[h.c % mau.length];
    return <group key={i} position={[x, y, e[2] - h.d]} scale={ria} rotation={[0, 0, h.thoi ? h.ph + f * 0.02 * h.sp : 0]}>
      <mesh renderOrder={6}><circleGeometry args={[h.thoi ? r * 2.2 : r, h.thoi ? 4 : 10]} /><meshBasicMaterial color={c} transparent opacity={0.82 * nhap} depthWrite={false} fog={false} toneMapped={false} /></mesh>
      {h.thoi ? null : <Halo pos={[0, 0, -0.002]} r={r * 3.4} color={c} strength={0.3 * nhap} order={5} bui={false} />}</group>;
  })}</>;
  // kiểu máy (lib3/kieuMay qua Shot `may`): cả đám hạt dời và xoay theo máy (quanh mắt chuẩn e), nên luôn nằm trước ống kính hiện tại
  if (!may) return hat;
  return <group position={[e[0] + may.dx, e[1] + may.dy, e[2] + may.dz]} rotation={new THREE.Euler(may.pitch, may.yaw, 0, 'YXZ')}><group position={[-e[0], -e[1], -e[2]]}>{hat}</group></group>;
};

// ---------------------------------------------------------------- ground: a road and a fence along a curve

export const ribbon = (curve: THREE.Curve<THREE.Vector3>, half: number, off: number, y: number, n = 90) => {
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= n; i++) { const p = curve.getPoint(i / n), t = curve.getTangent(i / n), nx = t.z, nz = -t.x, l = Math.hypot(nx, nz) || 1; [off - half, off + half].forEach((o) => pos.push(p.x + (nx / l) * o, y, p.z + (nz / l) * o)); if (i) { const a = i * 2; idx.push(a - 2, a, a - 1, a - 1, a, a + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
};
/** A dirt road as a ribbon along a curve on the ground: a darker verge, the track, two ruts and a strip of grass in the middle. */
export const Road: React.FC<{curve: THREE.Curve<THREE.Vector3>}> = ({curve}) => {
  const g = useMemo(() => [ribbon(curve, 1.42, 0, 0.011), ribbon(curve, 1.2, 0, 0.016), ribbon(curve, 0.09, -0.5, 0.021), ribbon(curve, 0.09, 0.5, 0.021), ribbon(curve, 0.22, 0, 0.019)], []);
  return <>{g.map((q, i) => <mesh key={i} geometry={q} receiveShadow><meshLambertMaterial color={['#8f845c', '#bfa97e', '#a8926a', '#a8926a', '#9fb07a'][i]} side={THREE.DoubleSide} /></mesh>)}</>;
};
/** A post-and-rail fence beside a curve (off = metres to its side, from / to = the part of the curve, 0..1): posts of uneven
 *  height that lean a little, two rails. */
export const Fence: React.FC<{curve: THREE.Curve<THREE.Vector3>; off: number; from: number; to: number; seed?: number}> = ({curve, off, from, to, seed = 2}) => {
  const posts = useMemo(() => { const r = rnd(seed), out: [number, number, number, number][] = []; for (let u = from; u <= to; u += 0.026) { const p = curve.getPoint(u), t = curve.getTangent(u), l = Math.hypot(t.x, t.z) || 1; out.push([p.x + (t.z / l) * off, p.z - (t.x / l) * off, (r() - 0.5) * 0.08, 0.86 + r() * 0.14]); } return out; }, []);
  return (
    <>
      {posts.map(([x, z, lean, h], i) => <B key={i} p={[x, h / 2, z]} s={[0.12, h, 0.12]} c={i % 3 ? '#7b5b3d' : '#6c4f35'} r={[0, 0, lean]} />)}
      {posts.slice(1).map(([x, z], i) => { const [x0, z0] = posts[i], dx = x - x0, dz = z - z0, l = Math.hypot(dx, dz); return [0.34, 0.68].map((y) => <B key={`${i}-${y}`} p={[(x + x0) / 2, y, (z + z0) / 2]} s={[l + 0.1, 0.09, 0.05]} c="#86654a" r={[0, -Math.atan2(dz, dx), 0]} />); })}
    </>
  );
};

// ---------------------------------------------------------------- houses and gates
export const Cottage: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const w = 3.8, d = 4.6, h = 2.5, rh = 1.9, wall = '#e8dcc0', wood = '#5c4231', run = w / 2 + 0.42, a = Math.atan2(rh, w / 2), L = run / Math.cos(a) + 0.1, zf = d / 2 + 0.035, xs = -w / 2 - 0.035;
  const gable = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rh); const g = new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: false}); g.translate(0, 0, -d / 2); return g; }, []);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0.22, 0]} s={[w + 0.16, 0.44, d + 0.16]} c="#8d887e" /><B p={[0, h / 2, 0]} s={[w, h, d]} c={wall} />
      <mesh geometry={gable} position={[0, h, 0]} castShadow receiveShadow><meshLambertMaterial color={wall} /></mesh>
      {[-1, 1].map((k) => <group key={k} position={[(k * run) / 2, h + rh - (run / 2) * Math.tan(a) + 0.1, 0]} rotation={[0, 0, -k * a]}>
        <B p={[0, 0, 0]} s={[L, 0.16, d + 0.8]} c="#98594a" />
        {/* courses of tiles: the slope is never one plain plane */}
        {[1, 2, 3, 4, 5].map((i) => <B key={i} p={[-L / 2 + (L * i) / 6, 0.09, 0]} s={[0.07, 0.035, d + 0.8]} c="#7f4639" />)}
        {[0, 1, 2, 3, 4, 5].map((i) => [-1.5, -0.4, 0.7, 1.7].map((z, j) => (i + j) % 3 === 0 && <B key={`${i}-${j}`} p={[-L / 2 + (L * (i + 0.5)) / 6, 0.088, z]} s={[L / 6 - 0.1, 0.02, 0.5]} c="#a5675a" />))}
      </group>)}
      <B p={[0, h + rh + 0.14, 0]} s={[0.24, 0.14, d + 0.86]} c="#8a4532" /><B p={[0.8, h + rh * 0.6 + 0.5, -0.9]} s={[0.52, 1.4, 0.52]} c="#9c9186" /><B p={[0.8, h + rh * 0.6 + 1.24, -0.9]} s={[0.66, 0.1, 0.66]} c="#7d746b" />
      {/* timber frame, gable end */}
      {[-1, 1].map((k) => <B key={k} p={[k * (w / 2 - 0.08), h / 2, zf]} s={[0.16, h, 0.06]} c={wood} />)}
      <B p={[0, h, zf]} s={[w, 0.16, 0.06]} c={wood} /><B p={[0, h * 0.5, zf]} s={[w, 0.12, 0.06]} c={wood} /><B p={[0, h * 0.75, zf]} s={[0.12, h * 0.5, 0.06]} c={wood} />
      <B p={[0, h + rh * 0.44, zf]} s={[0.12, rh * 0.88, 0.06]} c={wood} /><B p={[0, h + rh * 0.4, zf]} s={[w * 0.56, 0.1, 0.06]} c={wood} />
      {[-0.95, 0.95].map((x) => <group key={x} position={[x, h * 0.76, zf]}><B p={[0, 0, 0]} s={[0.78, 0.7, 0.05]} c="#f1ead8" /><B p={[0, 0, 0.02]} s={[0.64, 0.56, 0.05]} c="#33405a" /><B p={[0, 0, 0.04]} s={[0.05, 0.56, 0.04]} c="#f1ead8" /><B p={[0, 0, 0.04]} s={[0.64, 0.05, 0.04]} c="#f1ead8" /><B p={[0, -0.4, 0.06]} s={[0.9, 0.08, 0.14]} c={wood} /></group>)}
      {/* long side towards the road: door, window with shutters, beams */}
      {[-1, 1].map((k) => <B key={k} p={[xs, h / 2, k * (d / 2 - 0.08)]} s={[0.06, h, 0.16]} c={wood} />)}
      <B p={[xs, h, 0]} s={[0.06, 0.16, d]} c={wood} /><B p={[xs, h * 0.5, -1.25]} s={[0.06, 0.12, d - 2.3]} c={wood} /><B p={[xs, h / 2, 0.2]} s={[0.06, h, 0.12]} c={wood} />
      <B p={[xs, 0.98, 1.2]} s={[0.1, 1.86, 1.06]} c={wood} /><B p={[xs - 0.03, 0.95, 1.2]} s={[0.1, 1.72, 0.9]} c="#7a5638" /><B p={[xs - 0.09, 1.0, 0.9]} s={[0.05, 0.06, 0.06]} c="#2c2a2a" /><B p={[xs - 0.3, 0.08, 1.2]} s={[0.7, 0.16, 1.4]} c="#9a958c" />
      <group position={[xs, 1.6, -1.2]}><B p={[0, 0, 0]} s={[0.06, 0.86, 0.96]} c="#f1ead8" /><B p={[-0.02, 0, 0]} s={[0.06, 0.7, 0.8]} c="#33405a" /><B p={[-0.04, 0, 0]} s={[0.05, 0.7, 0.05]} c="#f1ead8" /><B p={[-0.04, 0, 0]} s={[0.05, 0.05, 0.8]} c="#f1ead8" />
        <B p={[-0.03, 0, -0.68]} s={[0.06, 0.9, 0.36]} c="#3f6a58" /><B p={[-0.03, 0, 0.68]} s={[0.06, 0.9, 0.36]} c="#3f6a58" /><B p={[-0.1, -0.5, 0]} s={[0.2, 0.1, 1.1]} c={wood} /></group>
    </group>
  );
};
/** A thatched house: earth walls on a stone footing with their bamboo frame showing, a deep roof of thatch laid in courses with
 *  a ragged eave and tied ridge, a porch on bamboo posts, and the things of a household around the door. */
export const ThatchHouse: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => {
  const w = 4.4, d = 5.4, h = 2.3, rh = 2.0, wall = '#dccaa2', frame = '#a88a52', thatch = '#c4a55c', run = w / 2 + 0.55, a = Math.atan2(rh, w / 2), L = run / Math.cos(a) + 0.1, zf = d / 2 + 0.03, xs = -w / 2 - 0.03;
  const gable = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rh); const g = new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: false}); g.translate(0, 0, -d / 2); return g; }, []);
  const fringe = useMemo(() => { const r = rnd(7); return Array.from({length: 26}, (_, i) => [-d / 2 - 0.3 + i * ((d + 0.6) / 25), 0.1 + r() * 0.16] as const); }, []);
  const rag = useMemo(() => { const r = rnd(11); return Array.from({length: 70}, () => 0.07 + r() * 0.2); }, []);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0.16, 0]} s={[w + 0.2, 0.32, d + 0.2]} c="#9a9488" /><B p={[0, h / 2 + 0.1, 0]} s={[w, h, d]} c={wall} /><mesh geometry={gable} position={[0, h + 0.1, 0]} castShadow receiveShadow><meshLambertMaterial color={wall} /></mesh>
      {[-1, 1].map((k) => <group key={k} position={[(k * run) / 2, h + 0.1 + rh - (run / 2) * Math.tan(a) + 0.16, 0]} rotation={[0, 0, -k * a]}>
        <B p={[0, 0, 0]} s={[L, 0.3, d + 1.0]} c={thatch} />
        {[1, 2, 3, 4, 5].map((i) => <B key={i} p={[-k * (L / 2) + (k * L * i) / 6, 0.16, 0]} s={[0.1, 0.05, d + 1.0]} c="#a88a48" cast={false} />)}
        {/* each course of thatch ends in a ragged edge of bundles, no two the same length */}
        {[1, 2, 3, 4, 5].map((i) => Array.from({length: 14}, (_, j) => { const len = rag[i * 14 + j - 14], seg = (d + 1.0) / 14; return <B key={`${i}-${j}`} p={[-k * (L / 2) + (k * L * i) / 6 + (k * len) / 2, 0.158, -(d + 1.0) / 2 + seg * (j + 0.5)]} s={[len, 0.03, seg - 0.03]} c={(i + j) % 3 === 0 ? '#d2b56e' : (i + j) % 3 === 1 ? '#b79a54' : '#c4a55c'} cast={false} />; }))}
        {fringe.map(([z, len], i) => <B key={i} p={[k * (L / 2 + len / 2 - 0.02), -0.06, z]} s={[len, 0.16, 0.2]} c={i % 2 ? '#b89a52' : '#c9ab62'} cast={false} />)}
      </group>)}
      <B p={[0, h + rh + 0.36, 0]} s={[0.5, 0.2, d + 1.04]} c="#b3944e" />{[-2.2, -1.1, 0, 1.1, 2.2].map((z) => [-1, 1].map((k) => <B key={`${z}${k}`} p={[0, h + rh + 0.5, z]} s={[0.05, 0.6, 0.05]} c="#8a7440" r={[0, 0, k * 0.7]} cast={false} />))}
      {/* gable end: bamboo frame, a barred window, a winnowing tray hung on the wall */}
      {[-1, 0, 1].map((k) => <B key={k} p={[k * (w / 2 - 0.07), h / 2 + 0.1, zf]} s={[0.1, h, 0.05]} c={frame} cast={false} />)}<B p={[0, h + 0.1, zf]} s={[w, 0.1, 0.05]} c={frame} cast={false} /><B p={[0, h * 0.45, zf]} s={[w, 0.08, 0.05]} c={frame} cast={false} /><B p={[0, h + 0.1 + rh * 0.45, zf]} s={[0.09, rh * 0.9, 0.05]} c={frame} cast={false} />
      <group position={[-1.05, h * 0.72, zf]}><B p={[0, 0, 0]} s={[0.86, 0.7, 0.05]} c="#8a6a44" cast={false} /><B p={[0, 0, 0.02]} s={[0.72, 0.56, 0.05]} c="#3a3026" cast={false} />{[-0.24, -0.08, 0.08, 0.24].map((x) => <B key={x} p={[x, 0, 0.05]} s={[0.04, 0.56, 0.03]} c="#bfae6a" cast={false} />)}</group>
      <group position={[1.05, h * 0.62, zf + 0.03]}><mesh><circleGeometry args={[0.5, 22]} /><meshLambertMaterial color="#c9b078" /></mesh><mesh position={[0, 0, 0.005]}><ringGeometry args={[0.4, 0.5, 22]} /><meshLambertMaterial color="#a8904e" /></mesh><mesh position={[0, 0, 0.006]}><ringGeometry args={[0.2, 0.23, 18]} /><meshLambertMaterial color="#b39c5c" /></mesh></group>
      {/* long side towards the yard: plank door ajar, porch roof on two bamboo posts */}
      {[-1, 1].map((k) => <B key={k} p={[xs, h / 2 + 0.1, k * (d / 2 - 0.07)]} s={[0.05, h, 0.1]} c={frame} cast={false} />)}<B p={[xs, h + 0.1, 0]} s={[0.05, 0.1, d]} c={frame} cast={false} /><B p={[xs, h / 2 + 0.1, -0.5]} s={[0.05, h, 0.1]} c={frame} cast={false} />
      <B p={[xs, 1.12, 1.1]} s={[0.08, 1.9, 1.3]} c="#2f2620" cast={false} /><B p={[xs - 0.03, 1.12, 0.74]} s={[0.07, 1.84, 0.58]} c="#8a6238" cast={false} /><B p={[xs - 0.18, 1.12, 1.72]} s={[0.07, 1.84, 0.5]} c="#7a5632" r={[0, 0.7, 0]} cast={false} />
      <group position={[xs, 1.5, -1.6]}><B p={[0, 0, 0]} s={[0.05, 0.8, 0.96]} c="#8a6a44" cast={false} /><B p={[-0.02, 0, 0]} s={[0.05, 0.66, 0.82]} c="#3a3026" cast={false} />{[-0.3, -0.1, 0.1, 0.3].map((z) => <B key={z} p={[-0.05, 0, z]} s={[0.03, 0.66, 0.04]} c="#bfae6a" cast={false} />)}</group>
      <B p={[xs - 0.95, h - 0.12, 0]} s={[2.0, 0.2, d + 0.4]} c={thatch} r={[0, 0, 0.22]} />{[-1, 1].map((k) => <B key={k} p={[xs - 1.75, 0.95, k * (d / 2 - 0.2)]} s={[0.09, 1.9, 0.09]} c="#bfae6a" />)}
      <B p={[xs - 0.5, 0.06, 0.3]} s={[1.6, 0.12, d - 0.6]} c="#a59f93" />
    </group>
  );
};
const plaques = new Map<string, THREE.CanvasTexture>();
const plaque = (name: string) => { let t = plaques.get(name); if (!t) { const cv = document.createElement('canvas'); cv.width = 920; cv.height = 200; const c = cv.getContext('2d')!; c.fillStyle = '#7a2a22'; c.fillRect(0, 0, 920, 200); c.strokeStyle = '#e2b84a'; c.lineWidth = 10; c.strokeRect(14, 14, 892, 172); c.fillStyle = '#eccb62'; c.font = '900 118px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, 460, 106, 840); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; plaques.set(name, t); } return t; };
/** The village gate: two brick piers with couplet boards, a lintel with the name board, a small tiled roof, wing walls. */
export const Gate: React.FC<{pos: V3; name?: string}> = ({pos, name = 'LÀNG ĐÔNG'}) => {
  const brick = '#b2634c', mortar = '#cb9078', tile = '#7d4638', stone = '#a39b90';
  return (
    <group position={pos}>
      {[-1.75, 1.75].map((x) => <group key={x} position={[x, 0, 0]}>
        <B p={[0, 0.2, 0]} s={[1.16, 0.4, 1.16]} c={stone} /><B p={[0, 1.9, 0]} s={[0.95, 3.4, 0.95]} c={brick} />
        {[0.72, 1.14, 1.56, 1.98, 2.4, 2.82, 3.24].map((y) => <B key={y} p={[0, y, 0]} s={[0.985, 0.045, 0.985]} c={mortar} cast={false} />)}
        <B p={[0, 3.7, 0]} s={[1.16, 0.2, 1.16]} c={stone} /><mesh position={[0, 4.0, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.72, 0.42, 4]} /><meshLambertMaterial color={tile} flatShading /></mesh>
        <FacetLathe profile={[[0.02, 0], [0.1, 0.05], [0.12, 0.16], [0.05, 0.3], [0.01, 0.34]]} sides={8} color="#d2bf96" pos={[0, 4.2, 0]} contact={false} />
        {/* the couplet board with its four gilt characters, and the damp green at the foot */}
        <B p={[0, 2.0, 0.485]} s={[0.5, 1.9, 0.03]} c="#a8322a" cast={false} />{[1.32, 1.76, 2.2, 2.64].map((y) => <B key={y} p={[0, y, 0.505]} s={[0.26, 0.28, 0.02]} c="#e2b84a" cast={false} />)}
        <B p={[-0.2, 0.56, 0.48]} s={[0.5, 0.3, 0.02]} c="#6f8a55" cast={false} /><B p={[0.3, 0.5, 0.482]} s={[0.3, 0.18, 0.02]} c="#7c955c" cast={false} />
      </group>)}
      <B p={[0, 4.15, 0]} s={[4.6, 0.7, 0.8]} c={brick} /><B p={[0, 3.82, 0]} s={[4.7, 0.07, 0.86]} c={mortar} cast={false} /><B p={[0, 4.48, 0]} s={[4.7, 0.07, 0.86]} c={mortar} cast={false} />
      <mesh position={[0, 4.15, 0.405]}><planeGeometry args={[2.3, 0.5]} /><meshBasicMaterial map={plaque(name)} /></mesh>
      <B p={[0, 4.78, 0.34]} s={[5.3, 0.12, 0.96]} c={tile} r={[0.5, 0, 0]} /><B p={[0, 4.78, -0.34]} s={[5.3, 0.12, 0.96]} c={tile} r={[-0.5, 0, 0]} />
      {Array.from({length: 14}, (_, i) => <B key={i} p={[-2.47 + i * 0.38, 4.83, 0.36]} s={[0.07, 0.05, 0.96]} c="#683a2e" r={[0.5, 0, 0]} cast={false} />)}
      <B p={[0, 5.04, 0]} s={[5.4, 0.14, 0.18]} c="#683a2e" />{[-1, 1].map((k) => <B key={k} p={[k * 2.86, 5.14, 0]} s={[0.56, 0.12, 0.18]} c="#683a2e" r={[0, 0, k * 0.5]} />)}
      {[-1, 1].map((k) => <group key={k} position={[k * 3.5, 0, 0]}>
        <B p={[0, 0.55, 0]} s={[2.5, 1.1, 0.42]} c={brick} /><B p={[0, 1.16, 0]} s={[2.62, 0.12, 0.6]} c={tile} />{[0.36, 0.72].map((y) => <B key={y} p={[0, y, 0]} s={[2.52, 0.04, 0.44]} c={mortar} cast={false} />)}
        <B p={[k * 0.5, 0.86, 0.215]} s={[0.3, 0.14, 0.02]} c="#8a4a3a" cast={false} /><B p={[-k * 0.6, 0.5, 0.215]} s={[0.5, 0.26, 0.02]} c="#6f8a55" cast={false} />
      </group>)}
    </group>
  );
};
export const BambooFence: React.FC<{from: number; to: number; z: number; seed?: number}> = ({from, to, z, seed = 1}) => {
  const slats = useMemo(() => { const r = rnd(seed), out: [number, number, number][] = []; for (let x = from; x <= to; x += 0.3) out.push([x, 0.5 + r() * 0.14, (r() - 0.5) * 0.14]); return out; }, []);
  return <>{slats.map(([x, h, lean], i) => <B key={i} p={[x, h / 2, z]} s={[0.05, h, 0.04]} c={i % 3 ? '#bfae6a' : '#a8964f'} r={[0, 0, lean]} cast={false} />)}{[0.2, 0.42].map((y) => <B key={y} p={[(from + to) / 2, y, z + 0.03]} s={[to - from, 0.04, 0.03]} c="#9a8848" cast={false} />)}</>;
};

// ---------------------------------------------------------------- a camp
const patchTex = (() => { let t: THREE.CanvasTexture | null = null; return () => { if (!t) { const cv = document.createElement('canvas'); cv.width = 96; cv.height = 72; const c = cv.getContext('2d')!; c.fillStyle = '#8c3b2c'; c.fillRect(6, 6, 84, 60); c.strokeStyle = '#e8d8b0'; c.lineWidth = 4; c.setLineDash([7, 7]); c.strokeRect(6, 6, 84, 60); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; } return t; }; })();
/** A bell tent: a four-sided canvas pyramid on crossed poles, the door a flat triangle (dark, or glowing when a lamp burns
 *  inside), a seam, stitched patches, guy ropes to pegs. s = size. */
export const Tent: React.FC<{pos: V3; s?: number; color?: string; lit?: boolean; rotY?: number; seed?: number}> = ({pos, s = 1, color = '#c3a36c', lit, rotY = 0, seed = 1}) => {
  const door = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-0.52, -1); sh.lineTo(0.52, -1); sh.lineTo(0, 1); return new THREE.ShapeGeometry(sh); }, []), tilt = -0.484;
  const rope = (x: number, z: number, k: number) => { const top = new THREE.Vector3(x * 0.42, 1.9, z * 0.42), peg = new THREE.Vector3(x, 0.05, z), mid = top.clone().add(peg).multiplyScalar(0.5), d = peg.clone().sub(top), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return <group key={k}><mesh position={mid} quaternion={q}><boxGeometry args={[0.025, d.length(), 0.025]} /><meshBasicMaterial color="#d8cba8" /></mesh><B p={[x, 0.09, z]} s={[0.06, 0.2, 0.06]} c="#5a4633" /></group>; };
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow><coneGeometry args={[2.3, 3.1, 4]} /><meshLambertMaterial color={color} flatShading /></mesh>
      {[0.5, -0.5].map((a) => <B key={a} p={[0, 3.18, 0]} s={[0.06, 0.62, 0.06]} c="#5a4633" r={[0, 0, a]} />)}
      <mesh geometry={door} position={[0, 0.98, 1.15]} rotation={[tilt, 0, 0]}><meshBasicMaterial color={lit ? '#ffd98a' : '#3a2e26'} /></mesh>
      {lit && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 2.5]} scale={[1, 1.5, 1]}><circleGeometry args={[0.9, 24]} /><meshBasicMaterial color="#f3c06a" transparent opacity={0.26} depthWrite={false} /></mesh>}
      {/* the seam across the front face, a little above the door's tip, and two stitched patches */}
      <mesh position={[0, 2.18, 0.5]} rotation={[tilt, 0, 0]}><planeGeometry args={[0.92, 0.035]} /><meshBasicMaterial color="#8f764a" /></mesh>
      {[[-0.92, 0.82, 0.32], [0.86, 1.22, -0.1]].slice(0, 1 + (seed % 2)).map(([x, y, rz], i) => <mesh key={i} position={[x, y, 1.64 - y * 0.525 + 0.02]} rotation={[tilt, 0, rz]}><planeGeometry args={[0.5, 0.38]} /><meshBasicMaterial map={patchTex()} transparent /></mesh>)}
      {rope(-2.5, 2.3, 1)}{rope(2.5, 2.3, 2)}{rope(-2.7, -1.2, 3)}{rope(2.7, -1.2, 4)}
    </group>
  );
};
export const Wagon: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 1.45, 0]} s={[3.1, 1.6, 1.7]} c="#8e3024" /><B p={[0, 0.72, 0]} s={[3.2, 0.14, 1.76]} c="#5a3a22" /><B p={[0, 2.36, 0]} s={[3.5, 0.2, 2.0]} c="#2f5a44" /><B p={[0, 2.5, 0]} s={[2.9, 0.14, 1.5]} c="#356650" />
    {[-1.5, 1.5].map((x) => <B key={x} p={[x, 1.45, 0.86]} s={[0.1, 1.6, 0.04]} c="#e0c070" cast={false} />)}<B p={[0, 2.2, 0.86]} s={[3.1, 0.1, 0.04]} c="#e0c070" cast={false} />
    <mesh position={[-0.45, 1.6, 0.86]}><planeGeometry args={[0.9, 0.72]} /><meshBasicMaterial color="#ffe2a0" /></mesh><B p={[-0.45, 1.6, 0.87]} s={[0.05, 0.72, 0.03]} c="#5a3a22" cast={false} /><B p={[-0.45, 1.6, 0.87]} s={[0.9, 0.05, 0.03]} c="#5a3a22" cast={false} /><B p={[-0.45, 1.2, 0.9]} s={[1.06, 0.07, 0.12]} c="#5a3a22" cast={false} />
    <Halo pos={[-0.45, 1.6, 1.0]} r={1.0} strength={0.3} />
    <B p={[0.85, 1.4, 0.87]} s={[0.66, 1.3, 0.04]} c="#6e2a20" cast={false} />
    {[-1.0, 1.0].map((x) => <group key={x} position={[x, 0.62, 0.9]}><mesh><circleGeometry args={[0.62, 20]} /><meshLambertMaterial color="#4a2c1e" /></mesh><mesh position={[0, 0, 0.006]}><circleGeometry args={[0.46, 20]} /><meshLambertMaterial color="#8a5a3a" /></mesh>{[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, 0, 0.012]} rotation={[0, 0, (i * Math.PI) / 4]}><planeGeometry args={[0.9, 0.05]} /><meshLambertMaterial color="#4a2c1e" /></mesh>)}<mesh position={[0, 0, 0.018]}><circleGeometry args={[0.1, 10]} /><meshLambertMaterial color="#3a2218" /></mesh></group>)}
  </group>
);
export const Lantern: React.FC<{pos: V3; h?: number; bui?: boolean}> = ({pos, h = 2.3, bui = true}) => (
  <group position={pos}>{bui ? <NguonBui kieu="den" pos={[0.4, h - 0.38, 0]} r={0.85} mau="#ffc070" /> : null}
    <B p={[0, h / 2, 0]} s={[0.07, h, 0.07]} c="#2a2420" /><B p={[0.2, h, 0]} s={[0.46, 0.06, 0.06]} c="#2a2420" /><B p={[0.4, h - 0.12, 0]} s={[0.03, 0.2, 0.03]} c="#2a2420" />
    <B p={[0.4, h - 0.2, 0]} s={[0.24, 0.05, 0.24]} c="#3a3026" cast={false} /><B p={[0.4, h - 0.56, 0]} s={[0.22, 0.05, 0.22]} c="#3a3026" cast={false} />
    <mesh position={[0.4, h - 0.38, 0]}><boxGeometry args={[0.17, 0.3, 0.17]} /><meshBasicMaterial color="#ffe0a0" /></mesh><Halo pos={[0.4, h - 0.38, 0.2]} r={0.85} strength={0.5} /><pointLight position={[0.4, h - 0.4, 0.4]} color="#ffc070" intensity={3} distance={5} decay={2} />
  </group>
);
export const LogSeat: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, 0.24, 0]} s={[2.1, 0.46, 0.5]} c="#5c3f2c" /><B p={[1.06, 0.24, 0]} s={[0.03, 0.4, 0.44]} c="#a58560" cast={false} />
    <B p={[0.25, 0.25, 0.01]} s={[0.74, 0.5, 0.54]} c="#8c3b2c" />{[-0.2, 0.2].map((y) => <B key={y} p={[0.25, 0.25 + y * 0.6, 0.02]} s={[0.76, 0.05, 0.55]} c="#e6d6ae" cast={false} />)}
    {[-0.06, 0.06, 0.18, 0.3, 0.42, 0.54].map((x) => <B key={x} p={[x, -0.01 + 0.05, 0.285]} s={[0.035, 0.1, 0.02]} c="#e6d6ae" cast={false} />)}
  </group>
);

// ---------------------------------------------------------------- fire and small lights
/** The flame in motion. Seen on 7 consecutive reference frames (1748-1754): the tongues keep their shapes and their tips lean a
 *  few pixels a frame, smoothly, on every frame; the height hardly changes. So every point of every tongue drifts on slow sines
 *  (a period of about a second and a half), more towards the tips. A new random outline on each frame reads as fast-forward. */
const TONGUES: {c: string; pts: number[][]}[] = [
  {c: '#ee6a22', pts: [[40, 0], [20, 130], [70, 210], [60, 290], [120, 230], [150, 370], [200, 270], [235, 440], [280, 290], [320, 350], [330, 220], [375, 260], [380, 120], [360, 0]]},
  {c: '#f79a36', pts: [[90, 0], [80, 110], [120, 170], [140, 260], [185, 190], [230, 340], [265, 210], [300, 250], [310, 130], [320, 0]]},
  {c: '#fcd462', pts: [[140, 0], [135, 80], [170, 140], [200, 210], [232, 130], [255, 160], [270, 80], [268, 0]]},
  {c: '#fff3c4', pts: [[180, 0], [182, 50], [205, 100], [228, 50], [232, 0]]},
];
/** dy, dz: ngọn lửa cách gốc bao nhiêu (mặc định 0,1 cho đuốc, lò). Ngọn nhỏ trên nến phải truyền gần 0, không thì lệch khỏi bấc khi máy ở gần. */
/** bui (mặc định true): ngọn lửa tự đăng ký nguồn bụi (lib3/buiNguon): 'lua' (tàn lửa) khi rộng >= 0,15 m, 'nen' khi nhỏ hơn; số = độ dày. */
export const Flame: React.FC<{f: number; w: number; dy?: number; dz?: number; bui?: boolean | number}> = ({f, w, dy: oy = 0.1, dz: oz = 0.1, bui = true}) => {
  const u = w / 400;
  return <>{bui !== false && bui !== 0 ? <NguonBui kieu="lua" pos={[0, oy, oz]} w={w} k={bui === true ? 1 : bui} /> : null}{TONGUES.map((L, li) => { const sh = new THREE.Shape(); L.pts.forEach(([x, y], i) => { const k = y / 460, dx = (Math.sin(f * 0.17 + i * 1.7 + li) * 15 + Math.sin(f * 0.29 + i * 0.9) * 6) * k, dy = Math.sin(f * 0.21 + i * 2.1 + li * 0.7) * 17 * k, X = (x - 200 + dx) * u, Y = (y + dy) * u; if (i) sh.lineTo(X, Y); else sh.moveTo(X, Y); }); return <mesh key={li} position={[0, oy, oz + li * 0.004]} renderOrder={3}><shapeGeometry args={[sh]} /><meshBasicMaterial color={L.c} depthWrite={false} transparent /></mesh>; })}</>;
};
/** bui (mặc định true): tàn lửa thêm của lib3/buiNguon (một nửa, vì lửa trại đã có 9 tàn riêng). */
export const Fire: React.FC<{pos: V3; f?: number; bui?: boolean}> = ({pos, f = 0, bui = true}) => {
  const st = useMemo(() => { const r = rnd(9); return Array.from({length: 7}, (_, i) => { const a = (i / 7) * Math.PI * 2 + 0.3; return [Math.cos(a) * 0.74, Math.sin(a) * 0.5, r() * 0.8, 0.2 + r() * 0.12] as const; }); }, []);
  const leg = (a: number, k: number) => { const top = new THREE.Vector3(0, 2.15, 0), foot = new THREE.Vector3(Math.cos(a) * 1.0, 0, Math.sin(a) * 0.8), d = foot.clone().sub(top), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return <mesh key={k} position={top.clone().add(foot).multiplyScalar(0.5)} quaternion={q} castShadow><boxGeometry args={[0.06, d.length(), 0.06]} /><meshLambertMaterial color="#2a2420" /></mesh>; };
  const breathe = 1 + 0.05 * Math.sin(f * 0.19) + 0.025 * Math.sin(f * 0.37);
  return (
    <group position={pos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.3]} scale={breathe}><circleGeometry args={[3.0, 40]} /><meshBasicMaterial color="#f2a35a" transparent opacity={0.2} depthWrite={false} /></mesh>
      {st.map(([x, z, ry, h], i) => <B key={i} p={[x, h / 2, z]} s={[0.3, h, 0.24]} c={i % 2 ? '#7d8190' : '#6c7080'} r={[0, ry, 0]} />)}
      {[0.5, -0.6].map((r, i) => <B key={i} p={[0, 0.1, 0.05]} s={[1.0, 0.14, 0.16]} c="#3b2a20" r={[0, r, 0.08]} />)}
      <Flame f={f} w={1.25} bui={bui ? 0.5 : false} />
      {/* the glow is drawn BEFORE the tongues (order 2), or it lies over them and washes their colours out */}
      <group scale={breathe}><Halo pos={[0, 0.85, 0.02]} r={2.0} color="#ffab5c" strength={0.42} order={2} /></group>
      {/* embers: a few sparks that rise slowly from the fire, drift and go out */}
      {Array.from({length: 9}, (_, i) => { const life = 70 + (i % 4) * 16, q = f + i * 23, u = (q % life) / life, n = Math.floor(q / life), x = Math.sin(n * 12.9 + i * 4.1) * 0.32 + Math.sin(u * 5 + i) * 0.1 * u, s = (1 - u) * (0.6 + (i % 3) * 0.2); return <mesh key={`e${i}`} position={[x, 0.9 + u * 2.6, 0.12]} scale={s} renderOrder={5}><circleGeometry args={[0.03, 8]} /><meshBasicMaterial color={i % 2 ? '#ffc060' : '#ff9440'} transparent depthWrite={false} /></mesh>; })}
      {leg(0.6, 1)}{leg(2.7, 2)}{leg(4.7, 3)}<B p={[0, 1.78, 0]} s={[0.02, 0.6, 0.02]} c="#1f1c1a" cast={false} /><FacetLathe profile={[[0.1, 0], [0.24, 0.08], [0.26, 0.26], [0.2, 0.3]]} sides={9} color="#2c2a2e" pos={[0, 1.2, 0]} contact={false} />
      <pointLight position={[0, 0.9, 0.7]} color="#ff9a4a" intensity={16 * breathe} distance={10} decay={2} />
    </group>
  );
};
export const paintWood = (c: Ctx, W: number, H: number) => { const r = W / 8.4; [[1, 0], [3, 0], [5, 0], [7, 0], [2, 1], [4, 1], [6, 1], [3, 2], [5, 2]].forEach(([x, y]) => { const cx = x * r * 1.05, cy = H - r - y * r * 1.72; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = '#6a4a30'; c.fill(); c.beginPath(); c.arc(cx, cy, r * 0.74, 0, 7); c.fillStyle = '#c9a57a'; c.fill(); c.beginPath(); c.arc(cx, cy, r * 0.3, 0, 7); c.fillStyle = '#b08a60'; c.fill(); }); };
export const Fireflies: React.FC<{f?: number}> = ({f = 0}) => { const pts = useMemo(() => { const r = rnd(31); return Array.from({length: 22}, () => [(r() - 0.5) * 16, 0.5 + r() * 3.2, -1 - r() * 12, 0.02 + r() * 0.02, r() * 6.28] as const); }, []); return <><DaCoKhi />{pts.map(([x, y, z, s, ph], i) => { const k = 0.85 + 0.25 * Math.sin(f * 0.07 + ph * 3); return <group key={i} position={[x + Math.sin(f * 0.011 + ph) * 0.35, y + Math.sin(f * 0.015 + ph * 2) * 0.22, z]} scale={k}><mesh><circleGeometry args={[s, 8]} /><meshBasicMaterial color="#f4f08a" fog={false} /></mesh><Halo pos={[0, 0, 0.01]} r={s * 4.5} color="#e6ef7a" strength={0.35} bui={false} /></group>; })}</>; };

// ---------------------------------------------------------------- yard things
export const Well: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <FacetLathe profile={[[0.7, 0], [0.74, 0.08], [0.74, 0.7], [0.66, 0.78], [0.5, 0.78], [0.5, 0.4]]} sides={10} color="#a29f97" tones={[0.82, 1, 1.12, 1.12, 0.7]} />
    {[-1, 1].map((k) => <B key={k} p={[k * 0.62, 1.3, 0]} s={[0.1, 1.2, 0.1]} c="#6b4f38" />)}
    <B p={[0, 1.78, 0]} s={[1.3, 0.07, 0.07]} c="#6b4f38" /><B p={[-0.42, 2.12, 0]} s={[1.02, 0.08, 1.0]} c="#8a4532" r={[0, 0, 0.5]} /><B p={[0.42, 2.12, 0]} s={[1.02, 0.08, 1.0]} c="#8a4532" r={[0, 0, -0.5]} />
    <B p={[0.1, 1.42, 0]} s={[0.02, 0.7, 0.02]} c="#3a3026" /><FacetLathe profile={[[0.11, 0], [0.14, 0.24], [0.12, 0.24]]} sides={8} color="#7a5a3c" pos={[0.1, 0.84, 0]} contact={false} />
  </group>
);

// the road: a ribbon along a curve on the ground
export const Crate: React.FC<{pos: V3; s?: number; rotY?: number}> = ({pos, s = 0.7, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <B p={[0, s / 2, 0]} s={[s, s, s]} c="#b08a58" />
    {[-1, 1].map((k) => <React.Fragment key={k}><B p={[k * (s / 2 - 0.04), s / 2, s / 2 + 0.012]} s={[0.08, s, 0.03]} c="#8d6a40" cast={false} /><B p={[0, s / 2 + k * (s / 2 - 0.04), s / 2 + 0.012]} s={[s, 0.08, 0.03]} c="#8d6a40" cast={false} /></React.Fragment>)}
    <B p={[0, s / 2, s / 2 + 0.01]} s={[0.07, s * 1.22, 0.02]} c="#8d6a40" r={[0, 0, Math.PI / 4]} cast={false} />
  </group>
);
export const Barrel: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos}>
    <FacetLathe profile={[[0.28, 0], [0.34, 0.2], [0.37, 0.5], [0.34, 0.82], [0.28, 1.0], [0.02, 1.0]]} color="#8f643a" />
    {[0.17, 0.8].map((y) => <FacetLathe key={y} profile={[[0.345, y], [0.36, y], [0.36, y + 0.07], [0.345, y + 0.07]]} color="#3d4350" contact={false} cast={false} />)}
  </group>
);
/** A tied sack or a clay jar: the reference's faceted tan pots. */
export const Sack: React.FC<{pos: V3; s?: number}> = ({pos, s = 1}) => <group position={pos} scale={s}><FacetLathe profile={[[0.2, 0], [0.34, 0.14], [0.36, 0.42], [0.24, 0.66], [0.13, 0.72], [0.16, 0.82], [0.02, 0.84]]} sides={9} color="#bfa978" /><FacetLathe profile={[[0.135, 0.69], [0.15, 0.69], [0.15, 0.75], [0.135, 0.75]]} sides={9} color="#7a4a3a" contact={false} cast={false} /></group>;
export const Jar: React.FC<{pos: V3; s?: number; lid?: boolean}> = ({pos, s = 1, lid}) => <group position={pos} scale={s}><FacetLathe profile={[[0.2, 0], [0.36, 0.2], [0.4, 0.55], [0.3, 0.82], [0.24, 0.86], [0.27, 0.92], [0.24, 0.93]]} sides={10} color="#6e4a38" tones={[0.8, 1, 1.14, 1.1, 0.9, 1.1]} />{lid && <FacetLathe profile={[[0.29, 0.93], [0.3, 0.97], [0.05, 1.03], [0.01, 1.03]]} sides={10} color="#8a6a4a" contact={false} cast={false} />}</group>;

// ---------------------------------------------------------------- the railway: track, train, platform, shelter (station test)
/** Words drawn once on a canvas and kept (sign boards, numbers, the lettering on a carriage). bg '' = transparent. */
const words = new Map<string, THREE.CanvasTexture>();
const wordTex = (text: string, ink: string, bg: string, aspect: number, weight = 900, frame = '') => {
  const key = [text, ink, bg, aspect, weight, frame].join('|'); let t = words.get(key);
  if (!t) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.round(1024 / aspect); const c = cv.getContext('2d')!;
    if (bg) { c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height); }
    if (frame) { c.strokeStyle = frame; c.lineWidth = Math.max(6, cv.height * 0.06); c.strokeRect(cv.height * 0.1, cv.height * 0.1, cv.width - cv.height * 0.2, cv.height - cv.height * 0.2); }
    c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${weight} ${Math.round(cv.height * 0.56)}px "Helvetica Neue", Arial, sans-serif`; c.fillText(text, cv.width / 2, cv.height * 0.54, cv.width * 0.9);
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; words.set(key, t);
  }
  return t;
};
/** A flat label lying on a face (z = just in front of it): words on a board or straight on the paint. */
export const Label: React.FC<{text: string; p: V3; w: number; h: number; ink?: string; bg?: string; frame?: string; rotY?: number; lit?: boolean}> = ({text, p, w, h, ink = '#1f2f4a', bg = '', frame = '', rotY = 0, lit = true}) => {
  const map = wordTex(text, ink, bg, w / h, 900, frame);
  return <mesh position={p} rotation={[0, rotY, 0]}><planeGeometry args={[w, h]} />{lit ? <meshLambertMaterial map={map} transparent={!bg} /> : <meshBasicMaterial map={map} transparent={!bg} />}</mesh>;
};

/** A railway track along a curve lying on ground at height y: a ballast bed (dark verge, lighter crown), timber sleepers of
 *  three browns set a little unevenly, two rails standing proud with a bright worn head. Use getPointAt spacing, so the
 *  sleepers keep an even pitch round the bends. */
export const Track: React.FC<{curve: THREE.Curve<THREE.Vector3>; y?: number; seed?: number}> = ({curve, y = 0, seed = 5}) => {
  const bed = useMemo(() => [ribbon(curve, 1.75, 0, y + 0.01, 160), ribbon(curve, 1.3, 0, y + 0.045, 160), ribbon(curve, 0.5, 1.15, y + 0.05, 160)], []);
  const parts = useMemo(() => {
    const L = curve.getLength(), r = rnd(seed), sl: [V3, number, string][] = [], rails: [V3, number, number][] = [];
    for (let d = 0.3; d < L; d += 0.62) { const u = d / L, p = curve.getPointAt(u), t = curve.getTangentAt(u); sl.push([[p.x + (r() - 0.5) * 0.04, y + 0.08, p.z], -Math.atan2(t.z, t.x) + (r() - 0.5) * 0.06, ['#5e4a3a', '#6b5442', '#4f4034'][Math.floor(r() * 3)]]); }
    for (let d = 0; d < L; d += 0.9) { const a = curve.getPointAt(d / L), b = curve.getPointAt(Math.min(1, (d + 0.9) / L)), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; [-0.72, 0.72].forEach((o) => rails.push([[(a.x + b.x) / 2 - (dz / l) * o, y + 0.19, (a.z + b.z) / 2 + (dx / l) * o], -Math.atan2(dz, dx), l + 0.04])); }
    return {sl, rails};
  }, []);
  return (
    <>
      {bed.map((g, i) => <mesh key={i} geometry={g} receiveShadow><meshLambertMaterial color={['#7a7064', '#968a79', '#8a7f70'][i]} side={THREE.DoubleSide} /></mesh>)}
      {parts.sl.map(([p, a, c], i) => <B key={i} p={p} s={[0.24, 0.1, 2.3]} c={c} r={[0, a, 0]} cast={false} />)}
      {parts.rails.map(([p, a, l], i) => <group key={`r${i}`} position={p} rotation={[0, a, 0]}><B p={[0, 0, 0]} s={[l, 0.14, 0.08]} c="#4f4b4a" cast={false} /><B p={[0, 0.08, 0]} s={[l, 0.025, 0.065]} c="#c9c2b4" cast={false} /></group>)}
    </>
  );
};

/** One bogie: a dark frame with a yellow spring box, and its wheels drawn on the outer face towards the camera (+z). */
const Bogie: React.FC<{x: number; span?: number}> = ({x, span = 1.2}) => (
  <group position={[x, 0, 0]}>
    <B p={[0, 0.5, 0]} s={[span + 0.9, 0.36, 2.0]} c="#2b2c31" /><B p={[0, 0.56, 1.02]} s={[0.42, 0.26, 0.06]} c="#b8932f" cast={false} />
    {[-span / 2, span / 2].map((wx) => <group key={wx} position={[wx, 0.42, 1.06]}>
      <mesh><circleGeometry args={[0.42, 22]} /><meshLambertMaterial color="#202126" /></mesh><mesh position={[0, 0, 0.005]}><circleGeometry args={[0.32, 22]} /><meshLambertMaterial color="#4c4d55" /></mesh>
      {[0, 1, 2].map((k) => <mesh key={k} position={[0, 0, 0.01]} rotation={[0, 0, (k * Math.PI) / 3]}><planeGeometry args={[0.6, 0.05]} /><meshLambertMaterial color="#35363c" /></mesh>)}<mesh position={[0, 0, 0.015]}><circleGeometry args={[0.09, 12]} /><meshLambertMaterial color="#8a8a90" /></mesh>
    </group>)}
    <B p={[0, 0.66, 1.1]} s={[span + 0.7, 0.07, 0.04]} c="#3d3e44" cast={false} />
  </group>
);

/** A diesel locomotive seen from its side, facing +x (stylised short: L = 7.2 m). Rail top at y 0. Blue upper body, cream lower
 *  band, a red stripe; the cab at the front with two windows; grilled hood panels; a number on the cab; the buffer beam;
 *  the exhaust stack on the roof (smoke = a puff over it, the sign of a train about to leave). */
export const Locomotive: React.FC<{pos: V3; rotY?: number; L?: number; num?: string; blue?: string; cream?: string; smoke?: boolean}> = ({pos, rotY = 0, L = 7.2, num = 'D12E-615', blue = '#2d5d8e', cream = '#ebdfbf', smoke = true}) => {
  const front = L / 2, cab = front - 1.25, z = 1.415, panels = Math.max(2, Math.floor((L - 3.0) / 0.82));
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Bogie x={-L * 0.3} /><Bogie x={L * 0.3} />
      <B p={[0, 1.0, 0]} s={[L, 0.3, 2.7]} c="#2e3036" /><B p={[0, 0.74, 0]} s={[L * 0.26, 0.4, 2.0]} c="#3a3c42" /><B p={[0, 0.88, 1.36]} s={[L, 0.07, 0.03]} c="#e0b545" cast={false} />
      <B p={[-0.1, 2.35, 0]} s={[L - 0.3, 2.4, 2.8]} c={blue} />
      <B p={[-0.1, 1.6, z]} s={[L - 0.3, 0.9, 0.02]} c={cream} cast={false} /><B p={[-0.1, 2.1, z + 0.002]} s={[L - 0.3, 0.1, 0.02]} c="#b23d2e" cast={false} /><B p={[-0.1, 1.2, z + 0.002]} s={[L - 0.3, 0.06, 0.02]} c="#b23d2e" cast={false} />
      {/* roofs: the cab's in body blue, the hood's grey and narrower, the exhaust stack, a horn */}
      <B p={[cab, 3.62, 0]} s={[2.1, 0.16, 2.8]} c="#264f7a" /><B p={[-1.0, 3.62, 0]} s={[L - 2.6, 0.14, 2.3]} c="#7d8590" />
      {[-2.2, -1.1, 0].map((x) => <B key={x} p={[x, 3.73, 0]} s={[0.7, 0.08, 1.6]} c="#5d646e" cast={false} />)}
      <FacetLathe profile={[[0.16, 0], [0.18, 0.3], [0.14, 0.34]]} sides={9} color="#2e2e33" pos={[-0.6, 3.69, 0.25]} contact={false} />
      <B p={[cab + 0.4, 3.8, 0.6]} s={[0.36, 0.1, 0.1]} c="#c9c2b4" />
      {/* cab: two windows with light frames and a glint, grab bars, steps, the number plate */}
      {[cab - 0.42, cab + 0.42].map((x) => <group key={x} position={[x, 2.85, z]}><B p={[0, 0, 0]} s={[0.72, 0.74, 0.03]} c="#efe6cc" cast={false} /><B p={[0, 0, 0.01]} s={[0.6, 0.62, 0.03]} c="#2b3a4a" cast={false} /><B p={[-0.12, 0.05, 0.02]} s={[0.07, 0.5, 0.02]} c="#6b8299" r={[0, 0, 0.5]} cast={false} /></group>)}
      {[cab - 0.95, cab + 0.95].map((x) => <B key={x} p={[x, 2.0, z + 0.04]} s={[0.04, 1.1, 0.04]} c="#e8e0cc" cast={false} />)}
      {[0.78, 0.5].map((y) => <B key={y} p={[cab, y, 1.3]} s={[0.7, 0.06, 0.3]} c="#3d3e44" cast={false} />)}
      <Label text={num} p={[cab, 1.62, z + 0.01]} w={1.4} h={0.3} ink="#f2e6c2" bg="#2b3f5c" />
      {/* body seams, a gutter under the roof, the railway roundel on the hood */}
      <B p={[-0.1, 3.5, z + 0.004]} s={[L - 0.3, 0.05, 0.02]} c="#1f4268" cast={false} />
      {Array.from({length: Math.floor(L / 1.3)}, (_, i) => <B key={`sm${i}`} p={[-front + 0.4 + i * 1.3, 2.82, z + 0.004]} s={[0.025, 1.36, 0.02]} c="#24507e" cast={false} />)}
      <group position={[-front + 0.75, 1.62, z + 0.03]}><mesh><circleGeometry args={[0.21, 24]} /><meshLambertMaterial color="#e6c35a" /></mesh><mesh position={[0, 0, 0.003]}><circleGeometry args={[0.17, 24]} /><meshLambertMaterial color="#24507e" /></mesh><Label text="ĐS" p={[0, 0, 0.006]} w={0.3} h={0.2} ink="#e6c35a" /></group>
      {/* hood: grilled panels, each with slats, a few rust streaks below them */}
      {Array.from({length: panels}, (_, i) => { const x = -front + 0.75 + i * 0.82 + (i ? 0.25 : 0); return <group key={i} position={[x, 2.72, z]}><B p={[0, 0, 0]} s={[0.7, 0.8, 0.02]} c="#244c74" cast={false} />{[-0.27, -0.09, 0.09, 0.27].map((y) => <B key={y} p={[0, y, 0.01]} s={[0.6, 0.05, 0.02]} c="#1a3653" cast={false} />)}</group>; })}
      {/* the front: sloped windscreen, headlight, red buffer beam with buffers and coupler */}
      <B p={[front - 0.18, 3.0, 0]} s={[0.22, 0.9, 2.5]} c="#2b3a4a" r={[0, 0, -0.22]} cast={false} /><B p={[front - 0.1, 3.5, 0]} s={[0.18, 0.2, 0.42]} c="#f6e7a8" cast={false} />
      <B p={[front + 0.05, 1.0, 0]} s={[0.3, 0.5, 2.7]} c="#a83a2c" />{[-0.85, 0.85].map((zz) => <B key={zz} p={[front + 0.3, 1.0, zz]} s={[0.25, 0.22, 0.22]} c="#2b2c31" />)}<B p={[front + 0.32, 0.88, 0]} s={[0.3, 0.18, 0.26]} c="#2b2c31" />
      <B p={[-front - 0.05, 1.0, 0]} s={[0.3, 0.5, 2.7]} c="#a83a2c" />
      {smoke && <Sprite name="loco-smoke" art={(c, W, H) => paintSmoke(c, W, H)} px={[300, 420]} w={1.5} pos={[-0.75, 3.95, 0.25]} cast={false} shade={0} che={false} />}
    </group>
  );
};

/** A passenger carriage seen from its side (stylised short: L = 9.4 m), rail top at y 0: cream lower body with the lettering
 *  ĐƯỜNG SẮT VIỆT NAM, a blue window band, a row of framed windows with curtains (some drawn, one with a towel over the
 *  sill), a door at each end with steps (open = -1 / 1: the left / right one stands open), the coach number, a two-step roof, end bellows. */
export const Carriage: React.FC<{pos: V3; rotY?: number; L?: number; num?: string; open?: -1 | 1; seed?: number; blue?: string; cream?: string}> = ({pos, rotY = 0, L = 9.4, num = '3', open, seed = 2, blue = '#2d5d8e', cream = '#ebdfbf'}) => {
  const z = 1.435, half = L / 2, win = useMemo(() => { const r = rnd(seed), out: [number, number][] = []; for (let x = -half + 1.75; x <= half - 1.7; x += 1.02) out.push([x, r()]); return out; }, []);
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <Bogie x={-half + 1.6} /><Bogie x={half - 1.6} />
      <B p={[0, 0.95, 0]} s={[L, 0.28, 2.7]} c="#2e3036" /><B p={[0, 0.7, 0.2]} s={[2.4, 0.36, 1.7]} c="#3a3c42" />
      <B p={[0, 2.3, 0]} s={[L, 2.4, 2.86]} c={cream} /><B p={[0, 2.86, z]} s={[L, 1.28, 0.02]} c={blue} cast={false} /><B p={[0, 2.16, z + 0.002]} s={[L, 0.07, 0.02]} c="#b23d2e" cast={false} />
      <B p={[0, 3.58, 0]} s={[L + 0.04, 0.16, 2.9]} c="#8d9298" /><B p={[0, 3.72, 0]} s={[L - 0.2, 0.14, 2.3]} c="#a3a8ad" />{[-3, -1, 1, 3].map((x) => <B key={x} p={[x * (L / 9.4), 3.84, 0]} s={[0.5, 0.12, 0.6]} c="#7c828a" cast={false} />)}
      {win.map(([x, q], i) => <group key={i} position={[x, 2.86, z]}>
        <B p={[0, 0, 0.004]} s={[0.84, 0.8, 0.02]} c="#f1ead8" cast={false} /><B p={[0, -0.02, 0.012]} s={[0.72, 0.64, 0.02]} c="#2f3b48" cast={false} />
        <B p={[0, q < 0.5 ? 0.2 : 0.12, 0.02]} s={[0.72, q < 0.5 ? 0.22 : 0.4, 0.02]} c={q < 0.3 ? '#cdb06a' : '#e2d3a8'} cast={false} />
        <B p={[-0.16, -0.1, 0.024]} s={[0.06, 0.4, 0.01]} c="#566b80" r={[0, 0, 0.5]} cast={false} />
        {i === 2 && <B p={[0.12, -0.4, 0.05]} s={[0.24, 0.32, 0.03]} c="#d9534a" cast={false} />}
      </group>)}
      {[-1, 1].map((k) => { const dx = k * (half - 0.72), isOpen = open === k; return <group key={k} position={[dx, 0, z]}>
        <B p={[0, 1.98, 0.006]} s={[0.84, 2.0, 0.02]} c={isOpen ? '#1f2328' : '#24507e'} cast={false} />
        {!isOpen && <B p={[0, 2.62, 0.014]} s={[0.42, 0.5, 0.02]} c="#2f3b48" cast={false} />}{!isOpen && <B p={[0.3, 1.9, 0.02]} s={[0.04, 0.3, 0.03]} c="#d8d0bc" cast={false} />}
        {isOpen && <><B p={[0.12, 2.0, 0.01]} s={[0.5, 1.7, 0.02]} c="#6b5a48" cast={false} /><B p={[0.12, 2.5, 0.014]} s={[0.36, 0.4, 0.02]} c="#c9a86a" cast={false} /><B p={[-0.25, 1.9, 0.016]} s={[0.04, 1.6, 0.03]} c="#c9c2b4" cast={false} /></>}
        {[-0.48, 0.48].map((x) => <B key={x} p={[x, 2.0, 0.04]} s={[0.035, 1.0, 0.035]} c="#e8e0cc" cast={false} />)}
        {[0.78, 0.48].map((y) => <B key={y} p={[0, y, -0.05]} s={[0.76, 0.06, 0.32]} c="#3d3e44" />)}
      </group>; })}
      <Label text="ĐƯỜNG SẮT VIỆT NAM" p={[0, 1.66, z + 0.012]} w={4.4} h={0.34} ink="#2a4f7c" />
      <Label text={num} p={[-half + 1.45, 1.66, z + 0.012]} w={0.36} h={0.36} ink="#2a4f7c" bg="#f6f0e0" frame="#2a4f7c" />
      {[-1, 1].map((k) => <B key={k} p={[k * (half + 0.15), 2.25, 0]} s={[0.3, 2.1, 2.0]} c="#2a2a2e" />)}
    </group>
  );
};

/** A low station platform: its top at y 0 from z = edge back to z = back, x0..x1; worn concrete slabs, a row of paler edge
 *  stones with joints, a weathered white line, the brick face down to the track bed (h below), moss at the foot, and
 *  stains over the visible middle (wear = [width, depth] of that patch, centred on wearAt). */
export const Platform: React.FC<{x0: number; x1: number; edge: number; back: number; h?: number; color?: string; seed?: number; wear?: [number, number]; wearAt?: [number, number]}> =
  ({x0, x1, edge, back, h = 0.4, color = '#c8b99c', seed = 3, wear = [16, 9], wearAt = [0, 2]}) => {
    const w = x1 - x0, d = back - edge, cx = (x0 + x1) / 2;
    const slabs = useMemo(() => { const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d')!, r = rnd(seed); c.fillStyle = '#ededed'; c.fillRect(0, 0, 512, 512);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const q = r(); c.fillStyle = q < 0.15 ? '#f8f8f8' : q < 0.32 ? '#dedede' : q < 0.4 ? '#d4d4d4' : '#ececec'; c.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); if (r() < 0.25) { c.strokeStyle = 'rgba(60,60,70,0.4)'; c.lineWidth = 2; c.beginPath(); let x = i * 128 + r() * 128, y = j * 128; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 40; y += 32; c.lineTo(x, y); } c.stroke(); } }
      c.strokeStyle = 'rgba(70,64,60,0.55)'; c.lineWidth = 4; for (let k = 0; k <= 4; k++) { c.beginPath(); c.moveTo(k * 128, 0); c.lineTo(k * 128, 512); c.stroke(); c.beginPath(); c.moveTo(0, k * 128); c.lineTo(512, k * 128); c.stroke(); }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 3.2, d / 3.2); t.anisotropy = 16; return t; }, []);
    const stains = useMemo(() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 576; const c = cv.getContext('2d')!, r = rnd(seed + 7);
      for (let k = 0; k < 16; k++) { const px = r() * 1024, py = r() * 576, rad = 50 + r() * 150, g = c.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, r() < 0.4 ? 'rgba(255,250,240,0.12)' : 'rgba(60,50,40,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }, []);
    const joints = useMemo(() => { const out: number[] = []; for (let x = x0 + 0.6; x < x1; x += 1.0) out.push(x); return out; }, []);
    return (
      <group>
        <B p={[cx, -h / 2, (edge + back) / 2]} s={[w, h, d]} c="#9c6450" />
        <mesh position={[cx, 0.001, (edge + back) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, d]} /><meshLambertMaterial color={color} map={slabs} /></mesh>
        <mesh position={[wearAt[0], 0.004, wearAt[1]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}><planeGeometry args={[wear[0], wear[1]]} /><meshBasicMaterial map={stains} transparent depthWrite={false} /></mesh>
        {/* the edge stones, slightly raised, with their joints and a worn white line inside them */}
        <B p={[cx, 0.015, edge + 0.3]} s={[w, 0.06, 0.6]} c="#ddd3bf" />{joints.map((x) => <B key={x} p={[x, 0.047, edge + 0.3]} s={[0.03, 0.005, 0.6]} c="#8f8676" cast={false} />)}
        <B p={[cx, 0.006, edge + 0.78]} s={[w, 0.004, 0.09]} c="#ece6d8" cast={false} />
        {/* brick face towards the track: courses, a darker damp foot with moss */}
        {[0.1, 0.2, 0.3].map((y) => <B key={y} p={[cx, -y, edge - 0.002]} s={[w, 0.02, 0.01]} c="#c08a72" cast={false} />)}
        <B p={[cx, -h + 0.06, edge - 0.004]} s={[w, 0.12, 0.01]} c="#5f6a45" cast={false} />
      </group>
    );
  };

/** A station shelter on cast-iron posts, origin at its LEFT end (x 0..w), across z -d/2..d/2, eaves at h: a gabled tin roof
 *  (rusty red, rafters under it), timber beams with curved brackets, a scalloped valance on the open end, the station name
 *  board hung from the first cross beam, a double-faced clock, the hanging alarm rail (kẻng) with its striker, and an
 *  ochre ticket office filling the far part (window with bars, BÁN VÉ board, notices). hour = the clock's time, 0-12. */
export const StationShelter: React.FC<{pos: V3; w?: number; d?: number; h?: number; name?: string; office?: number; hour?: number; clock?: V3; board?: [number, number, number]; bell?: [number, number]}> =
  ({pos, w = 9, d = 4.6, h = 3.0, name = 'GA XUÂN HOÀ', office = 1.5, hour = 4.5, clock, board = [1.5, 0.4, 2.0], bell}) => {
    // board = [x, z, width] of the name board, clock = [x, y, z] of the clock, bell = [x, z] of the alarm rail; all relative
    // to the shelter's left end, so a scene can bring each one into the part of the shelter its camera actually sees
    const posts = useMemo(() => { const out: number[] = []; for (let x = 0.25; x < w; x += 3.4) out.push(x); return out; }, []), pz = d / 2 - 0.3, pitch = 0.32, half = d / 2 + 0.45, rl = half / Math.cos(pitch);
    const face = useMemo(() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d')!; c.fillStyle = '#f6f1e4'; c.beginPath(); c.arc(128, 128, 124, 0, 7); c.fill(); c.strokeStyle = '#2a2a2a'; c.lineWidth = 10; c.stroke();
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.lineWidth = k % 3 ? 5 : 10; c.beginPath(); c.moveTo(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); c.lineTo(128 + Math.sin(a) * 112, 128 - Math.cos(a) * 112); c.stroke(); }
      const hand = (a: number, l: number, lw: number) => { c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(a) * l, 128 - Math.cos(a) * l); c.stroke(); };
      hand((hour / 12) * Math.PI * 2, 58, 12); hand(((hour % 1) * 60 / 60) * Math.PI * 2, 88, 7); c.fillStyle = '#b8322a'; c.beginPath(); c.arc(128, 128, 9, 0, 7); c.fill();
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }, [hour]);
    const iron = '#3f5c4a', wood = '#6b4a32', ochre = '#dcb466';
    return (
      <group position={pos}>
        {posts.map((x) => [-pz, pz].map((z) => <group key={`${x}${z}`}>
          <FacetLathe profile={[[0.17, 0], [0.17, 0.22], [0.1, 0.3], [0.08, h - 0.4], [0.13, h - 0.24], [0.13, h - 0.12]]} sides={8} color={iron} pos={[x, 0, z]} />
          {[-1, 1].map((k) => <B key={k} p={[x + k * 0.28, h - 0.32, z]} s={[0.55, 0.06, 0.06]} c={iron} r={[0, 0, k * 0.7]} cast={false} />)}
        </group>))}
        {[-pz, pz].map((z) => <B key={z} p={[w / 2, h, z]} s={[w, 0.24, 0.16]} c={wood} />)}
        {posts.map((x) => <B key={x} p={[x, h + 0.02, 0]} s={[0.14, 0.2, d - 0.4]} c={wood} />)}
        {/* the roof: two tin slopes from a ridge on z 0, rafters under them, a ridge cap */}
        {[-1, 1].map((k) => <group key={k} position={[w / 2, h + 0.2 + (half / 2) * Math.tan(pitch), (k * half) / 2]} rotation={[k * pitch, 0, 0]}>
          <B p={[0, 0.1, 0]} s={[w + 0.5, 0.05, rl]} c="#9a4e3a" />
          {Array.from({length: Math.floor(w / 0.7) + 1}, (_, i) => <B key={i} p={[-w / 2 + i * 0.7, 0.02, 0]} s={[0.07, 0.1, rl - 0.1]} c="#5c4231" cast={false} />)}
          {[-0.3, 0.3].map((q) => <B key={q} p={[0, 0.0, q * rl]} s={[w + 0.3, 0.08, 0.08]} c="#5c4231" cast={false} />)}
        </group>)}
        <B p={[w / 2, h + 0.3 + half * Math.tan(pitch), 0]} s={[w + 0.55, 0.12, 0.3]} c="#7a3a2c" />
        {/* the open end: a gable board and a scalloped valance of cream boards with a green edge */}
        {[-1, 1].map((k) => <group key={k} position={[-0.27, h + 0.1 + (half / 2) * Math.tan(pitch), (k * half) / 2]} rotation={[k * pitch, 0, 0]}>
          <B p={[0, 0, 0]} s={[0.05, 0.22, rl]} c="#e9dfc6" />{Array.from({length: Math.floor(rl / 0.22)}, (_, i) => <B key={i} p={[0, -0.16, -rl / 2 + 0.11 + i * 0.22]} s={[0.04, 0.12, 0.13]} c={i % 2 ? '#e9dfc6' : '#d8ccb0'} cast={false} />)}
          <B p={[0.01, 0.1, 0]} s={[0.05, 0.04, rl]} c="#3f6a4e" cast={false} />
        </group>)}
        {/* the name board, hung on two rods from the roof, facing the platform */}
        {[-board[2] * 0.42, board[2] * 0.42].map((dx) => <B key={dx} p={[board[0] + dx, h + 0.05, board[1]]} s={[0.03, 0.4, 0.03]} c="#2a2a2a" cast={false} />)}
        <B p={[board[0], h - 0.4, board[1]]} s={[board[2] + 0.09, 0.5, 0.06]} c="#2a2a2a" />
        <Label text={name} p={[board[0], h - 0.4, board[1] + 0.035]} w={board[2]} h={0.42} ink="#1d2a44" bg="#f3eee0" frame="#1d2a44" />
        <Label text={name} p={[board[0], h - 0.4, board[1] - 0.035]} w={board[2]} h={0.42} ink="#1d2a44" bg="#f3eee0" frame="#1d2a44" rotY={Math.PI} />
        {clock && <group position={clock}>
          <B p={[0, 0.34, 0]} s={[0.05, 0.3, 0.05]} c="#2a2a2a" cast={false} />
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.24, 0.24, 0.12, 24]} /><meshLambertMaterial color="#2f4a3a" /></mesh>
          <mesh position={[0, 0, 0.062]}><circleGeometry args={[0.2, 24]} /><meshLambertMaterial map={face} /></mesh>
        </group>}
        {bell && <group position={[bell[0], 0, bell[1]]}>
          <B p={[0, h - 0.45, 0]} s={[0.015, 0.9, 0.015]} c="#2a2a2a" cast={false} /><B p={[0, h - 1.15, 0]} s={[0.12, 0.55, 0.09]} c="#5a4a40" /><B p={[0, h - 1.15, 0.05]} s={[0.04, 0.55, 0.01]} c="#8c6a52" cast={false} />
          <B p={[0.22, h - 0.6, 0]} s={[0.012, 0.6, 0.012]} c="#2a2a2a" cast={false} /><B p={[0.22, h - 1.05, 0]} s={[0.04, 0.32, 0.04]} c="#3a3634" r={[0, 0, 0.1]} />
        </group>}
        {/* the ticket office: an ochre box whose open end faces the platform */}
        {office < w && <group position={[office + (w - office) / 2, 0, -0.1]}>
          <B p={[0, (h - 0.1) / 2, 0]} s={[w - office, h - 0.1, d - 0.9]} c={ochre} />
          <B p={[0, 0.25, 0]} s={[w - office + 0.06, 0.5, d - 0.84]} c="#8f7a5a" />
          <group position={[-(w - office) / 2 - 0.005, 0, 0]}>
            <B p={[0, 1.5, 0.55]} s={[0.04, 0.92, 1.0]} c="#f1ead8" cast={false} /><B p={[-0.01, 1.5, 0.55]} s={[0.04, 0.78, 0.86]} c="#33302c" cast={false} />
            {[-0.3, -0.1, 0.1, 0.3].map((zz) => <B key={zz} p={[-0.025, 1.5, 0.55 + zz]} s={[0.02, 0.78, 0.03]} c="#3f5c4a" cast={false} />)}
            <B p={[-0.1, 1.06, 0.55]} s={[0.22, 0.06, 1.1]} c={wood} />
            <Label text="BÁN VÉ" p={[-0.035, 2.2, 0.55]} w={0.9} h={0.28} ink="#f3e2a8" bg="#7a2a22" rotY={-Math.PI / 2} />
            {[[-0.8, 1.75, '#efe6cf', -3], [-1.1, 1.55, '#e8d9b8', 4], [-0.85, 1.38, '#f2ecdc', 2]].map(([zz, y, col, rot], i) => <mesh key={i} position={[-0.03, y as number, zz as number]} rotation={[0, -Math.PI / 2, ((rot as number) * Math.PI) / 180]}><planeGeometry args={[0.26, 0.34]} /><meshLambertMaterial color={col as string} /></mesh>)}
            <B p={[-0.02, 1.58, -0.95]} s={[0.03, 0.72, 0.62]} c="#6b4a32" cast={false} />
          </group>
        </group>}
      </group>
    );
  };

/** A wooden station bench: three slats and a back rail on two iron end frames. */
export const Bench: React.FC<{pos: V3; rotY?: number; L?: number}> = ({pos, rotY = 0, L = 1.7}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[-1, 1].map((k) => <group key={k} position={[k * (L / 2 - 0.15), 0, 0]}><B p={[0, 0.22, 0.1]} s={[0.06, 0.44, 0.06]} c="#2f3a34" /><B p={[0, 0.22, -0.18]} s={[0.06, 0.44, 0.06]} c="#2f3a34" /><B p={[0, 0.62, -0.2]} s={[0.06, 0.5, 0.05]} c="#2f3a34" r={[-0.15, 0, 0]} /></group>)}
    {[-0.12, 0.02, 0.16].map((z, i) => <B key={z} p={[0, 0.46, z]} s={[L, 0.05, 0.12]} c={i === 1 ? '#9a6e44' : '#8a6038'} />)}
    {[0.66, 0.8].map((y) => <B key={y} p={[0, y, -0.24]} s={[L, 0.1, 0.04]} c="#8a6038" r={[-0.15, 0, 0]} />)}
  </group>
);
/** A platform lamp: a fluted iron post on a base, a curled arm and a square lamp with a small roof (unlit by day). */
export const StationLamp: React.FC<{pos: V3; h?: number; lit?: boolean; bui?: boolean}> = ({pos, h = 3.4, lit, bui = true}) => (
  <group position={pos}>{lit && bui ? <NguonBui kieu="den" pos={[0.48, h - 0.56, 0]} r={0.9} mau="#ffe0a0" /> : null}
    <FacetLathe profile={[[0.2, 0], [0.2, 0.3], [0.1, 0.42], [0.07, h - 0.3], [0.1, h - 0.2], [0.06, h]]} sides={8} color="#33453b" />
    <B p={[0.25, h - 0.15, 0]} s={[0.5, 0.05, 0.05]} c="#33453b" /><B p={[0.48, h - 0.32, 0]} s={[0.03, 0.2, 0.03]} c="#33453b" />
    <B p={[0.48, h - 0.38, 0]} s={[0.32, 0.05, 0.32]} c="#2a3530" /><mesh position={[0.48, h - 0.56, 0]}><boxGeometry args={[0.22, 0.3, 0.22]} />{lit ? <meshBasicMaterial color="#ffe0a0" /> : <meshLambertMaterial color="#e6e0c6" />}</mesh><B p={[0.48, h - 0.73, 0]} s={[0.26, 0.04, 0.26]} c="#2a3530" />
  </group>
);
/** A semaphore signal: a tall lattice-less iron post with a ladder, the red arm with its white band (raised = line clear),
 *  the lamp housing with its coloured glasses, a finial. */
export const Semaphore: React.FC<{pos: V3; h?: number; clear?: boolean}> = ({pos, h = 5.6, clear = true}) => (
  <group position={pos}>
    <B p={[0, 0.2, 0]} s={[0.6, 0.4, 0.6]} c="#a59f93" />
    <FacetLathe profile={[[0.13, 0.4], [0.1, 0.6], [0.08, h], [0.12, h + 0.1], [0.02, h + 0.3]]} sides={8} color="#3a3d42" contact={false} />
    {[-0.12, 0.12].map((x) => <B key={x} p={[x, (h - 0.6) / 2 + 0.4, 0.16]} s={[0.03, h - 0.8, 0.03]} c="#3a3d42" cast={false} />)}
    {Array.from({length: Math.floor((h - 1) / 0.35)}, (_, i) => <B key={i} p={[0, 0.7 + i * 0.35, 0.16]} s={[0.26, 0.025, 0.025]} c="#3a3d42" cast={false} />)}
    <group position={[0.1, h - 0.5, 0.12]} rotation={[0, 0, clear ? 0.75 : 0]}><B p={[0.7, 0, 0]} s={[1.3, 0.24, 0.04]} c="#c23a2c" /><B p={[1.0, 0, 0.025]} s={[0.12, 0.24, 0.01]} c="#f2ede0" cast={false} /></group>
    <B p={[-0.12, h - 0.9, 0.14]} s={[0.22, 0.3, 0.14]} c="#2b2c31" /><mesh position={[-0.12, h - 0.9, 0.215]}><circleGeometry args={[0.06, 12]} /><meshBasicMaterial color={clear ? '#7fd08a' : '#e0503a'} /></mesh>
  </group>
);
/** A line of wooden telegraph poles with a cross-arm, white insulators and two sagging wires (feet = pole positions). */
export const PoleLine: React.FC<{feet: V3[]; h?: number}> = ({feet, h = 6}) => {
  const wires = useMemo(() => { const out: [V3, number, number, number][] = []; for (let i = 1; i < feet.length; i++) [-0.45, 0.45].forEach((o) => { const a = feet[i - 1], b = feet[i], n = 10; for (let k = 0; k < n; k++) { const u0 = k / n, u1 = (k + 1) / n, sag = (u: number) => 4 * u * (1 - u) * 0.35, p0 = [a[0] + (b[0] - a[0]) * u0 + o, h + 0.05 - sag(u0), a[2] + (b[2] - a[2]) * u0], p1 = [a[0] + (b[0] - a[0]) * u1 + o, h + 0.05 - sag(u1), a[2] + (b[2] - a[2]) * u1], dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], l = Math.hypot(dx, dy, dz); out.push([[(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], -Math.atan2(dz, dx), Math.atan2(dy, Math.hypot(dx, dz)), l]); } }); return out; }, []);
  return (
    <>
      {feet.map((p, i) => <group key={i} position={p}><FacetLathe profile={[[0.13, 0], [0.1, h - 0.2], [0.08, h + 0.2]]} sides={7} color={i % 2 ? '#6b5a48' : '#75624e'} seed={i} /><B p={[0, h - 0.05, 0]} s={[1.2, 0.09, 0.09]} c="#6b5a48" />{[-0.45, 0.45].map((x) => <B key={x} p={[x, h + 0.03, 0]} s={[0.06, 0.1, 0.06]} c="#eae6dc" cast={false} />)}</group>)}
      {wires.map(([p, ry, rz, l], i) => <mesh key={`w${i}`} position={p} rotation={[0, ry, rz]}><boxGeometry args={[l + 0.02, 0.018, 0.018]} /><meshBasicMaterial color="#2c2a2a" /></mesh>)}
    </>
  );
};
/** A carrying pole with its two baskets set down (quang gánh): round woven baskets with a darker band, the load heaped in
 *  them (greens, sweet potatoes), the ropes up to the pole lying across. */
export const CarryBaskets: React.FC<{pos: V3; rotY?: number}> = ({pos, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {([[-0.5, '#6f9a48', '#86b057'], [0.5, '#b8743c', '#cf8a4a']] as [number, string, string][]).map(([x, a, b]) => <group key={x} position={[x, 0, 0]}>
      <FacetLathe profile={[[0.2, 0], [0.3, 0.06], [0.32, 0.26], [0.33, 0.3]]} sides={12} color="#b89a5c" tones={[0.8, 1, 1.12]} />
      <FacetLathe profile={[[0.322, 0.12], [0.33, 0.12], [0.33, 0.17], [0.322, 0.17]]} sides={12} color="#7a6038" contact={false} cast={false} />
      <FacetLathe profile={[[0.3, 0.28], [0.26, 0.38], [0.14, 0.44], [0.02, 0.46]]} sides={9} color={a} wobble={0.12} contact={false} tones={[0.9, 1, 1.1]} />
      <FacetLathe profile={[[0.1, 0.38], [0.08, 0.46], [0.02, 0.48]]} sides={7} color={b} contact={false} pos={[0.08, 0, 0.06]} />
      {[[-0.28, 0], [0.28, 0], [0, 0.28]].map(([dx, dz], i) => <B key={i} p={[dx * 0.6, 0.48, dz * 0.6]} s={[0.012, 0.38, 0.012]} c="#4a3a2a" r={[dz * 0.9, 0, -dx * 0.9]} cast={false} />)}
    </group>)}
    <B p={[0, 0.67, 0]} s={[1.8, 0.05, 0.05]} c="#c2a868" r={[0, 0, 0.03]} />
  </group>
);
// (station test) the smoke painter lives with the other flat pictures
import {paintSmoke} from './depth';

/** (station test, stage 2) Moving exhaust smoke for a waiting locomotive: puffs leave the stack one after another, rise,
 *  swell, drift a little downwind and fade. Each puff is one painted picture (three flat tones, the same recipe as
 *  paintSmoke) so it fades as a whole. Particles move on EVERY frame (skill 3), not on twos. Use it in place of
 *  <Locomotive smoke />: pos = the top of the stack in world space; wind = drift in metres over a puff's life (+x = right). */
const puffTex = (() => { const m = new Map<number, THREE.CanvasTexture>(); return (k: number) => {
  let t = m.get(k); if (t) return t;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d')!, r = rnd(70 + k), D = (x: number, y: number, q: number, f: string) => { c.beginPath(); c.arc(x, y, q, 0, 7); c.fillStyle = f; c.fill(); };
  const q = 40, x = 60 + (r() - 0.5) * 6, y = 62 + (r() - 0.5) * 6;
  D(x + q * 0.18, y + q * 0.16, q, '#bdb6ae'); D(x, y, q * 0.92, '#dcd5cc'); D(x - q * 0.24, y - q * 0.22, q * 0.55, '#f1ece4');
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; m.set(k, t); return t; }; })();
export const LocoSmoke: React.FC<{pos: V3; f: number; n?: number; life?: number; rise?: number; wind?: number; size?: number}> = ({pos, f, n = 7, life = 84, rise = 2.3, wind = 0.55, size = 0.5}) => (
  <group position={pos}>
    {Array.from({length: n}, (_, i) => {
      const q = f + (i * life) / n, u = (q % life) / life, gen = Math.floor(q / life), w = Math.sin(gen * 7.3 + i * 2.1);
      // a near-even rise so the young puffs overlap (a fast start strings them out like beads); each generation gets its own
      // sideways wander and size, so the column never repeats exactly
      const w2 = Math.sin(gen * 3.7 + i * 5.3), y = rise * (1 - Math.pow(1 - u, 1.15)), x = wind * u * u + w * 0.16 * u + w2 * 0.04, r = size * (0.5 + 0.8 * u) * (1 + 0.15 * w2), o = u < 0.06 ? u / 0.06 : u > 0.5 ? Math.max(0, (1 - u) / 0.5) : 1;
      return <mesh key={i} position={[x, y + r * 0.4, 0.01 * (n - i)]} renderOrder={3 + Math.round((1 - u) * 10)}><planeGeometry args={[r * 2.6, r * 2.6]} /><meshBasicMaterial map={puffTex(i % 3)} transparent opacity={o} depthWrite={false} /></mesh>;
    })}
  </group>
);

// ---------------------------------------------------------------- life in the air: leaves, specks
/** Leaves on the wind: each falls slowly across the box, drifts with the wind, turns and tumbles, lands and starts again. On every
 *  frame (effects run on ones). box = [x0, x1, top, z0, z1] in world units; wind = metres of sideways drift over one fall.
 *  order: leave 0 for leaves behind the figures; give 600 to a few leaves that pass IN FRONT of them. */
export const FlyingLeaves: React.FC<{f: number; box: [number, number, number, number, number]; n?: number; colors?: string[]; wind?: number; size?: number; seed?: number; order?: number}> =
  ({f, box, n = 14, colors = ['#c8462e', '#d8682e', '#e2a23a', '#b33a2e'], wind = 3, size = 0.1, seed = 5, order = 0}) => {
    const L = useMemo(() => { const r = rnd(seed); return Array.from({length: n}, () => ({x: r(), z: r(), life: 130 + Math.floor(r() * 90), ph: Math.floor(r() * 220), s: 0.7 + r() * 0.7, k: Math.floor(r() * colors.length), w: 0.6 + r() * 0.8})); }, [seed, n]);
    return <>{L.map((q, i) => { const t = ((f + q.ph) % q.life) / q.life, x = box[0] + q.x * (box[1] - box[0]) + wind * q.w * t + Math.sin(f * 0.09 + i * 1.7) * 0.25, y = box[2] * (1 - t) + 0.05, z = box[3] + q.z * (box[4] - box[3]), s = size * q.s;
      return <mesh key={i} position={[x, y, z]} rotation={[0, 0, f * 0.16 * q.w + i]} scale={[s * Math.cos(f * 0.21 * q.w + i * 2.1), s * 0.7, 1]} renderOrder={order}><circleGeometry args={[1, 5]} /><meshBasicMaterial color={colors[q.k]} side={THREE.DoubleSide} transparent={order > 0} depthWrite={order === 0} /></mesh>; })}</>;
  };
/** Specks that float: dust in sunlight (warm, tiny, many), moths round a lamp, sparks. Each drifts slowly round its own place and
 *  swells and fades a little. box = [x0, x1, y0, y1, z0, z1]; glow = a soft halo round each speck (0 = none). */
export const Motes: React.FC<{f: number; box: [number, number, number, number, number, number]; n?: number; color?: string; size?: number; drift?: number; glow?: number; seed?: number}> =
  ({f, box, n = 24, color: color0 = '#ffe6a8', size = 0.018, drift = 0.3, glow = 0.3, seed = 7}) => {
    const bui = useBui(), color = bui.mau(color0, seed);
    const P0 = useMemo(() => { const r = rnd(seed); return Array.from({length: n}, () => [r(), r(), r(), 0.6 + r() * 0.9, r() * 6.28] as const); }, [seed, n]);
    return <><DaCoKhi />{P0.map(([x, y, z, s, ph], i) => { if (!bui.giu(i, n, seed)) return null; const k = 0.8 + 0.3 * Math.sin(f * 0.06 + ph * 3); return <group key={i} position={[box[0] + x * (box[1] - box[0]) + Math.sin(f * 0.012 + ph) * drift, box[2] + y * (box[3] - box[2]) + Math.sin(f * 0.017 + ph * 2) * drift * 0.6, box[4] + z * (box[5] - box[4])]} scale={k}>
      <mesh renderOrder={5}><circleGeometry args={[size * s, 8]} /><meshBasicMaterial color={color} fog={false} transparent depthWrite={false} /></mesh>{glow > 0 && <Halo pos={[0, 0, 0.01]} r={size * s * 5} color={color} strength={glow * bui.sang} bui={false} />}</group>; })}</>;
  };

// ---------------------------------------------------------------- (tesla, set X: shot 6; reused by shot 14) a map insert and a sine wave that draws itself
const inkTexes = new Map<string, THREE.CanvasTexture>();
const inkTex = (key: string, w: number, h: number, paint: (c: Ctx, W: number, H: number) => void) => {
  let t = inkTexes.get(key);
  if (!t) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d')!, w, h); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; inkTexes.set(key, t); }
  return t;
};
const INK_HAND = '"Chalkboard SE", "Noteworthy", "Comic Sans MS", cursive';
/** 0 before `at`, then up past full size and back (graphics move on ones); the same curve as kitLab's popScale */
const popIn = (f: number, at: number, len = 6, over = 0.28) => { const t = (f - at) / len; if (t < 0) return 0; if (t >= 1) return 1; return t < 0.45 ? (t / 0.45) * (1 + over) : 1 + over * Math.cos(((t - 0.45) / 0.55) * Math.PI * 1.5) * (1 - (t - 0.45) / 0.55); };

/** The map of shot 6 (tesla): the north-eastern corner of the United States as a period map, in fractions of the sheet
 *  (x from the left, y from the TOP). ny = the New York dot; towns = the six unnamed towns the wave reaches, in route order. */
export const MAP_NE = {ny: [0.33, 0.62] as [number, number], towns: [[0.31, 0.42], [0.35, 0.22], [0.47, 0.13], [0.6, 0.27], [0.72, 0.19], [0.84, 0.34]] as [number, number][],
  /** "xoay chiều" goes here (centre), clear of the route and the river */
  label2: [0.47, 0.335] as [number, number]};
/** A period map on cream paper: the coast from New Jersey round Long Island to Cape Cod in brown ink, the sea washed grey-blue
 *  with hatching along the shore, two great lakes and a long narrow lake, the Hudson running north from New York, hills hatched
 *  in the north, a faint grid, fold creases, foxing; a bold dot "NEW YORK", six small unnamed town rings, a scale bar
 *  "100 km" (its length = one sixth of the route through the towns, so the route reads "hundreds of kilometres"). */
export const paintMapNE = (seed = 1) => (c: Ctx, W: number, H: number) => {
  const r = rnd(seed), X = (x: number) => x * W, Y = (y: number) => y * H, ink = '#5a3a22';
  c.fillStyle = '#eee2c2'; c.fillRect(0, 0, W, H);
  for (let k = 0; k < 900; k++) { c.fillStyle = `rgba(${150 + r() * 40},${120 + r() * 30},${70 + r() * 20},${0.03 + r() * 0.05})`; const q = 2 + r() * 14; c.beginPath(); c.arc(r() * W, r() * H, q, 0, 7); c.fill(); }
  const vg = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(120,80,30,0)'); vg.addColorStop(1, 'rgba(120,80,30,0.28)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  // faint grid of parallels and meridians
  c.strokeStyle = 'rgba(90,60,30,0.16)'; c.lineWidth = 2; for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(0, Y(k / 6)); c.quadraticCurveTo(W / 2, Y(k / 6) - H * 0.02, W, Y(k / 6)); c.stroke(); } for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(X(k / 8) - W * 0.02, 0); c.lineTo(X(k / 8) + W * 0.02, H); c.stroke(); }
  // the coast (land up and left, sea down and right)
  const coast: [number, number][] = [[0.19, 1.02], [0.235, 0.86], [0.265, 0.76], [0.3, 0.68], [0.322, 0.64], [0.345, 0.6], [0.42, 0.565], [0.52, 0.53], [0.6, 0.505], [0.68, 0.475], [0.74, 0.458], [0.765, 0.485], [0.8, 0.462], [0.84, 0.47], [0.88, 0.505], [0.93, 0.495], [0.955, 0.44], [0.93, 0.405], [0.9, 0.43], [0.865, 0.37], [0.875, 0.29], [0.9, 0.19], [0.95, 0.09], [1.03, -0.02]];
  const wob = (pts: [number, number][], s = 0.006) => pts.map(([x, y], i) => [X(x + (i % 3 ? (r() - 0.5) * s : 0)), Y(y + (i % 3 ? (r() - 0.5) * s : 0))] as [number, number]);
  const cp = wob(coast), path = (pts: [number, number][], close = false) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath(); };
  path([...cp, [W * 1.1, -H * 0.1], [W * 1.1, H * 1.1], [X(0.19), H * 1.1]], true); c.fillStyle = '#cdd6cf'; c.fill();
  // hatching along the shore on the sea side
  c.save(); c.clip(); c.strokeStyle = 'rgba(70,90,100,0.35)'; c.lineWidth = 2; for (let d = 10; d < 60; d += 14) { c.beginPath(); cp.forEach(([x, y], i) => (i ? c.lineTo(x + d * 0.7, y + d * 0.7) : c.moveTo(x + d * 0.7, y + d * 0.7))); c.stroke(); } c.restore();
  c.strokeStyle = ink; c.lineWidth = 4; c.lineJoin = 'round'; path(cp); c.stroke();
  // Long Island
  const li = wob([[0.352, 0.628], [0.4, 0.607], [0.48, 0.592], [0.56, 0.577], [0.615, 0.568], [0.605, 0.586], [0.5, 0.622], [0.42, 0.642], [0.36, 0.652]], 0.003);
  path(li, true); c.fillStyle = '#eee2c2'; c.fill(); c.stroke();
  // lakes: two great lakes at the top left, a long narrow lake in the north
  const lake = (x: number, y: number, rx: number, ry: number, a: number) => { c.beginPath(); c.ellipse(X(x), Y(y), X(rx), Y(ry), a, 0, 7); c.fillStyle = '#c6d2d0'; c.fill(); c.lineWidth = 3; c.stroke(); };
  lake(0.1, 0.09, 0.12, 0.045, -0.12); lake(-0.04, 0.33, 0.09, 0.05, -0.5); lake(0.392, 0.1, 0.008, 0.07, 0.05);
  // the Hudson, north from New York
  c.lineWidth = 3.5; c.strokeStyle = '#6a7e86'; c.beginPath(); c.moveTo(X(0.33), Y(0.625)); c.bezierCurveTo(X(0.34), Y(0.52), X(0.318), Y(0.44), X(0.33), Y(0.36)); c.bezierCurveTo(X(0.345), Y(0.26), X(0.33), Y(0.18), X(0.345), Y(0.0)); c.stroke();
  // hills in the north, little hatched humps
  c.strokeStyle = 'rgba(90,58,34,0.45)'; c.lineWidth = 2; for (let k = 0; k < 26; k++) { const x = X(0.15 + r() * 0.16), y = Y(0.18 + r() * 0.16), s = 10 + r() * 10; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x, y - s * 1.1, x + s, y); c.stroke(); for (let h = -2; h <= 2; h++) { c.beginPath(); c.moveTo(x + h * s * 0.3, y - s * 0.25); c.lineTo(x + h * s * 0.3 + s * 0.15, y); c.stroke(); } }
  for (let k = 0; k < 18; k++) { const x = X(0.52 + r() * 0.2), y = Y(0.04 + r() * 0.1), s = 8 + r() * 8; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x, y - s, x + s, y); c.stroke(); }
  // towns (unnamed) and New York
  MAP_NE.towns.forEach(([x, y]) => { c.beginPath(); c.arc(X(x), Y(y), 9, 0, 7); c.fillStyle = '#eee2c2'; c.fill(); c.lineWidth = 3; c.strokeStyle = ink; c.stroke(); c.beginPath(); c.arc(X(x), Y(y), 3, 0, 7); c.fillStyle = ink; c.fill(); });
  const [nx, ny] = MAP_NE.ny; c.beginPath(); c.arc(X(nx), Y(ny), 13, 0, 7); c.fillStyle = '#2a1a10'; c.fill();
  c.fillStyle = '#2a1a10'; c.font = 'bold 40px Georgia, "Times New Roman", serif'; c.textAlign = 'right'; c.fillText('NEW YORK', X(nx) - 22, Y(ny) + 50);
  // the scale bar, bottom right, on the sea: one sixth of the route
  let L = 0; [MAP_NE.ny, ...MAP_NE.towns].forEach((p, i, a) => { if (i) L += Math.hypot(X(p[0] - a[i - 1][0]), Y(p[1] - a[i - 1][1])); });
  const sb = L / 6, sx = W * 0.95 - sb, sy = H * 0.9;
  for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#eee2c2' : '#2a1a10'; c.fillRect(sx + (k * sb) / 4, sy, sb / 4, 12); } c.strokeStyle = '#2a1a10'; c.lineWidth = 2.5; c.strokeRect(sx, sy, sb, 12);
  c.fillStyle = '#2a1a10'; c.font = 'bold 30px Georgia, serif'; c.textAlign = 'center'; c.fillText('0', sx, sy - 12); c.fillText('100 km', sx + sb, sy - 12);
  // a small compass rose on the land, bottom left
  const cx = X(0.08), cy = Y(0.8); c.fillStyle = ink; c.beginPath(); c.moveTo(cx, cy - 46); c.lineTo(cx + 9, cy); c.lineTo(cx, cy + 30); c.lineTo(cx - 9, cy); c.closePath(); c.fill(); c.font = 'bold 26px Georgia, serif'; c.fillText('N', cx, cy - 54);
  // the border, fold creases, a water stain on the sea
  c.strokeStyle = ink; c.lineWidth = 5; c.strokeRect(14, 14, W - 28, H - 28); c.lineWidth = 1.5; c.strokeRect(24, 24, W - 48, H - 48);
  c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(W / 2 - 2, 0, 4, H); c.fillRect(0, H / 2 - 2, W, 4); c.fillStyle = 'rgba(90,60,20,0.08)'; c.fillRect(W / 2 + 2, 0, 3, H);
  c.fillStyle = 'rgba(130,90,40,0.10)'; c.beginPath(); c.ellipse(X(0.62), Y(0.8), 60, 40, 0.3, 0, 7); c.fill();
};
export const mapNETex = () => inkTex('map-ne-1', 1550, 1000, paintMapNE(1));

/** The route of a travelling wave: a smooth curve through `pts` (local plane units, x right, y up). at[i] = the share of the
 *  route's length at which the curve passes pts[i] (for timing what happens when the wave reaches a point). */
export const wavePath = (pts: [number, number][]) => {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal');
  const N = 400, S = Array.from({length: N + 1}, (_, i) => curve.getPointAt(i / N));
  return {curve, length: curve.getLength(), at: pts.map(([x, y]) => { let b = 0, d = 1e9; S.forEach((p, i) => { const q = Math.hypot(p.x - x, p.y - y); if (q < d) { d = q; b = i; } }); return b / N; })};
};
/** A SINE WAVE THAT DRAWS ITSELF along a route: a flat ink ribbon lying in the local x-y plane, shown from the start of the route
 *  up to `progress` (0..1), with a bright head while it is still travelling. amp, wave (wavelength), width in local units;
 *  phase moves the crests along (pass a phase that grows with f, at progress 1, for a wave that keeps running along a wire).
 *  Lit by the room and a little self-lit (emissive) so it reads as graphics. */
export const SineWave: React.FC<{pts: [number, number][]; progress: number; amp?: number; wave?: number; width?: number; color?: string; phase?: number; head?: boolean; emissive?: number; order?: number}> =
  ({pts, progress, amp = 0.006, wave = 0.022, width = 0.0035, color = '#2a62c9', phase = 0, head = true, emissive = 0.45, order = 6}) => {
    const route = useMemo(() => wavePath(pts), [pts]);
    const p = Math.min(1, Math.max(0, progress)), upto = p * route.length;
    const geo = useMemo(() => {
      if (upto <= 1e-6) return null;
      const n = Math.max(2, Math.ceil(upto / (wave / 24)) + 1), cs: THREE.Vector2[] = [];
      for (let k = 0; k < n; k++) { const s = (k / (n - 1)) * upto, u = s / route.length, q = route.curve.getPointAt(u), t = route.curve.getTangentAt(u), taper = Math.min(1, s / (wave * 0.6)); cs.push(new THREE.Vector2(q.x - t.y * amp * taper * Math.sin((2 * Math.PI * s) / wave + phase), q.y + t.x * amp * taper * Math.sin((2 * Math.PI * s) / wave + phase))); }
      const pos: number[] = [], idx: number[] = [];
      cs.forEach((q, k) => { const a = cs[Math.max(0, k - 1)], b = cs[Math.min(n - 1, k + 1)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1, nx = (-ty / l) * width / 2, ny = (tx / l) * width / 2; pos.push(q.x + nx, q.y + ny, 0, q.x - nx, q.y - ny, 0); if (k) { const i = 2 * k; idx.push(i - 2, i - 1, i, i - 1, i + 1, i); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return {g, end: cs[n - 1]};
    }, [route, upto, amp, wave, width, phase]);
    if (!geo) return null;
    return <group>
      <mesh geometry={geo.g} renderOrder={order}><meshLambertMaterial color={color} emissive={color} emissiveIntensity={emissive} side={THREE.DoubleSide} transparent depthWrite={false} /></mesh>
      {head && p < 1 ? <><mesh position={[geo.end.x, geo.end.y, 0.001]} renderOrder={order + 1}><circleGeometry args={[width * 1.3, 12]} /><meshBasicMaterial color="#e8f4ff" transparent depthWrite={false} /></mesh><Halo pos={[geo.end.x, geo.end.y, 0.002]} r={width * 7} color="#8fc4ff" strength={0.7} /></> : null}
    </group>;
  };
/** Hand-written words in ink on paper (a transparent plane): "một chiều" in red, "xoay chiều" in blue. h = letter height. */
export const InkWords: React.FC<{text: string; pos: V3; h: number; color?: string; scale?: number; emissive?: number}> = ({text, pos, h, color = '#c8302a', scale = 1, emissive = 0.35}) => {
  const map = inkTex(`ink-${text}-${color}`, 1024, 256, (c, W, H) => { c.fillStyle = color; c.font = `bold 150px ${INK_HAND}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H * 0.55, W * 0.96); });
  return scale > 0 ? <mesh position={pos} scale={[scale, scale, 1]} renderOrder={7}><planeGeometry args={[h * 4 * 1.5, h * 1.5]} /><meshLambertMaterial map={map} transparent depthWrite={false} emissive={color} emissiveIntensity={emissive} /></mesh> : null;
};
const ringInk = () => inkTex('ink-ring-small', 256, 256, (c) => { c.lineCap = 'round'; c.strokeStyle = '#c8302a'; c.lineWidth = 16; c.beginPath(); for (let i = 0; i <= 80; i++) { const a = -2.4 + (i / 80) * (Math.PI * 2 + 0.6), q = 1 + 0.05 * Math.sin(a * 3 + 1); const x = 128 + Math.cos(a) * 100 * q, y = 128 + Math.sin(a) * 92 * q + (i / 80) * 10 - 5; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); });
/** THE MAP INSERT, all of it, on a pinned sheet (same placement as kitLab's Sheet: centre x, y, size w x h, a little in front of
 *  the board at z): the map, four pins, then on frame f: a small red ring round New York with "một chiều" (from t.ring), the
 *  blue wave drawn from New York through the six towns (t.wave = [from, to] frames), each town popping into a yellow light
 *  with a small glow as the wave reaches it, and "xoay chiều" in blue (t.label2). The lights twinkle a little after. */
export const MapInsert: React.FC<{f: number; x: number; y: number; w: number; h: number; z?: number; t?: {ring: number; wave: [number, number]; label2: number}}> =
  ({f, x, y, w, h, z = 0.06, t = {ring: 2, wave: [14, 50], label2: 52}}) => {
    const L = (p: [number, number]): [number, number] => [-w / 2 + p[0] * w, h / 2 - p[1] * h], route = useMemo(() => [MAP_NE.ny, ...MAP_NE.towns].map(L), [w, h]);
    const at = useMemo(() => wavePath(route).at, [route]), prog = Math.min(1, Math.max(0, (f - t.wave[0]) / (t.wave[1] - t.wave[0])));
    const ny = L(MAP_NE.ny), lb = L(MAP_NE.label2), rs = popIn(f, t.ring, 7, 0.3), u = w / 0.9;
    return <group position={[x, y, z]}>
      <mesh receiveShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={mapNETex()} /></mesh>
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([a, b], i) => <mesh key={i} position={[a * (w / 2 - 0.022), b * (h / 2 - 0.022), 0.004]}><circleGeometry args={[0.011, 10]} /><meshLambertMaterial color={i % 2 ? '#c9a24a' : '#c8372d'} /></mesh>)}
      {rs > 0 ? <mesh position={[ny[0], ny[1], 0.003]} scale={[rs, rs, 1]} renderOrder={6}><planeGeometry args={[0.05 * u, 0.05 * u]} /><meshLambertMaterial map={ringInk()} transparent depthWrite={false} emissive="#c8302a" emissiveIntensity={0.3} /></mesh> : null}
      <InkWords text="một chiều" pos={[ny[0] - 0.1 * u, ny[1] + 0.045 * u, 0.004]} h={0.026 * u} color="#c8302a" scale={popIn(f, t.ring + 2, 7, 0.3)} />
      <group position={[0, 0, 0.005]}><SineWave pts={route} progress={prog} amp={0.0065 * u} wave={0.024 * u} width={0.0038 * u} /></group>
      {route.slice(1).map((p, i) => { const reach = t.wave[0] + at[i + 1] * (t.wave[1] - t.wave[0]), s = popIn(f, reach, 6, 0.4); if (s <= 0) return null; const tw = 1 + 0.12 * Math.sin(f * 0.7 + i * 2.3) * Math.min(1, (f - reach) / 10);
        return <group key={i} position={[p[0], p[1], 0.007]} scale={[s, s, 1]}><mesh renderOrder={8}><circleGeometry args={[0.0085 * u, 14]} /><meshBasicMaterial color="#ffd23a" transparent depthWrite={false} /></mesh><Halo pos={[0, 0, 0.001]} r={0.034 * u * tw} color="#ffcf4a" strength={0.75} /></group>; })}
      <InkWords text="xoay chiều" pos={[lb[0], lb[1], 0.006]} h={0.03 * u} color="#2a62c9" scale={popIn(f, t.label2, 7, 0.3)} />
    </group>;
  };

// ---------------------------------------------------------------- things held in a hand (d1c2 acting, 22/11/2026)
// The mould cannot hold things: each of these is placed every frame at the hand of the acted figure (the shot file computes the
// hand from the arm pose), at least 0.15 m in front of the figure's card. pos = the point the hand grips.
/** A hand torch: a wooden stick held at pos (0.28 m below the grip, 0.34 above), a pitch-soaked wrap, a live flame (f), a warm
 *  halo and its own orange light (light = false to leave the light out). tilt = lean of the stick in radians (+ = top to screen left). */
export const HandTorch: React.FC<{pos: V3; f?: number; k?: number; tilt?: number; light?: boolean; seed?: number; bui?: boolean}> = ({pos, f = 0, k = 1, tilt = 0, light = true, seed = 1, bui = true}) => {
  const fl = 1 + 0.08 * Math.sin(f * 0.41 + seed) + 0.05 * Math.sin(f * 0.93 + seed * 2);
  return (
    <group position={pos} rotation={[0, 0, tilt]}>
      <FacetLathe profile={[[0.018, -0.28], [0.022, 0.0], [0.026, 0.28], [0.03, 0.3]]} sides={8} color="#5a3e26" contact={false} tones={[0.8, 1, 1.1]} />
      <FacetLathe profile={[[0.034, 0.24], [0.05, 0.28], [0.054, 0.36], [0.046, 0.4]]} sides={9} color="#2c241e" contact={false} tones={[0.8, 1, 0.9]} />
      <group position={[0, 0.3, 0.02]} scale={[k * fl, k * fl * 1.15, 1]}><Flame f={f + seed * 13} w={0.22} bui={bui} /></group>
      <Halo pos={[0, 0.48, 0.06]} r={0.6 * fl * k} color="#ffa24a" strength={0.45} order={4} />
      {light ? <pointLight position={[0, 0.5, 0.35]} color="#ff9a4e" intensity={3.2 * k * fl} distance={6} decay={1.5} /> : null}
    </group>
  );
};
/** A long pole held upright at pos: below = metres of shaft under the grip (to the ground for a spear at rest), above = over it.
 *  tip 'spear' = an iron leaf blade with a collar and a red tuft (the Baron's men); 'staff' = a plain rounded top. */
export const HeldPole: React.FC<{pos: V3; below?: number; above?: number; tip?: 'spear' | 'staff'; wood?: string; tilt?: number}> = ({pos, below = 1.0, above = 1.3, tip = 'spear', wood = '#6a4a30', tilt = 0}) => (
  <group position={pos} rotation={[0, 0, tilt]}>
    <mesh position={[0, (above - below) / 2, 0]} castShadow><cylinderGeometry args={[0.018, 0.02, above + below, 7]} /><meshLambertMaterial color={wood} /></mesh>
    {tip === 'spear' ? <group position={[0, above, 0]}>
      <FacetLathe profile={[[0.026, -0.02], [0.03, 0.04], [0.022, 0.08]]} sides={8} color="#4a4c50" contact={false} />
      <mesh position={[0, 0.2, 0]} scale={[0.055, 0.2, 0.014]} castShadow><octahedronGeometry args={[1, 0]} /><meshLambertMaterial color="#b8bec4" /></mesh>
      <mesh position={[0.012, 0.2, 0.008]} scale={[0.02, 0.17, 0.008]}><octahedronGeometry args={[1, 0]} /><meshLambertMaterial color="#e2e6ea" /></mesh>
      <mesh position={[0, -0.05, 0]}><sphereGeometry args={[0.045, 7, 5]} /><meshLambertMaterial color="#9a2a22" /></mesh>
    </group> : <mesh position={[0, above, 0]}><sphereGeometry args={[0.03, 7, 5]} /><meshLambertMaterial color={wood} /></mesh>}
  </group>
);
/** A turned wooden bowl, empty, tipped towards the lens by tip (radians) so its dark inside shows. pos = centre of the rim. */
export const WoodBowl: React.FC<{pos: V3; s?: number; tip?: number; color?: string}> = ({pos, s = 1, tip = 0.55, color = '#8a5a34'}) => (
  <group position={pos} rotation={[tip, 0, 0]} scale={s}>
    <FacetLathe profile={[[0.0, -0.075], [0.05, -0.075], [0.085, -0.05], [0.105, -0.015], [0.11, 0.0], [0.1, 0.005]]} sides={14} color={color} contact={false} tones={[0.7, 0.85, 1, 1.15, 1.2]} />
    {/* the inside: a lighter rim ring and the dark hollow, laid just over the turned shell so it always shows */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><circleGeometry args={[0.108, 18]} /><meshLambertMaterial color="#b07a48" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}><circleGeometry args={[0.092, 18]} /><meshLambertMaterial color="#4a2e1a" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.012, 0.016, 0.02]}><circleGeometry args={[0.05, 14]} /><meshLambertMaterial color="#33200f" /></mesh>
  </group>
);
/** A hand lantern hanging from the hand at pos: a bail handle, a tin cap, four glass sides lit from inside, its own warm light.
 *  lit = false for a dark one. f makes the flame breathe. */
export const HandLantern: React.FC<{pos: V3; lit?: boolean; f?: number; swing?: number; bui?: boolean}> = ({pos, lit = true, f = 0, swing = 0, bui = true}) => {
  const fl = 1 + 0.06 * Math.sin(f * 0.37) + 0.03 * Math.sin(f * 0.91);
  return (
    <group position={pos} rotation={[0, 0, swing]}>
      <mesh position={[0, -0.04, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.05, 0.006, 5, 12, Math.PI]} /><meshLambertMaterial color="#2a2622" /></mesh>
      <FacetLathe profile={[[0.012, -0.05], [0.05, -0.1], [0.09, -0.13], [0.09, -0.14]]} sides={4} color="#3a342c" contact={false} />
      <mesh position={[0, -0.25, 0]} rotation={[0, Math.PI / 4, 0]}><cylinderGeometry args={[0.085, 0.085, 0.22, 4, 1, true]} /><meshBasicMaterial color={lit ? '#ffd27a' : '#5a5040'} side={THREE.DoubleSide} /></mesh>
      {[0, 1, 2, 3].map((i) => <B key={i} p={[Math.cos(i * Math.PI / 2 + Math.PI / 4) * 0.085 * 0.72, -0.25, Math.sin(i * Math.PI / 2 + Math.PI / 4) * 0.085 * 0.72 + 0.01]} s={[0.012, 0.23, 0.012]} c="#2a2622" cast={false} />)}
      <FacetLathe profile={[[0.09, -0.37], [0.095, -0.37], [0.095, -0.4], [0.06, -0.41]]} sides={4} color="#3a342c" contact={false} />
      {lit ? <><mesh position={[0, -0.25, 0.09]} renderOrder={5}><circleGeometry args={[0.03 * fl, 10]} /><meshBasicMaterial color="#fff4c8" transparent depthWrite={false} /></mesh>
        <Halo pos={[0, -0.25, 0.1]} r={0.42 * fl} color="#ffc060" strength={0.5} order={4} />{bui ? <NguonBui kieu="nen" pos={[0, -0.25, 0.05]} mau="#ffc060" /> : null}
        <pointLight position={[0, -0.22, 0.3]} color="#ffbe6a" intensity={2.4 * fl} distance={5} decay={1.6} /></> : null}
    </group>
  );
};
