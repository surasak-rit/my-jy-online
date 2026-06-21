// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnStrike, updateFx, FACE_ANGLE } from '../src/render/fx.js';

test('spawnStrike เก็บพารามิเตอร์เลเยอร์ของเอฟเฟกต์', () => {
  const list = [];
  spawnStrike(list, 100, 200, { color: '#a98be6', rings: 3, sparks: 6, core: true, power: 2, angle: FACE_ANGLE.E });
  assert.equal(list.length, 1);
  const f = list[0];
  assert.equal(f.color, '#a98be6');
  assert.equal(f.rings, 3);
  assert.equal(f.core, true);
  assert.equal(f.power, 2);
  assert.equal(f.t, 0);
  assert.ok(f.dur > 0);
});

test('spawnStrike ใส่ค่าเริ่มต้นเมื่อไม่ระบุ', () => {
  const list = [];
  spawnStrike(list, 0, 0, {});
  const f = list[0];
  assert.equal(f.arcs, 0);
  assert.equal(f.rings, 0);
  assert.equal(f.sparks, 6); // ค่าเริ่มต้น
  assert.equal(f.core, false);
});

test('updateFx เดินเวลา + คัดตัวหมดอายุ', () => {
  let list = [];
  spawnStrike(list, 0, 0, { dur: 0.3 });
  list = updateFx(list, 0.1);
  assert.equal(list.length, 1);
  assert.ok(Math.abs(list[0].t - 0.1) < 1e-9);
  list = updateFx(list, 0.3); // เกิน dur → ถูกคัดออก
  assert.equal(list.length, 0);
});

test('FACE_ANGLE map ทิศหันถูกต้อง', () => {
  assert.equal(FACE_ANGLE.E, 0);
  assert.equal(FACE_ANGLE.W, Math.PI);
  assert.equal(FACE_ANGLE.S, Math.PI / 2);
  assert.equal(FACE_ANGLE.N, -Math.PI / 2);
});
