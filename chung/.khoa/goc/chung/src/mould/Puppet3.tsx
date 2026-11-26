import React, {useMemo, useContext, useRef} from 'react';
import {getInputProps} from 'remotion';
import * as THREE from 'three';
import {paint, Spec, boxOf, SOLE_Y, CENTRE_X, HAIR_TOP} from './draw';
import {resolvePosture} from './dang';
import {ContactShade, GradeCtx, FIG_TINT, FIG_LIFT, Halo, BONG_NGUOI, NGUOI_AN_DEN} from '../lib3/look';

/** PHYSICS CHECK (tools/vatly.py renders with --props '{"phys":0.12}'; Daniel, 21/11/2026: a hand went through a wall clock).
 *  A figure is a flat card, so "passing through a thing" shows as the thing hiding part of the card from just in front of it.
 *  PHYS = the body's half thickness in metres. With it on, every figure also draws three flat marks over the finished picture:
 *    MAGENTA where something of the set stands within PHYS IN FRONT of the card and hides the figure (the figure is inside it),
 *    GREEN   where the figure is hidden by something further in front (a desk it stands behind: fine),
 *    BLUE    where something stands within PHYS BEHIND the figure (a back or a hand sunk into a wall); the feet are left out.
 *  The marks are the same card pushed towards or away from the lens along the lines of sight, so they cover the figure exactly. */
/** Tấm người không vẽ vào bản đồ bóng của đèn (bóng của người là tấm bóng chiếu, xem dưới), nhưng vẫn NHẬN bóng của đồ vật. */
/** [phần độ sáng, phần màu] của đèn mà người nhận; REMOTION_THU_AN_DEN="sang,mau" đổi cho một lần dựng (vd "1,0" = cách vẽ trước 26/11/2026) */
const AN_DEN: [number, number] = (() => { const t = typeof process !== 'undefined' ? process.env.REMOTION_THU_AN_DEN : undefined; if (t) { const [a, b] = t.split(',').map(Number); if (isFinite(a) && isFinite(b)) return [a, b]; } return [NGUOI_AN_DEN.sang, NGUOI_AN_DEN.mau]; })();
const KHONG_VAO_BONG = new THREE.MeshDepthMaterial({colorWrite: false, depthWrite: false}), KHONG_VAO_BONG_D = new THREE.MeshDistanceMaterial({colorWrite: false, depthWrite: false});
const PHYS = Number((getInputProps() as {phys?: number}).phys ?? 0);
const Mark: React.FC<{map: THREE.Texture; color: string; shift: number; order: number; args: [number, number]; position: [number, number, number]; scale: [number, number, number]}> = ({map, color, shift, order, args, position, scale}) => {
  const ref = useRef<THREE.Mesh>(null);
  const push = (_r: unknown, _s: unknown, cam: THREE.Camera) => {
    const m = ref.current; if (!m || !shift) return;
    const eye = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld), depth = -new THREE.Vector3().setFromMatrixPosition(m.matrixWorld).applyMatrix4(cam.matrixWorldInverse).z, k = Math.max(0.05, 1 + shift / depth);
    m.matrixWorld.premultiply(new THREE.Matrix4().makeTranslation(eye.x, eye.y, eye.z).multiply(new THREE.Matrix4().makeScale(k, k, k)).multiply(new THREE.Matrix4().makeTranslation(-eye.x, -eye.y, -eye.z)));
  };
  return <mesh ref={ref} position={position} scale={scale} renderOrder={order} onBeforeRender={push}><planeGeometry args={args} /><meshBasicMaterial map={map} color={color} transparent alphaTest={0.5} depthFunc={THREE.GreaterDepth} depthWrite={false} fog={false} toneMapped={false} /></mesh>;
};

/** A mould figure on the 3D stage: one flat card whose picture is repainted whenever the pose changes.
 *  The card is cut out by its alpha, so a shadow-casting light throws the figure's real outline on the set and the
 *  shadow follows every pose (catalogue 6.1). height = world height from the soles to the top of the hair.
 *  tint multiplies the colours (night scenes darken the figure without changing its hue, catalogue 6.3). */
export const Puppet3: React.FC<{spec: Spec; height: number; pos?: [number, number, number]; flip?: boolean; tint?: string; res?: number; rotY?: number; lit?: boolean; lift?: number;
  /** order = place in the drawing order (500: after the set's flat pieces; a low number puts the figure INSIDE a picture, behind
   *  things drawn later, such as the rim of a door of light); cast = shadow and contact shade; opacity = to fade the figure in or out */
  order?: number; cast?: boolean; opacity?: number;
  /** noShadow = the figure throws NO shadow at all. `cast={false}` alone is not enough: the stage uses VSMShadowMap, which also draws
   *  every mesh that RECEIVES shadows into the shadow map (skill 2), so a lit figure with cast={false} still darkens the wall behind
   *  it. noShadow turns both off (the figure then takes no shadows either). Found on d1c4-21, 23/11/2026. */
  noShadow?: boolean;
  /** glow = strength of the bloom of a hot mask (1 = as designed; 0 = none) */
  glow?: number;
  /** bong = độ đậm bóng của người này (mặc định theo loại cảnh: BONG_NGUOI trong look.tsx; 0 = không bóng) */
  bong?: number;
  /** anSang, anMau = người nhận bao nhiêu phần ĐỘ SÁNG và MÀU của đèn trong cảnh (0..1). Mặc định NGUOI_AN_DEN của look.tsx (0,05 và 0,15):
   *  người vẽ đúng màu riêng như video gốc, gần như không sáng tối theo đèn, chỉ phủ một lớp màu nhẹ của cảnh (Daniel 26/11/2026).
   *  anMau 0,5–1 cho người đứng sát một HIỆU ỨNG (phép, cổng, lửa lớn: bảng chấm mục 8); anSang 1 cho hình bóng tối trước đèn mạnh. */
  anSang?: number;
  anMau?: number}> =
  ({spec, height, pos = [0, 0, 0], flip, tint: tintIn, res = 2, rotY = 0, lit = true, lift: liftIn, order = 500, cast: castIn = true, opacity = 1, glow = 1, noShadow = false, bong, anSang, anMau}) => {
    const LUAT_CU = typeof process !== 'undefined' && process.env.REMOTION_SOI_BONG === 'luat-cu';
    const SOI_DO = typeof process !== 'undefined' && process.env.REMOTION_SOI_BONG === 'bong-do';   // soi lỗi: tô đỏ đặc tấm bóng của người để thấy nó nằm ở đâu
    const cast = castIn && !noShadow, BOX = boxOf(spec);   // a body lying along the ground has a wider card; everyone else BOX
    // lit (default): the figure takes the scene's key, fill, lamps and shadows like the set around it, plus a small lift of its own
    // colour (FIG_LIFT). lit={false}: the old self-lit card with a fixed tint by kind of place.
    const grade = useContext(GradeCtx), tint = tintIn ?? (lit ? '#ffffff' : FIG_TINT[grade]), lift = liftIn ?? FIG_LIFT[grade];   // lift = 0: a figure against a bright light stays a dark shape
    // outline: the texture's own anti-aliased edge is BLENDED (alphaTest only drops the empty part), so the silhouette is smooth;
    // a hard alpha cut at 0.5 left a stair-stepped edge
    const canvas = useMemo(() => document.createElement('canvas'), []);
    const tex = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; return t; }, [canvas]);
    const key = JSON.stringify(spec);
    // khi tấm đổi cỡ (đứng <-> dáng đánh nhau, nằm...) phải huỷ texture cũ: WebGL giữ cỡ cũ nên hình bị phóng to, trông như nhân vật phình ra rồi co lại (Daniel, 23/11/2026)
    useMemo(() => { const w0 = canvas.width, h0 = canvas.height; paint(canvas, spec, res); if (w0 !== canvas.width || h0 !== canvas.height) tex.dispose(); tex.needsUpdate = true; }, [key, res]);
    // the figure's outline in plain white (and one without the feet), for the physics marks
    const masks = useMemo(() => { if (!PHYS) return null; const mk = () => { const c = document.createElement('canvas'), t = new THREE.CanvasTexture(c); return {c, t}; }; return {all: mk(), noSole: mk(), noFeet: mk()}; }, []);
    useMemo(() => {
      if (!masks) return;
      // noSole: the sole line itself lies ON the ground, and paving laid a centimetre over the ground would mark every shoe
      for (const [m, cut] of [[masks.all, 0], [masks.noSole, 0.02], [masks.noFeet, 0.1]] as const) {
        m.c.width = canvas.width; m.c.height = canvas.height; const x = m.c.getContext('2d')!;
        x.drawImage(canvas, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, m.c.width, m.c.height);
        if (cut) { x.globalCompositeOperation = 'destination-out'; x.fillRect(0, m.c.height * (1 - (BOX.y + BOX.h - SOLE_Y) / BOX.h - cut), m.c.width, m.c.height); }
        m.t.needsUpdate = true;
      }
    }, [key, res, masks]);
    const u = height / (SOLE_Y - HAIR_TOP), w = BOX.w * u, h = BOX.h * u;
    // NGƯỜI VẼ ĐÚNG MÀU RIÊNG, NHƯ VIDEO GỐC (26/11/2026): ánh sáng được tính trên nền trắng, tách thành ĐỘ SÁNG và MÀU của đèn. Màu của người chỉ nhân
    // với một phần nhỏ độ sáng đó (uAnSang) và một phần nhỏ màu đó (uAnMau): người không tối đi ở cảnh đêm, không trắng bệch cạnh lửa, chỉ ngả nhẹ
    // theo màu của cảnh. Luật cũ (uCu = 1, REMOTION_SOI_BONG=luat-cu): màu người nhân thẳng với đèn rồi cộng phần tự sáng.
    const uAnMau = useMemo(() => ({value: 0}), []), uAnSang = useMemo(() => ({value: 0}), []), uLift = useMemo(() => ({value: 0}), []), uCu = useMemo(() => ({value: 0}), []);
    uAnSang.value = anSang ?? AN_DEN[0]; uAnMau.value = anMau ?? AN_DEN[1]; uLift.value = lift; uCu.value = LUAT_CU ? 1 : 0;
    const giuMau = useMemo(() => (sh: {uniforms: Record<string, unknown>; fragmentShader: string}) => {
      Object.assign(sh.uniforms, {uAnMau, uAnSang, uLift, uCu});
      const goc = 'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;';
      if (!sh.fragmentShader.includes(goc)) { console.warn('[người vẽ đúng màu riêng] three đổi shader Lambert: chưa cài được'); return; }
      sh.fragmentShader = 'uniform float uAnMau;\nuniform float uAnSang;\nuniform float uLift;\nuniform float uCu;\n' + sh.fragmentShader
        .replace('#include <lights_lambert_fragment>', '#include <lights_lambert_fragment>\n\tmaterial.diffuseColor = vec3( 1.0 );')
        .replace(goc, ['vec3 anhSang = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;',
          'float doSang = dot( anhSang, vec3( 0.2126, 0.7152, 0.0722 ) );',
          'vec3 sacDen = anhSang / max( doSang, 0.0001 );',                                         // màu của đèn, đã bỏ độ sáng
          'float sangNguoi = mix( 1.0, min( doSang + uLift, 1.6 ), uAnSang );',                     // 1 = đúng màu riêng
          'vec3 mauMoi = diffuseColor.rgb * sangNguoi * mix( vec3( 1.0 ), sacDen, uAnMau );',
          'vec3 mauCu = diffuseColor.rgb * anhSang + totalEmissiveRadiance;',
          'vec3 outgoingLight = mix( mauMoi, mauCu, uCu );'].join('\n\t'));
    }, [uAnMau, uAnSang, uLift, uCu]);
    // BÓNG CỦA NGƯỜI: một tấm mang hình bóng của chính nhân vật (cùng tư thế, mép nhoè khoảng 6 cm), `autoReceive` (lib3/kit.tsx) ngả nó xuống đất
    // theo hướng đèn chính mỗi lần dựng. Tấm người không còn vào bản đồ bóng (KHONG_VAO_BONG), nên mỗi người chỉ có đúng một bóng.
    const coBong = cast && !LUAT_CU && lit;
    const bongCv = useMemo(() => document.createElement('canvas'), []);
    const bongTex = useMemo(() => { const t = new THREE.CanvasTexture(bongCv); t.colorSpace = THREE.SRGBColorSpace; return t; }, [bongCv]);
    useMemo(() => {
      if (!coBong) return;
      const k = 0.25, W = Math.max(8, Math.round(canvas.width * k)), H = Math.max(8, Math.round(canvas.height * k));
      const tam = document.createElement('canvas'); tam.width = W; tam.height = H; const a = tam.getContext('2d')!;
      a.drawImage(canvas, 0, 0, W, H); a.globalCompositeOperation = 'source-in'; a.fillStyle = '#ffffff'; a.fillRect(0, 0, W, H);
      if (bongCv.width !== W || bongCv.height !== H) { bongCv.width = W; bongCv.height = H; bongTex.dispose(); }
      const c = bongCv.getContext('2d')!; c.clearRect(0, 0, W, H); c.filter = `blur(${Math.max(1, 0.03 * H / h).toFixed(1)}px)`; c.drawImage(tam, 0, 0); c.filter = 'none';
      bongTex.needsUpdate = true;
    }, [key, res, coBong, h]);
    const Pa = spec.posture !== undefined ? resolvePosture(spec.posture) : null, rise = Pa?.rise ?? 0, acting = (Pa?.hanh ?? 0) > 0;   // dáng đánh nhau: rời đất (bóng tiếp đất nhạt dần theo độ cao)
    // where a hot mask's glow sits: the middle of the mask, in the card's own space (see doomGlow in draw.ts for the painted part)
    const hot = !acting && spec.outfit === 'doom' && spec.view !== 'back' && spec.mask !== 'none' && spec.mask !== 'dark' ? (spec.mask === 'hot' ? 1 : Math.max(0, Math.min(1, spec.heat ?? 0))) : 0;
    const hotX = ((spec.head?.dx ?? 0) + (spec.hip ?? 0)) * u * (flip ? -1 : 1), hotY = (SOLE_Y - (356 + (spec.head?.dy ?? 0) - (spec.hipDy ?? 0) + (spec.sit ? 88 : 0))) * u;
    // card centre relative to the point between the soles
    const cx = (BOX.x + BOX.w / 2 - CENTRE_X) * u * (flip ? -1 : 1), cy = (SOLE_Y - (BOX.y + BOX.h / 2)) * u;
    return (
      <group position={[pos[0] + (spec.x ?? 0) * u * (flip ? -1 : 1), pos[1], pos[2]]} rotation={[0, rotY, 0]}>
        <group position={[0, Math.max(0, spec.y ?? 0) * u + (rise - (Pa?.cardUp ?? 0)) * u, 0]} scale={[1, 1 + Math.min(0, spec.y ?? 0) / 1200, 1]}>{/* the lean is drawn inside the figure (upper body only): the feet stay flat on the ground */}
        <mesh position={[cx, cy, 0]} scale={[flip ? -1 : 1, 1, 1]} castShadow={cast && LUAT_CU} receiveShadow={lit && !noShadow} userData={{noRecv: !!noShadow, laNguoi: true}} renderOrder={order} customDepthMaterial={LUAT_CU ? undefined : KHONG_VAO_BONG} customDistanceMaterial={LUAT_CU ? undefined : KHONG_VAO_BONG_D}>
          <planeGeometry args={[w, h]} />
          {lit ? <meshLambertMaterial map={tex} color={tint} emissiveMap={tex} emissive={new THREE.Color(lift, lift, lift)} transparent opacity={opacity} alphaTest={0.06 * opacity} depthWrite={false} side={THREE.DoubleSide} onBeforeCompile={giuMau as never} customProgramCacheKey={() => 'nguoi-ve-dung-mau-rieng-26-11'} fog={false} />
            : <meshBasicMaterial map={tex} color={tint} transparent opacity={opacity} alphaTest={0.06 * opacity} depthWrite={false} side={THREE.DoubleSide} fog={false} />}
        </mesh>
        {/* a hot mask (Doom, heat > 0) shines. The wide bloom is drawn BEHIND the card: it shows in the air round the head and does
            not wash the hood (drawn over the card it turned the whole hood yellow in close shots; the light ON the hood is painted by
            the mould, doomGlow). Only a small glare lies over the middle of the plate. glow scales both. */}
        {hot > 0.08 ? <>
          <Halo pos={[hotX, hotY, -0.02]} r={360 * u * (0.8 + 0.4 * hot)} color="#ff8436" strength={0.62 * hot * opacity * glow} order={order - 1} />
          {hot > 0.45 ? <Halo pos={[hotX, hotY - 40 * u, 0.025]} r={120 * u} color="#fff0c8" strength={0.3 * ((hot - 0.45) / 0.55) * opacity * glow} order={order + 2} /> : null}
        </> : null}
        {masks && <>
          <Mark map={masks.noFeet.t} color="#0000ff" shift={PHYS} order={989} args={[w, h]} position={[cx, cy, 0]} scale={[flip ? -1 : 1, 1, 1]} />
          <Mark map={masks.noSole.t} color="#ff00ff" shift={0} order={990} args={[w, h]} position={[cx, cy, 0]} scale={[flip ? -1 : 1, 1, 1]} />
          <Mark map={masks.all.t} color="#00ff40" shift={-PHYS} order={991} args={[w, h]} position={[cx, cy, 0]} scale={[flip ? -1 : 1, 1, 1]} />
        </>}
        </group>
        {/* Người chỉ có MỘT bóng là bóng đổ thật; vệt tròn dưới chân đã bỏ (Daniel 25/11/2026: "chỉ dùng 1 bóng, bỏ vệt tròn"). Vệt chỉ còn khi dựng ảnh TRƯỚC với REMOTION_SOI_BONG=luat-cu. */}
        {cast && LUAT_CU && <group scale={[1, 1, 0.45]}><ContactShade r={height * 0.2} strength={0.36 * Math.max(0.25, 1 - rise / 500)} /></group>}
        {/* BÓNG CỦA NGƯỜI: tấm hình bóng nằm trên đất; chỗ và hướng do autoReceive đặt (ẩn cho tới khi được đặt, để canvas không có StageCam / AutoRecv không hiện một tấm đen đứng) */}
        {coBong && <mesh visible={false} matrixAutoUpdate={false} frustumCulled={false} renderOrder={2.5 /* trên các tấm dán mặt đất (thảm, vòng tro, vạch đường: tới 2), dưới hình phẳng (3) */}
          userData={{bongChieu: {cx, cy, yOff: Math.max(0, spec.y ?? 0) * u + (rise - (Pa?.cardUp ?? 0)) * u, sy: 1 + Math.min(0, spec.y ?? 0) / 1200, fx: flip ? -1 : 1, cao: height}}}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={bongTex} color={SOI_DO ? '#ff0000' : '#141828'} transparent opacity={SOI_DO ? 1 : (bong ?? BONG_NGUOI[grade] ?? 0.24) * opacity * Math.max(0.35, 1 - rise / 700)} depthWrite={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
        </mesh>}
      </group>
    );
  };
