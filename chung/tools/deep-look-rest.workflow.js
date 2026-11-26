export const meta = {
  name: 'deep-look-rest',
  description: 'Look closely at the remaining reference shots (240 and 253-674) in batches of 6 (waves of 7 agents), then summarise the notes of all 674 shots by region',
  phases: [
    { title: 'Look', detail: '72 analysts, 6 shots each, region by region at native size' },
    { title: 'Summarise', detail: '10 agents tally the notes of the whole film by region' },
  ],
}
const ROOT = '/Users/daniel/WorkStation/Personal/video/shorts-claude'
const pad = (n) => String(n).padStart(3, '0')
const batches = []
batches.push({ b: 33, first: 240, last: 240 })
let bn = 36
for (let s = 253; s <= 674; s += 6) batches.push({ b: bn++, first: s, last: Math.min(674, s + 5) })

const LOOK_SCHEMA = {
  type: 'object',
  properties: {
    batch: { type: 'integer' },
    records: { type: 'integer', description: 'JSON lines written' },
    zooms: { type: 'integer', description: 'zoom images made' },
    hidden_cuts: { type: 'array', items: { type: 'string' }, description: 'cuts the cut list missed, as "shot N at frame F"' },
    note: { type: 'string', description: 'at most 50 words: anything the lead must know (a shot you could not cover, a tool problem)' },
  },
  required: ['batch', 'records', 'zooms'],
}

const lookPrompt = (x) => `You are an analyst in a shot-by-shot visual study of a reference animation. Read the full brief first and follow it exactly, including its sections "Working economically" and "Two things the first pass could not settle": ${ROOT}/rover-lab/DEEP-BRIEF.md

Your batch number is ${x.b}. Your shots are ${x.first} to ${x.last}. Work through every one of them region by region as the brief describes, zooming on consecutive frames at native size (at least two zooms per shot). Append one JSON line per shot to ${ROOT}/rover-lab/out/deep/notes/batch-${pad(x.b)}.jsonl and save your zooms under ${ROOT}/rover-lab/out/deep/notes/zooms/ named with the three-digit shot number first. An earlier analyst may have been cut off on this batch: first check whether the file already has a line for any of your shots and do only the missing ones. You are not given earlier findings on purpose: report what you see, not what you expect. Do not write .md files and do not edit anything outside rover-lab/out/deep/notes/.

All the value of your work is in the JSON lines: make each region entry specific (frame numbers, pixel positions, counts, which frames show the same drawing). The brief's "final message" section does not apply to you; your structured return is only a receipt (batch number, lines written, zooms made, hidden cuts found, a short note).`

phase('Look')
const receipts = []
let failed = []
for (let i = 0; i < batches.length; i += 7) {
  const wave = batches.slice(i, i + 7)
  const res = await parallel(wave.map((x) => () => agent(lookPrompt(x), { label: `look ${x.first}-${x.last}`, phase: 'Look', schema: LOOK_SCHEMA, effort: 'medium' })))
  res.forEach((r, j) => { if (r) receipts.push(r); else failed.push(wave[j]) })
  log(`shots up to ${wave[wave.length - 1].last} done; ${receipts.length} batches in, ${failed.length} failed so far`)
}
if (failed.length) {
  const again = failed.slice(0, 14)
  const res = await parallel(again.map((x) => () => agent(lookPrompt(x) + `\n\nA previous analyst may have left a partial file for this batch: check which shots already have a line in it and only do the missing ones.`, { label: `retry ${x.first}-${x.last}`, phase: 'Look', schema: LOOK_SCHEMA, effort: 'medium' })))
  const still = []
  res.forEach((r, j) => { if (r) receipts.push(r); else still.push(again[j]) })
  failed = still.concat(failed.slice(14))
  log(`retry done; still failed: ${failed.length}`)
}

phase('Summarise')
const SYN = [
  { key: 'camera-cuts', fields: 'camera,cuts', range: null, focus: 'camera moves (kinds, sizes, constant or easing, roll, shake, arcs, following the action), parallax between layers, focus and background softness, shot sizes and subject placement; cuts and transitions (hard cuts, dissolves, fades, chained transitions, size changes across cuts, motion carried over, expression continuity)' },
  { key: 'set-floor', fields: 'set,floor', range: null, focus: 'how sets are built and finished (boxes, cards, layers, trims, wear, patterns, windows, what is seen through openings, reuse and re-dressing of sets) and floors or ground (materials, patterns, gradients, marks, light on the floor)' },
  { key: 'far-colour', fields: 'far,colour', range: null, focus: 'far backgrounds and skies (gradients, stars, clouds, mountains, skylines, what moves there) and colour and finish (palettes per kind of place and time, accents, haze by distance, vignette, surface)' },
  { key: 'props-text', fields: 'props,text,other', range: null, focus: 'props (construction, tones, highlights, which are animated and how, 3D props with 2D characters) and all text and graphics (labels, arrows, signs, inserts, how they appear and whether they live in the scene)' },
  { key: 'light-shadow', fields: 'light,shadows', range: null, focus: 'light sources, glows and halos (soft or stepped), shafts and cones, light landing on surfaces and on characters, which sources really light things and which are decoration, changes of light over a shot; shadows of characters and props (shape, softness, direction per set, on what surfaces, following the pose, floating figures)' },
  { key: 'fx-acting', fields: 'fx,acting', range: null, focus: 'effects and ambient motion (particles, fire, smoke, steam, pops with overshoot, vanishes, swaps, cadence of each); and the timing of acting: for every statement about which frames show the same drawing, tally held-for-2-frames against a-new-drawing-every-frame, per body part (arm, hand, mouth, lids, whole pose); in-betweens, motion blur, overshoot, holds, how long poses last' },
  { key: 'characters-1', fields: 'characters', range: [1, 225], focus: 'characters in shots 1-225: head outlines, hair, eyes (whites, lids, pupils, gaze, blink recipes with counts), brows, mouths, face details; arms and hands; torso and clothes; cloth, hair and accessories that move on their own; whole-body moves (shifts, steps, turns, squats, glides, walks); back and side views; shading and tint on characters; costume changes' },
  { key: 'characters-2', fields: 'characters', range: [226, 450], focus: 'characters in shots 226-450: head outlines, hair, eyes (whites, lids, pupils, gaze, blink recipes with counts), brows, mouths, face details; arms and hands; torso and clothes; cloth, hair and accessories that move on their own; whole-body moves (shifts, steps, turns, squats, glides, walks); back and side views; shading and tint on characters; costume changes' },
  { key: 'characters-3', fields: 'characters', range: [451, 674], focus: 'characters in shots 451-674: head outlines, hair, eyes (whites, lids, pupils, gaze, blink recipes with counts), brows, mouths, face details; arms and hands; torso and clothes; cloth, hair and accessories that move on their own; whole-body moves (shifts, steps, turns, squats, glides, walks); back and side views; shading and tint on characters; costume changes' },
  { key: 'easy-to-miss', fields: 'summary,easy_to_miss', range: null, focus: 'the details analysts flagged as easy to miss: group them into recurring kinds, count each kind, and single out the rare one-off inventions (a scene idea, a transition, a piece of staging) that give the film its variety' },
]
const synPrompt = (s) => `You are summarising the notes of a shot-by-shot visual study of one reference animation (674 shots, each described region by region by analysts who looked at native-size consecutive frames). Your job is to turn the notes for YOUR regions into counted findings. Work from the directory ${ROOT}.

Your regions: ${s.focus}.

How to read the notes: run
  python3 rover-lab/tools/deepextract.py ${s.fields} FIRST LAST > rover-lab/out/deep/synth/${s.key}-K.txt
for consecutive ranges of about 110 shots covering ${s.range ? `shots ${s.range[0]} to ${s.range[1]}` : 'shots 1 to 674'}, then read each file completely with the Read tool (use offset and limit when a file is long; one or two files per turn, to keep turns few). Read ALL of it: the value is in counts over the whole range, not in samples. Shots written like "64a" and "64b" are two parts of a listed shot that hid a cut.

Then return, in at most 900 words of plain text (your final message is the only thing the lead reads):
1. Every distinct technique or feature in your regions, each with the number of shots that show it out of the number you read, and up to six example shot numbers (add frame numbers when the notes give them).
2. Variants, and the conditions under which each appears (interior or exterior, day or night, close or wide, kind of scene), where the notes allow it.
3. Places where analysts disagree or the notes contradict each other.
4. Up to twelve rare details most worth copying, each with its shot and the zoom file named in the notes.
5. What stays unclear and what would settle it.
Count from the notes; do not guess and do not fill gaps from general knowledge of animation. Also write your tallies to rover-lab/out/deep/synth/${s.key}.json as a list of {"feature": "...", "shots": [...]} objects. Do not write .md files.`
const synth = []
for (let i = 0; i < SYN.length; i += 7) {
  const wave = SYN.slice(i, i + 7)
  const res = await parallel(wave.map((s) => () => agent(synPrompt(s), { label: `sum ${s.key}`, phase: 'Summarise', effort: 'medium' })))
  res.forEach((r, j) => synth.push({ key: wave[j].key, text: r }))
}
return {
  batches_done: receipts.length,
  batches_failed: failed.map((x) => `${x.first}-${x.last}`),
  records: receipts.reduce((n, r) => n + (r.records || 0), 0),
  zooms: receipts.reduce((n, r) => n + (r.zooms || 0), 0),
  hidden_cuts: receipts.flatMap((r) => r.hidden_cuts || []),
  notes: receipts.filter((r) => r.note).map((r) => `b${r.batch}: ${r.note}`),
  synth,
}