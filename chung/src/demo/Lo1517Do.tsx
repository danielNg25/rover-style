import React from 'react';
import {AbsoluteFill, Composition, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Finish} from '../lib3/look';
import {B, StageCam} from '../lib3/kit';
import {Plate, Ctx} from '../lib3/depth';
import {Explosion} from '../lib3/fx';
import {RoundScreen} from '../lib3/kitHamMay';
import {DaVuTru, HanhTinhChapVa, ChanTroiChapVa, HangCoMatNa, SongThaoTung, SongSan, KinhVo, ManXanh, CotSangXanh, HinhManTron, ConDau, DauMuc, XapGiay, Thoc, SungChum, CoTron, ChuSat, SoNung, BuongKinh, AngTen, NumVan, ManHinhPhu} from '../lib3/kitLo1517';

/** Bảng thử của lô cuối chương 15-17 (24/11/2026): đồ nhỏ và hiệu ứng của `kitLo1517`, mỗi tấm một nhóm, không có người.
 *    lo1517-hieu-ung   sóng thao túng tím và xanh, vòng nứt năm mảnh, vòng quét sàn, kính vỡ, cột sáng xanh (48 khung)
 *    lo1517-do-nho     bàn gỗ: con dấu, dấu mực, hai chồng giấy, thóc chảy và trải, súng dựng chụm với mũ sắt, bốn cờ trơn (36 khung)
 *    lo1517-man-xanh   trời chiều có màn xanh ba dải, tan dần (48 khung)
 *    lo1517-chu-sat    chữ sắt "secret" "wars" và số 2 nung ba mức (48 khung)
 *    lo1517-man-tron   màn tròn có bóng khổng lồ và vòng ngắm (36 khung) */
type V3 = [number, number, number];
const Stage: React.FC<{children: React.ReactNode; eye?: V3; haze?: string; hemi?: [string, string, number]}> = ({children, eye = [0, 1.4, 6], haze = '#2a3440', hemi = ['#e8eef4', '#7a8490', 2.6]}) => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
    <StageCam eye={eye} haze={haze} fog={[60, 400]} /><hemisphereLight args={hemi} /><directionalLight position={[-3, 6, 5]} intensity={3} />{children}
  </ThreeCanvas></Finish></AbsoluteFill>;
};
const HieuUng: React.FC = () => { const f = useCurrentFrame();
  return <Stage eye={[0, 1.5, 7]}>
    <mesh position={[0, 0, -3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 20]} /><meshLambertMaterial color="#4a545c" /></mesh>
    <mesh position={[0, 3, -6]}><planeGeometry args={[30, 10]} /><meshLambertMaterial color="#39434d" /></mesh>
    {[0, 8, 16, 24].map((a, i) => <SongThaoTung key={a} pos={[-2.6, 2.6, 0]} f={f} at={a} life={20} size={0.7} mau="tim" seed={i + 1} />)}
    {[2, 10, 18, 26].map((a, i) => <SongThaoTung key={a} pos={[-0.4, 2.6, 0]} f={f} at={a} life={20} size={0.7} mau="xanh" seed={i + 5} />)}
    <SongThaoTung pos={[2.2, 2.6, 0]} f={f} at={0} life={40} size={0.9} mau="tim" vo={Math.max(0, (f - 6) / 30)} seed={3} />
    <SongSan pos={[0, 0, -1]} f={f} at={4} life={30} reach={7} /><SongSan pos={[0, 0, -1]} f={f} at={22} life={30} reach={7} />
    <KinhVo pos={[-2.6, 1.6, 1.0]} f={f} at={6} n={26} san={-0.0} />
    <CotSangXanh pos={[2.7, -0.2, -2]} cao={6} r={0.55} k={0.9} f={f} />
    <Explosion pos={[0.4, 1.2, 0.5]} f={f} at={30} s={1.1} cool="#3dff8e" hot="#b878ff" />
  </Stage>; };
const woodTop = (c: Ctx, W: number, H: number) => { c.fillStyle = '#8a5a34'; c.fillRect(0, 0, W, H); for (let i = 0; i < 26; i++) { c.fillStyle = i % 2 ? 'rgba(60,30,10,0.18)' : 'rgba(255,220,170,0.08)'; c.fillRect(0, (i / 26) * H, W, H / 26 * 0.6); } };
void woodTop;
const DoNho: React.FC = () => { const f = useCurrentFrame(), q = (f % 36) / 36;
  return <Stage eye={[0.1, 0.62, 3.0]} haze="#6a7a70" hemi={['#fff0dc', '#8a7a68', 2.4]}>
    <B p={[0, -0.05, -1.4]} s={[9, 0.1, 3.6]} c="#8a5a34" />
    <B p={[0, 1.2, -3.2]} s={[10, 4.4, 0.2]} c="#6d8a78" />
    <XapGiay pos={[-1.5, 0.0, -0.8]} n={9} seed={1} /><XapGiay pos={[-1.0, 0.0, -1.0]} n={5} seed={2} rotY={0.2} day={false} />
    <ConDau pos={[-0.45, 0.0, -0.6]} nang={Math.abs(Math.sin(f * 0.18)) * 0.5} /><DauMuc pos={[0.1, 0.0, -0.6]} w={0.45} k={1} />
    <Thoc pos={[0.62, 0.95, -0.7]} f={f} tuon={1} trai={q} roi={0.95} />
    <SungChum pos={[1.35, 0, -1.0]} mu={4} />
  </Stage>; };
const CoThu: React.FC = () => { const f = useCurrentFrame();
  return <Stage eye={[0, 1.2, 6]} haze="#6a7a70" hemi={['#fff0dc', '#8a7a68', 2.4]}>
    <B p={[0, -0.05, -2.4]} s={[12, 0.1, 5]} c="#6a6e66" /><B p={[0, 1.4, -4.8]} s={[12, 4.8, 0.2]} c="#6d8a78" />
    {['#6a7a96', '#a0443c', '#c9a04a', '#7d8a84'].map((c, i) => <CoTron key={c} pos={[-2.4 + i * 1.6, 0, -2.0]} mau={c} nga={i / 3} f={f + i * 7} huong={i < 2 ? -1 : 1} seed={i + 1} />)}
  </Stage>; };
const ManXanhThu: React.FC = () => { const f = useCurrentFrame(), eye: V3 = [0, 1.6, 7];
  return <Stage eye={eye} haze="#c8a888">
    <Plate from={eye} id="lo1517-troi-chieu" d={520} fog={false} paint={(c: Ctx) => { const g = c.createLinearGradient(0, -200, 0, 560); g.addColorStop(0, '#3a4a7a'); g.addColorStop(0.5, '#a9709a'); g.addColorStop(1, '#f0b078'); c.fillStyle = g; c.fillRect(-400, -300, 2400, 1500); }} />
    <ManXanh eye={eye} f={f} k={1} tan={Math.max(0, (f - 20) / 28)} />
    <Plate from={eye} id="lo1517-nui-toi" d={140} fog={false} paint={(c: Ctx) => { c.fillStyle = '#4a3a56'; c.beginPath(); c.moveTo(-200, 700); c.lineTo(100, 470); c.lineTo(420, 620); c.lineTo(760, 430); c.lineTo(1180, 640); c.lineTo(1500, 500); c.lineTo(1800, 700); c.lineTo(1800, 900); c.lineTo(-200, 900); c.fill(); }} />
  </Stage>; };
const ChuSatThu: React.FC = () => { const f = useCurrentFrame(), nung = Math.max(0, 1 - Math.max(0, f - 6) / 40);
  return <Stage eye={[0, 0, 6]} haze="#12142a" hemi={['#c8d0e0', '#404858', 2.2]}>
    <mesh position={[0, 0, -4]}><planeGeometry args={[30, 16]} /><meshBasicMaterial color="#1c2040" /></mesh>
    <ChuSat pos={[-2.2, 0.9, 0]} chu="secret" w={4.6} /><ChuSat pos={[-2.2, -0.7, 0]} chu="wars" w={3.2} />
    <SoNung pos={[2.4, -0.2, 0]} nung={nung} w={2.2} f={f} /><SoNung pos={[4.0, 1.7, 0]} nung={0.5} w={0.7} f={f} /><SoNung pos={[4.0, 0.6, 0]} nung={0} w={0.7} f={f} />
  </Stage>; };
const ManTronThu: React.FC = () => { const f = useCurrentFrame(), p = Math.min(1, f / 30);
  return <Stage eye={[0, 0, 5]} haze="#2a3a34">
    <mesh position={[0, 0, -3]}><planeGeometry args={[20, 12]} /><meshLambertMaterial color="#59646c" /></mesh>
    <RoundScreen pos={[-1.8, 0, 0]} d={2.4} f={f} on={1} /><HinhManTron pos={[-1.8, 0, 0]} d={2.4} kieu="khong-lo" p={p} f={f} />
    <RoundScreen pos={[1.8, 0, 0]} d={2.4} f={f} on={1} /><HinhManTron pos={[1.8, 0, 0]} d={2.4} kieu="ngam" p={p} f={f} />
  </Stage>; };
const MayThu: React.FC = () => { const f = useCurrentFrame();
  return <Stage eye={[0, 1.8, 7]} haze="#2a3440">
    <mesh position={[0, 0, -3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 20]} /><meshLambertMaterial color="#4a545c" /></mesh>
    <BuongKinh pos={[-3, 0, 0]} f={f} cua={Math.min(1, f / 20)} khoa={Math.max(0, (f - 20) / 8)} sang={0.6} mau="tim" wave={f > 30 ? 1 : 0} />
    <AngTen pos={[-3, 3.2, 0]} f={f} ang={f / 12} mau="tim" chay={1} tia={1} />
    <NumVan pos={[1.2, 0.5, 1]} kim={f / 47} /><ManHinhPhu pos={[3.2, 1.2, 0]} f={f} khung={1} />
  </Stage>; };
const VuTruThu: React.FC = () => { const f = useCurrentFrame();
  return <Stage eye={[0, 0, 10]} haze="#1a1c40" hemi={['#c8d0e0', '#404858', 2]}>
    <mesh position={[0, 0, -9]}><planeGeometry args={[40, 22]} /><meshBasicMaterial color="#25285a" /></mesh>
    <DaVuTru f={f} />
  </Stage>; };
const HanhTinhThu: React.FC = () => { const f = useCurrentFrame();
  return <Stage eye={[0, 0, 10]} haze="#1a1c40" hemi={['#c8d0e0', '#404858', 2]}>
    <mesh position={[0, 0, -9]}><planeGeometry args={[40, 22]} /><meshBasicMaterial color="#25285a" /></mesh>
    <HanhTinhChapVa pos={[-2.6, 0, 0]} r={1.1} ghep={0.4} khe={0.5} f={f} /><HanhTinhChapVa pos={[0.2, 0, 0]} r={1.1} ghep={1} khe={1} f={f} /><HanhTinhChapVa pos={[3.0, 0.3, 0]} r={0.8} ghep={0.7} khe={0} f={f} />
  </Stage>; };
const ChanTroiThu: React.FC = () => { const f = useCurrentFrame(), eye: V3 = [0, 1.6, 8];
  return <Stage eye={eye} haze="#f0d898">
    <Plate from={eye} id="lo1517-troi-vang" d={520} fog={false} paint={(c: Ctx) => { const g = c.createLinearGradient(0, -200, 0, 560); g.addColorStop(0, '#f6d98a'); g.addColorStop(1, '#fff0c0'); c.fillStyle = g; c.fillRect(-400, -300, 2400, 1500); }} />
    <ChanTroiChapVa eye={eye} f={f} /><mesh position={[0, 0, -20]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[200, 120]} /><meshLambertMaterial color="#d9b45a" /></mesh>
    <HangCoMatNa from={[-6, 0, -34]} to={[4.5, 0, -2]} n={8} bung={f} cach={3} f={f} />
  </Stage>; };
export const Lo1517DoComps: React.FC = () => <>
  <Composition id="lo1517-hieu-ung" component={HieuUng} width={1280} height={720} fps={24} durationInFrames={48} />
  <Composition id="lo1517-do-nho" component={DoNho} width={1280} height={720} fps={24} durationInFrames={36} />
  <Composition id="lo1517-co-tron" component={CoThu} width={1280} height={720} fps={24} durationInFrames={36} />
  <Composition id="lo1517-vu-tru" component={VuTruThu} width={1280} height={720} fps={24} durationInFrames={72} />
  <Composition id="lo1517-hanh-tinh" component={HanhTinhThu} width={1280} height={720} fps={24} durationInFrames={24} />
  <Composition id="lo1517-chan-troi" component={ChanTroiThu} width={1280} height={720} fps={24} durationInFrames={48} />
  <Composition id="lo1517-man-xanh" component={ManXanhThu} width={1280} height={720} fps={24} durationInFrames={48} />
  <Composition id="lo1517-chu-sat" component={ChuSatThu} width={1280} height={720} fps={24} durationInFrames={48} />
  <Composition id="lo1517-man-tron" component={ManTronThu} width={1280} height={720} fps={24} durationInFrames={36} />
  <Composition id="lo1517-may" component={MayThu} width={1280} height={720} fps={24} durationInFrames={48} />
</>;
