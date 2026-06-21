// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/skills.js — เรียน/อัปเกรดวิชา + คำนวณสเตตัสรวม (pure, ทดสอบได้ — §3.2/§3.3)
// progression ผูกกับวิชา ไม่ใช่เลเวล (Pillar 2)
// ──────────────────────────────────────────────────────────────────────────

/** ต้นทุน SP สำหรับไต่ไป rank ที่กำหนด (แพงขึ้นตาม rank) */
export function skillCost(def, rank) { return (def.cost || 5) * rank; }

/**
 * เช็กว่าผู้เล่นเรียน/อัปเกรดวิชานี้ได้ไหม
 * @returns {{ ok:boolean, cost?:number, reason?:string }}
 */
export function canLearn(player, def) {
  const cur = player.skills[def.id]?.rank || 0;
  if (cur >= def.maxRank) return { ok: false, reason: 'max' };
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
export function recomputeStats(player, skillDefs) {
  let atk = player.baseAtk, maxHp = player.baseMaxHp, def = player.baseDef, moveMult = 1;
  for (const id in player.skills) {
    const d = skillDefs[id]; if (!d) continue;
    const r = player.skills[id].rank, pr = d.perRank || {};
    atk += (pr.atk || 0) * r;
    maxHp += (pr.maxHp || 0) * r;
    def += (pr.def || 0) * r;
    moveMult += (pr.moveBonus || 0) * r;
  }
  player.atk = atk; player.maxHp = maxHp; player.def = def; player.moveMult = moveMult;
  if (player.hp > maxHp) player.hp = maxHp;
}
