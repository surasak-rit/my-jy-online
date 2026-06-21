// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// state/save.js — persistence (MVP: localStorage) (GDD §7.1/§7.4)
// ภายหลังเปลี่ยนเป็น API/server ได้โดยคง interface เดิม
// ──────────────────────────────────────────────────────────────────────────

const KEY = 'tigersway.save.v0';

/** @param {object} data */
export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* โหมด private */ }
}

/** @returns {object|null} */
export function load() {
  try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
