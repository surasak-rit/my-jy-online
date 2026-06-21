// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/npcs.js — runtime NPC + AI เดินเล่น (wander) ให้เมืองดูมีชีวิต (pure, ทดสอบได้)
// เดินเนิบ ๆ รอบ "บ้าน" (จุดเกิดเดิม) · หยุด+หันหน้าหาผู้เล่นเมื่อเข้าใกล้/กำลังคุย
// ──────────────────────────────────────────────────────────────────────────
import { tileDist } from './combat.js';

const faceOf = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'E' : 'W') : (dy >= 0 ? 'S' : 'N'));

/**
 * สร้าง runtime NPC จาก zone.npcs (คงฟิลด์เดิม: id/name/role/archetype/sectId/at)
 * @param {any} zone
 * @param {(x:number,y:number)=>{x:number,y:number}} tileToWorld
 * @param {()=>number} [rng=Math.random]
 */
export function spawnNpcs(zone, tileToWorld, rng = Math.random) {
  return (zone.npcs || []).map((n) => {
    const w = tileToWorld(n.at.x, n.at.y);
    return {
      ...n,
      home: { x: n.at.x, y: n.at.y },
      tile: { x: n.at.x, y: n.at.y },
      pos: { x: w.x, y: w.y },
      facing: 'S', moving: false, step: 0, breath: rng() * 6.28,
      moveCd: 1 + rng() * 3,                 // หน่วงก่อนตัดสินใจครั้งแรก
      wanderRadius: n.wanderRadius || 2,      // รัศมีเดินเล่นรอบบ้าน
      wander: n.wander !== false,             // ตั้ง wander:false ใน JSON เพื่อให้ยืนนิ่ง
    };
  });
}

/** เลือกช่องเดินเล่นถัดไป (4 ทิศ, อยู่ในรัศมีบ้าน, เดินได้) — คืน null ถ้าหยุด */
function pickWanderTile(n, isWalkable, rng) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const d = dirs[Math.floor(rng() * 4)];
  const nx = n.tile.x + d[0], ny = n.tile.y + d[1];
  if (Math.abs(nx - n.home.x) > n.wanderRadius || Math.abs(ny - n.home.y) > n.wanderRadius) return null;
  if (!isWalkable(nx, ny)) return null;
  return { x: nx, y: ny };
}

/**
 * อัปเดต NPC ทุกตัว 1 เฟรม
 * @param {any[]} npcs
 * @param {number} dt
 * @param {Object} h
 * @param {(x:number,y:number)=>boolean} h.isWalkable
 * @param {(x:number,y:number)=>{x:number,y:number}} h.tileToWorld
 * @param {{x:number,y:number}} h.playerTile
 * @param {string|null} [h.interactId]   // NPC ที่ผู้เล่นกำลังจะคุย → หยุดรอ
 * @param {()=>number} [rng=Math.random]
 */
export function updateNpcs(npcs, dt, h, rng = Math.random) {
  for (const n of npcs) {
    n.breath = (n.breath || 0) + dt * 3;
    n.moveCd -= dt;
    const adj = tileDist(n.tile, h.playerTile) <= 1;          // ผู้เล่นอยู่ติด → หยุดคุย
    const frozen = n.wander === false || n.id === h.interactId || adj;

    const w = h.tileToWorld(n.tile.x, n.tile.y);
    const settled = Math.hypot(w.x - n.pos.x, w.y - n.pos.y) < 1;

    // ตัดสินใจเดินเล่นใหม่เมื่อถึงช่อง + หมดเวลาหน่วง + ไม่ถูกหยุด
    if (!frozen && settled && n.moveCd <= 0) {
      const next = pickWanderTile(n, h.isWalkable, rng);
      if (next && !(next.x === h.playerTile.x && next.y === h.playerTile.y)) n.tile = next;
      n.moveCd = 1.5 + rng() * 3; // พักก่อนก้าวต่อไป (ดูเนิบ ๆ เป็นธรรมชาติ)
    }

    // ทิศหัน: ติดผู้เล่น→หันหาผู้เล่น, ไม่งั้น→หันตามทางเดิน
    if (adj) {
      const pw = h.tileToWorld(h.playerTile.x, h.playerTile.y);
      const fdx = pw.x - n.pos.x, fdy = pw.y - n.pos.y;
      if (Math.hypot(fdx, fdy) > 2) n.facing = faceOf(fdx, fdy);
    }

    // ลื่น pos เข้าหา center ของ tile (NPC เดินช้ากว่ามอน — ดูเรื่อย ๆ)
    const ox = n.pos.x, oy = n.pos.y;
    const dx = w.x - n.pos.x, dy = w.y - n.pos.y, dist = Math.hypot(dx, dy);
    if (dist > 2 && !adj) n.facing = faceOf(dx, dy);
    const sp = 70 * dt;
    if (dist <= sp) { n.pos.x = w.x; n.pos.y = w.y; }
    else { n.pos.x += dx / dist * sp; n.pos.y += dy / dist * sp; }
    const moved = Math.hypot(n.pos.x - ox, n.pos.y - oy);
    n.moving = moved > 0.05;
    n.step = (n.step || 0) + moved * 0.22;
  }
}
