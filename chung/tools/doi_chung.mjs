// Dựng hàng loạt ảnh đối chứng từ MỘT gói (bundle một lần, một trình duyệt): node tools/doi_chung.mjs <entry> <thư mục ra> [all|kho] [regex id]
// all: mọi composition, khung đầu + giữa + cuối, cỡ 0.5 (rộng hơn 2000 thì 0.25); kho: mọi khung của kho-asset*, cỡ 1. SKIP=<regex> bỏ qua id.
// Lưu ý (23/11/2026): dựng nhiều composition trong một phiên trình duyệt thì vài khung lệch 2-16 điểm ảnh theo THỨ TỰ dựng (bộ đệm
// texture); muốn biết code có đổi hình không thì dựng riêng các khung lệch từ bản code cũ và mới cùng một kiểu rồi so.
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill, openBrowser} from '@remotion/renderer';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const [entry, out, mode = 'all', only = ''] = process.argv.slice(2);
const BX = (() => { if (process.env.CUTOUT3D_CHROME) return process.env.CUTOUT3D_CHROME; const goc = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell'), ghim = path.join(goc, 'mac_arm-146.0.7680.31', 'chrome-headless-shell-mac-arm64/chrome-headless-shell'); if (fs.existsSync(ghim)) return ghim; const c = fs.readdirSync(goc).sort().flatMap((v) => fs.readdirSync(path.join(goc, v)).map((d) => path.join(goc, v, d, 'chrome-headless-shell'))).filter((x) => fs.existsSync(x)); return c[c.length - 1]; })();   // Chrome không đầu, không ghi cứng theo máy
const SKIP = new RegExp(process.env.SKIP ?? '^$^');
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve(entry), enableCaching: false});
const browser = await openBrowser('chrome', {browserExecutable: BX, chromiumOptions: {gl: 'angle'}});
const comps = await getCompositions(serveUrl, {puppeteerInstance: browser, browserExecutable: BX, chromiumOptions: {gl: 'angle'}});
const list = [];
for (const c of comps) {
  if (SKIP.test(c.id)) continue;
  if (only && !new RegExp(only).test(c.id)) continue;
  if (mode === 'kho') { if (/^kho-asset/.test(c.id)) for (let f = 0; f < c.durationInFrames; f++) list.push([c, f, 1]); continue; }
  if (/^kho-asset/.test(c.id)) continue;
  const fr = [...new Set([0, Math.floor((c.durationInFrames - 1) / 2), c.durationInFrames - 1])];
  for (const f of fr) list.push([c, f, c.width > 2000 ? 0.25 : 0.5]);
}
fs.writeFileSync(path.join(out, '_ids.txt'), comps.map((c) => `${c.id}\t${c.durationInFrames}\t${c.width}x${c.height}`).join('\n'));
let n = 0, bad = 0;
for (const [c, f, scale] of list) {
  const file = path.join(out, `${c.id}@${f}.png`);
  try { await renderStill({composition: c, serveUrl, output: file, frame: f, scale, puppeteerInstance: browser, browserExecutable: BX, chromiumOptions: {gl: 'angle'}, overwrite: true}); n++; }
  catch (e) { bad++; fs.appendFileSync(path.join(out, '_loi.txt'), `${c.id}@${f}: ${String(e).slice(0, 300)}\n`); }
}
await browser.close({silent: true});
console.log(`xong ${n} ảnh, lỗi ${bad}, ${comps.length} composition`);
