// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Q from '../src/core/quests.js';

const defs = {
  q_talk: { id: 'q_talk', giver: 'g', order: 1, name: 'คุย', steps: [{ kind: 'talk', npcId: 'master' }], rewards: { skillPoints: 8, soft: 20 } },
  q_kill: { id: 'q_kill', giver: 'g', order: 2, name: 'ปราบ', steps: [{ kind: 'kill', mobId: 'bandit', count: 3 }], rewards: { soft: 30, items: [{ id: 'potion_small', qty: 2 }] } },
};
const mkP = () => ({ quests: {}, skillPoints: 0, currency: 0, inventory: [] });

test('talk quest: accept → คุย → complete → reward', () => {
  const p = mkP();
  Q.accept(p, defs.q_talk);
  assert.equal(Q.isComplete(p, defs.q_talk), false);
  Q.onTalk(p, 'master', defs);
  assert.equal(Q.isComplete(p, defs.q_talk), true);
  assert.equal(Q.complete(p, defs.q_talk).ok, true);
  assert.equal(p.skillPoints, 8); assert.equal(p.currency, 20);
  assert.equal(p.quests.q_talk.state, 'done');
});

test('kill quest: นับถึง count แล้ว complete + ได้ไอเทม', () => {
  const p = mkP();
  Q.accept(p, defs.q_kill);
  Q.onKill(p, 'bandit', defs); Q.onKill(p, 'bandit', defs);
  assert.equal(Q.isComplete(p, defs.q_kill), false);   // 2/3
  Q.onKill(p, 'bandit', defs);
  assert.equal(Q.isComplete(p, defs.q_kill), true);    // 3/3
  Q.onKill(p, 'bandit', defs);                          // ไม่เกิน cap
  assert.equal(p.quests.q_kill.counts.bandit, 3);
  Q.complete(p, defs.q_kill);
  assert.equal(p.currency, 30);
  assert.equal(p.inventory.find((s) => s.itemId === 'potion_small').qty, 2);
});

test('complete ไม่ได้ถ้ายังไม่ครบ', () => {
  const p = mkP(); Q.accept(p, defs.q_kill);
  assert.equal(Q.complete(p, defs.q_kill).ok, false);
});
