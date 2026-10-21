#!/usr/bin/env bash
# Copia index.html y music/ a la carpeta que sirve un entorno de dashboard-stack. Simula por defecto; --apply ejecuta.
#   bash scripts/sync-dashboard.sh --test [--apply]   → VERSIÓN DE PRUEBA (contenedor criaturas-test: html-test/), para revisarla antes
#   bash scripts/sync-dashboard.sh [--apply]          → DEMO tras el panel + VERSIÓN PÚBLICA (contenedores demo-criaturas y criaturas-pub: html/)
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
CARPETA="html"; APPLY=0
for a in "$@"; do case "$a" in --test) CARPETA="html-test";; --apply) APPLY=1;; *) echo "Opción desconocida: $a"; exit 1;; esac; done
DEST="$HOME/dashboard-stack/demos/criaturas-survivor/$CARPETA"
[ -d "$DEST" ] || { echo "No existe $DEST"; exit 1; }
cambios=0
cmp -s "$RAIZ/index.html" "$DEST/index.html" || { echo "Diferente: index.html"; cambios=1; }
if [ -d "$RAIZ/music" ]; then for f in "$RAIZ"/music/*.mp3; do [ -e "$f" ] || continue
  cmp -s "$f" "$DEST/music/$(basename "$f")" || { echo "Diferente: music/$(basename "$f")"; cambios=1; }; done; fi
[ "$cambios" = 1 ] || { echo "Ya está sincronizado ($CARPETA)."; exit 0; }
if [ "$APPLY" != 1 ]; then echo "SIMULACIÓN ($CARPETA): repite con --apply para copiar."; exit 0; fi
if [ "$CARPETA" = html ] && [ -f "$DEST/index.html" ] && ! cmp -s "$RAIZ/index.html" "$DEST/index.html"; then cp -p "$DEST/index.html" "$DEST/index.html.bak-$(date +%Y%m%d)"; fi
cp -p "$RAIZ/index.html" "$DEST/index.html"
if ls "$RAIZ"/music/*.mp3 >/dev/null 2>&1; then mkdir -p "$DEST/music"; cp -p "$RAIZ"/music/*.mp3 "$DEST/music/"; fi
echo "Copiado a $CARPETA. nginx lo sirve al momento (volumen montado en solo lectura)."
