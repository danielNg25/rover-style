"""Cầu nối cho extension flow-gen: mở thư mục chung/gen trong Finder / Explorer, chọn sẵn một ảnh.
Chrome gọi chương trình này qua Native Messaging (tin nhắn JSON có 4 byte độ dài ở đầu).
Chỉ nhận TÊN FILE nằm ngay trong chung/gen, hoặc TÊN một việc trong chung/gen/cho-gen; không nhận đường dẫn, không chạy lệnh nào khác."""
import json, os, struct, subprocess, sys
from pathlib import Path

GEN = Path(__file__).resolve().parents[3] / 'gen'      # chung/tien-ich/flow-gen/may/ → chung/gen


def doc():
    n = sys.stdin.buffer.read(4)
    return json.loads(sys.stdin.buffer.read(struct.unpack('<I', n)[0]).decode('utf-8')) if len(n) == 4 else None


def tra(d):
    b = json.dumps(d, ensure_ascii=False).encode('utf-8'); sys.stdout.buffer.write(struct.pack('<I', len(b)) + b); sys.stdout.buffer.flush()


t = doc() or {}
lay = os.path.basename(str(t.get('lay') or ''))            # lấy ảnh MỚI NHẤT trong thư mục Tải về làm ảnh của một việc
if lay:
    try:
        import shutil, time
        v = json.loads((GEN / 'cho-gen' / lay / 'viec.json').read_text(encoding='utf-8'))
        dich = GEN / os.path.basename(str(v['luu_vao']))
        tai = Path.home() / 'Downloads'
        ds = [f for f in tai.iterdir() if f.is_file() and f.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp')]
        if not ds: raise RuntimeError('không thấy ảnh nào trong ' + str(tai))
        moi = max(ds, key=lambda f: f.stat().st_mtime)
        phut = int((time.time() - moi.stat().st_mtime) / 60)
        if phut >= 10 and not t.get('chac'):
            tra({'ok': False, 'cu': True, 'anh': moi.name, 'phut': phut}); sys.exit(0)
        tam = dich.with_name(dich.name + '.tam.png')
        if moi.suffix.lower() == '.png': shutil.copyfile(moi, tam)
        elif sys.platform == 'darwin':
            r = subprocess.run(['/usr/bin/sips', '-s', 'format', 'png', str(moi), '--out', str(tam)], capture_output=True, text=True, timeout=30)
            if r.returncode or not tam.is_file(): raise RuntimeError('không đổi được sang PNG: ' + (r.stderr or r.stdout).strip()[:200])
        else: raise RuntimeError('ảnh không phải PNG; đổi định dạng mới làm cho macOS')
        os.replace(tam, dich)
        tra({'ok': True, 'anh': moi.name, 'phut': phut, 'luu': 'chung/gen/' + dich.name})
    except Exception as e:
        tra({'ok': False, 'loi': str(e)})
    sys.exit(0)
chep = os.path.basename(str(t.get('chep') or ''))          # chép MỌI ảnh mẫu của một việc vào bộ nhớ tạm (như chép nhiều file trong Finder)
if chep:
    try:
        d = GEN / 'cho-gen' / chep
        anh = [str(d / os.path.basename(a)) for a in json.loads((d / 'viec.json').read_text(encoding='utf-8')).get('anh_mau', [])]
        anh = [a for a in anh if os.path.isfile(a)]
        if not anh: raise RuntimeError('việc này không có ảnh mẫu')
        if sys.platform != 'darwin': raise RuntimeError('chép nhiều ảnh một lần mới làm cho macOS')
        js = ('ObjC.import("AppKit"); function run(argv) { var pb = $.NSPasteboard.generalPasteboard; pb.clearContents; '
              'var u = $.NSMutableArray.alloc.init; for (var i = 0; i < argv.length; i++) u.addObject($.NSURL.fileURLWithPath(argv[i])); var ok = pb.writeObjects(u); return String(ok) + " " + pb.pasteboardItems.count; }')
        r = subprocess.run(['/usr/bin/osascript', '-l', 'JavaScript', '-e', js] + anh, capture_output=True, text=True, timeout=15)
        if r.returncode or r.stdout.split() != ['true', str(len(anh))]: raise RuntimeError((r.stderr or r.stdout).strip() or 'không ghi được bộ nhớ tạm')
        tra({'ok': True, 'so': len(anh)})
    except Exception as e:
        tra({'ok': False, 'loi': str(e)})
    sys.exit(0)
ten = os.path.basename(str(t.get('ten') or ''))
f = GEN / ten if ten else None
viec = os.path.basename(str(t.get('viec') or ''))          # mở thư mục của một việc trong hàng chờ
if viec and (GEN / 'cho-gen' / viec).is_dir(): GEN = GEN / 'cho-gen' / viec
try:
    if sys.platform == 'darwin': subprocess.run(['open', '-R', str(f)] if f and f.is_file() else ['open', str(GEN)], check=True)
    elif os.name == 'nt': subprocess.run(['explorer', '/select,', str(f)] if f and f.is_file() else ['explorer', str(GEN)])
    else: subprocess.run(['xdg-open', str(GEN)], check=True)
    tra({'ok': True, 'thu_muc': str(GEN), 'chon': ten if f and f.is_file() else ''})
except Exception as e:
    tra({'ok': False, 'loi': str(e)})
