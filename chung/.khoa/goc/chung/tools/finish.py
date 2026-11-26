"""finish.py - two measures of FINISH that the blend-test judges keep naming, computable on any frame:
  shadow = how dark the ground gets in shadow: 5th percentile / median of luminance over ground-coloured pixels in the
           bottom band (1 = no shadow at all; lower = deeper shadows)
  mottle = soft tone variation inside flat areas: std of (slightly blurred - heavily blurred) luminance away from edges
           (0 = dead-flat vector fills; higher = paper-like mottling and inner shading)
usage: finish.py IMAGE [IMAGE ...]"""
import sys, cv2, numpy as np
for f in sys.argv[1:]:
    im = cv2.resize(cv2.imread(f), (1280, 720)); lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
    g = lab[520:, :, :]; a0, b0 = np.median(g[..., 1]), np.median(g[..., 2]); sel = np.hypot(g[..., 1] - a0, g[..., 2] - b0) < 7; L = g[..., 0][sel]
    shadow = np.percentile(L, 5) / np.median(L)
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32); edge = cv2.dilate(cv2.Canny(gray.astype(np.uint8), 30, 90), np.ones((9, 9), np.uint8)) > 0
    band = cv2.GaussianBlur(gray, (0, 0), 2) - cv2.GaussianBlur(gray, (0, 0), 14); mottle = band[~edge].std()
    print(f'{f.split("/")[-1]:22s} shadow {shadow:.2f}   mottle {mottle:.2f}   ground share used {sel.mean():.2f}')
