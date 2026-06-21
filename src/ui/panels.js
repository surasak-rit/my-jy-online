// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/panels.js — หน้าต่างโต้ตอบ NPC (DOM, ไม่ใช่ Canvas — UI=DOM §7.2)
// เปิดเมื่อเข้าคุย NPC: อาจารย์→เรียนวิชา · หมอ→รักษา · พ่อค้า→ร้าน (stub)
// ──────────────────────────────────────────────────────────────────────────
import { canLearn, skillCost } from '../core/skills.js';
import { countItem } from '../core/economy.js';
import { progressText } from '../core/quests.js';

/**
 * @param {import('../game.js').Game} game
 */
export function initPanels(game) {
  const el = /** @type {HTMLElement} */ (document.getElementById('panel'));

  function close() { el.classList.add('hidden'); el.innerHTML = ''; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

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

  function open(npc) {
    const q = game.getGiverQuest(npc.id);
    if (q.mode !== 'none') return openQuest(npc, q);        // ผู้ให้เควส
    if (npc.sectId) return openSkills(npc);                 // อาจารย์สำนัก
    if ((npc.role || '').includes('หมอ')) return openHealer(npc);
    if ((npc.role || '').includes('พ่อค้า')) return openShop(npc);
    frame(npc.name, `<p><i>“${npcLine(npc)}”</i></p>`);     // ตัวประกอบ/อื่น ๆ
  }

  return { open, close, openInventory };
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
