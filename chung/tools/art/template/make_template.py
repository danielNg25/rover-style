"""Draw the STANDARD CHARACTER SKELETON as template sheets (Pillow only, no generator).

usage:  python3 tools/art/template/make_template.py

writes, next to this file:
  human-v2.png             1536 x 1024, flat magenta: the grey mannequin taken apart into FIXED SLOTS.
                           This is the layout reference passed to tools/art/gen.sh for every new character.
  human-v1.png / .json     the FIRST layout (head row drawn at body scale, centred in its boxes: 41 px of headroom).
                           Kept only so that sheets generated on it still slice; same skeleton, same face kit.
  human-v1.json            slots (box, scale, mannequin bbox, canvas rect, anchor, fit, pivots), rig pieces
                           (side, mirror, pivot, parent, z), swap groups, proportions
  human-v1-assembled.png   the mannequin put together again FROM THE SHEET by the JSON map (front and back)
  human-v1-guide.png       the sheet with slot boxes, names and pivots drawn in (for people; never sent to the generator)
  extra-v1.png / .json     simpler template for single-picture extras: front calm, front startled, back
and src/puppet/template/human-v1.ts, extra-v1.ts: the same JSON as typed constants for fromTemplate.ts.

Everything is defined ONCE, in canvas pixels of the assembled figure (400 x 560, ground y 540, 520 tall, x right,
y down, the same canvas as src/chars/_lib/doom.ts); the sheet is that figure taken apart. Change a number here,
run the script, and sheet, JSON, assembled proof and TS constants all follow.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import tpl  # noqa: E402
C = tpl.C

SHEET = (1536, 1024)
KEY = (255, 0, 255)
CANVAS = (400, 560); GROUND = 540; CX = 200; TOP = 20
SS = 4  # supersampling of the drawing

# grey mannequin: 2-3 flat tones per piece, no outlines
SKIN, SKIN2 = '#cdcdcd', '#b2b2b2'
CLOTH, CLOTH2, CLOTH3 = '#9c9ca4', '#888892', '#6b6b76'
DARK = '#494951'
WHITE, IRIS, BLACK, MOUTH, TONGUE = '#f5f2ea', '#9a9aa8', '#1e1e24', '#34343b', '#8d8d96'
CLEAR = (0, 0, 0, 0)

# ---- the skeleton: joints on the canvas (screen-left side; the right side is the mirror about x = 200)
# The face kit is DRAWN on the sheet at the size of a 70 x 78 eye and STANDS on the canvas EYE_K times larger (the
# professional faces have eye whites of 0.4 of the head width): the slot scale of the eye pieces is FACE / EYE_K, so
# the sheet picture is the same whatever EYE_K is, and a sheet generated before the change still fits.
EYE_K = 1.15
EYE = (161, 145); EYE_W, EYE_H = 70 * EYE_K, 78 * EYE_K
BROW_Y = 89; MOUTH_C = (200, 208)
IRIS_D = 26.5                      # iris diameter on the canvas (0.33 of the eye width); the black centre is half of it
BROW_H = {'thin': 7, 'medium': 10, 'thick': 14}   # brow thickness on the canvas: the rig sets it, whatever was drawn
FOREHEAD = (118, 63, 282, 192, 46)  # x0, y0, x1, y1, corner radius: the window the eyes and brows move in; no hair inside
NECK = (200, 230)            # head turns about it
SHOULDER = (122, 252); ELBOW = (122, 306); WRIST = (122, 364)
HIP = (166, 398); KNEE = (166, 462)
LEAN = (200, 400)            # torso turns about it (lean)


class D:
    """Draws in canvas coordinates onto a supersampled RGBA layer covering box = (x0, y0, x1, y1)."""

    def __init__(self, box, scale):
        self.box, self.k = box, scale * SS
        self.im = Image.new('RGBA', (round((box[2] - box[0]) * self.k), round((box[3] - box[1]) * self.k)), CLEAR)
        self.d = ImageDraw.Draw(self.im)

    def _b(self, b):
        return [(b[0] - self.box[0]) * self.k, (b[1] - self.box[1]) * self.k, (b[2] - self.box[0]) * self.k - 1, (b[3] - self.box[1]) * self.k - 1]

    def rr(self, b, r, fill):
        self.d.rounded_rectangle(self._b(b), radius=r * self.k, fill=fill)

    def ell(self, b, fill):
        self.d.ellipse(self._b(b), fill=fill)

    def rect(self, b, fill):
        self.d.rectangle(self._b(b), fill=fill)

    def poly(self, pts, fill):
        self.d.polygon([((x - self.box[0]) * self.k, (y - self.box[1]) * self.k) for x, y in pts], fill=fill)

    def done(self):
        w, h = self.im.size
        return self.im.resize((w // SS, h // SS), Image.LANCZOS)


def hand_base(d, wide=True):
    d.rr((99, 356, 145, 398), 16, SKIN)


def draw_head(d):
    d.rr((98, 52, 302, 236), 78, SKIN)


def draw_cap(d):
    d.rr((92, 20, 308, 180), 96, DARK)
    d.rr((114, 60, 286, 320), 52, CLEAR)   # the face opening: the whole forehead window stays bare
    d.ell((126, 30, 214, 54), '#5a5a63')


def draw_ear(d):
    d.ell((84, 130, 110, 172), SKIN)
    d.ell((90, 139, 103, 163), SKIN2)


def draw_torso(d, back=False):
    d.rr((178, 212, 222, 250), 8, SKIN2)
    d.rr((126, 230, 274, 404), 30, CLOTH)
    d.rect((126, 366, 274, 378), CLOTH3)
    if not back:
        d.poly([(178, 230), (222, 230), (200, 262)], SKIN2)
        d.rect((198, 262, 202, 366), CLOTH2)


def draw_upper_arm(d):
    d.rr((100, 230, 144, 318), 22, CLOTH2)


def draw_forearm(d):
    d.rr((103, 294, 141, 372), 19, CLOTH2)
    d.rr((103, 354, 141, 372), 8, CLOTH3)


def draw_hand_open(d):
    for x, y in ((100, 406), (111, 412), (122, 412), (133, 406)):
        d.rr((x, 380, x + 11, y), 5.5, SKIN)
    d.rr((100, 356, 144, 398), 14, SKIN)
    for x in (110.5, 121.5, 132.5):
        d.rect((x, 396, x + 1.2, 407), SKIN2)
    d.rr((141, 364, 153, 392), 6, SKIN)   # thumb, on the body side


def draw_hand_fist(d):
    hand_base(d)
    for x in (110, 121, 132):
        d.rect((x, 384, x + 2, 398), SKIN2)


def draw_hand_point(d):
    d.rr((115, 380, 128, 422), 6.5, SKIN)
    hand_base(d)
    for x in (132, 121):
        d.rect((x, 384, x + 2, 398), SKIN2)


def draw_hand_grip(d):
    hand_base(d)
    d.rr((95, 370, 149, 384), 6, SKIN2)   # the fingers wrapped round whatever is held
    d.rr((141, 360, 153, 380), 6, SKIN)


def draw_upper_leg(d):
    d.rr((137, 384, 195, 474), 16, CLOTH3)


def draw_lower_leg(d):
    d.rr((140, 450, 192, 530), 14, CLOTH3)
    d.rr((132, 508, 198, 540), 15, DARK)


def draw_eye_white(d):
    d.ell((EYE[0] - EYE_W / 2, EYE[1] - EYE_H / 2, EYE[0] + EYE_W / 2, EYE[1] + EYE_H / 2), WHITE)


def draw_pupil(d):
    x, y = EYE
    r = IRIS_D / 2
    d.ell((x - r, y - r, x + r, y + r), IRIS)
    d.ell((x - r / 2, y - r / 2, x + r / 2, y + r / 2), BLACK)
    d.ell((x - 6, y - 7, x - 2, y - 3), WHITE)


def draw_lid(d):
    k = EYE_K
    d.rr((EYE[0] - 43 * k, EYE[1] - 46 * k, EYE[0] + 43 * k, EYE[1] + 44 * k), 10, SKIN)


def draw_brow(d):
    # a tapered stroke: thin at the outer end (left), full at the inner end (right, toward the nose)
    x0, x1, y, t = EYE[0] - 31 * EYE_K, EYE[0] + 31 * EYE_K, BROW_Y, BROW_H['medium'] / 2
    d.poly([(x0 + 2.5, y - 2.5), (x1 - t, y - t), (x1 - t, y + t), (x0 + 2.5, y + 2.5)], DARK)
    d.ell((x0, y - 2.5, x0 + 5, y + 2.5), DARK); d.ell((x1 - 2 * t, y - t, x1, y + t), DARK)


def mouth(kind):
    mx, my = MOUTH_C

    def f(d):
        if kind == 'closed':
            d.rr((mx - 15, my - 3, mx + 15, my + 3), 3, MOUTH)
        elif kind == 'small':
            d.ell((mx - 12, my - 8, mx + 12, my + 8), MOUTH)
        elif kind == 'wide':
            d.rr((mx - 23, my - 15, mx + 23, my + 19), 15, MOUTH)
            d.ell((mx - 13, my + 5, mx + 13, my + 17), TONGUE)
        elif kind == 'smile':
            d.ell((mx - 27, my - 22, mx + 27, my + 12), MOUTH)
            d.ell((mx - 34, my - 34, mx + 34, my + 3), CLEAR)
        elif kind == 'frown':
            d.ell((mx - 27, my - 6, mx + 27, my + 28), MOUTH)
            d.ell((mx - 34, my + 3, mx + 34, my + 40), CLEAR)
        elif kind == 'flat':
            d.rr((mx - 23, my - 3, mx + 23, my + 3), 3, MOUTH)
        elif kind == 'o':
            d.ell((mx - 11, my - 13, mx + 11, my + 13), MOUTH)
        elif kind == 'teeth':
            d.rr((mx - 25, my - 13, mx + 25, my + 13), 9, MOUTH)
            d.rr((mx - 21, my - 9, mx + 21, my + 9), 6, WHITE)
            d.rect((mx - 21, my - 1, mx + 21, my + 1), MOUTH)
            for x in (-11, 0, 11):
                d.rect((mx + x - 1, my - 9, mx + x + 1, my + 9), MOUTH)
    return f


def draw_back_head(d):
    d.rr((98, 52, 302, 236), 78, SKIN)
    d.rr((92, 20, 308, 206), 96, DARK)
    d.ell((126, 30, 214, 54), '#5a5a63')


def draw_prop(d):
    d.rr((116, 252, 128, 424), 5, CLOTH3)
    d.ell((108, 236, 136, 264), CLOTH)


MOUTHS = ['closed', 'small', 'wide', 'smile', 'frown', 'flat', 'o', 'teeth']
HANDS = ['open', 'fist', 'point', 'grip']
BODY, FACE = 1.4, 2.0   # sheet px per canvas px: body pieces, and the face kit (drawn larger so small shapes survive)

# slot: (name, box on the sheet, scale, bounds of the drawing on the canvas, draw, anchor (x, y), fit, optional, pivots (canvas), prompt words)
ROW_A, ROW_B, ROW_C = (16, 400), (416, 736), (752, 1008)
HEADROW = {'human-v1': (BODY, 'c'), 'human-v2': (1.15, 'b')}   # head, cap, backHead: sheet scale and where they sit in the box
SLOTS = [
    ('head', (16, ROW_A[0], 356, ROW_A[1]), 'HEAD', (90, 44, 310, 244), draw_head, ('c', 't'), 'w', False, {'neck': NECK},
     'HEAD, front view: the bare head shape in skin colour with NO face features at all (no eyes, brows, nose or mouth), no hair, no ears; a beard or jaw line belongs here'),
    ('cap', (372, ROW_A[0], 752, ROW_A[1]), 'HEAD', (84, 12, 316, 190), draw_cap, ('c', 'fixed'), 'none', False, {'skullTop': (200, 52)},
     'HAIR OR HEADGEAR alone, front view, as a cap that drops onto the head: the opening for the face stays empty (magenta shows through) '
     'and is AT LEAST as tall and as wide as in the template, so the whole forehead stays bare: no fringe, strand or brim hangs into the opening. '
     'A bun, tall hair or a tall hat grows UPWARD into the free magenta above the grey shape; the part round the face keeps the place and width of the grey shape'),
    ('backHead', (768, ROW_A[0], 1148, ROW_A[1]), 'HEAD', (84, 12, 316, 244), draw_back_head, ('c', 'fixed'), 'none', True, {'neck': NECK},
     'BACK OF THE HEAD, seen from behind, with its hair or headgear, no face; a bun or tall hat grows UPWARD into the free magenta above the grey shape'),
    ('ear', (1164, 16, 1264, 176), BODY, (80, 126, 114, 176), draw_ear, ('c', 'c'), 'h', False, {},
     'ONE EAR (screen-left ear), small'),
    ('prop', (1280, ROW_A[0], 1520, ROW_A[1]), BODY, (100, 230, 150, 430), draw_prop, ('fixed', 'fixed'), 'none', True, {'grip': (122, 378)},
     "ONE HAND PROP of this character, upright; its handle is a vertical rod exactly where the template's rod is (the hand closes on the lower third of it)"),
    ('torso', (16, ROW_B[0], 316, ROW_B[1]), BODY, (118, 206, 282, 410), draw_torso, ('c', 't'), 'none', False, {'neck': NECK, 'lean': LEAN},
     'NECK AND TORSO, front view, flat top at the shoulders, no arms, no legs, no head: the costume of the upper body down to the hips'),
    ('backTorso', (332, ROW_B[0], 632, ROW_B[1]), BODY, (118, 206, 282, 410), lambda d: draw_torso(d, True), ('c', 't'), 'none', True, {'neck': NECK, 'lean': LEAN},
     'NECK AND TORSO seen from behind'),
    ('upperArm', (648, ROW_B[0], 768, ROW_B[1]), BODY, (94, 224, 150, 324), draw_upper_arm, ('c', 't'), 'h', False, {'shoulder': SHOULDER, 'elbow': ELBOW},
     'ONE UPPER ARM in its sleeve, hanging straight down, round at the shoulder and at the elbow'),
    ('forearm', (784, ROW_B[0], 904, ROW_B[1]), BODY, (96, 288, 148, 378), draw_forearm, ('c', 't'), 'h', False, {'elbow': ELBOW, 'wrist': WRIST},
     'ONE FOREARM with its cuff, straight vertical, round at the elbow, no hand'),
    ('upperLeg', (920, ROW_B[0], 1060, ROW_B[1]), BODY, (130, 378, 202, 480), draw_upper_leg, ('c', 't'), 'h', False, {'hip': HIP, 'knee': KNEE},
     'ONE UPPER LEG (thigh) in its trouser, straight vertical, round at both ends'),
    ('lowerLeg', (1076, ROW_B[0], 1256, ROW_B[1]), BODY, (122, 444, 210, 546), draw_lower_leg, ('c', 'b'), 'h', False, {'knee': KNEE, 'sole': (166, 540)},
     'ONE LOWER LEG WITH ITS SHOE, front view, straight vertical, round at the knee, flat sole'),
]
for i, h in enumerate(HANDS):
    col, row = i % 2, i // 2
    x0, y0 = 1272 + col * 132, ROW_B[0] + row * 168
    SLOTS.append((f'hand_{h}', (x0, y0, x0 + 116, y0 + 152), BODY, (92, 350, 158, 428), globals()[f'draw_hand_{h}'], ('c', 't'), 'none', False, {'wrist': WRIST}, {
        'open': 'HAND, OPEN: fingers together pointing DOWN, wrist at the top',
        'fist': 'HAND, FIST: closed, knuckles DOWN, wrist at the top',
        'point': 'HAND, POINTING: a fist with the index finger stretched straight DOWN, wrist at the top',
        'grip': 'HAND, GRIPPING: fingers curled round an invisible rod, wrist at the top'}[h]))
EB = (EYE[0] - 50 * EYE_K, EYE[1] - 54 * EYE_K, EYE[0] + 50 * EYE_K, EYE[1] + 52 * EYE_K)
FE = FACE / EYE_K
SLOTS += [
    ('eyeWhite', (16, ROW_C[0], 196, ROW_C[1]), FE, EB, draw_eye_white, ('c', 'c'), 'none', False, {'centre': EYE},
     'ONE EYE WHITE: a large plain cream oval, nothing inside it'),
    ('lid', (212, ROW_C[0], 412, ROW_C[1]), FE, EB, draw_lid, ('c', 'c'), 'none', False, {'centre': EYE},
     'ONE UPPER EYELID: a plain flat block in exactly the skin colour of the head, a little larger than the eye white'),
    ('pupil', (428, ROW_C[0], 528, ROW_C[0] + 120), FE, (EYE[0] - 18, EYE[1] - 18, EYE[0] + 18, EYE[1] + 18), draw_pupil, ('c', 'c'), 'none', False, {'centre': EYE},
     'ONE PUPIL: a round COLOURED IRIS with a small black centre half as wide as the iris and one tiny white highlight; the coloured ring is clearly visible round the black'),
    ('brow', (544, ROW_C[0], 744, ROW_C[0] + 120), FE, (EYE[0] - 40 * EYE_K, BROW_Y - 16, EYE[0] + 40 * EYE_K, BROW_Y + 16), draw_brow, ('c', 'c'), 'none', False, {'centre': (EYE[0], BROW_Y)},
     'ONE EYEBROW in its neutral shape: a level stroke, slightly tapered, the thicker end on the right'),
]
for i, m in enumerate(MOUTHS):
    col, row = i % 4, i // 4
    x0, y0 = 760 + col * 194, ROW_C[0] + row * 136
    SLOTS.append((f'mouth_{m}', (x0, y0, x0 + 178, y0 + 120), FACE, (MOUTH_C[0] - 40, MOUTH_C[1] - 26, MOUTH_C[0] + 40, MOUTH_C[1] + 30), mouth(m), ('c', 'c'), 'none', False, {'centre': MOUTH_C}, {
        'closed': 'MOUTH, closed: a short level line', 'small': 'MOUTH, small open oval', 'wide': 'MOUTH, wide open with the tongue',
        'smile': 'MOUTH, smile: an upward curve', 'frown': 'MOUTH, frown: a downward curve', 'flat': 'MOUTH, flat: a long straight line',
        'o': 'MOUTH, a small round "o"', 'teeth': 'MOUTH, teeth set: both rows of teeth showing, clenched'}[m]))


def rig_pieces():
    """The rig pieces of the standard figure: which slot, which side, joint, parent and stacking order."""
    P = []

    def add(name, slot, pivot, z, parent=None, mirror=False, part='torso', view='front', **kw):
        px = 2 * CX - pivot[0] if mirror else pivot[0]
        P.append({'name': name, 'slot': slot, 'view': view, 'mirror': mirror, 'pivot': [px, pivot[1]], 'parent': parent, 'z': z, 'part': part, **kw})
    for s, m in (('L', False), ('R', True)):
        add(f'thigh{s}', 'upperLeg', HIP, 1.0, None, m, 'leg', 'both')
        add(f'shin{s}', 'lowerLeg', KNEE, 1.1, f'thigh{s}', m, 'leg', 'both')
    add('torso', 'torso', LEAN, 2.0)
    add('torsoBack', 'backTorso', LEAN, 2.0, view='back')
    for s, m in (('L', False), ('R', True)):
        for view, body, zo in (('front', 'torso', 0), ('back', 'torsoBack', -1.6)):
            v = '' if view == 'front' else 'B'
            add(f'arm{s}{v}', 'upperArm', SHOULDER, 3.0 + zo, body, m, 'arm', view)
            add(f'fore{s}{v}', 'forearm', ELBOW, 3.1 + zo, f'arm{s}{v}', m, 'arm', view)
            for h in HANDS:
                add(f'{h}{s}{v}', f'hand_{h}', WRIST, 8.0 if view == 'front' else 1.7, f'fore{s}{v}', m, 'hand', view, group=f'hand{s}', option=h)
        add(f'ear{s}', 'ear', (97, 151), 4.8, 'head', m, 'head')
    add('prop', 'prop', (122, 378), 7.9, 'foreL', False, 'hand', group='prop', option='held')
    add('head', 'head', NECK, 5.0, 'torso', part='head')
    for s, m in (('L', False), ('R', True)):
        add(f'white{s}', 'eyeWhite', EYE, 5.2, 'head', m, 'head')
        add(f'pupil{s}', 'pupil', EYE, 5.3, 'head', m, 'head')
        add(f'lid{s}', 'lid', (EYE[0], EYE[1] + 44), 5.4, 'head', m, 'head', group=None)
        add(f'brow{s}', 'brow', (EYE[0], BROW_Y), 5.7, 'head', m, 'head')
    for mth in MOUTHS:
        add(f'mouth_{mth}', f'mouth_{mth}', MOUTH_C, 5.25, 'head', part='head', group='mouth', option=mth)
    add('cap', 'cap', NECK, 5.6, 'head', part='head')
    add('headBack', 'backHead', NECK, 5.0, 'torsoBack', part='head', view='back')
    for p in P:
        if p.get('group') is None:
            p.pop('group', None)
    return P


def build_human(ver='human-v2'):
    sheet = Image.new('RGBA', SHEET, KEY + (255,))
    slots = {}
    for name, box, scale, bounds, draw, anchor, fit, optional, pivots, words in SLOTS:
        valign = 'c'
        if scale == 'HEAD':
            scale, valign = HEADROW[ver]
        d = D(bounds, scale); draw(d); im = d.done()
        a = np.asarray(im)[..., 3]
        ys, xs = np.nonzero(a > 8)
        bx0, by0, bx1, by1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        im = im.crop((bx0, by0, bx1, by1))
        w, h = im.size
        ox = box[0] + (box[2] - box[0] - w) // 2
        oy = box[3] - 26 - h if valign == 'b' else box[1] + (box[3] - box[1] - h) // 2   # 'b': all the spare height is headroom
        assert w <= box[2] - box[0] - 16 and h <= box[3] - box[1] - 16, (name, w, h, box)
        sheet.alpha_composite(im, (ox, oy))
        crect = [bounds[0] + bx0 / scale, bounds[1] + by0 / scale, w / scale, h / scale]  # the mannequin piece on the canvas
        slots[name] = {
            'box': list(box), 'scale': scale, 'tpl': [ox, oy, ox + w, oy + h], 'canvas': [round(v, 2) for v in crect],
            'anchor': list(anchor), 'fit': fit, 'optional': optional,
            'pivots': {k: [round(ox + (v[0] - crect[0]) * scale, 1), round(oy + (v[1] - crect[1]) * scale, 1)] for k, v in pivots.items()},
            'words': words,
        }
    sheet = sheet.convert('RGB')
    head_h = 236 - TOP
    T = {
        'name': ver, 'sheet': list(SHEET), 'key': '#FF00FF', 'canvas': list(CANVAS), 'groundY': GROUND, 'centerX': CX, 'height': GROUND - TOP,
        'mirror_rule': 'pieces with mirror = true are the screen-right copy: picture flipped left-right, rect and pivot mirrored about centerX',
        'tolerance': {'centre_px': 28, 'size_lo': 0.75, 'size_hi': 1.3, 'free_slots': ['cap', 'backHead', 'prop', 'torso', 'backTorso', 'head'], 'free_size_hi': 1.6, 'edge_px': 2,
                      # per slot: size False = any size (a prop is not a rod); h = [lo, hi] replaces the height range
                      'slot': {'prop': {'size': False, 'grip': True}, 'brow': {'h': [0.35, 2.4]}, 'cap': {'h': [0.75, 2.6]}, 'backHead': {'h': [0.75, 2.2]}, 'pupil': {'w': [0.6, 1.3], 'h': [0.6, 1.3]}}},
        'proportions': {
            'figure_height_px': GROUND - TOP, 'heads_tall': round((GROUND - TOP) / head_h, 2),
            'head_with_hair_frac': round(head_h / 520, 3), 'head_width_frac': round(204 / 520, 3),
            'torso_frac': round((HIP[1] - NECK[1]) / 520, 3), 'leg_frac': round((GROUND - HIP[1]) / 520, 3),
            'arm_length_frac': round((412 - SHOULDER[1] + 22) / 520, 3), 'shoulder_width_frac': round((2 * (CX - SHOULDER[0]) + 44) / 520, 3),
            'eye_height_of_head': round(EYE_H / 184, 3), 'eye_width_of_head': round(EYE_W / 204, 3), 'eye_centre_from_head_top': round((EYE[1] - 52) / 184, 3),
            'eye_gap_px': round(2 * (CX - EYE[0]) - EYE_W, 1), 'iris_of_eye_width': round(IRIS_D / EYE_W, 3),
            'mouth_centre_from_head_top': round((MOUTH_C[1] - 52) / 184, 3), 'hand_width_of_head': round(46 / 204, 3),
        },
        'joints': {'neck': list(NECK), 'shoulder': list(SHOULDER), 'elbow': list(ELBOW), 'wrist': list(WRIST), 'hip': list(HIP), 'knee': list(KNEE), 'lean': list(LEAN), 'eye': list(EYE), 'brow': [EYE[0], BROW_Y], 'mouth': list(MOUTH_C)},
        'face': {'eye': [EYE_W, EYE_H], 'lidTravel': EYE_H + 6, 'pupilTravel': [19, 17], 'irisD': IRIS_D, 'forehead': list(FOREHEAD),
                 'browH': [BROW_H['thin'], BROW_H['medium'], BROW_H['thick']], 'browTravel': 15},
        'groups': {'mouth': {'default': 'closed', 'options': MOUTHS}, 'handL': {'default': 'open', 'options': HANDS}, 'handR': {'default': 'open', 'options': HANDS},
                   'prop': {'default': 'none', 'options': ['none', 'held']}},
        'slots': slots, 'pieces': rig_pieces(),
    }
    return sheet, T


def guide(sheet, T):
    g = sheet.copy(); d = ImageDraw.Draw(g)
    for name, s in T['slots'].items():
        d.rectangle(s['box'], outline=(255, 255, 255), width=2)
        C.text(d, (s['box'][0] + 5, s['box'][1] + 3), name + (' (optional)' if s['optional'] else ''), 15, (255, 255, 255))
        for k, (x, y) in s['pivots'].items():
            d.ellipse((x - 5, y - 5, x + 5, y + 5), outline=(255, 230, 0), width=2)
            d.line((x - 8, y, x + 8, y), fill=(255, 230, 0)); d.line((x, y - 8, x, y + 8), fill=(255, 230, 0))
    return g


def assembled(sheet, T):
    rgb = np.asarray(sheet).astype(float)
    get = tpl.sheet_getter(T, rgb)
    ims = [tpl.assemble(T, get, 'front'), tpl.assemble(T, get, 'front', {'mouth': 'smile', 'handL': 'point', 'handR': 'fist', 'prop': 'none'}), tpl.assemble(T, get, 'back')]
    for im in ims:
        d = ImageDraw.Draw(im)
        d.line((0, GROUND * 2, im.size[0], GROUND * 2), fill=(150, 60, 60), width=2)
        d.line((0, TOP * 2, im.size[0], TOP * 2), fill=(150, 60, 60), width=1)
        for i in range(1, 3):  # head units
            y = (TOP + i * 216) * 2
            d.line((0, y, 60, y), fill=(60, 60, 150), width=2)
    return C.hstack([im.convert('RGB') for im in ims], gap=0)


def build_extra(sheet, T):
    """extra-v1: three whole figures for a single-picture extra: front calm, front startled, back."""
    rgb = np.asarray(sheet).astype(float)
    get = tpl.sheet_getter(T, rgb)
    S = 1.5
    out = Image.new('RGBA', SHEET, KEY + (255,))
    slots = {}
    views = [('front', {'prop': 'none'}, 'front'), ('startled', {'mouth': 'o', 'prop': 'none'}, 'front'), ('back', {'prop': 'none'}, 'back')]
    words = {'front': 'THE WHOLE FIGURE, front view, standing calm, arms hanging at the sides, default expression',
             'startled': 'THE SAME FIGURE, front view, same size and stance, STARTLED: eyes wide, brows up, mouth a small round "o", both hands lifted a little, open',
             'back': 'THE SAME FIGURE seen from BEHIND, same size and stance'}
    for i, (name, pick, view) in enumerate(views):
        box = (16 + i * 506, 16, 16 + i * 506 + 490, 1008)
        fig = tpl.assemble(T, get, view, pick, zoom=3, bg=KEY)
        fig = fig.resize((round(CANVAS[0] * S), round(CANVAS[1] * S)), Image.LANCZOS).convert('RGB')
        a = C.dist(np.asarray(fig).astype(float), np.array(KEY, float)) > 60
        ys, xs = np.nonzero(a)
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        crop = fig.crop((x0, y0, x1, y1)); w, h = crop.size
        ox = box[0] + (box[2] - box[0] - w) // 2; oy = box[1] + (box[3] - box[1] - h) // 2
        out.paste(crop, (ox, oy))
        eyes = [[round(ox + (ex - x0 / S) * S, 1), round(oy + (EYE[1] - y0 / S) * S, 1)] for ex in (EYE[0], 2 * CX - EYE[0])]
        slots[name] = {'box': list(box), 'scale': S, 'tpl': [ox, oy, ox + w, oy + h], 'canvas': [round(x0 / S, 2), round(y0 / S, 2), round(w / S, 2), round(h / S, 2)],
                       'anchor': ['c', 'b'], 'fit': 'h', 'optional': name != 'front', 'pivots': {} if view == 'back' else {'eyeL': eyes[0], 'eyeR': eyes[1]}, 'words': words[name]}
    X = {'name': 'extra-v1', 'sheet': list(SHEET), 'key': '#FF00FF', 'canvas': list(CANVAS), 'groundY': GROUND, 'centerX': CX, 'height': GROUND - TOP,
         'tolerance': {'centre_px': 40, 'size_lo': 0.75, 'size_hi': 1.3, 'free_slots': [], 'free_size_hi': 1.6, 'edge_px': 2},
         'face': {'eyeR': [round(EYE_W / 2 * S, 1), round(EYE_H / 2 * S, 1)]},
         'groups': {}, 'slots': slots,
         'pieces': [{'name': n, 'slot': n, 'view': 'back' if n == 'back' else 'front', 'mirror': False, 'pivot': [CX, GROUND - 52], 'parent': None, 'z': 1, 'part': 'torso',
                     **({'group': 'pic', 'option': n} if n != 'back' else {})} for n in slots]}
    X['groups'] = {'pic': {'default': 'front', 'options': ['front', 'startled']}}
    return out.convert('RGB'), X


def write_ts(T, const, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(f"// GENERATED by tools/art/template/make_template.py from {T['name']}.json. Do not edit: change the script and run it.\n")
        f.write("import type {Template} from './types';\n")
        f.write(f'export const {const}: Template = {json.dumps(T, indent=1)};\n')


def main():
    src = os.path.join(C.ROOT, 'src', 'puppet', 'template')
    for ver in ('human-v2', 'human-v1'):   # v1 last: extra-v1 is still built from it
        sheet, T = build_human(ver)
        sheet.save(os.path.join(HERE, ver + '.png'))
        json.dump(T, open(os.path.join(HERE, ver + '.json'), 'w'), indent=1)
        guide(sheet, T).save(os.path.join(HERE, ver + '-guide.png'))
        assembled(sheet, T).save(os.path.join(HERE, ver + '-assembled.png'))
        write_ts(T, ver.upper().replace('-', '_'), os.path.join(src, ver + '.ts'))
    ex, X = build_extra(sheet, T)
    ex.save(os.path.join(HERE, 'extra-v1.png'))
    json.dump(X, open(os.path.join(HERE, 'extra-v1.json'), 'w'), indent=1)
    write_ts(X, 'EXTRA_V1', os.path.join(src, 'extra-v1.ts'))
    p = T['proportions']
    print(f"human-v1 and human-v2: {len(T['slots'])} slots, {len(T['pieces'])} rig pieces, {p['heads_tall']} heads tall "
          f"(head {p['head_with_hair_frac']}, torso {p['torso_frac']}, legs {p['leg_frac']} of the height)")
    print('wrote human-v{1,2}.png/.json, -guide.png, -assembled.png, extra-v1.png/.json, src/puppet/template/{human,extra}-v1.ts')


if __name__ == '__main__':
    main()
