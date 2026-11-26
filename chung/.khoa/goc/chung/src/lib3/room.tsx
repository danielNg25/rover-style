import React, {useMemo, useContext, createContext} from 'react';
import * as THREE from 'three';
import {FacetLathe, tuPhiaMay} from './look';
import {Sprite, rnd, Ctx, paintSchoolbag, paintPotPlant, paintBouquet} from './depth';
import {B} from './kit';
import {noiBuiHienTai} from './mauBui';
import {NguonBui} from './buiNguon';

/** lib3/room: pieces for INTERIORS (see section 7b of CACH-DUNG-CANH-XEP-LOP.md). A room is a real box of walls so that it
 *  shades itself; it is looked at diagonally by turning the whole room (the camera never turns); the morning sun is a light
 *  set in room space that comes in through the window openings. */
type V3 = [number, number, number];
/** How far the room is turned (radians about the vertical). Free-standing flat pictures inside it turn back to face the lens. */
export const RoomCtx = createContext(0);

export const canvasTex = (w: number, h: number, paint: (c: Ctx) => void) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d')!); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
export const once = <T,>(f: () => T) => { let v: T | null = null; return () => (v ??= f()); };
export const bookTex = once(() => canvasTex(256, 160, (c) => {
  c.fillStyle = '#f4f0e2'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#e2dccb'; c.fillRect(124, 0, 8, 160);
  c.fillStyle = 'rgba(70,90,140,0.55)'; for (let y = 24; y < 150; y += 16) { c.fillRect(14, y, 96 - ((y * 7) % 30), 3); c.fillRect(146, y, 96 - ((y * 11) % 34), 3); }
  c.fillStyle = '#d9785a'; c.fillRect(150, 20, 60, 30);
}));
export const deskTex = once(() => canvasTex(512, 160, (c) => {
  // two boards with grain, a carved name, an ink spot (wood colour comes from the material)
  const r = rnd(17); c.fillStyle = '#f0f0f0'; c.fillRect(0, 0, 512, 160); c.fillStyle = '#d8d8d8'; c.fillRect(0, 78, 512, 4);
  for (let k = 0; k < 22; k++) { c.strokeStyle = `rgba(90,70,50,${0.12 + r() * 0.14})`; c.lineWidth = 1.5 + r() * 2; const y = r() * 160, x0 = r() * 300; c.beginPath(); c.moveTo(x0, y); c.bezierCurveTo(x0 + 60, y + (r() - 0.5) * 8, x0 + 140, y + (r() - 0.5) * 8, x0 + 120 + r() * 200, y + (r() - 0.5) * 6); c.stroke(); }
  c.fillStyle = 'rgba(40,50,110,0.45)'; c.beginPath(); c.ellipse(380, 40, 10, 6, 0.4, 0, 7); c.fill();
  c.strokeStyle = 'rgba(70,50,35,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(90, 120); c.lineTo(104, 104); c.lineTo(112, 124); c.moveTo(122, 104); c.lineTo(122, 124); c.lineTo(136, 124); c.stroke();
}));
/** a free-standing flat picture inside the turned room, turned back to face the lens */
export const Spr: React.FC<React.ComponentProps<typeof Sprite>> = (p) => { const yaw = useContext(RoomCtx); return <group position={p.pos}><group rotation={[0, -yaw, 0]}><Sprite {...p} pos={[0, 0, 0]} /></group></group>; };
/** The sun, placed in room space so it keeps its direction when the room is turned: it comes in over the yard through the
 *  window wall, low (about 22 degrees) and slanting 35 degrees towards the board (steeper than that and each window only lets a sliver through), so its patches fall across the floor, the platform and
 *  the front wall. The room's own walls and ceiling shade the rest. */
/** bui (mặc định true): nắng tự đăng ký nguồn bụi 'nang' (lib3/buiNguon): bụi be chỉ trong khối nắng. */
/** Độ mềm mép bóng của nắng do `autoReceive` (kit.tsx) đặt lại theo MEP_BONG_CM (6 cm); `radius` ghi dưới đây chỉ là giá trị khởi đầu. */
/** nguocSang: khai khi nắng CỐ Ý đến từ phía sau sân khấu vì khung hình có nguồn sáng ở đó (cửa sổ tường sau, mặt trời thấp sau lưng): bóng sẽ đổ về
 *  phía máy. Không khai mà đặt nắng phía sau thì `kiem_bong.py` báo LOI `bong-ve-may` (Daniel 25/11/2026: bóng phải đổ ra sau). */
export const Sun: React.FC<{from: V3; to: V3; intensity: number; color: string; bui?: boolean; nguocSang?: boolean}> = ({from, to, intensity, color, bui = true, nguocSang}) => {
  const light = useMemo(() => { const l = new THREE.DirectionalLight(color, intensity); l.castShadow = true; l.shadow.mapSize.set(4096, 4096); l.shadow.radius = 1.1; l.shadow.blurSamples = 8; l.shadow.bias = -0.0005; l.shadow.normalBias = 0.02; const c = l.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 80; c.updateProjectionMatrix(); return l; }, []);
  light.userData.nguocSang = !!nguocSang;
  // NGOÀI TRỜI (bối cảnh đã gọi datNoiBui với nơi khác 'trong-nha'): hướng nắng bị kéo vào KHUNG_BONG (look.tsx `tuPhiaMay`): nắng từ phía máy để bóng
  // ngả ra sau, bóng không dài quá, không lệch ngang quá (Daniel 25/11/2026). Trong nhà KHÔNG đụng: nắng phải đi qua đúng ô cửa; đặt nắng phía sau thì
  // kiem_bong.py báo LOI `bong-ve-may`.
  const yaw = useContext(RoomCtx), noi = noiBuiHienTai();
  if (!nguocSang && noi.daDat && noi.noi !== 'trong-nha') {
    const dx = from[0] - to[0], dz = from[2] - to[2], c = Math.cos(yaw), s = Math.sin(yaw);
    const w = tuPhiaMay([dx * c + dz * s, from[1] - to[1], -dx * s + dz * c]);   // đổi sang hệ của máy (phòng xoay yaw quanh trục đứng), kéo vào khung
    from = [to[0] + w[0] * c - w[2] * s, to[1] + w[1], to[2] + w[0] * s + w[2] * c];
  }
  return <><primitive object={light} position={from} /><primitive object={light.target} position={to} />{bui ? <NguonBui kieu="nang" tu={from} toi={to} mau={color} k={Math.min(1.2, Math.max(0.5, intensity / 4.5))} /> : null}</>;
};
/** The wall with the windows, along the room's left side (x = 0, z from 0 to `length`): piers between the openings, a sill and
 *  frame at each, a thin iron grille, the louvred leaves folded back outside. windows = [from, to] along z for each opening.
 *  children = things that belong to this wall (a pot on a sill, papers between two windows). */
export const WindowWall: React.FC<{length: number; height: number; sill: number; head: number; windows: [number, number][]; wall: string; dado: string; children?: React.ReactNode}> = ({length, height, sill, head, windows, wall, dado, children}) => {
  const piers: [number, number][] = []; let z = 0; windows.forEach(([a, b]) => { piers.push([z, a]); z = b; }); piers.push([z, length]);
  return (
    <group>
      <B p={[-0.15, sill / 2, length / 2]} s={[0.3, sill, length]} c={dado} /><B p={[-0.15, (head + height) / 2, length / 2]} s={[0.3, height - head, length]} c={wall} />
      {piers.map(([a, b]) => <B key={a} p={[-0.15, (sill + head) / 2, (a + b) / 2]} s={[0.3, head - sill, b - a]} c={wall} />)}
      <B p={[0.004, sill, length / 2]} s={[0.012, 0.05, length]} c="#5f8574" cast={false} />
      {windows.map(([a, b], i) => <group key={a}>
        {/* frame, sill, iron grille, two louvered leaves opened back into the room */}
        <B p={[-0.02, sill - 0.02, (a + b) / 2]} s={[0.4, 0.06, b - a + 0.1]} c="#d9cdb0" />
        {[a + 0.03, b - 0.03].map((zz) => <B key={zz} p={[-0.06, (sill + head) / 2, zz]} s={[0.12, head - sill, 0.06]} c="#4f7d6c" />)}<B p={[-0.06, head - 0.03, (a + b) / 2]} s={[0.12, 0.06, b - a]} c="#4f7d6c" />
        {Array.from({length: 4}, (_, k) => <B key={k} p={[-0.2, (sill + head) / 2, a + ((k + 1) * (b - a)) / 5]} s={[0.024, head - sill, 0.024]} c="#3b4442" cast />)}<B p={[-0.2, 1.85, (a + b) / 2]} s={[0.025, 0.025, b - a]} c="#3b4442" />
        {/* the louvred leaves, folded back flat against the wall outside: seen edge-on through the opening */}
        {[a - 0.02, b + 0.02].map((zz) => <B key={`o${zz}`} p={[-0.36, (sill + head) / 2, zz]} s={[0.1, head - sill, 0.05]} c="#5f8f7c" cast={false} />)}
      </group>)}
      {children}
    </group>
  );
};
export const Cabinet: React.FC<{pos: V3}> = ({pos}) => {
  const books = useMemo(() => { const r = rnd(21), out: [number, number, number, string][] = []; [0.42, 0.98, 1.5].forEach((y) => { for (let x = -0.62; x < 0.6;) { const w = 0.04 + r() * 0.05, h = 0.26 + r() * 0.16; out.push([x + w / 2, y, h, ['#c8463c', '#3f6a8a', '#e1b84a', '#5a8f5a', '#efe6cf', '#8a5a3a'][Math.floor(r() * 6)]]); x += w + 0.008 + (r() < 0.1 ? 0.12 : 0); } }); return out; }, []);
  return (
    <group position={pos}>
      <B p={[0, 1.0, -0.21]} s={[1.4, 2.0, 0.04]} c="#4e3a2a" />{[-0.68, 0.68].map((x) => <B key={x} p={[x, 1.0, 0]} s={[0.04, 2.0, 0.46]} c="#9a7450" />)}<B p={[0, 0.07, 0]} s={[1.4, 0.14, 0.46]} c="#7a5a3c" />
      {[0.38, 0.94, 1.46].map((y) => <B key={y} p={[0, y, 0.05]} s={[1.3, 0.03, 0.36]} c="#b08a60" cast={false} />)}
      {books.map(([x, y, h, col], i) => <B key={i} p={[x, y + 0.016 + h / 2, 0.08]} s={[0.045, h, 0.26]} c={col} cast={false} />)}
      {[-0.33, 0.33].map((x) => <group key={x} position={[x, 1.04, 0.235]}>{[[0, 0.88, 0.62, 0.05], [0, -0.88, 0.62, 0.05], [-0.29, 0, 0.04, 1.8], [0.29, 0, 0.04, 1.8], [0, 0.3, 0.6, 0.03], [0, -0.26, 0.6, 0.03]].map(([fx, fy, fw, fh], k) => <B key={k} p={[fx, fy, 0]} s={[fw, fh, 0.03]} c="#7a5a3c" cast={false} />)}<mesh position={[0, 0, 0.02]}><planeGeometry args={[0.5, 1.66]} /><meshLambertMaterial color="#cfe0e6" transparent opacity={0.22} /></mesh><B p={[x < 0 ? 0.25 : -0.25, 0, 0.03]} s={[0.03, 0.12, 0.03]} c="#d8c27a" cast={false} /></group>)}
      <B p={[0, 2.03, 0]} s={[1.48, 0.06, 0.52]} c="#7a5a3c" />
      <B p={[0.3, 2.16, 0.02]} s={[0.46, 0.2, 0.32]} c="#c9b48c" /><B p={[0.3, 2.27, 0.02]} s={[0.48, 0.02, 0.34]} c="#b09c74" cast={false} />
      <Spr name="cabpot" art={(c, W, H) => paintPotPlant(c, W, H, 8)} px={[220, 260]} w={0.46} pos={[-0.36, 2.06, 0.05]} shade={0.2} />
    </group>
  );
};
export const TeacherDesk: React.FC<{pos: V3}> = ({pos}) => (
  <group position={pos} rotation={[0, 0.06, 0]}>
    <B p={[0, 0.76, 0]} s={[1.36, 0.05, 0.68]} c="#b48a5e" />
    <B p={[0, 0.4, 0.31]} s={[1.3, 0.68, 0.03]} c="#8f6a46" /><B p={[0, 0.4, 0.33]} s={[1.1, 0.5, 0.02]} c="#a27a52" cast={false} />
    {[-0.64, 0.64].map((x) => <B key={x} p={[x, 0.37, 0]} s={[0.05, 0.74, 0.64]} c="#7a5a3c" />)}
    {/* the bouquets left over from Teachers' Day, a pile of exercise books, the class register, a chalk box */}
    <FacetLathe profile={[[0.07, 0], [0.1, 0.06], [0.1, 0.2], [0.06, 0.26], [0.075, 0.3]]} sides={9} color="#4f8aa8" pos={[-0.42, 0.785, 0.02]} contact={false} tones={[0.86, 1, 1.12, 1]} />
    <Spr name="bouquet1" art={(c, W, H) => paintBouquet(c, W, H)} px={[260, 300]} w={0.5} pos={[-0.42, 1.03, 0.02]} shade={0} cast={false} />
    <B p={[-0.05, 0.86, 0.12]} s={[0.5, 0.16, 0.3]} c="#ece6d4" r={[0, 0.12, 0]} />{[0.8, 0.84, 0.88, 0.92].map((y, i) => <B key={y} p={[-0.05, y, 0.12]} s={[0.505, 0.008, 0.305]} c={['#5a8fc0', '#e2a04a', '#5a8f5a', '#d05a5a'][i]} r={[0, 0.12 + i * 0.05, 0]} cast={false} />)}
    <B p={[0.38, 0.795, 0.12]} s={[0.36, 0.025, 0.26]} c="#2f4f7a" r={[0, -0.15, 0]} /><mesh position={[0.38, 0.81, 0.12]} rotation={[-Math.PI / 2, 0, 0.15]}><planeGeometry args={[0.32, 0.22]} /><meshLambertMaterial map={bookTex()} /></mesh>
    <B p={[0.5, 0.81, -0.18]} s={[0.12, 0.06, 0.08]} c="#f0ead8" />
    {/* the teacher's chair behind */}
    <group position={[0.15, 0, -0.62]}><B p={[0, 0.45, 0]} s={[0.44, 0.04, 0.42]} c="#8a6644" />{[-0.19, 0.19].map((x) => [-0.18, 0.18].map((z) => <B key={`${x}${z}`} p={[x, 0.22, z]} s={[0.04, 0.45, 0.04]} c="#6e5034" />))}<B p={[0, 0.78, -0.2]} s={[0.44, 0.32, 0.03]} c="#8a6644" /></group>
  </group>
);
/** A pupils' double desk with its bench, from behind: top, shelf with a dark slot, front board, legs; things on and under it. */
export const Desk: React.FC<{pos: V3; seed: number; wood?: string}> = ({pos, seed, wood = '#b0865a'}) => {
  const r = rnd(seed), rot = (r() - 0.5) * 0.06, dx = (r() - 0.5) * 0.08, pick = Array.from({length: 6}, () => r());
  const dark = '#' + new THREE.Color(wood).multiplyScalar(0.7).getHexString();
  const bags = ['#3f6aa8', '#c0483c', '#e0a43a', '#5a8f5a', '#8a5aa0'];
  return (
    <group position={[pos[0] + dx, 0, pos[2]]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.04, 0.46]} /><meshLambertMaterial color={wood} map={deskTex()} /></mesh><B p={[0, 0.7, 0.232]} s={[1.5, 0.02, 0.01]} c="#d0aa7a" cast={false} />
      <B p={[0, 0.52, -0.21]} s={[1.46, 0.36, 0.025]} c={dark} /><B p={[0, 0.55, 0]} s={[1.46, 0.02, 0.4]} c={dark} cast={false} />
      <B p={[0, 0.63, 0.02]} s={[1.42, 0.13, 0.36]} c="#3a2b20" cast={false} />
      {[-0.72, 0.72].map((x) => <B key={x} p={[x, 0.36, 0]} s={[0.04, 0.72, 0.42]} c={dark} />)}<B p={[0, 0.1, 0]} s={[1.44, 0.04, 0.04]} c={dark} cast={false} />
      {/* bench */}
      <B p={[0, 0.42, 0.52]} s={[1.44, 0.04, 0.26]} c={wood} />{[-0.66, 0.66].map((x) => <B key={x} p={[x, 0.2, 0.52]} s={[0.04, 0.4, 0.22]} c={dark} />)}<B p={[0, 0.1, 0.52]} s={[1.32, 0.03, 0.03]} c={dark} cast={false} />
      {/* things: open book, a closed exercise book, a pencil case, books in the slot, a bag hung on the side */}
      {pick[0] < 0.7 ? <mesh position={[-0.35 + pick[1] * 0.2, 0.745, 0.02]} rotation={[-Math.PI / 2, 0, (pick[2] - 0.5) * 0.4]}><planeGeometry args={[0.4, 0.25]} /><meshLambertMaterial map={bookTex()} /></mesh> : null}
      {pick[3] < 0.6 ? <B p={[0.38, 0.75, 0.0]} s={[0.24, 0.02, 0.32]} c={['#5a8fc0', '#e2a04a', '#d05a5a', '#6aa06a'][Math.floor(pick[4] * 4)]} r={[0, pick[5] - 0.5, 0]} /> : null}
      {pick[4] > 0.4 ? <B p={[0.05, 0.76, -0.1]} s={[0.22, 0.04, 0.06]} c={pick[5] > 0.5 ? '#e46a8a' : '#4a8ad0'} r={[0, 0.3, 0]} /> : null}
      {[-0.5, -0.42, 0.3, 0.36, 0.44].map((x, i) => <B key={i} p={[x, 0.61, 0.05]} s={[0.05, 0.1, 0.26]} c={['#efe6cf', '#c8463c', '#3f6a8a', '#e1b84a', '#efe6cf'][i]} cast={false} />)}
      {pick[1] > 0.35 ? (() => { const k = pick[0] < 0.5 ? -1 : 1, col = bags[Math.floor(pick[2] * 5)]; return <group><Sprite name={`sbag${Math.floor(pick[2] * 5)}`} art={(c, W, H) => paintSchoolbag(c, W, H, col, '#' + new THREE.Color(col).multiplyScalar(0.75).getHexString())} px={[200, 240]} w={0.3} pos={[k * 0.762, 0.3, 0.02]} rotY={(k * Math.PI) / 2} shade={0} cast={false} /><B p={[k * 0.75, 0.68, 0.02]} s={[0.03, 0.03, 0.03]} c="#4a3a2e" cast={false} /></group>; })() : null}
    </group>
  );
};
export const CeilingFan: React.FC<{pos: V3; turn?: number}> = ({pos, turn = 0}) => (
  <group position={pos}>
    <B p={[0, -0.25, 0]} s={[0.04, 0.5, 0.04]} c="#e8e4da" cast={false} /><FacetLathe profile={[[0.06, 0], [0.13, 0.04], [0.13, 0.1], [0.07, 0.14]]} sides={10} color="#ece8de" pos={[0, -0.64, 0]} contact={false} cast={false} />
    {[0, 2.094, 4.189].map((a) => <group key={a} rotation={[0, a + turn, 0]}><B p={[0.42, -0.58, 0]} s={[0.62, 0.012, 0.14]} c="#e6e2d6" r={[0.12, 0, 0]} cast={false} /></group>)}
  </group>
);
