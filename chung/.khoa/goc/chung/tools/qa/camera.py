"""camera.py - gate G4: global camera motion per shot (package Q2).

Needs OpenCV, which is not installed system-wide. Run from rover-lab/ as:

  UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" \
  uv run --no-project --with opencv-python-headless --with numpy --with pillow \
  python tools/qa/camera.py CLIP [options]

STANDALONE mode (no reference; the default):
  camera.py out/shot-king.mp4
  camera.py out/full.mp4 --cuts 47,76,98,142,173,232,291,313,332,366,401,450
  Fails a shot whose camera is static (floors in qa.json -> motion.camera) and
  reports the measured values so the floors can be calibrated.

REFERENCE mode:
  camera.py out/full.mp4 --cuts 47,76,... --ref ../ref/rover_doom.webm --ref-start 0
  Compares sign and size of zoom and shift with the reference, shot by shot.

Options:
  --start N / --end N   frame range in CLIP (end exclusive; default whole clip)
  --cuts a,b,c          first frame of every shot after the first, counted from --start
  --names a,b,c         shot names (default s00, s01, ...)
  --ref PATH --ref-start N   reference clip and the frame in it that equals --start
  --out DIR             default qa/<clip stem>/camera

Method: features (goodFeaturesToTrack) -> pyramidal LK with a forward/backward
check -> RANSAC partial affine (scale, rotation, shift). Fits are made between
frame n and n+stride (stride in qa.json) and divided by the stride. With
fewer than min_inliers inliers the pair is UNMEASURED, never a pass. Method B
of the spec (contract landmarks) is NOT implemented.

Units and signs:
  zoom_pct_s   scale change in percent per second; + = push in (picture grows)
  shift_x_pct_s, shift_y_pct_s   movement of the picture centre in percent of the
               frame WIDTH per second; + = picture moves right / down
  speed_pct_s  mean displacement of the four frame corners, percent of width per second

Output: <out>/camera.json and <out>/camera.jpg (per shot: first frame with the
rectangle that the last frame covers, last frame, and the profile curves).
Exit code 0 = pass, 1 = fail, 2 = could not measure.

The functions fit_pair, pair_transforms, read_shots and shot_ranges are also
imported by motion.py and liveness.py.
"""
import argparse
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

try:
    import cv2
except ImportError:  # pragma: no cover
    cv2 = None

TOOL = "camera"
CV_HINT = ("OpenCV missing. Run as: UV_CACHE_DIR=\"$TMPDIR/uvcache\" UV_TOOL_DIR=\"$TMPDIR/uvtools\" "
           "UV_PYTHON_INSTALL_DIR=\"$TMPDIR/uvpy\" uv run --no-project --with opencv-python-headless "
           "--with numpy --with pillow python <script> ...")


# ------------------------------------------------------------------ shared core
def need_cv():
    if cv2 is None:
        print(CV_HINT, file=sys.stderr)
        sys.exit(2)


def cfg_section(name, keys):
    """qa.json -> motion -> <name>; exit 2 when a threshold is missing (never defaulted in code)."""
    cfg = C.load_cfg("motion").get(name)
    if not isinstance(cfg, dict):
        print("qa.json has no motion.%s section: cannot measure" % name, file=sys.stderr)
        sys.exit(2)
    missing = [k for k in keys if k not in cfg]
    if missing:
        print("qa.json motion.%s lacks: %s" % (name, ", ".join(missing)), file=sys.stderr)
        sys.exit(2)
    return cfg


def cannot_measure(tool, res_path, what, msg, measured=None, extra=None):
    """Write a result with one UNMEASURED check, say why on stderr, exit 2 (never a pass, never a fail)."""
    checks = [C.check(what, C.UNMEASURED, measured, None, msg)]
    C.write_result(res_path, tool, checks, ["everything: %s" % msg], extra)
    print("%s: UNMEASURED - %s\n  result: %s" % (tool, msg, res_path), file=sys.stderr)
    sys.exit(2)


def shot_ranges(start, end, cuts, names):
    """[(name, a, b)] with b exclusive, in frames counted from `start` (relative)."""
    n = end - start
    cs = sorted(set(int(c) for c in cuts if 0 < int(c) < n))
    edges = [0] + cs + [n]
    out = []
    for i in range(len(edges) - 1):
        nm = names[i] if names and i < len(names) else "s%02d" % i
        out.append((nm, edges[i], edges[i + 1]))
    return out


def read_shots(path, start, end, ranges, size):
    """Yield (name, a, b, [grey frames]) per shot from ONE sequential decode."""
    it = C.frames(path, start, end, size=size, grey=True)
    for name, a, b in ranges:
        buf = []
        for _ in range(b - a):
            try:
                buf.append(next(it)[1])
            except StopIteration:
                break
        yield name, a, b, buf


def fit_pair(prev, cur, cfg):
    """Partial affine that maps points of `prev` onto `cur`. Returns (M 2x3 or None, inliers)."""
    pts = cv2.goodFeaturesToTrack(prev, int(cfg["max_features"]), float(cfg["feature_quality"]),
                                  float(cfg["feature_min_dist"]))
    if pts is None or len(pts) < 8:
        return None, 0
    lk = dict(winSize=(21, 21), maxLevel=3,
              criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, pts, None, **lk)
    back, st2, _ = cv2.calcOpticalFlowPyrLK(cur, prev, nxt, None, **lk)
    fb = np.linalg.norm((pts - back).reshape(-1, 2), axis=1)
    ok = (st.ravel() == 1) & (st2.ravel() == 1) & (fb < float(cfg["fb_max_px"]))
    if ok.sum() < 8:
        return None, int(ok.sum())
    M, inl = cv2.estimateAffinePartial2D(pts[ok], nxt[ok], method=cv2.RANSAC,
                                         ransacReprojThreshold=float(cfg["ransac_px"]))
    if M is None:
        return None, 0
    n = int(inl.sum())
    if n < int(cfg["min_inliers"]):
        return None, n
    return M.astype(np.float64), n


def pair_transforms(frames, stride, cfg):
    """[(M or None, inliers)] for the pairs (i, i+stride), i = 0 .. len-stride-1."""
    return [fit_pair(frames[i], frames[i + stride], cfg) for i in range(len(frames) - stride)]


def decompose(M, w, h, fps, stride):
    """(zoom %/s, shift x %w/s, shift y %w/s, corner speed %w/s) of one fit."""
    s = float(np.hypot(M[0, 0], M[1, 0]))
    per_s = fps / float(stride)
    c = np.array([w / 2.0, h / 2.0, 1.0])
    d = M @ c - c[:2]
    corners = np.array([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]], np.float64)
    disp = np.linalg.norm(corners @ M.T - corners[:, :2], axis=1).mean()
    return ((s - 1.0) * 100.0 * per_s, d[0] / w * 100.0 * per_s, d[1] / w * 100.0 * per_s,
            disp / w * 100.0 * per_s)


def longest_run(flags):
    best = cur = 0
    for f in flags:
        cur = cur + 1 if f else 0
        best = max(best, cur)
    return best


# ------------------------------------------------------------------ camera analysis
def analyse(frames, fps, cfg):
    """Camera measurement of one shot (list of grey frames)."""
    n = len(frames)
    h, w = frames[0].shape
    stride = max(1, min(int(cfg["stride"]), n - 2))
    if n < 3:
        return {"frames": n, "measured": False, "reason": "shot shorter than 3 frames"}
    fits = pair_transforms(frames, stride, cfg)
    prof = []
    for M, inl in fits:
        prof.append(None if M is None else decompose(M, w, h, fps, stride))
    good = [p for p in prof if p is not None]
    share = len(good) / float(len(prof))
    res = {"frames": n, "stride": stride, "pairs": len(prof), "pairs_measured": len(good),
           "measured_share": round(share, 3),
           "median_inliers": int(np.median([i for _, i in fits])) if fits else 0}
    if share < float(cfg["min_measured_share"]):
        res.update(measured=False, reason="too few pairs with %d+ inliers" % int(cfg["min_inliers"]))
        return res
    a = np.array(good)
    static = [p is not None and p[3] < float(cfg["static_speed_pct_s"]) for p in prof]
    res.update(
        measured=True,
        zoom_pct_s=round(float(a[:, 0].mean()), 3),
        shift_x_pct_s=round(float(a[:, 1].mean()), 3),
        shift_y_pct_s=round(float(a[:, 2].mean()), 3),
        speed_pct_s=round(float(a[:, 3].mean()), 3),
        speed_min_pct_s=round(float(a[:, 3].min()), 3),
        static_share=round(float(np.mean(static)), 3),
        longest_static_frames=int(longest_run(static)),
        profile=[None if p is None else [round(float(v), 2) for v in p] for p in prof],
    )
    # cumulative first -> last transform from stride-1 fits, for the evidence drawing only
    cum = np.eye(3)
    for M, _ in pair_transforms(frames, 1, cfg):
        if M is not None:
            cum = np.vstack([M, [0, 0, 1]]) @ cum
    res["_cum"] = cum
    return res


def _plot(prof, wpx, hpx, title):
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (wpx, hpx), (16, 16, 20))
    d = ImageDraw.Draw(im)
    cols = [(255, 200, 60), (90, 200, 255), (120, 255, 140), (255, 255, 255)]
    names = ["zoom %/s", "shift x", "shift y", "speed"]
    vals = [v for p in prof if p for v in p]
    m = max(1.0, max(abs(v) for v in vals)) if vals else 1.0
    y0 = hpx // 2
    d.line([0, y0, wpx, y0], fill=(90, 90, 90))
    d.text((4, 2), "%s   scale +-%.1f %%/s" % (title, m), fill=(230, 230, 230))
    n = max(2, len(prof))
    for k in range(4):
        pts = [(4 + i * (wpx - 8) / (n - 1), y0 - p[k] / m * (hpx / 2 - 16))
               for i, p in enumerate(prof) if p]
        if len(pts) > 1:
            d.line(pts, fill=cols[k], width=2)
        d.text((4 + k * 80, hpx - 13), names[k], fill=cols[k])
    return im


def _evidence_row(frames, res, label):
    from PIL import Image
    h, w = frames[0].shape
    tw, th = 480, int(480 * h / w)
    first = cv2.cvtColor(frames[0], cv2.COLOR_GRAY2RGB)
    if res.get("measured"):
        inv = np.linalg.inv(res["_cum"])
        box = np.array([[0, 0, 1], [w, 0, 1], [w, h, 1], [0, h, 1]], np.float64) @ inv.T
        cv2.polylines(first, [box[:, :2].astype(np.int32).reshape(-1, 1, 2)], True, (255, 60, 60), 3)
    a = C.label(Image.fromarray(first).resize((tw, th)), label + " first; red = view of last frame")
    b = C.label(Image.fromarray(frames[-1]).resize((tw, th)), "last")
    if res.get("measured"):
        t = "z %+.2f  x %+.2f  y %+.2f  speed %.2f  static %d fr" % (
            res["zoom_pct_s"], res["shift_x_pct_s"], res["shift_y_pct_s"], res["speed_pct_s"],
            res["longest_static_frames"])
        c = _plot(res["profile"], tw, th, t)
    else:
        c = C.label(Image.new("RGB", (tw, th), (60, 0, 0)), "UNMEASURED: " + res.get("reason", ""))
    row = Image.new("RGB", (tw * 3 + 8, th), (24, 24, 24))
    for i, im in enumerate((a, b, c)):
        row.paste(im, (i * (tw + 4), 0))
    return row


def _stack(rows):
    from PIL import Image
    if not rows:
        return Image.new("RGB", (320, 60), (40, 0, 0))
    sheet = Image.new("RGB", (rows[0].width, sum(r.height + 4 for r in rows)), (24, 24, 24))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height + 4
    return sheet


def _cmp(name, ours, ref, cfg):
    """Sign and size check of one quantity against the reference."""
    dead = float(cfg["ref_deadband_pct_s"])
    thr = {"abs_pct_s": cfg["ref_abs_tol_pct_s"], "rel": cfg["ref_rel_tol"], "deadband_pct_s": dead}
    m = {"ours": ours, "ref": ref}
    if abs(ref) >= dead and abs(ours) >= dead and (ours > 0) != (ref > 0):
        return C.check(name, C.FAIL, m, thr, "opposite sign")
    if abs(ours - ref) <= float(cfg["ref_abs_tol_pct_s"]) or \
            abs(ours - ref) <= float(cfg["ref_rel_tol"]) * abs(ref):
        return C.check(name, C.PASS, m, thr)
    return C.check(name, C.FAIL, m, thr, "size differs")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip")
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--end", type=int, default=None)
    ap.add_argument("--cuts", default="")
    ap.add_argument("--names", default="")
    ap.add_argument("--ref")
    ap.add_argument("--ref-start", type=int, default=0)
    ap.add_argument("--out")
    a = ap.parse_args()
    need_cv()
    cfg = cfg_section("camera", [
        "size", "stride", "max_features", "feature_quality", "feature_min_dist", "fb_max_px",
        "ransac_px", "min_inliers", "min_measured_share", "static_speed_pct_s", "min_speed_pct_s",
        "max_static_frames", "ref_abs_tol_pct_s", "ref_rel_tol", "ref_deadband_pct_s"])
    try:
        inf = C.info(a.clip)
    except Exception as e:
        print("cannot read %s: %s" % (a.clip, e), file=sys.stderr)
        sys.exit(2)
    end = a.end if a.end is not None else inf["frames"]
    cuts = [int(x) for x in a.cuts.split(",") if x.strip()]
    names = [x for x in a.names.split(",") if x.strip()]
    ranges = shot_ranges(a.start, end, cuts, names)
    size = tuple(cfg["size"])
    out = a.out or C.evidence_dir(a.clip, "camera")
    os.makedirs(out, exist_ok=True)
    clip_sha = C.sha(a.clip)
    fps = inf["fps"]

    res_path = os.path.join(out, "camera.json")
    base = {"mode": "reference" if a.ref else "standalone", "clip": os.path.abspath(a.clip),
            "clip_sha256": clip_sha, "reference": os.path.abspath(a.ref) if a.ref else None,
            "range": [a.start, end], "clip_frames": inf["frames"]}
    ref_res = {}
    ref_rows = {}
    ref_short = {}
    if a.ref:
        rend = a.ref_start + (end - a.start)
        try:
            rinf = C.info(a.ref)
        except Exception as e:
            cannot_measure(TOOL, res_path, "reference", "cannot read reference %s: %s" % (a.ref, e), None, base)
        base["reference_frames"] = rinf["frames"]
        for name, s, e, fr in read_shots(a.ref, a.ref_start, rend, ranges, size):
            if len(fr) < e - s:
                ref_short[name] = "reference has %d of the %d frames of this shot" % (len(fr), e - s)
            elif len(fr) >= 3:
                ref_res[name] = analyse(fr, fps, cfg)
                ref_rows[name] = _evidence_row(fr, ref_res[name], "REF " + name)

    checks, shots, rows = [], [], []
    for name, s, e, fr in read_shots(a.clip, a.start, end, ranges, size):
        if len(fr) < e - s:
            checks.append(C.check(name + ":camera", C.UNMEASURED, {"frames": len(fr), "expected": e - s}, None,
                                  "the clip holds %d of the %d frames of this shot (frames %d-%d asked, clip has %d)"
                                  % (len(fr), e - s, a.start + s, a.start + e, inf["frames"])))
            continue
        if len(fr) < 3:
            checks.append(C.check(name + ":camera", C.UNMEASURED, {"frames": len(fr)}, None,
                                  "shot shorter than 3 frames"))
            continue
        r = analyse(fr, fps, cfg)
        if name in ref_rows:
            rows.append(ref_rows[name])
        rows.append(_evidence_row(fr, r, ("OURS " if a.ref else "") + name))
        pub = {k: v for k, v in r.items() if not k.startswith("_")}
        pub.update(name=name, start=a.start + s, end=a.start + e)
        if a.ref:
            pub["ref"] = {k: v for k, v in ref_res.get(name, {}).items() if not k.startswith("_")}
        shots.append(pub)
        if not r.get("measured"):
            checks.append(C.check(name + ":camera", C.UNMEASURED,
                                  {"measured_share": r.get("measured_share")},
                                  {"min_measured_share": cfg["min_measured_share"]}, r.get("reason")))
            continue
        if a.ref:
            rr = ref_res.get(name)
            if not rr or not rr.get("measured"):
                checks.append(C.check(name + ":reference", C.UNMEASURED, None, None,
                                      ref_short.get(name) or "reference camera could not be measured"))
                continue
            for q in ("zoom_pct_s", "shift_x_pct_s", "shift_y_pct_s"):
                checks.append(_cmp("%s:%s" % (name, q), r[q], rr[q], cfg))
            st = r["speed_pct_s"] < float(cfg["static_speed_pct_s"]) <= rr["speed_pct_s"]
            checks.append(C.check(name + ":static_while_ref_moves", C.FAIL if st else C.PASS,
                                  {"ours": r["speed_pct_s"], "ref": rr["speed_pct_s"]},
                                  {"static_speed_pct_s": cfg["static_speed_pct_s"]}))
        else:
            checks.append(C.check(name + ":camera_moves",
                                  C.PASS if r["speed_pct_s"] >= float(cfg["min_speed_pct_s"]) else C.FAIL,
                                  {"speed_pct_s": r["speed_pct_s"], "zoom_pct_s": r["zoom_pct_s"],
                                   "shift_x_pct_s": r["shift_x_pct_s"], "shift_y_pct_s": r["shift_y_pct_s"]},
                                  {"min_speed_pct_s": cfg["min_speed_pct_s"]}))
            checks.append(C.check(name + ":never_static",
                                  C.PASS if r["longest_static_frames"] <= int(cfg["max_static_frames"])
                                  else C.FAIL,
                                  {"longest_static_frames": r["longest_static_frames"],
                                   "static_share": r["static_share"]},
                                  {"max_static_frames": cfg["max_static_frames"],
                                   "static_speed_pct_s": cfg["static_speed_pct_s"]}))

    ev = os.path.join(out, "camera.jpg")
    if not rows:
        cannot_measure(TOOL, res_path, "camera", "no shot of the asked range %d-%d exists in the clip (%d frames)"
                       % (a.start, end, inf["frames"]), None, dict(base, checks_before=checks))
    code = C.save_evidence(_stack(rows), ev, clip_sha)
    not_checked = [
        "camera rotation (roll) and perspective change: only scale and shift are fitted",
        "parallax between depth layers: the fit follows the dominant layer only",
        "method B of the spec (contract landmarks) is not implemented; low-texture shots end UNMEASURED",
        "easing shape of the move (only mean, minimum and static stretches are judged)",
    ]
    if a.ref:
        not_checked.append("per-frame profile against the reference profile (only shot means are compared)")
    else:
        not_checked.append("whether the move suits the shot: standalone mode only requires that the camera moves")
    rc = C.write_result(res_path, TOOL, checks, not_checked, {
        "mode": "reference" if a.ref else "standalone",
        "clip": os.path.abspath(a.clip), "clip_sha256": clip_sha,
        "reference": os.path.abspath(a.ref) if a.ref else None,
        "range": [a.start, end], "fps": fps, "thresholds": cfg, "shots": shots,
        "evidence": [{"path": ev, "code": code}],
    })
    C.print_summary(TOOL, checks, not_checked, res_path, [ev])
    sys.exit(rc)


if __name__ == "__main__":
    main()
