// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// input/mouse.js — point-to-click: ส่งทั้ง tile (สำหรับเล็งศัตรู/NPC)
// และ world point (สำหรับเดินลื่นต่อเนื่อง ไม่ snap กริด) — §7.4
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('../render/camera.js').Camera} cam
 * @param {(pick:{tile:{x:number,y:number}, world:{x:number,y:number}})=>void} onPick
 */
export function attachMouse(canvas, cam, onPick) {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = cam.screenToWorld(sx, sy);
    onPick({ tile: cam.worldToTile(world.x, world.y), world });
  });
}
