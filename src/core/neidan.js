// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/neidan.js — ระบบเม็ดยาภายใน (五行内丹) (pure, ทดสอบได้)
// สายอัปเกรดยาว 取得→进化→幻化→仙化→玄化 (5 ขั้น) เลือกธาตุ 五行 ตอนหลอมครั้งแรก
// โบนัสรวมเข้าค่าต่อสู้ผ่าน recomputeStats — เป็น "ที่ใช้" ของ 学习点/เงินที่ฟาร์มมา
// ──────────────────────────────────────────────────────────────────────────

/** 5 ขั้นวิวัฒน์ของเม็ดยา (tier 1–5) */
export const NEIDAN_STAGES = [
  { tier: 1, cn: '凝丹', th: 'รวมเม็ดยา (取得)' },
  { tier: 2, cn: '进化', th: 'วิวัฒน์ (进化)' },
  { tier: 3, cn: '幻化', th: 'แปรรูป (幻化)' },
  { tier: 4, cn: '仙化', th: 'สู่เซียน (仙化)' },
  { tier: 5, cn: '玄化', th: 'เสวียนสูงสุด (玄化)' },
];
export const MAX_TIER = 5;

/** ธาตุ 五行 — เลือกตอนหลอมครั้งแรก, เน้นค่าต่างกัน */
export const ELEMENTS = [
  { key: 'metal', cn: '金', th: 'ทอง', emph: 'atk' },
  { key: 'wood', cn: '木', th: 'ไม้', emph: 'maxHp' },
  { key: 'water', cn: '水', th: 'น้ำ', emph: 'maxMp' },
  { key: 'fire', cn: '火', th: 'ไฟ', emph: 'atk' },
  { key: 'earth', cn: '土', th: 'ดิน', emph: 'def' },
];

/**
 * โบนัสจากเม็ดยา (สะสมตามขั้น + เน้นตามธาตุ)
 * @param {{tier:number, element?:string}|null|undefined} neidan
 * @returns {{atk:number, def:number, maxHp:number, maxMp:number}}
 */
export function neidanBonus(neidan) {
  const b = { atk: 0, def: 0, maxHp: 0, maxMp: 0 };
  if (!neidan || !neidan.tier) return b;
  const t = neidan.tier;
  b.maxHp = t * 15; b.maxMp = t * 8; b.atk = t * 2; b.def = t * 1; // ฐานทุกธาตุ
  const el = ELEMENTS.find((e) => e.key === neidan.element);
  if (el) {
    if (el.emph === 'atk') b.atk += t * 3;
    else if (el.emph === 'def') b.def += t * 3;
    else if (el.emph === 'maxHp') b.maxHp += t * 20;
    else if (el.emph === 'maxMp') b.maxMp += t * 10;
  }
  return b;
}

/** ต้นทุนเลื่อนจาก tier ปัจจุบัน → tier+1 (แพงขึ้นตามขั้น) */
export function neidanUpgradeCost(tier) {
  const next = tier + 1;
  return { sp: next * 5, coins: next * 50 };
}

/**
 * เช็กว่ายกขั้นเม็ดยาได้ไหม (ยังไม่สนใจธาตุ — ธาตุเลือกตอน tier 0)
 * @returns {{ok:boolean, reason?:string, cost?:{sp:number, coins:number}}}
 */
export function canUpgradeNeidan(player) {
  const n = player.neidan || { tier: 0 };
  if (n.tier >= MAX_TIER) return { ok: false, reason: 'max' };
  const cost = neidanUpgradeCost(n.tier);
  if ((player.skillPoints || 0) < cost.sp) return { ok: false, reason: 'sp', cost };
  if ((player.currency || 0) < cost.coins) return { ok: false, reason: 'coins', cost };
  return { ok: true, cost };
}

/**
 * ยกขั้นเม็ดยา (หัก SP+เงิน). ตอน tier 0 ต้องระบุธาตุ (เลือกครั้งเดียว ล็อกถาวร)
 * @param {string} [element] ใช้เฉพาะตอนหลอมครั้งแรก (tier 0→1)
 * @returns {{ok:boolean, reason?:string, cost?:object}}
 */
export function upgradeNeidan(player, element) {
  const r = canUpgradeNeidan(player);
  if (!r.ok) return r;
  const n = player.neidan || (player.neidan = { tier: 0, element: null });
  if (n.tier === 0) {
    if (!ELEMENTS.some((e) => e.key === element)) return { ok: false, reason: 'element' };
    n.element = element;
  }
  player.skillPoints -= /** @type {any} */ (r.cost).sp;
  player.currency -= /** @type {any} */ (r.cost).coins;
  n.tier += 1;
  return { ok: true };
}
