// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// main.js — bootstrap Phase 0 (GDD §8): โหลด data → สร้าง player → loop + input
// เกณฑ์ผ่าน Phase 0: เปิดผ่าน static server แล้วเดินตัวละครในโซน isometric ได้
// ──────────────────────────────────────────────────────────────────────────
import { Camera } from './render/camera.js';
import { drawTileMap } from './render/tilemap.js';
import { drawCharacter, drawNameplate, ARCHETYPE_COLOR } from './render/sprites.js';
import { startLoop } from './render/loop.js';
import { attachMouse } from './input/mouse.js';
import { findPath } from './core/pathfind.js';
import { save, load } from './state/save.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
const hud = /** @type {HTMLElement} */ (document.getElementById('hud'));

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize); resize();

/** @param {string} url */
const getJSON = async (url) => (await fetch(url)).json();

async function boot() {
  // ── โหลด data (data-driven §7.2) ──
  const [zone, sect] = await Promise.all([
    getJSON('data/zones/jiuhe_town.json'),
    getJSON('data/sects/vajra_cliff.json'),
  ]);
  /** @type {import('./types.js').TileMap} */
  const map = await getJSON(zone.tilemapRef);

  const cam = new Camera(map.tileWidth, map.tileHeight);
  cam.viewW = canvas.width; cam.viewH = canvas.height;
  const isWalkable = (x, y) => map.collision[y * map.width + x] === 0;

  // ── player (no level! §3.3) — กู้ตำแหน่งจาก save ถ้ามี ──
  const saved = /** @type {any} */ (load());
  /** @type {import('./types.js').Character} */
  const player = {
    id: 'player', displayName: 'จอมยุทธ์น้อย',
    activeTitle: 'ศิษย์ใหม่', sectId: sect.id,
    tile: saved?.tile ?? { x: 14, y: 20 },
    pos: { x: 0, y: 0 }, path: [], hp: 100, maxHp: 100,
  };
  { const w = cam.tileToWorld(player.tile.x, player.tile.y); player.pos.x = w.x; player.pos.y = w.y; }

  const sectInfo = { name: sect.name, crest: sect.crest, color: sect.art.palette.accent };

  // ── input: คลิก → A* → ตั้ง path ──
  attachMouse(canvas, cam, (goal) => {
    if (goal.x < 0 || goal.y < 0 || goal.x >= map.width || goal.y >= map.height) return;
    if (!isWalkable(goal.x, goal.y)) return;
    player.path = findPath(player.tile, goal, isWalkable, { w: map.width, h: map.height });
  });

  const SPEED = 150; // px/วินาที

  function update(dt) {
    cam.viewW = canvas.width; cam.viewH = canvas.height;
    // เดินตาม path: เลื่อน pos เข้าหา center ของช่องถัดไป
    if (player.path.length) {
      const next = player.path[0];
      const target = cam.tileToWorld(next.x, next.y);
      const dx = target.x - player.pos.x, dy = target.y - player.pos.y;
      const dist = Math.hypot(dx, dy);
      const step = SPEED * dt;
      if (dist <= step) {
        player.pos.x = target.x; player.pos.y = target.y;
        player.tile = next; player.path.shift();
        if (!player.path.length) save({ tile: player.tile });
      } else {
        player.pos.x += (dx / dist) * step;
        player.pos.y += (dy / dist) * step;
      }
    }
    cam.follow(player.pos.x, player.pos.y);
  }

  function render() {
    ctx.fillStyle = '#1b2a1b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTileMap(ctx, map, cam);

    // รวม entity แล้ว sort ตาม depth (tx+ty) เพื่อ z-order ที่ถูกต้อง (§C)
    const ents = [
      ...zone.npcs.map((n) => ({ kind: 'npc', n, depth: n.at.x + n.at.y })),
      { kind: 'player', depth: player.tile.x + player.tile.y },
    ].sort((a, b) => a.depth - b.depth);

    for (const e of ents) {
      if (e.kind === 'npc') {
        const n = /** @type {any} */ (e).n;
        const s = cam.tileToScreen(n.at.x, n.at.y);
        s.y += map.tileHeight / 2; // จัดเท้าให้อยู่กลางช่อง
        drawCharacter(ctx, s.x, s.y, ARCHETYPE_COLOR[n.archetype] || '#888', 0.85);
        drawNameplate(ctx, s.x, s.y, {
          name: n.name, role: n.role || undefined,
          sect: n.sectId === sect.id ? sectInfo : null,
        }, 0.85);
      } else {
        const s = cam.worldToScreen(player.pos.x, player.pos.y);
        s.y += map.tileHeight / 2;
        drawCharacter(ctx, s.x, s.y, '#3b5b8c', 1);
        drawNameplate(ctx, s.x, s.y, {
          name: player.displayName, title: player.activeTitle,
          sect: sectInfo, hpBar: { hp: player.hp, maxHp: player.maxHp },
        }, 1);
      }
    }
    hud.textContent = `${zone.name}  ·  ช่อง (${player.tile.x}, ${player.tile.y})  ·  คลิกเพื่อเดิน`;
  }

  startLoop(update, render);
}

boot().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f88;padding:20px">โหลดเกมล้มเหลว: ${err}\n\nต้องเปิดผ่าน http server (ไม่ใช่ file://) — ดู README</pre>`;
  console.error(err);
});
