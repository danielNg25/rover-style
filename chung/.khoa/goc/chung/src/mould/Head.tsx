import React from 'react';

/** Shared face moulds, drawn as vector shapes (catalogue DANH-MUC-HINH-v2.md, sections 1.4, 2 and 10).
 *  Units are the pixels of the measured reference close-up (the boy at frame 2892, straightened): face 382 wide,
 *  eye pair 334 wide, chin 245 below the eye line. One mould = one outline; eyes, lids, pupils, brows and mouth are
 *  the same parts for everybody and only change state. */
export type Upper = 'none' | 'flat' | 'angry' | 'sad';
export type Lower = 'none' | 'flat' | 'curve';
export type Mouth = 'down' | 'up' | 'flat' | 'open' | 'grit' | 'o';
export type Brow = 'arc' | 'sad' | 'angry' | 'none';
export type Expr = {
  upper: Upper; lower?: Lower; closed?: boolean;
  pupil?: 'normal' | 'small' | 'dot'; gaze?: [number, number];
  brow: Brow; browY?: number; mouth: Mouth;
  /** exact lid line per eye, [outerY, innerY] measured from the eye centre; overrides `upper` */
  lidL?: [number, number]; lidR?: [number, number];
};

type Pt = [number, number];
const EYE = {y: 290, rx: 86, ry: 80, L: 196, R: 361};
const COL = {skinA: '#dba57d', skinB: '#cb9875', skinC: '#b98a6e', lidEdge: '#85624b', whiteA: '#f3efe7', whiteB: '#e5e1db',
  hair: '#1f1614', hairLine: '#4f433f', brow: '#140d0b', iris: '#69442e', pupil: '#161110', mouth: '#19120d', earMark: '#9d7455'};

/** A blade: a curved stroke with pointed ends, `thick` wide in the middle. bend > 0 bows it upward. */
const blade = (a: Pt, b: Pt, bend: number, thick: number) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  let nx = dy / l, ny = -dx / l; if (ny > 0) { nx = -nx; ny = -ny; }
  const c = (k: number) => `${mx + nx * k * 2},${my + ny * k * 2}`;
  return `M${a[0]},${a[1]} Q${c(bend + thick / 2)} ${b[0]},${b[1]} Q${c(bend - thick / 2)} ${a[0]},${a[1]} Z`;
};
/** A closed outline through the points: corners are rounded except the ones listed in `sharp` (spike tips). */
const soft = (pts: Pt[], sharp: number[]) => {
  const n = pts.length, mid = (i: number): Pt => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  let d = `M${mid(n - 1).join(',')}`;
  pts.forEach((p, i) => { const m = mid(i); d += sharp.includes(i) ? ` L${p.join(',')} L${m.join(',')}` : ` Q${p.join(',')} ${m.join(',')}`; });
  return d + ' Z';
};

/** Upper lid line per state: [y at the outer end, y at the inner end], measured from the eye centre.
 *  Visible white height from the catalogue (share of the eye-pair width): flat 0.21, angry 0.27, sad 0.33. */
const LID: Record<Exclude<Upper, 'none'>, [number, number]> = {flat: [10, 10], angry: [-12, 24], sad: [-13, -52]};

const Eye: React.FC<{side: 'L' | 'R'; e: Expr; id: string}> = ({side, e, id}) => {
  const cx = EYE[side], cy = EYE.y, out = side === 'L' ? -1 : 1, xo = cx + out * (EYE.rx + 5), xi = cx - out * (EYE.rx + 5), xm = cx - out * 81;
  const lid = (side === 'L' ? e.lidL : e.lidR) ?? (e.upper === 'none' ? null : LID[e.upper]);
  const yAt = (x: number) => (lid ? cy + lid[0] + ((lid[1] - lid[0]) * (x - xo)) / (xi - xo) : 0);
  const pr = e.pupil === 'dot' ? [9, 5, 2.5] : e.pupil === 'small' ? [19, 10, 4] : [27, 14, 5.5];
  const [gx, gy] = e.gaze ?? [-out * 6, 12], px = cx + gx, py = cy + gy, low = e.lower === 'flat' ? cy + 44 : e.lower === 'curve' ? cy + 24 : cy + 200, dip = e.lower === 'curve' ? 36 : 0;
  if (e.closed) return <path d={`M${cx - 66},${cy + 14} Q${cx},${cy + 56} ${cx + 66},${cy + 14}`} fill="none" stroke={COL.lidEdge} strokeWidth={7} strokeLinecap="round" />;
  return (
    <g>
      <clipPath id={`${id}-clip${side}`}><ellipse cx={cx} cy={cy} rx={EYE.rx} ry={EYE.ry} /></clipPath>
      {/* the part of the eye the lids leave open: below the upper lid line, above the lower one */}
      <clipPath id={`${id}-open${side}`}><path d={`M${xo},${lid ? cy + lid[0] : cy - 200} L${xi},${lid ? cy + lid[1] : cy - 200} L${xi},${low} Q${cx},${low - dip} ${xo},${low} Z`} /></clipPath>
      <g clipPath={`url(#${id}-clip${side})`}><g clipPath={`url(#${id}-open${side})`}>
        <rect x={cx - 100} y={cy - 100} width={200} height={200} fill={`url(#${id}-white)`} />
        <circle cx={px} cy={py} r={pr[0]} fill={COL.iris} />
        <circle cx={px} cy={py} r={pr[1]} fill={COL.pupil} />
        <circle cx={px - pr[1] * 0.55} cy={py - pr[1] * 0.6} r={pr[2]} fill="#ffffff" />
      </g></g>
      {lid ? <line x1={cx + out * (EYE.rx + 2)} y1={yAt(cx + out * (EYE.rx + 2))} x2={xm} y2={yAt(xm)} stroke={COL.lidEdge} strokeWidth={8} /> : null}
      {e.lower === 'flat' ? <line x1={cx - 70} y1={cy + 44} x2={cx + 70} y2={cy + 44} stroke={COL.lidEdge} strokeWidth={5} /> : null}
    </g>
  );
};

const BrowShape: React.FC<{side: 'L' | 'R'; kind: Brow; y: number; thick: number}> = ({side, kind, y, thick}) => {
  if (kind === 'none') return null;
  const cx = EYE[side], out = side === 'L' ? -1 : 1, xo = cx + out * 52, xi = cx - out * 54;
  const ends: Record<Exclude<Brow, 'none'>, [number, number, number]> = {arc: [0, 0, 16], sad: [22, -21, 5], angry: [-20, 20, 4]};
  const [yo, yi, bend] = ends[kind];
  return <path d={blade([xo, y + yo], [xi, y + yi], bend, thick)} fill={COL.brow} stroke={COL.brow} strokeWidth={5} strokeLinejoin="round" />;
};

const MouthShape: React.FC<{kind: Mouth}> = ({kind}) => {
  const x = 271, y = 450;
  if (kind === 'down') return <path d={blade([x - 86, y + 13], [x + 86, y + 15], 25, 11)} fill={COL.mouth} stroke={COL.mouth} strokeWidth={4} strokeLinejoin="round" />;
  if (kind === 'up') return <path d={blade([x - 86, y - 14], [x + 86, y - 14], -25, 11)} fill={COL.mouth} stroke={COL.mouth} strokeWidth={4} strokeLinejoin="round" />;
  if (kind === 'flat') return <rect x={x - 62} y={y - 5} width={124} height={10} rx={5} fill={COL.mouth} />;
  if (kind === 'o') return <ellipse cx={x} cy={y + 2} rx={19} ry={24} fill={COL.mouth} />;
  if (kind === 'grit') return (
    <g>
      <rect x={x - 70} y={y - 24} width={140} height={48} rx={16} fill={COL.mouth} />
      <rect x={x - 62} y={y - 16} width={124} height={32} rx={9} fill="#f4f1ea" />
      {[-31, 0, 31].map((d) => <rect key={d} x={x + d - 1.5} y={y - 16} width={3} height={32} fill={COL.mouth} />)}
      <rect x={x - 62} y={y - 1.5} width={124} height={3} fill={COL.mouth} />
    </g>
  );
  return (
    <g transform="translate(0,16)">
      <clipPath id="m-open"><path d={`M${x - 72},${y - 30} Q${x},${y - 6} ${x + 72},${y - 30} Q${x + 70},${y + 56} ${x},${y + 58} Q${x - 70},${y + 56} ${x - 72},${y - 30} Z`} /></clipPath>
      <g clipPath="url(#m-open)">
        <rect x={x - 80} y={y - 40} width={160} height={100} fill="#33111b" />
        <ellipse cx={x} cy={y + 50} rx={46} ry={26} fill="#c66170" />
        <path d={`M${x - 80},${y - 40} L${x + 80},${y - 40} L${x + 80},${y - 12} Q${x},${y + 14} ${x - 80},${y - 12} Z`} fill="#f4f1ea" />
      </g>
    </g>
  );
};

/** Head mould A (U-shaped, the most common one) with the boy's hair. size: the drawing is 500 x 600 units. */
/** hair: 'sweep' = the older boy (hairline falls to the right, tall hair); 'level' = the young boy (lower hair, level fringe). */
export const HeadA: React.FC<{expr: Expr; id?: string; browThick?: number; hair?: 'sweep' | 'level'}> = ({expr, id = 'h', browThick = 17, hair = 'sweep'}) => {
  // outer hair outline, clockwise from the left sideburn; SPIKES are the indices that stay pointed
  const top0: Pt[] = [[76, 286], [46, 262], [38, 222], [46, 176], [52, 128], [84, 106], [116, 80], [107, 35], [165, 66], [233, 6], [286, 56], [336, 58], [367, 17], [400, 44], [412, 70], [458, 88], [506, 72], [486, 124], [505, 170], [498, 220]];
  const top: Pt[] = hair === 'level' ? top0.map(([x, y]) => [x, 51 + (y - 6) * 0.84] as Pt) : top0;
  const SPIKES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const back = soft([...top, [492, 300], [488, 392], [474, 404], [458, 384], [300, 300]], [...SPIKES, 22]);
  const line: Pt[] = hair === 'level' ? [[464, 250], [442, 176], [397, 150], [250, 160], [135, 162], [98, 188], [82, 226]] : [[464, 236], [250, 160], [183, 158], [133, 146], [98, 178], [82, 222]];
  const fringe = soft([...top, ...line], [...SPIKES, 20, 21, 22, 23]);
  const hy = hair === 'level' ? 34 : 0, sk = hair === 'level' ? 128 : 90;
  const browY = 172 + (expr.browY ?? 0);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-skin`} gradientUnits="userSpaceOnUse" x1={70} y1={200} x2={470} y2={500}>
          <stop offset="0" stopColor={COL.skinA} /><stop offset="0.45" stopColor={COL.skinB} /><stop offset="1" stopColor={COL.skinC} />
        </linearGradient>
        <linearGradient id={`${id}-white`} gradientUnits="userSpaceOnUse" x1={110} y1={0} x2={444} y2={0}>
          <stop offset="0" stopColor={COL.whiteA} /><stop offset="1" stopColor={COL.whiteB} />
        </linearGradient>
        <radialGradient id={`${id}-form`} gradientUnits="userSpaceOnUse" cx={215} cy={285} r={300}>
          <stop offset="0.62" stopColor="#8a5a44" stopOpacity={0} /><stop offset="1" stopColor="#8a5a44" stopOpacity={0.3} />
        </radialGradient>
      </defs>
      <path d={back} fill={COL.hair} />
      {[[75, 338, 1], [470, 340, -1]].map(([x, y, k]) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={20} ry={40} fill={`url(#${id}-skin)`} />
          <path d={`M${x + k * 4},${y - 20} Q${x - k * 12},${y} ${x + k * 4},${y + 20} Q${x - k * 3},${y} ${x + k * 4},${y - 20} Z`} fill={COL.earMark} />
        </g>
      ))}
      {/* face: round skull on top, U-shaped jaw below the eye line; the second pass darkens the far edge for form */}
      {[`url(#${id}-skin)`, `url(#${id}-form)`].map((f) => <path key={f} d={`M81,300 C81,${sk + 60} 190,${sk} 272,${sk} C354,${sk} 463,${sk + 60} 463,300 C463,440 404,548 272,548 C140,548 81,440 81,300 Z`} fill={f} />)}
      <Eye side="L" e={expr} id={id} /><Eye side="R" e={expr} id={id} />
      <MouthShape kind={expr.mouth} />
      <path d={fringe} fill={COL.hair} />
      <path d={blade([167, 121 + hy], [302, 101 + hy], 27, 7)} fill={COL.hairLine} />
      <path d={blade([333, 119 + hy], [440, 123 + hy], 30, 7)} fill={COL.hairLine} />
      <BrowShape side="L" kind={expr.brow} y={browY} thick={browThick} /><BrowShape side="R" kind={expr.brow} y={browY} thick={browThick} />
    </g>
  );
};
