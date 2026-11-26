"""refcut.py - cut a frame range out of a video into an all-intra clip (gate G0, package Q1).

The source is decoded once, sequentially (trim filter, never a seek), and the
frames START .. END-1 are written lossless and all-intra (FFV1 in Matroska,
every frame a key frame, pts = n/fps from 0), so later tools can open any
frame cheaply and exactly. A sha256 per frame is taken from the decoded
source frames and again from the written clip; the two lists must be equal.

    python3 tools/qa/refcut.py ../ref/rover_doom.webm 173 232 --out qa/ref/shots/doom/king.mkv
    python3 tools/qa/refcut.py out/full.mp4 173 232 --out "$TMPDIR/ours-king.mkv" --len 59

END is exclusive. Works the same on a reference or on one of our own clips
(there is no separate standalone mode: the tool has one input).
--len N   declared shot length; the cut must have exactly N frames.

Output next to --out: <name>.mkv, <name>.json (result + "hashes": one sha256
per frame, index 0 = source frame START), <name>-sheet.jpg (every
plumbing.refcut.sheet_step-th frame, labelled "shot frame / source frame").
Reference cuts are not for committing or sharing (see ENGINE-SPEC section 2).
Exit code: 0 pass, 1 fail, 2 could not measure.
Needs numpy, Pillow, ffmpeg. Settings: qa.json -> plumbing.refcut.
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

TOOL = "refcut"


def read_framehash(text):
    out = []
    for line in text.splitlines():
        if line.startswith("#") or not line.strip():
            continue
        out.append(line.split(",")[-1].strip())
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("start", type=int)
    ap.add_argument("end", type=int, help="exclusive")
    ap.add_argument("--out", required=True, help="output .mkv path")
    ap.add_argument("--len", dest="length", type=int, help="declared length in frames")
    args = ap.parse_args()

    cfg_all = C.load_cfg("plumbing")
    cfg, fmt = cfg_all.get("refcut"), cfg_all.get("format")
    if not cfg or not fmt:
        print("refcut: qa.json has no plumbing.refcut / plumbing.format; cannot measure")
        return 2
    out = os.path.abspath(args.out)
    base = os.path.splitext(out)[0]
    res_path, sheet_path = base + ".json", base + "-sheet.jpg"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    want = args.end - args.start
    if want <= 0:
        print("refcut: END must be greater than START")
        return 2
    if os.path.exists(out):
        print("refcut: %s exists; refusing to overwrite (move it away first)" % out)
        return 2

    try:
        inf = C.info(args.src)
        fps = "%d" % round(inf["fps"]) if abs(inf["fps"] - round(inf["fps"])) < 1e-6 else "%.6f" % inf["fps"]
        hash_src = os.path.join(C.tmpdir(), "refcut-%d.framehash" % os.getpid())
        C.run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", args.src, "-an", "-sn", "-filter_complex",
               "[0:v:0]trim=start_frame=%d:end_frame=%d,setpts=N/%s/TB,format=yuv420p,split[a][b]" % (args.start, args.end, fps),
               "-map", "[a]", "-r", fps, "-c:v", cfg["codec"], "-g", "1", "-pix_fmt", "yuv420p", out,
               "-map", "[b]", "-r", fps, "-f", "framehash", "-hash", "sha256", hash_src])
        with open(hash_src) as f:
            h_src = read_framehash(f.read())
        os.remove(hash_src)
        h_out = read_framehash(C.run(["ffmpeg", "-v", "error", "-nostdin", "-i", out, "-map", "0:v:0",
                                      "-pix_fmt", "yuv420p", "-f", "framehash", "-hash", "sha256", "-"]))
        oinf = C.info(out)
        flags = C.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=flags",
                       "-of", "csv=p=0", out]).split()
        clip_sha = C.sha(out)
    except Exception as e:
        rc = C.write_result(res_path, TOOL, [C.check("cut", C.UNMEASURED, note=str(e)[:400])],
                            ["everything: the cut could not be made"])
        print("refcut: could not measure: %s" % e)
        return rc

    non_key = sum(1 for f in flags if not f.startswith("K"))
    dup = [i for i in range(1, len(h_src)) if h_src[i] == h_src[i - 1]]
    checks = [
        C.check("frame_count", C.PASS if len(h_src) == want else C.FAIL, len(h_src),
                "%d (END - START)" % want,
                None if len(h_src) == want else "the source may be shorter than END"),
        C.check("hashes_roundtrip", C.PASS if (h_src == h_out and h_src) else C.FAIL,
                {"source_frames": len(h_src), "clip_frames": len(h_out),
                 "different": sum(1 for a, b in zip(h_src, h_out) if a != b)},
                "every frame of the written clip decodes to the same sha256 as the source frame"),
        C.check("all_intra", C.PASS if (non_key == 0 and flags) else C.FAIL,
                {"packets": len(flags), "not_key": non_key}, "0 non-key packets"),
        C.check("first_pts", C.PASS if abs(oinf["first_pts"]) <= fmt["first_pts_tolerance_s"] else C.FAIL,
                oinf["first_pts"], 0.0),
        C.check("fps", C.PASS if abs(oinf["fps"] - inf["fps"]) <= fmt["fps_tolerance"] else C.FAIL,
                oinf["fps"], inf["fps"]),
    ]
    if args.length is not None:
        checks.append(C.check("declared_len", C.PASS if len(h_src) == args.length else C.FAIL, len(h_src), args.length))
    not_checked = ["hidden cuts or swaps inside the range (run cuts.py on the cut)",
                   "that START and END are the right shot boundaries",
                   "colour accuracy of the yuv420p conversion when the source is not yuv420p"]
    if args.length is None:
        not_checked.append("declared shot length (no --len given)")

    extra = {"src": os.path.abspath(args.src), "src_info": inf, "range": [args.start, args.end],
             "clip": out, "clip_sha256": clip_sha, "clip_info": oinf, "settings": cfg,
             "identical_consecutive_frames": dup, "hashes": h_src}
    try:
        step = int(cfg["sheet_step"])
        ims, lbs = [], []
        for n, f in C.frames(out, size=tuple(cfg["sheet_cell"])):
            if n % step == 0 or n == len(h_src) - 1:
                ims.append(f)
                lbs.append("%d / src %d" % (n, args.start + n))
        code = C.save_evidence(C.tile(ims, lbs, int(cfg["sheet_cols"])), sheet_path, clip_sha)
        extra["evidence"] = [{"file": sheet_path, "code": code}]
    except Exception as e:
        extra["evidence"] = []
        not_checked.append("sheet image could not be written: %s" % str(e)[:200])
    rc = C.write_result(res_path, TOOL, checks, not_checked, extra)
    C.print_summary(TOOL, checks, not_checked, res_path, [sheet_path, out])
    return rc


if __name__ == "__main__":
    sys.exit(main())
