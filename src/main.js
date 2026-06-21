// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// main.js — bootstrap (GDD §8): โหลด config → สร้าง Game → loop + input
// ──────────────────────────────────────────────────────────────────────────
import { Game } from './game.js';
import { startLoop } from './render/loop.js';
import { attachMouse } from './input/mouse.js';
import { initPanels } from './ui/panels.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
const hud = /** @type {HTMLElement} */ (document.getElementById('hud'));

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize); resize();

const getJSON = async (url) => (await fetch(url)).json();

async function boot() {
  // โหลด config (data-driven §7.2)
  const sects = {};
  for (const id of ['vajra_cliff']) sects[id] = await getJSON(`data/sects/${id}.json`);
  const mobDefs = {};
  for (const id of ['mob_petty_bandit', 'mob_gray_wolf']) mobDefs[id] = await getJSON(`data/mobs/${id}.json`);
  const skillDefs = {};
  for (const id of ['vajra_palm', 'iron_body', 'cloud_step']) skillDefs[id] = await getJSON(`data/skills/${id}.json`);

  const game = new Game(ctx, canvas, sects, mobDefs, skillDefs);
  const panels = initPanels(game);
  game.onInteract = (npc) => panels.open(npc);
  await game.loadZone(game.startZoneId);

  attachMouse(canvas, game.cam, (tile) => game.handlePick(tile));

  startLoop(
    (dt) => game.update(dt),
    () => { game.render(); hud.textContent = game.hudText(); },
  );
}

boot().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f88;padding:20px">โหลดเกมล้มเหลว: ${err}\n\nต้องเปิดผ่าน http server (ไม่ใช่ file://) — ดู README</pre>`;
  console.error(err);
});
