import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Still} from 'remotion';
import {paint, Spec, Hand, BOX, drawFigure} from '../mould/draw';

/** Canvas version of the mould, as stills: the figures the grave test needs, and the sheet of hand drawings. */
const Fig: React.FC<{spec: Spec; w: number; label?: string; bg?: string}> = ({spec, w, label, bg = '#aeb6c8'}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { if (ref.current) paint(ref.current, spec, w / BOX.w); }, [spec, w]);
  return <div style={{width: w, height: (w * BOX.h) / BOX.w, background: bg, position: 'relative'}}><canvas ref={ref} />{label ? <div style={{position: 'absolute', left: 8, top: 6, color: '#fff', font: '600 20px sans-serif', textShadow: '0 1px 3px #000'}}>{label}</div> : null}</div>;
};
const SAD = {upper: 'sad', brow: 'sad', mouth: 'down', gaze: [0, 26]} as Spec['expr'];
const FIGS: [string, Spec][] = [
  ['ao choang, buon', {outfit: 'coat', hair: 'sweep', expr: SAD, head: {dy: 60}, faceDy: -30}],
  ['ao choang, gian, nam tay', {outfit: 'coat', hair: 'sweep', expr: {upper: 'angry', lower: 'flat', brow: 'angry', browY: 22, mouth: 'down'}, head: {dy: 40}, faceDy: -20, armR: {sh: 8, el: -152, hand: 'fist', show: true, front: true}}],
  ['ao choang, noi, dua tay', {outfit: 'coat', hair: 'sweep', expr: {upper: 'sad', brow: 'sad', mouth: 'aw', gaze: [-16, -6]}, head: {dy: 50, rot: -4}, faceDy: -24, armL: {sh: 42, el: 46, hand: 'open', show: true}}],
  ['sau lung, gio nam tay', {view: 'back', outfit: 'coat', hair: 'sweep', expr: SAD, armR: {sh: 24, el: 118, hand: 'fist', show: true}}],
  ['ao ghi le, vui', {outfit: 'vest', hair: 'level', expr: {upper: 'none', lower: 'curve', brow: 'arc', browY: 4, mouth: 'open', gaze: [16, -48]}, armL: {sh: 6, hand: 'open'}, armR: {sh: 6, hand: 'open'}}],
];
const Sheet: React.FC = () => <AbsoluteFill style={{background: '#222', flexDirection: 'row'}}>{FIGS.map(([n, s]) => <Fig key={n} spec={s} w={400} label={n} />)}</AbsoluteFill>;
const HANDS: Hand[] = ['open', 'back', 'relaxed', 'fist', 'point', 'edge', 'cup', 'grip', 'clasp'];
const Hands: React.FC = () => <AbsoluteFill style={{background: '#222', flexDirection: 'row', flexWrap: 'wrap'}}>
  {HANDS.map((h) => <div key={h} style={{width: 400, height: 520, overflow: 'hidden', position: 'relative', background: '#8a9a6c'}}>
    <div style={{position: 'absolute', left: -150, top: -620, transform: 'scale(1.5)', transformOrigin: '0 0'}}><Fig spec={{outfit: 'vest', hair: 'level', expr: {upper: 'none', brow: 'arc', mouth: 'flat'}, armL: {sh: 10, hand: h}, armR: {sh: 10, hand: h}}} w={600} bg="transparent" /></div>
    <div style={{position: 'absolute', left: 8, top: 6, color: '#fff', font: '600 22px sans-serif', textShadow: '0 1px 3px #000'}}>{h}</div>
  </div>)}
</AbsoluteFill>;
void drawFigure;
export const MouldCanvasComps: React.FC = () => (
  <>
    <Still id="mould-canvas-figs" component={Sheet} width={2000} height={563} />
    <Still id="mould-canvas-hands" component={Hands} width={2000} height={1040} />
  </>
);
