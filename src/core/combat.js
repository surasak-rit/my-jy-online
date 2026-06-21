// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/combat.js — สูตรการต่อสู้ (pure, ทดสอบได้, รันบน Node ได้ — §7.2)
// real-time tactical: ดาเมจ + hit-stun + cooldown (GDD §3.1)
// ──────────────────────────────────────────────────────────────────────────

/**
 * ดาเมจพื้นฐาน = atk ลดทอนด้วย def ครึ่งหนึ่ง (อย่างน้อย 1)
 * @param {number} atk
 * @param {number} def
 * @returns {number}
 */
export function computeDamage(atk, def) {
  return Math.max(1, Math.round(atk - (def || 0) * 0.5));
}

/**
 * โจมตี: ลด hp เป้าหมาย + ใส่ hit-stun · คืนผลลัพธ์
 * @param {{atk:number}} attacker
 * @param {{hp:number, def?:number, stun?:number}} target
 * @param {number} [hitStunMs=250] น้ำหนักการกระทบ (§3.1)
 * @returns {{ damage:number, killed:boolean }}
 */
export function attack(attacker, target, hitStunMs = 250) {
  const damage = computeDamage(attacker.atk, target.def || 0);
  target.hp -= damage;
  target.stun = Math.max(target.stun || 0, hitStunMs / 1000);
  return { damage, killed: target.hp <= 0 };
}

/** ระยะแบบ Chebyshev (ช่อง) — ใช้เช็ก "ประชิด" ในกริด iso */
export function tileDist(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
