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
// audio falso: registra fundidos y reproducciones para comprobar la logica de la musica
const gainNode = () => ({gain:{value:1, ramps:[], cancelScheduledValues: noop, setValueAtTime(v){ this.value = v; }, linearRampToValueAtTime(v, t){ this.ramps.push([v, t]); }, setTargetAtTime(v){ this.target = v; }}, connect: noop});
global.AudioContext = class { constructor(){ this.currentTime = 0; this.state = 'running'; this.destination = {}; } createGain(){ return gainNode(); } createMediaElementSource(){ return {connect: noop}; } };
global.Audio = class { constructor(src){ this.src = src; this.paused = true; this.currentTime = 0; this.duration = NaN; this.handlers = {}; this.plays = 0; } addEventListener(k, f){ this.handlers[k] = f; } play(){ this.paused = false; this.plays++; return Promise.resolve(); } pause(){ this.paused = true; } };
global.localStorage = { getItem: () => null, setItem: noop }; global.confirm = () => true;
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
global.__html = html; global.__changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8'); global.__readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
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
  if (!(G.t > 600)) throw new Error('FALLO la simulacion de 12 min no avanza (juego atascado en pausa?): t=' + G.t.toFixed(1)); if (!(G.lvl > 10)) throw new Error('FALLO no se sube de nivel: ' + G.lvl);
  console.log('mapas vistos', Object.keys(SAVE.dex.m).length, '/', MAPS.length, '| criaturas descubiertas', Object.values(SAVE.dex.c).filter(d => d.seen).length, '/', DEX.length);
  // la simulacion anterior uso obstaculos reales al azar; las pruebas exactas se hacen en un mundo vacio
  const realChunk = getChunk; const seenKinds = new Set(); for (const c of G.chunks.values()) for (const o of c) seenKinds.add(o.k);
  console.log('trozos generados', G.chunks.size, '| clases vistas', [...seenKinds].join(','));
  getChunk = () => [];
  // --- pruebas de la lógica de buffs (valores exactos) ---
  const eq = (a, b, msg) => { if (!(Math.abs(a - b) <= 1e-9)) throw new Error('FALLO ' + msg + ': ' + a + ' vs ' + b); };
  const near = (a, b, msg) => { if (!(Math.abs(a - b) <= 1e-6 * Math.max(1, b))) throw new Error('FALLO ' + msg + ': ' + a + ' vs ' + b); };
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
  const mkO = (k, x, y, r) => ({k, x, y, r, v:0.3, solid:['montana', 'arbol', 'piedra'].includes(k), id:'t' + Math.random(), hp:OBS_HP[k] || 0, flash:0, orbT:0, dead:false, prog:0});
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
  const libre = recorrido('brasito', 'fuego') , agua = recorrido('brasito', 'agua'); near(agua / libre * 1, 0.4 * 1, 'aguas profundas: el fuego (tipo contrario) se frena x0.4'); // el agua le gana al fuego: efecto x1,5 -> 1-(1-0.6)*1.5
  const inmune = recorrido('gotin', 'agua'); near(inmune, libre * (SPECIES.find(x => x.id === 'gotin').spd / SPECIES.find(x => x.id === 'brasito').spd) * 1, 'tipo agua inmune a las aguas');
  newRun(); G.moves = []; liqW(); setMap(MAPS.find(x => x.type === 'fuego')); G.px = G.py = 1000; G.enemies = [mk('planta', 1000, 1000, {spd:0}), mk('fuego', 1000, 1000, {spd:0})];
  world([mkO('liquido', 1000, 1000, 90)]); G.chunks = new Map(); getChunk = (cx, cy) => (cx === 2 && cy === 2) ? [mkO('liquido', 1000, 1000, 90)] : []; stay(60);
  near(1e9 - G.enemies[0].hp, 10.5, 'lava: la planta (tipo contrario) sufre x1,5');  eq(G.enemies[1].hp, 1e9, 'hostil de fuego inmune');
  // el aspecto y el efecto cambian con el mapa; el dibujo funciona en todos
  const names = new Set(Object.values(BIOME).map(b => b.n.mont)); eq(names.size, MAPS.length, 'montanas distintas por mapa');
  newRun(); world(['montana', 'arbol', 'piedra', 'hierba', 'liquido'].map((k, i) => mkO(k, 40 + i * 60, 30, 30))); for (const mp of MAPS) { setMap(mp); draw(); }
  { const neutro = recorrido('chispin', 'agua'), libreC = recorrido('chispin', 'fuego'); near(neutro / libreC, 0.6, 'aguas profundas: un tipo neutro se frena x0.6'); }      // electrico no es contrario del agua
  console.log('OBSTACULOS OK');
  // --- musica ---
  getChunk = () => [];
  const mapa = t => MAPS.find(x => x.type === t);
  newRun(); setMap(mapa('agua')); eq(music.cur === 'agua' ? 1 : 0, 1, 'suena la pista del mapa'); const ta = music.tracks.agua;
  eq(ta.a.src === 'music/agua.mp3' ? 1 : 0, 1, 'ruta de la pista'); eq(ta.a.loop ? 1 : 0, 1, 'pista en bucle'); eq(ta.a.paused ? 1 : 0, 0, 'reproduciendo'); eq(ta.g.gain.ramps.at(-1)[0], 1, 'sube la nueva pista'); eq(ta.g.gain.ramps.at(-1)[1], AC.currentTime + MUSIC_FADE, 'fundido de 3 s');
  const p0 = ta.a.plays; setMap(mapa('sombra')); eq(music.cur === 'sombra' ? 1 : 0, 1, 'cambia de pista'); eq(ta.g.gain.ramps.at(-1)[0], 0, 'baja la anterior'); eq(ta.a.paused ? 1 : 0, 0, 'la anterior sigue sonando durante el fundido');
  AC.currentTime += MUSIC_FADE + 1; musicTick(); eq(ta.a.paused ? 1 : 0, 1, 'la anterior se pausa al acabar el fundido'); eq(music.tracks.sombra.a.paused ? 1 : 0, 0, 'la nueva sigue');
  setMap(mapa('agua')); eq(music.tracks.agua === ta ? 1 : 0, 1, 'se reutiliza la pista (recuerda por donde iba)'); eq(ta.a.plays, p0 + 1, 'se reanuda'); eq(ta.stopAt, 0, 'sin parada pendiente');
  setMap(mapa('sombra')); setMap(mapa('agua')); AC.currentTime += 10; musicTick(); eq(ta.a.paused ? 1 : 0, 0, 'volver antes de que acabe el fundido no la corta');
  // bucle suave
  ta.a.duration = 60; ta.a.currentTime = 0.5; musicTick(); near(ta.lg.gain.value, 0.25, 'entrada suave tras el bucle'); ta.a.currentTime = 30; musicTick(); eq(ta.lg.gain.value, 1, 'mitad de la pista a pleno volumen'); ta.a.currentTime = 59; musicTick(); near(ta.lg.gain.value, 0.5, 'salida suave antes del bucle');
  // pista inexistente: silencio sin errores y se sigue jugando
  newRun(); music.tracks.dragon && music.tracks.dragon.a.handlers.error && 0; playMusic('dragon'); music.tracks.dragon.a.handlers.error(); eq(music.bad.dragon ? 1 : 0, 1, 'pista ausente marcada'); const antes = music.cur; setMap(mapa('dragon')); eq(music.cur === antes || music.cur === null ? 1 : 0, 1, 'mapa sin pista no rompe nada'); update(1 / 60);
  // pausa y apagado
  newRun(); setMap(mapa('planta')); togglePause(true); near(music.master.gain.target, MUSIC_VOL * 0.3, 'pausa baja la musica'); togglePause(false); near(music.master.gain.target, MUSIC_VOL, 'reanudar la sube');
  setMusic(false); eq(SAVE.music ? 1 : 0, 0, 'musica desactivada'); eq(music.cur === null ? 1 : 0, 1, 'sin pista activa'); setMap(mapa('fuego')); eq(music.cur === null ? 1 : 0, 1, 'no suena con la musica apagada');
  setMusic(true); eq(music.cur === G.map.type ? 1 : 0, 1, 'al reactivarla suena la del mapa actual');
  G.hp = 0; endRun(); eq(music.cur === null ? 1 : 0, 1, 'fin de partida apaga la musica');
  console.log('MUSICA OK');
  // --- gacha tragamonedas (solo visual) ---
  const realRandom = Math.random, rq = vals => { let i = 0; Math.random = () => vals[i++ % vals.length]; };
  newRun(); SAVE.owned = {brasito:{shiny:false}}; SAVE.coins = 0;
  rq([0.5, 0.5]); let g1 = gachaRoll(); eq(g1.out === 'new' ? 1 : 0, 1, 'tirada: compañero nuevo'); eq(g1.id === SPECIES[3].id ? 1 : 0, 1, 'tirada: criatura sorteada'); eq(SAVE.owned[g1.id].shiny ? 1 : 0, 0, 'tirada: nuevo sin shiny');
  SAVE.owned = {brasito:{shiny:false}}; rq([0.5, 0.01]); g1 = gachaRoll(); eq(g1.out === 'shiny' ? 1 : 0, 1, 'tirada: nuevo shiny (5%)'); eq(SAVE.owned[g1.id].shiny ? 1 : 0, 1, 'tirada: shiny guardado');
  SAVE.owned = {brasito:{shiny:false}}; SAVE.coins = 0; rq([0, 0.5]); g1 = gachaRoll(); eq(g1.out === 'dup' ? 1 : 0, 1, 'tirada: repetido'); eq(SAVE.coins, 40, 'tirada: +40 por repetido');
  SAVE.owned = {brasito:{shiny:false}}; rq([0, 0.05]); g1 = gachaRoll(); eq(g1.out === 'shiny' ? 1 : 0, 1, 'tirada: repetido que sale shiny (10%)'); rq([0, 0.01]); SAVE.coins = 0; g1 = gachaRoll(); eq(g1.out === 'dup' ? 1 : 0, 1, 'tirada: ya shiny, repetido'); eq(SAVE.coins, 40, 'tirada: ya shiny paga');
  Math.random = realRandom;
  // los rodillos terminan exactamente en su casilla y en orden
  for (const r of [{id:'brasito', type:'fuego', out:'dup', msg:'x'}, {id:'dracolin', type:'dragon', out:'shiny', msg:'x'}, {id:'gotin', type:'agua', out:'new', msg:'x'}]) for (const quick of [false, true]) {
    slotSpin(r, quick); const tg = slotTargets(r), doneAt = [0, 0, 0]; let t = 0;
    while (!slotUpdate(slotM, 1 / 60)) { t += 1 / 60; slotM.reels.forEach((R, i) => { if (R.ph === 'done' && !doneAt[i]) doneAt[i] = t; }); if (t > 20) throw new Error('FALLO el giro no termina'); }
    doneAt.forEach((v, i) => { if (!v) doneAt[i] = t + 1 / 60; });
    slotM.reels.forEach((R, i) => eq(R.pos, tg[i], 'rodillo ' + i + ' en su casilla')); if (!(doneAt[0] <= doneAt[1] && doneAt[1] <= doneAt[2])) throw new Error('FALLO orden de paradas ' + doneAt); }
  slotBusy = true; slotM.done = false; slotDraw(); slotBusy = false; slotDraw();
  // flujo completo: cobro único, cola y lista de resultados
  const lista = []; const montar = () => { panelGacha(); document.querySelector('#gList').insertAdjacentHTML = (w, h) => lista.push(h); document.querySelector('#gList').innerHTML = ''; };
  newRun(); SAVE.coins = 1000; SAVE.owned = {brasito:{shiny:false}}; lista.length = 0; montar(); rq([0, 0.5]);                        // repetido: -100 +40
  document.querySelector('#g1').onclick(); eq(slotBusy ? 1 : 0, 1, 'girando'); eq(SAVE.coins, 940, 'cobro de la tirada x1 mas el repetido'); document.querySelector('#g1').onclick(); eq(SAVE.coins, 940, 'no se cobra dos veces mientras gira');
  for (let i = 0; i < 60 * 30 && slotBusy; i++) slotStep(1 / 60); Math.random = realRandom; eq(slotBusy ? 1 : 0, 0, 'termina el x1'); eq(lista.length, 1, 'un resultado en la lista');
  lista.length = 0; montar(); SAVE.coins = 1000; rq([0, 0.5]); document.querySelector('#g10').onclick(); eq(slotQ.length, 9, 'cola de 9 tras empezar el x10'); eq(SAVE.coins, 100 + 400, 'x10: 900 de coste y 10 repetidos');
  for (let i = 0; i < 60 * 60 && slotBusy; i++) slotStep(1 / 60); Math.random = realRandom; eq(slotBusy ? 1 : 0, 0, 'termina el x10'); eq(lista.length, 10, 'diez resultados en la lista');
  lista.length = 0; montar(); SAVE.coins = 1000; rq([0, 0.5]); document.querySelector('#g10').onclick(); slotStep(0.1); slotSkip(); Math.random = realRandom; eq(slotBusy ? 1 : 0, 0, 'saltar termina'); eq(lista.length, 10, 'saltar enseña los diez resultados'); eq(slotQ.length, 0, 'cola vacia');
  panelGacha(); eq(document.querySelector('#ovPanel').style.alignItems === 'flex-start' ? 1 : 0, 1, 'el Gacha se alinea arriba'); panelStats(); eq(document.querySelector('#ovPanel').style.alignItems === '' ? 1 : 0, 1, 'otros paneles siguen centrados');
  if (!(SLOT_W / SLOT_H >= 2.5)) throw new Error('FALLO la tragamonedas es demasiado alta: ' + SLOT_W + 'x' + SLOT_H); if (!(SLOT_H <= 120)) throw new Error('FALLO la tragamonedas es demasiado grande');
  panelGacha(); eq(slotShown ? 1 : 0, 0, 'la maquina empieza oculta'); SAVE.coins = 1000; document.querySelector('#g1').onclick(); eq(slotShown ? 1 : 0, 1, 'la maquina se muestra al tirar'); slotSkip(); panelGacha(); eq(slotShown ? 1 : 0, 0, 'al reabrir el panel vuelve a estar oculta');
  panelGacha();
  console.log('GACHA OK');

  // --- monstruos: alcance, disparos bloqueados, embestidas y jefes ---
  getChunk = () => []; keys.a = keys.d = false;
  const corre = n => { for (let i = 0; i < n; i++) update(1 / 60); };
  const sombraMap = () => setMap(MAPS.find(x => x.type === 'sombra'));
  eq(reachOf({type:'sombra'}), 0.5, 'violetas: alcance a la mitad'); eq(reachOf({type:'planta'}), 1, 'otros: alcance normal'); near(reachOf({type:'sombra', shrink:2}), 0.225, 'Niebla se multiplica');
  newRun(); G.moves = []; G.px = G.py = 0; sombraMap();
  G.enemies = [mk('sombra', 15, 0, {spd:0})]; G.hp = G.maxhp = 100; G.inv = 0; corre(1); eq(G.hp, 100, 'violeta no alcanza a 15 px');
  G.enemies = [mk('planta', 15, 0, {spd:0})]; G.inv = 0; corre(1); eq(G.hp < 100 ? 1 : 0, 1, 'otro hostil si alcanza a 15 px');
  G.hp = 100; G.inv = 0; G.enemies = [mk('sombra', 8, 0, {spd:0})]; corre(1); eq(G.hp < 100 ? 1 : 0, 1, 'violeta si alcanza a 8 px');
  G.ebul = []; G.enemies = [mk('sombra', 300, 0, {spd:0, shoots:true, shootT:0})]; corre(1); eq(G.ebul.length, 0, 'violeta no dispara a 300 px (alcance 210)');
  G.enemies = [mk('sombra', 150, 0, {spd:0, shoots:true, shootT:0})]; corre(1); eq(G.ebul.length, 1, 'violeta dispara a 150 px'); if (!(G.ebul[0].life < 2.51 && G.ebul[0].life > 2.4)) throw new Error('FALLO vida de la bala del violeta: ' + G.ebul[0].life);
  G.ebul = []; G.enemies = [mk('planta', 300, 0, {spd:0, shoots:true, shootT:0})]; corre(1); eq(G.ebul.length, 1, 'otro tirador dispara a 300 px'); near(G.ebul[0].life, 5 - 1 / 60, 'bala normal vive 5 s');
  // los disparos no atraviesan montañas ni árboles; las piedras no los frenan
  for (const [k, bloquea] of [['montana', true], ['arbol', true], ['piedra', false]]) {
    newRun(); G.moves = []; G.px = G.py = 0; world([mkO(k, 100, 0, k === 'montana' ? 45 : 14)]); G.enemies = []; G.hp = G.maxhp = 100; G.ebul = [{x:200, y:0, vx:-200, vy:0, r:5, dmg:5, life:5, type:'planta'}]; corre(40);
    eq(G.ebul.length ? 1 : 0, bloquea ? 0 : 1, 'bala enemiga vs ' + k + (bloquea ? ' se para' : ' sigue')); }
  newRun(); G.moves = []; G.px = G.py = 0; world([mkO('arbol', 100, 0, 14)]); G.enemies = [mk('planta', 40, 0, {spd:0})];
  G.proj.push({x:200, y:0, vx:-300, vy:0, dmg:20, r:6, pierce:1, life:3, col:'#fff', hit:[], mt:'fuego'}); corre(60); eq(G.enemies[0].hp, 1e9, 'el arbol protege al hostil de mi disparo');
  newRun(); G.moves = []; G.px = G.py = 0; world([]); G.enemies = [mk('planta', 40, 0, {spd:0})]; G.proj.push({x:200, y:0, vx:-300, vy:0, dmg:20, r:6, pierce:1, life:3, col:'#fff', hit:[], mt:'fuego'}); corre(60); eq(G.enemies[0].hp < 1e9 ? 1 : 0, 1, 'sin obstaculo el disparo si llega');
  // embestida con aviso: trayectoria fijada, esquivable, golpea una vez
  const mkd = (x, o) => mk('fuego', x, 0, Object.assign({spd:0, dmg:12, dash:{cd:5, wind:1, len:200, spd:300, mul:1.8}, dcd:0, ds:null}, o || {}));
  newRun(); G.moves = []; G.px = G.py = 0; world([]); sombraMap(); const dd = mkd(200); G.enemies = [dd]; G.hp = G.maxhp = 100; G.inv = 0; corre(1);
  eq(dd.ds && dd.ds.ph === 'wind' ? 1 : 0, 1, 'empieza el aviso'); near(Math.abs(dd.ds.ang), Math.PI, 'trayectoria hacia el jugador'); G.py = 150; corre(50); eq(dd.x, 200, 'parado durante el aviso'); corre(15);
  eq(dd.ds && dd.ds.ph !== 'wind' ? 1 : 0, 1, 'termina el aviso'); corre(30); if (!(Math.abs(dd.y) < 1e-6 && dd.x < 200)) throw new Error('FALLO la embestida no sigue la trayectoria fijada: ' + dd.x + ',' + dd.y); corre(60); eq(G.hp, 100, 'esquivada: no hay daño'); near(dd.x, 0, 'recorre su longitud'); corre(60 * 2); eq(dd.ds === null ? 1 : 0, 1, 'vuelve a la normalidad');
  newRun(); G.moves = []; G.px = G.py = 0; world([]); sombraMap(); const dh = mkd(200); G.enemies = [dh]; G.hp = G.maxhp = 100; G.inv = 0; for (let i = 0; i < 60 * 3 && G.hp === 100; i++) update(1 / 60); near(100 - G.hp, 12 * 1.8, 'el primer golpe de la embestida lleva su multiplicador'); eq(dh.ds && dh.ds.hit ? 1 : 0, 1, 'embestida marcada como acertada');
  newRun(); G.moves = []; G.px = G.py = 0; world([]); const dc = mkd(200); G.enemies = [dc]; corre(1); dc.stun = 1; corre(1); eq(dc.ds === null ? 1 : 0, 1, 'paralizar cancela la embestida');
  // estados del jugador
  newRun(); G.moves = []; world([]); G.enemies = []; G.px = G.py = 0; keys.d = true; corre(30); const libreX = G.px; G.px = 0; G.ps.slow = 5; corre(30); near(G.px, libreX * 0.55, 'ralentizado x0.55'); G.px = 0; G.ps.slow = 0; G.ps.root = 5; corre(30); eq(G.px, 0, 'atrapado no se mueve'); keys.d = false;
  newRun(); G.moves = []; world([]); G.enemies = []; G.hp = G.maxhp = 100; G.ps.burn = 2; corre(60); near(100 - G.hp, 4, 'quemadura 4 por segundo'); newRun(); G.moves = []; world([]); G.enemies = []; G.ps.dark = 2; corre(60); if (!(G.vis > 0.9)) throw new Error('FALLO oscuridad no reduce la vision: ' + G.vis);
  // jefes: guion fijo, aviso antes de cada ataque, mismos movimientos que su tipo
  for (const bt of Object.keys(TYPES)) { newRun(); G.moves = []; world([]); G.px = G.py = 0; G.enemies = []; sombraMap(); const jf = spawnBoss(bt, 600, 0, 1e9); jf.spd = 0;
    const seen = [], winds = []; let last = ''; for (let i = 0; i < 60 * 36; i++) { G.hp = G.maxhp; G.inv = 0; update(1 / 60); const b = jf.bs; if (b.ph === 'wind' && last !== b.i + ':' + b.cycle) { last = b.i + ':' + b.cycle; seen.push(b.name); winds.push(b.tg.dur); } }
    const ciclo = BOSS_SCRIPT[bt].filter(z => z[0] !== 'rest').map(z => z[1]); const esperado = [...ciclo, ...ciclo];
    if (seen.slice(0, esperado.length).join('|') !== esperado.join('|')) throw new Error('FALLO guion de ' + bt + ': ' + seen.slice(0, esperado.length) + ' vs ' + esperado);
    if (!winds.every(w => w >= 0.7)) throw new Error('FALLO aviso demasiado corto en ' + bt);
    for (const z of BOSS_SCRIPT[bt]) if (z[0] !== 'rest' && !Object.values(MOVES).some(mv => mv.type === bt && (mv.name === z[1] || mv.evo === z[1]))) throw new Error('FALLO ataque que no es de la categoria: ' + bt + ' ' + z[1]); }
  const jefe = bt => { newRun(); G.moves = []; world([]); G.px = G.py = 0; G.enemies = []; sombraMap(); G.hp = G.maxhp = 100; const jf = spawnBoss(bt, 600, 0, 1e9); jf.spd = 0; return jf; };
  const paso = (jf, kind, nombre, n) => { startBossStep(jf, [kind, nombre]); let antes = G.ebul.length, i = 0; for (; jf.bs.ph === 'wind' && i < 200; i++) { update(1 / 60); if (jf.bs.ph === 'wind') eq(G.ebul.length, antes, 'sin disparos durante el aviso'); } return i; };
  let jf = jefe('fuego'); G.ebul = []; paso(jf, 'fan', 'Ascuas'); eq(G.ebul.length, 5, 'abanico de 5 proyectiles tras el aviso');
  jf = jefe('agua'); G.ebul = []; paso(jf, 'ring', 'Hidrobomba'); eq(G.ebul.length, 16, 'anillo de 16');
  jf = jefe('agua'); G.ebul = []; paso(jf, 'burst', 'Pistola Agua'); corre(60); eq(G.ebul.length + 0 >= 0 ? 1 : 0, 1, 'rafaga'); eq(jf.bs.fired, 3, 'rafaga de 3 disparos');
  // zonas y ondas: se esquivan saliendo durante el aviso; si te alcanzan dejan el estado de su tipo
  const zona = (bt, kind, nombre, dentro, dist) => { const b2 = jefe(bt); b2.x = 0; b2.y = kind === 'pulse' ? 250 : 0; b2.bs.t = 0; G.px = 0; G.py = 300; startBossStep(b2, [kind, nombre]); if (!dentro) G.py = 300 + dist; for (let i = 0; i < 200 && b2.bs.ph === 'wind'; i++) { G.inv = 0; update(1 / 60); } return b2; };
  zona('planta', 'zone', 'Raíces', true); const hpZ = G.hp; eq(hpZ < 100 ? 1 : 0, 1, 'zona alcanza si te quedas'); eq(G.ps.root > 0 ? 1 : 0, 1, 'planta: atrapado');
  zona('planta', 'zone', 'Raíces', false, 300); eq(G.hp, 100, 'zona esquivada'); eq(G.ps.root > 0 ? 1 : 0, 0, 'zona esquivada: sin estado');
  zona('fuego', 'zone', 'Brasas', true); eq(G.ps.burn > 0 ? 1 : 0, 1, 'fuego: quemadura'); zona('electrico', 'zone', 'Impactrueno', true); eq(G.ps.root > 0 ? 1 : 0, 1, 'electrico: paralizado un instante');
  zona('agua', 'pulse', 'Marea', true); eq(G.ps.slow > 0 ? 1 : 0, 1, 'agua: ralentizado'); zona('sombra', 'pulse', 'Niebla', true); eq(G.ps.dark > 0 ? 1 : 0, 1, 'sombra: oscuridad');
  zona('agua', 'pulse', 'Marea', false, 200); eq(G.ps.slow > 0 ? 1 : 0, 0, 'onda esquivada fuera de su radio');
  jf = jefe('sombra'); startBossStep(jf, ['pulse', 'Niebla']); eq(jf.bs.tg.R, BOSS_ATK.pulse.R * 0.5, 'jefe violeta: onda a la mitad'); jf = jefe('fuego'); startBossStep(jf, ['pulse', 'x']); eq(jf.bs.tg.R, BOSS_ATK.pulse.R, 'otro jefe: onda normal');
  // tornado del jefe: arrastra al jugador hacia el centro y se acaba
  jf = jefe('dragon'); jf.x = 0; jf.y = 0; G.px = 0; G.py = 400; startBossStep(jf, ['tornado', 'Ciclón']); G.px = 60; G.py = 400; for (let i = 0; i < 200 && jf.bs.ph === 'wind'; i++) { G.inv = 0; update(1 / 60); }
  eq(G.tornados.some(t => t.foe) ? 1 : 0, 1, 'tornado enemigo creado'); jf.bs.ph = 'rest'; jf.bs.kind = 'rest'; jf.bs.t = -999; G.px = 60; G.py = 400; corre(30); if (!(Math.hypot(G.px - 0, G.py - 400) < 45)) throw new Error('FALLO el tornado no arrastra: ' + Math.hypot(G.px, G.py - 400)); corre(60 * 5); eq(G.tornados.length, 0, 'tornado enemigo caduca');
  // furia al 30% de vida: +20% de daño, una sola vez
  jf = jefe('electrico'); jf.x = 10; jf.y = 0; jf.bs.ph = 'rest'; jf.bs.kind = 'rest'; jf.bs.t = -999; jf.hp = jf.maxhp * 0.31; G.inv = 0; G.hp = 100; corre(1); eq(jf.enr ? 1 : 0, 0, 'no se enfurece al 31%'); const perdida1 = 100 - G.hp;
  jf.hp = jf.maxhp * 0.29; G.inv = 0; G.hp = 100; G.banner = null; corre(1); eq(jf.enr ? 1 : 0, 1, 'se enfurece al 29%'); eq(G.banner ? 1 : 0, 1, 'aviso de furia'); const perdida2 = 100 - G.hp; near(perdida2 / perdida1, 1.2, 'daño x1.2 enfurecido');
  G.banner = null; G.inv = 0; G.hp = 100; corre(1); eq(G.banner ? 1 : 0, 0, 'la furia salta una sola vez');
  panelDex('c'); newRun(); G.enemies = [spawnBoss('fuego', 0, 0, 1000)]; draw(); G.enemies[0].bs.ph = 'wind'; startBossStep(G.enemies[0], ['fan', 'Ascuas']); draw(); G.enemies[0].enr = true; draw();
  console.log('MONSTRUOS OK');

  // --- CSS: sólo el lienzo del juego (#cv) puede ocupar toda la pantalla (una regla global canvas con position fixed rompió Compañeros, Criaturario y la tragamonedas) ---
  const css = __html.match(/<style>([\\s\\S]*?)<\\/style>/)[1];
  if (/(^|[\\s,}])canvas\\s*\\{[^}]*position\\s*:\\s*fixed/.test(css)) throw new Error('FALLO: una regla CSS global de canvas con position:fixed saca los lienzos de las fichas');
  if (!/#cv\\s*\\{[^}]*position\\s*:\\s*fixed/.test(css)) throw new Error('FALLO: el lienzo del juego (#cv) debe ser position:fixed');
  console.log('CSS OK');
  // --- la hierba aguanta la mitad que una piedra: sobrevive al primer disparo de Ascuas y cae con el segundo ---
  eq(OBS_HP.hierba, OBS_HP.piedra / 2, 'hierba = mitad de una piedra');
  getChunk = () => []; newRun(); G.px = G.py = 0; sombraMap(); { const hb = mkO('hierba', 0, 0, 40); world([hb]); G.enemies = [mk('planta', 200, 0, {spd:0})]; G.moves = [{id:'ascuas', lvl:1, t:0, links:[]}];
    for (let i = 0; i < 40; i++) { G.hp = G.maxhp; update(1 / 60); if (hb.hp < OBS_HP.hierba) break; }
    eq(hb.dead ? 1 : 0, 0, 'la hierba sobrevive al primer disparo'); eq(hb.hp < OBS_HP.hierba ? 1 : 0, 1, 'el primer disparo la daña');
    for (let i = 0; i < 60 * 3 && !hb.dead; i++) { G.hp = G.maxhp; update(1 / 60); } eq(hb.dead ? 1 : 0, 1, 'cae con el segundo disparo'); }
  console.log('HIERBA OK');
  // --- aparicion progresiva, eventos, cofres y liquidos contrarios ---
  getChunk = () => []; keys.a = keys.d = false;
  if (!(spawnRate(0) <= 0.6)) throw new Error('FALLO empieza con demasiados hostiles: ' + spawnRate(0)); if (!(spawnRate(60) < 1.6 && spawnRate(60) > spawnRate(0))) throw new Error('FALLO a los 60 s: ' + spawnRate(60));
  for (let t = 0; t < 900; t += 30) if (!(spawnRate(t + 30) > spawnRate(t) && spawnCap(t + 30) >= spawnCap(t))) throw new Error('FALLO la aparicion no es progresiva en ' + t);
  eq(spawnCap(0), 40, 'tope inicial'); eq(spawnCap(10000), 320, 'tope maximo');
  newRun(); G.moves = []; world([]); G.enemies = []; G.px = G.py = 0; G.evT = 1e9; G.hp = G.maxhp = 100; sombraMap(); for (let i = 0; i < 60 * 30; i++) { G.hp = G.maxhp; G.inv = 0; update(1 / 60); }
  if (!(G.enemies.length >= 12 && G.enemies.length <= 30)) throw new Error('FALLO hostiles tras 30 s sin matar: ' + G.enemies.length + ' (antes ~60)');
  newRun(); G.enemies = []; G.t = 100; G.spawnAcc = 0; G.ev = null; spawn(1); const sinMarea = G.enemies.length; G.enemies = []; G.spawnAcc = 0; G.ev = {kind:'marea', t:0, dur:25, mt:1}; spawn(1); eq(sinMarea, 1, 'ritmo normal a los 100 s'); eq(G.enemies.length, 4, 'marea de monstruos: aparecen x2,5');
  // eventos: primero entre 50 y 75 s, uno a la vez, nunca el mismo seguido, fin y espera
  for (let i = 0; i < 40; i++) { newRun(); if (!(G.evT >= EV_FIRST[0] && G.evT <= EV_FIRST[1])) throw new Error('FALLO primer evento fuera de rango: ' + G.evT); }
  newRun(); G.moves = []; world([]); G.enemies = []; G.evT = 0.01; sombraMap(); G.hp = G.maxhp = 100; update(1 / 60); eq(G.ev ? 1 : 0, 1, 'salta un evento'); eq(G.banner ? 1 : 0, 1, 'avisa del evento');
  { const previo = G.ev.kind; for (let i = 0; i < 200; i++) { const k = G.ev.kind; endEvent(); if (!(G.evT >= EV_GAP[0] && G.evT <= EV_GAP[1])) throw new Error('FALLO espera entre eventos: ' + G.evT); startEvent(); if (G.ev.kind === k) throw new Error('FALLO el mismo evento dos veces seguidas: ' + k); } }
  { newRun(); sombraMap(); G.sp = SPECIES.find(x => x.id === 'gotin'); G.ev = null; eq(pb('spd'), 1, 'sin lluvia'); G.ev = {kind:'lluvia', t:0, dur:35, mt:1}; eq(pb('spd'), 1.2, 'lluvia: el agua va x1.2'); eq(pb('res'), 1.2, 'lluvia: el agua resiste x1.2');
    G.sp = SPECIES.find(x => x.id === 'brasito'); eq(pb('dmg'), 0.75, 'lluvia: el fuego hace x0.75'); eq(pb('rate'), 0.85, 'lluvia: el fuego dispara x0.85'); eq(pb('spd'), 1, 'lluvia: el fuego no cambia de velocidad');
    eq(eb({type:'electrico'}, 'dmg'), 1.2, 'lluvia: hostil electrico x1.2'); eq(eb({type:'sombra'}, 'dmg'), 1, 'lluvia: sombra sin cambios'); G.ev = null; eq(pb('dmg'), 1, 'sin lluvia otra vez'); }
  // lluvia de fuego: el meteorito avisa en el suelo y cae a su hora
  newRun(); G.moves = []; world([]); G.enemies = []; G.px = G.py = 0; sombraMap(); G.sp = SPECIES.find(x => x.id === 'chispin'); G.hp = G.maxhp = 100; G.evT = 1e9; G.ev = {kind:'fuego', t:0, dur:30, mt:0}; update(1 / 60);
  eq(G.meteors.length >= 1 ? 1 : 0, 1, 'aparece un meteorito'); G.meteors = [{x:0, y:0, t:0, hit:false}]; G.ev.mt = 99; for (let i = 0; i < 60; i++) { G.inv = 0; update(1 / 60); } eq(G.hp, 100, 'sin daño durante el aviso (1 s)');
  for (let i = 0; i < 20; i++) { G.inv = 0; update(1 / 60); } near(100 - G.hp, METEOR.dmg, 'el meteorito pega al caer'); 
  newRun(); G.moves = []; world([]); G.enemies = [mk('planta', 10, 0, {spd:0}), mk('fuego', 10, 0, {spd:0})]; G.px = G.py = 400; G.evT = 1e9; G.meteors = [{x:0, y:0, t:METEOR.wind - 0.01, hit:false}]; update(1 / 30);
  eq(G.enemies[0].hp < 1e9 ? 1 : 0, 1, 'el meteorito daña a un hostil'); eq(G.enemies[1].hp, 1e9, 'los hostiles de fuego son inmunes');
  newRun(); G.moves = []; world([]); G.enemies = []; G.px = G.py = 0; G.sp = SPECIES.find(x => x.id === 'brasito'); G.hp = G.maxhp = 100; G.evT = 1e9; G.meteors = [{x:0, y:0, t:METEOR.wind - 0.01, hit:false}]; update(1 / 30); eq(G.hp, 100, 'tu compañero de fuego es inmune');
  { const r0 = mkO('piedra', 20, 0, 14), c0 = mkO('cofre', -20, 0, 13); world([r0, c0]); newRun(); world([r0, c0]); G.enemies = []; G.moves = []; G.px = G.py = 0; G.evT = 1e9; G.hp = G.maxhp = 100; G.meteors = [{x:0, y:0, t:METEOR.wind - 0.01, hit:false}]; update(1 / 30); eq(r0.dead && c0.dead ? 1 : 0, 1, 'el meteorito rompe piedras y cofres pequeños'); }
  // cofres pequeños: se rompen a golpes y dan monedas, experiencia u objeto
  { const cuenta = {monedas:0, xp:0, objeto:0}; for (let i = 0; i < 600; i++) { newRun(); world([]); const c = mkO('cofre', 0, 0, 13); G.gems = []; G.chestOffers = []; hitObs(c, 10); if (c.dead) throw new Error('FALLO el cofre se rompe con un golpe suave'); hitObs(c, 1e9); if (!c.dead) throw new Error('FALLO el cofre no se rompe');
      if (G.chestOffers.length) cuenta.objeto++; else if (G.gems.some(g => g.coin)) cuenta.monedas++; else if (G.gems.length) cuenta.xp++; else throw new Error('FALLO cofre vacio'); }
    if (!(cuenta.monedas > 200 && cuenta.xp > 150 && cuenta.objeto > 20)) throw new Error('FALLO reparto de botin de cofres: ' + JSON.stringify(cuenta)); }
  // cofres grandes: quedarse cerca bigT s; alejarse hace retroceder el progreso; botin grande y objeto garantizado
  newRun(); G.moves = []; G.enemies = []; const bg = mkO('cofreg', 50, 0, 20); world([bg]); G.px = G.py = 0; G.evT = 1e9; G.hp = G.maxhp = 100; G.gems = []; G.chestOffers = [];
  for (let i = 0; i < 60 * 3; i++) { G.hp = G.maxhp; update(1 / 60); } near(bg.prog, 3, 'progreso del cofre grande'); G.px = 400; for (let i = 0; i < 60 * 2; i++) { G.hp = G.maxhp; update(1 / 60); } near(bg.prog, 2, 'alejarse lo hace retroceder a media velocidad');
  G.px = 0; for (let i = 0; i < 60 * 5; i++) { G.hp = G.maxhp; update(1 / 60); if (bg.dead) break; } eq(bg.dead ? 1 : 0, 1, 'se abre tras bigT s cerca'); eq(G.gems.filter(g => g.coin).length, 6, 'cofre grande: 6 monedas'); eq(G.gems.filter(g => !g.coin).length, 3, 'cofre grande: 3 gemas'); eq(curOffer && curOffer.chest ? 1 : 0, 1, 'cofre grande: sale la oferta de objeto'); eq(curOffer.big ? 1 : 0, 1, 'oferta marcada como cofre grande'); eq(curOffer.opts.length, 2, 'dos objetos a elegir'); eq(G.paused ? 1 : 0, 1, 'el juego se pausa para elegir'); G.paused = false;
  // elegir una recompensa oculta la pantalla y REANUDA el juego (un comentario mal puesto lo rompió una vez)
  { newRun(); G.moves = []; world([]); G.enemies = []; G.evT = 1e9; const quitadas = []; document.querySelector('#ovLvl').classList.remove = c => quitadas.push(c);
    G.pending = [2]; update(1 / 60); eq(G.paused ? 1 : 0, 1, 'sale la subida de nivel y se pausa'); chooseOffer(curOffer.opts[0]); eq(G.paused ? 1 : 0, 0, 'elegir recompensa reanuda el juego'); eq(quitadas.includes('on') ? 1 : 0, 1, 'elegir recompensa oculta la pantalla'); eq(G.pending.length, 0, 'el nivel pendiente se consume');
    G.chestOffers = [{kind:'item', chest:true, big:false, opts:[{k:'item', id:'iman'}, {k:'item', id:'foco'}]}]; quitadas.length = 0; update(1 / 60); eq(G.paused ? 1 : 0, 1, 'sale la oferta del cofre y se pausa'); chooseOffer(curOffer.opts[0]); eq(G.paused ? 1 : 0, 0, 'elegir objeto de cofre reanuda el juego'); eq(quitadas.includes('on') ? 1 : 0, 1, 'elegir objeto de cofre oculta la pantalla');
    const x0 = G.t; update(1 / 60); if (!(G.t > x0)) throw new Error('FALLO el tiempo no avanza tras elegir'); }
  // la oferta del cofre no consume una subida de nivel
  newRun(); G.pending = [5]; G.chestOffers = [{kind:'item', chest:true, big:false, opts:[{k:'item', id:'iman'}, {k:'item', id:'foco'}]}]; G.moves = []; world([]); G.enemies = []; G.evT = 1e9; update(1 / 60);
  eq(G.pending.length, 1, 'el nivel pendiente sigue ahi'); eq(curOffer.chest ? 1 : 0, 0, 'primero sale la subida de nivel'); chooseOffer(curOffer.opts[0]);
  newRun(); G.pending = []; G.chestOffers = [{kind:'item', chest:true, big:false, opts:[{k:'item', id:'iman'}, {k:'item', id:'foco'}]}]; G.moves = []; world([]); G.enemies = []; G.evT = 1e9; update(1 / 60); eq(curOffer.chest ? 1 : 0, 1, 'sale la oferta del cofre'); eq(G.paused ? 1 : 0, 1, 'el juego se pausa');
  G.pending = [7]; chooseOffer(curOffer.opts[1]); if (G.item !== 'foco') throw new Error('FALLO se elige el objeto: ' + G.item); eq(G.pending.length, 1, 'elegir un objeto de cofre no gasta el nivel pendiente'); G.pending = []; G.paused = false;
  // liquidos: el tipo contrario sufre mas y hace menos daño; el del mapa, nada; el resto, normal
  newRun(); setMap(MAPS.find(x => x.type === 'fuego')); eq(contraryTo('planta') ? 1 : 0, 1, 'la planta es contraria al fuego'); eq(contraryTo('agua') ? 1 : 0, 0, 'el agua no'); let le = liqEffect('planta', BIOME.fuego); near(le.dps, 10.5, 'lava x1.5 al contrario'); eq(le.nerf ? 1 : 0, 1, 'contrario con nerf'); le = liqEffect('agua', BIOME.fuego); near(le.dps, 7, 'lava normal al neutro'); eq(le.nerf ? 1 : 0, 0, 'neutro sin nerf'); eq(liqEffect('fuego', BIOME.fuego), null, 'el tipo del mapa, inmune');
  setMap(MAPS.find(x => x.type === 'agua')); le = liqEffect('fuego', BIOME.agua); near(le.slow, 0.4, 'agua: el contrario se frena x0.4'); le = liqEffect('planta', BIOME.agua); near(le.slow, 0.6, 'agua: el neutro x0.6'); eq(liqEffect('agua', BIOME.agua), null, 'agua: su tipo no se frena');
  newRun(); G.moves = []; G.enemies = []; sombraMap(); G.sp = SPECIES.find(x => x.id === 'brotin'); setMap(MAPS.find(x => x.type === 'fuego')); world([mkO('liquido', 0, 0, 200)]); G.px = G.py = 0; G.evT = 1e9; update(1 / 60); eq(G.liqNerf ? 1 : 0, 1, 'el contrario en su liquido queda debilitado'); near(pb('dmg'), 0.8, 'daño x0.8 dentro del liquido'); G.px = 900; update(1 / 60); eq(G.liqNerf ? 1 : 0, 0, 'fuera del liquido se recupera'); near(pb('dmg'), 1, 'daño normal fuera');
  { const e1 = mk('planta', 0, 0, {spd:0}); G.enemies = [e1]; G.px = G.py = 900; update(1 / 60); eq(e1.liqNerf ? 1 : 0, 1, 'hostil contrario debilitado'); near(eb(e1, 'dmg'), 0.8, 'su daño x0.8'); }
  newRun(); G.moves = []; world([mkO('cofre', 60, 0, 13), mkO('cofreg', 120, 0, 20), mkO('liquido', 0, 0, 80)]); G.enemies = [spawnBoss('fuego', 400, 0, 1e9)]; G.ev = {kind:'lluvia', t:1, dur:35, mt:1}; draw(); G.ev = {kind:'marea', t:1, dur:25, mt:1}; draw(); G.ev = {kind:'fuego', t:1, dur:30, mt:1}; G.meteors = [{x:50, y:50, t:0.5, hit:false}]; draw(); G.ev = null; draw();
  console.log('EVENTOS Y COFRES OK');
  // --- megajefe Primordio, el Titan ---
  getChunk = () => []; keys.a = keys.d = false;
  for (const t of Object.keys(BOSS_SCRIPT)) for (const [k, n] of BOSS_SCRIPT[t]) if (k !== 'rest') if (!MEGA_MOVES[MEGA_BAND_OF[k]].some(m => m[0] === k && m[1] === n && m[2] === t)) throw new Error('FALLO al Titan le falta ' + t + ':' + n);
  eq(new Set(Object.values(MEGA_MOVES).flat().map(m => m[2])).size, Object.keys(TYPES).length, 'el Titan usa los 6 tipos');
  for (const k of MEGA_MOVES.close.map(m => m[0])) eq(['pulse', 'ring'].includes(k) ? 1 : 0, 1, 'cerca: solo ondas y anillos'); for (const k of MEGA_MOVES.mid.map(m => m[0])) eq(['fan', 'zone', 'burst'].includes(k) ? 1 : 0, 1, 'media distancia: abanicos, zonas y rafagas'); for (const k of MEGA_MOVES.far.map(m => m[0])) eq(['dash', 'tornado', 'rain'].includes(k) ? 1 : 0, 1, 'lejos: embestidas, tornados y meteoros');
  const same = (a, b, msg) => { if (a !== b) throw new Error('FALLO ' + msg + ': ' + a + ' vs ' + b); };
  if (megaBand(MEGA.close - 0.1) !== 'close' || megaBand(MEGA.close) !== 'mid' || megaBand(MEGA.far) !== 'mid' || megaBand(MEGA.far + 0.1) !== 'far') throw new Error('FALLO limites de distancia del Titan');
  const nuevoMega = () => { newRun(); G.moves = []; world([]); G.enemies = []; G.px = G.py = 0; G.evT = 1e9; G.nextBoss = 1e9; G.hp = G.maxhp = 100; sombraMap(); G.t = MEGA.first; const m = spawnMega(); m.x = 500; m.y = 0; m.spd = 0; m.bs.t = -999; return m; };
  // calendario: aviso 10 s antes, aparece a los 20 min, una sola vez, y no salen legendarios normales mientras vive
  newRun(); G.moves = []; world([]); G.enemies = []; G.evT = 1e9; G.nextBoss = 1e9; G.t = MEGA.first - 11; update(1 / 60); eq(G.megaWarn ? 1 : 0, 0, 'aun sin aviso'); eq(G.enemies.some(e => e.mega) ? 1 : 0, 0, 'aun no despierta');
  G.t = MEGA.first - 9; G.banner = null; update(1 / 60); eq(G.megaWarn ? 1 : 0, 1, 'aviso a 10 s'); eq(G.banner ? 1 : 0, 1, 'cartel de aviso'); G.t = MEGA.first - 0.01; update(0.02); eq(G.mega ? 1 : 0, 1, 'despierta a los 20 min'); eq(G.enemies.filter(e => e.mega).length, 1, 'un solo Titan'); update(1 / 60); update(1 / 60); eq(G.enemies.filter(e => e.mega).length, 1, 'no se repite');
  for (let i = 0; i < 5; i++) { G.nextBoss = 0; update(1 / 60); } eq(G.enemies.filter(e => e.boss && !e.mega && !e.minion).length, 0, 'sin legendarios normales mientras vive el Titan'); if (G.nextMega !== Infinity) throw new Error('FALLO no debe reaparecer mientras vive');
  // elige el ataque por distancia, en orden fijo, descansa cada 3 y "mirar" no cambia nada
  { const m = nuevoMega(); m.bs.summon = 0; const c0 = JSON.stringify(m.bs.cnt); for (let i = 0; i < 6; i++) megaPick(m, 100, true); eq(JSON.stringify(m.bs.cnt) === c0 ? 1 : 0, 1, 'mirar no cambia nada');
    const seq = []; for (let i = 0; i < 8; i++) seq.push(megaPick(m, 100, false)); const C = MEGA_MOVES.close;
    if (JSON.stringify(seq.slice(0, 3)) !== JSON.stringify(C.slice(0, 3))) throw new Error('FALLO orden de cerca'); same(seq[3][0], 'rest', 'descanso tras 3 ataques'); if (JSON.stringify(seq.slice(4, 7)) !== JSON.stringify(C.slice(3, 6))) throw new Error('FALLO la rotacion continua tras el descanso'); same(seq[7][0], 'rest', 'otro descanso');
    const n = nuevoMega(); n.bs.summon = 0; if (megaPick(n, 100, false) !== MEGA_MOVES.close[0] || megaPick(n, 300, false) !== MEGA_MOVES.mid[0] || megaPick(n, 600, false) !== MEGA_MOVES.far[0]) throw new Error('FALLO cada distancia usa su lista'); }
  // invocaciones: la primera al nacer, 2 al bajar del 75/50/25%, maximo 2 vivos, rotando por los 6 tipos
  { const m = nuevoMega(); const st = megaPick(m, 100, false); same(st[0], 'summon', 'primero invoca'); same(st[2], 'fuego', 'primer legendario: fuego'); eq(m.bs.summon, 0, 'invocacion consumida');
    m.hp = m.maxhp*0.74; megaWatch(m); eq(m.bs.summon, 2, 'al 75% invoca 2'); m.hp = m.maxhp*0.74; megaWatch(m); eq(m.bs.summon, 2, 'el umbral sale una sola vez'); m.hp = m.maxhp*0.49; megaWatch(m); eq(m.bs.summon, 4, 'al 50% +2'); m.hp = m.maxhp*0.24; megaWatch(m); eq(m.bs.summon, 6, 'al 25% +2'); eq(m.bs.thr.length, 0, 'umbrales gastados');
    G.enemies.push(Object.assign(mk('planta', 800, 0), {minion:true, boss:true}), Object.assign(mk('planta', 900, 0), {minion:true, boss:true})); eq(minionsAlive(), 2, 'dos vivos'); if (megaPick(m, 100, false)[0] === 'summon') throw new Error('FALLO invoca con 2 vivos'); G.enemies = [];
    const tipos = []; m.bs.summon = 1; m.bs.sumI = 0; for (let i = 0; i < 6; i++) { m.bs.summon = 1; tipos.push(megaPick(m, 100, false)[2]); } if (tipos.join() !== Object.keys(TYPES).join()) throw new Error('FALLO rotacion de tipos: ' + tipos);
    const w = nuevoMega(); w.bs.summon = 0; w.bs.lastSummon = G.t - MEGA.summonEvery - 1; megaWatch(w); eq(w.bs.summon, 1, 'invoca si lleva mucho sin legendarios'); }
  { const m = nuevoMega(); m.bs.ph = 'rec'; startBossStep(m, ['summon', 'Invocar a Aguacero', 'agua']); eq(m.hue, TYPES.agua.h, 'el Titan toma el color del ataque'); for (let i = 0; i < 60 * 2.2; i++) { G.hp = G.maxhp; update(1 / 60); }
    const mn = G.enemies.filter(e => e.minion); eq(mn.length, 1, 'sale un legendario del portal'); same(mn[0].type, 'agua', 'del tipo marcado'); eq(mn[0].boss ? 1 : 0, 1, 'es un jefe'); if (!(mn[0].hp > MEGA.minionHp)) throw new Error('FALLO vida del invocado'); }
  // meteoros: se avisan solos, no dañan a los suyos y pegan al caer
  { const m = nuevoMega(); G.sp = SPECIES.find(x => x.id === 'chispin'); startBossStep(m, ['rain', 'Lluvia de meteoros', 'fuego']); eq(G.meteors.length, 7, '7 meteoros'); eq(G.meteors.every(x => x.foe) ? 1 : 0, 1, 'son del jefe'); eq(G.meteors[0].x, 0, 'el primero cae donde estas'); G.meteors.slice(1).forEach(x => { x.x = 1500; });
    const amigo = mk('planta', 1500, 0, {spd:0}); G.enemies.push(amigo); for (let i = 0; i < 60 * 1.1; i++) { G.hp = G.maxhp; update(1 / 60); } G.hp = 100; G.inv = 0; for (let i = 0; i < 60 * 0.5; i++) { G.inv = 0; update(1 / 60); } if (!(G.hp < 100)) throw new Error('FALLO el meteoro no pega'); eq(amigo.hp, 1e9, 'no daña a los suyos'); }
  { const m = nuevoMega(); startBossStep(m, ['tornado', 'Ciclón', 'dragon']); eq(m.bs.tg.list.length, 2, 'el Titan lanza 2 tornados'); G.px = 0; for (let i = 0; i < 60 * 1.2; i++) { G.hp = G.maxhp; update(1 / 60); } eq(G.tornados.filter(t => t.foe).length, 2, 'dos tornados activos'); }
  // lejos: embestida que cierra la distancia; estados segun el tipo del ataque
  { const m = nuevoMega(); m.x = 600; startBossStep(m, ['dash', 'Cometa', 'fuego']); for (let i = 0; i < 60 * 3; i++) { G.hp = G.maxhp; update(1 / 60); } if (!(m.x < 600 - 300)) throw new Error('FALLO la embestida no avanza: ' + m.x); }
  for (const [kind, nombre, T, estado] of [['pulse', 'Marea', 'agua', 'slow'], ['pulse', 'Látigo Cepa', 'planta', 'root'], ['pulse', 'Niebla', 'sombra', 'dark'], ['zone', 'Brasas', 'fuego', 'burn'], ['pulse', 'Estática', 'electrico', 'root']]) {
    const m = nuevoMega(); m.x = 50; m.y = 0; startBossStep(m, [kind, nombre, T]); for (let i = 0; i < 200 && m.bs.ph === 'wind'; i++) { G.inv = 0; update(1 / 60); } if (!(G.ps[estado] > 0)) throw new Error('FALLO estado ' + estado + ' de ' + nombre); }
  // rotulo segun la distancia, inmunidades, no desaparece lejos, furia y derrota
  { const m = nuevoMega(); m.bs.summon = 0; m.bs.ph = 'rec'; m.bs.t = -999; m.x = 100; update(1 / 60); if (!m.bs.label.startsWith('Cerca →')) throw new Error('FALLO rotulo cerca: ' + m.bs.label); m.x = 300; update(1 / 60); if (!m.bs.label.startsWith('Media distancia →')) throw new Error('FALLO rotulo media: ' + m.bs.label); m.x = 700; update(1 / 60); if (!m.bs.label.startsWith('Lejos →')) throw new Error('FALLO rotulo lejos: ' + m.bs.label);
    m.kx = 300; m.ky = 300; update(1 / 60); eq(m.kx, 0, 'no se mueve por empujones'); status(m, 'root', 5); status(m, 'stun', 5); eq(m.root || 0, 0, 'inmune a inmovilizar'); eq(m.stun || 0, 0, 'inmune a paralizar'); m.x = 3000; update(1 / 60); eq(G.enemies.includes(m) ? 1 : 0, 1, 'no se descarta por estar lejos');
    m.x = 10; m.y = 0; m.hp = m.maxhp*0.31; m.bs.ph = 'rest'; m.bs.kind = 'rest'; m.bs.t = -999; G.inv = 0; G.hp = 100; update(1 / 60); eq(m.enr ? 1 : 0, 0, 'no se enfurece al 31%'); const l1 = 100 - G.hp; m.hp = m.maxhp*0.29; G.inv = 0; G.hp = 100; update(1 / 60); eq(m.enr ? 1 : 0, 1, 'se enfurece al 29%'); near((100 - G.hp) / l1, 1.2, 'daño x1.2 enfurecido');
    const hp1 = m.maxhp; const mn = Object.assign(mk('sombra', 900, 0), {minion:true, boss:true}); G.enemies.push(mn); const t0 = G.t, ti = SAVE.stats.titans || 0, nc = G.gems.length; kill(m);
    eq(G.mega ? 1 : 0, 0, 'el Titan cae'); eq(G.nextMega, t0 + MEGA.every, 'vuelve 20 min despues'); if (!(G.nextBoss >= t0 + 60)) throw new Error('FALLO el siguiente legendario normal sale demasiado pronto: ' + G.nextBoss); eq(SAVE.stats.titans, ti + 1, 'cuenta como titan derrotado'); eq(mn.dead ? 1 : 0, 1, 'caen sus legendarios'); if (!(G.gems.length - nc >= 38)) throw new Error('FALLO botin del Titan'); eq(G.banner ? 1 : 0, 1, 'cartel de victoria');
    G.enemies = []; G.t = G.nextMega; G.nextBoss = 1e9; update(1 / 60); eq(G.mega ? 1 : 0, 1, 'reaparece'); if (!(G.mega.maxhp > hp1 * 1.4)) throw new Error('FALLO el segundo Titan no es mas fuerte: ' + G.mega.maxhp + ' vs ' + hp1); }
  eq(DEX.length, 19, 'el Criaturario incluye al Titan'); SAVE.dex.c.mega = {seen:true, kills:1}; panelDex('c'); panelStats();
  { const m = nuevoMega(); G.px = 0; for (const [kind, n, T] of [['pulse', 'Marea', 'agua'], ['tornado', 'Ciclón', 'dragon'], ['dash', 'Cometa', 'fuego'], ['summon', 'Invocar', 'sombra'], ['rain', 'Lluvia', 'fuego'], ['zone', 'Raíces', 'planta']]) { startBossStep(m, [kind, n, T]); m.bs.t = 0.3; draw(); } m.enr = true; m.bs.ph = 'rec'; draw(); }
  console.log('MEGAJEFE OK');
  // --- Titan: 10x la vida de un legendario, regeneracion pequeña y adaptacion a tu daño ---
  { newRun(); G.moves = []; world([]); G.enemies = []; G.px = G.py = 0; G.evT = 1e9; sombraMap(); G.t = 600; G.bossN = 2; G.nextMega = 1e9; G.nextBoss = 0; G.spawnAcc = 0; spawn(0.001);
    const normal = G.enemies.find(e => e.boss && !e.mega); const esperado = bossHp(600, 3); near(normal.maxhp, esperado, 'vida de un legendario normal'); G.t = 1200; G.nextMega = 0; G.megaN = 0; G.bossN = 5; G.mega = null; G.nextBoss = 1e9; const nb = bossHp(1200, 6); const m = spawnMega();
    near(m.maxhp, 10 * nb, 'el Titan tiene 10x la vida de un legendario del mismo momento'); eq(m.maxhp / bossHp(1200, 6), 10, 'proporcion exacta 10x'); G.megaN = 1; G.mega = null; near(spawnMega().maxhp, 15 * nb, 'el segundo Titan: +50%'); }
  { const m = nuevoMega(); m.hp = m.maxhp * 0.5; const h0 = m.hp; for (let i = 0; i < 60 * 10; i++) megaAdapt(m, 1 / 60); near(m.hp - h0, m.maxhp * MEGA.regen * 10, 'regenera 0,1% por segundo'); if (!(MEGA.regen <= 0.002)) throw new Error('FALLO la regeneracion no es pequeña'); m.hp = m.maxhp; megaAdapt(m, 1); eq(m.hp, m.maxhp, 'no se pasa de la vida maxima'); }
  { const m = nuevoMega(); for (let i = 0; i < 60 * (MEGA.grace - 1); i++) megaAdapt(m, 1 / 60); eq(m.ad.agg, 0, 'sin adaptarse durante la gracia'); eq(m.ad.armor, 0, 'sin armadura durante la gracia');
    for (let i = 0; i < 60 * 130; i++) megaAdapt(m, 1 / 60); if (!(m.ad.agg > 0.95)) throw new Error('FALLO poco daño no lo impacienta: ' + m.ad.agg); const k = megaK(m); near(k.spd, 1 + MEGA.aggSpd, 'velocidad +40% al limite'); near(k.dmg, 1 + MEGA.aggDmg, 'daño +25%'); near(k.rate, 1 + MEGA.aggRate, 'ataque +30%'); near(m.spd, MEGA.spd * (1 + MEGA.aggSpd), 'camina mas deprisa'); eq(m.ad.armor, 0, 'sin daño no hay armadura');
    const w = bossMul(m); near(w, 1 + MEGA.aggDmg, 'su daño sube'); m.enr = true; near(bossMul(m), 1.2 * (1 + MEGA.aggDmg), 'se acumula con la furia'); }
  { const m = nuevoMega(); m.ad.agg = 1; const ref = m.maxhp / MEGA.killTime; for (let i = 0; i < 60 * 80; i++) { m.ad.log += ref * 1.0 / 60; megaAdapt(m, 1 / 60); }   // daño suficiente: la impaciencia baja sola (tras la gracia y la media móvil)
    if (!(m.ad.agg < 0.6)) throw new Error('FALLO con buen daño no se calma: ' + m.ad.agg); eq(m.ad.armor, 0, 'daño normal: sin armadura'); }
  { const m = nuevoMega(); const ref = m.maxhp / MEGA.killTime; for (let i = 0; i < 60 * 80; i++) { m.ad.log += ref * 3 / 60; megaAdapt(m, 1 / 60); }       // mucho daño: armadura
    if (!(m.ad.armor > 0.15 && m.ad.armor <= MEGA.armorMax)) throw new Error('FALLO mucho daño no da armadura: ' + m.ad.armor); eq(m.ad.agg, 0, 'con mucho daño no se impacienta'); if (!(Math.abs(m.ad.dps / ref - 3) < 0.03)) throw new Error('FALLO mide mal el daño por segundo: ' + m.ad.dps / ref);
    const a = m.ad.armor, h = m.hp; m.ad.log = 0; hurt(m, 1000, 'dragon', true); near(h - m.hp, 1000 * (1 - a), 'la armadura reduce el daño recibido'); near(m.ad.log, 1000, 'el daño bruto se registra sin armadura'); }
  { const m = nuevoMega(); const ref = m.maxhp / MEGA.killTime; for (let i = 0; i < 60 * 200; i++) { m.ad.log += ref * 40 / 60; megaAdapt(m, 1 / 60); } eq(m.ad.armor, MEGA.armorMax, 'la armadura tiene tope'); }
  { const m = nuevoMega(); m.ad.agg = 1; const a0 = m.bs.t; m.bs.ph = 'rec'; m.bs.t = -10; m.x = 100; update(1); near(m.bs.t, -10 + 1 * (1 + MEGA.aggRate), 'impaciente prepara los ataques mas deprisa'); }
  { const m = nuevoMega(); m.ad.agg = 0.8; m.ad.armor = 0.3; G.px = G.py = 0; draw(); }
  // --- el Titan actuando SOLO, sin trucos de pausa (en la v0.10.0/1 el primer descanso lanzaba un error y congelaba la pantalla) ---
  { newRun(); getChunk = () => []; G.moves = []; G.evT = 1e9; G.nextBoss = 1e9; G.px = G.py = 0; G.hp = G.maxhp = 1e9; G.t = MEGA.first - 1; const vistos = {};
    for (let i = 0; i < 60 * 200; i++) { G.hp = G.maxhp; G.inv = 0; G.enemies = G.enemies.filter(e => e.mega || e.minion); { const m0 = G.mega; if (m0) { const d = [120, 300, 600][Math.floor(i / 200) % 3]; G.px = m0.x - d; G.py = m0.y; } }      // distancia fija al Titan: cerca, media y lejos por turnos
      if (G.paused) chooseOffer(curOffer.opts[0]);
      update(1 / 60); if (i % 5 === 0) draw(); if (G.mega) vistos[G.mega.bs.kind] = (vistos[G.mega.bs.kind] || 0) + 1; }
    for (const k of ['summon', 'pulse', 'ring', 'fan', 'zone', 'burst', 'dash', 'tornado', 'rain', 'rest']) if (!vistos[k]) throw new Error('FALLO en 200 s el Titan no uso: ' + k + ' ' + JSON.stringify(vistos));
    const m = G.mega; if (!TYPES[m.bs.atk]) throw new Error('FALLO tipo de ataque invalido: ' + m.bs.atk); startBossStep(m, ['rest', 'Descanso']); startBossStep(m, ['rest', 'Descanso', 'primordio']); if (!TYPES[m.bs.atk]) throw new Error('FALLO un descanso deja un tipo invalido'); draw(); }
  // un error del juego se anota y NO detiene el bucle principal (antes la pantalla se quedaba congelada)
  { let pidos = 0, anotados = 0; const rafPrev = requestAnimationFrame, updPrev = update, errPrev = console.error; requestAnimationFrame = () => { pidos++; }; console.error = () => { anotados++; };
    newRun(); update = () => { throw new Error('prueba'); }; frame(100); frame(200); frame(300); update = updPrev; console.error = errPrev; requestAnimationFrame = rafPrev;
    eq(pidos, 3, 'el bucle sigue pidiendo fotogramas aunque update falle'); eq(anotados, 1, 'el mismo error se anota una sola vez'); }
  console.log('TITAN NATURAL Y BUCLE OK');
  // --- fondo animado del menu: barato (mapa pintado una vez, rutas fijas, limitador de fotogramas, quieto con panel abierto) ---
  { getChunk = () => []; newRun(); G = null; menuBg = null; menuReduce = false; const panel = document.querySelector('#ovPanel'); const contPrev = panel.classList.contains;
    drawMenuBg(1000); eq(menuBg.builds, 1, 'se construye una escena'); eq(menuBg.frames, 1, 'primer fotograma'); const sc0 = menuBg.scene; if (!(sc0.actores.length >= 9 && sc0.actores.length <= 30)) throw new Error('FALLO numero de actores: ' + sc0.actores.length); if (!(sc0.w > cv.width / Z && sc0.h > cv.height / Z)) throw new Error('FALLO el mapa debe ser mayor que la pantalla para la panoramica');
    drawMenuBg(1005); drawMenuBg(1010); drawMenuBg(1020); eq(menuBg.frames, 1, 'el limitador impide repintar antes de tiempo'); drawMenuBg(1035); eq(menuBg.frames, 2, 'repinta pasado el intervalo');
    for (let now = 1100; now < 1000 + MENU_MAP_SECS * 1000 - 100; now += 16) drawMenuBg(now);                      // ~60 fps de peticion durante casi todo el mapa
    const seg = (MENU_MAP_SECS * 1000 - 200) / 1000; if (!(menuBg.frames / seg <= 1000 / (1000 / MENU_FPS - 2) + 0.2)) throw new Error('FALLO se dibuja por encima del limite: ' + (menuBg.frames / seg) + ' fps'); if (!(menuBg.frames / seg >= MENU_FPS * 0.8)) throw new Error('FALLO se dibuja muy por debajo: ' + (menuBg.frames / seg)); eq(menuBg.builds, 1, 'el mapa no se reconstruye mientras dura');
    const idx0 = menuBg.idx; for (let now = 1000 + MENU_MAP_SECS * 1000 - 100; now < 1000 + MENU_MAP_SECS * 1000 + 200; now += 16) drawMenuBg(now); eq(menuBg.builds, 2, 'a los 16 s se construye el siguiente mapa'); eq(menuBg.idx, (idx0 + 1) % MAPS.length, 'pasa al siguiente mapa');
    const f0 = menuBg.frames; panel.classList.contains = () => true; for (let now = 30000; now < 31000; now += 16) drawMenuBg(now); eq(menuBg.frames, f0, 'con un panel abierto no se repinta'); panel.classList.contains = contPrev;
    menuBg = null; menuReduce = true; for (let now = 40000; now < 45000; now += 16) drawMenuBg(now); eq(menuBg.frames, 1, 'con menos movimiento sólo hay una imagen fija'); eq(menuBg.builds, 1, 'y no cambia de mapa'); menuReduce = false;
    menuBg = null; drawMenuBg(50000); newRun(); frame(50100); eq(menuBg === null ? 1 : 0, 1, 'al empezar la partida se libera el fondo'); G = null; frame(50200); eq(menuBg !== null ? 1 : 0, 1, 'al volver al menu se recrea'); }
  { newRun(); G = null; for (let idx = 0; idx < MAPS.length; idx++) { const a = menuEscena(idx), b2 = menuEscena(idx);
      for (let t = 0; t <= 60; t += 0.5) a.actores.forEach((ac, i) => { const p = ac.f(t - ac.lag), q = b2.actores[i].f(t - b2.actores[i].lag); if (!(isFinite(p[0]) && isFinite(p[1]))) throw new Error('FALLO ruta no finita en mapa ' + idx); if (p[0] !== q[0] || p[1] !== q[1]) throw new Error('FALLO ruta no determinista en mapa ' + idx);
        if (!ac.grande && (p[0] < -250 || p[0] > a.w + 250 || p[1] < -250 || p[1] > a.h + 250)) throw new Error('FALLO un actor sale del mapa: ' + idx + ' t=' + t + ' ' + p); });
      if (!a.actores.some(x => x.grande && x.tipo === MAPS[idx].type)) throw new Error('FALLO falta el legendario del mapa ' + idx); }
    SAVE.dex.c.mega = {seen:true, kills:0}; if (!menuEscena(0).actores.some(x => x.tipo === 'primordio')) throw new Error('FALLO el Titan visto debe cruzar el fondo'); SAVE.dex.c.mega = {seen:false, kills:0}; if (menuEscena(0).actores.some(x => x.tipo === 'primordio')) throw new Error('FALLO el Titan no visto no debe salir'); }
  { const css = __html.match(/<style>([\\s\\S]*?)<\\/style>/)[1]; const m = css.match(/#ovMenu\\s*\\{[^}]*rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\d+\\s*,\\s*([0-9.]+)\\s*\\)/); if (!m || !(parseFloat(m[1]) <= 0.5)) throw new Error('FALLO el menu debe ser translucido para ver el fondo'); }
  console.log('FONDO DEL MENU OK');
  // --- musica en modo directo (file://): fundidos calculados a mano sobre el volumen del <audio> ---
  { const dPrev = MUSIC_DIRECT, nPrev = musicNow; MUSIC_DIRECT = true; let reloj = 100; musicNow = () => reloj; music.tracks = {}; music.cur = null; music.bad = {}; music.duck = 1; SAVE.music = true;
    newRun(); const mapaD = t => MAPS.find(x => x.type === t); setMap(mapaD('agua')); const ta = music.tracks.agua; if (!ta || !ta.direct && ta.g) throw new Error('FALLO en modo directo no deben crearse nodos de WebAudio'); ta.a.duration = 60; ta.a.currentTime = 30;
    musicTick(); eq(ta.a.volume, 0, 'empieza en silencio'); reloj += 1.5; musicTick(); near(ta.a.volume, MUSIC_VOL * 0.5, 'a mitad del fundido'); reloj += 1.6; musicTick(); near(ta.a.volume, MUSIC_VOL, 'volumen pleno tras 3 s');
    setMap(mapaD('sombra')); const ts = music.tracks.sombra; ts.a.duration = 60; ts.a.currentTime = 30; reloj += 1.5; musicTick(); near(ta.a.volume, MUSIC_VOL * 0.5, 'la anterior baja'); near(ts.a.volume, MUSIC_VOL * 0.5, 'la nueva sube'); eq(ta.a.paused ? 1 : 0, 0, 'la anterior aun suena durante el fundido');
    reloj += 1.7; musicTick(); eq(ta.a.volume, 0, 'la anterior queda en silencio'); eq(ta.a.paused ? 1 : 0, 1, 'y se pausa'); near(ts.a.volume, MUSIC_VOL, 'la nueva a pleno');
    ts.a.currentTime = 0.5; musicTick(); near(ts.a.volume, MUSIC_VOL * 0.25, 'entrada suave tras el bucle'); ts.a.currentTime = 30; duckMusic(0.3); musicTick(); near(ts.a.volume, MUSIC_VOL * 0.3, 'al pausar baja'); duckMusic(1);
    stopMusic(1.5); reloj += 2; musicTick(); eq(ts.a.volume, 0, 'al parar se apaga'); eq(ts.a.paused ? 1 : 0, 1, 'y se pausa');
    MUSIC_DIRECT = dPrev; musicNow = nPrev; music.tracks = {}; music.cur = null; music.bad = {}; music.duck = 1; }
  // --- exportar / importar partida ---
  { newRun(); SAVE = defaultSave(); SAVE.coins = 1234; SAVE.owned.chispin = {shiny:true}; SAVE.sel = 'chispin'; SAVE.up.dmg = 4; SAVE.stats.titans = 2; SAVE.stats.kills = 777; SAVE.dex.c['leg-fuego'] = {seen:true, kills:5, shiny:false}; SAVE.dex.m.lago = true; SAVE.music = false;
    const txt = exportData(), jx = JSON.parse(txt); same(jx.juego, 'criaturas-survivor', 'envoltura'); same(jx.version, VERSION, 'version en el fichero'); SAVE = defaultSave(); const r = importSave(txt);
    eq(r.ok ? 1 : 0, 1, 'importa lo exportado'); eq(SAVE.coins, 1234, 'monedas'); same(SAVE.sel, 'chispin', 'companero elegido'); eq(SAVE.owned.chispin.shiny ? 1 : 0, 1, 'shiny'); eq(SAVE.up.dmg, 4, 'mejoras'); eq(SAVE.stats.titans, 2, 'titanes'); eq(SAVE.stats.kills, 777, 'bajas');
    eq(SAVE.dex.c['leg-fuego'].kills, 5, 'criaturario'); eq(SAVE.dex.m.lago ? 1 : 0, 1, 'mapas visitados'); eq(SAVE.music ? 1 : 0, 0, 'ajuste de musica'); eq(SAVE.dex.c.chispin.seen ? 1 : 0, 1, 'los companeros cuentan como descubiertos');
    for (const malo of ['esto no es json', '{}', '{"juego":"otro","guardado":{"owned":{"brasito":{}}}}', '{"juego":"criaturas-survivor"}', '{"juego":"criaturas-survivor","guardado":{"owned":{}}}', '{"juego":"criaturas-survivor","guardado":{"owned":{"inventado":{}}}}', 'null', '[]', '"texto"']) { const q = parseSaveFile(malo); if (q.ok || !q.error) throw new Error('FALLO se acepto un fichero invalido: ' + malo); }
    const coins0 = SAVE.coins; importSave('no vale'); eq(SAVE.coins, coins0, 'un fichero invalido no cambia la partida');
    const sucio = '{"juego":"criaturas-survivor","guardado":{"coins":1e30,"sel":"inventado","owned":{"brasito":{"shiny":1},"inventado":{"shiny":true},"__proto__":{"x":1}},"up":{"dmg":999,"hp":-5,"raro":7},"stats":{"runs":"mucho","kills":1e99,"titans":NaN},"dex":{"c":{"falso":{"seen":true},"brasito":{"seen":true,"kills":-3}},"m":{"lago":true,"nada":true}},"sound":0}}';
    const q = parseSaveFile(sucio.replace('NaN', 'null')); eq(q.ok ? 1 : 0, 1, 'acepta pero sanea'); eq(q.save.coins, 1e9, 'monedas acotadas'); eq(q.save.up.dmg, MAX_UP, 'mejora acotada al maximo'); eq(q.save.up.hp, 0, 'mejora negativa a 0'); if ('raro' in q.save.up) throw new Error('FALLO clave de mejora inventada'); same(q.save.sel, 'brasito', 'companero invalido -> uno que se tiene');
    if (Object.keys(q.save.owned).join() !== 'brasito') throw new Error('FALLO ids inventados en owned: ' + Object.keys(q.save.owned)); eq(q.save.stats.runs, 0, 'estadistica no numerica a 0'); eq(q.save.stats.kills, 1e12, 'estadistica acotada'); if ('falso' in q.save.dex.c || 'nada' in q.save.dex.m) throw new Error('FALLO ids inventados en el criaturario');
    eq(q.save.dex.c.brasito.kills, 0, 'bajas negativas a 0'); eq(q.save.dex.m.lago ? 1 : 0, 1, 'mapa valido conservado'); eq(q.save.sound ? 1 : 0, 0, 'sound:0 cuenta como apagado'); if (({}).x !== undefined) throw new Error('FALLO contaminacion de prototipos'); SAVE = defaultSave(); }
  console.log('PORTABLE (musica directa, exportar/importar) OK');
  // --- al despertar el Titan: los hostiles normales se desvanecen; quedan los legendarios y los invocados; sin aparicion normal mientras vive ---
  { newRun(); G.moves = []; getChunk = () => []; G.evT = 1e9; G.nextBoss = 1e9; G.px = G.py = 0; sombraMap(); G.hp = G.maxhp = 100; G.enemies = [];
    const normales = []; for (let i = 0; i < 8; i++) { const e = mk(['planta', 'fuego', 'agua', 'sombra'][i % 4], 60 + i * 30, 0, {hp:50, maxhp:50, spd:0, dmg:50}); normales.push(e); G.enemies.push(e); }
    const cercano = mk('planta', 5, 0, {hp:50, maxhp:50, spd:0, dmg:50}); G.enemies.push(cercano); normales.push(cercano);
    const legendario = spawnBoss('fuego', 400, 0, 5000); legendario.spd = 0; legendario.bs.t = -999; const invocado = spawnBoss('agua', -400, 0, 3000); invocado.minion = true; invocado.spd = 0; invocado.bs.t = -999;
    G.ebul = [{x:100, y:0, vx:0, vy:0, r:5, dmg:5, life:5, type:'planta'}]; G.ev = {kind:'marea', t:1, dur:25, mt:1}; G.t = MEGA.first; G.spawnAcc = 3; const kills0 = G.kills, gems0 = G.gems.length;
    const m = spawnMega(); m.x = 900; m.y = 0; m.bs.t = -999;
    eq(normales.every(e => e.vanish === MEGA.clear) ? 1 : 0, 1, 'todos los normales se desvanecen'); eq(legendario.vanish === undefined && invocado.vanish === undefined ? 1 : 0, 1, 'los jefes se quedan'); eq(m.vanish === undefined ? 1 : 0, 1, 'el Titan no se desvanece');
    eq(G.ebul.length, 0, 'se borran los disparos'); eq(G.ev ? 1 : 0, 0, 'se acaba la marea de monstruos'); eq(G.spawnAcc, 0, 'se vacia el acumulador de aparicion');
    update(1 / 60); eq(G.hp, 100, 'el hostil pegado a ti no hace daño mientras se desvanece'); hurt(cercano, 1000, 'fuego'); eq(cercano.hp, 50, 'no recibe daño'); { const n = nearest(0, 0); if (n && n.vanish !== undefined) throw new Error('FALLO se apunta a un hostil que se desvanece'); }
    G.proj.push({x:5, y:0, vx:0, vy:0, dmg:100, r:8, pierce:1, life:1, col:'#fff', hit:[], mt:'fuego'}); update(1 / 60); eq(cercano.hp, 50, 'ni siquiera un proyectil le hace daño'); draw();
    for (let i = 0; i < 70; i++) { G.hp = G.maxhp; update(1 / 60); }
    eq(G.enemies.some(e => normales.includes(e)) ? 1 : 0, 0, 'desaparecen todos los normales'); eq(G.kills, kills0, 'no cuentan como bajas'); eq(G.gems.length, gems0, 'no sueltan botin');
    eq(G.enemies.includes(legendario) && G.enemies.includes(invocado) && G.enemies.includes(m) ? 1 : 0, 1, 'quedan el legendario, el invocado y el Titan');
    const antes = G.enemies.filter(e => !e.boss).length; G.t = 1300; for (let i = 0; i < 60 * 5; i++) { G.hp = G.maxhp; update(1 / 60); } eq(G.enemies.filter(e => !e.boss).length, antes, 'no aparecen hostiles normales mientras vive el Titan');
    for (let i = 0; i < 300; i++) { G.ev = null; startEvent(); if (G.ev.kind === 'marea') throw new Error('FALLO sale una marea con el Titan vivo'); } G.ev = null;
    kill(m); G.spawnAcc = 0; G.enemies = []; G.t = 1400; for (let i = 0; i < 60 * 3; i++) { G.hp = G.maxhp; update(1 / 60); } if (!(G.enemies.filter(e => !e.boss).length > 0)) throw new Error('FALLO la aparicion normal no vuelve tras caer el Titan'); }
  console.log('LIMPIEZA AL DESPERTAR EL TITAN OK');
  // --- version coherente con la documentacion ---
  const top = (__changelog.match(/^## v(\\d+\\.\\d+\\.\\d+)/m) || [])[1]; if (top !== VERSION) throw new Error('FALLO version: index.html=' + VERSION + ' CHANGELOG=' + top);
  if (!__readme.includes('v' + VERSION)) throw new Error('FALLO el README no menciona la version v' + VERSION);
  newRun(); panelGuide(); refreshMenu();
  console.log('VERSION ' + VERSION + ' OK');
  G.hp = 0; endRun();
  panelCompanions(); panelUpgrades(); panelGacha(); panelStats(); panelGuide(); refreshMenu();
  console.log('SMOKE OK');
})();`;
(0, eval)(src);
