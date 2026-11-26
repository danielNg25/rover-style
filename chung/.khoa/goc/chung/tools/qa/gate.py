#!/usr/bin/env python3
"""gate.py - run every available QA tool on one shot and collect the verdicts (package Q3).

Reads a shot contract (JSON, or YAML when PyYAML is importable), runs the tools
of tools/qa/ in cost order (order and switches: qa.json -> gate.order), reads
each tool's JSON result and writes gate.json with the sha256 of the clip, of
the contract and of qa.json. Works with NO reference (standalone); when the
contract names a reference the tools are run in reference mode.

Rules
  * exit 1 when any check is FAIL;
  * a tool that is missing, crashes, lacks a declaration it needs (no cut
    list, no elements) or cannot measure is recorded as UNMEASURED - never as
    PASS. Two things are structurally not applicable and go to "not_checked"
    instead (the report lists them under NOT VERIFIED): alignment (sbs) when
    the contract has no reference, and figure when no figure is declared;
  * an UNMEASURED check can be WAIVED only by a contract waiver that names the
    tool and gives a reason (at most gate.max_waivers per shot). FAIL cannot
    be waived;
  * an UNMEASURED check can be waived only when the waiver also names an
    evidence image that exists (path relative to the contract);
  * a run restricted by --only, or with a tool disabled in qa.json, is PARTIAL:
    gate.json carries "partial": true, the tools left out, verdict PARTIAL and
    exit code 2. A partial gate is never a pass;
  * exit 0 only when every tool of gate.order ran and every check is PASS or
    WAIVED; exit 2 when nothing fails but something is still UNMEASURED.

Built-in check "continuity" (no separate script; thresholds qa.json gate.continuity),
on grey frames scaled to 64x36:
  pop          one-frame outlier: (|a-b| + |b-c| - |a-c|) / |a-c| over three
               successive frames, per pixel, averaged. A black or foreign frame
               in a calm shot gives a high value.
  recurrence   a frame that is a copy of a NON-adjacent frame while its
               neighbours are not copies of that frame's neighbours (a frame
               from elsewhere in the same clip dropped in).
  ref.lag      reference mode only: mean |ours[n] - ref[n+lag]| for lag -3..3;
               the lowest cost must sit at lag 0. A cost curve without a clear
               dip (calm shot) is UNMEASURED. Standalone, a constant shift of
               a single shot cannot be measured at all (listed as not checked).
  Declared cuts and swaps are left out of pop; contract "flashes": [n, ...]
  declares one-frame flashes that are meant.

Contract
  {
    "id": "earth",
    "clip": "out/shot-earth.mp4",          paths are relative to the contract file
    "range": [0, 47],                      optional, end exclusive
    "len": 47,                             optional declared frame count
    "shot_type": "space",                  floors of density / palette
    "cuts": [],                            declared cuts inside the range ([] = one shot)
    "swaps": [],                           declared in-place subject swaps (cuts.py)
    "subject": "400:400:440:160",          optional crop or matte of the main subject (palette value_sep)
    "palette": "set-palette.json",         optional set palette {"colors": [[r,g,b], ...]} (palette.py --set-palette)
    "flashes": [],                         optional frames of intended one-frame flashes (continuity pop)
    "ref": {"clip": "../ref/rover_doom.webm", "range": [0, 47]},     optional
    "elements": [
      {"id": "globe", "kind": "rotates", "crop": "500:500:390:110"},
      {"id": "stars", "kind": "twinkles", "crop": "440:260:0:260", "look": "starfield"},
      {"id": "king", "kind": "acts", "crop": "455:600:435:40",
       "figure": {"parts": "parts.json", "model": "proportions.json", "expect": "height_frac=0.83",
                  "ref_crop": "400:580:425:50", "ref_parts": "parts-ref.json", "frame": 30, "ref_frame": 203}}
    ],
    "waivers": [{"tool": "camera", "reason": "why", "image": "evidence.jpg"}]
  }
  element.kind is the motion kind of motion.py; element.look is the density
  kind (qa.json look.density.floors_kind); "crop" may be replaced by "matte".

Usage
  python3 tools/qa/gate.py CONTRACT [--out DIR] [--only tool,tool] [--stop-on-fail] [--clip PATH] [--quiet]
  --clip overrides the contract's clip (used by mutate.py --verify).
Tools that need OpenCV (camera, liveness, motion) are started through
  UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" \\
  uv run --no-project --with opencv-python-headless --with numpy --with pillow python <script>
with UV_OFFLINE=1 unless the environment already sets UV_OFFLINE (the packages
are cached; set UV_OFFLINE=0 once if the cache is empty).
gate.py itself needs only python3, numpy, Pillow.

Output: <out>/gate.json, <out>/gate.jpg (verdict table over the middle frame)
and one folder per tool run (default out: qa/<id>/gate/). Then run report.py.
Exit code 0 = pass, 1 = fail, 2 = something could not be measured.
"""
import argparse
import json
import os
import subprocess
import sys
import time

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import common as C  # noqa: E402

TOOL = "gate"
WAIVED = "WAIVED"
DEFAULTS = {
    "order": ["health", "cuts", "continuity", "palette", "figure", "density", "sbs", "camera", "liveness", "motion"],
    "builtin": ["continuity"],
    "continuity": {
        "size": [64, 36],
        "pop_floor": 0.5,
        "pop_ratio_max": 4.0,
        "recurrence_gap": 2,
        "recurrence_ratio_min": 0.4,
        "hold_eps": 0.02,
        "lag_max": 3,
        "lag_dip_min": 0.01,
        "_doc": "Measured: pop highest value on the reference frames 0-539 is 2.66 (frame 11), on out/full.mp4 0.89; "
                "black frame on the Earth shot 4.98, glitch frame on savanna 7.0, on full.mp4 64. recurrence: lowest "
                "ratio on reference and on all our shots 0.95; the three glitch_frame mutants 0.03, 0.009, 0.001. "
                "lag dip: earth 3.1 %, full film 3 %, king 0.17 %, savanna and village no interior minimum.",
    },
    "opencv_tools": ["camera", "liveness", "motion"],
    "result_file": {"sbs": "align.json"},
    "disabled": [],
    "max_waivers": 3,
    "timeout_s": 900,
    "look_of_kind": {"twinkles": "starfield"},
}


# ----------------------------------------------------------------- contract
def load_contract(path):
    with open(path, "r", encoding="utf8") as f:
        text = f.read()
    if path.lower().endswith((".yaml", ".yml")):
        try:
            import yaml
        except ImportError:
            raise RuntimeError("PyYAML is not installed: give the contract as JSON")
        c = yaml.safe_load(text)
    else:
        c = json.loads(text)
    if not isinstance(c, dict) or "clip" not in c:
        raise RuntimeError("contract must be a mapping with at least 'clip'")
    base = os.path.dirname(os.path.abspath(path))

    def rel(p):
        return p if (p is None or os.path.isabs(p)) else os.path.normpath(os.path.join(base, p))

    c["clip"] = rel(c["clip"])
    if c.get("ref"):
        c["ref"]["clip"] = rel(c["ref"]["clip"])
    for e in c.get("elements") or []:
        if e.get("matte"):
            e["matte"] = rel(e["matte"])
        for k in ("parts", "model", "ref_parts"):
            if e.get("figure", {}).get(k):
                e["figure"][k] = rel(e["figure"][k])
    c["_rel"] = rel
    return c


def _rng(r):
    return "%d:%d" % (r[0], r[1]) if r else None


# ----------------------------------------------------------------- command builders
# Each builder returns a list of runs: (element id or None, argv after the script, problem or None).
def b_health(c, out):
    a = [c["clip"], "--out", out]
    if c.get("range"):
        a += ["--range", _rng(c["range"])]
    if c.get("len"):
        a += ["--frames", str(c["len"])]
    if c.get("ref"):
        a += ["--ref", c["ref"]["clip"]] + (["--ref-range", _rng(c["ref"]["range"])] if c["ref"].get("range") else [])
    return [(None, a, None)]


def b_cuts(c, out):
    if c.get("cuts") is None:
        return [(None, None, "no 'cuts' list declared in the contract ([] declares a single shot)")]
    off = c["range"][0] if c.get("range") else 0
    a = [c["clip"], "--out", out, "--cuts", ",".join(str(off + int(v)) for v in c["cuts"]) or "none"]
    if c.get("swaps"):
        a += ["--swaps", ",".join(str(off + int(v)) for v in c["swaps"])]
    if c.get("range"):
        a += ["--range", _rng(c["range"])]
    return [(None, a, None)]


def _look_common(c, out):
    a = [c["clip"], "--out", out]
    if c.get("range"):
        a += ["--range", _rng(c["range"])]
    if c.get("ref"):
        a += ["--ref", c["ref"]["clip"]] + (["--ref-range", _rng(c["ref"]["range"])] if c["ref"].get("range") else [])
    return a


def b_palette(c, out):
    a = _look_common(c, out)
    if c.get("shot_type"):
        a += ["--type", c["shot_type"]]
    if c.get("subject"):
        a += ["--subject", c["_rel"](c["subject"]) if ":" not in c["subject"] else c["subject"]]
    if c.get("palette"):
        a += ["--set-palette", c["_rel"](c["palette"])]
    return [(None, a, None)]


def b_density(c, out, cfg):
    a = _look_common(c, out)
    if c.get("shot_type"):
        a += ["--type", c["shot_type"]]
    runs = [(None, a, None)]
    for e in c.get("elements") or []:
        look = e.get("look") or cfg["look_of_kind"].get(e.get("kind"))
        region = e.get("crop") or e.get("matte")
        if look and region:
            ea = _look_common(c, out) + ["--region", region, "--kind", look, "--name", e["id"]]
            if c.get("ref") and e.get("ref_crop"):
                ea += ["--ref-region", e["ref_crop"]]
            runs.append((e["id"], ea, None))
    return runs


def b_figure(c, out):
    runs = []
    for e in c.get("elements") or []:
        fg = e.get("figure")
        if fg is None:
            continue
        region = e.get("crop") or e.get("matte")
        if not region:
            runs.append((e["id"], None, "figure element has neither crop nor matte"))
            continue
        a = [c["clip"], "--out", out, "--name", e["id"], "--region", region]
        if fg.get("frame") is not None:
            a += ["--range", "%d:%d" % (fg["frame"], fg["frame"] + 1)]
        elif c.get("range"):
            a += ["--range", _rng(c["range"])]
        for k, flag in (("parts", "--parts"), ("model", "--model"), ("expect", "--expect")):
            if fg.get(k):
                a += [flag, fg[k]]
        if c.get("ref") and fg.get("ref_crop"):
            a += ["--ref", c["ref"]["clip"], "--ref-region", fg["ref_crop"]]
            if fg.get("ref_frame") is not None:
                a += ["--ref-range", "%d:%d" % (fg["ref_frame"], fg["ref_frame"] + 1)]
            elif c["ref"].get("range"):
                a += ["--ref-range", _rng(c["ref"]["range"])]
            if fg.get("ref_parts"):
                a += ["--ref-parts", fg["ref_parts"]]
        runs.append((e["id"], a, None))
    return runs or [(None, None, "N/A: no element with a 'figure' block is declared; if the shot shows a character, "
                                 "its size and proportions were not checked")]


def b_sbs(c, out):
    if not c.get("ref"):
        return [(None, None, "N/A: frame alignment against a reference (the contract names no reference)")]
    a = [c["clip"], "--out", out, "--ref", c["ref"]["clip"]]
    if c["ref"].get("range"):
        a += ["--ref-range", _rng(c["ref"]["range"])]
    if c.get("range"):
        a += ["--range", _rng(c["range"])]
    return [(None, a, None)]


def _startend(c):
    a = []
    if c.get("range"):
        a += ["--start", str(c["range"][0]), "--end", str(c["range"][1])]
    return a


def _refstart(c):
    if not c.get("ref"):
        return []
    return ["--ref", c["ref"]["clip"], "--ref-start", str((c["ref"].get("range") or [0])[0])]


def b_camera(c, out):
    a = [c["clip"], "--out", out] + _startend(c) + _refstart(c)
    if c.get("cuts"):
        a += ["--cuts", ",".join(str(int(v)) for v in c["cuts"])]
    return [(None, a, None)]


def b_liveness(c, out):
    a = [c["clip"], "--out", out] + _startend(c)
    if c.get("cuts"):
        a += ["--cuts", ",".join(str(int(v)) for v in c["cuts"])]
    return [(None, a, None)]


def b_motion(c, out):
    els = []
    for e in c.get("elements") or []:
        if not e.get("kind"):
            continue
        if e.get("crop"):
            els += ["--element", "%s:%s:%s" % (e["id"], e["kind"], e["crop"])]
        elif e.get("matte"):
            els += ["--element", "%s:%s:matte=%s" % (e["id"], e["kind"], e["matte"])]
    if not els:
        return [(None, None, "no element with a motion 'kind' and a crop or matte declared")]
    if c.get("cuts"):
        return [(None, None, "motion.py takes one shot; this contract declares cuts inside the range")]
    return [(None, [c["clip"], "--out", out] + _startend(c) + _refstart(c) + els, None)]


BUILDERS = {"health": b_health, "cuts": b_cuts, "palette": b_palette, "density": b_density, "figure": b_figure,
            "sbs": b_sbs, "camera": b_camera, "liveness": b_liveness, "motion": b_motion}


# ----------------------------------------------------------------- built-in: continuity
def _small(clip, rng, size):
    import numpy as np
    a, b = (rng[0], rng[1]) if rng else (0, None)
    fr = [(n, f) for n, f in C.frames(clip, a, b, size=tuple(size), grey=True)]
    if len(fr) < 3:
        raise RuntimeError("fewer than 3 frames decoded from %s" % clip)
    return [n for n, _ in fr], np.stack([f.astype(np.float32).ravel() for _, f in fr])


def continuity(c, out, cfg):
    """Built-in check; writes <out>/continuity.json and .jpg, returns the exit code."""
    import numpy as np
    k = cfg["continuity"]
    jpath, ipath = os.path.join(out, "continuity.json"), os.path.join(out, "continuity.jpg")
    checks, not_checked, extra = [], [], {"clip": c["clip"], "clip_sha": c["_sha"], "clip_sha256": c["_sha"]}
    try:
        nums, F = _small(c["clip"], c.get("range"), k["size"])
        off = nums[0]
        N = len(F)
        skip = set()
        for v in (c.get("cuts") or []) + (c.get("swaps") or []):
            skip |= {int(v) - 1, int(v)}
        skip |= {int(v) for v in c.get("flashes") or []}
        a, b, d = F[:-2], F[1:-1], F[2:]
        d2 = np.abs(a - d).mean(1)
        pop = (np.abs(a - b) + np.abs(b - d) - np.abs(a - d)).mean(1) / np.maximum(d2, float(k["pop_floor"]))
        idx = [i for i in range(N - 2) if (i + 1) not in skip]
        worst = max(idx, key=lambda i: pop[i]) if idx else None
        show = []
        if worst is None:
            checks.append(C.check("pop", C.UNMEASURED, None, {"max": k["pop_ratio_max"]}, "every frame is beside a declared cut"))
        else:
            v = float(pop[worst])
            bad = [off + i + 1 for i in idx if pop[i] > float(k["pop_ratio_max"])]
            checks.append(C.check("pop", C.FAIL if bad else C.PASS,
                                  {"worst_frame": off + worst + 1, "ratio": round(v, 3), "frames_above": bad[:20]},
                                  {"max": k["pop_ratio_max"], "floor": k["pop_floor"]}))
            show.append(("pop %.2f" % v, [worst, worst + 1, worst + 2]))
        # recurrence: a frame that copies a non-adjacent frame in isolation
        gap, eps = int(k["recurrence_gap"]), float(k["hold_eps"])
        Dm = np.stack([np.abs(F - F[i]).mean(1) for i in range(N)])
        best = None
        ms = np.arange(1, N - 1)
        for n in range(1, N - 1):
            adj = min(Dm[n, n - 1], Dm[n, n + 1])
            if adj < eps:
                continue                              # a held frame: health.py counts those
            m = ms[np.abs(ms - n) > gap]
            if not len(m):
                continue
            nb = np.minimum(np.maximum(Dm[n - 1, m - 1], Dm[n + 1, m + 1]), np.maximum(Dm[n - 1, m + 1], Dm[n + 1, m - 1]))
            r = Dm[n, m] / np.maximum(1e-6, np.minimum(adj, nb))
            j = int(r.argmin())
            if best is None or r[j] < best[0]:
                best = (float(r[j]), n, int(m[j]))
        if best is None:
            checks.append(C.check("recurrence", C.UNMEASURED, None, {"min": k["recurrence_ratio_min"]},
                                  "clip too short or every frame is held"))
        else:
            checks.append(C.check("recurrence", C.PASS if best[0] >= float(k["recurrence_ratio_min"]) else C.FAIL,
                                  {"frame": off + best[1], "copy_of_frame": off + best[2], "ratio": round(best[0], 3)},
                                  {"min": k["recurrence_ratio_min"], "gap": gap},
                                  "distance to the far frame / min(distance to its own neighbours, distance between the two neighbourhoods)"))
            show.append(("recurrence %.2f" % best[0], [best[1] - 1, best[1], best[1] + 1, best[2]]))
        if c.get("ref"):
            rr = c["ref"].get("range")
            _, R = _small(c["ref"]["clip"], rr, k["size"])
            L = int(k["lag_max"])
            M = min(N, len(R))
            cost = {}
            for lag in range(-L, L + 1):
                i0, i1 = max(0, -lag), min(M, M - lag)
                if i1 - i0 >= 3:
                    cost[lag] = float(np.abs(F[i0:i1] - R[i0 + lag:i1 + lag]).mean())
            bl = min(cost, key=cost.get)
            meas = {"cost_by_lag": {str(q): round(v, 3) for q, v in cost.items()}, "best_lag": bl}
            thr = {"lag": 0, "dip_min": k["lag_dip_min"]}
            if (bl - 1) not in cost or (bl + 1) not in cost:
                checks.append(C.check("ref.lag", C.UNMEASURED, meas, thr, "the cost has no minimum inside the lags tried (calm shot or large offset)"))
            else:
                dip = ((cost[bl - 1] + cost[bl + 1]) / 2 - cost[bl]) / max(1e-6, cost[bl])
                meas["dip"] = round(dip, 4)
                if dip < float(k["lag_dip_min"]):
                    checks.append(C.check("ref.lag", C.UNMEASURED, meas, thr, "the cost curve is too flat to place the minimum"))
                else:
                    checks.append(C.check("ref.lag", C.PASS if bl == 0 else C.FAIL, meas, thr))
        else:
            not_checked.append("a constant time shift of the whole clip (no reference, nothing to place it against)")
        not_checked += ["a foreign frame inside a burst of fast change (pop is a ratio to the change around it)",
                        "a repeated frame that is adjacent (held frames belong to health.py)",
                        "a foreign frame that copies no other frame of this clip and sits in fast motion"]
        # evidence: the frames named by the checks
        want = sorted({i for _, ids in show for i in ids if 0 <= i < N})
        got = {}
        if want:
            for n, f in C.frames(c["clip"], off + want[0], off + want[-1] + 1, size=(320, 180)):
                if n - off in want:
                    got[n - off] = f
        tiles, labels = [], []
        for title, ids in show:
            for i in ids:
                if i in got:
                    tiles.append(got[i]); labels.append("%s  f%d" % (title, off + i))
        if tiles:
            extra["evidence"] = [{"path": ipath, "code": C.save_evidence(C.tile(tiles, labels, 4), ipath, c["_sha"])}]
    except Exception as e:
        checks = [C.check("measure", C.UNMEASURED, None, None, "%s: %s" % (type(e).__name__, e))]
        not_checked = ["everything: the check could not measure"]
    return C.write_result(jpath, "continuity", checks, not_checked, extra)


BUILTIN = {"continuity": continuity}


# ----------------------------------------------------------------- running
def _launch(tool, script, argv, cfg):
    if tool in cfg["opencv_tools"]:
        tmp = os.environ.get("TMPDIR", "/tmp")
        env = dict(os.environ, UV_CACHE_DIR=os.path.join(tmp, "uvcache"), UV_TOOL_DIR=os.path.join(tmp, "uvtools"),
                   UV_PYTHON_INSTALL_DIR=os.path.join(tmp, "uvpy"))
        env.setdefault("UV_OFFLINE", "1")     # the packages are cached; without this uv asks the network
        cmd = ["uv", "run", "--no-project", "--with", "opencv-python-headless", "--with", "numpy",
               "--with", "pillow", "python", script] + argv
    else:
        env, cmd = None, [sys.executable, script] + argv
    t0 = time.time()
    try:
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, cwd=C.ROOT,
                           timeout=float(cfg["timeout_s"]))
        return cmd, p.returncode, (p.stderr.decode("utf8", "replace") or p.stdout.decode("utf8", "replace"))[-600:], time.time() - t0
    except subprocess.TimeoutExpired:
        return cmd, None, "timeout after %s s" % cfg["timeout_s"], time.time() - t0
    except FileNotFoundError as e:
        return cmd, None, "cannot start: %s" % e, time.time() - t0


def _find_result(out, tool, argv, cfg, t0):
    """The JSON a tool wrote into its out dir during this run."""
    names = [cfg["result_file"].get(tool, tool + ".json")]
    if "--name" in argv:
        names.insert(0, "%s-%s.json" % (tool, argv[argv.index("--name") + 1]))
    for n in names:
        p = os.path.join(out, n)
        if os.path.isfile(p) and os.path.getmtime(p) >= t0 - 1:
            return p
    return None


def run_tool(tool, c, out_root, cfg, checks, runs, not_checked):
    def unmeasured(el, note, name="run"):
        checks.append({"tool": tool, "element": el, "name": name, "verdict": C.UNMEASURED, "measured": None,
                       "threshold": None, "note": note})

    script = os.path.join(HERE, tool + ".py")
    if tool in BUILTIN:
        out = os.path.join(out_root, tool)
        os.makedirs(out, exist_ok=True)
        t0 = time.time()
        rc = BUILTIN[tool](c, out, cfg)
        res = os.path.join(out, tool + ".json")
        with open(res, "r", encoding="utf8") as f:
            data = json.load(f)
        ev = [e.get("path") for e in data.get("evidence") or [] if e.get("path")]
        for r in data.get("checks") or []:
            checks.append({"tool": tool, "element": None, "name": r.get("name"), "verdict": r.get("verdict"),
                           "measured": r.get("measured"), "threshold": r.get("threshold"), "note": r.get("note"),
                           "evidence": ev[:1]})
        for n in data.get("not_checked") or []:
            not_checked.append("%s: %s" % (tool, n))
        runs.append({"tool": tool, "element": None, "cmd": "built into gate.py", "exit": rc, "seconds": round(time.time() - t0, 1),
                     "status": "ran", "result": res, "result_sha": C.sha(res), "verdict": data.get("verdict"), "evidence": ev})
        return
    if not os.path.isfile(script):
        unmeasured(None, "tool tools/qa/%s.py does not exist" % tool)
        runs.append({"tool": tool, "status": "missing"})
        return
    out = os.path.join(out_root, tool)
    builder = BUILDERS.get(tool)
    if builder is None:
        jobs = [(None, [c["clip"], "--out", out], None)]
    elif tool == "density":
        jobs = builder(c, out, cfg)
    else:
        jobs = builder(c, out)
    for el, argv, problem in jobs:
        if problem and problem.startswith("N/A: "):
            not_checked.append("%s: %s" % (tool, problem[5:]))
            runs.append({"tool": tool, "element": el, "status": "not applicable", "reason": problem[5:]})
            continue
        if problem:
            unmeasured(el, "not run: " + problem)
            runs.append({"tool": tool, "element": el, "status": "not applicable", "reason": problem})
            continue
        os.makedirs(out, exist_ok=True)
        t0 = time.time()
        cmd, rc, tail, secs = _launch(tool, script, argv, cfg)
        run = {"tool": tool, "element": el, "cmd": " ".join(cmd), "exit": rc, "seconds": round(secs, 1)}
        res = _find_result(out, tool, argv, cfg, t0)
        data = None
        if res:
            try:
                with open(res, "r", encoding="utf8") as f:
                    data = json.load(f)
            except ValueError:
                data = None
        if rc not in (0, 1, 2) or data is None:
            run["status"] = "crashed" if rc is not None else "did not run"
            run["stderr_tail"] = tail
            unmeasured(el, "tool gave no usable result (exit %s): %s" % (rc, tail.strip().splitlines()[-1] if tail.strip() else ""))
            runs.append(run)
            continue
        run.update({"status": "ran", "result": res, "result_sha": C.sha(res), "verdict": data.get("verdict")})
        rows = data.get("checks") or []
        if isinstance(rows, dict):
            rows = [dict(v, name=k) for k, v in rows.items()]
        ev = [(e.get("path") or e.get("file")) if isinstance(e, dict) else e for e in (data.get("evidence") or [])]
        ev = [e for e in ev if e]
        tool_sha = data.get("clip_sha256") or data.get("clip_sha")
        if tool_sha and tool_sha != c["_sha"]:
            run["status"] = "wrong clip"
            unmeasured(el, "the tool's result is for another clip (sha %s)" % str(tool_sha)[:12])
            runs.append(run)
            continue
        if not ev:
            ev = sorted(os.path.join(out, f) for f in os.listdir(out)
                        if f.lower().endswith((".jpg", ".png")) and os.path.getmtime(os.path.join(out, f)) >= t0 - 1)
        run["evidence"] = ev
        seen_fail = False
        for r in rows:
            v = r.get("verdict")
            if v not in (C.PASS, C.FAIL, C.UNMEASURED):
                v = C.UNMEASURED
            seen_fail |= v == C.FAIL
            checks.append({"tool": tool, "element": el or r.get("element"), "name": r.get("name"), "verdict": v,
                           "measured": r.get("measured"), "threshold": r.get("threshold"), "note": r.get("note"),
                           "evidence": ev[:1]})
        if not rows:
            unmeasured(el, "tool wrote a result without checks")
        if rc == 1 and not seen_fail:
            checks.append({"tool": tool, "element": el, "name": "exit_code", "verdict": C.FAIL, "measured": 1,
                           "threshold": 0, "note": "tool exited 1 without a FAIL row"})
        if rc == 2 and not any(r.get("verdict") == C.UNMEASURED for r in rows):
            unmeasured(el, "tool exited 2 (could not measure)", "exit_code")
        for n in data.get("not_checked") or []:
            not_checked.append("%s%s: %s" % (tool, ("/" + el) if el else "", n))
        runs.append(run)


def apply_waivers(c, checks, cfg):
    waived, problems = [], []
    ws = c.get("waivers") or []
    for i, w in enumerate(ws):
        if not w.get("tool") or not str(w.get("reason", "")).strip():
            problems.append("waiver %d ignored: needs 'tool' and a 'reason'" % i)
            continue
        img = c["_rel"](w.get("image")) if w.get("image") else None
        if not img or not os.path.isfile(img):
            problems.append("waiver %d ignored: needs an evidence 'image' that exists (got %r)" % (i, w.get("image")))
            continue
        if len(waived) >= int(cfg["max_waivers"]):
            problems.append("waiver %d ignored: more than max_waivers (%d)" % (i, cfg["max_waivers"]))
            continue
        hit = [k for k in checks if k["tool"] == w["tool"] and k["verdict"] == C.UNMEASURED
               and (not w.get("name") or w["name"] == k["name"]) and (not w.get("element") or w["element"] == k["element"])]
        if not hit:
            if any(k["tool"] == w["tool"] and k["verdict"] == C.FAIL for k in checks):
                problems.append("waiver %d ignored: %s has a FAIL, and FAIL cannot be waived" % (i, w["tool"]))
            else:
                problems.append("waiver %d ignored: no UNMEASURED check of %s to waive" % (i, w["tool"]))
            continue
        for k in hit:
            k["verdict"] = WAIVED
            k["waiver"] = {"reason": w["reason"], "image": img, "index": i}
        waived.append({"tool": w["tool"], "name": w.get("name"), "element": w.get("element"),
                       "reason": w["reason"], "image": img, "image_sha": C.sha(img), "index": i, "checks": len(hit)})
    return waived, problems


def summary_image(c, checks, verdict, clip_sha):
    mid = None
    try:
        info = C.info(c["clip"])
        a, b = c.get("range") or [0, info["frames"]]
        n = (a + min(b, info["frames"]) - 1) // 2
        for _, f in C.frames(c["clip"], n, n + 1, size=(640, 360)):
            mid = C.label(f, "%s f%d" % (os.path.basename(c["clip"]), n))
    except Exception:
        pass
    font = C._font(13)
    lines = [("%s  %s  clip sha %s" % (c.get("id", "?"), verdict, clip_sha[:12]), (255, 255, 255))]
    if c.get("_left_out"):
        lines.append(("PARTIAL - not run: %s" % ", ".join(c["_left_out"]), (255, 200, 60)))
    col = {C.PASS: (120, 220, 120), C.FAIL: (255, 90, 90), C.UNMEASURED: (255, 200, 60), WAIVED: (150, 170, 255)}
    for k in checks:
        lines.append(("%-10s %s%s %s" % (k["verdict"], k["tool"], ("/" + k["element"]) if k.get("element") else "",
                                          k["name"]), col.get(k["verdict"], (255, 255, 255))))
    h = max(360, 18 * len(lines) + 12)
    im = Image.new("RGB", (640 + 620, h), (20, 20, 20))
    if mid is not None:
        im.paste(mid, (0, 0))
    d = ImageDraw.Draw(im)
    for i, (t, colr) in enumerate(lines):
        d.text((650, 6 + 18 * i), t[:84], fill=colr, font=font)
    return im


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("contract")
    ap.add_argument("--out", help="output directory (default qa/<id>/gate)")
    ap.add_argument("--only", help="comma list of tools to run; the result is PARTIAL (exit 2 at best), never a pass")
    ap.add_argument("--stop-on-fail", action="store_true", help="skip dearer tools once one has failed")
    ap.add_argument("--clip", help="override the contract's clip")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()
    cfg = C.save_cfg_defaults("gate", DEFAULTS)
    try:
        c = load_contract(a.contract)
        if a.clip:
            c["clip"] = os.path.abspath(a.clip)
        clip_sha = c["_sha"] = C.sha(c["clip"])
    except Exception as e:
        print("gate: could not start (%s: %s)" % (type(e).__name__, e))
        return 2
    cid = c.get("id") or os.path.splitext(os.path.basename(c["clip"]))[0]
    out = os.path.abspath(a.out or os.path.join(C.ROOT, "qa", cid, "gate"))
    os.makedirs(out, exist_ok=True)
    only = [t.strip() for t in a.only.split(",") if t.strip()] if a.only else None
    order = [t for t in cfg["order"] if t not in cfg["disabled"]]
    left_out = [t for t in cfg["order"] if t in cfg["disabled"] or (only and t not in only)]
    partial = bool(left_out)
    checks, runs, not_checked = [], [], []
    failed = False
    for tool in order:
        if only and tool not in only:
            continue
        if a.stop_on_fail and failed:
            checks.append({"tool": tool, "element": None, "name": "run", "verdict": C.UNMEASURED, "measured": None,
                           "threshold": None, "note": "not run: an earlier, cheaper gate failed (--stop-on-fail)"})
            runs.append({"tool": tool, "status": "skipped"})
            continue
        if not a.quiet:
            print("gate: running %s ..." % tool, flush=True)
        run_tool(tool, c, out, cfg, checks, runs, not_checked)
        failed = failed or any(k["verdict"] == C.FAIL for k in checks)
    waived, waiver_problems = apply_waivers(c, checks, cfg)
    c["_left_out"] = left_out
    if only:
        not_checked.append("gate: run restricted by --only to %s; tools left out: %s"
                           % (only, [t for t in order if t not in only]))
    for t in cfg["disabled"]:
        not_checked.append("gate: tool %s is disabled in qa.json gate.disabled" % t)
    not_checked += ["gate: independent review (G8), art gates, lint and tsc, preflight are not run by gate.py",
                    "gate: look tools measure the clip as given (normalize.py was not applied first)"]
    if not c.get("ref"):
        not_checked.append("gate: no reference in the contract - nothing was compared with a reference")
    if not any(e.get("look") or cfg["look_of_kind"].get(e.get("kind")) for e in c.get("elements") or []):
        not_checked.append("gate: no element with a density 'look' is declared - local detail (star count, cloud "
                           "tones) was judged on the whole frame only")
    vs = [k["verdict"] for k in checks]
    if C.FAIL in vs:
        verdict, rc = "FAIL", 1
    elif C.UNMEASURED in vs or not vs:
        verdict, rc = "INCOMPLETE", 2
    elif partial:
        verdict, rc = "PARTIAL", 2
    else:
        verdict, rc = "PASS", 0
    ipath = os.path.join(out, "gate.jpg")
    code = C.save_evidence(summary_image(c, checks, verdict, clip_sha), ipath, clip_sha)
    cc = {k: v for k, v in c.items() if not k.startswith("_")}
    result = {
        "tool": TOOL, "id": cid, "verdict": verdict, "exit_code": rc,
        "partial": partial, "tools_expected": list(cfg["order"]), "tools_left_out": left_out,
        "tools_run": sorted({r["tool"] for r in runs}), "max_waivers": cfg["max_waivers"],
        "mode": "reference" if c.get("ref") else "standalone",
        "clip": os.path.abspath(c["clip"]), "clip_sha": clip_sha,
        "contract": os.path.abspath(a.contract), "contract_sha": C.sha(a.contract),
        "qa_json_sha": C.sha(C.QA_JSON) if os.path.isfile(C.QA_JSON) else None,
        "ref_clip": c["ref"]["clip"] if c.get("ref") else None,
        "ref_sha": C.sha(c["ref"]["clip"]) if c.get("ref") and os.path.isfile(c["ref"]["clip"]) else None,
        "kit_version": None,
        "counts": {v: vs.count(v) for v in (C.PASS, C.FAIL, C.UNMEASURED, WAIVED)},
        "checks": checks, "waived": waived, "waiver_problems": waiver_problems,
        "not_checked": not_checked, "runs": runs, "contract_data": cc,
        "evidence": [{"path": ipath, "code": code}],
        "written": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    gpath = os.path.join(out, "gate.json")
    with open(gpath, "w", encoding="utf8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=C._jsonable)
        f.write("\n")
    if not a.quiet:
        for k in checks:
            if k["verdict"] != C.PASS:
                print("  %-10s %s%s %s  measured=%s  %s" % (
                    k["verdict"], k["tool"], ("/" + k["element"]) if k.get("element") else "", k["name"],
                    json.dumps(k.get("measured"), default=C._jsonable)[:120], k.get("note") or ""))
        print("gate: %s  %s%s  -> %s" % (verdict, result["counts"],
                                         ("  NOT RUN: %s" % left_out) if partial else "", gpath))
    return rc


if __name__ == "__main__":
    sys.exit(main())
