# PUPPET: flat cut-out characters for shot builders

Import from `src/puppet` (engine) and `src/chars/_lib/<name>` (rig data). Use it together with the kit (`KIT.md`): the puppet stands inside a `<Stage>`. Living examples: `src/demo/PuppetDemo.tsx` (compositions `puppet-demo`, `puppet-cycles`, still `puppet-equiv`). Do not use `ImageRig`, `doomImg.ts`, `facePose` or `doomHands` in new shots: the same character is `DOOM` here.

```tsx
import {Puppet, act, mix, beatFrames, beatSpans, lintBeats, puppetPoint, puppetAttach, hop, talk} from '../puppet';
import {DOOM, DOOM_FACE, DoomBeat} from '../chars/_lib/doom';

const doomAt = (f: number) => act(BEATS, f, {rig: DOOM, seed: 1});   // acting on twos, from a beat list
<Puppet rig={DOOM} pose={doomAt} height={2.7} pos={[-2, 0, 0]} />     // stands on the floor at pos, blob shadow included
```

`Puppet` props:

| Prop | Meaning |
|---|---|
| `rig`, `height` | the rig data; world height, feet to top |
| `pose` | IN A SHOT: A FUNCTION OF THE FRAME, `(f) => Pose`. The puppet evaluates it for this frame and the one before and THROWS when an odd frame differs from the even frame before it, so a per-frame tween or sine on a character cannot be rendered. A plain pose object is accepted only in a one-frame `Still`; in a moving shot it throws (a frozen figure fails liveness anyway) |
| `pos?` | the point on the ground under the figure; a function of the frame for a puppet that travels (`(f) => glide(f, a, b, f0, f1)`), checked the same way |
| `flip?`, `tint?` | mirror the whole figure; multiply colour |
| `shadow?` | default true: one soft blob that stays on the floor and shrinks during a hop |
| `order?` | draw order of the pieces, default 10 (one puppet uses about 10-30). Leave it alone: depth sorts puppets against the set, and see-through cards (a tinted pane, a light shaft, a glow) are drawn after puppets by the kit, so one in front of a figure tints it and one behind is hidden. Raise it only for a puppet that must draw over another puppet at the same depth |

## 1. Rigs that exist

| Rig | File | Kind | Picks |
|---|---|---|---|
| `DOOM` | `_lib/doom.ts` | jointed, layered face (slit eyes, pupils, brows), covered mouth, cape that shears | `handL` / `handR`: `fist`, `open`, `glow`; `view: 'back'` (one drawing, no points of its own); presets `DOOM_FACE.angry / neutral / sad / squint / wide`; points `palmL`, `palmR`, `top`, `mouth`; types `DoomPose`, `DoomBeat` |
| `KING` | `_lib/king.ts` | body drawing + whole-arm drawings + second head + lids | `handL` / `handR`: `rest`, `chin`, `up`; `sel: {head: 'calm' or 'shock'}`; presets `KING_FACE.smug / squint / shock`; `shL` / `shR` limited to -20..35 (outside throws); NO head tilt (`headTilt`, `headX`, `headY` do nothing: the calm head is part of the body picture); types `KingPose`, `KingBeat` |
| `VILLAGER` | `_lib/villager.ts` | single picture with blink lids | `sel: {pic: 'base' or 'shock'}`; types `VillagerPose`, `VillagerBeat` |
| `ELEPHANT` | `_lib/elephant.ts` | side view, four separate legs | drive with `quadGait(ELEPHANT, f)` |
| `WALKER` | `_lib/walker.ts` | TEST RIG from flat shapes, no art: side view with thigh / shin / foot, a hips role, hair that follows the head, one-eyed profile face, a staff as a rig piece | `sel: {prop: 'none' or 'staff'}`; `walk(f, {sc, leg: 200})`. Copy its structure for a legged character |

A pick the rig does not have (`sel: {pic: 'nope'}`, `handL: 'opne'`, `view: 'side'`, an unknown `sel` group) THROWS in `solve`, so in every `Puppet` and in `lintBeats`; it never falls back silently. Type your beat lists with the rig's own type (`const BEATS: DoomBeat[] = [...]`) and the same typo fails in `tsc`. A channel outside `rig.limits` throws too.

## 2. The rig format (`PuppetRig`, `src/puppet/types.ts`)

All numbers are canvas pixels, x right, y DOWN.

| Field | Meaning |
|---|---|
| `name`, `canvas: [w, h]` | design canvas |
| `groundY`, `centerX` | the ground line and the x that sit on `pos` |
| `height` | px from ground to top; the `height` prop maps to it |
| `pieces: {name: {src, x, y, w, h?, pivot, parent?, z, mirror?, tint?}}` | one picture piece: file under `public/`, top-left, drawn width (height follows the picture unless given), the joint it turns about, the piece it is attached to, stacking order (higher = nearer), left-right flip so one arm drawing serves both sides. A piece may be a flat shape instead: `{shape: 'ellipse' or 'rect', fill, x, y, w, h, ...}` (blink lids) |
| `roles` | which pieces the channels drive: `body[]` (lean), `hips[]` (the idle bob: torso or pelvis rises and sinks while the legs stay planted; the legs must NOT be children of these pieces; without it the bob moves the whole puppet, right for robed and single-picture rigs), `head` (tilt, offset), `cloth[]` (hangs and lags: a name follows the body, `{piece, follows: 'head'}` is hair, a veil, a ribbon; cloth SHEARS about its pivot so the hem stays level and never dips through the floor), `hem[]` (flips on a fake walk), `arms.L / arms.R: {upper[], lower[], end[]}`, `legs.L / legs.R: {upper[], lower[], end[]}`, `quad: {nearHind, nearFront, farHind, farFront, body?, tail?, ear?, trunk?}` |
| `variants: {group: {default, options: {id: [pieces]}}}` | swap groups, one option visible. Standard names: `handL`, `handR`, `mouth`, `head` |
| `face` | layered face: `base` (blank face), `eyes.L / eyes.R: {plate?, white?, pupil?, lid?, brow?}` (a profile gives only the eye it shows), `nose?`, `mouth?`, `extras?`, `parallax` (px each layer slides per unit of turn and of look-up), `pupilTravel`, `openScalesWhite` (slit eyes) or `lidTravel` (lid pieces) |
| `rest?`, `limits?` | the character's neutral pose; allowed range per channel, `{shL: [-20, 35]}` (outside throws) |
| `views?: {back: rig, threeQuarter: rig}` | other drawings of the same character, chosen with `view`. A view is a rig of its own: its own `rest` (act() starts from it while that view shows), its own `points` and variants |
| `shadow?`, `points?` | blob radius in px; named attach points `{piece, at}` |

Single picture: `singlePicture({name, src, size, eyes?: [{at, r}], skin?, alts?: {id: {src, size, eyes?}}})` returns a rig that blinks (skin-coloured lids over the drawn eyes), leans, squashes, hops, shivers and fake-walks; swap the drawing with `sel: {pic: id}`.

## 3. Channels (`Pose`): plain numbers, "up" and "raise" are positive everywhere

| Group | Channels |
|---|---|
| Face | `turn` (-1 screen left .. +1 right, layers slide with parallax), `up` (-1..1), `eyeOpen` (1 open, 0.45 squint, 0 shut), `eyeSlant` (+ angry, - sad), `browL`, `browR` (angle, + angry), `browYL`, `browYR` (px, + raised), `px`, `py` (pupils -1..1, + right, + up), `mouth` (id) |
| Head | `headTilt` (degrees, + clockwise), `headX`, `headY` (px) |
| Body | `bodyX`, `bodyY` (whole puppet, px: a step aside, a hop, a walk dip), `bob` (px, the idle rise and sink: moves `roles.hips` above planted legs), `lean` (degrees, + to screen right), `squash` (0.1 = 10 % shorter and wider; negative stretches), `cloth` and `hair` (shear of the body-following and head-following cloth, degrees; act() fills both), `hem` |
| Arms | `shL`, `elL`, `wrL`, `shR`, `elR`, `wrR`: shoulder, elbow, wrist in degrees; + raises the arm outward on BOTH sides |
| Hands | `handL`, `handR` (variant id) |
| Legs | `hipL`, `kneeL`, `footL`, `hipR`, `kneeR`, `footR` (rigs with leg pieces) |
| Other | `view`, `sel: {group: id}`, `parts: {piece: {rot, x, y, sx, sy, hide}}` (raw escape hatch) |

L = screen left. Channels a rig has no pieces for are ignored. `mix(base, ...more)` adds poses (numbers add, picks take the last). `solve(rig, pose)` returns the piece transforms. `parts` entries also take `skew` (shear in degrees about the pivot).

Attaching things: `puppetPoint(rig, pose, piece, [x, y] or pointName, height, pos, flip?)` returns the world position of a point riding on a piece, in front of the whole puppet: glue a glow or sparks to it. `puppetAttach(same arguments, lift = 0.5)` returns `{pos, rot, deg}`: the position at the depth of that piece (`lift` piece-steps in front of it; negative = behind it, so a prop can sit between layers) and the piece's turn (`rot` in radians for `<group position={a.pos} rotation={[0, 0, a.rot]}>`), so a held prop turns with the hand. A prop the character holds for the whole shot is better made a rig piece in a variant group (see the staff of `WALKER`). POINTS ARE PER VIEW: a view without the named point (DOOM's one-drawing back view) falls back to the front point, mirrored, with one console warning; it does not throw.

## 4. Acting = a beat list

```ts
type Beat = {f: number; note?: string; blink?: boolean; n?: number; dip?: boolean} & Pose;
const pose = act(beats, f, {rig, seed, alive});
```

A beat names only the channels that change on that frame; everything else keeps its value. Beat 0 is the start pose. `act` does the rest:

- every value changes only on EVEN frames (on twos) and passes through staged in-betweens: even steps, the last one half-size. This holds for every channel, cloth and hair included;
- no drawing moves a channel further than its limit: head tilt 5 degrees, turn 0.45, lean 3 degrees, shoulder 22 degrees, elbow 26 degrees, body 12 px (px of a 520 px rig). A bigger change simply takes more drawings;
- with `rig` given, the travel of the head top and of each hand is measured for every beat: over 15 px (head) or 25 px (hand) the move gets an in-between drawing, over 4 times that a second one. This is bible 8.5 as the reference does it (a hand goes from the armrest to the chin through two travel poses; arms ease over 8-12 f). It is not a 25 px cap on every drawing;
- faces and hand swaps snap, heads and bodies take 4 frames or more, arms 8 or more. `n` on a beat can only LENGTHEN a move (`n: 12` for a slow arm); it can never make one shorter than the limits above allow, so `n: 2` on a big move does not pop;
- eyes lead: on a beat that moves the head the pupils go one drawing (2 frames) early;
- a big head or body change gets a small head dip on its first drawings (`dip: false` forbids it);
- cloth follows the lean, and hair the head, one drawing (2 frames) late;
- a held pose stays alive: bob, head tilt, pupil dart, arm settle as HELD offsets that change on twos on separate clocks (give each puppet its own `seed`; `alive: 0.5` for a far extra);
- blinks happen only on beats with `blink: true` (2 frames shut, 2 half).

Rules for writing beats: even frames; one beat at least every 1.5 s; a featured puppet 1.5-2.5 changes per second; two puppets never change on the same frame; start the next move of a limb after the previous one has landed (`beatSpans(beats, {rig})` lists `{f, end}` for each beat).

`lintBeats({doom: {beats, rig: DOOM, seed: 1}, king: {beats, rig: KING, seed: 2, extra: (f) => hop(f, 30)}}, len)` returns the violations; call it and throw. It reports the rules above, and it also PLAYS the acting frame by frame: an unknown pick or out-of-range channel, any change on an odd frame, a pop (head over about 15 px or hand over about 25 px in one drawing with no in-between), and overlapping moves that carry a point further than 4 times that in one drawing. (`{doom: beats}` without a rig still checks the frame rules only.) `beatFrames(beats)` feeds the liveness declaration.

### Worked example: a 72-frame reaction (looks left, startles, raises a hand, settles)

```tsx
const REACT: DoomBeat[] = [
  {f: 0,  note: 'calm, looking at us', ...DOOM_FACE.neutral},
  {f: 8,  note: 'a noise: looks left (pupils go on frame 6 by themselves)', turn: -0.7, px: -0.7, headTilt: -3},
  {f: 18, blink: true, note: 'blink before the shock'},
  {f: 22, note: 'STARTLE: eyes wide, jumps back to the right (3 drawings, lands by frame 26)', ...DOOM_FACE.wide, bodyX: 16, bodyY: 10, lean: 6, squash: -0.04},
  {f: 28, note: 'lands', bodyY: 0, squash: 0.05},
  {f: 34, note: 'left hand comes up, open, to ward it off (5 drawings, there on frame 42)', shL: 70, elL: 95, handL: 'open', squash: 0},
  {f: 50, note: 'settles: weight back, hand lowers, wary squint', bodyX: 4, lean: 1, shL: 25, elL: 40, ...DOOM_FACE.squint, turn: -0.5},
  {f: 62, note: 'fist again', handL: 'fist', shL: 6, elL: 0},
];
const problems = lintBeats({doom: {beats: REACT, rig: DOOM, seed: 1}}, 72);   // [] for this list
const doomAt = (f: number) => act(REACT, f, {rig: DOOM, seed: 1});
// in the Scene:  if (problems.length) throw new Error(problems.join('; '));
//                <Puppet rig={DOOM} pose={doomAt} height={2.7} pos={[0, 0, 0]} />
//                const palm = puppetPoint(DOOM, doomAt(f), '', 'palmL', 2.7, [0, 0, 0]);
// liveness:      {name: 'doom', kind: 'puppet', beats: beatFrames(REACT)}
```

`./kit-check.sh` plays this list and four others: 0 changes on odd frames, largest step of one drawing 38 px for the head top and 88 px for a hand (canvas px), no pop.

## 5. Cycles (functions `f -> Pose`; add with `mix(act(...), cycle)`)

| Function | Use |
|---|---|
| `walk(f, {period, swing, arm, knee, leg, sc})` | biped with leg pieces (`roles.legs`: thigh, shin, foot), side view: legs scissor, the passing knee bends, the feet counter-turn so the soles stay level, and the figure sinks as far as the swung legs shorten (soles stay on the ground line; `leg` = hip-to-ankle px). Tested on the shape rig `WALKER` only, not yet on drawn art. Keep it tiny, from behind or under 1 s (bible 6.4) |
| `fakeWalk(f, {period, bob, lean, dir, sc})` + `glide(f, from, to, f0, f1)` | legless, robed or single-picture rigs: bob, hem flip, lean; `glide` slides the position on twos |
| `quadGait(rig, f, {period, swing, bob})` | four legs from separate pieces (`roles.quad`), tail, ear, trunk on their own phases |
| `hop(f, f0, {height, dur, sc})` | crouch, up and down, landing squash; any rig |
| `shiver(f, {amp, seed, sc})` | cold or fear jitter, alternating every drawing |
| `talk(f, [[start, end], ...], {open, closed, nod})` | phrase starts on EVEN frames; mouth flaps at phrase level (each 4-6 frames open, 4-6 closed, about 2.5 per second) plus a small nod; returns `mouth` ids for the rig's `mouth` group. A covered face shows only the nod: act such a character with eyes, brows and hands |

Pixel amounts assume a 520 px rig: pass `sc: rig.height / 520` for other sizes. Inside a shot write the cycle into the pose function: `pose={(f) => mix(act(BEATS, f, {rig}), hop(f, 52))}`, and pass the same cycle to `lintBeats` as `extra`.

## 6. Art a new character needs

Generate with the templates in `tools/art/prompts/` (always append `style.txt`; ask for "flat cut-paper shapes, hard-edged tone blocks, no soft shading"), cut with `tools/art/cut.py`, then write `src/chars/_lib/<name>.ts`.

| Level | Sheets | Pieces |
|---|---|---|
| Single picture (extras, crowd, one-line roles) | `character-full-body.txt` or `character-row.txt` | 1 whole figure, front view; a second drawing for the reaction (shocked, pointing) if it reacts. Measure eye centres and radii for the lids |
| Jointed body (speaking roles) | `body-parts.txt` | torso (flat top), back layer (cape or skirt) if any, legs as one piece with a hip block, ONE upper arm, ONE forearm, hands: fist and open palm (plus any the acting needs). The rig mirrors arms and hands. A walking biped also needs thigh and shin as separate pieces (no template yet) |
| Layered face | `face-layers.txt` | head shell (hair, hood or helmet) with an EMPTY face area, blank face, one eye plate or eye white, one pupil, one brow, nose, mouth set (closed, open; add smile and frown for a lead). An upper lid in skin colour can be a rig shape instead of art |
| Swap heads (cheap alternative to layers) | `head-expressions.txt` | 3-5 whole heads at one scale: neutral, glad, angry, shocked; used as a `head` variant group |
| Views | `character-full-body.txt` | back view as one drawing; three-quarter only for a lead that turns on screen |
| Animal | `animal-parts.txt` | body without legs, ONE near leg, ONE darker far leg, tail, ear, any trunk or neck piece; side view |

Checks before a rig is used: pieces overlap at the joints (round shoulder, flat torso top); all pieces of one sheet at one scale; no magenta fringe; a still of the rest pose, of each variant, and of the EXTREMES (lean 6 with the cloth swung, arms fully raised, head tilted 8 degrees both ways), looked at. Typical faults the extremes show: a second head under a swapped head (give the body no head, or leave `roles.head` out as `KING` does), a cloth piece cropped tight against its picture edge, a joint that opens.

## 7. What the system does not do yet

- `walk()` and the hips role are tested only on the shape rig `WALKER`; no drawn character has leg pieces yet.
- Hair follows the head through one shared `hair` channel (one lag for all head-following pieces).
- `KING` cannot tilt his head until the calm head is cut out of the body picture.
- A profile or three-quarter view is a separate rig under `views`; no drawn rig has one yet (DOOM has only `back`).
