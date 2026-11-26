#!/usr/bin/env python3
"""KHOÁ PHẦN CHUNG của cutout3d.

Daniel, 26/11/2026: "Các session vẫn tự sửa engine chung, cần đặt luật cực mạnh: nếu muốn sửa thì phải hỏi mình,
đồng thời đưa ảnh so sánh nếu sửa và không sửa."

PHẦN CHUNG gồm: engine (chung/src, chung/remotion.config.ts), công cụ (code trong chung/tools, chung/*.sh, package.json,
tsconfig.json), luật (chung/skills trừ thư viện canh-mau, CLAUDE.md, BAT-DAU-O-DAY.md), workflow và hook (.claude/workflows,
.claude/settings.json). Mỗi file ở đó được NIÊM: mã băm và một bản gốc nằm trong chung/.khoa/. File đã niêm chỉ đổi được khi có
PHIẾU do chính Daniel duyệt. Ba lớp giữ khoá:
  1. hook PreToolUse chặn Edit/Write vào file đã niêm khi không có phiếu đã duyệt;
  2. sandbox cấm lệnh Bash ghi vào chung/src, file luật, workflow (khai trong .claude/settings.json);
  3. hook PostToolUse soát mã băm sau mỗi lệnh Bash, và hook mở phiên báo file nào đang lệch bản niêm.
Các lệnh đổi trạng thái khoá (duyet, niem, tra-lai) làm hiện hộp hỏi cho Daniel bấm; phiên không tự bấm được.

CÁCH XIN SỬA (làm đủ, đúng thứ tự; chạy trong chung/):
  1. Không đụng file thật. Làm bản thử ở NGOÀI phần chung: copy file cần đổi sang kenh/_thu-mau/ (hoặc thư mục kênh),
     sửa bản copy, cho cảnh thử import bản copy.
  2. Dựng CÙNG một khung hai lần: KHÔNG SỬA (engine đang niêm) và CÓ SỬA (bản thử). Nên có 2–3 khung khác loại cảnh.
  3. python3 tools/khoa_chung.py xin --ly-do "<đổi gì, vì sao>" --anh-huong "<kênh, video nào đổi theo khi dựng lại>" \\
         --o-kenh "<vì sao không làm riêng ở thư mục kênh được>" --file <file> [--file …] \\
         --khong-sua <ảnh> --co-sua <ảnh> [--khong-sua <ảnh> --co-sua <ảnh> …]
     File chỉ là công cụ hay luật (không làm đổi hình) thì không cần ảnh.
     Không làm được bản thử ở ngoài: thêm --thu "<vì sao>" (vẫn phải có ảnh KHÔNG SỬA); Daniel duyệt thì được sửa thử,
     khi đóng phiếu phải nộp ảnh CÓ SỬA và lời duyệt cuối, không thì trả lại.
  4. Gửi Daniel tấm so sánh công cụ ghép ra cùng nội dung phiếu, rồi DỪNG.
  5. Daniel duyệt:   python3 tools/khoa_chung.py duyet <mã> --loi "<nguyên văn lời Daniel>"     (hiện hộp hỏi cho Daniel)
  6. Sửa đúng các file trong phiếu bằng Edit/Write; thêm một dòng vào CHANGELOG.md ở gốc repo (dưới ngày hôm đó: đổi gì, file chính,
     dựng lại thì hình có đổi không).
  7. python3 tools/khoa_chung.py dong <mã>        niêm lại các file của phiếu
  8. python3 tools/khoa_chung.py luu "<đổi gì>"   commit phần chung và đẩy lên GitHub (lệnh git ghi vào .git: chạy NGOÀI sandbox)

LỆNH KHÁC:
  python3 tools/khoa_chung.py                     soát: file nào lệch bản niêm, phiếu nào đang mở (mã thoát 1 khi có file lệch không phiếu)
  python3 tools/khoa_chung.py phieu <mã>          in một phiếu
  python3 tools/khoa_chung.py tra-lai <mã | file…>          trả file về bản niêm (hộp hỏi Daniel; lệnh ghi vào chung/src nên chạy ngoài sandbox)
  python3 tools/khoa_chung.py niem [file…] --loi "<lời Daniel>"   nhận trạng thái hiện giờ làm bản niêm (hộp hỏi Daniel)
  python3 tools/khoa_chung.py khoi-tao [--goc-khac <thư mục>]     lập bản niêm lần đầu (chỉ chạy được khi chưa có)
  python3 tools/khoa_chung.py hook                dùng trong .claude/settings.json (đọc JSON của hook ở stdin)

LƯU LÊN REPO (phần chung là repo git ở gốc cutout3d/; máy khác nhận bằng git pull):
  python3 tools/khoa_chung.py luu "<đổi gì>" [file hoặc thư mục…] [--duoi "<dòng cuối lời commit>"]
      Tự đưa vào commit: file đã niêm đang KHỚP bản niêm, sổ niêm, CHANGELOG.md, NHAT-KY. Thứ khác (món kho Daniel đã duyệt,
      ảnh gen, file mới) phải kể tên. TỪ CHỐI khi có file đã niêm lệch bản niêm, hoặc đổi phần chung mà CHANGELOG.md không có dòng mới.
  python3 tools/khoa_chung.py truoc-commit        chốt của git trước mỗi commit (chung/tools/git-hooks/pre-commit gọi): cùng hai điều trên
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

GOC = Path(__file__).resolve().parents[2]
KHOA = GOC / 'chung/.khoa'
F_NIEM, D_GOC, D_PHIEU = KHOA / 'niem.json', KHOA / 'goc', KHOA / 'phieu'
F_BAO, F_NHO, F_SO = KHOA / 'da-bao.json', KHOA / 'luc.json', KHOA / 'so-viec.jsonl'
GHI_DOI = GOC / 'CHANGELOG.md'       # chỗ ghi mọi thay đổi của phần chung (từ 26/11/2026; trước đó là chung/NHAT-KY-THAY-DOI.md)
GHI_RIENG = ('CHANGELOG.md', 'chung/NHAT-KY-THAY-DOI.md')
MOC_GIT = 'chung/tools/git-hooks'
D_ANH = GOC / 'chung/out/phieu-chung'
HAN = 24 * 3600                    # phiếu đã duyệt mà không đóng thì hết hiệu lực sau 24 giờ
CO_BAN_GOC = 3 * 1024 * 1024       # file lớn hơn mức này chỉ ghi mã băm, không giữ bản gốc
MA_CODE = ('.py', '.sh', '.mjs', '.js', '.ts')
TEN_LOAI = {'hinh': 'engine (làm đổi hình của mọi kênh)', 'luat': 'công cụ, luật hoặc workflow dùng chung'}


def loai(rel):
    """'hinh' (đổi là đổi hình), 'luat' (công cụ, luật, workflow), 'khoa' (sổ của chính cái khoá), None (không khoá)."""
    if rel == 'chung/.khoa' or rel.startswith('chung/.khoa/'): return 'khoa'
    ten = rel.rsplit('/', 1)[-1]
    if ten == '.DS_Store' or '/__pycache__/' in '/' + rel or '/node_modules/' in '/' + rel: return None
    if rel.startswith('chung/src/'): return None if rel.startswith('chung/src/thu/') else 'hinh'
    if rel == 'chung/remotion.config.ts': return 'hinh'
    if rel.startswith('chung/skills/'): return None if rel.startswith('chung/skills/canh-mau/') else 'luat'
    if rel.startswith('chung/tools/'): return 'luat' if ten.endswith(MA_CODE) or rel.startswith(MOC_GIT + '/') else None
    if re.fullmatch(r'chung/[^/]+\.sh', rel) or rel in ('chung/package.json', 'chung/tsconfig.json'): return 'luat'
    if rel.startswith('.claude/workflows/') or rel in ('.claude/settings.json', 'CLAUDE.md', 'BAT-DAU-O-DAY.md'): return 'luat'
    return None


def moi_file():
    """mọi file thuộc phần chung đang có trên đĩa: {rel: Path}"""
    ra = {}
    for con in ('chung/src', 'chung/skills', 'chung/tools', '.claude/workflows'):
        for thu_muc, cac_con, files in os.walk(GOC / con):
            cac_con[:] = [c for c in cac_con if c not in ('__pycache__', 'node_modules', 'canh-mau')]
            for f in files:
                p = Path(thu_muc) / f; rel = p.relative_to(GOC).as_posix()
                if loai(rel) in ('hinh', 'luat'): ra[rel] = p
    le = [GOC / '.claude/settings.json', GOC / 'CLAUDE.md', GOC / 'BAT-DAU-O-DAY.md']
    for p in sorted((GOC / 'chung').glob('*')) + le:
        if p.is_file():
            rel = p.relative_to(GOC).as_posix()
            if loai(rel) in ('hinh', 'luat'): ra[rel] = p
    return ra


def doc(p, md=None):
    try: return json.loads(Path(p).read_text(encoding='utf-8'))
    except (OSError, ValueError): return md


def ghi(p, d):
    p = Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    t = p.with_name(f'{p.name}.{os.getpid()}.tam')
    t.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf-8'); os.replace(t, p)


def bam(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()


def so_viec(viec, **kw):
    KHOA.mkdir(parents=True, exist_ok=True)
    with open(F_SO, 'a', encoding='utf-8') as f: f.write(json.dumps({'luc': time.strftime('%Y-%m-%d %H:%M:%S'), 'viec': viec, **kw}, ensure_ascii=False) + '\n')


def chet(*dong):
    print('\n'.join(dong), file=sys.stderr); sys.exit(1)


def rel_cua(duong, cwd=None):
    """đường dẫn (tuyệt đối, hoặc tương đối theo cwd) → đường dẫn tính từ gốc cutout3d; None nếu nằm ngoài"""
    if not duong: return None
    p = Path(duong).expanduser()
    if not p.is_absolute(): p = Path(cwd or os.getcwd()) / p
    try: p = p.resolve() if p.exists() else p.parent.resolve() / p.name
    except OSError: pass
    try: return p.relative_to(GOC).as_posix()
    except ValueError: return None


# ---------------------------------------------------------------- phiếu
def cac_phieu():
    return [p for p in (doc(f) for f in sorted(D_PHIEU.glob('*.json'))) if p] if D_PHIEU.is_dir() else []


def lay_phieu(ma):
    p = doc(D_PHIEU / f'{ma}.json')
    if not p: chet(f'Không có phiếu {ma}. Các phiếu: ' + (', '.join(x['ma'] for x in cac_phieu()) or 'chưa có phiếu nào'))
    return p


def hieu_luc(p):
    return p.get('trang_thai') == 'da-duyet' and time.time() - p.get('luc_duyet', 0) < HAN


def dang_mo():
    """{rel: mã phiếu} của các phiếu đã duyệt còn hiệu lực"""
    return {f: p['ma'] for p in cac_phieu() if hieu_luc(p) for f in p['file']}


def in_phieu(p):
    tt = {'cho-duyet': 'CHỜ DANIEL DUYỆT', 'da-duyet': 'ĐÃ DUYỆT, đang sửa' if hieu_luc(p) else 'ĐÃ DUYỆT nhưng HẾT HẠN 24 giờ (xin phiếu mới)', 'dong': 'ĐÃ ĐÓNG', 'huy': 'ĐÃ HUỶ, file đã trả lại'}[p['trang_thai']]
    print(f"PHIẾU XIN SỬA PHẦN CHUNG {p['ma']}   [{tt}]   lập {p['lap']}")
    print(f"  Đổi gì, vì sao:        {p['ly_do']}")
    print(f"  Kênh, video đổi theo:  {p['anh_huong']}")
    print(f"  Không làm ở kênh vì:   {p['o_kenh']}")
    print('  File:                  ' + ', '.join(p['file']))
    if p.get('thu'): print(f"  XIN SỬA THỬ (chưa có ảnh CÓ SỬA): {p['thu']}")
    print('  Ảnh so sánh:           ' + (p.get('tam_so_sanh') or ('chỉ có ảnh KHÔNG SỬA: ' + ', '.join(p['khong_sua']) if p.get('khong_sua') else 'không có (phiếu chỉ gồm công cụ, luật)')))
    if p.get('loi_daniel'): print(f"  Lời Daniel:            {p['loi_daniel']}")


def kiem_anh(khong_sua, co_sua):
    """ảnh mở được; từng cặp cùng cỡ và KHÁC nhau. Trả các dòng ghi chú."""
    from PIL import Image
    import numpy as np
    ghi_chu = []
    for a in khong_sua + co_sua:
        if not Path(a).is_file(): chet(f'Không thấy ảnh: {a}')
        try: Image.open(a).verify()
        except Exception: chet(f'File này không mở được như một ảnh: {a}')
    for a, b in zip(khong_sua, co_sua):
        A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
        if A.size != B.size: chet(f'Hai ảnh của một cặp phải là CÙNG một khung, cùng cỡ: {a} {A.size} và {b} {B.size}.')
        khac = float((np.abs(np.asarray(A, dtype=np.int16) - np.asarray(B, dtype=np.int16)).max(-1) > 8).mean())
        if khac == 0: chet(f'Hai ảnh giống hệt nhau: {a} và {b}.', 'Thay đổi không hiện ra trên khung này. Chọn khung thấy được chỗ đổi, hoặc kiểm lại bản thử có thật sự được dùng không.')
        if khac > 0.85: ghi_chu.append(f'GHI CHÚ: {khac:.0%} điểm ảnh của cặp {Path(a).name} / {Path(b).name} khác nhau. Có chắc là cùng một khung, cùng góc máy?')
    return ghi_chu


def ghep_so_sanh(cap, ra, tieu_de):
    """ghép các cặp ảnh thành một tấm có nhãn: trái KHÔNG SỬA, phải CÓ SỬA"""
    from PIL import Image, ImageDraw, ImageFont

    def font(c):
        for f in ('/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/Library/Fonts/Arial Unicode.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'):
            try: return ImageFont.truetype(f, c)
            except OSError: pass
        return ImageFont.load_default()
    W, w, hang = 2400, 1194, []
    for a, b in cap:
        A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB'); h = round(A.height * w / A.width)
        o = Image.new('RGB', (W, h + 52), '#141414'); d = ImageDraw.Draw(o)
        for i, (im, nhan, mau) in enumerate(((A, f'KHÔNG SỬA  ·  {Path(a).name}', '#2b5c96'), (B, f'CÓ SỬA  ·  {Path(b).name}', '#b4541c'))):
            x = i * (w + 12); d.rectangle([x, 0, x + w, 52], fill=mau); d.text((x + 14, 10), nhan, fill='white', font=font(28)); o.paste(im.resize((w, h), Image.LANCZOS), (x, 52))
        hang.append(o)
    tam = Image.new('RGB', (W, 60 + sum(o.height + 10 for o in hang)), '#141414')
    ImageDraw.Draw(tam).text((14, 14), tieu_de, fill='white', font=font(26)); y = 60
    for o in hang: tam.paste(o, (0, y)); y += o.height + 10
    Path(ra).parent.mkdir(parents=True, exist_ok=True); tam.save(ra, quality=90)


def lenh_xin(a):
    if not doc(F_NIEM): chet('Chưa có bản niêm (khoi-tao).')
    file = []
    for f in a.file:
        rel = rel_cua(f)
        if not rel or loai(rel) not in ('hinh', 'luat'): chet(f'{f} không thuộc phần chung bị khoá; sửa file đó không cần phiếu.')
        if rel not in file: file.append(rel)
    for ten, v in (('--ly-do', a.ly_do), ('--anh-huong', a.anh_huong), ('--o-kenh', a.o_kenh)):
        if len(v.strip()) < 15: chet(f'{ten} quá ngắn ("{v}"). Viết đủ để Daniel đọc là hiểu, không cần mở code.')
    ks, cs = [str(Path(x).resolve()) for x in a.khong_sua], [str(Path(x).resolve()) for x in a.co_sua]
    co_hinh = [f for f in file if loai(f) == 'hinh']
    if co_hinh:
        if not ks: chet('Phiếu có file engine (' + ', '.join(co_hinh) + '): bắt buộc có ảnh.', 'Dựng CÙNG một khung hai lần rồi nộp: --khong-sua <ảnh engine đang niêm> --co-sua <ảnh bản thử>.')
        if not a.thu and len(cs) != len(ks): chet(f'Có {len(ks)} ảnh KHÔNG SỬA nhưng {len(cs)} ảnh CÓ SỬA. Mỗi khung phải đủ một cặp, cùng thứ tự.', 'Chỉ khi không làm được bản thử ở ngoài phần chung mới dùng --thu "<vì sao>".')
    if a.thu and cs: chet('--thu là phiếu xin sửa thử khi CHƯA có ảnh CÓ SỬA. Đã có ảnh CÓ SỬA thì bỏ --thu.')
    ghi_chu = kiem_anh(ks, cs)
    D_PHIEU.mkdir(parents=True, exist_ok=True)
    dau = 'P' + time.strftime('%m%d') + '-'
    ma = dau + f"{1 + max([int(x['ma'][len(dau):]) for x in cac_phieu() if x['ma'].startswith(dau)] or [0]):02d}"
    p = {'ma': ma, 'trang_thai': 'cho-duyet', 'lap': time.strftime('%Y-%m-%d %H:%M'), 'ly_do': a.ly_do.strip(), 'anh_huong': a.anh_huong.strip(), 'o_kenh': a.o_kenh.strip(),
         'file': file, 'khong_sua': ks, 'co_sua': cs, 'thu': (a.thu or '').strip() or None}
    if cs:
        p['tam_so_sanh'] = str(D_ANH / f'{ma}-so-sanh.jpg'); ghep_so_sanh(list(zip(ks, cs)), p['tam_so_sanh'], f'Phiếu {ma}: {p["ly_do"][:150]}')
    ghi(D_PHIEU / f'{ma}.json', p); so_viec('xin', ma=ma, file=file)
    in_phieu(p)
    for g in ghi_chu: print(g)
    print('\nVIỆC KẾ: gửi Daniel ' + ('tấm so sánh ở trên' if cs else 'ảnh KHÔNG SỬA' if ks else 'nội dung phiếu') + ' cùng bốn dòng đầu của phiếu, rồi DỪNG. Chưa có lời duyệt đúng phiếu này thì không sửa.')
    print(f'Khi Daniel duyệt:  python3 tools/khoa_chung.py duyet {ma} --loi "<nguyên văn lời Daniel>"')


def lenh_duyet(a):
    p = lay_phieu(a.ma)
    if p['trang_thai'] != 'cho-duyet': chet(f"Phiếu {a.ma} đang ở trạng thái {p['trang_thai']}, không phải chờ duyệt.")
    if len(a.loi.strip()) < 2: chet('Thiếu --loi "<nguyên văn lời Daniel duyệt phiếu này>".')
    p.update(trang_thai='da-duyet', luc_duyet=time.time(), loi_daniel=a.loi.strip()); ghi(D_PHIEU / f'{a.ma}.json', p); so_viec('duyet', ma=a.ma, loi=a.loi.strip())
    print(f"ĐÃ MỞ KHOÁ theo phiếu {a.ma} cho {len(p['file'])} file, trong 24 giờ: " + ', '.join(p['file']))
    print('Chỉ sửa các file đó, bằng Edit/Write (lệnh Bash không ghi được vào chung/src). Sửa xong: thêm một dòng vào CHANGELOG.md ở gốc repo, rồi')
    print(f'  python3 tools/khoa_chung.py dong {a.ma}' + ('   --co-sua <ảnh…> --loi "<lời Daniel sau khi xem cặp ảnh>"   (phiếu sửa thử)' if p.get('thu') else ''))


def niem_mot(so, rel, nguon=None):
    """ghi mã băm và bản gốc của một file vào sổ niêm (nguon: lấy nội dung từ file khác làm bản niêm)"""
    p = nguon or GOC / rel; dich = D_GOC / rel
    if not p.is_file():
        so['file'].pop(rel, None)
        if dich.is_file(): dich.unlink()
        return
    co = p.stat().st_size; so['file'][rel] = {'bam': bam(p), 'co': co}
    if co <= CO_BAN_GOC:
        dich.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(p, dich)


def lenh_dong(a):
    p = lay_phieu(a.ma)
    if p['trang_thai'] != 'da-duyet': chet(f"Phiếu {a.ma} đang ở trạng thái {p['trang_thai']}; chỉ đóng được phiếu đã duyệt.")
    if p.get('thu'):
        cs = [str(Path(x).resolve()) for x in a.co_sua]
        if len(cs) != len(p['khong_sua']) or len((a.loi or '').strip()) < 2:
            chet(f"Phiếu {a.ma} là phiếu SỬA THỬ: muốn giữ thay đổi phải nộp {len(p['khong_sua'])} ảnh CÓ SỬA (cùng khung, cùng thứ tự với ảnh KHÔNG SỬA) và lời Daniel sau khi xem cặp ảnh:",
                 f'  python3 tools/khoa_chung.py dong {a.ma} --co-sua <ảnh…> --loi "<nguyên văn lời Daniel>"', f'Daniel không duyệt thì trả lại:  python3 tools/khoa_chung.py tra-lai {a.ma}')
        kiem_anh(p['khong_sua'], cs)
        p.update(co_sua=cs, tam_so_sanh=str(D_ANH / f'{a.ma}-so-sanh.jpg'), loi_cuoi=a.loi.strip()); ghep_so_sanh(list(zip(p['khong_sua'], cs)), p['tam_so_sanh'], f'Phiếu {a.ma}: {p["ly_do"][:150]}')
    if not GHI_DOI.is_file() or GHI_DOI.stat().st_mtime < p['luc_duyet']:
        chet('Chưa thấy dòng mới trong CHANGELOG.md (gốc repo) kể từ lúc phiếu được duyệt.', 'Thêm một dòng dưới ngày hôm nay: đổi gì, file chính, dựng lại thì hình có đổi không, mã phiếu. Rồi chạy lại lệnh đóng.')
    so = doc(F_NIEM)
    khong_doi = [f for f in p['file'] if f in so['file'] and (GOC / f).is_file() and bam(GOC / f) == so['file'][f]['bam']]
    for f in p['file']: niem_mot(so, f)
    ghi(F_NIEM, so); p.update(trang_thai='dong', luc_dong=time.time()); ghi(D_PHIEU / f'{a.ma}.json', p); so_viec('dong', ma=a.ma, file=p['file'])
    print(f"Đã đóng phiếu {a.ma}; {len(p['file'])} file đã niêm lại theo nội dung mới.")
    if khong_doi: print('GHI CHÚ: các file này nằm trong phiếu nhưng không đổi gì: ' + ', '.join(khong_doi))
    print(f'VIỆC KẾ, lưu lên repo (chạy NGOÀI sandbox):  python3 tools/khoa_chung.py luu "{a.ma}: <đổi gì>"')


def lenh_tra_lai(a):
    so = doc(F_NIEM) or chet('Chưa có bản niêm.')
    p = doc(D_PHIEU / f'{a.muc[0]}.json') if len(a.muc) == 1 else None
    file = p['file'] if p else [rel_cua(f) or f for f in a.muc]
    xong, bo = [], []
    for rel in file:
        goc = D_GOC / rel
        if rel not in so['file']: bo.append(f'{rel} (chưa từng niêm: file mới, để nguyên)'); continue
        if not goc.is_file(): bo.append(f'{rel} (file lớn, không giữ bản gốc)'); continue
        try: (GOC / rel).parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(goc, GOC / rel); xong.append(rel)
        except PermissionError:
            chet(f'Không ghi được {rel}: sandbox cấm lệnh ghi vào phần chung.', 'Chạy lại lệnh này ngoài sandbox, hoặc Daniel tự gõ:  ! python3 chung/tools/khoa_chung.py tra-lai ' + ' '.join(a.muc))
    if p and p['trang_thai'] in ('cho-duyet', 'da-duyet'): p.update(trang_thai='huy'); ghi(D_PHIEU / f"{p['ma']}.json", p)
    so_viec('tra-lai', file=xong, phieu=p and p['ma'])
    print(f'Đã trả {len(xong)} file về bản niêm: ' + (', '.join(xong) or '(không file nào)'))
    for b in bo: print('  bỏ qua: ' + b)


def lenh_niem(a):
    so = doc(F_NIEM) or chet('Chưa có bản niêm (khoi-tao).')
    if len(a.loi.strip()) < 2: chet('Thiếu --loi "<nguyên văn lời Daniel cho giữ trạng thái hiện giờ>".')
    hien = moi_file()
    file = [rel_cua(f) or f for f in a.file] or sorted(set(hien) | set(so['file']))
    for rel in file:
        if loai(rel) not in ('hinh', 'luat'): chet(f'{rel} không thuộc phần chung bị khoá.')
        niem_mot(so, rel)
    ghi(F_NIEM, so); so_viec('niem', file=a.file or 'toàn bộ', loi=a.loi.strip())
    print(f'Đã niêm {len(file)} file theo trạng thái hiện giờ. Sổ niêm có {len(so["file"])} file.')


def lenh_khoi_tao(a):
    if doc(F_NIEM): chet('Đã có bản niêm. Muốn nhận trạng thái hiện giờ làm bản niêm: niem --loi "<lời Daniel>".')
    so, khac = {'lap': time.strftime('%Y-%m-%d %H:%M'), 'file': {}}, []
    for rel in sorted(moi_file()):
        cu = Path(a.goc_khac) / rel if a.goc_khac else None
        if cu and cu.is_file() and bam(cu) != bam(GOC / rel): niem_mot(so, rel, cu); khac.append(rel)
        else: niem_mot(so, rel)
    ghi(F_NIEM, so); ghi(F_BAO, {rel: bam(GOC / rel) for rel in khac}); so_viec('khoi-tao', so_file=len(so['file']), lech_tu_dau=khac)
    print(f"Đã niêm {len(so['file'])} file của phần chung.")
    if khac: print(f'{len(khac)} file niêm theo bản trong {a.goc_khac}, nên đang LỆCH bản niêm và chờ Daniel quyết: ' + ', '.join(khac))


# ---------------------------------------------------------------- lưu lên repo git
def git(*a):
    return subprocess.run(['git', '-C', str(GOC), *a], capture_output=True)


def soat_hang_cho():
    """Hàng chờ commit (index) có được commit không. None: không có gì trong hàng chờ; []: được; [lý do…]: bị chặn."""
    r = git('diff', '--cached', '--name-status', '-z', '--no-renames')
    muc = [x for x in r.stdout.decode('utf-8', 'replace').split('\0') if x]
    cap = list(zip(muc[0::2], muc[1::2]))
    if not cap: return None
    s = git('show', ':chung/.khoa/niem.json')
    try: so = json.loads(s.stdout)['file'] if s.returncode == 0 else (doc(F_NIEM) or {'file': {}})['file']
    except ValueError: return ['chung/.khoa/niem.json trong hàng chờ không đọc được']
    loi = []
    for tt, rel in cap:
        if loai(rel) not in ('hinh', 'luat'): continue
        if tt == 'D':
            if rel in so: loi.append(f'{rel}: xoá file đã niêm (bản niêm vẫn ghi file này)')
        elif rel in so and hashlib.sha256(git('show', ':' + rel).stdout).hexdigest() != so[rel]['bam']:
            loi.append(f'{rel}: khác bản niêm, tức là sửa phần chung chưa có phiếu Daniel duyệt và đóng')
    ten = [rel for _, rel in cap]
    can_ghi = [rel for rel in ten if loai(rel) in ('hinh', 'luat') or (rel.startswith('chung/') and not rel.startswith('chung/.khoa/') and rel not in GHI_RIENG)]
    if can_ghi and 'CHANGELOG.md' not in ten:
        loi.append(f'thiếu dòng mới trong CHANGELOG.md cho {len(can_ghi)} file của phần chung (ví dụ {can_ghi[0]})')
    return loi


LOI_CHAN = ('Sửa file đã niêm phải có phiếu Daniel duyệt và đã đóng (python3 tools/khoa_chung.py --help). Mỗi thay đổi của phần chung ghi một dòng vào CHANGELOG.md.',
            'Lưu đúng cách:  python3 tools/khoa_chung.py luu "<đổi gì>" [file…]')


def lenh_truoc_commit(_a):
    loi = soat_hang_cho()
    if loi: chet('KHOÁ PHẦN CHUNG: commit này bị chặn.', *('  - ' + x for x in loi), *LOI_CHAN)
    return 0


def lenh_luu(a):
    if git('rev-parse', '--is-inside-work-tree').returncode:
        chet('Thư mục cutout3d ở máy này chưa nối với repo git của phần chung.', 'Cách nối: BAT-DAU-O-DAY.md, mục Repo git.')
    r = soat() or chet('Chưa có bản niêm.')
    cam = {x[0] for x in r['lech']} | {x[0] for x in r['theo_phieu']}
    them = ['chung/.khoa/niem.json', 'chung/.khoa/goc', *GHI_RIENG] + sorted(rel for rel in r['so']['file'] if rel not in cam)
    for f in a.file:
        rel = rel_cua(f) or chet(f'{f} nằm ngoài cutout3d.')
        dinh = sorted(c for c in cam if c == rel or c.startswith(rel.rstrip('/') + '/'))
        if dinh: chet(f'Không lưu được {rel}: có file đã niêm đang lệch bản niêm hoặc đang sửa dở theo phiếu chưa đóng: ' + ', '.join(dinh[:5]), *LOI_CHAN)
        them.append(rel)
    them = [x for x in them if (GOC / x).exists()]
    if git('config', '--get', 'core.hooksPath').stdout.decode().strip() != MOC_GIT and (GOC / MOC_GIT / 'pre-commit').is_file(): git('config', 'core.hooksPath', MOC_GIT)
    for i in range(0, len(them), 80):
        x = git('add', '-A', '--', *them[i:i + 80])
        if x.returncode:
            e = x.stderr.decode('utf-8', 'replace')
            if 'not permitted' in e or 'index.lock' in e: chet('Lệnh git không ghi được vào .git (sandbox của phiên chặn).', 'Chạy lại đúng lệnh này NGOÀI sandbox.')
            chet('git add lỗi:', e.strip()[-600:])
    loi = soat_hang_cho()
    if loi:
        git('reset', '-q')
        chet('KHÔNG LƯU: hàng chờ đã được trả lại như cũ.', *('  - ' + x for x in loi), *LOI_CHAN)
    if loi is None: print('Không có thay đổi nào của phần chung cần commit.')
    else:
        lenh = ['commit', '-q', '-m', a.mo_ta.strip()]
        if a.duoi: lenh += ['-m', '\n'.join(a.duoi)]
        x = git(*lenh)
        if x.returncode: git('reset', '-q'); chet('git commit lỗi:', (x.stderr + x.stdout).decode('utf-8', 'replace').strip()[-800:])
        print('Đã commit: ' + git('log', '-1', '--format=%h %s').stdout.decode('utf-8', 'replace').strip())
        print(git('show', '--stat', '--format=', 'HEAD').stdout.decode('utf-8', 'replace').rstrip()[-900:])
    con = [d[3:] for d in git('status', '--porcelain').stdout.decode('utf-8', 'replace').splitlines() if d.strip()]
    if con:
        print(f'CHƯA LƯU {len(con)} mục (không tự lưu: món kho mới phải được Daniel duyệt, file đã niêm lệch bản niêm phải có phiếu). Muốn lưu thì kể tên sau lời mô tả:')
        for d in con[:12]: print('  ' + d)
        if len(con) > 12: print(f'  … và {len(con) - 12} mục nữa (git status)')
    if git('remote', 'get-url', 'origin').returncode:
        print('Repo chưa có remote origin: chưa đẩy đi đâu.'); return 0
    x = git('push', '-q', 'origin', 'HEAD')
    if x.returncode:
        print('CHƯA ĐẨY ĐƯỢC lên GitHub (commit vẫn nằm ở máy này; chạy lại lệnh luu hoặc git push khi có mạng, đăng nhập):', file=sys.stderr)
        print(x.stderr.decode('utf-8', 'replace').strip()[-500:], file=sys.stderr); return 2
    print('Đã đẩy lên ' + git('remote', 'get-url', 'origin').stdout.decode().strip() + '. Máy khác nhận bằng: git pull')
    return 0


# ---------------------------------------------------------------- soát
def soat():
    """None nếu chưa niêm. 'lech': file khác bản niêm mà KHÔNG có phiếu đã duyệt; 'theo_phieu': đang sửa theo phiếu; 'moi': file mới chưa niêm."""
    so = doc(F_NIEM)
    if not so: return None
    nho, doi_nho, mo, lech, hien_bam = doc(F_NHO, {}) or {}, False, dang_mo(), [], {}
    for rel, e in so['file'].items():
        p = GOC / rel
        try: st = p.stat()
        except OSError: lech.append((rel, 'xoá')); hien_bam[rel] = 'xoá'; continue
        c = nho.get(rel)
        if c and c[0] == st.st_mtime_ns and c[1] == st.st_size: h = c[2]
        else: h = bam(p); nho[rel] = [st.st_mtime_ns, st.st_size, h]; doi_nho = True
        if h != e['bam']: lech.append((rel, 'sửa')); hien_bam[rel] = h
    if doi_nho:
        try: ghi(F_NHO, nho)
        except OSError: pass
    return {'so': so, 'lech': [x for x in lech if x[0] not in mo], 'theo_phieu': [(r, k, mo[r]) for r, k in lech if r in mo],
            'moi': sorted(r for r in moi_file() if r not in so['file']), 'bam': hien_bam}


def luc_sua(rel):
    try: return time.strftime('%d/%m %H:%M', time.localtime((GOC / rel).stat().st_mtime))
    except OSError: return 'không còn'


def lenh_kiem(a):
    r = soat()
    cho = [p for p in cac_phieu() if p['trang_thai'] == 'cho-duyet']
    mo = [p for p in cac_phieu() if p['trang_thai'] == 'da-duyet']
    if a.hook:
        if not r: return 0
        dong = []
        if r['lech']: dong.append(f"- CẢNH BÁO: {len(r['lech'])} file phần chung đang khác bản niêm mà chưa có phiếu Daniel duyệt: " + ', '.join(x[0] for x in r['lech'][:8]) + (' …' if len(r['lech']) > 8 else '') + '. Hình dựng ra có thể khác trước vì các file này. Nhắc Daniel ở câu mở đầu; không sửa thêm, không tự trả lại, không tự niêm.')
        if cho: dong.append('- Phiếu sửa phần chung đang chờ Daniel duyệt: ' + '; '.join(f"{p['ma']} ({p['ly_do'][:70]})" for p in cho))
        if mo: dong.append('- Phiếu đã duyệt, chưa đóng: ' + '; '.join(f"{p['ma']}" + ('' if hieu_luc(p) else ' (HẾT HẠN)') + f" ({', '.join(p['file'])})" for p in mo))
        if dong: print('\n# Khoá phần chung (chi tiết: trong chung/, python3 tools/khoa_chung.py)\n' + '\n'.join(dong))
        return 0
    if not r: print('Chưa có bản niêm. Lập lần đầu: python3 tools/khoa_chung.py khoi-tao'); return 1
    print(f"KHOÁ PHẦN CHUNG: {len(r['so']['file'])} file đã niêm (lập {r['so']['lap']}).")
    if r['lech']:
        print(f"\nLỆCH BẢN NIÊM, KHÔNG CÓ PHIẾU DANIEL DUYỆT ({len(r['lech'])} file):")
        for rel, k in r['lech']: print(f'  {k:4} {rel}   (lần sửa cuối {luc_sua(rel)})')
        print('  Daniel quyết từng file: GIỮ thì  niem <file…> --loi "<lời Daniel>";  BỎ thì  tra-lai <file…>.  Phiên không tự quyết.')
    else: print('Không file nào lệch bản niêm ngoài phiếu.')
    if r['theo_phieu']:
        print('\nĐang sửa theo phiếu đã duyệt:')
        for rel, k, ma in r['theo_phieu']: print(f'  {k:4} {rel}   (phiếu {ma})')
    if r['moi']: print(f"\nFile mới, chưa niêm ({len(r['moi'])}; sửa tự do cho tới khi niêm): " + ', '.join(r['moi'][:12]) + (' …' if len(r['moi']) > 12 else ''))
    for p in cho + mo: print(); in_phieu(p)
    return 1 if r['lech'] else 0


# ---------------------------------------------------------------- hook
CHAN = """KHOÁ PHẦN CHUNG (Daniel, 26/11/2026). `{rel}` là {loai}: không phiên nào, không agent nào tự sửa.
Lời duyệt cho danh sách lỗi của một tập ("sửa tất cả", "sửa hết đi") KHÔNG phải lời duyệt sửa phần chung.
Làm riêng được ở thư mục kênh (kenh/<kênh>/…) thì làm ở kênh; việc đó không cần phiếu.
Buộc phải sửa phần chung thì làm ĐỦ, ĐÚNG THỨ TỰ (chạy trong chung/):
 1. Không đụng file thật. Làm bản thử ở ngoài: copy file sang kenh/_thu-mau/ (hoặc thư mục kênh), sửa bản copy, cho cảnh thử import bản copy.
 2. Dựng CÙNG một khung hai lần: KHÔNG SỬA (engine đang có) và CÓ SỬA (bản thử). Nên có 2–3 khung khác loại cảnh.{khong_anh}
 3. python3 tools/khoa_chung.py xin --ly-do "<đổi gì, vì sao>" --anh-huong "<kênh, video nào đổi theo>" --o-kenh "<vì sao không làm ở kênh được>" --file {rel} --khong-sua <ảnh> --co-sua <ảnh>
 4. Gửi Daniel tấm so sánh công cụ ghép ra cùng nội dung phiếu, rồi DỪNG. Daniel duyệt đúng phiếu đó thì mới được sửa.
Agent được giao một việc: không xin phiếu; ghi điều cần đổi ở phần chung vào báo cáo.{het_han}"""


def tra(quyet, ly_do):
    print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': quyet, 'permissionDecisionReason': ly_do}}, ensure_ascii=False)); sys.exit(0)


def cau_hoi(viec, duoi):
    """lời hiện trong hộp hỏi Daniel khi một phiên chạy lệnh đổi trạng thái khoá"""
    tu = [t for t in re.findall(r'"[^"]*"|\'[^\']*\'|\S+', duoi)]
    muc = [t for t in tu if not t.startswith(('-', '"', "'"))]
    if viec == 'duyet':
        p = doc(D_PHIEU / f'{muc[0]}.json') if muc else None
        if not p: return f"DANIEL: phiên này chạy lệnh DUYỆT phiếu sửa phần chung ({' '.join(muc) or 'không ghi mã'}) nhưng không có phiếu đó. Nên từ chối."
        anh = f"Ảnh so sánh: {p['tam_so_sanh']}" if p.get('tam_so_sanh') else 'PHIẾU SỬA THỬ, CHƯA CÓ ẢNH "CÓ SỬA": ' + p['thu'] if p.get('thu') else 'Không có ảnh (phiếu chỉ gồm công cụ, luật).'
        return (f"DANIEL: phiên này xin MỞ KHOÁ phần chung theo phiếu {p['ma']}.\nĐổi gì: {p['ly_do'][:300]}\nKênh, video đổi theo: {p['anh_huong'][:200]}\nFile: {', '.join(p['file'])}\n{anh}\n"
                'Chỉ đồng ý khi chính bạn đã xem ảnh và duyệt đúng phiếu này.')
    if viec == 'niem':
        return ('DANIEL: phiên này xin NIÊM LẠI phần chung theo trạng thái file hiện giờ (' + (', '.join(muc) or 'TOÀN BỘ phần chung') + ').\n'
                'Mọi thay đổi chưa duyệt đang có trong các file đó sẽ thành bản gốc. Chỉ đồng ý khi bạn đã quyết giữ các thay đổi này.')
    return 'DANIEL: phiên này xin TRẢ file phần chung về bản niêm (' + (', '.join(muc) or '?') + ').\nThay đổi đang có trong các file đó sẽ mất.'


def lenh_hook(_a):
    try: d = json.load(sys.stdin)
    except ValueError: return 0
    su_kien, cong_cu, vao = d.get('hook_event_name'), d.get('tool_name'), d.get('tool_input') or {}
    if su_kien == 'PreToolUse' and cong_cu in ('Edit', 'Write', 'NotebookEdit'):
        rel = rel_cua(vao.get('file_path') or vao.get('notebook_path'), d.get('cwd'))
        k = loai(rel) if rel else None
        if k == 'khoa': tra('deny', 'chung/.khoa/ là sổ của khoá phần chung: chỉ công cụ tools/khoa_chung.py ghi vào đó. Cách xin sửa phần chung: python3 tools/khoa_chung.py --help')
        so = doc(F_NIEM) if k else None
        if so and rel in so['file'] and rel not in dang_mo():
            het = [p['ma'] for p in cac_phieu() if p.get('trang_thai') == 'da-duyet' and rel in p['file']]
            tra('deny', CHAN.format(rel=rel, loai=TEN_LOAI[k], khong_anh='' if k == 'hinh' else ' File này không làm đổi hình thì phiếu không cần ảnh.',
                                    het_han=f'\nPhiếu {het[-1]} của file này đã duyệt nhưng HẾT HẠN 24 giờ: xin phiếu mới.' if het else ''))
    elif su_kien == 'PreToolUse' and cong_cu == 'Bash':
        m = re.search(r'khoa_chung\.py\S*\s+(duyet|niem|tra-lai)\b([^\n;&|]*)', vao.get('command') or '')
        if m: tra('ask', cau_hoi(m.group(1), m.group(2)))
    elif su_kien == 'PostToolUse' and cong_cu == 'Bash':
        r = soat()
        if r and r['lech']:
            bao = doc(F_BAO, {}) or {}
            moi = [(rel, k) for rel, k in r['lech'] if bao.get(rel) != r['bam'][rel]]
            if moi:
                bao.update({rel: r['bam'][rel] for rel, _ in moi})
                try: ghi(F_BAO, bao)
                except OSError: pass
                so_viec('phat-hien', file=[x[0] for x in moi], phien=d.get('session_id'), agent=d.get('agent_type'))
                print(f'KHOÁ PHẦN CHUNG: sau lệnh vừa rồi, {len(moi)} file phần chung khác bản niêm mà KHÔNG có phiếu Daniel duyệt:\n' + '\n'.join(f'  - {k} {rel}' for rel, k in moi) +
                      '\nNếu chính lệnh của bạn (hay agent của bạn) vừa ghi các file này: bạn đã phá khoá. DỪNG việc đang làm; ngay trong câu trả lời kế tiếp báo Daniel từng file, đã đổi gì, vì sao, và hỏi giữ hay trả lại. Không sửa thêm, không tự trả lại, không tự niêm.'
                      '\nNếu lệnh của bạn không ghi các file này (một phiên khác trên cùng máy đã sửa): báo Daniel một dòng rồi làm tiếp việc của mình.'
                      '\nXem tình trạng: trong chung/, python3 tools/khoa_chung.py', file=sys.stderr)
                return 2
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='lenh')
    s = sub.add_parser('kiem'); s.add_argument('--hook', action='store_true')
    s = sub.add_parser('xin')
    for ten in ('--ly-do', '--anh-huong', '--o-kenh'): s.add_argument(ten, required=True)
    s.add_argument('--file', action='append', required=True); s.add_argument('--khong-sua', action='append', default=[]); s.add_argument('--co-sua', action='append', default=[]); s.add_argument('--thu')
    s = sub.add_parser('duyet'); s.add_argument('ma'); s.add_argument('--loi', required=True)
    s = sub.add_parser('dong'); s.add_argument('ma'); s.add_argument('--co-sua', action='append', default=[]); s.add_argument('--loi')
    s = sub.add_parser('tra-lai'); s.add_argument('muc', nargs='+')
    s = sub.add_parser('niem'); s.add_argument('file', nargs='*'); s.add_argument('--loi', required=True)
    s = sub.add_parser('khoi-tao'); s.add_argument('--goc-khac')
    s = sub.add_parser('phieu'); s.add_argument('ma')
    sub.add_parser('hook'); sub.add_parser('truoc-commit')
    s = sub.add_parser('luu'); s.add_argument('mo_ta'); s.add_argument('file', nargs='*'); s.add_argument('--duoi', action='append', default=[])
    a = ap.parse_args()
    if a.lenh is None: a = ap.parse_args(['kiem'])
    if a.lenh == 'phieu': in_phieu(lay_phieu(a.ma)); return 0
    return {'kiem': lenh_kiem, 'xin': lenh_xin, 'duyet': lenh_duyet, 'dong': lenh_dong, 'tra-lai': lenh_tra_lai, 'niem': lenh_niem, 'khoi-tao': lenh_khoi_tao, 'hook': lenh_hook, 'luu': lenh_luu, 'truoc-commit': lenh_truoc_commit}[a.lenh](a) or 0


if __name__ == '__main__':
    sys.exit(main())
