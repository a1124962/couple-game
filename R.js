function advInjectCSS() {
  if (document.getElementById('adv-css')) return;
  var s = document.createElement('style');
  s.id = 'adv-css';
  s.textContent = `
  *{box-sizing:border-box}
  .adv-root,.adv-card,.adv-btn,.adv-row,.adv-skill,.adv-mapnode,.adv-bubble,.adv-status,.adv-error{box-sizing:border-box;max-width:100%;min-width:0}
  .adv-root{max-width:760px;margin:0 auto;padding:12px;font-family:system-ui,-apple-system,sans-serif;color:var(--ink,#222);background:var(--cream,#fffdf7);min-height:100vh;overflow-x:hidden}
  .adv-card{width:100%;background:#fff;border-radius:16px;padding:14px;margin:10px 0;box-shadow:0 4px 12px rgba(0,0,0,.06);word-break:break-word;overflow-wrap:anywhere}
  .adv-btn{min-height:44px;border:none;border-radius:12px;padding:10px 14px;font-size:15px;cursor:pointer;background:var(--peach,#f25c54);color:#fff;max-width:100%}
  .adv-btn:disabled{opacity:.4;cursor:not-allowed}
  .adv-row{display:flex;gap:8px;flex-wrap:wrap}
  .adv-hp{height:8px;background:#eee;border-radius:4px;overflow:hidden;max-width:100%}
  .adv-hp>div{height:100%;background:#f25c54;transition:width .3s}
  .adv-fade{animation:advFade .6s ease}
  @keyframes advFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .adv-fire{width:40px;height:60px;background:linear-gradient(#ff9,#f60);border-radius:50% 50% 40% 40%;animation:advFlicker .8s infinite alternate;margin:0 auto}
  @keyframes advFlicker{to{transform:scale(1.05,1.1);opacity:.9}}
  .adv-mapnode{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #ccc;background:#fff;font-size:18px}
  .adv-mapnode.cur{border-color:var(--peach,#f25c54);box-shadow:0 0 0 3px rgba(242,92,84,.2)}
  .adv-mapnode.reach{cursor:pointer;background:#fff7f0}
  .adv-skill{min-width:128px;border:1px solid #ddd;border-radius:12px;padding:8px;margin:4px;display:inline-block;vertical-align:top;word-break:break-word;overflow-wrap:anywhere}
  .adv-rare-common{border-color:#ccc}
  .adv-rare-rare{border-color:#7b68ee}
  .adv-rare-epic{border-color:#d4af37;box-shadow:0 0 8px gold}
  .adv-float{position:absolute;animation:advFloat 1s ease forwards;pointer-events:none;font-weight:bold}
  @keyframes advFloat{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-40px)}}
  .adv-shake{animation:advShake .3s}
  @keyframes advShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  .adv-bubble{background:#f0f0f0;border-radius:12px;padding:8px;margin:4px 0;font-size:14px;word-break:break-word;overflow-wrap:anywhere}
  .adv-status{font-size:12px;color:#666;margin:6px 0;word-break:break-word;overflow-wrap:anywhere}
  .adv-error{background:#fff0f0;border:1px solid #f25c54;border-radius:16px;padding:16px;margin:10px 0;word-break:break-word;overflow-wrap:anywhere}
  .adv-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(40,40,40,.92);color:#fff;padding:10px 16px;border-radius:12px;font-size:14px;z-index:9999;max-width:90vw;word-break:break-word;overflow-wrap:anywhere;box-shadow:0 6px 18px rgba(0,0,0,.18)}
  .adv-skillrow{display:flex;flex-wrap:wrap;gap:8px;max-width:100%}
  .adv-endturn{background:#d32f2f;font-size:16px;padding:12px 16px;box-shadow:0 0 0 3px rgba(211,47,47,.25)}
  @media (max-width:360px){.adv-root{padding:8px}.adv-card{padding:10px;margin:8px 0}.adv-btn{font-size:14px;padding:8px 10px}.adv-skill{min-width:100%}}
  `;
  document.head.appendChild(s);
}

var ADV_STATUS_NAMES = { vuln: '易伤', weak: '虚弱', burn: '灼烧', stun: '眩晕', regen: '再生', str: '力量', poison: '中毒', thorns: '荆棘', shield_link: '护盾链接' };
function advStatusName(s) { return ADV_STATUS_NAMES[s] || s; }

var ADV_INTENT_NAMES = { attack: '攻击', defend: '防御', buff: '增益', debuff: '减益', heal: '治疗', summon: '召唤', escape: '逃跑' };
function advIntentType(t) { return ADV_INTENT_NAMES[t] || t; }
function advIntentText(it) {
  if (!it) return '';
  if (it.text) return it.text;
  return advIntentType(it.type);
}

var ADV_PHASE_NAMES = {
  classSelect: '选择职业',
  intro: '序章',
  actIntro: '幕间',
  map: '地图',
  event: '事件',
  npc: '相遇',
  combat: '战斗',
  draft: '抽卡',
  shop: '商店',
  rest: '篝火',
  ending: '结局'
};
function advPhaseName(p) { return ADV_PHASE_NAMES[p] || p || ''; }

function advClassName(id) {
  if (!id) return '';
  var GD = (typeof GAME_DATA === 'undefined' ? {} : GAME_DATA) || {};
  var c = (GD.classes || []).find(function (x) { return x.id === id; });
  return c ? c.name : id;
}

function advToast(msg) {
  try {
    if (typeof window.toast === 'function') { window.toast(msg); return; }
  } catch (e) {}
  var t = document.createElement('div');
  t.className = 'adv-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2200);
}

function advDispatchSafe(payload, reason) {
  try { advDispatch(payload); }
  catch (e) { advToast(reason || '操作未能执行，请稍后再试'); }
}

function advRestartGame() {
  try {
    advDispatch({ type: 'restart' });
  } catch (e) {
    try {
      var role = (typeof me !== 'undefined' && me && me.role) ? me.role : 'host';
      if (role === 'host' && typeof advInit === 'function') {
        S.adv = advInit();
        if (window.__advContainer) advRender(window.__advContainer);
      } else {
        advToast('请由房主重置');
      }
    } catch (err) {
      advToast('重置失败');
    }
  }
}

function advRender(container) {
  advInjectCSS();
  window.__advContainer = container;
  try {
    if (!container) return;
    if (typeof S === 'undefined' || !S) throw new Error('S 未定义');
    if (!S.adv) S.adv = (typeof advInit === 'function' ? advInit() : {});
    var adv = S.adv;
    var GD = (typeof GAME_DATA === 'undefined' ? {} : GAME_DATA) || {};
    var role = (typeof me !== 'undefined' && me && me.role) ? me.role : 'host';
    var other = role === 'host' ? 'guest' : 'host';
    var meP = adv.players ? adv.players[role] : null;
    var html = '<div class="adv-root">';
    function topBar() {
      var bond = adv.bond || 0;
      html += '<div class="adv-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div style="min-width:0"><b>第' + (adv.act || 1) + '幕</b> <span style="font-size:12px;color:#888">' + esc(advPhaseName(adv.phase)) + '</span></div><div>星砂 ' + (adv.gold || 0) + '</div></div>';
      html += '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">';
      ['host', 'guest'].forEach(function (r) {
        var p = adv.players && adv.players[r];
        var who = S.players && S.players[r];
        var pct = (p && p.maxhp) ? Math.max(0, Math.min(100, p.hp / p.maxhp * 100)) : 0;
        html += '<div style="flex:1 1 150px;min-width:0"><div style="font-size:12px;word-break:break-word">' + esc(who ? who.name : r) + ' ' + esc(advClassName(p && p.cls ? p.cls : '')) + '</div>';
        html += '<div class="adv-hp"><div style="width:' + pct + '%"></div></div>';
        html += '<div style="font-size:11px">生命 ' + (p ? p.hp : 0) + '/' + (p ? p.maxhp : 0) + ' 能量 ' + (p ? p.energy : 0) + '/' + (p ? p.maxEnergy : 0) + '</div></div>';
      });
      html += '</div>';
      html += '<div style="margin-top:6px">羁绊 <div class="adv-hp"><div style="width:' + bond + '%;background:#e066a3"></div></div> ' + bond + '</div></div>';
    }
    function statusLine(text) { html += '<div class="adv-status">' + advTextEsc(text) + '</div>'; }

    switch (adv.phase) {
      case 'classSelect': {
        html += '<h2 style="text-align:center">两颗星的距离</h2>';
        html += '<p style="text-align:center;color:#555">两颗曾相恋的星星坠落人间，化作两个旅人……</p>';
        html += '<div class="adv-card">';
        (GD.classes || []).forEach(function (c) {
          var taken = adv.pick && (adv.pick.host === c.id || adv.pick.guest === c.id);
          var mine = adv.pick && adv.pick[role] === c.id;
          html += '<div class="adv-card" style="border-left:4px solid ' + (c.color || '#ccc') + '">';
          html += '<b>' + esc(c.name) + '</b> <span style="color:#888">' + esc(c.title || '') + '</span>';
          html += '<div style="font-size:13px">' + esc(c.desc || '') + '</div>';
          html += '<div style="font-size:12px;color:#666">被动：' + esc(c.passive && c.passive.name ? c.passive.name : '') + '</div>';
          if (!taken || mine) {
            html += '<button class="adv-btn" style="margin-top:6px" title="' + (taken && !mine ? '已被对方选择' : '选择该职业') + '" onclick="advDispatchSafe({type:\'pickClass\',cls:\'' + c.id + '\'})" ' + (taken && !mine ? 'disabled' : '') + '>' + (mine ? '已选' : '选择') + '</button>';
          } else {
            html += '<div style="font-size:12px;color:#999">已被对方选择</div>';
          }
          html += '</div>';
        });
        html += '</div>';
        html += '<div class="adv-card">准备状态：' + (adv.pick && adv.pick.ready && adv.pick.ready.host ? '房主✓' : '房主…') + ' / ' + (adv.pick && adv.pick.ready && adv.pick.ready.guest ? '访客✓' : '访客…') + '</div>';
        html += '<button class="adv-btn" onclick="advDispatchSafe({type:\'ready\'})">准备好了</button>';
        var meta = (typeof advMeta === 'function' ? advMeta() : { runs: 0, endingsSeen: [] });
        html += '<div class="adv-card" style="font-size:12px">已冒险 ' + (meta.runs || 0) + ' 次，已解锁结局 ' + (meta.endingsSeen ? meta.endingsSeen.length : 0) + '</div>';
        if (!localStorage.getItem('lovegame_tut')) {
          html += '<div class="adv-card" id="adv-tut"><b>新手引导</b><ul><li>投票选择可达节点</li><li>各自出牌后点结束回合</li><li>星火值与羁绊合体技</li><li>每次战斗后各自抽卡</li><li>羁绊影响结局</li></ul><button class="adv-btn" onclick="localStorage.setItem(\'lovegame_tut\',\'1\');advRender(window.__advContainer)">关闭</button></div>';
        }
        break;
      }
      case 'intro':
      case 'actIntro': {
        var data = adv.phase === 'intro' ? (GD.intro || null) : (GD.actIntros ? GD.actIntros[(adv.act || 1) - 1] : null);
        var title = (data && data.title) ? data.title : (adv.phase === 'intro' ? '序章' : '第' + (adv.act || 1) + '幕');
        var text = (data && data.text) ? data.text : (typeof data === 'string' ? data : '');
        html += '<div class="adv-card adv-fade"><h2>' + esc(title) + '</h2><p style="line-height:1.7;white-space:pre-wrap">' + advTextEsc(text) + '</p>';
        html += '<button class="adv-btn" onclick="advDispatchSafe({type:\'continue\'})">继续</button></div>';
        break;
      }
      case 'map': {
        topBar();
        html += '<div class="adv-card"><div style="font-size:12px;color:#888;margin-bottom:6px">点击可达节点投票</div>';
        var floors = adv.map && adv.map.floors ? adv.map.floors : [];
        var curNode = (adv.map && adv.map.cur) ? (floors.flat().find(function (n) { return n.id === adv.map.cur; })) : null;
        for (var fi = floors.length - 1; fi >= 0; fi--) {
          var floor = floors[fi] || [];
          html += '<div style="display:flex;justify-content:space-around;margin:8px 0;flex-wrap:wrap">';
          floor.forEach(function (n) {
            var isCur = adv.map && adv.map.cur === n.id;
            var reachable = false;
            if (adv.map && adv.map.cur === null) reachable = fi === 0;
            else if (curNode && (curNode.next || []).indexOf(n.id) >= 0) reachable = true;
            var icon = { battle: '⚔', elite: '💀', event: '❓', npc: '💬', shop: '🛒', rest: '🔥', treasure: '💎', boss: '👑' }[n.type] || '•';
            var cls = 'adv-mapnode' + (isCur ? ' cur' : '') + (reachable ? ' reach' : '');
            html += '<div class="' + cls + '" ' + (reachable ? 'onclick="advDispatchSafe({type:\'vote\',node:\'' + n.id + '\'})"' : '') + '>' + icon;
            if (adv.votes && adv.votes.host === n.id) html += '<span style="color:' + (S.players.host.color || '#333') + '">●</span>';
            if (adv.votes && adv.votes.guest === n.id) html += '<span style="color:' + (S.players.guest.color || '#333') + '">●</span>';
            html += '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
        if (adv.votes && adv.votes[role]) statusLine('已投票，等待对方…');
        else statusLine('轮到你投票');
        var reachableIds = adv.map && adv.map.cur === null ? ((floors[0] || []).map(function (n) { return n.id; })) : (curNode ? (curNode.next || []) : []);
        if (reachableIds.length) html += '<button class="adv-btn" style="width:100%" title="前往第一个可达节点" onclick="advDispatchSafe({type:\'vote\',node:\'' + reachableIds[0] + '\'})">快速投票前往第一个可达节点</button>';
        html += '<details class="adv-card"><summary>冒险日志</summary>';
        (adv.log || []).slice(-20).reverse().forEach(function (e) { html += '<div style="font-size:12px">' + advTextEsc(e.text) + '</div>'; });
        html += '</details>';
        break;
      }
      case 'event': {
        var ev = (GD.events || []).find(function (e) { return e.id === adv.event.id; });
        if (ev) {
          html += '<div class="adv-card adv-fade"><h3>' + advTextEsc(ev.title) + '</h3>';
          html += '<div style="text-align:center;margin:8px 0">' + stickSVG(ev.art || 'stand', meP && meP.color ? meP.color : '#333') + '</div>';
          html += '<p style="line-height:1.7">' + advTextEsc(ev.text) + '</p>';
          if (adv.event && adv.event.resultText) {
            html += '<div class="adv-card" style="background:#f7f7f7">' + advTextEsc(adv.event.resultText) + '</div>';
            if (adv.event.summary) html += '<div class="adv-status">效果：' + esc(adv.event.summary) + '</div>';
            html += '<button class="adv-btn" onclick="advDispatchSafe({type:\'continue\'})">继续</button>';
          } else {
            statusLine('由先点击的一方决定，请商量后选择');
            (ev.choices || []).forEach(function (ch, i) {
              var ok = true, reason = '';
              if (ch.req) {
                if (ch.req.cls) {
                  var has = (adv.players.host && adv.players.host.cls === ch.req.cls) || (adv.players.guest && adv.players.guest.cls === ch.req.cls);
                  if (!has) { ok = false; reason = '需要职业：' + ch.req.cls; }
                }
                if (ch.req.bondMin != null && (adv.bond || 0) < ch.req.bondMin) { ok = false; reason = '需要羁绊≥' + ch.req.bondMin; }
                if (ch.req.gold != null && (adv.gold || 0) < ch.req.gold) { ok = false; reason = '需要星砂≥' + ch.req.gold; }
                if (ch.req.flag && !(adv.flags || []).includes(ch.req.flag)) { ok = false; reason = '需要剧情标记'; }
              }
              html += '<button class="adv-btn" style="display:block;width:100%;margin:6px 0;text-align:left" ' + (ok ? '' : 'disabled title="' + esc(reason) + '"') + ' onclick="advDispatchSafe({type:\'eventChoice\',idx:' + i + '})">';
              html += advTextEsc(ch.label);
              if (ch.hint) html += '<div style="font-size:11px;color:#888">' + advTextEsc(ch.hint) + '</div>';
              if (!ok) html += '<div style="font-size:11px;color:#c00">' + esc(reason) + '</div>';
              html += '</button>';
            });
            html += '<button class="adv-btn" style="background:#888" onclick="advDispatchSafe({type:\'eventChoice\',idx:-1})">默默离开</button>';
          }
          html += '</div>';
        } else {
          html += '<div class="adv-card">事件未找到<button class="adv-btn" onclick="advDispatchSafe({type:\'continue\'})">继续</button></div>';
        }
        break;
      }
      case 'npc': {
        var npc = (GD.npcs || []).find(function (n) { return n.id === adv.npc.id; });
        var meeting = npc && npc.meetings ? npc.meetings[adv.npc.meeting] : null;
        var node = meeting && meeting.nodes ? meeting.nodes[adv.npc.node] : null;
        html += '<div class="adv-card adv-fade">';
        if (npc) { html += '<h3>' + esc(npc.name) + ' <span style="font-size:12px;color:#888">' + esc(npc.title || '') + '</span></h3>'; html += '<div style="text-align:center">' + stickSVG(npc.art || 'stand', '#555') + '</div>'; }
        if (node) {
          html += '<div class="adv-bubble">' + advTextEsc(node.text) + '</div>';
          (node.choices || []).forEach(function (ch, i) {
            html += '<button class="adv-btn" style="display:block;width:100%;margin:6px 0" title="选择该对话" onclick="advDispatchSafe({type:\'npcChoice\',idx:' + i + '})">' + advTextEsc(ch.label) + '</button>';
          });
        }
        if (adv.npc && adv.npc.ended) {
          statusLine('对话结束');
          html += '<button class="adv-btn" onclick="advDispatchSafe({type:\'continue\'})">继续</button>';
        } else if (!node) {
          html += '<button class="adv-btn" onclick="advDispatchSafe({type:\'continue\'})">继续</button>';
        }
        html += '</div>';
        break;
      }
      case 'combat': {
        var c = adv.combat || {};
        topBar();
        html += '<div class="adv-card"><div style="display:flex;gap:8px;flex-wrap:wrap">';
        (c.enemies || []).forEach(function (e) {
          if (e.hp <= 0) return;
          html += '<div class="adv-card" style="flex:1 1 120px;min-width:0" data-who="' + e.uid + '">';
          html += '<div style="text-align:center">' + stickSVG(e.art || 'stick', '#333') + '</div>';
          html += '<b>' + esc(e.name) + '</b>';
          html += '<div class="adv-hp"><div style="width:' + Math.max(0, Math.min(100, e.hp / e.maxhp * 100)) + '%"></div></div>';
          html += '<div style="font-size:11px">生命 ' + e.hp + '/' + e.maxhp + ' 护盾 ' + (e.block || 0) + '</div>';
          html += '<div style="font-size:11px">';
          if (e.status) Object.keys(e.status).forEach(function (s) { html += advStatusName(s) + '×' + e.status[s] + ' '; });
          html += '</div>';
          var it = (typeof enemyIntent === 'function') ? enemyIntent(adv, e, 0) : null;
          if (it) html += '<div style="font-size:12px;color:#c00">意图：' + esc(advIntentText(it)) + ' ' + (it.v || '') + '</div>';
          html += '<button class="adv-btn" style="margin-top:4px;font-size:12px" title="选择该敌人为目标" onclick="window.__advTarget=\'' + e.uid + '\';advToast(\'已选择目标\')">选为目标</button>';
          html += '</div>';
        });
        html += '</div></div>';
        html += '<div class="adv-card"><div style="display:flex;gap:8px;flex-wrap:wrap">';
        ['host', 'guest'].forEach(function (r) {
          var p = adv.players[r];
          html += '<div class="adv-card" style="flex:1 1 140px;min-width:0" data-who="' + r + '">';
          html += '<b>' + esc(S.players[r].name) + '</b> ' + (p && p.down ? '<span style="color:red">倒下</span>' : '');
          html += '<div class="adv-hp"><div style="width:' + (p && p.maxhp ? Math.max(0, Math.min(100, p.hp / p.maxhp * 100)) : 0) + '%"></div></div>';
          html += '<div style="font-size:11px">生命 ' + (p ? p.hp : 0) + '/' + (p ? p.maxhp : 0) + ' 护盾 ' + (p ? p.block : 0) + ' 能量 ' + (p ? p.energy : 0) + '/' + (p ? p.maxEnergy : 0) + '</div>';
          if (p && p.status) { html += '<div style="font-size:11px">'; Object.keys(p.status).forEach(function (s) { html += advStatusName(s) + '×' + p.status[s] + ' '; }); html += '</div>'; }
          if (c.ended && c.ended[r]) html += '<div style="font-size:11px;color:#888">已结束回合</div>';
          html += '</div>';
        });
        html += '</div>';
        html += '<div>星火 ' + (c.spark || 0) + '/100 <div class="adv-hp"><div style="width:' + Math.min(100, c.spark || 0) + '%;background:#e066a3"></div></div></div></div>';
        if (c.ended && c.ended[role]) statusLine('等待对方…');
        else statusLine('轮到你行动');
        if (meP && !meP.down) {
          var hasAvailable = false;
          (meP.skills || []).forEach(function (sid) {
            var sk = (typeof findSkill === 'function') ? findSkill(sid) : null;
            if (!sk) return;
            var cd = meP.cd && meP.cd[sid] ? meP.cd[sid] : 0;
            var energyLow = meP.energy < (sk.cost || 0);
            if (!energyLow && cd <= 0 && !(c.ended && c.ended[role])) hasAvailable = true;
          });
          (adv.bondSkills || []).forEach(function (bid) {
            var bk = (typeof findSkill === 'function') ? findSkill(bid) : null;
            if (!bk) return;
            var sparkLow = (c.spark || 0) < (bk.bondCost || 0);
            if (!sparkLow && !(c.ended && c.ended[role])) hasAvailable = true;
          });

          html += '<div class="adv-card"><div class="adv-skillrow">';
          (meP.skills || []).forEach(function (sid) {
            var sk = (typeof findSkill === 'function') ? findSkill(sid) : null;
            if (!sk) return;
            var cd = meP.cd && meP.cd[sid] ? meP.cd[sid] : 0;
            var energyLow = meP.energy < (sk.cost || 0);
            var disabled = energyLow || cd > 0 || (c.ended && c.ended[role]);
            var reason = cd > 0 ? '技能冷却中' : (energyLow ? '能量不足' : ((c.ended && c.ended[role]) ? '不是你的回合' : ''));
            html += '<div class="adv-skill adv-rare-common"><b>' + esc(sk.name) + '</b><br>消耗能量 ' + (sk.cost || 0) + '，冷却 ' + cd + '<br><span style="font-size:12px">' + esc(sk.desc || '') + '</span><br>';
            html += '<button class="adv-btn" style="margin-top:4px;font-size:12px" title="' + esc(reason || '使用技能') + '" ' + (disabled ? 'disabled' : '') + ' onclick="advDispatchSafe({type:\'useSkill\',skill:\'' + sid + '\',target:window.__advTarget||\'enemy\'})">使用</button></div>';
          });
          html += '</div>';
          html += '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">';
          (adv.bondSkills || []).forEach(function (bid) {
            var bk = (typeof findSkill === 'function') ? findSkill(bid) : null;
            if (!bk) return;
            var sparkLow = (c.spark || 0) < (bk.bondCost || 0);
            var disabled = sparkLow || (c.ended && c.ended[role]);
            var reason = sparkLow ? '星火不足' : ((c.ended && c.ended[role]) ? '不是你的回合' : '');
            html += '<button class="adv-btn" style="margin:4px" title="' + esc(reason || '使用合体技') + '" ' + (disabled ? 'disabled' : '') + ' onclick="advDispatchSafe({type:\'useSkill\',skill:\'' + bid + '\',target:window.__advTarget||\'enemy\'})">' + esc(bk.name) + ' (星火 ' + (bk.bondCost || 0) + ')</button>';
          });
          html += '</div>';
          html += '<button class="adv-btn ' + (hasAvailable ? '' : 'adv-endturn') + '" style="width:100%;margin-top:8px" title="结束当前回合" onclick="advDispatchSafe({type:\'endTurn\'})">结束回合</button>';
        } else if (meP && meP.down) {
          html += '<div class="adv-card" style="text-align:center">你已倒下，等待复活…</div>';
        }
        html += '<div class="adv-card" style="font-size:12px;max-height:120px;overflow:auto">';
        (c.log || []).slice(-10).reverse().forEach(function (t) { html += '<div>' + advTextEsc(typeof t === 'string' ? t : (t && t.text)) + '</div>'; });
        html += '</div>';
        if (c.result === 'win') html += '<div class="adv-card" style="text-align:center;font-size:20px;color:green">胜利！</div>';
        if (c.result === 'lose') html += '<div class="adv-card" style="text-align:center;font-size:20px;color:#c00">失败…</div>';
        break;
      }
      case 'draft': {
        html += '<div class="adv-card adv-fade"><h3>星辰的馈赠</h3>';
        var myDraft = (adv.draft && adv.draft[role]) ? adv.draft[role] : [];
        html += '<div style="font-size:12px;color:#888">选择一张卡牌</div><div style="display:flex;flex-wrap:wrap;gap:8px">';
        myDraft.forEach(function (cid) {
          var card = (GD.cards || []).find(function (c) { return c.id === cid; });
          if (!card) return;
          var rc = 'adv-rare-' + (card.rarity || 'common');
          html += '<div class="adv-skill ' + rc + '" style="display:inline-block"><b>' + esc(card.name) + '</b><br><span style="font-size:11px">' + esc(card.type || '') + '/' + esc(card.rarity || '') + '</span><br><span style="font-size:12px">' + esc(card.desc || '') + '</span><br><button class="adv-btn" style="margin-top:4px;font-size:12px" title="选择该卡牌" onclick="advDispatchSafe({type:\'draftPick\',card:\'' + card.id + '\'})">选择</button></div>';
        });
        html += '</div>';
        html += '<button class="adv-btn" style="margin-top:8px;background:#888" title="跳过并获得星砂" onclick="advDispatchSafe({type:\'draftPick\',card:null})">跳过(+15星砂)</button>';
        if (adv.draft && adv.draft.shared && adv.draft.shared.length) {
          html += '<h4>羁绊卡三选一</h4><div style="display:flex;flex-wrap:wrap;gap:8px">';
          adv.draft.shared.forEach(function (cid) {
            var card = (GD.bondCards || []).find(function (c) { return c.id === cid; });
            if (!card) card = (GD.cards || []).find(function (c) { return c.id === cid; });
            if (!card) return;
            html += '<button class="adv-btn" style="margin:4px" title="选择该羁绊卡" onclick="advDispatchSafe({type:\'draftShared\',card:\'' + card.id + '\'})">' + esc(card.name) + '</button>';
          });
          html += '</div>';
        }
        if (adv.draft && adv.draft.picked && adv.draft.picked[role]) statusLine('已选择，等待对方…');
        else statusLine('轮到你选择');
        html += '</div>';
        break;
      }
      case 'shop': {
        var sh = GD.shopKeeper || {};
        html += '<div class="adv-card"><h3>' + esc(sh.name || '店主') + '</h3><p>' + esc((adv.shop && adv.shop.line) ? adv.shop.line : (sh.lines && sh.lines[0]) || '') + '</p>';
        html += '<div>星砂 ' + (adv.gold || 0) + '</div>';
        (adv.shop && adv.shop.items || []).forEach(function (it, idx) {
          var disabled = it.sold || (adv.gold || 0) < it.price;
          var reason = it.sold ? '已售出' : ((adv.gold || 0) < it.price ? '星砂不足' : '');
          html += '<div class="adv-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">';
          if (it.kind === 'card') {
            var card = (GD.cards || []).find(function (c) { return c.id === it.id; });
            html += '<div style="min-width:0"><b>' + esc(card ? card.name : it.id) + '</b><br><span style="font-size:12px">' + esc(card ? card.desc : '') + '</span> ' + (it.for ? '(' + esc(it.for) + ')' : '') + '</div>';
          } else if (it.kind === 'bondcard') {
            var bcard = (GD.bondCards || []).find(function (c) { return c.id === it.id; });
            html += '<div style="min-width:0"><b>' + esc(bcard ? bcard.name : it.id) + '</b><br><span style="font-size:12px">' + esc(bcard ? bcard.desc : '') + '</span></div>';
          } else {
            html += '<div style="min-width:0">' + esc(it.kind) + ' ' + (it.for ? '(' + esc(it.for) + ')' : '') + '</div>';
          }
          html += '<button class="adv-btn" title="' + esc(reason || '购买') + '" ' + (disabled ? 'disabled' : '') + ' onclick="advDispatchSafe({type:\'shopBuy\',idx:' + idx + '})">' + (it.sold ? '已售' : (it.price + '星砂')) + '</button>';
          html += '</div>';
        });
        html += '<button class="adv-btn" style="margin-top:8px" onclick="advDispatchSafe({type:\'continue\'})">离开</button></div>';
        break;
      }
      case 'rest': {
        html += '<div class="adv-card adv-fade"><h3>营火</h3><div class="adv-fire"></div>';
        html += '<div style="text-align:center;margin:8px 0">' + (adv.rest && adv.rest.text ? advTextEsc(adv.rest.text) : '') + '</div>';
        html += '<div class="adv-row">';
        html += '<button class="adv-btn" title="恢复生命" onclick="advDispatchSafe({type:\'restAction\',kind:\'heal\'})">治疗</button>';
        html += '<button class="adv-btn" title="提升能力" onclick="advDispatchSafe({type:\'restAction\',kind:\'train\'})">修炼</button>';
        html += '<button class="adv-btn" title="增进羁绊" onclick="advDispatchSafe({type:\'restAction\',kind:\'talk\'})">谈心</button>';
        html += '</div>';
        html += '<div style="font-size:12px;margin-top:6px">房主 ' + (adv.rest && adv.rest.done && adv.rest.done.host ? '✓' : '…') + ' / 访客 ' + (adv.rest && adv.rest.done && adv.rest.done.guest ? '✓' : '…') + '</div>';
        html += '<button class="adv-btn" style="margin-top:8px" onclick="advDispatchSafe({type:\'continue\'})">继续</button></div>';
        break;
      }
      case 'ending': {
        var en = (GD.endings || []).find(function (e) { return adv.ending && e.id === adv.ending.id; });
        html += '<div class="adv-card adv-fade"><h2 style="text-align:center">' + esc(en ? en.title : (adv.ending ? adv.ending.id : '')) + '</h2>';
        var txt = en ? en.text : (adv.ending ? adv.ending.text : '');
        html += '<p style="line-height:1.8;white-space:pre-wrap">' + advTextEsc(txt) + '</p>';
        if (en && en.epilogue) html += '<p style="font-style:italic;color:#666;margin-top:12px;line-height:1.7;white-space:pre-wrap">' + advTextEsc(en.epilogue) + '</p>';
        html += '<div class="adv-card" style="font-size:12px">击杀 ' + (adv.stats ? adv.stats.kills : 0) + ' · 回合 ' + (adv.stats ? adv.stats.turns : 0) + ' · 羁绊 ' + (adv.bond || 0) + ' · 星砂 ' + (adv.gold || 0) + ' · 节点 ' + (adv.stats ? adv.stats.nodes : 0) + '</div>';
        html += '<div class="adv-row" style="margin-top:12px">';
        html += '<button class="adv-btn" style="flex:1" title="返回大厅" onclick="if(typeof window.render===\'function\'){S.phase=\'lobby\';window.render();}else{window.location.reload();}">返回大厅</button>';
        html += '<button class="adv-btn" style="flex:1" title="再来一局" onclick="advRestartGame()">再来一局</button>';
        html += '</div></div>';
        break;
      }
      default: {
        html += '<div class="adv-card">未知阶段 ' + esc(adv.phase) + '<button class="adv-btn" onclick="advDispatchSafe({type:\'continue\'})">继续</button></div>';
      }
    }
    html += '</div>';
    container.innerHTML = html;
    if (adv.combat && adv.combat.fx) {
      if (!window.__advFxSeen) window.__advFxSeen = 0;
      adv.combat.fx.forEach(function (f) {
        if (f.seq > window.__advFxSeen) {
          var el = container.querySelector('[data-who="' + f.who + '"]');
          if (el) {
            var d = document.createElement('div');
            d.className = 'adv-float';
            d.style.color = f.kind === 'dmg' ? '#e00' : (f.kind === 'heal' ? '#0a0' : '#00f');
            d.textContent = (f.kind === 'dmg' ? '-' : (f.kind === 'heal' ? '+' : '')) + (f.v || 0);
            el.appendChild(d);
            setTimeout(function () { d.remove(); }, 1000);
            if (f.kind === 'dmg') el.classList.add('adv-shake');
            setTimeout(function () { el.classList.remove('adv-shake'); }, 300);
          }
          window.__advFxSeen = f.seq;
        }
      });
    }
  } catch (err) {
    advToast(err && err.message ? err.message : '界面渲染出错');
    var retry = function () { advRender(container); };
    container.innerHTML = '<div class="adv-root"><div class="adv-error"><b>冒险界面渲染出错</b><div style="font-size:13px;margin:8px 0">' + esc(err && err.message ? err.message : err) + '</div><button class="adv-btn" id="adv-retry">重试</button></div></div>';
    var btn = document.getElementById('adv-retry');
    if (btn) btn.onclick = retry;
  }
}
