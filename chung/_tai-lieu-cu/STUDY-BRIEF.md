# Study brief: reference style, 100 samples per feature

You are one of several analysts studying ONE reference animation so that a studio can reproduce its look exactly. The owner's rule: **no claim becomes a rule unless it rests on at least 100 samples that somebody actually looked at.** Earlier analysis in this project repeatedly drew rules from 1-8 frames and had to retract them. Your job is to replace opinion with counted observation for ONE feature area.

## Material (all paths from /Users/daniel/WorkStation/Personal/video/shorts-claude/rover-lab)
- Reference video: `../ref/rover_doom.webm` (1280x720, 24 fps, 34,444 frames, 1435 s). ffmpeg and ffprobe are on PATH.
- Per-shot annotations of 666 shots (time range, narration, what is shown, framing, set, characters, action, camera, moving things): `../research/rover-explains-2026-11-20/shots/chunk-*.json` (rows have t0, t1 in seconds). Detected cut times: `../research/rover-explains-2026-11-20/bao-cao-goc/cuts.txt`. Use these to FIND samples, not as evidence.
- Existing helper scripts you may read, copy and adapt (do not edit them): `tools/gallery.py` (themed galleries from annotations), `tools/facebank.py` (finds every eye pair in the film), `tools/headshapes.py` (head outlines, whole-body crops scaled by the eye band), `tools/exprtime.py` (per-frame face change detection, body strips of a shot), `tools/shotsheet.py`.
- Python 3 with numpy and Pillow system-wide. OpenCV only via: `UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" uv run --offline --no-project --with opencv-python-headless --with numpy --with pillow python <script>`.
- Current catalogue of claims: `DANH-MUC-HINH.md` (Vietnamese). Treat every line in it as an UNTESTED CLAIM that may be wrong. You are not asked to confirm it.

## Rules
- Read-only on the project: write ONLY under `out/study/<your-area>/` (scripts, sample sheets, tables, findings). Do not render with Remotion, do not call Codex or gen.sh, do not edit src/ or tools/.
- When combining two video streams in ffmpeg use `settb=AVTB,setpts=N/24/TB`. To cut a frame by number: `-vf "select='eq(n\,N)'" -frames:v 1` (slow for late frames; `-ss <seconds>` before `-i` is faster for single frames).

## Method (mandatory)
1. Define the features you will tally for your area BEFORE looking (a short list of concrete, checkable questions per sample, each with a small set of allowed answers plus "cannot tell").
2. Build the sample set: at least 100 samples per feature, spread over the whole film and over as many different characters and sets as possible (not 100 frames of the same shot: at most 3 samples per shot unless the feature is about change over time). A sample is a crop large enough to judge the feature (full resolution for small things). If the film contains fewer than 100 instances, collect ALL of them and state the number plainly.
3. Put the samples on numbered contact sheets (at most 30 tiles per sheet, each tile big enough to read) under `out/study/<area>/sheets/`. LOOK at every sheet with the Read tool.
4. Record one row per sample in `out/study/<area>/samples.csv`: sample id, time or frame, sheet, and your answer to each feature question. Fill it from what you see, sample by sample. Do not fill rows you did not look at.
5. Where a quantity can be measured (pixels, frames, ratios, counts), measure it by script on the same samples and store the numbers.
6. Count. Write `out/study/<area>/findings.md`: for each feature the tally with n (for example "ground shadow present: 87 of 112; absent: 19; cannot tell: 6"), the measured distributions (median, quartiles, range), the distinct types you found with how many samples each and 3 sample ids as examples, the exceptions, and a list "claims in DANH-MUC-HINH.md this supports / contradicts / could not test". State what you could NOT reach 100 samples for and how many more would be needed.
7. Be literal. Describe what is on screen. "Usually" and "often" are not allowed without a count.

## Final answer
At most 450 words: the features with their tallies (n for each), the distinct types found, contradictions with the current catalogue, what fell short of 100 samples, and the paths of your sheets and findings file.
