import React from 'react';
import {Composition, Still, useCurrentFrame} from 'remotion';
import {Stage, StageCanvas, camPush, Box, Rect, SignText, V3} from '../kit';
import {Puppet, act} from '../puppet';
import type {Pose, PuppetRig} from '../puppet';
import {fromTemplate, lids, tAct, worldHeight, expr, expressionBeats, EXPRESSION_NAMES, HANDS} from '../puppet/template';
import type {Manifest, TemplateBeat} from '../puppet/template';
import {DOOM, DOOM_FACE} from '../chars/_lib/doom';
import {MANNEQUIN, MANNEQUIN_MANIFEST} from '../chars/_lib/_template-demo';
import {MODELS} from '../puppet/template/models.gen';

/* The character standard, shown on the grey mannequin (the template sheet sliced as if it were a character).
 *   template-demo     72 frames: the auto-rigged mannequin goes through the eight expressions, raises an arm, shows
 *                     each hand variant and its prop; a child build stands left, the main character right for scale.
 *   model-<id>        THE MODEL SHEET every new character is accepted on (eight expressions, the extremes, hands,
 *                     back view, build variants, next to the lead), and
 *   model-<id>-faces  the eight expressions as close-ups, to compare with the expression chart.
 * Both exist for every character slice.py has cut: it lists them in src/puppet/template/models.gen.ts. Nobody edits
 * this file for a new character. ModelSheet and FaceSheet are exported for a still of your own. */

const ADULT = 2.7;   // world height of a standard adult = the lead's
const LEN = 72;
// expressions every 8 frames (a test card: a shot holds each at least 12 frames), arms and hands on the frames between
const FACE: TemplateBeat[] = EXPRESSION_NAMES.flatMap((n, i) => (i === 0 ? [{f: 0, ...expr(n)} as TemplateBeat] : expressionBeats(n, i * 8, {blink: false})));
const BODY: TemplateBeat[] = [
  {f: 4, note: 'right arm comes up, pointing', shR: 78, elR: 62, handR: 'point'},
  {f: 20, note: 'fist', handR: 'fist', headTilt: 4},
  {f: 28, note: 'left hand takes the prop', shL: 34, elL: 80, handL: 'grip', sel: {prop: 'held'}},
  {f: 36, note: 'grip', handR: 'grip', elR: 96, headTilt: -3},
  {f: 44, note: 'looks at the lead', turn: 0.7, lean: 2},
  {f: 52, note: 'open hand', handR: 'open', shR: 118, elR: 30},
  {f: 60, note: 'arms come down', shR: 10, elR: 0, shL: 8, elL: 0, turn: 0, lean: 0, headTilt: 0, handL: 'open', sel: {prop: 'none'}},
];
const BEATS = [...FACE, ...BODY].sort((a, b) => a.f - b.f);
const CHILD = fromTemplate(MANNEQUIN_MANIFEST, {build: 'child', name: 'mannequin-child'});
const manAt = (f: number) => tAct(BEATS, f, {rig: MANNEQUIN, seed: 1});
const childAt = (f: number) => tAct([{f: 0, ...expr('pleased')}, {f: 26, blink: true}, {f: 30, ...expr('surprised'), headTilt: 5}, {f: 50, turn: 0.6, px: 0.5}], f, {rig: CHILD, seed: 5});
const doomAt = (f: number) => act([{f: 0, ...DOOM_FACE.neutral}, {f: 22, turn: -0.6, px: -0.6}, {f: 46, blink: true}], f, {rig: DOOM, seed: 2});
const cam = camPush({pos: [0.1, 1.75, 8.4], look: [0.1, 1.6, 0], fov: 30}, {pctPerSec: 1});
const Room: React.FC<{w?: number}> = ({w = 24}) => (
  <>
    <Box size={[w, 0.2, 10]} pos={[0, -0.1, 0]} color="#b9a48c" />
    <Box size={[w, 9, 0.3]} pos={[0, 4.5, -3]} color="#ddd3bd" />
    <Rect w={w} h={1.1} pos={[0, 0.55, -2.84]} color="#c6b79b" />
  </>
);
const Demo: React.FC = () => {
  const f = useCurrentFrame(), name = EXPRESSION_NAMES[Math.min(7, Math.floor(f / 8))];
  return (
    <StageCanvas bg="#ddd3bd">
      <Stage cam={cam} f={f} len={LEN} mood="dayInterior" name="template-demo">
        <Room />
        <SignText text={name} pos={[-0.2, 3.55, -2.8]} height={0.26} color="#5a3c2e" board="#f3e6c0" />
        <Puppet rig={CHILD} pose={childAt} height={worldHeight(CHILD, ADULT)} pos={[-2.3, 0, 0.3]} />
        <Puppet rig={MANNEQUIN} pose={manAt} height={worldHeight(MANNEQUIN, ADULT)} pos={[-0.2, 0, 0]} />
        <Puppet rig={DOOM} pose={doomAt} height={ADULT} pos={[2.3, 0, 0.2]} />
      </Stage>
    </StageCanvas>
  );
};

/* ---- the model sheet (a one-frame still, so plain pose objects are allowed) */
const Tag: React.FC<{text: string; pos: V3}> = ({text, pos}) => <SignText text={text} pos={pos} height={0.17} color="#3a2f2a" upper={false} weight={600} />;
export const ModelSheet: React.FC<{rig: PuppetRig; manifest: Manifest}> = ({rig, manifest}) => {
  const h = 2.6, H = worldHeight(rig, h), dx = 2.05, x0 = -dx * 3.5, y1 = 3.4, y2 = 0;
  const builds = (['child', 'heavy', 'tall'] as const).map((b) => fromTemplate(manifest, {build: b, name: `${rig.name}-${b}`}));
  const P = (p: Pose): Pose => lids(p, rig);
  const second: {tag: string; rig?: PuppetRig; pose?: Pose; height?: number}[] = [
    {tag: 'arms up, tilt +8', pose: P({shL: 150, elL: 20, shR: 150, elR: 20, headTilt: 8, handL: 'open', handR: 'fist', ...expr('pleased')})},
    {tag: 'arms out, lean 6, tilt -8', pose: P({shL: 90, elL: 0, shR: 70, elR: 100, lean: 6, headTilt: -8, handL: 'point', handR: 'grip', ...expr('angry'), sel: {lids: 'both', ...(rig.variants?.prop ? {prop: 'none'} : {})}})},
    {tag: 'turn +1, eyes shut', pose: P({turn: 1, eyeOpen: 0, mouth: 'flat', hipL: 12, kneeL: -20})},
    {tag: 'turn -1, up, prop', pose: P({turn: -1, up: 0.8, px: -0.8, py: 0.7, mouth: 'small', shL: 40, elL: 70, handL: 'grip', ...(rig.variants?.prop ? {sel: {prop: 'held'}} : {})})},
    ...(rig.views?.back ? [{tag: 'back', pose: {view: 'back', shL: 20, shR: 4} as Pose}] : []),
    ...builds.map((b, i) => ({tag: `build: ${['child', 'heavy', 'tall'][i]}`, rig: b, height: worldHeight(b, h)})),
  ];
  return (
    <StageCanvas bg="#e9e4d6">
      <Stage cam={{pos: [0, 3.05, 19.6], look: [0, 3.05, 0], fov: 28}} f={0} len={1} mood="dayInterior" bg="#e9e4d6">
        {EXPRESSION_NAMES.map((n, i) => (
          <React.Fragment key={n}>
            <Puppet rig={rig} height={H} pos={[x0 + i * dx, y1, 0]} shadow={false} pose={P({...expr(n), handL: HANDS[i % 4], handR: HANDS[(i + 2) % 4]})} />
            <Tag text={n} pos={[x0 + i * dx, y1 - 0.22, 0.2]} />
          </React.Fragment>
        ))}
        {second.map((s, i) => (
          <React.Fragment key={s.tag}>
            <Puppet rig={s.rig ?? rig} height={s.height ?? H} pos={[x0 - 0.5 + i * dx * 0.9, y2, 0]} shadow={false} pose={s.pose ?? {}} />
            <Tag text={s.tag} pos={[x0 - 0.5 + i * dx * 0.9, y2 - 0.22, 0.2]} />
          </React.Fragment>
        ))}
        <Puppet rig={DOOM} height={h} pos={[x0 - 0.5 + 8.05 * dx * 0.9, y2, 0]} shadow={false} />
        <Tag text="the lead, same scale" pos={[x0 - 0.5 + 8.05 * dx * 0.9, y2 - 0.22, 0.2]} />
      </Stage>
    </StageCanvas>
  );
};

/** the eight expressions, head and shoulders, two rows of four (a one-frame still) */
export const FaceSheet: React.FC<{rig: PuppetRig}> = ({rig}) => {
  const h = 2.6, H = worldHeight(rig, h), dx = 2.1, face = (rig.height / 520) * h - 0.62;   // world y of the middle of the face above the soles
  return (
    <StageCanvas bg="#e9e4d6">
      <Stage cam={{pos: [0, 0.1, 9.8], look: [0, 0.1, 0], fov: 28}} f={0} len={1} mood="dayInterior" bg="#e9e4d6">
        {EXPRESSION_NAMES.map((n, i) => {
          const row = i < 4 ? 0 : 1, x = ((i % 4) - 1.5) * dx, y = (row ? -1.0 : 1.3) - face, z = row * 0.4;
          return (
            <React.Fragment key={n}>
              <Puppet rig={rig} height={H} pos={[x, y, z]} shadow={false} pose={lids({...expr(n)}, rig)} />
              <Tag text={n} pos={[x, y + face - 1.02, z + 0.3]} />
            </React.Fragment>
          );
        })}
        {/* a paper strip hides the bodies of the upper row behind the lower row */}
        <Rect w={30} h={3} pos={[0, -1.72, 0.2]} color="#e9e4d6" />
      </Stage>
    </StageCanvas>
  );
};

const stillId = (id: string) => id.replace(/[^a-zA-Z0-9-]/g, '');
export const TemplateDemoComps: React.FC = () => (
  <>
    <Composition id="template-demo" component={Demo} width={1280} height={720} fps={24} durationInFrames={LEN} />
    {MODELS.map((s) => (
      <React.Fragment key={s.id}>
        <Still id={`model-${stillId(s.id)}`} component={ModelSheet} width={1920} height={1080} defaultProps={{rig: s.rig, manifest: s.manifest}} />
        <Still id={`model-${stillId(s.id)}-faces`} component={FaceSheet} width={1920} height={1080} defaultProps={{rig: s.rig}} />
      </React.Fragment>
    ))}
  </>
);
