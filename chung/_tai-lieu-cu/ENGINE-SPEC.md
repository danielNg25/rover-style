# cutout-3d engine, QA and per-shot workflow: specification

Status: design, nothing built. Base: the "qa-first" design plus the judges' grafts. Written 2026-11-20 against the tree at commit `6d3d474`. API names marked **(exists)** were checked in the source; everything else is new. Every numeric threshold is a starting value that work package Q must calibrate; none has been measured.

Core rule: a shot is a contract (`shot.yaml`) that is gated before any build. Verdicts are generated from measurements. Each check ends as PASS, FAIL, UNMEASURED or WAIVED, and UNMEASURED never counts as a pass.

## 1 Decisions

| Decision | Choice | Why |
|---|---|---|
| Engine home | `rover-lab/` stays the engine; a `studio-kit/styles/cutout-3d/` folder (STYLE.md, qa.json, `engine` symlink) is created only after the test passes | stick-3d pattern; no studio files change until the engine is proven |
| Where the test lives | A lab run, `src/episodes/doom-b/`. No channel, no `episode.yaml` | Nothing to attach studio status to yet; the owner decides later (open question 1) |
| Episode location | `src/episodes/<ep>/shots/<id>/{shot.yaml, shot.tsx}` inside the engine; art in `public/chars/<char>/` | Remotion has one entry point and one `public/`; a channel episode later links its build folder to this one |
| Shot contract | `shot.yaml`, owner-editable. `tools/mkindex.py` compiles all contracts to `src/_gen/contracts.json` and `src/_gen/index.ts`. The scene stays TSX | One source of truth: TSX reads `len`, cast and beats from the contract; no ShotFromSpec layer |
| Rendering | Lead only for clips and matte passes, one at a time behind `out/.render.lock`. Builders may render stills into their own folder | Failure 7; three parallel Chrome renders on one Mac |
| Format | One `FORMAT = {w:1280, h:720, fps:24}` constant. All gates run at 1280x720. Delivery size and fps for a real episode are open (question 2) | Beats, gaits and twinkle are frame-counted; changing fps changes speed |
| Canvas | One `ThreeCanvas` per `Sequence`, as today. Single shared canvas is not built | Unproven with `@remotion/three`; hard cuts only |
| Motion QA | Per declared element, after removing global camera motion, on an identically encoded pair; compares amount, direction, onset and period | Failure 1 and the judges' gap "static picture under a push passes" |
| Mutants | Copies under `src/episodes/_broken/`, never in a full film | No test switches in the production engine |
| Workflow | A new `dung-shot.js` beside `dung-tap.js`; `dung-tap.js` is not edited | Other channels use dung-tap; no regression risk, no two-copy drift |
| Studio `qa.py` | Not used in the lab test. `qa.py video/full` assume other styles and 1080p30 | Thresholds there are calibrated on other footage |
| Version control | `rover-lab/.git` exists (3 commits). Tag `pre-engine` before work starts; the lead commits after each verified package | Rollback for a multi-agent refactor; the studio forbids `rm` |
| Audio | Lab: reference audio is muxed into side-by-side and full files for viewing only. Voice-driven `len` and cue-addressed beats are specified (3.5) but not built | No voiced episode exists yet |

## 2 Architecture and folder layout

```
rover-lab/
  src/kit/        math.ts refspace.ts shapes.tsx pictures.tsx fx.tsx text.tsx index.ts (KIT_VERSION)
  src/stage/      format.ts Stage.tsx camera.ts lights.ts finish.tsx timing.ts El.tsx matte.ts
  src/puppet/     Puppet.tsx rig.ts beats.ts cycles.ts face.ts
  src/shot/       defineShot.ts ShotComp.tsx Film.tsx
  src/sets/       ThroneHall.tsx, KingRoom.tsx ... (import kit and stage only)
  src/chars/<id>/ rig.ts proportions.json map.json
  src/episodes/<ep>/episode.yaml            order of shot ids, groups
  src/episodes/<ep>/shots/<id>/shot.yaml shot.tsx
  src/episodes/<ep>/groups/<name>.tsx       shared state for sub-shots on one set
  src/episodes/_broken/<mutant>/            gate self-test copies
  src/_gen/       contracts.json index.ts   generated, never edited
  tools/          preflight.sh render.sh still.sh mkindex.py
  tools/qa/       refcut.py cuts.py normalize.py health.py lint.py motion.py camera.py
                  density.py palette.py figure.py sbs.py gate.py report.py mutate.py
  tools/art/      gen.sh keycheck.py cut.py key.py spill.py place.py proportions.py rigcheck.py
  ref/shots/<ep>/<id>.mkv                   all-intra reference cuts (not committed)
  qa/<ep>/<id>/   evidence, gate.json, report.md, build/ (builder stills)
  qa.json  PROCESS.md (replaces TOOLKIT.md)
```

Import rule: shots import only from `kit`, `stage`, `puppet`, `sets`, `chars` and their own folder. Sets never import from shots (today `sets/HallAmbience.tsx` imports `Flare` from `shots/bkit`).

Reference footage stays in `shorts-claude/ref/` and `rover-lab/ref/` on this machine. It is not copied into `studio-kit`, not committed, and side-by-side files go to the owner only.

## 3 Engine API

### 3.1 kit
```ts
// math.ts
type V3 = [number,number,number]; type Pt = [number,number]; type PxBox = [x0,y0,x1,y1];
rand(seed): () => number          // Lehmer, the body now duplicated in flat2d.tsx and bkit.tsx
hash(a, b?): number               // from bkit.tsx (exists)
// refspace.ts
refSpace({cam: V3, fov: number, w?, h?}) => {pt(px,py,z): V3; len(px,z): number; ppu(z): number; zAtRow(py, groundY?): number}
FLAT_CAM                          // {cam:[0,0,20], fov: CAM_FOV}: the flat2d plane (exists as CAM_Z, CAM_FOV)
<RefPlane m z order?>             // children in reference px, y down
// shapes.tsx: common props color, opacity?, order?, add?; angles = degrees clockwise on screen
Box Cyl Cone Ball Glow Speck      // prims.tsx (exists); cast/receive default false for far layers
Poly{pts} Rect{r} Disc{c,r,sy?,seg?} Ring{c,r1,r2,a0?,a1?,sy?,rot?} Diamond{c,w,h?}
PxPoly PxDisc PxRect PxBox{m,z,...}   spike() clipCircle() ellipse() bezierRibbon()
// pictures.tsx
useTex(src): THREE.Texture | null // one module cache; load error => cancelRender(`missing texture ${src}`)
useTextures(srcs)
<Card src height pos pivot? rot? flip? tint? opacity? shadow?>{children in picture px}</Card>
<Piece src at pivot rot? scale? sy? flip? z? hide? crop? tint?/>      // sprite.tsx (exists)
// fx.tsx: seeded, counts are props, each a pure function of f
<StarField spec f z m?/> <Nebula/> <CloudBank spec f/> <DustMotes box count seed f rise? sway? colors?/>
<Flame/> <Brazier/> <Flare/> <Glints points f/> <PuffBurst origin count f0 dur spread tones f/> <Globe tex r spin roll f/> <Flicker/>
// text.tsx
<NameLabel text x0 x1 baseline m z/> <DrawArrow p0 p1 p2 p m z/>
```
`text.tsx` loads one bundled font (Be Vietnam Pro, `public/fonts/`) through `FontFace` inside `delayRender`; today `Closeup.tsx` uses the system font with no loading.

### 3.2 stage
```ts
FORMAT = {w: 1280, h: 720, fps: 24}
<Stage cam light finish pass? focus? bg?>      // the only place a ThreeCanvas is created; owns delayRender + advance()
type CamPose = {pos: V3; look: V3; fov: number}
type CamRig  = (f: number) => CamPose           // camPush(from,to,len,ease?) camTruck(...) camOrbit(c,r,a0,a1,len)
                                                 // camKeys(CamKey[]) withDrift(rig,amp,seed)
LIGHT.hall | dayExterior | night | space         // hall = today's Lights values (hemi 1.6, dir 2.05)
FINISH.hall | closeup | space | flat             // {dof:{on,range,blur}, bloom, vignette}; bokeh x height/720
<El name kind?>                                  // tags its subtree with the contract element name
<Landmark name at: V3/>                          // invisible in beauty; a dot in the matte pass
track trackObj keys tween drift lerp lerp3 inOut outBack   // stage.tsx (exists), moved to timing.ts
```
`pass` is a serialisable string from composition props `{id, pass}` (failure 5: no function ever crosses props; an unknown id calls `cancelRender`).
- `beauty`: normal.
- `matte`: no Post, black background, no antialiasing. Every mesh under `<El>` is drawn with a shader that outputs the element's ID colour and discards where the texture alpha is below 0.5. `matte:parts:<el>` colours each puppet part separately. Landmarks are drawn as ID dots.
- `solo:<name>`: beauty of that element only, on black, no Post.

The finish composer is built once and its uniforms are updated; today `Post` rebuilds it whenever `blur` changes.

### 3.3 puppet
```ts
type RigDef = {canvas: Pt; footY: number; height: number; orderBase: number;
  parts: Record<string, {src; x; y; w; h?; pivot: Pt; parent?; layer: number} | {mirrorOf: string}>;
  slots?: Record<string, string[]>;            // handL: ['fist','open','glow']
  anchors?: Record<string, [part: string, pt: Pt]>;
  face?: {parallax: Record<string, number>}}   // doom today: mask 5, eyes/brows 9, mouth 10, nose 17
<Puppet rig beats f pos h seed flip? tint? opacity?/>
type Beat = {f: number; ch: 'face'|'look'|'body'|'head'|'armL'|'armR'|'handL'|'handR'|'legs'; to: string|object; settle?: number; note?: string}
          | {f: number; verb: 'blink'|'nod'|'startle'|'handSwap'; arg?: unknown}
anchor(rig, pose, name, h, pos): V3            // replaces rigPoint (exists); respects sx/sy and flip
gait(f, {kind: 'lateral'|'pace'|'hold3', period, stride}) => {legs: number[]; bob; sway; plant: boolean[]; dx}
```
`PartPose {rot,x,y,sx,sy,hide}` is unchanged **(exists)**. `Puppet` owns breathing, seeded auto-blink and layer order (`orderBase + layer`). `gait().dx` is the only source of world x for a walker, so feet cannot slide by construction. Not in version 1: IK, `reach`, `lookAt`, biped walk, lip flap.

### 3.4 shot
```ts
defineShot(id: string, Scene: FC<{f; t; gf; c: Contract}>): ShotDef   // id, len, bg come from contracts.json
sequence(ep): {id, start, len}[]                                        // starts derived from len
<Film ep/>                                                              // replaces Full.tsx and its hand-typed ORDER
```
Sub-shots on one set (today's `HallSeq`): the contract's `group: {name, at}` gives the scene `gf = at + f`, and `groups/<name>.tsx` exports a pure `state(gf)` that all shots of the group read.

### 3.5 One complete shot
`src/episodes/doom-b/shots/s14/shot.yaml`:
```yaml
id: s14
ref: {start: 540, len: 46}          # len is the single source for the composition length
desc: Doom at the globe turns to camera and raises a fist.
set: throneHall
group: {name: hall, at: 0}
camera: {rig: push, zoomPctPerS: 2.1, landmarks: [{name: throneTop, f0: [640,118], f1: [640,104]}, {name: stepL, f0: [212,655], f1: [198,668]}]}
elements:
  - {name: globe, kind: rotate, crop: [420,120,860,560], dir: right}
  - {name: stars, kind: twinkle, crop: [0,0,1280,300], count: [900,1500]}
  - {name: floor, kind: static, crop: [0,600,400,720]}       # noise-floor control
  - name: doom
    kind: act
    bbox: {0: [510,180,770,700]}
    beats:
      - {f: 12, ch: head, to: {rot: -8}, settle: 5, note: head turns to camera}
      - {f: 13, ch: look, to: {px: 0.6}}
      - {f: 30, ch: armR, to: {arm: -70, fore: -95}, settle: 6, note: fist comes up}
      - {f: 30, verb: handSwap, arg: {handR: fist}}
palette: ['#1b1d3a', '#e8c27a', '#7fae6a']
cuts: []
```
`shot.tsx`:
```tsx
import {defineShot} from '../../../../shot/defineShot';
import {Stage, El, Landmark, camPush, withDrift, LIGHT, FINISH} from '../../../../stage';
import {Puppet, anchor} from '../../../../puppet';
import {DustMotes, Globe} from '../../../../kit';
import {ThroneHall} from '../../../../sets/ThroneHall';
import {doomRig} from '../../../../chars/doom/rig';

export default defineShot('s14', ({f, c}) => {
  const cam = withDrift(camPush({pos: [0,3.2,14], look: [0,3,0], fov: 32}, {pos: [0,3.1,11.5], look: [0,3,0], fov: 32}, c.len), 0.02, 7);
  return (
    <Stage cam={cam(f)} light={LIGHT.hall} finish={FINISH.closeup} focus={[0.4,3.4,0]}>
      <ThroneHall frame={f} />
      <Landmark name="throneTop" at={[0,7.4,-6]} /><Landmark name="stepL" at={[-5,0,2]} />
      <El name="globe"><Globe tex="globe/earth" r={1.1} spin={f * 1.2} roll={12} f={f} /></El>
      <El name="doom"><Puppet rig={doomRig} beats={c.beats('doom')} f={f} pos={[0.4,0,0]} h={5.2} seed={1} /></El>
      <DustMotes box={[-6,0,-4,6,7,4]} count={40} seed={3} f={f} />
    </Stage>
  );
});
```
`ThroneHall{frontColumns?, frame?}` exists with those props. For a voiced episode the contract takes `len` from the voice timeline and a beat may use `cue: <name>` in place of `f`; `mkindex.py` would resolve cues to frames. Specified, not built.

## 4 Asset pipeline

1. **Budget first.** The sheet count goes to the owner before any generation: at most 3 sheets per new character (front, parts, face and hands), 1 per prop set, 0 for a reused character.
2. **`tools/art/gen.sh <out> <prompt> <refs...>`** (failures 7, 8). `set -euo pipefail`; stdin closed; `--` before the prompt; 300 s timeout; sandbox disabled. Before spending a run it refuses:
   - a reference image that lies under `ref/`, is named `ref-*`, or is not listed in `public/chars/approved.json`;
   - a prompt containing a pose word (seated, sitting, kneeling, walking, running, lying, bending).
   An existing target is moved to `gen/_old/`, never deleted. No fresh file means exit 3 (REFUSED). One reworded retry, then stop and ask the owner. Writes `<out>.prov.json` (prompt sha, refs, time).
3. **Key colour** (`keycheck.py`, failure 11). The key is chosen per character from the approved front sheet as the candidate (magenta, green `#00B140`, blue) whose Lab distance to 99.5 % of art pixels is largest; below ΔE 40 for all three, stop and ask. The first sheet, which has no palette yet, uses magenta and is checked afterwards.
4. **`cut.py`**: 1 px seed grid, no label cap, pieces ordered by bbox centre, sheet offsets kept in `<prefix>.json`. Pieces are named through `map.json` (piece N to part name), never by raw number.
5. **`spill.py`**, per piece:
   - spill: share of edge pixels whose colour has more than 0.15 of the key direction (an RGB projection, not hue, so dark thin lines are measured) must be ≤ 1 %;
   - lost art: alpha area divided by the silhouette area (border flood fill on the sheet) must be ≥ 0.97 unless the hole is declared in `map.json`.
   Fix is edge-colour bleed plus premultiplied alpha. Evidence: `qa/art/<char>/spill.jpg` at 400 %.
6. **`place.py`** draws the pivot grid overlay and writes the draft `rig.ts`; `rigcheck.py` asserts every part has a file, a parent chain and a pivot inside its bbox. The studio `rig_gate.py` checks the Lemo rig format and is not used.
7. **Proportions** (failure 9). The reference figure is measured on a 4x upscaled crop of at least 2 frames; `proportions.json` stores each value with its spread. Ours is measured from the `matte:parts` pass. Fail above 3 % on height fractions (head, belt, hem) or 10 % on part ratios (hand/head, torso/height); a value whose reference spread exceeds half the tolerance is UNMEASURED. The owner approves the annotated overlay at H1.
8. **Approval.** `approved.json` holds sha256 and date per file. An approved file is never overwritten; a redraw becomes `-v2`. `health.py` fails a shot that uses an unapproved sha.

Poses the image tool refuses (seated, walking biped) have no general answer. The only known method is the two-instance split in `King.tsx`. A thigh/shin parts standard is deferred until a shot needs it; the test stretch must report such a shot at H0 instead of improvising.

## 5 QA gates

All comparisons use `normalize.py`: ours is rendered at 1280x720, encoded with the reference's codec at matched bitrate, then both sides are decoded to the same grey 640x360 with a 3 px blur. `gate.json` records sha256 of the clip, the contract and `qa.json`, plus `KIT_VERSION`. Evidence with a stale sha is void.

| # | Gate | Measured and how | Threshold | Evidence | Prevents |
|---|---|---|---|---|---|
| P | Preflight (`preflight.sh`, once per session) | Chrome renders one 64 px frame; `codex --version` answers; render lock free | all succeed | `qa/preflight.json` | 7 |
| G0 | Contract (`refcut.py`, `cuts.py`, before any build) | The reference is decoded once sequentially, never by seek; each shot is written all-intra with its frame hashes. Hidden cuts: frame difference d > 12 and > 8x the local 24-frame median. Morphs: after global affine alignment of n and n+12, any 4x3 cell with SSIM < 0.5 while its neighbours stay > 0.8, where no `swap` element is declared | frame count = `len`; no undeclared hit; every moving thing is an element with a `kind` | `ref-sheet.jpg`: full 1280x720 frames every 4 frames | 3 |
| G1 | Health (`health.py`, `lint.py`) | `tsc`; exit codes with `pipefail`; clip newer than sources; ffprobe frames, size, fps; blank (mean Y < 6) and frozen frames; every `src` exists and is approved. Late textures and frame purity: PNG stills of frames 0, mid, last against the same frames of the clip, maximum difference over 80 px tiles | tile max ≤ 12/255 | `health.json`, tile heat image | 5, 6, 10 |
| G2 | Alignment (`sbs.py`) | Both inputs must have equal frame counts and first pts 0. `sbs.py` stamps a 12-bit frame barcode, read from each source file, into both halves and forces `setpts=N/24/TB`; the gate decodes both barcodes on every frame. For the film: cut lists equal | 0 frames | `sbs.mp4`, `align.json` | 4 |
| G3 | Motion (`motion.py`), per element | Reference: its crop. Ours: the matte mask, measured on the `solo` pass so dust and blur are excluded. Global camera motion is removed per frame pair by an affine fit (ECC). Residual curve E(t) is compared with the noise floor taken from the shot's `static` element. Reported: activity A (share of frames above 3x floor), energy ratio ours/ref, mean flow direction, onset frames, dominant period from autocorrelation | A_ref > 0.5 needs A_ours > 0.3; ratio 0.5-2; direction within 45°; onset within 2 frames of each contract beat; period within 25 % of the reference's own peak. Shots under 24 frames or under 2 cycles: period UNMEASURED | `motion-<el>.jpg`: 8 consecutive full-resolution crop pairs at 3 points | 1 |
| G4 | Camera (`camera.py`) | Method A: features, LK flow, RANSAC partial affine; zoom and shift in %/s. Method B when A has < 30 inliers: scale and shift from the contract's landmarks on the reference's first and last frame against our `Landmark` dots in the matte pass | sign match, and within 1 %/s absolute or 35 % relative; ours < 0.3 %/s while the reference moves fails; no landmarks and < 30 inliers: UNMEASURED | `camera.json`, landmark overlay | 1 |
| G5 | Figures (`figure.py`) | Matte bbox against the contract `bbox`; part ratios as in 4.7 | height 8 %, centre 3 % of frame width | grid overlay pair | 9 |
| G6 | Density (`density.py`) | 4x3 cells with 3x3 dilation, on normalised frames: blob count (top-hat > 40, 1-40 px), edge density, tone count after 32-colour quantisation, per-blob temporal deviation (twinkle) | blobs 0.5-2x where the reference has ≥ 10; edges ≥ 0.6x; tones ≥ reference - 1; contract `count` range | 100 % crop pairs | 2 |
| G7 | Palette (`palette.py`) | Global 5-colour palette, greedy match, ΔE76 | ≤ 8; per-cell values warn only | swatch strip | - |
| G8 | Independent review | see below | no HỎNG | `review_log.md` | 1, 12 |

Gates run in cost order: P, G0, art gates, lint and `tsc`, stills (G1 stills, G5, G6, G7 on frames 0, mid, last), then one beauty clip plus matte and solo passes (G1 clip, G2, G3, G4). A clip is not rendered while a still gate fails.

**Lint (`lint.py`, failure 10 and frame purity).** A shot file fails when it imports outside the allowed folders; defines `rand`, `hash`, `useTex` or any name exported by the kit; calls `Math.random`, `Date` or `performance`; uses `TextureLoader`, `useFrame`, `useRef` or `useState`.

**Reports (failure 12).** `report.py` writes `report.md` from `gate.json`: one line per gate with measured values, then VERIFIED, NOT VERIFIED and WAIVED lists. Nobody types "matches". An UNMEASURED item needs a named line under "Miễn trừ" in `review_log.md` (at most 3 per shot, each with an image); a reviewer may add evidence but cannot turn UNMEASURED into PASS. `tools/render.sh preview` refuses to make a send copy unless the gate passed for that exact sha.

**Reviewer protocol (G8).** A different agent from the builder. It receives the contract and the evidence folder only, never the builder's report, and starts from HỎNG. Agents cannot watch video, so the evidence is fixed:
- consecutive-frame strips at full resolution covering every frame of each element crop for shots up to 48 frames, and every second frame plus all frames within 3 of a beat for longer shots;
- side-by-side frames at each beat, at both ends, and around each cut;
- density crops, the figure grid and the landmark overlay.
Every evidence image carries a 4-character code derived from the clip sha and the file name. The reviewer writes one line per element and per beat: ĐẠT or HỎNG, frame number, image path and that image's code. `report.py` rejects a verdict line with a missing or wrong code.

**Owner review points.**

| Stop | Owner sees | Studio gate |
|---|---|---|
| H0 | Shot list sheet with element crops, landmarks and boxes drawn on full-resolution frames; sheet count; token estimate | C3 |
| H1 | Character sheet and proportion grid, new characters only | C2 |
| H2 | Pilot shot: still pairs | C4 |
| H3 | Pilot shot, then about 10 s: side-by-side video with reference audio | C4 |
| H4 | Batch, then full video | C5, C6 |

H3 is the only real motion check by a person; the gates and strips exist so that nothing obviously static reaches it.

**No-reference variant.** For an original episode:
- G0 checks declared lengths and that every element has a `kind`.
- G2 checks declared cut positions.
- G3 requires each declared element to exceed the noise floor in its matte, with onsets at the contract beats.
- G4 compares the measured camera against the declared rig and a non-static floor.
- G5 uses framing class and the model sheet.
- G6 and G7 use the contract's `count` ranges, the set palette, and style floors in `qa.json`.
Those floors are to be measured once on frames 0-899 of the reference. Until that is done they are UNMEASURED.

## 6 Per-shot workflow for agents

Workflow `studio-kit/workflows/dung-shot.js` (run copy in `.claude/workflows/`). All agents at medium effort or below.

| Stage | Who | Output | Stop |
|---|---|---|---|
| S0 Contract | 1 agent, low effort, whole batch | G0, `shot.yaml` skeletons, annotations on 4x crops | H0 |
| S1 Assets | lead, solo | sheets, cut, art gates | H1 |
| S2 Build | 1 builder per 1-2 shots, at most 3 | `shot.tsx`; at most 12 stills per round via `tools/still.sh` into `qa/<ep>/<id>/build/` | - |
| S3 Measure | lead | still gates, then clip, matte and solo passes, G1-G7, evidence | - |
| S4 Review | 1 reviewer per group, at most 3 rounds with S2-S3 | verdict lines | - |
| S5 Assemble | lead | film, G2 on the film, preview copy | H2, H3, H4 |

- **Agents:** a pilot shot is 1 + 1 + 1 = 3; a 5-shot batch is 1 + 3 + 2 = 6. More than 6 needs the owner's consent.
- **Token estimate (not measured).** From the dung-tap history of about 1M tokens for 5-6 agents: about 300k per shot, 350k for the pilot, about 1.5M for a 5-shot batch. The pilot's real figure is recorded in `qa/<ep>/cost.json`; above 500k the run stops and the owner is asked.
- **Conflict rules.** A builder writes only its own `shots/<id>/shot.tsx` and `qa/<ep>/<id>/build/`. Contracts, kit, stage, puppet, sets, chars and `.md` files are read-only for builders. A missing helper is returned as `kit_requests[]` in the result JSON; the lead adds it between rounds. `_gen/` is generated, so no shared registry is edited.
- **If a builder subagent cannot run Chrome**, it returns `needs_stills: [frames]` and the lead renders them. This counts as a round.

## 7 Build plan

Before any package: lead tags `pre-engine`, renders baseline stills (3 per shot) and clips of the 13 shots into `qa/_baseline/`, and records seconds per frame at 720p and 1080p in `qa/perf.json`. Estimated cost of this section and section 8 together: 1.5-2M tokens (not measured). It needs the owner's approval as its own item.

| WP | Files owned | Inputs | Done when | Verified by |
|---|---|---|---|---|
| Q QA tools | `tools/qa/*`, `qa.json` | reference, baseline clips | Positive controls pass: the reference re-encoded, shifted 2 % and scaled 2 %. `cuts.py` on frames 0-539 finds the savanna-to-ocean cut at 313 and the hidden change inside the king shot (173-231). Negative controls: see 9 | `qa/calibration.json` |
| A Art tools | `tools/art/*`; root `gen.sh` becomes a wrapper | existing sheets in `gen/` | Re-cutting `doom-parts.png` gives stable names; spill and lost-art gates pass on approved doom pieces and fail on a seeded magenta fringe; `gen.sh` refuses `gen/ref-doom-crop.jpg` and a "seated" prompt without calling Codex | `qa/art/selftest.json` |
| K Kit | `src/kit/*`; turns `shots/flat2d.tsx`, `bkit.tsx`, `sprite.tsx`, `space.tsx`, `three/prims.tsx`, `three/ImageCard.tsx` into re-export shims | section 3.1 | No shot edited; `tsc` passes; baseline stills within tile max 4/255 | G1 diff against baseline |
| S Stage and shot | `src/stage/*`, `src/shot/*`, `src/Root.tsx`, `src/Full.tsx`, `tools/mkindex.py`, `tools/render.sh`, `tools/still.sh`, `tools/preflight.sh`; shims `three/stage.tsx`, `three/Post.tsx` | section 3.2, 3.4 | Film is 540 frames with the same cut list; matte and solo passes render for one shot; unknown id fails loudly | G1, G2 on the film |
| P Puppet | `src/puppet/*`, `src/chars/doom/*`; shims `three/ImageRig.tsx`, `chars/doomImg.ts` | section 3.3; `pictures.tsx` from K | A `Puppet` with today's hall beats matches baseline hall stills (tile max 6/255); proportion gate runs on doom | G1 diff, G5 |
| W Workflow and docs | `studio-kit/workflows/dung-shot.js`, `PROCESS.md`, later `studio-kit/styles/cutout-3d/` | all above | Dry run on one existing shot produces `gate.json` and `report.md` | lead reads the report |

Q and A start at once (no `src` edits). K, S and P run in parallel after the detail pass lands and the baseline is frozen; P needs K's `pictures.tsx` committed first. W is last. The two steps that change pixels on purpose (bokeh scaled by height; any instancing) are separate commits approved by eye, because the baseline diff cannot guard them. Instancing is done only where `perf.json` shows a shot above 1.5 s per frame at 720p.

## 8 Migration of the 13 existing shots

They become the demo episode `src/episodes/doom-a/`. One agent per family, files disjoint, each step gated by G1 plus the baseline diff:

1. Contracts first: one `shot.yaml` per shot, written from the G0 sheet, including elements and landmarks. The full gate is run on today's renders and stored as the "before" state.
2. Hall group (`HallSeq.tsx`: hall-back, hall-rest): `groups/hall.tsx` plus `Puppet`; then MaskCase, Alcove, Closeup. This removes the copied `Doom` components.
3. Space (EarthThrone, SunCosmos): `StarField`, `Globe`, `RefPlane`.
4. King, Savanna, Ocean: `Card`/`Piece` paths only, then `gait()` for the animals. World x is typed today as `-0.032*f` in `Savanna.tsx`; it must come from `dx`.
5. Village: delete its private pixel kit and `useTex` in favour of `refSpace` and the kit.
6. Delete nothing: shims and `SvgRig`, `kfpairs.sh`, `pairs.sh`, `compare.sh` move to `_to_delete/`.

A shot's gate result after its port must be no worse than its "before" state.

## 9 Test plan on the next stretch

- **Range:** reference frames 540-899 (15 s). Its content has not been inspected for this spec; G0 decides the shot list.
- **Scope cap:** 4 to 6 shots, at most 2 new sheets. Shots that reuse the hall and Doom are preferred. A shot that needs a seated or walking biped is reported at H0 and skipped.
- **Order:** P, S0, H0, S1, H1, one pilot shot through every gate, H2, H3, remaining shots, H4.
- **Engine proof:** the test shots import only kit, stage, puppet, sets and chars; lint is clean; no open `kit_requests`.
- **Gate proof.** The earlier rejected renders (flat Earth, sliding animals, sparse stars) were not kept: the first commit is already mid detail pass. They are rebuilt as mutants by `mutate.py`, which copies a passing shot into `_broken/` with one change. Results go to `qa/mutations.json` as expected against observed; any miss blocks rollout.

| Mutant | Change | Must fail |
|---|---|---|
| freeze | globe `spin` constant, drawn as a flat disc | G3 activity |
| reverse | globe spins the other way | G3 direction |
| late | one beat moved 10 frames later | G3 onset |
| slide | walker x no longer from `gait().dx`, legs still | G3 period |
| sparse | star and dust counts x 0.2 | G6 |
| camstatic | camera rig replaced by its first pose | G4 |
| hands | hand part scale x 1.4 | G5 part ratio |
| notex | one `src` removed | G1 |
| offset1 | ours shifted one frame in the side-by-side | G2 barcode |
| merged | two contracts merged into one range | G0 |
| spill | a piece with an un-keyed fringe | art spill gate |

  Each mutant must fail its named gate. A reviewer given the `freeze` and `slide` evidence without being told must return HỎNG.
- **Deliberately broken shot in the batch:** the `freeze` mutant of the pilot is submitted through the normal S3-S4 path under a neutral id. The workflow must stop it before H2.
- **Success:** all 11 mutants caught, positive controls pass, every report line has evidence and a valid code, pilot cost recorded.

## 10 Out of scope

- IK, `reach`, `lookAt`, biped walk, seated assembly, lip-sync.
- Transitions other than the hard cut. A dissolve or morph needs two shots alive at once; the first such shot will need a `Film` change.
- A single shared canvas and premounting.
- Voice, music, subtitles, `assemble.py`, -16 LUFS and the studio `qa.py full` gate; a 2D caption layer above the canvas.
- 1080p and 30 fps delivery, until the owner decides the format.
- Changes to `dung-tap.js`, `qa.py`, `new_ep.py` or any channel folder; `episode.yaml` status for the lab run.
- A YAML scene format, a visual pivot editor, automatic character detection in the reference.
- Proof that the morph detector works: if calibration cannot find the king change, G0 reports the detector as unproven and the 4-frame full-resolution sheet at H0 is the control.
