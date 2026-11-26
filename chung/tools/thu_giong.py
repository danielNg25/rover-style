#!/usr/bin/env python3
"""Thu giọng ElevenLabs cho một tập, từng chương một, có mốc thời gian từng câu.

  python3 tools/thu_giong.py [<thư mục tập>] [--only 3,4] [--gap 0.6] [--force]
      (bỏ trống thư mục tập: lấy tập đang làm trong dang-lam.yaml, tức ../kenh/<kênh>/tap/<tập>)

Đọc:  <tập>/script.md (một câu một dòng; `## N. Tên chương (~m:ss)`; bỏ dòng `*[…]*`, `>`, `-`, mục `## Ghi chú…`)
      khối `giong:` trong ../kenh/<kênh>/kenh.yaml (voice_id, model, language_code, output_format); kênh: dang-lam.yaml
      khoá ELEVENLABS_API_KEY trong ../studio-template/.env (không in ra; truyền cho curl qua file header tạm)
Ghi:  <tập>/voice/ch-NN.mp3, ch-NN.timing.json (mốc từng kí tự), ch-NN.txt (lời đã thu, để biết chương nào đổi)
      <tập>/voice/timing.tsv  (chương, câu, bắt đầu, kết thúc tính trên bản ghép, số tiếng, lời)
      <tập>/voice/tap.mp3     (ghép các chương, giữa hai chương chèn --gap giây im lặng)
Chương nào lời không đổi thì không thu lại (trừ khi --force). Gọi bằng curl vì python3 của máy không có chứng chỉ gốc.
Trong sandbox phải cho phép api.elevenlabs.io.
"""
import argparse, base64, json, os, pathlib, re, subprocess, sys, tempfile

HERE = pathlib.Path(__file__).resolve().parent.parent          # cutout3d/chung
sys.path.insert(0, str(HERE / 'tools'))
from dang_lam import KENH_DIR, TAP_DIR  # kênh và tập đang làm (dang-lam.yaml)


def read_voice():
    """Khối `giong:` của kenh.yaml: các dòng thụt vào ngay sau `giong:`."""
    cfg, inside = {}, False
    for l in (KENH_DIR / 'kenh.yaml').read_text(encoding='utf-8').split('\n'):
        if re.match(r'^\S', l):
            inside = l.startswith('giong:')
            continue
        m = re.match(r'^\s+(\w+):\s*([^#\n]+)', l)
        if inside and m:
            cfg[m.group(1)] = m.group(2).strip()
    return cfg


def read_key():
    for l in (HERE.parent.parent / 'studio-template' / '.env').read_text().split('\n'):
        m = re.match(r'^ELEVENLABS_API_KEY=(.*)$', l.strip())
        if m:
            return m.group(1).strip().strip('"').strip("'")
    sys.exit('không thấy ELEVENLABS_API_KEY trong studio-template/.env')


def chapters(script):
    out, cur = [], None
    for l in script.read_text(encoding='utf-8').split('\n'):
        s = l.strip()
        if s.startswith('## '):
            if s[3:].lower().startswith('ghi chú'):
                break
            cur = {'title': re.sub(r'\s*\(.*?\)\s*$', '', s[3:]).strip(), 'sents': []}
            out.append(cur)
        elif cur is not None and s and not s.startswith(('*[', '>', '-', '#', '**')):
            cur['sents'].append(s)
    return out


def sentence_times(al, sents):
    """Mốc từng câu từ alignment kí tự: dò lần lượt từng câu trong chuỗi kí tự đã thu."""
    chars, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    text = ''.join(chars)
    res, pos = [], 0
    for s in sents:
        i = text.find(s, pos)
        if i < 0:                       # khác khoảng trắng: dò theo kí tự không trắng
            key = re.sub(r'\s+', '', s)
            j, k, i0 = pos, 0, None
            while j < len(chars) and k < len(key):
                if not chars[j].isspace():
                    if chars[j] == key[k]:
                        if i0 is None:
                            i0 = j
                        k += 1
                    else:
                        k, i0 = 0, None
                j += 1
            if k < len(key):
                sys.exit('không khớp được câu với mốc thời gian: ' + s[:50])
            i, e = i0, j - 1
        else:
            e = i + len(s) - 1
        res.append((st[i], en[e]))
        pos = e + 1
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ep', nargs='?', default=str(TAP_DIR))
    ap.add_argument('--only')
    ap.add_argument('--gap', type=float, default=0.6)
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    ep = pathlib.Path(a.ep).resolve()
    vdir = ep / 'voice'
    vdir.mkdir(exist_ok=True)
    cfg = read_voice()
    chs = chapters(ep / 'script.md')
    only = set(int(x) for x in a.only.split(',')) if a.only else None
    key = read_key()
    hdr = tempfile.NamedTemporaryFile('w', suffix='.hdr', delete=False)
    hdr.write('xi-api-key: ' + key + '\nContent-Type: application/json\n')
    hdr.close()
    os.chmod(hdr.name, 0o600)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{cfg['voice_id']}/with-timestamps?output_format={cfg.get('output_format', 'mp3_44100_128')}"
    made = 0
    try:
        for n, ch in enumerate(chs, start=1):
            text = ' '.join(ch['sents'])
            base = vdir / f'ch-{n:02d}'
            if only and n not in only:
                continue
            old = base.with_suffix('.txt')
            if not a.force and old.exists() and old.read_text(encoding='utf-8') == text and base.with_suffix('.mp3').exists():
                continue
            body = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8')
            json.dump({'text': text, 'model_id': cfg['model'], 'language_code': cfg.get('language_code', 'vi')}, body, ensure_ascii=False)
            body.close()
            outj = body.name + '.out'
            r = subprocess.run(['curl', '-sS', '-m', '300', '-X', 'POST', '-H', '@' + hdr.name, '--data-binary', '@' + body.name, url, '-o', outj, '-w', '%{http_code}'], capture_output=True, text=True)
            code = r.stdout.strip()
            if code != '200':
                msg = open(outj, encoding='utf-8', errors='replace').read()[:300] if os.path.exists(outj) else r.stderr[:300]
                sys.exit(f'chương {n}: lỗi {code}: {msg}')
            d = json.load(open(outj, encoding='utf-8'))
            base.with_suffix('.mp3').write_bytes(base64.b64decode(d['audio_base64']))
            base.with_suffix('.timing.json').write_text(json.dumps({'alignment': d.get('alignment'), 'normalized_alignment': d.get('normalized_alignment')}, ensure_ascii=False), encoding='utf-8')
            old.write_text(text, encoding='utf-8')
            os.unlink(body.name); os.unlink(outj)
            made += 1
            print(f'chương {n:2d}: đã thu ({len(text)} kí tự)', flush=True)
    finally:
        os.unlink(hdr.name)

    # ghép và lập bảng mốc
    rows, t0, parts = [], 0.0, []
    sil = vdir / '_im-lang.mp3'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', str(a.gap), '-b:a', '128k', str(sil)], check=True)
    for n, ch in enumerate(chs, start=1):
        base = vdir / f'ch-{n:02d}'
        if not base.with_suffix('.mp3').exists():
            print(f'chương {n}: chưa có bản thu, bỏ qua khi ghép'); continue
        al = json.loads(base.with_suffix('.timing.json').read_text(encoding='utf-8'))['alignment']
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(base.with_suffix('.mp3'))], capture_output=True, text=True).stdout.strip())
        for (s, e), sent in zip(sentence_times(al, ch['sents']), ch['sents']):
            rows.append((n, ch['title'], round(t0 + s, 2), round(t0 + e, 2), len(sent.split()), sent))
        parts += [base.with_suffix('.mp3'), sil]
        t0 += dur + a.gap
    lst = vdir / '_ghep.txt'
    lst.write_text(''.join(f"file '{p}'\n" for p in parts[:-1]), encoding='utf-8')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c:a', 'libmp3lame', '-b:a', '128k', str(vdir / 'tap.mp3')], check=True)
    with open(vdir / 'timing.tsv', 'w', encoding='utf-8') as f:
        f.write('chương\ttên chương\tbắt đầu\tkết thúc\ttiếng\tlời\n')
        for r in rows:
            f.write('\t'.join(str(x) for x in r) + '\n')
    total = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(vdir / 'tap.mp3')], capture_output=True, text=True).stdout.strip())
    syl = sum(r[4] for r in rows)
    print(f'thu mới {made} chương | {len(rows)} câu, {syl} tiếng | bản ghép dài {int(total // 60)}:{int(total % 60):02d} ({syl / total * 60:.0f} tiếng một phút kể cả quãng nghỉ)')


if __name__ == '__main__':
    main()
