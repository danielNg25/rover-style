// QA trial of the character standard (CHARACTERS.md): ONE generated sheet (gen/test-char-sheet.png), sliced by
// tools/art/template/slice.py, rigged by fromTemplate. No pixel position is typed in this file or in the rig file.
// Composition "test-char-model": frame 0 = line-up (mannequin, the new character front and back, the lead),
// frame 1 = the eight expression presets, frame 2 = arm raise with each hand variant, prop, back, extremes, builds,
// frames 10.. = a short acted take through tAct + expressionBeats (neutral -> pleased -> doubtful, arm comes up).
import React from 'react';
import {Composition, Still, useCurrentFrame} from 'remotion';
import {Stage, StageCanvas, SignText, camHold, V3} from '../../kit';
import {Puppet, lintBeats} from '../../puppet';
import type {Pose, PuppetRig} from '../../puppet';
import {fromTemplate, lids, tAct, worldHeight, expr, expressionBeats, EXPRESSION_NAMES, HANDS} from '../../puppet/template';
import type {TemplateBeat} from '../../puppet/template';
import {DOOM} from '../../chars/_lib/doom';
import {MANNEQUIN} from '../../chars/_lib/_template-demo';
import {TEST_CHAR, TEST_CHAR_MANIFEST} from '../../chars/_lib/_test-char';

const A = 2.6;                                             // world height of a standard adult
const PHO = fromTemplate(TEST_CHAR_MANIFEST, {build: 'heavy', name: 'pho-pleased', rest: expr('pleased')});
const ADULT = fromTemplate(TEST_CHAR_MANIFEST, {build: 'adult', name: 'pho-adult'});
const CHILD = fromTemplate(TEST_CHAR_MANIFEST, {build: 'child', name: 'pho-child'});
const BG = '#e9e4d6';
const Tag: React.FC<{text: string; pos: V3}> = ({text, pos}) => <SignText text={text} pos={pos} height={0.17} color="#3a2f2a" upper={false} weight={600} />;
const P = (p: Pose): Pose => lids(p);
type Item = {tag: string; rig: PuppetRig; pose?: Pose};
const Row: React.FC<{items: Item[]; y: number; dx: number}> = ({items, y, dx}) => (
  <>
    {items.map((s, i) => {
      const x = (i - (items.length - 1) / 2) * dx;
      return (
        <React.Fragment key={s.tag}>
          <Puppet rig={s.rig} height={s.rig === DOOM ? A : worldHeight(s.rig, A)} pos={[x, y, 0]} shadow={false} pose={s.pose ?? {}} />
          <Tag text={s.tag} pos={[x, y - 0.22, 0.2]} />
        </React.Fragment>
      );
    })}
  </>
);
const hasProp = !!TEST_CHAR.variants?.prop, hasBack = !!TEST_CHAR.views?.back;

const LINEUP: Item[] = [
  {tag: 'mannequin', rig: MANNEQUIN},
  {tag: 'test-char (heavy), rest only', rig: TEST_CHAR},
  {tag: 'rest = pleased', rig: PHO},
  ...(hasBack ? [{tag: 'back view', rig: TEST_CHAR, pose: {view: 'back'} as Pose}] : []),
  {tag: 'the lead, same scale', rig: DOOM},
];
const FACES: Item[] = EXPRESSION_NAMES.map((n) => ({tag: n, rig: TEST_CHAR, pose: P({...expr(n)})}));
const RAISE: Item[] = HANDS.map((h) => ({tag: `arm raise: ${h}`, rig: TEST_CHAR,
  pose: P({shR: 120, elR: 35, handR: h, shL: 8, ...expr('neutral'), ...(h === 'grip' && hasProp ? {shL: 40, elL: 75, handL: 'grip', sel: {lids: 'both', prop: 'held'}} : {})})}));
const MORE: Item[] = [
  ...(hasBack ? [{tag: 'back, arm raised', rig: TEST_CHAR, pose: {view: 'back', shL: 120, elL: 30, handL: 'open', shR: 6} as Pose}] : []),
  {tag: 'arms up, tilt +8', rig: TEST_CHAR, pose: P({shL: 150, elL: 20, shR: 150, elR: 20, headTilt: 8, handL: 'open', handR: 'fist', ...expr('pleased')})},
  {tag: 'arms out, lean 6, tilt -8', rig: TEST_CHAR, pose: P({shL: 90, elL: 0, shR: 70, elR: 100, lean: 6, headTilt: -8, handL: 'point', handR: 'grip', ...expr('angry')})},
  {tag: 'turn +1, eyes shut', rig: TEST_CHAR, pose: P({turn: 1, eyeOpen: 0, mouth: 'flat', hipL: 12, kneeL: -20})},
  {tag: 'turn -1, looks up', rig: TEST_CHAR, pose: P({turn: -1, up: 0.8, px: -0.8, py: 0.7, mouth: 'small'})},
  {tag: 'build: adult', rig: ADULT},
  {tag: 'build: child', rig: CHILD, pose: P({...expr('surprised')})},
];

// a short acted take: the documented way (tAct + expressionBeats), checked by lintBeats
const LEN = 48;
const TAKE: TemplateBeat[] = [
  {f: 0, ...expr('neutral')},
  ...expressionBeats('pleased', 12, {from: 'neutral'}),
  {f: 18, note: 'arm comes up, pointing', shR: 95, elR: 60, handR: 'point'},
  ...expressionBeats('doubtful', 30, {from: 'pleased', extra: {headTilt: -4}}),
  {f: 40, note: 'arm down', shR: 8, elR: 0, handR: 'open'},
];
const lint = lintBeats({pho: TAKE}, LEN);
if (lint.length) console.warn('test-char take: lintBeats reports ' + JSON.stringify(lint));

const Take: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <StageCanvas bg={BG}>
      <Stage cam={camHold({pos: [0, 1.75, 6.2], look: [0, 1.7, 0], fov: 28})} f={f} len={LEN} mood="dayInterior" bg={BG}>
        <Puppet rig={TEST_CHAR} height={worldHeight(TEST_CHAR, A)} pos={[0, 0, 0]} pose={(g) => tAct(TAKE, g, {rig: TEST_CHAR, seed: 3})} />
      </Stage>
    </StageCanvas>
  );
};
const Page: React.FC<{page: number}> = ({page}) => {
  const cam = page === 0 ? {pos: [0, 1.65, 12.4] as V3, look: [0, 1.65, 0] as V3, fov: 28} : {pos: [0, 3.1, 15.2] as V3, look: [0, 3.1, 0] as V3, fov: 28};
  return (
    <StageCanvas bg={BG}>
      <Stage cam={cam} f={0} len={1} mood="dayInterior" bg={BG}>
        {page === 0 && <Row items={LINEUP} y={0} dx={2.25} />}
        {page === 1 && <><Row items={FACES.slice(0, 4)} y={3.5} dx={2.5} /><Row items={FACES.slice(4)} y={0} dx={2.5} /></>}
        {page === 2 && <><Row items={RAISE} y={3.5} dx={2.7} /><Row items={MORE} y={0} dx={1.95} /></>}
      </Stage>
    </StageCanvas>
  );
};

// one line in Root.tsx; ids: test-char-model (line-up), test-char-model-faces, test-char-model-hands, test-char-take
export const TestCharComps: React.FC = () => (
  <>
    {['', '-faces', '-hands'].map((n, i) => <Still key={n} id={`test-char-model${n}`} component={Page} width={1920} height={1080} defaultProps={{page: i}} />)}
    <Composition id="test-char-take" component={Take} width={1280} height={720} fps={24} durationInFrames={LEN} />
  </>
);
