#!/usr/bin/env bash
# Genera la música de fondo (una pista chillout por tipo de mapa) con ACE-Step en el ComfyUI del PC,
# usando el script del repo creacion-local. Simula por defecto; --apply genera.
#   export COMFY_HOST=<IP Tailscale o nombre MagicDNS del PC>   # no se guarda en el repo
#   Arrancar antes ComfyUI en el PC (iniciar-comfyui.bat). Un trabajo de GPU a la vez.
#   SEGUNDOS=90 PASOS=50 bash scripts/generar_musica.sh --apply [tipo ...]   # sin tipos: los 6
# Las pistas van a music/ (fuera de Git, regla 001 de musica-ia-lofi) y cada una se anota en su catálogo.
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
GEN="$HOME/repos/creacion-local/scripts/comfy_generar.py"
CATALOGO="$HOME/repos/musica-ia-lofi/catalogo/canciones.csv"
SEGUNDOS="${SEGUNDOS:-90}"; PASOS="${PASOS:-50}"
APPLY=0; TIPOS=()
for a in "$@"; do if [ "$a" = "--apply" ]; then APPLY=1; else TIPOS+=("$a"); fi; done
[ ${#TIPOS[@]} -gt 0 ] || TIPOS=(fuego agua planta electrico sombra dragon)

# Misma tonalidad (La menor) y tempos parecidos (65-85 bpm) para que el fundido entre mapas no choque.
declare -A TAGS=(
  [fuego]="chillout, downtempo, instrumental, warm analog synth pads, soft rhodes electric piano, slow deep bass, gentle percussion, volcanic ambient, A minor, 75 bpm, warm, hypnotic, smooth"
  [agua]="chillout, ambient, instrumental, soft piano, watery reverb, gentle arpeggios, deep calm pads, ocean atmosphere, A minor, 70 bpm, serene, flowing"
  [planta]="chillout, acoustic, instrumental, nylon guitar, soft marimba, airy flute, gentle shaker, forest ambience, A minor, 80 bpm, peaceful, organic, warm"
  [electrico]="chillout, electronic downtempo, instrumental, glassy bell synth, soft pulsing bassline, airy pads, light electronic beat, A minor, 85 bpm, bright, dreamy, shimmering"
  [sombra]="chillout, dark ambient, instrumental, deep pads, sparse piano, low drone, soft sub bass, mysterious, A minor, 65 bpm, moody, slow, ethereal"
  [dragon]="chillout, epic ambient, instrumental, airy synth strings, soft harp, wide pads, slow soft drums, mountain atmosphere, A minor, 70 bpm, majestic, calm, cinematic"
)
declare -A SEMILLA=([fuego]=20261021 [agua]=20261022 [planta]=20261023 [electrico]=20261024 [sombra]=20261025 [dragon]=20261026)

echo "Pistas a generar (${SEGUNDOS} s, ${PASOS} pasos): ${TIPOS[*]}"
for t in "${TIPOS[@]}"; do [ -n "${TAGS[$t]:-}" ] || { echo "Tipo desconocido: $t"; exit 1; }; echo " - $t: ${TAGS[$t]}"; done
if [ "$APPLY" != 1 ]; then echo "SIMULACIÓN: repite con --apply para generar."; exit 0; fi
[ -n "${COMFY_HOST:-}" ] || { echo "Falta COMFY_HOST (IP Tailscale o nombre del PC)."; exit 1; }
curl -s -m5 -o /dev/null "http://$COMFY_HOST:${COMFY_PORT:-8188}/system_stats" || { echo "ComfyUI no responde: arráncalo en el PC (iniciar-comfyui.bat)."; exit 1; }
mkdir -p "$RAIZ/music"
for t in "${TIPOS[@]}"; do
  salida="$RAIZ/music/$t.mp3"
  python3 "$GEN" musica "${TAGS[$t]}" --segundos "$SEGUNDOS" --pasos "$PASOS" --semilla "${SEMILLA[$t]}" --salida "$salida"
  if [ -f "$CATALOGO" ]; then
    python3 - "$CATALOGO" "$t" "${TAGS[$t]}" "$SEGUNDOS" "$PASOS" "${SEMILLA[$t]}" <<'PY'
import csv, sys, datetime
cat, t, tags, seg, pasos, semilla = sys.argv[1:]
fila = [f"criaturas-survivor/music/{t}.mp3", datetime.date.today().isoformat(), "ACE-Step v1 3.5B en ComfyUI (PC local, RTX 5060)", "local, sin plan",
        f"tags: {tags} | letra: [instrumental] | {seg} s, {pasos} pasos, cfg 5, seed {semilla}",
        "Apache-2.0 verificada el 2026-10-21 en el repo oficial (ace-step/ACE-Step) y en la ficha de los pesos (ACE-Step/ACE-Step-v1-3.5B); condición ética: declarar el uso de IA",
        "juego Criaturas Survivor (incluida la versión pública) declarando que la música es de IA"]
with open(cat, "a", newline="") as f: csv.writer(f).writerow(fila)
PY
  fi
done
echo "Listo. Pruébalas en el juego y, si te gustan, sincroniza con scripts/sync-dashboard.sh --apply."
