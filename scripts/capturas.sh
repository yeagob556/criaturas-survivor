#!/usr/bin/env bash
# Capturas de pantalla del juego con Chromium sin pantalla (Playwright en Docker). Para comprobar lo VISUAL, que smoke.js no ve.
# Sirve una COPIA de index.html y music/ dentro del contenedor (no abre puertos ni toca la red de la torre) y deja los PNG en la
# carpeta indicada (por defecto capturas/, fuera de Git). El contenedor es desechable (--rm). Tarda ~1 min.
#   bash scripts/capturas.sh [carpeta_salida]
# La primera vez descarga la imagen oficial (~3,5 GB en disco, con los tres navegadores). Se puede borrar con: docker rmi "$IMG".
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
SALIDA="$(realpath -m "${1:-$RAIZ/capturas}")"
IMG="${PLAYWRIGHT_IMG:-mcr.microsoft.com/playwright/python:v1.64.0-noble}"
VER="${IMG##*:v}"; VER="${VER%%-*}"
command -v docker >/dev/null || { echo "Hace falta Docker."; exit 1; }
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}"; mkdir -p "$CACHE"
TMP="$(mktemp -d -p "$CACHE" capturas.XXXXXX)"; trap 'rm -rf "$TMP"' EXIT          # bajo el home: el demonio de Docker no ve el /tmp privado de algunos shells
cp "$RAIZ/index.html" "$TMP/"; [ -d "$RAIZ/music" ] && cp -r "$RAIZ/music" "$TMP/" || true
mkdir -p "$SALIDA"
docker run --rm --shm-size=1g --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$TMP:/web:ro" -v "$RAIZ/scripts/capturas.py:/capturas.py:ro" -v "$SALIDA:/out:rw" "$IMG" \
  sh -c "pip install -q --user playwright==$VER >/dev/null 2>&1; (python -m http.server 8118 --bind 127.0.0.1 -d /web >/dev/null 2>&1 &); sleep 1; python /capturas.py"
echo "Capturas en $SALIDA ($(ls "$SALIDA"/*.png | wc -l) imágenes)"
