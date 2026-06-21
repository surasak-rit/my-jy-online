// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/sprites.js — ตัวละครจิบิ "ลายเส้นหมึกพู่กัน" + ป้ายชื่อแผ่นกระดาษสา/ตราชาด
// สไตล์นิยายกำลังภายใน: เส้นขอบหมึกเข้ม, สีชุดหม่น, ป้าย = แผ่นป้ายหมึก + ตราสำนัก
// ──────────────────────────────────────────────────────────────────────────

const INK = '#2a241d';
const PAPER = 'rgba(233,222,196,0.94)';
const SEAL = '#9e2b25';

/** สี placeholder ตามอาร์คีไทป์ NPC (โทนหม่นแบบหมึกจีน — §D.2) */
const ARCHETYPE_COLOR = {
  villager: '#8f8468', merchant: '#9c4a39', wanderer: '#4b5560',
  monk: '#bf8136', guard: '#3b4a5e', beggar: '#6b6052',
  scholar: '#aeb6bf', child: '#c27f96',
};

const CHIBI_H = 48; // ความสูงโดยประมาณ (px @scale=1) — ใช้จัดตำแหน่งป้าย

/**
 * ตัวละครจิบิลายหมึก ณ ฐานเท้า (screen px), กึ่งกลางที่ fx
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawCharacter(ctx, fx, fy, bodyColor, scale = 1) {
  const headR = 16 * scale;
  const bodyW = 22 * scale, bodyH = 17 * scale;
  const bodyBottom = fy - 3 * scale, bodyTop = bodyBottom - bodyH;
  const bodyMidY = (bodyTop + bodyBottom) / 2;
  const headCy = bodyTop - headR + 5 * scale;
  ctx.lineJoin = 'round';

  // เงาหมึกใต้เท้า
  ctx.fillStyle = 'rgba(42,36,29,0.22)';
  ctx.beginPath(); ctx.ellipse(fx, fy, 13 * scale, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();

  // ขาสั้น
  ctx.fillStyle = INK;
  ctx.fillRect(fx - 6 * scale, bodyBottom - 3 * scale, 5 * scale, 6 * scale);
  ctx.fillRect(fx + 1 * scale, bodyBottom - 3 * scale, 5 * scale, 6 * scale);

  // ลำตัว (ชุด) + ขอบหมึก
  ctx.lineWidth = 1.8 * scale; ctx.strokeStyle = INK;
  ctx.fillStyle = bodyColor;
  inkEllipse(ctx, fx - bodyW / 2, bodyMidY, 3.6 * scale, 6 * scale);   // แขนซ้าย
  inkEllipse(ctx, fx + bodyW / 2, bodyMidY, 3.6 * scale, 6 * scale);   // แขนขวา
  inkEllipse(ctx, fx, bodyMidY, bodyW / 2, bodyH / 2);                 // ตัว

  // หัวโต + ขอบหมึก
  ctx.fillStyle = '#efd6ae';
  inkCircle(ctx, fx, headCy, headR);
  // ผมหมึก
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(fx, headCy, headR, Math.PI * 1.0, Math.PI * 2.0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(fx, headCy - headR * 0.5, headR * 0.98, headR * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  // ตาโต
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(fx - 5.5 * scale, headCy + 3 * scale, 2.1 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(fx + 5.5 * scale, headCy + 3 * scale, 2.1 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(fx - 4.8 * scale, headCy + 2.3 * scale, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(fx + 6.2 * scale, headCy + 2.3 * scale, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
}

function inkEllipse(ctx, x, y, rx, ry) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
function inkCircle(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

/**
 * ป้ายชื่อเหนือหัว = แผ่นกระดาษสา + ฉายา/ชื่อ + ตราสำนัก (§C.7, ธีมหมึกจีน)
 */
export function drawNameplate(ctx, fx, fy, info, scale = 1) {
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  /** @type {{text:string, font:string, color:string, brush?:boolean}[]} */
  const lines = [];
  if (info.title) lines.push({ text: `〈${info.title}〉`, font: `16px "Ma Shan Zheng","Noto Serif Thai",serif`, color: SEAL });
  lines.push({ text: info.role ? `〈${info.role}〉` : info.name, font: `bold 13px "Noto Serif Thai",serif`, color: info.role ? '#3b5566' : INK });
  if (info.sect) lines.push({ text: `${info.sect.crest} ${info.sect.name}`, font: `12px "Noto Serif Thai",serif`, color: SEAL });

  const lineH = 16 * scale;
  let maxW = 0;
  for (const ln of lines) { ctx.font = ln.font; maxW = Math.max(maxW, textWidth(ctx, ln.text)); }
  const padX = 9 * scale, padY = 5 * scale;
  const plaqueW = maxW + padX * 2;
  const plaqueH = lines.length * lineH + padY * 2;
  const topY = fy - CHIBI_H * scale - 12 - plaqueH;

  // แผ่นกระดาษสา + ขอบหมึก
  roundRect(ctx, fx - plaqueW / 2, topY, plaqueW, plaqueH, 4 * scale);
  ctx.fillStyle = PAPER; ctx.fill();
  ctx.lineWidth = 1.4 * scale; ctx.strokeStyle = 'rgba(42,36,29,0.7)'; ctx.stroke();
  // ตราชาดมุมขวาบน (จุดประทับ)
  ctx.fillStyle = SEAL;
  ctx.fillRect(fx + plaqueW / 2 - 6 * scale, topY + 3 * scale, 3 * scale, 3 * scale);

  // วาดข้อความทีละบรรทัด
  let y = topY + padY + lineH / 2;
  for (const ln of lines) {
    ctx.font = ln.font; ctx.fillStyle = ln.color;
    ctx.lineWidth = 2.5 * scale; ctx.strokeStyle = 'rgba(244,238,222,0.85)';
    ctx.strokeText(ln.text, fx, y);
    ctx.fillText(ln.text, fx, y);
    y += lineH;
  }

  // HP bar (รางหมึก + หยก)
  if (info.hpBar) {
    const w = 40 * scale, h = 5 * scale, x = fx - w / 2, by = topY + plaqueH + 3 * scale;
    ctx.fillStyle = INK; ctx.fillRect(x - 1, by - 1, w + 2, h + 2);
    ctx.fillStyle = '#5b2420'; ctx.fillRect(x, by, w, h);
    const pct = Math.max(0, Math.min(1, info.hpBar.hp / info.hpBar.maxHp));
    ctx.fillStyle = '#7d9a5b'; ctx.fillRect(x, by, w * pct, h);
  }
  ctx.restore();
}

/** วัดความกว้างข้อความอย่างปลอดภัย (มี fallback สำหรับ env ที่ไม่มี measureText) */
function textWidth(ctx, t) {
  try { const w = ctx.measureText(t).width; return (w && isFinite(w)) ? w : t.length * 8; }
  catch { return t.length * 8; }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export { ARCHETYPE_COLOR };
