#!/usr/bin/env python3
"""strip.py VIDEO FIRST_FRAME N X,Y,W,H OUT.jpg [cell=160]   consecutive frames of one part of the picture, side by side.
For LOOKING at how a movement is drawn frame by frame (how many drawings, how long each is held, how it starts and settles)."""
import subprocess, sys
v, f0, n, box, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]; cell = int(sys.argv[6]) if len(sys.argv) > 6 else 160
x, y, w, h = box.split(',')
fps = float(eval(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout.strip().rstrip(',')))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{f0 / fps:.4f}', '-i', v, '-frames:v', str(n), '-vf', f'crop={w}:{h}:{x}:{y},scale={cell}:-2,tile={n}x1', '-frames:v', '1', '-update', '1', '-q:v', '3', out], check=True)
