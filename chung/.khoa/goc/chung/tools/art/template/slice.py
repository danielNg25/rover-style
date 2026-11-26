"""Cut a sheet that was generated ONTO A TEMPLATE into named pieces, by the template's slot map. No hand placement.

usage:
  python3 tools/art/template/slice.py SHEET.png ID [--brief BRIEF.json] [--rig src/chars/_lib/ID.ts] [--export NAME] [--force]
                                      [--build adult|child|heavy|tall] [--rest EXPRESSION] [--iris '#7a4a2b'] [--brow thin|medium|thick]
                                      [--template human-v2] [--keep-fringe] [--out-dir public/ID]

The template is read from SHEET.png.prov.json (the layout image the sheet was generated on); --template overrides it.
--brief takes build, default_expression (the rest pose), iris and brow from the character brief; the flags override it.
These options are stored in manifest.json ("options") and fromTemplate reads them, so the rig file is never edited.

writes public/ID/<slot>.png (one per slot), public/ID/manifest.json (what fromTemplate.ts reads), public/ID/overview.jpg
(the sheet with every slot box: green = fine, orange = outside tolerance, red = empty, cut or merged; and the figure
ASSEMBLED from the cut pieces by the template map: look at it), public/ID/slice-report.json (all checks), and with
--rig a small TypeScript module that holds the manifest and builds the rig: no pixel position is typed by hand.

What is checked (exit 0 = pass, 1 = fail, 2 = could not measure):
  sheet_size          same size as the template (a sheet of the same aspect is resized, with a warning)
  background_flat, key_is_expected     as tools/art/keycheck.py (thresholds qa.json art.keycheck)
  slots_filled        every required slot holds art; optional slots (back views, prop) may be empty: listed as absent
  slots_whole         no piece is CUT by the sheet border and no piece has grown into a neighbouring slot (merged).
                      A piece that merely reaches the edge of its own box (a tall bun) is whole: it is listed as a note
  stray_art           art whose centre lies in no slot box (something was added between slots)
  slot_deviation      per slot: shift of the art's centre from the mannequin piece (sheet px) and width / height ratio,
                      against template.tolerance (free_slots such as hair, head and torso may be larger: free_size_hi;
                      tolerance.slot: the prop has no size rule, hair may be much taller, the brow any thickness)
  prop_grip           the template's grip point lies on the prop's art (the hand has something to close on)
  forehead_clear      hair or headgear inside the forehead window (where eyes and brows move) is CUT AWAY from the cap
                      piece, so a raised brow never merges with a fringe; the check reports how much was trimmed
                      (--keep-fringe: nothing is cut, and the check fails when the window is not clear)
  spill, key_blob, fringe_run, lost_art, faded   per piece, the measures and floors of tools/art/spill.py (qa.json art.spill)
A piece is the union of all art blobs whose centre lies in the slot box, so a mouth made of teeth and lips stays one piece.
Hand corrections go into manifest.json under "adjust": {"cap": {"dx": 0, "dy": -6, "scale": 1.05}} (canvas px); they
survive a re-run with --force and are applied by fromTemplate.ts and by the assembled preview.
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import tpl  # noqa: E402
C = tpl.C
import spill as S  # noqa: E402

PAD = 3


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet'); ap.add_argument('id')
    ap.add_argument('--template'); ap.add_argument('--out-dir'); ap.add_argument('--brief')
    ap.add_argument('--rig'); ap.add_argument('--export'); ap.add_argument('--build'); ap.add_argument('--rest')
    ap.add_argument('--iris'); ap.add_argument('--brow', choices=['thin', 'medium', 'thick']); ap.add_argument('--keep-fringe', action='store_true')
    ap.add_argument('--force', action='store_true'); ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()
    T = tpl.load(a.template or tpl.template_of(a.sheet))
    tk, ts, tc, tol = C.cfg('keycheck'), C.cfg('spill'), C.cfg('cut'), T['tolerance']
    out_dir = a.out_dir or os.path.join(C.ROOT, 'public', a.id)
    man_path = os.path.join(out_dir, 'manifest.json')
    old_adjust, opts = {}, {}
    if os.path.exists(man_path):
        if not a.force:
            print(f'{man_path} exists: refusing to overwrite (use --force; hand "adjust" entries are kept)', file=sys.stderr); sys.exit(2)
        try:
            old = json.load(open(man_path)); old_adjust = old.get('adjust', {}); opts = old.get('options', {})
        except (OSError, ValueError):
            pass
    if a.brief:
        b = json.load(open(a.brief))
        opts.update({k: v for k, v in {'build': b.get('build'), 'rest': b.get('default_expression'), 'iris': b.get('iris_hex'), 'brow': b.get('brow')}.items() if v})
    opts.update({k: v for k, v in {'build': a.build, 'rest': a.rest, 'iris': a.iris, 'brow': a.brow}.items() if v})
    bad = [f'{k}: {opts[k]}' for k, ok in (('build', tpl.BUILDS), ('rest', tpl.EXPRESSIONS), ('brow', ['thin', 'medium', 'thick'])) if k in opts and opts[k] not in ok]
    if bad:
        print('unknown option value(s): ' + ', '.join(bad), file=sys.stderr); sys.exit(2)
    R = C.Result('art/template/slice.py', 'standalone', {'sheet': C.rel(a.sheet), 'id': a.id, 'template': T['name']}, {'tolerance': tol, 'spill': ts})
    try:
        im = Image.open(a.sheet).convert('RGB')
    except OSError as e:
        print(e, file=sys.stderr); sys.exit(2)
    W, H = T['sheet']
    same = im.size == (W, H)
    aspect_ok = abs(im.size[0] / im.size[1] - W / H) < 0.01
    R.check('sheet_size', list(im.size), f'== {[W, H]} (or the same aspect)', same or aspect_ok)
    if not same:
        if not aspect_ok:
            R.write(os.path.join(out_dir, 'slice-report.json'), a.quiet); sys.exit(1)
        R.warn(f'sheet is {im.size[0]} x {im.size[1]}, resized to {W} x {H}')
        im = im.resize((W, H), Image.LANCZOS)
    rgb = np.asarray(im).astype(float)
    key, spread = C.key_colour(rgb)
    nominal = C.parse_colour(T['key'])
    R.check('background_flat', round(spread, 2), f"<= {tk['max_border_spread']}", spread <= tk['max_border_spread'])
    R.check('key_is_expected', round(float(C.dist(key, nominal)), 1), f"<= {tk['key_tolerance']} from {T['key']}", C.dist(key, nominal) <= tk['key_tolerance'])
    d, soft = tpl.soft_alpha(rgb, key)
    fg = d > tc['fg_dist']
    lab, comps = C.label(fg)
    comps = [c for c in comps if c['area'] >= tc['speck_min_area']]
    slots = T['slots']
    owner = {}
    stray = []
    for c in comps:
        cx, cy = (c['x0'] + c['x1']) / 2, (c['y0'] + c['y1']) / 2
        hit = [n for n, s in slots.items() if s['box'][0] <= cx < s['box'][2] and s['box'][1] <= cy < s['box'][3]]
        if hit:
            owner.setdefault(hit[0], []).append(c)
        elif c['area'] >= 60:
            stray.append([c['x0'], c['y0'], c['x1'], c['y1']])
    os.makedirs(out_dir, exist_ok=True)
    M = {'id': a.id, 'template': T['name'], 'sheet': C.rel(a.sheet), 'sheet_sha256': C.sha256(a.sheet), 'key': C.hexc(key), 'pad': PAD,
         'slots': {}, 'absent': [], 'colours': {}, 'measure': {}, 'options': opts, 'adjust': old_adjust}
    empty, touching, cut, merged, devbad, state, worst = [], [], [], [], [], {}, {'spill_frac': 0, 'faint_frac': 0, 'key_blob_px': 0, 'fringe_run_px': 0, 'lost_frac': 0, 'lost_blob_px': 0, 'faded_frac': 0}
    per_piece = {}
    for name, s in slots.items():
        cs = owner.get(name, [])
        if not cs:
            if s['optional']:
                M['absent'].append(name); state[name] = 'absent'
            else:
                empty.append(name); state[name] = 'bad'
            continue
        x0, y0 = min(c['x0'] for c in cs), min(c['y0'] for c in cs)
        x1, y1 = max(c['x1'] for c in cs), max(c['y1'] for c in cs)
        bx0, by0, bx1, by1 = s['box']; e = tol['edge_px']
        touch = x0 <= bx0 + e or y0 <= by0 + e or x1 >= bx1 - e or y1 >= by1 - e
        ids = np.array([c['id'] for c in cs])
        broken = x0 <= 1 or y0 <= 1 or x1 >= W - 1 or y1 >= H - 1          # cut by the sheet border
        for other, so in slots.items():                                     # grown into a neighbour's place
            ox0, oy0, ox1, oy1 = so['tpl']
            if other != name and x0 < ox1 and x1 > ox0 and y0 < oy1 and y1 > oy0 and \
                    np.isin(lab[oy0:oy1, ox0:ox1], ids).sum() > 0.25 * (ox1 - ox0) * (oy1 - oy0):
                merged.append([name, other]); broken = True
        if x0 <= 1 or y0 <= 1 or x1 >= W - 1 or y1 >= H - 1:
            cut.append(name)
        tx0, ty0, tx1, ty1 = s['tpl']
        dev = {'dx': round((x0 + x1) / 2 - (tx0 + tx1) / 2, 1), 'dy': round((y0 + y1) / 2 - (ty0 + ty1) / 2, 1),
               'w': round((x1 - x0) / (tx1 - tx0), 3), 'h': round((y1 - y0) / (ty1 - ty0), 3)}
        free = name in tol['free_slots']
        hi = tol['free_size_hi'] if free else tol['size_hi']
        own = tol.get('slot', {}).get(name, {})
        wr, hr = own.get('w', [tol['size_lo'], hi]), own.get('h', [tol['size_lo'], hi])
        ok = (free or max(abs(dev['dx']), abs(dev['dy'])) <= tol['centre_px']) and (own.get('size') is False or (wr[0] <= dev['w'] <= wr[1] and hr[0] <= dev['h'] <= hr[1]))
        if touch:
            touching.append(name)
        if not ok:
            devbad.append({name: dev})
        state[name] = 'bad' if broken else 'warn' if not ok else 'ok'
        # cut: only this slot's blobs, soft alpha as cut.py, de-spilled
        X0, Y0, X1, Y1 = max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD)
        region = C.dilate(np.isin(lab[Y0:Y1, X0:X1], ids), 2)
        other = C.dilate((lab[Y0:Y1, X0:X1] > 0) & ~np.isin(lab[Y0:Y1, X0:X1], ids), 1)
        alpha = np.where(region & ~other, soft[Y0:Y1, X0:X1], 0)
        rgba = np.dstack([rgb[Y0:Y1, X0:X1], alpha]).astype('uint8')
        rgba = S.despill(rgba, key, ts)
        pre = rgba.copy()   # the quality measures look at the piece as it was drawn, before the forehead window is cut
        if name == 'cap' and T.get('face', {}).get('forehead'):
            # THE FOREHEAD WINDOW: where the template says eyes and brows move, the cap must be empty
            fx0, fy0, fx1, fy1, fr = T['face']['forehead']
            px, py, pw, ph = tpl.place(s, [x0, y0, x1, y1], old_adjust.get('cap'))
            kx, ky = (x1 - x0) / pw, (y1 - y0) / ph
            win = Image.new('L', (X1 - X0, Y1 - Y0), 0)
            ImageDraw.Draw(win).rounded_rectangle([(fx0 - px) * kx + x0 - X0, (fy0 - py) * ky + y0 - Y0, (fx1 - px) * kx + x0 - X0, (fy1 - py) * ky + y0 - Y0 + fr * ky],
                                                  radius=fr * kx, fill=255)
            win = np.asarray(win) > 0
            win[int(round((fy1 - py) * ky + y0 - Y0)):] = False
            inside = win & (rgba[..., 3] > 40)
            fore = {'in_window_px': int(inside.sum()), 'of_cap': round(float(inside.sum()) / max(1, int((rgba[..., 3] > 40).sum())), 4), 'trimmed': not a.keep_fringe}
            if not a.keep_fringe:
                soft_win = np.asarray(Image.fromarray((win * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))).astype(float) / 255
                rgba[..., 3] = (rgba[..., 3] * (1 - soft_win)).astype('uint8')
            M['measure']['forehead'] = fore
        if name == 'pupil':
            vis = rgba[..., 3] > 128
            lum = rgba[..., :3].astype(float).mean(axis=2)
            M['measure']['pupilDark'] = round(float((vis & (lum < 70)).sum()) / max(1, int(vis.sum())), 3)   # near 1 = a plain black dot, no iris drawn
        if name == 'prop' and 'grip' in s['pivots']:
            gx, gy = s['pivots']['grip']
            gx, gy = int(gx) - X0, int(gy) - Y0
            M['measure']['propGrip'] = bool(rgba[max(0, gy - 8):gy + 9, max(0, gx - 8):gx + 9, 3].max(initial=0) > 128)
        Image.fromarray(rgba).save(os.path.join(out_dir, name + '.png'))
        m = S.measure(pre, key, ts)
        la = S.lost_art(pre, rgb, [X0, Y0, X1, Y1], key, ts)
        pp = {'spill_frac': m['spill_frac'] or 0, 'faint_frac': m['faint_frac'] or 0, 'key_blob_px': m['key_blob_px'], 'fringe_run_px': m['fringe_run_px'],
              'lost_frac': la['px'] / max(1, m['visible_px'] + la['px']) if la else 0, 'lost_blob_px': la['blob_px'] if la else 0, 'faded_frac': la['faded_frac'] if la else 0}
        per_piece[name] = {k: round(float(v), 4) for k, v in pp.items()}
        for k, v in pp.items():
            worst[k] = max(worst[k], float(v))
        M['slots'][name] = {'file': f'{a.id}/{name}.png', 'size': [X1 - X0, Y1 - Y0], 'art': [int(x0), int(y0), int(x1), int(y1)], 'dev': dev, 'ok': ok and not broken}
        solid = rgba[..., 3] >= 250
        if name in ('head', 'lid', 'cap', 'front') and solid.any():
            M['colours'][name] = C.hexc(np.median(rgba[..., :3][solid], axis=0))
    R.check('slots_filled', empty, '[] (required slots)', not empty, absent_optional=M['absent'])
    R.check('slots_whole', {'cut_by_sheet_border': cut, 'merged': merged}, 'both []', not cut and not merged,
            note=(f'{touching} reach the edge of their own slot box but are whole: fine' if touching and not cut and not merged else None))
    R.check('stray_art', stray[:12], '[]', not stray)
    R.check('slot_deviation', devbad, f"[] (centre <= {tol['centre_px']} px, size {tol['size_lo']}..{tol['size_hi']}; free slots up to {tol['free_size_hi']}; per slot: {json.dumps(tol.get('slot', {}))})", not devbad)
    if 'propGrip' in M['measure']:
        R.check('prop_grip', M['measure']['propGrip'], 'True (art at the template grip point)', M['measure']['propGrip'])
    fo = M['measure'].get('forehead')
    if fo:
        R.check('forehead_clear', fo, 'trimmed, or <= 40 px in the window', fo['trimmed'] or fo['in_window_px'] <= 40,
                note=(f"{fo['in_window_px']} px of hair or headgear hung into the forehead window and were cut away: look at the hairline in overview.jpg" if fo['trimmed'] and fo['in_window_px'] > 40 else None))
    if M['measure'].get('pupilDark', 0) > 0.6:
        R.warn(f"the pupil was drawn as a plain dark dot (dark share {M['measure']['pupilDark']}): fromTemplate adds the iris ring ({opts.get('iris', 'default brown')})")
    R.check('spill_frac_worst', round(worst['spill_frac'], 4), f"<= {ts['max_spill_frac']}", worst['spill_frac'] <= ts['max_spill_frac'])
    R.check('faint_fringe_frac_worst', round(worst['faint_frac'], 4), f"<= {ts['max_faint_frac_strict']}", worst['faint_frac'] <= ts['max_faint_frac_strict'])
    R.check('key_blob_px_worst', worst['key_blob_px'], f"<= {ts['max_key_blob_px']}", worst['key_blob_px'] <= ts['max_key_blob_px'])
    R.check('fringe_run_px_worst', worst['fringe_run_px'], f"<= {ts['max_fringe_run_px_strict']}", worst['fringe_run_px'] <= ts['max_fringe_run_px_strict'])
    R.check('lost_art_worst', {'frac': round(worst['lost_frac'], 4), 'blob_px': worst['lost_blob_px'], 'faded': round(worst['faded_frac'], 4)},
            f"frac <= {ts['max_lost_frac']}, blob <= {ts['max_lost_blob_px']} px, faded <= {ts['max_faded_frac']}",
            worst['lost_frac'] <= ts['max_lost_frac'] and worst['lost_blob_px'] <= ts['max_lost_blob_px'] and worst['faded_frac'] <= ts['max_faded_frac'])
    R.d['measured'] = {'deviation': {n: s['dev'] for n, s in M['slots'].items()}, 'pieces': per_piece, 'colours': M['colours']}
    json.dump(M, open(man_path, 'w'), indent=1)

    # evidence: boxes on the sheet + the figure assembled from the cut files
    ov = im.copy(); dr = ImageDraw.Draw(ov)
    col = {'ok': (0, 220, 90), 'warn': (255, 160, 0), 'bad': (255, 30, 30), 'absent': (150, 150, 150)}
    for name, s in slots.items():
        dr.rectangle(s['box'], outline=col[state[name]], width=3)
        C.text(dr, (s['box'][0] + 5, s['box'][1] + 3), name + ('' if state[name] == 'ok' else f' [{state[name]}]'), 14, (255, 255, 255))
    for b in stray:
        dr.rectangle(b, outline=(255, 30, 30), width=3)

    def get(slot):
        e = M['slots'].get(slot)
        if not e:
            return None
        p = Image.open(os.path.join(out_dir, slot + '.png')).convert('RGBA')
        x0, y0, x1, y1 = e['art']
        return p.crop((PAD if x0 >= PAD else x0, PAD if y0 >= PAD else y0, (PAD if x0 >= PAD else x0) + x1 - x0, (PAD if y0 >= PAD else y0) + y1 - y0)), e['art']
    groups = T.get('groups', {})
    picks = [{}]
    if 'mouth' in groups:
        picks += [{'mouth': 'smile', 'handL': 'point', 'handR': 'fist'}, {'mouth': 'teeth', 'handL': 'grip', 'handR': 'open', 'prop': 'held'}]
    elif 'pic' in groups:
        picks += [{'pic': o} for o in groups['pic']['options'][1:]]
    figs = [tpl.assemble(T, get, 'front', p, adjust=M['adjust']).convert('RGB') for p in picks if not empty]
    if any(p.get('view') == 'back' for p in T['pieces']) and not empty and not ({'backHead', 'backTorso', 'back'} & set(M['absent'])):
        figs.append(tpl.assemble(T, get, 'back', adjust=M['adjust']).convert('RGB'))
    if figs:
        model = C.hstack(figs, gap=0)
        model.save(os.path.join(out_dir, 'assembled.png'))
        m2 = model.copy(); m2.thumbnail((ov.size[0], 700))
        ov = C.vstack([ov, m2])
    ovp = os.path.join(out_dir, 'overview.jpg')
    ov.save(ovp, quality=88)
    R.evidence(ovp)
    R.not_checked('whether each slot really shows the piece it is meant to (a mouth in the brow slot passes): look at overview.jpg')
    R.not_checked('whether the joints close when the limbs turn: render the model-sheet stills (CHARACTERS.md, step 6)')
    if a.rig:
        rp = a.rig if os.path.isabs(a.rig) else os.path.join(C.ROOT, a.rig)
        if os.path.exists(rp) and not a.force:
            print(f'{rp} exists: not overwritten (use --force)', file=sys.stderr)
        else:
            const = a.export or ''.join(ch for ch in a.id.upper().replace('-', '_') if ch.isalnum() or ch == '_').strip('_')
            fn = 'fromTemplate' if 'mouth' in groups else 'extraFromTemplate'
            with open(rp, 'w') as f:
                f.write(f'// GENERATED by tools/art/template/slice.py from {C.rel(a.sheet)} (template {T["name"]}). Re-run slice.py instead of editing the numbers;\n'
                        f'// hand corrections belong in public/{a.id}/manifest.json under "adjust" (then re-run with --force).\n'
                        f"import {{{fn}}} from '../../puppet/template';\nimport type {{Manifest}} from '../../puppet/template';\n\n"
                        f'export const {const}_MANIFEST: Manifest = {json.dumps(M, indent=1)};\n\n'
                        f'// build, default expression, iris and brow weight are manifest "options" (slice.py --brief / --build / --rest / --iris / --brow)\n'
                        f'export const {const} = {fn}({const}_MANIFEST);\n')
            print('rig module:', C.rel(rp))
        n = tpl.write_models()
        print(f'model sheets: src/puppet/template/models.gen.ts lists {n} character(s); stills model-{a.id} and model-{a.id}-faces')
    R.write(os.path.join(out_dir, 'slice-report.json'), a.quiet)
    sys.exit(R.exit_code())


if __name__ == '__main__':
    main()
