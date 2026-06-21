// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neidanBonus, neidanUpgradeCost, canUpgradeNeidan, upgradeNeidan, MAX_TIER } from '../src/core/neidan.js';

const mkPlayer = (over = {}) => ({ skillPoints: 100, currency: 1000, neidan: { tier: 0, element: null }, ...over });

test('ยังไม่หลอม → ไม่มีโบนัส', () => {
  assert.deepEqual(neidanBonus(null), { atk: 0, def: 0, maxHp: 0, maxMp: 0 });
  assert.deepEqual(neidanBonus({ tier: 0, element: null }), { atk: 0, def: 0, maxHp: 0, maxMp: 0 });
});

test('โบนัสตามขั้น + เน้นตามธาตุ', () => {
  // tier 2, ธาตุไฟ (เน้น atk) → atk = 2*2 + 2*3 = 10, def = 2, maxHp = 30, maxMp = 16
  assert.deepEqual(neidanBonus({ tier: 2, element: 'fire' }), { atk: 10, def: 2, maxHp: 30, maxMp: 16 });
  // tier 1, ธาตุน้ำ (เน้น maxMp) → maxMp = 8 + 10 = 18
  assert.deepEqual(neidanBonus({ tier: 1, element: 'water' }), { atk: 2, def: 1, maxHp: 15, maxMp: 18 });
});

test('ต้นทุนแพงขึ้นตามขั้น', () => {
  assert.deepEqual(neidanUpgradeCost(0), { sp: 5, coins: 50 });
  assert.deepEqual(neidanUpgradeCost(4), { sp: 25, coins: 250 });
});

test('หลอมครั้งแรกต้องเลือกธาตุ + หัก SP/เงิน', () => {
  const p = mkPlayer();
  assert.equal(upgradeNeidan(p, 'badelement').ok, false); // ธาตุไม่ถูกต้อง
  const r = upgradeNeidan(p, 'metal');
  assert.equal(r.ok, true);
  assert.equal(p.neidan.tier, 1);
  assert.equal(p.neidan.element, 'metal');
  assert.equal(p.skillPoints, 95); // 100 - 5
  assert.equal(p.currency, 950);   // 1000 - 50
});

test('ยกขั้นต่อไม่ต้องเลือกธาตุ + ธาตุล็อกถาวร', () => {
  const p = mkPlayer({ neidan: { tier: 1, element: 'wood' } });
  const r = upgradeNeidan(p); // ไม่ส่ง element
  assert.equal(r.ok, true);
  assert.equal(p.neidan.tier, 2);
  assert.equal(p.neidan.element, 'wood'); // ไม่เปลี่ยน
});

test('SP/เงินไม่พอ → ยกขั้นไม่ได้', () => {
  assert.equal(canUpgradeNeidan(mkPlayer({ skillPoints: 0 })).reason, 'sp');
  assert.equal(canUpgradeNeidan(mkPlayer({ currency: 0 })).reason, 'coins');
});

test('ถึงขั้นสูงสุดแล้วยกต่อไม่ได้', () => {
  const p = mkPlayer({ neidan: { tier: MAX_TIER, element: 'earth' } });
  assert.equal(canUpgradeNeidan(p).reason, 'max');
  assert.equal(upgradeNeidan(p).ok, false);
});
