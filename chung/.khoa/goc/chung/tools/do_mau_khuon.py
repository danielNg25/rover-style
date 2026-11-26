#!/usr/bin/env python3
"""So MÀU của ảnh dựng ra với KHUNG KHUÔN (khung của video gốc được chọn làm bản thiết kế cho bối cảnh đó).

Daniel 25/11/2026 về cảnh thử khe suối: "các màu được chọn bị chói quá (chỗ lá cây, màu đất)"; đo ra đúng vậy và ông xác nhận
"đúng rồi là lỗi này". Hai nguyên nhân: agent tự chọn màu vật liệu quá nhạt, quá tươi; và đèn đẩy mặt nhận sáng nhạt thêm
(cát tô #e2c58c ra khung thành #f8d69f). Vì vậy màu phải lấy THEO KHUÔN và đo trên ẢNH DỰNG RA, không tin mã màu trong code.

  python3 tools/do_mau_khuon.py <ảnh>                 in số đo theo vai của một ảnh (dùng để đọc màu của khung khuôn)
  python3 tools/do_mau_khuon.py <ảnh của mình> <khuôn>  in hai bên cạnh nhau, rồi các dòng LOI / CANH

Vai (tách bằng sắc màu và vị trí, chỉ gần đúng): lá cây cỏ (sắc xanh lá), mặt đất hoặc sàn (phần màu ấm ở đáy khung), trời (sắc lam ở
đỉnh khung), nước (sắc ngọc ở nửa dưới), đỏ cam rực. L = độ sáng (0 đen, 1 trắng); C = độ đậm màu (dưới 0,03 gần xám, trên 0,12 là rực).
LOI khi một vai có ở cả hai ảnh mà lệch độ sáng quá 0,08, hoặc cả khung sáng, rực hơn khuôn rõ rệt. Đây là thước so với MỘT khung
khuôn đã chọn cho cảnh đó, không phải công thức chung; không bỏ đồ, không thêm đồ để đạt số: chỉ đổi màu vật liệu và đèn.
"""
import sys
import numpy as np
from PIL import Image

VAI = ['lá cây, cỏ', 'mặt đất, sàn (đáy khung)', 'trời', 'nước', 'đỏ cam rực']


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


def main(a):
    if not a: sys.exit(__doc__)
    A = do(a[0]); K = do(a[1]) if len(a) > 1 else None
    for ai, d in ((('khuôn', K),) if K else ()) + ((('mình' if K else 'ảnh', A),)):
        c = d['ca']; print(f"{'cả khung':26}{ai:7}          L {c['L']:.2f}   C {c['C']:.3f}   phần rất sáng (L > 0,85) {c['sang'] * 100:.0f} %   phần rực (C > 0,12) {c['ruc'] * 100:.0f} %")
    for k in VAI:
        if K: print(dong(k, 'khuôn', K[k]))
        print(dong(k, 'mình' if K else 'ảnh', A[k]))
    if not K: return 0
    loi, canh = [], []
    for k in VAI[:3]:
        if A[k] and K[k] and min(A[k]['pt'], K[k]['pt']) > 0.03:
            dl = A[k]['L'] - K[k]['L']; dc = A[k]['C'] - K[k]['C']
            if abs(dl) > 0.08: loi.append(f"LOI  mau-khuon   {k}: độ sáng {A[k]['L']:.2f}, khuôn {K[k]['L']:.2f} ({'sáng' if dl > 0 else 'tối'} hơn {abs(dl):.2f}); màu giữa {A[k]['mau']} so với {K[k]['mau']}")
            elif abs(dl) > 0.045: canh.append(f"CANH mau-khuon   {k}: độ sáng {A[k]['L']:.2f}, khuôn {K[k]['L']:.2f}")
            if dc > 0.03: canh.append(f"CANH mau-khuon   {k}: đậm màu hơn khuôn ({A[k]['C']:.3f} so với {K[k]['C']:.3f})")
            if A[k]['L90'] - K[k]['L90'] > 0.08: canh.append(f"CANH mau-khuon   {k}: sắc sáng nhất {A[k]['L90']:.2f}, khuôn {K[k]['L90']:.2f}")
    if A[VAI[3]] and A[VAI[3]]['L'] > 0.84: canh.append(f"CANH mau-khuon   nước gần trắng (L {A[VAI[3]]['L']:.2f}); nước của video gốc là sắc trầm")
    if A[VAI[4]] and A[VAI[4]]['pt'] > (K[VAI[4]]['pt'] if K[VAI[4]] else 0) + 0.03: canh.append(f"CANH mau-khuon   mảng đỏ cam rực chiếm {A[VAI[4]]['pt'] * 100:.1f} % khung, khuôn {(K[VAI[4]]['pt'] if K[VAI[4]] else 0) * 100:.1f} %: xem có phải áo nhân vật hay vật của câu chuyện không")
    ca, ck = A['ca'], K['ca']
    if ca['sang'] > ck['sang'] + 0.08 or ca['L'] > ck['L'] + 0.08: loi.append(f"LOI  mau-khuon   cả khung sáng hơn khuôn: L {ca['L']:.2f} so với {ck['L']:.2f}, phần rất sáng {ca['sang'] * 100:.0f} % so với {ck['sang'] * 100:.0f} %")
    if ca['ruc'] > ck['ruc'] + 0.10: loi.append(f"LOI  mau-khuon   cả khung rực hơn khuôn: {ca['ruc'] * 100:.0f} % so với {ck['ruc'] * 100:.0f} %")
    if ca['L'] < ck['L'] - 0.10: canh.append(f"CANH mau-khuon   cả khung tối hơn khuôn: L {ca['L']:.2f} so với {ck['L']:.2f}")
    if ca['C'] < ck['C'] - 0.03: canh.append(f"CANH mau-khuon   cả khung xám hơn khuôn: C {ca['C']:.3f} so với {ck['C']:.3f}")
    for d in loi + canh: print(d)
    print(f'\ndo_mau_khuon: {len(loi)} lỗi, {len(canh)} cảnh báo')
    return 1 if loi else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
