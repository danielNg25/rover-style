import React, {useMemo} from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {AbsoluteFill, Composition, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {GradeCtx, GRADES, Grade, Finish} from '../lib3/look';
import {StageCam, FlyingLeaves, Motes} from '../lib3/kit';
import {Plate} from '../lib3/depth';
import {useSurface} from '../lib3/detail';
import {XoayCtx} from '../lib3/duongMay';
import {MatTroiMoc, BangRonToa} from '../lib3/kitLo1517';
import {SmokeDrift, Embers} from '../lib3/fx';
import {Headquarters, HQ, BacThem, BucVai, RaoDay, Xe60, NhaPho, DenPho, Hydrant, Mailbox, Meter, Bin, PhoneBooth, QuayBao, TrafficLight, Tree, Pennants, Balloons, Lua, Khoi, Rubble, Shards, Pigeon, Spray, crackTex, paintSkyNy, paintSkylineNy, Slab, FF_BLUE} from '../lib3/kitPhoNewYork';

/** PHỐ NEW YORK THẬP NIÊN 1960 TRƯỚC TRỤ SỞ FANTASTIC FOUR (chương 11 cảnh 5, 6, 7, 29; chương 12 cảnh 18-27). MỘT bối cảnh, không có sân thượng. KHÔNG có người: người vào qua `children`.
 *  Toạ độ (mét; x sang phải, y lên, ống kính nhìn dọc -z; máy chuẩn [0, 1.6, 7]):
 *    mặt tiền trụ sở ở z = -14 (giữa, rộng 12, cao 24, tháp lùi cao 38); sảnh nâng 0,6 m, BẬC THỀM từ z -14 tới -9,9 (sảnh phẳng z -14 tới -12);
 *    quảng trường lát đá từ z -14 tới +2,2 (lề đường), đường lớn chạy dọc x phía sau máy, đại lộ chạy về phía máy dọc z.
 *    hai bên trụ sở là hai dãy nhà gạch, đá (cửa hàng tầng trệt, thang thoát hiểm, ăng-ten TV, bể nước), xa hơn là tháp nhà cao, hai tấm nền chân trời.
 *    làn đỗ xe ở hai bên (x ±6,5 .. ±40, z -10,4 .. -6): xe hơi đỗ bên trái (x -8,6), xe tải nhỏ bên phải; cột đèn thép, vòi nước, hòm thư, đồng hồ đỗ xe, quầy báo, bốt điện thoại, đèn giao thông, cây.
 *  TRẠNG THÁI (`state`):
 *    ngay     bục vải xanh cao 0,6 (z -6,3 tới -3,7), rào dây có cột trụ (z -1,6 và hai bên bục), giấy hoa, bóng bay, cờ tam giác. MẶT BỤC = cao độ 0: cả thế giới hạ 0,6 m
 *             (quảng trường, đường, nhà), nên người đứng trên bục LẪN đám đông đều ở y = 0 (xem pnyMarks, đã cộng sẵn y). Chương 11 cảnh 5, 7, 29.
 *    khoi     cửa hàng bên phải cháy (cửa kính vỡ, lửa, khói đen dâng cao), xe lật ngửa, thùng rác đổ, mảnh kính, vòi nước phun, khói mỏng ngang tầm trụ sở, trời ám khói. Chương 11 cảnh 6.
 *    dung-do  như `ngay` bỏ bục, rào, giấy hoa, bóng bay, cờ tam giác: quảng trường trống, lá và giấy rác bay. Chương 12.
 *    nut      như `dung-do` cộng mặt đường nứt hình sao (tâm pnyMarks.nutTam), bê tông vụn, mảnh kính, hai làn khói mảnh. Chương 12 cảnh 20 tới 23.
 *    binh-minh (24/11/2026, chương 15 cảnh 17, 18, 20, 26) như `dung-do` (quảng trường trống, không bục, rào, giấy hoa, bóng bay, cờ tam giác; cờ số 4 và giấy rác tắt khi truyền `co` 0, `giay` false) nhưng TRỜI BÌNH MINH: trời xanh phớt, hồng, đào, vàng ở chân trời; nắng thấp ấm từ bên phải; mặt trời nhô khỏi mái nhà bên phải theo `mat` 0..1
 *             (0 dưới mái, 1 đã nhô cao), cửa sổ các dãy nhà sáng ấm dần theo `sang` 0..1 (nhà gần sáng trước), `bangRon` 0..1 buông băng rôn mặt nạ xuống mặt tiền toà gạch bên TRÁI trụ sở (x -7,6, z -14; cảnh 18 trở đi). Hạt: chỉ vài hạt bụi ấm như `dung-do`. Y đo từ khung 12 phải ≥ 105.
 *  Phụ: `co` 0..1 thả cờ số 4 hai bên cửa (0 = cuốn), `oCua` 0..1 ô cửa tầng hai loé (chương 12 cảnh 25), `f` khung hình (cờ, bóng bay, lửa, khói, giấy). */
type V3 = [number, number, number];
export type PnyState = 'ngay' | 'khoi' | 'dung-do' | 'nut' | 'binh-minh';
export type PnyView = 'chuan' | 'rong' | 'thap' | 'bac' | 'cao';
/** góc máy: chuan = máy chuẩn của danh sách; rong = toàn cảnh cao hơn, lùi ra; thap = góc thấp (chương 11 cảnh 6); bac = sát bậc thềm, nhìn lên mặt tiền; cao = trên cao lùi xa, thấy mái nhà các dãy và trụ sở dưới xa (chương 12 cảnh 25-27, Doom trên trời phố) */
export const PNY_VIEWS: Record<PnyView, V3> = {
  chuan: [0, 1.6, 7],
  rong: [0, 2.5, 13],
  thap: [2.4, 0.9, 12.5],
  bac: [0, 1.5, -2.6],
  cao: [0, 24, 46],
};
/** cao độ mặt đất của trạng thái: `ngay` hạ cả thế giới 0,6 m để mặt bục là 0 */
export const pnyGy = (s: PnyState) => (s === 'ngay' ? -0.6 : 0);
/** mốc đứng (chân; y đã cộng sẵn cao độ mặt đất của trạng thái). Trục: Fantastic Four bên TRÁI, Doom bên PHẢI. */
export const pnyMarks = (s: PnyState) => {
  const g = pnyGy(s), L = HQ.landing + g;
  return {
    /** bốn người trên bục (ngay), x tăng dần: Sue, Reed, Ben, Johnny */
    bucSue: [-1.8, 0, -5.0] as V3, bucReed: [-0.6, 0, -5.0] as V3, bucBen: [0.6, 0, -5.0] as V3, bucJohnny: [1.8, 0, -5.0] as V3,
    /** bốn người trên sảnh trước cửa (chương 11 cảnh 5), lệch trái; mặt tiền và cờ ở sau lưng */
    them: [[-4.2, L, -12.4], [-3.0, L, -12.4], [-1.8, L, -12.4], [-0.6, L, -12.4]] as V3[],
    /** đám đông (ngay): trái x -4,6 tới -2,8, phải 2,8 tới 4,6; z -2,5 tới -4 */
    danTrai: [[-4.5, g, -2.7], [-3.7, g, -3.6], [-2.9, g, -2.9], [-4.1, g, -3.9]] as V3[],
    danPhai: [[2.9, g, -2.8], [3.7, g, -3.7], [4.5, g, -2.6], [3.3, g, -3.95]] as V3[],
    /** chương 12 (dung-do, nut): bốn người bên trái trước bậc thềm, Doom bên phải trên ván; tâm vết nứt ở dưới chân Doom */
    dungJohnny: [-4.6, g, -6.2] as V3, dungSue: [-3.4, g, -6.0] as V3, dungReed: [-2.2, g, -5.8] as V3, dungBen: [-1.0, g, -6.1] as V3,
    doomBay: [2.8, g + 0.45, -5.2] as V3, nutTam: [2.8, g, -5.2] as V3,
    /** xe lật (khoi) và chỗ Ben đứng nâng nó */
    xeDo: [-0.8, g, -3.2] as V3, benNang: [-2.4, g, -3.6] as V3,
    /** ô cửa tầng hai của trụ sở (loé) và cửa chính */
    oCua: [HQ.oCua[0], HQ.oCua[1] + g, -14 + HQ.oCua[2]] as V3, cuaChinh: [0, L, -13.8] as V3,
  };
};

const Lights: React.FC<{grade: Grade; dir: V3; focus: V3; reach: number; gain?: number; keyColor?: string; skyColor?: string}> = ({grade, dir, focus, reach, gain = 1, keyColor, skyColor}) => {
  const g = GRADES[grade], target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(...focus); target.updateMatrixWorld();
  return (
    <>
      <hemisphereLight args={[skyColor ?? g.sky, g.ground, g.fill * gain]} />
      <primitive object={target} />
      <directionalLight position={[focus[0] + dir[0] * 4, focus[1] + dir[1] * 4, focus[2] + dir[2] * 4]} target={target} intensity={g.key * gain} color={keyColor ?? g.keyColor} castShadow shadow-mapSize={[4096, 4096]} shadow-radius={1.6} shadow-blurSamples={12} shadow-bias={-0.0005}
        shadow-camera-left={-reach} shadow-camera-right={reach} shadow-camera-top={reach} shadow-camera-bottom={-reach} shadow-camera-near={1} shadow-camera-far={160} />
    </>
  );
};

const LEFT = [
  {x: -13.6, w: 14.4, h: 17, c: '#a4503c', k: 'brick' as const, shops: 3, esc: true, tank: true},
  {x: -30.3, w: 19, h: 22, c: '#d3c7a4', k: 'stone' as const, shops: 3, esc: false, tank: false},
  {x: -47.5, w: 15.4, h: 15, c: '#8c6244', k: 'brick' as const, shops: 3, esc: true, tank: true},
  {x: -62.9, w: 15.4, h: 24, c: '#b8a98a', k: 'stone' as const, shops: 3, esc: false, tank: false},
];
const RIGHT = [
  {x: 13.6, w: 14.4, h: 19, c: '#8a4434', k: 'brick' as const, shops: 3, esc: true, tank: false},
  {x: 30.6, w: 19.6, h: 16, c: '#c9b894', k: 'stone' as const, shops: 3, esc: false, tank: true},
  {x: 48.1, w: 15.4, h: 23, c: '#9a5c42', k: 'brick' as const, shops: 3, esc: true, tank: false},
  {x: 63.5, w: 15.4, h: 18, c: '#b4a68a', k: 'stone' as const, shops: 3, esc: false, tank: true},
];
const TOWERS: {x: number; z: number; w: number; h: number; c: string}[] = [
  {x: -26, z: -52, w: 16, h: 52, c: '#aab4bb'}, {x: -8, z: -70, w: 14, h: 66, c: '#b9b4a6'}, {x: 14, z: -58, w: 18, h: 58, c: '#a7aeb2'}, {x: 34, z: -76, w: 16, h: 70, c: '#b8b3a2'},
  {x: -46, z: -80, w: 18, h: 78, c: '#a9b0b6'}, {x: 56, z: -60, w: 16, h: 48, c: '#b0b6b8'},
];
const AVE = [14, 29, 44, 59, 74, 89];

export const PhoNewYork: React.FC<{children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: PnyState; co?: number; oCua?: number; giay?: boolean; mat?: number; sang?: number; bangRon?: number}> =
  ({children, f = 0, dx, dz, eye = PNY_VIEWS.chuan, state = 'ngay', co = 1, oCua = 0, giay = true, mat = 1, sang = 0, bangRon = 0}) => { datNoiBui('ngoai-troi');
    const ngay = state === 'ngay', khoi = state === 'khoi', trong = state === 'dung-do' || state === 'nut' || state === 'binh-minh', nut = state === 'nut', bm = state === 'binh-minh';
    const gy = pnyGy(state), sky = khoi ? 'khoi' : bm ? 'binh-minh' : 'ngay', slabs = useSurface('slabs', 7), crack = crackTex();
    const haze = khoi ? '#c8c6c0' : bm ? '#e8cfc4' : '#c6d6e6', k = `${state}-${eye.join()}`;
    const high = eye[1] > 8;
    return (
      <GradeCtx.Provider value="dayExterior">
        <Lights grade="dayExterior" dir={bm ? [11, 4.5, 5] : [-9, 10, 5]} focus={[0, 0, high ? -20 : -6]} reach={high ? 60 : 24} gain={khoi ? 0.92 : bm ? 0.8 + 0.2 * Math.min(1, mat) : 1} keyColor={bm ? '#ffc890' : undefined} skyColor={bm ? '#f4d4cc' : undefined} />
        <StageCam eye={eye} haze={haze} fog={[khoi ? 40 : 60, khoi ? 330 : 420]} dx={dx} dz={dz} />
        <Plate from={eye} id={`pny-sky-${sky}`} d={520} paint={paintSkyNy(sky)} fog={false} />
        {bm ? <MatTroiMoc eye={eye} k={mat} /> : null}
        <Plate from={eye} id={`pny-far-${k}`} d={eye[2] + 300} paint={paintSkylineNy(eye[1] + gy * 0, eye[0], eye[2] + 300, 0, sky, 5)} fog={false} />
        <Plate from={eye} id={`pny-mid-${k}`} d={eye[2] + 150} paint={paintSkylineNy(eye[1] + gy * 0, eye[0], eye[2] + 150, 1, sky, 9)} fog />
        <group position={[0, gy, 0]}>
          {/* ground: pavers in front of the headquarters, asphalt in the parking lanes and the avenues, kerbs */}
          <Slab x={[-90, 90]} z={[-16, 2.2]} y={0} color="#cfc8ba" map={slabs} tile={2.4} />
          <Slab x={[-90, -6.5]} z={[-10.4, -6]} y={0.012} color="#52565c" />
          <Slab x={[6.5, 90]} z={[-10.4, -6]} y={0.012} color="#52565c" />
          {[-1, 1].map((s) => <React.Fragment key={s}>
            <mesh position={[s * 6.5, 0.04, -8.2]}><boxGeometry args={[0.3, 0.08, 4.4]} /><meshLambertMaterial color="#b0aca0" /></mesh>
            {Array.from({length: 7}, (_, i) => <mesh key={i} position={[s * (9 + i * 3.6), 0.02, -8.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.1, 2.4]} /><meshBasicMaterial color="#e8e4d4" /></mesh>)}
            <B2 p={[s * 45, 0.04, -6.1]} s={[77, 0.08, 0.2]} c="#b0aca0" />
          </React.Fragment>)}
          <B2 p={[0, 0.07, 2.3]} s={[180, 0.14, 0.3]} c="#b9b4a8" />
          <Slab x={[-90, 90]} z={[2.4, 10]} y={-0.1} color="#4a4d53" />
          <Slab x={[-9.5, 9.5]} z={[10, 120]} y={-0.1} color="#4a4d53" />
          <Slab x={[-90, -9.5]} z={[10, 120]} y={-0.02} color="#bdb7aa" map={slabs} tile={2.4} />
          <Slab x={[9.5, 90]} z={[10, 120]} y={-0.02} color="#bdb7aa" map={slabs} tile={2.4} />
          {Array.from({length: 7}, (_, i) => <mesh key={i} position={[-3.1 + i * 1.03, -0.085, 6.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.5, 7.2]} /><meshBasicMaterial color="#e8e6dc" /></mesh>)}
          {Array.from({length: 14}, (_, i) => <mesh key={`d${i}`} position={[-60 + i * 9, -0.085, 8.3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.2, 0.14]} /><meshBasicMaterial color="#e8d36a" /></mesh>)}
          {Array.from({length: 12}, (_, i) => <mesh key={`a${i}`} position={[0, -0.085, 14 + i * 8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.14, 3.2]} /><meshBasicMaterial color="#e8d36a" /></mesh>)}
          {/* the headquarters, its steps and the two rows of buildings */}
          <Headquarters pos={[0, 0, -14]} oCuaLit={oCua} f={f} banners={co} />
          {bangRon > 0 ? <BangRonToa pos={[-7.6, 9.9, -13.6]} w={2.2} h={7.0} drop={bangRon} f={f} /> : null}
          <BacThem pos={[0, 0, -14]} w={HQ.w} />
          {LEFT.map((q, i) => <NhaPho key={`l${i}`} pos={[q.x, 0, -14]} w={q.w} h={q.h} color={q.c} kind={q.k} seed={20 + i} shops={q.shops} escape={q.esc} tank={q.tank} lod={i > 1} sang={Math.max(0, Math.min(1, sang * 1.7 - i * 0.2))} />)}
          {RIGHT.map((q, i) => <NhaPho key={`r${i}`} pos={[q.x, 0, -14]} w={q.w} h={q.h} color={q.c} kind={q.k} seed={40 + i} shops={q.shops} escape={q.esc} tank={q.tank} lod={i > 1} fireShop={khoi && i === 0 ? 1 : 0} fireAt={0} sang={Math.max(0, Math.min(1, sang * 1.7 - i * 0.2 - 0.1))} />)}
          {TOWERS.map((q, i) => <NhaPho key={`t${i}`} pos={[q.x, 0, q.z]} w={q.w} h={q.h} d={14} color={q.c} kind="stone" seed={70 + i} shops={1} lod />)}
          {AVE.map((z, i) => <React.Fragment key={z}>
            <NhaPho pos={[-9.6, 0, z]} rotY={Math.PI / 2} w={13} h={14 + (i % 3) * 5} d={16} color={['#a4503c', '#d3c7a4', '#8c6244'][i % 3]} kind={i % 2 ? 'stone' : 'brick'} seed={90 + i} shops={2} lod={high ? i > 3 : true} />
            <NhaPho pos={[9.6, 0, z]} rotY={-Math.PI / 2} w={13} h={16 + ((i + 1) % 3) * 5} d={16} color={['#c9b894', '#8a4434', '#b4a68a'][i % 3]} kind={i % 2 ? 'brick' : 'stone'} seed={110 + i} shops={2} lod={high ? i > 3 : true} />
          </React.Fragment>)}
          {/* street furniture along the parking lanes and the plaza edge */}
          {[[-7.4, -5.6, 1], [7.4, -5.6, -1], [-16, -5.6, 1], [16, -5.6, -1], [-25, -5.6, 1], [25, -5.6, -1]].map(([x, z, a], i) => <DenPho key={i} pos={[x, 0, z]} arm={a as 1 | -1} />)}
          <Xe60 pos={[-8.6, 0, -8.2]} body="#e9e0c8" trim="#5aa9a0" />
          <Xe60 pos={[-17.2, 0, -8.0]} rotY={Math.PI} body="#c8463c" trim="#f1ead8" />
          {!khoi ? <Xe60 pos={[10.5, 0, -8.2]} rotY={Math.PI} body="#4f7fb0" trim="#e9e0c8" /> : null}
          <Xe60 pos={[20.5, 0, -8.1]} body="#d9a441" trim="#2f3a4a" />
          <Hydrant pos={[-6.0, 0, -5.4]} /><Hydrant pos={[17.5, 0, -5.4]} />
          <Mailbox pos={[7.0, 0, -5.2]} rotY={-0.3} /><Bin pos={[-5.6, 0, -4.9]} fallen={khoi} /><Bin pos={[6.4, 0, -4.4]} />
          {[-10.6, -9.4, -8.2, -7.0].map((x) => <Meter key={x} pos={[x, 0, -5.6]} />)}
          <QuayBao pos={[-11.2, 0, -11.6]} rotY={0.05} /><PhoneBooth pos={[10.8, 0, -11.4]} /><TrafficLight pos={[12.2, 0, -5.0]} state={khoi ? 'g' : 'r'} /><TrafficLight pos={[-12.6, 0, -5.0]} arm={1} />
          <Tree pos={[-9.8, 0, -3.4]} seed={1} /><Tree pos={[10.4, 0, -3.2]} seed={2} /><Tree pos={[-20, 0, -3.2]} seed={3} /><Tree pos={[21, 0, -3.4]} seed={4} />
          {/* the day of the cheering: platform, ropes, pennants, balloons, confetti */}
          {ngay ? <>
            <BucVai pos={[0, 0, -5.0]} />
            <RaoDay a={[-7.2, 0, -1.6]} b={[-2.5, 0, -1.6]} n={4} /><RaoDay a={[2.5, 0, -1.6]} b={[7.2, 0, -1.6]} n={4} />
            <RaoDay a={[-2.5, 0, -1.6]} b={[-2.5, 0, -6.6]} n={4} /><RaoDay a={[2.5, 0, -1.6]} b={[2.5, 0, -6.6]} n={4} />
            <Pennants a={[-7.4, 7.4, -5.6]} b={[7.4, 7.4, -5.6]} sag={0.9} n={26} f={f} />
            <Pennants a={[-7.4, 7.0, -5.6]} b={[-6.6, 6.6, -14.4]} sag={0.4} n={10} f={f} />
            <Balloons f={f} box={[-7, 7, -9, -2]} n={11} />
            {giay ? <FlyingLeaves f={f} box={[-7, 7, 9, -9, -1.5]} n={46} colors={['#e2566a', '#f2c94c', '#4f8fc8', '#f6f0e4', '#4f8a4a', '#d9763a']} wind={1.8} size={0.085} seed={9} /> : null}
            {giay ? <FlyingLeaves f={f} box={[-5, 5, 7, -3, 1]} n={9} colors={['#f6f0e4', '#f2c94c', '#e2566a']} wind={1.5} size={0.11} seed={14} order={600} /> : null}
          </> : null}
          {trong ? <>
            <FlyingLeaves f={f} box={[-14, 14, 7, -13, 1]} n={14} colors={['#d8d0b8', '#c9c0a2', '#9aa88a', '#e8e4d4']} wind={3.4} size={0.12} seed={5} />
            <Rubble pos={[-9, 0, -4.5]} area={[3, 2]} n={3} seed={3} colors={['#bdb8ab', '#a7a294']} />
          </> : null}
          {nut ? <>
            <mesh position={[2.8, 0.016, -5.2]} rotation={[-Math.PI / 2, 0, 0.3]}><planeGeometry args={[6.6, 6.6]} /><meshBasicMaterial map={crack} transparent depthWrite={false} /></mesh>
            <Rubble pos={[2.8, 0, -5.2]} area={[6.4, 5.2]} n={26} seed={7} />
            <Rubble pos={[-3, 0, -7.5]} area={[4, 2.5]} n={8} seed={11} />
            <Shards pos={[0, 0, -8.5]} area={[10, 3]} n={26} seed={4} />
            <SmokeDrift f={f} box={[-6, -3.4, 0.4, 4.2, -9.4, -8]} n={5} color="#8a8480" opacity={0.3} size={1.3} wind={0.12} seed={2} />
            <SmokeDrift f={f} box={[5.8, 8.6, 0.4, 4.6, -9.6, -8.2]} n={5} color="#8a8480" opacity={0.3} size={1.3} wind={0.12} seed={5} />
            <Embers f={f} box={[2.2, 3.4, 0.05, 1.4, -5.6, -4.8]} n={5} size={0.03} life={50} seed={4} color="#ffd9a0" />
          </> : null}
          {/* the fire and what it left (state khoi) */}
          {khoi ? <Fire f={f} /> : null}
          <Pigeon pos={[-3.2, 4.67, -11.9]} /><Pigeon pos={[-2.7, 4.67, -11.8]} flip /><Pigeon pos={[3.4, 4.67, -11.9]} flip peck={0.5} />
          {/* air: dust in the sun */}
          <Motes f={f} box={[-9, 9, 0.6, 5, -12, -1]} n={khoi ? 18 : 30} color={khoi ? '#e8dcc8' : '#fff4d4'} size={0.012} drift={0.35} glow={0.15} seed={khoi ? 3 : 7} />
        </group>
        {children}
      </GradeCtx.Provider>
    );
  };

const B2: React.FC<{p: V3; s: V3; c: string}> = ({p, s, c}) => <mesh position={p} receiveShadow><boxGeometry args={s} /><meshLambertMaterial color={c} /></mesh>;

/** the burning shop on the right (the first shop of the right-hand row, x 9.7 to 14.5) and the wreck in front of it */
const Fire: React.FC<{f: number}> = ({f}) => {
  const Kh = KhoiCol;
  return (
    <>
      {/* flames in the broken shopfront and licking out of an upper window */}
      <Lua pos={[10.0, 0.1, -13.6]} w={1.5} h={2.5} f={f} seed={1} /><Lua pos={[11.6, 0.1, -13.5]} w={1.8} h={3.1} f={f + 5} seed={2} /><Lua pos={[13.2, 0.1, -13.6]} w={1.4} h={2.2} f={f + 11} seed={3} />
      <Lua pos={[10.4, 4.8, -13.78]} w={1.2} h={2.0} f={f + 3} seed={4} k={0.9} /><Lua pos={[13.8, 8.0, -13.8]} w={0.9} h={1.5} f={f + 8} seed={5} k={0.8} />
      <mesh position={[11.6, 1.6, -13.4]}><planeGeometry args={[4.4, 3.2]} /><meshBasicMaterial color="#ff7a22" transparent opacity={0.28} depthWrite={false} /></mesh>
      <pointLight position={[11.6, 1.8, -11.6]} color="#ff8a3a" intensity={22} distance={9} decay={1.6} />
      <Kh f={f} />
      <Embers f={f} box={[9.2, 14.2, 1.0, 9, -13.4, -12.2]} n={22} size={0.05} life={56} seed={3} color="#ffb24a" />
      {/* the wreck: a car on its roof in front of the headquarters' left, scattered glass and rubble, a spilled bin, a spray from the hydrant */}
      <Xe60 pos={[-0.8, 0.16, -3.2]} rotY={0.25} lat body="#e9e0c8" trim="#5aa9a0" wreck />
      <Shards pos={[2.0, 0, -4.5]} area={[9, 6]} n={60} seed={6} /><Shards pos={[11.6, 0, -11]} area={[5, 4]} n={40} seed={9} />
      <Rubble pos={[10.5, 0, -11.2]} area={[4.5, 3]} n={14} seed={2} colors={['#8a8176', '#a6584a', '#7a3a30']} />
      <Rubble pos={[-3.2, 0, -2.4]} area={[4, 3]} n={8} seed={4} />
      <Spray pos={[17.5, 0.7, -5.4]} f={f} dir={-1} />
      <mesh position={[16.0, 0.014, -5.2]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.5, 16]} /><meshBasicMaterial color="#8ca2ae" transparent opacity={0.6} /></mesh>
      <SmokeDrift f={f} box={[-7, 7, 0.8, 6.5, -10.5, -6.5]} n={6} color="#9c9690" opacity={0.2} size={2.4} wind={0.3} seed={3} order={5} />
    </>
  );
};
const KhoiCol: React.FC<{f: number}> = ({f}) => (
  <>
    <Khoi f={f} pos={[11.0, 1.8, -13.0]} h={28} w={1.6} n={13} lean={3.4} seed={1} />
    <Khoi f={f + 40} pos={[13.6, 8.6, -13.0]} h={20} w={1.2} n={7} lean={3.0} seed={2} color="#7a7470" dark="#5a5450" opacity={0.6} />
  </>
);

// ---------------------------------------------------------------- stills (no people): each state and each view
type Props = React.ComponentProps<typeof PhoNewYork>;
const mk = (p: Props, yaw = 0): React.FC => () => {
  const {width, height} = useVideoConfig();
  return <AbsoluteFill><Finish warm=""><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><XoayCtx.Provider value={yaw}><PhoNewYork {...p} /></XoayCtx.Provider></ThreeCanvas></Finish></AbsoluteFill>;
};
const S = {
  binhMinhChuan: mk({state: 'binh-minh', eye: PNY_VIEWS.chuan, f: 14, co: 0, giay: false, mat: 0.8, sang: 0.7}),
  binhMinhSom: mk({state: 'binh-minh', eye: PNY_VIEWS.chuan, f: 14, co: 0, giay: false, mat: 0.3, sang: 0.2}),
  binhMinhBang: mk({state: 'binh-minh', eye: [-4.2, 1.55, 0.6], f: 14, co: 0, giay: false, mat: 1, sang: 1, bangRon: 1}),
  ngayChuan: mk({state: 'ngay', eye: PNY_VIEWS.chuan, f: 14}),
  ngayRong: mk({state: 'ngay', eye: PNY_VIEWS.rong, f: 14}),
  ngayThap: mk({state: 'ngay', eye: PNY_VIEWS.thap, f: 14}),
  ngayBac: mk({state: 'ngay', eye: PNY_VIEWS.bac, f: 14}),
  khoiChuan: mk({state: 'khoi', eye: PNY_VIEWS.chuan, f: 14}),
  khoiThap: mk({state: 'khoi', eye: PNY_VIEWS.thap, f: 14}),
  dungDoChuan: mk({state: 'dung-do', eye: PNY_VIEWS.chuan, f: 14}),
  dungDoCao: mk({state: 'dung-do', eye: PNY_VIEWS.cao, f: 14}),
  nutChuan: mk({state: 'nut', eye: PNY_VIEWS.chuan, f: 14}),
  nutRong: mk({state: 'nut', eye: PNY_VIEWS.rong, f: 14}),
  oCuaLoe: mk({state: 'dung-do', eye: PNY_VIEWS.rong, f: 14, oCua: 1}),
};
export const PhoNewYorkComps: React.FC = () => (
  <>
    <Composition id="pho-ny-binh-minh-chuan" component={S.binhMinhChuan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-binh-minh-som" component={S.binhMinhSom} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-binh-minh-bang" component={S.binhMinhBang} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-ngay-chuan" component={S.ngayChuan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-ngay-rong" component={S.ngayRong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-ngay-thap" component={S.ngayThap} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-ngay-bac" component={S.ngayBac} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-khoi-chuan" component={S.khoiChuan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-khoi-thap" component={S.khoiThap} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-dung-do-chuan" component={S.dungDoChuan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-dung-do-cao" component={S.dungDoCao} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-nut-chuan" component={S.nutChuan} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-nut-rong" component={S.nutRong} width={1280} height={720} fps={24} durationInFrames={1} />
    <Composition id="pho-ny-o-cua-loe" component={S.oCuaLoe} width={1280} height={720} fps={24} durationInFrames={1} />
  </>
);
