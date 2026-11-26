import React, {useMemo} from 'react';
import {AbsoluteFill, Still, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {SnowPine, Boulder, Tuft, SnowField} from '../lib3/nature';
import {SceneLight, FacetLathe, Ground, GRADES, Grain, distanceFor, Scene3, Finish} from '../lib3/look';
import {Facade, Stall, Bunting, stageCast} from '../lib3/town';
import {Foliage, Pic2D} from '../lib3/flat';
import {Wall, Paper, Studs, Scatter, useSurface, useWear, Sign, Awning} from '../lib3/detail';
import {Puppet3} from '../mould/Puppet3';
import {EXPR} from '../mould/expr';
import {getInputProps} from 'remotion';

/** Piece gate: library pieces staged like one reference frame (frame 2905, right two thirds: a pine, a boulder, tufts,
 *  the snow field, a mauve hill and a slate ridge), so each piece can be laid next to the reference crop. */
const Scene: React.FC = () => {
  const {camera, scene} = useThree(), c = camera as THREE.PerspectiveCamera;
  c.position.set(0, 0.9, 2.0); c.fov = 28; c.lookAt(0, 0.96, 0); c.updateProjectionMatrix();
  scene.background = useMemo(() => new THREE.Color(GRADES.snowExterior.bg), []);
  const hill = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-9, 0); s.absellipse(-1.5, 0, 7.5, 5.6, Math.PI, 0, true); return new THREE.ShapeGeometry(s, 40); }, []);
  const ridge = useMemo(() => { const s = new THREE.Shape(); [[-2, 0], [5, 4.4], [9, 3.2], [14, 5], [14, 0]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); return new THREE.ShapeGeometry(s); }, []);
  return (
    <>
      <SceneLight grade="snowExterior" />
      <mesh geometry={hill} position={[1.5, 0.2, -20]}><meshBasicMaterial color="#a69cab" /></mesh>
      <mesh geometry={ridge} position={[2.5, 0.2, -18]}><meshBasicMaterial color="#5c6283" /></mesh>
      <SnowField pos={[0, 0, -8]} />
      <SnowPine pos={[2.47, 0, -12]} h={7.4} />
      <SnowPine pos={[7.6, 0, -15]} h={6.2} />
      <Boulder pos={[0.88, 0, -3.78]} s={0.84} seed={2} />
      <Boulder pos={[3.3, 0, -4.6]} s={0.34} seed={5} />
      <Tuft pos={[0.42, 0.01, -3.1]} s={0.3} seed={3} /><Tuft pos={[3.6, 0.01, -6.4]} s={0.4} seed={7} />
    </>
  );
};
const Match: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Scene /></ThreeCanvas></AbsoluteFill>; };

/** Not in the reference film: a street corner by day, built only from the shared look (lib3/look) and the shared
 *  richness rules (lib3/detail). `rich` off = the look alone, to measure what the rules add. */
const NewThings: React.FC<{rich: boolean; gain?: number}> = ({rich, gain = 1}) => {
  const {camera, scene} = useThree(), c = camera as THREE.PerspectiveCamera;
  c.position.set(0.3, 1.5, 8.6); c.fov = 28; c.lookAt(0.3, 1.5, 0); c.updateProjectionMatrix();
  scene.background = useMemo(() => new THREE.Color(GRADES.dayExterior.bg), []);
  const slabs = useSurface('slabs', 4), gwear = useWear(9, 0.5, false);
  const keep: [number, number, number][] = [[-1.7, 0.2, 0.6], [-0.55, 0.9, 0.4], [0.75, 0.1, 0.8], [-3.3, -0.4, 0.4], [-2.6, 1.9, 0.4], [3.5, 0.9, 0.7], [2.0, 1.4, 0.8]];
  return (
    <>
      <SceneLight grade="dayExterior" gain={gain} />
      <Ground near="#b9b3a6" far="#8f8b84" size={[60, 40]} swell={0.012} patch={0.05} farAt={0.6} pos={[0, 0, -8]} map={rich ? slabs : undefined} tile={1.6} wear={rich ? gwear : undefined} />
      {rich ? (
        <Wall pos={[0, 0, -2.2]} w={18} h={3.6} color="#a8523d" kind="brick" seed={3}>
          <Paper x={-2.6} y={1.7} seed={2} /><Paper x={-1.95} y={1.62} rot={4} tone="#e6dcc2" accent="#3f6a8a" seed={5} w={0.42} h={0.56} />
          <mesh position={[3.2, 1.9, 0]}><planeGeometry args={[1.5, 1.2]} /><meshLambertMaterial color="#2f3440" /></mesh>
          <mesh position={[3.2, 1.9, 0.004]}><planeGeometry args={[1.34, 1.04]} /><meshLambertMaterial color="#8fb3c9" /></mesh>
          {[-0.4, 0.15].map((dx) => <mesh key={dx} position={[3.2 + dx, 1.9, 0.008]} rotation={[0, 0, -0.5]}><planeGeometry args={[0.07, 1.3]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.55} /></mesh>)}
          <mesh position={[3.2, 1.28, 0.06]}><boxGeometry args={[1.7, 0.08, 0.14]} /><meshLambertMaterial color="#d9cdb8" /></mesh>
          <Sign text="Bakery" x={3.2} y={3.0} w={2.3} h={0.5} />
          <Awning x={3.2} y={2.72} w={2.1} />
          <mesh position={[-4.6, 1.9, 0]}><planeGeometry args={[1.1, 2.3]} /><meshLambertMaterial color="#3d2f28" /></mesh>
          <mesh position={[-4.6, 1.9, 0.004]}><planeGeometry args={[0.9, 2.1]} /><meshLambertMaterial color="#5a7a5c" /></mesh>
          <mesh position={[-4.25, 1.8, 0.03]}><sphereGeometry args={[0.045, 8, 6]} /><meshLambertMaterial color="#d8c27a" /></mesh>
        </Wall>
      ) : <mesh position={[0, 1.65, -2.2]} receiveShadow><planeGeometry args={[16, 3.3]} /><meshLambertMaterial color="#a8523d" /></mesh>}
      {rich ? <mesh position={[0, 0.07, -1.2]} receiveShadow castShadow><boxGeometry args={[16, 0.14, 0.9]} /><meshLambertMaterial color="#9d9890" /></mesh> : null}
      {/* litter bin */}
      <FacetLathe profile={[[0.3, 0], [0.34, 0.08], [0.36, 0.86], [0.4, 0.9], [0.4, 0.98], [0.26, 1.04]]} sides={10} s={1} color="#3f6a58" pos={[-1.7, 0, 0.2]} tones={rich ? [0.8, 1, 1.18, 1.18, 0.9] : [1, 1, 1, 1, 1]} contact={rich} />
      {rich ? <><Studs pos={[-1.7, 0, 0.2]} r={0.365} y={0.8} n={10} /><FacetLathe profile={[[0.365, 0.4], [0.365, 0.52]]} sides={10} s={1} color="#e9dfc2" pos={[-1.7, 0, 0.2]} contact={false} tones={[1]} /></> : null}
      {/* bollard */}
      <FacetLathe profile={[[0.2, 0], [0.2, 0.06], [0.13, 0.12], [0.13, 0.78], [0.17, 0.84], [0.17, 0.92], [0.08, 1.0]]} sides={8} s={1} color="#2f3440" pos={[-0.55, 0, 0.9]} tones={rich ? undefined : [1, 1, 1, 1, 1, 1]} contact={rich} />
      {rich ? <FacetLathe profile={[[0.135, 0.6], [0.135, 0.7]]} sides={8} s={1} color="#e6c84a" pos={[-0.55, 0, 0.9]} contact={false} tones={[1]} /> : null}
      {/* planter with a clipped bush */}
      <FacetLathe profile={[[0.42, 0], [0.5, 0.1], [0.56, 0.52], [0.6, 0.58], [0.52, 0.62]]} sides={8} s={1} color="#b9a184" pos={[0.75, 0, 0.1]} tones={rich ? undefined : [1, 1, 1, 1]} contact={rich} />
      <FacetLathe profile={[[0.3, 0.6], [0.52, 0.82], [0.5, 1.12], [0.3, 1.32]]} sides={7} s={1} color="#4f7f4a" pos={[0.75, 0, 0.1]} wobble={0.12} seed={4} contact={false} tones={rich ? [0.82, 1, 1.14] : [1, 1, 1]} />
      {/* lamp post */}
      <FacetLathe profile={[[0.16, 0], [0.16, 0.12], [0.07, 0.2], [0.055, 2.5], [0.1, 2.56]]} sides={8} s={1} color="#2f3440" pos={[-3.3, 0, -0.4]} contact={rich} />
      <FacetLathe profile={[[0.1, 2.56], [0.2, 2.62], [0.17, 2.92], [0.06, 3.0]]} sides={6} s={1} color="#f3e2a6" pos={[-3.3, 0, -0.4]} contact={false} />
      {/* a traffic cone and a low stone block */}
      <FacetLathe profile={[[0.24, 0], [0.24, 0.04], [0.16, 0.06], [0.05, 0.62]]} sides={10} s={1} color="#e07a34" pos={[-2.6, 0, 1.9]} contact={rich} />
      {rich ? <FacetLathe profile={[[0.125, 0.24], [0.1, 0.36]]} sides={10} s={1} color="#f4f1e6" pos={[-2.6, 0, 1.9]} contact={false} tones={[1]} /> : null}
      <FacetLathe profile={[[0.55, 0], [0.57, 0.32], [0.5, 0.4]]} sides={4} s={1} color="#9a9a96" pos={[3.5, 0, 0.9]} rotY={0.5} squash={0.6} contact={rich} />
      {rich ? <Scatter kind="street" area={[13, 5]} pos={[0.3, 0, 1.6]} seed={7} keep={keep} density={1.8} /> : null}
      {/* a person the reference never drew, from the shared mould: own palette, long trousers, a wave */}
      {rich ? <Puppet3 height={1.7} pos={[2.0, 0, 1.4]} res={1.4} spec={{outfit: 'vest', hair: 'level', longLegs: true, expr: {...EXPR.smile, gaze: [-14, 0]}, armL: {sh: 8, hand: 'relaxed'}, armR: {sh: 70, el: 95, hand: 'open'},
        palette: {hair: '#6b4a2a', hairLine: '#8a6a44', shirt: '#e8ecef', shirtEdge: '#c3ccd4', shirtRim: '#f6f8fa', vest: '#3f6a8a', shorts: '#4a4f5c', shoe: '#2a2c33', brow: '#3a2816'}}} /> : null}
    </>
  );
};
const NewPlain: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><NewThings rich={false} /></ThreeCanvas></AbsoluteFill>; };
const New: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><NewThings rich gain={Number((getInputProps() as {gain?: number}).gain ?? 1)} /></ThreeCanvas></AbsoluteFill>; };

/** Second new-subject test, composed BY RULE (lib3/town): facades closing the frame, a central stall, foreground props at
 *  the edges, bunting across the top, three people from the mould at medium-shot size in front of the stall. */
const Market: React.FC<{gain?: number}> = ({gain = 1}) => {
  const {camera, scene} = useThree(), c = camera as THREE.PerspectiveCamera, H = 1.7, d = distanceFor(H, 0.6);
  c.position.set(0, 1.28, 1.2 + d); c.fov = 28; c.lookAt(0, 1.28, 0); c.updateProjectionMatrix();
  scene.background = useMemo(() => new THREE.Color(GRADES.dayExterior.bg), []);
  const cobbles = useSurface('stone', 6), gwear = useWear(5, 0.5, false);
  const person = (x: number, z: number, spec: any, flip = false) => <Puppet3 height={H} pos={[x, 0, z]} res={1.5} flip={flip} spec={spec} />;
  return (
    <>
      <Scene3 grade="dayExterior" gain={gain}>
      <Ground near="#bdb6a8" far="#9c968c" size={[60, 40]} swell={0.01} patch={0.05} farAt={0.6} pos={[0, 0, -8]} map={cobbles} tile={1.1} wear={gwear} />
      {/* back layer: house fronts, each its own colour, height and material, taller than the frame */}
      <Facade pos={[-6.3, 0, -4.2]} w={4.6} h={7.2} color="#c9b48c" kind="plaster" shutters="#3f6a58" cols={2} floors={2} seed={2} sign="Books" />
      <Facade pos={[-1.7, 0, -4.6]} w={4.8} h={8} color="#a8523d" kind="brick" shutters="#2f4a6a" cols={3} floors={3} seed={3} awning={['#3f6a8a', '#f1ead8']} />
      <Facade pos={[3.2, 0, -4.2]} w={4.6} h={7} color="#d9cdb4" kind="stone" trim="#8a6a4a" shutters="#8a3a30" cols={2} floors={2} seed={5} sign="Cafe" awning={['#5a8f5a', '#f1ead8']} />
      <Facade pos={[0.8, 0, -7.5]} w={18} h={11} color="#b9a48c" kind="plaster" cols={7} floors={4} seed={9} />
      <Facade pos={[7.9, 0, -4.6]} w={4.6} h={7.6} color="#9a5a48" kind="brick" shutters="#3a3f4a" cols={2} floors={3} seed={7} />
      {/* middle: the set piece the people stand in front of */}
      <Stall pos={[0.1, 0, -0.9]} w={3.4} name="Bakery" seed={2} pics={[['wares/w-loaf.png', 0.62], ['wares/w-cake.png', 0.46], ['wares/w-buns.png', 0.56], ['wares/w-roundLoaf.png', 0.5], ['wares/w-jar.png', 0.3], ['wares/w-jug.png', 0.34]]} shelf={[['wares/w-bottle.png', 0.17], ['wares/w-jar.png', 0.24], ['wares/w-cheese.png', 0.36], ['wares/w-bottle.png', 0.17], ['wares/w-grapes.png', 0.3], ['wares/w-jug.png', 0.26]]} />
      {/* foreground, right: crates of produce and a pot of flowers, so the near ground is not empty */}
      <mesh position={[3.1, 0.2, 2.3]} rotation={[0, -0.3, 0]} castShadow receiveShadow><boxGeometry args={[0.8, 0.4, 0.55]} /><meshLambertMaterial color="#9a7448" /></mesh>
      <Pic2D src="wares/w-apples.png" w={0.7} pos={[3.1, 0.4, 2.32]} />
      <mesh position={[2.3, 0.16, 2.9]} rotation={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.7, 0.32, 0.5]} /><meshLambertMaterial color="#8a6a48" /></mesh>
      <Pic2D src="wares/w-grapes.png" w={0.4} pos={[2.15, 0.32, 2.92]} /><Pic2D src="wares/w-cheese.png" w={0.42} pos={[2.5, 0.32, 2.94]} />
      <Pic2D src="wares/w-flowers.png" w={0.55} pos={[-3.2, 0, 2.2]} />
      {/* foreground and edges */}
      <FacetLathe profile={[[0.3, 0], [0.34, 0.08], [0.36, 0.86], [0.4, 0.9], [0.4, 0.98], [0.26, 1.04]]} color="#3f6a58" pos={[-3.4, 0, 0.6]} tones={[0.8, 1, 1.18, 1.18, 0.9]} />
      <Studs pos={[-3.4, 0, 0.6]} r={0.365} y={0.8} n={12} />
      <FacetLathe profile={[[0.16, 0], [0.16, 0.12], [0.07, 0.2], [0.055, 2.9], [0.1, 2.96]]} sides={8} color="#2f3440" pos={[3.5, 0, -0.2]} />
      <FacetLathe profile={[[0.1, 2.96], [0.2, 3.02], [0.17, 3.32], [0.06, 3.4]]} sides={6} color="#f3e2a6" pos={[3.5, 0, -0.2]} contact={false} />
      {/* a planter box with a clipped bush, and a tree crown cut by the frame edge: foliage is flat (form rule) */}
      <mesh position={[-3.7, 0.3, -1.0]} castShadow receiveShadow><boxGeometry args={[0.9, 0.6, 0.7]} /><meshLambertMaterial color="#b9a184" /></mesh>
      <Foliage pos={[-3.7, 0.55, -0.95]} w={1.0} h={1.9} shape="column" seed={3} />
      <mesh position={[-3.0, 0.24, 1.6]} rotation={[0, 0.4, 0]} castShadow receiveShadow><boxGeometry args={[0.7, 0.48, 0.5]} /><meshLambertMaterial color="#9a7448" /></mesh>
      <Pic2D src="wares/w-apples.png" w={0.66} pos={[-3.0, 0.48, 1.62]} />
      <mesh position={[4.3, 1.6, -2.4]} castShadow><boxGeometry args={[0.22, 3.2, 0.22]} /><meshLambertMaterial color="#5a4030" /></mesh>
      <Foliage pos={[4.3, 2.3, -2.3]} w={3.6} h={3.2} seed={6} />
      <Pic2D src="wares/w-pumpkin.png" w={0.62} pos={[-2.6, 0, 0.3]} /><Pic2D src="wares/w-pumpkin.png" w={0.42} pos={[-3.05, 0, 0.55]} flip /><Pic2D src="wares/w-flowers.png" w={0.5} pos={[2.75, 0.44, -0.55]} />
      <Bunting a={[-7, 5.6, -3.8]} b={[7.5, 5.8, -3.8]} sag={1.0} n={26} />
      <Scatter kind="street" area={[11, 3.4]} pos={[0, 0, 1.5]} seed={11} density={1.5} keep={[[-2.0, 3.2, 0.9], [-1.0, 1.15, 0.7], [0.36, 0.35, 0.7], [1.7, 1.15, 0.7], [-3.4, 0.6, 0.6]]} />
      {/* people placed by the staging rule: one from behind in the foreground, the others at two depths, facing the stall */}
      {(() => { const P = stageCast([0.1, -0.9], 4, 3.0); const specs: any[] = [
        {outfit: 'vest', hair: 'sweep', longLegs: true, build: 'adult', view: 'back', expr: EXPR.neutral, armL: {sh: 6, hand: 'relaxed'}, armR: {sh: 38, el: 96, hand: 'open'}, palette: {hair: '#3a2a22', hairLine: '#5a463c', vest: '#6a4a7a', shirt: '#e9e2d0', shirtEdge: '#cfc6ae', shirtRim: '#f4efe2', shorts: '#3f3a44', shoe: '#2a2428'}},
        {outfit: 'vest', hair: 'level', longLegs: true, build: 'adult', expr: {...EXPR.smile, gaze: [18, -6]}, armL: {sh: 8, hand: 'relaxed'}, armR: {sh: 52, el: 70, hand: 'open'}, palette: {hair: '#6b4a2a', hairLine: '#8a6a44', shirt: '#e8ecef', shirtEdge: '#c3ccd4', shirtRim: '#f6f8fa', vest: '#3f6a8a', shorts: '#4a4f5c', shoe: '#2a2c33', brow: '#3a2816'}},
        {outfit: 'vest', hair: 'sweep', longLegs: true, build: 'adult', expr: {...EXPR.happy, gaze: [-16, -10]}, armL: {sh: 30, el: -100, hand: 'fist'}, armR: {sh: 24, el: 110, hand: 'point'}, palette: {skinA: '#c98f68', skinB: '#b98060', skinC: '#a87256', skin: '#b98060', hair: '#2a2420', vest: '#7a8f3a', shirt: '#f1ead8', shirtEdge: '#d6ccb2', shirtRim: '#faf6ea', shorts: '#5a4a3c', shoe: '#33261f'}},
        {outfit: 'vest', hair: 'level', expr: {...EXPR.shock, pupil: 'small', mouth: 'o', gaze: [-20, -30]}, armL: {sh: 96, el: 30, hand: 'point'}, armR: {sh: 8, hand: 'relaxed'}, palette: {hair: '#b5602e', hairLine: '#d08a4a', brow: '#7a3a18', vest: '#b9463c', shirt: '#f4e6b8', shirtEdge: '#d8c48a', shirtRim: '#fbf2d2', shorts: '#3f5a7a', shoe: '#2f2620'}},
      ]; return P.map((q, i) => <Puppet3 key={i} height={i === 3 ? 1.15 : H} pos={[q.x, 0, q.z]} res={q.near === 1 ? 2 : 1.5} flip={q.flip} spec={specs[i]} />); })()}
      </Scene3>
    </>
  );
};
const MarketStill: React.FC = () => { const {width, height} = useVideoConfig(); return <AbsoluteFill><Finish><ThreeCanvas width={width} height={height} flat shadows={{type: THREE.VSMShadowMap}} gl={{antialias: true}}><Market gain={Number((getInputProps() as {gain?: number}).gain ?? 1)} /></ThreeCanvas></Finish></AbsoluteFill>; };
export const Lib3MatchComps: React.FC = () => <><Still id="lib3-snow" component={Match} width={1280} height={720} /><Still id="lib3-new" component={New} width={1280} height={720} /><Still id="lib3-new-plain" component={NewPlain} width={1280} height={720} /><Still id="lib3-market" component={MarketStill} width={1280} height={720} /></>;
