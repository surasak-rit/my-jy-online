// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDamage, attack, tileDist } from '../src/core/combat.js';
import { spawnFromZone, updateMobs } from '../src/core/mobs.js';

test('computeDamage: ลดด้วยครึ่ง def, อย่างน้อย 1', () => {
  assert.equal(computeDamage(18, 6), 15);
  assert.equal(computeDamage(5, 100), 1); // floor ที่ 1
});

test('attack: ลด hp + ใส่ stun + รายงาน killed', () => {
  const t = { hp: 10, def: 0 };
  const r1 = attack({ atk: 6 }, t);
  assert.equal(r1.damage, 6); assert.equal(t.hp, 4); assert.ok(t.stun > 0); assert.equal(r1.killed, false);
  const r2 = attack({ atk: 6 }, t);
  assert.equal(r2.killed, true);
});

test('tileDist: Chebyshev', () => {
  assert.equal(tileDist({ x: 0, y: 0 }, { x: 3, y: 1 }), 3);
});

test('spawn + chase + ตาย: มอนไล่ผู้เล่นแล้วถูกฆ่า', () => {
  const zone = { spawns: [{ mobId: 'm', tier: 1, max: 1, area: { x: 0, y: 0, w: 1, h: 1 } }] };
  const defs = { m: { id: 'm', name: 'หุ่น', maxHp: 12, atk: 5, def: 0, speed: 5, attackCdMs: 500, aggroRange: 5, respawnMs: 1000, xp: 10 } };
  const walk = () => true;
  const t2w = (x, y) => ({ x: x * 10, y: y * 10 });
  const mobs = spawnFromZone(zone, defs, walk, t2w, () => 0); // rng=0 → tile (0,0)
  assert.equal(mobs.length, 1);
  assert.deepEqual(mobs[0].tile, { x: 0, y: 0 });

  const player = { tile: { x: 3, y: 0 }, hp: 100 };
  // รันหลายเฟรม → มอนต้องเข้าสู่ chase และขยับเข้าใกล้
  for (let i = 0; i < 20; i++) updateMobs(mobs, player, 0.1, { isWalkable: walk, tileToWorld: t2w, onPlayerDamaged: (d) => { player.hp -= d; } });
  assert.equal(mobs[0].state, 'chase');
  assert.ok(player.hp < 100, 'ผู้เล่นต้องโดนตีเมื่อมอนประชิด');

  // ผู้เล่นฆ่ามอน
  let killed = false;
  for (let i = 0; i < 5 && !killed; i++) killed = attack({ atk: 10 }, mobs[0]).killed;
  assert.ok(killed);
});
