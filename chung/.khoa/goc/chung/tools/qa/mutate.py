#!/usr/bin/env python3
"""mutate.py - deliberately broken copies of a clip, to prove that the gates reject them (package Q3).

Mutants are made from an existing CLIP with ffmpeg filters only (nothing is
rendered) and written to qa/_mutants/<clip stem>/ with manifest.json, which
says for every mutant what was done and which gate tools must reject it.

Mutants
  freeze_region   a rectangle shows frame 0 for the whole shot (a static element
                  under a moving camera)                              -> motion, density (twinkle), liveness
  freeze_frames   the whole frame is held for N frames from frame AT  -> health
  slide_region    the rectangle of frame 0 slides linearly across the shot
                  (sliding instead of walking)                        -> motion, density (a frozen
                  starfield that slides: stars followed with the patch's own drift do not twinkle)
  sparse_stars    small bright blobs removed in the rectangle by a median filter -> density
  flat_tones      the flat-rectangle is blurred and reduced to 2 colours (flat blobs) -> density
  shift1          the clip starts one frame late (last frame repeated) -> continuity (ref.lag, reference
                  mode), cuts (when the clip holds declared cuts). With neither a reference nor a
                  declared cut a constant shift is not a measurable fault: --verify reports NOT APPLICABLE.
  black_frame     frame AT is black                                   -> health, cuts, continuity
  glitch_frame    frame AT is replaced by a frame from elsewhere in the clip -> health, cuts, continuity
  desaturate      saturation x 0.2                                    -> palette

Usage
  python3 tools/qa/mutate.py CLIP [--range a:b] [--region w:h:x:y] [--flat-region w:h:x:y]
        [--at N] [--hold N] [--only name,name] [--out DIR]
  python3 tools/qa/mutate.py --verify CONTRACT --manifest qa/_mutants/<stem>/manifest.json
      Runs gate.py on the unbroken clip (baseline) and on every mutant with the
      tools named in the manifest. A mutant counts as REJECTED only when a check
      that PASSES on the baseline FAILS on the mutant. Writes verify.json next
      to the manifest. Exit 0 = every mutant rejected, 1 = at least one mutant
      got through, 2 = some could not be tested (tool missing or UNMEASURED).

--region is the rectangle for freeze_region, slide_region and sparse_stars
(default: the left half); --flat-region the one for flat_tones (default: the
same). --range a:b (b exclusive) cuts that part of CLIP first. Frames are put
on one time base (settb=AVTB,setpts=N/FPS/TB) before any two streams meet.
Needs python3, numpy, Pillow, ffmpeg. Settings: qa.json -> gate.mutants.

Output: <out>/<mutant>.mp4, manifest.json, mutate.json, mutants.jpg (the
changed frame of every mutant beside the original).
Exit code (making): 0 = all written with the right frame count, 1 = one is
wrong, 2 = could not run.
"""
import argparse
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

TOOL = "mutate"
DEFAULTS = {"mutants": {"crf": 14, "slide_px_per_frame": 4, "median_radius": 4, "flat_colours": 2,
                        "flat_blur_sigma": 5, "desaturate": 0.2, "hold": 12}}

REJECT = {
    "freeze_region": ["motion", "density", "liveness"],
    "freeze_frames": ["health"],
    "slide_region": ["motion", "density"],
    "sparse_stars": ["density"],
    "flat_tones": ["density"],
    "shift1": ["continuity", "cuts"],
    "black_frame": ["health", "cuts", "continuity"],
    "glitch_frame": ["health", "cuts", "continuity"],
    "desaturate": ["palette"],
}
NOTES = {
    "shift1": "needs a reference (continuity ref.lag) or declared cuts (cuts.py); with neither, a constant "
              "shift of a single shot is not a fault that can be measured. sbs does not compare content timing. "
              "health may report the repeated last frame, which is a side effect of how this mutant is built",
    "sparse_stars": "seen only when the rectangle is declared as an element with look 'starfield'; whole-frame "
                    "floors do not localise an undeclared patch",
    "flat_tones": "seen standalone only when the rectangle is declared as an element with look 'cloud'; the "
                  "reference style holds flat cells of its own, so no whole-frame tone floor can reject a small flat patch",
    "freeze_region": "density sees it only when the rectangle is declared as an element that should twinkle",
    "slide_region": "needs the rectangle declared as an element whose kind implies internal motion",
}


def graphs(n, fps, crop, flat, at, hold, cfg):
    w, h, x, y = crop
    fw, fh, fx, fy = flat
    tb = "settb=AVTB,setpts=N/%s/TB" % fps
    base = "[0:v]%s" % tb
    other = (at + n // 2) % n
    colours = int(cfg["flat_colours"])
    return {
        "freeze_region": (
            "%s,split[a][b];[b]trim=end_frame=1,crop=%d:%d:%d:%d,loop=loop=-1:size=1:start=0,%s[c];"
            "[a][c]overlay=%d:%d:shortest=1" % (base, w, h, x, y, tb, x, y),
            "rectangle %d:%d:%d:%d shows frame 0 on every frame" % crop, n // 2),
        "freeze_frames": (
            "%s,loop=loop=%d:size=1:start=%d,%s,trim=end_frame=%d" % (base, hold, at, tb, n),
            "frame %d held for %d extra frames" % (at, hold), min(n - 1, at + hold // 2)),
        "slide_region": (
            "%s,split[a][b];[b]trim=end_frame=1,crop=%d:%d:%d:%d,loop=loop=-1:size=1:start=0,%s[c];"
            "[a][c]overlay=x='%d+%d*n':y=%d:shortest=1" % (base, w, h, x, y, tb, x, int(cfg["slide_px_per_frame"]), y),
            "rectangle %d:%d:%d:%d of frame 0 slides right %d px per frame" % (crop + (int(cfg["slide_px_per_frame"]),)),
            n // 2),
        "sparse_stars": (
            "%s,split[a][b];[b]crop=%d:%d:%d:%d,median=radius=%d[c];[a][c]overlay=%d:%d:shortest=1"
            % (base, w, h, x, y, int(cfg["median_radius"]), x, y),
            "median filter radius %d inside %d:%d:%d:%d" % ((int(cfg["median_radius"]),) + crop), n // 2),
        "flat_tones": (
            "%s,split[a][b];[b]crop=%d:%d:%d:%d,gblur=sigma=%s,elbg=codebook_length=%d:seed=1[c];"
            "[a][c]overlay=%d:%d:shortest=1" % (base, fw, fh, fx, fy, cfg["flat_blur_sigma"], colours, fx, fy),
            "blur + posterise to %d colours inside %d:%d:%d:%d" % ((colours,) + flat), n // 2),
        "shift1": (
            "%s,trim=start_frame=1,%s,tpad=stop_mode=clone:stop=1" % (base, tb),
            "starts at frame 1, last frame repeated", 0),
        "black_frame": (
            "%s,drawbox=enable='eq(n\\,%d)':x=0:y=0:w=iw:h=ih:color=black:t=fill" % (base, at),
            "frame %d is black" % at, at),
        "glitch_frame": (
            "%s,split[a][b];[b]trim=start_frame=%d:end_frame=%d,%s,loop=loop=-1:size=1:start=0,%s[c];"
            "[a][c]overlay=enable='eq(n\\,%d)':shortest=1" % (base, other, other + 1, tb, tb, at),
            "frame %d replaced by frame %d" % (at, other), at),
        "desaturate": ("%s,hue=s=%s" % (base, cfg["desaturate"]), "saturation x %s" % cfg["desaturate"], n // 2),
    }


def make(a):
    cfg = C.save_cfg_defaults("gate", DEFAULTS)["mutants"]
    info = C.info(a.clip)
    rng = C.parse_range(a.range)
    stem = os.path.splitext(os.path.basename(a.clip))[0] + ("-%d-%d" % rng if a.range else "")
    out = a.out or os.path.join(C.ROOT, "qa", "_mutants", stem)
    os.makedirs(out, exist_ok=True)
    fps = "%g" % info["fps"]
    base = a.clip
    if a.range:   # cut the range first (sequential decode, near-lossless), so all mutants start at frame 0
        base = os.path.join(out, "_base.mp4")
        C.run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", a.clip, "-vf",
               "trim=start_frame=%d:end_frame=%d,settb=AVTB,setpts=N/%s/TB" % (rng[0], rng[1], fps),
               "-an", "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", "-r", fps, base])
    n = C.info(base)["frames"]
    W, H = info["width"], info["height"]
    crop = C.parse_crop(a.region) or (W // 2, H, 0, 0)
    flat = C.parse_crop(a.flat_region) or crop
    at = a.at if a.at is not None else n // 3
    hold = a.hold or int(cfg["hold"])
    g = graphs(n, fps, crop, flat, at, hold, cfg)
    names = [s for s in (a.only.split(",") if a.only else list(g))]
    base_sha = C.sha(base)
    manifest = {"base": os.path.abspath(base), "base_sha": base_sha, "source": os.path.abspath(a.clip),
                "source_range": list(rng) if a.range else None, "frames": n,
                "region": "%d:%d:%d:%d" % crop, "flat_region": "%d:%d:%d:%d" % flat, "mutants": []}
    checks, show, labels = [], [], []
    want = {}
    for name in names:
        if name not in g:
            checks.append(C.check("written." + name, C.UNMEASURED, None, None, "unknown mutant name"))
            continue
        graph, desc, frame = g[name]
        path = os.path.join(out, name + ".mp4")
        try:
            C.run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", base, "-filter_complex", graph + "[v]",
                   "-map", "[v]", "-an", "-c:v", "libx264", "-crf", str(cfg["crf"]), "-pix_fmt", "yuv420p",
                   "-r", fps, path])
            got = C.info(path)["frames"]
        except Exception as e:
            checks.append(C.check("written." + name, C.UNMEASURED, None, None, str(e)[-300:]))
            continue
        checks.append(C.check("written." + name, C.PASS if got == n else C.FAIL, got, {"frames": n}))
        manifest["mutants"].append({"name": name, "file": os.path.abspath(path), "sha": C.sha(path),
                                    "what": desc, "changed_frame": frame, "must_be_rejected_by": REJECT[name],
                                    "note": NOTES.get(name)})
        want[name] = (path, frame)
    # evidence: the changed frame of each mutant beside the same frame of the base
    for name, (path, frame) in want.items():
        for src, lab in ((base, "original f%d" % frame), (path, "%s f%d" % (name, frame))):
            for _, f in C.frames(src, frame, frame + 1, size=(480, 270)):
                show.append(f); labels.append(lab)
    mpath = os.path.join(out, "manifest.json")
    if a.only and os.path.isfile(mpath):      # a partial run keeps the other mutants of the same base
        with open(mpath, "r", encoding="utf8") as f:
            old = json.load(f)
        if old.get("base_sha") == base_sha:
            new = {m["name"] for m in manifest["mutants"]}
            manifest["mutants"] = [m for m in old.get("mutants", []) if m["name"] not in new] + manifest["mutants"]
    with open(mpath, "w", encoding="utf8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    ipath = os.path.join(out, "mutants.jpg")
    code = C.save_evidence(C.tile(show, labels, 4), ipath, base_sha) if show else None
    jpath = os.path.join(out, "mutate.json")
    not_checked = ["whether any gate rejects these mutants: run  mutate.py --verify CONTRACT --manifest %s"
                   % os.path.join(out, "manifest.json")]
    C.write_result(jpath, TOOL, checks, not_checked,
                   {"clip": os.path.abspath(base), "clip_sha": base_sha, "manifest": os.path.join(out, "manifest.json"),
                    "evidence": [{"path": ipath, "code": code}]})
    return C.print_summary(TOOL, checks, not_checked, jpath, [ipath])


def _gate(contract, clip, tools, out):
    cmd = [sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "gate.py"), contract,
           "--clip", clip, "--only", ",".join(tools), "--out", out, "--quiet"]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    with open(os.path.join(out, "gate.json"), "r", encoding="utf8") as f:
        return json.load(f)


def _key(c):
    return "%s|%s|%s" % (c.get("tool"), c.get("element") or "", c.get("name"))


def verify(a):
    with open(a.manifest, "r", encoding="utf8") as f:
        man = json.load(f)
    mdir = os.path.dirname(os.path.abspath(a.manifest))
    only = a.only.split(",") if a.only else None
    muts = [dict(m, must_be_rejected_by=REJECT.get(m["name"], m["must_be_rejected_by"]), note=NOTES.get(m["name"]))
            for m in man["mutants"] if not only or m["name"] in only]      # the tool list is the current one, not the manifest's
    tools = sorted({t for m in muts for t in m["must_be_rejected_by"]})
    base = _gate(a.verify, man["base"], tools, os.path.join(mdir, "_gate", "baseline"))
    base_v = {_key(c): c["verdict"] for c in base["checks"]}
    rows, checks = [], []
    with open(a.verify, "r", encoding="utf8") as f:
        con = json.load(f)
    for m in muts:
        if m["name"] == "shift1" and not con.get("ref") and not con.get("cuts"):
            note = "NOT APPLICABLE: the contract has no reference and no declared cut; a constant shift is not measurable"
            rows.append({"mutant": m["name"], "what": m["what"], "must_be_rejected_by": m["must_be_rejected_by"],
                         "rejected_by": [], "result": "NOT APPLICABLE", "note": note})
            checks.append(C.check("rejects." + m["name"], C.UNMEASURED, None, {"must_be_rejected_by": m["must_be_rejected_by"]}, note))
            print("%-14s %-11s %s" % (m["name"], "NOT APPLICABLE", note))
            continue
        g = _gate(a.verify, m["file"], m["must_be_rejected_by"], os.path.join(mdir, "_gate", m["name"]))
        new_fail = [c for c in g["checks"] if c["verdict"] == "FAIL" and base_v.get(_key(c)) == "PASS"]
        measured_tools = sorted({c["tool"] for c in g["checks"] if c["verdict"] in ("PASS", "FAIL")})
        missing = [t for t in m["must_be_rejected_by"] if t not in measured_tools]
        row = {"mutant": m["name"], "what": m["what"], "must_be_rejected_by": m["must_be_rejected_by"],
               "rejected_by": [{"check": _key(c), "measured": c.get("measured"), "threshold": c.get("threshold")}
                               for c in new_fail],
               "tools_that_measured": measured_tools, "tools_that_did_not_measure": missing,
               "baseline_already_failing": [_key(c) for c in g["checks"]
                                            if c["verdict"] == "FAIL" and base_v.get(_key(c)) == "FAIL"]}
        if new_fail:
            v, note = C.PASS, "rejected by " + ", ".join(sorted({c["tool"] for c in new_fail}))
        elif not measured_tools:
            v, note = C.UNMEASURED, "none of the named tools could measure this mutant"
        else:
            v, note = C.FAIL, "NOT rejected; tools that measured: %s; not measuring: %s" % (measured_tools, missing)
        row["result"] = {C.PASS: "REJECTED", C.FAIL: "GOT THROUGH", C.UNMEASURED: "UNTESTED"}[v]
        rows.append(row)
        checks.append(C.check("rejects." + m["name"], v, [r["check"] for r in row["rejected_by"]],
                              {"must_be_rejected_by": m["must_be_rejected_by"]}, note))
        print("%-14s %-11s %s" % (m["name"], row["result"], note))
    jpath = os.path.join(mdir, "verify.json")
    not_checked = ["a tool listed for a mutant but absent from 'rejected_by' did not catch it (see each row)",
                   "mutants are simple picture edits; a gate that rejects them may still miss subtler faults"]
    rc = C.write_result(jpath, "mutate-verify", checks, not_checked,
                        {"contract": os.path.abspath(a.verify), "manifest": os.path.abspath(a.manifest),
                         "clip": man["base"], "clip_sha": man["base_sha"],
                         "baseline_verdicts": base_v, "rows": rows,
                         "evidence": [{"path": os.path.join(mdir, "mutants.jpg")}]})
    print("result: " + jpath)
    return rc


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clip", nargs="?")
    ap.add_argument("--range"); ap.add_argument("--region"); ap.add_argument("--flat-region")
    ap.add_argument("--at", type=int, help="frame for freeze_frames, black_frame, glitch_frame (default n/3)")
    ap.add_argument("--hold", type=int, help="frames held by freeze_frames")
    ap.add_argument("--only", help="comma list of mutant names")
    ap.add_argument("--out")
    ap.add_argument("--verify", metavar="CONTRACT", help="run the gate on baseline and mutants")
    ap.add_argument("--manifest")
    a = ap.parse_args()
    try:
        if a.verify:
            if not a.manifest:
                ap.error("--verify needs --manifest")
            return verify(a)
        if not a.clip:
            ap.error("CLIP is required")
        return make(a)
    except (OSError, RuntimeError, ValueError) as e:
        print("%s: could not run (%s)" % (TOOL, e))
        return 2


if __name__ == "__main__":
    sys.exit(main())
