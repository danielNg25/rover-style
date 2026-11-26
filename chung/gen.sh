#!/bin/bash
# usage: ./gen.sh <out-name.png> <prompt-file> <ref-image> [more refs...]
# Asks the local Codex CLI to make ONE image with its image-generation tool and save it into gen/.
# Mã thoát: 0 có ảnh mới; 3 Codex HẾT HẠN MỨC (in sẵn ba thứ phải gửi Daniel để Daniel gen ở chỗ khác: skill 2, mục Vẽ đồ bằng Codex);
#           1 không ra ảnh mới vì lý do khác (đọc gen/<tên>.log).
cd "$(dirname "$0")"
OUT="$1"; TA="$2"; PROMPT="$(cat "$2")"; shift 2
ARGS=(); for r in "$@"; do ARGS+=(-i "$PWD/$r"); done
MOC="gen/.moc-$OUT"; : > "$MOC"
codex exec --skip-git-repo-check -s workspace-write -C "$PWD/gen" "${ARGS[@]}" -- \
  "Use your image generation tool to create ONE image and save it as $OUT in the current directory. Do not write code and do not draw with scripts; it must come from the image generation tool. $PROMPT After saving, reply with just the file path." > "gen/$OUT.log" 2>&1 < /dev/null
MOI=0; [ -s "gen/$OUT" ] && [ "gen/$OUT" -nt "$MOC" ] && MOI=1; rm -f "$MOC"
ls -la "gen/$OUT" 2>&1 | tail -1
[ "$MOI" = 1 ] && exit 0
if grep -qi "usage limit" "gen/$OUT.log"; then
  echo "CODEX HẾT HẠN MỨC ($(grep -oiE 'try again at [^.]*' "gen/$OUT.log" | head -1)). KHÔNG chờ, KHÔNG vẽ thay bằng code, KHÔNG bỏ món."
  echo "Gửi Daniel NGAY ba thứ sau để Daniel gen ở chỗ khác (skill 2, mục Vẽ đồ bằng Codex):"
  echo "  1. lời tả, dán NGUYÊN VĂN trong khối code: $PWD/$TA"
  for r in "$@"; do echo "  2. ảnh mẫu kiểu vẽ, gửi thẳng bằng SendUserFile: $PWD/$r"; done
  echo "  3. nơi Daniel lưu ảnh gen được: $PWD/gen/$OUT   (một tấm ngang 16:9, nền hồng phẳng #FF00FF)"
  echo "Có file đó rồi thì cắt như thường bằng tools/cut.py. Agent trong workflow không nhắn được Daniel: điền ba thứ trên vào cho_gen của báo cáo rồi dừng bối cảnh này."
  exit 3
fi
echo "KHÔNG RA ẢNH MỚI, không phải do hạn mức: đọc gen/$OUT.log"; exit 1
