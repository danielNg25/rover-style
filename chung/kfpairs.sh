#!/bin/bash
# renders six key frames of hall-seq as stills and pairs them with the reference: out/pairs-A.jpg, out/pairs-B.jpg
cd "$(dirname "$0")"
source "$(cd "$(dirname "$0")" && pwd)/tools/chrome.sh"   # đặt BX (Chrome không đầu), không ghi cứng theo máy
FR=(${@:-14 34 60 90 135 195}); rm -f out/kf/*.png; mkdir -p out/kf; i=0
for fr in "${FR[@]}"; do
  npx remotion still src/index.ts hall-seq out/kf/f$fr.png --frame=$fr --browser-executable="$BX" --scale=0.75 --log=error 2>&1 | grep -v "npm notice" | tail -2
  ffmpeg -v error -i out/ref-seq.mp4 -vf "select='eq(n\,$fr)',scale=960:540" -frames:v 1 -y out/kf/r$fr.png
  ffmpeg -v error -i out/kf/r$fr.png -i out/kf/f$fr.png -filter_complex "[1]scale=960:540[b];[0][b]hstack" -y out/kf/p$i.png; i=$((i+1))
done
ffmpeg -v error -i out/kf/p0.png -i out/kf/p1.png -i out/kf/p2.png -filter_complex vstack=inputs=3 -q:v 3 -y out/pairs-A.jpg
ffmpeg -v error -i out/kf/p3.png -i out/kf/p4.png -i out/kf/p5.png -filter_complex vstack=inputs=3 -q:v 3 -y out/pairs-B.jpg
echo ok
