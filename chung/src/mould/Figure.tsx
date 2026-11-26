import React from 'react';
import {HeadA, Expr} from './Head';

/** Whole figure on the shared mould, in the head's units (face 382 wide). Measured on the reference boy standing
 *  (frame 2166): chin at 548, shoulders 592, shirt hem 884, shorts to 991, soles 1197; arm = two rigid pieces of 110,
 *  80 thick; leg 69 wide; no neck. Draw order back to front: legs, shoes, shorts, torso, arms, head.
 *  Arm angles are degrees from hanging straight down; positive swings the arm away from the body. */
export type Hand = 'open' | 'relaxed' | 'fist';
export type ArmPose = {sh: number; el?: number; wrist?: number; hand?: Hand};
export type Outfit = {skin: string; skinDark: string; shirt: string; shirtEdge: string; vest: string; shorts: string; shoe: string; button: string};
export const BOY: Outfit = {skin: '#d39f7b', skinDark: '#b98667', shirt: '#dccfb0', shirtEdge: '#c4b08f', vest: '#7e3b2f', shorts: '#59483a', shoe: '#372a23', button: '#94896c'};

const cap = (x1: number, y1: number, x2: number, y2: number, w: number, c: string) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" />;

const HandShape: React.FC<{kind: Hand; out: number; o: Outfit}> = ({kind, out, o}) => {
  if (kind === 'fist') return (
    <g>
      <rect x={-34} y={-4} width={68} height={70} rx={27} fill={o.skin} />
      {cap(out * 6, 30, out * -20, 34, 20, o.skin)}
      {[-12, 6].map((x) => <line key={x} x1={x} y1={50} x2={x} y2={64} stroke={o.skinDark} strokeWidth={3} strokeLinecap="round" />)}
    </g>
  );
  if (kind === 'relaxed') return (
    <g>
      {cap(out * -22, 22, out * -30, 52, 20, o.skin)}
      <ellipse cx={0} cy={40} rx={30} ry={44} fill={o.skin} />
      {[-9, 8].map((x) => <line key={x} x1={x} y1={58} x2={x} y2={80} stroke={o.skinDark} strokeWidth={3} strokeLinecap="round" />)}
    </g>
  );
  const dir = (deg: number, a: number, b: number): [number, number, number, number] => { const r = (deg * Math.PI) / 180; return [Math.sin(r) * a, 34 + Math.cos(r) * a, Math.sin(r) * b, 34 + Math.cos(r) * b]; };
  return (
    <g>
      {[-33, -11, 11, 33].map((d, i) => { const [a, b, c, e] = dir(d, 22, i === 0 || i === 3 ? 66 : 76); return <g key={d}>{cap(a, b, c, e, 19, o.skin)}</g>; })}
      {(() => { const [a, b, c, e] = dir(out * 82, 16, 56); return cap(a, b - 8, c, e - 8, 20, o.skin); })()}
      <ellipse cx={0} cy={32} rx={36} ry={34} fill={o.skin} />
      <path d={`M${out * -16},28 Q${out * 2},44 ${out * 20},32`} fill="none" stroke={o.skinDark} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

const Arm: React.FC<{side: 'L' | 'R'; p: ArmPose; o: Outfit}> = ({side, p, o}) => {
  const k = side === 'L' ? 1 : -1, out = side === 'L' ? -1 : 1, x = side === 'L' ? 180 : 364;
  return (
    <g transform={`translate(${x},612) rotate(${k * p.sh})`}>
      {cap(0, 0, 0, 110, 72, o.shirt)}
      <g transform={`translate(0,110) rotate(${k * (p.el ?? 0)})`}>
        <g transform={`translate(0,108) rotate(${k * (p.wrist ?? 0)}) scale(1.12)`}><HandShape kind={p.hand ?? 'relaxed'} out={out} o={o} /></g>
        {cap(0, 0, 0, 88, 80, o.shirt)}
        <rect x={-40} y={96} width={80} height={20} rx={8} fill={o.shirt} />
        <line x1={-38} y1={96} x2={38} y2={96} stroke={o.shirtEdge} strokeWidth={3} />
      </g>
    </g>
  );
};

export const Figure: React.FC<{expr: Expr; armL?: ArmPose; armR?: ArmPose; outfit?: Outfit; id?: string; hair?: 'sweep' | 'level'}> = ({expr, armL = {sh: 4}, armR = {sh: 4}, outfit: o = BOY, id = 'f', hair = 'level'}) => (
  <g>
    {/* legs and shoes */}
    {[[214, -1], [318, 1]].map(([x, k]) => (
      <g key={x}>
        <rect x={x - 38} y={960} width={76} height={210} rx={10} fill={o.skin} />
        <path d={`M${x - k * 34},1197 Q${x - k * 38},1150 ${x - k * 10},1146 L${x + k * 6},1146 Q${x + k * 62},1156 ${x + k * 86},1197 Z`} fill={o.shoe} />
      </g>
    ))}
    {/* shorts: two rounded lobes */}
    <path d="M163,872 L381,872 L388,950 Q380,994 326,994 Q284,994 272,962 Q260,994 218,994 Q164,994 156,950 Z" fill={o.shorts} />
    {/* shirt, vest panels, buttons, collar */}
    <path d="M176,570 Q272,548 368,570 L376,884 L168,884 Z" fill={o.shirt} />
    <path d="M178,578 L226,560 L246,690 L242,884 L170,884 Z" fill={o.vest} />
    <path d="M366,578 L318,560 L298,690 L302,884 L374,884 Z" fill={o.vest} />
    {[690, 760, 826].map((y) => <circle key={y} cx={272} cy={y} r={6} fill={o.button} />)}
    <path d="M216,560 L262,612 L272,588 L282,612 L328,560 L300,548 L244,548 Z" fill={o.shirt} stroke={o.shirtEdge} strokeWidth={2.5} strokeLinejoin="round" />
    <line x1={272} y1={600} x2={272} y2={884} stroke={o.shirtEdge} strokeWidth={2.5} />
    <Arm side="L" p={armL} o={o} /><Arm side="R" p={armR} o={o} />
    <HeadA expr={expr} id={id} hair={hair} />
  </g>
);
