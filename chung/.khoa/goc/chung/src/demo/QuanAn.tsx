import React from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Finish, GradeCtx} from '../lib3/look';
import {B, StageCam, Motes} from '../lib3/kit';
import {HoledWall, tex} from '../lib3/kitLab';
import {SetGlow} from '../lib3/kitForge';
import {CeilingFan, Sun} from '../lib3/room';
import {DenOng} from '../lib3/kitPhongReed';
import {
  BanGoc, BangHomNay, BienThiec, BangThucDon, BepSau, CocCaPhe, CuaKinhQuan, CumGiaVi, DiaBanhAnhDao, DiaBanhKep, DoTreoTuong, DongHoQuan, GheDau, GiaBaoTruoc, KeChuyenMon, KeCoc, KetTien, LoDuong, LyNuocNgot,
  MiengBanhAnhDao, OBanhMi, OKinh, PhoNgoaiKinh, QuayQuan, SoiHoi, TuBanhKinh, TuSauQuay, VetNang, ViDa, XapTien, ToTien, ManhVoBanh, paintSanCaRo, paintTranThiec, paintTuongQuan,
} from '../lib3/kitQuanAn';

/** QUÁN ĂN VEN ĐƯỜNG KIỂU MỸ của Purple Man (chương 15, cảnh 4-10). Ban ngày, phòng hở mặt trước, máy nhìn thẳng -z; người vào qua `children`.
 *    phòng x -4,5..4,5, tường sau z -6, mặt trước hở z 1, trần 3,2.
 *    tường sau, trái sang phải: kệ cốc | ô chuyển món (x -3,2..-1,6) | bảng thực đơn | mảng bạc hà sạch sau đầu ông chủ, đồng hồ, lịch, điện thoại | ô kính trái có bảng món hôm nay | CỬA KÍNH có chuông (x 1,85..2,95) | ô kính phải.
 *    tầm giữa: quầy đỏ viền thép x -4,5..0,6 ở z -3,2, mặt cao 1,05; trên quầy: đĩa ăn của hai khách, tủ bánh kính dốc, gia vị, KÉT, đĩa bánh anh đào. Năm ghế đẩu ở z -2,62. Bàn góc đỏ ở x 3,85.
 *  Tham số do cảnh quay điều khiển: `tim` 0..1 (đèn tím trước mặt Purple Man), `cua` 0..1 (cửa mở ra phố), `chuong` -1..1 (chuông lắc), `ngan` 0..1 (ngăn kéo két), `co` 0..1 (cờ số 0), `phim` (phím đang nhấn, 7 là số 0), `banh` (đĩa còn miếng bánh). */
type V3 = [number, number, number];
export type QuanAnView = 'rong' | 'cua' | 'doi' | 'ket' | 'bon' | 'kinh' | 'can';
/** rong: cảnh 4; doi: cảnh 5; ket: cảnh 6; can: nền cận mặt Purple Man cảnh 7; bon: cảnh 8; kinh: cảnh 9; cua: cảnh 10 */
export const QA_VIEWS: Record<QuanAnView, V3> = {
  rong: [-0.4, 1.6, 4.2],
  cua: [0.6, 1.6, 0.8],
  doi: [0.5, 1.55, -0.2],
  ket: [0.45, 1.45, -0.7],
  bon: [-1.0, 1.6, 3.4],
  kinh: [2.0, 1.65, -3.4],
  can: [0.85, 1.6, -1.63],
};
/** mốc đứng (chân), trừ `ket`, `banh`: chân két và chân đĩa trên mặt quầy. Trục: ông chủ TRÁI, Purple Man PHẢI, cửa kính sau lưng gã */
export const QA_MARKS = {
  ket: [0.25, 1.05, -3.2] as V3,
  banh: [0.5, 1.052, -2.82] as V3,
  chuQuan: [0.1, 0, -3.95] as V3,
  purple: [0.95, 0, -2.75] as V3,
  purpleVao: [1.9, 0, -4.0] as V3,
  khach1: [-3.0, 0, -2.3] as V3,
  khach2: [-2.2, 0, -2.1] as V3,
  doomCua: [2.4, 0, -6.5] as V3,
  doomSau: [1.45, 0, -3.2] as V3,
};
const W = 9, D = 7, H = 3.2, GHE = [-3.8, -3.05, -2.3, -1.55, -0.8];
/** các ô sáng ở mặt kính (x0, x1, y0, y1): cửa trên tấm chân, ô phía trên cửa, hai ô kính có nẹp giữa */
const O_NANG: [number, number, number, number][] = [[1.92, 2.88, 0.34, 2.22], [1.88, 2.92, 2.4, 2.72], [0.88, 1.33, 0.62, 2.54], [1.37, 1.82, 0.62, 2.54], [2.98, 3.6, 0.62, 2.54], [3.64, 4.27, 0.62, 2.54]];
const tuongSau = () => tex('qa-tuong-sau', 2700, 960, paintTuongQuan(W, H, 3));
const tuongBen = (k: number) => tex(`qa-tuong-ben-${k}`, 2100, 960, paintTuongQuan(D, H, 7 + k));
const san = () => tex('qa-san', 2160, 1680, paintSanCaRo);
const tran = () => tex('qa-tran', 1800, 1400, paintTranThiec);

const VoQuan: React.FC = () => (
  <group>
    <SetGlow amount={0.1} tint="#fff8ea"><group position={[-4.5, 0, -6]}><HoledWall w={W} h={H} t={0.24} map={tuongSau()} slab="#c9c0aa" notch={[6.35, 7.45, 2.3]} holes={[{kind: 'rect', x0: 1.3, x1: 2.9, y0: 1.3, y1: 2.2}, {kind: 'rect', x0: 5.35, x1: 6.35, y0: 0.62, y1: 2.56}, {kind: 'rect', x0: 7.45, x1: 8.8, y0: 0.62, y1: 2.56}, {kind: 'rect', x0: 6.35, x1: 7.45, y0: 2.4, y1: 2.72}]} /></group></SetGlow>
    <SetGlow amount={0.1} tint="#fff8ea"><group position={[-4.5, 0, 1]} rotation={[0, Math.PI / 2, 0]}><HoledWall w={D} h={H} t={0.3} map={tuongBen(0)} slab="#c9c0aa" /></group></SetGlow>
    <SetGlow amount={0.1} tint="#fff8ea"><group position={[4.5, 0, -6]} rotation={[0, -Math.PI / 2, 0]}><HoledWall w={D} h={H} t={0.3} map={tuongBen(1)} slab="#c9c0aa" /></group></SetGlow>
    <SetGlow amount={0.08} tint="#fffaf0"><mesh position={[0, 0, -2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[W, D]} /><meshLambertMaterial map={san()} /></mesh></SetGlow>
    <SetGlow amount={0.16} tint="#ffffff"><mesh position={[0, H, -2.5]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[W, D]} /><meshLambertMaterial map={tran()} /></mesh></SetGlow>
    <B p={[0, H + 0.14, -2.5]} s={[9.7, 0.26, 7.7]} c="#b9b19c" cast={false} recv={false} />
    <B p={[0, H - 0.05, -5.94]} s={[W, 0.1, 0.12]} c="#f4eddc" cast={false} /><B p={[0, H - 0.11, -5.9]} s={[W, 0.018, 0.05]} c="#b9ae94" cast={false} />
    {/* ô kính phía trên cửa */}
    <group>{[1.85, 2.95].map((x) => <B key={x} p={[x, 2.56, -6.11]} s={[0.06, 0.34, 0.14]} c="#78858c" />)}<B p={[2.4, 2.73, -6.11]} s={[1.17, 0.05, 0.14]} c="#78858c" /><mesh position={[2.4, 2.56, -6.12]} renderOrder={6}><planeGeometry args={[1.1, 0.32]} /><meshBasicMaterial color="#d9f2f4" transparent opacity={0.12} depthWrite={false} /></mesh></group>
    {/* thảm chùi chân */}
    <B p={[2.4, 0.008, -5.5]} s={[1.3, 0.016, 0.8]} c="#4b4f53" cast={false} />{Array.from({length: 14}, (_, i) => <B key={i} p={[1.82 + i * 0.09, 0.018, -5.5]} s={[0.022, 0.003, 0.72]} c="#6f7478" cast={false} />)}
  </group>
);

export const QuanAn: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; tim?: number; cua?: number; chuong?: number; ngan?: number; co?: number; phim?: number; banh?: boolean; bui?: boolean; truoc?: boolean}> =
  ({children, f = 0, dx, dz, eye = QA_VIEWS.rong, tim = 0, cua = 0, chuong = 0, ngan = 0, co = 0, phim = -1, banh = true, bui = true, truoc}) => { datNoiBui('trong-nha');
    const coTruoc = truoc ?? eye[2] > 3.8;
    return (
      <GradeCtx.Provider value="brightInterior">
        <StageCam eye={eye} haze="#d8ecf2" fog={[90, 900]} dx={dx} dz={dz} />
        <hemisphereLight args={['#ffffff', '#cfc4ae', 1.05]} />
        <Sun from={[-2.6, 7.4, 1.6]} to={[-0.5, 0, -3.4]} intensity={0.95} color="#fff6e6" />
        <pointLight position={[0.62, 1.52, -2.42]} color="#ffdca0" intensity={0.7} distance={1.3} decay={1} />
        {[[-2.5, -3.6], [1.5, -3.6], [-1.2, -0.6]].map(([x, z]) => <pointLight key={x} position={[x, 2.75, z]} color="#f4fbff" intensity={3.2} distance={6.5} decay={1} />)}
        {tim > 0 ? <pointLight position={[0.7, 1.72, -1.7]} color="#b878ff" intensity={7 * tim} distance={5} decay={1.15} /> : null}
        <PhoNgoaiKinh />
        <VoQuan />
        <BepSau />
        {/* trần: hai đèn ống, quạt */}
        {[-2.9, 1.5].map((x) => <DenOng key={x} pos={[x, H - 0.05, -3.6]} w={1.5} d={0.26} />)}
        <DenOng pos={[-1.2, H - 0.05, -0.6]} w={1.5} d={0.26} />
        <CeilingFan pos={[-1.75, H, -3.8]} turn={f * 0.16} />
        {/* tường sau */}
        <KeChuyenMon x0={-3.2} x1={-1.6} y0={1.3} y1={2.2} />
        <SoiHoi pos={[-2.85, 1.4, -6.5]} f={f} h={0.8} w={0.09} seed={1} day={0.022} op={0.5} /><SoiHoi pos={[-2.45, 1.42, -6.4]} f={f + 11} h={0.72} w={0.08} seed={4} day={0.02} op={0.45} /><SoiHoi pos={[-2.1, 1.4, -6.55]} f={f + 23} h={0.66} w={0.07} seed={6} day={0.018} op={0.4} />
        <KeCoc pos={[-3.85, 1.62, -5.99]} w={1.05} seed={3} /><KeCoc pos={[-3.85, 2.14, -5.99]} w={1.05} seed={8} />
        <BangThucDon pos={[-1.02, 2.14, -5.985]} />
        <DongHoQuan pos={[0.17, 2.72, -5.99]} f={f} />
        <DoTreoTuong /><BienThiec />
        <OKinh x0={0.85} x1={1.85} y0={0.62} y1={2.56} k="trai" /><OKinh x0={2.95} x1={4.3} y0={0.62} y1={2.56} k="phai" />
        <BangHomNay pos={[1.33, 1.82, -5.86]} />
        <CuaKinhQuan mo={cua} chuong={chuong} />
        <VetNang o={O_NANG} h={0.024} vung={[-4.5, 4.5, -6, 1]} />
        <TuSauQuay x0={-4.46} x1={-0.75} f={f} />
        {/* quầy, ghế đẩu, đồ trên quầy */}
        <QuayQuan x0={-4.5} x1={0.6} z={-3.2} />
        {GHE.map((x, i) => <GheDau key={x} pos={[x, 0, -2.62]} turn={i * 0.7} />)}
        <CumGiaVi p={[-4.05, 1.052, -3.12]} />
        <DiaBanhKep pos={[-3.05, 1.052, -3.0]} /><LyNuocNgot pos={[-2.74, 1.052, -3.1]} />
        <CocCaPhe pos={[-2.2, 1.052, -2.98]} f={f + 5} /><group position={[-2.42, 1.052, -3.06]}><LoDuong p={[0, 0, 0]} /></group>
        <CumGiaVi p={[-1.92, 1.052, -3.26]} />
        <TuBanhKinh pos={[-1.2, 1.052, -3.24]} />
        <LoDuong p={[-0.52, 1.052, -3.06]} />
        <CocCaPhe pos={[-0.27, 1.052, -3.0]} f={f} w={0.15} />
        <VetNang o={O_NANG} h={1.0565} vung={[-4.54, 0.64, -3.52, -2.78]} op={0.3} order={2} />
        <KetTien pos={QA_MARKS.ket} ngan={ngan} co={co} phim={phim} />
        <DiaBanhAnhDao pos={QA_MARKS.banh} mieng={banh} />
        {/* góc phải */}
        <BanGoc pos={[3.85, 0, -4.62]} />
        {coTruoc ? <GiaBaoTruoc pos={[1.15, 0, 0.82]} /> : null}
        {/* vài hạt bụi be trong vệt nắng từ cửa kính */}
        {bui ? <Motes f={f} box={[0.2, 3.2, 0.6, 2.4, -5.6, -2.2]} n={22} color="#cdbb98" size={0.008} drift={0.16} glow={0.12} seed={6} /> : null}
        {children}
      </GradeCtx.Provider>
    );
  };

// ---------------------------------------------------------------- ảnh tĩnh không người: từng góc máy, và tấm soi đồ ăn
type Props = React.ComponentProps<typeof QuanAn>;
const mk = (p: Props): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><QuanAn {...p} /></ThreeCanvas></Finish></AbsoluteFill>;
};
/** tấm soi các món cầm tay và đồ ăn ở cỡ lớn */
const DoAn: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat gl={{antialias: true}}>
      <GradeCtx.Provider value="brightInterior">
        <StageCam eye={[0, 0.3, 2.35]} haze="#e9dcc2" fog={[50, 90]} />
        <hemisphereLight args={['#ffffff', '#e4d8c2', 2.6]} />
        <DiaBanhAnhDao pos={[-0.62, 0.24, 0]} w={0.62} /><DiaBanhAnhDao pos={[0.02, 0.32, 0]} w={0.42} mieng={false} />
        <MiengBanhAnhDao pos={[0.48, 0.42, 0]} w={0.3} /><ManhVoBanh pos={[0.72, 0.5, 0]} w={0.08} rot={0.4} />
        <CocCaPhe pos={[-0.76, -0.17, 0]} f={18} w={0.26} /><OBanhMi pos={[-0.3, -0.03, 0]} w={0.44} f={14} /><OBanhMi pos={[0.2, -0.03, 0]} w={0.36} can f={20} />
        <XapTien pos={[0.62, 0.15, 0]} w={0.34} /><ToTien pos={[0.67, -0.06, 0]} w={0.28} rot={-0.25} /><ViDa pos={[0.48, -0.2, 0]} w={0.24} rot={0.08} /><LyNuocNgot pos={[-0.98, 0.02, 0]} h={0.28} /><DiaBanhKep pos={[-0.08, -0.3, 0]} w={0.46} />
      </GradeCtx.Provider>
    </ThreeCanvas></Finish></AbsoluteFill>
  );
};
const S = {
  rong: mk({eye: QA_VIEWS.rong, f: 10}),
  doi: mk({eye: QA_VIEWS.doi, f: 10}),
  ket: mk({eye: QA_VIEWS.ket, f: 10, co: 1, phim: 7}),
  can: mk({eye: QA_VIEWS.can, f: 10, tim: 0.7}),
  bon: mk({eye: QA_VIEWS.bon, f: 10, ngan: 1, tim: 0.5, banh: false}),
  kinh: mk({eye: QA_VIEWS.kinh, f: 10, tim: 0.3, banh: false}),
  cua: mk({eye: QA_VIEWS.cua, f: 10, cua: 0.45, chuong: 0.7, ngan: 1, banh: false}),
};
export const QuanAnComps: React.FC = () => (
  <>
    <Composition id="quan-an-rong" component={S.rong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="quan-an-doi" component={S.doi} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="quan-an-ket" component={S.ket} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="quan-an-can" component={S.can} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="quan-an-bon" component={S.bon} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="quan-an-kinh" component={S.kinh} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="quan-an-cua" component={S.cua} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="quan-an-do-an" component={DoAn} width={1280} height={720} fps={24} durationInFrames={1} />
  </>
);
