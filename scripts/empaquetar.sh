#!/usr/bin/env bash
# Prepara la versión PORTABLE del juego en dist/: una carpeta COMPLETA (juego + música) y otra LIGERA (sólo el juego), cada una con su .zip.
# Para jugar no hace falta instalar nada: se abre index.html con el navegador (doble clic o Jugar.bat / jugar.sh).
#   bash scripts/empaquetar.sh
set -euo pipefail
cd "$(dirname "$0")/.."
VER="$(grep -oP "const VERSION = '\K[^']+" index.html)"; FECHA="$(grep -oP "VERSION_DATE = '\K[^']+" index.html)"
TOP="$(grep -oP '^## v\K[0-9.]+' CHANGELOG.md | head -1)"
[ "$VER" = "$TOP" ] || { echo "La versión de index.html ($VER) no coincide con CHANGELOG.md ($TOP)."; exit 1; }
DIST="dist"; mkdir -p "$DIST"
HAY_MUSICA=0; ls music/*.mp3 >/dev/null 2>&1 && HAY_MUSICA=1

crear(){   # crear <nombre> <con_musica 0|1>
  local N="$1" M="$2" D="$DIST/$1"; rm -rf "$D" "$D.zip"; mkdir -p "$D"
  cp index.html "$D/"; [ "$M" = 1 ] && cp -r music "$D/"
  { echo "CRIATURAS SURVIVOR v$VER ($FECHA) — versión portable $( [ "$M" = 1 ] && echo completa || echo ligera )"
    echo
    echo "Un juego de supervivencia con criaturas originales: elige un compañero, esquiva hordas, sube de nivel y derrota a los jefes."
    echo
    echo "CÓMO JUGAR"
    echo "  Windows ........ doble clic en Jugar.bat (o abre index.html con tu navegador)"
    echo "  Linux / macOS .. ./jugar.sh (o abre index.html con tu navegador)"
    echo "  Funciona con Chrome, Edge, Firefox y Safari actuales. No hace falta instalar nada ni tener conexión."
    echo "  Si algún navegador no reproduce la música al abrir el fichero directamente, usa jugar-con-servidor.sh (necesita python3)."
    echo
    echo "CONTROLES: moverse WASD/flechas o arrastrando el dedo · atacar automático · 1-4 o Q/E movimiento principal · R cambia las opciones · Esc pausa."
    echo
    echo "TU PARTIDA"
    echo "  El progreso se guarda en el navegador, no en esta carpeta. Para llevarlo a otro ordenador o navegador:"
    echo "  Menú > Estadísticas > Exportar partida (crea criaturas-survivor-partida.json) y, en el otro sitio, Importar partida."
    echo
    if [ "$M" = 1 ]; then echo "MÚSICA: la carpeta music/ lleva una pista chillout por tipo de mapa. Está generada con IA (ver CREDITOS.txt)."
    else echo "VERSIÓN LIGERA: sólo incluye el juego (sin música). Para tener música copia aquí la carpeta music/ de la versión completa."; fi
  } > "$D/LEEME.txt"
  { echo "CRÉDITOS Y LICENCIAS — Criaturas Survivor v$VER"
    echo
    echo "- Código, criaturas, gráficos y textos: propios (los gráficos se dibujan por código; no hay imágenes de terceros)."
    echo "- No incluye assets de Nintendo, Game Freak ni de ningún otro juego."
    [ "$M" = 1 ] && { echo "- Música: generada con inteligencia artificial (ACE-Step v1 3.5B, licencia Apache-2.0), ejecutada en local. No es música compuesta por una persona."; }
    echo "- Todos los derechos reservados salvo permiso del autor."
  } > "$D/CREDITOS.txt"
  printf '@echo off\r\nrem Abre el juego en tu navegador predeterminado (no necesita instalar nada).\r\nstart "" "%%~dp0index.html"\r\n' > "$D/Jugar.bat"
  printf '#!/usr/bin/env sh\n# Abre el juego en tu navegador predeterminado.\ncd "$(dirname "$0")" || exit 1\nif command -v xdg-open >/dev/null 2>&1; then xdg-open index.html\nelif command -v open >/dev/null 2>&1; then open index.html\nelse echo "Abre index.html con tu navegador."; fi\n' > "$D/jugar.sh"
  printf '#!/usr/bin/env sh\n# Sirve la carpeta en local (sólo en este equipo) y abre el juego; útil si el navegador no reproduce la música desde un fichero.\ncd "$(dirname "$0")" || exit 1\nPUERTO="${1:-8765}"\n(sleep 1; (command -v xdg-open >/dev/null 2>&1 && xdg-open "http://127.0.0.1:$PUERTO/") || (command -v open >/dev/null 2>&1 && open "http://127.0.0.1:$PUERTO/")) &\necho "Sirviendo en http://127.0.0.1:$PUERTO/ (Ctrl+C para parar)"\npython3 -m http.server "$PUERTO" --bind 127.0.0.1\n' > "$D/jugar-con-servidor.sh"
  chmod +x "$D/jugar.sh" "$D/jugar-con-servidor.sh"
  python3 - "$D" <<'PY'
import os, sys, zipfile
d = sys.argv[1]; nombre = os.path.basename(d)
with zipfile.ZipFile(d + '.zip', 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for raiz, _, ficheros in os.walk(d):
        for f in sorted(ficheros):
            ruta = os.path.join(raiz, f); arc = os.path.join(nombre, os.path.relpath(ruta, d)); zi = zipfile.ZipInfo.from_file(ruta, arc)
            zi.compress_type = zipfile.ZIP_DEFLATED; zi.external_attr = (0o755 if f.endswith('.sh') else 0o644) << 16
            z.writestr(zi, open(ruta, 'rb').read())
PY
  echo "  $D ($(du -sh "$D" | cut -f1)) y $D.zip ($(du -h "$D.zip" | cut -f1))"
}
echo "Versión $VER"
[ "$HAY_MUSICA" = 1 ] && crear "criaturas-survivor-v$VER-portable" 1 || echo "  (sin music/*.mp3: se omite la versión completa; ver scripts/generar_musica.sh)"
crear "criaturas-survivor-v$VER-ligera" 0
bash scripts/audit-secrets.sh "$DIST" | tail -1
