import type {RigDef} from '../three/SvgRig';

export type Mood = 'neutral' | 'sad' | 'happy' | 'shock' | 'angry';
export type HumanOpts = {
  skin?: string; hair?: string; top?: string; topDark?: string; legs?: string; shoes?: string;
  hairStyle?: 'short' | 'long' | 'bald';
  dress?: string; // if set: long dress colour down to the floor
  crown?: boolean; beard?: string; puff?: boolean; cape?: string; clasp?: boolean; eye?: string;
  mood?: Mood;
};
const BR = '#5a3a26';

const faceArt = (mood: Mood) => {
  const c = {
    neutral: {lid: 0, brow: ['M134 96 Q160 88 186 96', 'M266 96 Q240 88 214 96'], mouth: `<path d="M180 214 L220 214" stroke="${BR}" stroke-width="5" stroke-linecap="round" fill="none"/>`},
    sad:     {lid: 10, brow: ['M134 104 Q160 86 188 86', 'M266 104 Q240 86 212 86'], mouth: `<path d="M178 220 Q200 204 222 220" stroke="${BR}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`},
    happy:   {lid: 0, brow: ['M134 92 Q160 82 186 92', 'M266 92 Q240 82 214 92'], mouth: `<path d="M174 208 Q200 232 226 208" stroke="${BR}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`},
    shock:   {lid: 0, brow: ['M134 84 Q160 72 186 82', 'M266 84 Q240 72 214 82'], mouth: `<ellipse cx="200" cy="218" rx="14" ry="17" fill="#3a1a14"/>`},
    angry:   {lid: 12, brow: ['M134 92 L190 112', 'M266 92 L210 112'], mouth: `<rect x="176" y="206" width="48" height="16" rx="5" fill="#ffffff" stroke="${BR}" stroke-width="3"/>`},
  }[mood];
  return `
    <ellipse cx="164" cy="150" rx="40" ry="43" fill="#ffffff"/><ellipse cx="236" cy="150" rx="40" ry="43" fill="#ffffff"/>
    <circle cx="170" cy="156" r="11" fill="EYE"/><circle cx="230" cy="156" r="11" fill="EYE"/>
    <circle cx="174" cy="152" r="3.5" fill="#ffffff"/><circle cx="234" cy="152" r="3.5" fill="#ffffff"/>
    ${c.lid ? `<path d="M122 ${128 + c.lid} L202 ${118 + c.lid} L202 100 L122 100 Z" fill="SKIN"/><path d="M278 ${128 + c.lid} L198 ${118 + c.lid} L198 100 L278 100 Z" fill="SKIN"/>` : ''}
    <path d="${c.brow[0]}" stroke="HAIRD" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="${c.brow[1]}" stroke="HAIRD" stroke-width="7" stroke-linecap="round" fill="none"/>
    ${c.mouth}`;
};

/** Generic cut-out person, front view. viewBox 400 x 560, ground at y=540. */
export const humanRig = (o: HumanOpts = {}): RigDef => {
  const skin = o.skin ?? '#f0c6a0', hair = o.hair ?? '#6b4a2e', top = o.top ?? '#c8553d', topD = o.topDark ?? '#a8452f';
  const legs = o.legs ?? '#5b5148', shoes = o.shoes ?? '#3b332d', mood = o.mood ?? 'neutral';
  const sad = mood === 'sad';
  const lidFix = (s: string) => s.replace(/EYE/g, o.eye ?? '#6a4630').replace(/SKIN/g, skin).replace(/HAIRD/g, o.hairStyle === 'bald' ? BR : hair);
  const lower = o.dress
    ? `<path d="M140 380 L260 380 L296 540 L104 540 Z" fill="${o.dress}"/>
       <path d="M170 400 L156 540 M200 404 L200 540 M230 400 L244 540" stroke="${topD}" stroke-width="4" stroke-linecap="round" fill="none"/>
       <ellipse cx="172" cy="538" rx="26" ry="10" fill="${shoes}"/><ellipse cx="228" cy="538" rx="26" ry="10" fill="${shoes}"/>`
    : `<rect x="156" y="400" width="38" height="112" rx="8" fill="${legs}"/><rect x="206" y="400" width="38" height="112" rx="8" fill="${legs}"/>
       <ellipse cx="170" cy="528" rx="32" ry="14" fill="${shoes}"/><ellipse cx="230" cy="528" rx="32" ry="14" fill="${shoes}"/>`;
  const hairBack = o.hairStyle === 'long' ? `<path d="M104 120 Q96 40 200 34 Q304 40 296 120 L316 400 L250 420 L150 420 L84 400 Z" fill="${hair}"/>` : '';
  const hairFront = o.hairStyle === 'bald' ? '' : o.hairStyle === 'long'
    ? `<path d="M100 150 Q92 40 200 36 Q308 40 300 150 Q276 76 200 82 Q124 76 100 150 Z" fill="${hair}"/>
       <path d="M100 140 Q86 240 96 352 Q112 362 128 350 Q118 250 122 170 Z" fill="${hair}"/><path d="M300 140 Q314 240 304 352 Q288 362 272 350 Q282 250 278 170 Z" fill="${hair}"/>`
    : `<path d="M104 132 Q92 38 200 34 Q308 38 296 132 Q286 86 240 88 Q200 70 150 90 Q112 96 104 132 Z" fill="${hair}"/>`;
  const armArt = (k: number) => {
    const X = (d: number) => 200 + k * d;
    if (o.clasp) return `<path d="M${X(70)} 300 Q${X(74)} 366 ${X(14)} 392" stroke="${skin}" stroke-width="24" stroke-linecap="round" fill="none"/>
      <circle cx="${X(66)}" cy="284" r="31" fill="${top}"/><path d="M${X(92)} 300 Q${X(66)} 318 ${X(40)} 300" stroke="${topD}" stroke-width="4" fill="none"/>
      <circle cx="${X(10)}" cy="394" r="16" fill="${skin}"/>`;
    return `<path d="M${X(66)} 280 L${X(78)} 384" stroke="${top}" stroke-width="${o.puff ? 34 : 30}" stroke-linecap="round" fill="none"/>
      ${o.puff ? `<circle cx="${X(66)}" cy="282" r="27" fill="${top}"/>` : ''}
      <circle cx="${X(79)}" cy="400" r="17" fill="${skin}"/>`;
  };
  return {
    height: 520, footY: 540, centerX: 200,
    parts: {
      back: {}, legs: {}, body: {pivot: [200, 400]},
      armL: {parent: 'body', pivot: [134, 276]}, armR: {parent: 'body', pivot: [266, 276]},
      head: {parent: 'body', pivot: [200, 244]},
    },
    svg: lidFix(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560">
    <g id="back">${o.cape ? `<path d="M120 262 C70 300 44 400 52 500 Q200 530 348 500 C356 400 330 300 280 262 Z" fill="${o.cape}"/>` : ''}${hairBack}</g>
    <g id="legs">${lower}</g>
    <g id="body">
      <path d="M142 254 L258 254 L266 410 L134 410 Z" fill="${top}"/>
      <path d="M142 254 L258 254 L260 284 L140 284 Z" fill="${topD}" fill-opacity="0.5"/>
      ${o.dress ? `<rect x="134" y="372" width="132" height="14" fill="${topD}"/>` : ''}
    </g>
    <g id="armL">${armArt(-1)}</g>
    <g id="armR">${armArt(1)}</g>
    <g id="head">
      <ellipse cx="103" cy="160" rx="13" ry="18" fill="${skin}"/><ellipse cx="297" cy="160" rx="13" ry="18" fill="${skin}"/>
      <path d="M200 40 C262 40 300 84 298 150 C296 214 254 252 200 252 C146 252 104 214 102 150 C100 84 138 40 200 40 Z" fill="${skin}"/>
      ${faceArt(mood)}
      ${o.beard ? `<path d="M118 190 Q200 190 282 190 Q280 262 200 270 Q120 262 118 190 Z M176 ${sad ? 222 : 216} Q200 204 224 ${sad ? 222 : 216} Q200 226 176 ${sad ? 222 : 216} Z" fill="${o.beard}" fill-rule="evenodd"/>` : ''}
      ${hairFront}
      ${o.crown ? `<path d="M132 62 L132 14 L158 40 L180 6 L200 38 L220 6 L242 40 L268 14 L268 62 Z" fill="#e3b22e"/><rect x="132" y="56" width="136" height="12" fill="#c9952a"/>` : ''}
    </g>
  </svg>`),
  };
};
