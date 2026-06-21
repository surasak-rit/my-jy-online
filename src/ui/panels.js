// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/panels.js — หน้าต่างโต้ตอบ NPC (DOM, ไม่ใช่ Canvas — UI=DOM §7.2)
// เปิดเมื่อเข้าคุย NPC: อาจารย์→เรียนวิชา · หมอ→รักษา · พ่อค้า→ร้าน (stub)
// ──────────────────────────────────────────────────────────────────────────
import { canLearn, skillCost } from '../core/skills.js';
import { countItem } from '../core/economy.js';
import { progressText } from '../core/quests.js';
import { neidanBonus, canUpgradeNeidan, NEIDAN_STAGES, ELEMENTS, MAX_TIER } from '../core/neidan.js';
import { EQUIP_SLOTS, bonusText } from '../core/equip.js';

/**
 * @param {import('../game.js').Game} game
 */
export function initPanels(game) {
  const el = /** @type {HTMLElement} */ (document.getElementById('panel'));

  function close() { el.classList.add('hidden'); el.innerHTML = ''; }
  document.addEventListener('keydown', (e) => { if (e.code === 'Escape') close(); });

  function frame(title, bodyHtml) {
    el.innerHTML = `
      <div class="panel-card">
        <div class="panel-head"><span>${title}</span><button id="panel-x">✕</button></div>
        <div class="panel-body">${bodyHtml}</div>
      </div>`;
    el.classList.remove('hidden');
    /** @type {HTMLElement} */ (el.querySelector('#panel-x')).onclick = close;
  }

  /** หน้าต่างเรียนวิชาจากอาจารย์สำนัก */
  function openSkills(npc) {
    const p = game.player;
    const defs = Object.values(game.skillDefs).filter((d) => d.sectId === npc.sectId);
    const rows = defs.map((d) => {
      const rank = p.skills[d.id]?.rank || 0;
      const c = canLearn(p, d);
      const maxed = rank >= d.maxRank;
      const cost = skillCost(d, rank + 1);
      const typeLabel = { external: '外功', internal: '內功', movement: '輕功' }[d.type] || '';
      const btn = maxed
        ? `<span class="maxed">สูงสุดแล้ว</span>`
        : `<button class="learn" data-id="${d.id}" ${c.ok ? '' : 'disabled'}>เรียน (✦${cost})</button>`;
      return `<div class="skill-row">
        <div><b>${d.name}</b> <span class="tag">${typeLabel}</span><br/>
          <small>${d.desc} · ระดับ ${rank}/${d.maxRank}</small></div>
        <div>${btn}</div></div>`;
    }).join('');
    frame(`${npc.name} — เรียนวิชา (✦SP: ${p.skillPoints})`,
      rows || '<small>ยังไม่มีวิชาให้เรียน</small>');
    el.querySelectorAll('button.learn').forEach((b) => {
      /** @type {HTMLElement} */(b).onclick = () => {
        const id = /** @type {HTMLElement} */(b).dataset.id;
        game.learnSkill(game.skillDefs[id]);
        openSkills(npc); // รีเฟรช
      };
    });
  }

  function openHealer(npc) {
    const p = game.player;
    frame(npc.name, `<p>“พักฟื้นลมปราณเสียก่อนนะเด็กน้อย”</p>
      <p>HP: ${Math.ceil(p.hp)}/${p.maxHp}</p>
      <button id="heal">รักษา (ฟรี)</button>`);
    /** @type {HTMLElement} */ (el.querySelector('#heal')).onclick = () => {
      p.hp = p.maxHp; game.showToast('ฟื้นพลังเต็ม'); close();
    };
  }

  /** ร้านค้า NPC — ซื้อของกิน */
  function openShop(npc) {
    const p = game.player;
    const items = Object.values(game.itemDefs);
    const rows = items.map((d) => `<div class="skill-row">
      <div><b>${d.name}</b><br/><small>${d.desc}</small></div>
      <div><button class="buy" data-id="${d.id}" ${p.currency >= d.price ? '' : 'disabled'}>ซื้อ 💰${d.price}</button></div>
    </div>`).join('');
    frame(`${npc.name} — ร้านค้า (💰 ${p.currency})`, rows);
    el.querySelectorAll('button.buy').forEach((b) => {
      /** @type {HTMLElement} */(b).onclick = () => { game.buyItem(game.itemDefs[/** @type {HTMLElement} */(b).dataset.id]); openShop(npc); };
    });
  }

  /** กระเป๋า — ใช้ของกิน (เปิดด้วยปุ่ม I) */
  function openInventory() {
    const p = game.player;
    const rows = p.inventory.length ? p.inventory.map((s) => {
      const d = game.itemDefs[s.itemId]; if (!d) return '';
      const use = d.type === 'consumable' ? `<button class="use" data-id="${d.id}">ใช้</button>` : '';
      return `<div class="skill-row"><div><b>${d.name}</b> ×${s.qty}<br/><small>${d.desc}</small></div><div>${use}</div></div>`;
    }).join('') : '<small>กระเป๋าว่างเปล่า</small>';
    frame(`กระเป๋า (💰 ${p.currency} · ❤️ ${Math.ceil(p.hp)}/${p.maxHp})`, rows);
    el.querySelectorAll('button.use').forEach((b) => {
      /** @type {HTMLElement} */(b).onclick = () => { game.useItem(game.itemDefs[/** @type {HTMLElement} */(b).dataset.id]); openInventory(); };
    });
  }

  /** หน้าต่างอุปกรณ์ (裝備) — 8 ช่องสวมใส่ + กระเป๋า (เปิดด้วยปุ่ม E) */
  function openEquip() {
    const p = game.player;
    const eq = p.equipment || {};
    const slotsHtml = EQUIP_SLOTS.map((sl) => {
      const d = eq[sl.key] ? game.itemDefs[eq[sl.key]] : null;
      const inner = d ? `<b>${d.name}</b><br/><small>${bonusText(d)}</small>` : `<span class="eq-empty">— ว่าง —</span>`;
      return `<div class="eq-slot ${d ? 'filled' : ''}" data-slot="${sl.key}">
        <span class="eq-slot-label">${sl.th} <em>${sl.cn}</em></span>
        <span class="eq-slot-item">${inner}</span></div>`;
    }).join('');
    const bag = p.inventory.length ? p.inventory.map((s) => {
      const d = game.itemDefs[s.itemId]; if (!d) return '';
      const wear = d.type === 'equip';
      return `<div class="eq-bag-item ${wear ? 'wearable' : ''}" ${wear ? `data-eq="${d.id}"` : ''} title="${bonusText(d) || d.desc || ''}">
        <b>${d.name}</b>${s.qty > 1 ? ` ×${s.qty}` : ''}<br/><small>${wear ? bonusText(d) + ' · กดเพื่อสวม' : (d.desc || '')}</small></div>`;
    }).join('') : '<small>กระเป๋าว่างเปล่า</small>';
    frame(`อุปกรณ์ 裝備 — ⚔️${Math.round(p.atk)} 🛡️${Math.round(p.def)} ❤️${p.maxHp} 內力${p.maxMp}`,
      `<div class="eq-wrap"><div class="eq-doll">${slotsHtml}</div>
        <div class="eq-bag"><div class="eq-bag-head">玩家身上物品 · กระเป๋า</div><div class="eq-bag-grid">${bag}</div></div></div>`);
    el.querySelectorAll('.eq-slot.filled').forEach((n) => {
      /** @type {HTMLElement} */ (n).onclick = () => { game.unequipItem(/** @type {HTMLElement} */ (n).dataset.slot); openEquip(); };
    });
    el.querySelectorAll('.eq-bag-item.wearable').forEach((n) => {
      /** @type {HTMLElement} */ (n).onclick = () => { game.equipItem(game.itemDefs[/** @type {HTMLElement} */ (n).dataset.eq]); openEquip(); };
    });
  }

  /** หน้าต่างเม็ดยาภายใน (五行内丹) — เปิดด้วยปุ่ม N */
  function openNeidan() {
    const p = game.player;
    const n = p.neidan || { tier: 0, element: null };
    const c = canUpgradeNeidan(p);
    const b = neidanBonus(n);
    const bonusLine = `<small>โบนัสปัจจุบัน: ⚔️+${b.atk} · 🛡️+${b.def} · ❤️+${b.maxHp} · 內力+${b.maxMp}</small>`;

    let body;
    if (n.tier === 0) {
      const cost = /** @type {any} */ (c).cost;
      const afford = p.skillPoints >= cost.sp && p.currency >= cost.coins;
      const elBtns = ELEMENTS.map((e) =>
        `<button class="nd-el" data-el="${e.key}" ${afford ? '' : 'disabled'}>${e.cn} ${e.th}</button>`).join('');
      body = `<p><i>“เลือกธาตุประจำเม็ดยา แล้วเริ่มจุดไฟหลอม (เลือกครั้งเดียว ล็อกถาวร)”</i></p>
        <p class="nd-cost">ต้นทุนหลอม: ✦${cost.sp} SP · 💰${cost.coins}</p>
        <div class="nd-elements">${elBtns}</div>
        <p><small>ธาตุเน้น: 金/火→โจมตี · 木→เลือด · 水→กำลังภายใน · 土→ป้องกัน</small></p>`;
    } else {
      const elDef = ELEMENTS.find((e) => e.key === n.element);
      const stage = NEIDAN_STAGES.find((s) => s.tier === n.tier);
      const nextStage = NEIDAN_STAGES.find((s) => s.tier === n.tier + 1);
      let action;
      if (n.tier >= MAX_TIER) action = `<span class="maxed">玄化 — ขั้นสูงสุดแล้ว</span>`;
      else {
        const cost = /** @type {any} */ (c).cost;
        action = `<button id="nd-up" ${c.ok ? '' : 'disabled'}>${nextStage?.th} (✦${cost.sp} · 💰${cost.coins})</button>`;
      }
      body = `<p><b>${stage?.cn} ${stage?.th}</b></p>
        <p>ธาตุ <b>${elDef ? elDef.cn + ' ' + elDef.th : '-'}</b> · ขั้น ${n.tier}/${MAX_TIER}</p>
        <p>${bonusLine}</p>
        <div class="nd-action">${action}</div>`;
    }
    frame(`内丹 · เม็ดยาภายใน (✦SP ${p.skillPoints} · 💰${p.currency})`, body);
    el.querySelectorAll('button.nd-el').forEach((btn) => {
      /** @type {HTMLElement} */ (btn).onclick = () => { game.upgradeNeidan(/** @type {HTMLElement} */ (btn).dataset.el); openNeidan(); };
    });
    const up = el.querySelector('#nd-up');
    if (up) /** @type {HTMLElement} */ (up).onclick = () => { game.upgradeNeidan(); openNeidan(); };
  }

  /** หน้าต่างเควสจากผู้ให้เควส */
  function openQuest(npc, q) {
    const d = q.def;
    if (q.mode === 'offer') {
      frame(npc.name, `<p><b>${d.name}</b></p><p><small>${d.desc}</small></p>
        <button id="q-accept">รับเควส</button>`);
      /** @type {HTMLElement} */ (el.querySelector('#q-accept')).onclick = () => { game.acceptQuest(d); reopen(npc); };
    } else if (q.mode === 'progress') {
      const steps = progressText(game.player, d).map((t) => `<li>${t}</li>`).join('');
      frame(npc.name, `<p><b>${d.name}</b> (กำลังทำ)</p><ul class="quest-steps">${steps}</ul>
        <p><small>กลับมาหาข้าเมื่อทำสำเร็จ</small></p>`);
    } else if (q.mode === 'turnin') {
      const r = d.rewards || {};
      const rw = [r.skillPoints ? `✦${r.skillPoints} SP` : '', r.soft ? `💰${r.soft}` : '',
      ...(r.items || []).map((i) => `${game.itemDefs[i.id]?.name || i.id}×${i.qty}`)].filter(Boolean).join(' · ');
      frame(npc.name, `<p><b>${d.name}</b> ✓ สำเร็จ!</p><p><small>รางวัล: ${rw}</small></p>
        <button id="q-turnin">รับรางวัล</button>`);
      /** @type {HTMLElement} */ (el.querySelector('#q-turnin')).onclick = () => { game.turnInQuest(d); reopen(npc); };
    }
  }

  function reopen(npc) { open(npc); }

  /** อาจารย์สำนัก แต่ผู้เล่นยังไม่สังกัด → ชวนฝากตัวเข้าสำนัก (§4.3) */
  function openJoin(npc) {
    const sect = game.sectInfo(npc.sectId);
    const def = game.sects[npc.sectId];
    const req = def && def.join && def.join.gender;
    const reqLine = req ? `<p class="sect-req">รับเฉพาะศิษย์${req === 'male' ? 'ชาย ♂' : 'หญิง ♀'}</p>` : '';
    const c = game.canJoinSect(npc.sectId);
    const btn = c.ok
      ? `<button id="join-sect">ฝากตัวเป็นศิษย์</button>`
      : `<button id="join-sect" disabled>${c.reason === 'gender' ? `รับเฉพาะ${c.gender === 'male' ? 'ชาย' : 'หญิง'} — สมัครไม่ได้` : 'สมัครไม่ได้'}</button>`;
    frame(npc.name, `<p><i>“เจ้าต้องการฝากตัวเป็นศิษย์<b>${sect ? sect.crest + ' ' + sect.name : 'สำนักนี้'}</b>หรือไม่?”</i></p>
      ${reqLine}<p><small>เมื่อเข้าสำนักแล้วจึงเรียนวิชาประจำสำนักได้</small></p>${btn}`);
    const b = el.querySelector('#join-sect');
    if (c.ok) /** @type {HTMLElement} */ (b).onclick = () => { game.joinSect(npc.sectId); reopen(npc); };
  }

  function open(npc) {
    const q = game.getGiverQuest(npc.id);
    if (q.mode !== 'none') return openQuest(npc, q);                       // ผู้ให้เควส
    if (npc.sectId) return game.player.sectId === npc.sectId               // อาจารย์สำนัก
      ? openSkills(npc) : openJoin(npc);                                   // สังกัดแล้ว→เรียนวิชา / ยังไม่→ฝากตัว
    if ((npc.role || '').includes('หมอ')) return openHealer(npc);
    if ((npc.role || '').includes('พ่อค้า')) return openShop(npc);
    frame(npc.name, `<p><i>“${npcLine(npc)}”</i></p>`);     // ตัวประกอบ/อื่น ๆ
  }

  return { open, close, openInventory, openNeidan, openEquip };
}

function npcLine(npc) {
  const lines = {
    guard: 'ระวังโจรแถวทุ่งต้นหลิวด้วยนะ',
    beggar: 'มีเศษเบี้ยเหลือบ้างไหมท่าน…',
    villager: 'วันนี้อากาศดีจริงๆ',
    scholar: 'ยุทธภพกว้างใหญ่ จงฝึกฝนให้หนัก',
  };
  return lines[npc.archetype] || 'สวัสดีท่านผู้กล้า';
}
