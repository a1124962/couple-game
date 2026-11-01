/* engine.js — 完整冒险引擎（全局函数，ES2020，无 import/export） */

function advInit() { return { phase: 'classSelect', act: 1, seed: (Date.now() % 1000000000) || 1, rngState: (Date.now() % 1000000000) || 1, pick: { host: null, guest: null, ready: { host: false, guest: false } }, players: { host: null, guest: null }, bond: 30, gold: 30, flags: [], npcAff: {}, npcMet: {}, seenEvents: [], map: { floors: [], cur: null, visited: [] }, votes: { host: null, guest: null }, event: { id: null, resultText: null, done: false, summary: null, chooser: null }, npc: { id: null, meeting: 0, node: 'start', lastText: null, ended: false, lastChoice: null, summary: null }, combat: null, draft: { host: [], guest: [], shared: [], picked: { host: false, guest: false, shared: false } }, shop: { items: [], line: null }, rest: { done: { host: false, guest: false }, text: null }, bondSkills: [], bondPassives: [], log: [], ending: null, stats: { kills: 0, turns: 0, nodes: 0, cardsTaken: 0, bossWon: false, firstStarDefeated: false }, secretBoss: false, pendingCombat: null, pendingDraft: null, afterDraft: null, meta: null }; }

function advRand(adv) { adv.rngState = (adv.rngState + 0x6D2B77B5) >>> 0; let t = adv.rngState; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function advPick(adv, arr) { if (!Array.isArray(arr) || arr.length === 0) return null; return arr[Math.floor(advRand(adv) * arr.length)]; }
function advText(s) { if (s == null) return ''; let host = '星旅者A', guest = '星旅者B'; try { if (typeof S !== 'undefined' && S && S.players) { if (S.players.host && S.players.host.name) host = S.players.host.name; if (S.players.guest && S.players.guest.name) guest = S.players.guest.name; } } catch (e) {} return String(s).replace(/\{A\}/g, host).replace(/\{B\}/g, guest); }
function advLog(adv, text) { if (!adv) return; if (!adv.log) adv.log = []; adv.log.push({ text: advText(text) }); if (adv.log.length > 50) adv.log = adv.log.slice(-50); }
function advBondAdd(adv, v) {
  v = v || 0;
  let cur = adv.bond || 0;
  if (v > 0) {
    if (cur >= 80) v = Math.floor(v * 0.3);
    else if (cur >= 60) v = Math.floor(v * 0.6);
  }
  adv.bond = Math.max(0, Math.min(100, cur + v));
}

function findSkill(id) { if (!id) return null; const GD = window.GAME_DATA || {}; if (Array.isArray(GD.classes)) { for (const c of GD.classes) { if (Array.isArray(c.skills)) { const s = c.skills.find(x => x.id === id); if (s) { const o = Object.assign({}, s); o.cls = c.id; return o; } } } } const pool = [].concat(GD.cards || [], GD.bondCards || []); const found = pool.find(x => x.id === id && (x.type === 'skill' || x.type === 'evolve')); if (found) { const o = Object.assign({}, found); if (!o.cls) o.cls = found.cls || 'bond'; return o; } return null; }
function alive(adv) { const GD = window.GAME_DATA || {}; if (adv && adv.combat && Array.isArray(adv.combat.enemies)) { return adv.combat.enemies.filter(e => e.hp > 0); } return []; }
function reachable(adv) { if (!adv || !adv.map) return []; const cur = adv.map.cur; if (cur === null) return (adv.map.floors[0] || []).map(n => n.id); const node = (adv.map.floors || []).flat().find(n => n.id === cur); return node ? (node.next || []) : []; }
function hasReq(adv, req) { req = req || {}; if (req.cls) { const has = (adv.players.host && adv.players.host.cls === req.cls) || (adv.players.guest && adv.players.guest.cls === req.cls); if (!has) return false; } if (req.bondMin != null && adv.bond < req.bondMin) return false; if (req.gold != null && adv.gold < req.gold) return false; if (req.flag && !adv.flags.includes(req.flag)) return false; return true; }
function reqText(req) { req = req || {}; const parts = []; if (req.cls) { const names = { blade: '星刃', warden: '守夜人', weaver: '织梦师', seer: '观星者' }; parts.push('需要 ' + (names[req.cls] || req.cls)); } if (req.bondMin != null) parts.push('羁绊≥' + req.bondMin); if (req.gold != null) parts.push('星砂≥' + req.gold); if (req.flag) parts.push('标记 ' + req.flag); return parts.join(' · '); }
function effectSummary(effects) { if (!Array.isArray(effects)) return ''; const names = { dmg: '伤害', block: '护盾', heal: '治疗', status: '状态', energy: '能量', draw: '抽卡', bond: '羁绊', gold: '星砂', hp: '生命', maxhp: '生命上限', card: '卡牌', flag: '标记', npc: '好感', combat: '战斗', relic: '遗物' }; const parts = []; for (const e of effects) { const op = e.op; const v = e.v; if (op === 'bond') parts.push('羁绊 ' + (v > 0 ? '+' : '') + v); else if (op === 'gold') parts.push('星砂 ' + (v > 0 ? '+' : '') + v); else if (op === 'hp') parts.push('生命 ' + (v > 0 ? '+' : '') + v); else if (op === 'maxhp') parts.push('生命上限 ' + (v > 0 ? '+' : '') + v); else if (op === 'heal') parts.push('治疗 ' + v); else if (op === 'block') parts.push('护盾 ' + v); else if (op === 'energy') parts.push('能量 ' + (v > 0 ? '+' : '') + v); else if (op === 'dmg') parts.push('伤害 ' + v); else if (op === 'card') parts.push('获得卡牌'); else if (op === 'flag') parts.push('标记 ' + e.k); else if (op === 'npc') parts.push('好感 ' + (v > 0 ? '+' : '') + v); else if (op === 'combat') parts.push('触发战斗'); else if (names[op]) parts.push(names[op]); } return parts.join(' · '); }
function enemyIntent(adv, enemy, ahead) { ahead = ahead || 0; if (!enemy) return null; let intents = enemy.intents; if (enemy.phases && Array.isArray(enemy.phases)) { for (let i = enemy.phases.length - 1; i >= 0; i--) { if (enemy.maxhp > 0 && enemy.hp / enemy.maxhp <= enemy.phases[i].at) { intents = enemy.phases[i].intents; break; } } } if (!intents || !intents.length) return null; return intents[(enemy.ii + ahead) % intents.length]; }
function genMap(adv) { const floors = []; const makeNode = (floor, idx, type) => ({ id: `f${floor}n${idx}`, type, next: [] }); floors.push([makeNode(0, 0, 'battle'), makeNode(0, 1, 'battle')]); const weights = [['battle', 35], ['event', 25], ['npc', 12], ['elite', 8], ['shop', 8], ['rest', 7], ['treasure', 5]]; function pickType(floor) { const r = advRand(adv) * 100; let acc = 0; for (const [t, w] of weights) { if (floor === 1 && t === 'elite') continue; acc += w; if (r < acc) return t; } return 'battle'; } for (let f = 1; f <= 5; f++) { const count = 2 + (advRand(adv) < 0.5 ? 1 : 0); const nodes = []; for (let i = 0; i < count; i++) nodes.push(makeNode(f, i, pickType(f))); if (f === 3 && !nodes.some(n => n.type === 'npc')) nodes[0].type = 'npc'; if (f === 5 && !nodes.some(n => n.type === 'rest')) nodes[nodes.length - 1].type = 'rest'; if (f === 4 && !nodes.some(n => n.type === 'battle')) nodes[0].type = 'battle'; floors.push(nodes); } floors.push([makeNode(6, 0, 'boss')]); for (let f = 0; f < floors.length - 1; f++) { const cur = floors[f], nxt = floors[f + 1]; nxt.forEach((n) => { const from = cur[Math.floor(advRand(adv) * cur.length)]; if (!from.next.includes(n.id)) from.next.push(n.id); }); cur.forEach(n => { if (n.next.length === 0) { const pick = nxt[Math.floor(advRand(adv) * nxt.length)]; n.next.push(pick.id); } if (advRand(adv) < 0.45 && n.next.length < 2) { const cand = nxt[Math.floor(advRand(adv) * nxt.length)].id; if (!n.next.includes(cand)) n.next.push(cand); } }); } adv.map = { floors, cur: null, visited: [] }; }

function applyEffects(adv, effects, role) {
  if (!Array.isArray(effects)) return;
  const mePlayer = adv.players[role];
  const allyRole = role === 'host' ? 'guest' : 'host';
  const allyPlayer = adv.players[allyRole];
  function targetPlayers(t) {
    if (t === 'self') return mePlayer && !mePlayer.down ? [mePlayer] : [];
    if (t === 'ally') return allyPlayer && !allyPlayer.down ? [allyPlayer] : [];
    if (t === 'both') return [mePlayer, allyPlayer].filter(p => p && !p.down);
    return [];
  }
  for (const e of effects) {
    switch (e.op) {
      case 'block': for (const p of targetPlayers(e.target)) if (p) p.block = (p.block || 0) + (e.v || 0) + (p.mods && p.mods.def || 0); break;
      case 'heal': for (const p of targetPlayers(e.target)) if (p) p.hp = Math.min(p.maxhp, p.hp + (e.v || 0) + (p.mods && p.mods.heal || 0)); break;
      case 'status': if (['self', 'ally', 'both'].includes(e.target)) { for (const p of targetPlayers(e.target)) if (p) { if (!p.status) p.status = {}; p.status[e.s] = (p.status[e.s] || 0) + (e.v || 0); } } break;
      case 'energy': for (const p of targetPlayers(e.target)) if (p) p.energy = Math.min(p.maxEnergy, p.energy + (e.v || 0)); break;
      case 'bond': advBondAdd(adv, e.v || 0); break;
      case 'gold': adv.gold = Math.max(0, adv.gold + (e.v || 0)); break;
      case 'hp': for (const p of targetPlayers(e.target)) if (p) p.hp = Math.max(0, Math.min(p.maxhp, p.hp + (e.v || 0))); break;
      case 'maxhp': for (const p of targetPlayers(e.target)) if (p) { p.maxhp += (e.v || 0); p.hp += (e.v || 0); if (p.hp > p.maxhp) p.hp = p.maxhp; if (p.hp < 0) p.hp = 0; } break;
      case 'card': { const who = e.target === 'ally' ? allyRole : (e.target === 'both' ? 'both' : role); adv.pendingDraft = { who, tier: 'normal', rarity: e.rarity || null }; break; }
      case 'flag': if (e.k && !adv.flags.includes(e.k)) adv.flags.push(e.k); break;
      case 'npc': if (e.id) adv.npcAff[e.id] = (adv.npcAff[e.id] || 0) + (e.v || 0); break;
      case 'combat': adv.pendingCombat = { enemy: e.enemy }; break;
      case 'dmg': case 'draw': case 'relic': break;
      default: break;
    }
  }
}

function makeDraft(adv, tier, who) { const GD = window.GAME_DATA || {}; const cards = GD.cards || []; function poolFor(role) { const p = adv.players[role]; if (!p) return []; const owned = new Set(p.cards || []); const skills = new Set(p.skills || []); let pool = cards.filter(c => c.cls === p.cls && !owned.has(c.id)); if ((p.skills || []).length >= 7) pool = pool.filter(c => c.type !== 'skill'); const evolve = pool.filter(c => c.type === 'evolve' && Array.isArray(c.requires) && c.requires.every(r => owned.has(r) || skills.has(r))); const normal = pool.filter(c => c.type !== 'evolve'); const ordered = evolve.concat(normal); const out = []; const used = new Set(); const rarityFor = () => { const r = advRand(adv); if (tier === 'boss') return r < 0.2 ? 'common' : (r < 0.7 ? 'rare' : 'epic'); if (tier === 'elite') return r < 0.4 ? 'common' : (r < 0.85 ? 'rare' : 'epic'); return r < 0.7 ? 'common' : (r < 0.95 ? 'rare' : 'epic'); }; while (out.length < 3) { const remaining = ordered.filter(c => !used.has(c.id)); if (remaining.length === 0) break; const rarityRoll = (adv.pendingDraft && adv.pendingDraft.rarity) ? adv.pendingDraft.rarity : rarityFor(); const candidates = remaining.filter(c => !c.rarity || c.rarity === rarityRoll); let pick = candidates.length ? candidates[Math.floor(advRand(adv) * candidates.length)] : null; if (!pick) pick = remaining[Math.floor(advRand(adv) * remaining.length)]; if (!pick) break; out.push(pick.id); used.add(pick.id); } return out; } adv.draft = adv.draft || { host: [], guest: [], shared: [], picked: { host: false, guest: false, shared: false } }; adv.draft.picked = { host: false, guest: false, shared: false }; if (who === 'host' || who === 'both') adv.draft.host = poolFor('host'); if (who === 'guest' || who === 'both') adv.draft.guest = poolFor('guest'); if (tier === 'elite' || tier === 'boss') { const bondPool = (GD.bondCards || []).slice(); const out = []; const used = new Set(); while (out.length < 3 && bondPool.length > 0) { const c = bondPool[Math.floor(advRand(adv) * bondPool.length)]; if (!used.has(c.id)) { out.push(c.id); used.add(c.id); } const i = bondPool.indexOf(c); if (i >= 0) bondPool.splice(i, 1); } adv.draft.shared = out; } else { adv.draft.shared = []; } adv.phase = 'draft'; }
function applyCard(adv, role, cardId) { const GD = window.GAME_DATA || {}; const pool = [].concat(GD.cards || [], GD.bondCards || []); const card = pool.find(c => c.id === cardId); if (!card) return; const isBond = card.cls === 'bond'; const targets = isBond ? ['host', 'guest'] : [role]; for (const r of targets) { const p = adv.players[r]; if (!p) continue; if (card.type === 'skill' || card.type === 'evolve') { if (card.type === 'evolve' && card.replaces) { const idx = p.skills.indexOf(card.replaces); if (idx >= 0) p.skills[idx] = card.id; else if (p.skills.length < 7 && !p.skills.includes(card.id)) p.skills.push(card.id); } else { if (p.skills.length < 7 && !p.skills.includes(card.id)) p.skills.push(card.id); } } if (card.type === 'passive' && card.mods) { p.mods = p.mods || {}; for (const k in card.mods) { p.mods[k] = (p.mods[k] || 0) + card.mods[k]; if (k === 'maxhp') p.hp += card.mods[k]; if (p.hp > p.maxhp) p.hp = p.maxhp; } } } adv.stats.cardsTaken = (adv.stats.cardsTaken || 0) + 1; }
function combatFx(adv, who, kind, v, text) { const c = adv.combat; if (!c) return; c.fx.push({ seq: c.fxSeq++, who, kind, v, text }); if (c.fx.length > 20) c.fx.shift(); }
function _findEnemyBase(id) { const GD = window.GAME_DATA || {}; const all = [].concat(GD.enemies || [], GD.bosses || []); return all.find(e => e.id === id) || null; }
function _startPlayerTurn(adv) { adv.stats.turns = (adv.stats.turns || 0) + 1; const c = adv.combat; ['host', 'guest'].forEach(role => { const p = adv.players[role]; if (!p) return; if (p.down) { p.block = 0; c.ended[role] = true; return; } p.energy = p.maxEnergy + (p.mods.energy || 0); p.block = (p.mods.startBlock || 0); for (const k in (p.cd || {})) { if (p.cd[k] > 0) p.cd[k]--; } c.ended[role] = false; if (p.cls === 'warden') { const ally = adv.players[role === 'host' ? 'guest' : 'host']; if (ally && ally.hp > 0 && ally.hp < ally.maxhp * 0.5) { p.block = (p.block || 0) + 6; } else { p.block = (p.block || 0) + 2; } } if (p.cls === 'seer') { c.seerSight = true; } }); ['host', 'guest'].forEach(role => { const p = adv.players[role]; if (p && !p.down && p.mods && p.mods.regen) { p.hp = Math.min(p.maxhp, p.hp + p.mods.regen); } }); }
function combatStart(adv, enemyIds, tier) { let ids = enemyIds; if (!ids || ids.length === 0) { const GD = window.GAME_DATA || {}; const allEnemies = GD.enemies || []; const actEnemies = allEnemies.filter(e => e.act === adv.act && e.tier !== 'boss'); if (tier === 'boss') { const bossId = adv.act === 1 ? 'siren' : (adv.act === 2 ? 'mirror' : 'god'); if (adv.secretBoss) ids = ['firststar']; else ids = [bossId]; } else if (tier === 'elite') { const elites = actEnemies.filter(e => e.tier === 'elite'); ids = [ (elites.length ? elites[Math.floor(advRand(adv)*elites.length)].id : actEnemies[0].id) ]; } else { const curNode = (adv.map.floors || []).flat().find(n => n.id === adv.map.cur); const floor = curNode ? parseInt(curNode.id.split('f')[1]) : 0; let count = 1; if (floor >= 2) count = 2 + (advRand(adv) < 0.5 ? 1 : 0); else count = 1 + (advRand(adv) < 0.5 ? 1 : 0); if (count > 3) count = 3; const normals = actEnemies.filter(e => e.tier === 'normal'); ids = []; const used = new Set(); while (ids.length < count && normals.length > 0) { const e = normals[Math.floor(advRand(adv) * normals.length)]; if (!used.has(e.id)) { ids.push(e.id); used.add(e.id); } else if (normals.length === 1) { ids.push(e.id); break; } } if (ids.length === 0 && normals.length) ids.push(normals[0].id); } } const curNode = (adv.map.floors || []).flat().find(n => n.id === adv.map.cur); const floor = curNode ? (parseInt(curNode.id.split('f')[1]) || 0) : 0; const actMul = 1 + (adv.act - 1) * 0.26; const floorMul = 1 + floor * 0.10; const tierHpMul = tier === 'boss' ? 1.45 : (tier === 'elite' ? 1.5 : 1.05); const tierDmgMul = tier === 'boss' ? 1.12 : (tier === 'elite' ? 1.22 : 1.08); const enemies = []; (ids || []).forEach((id, i) => { const base = _findEnemyBase(id); if (!base) return; let hp = base.hp; hp = Math.round(hp * actMul * floorMul * tierHpMul); if (tier === 'normal' && ids.length === 3) hp = Math.round(hp * 0.88); if (hp < 1) hp = 1; if (adv.act === 1 && tier === 'boss' && base.id === 'siren') hp = Math.max(1, Math.round(hp * 0.70)); const enemy = { uid: 'e' + i, id: base.id, name: base.name, hp, maxhp: hp, block: 0, status: {}, ii: 0, phase: 0, art: base.art, intents: base.intents, phases: base.phases, dmgMul: actMul * floorMul * tierDmgMul * (adv.act === 1 && tier === 'boss' && base.id === 'siren' ? 0.70 : 1), _spoken: { start: false, hurt: false, low: false, die: false } }; enemies.push(enemy); }); adv.phase = 'combat'; adv.combat = { enemies, turn: 1, ended: { host: false, guest: false }, spark: Math.floor((adv.bond || 0) / 3), fx: [], fxSeq: 0, log: [], tier: tier || 'normal', result: null, seerSight: false, victory: null, gold: 0, coopCount: 0, hitBy: { host: [], guest: [] }, coopAwarded: [] }; enemies.forEach(e => { const base = _findEnemyBase(e.id); if (base && base.lines && base.lines.start && !e._spoken.start) { advLog(adv, base.lines.start); e._spoken.start = true; } }); _startPlayerTurn(adv); let c = adv.combat; ['host', 'guest'].forEach(role => { const p = adv.players[role]; if (p) { p.status = {}; p.block = (p.mods.startBlock || 0); p.cd = {}; } }); _startPlayerTurn(adv); if (adv.act === 1 && tier === 'boss') { ['host', 'guest'].forEach(role => { const p = adv.players[role]; if (p && !p.down) { p.energy = Math.min(p.maxEnergy, p.energy + 2); p.block = (p.block || 0) + 8; } }); } }

function combatUseSkill(adv, role, skillId, targetUid) {
  const c = adv.combat; if (!c || c.result) return;
  const p = adv.players[role]; if (!p || p.down || c.ended[role]) return;
  const skill = findSkill(skillId); if (!skill) return;
  const isBond = (skill.cls === 'bond') || (skillId.indexOf('b_') === 0);
  if (isBond) { if (!adv.bondSkills || adv.bondSkills.indexOf(skillId) < 0) return; if ((c.spark || 0) < (skill.bondCost || 0)) return; } else { if (!(p.skills || []).includes(skillId)) return; if ((p.cd[skillId] || 0) > 0) return; if (p.energy < (skill.cost || 0)) return; }
  const enemies = c.enemies.filter(e => e.hp > 0);
  if (isBond) c.spark = Math.max(0, c.spark - (skill.bondCost || 0)); else { p.energy -= (skill.cost || 0); if (skill.cd) p.cd[skillId] = skill.cd; }
  (skill.effects || []).forEach(ef => {
    const op = ef.op;
    if (op === 'dmg') {
      const base = ef.v || 0; const hits = ef.hits || 1; const t = ef.target || 'enemy'; let list = [];
      if (t === 'enemy') { const e = enemies.find(x => x.uid === targetUid) || enemies[0]; if (e) list = [e]; }
      else if (t === 'all') list = enemies.slice();
      else if (t === 'random') { for (let h = 0; h < hits; h++) { if (enemies.length) list.push(enemies[Math.floor(advRand(adv) * enemies.length)]); } }
      const actualHits = t === 'random' ? 1 : hits;
      for (let hh = 0; hh < actualHits; hh++) {
        const iterList = t === 'random' ? [list[hh] || enemies[0]] : list;
        iterList.forEach(e => {
          if (!e || e.hp <= 0) return;
          let dmg = base + (p.mods.atk || 0) + ((p.status && p.status.str) || 0);
          if (p.cls === 'warden') dmg += (p.block || 0) + 4;
          if (p.status && p.status.weak) dmg = Math.floor(dmg * 0.75);
          if (e.status && e.status.vuln) dmg = Math.floor(dmg * 1.5);
          if (advRand(adv) * 100 < (p.mods.crit || 0)) dmg = Math.floor(dmg * 1.5);
          if (adv.act === 1 && c.tier === 'boss' && p.cls !== 'blade') dmg += 6;
          const blocked = Math.min(e.block || 0, dmg);
          e.block = (e.block || 0) - blocked;
          const real = dmg - blocked;
          e.hp = Math.max(0, e.hp - real);
          combatFx(adv, role, 'dmg', real, (p.name || role) + ' 对 ' + e.name + ' 造成 ' + real + ' 点伤害');
          advLog(adv, (p.name || role) + ' 的 ' + (skill.name || skillId) + ' 命中 ' + e.name + '，造成 ' + real + ' 点伤害' + (blocked ? '（护盾抵挡 ' + blocked + '）' : '') + '。');
          if (e.status && e.status.thorns) { const ref = e.status.thorns; p.hp = Math.max(0, p.hp - ref); combatFx(adv, e.uid, 'dmg', ref, e.name + ' 反伤 ' + ref); }
          const other = role === 'host' ? 'guest' : 'host';
          if (Array.isArray(c.hitBy[other]) && c.hitBy[other].includes(e.uid) && !c.coopAwarded.includes(e.uid) && (c.coopCount || 0) < 3) {
            advBondAdd(adv, 1);
            c.coopCount = (c.coopCount || 0) + 1;
            c.coopAwarded.push(e.uid);
            advLog(adv, '合击！羁绊 +1。');
          }
          if (!c.hitBy[role].includes(e.uid)) c.hitBy[role].push(e.uid);
          const baseE = _findEnemyBase(e.id);
          if (baseE && baseE.lines) {
            if (e.hp <= 0 && !e._spoken.die) { advLog(adv, baseE.lines.die); e._spoken.die = true; adv.stats.kills = (adv.stats.kills || 0) + 1; }
            else if (e.hp / e.maxhp < 0.3 && !e._spoken.low) { advLog(adv, baseE.lines.low); e._spoken.low = true; }
            else if (e.hp < e.maxhp && !e._spoken.hurt) { advLog(adv, baseE.lines.hurt); e._spoken.hurt = true; }
          }
        });
      }
    } else if (op === 'block') {
      const v = (ef.v || 0) + (p.mods.def || 0); const t = ef.target || 'self';
      const applyBlock = (r) => { const pl = adv.players[r]; if (pl && !pl.down) pl.block = (pl.block || 0) + v; };
      if (t === 'self') applyBlock(role); else if (t === 'ally') applyBlock(role === 'host' ? 'guest' : 'host'); else if (t === 'both') { applyBlock('host'); applyBlock('guest'); }
    } else if (op === 'heal') {
      let v = (ef.v || 0) + (p.mods.heal || 0); if (p.cls === 'weaver') v += 2; if (p.cls === 'warden') v += 3; const t = ef.target || 'self';
      const applyHeal = (r) => { const pl = adv.players[r]; if (pl && !pl.down) pl.hp = Math.min(pl.maxhp, pl.hp + v); };
      if (t === 'self') applyHeal(role); else if (t === 'ally') applyHeal(role === 'host' ? 'guest' : 'host'); else if (t === 'both') { applyHeal('host'); applyHeal('guest'); }
    } else if (op === 'status') {
      const s = ef.s; const v = ef.v || 1; const t = ef.target || 'enemy';
      const applyStatus = (obj) => { if (obj && !obj.down) { if (!obj.status) obj.status = {}; obj.status[s] = (obj.status[s] || 0) + v; } };
      if (t === 'enemy') { const e = enemies.find(x => x.uid === targetUid) || enemies[0]; if (e) { if (!e.status) e.status = {}; e.status[s] = (e.status[s] || 0) + v; } }
      else if (t === 'all') enemies.forEach(e => { if (!e.status) e.status = {}; e.status[s] = (e.status[s] || 0) + v; });
      else if (t === 'self') applyStatus(p); else if (t === 'ally') applyStatus(adv.players[role === 'host' ? 'guest' : 'host']); else if (t === 'both') { applyStatus(adv.players.host); applyStatus(adv.players.guest); }
    } else if (op === 'energy') { const v = ef.v || 0; const t = ef.target || 'self'; if (t === 'self' && !p.down) p.energy += v; else if (t === 'ally') { const pl = adv.players[role === 'host' ? 'guest' : 'host']; if (pl && !pl.down) pl.energy += v; } }
    else if (op === 'bond') { advBondAdd(adv, ef.v || 0); }
    else if (op === 'gold') { adv.gold = (adv.gold || 0) + (ef.v || 0); }
    else if (op === 'hp') { const v = ef.v || 0; const t = ef.target || 'self'; const applyHp = (r) => { const pl = adv.players[r]; if (pl && !pl.down) pl.hp = Math.max(0, pl.hp + v); }; if (t === 'self') applyHp(role); else if (t === 'ally') applyHp(role === 'host' ? 'guest' : 'host'); else if (t === 'both') { applyHp('host'); applyHp('guest'); } }
    else if (op === 'maxhp') { const v = ef.v || 0; const t = ef.target || 'self'; const applyMax = (r) => { const pl = adv.players[r]; if (pl && !pl.down) { pl.maxhp += v; pl.hp = Math.min(pl.maxhp, pl.hp + v); } }; if (t === 'self') applyMax(role); else if (t === 'ally') applyMax(role === 'host' ? 'guest' : 'host'); else if (t === 'both') { applyMax('host'); applyMax('guest'); } }
  });
  if (p.cls === 'blade' && (adv.combat.turn === 1)) { if (!p.status) p.status = {}; p.status.str = (p.status.str || 0) + 1; }
  if (isBond) advBondAdd(adv, 2);
  c.spark = Math.min(100, (c.spark || 0) + 8);
  ['host', 'guest'].forEach(r => { const pl = adv.players[r]; if (pl && pl.hp <= 0 && !pl.down) { pl.down = true; pl.hp = 0; advLog(adv, (pl.name || r) + ' 倒下了。'); } });
  const aliveE = c.enemies.filter(e => e.hp > 0);
  if (aliveE.length === 0 && c.result !== 'win') { c.result = 'win'; ['host', 'guest'].forEach(r => { const pl = adv.players[r]; if (pl.down) { pl.down = false; pl.hp = Math.floor(pl.maxhp * 0.25); advLog(adv, (pl.name || r) + ' 以微光苏醒。'); } }); ['host', 'guest'].forEach(r => { if (adv.players[r]) adv.players[r].status = {}; }); c.enemies.forEach(e => { e.status = {}; }); if (typeof onCombatWin === 'function') onCombatWin(adv); return; }
  if (adv.players.host.down && adv.players.guest.down) { c.result = 'lose'; if (typeof onCombatLose === 'function') onCombatLose(adv); }
}

function combatEndTurn(adv, role) {
  const c = adv.combat; if (!c || c.result) return;
  const p = adv.players[role]; if (p && !p.down) c.ended[role] = true; else c.ended[role] = true;
  if (!c.ended.host || !c.ended.guest) return;
  c.spark = Math.min(100, (c.spark || 0) + 4);
  if ((c.turn || 1) >= 30) {
    c.enemies.forEach(e => { if (e.hp > 0) advLog(adv, e.name + ' 释放了必杀·星陨！'); });
    ['host', 'guest'].forEach(r => { const pl = adv.players[r]; if (pl) { pl.hp = 0; pl.down = true; } });
    advLog(adv, '星陨降临，全体倒下。');
    c.result = 'lose'; if (typeof onCombatLose === 'function') onCombatLose(adv); return;
  }
  if ((c.turn || 1) >= 10) {
    c.enemies.forEach(e => { if (e.hp > 0) { if (!e.status) e.status = {}; e.status.str = (e.status.str || 0) + 2; advLog(adv, e.name + ' 陷入狂怒，力量 +2。'); } });
  }
  c.enemies.forEach(e => {
    if (e.hp <= 0) return;
    const base = _findEnemyBase(e.id);
    if (base && base.phases) {
      for (let i = (e.phase || 0); i < base.phases.length; i++) {
        if (e.maxhp > 0 && e.hp / e.maxhp <= base.phases[i].at) {
          if (e.phase !== i + 1) { e.phase = i + 1; advLog(adv, base.phases[i].text); e.intents = base.phases[i].intents; }
          break;
        }
      }
    }
    const intents = (e.intents || (base && base.intents)) || [];
    const intent = intents.length ? intents[e.ii % intents.length] : null;
    if (e.status && e.status.stun && e.status.stun > 0) { e.status.stun--; advLog(adv, e.name + ' 被眩晕，跳过行动。'); }
    else if (intent) {
      if (intent.type === 'attack') {
        const v = Math.round((intent.v || 0) * (e.dmgMul || 1));
        let targets = intent.target === 'both' ? ['host', 'guest'] : [];
        if (targets.length === 0) { const alive = ['host', 'guest'].filter(r => !adv.players[r].down); const r = alive.length ? alive[Math.floor(advRand(adv) * alive.length)] : null; if (r) targets = [r]; }
        targets = targets.filter(r => !adv.players[r].down);
        targets.forEach(r => {
          const pl = adv.players[r]; if (!pl || pl.down) return;
          let dmg = v + ((e.status && e.status.str) || 0);
          if (pl.status && pl.status.vuln) dmg = Math.floor(dmg * 1.5);
          if (e.status && e.status.weak) dmg = Math.floor(dmg * 0.75);
          const blocked = Math.min(pl.block || 0, dmg);
          pl.block = (pl.block || 0) - blocked;
          const real = dmg - blocked;
          pl.hp = Math.max(0, pl.hp - real);
          combatFx(adv, e.uid, 'dmg', real, e.name + ' 攻击 ' + (pl.name || r));
          advLog(adv, e.name + ' 的 ' + (intent.text || '攻击') + ' 命中 ' + (pl.name || r) + '，造成 ' + real + ' 点伤害' + (blocked ? '（护盾抵挡 ' + blocked + '）' : '') + '。');
          if (pl.cls === 'warden') { e.hp = Math.max(0, e.hp - 6); combatFx(adv, pl.cls, 'dmg', 6, '守夜人反伤'); }
          else if (pl.mods && pl.mods.thorns) { e.hp = Math.max(0, e.hp - pl.mods.thorns); }
          if (pl.mods && pl.mods.thorns) { e.hp = Math.max(0, e.hp - pl.mods.thorns); }
          if (pl.status && pl.status.shield_link) { const ally = adv.players[r === 'host' ? 'guest' : 'host']; if (ally && !ally.down) { const half = Math.floor(real / 2); ally.hp = Math.max(0, ally.hp - half); } }
        });
      } else if (intent.type === 'multi') {
        const hits = intent.hits || 2;
        for (let h = 0; h < hits; h++) {
          const alive = ['host', 'guest'].filter(r => !adv.players[r].down);
          if (!alive.length) break;
          const r = alive[Math.floor(advRand(adv) * alive.length)];
          const pl = adv.players[r]; if (!pl || pl.down) continue;
          let dmg = Math.round((intent.v || 0) * (e.dmgMul || 1)) + ((e.status && e.status.str) || 0);
          if (pl.status && pl.status.vuln) dmg = Math.floor(dmg * 1.5);
          if (e.status && e.status.weak) dmg = Math.floor(dmg * 0.75);
          const blocked = Math.min(pl.block || 0, dmg);
          pl.block = (pl.block || 0) - blocked;
          const real = dmg - blocked;
          pl.hp = Math.max(0, pl.hp - real);
          combatFx(adv, e.uid, 'dmg', real, e.name + ' 连击');
        }
      } else if (intent.type === 'block') { e.block = (e.block || 0) + (intent.v || 0); }
      else if (intent.type === 'buff') { if (!e.status) e.status = {}; e.status.str = (e.status.str || 0) + (intent.v || 1); }
      else if (intent.type === 'debuff') { const s = intent.s; const v = intent.v || 1; const t = intent.target || 'one'; const applyD = (r) => { const pl = adv.players[r]; if (pl && !pl.down) { if (!pl.status) pl.status = {}; pl.status[s] = (pl.status[s] || 0) + v; } }; if (t === 'both' || t === 'all') { applyD('host'); applyD('guest'); } else if (t === 'self') { if (!e.status) e.status = {}; e.status[s] = (e.status[s] || 0) + v; } else { const alive = ['host', 'guest'].filter(r => !adv.players[r].down); const r = alive.length ? alive[Math.floor(advRand(adv) * alive.length)] : null; if (r) applyD(r); } }
      else if (intent.type === 'heal') { e.hp = Math.min(e.maxhp, e.hp + (intent.v || 0)); }
      else if (intent.type === 'special') { if (intent.s) { const s = intent.s; const v = intent.v || 1; const t = intent.target || 'both'; const applyS = (r) => { const pl = adv.players[r]; if (pl && !pl.down) { if (!pl.status) pl.status = {}; pl.status[s] = (pl.status[s] || 0) + v; } }; if (t === 'both' || t === 'all') { applyS('host'); applyS('guest'); } else if (t === 'self') { if (!e.status) e.status = {}; e.status[s] = (e.status[s] || 0) + v; } else { const alive = ['host', 'guest'].filter(r => !adv.players[r].down); const r = alive.length ? alive[Math.floor(advRand(adv) * alive.length)] : null; if (r) applyS(r); } } }
    }
    e.ii = (e.ii + 1) % (intents.length || 1);
  });
  c.enemies.forEach(e => {
    if (e.hp <= 0) return;
    if (e.status) {
      if (e.status.burn) { e.hp = Math.max(0, e.hp - e.status.burn); e.status.burn--; if (e.status.burn <= 0) delete e.status.burn; }
      if (e.status.poison) { e.hp = Math.max(0, e.hp - e.status.poison); }
      if (e.status.regen) { e.hp = Math.min(e.maxhp, e.hp + e.status.regen); e.status.regen--; if (e.status.regen <= 0) delete e.status.regen; }
      if (e.status.weak && e.status.weak > 0) { e.status.weak--; if (e.status.weak <= 0) delete e.status.weak; }
      if (e.status.vuln && e.status.vuln > 0) { e.status.vuln--; if (e.status.vuln <= 0) delete e.status.vuln; }
    }
  });
  ['host', 'guest'].forEach(r => {
    const pl = adv.players[r];
    if (!pl || pl.down) return;
    if (pl.status) {
      if (pl.status.burn) { pl.hp = Math.max(0, pl.hp - pl.status.burn); pl.status.burn--; if (pl.status.burn <= 0) delete pl.status.burn; }
      if (pl.status.poison) { pl.hp = Math.max(0, pl.hp - pl.status.poison); }
      if (pl.status.regen) { pl.hp = Math.min(pl.maxhp, pl.hp + pl.status.regen); pl.status.regen--; if (pl.status.regen <= 0) delete pl.status.regen; }
      if (pl.status.weak && pl.status.weak > 0) { pl.status.weak--; if (pl.status.weak <= 0) delete pl.status.weak; }
      if (pl.status.vuln && pl.status.vuln > 0) { pl.status.vuln--; if (pl.status.vuln <= 0) delete pl.status.vuln; }
    }
    if (pl.mods && pl.mods.regen) pl.hp = Math.min(pl.maxhp, pl.hp + pl.mods.regen);
    if (pl.hp <= 0) { pl.down = true; pl.hp = 0; advLog(adv, (pl.name || r) + ' 倒下了。'); }
  });
  c.enemies.forEach(e => { e.block = 0; });
  c.turn = (c.turn || 1) + 1;
  _startPlayerTurn(adv);
  const aliveE2 = c.enemies.filter(e => e.hp > 0);
  if (aliveE2.length === 0 && c.result !== 'win') {
    c.result = 'win';
    ['host', 'guest'].forEach(r => { const pl = adv.players[r]; if (pl.down) { pl.down = false; pl.hp = Math.floor(pl.maxhp * 0.30); advLog(adv, (pl.name || r) + ' 以微光苏醒。'); } });
    ['host', 'guest'].forEach(r => { if (adv.players[r]) adv.players[r].status = {}; });
    c.enemies.forEach(e => { e.status = {}; });
    if (typeof onCombatWin === 'function') onCombatWin(adv);
    return;
  }
  if (adv.players.host.down && adv.players.guest.down) { c.result = 'lose'; if (typeof onCombatLose === 'function') onCombatLose(adv); }
}

function enterNode(adv, node) { if (!node) return; adv.map.visited.push(node.id); adv.map.cur = node.id; adv.stats.nodes = (adv.stats.nodes || 0) + 1; switch (node.type) { case 'battle': case 'elite': case 'boss': { const tier = node.type === 'elite' ? 'elite' : (node.type === 'boss' ? 'boss' : 'normal'); adv.phase = 'combat'; combatStart(adv, [], tier); break; } case 'event': { const GD = window.GAME_DATA || {}; const evs = (GD.events || []).filter(e => (Array.isArray(e.act) ? e.act.includes(adv.act) : e.act === adv.act) && !(adv.seenEvents || []).includes(e.id)); const ev = evs.length ? evs[Math.floor(advRand(adv) * evs.length)] : null; adv.event = { id: ev ? ev.id : null, resultText: null, done: false, summary: null, chooser: null }; if (ev) adv.seenEvents.push(ev.id); adv.phase = 'event'; break; } case 'npc': { const GD = window.GAME_DATA || {}; const npcs = GD.npcs || []; let chosen = null; for (const n of npcs) { const meetings = n.meetings || []; const idx = adv.npcMet[n.id] || 0; if (meetings[idx] && meetings[idx].act === adv.act) { chosen = n; break; } } if (!chosen) { for (const n of npcs) { const meetings = n.meetings || []; const idx = adv.npcMet[n.id] || 0; if (meetings[idx] && meetings[idx].act < adv.act) { chosen = n; break; } } } if (!chosen) { node.type = 'event'; enterNode(adv, node); return; } const idx = adv.npcMet[chosen.id] || 0; adv.npcMet[chosen.id] = idx + 1; adv.npc = { id: chosen.id, meeting: idx, node: 'start', lastText: null, ended: false, lastChoice: null, summary: null }; adv.phase = 'npc'; break; } case 'shop': { const GD = window.GAME_DATA || {}; const items = []; for (const r of ['host', 'guest']) { const p = adv.players[r]; const pool = (GD.cards || []).filter(c => c.cls === p.cls); const owned = new Set(p.cards || []); const avail = pool.filter(c => !owned.has(c.id)); for (let i = 0; i < 2; i++) { if (avail.length === 0) break; const c = avail[Math.floor(advRand(adv) * avail.length)]; const rarityPrice = c.rarity === 'epic' ? 95 : (c.rarity === 'rare' ? 65 : 40); items.push({ kind: 'card', id: c.id, price: rarityPrice, sold: false, for: r }); const idx = avail.indexOf(c); if (idx >= 0) avail.splice(idx, 1); } } const bondPool = (GD.bondCards || []).filter(c => !(adv.bondSkills || []).includes(c.id)); if (bondPool.length) { const c = bondPool[Math.floor(advRand(adv) * bondPool.length)]; items.push({ kind: 'bondcard', id: c.id, price: 80, sold: false }); } items.push({ kind: 'heal', price: 30, sold: false }); items.push({ kind: 'maxhp', price: 45, sold: false }); const lines = (GD.shopKeeper && GD.shopKeeper.lines) || []; adv.shop = { items, line: lines.length ? lines[Math.floor(advRand(adv) * lines.length)] : '欢迎光临。' }; adv.phase = 'shop'; break; } case 'rest': { adv.rest = { done: { host: false, guest: false }, text: null }; adv.phase = 'rest'; break; } case 'treasure': { adv.gold += 30 + Math.floor(advRand(adv) * 26); makeDraft(adv, 'elite', 'both'); adv.afterDraft = 'map'; break; } default: adv.phase = 'map'; } }

function onCombatWin(adv) { const c = adv.combat || {}; const enemies = c.enemies || []; let rewardGold = 0; const GD = window.GAME_DATA || {}; const all = [].concat(GD.enemies || [], GD.bosses || []); for (const e of enemies) { const def = all.find(x => x.id === e.id) || e; rewardGold += (def.reward && def.reward.gold) || 0; } const actGoldMul = 1 + (adv.act - 1) * 0.35; rewardGold = Math.round(rewardGold * actGoldMul); const mods = (adv.players.host && adv.players.host.mods) || {}; adv.gold += rewardGold + (mods.goldGain || 0); for (const r of ['host', 'guest']) { const p = adv.players[r]; if (p && p.down) { p.down = false; p.hp = Math.max(1, Math.floor(p.maxhp * 0.30)); } } adv.stats.kills = (adv.stats.kills || 0) + enemies.length; adv.combat.victory = (GD.victoryLines && GD.victoryLines.length) ? GD.victoryLines[Math.floor(advRand(adv) * GD.victoryLines.length)] : '胜利。'; adv.combat.gold = rewardGold + (mods.goldGain || 0); const tier = c.tier || 'normal'; const isBoss = tier === 'boss'; const bossId = enemies.length ? enemies[0].id : null; if (isBoss && bossId === 'firststar') { adv.stats.firstStarDefeated = true; } if (isBoss) { adv.stats.bossWon = true; } makeDraft(adv, tier, 'both'); if (isBoss && bossId === 'god' && adv.flags.includes('shard1') && adv.flags.includes('shard2') && adv.flags.includes('shard3') && adv.bond >= 70 && !adv.secretBoss && !adv.stats.firstStarDefeated) { adv.secretBoss = true; adv.afterDraft = 'secret'; } else if (isBoss) { if (adv.act < 3) adv.afterDraft = 'actIntro'; else adv.afterDraft = 'ending'; } else { adv.afterDraft = 'map'; } }
function onCombatLose(adv) { adv.phase = 'ending'; adv.ending = { id: 'fallen', title: '陨落', text: advText((window.GAME_DATA || {}).deathLine || '你们倒下了。'), epilogue: '' }; finishRun(adv); }
function finishRun(adv) { const GD = window.GAME_DATA || {}; const endings = (GD.endings || []).slice().sort((a, b) => (b.priority || 0) - (a.priority || 0)); let chosen = null; const bossWon = !!adv.stats.bossWon; const firstStarDefeated = !!adv.stats.firstStarDefeated; const allDown = adv.players.host.down && adv.players.guest.down; for (const en of endings) { const c = en.cond || {}; let ok = true; if (c.dead === true) { if (!allDown) ok = false; } else { if (allDown) ok = false; } if (c.bondMin != null && adv.bond < c.bondMin) ok = false; if (c.bondMax != null && adv.bond > c.bondMax) ok = false; if (Array.isArray(c.flags)) for (const f of c.flags) if (!adv.flags.includes(f)) ok = false; if (Array.isArray(c.notFlags)) for (const f of c.notFlags) if (adv.flags.includes(f)) ok = false; if (c.npc) for (const id in c.npc) if ((adv.npcAff[id] || 0) < c.npc[id]) ok = false; if (c.bossWon === true && !bossWon) ok = false; if (en.id === 'eternal') { if (!firstStarDefeated) ok = false; } if (ok) { chosen = en; break; } } if (!chosen && endings.length) chosen = endings[endings.length - 1]; adv.ending = chosen ? { id: chosen.id, title: chosen.title, text: advText(chosen.text), epilogue: advText(chosen.epilogue) } : null; adv.phase = 'ending'; try { if (typeof me !== 'undefined' && me && me.role === 'host') { const key = 'lovegame_meta'; const raw = localStorage.getItem(key); const meta = raw ? JSON.parse(raw) : { runs: 0, wins: 0, endingsSeen: [] }; meta.runs = (meta.runs || 0) + 1; if (chosen && chosen.id !== 'fallen') meta.wins = (meta.wins || 0) + 1; if (chosen && !meta.endingsSeen.includes(chosen.id)) meta.endingsSeen.push(chosen.id); localStorage.setItem(key, JSON.stringify(meta)); } } catch (e) {} }
function advMeta() { try { const raw = localStorage.getItem('lovegame_meta'); return raw ? JSON.parse(raw) : { runs: 0, wins: 0, endingsSeen: [] }; } catch (e) { return { runs: 0, wins: 0, endingsSeen: [] }; } }

function advReduce(adv, a, role) {
  if (!adv || !a) return;
  switch (a.type) {
    case 'pickClass': { if (adv.phase !== 'classSelect') return; if (role === 'host') { if (adv.pick.guest === a.cls) return; adv.pick.host = a.cls; } else { if (adv.pick.host === a.cls) return; adv.pick.guest = a.cls; } break; }
    case 'ready': { if (adv.phase !== 'classSelect') return; adv.pick.ready[role] = true; if (adv.pick.ready.host && adv.pick.ready.guest && adv.pick.host && adv.pick.guest) { const GD = window.GAME_DATA || {}; const clsMap = {}; (GD.classes || []).forEach(c => clsMap[c.id] = c); for (const r of ['host', 'guest']) { const clsId = adv.pick[r]; const c = clsMap[clsId]; adv.players[r] = { cls: clsId, name: (typeof S !== 'undefined' && S && S.players && S.players[r]) ? S.players[r].name : clsId, hp: c.maxhp, maxhp: c.maxhp, block: 0, energy: c.energy, maxEnergy: c.energy, status: {}, skills: (c.skills || []).map(s => s.id), cards: [], mods: { atk: 0, def: 0, heal: 0, maxhp: 0, energy: 0, crit: 0, thorns: 0, regen: 0, startBlock: 0, goldGain: 0 }, down: false, cd: {} }; } adv.phase = 'intro'; advLog(adv, '两位星旅者踏上了旅程。'); } break; }
    case 'continue': { if (adv.phase === 'intro') adv.phase = 'actIntro'; else if (adv.phase === 'actIntro') { genMap(adv); adv.phase = 'map'; } else if (adv.phase === 'event') { if (adv.pendingCombat) { const pc = adv.pendingCombat; adv.pendingCombat = null; const tier = 'normal'; const enemy = pc.enemy; adv.phase = 'combat'; combatStart(adv, enemy ? [enemy] : [], tier); } else if (adv.pendingDraft) { const pd = adv.pendingDraft; adv.pendingDraft = null; makeDraft(adv, pd.tier || 'normal', pd.who || 'host'); adv.afterDraft = adv.afterDraft || 'map'; } else { adv.event.done = true; adv.phase = 'map'; } } else if (adv.phase === 'npc') { if (adv.npc.ended) { if (adv.pendingCombat) { const pc = adv.pendingCombat; adv.pendingCombat = null; adv.phase = 'combat'; combatStart(adv, pc.enemy ? [pc.enemy] : [], 'normal'); } else if (adv.pendingDraft) { const pd = adv.pendingDraft; adv.pendingDraft = null; makeDraft(adv, pd.tier || 'normal', pd.who || 'host'); adv.afterDraft = adv.afterDraft || 'map'; } else { adv.phase = 'map'; } } else { adv.npc.ended = true; } } else if (adv.phase === 'draft') { const d = adv.draft; if (d.picked.host && d.picked.guest && (d.shared.length === 0 || d.picked.shared)) { if (adv.afterDraft === 'actIntro') { adv.act = Math.min(3, adv.act + 1); adv.phase = 'actIntro'; adv.afterDraft = null; } else if (adv.afterDraft === 'secret') { adv.phase = 'combat'; combatStart(adv, ['firststar'], 'boss'); adv.afterDraft = null; } else if (adv.afterDraft === 'ending') { finishRun(adv); } else { adv.phase = 'map'; } } } else if (adv.phase === 'shop' || adv.phase === 'rest') { adv.phase = 'map'; } else if (adv.phase === 'ending') { } break; }
    case 'vote': { const node = a.node; const cur = adv.map.cur; let reachable = []; if (cur === null) reachable = adv.map.floors[0].map(n => n.id); else { const nodeObj = adv.map.floors.flat().find(n => n.id === cur); reachable = nodeObj ? nodeObj.next : []; } if (!reachable.includes(node)) return; if (adv.votes[role] === node) { adv.votes[role] = null; return; } adv.votes[role] = node; if (adv.votes.host && adv.votes.guest) { let target = adv.votes.host; if (adv.votes.host !== adv.votes.guest) { target = advRand(adv) < 0.5 ? adv.votes.host : adv.votes.guest; advLog(adv, '命运的硬币落在了……' + target + '（' + (target === adv.votes.host ? '房主' : '旅伴') + '的选择）'); } adv.votes.host = null; adv.votes.guest = null; const allNodes = adv.map.floors.flat(); const nodeObj = allNodes.find(n => n.id === target); if (nodeObj) enterNode(adv, nodeObj); } break; }
    case 'eventChoice': { if (adv.phase !== 'event') return; const GD = window.GAME_DATA || {}; const ev = (GD.events || []).find(e => e.id === adv.event.id); if (!ev) return; if (a.idx === -1) { adv.event.resultText = '你们默默离开，风里没有回声。'; adv.event.done = true; adv.event.summary = ''; return; } const choice = (ev.choices || [])[a.idx]; if (!choice) return; const req = choice.req || {}; if (!hasReq(adv, req)) return; const outcomes = choice.outcomes || []; let r = advRand(adv); let acc = 0; let chosen = outcomes[outcomes.length - 1]; for (const o of outcomes) { acc += (o.p || 0); if (r <= acc) { chosen = o; break; } } if (chosen) { applyEffects(adv, chosen.effects || [], role); adv.event.resultText = advText(chosen.text || ''); adv.event.summary = effectSummary(chosen.effects || []); } adv.event.done = true; adv.event.chooser = role; break; }
    case 'npcChoice': { if (adv.phase !== 'npc') return; const GD = window.GAME_DATA || {}; const npc = (GD.npcs || []).find(n => n.id === adv.npc.id); if (!npc) return; const meeting = (npc.meetings || [])[adv.npc.meeting]; if (!meeting) return; const node = (meeting.nodes || {})[adv.npc.node]; if (!node) return; const choice = (node.choices || [])[a.idx]; if (!choice) return; const req = choice.req || {}; if (!hasReq(adv, req)) return; applyEffects(adv, choice.effects || [], role); adv.npc.lastChoice = a.idx; adv.npc.summary = effectSummary(choice.effects || []); if (choice.next && (meeting.nodes || {})[choice.next]) { adv.npc.node = choice.next; } else { adv.npc.ended = true; } break; }
    case 'useSkill': { if (adv.phase !== 'combat') return; combatUseSkill(adv, role, a.skill, a.target); break; }
    case 'endTurn': { if (adv.phase !== 'combat') return; combatEndTurn(adv, role); break; }
    case 'draftPick': { if (adv.phase !== 'draft') return; const card = a.card; const list = role === 'host' ? adv.draft.host : adv.draft.guest; if (card !== null && !list.includes(card)) return; if (card === null) { adv.gold += 15; } else { applyCard(adv, role, card); } adv.draft.picked[role] = true; const d = adv.draft; if (d.picked.host && d.picked.guest && (d.shared.length === 0 || d.picked.shared)) { advReduce(adv, { type: 'continue' }, role); } break; }
    case 'draftShared': { if (adv.phase !== 'draft') return; const card = a.card; if (card !== null && !adv.draft.shared.includes(card)) return; if (card != null) { for (const r of ['host', 'guest']) applyCard(adv, r, card); } adv.draft.picked.shared = true; const d = adv.draft; if (d.picked.host && d.picked.guest && (d.shared.length === 0 || d.picked.shared)) { advReduce(adv, { type: 'continue' }, role); } break; }
    case 'shopBuy': { if (adv.phase !== 'shop') return; const item = (adv.shop.items || [])[a.idx]; if (!item || item.sold) return; if (item.for && item.for !== role) return; if (adv.gold < item.price) return; adv.gold -= item.price; item.sold = true; if (item.kind === 'heal') { const p = adv.players[role]; p.hp = Math.min(p.maxhp, p.hp + Math.floor(p.maxhp * 0.3)); } else if (item.kind === 'maxhp') { const p = adv.players[role]; p.maxhp += 8; p.hp += 8; if (p.hp > p.maxhp) p.hp = p.maxhp; } else if (item.kind === 'card' && item.id) { applyCard(adv, role, item.id); } else if (item.kind === 'bondcard' && item.id) { const GD = window.GAME_DATA || {}; const card = (GD.bondCards || []).find(c => c.id === item.id); if (card) { if (card.type === 'skill') adv.bondSkills.push(card.id); else if (card.type === 'passive' && card.mods) { for (const r of ['host', 'guest']) { adv.players[r].mods = adv.players[r].mods || {}; for (const k in card.mods) { adv.players[r].mods[k] = (adv.players[r].mods[k] || 0) + card.mods[k]; if (k === 'maxhp') adv.players[r].hp += card.mods[k]; } } } } } break; }
    case 'restAction': { if (adv.phase !== 'rest') return; const p = adv.players[role]; if (a.kind === 'heal') { p.hp = Math.min(p.maxhp, p.hp + Math.floor(p.maxhp * 0.40)); adv.rest.done[role] = true; } else if (a.kind === 'train') { makeDraft(adv, 'normal', role); adv.afterDraft = 'map'; adv.rest.done[role] = true; } else if (a.kind === 'talk') { const GD = window.GAME_DATA || {}; const texts = GD.restTexts || []; adv.rest.text = texts.length ? texts[Math.floor(advRand(adv) * texts.length)] : '你们坐在火边，什么也没说，却都不冷。'; advBondAdd(adv, 6); for (const r of ['host', 'guest']) { const pl = adv.players[r]; if (pl) pl.hp = Math.min(pl.maxhp, pl.hp + 10); } adv.rest.done[role] = true; } if (adv.rest.done.host && adv.rest.done.guest) { adv.phase = 'map'; } break; }
    case 'restart': { if (adv.phase !== 'ending') return; const fresh = advInit(); Object.assign(adv, fresh); break; }
    default: break;
  }
}
