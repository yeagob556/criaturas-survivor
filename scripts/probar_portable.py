"""Prueba la versión PORTABLE como la usaría alguien con doble clic: abre index.html por file:// en Chromium real y comprueba que el juego carga,
que se juega, que suena la música (si el paquete la lleva), que la partida se puede exportar y volver a importar y que no hay errores de JavaScript.
Lo lanza scripts/probar-portable.sh dentro de Docker (la carpeta del paquete va montada en /juego, las imágenes salen en /out)."""
import json, os, sys
from playwright.sync_api import sync_playwright
MUSICA = os.path.isdir('/juego/music'); OUT = '/out/'; fallos = []; errores = []
def chk(cond, msg):
    print(('  OK     ' if cond else '  FALLO  ') + msg)
    if not cond: fallos.append(msg)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 1100, 'height': 620}, accept_downloads=True); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errores.append(str(e))); pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' else None)
    pg.on('dialog', lambda d: d.accept())
    pg.goto('file:///juego/index.html'); pg.wait_for_timeout(1200)
    chk(pg.evaluate("location.protocol") == 'file:', 'se abre como fichero (file://)')
    chk(pg.evaluate("typeof VERSION === 'string' && typeof drawMenuBg === 'function'"), 'el juego carga: versión ' + str(pg.evaluate("VERSION")))
    chk(pg.evaluate("MUSIC_DIRECT === true"), 'modo directo de música activo (WebAudio no sirve con file://)')
    chk(pg.evaluate("menuBg && menuBg.frames > 5"), 'el fondo animado del menú se dibuja')
    pg.screenshot(path=OUT + 'portable-menu.png')
    pg.click('#bPlay'); pg.wait_for_timeout(5000)
    chk(pg.evaluate("G && !G.over && G.t > 2"), 'la partida avanza')
    est = pg.evaluate("(() => { const t = music.tracks[music.cur]; return t ? {cur: music.cur, paused: t.a.paused, ct: t.a.currentTime, vol: t.a.volume} : null })()")
    if MUSICA: chk(est is not None and not est['paused'] and est['ct'] > 0.5 and est['vol'] > 0.05, 'suena la música desde file://: ' + json.dumps(est))
    else: chk(est is None, 'versión ligera: sin música y sin errores por ello')
    pg.screenshot(path=OUT + 'portable-partida.png')
    # exportar / importar
    pg.evaluate("SAVE.coins = 4321; SAVE.stats.kills = 99; persist()"); pg.reload(); pg.wait_for_timeout(800)
    pg.click('#bStats'); pg.wait_for_timeout(300)
    with pg.expect_download() as d: pg.click('#bExport')
    ruta = d.value.path(); datos = json.load(open(ruta))
    chk(datos.get('juego') == 'criaturas-survivor' and datos['guardado']['coins'] == 4321, 'exportar descarga un .json con la partida (' + d.value.suggested_filename + ')')
    pg.evaluate("SAVE.coins = 5; persist()")
    with pg.expect_file_chooser() as fc: pg.click('#bImport')
    fc.value.set_files(ruta); pg.wait_for_timeout(800)
    chk(pg.evaluate("SAVE.coins") == 4321 and pg.evaluate("SAVE.stats.kills") == 99, 'importar restaura la partida exportada')
    malo = OUT + 'malo.json'; open(malo, 'w').write('{"esto":"no es una partida"}')
    with pg.expect_file_chooser() as fc: pg.click('#bImport')
    fc.value.set_files(malo); pg.wait_for_timeout(500)
    chk(pg.evaluate("SAVE.coins") == 4321, 'un fichero que no es una partida no cambia nada')
    chk('no es una partida' in pg.evaluate("document.querySelector('#sMsg').textContent").lower() or 'partida' in pg.evaluate("document.querySelector('#sMsg').textContent").lower(), 'y se avisa del error en pantalla')
    os.remove(malo)
    ignorables = [e for e in errores if 'Failed to load resource' in e and not MUSICA]       # la versión ligera pide pistas que no lleva
    chk(len(errores) == len(ignorables), 'sin errores de JavaScript' + ('' if not errores else ': ' + '; '.join(errores)[:300]))
    b.close()
print('\nRESULTADO:', 'TODO CORRECTO' if not fallos else str(len(fallos)) + ' fallo(s)'); sys.exit(1 if fallos else 0)
