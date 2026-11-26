import React from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {GradeCtx, Finish} from '../lib3/look';
import {B, StageCam, Motes} from '../lib3/kit';
import {Plate} from '../lib3/depth';
import {HoledWall, tex, DriftSpecks, Cable} from '../lib3/kitLab';
import {SetGlow} from '../lib3/kitForge';
import {Sun} from '../lib3/room';
import {XoayCtx} from '../lib3/duongMay';
import {paintSkyNy, paintSkylineNy} from '../lib3/kitPhoNewYork';
import {BangVe, TuMay, BanMay, TenLua, KeKinh, BanTruoc, DenOng, BieuDo, MayTuongTu, LabBadge, Ghe, MayBayNho, Dongho, CayCanh, ChanDia, paintTiles, paintLabWall} from '../lib3/kitPhongReed';

/** PHÒNG THÍ NGHIỆM CỦA REED RICHARDS Ở NEW YORK, thập niên 1960, tầng cao của trụ sở Fantastic Four (chương 11 cảnh 2, 4, 16, 23-27; chương 12 cảnh 24). KHÁC HẲN phòng của Victor và hầm của Doom:
 *  sáng, trắng và xanh ngọc nhạt, thép và kính, nhiều máy. Vỏ phòng hở mặt trước, máy nhìn thẳng -z; người vào qua `children`.
 *    phòng x -6..6, z -8 (tường sau) .. 2 (mặt trước hở), cao 4. Sàn gạch vuông trắng xám, trần trắng có đèn ống.
 *    tường sau, trái sang phải:  x -6..-5,5 kệ thấp có hộp dụng cụ | x -5,4..-3,2 BẢNG BẢN VẼ tên lửa (cao 1,0..2,6) | x -3,0..0,6 MẢNG TƯỜNG TRƠN xanh xám sẫm cao 0,9..3,4, trên cùng huy hiệu số 4
 *                                (mảng sạch cho đầu người: KHÔNG có gì khác trên mảng này) | x 1..5 CỬA KÍNH LỚN cao 0,9..3,6, khung thép chia ô, nhìn ra nhà chọc trời | x 4,95..5,9 hai tủ máy tính (cuộn băng quay, đèn nháy).
 *    tầm giữa: BÀN MÁY dài (x 1,8..4,2, z -6,2) ba màn hình tròn, cần gạt, đèn kẹp; MÔ HÌNH TÊN LỬA (-5,0, -6,6) cao 1,6; máy tính tương tự trên xe đẩy (-4,3, -7,2) không, xem MAY_TT; kệ thuỷ tinh tường trái;
 *    hàng thứ hai: hai tủ máy tính dọc tường phải; biểu đồ ô màu trên tường phải; ghế xoay sau bàn máy.
 *    tiền cảnh (`banTruoc`): mép bàn thí nghiệm trắng có ống nghiệm, góc dưới phải, chỉ hợp máy chuẩn.
 *  TRẠNG THÁI (`state`): ngay (nắng trắng xanh qua cửa kính, bóng ô cửa trên sàn, đèn trần sáng), chang-vang (trời cam tím, mặt trời thấp rọi cam qua cửa, nhà xa bật đèn, đèn trần dịu), dem (đèn trần tắt, đèn bàn máy xanh, màn hình sáng, thành phố đêm).
 *  Phụ: `mayBay` đặt chiếc máy bay bạc nhỏ trên ray ở giữa bàn máy (chương 12 cảnh 24), `lever` góc cần gạt, `f` khung hình (cuộn băng quay, đèn nháy, màn hình, bụi). */
type V3 = [number, number, number];
export type PhongReedState = 'ngay' | 'chang-vang' | 'dem';
export type PhongReedView = 'chuan' | 'rong' | 'ban' | 'bang' | 'cua';
/** góc máy (mắt): chuan = máy chuẩn của danh sách; rong = cả phòng; ban = từ trước bàn máy nhìn cửa kính (Reed đứng sau bàn, chương 12 cảnh 24); bang = sát bảng bản vẽ (cảnh 2); cua = nhìn cửa kính nhà chọc trời (cảnh 16) */
export const PR_VIEWS: Record<PhongReedView, V3> = {
  chuan: [0, 1.5, 3.5],
  rong: [0, 1.8, 7.5],
  ban: [3.0, 1.45, -3.0],
  bang: [-3.4, 1.5, -1.6],
  cua: [2.6, 1.5, -0.2],
};
/** mốc đứng (chân). Trục: Fantastic Four bên TRÁI, Doom bên PHẢI. */
export const PR_MARKS = {
  reedBanVe: [-1.0, 0, -6.0] as V3,
  hangBon: {sue: [-2.4, 0, -4.6] as V3, johnny: [-0.9, 0, -4.9] as V3, ben: [0.7, 0, -4.6] as V3, reed: [2.3, 0, -4.9] as V3},
  sueDem: [-1.4, 0, -6.6] as V3,
  doiMat: {doom: [-2.2, 0, -5.2] as V3, reed: [-0.2, 0, -5.2] as V3},
  giuaNhom: {sue: [-3.4, 0, -5.6] as V3, ben: [-2.0, 0, -5.2] as V3, johnny: [-0.8, 0, -5.8] as V3, reedDoomTu: [2.6, 0, -4.4] as V3, reedDoomDen: [0.6, 0, -4.6] as V3},
  /** chương 12 cảnh 24: Reed sau bàn máy, giữa bàn và cửa kính */
  reedBan: [3.0, 0, -7.0] as V3,
  mayBay: [3.0, 0.9, -6.2] as V3,
};
const W = 12, L = 10, H = 4, WIN = {x0: 7.0, x1: 11.0, y0: 0.9, y1: 3.6};
const SUN: Record<PhongReedState, {from: V3; to: V3; k: number; color: string}> = {
  ngay: {from: [4, 7, -16], to: [0, 0, -3], k: 3.1, color: '#fff6e6'},
  'chang-vang': {from: [5, 1.9, -16], to: [0, 0.4, -3], k: 3.4, color: '#ff9a52'},
  dem: {from: [4, 7, -16], to: [0, 0, -3], k: 0, color: '#9ab0ff'},
};
const backTex = () => tex('pr-wall-back', 2400, 800, paintLabWall(W, H, [3.0, 6.6, 0.9, 3.4]));
const sideTex = (k: number) => tex(`pr-wall-side-${k}`, 2000, 800, paintLabWall(L, H));
const floorTex = () => tex('pr-floor', 1200, 1000, paintTiles(4));
const ceilTex = () => tex('pr-ceil', 512, 512, (c, Wd, Hd) => { c.fillStyle = '#f2f4f4'; c.fillRect(0, 0, Wd, Hd); c.strokeStyle = 'rgba(120,140,146,0.3)'; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * Wd / 8, 0); c.lineTo(i * Wd / 8, Hd); c.moveTo(0, i * Hd / 8); c.lineTo(Wd, i * Hd / 8); c.stroke(); } });

const Shell: React.FC<{glow: number}> = ({glow}) => (
  <group>
    <SetGlow amount={glow} tint="#e8f2f4"><group position={[-6, 0, -8]}><HoledWall w={W} h={H} t={0.5} map={backTex()} slab="#aab6ba" holes={[{kind: 'rect', ...WIN}]} /></group></SetGlow>
    <SetGlow amount={glow} tint="#e8f2f4"><group position={[-6, 0, 2]} rotation={[0, Math.PI / 2, 0]}><HoledWall w={L} h={H} t={0.5} map={sideTex(0)} slab="#aab6ba" /></group></SetGlow>
    <SetGlow amount={glow} tint="#e8f2f4"><group position={[6, 0, -8]} rotation={[0, -Math.PI / 2, 0]}><HoledWall w={L} h={H} t={0.5} map={sideTex(1)} slab="#aab6ba" /></group></SetGlow>
    <SetGlow amount={glow * 0.7} tint="#e8f0f2"><mesh position={[0, 0, -3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[W, L]} /><meshLambertMaterial map={floorTex()} /></mesh></SetGlow>
    <SetGlow amount={glow} tint="#ffffff"><mesh position={[0, H, -3]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[W, L]} /><meshLambertMaterial map={ceilTex()} /></mesh></SetGlow>
    {/* a duct and a beam along the ceiling */}
    <B p={[0, H - 0.17, -7.3]} s={[W, 0.34, 0.7]} c="#e4eaec" /><B p={[0, H - 0.12, -1.0]} s={[W, 0.24, 0.3]} c="#e4eaec" cast={false} />
    <B p={[0, H - 0.36, -7.3]} s={[W, 0.04, 0.72]} c="#46707b" cast={false} />
    {/* the window: steel frame, mullions, a deep sill, a faint reflection of the room */}
    <group position={[-6, 0, -8]}>
      {[WIN.x0, WIN.x1].map((x) => <B key={x} p={[x, (WIN.y0 + WIN.y1) / 2, 0.06]} s={[0.1, WIN.y1 - WIN.y0 + 0.1, 0.14]} c="#3d464d" />)}
      {[WIN.y0, WIN.y1].map((y) => <B key={y} p={[(WIN.x0 + WIN.x1) / 2, y, 0.06]} s={[WIN.x1 - WIN.x0 + 0.1, 0.1, 0.14]} c="#3d464d" />)}
      {[1, 2, 3].map((i) => <B key={i} p={[WIN.x0 + ((WIN.x1 - WIN.x0) * i) / 4, (WIN.y0 + WIN.y1) / 2, 0.06]} s={[0.05, WIN.y1 - WIN.y0, 0.08]} c="#3d464d" cast={false} />)}
      {[1, 2].map((i) => <B key={i} p={[(WIN.x0 + WIN.x1) / 2, WIN.y0 + ((WIN.y1 - WIN.y0) * i) / 3, 0.06]} s={[WIN.x1 - WIN.x0, 0.05, 0.08]} c="#3d464d" cast={false} />)}
      <B p={[(WIN.x0 + WIN.x1) / 2, WIN.y0 - 0.03, 0.3]} s={[WIN.x1 - WIN.x0 + 0.3, 0.07, 0.62]} c="#eef1f2" />
      <mesh position={[(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, 0.02]}><planeGeometry args={[WIN.x1 - WIN.x0, WIN.y1 - WIN.y0]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.05} depthWrite={false} /></mesh>
    </group>
  </group>
);

export const PhongReed: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: PhongReedState; mayBay?: boolean; lever?: number; banTruoc?: boolean; bui?: boolean}> =
  ({children, f = 0, dx, dz, eye = PR_VIEWS.chuan, state = 'ngay', mayBay = false, lever = 0.2, banTruoc = true, bui = true}) => { datNoiBui('trong-nha');
    const dem = state === 'dem', cv = state === 'chang-vang', sun = SUN[state], on = dem ? 0 : cv ? 0.65 : 1, k = `${state}-${eye.join()}`;
    return (
      <GradeCtx.Provider value="brightInterior">
        <StageCam eye={eye} haze={dem ? '#46507a' : '#dfe8ee'} fog={[80, 900]} dx={dx} dz={dz} />
        <hemisphereLight args={dem ? ['#8a9ed8', '#4a5470', 1.05] : cv ? ['#ffe2c8', '#a89a98', 1.3] : ['#ffffff', '#c9d2d6', 1.65]} />
        {sun.k > 0 ? <Sun from={sun.from} to={sun.to} intensity={sun.k} color={sun.color} /> : null}
        {[-3.4, 3.2].map((x) => <pointLight key={x} position={[x, 2.6, 0.6]} color={dem ? '#9ab4ff' : '#fff4e0'} intensity={dem ? 5 : 9} distance={6.5} decay={1} />)}
        {dem ? <pointLight position={[3.0, 1.3, -5.4]} color="#7dffb0" intensity={6} distance={4.5} decay={1.4} /> : null}
        {/* the city outside: sky and two ranks of towers, painted for a lab high up (eye 38 m above the street) */}
        <Plate from={eye} id={`pr-sky-${state}`} d={eye[2] + 420} paint={paintSkyNy(state)} fog={false} />
        <Plate from={eye} id={`pr-far-${k}`} d={eye[2] + 270} paint={paintSkylineNy(38, eye[0], eye[2] + 270, 0, state, 5)} fog={false} />
        <Plate from={eye} id={`pr-mid-${k}`} d={eye[2] + 150} paint={paintSkylineNy(38, eye[0], eye[2] + 150, 1, state, 9)} fog={false} />
        <Shell glow={dem ? 0.5 : cv ? 0.4 : 0.42} />
        {/* ceiling lights */}
        {[-3.6, 0, 3.6].flatMap((x) => [-6.2, -3.4, -0.6].map((z) => <DenOng key={`${x}${z}`} pos={[x, H - 0.04, z]} on={on} />))}
        {/* back wall: low shelf with tool boxes, the blueprint board, the badge, the computer cabinets */}
        <B p={[-5.75, 0.5, -7.7]} s={[0.5, 1.0, 0.5]} c="#c9d0d4" /><B p={[-5.75, 1.02, -7.7]} s={[0.54, 0.04, 0.54]} c="#46707b" />
        {[['#c8352a', 0.42], ['#2a5db0', 0.34]].map(([c, w], i) => <group key={i}><B p={[-5.8, 1.1 + i * 0.16, -7.68]} s={[w as number, 0.14, 0.26]} c={c as string} /><B p={[-5.8, 1.19 + i * 0.16, -7.68]} s={[0.16, 0.03, 0.06]} c="#c9ced2" cast={false} /></group>)}
        <BangVe pos={[-4.3, 1.9, -7.96]} />
        <Dongho pos={[-4.3, 3.25, -7.96]} />
        <LabBadge pos={[-1.2, 2.95, -7.96]} r={0.35} />
        <TuMay pos={[5.45, 0, -7.55]} f={f} seed={1} tone="#9aa3a8" /><TuMay pos={[4.5, 0, -7.55]} f={f + 7} seed={2} tone="#a8b0b4" w={0.9} h={1.9} />
        {/* middle: the control desk, the rocket model, the analog computer, the chair */}
        <BanMay pos={[3.0, 0, -6.2]} f={f} lever={lever} />
        <TenLua pos={[-5.0, 0, -6.6]} />
        <MayTuongTu pos={[-3.9, 0, -7.2]} f={f} />
        <Ghe pos={[2.6, 0, -5.4]} rotY={2.6} />
        {mayBay ? <MayBayNho pos={[3.0, 0.9, -6.2]} /> : null}
        {/* left wall: glassware shelves; right wall: two more cabinets and the colour chart */}
        <KeKinh pos={[-5.98, 1.35, -3.4]} rotY={Math.PI / 2} w={1.6} seed={1} /><KeKinh pos={[-5.98, 2.05, -3.4]} rotY={Math.PI / 2} w={1.6} seed={2} /><KeKinh pos={[-5.98, 1.35, -5.4]} rotY={Math.PI / 2} w={1.2} seed={3} />
        <B p={[-5.7, 0.45, -1.4]} s={[0.6, 0.9, 1.2]} c="#c9d0d4" /><B p={[-5.7, 0.92, -1.4]} s={[0.64, 0.04, 1.24]} c="#46707b" />
        <TuMay pos={[5.62, 0, -4.4]} f={f + 3} seed={3} tone="#9aa3a8" w={0.9} />
        <TuMay pos={[5.62, 0, -3.3]} f={f + 11} seed={4} tone="#a8b0b4" w={0.9} h={1.9} />
        <BieuDo pos={[5.97, 2.4, -1.2]} rotY={-Math.PI / 2} />
        {/* floor: cables from the cabinets to the desk and from the desk to the rocket */}
        <Cable pts={[[5.0, 0.03, -7.2], [4.6, 0.03, -6.8], [4.1, 0.03, -6.0]]} r={0.03} />
        <Cable pts={[[2.2, 0.03, -6.0], [0.5, 0.03, -6.9], [-2.9, 0.03, -7.0], [-4.6, 0.03, -6.8]]} r={0.028} color="#2a5db0" />
        <Cable pts={[[5.5, 0.03, -3.0], [5.0, 0.03, -3.8], [4.4, 0.03, -5.5]]} r={0.026} color="#c8352a" />
        <CayCanh pos={[5.35, 0, -1.9]} /><CayCanh pos={[-5.5, 0, -0.2]} s={0.8} />
        <ChanDia pos={[-5.75, 1.04, -7.7]} />
        {/* the white bench in the foreground */}
        {banTruoc ? <BanTruoc pos={[1.45, 0, 1.0]} w={2.0} /> : null}
        {/* air: dust in the sun, a few motes by the window */}
        {bui ? <>
          <DriftSpecks f={f} box={[0.6, 5.6, 0.6, 3.6, -7.6, -1.5]} n={dem ? 14 : 36} color={cv ? '#ffd9a0' : '#fff6e0'} size={0.007} wind={[0.02, 0.02]} glow={0.3} seed={4} />
          <Motes f={f} box={[-5, 5, 0.8, 3.4, -7, -1]} n={10} color="#ffffff" size={0.008} drift={0.2} glow={0.1} seed={5} />
        </> : null}
        {children}
      </GradeCtx.Provider>
    );
  };

// ---------------------------------------------------------------- stills (no people): each state and each view
type Props = React.ComponentProps<typeof PhongReed>;
const mk = (p: Props, yaw = 0): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><XoayCtx.Provider value={yaw}><PhongReed {...p} /></XoayCtx.Provider></ThreeCanvas></Finish></AbsoluteFill>;
};
const S = {
  ngayChuan: mk({state: 'ngay', eye: PR_VIEWS.chuan, f: 10}),
  ngayRong: mk({state: 'ngay', eye: PR_VIEWS.rong, f: 10, banTruoc: false}),
  ngayBan: mk({state: 'ngay', eye: PR_VIEWS.ban, f: 10, mayBay: true, banTruoc: false}),
  ngayBang: mk({state: 'ngay', eye: PR_VIEWS.bang, f: 10, banTruoc: false}),
  ngayCua: mk({state: 'ngay', eye: PR_VIEWS.cua, f: 10, banTruoc: false}),
  changVangChuan: mk({state: 'chang-vang', eye: PR_VIEWS.chuan, f: 10}),
  changVangRong: mk({state: 'chang-vang', eye: PR_VIEWS.rong, f: 10, banTruoc: false}),
  demChuan: mk({state: 'dem', eye: PR_VIEWS.chuan, f: 10}),
};
export const PhongReedComps: React.FC = () => (
  <>
    <Composition id="phong-reed-ngay-chuan" component={S.ngayChuan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="phong-reed-ngay-rong" component={S.ngayRong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="phong-reed-ngay-ban" component={S.ngayBan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="phong-reed-ngay-bang" component={S.ngayBang} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="phong-reed-ngay-cua" component={S.ngayCua} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="phong-reed-chang-vang-chuan" component={S.changVangChuan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="phong-reed-chang-vang-rong" component={S.changVangRong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="phong-reed-dem-chuan" component={S.demChuan} width={1280} height={720} fps={24} durationInFrames={1} />
  </>
);
