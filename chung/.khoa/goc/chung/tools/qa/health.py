"""health.py - clip health (gate G1, package Q1).

One sequential decode of the clip, at plumbing.analysis_size. Checks:
  container     frame count (decoded = container count, and = --frames when
                given), picture size, fps, first pts = 0
  blank_frames  frames whose mean luma is below blank_mean_y
  frozen_frames consecutive frames that are (almost) identical: d < frozen_d.
                In this style something always moves, so one is a failure
  still_runs    runs of at least still_run_frames frames with d < still_d
                (picture nearly standing still: camera AND subjects stopped)
  glitch_frames one frame very different from BOTH neighbours while the
                neighbours agree with each other, per tile: score =
                min(|f(n)-f(n-1)|, |f(n+1)-f(n)|) - max over the tiles within
                glitch_neighbour_px of |f(n+1)-f(n-1)| (tile means). The
                neighbourhood term keeps a fast object passing through a
                tile from counting: it is somewhere else on n+1, a glitch is
                back where it was. Measured twice: on coarse tiles
                (tile_px_at_analysis) and on fine tiles (glitch_tile_px).
                A frame fails when glitch_min_tiles or more coarse tiles
                score above glitch_tile_score, OR the fine tiles above it
                cover more than glitch_min_area_px (pixels at analysis
                size). Both floors are set by the reference itself, which
                uses one-frame smear poses and flashes: over all 34444
                frames its largest are 3 coarse tiles (frames 15657, 25840,
                28482, 30425) and 875 px fine (15657). A smaller one-frame
                fault cannot be told from the style by this test; the
                stills test below is what covers it.
                This is how a late texture or a missing element shows up
  two_frame_glitch
                the same test for a fault lasting two frames (n, n+1 against
                n-1 and n+2). The reference animates on twos and holds
                two-frame poses and flashes of up to 9275 px (frame 18830),
                so only areas above glitch2_min_area_px fail; the largest
                event is always reported and shown in the evidence image
                for a person to judge
  stills        (only with --stills) frame purity, the spec's test: a still
                picture of frame n rendered on its own is compared with
                frame n of the clip in tiles of stills_tile_px source
                pixels; the largest tile mean absolute difference (0-255,
                over R, G, B) must not exceed stills_max_tile_diff. A late
                texture or a missing element of ANY duration shows up when
                a still is given for an affected frame. Writes stills.jpg
  overexposed / crushed
                share of tiles in which at least clipped_tile_share of the
                pixels sit at >= over_level / <= crush_level
d = mean absolute luma difference (0-255) between consecutive frames.

STANDALONE mode (no reference): size and fps are judged against
plumbing.format, everything else against the floors in plumbing.health.
    python3 tools/qa/health.py out/shot-king.mp4 --frames 59
    python3 tools/qa/health.py ../ref/rover_doom.webm --range 0:540

    python3 tools/qa/health.py out/shot-king.mp4 --frames 59 --stills 0=st/f0.png,29=st/f29.png,58=st/f58.png

REFERENCE mode: additionally the frame count, size and fps must equal the
reference range, and the reference's own measured values are reported.
    python3 tools/qa/health.py out/full.mp4 --ref ../ref/rover_doom.webm --ref-range 0:540

Options: --range a:b (b exclusive), --frames N, --out DIR (default
qa/<clip stem>/health[-a-b]). Output: health.json, health.jpg.
Exit code: 0 pass, 1 fail, 2 could not measure.
Needs only numpy, Pillow, ffmpeg. Thresholds: qa.json -> plumbing.health.
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

TOOL = "health"
LUMA = np.array([0.299, 0.587, 0.114], np.float32)


def tiles_mean(a, t):
    h, w = a.shape
    th, tw = h // t, w // t
    return a[: th * t, : tw * t].reshape(th, t, tw, t).mean(axis=(1, 3))


def maxpool_sep(a, r):
    """Maximum over a (2r+1) x (2r+1) neighbourhood of tiles, separable."""
    h, w = a.shape
    p = np.pad(a, ((r, r), (0, 0)), mode="edge")
    o = a.copy()
    for dy in range(2 * r + 1):
        o = np.maximum(o, p[dy:dy + h])
    p = np.pad(o, ((0, 0), (r, r)), mode="edge")
    q = o.copy()
    for dx in range(2 * r + 1):
        q = np.maximum(q, p[:, dx:dx + w])
    return q


def bbox(mask, t):
    """Bounding box [x0, y0, x1, y1] in analysis pixels of the True tiles."""
    ys, xs = np.where(mask)
    if not len(ys):
        return None
    return [int(xs.min()) * t, int(ys.min()) * t, (int(xs.max()) + 1) * t, (int(ys.max()) + 1) * t]


def measure(path, start, end, cfg, size):
    """Sequential pass -> dict of per-frame lists. None when no frame decodes."""
    t = int(cfg["tile_px_at_analysis"])
    gt = int(cfg["glitch_tile_px"])
    gr = max(1, int(round(cfg["glitch_neighbour_px"] / float(gt))))
    cr_ = max(1, int(round(cfg["glitch_neighbour_px"] / float(t))))
    thr = cfg["glitch_tile_score"]
    ns, mean_y, d, over_share, crush_share, over_px, crush_px = [], [], [], [], [], [], []
    glitch = {}   # frame -> (area px, top score, bbox, coarse tiles)   one-frame fault on that frame
    glitch2 = {}  # first frame -> (area px, top score, bbox)   two-frame fault on n, n+1
    buf = []      # last 4 luma frames
    for n, f in C.frames(path, start, end, size=size):
        g = f.astype(np.float32) @ LUMA
        g_prev = buf[-1] if buf else None
        ns.append(n)
        mean_y.append(float(g.mean()))
        d.append(None if g_prev is None else float(np.abs(g - g_prev).mean()))
        ov = (g >= cfg["over_level"]).astype(np.float32)
        cr = (g <= cfg["crush_level"]).astype(np.float32)
        over_px.append(float(ov.mean()))
        crush_px.append(float(cr.mean()))
        over_share.append(float((tiles_mean(ov, t) >= cfg["clipped_tile_share"]).mean()))
        crush_share.append(float((tiles_mean(cr, t) >= cfg["clipped_tile_share"]).mean()))
        buf.append(g)
        if len(buf) > 4:
            buf.pop(0)
        for k, store in ((1, glitch), (2, glitch2)):
            if len(buf) < k + 2:
                continue
            g0, gf, gl = buf[-k - 2], buf[-k - 1], buf[-2]   # before, first faulty, last faulty; g = after
            a = tiles_mean(np.abs(gf - g0), gt)
            b = tiles_mean(np.abs(g - gl), gt)
            c = tiles_mean(np.abs(g - g0), gt)
            s = np.minimum(a, b) - maxpool_sep(c, gr)
            m = s > thr
            if k == 1:
                sc = (np.minimum(tiles_mean(np.abs(gf - g0), t), tiles_mean(np.abs(g - gl), t))
                      - maxpool_sep(tiles_mean(np.abs(g - g0), t), cr_))
                mc = sc > thr
                box = bbox(m, gt) or bbox(mc, t)
                store[n - k] = (int(m.sum()) * gt * gt, float(max(s.max(), sc.max())), box, int(mc.sum()))
            else:
                store[n - k] = (int(m.sum()) * gt * gt, float(s.max()), bbox(m, gt))
    if not ns:
        return None
    return {"ns": ns, "mean_y": mean_y, "d": d, "over_share": over_share, "crush_share": crush_share,
            "over_px": over_px, "crush_px": crush_px, "glitch": glitch, "glitch2": glitch2}


def runs_below(ns, d, thr, min_len):
    out, cur = [], []
    for n, v in zip(ns, d):
        if v is not None and v < thr:
            cur.append(n)
        else:
            if len(cur) >= min_len:
                out.append([cur[0], cur[-1]])
            cur = []
    if len(cur) >= min_len:
        out.append([cur[0], cur[-1]])
    return out


def summarise(m, cfg):
    ns = m["ns"]
    dd = [(n, v) for n, v in zip(ns, m["d"]) if v is not None]
    vals = np.array([v for _, v in dd]) if dd else np.array([0.0])
    mt, ma = float(cfg["glitch_min_tiles"]), float(cfg["glitch_min_area_px"])
    gl = sorted(((max(ct / mt, a / ma), a, sc, n, bb, ct) for n, (a, sc, bb, ct) in m["glitch"].items()),
                key=lambda x: x[:4], reverse=True)
    gl2 = sorted(((a, sc, n, bb) for n, (a, sc, bb) in m["glitch2"].items()), key=lambda x: x[:3], reverse=True)
    s = {
        "frames": len(ns),
        "mean_y_min": round(min(m["mean_y"]), 2), "mean_y_min_frame": ns[int(np.argmin(m["mean_y"]))],
        "mean_y_max": round(max(m["mean_y"]), 2),
        "d_min": round(float(vals.min()), 3), "d_min_frame": dd[int(vals.argmin())][0] if dd else None,
        "d_p5": round(float(np.percentile(vals, 5)), 3), "d_median": round(float(np.median(vals)), 3),
        "blank_frames": [n for n, y in zip(ns, m["mean_y"]) if y < cfg["blank_mean_y"]],
        "frozen_frames": [n for n, v in dd if v < cfg["frozen_d"]],
        "still_runs": runs_below(ns, m["d"], cfg["still_d"], int(cfg["still_run_frames"])),
        "glitch_top": [{"frame": n, "coarse_tiles": ct, "area_px": a, "score": round(sc, 2), "box_xyxy": bb}
                       for _, a, sc, n, bb, ct in gl[:5]],
        "glitch_frames": [n for _, a, sc, n, bb, ct in gl if ct >= mt or a > ma],
        "glitch2_top": [{"first_frame": n, "area_px": a, "score": round(sc, 2), "box_xyxy": bb}
                        for a, sc, n, bb in gl2[:5]],
        "glitch2_frames": [n for a, sc, n, bb in gl2 if a > cfg["glitch2_min_area_px"]],
        "over_tile_share_max": round(max(m["over_share"]), 4),
        "over_tile_share_max_frame": ns[int(np.argmax(m["over_share"]))],
        "over_pixel_share_max": round(max(m["over_px"]), 4),
        "crush_tile_share_max": round(max(m["crush_share"]), 4),
        "crush_tile_share_max_frame": ns[int(np.argmax(m["crush_share"]))],
        "crush_pixel_share_max": round(max(m["crush_px"]), 4),
    }
    return s


def paint_clip(f, cfg):
    g = f.astype(np.float32) @ LUMA
    o = f.copy()
    o[g >= cfg["over_level"]] = (255, 0, 0)
    o[g <= cfg["crush_level"]] = (0, 80, 255)
    return o


def evidence(path, s, cfg, size, out_path, clip_sha):
    """Rows of 3-4: lowest-d pair + diff; worst 1-frame fault; worst 2-frame fault; exposure."""
    t = int(cfg["tile_px_at_analysis"])
    want = set()
    nd = s["d_min_frame"]
    if nd is not None:
        want |= {nd - 1, nd}
    g = s["glitch_top"][0] if s["glitch_top"] else None
    if g:
        want |= {g["frame"] - 1, g["frame"], g["frame"] + 1}
    g2 = s["glitch2_top"][0] if s.get("glitch2_top") else None
    if g2:
        want |= {g2["first_frame"] - 1, g2["first_frame"], g2["first_frame"] + 1, g2["first_frame"] + 2}
    want |= {s["over_tile_share_max_frame"], s["crush_tile_share_max_frame"], s["mean_y_min_frame"]}
    got = {}
    for n, f in C.frames(path, max(0, min(want)), max(want) + 1, size=size):
        if n in want:
            got[n] = f
    blank = np.zeros((size[1], size[0], 3), np.uint8)
    ims, lbs = [], []
    if nd is not None and nd in got and nd - 1 in got:
        diff = np.abs(got[nd].astype(np.int16) - got[nd - 1].astype(np.int16))
        ims += [got[nd - 1], got[nd], np.clip(diff * 20, 0, 255).astype(np.uint8), blank]
        lbs += ["%d" % (nd - 1), "%d\nlowest d=%.3f" % (nd, s["d_min"]), "diff x20", ""]
    else:
        ims += [blank] * 4
        lbs += ["-", "-", "-", ""]
    def boxed(k, box):
        im = C.to_pil(got.get(k, blank)).copy()
        if box:
            ImageDraw.Draw(im).rectangle([box[0] - 2, box[1] - 2, box[2] + 2, box[3] + 2], outline=(255, 0, 255), width=2)
        return im

    if g:
        for k in (g["frame"] - 1, g["frame"], g["frame"] + 1):
            ims.append(boxed(k, g["box_xyxy"]))
            lbs.append("%d%s" % (k, ("\nworst 1-frame: %d tiles, %d px, top %.1f" % (g["coarse_tiles"], g["area_px"], g["score"]))
                                 if k == g["frame"] else ""))
        ims.append(blank)
        lbs.append("")
    else:
        ims += [blank] * 4
        lbs += ["-", "-", "-", ""]
    if g2:
        for k in range(g2["first_frame"] - 1, g2["first_frame"] + 3):
            ims.append(boxed(k, g2["box_xyxy"]))
            lbs.append("%d%s" % (k, ("\nworst 2-frame: %d px, top score %.1f" % (g2["area_px"], g2["score"]))
                                 if k == g2["first_frame"] else ""))
    else:
        ims += [blank] * 4
        lbs += ["-", "-", "-", "-"]
    fo, fc, fy = s["over_tile_share_max_frame"], s["crush_tile_share_max_frame"], s["mean_y_min_frame"]
    ims += [paint_clip(got.get(fo, blank), cfg), paint_clip(got.get(fc, blank), cfg), got.get(fy, blank), blank]
    lbs += ["%d over (red) tiles=%.3f" % (fo, s["over_tile_share_max"]),
            "%d crushed (blue) tiles=%.3f" % (fc, s["crush_tile_share_max"]),
            "%d darkest meanY=%.1f" % (fy, s["mean_y_min"]), ""]
    return C.save_evidence(C.tile(ims, lbs, 4), out_path, clip_sha)


def check_stills(clip, stills, cfg, out_path, clip_sha):
    """Compare still pictures with the same frames of the clip, tile by tile. -> check dict."""
    t = int(cfg["stills_tile_px"])
    lim = float(cfg["stills_max_tile_diff"])
    want = sorted(stills)
    got = {}
    for n, f in C.frames(clip, want[0], want[-1] + 1):
        if n in stills:
            got[n] = f
    rows, ims, lbs, bad = [], [], [], False
    for n in want:
        row = {"frame": n, "still": stills[n]}
        if n not in got:
            row["problem"] = "the clip has no frame %d" % n
            bad = True
            rows.append(row)
            continue
        st = np.asarray(Image.open(stills[n]).convert("RGB"))
        cf = got[n]
        if st.shape != cf.shape:
            row["problem"] = "still is %dx%d, clip is %dx%d" % (st.shape[1], st.shape[0], cf.shape[1], cf.shape[0])
            bad = True
            rows.append(row)
            continue
        diff = np.abs(st.astype(np.float32) - cf.astype(np.float32)).mean(axis=2)
        h, w = diff.shape
        th, tw = -(-h // t), -(-w // t)
        tm_ = np.zeros((th, tw), np.float32)
        for y in range(th):
            for x in range(tw):
                tm_[y, x] = diff[y * t:(y + 1) * t, x * t:(x + 1) * t].mean()
        k = int(tm_.argmax())
        r, c = k // tw, k % tw
        row.update({"max_tile_diff": round(float(tm_.max()), 2), "worst_tile_xy": [c * t, r * t],
                    "tiles_over": int((tm_ > lim).sum()), "mean_diff": round(float(diff.mean()), 2)})
        bad = bad or tm_.max() > lim
        rows.append(row)
        small = (480, int(round(480 * h / w)))
        k_ = small[0] / float(w)
        for im in (st, cf, np.clip(diff * 8, 0, 255).astype(np.uint8)):
            im = C.to_pil(im).resize(small, Image.BILINEAR)
            ImageDraw.Draw(im).rectangle([c * t * k_, r * t * k_, (c + 1) * t * k_, (r + 1) * t * k_],
                                         outline=(255, 0, 255), width=2)
            ims.append(im)
        lbs += ["still %d" % n, "clip %d\nworst tile %.1f (limit %s)" % (n, tm_.max(), cfg["stills_max_tile_diff"]),
                "difference x8, %d tiles over" % int((tm_ > lim).sum())]
    if ims:
        C.save_evidence(C.tile(ims, lbs, 3), out_path, clip_sha)
    return C.check("stills", C.FAIL if bad else C.PASS, rows,
                   "largest mean difference in a %d px tile <= %s on every still" % (t, cfg["stills_max_tile_diff"]))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip")
    ap.add_argument("--range", dest="rng", help="a:b frame range, b exclusive")
    ap.add_argument("--frames", type=int, help="expected number of frames (contract len)")
    ap.add_argument("--stills", help="frame=path[,frame=path...]: still pictures rendered on their own, compared "
                                     "with the same frame of the clip (frame numbers in the clip file)")
    ap.add_argument("--ref", help="reference clip (reference mode)")
    ap.add_argument("--ref-range", help="a:b frame range in the reference")
    ap.add_argument("--out", help="output folder")
    args = ap.parse_args()

    cfg_all = C.load_cfg("plumbing")
    cfg, fmt = cfg_all.get("health"), cfg_all.get("format")
    if not cfg or not fmt or "analysis_size" not in cfg_all:
        print("health: qa.json has no plumbing.health / format / analysis_size; cannot measure")
        return 2
    need = ("glitch_tile_px", "glitch_neighbour_px", "glitch_min_area_px", "glitch2_min_area_px", "glitch_min_tiles",
            "stills_tile_px", "stills_max_tile_diff")
    if any(k not in cfg for k in need):
        print("health: qa.json plumbing.health lacks %s; cannot measure" % [k for k in need if k not in cfg])
        return 2
    size = tuple(cfg_all["analysis_size"])
    try:
        start, end = C.parse_range(args.rng)
        rs, re_ = C.parse_range(args.ref_range)
        if start < 0 or rs < 0 or (end is not None and end <= start) or (re_ is not None and re_ <= rs):
            raise ValueError("range must be a:b with 0 <= a < b")
        stills = {}
        for item in (args.stills or "").split(","):
            if item.strip():
                k, sep, v = item.partition("=")
                if not sep or int(k) < 0:
                    raise ValueError("--stills wants frame=path, got %r" % item)
                stills[int(k)] = v
    except ValueError as e:
        print("health: could not measure (usage error): %s" % e)
        return 2
    suffix = "" if not args.rng else "-%d-%s" % (start, end if end is not None else "end")
    out = args.out or C.evidence_dir(args.clip, "health" + suffix)
    os.makedirs(out, exist_ok=True)
    res_path, img_path = os.path.join(out, "health.json"), os.path.join(out, "health.jpg")
    mode = "reference" if args.ref else "standalone"

    try:
        inf = C.info(args.clip)
        clip_sha = C.sha(args.clip)
        m = measure(args.clip, start, end, cfg, size)
    except Exception as e:
        rc = C.write_result(res_path, TOOL, [C.check("decode", C.UNMEASURED, note=str(e)[:300])],
                            ["everything: the clip could not be probed or decoded"])
        print("health: could not measure: %s" % e)
        return rc
    if m is None:
        rc = C.write_result(res_path, TOOL, [C.check("decode", C.FAIL, 0, "at least 1 frame in range")],
                            ["everything else: no frame decoded in the range"])
        print("health: FAIL, no frame decoded in range")
        return rc
    s = summarise(m, cfg)
    checks = []
    whole = start == 0 and end is None
    n_dec = s["frames"]

    # container
    if whole:
        checks.append(C.check("decoded_equals_container", C.PASS if n_dec == inf["frames"] else C.FAIL,
                              {"decoded": n_dec, "container_packets": inf["frames"]}, "equal"))
    if args.frames is not None:
        checks.append(C.check("frame_count", C.PASS if n_dec == args.frames else C.FAIL, n_dec, args.frames))
    elif end is not None:
        checks.append(C.check("frame_count", C.PASS if n_dec == end - start else C.FAIL, n_dec,
                              "%d (the requested range)" % (end - start)))
    else:
        checks.append(C.check("frame_count", C.UNMEASURED, n_dec, None, "no --frames given: nothing to compare with"))
    checks.append(C.check("size", C.PASS if (inf["width"], inf["height"]) == (fmt["width"], fmt["height"]) else C.FAIL,
                          [inf["width"], inf["height"]], [fmt["width"], fmt["height"]]))
    checks.append(C.check("fps", C.PASS if abs(inf["fps"] - fmt["fps"]) <= fmt["fps_tolerance"] else C.FAIL,
                          inf["fps"], fmt["fps"]))
    ok_pts = inf["first_pts"] == inf["first_pts"] and abs(inf["first_pts"]) <= fmt["first_pts_tolerance_s"]
    checks.append(C.check("first_pts", C.PASS if ok_pts else C.FAIL, inf["first_pts"], 0.0))
    # picture
    checks.append(C.check("blank_frames", C.FAIL if s["blank_frames"] else C.PASS,
                          {"frames": s["blank_frames"][:20], "count": len(s["blank_frames"]), "mean_y_min": s["mean_y_min"]},
                          "mean luma >= %s on every frame" % cfg["blank_mean_y"]))
    if n_dec >= 2:
        checks.append(C.check("frozen_frames", C.FAIL if s["frozen_frames"] else C.PASS,
                              {"frames": s["frozen_frames"][:20], "count": len(s["frozen_frames"]),
                               "d_min": s["d_min"], "d_min_frame": s["d_min_frame"]},
                              "d >= %s on every frame" % cfg["frozen_d"]))
        checks.append(C.check("still_runs", C.FAIL if s["still_runs"] else C.PASS,
                              {"runs_first_last": s["still_runs"][:20], "d_p5": s["d_p5"], "d_median": s["d_median"]},
                              "no run of %d+ frames with d < %s" % (cfg["still_run_frames"], cfg["still_d"])))
    else:
        checks.append(C.check("frozen_frames", C.UNMEASURED, note="needs 2 frames"))
        checks.append(C.check("still_runs", C.UNMEASURED, note="needs 2 frames"))
    if n_dec >= 3:
        checks.append(C.check("glitch_frames", C.FAIL if s["glitch_frames"] else C.PASS,
                              {"frames": sorted(s["glitch_frames"])[:20], "count": len(s["glitch_frames"]),
                               "top": s["glitch_top"][:3]},
                              "1-frame score > %s on fewer than %s tiles of %s px and on at most %s px of fine tiles"
                              % (cfg["glitch_tile_score"], cfg["glitch_min_tiles"], cfg["tile_px_at_analysis"],
                                 cfg["glitch_min_area_px"])))
    else:
        checks.append(C.check("glitch_frames", C.UNMEASURED, note="needs 3 frames"))
    if n_dec >= 4:
        checks.append(C.check("two_frame_glitch", C.FAIL if s["glitch2_frames"] else C.PASS,
                              {"first_frames": sorted(s["glitch2_frames"])[:20], "count": len(s["glitch2_frames"]),
                               "top": s["glitch2_top"][:3]},
                              "tiles with 2-frame score > %s cover at most %s px (analysis size)"
                              % (cfg["glitch_tile_score"], cfg["glitch2_min_area_px"])))
    else:
        checks.append(C.check("two_frame_glitch", C.UNMEASURED, note="needs 4 frames"))
    checks.append(C.check("overexposed", C.PASS if s["over_tile_share_max"] <= cfg["max_over_tile_share"] else C.FAIL,
                          {"tile_share_max": s["over_tile_share_max"], "frame": s["over_tile_share_max_frame"],
                           "pixel_share_max": s["over_pixel_share_max"]},
                          "share of tiles clipped at >= %s stays <= %s" % (cfg["over_level"], cfg["max_over_tile_share"])))
    checks.append(C.check("crushed", C.PASS if s["crush_tile_share_max"] <= cfg["max_crush_tile_share"] else C.FAIL,
                          {"tile_share_max": s["crush_tile_share_max"], "frame": s["crush_tile_share_max_frame"],
                           "pixel_share_max": s["crush_pixel_share_max"]},
                          "share of tiles clipped at <= %s stays <= %s" % (cfg["crush_level"], cfg["max_crush_tile_share"])))

    extra = {"mode": mode, "clip": os.path.abspath(args.clip), "clip_sha256": clip_sha, "info": inf,
             "range": [m["ns"][0], m["ns"][-1] + 1], "measured": s, "thresholds": cfg, "format": fmt,
             "analysis_size": list(size)}
    not_checked = ["tsc and lint of the shot source (lint.py, not in this package)",
                   "clip newer than its sources",
                   "every src file exists and has an approved sha (approved.json does not exist yet)",
                   ("frames without a still: %d of %d frames have one" % (len(stills), n_dec)) if stills else
                   "PNG stills of frames 0, mid, last against the clip (frame purity): no --stills given",
                   "one-frame faults on fewer than %d tiles of %d px and on %d px or less of fine tiles at analysis "
                   "size (roughly below 240 x 240 px of a 1280 px wide picture, more where the fault resembles what "
                   "it covers): the reference's own one-frame smear poses and flashes are that large; give --stills"
                   % (cfg["glitch_min_tiles"], cfg["tile_px_at_analysis"], cfg["glitch_min_area_px"]),
                   "two-frame faults covering %d px or less at analysis size (about %d x %d px): the reference "
                   "holds two-frame poses and flashes that large; see the largest one in the evidence image; give --stills"
                   % (cfg["glitch2_min_area_px"], int(cfg["glitch2_min_area_px"] ** 0.5 * 4), int(cfg["glitch2_min_area_px"] ** 0.5 * 4)),
                   "faults lasting 3 or more frames; faults whose picture differs from the right one by less than "
                   "glitch_tile_score",
                   "audio"]

    still_img = None
    if stills:
        still_img = os.path.join(out, "stills.jpg")
        try:
            checks.append(check_stills(args.clip, stills, cfg, still_img, clip_sha))
            extra.setdefault("evidence_extra", []).append(still_img)
        except Exception as e:
            still_img = None
            checks.append(C.check("stills", C.UNMEASURED, note=str(e)[:300]))

    if args.ref:
        try:
            rinf = C.info(args.ref)
            rm = measure(args.ref, rs, re_, cfg, size)
            rsum = summarise(rm, cfg) if rm else None
        except Exception as e:
            rsum = None
            checks.append(C.check("ref_readable", C.UNMEASURED, note=str(e)[:200]))
        if rsum:
            checks.append(C.check("frames_equal_ref", C.PASS if n_dec == rsum["frames"] else C.FAIL,
                                  {"ours": n_dec, "ref": rsum["frames"]}, "equal"))
            checks.append(C.check("size_equal_ref",
                                  C.PASS if (inf["width"], inf["height"]) == (rinf["width"], rinf["height"]) else C.FAIL,
                                  {"ours": [inf["width"], inf["height"]], "ref": [rinf["width"], rinf["height"]]}, "equal"))
            checks.append(C.check("fps_equal_ref", C.PASS if abs(inf["fps"] - rinf["fps"]) <= fmt["fps_tolerance"] else C.FAIL,
                                  {"ours": inf["fps"], "ref": rinf["fps"]}, "equal"))
            extra["ref"] = {"clip": os.path.abspath(args.ref), "info": rinf, "measured": rsum}
            not_checked.append("any picture comparison with the reference (this tool only compares container facts)")

    try:
        ecode = evidence(args.clip, s, cfg, size, img_path, clip_sha)
        extra["evidence"] = [{"file": img_path, "code": ecode}]
        if still_img:
            extra["evidence"].append({"file": still_img, "code": C.code(clip_sha, still_img)})
    except Exception as e:
        extra["evidence"] = []
        not_checked.append("evidence image could not be written: %s" % str(e)[:200])
    rc = C.write_result(res_path, TOOL, checks, not_checked, extra)
    C.print_summary(TOOL + " (" + mode + ")", checks, not_checked, res_path, [img_path] + ([still_img] if still_img else []))
    return rc


if __name__ == "__main__":
    sys.exit(main())
