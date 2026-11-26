#!/bin/sh
# Chrome gọi file này (Native Messaging). Tìm python3 rồi chạy mo_thu_muc.py cạnh nó.
D="$(cd "$(dirname "$0")" && pwd)"
for P in /usr/bin/python3 /opt/homebrew/bin/python3 /usr/local/bin/python3 /Library/Frameworks/Python.framework/Versions/Current/bin/python3; do
  [ -x "$P" ] && exec "$P" "$D/mo_thu_muc.py"
done
exec python3 "$D/mo_thu_muc.py"
