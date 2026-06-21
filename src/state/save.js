// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// state/save.js — persistence (MVP: localStorage) (GDD §7.1/§7.4)
// รองรับหลายช่องบันทึก (save slots). ภายหลังเปลี่ยนเป็น API/server ได้โดยคง interface เดิม
// ──────────────────────────────────────────────────────────────────────────

const PREFIX = 'tigersway.save.v0';
const LEGACY_KEY = PREFIX; // ช่องเดียวแบบเก่า → ย้ายเข้า slot 0 อัตโนมัติ
const LAST_KEY = `${PREFIX}.last`; // ช่องที่เล่นล่าสุด (เปิดเกมมาแล้วเข้าต่อทันที)
export const NUM_SLOTS = 3;

const keyFor = (/** @type {number} */ slot) => `${PREFIX}.slot${slot}`;

// ย้ายเซฟเก่า (ช่องเดียว) เข้า slot 0 ครั้งเดียว — ผู้เล่นเดิมไม่เสียข้อมูล
(function migrateLegacy() {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy != null && localStorage.getItem(keyFor(0)) == null) {
      localStorage.setItem(keyFor(0), legacy);
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch { /* โหมด private / ไม่มี localStorage */ }
})();

/** @param {number} slot @param {object} data */
export function save(slot, data) {
  try { localStorage.setItem(keyFor(slot), JSON.stringify(data)); } catch { /* โหมด private */ }
}

/** @param {number} slot @returns {object|null} */
export function load(slot) {
  try { const s = localStorage.getItem(keyFor(slot)); return s ? JSON.parse(s) : null; } catch { return null; }
}

/** ลบเซฟช่องที่ระบุ */
export function deleteSlot(slot) {
  try { localStorage.removeItem(keyFor(slot)); } catch { /* ignore */ }
}

/** จำช่องที่เล่นล่าสุด (เรียกตอนบันทึก) */
export function setLastSlot(slot) {
  try { localStorage.setItem(LAST_KEY, String(slot)); } catch { /* ignore */ }
}

/** ช่องบันทึกล่าสุดที่เล่นได้จริง — fallback เป็นช่องแรกที่มีเซฟ, ไม่มีเลย→null */
export function latestSlot() {
  let last = null;
  try { const s = localStorage.getItem(LAST_KEY); last = s == null ? null : Number(s); } catch { /* ignore */ }
  if (last != null) { const d = /** @type {any} */ (load(last)); if (d && d.displayName) return last; }
  for (let i = 0; i < NUM_SLOTS; i++) { const d = /** @type {any} */ (load(i)); if (d && d.displayName) return i; }
  return null;
}

/**
 * สรุปทุกช่องสำหรับหน้าจอเลือกช่อง
 * @returns {{ slot:number, empty:boolean, name?:string, title?:string, zone?:string, xp?:number, coins?:number }[]}
 */
export function listSlots() {
  const out = [];
  for (let i = 0; i < NUM_SLOTS; i++) {
    const d = /** @type {any} */ (load(i));
    if (!d || !d.displayName) out.push({ slot: i, empty: true });
    else out.push({ slot: i, empty: false, name: d.displayName, title: d.activeTitle, zone: d.zoneName || '', xp: d.combatXP || 0, coins: d.currency || 0 });
  }
  return out;
}
