# CHANGELOG

## 2026-10-21 (mejora 1)
- **Mapas rotativos con buff por tipo:** 6 mapas, cambio cada 75 s con aviso, destello y contador en el HUD; ×1.2 en la especialidad de cada tipo (`TYPE_BUFF`) para hostiles y compañero. Vida máxima y tamaño se aplican al cambiar de mapa y se revierten.
- **Hostiles tipados:** 6 hostiles (uno por tipo) y legendarios de tipo (6, uno por tipo).
- **Criaturario:** enciclopedia de 18 criaturas y 6 mapas con desbloqueo por descubrimiento, persistente en `localStorage` y compatible con partidas anteriores.
- `scripts/smoke.js` comprueba los buffs con valores exactos y el desbloqueo del Criaturario.

## 2026-10-21
- Primera versión: un solo `index.html` con menú, 6 compañeros procedurales (3 gratis, 3 por Gacha, versión shiny), 6 movimientos con evolución al nivel 5, Vínculo, objetos, 4 tipos de enemigo y jefe legendario cada 4 minutos, mejoras permanentes, estadísticas, sonido por osciladores y control táctil.
- Prueba de humo en Node (`scripts/smoke.js`): 12 minutos simulados sin errores. Sin probar aún visualmente en navegador.
- Repo preparado para GitHub privado (sin commit todavía).
