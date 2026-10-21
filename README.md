# Criaturas Survivor

Juego de supervivencia tipo *Survivor* para el navegador: eliges un compañero, esquivas hordas, subes de nivel y mejoras tus ataques. Todo en **un solo `index.html`** (canvas + JavaScript, sin dependencias ni servidor). Proyecto de aprendizaje.

Las criaturas se dibujan por código a partir de una semilla; no hay imágenes, sonidos ni nombres de terceros (ver `rules/001-sin-assets-oficiales.md`).

## Cómo jugar
Abre `index.html` en el navegador (o sírvelo con cualquier servidor estático).

| Acción | Control |
|---|---|
| Moverse | WASD / flechas / arrastrar el dedo |
| Atacar | Automático |
| Movimiento principal (+25% daño) | 1–4 · Q/E |
| Pausa | Esc |

- Recoge gemas para subir de nivel y elige 1 de 3 recompensas (R cambia las opciones).
- Un movimiento al nivel 5 **evoluciona**. Niveles 5, 15, 25…: un objeto (solo uno). Niveles 10, 20, 30…: **Vínculo**, que une dos movimientos en un hueco.
- Cada 4 minutos llega un jefe legendario (de un tipo al azar).
- **Mapas:** hay 6 (uno por tipo) y cambian cada 75 s. Las criaturas del tipo del mapa, hostiles o tu compañero, reciben **×1.2 en su especialidad**: Fuego daño · Agua resistencia · Planta vida máxima · Eléctrico velocidad · Sombra cadencia · Dragón tamaño y alcance. Un aro de color marca a las que están potenciadas. Se ajusta en `MAP_BUFF`, `MAP_EVERY` y `TYPE_BUFF`.
- **Ventajas y control:** cada tipo es fuerte contra uno y débil contra otro (×1.3 / ×0.75, en ambos sentidos). Hay 6 movimientos de control con un estado propio por tipo: ralentizar (agua), inmovilizar (planta), paralizar (eléctrico), quemar (fuego), reducir el alcance (sombra) y arrastrar con un tornado (dragón). Se ajusta en `EFF_UP`, `EFF_DOWN`, `STRONG` y la tabla `MOVES`.
- **Pasivas y ramas:** además de movimientos hay 12 pasivas en 4 ramas (Agilidad, Fortaleza, Poder, Ingenio; hasta nivel 5, 4 por partida). Las ramas opuestas se excluyen (Agilidad ⟂ Fortaleza, Poder ⟂ Ingenio): al coger una, la opuesta deja de salir. Tablas `BRANCHES` y `PASSIVES`. También hay 3 movimientos nuevos (Esporas, Zarpazo, Cometa).
- **Criaturario:** enciclopedia en el menú. Hostiles y legendarios se descubren al verlos de cerca, los compañeros al conseguirlos y los mapas al visitarlos; muestra especialidad, estadísticas, descripción y bajas.
- Las monedas compran mejoras permanentes y tiradas de Gacha (compañeros nuevos y versiones shiny, +10% daño).
- El progreso se guarda en `localStorage` del navegador.

## Estructura del código
`index.html` está dividido en 9 secciones comentadas: 1 datos (`TYPES`, `SPECIES`, `MOVES`, `ITEMS`, `ENEMY_TYPES`, `UPGRADES`) · 2 guardado · 3 sprites procedurales · 4 audio (osciladores) · 5 estado de la run · 6 lógica (`update`, `fire`, subida de nivel) · 7 dibujo · 8 menús · 9 bucle principal.

- Equilibrar: editar las tablas de la sección 1 y `xpNeed`.
- Añadir un movimiento: entrada en `MOVES` + `case` en `fire()`.

## Probar
```
node scripts/smoke.js          # simula 12 min de partida sin navegador
bash scripts/audit-secrets.sh  # antes de cada commit
```

## Publicación (homelab)
La copia servida por el homelab se actualiza con `scripts/sync-dashboard.sh --apply` (simula por defecto). Detalles de despliegue en el repo `dashboard-stack`.

## Estado
Jugable. Pendiente de probar a mano en navegador real y de afinar el equilibrio (la subida de nivel es muy rápida). Ver `memory.md`.
