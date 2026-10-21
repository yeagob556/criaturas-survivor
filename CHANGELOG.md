# CHANGELOG

## 2026-10-21 (mejora 3)
- **Ventajas y debilidades por tipo:** dos triángulos (Fuego > Planta > Agua > Fuego; Eléctrico > Dragón > Sombra > Eléctrico). ×1.3 a favor y ×0.75 en contra (`EFF_UP`, `EFF_DOWN`, `STRONG`), tanto en tus ataques como en los de los hostiles. Números de daño con ↑/↓ y aviso «¡Débil!» / «Resiste» sobre el jugador.
- **6 movimientos de control, uno por tipo,** con un estado propio sobre los hostiles: Marea (agua, ralentiza), Raíces (planta, inmoviliza), Estática (eléctrico, paraliza), Brasas (fuego, quema), Niebla (sombra, alcance reducido: contacto, disparos y balas) y Ciclón (dragón, tornado que arrastra y junta). Los legendarios resisten: sin inmovilizar ni paralizar, ralentización más débil y duraciones a la mitad.
- Estados visibles como puntitos de color bajo el hostil; las tarjetas y el Criaturario muestran «Fuerte vs / Débil vs».
- `scripts/smoke.js` comprueba el triángulo, los multiplicadores exactos, cada estado, la inmunidad de jefes, el alcance reducido y que el tornado junta y caduca.

## 2026-10-21 (mejora 2)
- **Pasivas con ramas excluyentes:** 12 pasivas en 4 ramas (Agilidad, Fortaleza, Poder, Ingenio), hasta nivel 5 y 4 como máximo por partida. Las ramas se excluyen por parejas (Agilidad ⟂ Fortaleza, Poder ⟂ Ingenio): al coger la primera pasiva de una rama, la opuesta no vuelve a salir; y una misma oferta nunca mezcla ramas opuestas. Tablas `BRANCHES` y `PASSIVES`.
- **Movimientos nuevos:** Esporas (planta, área sobre un grupo), Zarpazo (sombra, abanico delante) y Cometa (fuego, bola lenta y grande); con evolución al nivel 5.
- Las mejoras genéricas Zapatillas/Entrenamiento/Atracción se sustituyen por pasivas (Pies Ligeros, Garra Afilada, Olfato) para que respeten las ramas.
- `scripts/smoke.js` comprueba exclusión de ramas, tope de huecos y niveles, efectos numéricos y que los 9 movimientos se disparan.

## 2026-10-21 (mejora 1)
- **Mapas rotativos con buff por tipo:** 6 mapas, cambio cada 75 s con aviso, destello y contador en el HUD; ×1.2 en la especialidad de cada tipo (`TYPE_BUFF`) para hostiles y compañero. Vida máxima y tamaño se aplican al cambiar de mapa y se revierten.
- **Hostiles tipados:** 6 hostiles (uno por tipo) y legendarios de tipo (6, uno por tipo).
- **Criaturario:** enciclopedia de 18 criaturas y 6 mapas con desbloqueo por descubrimiento, persistente en `localStorage` y compatible con partidas anteriores.
- `scripts/smoke.js` comprueba los buffs con valores exactos y el desbloqueo del Criaturario.

## 2026-10-21
- Primera versión: un solo `index.html` con menú, 6 compañeros procedurales (3 gratis, 3 por Gacha, versión shiny), 6 movimientos con evolución al nivel 5, Vínculo, objetos, 4 tipos de enemigo y jefe legendario cada 4 minutos, mejoras permanentes, estadísticas, sonido por osciladores y control táctil.
- Prueba de humo en Node (`scripts/smoke.js`): 12 minutos simulados sin errores. Sin probar aún visualmente en navegador.
- Repo preparado para GitHub privado (sin commit todavía).
