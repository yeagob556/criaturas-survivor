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
LIBRE = "G.chestOffers = []; G.pending = []; G.gems = []; G.xp = 0; if (G.paused && curOffer) { chooseOffer(curOffer.opts[0]); } G.paused = false; "   # cierra elecciones de objeto/nivel pendientes (si no, el juego queda en pausa)
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
        pg.evaluate(LIBRE + f"G.enemies = []; G.px = 900 + {i}*700; G.py = 500 + {i}*300; G.cam.x = G.px; G.cam.y = G.py; setMap(MAPS[{i}])")
        pg.wait_for_timeout(900); pg.screenshot(path=OUT + f'20-mapa-{i}.png')
    pg.evaluate(LIBRE + "G.enemies = []; setMap(MAPS[0]); G.px = 0; G.py = 0; G.cam.x = 0; G.cam.y = 0;"
                "const et = ENEMY_TYPES.find(x => x.id === 'magmaroca'); G.enemies.push({...et, x: 200, y: 0, hp: 1e6, maxhp: 1e6, kx: 0, ky: 0, flash: 0, orbT: 0, shootT: 2, ph: 0, hpBuf: 1, rBuf: 1, dcd: 0, ds: null, disc: true})")
    pg.wait_for_function("G.enemies.some(e => e.ds && e.ds.ph === 'wind')", timeout=5000); pg.wait_for_timeout(450)
    pg.screenshot(path=OUT + '30-embestida-aviso.png')
    pasos = {'fuego': 0, 'agua': 2, 'planta': 1, 'electrico': 0, 'sombra': 2, 'dragon': 2}
    for k, (bt, paso) in enumerate(pasos.items()):
        pg.evaluate(LIBRE + f"G.enemies = []; setMap(MAPS.find(m => m.type === '{bt}')); G.px = 0; G.py = 0; G.cam.x = 0; G.cam.y = 0; G.tornados = [];"
                    f"const jf = spawnBoss('{bt}', 230, -30, 9000); jf.spd = 0; jf.disc = true; jf.bs.i = {paso}-1; jf.bs.t = 0; jf.bs.ph = 'rec'")
        pg.wait_for_function("G.enemies.some(e => e.boss && e.bs.ph === 'wind')", timeout=8000); pg.wait_for_timeout(420)
        pg.screenshot(path=OUT + f'40-jefe-{bt}.png')
    pg.evaluate(LIBRE + "G.enemies = []; setMap(MAPS[0]); const jf = spawnBoss('fuego', 230, -30, 9000); jf.spd = 0; jf.disc = true; jf.hp = 2000")
    pg.wait_for_timeout(1200); pg.screenshot(path=OUT + '41-jefe-furia.png')
    # hierba (sin atacar: tus disparos la romperían al instante) y líquido
    pg.evaluate(LIBRE + "G.enemies = []; G.moves = []; G.px = 1500; G.py = 1100; G.cam.x = G.px; G.cam.y = G.py; setMap(MAPS[2]);"
                "getChunk(Math.floor(G.px/CH), Math.floor(G.py/CH)).push({k:'hierba', x: G.px, y: G.py, r: 70, v: .3, solid: false, id: 'cap1', hp: OBS_HP.hierba, flash: 0, orbT: 0, dead: false});"
                "getChunk(Math.floor(G.px/CH), Math.floor(G.py/CH)).push({k:'liquido', x: G.px + 160, y: G.py + 10, r: 90, v: .5, solid: false, id: 'cap2', hp: 0, flash: 0, orbT: 0, dead: false})")
    pg.wait_for_timeout(1500); pg.screenshot(path=OUT + '50-hierba-vision.png')
    # eventos aleatorios (sin atacar, y fijando la posición para ver bien el ambiente)
    base = LIBRE + "G.enemies = []; G.moves = []; G.px = 600; G.py = 400; G.cam.x = G.px; G.cam.y = G.py; G.evT = 1e9; G.ev = null; G.meteors = []; G.tornados = []; G.vis = 0; setMap(MAPS[0]);"
    pg.evaluate(base + "startEvent('marea'); const t0 = G.t; G.t = 200; for (let i = 0; i < 40; i++) spawn(0.2); G.t = t0; G.ev.t = 3")
    pg.wait_for_timeout(900); pg.screenshot(path=OUT + '51-evento-marea.png')
    pg.evaluate(base + "startEvent('lluvia')"); pg.wait_for_timeout(900); pg.screenshot(path=OUT + '52-evento-lluvia.png')
    pg.evaluate(base + "startEvent('fuego'); G.meteors.push({x: G.px + 140, y: G.py - 30, t: 0.5, hit: false}, {x: G.px - 120, y: G.py + 90, t: 0.9, hit: false}, {x: G.px + 10, y: G.py + 10, t: 0.2, hit: false}); G.ev.mt = 99")
    pg.wait_for_timeout(150); pg.screenshot(path=OUT + '53-evento-fuego.png')
    # cofres pequeño y grande (a medio abrir) y líquido que debilita al tipo contrario
    pg.evaluate(base + "G.sp = SPECIES.find(s => s.id === 'brotin'); const ch = getChunk(Math.floor(G.px/CH), Math.floor(G.py/CH));"
                "ch.push({k:'cofre', x: G.px + 90, y: G.py - 40, r: 13, v: .3, solid: false, id: 'cap-c1', hp: OBS_HP.cofre, flash: 0, orbT: 0, dead: false, prog: 0});"
                "ch.push({k:'cofre', x: G.px + 140, y: G.py + 50, r: 13, v: .3, solid: false, id: 'cap-c2', hp: OBS_HP.cofre, flash: 0, orbT: 0, dead: false, prog: 0});"
                "ch.push({k:'cofreg', x: G.px - 120, y: G.py - 20, r: 20, v: .3, solid: false, id: 'cap-cg', hp: 0, flash: 0, orbT: 0, dead: false, prog: 0});")
    pg.evaluate("G.px = 600 - 120 + 40; G.py = 400 - 20"); pg.wait_for_timeout(3200); pg.screenshot(path=OUT + '54-cofres.png')
    pg.evaluate("G.px = 600 + 110; G.py = 400 + 20; setMap(MAPS[0]); const l = getChunk(Math.floor(G.px/CH), Math.floor(G.py/CH)); l.push({k:'liquido', x: G.px, y: G.py, r: 110, v: .5, solid: false, id: 'cap-lq', hp: 0, flash: 0, orbT: 0, dead: false, prog: 0})")
    pg.wait_for_timeout(1200); pg.screenshot(path=OUT + '55-liquido-debil.png')
    # megajefe Primordio: reposo (rótulo según tu distancia), portal de invocación, meteoros, tornados dobles y furia con legendarios
    mega = base + "G.mega = null; G.nextMega = 1e9; const m = spawnMega(); m.x = G.px + 330; m.y = G.py - 70; m.spd = 0; m.disc = true; m.bs.t = -999; m.bs.summon = 0; "
    pg.evaluate(mega + "G.t = 1200"); pg.wait_for_timeout(700); pg.screenshot(path=OUT + '70-mega-reposo.png')
    pg.evaluate(mega + "startBossStep(m, ['summon', 'Invocar a Solarax', 'fuego'])"); pg.wait_for_timeout(900); pg.screenshot(path=OUT + '71-mega-invoca.png')
    pg.evaluate(mega + "m.x = G.px + 360; startBossStep(m, ['rain', 'Lluvia de meteoros', 'fuego'])"); pg.wait_for_timeout(1100); pg.screenshot(path=OUT + '72-mega-meteoros.png')
    pg.evaluate(mega + "m.x = G.px + 330; startBossStep(m, ['tornado', 'Ciclón', 'dragon'])"); pg.wait_for_timeout(700); pg.screenshot(path=OUT + '73-mega-tornados.png')
    pg.evaluate(mega + "m.x = G.px + 130; m.y = G.py - 30; startBossStep(m, ['pulse', 'Marea', 'agua'])"); pg.wait_for_timeout(700); pg.screenshot(path=OUT + '74-mega-onda-cerca.png')
    pg.evaluate(mega + "m.hp = m.maxhp*0.2; m.x = G.px + 330; for (const t of ['agua', 'planta']) { const x = spawnBoss(t, G.px - 220 + (t === 'planta' ? 160 : 0), G.py + 120, 3000); x.minion = true; x.disc = true; x.spd = 0; }")
    pg.wait_for_timeout(1200); pg.screenshot(path=OUT + '75-mega-furia-legendarios.png')
    pg.evaluate(mega + "m.ad.agg = 0.8; m.hp = m.maxhp*0.6"); pg.wait_for_timeout(500); pg.screenshot(path=OUT + '76-mega-impaciente.png')
    pg.evaluate(mega + "m.ad.armor = 0.35; m.hp = m.maxhp*0.6"); pg.wait_for_timeout(500); pg.screenshot(path=OUT + '77-mega-armadura.png')
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
