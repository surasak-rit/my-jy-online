// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/economy.js — เงิน/ไอเทม/ซื้อ-ขาย/ใช้ของ (pure, ทดสอบได้ — §6)
// sink/source ออกแบบล่วงหน้า: ซื้อของ = sink, ขายดรอป = source (§6.2)
// ──────────────────────────────────────────────────────────────────────────

/** เพิ่มไอเทมเข้ากระเป๋า (รวม stack) */
export function addItem(player, itemId, qty = 1) {
  const slot = player.inventory.find((s) => s.itemId === itemId);
  if (slot) slot.qty += qty; else player.inventory.push({ itemId, qty });
}

/** ลดไอเทม (คืน false ถ้าไม่พอ) */
export function removeItem(player, itemId, qty = 1) {
  const slot = player.inventory.find((s) => s.itemId === itemId);
  if (!slot || slot.qty < qty) return false;
  slot.qty -= qty;
  if (slot.qty <= 0) player.inventory = player.inventory.filter((s) => s !== slot);
  return true;
}

export function countItem(player, itemId) {
  return player.inventory.find((s) => s.itemId === itemId)?.qty || 0;
}

/** ซื้อจากร้าน (sink) — คืน {ok, reason?} */
export function buy(player, itemDef, qty = 1) {
  const cost = (itemDef.price || 0) * qty;
  if (player.currency < cost) return { ok: false, reason: 'money' };
  player.currency -= cost;
  addItem(player, itemDef.id, qty);
  return { ok: true };
}

/** ขายคืน (source) — ได้ครึ่งราคา */
export function sell(player, itemDef, qty = 1) {
  if (!removeItem(player, itemDef.id, qty)) return { ok: false, reason: 'none' };
  player.currency += Math.floor((itemDef.price || 0) / 2) * qty;
  return { ok: true };
}

/** ใช้ของกิน (เช่น ยาฟื้น HP) — คืน {ok, reason?} */
export function useConsumable(player, itemDef) {
  if (itemDef.type !== 'consumable') return { ok: false, reason: 'type' };
  if (countItem(player, itemDef.id) <= 0) return { ok: false, reason: 'none' };
  if (itemDef.heal) player.hp = Math.min(player.maxHp, player.hp + itemDef.heal);
  removeItem(player, itemDef.id, 1);
  return { ok: true };
}
