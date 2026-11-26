#!/usr/bin/env python3
"""density.py - fine-detail density of a shot (gate G6, package Q3 "look").

Measures, on frames scaled to the working size (qa.json look.density.size):
  blobs    small bright blobs (stars, sparkles, lit windows): peaks of a white
           top-hat (grey minus its opening) above `tophat_thr`
  edges    share of pixels whose Sobel gradient is above `edge_thr`
  tones    number of distinct colours (RGB quantised to `tone_bits` bits per
           channel) that each hold at least `tone_min_share` of the area
  twinkle  blobs found on the first frame are followed frame to frame: the
           region's own drift between two frames is estimated first (phase
           correlation of the top-hat images, up to `twinkle_max_shift` px),
           then a 5x5 search; the standard deviation of their top-hat
           brightness over time is taken per blob (grey levels). A frozen
           picture that slides therefore counts as not twinkling. Blobs that
           drift out of the region are dropped from then on.
All four are reported for the whole region and per grid cell; tones also on
the finer `tone_grid` (reference mode compares those cell by cell as well).

Two modes
  standalone (no --ref)  the measured values are compared with absolute floors
      from qa.json: look.density.floors_type[<--type>] for a whole frame, or
      look.density.floors_kind[<--kind>] for a declared element (--region).
      No floors for that type / kind -> UNMEASURED (never PASS).
  reference (--ref)      per grid cell ratio against the reference clip, cell
      against the same cell (no neighbourhood tolerance: with one, a sparse
      patch next to a dense cell got through in the mutant test).

Region: --region takes EITHER a crop "w:h:x:y" in source pixels OR the path of
a matte video (white = element); for a matte the union bounding box is cropped
and only pixels inside the matte are counted.

Usage
  python3 tools/qa/density.py CLIP --type space [--range a:b] [--out DIR]
  python3 tools/qa/density.py CLIP --region 640:300:0:0 --kind starfield
  python3 tools/qa/density.py CLIP --ref REF --ref-range 0:47 [--type space]
  python3 tools/qa/density.py --calibrate        (reference shots listed in
      qa.json look.calibration -> qa/calibration-look.json, key "density";
      add --write-floors to store the proposed floors in qa.json)
Ranges are a:b with b exclusive. Needs python3 + numpy + Pillow + ffmpeg only
(no OpenCV). Decoding is one sequential ffmpeg pipe per clip.

Output: <out>/density[-NAME].json and density[-NAME].jpg (default out dir
qa/<clip stem>/). Exit code 0 = pass, 1 = fail, 2 = could not measure.
"""
import argparse
import fcntl
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

TOOL = "density"

DEFAULTS = {
    "density": {
        "size": [1280, 720],
        "grid": [4, 3],
        "tone_grid": [8, 6],
        "rich_cell_tones": 3,
        "blob_cell_min": 3,
        "tophat_kernel": 7,
        "tophat_thr": 40,
        "peak_window": 5,
        "edge_thr": 60,
        "tone_bits": 4,
        "tone_min_share": 0.01,
        "static_step": 12,
        "twinkle_frames": 48,
        "twinkle_delta": 30,
        "twinkle_min_blobs": 15,
        "twinkle_max_shift": 16,
        "twinkle_min_track": 8,
        "ref": {
            "tone_fine_slack": 4,
            "tone_fine_rel": 0.35,
            "blob_ratio_min": 0.5,
            "blob_ratio_max": 2.0,
            "blob_ref_min": 10,
            "edge_ratio_min": 0.6,
            "edge_ref_min": 0.01,
            "tone_slack": 3,
            "twinkle_ratio_min": 0.5,
            "max_bad_cells": 0,
        },
        "floor_factor": 0.7,
        "floors_type": {},
        "floors_kind": {},
    },
    "calibration": {
        "clip": "../ref/rover_doom.webm",
        "shots": [
            {"id": "earth", "start": 0, "end": 47, "type": "space"},
            {"id": "hallwide", "start": 47, "end": 76, "type": "interior"},
            {"id": "maskcase", "start": 76, "end": 98, "type": "interior"},
            {"id": "alcove", "start": 98, "end": 142, "type": "interior"},
            {"id": "closeup", "start": 142, "end": 173, "type": "closeup"},
            {"id": "king", "start": 173, "end": 232, "type": "interior"},
            {"id": "village", "start": 232, "end": 291, "type": "exterior"},
            {"id": "savanna", "start": 291, "end": 313, "type": "exterior"},
            {"id": "ocean", "start": 313, "end": 332, "type": "exterior"},
            {"id": "sun", "start": 332, "end": 366, "type": "space"},
            {"id": "hallmed", "start": 366, "end": 401, "type": "interior"},
            {"id": "hallwide2", "start": 401, "end": 450, "type": "interior"},
            {"id": "hallmed2", "start": 450, "end": 540, "type": "interior"},
        ],
        "elements": [
            {"id": "earth-stars", "kind": "starfield", "crop": "440:260:0:260", "start": 0, "end": 47},
            {"id": "earth-stars-r", "kind": "starfield", "crop": "380:220:880:400", "start": 0, "end": 47},
            {"id": "earth-cloud-dark", "kind": "cloud", "crop": "250:130:1005:230", "start": 0, "end": 47},
            {"id": "earth-cloud-top", "kind": "cloud", "crop": "270:140:375:20", "start": 0, "end": 47},
            {"id": "earth-cloud-cream", "kind": "cloud", "crop": "170:100:700:250", "start": 0, "end": 47},
        ],
        "floor_metrics_type": {
            "*": ["edge_share", "tones", "rich_cells_share"],
            "space": ["edge_share", "tones", "rich_cells_share", "blobs_per_mpx", "twinkle_med", "twinkle_share"],
        },
        "floor_metrics_kind": {
            "starfield": ["blobs_per_mpx", "twinkle_med", "twinkle_share"],
            "cloud": ["edge_share", "tones"],
        },
    },
}


# ----------------------------------------------------------------- shared look helpers
def _cfg(sub):
    """qa.json look.<sub>, with this package's defaults filled in."""
    return C.save_cfg_defaults("look", DEFAULTS).get(sub, {})


def _set_cfg(key, path, value):
    """Read-modify-write qa.json[key][path...] = value; foreign keys untouched."""
    with open(C.QA_JSON + ".lock", "w") as lf:
        fcntl.flock(lf, fcntl.LOCK_EX)
        try:
            try:
                with open(C.QA_JSON, "r", encoding="utf8") as f:
                    data = json.load(f)
            except FileNotFoundError:
                data = {}
            cur = data.setdefault(key, {})
            for p in path[:-1]:
                cur = cur.setdefault(p, {})
            cur[path[-1]] = value
            tmp = C.QA_JSON + ".tmp%d" % os.getpid()
            with open(tmp, "w", encoding="utf8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            os.replace(tmp, C.QA_JSON)
        finally:
            fcntl.flock(lf, fcntl.LOCK_UN)


def _merge_json(path, key, value):
    """Set one top-level key of a JSON file, keeping the others."""
    try:
        with open(path, "r", encoding="utf8") as f:
            data = json.load(f)
    except (FileNotFoundError, ValueError):
        data = {}
    data[key] = value
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def _region(arg, clip, rng):
    """--region value -> (crop tuple w,h,x,y or None, mask bool array or None).

    A crop string gives no mask. A matte video path gives the union bounding
    box of its white area over the range as the crop, and the union mask
    inside that box.
    """
    if not arg:
        return None, None
    try:
        return C.parse_crop(arg), None
    except ValueError:
        pass
    if not os.path.isfile(arg):
        raise FileNotFoundError("region is neither w:h:x:y nor an existing matte file: %s" % arg)
    union = None
    for _, g in C.frames(arg, rng[0], rng[1], grey=True):
        m = g > 127
        union = m if union is None else (union | m)
    if union is None or not union.any():
        raise RuntimeError("matte %s is empty over the range" % arg)
    ys, xs = np.where(union)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return (int(x1 - x0), int(y1 - y0), int(x0), int(y0)), union[y0:y1, x0:x1]


def _floor_checks(measured, floors, prefix=""):
    """Generic standalone checks: floors = {metric: {"min": a, "max": b}}."""
    checks = []
    for key in sorted(floors):
        lim = floors[key]
        if not isinstance(lim, dict):
            lim = {"min": lim}
        v = measured.get(key)
        if v is None:
            checks.append(C.check(prefix + key, C.UNMEASURED, None, lim, "value could not be measured"))
            continue
        ok = True
        if lim.get("min") is not None and v < lim["min"]:
            ok = False
        if lim.get("max") is not None and v > lim["max"]:
            ok = False
        checks.append(C.check(prefix + key, C.PASS if ok else C.FAIL, v, lim))
    return checks


def _out_paths(args, clip, tool):
    out = args.out or C.evidence_dir(clip)
    os.makedirs(out, exist_ok=True)
    stem = tool + ("-" + args.name if getattr(args, "name", None) else "")
    return out, os.path.join(out, stem + ".json"), os.path.join(out, stem + ".jpg")


def _r(v, n=4):
    return None if v is None else round(float(v), n)


# ----------------------------------------------------------------- measurement
def _grey(rgb):
    return (rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114).astype(np.uint8)


def _tophat(grey, k):
    g = Image.fromarray(grey)
    opened = np.asarray(g.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k)))
    return (grey.astype(np.int16) - opened).clip(0, 255).astype(np.uint8)


def _peaks(th, thr, win, mask=None):
    """(ys, xs) of top-hat peaks above thr; flat-topped blobs count once."""
    mx = np.asarray(Image.fromarray(th).filter(ImageFilter.MaxFilter(win)))
    pk = (th == mx) & (th > thr)
    if mask is not None:
        pk &= mask
    # a plateau is several equal neighbours: keep only its first pixel in scan order
    p = np.pad(pk, 1)
    prev = p[1:-1, :-2] | p[:-2, :-2] | p[:-2, 1:-1] | p[:-2, 2:]
    return np.where(pk & ~prev)


def _edges(grey, thr):
    g = grey.astype(np.float32)
    p = np.pad(g, 1, mode="edge")
    gx = (p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[1:-1, :-2] + p[2:, :-2])
    gy = (p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:])
    return np.hypot(gx, gy) > thr


def _tone_count(bins, bits, min_share):
    if bins.size == 0:
        return 0
    cnt = np.bincount(bins.ravel(), minlength=1 << (3 * bits))
    return int((cnt >= max(1.0, min_share * bins.size)).sum())


def _cells(h, w, grid):
    gx, gy = grid
    xs = [round(i * w / gx) for i in range(gx + 1)]
    ys = [round(j * h / gy) for j in range(gy + 1)]
    return xs, ys


def measure(clip, rng, crop, mask, cfg):
    """Decode once, return a dict of region and per-cell values plus evidence frames."""
    size = None
    if crop is None:
        size = tuple(cfg["size"])
    bits = int(cfg["tone_bits"])
    gx, gy = cfg["grid"]
    step = max(1, int(cfg["static_step"]))
    k, thr, win = int(cfg["tophat_kernel"]), int(cfg["tophat_thr"]), int(cfg["peak_window"])
    start = rng[0]
    stat = {"blobs": [], "edges": [], "tones": [], "blob_total": [], "edge_share": [], "tones_all": []}
    tw_stack = []
    frames_seen = 0
    for n, rgb in C.frames(clip, rng[0], rng[1], crop=crop, size=size):
        frames_seen += 1
        grey = _grey(rgb)
        h, w = grey.shape
        m = mask
        if m is not None and m.shape != grey.shape:
            m = np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((w, h))) > 127
        th = _tophat(grey, k)
        if len(tw_stack) < int(cfg["twinkle_frames"]):
            tw_stack.append(th)
        if (n - start) % step == 0:
            _static((n, rgb, grey, th, m), stat, cfg, bits, thr, win, gx, gy)
    if frames_seen == 0:
        raise RuntimeError("no frames decoded from %s in range %s" % (clip, rng))
    # the middle static frame is the evidence frame
    mid = stat["_frames"][len(stat["_frames"]) // 2]
    area = stat["_area"]
    out = {
        "frames": frames_seen,
        "static_frames": [f[0] for f in stat["_frames"]],
        "area_px": int(area),
        "blobs_per_mpx": _r(np.mean(stat["blob_total"]) / area * 1e6, 1),
        "blob_count": _r(np.mean(stat["blob_total"]), 1),
        "edge_share": _r(np.mean(stat["edge_share"]), 5),
        "tones": _r(np.mean(stat["tones_all"]), 2),
        "cells": {
            "blobs": np.mean(stat["blobs"], axis=0).round(1).tolist(),
            "edges": np.mean(stat["edges"], axis=0).round(4).tolist(),
            "tones": np.mean(stat["tones"], axis=0).round(1).tolist(),
        },
    }
    tones_c = np.mean(stat["tones"], axis=0)
    out["rich_cells_share"] = _r((tones_c >= float(cfg["rich_cell_tones"])).mean(), 3)
    out["blob_cells_share"] = _r((np.mean(stat["blobs"], axis=0) >= float(cfg["blob_cell_min"])).mean(), 3)
    tf = np.mean(stat["tones_fine"], axis=0)
    out["cells"]["tones_fine"] = [[None if np.isnan(v) else round(float(v), 1) for v in row] for row in tf]
    ok = tf[~np.isnan(tf)]
    if ok.size:
        out["tones_cell_min"] = _r(ok.min(), 2)
        out["tones_cell_p10"] = _r(np.percentile(ok, 10), 2)
        out["tones_cell_p25"] = _r(np.percentile(ok, 25), 2)
        out["tones_cell_med"] = _r(np.median(ok), 2)
    else:
        out["tones_cell_min"] = out["tones_cell_p10"] = out["tones_cell_p25"] = out["tones_cell_med"] = None
    out.update(_twinkle(tw_stack, thr, win, stat["_mask"], cfg, (gx, gy)))
    return out, {"n": mid[0], "rgb": mid[1], "pts": mid[2]}


def _static(fr, stat, cfg, bits, thr, win, gx, gy):
    n, rgb, grey, th, m = fr
    h, w = grey.shape
    ys, xs = _peaks(th, thr, win, m)
    ed = _edges(grey, float(cfg["edge_thr"]))
    q = (rgb >> (8 - bits)).astype(np.int32)
    bins = (q[..., 0] << (2 * bits)) | (q[..., 1] << bits) | q[..., 2]
    if m is not None:
        ed = ed & m
    cx, cy = _cells(h, w, (gx, gy))
    b = np.zeros((gy, gx)); e = np.zeros((gy, gx)); t = np.zeros((gy, gx))
    for j in range(gy):
        for i in range(gx):
            sl = (slice(cy[j], cy[j + 1]), slice(cx[i], cx[i + 1]))
            inside = (ys >= cy[j]) & (ys < cy[j + 1]) & (xs >= cx[i]) & (xs < cx[i + 1])
            b[j, i] = inside.sum()
            if m is None:
                e[j, i] = ed[sl].mean()
                t[j, i] = _tone_count(bins[sl], bits, cfg["tone_min_share"])
            else:
                mm = m[sl]
                e[j, i] = ed[sl].sum() / max(1, mm.sum())
                t[j, i] = _tone_count(bins[sl][mm], bits, cfg["tone_min_share"]) if mm.sum() > 50 else 0
    area = float(m.sum()) if m is not None else float(h * w)
    fx, fy = cfg["tone_grid"]
    c2x, c2y = _cells(h, w, (fx, fy))
    t2 = np.zeros((fy, fx))
    for j in range(fy):
        for i in range(fx):
            sl = (slice(c2y[j], c2y[j + 1]), slice(c2x[i], c2x[i + 1]))
            if m is None:
                t2[j, i] = _tone_count(bins[sl], bits, cfg["tone_min_share"])
            else:
                mm = m[sl]
                t2[j, i] = _tone_count(bins[sl][mm], bits, cfg["tone_min_share"]) if mm.sum() > 50 else np.nan
    stat.setdefault("tones_fine", []).append(t2)
    stat["blobs"].append(b); stat["edges"].append(e); stat["tones"].append(t)
    stat["blob_total"].append(len(ys))
    stat["edge_share"].append(ed.sum() / max(1.0, area))
    stat["tones_all"].append(_tone_count(bins if m is None else bins[m], bits, cfg["tone_min_share"]))
    stat.setdefault("_frames", []).append((n, rgb, (ys, xs)))
    stat["_area"] = area
    stat["_mask"] = m


def _twinkle(stack, thr, win, mask, cfg, grid):
    """Follow the blobs of the first frame; per-blob std of top-hat brightness."""
    res = {"twinkle_med": None, "twinkle_p90": None, "twinkle_share": None,
           "twinkle_blobs": 0, "twinkle_frames": len(stack)}
    if len(stack) < 8:
        return res
    ys, xs = _peaks(stack[0], thr, win, mask)
    res["twinkle_blobs"] = int(len(ys))
    if len(ys) < int(cfg["twinkle_min_blobs"]):
        return res
    h, w = stack[0].shape
    R = 2
    offs = [(dy, dx) for dy in range(-R, R + 1) for dx in range(-R, R + 1)]
    oy = np.array([o[0] for o in offs])[:, None]
    ox = np.array([o[1] for o in offs])[:, None]
    py, px = ys.copy(), xs.copy()
    alive = np.ones(len(py), bool)
    vals = [stack[0][py, px].astype(np.float32)]
    live = [alive.copy()]
    shifts = []
    prev_f = np.fft.rfft2(stack[0].astype(np.float32))
    maxs = int(cfg.get("twinkle_max_shift", 16))
    for th in stack[1:]:
        cur_f = np.fft.rfft2(th.astype(np.float32))
        cross = cur_f * np.conj(prev_f)
        corr = np.fft.irfft2(cross / np.maximum(np.abs(cross), 1e-6), s=th.shape)
        dy, dx = np.unravel_index(int(corr.argmax()), corr.shape)
        dy = dy - h if dy > h // 2 else dy
        dx = dx - w if dx > w // 2 else dx
        if abs(dy) > maxs or abs(dx) > maxs:
            dy = dx = 0
        prev_f = cur_f
        shifts.append((int(dy), int(dx)))
        qy, qx = py + dy, px + dx
        alive &= (qy >= 0) & (qy < h) & (qx >= 0) & (qx < w)
        qy, qx = np.clip(qy, 0, h - 1), np.clip(qx, 0, w - 1)
        yy = np.clip(qy[None, :] + oy, 0, h - 1)
        xx = np.clip(qx[None, :] + ox, 0, w - 1)
        v = th[yy, xx]
        a = v.argmax(axis=0)
        idx = np.arange(len(py))
        py, px = yy[a, idx], xx[a, idx]
        vals.append(v[a, idx].astype(np.float32))
        live.append(alive.copy())
    vals = np.array(vals)                       # frames x blobs
    live = np.array(live)
    keep = live.sum(axis=0) >= int(cfg.get("twinkle_min_track", 8))
    res["twinkle_tracked"] = int(keep.sum())
    sh = np.array(shifts)
    res["twinkle_drift_px"] = [_r(np.abs(sh[:, 1]).mean(), 2), _r(np.abs(sh[:, 0]).mean(), 2)]
    if keep.sum() < int(cfg["twinkle_min_blobs"]):
        return res
    vm = np.ma.masked_array(vals, mask=~live)[:, keep]
    sd = np.asarray(vm.std(axis=0).filled(0.0))
    swing = np.asarray((vm.max(axis=0) - vm.min(axis=0)).filled(0.0))
    res["twinkle_med"] = _r(np.median(sd), 2)
    res["twinkle_p90"] = _r(np.percentile(sd, 90), 2)
    res["twinkle_share"] = _r((swing > float(cfg["twinkle_delta"])).mean(), 3)
    return res


# ----------------------------------------------------------------- evidence
def overlay(ev, cells, grid, title, bad=()):
    """Evidence frame: grid, per-cell 'blobs / edge% / tones', blob marks."""
    im = C.to_pil(ev["rgb"]).copy()
    scale = 1
    if im.width < 640:
        scale = max(2, 960 // im.width)
        im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    d = ImageDraw.Draw(im)
    ys, xs = ev["pts"]
    for y, x in zip(ys.tolist()[:6000], xs.tolist()[:6000]):
        d.rectangle([x * scale - 3, y * scale - 3, x * scale + 3, y * scale + 3], outline=(255, 40, 40))
    gx, gy = grid
    cx, cy = _cells(im.height, im.width, grid)
    font = C._font(max(11, min(18, im.width // 70)))
    for j in range(gy):
        for i in range(gx):
            red = (j, i) in bad
            d.rectangle([cx[i], cy[j], cx[i + 1] - 1, cy[j + 1] - 1],
                        outline=(255, 0, 0) if red else (255, 255, 0), width=4 if red else 1)
            txt = "b%.0f e%.1f%% t%.0f" % (cells["blobs"][j][i], 100 * cells["edges"][j][i], cells["tones"][j][i])
            tw = d.textlength(txt, font=font)
            d.rectangle([cx[i] + 2, cy[j + 1] - font.size - 8, cx[i] + tw + 8, cy[j + 1] - 3], fill=(0, 0, 0))
            d.text((cx[i] + 5, cy[j + 1] - font.size - 6), txt, fill=(255, 255, 0), font=font)
    return C.label(im, title)


def _cell_crop(ev, grid, j, i, side=320):
    """100 % crop (side x side) centred on a grid cell."""
    rgb = ev["rgb"]
    h, w = rgb.shape[:2]
    cx, cy = _cells(h, w, grid)
    mx, my = (cx[i] + cx[i + 1]) // 2, (cy[j] + cy[j + 1]) // 2
    x0 = int(np.clip(mx - side // 2, 0, max(0, w - side)))
    y0 = int(np.clip(my - side // 2, 0, max(0, h - side)))
    return Image.fromarray(rgb[y0:y0 + side, x0:x0 + side])


# ----------------------------------------------------------------- modes
def reference_checks(o, r, cfg):
    rc = cfg["ref"]
    ob, rb = np.array(o["cells"]["blobs"]), np.array(r["cells"]["blobs"])
    oe, re_ = np.array(o["cells"]["edges"]), np.array(r["cells"]["edges"])
    ot, rt = np.array(o["cells"]["tones"]), np.array(r["cells"]["tones"])
    checks, bad = [], set()
    maxbad = int(rc["max_bad_cells"])

    def cells_of(mask):
        return [[int(j), int(i)] for j, i in zip(*np.where(mask))]

    sel = rb >= rc["blob_ref_min"]
    if sel.any():
        low = sel & (ob < rc["blob_ratio_min"] * rb)
        high = sel & (ob > rc["blob_ratio_max"] * rb)
        ratio = (ob[sel] / rb[sel])
        for nm, msk in (("blobs_too_few", low), ("blobs_too_many", high)):
            bad |= set(map(tuple, cells_of(msk)))
            checks.append(C.check(
                "ref." + nm, C.FAIL if msk.sum() > maxbad else C.PASS,
                {"bad_cells": cells_of(msk), "cell_ratio_min": _r(ratio.min(), 3),
                 "cell_ratio_max": _r(ratio.max(), 3), "ours_total": o["blob_count"], "ref_total": r["blob_count"]},
                {"ratio_min": rc["blob_ratio_min"], "ratio_max": rc["blob_ratio_max"],
                 "ref_cell_min_blobs": rc["blob_ref_min"], "max_bad_cells": maxbad}))
    else:
        checks.append(C.check("ref.blobs", C.UNMEASURED, {"ref_cells_max": float(rb.max())},
                              {"ref_cell_min_blobs": rc["blob_ref_min"]},
                              "reference has no cell with enough blobs to compare"))
    sel = re_ >= rc["edge_ref_min"]
    msk = sel & (oe < rc["edge_ratio_min"] * re_)
    bad |= set(map(tuple, cells_of(msk)))
    checks.append(C.check(
        "ref.edges", C.FAIL if msk.sum() > maxbad else C.PASS,
        {"bad_cells": cells_of(msk), "ours": o["edge_share"], "ref": r["edge_share"],
         "ratio": _r(o["edge_share"] / max(1e-9, r["edge_share"]), 3)},
        {"ratio_min": rc["edge_ratio_min"], "max_bad_cells": maxbad}))
    msk = ot < rt - rc["tone_slack"]
    bad |= set(map(tuple, cells_of(msk)))
    checks.append(C.check(
        "ref.tones", C.FAIL if msk.sum() > maxbad else C.PASS,
        {"bad_cells": cells_of(msk), "ours": o["tones"], "ref": r["tones"]},
        {"slack": rc["tone_slack"], "max_bad_cells": maxbad}))
    of, rf = o["cells"].get("tones_fine"), r["cells"].get("tones_fine")
    if of and rf:
        of = np.array([[np.nan if v is None else v for v in row] for row in of], float)
        rf = np.array([[np.nan if v is None else v for v in row] for row in rf], float)
        lim = rf - np.maximum(float(rc["tone_fine_slack"]), float(rc["tone_fine_rel"]) * rf)
        with np.errstate(invalid="ignore"):
            msk = of < lim
        checks.append(C.check(
            "ref.tones_fine", C.FAIL if msk.sum() > maxbad else C.PASS,
            {"bad_cells": cells_of(msk), "ours_at_bad": [float(v) for v in of[msk]][:12],
             "ref_at_bad": [float(v) for v in rf[msk]][:12], "largest_drop": _r(np.nanmax(rf - of), 1)},
            {"slack": rc["tone_fine_slack"], "rel": rc["tone_fine_rel"], "grid": cfg["tone_grid"], "max_bad_cells": maxbad},
            "tone count per cell of the fine grid; a cell fails when ours is below ref - max(slack, rel x ref)"))
    if r["twinkle_med"] is None or o["twinkle_med"] is None:
        checks.append(C.check("ref.twinkle", C.UNMEASURED,
                              {"ours_blobs": o["twinkle_blobs"], "ref_blobs": r["twinkle_blobs"],
                               "frames": [o["twinkle_frames"], r["twinkle_frames"]]},
                              {"min_blobs": cfg["twinkle_min_blobs"], "min_frames": 8},
                              "too few blobs or frames on one side"))
    else:
        ratio = o["twinkle_med"] / max(1e-6, r["twinkle_med"])
        checks.append(C.check("ref.twinkle", C.PASS if ratio >= rc["twinkle_ratio_min"] else C.FAIL,
                              {"ours": o["twinkle_med"], "ref": r["twinkle_med"], "ratio": _r(ratio, 3)},
                              {"ratio_min": rc["twinkle_ratio_min"]}))
    return checks, bad


def run_one(clip, rng, region, shot_type, kind, cfg, ref=None, ref_rng=None, ref_region=None):
    """Measure and judge. Returns (checks, not_checked, extra, evidence image)."""
    crop, mask = _region(region, clip, rng)
    o, ev = measure(clip, rng, crop, mask, cfg)
    grid = tuple(cfg["grid"])
    checks, bad = [], set()
    not_checked = ["codec difference between clips (no re-encode to a common codec and bitrate was done)",
                   "whether blobs are stars, sparkles or texture: only their number and brightness are measured",
                   "motion of the elements and of the camera"]
    if not ref and not kind:
        not_checked.append("a locally flat, posterised or sparse patch that is not declared as an element: the "
                           "reference style holds flat cells of its own (its king shot: 4 of 48 fine cells with 3 "
                           "tones), so whole-frame floors cannot localise one; declare the element (--region --kind) "
                           "or see palette.py set.off_palette_share for posterised colours")
    extra = {"mode": "reference" if ref else "standalone", "shot_type": shot_type, "kind": kind,
             "range": list(rng), "region": region, "crop": crop, "ours": o}
    if ref:
        rcrop, rmask = _region(ref_region or (region if crop and mask is None else None), ref, ref_rng)
        r, rev = measure(ref, ref_rng, rcrop, rmask, cfg)
        extra["ref"] = r
        extra["ref_clip"] = os.path.abspath(ref)
        extra["ref_range"] = list(ref_rng)
        c2, bad = reference_checks(o, r, cfg)
        checks += c2
    key = kind or shot_type
    table = cfg["floors_kind"] if kind else cfg["floors_type"]
    floors = table.get(key) if key else None
    if floors:
        checks += _floor_checks(o, floors, "floor.")
        extra["floors_used"] = {("kind:" if kind else "type:") + key: floors}
    elif not ref:
        checks.append(C.check("floor", C.UNMEASURED, None, None,
                              "no floors in qa.json look.density.%s[%r]" %
                              ("floors_kind" if kind else "floors_type", key)))
    else:
        not_checked.append("absolute style floors (none defined for %r)" % key)
    title = "ours f%d  cell: blobs edge%% tones" % ev["n"]
    panels = [overlay(ev, o["cells"], grid, title, bad)]
    labels = [None]
    if ref:
        panels.insert(0, overlay(rev, r["cells"], grid, "REFERENCE f%d" % rev["n"], bad))
        labels = [None, None]
    sheet = C.tile(panels, labels, 1)
    # 100 % crops: worst cells in reference mode, densest and emptiest cell standalone
    ob = np.array(o["cells"]["blobs"])
    if bad:
        pick = sorted(bad)[:3]
    else:
        pick = [tuple(int(v) for v in np.unravel_index(ob.argmax(), ob.shape)),
                tuple(int(v) for v in np.unravel_index(np.array(o["cells"]["tones"]).argmin(), ob.shape))]
    crops, cl = [], []
    for j, i in pick:
        if ref:
            crops.append(_cell_crop(rev, grid, j, i)); cl.append("ref cell r%d c%d 100%%" % (j, i))
        crops.append(_cell_crop(ev, grid, j, i)); cl.append("ours cell r%d c%d 100%%" % (j, i))
    strip = C.tile(crops, cl, len(crops))
    W = max(sheet.width, strip.width)
    canvas = Image.new("RGB", (W, sheet.height + strip.height), (24, 24, 24))
    canvas.paste(sheet, (0, 0)); canvas.paste(strip, (0, sheet.height))
    return checks, not_checked, extra, canvas


# ----------------------------------------------------------------- calibration
def calibrate(cfg, write_floors):
    cal = C.load_cfg("look").get("calibration", {})
    clip = os.path.join(C.ROOT, cal.get("clip", "../ref/rover_doom.webm"))
    shots = cal.get("shots", [])
    if not shots:
        print("no shots in qa.json look.calibration.shots"); return 2
    out_dir = os.path.join(C.ROOT, "qa", "calibration")
    os.makedirs(out_dir, exist_ok=True)
    clip_sha = C.sha(clip)
    rows, by_type, by_kind = [], {}, {}
    keys = ["blobs_per_mpx", "edge_share", "tones", "rich_cells_share", "twinkle_med", "twinkle_share"]
    for s in shots:
        rng = (s["start"], s["end"])
        o, ev = measure(clip, rng, None, None, cfg)
        rows.append({"id": s["id"], "type": s["type"], "range": list(rng), **{k: o[k] for k in o if k != "cells"},
                     "cells": o["cells"]})
        by_type.setdefault(s["type"], []).append(o)
        C.save_evidence(overlay(ev, o["cells"], tuple(cfg["grid"]), "ref %s (%s) f%d" % (s["id"], s["type"], ev["n"])),
                        os.path.join(out_dir, "density-%s.jpg" % s["id"]), clip_sha)
        print("%-10s %-9s" % (s["id"], s["type"]), {k: o[k] for k in keys})
    for e in cal.get("elements", []):
        rng = (e["start"], e["end"])
        crop, mask = _region(e["crop"], clip, rng)
        o, ev = measure(clip, rng, crop, mask, cfg)
        rows.append({"id": e["id"], "kind": e["kind"], "crop": e["crop"], "range": list(rng),
                     **{k: o[k] for k in o if k != "cells"}})
        by_kind.setdefault(e["kind"], []).append(o)
        C.save_evidence(overlay(ev, o["cells"], tuple(cfg["grid"]), "ref element %s (%s)" % (e["id"], e["kind"])),
                        os.path.join(out_dir, "density-el-%s.jpg" % e["id"]), clip_sha)
        print("%-10s kind=%-9s" % (e["id"], e["kind"]), {k: o[k] for k in keys})
    f = float(cfg["floor_factor"])

    def propose(group, use):
        res = {}
        for name, lst in group.items():
            fl = {}
            for k in use.get(name, use.get("*", [])):
                vals = [o[k] for o in lst if o[k] is not None]
                if len(vals) == len(lst) and vals:
                    fl[k] = {"min": round(f * min(vals), 4)}
            res[name] = fl
        return res

    use_t = cal.get("floor_metrics_type", {"*": ["edge_share", "tones", "rich_cells_share"]})
    use_k = cal.get("floor_metrics_kind", {"*": ["blobs_per_mpx", "edge_share", "tones"]})
    prop = {"floors_type": propose(by_type, use_t), "floors_kind": propose(by_kind, use_k),
            "rule": "floor = floor_factor (%.2f) x lowest reference value of that type / kind" % f}
    _merge_json(os.path.join(C.ROOT, "qa", "calibration-look.json"), "density",
                {"clip": os.path.abspath(clip), "clip_sha": clip_sha, "clip_sha256": clip_sha, "params": {k: v for k, v in cfg.items()
                 if k not in ("floors_type", "floors_kind", "ref")}, "measured": rows, "proposed": prop})
    if write_floors:
        _set_cfg("look", ["density", "floors_type"], prop["floors_type"])
        _set_cfg("look", ["density", "floors_kind"], prop["floors_kind"])
        print("floors written to qa.json look.density")
    print(json.dumps(prop, indent=1))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip", nargs="?")
    ap.add_argument("--range", help="a:b frames of CLIP, b exclusive")
    ap.add_argument("--ref", help="reference clip (reference mode)")
    ap.add_argument("--ref-range", help="a:b frames of the reference")
    ap.add_argument("--region", help="crop w:h:x:y or a matte video path")
    ap.add_argument("--ref-region", help="same for the reference (default: the same crop)")
    ap.add_argument("--type", help="shot type for the floors (qa.json look.density.floors_type)")
    ap.add_argument("--kind", help="element kind for the floors (qa.json look.density.floors_kind)")
    ap.add_argument("--out", help="output directory (default qa/<clip stem>/)")
    ap.add_argument("--name", help="suffix of the result files")
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--write-floors", action="store_true")
    a = ap.parse_args()
    cfg = _cfg("density")
    if a.calibrate:
        return calibrate(cfg, a.write_floors)
    if not a.clip:
        ap.error("CLIP is required")
    out, jpath, ipath = _out_paths(a, a.clip, TOOL)
    try:
        clip_sha = C.sha(a.clip)
        checks, not_checked, extra, img = run_one(
            a.clip, C.parse_range(a.range), a.region, a.type, a.kind, cfg,
            a.ref, C.parse_range(a.ref_range), a.ref_region)
        code = C.save_evidence(img, ipath, clip_sha)
        extra.update({"clip": os.path.abspath(a.clip), "clip_sha": clip_sha, "clip_sha256": clip_sha,
                      "evidence": [{"path": ipath, "code": code}]})
    except Exception as e:  # could not measure
        checks = [C.check("measure", C.UNMEASURED, None, None, "%s: %s" % (type(e).__name__, e))]
        C.write_result(jpath, TOOL, checks, ["everything: the tool could not measure"], {"clip": a.clip})
        print("%s: UNMEASURED (%s)" % (TOOL, e))
        return 2
    C.write_result(jpath, TOOL, checks, not_checked, extra)
    return C.print_summary(TOOL, checks, not_checked, jpath, [ipath])


if __name__ == "__main__":
    sys.exit(main())
