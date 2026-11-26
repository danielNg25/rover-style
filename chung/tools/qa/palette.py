#!/usr/bin/env python3
"""palette.py - dominant palette and tone structure of a shot (gate G7, package Q3 "look").

Measures on frames scaled to qa.json look.palette.size, pooled over the shot:
  palette        k colours (k-means in CIE Lab, deterministic start) with shares
  palette_n      how many of them hold at least `min_share` of the picture
  mean_chroma    mean Lab chroma (a desaturated clip scores low)
  chromatic_share  share of pixels with chroma above `chroma_min`
  dom_share      share of the chromatic pixels inside the strongest 90 degree
                 hue window (the dominant hue family) and its hue angle
  accent_share   share of ALL pixels in the strongest 90 degree hue window that
                 does not overlap the dominant one, and its hue distance
  value_range    L* p95 minus L* p5 of the frame
  value_sep      only with --subject (crop w:h:x:y or matte video): L* p90 of the
                 subject minus median L* of everything else (signed)

  off_palette_share  share of pixels farther than `off_de` (Delta E 76) from every
                 colour of the SET PALETTE. The set palette is --set-palette FILE
                 ({"colors": [[r, g, b], ...]}, the contract's "palette") or, when
                 none is given, the style palette stored in qa.json by --calibrate
                 (`style_k` colours of each reference shot, pooled). A hue-rotated
                 or posterised picture leaves the palette. A NEW set whose colours
                 the reference never showed needs its own --set-palette, or this
                 check fails on it (leave-one-out on the reference: up to 0.32).

Two modes
  standalone (no --ref)  floors from qa.json look.palette.floors_type[--type];
      no floors for the type -> UNMEASURED.
      Without floors for the type the loosest floor of any type is still
      applied (checks "anytype.*"): they can FAIL, but the result stays
      UNMEASURED at best.
  reference (--ref)      every palette colour is paired with the nearest colour of
      the other palette (Delta E 76, both directions); the share-weighted mean must stay under look.palette.ref.de_max.
      Floors are applied as well when --type has them.

Usage
  python3 tools/qa/palette.py CLIP --type interior [--range a:b] [--subject w:h:x:y]
  python3 tools/qa/palette.py CLIP --ref REF --ref-range 0:47
  python3 tools/qa/palette.py --calibrate [--write-floors]
      (shots from qa.json look.calibration -> qa/calibration-look.json key "palette")
Ranges are a:b with b exclusive. python3 + numpy + Pillow + ffmpeg, no OpenCV.

Output: <out>/palette[-NAME].json and palette[-NAME].jpg (swatch strips and hue
histogram). Exit code 0 = pass, 1 = fail, 2 = could not measure.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import density as D  # noqa: E402  (shared private helpers of this package)

TOOL = "palette"

D.DEFAULTS["palette"] = {
    "size": [320, 180],
    "k": 6,
    "min_share": 0.03,
    "frame_step": 6,
    "chroma_min": 12,
    "hue_bins": 12,
    "floor_factor": 0.7,
    "ref": {"de_max": 8.0, "de_pair_max": 20.0, "pair_min_share": 0.08},
    "style_k": 12,
    "style_min_share": 0.005,
    "off_de": 15,
    "off_share_factor": 3.0,
    "off_share_max": None,
    "style_palette": [],
    "floors_type": {},
    "floor_metrics": ["mean_chroma", "chromatic_share", "value_range", "palette_n", "dom_share"],
}


def rgb2lab(rgb):
    """uint8 (..., 3) sRGB -> float32 Lab (D65)."""
    c = rgb.astype(np.float32) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750],
                  [0.0193339, 0.1191920, 0.9503041]], np.float32)
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883], np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16.0 / 116.0)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def _kmeans(lab, rgb, k, iters=15):
    """Deterministic k-means in Lab, started from a median-cut palette of the pixels."""
    n = len(rgb) - len(rgb) % 200
    q = Image.fromarray(rgb[:n].reshape(-1, 200, 3)).quantize(k, method=Image.MEDIANCUT)
    start = np.array(q.getpalette()[: 3 * k], np.uint8).reshape(-1, 3)
    cent = rgb2lab(start).astype(np.float32)
    k = len(cent)
    for _ in range(iters):
        lab_i = ((lab[:, None, :] - cent[None, :, :]) ** 2).sum(2).argmin(1)
        for j in range(k):
            sel = lab_i == j
            if sel.any():
                cent[j] = lab[sel].mean(0)
    return cent, lab_i


def _assign(lab, cent):
    return np.concatenate([((lab[i:i + 200000, None, :] - cent[None]) ** 2).sum(2).argmin(1)
                           for i in range(0, len(lab), 200000)])


def style_colours(lab, rgb, cfg):
    """`style_k` Lab colours of a pixel pool that each hold at least `style_min_share`."""
    st = max(1, len(lab) // 40000)
    cent, _ = _kmeans(lab[::st].astype(np.float32), rgb[::st], int(cfg["style_k"]))
    a = _assign(lab[::st], cent)
    return [[round(float(v), 1) for v in lab[::st][a == j].mean(0)] for j in range(len(cent))
            if (a == j).mean() >= float(cfg["style_min_share"])]


def off_palette(lab, colours, cfg):
    """(share of pixels farther than off_de from every palette colour, mean distance, bool mask)."""
    S = np.array(colours, np.float32)
    d = np.concatenate([np.sqrt(((lab[i:i + 50000, None, :] - S[None]) ** 2).sum(2)).min(1)
                        for i in range(0, len(lab), 50000)])
    return float((d > float(cfg["off_de"])).mean()), float(d.mean()), d > float(cfg["off_de"])


def load_set_palette(path):
    with open(path, "r", encoding="utf8") as f:
        data = json.load(f)
    cols = data.get("colors") if isinstance(data, dict) else data
    if not cols:
        raise RuntimeError("set palette %s holds no 'colors'" % path)
    return rgb2lab(np.array(cols, np.uint8).reshape(-1, 3)).tolist()


def measure(clip, rng, cfg, subject=None, keep=None):
    w, h = cfg["size"]
    step = max(1, int(cfg["frame_step"]))
    px, mid, used = [], None, []
    all_frames = []
    for n, rgb in C.frames(clip, rng[0], rng[1], size=(w, h)):
        if (n - rng[0]) % step == 0:
            all_frames.append((n, rgb))
    if not all_frames:
        raise RuntimeError("no frames decoded from %s in range %s" % (clip, rng))
    used = [f[0] for f in all_frames]
    mid = all_frames[len(all_frames) // 2]
    rgb_all = np.stack([f[1] for f in all_frames])            # F,H,W,3
    lab_all = rgb2lab(rgb_all)
    flat_rgb = rgb_all.reshape(-1, 3)
    lab = lab_all.reshape(-1, 3)
    # k-means on a deterministic subsample, shares from all pixels
    st = max(1, len(lab) // 40000)
    cent, _ = _kmeans(lab[::st], flat_rgb[::st], int(cfg["k"]))
    k = len(cent)
    assign = np.concatenate([((lab[i:i + 200000, None, :] - cent[None]) ** 2).sum(2).argmin(1)
                             for i in range(0, len(lab), 200000)])
    pal = []
    for j in range(k):
        sel = assign == j
        if sel.any():
            pal.append({"rgb": [int(v) for v in flat_rgb[sel].mean(0).round()],
                        "lab": [round(float(v), 1) for v in lab[sel].mean(0)],
                        "share": round(float(sel.mean()), 4)})
    pal.sort(key=lambda p: -p["share"])
    if keep is not None:
        keep.update({"lab": lab, "rgb": flat_rgb, "mid_lab": rgb2lab(mid[1]), "shape": (h, w)})
    L, a, b = lab[:, 0], lab[:, 1], lab[:, 2]
    chroma = np.hypot(a, b)
    chrom = chroma > float(cfg["chroma_min"])
    nb = int(cfg["hue_bins"])
    hue = (np.degrees(np.arctan2(b, a)) % 360.0)
    hist = np.bincount((hue[chrom] / (360.0 / nb)).astype(int) % nb, minlength=nb).astype(float)
    out = {
        "frames_used": used,
        "palette": pal,
        "palette_n": int(sum(p["share"] >= cfg["min_share"] for p in pal)),
        "mean_chroma": D._r(chroma.mean(), 2),
        "chromatic_share": D._r(chrom.mean(), 4),
        "value_range": D._r(np.percentile(L, 95) - np.percentile(L, 5), 2),
        "mean_L": D._r(L.mean(), 2),
        "hue_hist": (hist / max(1.0, len(lab))).round(4).tolist(),
        "dom_share": None, "dom_hue": None, "accent_share": None, "accent_hue_dist": None,
        "value_sep": None,
    }
    if hist.sum() > 0:
        win = np.array([hist[(i - 1) % nb] + hist[i] + hist[(i + 1) % nb] for i in range(nb)])
        d = int(win.argmax())
        bw = 360.0 / nb
        out["dom_share"] = D._r(win[d] / hist.sum(), 4)
        out["dom_hue"] = round((d + 0.5) * bw, 1)
        far = [i for i in range(nb) if min((i - d) % nb, (d - i) % nb) >= 3]
        if far:
            acc = max(far, key=lambda i: win[i])
            out["accent_share"] = D._r(win[acc] / len(lab), 4)
            out["accent_hue_dist"] = round(min((acc - d) % nb, (d - acc) % nb) * bw, 1)
    if subject:
        crop, mask = D._region(subject, clip, rng)
        info = C.info(clip)
        sx, sy = w / info["width"], h / info["height"]
        m = np.zeros((h, w), bool)
        cw, chh, cx, cy = crop
        x0, y0 = int(cx * sx), int(cy * sy)
        x1, y1 = max(x0 + 1, int(round((cx + cw) * sx))), max(y0 + 1, int(round((cy + chh) * sy)))
        if mask is None:
            m[y0:y1, x0:x1] = True
        else:
            mm = np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).resize((x1 - x0, y1 - y0))) > 127
            m[y0:y1, x0:x1] = mm[: h - y0, : w - x0]
        Lf = lab_all[..., 0]
        s_, bg = Lf[:, m], Lf[:, ~m]
        if s_.size and bg.size:
            out["value_sep"] = D._r(np.percentile(s_, 90) - np.median(bg), 2)
            out["subject_L_p90"] = D._r(np.percentile(s_, 90), 2)
            out["background_L_median"] = D._r(np.median(bg), 2)
    return out, mid


def pair_distance(po, pr, min_share=0.08):
    """Palette distance in Delta E 76.

    Each colour is paired with the NEAREST colour of the other palette (both
    directions), so one flat area split into two clusters on one side does not
    count as a difference. Returns the share-weighted mean over both
    directions, the worst distance among colours holding at least min_share,
    and the pair list.
    """
    A, B = po["palette"], pr["palette"]
    res, tot, wsum, worst = [], 0.0, 0.0, 0.0
    for side, X, Y in (("ours", A, B), ("ref", B, A)):
        for x in X:
            de, y = min(((float(np.linalg.norm(np.subtract(x["lab"], y["lab"]))), y) for y in Y), key=lambda t: t[0])
            res.append({"side": side, "rgb": x["rgb"], "share": x["share"], "nearest_other": y["rgb"], "de": round(de, 2)})
            tot += de * x["share"]; wsum += x["share"]
            if x["share"] >= min_share:
                worst = max(worst, de)
    return round(tot / max(wsum, 1e-9), 2), worst, res


def _strip(m, title, width=640, height=70):
    im = Image.new("RGB", (width, height + 22), (24, 24, 24))
    d = ImageDraw.Draw(im)
    x = 0.0
    font = C._font(13)
    for p in m["palette"]:
        wpx = p["share"] * width
        d.rectangle([x, 22, x + wpx, height + 22], fill=tuple(p["rgb"]))
        if wpx > 34:
            lum = sum(p["rgb"]) / 3
            d.text((x + 3, 26), "%d%%" % round(100 * p["share"]), fill=(0, 0, 0) if lum > 128 else (255, 255, 255), font=font)
        x += wpx
    d.text((4, 3), title, fill=(255, 255, 255), font=font)
    return im


def _huebar(m, width=640, height=90):
    im = Image.new("RGB", (width, height), (24, 24, 24))
    d = ImageDraw.Draw(im)
    hist = m["hue_hist"]
    nb = len(hist)
    top = max(max(hist), 1e-6)
    import colorsys
    for i, v in enumerate(hist):
        # Lab hue angle is not HSV hue; the bar colour is only a rough guide
        r, g, b = colorsys.hsv_to_rgb(((i + 0.5) / nb * 360 - 20) % 360 / 360.0, 0.8, 0.95)
        x0 = i * width / nb
        d.rectangle([x0 + 2, height - 4 - (height - 24) * v / top, x0 + width / nb - 2, height - 4],
                    fill=(int(r * 255), int(g * 255), int(b * 255)))
    d.text((4, 2), "Lab hue histogram (share of all pixels, 30 deg bins)  chroma %.1f  dom %.0f%% at %s deg  accent %s"
           % (m["mean_chroma"], 100 * (m["dom_share"] or 0), m["dom_hue"], m["accent_share"]),
           fill=(255, 255, 255), font=C._font(12))
    return im


def evidence(o, mid, r=None, rmid=None, off=None):
    rows = [C.label(C.to_pil(mid[1]).resize((640, 360)), "ours f%d" % mid[0]), _strip(o, "ours palette"), _huebar(o)]
    if off is not None:
        marked = mid[1].copy()
        marked[off[0]] = (255, 0, 255)
        rows.append(C.label(C.to_pil(marked).resize((640, 360), Image.NEAREST), off[1]))
    if r is not None:
        rows = [C.label(C.to_pil(rmid[1]).resize((640, 360)), "REFERENCE f%d" % rmid[0]),
                _strip(r, "REFERENCE palette"), _huebar(r)] + rows
    H = sum(i.height for i in rows)
    im = Image.new("RGB", (640, H), (24, 24, 24))
    y = 0
    for i in rows:
        im.paste(i, (0, y)); y += i.height
    return im


def run_one(clip, rng, shot_type, cfg, ref=None, ref_rng=None, subject=None, set_palette=None):
    keep = {}
    o, mid = measure(clip, rng, cfg, subject, keep)
    checks = []
    off_ev = None
    if set_palette:
        colours, source = load_set_palette(set_palette), "set palette %s" % os.path.basename(set_palette)
    else:
        colours = [c for e in cfg.get("style_palette") or [] for c in e["lab"]]
        source = "style palette of qa.json (%d colours of the reference shots)" % len(colours)
    if colours and cfg.get("off_share_max") is not None:
        st = max(1, len(keep["lab"]) // 120000)
        share, dmean, _ = off_palette(keep["lab"][::st], colours, cfg)
        _, _, mm = off_palette(keep["mid_lab"].reshape(-1, 3), colours, cfg)
        o["off_palette_share"], o["off_palette_de_mean"] = D._r(share, 4), D._r(dmean, 2)
        checks.append(C.check("set.off_palette_share", C.PASS if share <= cfg["off_share_max"] else C.FAIL, D._r(share, 4),
                              {"max": cfg["off_share_max"], "off_de": cfg["off_de"], "source": source}))
        off_ev = (mm.reshape(keep["shape"]), "magenta: farther than dE %s from the %s" % (cfg["off_de"], source[:40]))
    else:
        checks.append(C.check("set.off_palette_share", C.UNMEASURED, None, None,
                              "no set palette: give --set-palette or run palette.py --calibrate --write-floors"))
    not_checked = ["per-cell colour (only the whole-frame palette is measured)",
                   "whether the colours sit on the right objects",
                   "colour shifts over time inside the shot (frames are pooled)"]
    extra = {"mode": "reference" if ref else "standalone", "shot_type": shot_type, "range": list(rng), "ours": o}
    r = rmid = None
    if ref:
        r, rmid = measure(ref, ref_rng, cfg)
        mean, worst, pairs = pair_distance(o, r, cfg["ref"]["pair_min_share"])
        rc = cfg["ref"]
        extra.update({"ref": r, "pairs": pairs, "ref_clip": os.path.abspath(ref), "ref_range": list(ref_rng)})
        checks.append(C.check("ref.palette_de_mean", C.PASS if mean <= rc["de_max"] else C.FAIL, mean, {"max": rc["de_max"]}))
        checks.append(C.check("ref.palette_de_worst_pair", C.PASS if worst <= rc["de_pair_max"] else C.FAIL,
                              round(worst, 2), {"max": rc["de_pair_max"]}))
    floors = cfg["floors_type"].get(shot_type) if shot_type else None
    if floors:
        fl = dict(floors)
        if o["value_sep"] is None and "value_sep" in fl:
            fl.pop("value_sep")
            not_checked.append("value separation subject / background (no --subject crop or matte given)")
        checks += D._floor_checks(o, fl, "floor.")
        extra["floors_used"] = {"type:" + shot_type: floors}
    elif not ref:
        checks.append(C.check("floor", C.UNMEASURED, None, None,
                              "no floors in qa.json look.palette.floors_type[%r]" % shot_type))
        if cfg["floors_type"]:
            # no type (a film of several shots, an unknown type): the loosest floor of any type still applies
            loose = {}
            for fl in cfg["floors_type"].values():
                for k, lim in fl.items():
                    if k != "value_sep" and isinstance(lim, dict) and lim.get("min") is not None:
                        loose[k] = {"min": min(lim["min"], loose.get(k, lim)["min"])}
            checks += D._floor_checks(o, loose, "anytype.")
            extra["floors_anytype"] = loose
    else:
        not_checked.append("absolute palette floors (none defined for %r)" % shot_type)
    if o["value_sep"] is None and not any("value separation" in n for n in not_checked):
        not_checked.append("value separation subject / background (no --subject crop or matte given)")
    if not set_palette:
        not_checked.append("colours of a set the reference never showed (no --set-palette given: the style palette "
                           "of the reference shots was used)")
    return checks, not_checked, extra, evidence(o, mid, r, rmid, off_ev)


def calibrate(cfg, write_floors):
    cal = C.load_cfg("look").get("calibration", {})
    clip = os.path.join(C.ROOT, cal.get("clip", "../ref/rover_doom.webm"))
    out_dir = os.path.join(C.ROOT, "qa", "calibration")
    clip_sha = C.sha(clip)
    rows, by_type, style, pools = [], {}, [], {}
    for s in cal.get("shots", []):
        keep = {}
        o, mid = measure(clip, (s["start"], s["end"]), cfg, None, keep)
        style.append({"shot": s["id"], "lab": style_colours(keep["lab"], keep["rgb"], cfg)})
        pools[s["id"]] = keep["lab"][::max(1, len(keep["lab"]) // 60000)]
        rows.append({"id": s["id"], "type": s["type"], **o})
        by_type.setdefault(s["type"], []).append(o)
        C.save_evidence(evidence(o, mid), os.path.join(out_dir, "palette-%s.jpg" % s["id"]), clip_sha)
        print("%-10s %-9s n=%d chroma=%s chrom=%s vrange=%s dom=%s@%s accent=%s" % (
            s["id"], s["type"], o["palette_n"], o["mean_chroma"], o["chromatic_share"], o["value_range"],
            o["dom_share"], o["dom_hue"], o["accent_share"]))
    if not rows:
        print("no shots in qa.json look.calibration.shots"); return 2
    f = float(cfg["floor_factor"])
    prop = {}
    for t, lst in by_type.items():
        prop[t] = {}
        for k in cfg["floor_metrics"]:
            vals = [o[k] for o in lst if o[k] is not None]
            if vals and len(vals) == len(lst):
                v = f * min(vals)
                prop[t][k] = {"min": int(v) if k == "palette_n" else round(v, 4)}
    allc = [c for e in style for c in e["lab"]]
    offs = {}
    for e in style:
        loo = [c for x in style if x["shot"] != e["shot"] for c in x["lab"]]
        offs[e["shot"]] = {"all": round(off_palette(pools[e["shot"]], allc, cfg)[0], 4),
                           "leave_one_out": round(off_palette(pools[e["shot"]], loo, cfg)[0], 4)}
        print("%-10s off-palette share %s" % (e["shot"], offs[e["shot"]]))
    off_max = round(max(0.01, float(cfg["off_share_factor"]) * max(v["all"] for v in offs.values())), 4)
    D._merge_json(os.path.join(C.ROOT, "qa", "calibration-look.json"), "palette_style",
                  {"off_de": cfg["off_de"], "colours": len(allc), "off_palette_share": offs, "proposed_off_share_max": off_max,
                   "rule": "max = off_share_factor (%s) x highest share of a reference shot against the pooled palette; "
                           "leave_one_out shows what a set unknown to the palette would score" % cfg["off_share_factor"]})
    D._merge_json(os.path.join(C.ROOT, "qa", "calibration-look.json"), "palette",
                  {"clip": os.path.abspath(clip), "clip_sha": clip_sha, "clip_sha256": clip_sha, "measured": rows,
                   "proposed": {"floors_type": prop,
                                "rule": "floor = floor_factor (%.2f) x lowest reference value of that type" % f}})
    if write_floors:
        D._set_cfg("look", ["palette", "floors_type"], prop)
        D._set_cfg("look", ["palette", "style_palette"], style)
        D._set_cfg("look", ["palette", "off_share_max"], off_max)
        print("floors written to qa.json look.palette.floors_type")
    print(json.dumps(prop))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip", nargs="?")
    ap.add_argument("--range", help="a:b frames of CLIP, b exclusive")
    ap.add_argument("--ref", help="reference clip (reference mode)")
    ap.add_argument("--ref-range")
    ap.add_argument("--type", help="shot type for the floors (qa.json look.palette.floors_type)")
    ap.add_argument("--subject", help="crop w:h:x:y or matte video of the main subject (for value_sep)")
    ap.add_argument("--set-palette", help='JSON {"colors": [[r,g,b], ...]}: the palette of this set (default: the style palette in qa.json)')
    ap.add_argument("--out"); ap.add_argument("--name")
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--write-floors", action="store_true")
    a = ap.parse_args()
    cfg = D._cfg("palette")
    if a.calibrate:
        return calibrate(cfg, a.write_floors)
    if not a.clip:
        ap.error("CLIP is required")
    out, jpath, ipath = D._out_paths(a, a.clip, TOOL)
    try:
        clip_sha = C.sha(a.clip)
        checks, not_checked, extra, img = run_one(a.clip, C.parse_range(a.range), a.type, cfg,
                                                  a.ref, C.parse_range(a.ref_range), a.subject, a.set_palette)
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
