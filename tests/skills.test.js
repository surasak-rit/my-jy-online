// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canLearn, skillCost, learn, recomputeStats, unlockState } from '../src/core/skills.js';

const defs = {
  vajra_palm: { id: 'vajra_palm', name: 'ฝ่ามือ', type: 'external', maxRank: 5, cost: 6, perRank: { atk: 4 } },
  iron_body: { id: 'iron_body', name: 'กายเหล็ก', type: 'internal', maxRank: 5, cost: 6, perRank: { maxHp: 25, def: 2 } },
};

function mkPlayer() {
  return {
    baseAtk: 18, baseDef: 6, baseMaxHp: 100, baseMaxMp: 40, baseMaxStamina: 30, baseMaxFocus: 100,
    hp: 100, atk: 18, def: 6, maxHp: 100, mp: 40, maxMp: 40, stamina: 30, maxStamina: 30, focus: 100, maxFocus: 100,
    moveMult: 1, skills: {}, skillPoints: 100,
  };
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

test('ค่ากำเนิดเสริมหลอดพื้นฐาน 內力/體力/定力', () => {
  const p = mkPlayer();
  p.birthAttrs = { insight: 10, bone: 20, might: 10, focus: 20 };
  recomputeStats(p, defs);
  assert.equal(p.maxMp, 80);       // 40 + (10*2 + 20)
  assert.equal(p.maxStamina, 60);  // 30 + (10 + 20)
  assert.equal(p.maxFocus, 120);   // 100 + 20
});

test('เรียนเกิน maxRank ไม่ได้ / SP ไม่พอ', () => {
  const p = mkPlayer(); p.skillPoints = 5; // ไม่พอ (ต้อง 6)
  assert.equal(canLearn(p, defs.vajra_palm).ok, false);
  const p2 = mkPlayer();
  for (let i = 0; i < 5; i++) learn(p2, defs.vajra_palm);
  assert.equal(canLearn(p2, defs.vajra_palm).reason, 'max');
});

test('絕學 ปลดล็อกด้วยเควส (unlock.quest) — ต้องทำเควสสำเร็จก่อน', () => {
  const secret = { id: 's2', maxRank: 3, cost: 12, perRank: {}, unlock: { quest: 'sect_trial' } };
  const p = { skillPoints: 999, skills: {}, quests: {} };
  assert.equal(unlockState(p, secret).ok, false);
  assert.equal(canLearn(p, secret).reason, 'locked');
  p.quests['sect_trial'] = { state: 'done' };
  assert.equal(unlockState(p, secret).ok, true);
  assert.equal(canLearn(p, secret).ok, true);
});

test('絕學 ปลดล็อกด้วยเงื่อนไขฝึกวิชาก่อน (unlock.skill+rank)', () => {
  const secret = { id: 's1', maxRank: 5, cost: 10, perRank: {}, unlock: { skill: 'atk3', rank: 5 } };
  const p = { skillPoints: 999, skills: { atk3: { rank: 4 } }, quests: {} };
  assert.equal(canLearn(p, secret).reason, 'locked');   // ยังไม่ถึง r5
  p.skills.atk3.rank = 5;
  assert.equal(canLearn(p, secret).ok, true);
});

test('วิชาไม่มี unlock เรียนได้ตามปกติ', () => {
  const p = { skillPoints: 999, skills: {}, quests: {} };
  assert.equal(unlockState(p, { id: 'a', maxRank: 5, cost: 5, perRank: {} }).ok, true);
});
