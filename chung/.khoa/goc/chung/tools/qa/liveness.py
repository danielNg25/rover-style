"""liveness.py - standalone gate: is the whole picture alive, apart from the camera? (package Q2)

Needs OpenCV, which is not installed system-wide. Run from rover-lab/ as:

  UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" \
  uv run --no-project --with opencv-python-headless --with numpy --with pillow \
  python tools/qa/liveness.py CLIP [options]

No reference and no element list are needed:
  liveness.py out/shot-king.mp4
  liveness.py out/full.mp4 --cuts 47,76,98,142,173,232,291,313,332,366,401,450

Calibration on a reference film (writes measured values and proposed floors):
  liveness.py ../ref/rover_doom.webm --end 540 --cuts 47,76,... \
      --calibrate qa/calibration-liveness.json [--write-floors]
  --write-floors copies the proposed floors into qa.json -> motion.liveness.floors.
  In calibration mode the exit code only says whether measuring worked (0 or 2).

Options:
  --start N / --end N   frame range in CLIP (end exclusive; default whole clip)
  --cuts a,b,c          first frame of every shot after the first, counted from --start
  --names a,b,c         shot names (default s00, s01, ...)
  --out DIR             default qa/<clip stem>/liveness

Method, per shot and per frame pair (n, n+stride) at the analysis size: fit the
camera (camera.fit_pair), warp frame n+stride onto frame n, take the
misregistration-tolerant difference (motion.compensated). The frame is cut into
a grid (qa.json: grid, e.g. 8x6). A cell is ACTIVE on a pair when at least
min_active_px of its pixels differ by more than the noise floor. For active
cells the cell's own rigid shift (median optical flow) is removed as well; what
survives is INTERNAL motion (a layer that merely slides - parallax, a sliding
cut-out - is active but not internal).

Reported per shot:
  cells_independent   cells active on at least cell_min_share of the pairs
  cells_internal      cells with internal motion on at least cell_min_share of the pairs
  moving_share        share of pairs on which at least one cell is active
  mean_active_cells   mean number of active cells per pair
  longest_frozen      longest run of pairs on which no cell is active (only the camera moves)
  longest_held        longest run of pairs whose two frames are identical (camera frozen too)
Checks: each of the first, second, third and fifth against floors in qa.json ->
motion.liveness.floors.

Output: <out>/liveness.json and <out>/liveness-map.jpg (per shot the middle
frame; each cell tinted by its share of active pairs, the share written in it,
a green frame around cells with internal motion). Exit code 0 = pass, 1 = fail,
2 = could not measure.
"""
import argparse
import fcntl
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import camera as K  # noqa: E402
import motion as Mo  # noqa: E402

cv2 = K.cv2
TOOL = "liveness"
FLOOR_KEYS = ("min_cells_independent", "min_cells_internal", "min_moving_share", "max_frozen_frames")


def analyse(frames, cfg, cam):
    n = len(frames)
    stride = max(1, min(int(cfg["stride"]), n - 2))
    gx, gy = int(cfg["grid"][0]), int(cfg["grid"][1])
    h, w = frames[0].shape
    if n < stride + 2:
        return {"frames": n, "measured": False, "reason": "shot shorter than %d frames" % (stride + 2)}
    fits = K.pair_transforms(frames, stride, cam)
    missing = sum(1 for M, _ in fits if M is None)
    res = {"frames": n, "stride": stride, "pairs": len(fits), "camera_fit_missing_pairs": missing}
    if missing > len(fits) * float(cfg["max_camera_missing_share"]):
        res.update(measured=False, reason="camera could not be fitted on %d of %d pairs" % (missing, len(fits)))
        return res
    rcfg = dict(cfg)
    maps, noises = [], []
    for i, (M, _) in enumerate(fits):
        d, valid, pb, cw = Mo.residual(frames[i], frames[i + stride], M, rcfg)
        noises.append(Mo.frame_noise(d, valid, (gx, gy)))
        maps.append((d, valid, pb, cw))
    noise = float(np.median(noises))
    thr = max(float(cfg["pix_thr"]), float(cfg["noise_k"]) * noise)
    need = int(cfg["min_active_px"])
    pad = int(cfg["flow_pad_px"])
    act = np.zeros((len(fits), gy, gx), bool)
    inte = np.zeros((len(fits), gy, gx), bool)
    held = []
    for i, (d, valid, pb, cw) in enumerate(maps):
        held.append(float(cv2.absdiff(frames[i], frames[i + stride]).mean()) < float(cfg["held_max_diff"]))
        hot = (d > thr) & valid
        if not hot.any():
            continue
        for r in range(gy):
            for c in range(gx):
                y0, y1, x0, x1 = r * h // gy, (r + 1) * h // gy, c * w // gx, (c + 1) * w // gx
                if int(hot[y0:y1, x0:x1].sum()) < need:
                    continue
                act[i, r, c] = True
                Y0, Y1, X0, X1 = max(0, y0 - pad), min(h, y1 + pad), max(0, x0 - pad), min(w, x1 + pad)
                sub = (slice(Y0, Y1), slice(X0, X1))
                cell = np.zeros((Y1 - Y0, X1 - X0), bool)
                cell[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
                a = hot[sub] & cell
                v = Mo.own_translation(pb[sub], cw[sub], a)
                di = Mo.internal_residual(pb[sub], cw[sub], d[sub], v, cfg["tol_px"])
                inte[i, r, c] = int(((di > thr) & a).sum()) >= need
    share = act.mean(axis=0)
    ishare = inte.mean(axis=0)
    any_act = act.any(axis=(1, 2))
    cms = float(cfg["cell_min_share"])
    res.update(
        measured=True, noise=round(noise, 3), pix_thr=round(thr, 2),
        cells_total=gx * gy,
        cells_independent=int((share >= cms).sum()),
        cells_internal=int((ishare >= cms).sum()),
        moving_share=round(float(any_act.mean()), 3),
        mean_active_cells=round(float(act.sum(axis=(1, 2)).mean()), 2),
        longest_frozen=int(K.longest_run(~any_act)),
        longest_held=int(K.longest_run(held)),
        active_cells_curve=[int(v) for v in act.sum(axis=(1, 2))],
        cell_share=[[round(float(v), 2) for v in row] for row in share],
        cell_internal_share=[[round(float(v), 2) for v in row] for row in ishare],
    )
    return res


def map_image(frame, res, label, cms):
    from PIL import Image, ImageDraw
    h, w = frame.shape
    im = Image.fromarray(frame).convert("RGB")
    if not res.get("measured"):
        return C.label(im, "%s UNMEASURED: %s" % (label, res.get("reason", "")))
    ov = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    gy, gx = len(res["cell_share"]), len(res["cell_share"][0])
    for r in range(gy):
        for c in range(gx):
            s, si = res["cell_share"][r][c], res["cell_internal_share"][r][c]
            x0, y0, x1, y1 = c * w // gx, r * h // gy, (c + 1) * w // gx, (r + 1) * h // gy
            if s >= cms:
                d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=(255, int(220 * (1 - s)), 0, int(60 + 120 * s)))
            else:
                d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=(0, 40, 160, 110))
            d.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(255, 255, 255, 90))
            if si >= cms:
                d.rectangle([x0 + 2, y0 + 2, x1 - 3, y1 - 3], outline=(60, 255, 90, 255), width=2)
            d.text((x0 + 4, y0 + 3), "%d" % round(s * 100), fill=(255, 255, 255, 255))
    im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    return C.label(im, "%s  cells %d of %d\ninternal %d  moving %.0f%%  frozen %d" % (
        label, res["cells_independent"], res["cells_total"], res["cells_internal"],
        res["moving_share"] * 100, res["longest_frozen"]))


def propose(shots, pct, margin):
    """(floors, p-th percentile floors) from the reference shots.

    floors = the WORST reference shot relaxed by `margin` (so every reference shot passes);
    the percentile variant is stricter and fails about pct % of the reference shots by construction.
    """
    m = [s for s in shots if s.get("measured")]
    if not m:
        return None, None
    g = lambda k: [s[k] for s in m]  # noqa: E731
    worst = {
        "min_cells_independent": int(np.floor(min(g("cells_independent")) * margin)),
        "min_cells_internal": int(np.floor(min(g("cells_internal")) * margin)),
        "min_moving_share": round(float(np.floor(min(g("moving_share")) * margin * 100) / 100), 2),
        "max_frozen_frames": int(np.ceil(max(g("longest_frozen")) / margin)),
    }
    perc = {
        "min_cells_independent": int(np.floor(np.percentile(g("cells_independent"), pct))),
        "min_cells_internal": int(np.floor(np.percentile(g("cells_internal"), pct))),
        "min_moving_share": round(float(np.floor(np.percentile(g("moving_share"), pct) * 100) / 100), 2),
        "max_frozen_frames": int(np.ceil(np.percentile(g("longest_frozen"), 100 - pct))),
    }
    return worst, perc


def write_floors(floors, source):
    with open(C.QA_JSON + ".lock", "w") as lf:
        fcntl.flock(lf, fcntl.LOCK_EX)
        try:
            with open(C.QA_JSON, "r", encoding="utf8") as f:
                data = json.load(f)
            lv = data.setdefault("motion", {}).setdefault("liveness", {})
            lv["floors"] = floors
            lv["floors_source"] = source
            tmp = C.QA_JSON + ".tmp%d" % os.getpid()
            with open(tmp, "w", encoding="utf8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            os.replace(tmp, C.QA_JSON)
        finally:
            fcntl.flock(lf, fcntl.LOCK_UN)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip")
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--end", type=int, default=None)
    ap.add_argument("--cuts", default="")
    ap.add_argument("--names", default="")
    ap.add_argument("--out")
    ap.add_argument("--calibrate", metavar="JSON")
    ap.add_argument("--write-floors", action="store_true")
    a = ap.parse_args()
    K.need_cv()
    keys = ["size", "grid", "stride", "blur_sigma", "tol_px", "border_px", "pix_thr", "noise_k",
            "min_active_px", "flow_pad_px", "cell_min_share", "held_max_diff", "max_camera_missing_share",
            "calibration_percentile", "calibration_margin"]
    if not a.calibrate:
        keys.append("floors")
    cfg = K.cfg_section("liveness", keys)
    cam = K.cfg_section("camera", ["max_features", "feature_quality", "feature_min_dist", "fb_max_px",
                                   "ransac_px", "min_inliers"])
    floors = cfg.get("floors") or {}
    if not a.calibrate and any(k not in floors for k in FLOOR_KEYS):
        print("qa.json motion.liveness.floors is incomplete: run with --calibrate ... --write-floors first",
              file=sys.stderr)
        sys.exit(2)
    try:
        inf = C.info(a.clip)
    except Exception as e:
        print("cannot read %s: %s" % (a.clip, e), file=sys.stderr)
        sys.exit(2)
    end = a.end if a.end is not None else inf["frames"]
    ranges = K.shot_ranges(a.start, end, [int(x) for x in a.cuts.split(",") if x.strip()],
                           [x for x in a.names.split(",") if x.strip()])
    size = tuple(cfg["size"])
    out = a.out or C.evidence_dir(a.clip, "liveness")
    os.makedirs(out, exist_ok=True)
    clip_sha = C.sha(a.clip)

    checks, shots, tiles = [], [], []
    for name, s, e, fr in K.read_shots(a.clip, a.start, end, ranges, size):
        if len(fr) < e - s:
            # a shot that is not (fully) in the clip is never dropped silently
            checks.append(C.check(name + ":liveness", C.UNMEASURED, {"frames": len(fr), "expected": e - s}, None,
                                  "the clip holds %d of the %d frames of this shot (frames %d-%d asked, clip has %d)"
                                  % (len(fr), e - s, a.start + s, a.start + e, inf["frames"])))
            shots.append({"name": name, "start": a.start + s, "end": a.start + e, "measured": False,
                          "reason": "frames missing from the clip", "frames_found": len(fr)})
            continue
        r = analyse(fr, cfg, cam)
        r.update(name=name, start=a.start + s, end=a.start + e)
        shots.append(r)
        tiles.append(map_image(fr[len(fr) // 2], r, name, float(cfg["cell_min_share"])))
        if not r.get("measured"):
            checks.append(C.check(name + ":liveness", C.UNMEASURED, None, None, r.get("reason")))
            continue
        if a.calibrate:
            checks.append(C.check(name + ":measured", C.PASS, {
                k: r[k] for k in ("cells_independent", "cells_internal", "moving_share", "longest_frozen")}))
            continue
        for key, val, ok in (
                ("min_cells_independent", r["cells_independent"], r["cells_independent"] >= floors["min_cells_independent"]),
                ("min_cells_internal", r["cells_internal"], r["cells_internal"] >= floors["min_cells_internal"]),
                ("min_moving_share", r["moving_share"], r["moving_share"] >= floors["min_moving_share"]),
                ("max_frozen_frames", r["longest_frozen"], r["longest_frozen"] <= floors["max_frozen_frames"])):
            checks.append(C.check("%s:%s" % (name, key[4:]), C.PASS if ok else C.FAIL, val, {key: floors[key]}))

    res_path = os.path.join(out, "liveness.json")
    if not tiles:
        K.cannot_measure(TOOL, res_path, "liveness", "no shot of the asked range %d-%d exists in the clip "
                         "(%d frames)" % (a.start, end, inf["frames"]), None,
                         {"clip": os.path.abspath(a.clip), "range": [a.start, end], "clip_frames": inf["frames"]})
    ev = os.path.join(out, "liveness-map.jpg")
    code = C.save_evidence(C.tile(tiles, None, 3 if len(tiles) > 4 else 2), ev, clip_sha)
    not_checked = [
        "WHAT moves: a cell full of codec shimmer, dust or a layer sliding by parallax counts as active; "
        "only cells_internal excludes rigid slides",
        "motion slower than about tol_px pixels per pair at the analysis size (very slow drifts read as still)",
        "whether the motion is good (a walk that reads as a walk): see motion.py with declared elements",
        "the camera itself: see camera.py",
        "floors come from 13 shots of one reference film; they are a first calibration, not a standard",
    ]
    extra = {"mode": "calibration" if a.calibrate else "standalone",
             "clip": os.path.abspath(a.clip), "clip_sha256": clip_sha, "range": [a.start, end],
             "clip_frames": inf["frames"], "thresholds": cfg, "shots": shots, "evidence": [{"path": ev, "code": code}]}
    rc = C.write_result(res_path, TOOL, checks, not_checked, extra)
    C.print_summary(TOOL, checks, not_checked, res_path, [ev])
    if a.calibrate:
        pct = float(cfg["calibration_percentile"])
        margin = float(cfg["calibration_margin"])
        prop, perc = propose(shots, pct, margin)
        meas = [s for s in shots if s.get("measured")]
        cal = {
            "tool": TOOL, "source": os.path.abspath(a.clip), "source_sha256": clip_sha,
            "range": [a.start, end], "cuts": a.cuts, "percentile": pct,
            "settings": {k: cfg[k] for k in keys if k != "floors"},
            "proposed_floors": prop, "margin": margin,
            "percentile_floors": perc,
            "distribution": {k: {"min": float(np.min([s[k] for s in meas])),
                                 "p10": float(np.percentile([s[k] for s in meas], 10)),
                                 "median": float(np.median([s[k] for s in meas])),
                                 "max": float(np.max([s[k] for s in meas]))}
                             for k in ("cells_independent", "cells_internal", "moving_share",
                                       "mean_active_cells", "longest_frozen", "longest_held")} if meas else {},
            "shots": [{k: v for k, v in s.items() if k not in ("cell_share", "cell_internal_share")}
                      for s in shots],
            "evidence": ev,
            "note": "proposed_floors = worst reference shot x margin %g, so the reference passes; "
                    "percentile_floors = %gth percentile (frozen: %gth), stricter: about one reference shot "
                    "in ten sits below them by construction." % (margin, pct, 100 - pct),
        }
        os.makedirs(os.path.dirname(os.path.abspath(a.calibrate)), exist_ok=True)
        with open(a.calibrate, "w", encoding="utf8") as f:
            json.dump(cal, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("  calibration: %s\n  proposed floors: %s\n  percentile floors: %s" % (
            a.calibrate, json.dumps(prop), json.dumps(perc)))
        if a.write_floors and prop:
            write_floors(prop, "%s frames %d-%d, worst shot x %g" % (os.path.basename(a.clip), a.start, end - 1, margin))
            print("  floors written to qa.json -> motion.liveness.floors")
    sys.exit(rc)


if __name__ == "__main__":
    main()
