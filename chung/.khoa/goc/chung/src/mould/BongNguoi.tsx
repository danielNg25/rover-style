import React from 'react';
import * as THREE from 'three';
import {paint, BOX, SOLE_Y, CENTRE_X, HAIR_TOP} from './draw';
import type {Spec} from './draw';

type Ctx = CanvasRenderingContext2D;
/** vẽ thêm vào cùng tấm bóng (gối, chăn, thành giường…), bằng TOẠ ĐỘ CỦA BỘ KHUÔN (đế giày y = SOLE_Y 1197, giữa người x = 272,
 *  đỉnh tóc y = 6); tô bằng màu trắng đặc, vì cả tấm chỉ có một tông */
export type VeThem = (c: Ctx) => void;
const CACHE = new Map<string, THREE.CanvasTexture>();

/** HÌNH BÓNG MỘT TÔNG của một nhân vật của bộ khuôn: đúng đường viền của chính nhân vật ở đúng tư thế và nét mặt đang có (trắng
 *  đặc, cắt theo alpha). Mọi cái bóng người vẽ lên rèm, lên vách (không phải bóng thật của đèn) phải lấy từ đây, không vẽ tay một
 *  dáng người khác kiểu (Daniel, 23/11/2026, bóng người ốm sau rèm ở d1c3-18: "đầu thì lệch, người thì không giống model").
 *  them = vẽ thêm vào CÙNG tấm (gối, chăn) để các mảng không chồng đậm lên nhau; themKey = khoá của phần vẽ thêm.
 *  catDuoi = cắt bỏ mọi thứ dưới toạ độ y này của bộ khuôn (ví dụ 700 = chỉ lấy từ ngực trở lên) TRƯỚC khi vẽ thêm. */
export const bongTex = (spec: Spec, o: {blur?: number; S?: number; them?: VeThem; themKey?: string; catDuoi?: number} = {}) => {
  const {blur = 1.2, S = 0.5, them, themKey = '', catDuoi} = o, key = JSON.stringify(spec) + `|${blur}|${S}|${themKey}|${catDuoi ?? ''}`;
  let t = CACHE.get(key);
  if (!t) {
    const src = document.createElement('canvas'); paint(src, spec, S);
    const a = document.createElement('canvas'); a.width = src.width; a.height = src.height; const ca = a.getContext('2d')!;
    ca.drawImage(src, 0, 0); ca.globalCompositeOperation = 'source-in'; ca.fillStyle = '#ffffff'; ca.fillRect(0, 0, a.width, a.height);
    ca.setTransform(S, 0, 0, S, -BOX.x * S, -BOX.y * S);
    if (catDuoi !== undefined) { ca.globalCompositeOperation = 'destination-out'; ca.fillRect(BOX.x, catDuoi, BOX.w, BOX.y + BOX.h - catDuoi); }
    ca.globalCompositeOperation = 'source-over'; ca.fillStyle = '#ffffff'; ca.strokeStyle = '#ffffff';
    if (them) them(ca);
    const cv = document.createElement('canvas'); cv.width = a.width; cv.height = a.height; const c = cv.getContext('2d')!;
    if (blur > 0) c.filter = `blur(${blur}px)`; c.drawImage(a, 0, 0);
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; CACHE.set(key, t);
    if (CACHE.size > 160) CACHE.delete(CACHE.keys().next().value as string);
  }
  return t;
};

/** Một cái bóng người vẽ trên một mặt phẳng (rèm, vách): tấm phẳng mang `bongTex`, cùng cỡ và cùng điểm đặt chân như `Puppet3`
 *  (height = từ đế giày tới đỉnh tóc; pos = điểm giữa hai đế giày, đặt sát TRƯỚC mặt phẳng vài phân). color và opacity là màu và độ
 *  đậm của bóng; rotZ xoay quanh điểm đặt chân; rotY cho mặt phẳng không song song với màn hình. */
export const BongNguoi: React.FC<{spec: Spec; height: number; pos: [number, number, number]; color?: string; opacity?: number; order?: number; flip?: boolean;
  rotZ?: number; rotY?: number; blur?: number; them?: VeThem; themKey?: string; catDuoi?: number}> =
  ({spec, height, pos, color = '#1a1020', opacity = 0.55, order = 640, flip, rotZ = 0, rotY = 0, blur, them, themKey, catDuoi}) => {
    const u = height / (SOLE_Y - HAIR_TOP), w = BOX.w * u, h = BOX.h * u;
    const cx = (BOX.x + BOX.w / 2 - CENTRE_X) * u * (flip ? -1 : 1), cy = (SOLE_Y - (BOX.y + BOX.h / 2)) * u;
    return (
      <group position={pos} rotation={[0, rotY, rotZ]}>
        <mesh position={[cx, cy, 0]} scale={[flip ? -1 : 1, 1, 1]} renderOrder={order}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={bongTex(spec, {blur, them, themKey, catDuoi})} color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
      </group>
    );
  };
