#!/bin/bash
# builds out/pairs-A.jpg and out/pairs-B.jpg: matching frames (left: reference, right: ours) at key moments
cd "$(dirname "$0")"
mk() { # name, frames...
  local name=$1; shift; local ins=""; local n=0; local fc=""
  for fr in "$@"; do
    ffmpeg -v error -i out/ref-seq.mp4 -vf "select='eq(n\,$fr)',scale=960:540" -frames:v 1 -y out/_r$fr.png
    ffmpeg -v error -i out/hall-seq.mp4 -vf "select='eq(n\,$fr)',scale=960:540" -frames:v 1 -y out/_m$fr.png
    ffmpeg -v error -i out/_r$fr.png -i out/_m$fr.png -filter_complex hstack -y out/_p$n.png; n=$((n+1))
  done
  if [ $n = 3 ]; then ffmpeg -v error -i out/_p0.png -i out/_p1.png -i out/_p2.png -filter_complex vstack=inputs=3 -q:v 3 -y out/$name.jpg; else ffmpeg -v error -i out/_p0.png -i out/_p1.png -filter_complex vstack=inputs=2 -q:v 3 -y out/$name.jpg; fi
  rm -f out/_r*.png out/_m*.png out/_p*.png
}
mk pairs-A 14 34 60
mk pairs-B 90 135 195
