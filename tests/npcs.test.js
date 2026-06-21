// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnNpcs, updateNpcs } from '../src/core/npcs.js';

const ZONE = { npcs: [{ id: 'merchant', name: 'พ่อค้า', archetype: 'merchant', at: { x: 5, y: 5 } }] };
const tileToWorld = (x, y) => ({ x: x * 10, y: y * 10 });
const walkAll = () => true;

test('spawnNpcs สร้าง runtime จาก zone.npcs (คงฟิลด์เดิม + home/tile/pos)', () => {
  const npcs = spawnNpcs(ZONE, tileToWorld, () => 0);
  assert.equal(npcs.length, 1);
  const n = npcs[0];
  assert.equal(n.id, 'merchant');
  assert.deepEqual(n.home, { x: 5, y: 5 });
  assert.deepEqual(n.tile, { x: 5, y: 5 });
  assert.deepEqual(n.pos, { x: 50, y: 50 });
  assert.equal(n.wander, true);
});

test('เดินเล่นภายในรัศมีบ้าน (ไม่หลุดออกไกล)', () => {
  const npcs = spawnNpcs(ZONE, tileToWorld, () => 0);
  npcs[0].moveCd = 0;
  // รันหลายเฟรม ด้วย rng ที่บังคับเลือกทิศต่าง ๆ
  let r = 0; const rng = () => { r = (r + 0.27) % 1; return r; };
  for (let i = 0; i < 2000; i++) {
    updateNpcs(npcs, 0.1, { isWalkable: walkAll, tileToWorld, playerTile: { x: 99, y: 99 }, interactId: null }, rng);
  }
  assert.ok(Math.abs(npcs[0].tile.x - 5) <= 2, 'x ในรัศมี 2');
  assert.ok(Math.abs(npcs[0].tile.y - 5) <= 2, 'y ในรัศมี 2');
});

test('ผู้เล่นอยู่ติด → NPC หยุดเดินและหันหาผู้เล่น', () => {
  const npcs = spawnNpcs(ZONE, tileToWorld, () => 0);
  npcs[0].moveCd = 0;
  const before = { ...npcs[0].tile };
  // ผู้เล่นอยู่ทางขวา (ช่องติดกัน)
  for (let i = 0; i < 50; i++) {
    updateNpcs(npcs, 0.1, { isWalkable: walkAll, tileToWorld, playerTile: { x: 6, y: 5 }, interactId: null }, () => 0);
  }
  assert.deepEqual(npcs[0].tile, before, 'ไม่ขยับช่องตอนผู้เล่นติด');
  assert.equal(npcs[0].facing, 'E', 'หันไปทางผู้เล่น (ขวา)');
});

test('interactId → NPC นั้นหยุดรอ (ไม่เดินหนี)', () => {
  const npcs = spawnNpcs(ZONE, tileToWorld, () => 0);
  npcs[0].moveCd = 0;
  const before = { ...npcs[0].tile };
  let r = 0; const rng = () => { r = (r + 0.27) % 1; return r; };
  for (let i = 0; i < 100; i++) {
    updateNpcs(npcs, 0.1, { isWalkable: walkAll, tileToWorld, playerTile: { x: 99, y: 99 }, interactId: 'merchant' }, rng);
  }
  assert.deepEqual(npcs[0].tile, before);
});
