#!/bin/bash
# usage: ./refstrip.sh <start-frame> <end-frame> [step=3]  -> out/ref-<start>.jpg  (numbered frames of the reference, 5 per row)
cd "$(dirname "$0")"; S=$1; E=$2; K=${3:-3}
ffmpeg -v error -i ../ref/rover_doom.webm -vf "select='between(n\,$S\,$((E-1)))*not(mod(n-$S\,$K))',setpts=N/24/TB,scale=384:216,drawtext=text='%{eif\:n*$K\:d}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=5x4" -frames:v 1 -q:v 3 -y out/ref-$S.jpg && echo out/ref-$S.jpg
