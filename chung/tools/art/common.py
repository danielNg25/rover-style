"""Shared helpers for the art tools (tools/art/*.py). Not a command.

Pure numpy + Pillow (no scipy, no OpenCV). Everything a tool needs to behave like
the other QA tools of the engine lives here:
  cfg(section)          thresholds from qa.json["art"][section] (never from code)
  Result                collects checks (PASS / FAIL / UNMEASURED), writes the JSON, gives the exit code
  key_colour(rgb)       background key colour sampled from the border ring
  keyness(rgb, key)     how much of the key's colour direction a pixel carries (0 = none, 1 = pure key)
  label(mask)           8-connected components (run based, no label cap)
  dilate / erode        square structuring element via Pillow rank filters
  bleed(rgb, known, n)  spread known colours outward n pixels (edge-colour bleed)
Exit codes used by every tool: 0 = pass, 1 = fail, 2 = could not measure.
"""
import hashlib
import json
import os
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
QA_JSON = os.environ.get('ART_QA_JSON', os.path.join(ROOT, 'qa.json'))
PASS, FAIL, UNMEASURED = 'PASS', 'FAIL', 'UNMEASURED'


def cfg(section):
    """Thresholds for one tool. Exits 2 when qa.json or the key is missing: no silent defaults."""
    try:
        return json.load(open(QA_JSON))['art'][section]
    except (OSError, KeyError, ValueError) as e:
        print(f'could not read thresholds art.{section} from {QA_JSON}: {e!r}', file=sys.stderr)
        sys.exit(2)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def rel(path):
    p = os.path.abspath(path)
    return os.path.relpath(p, ROOT) if p.startswith(ROOT + os.sep) else p


class Result:
    """One tool run: checks, thresholds, evidence, things not checked."""

    def __init__(self, tool, mode, inputs, thresholds):
        self.d = {'tool': tool, 'mode': mode, 'time': time.strftime('%Y-%m-%dT%H:%M:%S'),
                  'inputs': inputs, 'thresholds': thresholds, 'checks': [], 'warnings': [],
                  'not_checked': [], 'evidence': [], 'measured': {}}

    def check(self, name, value, threshold, ok, note=None, **extra):
        """ok: True -> PASS, False -> FAIL, None -> UNMEASURED."""
        v = UNMEASURED if ok is None else (PASS if ok else FAIL)
        c = {'name': name, 'value': value, 'threshold': threshold, 'verdict': v}
        if note:
            c['note'] = note
        c.update(extra)
        self.d['checks'].append(c)
        return v

    def warn(self, text):
        self.d['warnings'].append(text)

    def not_checked(self, text):
        self.d['not_checked'].append(text)

    def evidence(self, path):
        self.d['evidence'].append(rel(path))

    def verdict(self):
        """FAIL when any check failed. UNMEASURED (exit 2) when any check could not be measured: a run that
        could not judge one of its own checks is never an overall PASS, so a caller that reads only the exit
        code cannot take it for a pass. PASS only when every check passed."""
        vs = [c['verdict'] for c in self.d['checks']]
        if FAIL in vs:
            return FAIL
        if not vs or UNMEASURED in vs:
            return UNMEASURED
        return PASS

    def exit_code(self):
        return {PASS: 0, FAIL: 1, UNMEASURED: 2}[self.verdict()]

    def write(self, path, quiet=False):
        self.d['verdict'] = self.verdict()
        os.makedirs(os.path.dirname(os.path.abspath(path)) or '.', exist_ok=True)
        json.dump(self.d, open(path, 'w'), indent=1, default=_js)
        if not quiet:
            for c in self.d['checks']:
                print(f"  {c['verdict']:<10} {c['name']}: {c['value']}  (threshold {c['threshold']})")
            for w in self.d['warnings']:
                print('  WARNING   ', w)
            for n in self.d['not_checked']:
                print('  NOT CHECKED', n)
            if self.d['verdict'] == UNMEASURED:
                print('  overall UNMEASURED (exit 2): at least one check could not be measured, see the UNMEASURED lines')
            print(f"{self.d['tool']}: {self.d['verdict']}  -> {rel(path)}" +
                  ''.join(f'\n  evidence: {e}' for e in self.d['evidence']))
        return self.d


def _js(o):
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (np.floating,)):
        return round(float(o), 5)
    if isinstance(o, np.ndarray):
        return o.tolist()
    return str(o)


def parse_colour(s):
    s = s.lstrip('#')
    return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], float)


def hexc(c):
    return '#%02X%02X%02X' % tuple(int(round(float(v))) for v in c[:3])


def key_colour(rgb, ring=6):
    """Median colour of the border ring and its spread (max per-channel std)."""
    a = np.asarray(rgb, float)
    b = np.concatenate([a[:ring].reshape(-1, 3), a[-ring:].reshape(-1, 3),
                        a[:, :ring].reshape(-1, 3), a[:, -ring:].reshape(-1, 3)])
    med = np.median(b, axis=0)
    spread = float(np.sqrt(((b - med) ** 2).sum(1)).mean())
    return med, spread


def keyness(rgb, key):
    """Signed amount of the key's colour direction in each pixel, 0..1 for real spill.
    Magenta key: (min(R,B) - G) / 255.  Green key: (G - max(R,B)) / 255.  Works on dark thin lines
    because it is a channel difference, not a hue."""
    a = np.asarray(rgb, float)
    hi = [i for i in range(3) if key[i] >= 128]
    lo = [i for i in range(3) if key[i] < 128]
    if not hi or not lo:  # white / black key: fall back to closeness
        return 1 - np.sqrt(((a - key) ** 2).sum(-1)) / 441.7
    return (a[..., hi].min(-1) - a[..., lo].max(-1)) / 255.0


def dist(rgb, c):
    return np.sqrt(((np.asarray(rgb, float) - np.asarray(c, float)) ** 2).sum(-1))


def maxfilter(a, r, fill=0):
    """Square (2r+1) running maximum of a 2-D array, separable, O(log r) passes. Outside = fill."""
    if r <= 0:
        return a.copy()
    L = 2 * r + 1
    m = np.pad(a, r, constant_values=fill)
    for axis in (0, 1):
        cur = 1
        while cur < L:
            step = min(cur, L - cur)
            sh = np.full_like(m, fill)
            src = [slice(None)] * 2; dst = [slice(None)] * 2
            src[axis] = slice(step, None); dst[axis] = slice(0, -step)
            sh[tuple(dst)] = m[tuple(src)]
            m = np.maximum(m, sh)
            cur += step
        # the window now covers [i, i+L-1]; shift back by r to centre it
        sl = [slice(None)] * 2
        sl[axis] = slice(0, a.shape[axis])
        m = m[tuple(sl)]
    return m


def dilate(mask, r):
    return maxfilter(np.asarray(mask, bool), r, False)


def erode(mask, r):
    """The image border does not count as outside."""
    return ~maxfilter(~np.asarray(mask, bool), r, False)


def label(mask):
    """8-connected components. Returns (labels int32 with 0 = background, list of dicts
    {id, area, x0, y0, x1, y1}) with x1/y1 exclusive. Run based with union-find, no label cap."""
    m = np.asarray(mask, bool)
    h, w = m.shape
    d = np.diff(np.pad(m.astype(np.int8), ((0, 0), (1, 1))), axis=1)
    rs, ss = np.nonzero(d == 1)
    _, es = np.nonzero(d == -1)
    n = len(rs)
    if n == 0:
        return np.zeros((h, w), np.int32), []
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    row_start = np.searchsorted(rs, np.arange(h + 1))
    S, E = ss.tolist(), es.tolist()
    for y in range(1, h):
        a0, a1 = row_start[y - 1], row_start[y]
        b0, b1 = row_start[y], row_start[y + 1]
        i, j = a0, b0
        while i < a1 and j < b1:
            if S[j] <= E[i] and S[i] <= E[j]:  # touch, diagonals included
                ri, rj = find(i), find(j)
                if ri != rj:
                    parent[max(ri, rj)] = min(ri, rj)
            if E[i] < E[j]:
                i += 1
            else:
                j += 1
    roots = np.array([find(i) for i in range(n)])
    uniq, ids = np.unique(roots, return_inverse=True)
    ids = ids + 1
    k = len(uniq)
    lab = np.zeros((h, w + 1), np.int64)
    np.add.at(lab, (rs, ss), ids)
    np.add.at(lab, (rs, es), -ids)
    lab = np.cumsum(lab, axis=1)[:, :w].astype(np.int32)
    area = np.zeros(k + 1, np.int64)
    np.add.at(area, ids, es - ss)
    x0 = np.full(k + 1, w); y0 = np.full(k + 1, h); x1 = np.zeros(k + 1, int); y1 = np.zeros(k + 1, int)
    np.minimum.at(x0, ids, ss); np.maximum.at(x1, ids, es)
    np.minimum.at(y0, ids, rs); np.maximum.at(y1, ids, rs + 1)
    comps = [{'id': i, 'area': int(area[i]), 'x0': int(x0[i]), 'y0': int(y0[i]), 'x1': int(x1[i]), 'y1': int(y1[i])}
             for i in range(1, k + 1)]
    return lab, comps


def border_connected(mask):
    """Part of mask that is connected to the image border (the outside background)."""
    lab, comps = label(mask)
    if not comps:
        return np.zeros_like(mask, bool)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    return np.isin(lab, edge[edge > 0])


def bleed(rgb, known, iters):
    """Spread the colours of `known` pixels outward by up to `iters` pixels (mean of known neighbours).
    Returns (rgb float, known mask after spreading)."""
    c = np.asarray(rgb, float).copy()
    k = known.copy()
    c[~k] = 0
    for _ in range(iters):
        if k.all():
            break
        ps = np.pad(c, ((1, 1), (1, 1), (0, 0)))
        pk = np.pad(k.astype(float), 1)
        h, w = k.shape
        s = np.zeros_like(c); n = np.zeros((h, w))
        for dy in (0, 1, 2):
            for dx in (0, 1, 2):
                if dy == 1 and dx == 1:
                    continue
                s += ps[dy:dy + h, dx:dx + w]
                n += pk[dy:dy + h, dx:dx + w]
        new = (n > 0) & ~k
        if not new.any():
            break
        c[new] = s[new] / n[new][:, None]
        k = k | new
    return c, k


def rgb_to_lab(rgb):
    """sRGB (0..255) to CIE Lab (D65)."""
    a = np.asarray(rgb, float) / 255.0
    a = np.where(a > 0.04045, ((a + 0.055) / 1.055) ** 2.4, a / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = a @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def rgb_to_hsv(rgb):
    """Hue in degrees, saturation and value 0..1."""
    a = np.asarray(rgb, float) / 255.0
    mx, mn = a.max(-1), a.min(-1)
    df = mx - mn
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    safe = np.where(df == 0, 1, df)
    h = np.where(mx == r, ((g - b) / safe) % 6, np.where(mx == g, (b - r) / safe + 2, (r - g) / safe + 4)) * 60
    h = np.where(df == 0, 0, h) % 360
    s = np.where(mx == 0, 0, df / np.where(mx == 0, 1, mx))
    return h, s, mx


def hue_dist(h, h0):
    d = np.abs(h - h0) % 360
    return np.minimum(d, 360 - d)


def font(size):
    for p in ('/System/Library/Fonts/Helvetica.ttc', '/System/Library/Fonts/Supplemental/Arial.ttf',
              '/Library/Fonts/Arial.ttf'):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()


def text(draw, xy, s, size=18, fill=(255, 255, 255)):
    draw.text(xy, s, fill=fill, font=font(size), stroke_width=max(2, size // 9), stroke_fill=(0, 0, 0))


def checker(size, cell=12, a=(200, 200, 200), b=(120, 120, 120)):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    m = ((xx // cell + yy // cell) % 2).astype(bool)
    out = np.empty((h, w, 3), 'uint8')
    out[m] = a
    out[~m] = b
    return Image.fromarray(out)


def over(rgba, bg):
    """Composite an RGBA picture over an RGB background of the same size (or a colour)."""
    if not isinstance(bg, Image.Image):
        bg = Image.new('RGB', rgba.size, tuple(bg))
    out = bg.copy().convert('RGB')
    out.paste(rgba.convert('RGB'), (0, 0), rgba.getchannel('A'))
    return out


def hstack(images, gap=8, bg=(30, 30, 30)):
    h = max(i.height for i in images)
    w = sum(i.width for i in images) + gap * (len(images) - 1)
    out = Image.new('RGB', (w, h), bg)
    x = 0
    for i in images:
        out.paste(i.convert('RGB'), (x, 0))
        x += i.width + gap
    return out


def vstack(images, gap=8, bg=(30, 30, 30)):
    w = max(i.width for i in images)
    h = sum(i.height for i in images) + gap * (len(images) - 1)
    out = Image.new('RGB', (w, h), bg)
    y = 0
    for i in images:
        out.paste(i.convert('RGB'), (0, y))
        y += i.height + gap
    return out
