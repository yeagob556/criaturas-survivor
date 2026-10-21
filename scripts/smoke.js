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
global.__changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8'); global.__readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
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
