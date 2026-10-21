# CHANGELOG

Versionado: `0.x.0` por cada mejora (la 0.1.0 es la primera versión); `0.x.y` para correcciones. La versión que muestra el juego (`VERSION` en `index.html`) debe coincidir con el primer encabezado de este fichero.

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
