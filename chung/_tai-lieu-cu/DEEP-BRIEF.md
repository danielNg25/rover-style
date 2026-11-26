# Deep look: every shot, region by region

You are one of several analysts studying one reference film (a 24-minute explainer animated in a "2.5D" style: low-poly 3D sets, flat 2D cut-out characters, a real 3D camera). The owner wants to reach the same visual quality and is unhappy with the earlier analysis: the details that matter were found by the owner watching the film, not by us. Your job is to look at your shots so closely that nothing visible is left for him to find.

## Why the earlier passes failed (do not repeat this)
Earlier analysts looked at ONE small frame per shot and answered a fixed list of questions. They reported, wrongly: "fire never lights a face" (it does, in close-ups), "characters have a blob shadow" (the shadow is the character's own outline, cast by a light, and it changes with the pose), "capes never move" (hems lag behind the body and flare), "figures stand in place" (they shift sideways and step), "no glow around lights" (most lights have one). Each of these was visible at native size across consecutive frames. So:
- Look at native size. A detail you cannot see in a sheet is a reason to zoom, never a reason to write "none".
- Look across consecutive frames. Most of what was missed is motion: what lags, what overshoots, what holds, what changes shape.
- Describe what is there. Do not judge against any list of expected features; you are not given one on purpose.
- "Not present" is a claim. Make it only for a region you enlarged, and say which zoom shows it.

## Material (all paths from /Users/daniel/WorkStation/Personal/video/shorts-claude)
For shot N (three digits, e.g. 030):
- `rover-lab/out/deep/sheets/NNN-a.jpg`: the middle frame, native 1280x720.
- `rover-lab/out/deep/sheets/NNN-b.jpg`: 12 frames spread over the shot, with frame numbers.
- `rover-lab/out/deep/sheets/NNN-c.jpg`: top-left an enlarged head (or the frame centre when no face was found); top-right the 320x320 area that changes most, as 6 CONSECUTIVE native frames; bottom the floor band with contrast raised (faint shadows show here).
- `rover-lab/out/deep/stats.jsonl`: one line per shot of machine measurements. `zoom` = total scale change of the picture (1.06 = pushed in 6 %); `pan_x`, `pan_y` = shift of the frame centre in % of width / height; `rot_deg` = total roll; `straight` = chord / length of the pan path (1 = straight line, low = curved or wandering); `zoom_rate_thirds` = zoom speed in the first, middle and last third (equal = constant speed); `parallax_px` = how differently the top and the bottom of the picture slide per frame (0 = the picture moves as one flat layer); `busy_moving_frames` / `busy_held_after` = in the busiest area, frames that changed / of those, how many were followed by an unchanged frame (high share = drawings held for 2 frames); `luma_jump` = largest brightness step between two frames. A `change_pct_max` above 30 usually means the shot contains a cut the cut list missed: treat the parts as separate shots and say so.
- The film itself: `ref/rover_doom.webm` (24 fps). Frame f is at f/24 seconds.

Zoom tool, for anything you want to see closer (run from that same directory):
```
UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" uv run --offline --no-project --with opencv-python-headless --with numpy python rover-lab/tools/zoom.py OUT.jpg x0,y0,x1,y1 FRAMES [--clahe] [--cols N] [--scale K]
```
The box is in native pixels; FRAMES is a list `1667,1669` or a run `1667-1678` (every frame). `--clahe` raises local contrast. Save zooms under `rover-lab/out/deep/notes/zooms/` named `NNN-what.jpg`. Keep a run to 12 frames or fewer per image.

## Method, per shot
1. Read the stats line. Open sheets a, b and c.
2. Go through the regions below one at a time. For each: what is there, how it is drawn (shapes, tones, edges), and what it does over the shot.
3. Zoom. At least two zooms per shot, about three on average, six at most: one run of consecutive frames on a character part that moves (face, hand, hem, hair, feet and shadow), one on something in the set or the light. Add more when a region is unclear. A shot that repeats the set-up of one you already described needs only what differs, but still check its motion.
4. Write the record (format below) before opening the next shot, so nothing is lost.

## Working economically (read this before you start)
Every turn you take re-reads everything already in your context, so turns are the main cost. Per shot, aim for three turns:
1. open the three sheets of the shot in ONE turn (three reads together), with the stats line you printed for the whole batch at the start (`grep` your shots out of stats.jsonl once);
2. ONE shell command that makes all the zooms you want for that shot (chain the zoom calls with `&&`), then open those zooms together in one turn;
3. ONE shell command that appends the record.
Do not re-open a sheet you have already seen. Do not open neighbouring shots' sheets except for the first and the last shot of your batch (for the cut in and the cut out); inside the batch you already have both sides of every cut.

## Two things the first pass could not settle (method, not expectations)
- **Held drawings or a new drawing every frame.** The camera drifts on almost every frame, so the whole picture shifts a little even when a character's drawing is unchanged. To tell them apart, compare the character against itself, not against the frame: in a run of consecutive frames, say exactly which frames show the SAME drawing of the arm, hand, mouth or lids ("identical f2764-2765, new at f2766") and which are new. Record this for at least one moving part per shot, in `acting`.
- **The cut list misses cuts.** When a shot's `change_pct_max` is above 30, or the 12-frame sheet shows two different pictures, find the exact frame of the cut and write two records (`"shot": "64a"`, `"64b"`).

## Regions (the partition)
1. **Frame and camera.** Shot size; where the subject sits; headroom; horizon and vanishing point. Camera move from the stats, checked by eye: push, pull, slide, rise, roll, arc; constant or easing; do near and far layers slide differently; any softness of focus near or far.
2. **Cut in and cut out.** Compare with the neighbouring shots (their sheets exist too, also outside your batch): hard cut or something else; does the size change, does the action or the camera move carry over; is the incoming shot already moving on its first frame.
3. **Far background and sky.** Gradient, stars, clouds, mountains, skyline; what moves there and how fast.
4. **Set, walls, architecture, mid-ground.** Construction (boxes, flat cards), surface pattern, wear, trims, windows, hangings, how edges and corners are finished, how depth is staged in layers.
5. **Floor or ground.** Material, pattern, gradient, light pools, contact with objects, marks, reflections.
6. **Props.** Each prop that reads: how it is built, how many tones, highlights, what casts a shadow, what is animated (swing, flicker, spin).
7. **Light.** Every source in or out of frame; glow, halo, shaft, cone; light landing on walls, floor, props and characters; direction; colour; anything that changes during the shot.
8. **Shadows.** Of each character and of props: shape (blob or silhouette), softness, colour, direction, length; do they follow the pose; shadows of one thing on another (head on chest, arm on body, prop on wall).
9. **Each character** (one entry per character):
   - who, where, how large in the frame; facing; overlap with other figures and props;
   - whole body: does it shift, step, turn, lean, bob, squash; by how much and over how many frames;
   - head: outline, tilt, turn, any change of shape; hair shape, strands, movement of its own;
   - eyes: outline of the whites, colour of the whites, lids, pupils, where they look, every gaze shift and blink with frame numbers;
   - brows; mouth shapes and how often the mouth changes while speaking; teeth, tongue; other face details;
   - arms and hands: poses, the drawings in between, which hand drawing, fingers;
   - torso and clothes: layers, trims, buttons, folds, shading, lighter or darker edges, tint from the scene;
   - cloth, hair, accessories that move on their own: what lags, flares, swings, settles; how many frames;
   - legs and feet, contact with the ground.
10. **Acting, beat by beat.** A list with frame numbers: what changes at that frame, how many in-between drawings, how long each drawing is held, what stays frozen. Say whether changes land every frame or every second frame.
11. **Effects and ambient motion.** Particles, snow, dust, embers, smoke, flicker, sway, glints, screens: shape, count, speed, cadence, layering.
12. **Text and graphics.** Labels, arrows, signs, writing in the set: font feel, size, how it appears.
13. **Colour and finish.** Palette, dominant and accent colours, darkening toward edges, grain, banding, anything about the picture surface.
14. **Anything else.** Whatever does not fit above.

## Output
Append one JSON object per shot (one line each) to `rover-lab/out/deep/notes/batch-XX.jsonl` (XX = your batch number). Keys: `shot`, `frames` ("f0-f1"), `summary` (one sentence), then one key per region: `camera`, `cuts`, `far`, `set`, `floor`, `props`, `light`, `shadows`, `characters` (a list of objects), `acting` (a list of `{"f": frame, "what": "..."}`), `fx`, `text`, `colour`, `other`, and `easy_to_miss` (a list: the details in this shot that a quick viewer, or someone rebuilding it from memory, would get wrong or leave out), and `zooms` (file names you made). Plain specific sentences with frame numbers and, where it helps, pixel positions. Write `"unclear"` rather than guess. You may only write `.jsonl`, `.txt`, `.json` and image files; do not write `.md` files; do not edit anything outside `rover-lab/out/deep/notes/`.

Your final message (it is the only thing the lead reads directly, 700 words at most):
- patterns across your batch with counts ("in 9 of 12 shots ..."), grouped by region;
- the ten most valuable easy-to-miss details, each with its shot and frame numbers and the zoom file that shows it;
- what you could not settle and what would settle it;
- how many shots you covered and how many zooms you made.
