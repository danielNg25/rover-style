import React from 'react';
import * as THREE from 'three';
import {Puppet3} from './Puppet3';
import type {Spec} from './draw';
import {SOLE_Y, HAIR_TOP} from './draw';
import {resolvePosture} from './dang';

let quangT: THREE.CanvasTexture | null = null;
const quangTex = () => {
  if (!quangT) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!, g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.42, 'rgba(255,255,255,0.42)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); quangT = new THREE.CanvasTexture(c); quangT.colorSpace = THREE.SRGBColorSpace; }
  return quangT;
};
const Quang: React.FC<{pos: [number, number, number]; r: number; color: string; k: number; order: number}> = ({pos, r, color, k, order}) => k <= 0.005 ? null : (
  <mesh position={pos} renderOrder={order} scale={[r * 2, r * 2, 1]}><planeGeometry /><meshBasicMaterial map={quangTex()} color={color} transparent opacity={Math.min(1, k)} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} /></mesh>
);
let thoiG: THREE.BufferGeometry | null = null;
const thoiGeo = () => { if (!thoiG) { thoiG = new THREE.BufferGeometry(); thoiG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 1, 0, -0.55, 0, 0, 0, -1, 0, 0.55, 0, 0]), 3)); thoiG.setIndex([0, 1, 2, 0, 2, 3]); } return thoiG; };
const hash = (i: number, k: number) => { const v = Math.sin(i * 91.7 + k * 47.3) * 24634.6345; return v - Math.floor(v); };
const MAU_TAN = ['#fff0a0', '#ffc42e', '#ff8a1e', '#e8391a'];
/** tàn lửa hình thoi nhỏ: sinh quanh thân, bay lên, lượn theo gió, đổi từ vàng sang đỏ rồi tắt */
const TanLua: React.FC<{f: number; h: number; pos: [number, number, number]; n: number; order: number; opacity: number}> = ({f, h, pos, n, order, opacity}) => <>{Array.from({length: n}, (_, i) => {
  const L = 22 + Math.floor(hash(i, 1) * 26), cyc = (f + hash(i, 2) * L * 3) / L, c = Math.floor(cyc), u = cyc - c, x0 = (hash(i + c, 3) - 0.5) * h * 0.62, y0 = h * (0.08 + hash(i + c, 4) * 0.82), rise = h * (0.28 + hash(i + c, 5) * 0.5), sw = Math.sin(f * 0.14 + i * 2.1) * 0.07 * h * u, z = 0.04 + hash(i, 6) * 0.08, s = (0.012 + hash(i + c, 7) * 0.02) * (h / 1.74) * (1 - u * 0.55);
  return <mesh key={i} geometry={thoiGeo()} position={[pos[0] + x0 + sw, pos[1] + y0 + rise * u, pos[2] + z]} rotation={[0, 0, f * 0.11 + i]} scale={[s, s * 1.5, 1]} renderOrder={order + 4}><meshBasicMaterial color={MAU_TAN[Math.min(3, Math.floor(u * 4))]} transparent opacity={opacity * (u > 0.72 ? (1 - u) / 0.28 : 1)} depthWrite={false} side={THREE.DoubleSide} fog={false} toneMapped={false} /></mesh>;
})}</>;

/** NGƯỜI LỬA (23/11/2026): hình `flame` của bộ khuôn, quầng thở hai lớp sau lưng, tàn lửa hình thoi bay lên. f = số khung (hình lửa đổi mỗi 2 khung).
 *  k 0..1: 0 là người thường (ăn đèn cảnh), tăng dần thì bùng từ chân lên đầu. light = cường độ ánh lửa hắt lên cảnh và người bên cạnh (mặc định không có). */
export const NguoiLua: React.FC<{spec: Spec; height: number; pos: [number, number, number]; f: number; k?: number; flip?: boolean; order?: number; opacity?: number; hat?: number; light?: number; res?: number}> =
  ({spec, height, pos, f, k = 1, flip, order = 500, opacity = 1, hat = 22, light = 0, res = 1.5}) => {
    const h = height, f2 = f - (f % 2), kk = Math.max(0, Math.min(1, k)), thoi = 1 + Math.sin(f * 0.31) * 0.05 + Math.sin(f * 0.83 + 1) * 0.025, fig = {...spec, flame: {...spec.flame, t: f2, k: kk}};
    // dáng đánh nhau: quầng và tàn lửa đi theo thân đang rời đất, nằm ngang
    const Pa = spec.posture !== undefined ? resolvePosture(spec.posture) : null, dangHanh = (Pa?.hanh ?? 0) > 0, nam = dangHanh ? Math.min(1, Math.abs(Pa!.roll) / 70) : 0, yR = dangHanh ? ((Pa!.rise ?? 0) * h) / (SOLE_Y - HAIR_TOP) : 0, yQ = (a: number) => pos[1] + yR + h * (a - (a - 0.2) * nam);
    if (kk <= 0.001) return <Puppet3 spec={fig} height={height} pos={pos} flip={flip} order={order} opacity={opacity} res={res} />;
    return <>
      {/* tâm và bán kính giữ quầng nằm trọn trên mặt đất: quầng cắt xuống sàn thì hiện một đường ngang cứng ở chân */}
      <Quang pos={[pos[0], yQ(0.7), pos[2] - 0.03]} r={h * 0.68 * thoi * (0.55 + 0.45 * kk)} color="#ff5a18" k={0.5 * kk * opacity} order={order - 2} />
      <Quang pos={[pos[0], yQ(0.62), pos[2] - 0.02]} r={h * 0.52 * thoi * (0.55 + 0.45 * kk)} color="#ffc23a" k={0.4 * kk * opacity} order={order - 1} />
      <Puppet3 spec={fig} height={height} pos={pos} flip={flip} lit={false} tint="#ffffff" order={order} opacity={opacity} noShadow res={res} />
      {kk > 0.08 ? <TanLua f={f} h={h} pos={[pos[0], pos[1] + yR, pos[2]]} n={Math.round(hat * kk)} order={order} opacity={opacity} /> : null}
      {light > 0 ? <pointLight position={[pos[0], yQ(0.6), pos[2] + 0.7]} color="#ff9a3c" intensity={light * kk * thoi} distance={7} decay={2} /> : null}
    </>;
  };
