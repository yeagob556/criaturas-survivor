# 003 — La versión del juego coincide con el CHANGELOG
**Estado:** vigente
**Desde:** 2026-10-21

## Regla
Cada mejora sube la versión (`0.x.0`; correcciones `0.x.y`). `VERSION` y `VERSION_DATE` de `index.html`, el primer encabezado de `CHANGELOG.md` (`## vX.Y.Z — fecha · título`) y la versión citada en `README.md` deben ser la misma.

## Por qué
La versión se muestra en el menú, la Guía y el juego; si no coincide con el historial, no se sabe qué demo está publicada ni qué cambió.

## Cómo aplicarla
- Cambiar los tres sitios en la misma tarea.
- `node scripts/smoke.js` falla si `VERSION` no coincide con el CHANGELOG o no aparece como `vX.Y.Z` en el README.
- Tras sincronizar, comprobar que la versión visible en la demo es la esperada.
