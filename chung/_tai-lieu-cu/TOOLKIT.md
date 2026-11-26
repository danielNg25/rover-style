# rover-lab toolkit (read this before building a shot)

Goal of the project: rebuild the first 22.5 s of a reference video (`../ref/rover_doom.webm`, 1280x720, 24 fps) shot by shot, as close as possible, so the two can be compared side by side. Internal comparison only.

Style of the reference ("2.5D"): the SET is real low-poly 3D geometry with flat colours (boxes, cylinders, cones, flat polygon cards for far layers); CHARACTERS are flat 2D cut-out puppets standing in the set; a real 3D camera that is never still; soft shadows, depth-of-field blur, bloom on lamps, floating dust.

## Stack
Remotion 4 + three.js via `@remotion/three` (React 19, TypeScript). Run everything from `rover-lab/`.

## Files you will use
- `src/three/prims.tsx` — `Box, Cyl, Cone, Ball` (lit, flat-shaded; props `pos, rot, color, cast, receive, unlit, emissive`), `Poly` (flat unlit polygon card from 2D points), `Arc` (flat ring segment), `Glow` (soft additive blob), `Speck` (tiny diamond: dust, star, sparkle).
- `src/three/stage.tsx` — `Cam` (`pos, look, fov`), `Lights` (hemisphere + one shadow-casting key light; copy and retint it if your set needs different light), helpers `lerp3`, `tween`, `inOut`, `outBack`, `track` / `trackObj` (pose-to-pose tracks: value pops to each key at its frame and settles over n frames), `drift` (tiny organic wobble).
- `src/three/Post.tsx` — `<Post focus={[x,y,z]} blur={0..1} />` finish stack: depth of field focused on a world point, bloom on very bright pixels, vignette. Put exactly one in every scene.
- `src/three/ImageCard.tsx` — `<ImageCard src="folder/file.png" height={worldUnits} pos={[x,y,z]} tilt={deg} />` a flat picture (PNG with alpha, file under `public/`) standing in the set, origin bottom-centre, casts a cut-out shadow. Children are placed in the picture's pixel space.
- `src/three/ImageRig.tsx` — `<ImageRig rig pose worldHeight pos />` jointed puppet from picture pieces; `rigPoint(...)` gives the world position of a point on a piece.
- `src/chars/doomImg.ts` — the main character (green hooded, grey metal mask), fully rigged: `doomImgRig`, `doomHands(handL, handR)`, `facePose(face)`, presets `FACE.angry|neutral|sad|squint`, `FACE0`. Back view: `public/doom/back.png` (use with ImageCard). Mask layers alone: `public/doom/mask.png, plate.png, slit.png, pupil.png, brow.png, nose.png, mouth.png`.
- `src/sets/ThroneHall.tsx` — the white-and-gold throne hall set (study it as the model for how sets are built; reuse its `Throne`-style construction ideas, palette and far-background cards).
- `src/HallSeq.tsx` — four finished shots; study the `Doom` component there to see how acting is written as beat tracks (face, eyes, brows, head, body, arms, wrists each on their own track) with a comment line listing the beats.

## How a shot is defined
Create `src/shots/<YourShot>.tsx` exporting a `ShotDef` (see `src/shots/types.ts`): `{id, len, bg, Scene}`. `Scene({f, t})` renders everything inside the canvas: `<Cam/>`, lights, `<Post/>`, the set, the characters. Then add it to YOUR registry file only (`src/shots/registry-<letter>.ts`, the letter you were given). Do not edit other agents' registry files, `Root.tsx`, `HallSeq.tsx`, `ThroneHall.tsx`, `doomImg.ts` or anything in `src/three/` — if you need a variation, copy the code into your own file. New shared-looking helpers go in your own files too.

## Commands (all need the sandbox disabled: Chrome and Codex cannot run inside it)
- `./refstrip.sh <start> <end> [step]` → `out/ref-<start>.jpg`: numbered strip of the reference frames of your shot (frame numbers are relative to the shot start). LOOK AT THIS FIRST, then extract 1–2 full-resolution reference frames with `ffmpeg -v error -i ../ref/rover_doom.webm -vf "select='eq(n\,N)'" -frames:v 1 out/<name>.jpg`.
- `./shotpairs.sh <shot-id> <ref-start-frame> <f1> [f2 f3]` → `out/pairs-<id>.jpg`: renders those frames of your shot and puts each next to the matching reference frame (left: reference, right: yours). This is your main feedback loop.
- `./render-video.sh shot-<id> 1` → `out/shot-<id>.mp4` (full shot, 1280x720).
- `npx tsc --noEmit` must pass.
- `./gen.sh <out.png> <prompt-file> <ref-image> [more refs]` asks the local Codex CLI to generate ONE image into `gen/` (takes 1–3 minutes, costs the user money — see budget). `python3 tools/cut.py gen/<sheet>.png public/<folder> <prefix> [min_area]` cuts a sheet with a flat magenta background into separate transparent PNGs and writes a numbered overview jpg.

## Generating character art with Codex (rules that worked)
- Characters and organic props that must look hand-drawn come from Codex; everything architectural is built from primitives in code.
- Always append `gen/prompts/style.txt` to your prompt file (flat vector cut-out style, flat magenta #FF00FF background, no text). Use `gen/doom-front.png` (and/or `gen/queen.png`) as the reference image so the finish matches the existing characters. Do NOT pass a tight crop of the reference video as the reference image: the image tool refused that once. Describe the character in words instead.
- Reference character design: big head (about 2.4 heads tall), large white round eyes with small pupils, tiny body, short limbs, no outlines.
- For a character that only stands and reacts, one full-body picture as an `ImageCard` is enough; add life with a gentle tilt/bob and, if needed, skin-coloured lids for blinks (see `Queen` in `HallSeq.tsx`). Ask for a parts sheet only if the reference clearly shows limbs moving.
- Several small characters can be requested in ONE image (a row, well separated, magenta gaps) and cut apart with `tools/cut.py`.

## What "matching" means here (measured on the reference)
- Camera: every shot moves from its first frame to its last; pushes are slow and linear (1–3 % per second, sometimes much more — measure it from the first and last reference frame); trucks ease in and out. Translate the camera, do not rotate it.
- Measure before you build: character height in the frame, where the horizon is, how big the main prop is. Match those first, details second.
- Sets: no outlines, 2–3 tones per surface, one dominant hue family plus one accent, far layers as flat cards (sky, mountain bands, clouds), fog-like lightening with distance done by colour choice.
- Acting: pose-to-pose with pops and small settles, plus constant tiny drift so nothing is ever frozen; eyes lead, head follows.
- Ambient: 20–40 tiny drifting dust specks (or stars, snow) in almost every shot.

## Budget and reporting
- At most 2 Codex generations per shot unless your brief says otherwise. Do not regenerate for small flaws.
- Iterate with `shotpairs.sh` until composition, sizes, colours and motion read the same as the reference at a glance; 4–6 rounds per shot is normal. Do not spawn sub-agents.
- Final report (≤ 250 words per shot): files written, Codex images generated, what matches, and an honest list of what still differs. Say plainly if something is unfinished.

## Detail pass (added after the user's review of the first full assembly)
The user's verdict on the first assembly: composition is basically right, but the DETAIL is not there yet. His words, translated: "their Earth at the start is 3D and rotating; the animals walk across the savanna; their backgrounds sparkle more and feel like they are moving; details like their stars and clouds have nicer effects. Focus on detail in this step."

So in this pass, judge MOTION and FINISH, not layout:
- `./motionpairs.sh <id> <ref-start> <from> <to> <step> [crop]` puts consecutive reference frames next to yours (after `./render-video.sh shot-<id> 1`). Go through your shot with tight crops, element by element: for every element in the reference ask "does it move, twinkle, rotate, sway, flicker, drift, cycle?" and write the list down before coding. Then make each one do the same in yours.
- Typical things the first pass missed: true 3D rotation of round bodies; walk cycles (legs alternate, body bobs, tails and ears sway); camera truck with visible PARALLAX between depth layers (foreground slides faster than the far layers); stars that twinkle individually (size and brightness on separate phases), a few with soft glows and 4-point flares; dense star dust; clouds built from several overlapping lumps in 2–3 tones that drift; flames that change shape every 2 frames; sparkles on gold and water; dust, embers, mist; birds; cloth and flags that sway; shadows that follow.
- Density matters: count how many stars, sparkles, grass tufts, animals, windows the reference has in a region and match the count and size distribution.
- Finish: soft glows around emissive things (use `Glow` or bloom-level brightness), subtle gradients on large flat areas (two or three stacked tones), light rims.
- Report the list of reference motions you found and, for each, whether yours now has it.
