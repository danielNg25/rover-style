import React, {useContext, useMemo} from 'react';
import * as THREE from 'three';
import {paintLooseArm, looseArmBox, SOLE_Y, HAIR_TOP} from './draw';
import type {Hand, Spec} from './draw';
import {FIG_LIFT, GradeCtx} from '../lib3/look';

/** BÀN TAY RỜI đi vào từ mép khung (23/11/2026), thay cho mẹo ống tay áo rời: bàn tay, cổ tay và cẳng tay đúng kiểu khuôn, cùng cỡ với
 *  một người cao `height`, màu tay áo và da lấy từ `spec`. `at` = chỗ CỔ TAY trong cảnh; `from` = phía cẳng tay đi ra ('left', 'right',
 *  'top', 'bottom', hoặc góc độ: 0 là từ trên xuống, dương xoay ngược chiều kim đồng hồ); `len` đủ dài để đầu kia nằm ngoài khung. */
export const BanTayRoi: React.FC<{spec: Spec; height: number; at: [number, number, number]; from?: 'left' | 'right' | 'top' | 'bottom' | number; hand?: Hand; len?: number; wrist?: number; bare?: boolean; gauntlet?: boolean; flip?: boolean; res?: number; order?: number; cast?: boolean; opacity?: number; rotY?: number; lift?: number; lit?: boolean}> =
  ({spec, height, at, from = 'right', hand = 'open', len = 900, wrist = 0, bare = false, gauntlet = false, flip = false, res = 2, order = 620, cast = true, opacity = 1, rotY = 0, lift: liftIn, lit = true}) => {
    const grade = useContext(GradeCtx), lift = liftIn ?? FIG_LIFT[grade];
    const canvas = useMemo(() => document.createElement('canvas'), []);
    const tex = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }, [canvas]);
    const key = JSON.stringify([spec.palette, spec.outfit, hand, len, wrist, bare, flip, gauntlet]);
    useMemo(() => { paintLooseArm(canvas, spec, {hand, len, wrist, bare, gauntlet, out: flip ? -1 : 1}, res); tex.needsUpdate = true; }, [key, res]);
    const u = height / (SOLE_Y - HAIR_TOP), B = looseArmBox(len), deg = from === 'top' ? 0 : from === 'bottom' ? 180 : from === 'left' ? 90 : from === 'right' ? -90 : from;
    return (
      <group position={at} rotation={[0, rotY, 0]}><group rotation={[0, 0, (deg * Math.PI) / 180]}>
        <mesh position={[(B.x + B.w / 2) * u, -(B.y + B.h / 2) * u, 0]} scale={[flip ? -1 : 1, 1, 1]} castShadow={cast} renderOrder={order}>
          <planeGeometry args={[B.w * u, B.h * u]} />
          {lit ? <meshLambertMaterial map={tex} emissiveMap={tex} emissive={new THREE.Color(lift, lift, lift)} transparent opacity={opacity} alphaTest={0.06 * opacity} depthWrite={false} side={THREE.DoubleSide} fog={false} />
            : <meshBasicMaterial map={tex} transparent opacity={opacity} alphaTest={0.06 * opacity} depthWrite={false} side={THREE.DoubleSide} fog={false} />}
        </mesh>
      </group></group>
    );
  };
