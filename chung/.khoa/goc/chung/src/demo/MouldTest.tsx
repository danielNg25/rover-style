import React from 'react';
import {AbsoluteFill, Img, Still, staticFile} from 'remotion';
import {HeadA, Expr} from '../mould/Head';
import {Figure} from '../mould/Figure';

/** Look tests for the shared face mould. mould-a-match: the reference close-up (left) next to the same face built
 *  from the mould parts (right). mould-a-states: one head, eight expressions made only by changing part states. */
const BG = 'linear-gradient(#59607f 0%, #8f97b1 45%, #cfd4e0 70%, #d9dde6 100%)';
const Coat: React.FC = () => (
  <g>
    <path d="M60,600 Q90,560 150,548 L400,548 Q460,565 500,600 Z" fill="#6b4a2f" />
    <ellipse cx={272} cy={578} rx={150} ry={40} fill="#a78f69" />
  </g>
);
const MATCH: Expr = {upper: 'sad', lidL: [-13, -52], lidR: [-8, -52], gaze: [14, 30], brow: 'sad', mouth: 'down'};
const Match: React.FC = () => (
  <AbsoluteFill style={{background: '#111', flexDirection: 'row'}}>
    <Img src={staticFile('study/boy-2892.png')} style={{width: 1000, height: 1200}} />
    <div style={{width: 1000, height: 1200, background: BG}}>
      <svg viewBox="0 0 500 600" width={1000} height={1200}><Coat /><HeadA expr={MATCH} /></svg>
    </div>
  </AbsoluteFill>
);
const STATES: [string, Expr][] = [
  ['binh thuong', {upper: 'none', brow: 'arc', mouth: 'flat'}],
  ['chan', {upper: 'flat', brow: 'arc', browY: 8, mouth: 'flat'}],
  ['gian', {upper: 'angry', lower: 'flat', brow: 'angry', browY: 22, mouth: 'grit'}],
  ['buon', {upper: 'sad', brow: 'sad', mouth: 'down', gaze: [0, 28]}],
  ['vui', {upper: 'none', lower: 'curve', brow: 'arc', browY: -6, mouth: 'open'}],
  ['chop mat', {upper: 'none', closed: true, brow: 'arc', browY: 6, mouth: 'flat'}],
  ['so', {upper: 'none', pupil: 'dot', brow: 'none', mouth: 'o'}],
  ['nghi ngo', {upper: 'flat', lidL: [10, 10], lidR: [-36, -30], brow: 'angry', browY: 14, mouth: 'down', gaze: [14, 18]}],
];
const States: React.FC = () => (
  <AbsoluteFill style={{background: '#111', flexDirection: 'row', flexWrap: 'wrap'}}>
    {STATES.map(([name, e], i) => (
      <div key={name} style={{width: 500, height: 600, background: BG, position: 'relative'}}>
        <svg viewBox="0 0 500 600" width={500} height={600}><Coat /><HeadA expr={e} id={`s${i}`} /></svg>
        <div style={{position: 'absolute', left: 10, bottom: 8, color: '#fff', font: '600 22px sans-serif', textShadow: '0 1px 3px #000'}}>{name}</div>
      </div>
    ))}
  </AbsoluteFill>
);

/** mould-boy-match: the reference boy standing (left) next to the whole figure built on the mould (right).
 *  mould-boy-poses: the same figure with other arm poses, hands and faces. */
const GROUND = 'linear-gradient(#7a8f6e 0%, #86986f 62%, #8a9a6c 100%)';
const HAPPY: Expr = {upper: 'none', lower: 'curve', brow: 'arc', browY: -18, mouth: 'open', gaze: [16, -50]};
const Fig: React.FC<{w: number; vb?: [number, number, number, number]; children: React.ReactNode}> = ({w, vb = [-26, -25, 611, 1280], children}) => (
  <svg viewBox={vb.join(' ')} width={w} height={(w * vb[3]) / vb[2]}>
    <ellipse cx={300} cy={1196} rx={210} ry={26} fill="#5d6b4c" opacity={0.45} />
    {children}
  </svg>
);
const BoyMatch: React.FC = () => (
  <AbsoluteFill style={{background: '#111', flexDirection: 'row'}}>
    <Img src={staticFile('study/boy-2166.png')} style={{width: 640, height: 1340}} />
    <div style={{width: 640, height: 1340, background: GROUND}}><Fig w={640}><Figure expr={HAPPY} armL={{sh: 5, hand: 'open'}} armR={{sh: 5, hand: 'open'}} /></Fig></div>
  </AbsoluteFill>
);
const POSES: [string, React.ReactNode][] = [
  ['dung yen', <Figure id="p0" expr={{upper: 'none', brow: 'arc', mouth: 'flat'}} />],
  ['dang tay', <Figure id="p1" expr={HAPPY} armL={{sh: 55, el: 30, hand: 'open'}} armR={{sh: 55, el: 30, hand: 'open'}} />],
  ['chong hong, gian', <Figure id="p2" expr={{upper: 'angry', lower: 'flat', brow: 'angry', browY: 22, mouth: 'grit'}} armL={{sh: 35, el: -75, hand: 'fist'}} armR={{sh: 35, el: -75, hand: 'fist'}} />],
  ['gio tay chao', <Figure id="p3" expr={{upper: 'none', lower: 'curve', brow: 'arc', mouth: 'up'}} armL={{sh: 4}} armR={{sh: 70, el: 95, hand: 'open'}} />],
];
const BoyPoses: React.FC = () => (
  <AbsoluteFill style={{background: '#111', flexDirection: 'row'}}>
    {POSES.map(([name, fig]) => (
      <div key={name} style={{width: 500, height: 1047, background: GROUND, position: 'relative'}}>
        <Fig w={500} vb={[-108, -230, 760, 1591]}>{fig}</Fig>
        <div style={{position: 'absolute', left: 10, top: 8, color: '#fff', font: '600 22px sans-serif', textShadow: '0 1px 3px #000'}}>{name}</div>
      </div>
    ))}
  </AbsoluteFill>
);
export const MouldTestComps: React.FC = () => (
  <>
    <Still id="mould-a-match" component={Match} width={2000} height={1200} />
    <Still id="mould-a-states" component={States} width={2000} height={1200} />
    <Still id="mould-boy-match" component={BoyMatch} width={1280} height={1340} />
    <Still id="mould-boy-poses" component={BoyPoses} width={2000} height={1047} />
  </>
);
