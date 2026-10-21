"""Capturas de pantalla del juego con Chromium sin pantalla (Playwright). Lo lanza scripts/capturas.sh dentro de Docker:
sirve una copia de index.html en 127.0.0.1 y guarda PNG en /out. Sirve para comprobar lo VISUAL (maquetación, avisos, mapas),
que las pruebas de Node no pueden ver. Escenas: menú, paneles, Gacha (x1 y x10), móvil, los 6 mapas, embestida, un aviso por jefe,
furia, hierba/líquido y subida de nivel. Imprime los errores de JavaScript que haya y los FPS aproximados (sin GPU)."""
import json
from playwright.sync_api import sync_playwright
BASE = 'http://127.0.0.1:8118/'; OUT = '/out/'
logs = []
def nuevo(b, w, h, mobile=False):
    ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
    pg = ctx.new_page()
    pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)))
    return ctx, pg
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'])
    ctx, pg = nuevo(b, 1100, 620)
    pg.goto(BASE); pg.wait_for_timeout(800)
    pg.evaluate("SAVE.coins = 5000; for (const s of SPECIES) SAVE.owned[s.id] = SAVE.owned[s.id] || {shiny: s.id === 'dracolin'}; ensureDex(SAVE); persist(); refreshMenu()")
    pg.screenshot(path=OUT + '01-menu.png')
    for nombre, boton in [('companeros', '#bComp'), ('mejoras', '#bUp'), ('criaturario', '#bDex'), ('guia', '#bGuide'), ('stats', '#bStats')]:
        pg.click(boton); pg.wait_for_timeout(400); pg.screenshot(path=OUT + f'02-{nombre}.png'); pg.click('#pBack'); pg.wait_for_timeout(150)
    pg.click('#bDex'); pg.wait_for_timeout(300); pg.click('button[data-t="m"]'); pg.wait_for_timeout(300); pg.screenshot(path=OUT + '02-criaturario-mapas.png'); pg.click('#pBack')
    pg.evaluate("SAVE.coins = 5000; persist(); refreshMenu()")
    pg.click('#bGacha'); pg.wait_for_timeout(400); pg.screenshot(path=OUT + '03-gacha-antes.png')
    pg.click('#g1'); pg.wait_for_timeout(500); pg.screenshot(path=OUT + '03-gacha-girando.png')
    pg.wait_for_timeout(2600); pg.screenshot(path=OUT + '03-gacha-resultado.png')
    pg.click('#g10'); pg.wait_for_timeout(2500); pg.screenshot(path=OUT + '03-gacha-x10-girando.png')
    pg.click('#gSkip'); pg.wait_for_timeout(400); pg.screenshot(path=OUT + '03-gacha-x10-fin.png')
    pg.click('#pBack'); pg.wait_for_timeout(200)
    pg.click('#bPlay'); pg.wait_for_timeout(2500)
    pg.evaluate("playerHit = () => {}")
    pg.screenshot(path=OUT + '10-partida.png')
    pg.evaluate("G.pending.push(G.lvl + 1)"); pg.wait_for_timeout(500); pg.screenshot(path=OUT + '11-subida-nivel.png'); pg.click('.card'); pg.wait_for_timeout(200)
    for i in range(6):
        pg.evaluate(f"G.enemies = []; G.px = 900 + {i}*700; G.py = 500 + {i}*300; G.cam.x = G.px; G.cam.y = G.py; setMap(MAPS[{i}])")
        pg.wait_for_timeout(900); pg.screenshot(path=OUT + f'20-mapa-{i}.png')
    pg.evaluate("G.enemies = []; setMap(MAPS[0]); G.px = 0; G.py = 0; G.cam.x = 0; G.cam.y = 0;"
                "const et = ENEMY_TYPES.find(x => x.id === 'magmaroca'); G.enemies.push({...et, x: 200, y: 0, hp: 1e6, maxhp: 1e6, kx: 0, ky: 0, flash: 0, orbT: 0, shootT: 2, ph: 0, hpBuf: 1, rBuf: 1, dcd: 0, ds: null, disc: true})")
    pg.wait_for_function("G.enemies.some(e => e.ds && e.ds.ph === 'wind')", timeout=5000); pg.wait_for_timeout(450)
    pg.screenshot(path=OUT + '30-embestida-aviso.png')
    pasos = {'fuego': 0, 'agua': 2, 'planta': 1, 'electrico': 0, 'sombra': 2, 'dragon': 2}
    for k, (bt, paso) in enumerate(pasos.items()):
        pg.evaluate(f"G.enemies = []; setMap(MAPS.find(m => m.type === '{bt}')); G.px = 0; G.py = 0; G.cam.x = 0; G.cam.y = 0; G.tornados = [];"
                    f"const jf = spawnBoss('{bt}', 230, -30, 9000); jf.spd = 0; jf.disc = true; jf.bs.i = {paso}-1; jf.bs.t = 0; jf.bs.ph = 'rec'")
        pg.wait_for_function("G.enemies.some(e => e.boss && e.bs.ph === 'wind')", timeout=8000); pg.wait_for_timeout(420)
        pg.screenshot(path=OUT + f'40-jefe-{bt}.png')
    pg.evaluate("G.enemies = []; setMap(MAPS[0]); const jf = spawnBoss('fuego', 230, -30, 9000); jf.spd = 0; jf.disc = true; jf.hp = 2000")
    pg.wait_for_timeout(1200); pg.screenshot(path=OUT + '41-jefe-furia.png')
    # hierba (sin atacar: tus disparos la romperían al instante) y líquido
    pg.evaluate("G.enemies = []; G.moves = []; G.px = 1500; G.py = 1100; G.cam.x = G.px; G.cam.y = G.py; setMap(MAPS[2]);"
                "getChunk(Math.floor(G.px/CH), Math.floor(G.py/CH)).push({k:'hierba', x: G.px, y: G.py, r: 70, v: .3, solid: false, id: 'cap1', hp: OBS_HP.hierba, flash: 0, orbT: 0, dead: false});"
                "getChunk(Math.floor(G.px/CH), Math.floor(G.py/CH)).push({k:'liquido', x: G.px + 160, y: G.py + 10, r: 90, v: .5, solid: false, id: 'cap2', hp: 0, flash: 0, orbT: 0, dead: false})")
    pg.wait_for_timeout(1500); pg.screenshot(path=OUT + '50-hierba-vision.png')
    fps = pg.evaluate("""() => new Promise(res => { G.enemies = []; for (let i = 0; i < 200; i++) { const et = ENEMY_TYPES[i % 6]; G.enemies.push({...et, x: G.px + (Math.random()-.5)*900, y: G.py + (Math.random()-.5)*600, hp: 1e6, maxhp: 1e6, kx: 0, ky: 0, flash: 0, orbT: 0, shootT: 9, ph: 0, hpBuf: 1, rBuf: 1, dcd: 9, ds: null, disc: true}); }
        let n = 0, t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(n / 3); }; requestAnimationFrame(f); })""")
    print('FPS_APROX (200 hostiles, sin GPU):', round(fps, 1))
    ctx.close()
    ctx, pg = nuevo(b, 390, 844, mobile=True)
    pg.goto(BASE); pg.wait_for_timeout(800)
    pg.evaluate("SAVE.coins = 5000; persist(); refreshMenu()")
    pg.screenshot(path=OUT + '60-movil-menu.png')
    pg.click('#bGacha'); pg.wait_for_timeout(300); pg.screenshot(path=OUT + '60-movil-gacha-antes.png')
    pg.click('#g1'); pg.wait_for_timeout(3200); pg.screenshot(path=OUT + '60-movil-gacha-resultado.png')
    ctx.close(); b.close()
print('ERRORES_JS:', json.dumps(logs[:20], ensure_ascii=False) if logs else 'ninguno')
