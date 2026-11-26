// Chạy trong trang gen ảnh.
// 1. Nhớ ô nhập mà người dùng bấm vào gần nhất, để bảng bên cạnh biết dán lời tả vào đâu.
// 2. Ghi lại lúc từng ảnh xuất hiện hoặc đổi nguồn, để bảng biết ảnh nào MỚI NHẤT.
(() => {
  const laONhap = (e) => e && (e.tagName === 'TEXTAREA' || (e.tagName === 'INPUT' && /^(text|search|)$/.test(e.type)) || e.isContentEditable);
  document.addEventListener('focusin', (ev) => { if (laONhap(ev.target)) window.__c3dONhap = ev.target; }, true);
  const dau = (i) => { i.__c3dT = Date.now(); };
  document.querySelectorAll('img').forEach((i) => { i.__c3dT = 0; });
  new MutationObserver((ds) => {
    for (const d of ds) {
      if (d.type === 'attributes' && d.target.tagName === 'IMG') dau(d.target);
      for (const n of d.addedNodes || []) { if (n.tagName === 'IMG') dau(n); else if (n.querySelectorAll) n.querySelectorAll('img').forEach(dau); }
    }
  }).observe(document.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset']});
})();
