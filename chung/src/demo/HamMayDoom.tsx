import React, {useMemo} from 'react';
import {datNoiBui} from '../lib3/mauBui';
import {Composition, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {GradeCtx} from '../lib3/look';
import {Halo} from '../lib3/look';
import {B, StageCam} from '../lib3/kit';
import {Sun} from '../lib3/room';
import {Shot} from '../lib3/shot';
import {StoneBox} from '../lib3/kitForge';
import {tex, DriftSpecks} from '../lib3/kitLab';
import {AirLayer} from '../lib3/kitCamp';
import {Embers, SparkBurst} from '../lib3/fx';
import {rnd, Ctx} from '../lib3/depth';
import {Rubble, Shards} from '../lib3/kitPhoNewYork';
import {SmokeDrift} from '../lib3/fx';
import {BuongKinh, BuongVo, AngTen, NumVan, DenBan, ManHinhPhu, CotSangXanh, MauMay} from '../lib3/kitLo1517';
import {MaskPlate, Pipe, Tank, WorkLamp, RobotRows, RobotSprite, Partition, AssemblyRack, Bench, ScrapHeap, Furnace, Crane, Monitor, ControlDesk, Pedestal, TimeArc, HutMachine, RoundScreen, GlassTube, Gear, TimeGate, Treasure} from '../lib3/kitHamMay';

/** HẦM MÁY CỦA DOOM (chapter 10 scenes 10, 11, 13, 16, 18; chapter 11 scenes 17-22, 28; chapter 12 scenes 1, 15, 16, 17, 35). Part of the common set: NO people.
 *  A long steel-and-stone workshop under the castle, in metres, the camera looks along -z:
 *    floor x -10..10, z +3 (open front) .. -21 (back wall); ceiling 9 m; the crane's rails along z at x +-10 (y 7.4), its bridge at z -11
 *    left front: the ASSEMBLY RACK (-3.7, 0, -5.2), a robot with its chest open on it (the robot stands on y 0.1), a bench with tools at (-7.4, -6.3);
 *                the BLUEPRINT PARTITION x -9.9..-2.4 at z -7.4 (3.4 m high, three sheets: 1.4, 3.7, 6.1 m from its left end)
 *    centre: open floor z -2..-8 (Doom at doomMan (0, 0, -5.4)); behind it ROWS OF ROBOTS, 5 columns x -4.4..4.4, 8 rows from z -12.0 back by 0.9 (so that Doom at 55 % of the frame from the cameras of the scene list stands in front of the first row), a work lamp over each
 *    right (states 'may-thoi-gian' and 'may-hut' only): the round PEDESTAL (3.4, 0, -6.0), the arc (or the draining machine) behind it, the CONTROL DESK at (6.2, 0, -4.1) with its lever (Doom's hand at doomCan (5.0, 0, -4.1)),
 *           a bank of vertical steel pipes at x 6.3..8.1, z -6.6 (the explosion of chapter 11 scene 22 at (6.6, 1.4, -6.4))
 *    back: three iron masks of Doom in the wall (z -20.6), tanks of green liquid at the left, the FURNACE at (7.6, 0, -12.5), the SCRAP HEAP at (-8.6, 0, -17.4) under a chute from the back wall
 *    the glass TUBE (chapter 11) at (-1.0, 0, -8.0); the round SCREEN (chapter 12) hung at (0, 3.0, -8.6).
 *  States: 'xuong' (chapter 10: no platform, desk or tube; work lights on, Y 100+, rows lit by `hang`), 'may-thoi-gian' (chapter 11: the same light, robots dark, the glass tube, the platform, the arc, the desk with its lever, the ring lamps by `ben`),
 *  'may-hut' (chapter 12: darker, Y 85+, robots dark, the round screen, the platform and desk with the draining machine in place of the arc). Props: hang = rows with eyes lit (0..8, fractions fade the next row in);
 *  hangDau = leave the first row empty (people stand there); banVe 0..3 = sheets glowing; can 0..1 = the lever; ben 0..1 = ring lamps and blue glow; kep 0..1 = the clamps; hut 0..1 = the white glow;
 *  manHinh 0..1; xoay = the time gate's own turning clock (frames; default f), mo 0..1 = how open its vortex is (state 'may-thoi-gian'); Treasure (exported) goes in `children`; hanAt = frames of welding bursts at the rack; gia = show the assembly rack (default: only in 'xuong'); ong = show the tube; extra = more in the room. */
type V3 = [number, number, number];
/** 24/11/2026 (chương 15, 16): trạng thái 'phao-dai' = PHÁO ĐÀI, cùng vỏ phòng và các mốc: bỏ hàng robot, đèn trên hàng robot, cần cẩu, giá lắp, đống phế liệu và máng; sàn không còn khung vàng của giá; hạt ít hơn.
 *  Thêm dải cửa sổ hẹp (sáu ô, z -21, y 5,8..7,4) nhìn ra núi tuyết ở tường sau; ba mặt nạ hạ xuống y 3,4 cho dải cửa sổ ở trên. Phía phải: bệ tròn, BUỒNG KÍNH CÓ CỬA VÀ KHOÁ (`BuongKinh`, cao 2,4, đỉnh nắp 3,1), ĂNG TEN BA ĐĨA (`AngTen`, đỉnh 4,3), bàn điều khiển có DẢI ĐÈN (`DenBan`), NÚM VẶN hai mặt (`NumVan` ở mốc `num`), MÀN HÌNH PHỤ (`ManHinhPhu`, mốc `phu`).
 *  Tham số của trạng thái: cua 0..1 (cửa buồng: 0 mở, 1 sập), khoa 0..3 (số khoá kẹp đã đóng), sangBuong 0..1, mauMay 'tim' | 'xanh' (màu buồng, ăng ten), ang 0..3 (số đĩa ăng ten đã sáng), chay 0..1 (chấm chạy theo ống), tia 0..1, kim 0..1 (kim núm vặn), denChay 0..1, banXanh 0..1 (đèn bàn đổi xanh), cot 0..1 (cột sáng xanh qua ăng ten tới trần), song (sóng nước gợn trên kính buồng, như `ongWave`),
 *  donat 0..1 (ĐỔ NÁT, cuối chương 16: buồng vỡ, ăng ten bẻ nghiêng, bàn nghiêng, xà đổ, ống đứt, kính cửa sổ vỡ và tuyết lọt vào, đèn đỏ chớp, khói thưa; chỗ Doom đứng để trống), manHinh 0..1 (màn tròn treo ở mốc `manHinh`).
 *  Các trạng thái khác không đổi từng điểm ảnh. */
export type HamState = 'xuong' | 'may-thoi-gian' | 'may-hut' | 'phao-dai';
const ROW_X = [-4.4, -2.2, 0, 2.2, 4.4], ROW_Z0 = -12.0;
export const HAM_MARKS = {
  giaLap: [-3.7, 0.1, -5.1] as V3, doomGia: [-1.5, 0, -4.9] as V3,
  doomMan: [0, 0, -5.4] as V3, doomCan: [5.0, 0, -4.1] as V3, benTron: [3.4, 0, -6.0] as V3,
  hang1: ROW_X.map((x) => [x, 0, ROW_Z0] as V3), doomHang: [0, 0, ROW_Z0] as V3, doomQuan: [1.0, 0, -10.8] as V3,
  doomXem: [1.0, 0, -7.0] as V3, surferXem: [-0.9, 0.35, -6.7] as V3,
  fanA: [-2.0, 0, -4.6] as V3, fanB: [-1.1, 0, -5.0] as V3, fanC: [-0.2, 0, -4.4] as V3, doomTinh: [1.4, 0, -4.4] as V3, ong: [-1.0, 0, -8.0] as V3,   // chapter 11 scene 17: three on the left centre, Doom right
  benA: [3.0, 0.18, -6.0] as V3, benB: [3.45, 0.18, -6.35] as V3, benC: [3.9, 0.18, -5.85] as V3,   // standing on the platform
  robotPhe: [-5.6, 0, -14.0] as V3, dongPhe: [-8.6, 0, -17.4] as V3, mang: [-8.6, 5.0, -19.0] as V3,
  banVe: [-6.0, 0, -6.5] as V3, doomVe: [-1.6, 0, -6.6] as V3,
  quaCan: [6.6, 1.4, -6.4] as V3, ongThep: [7.2, 0, -6.6] as V3, manHinh: [0, 3.0, -8.6] as V3,
  // 24/11/2026 (phao-dai): num = chân trụ núm vặn trên bàn (mặt núm ở y +0,27); phu = màn hình phụ; buong = đáy buồng kính (mặt bệ); robotPhao = hai robot đứng sau bàn điều khiển
  num: [5.75, 1.3, -3.75] as V3, phu: [6.0, 1.75, -4.95] as V3, buong: [3.4, 0.185, -6.0] as V3, robotPhao: [[6.9, 0, -5.2], [7.6, 0, -5.6]] as V3[],
};
/** Camera positions (eye). lap = ch10 s10; doc = s11 (looking down the rows); phe = s16; quan = s18; toan = a wide of the whole floor; ben = the platform seen from the front;
 *  ve = ch11 s28 (slide it right along the partition); can = ch11 s22 / ch12 s16 (the lever and the platform); man = ch12 s1; xem = ch12 s15. */
export const HAM_VIEWS = {
  lap: [-2.4, 1.7, 0.5] as V3, doc: [0, 2.4, -5.0] as V3, phe: [-6.0, 1.5, -9.0] as V3, quan: [1.0, 1.25, -6.2] as V3, toan: [0.5, 2.0, 2.0] as V3,
  ben: [3.4, 1.6, 0.3] as V3, ve: [-4.6, 1.6, -0.6] as V3, can: [4.4, 1.7, 1.6] as V3, man: [0, 1.9, -1.8] as V3, xem: [0.2, 1.6, -0.6] as V3,
  // 24/11/2026 (phao-dai; chương 15 cảnh 8, 10-12, 14-16, chương 16 cảnh 7, 10, 15): bao = chương 16 s7, cho = ch15 s8 (lượn), pha = ch16 s10 và s15, nhot = ch15 s11, angten = ch15 s12, num = ch15 s14, gat = ch15 s15, rong = ch15 s16
  pdBao: [5.3, 1.75, -0.9] as V3, pdCho: [5.0, 1.7, 1.9] as V3, pdPha: [2.9, 1.6, 2.6] as V3, pdNhot: [3.9, 1.6, 0.3] as V3, pdAngTen: [3.4, 2.95, -0.4] as V3, pdNum: [5.3, 1.5, -1.6] as V3, pdGat: [5.0, 1.55, -1.0] as V3, pdRong: [4.2, 2.3, 3.2] as V3,
};

// ---------------------------------------------------------------- floor
const paintFloor = (c: Ctx, W: number, H: number, pd = false) => {
  const r = rnd(9), ppm = W / 20, X = (x: number) => (x + 10) * ppm, Z = (z: number) => (z + 21) * ppm;
  c.fillStyle = '#26303a'; c.fillRect(0, 0, W, H);
  for (let ix = 0; ix < 20 / 1.25; ix++) for (let iz = 0; iz < 24 / 1.25; iz++) {
    const x = ix * 1.25 * ppm, y = iz * 1.25 * ppm; c.fillStyle = ['#56626e', '#4e5a66', '#5c6874', '#525e6a'][(ix * 3 + iz * 7 + (r() < 0.2 ? 1 : 0)) % 4]; c.fillRect(x + 2, y + 2, 1.25 * ppm - 4, 1.25 * ppm - 4);
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(x + 4, y + 4, 1.25 * ppm - 8, 3); c.fillStyle = '#2d363f'; [[8, 8], [1.25 * ppm - 8, 8], [8, 1.25 * ppm - 8], [1.25 * ppm - 8, 1.25 * ppm - 8]].forEach(([dx, dy]) => { c.beginPath(); c.arc(x + dx, y + dy, 3.2, 0, 7); c.fill(); });
  }
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(20,22,26,${0.08 + r() * 0.14})`; c.beginPath(); c.ellipse(r() * W, r() * H, 10 + r() * 60, 6 + r() * 26, 0, 0, 7); c.fill(); }
  // cable trench across the hall and a worn walking lane down the middle
  c.fillStyle = '#1a2026'; c.fillRect(0, Z(-7.9), W, 0.34 * ppm); c.strokeStyle = '#8a3a2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, Z(-7.8)); c.lineTo(W, Z(-7.8)); c.stroke(); c.strokeStyle = '#2a5a8a'; c.beginPath(); c.moveTo(0, Z(-7.7)); c.lineTo(W, Z(-7.7)); c.stroke();
  c.fillStyle = 'rgba(200,210,220,0.07)'; c.fillRect(X(-1.2), 0, 2.4 * ppm, H);
  // yellow and black hazard ring round the platform, a yellow frame round the rack, a yellow edge before the robot rows
  const hazard = (cx: number, cz: number, rad: number, w: number) => { for (let k = 0; k < 40; k++) { c.beginPath(); c.arc(X(cx), Z(cz), rad * ppm, (k / 40) * 6.2832, ((k + 1) / 40) * 6.2832); c.strokeStyle = k % 2 ? '#d9b42a' : '#1a1c20'; c.lineWidth = w * ppm; c.stroke(); } };
  hazard(3.4, -6.0, 1.62, 0.22);
  if (!pd) { c.strokeStyle = '#d9b42a'; c.lineWidth = 0.1 * ppm; c.strokeRect(X(-5.1), Z(-4.2), 2.8 * ppm, 1.8 * ppm); c.fillStyle = '#d9b42a'; c.fillRect(X(-5.4), Z(-11.4), 10.8 * ppm, 0.08 * ppm); }
  for (let k = 0; k < 30; k++) { c.fillStyle = k % 2 ? '#d9b42a' : '#1a1c20'; c.fillRect(X(5.0) + k * 0.2 * ppm, Z(-3.45), 0.2 * ppm, 0.12 * ppm); }
  for (let i = 0; i < 24; i++) { c.fillStyle = 'rgba(255,150,60,0.18)'; c.beginPath(); c.arc(X(6 + r() * 3.4), Z(-14.4 + r() * 2.6), 4 + r() * 14, 0, 7); c.fill(); }   // glow-scorched near the furnace
  for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(60,200,120,0.14)'; c.beginPath(); c.arc(X(-9.6 + r() * 3.4), Z(-20.6 + r() * 1.2), 4 + r() * 12, 0, 7); c.fill(); }   // green spills by the tanks
};
const FLOOR_PLAN = {x: [-10, 10], z: [-21, 3]};


// ---------------------------------------------------------------- 'phao-dai' (24/11/2026): the back wall with its narrow windows, and the right-hand machine
/** snow mountains seen through the six slits: pale sky with a low sun, three ranges (far, middle, near), a misty snow field below; the strip is 28 x 3.5 m centred at y 6.6 (the slits show y 5.8..7.4) */
const rangeNui = (c: Ctx, W: number, base: number, hmin: number, hmax: number, wmin: number, wmax: number, body: string, shade: string, cap: string, seed: number) => {
  const r = rnd(seed); let x = -120;
  while (x < W + 120) {
    const w = wmin + r() * (wmax - wmin), h = hmin + r() * (hmax - hmin), px = x + w * (0.35 + r() * 0.3);
    c.fillStyle = body; c.beginPath(); c.moveTo(x, base); c.lineTo(px, base - h); c.lineTo(x + w, base); c.closePath(); c.fill();
    c.fillStyle = shade; c.beginPath(); c.moveTo(px, base - h); c.lineTo(x + w, base); c.lineTo(px + w * 0.08, base); c.lineTo(px - 2, base - h * 0.45); c.closePath(); c.fill();
    const t = 0.38, lx = px - (px - x) * t, rx = px + (x + w - px) * t, ty = base - h * (1 - t);
    c.fillStyle = cap; c.beginPath(); c.moveTo(px, base - h); c.lineTo(rx, ty); c.lineTo(px + (rx - px) * 0.55, ty - h * 0.07); c.lineTo(px + 4, ty + h * 0.08); c.lineTo(px - (px - lx) * 0.5, ty - h * 0.05); c.lineTo(lx, ty); c.closePath(); c.fill();
    x += w * (0.55 + r() * 0.3);
  }
};
const paintNui = (c: Ctx, W: number, H: number) => {
  const g = c.createLinearGradient(0, 0, 0, H * 0.7); g.addColorStop(0, '#c4dcf2'); g.addColorStop(0.55, '#e2eef8'); g.addColorStop(1, '#f6efe0'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,246,214,0.5)'; c.beginPath(); c.arc(W * 0.66, H * 0.34, 46, 0, 7); c.fill(); c.fillStyle = '#fffbea'; c.beginPath(); c.arc(W * 0.66, H * 0.34, 24, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)'; [[0.12, 0.2, 130], [0.38, 0.14, 90], [0.84, 0.22, 150]].forEach(([x, y, w]) => { c.fillRect(W * (x as number), H * (y as number), w as number, 7); c.fillRect(W * (x as number) + 30, H * (y as number) - 6, (w as number) * 0.6, 7); });
  rangeNui(c, W, H * 0.64, H * 0.22, H * 0.4, 220, 420, '#a8bcd2', '#8aa0ba', '#f6fafe', 4);
  c.fillStyle = 'rgba(236,242,250,0.55)'; c.fillRect(0, H * 0.5, W, H * 0.16);
  rangeNui(c, W, H * 0.68, H * 0.14, H * 0.3, 200, 360, '#7d95b0', '#657c99', '#ffffff', 8);
  c.fillStyle = 'rgba(240,246,252,0.4)'; c.fillRect(0, H * 0.58, W, H * 0.12);
  rangeNui(c, W, H * 0.73, H * 0.07, H * 0.17, 180, 320, '#56708c', '#44597a', '#f2f7fb', 12);
  c.fillStyle = '#e6edf4'; c.fillRect(0, H * 0.73, W, H * 0.3); c.fillStyle = '#cfdae6'; for (let i = 0; i < 9; i++) c.fillRect(W * (i / 9) + 20, H * (0.78 + (i % 3) * 0.05), 160, 5);
};
const PX = [-9, -6, -3, 0, 3, 6, 9], SLIT = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5];
const PdWallBack: React.FC<{wall: Record<string, unknown>; f: number; broken: number}> = ({wall, f, broken}) => {
  const view = useMemo(() => tex('hm-pd-nui', 2048, 256, paintNui), []);
  const jag = useMemo(() => { const r = rnd(17); return SLIT.map(() => Array.from({length: 5}, () => ({x: (r() - 0.5) * 2.0, h: 0.12 + r() * 0.3, w: 0.1 + r() * 0.14, top: r() < 0.5}))); }, []);
  const look = (sd: number) => ({...wall, seed: sd});
  return (
    <group>
      <StoneBox id="hm-pd-lo" p={[0, 2.25, -21.3]} s={[20.6, 4.5, 0.6]} look={look(5)} />
      <StoneBox id="hm-pd-hi" p={[0, 7.55, -21.3]} s={[20.6, 2.9, 0.6]} look={look(6)} />
      {PX.map((x, i) => <StoneBox key={x} id={`hm-pd-pier${i}`} p={[x, 5.3, -21.3]} s={[0.8, 1.6, 0.6]} look={look(7 + i)} />)}
      {[-9.85, 9.85].map((x, i) => <StoneBox key={x} id={`hm-pd-end${i}`} p={[x, 5.3, -21.3]} s={[0.9, 1.6, 0.6]} look={look(20 + i)} />)}
      <mesh position={[0, 5.3, -22.2]}><planeGeometry args={[28, 3.5]} /><meshBasicMaterial map={view} toneMapped={false} fog={false} /></mesh>
      {SLIT.map((cx, i) => <group key={cx}>
        <B p={[cx, 4.57, -20.95]} s={[2.4, 0.14, 0.56]} c="#59646c" /><B p={[cx, 6.03, -20.95]} s={[2.4, 0.14, 0.56]} c="#4a545c" /><B p={[cx, 4.5, -20.7]} s={[2.5, 0.05, 0.1]} c="#c9a02c" cast={false} />
        {broken > 0.02 ? <>
          {jag[i].map((q, k) => <mesh key={k} position={[cx + q.x * 0.5, q.top ? 5.96 - q.h / 2 : 4.64 + q.h / 2, -21.25]} rotation={[0, 0, q.top ? Math.PI : 0]}><coneGeometry args={[q.w, q.h, 3]} /><meshLambertMaterial color="#d8eaf6" transparent opacity={0.6} flatShading /></mesh>)}
          <B p={[cx, 4.69, -20.85]} s={[1.5 + (i % 3) * 0.2, 0.1, 0.34]} c="#f2f6fa" />
        </> : <>
          <B p={[cx, 5.3, -21.0]} s={[0.06, 1.5, 0.08]} c="#4a545c" />
          <mesh position={[cx, 5.3, -21.3]}><planeGeometry args={[2.2, 1.5]} /><meshBasicMaterial color="#dff0ff" transparent opacity={0.1} depthWrite={false} /></mesh>
          <mesh position={[cx - 0.4, 5.3, -21.29]} rotation={[0, 0, 0.5]}><planeGeometry args={[0.12, 1.6]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.16} depthWrite={false} /></mesh>
        </>}
      </group>)}
      {broken > 0.02 ? <AirLayer f={f} box={[-9, 9, 0.6, 7.2, -21, -15]} n={20} color="#ffffff" size={0.045} life={120} wind={[0.05, -0.08]} wob={0.2} opacity={0.9} seed={61} /> : null}
    </group>
  );
};
type PdMayProps = {f: number; cua: number; khoa: number; sang: number; mau: MauMay; wave: number; ang: number; chay: number; tia: number; kim: number; denChay: number; banXanh: number; cot: number; can: number; ben: number; donat: number; napDx?: number; rubbleDx?: number};
const PdMay: React.FC<PdMayProps> = ({f, cua, khoa, sang, mau, wave, ang, chay, tia, kim, denChay, banXanh, cot, can, ben, donat, napDx = 0, rubbleDx = 0}) => {
  const rub = donat > 0.02, H = 2.4, capTop = 0.185 + 0.14 + H + 0.265 + 0.07, B0 = HAM_MARKS.benTron;
  return (
    <>
      <group position={[6.2, 0, -4.1]} rotation={rub ? [0, 0.12, 0.15] : [0, 0, 0]}>
        <ControlDesk pos={[0, 0, 0]} can={rub ? 1 : can} f={f} on={rub ? 0.2 : 0.8} />
        {rub ? null : <DenBan pos={[0, 0, 0]} f={f} chay={denChay} xanh={banXanh} />}
      </group>
      <Pedestal pos={B0} on={rub ? 0 : ben} f={f} />
      {rub ? <BuongVo pos={HAM_MARKS.buong} f={f} napO={napDx ? [-1.35, 0.45, -1.0] : undefined} /> : <BuongKinh pos={HAM_MARKS.buong} f={f} cua={cua} khoa={khoa} sang={sang} mau={mau} wave={wave} h={H} />}
      {rub ? <group position={[B0[0] + 1.9 + napDx, 0.62, B0[2] + 0.9]} rotation={[0.25, 0.5, -1.3]}><AngTen pos={[0, 0, 0]} f={f} ang={0} mau="tim" nghieng={0.4} /></group> : <AngTen pos={[B0[0], capTop, B0[2]]} f={f} ang={ang} mau={mau === 'xanh' ? 'xanh' : 'tim'} chay={chay} tia={tia} />}
      {cot > 0.01 && !rub ? <CotSangXanh pos={[B0[0], 0.3, B0[2]]} cao={8.6} r={0.9} k={cot} f={f} mau="xanh" /> : null}
      {rub ? null : <NumVan pos={HAM_MARKS.num} kim={kim} tich={0} />}
      <ManHinhPhu pos={HAM_MARKS.phu} f={f} w={1.1} h={0.8} on={rub ? 0.12 : 1} />
      {rub ? <>
        <B p={[-2.2, 4.4, -9.8]} s={[0.5, 9.2, 0.4]} c="#4a545c" r={[0, 0, 0.42]} /><B p={[-2.2, 4.4, -9.78]} s={[0.52, 9.0, 0.06]} c="#c9a02c" r={[0, 0, 0.42]} cast={false} />
        <Pipe a={[-0.8, 8.8, -3.6]} b={[0.7, 5.9, -3.3]} r={0.16} c="#8a7a56" />
        <Pipe a={[2.6, 8.6, -7.6]} b={[2.9, 6.6, -7.4]} r={0.12} c="#6a7a88" />
        <Rubble pos={[3.6 + rubbleDx, 0, -6.4]} area={[6, 2.6]} n={12} seed={5} colors={['#59646c', '#6a747c', '#4a545c', '#8a949c']} />
        <Rubble pos={[-2 + rubbleDx * 1.6, 0, -8 - rubbleDx * 0.2]} area={rubbleDx ? [3.2, 2.2] : [6, 4]} n={9} seed={9} colors={['#59646c', '#6a747c', '#4a545c', '#8a949c']} />
        <Shards pos={[3.4, 0, -4.8]} area={[5.5, 4]} n={44} seed={4} />
        <SmokeDrift f={f} box={[2.2, 5.0, 0.3, 3.2, -6.6, -5.2]} n={4} color="#6a6460" opacity={0.25} size={1.1} wind={0.1} seed={3} />
        <pointLight position={[3, 3.5, -4]} color="#ff3a2a" intensity={Math.sin(f * 0.35) > 0.1 ? 16 : 1.5} distance={9} decay={1.4} />
        <B p={[-3.3, 6.0, -3.5]} s={[0.3, 0.12, 0.3]} c={Math.sin(f * 0.35) > 0.1 ? '#ff5a3a' : '#5a2a22'} cast={false} />{Math.sin(f * 0.35) > 0.1 ? <Halo pos={[-3.3, 5.9, -3.3]} r={1.1} color="#ff4a2a" strength={0.55} /> : null}
      </> : null}
    </>
  );
};

export type HamMayProps = {children?: React.ReactNode; f?: number; dx?: number; dz?: number; eye?: V3; state?: HamState; hang?: number; hangDau?: boolean; banVe?: number; can?: number; ben?: number; kep?: number; hut?: number;
  manHinh?: number; hanAt?: number[]; ong?: boolean; ongWave?: number; gia?: boolean; xoay?: number; mo?: number; extra?: React.ReactNode;
  /** chỉ trạng thái 'phao-dai' (24/11/2026), xem chú thích của HamState */
  cua?: number; khoa?: number; sangBuong?: number; mauMay?: MauMay; ang?: number; chay?: number; tia?: number; kim?: number; denChay?: number; banXanh?: number; cot?: number; donat?: number; napDx?: number; rubbleDx?: number};
export const HamMayDoom: React.FC<HamMayProps> = ({children, f = 0, dx, dz, eye = HAM_VIEWS.toan, state = 'xuong', hang, hangDau, banVe = 0, can = 0, ben, kep = 0, hut = 0, manHinh, hanAt = [], ong, ongWave = 0, gia, xoay, mo = 1, extra, cua = 1, khoa = 3, sangBuong = 0.45, mauMay = 'xanh', ang = 0, chay = 0, tia = 0, kim = 0, denChay = 0, banXanh = 0, cot = 0, donat = 0, napDx = 0, rubbleDx = 0}) => { datNoiBui('trong-nha', 'xanh');
  const tg = state === 'may-thoi-gian', hutS = state === 'may-hut', pd = state === 'phao-dai', dim = hutS;
  const rows = hang ?? (state === 'xuong' ? 8 : 0), benOn = ben ?? (tg ? 0.6 : 0), man = manHinh ?? (hutS ? 1 : 0), showTube = ong ?? tg;
  const floor = useMemo(() => pd ? tex('hm-floor-pd', 2000, 2400, (c, W, H) => paintFloor(c, W, H, true)) : tex('hm-floor', 2000, 2400, paintFloor), [pd]);
  const wall = {tones: ['#566474', '#4e5c6c', '#5c6a7a', '#48566a', '#62707e'], mortar: '#283240', course: [0.34, 0.5] as [number, number], len: [0.6, 1.3] as [number, number], damp: 0.3, streaks: 1};
  return (
    <GradeCtx.Provider value="darkInterior">
      <StageCam eye={eye} haze="#1a2230" fog={[40, 900]} dx={dx} dz={dz} />
      <hemisphereLight args={dim ? ['#a8c0d8', '#566272', 2.8] : ['#c4d8ea', '#707c88', 3.4]} />
      <Sun from={[-7, 12, 9]} to={[0, 0, -6]} intensity={dim ? 2.2 : 3.4} color="#f2f6ff" />
      <pointLight position={[0, 5.5, -3]} color="#fff0d8" intensity={dim ? 14 : 26} distance={26} decay={1.1} />
      <pointLight position={[-4, 3.2, -3.5]} color="#ffd8a8" intensity={dim ? 3 : 6} distance={9} decay={1.3} />
      {pd ? <pointLight position={[0, 5.2, -17.5]} color="#d8e8ff" intensity={donat > 0 ? 9 : 7} distance={16} decay={1.2} /> : null}
      {/* shell */}
      <mesh position={[0, 0, -9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 24]} /><meshLambertMaterial map={floor} /></mesh>
      {pd ? <PdWallBack wall={wall} f={f} broken={donat} /> : <StoneBox id="hm-wall-back" p={[0, 4.5, -21.3]} s={[20.6, 9, 0.6]} look={{...wall, seed: 5}} />}<StoneBox id="hm-wall-left" p={[-10.3, 4.5, -9]} s={[0.6, 9, 24]} look={{...wall, seed: 9}} /><StoneBox id="hm-wall-right" p={[10.3, 4.5, -9]} s={[0.6, 9, 24]} look={{...wall, seed: 13}} />
      <mesh position={[0, 9, -9]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[20, 24]} /><meshLambertMaterial color="#1c232c" /></mesh>
      {[-2, -6, -10, -14, -18].map((z) => <group key={z}><B p={[0, 8.7, z]} s={[20.2, 0.5, 0.4]} c="#34404c" /><B p={[0, 8.38, z]} s={[20.2, 0.12, 0.6]} c="#c9a02c" cast={false} /></group>)}
      {pd ? <>
        {[-6.5, 0, 6.5].map((x) => <B key={x} p={[x, 2.2, -20.8]} s={[2.6, 4.4, 0.4]} c="#3a4654" />)}
        {[-6.5, 0, 6.5].map((x) => <MaskPlate key={x} pos={[x, 2.5, -20.55]} w={2.3} glow={1} />)}
        {[-3.25, 3.25].map((x) => <B key={x} p={[x, 2.2, -20.7]} s={[0.4, 4.4, 0.4]} c="#3a4654" />)}
      </> : <>
      {[-6.5, 0, 6.5].map((x) => <B key={x} p={[x, 4.5, -20.8]} s={[2.6, 8.4, 0.4]} c="#3a4654" />)}
      {[-6.5, 0, 6.5].map((x) => <MaskPlate key={x} pos={[x, 5.0, -20.55]} w={2.3} glow={dim ? 0.7 : 1} />)}
      {[-3.25, 3.25].map((x) => <B key={x} p={[x, 6.2, -20.7]} s={[0.4, 5.2, 0.4]} c="#3a4654" />)}
      <Gear pos={[-3.25, 7.6, -20.5]} r={1.0} teeth={14} f={f} dir={1} /><Gear pos={[3.25, 7.2, -20.5]} r={1.3} teeth={18} f={f} dir={-1} body="#7a8a96" seed={3} />
      </>}
      <Gear pos={[-9.9, 5.6, -6.2]} r={1.4} teeth={16} f={f} dir={1} body="#7a8a96" seed={2} /><Gear pos={[-9.9, 3.6, -13]} r={0.9} teeth={12} f={f} dir={-1} />
      <Gear pos={[9.9, 6.4, -9]} r={1.5} teeth={18} f={f} dir={-1} body="#8a7a56" seed={4} /><Gear pos={[9.9, 4.2, -16.4]} r={0.8} teeth={10} f={f} dir={1} />
      {/* pipes along both walls and across the ceiling, valves */}
      <Pipe a={[-9.7, 3.0, 2.5]} b={[-9.7, 3.0, -20.8]} r={0.22} c="#8a7a56" /><Pipe a={[-9.5, 4.1, 2.5]} b={[-9.5, 4.1, -20.8]} r={0.14} c="#6a7a88" /><Pipe a={[-9.7, 3.0, -2.2]} b={[-9.7, 8.8, -2.2]} r={0.2} c="#8a7a56" />
      <Pipe a={[9.7, 3.4, 2.5]} b={[9.7, 3.4, -20.8]} r={0.24} c="#6a7a88" /><Pipe a={[9.5, 4.7, 2.5]} b={[9.5, 4.7, -20.8]} r={0.14} c="#8a7a56" /><Pipe a={[9.7, 3.4, -7.2]} b={[9.7, 8.8, -7.2]} r={0.22} c="#6a7a88" />
      <Pipe a={[-9.8, 8.3, -4]} b={[9.8, 8.3, -4]} r={0.2} c="#6a7a88" /><Pipe a={[-9.8, 8.0, -13]} b={[9.8, 8.0, -13]} r={0.26} c="#8a7a56" /><Pipe a={[-9.8, 7.7, -19]} b={[9.8, 7.7, -19]} r={0.14} c="#6a7a88" />
      {[[-9.4, 3.0, -4.6], [-9.4, 3.0, -14.6], [9.4, 3.4, -4.6], [9.4, 3.4, -14.6]].map(([x, y, z], i) => <group key={i} position={[x, y + 0.45, z]}><B p={[0, -0.22, 0]} s={[0.1, 0.4, 0.1]} c="#59646c" /><B p={[0, 0, 0]} s={[0.5, 0.08, 0.08]} c="#c8402a" /><B p={[0, 0, 0]} s={[0.08, 0.5, 0.08]} c="#c8402a" /></group>)}
      {/* the left side: the blueprint partition, the rack, the bench; tanks; a bench along the wall */}
      <group position={[-9.9, 0, -7.4]}><Partition length={7.5} lit={banVe} /></group>
      {gia ?? state === 'xuong' ? <AssemblyRack pos={[-3.7, 0, -5.2]} f={f} /> : null}
      <Bench pos={[-7.4, 0, -6.3]} len={3.4} /><Bench pos={[-9.2, 0, -8.8]} len={3.0} rotY={Math.PI / 2} />
      <Tank pos={[-9.0, 0, -20.1]} r={0.8} h={3.6} f={f} seed={1} glow={dim ? 0.8 : 1} /><Tank pos={[-7.0, 0, -20.1]} r={0.7} h={2.8} f={f + 11} seed={2} light={false} glow={dim ? 0.8 : 1} /><Tank pos={[-5.5, 0, -20.1]} r={0.6} h={2.2} f={f + 23} seed={3} light={false} glow={dim ? 0.8 : 1} />
      {pd ? null : <><ScrapHeap pos={HAM_MARKS.dongPhe} f={f} />
      {/* the chute high on the back wall over the heap */}
      <B p={[-8.6, 6.3, -20.95]} s={[1.9, 1.3, 0.1]} c="#0b0e12" /><mesh position={[-8.6, 5.4, -19.6]} rotation={[0.62, 0, 0]} castShadow><boxGeometry args={[1.6, 0.1, 3.3]} /><meshLambertMaterial color="#6a747c" flatShading /></mesh>{[-0.8, 0.8].map((s) => <mesh key={s} position={[-8.6 + s, 5.62, -19.6]} rotation={[0.62, 0, 0]}><boxGeometry args={[0.1, 0.34, 3.3]} /><meshLambertMaterial color="#59646c" flatShading /></mesh>)}</>}
      {/* the right side: the furnace, the pipe bank, the desk, the platform and its machine */}
      <Furnace pos={[7.6, 0, -12.5]} f={f} />
      <Embers f={f} box={[6.6, 8.6, 2.6, 7.4, -12.4, -12.0]} n={pd ? 5 : 14} size={0.03} life={80} seed={5} color="#ffb24a" />
      {[6.3, 6.75, 7.2, 7.65, 8.1].map((x, i) => <Pipe key={x} a={[x, 0, -6.6]} b={[x, 4.6 + (i % 2) * 0.5, -6.6]} r={0.2} c={['#8a7a56', '#6a7a88'][i % 2]} />)}
      <Pipe a={[6.3, 3.6, -6.6]} b={[8.1, 3.6, -6.6]} r={0.12} c="#c9a02c" flange={false} /><Pipe a={[8.1, 4.6, -6.6]} b={[9.8, 4.6, -7.6]} r={0.16} c="#6a7a88" />
      {tg || hutS ? <>
        <ControlDesk pos={[6.2, 0, -4.1]} can={can} f={f} on={dim ? 0.8 : 0.5} />
        <Pedestal pos={HAM_MARKS.benTron} on={benOn} f={f} />
        {hutS ? <HutMachine pos={HAM_MARKS.benTron} kep={kep} on={hut} f={f} ring={[1.65, 3.0, 1.0]} /> : <TimeGate pos={HAM_MARKS.benTron} f={f} xoay={xoay} mo={mo} on={Math.max(0.5, benOn)} />}
        {hutS ? <B p={[5.05, 6.0, -5.0]} s={[0.06, 6, 0.06]} c="#2d3238" /> : null}
      </> : null}
      {showTube ? <GlassTube pos={HAM_MARKS.ong} f={f} wave={ongWave} /> : null}
      {pd ? <PdMay f={f} cua={cua} khoa={khoa} sang={sangBuong} mau={mauMay} wave={ongWave} ang={ang} chay={chay} tia={tia} kim={kim} denChay={denChay} banXanh={banXanh} cot={cot} can={can} ben={benOn} donat={donat} napDx={napDx} rubbleDx={rubbleDx} /> : null}
      {pd ? <>{[[-3.3, -3.5], [3.3, -3.5], [-3.3, -9.5], [0, -9.5], [3.3, -9.5], [0, -3.5]].map(([x, z]) => <WorkLamp key={`${x}${z}`} pos={[x, 6.1, z]} on={1} w={0.8} color="#e6f4ff" />)}</> : null}
      {/* the rows of robots under their work lamps, the crane over them, the cable trench, a screen */}
      {pd ? null : <RobotRows x={ROW_X} z0={ROW_Z0} dz={0.9} rows={8} lit={rows} skipFirst={hangDau} />}
      {pd ? null : Array.from({length: 8}, (_, r) => [-3.3, 0, 3.3].map((x) => <WorkLamp key={`${r}${x}`} pos={[x, 6.1, ROW_Z0 - r * 0.9]} on={Math.max(0, Math.min(1, rows - r + 0.2))} w={0.8} color={rows > r ? '#e6f4ff' : '#9aa4b0'} />))}
      {pd ? null : <Crane y={7.4} z={-11} span={20} x={2.4} hook={4.6} len={10} />}
      {hutS || (pd && man > 0) ? <RoundScreen pos={HAM_MARKS.manHinh} d={2.4} f={f} on={man} /> : null}
      <Monitor pos={[-9.7, 2.2, -3.2]} w={1.1} h={0.8} kind="radar" seed={7} rotY={Math.PI / 2} glow={dim ? 1 : 0.8} /><Monitor pos={[-9.7, 2.2, -7.6]} w={1.1} h={0.8} kind="lines" seed={8} rotY={Math.PI / 2} glow={dim ? 1 : 0.8} />
      {/* welding sparks at the rack */}
      {hanAt.map((a, i) => <React.Fragment key={i}><SparkBurst f={f} at={a} pos={[-3.7, 1.3, -4.8]} n={22} speed={1.5} seed={i + 3} />{f >= a && f < a + 4 ? <Halo pos={[-3.7, 1.3, -4.6]} r={1.1} color="#fff0c0" strength={0.7} /> : null}</React.Fragment>)}
      {/* the air: dust in the lamps, sparks over the rack and the furnace, cold specks over the rows, steam from the pipes */}
      <DriftSpecks f={f} box={[-9, 9, 0.4, 6, -19, 1]} n={pd ? 22 : 70} color="#e8f2ff" size={0.012} wind={[0.05, 0.03]} glow={0.2} seed={11} />
      <AirLayer f={f} box={[-8, 8, 0.4, 5.5, -19, -3]} n={pd ? 18 : 70} color={['#e8f2ff', '#cfe4ff', '#ffe6c0']} size={0.05} life={150} wind={[0.05, 0.02]} opacity={0.7} seed={21} />
      {pd ? null : <Embers f={f} box={[-4.3, -3.1, 0.8, 2.2, -5.0, -4.8]} n={12} size={0.03} life={50} seed={3} color="#ffc060" />}
      {pd ? null : <AirLayer f={f} box={[-5, 5, 0.6, 3.2, -19, -11.5]} n={30} color={['#9fe8ff', '#e8f8ff']} size={0.03} life={90} wind={[0.02, 0.01]} wob={0.2} opacity={0.9} seed={31} add blink />}
      {pd ? null : <AirLayer f={f} box={[-9.5, -4.5, 0.6, 3.6, -20.4, -15]} n={20} color={['#8af0b8', '#c8ffe0']} size={0.04} life={110} wind={[0.01, 0.12]} opacity={0.8} seed={41} add blink />}
      {extra}
      {children}
    </GradeCtx.Provider>
  );
};

// ---------------------------------------------------------------- stills (no people)
type O = Partial<HamMayProps>;
const mk = (view: keyof typeof HAM_VIEWS, o: O = {}, frame = 12): React.FC => () => {
  const f = useCurrentFrame() + frame, eye = HAM_VIEWS[view];
  return <Shot grade="darkInterior" eye={eye} finish={{warm: ''}} figures={null} set={(inside, cam) => <HamMayDoom eye={eye} dx={cam.dx} dz={cam.dz} f={f} {...o}>{inside}</HamMayDoom>} />;
};
const mkKho = (): React.FC => () => {
  const f = useCurrentFrame() + 12, eye: V3 = [3.0, 1.2, -1.0];
  return <Shot grade="darkInterior" eye={eye} finish={{warm: ''}} figures={null} set={(inside, cam) => <HamMayDoom eye={eye} dx={cam.dx} dz={cam.dz} f={f} state="may-thoi-gian" ben={1}><Treasure pos={[3.0, 0.0, -3.6]} s={1.5} f={f} />{inside}</HamMayDoom>} />;
};
const STILLS: [string, React.FC][] = [
  ['hm-pd-man', mk('man', {state: 'phao-dai', manHinh: 1})], ['hm-pd-nhot', mk('pdNhot', {state: 'phao-dai', cua: 1, khoa: 3, sangBuong: 0.5})], ['hm-pd-angten', mk('pdAngTen', {state: 'phao-dai', ang: 2, chay: 1, mauMay: 'tim', sangBuong: 0.6})],
  ['hm-pd-num', mk('pdNum', {state: 'phao-dai', kim: 0.5})], ['hm-pd-gat', mk('pdGat', {state: 'phao-dai', can: 0.6, denChay: 0.6, banXanh: 0.6, kim: 1, mauMay: 'xanh'})], ['hm-pd-rong', mk('pdRong', {state: 'phao-dai', cot: 1, ang: 3, chay: 1, tia: 1, sangBuong: 0.8})],
  ['hm-pd-bao', mk('pdBao', {state: 'phao-dai'})], ['hm-pd-cho', mk('pdCho', {state: 'phao-dai', sangBuong: 0.7})], ['hm-pd-donat', mk('pdPha', {state: 'phao-dai', donat: 1})], ['hm-pd-toan', mk('toan', {state: 'phao-dai'})],
  ['hm-xuong-lap', mk('lap', {hang: 0, hanAt: [12]})], ['hm-xuong-doc', mk('doc', {hang: 4, hangDau: true})], ['hm-xuong-phe', mk('phe')], ['hm-xuong-quan', mk('quan')], ['hm-xuong-toan', mk('toan')],
  ['hm-tg-toan', mk('toan', {state: 'may-thoi-gian'})], ['hm-tg-ben', mk('ben', {state: 'may-thoi-gian', ben: 1})], ['hm-tg-ve', mk('ve', {state: 'may-thoi-gian', banVe: 2.5})], ['hm-tg-can', mk('can', {state: 'may-thoi-gian', can: 1, ben: 1})], ['hm-tg-cong', mk('toan', {state: 'may-thoi-gian', ben: 1})], ['hm-tg-cong-gan', mk('ben', {state: 'may-thoi-gian', ben: 1})], ['hm-kho-bau', mkKho()],
  ['hm-hut-man', mk('man', {state: 'may-hut'})], ['hm-hut-hut', mk('can', {state: 'may-hut', can: 1, kep: 1, hut: 0.8})], ['hm-hut-xem', mk('xem', {state: 'may-hut', hang: 8})],
];
export const HamMayDoomComps: React.FC = () => <>{STILLS.map(([id, C]) => <Composition key={id} id={id} component={C} width={1280} height={720} fps={24} durationInFrames={48} />)}</>;
void FLOOR_PLAN; void RobotSprite; void THREE;
