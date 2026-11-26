"""Character brief -> the generation prompt that makes the image tool REDRAW THE TEMPLATE SHEET as that character.

usage:
  python3 tools/art/template/prompt.py BRIEF.json [--template human-v2] [--finish APPROVED.png] [--same-as OWN-SHEET.png] [--out FILE]

BRIEF.json follows the bible's character brief (STYLE-BIBLE.md 5.6); see briefs/example-miller.json:
  id, role, function, age_build, build (adult | child | heavy | tall), silhouette, colour, skin, hair, costume, motif,
  default_expression, flip_expression, prop (or null), back_view (true / false), notes (optional free text),
  iris (colour in words, default "warm brown"), iris_hex (optional: the same colour for the rig, used when the
  generator draws a plain dot), brow (thin | medium | thick, default medium: the rig sets the thickness)
Writes prompts/<id>.txt and prints the commands that follow (generate, slice, model sheet).

  --finish   an approved character picture of ours, passed as the SECOND image: the finish to match (never reference footage)
  --same-as  this character's OWN approved sheet, passed as the second image: for a later state or a repair, so the
             character stays the same (colours, shapes) and only what the brief's "notes" names changes

The template image is the FIRST image and fixes the layout. Build variants (child, heavy, tall) are NOT asked from the
generator: every character is drawn on the standard adult skeleton and the rig applies the build after cutting.
The words avoid everything tools/art/gen.sh refuses (pose wording, placeholders) and carry their own ART STYLE block
(bible section 8: flat cut-paper shapes, 2-3 flat tones, no outlines, no soft shading), so gen.sh adds nothing.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import tpl  # noqa: E402

STYLE = ('ART STYLE: flat 2D vector cut-out cartoon, as if cut from coloured paper: flat cut-paper shapes, hard-edged tone blocks, '
         '2 to 3 flat tones per piece, simple smooth curves, clean crisp edges; NO outlines, NO soft shading, NO gradients, NO texture, '
         'NO highlights except one tiny white dot in the pupil. Big rounded head, large round eyes, short thick limbs, mitten-like hands. '
         'BACKGROUND: perfectly flat solid magenta #FF00FF everywhere, no floor, no shadows, no glow, no text, no labels, no numbers, no frames, no guide lines.')

REQUIRED = ['id', 'role', 'age_build', 'silhouette', 'colour', 'hair', 'costume', 'default_expression']


def build(brief, T, finish=False, same=False):
    b = brief
    miss = [k for k in REQUIRED if not b.get(k)]
    if miss:
        raise SystemExit('brief lacks: ' + ', '.join(miss))
    W, H = T['sheet']
    S = T['slots']
    skip = []
    if not b.get('back_view', True):
        skip += [n for n in S if n.startswith('back')]
    if not b.get('prop') and 'prop' in S:
        skip.append('prop')
    hints = {
        'head': f"skin: {b.get('skin', 'as fits the character')}. Any beard, moustache, scar or face paint is part of this piece",
        'cap': b['hair'], 'backHead': b['hair'], 'torso': b['costume'] + ('; ' + b['motif'] if b.get('motif') else ''),
        'backTorso': b['costume'], 'upperArm': 'sleeve of the same costume', 'forearm': 'the same sleeve, or bare skin if the sleeves are short or rolled',
        'upperLeg': 'the same costume', 'lowerLeg': 'the same costume and its footwear', 'prop': b.get('prop') or '',
        'ear': 'same skin colour as the head', 'lid': 'same skin colour as the head',
        'brow': f"in the hair colour, {b.get('brow', 'medium')} weight", 'pupil': f"iris colour: {b.get('iris', 'warm brown')}",
        'front': '', 'startled': '', 'back': '',
    }
    for h in ('open', 'fist', 'point', 'grip'):
        hints[f'hand_{h}'] = 'same skin colour as the head (or the glove of the costume)'
    order = sorted(S, key=lambda n: (S[n]['box'][1] // 100, S[n]['box'][0]))
    lines = []
    for i, n in enumerate(order, 1):
        s = S[n]
        cx, cy = (s['tpl'][0] + s['tpl'][2]) // 2, (s['tpl'][1] + s['tpl'][3]) // 2
        where = f"centre near x {round(100 * cx / W)} %, y {round(100 * cy / H)} % of the image"
        if n in skip:
            lines.append(f'{i}) [{where}] LEAVE THIS PLACE EMPTY: plain magenta, no piece.')
        else:
            hint = hints.get(n, '')
            lines.append(f"{i}) [{where}] {s['words']}." + (f' For this character: {hint}.' if hint else ''))
    p = []
    p.append(f'The first attached image is a TEMPLATE SHEET ({W} x {H}, landscape 3:2): a plain grey mannequin taken apart into separate pieces on flat magenta. '
             'REDRAW THIS EXACT SHEET AS THE CHARACTER DESCRIBED BELOW. It is a parts sheet for a cut-out puppet, not a scene.')
    p.append('LAYOUT RULES (the pieces are cut out by position afterwards, so these matter more than anything else): '
             f'same canvas, {W} x {H}; same flat magenta background; EVERY piece in the SAME PLACE, at the SAME SIZE and in the SAME ORIENTATION as the grey piece it replaces: '
             'its top edge at the same height, the same length, the same width, upright exactly as in the template. '
             'Costume pieces may be up to a fifth larger than the grey shape where the design needs it (a wide collar), never smaller. '
             'Hair and headgear keep the place and width of the grey shape round the face and may grow UPWARD into the free magenta above it as far as the design needs (a bun, a tall hat); '
             'they stay well inside the image and never come close to a neighbouring piece. '
             'Exactly ONE piece for each grey piece: add nothing, draw nothing between the pieces, no extra views, no assembled figure anywhere. '
             'No piece touches or overlaps another piece or the image border: keep the wide magenta gaps of the template. '
             'Every piece is drawn complete, including the parts normally hidden behind other pieces; limbs keep their round ends, the torso keeps its flat top with the neck. '
             'All pieces belong to one figure: the same colour for the same material on every piece, the skin colour identical on head, ear, eyelid block and hands.')
    who = [f"CHARACTER: {b['role']}; {b['age_build']}.", f"Recognised by: {b['silhouette']}.", f"Signature colour: {b['colour']}.",
           f"Hair or headgear: {b['hair']}.", f"Costume: {b['costume']}."]
    if b.get('motif'):
        who.append(f"Motif: {b['motif']}.")
    if b.get('skin'):
        who.append(f"Skin: {b['skin']}.")
    if b.get('notes'):
        who.append(b['notes'])
    who.append('The face parts are drawn in their NEUTRAL shapes, in the place and at the size the template shows (the expression is made later by moving them): '
               'the eye white a plain large cream oval; the pupil a round iris in the colour named below, clearly lighter than its small black centre; the eyelid a plain skin block; '
               'the brow one level tapered stroke in the hair colour; the eight mouths in the same eight shapes and order. '
               "They are this character's own face parts, drawn in the same hand as the body, not grey copies of the template.")
    p.append(' '.join(who))
    p.append('PIECES, row by row, left to right (every position is the position of the grey piece in the template): ' + ' '.join(lines))
    if same:
        p.append("The second attached image is THIS CHARACTER'S OWN APPROVED SHEET: keep exactly its colours, shapes, proportions and level of detail; change only what the character description above names as new.")
    elif finish:
        p.append('The second attached image is an approved character of the same series: match its FINISH (flat line-less shapes, number of tones, level of detail, how hands and shoes are simplified), not its design or colours.')
    p.append(STYLE)
    return '\n'.join(p) + '\n'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('brief'); ap.add_argument('--template', default=tpl.DEFAULT)
    ap.add_argument('--finish'); ap.add_argument('--same-as'); ap.add_argument('--out')
    a = ap.parse_args()
    b = json.load(open(a.brief)); T = tpl.load(a.template)
    text = build(b, T, bool(a.finish), bool(a.same_as))
    out = a.out or os.path.join(HERE, 'prompts', b['id'] + '.txt')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write(text)
    rel = os.path.relpath(out, tpl.C.ROOT)
    ref2 = a.same_as or a.finish
    cid = b['id']; human = 'mouth' in T.get('groups', {})
    print(f'prompt: {rel} ({len(text)} characters)\n')
    print('next (from rover-lab/, sandbox disabled for the generation):')
    print(f"  GEN_BUDGET=2 tools/art/gen.sh --dry-run {cid}-sheet.png {rel} tools/art/template/{T['name']}.png" + (f' {ref2}' if ref2 else ''))
    print(f"  GEN_BUDGET=2 tools/art/gen.sh {cid}-sheet.png {rel} tools/art/template/{T['name']}.png" + (f' {ref2}' if ref2 else ''))
    print(f'  python3 tools/art/keycheck.py gen/{cid}-sheet.png')
    print(f"  python3 tools/art/template/slice.py gen/{cid}-sheet.png {cid} --rig src/chars/_lib/{cid}.ts" + (f' --brief {os.path.relpath(a.brief, tpl.C.ROOT)}' if human else f" --template {T['name']}"))
    if human:
        print(f'  ./still.sh model-{cid} 0 1 && ./still.sh model-{cid}-faces 0 1     # registered by slice.py, nothing to edit')
        print(f"  # the brief gives the rig its build ({b.get('build', 'adult')}), rest expression ({b['default_expression']}), iris and brow; its flip: '{b.get('flip_expression', '?')}'")


if __name__ == '__main__':
    main()
