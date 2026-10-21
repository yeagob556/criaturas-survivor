# criaturas-survivor

## Antes de tocar nada
1. Lee `rules/README.md` (hoy solo la 001: sin assets oficiales).
2. El juego es **un solo fichero**: `index.html`. No separar en módulos ni añadir dependencias sin pedirlo.

## Al terminar cada tarea (obligatorio)
Entrada arriba en `memory.md` (fecha · qué cambió · ficheros · pendiente) y línea en `CHANGELOG.md`.

## Comandos
```
node scripts/smoke.js                    # prueba de humo (debe acabar en "SMOKE OK")
bash scripts/audit-secrets.sh            # antes de cada commit; debe salir "limpio"
bash scripts/sync-dashboard.sh --apply   # copia index.html a la demo servida por dashboard-stack
```

## Gotchas
- `smoke.js` extrae el `<script>` con una regex: si se añade un segundo `<script>` hay que ajustarlo.
- Para probar lógica nueva en Node, las funciones del juego son globales (`G`, `update`, `chooseOffer`, `curOffer`…); `smoke.js` las llama directamente.
- `Z` (zoom) y `W/H` dependen de `devicePixelRatio`; el joystick táctil convierte de píxeles CSS a unidades de canvas en `drawHUD`.
- Sin ver el juego en un navegador real no hay forma de validar el aspecto: pedir confirmación visual al usuario.
- La fuente de verdad es este repo; la copia de `dashboard-stack/demos/criaturas-survivor/html/` se actualiza con `sync-dashboard.sh`.

## Secretos (obligatorio)
- Prohibido escribir IPs, puertos, nombres de host ocultos, tokens o contraseñas. El juego no usa red ni claves.
- Antes de cada commit: `scripts/audit-secrets.sh` limpio. `git commit`/`push` solo por orden del usuario.
