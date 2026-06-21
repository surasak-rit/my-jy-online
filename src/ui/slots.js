// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/slots.js — หน้าจอเลือกช่องบันทึก (เปิดเกม): เล่นต่อ / สร้างใหม่ / ลบ
// ──────────────────────────────────────────────────────────────────────────
import { listSlots, deleteSlot } from '../state/save.js';

/**
 * แสดงหน้าเลือกช่องบันทึก แล้ว resolve เป็นเลขช่องที่เลือก
 * @returns {Promise<number>}
 */
export function showSlots() {
  const el = /** @type {HTMLElement} */ (document.getElementById('slots'));

  return new Promise((resolve) => {
    const render = () => {
      const slots = listSlots();
      el.innerHTML = `
        <div class="slots-card">
          <h1 class="create-title">虎道 · เลือกช่องบันทึก</h1>
          <div class="slots-list">
            ${slots.map((s) => slotRow(s)).join('')}
          </div>
        </div>`;

      el.querySelectorAll('.slot-row').forEach((row) => {
        const slot = Number(/** @type {HTMLElement} */ (row).dataset.slot);
        const play = row.querySelector('.slot-play');
        const del = row.querySelector('.slot-del');
        if (play) /** @type {HTMLElement} */ (play).onclick = () => { el.classList.add('hidden'); el.innerHTML = ''; resolve(slot); };
        if (del) /** @type {HTMLElement} */ (del).onclick = (e) => {
          e.stopPropagation();
          if (confirm(`ลบข้อมูลช่อง ${slot + 1}? การกระทำนี้ย้อนกลับไม่ได้`)) { deleteSlot(slot); render(); }
        };
      });
    };

    el.classList.remove('hidden');
    render();
  });
}

/** @param {{slot:number, empty:boolean, name?:string, title?:string, zone?:string, xp?:number, coins?:number}} s */
function slotRow(s) {
  if (s.empty) {
    return `
      <div class="slot-row slot-empty" data-slot="${s.slot}">
        <div class="slot-info"><span class="slot-no">ช่อง ${s.slot + 1}</span><span class="slot-vacant">— ว่าง —</span></div>
        <button class="slot-play slot-new">＋ สร้างใหม่</button>
      </div>`;
  }
  const title = s.title ? `〈${s.title}〉` : '';
  return `
    <div class="slot-row" data-slot="${s.slot}">
      <div class="slot-info">
        <span class="slot-no">ช่อง ${s.slot + 1}</span>
        <span class="slot-name">${escapeHtml(s.name || '')} <em>${escapeHtml(title)}</em></span>
        <span class="slot-meta">${escapeHtml(s.zone || '')} · 历练 ${s.xp} · 💰 ${s.coins}</span>
      </div>
      <div class="slot-actions">
        <button class="slot-play">เล่นต่อ</button>
        <button class="slot-del" title="ลบช่องนี้">🗑</button>
      </div>
    </div>`;
}

/** กันชื่อผู้เล่นแทรก HTML */
function escapeHtml(/** @type {string} */ s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
