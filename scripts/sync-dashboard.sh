#!/usr/bin/env bash
# Copia index.html a la demo servida por dashboard-stack. Simula por defecto; --apply ejecuta.
set -euo pipefail
ORIGEN="$(cd "$(dirname "$0")/.." && pwd)/index.html"
DESTINO="$HOME/dashboard-stack/demos/criaturas-survivor/html/index.html"
if cmp -s "$ORIGEN" "$DESTINO"; then echo "Ya está sincronizado."; exit 0; fi
echo "Diferencias entre repo y demo servida:"; diff -q "$ORIGEN" "$DESTINO" || true
if [ "${1:-}" != "--apply" ]; then echo "SIMULACIÓN: repite con --apply para copiar."; exit 0; fi
cp -p "$DESTINO" "$DESTINO.bak-$(date +%Y%m%d)"
cp -p "$ORIGEN" "$DESTINO"
echo "Copiado. nginx lo sirve al momento (volumen montado en solo lectura)."
