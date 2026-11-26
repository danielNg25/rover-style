# doom-b art decisions

## Boy Victor: head-to-body proportion (decided before sheet 1)
Still: `ep-doom-b-proportion` (out/ep-doom-b-proportion-0.png): queen, ruler, mock-up A (head : body 1 : 1.3) and
mock-up B (1 : 1.6), both 55 % of the ruler's height, with neck and shoulders.

First decision on the mock-up: B, 1 : 1.6 (the bible's ratio), for the reasons below.
**REVISED after the real art was cut and stood beside the ruler: FINAL = A, 1 : 1.3** (see "Revision").
- Measured on the still, the adults stand at about 1 : 2 (queen face 1 : 2.0, ruler mask 1 : 2.2). B is one clear
  step bigger-headed than they are, which reads "child"; A is two steps and reads as a different, bobble-head cartoon.
- B keeps the shawl as the larger mass, so the green silhouette (the ruler's outline in miniature, bible 5.2 lever 1
  and 2) is what is read from behind at 20 % of frame height; in A the head is the silhouette.
- B leaves room for a visible neck and collar roll without the head sitting on the shoulders.

### Revision (model sheet ep-doom-b-models, first render at 1 : 1.6)
With the generated head (663 px wide, hair included) on the generated bust (653 px wide) the 1 : 1.6 figure was a long
narrow cone under a small head and read as a slim adult, not an eight-year-old; the mock-up had hidden this because
its shawl was drawn wider than the head. At 1 : 1.3 (head tuft-to-chin 640 px, body 838 px) he reads as a child, keeps
a visible neck inside the collar and real shoulders (no neckless bobble-head), and the shawl is still the larger
mass. The rig `VICTOR` is built at 1 : 1.3; height stays 55 % of the ruler (VICTOR_H = 1.595 at ruler 2.9).

## Code-made pieces (art/make_pieces.py, no generation)
- `vic-lower.png`: sheet 1 gives the bust from the waist up only; the shawl is continued to the ground with flat
  polygons in the bust's measured colours so the full figure can stand in a wide.
- `vic-hair.png`: the hair of the head picture as an overlay above the eyelids (a half-shut lid would otherwise paint
  skin over the fringe).
- `camp-mother-body-flat.png`, `camp-mother-arms-set.png`: the two silhouettes flattened to one exact tone (#2f2b3a);
  the arms scaled to 300 px and turned 26 degrees so one forearm reaches forward out of the body outline.

## Eyes
The design asks for separated oval eye whites with movable pupils (not the queen's touching discs). The mock-up's
tiny eyes looked poor next to the professional exemplars (clean, large eyes). Sheet 1 therefore asks for clean
cream upright ovals of about one fifth of the head width each, still separated by a gap of skin: the design's idea
(separated ovals, heavy mask brows above), the exemplars' size and cleanliness.

## Budget note
One generation of the budget was reserved by an earlier, interrupted run at 00:54 (gen/log.jsonl, reservation
69e74dc1bbf8) and produced no image. It counts: 2 generations were left for the two sheets, no retry.
