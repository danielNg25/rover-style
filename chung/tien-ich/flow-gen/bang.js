// Bảng bên cạnh: đọc hàng chờ chung/gen/cho-gen, đưa lời tả và ảnh mẫu của một việc vào trang gen đang mở, rồi lưu ảnh về gen/<tên>.png.
const $ = (id) => document.getElementById(id);
let goc = null;          // FileSystemDirectoryHandle của chung/gen
const bao = (t, loai = '') => { $('bao').textContent = t; $('bao').className = loai; };

// ---- nhớ thư mục đã chọn (IndexedDB giữ được handle)
const kho = () => new Promise((ok, loi) => { const r = indexedDB.open('c3d', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = () => loi(r.error); });
const nho = async (v) => { const d = await kho(); d.transaction('k', 'readwrite').objectStore('k').put(v, 'goc'); };
const lay = async () => { const d = await kho(); return new Promise((ok) => { const r = d.transaction('k').objectStore('k').get('goc'); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); };

const coFile = async (thuMuc, ten) => { try { await thuMuc.getFileHandle(ten); return true; } catch { return false; } };
const docChu = async (thuMuc, ten) => (await (await thuMuc.getFileHandle(ten)).getFile()).text();

// Người dùng chọn cutout3d, chung hay gen đều được: tự tìm tới thư mục gen (nơi có cho-gen).
async function timGen(h) {
  for (const duong of [[], ['gen'], ['chung', 'gen']]) {
    try { let t = h; for (const d of duong) t = await t.getDirectoryHandle(d); await t.getDirectoryHandle('cho-gen'); return t; } catch { /* thử đường kế */ }
  }
  for (const duong of [['chung', 'gen'], ['gen']]) {   // chưa có cho-gen (chưa phiên nào xếp việc): vẫn nhận thư mục gen
    try { let t = h; for (const d of duong) t = await t.getDirectoryHandle(d); return t; } catch { /* thử đường kế */ }
  }
  return null;
}

async function docHangCho() {
  $('ds').textContent = '';
  let cho;
  try { cho = await goc.getDirectoryHandle('cho-gen'); }
  catch { bao('Hàng chờ trống: chưa phiên nào xếp việc (thư mục gen chưa có "cho-gen").'); return; }
  const viec = [];
  for await (const [ten, h] of cho.entries()) {
    if (h.kind !== 'directory' || !(await coFile(h, 'viec.json'))) continue;
    try { const v = JSON.parse(await docChu(h, 'viec.json')); viec.push({v, h, xong: await coFile(goc, v.luu_vao.replace(/^gen\//, '')), bo: await coFile(h, 'da-bo.txt')}); } catch { /* việc hỏng: bỏ qua */ }
  }
  viec.sort((a, b) => (a.xong - b.xong) || a.v.ten.localeCompare(b.v.ten));
  if (!viec.length) { bao('Hàng chờ trống.'); return; }
  const con = viec.filter((x) => !x.bo), daBo = viec.filter((x) => x.bo);
  bao(`${con.filter((x) => !x.xong).length} việc chờ gen, ${con.filter((x) => x.xong).length} việc đã có ảnh` + (daBo.length ? `, ${daBo.length} việc đã bỏ.` : '.'));
  for (const x of con) veViec(x);
  if (daBo.length) {
    const n = document.createElement('button'); n.textContent = `Hiện ${daBo.length} việc đã bỏ`; n.style.marginTop = '6px';
    n.onclick = () => { n.remove(); for (const x of daBo) veViec(x); }; $('ds').append(n);
  }
}

function veViec({v, h, xong, bo}) {
  const o = document.createElement('div'); o.className = 'viec ' + (bo ? 'bo' : xong ? 'co' : 'chua');
  const nhan = document.createElement('span'); nhan.className = 'nhan'; nhan.textContent = bo ? 'ĐÃ BỎ' : xong ? 'ĐÃ CÓ ẢNH' : 'CHƯA CÓ ẢNH'; o.append(nhan);
  const tieu = document.createElement('h2'); tieu.textContent = v.ten; o.append(tieu);
  const mo = document.createElement('div'); mo.className = 'mo';
  mo.textContent = `${v.loai === 'canh' ? 'tranh bối cảnh mẫu' : 'tấm đồ nền hồng'} · ${v.anh_mau.length} ảnh mẫu · lưu vào ${v.luu_vao}`; o.append(mo);
  const anh = document.createElement('div'); anh.className = 'anh'; o.append(anh);
  (async () => { for (const t of v.anh_mau) { const f = await (await h.getFileHandle(t)).getFile(); const i = document.createElement('img'); i.src = URL.createObjectURL(f); i.title = t; anh.append(i); } })();
  const hang = document.createElement('div'); hang.className = 'hang';
  const nut = (chu, lop, lam) => { const b = document.createElement('button'); b.textContent = chu; if (lop) b.className = lop; b.onclick = async () => { try { await lam(b); } catch (e) { bao('Lỗi: ' + (e.message || e), 'loi'); } }; hang.append(b); return b; };
  nut('Đưa vào trang gen', 'chinh', async () => { document.querySelectorAll('.viec').forEach((e) => e.classList.remove('dang')); o.classList.add('dang'); await duaVao(v, h); });
  nut('Chép lời tả', '', async () => { await navigator.clipboard.writeText(await docChu(h, 'loi-ta.txt')); bao('Đã chép lời tả của ' + v.ten + '.'); });
  nut('Lưu ảnh đã tải về', '', async () => { await luuAnh(v); });
  if (bo) nut('Khôi phục', '', async () => { await h.removeEntry('da-bo.txt'); bao('Đã khôi phục việc ' + v.ten + '.'); await docHangCho(); });
  else nut('Bỏ việc này', '', async () => {
    if (!confirm(`Bỏ việc "${v.ten}"? Việc sẽ ẩn khỏi hàng chờ; phiên xem hàng chờ sẽ thấy nó ghi "đã bỏ". Khôi phục lại được.`)) return;
    const w = await (await h.getFileHandle('da-bo.txt', {create: true})).createWritable(); await w.write('Daniel bỏ việc này trong extension flow-gen, ' + new Date().toLocaleString('vi-VN') + '\n'); await w.close();
    bao('Đã bỏ việc ' + v.ten + '.'); await docHangCho();
  });
  nut('Xem lời tả', '', async (b) => { let p = o.querySelector('pre'); if (p) { p.remove(); return; } p = document.createElement('pre'); p.textContent = await docChu(h, 'loi-ta.txt'); o.append(p); });
  o.append(hang); $('ds').append(o);
}

const thanhDataURL = (f) => new Promise((ok, loi) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => loi(r.error); r.readAsDataURL(f); });

async function duaVao(v, h) {
  const loiTa = await docChu(h, 'loi-ta.txt'), anh = [];
  for (const t of v.anh_mau) { const f = await (await h.getFileHandle(t)).getFile(); anh.push({ten: t, kieu: f.type || 'image/jpeg', du: await thanhDataURL(f)}); }
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  if (!tab) { bao('Không thấy thẻ trang gen đang mở.', 'loi'); return; }
  const [kq] = await chrome.scripting.executeScript({target: {tabId: tab.id}, func: trongTrang, args: [loiTa, anh, $('cach').value]});
  const r = kq && kq.result;
  if (!r) { bao('Trang không trả lời. Trang này có nằm trong danh sách được phép của extension không?', 'loi'); return; }
  bao((r.ok ? '' : 'CHƯA XONG. ') + r.bao + (r.ok ? `\nKiểm trên trang: đủ ${anh.length} ảnh mẫu và đúng lời tả rồi hãy bấm tạo. Tải ảnh ưng ý về, rồi bấm "Lưu ảnh đã tải về".` : ''), r.ok ? 'xong' : 'loi');
}

// Chạy TRONG trang gen (không dùng được biến bên ngoài).
async function trongTrang(loiTa, anh, cach) {
  const o = window.__c3dONhap && document.contains(window.__c3dONhap) ? window.__c3dONhap : document.activeElement;
  const laONhap = o && (o.tagName === 'TEXTAREA' || o.tagName === 'INPUT' || o.isContentEditable);
  if (!laONhap) return {ok: false, bao: 'Chưa biết ô nhập lời tả: bấm một lần vào ô nhập trên trang gen, rồi bấm lại "Đưa vào trang gen".'};
  const files = await Promise.all(anh.map(async (a) => new File([await (await fetch(a.du)).blob()], a.ten, {type: a.kieu})));
  const goi = () => { const d = new DataTransfer(); files.forEach((f) => d.items.add(f)); return d; };
  o.focus();
  // 1. lời tả
  if (o.isContentEditable) { document.execCommand('selectAll', false); document.execCommand('insertText', false, loiTa); }
  else { const dat = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(o), 'value').set; dat.call(o, loiTa); o.dispatchEvent(new Event('input', {bubbles: true})); o.dispatchEvent(new Event('change', {bubbles: true})); }
  // 2. ảnh mẫu
  let ghi = `Đã dán lời tả (${loiTa.length} ký tự).`;
  if (files.length) {
    if (cach === 'file') {
      const os = [...document.querySelectorAll('input[type=file]')].filter((i) => !i.accept || /image|\.png|\.jpe?g|\*/i.test(i.accept));
      if (!os.length) return {ok: false, bao: ghi + ' Trang không có ô chọn file ảnh nào đang hiện: bấm nút thêm ảnh của trang một lần (rồi đóng hộp chọn file), hoặc đổi "Cách đính ảnh mẫu".'};
      const i = os[os.length - 1]; i.files = goi().files; i.dispatchEvent(new Event('input', {bubbles: true})); i.dispatchEvent(new Event('change', {bubbles: true}));
      ghi += ` Đã đưa ${files.length} ảnh vào ô chọn file của trang.`;
    } else if (cach === 'tha') {
      const d = goi(), r = o.getBoundingClientRect(), tt = {bubbles: true, cancelable: true, dataTransfer: d, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2};
      for (const k of ['dragenter', 'dragover', 'drop']) o.dispatchEvent(new DragEvent(k, tt));
      ghi += ` Đã thả ${files.length} ảnh vào ô nhập.`;
    } else {
      o.dispatchEvent(new ClipboardEvent('paste', {bubbles: true, cancelable: true, clipboardData: goi()}));
      ghi += ` Đã dán ${files.length} ảnh vào ô nhập.`;
    }
  }
  return {ok: true, bao: ghi};
}

async function luuAnh(v) {
  const [fh] = await showOpenFilePicker({types: [{description: 'Ảnh', accept: {'image/*': ['.png', '.jpg', '.jpeg', '.webp']}}]});
  const f = await fh.getFile(), ten = v.luu_vao.replace(/^gen\//, '');
  let du = f;
  if (!/png$/i.test(f.type)) {   // nơi lưu là .png: đổi sang PNG cho đúng đuôi
    const bm = await createImageBitmap(f), cv = new OffscreenCanvas(bm.width, bm.height); cv.getContext('2d').drawImage(bm, 0, 0); du = await cv.convertToBlob({type: 'image/png'});
  }
  if ((await goc.requestPermission({mode: 'readwrite'})) !== 'granted') { bao('Chưa được quyền ghi vào thư mục chung/gen.', 'loi'); return; }
  const w = await (await goc.getFileHandle(ten, {create: true})).createWritable(); await w.write(du); await w.close();
  bao(`Đã lưu ${f.name} thành chung/${v.luu_vao}. Báo phiên là ảnh của "${v.ten}" đã có.`, 'xong'); await docHangCho();
}

$('chon').onclick = async () => {
  try {
    const h = await showDirectoryPicker({mode: 'readwrite'}), g = await timGen(h);
    if (!g) { bao('Không thấy thư mục gen trong "' + h.name + '". Hãy chọn thư mục cutout3d của dự án.', 'loi'); return; }
    goc = g; await nho(goc); $('tai').disabled = false; $('dau').textContent = 'Đã chọn: ' + h.name + (h.name === 'gen' ? '' : ' (dùng thư mục gen bên trong)'); await docHangCho();
  }
  catch (e) { if (e.name !== 'AbortError') bao('Lỗi: ' + e.message, 'loi'); }
};
$('tai').onclick = async () => { if ((await goc.requestPermission({mode: 'readwrite'})) === 'granted') await docHangCho(); };
chrome.storage.local.get('cach').then((x) => { if (x.cach) $('cach').value = x.cach; });
$('cach').onchange = () => chrome.storage.local.set({cach: $('cach').value});
(async () => { const h = await lay(); if (h) { goc = h; $('tai').disabled = false; $('dau').textContent = 'Thư mục đã nhớ: ' + h.name + '. Bấm "Đọc lại" để mở hàng chờ.'; } })();
