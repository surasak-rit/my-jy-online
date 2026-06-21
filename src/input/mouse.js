// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// input/mouse.js — point-to-click: ส่ง tile (เล็งกริด), world (เดินลื่น)
// และ screen px (สำหรับ hit-test ตัวละคร/วัตถุที่เลือกได้) — §7.4
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('../render/camera.js').Camera} cam
 * @param {(pick:{tile:{x:number,y:number}, world:{x:number,y:number}, screen:{x:number,y:number}})=>void} onPick
 * @param {(screen:{x:number,y:number})=>boolean} [onHover] คืน true ถ้าชี้โดนเป้าที่เลือกได้ → เปลี่ยน cursor
 */
export function attachMouse(canvas, cam, onPick, onHover) {
  const toScreen = (/** @type {MouseEvent} */ e) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  canvas.addEventListener('click', (e) => {
    const sc = toScreen(e);
    const world = cam.screenToWorld(sc.x, sc.y);
    onPick({ tile: cam.worldToTile(world.x, world.y), world, screen: sc });
  });
  if (onHover) canvas.addEventListener('mousemove', (e) => {
    canvas.classList.toggle('over-target', !!onHover(toScreen(e)));
  });
}
