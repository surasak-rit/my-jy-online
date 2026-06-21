// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/panels.js — หน้าต่างโต้ตอบ NPC (DOM, ไม่ใช่ Canvas — UI=DOM §7.2)
// เปิดเมื่อเข้าคุย NPC: อาจารย์→เรียนวิชา · หมอ→รักษา · พ่อค้า→ร้าน (stub)
// ──────────────────────────────────────────────────────────────────────────
import { canLearn, skillCost } from '../core/skills.js';

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

  function open(npc) {
    if (npc.sectId) return openSkills(npc);                 // อาจารย์สำนัก
    if ((npc.role || '').includes('หมอ')) return openHealer(npc);
    if ((npc.role || '').includes('พ่อค้า')) return frame(npc.name, '<p>“ร้านค้ากำลังจะเปิดเร็วๆ นี้…”</p>');
    frame(npc.name, `<p><i>“${npcLine(npc)}”</i></p>`);     // ตัวประกอบ/อื่น ๆ
  }

  return { open, close };
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
