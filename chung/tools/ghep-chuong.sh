#!/bin/bash
# Dùng: ghep.sh <mã> <giây bắt đầu> <số giây> <tên file ra> "<các cảnh để ghép, theo thứ tự>" [các cảnh cần dựng lại...]
cd "$(cd "$(dirname "$0")/.." && pwd)" || exit 1   # thư mục chung/, tính từ chỗ của script
MA=$1; SS=$2; T=$3; RA=$4; DS=$5; shift 5
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
cd $D && : > list.txt && for n in $DS; do [ -f $MA-$n.mp4 ] || { echo "THIẾU $n"; exit 1; }; echo "file '$MA-$n.mp4'" >> list.txt; done
ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy hinh.mp4 && \
ffmpeg -v error -y -i hinh.mp4 -ss $SS -t $T -i ../../../tap/doom-1/voice/tap.mp3 -map 0:v -map 1:a -c:v libx264 -crf 21 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest ../$RA && echo "XONG $RA $(ffprobe -v error -show_entries format=duration -of csv=p=0 ../$RA)"
tong=0; for n in $DS; do k=$(ffprobe -v error -select_streams v -show_entries stream=nb_frames -of csv=p=0 $MA-$n.mp4 | tr -d ","); tong=$((tong+k)); echo -n "$n:$k "; done; echo "tổng $tong"
