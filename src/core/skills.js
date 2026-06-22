// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/skills.js — เรียน/อัปเกรดวิชา + คำนวณสเตตัสรวม (pure, ทดสอบได้ — §3.2/§3.3)
// progression ผูกกับวิชา ไม่ใช่เลเวล (Pillar 2)
// ──────────────────────────────────────────────────────────────────────────
import { neidanBonus } from './neidan.js';

/** ต้นทุน SP สำหรับไต่ไป rank ที่กำหนด (แพงขึ้นตาม rank) */
export function skillCost(def, rank) { return (def.cost || 5) * rank; }

/**
 * เงื่อนไขปลดล็อกวิชา (絕學/วิชาเควส) — unlock.quest=ทำเควสสำเร็จ · unlock.skill+rank=ฝึกวิชาก่อนถึงระดับ
 * @returns {{ ok:boolean, note?:string }}
 */
export function unlockState(player, def) {
  const u = def.unlock; if (!u) return { ok: true };
  if (u.quest && player.quests?.[u.quest]?.state !== 'done')
    return { ok: false, note: 'ต้องผ่านบททดสอบสำนัก (เควส) ก่อน' };
  if (u.skill && (player.skills?.[u.skill]?.rank || 0) < (u.rank || 1))
    return { ok: false, note: `ต้องฝึกวิชาเอกขั้นสูงถึงระดับ ${u.rank || 1} ก่อน` };
  return { ok: true };
}

/**
 * เช็กว่าผู้เล่นเรียน/อัปเกรดวิชานี้ได้ไหม
 * @returns {{ ok:boolean, cost?:number, reason?:string, note?:string }}
 */
export function canLearn(player, def) {
  const cur = player.skills[def.id]?.rank || 0;
  if (cur >= def.maxRank) return { ok: false, reason: 'max' };
  const u = unlockState(player, def);
  if (!u.ok) return { ok: false, reason: 'locked', note: u.note };
  const cost = skillCost(def, cur + 1);
  if ((player.skillPoints || 0) < cost) return { ok: false, reason: 'sp', cost };
  return { ok: true, cost };
}

/** เรียน/อัปเกรด 1 ระดับ (หัก SP). คืน {ok, reason?} */
export function learn(player, def) {
  const c = canLearn(player, def);
  if (!c.ok) return c;
  player.skillPoints -= /** @type {number} */ (c.cost);
  player.skills[def.id] = player.skills[def.id] || { rank: 0 };
  player.skills[def.id].rank++;
  return { ok: true };
}

/**
 * คำนวณสเตตัสรวมจาก base + โบนัสวิชาที่เรียน (เรียกหลังเรียน/โหลด)
 * @param {any} player ต้องมี baseAtk/baseMaxHp/baseDef + skills{}
 * @param {Record<string,any>} skillDefs
 */
export function recomputeStats(player, skillDefs, itemDefs = {}) {
  let atk = player.baseAtk, maxHp = player.baseMaxHp, def = player.baseDef, moveMult = 1;
  let maxMp = player.baseMaxMp || 0, maxStamina = player.baseMaxStamina || 0, maxFocus = player.baseMaxFocus || 0;
  // รวมโบนัสอุปกรณ์ที่สวม: ค่ากำเนิด (attr) รวมเข้ากับค่ากำเนิดฐาน · ค่าตรง (bonus) บวกท้าย
  const b = Object.assign({}, player.birthAttrs || {});
  let eqAtk = 0, eqDef = 0, eqHp = 0, eqMp = 0;
  for (const slot in (player.equipment || {})) {
    const id = player.equipment[slot]; if (!id) continue;
    const d = itemDefs[id]; if (!d) continue;
    const bo = d.bonus || {}; eqAtk += bo.atk || 0; eqDef += bo.def || 0; eqHp += bo.maxHp || 0; eqMp += bo.maxMp || 0;
    const at = d.attr || {}; for (const k in at) b[k] = (b[k] || 0) + at[k];
  }
  // ค่ากำเนิด (資質, รวมจากอุปกรณ์) → ค่าต่อสู้ + ค่าพื้นฐาน (GDD §สเตตัส C / §基本屬性)
  maxHp += Math.round((b.bone || 0) * 4);    // 1 กระดูก ≈ +4 HP (อิง 根骨=เลือด)
  atk += Math.round((b.might || 0) * 0.6);   // พลังแขน → ผลโจมตีกายภาพ
  def += Math.round((b.focus || 0) * 0.3);   // สมาธิ/定力 → ต้านทาน
  maxMp += Math.round((b.insight || 0) * 2 + (b.bone || 0)); // รู้แจ้ง+กระดูก → กำลังภายใน (內力)
  maxStamina += Math.round((b.might || 0) + (b.bone || 0));  // พลังแขน+กระดูก → สติ (體力)
  maxFocus += Math.round((b.focus || 0));                    // สมาธิ → 定力
  // เม็ดยาภายใน (五行内丹) — เสริมค่าต่อสู้ตามขั้น+ธาตุ
  const nb = neidanBonus(player.neidan);
  atk += nb.atk; def += nb.def; maxHp += nb.maxHp; maxMp += nb.maxMp;
  for (const id in player.skills) {
    const d = skillDefs[id]; if (!d) continue;
    const r = player.skills[id].rank, pr = d.perRank || {};
    atk += (pr.atk || 0) * r;
    maxHp += (pr.maxHp || 0) * r;
    def += (pr.def || 0) * r;
    moveMult += (pr.moveBonus || 0) * r;
    maxMp += (pr.maxMp_ || 0) * r; // หมายเหตุ: perRank.maxMp_ เผื่อวิชาเสริม內力 (ยังไม่มี def ใช้)
  }
  atk += eqAtk; def += eqDef; maxHp += eqHp; maxMp += eqMp; // โบนัสตรงจากอุปกรณ์
  player.atk = atk; player.maxHp = maxHp; player.def = def; player.moveMult = moveMult;
  player.maxMp = maxMp; player.maxStamina = maxStamina; player.maxFocus = maxFocus;
  if (player.hp > maxHp) player.hp = maxHp;
  if (player.mp > maxMp) player.mp = maxMp;
  if (player.stamina > maxStamina) player.stamina = maxStamina;
  if (player.focus > maxFocus) player.focus = maxFocus;
}
