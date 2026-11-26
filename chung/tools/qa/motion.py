"""motion.py - gate G3: per-element motion AFTER the camera move is removed (package Q2).

Needs OpenCV, which is not installed system-wide. Run from rover-lab/ as:

  UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" \
  uv run --no-project --with opencv-python-headless --with numpy --with pillow \
  python tools/qa/motion.py CLIP --element NAME:KIND:w:h:x:y [...]

STANDALONE mode (no reference; the default). Every declared element has a KIND
and the measured behaviour is checked against what that kind implies (bounds
per kind in qa.json -> motion.element.kinds):
  rotates  walks  twinkles  flickers  sways  drifts  acts  static
  motion.py out/shot-earth.mp4 --element globe:rotates:500:500:390:110
  motion.py out/full.mp4 --start 313 --end 332 --element zebra:walks:200:160:300:380

REFERENCE mode (--ref): the same crop of the reference is measured too and
amount, energy ratio, direction, onsets and period are compared.
  motion.py out/shot-earth.mp4 --ref ../ref/rover_doom.webm --ref-start 0 \
      --element globe:rotates:500:500:390:110

Element syntax:
  NAME:KIND:w:h:x:y           crop rectangle in source pixels
  NAME:KIND:matte=PATH        matte video (white = element), same frames as the range
  --elements FILE.json        list of {"name","kind","crop" or "matte","ref_crop"}
Options:
  --start N / --end N   frame range in CLIP, ONE shot (end exclusive)
  --ref PATH --ref-start N
  --static-crop w:h:x:y  region known to hold nothing that moves: noise floor is taken there
  --out DIR             default qa/<clip stem>/motion

Method, per frame pair (n, n+stride): fit the camera (camera.fit_pair), warp
frame n+stride onto frame n, take the absolute difference of the blurred
frames with a tolerance of tol_px pixels of misregistration (soft edges that
are off by a fraction of a pixel do not count; brightness changes do). Inside the element:
  activity         share of pairs with at least min_active_px pixels (and min_active_share of the
                   region) above the noise floor
  energy           mean residual (grey levels) over the region
  direction        of the median optical flow of the active pixels (0 = right, 90 = up)
  coherence        |sum of flow vectors| / sum of |flow|  (1 = one steady direction)
  speed_pct_s      mean median flow, percent of frame width per second
  internal_ratio   residual that survives after ALSO removing the element's own
                   translation, divided by the residual before. Near 0 = the element
                   only slides as one rigid picture ("slides instead of walking").
                   The translation removed is the best of an exhaustive search (+-rigid_search_px,
                   quarter pixel) and the median optical flow. A RATIO says nothing when the
                   energy itself is tiny, so "walks" also has absolute floors:
  internal_energy  mean internal residual (grey levels) over the region
  internal_spread  share of the cells of an internal_grid over the crop that hold internal
                   motion on at least internal_cell_min_share of the pairs (an edge strip or one
                   corner is a small share; limbs across the element are a large one)
  internal_activity  share of pairs whose internal residual is above the floor
  in_place_ratio   travel of the active area's centre / summed flow. Near 0 = motion
                   stays in place (a turning globe); near 1 = the whole thing travels.
  onsets           frames where activity starts after onset_gap quiet pairs
  onsets_robust    the same with a Schmitt trigger (onset_margin): only these reference onsets
                   are demanded in --ref mode, ours only has to turn active within the tolerance,
                   and onset_max_miss_share of them may be missed (rounded down)
  direction (--ref) judged only when the reference coherence clears direction_ref_min_coherence,
                   which is stricter than the bound for ours; otherwise listed as not checked
  period           first autocorrelation peak of the energy curve, UNMEASURED when the
                   range holds under 2 cycles; on a shot shorter than period_min_frames the period
                   is not a check at all (listed under "not checked"), so short shots can pass

A range that is not fully inside the clip, a reference that is missing or too short, or a
decode that returns fewer frames than asked: exit 2 with a result JSON, never a partial measure.

Output: <out>/motion.json and <out>/motion-<element>.jpg (8 consecutive crops at
3 points, the residual of each pair, and the energy curve). Exit code 0 = pass,
1 = fail, 2 = could not measure.
"""
import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import camera as K  # noqa: E402

cv2 = K.cv2
TOOL = "motion"
KINDS = ("rotates", "walks", "twinkles", "flickers", "sways", "drifts", "acts", "static")
METRICS = ("activity", "energy", "coherence", "speed_pct_s", "internal_ratio", "internal_activity",
           "internal_energy", "internal_spread", "in_place_ratio")
_K3 = np.ones((3, 3), np.uint8)


# ------------------------------------------------------------------ shared core
def blur(img, sigma):
    return cv2.GaussianBlur(img, (0, 0), float(sigma)) if sigma and sigma > 0 else img


def compensated(a, b, tol):
    """Difference that tolerates about `tol` pixels of misregistration but keeps brightness changes.

    Each pixel of a is compared with the interval [b - tol*(b - min3x3 b), b + tol*(max3x3 b - b)]
    (and b with the interval of a); the larger of the two distances is returned. A soft edge that is
    off by a fraction of a pixel falls inside the interval; a star that changes brightness does not.
    """
    af, bf = a.astype(np.float32), b.astype(np.float32)
    t = float(tol)

    def dist(x, y, y8):
        lo = y - t * (y - cv2.erode(y8, _K3))
        hi = y + t * (cv2.dilate(y8, _K3) - y)
        return np.maximum(0.0, np.maximum(x - hi, lo - x))
    return np.maximum(dist(af, bf, b), dist(bf, af, a))


def residual(prev, cur, M, cfg):
    """Camera-compensated difference. Returns (d, valid mask, prev blurred, cur warped+blurred)."""
    h, w = prev.shape
    pb, cb = blur(prev, cfg["blur_sigma"]), blur(cur, cfg["blur_sigma"])
    if M is None:
        M = np.array([[1, 0, 0], [0, 1, 0]], np.float64)
    fl = cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP
    cw = cv2.warpAffine(cb, M, (w, h), flags=fl, borderMode=cv2.BORDER_REPLICATE)
    valid = cv2.warpAffine(np.full((h, w), 255, np.uint8), M, (w, h), flags=fl, borderValue=0) > 250
    b = int(cfg["border_px"])
    valid[:b], valid[-b:], valid[:, :b], valid[:, -b:] = False, False, False, False
    return compensated(pb, cw, cfg["tol_px"]), valid, pb, cw


def own_translation(pb, cw, act):
    """Median Farneback flow (dx, dy) of the active pixels: the region's own rigid shift."""
    flow = cv2.calcOpticalFlowFarneback(pb, cw, None, 0.5, 3, 15, 3, 5, 1.1, 0)
    v = flow[act]
    if len(v) == 0:
        return 0.0, 0.0
    return float(np.median(v[:, 0])), float(np.median(v[:, 1]))


def internal_residual(pb, cw, d, v, tol):
    """Residual explained by NEITHER the camera NOR the rigid shift v of the region."""
    h, w = pb.shape
    T = np.array([[1, 0, v[0]], [0, 1, v[1]]], np.float64)
    sh = cv2.warpAffine(cw, T, (w, h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                        borderMode=cv2.BORDER_REPLICATE)
    return np.minimum(d, compensated(pb, sh, tol))


def best_rigid_shift(pb, cw, act, radius):
    """Shift (dx, dy) of cw that leaves the smallest difference from pb on the active pixels.

    Exhaustive whole-pixel search within +-radius, then half- and quarter-pixel refinement. Unlike the
    median optical flow this is, by construction, the translation that explains most of the residual:
    a picture that only slides is left with (nearly) nothing.
    """
    h, w = pb.shape
    mask = cv2.dilate(act.astype(np.uint8), np.ones((5, 5), np.uint8))
    fl = cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP

    def cost(vx, vy):
        T = np.array([[1, 0, vx], [0, 1, vy]], np.float64)
        sh = cv2.warpAffine(cw, T, (w, h), flags=fl, borderMode=cv2.BORDER_REPLICATE)
        return cv2.mean(cv2.absdiff(pb, sh), mask=mask)[0]
    r = int(radius)
    best = min(((cost(x, y), x, y) for y in range(-r, r + 1) for x in range(-r, r + 1)))
    for step in (0.5, 0.25):
        c0, x0, y0 = best
        for dy in (-step, 0, step):
            for dx in (-step, 0, step):
                if dx or dy:
                    best = min(best, (cost(x0 + dx, y0 + dy), x0 + dx, y0 + dy))
    return float(best[1]), float(best[2])


def frame_noise(d, valid, grid=(8, 6)):
    """Noise of one residual map: mean 99th percentile of the quietest quarter of grid cells."""
    h, w = d.shape
    vals = []
    for r in range(grid[1]):
        for c in range(grid[0]):
            ys, xs = slice(r * h // grid[1], (r + 1) * h // grid[1]), slice(c * w // grid[0], (c + 1) * w // grid[0])
            m = valid[ys, xs]
            if m.sum() > 50:
                vals.append(float(np.percentile(d[ys, xs][m], 99)))
    if not vals:
        return 0.0
    vals.sort()
    return float(np.mean(vals[:max(1, len(vals) // 4)]))


def onsets(active, gap):
    out = []
    for i, a in enumerate(active):
        if a and not any(active[max(0, i - gap):i]):
            out.append(i)
    return out


def robust_onsets(act_n, needs, gap, margin):
    """Onsets that survive re-encoding: a Schmitt trigger on the active-pixel count.

    The state turns ACTIVE at need*margin and QUIET below need/margin; counts in between keep the state.
    An onset is a turn to ACTIVE after at least `gap` quiet pairs (or at the start of the range).
    A count that merely grazes the activity threshold produces no onset.
    """
    out, quiet = [], None  # quiet = pairs spent quiet; None = since the start of the range
    state_active = False
    for i, (n_, k_) in enumerate(zip(act_n, needs)):
        if not state_active:
            if n_ >= k_ * margin:
                if quiet is None or quiet >= gap:
                    out.append(i)
                state_active = True
            elif quiet is not None:
                quiet += 1
        elif n_ < k_ / margin:
            state_active, quiet = False, 1
    return out


def has_rise(active, t, tol, gap):
    """True when the curve turns active within tol pairs of t after a quiet pair (or at the range start)."""
    for u in range(max(0, t - tol), min(len(active), t + tol + 1)):
        if active[u] and (u - gap <= 0 or not all(active[max(0, u - gap):u])):
            return True
    return False


def period(curve, cfg):
    """(period in frames or None, reason). First autocorrelation peak after the first dip."""
    x = np.asarray(curve, np.float64)
    n = len(x)
    if n < int(cfg["period_min_frames"]):
        return None, "range shorter than %d frames" % int(cfg["period_min_frames"])
    x = x - x.mean()
    den = float((x * x).sum())
    if den <= 1e-9:
        return None, "flat energy curve"
    ac = np.array([float((x[:n - k] * x[k:]).sum()) / den for k in range(n // 2 + 1)])
    dipped = False
    for k in range(2, len(ac) - 1):
        if ac[k] < 0:
            dipped = True
        if dipped and ac[k] >= float(cfg["period_min_corr"]) and ac[k] >= ac[k - 1] and ac[k] >= ac[k + 1]:
            return k, "autocorrelation %.2f" % ac[k]
    return None, "no repeating peak within half the range (under 2 cycles or not periodic)"


# ------------------------------------------------------------------ element measurement
def region_masks(el, n, shape, src_size, clip, start, end):
    """Per-frame boolean masks of the element at analysis size, and the bbox (x0, y0, x1, y1)."""
    h, w = shape
    sx, sy = w / float(src_size[0]), h / float(src_size[1])
    if el.get("matte"):
        ms = [m > 128 for _, m in C.frames(el["matte"], el.get("matte_start", 0),
                                          el.get("matte_start", 0) + n, size=(w, h), grey=True)]
        if len(ms) < n:
            raise RuntimeError("matte %s has %d frames, need %d" % (el["matte"], len(ms), n))
        allm = np.any(ms, axis=0)
        ys, xs = np.where(allm)
        if len(xs) == 0:
            raise RuntimeError("matte %s is empty" % el["matte"])
        return ms, (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    cw_, ch_, cx, cy = C.parse_crop(el["crop"])
    x0, y0 = max(0, int(round(cx * sx))), max(0, int(round(cy * sy)))
    x1, y1 = min(w, int(round((cx + cw_) * sx))), min(h, int(round((cy + ch_) * sy)))
    if x1 - x0 < 8 or y1 - y0 < 8:
        raise RuntimeError("crop %s is outside the frame or too small" % (el["crop"],))
    m = np.zeros((h, w), bool)
    m[y0:y1, x0:x1] = True
    return [m] * n, (x0, y0, x1, y1)


def measure(frames, fits, masks, bbox, cfg, fps, src_w, pix_thr):
    """Motion numbers of one element over one shot. `fits` = camera.pair_transforms(frames, stride)."""
    stride = int(cfg["stride"])
    h, w = frames[0].shape
    pad = int(cfg["flow_pad_px"])
    X0, Y0 = max(0, bbox[0] - pad), max(0, bbox[1] - pad)
    X1, Y1 = min(w, bbox[2] + pad), min(h, bbox[3] + pad)
    E, EI, act_n, int_n, vs, cents, resid_maps, needs, rigid = [], [], [], [], [], [], [], [], []
    gx, gy = [int(v) for v in cfg["internal_grid"]]
    bx0, by0, bx1, by1 = bbox[0] - X0, bbox[1] - Y0, bbox[2] - X0, bbox[3] - Y0
    cell_hits = np.zeros((gy, gx), np.int64)
    cam_missing = 0
    for i, (M, _) in enumerate(fits):
        if M is None:
            cam_missing += 1
        d, valid, pb, cw = residual(frames[i], frames[i + stride], M, cfg)
        reg = (masks[i] | masks[i + stride]) & valid
        sub = (slice(Y0, Y1), slice(X0, X1))
        dS, rS = d[sub], reg[sub]
        area = max(1, int(rS.sum()))
        act = (dS > pix_thr) & rS
        na = int(act.sum())
        need = max(int(cfg["min_active_px"]), int(round(float(cfg["min_active_share"]) * area)))
        needs.append(need)
        E.append(float(dS[rS].sum()) / area)
        act_n.append(na)
        resid_maps.append(dS * rS)
        if na >= need:
            v = own_translation(pb[sub], cw[sub], act)
            vr = best_rigid_shift(pb[sub], cw[sub], act, cfg["rigid_search_px"])
            di = internal_residual(pb[sub], cw[sub], dS, vr, cfg["tol_px"])
            di = np.minimum(di, internal_residual(pb[sub], cw[sub], dS, v, cfg["tol_px"]))
            ia = (di > pix_thr) & act
            EI.append(float(di[rS].sum()) / area)
            int_n.append(int(ia.sum()))
            rigid.append(vr)
            for r_ in range(gy):
                for c_ in range(gx):
                    cell = ia[by0 + r_ * (by1 - by0) // gy:by0 + (r_ + 1) * (by1 - by0) // gy,
                              bx0 + c_ * (bx1 - bx0) // gx:bx0 + (c_ + 1) * (bx1 - bx0) // gx]
                    if int(cell.sum()) >= int(cfg["min_active_px"]):
                        cell_hits[r_, c_] += 1
            vs.append(v)
            ys, xs = np.where(act)
            cents.append((float(xs.mean()), float(ys.mean())))
        else:
            EI.append(0.0)
            int_n.append(0)
            vs.append(None)
            cents.append(None)
    npair = len(E)
    active = [n_ >= k_ for n_, k_ in zip(act_n, needs)]
    v_ok = np.array([v for v in vs if v is not None], np.float64).reshape(-1, 2)
    sum_mag = float(np.linalg.norm(v_ok, axis=1).sum()) if len(v_ok) else 0.0
    net = v_ok.sum(axis=0) if len(v_ok) else np.zeros(2)
    scale = src_w / float(w)  # report in source pixels / percent of source width
    cs = [c for c in cents if c is not None]
    q = max(1, len(cs) // 4)
    travel = float(np.hypot(*(np.mean(cs[-q:], axis=0) - np.mean(cs[:q], axis=0)))) if len(cs) >= 4 else None
    per, per_note = period(E, cfg)
    esum = float(np.sum([e for e, a_ in zip(E, active) if a_]))
    cells_on = cell_hits >= max(1.0, float(cfg["internal_cell_min_share"]) * npair)
    res = {
        "pairs": npair, "stride": stride, "camera_fit_missing_pairs": cam_missing,
        "pix_thr": round(float(pix_thr), 2),
        "activity": round(float(np.mean(active)), 3) if npair else 0.0,
        "energy": round(float(np.mean(E)), 4) if npair else 0.0,
        "internal_activity": round(float(np.mean([n_ >= k_ for n_, k_ in zip(int_n, needs)])), 3)
        if npair else 0.0,
        "internal_ratio": round(float(np.sum([e for e, a_ in zip(EI, active) if a_])) / esum, 3)
        if esum > 1e-9 else None,
        "internal_energy": round(float(np.mean(EI)), 4) if npair else 0.0,
        "internal_spread": round(float(cells_on.mean()), 3),
        "internal_cells": [int(cells_on.sum()), int(cells_on.size)],
        "internal_cell_map": ["".join("#" if x else "." for x in row) for row in cells_on],
        "rigid_shift_px_mean": [round(float(np.mean([r_[0] for r_ in rigid])) * scale, 2),
                                round(float(np.mean([r_[1] for r_ in rigid])) * scale, 2)] if rigid else None,
        "coherence": round(float(np.hypot(*net)) / sum_mag, 3) if sum_mag > 1e-6 else None,
        "direction_deg": round(float(np.degrees(np.arctan2(-net[1], net[0]))) % 360, 1)
        if sum_mag > 1e-6 else None,
        "speed_pct_s": round(sum_mag / max(1, npair) / stride * fps / w * 100.0, 3),
        "net_shift_px": [round(float(net[0]) * scale, 1), round(float(net[1]) * scale, 1)],
        "in_place_ratio": round(travel / max(1e-6, float(np.hypot(*net))), 3)
        if travel is not None and float(np.hypot(*net)) > float(cfg["min_net_shift_px"]) else None,
        "onsets": onsets(active, int(cfg["onset_gap"])),
        "onsets_robust": robust_onsets(act_n, needs, int(cfg["onset_gap"]), float(cfg["onset_margin"])),
        "active_curve": [bool(a_) for a_ in active],
        "period_frames": per * stride if per else None, "period_note": per_note,
        "energy_curve": [round(e, 3) for e in E],
        "internal_curve": [round(e, 3) for e in EI],
        "active_px_curve": act_n, "active_px_needed": int(np.median(needs)) if needs else None,
    }
    res["_resid"] = resid_maps
    res["_sub"] = (X0, Y0, X1, Y1)
    return res


def kind_checks(name, kind, m, cfg):
    """Standalone: bounds per kind from qa.json -> motion.element.kinds[kind] = {metric: [min, max]}."""
    rules = cfg["kinds"].get(kind)
    if rules is None:
        return [C.check("%s:%s" % (name, kind), C.UNMEASURED, None, None, "no bounds for this kind in qa.json")]
    out = []
    if m["camera_fit_missing_pairs"] > m["pairs"] * float(cfg["max_camera_missing_share"]):
        return [C.check("%s:%s" % (name, kind), C.UNMEASURED,
                        {"camera_fit_missing_pairs": m["camera_fit_missing_pairs"], "pairs": m["pairs"]},
                        {"max_camera_missing_share": cfg["max_camera_missing_share"]},
                        "camera could not be removed on too many pairs")]
    for metric, (lo, hi) in rules.items():
        if metric not in METRICS:
            continue
        v = m.get(metric)
        cname = "%s:%s:%s" % (name, kind, metric)
        thr = {"min": lo, "max": hi}
        if v is None:
            if kind != "static" and m["activity"] < float(cfg["kinds"][kind].get("activity", [0, None])[0] or 0):
                continue  # the activity check already fails; this one has nothing to measure
            out.append(C.check(cname, C.UNMEASURED, None, thr, "not measurable (too little motion)"))
        elif (lo is not None and v < lo) or (hi is not None and v > hi):
            out.append(C.check(cname, C.FAIL, v, thr, cfg.get("fail_notes", {}).get("%s.%s" % (kind, metric))))
        else:
            out.append(C.check(cname, C.PASS, v, thr))
    return out


def ref_checks(name, o, r, cfg, skipped):
    """Reference-mode checks; reasons for checks that could not apply are appended to `skipped`."""
    out = []
    rc = cfg["reference"]
    m = {"ours": o["activity"], "ref": r["activity"]}
    thr = {"ref_above": rc["activity_ref_min"], "ours_min": rc["activity_ours_min"]}
    if r["activity"] > float(rc["activity_ref_min"]):
        out.append(C.check(name + ":activity", C.PASS if o["activity"] > float(rc["activity_ours_min"]) else C.FAIL,
                           m, thr, None if o["activity"] > float(rc["activity_ours_min"])
                           else "reference element moves, ours is (nearly) still"))
    elif r["activity"] < float(rc["activity_static_max"]) and o["activity"] > float(rc["activity_ref_min"]):
        out.append(C.check(name + ":activity", C.FAIL, m, thr, "reference element is still, ours moves"))
    else:
        out.append(C.check(name + ":activity", C.PASS, m, thr))
    if r["energy"] > float(rc["energy_min"]):
        ratio = o["energy"] / r["energy"]
        ok = float(rc["energy_ratio"][0]) <= ratio <= float(rc["energy_ratio"][1])
        out.append(C.check(name + ":energy_ratio", C.PASS if ok else C.FAIL, round(ratio, 3),
                           {"range": rc["energy_ratio"]}))
    else:
        out.append(C.check(name + ":energy_ratio", C.UNMEASURED, {"ref_energy": r["energy"]},
                           {"energy_min": rc["energy_min"]}, "reference energy at the noise floor"))
    # direction: demanded only when the reference direction is clearly steady (ref bounds are stricter
    # than ours bounds, so a value that sits on a bound cannot flip the verdict after re-encoding)
    cmin, smin = float(rc["direction_min_coherence"]), float(rc["direction_min_speed_pct_s"])
    rcmin, rsmin = float(rc["direction_ref_min_coherence"]), float(rc["direction_ref_min_speed_pct_s"])
    dthr = {"ref_min_coherence": rcmin, "ref_min_speed_pct_s": rsmin, "ours_min_coherence": cmin,
            "ours_min_speed_pct_s": smin, "max_deg": rc["direction_max_deg"]}
    dm = {"ours_deg": o["direction_deg"], "ref_deg": r["direction_deg"], "ours_coherence": o["coherence"],
          "ref_coherence": r["coherence"], "ours_speed_pct_s": o["speed_pct_s"], "ref_speed_pct_s": r["speed_pct_s"]}
    if r["coherence"] is not None and r["coherence"] >= rcmin and r["speed_pct_s"] >= rsmin:
        if o["coherence"] is not None and o["coherence"] >= cmin and o["speed_pct_s"] >= smin:
            dd = abs((o["direction_deg"] - r["direction_deg"] + 180) % 360 - 180)
            dm["diff"] = round(dd, 1)
            out.append(C.check(name + ":direction", C.PASS if dd <= float(rc["direction_max_deg"]) else C.FAIL,
                               dm, dthr))
        else:
            out.append(C.check(name + ":direction", C.FAIL, dm, dthr,
                               "reference has a steady direction, ours has none"))
    else:
        skipped.append("%s: direction not judged (reference motion has no clearly steady direction: coherence %s, "
                       "speed %s %%/s; needs %s and %s)" % (name, r["coherence"], r["speed_pct_s"], rcmin, rsmin))
    # onsets: only reference onsets that clear the activity threshold with a margin are demanded
    ron = r["onsets_robust"]
    if ron and len(ron) <= int(rc["onset_max_count"]):
        tol, gap = int(rc["onset_tol_frames"]), int(cfg["onset_gap"])
        miss = [t for t in ron if not has_rise(o["active_curve"], t, tol, gap)]
        allowed = int(np.floor(float(rc["onset_max_miss_share"]) * len(ron)))
        out.append(C.check(name + ":onsets", C.FAIL if len(miss) > allowed else C.PASS,
                           {"ref_robust": ron, "ours": o["onsets"], "ours_robust": o["onsets_robust"],
                            "ref_onsets_without_ours": miss},
                           {"tol_frames": tol, "onset_margin": cfg["onset_margin"],
                            "max_miss_share": rc["onset_max_miss_share"], "misses_allowed": allowed}))
    else:
        skipped.append("%s: onsets not judged (%s)" % (name, "reference has no clear onset" if not ron else
                       "reference has %d onsets, more than onset_max_count" % len(ron)))
    pmin = int(cfg["period_min_frames"])
    if r["pairs"] < pmin or o["pairs"] < pmin:
        skipped.append("%s: period not judged (range of %d frame pairs is shorter than period_min_frames %d: "
                       "a period cannot be measured on a shot this short)" % (name, min(r["pairs"], o["pairs"]), pmin))
    elif r["period_frames"] and o["period_frames"]:
        rel = abs(o["period_frames"] - r["period_frames"]) / float(r["period_frames"])
        out.append(C.check(name + ":period", C.PASS if rel <= float(rc["period_rel_tol"]) else C.FAIL,
                           {"ours": o["period_frames"], "ref": r["period_frames"]},
                           {"rel_tol": rc["period_rel_tol"]}))
    elif r["period_frames"]:
        out.append(C.check(name + ":period", C.UNMEASURED,
                           {"ours": o["period_frames"], "ref": r["period_frames"]}, None,
                           "ours: %s; ref: %s" % (o["period_note"], r["period_note"])))
    else:
        skipped.append("%s: period not judged (reference: %s)" % (name, r["period_note"]))
    return out


# ------------------------------------------------------------------ evidence
def _curve_img(m, wpx, hpx, title, min_px):
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (wpx, hpx), (16, 16, 20))
    d = ImageDraw.Draw(im)
    E, EI = m["energy_curve"], m["internal_curve"]
    top = max(1e-3, max(E) if E else 1e-3)
    n = max(2, len(E))
    X = lambda i: 4 + i * (wpx - 8) / (n - 1)  # noqa: E731
    Y = lambda v: hpx - 16 - v / top * (hpx - 36)  # noqa: E731
    for i, npx in enumerate(m["active_px_curve"]):
        if npx >= min_px:
            d.line([X(i), hpx - 14, X(i), hpx - 8], fill=(80, 220, 120), width=2)
    for t in m["onsets"]:
        d.line([X(t), 18, X(t), hpx - 16], fill=(120, 120, 255))
    if len(E) > 1:
        d.line([(X(i), Y(v)) for i, v in enumerate(E)], fill=(255, 200, 60), width=2)
        d.line([(X(i), Y(v)) for i, v in enumerate(EI)], fill=(255, 90, 90), width=2)
    d.text((4, 2), "%s  yellow=energy red=internal green=active blue=onset  top=%.2f" % (title, top),
           fill=(230, 230, 230))
    return im


def _strip(frames, m, stride, label):
    """8 consecutive crops at 3 points (start, strongest pair, end) with the residual under each."""
    from PIL import Image
    X0, Y0, X1, Y1 = m["_sub"]
    n = len(frames)
    E = m["energy_curve"]
    peak = int(np.argmax(E)) if E else 0
    starts = sorted(set(max(0, min(n - 8, s)) for s in (0, peak - 3, n - 8)))
    cw_, ch_ = X1 - X0, Y1 - Y0
    sc = min(1.0, 300.0 / cw_, 300.0 / ch_)
    tw, th = max(16, int(cw_ * sc)), max(16, int(ch_ * sc))
    rows = []
    for s in starts:
        row = Image.new("RGB", (8 * (tw + 2), 2 * th + 2), (24, 24, 24))
        for j in range(8):
            f = s + j
            if f >= n:
                break
            im = Image.fromarray(frames[f][Y0:Y1, X0:X1]).resize((tw, th))
            row.paste(C.label(im, "%s f%d" % (label, f)) if j == 0 else C.label(im, "f%d" % f), (j * (tw + 2), 0))
            if f < len(m["_resid"]):
                r = np.clip(m["_resid"][f] * 8.0, 0, 255).astype(np.uint8)
                row.paste(Image.fromarray(r).resize((tw, th)).convert("RGB"), (j * (tw + 2), th + 2))
        rows.append(row)
    rows.append(_curve_img(m, rows[0].width, 150, label, m["active_px_needed"] or 1))
    return K._stack(rows)


# ------------------------------------------------------------------ main
def parse_elements(a):
    els = []
    for s in a.element or []:
        p = s.split(":", 2)
        if len(p) < 3:
            raise SystemExit("bad --element %r (NAME:KIND:w:h:x:y or NAME:KIND:matte=PATH)" % s)
        e = {"name": p[0], "kind": p[1]}
        if p[2].startswith("matte="):
            e["matte"] = p[2][6:]
        else:
            e["crop"] = p[2]
        els.append(e)
    if a.elements:
        with open(a.elements, "r", encoding="utf8") as f:
            els += json.load(f)
    for e in els:
        if e.get("kind") not in KINDS:
            raise SystemExit("element %s: kind must be one of %s" % (e.get("name"), ", ".join(KINDS)))
        if not e.get("crop") and not e.get("matte"):
            raise SystemExit("element %s needs a crop or a matte" % e.get("name"))
    return els


def load_shot(path, start, end, size):
    return [f for _, f in C.frames(path, start, end, size=size, grey=True)]


def clip_noise(frames, fits, cfg, static_mask=None):
    """Noise floor of a shot: median over pairs of frame_noise (or of p99 in the static crop)."""
    vals = []
    stride = int(cfg["stride"])
    for i, (M, _) in enumerate(fits):
        d, valid, _, _ = residual(frames[i], frames[i + stride], M, cfg)
        if static_mask is not None:
            mm = static_mask & valid
            vals.append(float(np.percentile(d[mm], 99)) if mm.sum() > 50 else 0.0)
        else:
            vals.append(frame_noise(d, valid))
    return float(np.median(vals)) if vals else 0.0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip")
    ap.add_argument("--element", action="append")
    ap.add_argument("--elements")
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--end", type=int, default=None)
    ap.add_argument("--ref")
    ap.add_argument("--ref-start", type=int, default=0)
    ap.add_argument("--static-crop")
    ap.add_argument("--out")
    a = ap.parse_args()
    K.need_cv()
    cfg = K.cfg_section("element", [
        "size", "stride", "blur_sigma", "tol_px", "border_px", "pix_thr", "noise_k", "min_active_px", "min_active_share",
        "flow_pad_px", "min_net_shift_px", "onset_gap", "period_min_frames", "period_min_corr",
        "max_camera_missing_share", "onset_margin", "rigid_search_px", "internal_grid", "internal_cell_min_share",
        "kinds", "reference"])
    cam = K.cfg_section("camera", ["max_features", "feature_quality", "feature_min_dist", "fb_max_px",
                                   "ransac_px", "min_inliers"])
    els = parse_elements(a)
    if not els:
        print("no elements declared (--element or --elements)", file=sys.stderr)
        sys.exit(2)
    try:
        inf = C.info(a.clip)
    except Exception as e:
        print("cannot read %s: %s" % (a.clip, e), file=sys.stderr)
        sys.exit(2)
    end = a.end if a.end is not None else inf["frames"]
    size = tuple(cfg["size"])
    stride = int(cfg["stride"])
    out = a.out or C.evidence_dir(a.clip, "motion")
    os.makedirs(out, exist_ok=True)
    clip_sha = C.sha(a.clip)
    base = {"mode": "reference" if a.ref else "standalone", "clip": os.path.abspath(a.clip),
            "clip_sha256": clip_sha, "reference": os.path.abspath(a.ref) if a.ref else None,
            "range": [a.start, end]}
    res_path = os.path.join(out, "motion.json")
    if a.start < 0 or end <= a.start or end > inf["frames"]:
        K.cannot_measure(TOOL, res_path, "range", "frames %d-%d asked, the clip has %d frames: the range is "
                         "not measured on a part of it" % (a.start, end, inf["frames"]),
                         {"asked": [a.start, end], "clip_frames": inf["frames"]}, base)
    ri = None
    if a.ref:
        try:
            ri = C.info(a.ref)
        except Exception as e:
            K.cannot_measure(TOOL, res_path, "reference", "cannot read reference %s: %s" % (a.ref, e), None, base)
        if a.ref_start < 0 or a.ref_start + (end - a.start) > ri["frames"]:
            K.cannot_measure(TOOL, res_path, "reference", "reference frames %d-%d needed, it has %d frames"
                             % (a.ref_start, a.ref_start + end - a.start, ri["frames"]),
                             {"needed": [a.ref_start, a.ref_start + end - a.start],
                              "reference_frames": ri["frames"]}, base)
    src = (inf["width"], inf["height"])

    def run_side(path, start, n_frames, src_size, crop_key):
        frames = load_shot(path, start, start + n_frames, size)
        if len(frames) != n_frames:
            raise RuntimeError("%s: %d frames decoded for the range %d-%d, %d expected"
                               % (path, len(frames), start, start + n_frames, n_frames))
        if len(frames) < stride + 2:
            return None, None
        fits = K.pair_transforms(frames, stride, cam)
        smask = None
        if a.static_crop:
            smask = region_masks({"crop": a.static_crop}, 1, frames[0].shape, src_size, path, 0, 0)[0][0]
        noise = clip_noise(frames, fits, cfg, smask)
        thr = max(float(cfg["pix_thr"]), float(cfg["noise_k"]) * noise)
        res = {}
        for e in els:
            ee = dict(e)
            if crop_key == "ref_crop":
                if e.get("ref_matte"):
                    ee = {"matte": e["ref_matte"]}
                else:
                    ee = {"crop": e.get("ref_crop") or e.get("crop")}
                    if not ee["crop"]:
                        res[e["name"]] = None
                        continue
            masks, bbox = region_masks(ee, len(frames), frames[0].shape, src_size, path, start, start + n_frames)
            res[e["name"]] = measure(frames, fits, masks, bbox, cfg, inf["fps"], src_size[0], thr)
            res[e["name"]]["noise"] = round(noise, 3)
        return frames, res

    try:
        frames, ours = run_side(a.clip, a.start, end - a.start, src, "crop")
        rframes = refm = None
        if a.ref:
            rframes, refm = run_side(a.ref, a.ref_start, end - a.start, (ri["width"], ri["height"]), "ref_crop")
    except (RuntimeError, OSError) as e:
        K.cannot_measure(TOOL, res_path, "decode", "could not measure: %s" % e, None, base)
    if frames is None or (a.ref and rframes is None):
        K.cannot_measure(TOOL, res_path, "range", "range too short to measure", None, base)

    checks, report, evid, skipped = [], [], [], []
    for e in els:
        nm, kind = e["name"], e["kind"]
        o = ours[nm]
        rows = []
        entry = {"name": nm, "kind": kind, "crop": e.get("crop"), "matte": e.get("matte"),
                 "ours": {k: v for k, v in o.items() if not k.startswith("_")}}
        if a.ref and refm.get(nm) is not None:
            r = refm[nm]
            entry["ref"] = {k: v for k, v in r.items() if not k.startswith("_")}
            checks += ref_checks(nm, o, r, cfg, skipped)
            rows.append(_strip(rframes, r, stride, "REF " + nm))
        elif a.ref:
            checks.append(C.check(nm + ":reference", C.UNMEASURED, None, None,
                                  "no reference crop for this element (matte-only element needs ref_crop)"))
        if not a.ref:
            checks += kind_checks(nm, kind, o, cfg)
        rows.append(_strip(frames, o, stride, ("OURS " if a.ref else "") + nm))
        ev = os.path.join(out, "motion-%s.jpg" % nm)
        code = C.save_evidence(K._stack(rows), ev, clip_sha)
        entry["evidence"] = {"path": ev, "code": code}
        evid.append(ev)
        report.append(entry)

    not_checked = [
        "onsets against contract beats (no shot.yaml contract is read; onsets are only reported%s)"
        % (" and compared with the reference" if a.ref else ""),
        "solo/matte render passes do not exist yet: with a crop, anything else inside the rectangle "
        "(dust, a neighbour, parallax of a nearer layer) counts as the element",
        "identical encoding of both clips (normalize.py): codec noise differs between a webm and an mp4, "
        "so energy is only comparable after normalisation",
        "whether the motion looks right (a walk that reads as a walk): only amount, direction, rigidity and rhythm",
    ]
    not_checked += skipped
    if not a.ref:
        not_checked.append("walks floors (energy, internal_energy, internal_spread) are in grey levels and grid "
                           "cells of the crop: calibrated on the 4 walking groups of ONE reference shot; a crop "
                           "that also holds other live content (a neighbour, a revealed strip) gains from it")
        not_checked.append("period is reported, not judged, in standalone mode")
    rc = C.write_result(res_path, TOOL, checks, not_checked, {
        "mode": "reference" if a.ref else "standalone",
        "clip": os.path.abspath(a.clip), "clip_sha256": clip_sha,
        "reference": os.path.abspath(a.ref) if a.ref else None,
        "range": [a.start, end], "fps": inf["fps"],
        "thresholds": {"element": cfg, "camera_fit": cam}, "elements": report,
    })
    C.print_summary(TOOL, checks, not_checked, res_path, evid)
    sys.exit(rc)


if __name__ == "__main__":
    main()
