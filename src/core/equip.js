// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/equip.js — ระบบสวมใส่อุปกรณ์ (裝備) 8 ช่อง (pure, ทดสอบได้)
// โบนัสรวมเข้า recomputeStats: bonus={atk,def,maxHp,maxMp} + attr={資質}
// ──────────────────────────────────────────────────────────────────────────
import { addItem, removeItem, countItem } from './economy.js';

/** 8 ช่องสวมใส่ (อิงหน้าต่าง裝備 ของ JY) */
export const EQUIP_SLOTS = [
  { key: 'head', th: 'หัว', cn: '頭部' },
  { key: 'necklace', th: 'สร้อยคอ', cn: '項鍊' },
  { key: 'body', th: 'เสื้อ/เกราะ', cn: '衣服' },
  { key: 'bracers', th: 'สนับแขน', cn: '護腕' },
  { key: 'ring', th: 'แหวน', cn: '戒指' },
  { key: 'cloak', th: 'ผ้าคลุม', cn: '披風' },
  { key: 'shoes', th: 'รองเท้า', cn: '鞋' },
  { key: 'weapon', th: 'อาวุธ', cn: '武器' },
];
const SLOT_KEYS = new Set(EQUIP_SLOTS.map((s) => s.key));

/** ออบเจกต์ช่องว่างครบ 8 ช่อง */
export function emptyEquipment() {
  /** @type {Record<string, string|null>} */
  const e = {};
  for (const s of EQUIP_SLOTS) e[s.key] = null;
  return e;
}

/** สวมอุปกรณ์ (ย้ายจากกระเป๋า→ช่อง, ถอดของเดิมคืนกระเป๋า) */
export function equip(player, def) {
  if (!def || def.type !== 'equip') return { ok: false, reason: 'type' };
  if (!SLOT_KEYS.has(def.slot)) return { ok: false, reason: 'slot' };
  if (countItem(player, def.id) <= 0) return { ok: false, reason: 'none' };
  player.equipment = player.equipment || emptyEquipment();
  removeItem(player, def.id, 1);
  const prev = player.equipment[def.slot];
  if (prev) addItem(player, prev, 1);
  player.equipment[def.slot] = def.id;
  return { ok: true, slot: def.slot };
}

/** ถอดอุปกรณ์ (ช่อง→กระเป๋า) */
export function unequip(player, slot) {
  player.equipment = player.equipment || emptyEquipment();
  const id = player.equipment[slot];
  if (!id) return { ok: false, reason: 'empty' };
  addItem(player, id, 1);
  player.equipment[slot] = null;
  return { ok: true, id };
}

/** สรุปบรรทัดโบนัสของไอเทม (ไว้โชว์ใน UI) */
export function bonusText(def) {
  const parts = [];
  const b = def.bonus || {};
  if (b.atk) parts.push(`⚔️+${b.atk}`);
  if (b.def) parts.push(`🛡️+${b.def}`);
  if (b.maxHp) parts.push(`❤️+${b.maxHp}`);
  if (b.maxMp) parts.push(`內力+${b.maxMp}`);
  const a = def.attr || {};
  const TH = { might: 'พลังแขน', insight: 'รู้แจ้ง', focus: 'สมาธิ', bone: 'กระดูก', agility: 'ปฏิภาณ', courage: 'ความกล้า', fortune: 'วาสนา' };
  for (const k in a) parts.push(`${TH[k] || k}+${a[k]}`);
  return parts.join(' · ');
}
