// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canLearn, skillCost, learn, recomputeStats } from '../src/core/skills.js';

const defs = {
  vajra_palm: { id: 'vajra_palm', name: 'ฝ่ามือ', type: 'external', maxRank: 5, cost: 6, perRank: { atk: 4 } },
  iron_body: { id: 'iron_body', name: 'กายเหล็ก', type: 'internal', maxRank: 5, cost: 6, perRank: { maxHp: 25, def: 2 } },
};

function mkPlayer() {
  return { baseAtk: 18, baseDef: 6, baseMaxHp: 100, hp: 100, atk: 18, def: 6, maxHp: 100, moveMult: 1, skills: {}, skillPoints: 100 };
}

test('skillCost แพงขึ้นตาม rank', () => {
  assert.equal(skillCost(defs.vajra_palm, 1), 6);
  assert.equal(skillCost(defs.vajra_palm, 3), 18);
});

test('เรียนแล้วหัก SP + recompute เพิ่ม atk', () => {
  const p = mkPlayer();
  assert.equal(learn(p, defs.vajra_palm).ok, true);
  assert.equal(p.skillPoints, 94);
  recomputeStats(p, defs);
  assert.equal(p.atk, 22); // 18 + 4*rank1
});

test('internal เพิ่ม maxHp + def', () => {
  const p = mkPlayer();
  learn(p, defs.iron_body); learn(p, defs.iron_body); // rank 2
  recomputeStats(p, defs);
  assert.equal(p.maxHp, 150); // 100 + 25*2
  assert.equal(p.def, 10);    // 6 + 2*2
});

test('ค่ากำเนิด (資質) เสริม atk/def/maxHp', () => {
  const p = mkPlayer();
  p.birthAttrs = { bone: 20, might: 10, focus: 20 }; // กระดูก/พลังแขน/สมาธิ
  recomputeStats(p, defs);
  assert.equal(p.maxHp, 180); // 100 + 20*4
  assert.equal(p.atk, 24);    // 18 + round(10*0.6)
  assert.equal(p.def, 12);    // 6 + round(20*0.3)
});

test('เรียนเกิน maxRank ไม่ได้ / SP ไม่พอ', () => {
  const p = mkPlayer(); p.skillPoints = 5; // ไม่พอ (ต้อง 6)
  assert.equal(canLearn(p, defs.vajra_palm).ok, false);
  const p2 = mkPlayer();
  for (let i = 0; i < 5; i++) learn(p2, defs.vajra_palm);
  assert.equal(canLearn(p2, defs.vajra_palm).reason, 'max');
});
