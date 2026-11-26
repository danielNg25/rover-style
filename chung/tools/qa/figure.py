#!/usr/bin/env python3
"""figure.py - size, position and proportions of a character (gate G5, package Q3 "look").

The figure is given by --region, which is EITHER a crop "w:h:x:y" (source
pixels) OR a matte video (white = the figure):
  crop    the crop is the DECLARED bounding box; it is then tested against the
          pixels. The colours of a band just outside the box are clustered,
          and the pixels inside the box that are far (Delta E) from all of
          them are "figure pixels". Their row span must fill the box
          (box.support_h, box.support_fg): a box much taller than what is in
          it (a squashed figure, an empty box) FAILS. With --ref the content
          of the two boxes is compared as well (ref.layout_corr: correlation
          of the coarse Lab layout) and so are the pixel spans (ref.px_height).
          Values named "declared" in the result were typed, not measured.
          No band outside the box (box = whole frame) -> UNMEASURED.
  matte   the bounding box of the white area, per frame (first, middle, last).
Measured: height_frac (figure height / frame height), cx and cy (centre /
frame width and height).

--parts FILE gives a part map (JSON):
  {"parts": {"head": {"rect": "w:h:x:y"}, "hand_r": {"rect": "..."}, "leg_l": {"rect": "..."}}}
or, on a parts matte whose parts are painted in flat colours:
  {"matte": "parts.mp4", "tol": 40, "parts": {"head": {"color": [255, 0, 0]}, ...}}
Proportions derived from it:
  head_frac    head height / figure height
  head_w_frac  head width / figure height
  hand_head    mean sqrt(area) of the parts named hand* / head height
  limb_thick   mean thickness of the parts named arm*, leg*, limb* / figure height
               (rect: its short side; matte: area / long side of its box)

What it is compared with (each one that is given is checked):
  --ref REF --ref-region R [--ref-parts FILE] [--ref-range a:b]   the reference clip
  --model FILE     declared model sheet: {"head_frac": {"value": 0.42, "spread": 0.01}, ...}
                   (plain numbers allowed). A value whose spread is above half
                   the tolerance is UNMEASURED.
  --expect "height_frac=0.8,cx=0.5,cy=0.47"   the contract bbox
  none of these    proportions are checked against qa.json look.figure.style_ranges;
                   if nothing can be checked the result is UNMEASURED.
Tolerances (qa.json look.figure): height 8 % relative, centre 3 % of the frame
width, height fractions 0.03 absolute, part ratios 10 % relative.

Usage
  python3 tools/qa/figure.py CLIP --region 455:600:435:40 --parts ours.json \\
      --ref REF --ref-range 173:232 --ref-region 400:580:425:50 --ref-parts ref.json
  python3 tools/qa/figure.py CLIP --region matte.mp4 --model src/chars/king/proportions.json
Ranges are a:b with b exclusive. python3 + numpy + Pillow + ffmpeg, no OpenCV.

Output: <out>/figure[-NAME].json and figure[-NAME].jpg (boxes drawn on a 10 %
grid). Exit code 0 = pass, 1 = fail, 2 = could not measure.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import density as D  # noqa: E402

TOOL = "figure"

D.DEFAULTS["figure"] = {
    "height_tol_rel": 0.08,
    "centre_tol_frame_w": 0.03,
    "frac_tol_abs": 0.03,
    "ratio_tol_rel": 0.10,
    "segment_de": 18,
    "ring_band": 0.08,
    "ring_k": 8,
    "row_fill": 0.03,
    "support_h_min": 0.75,
    "support_fg_min": 0.05,
    "layout_size": [24, 36],
    "layout_corr_min": 0.35,
    "part_inside_tol": 0.05,
    "style_ranges": {},
}
FRAC_KEYS = ("head_frac", "head_w_frac", "limb_thick")
RATIO_KEYS = ("hand_head",)


def _bbox(mask):
    ys, xs = np.where(mask)
    if len(ys) == 0:
        return None
    return [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]      # x0 y0 x1 y1


def _pick(clip, rng):
    """first, middle and last frame numbers of the range."""
    n = C.info(clip)["frames"]
    a = rng[0]
    b = min(n, rng[1]) if rng[1] is not None else n
    if b <= a:
        raise RuntimeError("empty range %s for %s (%d frames)" % (rng, clip, n))
    return sorted({a, (a + b - 1) // 2, b - 1})


def _grab(clip, wanted, grey=False):
    out = {}
    for n, f in C.frames(clip, min(wanted), max(wanted) + 1, grey=grey):
        if n in wanted:
            out[n] = f
    return out


def pixel_support(frame, crop, cfg):
    """Pixel evidence for a declared box: span of the pixels that differ from the surroundings.

    Returns None when there is no band outside the box to learn the background from.
    """
    from palette import rgb2lab, _kmeans
    w, h, x, y = crop
    H, W = frame.shape[:2]
    bx, by = max(8, int(cfg["ring_band"] * w)), max(8, int(cfg["ring_band"] * h))
    X0, Y0, X1, Y1 = max(0, x - bx), max(0, y - by), min(W, x + w + bx), min(H, y + h + by)
    area = frame[Y0:Y1, X0:X1]
    inner = np.zeros(area.shape[:2], bool)
    inner[y - Y0:y - Y0 + h, x - X0:x - X0 + w] = True
    ring_rgb = area[~inner]
    if len(ring_rgb) < 0.05 * w * h or len(ring_rgb) < 400:
        return None
    lab = rgb2lab(area)
    cent, _ = _kmeans(lab[~inner].astype(np.float32), ring_rgb, int(cfg["ring_k"]))
    box = lab[inner].reshape(h, w, 3)
    fg = np.sqrt(((box[:, :, None, :] - cent[None, None]) ** 2).sum(3)).min(2) > float(cfg["segment_de"])
    rows = np.where(fg.mean(1) >= float(cfg["row_fill"]))[0]
    cols = np.where(fg.mean(0) >= float(cfg["row_fill"]))[0]
    res = {"fg_share": D._r(fg.mean(), 4), "span_h": 0.0, "span_w": 0.0, "px_box": None, "ring_px": int(len(ring_rgb))}
    if len(rows) and len(cols):
        res["span_h"] = D._r((rows[-1] - rows[0] + 1) / h, 4)
        res["span_w"] = D._r((cols[-1] - cols[0] + 1) / w, 4)
        res["px_box"] = [int(x + cols[0]), int(y + rows[0]), int(x + cols[-1] + 1), int(y + rows[-1] + 1)]
        res["px_height_frac"] = D._r((rows[-1] - rows[0] + 1) / H, 4)
    return res, fg


def _layout(rgb, cfg):
    from palette import rgb2lab
    return rgb2lab(np.asarray(Image.fromarray(np.ascontiguousarray(rgb)).resize(tuple(cfg["layout_size"]), Image.BOX)))


def layout_corr(a, b, cfg):
    """Mean over L, a, b of the correlation of two box contents reduced to a coarse grid."""
    A, B = _layout(a, cfg), _layout(b, cfg)
    out = []
    for ch in range(3):
        u, v = A[..., ch] - A[..., ch].mean(), B[..., ch] - B[..., ch].mean()
        out.append(float((u * v).sum() / max(1e-6, np.sqrt((u * u).sum() * (v * v).sum()))))
    return D._r(np.mean(out), 3)


def measure(clip, rng, region, parts_file, segment, cfg):
    info = C.info(clip)
    W, H = info["width"], info["height"]
    wanted = _pick(clip, rng)
    frames = _grab(clip, wanted)
    boxes, how = {}, None
    try:
        crop = C.parse_crop(region)
    except ValueError:
        crop = None
    if crop:
        w, h, x, y = crop
        box = [x, y, x + w, y + h]
        how = "declared crop"
        midf = frames[wanted[len(wanted) // 2]]
        if x < 0 or y < 0 or x + w > W or y + h > H:
            raise RuntimeError("crop %s lies outside the %dx%d frame" % (region, W, H))
        ps = pixel_support(midf, crop, cfg)
        support, fgmask = ps if ps else (None, None)
        boxes = {n: box for n in wanted}
    else:
        if not os.path.isfile(region):
            raise FileNotFoundError("region is neither w:h:x:y nor an existing matte file: %s" % region)
        how = "matte"
        for n, g in _grab(region, wanted, grey=True).items():
            bb = _bbox(g > 127)
            if bb:
                sx, sy = W / g.shape[1], H / g.shape[0]
                boxes[n] = [bb[0] * sx, bb[1] * sy, bb[2] * sx, bb[3] * sy]
        if not boxes:
            raise RuntimeError("matte %s is empty on frames %s" % (region, wanted))
    per = []
    for n in sorted(boxes):
        x0, y0, x1, y1 = boxes[n]
        per.append({"frame": n, "box": [round(v, 1) for v in boxes[n]], "height_frac": (y1 - y0) / H,
                    "cx": (x0 + x1) / 2 / W, "cy": (y0 + y1) / 2 / H})
    mid = per[len(per) // 2]
    m = {"how": how, "frame_size": [W, H], "frames": [p["frame"] for p in per], "box": mid["box"]}
    if crop:
        m["box_is"] = "declared (typed); see pixel_support for what the pixels say"
        m["pixel_support"] = support
    for k in ("height_frac", "cx", "cy"):
        vals = [p[k] for p in per]
        m[k] = D._r(np.median(vals), 4)
        m[k + "_spread"] = D._r(max(vals) - min(vals), 4)
    fig_h = mid["box"][3] - mid["box"][1]
    part_boxes = {}
    if parts_file:
        with open(parts_file, "r", encoding="utf8") as f:
            pm = json.load(f)
        pframe = None
        if pm.get("matte"):
            mp = pm["matte"] if os.path.isabs(pm["matte"]) else os.path.join(os.path.dirname(os.path.abspath(parts_file)), pm["matte"])
            pframe = _grab(mp, [mid["frame"]])[mid["frame"]].astype(np.int16)
        sizes = {}
        for name, spec in pm.get("parts", {}).items():
            if "rect" in spec:
                w, h, x, y = C.parse_crop(spec["rect"])
                part_boxes[name] = [x, y, x + w, y + h]
                sizes[name] = {"w": w, "h": h, "area": w * h, "thick": min(w, h)}
            elif "color" in spec and pframe is not None:
                msk = np.abs(pframe - np.array(spec["color"], np.int16)).max(axis=2) <= int(pm.get("tol", 40))
                bb = _bbox(msk)
                if bb:
                    sx, sy = W / msk.shape[1], H / msk.shape[0]
                    w, h, area = (bb[2] - bb[0]) * sx, (bb[3] - bb[1]) * sy, float(msk.sum()) * sx * sy
                    part_boxes[name] = [bb[0] * sx, bb[1] * sy, bb[2] * sx, bb[3] * sy]
                    sizes[name] = {"w": w, "h": h, "area": area, "thick": area / max(w, h)}
        m["parts"] = sizes
        head = sizes.get("head")
        if head:
            m["head_frac"] = D._r(head["h"] / fig_h, 4)
            m["head_w_frac"] = D._r(head["w"] / fig_h, 4)
            hands = [v for k, v in sizes.items() if k.startswith("hand")]
            if hands:
                m["hand_head"] = D._r(np.mean([np.sqrt(v["area"]) for v in hands]) / head["h"], 4)
        limbs = [v for k, v in sizes.items() if k.startswith(("arm", "leg", "limb"))]
        if limbs:
            m["limb_thick"] = D._r(np.mean([v["thick"] for v in limbs]) / fig_h, 4)
    bx = [int(round(v)) for v in mid["box"]]
    return m, {"n": mid["frame"], "rgb": frames[mid["frame"]], "box": mid["box"], "parts": part_boxes,
               "px_box": (support or {}).get("px_box") if crop else None,
               "content": frames[mid["frame"]][max(0, bx[1]):bx[3], max(0, bx[0]):bx[2]]}


def draw(ev, title):
    im = C.to_pil(ev["rgb"]).copy()
    d = ImageDraw.Draw(im)
    W, H = im.size
    for i in range(1, 10):
        d.line([i * W / 10, 0, i * W / 10, H], fill=(0, 200, 200) if i == 5 else (0, 90, 90))
        d.line([0, i * H / 10, W, i * H / 10], fill=(0, 200, 200) if i == 5 else (0, 90, 90))
    d.rectangle(ev["box"], outline=(255, 255, 0), width=3)
    if ev.get("px_box"):
        d.rectangle(ev["px_box"], outline=(0, 255, 0), width=3)
    font = C._font(14)
    for name, b in ev["parts"].items():
        d.rectangle(b, outline=(255, 0, 255), width=2)
        d.text((b[0] + 3, b[1] + 2), name, fill=(255, 0, 255), font=font)
    return C.label(im.resize((W // 2, H // 2)), title)


def _compare(name, ours, target, spread, cfg, source):
    """One check row for a measured value against a target."""
    if ours is None:
        return C.check(name, C.UNMEASURED, None, {"target": target, "source": source}, "not measured on our side")
    key = name.split(".")[-1]
    if key in ("height_frac", "px_height"):
        tol, rel = cfg["height_tol_rel"], True
    elif key in ("cx", "cy"):
        tol, rel = cfg["centre_tol_frame_w"], False
    elif key in RATIO_KEYS:
        tol, rel = cfg["ratio_tol_rel"], True
    else:
        tol, rel = cfg["frac_tol_abs"], False
    diff = abs(ours - target) / max(abs(target), 1e-9) if rel else abs(ours - target)
    thr = {"target": target, "tol": tol, "tol_kind": "relative" if rel else "absolute", "source": source}
    meas = {"ours": ours, "diff": D._r(diff, 4)}
    lim = tol * abs(target) if rel else tol
    if spread is not None and spread > lim / 2:
        return C.check(name, C.UNMEASURED, meas, thr, "target spread %.4f is above half the tolerance" % spread)
    return C.check(name, C.PASS if diff <= tol else C.FAIL, meas, thr)


def run_one(a, cfg):
    o, ev = measure(a.clip, C.parse_range(a.range), a.region, a.parts, a.segment, cfg)
    checks, panels = [], [draw(ev, "ours f%d  (yellow: box, green: pixel span, magenta: parts)" % ev["n"])]
    extra = {"mode": "reference" if a.ref else "standalone", "ours": o, "region": a.region}
    not_checked = ["pose and silhouette shape (only boxes and part sizes are measured)",
                   "whether the crop or matte really encloses the whole figure and nothing else"]
    declared = o["how"].startswith("declared crop")
    if declared:
        not_checked += ["the figure's box is the DECLARED crop: height_frac, cx, cy are typed values, only "
                        "box.support_* (and ref.layout_corr, ref.px_height with --ref) come from pixels",
                        "figure parts given as rectangles are typed too; only their position inside the box is tested",
                        "that the thing in the box is the declared character (without --ref nothing tests its identity)",
                        "figure pixels of the same colour as the surroundings (they shorten the pixel span)"]
        sup = o.get("pixel_support")
        if sup is None:
            checks.append(C.check("box.support", C.UNMEASURED, None, None,
                                  "no band outside the declared box to learn the background from; give a matte"))
        else:
            checks += D._floor_checks({"support_h": sup["span_h"], "support_fg": sup["fg_share"]},
                                      {"support_h": {"min": cfg["support_h_min"]}, "support_fg": {"min": cfg["support_fg_min"]}},
                                      "box.")
        bx, tol = o["box"], float(cfg["part_inside_tol"]) * (o["box"][3] - o["box"][1])
        outside = [n for n, b in ev["parts"].items()
                   if b[0] < bx[0] - tol or b[1] < bx[1] - tol or b[2] > bx[2] + tol or b[3] > bx[3] + tol]
        if ev["parts"]:
            checks.append(C.check("box.parts_inside", C.FAIL if outside else C.PASS, {"outside": outside},
                                  {"tol_of_box_height": cfg["part_inside_tol"]}))
    prop_keys = [k for k in FRAC_KEYS + RATIO_KEYS if k in o]
    if a.ref:
        if not a.ref_region:
            raise RuntimeError("--ref needs --ref-region")
        r, rev = measure(a.ref, C.parse_range(a.ref_range), a.ref_region, a.ref_parts, a.segment, cfg)
        extra["ref"] = r
        panels.insert(0, draw(rev, "REFERENCE f%d" % rev["n"]))
        if rev["content"].size and ev["content"].size:
            lc = layout_corr(ev["content"], rev["content"], cfg)
            checks.append(C.check("ref.layout_corr", C.PASS if lc >= cfg["layout_corr_min"] else C.FAIL, lc,
                                  {"min": cfg["layout_corr_min"]},
                                  "content of our box against the content of the reference box, coarse Lab grid"))
        so, sr = o.get("pixel_support"), r.get("pixel_support")
        if so and sr and so.get("px_height_frac") and sr.get("px_height_frac"):
            checks.append(_compare("ref.px_height", so["px_height_frac"], sr["px_height_frac"], None, cfg, "reference clip, pixel span"))
        elif declared or r["how"].startswith("declared crop"):
            checks.append(C.check("ref.px_height", C.UNMEASURED, None, None, "no pixel span on one side"))
        for k in ("height_frac", "cx", "cy"):
            checks.append(_compare("ref." + k, o[k], r[k], r[k + "_spread"], cfg, "reference clip"))
        for k in FRAC_KEYS + RATIO_KEYS:
            if k in r:
                checks.append(_compare("ref." + k, o.get(k), r[k], None, cfg, "reference clip"))
    if a.model:
        with open(a.model, "r", encoding="utf8") as f:
            model = json.load(f)
        extra["model"] = model
        for k, v in model.items():
            if k.startswith("_"):
                continue
            val, spread = (v.get("value"), v.get("spread")) if isinstance(v, dict) else (v, None)
            if isinstance(val, (int, float)):
                checks.append(_compare("model." + k, o.get(k), val, spread, cfg, os.path.basename(a.model)))
    if a.expect:
        for item in a.expect.split(","):
            k, _, v = item.partition("=")
            checks.append(_compare("contract." + k.strip(), o.get(k.strip()), float(v), None, cfg, "--expect"))
    if not (a.ref or a.model):
        ranges = {k: v for k, v in cfg.get("style_ranges", {}).items() if k in prop_keys}
        if ranges:
            checks += D._floor_checks(o, ranges, "style.")
            extra["style_ranges_used"] = ranges
    if not checks:
        checks.append(C.check("figure", C.UNMEASURED, {k: o.get(k) for k in ("height_frac", "cx", "cy") + tuple(prop_keys)},
                              None, "nothing to compare with: no --ref, --model, --expect, and no style range applies"))
    if not a.parts:
        not_checked.append("proportions (no --parts map given)")
    return checks, not_checked, extra, C.tile(panels, [None] * len(panels), len(panels))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip")
    ap.add_argument("--region", required=True, help="crop w:h:x:y or matte video of the figure")
    ap.add_argument("--range", help="a:b frames of CLIP, b exclusive")
    ap.add_argument("--parts", help="part map JSON")
    ap.add_argument("--segment", choices=["none", "border"], default="none",
                    help="kept for old command lines; a crop is always tested against the pixels now")
    ap.add_argument("--ref"); ap.add_argument("--ref-range"); ap.add_argument("--ref-region"); ap.add_argument("--ref-parts")
    ap.add_argument("--model", help="model sheet JSON (proportions.json)")
    ap.add_argument("--expect", help='contract values, e.g. "height_frac=0.8,cx=0.5,cy=0.47"')
    ap.add_argument("--out"); ap.add_argument("--name")
    a = ap.parse_args()
    cfg = D._cfg("figure")
    out, jpath, ipath = D._out_paths(a, a.clip, TOOL)
    try:
        clip_sha = C.sha(a.clip)
        checks, not_checked, extra, img = run_one(a, cfg)
        code = C.save_evidence(img, ipath, clip_sha)
        extra.update({"clip": os.path.abspath(a.clip), "clip_sha": clip_sha, "clip_sha256": clip_sha,
                      "evidence": [{"path": ipath, "code": code}]})
    except Exception as e:
        checks = [C.check("measure", C.UNMEASURED, None, None, "%s: %s" % (type(e).__name__, e))]
        C.write_result(jpath, TOOL, checks, ["everything: the tool could not measure"], {"clip": a.clip})
        print("%s: UNMEASURED (%s)" % (TOOL, e))
        return 2
    C.write_result(jpath, TOOL, checks, not_checked, extra)
    return C.print_summary(TOOL, checks, not_checked, jpath, [ipath])


if __name__ == "__main__":
    sys.exit(main())
