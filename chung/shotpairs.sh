#!/bin/bash
# usage: ./shotpairs.sh <shot-id> <ref-start-frame> <f1> [f2 f3]
# Renders frames f1.. of composition shot-<id> and pairs each with the reference frame (ref-start-frame + f). -> out/pairs-<id>.jpg
cd "$(dirname "$0")"
source "$(cd "$(dirname "$0")" && pwd)/tools/chrome.sh"   # đặt BX (Chrome không đầu), không ghi cứng theo máy
ID=$1; START=$2; shift 2; D=out/kf-$ID; rm -rf $D; mkdir -p $D; i=0; INS=""
for fr in "$@"; do
  npx remotion still src/index.ts shot-$ID $D/f$fr.png --frame=$fr --browser-executable="$BX" --scale=0.75 --log=error 2>&1 | grep -v "npm notice" | tail -3
  ffmpeg -v error -i ../ref/rover_doom.webm -vf "select='eq(n\,$((START+fr)))',scale=960:540" -frames:v 1 -y $D/r$fr.png
  ffmpeg -v error -i $D/r$fr.png -i $D/f$fr.png -filter_complex "[1]scale=960:540[b];[0][b]hstack" -y $D/p$i.png; INS="$INS -i $D/p$i.png"; i=$((i+1))
done
if [ $i -gt 1 ]; then ffmpeg -v error $INS -filter_complex vstack=inputs=$i -q:v 3 -y out/pairs-$ID.jpg; else ffmpeg -v error -i $D/p0.png -q:v 3 -y out/pairs-$ID.jpg; fi
echo out/pairs-$ID.jpg
