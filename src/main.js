// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// main.js — bootstrap (GDD §8): โหลด config → สร้าง Game → loop + input
// ──────────────────────────────────────────────────────────────────────────
import { Game } from './game.js';
import { startLoop } from './render/loop.js';
import { attachMouse } from './input/mouse.js';
import { initPanels } from './ui/panels.js';
import { initHud } from './ui/hud.js';
import { showCreate } from './ui/create.js';
import { showSlots } from './ui/slots.js';
import { initMenu, RETURN_MENU_FLAG } from './ui/menu.js';
import { latestSlot } from './state/save.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** @type {import('./game.js').Game|null} */
let game = null;

// DPR-aware: buffer = ขนาดจริง×dpr, แต่ "พิกัดวาด" เป็น logical (CSS px)
// → ภาพคมบนจอ retina และพิกัดเมาส์/กล้องตรงกัน (กันป้ายชื่อเพี้ยน/เลื่อน)
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // วาดด้วยพิกัด logical
  if (game) game.setViewport(innerWidth, innerHeight);
}
addEventListener('resize', resize); resize();

const getJSON = async (url) => (await fetch(url, { cache: 'no-cache' })).json();

async function boot() {
  // โหลด config (data-driven §7.2) — manifest รวมรายการ id ที่ต้อง preload
  // เพิ่มเนื้อหา (สำนัก/วิชา/มอน/ไอเทม/เควส) = แก้ data/manifest.json ไม่ต้องแตะโค้ด
  const manifest = await getJSON('data/manifest.json');
  const sects = {};
  for (const id of manifest.sects) sects[id] = await getJSON(`data/sects/${id}.json`);
  const mobDefs = {};
  for (const id of manifest.mobs) mobDefs[id] = await getJSON(`data/mobs/${id}.json`);
  const skillDefs = {};
  for (const id of manifest.skills) skillDefs[id] = await getJSON(`data/skills/${id}.json`);
  const itemDefs = {};
  for (const id of manifest.items) itemDefs[id] = await getJSON(`data/items/${id}.json`);
  const questDefs = {};
  for (const id of manifest.quests) questDefs[id] = await getJSON(`data/quests/${id}.json`);

  // เปิดเกม: ถ้ามีเซฟอยู่ → เข้าเกมจากบันทึกล่าสุดทันที (ข้ามหน้าเลือกช่อง)
  // ยกเว้นกด"กลับสู่หน้าหลัก" จากในเกม → บังคับโชว์หน้าเลือกช่อง
  const returningToMenu = sessionStorage.getItem(RETURN_MENU_FLAG) === '1';
  sessionStorage.removeItem(RETURN_MENU_FLAG);
  const auto = returningToMenu ? null : latestSlot();
  const slot = auto != null ? auto : await showSlots();
  game = new Game(ctx, canvas, sects, mobDefs, skillDefs, itemDefs, questDefs, slot);
  game.setViewport(innerWidth, innerHeight); // logical viewport หลังสร้าง game
  const panels = initPanels(game);
  const hudUI = initHud(game);
  initMenu(game); // เมนูมุมขวาบน (กลับสู่หน้าหลัก)
  game.onInteract = (npc) => panels.open(npc);
  await game.loadZone(game.startZoneId);

  // เริ่มเกมใหม่ → สร้างตัวละครก่อน (รอจนกดเริ่ม)
  if (game.needsCreation) await showCreate(game);

  attachMouse(canvas, game.cam, (pick) => game.handlePick(pick), (screen) => !!game.pickEntity(screen));
  // ปิด/รีเฟรชแท็บ → บันทึกตำแหน่งปัจจุบัน (เผื่อรีเฟรชระหว่างเดิน)
  addEventListener('beforeunload', () => game.saveState());
  // ปุ่ม I=กระเป๋า · N=เม็ดยาภายใน(内丹) · E=อุปกรณ์(裝備) — อ่าน keycode ใช้ได้ทุก layout/ภาษา
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyI') panels.openInventory();
    else if (e.code === 'KeyN') panels.openNeidan();
    else if (e.code === 'KeyE') panels.openEquip();
  });

  startLoop(
    (dt) => game.update(dt),
    () => { game.render(); hudUI.update(); },
  );
}

boot().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f88;padding:20px">โหลดเกมล้มเหลว: ${err}\n\nต้องเปิดผ่าน http server (ไม่ใช่ file://) — ดู README</pre>`;
  console.error(err);
});
