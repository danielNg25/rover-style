#!/bin/bash
# Dùng: render-thu-lai.sh <mã> <số cảnh...>  — dựng từng cảnh vào out/<mã>/ghep/, tự thử lại khi dự án đang bị sửa dở
cd "$(cd "$(dirname "$0")/.." && pwd)" || exit 1   # thư mục chung/, tính từ chỗ của script
MA=$1; shift
O=../kenh/phim-tv/out; D=$O/$MA/ghep; mkdir -p $D
for n in "$@"; do
  ok=0
  for thu in 1 2 3 4 5 6 7 8; do
    rm -f $O/$MA-$n.mp4
    ./render-video.sh $MA-$n 1.5 > $D/log-$n.txt 2>&1
    if [ -f $O/$MA-$n.mp4 ]; then mv $O/$MA-$n.mp4 $D/$MA-$n.mp4; ok=1; echo "xong $n (lượt $thu)"; break; fi
    echo "lượt $thu hỏng $n: $(grep -m1 -i error $D/log-$n.txt)"; sleep 60
  done
  [ $ok = 1 ] || { echo "HỎNG HẲN $n"; exit 1; }
done
echo "XONG HẾT"
