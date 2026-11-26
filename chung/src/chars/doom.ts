import type {RigDef} from '../three/SvgRig';

const G = '#2b9442', GL = '#35a54c', GD = '#1c7433', GDD = '#11502a', GK = '#0b2916';
const M = '#b4b7bb', MD = '#93969b', MDD = '#787b80', ML = '#cdd0d3', MK = '#17181b';
const GOLD = '#e0b02c', GOLDD = '#b98a17', BELT = '#8f5a2c';

export type DoomFace = 'angry' | 'neutral' | 'sad' | 'squint';

const face = (f: DoomFace) => {
  // brows (bl/br), eye slits (sl/sr) per expression
  const c = {
    angry:   {bl: 'M122 116 Q160 110 196 127', br: 'M278 116 Q240 110 204 127', sl: 'M132 142 L186 150 L186 161 L132 157 Z', sr: 'M268 142 L214 150 L214 161 L268 157 Z', py: 153},
    neutral: {bl: 'M122 118 Q160 110 196 118', br: 'M278 118 Q240 110 204 118', sl: 'M132 142 L186 142 L186 158 L132 158 Z', sr: 'M268 142 L214 142 L214 158 L268 158 Z', py: 150},
    sad:     {bl: 'M122 126 Q160 112 196 110', br: 'M278 126 Q240 112 204 110', sl: 'M132 148 L186 142 L186 158 L132 160 Z', sr: 'M268 148 L214 142 L214 158 L268 160 Z', py: 152},
    squint:  {bl: 'M122 120 Q160 114 196 124', br: 'M278 120 Q240 114 204 124', sl: 'M132 148 L186 152 L186 159 L132 158 Z', sr: 'M268 148 L214 152 L214 159 L268 158 Z', py: 154},
  }[f];
  return `
    <rect x="124" y="128" width="68" height="42" rx="5" fill="${MD}"/><rect x="208" y="128" width="68" height="42" rx="5" fill="${MD}"/>
    <path d="${c.sl}" fill="${MK}"/><path d="${c.sr}" fill="${MK}"/>
    <circle cx="174" cy="${c.py}" r="6" fill="#fff3cf"/><circle cx="252" cy="${c.py}" r="6" fill="#fff3cf"/>
    <path d="${c.bl}" stroke="${MDD}" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="${c.br}" stroke="${MDD}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
};

const arm = (side: 'L' | 'R', glow: boolean) => {
  const k = side === 'L' ? -1 : 1;
  const X = (dx: number) => 200 + k * dx;
  const H = glow ? '#d6f7da' : ML, HD = glow ? '#9be0a8' : MD;
  return `
  <g id="arm${side}">
    <circle cx="${X(100)}" cy="334" r="30" fill="${ML}"/>
    <path d="M${X(102)} 338 L${X(114)} 392" stroke="${M}" stroke-width="52" stroke-linecap="round" fill="none"/>
    <path d="M${X(92)} 352 Q${X(110)} 344 ${X(130)} 356" stroke="${MD}" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
  <g id="fore${side}">
    <path d="M${X(114)} 394 L${X(110)} 446" stroke="${ML}" stroke-width="48" stroke-linecap="round" fill="none"/>
    <path d="M${X(90)} 404 Q${X(112)} 396 ${X(136)} 404" stroke="${MD}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M${X(88)} 440 Q${X(110)} 448 ${X(132)} 440" stroke="${MD}" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
  <g id="fist${side}">
    <circle cx="${X(109)}" cy="468" r="28" fill="${ML}"/>
    <path d="M${X(96)} 476 L${X(96)} 490 M${X(109)} 479 L${X(109)} 494 M${X(122)} 476 L${X(122)} 490" stroke="${MD}" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>
  <g id="open${side}">
    <path d="M${X(88)} 478 L${X(76)} 520 M${X(102)} 484 L${X(98)} 532 M${X(117)} 484 L${X(121)} 532 M${X(131)} 478 L${X(143)} 518" stroke="${H}" stroke-width="17" stroke-linecap="round" fill="none"/>
    <path d="M${X(132)} 462 L${X(156)} 478" stroke="${H}" stroke-width="17" stroke-linecap="round" fill="none"/>
    <circle cx="${X(109)}" cy="468" r="30" fill="${H}"/>
    <path d="M${X(92)} 452 Q${X(110)} 444 ${X(128)} 452" stroke="${HD}" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>`;
};

/** Front view. viewBox 400 x 560, ground at y=540, total height 520. */
export const doomRig = (f: DoomFace = 'angry', glowHand?: 'L' | 'R'): RigDef => ({
  height: 520, footY: 540, centerX: 200,
  parts: {
    cape: {pivot: [200, 262]},
    legs: {},
    body: {pivot: [200, 430]},
    armL: {parent: 'body', pivot: [100, 326]}, foreL: {parent: 'armL', pivot: [86, 393]}, fistL: {parent: 'foreL', pivot: [90, 450]}, openL: {parent: 'foreL', pivot: [90, 450]},
    armR: {parent: 'body', pivot: [300, 326]}, foreR: {parent: 'armR', pivot: [314, 393]}, fistR: {parent: 'foreR', pivot: [310, 450]}, openR: {parent: 'foreR', pivot: [310, 450]},
    head: {parent: 'body', pivot: [200, 250]},
    mantle: {parent: 'body', pivot: [200, 250]},
  },
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560">
  <g id="cape">
    <path d="M104 262 C50 330 12 440 2 540 L398 540 C388 440 350 330 296 262 Z" fill="${GD}"/>
    <path d="M60 360 C40 420 26 480 22 540 L70 540 C72 480 78 420 92 372 Z" fill="${GDD}" fill-opacity="0.75"/>
    <path d="M340 360 C360 420 374 480 378 540 L330 540 C328 480 322 420 308 372 Z" fill="${GDD}" fill-opacity="0.75"/>
    <path d="M130 300 L100 540 L300 540 L270 300 Z" fill="${GK}"/>
    <path d="M2 540 L398 540 L394 500 Q200 520 6 500 Z" fill="#000000" fill-opacity="0.14"/>
  </g>
  <g id="legs">
    <rect x="150" y="424" width="44" height="80" rx="14" fill="${M}"/><rect x="206" y="424" width="44" height="80" rx="14" fill="${M}"/>
    <path d="M152 470 L192 470 M208 470 L248 470" stroke="${MD}" stroke-width="4" fill="none"/>
    <path d="M144 502 Q146 486 164 486 L194 486 L196 540 L134 540 Q132 518 144 502 Z" fill="${MD}"/>
    <path d="M256 502 Q254 486 236 486 L206 486 L204 540 L266 540 Q268 518 256 502 Z" fill="${MD}"/>
  </g>
  <g id="body">
    <path d="M136 290 L264 290 L282 440 L118 440 Z" fill="${G}"/>
    <path d="M130 330 L270 330 L272 356 L128 356 Z" fill="${GD}" fill-opacity="0.5"/>
    <path d="M118 440 L282 440 L281 426 L119 426 Z" fill="${GD}" fill-opacity="0.45"/>
    <path d="M200 300 L200 440" stroke="${GD}" stroke-width="4" fill="none"/>
    <rect x="124" y="378" width="152" height="20" fill="${BELT}"/>
    <rect x="183" y="371" width="34" height="34" rx="3" fill="${GOLD}"/><rect x="192" y="380" width="16" height="16" fill="${BELT}"/>
  </g>
  ${arm('L', glowHand === 'L')}
  ${arm('R', glowHand === 'R')}
  <g id="head">
    <path d="M200 10 C262 12 316 68 316 156 C316 204 302 240 294 266 L106 266 C98 240 84 204 84 156 C84 68 138 12 200 10 Z" fill="${G}"/>
    <path d="M200 10 C262 12 316 68 316 156 C316 196 308 222 300 244 C300 150 262 70 200 36 Z" fill="${GL}" fill-opacity="0.55"/>
    <path d="M84 156 C84 204 98 240 106 266 L146 266 C116 230 100 180 106 104 C92 120 84 138 84 156 Z" fill="${GD}" fill-opacity="0.6"/>
    <path d="M152 30 Q122 58 112 100 M248 30 Q278 58 288 100" stroke="${GD}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M200 40 C252 42 292 86 292 156 C292 198 284 230 276 252 L124 252 C116 230 108 198 108 156 C108 86 148 42 200 40 Z" fill="${GK}"/>
    <path d="M114 110 Q114 86 138 84 L262 84 Q286 86 286 110 L288 192 Q286 230 254 240 L146 240 Q114 230 112 192 Z" fill="${M}"/>
    <path d="M114 110 Q114 86 138 84 L262 84 Q286 86 286 110 L286 120 Q200 106 114 120 Z" fill="#000000" fill-opacity="0.17"/>
    <path d="M114 122 Q200 108 286 122" stroke="${MD}" stroke-width="3" fill="none"/>
    <path d="M190 132 L210 132 L218 192 L182 192 Z" fill="${ML}"/>
    ${face(f)}
    <rect x="156" y="192" width="88" height="32" rx="5" fill="${ML}"/>
    <rect x="166" y="200" width="8" height="16" fill="${MK}"/><rect x="181" y="200" width="8" height="16" fill="${MK}"/><rect x="196" y="200" width="8" height="16" fill="${MK}"/><rect x="211" y="200" width="8" height="16" fill="${MK}"/><rect x="226" y="200" width="8" height="16" fill="${MK}"/>
    <path d="M180 186 Q160 196 152 230 M220 186 Q240 196 248 230 M170 232 Q200 238 230 232" stroke="${MD}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <circle cx="128" cy="98" r="3" fill="${MD}"/><circle cx="272" cy="98" r="3" fill="${MD}"/><circle cx="200" cy="94" r="3" fill="${MD}"/>
  </g>
  <g id="mantle">
    <path d="M106 248 Q200 230 294 248 L352 322 Q200 338 48 322 Z" fill="${GL}"/>
    <path d="M106 248 Q200 230 294 248 L302 260 Q200 242 98 260 Z" fill="${GD}" fill-opacity="0.75"/>
    <path d="M48 322 Q200 338 352 322 L344 311 Q200 327 56 311 Z" fill="${GD}" fill-opacity="0.35"/>
    <path d="M146 282 Q200 316 254 282" stroke="${GOLD}" stroke-width="6" fill="none"/>
    <circle cx="146" cy="280" r="18" fill="${GOLD}"/><circle cx="146" cy="280" r="10" fill="${GOLDD}"/><circle cx="146" cy="280" r="5" fill="${GOLD}"/>
    <circle cx="254" cy="280" r="18" fill="${GOLD}"/><circle cx="254" cy="280" r="10" fill="${GOLDD}"/><circle cx="254" cy="280" r="5" fill="${GOLD}"/>
  </g>
</svg>`,
});
