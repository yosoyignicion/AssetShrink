#!/usr/bin/env bash
# Verifica que toda clave usada con t("...") exista en los diccionarios ES y EN.
# Cada clave debe aparecer exactamente 2 veces en i18n.js (una por idioma).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JS="$ROOT/src/web/js"

used="$(mktemp)"
counts="$(mktemp)"
trap 'rm -f "$used" "$counts"' EXIT

grep -rhoE '\bt\("[A-Za-z0-9_.]+"\)' "$JS" | sed -E 's/.*t\("([^"]+)"\)/\1/' | sort -u > "$used"
grep -oE '"[A-Za-z0-9_.]+":' "$JS/i18n.js" | tr -d '":' | sort | uniq -c | awk '{print $2, $1}' > "$counts"

fail=0
while read -r k; do
  [ -z "$k" ] && continue
  n="$(awk -v key="$k" '$1==key{print $2}' "$counts")"
  if [ -z "$n" ]; then
    echo "FALTA (no definida): $k"; fail=1
  elif [ "$n" -lt 2 ]; then
    echo "SIN PARIDAD ($n/2 idiomas): $k"; fail=1
  fi
done < "$used"

if [ "$fail" -eq 0 ]; then
  echo "i18n OK: $(wc -l < "$used" | tr -d ' ') claves presentes en ES y EN"
fi
exit "$fail"
