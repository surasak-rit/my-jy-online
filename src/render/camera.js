// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/camera.js — isometric projection + viewport (GDD §7.4)
// แปลง tile coord ↔ screen coord และเลื่อนกล้องตามเป้าหมาย
// ──────────────────────────────────────────────────────────────────────────

/** @typedef {{ x:number, y:number }} Vec2 */

export class Camera {
  /**
   * @param {number} tileW
   * @param {number} tileH
   */
  constructor(tileW, tileH) {
    this.tileW = tileW;
    this.tileH = tileH;
    /** จุดศูนย์กลางที่กล้องมองอยู่ (world px) */
    this.focus = { x: 0, y: 0 };
    /** ขนาด canvas */
    this.viewW = 0;
    this.viewH = 0;
  }

  /** world px ที่ตรงกับศูนย์กลางของ tile (tx,ty) — ฐานเป็นจุดบนของ diamond */
  tileToWorld(tx, ty) {
    return {
      x: (tx - ty) * (this.tileW / 2),
      y: (tx + ty) * (this.tileH / 2),
    };
  }

  /** world px → screen px (หักล้างกล้อง + จัดกลาง canvas) */
  worldToScreen(wx, wy) {
    return {
      x: wx - this.focus.x + this.viewW / 2,
      y: wy - this.focus.y + this.viewH / 2,
    };
  }

  tileToScreen(tx, ty) {
    const w = this.tileToWorld(tx, ty);
    return this.worldToScreen(w.x, w.y);
  }

  /** screen px → world px (ต่อเนื่อง ไม่ปัด) */
  screenToWorld(sx, sy) {
    return { x: sx - this.viewW / 2 + this.focus.x, y: sy - this.viewH / 2 + this.focus.y };
  }

  /** world px → tile coord (เศษส่วน) — ผกผันของ iso projection */
  worldToTileF(wx, wy) {
    return {
      x: (wx / (this.tileW / 2) + wy / (this.tileH / 2)) / 2,
      y: (wy / (this.tileH / 2) - wx / (this.tileW / 2)) / 2,
    };
  }

  /** world px → tile coord (ปัดเป็นจำนวนเต็ม) */
  worldToTile(wx, wy) {
    const f = this.worldToTileF(wx, wy);
    return { x: Math.round(f.x), y: Math.round(f.y) };
  }

  /** screen px → tile coord (ปัด) */
  screenToTile(sx, sy) {
    const w = this.screenToWorld(sx, sy);
    return this.worldToTile(w.x, w.y);
  }

  /** เลื่อนกล้องเข้าหา world point อย่างนุ่มนวล */
  follow(wx, wy, lerp = 0.15) {
    this.focus.x += (wx - this.focus.x) * lerp;
    this.focus.y += (wy - this.focus.y) * lerp;
  }
}
