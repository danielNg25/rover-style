// In các file nguồn dưới kenh/ có trong gói của một file vào: node tools/goi_kenh.mjs ../kenh/<kênh>/entry.ts (phép thử "phần chung không kéo kênh khác").
import {bundle} from '@remotion/bundler';
import fs from 'node:fs'; import path from 'node:path';
const out = await bundle({entryPoint: path.resolve(process.argv[2]), enableCaching: false});
const files = fs.readdirSync(out).filter((f) => f.endsWith('.map'));
const src = new Set();
for (const f of files) for (const s of JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')).sources || []) src.add(s);
const k = [...src].filter((s) => /kenh\//.test(s)).sort();
console.log(`gói ${process.argv[2]}: ${src.size} file nguồn (${files.length} source map); dưới kenh/: ${k.length}`);
for (const s of k) console.log('  ' + s);
