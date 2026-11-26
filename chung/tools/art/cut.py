"""Cut a parts sheet (flat key-colour background) into separate transparent PNGs.

usage:
  python3 tools/art/cut.py SHEET.png OUT_DIR PREFIX [options]

options:
  --names a,b,c        piece names in READING ORDER (rows top to bottom, left to right inside a row).
                       Files become PREFIX-<name>.png. The count must equal the number of pieces found,
                       otherwise the run FAILS (pieces are still written as PREFIX-N.png for diagnosis).
  --names-file F       the same, one name per line (lines starting with # are ignored)
  --expect N           expected number of pieces when no names are given
  --like M.json        keep the numbering of an existing manifest (old list format or this tool's format): every
                       new piece takes the number of the manifest piece whose box it overlaps. Without --like the
                       tool looks for an approved manifest public/*/PREFIX.json by itself, because the shot code
                       addresses pieces by number (Village.tsx: 'v-2', 'v-7'): the old tools/cut.py numbered by
                       fixed h/6 bands, true reading order differs (old v-2, v-3, v-1 = reading order 1, 2, 3).
  --order reading      number in true reading order even when an approved manifest exists; the check
                       numbering_same_as_approved then FAILS if any number would name a different piece.
  --min-area PX        smallest piece kept (default qa.json art.cut.min_area)
  --merge-dist PX      parts closer than this many pixels belong to ONE piece (default art.cut.merge_dist):
                       rivets beside a plate, a pupil beside an eye, cheek lines beside a mouth grille.
                       Use 0 to keep every connected blob separate.
  --key auto|'#RRGGBB' key colour (default auto = sampled from the border ring)
  --out R.json         result JSON (default qa/art/cut-<prefix>.json)
  --no-despill         keep edge colours as they are on the sheet

Writes into OUT_DIR:
  PREFIX-<name|N>.png    transparent piece, edge colours bled from the interior (tools/art/spill.py despill)
  PREFIX.json            manifest: sheet path + sha256, key, per piece {n, name, file, bbox, w, h, area,
                         centre, parts, row}, dropped specks, sheet size. bbox is [x0, y0, x1, y1] on the sheet.
  PREFIX-overview.jpg    the sheet with numbered, named boxes (evidence image); dropped specks in red

Differences from the old tools/cut.py: every pixel is labelled (no 4 px seed grid, no 250-label cap), pieces
are merged by distance instead of by bbox, rows are found from the pieces themselves instead of fixed h/6
bands, names are stable, nothing is dropped silently, and an existing file is never overwritten unless
--force is given.

Checks (standalone, thresholds in qa.json art.cut): piece_count (UNMEASURED, exit 2, when neither --names,
--expect nor an approved manifest says how many to expect), numbering_same_as_approved (only when a manifest
with this prefix exists or --like is given, and no names are used), no piece touches the sheet border,
smallest gap between two pieces >= min_gap, dropped area share <= max_dropped_frac, background flat.
Exit 0 = pass, 1 = fail, 2 = could not measure.
"""
import argparse
import glob
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
import spill as S


def reading_order(pieces):
    """Group pieces into rows (a piece joins a row when its centre lies inside the row's vertical extent),
    then sort each row by x centre."""
    rows = []
    for p in sorted(pieces, key=lambda p: p['bbox'][1]):
        cy = (p['bbox'][1] + p['bbox'][3]) / 2
        for r in rows:
            if r['y0'] <= cy <= r['y1']:
                r['items'].append(p); r['y0'] = min(r['y0'], p['bbox'][1]); r['y1'] = max(r['y1'], p['bbox'][3])
                break
        else:
            rows.append({'y0': p['bbox'][1], 'y1': p['bbox'][3], 'items': [p]})
    rows.sort(key=lambda r: r['y0'])
    out = []
    for i, r in enumerate(rows, 1):
        for p in sorted(r['items'], key=lambda p: (p['bbox'][0] + p['bbox'][2]) / 2):
            p['row'] = i
            out.append(p)
    return out


def iou(a, b):
    w = min(a[2], b[2]) - max(a[0], b[0]); h = min(a[3], b[3]) - max(a[1], b[1])
    if w <= 0 or h <= 0:
        return 0.0
    i = w * h
    return i / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i)


def old_name(file, prefix):
    stem = os.path.splitext(file)[0]
    return stem[len(prefix) + 1:] if stem.startswith(prefix + '-') else stem.split('-', 1)[-1]


def match_manifest(boxes, path, prefix, min_iou):
    """Pair new piece boxes with the pieces of an existing manifest. Returns (names per new piece or None, n_old)."""
    d = json.load(open(path))
    old = d['pieces'] if isinstance(d, dict) else d
    pairs = sorted(((iou(b, o['bbox']), i, j) for i, b in enumerate(boxes) for j, o in enumerate(old)), reverse=True)
    got, used = [None] * len(boxes), set()
    for v, i, j in pairs:
        if v < min_iou:
            break
        if got[i] is None and j not in used:
            got[i] = old_name(old[j]['file'], prefix); used.add(j)
    return got, len(old)


def min_gap(lab_groups, ids, limit=64):
    """Smallest Chebyshev distance between two different pieces, searched up to `limit` px."""
    present = lab_groups > 0
    BIG = 10 ** 9
    for r in (1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64):
        if r > limit:
            break
        mx = C.maxfilter(lab_groups, r, 0)
        mn = -C.maxfilter(np.where(present, -lab_groups, -BIG), r, -BIG)
        if ((mx > 0) & (mn < BIG) & (mx != mn)).any():  # a window of radius r sees two different pieces
            return 2 * r
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet'); ap.add_argument('out_dir'); ap.add_argument('prefix')
    ap.add_argument('--names'); ap.add_argument('--names-file'); ap.add_argument('--expect', type=int)
    ap.add_argument('--like'); ap.add_argument('--order', choices=['approved', 'reading'], default='approved')
    ap.add_argument('--min-area', type=int); ap.add_argument('--merge-dist', type=int)
    ap.add_argument('--key', default='auto'); ap.add_argument('--out')
    ap.add_argument('--no-despill', action='store_true'); ap.add_argument('--force', action='store_true')
    ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()
    t = C.cfg('cut'); ts = C.cfg('spill')
    min_area = a.min_area if a.min_area is not None else t['min_area']
    merge = a.merge_dist if a.merge_dist is not None else t['merge_dist']
    names = None
    if a.names_file:
        names = [l.strip() for l in open(a.names_file) if l.strip() and not l.startswith('#')]
    elif a.names:
        names = [n.strip() for n in a.names.split(',') if n.strip()]
    if names and len(set(names)) != len(names):
        print('duplicate names', file=sys.stderr); sys.exit(2)
    out_json = a.out or os.path.join(C.ROOT, 'qa', 'art', f'cut-{a.prefix}.json')
    R = C.Result('art/cut.py', 'standalone', {'sheet': C.rel(a.sheet), 'out_dir': C.rel(a.out_dir), 'prefix': a.prefix,
                                              'names': names, 'min_area': min_area, 'merge_dist': merge}, t)
    try:
        im = Image.open(a.sheet).convert('RGB')
    except OSError as e:
        print(e, file=sys.stderr); sys.exit(2)
    rgb = np.asarray(im).astype(float); h, w = rgb.shape[:2]
    sampled, spread = C.key_colour(rgb)
    key = sampled if a.key == 'auto' else C.parse_colour(a.key)
    R.check('background_flat', round(spread, 2), f"<= {t['max_border_spread']}", spread <= t['max_border_spread'])
    d = C.dist(rgb, key)
    fg = d > t['fg_dist']
    lab, comps = C.label(fg)
    if not comps:
        R.check('piece_count', 0, '>= 1', None, note='nothing but background'); R.write(out_json, a.quiet); sys.exit(2)
    # distance rule: label the dilated mask; every blob inside one dilated blob is one piece
    r = merge // 2
    glab, gcomps = C.label(C.dilate(fg, r)) if r > 0 else (lab, comps)
    glab = np.where(fg, glab, 0)
    n_g = len(gcomps)
    area = np.bincount(glab.ravel(), minlength=n_g + 1)
    ys, xs = np.nonzero(glab)
    g = glab[ys, xs]
    x0 = np.full(n_g + 1, w); y0 = np.full(n_g + 1, h); x1 = np.zeros(n_g + 1, int); y1 = np.zeros(n_g + 1, int)
    np.minimum.at(x0, g, xs); np.maximum.at(x1, g, xs + 1); np.minimum.at(y0, g, ys); np.maximum.at(y1, g, ys + 1)
    parts = np.zeros(n_g + 1, int)
    owner = glab[[c['y0'] for c in comps], [np.nonzero(lab[c['y0']] == c['id'])[0][0] for c in comps]]
    np.add.at(parts, owner, 1)
    pieces, dropped = [], []
    for i in range(1, n_g + 1):
        if area[i] == 0:
            continue
        rec = {'gid': i, 'bbox': [int(x0[i]), int(y0[i]), int(x1[i]), int(y1[i])], 'area': int(area[i]), 'parts': int(parts[i])}
        (pieces if area[i] >= min_area else dropped).append(rec)
    dropped = [p for p in dropped if p['area'] >= t['speck_min_area']]
    pieces = reading_order(pieces)
    pad = t['pad']
    pboxes = [[max(0, p['bbox'][0] - pad), max(0, p['bbox'][1] - pad), min(w, p['bbox'][2] + pad), min(h, p['bbox'][3] + pad)] for p in pieces]
    # numbering of an approved cut of the same sheet (the shot code addresses pieces by number)
    adopted, like_src, like_n = None, None, None
    if names is None:
        cands = [a.like] if a.like else sorted(glob.glob(os.path.join(C.ROOT, 'public', '*', a.prefix + '.json')))
        for mp in cands:
            try:
                got, n_old = match_manifest(pboxes, mp, a.prefix, t['like_min_iou'])
            except (OSError, ValueError, KeyError, TypeError) as e:
                if a.like:
                    print(f'could not read --like {mp}: {e!r}', file=sys.stderr); sys.exit(2)
                continue
            n_hit = sum(g is not None for g in got)
            if n_hit == 0 and not a.like:
                R.warn(f'{C.rel(mp)} has the prefix {a.prefix} but none of its boxes corresponds to a piece of this sheet '
                       '(another sheet, or a new layout): numbering is plain reading order; the shot code addresses pieces by number, check by eye')
                continue
            like_src, like_n = C.rel(mp), n_old
            full = n_hit == len(pieces) == n_old
            reading = [str(i) for i in range(1, len(pieces) + 1)]
            differ = [f'{g} (reading order {r})' for g, r in zip(got, reading) if g != r]
            if not full:
                R.check('numbering_same_as_approved', f'{n_hit} of {len(pieces)} pieces correspond', f'all {n_old} pieces of {like_src}', False,
                        note='the approved numbering cannot be kept: pieces are written in reading order for diagnosis only')
            elif a.order == 'reading':
                R.check('numbering_same_as_approved', differ, f'[] (numbers of {like_src})', not differ,
                        note='--order reading: these numbers would name a different piece than the approved files do' if differ else None)
            else:
                adopted = got
                R.check('numbering_same_as_approved', f'adopted from {like_src}', f'numbers of {like_src}', True,
                        differs_from_reading_order=differ)
                if differ:
                    R.warn(f'numbering adopted from {like_src}, not reading order, for {len(differ)} piece(s): ' + ', '.join(differ))
            break
    else:
        R.not_checked('numbering against an approved manifest (names were given: files are addressed by name)')
    count_ok = True
    if names is not None:
        count_ok = len(names) == len(pieces)
        R.check('piece_count', len(pieces), f'== {len(names)} (names)', count_ok)
    elif a.expect is not None:
        count_ok = a.expect == len(pieces)
        R.check('piece_count', len(pieces), f'== {a.expect} (--expect)', count_ok)
    elif like_n is not None:
        R.check('piece_count', len(pieces), f'== {like_n} ({like_src})', len(pieces) == like_n)
    else:
        R.check('piece_count', len(pieces), 'no expectation given', None,
                note='pass --names or --expect: without an expected count a missing or merged piece cannot be noticed')
    use_names = names if (names and count_ok) else None
    touch = [i + 1 for i, p in enumerate(pieces) if p['bbox'][0] <= 0 or p['bbox'][1] <= 0 or p['bbox'][2] >= w or p['bbox'][3] >= h]
    R.check('no_piece_touches_border', touch, '[]', not touch, note='a piece cut by the sheet edge is incomplete' if touch else None)
    keep_ids = np.zeros(n_g + 1, int)
    for n, p in enumerate(pieces, 1):
        keep_ids[p['gid']] = n
    plab = keep_ids[glab]
    gap = min_gap(plab, None) if len(pieces) > 1 else None
    R.check('min_gap_px', gap if gap is not None else '> 64', f">= {t['min_gap']}", gap is None or gap >= t['min_gap'],
            note='approximate (search radii 1,2,3,4,6,8,12,16,24,32,48,64, value is the window size)')
    dfrac = sum(p['area'] for p in dropped) / max(1, int(fg.sum()))
    R.check('dropped_frac', round(dfrac, 5), f"<= {t['max_dropped_frac']}", dfrac <= t['max_dropped_frac'],
            dropped=[p['bbox'] for p in dropped][:20])
    os.makedirs(a.out_dir, exist_ok=True)
    soft = np.clip((d - t['alpha_lo']) / (t['alpha_hi'] - t['alpha_lo']), 0, 1)
    soft = np.asarray(Image.fromarray((soft * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(t['alpha_blur']))).astype(float)
    ov = im.copy(); dr = ImageDraw.Draw(ov); meta = []
    for n, p in enumerate(pieces, 1):
        bx0, by0, bx1, by1 = p['bbox']
        X0, Y0, X1, Y1 = max(0, bx0 - pad), max(0, by0 - pad), min(w, bx1 + pad), min(h, by1 + pad)
        region = C.dilate(plab[Y0:Y1, X0:X1] == n, 2)
        other = C.dilate((plab[Y0:Y1, X0:X1] > 0) & (plab[Y0:Y1, X0:X1] != n), 1)
        alpha = np.where(region & ~other, soft[Y0:Y1, X0:X1], 0)
        rgba = np.dstack([rgb[Y0:Y1, X0:X1], alpha]).astype('uint8')
        if not a.no_despill:
            rgba = S.despill(rgba, key, ts)
        name = use_names[n - 1] if use_names else adopted[n - 1] if adopted else str(n)
        fname = f'{a.prefix}-{name}.png'
        dst = os.path.join(a.out_dir, fname)
        if os.path.exists(dst) and not a.force:
            print(f'{dst} exists: refusing to overwrite (use --force, or cut into a new folder)', file=sys.stderr)
            sys.exit(2)
        Image.fromarray(rgba).save(dst)
        meta.append({'n': int(name) if adopted and name.isdigit() else n, 'reading_n': n, 'name': name, 'file': fname, 'bbox': [X0, Y0, X1, Y1], 'w': X1 - X0, 'h': Y1 - Y0,
                     'area': p['area'], 'centre': [round((bx0 + bx1) / 2, 1), round((by0 + by1) / 2, 1)],
                     'parts': p['parts'], 'row': p['row']})
        dr.rectangle((X0, Y0, X1 - 1, Y1 - 1), outline=(255, 255, 0), width=3)
        C.text(dr, (X0 + 6, Y0 + 4), f'{n} {name}' if use_names else name, 30 if not use_names else 22)
    for p in dropped:
        dr.rectangle(p['bbox'], outline=(255, 0, 0), width=2)
    manifest = {'sheet': C.rel(a.sheet), 'sheet_sha256': C.sha256(a.sheet), 'sheet_size': [w, h], 'key': C.hexc(key),
                'prefix': a.prefix, 'named': bool(use_names), 'numbering': f'adopted from {like_src}' if adopted else 'names' if use_names else 'reading order', 'merge_dist': merge, 'min_area': min_area,
                'pieces': meta, 'dropped': [{'bbox': p['bbox'], 'area': p['area']} for p in dropped]}
    json.dump(manifest, open(os.path.join(a.out_dir, a.prefix + '.json'), 'w'), indent=1)
    ovp = os.path.join(a.out_dir, a.prefix + '-overview.jpg')
    C.text(dr, (8, h - 30), f'{os.path.basename(a.sheet)}: {len(pieces)} pieces, {len(dropped)} dropped specks (red), merge {merge}px', 18)
    ov.save(ovp, quality=88)
    R.evidence(ovp)
    R.d['measured'] = {'pieces': [{k: m[k] for k in ('n', 'name', 'bbox', 'area', 'parts', 'row')} for m in meta],
                       'manifest': C.rel(os.path.join(a.out_dir, a.prefix + '.json'))}
    R.not_checked('whether each named piece really shows what its name says (names are assigned by position: look at the overview)')
    R.not_checked('spill and lost art per piece: run tools/art/spill.py --strict --manifest <manifest> --sheet <sheet>')
    R.write(out_json, a.quiet)
    sys.exit(R.exit_code())


if __name__ == '__main__':
    main()
