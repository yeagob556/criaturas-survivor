# memory.md — registro de tareas

Regla: al **finalizar cada tarea** se añade una entrada arriba (la más reciente primero) con los ficheros que hay que mirar para retomarla. Sin secretos ni IDs reales.

## Plantilla

```markdown
### AAAA-MM-DD — Título de la tarea
- **Qué cambió:** una o dos líneas.
- **Ficheros:** `ruta/relativa.md`, `otra/ruta.py`
- **Decisiones:** (por qué se hizo así, alternativas descartadas)
- **Pendiente / siguiente paso:**
```

## Entradas

### 2026-10-21 — Mejora 1: mapas con buff por tipo y Criaturario
- **Qué cambió:** 6 mapas rotativos (cada 75 s) que dan ×1.2 en su especialidad a las criaturas de su tipo; hostiles y legendarios con tipo; enciclopedia «Criaturario» con desbloqueo por descubrimiento.
- **Ficheros:** `index.html` (secciones 1 datos, 2 guardado, 6 lógica, 7 dibujo, 8 menús), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** la especialidad de cada tipo es una estadística distinta (tabla `TYPE_BUFF`) en vez de un daño genérico; vida y tamaño se escalan en el cambio de mapa y se revierten (`syncEnemy`, `setMap`); los textos del Criaturario son propios (regla 001). Interpretación mía de «buff de prueba 1,2 y cada criatura tiene su especialidad»: revisar.
- **Pendiente / siguiente paso:** probar en navegador real; valorar si 75 s y ×1.2 son buenos valores; sincronizar con la demo/pública (`scripts/sync-dashboard.sh --apply`) tras la aprobación del usuario; sin commit todavía.

### 2026-10-21 — Primera versión y preparación del repo
- **Qué cambió:** juego completo en un solo `index.html`, documentación, scripts de auditoría/sincronización/humo y regla 001; publicado también como demo tras el panel del homelab.
- **Ficheros:** `index.html`, `README.md`, `CLAUDE.md`, `rules/001-sin-assets-oficiales.md`, `scripts/smoke.js`, `scripts/audit-secrets.sh`, `scripts/sync-dashboard.sh`
- **Decisiones:** criaturas y sprites procedurales propios (el original usa sprites CC BY-NC y código PolyForm Noncommercial; no se copió nada); un solo archivo por simplicidad de aprendizaje; Vínculo/objetos/Gacha inspirados en la interfaz del original, sin cuentas ni online; repo sin «Pokémon» en el nombre por la marca.
- **Pendiente / siguiente paso:** probar en navegador real y afinar equilibrio (`xpNeed`: nivel 85 en 12 min en simulación); crear el repo privado en GitHub y subir; ideas: misiones, más criaturas, jefes con ataques propios, mejorar el rendimiento con muchos enemigos.
