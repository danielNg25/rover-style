"""Group A art prep (run once; outputs are committed under public/doom-b/A).
 - every ruler piece the front rig uses: magenta/soft edge fringe removed (edge colours replaced by the nearest
   interior colour, also under the transparent area so linear filtering cannot pull a halo), upscaled K times with a
   steepened alpha so the silhouette stays crisp in the S4 close;
 - back view split into cloak + hood so the hood can turn (S5);
 - the queen picture reduced to about twice its displayed size (the 1491 px original was minified 10x and went soft).
usage: python prep_art.py <repo>/public """
import sys, os, cv2, numpy as np
pub = sys.argv[1]
out = os.path.join(pub, 'doom-b', 'A')

def clean(img, erode=3):
    rgb, a = img[..., :3].copy(), img[..., 3]
    core = (a > 245).astype(np.uint8)
    core = cv2.erode(core, np.ones((erode * 2 + 1,) * 2, np.uint8))
    if core.sum() < 20: core = (a > 200).astype(np.uint8)
    # nearest core pixel for every pixel
    _, lab = cv2.distanceTransformWithLabels(1 - core, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(core)
    lut = np.zeros((lab.max() + 1, 3), np.uint8)
    lut[lab[ys, xs]] = rgb[ys, xs]
    fill = lut[lab]
    m = core.astype(bool)[..., None]
    return np.where(m, rgb, fill), a

def up(rgb, a, k, steep=2.2):
    h, w = a.shape
    size = (int(round(w * k)), int(round(h * k)))
    interp = cv2.INTER_CUBIC if k > 1 else cv2.INTER_AREA
    rgb2 = cv2.resize(rgb, size, interpolation=interp)
    a2 = cv2.resize(a, size, interpolation=interp).astype(np.float32) / 255
    if k > 1:
        blur = cv2.GaussianBlur(rgb2, (0, 0), 1.2)
        rgb2 = cv2.addWeighted(rgb2, 1.6, blur, -0.6, 0)
        a2 = cv2.GaussianBlur(a2, (0, 0), k * 0.45)
        a2 = np.clip((a2 - 0.5) * steep * k / 2 + 0.5, 0, 1)
    return np.dstack([rgb2, (a2 * 255 + 0.5).astype(np.uint8)])

def load(p):
    im = cv2.imread(os.path.join(pub, p), cv2.IMREAD_UNCHANGED)
    assert im is not None and im.shape[2] == 4, p
    return im

K = 2
for name in ['p-1', 'p-3', 'p-4', 'p-5', 'p-6', 'p-7', 'torso2', 'hood', 'mask', 'plate', 'slit', 'pupil', 'brow', 'nose', 'mouth', 'open-down']:
    rgb, a = clean(load(f'doom/{name}.png'), erode=1 if name in ('mouth', 'brow', 'pupil') else 3)
    cv2.imwrite(os.path.join(out, 'doom', name + '.png'), up(rgb, a, K))

# back view: cloak + hood. The hood is everything above the rim curve; the cloak keeps a filled neck under it.
b = load('doom/back.png'); rgb, a = clean(b); H, W = a.shape
cut = np.loadtxt(os.path.join(os.path.dirname(__file__), 'back_rim.txt')) if os.path.exists(os.path.join(os.path.dirname(__file__), 'back_rim.txt')) else None
if cut is not None:
    xs = np.arange(W); rim = np.interp(xs, cut[:, 0], cut[:, 1])
    yy = np.arange(H)[:, None]
    hood_a = np.where(yy < rim[None, :], a, 0).astype(np.uint8)
    cloak_a = np.where(yy > rim[None, :] - 330, a, 0).astype(np.uint8)
    cv2.imwrite(os.path.join(out, 'doom', 'back-hood.png'), up(rgb, hood_a, 0.5))
    cv2.imwrite(os.path.join(out, 'doom', 'back-cloak.png'), up(rgb, cloak_a, 0.5))
cv2.imwrite(os.path.join(out, 'doom', 'back.png'), up(rgb, a, 0.5))

q = load('queen/q-1.png'); rgb, a = clean(q)
cv2.imwrite(os.path.join(out, 'queen', 'q-1.png'), up(rgb, a, 0.36))
print('ok')
