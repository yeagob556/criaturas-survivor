# CHANGELOG

Versionado: `0.x.0` por cada mejora (la 0.1.0 es la primera versión); `0.x.y` para correcciones. La versión que muestra el juego (`VERSION` en `index.html`) debe coincidir con el primer encabezado de este fichero.

## v0.10.2 — 2026-10-21 · Arreglo: el Titán congelaba la pantalla
- **Causa:** unos 10 s después de despertar, al Titán le tocaba su primer **descanso**. Ese paso llevaba como tipo el del propio Titán (`primordio`), que no existe en `TYPES`, y `startBossStep` lanzaba un `TypeError` al leer su color. Como el error saltaba dentro del bucle principal, el juego dejaba de pedir fotogramas y la pantalla se quedaba congelada (afectaba a la v0.10.0 y a la v0.10.1, también publicadas).
- **Arreglo:** el descanso ya no lleva tipo y conserva el del último ataque (siempre un tipo real); `startBossStep` ignora tipos inexistentes.
- **Bucle a prueba de errores:** `frame` ejecuta `update`, `draw` y la música en `seguro(...)`: un error se anota en la consola una sola vez y el bucle **sigue**, en vez de dejar la pantalla congelada.
- `scripts/smoke.js`: el Titán actúa solo durante 200 s alternando cerca y lejos, con dibujo, y debe usar sus 10 tipos de paso sin errores; el bucle sigue pidiendo fotogramas aunque `update` lance un error y no repite el aviso. Las pruebas anteriores dejaban al Titán en pausa (`bs.t = -999`) y no lo veían actuar.

## v0.10.1 — 2026-10-21 · El Titán: 10× de vida, regeneración y adaptación a tu daño
- **Vida ×10:** el Titán tiene 10 veces la vida de un legendario normal de ese mismo momento (`10 × bossHp(t, n)`; +50% por cada Titán anterior). Con la fórmula actual, a los 20 min con 5 legendarios ya aparecidos son 87.000 (antes 42.000).
- **Regeneración muy pequeña:** 0,1% de su vida máxima por segundo (`MEGA.regen`).
- **Se adapta a ti** (`megaAdapt`): mide el daño bruto que le haces con una media móvil de 8 s y lo compara con lo necesario para matarlo en 150 s. **Poco daño** (<50%) → se impacienta poco a poco, hasta 90 s para el máximo: velocidad +40%, daño +25% y cadencia de ataque +30% (más rápido en preparar y encadenar ataques; también la embestida). **Muchísimo daño** (>150%) → gana armadura progresiva hasta el 50% (`ad.armor`, reduce el daño que recibe; el daño que mide es el bruto, así que la armadura no engaña al sistema). Con daño normal no cambia, y la impaciencia baja sola (en 60 s) cuando le haces daño. Los primeros 20 s no se adapta.
- **Versión de prueba permanente en el homelab:** `scripts/sync-dashboard.sh --test --apply` copia el juego al contenedor `criaturas-test` (sin caché, accesible desde el panel de Homepage por LAN, Tailscale y el dominio), para revisar antes de sincronizar la demo y la pública. Sustituye a los servidores temporales.
- El HUD del Titán muestra `Impaciente: daño +x% · vel +y% · ataque +z%` y `Armadura NN%` sobre su barra.
- `scripts/smoke.js`: vida exacta ×10 y +50%, regeneración y tope, gracia inicial, impaciencia y su límite, calma con buen daño, armadura con mucho daño (y tope), daño bruto registrado, cadencia más rápida, acumulación con la furia.

## v0.10.0 — 2026-10-21 · Megajefe: Primordio, el Titán
- **Aparición:** a los 20 min (y luego cada 20, un 50% más fuerte cada vez; `MEGA`). Aviso a los 10 s («Algo enorme se acerca…»). Lento (28 px/s) y enorme (radio 58), 30000 de vida base + 10 por segundo de partida. Mientras vive no salen legendarios normales; al caer, el siguiente tarda al menos 60 s (evita una avalancha de legendarios atrasados).
- **Todos los ataques de los 6 tipos:** su repertorio se construye a partir de los guiones de los legendarios (`MEGA_MOVES`), así que usa Ascuas, Brasas, Cometa, Pistola Agua, Marea, Hidrobomba, Látigo Cepa, Raíces, Esporas, Impactrueno, Estática, Rayo, Tinieblas, Zarpazo, Niebla, Dracoaliento, Ciclón y Dracoaliento Máx, más la **Lluvia de meteoros** nueva. Cambia de color según el tipo del ataque que prepara y cada ataque deja el estado de su tipo.
- **Elige por tu distancia, en orden fijo:** cerca (<200 px) ondas y anillos; a media distancia (200-420) abanicos, zonas y ráfagas; lejos (>420) embestidas (cierran la distancia), tornados (dos a la vez) y meteoros. Cada banda rota por su lista y **descansa 1,6 s cada 3 ataques**. Sobre su cabeza se lee `Cerca → Marea`, que se actualiza según te muevas (`megaPick`).
- **Invoca legendarios:** al empezar y al bajar del 75%, 50% y 25% de vida (2 cada vez), o si lleva 45 s sin ninguno; máximo 2 vivos, rotando por los 6 tipos, con un portal de aviso en el suelo (`spawnBoss` con `minion`).
- Se enfurece al 30% (+20% de daño) como los demás jefes; inmune a inmovilizar/paralizar y a los empujones; no se descarta aunque te alejes; barra de vida propia abajo; sin ventajas ni debilidades de tipo (tipo `primordio`).
- **Botín al caer:** 30 monedas, 8 gemas grandes, caen sus legendarios invocados y cuenta en Estadísticas («Titanes derrotados»). **Criaturario:** nueva ficha (19 criaturas).
- Los meteoros de los jefes (`foe`) no dañan a los suyos. `scripts/smoke.js`: repertorio completo y por bandas, límites de distancia, orden fijo y descanso, «mirar» sin efectos, invocaciones (umbrales, máximo 2, rotación de tipos, portal), meteoros, tornados dobles, embestida lejana, estados por tipo, rótulos por distancia, inmunidades, furia ×1,2, derrota, reaparición más fuerte y dibujo. `scripts/capturas.py`: 6 escenas del Titán.

## v0.9.0 — 2026-10-21 · Eventos aleatorios, cofres, aparición progresiva y líquidos contrarios
- **Aparición progresiva:** los hostiles pasan de 1,4/s al empezar a 0,5/s y suben con el tiempo (`spawnRate(t) = 0.5 + t/80 + 2(t/300)²`; tope simultáneo `spawnCap` 40 → 320). En los primeros 30 s hay ~20 en vez de ~60.
- **Eventos aleatorios** (el primero a los 50-75 s, luego uno cada 45-75 s, nunca el mismo dos veces seguidas, con chip en el HUD y cuenta atrás): **Marea de monstruos** (aparición ×2,5 y tope ×1,5, viñeteado rojo), **Lluvia de agua** (buffs y nerfeos por tipo, `RAIN_FX`: agua ×1.2 velocidad y resistencia, planta ×1.1 velocidad, eléctrico ×1.2 daño, fuego ×0.75 daño y ×0.85 cadencia; lluvia y tinte azul) y **Lluvia de fuego** (meteoritos cada 0,8-1,5 s, casi la mitad apuntan a ti: círculo en el suelo que se llena durante 1,3 s y meteorito que cae con estela; 22 de daño; los de fuego son inmunes; rompen piedras, hierba y cofres pequeños).
- **Cofres:** pequeños (25 de vida, se rompen a golpes, también con áreas y meteoritos: 50% monedas, 38% experiencia, 12% objeto a elegir) y grandes (hay que quedarse a menos de 80 px durante 6 s con un aro de progreso; si te alejas retrocede a media velocidad; dan 6 monedas, 3 gemas, +25% de vida y siempre un objeto a elegir entre dos). Las elecciones de cofre no consumen una subida de nivel.
- **Líquidos por tipo:** el tipo del mapa sigue inmune (ni lo frena ni lo daña); el **tipo contrario** (al que el tipo del mapa le gana) sufre el efecto ×1,5 y además hace un 20% menos de daño mientras está dentro; el resto, el efecto normal. Vale para ti y para los hostiles.
- **Corregido durante las pruebas:** un comentario mal colocado dejaba el juego pausado y con la pantalla de recompensa abierta tras elegir (sólo en esta versión, nunca publicado). `smoke.js` ahora exige que la simulación de 12 min avance de verdad y que elegir una recompensa reanude el juego y oculte la pantalla; además `eq`/`near` ya no dejan pasar comparaciones con `NaN`.
- `scripts/capturas.py`: escenas nuevas (los 3 eventos, cofres, líquido que debilita) y limpieza de elecciones pendientes entre escenas.
- `scripts/smoke.js`: aparición progresiva, calendario y exclusividad de eventos, buffs de lluvia, marea ×2,5, meteoritos (aviso, daño, inmunidad de fuego, rotura de objetos), reparto de botín de cofres pequeños, progreso y apertura de cofres grandes, ofertas de cofre, y líquidos contrarios/neutros/propios.

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
