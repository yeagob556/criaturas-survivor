# Criaturas Survivor

**Versión actual: v0.6.0** (2026-10-21). La versión se ve en el menú, en la Guía y en la esquina inferior derecha durante la partida.

Juego de supervivencia tipo *Survivor* para el navegador: eliges un compañero, esquivas hordas, subes de nivel y mejoras tus ataques. Todo el juego es **un solo `index.html`** (canvas + JavaScript, sin dependencias ni servidor); la música de fondo son seis ficheros de audio opcionales. Proyecto de aprendizaje.

Las criaturas se dibujan por código a partir de una semilla; no hay imágenes ni nombres de terceros (ver [`rules/001-sin-assets-oficiales.md`](rules/001-sin-assets-oficiales.md)). **La música de fondo está generada con IA** (ver [Créditos](#créditos-y-licencias)).

## Cómo jugar
Abre `index.html` en el navegador o sírvelo con cualquier servidor estático (para oír la música hace falta servirlo, no abrirlo como `file://`).

| Acción | Control |
|---|---|
| Moverse | WASD / flechas / arrastrar el dedo |
| Atacar | Automático |
| Movimiento principal (+25% daño) | 1–4 · Q/E |
| Cambiar opciones al subir de nivel | R |
| Pausa | Esc |

## Qué incluye
| Sistema | Resumen | Dónde se ajusta |
|---|---|---|
| Compañeros | 6 criaturas (3 gratis, 3 por Gacha, versión shiny +10% de daño) | `SPECIES` |
| Movimientos | 15: 9 de ataque y 6 de control; al nivel 5 evolucionan; **Vínculo** une dos en un hueco | `MOVES`, `fire()` |
| Objetos | Uno por partida (niveles 5, 15, 25…) | `ITEMS` |
| Pasivas | 12 en 4 ramas (Agilidad, Fortaleza, Poder, Ingenio), hasta nivel 5 y 4 por partida; las ramas opuestas se excluyen (Agilidad ⟂ Fortaleza, Poder ⟂ Ingenio) | `BRANCHES`, `PASSIVES` |
| Mapas | 6 (uno por tipo), cambian cada 75 s; las criaturas del tipo del mapa, hostiles o tu compañero, ganan ×1.2 en su especialidad | `MAPS`, `MAP_BUFF`, `MAP_EVERY`, `TYPE_BUFF` |
| Ventajas por tipo | Dos triángulos (Fuego > Planta > Agua > Fuego y Eléctrico > Dragón > Sombra > Eléctrico): ×1.3 a favor y ×0.75 en contra, en ambos sentidos | `STRONG`, `EFF_UP`, `EFF_DOWN` |
| Control | Un movimiento por tipo con estado propio: ralentizar (agua), inmovilizar (planta), paralizar (eléctrico), quemar (fuego), reducir el alcance del enemigo (sombra) y tornado que junta (dragón); los legendarios resisten | `MOVES`, `status()` |
| Obstáculos | Montañas y árboles (sólidos, indestructibles), piedras (sólidas, se rompen), hierba alta (reduce la visión, se rompe) y líquidos (dañan o ralentizan salvo al tipo del mapa); cambian de aspecto y efecto con cada mapa | `BIOME`, `getChunk()` |
| Hostiles | 6 tipos que aparecen por tiempo + un legendario tipado cada 4 minutos | `ENEMY_TYPES`, `LEG` |
| Música | Una pista chillout por tipo de mapa con fundido cruzado de 3 s y botón «Música» | `music/`, `playMusic()` |
| Criaturario | Enciclopedia de 18 criaturas y 6 mapas que se desbloquean al descubrirlos | `DEX`, `DESC` |
| Progreso | Monedas → mejoras permanentes y Gacha; todo se guarda en `localStorage` | `UPGRADES`, `SAVE` |

## Estructura del repositorio
```
index.html                 el juego completo (secciones comentadas, ver abajo)
music/                     6 pistas <tipo>.mp3 (fuera de Git; se regeneran con la IA local)
scripts/smoke.js           prueba en Node con DOM y audio falsos (12 min simulados + aserciones exactas)
scripts/audit-secrets.sh   auditoría de secretos antes de cada commit
scripts/sync-dashboard.sh  copia index.html y music/ a la demo servida por el homelab (simula; --apply)
scripts/generar_musica.sh  genera las 6 pistas con ACE-Step en el ComfyUI del PC (simula; --apply)
rules/                     reglas del proyecto (una por fichero)
CLAUDE.md / AGENTS.md      instrucciones para asistentes de código (AGENTS.md apunta a CLAUDE.md)
memory.md                  registro de tareas, la más reciente primero
CHANGELOG.md               historial por versión
```

### Secciones de `index.html`
1 datos · 2 guardado · 3 sprites procedurales · 4 audio (osciladores) · 4b música · 5 estado de la run · 6 lógica (incluye «Mundo», `update`, `fire`, subida de nivel, fin de run) · 7 dibujo · 8 menús · 9 bucle principal.

- **Equilibrar:** editar las tablas de la sección 1 y `xpNeed`.
- **Añadir un movimiento:** entrada en `MOVES` + `case` en `fire0()`.
- **Añadir una pasiva:** entrada en `PASSIVES` y su efecto en `mult()` o donde se use `pl('id')`.
- **Añadir un tipo de obstáculo:** clase en `getChunk()`, aspecto en `BIOME` y una función `draw…`.

## Probar
```
node scripts/smoke.js          # debe acabar en "SMOKE OK" (comprueba también que VERSION coincide con CHANGELOG.md y README.md)
bash scripts/audit-secrets.sh  # antes de cada commit; debe salir "limpio"
```

## Música (IA local)
Las pistas las genera ACE-Step v1 3.5B en el ComfyUI del PC, lanzado desde la torre:
```
export COMFY_HOST=<IP Tailscale o nombre del PC>   # no se guarda en el repo
bash scripts/generar_musica.sh                     # simula y muestra los prompts
bash scripts/generar_musica.sh --apply             # genera las 6 (~3 min); también: --apply fuego dragon
```
Necesita ComfyUI arrancado en el PC (`creacion-local`). Cada pista se anota en el catálogo de `musica-ia-lofi` (regla 001 de ese repo). Todas comparten tonalidad (La menor) y tempos de 65–85 bpm para que el fundido entre mapas no choque. Si falta un fichero, ese mapa va sin música.

## Publicación (homelab)
Hay dos copias servidas por contenedores nginx de solo lectura en `dashboard-stack`: una demo tras el panel de acceso y una versión pública sin login. Ambas se actualizan con `scripts/sync-dashboard.sh --apply` (copia `index.html` y `music/`). El servidor debe permitir audio: el CSP lleva `media-src 'self'`. Detalles de despliegue en el repo `dashboard-stack`.

## Versionado
`0.x.0` por cada mejora (la 0.1.0 es la primera versión) y `0.x.y` para correcciones. Al subir de versión se cambian a la vez `VERSION` y `VERSION_DATE` en `index.html` y el primer encabezado de `CHANGELOG.md`; `smoke.js` falla si no coinciden (regla 003).

## Créditos y licencias
- Código, criaturas, sprites y datos: propios. No hay assets de Nintendo, Game Freak ni SpriteCollab; el juego que inspiró el género tiene sprites CC BY-NC y código PolyForm Noncommercial, de los que no se copió nada.
- **Música: generada con IA** con [ACE-Step v1 3.5B](https://github.com/ace-step/ACE-Step) (licencia Apache-2.0 verificada el 2026-10-21 en el repo oficial y en la ficha de los pesos), ejecutado en local. Se declara su origen artificial en la Guía del juego, como pide la ficha del modelo.

## Reglas del proyecto
Ver [`rules/README.md`](rules/README.md): 001 sin assets oficiales · 002 música de IA declarada y anotada · 003 versión coherente con el CHANGELOG.

## Estado y pendientes
Jugable y en mejora continua (v0.6.0). Pendiente: probar a mano en un navegador real (rendimiento con muchos objetos, atascos entre obstáculos), afinar el equilibrio (la subida de nivel es muy rápida), subir el repo a GitHub (privado) y añadir un monitor de disponibilidad en el homelab. Ver `memory.md`.
