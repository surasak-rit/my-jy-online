// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/tilemap.js — วาด isometric tilemap (placeholder art: diamond สี)
// ยังไม่มี asset จริง → ใช้สีแทนชนิดพื้น (GDD §C: art pipeline ภายหลัง)
// ──────────────────────────────────────────────────────────────────────────

/** สีพื้นตามดัชนี ground: 0 หญ้า, 1 ทางดิน, 2 ลานหิน, 3 น้ำ */
const GROUND_COLORS = ['#3f6b3a', '#8a6f48', '#9a958c', '#2f5d86']; // ขอบ/เงา
const GROUND_TOP = ['#4e7d46', '#9a7d54', '#b3aea4', '#3f72a0'];   // ผิวบน

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../types.js').TileMap} map
 * @param {import('./camera.js').Camera} cam
 */
export function drawTileMap(ctx, map, cam) {
  const { width, height, tileWidth: tw, tileHeight: th } = map;
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const s = cam.tileToScreen(tx, ty);
      // cull นอกจอ
      if (s.x < -tw || s.x > cam.viewW + tw || s.y < -th || s.y > cam.viewH + th) continue;
      const g = map.ground[ty * width + tx] || 0;
      drawDiamond(ctx, s.x, s.y, tw, th, GROUND_TOP[g] || '#4e7d46', GROUND_COLORS[g] || '#3f6b3a');
    }
  }
}

/** วาด tile รูปข้าวหลามตัด (จุด s = บนสุดของ diamond) */
function drawDiamond(ctx, cx, topY, tw, th, fill, stroke) {
  const hw = tw / 2, hh = th / 2;
  const midY = topY + hh;
  ctx.beginPath();
  ctx.moveTo(cx, topY);          // บน
  ctx.lineTo(cx + hw, midY);     // ขวา
  ctx.lineTo(cx, topY + th);     // ล่าง
  ctx.lineTo(cx - hw, midY);     // ซ้าย
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}
