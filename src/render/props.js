// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/props.js — ของตกแต่งฉาก (วาด canvas มีแสงเงา) ให้ฉากดูริชแบบ JY Online
// ไม่ใช้ gradient object (รันบน headless ได้) — ใช้เลเยอร์สีทึบไล่แสง
// anchor = ฐานวัตถุ (sx, sy) ที่กึ่งกลางช่อง
// ──────────────────────────────────────────────────────────────────────────

/** เงานุ่มใต้วัตถุ */
function shadow(ctx, x, y, rx, ry) {
  ctx.fillStyle = 'rgba(30,22,12,0.28)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

/** แจกันลายคราม (blue-and-white porcelain) */
function vase(ctx, x, y, s) {
  shadow(ctx, x, y, 13 * s, 5 * s);
  // ตัวแจกัน
  ctx.fillStyle = '#e9eef2';
  ctx.beginPath(); ctx.ellipse(x, y - 18 * s, 11 * s, 18 * s, 0, 0, Math.PI * 2); ctx.fill();
  // เงาด้านขวา
  ctx.fillStyle = 'rgba(90,110,130,0.25)';
  ctx.beginPath(); ctx.ellipse(x + 3 * s, y - 18 * s, 8 * s, 17 * s, 0, 0, Math.PI * 2); ctx.fill();
  // ลายครามคอ/ลำตัว
  ctx.fillStyle = '#2f5d99';
  ctx.fillRect(x - 9 * s, y - 28 * s, 18 * s, 3 * s);
  ctx.beginPath(); ctx.arc(x, y - 16 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a6fb0';
  ctx.fillRect(x - 8 * s, y - 10 * s, 16 * s, 2 * s);
  // ปากแจกัน
  ctx.fillStyle = '#dfe6ec';
  ctx.beginPath(); ctx.ellipse(x, y - 35 * s, 5 * s, 2.5 * s, 0, 0, Math.PI * 2); ctx.fill();
}

/** โคมไฟแดง (hanging-style ตั้งพื้น) + แสงเรือง */
function lantern(ctx, x, y, s) {
  shadow(ctx, x, y, 9 * s, 4 * s);
  ctx.fillStyle = 'rgba(255,170,80,0.18)';
  ctx.beginPath(); ctx.arc(x, y - 22 * s, 20 * s, 0, Math.PI * 2); ctx.fill(); // แสงเรือง
  ctx.fillStyle = '#7a1d18'; ctx.fillRect(x - 8 * s, y - 36 * s, 16 * s, 3 * s); // คานบน
  ctx.fillStyle = '#b9302a';
  ctx.beginPath(); ctx.ellipse(x, y - 22 * s, 10 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,210,120,0.5)';
  ctx.beginPath(); ctx.ellipse(x - 2 * s, y - 24 * s, 4 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b54a'; // ขอบทอง + พู่
  ctx.fillRect(x - 10 * s, y - 23 * s, 20 * s, 2 * s);
  ctx.fillStyle = '#d4a23a'; ctx.fillRect(x - 1 * s, y - 9 * s, 2 * s, 7 * s);
}

/** กระถาง/ดอกบัว (lotus basin) */
function lotus(ctx, x, y, s) {
  shadow(ctx, x, y, 14 * s, 5 * s);
  ctx.fillStyle = '#3a4a3a'; // อ่าง
  ctx.beginPath(); ctx.ellipse(x, y - 4 * s, 14 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4f7a55'; // ใบบัว
  for (const dx of [-7, 0, 7]) { ctx.beginPath(); ctx.ellipse(x + dx * s, y - 8 * s, 6 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#e58fb0'; // ดอก
  ctx.beginPath(); ctx.ellipse(x + 2 * s, y - 13 * s, 3.5 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4b8d0';
  ctx.beginPath(); ctx.ellipse(x + 2 * s, y - 13 * s, 1.6 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
}

/** กระถางธูป/ตรีขาทองสัมฤทธิ์ (bronze censer 鼎) + ควัน */
function censer(ctx, x, y, s) {
  shadow(ctx, x, y, 13 * s, 5 * s);
  ctx.fillStyle = '#6b5326'; // ขาตั้ง
  ctx.fillRect(x - 9 * s, y - 8 * s, 4 * s, 8 * s); ctx.fillRect(x + 5 * s, y - 8 * s, 4 * s, 8 * s);
  ctx.fillStyle = '#8a6a30'; // ตัวกระถาง
  ctx.beginPath(); ctx.ellipse(x, y - 14 * s, 12 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a98639';
  ctx.beginPath(); ctx.ellipse(x, y - 20 * s, 12 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(200,200,200,0.25)'; // ควัน
  ctx.beginPath(); ctx.ellipse(x - 2 * s, y - 30 * s, 4 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 2 * s, y - 40 * s, 3 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
}

/** พระพุทธรูป/รูปสลักหินบนแท่น */
function statue(ctx, x, y, s) {
  shadow(ctx, x, y, 18 * s, 6 * s);
  ctx.fillStyle = '#9a9384'; ctx.fillRect(x - 16 * s, y - 10 * s, 32 * s, 10 * s); // แท่น
  ctx.fillStyle = '#aaa291';
  ctx.beginPath(); ctx.moveTo(x - 13 * s, y - 10 * s); ctx.lineTo(x + 13 * s, y - 10 * s); ctx.lineTo(x + 9 * s, y - 46 * s); ctx.lineTo(x - 9 * s, y - 46 * s); ctx.closePath(); ctx.fill(); // ลำตัว
  ctx.fillStyle = '#bcb39f';
  ctx.beginPath(); ctx.arc(x, y - 52 * s, 8 * s, 0, Math.PI * 2); ctx.fill(); // หัว
  ctx.fillStyle = 'rgba(60,52,38,0.25)'; // เงาขวา
  ctx.fillRect(x + 2 * s, y - 46 * s, 7 * s, 36 * s);
  ctx.fillStyle = '#caa24a'; // รัศมีทอง
  ctx.beginPath(); ctx.arc(x, y - 52 * s, 11 * s, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
}

/** เสาเสาลายรัก (red lacquer pillar) */
function pillar(ctx, x, y, s) {
  shadow(ctx, x, y, 9 * s, 4 * s);
  ctx.fillStyle = '#8a2b22'; ctx.fillRect(x - 7 * s, y - 64 * s, 14 * s, 64 * s);
  ctx.fillStyle = '#a3352a'; ctx.fillRect(x - 7 * s, y - 64 * s, 6 * s, 64 * s); // ไฮไลต์ซ้าย
  ctx.fillStyle = '#5a1c16'; ctx.fillRect(x + 3 * s, y - 64 * s, 4 * s, 64 * s); // เงาขวา
  ctx.fillStyle = '#caa24a'; ctx.fillRect(x - 9 * s, y - 64 * s, 18 * s, 4 * s); // หัวเสาทอง
  ctx.fillRect(x - 9 * s, y - 6 * s, 18 * s, 4 * s); // ฐานทอง
}

/** โต๊ะไม้ */
function table(ctx, x, y, s) {
  shadow(ctx, x, y, 18 * s, 6 * s);
  ctx.fillStyle = '#6e4a28'; ctx.fillRect(x - 16 * s, y - 16 * s, 5 * s, 16 * s); ctx.fillRect(x + 11 * s, y - 16 * s, 5 * s, 16 * s); // ขา
  ctx.fillStyle = '#8a5e34';
  ctx.beginPath(); ctx.moveTo(x - 20 * s, y - 16 * s); ctx.lineTo(x + 20 * s, y - 16 * s); ctx.lineTo(x + 16 * s, y - 22 * s); ctx.lineTo(x - 16 * s, y - 22 * s); ctx.closePath(); ctx.fill(); // หน้าโต๊ะ
  ctx.fillStyle = '#9c6d3e'; ctx.fillRect(x - 18 * s, y - 22 * s, 36 * s, 2 * s);
}

/** พรม/เสื่อลาย (floor decal — วาดแบนกับพื้น) */
function rug(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = '#8a2f2a';
  ctx.beginPath(); ctx.moveTo(x, y - 18 * s); ctx.lineTo(x + 34 * s, y); ctx.lineTo(x, y + 18 * s); ctx.lineTo(x - 34 * s, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b8923f';
  ctx.beginPath(); ctx.moveTo(x, y - 12 * s); ctx.lineTo(x + 22 * s, y); ctx.lineTo(x, y + 12 * s); ctx.lineTo(x - 22 * s, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a2f2a';
  ctx.beginPath(); ctx.moveTo(x, y - 6 * s); ctx.lineTo(x + 11 * s, y); ctx.lineTo(x, y + 6 * s); ctx.lineTo(x - 11 * s, y); ctx.closePath(); ctx.fill();
  ctx.restore();
}

const PROPS = { vase, lantern, lotus, censer, statue, pillar, table, rug };

/** วาด prop ตามชนิด */
export function drawProp(ctx, type, x, y, scale = 1) {
  (PROPS[type] || vase)(ctx, x, y, scale);
}

/** prop แบบ "พื้น" (วาดก่อนตัวละคร ไม่ต้อง depth-sort) */
export const FLOOR_PROPS = new Set(['rug']);
