#!/bin/bash
# usage: ./gen.sh <out-name.png> <prompt-file> <ref-image> [more refs...]
# Asks the local Codex CLI to make ONE image with its image-generation tool and save it into gen/.
# Mã thoát: 0 có ảnh mới; 3 Codex HẾT HẠN MỨC (in sẵn ba thứ phải gửi Daniel để Daniel gen ở chỗ khác: skill 2, mục Vẽ đồ bằng Codex);
#           1 không ra ảnh mới vì lý do khác (đọc gen/<tên>.log);
#           4 KHÔNG GEN: file lời tả chưa có bảng món hợp lệ (tools/kiem_loi_ta.py), Codex chưa được gọi.
# Lời tả phải qua tools/kiem_loi_ta.py (Daniel 26/11/2026: "lúc gen ảnh codex nó ko check luật 2d 3d để gen"): bảng món ở đầu file ghi
# từng món là phẳng hay khối và kết quả tra kho; công cụ bỏ bảng, thêm câu "vẽ chính diện" cho món là khối, rồi mới gửi Codex.
cd "$(dirname "$0")"
OUT="$1"; TA="$2"; shift 2
PROMPT="$(python3 tools/kiem_loi_ta.py "$TA" --in)" || { echo "KHÔNG GEN (mã thoát 4): lời tả chưa qua bước tra kho và chọn loại của Thẻ làm một món (skill 2). Sửa bảng món ở đầu $TA theo các dòng LOI ở trên; mẫu: gen/prompts/_mau-tam-kin.txt"; exit 4; }
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
  printf 'Create ONE image, landscape 16:9.\n%s\n' "$PROMPT" > "gen/$OUT.loi-ta.txt"
  echo "  1. lời tả ĐÃ SOÁT, dán NGUYÊN VĂN trong khối code: $PWD/gen/$OUT.loi-ta.txt   (KHÔNG gửi file gốc $TA: file đó còn bảng món và thiếu câu về hướng vẽ)"
  for r in "$@"; do echo "  2. ảnh mẫu kiểu vẽ, gửi thẳng bằng SendUserFile: $PWD/$r"; done
  if [ "$(python3 tools/kiem_loi_ta.py "$TA" --loai 2>/dev/null)" = canh ]; then
    echo "  3. nơi Daniel lưu tranh gen được: $PWD/gen/$OUT   (một tấm ngang 16:9, tranh CẢ bối cảnh, không nền hồng)"
    echo "Đây là TRANH BỐI CẢNH MẪU: không cắt. Có file rồi thì gửi Daniel xem cùng bảng thiết kế của bối cảnh. Agent trong workflow không nhắn được Daniel: ghi tranh_co: false rồi trả kết quả."
  else
    echo "  3. nơi Daniel lưu ảnh gen được: $PWD/gen/$OUT   (một tấm ngang 16:9, nền hồng phẳng #FF00FF)"
    echo "Có file đó rồi thì cắt như thường bằng tools/cut.py. Agent trong workflow không nhắn được Daniel: điền ba thứ trên vào cho_gen của báo cáo rồi dừng bối cảnh này."
  fi
  exit 3
fi
echo "KHÔNG RA ẢNH MỚI, không phải do hạn mức: đọc gen/$OUT.log"; exit 1
