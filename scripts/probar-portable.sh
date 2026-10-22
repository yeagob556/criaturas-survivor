#!/usr/bin/env bash
# Prueba un paquete portable abriéndolo por file:// en Chromium real (Playwright en Docker, contenedor desechable y sin red de la torre).
#   bash scripts/probar-portable.sh dist/criaturas-survivor-v<versión>-portable     (o la carpeta -ligera)
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
[ -n "${1:-}" ] && [ -f "$1/index.html" ] || { echo "Uso: $0 <carpeta del paquete>"; exit 1; }
PAQ="$(realpath "$1")"; SALIDA="$RAIZ/capturas"; mkdir -p "$SALIDA"
IMG="${PLAYWRIGHT_IMG:-mcr.microsoft.com/playwright/python:v1.64.0-noble}"; VER="${IMG##*:v}"; VER="${VER%%-*}"
docker run --rm --shm-size=1g --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PAQ:/juego:ro" -v "$RAIZ/scripts/probar_portable.py:/probar.py:ro" -v "$SALIDA:/out:rw" "$IMG" \
  sh -c "pip install -q --user playwright==$VER >/dev/null 2>&1; python /probar.py"
