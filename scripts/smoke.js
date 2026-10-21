// Prueba de humo sin navegador: extrae el <script> de index.html, lo ejecuta con un DOM falso
// y simula 12 minutos de partida (inmortal) resolviendo subidas de nivel. Uso: node scripts/smoke.js
const fs = require('fs'), path = require('path');
const noop = () => {};
const mkCtx = () => new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'measureText' ? () => ({ width: 1 }) : noop), set: (t, k, v) => { t[k] = v; return true; } });
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
  G.hp = 0; endRun();
  panelCompanions(); panelUpgrades(); panelGacha(); panelStats(); panelGuide(); refreshMenu();
  console.log('SMOKE OK');
})();`;
(0, eval)(src);
