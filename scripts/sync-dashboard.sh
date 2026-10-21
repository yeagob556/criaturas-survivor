#!/usr/bin/env bash
# Copia index.html (y las pistas de music/, si las hay) a la demo servida por dashboard-stack. Simula por defecto; --apply ejecuta.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/dashboard-stack/demos/criaturas-survivor/html"
cambios=0
cmp -s "$RAIZ/index.html" "$DEST/index.html" || { echo "Diferente: index.html"; cambios=1; }
if [ -d "$RAIZ/music" ]; then for f in "$RAIZ"/music/*.mp3; do [ -e "$f" ] || continue
  cmp -s "$f" "$DEST/music/$(basename "$f")" || { echo "Diferente: music/$(basename "$f")"; cambios=1; }; done; fi
[ "$cambios" = 1 ] || { echo "Ya está sincronizado."; exit 0; }
if [ "${1:-}" != "--apply" ]; then echo "SIMULACIÓN: repite con --apply para copiar."; exit 0; fi
cmp -s "$RAIZ/index.html" "$DEST/index.html" || { cp -p "$DEST/index.html" "$DEST/index.html.bak-$(date +%Y%m%d)"; cp -p "$RAIZ/index.html" "$DEST/index.html"; }
if ls "$RAIZ"/music/*.mp3 >/dev/null 2>&1; then mkdir -p "$DEST/music"; cp -p "$RAIZ"/music/*.mp3 "$DEST/music/"; fi
echo "Copiado. nginx lo sirve al momento (volumen montado en solo lectura)."
