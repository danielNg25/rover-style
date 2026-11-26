# Dùng: source tools/dang-lam.sh   (từ gốc chung/). Đặt KENH, TAP, KENH_DIR, TAP_DIR, OUT theo dang-lam.yaml;
# biến môi trường KENH / TAP có sẵn thì ghi đè. OUT = ../kenh/<kenh>/out (tạo nếu chưa có).
_DL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
KENH="${KENH:-$(sed -n 's/^kenh:[[:space:]]*\([^#[:space:]]*\).*/\1/p' "$_DL_ROOT/dang-lam.yaml")}"
TAP="${TAP:-$(sed -n 's/^tap:[[:space:]]*\([^#[:space:]]*\).*/\1/p' "$_DL_ROOT/dang-lam.yaml")}"
KENH_DIR="$(cd "$_DL_ROOT/.." && pwd -P)/kenh/$KENH"
[ -d "$KENH_DIR" ] || { echo "dang-lam: không có kênh '$KENH' ($KENH_DIR)" >&2; exit 1; }
TAP_DIR="$KENH_DIR/tap/$TAP"
OUT="$KENH_DIR/out"
mkdir -p "$OUT"
# File vào của gói dựng: của riêng kênh nếu có, không thì file chứa mọi kênh.
ENTRY="src/index.ts"; [ -f "$KENH_DIR/entry.ts" ] && ENTRY="../kenh/$KENH/entry.ts"
