"""Measure a character's proportions and compare them with a model sheet.

usage:
  reference mode (a model sheet exists):
    python3 tools/art/proportions.py --picture gen/doom-front.png --model qa/art/doom-proportions.json
    python3 tools/art/proportions.py --rig qa/art/doom-rig-manifest.json --model qa/art/doom-proportions.json
  standalone mode (a new character, no model sheet yet): judged against the style floors in
  qa.json art.proportions.style_floors, and every measured value is reported so a model sheet can be written:
    python3 tools/art/proportions.py --picture NEW.png --measure RECIPES.json
    python3 tools/art/proportions.py --rig RIG.json --roles ROLES.json
  options: --landmarks '{"head_frac": 0.39}'  values typed by hand for quantities the tool cannot measure. They
           never replace a measured value, they are marked "declared", they can FAIL a check but never pass
           it: a check that rests on a declared value stays UNMEASURED and the run exits 2.
           --out R.json   --evidence E.jpg   --tolerance N (flood tolerance for a picture without alpha)

All quantities are FRACTIONS OF THE TOTAL FIGURE HEIGHT, y measured from the top of the figure (0) to the
soles (1): head_frac (where the head ends), hood_width, mantle_top / mantle_bottom, belt_y, hem_y,
arm_thickness, hand_size, plus anything else the model sheet names.

Model sheet JSON (see qa/art/doom-proportions.json):
  targets   {name: {"value": v, "kind": "height" | "ratio", "tol": optional override}}
            height: |ours - value| <= art.proportions.height_tol;  ratio: relative error <= ratio_tol
  measure   picture recipes {name: {...}}, coordinates as fractions of the figure box:
            {"op":"colour_rows","colour":"#RRGGBB","tol":40,"x":[x0,x1],"y":[y0,y1],"min_cover":0.5,"stat":"top|bottom|centre"}
                 rows in the band where the colour covers >= min_cover of the x band -> y fraction
            {"op":"colour_run","colour":...,"tol":..,"x":[..],"y":[..],"stat":"median|max"}
                 longest horizontal run of the colour per row -> length / height
            {"op":"silhouette_width","y":[y0,y1],"stat":"max|median"} -> width / height
  rig_roles {name: {"part": p, "edge": "top|bottom"} | {"part": p, "dim": "w|h|max"} | {"part": p, "frac_y": f}}
Rig manifest JSON: {"height": H, "footY": y, "parts": {name: {"x","y","w","h" (or "src" under public/ to
derive h from the picture's aspect)}}} in the rig's canvas pixels (the ImgRigDef numbers).

A quantity with no recipe or role is UNMEASURED, never passed, and any UNMEASURED check makes the run exit 2. Evidence: the figure with our
values (yellow) and the model's values (cyan) drawn on it. Exit 0 = pass, 1 = fail, 2 = could not measure.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C


def load_figure(path, tol):
    """Return (rgb, mask) cropped to the figure."""
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA') and np.asarray(im.convert('RGBA'))[..., 3].min() < 128:
        a = np.asarray(im.convert('RGBA')); rgb = a[..., :3].astype(float); mask = a[..., 3] >= 128
    else:
        rgb = np.asarray(im.convert('RGB')).astype(float)
        key, _ = C.key_colour(rgb)
        mask = ~C.border_connected(C.dist(rgb, key) <= tol)
    lab, comps = C.label(mask)
    if not comps:
        return None, None
    big = max(comps, key=lambda c: c['area'])
    mask = lab == big['id']
    return rgb[big['y0']:big['y1'], big['x0']:big['x1']], mask[big['y0']:big['y1'], big['x0']:big['x1']]


def longest_run(row):
    if not row.any():
        return 0
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    return int((np.nonzero(d == -1)[0] - np.nonzero(d == 1)[0]).max())


def run_recipe(r, rgb, mask):
    """Returns (value, drawing hint) or (None, reason)."""
    H, W = mask.shape
    y0, y1 = [int(round(v * H)) for v in r.get('y', [0, 1])]
    x0, x1 = [int(round(v * W)) for v in r.get('x', [0, 1])]
    y1 = max(y1, y0 + 1); x1 = max(x1, x0 + 1)
    if r['op'] == 'silhouette_width':
        w = mask[y0:y1].sum(1)
        if not w.any():
            return None, 'empty band'
        i = int(np.argmax(w)) if r.get('stat', 'max') == 'max' else int(np.argsort(w)[len(w) // 2])
        return float(w[i] / H), ('hbar', y0 + i, int(w[i]))
    hit = mask[y0:y1, x0:x1] & (C.dist(rgb[y0:y1, x0:x1], C.parse_colour(r['colour'])) <= r.get('tol', 40))
    if r['op'] == 'colour_rows':
        rows = np.nonzero(hit.mean(1) >= r.get('min_cover', 0.5))[0]
        if not len(rows):
            return None, 'colour not found in the band'
        y = {'top': rows[0], 'bottom': rows[-1] + 1, 'centre': (rows[0] + rows[-1] + 1) / 2}[r.get('stat', 'centre')] + y0
        return float(y / H), ('hline', y)
    if r['op'] == 'colour_run':
        runs = np.array([longest_run(row) for row in hit])
        runs = runs[runs > 0]
        if not len(runs):
            return None, 'colour not found in the band'
        v = float(np.max(runs) if r.get('stat', 'median') == 'max' else np.median(runs))
        return v / H, ('hbar', (y0 + y1) // 2, int(v))
    return None, f"unknown op {r['op']}"


def rig_values(rig, roles):
    H = float(rig['height']); top = float(rig['footY']) - H
    out, why = {}, {}
    for name, ro in roles.items():
        p = rig['parts'].get(ro['part'])
        if p is None:
            why[name] = f"rig has no part {ro['part']}"; continue
        h = p.get('h')
        if h is None and p.get('src'):
            try:
                iw, ih = Image.open(os.path.join(C.ROOT, 'public', p['src'])).size
                h = p['w'] * ih / iw
            except OSError:
                pass
        if h is None:
            why[name] = f"part {ro['part']} has no height"; continue
        if 'edge' in ro:
            out[name] = (p['y'] + (h if ro['edge'] == 'bottom' else 0) - top) / H
        elif 'frac_y' in ro:
            out[name] = (p['y'] + h * ro['frac_y'] - top) / H
        else:
            out[name] = {'w': p['w'], 'h': h, 'max': max(p['w'], h)}[ro.get('dim', 'w')] / H
    return out, why


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--picture'); ap.add_argument('--rig'); ap.add_argument('--model')
    ap.add_argument('--measure'); ap.add_argument('--roles'); ap.add_argument('--landmarks')
    ap.add_argument('--tolerance', type=float); ap.add_argument('--out'); ap.add_argument('--evidence')
    ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()
    if not a.picture and not a.rig:
        ap.error('give --picture or --rig')
    t = C.cfg('proportions')
    model = json.load(open(a.model)) if a.model else {}
    mode = 'reference' if a.model else 'standalone'
    src = a.picture or a.rig
    stem = os.path.splitext(os.path.basename(src))[0]
    out = a.out or os.path.join(C.ROOT, 'qa', 'art', f'proportions-{stem}.json')
    ev = a.evidence or os.path.splitext(out)[0] + '.jpg'
    R = C.Result('art/proportions.py', mode, {'picture': a.picture and C.rel(a.picture), 'rig': a.rig and C.rel(a.rig),
                                              'model': a.model and C.rel(a.model)}, t)
    vals, why, hints = {}, {}, {}
    rgb = mask = None
    if a.picture:
        rgb, mask = load_figure(a.picture, a.tolerance if a.tolerance is not None else t['flood_tolerance'])
        if mask is None:
            print('no figure found', file=sys.stderr); sys.exit(2)
        recipes = json.load(open(a.measure)) if a.measure else model.get('measure', {})
        for name, r in recipes.items():
            if name.startswith('_'):
                continue
            v, hint = run_recipe(r, rgb, mask)
            if v is None:
                why[name] = hint
            else:
                vals[name] = v; hints[name] = hint
        H, W = mask.shape
        prof = {f'{f:.1f}': round(float(mask[min(H - 1, int(f * H))].sum() / H), 3) for f in np.arange(0.1, 1.0, 0.1)}
        R.d['measured']['figure_px'] = [W, H]
        R.d['measured']['aspect_w_over_h'] = round(W / H, 3)
        R.d['measured']['silhouette_width_at_height'] = prof
        vals['aspect_w_over_h'] = W / H
    if a.rig:
        rig = json.load(open(a.rig))
        roles = json.load(open(a.roles)) if a.roles else model.get('rig_roles', {})
        rv, rw = rig_values(rig, roles)
        if a.picture:
            R.d['measured']['rig_values'] = {k: round(v, 4) for k, v in rv.items()}
        else:
            vals.update(rv); why.update(rw)
    declared = {}
    if a.landmarks:
        lm = json.loads(a.landmarks) if a.landmarks.strip().startswith('{') else json.load(open(a.landmarks))
        R.d['inputs']['landmarks'] = lm
        for k, v in lm.items():
            if k in vals:
                R.warn(f'--landmarks {k} = {v} ignored: the tool measured {vals[k]:.4f} itself. A typed value never replaces a measurement.')
            else:
                declared[k] = float(v)
        if declared:
            R.d['measured']['declared_not_measured'] = declared
            R.warn('typed by hand via --landmarks, NOT measured: ' + ', '.join(f'{k} = {v}' for k, v in declared.items()) +
                   '. A declared value can fail a check but never pass it (the check stays UNMEASURED, exit 2).')
    R.d['measured']['values'] = {k: round(v, 4) for k, v in vals.items()}
    targets = model.get('targets', {})
    for name, tg in targets.items():
        kind = tg.get('kind', 'height')
        tol = tg.get('tol', t['height_tol'] if kind == 'height' else t['ratio_tol'])
        thr = f"{tg['value']} +- {tol}" + (' (relative)' if kind == 'ratio' else '')
        if name not in vals and name in declared:
            v = declared[name]
            err = abs(v - tg['value']) if kind == 'height' else abs(v - tg['value']) / tg['value']
            R.check(name, round(v, 4), thr, False if err > tol else None, error=round(err, 4), kind=kind, source='declared via --landmarks (not measured)',
                    note='declared value fails' if err > tol else 'declared value would pass, but it was typed by hand: not a measurement')
            continue
        if name not in vals:
            R.check(name, None, thr, None, note=why.get(name, 'no recipe or role for this quantity'))
            continue
        v = vals[name]
        err = abs(v - tg['value']) if kind == 'height' else abs(v - tg['value']) / tg['value']
        R.check(name, round(v, 4), thr, err <= tol, error=round(err, 4), kind=kind)
    floors = t.get('style_floors', {})
    for name, (lo, hi) in floors.items():
        if name in targets:
            continue  # the model sheet is the stricter judge
        if name == 'aspect_w_over_h' and not a.picture:
            R.not_checked('style:aspect_w_over_h (needs --picture: a rig manifest has no silhouette)')
            continue
        if name not in vals and name in declared:
            inside = lo <= declared[name] <= hi
            R.check(f'style:{name}', declared[name], f'{lo} .. {hi}', None if inside else False, source='declared via --landmarks (not measured)',
                    note='declared value would pass, but it was typed by hand: not a measurement' if inside else 'declared value fails')
        elif name not in vals:
            R.check(f'style:{name}', None, f'{lo} .. {hi}', None, note=why.get(name, 'not measured'))
        else:
            R.check(f'style:{name}', round(vals[name], 4), f'{lo} .. {hi}', lo <= vals[name] <= hi)
    for name in vals:
        if name not in targets and name not in floors:
            R.not_checked(f'{name} = {vals[name]:.4f}: measured, but no target in the model sheet and no style floor')
    # evidence
    if mask is not None:
        H, W = mask.shape
        fig = np.where(mask[..., None], rgb, 255).astype('uint8')
        sc = min(1.0, 900 / H)
        im = Image.fromarray(fig).resize((int(W * sc), int(H * sc)), Image.LANCZOS)
        canvas = Image.new('RGB', (im.width + 520, im.height + 20), (40, 40, 44)); canvas.paste(im, (260, 10))
        d = ImageDraw.Draw(canvas); n_l = n_r = 0
        for name, hint in hints.items():
            tg = targets.get(name)
            if hint[0] == 'hline':
                y = 10 + hint[1] * sc
                d.line((250, y, 260 + im.width, y), fill=(255, 220, 0), width=2)
                C.text(d, (4, y - 9), f'{name} {vals[name]:.3f}', 13, (255, 220, 0))
                if tg and tg.get('kind', 'height') == 'height':
                    ty = 10 + tg['value'] * H * sc
                    d.line((260, ty, 270 + im.width, ty), fill=(0, 220, 255), width=2)
                    C.text(d, (268 + im.width, ty - 9), f'model {name} {tg["value"]}', 13, (0, 220, 255))
            else:
                y = 10 + hint[1] * sc; L = hint[2] * sc
                d.line((260, y, 260 + L, y), fill=(255, 220, 0), width=4)
                s = f'{name} {vals[name]:.3f}' + (f' (model {tg["value"]})' if tg else '')
                C.text(d, (268 + im.width, y + 4), s, 13, (255, 220, 0))
                if tg:
                    d.line((260, y + 6, 260 + tg['value'] * H * sc, y + 6), fill=(0, 220, 255), width=4)
        C.text(d, (4, canvas.height - 20), 'yellow = ours, cyan = model sheet; bars = lengths as a fraction of height', 12)
        canvas.save(ev, quality=90)
        R.evidence(ev)
    else:
        rig = json.load(open(a.rig)); H = rig['height']; top = rig['footY'] - H
        xs = [p['x'] for p in rig['parts'].values()] + [p['x'] + p['w'] for p in rig['parts'].values()]
        sc = 800 / H; ox = 40 - min(xs) * sc
        canvas = Image.new('RGB', (int((max(xs) - min(xs)) * sc) + 420, 860), (40, 40, 44)); d = ImageDraw.Draw(canvas)
        for pn, p in rig['parts'].items():
            h = p.get('h')
            if h is None:
                try:
                    iw, ih = Image.open(os.path.join(C.ROOT, 'public', p['src'])).size; h = p['w'] * ih / iw
                except (OSError, KeyError):
                    continue
            d.rectangle((ox + p['x'] * sc, 30 + (p['y'] - top) * sc, ox + (p['x'] + p['w']) * sc, 30 + (p['y'] + h - top) * sc), outline=(150, 150, 150))
            C.text(d, (ox + p['x'] * sc + 2, 30 + (p['y'] - top) * sc + 1), pn, 10, (200, 200, 200))
        d.rectangle((ox + min(xs) * sc, 30, ox + max(xs) * sc, 830), outline=(90, 90, 90))
        for name, tg in targets.items():
            if tg.get('kind', 'height') == 'height':
                ty = 30 + tg['value'] * 800
                d.line((20, ty, canvas.width - 200, ty), fill=(0, 220, 255), width=1)
                C.text(d, (canvas.width - 195, ty - 14), f'model {name} {tg["value"]}', 12, (0, 220, 255))
                if name in vals:
                    y = 30 + vals[name] * 800
                    d.line((20, y, canvas.width - 200, y), fill=(255, 220, 0), width=2)
                    C.text(d, (canvas.width - 195, y + 1), f'ours {vals[name]:.3f}', 12, (255, 220, 0))
        C.text(d, (4, 4), 'rig part boxes; yellow = ours, cyan = model sheet', 13)
        canvas.save(ev, quality=90); R.evidence(ev)
    if mode == 'standalone':
        R.not_checked('comparison with a model sheet (none given): only style floors were judged')
    R.not_checked('likeness: this tool measures sizes and positions only')
    R.write(out, a.quiet)
    sys.exit(R.exit_code())


if __name__ == '__main__':
    main()
