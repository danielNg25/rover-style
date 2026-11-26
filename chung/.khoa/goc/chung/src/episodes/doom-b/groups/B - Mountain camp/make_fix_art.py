"""Code-made companion pieces for the group B fix pass (no image generation). Run from rover-lab/:
     python3 "src/episodes/doom-b/groups/B - Mountain camp/make_fix_art.py"
  public/doom-b/victor/
    vic-light-a.png, vic-light-b.png   firelight on the head: the skin of vic-head.png left of a curved terminator,
                                       recoloured to a flat orange-warm tone (two values, swapped on twos)
    vic-shade.png                      the far (screen-right) edge of the face one step darker and cooler
    vic-bustlight-a.png, -b.png        the same light on the screen-left shoulder of vic-bust.png
    vic-lash-l.png, vic-lash-r.png     dark lash arc along the lower rim of the lid (child of the lid piece)
    vic-arms-up.png                    two forearms rising out of the shawl front (the cupped hands sit on top)
  public/doom-b/camp/
    camp-victor-back-head.png          the head of camp-victor-back.png alone (same canvas)
    camp-victor-back-body.png          the shawl alone, with the hood's back rim and a sliver of neck under the head
"""
from PIL import Image, ImageDraw
import numpy as np

V = 'public/doom-b/victor/'
C = 'public/doom-b/camp/'
SKIN, EAR, WHITE, NOSE, HAIR, HAIR2 = (250, 178, 122), (232, 142, 98), (250, 240, 216), (240, 125, 105), (56, 30, 16), (130, 74, 42)


def nearest(rgb, pal):
    d = np.stack([np.sqrt(((rgb - np.array(c)) ** 2).sum(-1)) for c in pal], -1)
    return d.argmin(-1)


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------------------------------------- head light
hd = np.array(Image.open(V + 'vic-head.png').convert('RGBA')).astype(int)
H, W = hd.shape[:2]
cls = nearest(hd[..., :3], [SKIN, EAR, WHITE, NOSE, HAIR, HAIR2])
yy, xx = np.mgrid[0:H, 0:W]
skin = ((cls == 0) | (cls == 1)) & (hd[..., 3] > 200)
# terminator: a narrow band beside the eye, widening over the whole cheek below it, closing toward the chin
xlim = 232 + 92 * smooth(455, 545, yy) - 36 * smooth(600, 665, yy)
for name, warm, warm_ear in (('a', (255, 164, 92), (238, 122, 66)), ('b', (255, 175, 104), (241, 132, 74))):
    out = np.zeros_like(hd)
    m = skin & (xx < xlim) & (yy < 632)          # the neck stays in the chin's shade
    out[m & (cls == 0)] = warm + (255,)
    out[m & (cls == 1)] = warm_ear + (255,)
    Image.fromarray(out.astype('uint8'), 'RGBA').save(V + f'vic-light-{name}.png')
# far side: one step darker and cooler along the screen-right edge of the face and the right ear
out = np.zeros_like(hd)
xr = 520 - 60 * smooth(455, 560, yy) + 70 * smooth(590, 650, yy)
m = skin & (xx > xr) & (yy < 632)
out[m & (cls == 0)] = (229, 158, 124, 255)
out[m & (cls == 1)] = (208, 126, 98, 255)
Image.fromarray(out.astype('uint8'), 'RGBA').save(V + 'vic-shade.png')

# ---------------------------------------------------------------------------------------------- bust light
bu = np.array(Image.open(V + 'vic-bust.png').convert('RGBA')).astype(int)
BH, BW = bu.shape[:2]
alpha = bu[..., 3] > 200
bcls = nearest(bu[..., :3], [(66, 86, 42), (46, 62, 28), (131, 139, 58), (138, 118, 55), SKIN])
yb, xb = np.mgrid[0:BH, 0:BW]
left = np.where(alpha.any(1), alpha.argmax(1), 9999)[:, None]
band = alpha & (xb < left + 34 - 10 * smooth(300, 451, yb)) & (bcls != 4)
for name, k in (('a', 1.0), ('b', 0.9)):
    out = np.zeros_like(bu)
    lit = {0: (118, 122, 50), 1: (88, 92, 38), 2: (176, 168, 70), 3: (178, 140, 60)}
    for i, c in lit.items():
        base = [(66, 86, 42), (46, 62, 28), (131, 139, 58), (138, 118, 55)][i]
        col = tuple(int(base[j] + (c[j] - base[j]) * k) for j in range(3))
        out[band & (bcls == i)] = col + (255,)
    Image.fromarray(out.astype('uint8'), 'RGBA').save(V + f'vic-bustlight-{name}.png')

# ---------------------------------------------------------------------------------------------- lashes
for s in 'lr':
    lid = np.array(Image.open(V + f'vic-lid-{s}.png').convert('RGBA')).astype(int)
    a = lid[..., 3] > 128
    up = np.zeros_like(a); up[:-13] = a[13:]            # the lid shifted up 13 px
    lash = a & ~up
    lash[: int(a.shape[0] * 0.62)] = False              # only the lower rim
    out = np.zeros_like(lid)
    out[lash] = (58, 32, 18, 255)
    Image.fromarray(out.astype('uint8'), 'RGBA').save(V + f'vic-lash-{s}.png')

# ---------------------------------------------------------------------------------------------- forearms
S = 4
AW, AH = 420, 330
im = Image.new('RGBA', (AW * S, AH * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
P = lambda pts, c: d.polygon([(x * S, y * S) for x, y in pts], fill=c + (255,))
SK, SK2, G1, G2 = (250, 178, 122), (232, 142, 98), (69, 88, 44), (47, 63, 30)
# two forearms: wrists together under the hands (top centre), elbows apart at the bottom
P([(120, 0), (200, 0), (176, 330), (60, 330)], SK)
P([(220, 0), (300, 0), (360, 330), (244, 330)], SK)
P([(120, 0), (142, 0), (92, 330), (60, 330)], SK2)        # under-side tone, screen left arm
P([(278, 0), (300, 0), (360, 330), (328, 330)], SK2)
# the shawl front falls over the forearms: ragged cuffs
P([(20, 330), (36, 196), (96, 170), (150, 190), (196, 176), (200, 330)], G1)
P([(220, 330), (224, 180), (270, 192), (330, 168), (386, 200), (400, 330)], G1)
P([(20, 330), (36, 196), (70, 184), (62, 330)], G2)
P([(360, 330), (350, 186), (386, 200), (400, 330)], G2)
im.resize((AW, AH), Image.LANCZOS).save(V + 'vic-arms-up.png')

# ---------------------------------------------------------------------------------------------- back view split
bk = np.array(Image.open(C + 'camp-victor-back.png').convert('RGBA')).astype(int)
KH, KW = bk.shape[:2]
kc = nearest(bk[..., :3], [(52, 26, 12), (130, 74, 42), SKIN, EAR, (58, 82, 34), (46, 62, 26), (136, 150, 56), (140, 120, 56)])
ky, kx = np.mgrid[0:KH, 0:KW]
is_head = (kc < 4) & (ky < 330) & (bk[..., 3] > 40)
# the ochre patch on the shawl is close to the hair highlight: anything below the collar line is shawl
head = bk.copy(); head[~is_head] = 0
Image.fromarray(head.astype('uint8'), 'RGBA').save(C + 'camp-victor-back-head.png')
body = Image.new('RGBA', (KW * S, KH * S), (0, 0, 0, 0)); d = ImageDraw.Draw(body)
P = lambda pts, c: d.polygon([(x * S, y * S) for x, y in pts], fill=c + (255,))
P([(150, 236), (262, 236), (268, 310), (144, 310)], (236, 160, 110))         # neck, in the head's shadow
d.ellipse([110 * S, 268 * S, 310 * S, 344 * S], fill=(40, 56, 24, 255))      # the hood's back rim, dark inside
body = np.array(body.resize((KW, KH), Image.LANCZOS)).astype(int)
near = is_head.copy()
for dy in range(-4, 5):
    for dx in range(-4, 5):
        near |= np.roll(np.roll(is_head, dy, 0), dx, 1)
shawl = bk.copy(); shawl[near & ((kc < 4) | (bk[..., 3] < 250))] = 0; shawl[is_head] = 0
aa = shawl[..., 3:4] / 255.0
comp = body.copy()
comp[..., :3] = (shawl[..., :3] * aa + body[..., :3] * (1 - aa)).astype(int)
comp[..., 3] = np.maximum(shawl[..., 3], body[..., 3])
Image.fromarray(comp.astype('uint8'), 'RGBA').save(C + 'camp-victor-back-body.png')
print('ok')
