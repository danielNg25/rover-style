import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Composition, Img, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AutoRecv} from '../lib3/kit';
import {MON_HANG, MonHang} from '../lib3/khoiTuAnh';

/** ẢNH CHỨNG MINH 3D (25/11/2026): mỗi món một hàng, ba ô xoay -35 / 0 / +35 độ, nắng từ phía máy, bóng đổ trên sàn, bên cạnh ảnh Codex gốc.
 *  thu-khoi-tu-anh-1 = hang1 (6 món đá), thu-khoi-tu-anh-2 = hang2 (7 món đồ nhỏ). Máy trực giao nhìn hơi từ trên xuống để thấy cạnh và mặt trên. */
const CELL = 400, ROW = 340, ORIG = 320, GOCS = [-35, 0, 35];
const SANG = '#e9e4d8', SAN = '#cfc8b8';
const MON1 = ['da-vach-hang-cao-hai-khoi-bo-reu', 'da-vach-hang-thap-rong-vet-nuoc-chay', 'cum-nhu-da-ba-mui-nhon-co-reu-treo', 'tang-da-tron-lon-mot-khoi-bo', 'ban-da-phang-mot-tam-hai-chan-tho', 'cum-ba-hon-da-tron-chong-len-nhau'];
const MON2 = ['gia-duoc-go-ba-chan-chen-sat-rong', 'nen-trang-ngan-tren-da-det-chua-chay', 'lo-dat-nung-nut-ban', 'binh-gom-co-hep-buoc-day-men-xam-xanh', 'hop-go-mo-nap-ba-cuon-giay', 'hai-cuon-giay-chong-buoc-day-do', 'ke-go-thap-ba-lo-dat-nau-do-xam'];

const Rig: React.FC<{S: number; fh: number}> = ({S, fh}) => {
  const {camera, scene, size} = useThree(), elev = 0.2;
  React.useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera, fw = 3 * S, h = (fw * size.height) / size.width;
    cam.left = -fw / 2; cam.right = fw / 2; cam.top = h / 2; cam.bottom = -h / 2; cam.near = 0.1; cam.far = 200;
    const D = 40, ty = h * 0.40; cam.position.set(0, ty + Math.sin(elev) * D, Math.cos(elev) * D); cam.lookAt(0, ty, 0); cam.updateProjectionMatrix();
    scene.background = new THREE.Color(SANG);
  });
  void fh; return null;
};

const Sun: React.FC<{S: number}> = ({S}) => {
  const key = React.useRef<THREE.DirectionalLight>(null);
  React.useLayoutEffect(() => {
    const L = key.current!, R = S * 2; L.position.set(-S * 1.2, S * 2.4, S * 2.2); L.target.position.set(0, 0, 0); L.target.updateMatrixWorld();
    const sc = L.shadow.camera; sc.left = sc.bottom = -R * 1.6; sc.right = sc.top = R * 1.6; sc.near = 0.1; sc.far = R * 6; sc.updateProjectionMatrix();
  });
  return <directionalLight ref={key} intensity={2.2} color="#fff3dc" castShadow shadow-mapSize={[2048, 2048]} shadow-radius={2} shadow-blurSamples={10} shadow-bias={-0.0004} />;
};

const Hang: React.FC<{mon: string}> = ({mon}) => {
  const m = MON_HANG[mon], h = m.w * m.ar, S = Math.max(m.w, h) * 1.4;
  return (
    <ThreeCanvas orthographic width={3 * CELL} height={ROW} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}>
      <AutoRecv /><Rig S={S} fh={h} />
      <hemisphereLight args={['#f4f0e6', '#9a9486', 0.8]} />
      <Sun S={S} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[400, 400]} /><meshLambertMaterial color={SAN} /></mesh>
      {GOCS.map((g, i) => <MonHang key={g} mon={mon} pos={[(i - 1) * S, 0, 0]} rotY={(g * Math.PI) / 180} />)}
    </ThreeCanvas>
  );
};

const Tam: React.FC<{ds: string[]}> = ({ds}) => (
  <AbsoluteFill style={{background: SANG, width: 3 * CELL + ORIG, height: ds.length * ROW}}>
    {ds.map((mon, r) => {
      const m = MON_HANG[mon], so = m.src.match(/hang(\d)-(\d)/)!;
      return (
        <div key={mon} style={{position: 'absolute', left: 0, top: r * ROW, width: 3 * CELL + ORIG, height: ROW, borderBottom: '3px solid #2b2823'}}>
          <Hang mon={mon} />
          {GOCS.map((g, i) => <div key={g} style={{position: 'absolute', left: i * CELL + 8, top: 6, font: '700 16px/22px "Helvetica Neue", Arial, sans-serif', color: '#2b2823', background: 'rgba(255,255,255,0.7)', padding: '1px 8px', borderRadius: 4}}>{m.ten} · 3D {m.loai.includes('tiện') ? 'tiện' : 'đùn'} · {g > 0 ? '+' : ''}{g}°</div>)}
          {[1, 2].map((i) => <div key={i} style={{position: 'absolute', left: i * CELL, top: 0, width: 1, height: ROW, background: 'rgba(43,40,35,0.25)'}} />)}
          <div style={{position: 'absolute', left: 3 * CELL, top: 0, width: ORIG, height: ROW, background: '#ff00ff22', borderLeft: '3px solid #2b2823'}}>
            <Img src={staticFile(m.src)} style={{position: 'absolute', left: 16, top: 34, width: ORIG - 32, height: ROW - 50, objectFit: 'contain'}} />
            <div style={{position: 'absolute', left: 8, top: 6, font: '700 19px/24px "Helvetica Neue", Arial, sans-serif', color: '#2b2823'}}>Ảnh Codex gốc · hang{so[1]}-{so[2]} · 2D</div>
          </div>
        </div>
      );
    })}
  </AbsoluteFill>
);

export const KhoiTuAnhThuComps: React.FC = () => <>
  <Composition id="thu-khoi-tu-anh-1" component={() => <Tam ds={MON1} />} width={3 * CELL + ORIG} height={MON1.length * ROW} fps={24} durationInFrames={1} />
  <Composition id="thu-khoi-tu-anh-2" component={() => <Tam ds={MON2} />} width={3 * CELL + ORIG} height={MON2.length * ROW} fps={24} durationInFrames={1} />
</>;
