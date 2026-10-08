#!/usr/bin/env bash
# Smoke test de AssetShrink: arranca el binario y valida los endpoints principales.
#
# Uso: scripts/smoke.sh [ruta_al_binario] [puerto_base]
#   ruta_al_binario  por defecto build/AssetShrink (o build/Release/AssetShrink.exe)
#   puerto_base      por defecto 8090
set -euo pipefail

BIN="${1:-build/AssetShrink}"
PORT="${2:-8090}"

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) [ "$BIN" = "build/AssetShrink" ] && BIN="build/Release/AssetShrink.exe" ;;
esac

# macOS empaqueta el ejecutable dentro del bundle .app.
if [ ! -x "$BIN" ] && [ -x "$BIN.app/Contents/MacOS/$(basename "$BIN")" ]; then
  BIN="$BIN.app/Contents/MacOS/$(basename "$BIN")"
fi

if [ ! -x "$BIN" ]; then
  echo "FAIL: no se encontró el binario en '$BIN'. Compila primero con 'cmake --build build'."
  exit 1
fi

TMP="$(mktemp -d)"
LOG="$(mktemp)"
PID=""
cleanup() {
  [ -n "$PID" ] && kill "$PID" 2>/dev/null || true
  rm -rf "$TMP" "$LOG"
}
trap cleanup EXIT

echo "→ Lanzando $BIN --port $PORT --no-open"
"$BIN" --port "$PORT" --no-open >"$LOG" 2>&1 &
PID=$!

ACTIVE=""
for ((i = 0; i < 120; i++)); do
  for ((p = 0; p < 10; p++)); do
    cand=$((PORT + p))
    if curl -fsS "http://localhost:$cand/" -o /dev/null 2>/dev/null; then
      ACTIVE="$cand"
      break 2
    fi
  done
  sleep 0.1
done

if [ -z "$ACTIVE" ]; then
  echo "FAIL: el servidor no respondió en los puertos $PORT-$((PORT + 9))."
  cat "$LOG"
  exit 1
fi

BASE="http://localhost:$ACTIVE"
echo "→ Servidor en $BASE"

pass=0
check() {
  local name="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "  ✓ $name"
    pass=$((pass + 1))
  else
    echo "  ✗ $name"
    exit 1
  fi
}

check "landing (index.html)"   curl -fsS "$BASE/" -o "$TMP/index.html"
check "asset css"              curl -fsS "$BASE/css/app.css" -o /dev/null
check "asset js (app)"         curl -fsS "$BASE/js/app.js" -o /dev/null
check "asset js (tool module)" curl -fsS "$BASE/js/tools/optimize.js" -o /dev/null
check "QR PNG"                 curl -fsS "$BASE/api/qr?text=AssetShrink&size=256" -o "$TMP/qr.png"
check "convert → webp"         curl -fsS -F "image=@$TMP/qr.png" "$BASE/api/convert?format=webp&quality=70" -o "$TMP/o.webp"
check "resize → png"           curl -fsS -F "image=@$TMP/qr.png" "$BASE/api/resize?w=96&format=png" -o "$TMP/o.png"
check "palette JSON"           curl -fsS -F "image=@$TMP/qr.png" "$BASE/api/palette?count=4" -o "$TMP/pal.json"
check "beautify → png"         curl -fsS -F "image=@$TMP/qr.png" "$BASE/api/beautify?pad=32" -o "$TMP/b.png"

grep -q '"colors"' "$TMP/pal.json" || { echo "  ✗ palette content"; exit 1; }
grep -q '<!DOCTYPE html>' "$TMP/index.html" || { echo "  ✗ index content"; exit 1; }

echo "PASS: $pass comprobaciones correctas."
