// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/mobs.js — spawn + AI ของมอนสเตอร์ (pure: รับ helpers, ไม่แตะ DOM)
// AI เบา: idle ที่ home → chase เมื่อผู้เล่นเข้าระยะ → attack เมื่อประชิด (§D.3 perf)
// ──────────────────────────────────────────────────────────────────────────
import { attack, tileDist } from './combat.js';

/**
 * @typedef {Object} Mob
 * @property {string} defId
 * @property {string} name
 * @property {string} archetype
 * @property {{x:number,y:number}} tile
 * @property {{x:number,y:number}} pos
 * @property {{x:number,y:number}} home
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} atk
 * @property {number} def
 * @property {"idle"|"chase"|"dead"} state
 * @property {number} moveCd
 * @property {number} atkCd
 * @property {number} stun
 * @property {number} respawn
 * @property {object} def_   // mob def เต็ม (xp ฯลฯ)
 */

/**
 * สร้างมอนจาก zone.spawns
 * @param {any} zone
 * @param {Record<string,any>} mobDefs   // defId → def
 * @param {(x:number,y:number)=>boolean} isWalkable
 * @param {(x:number,y:number)=>{x:number,y:number}} tileToWorld
 * @param {()=>number} [rng=Math.random]
 * @returns {Mob[]}
 */
export function spawnFromZone(zone, mobDefs, isWalkable, tileToWorld, rng = Math.random) {
  /** @type {Mob[]} */ const mobs = [];
  for (const sp of (zone.spawns || [])) {
    const def = mobDefs[sp.mobId];
    if (!def) continue;
    for (let i = 0; i < sp.max; i++) {
      let tx, ty, tries = 0;
      do {
        tx = sp.area.x + Math.floor(rng() * sp.area.w);
        ty = sp.area.y + Math.floor(rng() * sp.area.h);
      } while (!isWalkable(tx, ty) && ++tries < 30);
      const w = tileToWorld(tx, ty);
      mobs.push({
        defId: def.id, name: def.name, archetype: def.archetype || 'villager',
        tile: { x: tx, y: ty }, pos: { x: w.x, y: w.y }, home: { x: tx, y: ty },
        hp: def.maxHp, maxHp: def.maxHp, atk: def.atk, def: def.def,
        state: 'idle', facing: 'S', moving: false, step: 0, breath: Math.random() * 6.28,
        attackT: 0, hurtT: 0, moveCd: 0, atkCd: 0, stun: 0, respawn: 0, def_: def,
      });
    }
  }
  return mobs;
}

/**
 * อัปเดตมอนทุกตัว 1 เฟรม
 * @param {Mob[]} mobs
 * @param {{tile:{x:number,y:number}, hp:number}} player
 * @param {number} dt
 * @param {Object} h helpers
 * @param {(x:number,y:number)=>boolean} h.isWalkable
 * @param {(x:number,y:number)=>{x:number,y:number}} h.tileToWorld
 * @param {(dmg:number)=>void} h.onPlayerDamaged
 */
export function updateMobs(mobs, player, dt, h) {
  for (const m of mobs) {
    if (m.state === 'dead') {
      m.respawn -= dt;
      if (m.respawn <= 0) {
        m.hp = m.maxHp; m.state = 'idle'; m.tile = { ...m.home };
        const w = h.tileToWorld(m.home.x, m.home.y); m.pos = { x: w.x, y: w.y };
      }
      continue;
    }
    m.attackT = Math.max(0, (m.attackT || 0) - dt); // อนิเมชันฟันแขน
    m.hurtT = Math.max(0, (m.hurtT || 0) - dt);     // กระพริบแดงโดนตี
    if (m.stun > 0) { m.stun -= dt; continue; } // โดน hit-stun → ขยับ/ตีไม่ได้
    m.moveCd -= dt; m.atkCd -= dt;

    const d = tileDist(m.tile, player.tile);
    const aggro = m.def_.aggroRange || 5;
    if (d <= aggro) m.state = 'chase';
    else if (d > aggro + 3) m.state = 'idle';

    const target = m.state === 'chase' ? player.tile : m.home;

    // ประชิด + chase → โจมตี
    if (m.state === 'chase' && d <= 1 && m.atkCd <= 0) {
      const r = attack(m, /** @type {any} */(player), 150);
      h.onPlayerDamaged(r.damage);
      m.atkCd = (m.def_.attackCdMs || 1200) / 1000;
      m.attackT = 0.3; // ฟันแขนเข้าหาผู้เล่น
    } else if (m.moveCd <= 0 && (m.tile.x !== target.x || m.tile.y !== target.y) && !(m.state === 'chase' && d <= 1)) {
      // เดินทีละช่องเข้าหา target (greedy 4-dir)
      const step = stepToward(m.tile, target, h.isWalkable);
      if (step) { m.tile = step; m.moveCd = 1 / (m.def_.speed || 2); }
      else m.moveCd = 0.3;
    }

    // ทิศหัน: เข้าหาเป้าหมาย (world delta)
    const tgt = m.state === 'chase' ? player.tile : m.home;
    const tw = h.tileToWorld(tgt.x, tgt.y);
    const fdx = tw.x - m.pos.x, fdy = tw.y - m.pos.y;
    if (Math.hypot(fdx, fdy) > 2) m.facing = (Math.abs(fdx) >= Math.abs(fdy)) ? (fdx >= 0 ? 'E' : 'W') : (fdy >= 0 ? 'S' : 'N');

    // ลื่น pos เข้าหา center ของ tile + จังหวะเดิน (phase ผูกกับระยะที่ขยับจริง)
    const ox = m.pos.x, oy = m.pos.y;
    const w = h.tileToWorld(m.tile.x, m.tile.y);
    const dx = w.x - m.pos.x, dy = w.y - m.pos.y, dist = Math.hypot(dx, dy);
    const sp = 120 * dt;
    if (dist <= sp) { m.pos.x = w.x; m.pos.y = w.y; }
    else { m.pos.x += dx / dist * sp; m.pos.y += dy / dist * sp; }
    const moved = Math.hypot(m.pos.x - ox, m.pos.y - oy);
    m.moving = moved > 0.05;
    m.step = (m.step || 0) + moved * 0.22;
    m.breath = (m.breath || 0) + dt * 3;
  }
}

/** ก้าวเดียวแบบ greedy เข้าหา target (เลี่ยงช่องบล็อก) */
function stepToward(from, to, isWalkable) {
  const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y);
  const cands = [];
  if (dx) cands.push({ x: from.x + dx, y: from.y });
  if (dy) cands.push({ x: from.x, y: from.y + dy });
  for (const c of cands) if (isWalkable(c.x, c.y)) return c;
  return null;
}
