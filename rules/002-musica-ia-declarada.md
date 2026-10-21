# 002 — Música de IA declarada, con licencia verificada y anotada
**Estado:** vigente
**Desde:** 2026-10-21

## Regla
Toda pista de `music/` se genera con una herramienta de licencia verificada (hoy ACE-Step v1 3.5B en local, Apache-2.0), se anota en `musica-ia-lofi/catalogo/canciones.csv` al guardarla y el juego declara que la música es de IA. Los ficheros de audio no se suben a Git.

## Por qué
La regla 001 de `musica-ia-lofi` prohíbe usar en algo público una canción de licencia «sin verificar», y este juego tiene una versión pública. La ficha del modelo pide declarar el uso de IA y no hacerla pasar por música humana.

## Cómo aplicarla
- Generar con `scripts/generar_musica.sh`, que añade la fila al catálogo (herramienta, prompt, semilla, licencia y uso permitido).
- Si se cambia de herramienta o de plan, verificar su licencia antes de usar la pista en la demo pública y anotarla.
- Mantener la mención de IA en la Guía (`panelGuide`) y en el README mientras haya pistas.
- Prompts sin nombres de artistas reales ni datos personales.
