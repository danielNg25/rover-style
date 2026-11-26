import React from 'react';
import {Composition} from 'remotion';
import {
  Stage, shotComp, KitShot, camPush, camTruck, camHold, liveness, litColor,
  Box, Cyl, Cone, Ball, Poly, Rect, RoundRect, Disc, Arc, Stroke, bezier, refSpace, RefPlane,
  Flame, Smoke, Puff, PopIn, StarField, Clouds, SkyBands, Birds, Weather, ClothSway, LightShaft, WaterShimmer, Crowd, BlobShadow,
  MarkCircle, MarkTick, MarkRoute, NearBlur, SignText, NameTag, prog, track, idle, deg, V3,
} from '../kit';

/* Three 2-second scenes built ONLY from the kit, as living examples for shot builders. */
const LEN = 48;

// ------------------------------------------------------------------ interior: a night inn
const innCam = camPush({pos: [0.3, 2.3, 11.5], look: [0.3, 2.1, 0], fov: 30}, {pctPerSec: 2.5});
const Inn: React.FC<{f: number}> = ({f}) => {
  const nod = track(f, [[0, 0], [14, 7], [30, -4]], 4); // innkeeper: head tips on "chủ quán", tips back later
  return (
    <Stage cam={innCam} f={f} len={LEN} mood="nightInterior" name="kit-demo-interior">
      {/* shell: floor, back wall in 2 tones, beam */}
      <Box size={[16, 0.2, 9]} pos={[0, -0.1, 0]} color="#8d6b55" />
      <Box size={[16, 7, 0.3]} pos={[0, 3.5, -3]} color="#77719a" />
      <Rect w={16} h={1.5} pos={[0, 0.75, -2.84]} color="#5b4a5e" />
      <Box size={[16, 0.35, 0.5]} pos={[0, 5.2, -2.7]} color="#4a3a48" />
      {/* window: night sky, a few stars, snow outside, a pale shaft falling in */}
      <Rect w={2.2} h={2.4} pos={[2.1, 3.1, -2.83]} color="#1c2350" />
      <StarField pos={[2.1, 3.3, -2.82]} size={[2, 1.9]} count={8} seed={4} px={[5, 8]} />
      <Poly pts={[[-1.1, -1.2], [-1.1, -0.75], [-0.3, -0.45], [0.5, -0.8], [1.1, -0.55], [1.1, -1.2]]} pos={[2.1, 3.1, -2.815]} color="#2f4a72" />
      <Weather kind="snow" pos={[2.1, 3.1, -2.8]} size={[2.1, 2.3, 0.01]} f={f} count={44} grain={0.022} seed={3} />
      {[[-1.2, 0, 0.16, 2.7], [1.2, 0, 0.16, 2.7], [0, 1.27, 2.56, 0.16], [0, -1.27, 2.56, 0.16], [0, 0, 0.1, 2.5], [0, 0, 2.4, 0.1]].map(([x, y, w, h], i) => <Rect key={i} w={w} h={h} pos={[2.1 + x, 3.1 + y, -2.79]} color="#3c2f3d" />)}
      <LightShaft pos={[2.1, 3.1, -2.6]} angle={-24} w0={2.1} w1={3.4} len={3.3} f={f} color="#c9d4ff" opacity={0.16} />
      {/* hearth with the big fire */}
      <Box size={[3.2, 3.4, 1]} pos={[-3.3, 1.7, -2.4]} color="#8c8794" />
      <Box size={[3.6, 0.3, 1.2]} pos={[-3.3, 3.5, -2.35]} color="#6f6a7a" />
      <RoundRect w={2} h={2.1} r={0.5} pos={[-3.3, 1.05, -1.89]} color="#2a2230" />
      <Rect w={1.6} h={0.16} pos={[-3.3, 0.2, -1.87]} color="#4b3a3a" />
      <Flame pos={[-3.3, 0.28, -1.86]} w={0.62} h={1.25} f={f} seed={1} embers={4} />
      {/* table, candle (second flame), stew pot with steam */}
      <Box size={[2.6, 0.14, 1.2]} pos={[0.6, 1.05, 0.4]} color="#a67c52" />
      {[-1.1, 1.1].map((x) => <Box key={x} size={[0.16, 1.05, 0.9]} pos={[0.6 + x, 0.52, 0.4]} color="#8a6444" />)}
      <Cyl r={0.06} h={0.34} pos={[1.35, 1.29, 0.5]} color="#efe6cf" />
      <Flame pos={[1.35, 1.47, 0.5]} w={0.07} h={0.2} f={f} seed={5} />
      <Cyl r={0.3} r2={0.36} h={0.36} pos={[0.2, 1.3, 0.4]} color="#3f3d4d" />
      <Smoke pos={[0.2, 1.52, 0.4]} f={f} count={5} size={0.16} rise={1.15} spread={0.22} tones={['#d9d6dc', '#c3bfca']} />
      <PopIn f={f} f0={20} pos={[0.95, 1.12, 0.7]} puffR={0.28}><Cyl r={0.1} h={0.26} pos={[0, 0.13, 0]} color="#d9a441" /></PopIn>
      {/* sign and banner */}
      <SignText text="Quán Trọ" pos={[-0.4, 4.35, -2.8]} height={0.52} color="#f3e6c0" board="#4a3a48" />
      <ClothSway kind="banner" pos={[4.6, 4.9, -2.75]} w={1.05} h={2.5} f={f} color="#a8433c" stripe="#e2b65a" seed={2} />
      {/* innkeeper (simple flat figure acting on twos) and guests */}
      <group position={[-0.9, 0, -0.6]}>
        <BlobShadow pos={[0, 0.01, 0.1]} r={0.6} />
        <Poly pts={[[-0.5, 0], [-0.42, 1.25], [-0.2, 1.5], [0.2, 1.5], [0.42, 1.25], [0.5, 0]]} color="#3f7a57" pos={[0, idle(f, 3) * 0.02, 0]} />
        <group position={[0, 1.5 + idle(f, 3) * 0.02, 0.01]} rotation={[0, 0, deg(-nod)]}>
          <Disc r={0.5} pos={[0, 0.42, 0]} color="#f0c9a0" />
          {[-0.2, 0.2].map((x) => <Disc key={x} r={0.12} pos={[x + nod * 0.006, 0.45, 0.004]} color="#fffaf0" />)}
          {[-0.2, 0.2].map((x) => <Disc key={x} r={0.05} pos={[x + nod * 0.012, 0.45, 0.008]} color="#22222c" />)}
          <Poly pts={[[-0.52, 0.55], [0, 1.02], [0.52, 0.55], [0.4, 0.78], [-0.4, 0.78]]} color="#5a3c2e" pos={[0, 0, 0.006]} />
        </group>
      </group>
      <Crowd pos={[3.4, 0, 0.2]} f={f} count={3} h={1.9} tones={['#39446b', '#6a4458', '#4c5f6e']} seed={5} />
      <NameTag text="chủ quán" pos={[-2.55, 3.05, -0.5]} height={0.42} to={[1.05, -0.62]} p={prog(f, 0, 14)} tone="white" />
      {/* near pillar at the frame edge: the one soft thing in the shot */}
      <NearBlur radius={0.035}><Box size={[0.9, 8, 0.6]} pos={[-3.0, 3, 5.2]} color="#3a2f3e" unlit /></NearBlur>
    </Stage>
  );
};
const INN: KitShot = {id: 'kit-demo-interior', len: LEN, bg: '#23233c', Scene: Inn, liveness: liveness('wideInterior', [
  {name: 'camera', kind: 'camera', note: 'push 2.5 %/s'},
  {name: 'innkeeper', kind: 'puppet', beats: [14, 30]},
  {name: 'guests', kind: 'ambient', family: 'extras'},
  {name: 'hearth fire', kind: 'ambient', family: 'flame'}, {name: 'candle', kind: 'ambient', family: 'flame'},
  {name: 'steam', kind: 'ambient', family: 'smoke'}, {name: 'banner', kind: 'ambient', family: 'cloth'}, {name: 'snow', kind: 'ambient', family: 'weather'},
  {name: 'mug pops in', kind: 'effect', beats: [20]}, {name: 'tag arrow', kind: 'effect', beats: [0]},
])};

// ------------------------------------------------------------------ exterior: a night market
const marketCam = camTruck(camPush({pos: [-0.5, 2.4, 13], look: [-0.5, 2.5, 0], fov: 30}, {pctPerSec: 1}), {pctPerSec: 2.5});
const Stall: React.FC<{x: number; z: number; awning: [string, string]; f: number}> = ({x, z, awning}) => (
  <group position={[x, 0, z]}>
    <Box size={[2.6, 1, 1.1]} pos={[0, 0.5, 0]} color="#b98a5a" />
    <Box size={[2.8, 0.1, 1.3]} pos={[0, 1.05, 0]} color="#d9b27c" />
    {/* a flat card on a lit box: litColor gives it the tone the box front really shows under this mood */}
    <Rect w={2.2} h={0.5} pos={[0, 0.5, 0.554]} color={litColor('nightExterior', '#b98a5a')} /><Rect w={2.0} h={0.3} pos={[0, 0.5, 0.558]} color={litColor('nightExterior', '#8a5a40')} />
    {[-1.25, 1.25].map((px) => <Cyl key={px} r={0.06} h={2.9} pos={[px, 1.45, -0.45]} color="#6b5444" />)}
    {[0, 1, 2, 3, 4].map((i) => <Box key={i} size={[0.6, 0.08, 1.7]} pos={[-1.2 + i * 0.6, 2.85, 0.05]} rot={[0.32, 0, 0]} color={awning[i % 2]} />)}
    {[-0.8, 0, 0.8].map((px, i) => <Ball key={px} r={0.17} pos={[px, 1.27, 0.2]} color={['#e8703a', '#e2b84a', '#c9483c'][i]} />)}
  </group>
);
const Market: React.FC<{f: number}> = ({f}) => {
  const wave = track(f, [[0, 0], [10, 1], [22, 0.3], [34, 1]], 4); // seller raises a ladle twice
  return (
    <Stage cam={marketCam} f={f} len={LEN} mood="nightExterior" name="kit-demo-exterior">
      {/* far layers: sky bands, sparse stars, clouds, two hill bands, far house blocks with lit windows */}
      <SkyBands pos={[0, 9, -40]} size={[90, 34]} colors={['#141a45', '#1c2759', '#2a3a72', '#3c5389']} shares={[3, 2, 1.4, 1]} />
      <StarField pos={[0, 13, -39]} size={[60, 14]} count={34} seed={2} />
      <Clouds pos={[0, 9.5, -34]} size={[46, 4]} f={f} count={3} scale={2.1} speed={0.5} tones={['#46578f', '#36457a', '#5a6ca4']} seed={3} />
      <Poly pts={[[-40, 0], [-40, 4], [-24, 6.4], [-10, 3.6], [4, 5.8], [20, 3.4], [40, 5.2], [40, 0]]} pos={[0, 0, -28]} color="#2c4a66" />
      <Poly pts={[[-30, 0], [-30, 2.2], [-14, 3.6], [-2, 2], [12, 3.4], [30, 1.8], [30, 0]]} pos={[0, 0, -19]} color="#234055" />
      {[[-7.5, 3.2], [-3.2, 4.4], [5.2, 3.6], [9.4, 4.8]].map(([x, h], i) => (
        <group key={i} position={[x, 0, -11]}>
          <Box size={[3.2, h, 2]} pos={[0, h / 2, 0]} color="#3d4674" />
          <Cone r={2.5} h={1.3} seg={4} pos={[0, h + 0.65, 0]} rot={[0, Math.PI / 4, 0]} color="#59486e" />
          <Rect w={0.5} h={0.7} pos={[-0.6, h * 0.6, 1.01]} color={i === 1 && f >= 26 ? '#f4d98a' : i === 1 ? '#262c52' : '#f4d98a'} />
          <Rect w={0.5} h={0.7} pos={[0.7, h * 0.6, 1.01]} color={i % 2 ? '#262c52' : '#f4d98a'} />
        </group>
      ))}
      <Box size={[60, 0.2, 40]} pos={[0, -0.1, -6]} color="#5d6788" />
      <Rect w={60} h={7} pos={[0, 0.01, 3]} rot={[-Math.PI / 2, 0, 0]} color="#6c7596" />
      {/* gate with the market sign, lantern string (flat cream shapes, no halo) */}
      {[-3.4, 3.4].map((x) => <Box key={x} size={[0.35, 5, 0.35]} pos={[x, 2.5, -3]} color="#7a3b37" />)}
      <Box size={[7.6, 0.9, 0.3]} pos={[0, 5.1, -3]} color="#93433c" />
      <SignText text="Chợ Đêm" pos={[0, 5.1, -2.84]} height={0.62} color="#f6e7b4" />
      <Stroke pts={bezier([-3.3, 4.5], [0, 3.5], [3.3, 4.5])} width={0.035} color="#2a2538" pos={[0, 0, -2.8]} />
      {[0.15, 0.32, 0.5, 0.68, 0.85].map((t, i) => { const p = bezier([-3.3, 4.5], [0, 3.5], [3.3, 4.5], 20)[Math.round(t * 20)]; return <RoundRect key={i} w={0.3} h={0.4} r={0.11} pos={[p[0], p[1] - 0.24, -2.79]} color={i % 2 ? '#f2cf7a' : '#f6e3a6'} />; })}
      {/* stalls, flags, brazier */}
      <Stall x={-4.6} z={-0.6} awning={['#c9483c', '#f1e6cc']} f={f} />
      <Stall x={3.9} z={-1.2} awning={['#3f7f8c', '#f1e6cc']} f={f} />
      <Cyl r={0.05} h={6} pos={[-7.6, 3, -2.2]} color="#6b5444" />
      <ClothSway kind="flag" pos={[-7.55, 5.55, -2.2]} w={1.3} h={0.7} f={f} color="#d9a441" stripe="#c9483c" seed={1} />
      <Cyl r={0.05} h={4} pos={[6.6, 2, -2.6]} color="#6b5444" />
      <ClothSway kind="flag" pos={[6.65, 3.6, -2.6]} w={1.1} h={0.6} f={f} color="#5fa37a" seed={4} amp={0.08} />
      <Cyl r={0.42} r2={0.55} h={0.6} pos={[-0.9, 0.3, 0.8]} color="#3a3948" />
      <Flame pos={[-0.9, 0.6, 0.8]} w={0.42} h={0.95} f={f} seed={2} embers={5} />
      <Smoke pos={[-0.9, 1.6, 0.75]} f={f} count={5} size={0.24} rise={2.2} tones={['#56608a', '#4a547c']} seed={2} />
      {/* soup seller (flat figure on twos) and shoppers */}
      <group position={[-2.5, 0, -0.2]}>
        <BlobShadow pos={[0, 0.02, 0.1]} r={0.7} />
        <Poly pts={[[-0.6, 0], [-0.45, 2.05], [-0.2, 2.3], [0.2, 2.3], [0.45, 2.05], [0.55, 0.9]]} color="#7a4a8c" pos={[0, idle(f, 9) * 0.02, 0]} />
        <group position={[0.42, 2.0, 0.02]} rotation={[0, 0, deg(-20 + wave * 95)]}><Stroke pts={[[0, 0], [0.62, 0]]} width={0.17} color="#7a4a8c" /><Disc r={0.11} pos={[0.66, 0, 0.002]} color="#f0c9a0" /><Stroke pts={[[0.66, 0], [0.66, 0.5]]} width={0.05} color="#b9b3a6" pos={[0, 0, 0.003]} /></group>
        <Disc r={0.46} pos={[0, 2.68 + idle(f, 9) * 0.02, 0.01]} color="#f0c9a0" />
        <Poly pts={[[-0.7, 2.95], [0, 3.4], [0.7, 2.95]]} color="#e6d3a0" pos={[0, idle(f, 9) * 0.02, 0.014]} />
        {[-0.17, 0.19].map((x) => <Disc key={x} r={0.1} pos={[x, 2.68, 0.016]} color="#fffaf0" />)}
        {[-0.17, 0.19].map((x) => <Disc key={x} r={0.045} pos={[x + 0.03 * wave, 2.68, 0.02]} color="#22222c" />)}
      </group>
      <Crowd pos={[3.3, 0, 1.6]} f={f} count={5} h={1.75} gap={1.05} tones={['#2c3358', '#3f3a5e', '#2f4a5a']} seed={8} depth={1.2} />
      {[1.7, 3.3, 5.1].map((x) => <BlobShadow key={x} pos={[x, 0.02, 1.7]} r={0.9} opacity={0.16} />)}
      <NameTag text="bà bán phở" pos={[-6.2, 3.8, -0.2]} height={0.46} to={[3.0, -0.4]} p={prog(f, 0, 14)} tone="white" />
      <Rect w={5} h={1.5} pos={[1.5, 0.03, 4.2]} rot={[-Math.PI / 2, 0, 0]} color="#3c5389" />
      <WaterShimmer pos={[1.5, 0.05, 4.2]} size={[4.4, 1.1]} f={f} count={8} dash={0.6} color="#9fb6e6" />
      <Birds pos={[-4, 8.6, -16]} f={f} count={3} size={0.34} span={[5, 1.4]} speed={1.3} color="#0f1330" seed={2} />
    </Stage>
  );
};
const MARKET: KitShot = {id: 'kit-demo-exterior', len: LEN, bg: '#141a45', Scene: Market, liveness: liveness('wideExterior', [
  {name: 'camera', kind: 'camera', note: 'truck 2.5 %/s with 1 %/s push'},
  {name: 'seller', kind: 'puppet', beats: [10, 22, 34]}, {name: 'shoppers', kind: 'ambient', family: 'extras'},
  {name: 'flags', kind: 'ambient', family: 'cloth'}, {name: 'clouds', kind: 'ambient', family: 'sky'}, {name: 'bats', kind: 'ambient', family: 'sky'},
  {name: 'brazier', kind: 'ambient', family: 'flame'}, {name: 'smoke', kind: 'ambient', family: 'smoke'}, {name: 'canal glints', kind: 'ambient', family: 'water'},
  {name: 'window lights up', kind: 'state', beats: [26]}, {name: 'tag arrow', kind: 'effect', beats: [0]},
])};

// ------------------------------------------------------------------ space: laid out in frame pixels
const SP = {cam: [0, 0, 20] as V3, fov: 28};
const M = refSpace(SP);
const spaceCam = camHold(camPush({pos: SP.cam, look: [0, 0, 0], fov: SP.fov}, {pctPerSec: 2}), {driftPctPerSec: 0.8, seed: 2});
const Space: React.FC<{f: number}> = ({f}) => {
  const route: [number, number][] = bezier([330, 430], [560, 150], [800, 330], 30);
  const hop = prog(f, 6, 30), i = Math.min(30, Math.round(hop * 30)), probe = route[i];
  return (
    <Stage cam={spaceCam} f={f} len={LEN} mood="space" bg="#12142e" name="kit-demo-space">
      <StarField pos={[0, 0, -30]} size={[40, 22]} count={46} seed={6} px={[6, 12]} />
      <Clouds pos={M.pt(900, 600, -18)} size={[10, 1.2]} f={f} count={2} scale={1.5} speed={0.25} tones={['#2a2d5c', '#20234c', '#373b72']} seed={4} />
      {/* home planet (a real lit ball) with a flat ring and a small moon */}
      <Ball r={2.3} pos={M.pt(250, 520, -2)} color="#3f8f86" />
      <RefPlane m={M} z={0.4}>
        <Disc r={46} pos={[205, 470, 0]} color="#6fbf9a" /><Disc r={24} pos={[300, 560, 0]} color="#6fbf9a" />
      </RefPlane>
      <Ball r={1.25} pos={M.pt(960, 250, -2)} color="#c9674a" />
      <group position={M.pt(960, 250, -0.6)} rotation={[deg(72), 0, deg(-14 + f * 0.12)]}><Arc r1={1.7} r2={2.15} color="#e3b77a" /><Arc r1={2.25} r2={2.4} color="#b98a5a" /></group>
      {/* station plate with its name */}
      <group position={M.pt(1010, 470, 1)}>
        <RoundRect w={3.3} h={0.82} r={0.14} color="#e8e2d0" /><SignText text="Trạm Sao Hỏa" pos={[0, 0, 0.02]} height={0.46} color="#22243e" />
        <Stroke pts={[[-0.9, 0.4], [-0.75, 1.5]]} width={0.045} color="#e8e2d0" pos={[0, 0, -0.01]} />
        {/* beacon: a flat lamp that switches tone every half second (a light state, no glow) */}
        <Disc r={0.1} pos={[-0.75, 1.58, 0]} color={Math.floor(f / 12) % 2 ? '#f2cf7a' : '#8a5a3a'} />
      </group>
      {/* dotted route draws on; the probe rides its head with a thruster flame (a flame gets NO glow) */}
      <RefPlane m={M} z={1}>
        <MarkRoute pts={route} p={hop} width={5} color="#f2cf7a" />
        <group position={[probe[0], probe[1], 2]} scale={1.5}>
          <group scale={[1, -1, 1]} rotation={[0, 0, deg(-30 + idle(f, 2) * 4)]}>
            <Flame pos={[-17, 0, -0.5]} w={8} h={26} f={f} seed={3} colors={['#5fd0e6', '#a8ecf2', '#f4ffff']} />
          </group>
          <group scale={[1, -1, 1]} rotation={[0, 0, deg(-30 + idle(f, 2) * 4) - Math.PI / 2]} position={[0, 0, 0.5]}>
            <RoundRect w={30} h={20} r={5} color="#e8e2d0" /><Rect w={9} h={36} pos={[0, 28, 0]} color="#4f6fb0" /><Rect w={9} h={36} pos={[0, -28, 0]} color="#4f6fb0" /><Disc r={5} pos={[6, 0, 0.5]} color="#22243e" />
          </group>
        </group>
        {hop >= 1 ? <MarkCircle pos={[800, 330, 3]} r={34} p={prog(f, 36, 8)} color="#f2cf7a" /> : null}
        <Puff pos={[800, 330, 4]} f={f} f0={36} r={30} color="#f6efd8" />
      </RefPlane>
      <PopIn f={f} f0={38} pos={M.pt(1085, 180, 1.2)} puff={false}><MarkTick size={0.5} color="#8fe08a" pos={[0, 0, 0]} /></PopIn>
      <NameTag text="tàu thăm dò" pos={M.pt(70, 175, 1)} height={0.44} to={[3.0, -3.0]} p={prog(f, 0, 14)} tone="white" />
    </Stage>
  );
};
const SPACE: KitShot = {id: 'kit-demo-space', len: LEN, bg: '#12142e', Scene: Space, liveness: liveness('abstract', [
  {name: 'camera', kind: 'camera', note: 'push 2 %/s with drift'},
  {name: 'probe', kind: 'puppet', beats: [6, 36]}, {name: 'route draws on', kind: 'effect', beats: [6]},
  {name: 'arrival circle + puff', kind: 'effect', beats: [36]}, {name: 'tick', kind: 'effect', beats: [38]},
  {name: 'thruster', kind: 'ambient', family: 'flame'}, {name: 'nebula', kind: 'ambient', family: 'sky'},
  {name: 'ring planet', kind: 'ambient', family: 'mechanical', note: 'rings tilt slowly'}, {name: 'station beacon', kind: 'ambient', family: 'light', note: 'flat lamp switching every 12 f'},
])};

export const KIT_DEMOS = [INN, MARKET, SPACE];
const COMPS = KIT_DEMOS.map((s) => ({s, C: shotComp(s)}));
export const KitDemoComps: React.FC = () => <>{COMPS.map(({s, C}) => <Composition key={s.id} id={s.id} component={C} width={1280} height={720} fps={24} durationInFrames={s.len} />)}</>;
