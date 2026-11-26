"""Remove a flat background from ONE picture (a full-body character, a prop) by flood fill from the border.

usage:
  python3 tools/art/key.py IN.png OUT.png [--tolerance N] [--out R.json] [--force]

Use this instead of tools/art/cut.py when the picture holds a single subject whose colours may come close
to the background (the approved front picture of the hooded character is green on green): only background
that is CONNECTED to the border is removed, so key-like colours inside the subject survive.
Run tools/art/keycheck.py first; when it fails, look closely at the evidence image of this tool.

Steps: sample the key from the border ring, flood from the border through pixels within --tolerance of
the key (default qa.json art.key_single.tolerance), shave shave_px of fringe, soften the edge, bleed the
interior colour into the edge (tools/art/spill.py despill), crop to the subject.
Writes OUT.png (never overwrites without --force), the result JSON (default qa/art/key-<name>.json) with
the crop box, and an evidence image: the subject on a checkerboard, on white and on dark.
Checks (thresholds in qa.json art.key_single): subject does not touch the border, subject share of the
frame within bounds, one main body (largest part holds >= min_main_frac of the subject), and spill of the
result (same measure as spill.py, strict). Exit 0 = pass, 1 = fail, 2 = could not measure.
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
import spill as S


def subject_mask(rgb, tol):
    key, spread = C.key_colour(rgb)
    bg = C.border_connected(C.dist(rgb, key) <= tol)
    return ~bg, key, spread


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src'); ap.add_argument('dst'); ap.add_argument('--tolerance', type=float)
    ap.add_argument('--out'); ap.add_argument('--force', action='store_true'); ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()
    t = C.cfg('key_single'); ts = C.cfg('spill')
    tol = a.tolerance if a.tolerance is not None else t['tolerance']
    stem = os.path.splitext(os.path.basename(a.dst))[0]
    out = a.out or os.path.join(C.ROOT, 'qa', 'art', f'key-{stem}.json')
    R = C.Result('art/key.py', 'standalone', {'src': C.rel(a.src), 'dst': C.rel(a.dst), 'tolerance': tol}, t)
    if os.path.exists(a.dst) and not a.force:
        print(f'{a.dst} exists: refusing to overwrite (use --force)', file=sys.stderr); sys.exit(2)
    try:
        im = Image.open(a.src).convert('RGB')
    except OSError as e:
        print(e, file=sys.stderr); sys.exit(2)
    rgb = np.asarray(im).astype(float); h, w = rgb.shape[:2]
    subj, key, spread = subject_mask(rgb, tol)
    lab0, comps0 = C.label(subj)
    specks = [c['id'] for c in comps0 if c['area'] < t['speck_max_area']]
    subj = subj & ~np.isin(lab0, specks)  # stray noise pixels (image corners) are not subject
    if not subj.any():
        R.check('subject_found', 0, '> 0', None); R.write(out, a.quiet); sys.exit(2)
    ys, xs = np.nonzero(subj)
    touch = bool(xs.min() == 0 or ys.min() == 0 or xs.max() == w - 1 or ys.max() == h - 1)
    R.check('subject_clear_of_border', not touch, True, not touch)
    frac = float(subj.mean())
    R.check('subject_frac', round(frac, 4), f"{t['min_subject_frac']} .. {t['max_subject_frac']}",
            t['min_subject_frac'] <= frac <= t['max_subject_frac'])
    _, comps = C.label(subj)
    main_frac = max(c['area'] for c in comps) / subj.sum()
    R.check('main_body_frac', round(float(main_frac), 4), f">= {t['min_main_frac']}", main_frac >= t['min_main_frac'],
            parts=len(comps))
    alpha = C.erode(subj, t['shave_px']).astype('uint8') * 255
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(t['soften'])))
    rgba = np.dstack([rgb, alpha]).astype('uint8')
    rgba = S.despill(rgba, key, ts)
    box = Image.fromarray(rgba).getbbox()
    piece = Image.fromarray(rgba).crop(box)
    os.makedirs(os.path.dirname(os.path.abspath(a.dst)), exist_ok=True)
    piece.save(a.dst)
    m = S.measure(np.asarray(piece), key, ts)
    R.check('spill_frac', round(m['spill_frac'], 4), f"<= {ts['max_spill_frac']}", m['spill_frac'] <= ts['max_spill_frac'])
    R.check('faint_fringe_frac', round(m['faint_frac'], 4), f"<= {ts['max_faint_frac_strict']}",
            m['faint_frac'] <= ts['max_faint_frac_strict'])
    R.d['measured'] = {'specks_removed': len(specks), 'key': C.hexc(key), 'border_spread': round(spread, 2), 'crop_box': list(box), 'size': list(piece.size)}
    tiles = []
    for bg, name in ((C.checker(piece.size), 'checker'), ((255, 255, 255), 'white'), ((24, 24, 28), 'dark')):
        tl = C.over(piece, bg); tl.thumbnail((520, 760))
        C.text(ImageDraw.Draw(tl), (6, 4), name, 14); tiles.append(tl)
    ev = os.path.splitext(out)[0] + '.jpg'
    C.hstack(tiles).save(ev, quality=88); R.evidence(ev)
    R.not_checked('art lost because it is connected to the border through key-like colours (look at the evidence image)')
    R.not_checked('background trapped inside the subject (enclosed regions are kept on purpose)')
    R.write(out, a.quiet)
    sys.exit(R.exit_code())


if __name__ == '__main__':
    main()
