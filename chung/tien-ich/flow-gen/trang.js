// Chạy trong trang gen ảnh: nhớ ô nhập mà người dùng bấm vào gần nhất, để bảng bên cạnh biết dán lời tả vào đâu.
(() => {
  const laONhap = (e) => e && (e.tagName === 'TEXTAREA' || (e.tagName === 'INPUT' && /^(text|search|)$/.test(e.type)) || e.isContentEditable);
  document.addEventListener('focusin', (ev) => { if (laONhap(ev.target)) window.__c3dONhap = ev.target; }, true);
})();
