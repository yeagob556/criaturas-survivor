// Prueba de humo sin navegador: extrae el <script> de index.html, lo ejecuta con un DOM falso
// y simula 12 minutos de partida (inmortal) resolviendo subidas de nivel. Uso: node scripts/smoke.js
const fs = require('fs'), path = require('path');
const noop = () => {};
const mkCtx = () => new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'measureText' ? () => ({ width: 1 }) : k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : noop), set: (t, k, v) => { t[k] = v; return true; } });
const els = {};
const mkEl = () => ({ classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, style: {}, getContext: mkCtx, addEventListener: noop, appendChild: noop, querySelectorAll: () => [], insertAdjacentHTML: noop, setPointerCapture: noop, width: 30, height: 30, set innerHTML(v) {}, set textContent(v) {} });
global.document = { querySelector: s => els[s] || (els[s] = mkEl()), createElement: () => mkEl() };
global.window = global; global.innerWidth = 960; global.innerHeight = 540; global.devicePixelRatio = 1;
global.addEventListener = noop; global.requestAnimationFrame = noop;
global.localStorage = { getItem: () => null, setItem: noop }; global.confirm = () => true;
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let src = html.match(/<script>([\s\S]*)<\/script>/)[1];
src += `
;(function(){
  newRun();
  let ok = 0;
  for (let i = 0; i < 60 * 60 * 12; i++) {
    if (G.over) break;
    G.hp = G.maxhp;
    if (G.paused) { chooseOffer(curOffer.opts[0]); continue; }
    keys.d = (i % 240) < 120; keys.a = !keys.d;
    update(1 / 60); draw(); ok++;
  }
  console.log('frames', ok, 't', G.t.toFixed(0), 'lvl', G.lvl, 'kills', G.kills);
  console.log('mapas vistos', Object.keys(SAVE.dex.m).length, '/', MAPS.length, '| criaturas descubiertas', Object.values(SAVE.dex.c).filter(d => d.seen).length, '/', DEX.length);
  // la simulacion anterior uso obstaculos reales al azar; las pruebas exactas se hacen en un mundo vacio
  const realChunk = getChunk; const seenKinds = new Set(); for (const c of G.chunks.values()) for (const o of c) seenKinds.add(o.k);
  console.log('trozos generados', G.chunks.size, '| clases vistas', [...seenKinds].join(','));
  getChunk = () => [];
  // --- pruebas de la lógica de buffs (valores exactos) ---
  const eq = (a, b, msg) => { if (Math.abs(a - b) > 1e-9) throw new Error('FALLO ' + msg + ': ' + a + ' vs ' + b); };
  const near = (a, b, msg) => { if (Math.abs(a - b) > 1e-6 * Math.max(1, b)) throw new Error('FALLO ' + msg + ': ' + a + ' vs ' + b); };
  newRun(); G.enemies = [];
  const mapOf = t => MAPS.find(m => m.type === t);
  const mv = G.moves[0];
  setMap(mapOf('planta')); const d0 = moveDmg(mv, false);                 // Brasito (fuego) en mapa de planta: sin buff
  setMap(mapOf('fuego'));  near(moveDmg(mv, false), d0 * MAP_BUFF, 'dano fuego en mapa fuego');
  eq(pb('dmg'), MAP_BUFF, 'pb dmg'); eq(pb('spd'), 1, 'pb spd sin buff');   // solo su especialidad
  const e = {type:'planta', hp:100, maxhp:100, r:10, hpBuf:1, rBuf:1}; G.enemies.push(e);
  setMap(mapOf('planta')); eq(e.maxhp, 100 * MAP_BUFF, 'vida planta x1.2'); eq(e.r, 10, 'tamano planta sin buff');
  setMap(mapOf('agua'));   eq(e.maxhp, 100, 'vida planta revertida'); eq(e.hp, 100, 'hp revertida');
  const f = {type:'dragon', hp:50, maxhp:50, r:10, hpBuf:1, rBuf:1}; G.enemies.push(f);
  setMap(mapOf('dragon')); eq(f.r, 10 * MAP_BUFF, 'tamano dragon x1.2'); eq(eb(f,'size'), MAP_BUFF, 'eb size');
  setMap(mapOf('agua'));   eq(f.r, 10, 'tamano revertido'); eq(eb(e,'res'), 1, 'eb res planta sin buff');
  const w = {type:'agua', hp:100, maxhp:100, r:10, hpBuf:1, rBuf:1, id:'aguamedusa'};
  hurt(w, 12); eq(w.hp, 100 - 12 / MAP_BUFF, 'resistencia agua en mapa agua');
  setMap(mapOf('planta')); const b0 = G.maxhp;                              // vida max del companero (fuego) no cambia en planta
  newRun(); G.sp = SPECIES.find(x => x.id === 'brotin'); G.baseMax = 100; G.maxhp = 100; G.hp = 50;
  setMap(mapOf('planta')); eq(G.maxhp, 120, 'vida max companero planta'); eq(G.hp, 60, 'hp proporcional');
  setMap(mapOf('fuego'));  eq(G.maxhp, 100, 'vida max revertida'); eq(G.hp, 50, 'hp proporcional al volver');
  // criaturario: descubrir una vez y contar bajas
  newRun(); SAVE.dex.c.hojarrata = {seen:false, kills:0}; const nd = G.newDisc.length; discover('hojarrata', 'Hojarrata'); discover('hojarrata', 'Hojarrata');
  eq(G.newDisc.length - nd, 1, 'descubrir solo una vez'); countKill({id: 'hojarrata'}); eq(SAVE.dex.c.hojarrata.kills, 1, 'bajas');
  panelDex('c'); panelDex('m');
  console.log('BUFFS Y CRIATURARIO OK');
  // --- pasivas y ramas excluyentes ---
  newRun(); G.enemies = []; const m0 = mult();
  chooseOffer({k:'pas', id:'pies'});                                         // rama agilidad: bloquea fortaleza
  near(mult().spd, m0.spd * 1.07, 'pies +7%'); eq(branchLocked('fortaleza') ? 1 : 0, 1, 'fortaleza bloqueada'); eq(branchLocked('agilidad') ? 1 : 0, 0, 'agilidad libre');
  for (let i = 0; i < 400; i++) { const o = offerOptions(7).opts; for (const c of o) if (c.k === 'pas' && PASSIVES[c.id].branch === 'fortaleza') throw new Error('FALLO sale fortaleza con agilidad'); }
  for (let i = 0; i < 400; i++) { newRun(); const br = new Set(offerOptions(7).opts.filter(c => c.k === 'pas').map(c => PASSIVES[c.id].branch));
    if ((br.has('agilidad') && br.has('fortaleza')) || (br.has('poder') && br.has('ingenio'))) throw new Error('FALLO ramas opuestas en la misma oferta'); }
  newRun(); for (const id of ['pies', 'esquiva', 'reflejos', 'garra']) chooseOffer({k:'pas', id});
  for (let i = 0; i < 300; i++) for (const c of offerOptions(7).opts) if (c.k === 'pas' && pl(c.id) === 0) throw new Error('FALLO mas de ' + PAS_SLOTS + ' pasivas');
  for (let i = 0; i < 6; i++) chooseOffer({k:'pas', id:'pies'}); eq(pl('pies') , 7, 'nivel pasiva sube'); // el tope se aplica en las ofertas
  for (let i = 0; i < 300; i++) for (const c of offerOptions(7).opts) if (c.k === 'pas' && c.id === 'pies') throw new Error('FALLO pasiva sobre el maximo');
  newRun(); G.pas = {}; chooseOffer({k:'pas', id:'piel'}); near(mult().armor, 0.94, 'piel dura'); chooseOffer({k:'pas', id:'vigor'});
  const mh = G.maxhp; G.hp = mh/2; chooseOffer({k:'pas', id:'vigor'}); near(G.maxhp, Math.round(G.baseMax * 1.16 * pb('hp')), 'vigor sube vida maxima'); near(G.hp / G.maxhp, 0.5, 'vigor mantiene proporcion');
  newRun(); chooseOffer({k:'pas', id:'sabio'}); G.xp = 0; const xp0 = G.xp; addXP(10); near(G.xp + (G.lvl - 1) * 0, G.xp, 'xp'); // sabiduria no rompe addXP
  newRun(); chooseOffer({k:'pas', id:'esquiva'}); G.pas.esquiva = 20; G.inv = 0; const hp1 = G.hp; playerHit(50); eq(G.hp, hp1, 'esquiva 100%');
  newRun(); chooseOffer({k:'pas', id:'critico'}); G.pas.critico = 100; const ee = {type:'planta', hp:100, maxhp:100, r:10, hpBuf:1, rBuf:1, x:0, y:0}; G.map = MAPS.find(x => x.type === 'fuego'); hurt(ee, 10); eq(ee.hp, 80, 'critico x2');
  // movimientos nuevos: se disparan sin errores en todos los niveles
  for (const id of Object.keys(MOVES)) for (const lvl of [1, 5]) { newRun(); G.enemies = [{type:'planta', hp:1e9, maxhp:1e9, r:10, hpBuf:1, rBuf:1, x:60, y:0, kx:0, ky:0, orbT:0, flash:0}];
    const mv2 = {id, lvl, t:0, links:[]}; fire(mv2, false); }
  newRun(); G.enemies = [{type:'planta', hp:100, maxhp:100, r:10, hpBuf:1, rBuf:1, x:50, y:0, kx:0, ky:0, orbT:0, flash:0}]; fire({id:'zarpazo', lvl:1, t:0, links:[]}, false);
  if (!(G.enemies[0].hp < 100)) throw new Error('FALLO zarpazo no golpea');
  newRun(); G.enemies = [{type:'planta', hp:100, maxhp:100, r:10, hpBuf:1, rBuf:1, x:50, y:0, kx:0, ky:0, orbT:0, flash:0}]; fire({id:'esporas', lvl:1, t:0, links:[]}, false);
  if (!(G.enemies[0].hp < 100)) throw new Error('FALLO esporas no golpea');
  console.log('PASIVAS Y MOVIMIENTOS NUEVOS OK');
  // --- ventajas/debilidades y movimientos de control ---
  keys.a = keys.d = false;
  for (const t of Object.keys(TYPES)) { eq(Object.values(STRONG).filter(x => x === t).length, 1, 'un solo atacante fuerte contra ' + t); eq(eff(t, STRONG[t]), EFF_UP, 'ventaja ' + t); eq(eff(STRONG[t], t), EFF_DOWN, 'desventaja ' + t); }
  eq(eff('fuego', 'electrico'), 1, 'neutral'); eq(eff(undefined, 'fuego'), 1, 'sin tipo');
  const mk = (type, x, y, o) => Object.assign({id:'hojarrata', name:'x', type, hp:1e9, maxhp:1e9, r:10, hpBuf:1, rBuf:1, x, y, kx:0, ky:0, orbT:0, flash:0, spd:60, dmg:6, ph:0, shootT:9, xp:1}, o || {});
  newRun(); G.map = MAPS.find(x => x.type === 'electrico');
  let v = mk('planta', 0, 0); hurt(v, 10, 'fuego'); near(1e9 - v.hp, 13, 'fuego vs planta x1.3');
  v = mk('agua', 0, 0); hurt(v, 10, 'fuego'); near(1e9 - v.hp, 7.5, 'fuego vs agua x0.75');
  v = mk('electrico', 0, 0); hurt(v, 10, 'fuego'); near(1e9 - v.hp, 10, 'fuego vs electrico neutral');
  G.sp = SPECIES.find(x => x.id === 'brasito'); G.inv = 0; G.hp = G.maxhp = 100; playerHit(10, 'agua'); near(100 - G.hp, 13, 'hostil de agua contra fuego x1.3');
  G.inv = 0; G.hp = 100; playerHit(10, 'planta'); near(100 - G.hp, 7.5, 'hostil de planta contra fuego x0.75');
  // el tipo del movimiento se usa en proyectiles
  newRun(); G.enemies = [mk('planta', 80, 0)]; G.moves = [{id:'ascuas', lvl:1, t:0, links:[]}]; fire(G.moves[0], false); eq(G.proj[0].mt === 'fuego' ? 1 : 0, 1, 'proyectil con tipo');
  // estados
  newRun(); G.moves = []; G.enemies = [mk('planta', 40, 0, {id:'a'})];
  for (const [id, k] of [['marea','slow'], ['raices','root'], ['estatica','stun'], ['niebla','shrink'], ['brasas','burn']]) { G.enemies[0][k] = 0; fire({id, lvl:1, t:0, links:[]}, false); if (!(G.enemies[0][k] > 0)) throw new Error('FALLO estado ' + k + ' de ' + id); }
  const bo = mk('planta', 40, 0, {boss:true}); status(bo, 'root', 5); status(bo, 'stun', 5); status(bo, 'slow', 4, 0.5); eq(bo.root || 0, 0, 'jefe inmune a raices'); eq(bo.stun || 0, 0, 'jefe inmune a paralisis'); eq(bo.slow, 2, 'jefe duracion a la mitad');
  const run = (e, frames) => { G.enemies = [e]; G.px = G.py = 0; const x0 = e.x; for (let i = 0; i < frames; i++) { G.hp = G.maxhp; G.inv = 0; update(1 / 60); } return Math.abs(e.x - x0); };
  const base = run(mk('planta', 500, 0), 60), lento = run(mk('planta', 500, 0, {slow:5, slowV:0.5}), 60), preso = run(mk('planta', 500, 0, {root:5}), 60), para = run(mk('planta', 500, 0, {stun:5}), 60);
  if (!(lento > base * 0.4 && lento < base * 0.6)) throw new Error('FALLO ralentizar: ' + lento + ' vs ' + base); if (preso > 1 || para > 1) throw new Error('FALLO inmovilizar: ' + preso + ' ' + para);
  const q = mk('planta', 500, 0, {burn:5, burnV:10}); run(q, 60); if (!(1e9 - q.hp > 8 && 1e9 - q.hp < 12)) throw new Error('FALLO quemadura: ' + (1e9 - q.hp));
  // alcance reducido: a 20 px normalmente te golpea; con Niebla no
  G.hp = G.maxhp = 100; G.inv = 0; G.px = G.py = 0; G.enemies = [mk('planta', 20, 0, {spd:0})]; update(1 / 60); eq(G.hp < 100 ? 1 : 0, 1, 'contacto normal');
  G.hp = G.maxhp = 100; G.inv = 0; G.enemies = [mk('planta', 20, 0, {spd:0, shrink:5})]; update(1 / 60); eq(G.hp, 100, 'sin contacto con alcance reducido');
  // tornado: junta a los enemigos hacia el centro
  newRun(); G.moves = []; G.enemies = [mk('planta', 200, 0), mk('planta', 200, 160), mk('planta', 200, -90), mk('planta', 200, 80)];
  fire({id:'ciclon', lvl:1, t:0, links:[]}, false); eq(G.tornados.length, 1, 'tornado creado'); const sp0 = Math.max(...G.enemies.map(e => e.y)) - Math.min(...G.enemies.map(e => e.y));
  for (let i = 0; i < 90; i++) { G.hp = G.maxhp; G.inv = 0; for (const e of G.enemies) e.spd = 0; update(1 / 60); }
  const sp1 = Math.max(...G.enemies.slice(0, 4).map(e => e.y)) - Math.min(...G.enemies.slice(0, 4).map(e => e.y)); if (!(sp1 < sp0 * 0.5)) throw new Error('FALLO tornado no junta: ' + sp0 + ' -> ' + sp1);
  for (let i = 0; i < 600; i++) { G.hp = G.maxhp; update(1 / 60); } eq(G.tornados.length, 0, 'tornado caduca');
  panelDex('c'); panelGuide();
  console.log('VENTAJAS Y CONTROL OK');
  // --- obstaculos ---
  getChunk = realChunk;
  newRun(); G.seed = 12345; G.chunks = new Map(); const sig = (cx, cy) => JSON.stringify(getChunk(cx, cy)); const c1 = sig(2, 3); G.chunks = new Map(); eq(sig(2, 3) === c1 ? 1 : 0, 1, 'trozo determinista');
  G.seed = 999; G.chunks = new Map(); eq(sig(2, 3) === c1 ? 1 : 0, 0, 'otra semilla, otro trozo');
  const cnt = {}; for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const c = getChunk(i, j);
    for (const o of c) { cnt[o.k] = (cnt[o.k] || 0) + 1; if (Math.hypot(o.x, o.y) < 170) throw new Error('FALLO zona de inicio con obstaculo ' + o.k);
      for (const q of c) if (q !== o && o.solid && q.solid && Math.hypot(o.x - q.x, o.y - q.y) < o.r + q.r + 28 - 1e-9) throw new Error('FALLO solidos demasiado juntos'); } }
  for (const k of ['montana', 'arbol', 'piedra', 'hierba', 'liquido']) if (!(cnt[k] > 20)) throw new Error('FALLO pocas clases ' + k + ': ' + cnt[k]);
  console.log('densidad', JSON.stringify(cnt));
  const mkO = (k, x, y, r) => ({k, x, y, r, v:0.3, solid:['montana', 'arbol', 'piedra'].includes(k), id:'t' + Math.random(), hp:OBS_HP[k] || 0, flash:0, orbT:0, dead:false});
  const world = list => { getChunk = (cx, cy) => (cx === 0 && cy === 0) ? list : []; };
  const stay = n => { for (let i = 0; i < n; i++) { G.hp = G.maxhp; G.inv = 0; update(1 / 60); } };
  // sólidos empujan al jugador y a los hostiles
  newRun(); G.moves = []; const mont = mkO('montana', 100, 0, 50); world([mont]); G.px = 95; G.py = 0; stay(2);
  if (!(Math.hypot(G.px - 100, G.py) >= 60 - 1e-6)) throw new Error('FALLO jugador dentro de la montana');
  keys.d = true; G.px = 0; G.py = 0; stay(180); keys.d = false; if (!(G.px < 100 - 60 + 1)) throw new Error('FALLO jugador atraviesa la montana: ' + G.px);
  newRun(); G.moves = []; world([mkO('montana', 250, 0, 50)]); G.px = G.py = 0; G.enemies = [mk('planta', 500, 0, {spd:120, hp:1e9})]; stay(60 * 9);
  if (!(G.enemies[0].x < 150)) throw new Error('FALLO el hostil no rodea la montana: x=' + G.enemies[0].x);
  newRun(); G.moves = []; const arb = mkO('arbol', 200, 0, 13); world([arb]); G.px = G.py = 0; G.enemies = [mk('planta', 215, 0, {spd:0})]; stay(2);
  if (!(Math.hypot(G.enemies[0].x - 200, G.enemies[0].y) >= 13 + 7 - 1e-6)) throw new Error('FALLO hostil dentro del arbol');
  // montañas y árboles indestructibles; piedras y hierba se rompen y no reaparecen
  newRun(); const m2 = mkO('montana', 300, 300, 50), t2 = mkO('arbol', 300, 400, 13); hitObs(m2, 1e9); hitObs(t2, 1e9); eq(m2.dead ? 1 : 0, 0, 'montana indestructible'); eq(t2.dead ? 1 : 0, 0, 'arbol indestructible');
  newRun(); G.seed = 77; G.chunks = new Map(); getChunk = realChunk; let rock = null; for (let j = -3; j <= 3 && !rock; j++) for (let i = -3; i <= 3 && !rock; i++) rock = getChunk(i, j).find(o => o.k === 'piedra');
  const rid = rock.id, rcx = Math.floor(rock.x / CH), rcy = Math.floor(rock.y / CH); hitObs(rock, 10); eq(rock.dead ? 1 : 0, 0, 'piedra aguanta un golpe suave'); hitObs(rock, 1e9); eq(rock.dead ? 1 : 0, 1, 'piedra rota');
  G.chunks = new Map(); eq(getChunk(rcx, rcy).some(o => o.id === rid) ? 1 : 0, 0, 'la piedra rota no reaparece');
  newRun(); const rk = mkO('piedra', 80, 0, 14); world([rk]); G.moves = []; G.px = G.py = 0; G.proj.push({x:80, y:0, vx:0, vy:0, dmg:20, r:6, pierce:1, life:1, col:'#fff', hit:[], mt:'fuego'}); stay(1);
  if (!(rk.hp < OBS_HP.piedra)) throw new Error('FALLO el proyectil no daña la piedra');
  newRun(); const rk2 = mkO('piedra', 60, 0, 14), gr2 = mkO('hierba', 60, 10, 30), mt3 = mkO('montana', 70, 0, 40); world([rk2, gr2, mt3]); G.moves = []; refreshNear();
  hitArea(60, 0, 20, 100); eq(rk2.dead ? 1 : 0, 1, 'area rompe piedra'); eq(gr2.dead ? 1 : 0, 1, 'area rompe hierba'); eq(mt3.dead ? 1 : 0, 0, 'area no rompe montana');
  // hierba: reduce la visión mientras estás dentro
  newRun(); const gr = mkO('hierba', 0, 0, 40); world([gr]); G.moves = []; G.px = G.py = 0; stay(90); if (!(G.vis > 0.9)) throw new Error('FALLO vision dentro de la hierba: ' + G.vis);
  hitObs(gr, 1e9); stay(90); if (!(G.vis < 0.05)) throw new Error('FALLO vision tras romper la hierba: ' + G.vis);
  // líquidos: efecto según el mapa; inmunes los del tipo del mapa
  const liqW = () => { const l = mkO('liquido', 0, 0, 90); world([l]); return l; };
  newRun(); G.moves = []; liqW(); G.sp = SPECIES.find(x => x.id === 'gotin'); setMap(MAPS.find(x => x.type === 'fuego')); G.hp = G.maxhp = 100; G.px = G.py = 0; G.inv = 0;
  for (let i = 0; i < 60; i++) update(1 / 60); near(100 - G.hp, 7, 'lava danya 7 por segundo');
  newRun(); G.moves = []; liqW(); G.sp = SPECIES.find(x => x.id === 'brasito'); setMap(MAPS.find(x => x.type === 'fuego')); G.hp = G.maxhp = 100; G.px = G.py = 0;
  for (let i = 0; i < 60; i++) update(1 / 60); eq(G.hp, 100, 'tipo fuego inmune a la lava');
  const recorrido = (sp, tipoMapa) => { newRun(); G.moves = []; G.sp = SPECIES.find(x => x.id === sp); const l = mkO('liquido', 0, 0, 400); world([l]); setMap(MAPS.find(x => x.type === tipoMapa));
    G.px = -300; G.py = 0; keys.d = true; const x0 = G.px; stay(30); keys.d = false; return G.px - x0; };
  const libre = recorrido('brasito', 'fuego') , agua = recorrido('brasito', 'agua'); near(agua / libre * 1, 0.6 * 1, 'aguas profundas ralentizan x0.6'); // brasito es fuego: en mapa de agua no es inmune
  const inmune = recorrido('gotin', 'agua'); near(inmune, libre * (SPECIES.find(x => x.id === 'gotin').spd / SPECIES.find(x => x.id === 'brasito').spd) * 1, 'tipo agua inmune a las aguas');
  newRun(); G.moves = []; liqW(); setMap(MAPS.find(x => x.type === 'fuego')); G.px = G.py = 1000; G.enemies = [mk('planta', 1000, 1000, {spd:0}), mk('fuego', 1000, 1000, {spd:0})];
  world([mkO('liquido', 1000, 1000, 90)]); G.chunks = new Map(); getChunk = (cx, cy) => (cx === 2 && cy === 2) ? [mkO('liquido', 1000, 1000, 90)] : []; stay(60);
  near(1e9 - G.enemies[0].hp, 7, 'lava danya al hostil de planta'); eq(G.enemies[1].hp, 1e9, 'hostil de fuego inmune');
  // el aspecto y el efecto cambian con el mapa; el dibujo funciona en todos
  const names = new Set(Object.values(BIOME).map(b => b.n.mont)); eq(names.size, MAPS.length, 'montanas distintas por mapa');
  newRun(); world(['montana', 'arbol', 'piedra', 'hierba', 'liquido'].map((k, i) => mkO(k, 40 + i * 60, 30, 30))); for (const mp of MAPS) { setMap(mp); draw(); }
  console.log('OBSTACULOS OK');
  G.hp = 0; endRun();
  panelCompanions(); panelUpgrades(); panelGacha(); panelStats(); panelGuide(); refreshMenu();
  console.log('SMOKE OK');
})();`;
(0, eval)(src);
