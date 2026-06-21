// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equip, unequip, emptyEquipment, EQUIP_SLOTS } from '../src/core/equip.js';
import { recomputeStats } from '../src/core/skills.js';
import { countItem } from '../src/core/economy.js';

const ITEMS = {
  saber: { id: 'saber', type: 'equip', slot: 'weapon', name: 'ดาบ', bonus: { atk: 12 } },
  saber2: { id: 'saber2', type: 'equip', slot: 'weapon', name: 'ดาบ2', bonus: { atk: 5 } },
  amulet: { id: 'amulet', type: 'equip', slot: 'necklace', name: 'สร้อย', attr: { might: 5 } },
  potion: { id: 'potion', type: 'consumable', name: 'ยา' },
};
const mkP = () => ({
  baseAtk: 18, baseDef: 6, baseMaxHp: 100, baseMaxMp: 40, baseMaxStamina: 30, baseMaxFocus: 100,
  atk: 18, def: 6, maxHp: 100, hp: 100, mp: 40, maxMp: 40, stamina: 30, maxStamina: 30, focus: 100, maxFocus: 100,
  moveMult: 1, skills: {}, inventory: [{ itemId: 'saber', qty: 1 }], equipment: emptyEquipment(),
});

test('8 ช่องสวมใส่', () => assert.equal(EQUIP_SLOTS.length, 8));

test('สวมอุปกรณ์: ย้ายจากกระเป๋า→ช่อง', () => {
  const p = mkP();
  assert.equal(equip(p, ITEMS.saber).ok, true);
  assert.equal(p.equipment.weapon, 'saber');
  assert.equal(countItem(p, 'saber'), 0); // ออกจากกระเป๋าแล้ว
});

test('สวมทับช่องเดิม → ของเดิมคืนกระเป๋า', () => {
  const p = mkP();
  p.inventory.push({ itemId: 'saber2', qty: 1 });
  equip(p, ITEMS.saber);
  equip(p, ITEMS.saber2);
  assert.equal(p.equipment.weapon, 'saber2');
  assert.equal(countItem(p, 'saber'), 1); // ดาบเก่ากลับกระเป๋า
});

test('ของกินสวมไม่ได้', () => assert.equal(equip(mkP(), ITEMS.potion).ok, false));

test('ถอดอุปกรณ์ → กลับกระเป๋า', () => {
  const p = mkP();
  equip(p, ITEMS.saber);
  assert.equal(unequip(p, 'weapon').ok, true);
  assert.equal(p.equipment.weapon, null);
  assert.equal(countItem(p, 'saber'), 1);
});

test('recomputeStats รวมโบนัสอุปกรณ์ (ค่าตรง + 資質)', () => {
  const p = mkP();
  equip(p, ITEMS.saber);                 // atk +12
  p.inventory.push({ itemId: 'amulet', qty: 1 });
  equip(p, ITEMS.amulet);                // might +5 → atk +round(5*0.6)=3
  recomputeStats(p, {}, ITEMS);
  assert.equal(p.atk, 18 + 12 + 3);      // 33
});
