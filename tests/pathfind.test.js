// @ts-check
// รันด้วย: node --test  (vanilla, ไม่มี dependency — GDD §7.4)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPath } from '../src/core/pathfind.js';

// grid 5x5, # = บล็อก
//  . . . . .
//  . # # # .
//  . # . . .
//  . # . # .
//  . . . . .
const grid = [
  '.....',
  '.###.',
  '.#...',
  '.#.#.',
  '.....',
];
const bounds = { w: 5, h: 5 };
const walk = (x, y) => grid[y][x] === '.';

test('คืนเส้นทางที่ไปถึงเป้า และทุกช่องเดินได้', () => {
  const path = findPath({ x: 0, y: 0 }, { x: 4, y: 4 }, walk, bounds);
  assert.ok(path.length > 0, 'ต้องมีเส้นทาง');
  const last = path[path.length - 1];
  assert.deepEqual(last, { x: 4, y: 4 }, 'ช่องสุดท้าย = เป้าหมาย');
  for (const p of path) assert.ok(walk(p.x, p.y), `ช่อง ${p.x},${p.y} ต้องเดินได้`);
});

test('คืน [] เมื่อเป้าหมายเป็นกำแพง', () => {
  assert.deepEqual(findPath({ x: 0, y: 0 }, { x: 1, y: 1 }, walk, bounds), []);
});

test('คืน [] เมื่อ start = goal', () => {
  assert.deepEqual(findPath({ x: 2, y: 2 }, { x: 2, y: 2 }, walk, bounds), []);
});

test('ไม่ตัดมุมทะลุกำแพง (no corner cutting)', () => {
  const path = findPath({ x: 0, y: 0 }, { x: 2, y: 2 }, walk, bounds);
  // ต้องอ้อมลงล่าง ไม่ลัดทแยงผ่านมุม (1,1)/(1,2) ที่เป็นกำแพง
  for (const p of path) assert.ok(walk(p.x, p.y));
  assert.ok(path.length >= 4, 'ต้องอ้อม ไม่ลัดทแยง');
});
