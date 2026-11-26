"""autograde.py - render a still, measure it against the reference norms of its kind of place, and re-render with the
light gain the measurement asks for, until the brightness sits within 6 % of the class middle (3 passes at most).
usage (from rover-lab/, outside the sandbox because it starts the browser):  python3 tools/autograde.py COMP CLASS
The composition must read its light gain from the input prop `gain`. Prints the final gain and the class check."""
import subprocess, sys, json, re, os
comp, cls = sys.argv[1], sys.argv[2]; BX = __import__('chrome').bx()
env = dict(os.environ, UV_CACHE_DIR=os.environ.get('TMPDIR', '/tmp') + '/uvcache', UV_TOOL_DIR=os.environ.get('TMPDIR', '/tmp') + '/uvtools', UV_PYTHON_INSTALL_DIR=os.environ.get('TMPDIR', '/tmp') + '/uvpy')
gain = 1.0; out = f'out/{comp}-0.png'
for i in range(3):
    subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', comp, out, '--frame=0', f'--browser-executable={BX}', '--log=error', f'--props={json.dumps({"gain": round(gain, 3)})}'], check=True, capture_output=True)
    r = subprocess.run(['uv', 'run', '--offline', '--no-project', '--with', 'opencv-python-headless', '--with', 'numpy', 'python', 'rover-lab/tools/classnorms.py', 'check', f'rover-lab/{out}', cls], capture_output=True, text=True, cwd='..', env=env).stdout
    k = float(re.search(r'x([\d.]+)', r).group(1)); print(f'pass {i + 1}: gain {gain:.2f} -> measured needs x{k:.2f}')
    if abs(k - 1) < 0.06: break
    gain *= k
print(f'final gain {gain:.2f}\n' + r)
