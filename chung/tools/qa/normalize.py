"""normalize.py - bring clips to one comparable form (ENGINE-SPEC section 5, package Q1).

A sharp fresh render and a re-compressed download differ in fine detail for
reasons that have nothing to do with the animation. Before any picture
measurement both sides go through the same steps:
  1. (ours only) re-encode with the reference's codec at the reference's
     bitrate, measured over the compared range;
  2. scale to plumbing.normalize.size (640x360), grey (or colour with
     --colour), gaussian blur blur_sigma;
  3. write lossless all-intra FFV1 with pts = n/fps from 0.
Each clip is processed on its own (no two-stream filter graph).

REFERENCE mode:
    python3 tools/qa/normalize.py out/shot-king.mp4 --ref ../ref/rover_doom.webm --ref-range 173:232
  writes a.mkv (ours) and b.mkv (reference); frame counts must be equal.

STANDALONE mode (no reference): the clip is re-encoded with
standalone_codec at standalone_bitrate_kbps (the reference channel's own
average, so floors calibrated on the reference apply to like footage), then
steps 2 and 3.
    python3 tools/qa/normalize.py out/shot-king.mp4

Options: --range a:b (ours, b exclusive), --colour, --no-reencode (skip step
1; the result says so), --out DIR (default qa/<clip stem>/normalize).
Output: a.mkv [b.mkv], normalize.json, normalize.jpg (frames of both sides
at 4 points, each with its sharpness figure).
Reported, not judged: sharpness (mean absolute Laplacian) of each side.
Exit code: 0 pass, 1 fail, 2 could not measure.
Needs numpy, Pillow, ffmpeg. Settings: qa.json -> plumbing.normalize.

Other tools may import:  from normalize import normalize_clip
"""
import argparse
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

TOOL = "normalize"


def fps_text(fps):
    return "%d" % round(fps) if abs(fps - round(fps)) < 1e-6 else "%.6f" % fps


def range_bitrate_kbps(path, start, end, fps):
    """Video bitrate over a frame range from packet sizes (no decode)."""
    rows = C.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time,size",
                  "-of", "csv=p=0", path]).splitlines()
    pk = []
    for r in rows:
        p = r.split(",")
        try:
            pk.append((float(p[0]), int(p[1])))
        except Exception:
            continue
    pk.sort()
    sizes = [s for _, s in pk][start:end]
    if not sizes:
        return None
    return sum(sizes) * 8.0 / (len(sizes) / fps) / 1000.0


def reencode(src, start, end, dst, encoder, kbps, enc_args, fps):
    """Trim [start, end) and encode with `encoder` at kbps. Sequential decode."""
    trim = "trim=start_frame=%d" % start + ("" if end is None else ":end_frame=%d" % end)
    C.run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", src, "-map", "0:v:0", "-an", "-sn",
           "-vf", "%s,setpts=N/%s/TB,format=yuv420p" % (trim, fps_text(fps)), "-r", fps_text(fps),
           "-c:v", encoder, "-b:v", "%dk" % round(kbps)] + list(enc_args) + [dst])


def normalize_clip(src, dst, cfg, start=0, end=None, colour=False, fps=24.0):
    """Steps 2 and 3: scale, grey/colour, blur, lossless all-intra. Returns dst."""
    w, h = cfg["size"]
    trim = "trim=start_frame=%d" % start + ("" if end is None else ":end_frame=%d" % end)
    vf = [trim, "setpts=N/%s/TB" % fps_text(fps), "scale=%d:%d:flags=area" % (w, h),
          "format=%s" % ("gbrp" if colour else "gray")]
    if cfg["blur_sigma"] > 0:
        vf.append("gblur=sigma=%s" % cfg["blur_sigma"])
    C.run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", src, "-map", "0:v:0", "-an", "-sn",
           "-vf", ",".join(vf), "-r", fps_text(fps), "-c:v", "ffv1", "-g", "1",
           "-pix_fmt", "bgr0" if colour else "gray", dst])
    return dst


def sharpness(path):
    """Mean absolute Laplacian per frame -> (mean over frames, list of sample frames)."""
    vals = []
    for n, g in C.frames(path, grey=True):
        f = g.astype(np.float32)
        lap = 4 * f[1:-1, 1:-1] - f[:-2, 1:-1] - f[2:, 1:-1] - f[1:-1, :-2] - f[1:-1, 2:]
        vals.append(float(np.abs(lap).mean()))
    return vals


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip", help="our clip")
    ap.add_argument("--range", dest="rng", help="a:b frame range in our clip, b exclusive")
    ap.add_argument("--ref", help="reference clip (reference mode)")
    ap.add_argument("--ref-range", help="a:b frame range in the reference")
    ap.add_argument("--colour", action="store_true", help="keep colour instead of grey")
    ap.add_argument("--no-reencode", action="store_true", help="skip the matched re-encode of our clip")
    ap.add_argument("--out", help="output folder")
    args = ap.parse_args()

    cfg_all = C.load_cfg("plumbing")
    cfg, fmt = cfg_all.get("normalize"), cfg_all.get("format")
    if not cfg or not fmt:
        print("normalize: qa.json has no plumbing.normalize / plumbing.format; cannot measure")
        return 2
    out = args.out or C.evidence_dir(args.clip, "normalize")
    os.makedirs(out, exist_ok=True)
    res_path, img_path = os.path.join(out, "normalize.json"), os.path.join(out, "normalize.jpg")
    a_path, b_path = os.path.join(out, "a.mkv"), os.path.join(out, "b.mkv")
    mode = "reference" if args.ref else "standalone"
    start, end = C.parse_range(args.rng)
    checks, not_checked, extra = [], [], {"mode": mode, "settings": cfg, "colour": bool(args.colour)}

    try:
        inf = C.info(args.clip)
        clip_sha = C.sha(args.clip)
        fps = inf["fps"]
        n_ours = (end if end is not None else inf["frames"]) - start
        if args.ref:
            rinf = C.info(args.ref)
            rs, re_ = C.parse_range(args.ref_range)
            re_eff = re_ if re_ is not None else rinf["frames"]
            codec = rinf["codec"]
            target = range_bitrate_kbps(args.ref, rs, re_eff, rinf["fps"])
            extra["ref"] = {"clip": os.path.abspath(args.ref), "range": [rs, re_eff], "codec": codec,
                            "bitrate_kbps_in_range": None if target is None else round(target, 1)}
        else:
            codec, target = cfg["standalone_codec"], float(cfg["standalone_bitrate_kbps"])
        encoder = cfg["codec_map"].get(codec)
        src_for_norm, s2, e2 = args.clip, start, end
        achieved = None
        if args.no_reencode:
            checks.append(C.check("matched_encode", C.UNMEASURED, None, None, "--no-reencode: our side keeps its own encode"))
        elif encoder is None or target is None:
            checks.append(C.check("matched_encode", C.UNMEASURED, {"codec": codec, "target_kbps": target}, None,
                                  "no encoder mapped for this codec in plumbing.normalize.codec_map, or bitrate unknown"))
        else:
            ext = ".mp4" if encoder == "libx264" else ".mkv"
            tmp = os.path.join(C.tmpdir(), "norm-%d%s" % (os.getpid(), ext))
            reencode(args.clip, start, end, tmp, encoder, target, cfg["encoder_args"].get(encoder, []), fps)
            tinf = C.info(tmp)
            achieved = range_bitrate_kbps(tmp, 0, tinf["frames"], fps)
            lo, hi = cfg["bitrate_ratio_range"]
            ratio = achieved / target if achieved else None
            checks.append(C.check("matched_encode", C.PASS if (ratio and lo <= ratio <= hi) else C.FAIL,
                                  {"encoder": encoder, "target_kbps": round(target, 1),
                                   "achieved_kbps": None if achieved is None else round(achieved, 1),
                                   "ratio": None if ratio is None else round(ratio, 3)},
                                  "achieved / target within %s" % cfg["bitrate_ratio_range"]))
            src_for_norm, s2, e2 = tmp, 0, None
        normalize_clip(src_for_norm, a_path, cfg, s2, e2, args.colour, fps)
        if src_for_norm != args.clip:
            os.remove(src_for_norm)
        ainf = C.info(a_path)
        if args.ref:
            normalize_clip(args.ref, b_path, cfg, rs, re_, args.colour, rinf["fps"])
            binf = C.info(b_path)
    except Exception as e:
        rc = C.write_result(res_path, TOOL, [C.check("normalize", C.UNMEASURED, note=str(e)[:400])],
                            ["everything: the clips could not be processed"])
        print("normalize: could not measure: %s" % e)
        return rc

    w, h = cfg["size"]
    checks.append(C.check("a_frames", C.PASS if ainf["frames"] == n_ours else C.FAIL, ainf["frames"],
                          "%d (frames of our range)" % n_ours))
    checks.append(C.check("a_form", C.PASS if (ainf["width"], ainf["height"]) == (w, h)
                          and abs(ainf["first_pts"]) <= fmt["first_pts_tolerance_s"] else C.FAIL,
                          {"size": [ainf["width"], ainf["height"]], "first_pts": ainf["first_pts"], "fps": ainf["fps"]},
                          {"size": [w, h], "first_pts": 0.0}))
    sides = [("a (ours)", a_path)]
    if args.ref:
        checks.append(C.check("frame_counts_equal", C.PASS if ainf["frames"] == binf["frames"] else C.FAIL,
                              {"a": ainf["frames"], "b": binf["frames"]}, "equal"))
        checks.append(C.check("b_form", C.PASS if (binf["width"], binf["height"]) == (w, h)
                              and abs(binf["first_pts"]) <= fmt["first_pts_tolerance_s"] else C.FAIL,
                              {"size": [binf["width"], binf["height"]], "first_pts": binf["first_pts"], "fps": binf["fps"]},
                              {"size": [w, h], "first_pts": 0.0}))
        checks.append(C.check("fps_equal", C.PASS if abs(ainf["fps"] - binf["fps"]) <= fmt["fps_tolerance"] else C.FAIL,
                              {"a": ainf["fps"], "b": binf["fps"]}, "equal"))
        sides.append(("b (ref)", b_path))

    extra.update({"clip": os.path.abspath(args.clip), "clip_sha256": clip_sha, "range": [start, start + n_ours],
                  "a": a_path, "a_sha256": C.sha(a_path)})
    if args.ref:
        extra.update({"b": b_path, "b_sha256": C.sha(b_path)})
    not_checked += ["whether the two clips show the same thing (this tool only equalises form)",
                    "audio",
                    "sharpness is reported, not judged: after equal treatment a remaining gap is a real difference in the picture"]
    try:
        sharp, ims, lbs = {}, [], []
        n = ainf["frames"]
        pts = sorted({0, n // 3, 2 * n // 3, max(0, n - 1)})
        for name, p in sides:
            vals = sharpness(p)
            sharp[name] = {"mean": round(float(np.mean(vals)), 3), "min": round(float(np.min(vals)), 3),
                           "max": round(float(np.max(vals)), 3)}
            for k, f in C.frames(p):
                if k in pts:
                    ims.append(f)
                    lbs.append("%s f%d  sharp %.2f" % (name, k, vals[k]))
        extra["sharpness_mean_abs_laplacian"] = sharp
        code = C.save_evidence(C.tile(ims, lbs, len(pts)), img_path, clip_sha)
        extra["evidence"] = [{"file": img_path, "code": code}]
    except Exception as e:
        extra["evidence"] = []
        not_checked.append("evidence image could not be written: %s" % str(e)[:200])
    rc = C.write_result(res_path, TOOL, checks, not_checked, extra)
    C.print_summary(TOOL + " (" + mode + ")", checks, not_checked, res_path, [img_path, a_path] + ([b_path] if args.ref else []))
    if "sharpness_mean_abs_laplacian" in extra:
        print("  sharpness: %s" % extra["sharpness_mean_abs_laplacian"])
    return rc


if __name__ == "__main__":
    sys.exit(main())
