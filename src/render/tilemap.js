// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/tilemap.js — พื้น isometric สไตล์หมึกจีน + ผนังห้อง 3มิติ (interior)
// + ดีเทลพื้น (กอหญ้า/กรวด/ระลอกน้ำ) แบบ deterministic
// ──────────────────────────────────────────────────────────────────────────

const TOP = ['#c4cdaa', '#d9c79f', '#e2dac4', '#9fb4ba'];
const EDGE = ['#aab491', '#c4b083', '#cfc6ad', '#83a0a8'];
const WOOD_TOP = ['#b08a55', '#a67f4a'];
const WOOD_EDGE = ['#7f6034', '#75582f'];
const WALL_H = 30;

/** hash คงที่จากพิกัด tile → [0,1) (ดีเทลไม่กระพริบ) */
function rnd(tx, ty) {
  const n = Math.sin(tx * 127.1 + ty * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../types.js').TileMap} map
 * @param {import('./camera.js').Camera} cam
 * @param {string} [floor]  "wood" = interior (มีผนัง)
 */
export function drawTileMap(ctx, map, cam, floor) {
  const { width, height, tileWidth: tw, tileHeight: th } = map;
  const wood = floor === 'wood';
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const s = cam.tileToScreen(tx, ty);
      if (s.x < -tw || s.x > cam.viewW + tw || s.y < -th - WALL_H || s.y > cam.viewH + th) continue;
      const blocked = map.collision[ty * width + tx] === 1;
      const g = map.ground[ty * width + tx] || 0;

      if (wood && blocked) { drawWall(ctx, s.x, s.y, tw, th); continue; } // ผนัง interior

      if (wood) {
        const sh = (tx + ty) % 2;
        drawDiamond(ctx, s.x, s.y, tw, th, WOOD_TOP[sh], WOOD_EDGE[sh]);
        woodGrain(ctx, s.x, s.y, tw, th);
      } else {
        drawDiamond(ctx, s.x, s.y, tw, th, TOP[g] || TOP[0], EDGE[g] || EDGE[0]);
        detail(ctx, s.x, s.y, tw, th, g, tx, ty);
      }
    }
  }
}

function drawDiamond(ctx, cx, topY, tw, th, fill, stroke) {
  const hw = tw / 2, hh = th / 2, midY = topY + hh;
  ctx.beginPath();
  ctx.moveTo(cx, topY); ctx.lineTo(cx + hw, midY); ctx.lineTo(cx, topY + th); ctx.lineTo(cx - hw, midY);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = 'rgba(42,36,29,0.08)'; ctx.stroke();
}

/** ผนัง 3 มิติ (top + สองหน้าด้านหน้า) */
function drawWall(ctx, cx, topY, tw, th) {
  const hw = tw / 2, hh = th / 2, midY = topY + hh, h = WALL_H;
  // หน้าซ้าย (L→B)
  ctx.fillStyle = '#b6a079';
  ctx.beginPath();
  ctx.moveTo(cx - hw, midY); ctx.lineTo(cx, topY + th); ctx.lineTo(cx, topY + th - h); ctx.lineTo(cx - hw, midY - h);
  ctx.closePath(); ctx.fill();
  // หน้าขวา (B→R) เข้มกว่า
  ctx.fillStyle = '#9c8862';
  ctx.beginPath();
  ctx.moveTo(cx, topY + th); ctx.lineTo(cx + hw, midY); ctx.lineTo(cx + hw, midY - h); ctx.lineTo(cx, topY + th - h);
  ctx.closePath(); ctx.fill();
  // หน้าบน (plaster สว่าง)
  ctx.fillStyle = '#d8c8a0';
  ctx.beginPath();
  ctx.moveTo(cx, topY - h); ctx.lineTo(cx + hw, midY - h); ctx.lineTo(cx, topY + th - h); ctx.lineTo(cx - hw, midY - h);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(42,36,29,0.25)'; ctx.lineWidth = 1; ctx.stroke();
}

function woodGrain(ctx, cx, topY, tw, th) {
  ctx.strokeStyle = 'rgba(60,40,18,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - tw / 2, topY + th / 2); ctx.lineTo(cx, topY + th);
  ctx.moveTo(cx, topY); ctx.lineTo(cx + tw / 2, topY + th / 2);
  ctx.stroke();
}

/** ดีเทลพื้นเล็ก ๆ ตามชนิด (กอหญ้า/กรวด/ระลอกน้ำ) */
function detail(ctx, cx, topY, tw, th, g, tx, ty) {
  const r = rnd(tx, ty), midY = topY + th / 2;
  if (g === 0 && r > 0.62) { // กอหญ้า
    ctx.strokeStyle = '#7c9460'; ctx.lineWidth = 1.4;
    const ox = (r - 0.62) * 80 - 8;
    ctx.beginPath();
    ctx.moveTo(cx + ox, midY + 3); ctx.lineTo(cx + ox - 2, midY - 3);
    ctx.moveTo(cx + ox, midY + 3); ctx.lineTo(cx + ox + 2, midY - 4);
    ctx.moveTo(cx + ox, midY + 3); ctx.lineTo(cx + ox + 1, midY - 2);
    ctx.stroke();
  } else if (g === 0 && r > 0.5) { // ดอกเล็ก
    ctx.fillStyle = r > 0.56 ? '#d9a0b8' : '#e6d27a';
    ctx.beginPath(); ctx.arc(cx + (r * 30 - 15), midY, 1.6, 0, Math.PI * 2); ctx.fill();
  } else if (g === 1 && r > 0.55) { // กรวดบนทาง
    ctx.fillStyle = 'rgba(90,70,40,0.35)';
    ctx.beginPath(); ctx.arc(cx + (r * 26 - 13), midY + (r * 8 - 4), 1.6, 0, Math.PI * 2); ctx.fill();
  } else if (g === 3) { // ระลอกน้ำ
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, midY, 7, 3, 0, 0, Math.PI); ctx.stroke();
  }
}
