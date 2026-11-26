#!/usr/bin/env python3
"""So MÀU của ảnh dựng ra với BỘ KHUNG MẪU cùng loại cảnh của video gốc. Kết quả để THAM KHẢO, không phải cổng.

Daniel 25/11/2026 về cảnh thử khe suối: "các màu được chọn bị chói quá (chỗ lá cây, màu đất)"; đo ra đúng vậy và ông xác nhận
"đúng rồi là lỗi này". Hai nguyên nhân: agent tự chọn màu vật liệu quá nhạt, quá tươi; và đèn đẩy mặt nhận sáng nhạt thêm
(cát tô #e2c58c ra khung thành #f8d69f). Vì vậy màu đo trên ẢNH DỰNG RA, không tin mã màu trong code.

Sửa 26/11/2026 (Daniel: "cảnh mẫu là để nhìn vào học hỏi chứ ko phải là tái sử dụng lại như vậy"): không còn so với MỘT khung khuôn và
không còn dòng LOI. So với KHOẢNG (nhỏ nhất tới lớn nhất) của NHIỀU khung mẫu cùng loại cảnh; nằm ngoài khoảng thì in CANH để người dựng
và người rà xem lại màu vật liệu và đèn. Con số không phải đích: không lọc màu ảnh, không bỏ món, không thêm món để vào khoảng.

  python3 tools/do_mau_khuon.py <ảnh>                                        in số đo theo vai của một ảnh
  python3 tools/do_mau_khuon.py <ảnh của mình> <khung mẫu> [<khung mẫu> …]   so với khoảng của các khung mẫu (nên từ 3 khung cùng loại cảnh)

Vai (tách bằng sắc màu và vị trí, chỉ gần đúng): lá cây cỏ (sắc xanh lá), mặt đất hoặc sàn (phần màu ấm ở đáy khung), trời (sắc lam ở
đỉnh khung), nước (sắc ngọc ở nửa dưới), đỏ cam rực. L = độ sáng (0 đen, 1 trắng); C = độ đậm màu (dưới 0,03 gần xám, trên 0,12 là rực).
Luôn thoát 0.
"""
import sys
import numpy as np
from PIL import Image

VAI = ['lá cây, cỏ', 'mặt đất, sàn (đáy khung)', 'trời', 'nước', 'đỏ cam rực']
NOI = 0.04       # nới khoảng độ sáng một chút: bộ mẫu chỉ có vài khung


def oklab(a):
    c = a.astype(np.float32) / 255; c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    l = 0.4122214708 * c[..., 0] + 0.5363325363 * c[..., 1] + 0.0514459929 * c[..., 2]
    m = 0.2119034982 * c[..., 0] + 0.6806995451 * c[..., 1] + 0.1073969566 * c[..., 2]
    s = 0.0883024619 * c[..., 0] + 0.2817188376 * c[..., 1] + 0.6299787005 * c[..., 2]
    l, m, s = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    return np.stack([0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s], -1)


def do(p):
    a = np.asarray(Image.open(p).convert('RGB').resize((960, 540), Image.LANCZOS)); lab = oklab(a); L = lab[..., 0]; C = np.hypot(lab[..., 1], lab[..., 2])
    h = (np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) + 360) % 360; yy = np.mgrid[0:540, 0:960][0]
    xanh = (h > 115) & (h < 165) & (C > 0.04)
    mat = {VAI[0]: xanh, VAI[1]: (yy > 380) & ~xanh & ~((h > 170) & (h < 260)) & (C > 0.03), VAI[2]: (yy < 150) & (h > 170) & (h < 260),
           VAI[3]: (yy > 300) & (h > 170) & (h < 230) & (C > 0.03), VAI[4]: ((h < 50) | (h > 340)) & (C > 0.1)}
    ra = {'ca': dict(L=float(L.mean()), C=float(C.mean()), sang=float((L > 0.85).mean()), ruc=float((C > 0.12).mean()))}
    for k, m in mat.items():
        ra[k] = None if m.sum() < 400 else dict(pt=float(m.mean()), L=float(np.median(L[m])), C=float(np.median(C[m])), mau='#%02x%02x%02x' % tuple(int(x) for x in np.median(a[m], axis=0)), L90=float(np.percentile(L[m], 90)))
    return ra


def dong(ten, ai, d):
    if d is None: return f'{ten:26}{ai:7}  (không có)'
    return f"{ten:26}{ai:7}{d['pt'] * 100:7.1f} %   L {d['L']:.2f}   C {d['C']:.3f}   màu giữa {d['mau']}   10 % sáng nhất L {d['L90']:.2f}"


def khoang(K, k, truong):
    """(nhỏ nhất, lớn nhất) của một số đo trên các khung mẫu có vai đó; None khi không khung nào có"""
    v = [d[k][truong] for d in K if d[k]]
    return (min(v), max(v)) if v else None


def main(a):
    if not a: sys.exit(__doc__)
    A = do(a[0]); K = [do(p) for p in a[1:]]; ai = 'mình' if K else 'ảnh'
    c = A['ca']; print(f"{'cả khung':26}{ai:7}          L {c['L']:.2f}   C {c['C']:.3f}   phần rất sáng (L > 0,85) {c['sang'] * 100:.0f} %   phần rực (C > 0,12) {c['ruc'] * 100:.0f} %")
    if K:
        ca = {t: khoang(K, 'ca', t) for t in ('L', 'C', 'sang', 'ruc')}
        print(f"{'cả khung':26}{'bộ mẫu':7}          L {ca['L'][0]:.2f}–{ca['L'][1]:.2f}   C {ca['C'][0]:.3f}–{ca['C'][1]:.3f}   phần rất sáng {ca['sang'][0] * 100:.0f}–{ca['sang'][1] * 100:.0f} %   phần rực {ca['ruc'][0] * 100:.0f}–{ca['ruc'][1] * 100:.0f} %   ({len(K)} khung)")
    for k in VAI:
        print(dong(k, ai, A[k]))
        if K:
            l, cc = khoang(K, k, 'L'), khoang(K, k, 'C')
            print(f"{k:26}{'bộ mẫu':7}" + (f"            L {l[0]:.2f}–{l[1]:.2f}   C {cc[0]:.3f}–{cc[1]:.3f}   ({sum(1 for d in K if d[k])}/{len(K)} khung có vai này)" if l else '  (không khung nào có)'))
    # Bảng màu của kênh gốc (đo 573 khung, 26/11/2026): màu ở nửa trái của ô chọn màu, góc sáng-rực gần như trống, khung nào cũng có vùng gần xám.
    a = np.asarray(Image.open(a[0]).convert('RGB').resize((320, 180))).astype(np.float32) / 255; mx, mn = a.max(-1), a.min(-1); dd = mx - mn; S = np.where(mx > 0, dd / np.maximum(mx, 1e-6), 0)
    H = np.where(mx == a[..., 0], ((a[..., 1] - a[..., 2]) / np.maximum(dd, 1e-6)) % 6, np.where(mx == a[..., 1], (a[..., 2] - a[..., 0]) / np.maximum(dd, 1e-6) + 2, (a[..., 0] - a[..., 1]) / np.maximum(dd, 1e-6) + 4)) * 60
    am, xam, ruc, goc = float(((S > .25) & ((H < 70) | (H >= 345))).mean()), float((S < .15).mean()), float((S > .6).mean()), float(((S > .7) & (mx > .7)).mean())
    print(f"{'bảng màu':26}{ai:7}  màu ấm rõ {am * 100:.0f} %   gần xám {xam * 100:.0f} %   vùng rực (S > 0,6) {ruc * 100:.0f} %   góc sáng-rực {goc * 100:.1f} %   (video gốc, mức giữa: 24 %, 15 %, dưới 10 %, 0,7 %)")
    canh = []
    if am > 0.85: canh.append(f"CANH bang-mau  cả khung ngả ấm ({am * 100:.0f} % là màu ấm rõ): xem đèn có phải đèn chiều muộn / đèn vàng không, mặt lớn có quá vàng cam không")
    if xam < 0.05: canh.append(f"CANH bang-mau  gần như không có vùng xám hay trầm ({xam * 100:.0f} %): cho một mặt lớn (đất, tường, trời) về gần xám")
    if ruc > 0.30: canh.append(f"CANH bang-mau  vùng rực chiếm {ruc * 100:.0f} % khung: mặt lớn chọn ở phần ba bên trái của bảng màu")
    if goc > 0.03: canh.append(f"CANH bang-mau  màu vừa sáng vừa rực chiếm {goc * 100:.1f} % khung: rực thì kéo tối xuống, sáng thì kéo nhạt đi")
    if not K:
        for d in canh: print(d)
        return 0
    for k in VAI[:3]:
        l, cc = khoang(K, k, 'L'), khoang(K, k, 'C')
        if not (A[k] and l and A[k]['pt'] > 0.03): continue
        if A[k]['L'] > l[1] + NOI: canh.append(f"CANH mau-ngoai-khoang  {k}: độ sáng {A[k]['L']:.2f}, sáng hơn cả bộ mẫu ({l[0]:.2f}–{l[1]:.2f}); màu giữa {A[k]['mau']}")
        elif A[k]['L'] < l[0] - NOI: canh.append(f"CANH mau-ngoai-khoang  {k}: độ sáng {A[k]['L']:.2f}, tối hơn cả bộ mẫu ({l[0]:.2f}–{l[1]:.2f}); màu giữa {A[k]['mau']}")
        if A[k]['C'] > cc[1] + 0.03: canh.append(f"CANH mau-ngoai-khoang  {k}: đậm màu hơn cả bộ mẫu ({A[k]['C']:.3f} so với {cc[0]:.3f}–{cc[1]:.3f})")
    if A[VAI[3]] and A[VAI[3]]['L'] > 0.84: canh.append(f"CANH mau-ngoai-khoang  nước gần trắng (L {A[VAI[3]]['L']:.2f}); nước của video gốc là sắc trầm")
    if c['L'] > ca['L'][1] + NOI or c['sang'] > ca['sang'][1] + 0.08: canh.append(f"CANH mau-ngoai-khoang  cả khung sáng hơn cả bộ mẫu: L {c['L']:.2f} so với {ca['L'][0]:.2f}–{ca['L'][1]:.2f}, phần rất sáng {c['sang'] * 100:.0f} % so với tối đa {ca['sang'][1] * 100:.0f} %")
    if c['ruc'] > ca['ruc'][1] + 0.10: canh.append(f"CANH mau-ngoai-khoang  cả khung rực hơn cả bộ mẫu: {c['ruc'] * 100:.0f} % so với tối đa {ca['ruc'][1] * 100:.0f} %")
    if c['L'] < ca['L'][0] - 0.10: canh.append(f"CANH mau-ngoai-khoang  cả khung tối hơn cả bộ mẫu: L {c['L']:.2f} so với {ca['L'][0]:.2f}–{ca['L'][1]:.2f}")
    if c['C'] < ca['C'][0] - 0.03: canh.append(f"CANH mau-ngoai-khoang  cả khung xám hơn cả bộ mẫu: C {c['C']:.3f} so với {ca['C'][0]:.3f}–{ca['C'][1]:.3f}")
    if len(K) < 3: canh.append(f"CANH it-khung-mau  chỉ so với {len(K)} khung: một hai khung không đủ làm thước, đưa từ 3 khung cùng loại cảnh")
    for d in canh: print(d)
    print(f'\ndo_mau_khuon: {len(canh)} cảnh báo, để THAM KHẢO: xem lại màu vật liệu và đèn; không lọc màu ảnh, không thêm bớt món để vào khoảng')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
