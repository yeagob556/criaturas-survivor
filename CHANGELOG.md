# CHANGELOG

Versionado: `0.x.0` por cada mejora (la 0.1.0 es la primera versión); `0.x.y` para correcciones. La versión que muestra el juego (`VERSION` en `index.html`) debe coincidir con el primer encabezado de este fichero.

## v0.8.4 — 2026-10-21 · La hierba aguanta más
- La hierba alta pasa de 10 a 22,5 de vida (la mitad que una piedra, `OBS_HP.hierba = OBS_HP.piedra/2`): un disparo suelto ya no la rompe al instante y la visión reducida se nota más tiempo si atacas desde dentro. Con Ascuas nivel 1 hacen falta dos disparos (~1,3 s).
- `scripts/smoke.js`: comprueba que la hierba tiene la mitad de vida que una piedra y que sobrevive al primer disparo de Ascuas pero cae con el segundo.

## v0.8.3 — 2026-10-21 · Arreglo de los lienzos (tragamonedas, Compañeros, Criaturario) y herramienta de capturas
- **Causa raíz del «estirado»:** una regla CSS global `canvas{position:fixed;inset:0;width:100%;height:100%}` pensada para el lienzo del juego se aplicaba a **todos** los `canvas`. La tragamonedas salía a pantalla completa, tapaba el panel y se veía antes de tirar; y los sprites de **Compañeros** y **Criaturario** se amontonaban en la esquina superior izquierda en vez de estar en sus fichas (error presente desde las primeras versiones; sólo se probaba en Node). Ahora la regla es `#cv{...}` y el resto de lienzos son normales.
- **Nuevo `scripts/capturas.sh` + `scripts/capturas.py`:** capturas de pantalla con Chromium sin pantalla (Playwright, imagen oficial de Docker, contenedor desechable que sirve una copia del juego sin abrir puertos). 32 imágenes en ~40 s: menú, paneles, Gacha (x1/x10), móvil, los 6 mapas, embestida, un aviso por jefe, furia, hierba/líquido y subida de nivel; informa de errores de JavaScript y FPS aproximados.
- Texto del mapa en el HUD aclarado (`lighten`) para que se lea en los mapas azules y oscuros; etiquetas de los jefes más arriba para no tapar su barra de vida.
- `scripts/smoke.js` comprueba que ninguna regla global de `canvas` sea `position:fixed` y que `#cv` sí lo sea.

## v0.8.2 — 2026-10-21 · Tragamonedas más baja, más ancha y sólo al tirar
- **Más baja y más ancha:** el lienzo pasa de 280×150 a 320×108 (casi 3:1), con ventanas de rodillo apaisadas (80×40), casillas de 36 px y símbolos a escala 0,58.
- **Sólo aparece al tirar:** el panel del Gacha se abre solo con las monedas y los botones; la máquina se despliega con una animación (`.slotwrap`, `max-height`) al pulsar «Tirar ×1» o «×10», debajo de los botones para que éstos no se muevan, y se queda hasta cerrar el panel. Antes ocupaba sitio desde el principio.
- `scripts/smoke.js`: proporción ≥ 2,5 y alto ≤ 120, y que la máquina empieza oculta (`slotShown`) y se muestra al tirar.

## v0.8.1 — 2026-10-21 · Tragamonedas más compacta y arriba
- La máquina del Gacha pasa de 320×230 a 280×150 (apaisada: más ancha que alta, `SLOT_W`/`SLOT_H`), con casillas de 48 px y símbolos a escala 0,74.
- El panel del Gacha se pega al borde superior (`openPanel(..., arriba)`) en vez de centrarse en vertical, así la máquina ya no baja cuando crece la lista de resultados; la lista tiene altura máxima con desplazamiento. Se funden en una sola línea las monedas y la explicación de los rodillos.
- `scripts/smoke.js` comprueba que el lienzo sea apaisado (ancho/alto ≥ 1,7) y que sólo el Gacha alinea arriba.

## v0.8.0 — 2026-10-21 · Mejora 7: habilidades de los monstruos y jefes con guion
- **Violetas (Sombra) con la mitad de alcance:** contacto, disparos y vida de las balas ×0.5 (`REACH`, `reachOf()`); se multiplica con el efecto de Niebla (×0.45).
- **Los disparos ya no atraviesan montañas ni árboles,** ni los tuyos ni los de los hostiles. Las piedras no los frenan (siguen rompiéndose).
- **Embestidas con aviso en el suelo:** Chispamurci, Magmaroca y Dracoaleta embisten. El recorrido se marca en el suelo (rectángulo con chevrons que se va llenando) y queda fijado al empezar el aviso, así que se esquiva; tiembla mientras avisa, pega una sola vez con su multiplicador y se queda 0,6 s parado. Paralizarlo o inmovilizarlo la cancela (`enemyDash`).
- **Jefes con guion fijo de 5 pasos** por tipo, con los movimientos genéricos de su categoría y siempre en el mismo orden (`BOSS_SCRIPT`): abanico, ráfaga, anillo, onda, zona marcada, embestida y tornado, con su aviso en el suelo (`BOSS_ATK`). Sobre el jefe se ve el ataque actual y el siguiente. Las ondas y zonas dejan en ti el estado de su tipo (quemadura, ralentizado, atrapado, oscuridad; HUD con chips) y el tornado del dragón te arrastra (se puede escapar).
- **Furia al 30% de vida:** +20% de daño en todo (contacto, proyectiles, ondas, zonas y embestidas), con aviso, aro rojo y etiqueta «¡ENFURECIDO!».
- Criaturario y Guía actualizados. `scripts/smoke.js`: alcance de los violetas, bloqueo por tipo de obstáculo, embestida (trayectoria fijada, esquivable, un solo golpe, cancelada por paralizar), estados del jugador, guion de los 6 jefes en orden con aviso, esquiva de zonas y ondas, tornado, y furia ×1.2 una sola vez.

## v0.7.0 — 2026-10-21 · Mejora 6: Gacha como tragamonedas retro
- **Máquina tragamonedas** en el Gacha, dibujada por código (marquesina con bombillas, tres rodillos con ventana, línea de pago, palanca, pantallita de monedas) y sonidos de «tic» por osciladores. Los rodillos paran uno a uno.
- **Sólo visual:** la tirada se decide y se guarda antes de animar, con las mismas probabilidades de siempre (5% shiny al conseguir uno nuevo, 10% de shiny al repetir, +40 monedas por repetido). Rodillo 1 = criatura, rodillo 2 = su tipo, rodillo 3 = desenlace (NEW, ✨ shiny o +40). No hay premio por «tres iguales».
- ×10: diez giros rápidos seguidos con el resumen al final; botón «Saltar animación». Si se cierra el panel a mitad, lo ya tirado queda guardado.
- `gachaRoll()` devuelve un objeto `{id, type, out, msg}`. `scripts/smoke.js` comprueba las probabilidades con `Math.random` simulado, que cada rodillo termina exactamente en su casilla y en orden, el salto de animación, el cobro único y la cola del ×10.

## v0.6.0 — 2026-10-21 · Mejora 5: música de fondo por mapa
- **Música de fondo por mapa:** una pista chillout por tipo (`music/<tipo>.mp3`, opcional: sin fichero, ese mapa va sin música). Fundido cruzado de 3 s al cambiar de mapa, cada pista recuerda por dónde iba, entrada/salida suaves de 2 s en el punto de bucle, volumen bajado al pausar, botón «Música» en el menú y en pausa (guardado). `<audio>` + WebAudio (el volumen de `<audio>` no se controla en iOS); el CSP del servidor sólo necesita `media-src 'self'`.
- `scripts/generar_musica.sh`: genera las 6 pistas con ACE-Step en el ComfyUI del PC (vía `creacion-local`), misma tonalidad y tempos parecidos; las anota en el catálogo de `musica-ia-lofi` (regla 001). Las pistas no se suben a Git (`.gitignore`); `scripts/sync-dashboard.sh` las copia a la demo.
- Licencia de ACE-Step verificada el 21/10: Apache-2.0 en el repo oficial y en la ficha de los pesos; condición ética de declarar el uso de IA (la Guía lo indica).
- `scripts/smoke.js` simula el audio y comprueba fundidos, reutilización de pistas, pausa de la anterior, bucle suave, pista ausente, pausa y apagado.

## v0.5.0 — 2026-10-21 · Mejora 4: obstáculos que cambian con el mapa
- **Obstáculos por mapa:** mundo infinito generado por trozos de 480 px con semilla por partida (`getChunk`, determinista). Cinco clases: montaña (sólida, indestructible), árbol (sólido, indestructible), piedra (sólida, se rompe, 30% de soltar moneda), hierba alta (se atraviesa, se rompe, reduce la visión dentro) y líquido (se atraviesa).
- **Cambian con el ambiente:** la clase se guarda, pero nombre, aspecto y efecto salen del tipo del mapa actual (`BIOME`): volcán/lava, iceberg/aguas profundas, colina/pantano, pico de cuarzo/charco cargado, risco/brea, cumbre/ácido. Al rotar el mapa todo cambia a la vez. Líquidos: lava 7, charco cargado 5 y ácido 6 de daño por segundo; aguas ×0.6, pantano ×0.65 y brea ×0.5 de velocidad. Las criaturas del tipo del mapa son inmunes.
- Hueco garantizado para pasar (centros a ≥75 px del borde del trozo, sólidos separados ≥28 px), zona de inicio despejada, hostiles que rodean los sólidos, los ataques (proyectiles, áreas, órbitas) rompen piedras y hierba.
- Criaturario: la ficha de cada mapa lista sus obstáculos y el efecto del líquido. HUD: aviso al pisar un líquido o estar en hierba alta.
- `scripts/smoke.js`: determinismo, zona de inicio, huecos, colisiones, rodeo, destrucción sin reaparición, visión, líquidos por mapa e inmunidad, y dibujo en los 6 mapas.

## v0.4.0 — 2026-10-21 · Mejora 3: ventajas por tipo y movimientos de control
- **Ventajas y debilidades por tipo:** dos triángulos (Fuego > Planta > Agua > Fuego; Eléctrico > Dragón > Sombra > Eléctrico). ×1.3 a favor y ×0.75 en contra (`EFF_UP`, `EFF_DOWN`, `STRONG`), tanto en tus ataques como en los de los hostiles. Números de daño con ↑/↓ y aviso «¡Débil!» / «Resiste» sobre el jugador.
- **6 movimientos de control, uno por tipo,** con un estado propio sobre los hostiles: Marea (agua, ralentiza), Raíces (planta, inmoviliza), Estática (eléctrico, paraliza), Brasas (fuego, quema), Niebla (sombra, alcance reducido: contacto, disparos y balas) y Ciclón (dragón, tornado que arrastra y junta). Los legendarios resisten: sin inmovilizar ni paralizar, ralentización más débil y duraciones a la mitad.
- Estados visibles como puntitos de color bajo el hostil; las tarjetas y el Criaturario muestran «Fuerte vs / Débil vs».
- `scripts/smoke.js` comprueba el triángulo, los multiplicadores exactos, cada estado, la inmunidad de jefes, el alcance reducido y que el tornado junta y caduca.

## v0.3.0 — 2026-10-21 · Mejora 2: pasivas con ramas excluyentes
- **Pasivas con ramas excluyentes:** 12 pasivas en 4 ramas (Agilidad, Fortaleza, Poder, Ingenio), hasta nivel 5 y 4 como máximo por partida. Las ramas se excluyen por parejas (Agilidad ⟂ Fortaleza, Poder ⟂ Ingenio): al coger la primera pasiva de una rama, la opuesta no vuelve a salir; y una misma oferta nunca mezcla ramas opuestas. Tablas `BRANCHES` y `PASSIVES`.
- **Movimientos nuevos:** Esporas (planta, área sobre un grupo), Zarpazo (sombra, abanico delante) y Cometa (fuego, bola lenta y grande); con evolución al nivel 5.
- Las mejoras genéricas Zapatillas/Entrenamiento/Atracción se sustituyen por pasivas (Pies Ligeros, Garra Afilada, Olfato) para que respeten las ramas.
- `scripts/smoke.js` comprueba exclusión de ramas, tope de huecos y niveles, efectos numéricos y que los 9 movimientos se disparan.

## v0.2.0 — 2026-10-21 · Mejora 1: mapas con buff y Criaturario
- **Mapas rotativos con buff por tipo:** 6 mapas, cambio cada 75 s con aviso, destello y contador en el HUD; ×1.2 en la especialidad de cada tipo (`TYPE_BUFF`) para hostiles y compañero. Vida máxima y tamaño se aplican al cambiar de mapa y se revierten.
- **Hostiles tipados:** 6 hostiles (uno por tipo) y legendarios de tipo (6, uno por tipo).
- **Criaturario:** enciclopedia de 18 criaturas y 6 mapas con desbloqueo por descubrimiento, persistente en `localStorage` y compatible con partidas anteriores.
- `scripts/smoke.js` comprueba los buffs con valores exactos y el desbloqueo del Criaturario.

## v0.1.0 — 2026-10-21 · Primera versión
- Primera versión: un solo `index.html` con menú, 6 compañeros procedurales (3 gratis, 3 por Gacha, versión shiny), 6 movimientos con evolución al nivel 5, Vínculo, objetos, 4 tipos de enemigo y jefe legendario cada 4 minutos, mejoras permanentes, estadísticas, sonido por osciladores y control táctil.
- Prueba de humo en Node (`scripts/smoke.js`): 12 minutos simulados sin errores. Sin probar aún visualmente en navegador.
- Repo preparado para GitHub privado (sin commit todavía).
