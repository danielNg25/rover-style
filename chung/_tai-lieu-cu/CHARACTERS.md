# CHARACTERS: the standard for every human character

One skeleton, one face kit, one set of expressions. A new character is DRAWN ONTO the template sheet, cut by the slot map and rigged by code: no piece is placed by hand, every face is built the same way, and all characters come out as one family. Rig format and acting: `PUPPET.md`. Look and cast rules: `STYLE-BIBLE.md` 5 and 8.

| What | Where |
|---|---|
| Template sheet (the layout reference for the generator) | `tools/art/template/human-v2.png`; with boxes, names and joints drawn in: `human-v2-guide.png` |
| Slot map, joints, rig pieces, proportions | `tools/art/template/human-v2.json` (same data, typed: `src/puppet/template/human-v2.ts`) |
| Proof that the map is consistent | `tools/art/template/human-v2-assembled.png` (the mannequin put together again from its own sheet) |
| The first layout | `human-v1.*`: head row at body scale with 41 px of headroom. Kept so that sheets generated on it (`gen/test-char-sheet.png`) still slice; `slice.py` reads the layout from the sheet's `.prov.json`. Same skeleton and face kit |
| Tools | `tools/art/template/make_template.py` (draws all of the above), `prompt.py`, `slice.py` |
| Rig builder, expressions | `src/puppet/template/` (`fromTemplate`, `tAct`, `lids`, `expr`, `expressionBeats`, `BUILDS`, `worldHeight`) |
| Expression reference (professional frames) | `../research/rover-explains-2026-11-20/expressions/chart.jpg` and `INDEX.md` |
| Living examples | `src/demo/TemplateDemo.tsx`: composition `template-demo`, stills `model-mannequin`, `model-mannequin-faces` (rig `src/chars/_lib/_template-demo.ts`, cut from `human-v2.png`); the first generated character: `model-test-char`, `model-test-char-faces` (rig `src/chars/_lib/_test-char.ts`) |
| Single-picture extras | `tools/art/template/extra-v1.png` / `.json` (front calm, front startled, back), `extraFromTemplate` |

## 1. A new character, from brief to rig

Budget: ONE generation per character, plus ONE retry when the sheet cannot be used (see "When step 5 fails"). After a second failure stop and ask the owner; do not keep rolling. Run everything from `rover-lab/`.

| Step | Command | Look at |
|---|---|---|
| 1. Brief | copy `tools/art/template/briefs/example-miller.json` to `briefs/<id>.json` and fill it (bible 5.6: role, silhouette feature, signature colour, hair or headgear, costume motif, age and build, default expression and its flip, prop, back view; face: `iris` colour in words, `iris_hex`, `brow` thin, medium or thick) | silhouette and signature colour differ from the cast and from the home set |
| 2. Prompt | `python3 tools/art/template/prompt.py tools/art/template/briefs/<id>.json --finish <approved character picture of ours>` | it prints the next commands; `prompts/<id>.txt` reads sensibly |
| 3. Generate (sandbox disabled) | `GEN_BUDGET=2 tools/art/gen.sh --dry-run <id>-sheet.png tools/art/template/prompts/<id>.txt tools/art/template/human-v2.png [<finish picture>]`, then the same without `--dry-run` | `gen/<id>-sheet.png` next to `human-v2-guide.png`: same layout, one piece per slot, nothing between slots |
| 4. Key check | `python3 tools/art/keycheck.py gen/<id>-sheet.png` | PASS (a pink or purple costume fails: section 7) |
| 5. Cut and rig | `python3 tools/art/template/slice.py gen/<id>-sheet.png <id> --rig src/chars/_lib/<id>.ts --brief tools/art/template/briefs/<id>.json` | every line PASS; `public/<id>/overview.jpg`: all boxes green, the assembled figure below looks like a figure. The brief gives the rig its build, rest expression, iris and brow (stored as `options` in the manifest; flags `--build --rest --iris --brow` override) |
| 6. Model sheets | `./still.sh model-<id> 0 1`; `./still.sh model-<id>-faces 0 1`; `npx tsc --noEmit`. Nothing to edit: step 5 lists the character in `src/puppet/template/models.gen.ts` and `TemplateDemo.tsx` makes both stills from it | section 6 |
| 7. Use | `import {<ID>} from '../chars/_lib/<id>'`, act it with `tAct` (section 5) | |

When step 5 fails: LOOK AT `overview.jpg` FIRST, then read the failing line. Spend the retry only when the picture is wrong: a piece missing (`slots_filled`), cut by the sheet border or grown into its neighbour (`slots_whole`, red box), or something drawn between the slots (`stray_art`); add one sentence naming the fault to the brief's `notes`. These are NOT failures and need nothing: a note that a piece reaches the edge of its own box (a tall bun), a prop of any size (only `prop_grip` matters: there must be art where the hand closes), hair much taller than the grey shape, a `forehead_clear` note (the fringe was trimmed for you), a warning that the pupil is a plain dot (the rig adds the iris). `slot_deviation` on one or two slots with a good-looking overview = correct by number, not by redrawing: put `"adjust": {"cap": {"dx": 0, "dy": -6, "scale": 1.05}}` (canvas px) into `public/<id>/manifest.json` and re-run step 5 with `--force`; the entries are kept. Never type positions into the rig file: it is generated.

**Keeping a character consistent later** (a new state, an older version, a repaired piece): generate again with the character's OWN approved sheet as the second image, `prompt.py <brief> --same-as gen/<id>-sheet.png`, and name the one delta in the brief's `notes`. Cut it under a new id (`<id>-old`), so both rigs share skeleton and channels and swap freely. Keep `gen/<id>-sheet.png` and its `.prov.json`: they are the character's model.

**An extra** (crowd, one-line role): the same steps with `--template extra-v1` in steps 2 and 5 and `tools/art/template/extra-v1.png` as the layout image; the rig is `extraFromTemplate(MANIFEST, {skin})`: it blinks, leans and hops, `sel: {pic: 'startled'}` swaps the drawing, `view: 'back'` shows the back.

## 2. Proportions of the standard adult

Canvas 400 x 560 px, ground line y 540, figure 520 px tall, centre x 200 (the canvas of `DOOM`, so a template adult and the lead stand at the same scale: `height={worldHeight(rig, 2.7)}`).

| Quantity | Value |
|---|---|
| Height | 2.41 heads (head with hair = 216 px) |
| Head with hair / torso (neck to hip) / legs (hip to sole) | 0.415 / 0.323 / 0.273 of the height |
| Head width | 204 px = 0.39 of the height; the head is wider than the shoulders are apart |
| Shoulder width over the arms | 200 px (0.385) |
| Arm, shoulder top to fingertips | 182 px (0.35): the hands end just below the hip line |
| Eye white | 80.5 x 89.7 px: 0.39 of the head width, 0.49 of the head height each; the two ovals overlap by 2.5 px (the sheet draws the face kit at the size of a 70 x 78 eye; the rig enlarges it 1.15 times, toward the professional faces) |
| Eye centre / mouth centre | 0.51 / 0.85 of the head height from the top of the skull |
| Iris / black centre | 26.5 px = 0.33 of the eye width / about half of that |
| Brow | 71 px long tapered stroke, 7, 10 or 14 px thick (thin, medium, thick: set by the rig whatever was drawn), its centre 11 px above the top of the eye |
| Forehead window | x 118 to 282, y 63 to 192 on the canvas: eyes and brows move here, so no hair or brim may be inside (`slice.py` cuts it clear) |
| Hand | 46 px wide = 0.23 of the head width |

Joints (canvas px, screen-left side; the right side is the mirror about x 200): neck 200, 230 · shoulder 122, 252 · elbow 122, 306 · wrist 122, 364 · hip 166, 398 · knee 166, 462 · torso lean 200, 400 · eye 161, 145 · brow 161, 89 · mouth 200, 208.

Build variants are applied by `fromTemplate` AFTER cutting; the sheet is always drawn on the standard adult.

| Build | overall | head | limb | torso | width | Result |
|---|---|---|---|---|---|---|
| `adult` | 1 | 1 | 1 | 1 | 1 | 520 px, 2.4 heads |
| `child` | 0.8 | 1.02 | 0.72 | 0.72 | 0.88 | 0.68 of the adult, 2.0 heads |
| `heavy` | 1 | 1.02 | 1 | 1.04 | 1.32 | same height, a third wider |
| `tall` | 1 | 0.94 | 1.24 | 1.1 | 0.96 | 1.09 of the adult, 2.8 heads |

Pass your own numbers for anything else: `fromTemplate(M, {build: {overall: 0.9, head: 1, limb: 0.9, torso: 1, width: 1.1}})`. Give `<Puppet>` the height `worldHeight(rig, adultWorldHeight)` so sizes stay true between characters.

## 3. The slots (27)

| Row | Slots (left to right) | Notes |
|---|---|---|
| Top | `head` · `cap` · `backHead` (optional) · `ear` · `prop` (optional) | head = bare skin shape with NO features (beard, scar, moustache belong to it); cap = hair or headgear with an empty face opening at least as large as the template's; head, cap and backHead sit at the BOTTOM of their boxes, drawn at 1.15 instead of 1.4, so a bun or tall hat has about 100 px to grow upward; one ear, mirrored; the prop may be any shape, its handle on the template's rod |
| Middle | `torso` · `backTorso` (optional) · `upperArm` · `forearm` · `upperLeg` · `lowerLeg` · `hand_open`, `hand_fist`, `hand_point`, `hand_grip` | torso carries the neck and has a flat top; limbs hang straight down with round ends; ONE of each limb, mirrored; hands hang wrist-up, fingers down |
| Bottom (face kit, drawn at twice the size) | `eyeWhite` · `lid` · `pupil` · `brow` · `mouth_closed`, `_small`, `_wide`, `_smile`, `_frown`, `_flat`, `_o`, `_teeth` | all in their neutral shape; the rig mirrors eye, pupil and brow; the pupil is a coloured iris with a black centre |

How a cut piece is put on the canvas (per slot, in the JSON): `anchor` (centred on the mannequin piece or kept at its sheet position; top, bottom or centre) and `fit` (limbs are scaled to the mannequin's length so joints stay closed; the head to its width; everything else keeps the sheet scale). Stacking, back to front: legs 1 · torso 2 · arms 3 · ears 4.8 · head 5 · eye whites 5.2 · mouth 5.25 · pupils 5.3 · lids 5.4 · cap 5.6 · brows 5.7 · prop 7.9 · hands 8. The back view reuses legs, arms and hands behind `backTorso` and `backHead`.

Rig pieces: `thighL/R`, `shinL/R`, `torso`, `armL/R`, `foreL/R`, `openL/R`, `fistL/R`, `pointL/R`, `gripL/R`, `earL/R`, `head`, `whiteL/R`, `pupilL/R`, `lidL/R`, `lashL/R`, `browL/R`, `mouth_<id>`, `cap`, `prop`. Picks: `handL` / `handR`: `open`, `fist`, `point`, `grip`; `mouth`: the eight ids; `sel: {prop: 'held'}`; `sel: {lids: 'L' or 'R'}`; `view: 'back'`. Points: `palmL`, `palmR`, `top`, `mouth`. Types: `TemplatePose`, `TemplateBeat`.

## 4. The eyes and lids

The upper lid is a flat block in the head's own skin colour (sampled from the cut head, so it cannot mismatch), hung on its top edge. `eyeOpen` 1 = no lid; below 0.95 the block covers the eye from the top down; `eyeSlant` tilts its cutting edge (+ angry, - sad) about the point under the eye centre, so the cut is one clean straight line and no corner of the white is bared. Pass the rig when you call it yourself: `lids(pose, rig)` (`tAct` does).

**Iris.** When the sheet's pupil is a plain dark dot (`measure.pupilDark` above 0.6 in the manifest), the rig draws the standard iris ring in the brief's `iris_hex` (default brown `#7a4a2b`) and uses the drawn dot, shrunk, as its black centre; a pupil drawn with its own iris is kept as drawn. **Brows.** The art gives shape, length and colour; the rig sets the thickness from `brow`. **Hairline.** `slice.py` cuts everything the cap piece has inside the forehead window (`--keep-fringe` turns that off and fails the check instead), so raised brows always stand on skin. The engine only shows or hides the lid; the squash and tilt are added by `lids(pose)`, so ACT A TEMPLATE RIG THROUGH `tAct` (= `lids(act(...))`), and wrap your own pose functions: `pose={(f) => lids(mix(act(B, f, {rig}), hop(f, 20)))}`. A rig acted without it shows shut eyes whenever `eyeOpen` is below 0.95: the fault is visible on the first still. `fromTemplate(M, {lid: 'art'})` uses the generated lid slot instead (eye shadow, a metal lid).

## 5. Expressions

Reference: `../research/rover-explains-2026-11-20/expressions/chart.jpg` (four professional faces per expression, the recipe, the preset). Presets: `EXPRESSIONS` in `src/puppet/template/expressions.ts`; `expr(name)` gives the channels.

| Expression | Recipe | eyeOpen | eyeSlant | brow angle L/R | brow height | pupils px, py | mouth |
|---|---|---|---|---|---|---|---|
| neutral | round open eyes, level brows, short level mouth | 1 | 0 | 0 | 0 | 0, 0 | closed |
| pleased | round eyes, brows lifted and relaxed, wide upward curve | 1 | 0 | -5 | +7 | 0, 0 | smile |
| angry | lids cut the eyes on a slant down to the nose, brows pressed onto the eyes, frown or teeth | 0.62 | +20 | +24 | -11 | 0, 0 | frown |
| sad | lids droop over the outer halves, brows up at the inner ends, pupils low | 0.66 | -15 | -19 | +3 | 0, -0.45 | frown |
| surprised | fully round eyes, brows high and level, round mouth | 1 | 0 | -4 | +15 | 0, 0.1 | o |
| doubtful | one eye half shut under a low brow, the other round under a raised brow, side glance | 0.56 (screen-left lid only) | +4 | +9 / -7 | -8 / +13 | 0.55, 0 | flat |
| smug | both eyes half-lidded and level, brows high, side glance, closed smile | 0.5 | -3 | -6 | +8 | 0.4, -0.1 | smile |
| afraid | fully round eyes, brows raised and steep with inner ends up, frown (teeth for panic) | 1 | 0 | -24 | +10 | 0, 0 | frown |

Transition rule (`TRANSITION`): a face snaps, it never morphs. Pupils first (2 frames early), lids and brows together on the beat, mouth 2 frames later: 3 drawings on twos = 6 frames. Opposites (pleased to angry, sad or afraid; smug to afraid or sad; neutral to surprised or afraid) get a blink that ends as the pupils move: 5 drawings = 10 frames. Hold at least 12 frames.

```ts
import {tAct, expr, expressionBeats, toExpression} from '../puppet/template';
import type {TemplateBeat} from '../puppet/template';
const BEATS: TemplateBeat[] = [
  {f: 0, ...expr('neutral')},
  ...expressionBeats('angry', 24, {from: 'neutral', extra: {headTilt: -4}}),   // beats at 22 (pupils), 24 (lids, brows), 26 (mouth)
  {f: 34, shR: 70, elR: 60, handR: 'point'},
  ...expressionBeats('smug', 52, {from: 'angry'}),
];                                                                           // keep the list sorted by f
<Puppet rig={MILLER} pose={(f) => tAct(BEATS, f, {rig: MILLER, seed: 3})} height={worldHeight(MILLER, 2.7)} pos={[1, 0, 0]} />
```

Talking: `talk(f, phrases, {open: EXPRESSIONS.angry.talk[0], closed: EXPRESSIONS.angry.talk[1]})` (each preset names its open and closed mouth). A character's default expression is in the rig already: the brief's `default_expression` (or `slice.py --rest doubtful`) is stored in the manifest and `fromTemplate(M)` rests in it. For a variant in your own file: `fromTemplate(M, {rest: 'smug', build: 'child'})`.

## 6. Acceptance checks

1. `slice.py` exits 0: all required slots filled, none cut by the sheet border or merged with a neighbour, no stray art, deviations inside tolerance (centre within 28 sheet px, size 0.75 to 1.3 of the mannequin piece; head, torso and back pieces may reach 1.6, hair 2.6 in height; the prop has no size rule but must have art at the grip; the brow any thickness), spill, key blob, fringe, lost art and faded all inside the floors of `qa.json art.spill`.
2. `public/<id>/overview.jpg` looked at: each slot shows the piece its name says (the tool cannot know a mouth from a brow); the assembled figure has no gap at neck, shoulders, elbows, hips, knees.
3. `out/model-<id>-faces-0.png` looked at next to `chart.jpg`: the eight expressions read without the labels; angry and sad lids are one straight cut; raised brows stand on skin, not on hair. `out/model-<id>-0.png` looked at, next to the lead at the same scale: the lids are invisible on the forehead (same skin colour); arms raised, lean 6 and head tilt of 8 degrees open no joint; each hand variant sits on the wrist; the back view stands on the same feet; the three builds look like people.
4. Recognition (bible 5.1): the silhouette and signature colour identify the character at 20 % of frame height; the back view too.
5. `npx tsc --noEmit` passes.

## 7. What the standard does not cover yet

- TRIED ON ONE GENERATED SHEET (`gen/test-char-sheet.png`, drawn on `human-v1`): 27 of 27 slots within 2.5 px and 0.93 to 1.06 of the template size, rigged with no hand placement. `human-v2` (more headroom, iris ring and tapered brow in the drawing, stricter cap wording) has only been proved on the mannequin: NO SHEET HAS BEEN GENERATED ON IT YET. Whether the generator now draws a coloured iris and its own brow instead of copying the template's is unknown; the rig does not depend on it.
- The forehead window is cut with a fixed shape: a fringe or a low hat brim loses whatever hangs into it. A character whose design needs hair over the forehead takes `--keep-fringe` and accepts brows on hair.
- Long robes, skirts and capes that reach the floor (the torso slot ends at the hips; legs are always trousers), tails, wings. `DOOM` and `KING` stay hand-made rigs.
- Seated figures, side and three-quarter views, a walking side view (`walk()` needs a profile rig).
- Covered faces (masks, helmets with slits): the face kit assumes large round eyes on skin.
- Pink, purple or magenta costumes: the template is magenta-keyed only; a green-keyed copy of the sheet is not made yet.
- Hair is placed by its position on the sheet (it cannot be anchored like a limb): tall hats and long hair may need one `adjust` entry. Hair does not swing; long hair in front of the shoulders is not layered.
- No nose slot (the style has none on most faces), no glasses layer (they cannot be drawn on the cap piece: the forehead window would cut them), no second pupil size for shock.
- The lid needs `lids()` / `tAct`; a blink on a half-lidded face is small. The lid edge is straight and has no dark lid line while open; the reference sometimes curves it and draws a thin line.
- `extraFromTemplate` typechecks and its sheet slices, but no still of an extra rig has been rendered.
- Animals and non-human bodies: `PUPPET.md` section 6.

## Showing Codex the reference (owner's decision, 2026-11-21)
The owner wants characters that look exactly like the reference channel's, and asked that the generator SEE reference frames ("ngay từ đầu phải thế"). What works and what does not, as tested:
- WORKS: pass one or two reference frames as ART-STYLE references and ask for "a <character description> in exactly this style, with the same head-to-body proportions, eye size, limb thickness and finish as the figure in the first frame". Result: `gen/be-trai-theo-phong-cach.png` (prompt `gen/prompts/be-trai-theo-phong-cach.txt`), clearly closer than a words-only prompt.
- REFUSED by the image tool's safety system: asking it to "redraw this exact character" from the frames (2026-11-21), and frames of a famous third-party character (the masked ruler, 2026-11-20).
- The guarded wrapper `tools/art/gen.sh` refuses reference-footage images by design; for this purpose the owner approved calling the root `./gen.sh` with the frames. Name the files plainly and say in the command description what they are.
- Proportions differ per character in the reference (head roughly 30-40 % of the height; thin, wide and tall builds all occur): pick the reference frame of the body type you want rather than applying one table of numbers.
