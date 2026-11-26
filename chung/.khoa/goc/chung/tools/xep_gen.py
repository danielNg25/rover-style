"""Xếp một lần gen ảnh vào HÀNG CHỜ để Daniel gen trên web (Flow) bằng extension chung/tien-ich/flow-gen.

Daniel, 26/11/2026: gen bằng Flow thì "mỗi lần cop vào rất mất công, tải cả ảnh bối cảnh rồi prompt nữa".
Mỗi việc là một thư mục  chung/gen/cho-gen/<tên>/  gồm:
  loi-ta.txt   lời tả ĐÃ SOÁT (kết quả của tools/kiem_loi_ta.py --in, có dòng đầu "Create ONE image, landscape 16:9.")
  mau-N.<đuôi> các ảnh mẫu kiểu vẽ, theo thứ tự đã đưa
  viec.json    {ten, loai: 'canh' | 'mon', luu_vao: 'gen/<tên>.png', anh_mau: [...], lap: ...}
Extension đọc thư mục chung/gen, dán lời tả và đính ảnh mẫu vào trang gen; ảnh gen xong lưu về gen/<tên>.png.

Dùng (trong chung/):  python3 tools/xep_gen.py <tên>.png gen/prompts/<tên>.txt <ảnh mẫu> [ảnh mẫu ...]
                      python3 tools/xep_gen.py --xem          liệt kê hàng chờ (việc nào đã có ảnh)
Lời tả chưa qua được kiem_loi_ta.py thì không xếp (thoát 1). gen.sh tự gọi công cụ này khi Codex hết hạn mức, hoặc khi GEN_QUA=flow.
"""
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent          # chung/
CHO = GOC / 'gen' / 'cho-gen'


def xem():
    viec = sorted(CHO.glob('*/viec.json')) if CHO.is_dir() else []
    if not viec: print('Hàng chờ trống.'); return 0
    for f in viec:
        v = json.loads(f.read_text(encoding='utf-8')); co = (GOC / v['luu_vao']).is_file(); bo = (f.parent / 'da-bo.txt').is_file()   # da-bo.txt: Daniel bỏ việc này trong extension
        print(f"  {'DANIEL ĐÃ BỎ (không nhắc lại, không gen)' if bo else 'ĐÃ CÓ ẢNH' if co else 'chờ gen  '}  {v['ten']:36} {v['loai']:5} {len(v['anh_mau'])} ảnh mẫu → {v['luu_vao']}")
    return 0


def main(a):
    if a == ['--xem']: return xem()
    if len(a) < 2: print(__doc__); return 1
    ra, ta, mau = a[0], a[1], a[2:]
    ten = Path(ra).name[:-4] if ra.lower().endswith('.png') else Path(ra).name
    kiem = [sys.executable, str(GOC / 'tools' / 'kiem_loi_ta.py'), ta]
    r = subprocess.run(kiem + ['--in'], capture_output=True, text=True, cwd=GOC)
    if r.returncode:
        sys.stderr.write(r.stderr); print(f'KHÔNG XẾP: lời tả {ta} chưa qua tools/kiem_loi_ta.py', file=sys.stderr); return 1
    loai = subprocess.run(kiem + ['--loai'], capture_output=True, text=True, cwd=GOC).stdout.strip() or 'mon'
    thieu = [m for m in mau if not (GOC / m).is_file() and not Path(m).is_file()]
    if thieu: print('KHÔNG XẾP: không thấy ảnh mẫu ' + ', '.join(thieu), file=sys.stderr); return 1
    d = CHO / ten
    if d.exists(): shutil.rmtree(d)
    d.mkdir(parents=True)
    (d / 'loi-ta.txt').write_text('Create ONE image, landscape 16:9.\n' + r.stdout.strip() + '\n', encoding='utf-8')
    ds = []
    for k, m in enumerate(mau, 1):
        p = GOC / m if (GOC / m).is_file() else Path(m); dich = d / f'mau-{k}{p.suffix.lower()}'
        shutil.copyfile(p, dich); ds.append(dich.name)
    (d / 'viec.json').write_text(json.dumps({'ten': ten, 'loai': loai, 'luu_vao': f'gen/{ten}.png', 'anh_mau': ds, 'loi_ta_goc': ta, 'lap': time.strftime('%Y-%m-%d %H:%M')}, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'ĐÃ XẾP VÀO HÀNG CHỜ: gen/cho-gen/{ten}/  ({"tranh bối cảnh mẫu" if loai == "canh" else "tấm đồ nền hồng"}, {len(ds)} ảnh mẫu). Ảnh gen xong lưu vào: {GOC}/gen/{ten}.png')
    print('Báo Daniel TÊN VIỆC này; ông mở extension flow-gen, chọn thư mục chung/gen, bấm vào việc là lời tả và ảnh mẫu được đưa vào trang gen.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
