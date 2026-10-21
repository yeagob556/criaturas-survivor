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

### 2026-10-21 — Mejora 3: ventajas por tipo y movimientos de control
- **Qué cambió:** triángulos de ventaja/debilidad (×1.3/×0.75, ambos sentidos) y 6 movimientos de control (ralentizar, inmovilizar, paralizar, quemar, alcance reducido, tornado) uno por tipo; jefes resistentes; estados visibles.
- **Ficheros:** `index.html` (`STRONG`/`eff`, `MOVES`, `status`/`dot`/`hurt`/`playerHit`, bucle de enemigos, tornados, dibujo), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** interpreté «alcance más reducido» como reducir el alcance del enemigo (contacto, disparos y vida de las balas), no el tuyo; «debilidades y buffos» como la tabla de ventajas por tipo; el tipo del movimiento llega a `hurt` por `curMT` y `p.mt`. Revisar ambas lecturas con el usuario.
- **Pendiente / siguiente paso:** probar en navegador; ajustar duraciones y ×1.3/×0.75; sincronizar y commitear solo cuando lo ordene.

### 2026-10-21 — Mejora 2: pasivas con ramas excluyentes y 3 movimientos nuevos
- **Qué cambió:** 12 pasivas en 4 ramas (Agilidad, Fortaleza, Poder, Ingenio) con exclusión por parejas, y movimientos Esporas, Zarpazo y Cometa.
- **Ficheros:** `index.html` (tablas `BRANCHES`/`PASSIVES`, `mult`, `offerOptions`, `chooseOffer`, `fire`, HUD), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** interpreté «si sale una de agilidad que no salga de fortaleza» como bloqueo de la rama opuesta durante la partida y sin mezcla en la misma oferta; se quitaron Zapatillas/Entrenamiento/Atracción genéricas porque saltaban las ramas. Revisar si el usuario quería otra regla.
- **Pendiente / siguiente paso:** probar en navegador (puerto temporal 8118); ajustar valores por nivel; sincronizar y commitear solo cuando lo ordene.

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
