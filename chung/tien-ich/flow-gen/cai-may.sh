#!/bin/bash
# Cài cầu nối "mở thư mục trong Finder" cho extension flow-gen. Chạy MỘT lần:
#   bash cai-may.sh <mã extension>        (mã hiện ở chrome://extensions và trong bảng của extension)
# Việc nó làm: ghi MỘT file khai báo vào thư mục NativeMessagingHosts của Chrome, trỏ tới may/mo.sh trong dự án.
[ -z "$1" ] && { echo "dùng: bash cai-may.sh <mã extension>"; exit 1; }
D="$(cd "$(dirname "$0")" && pwd)"; chmod +x "$D/may/mo.sh"
case "$(uname)" in
  Darwin) NOI="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts";;
  *) NOI="$HOME/.config/google-chrome/NativeMessagingHosts";;
esac
mkdir -p "$NOI"
cat > "$NOI/com.cutout3d.mo_thu_muc.json" <<JSON
{"name": "com.cutout3d.mo_thu_muc", "description": "cutout3d: mở thư mục chung/gen", "path": "$D/may/mo.sh", "type": "stdio", "allowed_origins": ["chrome-extension://$1/"]}
JSON
echo "Đã cài: $NOI/com.cutout3d.mo_thu_muc.json"
echo "Gỡ: xoá file đó. Giờ bấm lại nút 'Mở thư mục ảnh' trong extension."
