#!/usr/bin/env bash
# Auditoría de secretos antes de commit. Sale con 1 si encuentra algo.
# Busca tokens conocidos, claves privadas, IPs privadas/Tailscale y hostnames ocultos del dominio.
DIR="${1:-.}"; [ "$DIR" = . ] || DIR="$(realpath "$DIR")"      # opcional: otra carpeta (p. ej. dist/ del paquete portable)
cd "$(dirname "$0")/.." || exit 2
PAT='gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|[0-9]{8,}:[A-Za-z0-9_-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|192\.168\.[0-9]+\.[0-9]+|100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.[0-9]+\.[0-9]+|[a-f0-9]{12}\.yeagoblab\.com'
# Patrones personales (p. ej. tu correo) NO van en el repo: se leen de ~/.config/audit-secrets-extra.txt (una expresión por línea; no se versiona).
EXTRA="$HOME/.config/audit-secrets-extra.txt"; EXTRAARG=(); [ -f "$EXTRA" ] && EXTRAARG=(-f "$EXTRA")
# Se excluye este propio script, que contiene los patrones.
if grep -rEn --exclude-dir=.git --exclude-dir=node_modules --exclude=audit-secrets.sh -e "$PAT" "${EXTRAARG[@]}" "$DIR"; then
  echo "AUDITORÍA: posibles secretos encontrados (arriba)." >&2
  exit 1
fi
echo "AUDITORÍA: limpio."
