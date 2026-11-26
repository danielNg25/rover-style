import React from 'react';
import {Composition, useCurrentFrame} from 'remotion';
import {GradeCtx} from '../lib3/look';
import {StageCam} from '../lib3/kit';
import {Spot, DriftSpecks} from '../lib3/kitLab';
import {Sun} from '../lib3/room';
import {Shot} from '../lib3/shot';
import {LightShaft} from '../lib3/kitSanhNgai';
import {Lab} from './Lab';
import {BX, BxShell, CuaRa, CuaSo, Rem, Guong, ChauRua, GiaKhan, GiuongBenh, BanDauGiuong, BinhNuoc, Coc, LaThu, ToTinh, DongHo, TuThuoc, BuiNang,
  GiaKep, AnhCynthia, GheBan, LAB_THEM, VongDo} from '../lib3/kitBenhXa';

/** BỆNH XÁ trường đại học đầu thế kỉ 20 (chương 7 cảnh 15-16, chương 8; phần chung, KHÔNG có người: người vào qua `children`, hình trong gương qua `guong`).
 *  Phòng x 0..8 (trái sang phải), z 0..5,5 (tường ra phía máy), cao 3,6; mọi thứ xếp dọc tường sau z = 0, phòng không xoay, máy chỉ dời theo trục x
 *  (dx, dz và XoayCtx dùng được như `Campus`, `Lab`: StageCam đọc cả ba). Từ trái sang phải:
 *    x 0,4-1,2    cửa gỗ có ô kính mờ, hành lang sáng ấm phía sau (`cua`: góc cánh cửa, mở RA hành lang); biển "BỆNH XÁ" trên cửa
 *    x 1,5-2,0    gương khung gỗ (cao 1,25-1,85) trong hốc tường, có HỘP PHẢN CHIẾU sâu 1,8 m phía sau (hình trong gương đặt ở guongDiem(p));
 *                 dưới gương chậu rửa (x 1,75), cạnh bên giá khăn (x 2,3); `khan` kéo khăn trắng phủ xuống gương
 *    x 2,6        tờ tính toán ghim tường (cao 1,3-1,7); `vong` vẽ vòng đỏ ở dòng 3 và dòng 5 ("9 210")
 *    x 2,85-3,3   bàn đầu giường: bình nước (mặt nước gợn), cốc, lá thư ĐUỔI HỌC (`thu`); `chamAt` = khung lá thư chạm bình: nước gợn, cốc rung
 *    x 3,4-5,4    giường sắt, rèm kéo nửa (`rem`), đồng hồ treo trên rèm
 *    x 5,8-7,2    cửa sổ, ngoài kia mái ngói, tường gạch và cành phong (`state`: 'sang' trời lạnh, 'chieu' đỏ cam thấp)
 *    x 7,25-7,85  tủ thuốc trắng
 *  Ánh sáng: 'sang' = nắng lạnh qua cửa sổ (vệt cửa sổ trên sàn, tia nắng có bụi), hành lang ấm; 'chieu' = đỏ cam thấp, chỉ cảnh 11 chương 8.
 *  Băng trắng không đặt trước cửa sổ hay rèm sáng: rèm xám vừa, tường lưng giường xanh nhạt. */
type V3 = [number, number, number];
export type BenhXaState = 'sang' | 'chieu';
export type BxViewSpec = {eye: V3; note: string};
/** Góc máy (vị trí mắt; máy nhìn thẳng −z). Cảnh nào dùng góc nào: giuong (ch8 c1, ch7 c15 xa, ch7 c16 nền), can (ch7 c15, ch8 c11 cận: có thể dùng frameOn thay),
 *  ban (ch7 c16), guong (ch8 c4), toan (ch8 c5), toanGan (như toan nhưng Victor ~50 % khung), to (ch8 c6, c9). */
export const BX_VIEWS = {
  giuong: {eye: [4.5, 1.2, 4.0], note: 'trung cảnh Victor ngồi mép giường; bàn đầu giường ở mép trái, cửa sổ ở mép phải'},
  can: {eye: [4.8, 1.3, 2.7], note: 'cận đầu Victor ngồi (lệch trái ~0,4); nền rèm xám có vệt nắng'},
  ban: {eye: [3.6, 1.05, 2.5], note: 'bàn đầu giường: bình, cốc, lá thư; giường và Victor mờ ở nền phải'},
  guong: {eye: [1.75, 1.55, 1.4], note: 'thẳng mặt gương (hình trong gương đặt bằng guongDiem)'},
  toan: {eye: [3.4, 1.5, 7.0], note: 'toàn cảnh một bức tường từ cửa tới cửa sổ'},
  toanGan: {eye: [2.3, 1.35, 4.2], note: 'toàn cảnh gần: cửa, gương, tờ tính, bàn; người ở gương/cửa cao ~50 % khung'},
  to: {eye: [2.5, 1.2, 2.45], note: 'trước tờ tính toán (x 2,6): người ở victorTo (x 2,05) nằm bên trái, tờ ở giữa khung'},
} satisfies Record<string, BxViewSpec>;
export type BxView = keyof typeof BX_VIEWS;
/** Mốc đặt người (đơn vị phòng). */
export const BX_MARKS = {
  victorGiuong: [4.2, 0, 1.0] as V3,   // ngồi mép giường
  victorGuong: [1.9, 0, 0.7] as V3,    // đứng trước gương
  victorTo: [2.05, 0, 0.55] as V3,     // đứng trước tờ tính toán, lệch trái tờ giấy (x 2,6) 0,55 m để không che
  aCua: [0.85, 0, 0.45] as V3,         // sinh viên A ở ngưỡng cửa (cánh cửa mở ra hành lang nên không chạm người ở mốc)
};
/** Những chỗ cần canh khung: mặt gương, mặt bàn đầu giường, tờ tính, cửa sổ. */
export const BX_SPOTS = {
  guong: [1.75, 1.55, 0] as V3, banMat: [3.075, BX.table.h, 0.31] as V3, to: [BX.sheet.x, BX.sheet.y, 0.012] as V3, cuaSo: [6.5, 1.85, 0] as V3,
  /** bàn đầu giường: chỗ bình (x), cốc (x), lá thư (x) so với tâm mặt bàn */
  binh: 0.07, coc: 0.18, thu: -0.1,
};

export type BenhXaProps = {children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: BenhXaState; cua?: 'dong' | 'mo' | number;
  rem?: number; khan?: number; khanLay?: number; guong?: React.ReactNode; thu?: boolean | {lean?: number; back?: number; dx?: number}; chamAt?: number;
  vong?: {dong3?: number; dong5?: number}; toTinh?: boolean; khanGia?: boolean; extra?: React.ReactNode; /** đồ vẽ thêm trên tờ tính (hệ toạ độ của tờ giấy, gốc ở giữa tờ): tích xanh, vòng… */ toTinhExtra?: React.ReactNode};

export const BenhXa: React.FC<BenhXaProps> = ({children, f = 0, dx, dz, eye = BX_VIEWS.toan.eye, state = 'sang', cua = 'dong', rem = 0.55, khan = 0, khanLay = 0, guong, thu = false, chamAt, vong, toTinh = true, khanGia, extra, toTinhExtra}) => {
  const dusk = state === 'chieu', ang = typeof cua === 'number' ? cua : cua === 'mo' ? 1.2 : 0;
  const rung = chamAt === undefined || f < chamAt ? 0 : Math.exp(-(f - chamAt) / 9) * Math.cos((f - chamAt) * 0.9) ** 2 + 0.0, thuO = typeof thu === 'object' ? thu : {};
  const SUN_FROM: V3 = dusk ? [8.5, 3.4, -8] : [7.4, 6.4, -6.4], SUN_TO: V3 = dusk ? [4.2, 0, 2.6] : [5.4, 0, 2.2];
  return (
    <GradeCtx.Provider value="brightInterior">
      <StageCam eye={eye} haze={dusk ? '#c9a898' : '#cfd5d6'} fog={[40, 900]} dx={dx} dz={dz} />
      {dusk ? <>
        <hemisphereLight args={['#ffe2c8', '#b08a76', 2.3]} />
        <Sun from={SUN_FROM} to={SUN_TO} intensity={7.5} color="#ff9b5c" />
        <pointLight position={[7.4, 1.8, 1.4]} color="#ff7a3c" intensity={4.2} distance={9} decay={1.3} />
        <pointLight position={[3.6, 2.5, 4.6]} color="#ffd8b4" intensity={1.4} distance={13} decay={1.2} />
        <LightShaft top={[6.5, 2.0, -0.05]} bottom={[4.6, 0.02, 2.0]} r={0.7} color="#ffb070" strength={0.07} f={f} />
      </> : <>
        <hemisphereLight args={['#f2f4f4', '#b4a590', 2.4]} />
        <Sun from={SUN_FROM} to={SUN_TO} intensity={6.5} color="#fff0d0" />
        <pointLight position={[3.6, 2.6, 4.8]} color="#fff4e4" intensity={1.5} distance={14} decay={1.2} />
        <pointLight position={[6.4, 2.3, 1.2]} color="#e6f0ff" intensity={0.9} distance={7} decay={1.4} />
        <LightShaft top={[6.5, 2.0, -0.05]} bottom={[5.9, 0.02, 2.55]} r={0.6} color="#fff2cc" strength={0.06} f={f} />
      </>}
      <DriftSpecks f={f} box={[4.6, 7.0, 0.3, 2.7, 0.3, 3.4]} n={dusk ? 26 : 22} color={dusk ? '#ffd0a0' : '#fff6d8'} size={0.0055} wind={[-0.05, 0.02]} glow={0.3} seed={7} />
      <DriftSpecks f={f + 40} box={[0.4, 4.6, 0.3, 2.9, 0.3, 4.4]} n={12} color={dusk ? '#ffe0c0' : '#fffbe8'} size={0.004} wind={[0.03, -0.015]} glow={0.14} seed={19} />
      <BuiNang f={f} state={state} />
      <BxShell>
        <CuaRa open={ang} /><CuaSo state={state} />
        <Guong khan={khan} lay={khanLay} f={f}>{guong}</Guong>
        <ChauRua /><GiaKhan khan={khanGia ?? khan < 0.05} />
        {toTinh ? <ToTinh vong={vong}>{toTinhExtra}</ToTinh> : null}
        <GiuongBenh /><Rem rem={rem} state={state} />
        <DongHo pos={[4.45, 2.62, 0.04]} />
        <BanDauGiuong>
          <group position={[BX_SPOTS.binh, 0, 0.02]}><BinhNuoc f={f} rung={rung} s={1.2} /></group>
          <group position={[BX_SPOTS.coc, 0, 0.06]}><Coc f={f} rung={rung} s={1.2} /></group>
          {thu ? <group position={[BX_SPOTS.thu + (thuO.dx ?? 0), 0, 0.09]}><LaThu lean={thuO.lean ?? 0.2} back={thuO.back ?? 0.2} s={1.3} /></group> : null}
        </BanDauGiuong>
        <TuThuoc />
        {extra}
      </BxShell>
      {children}
    </GradeCtx.Provider>
  );
};
void Spot; void VongDo;

// ---------------------------------------------------------------- composition ảnh tĩnh (không người), đăng ký ở Root.tsx
type StillOpt = Partial<BenhXaProps> & {soft?: number};
const mk = (view: BxView, o: StillOpt = {}): React.FC => () => {
  const f = useCurrentFrame(), {soft, ...p} = o, eye = BX_VIEWS[view].eye;
  return <Shot grade="brightInterior" eye={eye} soft={soft} finish={{warm: ''}} set={(inside, cam) => <BenhXa eye={eye} dx={cam.dx} dz={cam.dz} f={f} {...p}>{inside}</BenhXa>} figures={null} />;
};
const DO_LAB: React.FC = () => {
  const f = useCurrentFrame();
  return <Shot grade="darkInterior" finish={{warm: ''}} set={(inside) => <Lab view={{yaw: 0.22, cam: [3.9, 6.4], eye: 1.3}} gio="chang-vang" f={f} extra={<>
    <group position={[LAB_THEM.giaKep[0], LAB_THEM.giaKep[1], LAB_THEM.giaKep[2]]}><GiaKep vong={{dong3: 1, dong5: 1}} s={1.2} /></group>
    <group position={LAB_THEM.anh}><AnhCynthia s={1.1} /></group>
    <group position={LAB_THEM.gheBan}><GheBan /></group>
  </>}>{inside}</Lab>} figures={null} />;
};
const STILLS: [string, React.FC][] = [
  ['benh-xa-sang-giuong', mk('giuong')], ['benh-xa-sang-can', mk('can', {soft: 1.2})], ['benh-xa-sang-ban', mk('ban')], ['benh-xa-sang-ban-thu', mk('ban', {thu: true, chamAt: 20})],
  ['benh-xa-sang-guong', mk('guong')], ['benh-xa-sang-guong-khan', mk('guong', {khan: 1, khanLay: 1})], ['benh-xa-sang-toan', mk('toan')], ['benh-xa-sang-toan-gan', mk('toanGan')],
  ['benh-xa-sang-toan-cua', mk('toan', {cua: 1.1, khan: 1, khanLay: 0.2, thu: true})], ['benh-xa-sang-to', mk('to')], ['benh-xa-sang-to-vong', mk('to', {vong: {dong3: 1, dong5: 1}})],
  ['benh-xa-chieu-giuong', mk('giuong', {state: 'chieu'})], ['benh-xa-chieu-can', mk('can', {state: 'chieu', soft: 1.2})], ['benh-xa-chieu-toan', mk('toan', {state: 'chieu'})],
  ['benh-xa-chieu-ban-thu', mk('ban', {state: 'chieu', thu: true})],
  ['benh-xa-lab-do-moi', DO_LAB],
];
export const BenhXaComps: React.FC = () => <>{STILLS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={48} />)}</>;
