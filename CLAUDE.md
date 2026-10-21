# criaturas-survivor

Juego tipo *Survivor* en **un solo `index.html`** (canvas + JS vanilla, sin dependencias) + 6 pistas de música opcionales en `music/`. Resumen y estructura en `README.md`.

## Antes de tocar nada
1. Lee `rules/README.md`: 001 sin assets oficiales · 002 música de IA declarada y anotada · 003 versión coherente con el CHANGELOG.
2. El juego es **un solo fichero**: no separar en módulos ni añadir dependencias sin pedirlo. La música son ficheros aparte porque embeberla inflaría el HTML.
3. Las secciones de `index.html` (comentadas) son: 1 datos · 2 guardado · 3 sprites · 4 audio · 4b música · 5 estado · 6 lógica (+«Mundo») · 7 dibujo · 8 menús · 9 bucle. Las tablas de la sección 1 son lo que se ajusta para equilibrar.

## Flujo de trabajo (acordado con el usuario)
1. Implementar y ampliar `scripts/smoke.js` con aserciones exactas de lo nuevo. Si hay cambios visuales, ejecutar `scripts/capturas.sh` y **mirar las imágenes** (smoke.js no ve el CSS ni el dibujo: un `canvas{position:fixed}` global estuvo rompiendo fichas y tragamonedas sin que ninguna prueba lo notara).
2. Probar en un servidor temporal que sirva **solo una copia** de `index.html` y `music/` (nunca el repo: tiene `.git` y `memory.md`), en LAN/Tailscale; apagarlo al terminar.
3. **Solo cuando el usuario lo ordene:** `audit-secrets.sh` → `smoke.js` → `sync-dashboard.sh --apply` → commit. Nada de commit ni push por iniciativa propia.
4. Si se sube de versión: `VERSION`/`VERSION_DATE` en `index.html`, primer encabezado de `CHANGELOG.md` y `README.md` a la vez (regla 003).
5. Tras cada tarea: entrada arriba en `memory.md` y línea en `CHANGELOG.md`.

## Comandos
```
bash scripts/capturas.sh [carpeta]       # capturas con Chromium sin pantalla: ÚSALO para comprobar lo visual antes de pedir al usuario que pruebe
node scripts/smoke.js                    # debe acabar en "SMOKE OK"
bash scripts/audit-secrets.sh            # antes de cada commit; debe salir "limpio"
bash scripts/sync-dashboard.sh --apply   # copia index.html y music/ a la demo servida (simula por defecto)
COMFY_HOST=<pc> bash scripts/generar_musica.sh --apply [tipo ...]   # regenera pistas (ComfyUI arrancado en el PC)
```

## Gotchas
- `smoke.js` extrae el `<script>` con una regex: si se añade un segundo `<script>` hay que ajustarlo.
- Las funciones del juego son globales (`G`, `update`, `fire`, `chooseOffer`, `curOffer`, `getChunk`…) y `smoke.js` las llama directamente. Para pruebas exactas **sustituye `getChunk`** por un mundo vacío o a medida (los obstáculos reales salen al azar y harían las pruebas inestables) y limpia `keys` antes de simular movimiento.
- El audio de las pruebas es falso (`Audio`/`AudioContext` simulados en `smoke.js`): no valida cómo suena, solo la lógica de fundidos, bucle y pausa.
- Cada `fire()` fija `curMT` (tipo del movimiento) para calcular ventajas/debilidades en `hurt()`; los proyectiles llevan `p.mt`. Si se añade otra forma de dañar, pasar el tipo a `hurt(e, d, mt)`.
- Eventos: `G.ev` (uno a la vez) los gestiona `updateEvents`; los multiplicadores de la lluvia entran por `evMul` dentro de `buffFor` (sólo estadísticas dmg/spd/rate/res; hp y size se aplican por `syncEnemy`). Los cofres y objetos nuevos del mundo se añaden **al final** de `getChunk` para no cambiar el terreno ya generado con la misma semilla. Las elecciones de cofre van por `G.chestOffers` y `closeLevelUp` sólo consume un nivel pendiente si la oferta no es de cofre.
- **Cuidado al editar con reemplazos de texto:** poner un comentario `//` al final de una línea que antes seguía con código deja ese código comentado (así se rompió `closeLevelUp`). Después de tocar la lógica de pausa/niveles, ejecutar `smoke.js` y mirar las capturas.
- Hostiles con habilidades: `enemyDash` (embestidas) y `bossStep` (guion de los jefes) devuelven «ocupado» y el bucle de enemigos anula la persecución (`ch`). Los jefes se crean con `spawnBoss()` (úsalo también en las pruebas). El alcance sale siempre de `reachOf(e)` (violetas ×0.5 y Niebla ×0.45). Los estados del jugador están en `G.ps` y los ataques de área de los jefes los aplican con `hitPlayerFx`.
- En `smoke.js` los nombres de las pruebas viven todos en el mismo ámbito: usa nombres nuevos o bloques `{ }` (ya ha dado `already been declared`).
- Los obstáculos guardan solo su clase; nombre, aspecto y efecto salen de `BIOME[G.map.type]` al dibujar/aplicar, así cambian al rotar el mapa sin regenerar el mundo.
- Servidor de las demos: los nginx de `dashboard-stack` montan su `.conf` como **fichero suelto**; tras editarlos con `sed -i` hay que `docker restart` (un `nginx -s reload` lee el inodo viejo). El CSP necesita `media-src 'self'` para el audio.
- `Z` (zoom) y `W/H` dependen de `devicePixelRatio`; el joystick táctil convierte de píxeles CSS a unidades de canvas en `drawHUD`.
- Sin ver el juego en un navegador real no hay forma de validar el aspecto ni el sonido: pedir confirmación al usuario.
- La fuente de verdad es este repo; la copia de `dashboard-stack/demos/criaturas-survivor/html/` se actualiza con `sync-dashboard.sh`. `music/*.mp3` no se sube a Git; cada pista se anota en `musica-ia-lofi/catalogo/canciones.csv`.

## Secretos (obligatorio)
- Prohibido escribir IPs, puertos, nombres de host ocultos, tokens o contraseñas en cualquier fichero del repo (`COMFY_HOST` va por entorno). El juego no usa red ni claves.
- Antes de cada commit: `scripts/audit-secrets.sh` limpio. `git commit`/`push` solo por orden del usuario.
