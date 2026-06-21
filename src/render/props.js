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

// ── อาคารจีนโบราณ 2.5D (isometric: ผนังสองด้าน + หลังคาทรงปั้นหยา) ────────────
// anchor (x,y) = มุมหน้าสุด (front vertex) ที่ติดพื้น · iso ratio 2:1 (กว้าง:สูง)

const poly = (ctx, pts, fill) => {
  ctx.fillStyle = fill; ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); ctx.fill();
};

/**
 * อาคาร 2.5D ทรงปั้นหยา + ของตกแต่งหน้าผนัง
 * @param {Object} o {bw,bd,wallH,roofH,eaveOv,wall,wallDark,base,roof,roofDark,ridge}
 */
function building(ctx, x, y, s, o) {
  const bw = o.bw * s, bd = o.bd * s, wallH = o.wallH * s, roofH = o.roofH * s, ov = o.eaveOv * s;
  // มุมฐาน (F=หน้า, R=ขวา/+x, L=ซ้าย/+y, B=หลัง) — iso 2:1
  const F = [x, y], R = [x + bw, y - bw / 2], L = [x - bd, y - bd / 2];
  const Bg = [x + bw - bd, y - (bw + bd) / 2]; // มุมหลังบนพื้น
  const top = (p) => [p[0], p[1] - wallH];
  const F2 = top(F), R2 = top(R), L2 = top(L), B2 = [Bg[0], Bg[1] - wallH];

  // เงา = รูปข้าวหลามตัดตาม footprint (วางใต้อาคารพอดี ไม่ลอยเหนือแอ่งเงา)
  const e = 3 * s;
  poly(ctx, [[F[0], F[1] + e], [R[0] + e, R[1] + e * 0.5], [Bg[0], Bg[1] - e], [L[0] - e, L[1] + e * 0.5]], 'rgba(30,22,12,0.28)');

  // ฐานหิน (สองด้านล่างผนัง)
  const baseH = 5 * s;
  poly(ctx, [F, R, [R[0], R[1] - baseH], [F[0], F[1] - baseH]], o.base);
  poly(ctx, [F, L, [L[0], L[1] - baseH], [F[0], F[1] - baseH]], mixHex(o.base, 0.12));

  // ผนังสองด้าน (ขวาเงา / ซ้ายโดนแสง)
  poly(ctx, [[F[0], F[1] - baseH], [R[0], R[1] - baseH], R2, F2], o.wallDark); // +x หน้าขวา (เงา)
  poly(ctx, [[F[0], F[1] - baseH], [L[0], L[1] - baseH], L2, F2], o.wall);     // +y หน้าซ้าย (สว่าง)
  // สันมุมหน้า
  ctx.strokeStyle = 'rgba(50,40,25,0.45)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(F[0], F[1] - baseH); ctx.lineTo(F2[0], F2[1]); ctx.stroke();

  // ── ของตกแต่งบนผนัง (พิกัด u ตามแนวหน้าผนัง 0→1, v ขึ้นบน 0→1) ──
  const onL = (u, v) => [F[0] + u * (L[0] - F[0]), F[1] - baseH + u * (L[1] - F[1]) - v * (wallH - baseH)];
  const onR = (u, v) => [F[0] + u * (R[0] - F[0]), F[1] - baseH + u * (R[1] - F[1]) - v * (wallH - baseH)];

  if (o.pillars) for (const u of [0.06, 0.5, 0.94]) { // เสารักแดง (หอใหญ่)
    poly(ctx, [onL(u - 0.03, 0), onL(u + 0.03, 0), onL(u + 0.03, 0.97), onL(u - 0.03, 0.97)], '#8a2b22');
    poly(ctx, [onR(u - 0.03, 0), onR(u + 0.03, 0), onR(u + 0.03, 0.97), onR(u - 0.03, 0.97)], '#6f211a');
  }
  if (o.shopfront) { // หน้าร้านเปิด + เคาน์เตอร์ (ด้านซ้าย)
    poly(ctx, [onL(0.2, 0), onL(0.82, 0), onL(0.82, 0.66), onL(0.2, 0.66)], '#33271a');
    poly(ctx, [onL(0.2, 0), onL(0.82, 0), onL(0.82, 0.18), onL(0.2, 0.18)], '#7a5226');
  } else { // ประตูไม้ (ด้านซ้าย)
    const dw = o.doorW || 0.34, dh = o.doorH || 0.66, c = 0.5;
    poly(ctx, [onL(c - dw / 2, 0), onL(c + dw / 2, 0), onL(c + dw / 2, dh), onL(c - dw / 2, dh)], '#4a2f18');
    poly(ctx, [onL(c - dw / 2, 0), onL(c, 0), onL(c, dh), onL(c - dw / 2, dh)], '#5e3c20');
    const ring = onL(c, dh * 0.5); ctx.fillStyle = '#caa24a'; ctx.beginPath(); ctx.arc(ring[0], ring[1], 1.8 * s, 0, Math.PI * 2); ctx.fill();
  }
  if (o.windows) for (const u of [0.2, 0.8]) { // หน้าต่างช่องลม (ด้านขวา)
    const w0 = onR(u - 0.1, 0.35), w1 = onR(u + 0.1, 0.35), w2 = onR(u + 0.1, 0.72), w3 = onR(u - 0.1, 0.72);
    poly(ctx, [w0, w1, w2, w3], '#6e5230');
    ctx.strokeStyle = '#caa86a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo((w0[0] + w3[0]) / 2, (w0[1] + w3[1]) / 2); ctx.lineTo((w1[0] + w2[0]) / 2, (w1[1] + w2[1]) / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((w0[0] + w1[0]) / 2, (w0[1] + w1[1]) / 2); ctx.lineTo((w3[0] + w2[0]) / 2, (w3[1] + w2[1]) / 2); ctx.stroke();
  }
  if (o.plaque) { // ป้ายไม้ (匾額) เหนือประตู บนผนังซ้าย
    const a = onL(0.32, 0.72), b = onL(0.68, 0.72), c2 = onL(0.68, 0.96), d = onL(0.32, 0.96);
    poly(ctx, [a, b, c2, d], '#3a2414');
    ctx.strokeStyle = '#caa24a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.stroke();
    const tc = [(a[0] + c2[0]) / 2, (a[1] + c2[1]) / 2];
    ctx.fillStyle = '#e8c45a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${11 * s}px "Ma Shan Zheng","Noto Serif Thai",serif`; ctx.fillText(o.plaque, tc[0], tc[1]);
  }

  // ── หลังคาทรงปั้นหยา (สันยาวหน้า-หลัง, สองลาดหันเข้ากล้อง) ──
  const tip = 7 * s;
  const Fe = [x, y - wallH + ov * 0.4];
  const Re = [x + bw + ov, y - (bw + ov) / 2 - wallH - tip];
  const Le = [x - bd - ov, y - (bd + ov) / 2 - wallH - tip];
  const Be = [x + bw - bd, y - (bw + bd) / 2 - wallH - ov * 0.4];
  const rf = [Fe[0] + 0.22 * (Be[0] - Fe[0]), Fe[1] + 0.22 * (Be[1] - Fe[1]) - roofH];
  const rb = [Fe[0] + 0.78 * (Be[0] - Fe[0]), Fe[1] + 0.78 * (Be[1] - Fe[1]) - roofH];
  // ลาดขวา (+x, เงา) + ลาดซ้าย (+y, สว่าง)
  poly(ctx, [Fe, Re, Be, rb, rf], o.roofDark);
  poly(ctx, [Fe, Le, Be, rb, rf], o.roof);
  // ชายคาไม้ (แถบใต้)
  ctx.strokeStyle = 'rgba(20,16,10,0.4)'; ctx.lineWidth = 2.2 * s;
  ctx.beginPath(); ctx.moveTo(Le[0], Le[1]); ctx.lineTo(Fe[0], Fe[1]); ctx.lineTo(Re[0], Re[1]); ctx.stroke();
  // เส้นกระเบื้อง (ลาดหน้า ทั้งสองด้าน)
  ctx.strokeStyle = 'rgba(20,24,30,0.28)'; ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    ctx.beginPath(); ctx.moveTo(rf[0] + t * (rb[0] - rf[0]), rf[1] + t * (rb[1] - rf[1])); ctx.lineTo(Le[0] + t * (Be[0] - Le[0]), Le[1] + t * (Be[1] - Le[1])); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rf[0] + t * (rb[0] - rf[0]), rf[1] + t * (rb[1] - rf[1])); ctx.lineTo(Re[0] + t * (Be[0] - Re[0]), Re[1] + t * (Be[1] - Re[1])); ctx.stroke();
  }
  // สันหลังคา + หางสัน (鸱吻) ปลายเชิด
  ctx.strokeStyle = o.ridge; ctx.lineWidth = 3.4 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(rf[0], rf[1]); ctx.lineTo(rb[0], rb[1]); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = o.ridge;
  for (const r of [rf, rb]) { ctx.beginPath(); ctx.moveTo(r[0] - 3 * s, r[1]); ctx.quadraticCurveTo(r[0], r[1] - 8 * s, r[0] + 3 * s, r[1] - 6 * s); ctx.lineTo(r[0] + 2 * s, r[1] + 1 * s); ctx.closePath(); ctx.fill(); }
}

/** ผสม hex เข้าหาขาว(white=false→ดำ) ปริมาณ amt — ใช้ปรับเฉดฐาน */
function mixHex(hex, amt, white = false) {
  const n = parseInt(hex.slice(1), 16); const t = white ? 255 : 0;
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (t - r) * amt); g = Math.round(g + (t - g) * amt); b = Math.round(b + (t - b) * amt);
  return `rgb(${r},${g},${b})`;
}

/** บ้านเรือนจีน */
function house(ctx, x, y, s) {
  building(ctx, x, y, s, {
    bw: 52, bd: 52, wallH: 46, roofH: 26, eaveOv: 13,
    wall: '#ece2ce', wallDark: '#cdc1a6', base: '#6f675a',
    roof: '#5b6775', roofDark: '#3f4a58', ridge: '#2f3742', windows: true,
  });
}

/** ร้านค้า (หน้าร้านเปิด + ป้ายแขวน招幌 + โคมแดง) */
function shop(ctx, x, y, s, sign = '酒') {
  building(ctx, x, y, s, {
    bw: 52, bd: 52, wallH: 46, roofH: 26, eaveOv: 13,
    wall: '#ece2ce', wallDark: '#cdc1a6', base: '#6f675a',
    roof: '#5b6775', roofDark: '#3f4a58', ridge: '#2f3742', shopfront: true, windows: true,
  });
  // ป้ายแขวน招幌 + อักษร (ห้อยจากชายคาหน้า)
  const sx = x - 30 * s, sy = y - 46 * s - 26 * s + 6 * s;
  ctx.fillStyle = '#7a1d18'; ctx.fillRect(sx - 6.5 * s, sy, 13 * s, 28 * s);
  ctx.strokeStyle = '#caa24a'; ctx.lineWidth = 1.4; ctx.strokeRect(sx - 6.5 * s, sy, 13 * s, 28 * s);
  ctx.fillStyle = '#f2e6c4'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${12 * s}px "Ma Shan Zheng","Noto Serif Thai",serif`; ctx.fillText(sign, sx, sy + 13 * s);
  // โคมแดงห้อยชายคาหน้า
  const lx = x, ly = y - 46 * s + 2 * s;
  ctx.fillStyle = 'rgba(255,170,80,0.16)'; ctx.beginPath(); ctx.arc(lx, ly, 11 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b9302a'; ctx.beginPath(); ctx.ellipse(lx, ly, 5.5 * s, 7.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b54a'; ctx.fillRect(lx - 5.5 * s, ly - 1 * s, 11 * s, 1.5 * s);
}

/** โรงฝึก/หอประชุม (อาคารใหญ่ เสาแดง ป้ายไม้匾額 — ใช้เป็นทางเข้าห้อง) */
function hall(ctx, x, y, s, plaque = '武館') {
  // บันไดหินด้านหน้า
  shadow(ctx, x, y + 3 * s, 80 * s, 16 * s);
  const stepW = 30 * s, stepD = 30 * s;
  poly(ctx, [[x, y + 6 * s], [x + stepW, y + 6 * s - stepW / 2], [x, y + 6 * s - (stepW + stepD) / 2], [x - stepD, y + 6 * s - stepD / 2]], '#9a9080');
  building(ctx, x, y, s, {
    bw: 66, bd: 66, wallH: 56, roofH: 36, eaveOv: 18,
    wall: '#ece2ce', wallDark: '#cdc1a6', base: '#6f675a',
    roof: '#4a5560', roofDark: '#333d47', ridge: '#9e2b25',
    pillars: true, doorW: 0.4, doorH: 0.7, plaque,
  });
}

// ── องค์ประกอบเมืองตลาด (2.5D) ───────────────────────────────────────────────

/** แผงตลาด: เสาไม้ 4 ต้น + ผ้าใบกันแดดหย่อนกลาง + เคาน์เตอร์ + ของวาง */
function stall(ctx, x, y, s) {
  const bw = 30 * s, bd = 26 * s, h = 40 * s;
  const F = [x, y], R = [x + bw, y - bw / 2], L = [x - bd, y - bd / 2], B = [x + bw - bd, y - (bw + bd) / 2];
  shadow(ctx, x, y + 2 * s, (bw + bd) * 0.6, (bw + bd) * 0.16);
  const pole = (p) => { ctx.fillStyle = '#5e3f22'; ctx.fillRect(p[0] - 2 * s, p[1] - h, 4 * s, h); ctx.fillStyle = '#74522e'; ctx.fillRect(p[0] - 2 * s, p[1] - h, 1.5 * s, h); };
  pole(B); pole(L); pole(R);                       // เสาหลัง/ข้างก่อน
  const t = (p) => [p[0], p[1] - h];
  const Ft = t(F), Rt = t(R), Lt = t(L), Bt = t(B);
  const sag = 7 * s;                               // ผ้าใบหย่อนกลาง
  poly(ctx, [[Ft[0], Ft[1] + sag], Rt, [Bt[0], Bt[1] - 2 * s], Lt], '#d8c79a'); // ผ้าใบ (สว่าง)
  poly(ctx, [[Ft[0], Ft[1] + sag], Rt, [Bt[0], Bt[1] - 2 * s], [(Ft[0] + Bt[0]) / 2, (Ft[1] + Bt[1]) / 2 + 2 * s]], '#bca877'); // ครึ่งขวาเงา
  // ชายผ้าใบหน้า (หยัก)
  ctx.fillStyle = '#c2ad79';
  ctx.beginPath(); ctx.moveTo(Lt[0], Lt[1]); ctx.lineTo(Ft[0], Ft[1] + sag); ctx.lineTo(Rt[0], Rt[1]);
  ctx.lineTo(Rt[0], Rt[1] + 5 * s); ctx.lineTo(Ft[0], Ft[1] + sag + 6 * s); ctx.lineTo(Lt[0], Lt[1] + 5 * s); ctx.closePath(); ctx.fill();
  pole(F);                                         // เสาหน้าทับ
  // เคาน์เตอร์ไม้หน้าแผง + ของวาง
  poly(ctx, [[F[0] - 4 * s, F[1] - 12 * s], [L[0] + 6 * s, L[1] - 12 * s], [L[0] + 6 * s, L[1] - 6 * s], [F[0] - 4 * s, F[1] - 6 * s]], '#7a5226');
  // ตะกร้า/ไหวางพื้น
  ctx.fillStyle = '#9c7a44'; ctx.beginPath(); ctx.ellipse(F[0] - 2 * s, F[1] - 2 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7c5a8a'; ctx.beginPath(); ctx.ellipse(F[0] + 6 * s, F[1] - 1 * s, 3 * s, 4 * s, 0, 0, Math.PI * 2); ctx.fill();
}

/** ต้นไม้ใหญ่ (ลำต้น + พุ่มใบเป็นชั้น) */
function tree(ctx, x, y, s) {
  shadow(ctx, x, y, 18 * s, 6 * s);
  ctx.fillStyle = '#5e4128'; ctx.fillRect(x - 4 * s, y - 38 * s, 8 * s, 38 * s);
  ctx.fillStyle = '#49301c'; ctx.fillRect(x + 1 * s, y - 38 * s, 3 * s, 38 * s);
  const blob = (cx, cy, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
  blob(x - 15 * s, y - 44 * s, 16 * s, '#415a30');
  blob(x + 15 * s, y - 46 * s, 16 * s, '#3a5029');
  blob(x, y - 42 * s, 20 * s, '#4f6c3c');
  blob(x, y - 62 * s, 17 * s, '#557544');
  blob(x - 8 * s, y - 55 * s, 11 * s, '#5f8049'); // ไฮไลต์
  blob(x + 9 * s, y - 52 * s, 9 * s, '#48623399');
}

/** ม้านั่งไม้ (iso) */
function bench(ctx, x, y, s) {
  shadow(ctx, x, y, 16 * s, 4 * s);
  const w = 22 * s;
  poly(ctx, [[x - w, y - 4 * s], [x, y - 4 * s - w / 2], [x, y - 10 * s - w / 2], [x - w, y - 10 * s]], '#8a5e34'); // หน้านั่งซ้าย
  poly(ctx, [[x, y - 4 * s - w / 2], [x + w, y - 4 * s], [x + w, y - 10 * s], [x, y - 10 * s - w / 2]], '#74502c'); // ขวา
  ctx.fillStyle = '#5e3f22'; ctx.fillRect(x - w + 2 * s, y - 10 * s, 3 * s, 10 * s); ctx.fillRect(x + w - 5 * s, y - 10 * s, 3 * s, 10 * s); // ขา
}

const PROPS = {
  vase, lantern, lotus, censer, statue, pillar, table, rug,
  house, shop, hall, stall, tree, bench,
};

/** วาด prop ตามชนิด (text = ป้าย/อักษร สำหรับ shop/hall) */
export function drawProp(ctx, type, x, y, scale = 1, text) {
  (PROPS[type] || vase)(ctx, x, y, scale, text);
}

/** prop แบบ "พื้น" (วาดก่อนตัวละคร ไม่ต้อง depth-sort) */
export const FLOOR_PROPS = new Set(['rug']);
