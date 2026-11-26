import React, {useMemo} from 'react';
import * as THREE from 'three';

const veVan = (c: HTMLCanvasElement, sang: string, giua: string, toi: string, vet: string) => {
  c.width = 1200; c.height = 260; const x = c.getContext('2d')!; x.clearRect(0, 0, 1200, 260);
  const hinh = 'M16,136 C150,52 400,22 640,24 C860,26 1060,70 1186,126 C1060,190 850,232 620,236 C390,238 150,214 16,136 Z';
  x.fillStyle = giua; x.fill(new Path2D(hinh));
  x.save(); x.clip(new Path2D(hinh));
  x.fillStyle = toi; x.fill(new Path2D('M0,150 C260,186 760,196 1200,132 L1200,260 L0,260 Z'));
  x.fillStyle = sang; x.fill(new Path2D('M0,118 C240,58 620,40 1200,110 L1200,0 L0,0 Z'));
  x.fillStyle = vet; x.fill(new Path2D('M170,100 C380,70 640,66 860,88 C640,86 400,92 170,100 Z')); x.fill(new Path2D('M300,168 C460,182 620,184 760,174 C620,194 450,192 300,168 Z'));
  x.restore();
  x.strokeStyle = toi; x.lineWidth = 5; x.stroke(new Path2D(hinh));
};
/** VÁN LƯỚT của Silver Surfer (23/11/2026): một tấm giấy ba sắc bạc, dài `len` mét, tâm ở `pos`. Đặt ngay dưới chân người: `pos` lấy y của bàn chân trừ khoảng 0,04.
 *  chi = true: ván xám chì (d1c12, Surfer bị rút cạn). tilt = nghiêng trong mặt phẳng (độ). */
export const VanLuot: React.FC<{pos: [number, number, number]; len?: number; tilt?: number; chi?: boolean; order?: number; opacity?: number; rotY?: number}> =
  ({pos, len = 2.2, tilt = 0, chi = false, order = 499, opacity = 1, rotY = 0}) => {
    const tex = useMemo(() => { const c = document.createElement('canvas'); chi ? veVan(c, '#a2a6aa', '#7e8286', '#54585e', '#c4c8cc') : veVan(c, '#f4f8fc', '#c6d0da', '#8894a2', '#ffffff'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }, [chi]);
    return <mesh position={pos} rotation={[0, rotY, (tilt * Math.PI) / 180]} renderOrder={order}><planeGeometry args={[len, (len * 260) / 1200]} /><meshBasicMaterial map={tex} transparent opacity={opacity} alphaTest={0.05} depthWrite={false} side={THREE.DoubleSide} fog={false} /></mesh>;
  };
