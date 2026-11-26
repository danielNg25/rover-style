#!/usr/bin/env python3

"""Canh TỈ LỆ MẮT TRÊN MẶT nhân vật (Daniel, 25/11/2026: "đừng để điều này lặp lại").

Chuyện đã xảy ra: ngày 23/11 một phiên chữa lời chê "mắt như đeo kính bảo hộ" bằng cách tự vẽ lại mắt cho cả dàn kênh lich-su,
mỗi mắt còn 0,24 bề ngang mặt và hai mắt tách nhau, trong khi video gốc là khoảng 0,40 và hai mắt luôn chạm nhau. Không ai đặt
mặt mới cạnh video gốc, nên cả dàn lệch mà không bị bắt.

  python3 tools/kiem_mat.py [kênh ...] [--ghi-chu]     không nêu kênh thì rà mọi kênh; --ghi-chu in cả file được miễn

Ba phép kiểm, chỉ đọc code, không dựng hình (tools/kiem_canh.py tự gọi các phép này cho kênh của file đang rà):
 1. số của MẮT CHUẨN (src/mould/matChuan.ts) còn trong khoảng đo từ video gốc và hai mắt còn chạm nhau;
 2. mắt mặc định của bộ khuôn (EYE trong src/mould/draw.ts) còn trong khoảng đó;
 3. không file nào của kênh TỰ VẼ MẮT: file có lớp cắm (registerAddOn, headFull) đọc hướng nhìn, mí hoặc nhắm mắt rồi tự vẽ hình tròn
    mà không lấy từ mould/matChuan là LOI. Kiểu mặt riêng mà Daniel đã duyệt thì ghi trong file một dòng `mat:da-duyet <ngày>`.
Muốn đổi kiểu mặt: đặt mặt cạnh skills/bang-cham/mat-chuan.jpg, làm mẫu nhỏ, hỏi Daniel (skill 3, mục Mặt chuẩn).

Màu da (26/11/2026): mã màu da tự ghi trong dàn nhân vật mà không thuộc bộ SKINS của src/mould/palettes.ts (bộ đo từ video gốc)
là LOI `da-ngoai-bo`.
"""
import re, sys
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent          # chung/
MAT_FACE = 382                                         # bề ngang mặt của bộ khuôn
MOI_MAT = (0.36, 0.47)                                 # mỗi mắt / bề ngang mặt (video gốc: khoảng 0,38–0,45)
CAO_NGANG = (0.90, 1.15)                               # mắt tròn: cao / ngang
KHE = 0.02                                             # hai mắt chạm nhau: khe không quá 2 % bề ngang mặt
# file có từ trước 25/11/2026, chưa soát theo mặt chuẩn: không báo LOI, in khi có --ghi-chu
CO_TU_TRUOC = {'kenh/anime-analyst/cast/dauAnime.ts', 'kenh/anime-analyst/cast/dauCute.ts',
               'kenh/phim-tv/cast/doomCast.ts'}   # mắt sau mặt nạ Doom và nhân vật tập doom-1 (tập đã đăng)


def so(doan):
    return {k: float(v) for k, v in re.findall(r'(\w+)\s*:\s*(-?\d+(?:\.\d+)?)', doan)}


def kiem_so(ten, rx, ry, khe, loi):
    moi = 2 * rx / MAT_FACE
    if not MOI_MAT[0] <= moi <= MOI_MAT[1]:
        loi.append(f'LOI  mat-co      {ten}: mỗi mắt bằng {moi:.2f} bề ngang mặt, ngoài khoảng {MOI_MAT[0]}–{MOI_MAT[1]} của video gốc')
    if not CAO_NGANG[0] <= ry / rx <= CAO_NGANG[1]:
        loi.append(f'LOI  mat-dang    {ten}: mắt cao/ngang {ry / rx:.2f}, ngoài khoảng {CAO_NGANG[0]}–{CAO_NGANG[1]} (mắt phải tròn)')
    if khe / MAT_FACE > KHE:
        loi.append(f'LOI  mat-tach    {ten}: hai mắt cách nhau {khe / MAT_FACE:.2f} bề ngang mặt; video gốc hai mắt luôn chạm nhau')


def tu_ve_mat(s):
    """file này có tự vẽ mắt không (lớp cắm đọc hướng nhìn, mí, nhắm mắt rồi tự vẽ hình tròn)"""
    return bool(re.search(r'registerAddOn\(|headFull', s) and re.search(r'\.gaze\b|\blid[LR]\b|\.closed\b', s) and re.search(r'\.(ellipse|arc)\(', s))


# dàn nhân vật của tập đã ghép và đăng trước khi có bộ màu da đo từ video gốc (26/11/2026): chỉ ghi chú, không báo lỗi
DA_TU_TRUOC = {'kenh/phim-tv/cast/doomCast.ts'}


def bo_da():
    """mọi mã màu trong khối SKINS của src/mould/palettes.ts, và màu `skin` của từng tông"""
    t = (GOC / 'src/mould/palettes.ts').read_text(encoding='utf-8'); m = re.search(r'export const SKINS = \{(.*?)\n\} satisfies', t, re.S)
    if not m: return set(), {}
    tong = {a: b.lower() for a, b in re.findall(r"^\s*(\w+): \{[^}]*?\bskin: '(#[0-9a-fA-F]{6})'", m.group(1), re.M)}
    return {h.lower() for h in re.findall(r'#[0-9a-fA-F]{6}', m.group(1))}, tong


def kiem_da(s, bo, tong):
    """mã màu da tự ghi (kiểu da người: sắc 5–45°, bão hoà từ 0,12) không thuộc bộ SKINS. Trả [(mã, tông gần nhất)]"""
    import colorsys
    rgb = lambda h: [int(h[i:i + 2], 16) for i in (1, 3, 5)]; ra = []
    for d in s.split('\n'):
        if 'da:ok' in d or 'da:da-duyet' in d: continue
        for h in re.findall(r"\bskin[ABC]?: *'(#[0-9a-fA-F]{6})'", d):
            h = h.lower(); c = rgb(h); hu, sa, _ = colorsys.rgb_to_hsv(*[v / 255 for v in c])
            if h in bo or not (5 <= hu * 360 <= 45 and sa >= 0.12): continue
            gan = min(tong, key=lambda t: sum((a - b) ** 2 for a, b in zip(rgb(tong[t]), c))) if tong else '?'
            if (h, gan) not in ra: ra.append((h, gan))
    return ra


def kiem(kenh=None, ghi_chu=False):
    loi, canh = [], []
    # 1. mắt chuẩn
    f = GOC / 'src/mould/matChuan.ts'
    if not f.exists():
        loi.append('LOI  mat-chuan   không thấy src/mould/matChuan.ts (mắt chuẩn)')
    else:
        s = f.read_text(encoding='utf-8'); m = re.search(r'MAT_CHUAN\s*=\s*\{([^}]*)\}', s)
        d = so(m.group(1)) if m else {}
        if not {'rx', 'ry'} <= set(d):
            loi.append('LOI  mat-chuan   không đọc được MAT_CHUAN = {rx, ry, y, tam} trong src/mould/matChuan.ts')
        else:
            kiem_so('mắt chuẩn (matChuan.ts)', d['rx'], d['ry'], 0, loi)
            if not re.search(r'L:\s*MAT_CHUAN\.tam\s*-\s*MAT_CHUAN\.rx\s*,\s*R:\s*MAT_CHUAN\.tam\s*\+\s*MAT_CHUAN\.rx', s):
                loi.append('LOI  mat-tach    matChuan.ts: tâm hai mắt không còn là tam ± rx, hai mắt không chắc còn chạm nhau')
    # 2. mắt mặc định của bộ khuôn
    s = (GOC / 'src/mould/draw.ts').read_text(encoding='utf-8'); m = re.search(r'const EYE\s*=\s*\{([^}]*)\}', s)
    d = so(m.group(1)) if m else {}
    if {'rx', 'ry', 'L', 'R'} <= set(d):
        kiem_so('mắt của bộ khuôn (draw.ts)', d['rx'], d['ry'], (d['R'] - d['rx']) - (d['L'] + d['rx']), loi)
    else:
        loi.append('LOI  mat-khuon   không đọc được const EYE trong src/mould/draw.ts')
    # 3. kênh tự vẽ mắt
    goc_kenh = GOC.parent / 'kenh'; BO_DA, TONG_DA = bo_da()
    for k in sorted(p.name for p in goc_kenh.iterdir() if p.is_dir() and not p.name.startswith(('_', '.'))):
        if kenh and k not in kenh: continue
        for thu_muc in ('cast', 'lib', 'tap'):
            for f in sorted((goc_kenh / k / thu_muc).rglob('*.ts*')) if (goc_kenh / k / thu_muc).is_dir() else []:
                if f.suffix not in ('.ts', '.tsx') or '/_luu/' in str(f): continue
                s = f.read_text(encoding='utf-8', errors='replace'); ten = str(f.relative_to(GOC.parent))
                da = kiem_da(s, BO_DA, TONG_DA)
                if da:
                    dong = f'{ten}: {len(da)} mã màu da tự ghi, không thuộc bộ SKINS: ' + ', '.join(f'{h} (gần nhất: {g})' for h, g in da[:8]) + (' …' if len(da) > 8 else '')
                    if ten in DA_TU_TRUOC:
                        if ghi_chu: canh.append('ghi chú da-ngoai-bo ' + dong + '. Dàn của tập đã xong; dùng cho tập mới thì đổi sang SKINS')
                    else: loi.append('LOI  da-ngoai-bo ' + dong + '. Da người chỉ lấy từ bộ đo từ video gốc: palette: {...SKINS.<tông>} (chung/src/mould/palettes.ts). Không phải da người thì ghi `da:ok <lý do>` trên dòng đó; màu da riêng Daniel đã duyệt thì ghi `da:da-duyet <ngày>`')
                if not tu_ve_mat(s) or re.search(r'mould/matChuan', s): continue
                if 'mat:da-duyet' in s:
                    if ghi_chu: canh.append(f'ghi chú mat-rieng   {ten}: kiểu mặt riêng, có dòng mat:da-duyet')
                elif ten in CO_TU_TRUOC:
                    if ghi_chu: canh.append(f'ghi chú mat-rieng   {ten}: tự vẽ mắt, có từ trước 25/11/2026, chưa soát theo mặt chuẩn; dùng cho tập mới thì đặt cạnh mat-chuan.jpg và hỏi Daniel')
                else:
                    loi.append(f'LOI  tu-ve-mat   {ten}: file tự vẽ mắt. Mắt phải lấy từ chung/src/mould/matChuan.ts (matChuan, veMat); không đổi cỡ, khoảng cách mắt. '
                               'Muốn kiểu mặt riêng: đặt cạnh skills/bang-cham/mat-chuan.jpg, làm mẫu nhỏ, Daniel duyệt rồi ghi dòng `mat:da-duyet <ngày>`')
    return loi, canh


if __name__ == '__main__':
    a = sys.argv[1:]; gc = '--ghi-chu' in a
    loi, canh = kiem([x for x in a if not x.startswith('--')] or None, gc)
    for d in loi + canh: print(d)
    print(f'\nkiem_mat: {len(loi)} lỗi' + (f', {len(canh)} ghi chú' if gc else ''))
    sys.exit(1 if loi else 0)
