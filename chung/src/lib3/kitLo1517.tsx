import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rnd, P, Ctx} from './depth';
import {B} from './kit';
import {tex} from './kitLab';
import {Halo} from './look';
import {Pipe} from './kitHamMay';

/** lib3/kitLo1517 (24/11/2026): đồ của lô cuối, chương 15-17 của Doom. Cắt giấy: mảng phẳng, mép sắc, hai ba sắc mỗi vùng, không khối cầu. Mét, y lên.
 *  A. Máy của pháo đài (chương 15, 16): buồng kính có cửa và khoá (`BuongKinh`), buồng vỡ (`BuongVo`), ăng ten ba đĩa (`AngTen`), núm vặn hai mặt (`NumVan`),
 *     dải đèn trên bàn (`DenBan`), màn hình phụ (`ManHinhPhu`), hình trong màn tròn (`HinhManTron`), cột sáng xanh (`CotSangXanh`).
 *  B. Hiệu ứng: sóng thao túng 12 cạnh gãy góc, có nhịp nứt năm mảnh (`SongThaoTung`), vòng quét sàn (`SongSan`), kính vỡ bay (`KinhVo`), màn xanh trên trời (`ManXanh`).
 *  C. Đồ nhỏ: con dấu mặt nạ (`ConDau`, `DauMuc`), chồng giấy (`XapGiay`), thóc (`Thoc`), súng dựng chụm và mũ sắt (`SungChum`), cờ trơn trên giá (`CoTron`), chữ sắt và số nung (`ChuSat`, `SoNung`). */
type V3 = [number, number, number];
export const MAU_TIM = {loi: '#efe0ff', giua: '#b878ff', rim: '#5a2a9a'};
export const MAU_XANH = {loi: '#eafff2', giua: '#3dff8e', rim: '#0f7a45'};
export type MauMay = 'tim' | 'xanh';
const mauOf = (m: MauMay) => (m === 'tim' ? MAU_TIM : MAU_XANH);
const lerpC = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t))).getHexString();
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const poly = (pts: number[][]) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return new THREE.ShapeGeometry(s); };

// ================================================================ A. máy của pháo đài
/** BUỒNG KÍNH CÓ CỬA VÀ KHOÁ. Gốc = tâm bệ tròn (y 0,185 là mặt bệ; truyền pos = tâm bệ, y 0,185 đã cộng sẵn). Thân kính r 0,75 cao 2,6, ba đai thép, hai sườn thép, nắp, nền sáng.
 *  `cua` 0..1: cửa kính cong (cung ±57° ở mặt trước +z) cuốn từ nắp xuống (0 = mở, 1 = sập; mép dưới có thanh thép chạy theo).
 *  `khoa` 0..3: ba khoá kẹp đồng to bản ở mép phải cửa, mỗi khoá xoay từ chìa ra (0) sang kẹp ngang khe (1); khoá i đóng khi khoa > i.
 *  `sang` 0..1: ánh trong buồng (màu `mau`); `wave` 0..1: vòng sáng gợn chạy lên kính (cảnh gã đập kính). Nắp cao tới y = pos[1] + 2,6 + 0,265. */
export const BUONG = {r: 0.75, h: 2.6, nap: 0.265, goc: 1.0};
export const BuongKinh: React.FC<{pos: V3; f?: number; cua?: number; khoa?: number; sang?: number; mau?: MauMay; wave?: number; r?: number; h?: number}> = ({pos, f = 0, cua = 1, khoa = 3, sang = 0.4, mau = 'xanh', wave = 0, r = BUONG.r, h = BUONG.h}) => {
  const M = mauOf(mau), a = BUONG.goc, nap = BUONG.nap, top = h + nap;
  const body = useMemo(() => new THREE.CylinderGeometry(r, r, h, 10, 1, true), [r, h]);
  const door = useMemo(() => new THREE.CylinderGeometry(r * 1.03, r * 1.03, h, 8, 1, true, -a, 2 * a), [r, h]);
  const tint = lerpC('#b8e4ff', M.giua, sang * 0.5);
  const cm = clamp01(cua);
  const klk = (i: number) => clamp01(khoa - i);
  return (
    <group position={pos}>
      {/* chân buồng: vành thép dày, viền đồng, nền sáng */}
      <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[r * 1.2, r * 1.26, 0.14, 10]} /><meshLambertMaterial color="#3a424a" flatShading /></mesh>
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[r * 1.12, r * 1.2, 0.04, 10]} /><meshLambertMaterial color="#c9a02c" flatShading /></mesh>
      <mesh position={[0, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r * 1.05, 10]} /><meshBasicMaterial color={lerpC('#3a4852', M.giua, sang)} toneMapped={false} /></mesh>
      {/* thân kính */}
      <mesh geometry={body} position={[0, h / 2 + 0.14, 0]}><meshLambertMaterial color={tint} transparent opacity={0.2 + sang * 0.1} flatShading side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh position={[r * 0.5, h / 2 + 0.14, r * 0.78]} rotation={[0, 0.55, 0]}><planeGeometry args={[r * 0.2, h * 0.8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} /></mesh>
      <mesh position={[-r * 0.3, h / 2 + 0.14, r * 0.94]} rotation={[0, -0.3, 0]}><planeGeometry args={[r * 0.07, h * 0.7]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} /></mesh>
      {/* ba đai thép và sườn đứng */}
      {[0.5, 1.3, 2.1].map((y) => <mesh key={y} position={[0, y + 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r * 1.02, 0.05, 4, 10]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>)}
      {[Math.PI * 0.62, -Math.PI * 0.62, Math.PI * 1.0].map((q, i) => <B key={i} p={[Math.sin(q) * r * 1.02, h / 2 + 0.14, Math.cos(q) * r * 1.02]} s={[0.09, h, 0.09]} c="#59646c" r={[0, q, 0]} />)}
      {/* cửa kính cong cuốn từ nắp xuống: nhóm neo ở đỉnh, co giãn theo cua */}
      {cm > 0.01 ? <group position={[0, h + 0.14, 0]} scale={[1, cm, 1]}>
        <mesh geometry={door} position={[0, -h / 2, 0]}><meshLambertMaterial color={lerpC('#cfeaff', M.giua, sang * 0.35)} transparent opacity={0.34} flatShading side={THREE.DoubleSide} depthWrite={false} /></mesh>
        {[-a, a].map((q, i) => <B key={i} p={[Math.sin(q) * r * 1.04, -h / 2, Math.cos(q) * r * 1.04]} s={[0.08, h, 0.08]} c="#6a747c" r={[0, q, 0]} />)}
        <mesh position={[0, -h + 0.04, 0]}><cylinderGeometry args={[r * 1.05, r * 1.05, 0.1 / Math.max(cm, 0.2), 8, 1, false, -a, 2 * a]} /><meshLambertMaterial color="#c9a02c" flatShading /></mesh>
        <mesh position={[0, -h * 0.5, 0]}><cylinderGeometry args={[r * 1.045, r * 1.045, 0.06, 8, 1, true, -a, 2 * a]} /><meshLambertMaterial color="#8a949c" flatShading side={THREE.DoubleSide} /></mesh>
      </group> : null}
      {/* ba khoá kẹp đồng bản to, ở mép phải; chốt cố định trên phần kính cố định */}
      {[0.55, 1.35, 2.15].map((y, i) => { const phi = a + 0.2, px = Math.sin(phi) * r * 1.08, pz = Math.cos(phi) * r * 1.08, ang = (1 - klk(i)) * 1.35;
        return (
          <group key={i} position={[px, y + 0.14, pz]} rotation={[0, phi, 0]}>
            <B p={[0, 0, 0]} s={[0.16, 0.2, 0.14]} c="#2d3238" />
            <group rotation={[0, ang, 0]}><B p={[-0.3, 0, 0.02]} s={[0.66, 0.2, 0.07]} c="#c9a02c" /><B p={[-0.3, 0.115, 0.02]} s={[0.66, 0.035, 0.075]} c="#e8c85a" cast={false} /><B p={[-0.62, 0, 0.02]} s={[0.12, 0.28, 0.1]} c="#8a6a1c" /></group>
            {klk(i) > 0.95 ? <Halo pos={[-0.3, 0, 0.1]} r={0.3} color="#fff0b0" strength={0.22} /> : null}
          </group>);
      })}
      {/* nắp: vành thép, mũ nắp, bốn cổng ống */}
      <mesh position={[0, h + 0.14 + nap / 2, 0]}><cylinderGeometry args={[r * 1.18, r * 1.18, nap, 10]} /><meshLambertMaterial color="#4a545c" flatShading /></mesh>
      <mesh position={[0, h + 0.14 + nap + 0.03, 0]}><cylinderGeometry args={[r * 0.9, r * 1.1, 0.07, 10]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>
      {[0, 1, 2, 3].map((i) => { const q = Math.PI / 4 + i * (Math.PI / 2); return <B key={i} p={[Math.sin(q) * r * 0.72, top + 0.2, Math.cos(q) * r * 0.72]} s={[0.16, 0.14, 0.16]} c="#c9a02c" />; })}
      {/* ánh trong buồng */}
      {sang > 0.02 ? <><Halo pos={[0, 1.4, 0.2]} r={r * 2.2} color={M.giua} strength={0.3 * sang} /><pointLight position={[0, 1.4, r + 0.5]} color={M.giua} intensity={5 * sang} distance={7} decay={1.4} /></> : null}
      {wave > 0 ? [0, 0.5].map((o, i) => <mesh key={i} position={[0, 0.5 + (((f * 0.04) + o) % 1) * (h - 0.4), 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * 0.98, r * 1.05, 10]} /><meshBasicMaterial color="#e8f8ff" transparent opacity={0.8 * wave} toneMapped={false} /></mesh>) : null}
    </group>
  );
};

/** BUỒNG VỠ (cuối chương 16, `phao-dai` đổ nát): vành chân còn nguyên, các cọc kính lởm chởm đủ cao, nắp rơi nghiêng, cửa nằm trên sàn, mảnh kính rải quanh. */
export const BuongVo: React.FC<{pos: V3; f?: number; r?: number; seed?: number; napO?: V3}> = ({pos, f = 0, r = BUONG.r, seed = 3, napO = [-1.7, 0.45, 0.9]}) => {
  const L = useMemo(() => { const q = rnd(seed * 11 + 2); return Array.from({length: 9}, (_, i) => ({a: (i / 9) * 6.28 + q() * 0.3, h: 0.25 + q() * 1.15, w: 0.2 + q() * 0.25})); }, [seed]);
  const S = useMemo(() => { const q = rnd(seed * 7 + 5); return Array.from({length: 34}, () => ({x: (q() - 0.5) * 3.8, z: (q() - 0.3) * 3.4, s: 0.07 + q() * 0.2, ry: q() * 6.2, tilt: q() * 0.5})); }, [seed]);
  return (
    <group position={pos}>
      <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[r * 1.2, r * 1.26, 0.14, 10]} /><meshLambertMaterial color="#3a424a" flatShading /></mesh>
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[r * 1.12, r * 1.2, 0.04, 10]} /><meshLambertMaterial color="#c9a02c" flatShading /></mesh>
      <mesh position={[0, 0.172, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r * 1.05, 10]} /><meshBasicMaterial color="#1c2a24" toneMapped={false} /></mesh>
      {L.map((q, i) => <mesh key={i} position={[Math.sin(q.a) * r, 0.14 + q.h / 2, Math.cos(q.a) * r]} rotation={[0, q.a, (i % 2 ? 1 : -1) * 0.06]}><coneGeometry args={[q.w, q.h, 3]} /><meshLambertMaterial color="#cfe6ee" transparent opacity={0.55} flatShading /></mesh>)}
      {[0.4, 1.0].map((y, i) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2 + i * 0.1, 0, 0]}><torusGeometry args={[r * 1.02, 0.05, 4, 10, 4.2 - i * 1.4]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>)}
      <group position={napO} rotation={[0.2, 0.8, 0.4]}><mesh><cylinderGeometry args={[r * 1.18, r * 1.18, BUONG.nap, 10]} /><meshLambertMaterial color="#4a545c" flatShading /></mesh>{[0, 1, 2, 3].map((i) => <B key={i} p={[Math.sin(i * 1.57) * 0.5, 0.2, Math.cos(i * 1.57) * 0.5]} s={[0.16, 0.14, 0.16]} c="#c9a02c" />)}</group>
      <mesh position={[-1.2, 0.06, 1.3]} rotation={[-Math.PI / 2 + 0.05, 0.4, 0]}><cylinderGeometry args={[r * 1.03, r * 1.03, 0.04, 8, 1, true, -1, 2]} /><meshLambertMaterial color="#cfeaff" transparent opacity={0.5} flatShading side={THREE.DoubleSide} /></mesh>
      {S.map((q, i) => <mesh key={i} position={[q.x, 0.012, q.z]} rotation={[-Math.PI / 2 + q.tilt * 0.1, 0, q.ry]}><circleGeometry args={[q.s, 3]} /><meshBasicMaterial color={i % 3 ? '#cfe6ee' : '#9ec4d6'} /></mesh>)}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0]}><planeGeometry args={[0.02, 0.02]} /><meshBasicMaterial color="#000" transparent opacity={0} /></mesh>
      {Math.sin(f * 0.35) > 0.2 ? <Halo pos={[0.2, 0.5, 0.3]} r={1.1} color="#ff5a3a" strength={0.35} /> : null}
    </group>
  );
};

/** ĂNG TEN BA ĐĨA. Gốc = đỉnh nắp buồng (y = nắp trên). Ba đĩa thép 12 cạnh r 0,95 / 0,65 / 0,38 ở +0,40 / +0,78 / +1,02, cuộn đồng giữa các đĩa, chóp nhọn đỉnh +1,25 (nắp ở 3,05 thì đỉnh 4,3).
 *  Bốn ống mềm gân từ nắp lên chân ăng ten; `chay` 0..1: chấm sáng chạy đều theo bốn ống; `ang` 0..3: đĩa i sáng khi ang > i, mỗi đĩa một quầng và một đèn điểm; `tia` 0..1: tia điện bò trên cuộn đồng; `nghieng` 0..1: ăng ten bẻ nghiêng (đổ nát). */
export const AngTen: React.FC<{pos: V3; f?: number; ang?: number; mau?: MauMay; chay?: number; tia?: number; nghieng?: number; r?: number}> = ({pos, f = 0, ang = 0, mau = 'tim', chay = 0, tia = 0, nghieng = 0, r = BUONG.r}) => {
  const M = mauOf(mau), DISC = [{y: 0.4, r: 0.95}, {y: 0.78, r: 0.65}, {y: 1.02, r: 0.38}];
  const tubes = useMemo(() => [0, 1, 2, 3].map((i) => { const q = Math.PI / 4 + i * (Math.PI / 2), a = new THREE.Vector3(Math.sin(q) * r * 0.72, 0.1, Math.cos(q) * r * 0.72), b = new THREE.Vector3(Math.sin(q) * 0.3, 0.34, Math.cos(q) * 0.3), m = new THREE.Vector3(Math.sin(q) * r * 1.05, 0.2, Math.cos(q) * r * 1.05), c = new THREE.CatmullRomCurve3([a, m, b]); return {c, g: new THREE.TubeGeometry(c, 14, 0.045, 5)}; }), [r]);
  const lit = (i: number) => clamp01(ang - i);
  const bend = nghieng * 0.28;
  return (
    <group position={pos}>
      {tubes.map((t, i) => <mesh key={i} geometry={t.g}><meshLambertMaterial color={i % 2 ? '#59646c' : '#4a545c'} flatShading /></mesh>)}
      {chay > 0 ? tubes.map((t, j) => [0, 1, 2].map((i) => { const u = ((f * 0.045 + i / 3 + j * 0.11) % 1), p = t.c.getPoint(u); return <mesh key={`${j}${i}`} position={[p.x, p.y, p.z]} renderOrder={8}><planeGeometry args={[0.09, 0.09]} /><meshBasicMaterial color={M.loi} transparent opacity={chay} toneMapped={false} depthWrite={false} /></mesh>; })) : null}
      <group rotation={[0, 0, bend]} position={[bend * 0.4, 0, 0]}>
        <B p={[0, 0.2, 0]} s={[0.46, 0.4, 0.46]} c="#4a545c" /><B p={[0, 0.62, 0]} s={[0.12, 0.8, 0.12]} c="#8a949c" /><B p={[0, 1.1, 0]} s={[0.1, 0.34, 0.1]} c="#8a949c" />
        {DISC.map((d, i) => { const L = lit(i);
          return (
            <group key={i} position={[0, d.y, 0]} rotation={[0, f * 0.012 * (i % 2 ? 1 : -1), 0]}>
              <mesh castShadow><cylinderGeometry args={[d.r, d.r * 1.04, 0.09, 12]} /><meshLambertMaterial color={i === 1 ? '#6a747c' : '#59646c'} flatShading /></mesh>
              <mesh position={[0, 0.047, 0]}><cylinderGeometry args={[d.r * 0.96, d.r, 0.014, 12]} /><meshLambertMaterial color="#8a949c" flatShading /></mesh>
              <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[d.r * 0.45, d.r * 0.82, 12]} /><meshBasicMaterial color={lerpC('#2a323a', M.giua, L)} toneMapped={false} /></mesh>
              {Array.from({length: 12}, (_, k) => { const q = (k / 12) * 6.2832; return <B key={k} p={[Math.sin(q) * d.r * 0.99, 0, Math.cos(q) * d.r * 0.99]} s={[0.07, 0.07, 0.07]} c={L > 0.5 && (k + Math.floor(f / 3)) % 3 !== 0 ? M.loi : '#2d3238'} cast={false} r={[0, q, 0]} />; })}
              {L > 0.02 ? <><Halo pos={[0, 0.2, 0.3]} r={d.r * 2.6} color={M.giua} strength={0.5 * L} order={5} /><pointLight position={[0, 0.4, d.r * 0.9]} color={M.giua} intensity={4.5 * L} distance={8} decay={1.4} /></> : null}
            </group>);
        })}
        {/* cuộn đồng giữa các đĩa: chồng vòng đồng quanh một lõi */}
        {[[0.44, 0.74], [0.82, 0.98]].map(([a, b], j) => <group key={j}><B p={[0, (a + b) / 2, 0]} s={[0.08, b - a, 0.08]} c="#2d3238" />{Array.from({length: 5}, (_, k) => <mesh key={k} position={[0, a + 0.04 + (k * (b - a - 0.08)) / 4, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[j ? 0.14 : 0.2, 0.03, 4, 10]} /><meshLambertMaterial color="#c98a3c" flatShading /></mesh>)}</group>)}
        <mesh position={[0, 1.04 + 0.12, 0]}><coneGeometry args={[0.1, 0.24, 6]} /><meshLambertMaterial color="#c98a3c" flatShading /></mesh>
        {tia > 0.05 ? [0, 1].map((j) => { const y0 = j ? 0.84 : 0.46, y1 = j ? 0.98 : 0.74, q = f * 0.7 + j * 2, pts = Array.from({length: 5}, (_, k) => [Math.sin(q + k * 2.1) * 0.2 + 0.2 * Math.cos(j), y0 + ((y1 - y0) * k) / 4, Math.cos(q + k * 1.7) * 0.2] as V3); return <React.Fragment key={j}>{pts.slice(0, 4).map((p, k) => { const nx = pts[k + 1], mid: V3 = [(p[0] + nx[0]) / 2, (p[1] + nx[1]) / 2, (p[2] + nx[2]) / 2], len = Math.hypot(nx[0] - p[0], nx[1] - p[1], nx[2] - p[2]); return <mesh key={k} position={mid} rotation={[0, 0, Math.atan2(nx[0] - p[0], nx[1] - p[1]) * -1]} renderOrder={8}><planeGeometry args={[0.03, len]} /><meshBasicMaterial color={M.loi} transparent opacity={tia * (Math.sin(f * 2 + k * 3 + j) > -0.2 ? 1 : 0)} toneMapped={false} depthWrite={false} /></mesh>; })}</React.Fragment>; }) : null}
      </group>
    </group>
  );
};

/** NÚM VẶN HAI MẶT: trụ ngắn, núm tròn r 0,17 (đường kính 0,34) mặt quay về +z. Nửa trái mặt tím (vòng cung, tia), nửa phải mặt nạ xanh (mũ trùm, hai khe mắt); kim đồng quay quanh tâm: `kim` 0 = chỉ mặt tím, 1 = chỉ mặt nạ xanh.
 *  Gốc = mặt bàn dưới trụ (truyền pos = [5,75, 1,15, -3,75] là đúng gốc trụ). Mặt núm ở y +0,17 so với gốc. `tich` 0..1 nháy một nấc (đèn nhỏ ở rìa nhấp). */
const paintNum = (c: Ctx, W: number) => {
  const cx = W / 2, R = W * 0.47; c.clearRect(0, 0, W, W);
  c.fillStyle = '#c9a02c'; c.beginPath(); c.arc(cx, cx, W * 0.5, 0, 7); c.fill(); c.fillStyle = '#3a2a10'; c.beginPath(); c.arc(cx, cx, R * 1.02, 0, 7); c.fill();
  c.save(); c.beginPath(); c.rect(0, 0, cx, W); c.clip(); c.fillStyle = '#5a2a9a'; c.beginPath(); c.arc(cx, cx, R, 0, 7); c.fill(); c.fillStyle = '#b878ff'; c.beginPath(); c.arc(cx, cx, R * 0.82, 0, 7); c.fill();
  c.strokeStyle = '#efe0ff'; c.lineWidth = W * 0.012; for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + (k / 5) * Math.PI; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.3, cx + Math.sin(a) * R * 0.3); c.lineTo(cx + Math.cos(a) * R * 0.76, cx + Math.sin(a) * R * 0.76); c.stroke(); }
  c.fillStyle = '#efe0ff'; c.beginPath(); c.arc(cx - R * 0.42, cx, R * 0.13, 0, 7); c.fill(); c.restore();
  c.save(); c.beginPath(); c.rect(cx, 0, cx, W); c.clip(); c.fillStyle = '#0f7a45'; c.beginPath(); c.arc(cx, cx, R, 0, 7); c.fill(); c.fillStyle = '#3dff8e'; c.beginPath(); c.arc(cx, cx, R * 0.82, 0, 7); c.fill();
  const s = R / 100; P(c, [[cx + 18 * s, cx - 62 * s], [cx + 52 * s, cx - 44 * s], [cx + 60 * s, cx + 10 * s], [cx + 44 * s, cx + 52 * s], [cx + 18 * s, cx + 62 * s]], '#0f4a2a');
  P(c, [[cx + 22 * s, cx - 36 * s], [cx + 50 * s, cx - 26 * s], [cx + 50 * s, cx - 12 * s], [cx + 22 * s, cx - 18 * s]], '#eafff2'); P(c, [[cx + 28 * s, cx + 8 * s], [cx + 46 * s, cx + 8 * s], [cx + 38 * s, cx + 40 * s], [cx + 28 * s, cx + 40 * s]], '#a9f5c9'); c.restore();
  c.fillStyle = '#c9a02c'; c.fillRect(cx - W * 0.008, W * 0.04, W * 0.016, W * 0.92);
  for (let k = 0; k <= 8; k++) { const a = -Math.PI / 2 - 1.2 + (k / 8) * 2.4; c.fillStyle = '#efe6c8'; c.save(); c.translate(cx + Math.cos(a) * R * 0.94, cx + Math.sin(a) * R * 0.94); c.rotate(a); c.fillRect(-W * 0.03, -W * 0.007, W * 0.05, W * 0.014); c.restore(); }
};
export const NumVan: React.FC<{pos: V3; kim?: number; r?: number; tich?: number}> = ({pos, kim = 0, r = 0.17, tich = 0}) => {
  const map = useMemo(() => tex('lo1517-num', 512, 512, (c, W) => paintNum(c, W)), []);
  const rot = (0.5 - clamp01(kim)) * 2.3;
  return (
    <group position={pos}>
      <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.07, 0.1, 0.16, 8]} /><meshLambertMaterial color="#3a424a" flatShading /></mesh>
      <mesh position={[0, r + 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[r * 1.04, r * 1.04, 0.1, 14]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>
      <mesh position={[0, r + 0.1, 0.055]}><circleGeometry args={[r * 0.98, 14]} /><meshBasicMaterial map={map} toneMapped={false} /></mesh>
      <group position={[0, r + 0.1, 0.075]} rotation={[0, 0, rot]}>
        <mesh position={[0, r * 0.36, 0]}><planeGeometry args={[r * 0.1, r * 0.82]} /><meshBasicMaterial color="#c98a3c" toneMapped={false} /></mesh>
        <mesh position={[0, r * 0.82, 0.001]}><planeGeometry args={[r * 0.18, r * 0.18]} /><meshBasicMaterial color="#e8c06a" toneMapped={false} /></mesh>
      </group>
      <mesh position={[0, r + 0.1, 0.08]}><cylinderGeometry args={[r * 0.12, r * 0.12, 0.04, 8]} /><meshLambertMaterial color="#c9a02c" flatShading /></mesh>
      {tich > 0.05 ? <Halo pos={[0, r + 0.1, 0.2]} r={r * 3} color={kim > 0.5 ? '#3dff8e' : '#b878ff'} strength={0.4 * tich} /> : null}
    </group>
  );
};

/** DẢI ĐÈN TRÊN BÀN ĐIỀU KHIỂN: tám đèn trên mặt trước thân bàn (bàn `ControlDesk` ở pos, rộng 1,5; mặt trước z +0,45).
 *  `chay` 0..1: đèn sáng dần từ phải sang trái (về phía buồng kính); `xanh` 0..1: màu đổi từ tím sang xanh, và bốn nút trên mặt bàn nháy xanh. */
export const DenBan: React.FC<{pos: V3; f?: number; chay?: number; xanh?: number}> = ({pos, f = 0, chay = 0, xanh = 0}) => {
  const col = (k: number) => lerpC(MAU_TIM.giua, MAU_XANH.giua, k);
  return (
    <group position={pos}>
      {Array.from({length: 8}, (_, i) => { const x = 0.62 - i * 0.177, L = clamp01(chay * 9.5 - i), on = L > 0.5;
        return <group key={i}><B p={[x, 0.76, 0.455]} s={[0.12, 0.07, 0.04]} c={on ? col(xanh) : '#2d3238'} cast={false} />{on ? <Halo pos={[x, 0.76, 0.56]} r={0.2} color={col(xanh)} strength={0.55} /> : null}</group>; })}
      {xanh > 0.4 ? [[-0.3, 1.2, 0.1], [0.0, 1.2, 0.15], [0.3, 1.18, 0.2], [0.5, 1.15, 0.25]].map(([x, y, z], i) => Math.sin(f * 0.3 + i * 1.7) > -0.5 ? <Halo key={i} pos={[x, y + 0.05, z + 0.12]} r={0.2} color="#3dff8e" strength={0.55 * xanh} /> : null) : null}
    </group>
  );
};

/** MÀN HÌNH PHỤ (chương 16 cảnh 7): khung thép rộng 1,1 cao 0,8, mặt kính xanh đen có một con phố nhìn xa (đường chạy vào điểm tụ, hai dãy nhà, băng rôn xanh lá), vạch quét chạy dọc.
 *  `tien` 0..1: ba chỗ đặt hình người (`children`, trong toạ độ màn hình: x −0,4..0,4 và y −0,3..0,3, z 0,08 trước mặt) tiến dọc phố; `khung` 0..1: khung đỏ bắt hình, nháy khi nhấp nhô (f). Người truyền qua `children` phải là hình từ bộ khuôn. */
const paintPho = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#06140e'; c.fillRect(0, 0, W, H); const vx = W * 0.5, vy = H * 0.42;
  P(c, [[0, H * 0.55], [vx - 6, vy + 2], [vx + 6, vy + 2], [W, H * 0.55], [W, H], [0, H]], '#0c2a1e');
  P(c, [[W * 0.36, H], [vx - 3, vy + 3], [vx + 3, vy + 3], [W * 0.64, H]], '#134a34');
  [[0, 0.5, 0.18, '#103426'], [0.18, 0.4, 0.32, '#0e2e22'], [0.32, 0.3, 0.42, '#133a2a']].forEach(([a, b, d, col]) => { P(c, [[W * (a as number), H * (b as number) - 30], [W * (d as number), vy - H * 0.08], [W * (d as number), vy + H * 0.04], [W * (a as number), H * 0.72]], col as string); P(c, [[W * (1 - (a as number)), H * (b as number) - 30], [W * (1 - (d as number)), vy - H * 0.08], [W * (1 - (d as number)), vy + H * 0.04], [W * (1 - (a as number)), H * 0.72]], col as string); });
  c.fillStyle = '#3dff8e'; for (let k = 0; k < 4; k++) { const t = 0.2 + k * 0.17; c.fillRect(W * (0.5 - 0.46 * (1 - t)) - 5, H * (0.2 + 0.2 * t), 10 + 12 * t, 26 + 30 * t); }
  c.fillStyle = 'rgba(120,255,190,0.5)'; for (let y = 8; y < H; y += 7) c.fillRect(0, y, W, 1.5);
};
export const ManHinhPhu: React.FC<{pos: V3; f?: number; w?: number; h?: number; rotY?: number; tien?: number; khung?: number; on?: number; children?: React.ReactNode}> = ({pos, f = 0, w = 1.1, h = 0.8, rotY = 0, khung = 0, on = 1, children}) => {
  const map = useMemo(() => tex('lo1517-pho', 384, Math.round(384 * h / w), paintPho), [w, h]);
  const sy = ((f * 0.011) % 1) * h - h / 2, blink = khung > 0 && Math.sin(f * 1.1) > -0.3 ? khung : 0;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <B p={[0, 0, 0]} s={[w + 0.12, h + 0.12, 0.14]} c="#2d3238" /><B p={[0, -h / 2 - 0.14, -0.02]} s={[0.3, 0.16, 0.12]} c="#3a424a" />
      <mesh position={[0, 0, 0.075]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} toneMapped={false} color={new THREE.Color(1, 1, 1).multiplyScalar(0.55 + 0.45 * on)} /></mesh>
      <mesh position={[0, sy, 0.08]}><planeGeometry args={[w, 0.05]} /><meshBasicMaterial color="#b0ffd8" transparent opacity={0.25} toneMapped={false} depthWrite={false} /></mesh>
      {blink > 0 ? [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy2], i) => <React.Fragment key={i}><mesh position={[sx * w * 0.3, sy2 * h * 0.3, 0.085]}><planeGeometry args={[0.14, 0.018]} /><meshBasicMaterial color="#ff3a2a" toneMapped={false} /></mesh><mesh position={[sx * (w * 0.3 + 0.062), sy2 * (h * 0.3 - 0.062), 0.085]}><planeGeometry args={[0.018, 0.14]} /><meshBasicMaterial color="#ff3a2a" toneMapped={false} /></mesh></React.Fragment>) : null}
      <group position={[0, 0, 0.1]}>{children}</group>
      <Halo pos={[0, 0, 0.4]} r={Math.max(w, h) * 1.1} color="#5fe39a" strength={0.14 * on} />
    </group>
  );
};

/** HÌNH TRONG MÀN TRÒN (chương 15 cảnh 3): vẽ chồng lên `RoundScreen` (đặt cùng pos, d cùng). `kieu`:
 *   'khong-lo' bóng khổng lồ: mũ trùm sừng cắt giấy xanh đen phủ gần kín màn; `p` 0..1 = co lại;
 *   'ngam' vòng ngắm xanh ba vòng đồng tâm có bốn vạch, khép từ `d` về quanh tâm khi p 0 → 1.
 *  Người nhỏ giữa màn là hình từ bộ khuôn, truyền qua `children`. Nằm trước mặt kính 0,2 m (z +0,2 so với pos). */
export const HinhManTron: React.FC<{pos: V3; d?: number; kieu: 'khong-lo' | 'ngam'; p?: number; f?: number; children?: React.ReactNode}> = ({pos, d = 2.4, kieu, p = 0, f = 0, children}) => {
  const geo = useMemo(() => poly([[-1, -1.1], [-1.15, 0.3], [-0.7, 0.55], [-0.95, 1.5], [-0.35, 0.95], [-0.15, 1.45], [0, 1.05], [0.15, 1.45], [0.35, 0.95], [0.95, 1.5], [0.7, 0.55], [1.15, 0.3], [1, -1.1], [0.4, -1.3], [-0.4, -1.3]]), []);
  const eye = useMemo(() => poly([[-0.62, 0.0], [-0.12, 0.12], [-0.18, 0.3], [-0.64, 0.2]]), []);
  if (kieu === 'khong-lo') { const k = d * 0.42 * (1 - p * 0.55);
    return <group position={[pos[0], pos[1], pos[2] + 0.2]}>
      <mesh geometry={geo} scale={[k, k, 1]} position={[0, -0.05 * d, 0]}><meshBasicMaterial color="#0a2a1c" toneMapped={false} /></mesh>
      <mesh geometry={geo} scale={[k * 0.8, k * 0.8, 1]} position={[0, -0.05 * d, 0.002]}><meshBasicMaterial color="#12503a" toneMapped={false} /></mesh>
      {[1, -1].map((s) => <mesh key={s} geometry={eye} scale={[s * k * 0.9, k * 0.9, 1]} position={[0, -0.05 * d + 0.0, 0.004]}><meshBasicMaterial color="#9affc8" toneMapped={false} /></mesh>)}
      <mesh position={[0, 0, 0.006]}><circleGeometry args={[d / 2, 16]} /><meshBasicMaterial color="#04100b" transparent opacity={0.22 + 0.2 * Math.sin(f * 0.2)} toneMapped={false} depthWrite={false} /></mesh>
    </group>; }
  const k = 1 - clamp01(p) * 0.78, R = (d / 2) * k;
  return <group position={[pos[0], pos[1], pos[2] + 0.2]}>
    {[1, 0.66, 0.34].map((q, i) => <mesh key={i} position={[0, 0, 0.004 * i]}><ringGeometry args={[R * q * 0.96, R * q, 12]} /><meshBasicMaterial color={i === 0 ? '#3dff8e' : '#9affc8'} toneMapped={false} /></mesh>)}
    {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.sin(i * 1.5708) * R * 0.86, Math.cos(i * 1.5708) * R * 0.86, 0.006]} rotation={[0, 0, -i * 1.5708]}><planeGeometry args={[0.035, R * 0.34]} /><meshBasicMaterial color="#eafff2" toneMapped={false} /></mesh>)}
    {children}
  </group>;
};

/** CỘT SÁNG XANH BA LỚP (chương 15 cảnh 16): từ chân `pos` lên `cao` m, ba lăng trụ 12 cạnh lồng nhau (rìa, giữa, lõi), mỗi lớp mờ dần và rung chậm; `k` 0..1 = độ đậm.
 *  Hạt: vài tia mảnh bò quanh ăng ten (do cảnh quay đặt), không hạt ở sàn. */
export const CotSangXanh: React.FC<{pos: V3; cao?: number; r?: number; k?: number; f?: number; mau?: MauMay}> = ({pos, cao = 8.5, r = 0.9, k = 1, f = 0, mau = 'xanh'}) => {
  const M = mauOf(mau);
  return (
    <group position={pos}>
      {[[1, M.rim, 0.16], [0.62, M.giua, 0.22], [0.3, M.loi, 0.4]].map(([q, col, op], i) => { const wob = 1 + Math.sin(f * 0.12 + i * 2) * 0.05; return <mesh key={i} position={[0, cao / 2, 0]} renderOrder={6 + i}><cylinderGeometry args={[r * (q as number) * wob, r * (q as number) * 1.25 * wob, cao, 12, 1, true]} /><meshBasicMaterial color={col as string} transparent opacity={(op as number) * k} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>; })}
      <Halo pos={[0, 1.0, 0.2]} r={r * 3} color={M.giua} strength={0.4 * k} />
    </group>
  );
};

// ================================================================ B. hiệu ứng
/** SÓNG THAO TÚNG: vòng cắt giấy 12 cạnh gãy góc, mảnh, ba sắc (rìa, giữa, lõi), nằm trong mặt phẳng hướng về máy; mỗi vòng sống `life` khung, nở từ 0,25 tới 1,6 lần `size`, mờ dần. Gọi nhiều lần với `at` khác nhau.
 *  `vo` > 0 (chương 16 cảnh 6): vòng nứt thành năm mảnh cung, các mảnh văng ra và rơi, `vo` 0..1 = đã vỡ bao nhiêu; `f - at` tính từ lúc sinh. */
const ringGeo = (inner: number, outer: number, seed: number, a0 = 0, a1 = Math.PI * 2, n = 12) => {
  const r = rnd(seed), pts: number[][] = [], pts2: number[][] = [], steps = Math.max(2, Math.round((n * (a1 - a0)) / (Math.PI * 2)));
  const jit = Array.from({length: n + 1}, () => 0.9 + r() * 0.2);
  for (let i = 0; i <= steps; i++) { const a = a0 + ((a1 - a0) * i) / steps, j = jit[i % n]; pts.push([Math.cos(a) * outer * j, Math.sin(a) * outer * j]); pts2.push([Math.cos(a) * inner * j, Math.sin(a) * inner * j]); }
  return poly([...pts, ...pts2.reverse()]);
};
export const SongThaoTung: React.FC<{pos: V3; f: number; at: number; life?: number; size?: number; mau?: MauMay; vo?: number; seed?: number}> = ({pos, f, at, life = 20, size = 0.5, mau = 'tim', vo = 0, seed = 1}) => {
  const M = mauOf(mau), t = (f - at) / life;
  const whole = useMemo(() => [[0.8, 1, 0], [0.84, 0.96, 1], [0.88, 0.93, 2]].map(([a, b, i]) => ringGeo(a, b, seed * 7 + (i as number))), [seed]);
  const parts = useMemo(() => Array.from({length: 5}, (_, k) => [[0.8, 1, 0], [0.84, 0.96, 1], [0.88, 0.93, 2]].map(([a, b, i]) => ringGeo(a, b, seed * 7 + (i as number), (k / 5) * 6.2832, ((k + 1) / 5) * 6.2832 - 0.04, 12))), [seed]);
  if (t < 0 || t > 1) return null;
  const sc = size * (0.25 + 1.35 * (1 - Math.pow(1 - t, 2))), op = (1 - t * t) * 0.95, cols = [M.rim, M.giua, M.loi];
  return (
    <group position={pos} scale={[sc, sc, 1]}>
      {vo <= 0 ? whole.map((g, i) => <mesh key={i} geometry={g} position={[0, 0, 0.002 * i]} renderOrder={9 + i}><meshBasicMaterial color={cols[i]} transparent opacity={op} toneMapped={false} depthWrite={false} /></mesh>)
        : parts.map((pg, k) => { const a = ((k + 0.5) / 5) * 6.2832, e = clamp01(vo); return <group key={k} position={[Math.cos(a) * 0.5 * e, Math.sin(a) * 0.5 * e - e * e * 0.9, 0]} rotation={[0, 0, e * (k % 2 ? 0.7 : -0.7)]}>{pg.map((g, i) => <mesh key={i} geometry={g} position={[0, 0, 0.002 * i]} renderOrder={9 + i}><meshBasicMaterial color={cols[i]} transparent opacity={op * (1 - e * 0.5)} toneMapped={false} depthWrite={false} /></mesh>)}</group>; })}
    </group>
  );
};

/** VÒNG QUÉT SÀN (chương 15 cảnh 16): vòng 12 cạnh nằm trên sàn, nở từ tâm tới `reach` m trong `life` khung, ba sắc, quét lên tường nếu máy đặt thêm; `at` = khung sinh. */
export const SongSan: React.FC<{pos: V3; f: number; at: number; life?: number; reach?: number; mau?: MauMay; seed?: number}> = ({pos, f, at, life = 22, reach = 9, mau = 'xanh', seed = 2}) => {
  const M = mauOf(mau), t = (f - at) / life;
  const geos = useMemo(() => [[0.9, 1, 0], [0.93, 0.985, 1], [0.95, 0.975, 2]].map(([a, b, i]) => ringGeo(a, b, seed * 5 + (i as number), 0, Math.PI * 2, 14)), [seed]);
  if (t < 0 || t > 1) return null;
  const R = reach * (0.1 + 0.9 * (1 - Math.pow(1 - t, 2.2)));
  return <group position={[pos[0], pos[1] + 0.03, pos[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[R, R, 1]}>{geos.map((g, i) => <mesh key={i} geometry={g} position={[0, 0, 0.002 * i]} renderOrder={5 + i}><meshBasicMaterial color={[M.rim, M.giua, M.loi][i]} transparent opacity={(1 - t * t) * 0.9} toneMapped={false} depthWrite={false} /></mesh>)}</group>;
};

/** KÍNH VỠ BAY (chương 16 cảnh 10): `n` mảnh tam giác trong, viền trắng, văng từ `pos` tại khung `at`, lật quanh một trục riêng, rơi và nảy một lần trên sàn y `san`. Mảnh nằm lại sau `at + 40`. */
export const KinhVo: React.FC<{pos: V3; f: number; at: number; n?: number; san?: number; speed?: number; seed?: number; spread?: [number, number]}> = ({pos, f, at, n = 26, san = 0.02, speed = 1, seed = 4, spread = [1.4, 1.1]}) => {
  const tri = useMemo(() => poly([[0, 0.5], [-0.46, -0.32], [0.5, -0.28]]), []);
  const L = useMemo(() => { const r = rnd(seed * 19 + 3); return Array.from({length: n}, () => ({vx: (r() - 0.5) * 2 * spread[0], vy: 1.2 + r() * 2.8, vz: (r() - 0.35) * 2 * spread[1], s: 0.05 + r() * 0.12, ax: r() * 3, ay: r() * 3, w: 4 + r() * 8, rz: r() * 6})); }, [n, seed, spread[0], spread[1]]);
  const t = (f - at) / 24;
  if (t < 0) return null;
  return <group>{L.map((q, i) => {
    const T = Math.min(t * speed, 1.7), g = 7.5;
    let y = pos[1] + q.vy * T - 0.5 * g * T * T, vyb = q.vy - g * T, bounced = false;
    if (y < san) { const tb = (q.vy + Math.sqrt(q.vy * q.vy + 2 * g * (pos[1] - san))) / g, Tb = Math.max(0, T - tb), vb = (q.vy - g * tb) * -0.35; y = Math.max(san, san + vb * Tb - 0.5 * g * Tb * Tb); bounced = true; void vyb; }
    const spin = bounced && y <= san + 0.001 ? 0 : t * q.w, flat = bounced && y <= san + 0.001;
    return <group key={i} position={[pos[0] + q.vx * Math.min(T, 1.2), y, pos[2] + q.vz * Math.min(T, 1.2)]} rotation={flat ? [-Math.PI / 2, 0, q.rz] : [q.ax + spin, q.ay + spin * 0.6, q.rz]} scale={[q.s, q.s, 1]}>
      <mesh geometry={tri} renderOrder={9}><meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <mesh geometry={tri} scale={[0.78, 0.78, 1]} position={[0, -0.02, 0.002]} renderOrder={10}><meshBasicMaterial color={i % 3 ? '#bfe8ff' : '#8cc4ea'} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    </group>;
  })}</group>;
};

/** MÀN XANH TRÊN TRỜI (chương 16 cảnh 11): ba dải lụa `#3dff8e` trong suốt, gợn chậm, treo ở trời cách máy `d` m (mặc định 430, sau núi xa, trước nền trời): chỉ phủ trời, núi gần che nó.
 *  `k` 0..1 = độ sáng; `tan` 0..1 = đang tan: dải mỏng đi, mép dưới rách răng cưa, mép trên cuộn lên. Gốc = `eye` của máy (truyền eye). */
export const ManXanh: React.FC<{eye: V3; f?: number; d?: number; k?: number; tan?: number; y?: number}> = ({eye, f = 0, d = 430, k = 1, tan = 0, y = 48}) => {
  const bands = useMemo(() => [0, 1, 2], []);
  const map = useMemo(() => tex('lo1517-man', 16, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(61,255,142,0)'); g.addColorStop(0.07, 'rgba(61,255,142,0)'); g.addColorStop(0.08, 'rgba(210,255,230,0.95)'); g.addColorStop(0.2, 'rgba(61,255,142,0.7)'); g.addColorStop(0.7, 'rgba(61,255,142,0.5)'); g.addColorStop(0.9, 'rgba(61,255,142,0.18)'); g.addColorStop(1, 'rgba(61,255,142,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }), []);
  const geos = useMemo(() => bands.map((b) => {
    const nx = 48, w = 1000, hh = 52 + b * 12, g = new THREE.PlaneGeometry(w, hh, nx, 8), p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i), u = (yy / hh + 0.5), wob = Math.sin(x * 0.012 + f * 0.035 + b * 1.7) * 9 + Math.sin(x * 0.027 - f * 0.05 + b) * 4; const top = u > 0.75 ? (u - 0.75) * tan * 60 * Math.sin(x * 0.02 + b) : 0; const rag = u < 0.25 && tan > 0 ? -((Math.sin(x * 0.09 + b * 3) > 0 ? 1 : 0) * tan * 20) : 0; p.setY(i, yy + wob + top + rag); p.setZ(i, Math.sin(x * 0.01 + b) * 14); }
    g.computeVertexNormals(); return g; }), [bands, f, tan]);
  return <group>{bands.map((b) => <mesh key={b} geometry={geos[b]} position={[eye[0] + (b - 1) * 90, eye[1] + y + b * 22, eye[2] - d + b * 6]} renderOrder={1}><meshBasicMaterial map={map} color={['#3dff8e', '#6affb0', '#2ee67c'][b]} transparent opacity={k * (0.8 - 0.14 * b) * (1 - tan * 0.7)} toneMapped={false} depthWrite={false} fog={false} side={THREE.DoubleSide} /></mesh>)}</group>;
};

// ================================================================ C. đồ nhỏ
/** CON DẤU MẶT NẠ (chương 16 cảnh 4): cán gỗ sẫm tiện, đế đồng khắc mặt nạ (mặt dưới), quầng đồng; `nang` 0..1 = nhấc lên cao (0 = ấn xuống mặt bàn). Gốc = điểm chạm bàn. Cao 0,3 khi hạ. */
export const ConDau: React.FC<{pos: V3; nang?: number; rotY?: number}> = ({pos, nang = 0, rotY = 0}) => (
  <group position={[pos[0], pos[1] + nang * 0.5, pos[2]]} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.15, 0.17, 0.06, 8]} /><meshLambertMaterial color="#c98a3c" flatShading /></mesh>
    <mesh position={[0, 0.075, 0]}><cylinderGeometry args={[0.12, 0.15, 0.03, 8]} /><meshLambertMaterial color="#e8b860" flatShading /></mesh>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.04, 0.06, 0.24, 8]} /><meshLambertMaterial color="#4a2e1c" flatShading /></mesh>
    <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.075, 0.045, 0.08, 8]} /><meshLambertMaterial color="#5a3a24" flatShading /></mesh>
    <mesh position={[0, 0.39, 0]}><cylinderGeometry args={[0.06, 0.075, 0.02, 8]} /><meshLambertMaterial color="#2e1c10" flatShading /></mesh>
  </group>
);
/** DẤU MỰC: mặt nạ đóng bằng mực xanh lá đậm trên giấy (nằm phẳng ở `pos`, hướng lên), viền nhoè bằng mép răng cưa; `k` 0..1 = hiện ra (lan nhanh trong 3 khung). Rộng `w` m. */
export const DauMuc: React.FC<{pos: V3; w?: number; k?: number; rotY?: number}> = ({pos, w = 0.3, k = 1, rotY = 0}) => {
  const map = useMemo(() => tex('lo1517-dau', 256, 256, (c, W) => {
    c.clearRect(0, 0, W, W); const r = rnd(5), cx = W / 2, s = W / 300;
    c.fillStyle = 'rgba(20,70,36,0.55)'; c.beginPath(); for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.28, rr = W * (0.43 + r() * 0.05); c.lineTo(cx + Math.cos(a) * rr, cx + Math.sin(a) * rr); } c.closePath(); c.fill();
    c.fillStyle = '#1a5a2c'; c.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.28, rr = W * (0.4 + r() * 0.015); c.lineTo(cx + Math.cos(a) * rr, cx + Math.sin(a) * rr); } c.closePath(); c.fill();
    P(c, [[cx - 78 * s, cy0(W) - 92 * s], [cx, cy0(W) - 112 * s], [cx + 78 * s, cy0(W) - 92 * s], [cx + 70 * s, cy0(W) + 40 * s], [cx + 36 * s, cy0(W) + 112 * s], [cx, cy0(W) + 128 * s], [cx - 36 * s, cy0(W) + 112 * s], [cx - 70 * s, cy0(W) + 40 * s]], '#3a8a50');
    P(c, [[cx - 62 * s, cy0(W) - 36 * s], [cx - 14 * s, cy0(W) - 26 * s], [cx - 20 * s, cy0(W) - 6 * s], [cx - 62 * s, cy0(W) - 14 * s]], '#0e3a1c'); P(c, [[cx + 62 * s, cy0(W) - 36 * s], [cx + 14 * s, cy0(W) - 26 * s], [cx + 20 * s, cy0(W) - 6 * s], [cx + 62 * s, cy0(W) - 14 * s]], '#0e3a1c');
    P(c, [[cx - 8 * s, cy0(W) - 20 * s], [cx + 8 * s, cy0(W) - 20 * s], [cx + 14 * s, cy0(W) + 52 * s], [cx, cy0(W) + 62 * s], [cx - 14 * s, cy0(W) + 52 * s]], '#1a5a2c');
  }), []);
  if (k <= 0) return null;
  const s = w * (0.7 + 0.3 * clamp01(k));
  return <mesh position={[pos[0], pos[1] + 0.004, pos[2]]} rotation={[-Math.PI / 2, 0, rotY]} renderOrder={3}><planeGeometry args={[s, s]} /><meshBasicMaterial map={map} transparent opacity={clamp01(k * 3)} depthWrite={false} /></mesh>;
};
const cy0 = (W: number) => W * 0.46;

/** CHỒNG GIẤY: khối giấy kem, mép lệch từng xấp, vài xấp buộc dây đỏ. `n` xấp (mỗi xấp dày 0,035), rộng `w` sâu `d`; gốc = mặt bàn dưới tâm chồng. `cao` ép chiều cao (m) nếu muốn đổi mà không đổi `n`. */
export const XapGiay: React.FC<{pos: V3; n?: number; w?: number; d?: number; seed?: number; day?: boolean; rotY?: number}> = ({pos, n = 8, w = 0.42, d = 0.3, seed = 1, day = true, rotY = 0}) => {
  const L = useMemo(() => { const r = rnd(seed * 13 + 4); return Array.from({length: n}, (_, i) => ({x: (r() - 0.5) * 0.04, z: (r() - 0.5) * 0.04, ry: (r() - 0.5) * 0.08, tone: ['#f2e8cc', '#e6dab8', '#f6eed8', '#dccfa8'][Math.floor(r() * 4)], tie: day && i % 3 === 1})); }, [n, seed, day]);
  const th = 0.035;
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      {L.map((q, i) => <group key={i} position={[q.x, th * i + th / 2, q.z]} rotation={[0, q.ry, 0]}>
        <B p={[0, 0, 0]} s={[w, th * 0.92, d]} c={q.tone} />
        <B p={[0, th * 0.4, d / 2 + 0.001]} s={[w * 0.97, th * 0.1, 0.002]} c="#b9ab84" cast={false} /><B p={[w / 2 + 0.001, th * 0.1, 0]} s={[0.002, th * 0.1, d * 0.97]} c="#b9ab84" cast={false} />
        {q.tie ? <><B p={[0, 0.002, 0]} s={[0.018, th * 0.96, d + 0.012]} c="#c8402a" cast={false} /><B p={[0, 0.002, 0]} s={[w + 0.012, th * 0.96, 0.018]} c="#c8402a" cast={false} /></> : null}
      </group>)}
    </group>
  );
};

/** THÓC: từ `pos` (kẽ tay) hạt vàng phẳng hai sắc tuôn xuống mặt bàn ở `san` thấp hơn `roi` m, thành dòng; `tuon` 0..1 = lượng chảy; `trai` 0..1 = thóc đã trải quạt trên khăn bàn (nón phẳng, hướng +z, rộng 0,9). */
export const Thoc: React.FC<{pos: V3; f?: number; tuon?: number; trai?: number; roi?: number; seed?: number}> = ({pos, f = 0, tuon = 1, trai = 0, roi = 0.9, seed = 3}) => {
  const fan = useMemo(() => { const s = new THREE.Shape(); s.moveTo(0, 0); for (let i = 0; i <= 10; i++) { const a = -0.9 + (i / 10) * 1.8 + Math.PI / 2, r = 0.42 * (0.8 + 0.2 * Math.sin(i * 3.1)); s.lineTo(Math.cos(a) * r * 1.5, -Math.sin(a) * r); } s.closePath(); return new THREE.ShapeGeometry(s); }, []);
  const dots = useMemo(() => { const r = rnd(seed * 9 + 2); return Array.from({length: 60}, () => ({x: (r() - 0.5) * 0.8, z: r() * 0.6, ry: r() * 6, s: 0.012 + r() * 0.016, c: r() < 0.5 ? '#e8b830' : '#c98f1c'})); }, [seed]);
  return (
    <group position={pos}>
      {tuon > 0.02 ? Array.from({length: 26}, (_, i) => { const r = rnd(i * 7 + seed), ph = ((f * 0.065 * (0.8 + r() * 0.4) + r()) % 1), y = -roi * ph * ph * 1.1 - roi * ph * 0.0 + 0, x = (r() - 0.5) * 0.06 * (0.3 + ph * 3);
        return <mesh key={i} position={[x, Math.max(-roi, y * 1.0), (r() - 0.5) * 0.05]} rotation={[0, 0, r() * 6 + f * 0.4]} renderOrder={7}><planeGeometry args={[0.035, 0.022]} /><meshBasicMaterial color={i % 2 ? '#e8b830' : '#c98f1c'} transparent opacity={tuon} /></mesh>; }) : null}
      {tuon > 0.1 || trai > 0 ? <mesh position={[0, -roi + 0.004, 0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.25 + 0.75 * clamp01(trai), 0.25 + 0.75 * clamp01(trai), 1]} renderOrder={3} geometry={fan}><meshBasicMaterial color="#d9a424" side={THREE.DoubleSide} /></mesh> : null}
      {trai > 0.05 ? dots.map((q, i) => <mesh key={i} position={[q.x * clamp01(trai), -roi + 0.008, 0.05 + q.z * clamp01(trai)]} rotation={[-Math.PI / 2, 0, q.ry]} renderOrder={4}><planeGeometry args={[q.s * 1.6, q.s]} /><meshBasicMaterial color={q.c} /></mesh>) : null}
    </group>
  );
};

/** SÚNG DỰNG CHỤM (chương 15 cảnh 20): ba khẩu súng trường dựng thành chân ba, báng gỗ, nòng thép, dây đeo; cạnh đó chồng `mu` mũ sắt xanh rêu `#55624a` úp lên nhau. Cao 1,3; gốc = điểm chạm đất giữa chân ba. Cụm rộng 0,9. */
export const SungChum: React.FC<{pos: V3; mu?: number; rotY?: number}> = ({pos, mu = 4, rotY = 0}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {[0, 1, 2].map((i) => { const q = (i / 3) * 6.2832 + 0.3;
      return <group key={i} position={[Math.sin(q) * 0.26, 0.03, Math.cos(q) * 0.26]} rotation={[Math.cos(q) * -0.27, 0, Math.sin(q) * 0.27]}>
        <B p={[0, 0.2, 0]} s={[0.085, 0.4, 0.05]} c="#6a4426" /><B p={[0, 0.2, 0.026]} s={[0.07, 0.34, 0.01]} c="#8a5a34" cast={false} />
        <B p={[0, 0.77, 0]} s={[0.035, 0.74, 0.035]} c="#59646c" /><B p={[0, 0.73, 0.02]} s={[0.012, 0.6, 0.01]} c="#8a949c" cast={false} />
        <B p={[0, 0.58, 0.012]} s={[0.06, 0.34, 0.05]} c="#4a3220" /><B p={[0, 1.15, 0.0]} s={[0.025, 0.05, 0.025]} c="#2d3238" />
        <B p={[0, 0.4, 0.0]} s={[0.07, 0.04, 0.06]} c="#3a424a" />
      </group>; })}
    <B p={[0, 0.58, 0]} s={[0.12, 0.04, 0.12]} c="#2d3238" r={[0, 0.5, 0]} />
    <group position={[0.62, 0, 0.12]}>{Array.from({length: Math.max(1, mu)}, (_, i) => <group key={i} position={[((i % 2) - 0.5) * 0.04, i * 0.1, (i % 3) * 0.015]} rotation={[0, i * 0.7, 0]}>
      <mesh position={[0, 0.045, 0]}><cylinderGeometry args={[0.14, 0.18, 0.09, 10]} /><meshLambertMaterial color="#55624a" flatShading /></mesh>
      <mesh position={[0, 0.095, 0]}><cylinderGeometry args={[0.1, 0.14, 0.04, 10]} /><meshLambertMaterial color="#6a7658" flatShading /></mesh>
      <B p={[0, 0.02, 0.17]} s={[0.1, 0.02, 0.04]} c="#3a4234" cast={false} />
    </group>)}</group>
  </group>
);

/** CỜ TRƠN TRÊN GIÁ ĐỨNG (chương 15 cảnh 19): đế gỗ chữ thập, cột gỗ cao 2,1 có chóp đồng, lá cờ một màu `mau` (không hình, không quốc kỳ) có viền gấp tối hơn ở dưới; `nga` 0..1: nghiêng cột về phía −z (về ngai) tới 0,38 rad, cờ rủ theo.
 *  Cờ phấp phới nhẹ theo f. Gốc = chân cột. `huong` +1 / −1: cờ bay về bên phải / trái cột. */
export const CoTron: React.FC<{pos: V3; mau?: string; nga?: number; f?: number; huong?: 1 | -1; seed?: number; cao?: number}> = ({pos, mau = '#6a7a96', nga = 0, f = 0, huong = 1, seed = 1, cao = 2.1}) => {
  const dark = lerpC(mau, '#101820', 0.28), light = lerpC(mau, '#ffffff', 0.18), sw = Math.sin(f * 0.11 + seed * 2) * 0.08;
  return (
    <group position={pos}>
      <B p={[0, 0.04, 0]} s={[0.6, 0.08, 0.14]} c="#4a3220" /><B p={[0, 0.04, 0]} s={[0.14, 0.08, 0.6]} c="#4a3220" /><B p={[0, 0.1, 0]} s={[0.12, 0.06, 0.12]} c="#6a4426" />
      <group rotation={[-nga * 0.38, 0, 0]}>
        <B p={[0, cao / 2, 0]} s={[0.05, cao, 0.05]} c="#6a4426" /><B p={[0, cao / 2, 0.026]} s={[0.012, cao, 0.004]} c="#8a5a34" cast={false} />
        <mesh position={[0, cao + 0.04, 0]}><coneGeometry args={[0.045, 0.14, 6]} /><meshLambertMaterial color="#c98a3c" flatShading /></mesh>
        <group position={[huong * 0.03, cao - 0.1, 0]} rotation={[nga * 0.3, sw * huong, 0]}>
          <mesh position={[huong * 0.46, -0.3, 0]}><planeGeometry args={[0.92, 0.6]} /><meshLambertMaterial color={mau} side={THREE.DoubleSide} /></mesh>
          <mesh position={[huong * 0.46, -0.52, 0.002]}><planeGeometry args={[0.92, 0.16]} /><meshLambertMaterial color={dark} side={THREE.DoubleSide} /></mesh>
          <mesh position={[huong * 0.46, -0.04, 0.003]}><planeGeometry args={[0.92, 0.04]} /><meshLambertMaterial color={light} side={THREE.DoubleSide} /></mesh>
          <mesh position={[huong * 0.05, -0.3, 0.004]}><planeGeometry args={[0.05, 0.6]} /><meshLambertMaterial color={dark} side={THREE.DoubleSide} /></mesh>
        </group>
      </group>
    </group>
  );
};

/** CHỮ SẮT (chương 17 cảnh 10): chữ thường đậm cắt từ sắt tấm, mặt xám thép, mép trên sáng, mép dưới tối, đinh tán, viền xanh lá mảnh. `chu` 'secret' | 'wars'; rộng `w` m, mặt hướng +z. */
const paintChu = (word: string) => (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); c.font = `900 ${H * 0.9}px "Arial Black", Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const x = W / 2, y = H * 0.52;
  c.fillStyle = '#1f3a28'; for (let o = 5; o >= 1; o--) c.fillText(word, x + o * 1.4, y + o * 2.0);
  c.fillStyle = '#12161a'; c.fillText(word, x + 3, y + 5); c.fillStyle = '#3dff8e'; c.globalAlpha = 0.6; c.fillText(word, x, y + 0); c.globalAlpha = 1;
  const g = c.createLinearGradient(0, H * 0.1, 0, H * 0.9); g.addColorStop(0, '#c4ccd4'); g.addColorStop(0.25, '#8f9aa6'); g.addColorStop(0.7, '#6a7480'); g.addColorStop(1, '#3a424c');
  c.save(); c.translate(0, -2); c.fillStyle = g; c.fillText(word, x, y); c.restore();
  c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(0, H * 0.06, W, H * 0.12); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(0, H * 0.78, W, H * 0.2); const r = rnd(word.length * 3); c.fillStyle = '#1a1e24';
  for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(W * (0.06 + r() * 0.88), H * (0.3 + r() * 0.4), 4, 0, 7); c.fill(); c.fillStyle = '#aab4be'; c.beginPath(); c.arc(W * (0.06 + r() * 0.88) - 1, H * (0.3 + r() * 0.4) - 1, 1.6, 0, 7); c.fill(); c.fillStyle = '#1a1e24'; }
  c.restore();
};
export const ChuSat: React.FC<{pos: V3; chu: 'secret' | 'wars'; w?: number; rotZ?: number; rung?: number}> = ({pos, chu, w = 3.4, rotZ = 0, rung = 0}) => {
  const map = useMemo(() => tex(`lo1517-chu-${chu}`, 1024, 320, paintChu(chu)), [chu]);
  return <mesh position={[pos[0] + Math.sin(rung * 40) * 0.03 * rung, pos[1] + Math.sin(rung * 31) * 0.04 * rung, pos[2]]} rotation={[0, 0, rotZ]} renderOrder={12}><planeGeometry args={[w, w * (320 / 1024)]} /><meshBasicMaterial map={map} transparent toneMapped={false} depthWrite={false} /></mesh>;
};
/** SỐ "2" NUNG: số lớn bằng sắt đang nung; `nung` 1 = đỏ rực (lõi vàng trắng), 0,5 = cam, 0 = xám thép; vài tàn lửa nhỏ khi nung > 0,7. Rộng `w` m. */
export const SoNung: React.FC<{pos: V3; nung?: number; w?: number; f?: number}> = ({pos, nung = 1, w = 1.4, f = 0}) => {
  const q = Math.round(clamp01(nung) * 10), map = useMemo(() => tex(`lo1517-so-${q}`, 512, 512, (c, W) => {
    const t = q / 10, hot = lerpC('#4a525c', '#e8401c', Math.min(1, t * 1.6)), mid = lerpC('#8f9aa6', '#ff8a2e', Math.min(1, t * 1.5)), core = lerpC('#c4ccd4', '#fff0b0', t);
    c.clearRect(0, 0, W, W); c.font = `900 ${W * 0.95}px "Arial Black", Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#14181c'; c.fillText('2', W / 2 + 8, W * 0.55 + 10); c.fillStyle = hot; c.fillText('2', W / 2, W * 0.55);
    c.save(); c.translate(0, -W * 0.012); c.fillStyle = mid; c.beginPath(); c.rect(0, 0, W, W); c.clip(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = mid; c.fillRect(0, 0, W, W); c.restore();
    c.globalCompositeOperation = 'source-over'; c.fillStyle = mid; c.font = `900 ${W * 0.86}px "Arial Black", Impact, sans-serif`; c.fillText('2', W / 2, W * 0.55); c.fillStyle = core; c.font = `900 ${W * 0.7}px "Arial Black", Impact, sans-serif`; c.globalAlpha = 0.85; c.fillText('2', W / 2, W * 0.56); c.globalAlpha = 1;
  }), [q]);
  return (
    <group position={pos}>
      {nung > 0.05 ? <Halo pos={[0, 0, -0.01]} r={w * 1.2} color="#ff6a2a" strength={0.5 * clamp01(nung)} order={11} /> : null}
      <mesh renderOrder={13}><planeGeometry args={[w, w]} /><meshBasicMaterial map={map} transparent toneMapped={false} depthWrite={false} /></mesh>
      {nung > 0.7 ? Array.from({length: 9}, (_, i) => { const r = rnd(i * 5 + 1), a = ((f * 0.05 + r()) % 1); return <mesh key={i} position={[(r() - 0.5) * w * 0.9 + Math.sin(f * 0.1 + i) * 0.05, -w * 0.3 + a * w * 0.9, 0.02]} renderOrder={14}><planeGeometry args={[0.035, 0.035]} /><meshBasicMaterial color="#ffd27a" transparent opacity={(1 - a) * clamp01(nung)} toneMapped={false} depthWrite={false} /></mesh>; }) : null}
    </group>
  );
};
void Pipe;

// ================================================================ D. phố New York lúc bình minh, băng rôn
/** MẶT TRỜI MỌC (phố New York `binh-minh`, chương 15 cảnh 17): đĩa phẳng ba lớp (quầng, vành, lõi) treo ở trời cách máy `d` m, sau cả hai lớp nhà xa nên bị mái nhà che dần; `k` 0..1 = độ cao (0 dưới chân trời, 1 đã nhô khỏi mái).
 *  `x` m lệch ngang so với máy (phải dương), `y0`/`y1` m so với tầm mắt khi k = 0 và 1. Vẽ trước các lớp nhà (cùng thứ tự, xa hơn). */
export const MatTroiMoc: React.FC<{eye: V3; k?: number; d?: number; x?: number; y0?: number; y1?: number; r?: number}> = ({eye, k = 1, d = 480, x = 130, y0 = -30, y1 = 70, r = 34}) => {
  const e = k * k * (3 - 2 * k), y = eye[1] + y0 + (y1 - y0) * e;
  return (
    <group position={[eye[0] + x, y, eye[2] - d]}>
      {[[r * 3.2, '#ffd9a0', 0.22], [r * 2.0, '#ffe3b0', 0.4], [r * 1.3, '#fff0c4', 0.9], [r, '#fffbe4', 1]].map(([rr, col, op], i) => <mesh key={i} position={[0, 0, 0.01 * i]}><circleGeometry args={[rr as number, 28]} /><meshBasicMaterial color={col as string} transparent opacity={op as number} toneMapped={false} depthWrite={false} fog={false} /></mesh>)}
    </group>
  );
};
/** BĂNG RÔN MẶT NẠ TREO MẶT TIỀN (chương 15 cảnh 18, 20, 26): vải xanh lá viền vàng có mặt nạ sắt (cùng tranh với `MaskBanner` của quảng trường), buông từ một thanh ngang gắn vào tường; `drop` 0..1 = cuộn xuống từ thanh (0 = cuốn gọn). `pos` = giữa thanh ngang, ép sát mặt tường; `w` x `h` m; `f` cho gió nhẹ. */
const paintBangRonDai = (c: Ctx, W: number, H: number) => {
  c.clearRect(0, 0, W, H); const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#256a36'); g.addColorStop(0.5, '#2f7a40'); g.addColorStop(1, '#205c2e');
  c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H * 0.96); c.lineTo(W / 2, H * 0.9); c.lineTo(0, H * 0.96); c.closePath(); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.strokeStyle = '#e2b843'; c.lineWidth = W * 0.045; c.stroke(); c.strokeStyle = '#9a7426'; c.lineWidth = 3; c.strokeRect(W * 0.07, W * 0.07, W * 0.86, H * 0.84);
  for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)'; c.fillRect(W * (k / 6), 0, W / 6, H); }
  for (let k = 0; k < 4; k++) { c.fillStyle = '#e2b843'; const y = H * (0.07 + k * 0.1); c.beginPath(); c.moveTo(W / 2, y); c.lineTo(W / 2 + 22, y + 26); c.lineTo(W / 2, y + 52); c.lineTo(W / 2 - 22, y + 26); c.closePath(); c.fill(); }
  const cx = W / 2, cy = H * 0.7, s = W / 300 * 0.82;
  P(c, [[cx - 120 * s, cy + 150 * s], [cx - 100 * s, cy - 120 * s], [cx, cy - 175 * s], [cx + 100 * s, cy - 120 * s], [cx + 120 * s, cy + 150 * s], [cx, cy + 190 * s]], '#173f22');
  P(c, [[cx - 78 * s, cy - 92 * s], [cx, cy - 112 * s], [cx + 78 * s, cy - 92 * s], [cx + 70 * s, cy + 40 * s], [cx + 36 * s, cy + 112 * s], [cx, cy + 128 * s], [cx - 36 * s, cy + 112 * s], [cx - 70 * s, cy + 40 * s]], '#a9b3bf');
  P(c, [[cx, cy - 112 * s], [cx + 78 * s, cy - 92 * s], [cx + 70 * s, cy + 40 * s], [cx + 36 * s, cy + 112 * s], [cx, cy + 128 * s]], '#8892a0');
  P(c, [[cx - 62 * s, cy - 36 * s], [cx - 14 * s, cy - 26 * s], [cx - 20 * s, cy - 6 * s], [cx - 62 * s, cy - 14 * s]], '#1a1d22'); P(c, [[cx + 62 * s, cy - 36 * s], [cx + 14 * s, cy - 26 * s], [cx + 20 * s, cy - 6 * s], [cx + 62 * s, cy - 14 * s]], '#1a1d22');
  P(c, [[cx - 8 * s, cy - 20 * s], [cx + 8 * s, cy - 20 * s], [cx + 14 * s, cy + 52 * s], [cx, cy + 62 * s], [cx - 14 * s, cy + 52 * s]], '#c9d1da'); P(c, [[cx - 34 * s, cy + 78 * s], [cx + 34 * s, cy + 78 * s], [cx + 26 * s, cy + 90 * s], [cx - 26 * s, cy + 90 * s]], '#1a1d22');
  c.restore();
};
export const BangRonToa: React.FC<{pos: V3; w?: number; h?: number; drop?: number; f?: number}> = ({pos, w = 2.2, h = 7.0, drop = 1, f = 0}) => {
  const map = useMemo(() => tex('lo1517-bangron-dai', 300, 1000, paintBangRonDai), []);
  const dr = clamp01(drop), sway = Math.sin(f * 0.05) * 0.03;
  return (
    <group position={pos}>
      <B p={[0, 0.1, 0.12]} s={[w + 0.5, 0.12, 0.14]} c="#3a2a1c" />{[-1, 1].map((s2) => <B key={s2} p={[s2 * (w / 2 + 0.2), 0.0, 0.06]} s={[0.1, 0.32, 0.22]} c="#4a3622" />)}{[-1, 1].map((s2) => <B key={`k${s2}`} p={[s2 * (w / 2 + 0.28), 0.1, 0.12]} s={[0.14, 0.14, 0.14]} c="#e2b843" />)}
      {dr > 0.01 ? <group position={[0, 0, 0.16]} scale={[1, dr, 1]} rotation={[sway, 0, 0]}><mesh position={[0, -h / 2, 0]} castShadow><planeGeometry args={[w, h]} /><meshLambertMaterial map={map} transparent alphaTest={0.4} side={THREE.DoubleSide} /></mesh></group> : null}
    </group>
  );
};

// ================================================================ E. chương 17: vũ trụ sụp, hành tinh chắp vá, chân trời Battleworld
/** ĐĨA VŨ TRỤ (chương 17 cảnh 6): bảy đĩa phẳng cỡ khác nhau, vành kem xanh ngọc, trong lòng là thiên hà tím hồng, xếp ba độ sâu (z 0, −2,5, −5; khung ở z 0 rộng x ±4,4, y ±2,5). Đĩa lớn nhất ở giữa lệch trái, cao 45 % khung (đường kính 2,25).
 *  Lịch (khung `f - at`): 0–12 trôi yên; vành nứt từ ngoài vào ở 14, 18, 22, 26, 30 (năm đĩa nhỏ, đường nứt trắng gãy khúc); 30–52 các đĩa vỡ thành mảnh gãy góc mang theo phần thiên hà, lật và bị hút về tâm (0, 0, 0), sao kéo thành vệt; đĩa lớn nhất vỡ ở 52 ("sụp") rồi mảnh của nó bị hút 52–70.
 *  57–67: một đám mảnh vụn xoay chậm ở tâm. Flash và rung do cảnh quay đặt (khung 54). `at` dịch cả lịch. */
const DISCS = [
  {x: -0.8, y: 0.1, z: 0, r: 1.13, at: 52, seed: 1}, {x: 2.5, y: 0.9, z: -2.5, r: 0.7, at: 22, seed: 2}, {x: -3.0, y: -1.2, z: -2.5, r: 0.62, at: 14, seed: 3}, {x: 1.8, y: -1.4, z: 0, r: 0.5, at: 30, seed: 4},
  {x: -2.8, y: 1.5, z: -5, r: 0.45, at: 18, seed: 5}, {x: 3.4, y: -0.3, z: -5, r: 0.4, at: 26, seed: 6}, {x: 0.6, y: 1.7, z: -5, r: 0.35, at: 30, seed: 7},
];
const paintDisc = (seed: number) => (c: Ctx, W: number) => {
  const cx = W / 2, R = W * 0.49, r = rnd(seed * 9 + 1); c.clearRect(0, 0, W, W);
  c.fillStyle = '#e6f0d8'; c.beginPath(); c.arc(cx, cx, R, 0, 7); c.fill(); c.fillStyle = '#3fcab4'; c.beginPath(); c.arc(cx, cx, R * 0.93, 0, 7); c.fill();
  c.fillStyle = '#1c1240'; c.beginPath(); c.arc(cx, cx, R * 0.86, 0, 7); c.fill(); c.save(); c.beginPath(); c.arc(cx, cx, R * 0.86, 0, 7); c.clip();
  for (let k = 0; k < 3; k++) { c.fillStyle = ['#4a2a8a', '#8a3a9a', '#d85aa0'][k]; c.beginPath(); for (let a = 0; a <= 12; a++) { const t = (a / 12) * 6.2832 + k * 0.7, rr = R * (0.7 - k * 0.2) * (0.78 + 0.22 * Math.sin(a * 2.3 + seed + k)); c.lineTo(cx + Math.cos(t) * rr, cx + Math.sin(t) * rr * 0.55 + (k - 1) * 4); } c.closePath(); c.fill(); }
  for (let i = 0; i < 34; i++) { c.fillStyle = i % 4 ? '#f2e8ff' : '#ffd0f0'; const x = cx + (r() - 0.5) * R * 1.7, y = cx + (r() - 0.5) * R * 1.7, d = 2 + r() * 3; c.fillRect(x, y, d, d); }
  c.restore();
};
const discShards = (R: number, seed: number) => { const r = rnd(seed * 31 + 7), n = 7, rays = Array.from({length: n}, (_, i) => ((i + 0.3 * r()) / n) * 6.2832), out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) { const a0 = rays[i], a1 = rays[(i + 1) % n] + (i + 1 === n ? 6.2832 : 0), mid = (a0 + a1) / 2, ri = R * (0.25 + 0.2 * r()), pts: number[][] = [[Math.cos(mid) * ri * 0.3, Math.sin(mid) * ri * 0.3], [Math.cos(a0) * R, Math.sin(a0) * R], [Math.cos(mid) * R * 1.01, Math.sin(mid) * R * 1.01], [Math.cos(a1) * R, Math.sin(a1) * R]];
    const sh = new THREE.Shape(); pts.forEach(([x, y], k) => (k ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath(); const g = new THREE.ShapeGeometry(sh), p = g.attributes.position as THREE.BufferAttribute, uv: number[] = [];
    for (let k = 0; k < p.count; k++) uv.push(p.getX(k) / (R * 2) + 0.5, p.getY(k) / (R * 2) + 0.5); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); out.push(g); }
  return out; };
const Disc1: React.FC<{d: typeof DISCS[number]; f: number; shift: number}> = ({d, f, shift}) => {
  const map = useMemo(() => tex(`lo1517-disc-${d.seed}`, 384, 384, (c, W) => paintDisc(d.seed)(c, W)), [d.seed]);
  const shards = useMemo(() => discShards(d.r, d.seed), [d.r, d.seed]);
  const t = f - shift - d.at, cracked = t > 0, hut = clamp01((t - 8) / 24), rr = rnd(d.seed * 5 + 2);
  const crack = useMemo(() => { const q = rnd(d.seed * 13 + 4); return Array.from({length: 4}, (_, k) => { const a = (k / 4) * 6.2832 + q(), pts = [[Math.cos(a) * d.r * 0.95, Math.sin(a) * d.r * 0.95]]; for (let i = 1; i <= 4; i++) pts.push([Math.cos(a + (q() - 0.5) * 0.5) * d.r * (0.95 - i * 0.2), Math.sin(a + (q() - 0.5) * 0.5) * d.r * (0.95 - i * 0.2)]); return pts; }); }, [d.r, d.seed]);
  const drift = Math.sin(f * 0.02 + d.seed) * 0.05;
  if (hut >= 1) return null;
  return (
    <group position={[d.x + drift, d.y + Math.cos(f * 0.017 + d.seed) * 0.04, d.z]}>
      {!cracked || t < 8 ? <>
        <mesh renderOrder={1}><circleGeometry args={[d.r, 28]} /><meshBasicMaterial map={map} transparent toneMapped={false} /></mesh>
        {cracked ? crack.map((pts, k) => pts.slice(0, -1).map((p, i) => { const nx = pts[i + 1], len = Math.hypot(nx[0] - p[0], nx[1] - p[1]), vis = clamp01(t / 6 * 4 - (i + k * 0.2)); return vis > 0 ? <mesh key={`${k}${i}`} position={[(p[0] + nx[0]) / 2, (p[1] + nx[1]) / 2, 0.01]} rotation={[0, 0, Math.atan2(nx[1] - p[1], nx[0] - p[0])]} renderOrder={2}><planeGeometry args={[len * vis, d.r * 0.03]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh> : null; })) : null}
      </> : shards.map((g, i) => { const a = (i / shards.length) * 6.2832 + rr(), push = Math.min(1, (t - 8) / 8) * 0.18 * d.r, e = hut * hut, tx = -(d.x + Math.cos(a) * push) * e, ty = -(d.y + Math.sin(a) * push) * e, tz = -d.z * e;
        return <group key={i} position={[Math.cos(a) * push + tx, Math.sin(a) * push + ty, tz]} rotation={[(t * 0.04 + i) * hut * 3, (t * 0.03 + i * 2) * hut * 2, (i - 3) * 0.06 + hut * 6 * (i % 2 ? 1 : -1)]} scale={1 - 0.7 * e}>
          <mesh geometry={g} renderOrder={1}><meshBasicMaterial map={map} side={THREE.DoubleSide} toneMapped={false} /></mesh>
          {hut > 0.1 ? <mesh position={[tx * 0.12, ty * 0.12, -0.02]} rotation={[0, 0, Math.atan2(ty, tx)]}><planeGeometry args={[0.5 * hut, 0.012]} /><meshBasicMaterial color="#f2e8ff" transparent opacity={0.6 * (1 - hut)} toneMapped={false} /></mesh> : null}
        </group>; })}
    </group>
  );
};
export const DaVuTru: React.FC<{f: number; at?: number}> = ({f, at = 0}) => <group>{DISCS.map((d) => <Disc1 key={d.seed} d={d} f={f} shift={at} />)}</group>;

/** HÀNH TINH CHẮP VÁ (chương 17 cảnh 7, 10, 11): quả cầu dẹt (đĩa) ghép từ các mảng cắt giấy mang nơi chốn trong đời Doom: rừng núi có trại lều, núi tuyết có tu viện, phố New York ô vuông, sa mạc đỏ, biển, và lâu đài Latveria (mảng lớn nhất, ghép sau cùng);
 *  `ghep` 0..1 = số mảng đã khớp (mảng chưa khớp để trống nền tối); `khe` 0..1 = độ sáng khe khâu xanh lá (đường khâu chạy quanh quả cầu); r m, mặt hướng +z. Nửa phải đĩa tối một mảng mép cong sắc. */
const PATCH = [
  {c: '#3f7a44', icon: 'trai'}, {c: '#eef3f6', icon: 'tuvien'}, {c: '#7a8794', icon: 'pho'}, {c: '#c4623a', icon: 'samac'}, {c: '#2f5f9a', icon: 'bien'}, {c: '#5c8a4c', icon: 'rung'}, {c: '#d9c9a0', icon: 'lau'},
];
const patchCache = (() => { let m: {idx: Int16Array; pts: number[][]} | null = null; return () => {
  if (m) return m; const S = 256, pts = [[0.22, 0.3], [0.5, 0.1], [0.2, 0.68], [0.5, 0.9], [0.86, 0.72], [0.86, 0.3], [0.58, 0.48]].map(([u, v]) => [u * S, v * S]);
  const idx = new Int16Array(S * S); for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { let b = 0, bd = 1e9; pts.forEach((q, k) => { const d = (q[0] - i) ** 2 + (q[1] - j) ** 2 - (k === 6 ? 0.07 * S * S : 0); if (d < bd) { bd = d; b = k; } }); idx[j * S + i] = b; }
  m = {idx, pts}; return m; }; })();
const paintPlanet = (q: number, seams: boolean) => (c: Ctx, W: number) => {
  const S = 256, {idx, pts} = patchCache(), k = Math.round((q / 10) * 7), img = c.createImageData(S, S), ORDER = [0, 1, 2, 3, 4, 5, 6];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const b = idx[j * S + i], dx = i - S / 2, dy = j - S / 2, inside = dx * dx + dy * dy < (S / 2) ** 2, seam = (i + 1 < S && idx[j * S + i + 1] !== b) || (j + 1 < S && idx[(j + 1) * S + i] !== b), o = (j * S + i) * 4, on = ORDER.indexOf(b) < k;
    let col = new THREE.Color(on ? PATCH[b].c : '#23284a'); if (seam && on) col = new THREE.Color('#3dff8e'); const shade = i > S * 0.64 + (j - S / 2) * 0.12 ? 0.72 : 1;
    if (seams && !(seam && on)) { img.data[o + 3] = 0; continue; }
    img.data[o] = col.r * 255 * shade; img.data[o + 1] = col.g * 255 * shade; img.data[o + 2] = col.b * 255 * shade; img.data[o + 3] = inside ? 255 : 0; }
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = S; tmp.getContext('2d')!.putImageData(img, 0, 0); c.clearRect(0, 0, W, W); c.drawImage(tmp, 0, 0, W, W);
  if (!seams) { const sc = W / S; c.save(); c.beginPath(); c.arc(W / 2, W / 2, W / 2, 0, 7); c.clip();
    PATCH.forEach((pt, b) => { if (b >= k) return; const x = pts[b][0] * sc, y = pts[b][1] * sc; c.save(); c.translate(x, y); c.scale(sc * (b === 6 ? 1.55 : 1.05), sc * (b === 6 ? 1.55 : 1.05));
      if (pt.icon === 'trai') { P(c, [[-22, 12], [0, -18], [22, 12]], '#e6d8a8'); P(c, [[-6, 12], [0, 2], [6, 12]], '#6a4a2a'); }
      if (pt.icon === 'tuvien') { c.fillStyle = '#b89870'; c.fillRect(-20, -6, 40, 20); P(c, [[-24, -6], [0, -24], [24, -6]], '#8a5a3a'); c.fillStyle = '#4a3020'; c.fillRect(-4, 2, 8, 12); }
      if (pt.icon === 'pho') { c.fillStyle = '#4a5560'; for (let a = -2; a <= 2; a++) for (let bb = -1; bb <= 1; bb++) c.fillRect(a * 16 - 5, bb * 18 - 7, 10, 14); c.fillStyle = '#8a95a0'; c.fillRect(-30, -30, 60, 4); }
      if (pt.icon === 'samac') { P(c, [[-30, 14], [-10, -14], [6, 2], [30, 14]], '#a64a28'); P(c, [[-10, -14], [-2, -6], [-14, -6]], '#e0b090'); }
      if (pt.icon === 'bien') { c.strokeStyle = '#9ac8f0'; c.lineWidth = 3; for (let a = -1; a <= 1; a++) { c.beginPath(); c.moveTo(-20, a * 14); c.lineTo(-10, a * 14 - 5); c.lineTo(0, a * 14); c.lineTo(10, a * 14 - 5); c.lineTo(20, a * 14); c.stroke(); } }
      if (pt.icon === 'rung') { for (let a = -1; a <= 1; a++) P(c, [[a * 16 - 9, 12], [a * 16, -16], [a * 16 + 9, 12]], '#2f5a30'); }
      if (pt.icon === 'lau') { c.fillStyle = '#a89870'; c.fillRect(-24, -8, 48, 26); c.fillStyle = '#8a7a58'; [-24, -8, 8, 20].forEach((dx) => c.fillRect(dx, -24, 6, 18)); P(c, [[-30, -24], [-20, -36], [-10, -24]], '#7a3a2a'); P(c, [[10, -24], [20, -36], [30, -24]], '#7a3a2a'); P(c, [[-8, -24], [0, -40], [8, -24]], '#7a3a2a'); c.fillStyle = '#2a2018'; c.fillRect(-5, 4, 10, 14); }
      c.restore(); });
    c.restore(); }
};
export const HanhTinhChapVa: React.FC<{pos: V3; r?: number; ghep?: number; khe?: number; f?: number}> = ({pos, r = 1, ghep = 1, khe = 1, f = 0}) => {
  const q = Math.round(clamp01(ghep) * 10), base = useMemo(() => tex(`lo1517-planet-${q}`, 512, 512, (c, W) => paintPlanet(q, false)(c, W)), [q]), seam = useMemo(() => tex(`lo1517-planet-seam-${q}`, 512, 512, (c, W) => paintPlanet(q, true)(c, W)), [q]);
  const blink = 0.75 + 0.25 * Math.sin(f * 0.2);
  return (
    <group position={pos}>
      <mesh position={[0, 0, -0.01]}><circleGeometry args={[r * 1.06, 32]} /><meshBasicMaterial color="#8af0b8" transparent opacity={0.25 * clamp01(khe)} toneMapped={false} depthWrite={false} /></mesh>
      <mesh renderOrder={5}><circleGeometry args={[r, 32]} /><meshBasicMaterial map={base} transparent toneMapped={false} /></mesh>
      {khe > 0.02 ? <mesh position={[0, 0, 0.01]} renderOrder={6}><circleGeometry args={[r, 32]} /><meshBasicMaterial map={seam} transparent opacity={clamp01(khe) * blink} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh> : null}
      <Halo pos={[0, 0, 0.05]} r={r * 1.7} color="#3dff8e" strength={0.25 * clamp01(khe)} />
    </group>
  );
};

/** CHÂN TRỜI CHẮP VÁ (Battleworld `than`, chương 17 cảnh 8): dải mảng đất ghép vá ở chân trời (vàng, nâu, xanh rêu, đỏ) có khe khâu xanh lá sáng (thay cho khe tím); treo ở `d` m trước nền trời, rộng 2 × `d` × 0,5; gốc = mắt máy. */
export const ChanTroiChapVa: React.FC<{eye: V3; d?: number; k?: number; f?: number; cao?: number}> = ({eye, d = 240, k = 1, f = 0, cao = 26}) => {
  const map = useMemo(() => tex('lo1517-chantroi', 2048, 256, (c, W, H) => {
    const r = rnd(41), cols = ['#d9b45a', '#b8864a', '#6a8a48', '#c4623a', '#e8d49a', '#8a7a58']; c.clearRect(0, 0, W, H);
    let x = 0; while (x < W) { const w = 140 + r() * 220, h = H * (0.35 + 0.35 * r()); c.fillStyle = cols[Math.floor(r() * cols.length)]; c.beginPath(); c.moveTo(x, H); c.lineTo(x, H - h * 0.7); c.lineTo(x + w * 0.3, H - h); c.lineTo(x + w * 0.7, H - h * 0.85); c.lineTo(x + w, H - h * 0.6); c.lineTo(x + w, H); c.closePath(); c.fill();
      c.strokeStyle = '#3dff8e'; c.lineWidth = 5; c.setLineDash([14, 8]); c.beginPath(); c.moveTo(x + w, H); c.lineTo(x + w, H - h * 0.6); c.lineTo(x + w * 0.7, H - h * 0.85); c.lineTo(x + w * 0.3, H - h); c.stroke(); c.setLineDash([]); x += w; }
  }), []);
  return <mesh position={[eye[0], eye[1] + cao * 0.5, eye[2] - d]} renderOrder={-0.4}><planeGeometry args={[d * 2.4, d * 0.3]} /><meshBasicMaterial map={map} transparent opacity={k * (0.85 + 0.15 * Math.sin(f * 0.15))} toneMapped={false} depthWrite={false} fog={false} /></mesh>;
};
/** HÀNG CỜ MẶT NẠ (Battleworld `than`, chương 17 cảnh 8): cờ xanh lá viền vàng có mặt nạ sắt trên cọc gỗ, n lá xếp từ xa về gần dọc một đường; `bung` (khung đã trôi, mỗi lá bung sau lá trước `cach` khung, lá bung trong 8 khung); `f` cho phấp phới.
 *  `from` → `to` (xa tới gần), cờ cao `cao` m (cột), lá cờ rộng 0,7 × cao. */
const paintCoMat = (c: Ctx, W: number, H: number) => {
  c.fillStyle = '#2f7a40'; c.fillRect(0, 0, W, H); c.fillStyle = '#e2b843'; c.fillRect(0, 0, W, 8); c.fillRect(0, H - 8, W, 8); c.fillRect(0, 0, 8, H); c.fillRect(W - 8, 0, 8, H);
  const cx = W / 2, cy = H / 2, s = H / 330; P(c, [[cx - 78 * s, cy - 92 * s], [cx, cy - 112 * s], [cx + 78 * s, cy - 92 * s], [cx + 70 * s, cy + 40 * s], [cx + 36 * s, cy + 112 * s], [cx, cy + 128 * s], [cx - 36 * s, cy + 112 * s], [cx - 70 * s, cy + 40 * s]], '#a9b3bf');
  P(c, [[cx, cy - 112 * s], [cx + 78 * s, cy - 92 * s], [cx + 70 * s, cy + 40 * s], [cx + 36 * s, cy + 112 * s], [cx, cy + 128 * s]], '#8892a0'); P(c, [[cx - 62 * s, cy - 36 * s], [cx - 14 * s, cy - 26 * s], [cx - 20 * s, cy - 6 * s], [cx - 62 * s, cy - 14 * s]], '#1a1d22'); P(c, [[cx + 62 * s, cy - 36 * s], [cx + 14 * s, cy - 26 * s], [cx + 20 * s, cy - 6 * s], [cx + 62 * s, cy - 14 * s]], '#1a1d22');
};
export const HangCoMatNa: React.FC<{from: V3; to: V3; n?: number; bung: number; cach?: number; f?: number; cao?: number}> = ({from, to, n = 8, bung, cach = 4, f = 0, cao = 2.4}) => {
  const map = useMemo(() => tex('lo1517-comat', 256, 192, paintCoMat), []);
  return <group>{Array.from({length: n}, (_, i) => { const t = n > 1 ? i / (n - 1) : 0, p: V3 = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t], u = clamp01((bung - i * cach) / 8), e = u * u * (3 - 2 * u), sw = Math.sin(f * 0.18 + i * 1.3) * 0.12 * e;
    return <group key={i} position={p}>
      <B p={[0, cao / 2, 0]} s={[0.07, cao, 0.07]} c="#6a4426" /><mesh position={[0, cao + 0.05, 0]}><coneGeometry args={[0.07, 0.2, 6]} /><meshLambertMaterial color="#c98a3c" flatShading /></mesh>
      {e > 0.02 ? <group position={[0.04, cao - 0.1, 0]} rotation={[0, sw, 0]}><mesh position={[0.42 * e, -0.33, 0]} scale={[e, 1, 1]}><planeGeometry args={[0.84, 0.66]} /><meshBasicMaterial map={map} side={THREE.DoubleSide} toneMapped={false} /></mesh></group> : null}
    </group>; })}</group>;
};
