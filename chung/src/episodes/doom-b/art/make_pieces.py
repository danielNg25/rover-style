"""Code-made companion pieces for boy Victor (no image generation): run from rover-lab/.
  vic-hair.png   the hair of vic-head.png alone (same size, same place): drawn OVER the eyelids so a half-shut lid
                 never paints skin on the fringe.
  vic-lower.png  the shawl continued from the bust's flat bottom edge to the ground (the sheet gives waist-up only),
                 flat polygons in the bust's own colours, folds continued from the bust's bottom row."""
from PIL import Image, ImageDraw
import numpy as np
D = 'public/doom-b/victor/'
hd = np.array(Image.open(D + 'vic-head.png').convert('RGBA')).astype(int)
rgb = hd[..., :3]
def dist(c): return np.sqrt(((rgb - np.array(c)) ** 2).sum(-1))
hair = np.minimum(dist((58, 32, 18)), dist((130, 74, 42)))
other = np.minimum.reduce([dist((250, 178, 122)), dist((250, 240, 216)), dist((235, 146, 98)), dist((240, 125, 105))])
a = np.where(hair < other, hd[..., 3], 0)
out = hd.copy(); out[..., 3] = a
Image.fromarray(out.astype('uint8'), 'RGBA').save(D + 'vic-hair.png')

bust = Image.open(D + 'vic-bust.png').convert('RGBA')
def px(x, y): return bust.getpixel((x, y))[:3]
MAIN, DARK, PATCH_L, PATCH_B = (69, 88, 44), (47, 63, 30), (133, 141, 59), (138, 118, 55)  # medians measured on vic-bust.png
print('colours', MAIN, DARK, PATCH_L, PATCH_B)
S = 4; W, H = 900, 480; OX = 123  # bust x0 on the rig canvas; 480 px gives head : body = 1 : 1.3 (art/decisions.md)
K = H / 660.0
im = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
P = lambda pts, c: d.polygon([(x * S, y * K * S) for x, y in pts], fill=c + (255,))
# main cloth: widens to the ground, ragged hem, one corner trailing to screen right
P([(OX + 13, 0), (112, 250), (84, 520), (70, 640), (150, 650), (190, 632), (250, 652), (330, 640), (380, 654), (470, 642),
   (540, 655), (640, 644), (720, 654), (800, 646), (878, 652), (850, 610), (800, 520), (774, 300), (OX + 635, 0)], MAIN)
# folds continued from the bust's bottom row (dark bands at bust x 13-63, 292-320, 419-478)
P([(OX + 13, 0), (OX + 63, 0), (150, 300), (128, 600), (150, 650), (70, 640), (84, 520), (112, 250)], DARK)
P([(OX + 292, 0), (OX + 320, 0), (462, 400), (470, 642), (380, 654), (400, 400)], DARK)
P([(OX + 419, 0), (OX + 478, 0), (650, 380), (720, 654), (640, 644), (590, 380)], DARK)
P([(774, 300), (800, 520), (850, 610), (878, 652), (800, 646), (770, 520)], DARK)
# two square patches with small stitch tabs, like the bust's
def patch(cx, cy, s, rot, c):
    import math
    r = math.radians(rot); co, si = math.cos(r), math.sin(r)
    T = lambda x, y: (cx + x * co - y * si, cy / K + (x * si + y * co) / K)
    P([T(-s, -s), T(s, -s), T(s, s), T(-s, s)], c)
    for tx, ty in [(-s * .4, -s * 1.1), (s * 1.1, s * .3)]:
        P([T(tx - 7, ty - 7), T(tx + 7, ty - 7), T(tx + 7, ty + 7), T(tx - 7, ty + 7)], c)
patch(265, 230, 50, -10, PATCH_L)
patch(700, 330, 42, 8, PATCH_B)
im = im.resize((W, H), Image.LANCZOS); im.save(D + 'vic-lower.png')

# THE MOTHER'S SHADOW: both silhouettes flattened to exactly one tone, the arms scaled and turned into the hold
C = 'public/doom-b/camp/'; TONE = (47, 43, 58)
def flat(im):
    a = np.array(im.convert('RGBA')); a[..., 0], a[..., 1], a[..., 2] = TONE; return Image.fromarray(a, 'RGBA')
flat(Image.open(C + 'camp-mother-body.png')).save(C + 'camp-mother-body-flat.png')
arms = flat(Image.open(C + 'camp-mother-arms.png'))
arms = arms.resize((600, int(arms.height * 600 / arms.width)), Image.LANCZOS).rotate(-26, expand=True, resample=Image.BICUBIC)
arms = arms.resize((arms.width // 2, arms.height // 2), Image.LANCZOS)
a = np.array(arms); a[..., 0], a[..., 1], a[..., 2] = TONE; arms = Image.fromarray(a, 'RGBA')
print('arms-set', arms.size); arms.save(C + 'camp-mother-arms-set.png')
