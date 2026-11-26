#!/bin/bash
# Dùng: tools/kiem-canh.sh <comp> [comp...]   (chạy ngoài sandbox: Chrome không khởi động được trong sandbox)
# Một lệnh kiểm cho mỗi cảnh: dựng cỡ 0,5 -> tấm 9 khung -> độ sáng -> vật lý. Kết quả: ../kenh/<kênh>/out/kiem-canh/<comp>.jpg
# Thoát khác 0 nếu có cảnh không dựng được, tối, hoặc có khung tím (người xuyên đồ vật).
source "$(cd "$(dirname "$0")" && pwd)/chrome.sh"   # đặt BX (Chrome không đầu), không ghi cứng theo máy
cd "$(dirname "$0")/.." || exit 1
source tools/dang-lam.sh
[ -z "$1" ] && { echo "Dùng: tools/kiem-canh.sh <comp> [comp...]"; exit 2; }
D="$OUT/kiem-canh"; mkdir -p "$D"; loi=0
for C in "$@"; do
  V="$D/$C.mp4"; rm -f "$V"
  npx remotion render "$ENTRY" "$C" "$V" --scale=0.5 --browser-executable="$BX" --log=error 2>&1 | grep -v "npm notice" | tail -6
  [ -f "$V" ] || { echo "$C: KHÔNG DỰNG ĐƯỢC"; loi=1; continue; }
  N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$V" | tr -d ',')
  B=$(( N > 9 ? N / 9 : 1 ))
  if [ "$N" -le 1 ]; then   # ảnh tĩnh một khung (bảng phân cảnh): do_sang.py không đọc được video một khung, nên đo trên ảnh
    ffmpeg -v error -y -i "$V" -frames:v 1 -update 1 -q:v 3 "$D/$C.jpg"
    echo "== $C: 1 khung: $D/$C.jpg"
    python3 tools/do_sang.py "$D/$C.jpg" || loi=1
  else
    ffmpeg -v error -y -i "$V" -vf "select='not(mod(n,$B))',scale=426:-2,tile=3x3" -frames:v 1 -fps_mode vfr -q:v 3 "$D/$C.jpg"
    echo "== $C: $N khung; tấm 9 khung (mỗi $B khung): $D/$C.jpg"
    python3 tools/do_sang.py "$V" || loi=1
  fi
  UV_CACHE_DIR="$TMPDIR/uvcache" UV_TOOL_DIR="$TMPDIR/uvtools" UV_PYTHON_INSTALL_DIR="$TMPDIR/uvpy" \
    uv run --offline --no-project --with opencv-python-headless --with numpy python tools/vatly.py "$C" || loi=1
done
exit $loi
