"""Detect and remove key-colour spill on cut pieces, and detect "lost art".

usage:
  python3 tools/art/spill.py PIECE.png [PIECE.png ...] [options]
  python3 tools/art/spill.py --manifest public/doom/p.json --sheet gen/doom-parts.png

options:
  --key '#FF00FF'      key colour of the sheet the pieces were cut from (default: qa.json art.key)
  --manifest M.json    cut manifest (old list format or the new tools/art/cut.py format); gives each
                       piece its bbox on the sheet. With no PIECE arguments all pieces of the manifest are checked.
  --sheet SHEET.png    the sheet the pieces came from: enables the exact lost-art check
  --allow-holes a,b    piece file names whose enclosed holes are declared as intended
  --allow-translucent a,b  piece file names that are semi-transparent on purpose
  --strict             judge every piece strictly, legacy pieces too. Strict is already the DEFAULT for every piece
                       whose sha256 is not in tools/art/legacy-pieces.json (qa.json art.spill.legacy_list): only the
                       pieces approved before this tool existed get the loose max_faint_frac (they carry a faint
                       1 px fringe on 8-28 % of their edge pixels). An edited copy of a legacy piece is a new piece.
  --fix DIR            write de-spilled copies into DIR (never overwrites the input) and re-measure them
  --out R.json         result JSON (default qa/art/spill-<first piece>.json)
  --evidence E.jpg     evidence image (default beside the JSON)

What is measured, per piece (standalone: there is no reference clip for art; the floors are in qa.json art.spill):
  spill      share of EDGE pixels (visible pixels within edge_px of transparency; thin lines are all edge)
             whose keyness, weighted by opacity, exceeds the keyness of the nearest interior colour by more
             than strong_excess (spill_frac, must be <= max_spill_frac) or faint_excess (faint_fringe_frac,
             must be <= max_faint_frac; above warn_faint_frac a warning is listed).
             keyness = channel difference in the key's direction (magenta: min(R,B)-G), so dark thin grey
             lines with a purple fringe are measured, and a red or purple garment does not count because its
             own interior carries the same keyness.
  fringe run (strict gate) longest side of one connected run of faint-or-stronger fringe pixels, in px, must be
             <= max_fringe_run_px_strict: a 1 px key-tinted line under a whole edge is a small share of a big
             piece's outline but one long run.
  key blob   largest connected area of opaque pixels within key_like_dist (RGB) of the key colour, in px, must be
             <= max_key_blob_px. Absolute: an uncut slab of background attached to a piece is its "own interior
             colour" for the spill measure, so it is caught here instead.
  translucent  share of interior pixels with alpha < solid_alpha, must be <= max_translucent_interior_frac
             (unless the piece is named in --allow-translucent).
  lost art   with --sheet: pixels that are transparent in the piece but are not background on the sheet
             (colour farther than lost_min_dist from the key), attached to the piece, after an opening that
             removes the 1-2 px antialias ring. PASS when lost/(visible+lost) <= max_lost_frac AND the largest
             connected lost area <= max_lost_blob_px (absolute) AND faded_frac <= max_faded_frac (share of
             solid sheet art, farther than solid_min_dist from the key, shown with alpha < solid_alpha).
             without --sheet: enclosed transparent holes are measured; a hole share above max_hole_frac FAILS
             unless the piece is listed in --allow-holes; the exact check is listed under not_checked.
A piece that cannot be read, or any check that cannot be measured, makes the run UNMEASURED (exit 2), never a pass.
Fix (--fix): edge pixels with excess keyness take the bled interior colour (edge-colour bleed); where no
interior colour is near, the excess is subtracted from the key's channels.
Evidence: a 400 % before/after crop of the worst edge region of the worst piece, plus a strip of all pieces
with spill pixels marked. Exit 0 = pass, 1 = fail, 2 = could not measure.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C


def measure(rgba, key, t):
    """Spill measurement of one RGBA array. Returns dict with numbers and masks."""
    a = rgba[..., 3]
    rgb = rgba[..., :3].astype(float)
    vis = a >= t['alpha_visible']
    out = ~vis
    padded_out = np.pad(out, 1, constant_values=True)  # the picture border is outside too
    edge = vis & C.dilate(padded_out, t['edge_px'])[1:-1, 1:-1]
    interior = (a >= 250) & ~C.dilate(padded_out, t['interior_px'])[1:-1, 1:-1]
    k = C.keyness(rgb, key)
    ref, known = C.bleed(rgb, interior, t['bleed_px'])
    kref = np.where(known, C.keyness(ref, key), 0.0)
    fallback = float(np.median(k[interior])) if interior.any() else 0.0
    kref = np.where(known, kref, max(0.0, fallback) if interior.any() else 0.0)
    excess = k - np.maximum(kref, 0)
    seen = excess * (a / 255.0)  # what the eye gets: excess keyness weighted by opacity
    spill = edge & (seen > t['strong_excess'])
    faint = edge & (seen > t['faint_excess'])
    n_edge = int(edge.sum())
    # absolute measures (independent of the piece's own interior colour and of its size)
    keylike = (a >= 128) & (C.dist(rgb, key) <= t['key_like_dist'])
    key_blob = _largest(keylike)
    run = _largest(faint, extent=True)
    solid_in = ~C.dilate(padded_out, t['interior_px'])[1:-1, 1:-1]  # visible and interior_px away from any transparency
    n_in = int(solid_in.sum())
    return {'key_blob_px': key_blob, 'key_like_px': int(keylike.sum()), '_keylike': keylike,
            'fringe_run_px': run, 'interior_px_count': n_in,
            'translucent_interior_frac': float((solid_in & (a < t['solid_alpha'])).sum() / n_in) if n_in else None,
            'visible_px': int(vis.sum()), 'edge_px': n_edge, 'spill_px': int(spill.sum()),
            'spill_frac': float(spill.sum() / n_edge) if n_edge else None,
            'faint_frac': float(faint.sum() / n_edge) if n_edge else None,
            'max_excess': float(seen[edge].max()) if n_edge else None, '_faint': faint,
            'has_interior': bool(interior.any()),
            '_spill': spill, '_edge': edge, '_excess': excess, '_ref': ref, '_known': known, '_vis': vis}


def _largest(mask, extent=False):
    """Area of the largest 8-connected blob of a mask, or (extent=True) the longest side of any blob's box."""
    if not mask.any():
        return 0
    _, comps = C.label(mask)
    if extent:
        return max(max(c['x1'] - c['x0'], c['y1'] - c['y0']) for c in comps)
    return max(c['area'] for c in comps)


def despill(rgba, key, t):
    """Return a de-spilled copy: edge-colour bleed where an interior colour is near, channel clamp elsewhere."""
    m = measure(rgba, key, t)
    out = rgba.copy()
    rgb = out[..., :3].astype(float)
    padded_out = np.pad(~m['_vis'], 1, constant_values=True)
    band = (rgba[..., 3] > 0) & C.dilate(padded_out, t['edge_px'] + 1)[1:-1, 1:-1]
    bad = band & (m['_excess'] > t['fix_excess'])
    use_ref = bad & m['_known']
    rgb[use_ref] = m['_ref'][use_ref]
    rest = bad & ~m['_known']
    if rest.any():
        hi = [i for i in range(3) if key[i] >= 128]
        e = (m['_excess'][rest] * 255)[:, None]
        sub = rgb[rest]
        sub[:, hi] = np.clip(sub[:, hi] - e, 0, 255)
        rgb[rest] = sub
    # fully transparent pixels get the bled colour too, so that texture filtering never pulls in the key
    zero = rgba[..., 3] == 0
    filled, known = C.bleed(np.where(zero[..., None], 0, rgb), ~zero, 4)
    rgb[zero & known] = filled[zero & known]
    out[..., :3] = np.clip(np.round(rgb), 0, 255).astype('uint8')
    return out


def holes(rgba, t):
    """Enclosed transparent regions (not connected to the picture border)."""
    out = rgba[..., 3] < t['alpha_visible']
    if not out.any():
        return np.zeros_like(out), []
    p = np.pad(out, 1, constant_values=True)
    inside = p & ~C.border_connected(p)
    inside = inside[1:-1, 1:-1]
    _, comps = C.label(inside)
    comps = [c for c in comps if c['area'] >= t['hole_min_px']]
    return inside, comps


def lost_art(rgba, sheet_rgb, bbox, key, t):
    """Pixels the cutter removed although the sheet has art there.
    Returns None when the bbox does not fit, else a dict: mask / px (transparent where the sheet has art),
    blob_px (largest connected lost region), faded mask / frac (sheet is solid art, i.e. farther than
    solid_min_dist from the key and not within lost_open_px of the background, but the piece's alpha is
    below solid_alpha: a piece cut to half opacity is caught here)."""
    x0, y0, x1, y1 = bbox
    h, w = rgba.shape[:2]
    crop = sheet_rgb[y0:y0 + h, x0:x0 + w].astype(float)
    if crop.shape[:2] != (h, w):
        return None
    d = C.dist(crop, key)
    vis = rgba[..., 3] >= 128
    cand = (~vis) & (d > t['lost_min_dist'])
    cand = C.dilate(C.erode(cand, t['lost_open_px']), t['lost_open_px']) & cand  # opening: drop antialias rings
    m = np.zeros_like(cand)
    if cand.any():
        lab, comps = C.label(cand)
        near = C.dilate(vis, 3)
        keep = np.unique(lab[near & (lab > 0)])
        m = np.isin(lab, keep)
    solid = C.erode(d > t['solid_min_dist'], t['lost_open_px'])
    # only art that belongs to this piece: solid sheet art connected to something the piece shows
    own = solid & C.dilate(rgba[..., 3] >= t['alpha_visible'], 1)
    faded = own & (rgba[..., 3] < t['solid_alpha'])
    return {'mask': m, 'px': int(m.sum()), 'blob_px': _largest(m), 'faded': faded,
            'faded_frac': float(faded.sum() / max(1, own.sum())), 'solid_px': int(own.sum())}


def load_manifest(path):
    d = json.load(open(path))
    pieces = d['pieces'] if isinstance(d, dict) else d
    return {p['file']: p['bbox'] for p in pieces}, os.path.dirname(os.path.abspath(path))


def zoom_crop(rgba, cx, cy, half=40, zoom=4):
    h, w = rgba.shape[:2]
    x0 = int(np.clip(cx - half, 0, max(0, w - 2 * half))); y0 = int(np.clip(cy - half, 0, max(0, h - 2 * half)))
    crop = Image.fromarray(rgba[y0:y0 + 2 * half, x0:x0 + 2 * half])
    tiles = [C.over(crop, bg).resize((crop.width * zoom, crop.height * zoom), Image.NEAREST)
             for bg in ((255, 255, 255), (24, 24, 28))]
    return C.hstack(tiles, 4)


def worst_point(mask):
    """Centre of the densest 32 px cell of a mask."""
    h, w = mask.shape
    best, pt = -1, (w // 2, h // 2)
    for y in range(0, h, 16):
        for x in range(0, w, 16):
            s = mask[y:y + 32, x:x + 32].sum()
            if s > best:
                best, pt = s, (x + 16, y + 16)
    return pt


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pieces', nargs='*')
    ap.add_argument('--key'); ap.add_argument('--manifest'); ap.add_argument('--sheet')
    ap.add_argument('--allow-holes', default=''); ap.add_argument('--allow-translucent', default=''); ap.add_argument('--fix')
    ap.add_argument('--strict', action='store_true')
    ap.add_argument('--out'); ap.add_argument('--evidence'); ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()
    t = dict(C.cfg('spill'))
    try:
        legacy = set(json.load(open(os.path.join(C.ROOT, t['legacy_list'])))['sha256'])
    except (OSError, KeyError, ValueError) as e:
        print(f"could not read the legacy piece list {t['legacy_list']}: {e!r}", file=sys.stderr); sys.exit(2)
    key = C.parse_colour(a.key or C.cfg('key')['default'])
    bboxes, mdir = ({}, None)
    if a.manifest:
        bboxes, mdir = load_manifest(a.manifest)
    files = a.pieces or [os.path.join(mdir, f) for f in bboxes]
    if not files:
        print('no pieces given', file=sys.stderr); sys.exit(2)
    sheet = np.asarray(Image.open(a.sheet).convert('RGB')) if a.sheet else None
    allow = set(x for x in a.allow_holes.split(',') if x)
    allow_tr = set(x for x in a.allow_translucent.split(',') if x)
    legacy_used = []
    stem = os.path.splitext(os.path.basename(files[0]))[0]
    out = a.out or os.path.join(C.ROOT, 'qa', 'art', f'spill-{stem}.json')
    ev = a.evidence or os.path.splitext(out)[0] + '.jpg'
    R = C.Result('art/spill.py', 'standalone', {'pieces': [C.rel(f) for f in files], 'sheet': a.sheet and C.rel(a.sheet),
                                                'manifest': a.manifest and C.rel(a.manifest), 'key': C.hexc(key)}, t)
    rows, worst, faint_warn = [], None, []
    for f in files:
        name = os.path.basename(f)
        try:
            rgba = np.asarray(Image.open(f).convert('RGBA'))
        except OSError as e:
            R.check(f'{name}: readable', str(e), 'the piece can be opened', None,
                    note='a piece that cannot be read is never a pass'); continue
        strict = a.strict or C.sha256(f) not in legacy
        if not strict:
            legacy_used.append(name)
        max_faint = t['max_faint_frac_strict'] if strict else t['max_faint_frac']
        gate = 'strict' if strict else 'legacy piece'
        m = measure(rgba, key, t)
        if m['spill_frac'] is None:
            R.check(f'{name}: spill_frac', None, f"<= {t['max_spill_frac']}", None, note='no visible edge pixels')
            continue
        R.check(f'{name}: spill_frac', round(m['spill_frac'], 4), f"<= {t['max_spill_frac']}",
                m['spill_frac'] <= t['max_spill_frac'], spill_px=m['spill_px'], edge_px=m['edge_px'],
                max_excess=round(m['max_excess'], 3))
        R.check(f'{name}: faint_fringe_frac', round(m['faint_frac'], 4), f"<= {max_faint} ({gate})",
                m['faint_frac'] <= max_faint, gate=gate, fringe_run_px=m['fringe_run_px'])
        if strict:
            R.check(f'{name}: fringe_run_px', m['fringe_run_px'], f"<= {t['max_fringe_run_px_strict']} (strict)",
                    m['fringe_run_px'] <= t['max_fringe_run_px_strict'],
                    note='longest side of one connected run of faint-or-stronger fringe pixels: a straight key-tinted '
                         'line along one edge is a small share of the outline but a long run')
        R.check(f'{name}: key_coloured_blob_px', m['key_blob_px'], f"<= {t['max_key_blob_px']}",
                m['key_blob_px'] <= t['max_key_blob_px'], key_like_px=m['key_like_px'],
                note=f"largest connected area of opaque pixels within {t['key_like_dist']} RGB of the key: uncut background")
        if m['translucent_interior_frac'] is None:
            R.not_checked(f'{name}: translucent interior (the piece has no pixel {t["interior_px"]} px away from its edge)')
        else:
            tr = m['translucent_interior_frac']
            ok = tr <= t['max_translucent_interior_frac'] or name in allow_tr
            R.check(f'{name}: translucent_interior_frac', round(tr, 4), f"<= {t['max_translucent_interior_frac']}", ok,
                    note='declared in --allow-translucent' if name in allow_tr and tr > t['max_translucent_interior_frac'] else
                    f"share of interior pixels with alpha < {t['solid_alpha']}")
        if t['warn_faint_frac'] < m['faint_frac'] <= max_faint:
            faint_warn.append(f"{name} {m['faint_frac']:.2f}")
        if not m['has_interior']:
            R.not_checked(f'{name}: piece has no interior (all thin lines); spill measured against zero keyness, '
                          'so a legitimately key-tinted thin piece cannot be told from spill')
        inside, hc = holes(rgba, t)
        hole_px = sum(c['area'] for c in hc)
        hole_frac = hole_px / max(1, m['visible_px'] + hole_px)
        lostmask = None
        if sheet is not None and name in bboxes:
            L = lost_art(rgba, sheet, bboxes[name], key, t)
            if L is None:
                R.check(f'{name}: lost_frac', None, f"<= {t['max_lost_frac']}", None, note='bbox does not fit the sheet')
            else:
                lost = L['px']; lostmask = L['mask'] | L['faded']
                lf = lost / max(1, m['visible_px'] + lost)
                R.check(f'{name}: lost_frac', round(lf, 4), f"<= {t['max_lost_frac']}", lf <= t['max_lost_frac'],
                        lost_px=lost, enclosed_hole_frac=round(hole_frac, 4))
                R.check(f'{name}: lost_blob_px', L['blob_px'], f"<= {t['max_lost_blob_px']}", L['blob_px'] <= t['max_lost_blob_px'],
                        note='largest connected area that is art on the sheet but transparent in the piece (absolute, '
                             'so a big piece may not lose a big hole)')
                R.check(f'{name}: faded_frac', round(L['faded_frac'], 4), f"<= {t['max_faded_frac']}",
                        L['faded_frac'] <= t['max_faded_frac'], solid_px=L['solid_px'],
                        note=f"share of solid sheet art shown with alpha < {t['solid_alpha']}")
        else:
            ok = hole_frac <= t['max_hole_frac'] or name in allow
            R.check(f'{name}: enclosed_hole_frac', round(hole_frac, 4), f"<= {t['max_hole_frac']}", ok,
                    holes=[[c['x0'], c['y0'], c['x1'], c['y1']] for c in hc][:8],
                    note='declared in --allow-holes' if name in allow and hole_frac > t['max_hole_frac'] else None)
            R.not_checked(f'{name}: exact lost-art check (needs --sheet and --manifest with this piece)')
        fixed = None
        if a.fix:
            os.makedirs(a.fix, exist_ok=True)
            dst = os.path.join(a.fix, name)
            if os.path.abspath(dst) == os.path.abspath(f):
                print('refusing to overwrite the input piece', file=sys.stderr); sys.exit(2)
            fixed = despill(rgba, key, t)
            Image.fromarray(fixed).save(dst)
            m2 = measure(fixed, key, t)
            R.check(f'{name}: spill_frac after fix', round(m2['spill_frac'], 4), f"<= {t['max_spill_frac']}",
                    m2['spill_frac'] <= t['max_spill_frac'], file=C.rel(dst))
            R.check(f'{name}: faint_fringe_frac after fix', round(m2['faint_frac'], 4), f"<= {t['max_faint_frac_strict']}",
                    m2['faint_frac'] <= t['max_faint_frac_strict'])
            R.check(f'{name}: fringe_run_px after fix', m2['fringe_run_px'], f"<= {t['max_fringe_run_px_strict']}",
                    m2['fringe_run_px'] <= t['max_fringe_run_px_strict'])
        rows.append((name, rgba, m, fixed, lostmask, inside))
        score = m['spill_frac'] + 0.01 * m['faint_frac'] + m['key_blob_px'] / max(1, m['visible_px']) + (m['fringe_run_px'] > t['max_fringe_run_px_strict']) * 0.01 + (lostmask.sum() / max(1, m['visible_px']) if lostmask is not None else 0)
        if worst is None or score > worst[0]:
            worst = (score, len(rows) - 1)
    if rows:
        # evidence: strip of pieces with spill (red) / lost art (yellow) / enclosed holes (cyan) marked, then a 400 % crop
        thumbs = []
        for name, rgba, m, fixed, lostmask, inside in rows[:24]:
            im = np.asarray(C.over(Image.fromarray(rgba), (255, 255, 255))).copy()
            im[inside] = (0, 220, 255)
            if lostmask is not None:
                im[lostmask] = (255, 220, 0)
            im[m['_faint']] = (255, 150, 0)
            im[C.dilate(m['_spill'], 1)] = (255, 0, 0)
            im[m['_keylike']] = (255, 0, 0)
            th = Image.fromarray(im); th.thumbnail((220, 220))
            d = ImageDraw.Draw(th); C.text(d, (3, 2), f"{name} {m['spill_frac']:.3f}", 12)
            thumbs.append(th)
        strip = C.vstack([C.hstack(thumbs[i:i + 8], 6) for i in range(0, len(thumbs), 8)], 6)
        name, rgba, m, fixed, lostmask, inside = rows[worst[1]]
        focus = m['_keylike'] if m['key_blob_px'] > t['max_key_blob_px'] else m['_spill'] if m['_spill'].any() else m['_faint'] if m['fringe_run_px'] > t['max_fringe_run_px_strict'] else (lostmask if lostmask is not None and lostmask.any() else m['_edge'])
        cx, cy = worst_point(focus)
        before = zoom_crop(rgba, cx, cy)
        marked = rgba.copy(); marked[m['_faint']] = (255, 150, 0, 255); marked[m['_spill'] | m['_keylike']] = (255, 0, 0, 255)
        if lostmask is not None:
            marked[lostmask] = (255, 220, 0, 255)
        panels = [before, zoom_crop(marked, cx, cy)]
        labels = ['BEFORE 400% (on white, on dark)', 'spill / uncut key red, faint fringe orange, lost or faded art yellow']
        if fixed is not None:
            panels.append(zoom_crop(fixed, cx, cy)); labels.append('AFTER --fix 400%')
        for p, s in zip(panels, labels):
            C.text(ImageDraw.Draw(p), (6, 4), s, 16)
        head = Image.new('RGB', (max(strip.width, sum(p.width for p in panels) + 8 * len(panels), 1250), 26), (30, 30, 30))
        C.text(ImageDraw.Draw(head), (6, 3), f'spill.py  worst piece: {name}  key {C.hexc(key)}  (strip: red = strong spill or uncut key colour, orange = faint fringe, yellow = lost or faded, cyan = enclosed hole)', 14)
        C.vstack([head, C.hstack(panels, 8), strip], 8).save(ev, quality=90)
        R.evidence(ev)
    if faint_warn:
        R.warn(f"faint 1 px key-coloured fringe (share of edge pixels above faint_excess, warn level {t['warn_faint_frac']}) on: "
               + ', '.join(faint_warn) + '. Run with --fix to remove it.')
    if legacy_used:
        R.warn(f"{len(legacy_used)} piece(s) judged with the loose legacy faint-fringe gate (max_faint_frac {t['max_faint_frac']}, no fringe-run limit) "
               f"because their sha256 is in {t['legacy_list']}: " + ', '.join(legacy_used[:40]))
    if sheet is None:
        R.not_checked('lost art against the sheet (no --sheet given)')
    R.not_checked('spill on semi-transparent interior areas (only the edge band is measured)')
    R.not_checked('whether the piece looks right when placed on a set (needs a render)')
    R.write(out, a.quiet)
    sys.exit(R.exit_code())


if __name__ == '__main__':
    main()
