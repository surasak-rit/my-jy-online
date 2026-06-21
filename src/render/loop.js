// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/loop.js — game loop ด้วย requestAnimationFrame (GDD §7.4)
// แยก update(dt) / render() ให้ชัด; ส่ง dt เป็นวินาที
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {(dt:number)=>void} update
 * @param {()=>void} render
 * @returns {{ stop:()=>void }}
 */
export function startLoop(update, render) {
  let last = performance.now();
  let running = true;
  function frame(now) {
    if (!running) return;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1; // กัน dt กระโดดตอนสลับแท็บ
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { stop() { running = false; } };
}
