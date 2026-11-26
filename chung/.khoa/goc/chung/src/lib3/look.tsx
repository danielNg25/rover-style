import React, {useMemo, createContext} from 'react';
import * as THREE from 'three';
import {NguonBui, TroiBui, mauAm} from './buiNguon';

/** TRẦN CHO NGUỒN SÁNG TỰ PHÁT (Daniel 26/11/2026: "các nguồn sáng tự phát trong hình phát ra ánh rất chói"). Ở video gốc đèn lồng, nến, lửa là hình vẽ
 *  phẳng; bề mặt ngay cạnh nguồn KHÔNG sáng hơn bề mặt ở xa (đo hai khung đèn lồng trên tường: chênh −4 % và −15 %). Ở ta, một `pointLight` đặt sát
 *  đồ vật làm đồ vật trắng bệch (đèn điểm yếu dần theo bình phương khoảng cách, nên cách 20 cm mạnh gấp trăm lần cách 2 m), và quầng `Halo` cộng thêm.
 *  tranDenGan: một đèn ĐIỂM không rọi lên bề mặt nào mạnh hơn mức này (đơn vị của three: 3,14 là đủ làm một mặt trắng quay thẳng vào đèn sáng hết cỡ).
 *              Bề mặt ở xa, nơi đèn vốn yếu hơn trần, không đổi gì. Đèn chiếu (spotLight) và đèn hướng (nắng, trăng) không bị chạm.
 *  tranQuang:  quầng `Halo` màu ấm (đèn, nến, lửa) không đậm hơn mức này; quầng màu khác (phép, cổng) giữ nguyên.
 *  Thử số khác cho một lần dựng: REMOTION_THU_NGUON_SANG="tranDenGan,tranQuang" ("0,0" = không trần, cách vẽ trước ngày này). */
export const NGUON_SANG = {tranDenGan: 1.4, tranQuang: 0.2};   // Daniel chọn 26/11/2026: "trần 1.4 và quầng 0.2 ổn nhé"
const TRAN_NS: [number, number] = (() => { const t = typeof process !== 'undefined' ? process.env.REMOTION_THU_NGUON_SANG : undefined; if (typeof process !== 'undefined' && process.env.REMOTION_SOI_BONG === 'luat-cu') return [0, 0]; if (t) { const [a, b] = t.split(',').map(Number); if (isFinite(a) && isFinite(b)) return [a, b]; } return [NGUON_SANG.tranDenGan, NGUON_SANG.tranQuang]; })();
(() => {   // cài trần đèn điểm vào đoạn shader dùng chung của three (mọi vật liệu ăn sáng), một lần khi nạp module
  const c = THREE.ShaderChunk as unknown as Record<string, string>, goc = 'light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );';
  if (!(TRAN_NS[0] > 0) || c.lights_pars_begin.includes('tranDenGan')) return;
  if (!c.lights_pars_begin.includes(goc)) { console.warn('[trần đèn gần] three đổi shader đèn điểm: chưa cài được'); return; }
  c.lights_pars_begin = c.lights_pars_begin.replace(goc, goc + `\n\t\t{ float tranDenGan = ${TRAN_NS[0].toFixed(3)}; float manhDen = max( light.color.r, max( light.color.g, light.color.b ) ); if ( manhDen > tranDenGan ) light.color *= tranDenGan / manhDen; }`);
})();

/** lib3/look: THE LOOK, shared by every solid in every scene, whatever the subject. Four rules taken from the reference
 *  as a whole (not from one object):
 *   0. (after the first blend test, which a judge failed at 92 %) The light is SOFT AND DIFFUSE: the sky fill carries the
 *      picture, the key only models forms and casts a soft shadow; facets are a hint, never hard steps; a paper grain sits
 *      over the whole frame (Grain). Scenes are staged in depth and filled (lib3/town, tools/classnorms.py `flat`).
 *   1. Light rolls softly over a solid: one side lighter, the other darker, and a gentle change inside each facet, while
 *      the facet borders stay readable. Done with real three.js lighting on normals that blend each facet's own
 *      direction with the direction of a round form (softNormals).
 *   2. Solids are turned, not sculpted: N vertical sides around an axis (FacetLathe). Rocks, pots, pillars, towers,
 *      barrels, trunks, lamp posts, mugs all come from this one primitive. No triangle soup.
 *   3. Colours are restrained and each kind of place has its own brightness (GRADES, from the luma measured on the
 *      reference by kind of place).
 *   4. Ground is never one flat tone: it changes with distance, carries large soft patches and takes shadows (Ground). */
type V3 = [number, number, number];

/** Rewrites the normals of a NON-INDEXED geometry: each vertex gets its facet's normal blended with the direction from
 *  the solid's axis (a round form). soft 0 = hard facets of one tone each; 0.45 = the reference's look. Triangles that
 *  belong to one facet must already share `faceNormals` (see FacetLathe); otherwise each triangle is its own facet. */
export const softNormals = (g: THREE.BufferGeometry, soft = 0.45, faceNormals?: Float32Array) => {
  const p = g.attributes.position as THREE.BufferAttribute, n = new Float32Array(p.count * 3);
  g.computeBoundingBox(); const c = g.boundingBox!.getCenter(new THREE.Vector3());
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), fn = new THREE.Vector3(), rn = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    if (faceNormals) fn.set(faceNormals[i * 3], faceNormals[i * 3 + 1], faceNormals[i * 3 + 2]);
    else { a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); d.fromBufferAttribute(p, i + 2); fn.copy(b.sub(a)).cross(d.sub(a)).normalize(); }
    for (let k = 0; k < 3; k++) {
      rn.fromBufferAttribute(p, i + k).sub(c); rn.y *= 0.55; rn.normalize();
      const v = fn.clone().multiplyScalar(1 - soft).addScaledVector(rn, soft).normalize();
      n[(i + k) * 3] = v.x; n[(i + k) * 3 + 1] = v.y; n[(i + k) * 3 + 2] = v.z;
    }
  }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); return g;
};

/** A turned solid with `sides` vertical facets. profile = [[radius, height], ...] from the foot up, in units of `s`.
 *  wobble = how uneven the rings are (0 for made things such as pots and pillars, 0.2-0.3 for rocks and stumps);
 *  squash = depth against width. The top is closed flat. Every facet is ONE quad with one direction. */
export const lathe = (profile: [number, number][], sides: number, s: number, wobble = 0, seed = 1, squash = 1, soft = 0.72, tones?: number[]) => {
  // tone per ring segment (multiplies the colour). Default: the foot a little darker, the lip a little lighter, so even a
  // plain turned solid carries three tones (reference props: mostly 3 tones).
  const nseg = profile.length - 1, tn = tones ?? Array.from({length: nseg}, (_, i) => (nseg >= 3 ? (i === 0 ? 0.84 : i === nseg - 1 ? 1.12 : 1) : 1)), C: number[] = [];
  const rnd = (i: number) => { const x = Math.sin(seed * 91.7 + i * 47.3) * 43758.5; return x - Math.floor(x); };
  const pt = (ri: number, k: number): THREE.Vector3 => { const [r, y] = profile[ri], a = (k / sides) * Math.PI * 2 + 0.26, j = 1 + (rnd(ri * 13 + (k % sides)) - 0.5) * 2 * wobble; return new THREE.Vector3(Math.cos(a) * r * j * s, y * s, Math.sin(a) * r * j * s * squash); };
  const P: number[] = [], N: number[] = [];
  const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) => {   // a-b bottom, c-d top
    const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize(); if (n.dot(new THREE.Vector3(a.x + d.x, 0, a.z + d.z)) < 0) n.negate();
    [a, c, b, b, c, d].forEach((v) => { P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(tone, tone, tone); });
  };
  let tone = 1;
  for (let ri = 0; ri < profile.length - 1; ri++) { tone = tn[ri] ?? 1; for (let k = 0; k < sides; k++) quad(pt(ri, k), pt(ri, k + 1), pt(ri + 1, k), pt(ri + 1, k + 1)); }
  const top = profile.length - 1, cy = profile[top][1] * s;
  for (let k = 0; k < sides; k++) { const c = pt(top, k), d = pt(top, k + 1); [new THREE.Vector3(0, cy, 0), d, c].forEach((v) => { P.push(v.x, v.y, v.z); N.push(0, 1, 0); C.push(tone * 1.06, tone * 1.06, tone * 1.06); }); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return softNormals(g, soft, new Float32Array(N));
};
export const FacetLathe: React.FC<{profile: [number, number][]; sides?: number; s?: number; color: string; pos?: V3; rotY?: number; wobble?: number; seed?: number; squash?: number; soft?: number; cast?: boolean; tones?: number[]; contact?: boolean}> =
  ({profile, sides = 12, s = 1, color, pos = [0, 0, 0], rotY = 0, wobble = 0, seed = 1, squash = 1, soft = 0.72, cast = true, tones, contact}) => {
    const geo = useMemo(() => lathe(profile, sides, s, wobble, seed, squash, soft, tones), [JSON.stringify(profile), sides, s, wobble, seed, squash, soft, JSON.stringify(tones)]);
    const onGround = contact ?? profile[0][1] === 0;   // anything that stands on the ground darkens it a little where they meet
    return (
      <group position={pos} rotation={[0, rotY, 0]}>
        <mesh geometry={geo} castShadow={cast} receiveShadow><meshLambertMaterial color={color} vertexColors side={THREE.DoubleSide} /></mesh>
        {onGround ? <ContactShade r={profile[0][0] * s * 1.7} /> : null}
      </group>
    );
  };

/** NGƯỜI ĂN ĐÈN TỚI ĐÂU (Daniel 26/11/2026, sau khi đo video gốc: "đáng lẽ ta phải làm như rover"). Ở video gốc người luôn vẽ đúng MÀU RIÊNG: độ sáng
 *  không đổi theo đèn (lòng trắng mắt 254 ban ngày, 254 ở trại đêm kể cả người đứng sát lửa); cảnh có màu mạnh chỉ phủ một lớp màu nhẹ, đều lên cả người
 *  (trong lều đêm màu lam giảm 18 %, cõi lửa 6 %, trại đêm 0). Trước ngày này người của ta ăn 100 % độ sáng của đèn (tối ở cảnh đêm, trắng bệch cạnh lửa).
 *  sang = phần ĐỘ SÁNG của đèn mà người nhận (0 = luôn đúng màu riêng, 1 = sáng tối hẳn theo đèn); mau = phần MÀU của đèn phủ lên người.
 *  Khoảng cho cảnh thường: sang 0–0,10; mau 0–0,20. Người đứng sát một hiệu ứng (phép, cổng, lửa lớn): `Puppet3 anMau` 0,5–1. Hình bóng tối trước đèn
 *  mạnh: `Puppet3 anSang={1}`. Thử số khác cho một lần dựng: REMOTION_THU_AN_DEN="sang,mau" (ảnh TRƯỚC của ngày 26/11: "1,0"). */
export const NGUOI_AN_DEN = {sang: 0.05, mau: 0.15, sangMin: 0, sangMax: 0.1, mauMin: 0, mauMax: 0.2};
/** ĐỘ ĐẬM BÓNG CỦA NGƯỜI theo loại cảnh (Daniel 25/11/2026: "trong nhà vẫn có bóng như kênh mẫu nhưng mờ hơn, mờ hay đậm tuỳ vào độ sáng của
 *  cảnh trong nhà đó"). Soi tám khung trong nhà của video gốc: phòng sáng (phòng thí nghiệm trắng, bệnh viện) bóng rõ; phòng ấm, phòng lạnh bóng mờ;
 *  phòng tối rất mờ. Số là độ đục của tấm bóng (0 = không thấy). Cảnh sáng hơn hay tối hơn loại của nó thì truyền `bong` cho Puppet3. */
export const BONG_NGUOI: Record<string, number> = {dayExterior: 0.42, lateDay: 0.42, snowExterior: 0.3, nightExterior: 0.3, brightInterior: 0.32, darkInterior: 0.22};
/** Hướng đổ mặc định của bóng người khi cảnh không có đèn chính đổ bóng: như phòng của video gốc, bóng ngả sang phải và ra sau, dài nửa người. */
export const BONG_MAC_DINH: [number, number] = [0.5 * Math.sin(25 * Math.PI / 180), 0.5 * Math.cos(25 * Math.PI / 180)];
/** The soft darkening of the ground where an object meets it (the reference has it under every standing thing). */
export const ContactShade: React.FC<{r: number; pos?: V3; strength?: number}> = ({r, pos = [0, 0, 0], strength = 0.4}) => {
  // Vệt tiếp đất vẽ sẵn ĐÃ BỎ cho cả người lẫn đồ vật (Daniel 25/11/2026: "chỉ dùng 1 bóng, bỏ vệt tròn"; đồ vật: "bỏ như đã bỏ ở người").
  // Component còn để code cũ không vỡ; nó chỉ vẽ khi dựng ảnh TRƯỚC với REMOTION_SOI_BONG=luat-cu.
  const boVet = !(typeof process !== 'undefined' && process.env.REMOTION_SOI_BONG === 'luat-cu');
  // a SHORT, FIRM patch (panel: "short, firm contact shadows", not an airbrushed halo): solid to 60 % of the radius
  const tex = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!; const g = x.createRadialGradient(64, 64, 38, 64, 64, 62); g.addColorStop(0, `rgba(20,24,40,${strength})`); g.addColorStop(1, 'rgba(20,24,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }, [strength]);
  if (boVet) return null;
  return <mesh position={[pos[0], pos[1] + 0.006, pos[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} userData={{vetBong: r}}><planeGeometry args={[r * 2, r * 2]} /><meshBasicMaterial map={tex} transparent depthWrite={false} /></mesh>;
};

/** Brightness and light by kind of place. luma = the middle picture brightness measured on the reference for that kind
 *  (0-255); key and fill are light strengths that land a mid-grey set near it; sky / ground tint the fill. */
export const GRADES = {
  nightExterior: {luma: 72, key: 1.25, fill: 0.95, sky: '#aab4d6', ground: '#4f5673', keyColor: '#fff3e2', bg: '#3f4666'},
  /** pale snow under an overcast dusk sky: bright ground, dark sky (measured on reference frame 2905: picture luma about 138) */
  snowExterior: {luma: 138, key: 1.25, fill: 2.3, sky: '#dfe4f2', ground: '#8d93a6', keyColor: '#fff6ea', bg: '#454c6e'},
  dayExterior: {luma: 123, key: 1.95, fill: 1.55, sky: '#fff8ee', ground: '#b9ad9c', keyColor: '#fff1dc', bg: '#a9c6e6'},
  /** late afternoon: a strong warm key over a weak fill, for long clear shadows (use a LOW key direction, e.g. [-8, 4.5, 3.5]).
   *  With the day grade a low sun leaves the shadows faint: its fill is as strong as the grazing key. */
  lateDay: {luma: 123, key: 3.4, fill: 1.05, sky: '#f6e6cf', ground: '#b9a58c', keyColor: '#ffd9a0', bg: '#e9d3b2'},
  darkInterior: {luma: 93, key: 1.2, fill: 1.0, sky: '#c9c2b4', ground: '#4a4440', keyColor: '#ffe9c8', bg: '#2a2622'},
  brightInterior: {luma: 185, key: 1.6, fill: 1.9, sky: '#ffffff', ground: '#c9ccd2', keyColor: '#ffffff', bg: '#e9ecef'},
} as const;
export type Grade = keyof typeof GRADES;
/** The two lights of a scene: a fill from the sky and ONE key that casts the shadows. dir = where the key comes from.
 *  Độ mềm mép bóng KHÔNG đặt ở đây: `autoReceive` (kit.tsx) đặt lại `shadow.radius` theo MEP_BONG_CM (6 cm, 25/11/2026). */
/** KHUNG BÓNG của đèn chính (Daniel 25/11/2026: bóng "bị kéo dài quá", "bị lệch quá làm bóng bị hẹp"; không đặt một số cứng cho mọi cảnh, "chỉ cần set
 *  max và min"). Cảnh tự đặt hướng đèn; nằm trong khung thì giữ nguyên, vượt ra ngoài thì bị kéo về mép khung.
 *    dai  = độ dài bóng so với chiều cao vật (0,5 = bóng dài bằng nửa người). Đèn càng thấp bóng càng dài.
 *    lech = góc lệch ngang của đèn so với trục máy, tính bằng độ (0 = đèn thẳng từ phía máy, bóng ngả thẳng ra sau; 90 = đèn chiếu ngang). Người là tấm
 *           phẳng quay về máy, nên lệch càng nhiều bóng càng hẹp (bề dày bóng = cos của góc này). Lớn hơn 90 là đèn ở phía sau: cũng bị kéo về.
 *  Số do Claude đề xuất, Daniel xem mẫu cảnh bờ sông tập Shisui và nói "oke vậy ổn hơn" (25/11/2026; ảnh `kenh/_thu-mau/out/luat-bong/itachi-110-khung-bong.jpg`).
 *  Daniel đổi số nào thì sửa ở đây. Để mở hẳn: {daiMin: 0, daiMax: 99, lechMin: 0, lechMax: 90}. */
export const KHUNG_BONG = {daiMin: 0.35, daiMax: 0.8, lechMin: 10, lechMax: 35};
const kep = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** d = vị trí đèn so với đích, trong hệ của máy (x sang phải, y lên, z về phía máy). Trả về hướng đã kéo vào KHUNG_BONG; giữ bên trái hay phải và
 *  khoảng cách tới đích. Thử: REMOTION_THU_BONG="dai,lech" ép đúng hai số đó (chỉ để dựng ảnh mẫu); REMOTION_SOI_BONG=luat-cu thì không đụng gì. */
export const tuPhiaMay = (d: V3): V3 => {
  if (typeof process !== 'undefined' && process.env.REMOTION_SOI_BONG === 'luat-cu') return d;
  const thu = typeof process !== 'undefined' && process.env.REMOTION_THU_BONG ? String(process.env.REMOTION_THU_BONG).split(',').map(Number) : null;
  const ngang = Math.hypot(d[0], d[2]), R = Math.hypot(ngang, d[1]) || 10, K = KHUNG_BONG;
  const dai0 = d[1] > 0.001 ? ngang / d[1] : 99, lechDat = Math.atan2(Math.abs(d[0]), d[2]) * 180 / Math.PI, lech0 = lechDat > 90 ? 180 - lechDat : lechDat;   // đèn phía sau: lật ra trước rồi mới kẹp
  const dai = thu && thu[0] > 0 ? thu[0] : kep(dai0, K.daiMin, K.daiMax), lech = thu && thu[1] >= 0 ? thu[1] : kep(lech0, K.lechMin, K.lechMax);
  if (!thu && lechDat <= 90 && Math.abs(dai - dai0) < 1e-4 && Math.abs(lech - lech0) < 1e-4) return d;
  const y = R / Math.hypot(1, dai), n = y * dai, a = lech * Math.PI / 180;
  return [(d[0] > 0 ? 1 : -1) * n * Math.sin(a), y, n * Math.cos(a)];
};
/** nguocSang: cảnh ngược sáng THẬT (khung hình có mặt trời thấp hay cửa sáng phía sau; danh sách cảnh phải ghi): giữ hướng đèn như đã đặt. */
export const SceneLight: React.FC<{grade: Grade; dir?: V3; reach?: number; gain?: number; nguocSang?: boolean}> = ({grade, dir: dirDat = [-6, 5.5, 4.5], reach = 12, gain = 1, nguocSang}) => {
  const dir = nguocSang ? dirDat : tuPhiaMay(dirDat);
  // default direction: from the front-left at a middling height, so shadows fall to screen right and slightly back where the
  // camera sees them (reference day exteriors). Not from the pure side: figures are flat cards facing the camera, and a
  // light that runs along the card leaves only a sliver of shadow.
  // gain: the multiplier `tools/classnorms.py check` prints to bring the picture to the middle brightness of its kind
  const g0 = GRADES[grade], g = {...g0, key: g0.key * gain, fill: g0.fill * gain};
  return (
    <>
      <hemisphereLight args={[g.sky, g.ground, g.fill]} />
      <directionalLight position={dir} intensity={g.key} color={g.keyColor} castShadow userData={{nguocSang: !!nguocSang}} shadow-mapSize={[4096, 4096]} shadow-radius={1.6} shadow-blurSamples={12} shadow-bias={-0.0005}
        shadow-camera-left={-reach} shadow-camera-right={reach} shadow-camera-top={reach} shadow-camera-bottom={-reach * 0.6} shadow-camera-near={1} shadow-camera-far={60} />
      <TroiBui grade={grade} />{/* báo loại nơi cho lớp bụi nền (lib3/buiNguon) */}
    </>
  );
};

/** Ground of any kind (snow, grass, sand, stone floor): near colour at the camera edge blending to the far colour with
 *  distance, large soft lighter and darker patches, gentle swells that take the key light smoothly, and shadows.
 *  size = [width, depth]; the camera looks along -z; patch = strength of the patches (0-0.15). */
export const Ground: React.FC<{near: string; far: string; pos?: V3; size?: [number, number]; swell?: number; patch?: number; farAt?: number; seed?: number; map?: THREE.Texture; tile?: number; wear?: THREE.Texture}> =
  ({near, far, pos = [0, 0, 0], size = [70, 46], swell = 0.07, patch = 0.07, farAt = 0.5, seed = 3, map, tile = 2, wear}) => {
    // map: a surface texture from lib3/detail (slabs, planks, cobbles); it repeats every `tile` world units
    if (map) { map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(size[0] / tile, size[1] / tile); }
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(size[0], size[1], 48, 36), p = g.attributes.position as THREE.BufferAttribute;
      const a = new THREE.Color(near), b = new THREE.Color(far), col: number[] = [];
      const noise = (x: number, y: number) => Math.sin(x * 0.42 + seed) * Math.cos(y * 0.55 + seed * 1.7) + 0.5 * Math.sin(x * 0.93 + y * 0.71 + seed * 2.3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i); p.setZ(i, noise(x, y) * swell);
        const t = Math.min(1, Math.max(0, (0.5 - y / size[1]) / farAt)), u = t * t * (3 - 2 * t), c = a.clone().lerp(b, u).multiplyScalar(1 + noise(x * 0.6 + 4, y * 0.6 + 9) * patch);
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
    }, [near, far, size[0], size[1], swell, patch, farAt, seed]);
    // wear: one non-repeating picture (lib3/detail useWear) laid over the near third of the ground
    return (
      <group position={pos}>
        <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><meshLambertMaterial vertexColors map={map ?? null} key={map ? 'm' : 'n'} /></mesh>
        {wear ? <mesh position={[0, 0.012, size[1] * 0.3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[size[0] * 0.5, size[1] * 0.4]} /><meshBasicMaterial map={wear} transparent depthWrite={false} /></mesh> : null}
      </group>
    );
  };

/** Paper grain over the finished frame (a DOM layer above the canvas). The reference notes a fine paper grain or
 *  mottling in 127 shots; without it flat fills read as a clean game render. */
export const Grain: React.FC<{amount?: number}> = ({amount = 0.16}) => (
  <div style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: amount, pointerEvents: 'none'}}>
    <svg width="100%" height="100%"><filter id="lib3grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={4} /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#lib3grain)" /></svg>
  </div>
);
/** Camera distance that puts a figure of height h at `share` of the frame height (reference medians: wide 0.40,
 *  medium 0.75, close 0.85 with the head filling the frame). fov in degrees. */
export const distanceFor = (h: number, share: number, fov = 28) => h / share / (2 * Math.tan((fov * Math.PI) / 360));

/** How a generated 2D picture is fitted to a scene of each kind, so it does not sit on top of the picture with its own
 *  colours: sat = saturation kept, lum = brightness kept, tint + amount = the scene's cast laid over it. */
export const PIC_FIT: Record<Grade, {sat: number; lum: number; tint: string; amount: number}> = {
  dayExterior: {sat: 0.74, lum: 0.94, tint: '#e8d2ae', amount: 0.14},
  lateDay: {sat: 0.8, lum: 0.94, tint: '#f0c890', amount: 0.2},
  snowExterior: {sat: 0.6, lum: 0.9, tint: '#b9c2d8', amount: 0.2},
  nightExterior: {sat: 0.55, lum: 0.62, tint: '#5f6a94', amount: 0.3},
  darkInterior: {sat: 0.68, lum: 0.74, tint: '#c9a878', amount: 0.2},
  brightInterior: {sat: 0.8, lum: 1, tint: '#f1f1ee', amount: 0.08},
};
/** The kind of place the current scene is; lib3/flat reads it to fit every 2D picture. Wrap the scene in <Scene3>. */
export const GradeCtx = createContext<Grade>('dayExterior');
export const Scene3: React.FC<{grade: Grade; dir?: V3; gain?: number; reach?: number; children: React.ReactNode}> = ({grade, dir, gain, reach, children}) =>
  <GradeCtx.Provider value={grade}><SceneLight grade={grade} dir={dir} gain={gain} reach={reach} />{children}</GradeCtx.Provider>;

/** The last layer over a finished frame (third blend test: judges name the surface first: "soft paper cut-outs with a faint
 *  grain and a gentle soft-focus look; muted, warm, dusty" against our "crisp flat vector"). Wraps the canvas:
 *  a slight softening, a little less saturation and contrast, large soft mottling inside flat areas, a paper grain coarse
 *  enough to survive video compression, and a warm dusty cast. warm = the cast colour ('' for none, e.g. night scenes). */
export const Finish: React.FC<{children: React.ReactNode; soft?: number; grain?: number; mottle?: number; warm?: string; warmAmount?: number}> = ({children, soft = 0, grain = 0.12, mottle = 0.1, warm = '', warmAmount = 0}) => (
  // panel of three judges (fifth blend test), points made by at least two: keep every layer SHARP (no softening on wides),
  // do not wash the colours out, shadows firm rather than airbrushed. So: no blur and no desaturation by default.
  // defaults after the fourth blend test: with grain 0.3 and a 0.22 warm cast a judge called the frame "a noisy paper filter,
  // sepia"; two earlier judges had asked for grain. Kept light until a panel of several judges settles it.
  <div style={{position: 'absolute', inset: 0}}>
    <div style={{position: 'absolute', inset: 0, filter: soft > 0 ? `blur(${soft}px)` : 'none'}}>{children}</div>
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, mixBlendMode: 'soft-light', opacity: mottle, pointerEvents: 'none'}}><filter id="lib3mottle"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves={3} seed={7} /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncR type="linear" slope="2.4" intercept="-0.7" /><feFuncG type="linear" slope="2.4" intercept="-0.7" /><feFuncB type="linear" slope="2.4" intercept="-0.7" /></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#lib3mottle)" /></svg>
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: grain, pointerEvents: 'none'}}><filter id="lib3paper"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={4} /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#lib3paper)" /></svg>
    {warm ? <div style={{position: 'absolute', inset: 0, background: warm, mixBlendMode: 'multiply', opacity: warmAmount, pointerEvents: 'none'}} /> : null}
  </div>
);

/** How dark a figure is drawn in each kind of place (figures are unlit cards). Rule H41: at night a figure keeps its own
 *  hues and only gets darker and a little cooler. */
export const FIG_TINT: Record<Grade, string> = {lateDay: '#fff4e2', dayExterior: '#ffffff', brightInterior: '#ffffff', snowExterior: '#e9ebf2', nightExterior: '#b4b8cf', darkInterior: '#cfc6b8'};
/** A soft halo round a light at night, at dusk or in a close shot (rule G37); never by day. */
/** bui: quầng lớn (r >= 0,45, strength >= 0,2) tự đăng ký nguồn bụi (lib3/buiNguon): ấm là 'den', màu khác là 'phep'; quầng ấm nhỏ
 *  (r 0,14-0,45, strength >= 0,3) là 'nen'. Nằm sát lửa, đèn đã đăng ký thì nhường. bui = false tắt (quầng của từng hạt phải tắt), true bật. */
export const Halo: React.FC<{pos: V3; r: number; color?: string; strength?: number; order?: number; bui?: boolean}> = ({pos, r, color = '#ffd27a', strength = 0.55, order = 4, bui}) => {
  // order 4: after the flat pieces of the set (3), BEFORE the figures (500). Figures do not write depth, so a glow drawn after
  // them would lie over a face even when its lamp stands far behind
  const tex = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!, col = new THREE.Color(color), rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`; const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, `rgba(${rgb},${TRAN_NS[1] > 0 && mauAm(color) ? Math.min(strength, TRAN_NS[1]) : strength})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }, [color, strength]);
  // quầng lớn: đèn (ấm) hoặc phép (màu khác); quầng ấm nhỏ (0,14-0,45 m, đậm): ngọn nến, đèn dầu -> vài hạt vàng sát ngọn
  const am = mauAm(color), lon = r >= 0.45 && strength >= 0.2, nho = am && r >= 0.14 && strength >= 0.3, nguon = bui ?? (lon || nho);
  return <><mesh position={pos} renderOrder={order}><planeGeometry args={[r * 2, r * 2]} /><meshBasicMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    {nguon ? <NguonBui kieu={!lon && am ? 'nen' : am ? 'den' : 'phep'} pos={pos} r={r} mau={color} k={Math.min(1, strength / 0.5)} uuTien={1} /> : null}</>;
};

/** Figures TAKE THE LIGHT OF THE SCENE like every wall and tree around them (they used to be self-lit cards with a fixed tint, and
 *  did not sit in the picture: Daniel, 21/11/2026, "màu nhân vật ko match với màu cảnh"). A card that faces the lens gets the
 *  key at a slant, so it would come out too dark on its own; FIG_LIFT adds back a share of its own colour so a face never
 *  sinks: more in dark places, little by day. */
export const FIG_LIFT: Record<Grade, number> = {dayExterior: 0.14, lateDay: 0.16, brightInterior: 0.12, snowExterior: 0.14, nightExterior: 0.24, darkInterior: 0.3};
