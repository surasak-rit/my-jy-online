// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/pathfind.js — A* pathfinding บน tile grid
// pure logic: ไม่แตะ DOM/Canvas → ทดสอบได้ + รันบน Node ได้ (GDD §7.2/§7.4)
// ──────────────────────────────────────────────────────────────────────────

/** @typedef {{ x:number, y:number }} TilePos */

/**
 * หา min-heap แบบง่าย (binary heap) สำหรับ open set
 * @template T
 */
class MinHeap {
  constructor() { /** @type {{k:number, v:T}[]} */ this.a = []; }
  get size() { return this.a.length; }
  push(k, v) {
    const a = this.a; a.push({ k, v }); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].k <= a[i].k) break;[a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length && last) {
      a[0] = last; let i = 0;
      for (;;) { let l = 2 * i + 1, r = l + 1, s = i; if (l < a.length && a[l].k < a[s].k) s = l; if (r < a.length && a[r].k < a[s].k) s = r; if (s === i) break;[a[s], a[i]] = [a[i], a[s]]; i = s; }
    }
    return top ? top.v : undefined;
  }
}

/**
 * A* — คืนเส้นทางจาก start (ไม่รวม) ถึง goal (รวม); [] ถ้าไปไม่ได้
 * @param {TilePos} start
 * @param {TilePos} goal
 * @param {(x:number,y:number)=>boolean} isWalkable
 * @param {{ w:number, h:number }} bounds
 * @param {boolean} [allowDiagonal=true]
 * @returns {TilePos[]}
 */
export function findPath(start, goal, isWalkable, bounds, allowDiagonal = true) {
  const { w, h } = bounds;
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const key = (x, y) => y * w + x;
  if (!inBounds(goal.x, goal.y) || !isWalkable(goal.x, goal.y)) return [];
  if (start.x === goal.x && start.y === goal.y) return [];

  const open = new MinHeap();
  /** @type {Map<number, number>} */ const came = new Map();
  /** @type {Map<number, number>} */ const g = new Map();
  const sk = key(start.x, start.y);
  g.set(sk, 0);
  open.push(0, start);

  const oct = (ax, ay, bx, by) => { // octile heuristic
    const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
    return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
  };
  const steps = allowDiagonal
    ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    : [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (open.size) {
    const cur = open.pop();
    if (!cur) break;
    if (cur.x === goal.x && cur.y === goal.y) return reconstruct(came, key, w, goal);
    const ck = key(cur.x, cur.y);
    const cg = g.get(ck) ?? Infinity;
    for (const [dx, dy] of steps) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!inBounds(nx, ny) || !isWalkable(nx, ny)) continue;
      // กันการตัดมุมผ่านกำแพง (diagonal corner-cutting)
      if (dx !== 0 && dy !== 0) {
        if (!isWalkable(cur.x + dx, cur.y) || !isWalkable(cur.x, cur.y + dy)) continue;
      }
      const step = (dx !== 0 && dy !== 0) ? Math.SQRT2 : 1;
      const nk = key(nx, ny);
      const tentative = cg + step;
      if (tentative < (g.get(nk) ?? Infinity)) {
        came.set(nk, ck);
        g.set(nk, tentative);
        open.push(tentative + oct(nx, ny, goal.x, goal.y), { x: nx, y: ny });
      }
    }
  }
  return [];
}

/**
 * @param {Map<number,number>} came
 * @param {(x:number,y:number)=>number} key
 * @param {number} w
 * @param {TilePos} goal
 */
function reconstruct(came, key, w, goal) {
  /** @type {TilePos[]} */ const path = [];
  let ck = key(goal.x, goal.y);
  while (came.has(ck)) {
    path.push({ x: ck % w, y: Math.floor(ck / w) });
    ck = /** @type {number} */ (came.get(ck));
  }
  path.reverse();
  return path;
}
