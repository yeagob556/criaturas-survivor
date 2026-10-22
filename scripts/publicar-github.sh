#!/usr/bin/env bash
# Crea el repositorio PRIVADO en GitHub y sube la rama main. Simula por defecto; --apply ejecuta (sube el código fuera de la torre: sólo con tu OK).
#   bash scripts/publicar-github.sh            # comprobaciones + muestra lo que haría
#   bash scripts/publicar-github.sh --apply    # además crea el repo privado y sube
# Antes comprueba: auditoría de secretos (ficheros y TODO el historial con gitleaks), que no haya cambios sin commit, que la rama sea main y que
# las pistas de música, dist/ y capturas/ no estén versionadas. Después verifica que el repositorio quedó privado.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="${REPO:-yeagob556/criaturas-survivor}"; DESC="Juego de supervivencia con criaturas originales en un solo HTML (proyecto de aprendizaje)"
APPLY=0; [ "${1:-}" = "--apply" ] && APPLY=1
echo "== Comprobaciones"
bash scripts/audit-secrets.sh
if command -v gitleaks >/dev/null; then gitleaks detect --source . --no-banner >/dev/null 2>&1 && echo "gitleaks: historial limpio ($(git rev-list --count HEAD) commits)" || { echo "gitleaks: ¡hallazgos en el historial!"; exit 1; }
else echo "(gitleaks no está instalado: sólo se ha hecho la auditoría de ficheros)"; fi
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo "La rama actual no es main."; exit 1; }
git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ] || { echo "Hay cambios sin commit: haz el commit antes."; exit 1; }
if git ls-files | grep -E '^(music/.*\.mp3|dist/|capturas/)|\.zip$' >/dev/null; then echo "Hay música, dist/ o capturas/ versionados (regla 002)."; exit 1; fi
echo "Ficheros versionados: $(git ls-files | wc -l); tamaño de .git: $(du -sh .git | cut -f1)"
command -v gh >/dev/null && gh auth status >/dev/null 2>&1 || { echo "gh no está instalado o no ha iniciado sesión."; exit 1; }
EXISTE=0; gh repo view "$REPO" >/dev/null 2>&1 && EXISTE=1
if [ "$APPLY" != 1 ]; then
  echo "== SIMULACIÓN"; [ "$EXISTE" = 1 ] && echo "El repositorio $REPO ya existe: sólo añadiría el remoto y subiría main." || echo "Crearía $REPO como PRIVADO y subiría main."
  echo "Repite con --apply para hacerlo."; exit 0
fi
echo "== Publicando"
if [ "$EXISTE" = 1 ]; then git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO.git"; git push -u origin main
else gh repo create "$REPO" --private --source=. --remote=origin --push --description "$DESC"; fi
gh repo edit "$REPO" --add-topic juego --add-topic javascript --add-topic canvas --add-topic survivor --add-topic html5 >/dev/null 2>&1 || true
[ "$(gh repo view "$REPO" --json isPrivate -q .isPrivate)" = true ] && echo "Verificado: $REPO es PRIVADO." || { echo "¡ATENCIÓN: $REPO NO es privado!"; exit 1; }
gh repo view "$REPO" --json url -q .url
