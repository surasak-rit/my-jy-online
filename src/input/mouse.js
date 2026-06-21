// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// input/mouse.js — point-to-click: คลิก → tile เป้าหมาย (GDD §7.4)
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('../render/camera.js').Camera} cam
 * @param {(tile:{x:number,y:number})=>void} onPick
 */
export function attachMouse(canvas, cam, onPick) {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    onPick(cam.screenToTile(sx, sy));
  });
}
