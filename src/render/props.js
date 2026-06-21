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

// ── อาคารจีนโบราณ (anchor = กึ่งกลางฐานด้านหน้า) ──────────────────────────

/** หลังคากระเบื้องจีน ปลายชายคาเชิดขึ้น (飞檐) — eaveY = ระดับชายคา, w = กว้าง, rh = สูง */
function roof(ctx, cx, eaveY, w, rh, tile, tileDark, ridgeColor) {
  const half = w / 2, ridgeW = w * 0.46, tip = w * 0.07 + 4;
  // ผืนหลังคา (สันบน → ปลายเชิด → ชายคาแอ่นกลาง)
  ctx.fillStyle = tile;
  ctx.beginPath();
  ctx.moveTo(cx - ridgeW / 2, eaveY - rh);
  ctx.lineTo(cx + ridgeW / 2, eaveY - rh);
  ctx.lineTo(cx + half + tip, eaveY - tip);          // ปลายขวาเชิด
  ctx.quadraticCurveTo(cx, eaveY + rh * 0.18, cx - half - tip, eaveY - tip); // ชายคาแอ่นกลาง → ปลายซ้ายเชิด
  ctx.closePath(); ctx.fill();
  // เงาครึ่งขวา
  ctx.fillStyle = tileDark;
  ctx.beginPath();
  ctx.moveTo(cx, eaveY - rh); ctx.lineTo(cx + ridgeW / 2, eaveY - rh);
  ctx.lineTo(cx + half + tip, eaveY - tip);
  ctx.quadraticCurveTo(cx + half * 0.4, eaveY + rh * 0.12, cx, eaveY + rh * 0.04);
  ctx.closePath(); ctx.fill();
  // เส้นกระเบื้อง (ซี่แนวลาด)
  ctx.strokeStyle = 'rgba(20,24,30,0.30)'; ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    const rx = cx + i * (ridgeW / 6.5);
    ctx.beginPath(); ctx.moveTo(rx, eaveY - rh + 1); ctx.lineTo(cx + i * (half / 3.2), eaveY - tip * 0.4); ctx.stroke();
  }
  // สันหลังคา + หางสัน (鸱吻) ปลายเชิด
  ctx.fillStyle = ridgeColor;
  ctx.fillRect(cx - ridgeW / 2 - 2, eaveY - rh - 3, ridgeW + 4, 4);
  ctx.beginPath(); ctx.moveTo(cx - ridgeW / 2 - 2, eaveY - rh - 1); ctx.quadraticCurveTo(cx - ridgeW / 2 - 8, eaveY - rh - 9, cx - ridgeW / 2 - 3, eaveY - rh - 10); ctx.lineTo(cx - ridgeW / 2 + 1, eaveY - rh - 2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + ridgeW / 2 + 2, eaveY - rh - 1); ctx.quadraticCurveTo(cx + ridgeW / 2 + 8, eaveY - rh - 9, cx + ridgeW / 2 + 3, eaveY - rh - 10); ctx.lineTo(cx + ridgeW / 2 - 1, eaveY - rh - 2); ctx.closePath(); ctx.fill();
  // แถบชายคาไม้ใต้หลังคา
  ctx.fillStyle = tileDark; ctx.beginPath();
  ctx.moveTo(cx - half - tip, eaveY - tip); ctx.quadraticCurveTo(cx, eaveY + rh * 0.18, cx + half + tip, eaveY - tip);
  ctx.quadraticCurveTo(cx, eaveY + rh * 0.18 + 4, cx - half - tip, eaveY - tip + 4); ctx.closePath(); ctx.fill();
}

/** ลายช่องลม/หน้าต่างบานเกล็ดไม้ (lattice) */
function lattice(ctx, x, y, w, h) {
  ctx.fillStyle = '#7a5a32'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#caa86a';
  for (let i = 1; i < 4; i++) ctx.fillRect(x + (w / 4) * i - 0.5, y, 1, h);
  for (let j = 1; j < 3; j++) ctx.fillRect(x, y + (h / 3) * j - 0.5, w, 1);
  ctx.strokeStyle = '#4a3620'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
}

/** บ้านเรือนจีน (ผนังปูน หลังคากระเบื้องเทา ประตูไม้) */
function house(ctx, x, y, s) {
  const W = 116 * s, wallH = 52 * s, baseY = y;
  shadow(ctx, x, y + 2 * s, W * 0.56, 9 * s);
  // ฐานหิน
  ctx.fillStyle = '#6f675a'; ctx.fillRect(x - W / 2, baseY - 6 * s, W, 6 * s);
  // ผนังปูน
  ctx.fillStyle = '#e7ddca'; ctx.fillRect(x - W / 2, baseY - wallH, W, wallH - 6 * s);
  ctx.fillStyle = 'rgba(120,100,70,0.16)'; ctx.fillRect(x + 2 * s, baseY - wallH, W / 2 - 2 * s, wallH - 6 * s); // เงาขวา
  ctx.strokeStyle = 'rgba(60,48,30,0.5)'; ctx.lineWidth = 1.4; ctx.strokeRect(x - W / 2, baseY - wallH, W, wallH - 6 * s);
  // ประตูไม้กลาง
  const dw = 22 * s, dh = 30 * s;
  ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x - dw / 2, baseY - 6 * s - dh, dw, dh);
  ctx.fillStyle = '#6e4827'; ctx.fillRect(x - dw / 2, baseY - 6 * s - dh, dw / 2 - 1 * s, dh);
  ctx.fillStyle = '#caa24a'; ctx.beginPath(); ctx.arc(x - 3 * s, baseY - 6 * s - dh / 2, 1.6 * s, 0, Math.PI * 2); ctx.arc(x + 3 * s, baseY - 6 * s - dh / 2, 1.6 * s, 0, Math.PI * 2); ctx.fill(); // ห่วงประตู
  // หน้าต่าง 2 ข้าง
  lattice(ctx, x - W / 2 + 10 * s, baseY - wallH + 12 * s, 18 * s, 16 * s);
  lattice(ctx, x + W / 2 - 28 * s, baseY - wallH + 12 * s, 18 * s, 16 * s);
  // หลังคา
  roof(ctx, x, baseY - wallH, W + 24 * s, 30 * s, '#566270', '#3c4654', '#2f3742');
}

/** ร้านค้า (บ้าน + ป้ายร้าน + โคมแดงสองข้าง + กันสาดผ้า) */
function shop(ctx, x, y, s, sign = '酒') {
  const W = 116 * s, wallH = 52 * s, baseY = y;
  shadow(ctx, x, y + 2 * s, W * 0.56, 9 * s);
  ctx.fillStyle = '#6f675a'; ctx.fillRect(x - W / 2, baseY - 6 * s, W, 6 * s);
  ctx.fillStyle = '#e7ddca'; ctx.fillRect(x - W / 2, baseY - wallH, W, wallH - 6 * s);
  ctx.fillStyle = 'rgba(120,100,70,0.16)'; ctx.fillRect(x + 2 * s, baseY - wallH, W / 2 - 2 * s, wallH - 6 * s);
  ctx.strokeStyle = 'rgba(60,48,30,0.5)'; ctx.lineWidth = 1.4; ctx.strokeRect(x - W / 2, baseY - wallH, W, wallH - 6 * s);
  // หน้าร้านเปิด (เคาน์เตอร์ไม้ + ช่องมืด)
  ctx.fillStyle = '#3a2c1c'; ctx.fillRect(x - 30 * s, baseY - 6 * s - 32 * s, 60 * s, 32 * s);
  ctx.fillStyle = '#7a5226'; ctx.fillRect(x - 32 * s, baseY - 6 * s - 12 * s, 64 * s, 6 * s); // เคาน์เตอร์
  // เสาไม้สองข้างหน้าร้าน
  ctx.fillStyle = '#7a3128'; ctx.fillRect(x - 34 * s, baseY - 6 * s - 36 * s, 5 * s, 36 * s); ctx.fillRect(x + 29 * s, baseY - 6 * s - 36 * s, 5 * s, 36 * s);
  // กันสาดผ้าลายทาง
  ctx.fillStyle = '#9c3a30'; ctx.beginPath(); ctx.moveTo(x - 40 * s, baseY - 6 * s - 36 * s); ctx.lineTo(x + 40 * s, baseY - 6 * s - 36 * s); ctx.lineTo(x + 34 * s, baseY - 6 * s - 28 * s); ctx.lineTo(x - 34 * s, baseY - 6 * s - 28 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e9dec4'; for (let i = -3; i <= 3; i++) ctx.fillRect(x + i * 11 * s - 2 * s, baseY - 6 * s - 36 * s, 4 * s, 8 * s);
  // หลังคา
  roof(ctx, x, baseY - wallH, W + 24 * s, 30 * s, '#566270', '#3c4654', '#2f3742');
  // ป้ายร้านแขวน (招幌) + อักษร
  ctx.fillStyle = '#7a1d18'; ctx.fillRect(x + W / 2 - 16 * s, baseY - wallH - 2 * s, 13 * s, 30 * s);
  ctx.fillStyle = '#caa24a'; ctx.lineWidth = 1.5; ctx.strokeStyle = '#caa24a'; ctx.strokeRect(x + W / 2 - 16 * s, baseY - wallH - 2 * s, 13 * s, 30 * s);
  ctx.fillStyle = '#f2e6c4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${12 * s}px "Ma Shan Zheng","Noto Serif Thai",serif`;
  ctx.fillText(sign, x + W / 2 - 9.5 * s, baseY - wallH + 13 * s);
  // โคมแดงสองข้างชายคา
  for (const dx of [-W / 2 + 8 * s, W / 2 - 8 * s]) {
    ctx.fillStyle = 'rgba(255,170,80,0.16)'; ctx.beginPath(); ctx.arc(x + dx, baseY - wallH + 4 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b9302a'; ctx.beginPath(); ctx.ellipse(x + dx, baseY - wallH + 4 * s, 6 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8b54a'; ctx.fillRect(x + dx - 6 * s, baseY - wallH + 3 * s, 12 * s, 1.5 * s);
  }
}

/** โรงฝึก/หอประชุม (อาคารใหญ่ เสาแดง ป้ายไม้匾額 บันได — ใช้เป็นทางเข้าห้อง) */
function hall(ctx, x, y, s, plaque = '武館') {
  const W = 150 * s, wallH = 60 * s, baseY = y;
  shadow(ctx, x, y + 3 * s, W * 0.58, 11 * s);
  // บันไดหิน
  ctx.fillStyle = '#9a9080'; ctx.beginPath(); ctx.moveTo(x - 44 * s, baseY); ctx.lineTo(x + 44 * s, baseY); ctx.lineTo(x + 34 * s, baseY - 8 * s); ctx.lineTo(x - 34 * s, baseY - 8 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a8070'; ctx.fillRect(x - 34 * s, baseY - 8 * s, 68 * s, 2 * s);
  // ฐาน + ผนัง
  ctx.fillStyle = '#6f675a'; ctx.fillRect(x - W / 2, baseY - 14 * s, W, 8 * s);
  ctx.fillStyle = '#e7ddca'; ctx.fillRect(x - W / 2, baseY - wallH, W, wallH - 14 * s);
  ctx.fillStyle = 'rgba(120,100,70,0.16)'; ctx.fillRect(x + 2 * s, baseY - wallH, W / 2 - 2 * s, wallH - 14 * s);
  ctx.strokeStyle = 'rgba(60,48,30,0.5)'; ctx.lineWidth = 1.4; ctx.strokeRect(x - W / 2, baseY - wallH, W, wallH - 14 * s);
  // เสารักแดงสี่ต้น
  for (const dx of [-W / 2 + 8 * s, -22 * s, 22 * s, W / 2 - 14 * s]) {
    ctx.fillStyle = '#8a2b22'; ctx.fillRect(x + dx, baseY - wallH, 7 * s, wallH - 14 * s);
    ctx.fillStyle = '#a3352a'; ctx.fillRect(x + dx, baseY - wallH, 3 * s, wallH - 14 * s);
  }
  // ประตูบานคู่กลาง
  const dw = 36 * s, dh = 40 * s;
  ctx.fillStyle = '#4a2f18'; ctx.fillRect(x - dw / 2, baseY - 14 * s - dh, dw, dh);
  ctx.fillStyle = '#5e3c20'; ctx.fillRect(x - dw / 2, baseY - 14 * s - dh, dw / 2 - 1 * s, dh);
  ctx.fillStyle = '#caa24a'; // ห่วงทองแดง
  ctx.beginPath(); ctx.arc(x - 5 * s, baseY - 14 * s - dh / 2, 2.4 * s, 0, Math.PI * 2); ctx.arc(x + 5 * s, baseY - 14 * s - dh / 2, 2.4 * s, 0, Math.PI * 2); ctx.fill();
  // หลังคาใหญ่ (สองชั้นเล็ก ๆ)
  roof(ctx, x, baseY - wallH, W + 34 * s, 38 * s, '#4a5560', '#333d47', '#9e2b25');
  // ป้ายไม้ (匾額) เหนือประตู
  ctx.fillStyle = '#3a2414'; ctx.fillRect(x - 26 * s, baseY - wallH - 2 * s, 52 * s, 16 * s);
  ctx.strokeStyle = '#caa24a'; ctx.lineWidth = 2; ctx.strokeRect(x - 26 * s, baseY - wallH - 2 * s, 52 * s, 16 * s);
  ctx.fillStyle = '#e8c45a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${13 * s}px "Ma Shan Zheng","Noto Serif Thai",serif`;
  ctx.fillText(plaque, x, baseY - wallH + 7 * s);
}

const PROPS = {
  vase, lantern, lotus, censer, statue, pillar, table, rug,
  house, shop, hall,
};

/** วาด prop ตามชนิด (text = ป้าย/อักษร สำหรับ shop/hall) */
export function drawProp(ctx, type, x, y, scale = 1, text) {
  (PROPS[type] || vase)(ctx, x, y, scale, text);
}

/** prop แบบ "พื้น" (วาดก่อนตัวละคร ไม่ต้อง depth-sort) */
export const FLOOR_PROPS = new Set(['rug']);
