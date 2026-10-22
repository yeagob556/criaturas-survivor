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

### 2026-10-22 — v0.12.0: versión portable y repositorio listo para GitHub
- **Qué cambió:** paquetes portables (`empaquetar.sh`: completa con música ~16 MB y ligera ~160 KB, con .zip, LEEME, créditos y lanzadores); música en modo directo para `file://` (WebAudio queda mudo allí; medido); exportar/importar partida validado y saneado; `probar-portable.sh` (Chromium real por `file://`: carga, música, exportar/importar); `publicar-github.sh` (crea el repo PRIVADO, simula por defecto); CI (`smoke.yml`); LICENSE (todos los derechos reservados); capturas y secciones nuevas en el README.
- **Ficheros:** `index.html` (4b música directa, 2 exportar/importar, Estadísticas), `scripts/empaquetar.sh`, `scripts/probar-portable.sh`, `scripts/probar_portable.py`, `scripts/publicar-github.sh`, `scripts/audit-secrets.sh` (admite carpeta), `.github/workflows/smoke.yml`, `LICENSE`, `docs/capturas/`, `.gitignore`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `scripts/smoke.js`
- **Decisiones:** el repo se prepara pero NO se sube: `publicar-github.sh --apply` lo ejecuta el usuario (código fuera de la torre); música fuera de Git por la regla 002 (va en el paquete portable); el ingestor de partidas ignora todo lo desconocido; la demo y la pública NO se sincronizan (hay jugadores activos), sólo la versión de prueba.
- **Hallazgos:** `capturas/` sin barra ignoraba también `docs/capturas/`; el Docker de esta sesión no ve el `/tmp` del shell (carpetas bajo el home).
- **Pendiente:** el usuario ejecuta `publicar-github.sh --apply` cuando quiera; sincronizar demo y pública cuando no haya jugadores activos.

### 2026-10-22 — v0.11.0: fondo animado en el menú
- **Qué cambió:** mapa de bioma de fondo en el menú con criaturas por rutas fijas (compañero + cola de hostiles que lo persiguen y orbes, 2.º compañero, legendario del mapa, Titán si se ha visto); rota cada 16 s con fundido a negro; menú translúcido.
- **Ficheros:** `index.html` (sección 8b: `drawMenuBg`, `menuEscena`, `menuMapa`, `RUTA`, `withCtx`; `ctx` pasa a `let`; `frame`, `resize`, CSS `#ovMenu`), `scripts/smoke.js`, `scripts/capturas.py/.sh`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`
- **Decisiones:** rutas deterministas en vez de IA y mapa precalculado para gastar poco (≈30 fps, 2-3 ms/fotograma sin GPU); anillo alrededor de la caja del menú porque el centro queda tapado; quieto con panel abierto o `prefers-reduced-motion`; memoria liberada en partida.
- **Hallazgo:** el Docker de esta sesión no veía el `/tmp` del shell (carpetas vacías montadas → «SAVE is not defined»); `capturas.sh` usa `~/.cache`.
- **Pendiente:** el usuario lo prueba en la versión de prueba (sobre todo en móvil y en un equipo flojo); sincronizar y commitear cuando lo ordene.

### 2026-10-21 — v0.10.2: el Titán congelaba la pantalla
- **Qué cambió:** el primer descanso del Titán (≈10 s tras despertar) lanzaba `TypeError` al leer `TYPES['primordio']` y mataba el bucle principal; ahora el descanso no lleva tipo, `startBossStep` ignora tipos inexistentes y `frame` usa `seguro(...)` para no morir por un error.
- **Ficheros:** `index.html` (`startBossStep`, `megaPick`, `frame`, `seguro`), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`
- **Decisiones:** reproducido primero en Node dejando actuar al Titán sin trucos; las pruebas anteriores lo mantenían en pausa (`bs.t = -999`) y por eso no lo vieron. La versión 0.10.0/0.10.1 sigue en la demo y la pública hasta que el usuario ordene sincronizar.
- **Lección:** probar a los jefes **actuando solos** durante minutos, no sólo paso a paso.
- **Pendiente:** el usuario confirma en la versión de prueba y ordena sincronizar demo y pública (recomendado: la pública tiene el fallo a los 20 min).

### 2026-10-21 — v0.10.1: el Titán, 10× de vida, regeneración y adaptación al daño
- **Qué cambió:** vida = 10 × `bossHp(t, n)` (+50% por Titán); regeneración 0,1%/s; `megaAdapt`: con poco daño se impacienta (+40% vel, +25% daño, +30% cadencia) y con mucho gana armadura (hasta 50%); HUD con las etiquetas.
- **Ficheros:** `index.html` (`MEGA`, `bossHp`, `megaK`, `megaAdapt`, `hurt`, `bossStep`, HUD), `scripts/smoke.js`, `scripts/capturas.py`, `README.md`, `CHANGELOG.md`
- **Decisiones:** el daño se mide en bruto (antes de la armadura) para que la armadura no distorsione la medición; 20 s de gracia y media móvil de 8 s; referencia: matarlo en 150 s; todo ajustable en `MEGA`.
- **Pendiente:** equilibrar con una partida real; sincronizar y commitear cuando el usuario lo ordene.

### 2026-10-21 — Mejora 9: megajefe Primordio, el Titán (v0.10.0)
- **Qué cambió:** megajefe a los 20 min (y cada 20) con todos los ataques de los 6 tipos elegidos por distancia (cerca/media/lejos, rotación fija y descanso cada 3), invocaciones de legendarios (inicio y 75/50/25%), lluvia de meteoros, tornados dobles, embestida que cierra distancia, furia al 30%, barra propia, botín y ficha en el Criaturario (19).
- **Ficheros:** `index.html` (tablas `MEGA`, `MEGA_MOVES`, `MEGA_T`, `BOSS_ATK` summon/rain; `spawnMega`, `megaPick`, `megaWatch`, cambios en `startBossStep/bossAct/bossStep/kill`), `scripts/smoke.js`, `scripts/capturas.py`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`
- **Decisiones:** el repertorio sale de los guiones de los legendarios para no duplicar; el Titán es del pseudotipo `primordio` (sin ventajas ni debilidades) y cada ataque lleva su propio tipo (`b.atk`); los legendarios normales se pausan mientras vive y tras caer esperan ≥60 s; vida 30000+10/s y +50% por Titán (sin equilibrar: ningún jugador ha llegado aún a los 20 min en las pruebas).
- **Pendiente / siguiente paso:** equilibrar vida/daño del Titán con una partida real (hace falta llegar a 20 min; se puede forzar con `G.t=1195` en la consola); sincronizar y commitear cuando el usuario lo ordene.

### 2026-10-21 — Mejora 8: eventos, cofres, aparición progresiva y líquidos contrarios (v0.9.0)
- **Qué cambió:** aparición de hostiles progresiva; 3 eventos aleatorios (marea, lluvia de agua con buffs/nerfeos, lluvia de fuego con meteoritos avisados); cofres pequeños y grandes; líquidos que castigan al tipo contrario (×1,5 y -20% de daño) y no afectan al del mapa.
- **Ficheros:** `index.html` (tablas `EVENTS/RAIN_FX/METEOR/CHEST`, `spawnRate/spawnCap`, `startEvent/updateEvents/meteorHit`, `openChest`, `liqEffect`, `drawChest/drawMeteor*`), `scripts/smoke.js`, `scripts/capturas.py`, `README.md`, `CHANGELOG.md`, `CLAUDE.md`
- **Decisiones:** «tipo contrario» = el tipo al que el tipo del mapa le gana según la tabla de ventajas (p. ej. en lava, la planta); neutros: efecto normal. La lluvia de agua actúa por tipo sobre las estadísticas de especialidad. Los cofres forman parte del mundo por trozos (deterministas, se guardan en `G.broken`).
- **Lección:** un comentario `//` mal puesto comentó el código de `closeLevelUp` y dejó el juego pausado; lo cazó la captura (no las pruebas) y se añadieron pruebas de avance de la simulación y de reanudar al elegir; `eq`/`near` ya fallan con `NaN`.
- **Pendiente / siguiente paso:** el usuario prueba el equilibrio (ritmo de aparición, frecuencia y dureza de los eventos, botín de cofres); sincronizar y commitear cuando lo ordene.

### 2026-10-21 — v0.8.4: la hierba aguanta más
- **Qué cambió:** vida de la hierba 10 → 22,5 (la mitad de una piedra, por petición del usuario); ya no la rompe un solo disparo y la visión reducida dura más.
- **Ficheros:** `index.html` (`OBS_HP`), `scripts/capturas.py`, `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** definida como `OBS_HP.piedra/2` para que siga la proporción si se cambia la vida de la piedra; con Ascuas Nv1 caen en dos disparos (~1,3 s), así que sigue siendo efímera si atacas de continuo.
- **Pendiente / siguiente paso:** que el usuario la pruebe; si se quiere un efecto más duradero, subir más la vida o evitar que los proyectiles propios la rompan al salir; sincronizar y commitear cuando lo ordene.

### 2026-10-21 — v0.8.3: causa raíz del «estirado» y herramienta de capturas
- **Qué cambió:** `canvas{position:fixed;inset:0;...}` global → `#cv{...}`; arregla la tragamonedas (a pantalla completa y visible antes de tirar) y los sprites de Compañeros y Criaturario (amontonados en la esquina). Nuevo `scripts/capturas.sh`/`capturas.py` (Playwright en Docker). HUD del mapa aclarado y etiquetas de jefe más arriba.
- **Ficheros:** `index.html` (CSS, `lighten`, etiquetas de jefe), `scripts/capturas.sh`, `scripts/capturas.py`, `scripts/smoke.js`, `.gitignore`, `README.md`, `CLAUDE.md`, `CHANGELOG.md`
- **Decisiones:** las capturas se hacen con la imagen oficial `mcr.microsoft.com/playwright/python:v1.64.0-noble` (3,5 GB en disco, desechable con `--rm`) sirviendo la copia del juego dentro del contenedor (sin puertos ni red de la torre); instalada con permiso del usuario. Los ajustes de tamaño de v0.8.1/v0.8.2 compensaban un fallo de CSS que no era de tamaño.
- **Hallazgo pendiente de decidir:** la hierba (10 de vida) se rompe al instante con cualquier disparo propio, así que la visión reducida casi no se nota si atacas; valorar más vida a la hierba o que los proyectiles no la rompan al salir.
- **Pendiente / siguiente paso:** el usuario valora el tamaño real de la tragamonedas ahora que se ve bien; sincronizar y commitear cuando lo ordene.

### 2026-10-21 — v0.8.2: tragamonedas más baja y ancha, y sólo al tirar
- **Qué cambió:** lienzo 280×150 → 320×108; la máquina está oculta (`.slotwrap` colapsada) hasta pulsar «Tirar» y se despliega debajo de los botones; sigue visible hasta cerrar el panel.
- **Ficheros:** `index.html` (`SLOT_W/H/CELL`, `slotSymbol`, `slotDraw`, `panelGacha`, CSS `.slotwrap`), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** colocada bajo los botones para que no se desplacen al aparecer; se queda tras la tirada (interpretación mía: «sólo aparezca cuando pulsemos»); sin captura real, el aspecto lo juzga el usuario.
- **Pendiente / siguiente paso:** que el usuario lo compruebe; sincronizar y commitear cuando lo ordene.

### 2026-10-21 — v0.8.1: tragamonedas más compacta y arriba
- **Qué cambió:** lienzo 320×230 → 280×150 (apaisado), casillas de 48 px; el panel del Gacha se alinea arriba (`openPanel(..., arriba)`) y la lista de resultados tiene altura máxima.
- **Ficheros:** `index.html` (`SLOT_W/SLOT_H/SLOT_CELL`, `slotSymbol`, `slotDraw`, `openPanel`, `panelGacha`), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** corrección → `0.8.1`; sin poder ver el navegador, la prueba sólo garantiza proporción apaisada y la alineación superior; el tamaño final lo juzga el usuario.
- **Pendiente / siguiente paso:** que el usuario compruebe el tamaño en su pantalla y móvil; sincronizar y commitear cuando lo ordene.

### 2026-10-21 — Mejora 7: habilidades de los monstruos y jefes con guion (v0.8.0)
- **Qué cambió:** violetas con la mitad de alcance; disparos bloqueados por montañas y árboles; embestidas con aviso en el suelo (Chispamurci, Magmaroca, Dracoaleta); jefes con guion fijo de 5 ataques por tipo con avisos, estados en el jugador (burn/slow/root/dark) y furia al 30% (+20% daño).
- **Ficheros:** `index.html` (tablas `REACH`, `PS_FX`, `BOSS_ATK`, `BOSS_SCRIPT` en la sección 1; `spawnBoss`, `enemyDash`, `bossStep`, `bossAct`, `hitPlayerFx` en lógica; `drawTelegraph`, `drawPath` en dibujo), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** «los violetas» = hostiles de tipo Sombra; el reparto del guion usa los nombres de los movimientos del propio tipo; las ondas/zonas de los jefes aplican el estado del tipo (espejo de los movimientos de control del jugador); el contacto normal de un jefe sigue existiendo además de sus ataques; las piedras no frenan los disparos. Interpretaciones por confirmar con el usuario.
- **Pendiente / siguiente paso:** verlo en navegador real (legibilidad de los avisos, dificultad de los jefes, rendimiento); sincronizar y commitear cuando lo ordene (la v0.7.0 del tragamonedas está guardada aparte por si se quiere commitear por separado).

### 2026-10-21 — Mejora 6: Gacha como tragamonedas retro (v0.7.0)
- **Qué cambió:** el Gacha pasa a una máquina dibujada por código (3 rodillos, palanca, bombillas) que sólo enseña una tirada ya decidida: criatura · tipo · desenlace (NEW/✨/+40). ×10 con cola y «Saltar animación». `gachaRoll()` devuelve objeto.
- **Ficheros:** `index.html` (sección «Gacha: tragamonedas retro»), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** sólo visual por petición del usuario (mismas probabilidades); los rodillos no muestran «tres iguales» para no sugerir premio; duración de frenado fija para que los rodillos paren siempre en orden (lo cazó la prueba).
- **Pendiente / siguiente paso:** verlo en un navegador real (aspecto, ritmo del ×10); sincronizar y commitear cuando el usuario lo ordene.

### 2026-10-21 — Versión visible y documentación completa (v0.6.0)
- **Qué cambió:** `VERSION`/`VERSION_DATE` visibles en el menú, la Guía y la esquina del juego; CHANGELOG con versión por encabezado; README reescrito; CLAUDE.md actualizado (flujo, gotchas nuevos); `AGENTS.md` apuntando a CLAUDE.md; reglas 002 (música de IA) y 003 (versión coherente); `smoke.js` comprueba que la versión coincide con CHANGELOG y README.
- **Ficheros:** `index.html`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`, `rules/002-musica-ia-declarada.md`, `rules/003-version-coherente.md`, `rules/README.md`, `scripts/smoke.js`
- **Decisiones:** `/init` no hacía falta: ya existía `CLAUDE.md` y se actualizó a mano; esquema de versión `0.x.0` por mejora (0.1.0 = primera versión); sin hosts, IPs ni puertos en los documentos.
- **Pendiente / siguiente paso:** sincronizar y commitear cuando el usuario lo ordene (la versión no se ve en la demo hasta sincronizar); comprobar que se ve bien en navegador real.

### 2026-10-21 — Mejora 5: música de fondo por mapa
- **Qué cambió:** motor de música (`playMusic`/`musicTick` en la sección 4b), botón Música, `scripts/generar_musica.sh` y `sync-dashboard.sh` con pistas; licencia de ACE-Step verificada (Apache-2.0).
- **Ficheros:** `index.html` (sección 4b), `scripts/generar_musica.sh`, `scripts/sync-dashboard.sh`, `scripts/smoke.js`, `.gitignore`, `README.md`, `CHANGELOG.md`
- **Decisiones:** pistas como ficheros opcionales (no embebidas en base64) para no inflar el HTML; el motor tolera que falten. Pendiente decidir si la IA da calidad suficiente (si no, alternativa: chillout procedural con WebAudio, sin ficheros).
- **Hecho:** 6 pistas generadas con ACE-Step (90 s, ~2,6 MB cada una, fuera de Git) y anotadas en el catálogo de `musica-ia-lofi`; `media-src 'self'` añadido al CSP de `nginx.conf` y `nginx-publico.conf` (dashboard-stack). Ojo: esos ficheros están montados como fichero suelto; tras editarlos con `sed -i` hay que **reiniciar** los contenedores (un `nginx -s reload` sigue leyendo el inodo viejo).
- **Pendiente / siguiente paso:** que el usuario valore la calidad; si alguna pista no convence, regenerar con otro prompt o semilla (`generar_musica.sh --apply <tipo>`).

### 2026-10-21 — Mejora 4: obstáculos que cambian con el mapa
- **Qué cambió:** mundo por trozos con montañas, árboles, piedras, hierba alta y líquidos; aspecto, nombre y efecto salen del tipo del mapa actual; colisiones, destrucción y visión reducida.
- **Ficheros:** `index.html` (`BIOME`, `OBS_HP`, sección «Mundo»: `getChunk`/`refreshNear`/`hitObs`/`hitArea`/`liqAt`, `update`, `draw*`), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** el objeto sólo guarda su clase y el bioma se resuelve al dibujar/aplicar, así cambia al rotar el mapa sin regenerar; proyectiles y ataques pasan por encima de montañas y árboles; líquidos afectan también a hostiles; los del tipo del mapa son inmunes. Interpretación mía de «reducen la visión»: oscurecimiento radial mientras estás dentro y la hierba tapa a quien esté dentro.
- **Pendiente / siguiente paso:** probar en navegador (rendimiento con muchos objetos, densidad, atascos); ajustar daños y velocidades de los líquidos; sincronizar y commitear solo cuando el usuario lo ordene.

### 2026-10-21 — Mejora 3: ventajas por tipo y movimientos de control
- **Qué cambió:** triángulos de ventaja/debilidad (×1.3/×0.75, ambos sentidos) y 6 movimientos de control (ralentizar, inmovilizar, paralizar, quemar, alcance reducido, tornado) uno por tipo; jefes resistentes; estados visibles.
- **Ficheros:** `index.html` (`STRONG`/`eff`, `MOVES`, `status`/`dot`/`hurt`/`playerHit`, bucle de enemigos, tornados, dibujo), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** interpreté «alcance más reducido» como reducir el alcance del enemigo (contacto, disparos y vida de las balas), no el tuyo; «debilidades y buffos» como la tabla de ventajas por tipo; el tipo del movimiento llega a `hurt` por `curMT` y `p.mt`. Revisar ambas lecturas con el usuario.
- **Pendiente / siguiente paso:** probar en navegador; ajustar duraciones y ×1.3/×0.75; sincronizar y commitear solo cuando lo ordene.

### 2026-10-21 — Mejora 2: pasivas con ramas excluyentes y 3 movimientos nuevos
- **Qué cambió:** 12 pasivas en 4 ramas (Agilidad, Fortaleza, Poder, Ingenio) con exclusión por parejas, y movimientos Esporas, Zarpazo y Cometa.
- **Ficheros:** `index.html` (tablas `BRANCHES`/`PASSIVES`, `mult`, `offerOptions`, `chooseOffer`, `fire`, HUD), `scripts/smoke.js`, `README.md`, `CHANGELOG.md`
- **Decisiones:** interpreté «si sale una de agilidad que no salga de fortaleza» como bloqueo de la rama opuesta durante la partida y sin mezcla en la misma oferta; se quitaron Zapatillas/Entrenamiento/Atracción genéricas porque saltaban las ramas. Revisar si el usuario quería otra regla.
- **Pendiente / siguiente paso:** probar en navegador (servidor temporal); ajustar valores por nivel; sincronizar y commitear solo cuando lo ordene.

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
