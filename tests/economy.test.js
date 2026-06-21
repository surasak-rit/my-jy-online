// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addItem, removeItem, countItem, buy, sell, useConsumable } from '../src/core/economy.js';

const potion = { id: 'potion_small', name: 'ยา', type: 'consumable', price: 15, heal: 45 };

function mkP() { return { currency: 30, hp: 50, maxHp: 100, inventory: [] }; }

test('add/remove/count item (stack)', () => {
  const p = mkP();
  addItem(p, 'x', 2); addItem(p, 'x', 3);
  assert.equal(countItem(p, 'x'), 5);
  assert.equal(removeItem(p, 'x', 4), true);
  assert.equal(countItem(p, 'x'), 1);
  assert.equal(removeItem(p, 'x', 5), false); // ไม่พอ
});

test('buy: หักเงิน + ได้ของ; เงินไม่พอ = fail', () => {
  const p = mkP();
  assert.equal(buy(p, potion).ok, true);
  assert.equal(p.currency, 15);
  assert.equal(countItem(p, 'potion_small'), 1);
  buy(p, potion); // เหลือ 0
  assert.equal(buy(p, potion).reason, 'money');
});

test('useConsumable: ฟื้น HP (ไม่เกิน max) + ลดของ', () => {
  const p = mkP(); addItem(p, 'potion_small', 1);
  assert.equal(useConsumable(p, potion).ok, true);
  assert.equal(p.hp, 95);              // 50 + 45
  assert.equal(countItem(p, 'potion_small'), 0);
  p.hp = 80; addItem(p, 'potion_small', 1);
  useConsumable(p, potion);
  assert.equal(p.hp, 100);             // cap ที่ max
});

test('sell: ได้ครึ่งราคา', () => {
  const p = mkP(); addItem(p, 'potion_small', 1);
  sell(p, potion);
  assert.equal(p.currency, 30 + 7);    // floor(15/2)=7
});
