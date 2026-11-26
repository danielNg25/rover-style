"""Before cutting: is the background key colour of a sheet far enough from the art?

usage:
  python3 tools/art/keycheck.py SHEET.png [--key auto|'#RRGGBB'] [--out R.json] [--evidence E.jpg]

Why: a green character generated on a green background could not be keyed, and pink parts on
magenta get eaten by the cutter. This check runs on the sheet BEFORE tools/art/cut.py.

What is measured (standalone: absolute floors from qa.json art.keycheck, no reference picture needed):
  background_flat      mean RGB distance of the border ring to its median colour (a gradient or a drawn
                       floor fails; the cutter needs a flat key)
  key_is_expected      the sampled key is within key_tolerance of the nominal key (--key or qa.json art.key.default)
                       ("auto" skips this and accepts whatever the border has)
  near_key_hue_frac    share of ART pixels (pixels farther than flood_tolerance from the key, edge ring
                       of erode_px removed) that are saturated and whose hue is within hue_window degrees of
                       the key's hue. Above fail_frac: FAIL. Above warn_frac: PASS with a warning that names
                       the colour and marks the pixels in the evidence image.
  delta_e_p            Lab distance to the key exceeded by all but the closest delta_e_percentile % of art
                       pixels; below min_delta_e: FAIL
  would_be_eaten_frac  share of art pixels closer to the key than the cutter's alpha ramp (art.cut.alpha_hi):
                       these become transparent in tools/art/cut.py. Above max_eaten_frac: FAIL
  enclosed_key_frac_of_art   key-coloured regions that do not touch the border (>= enclosed_min_px each), as a
                       share of the art area. Above max_enclosed_frac: FAIL (a robe painted in the key colour inside
                       a dark outline); above warn_enclosed_frac: warning (gaps between legs are normally below it).
  near_key_band_frac   solid areas whose colour lies between near_band_lo and flood_tolerance RGB from the key, as a
                       share of the art area: art in almost the key colour that the cutter takes for background.
                       Above max_near_key_band_frac: FAIL.
  art_present          the silhouette is not empty and does not fill the frame
Also reported, never judged: the same delta_e_p for each candidate key in qa.json art.key.candidates, and
which candidate would be best for this palette (use it for the NEXT sheet of the same character).
Evidence: the sheet next to a map where art pixels too close to the key are painted red (hue) or orange (Lab).
Exit 0 = pass, 1 = fail, 2 = could not measure.
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C


def silhouette(rgb, key, tol):
    """Art = every pixel farther than tol from the key. Also returns the enclosed key-coloured regions
    (background seen through a gap, e.g. between legs, or art painted in exactly the key colour)."""
    bg = C.dist(rgb, key) <= tol
    return ~bg, bg & ~C.border_connected(bg)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('sheet'); ap.add_argument('--key', default=None)
    ap.add_argument('--out'); ap.add_argument('--evidence'); ap.add_argument('--quiet', action='store_true')
    a = ap.parse_args()
    t = C.cfg('keycheck'); kc = C.cfg('key')
    stem = os.path.splitext(os.path.basename(a.sheet))[0]
    out = a.out or os.path.join(C.ROOT, 'qa', 'art', f'keycheck-{stem}.json')
    ev = a.evidence or os.path.splitext(out)[0] + '.jpg'
    R = C.Result('art/keycheck.py', 'standalone', {'sheet': C.rel(a.sheet), 'key_arg': a.key or kc['default']}, t)
    try:
        im = Image.open(a.sheet).convert('RGB')
    except OSError as e:
        print(e, file=sys.stderr); sys.exit(2)
    rgb = np.asarray(im).astype(float)
    key, spread = C.key_colour(rgb)
    R.d['measured']['key_sampled'] = C.hexc(key)
    R.check('background_flat', round(spread, 2), f"<= {t['max_border_spread']}", spread <= t['max_border_spread'])
    if (a.key or '').lower() == 'auto':
        R.not_checked('key_is_expected (--key auto)')
    else:
        nominal = C.parse_colour(a.key or kc['default'])
        dk = float(C.dist(key, nominal))
        R.check('key_is_expected', round(dk, 1), f"<= {t['key_tolerance']} from {C.hexc(nominal)}", dk <= t['key_tolerance'])
    art, enclosed = silhouette(rgb, key, t['flood_tolerance'])
    core = C.erode(art, t['erode_px'])
    frac_art = float(art.mean())
    R.check('art_present', round(frac_art, 4), f"{t['min_art_frac']} .. {t['max_art_frac']}",
            t['min_art_frac'] <= frac_art <= t['max_art_frac'])
    # art that the flood tolerance takes for background: judged, not only painted
    art_px = max(1, int(art.sum()))
    elab, ecomps = C.label(enclosed)
    big = [c for c in ecomps if c['area'] >= t['enclosed_min_px']]
    enc_frac = sum(c['area'] for c in big) / art_px
    R.check('enclosed_key_frac_of_art', round(enc_frac, 4), f"<= {t['max_enclosed_frac']} (warn > {t['warn_enclosed_frac']})",
            enc_frac <= t['max_enclosed_frac'], regions=[[c['x0'], c['y0'], c['x1'], c['y1']] for c in sorted(big, key=lambda c: -c['area'])][:8],
            note='key-coloured areas enclosed by art (cyan in the evidence). A small share is background seen through a gap; '
                 'a large share is art painted in the key colour, which the cutter would make transparent')
    if t['warn_enclosed_frac'] < enc_frac <= t['max_enclosed_frac']:
        R.warn(f'{enc_frac * 100:.1f} % of the art area is enclosed key colour (cyan in the evidence): confirm by eye that these are gaps, not art')
    dkey = C.dist(rgb, key)
    band = C.erode((dkey > t['near_band_lo']) & (dkey <= t['flood_tolerance']), t['near_band_erode_px'])
    band_frac = float(band.sum() / art_px)
    R.check('near_key_band_frac', round(band_frac, 5), f"<= {t['max_near_key_band_frac']}", band_frac <= t['max_near_key_band_frac'],
            note=f"solid areas {t['near_band_lo']}-{t['flood_tolerance']} RGB from the key (not the flat background, not far enough to count "
                 'as art): art in almost the key colour, treated as background by the cutter. Painted blue in the evidence')
    if core.sum() < 100:
        R.check('near_key_hue_frac', None, f"<= {t['fail_frac']}", None, note='no art found')
        R.write(out, a.quiet); sys.exit(R.exit_code())
    px = rgb[core]
    h, s, v = C.rgb_to_hsv(px)
    kh, ks, kv = C.rgb_to_hsv(key[None])
    hd = C.hue_dist(h, kh[0])
    near_h = (s >= t['min_saturation']) & (v >= t['min_value']) & (hd <= t['hue_window'])
    fh = float(near_h.mean())
    R.check('near_key_hue_frac', round(fh, 4), f"<= {t['fail_frac']} (warn > {t['warn_frac']})", fh <= t['fail_frac'],
            key_hue=round(float(kh[0]), 1))
    lab = C.rgb_to_lab(px)
    de = np.sqrt(((lab - C.rgb_to_lab(key[None])) ** 2).sum(-1))
    dep = float(np.percentile(de, t['delta_e_percentile']))
    R.check('delta_e_p', round(dep, 1), f">= {t['min_delta_e']}", dep >= t['min_delta_e'],
            percentile=t['delta_e_percentile'])
    cut_hi = C.cfg('cut')['alpha_hi']
    eaten = C.dist(px, key) < cut_hi
    fe = float(eaten.mean())
    R.check('would_be_eaten_frac', round(fe, 5), f"<= {t['max_eaten_frac']}", fe <= t['max_eaten_frac'],
            note=f'art closer than art.cut.alpha_hi = {cut_hi} (RGB) to the key becomes transparent in tools/art/cut.py')
    if t['warn_frac'] < fh <= t['fail_frac']:
        med = np.median(px[near_h], axis=0)
        R.warn(f"{fh * 100:.1f} % of the art (about {C.hexc(med)}) has a hue within {t['hue_window']} deg of the key: "
               'check these parts in the evidence image and in tools/art/spill.py lost_frac after cutting')
    cands = {}
    for name, hx in kc['candidates'].items():
        d = np.sqrt(((lab - C.rgb_to_lab(C.parse_colour(hx)[None])) ** 2).sum(-1))
        cands[name] = round(float(np.percentile(d, t['delta_e_percentile'])), 1)
    best = max(cands, key=cands.get)
    R.d['measured'].update({'art_frac': round(frac_art, 4), 'enclosed_key_regions_frac_of_art': round(float(enclosed.sum() / max(1, art.sum())), 4), 'near_key_band_frac': round(band_frac, 5), 'candidate_delta_e_p': cands, 'best_candidate': best,
                            'best_candidate_ok': cands[best] >= t['min_delta_e']})
    if cands[best] < t['min_delta_e']:
        R.warn('no candidate key is far enough from this palette: stop and ask the owner')
    # evidence
    mark = np.asarray(im).copy()
    grey = (0.35 * mark + 0.65 * 255).astype('uint8')
    m2 = np.where(art[..., None], mark, grey)
    lab_bad = np.zeros(art.shape, bool); hue_bad = np.zeros(art.shape, bool)
    lab_bad[core] = (de < t['min_delta_e']) | eaten; hue_bad[core] = near_h
    m2[enclosed] = (0, 200, 255); m2[band] = (0, 60, 255); m2[lab_bad] = (255, 150, 0); m2[hue_bad] = (255, 0, 0)
    left = im.copy(); right = Image.fromarray(m2)
    for p in (left, right):
        p.thumbnail((900, 900))
    d = ImageDraw.Draw(right)
    C.text(d, (8, 6), f'art only. red: hue within {t["hue_window"]} deg of key {C.hexc(key)} ({fh * 100:.1f} %)   orange: Lab dE < {t["min_delta_e"]} or would be eaten ({fe * 100:.2f} %)', 15)
    C.text(d, (8, 28), f'dE p{t["delta_e_percentile"]} = {dep:.0f}   candidates {cands}   verdict {R.verdict()}   cyan: enclosed key-coloured regions ({enc_frac * 100:.1f} % of art)   blue: almost-key solid areas', 15)
    C.text(ImageDraw.Draw(left), (8, 6), f'{os.path.basename(a.sheet)}  key sampled {C.hexc(key)}', 15)
    C.hstack([left, right]).save(ev, quality=88)
    R.evidence(ev)
    R.not_checked('semi-transparent art (glows, smoke): a flat key cannot carry it, generate such parts in code')
    R.not_checked(f"small art in exactly the key colour (under {t['max_enclosed_frac'] * 100:.0f} % of the art area it is indistinguishable from a gap; with no outline around it, at any size)")
    R.write(out, a.quiet)
    sys.exit(R.exit_code())


if __name__ == '__main__':
    main()
