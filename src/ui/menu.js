// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/menu.js — เมนูในเกม (มุมขวาบน): กลับสู่หน้าหลัก (หน้าเลือกช่องบันทึก)
// ──────────────────────────────────────────────────────────────────────────

/** คีย์ sessionStorage บอก boot ให้แสดงหน้าเลือกช่อง (ไม่เข้าเกมอัตโนมัติ) */
export const RETURN_MENU_FLAG = 'tigersway.returnMenu';

/**
 * @param {import('../game.js').Game} game
 */
export function initMenu(game) {
  const el = /** @type {HTMLElement} */ (document.getElementById('menu'));
  el.innerHTML = `
    <button id="menu-toggle" title="เมนู">☰</button>
    <div id="menu-pop" class="hidden">
      <div class="menu-title">เมนู</div>
      <button id="menu-home">🏠 กลับสู่หน้าหลัก</button>
      <div class="menu-hint">I = กระเป๋า · E = อุปกรณ์ · N = เม็ดยาภายใน</div>
    </div>`;

  const pop = /** @type {HTMLElement} */ (el.querySelector('#menu-pop'));
  const close = () => pop.classList.add('hidden');

  /** @type {HTMLElement} */ (el.querySelector('#menu-toggle')).onclick = (e) => {
    e.stopPropagation();
    pop.classList.toggle('hidden');
  };
  /** @type {HTMLElement} */ (el.querySelector('#menu-home')).onclick = () => {
    game.saveState();                                   // บันทึกก่อนออก
    sessionStorage.setItem(RETURN_MENU_FLAG, '1');      // บอก boot ให้โชว์หน้าเลือกช่อง
    location.reload();
  };
  // ปิดเมื่อคลิกที่อื่น / กด Esc
  document.addEventListener('click', (e) => { if (!el.contains(/** @type {Node} */ (e.target))) close(); });
  document.addEventListener('keydown', (e) => { if (e.code === 'Escape') close(); });
}
