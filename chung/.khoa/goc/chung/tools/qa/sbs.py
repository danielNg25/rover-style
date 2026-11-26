"""sbs.py - frame-exact side-by-side with a machine-readable frame barcode (gate G2, package Q1).

Each input is decoded sequentially in its own ffmpeg pipe; Python pairs
frame k of one with frame k of the other, stamps a barcode holding the
SOURCE frame number into each half, and feeds the joined picture to one
encoder at a fixed frame rate. No ffmpeg filter graph ever joins two inputs,
so differing container time bases cannot make frames repeat. The written
file is then decoded again and both barcodes are read on EVERY frame.

Barcode (top-left of each half): white frame, then cells of
plumbing.sbs.cell_px: 1 start cell (white), `bits` data cells (most
significant first, white = 1), 1 parity cell (even parity over the data),
1 stop cell (black). Value = source frame number mod 2^bits. Below it the
same number in plain text.

REFERENCE mode (left = reference, right = ours):
    python3 tools/qa/sbs.py out/shot-king.mp4 --ref ../ref/rover_doom.webm --ref-range 173:232
    python3 tools/qa/sbs.py out/full.mp4 --ref ../ref/rover_doom.webm --ref-range 0:540 --audio ../ref/rover_doom.webm

STANDALONE mode (one clip, stamped and verified):
    python3 tools/qa/sbs.py out/shot-king.mp4

Verify an existing stamped file only (--frames N is the expected number of
frames; without it the frame count cannot be judged and the verdict is
UNMEASURED, exit 2):
    python3 tools/qa/sbs.py --verify qa/shot-king/sbs/sbs.mp4 --halves 2 --a-start 173 --b-start 0 --frames 59

Options: --range a:b (ours, b exclusive), --audio FILE (its audio from the
reference range start is muxed for viewing only), --out DIR (default
qa/<clip stem>/sbs). Output: sbs.mp4, align.json, sbs.jpg (first, last and
6 spread frames, with the decoded numbers).
Checks: equal frame counts and first pts 0 of the inputs; output frame
count; both barcodes readable and equal to the expected source frame on
every output frame; and content: each output half is closer to the source
frame it claims than to that source's previous and next frame.
In reference mode also halves_in_sync: the barcodes only prove which source
frame sits in each half, not that the two clips show the same moment, so
the cuts, in-place swaps and gradual transitions of both inputs are found
with the detector of cuts.py (same thresholds, plumbing.cuts) and must sit
at the same positions relative to the range start. A clip whose content is
shifted by one frame against the reference fails here. When neither input
has such an event there is nothing to anchor on: no verdict is given and
the fact is listed under NOT CHECKED.
Exit code: 0 pass, 1 fail, 2 could not measure.
Needs numpy, Pillow, ffmpeg. Settings: qa.json -> plumbing.sbs.
"""
import argparse
import os
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import cuts as K  # noqa: E402

TOOL = "sbs"


def stamp(frame, value, cfg, text):
    """Draw the barcode for `value` into an RGB frame (in place) and a text line."""
    bits, cp = int(cfg["bits"]), int(cfg["cell_px"])
    ox, oy = cfg["origin"]
    v = int(value) % (1 << bits)
    data = [(v >> (bits - 1 - i)) & 1 for i in range(bits)]
    cells = [1] + data + [sum(data) & 1] + [0]
    pad = cp // 4
    frame[oy - pad:oy + cp + pad, ox - pad:ox + cp * len(cells) + pad] = cfg["white"]
    frame[oy:oy + cp, ox:ox + cp * len(cells)] = cfg["black"]
    for i, b in enumerate(cells):
        if b:
            frame[oy:oy + cp, ox + i * cp:ox + (i + 1) * cp] = cfg["white"]
    if text:
        lab = np.asarray(C.label(Image.new("RGB", (cp * len(cells) + 2 * pad, cp + 8), (0, 0, 0)), text))
        y0 = oy + cp + pad
        h = min(lab.shape[0], frame.shape[0] - y0)
        w = min(lab.shape[1], frame.shape[1] - (ox - pad))
        frame[y0:y0 + h, ox - pad:ox - pad + w] = lab[:h, :w]
    return frame


def read_code(frame, cfg):
    """Decode the barcode of one half -> value, or None when unreadable."""
    bits, cp = int(cfg["bits"]), int(cfg["cell_px"])
    ox, oy = cfg["origin"]
    q = cp // 4
    vals = []
    for i in range(bits + 3):
        cell = frame[oy + q:oy + cp - q, ox + i * cp + q:ox + (i + 1) * cp - q]
        vals.append(float(cell.mean()))
    mid = (cfg["white"] + cfg["black"]) / 2.0
    b = [1 if v > mid else 0 for v in vals]
    if b[0] != 1 or b[-1] != 0:
        return None
    data = b[1:1 + bits]
    if (sum(data) & 1) != b[1 + bits]:
        return None
    # cells must be clearly black or white, not a washed-out middle
    if any(abs(v - mid) < (cfg["white"] - cfg["black"]) * 0.2 for v in vals):
        return None
    v = 0
    for x in data:
        v = (v << 1) | x
    return v


def thumb(frame, cfg):
    tw, th = cfg["thumb"]
    bits, cp = int(cfg["bits"]), int(cfg["cell_px"])
    f = frame.copy()
    # blank the stamped area so the barcode itself does not vote
    ox, oy = cfg["origin"]
    f[: oy + 2 * cp + 16, : ox + cp * (bits + 3) + 16] = 0
    im = Image.fromarray(f).convert("L").resize((tw, th), Image.BOX)
    return np.asarray(im, np.float32)


def build(sources, out_path, cfg, fps, audio=None, audio_start_s=0.0):
    """sources: list of (path, start, end, tag). Returns (frames written, per-source thumbs, short side or None)."""
    gens = [C.frames(p, s, e) for p, s, e, _ in sources]
    thumbs = [[] for _ in sources]
    enc = None
    n = 0
    short = None
    errp = os.path.join(C.tmpdir(), "sbs-enc-%d.err" % os.getpid())
    try:
        while True:
            row = []
            for i, g in enumerate(gens):
                try:
                    row.append(next(g))
                except StopIteration:
                    row.append(None)
            if any(r is None for r in row):
                if not all(r is None for r in row):
                    short = [sources[i][3] for i, r in enumerate(row) if r is None]
                break
            h = min(r[1].shape[0] for r in row)
            halves = []
            for i, (k, f) in enumerate(row):
                if f.shape[0] != h:
                    w = int(round(f.shape[1] * h / f.shape[0] / 2)) * 2
                    f = np.asarray(Image.fromarray(f).resize((w, h), Image.BILINEAR)).copy()
                thumbs[i].append(thumb(f, cfg))
                rel = k - sources[i][1]
                halves.append(stamp(f, k, cfg, "%s %d (+%d)" % (sources[i][3], k, rel)))
            pic = np.concatenate(halves, axis=1)
            if pic.shape[1] % 2:
                pic = pic[:, :-1]
            if enc is None:
                cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                       "-s", "%dx%d" % (pic.shape[1], pic.shape[0]), "-r", "%g" % fps, "-i", "-"]
                if audio:
                    cmd += ["-ss", "%.6f" % audio_start_s, "-i", audio, "-map", "0:v:0", "-map", "1:a:0?",
                            "-c:a", "aac", "-b:a", "128k", "-shortest"]
                cmd += ["-c:v", "libx264", "-crf", str(cfg["crf"]), "-pix_fmt", "yuv420p", "-r", "%g" % fps,
                        "-movflags", "+faststart", out_path]
                enc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=open(errp, "wb"))
            enc.stdin.write(np.ascontiguousarray(pic).tobytes())
            n += 1
    finally:
        for g in gens:
            g.close()
        if enc is not None:
            enc.stdin.close()
            rc = enc.wait()
            if rc != 0:
                raise RuntimeError("encoder failed: " + open(errp, "rb").read().decode("utf8", "replace")[-800:])
    return n, thumbs, short


def verify(path, n_halves, starts, cfg, thumbs=None):
    """Decode every frame, read every barcode. -> dict of measurements + sample frames."""
    bits = int(cfg["bits"])
    mod = 1 << bits
    unread = [[] for _ in range(n_halves)]
    wrong = [[] for _ in range(n_halves)]
    content_bad = [[] for _ in range(n_halves)]
    content_untested = [0] * n_halves
    samples = {}
    total = 0
    inf = C.info(path)
    hw = inf["width"] // n_halves
    last = max(0, inf["frames"] - 1)
    pick = set(int(round(j * last / 7.0)) for j in range(8))
    for k, f in C.frames(path):
        total += 1
        for i in range(n_halves):
            half = f[:, i * hw:(i + 1) * hw]
            v = read_code(half, cfg)
            exp = (starts[i] + k) % mod
            if v is None:
                unread[i].append(k)
            elif v != exp:
                wrong[i].append({"output_frame": k, "read": v, "expected": exp})
            if thumbs is not None and k < len(thumbs[i]):
                t = thumb(half, cfg)
                own = float(np.abs(t - thumbs[i][k]).mean())
                others = [float(np.abs(t - thumbs[i][j]).mean()) for j in (k - 1, k + 1) if 0 <= j < len(thumbs[i])]
                # only frames whose neighbours really differ in the source can be tested
                src_gap = [float(np.abs(thumbs[i][k] - thumbs[i][j]).mean()) for j in (k - 1, k + 1) if 0 <= j < len(thumbs[i])]
                if not src_gap or min(src_gap) < cfg["content_margin"]:
                    content_untested[i] += 1
                elif own >= min(others):
                    content_bad[i].append(k)
        if k in pick:
            samples[k] = f
    return {"info": inf, "frames": total, "unreadable": unread, "wrong": wrong,
            "content_bad": content_bad, "content_untested": content_untested, "samples": samples}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip", nargs="?", help="our clip")
    ap.add_argument("--range", dest="rng", help="a:b frame range in our clip, b exclusive")
    ap.add_argument("--ref", help="reference clip (reference mode; shown on the left)")
    ap.add_argument("--ref-range", help="a:b frame range in the reference")
    ap.add_argument("--audio", help="file whose audio is muxed in, starting at the reference range start")
    ap.add_argument("--verify", help="only verify this stamped file")
    ap.add_argument("--halves", type=int, default=2, help="with --verify: 1 or 2 pictures side by side")
    ap.add_argument("--a-start", type=int, default=0, help="with --verify: expected first number, left half")
    ap.add_argument("--b-start", type=int, default=0, help="with --verify: expected first number, right half")
    ap.add_argument("--frames", type=int, help="with --verify: expected number of frames in the stamped file")
    ap.add_argument("--out", help="output folder")
    args = ap.parse_args()

    cfg_all = C.load_cfg("plumbing")
    cfg, fmt = cfg_all.get("sbs"), cfg_all.get("format")
    if not cfg or not fmt:
        print("sbs: qa.json has no plumbing.sbs / plumbing.format; cannot measure")
        return 2
    if not args.clip and not args.verify:
        ap.error("give a clip, or --verify FILE")
    target = args.verify or args.clip
    out = args.out or C.evidence_dir(target, "sbs-verify" if args.verify else "sbs")
    os.makedirs(out, exist_ok=True)
    res_path, img_path = os.path.join(out, "align.json"), os.path.join(out, "sbs.jpg")
    sbs_path = args.verify or os.path.join(out, "sbs.mp4")
    mode = "verify" if args.verify else ("reference" if args.ref else "standalone")
    checks, not_checked, extra = [], [], {"mode": mode, "settings": cfg}
    tol = fmt["first_pts_tolerance_s"]
    sync_note = "whether the two halves show the same moment (no reference given)"

    try:
        thumbs = None
        if args.verify:
            n_halves = args.halves
            starts = [args.a_start, args.b_start][:n_halves]
            tags = ["left", "right"][:n_halves]
            expected_frames = args.frames
            sync_note = "whether the two halves show the same moment (verify mode has no source clips)"
            clip_sha = C.sha(args.verify)
            not_checked.append("content of each half against its source (verify mode has no source clips)")
        else:
            inf = C.info(args.clip)
            clip_sha = C.sha(args.clip)
            s, e = C.parse_range(args.rng)
            n_ours = (e if e is not None else inf["frames"]) - s
            sources = [(args.clip, s, e, "ours")]
            checks.append(C.check("ours_first_pts", C.PASS if abs(inf["first_pts"]) <= tol else C.FAIL, inf["first_pts"], 0.0))
            fps = inf["fps"]
            expected_frames = n_ours
            audio_start = 0.0
            if args.ref:
                rinf = C.info(args.ref)
                rs, re_ = C.parse_range(args.ref_range)
                n_ref = (re_ if re_ is not None else rinf["frames"]) - rs
                sources = [(args.ref, rs, re_, "ref")] + sources
                checks.append(C.check("ref_first_pts", C.PASS if abs(rinf["first_pts"]) <= tol else C.FAIL, rinf["first_pts"], 0.0))
                checks.append(C.check("frame_counts_equal", C.PASS if n_ours == n_ref else C.FAIL,
                                      {"ours": n_ours, "ref": n_ref}, "equal"))
                checks.append(C.check("fps_equal", C.PASS if abs(inf["fps"] - rinf["fps"]) <= fmt["fps_tolerance"] else C.FAIL,
                                      {"ours": inf["fps"], "ref": rinf["fps"]}, "equal"))
                expected_frames = min(n_ours, n_ref)
                audio_start = rs / rinf["fps"]
                extra["ref"] = {"clip": os.path.abspath(args.ref), "range": [rs, rs + n_ref]}
                ccfg = cfg_all.get("cuts")
                if not ccfg or "analysis_size" not in cfg_all:
                    sync_note = "whether the two halves show the same moment (qa.json has no plumbing.cuts)"
                else:
                    size = tuple(cfg_all["analysis_size"])
                    ao, ar = K.analyse(args.clip, s, e, ccfg, size), K.analyse(args.ref, rs, re_, ccfg, size)
                    if ao is None or ar is None:
                        sync_note = "whether the two halves show the same moment (fewer than 3 frames)"
                    else:
                        def rel(a):
                            z = a["ns"][0]
                            return ([c["frame"] - z for c in a["cuts"]], [c["frame"] - z for c in a["swaps"]],
                                    [(q["first"] - z, q["last"] - z) for q in a["dissolves"]])
                        (oc, osw, od), (rc_, rsw, rd) = rel(ao), rel(ar)
                        t1, t2 = int(ccfg["declared_tolerance_frames"]), int(ccfg["dissolve_tolerance_frames"])
                        c1, c2 = K.compare_declared(oc, rc_, t1)
                        s1, s2 = K.compare_declared(osw, rsw, t1)
                        d1, d2 = K.compare_pairs(od, rd, t2)
                        meas = {"cuts": {"ours": oc, "ref": rc_, "only_ours": c1, "only_ref": c2},
                                "swaps": {"ours": osw, "ref": rsw, "only_ours": s1, "only_ref": s2},
                                "dissolves": {"ours": [list(q) for q in od], "ref": [list(q) for q in rd],
                                              "only_ours": d1, "only_ref": d2}}
                        if not (oc or rc_ or osw or rsw or od or rd):
                            sync_note = ("whether the two halves show the same moment: neither input has a cut, swap "
                                         "or gradual transition in the range, so there is nothing to anchor on")
                        else:
                            sync_note = None
                            bad_sync = bool(c1 or c2 or s1 or s2 or d1 or d2)
                            checks.append(C.check("halves_in_sync", C.FAIL if bad_sync else C.PASS, meas,
                                                  "cuts and swaps at the same relative frame (within %d), gradual "
                                                  "transitions with each end within %d" % (t1, t2)))
            n_written, thumbs, short = build(sources, sbs_path, cfg, fps, args.audio, audio_start)
            if short:
                checks.append(C.check("inputs_same_length_when_decoded", C.FAIL, {"ended_first": short, "pairs_written": n_written},
                                      "all inputs end together"))
            n_halves = len(sources)
            starts = [src[1] for src in sources]
            tags = [src[3] for src in sources]
            extra.update({"clip": os.path.abspath(args.clip), "range": [s, s + n_ours], "sbs": sbs_path,
                          "sbs_sha256": C.sha(sbs_path), "pairs_written": n_written})
        v = verify(sbs_path, n_halves, starts, cfg, thumbs)
    except Exception as e:
        rc = C.write_result(res_path, TOOL, [C.check("sbs", C.UNMEASURED, note=str(e)[:400])],
                            ["everything: the side-by-side could not be built or read"])
        print("sbs: could not measure: %s" % e)
        return rc

    if expected_frames is not None:
        checks.append(C.check("output_frames", C.PASS if v["frames"] == expected_frames else C.FAIL, v["frames"], expected_frames))
    else:
        checks.append(C.check("output_frames", C.UNMEASURED, v["frames"], None,
                              "verify mode: expected count not given (--frames N)"))
    checks.append(C.check("output_first_pts", C.PASS if abs(v["info"]["first_pts"]) <= tol else C.FAIL, v["info"]["first_pts"], 0.0))
    for i, tag in enumerate(tags):
        if v["frames"] == 0:
            checks.append(C.check("barcode_%s" % tag, C.UNMEASURED, note="no frames"))
            continue
        bad = len(v["unreadable"][i]) + len(v["wrong"][i])
        checks.append(C.check("barcode_%s" % tag, C.PASS if bad == 0 else C.FAIL,
                              {"frames_read": v["frames"], "unreadable": v["unreadable"][i][:20],
                               "wrong": v["wrong"][i][:20], "bad_count": bad},
                              "0 frames; expected number = %d + output frame" % starts[i]))
        if thumbs is not None:
            tested = v["frames"] - v["content_untested"][i]
            verdict = C.UNMEASURED if tested == 0 else (C.PASS if not v["content_bad"][i] else C.FAIL)
            checks.append(C.check("content_%s" % tag, verdict,
                                  {"frames_tested": tested, "frames_untestable": v["content_untested"][i],
                                   "closer_to_a_neighbour": v["content_bad"][i][:20]},
                                  "0 frames closer to the source's previous or next frame than to the claimed one"))
    if sync_note:
        not_checked.append(sync_note)
    else:
        not_checked.append("sync between the events: the halves are only proven to agree at their cuts, swaps and "
                           "gradual transitions, not on every frame in between")
    not_checked += ["whether the two halves show the same action (pose, staging, timing inside a shot)",
                    "audio sync (audio, when present, is for viewing only)"]
    try:
        keys = sorted(v["samples"])
        if len(keys) > 8:
            idx = sorted(set([0, len(keys) - 1] + [round(j * (len(keys) - 1) / 7) for j in range(8)]))
            keys = [keys[j] for j in idx]
        hw = v["info"]["width"] // n_halves
        ims, lbs = [], []
        for k in keys:
            f = v["samples"][k]
            im = C.to_pil(f).resize((640 * n_halves, int(round(640 * f.shape[0] / hw))), Image.BILINEAR)
            ims.append(im)
            lbs.append("")
        sheet = C.tile(ims, lbs, 1 if n_halves == 2 else 2)
        # zoomed barcode strip of the first sample, so a person can read the cells
        f0 = v["samples"][keys[0]]
        ox, oy = cfg["origin"]
        cw = int(cfg["cell_px"]) * (int(cfg["bits"]) + 3) + 16
        strip = [C.to_pil(f0[max(0, oy - 8):oy + 2 * int(cfg["cell_px"]) + 20, i * hw + max(0, ox - 8):i * hw + ox + cw]) for i in range(n_halves)]
        strip = C.tile([s_.resize((s_.width * 2, s_.height * 2), Image.NEAREST) for s_ in strip], [None] * n_halves, n_halves)
        full = Image.new("RGB", (max(sheet.width, strip.width), sheet.height + strip.height), (24, 24, 24))
        full.paste(strip, (0, 0))
        full.paste(sheet, (0, strip.height))
        code = C.save_evidence(full, img_path, clip_sha)
        extra["evidence"] = [{"file": img_path, "code": code}]
    except Exception as e:
        extra["evidence"] = []
        not_checked.append("evidence image could not be written: %s" % str(e)[:200])
    extra["clip_sha256"] = clip_sha
    extra["output_info"] = v["info"]
    rc = C.write_result(res_path, TOOL, checks, not_checked, extra)
    C.print_summary(TOOL + " (" + mode + ")", checks, not_checked, res_path, [img_path, sbs_path])
    return rc


if __name__ == "__main__":
    sys.exit(main())
