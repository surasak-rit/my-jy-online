// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/tilemap.js — วาด isometric tilemap สไตล์ "หมึกจีน/กระดาษสา (水墨)"
// โทนกระดาษสา + พื้นหยกจาง + น้ำหมึก, เส้นขอบหมึกพู่กันบาง ๆ
// ──────────────────────────────────────────────────────────────────────────

/** พื้น: 0 หญ้า(หยกจาง) · 1 ทางดิน · 2 ลานหิน/กระดาษ · 3 น้ำหมึก */
const TOP = ['#c4cdaa', '#d9c79f', '#e2dac4', '#9fb4ba']; // ผิวบน
const EDGE = ['#aab491', '#c4b083', '#cfc6ad', '#83a0a8']; // ขอบ/เงา

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
      if (s.x < -tw || s.x > cam.viewW + tw || s.y < -th || s.y > cam.viewH + th) continue;
      const g = map.ground[ty * width + tx] || 0;
      drawDiamond(ctx, s.x, s.y, tw, th, TOP[g] || TOP[0], EDGE[g] || EDGE[0]);
    }
  }
}

/** tile รูปข้าวหลามตัด (จุด s = บนสุด) + เส้นขอบหมึกจาง */
function drawDiamond(ctx, cx, topY, tw, th, fill, stroke) {
  const hw = tw / 2, hh = th / 2, midY = topY + hh;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx + hw, midY);
  ctx.lineTo(cx, topY + th);
  ctx.lineTo(cx - hw, midY);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke();
  // เส้นหมึกจาง ๆ เน้นมิติ (ขอบบนซ้าย)
  ctx.strokeStyle = 'rgba(42,36,29,0.08)'; ctx.stroke();
}
