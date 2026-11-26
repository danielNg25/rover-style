"""cuts.py - find cuts and hidden changes in a clip (gate G0 / G2, package Q1).

Finds, by one sequential decode:
  * hard cuts: frame n is the first frame of a new shot when the mean luma
    difference d(n-1, n) exceeds plumbing.cuts.cut_d AND EITHER
      (A) d is more than cut_ratio_to_local_median times the median d of
          the surrounding window (a cut between two calm stretches), OR
      (B) the colour histograms change abruptly: the mean over the grid
          cells of the cell histogram change is at least cut_hist_mean and
          at least cut_hist_peak_ratio times the same value on the frame
          before and on the frame after. (B) finds a cut that is followed
          or preceded by fast camera motion, where the local median of d is
          high: motion changes the histograms a little on every frame, a
          cut changes them a lot on one frame.
  * gradual transitions ("dissolves": dissolve, fade, a flash that fills
    the frame): a run of at least dissolve_min_frames consecutive frames
    that are not cuts and on each of which the mean cell histogram change
    is at least dissolve_hist_mean, or a cell changes like a swap (below).
    Reported as one event first-last.
  * in-place swaps of the main subject (one character replacing another on
    the same spot without a cut): in a grid of cells, the soft colour
    histogram of at least one cell changes by more than swap_cell_hist
    between n-1 and n, the change persists swap_persist_frames later, the
    frame is not a hard cut and not part of a gradual transition, and the
    change is a spike: at least swap_peak_ratio times that cell's change on
    the nearest frames before and after that are not cuts. A pose change
    keeps the colours of a cell, a replaced subject does not.

Frame numbers are indices in the source file (0-based). "Cut at n" means n is
the first frame of the new shot.

STANDALONE mode (no reference): verify a clip against a DECLARED list.
    python3 tools/qa/cuts.py out/full.mp4 --cuts 47,76,98,142,173,232,291,313,332,366,401,450 --swaps 219
    python3 tools/qa/cuts.py ../ref/rover_doom.webm --range 173:232 --cuts none
    python3 tools/qa/cuts.py ../ref/rover_doom.webm --range 737:900 --cuts 791 --dissolves 814-821,843-849
  --cuts none  declares "this range is one shot". --dissolves takes
  first-last pairs (source frame numbers, both inclusive; each end may be
  off by dissolve_tolerance_frames). Any cut, swap or dissolve that is
  found but not declared is a hidden change -> FAIL. A declared one that is
  not found -> FAIL. A declared frame outside the analysed range (or on its
  first frame, which cannot be tested) -> FAIL. When --range has an end,
  or --frames N is given, the number of frames analysed must equal it ->
  otherwise FAIL (a range past the end of the clip is not truncated
  silently). Without --cuts the tool only discovers: the list is printed
  and the verdict is UNMEASURED (exit 2). A malformed list or range is a
  usage error: UNMEASURED, exit 2.

REFERENCE mode: compare the cut, swap and dissolve lists of two clips
(positions relative to the start of each range).
    python3 tools/qa/cuts.py out/full.mp4 --ref ../ref/rover_doom.webm --ref-range 0:540

Options: --range a:b (b exclusive), --frames N, --out DIR (default qa/<clip stem>/cuts[-a-b]).
Output: cuts.json, cuts.jpg (d curve and 4 frames around every event).
Exit code: 0 pass, 1 fail, 2 could not measure.
Needs only numpy, Pillow, ffmpeg. Thresholds: qa.json -> plumbing.cuts.
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

TOOL = "cuts"
LUMA = np.array([0.299, 0.587, 0.114], np.float32)


def cell_hists(f, gx, gy, step):
    """Soft (trilinear) colour histogram per grid cell -> (gy*gx, bins)."""
    h, w, _ = f.shape
    nb = 256 // step + 1
    x = f.astype(np.float32) / step
    i0 = np.floor(x).astype(np.int32)
    fr = x - i0
    out = np.zeros((gy * gx, nb ** 3), np.float32)
    for cy in range(gy):
        for cx in range(gx):
            sl = (slice(cy * h // gy, (cy + 1) * h // gy), slice(cx * w // gx, (cx + 1) * w // gx))
            a = i0[sl].reshape(-1, 3)
            b = fr[sl].reshape(-1, 3)
            acc = np.zeros(nb ** 3, np.float64)
            for dr in (0, 1):
                for dg in (0, 1):
                    for db in (0, 1):
                        wgt = ((b[:, 0] if dr else 1 - b[:, 0]) * (b[:, 1] if dg else 1 - b[:, 1])
                               * (b[:, 2] if db else 1 - b[:, 2]))
                        idx = ((a[:, 0] + dr) * nb + (a[:, 1] + dg)) * nb + (a[:, 2] + db)
                        acc += np.bincount(idx, wgt, nb ** 3)
            out[cy * gx + cx] = acc / max(1, len(a))
    return out


def analyse(path, start, end, cfg, size):
    """One sequential pass. Returns dict with per-frame arrays and events."""
    gx, gy = cfg["grid"]
    step = int(cfg["hist_bin_step"])
    ns, d, H = [], [], []
    prev = None
    for n, f in C.frames(path, start, end, size=size):
        g = f.astype(np.float32) @ LUMA
        ns.append(n)
        d.append(0.0 if prev is None else float(np.abs(g - prev).mean()))
        H.append(cell_hists(f, gx, gy, step))
        prev = g
    if len(ns) < 3:
        return None
    d = np.array(d)
    H = np.stack(H)
    N = len(ns)
    hd = np.zeros((N, gx * gy))
    hd[1:] = 0.5 * np.abs(H[1:] - H[:-1]).sum(-1)
    half = int(cfg["local_window_frames"]) // 2
    med = np.zeros(N)
    for i in range(1, N):
        lo, hi = max(1, i - half), min(N, i + half + 1)
        w = np.concatenate([d[lo:i], d[i + 1:hi]])
        med[i] = float(np.median(w)) if len(w) else 0.0
    hm = hd.mean(1)
    is_cut = np.zeros(N, bool)
    rule = {}
    for i in range(1, N):
        if d[i] <= cfg["cut_d"]:
            continue
        if d[i] > cfg["cut_ratio_to_local_median"] * max(med[i], 1e-6):
            is_cut[i], rule[i] = True, "A"
            continue
        nb = max(hm[i - 1], hm[i + 1] if i + 1 < N else 0.0)
        if hm[i] >= cfg["cut_hist_mean"] and hm[i] >= cfg["cut_hist_peak_ratio"] * nb:
            is_cut[i], rule[i] = True, "B"
    persist = int(cfg["swap_persist_frames"])
    cand = {}
    for i in range(1, N):
        if is_cut[i]:
            continue
        m = float(hd[i].max())
        if m > cfg["swap_cell_hist"]:
            j = i
            while j + 1 < N and j < i + persist and not is_cut[j + 1]:
                j += 1
            cell = int(hd[i].argmax())
            later = float(0.5 * np.abs(H[j, cell] - H[i - 1, cell]).sum())
            if later >= cfg["swap_persist_share"] * m:
                cand[i] = (m, cell, later, j - i)
    flag = np.zeros(N, bool)
    for i in range(1, N):
        flag[i] = (not is_cut[i]) and (hm[i] >= cfg["dissolve_hist_mean"] or i in cand)
    cuts, swaps, dissolves = [], [], []
    in_run = np.zeros(N, bool)
    i = 1
    while i < N:
        if not flag[i]:
            i += 1
            continue
        j = i
        while j + 1 < N and flag[j + 1]:
            j += 1
        if j - i + 1 >= int(cfg["dissolve_min_frames"]):
            in_run[i:j + 1] = True
            dissolves.append({"first": ns[i], "last": ns[j], "frames": j - i + 1,
                              "d_max": round(float(d[i:j + 1].max()), 2),
                              "mean_cell_hist_max": round(float(hm[i:j + 1].max()), 3),
                              "touches_range_end": bool(j == N - 1)})
        i = j + 1
    for i in range(1, N):
        if is_cut[i]:
            cuts.append({"frame": ns[i], "d": round(float(d[i]), 2),
                         "local_median_d": round(float(med[i]), 2),
                         "max_cell_hist": round(float(hd[i].max()), 3),
                         "mean_cell_hist": round(float(hm[i]), 3), "rule": rule[i]})
        elif i in cand and not in_run[i]:
            m, cell, later, gap = cand[i]
            lo = i - 1
            while lo > 0 and is_cut[lo]:
                lo -= 1
            hi = i + 1
            while hi < N and is_cut[hi]:
                hi += 1
            nb = max(float(hd[lo, cell]) if lo >= 1 else 0.0, float(hd[hi, cell]) if hi < N else 0.0)
            if m >= cfg["swap_peak_ratio"] * nb:
                swaps.append({"frame": ns[i], "d": round(float(d[i]), 2), "cell_hist": round(m, 3),
                              "cell_hist_after_%d_frames" % gap: round(later, 3),
                              "cell_hist_neighbours_max": round(nb, 3),
                              "cell_col_row": [cell % gx, cell // gx]})
    return {"ns": ns, "d": d, "hd_max": hd.max(1), "hm": hm, "med": med, "cuts": cuts, "swaps": swaps, "dissolves": dissolves}


def plot(a, cfg, declared_cuts, declared_swaps, declared_dis=(), width=1296, height=260):
    """d curve (log scale) with found and declared events."""
    im = Image.new("RGB", (width, height), (18, 18, 18))
    dr = ImageDraw.Draw(im)
    ns, d = a["ns"], a["d"]
    x0, x1, y0, y1 = 44, width - 10, 16, height - 26
    lo, hi = np.log10(0.1), np.log10(255.0)

    def X(n):
        return x0 + (x1 - x0) * (n - ns[0]) / max(1, ns[-1] - ns[0])

    def Y(v):
        return y1 - (y1 - y0) * (np.log10(max(v, 0.1)) - lo) / (hi - lo)

    for v in (0.1, 1, 10, 100):
        dr.line([x0, Y(v), x1, Y(v)], fill=(50, 50, 50))
        dr.text((4, Y(v) - 6), str(v), fill=(150, 150, 150))
    dr.line([x0, Y(cfg["cut_d"]), x1, Y(cfg["cut_d"])], fill=(120, 40, 40))
    for s, e in declared_dis or []:
        dr.rectangle([X(s), y0, X(e), y1], fill=(50, 40, 10))
    for q in a["dissolves"]:
        dr.rectangle([X(q["first"]), y1 - 6, X(q["last"]) + 1, y1], fill=(255, 190, 40))
        dr.text((X(q["first"]) - 10, y1 + 12), "d%d-%d" % (q["first"], q["last"]), fill=(255, 190, 40))
    for n in declared_cuts or []:
        dr.line([X(n), y0, X(n), y1], fill=(60, 60, 140))
    for n in declared_swaps or []:
        dr.line([X(n), y0, X(n), y1], fill=(60, 120, 60))
    pts = [(X(n), Y(v)) for n, v in zip(ns[1:], d[1:])]
    if len(pts) > 1:
        dr.line(pts, fill=(230, 230, 230))
    for c in a["cuts"]:
        dr.ellipse([X(c["frame"]) - 4, Y(c["d"]) - 4, X(c["frame"]) + 4, Y(c["d"]) + 4], outline=(255, 80, 80), width=2)
        dr.text((X(c["frame"]) - 10, y1 + 2), str(c["frame"]), fill=(255, 120, 120))
    for s in a["swaps"]:
        dr.rectangle([X(s["frame"]) - 4, Y(s["d"]) - 4, X(s["frame"]) + 4, Y(s["d"]) + 4], outline=(80, 255, 80), width=2)
        dr.text((X(s["frame"]) - 10, y1 + 12), "s%d" % s["frame"], fill=(120, 255, 120))
    dr.text((x0, 2), "d per frame (log). circle = cut found, square = swap found, orange bar = dissolve found, "
                     "blue line = declared cut, green line = declared swap, brown band = declared dissolve, red line = cut_d", fill=(200, 200, 200))
    return im


def evidence(path, a, events, cfg, size, declared_cuts, declared_swaps, declared_dis, out_path, clip_sha):
    """Curve on top; under it one row of 4 frames (n-2 .. n+1) per event."""
    events = events[: int(cfg["evidence_max_events"])]
    want = {}
    def span(n):
        return (n[0] - 1, n[0], n[1], n[1] + 1) if isinstance(n, tuple) else (n - 2, n - 1, n, n + 1)

    for label, n in events:
        for k in span(n):
            want[k] = None
    if want:
        lo, hi = max(0, min(want)), max(want) + 1
        for n, f in C.frames(path, lo, hi, size=size):
            if n in want:
                want[n] = f
    rows = []
    blank = np.zeros((size[1], size[0], 3), np.uint8)
    for label, n in events:
        ims, lbs = [], []
        mark = n[0] if isinstance(n, tuple) else n
        for k in span(n):
            f = want.get(k)
            ims.append(blank if f is None else f)
            lbs.append("%d%s" % (k, ("\n" + label) if k == mark else ""))
        rows.append(C.tile(ims, lbs, 4))
    top = plot(a, cfg, declared_cuts, declared_swaps, declared_dis, width=rows[0].width if rows else 1296)
    sheet = Image.new("RGB", (top.width, top.height + sum(r.height for r in rows)), (18, 18, 18))
    sheet.paste(top, (0, 0))
    y = top.height
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height
    return C.save_evidence(sheet, out_path, clip_sha)


def parse_list(text):
    if text is None:
        return None
    t = text.strip().lower()
    if t in ("none", ""):
        return []
    return sorted(int(x) for x in t.replace(" ", "").split(",") if x != "")


def parse_pairs(text):
    """'601-607,815-821' -> [(601, 607), (815, 821)]; None / 'none' -> []."""
    if text is None or text.strip().lower() in ("none", ""):
        return []
    out = []
    for x in text.replace(" ", "").split(","):
        if x == "":
            continue
        a, sep, b = x.partition("-")
        if not sep or int(b) < int(a) or int(a) < 0:
            raise ValueError("dissolve must be first-last, got %r" % x)
        out.append((int(a), int(b)))
    return sorted(out)


def compare_pairs(found, declared, tol):
    """Pairs agree when both ends are within tol. -> (hidden, missing)."""
    def same(p, q):
        return abs(p[0] - q[0]) <= tol and abs(p[1] - q[1]) <= tol
    hidden = [list(f) for f in found if not any(same(f, x) for x in declared)]
    missing = [list(x) for x in declared if not any(same(f, x) for f in found)]
    return hidden, missing


def compare_declared(found, declared, tol):
    """-> (hidden: found not declared, missing: declared not found)."""
    hidden = [f for f in found if not any(abs(f - x) <= tol for x in declared)]
    missing = [x for x in declared if not any(abs(f - x) <= tol for f in found)]
    return hidden, missing


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip")
    ap.add_argument("--range", dest="rng", help="a:b frame range in the clip, b exclusive")
    ap.add_argument("--cuts", help="declared cuts, comma list of source frame numbers, or 'none'")
    ap.add_argument("--swaps", help="declared in-place swaps, comma list, or 'none' (default none)")
    ap.add_argument("--dissolves", help="declared gradual transitions, comma list of first-last, or 'none' (default none)")
    ap.add_argument("--frames", type=int, help="expected number of frames analysed")
    ap.add_argument("--ref", help="reference clip (reference mode)")
    ap.add_argument("--ref-range", help="a:b frame range in the reference")
    ap.add_argument("--out", help="output folder")
    args = ap.parse_args()

    cfg_all = C.load_cfg("plumbing")
    cfg = cfg_all.get("cuts")
    if not cfg or "analysis_size" not in cfg_all:
        print("cuts: qa.json has no plumbing.cuts / plumbing.analysis_size; cannot measure")
        return 2
    need = ("cut_hist_mean", "cut_hist_peak_ratio", "dissolve_hist_mean", "dissolve_min_frames",
            "dissolve_tolerance_frames", "swap_peak_ratio")
    if any(k not in cfg for k in need):
        print("cuts: qa.json plumbing.cuts lacks %s; cannot measure" % [k for k in need if k not in cfg])
        return 2
    size = tuple(cfg_all["analysis_size"])
    usage = None
    start, end, rs, re_ = 0, None, 0, None
    declared_cuts, declared_swaps, declared_dis = None, [], []
    try:
        start, end = C.parse_range(args.rng)
        rs, re_ = C.parse_range(args.ref_range)
        declared_cuts = parse_list(args.cuts)
        declared_swaps = parse_list(args.swaps) or []
        declared_dis = parse_pairs(args.dissolves)
        if start < 0 or rs < 0 or any(x < 0 for x in (declared_cuts or []) + declared_swaps):
            raise ValueError("frame numbers must not be negative")
        if (end is not None and end <= start) or (re_ is not None and re_ <= rs):
            raise ValueError("range end must be after its start")
    except ValueError as e:
        usage = str(e)
        start, end = 0, None
    suffix = "" if (not args.rng or usage) else "-%d-%s" % (start, end if end is not None else "end")
    out = args.out or C.evidence_dir(args.clip, "cuts" + suffix)
    os.makedirs(out, exist_ok=True)
    res_path = os.path.join(out, "cuts.json")
    img_path = os.path.join(out, "cuts.jpg")
    if usage:
        rc = C.write_result(res_path, TOOL, [C.check("arguments", C.UNMEASURED, note="usage error: " + usage[:300])],
                            ["everything: --range / --ref-range / --cuts / --swaps / --dissolves could not be read"])
        print("cuts: could not measure (usage error): %s" % usage)
        return rc

    try:
        clip_sha = C.sha(args.clip)
        a = analyse(args.clip, start, end, cfg, size)
    except Exception as e:  # could not decode
        rc = C.write_result(res_path, TOOL, [C.check("decode", C.UNMEASURED, note=str(e)[:300])],
                            ["everything: the clip could not be decoded"])
        print("cuts: could not measure: %s" % e)
        return rc
    if a is None:
        rc = C.write_result(res_path, TOOL, [C.check("decode", C.UNMEASURED, note="fewer than 3 frames")],
                            ["everything: fewer than 3 frames in range"])
        print("cuts: could not measure: fewer than 3 frames")
        return rc

    tol = int(cfg["declared_tolerance_frames"])
    dtol = int(cfg["dissolve_tolerance_frames"])
    found_dis = [(q["first"], q["last"]) for q in a["dissolves"]]
    found_cuts = [c["frame"] for c in a["cuts"]]
    found_swaps = [s["frame"] for s in a["swaps"]]
    first, last = a["ns"][0], a["ns"][-1]
    checks = []
    events = ([("CUT", n) for n in found_cuts] + [("SWAP", n) for n in found_swaps]
              + [("DISSOLVE %d-%d" % q, q) for q in found_dis])
    want_n = args.frames if args.frames is not None else (end - start if end is not None else None)
    if want_n is not None:
        checks.append(C.check("frame_count", C.PASS if len(a["ns"]) == want_n else C.FAIL, len(a["ns"]),
                              "%d (%s)" % (want_n, "--frames" if args.frames is not None else "the requested range")))
    mode = "reference" if args.ref else "standalone"
    extra = {"mode": mode, "clip": os.path.abspath(args.clip), "clip_sha256": clip_sha,
             "range": [first, last + 1], "frames_analysed": len(a["ns"]),
             "found_cuts": a["cuts"], "found_swaps": a["swaps"], "found_dissolves": a["dissolves"],
             "thresholds": cfg,
             "analysis_size": list(size),
             "largest_d_not_a_cut": None, "largest_cell_hist_not_an_event": None}
    in_dis = set(n for s_, e_ in found_dis for n in range(s_, e_ + 1))
    non = [i for i in range(1, len(a["ns"])) if a["ns"][i] not in found_cuts]
    if non:
        i = max(non, key=lambda k: a["d"][k])
        extra["largest_d_not_a_cut"] = {"frame": a["ns"][i], "d": round(float(a["d"][i]), 2)}
        non2 = [k for k in non if a["ns"][k] not in found_swaps and a["ns"][k] not in in_dis]
        if non2:
            i = max(non2, key=lambda k: a["hd_max"][k])
            extra["largest_cell_hist_not_an_event"] = {"frame": a["ns"][i],
                                                       "cell_hist": round(float(a["hd_max"][i]), 3)}
            i = max(non2, key=lambda k: a["hm"][k])
            extra["largest_mean_cell_hist_not_an_event"] = {"frame": a["ns"][i],
                                                            "mean_cell_hist": round(float(a["hm"][i]), 3)}
    not_checked = ["wipes and slides, and gradual transitions weaker than dissolve_hist_mean per frame or shorter "
                   "than dissolve_min_frames frames; what kind of gradual transition it is (dissolve, fade, flash)",
                   "a change of subject during fast motion, when the cell's histogram change on the neighbouring "
                   "frames is more than 1/swap_peak_ratio of the change itself",
                   "a cut with fast motion on both sides whose histogram change is below cut_hist_mean",
                   "a cut on the first frame of the range (there is no previous frame to compare)",
                   "swaps where the new subject has the same colours as the old one",
                   "whether every moving thing is declared as an element with a kind (contract check, not built)"]

    if declared_cuts is not None:
        dc = [x for x in declared_cuts if first < x <= last]
        ds = [x for x in declared_swaps if first < x <= last]
        dd = [q for q in declared_dis if first < q[0] and q[1] <= last]
        outside = {"cuts": [x for x in declared_cuts if not (first < x <= last)],
                   "swaps": [x for x in declared_swaps if not (first < x <= last)],
                   "dissolves": [list(q) for q in declared_dis if not (first < q[0] and q[1] <= last)]}
        checks.append(C.check("declared_inside_range", C.FAIL if any(outside.values()) else C.PASS, outside,
                              "every declared frame n has %d < n <= %d (frames analysed %d..%d)" % (first, last, first, last)))
        hd_, md_ = compare_pairs(found_dis, dd, dtol)
        hidden, missing = compare_declared(found_cuts, dc, tol)
        hs, ms = compare_declared(found_swaps, ds, tol)
        checks.append(C.check("hidden_cuts", C.FAIL if hidden else C.PASS, hidden,
                              "0 undeclared cuts (cut_d %s, ratio %s)" % (cfg["cut_d"], cfg["cut_ratio_to_local_median"])))
        checks.append(C.check("declared_cuts_found", C.FAIL if missing else C.PASS,
                              {"declared_in_range": dc, "not_found": missing}, "all declared cuts found within %d frames" % tol))
        checks.append(C.check("hidden_swaps", C.FAIL if hs else C.PASS, hs,
                              "0 undeclared swaps (cell hist > %s)" % cfg["swap_cell_hist"]))
        checks.append(C.check("declared_swaps_found", C.FAIL if ms else C.PASS,
                              {"declared_in_range": ds, "not_found": ms}, "all declared swaps found within %d frames" % tol))
        checks.append(C.check("hidden_dissolves", C.FAIL if hd_ else C.PASS, hd_,
                              "0 undeclared gradual transitions (%s+ frames with mean cell hist >= %s)"
                              % (cfg["dissolve_min_frames"], cfg["dissolve_hist_mean"])))
        checks.append(C.check("declared_dissolves_found", C.FAIL if md_ else C.PASS,
                              {"declared_in_range": [list(q) for q in dd], "not_found": md_},
                              "all declared dissolves found, each end within %d frames" % dtol))
        events += [("DECLARED, NOT FOUND", n) for n in missing + ms]
        events += [("DECLARED DISSOLVE, NOT FOUND", tuple(q)) for q in md_]
    elif not args.ref:
        checks.append(C.check("hidden_cuts", C.UNMEASURED, {"found_cuts": found_cuts, "found_swaps": found_swaps,
                                                                  "found_dissolves": [list(q) for q in found_dis]},
                              None, "no --cuts declaration given: discovery only"))

    ref_a = None
    if args.ref:
        try:
            ref_a = analyse(args.ref, rs, re_, cfg, size)
        except Exception as e:
            ref_a = None
            checks.append(C.check("cut_lists_equal", C.UNMEASURED, note="reference not decodable: %s" % str(e)[:200]))
        if ref_a is not None:
            ours_c = [n - first for n in found_cuts]
            ref_c = [c["frame"] - ref_a["ns"][0] for c in ref_a["cuts"]]
            ours_s = [n - first for n in found_swaps]
            ref_s = [s["frame"] - ref_a["ns"][0] for s in ref_a["swaps"]]
            only_o, only_r = compare_declared(ours_c, ref_c, tol)
            checks.append(C.check("frame_counts_equal",
                                  C.PASS if len(a["ns"]) == len(ref_a["ns"]) else C.FAIL,
                                  {"ours": len(a["ns"]), "ref": len(ref_a["ns"])}, "equal"))
            checks.append(C.check("cut_lists_equal", C.FAIL if (only_o or only_r) else C.PASS,
                                  {"ours": ours_c, "ref": ref_c, "only_ours": only_o, "only_ref": only_r},
                                  "same relative positions within %d frames" % tol))
            so, sr = compare_declared(ours_s, ref_s, tol)
            checks.append(C.check("swap_lists_equal", C.FAIL if (so or sr) else C.PASS,
                                  {"ours": ours_s, "ref": ref_s, "only_ours": so, "only_ref": sr},
                                  "same relative positions within %d frames" % tol))
            r0 = ref_a["ns"][0]
            ours_d = [(s_ - first, e_ - first) for s_, e_ in found_dis]
            ref_d = [(q["first"] - r0, q["last"] - r0) for q in ref_a["dissolves"]]
            do, dr_ = compare_pairs(ours_d, ref_d, dtol)
            checks.append(C.check("dissolve_lists_equal", C.FAIL if (do or dr_) else C.PASS,
                                  {"ours": [list(q) for q in ours_d], "ref": [list(q) for q in ref_d],
                                   "only_ours": do, "only_ref": dr_},
                                  "same relative first-last, each end within %d frames" % dtol))
            if re_ is not None and len(ref_a["ns"]) != re_ - rs:
                checks.append(C.check("ref_frame_count", C.FAIL, len(ref_a["ns"]), "%d (the requested --ref-range)" % (re_ - rs)))
            extra["ref"] = {"clip": os.path.abspath(args.ref), "range": [ref_a["ns"][0], ref_a["ns"][-1] + 1],
                            "found_cuts": ref_a["cuts"], "found_swaps": ref_a["swaps"],
                            "found_dissolves": ref_a["dissolves"]}
            events += [("ONLY IN REF (rel %d)" % r, first + r) for r in only_r + sr]
            not_checked.append("picture content on either side of a cut (only positions are compared)")

    events = sorted(set(events), key=lambda e: e[1][0] if isinstance(e[1], tuple) else e[1])
    try:
        ecode = evidence(args.clip, a, events, cfg, size, declared_cuts, declared_swaps, declared_dis, img_path, clip_sha)
        extra["evidence"] = [{"file": img_path, "code": ecode}]
    except Exception as e:
        extra["evidence"] = []
        not_checked.append("evidence image could not be written: %s" % str(e)[:200])
    rc = C.write_result(res_path, TOOL, checks, not_checked, extra)
    print("found cuts : %s" % found_cuts)
    print("found swaps: %s" % found_swaps)
    print("found dissolves: %s" % ["%d-%d" % q for q in found_dis])
    C.print_summary(TOOL + " (" + mode + ")", checks, not_checked, res_path, [img_path])
    return rc


if __name__ == "__main__":
    sys.exit(main())
