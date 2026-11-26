"""Shared helpers for the QA tools in tools/qa/ (package Q1, "plumbing").

Import from a sibling script with:

    import os, sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import common as C

Needs only Python 3, numpy, Pillow and ffmpeg/ffprobe on PATH (no OpenCV).

FROZEN API (signatures do not change)
-------------------------------------
info(path) -> dict
    {"frames": int, "width": int, "height": int, "fps": float, "first_pts": float}
    plus extra keys: codec, pix_fmt, duration, bit_rate, time_base, path.
    "frames" is the packet count of the first video stream (no decode);
    "first_pts" is the pts of the first packet in seconds.

frames(path, start=0, end=None, crop=None, size=None, grey=False)
    -> iterator of (n, ndarray)
    Sequential decode through ONE ffmpeg pipe (never seeks). n is the frame
    index in the source file, counted from 0. `end` is EXCLUSIVE (Python
    style): frames(p, 173, 232) yields n = 173 .. 231. crop is "w:h:x:y"
    (string, or a 4-tuple in that order) in source pixels and is applied
    before size; size is (width, height). Arrays are uint8, shape (H, W, 3)
    RGB, or (H, W) when grey=True. Each array is a fresh writable copy.

sha(path) -> str                      sha256 hex digest of a file
load_cfg(key) -> dict                 qa.json[key] ({} when file or key is absent)
write_result(path, tool, checks, not_checked, extra=None) -> int
    Writes the JSON result and returns the exit code (0 pass, 1 fail,
    2 could not measure). `checks` is a list of dicts made with check().
    `not_checked` is a list of strings: what this run did NOT verify.
tile(images, labels, cols) -> PIL.Image
    Grid of images (ndarray or PIL), each with its label burned in top-left.
code(clip_sha, name) -> str           4-character evidence code

Additional helpers (additive, also stable)
------------------------------------------
ROOT, QA_JSON                         project root and the qa.json path
check(name, verdict, measured=None, threshold=None, note=None) -> dict
PASS, FAIL, UNMEASURED                the three verdict strings
exit_code(checks) -> int              0 / 1 / 2 from a list of checks
parse_crop(crop) -> (w, h, x, y) or None
parse_range("a:b") -> (a, b)          b exclusive; "a:" means to the end
save_cfg_defaults(key, defaults) -> dict
    Read-modify-write of qa.json under a file lock: adds missing keys of
    `defaults` under qa.json[key], never touches other keys, returns the
    merged dict. Use it so a tool's thresholds live in qa.json, not in code.
to_pil(img) -> PIL.Image
label(img, text, corner="tl") -> PIL.Image      burn text into an image
save_evidence(img, path, clip_sha) -> str
    Stamps the 4-character code (bottom-right) and saves; returns the code.
evidence_dir(clip_path, sub=None) -> str        qa/<clip stem>[/sub], created
tmpdir() -> str                       "$TMPDIR/rover-qa", created
run(cmd) -> str                       subprocess with stderr captured, raises on error
ffmpeg_fail_hint                      text to print when ffmpeg is missing

Verdict rule: FAIL if any check is FAIL; otherwise UNMEASURED (exit 2) if any
check is UNMEASURED or there are no checks; otherwise PASS. UNMEASURED never
counts as a pass.
"""
import contextlib
import fcntl
import hashlib
import json
import os
import subprocess
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
QA_JSON = os.path.join(ROOT, "qa.json")
PASS, FAIL, UNMEASURED = "PASS", "FAIL", "UNMEASURED"
ffmpeg_fail_hint = "ffmpeg/ffprobe must be on PATH"


# ---------------------------------------------------------------- processes
def run(cmd):
    """Run a command, return stdout as text; raise RuntimeError with stderr."""
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0:
        raise RuntimeError("command failed (%d): %s\n%s" % (
            p.returncode, " ".join(map(str, cmd)), p.stderr.decode("utf8", "replace")[-2000:]))
    return p.stdout.decode("utf8", "replace")


def tmpdir():
    d = os.path.join(os.environ.get("TMPDIR", "/tmp"), "rover-qa")
    os.makedirs(d, exist_ok=True)
    return d


# ---------------------------------------------------------------- probing
def _ratio(s):
    try:
        a, b = s.split("/")
        return float(a) / float(b) if float(b) else 0.0
    except Exception:
        try:
            return float(s)
        except Exception:
            return 0.0


def info(path):
    """ffprobe facts of the first video stream. See module docstring."""
    if not os.path.isfile(path):
        raise FileNotFoundError(path)
    j = json.loads(run([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
        "-show_entries",
        "stream=codec_name,pix_fmt,width,height,r_frame_rate,avg_frame_rate,time_base,"
        "nb_read_packets,bit_rate:format=duration,bit_rate",
        "-of", "json", path]))
    st = j["streams"][0]
    fmt = j.get("format", {})
    first = run([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-read_intervals", "%+#1",
        "-show_entries", "packet=pts_time", "-of", "csv=p=0", path]).strip().splitlines()
    try:
        first_pts = float(first[0].split(",")[0])
    except Exception:
        first_pts = float("nan")
    fps = _ratio(st.get("avg_frame_rate", "0/1")) or _ratio(st.get("r_frame_rate", "0/1"))
    br = st.get("bit_rate") or fmt.get("bit_rate")
    return {
        "frames": int(st.get("nb_read_packets", 0)),
        "width": int(st["width"]),
        "height": int(st["height"]),
        "fps": fps,
        "first_pts": first_pts,
        "codec": st.get("codec_name"),
        "pix_fmt": st.get("pix_fmt"),
        "duration": float(fmt["duration"]) if fmt.get("duration") else None,
        "bit_rate": int(br) if br else None,
        "time_base": st.get("time_base"),
        "path": os.path.abspath(path),
    }


def parse_crop(crop):
    """'w:h:x:y' or (w, h, x, y) -> tuple of 4 ints; None stays None."""
    if crop is None or crop == "":
        return None
    if isinstance(crop, str):
        parts = crop.replace(",", ":").split(":")
    else:
        parts = list(crop)
    if len(parts) != 4:
        raise ValueError("crop must be w:h:x:y, got %r" % (crop,))
    return tuple(int(round(float(p))) for p in parts)


def parse_range(text):
    """'a:b' -> (a, b) with b exclusive; 'a:' -> (a, None); None -> (0, None)."""
    if not text:
        return 0, None
    a, _, b = str(text).partition(":")
    return int(a or 0), (int(b) if b else None)


def frames(path, start=0, end=None, crop=None, size=None, grey=False):
    """Yield (n, ndarray) by sequential decode. See module docstring."""
    if not os.path.isfile(path):
        raise FileNotFoundError(path)
    c = parse_crop(crop)
    if size is not None:
        w, h = int(size[0]), int(size[1])
    elif c is not None:
        w, h = c[0], c[1]
    else:
        j = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                            "-show_entries", "stream=width,height", "-of", "json", path]))
        w, h = int(j["streams"][0]["width"]), int(j["streams"][0]["height"])
    start = max(0, int(start or 0))
    trim = "trim=start_frame=%d" % start
    if end is not None:
        if int(end) <= start:
            return
        trim += ":end_frame=%d" % int(end)
    vf = [trim]
    if c is not None:
        vf.append("crop=%d:%d:%d:%d" % c)
    vf.append("scale=%d:%d:flags=area" % (w, h))
    vf.append("format=%s" % ("gray" if grey else "rgb24"))
    cmd = ["ffmpeg", "-v", "error", "-nostdin", "-i", path, "-map", "0:v:0", "-an", "-sn",
           "-vf", ",".join(vf), "-fps_mode", "passthrough",
           "-f", "rawvideo", "-pix_fmt", "gray" if grey else "rgb24", "-"]
    nbytes = w * h * (1 if grey else 3)
    shape = (h, w) if grey else (h, w, 3)
    errf = open(os.path.join(tmpdir(), "ffmpeg-%d-%d.err" % (os.getpid(), time.time_ns())), "w+b")
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=errf, bufsize=0)
    n = start
    try:
        while True:
            buf = bytearray()
            while len(buf) < nbytes:
                chunk = p.stdout.read(nbytes - len(buf))
                if not chunk:
                    break
                buf += chunk
            if len(buf) < nbytes:
                break
            yield n, np.frombuffer(bytes(buf), np.uint8).reshape(shape).copy()
            n += 1
        p.stdout.close()
        rc = p.wait()
        if rc != 0:
            errf.seek(0)
            raise RuntimeError("ffmpeg decode failed: " + errf.read().decode("utf8", "replace")[-1500:])
    finally:
        if p.poll() is None:
            p.kill()
            p.wait()
        with contextlib.suppress(Exception):
            p.stdout.close()
        name = errf.name
        errf.close()
        with contextlib.suppress(Exception):
            os.remove(name)


# ---------------------------------------------------------------- hashing, config
def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def code(clip_sha, name):
    """4-character evidence code from the clip sha and the evidence file name.

    Only the base name of `name` is used, so the code survives moving the
    folder but not renaming the file or re-rendering the clip.
    """
    base = os.path.basename(str(name))
    return hashlib.sha256((str(clip_sha) + ":" + base).encode("utf8")).hexdigest()[:4].upper()


def load_cfg(key):
    """qa.json[key] as a dict; {} when the file or the key does not exist."""
    try:
        with open(QA_JSON, "r", encoding="utf8") as f:
            data = json.load(f)
    except FileNotFoundError:
        return {}
    v = data.get(key, {})
    return v if isinstance(v, dict) else {}


def _merge_missing(dst, src):
    changed = False
    for k, v in src.items():
        if k not in dst:
            dst[k] = v
            changed = True
        elif isinstance(v, dict) and isinstance(dst[k], dict):
            changed = _merge_missing(dst[k], v) or changed
    return changed


def save_cfg_defaults(key, defaults):
    """Add missing defaults under qa.json[key] (locked read-modify-write)."""
    lock = QA_JSON + ".lock"
    with open(lock, "w") as lf:
        fcntl.flock(lf, fcntl.LOCK_EX)
        try:
            try:
                with open(QA_JSON, "r", encoding="utf8") as f:
                    data = json.load(f)
            except FileNotFoundError:
                data = {}
            cur = data.setdefault(key, {})
            if _merge_missing(cur, defaults):
                tmp = QA_JSON + ".tmp%d" % os.getpid()
                with open(tmp, "w", encoding="utf8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                    f.write("\n")
                os.replace(tmp, QA_JSON)
            return cur
        finally:
            fcntl.flock(lf, fcntl.LOCK_UN)


# ---------------------------------------------------------------- results
def check(name, verdict, measured=None, threshold=None, note=None):
    """One check row. verdict is PASS, FAIL or UNMEASURED."""
    if verdict not in (PASS, FAIL, UNMEASURED):
        raise ValueError("verdict must be PASS, FAIL or UNMEASURED, got %r" % (verdict,))
    d = {"name": name, "verdict": verdict, "measured": measured, "threshold": threshold}
    if note:
        d["note"] = note
    return d


def exit_code(checks):
    vs = [c.get("verdict") for c in checks]
    if FAIL in vs:
        return 1
    if not vs or UNMEASURED in vs or any(v != PASS for v in vs):
        return 2
    return 0


def _jsonable(o):
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return float(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, (set, tuple)):
        return list(o)
    return str(o)


def write_result(path, tool, checks, not_checked, extra=None):
    """Write the JSON result; return the exit code (0 / 1 / 2)."""
    if isinstance(checks, dict):
        checks = [dict(v, name=k) for k, v in checks.items()]
    rc = exit_code(checks)
    out = {
        "tool": tool,
        "verdict": {0: PASS, 1: FAIL, 2: UNMEASURED}[rc],
        "exit_code": rc,
        "checks": checks,
        "not_checked": list(not_checked or []),
        "written": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    if extra:
        out.update(extra)
    d = os.path.dirname(os.path.abspath(path))
    os.makedirs(d, exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False, default=_jsonable)
        f.write("\n")
    return rc


def print_summary(tool, checks, not_checked, result_path, evidence=()):
    """Short human-readable summary on stdout."""
    rc = exit_code(checks)
    print("%s: %s" % (tool, {0: PASS, 1: FAIL, 2: UNMEASURED}[rc]))
    for c in checks:
        print("  %-10s %-28s measured=%s threshold=%s%s" % (
            c["verdict"], c["name"], json.dumps(c.get("measured"), default=_jsonable)[:160],
            json.dumps(c.get("threshold"), default=_jsonable)[:80],
            ("  (" + c["note"] + ")") if c.get("note") else ""))
    for n in not_checked or []:
        print("  NOT CHECKED: " + n)
    print("  result: " + result_path)
    for e in evidence:
        print("  evidence: " + e)
    return rc


# ---------------------------------------------------------------- evidence images
_FONT_CACHE = {}


def _font(px):
    if px not in _FONT_CACHE:
        f = None
        for cand in ("/System/Library/Fonts/Menlo.ttc", "/System/Library/Fonts/Helvetica.ttc",
                     "/Library/Fonts/Arial.ttf", "DejaVuSans.ttf"):
            try:
                f = ImageFont.truetype(cand, px)
                break
            except Exception:
                continue
        _FONT_CACHE[px] = f or ImageFont.load_default()
    return _FONT_CACHE[px]


def to_pil(img):
    if isinstance(img, Image.Image):
        return img if img.mode == "RGB" else img.convert("RGB")
    a = np.asarray(img)
    if a.dtype != np.uint8:
        a = np.clip(a, 0, 255).astype(np.uint8)
    return Image.fromarray(a).convert("RGB")


def label(img, text, corner="tl"):
    """Burn `text` (white on a black box) into a corner: tl, tr, bl, br."""
    im = to_pil(img).copy()
    if text is None or text == "":
        return im
    px = max(11, min(28, im.height // 14))
    font = _font(px)
    d = ImageDraw.Draw(im)
    lines = str(text).split("\n")
    wmax = max(int(d.textlength(s, font=font)) for s in lines)
    bw, bh = wmax + 8, (px + 3) * len(lines) + 5
    x = 0 if corner[1] == "l" else im.width - bw
    y = 0 if corner[0] == "t" else im.height - bh
    d.rectangle([x, y, x + bw, y + bh], fill=(0, 0, 0))
    for i, s in enumerate(lines):
        d.text((x + 4, y + 2 + i * (px + 3)), s, fill=(255, 255, 255), font=font)
    return im


def tile(images, labels, cols):
    """Grid of images with labels burned in. Cells take the size of the first image."""
    ims = [to_pil(i) for i in images]
    if not ims:
        return Image.new("RGB", (320, 60), (40, 0, 0))
    labels = list(labels) if labels is not None else []
    labels += [None] * (len(ims) - len(labels))
    cw, ch = ims[0].size
    cols = max(1, min(int(cols), len(ims)))
    rows = (len(ims) + cols - 1) // cols
    gap = 4
    sheet = Image.new("RGB", (cols * cw + (cols + 1) * gap, rows * ch + (rows + 1) * gap), (24, 24, 24))
    for i, im in enumerate(ims):
        if im.size != (cw, ch):
            im = im.resize((cw, ch), Image.BILINEAR)
        im = label(im, labels[i])
        sheet.paste(im, (gap + (i % cols) * (cw + gap), gap + (i // cols) * (ch + gap)))
    return sheet


def save_evidence(img, path, clip_sha):
    """Stamp the 4-character code bottom-right, save, return the code."""
    c = code(clip_sha, path)
    im = label(img, c, corner="br")
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    if path.lower().endswith((".jpg", ".jpeg")):
        im.save(path, quality=90)
    else:
        im.save(path)
    return c


def evidence_dir(clip_path, sub=None):
    """qa/<clip file stem>[/sub] under the project root, created."""
    stem = os.path.splitext(os.path.basename(clip_path))[0]
    d = os.path.join(ROOT, "qa", stem)
    if sub:
        d = os.path.join(d, sub)
    os.makedirs(d, exist_ok=True)
    return d


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] not in ("-h", "--help"):
        print(json.dumps(info(sys.argv[1]), indent=2))
    else:
        print(__doc__)
