// Bảng bên cạnh: đọc hàng chờ chung/gen/cho-gen. KHÔNG đọc, KHÔNG sửa trang web nào (Flow chặn extension tự điền, 26/11/2026).
// Mọi thao tác trên trang do tay người làm: chép lời tả rồi dán, bấm hình mẫu để chép ảnh rồi dán, tải ảnh về rồi bấm lưu.
const $ = (id) => document.getElementById(id);
let goc = null;          // FileSystemDirectoryHandle của chung/gen
const bao = (t, loai = '') => { $('bao').textContent = t; $('bao').className = loai; };

const kho = () => new Promise((ok, loi) => { const r = indexedDB.open('c3d', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = () => loi(r.error); });
const nho = async (v) => { const d = await kho(); d.transaction('k', 'readwrite').objectStore('k').put(v, 'goc'); };
const lay = async () => { const d = await kho(); return new Promise((ok) => { const r = d.transaction('k').objectStore('k').get('goc'); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); };

// Sau khi tải lại extension, Chrome thu quyền thư mục: phải xin lại trong một lần bấm của người dùng.
const coQuyen = async () => { if (!goc) { bao('Chưa chọn thư mục cutout3d.', 'loi'); return false; } if ((await goc.queryPermission({mode: 'readwrite'})) === 'granted') return true; if ((await goc.requestPermission({mode: 'readwrite'})) === 'granted') return true; bao('Chưa được quyền với thư mục gen: bấm "Cho phép" khi Chrome hỏi.', 'loi'); return false; };
const coFile = async (thuMuc, ten) => { try { await thuMuc.getFileHandle(ten); return true; } catch { return false; } };
const docChu = async (thuMuc, ten) => (await (await thuMuc.getFileHandle(ten)).getFile()).text();
const thanhPNG = async (blob) => { if (/png$/i.test(blob.type)) return blob; const bm = await createImageBitmap(blob), cv = new OffscreenCanvas(bm.width, bm.height); cv.getContext('2d').drawImage(bm, 0, 0); return cv.convertToBlob({type: 'image/png'}); };

// Người dùng chọn cutout3d, chung hay gen đều được: tự tìm tới thư mục gen (nơi có cho-gen).
async function timGen(h) {
  for (const duong of [[], ['gen'], ['chung', 'gen']]) { try { let t = h; for (const d of duong) t = await t.getDirectoryHandle(d); await t.getDirectoryHandle('cho-gen'); return t; } catch { /* thử đường kế */ } }
  for (const duong of [['chung', 'gen'], ['gen']]) { try { let t = h; for (const d of duong) t = await t.getDirectoryHandle(d); return t; } catch { /* thử đường kế */ } }
  return null;
}

async function docHangCho() {
  $('ds').textContent = '';
  let cho;
  try { cho = await goc.getDirectoryHandle('cho-gen'); } catch { bao('Hàng chờ trống: chưa phiên nào xếp việc (thư mục gen chưa có "cho-gen").'); return; }
  const viec = [];
  for await (const [, h] of cho.entries()) {
    if (h.kind !== 'directory' || !(await coFile(h, 'viec.json'))) continue;
    try { const v = JSON.parse(await docChu(h, 'viec.json')); viec.push({v, h, xong: await coFile(goc, v.luu_vao.replace(/^gen\//, '')), bo: await coFile(h, 'da-bo.txt')}); } catch { /* việc hỏng: bỏ qua */ }
  }
  viec.sort((a, b) => (a.xong - b.xong) || a.v.ten.localeCompare(b.v.ten));
  if (!viec.length) { bao('Hàng chờ trống.'); return; }
  const con = viec.filter((x) => !x.bo), daBo = viec.filter((x) => x.bo);
  bao(`${con.filter((x) => !x.xong).length} việc chờ gen, ${con.filter((x) => x.xong).length} việc đã có ảnh` + (daBo.length ? `, ${daBo.length} việc đã bỏ.` : '.'));
  for (const x of con) veViec(x);
  if (daBo.length) { const n = document.createElement('button'); n.textContent = `Hiện ${daBo.length} việc đã bỏ`; n.style.marginTop = '6px'; n.onclick = () => { n.remove(); for (const x of daBo) veViec(x); }; $('ds').append(n); }
}

function veViec({v, h, xong, bo}) {
  const o = document.createElement('div'); o.className = 'viec ' + (bo ? 'bo' : xong ? 'co' : 'chua');
  const nhan = document.createElement('span'); nhan.className = 'nhan'; nhan.textContent = bo ? 'ĐÃ BỎ' : xong ? 'ĐÃ CÓ ẢNH' : 'CHƯA CÓ ẢNH'; o.append(nhan);
  const tieu = document.createElement('h2'); tieu.textContent = v.ten; o.append(tieu);
  const mo = document.createElement('div'); mo.className = 'mo';
  mo.textContent = `${v.loai === 'canh' ? 'tranh bối cảnh mẫu' : 'tấm đồ nền hồng'} · ${v.anh_mau.length} ảnh mẫu · lưu vào ${v.luu_vao}`; o.append(mo);
  const anh = document.createElement('div'); anh.className = 'anh'; o.append(anh);
  (async () => {
    for (const [k, t] of v.anh_mau.entries()) {
      const f = await (await h.getFileHandle(t)).getFile(); const b = document.createElement('button'); b.className = 'mau'; b.title = 'Bấm để chép ảnh mẫu này, rồi dán vào trang gen (Cmd+V)';
      const i = document.createElement('img'); i.src = URL.createObjectURL(f); b.append(i);
      b.onclick = async () => {
        try { await navigator.clipboard.write([new ClipboardItem({'image/png': await thanhPNG(f)})]); anh.querySelectorAll('.mau').forEach((x) => x.classList.remove('vua')); b.classList.add('vua'); bao(`Đã chép ảnh mẫu ${k + 1}/${v.anh_mau.length} của "${v.ten}". Sang trang gen bấm Cmd+V để dán.`, 'xong'); }
        catch (e) { bao('Không chép được ảnh (' + (e.message || e) + '). Dùng "Mở thư mục việc" rồi lấy ảnh trong Finder.', 'loi'); }
      };
      anh.append(b);
    }
    if (xong) { try { const f = await (await goc.getFileHandle(v.luu_vao.replace(/^gen\//, ''))).getFile(); const i = document.createElement('img'); i.src = URL.createObjectURL(f); i.className = 'kq'; i.title = 'Ảnh đã lưu: ' + v.luu_vao; anh.append(i); } catch { /* chưa có quyền đọc */ } }
  })();
  const hang = document.createElement('div'); hang.className = 'hang';
  const nut = (chu, lop, lam) => { const b = document.createElement('button'); b.textContent = chu; if (lop) b.className = lop; b.onclick = async () => { try { if (!(await coQuyen())) return; await lam(b); } catch (e) { bao('Lỗi: ' + (e.message || e), 'loi'); } }; hang.append(b); return b; };
  nut('Chép lời tả', 'chinh', async () => { await navigator.clipboard.writeText(await docChu(h, 'loi-ta.txt')); bao(`Đã chép lời tả của "${v.ten}". Sang trang gen bấm Cmd+V. Ảnh mẫu: bấm từng hình ở trên để chép, rồi dán.`, 'xong'); });
  nut('Lưu ảnh đã tải về', 'chinh', async () => { await luuAnh(v); });
  nut(xong ? 'Mở thư mục ảnh' : 'Mở thư mục việc', '', async () => {
    let r;
    try { r = await chrome.runtime.sendNativeMessage('com.cutout3d.mo_thu_muc', xong ? {ten: v.luu_vao.replace(/^gen\//, '')} : {viec: v.ten}); }
    catch (e) { bao('Chưa cài cầu nối mở thư mục. Chạy MỘT lần trong Terminal (ở thư mục cutout3d):\n  bash chung/tien-ich/flow-gen/cai-may.sh ' + chrome.runtime.id + '\nrồi bấm lại nút này.', 'loi'); return; }
    bao(r && r.ok ? 'Đã mở ' + r.thu_muc + (r.chon ? ' (chọn sẵn ' + r.chon + ')' : '') + '.' : 'Không mở được thư mục: ' + ((r && r.loi) || 'không rõ'), r && r.ok ? '' : 'loi');
  });
  if (bo) nut('Khôi phục', '', async () => { await h.removeEntry('da-bo.txt'); bao('Đã khôi phục việc ' + v.ten + '.'); await docHangCho(); });
  else nut('Bỏ việc này', '', async () => {
    if (!confirm(`Bỏ việc "${v.ten}"? Việc sẽ ẩn khỏi hàng chờ; phiên xem hàng chờ sẽ thấy nó ghi "đã bỏ". Khôi phục lại được.`)) return;
    const w = await (await h.getFileHandle('da-bo.txt', {create: true})).createWritable(); await w.write('Daniel bỏ việc này trong extension flow-gen, ' + new Date().toLocaleString('vi-VN') + '\n'); await w.close();
    bao('Đã bỏ việc ' + v.ten + '.'); await docHangCho();
  });
  o.append(hang); $('ds').append(o);
}

async function luuAnh(v) {
  const [fh] = await showOpenFilePicker({types: [{description: 'Ảnh', accept: {'image/*': ['.png', '.jpg', '.jpeg', '.webp']}}]});
  const f = await fh.getFile(), ten = v.luu_vao.replace(/^gen\//, '');
  const w = await (await goc.getFileHandle(ten, {create: true})).createWritable(); await w.write(await thanhPNG(f)); await w.close();
  bao(`Đã lưu ${f.name} thành chung/${v.luu_vao}. Báo phiên là ảnh của "${v.ten}" đã có.`, 'xong'); await docHangCho();
}

$('chon').onclick = async () => {
  try {
    const h = await showDirectoryPicker({mode: 'readwrite'}), g = await timGen(h);
    if (!g) { bao('Không thấy thư mục gen trong "' + h.name + '". Hãy chọn thư mục cutout3d của dự án.', 'loi'); return; }
    goc = g; await nho(goc); $('tai').disabled = false; $('dau').textContent = 'Đã chọn: ' + h.name + (h.name === 'gen' ? '' : ' (dùng thư mục gen bên trong)'); await docHangCho();
  } catch (e) { if (e.name !== 'AbortError') bao('Lỗi: ' + e.message, 'loi'); }
};
$('tai').onclick = async () => { if (await coQuyen()) await docHangCho(); };
(async () => { const h = await lay(); if (h) { goc = h; $('tai').disabled = false; $('dau').textContent = 'Thư mục đã nhớ: ' + h.name + '. Bấm "Đọc lại" để mở hàng chờ.'; } })();

