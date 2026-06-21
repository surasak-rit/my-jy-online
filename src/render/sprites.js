// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/sprites.js — วาดตัวละคร/NPC (placeholder สไตล์ "จิบิ") + ป้ายชื่อ (§C.7)
// จิบิ: หัวโต ตัวเล็ก แขนขาสั้น ตาโต — น่ารัก อ่านง่ายในจอเล็ก
// ──────────────────────────────────────────────────────────────────────────

/** สี placeholder ตามอาร์คีไทป์ NPC (GDD §D.2) */
const ARCHETYPE_COLOR = {
  villager: '#8a8170', merchant: '#9c3b2e', wanderer: '#46505e',
  monk: '#c98b3a', guard: '#33415c', beggar: '#6b6258',
  scholar: '#cdd6e0', child: '#d98fb0',
};

/** ความสูงโดยประมาณของตัวจิบิ (px ที่ scale=1) — ใช้จัดตำแหน่งป้ายชื่อ */
const CHIBI_H = 48;

/**
 * วาดตัวละครจิบิ ณ ตำแหน่งฐานเท้า (screen px), จัดกึ่งกลางที่ fx
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} fx ฐานเท้า x
 * @param {number} fy ฐานเท้า y
 * @param {string} bodyColor
 * @param {number} [scale=1]
 */
export function drawCharacter(ctx, fx, fy, bodyColor, scale = 1) {
  const headR = 16 * scale;
  const bodyW = 22 * scale, bodyH = 17 * scale;
  const bodyBottom = fy - 3 * scale;
  const bodyTop = bodyBottom - bodyH;
  const bodyMidY = (bodyTop + bodyBottom) / 2;
  const headCy = bodyTop - headR + 5 * scale;

  // เงาใต้เท้า
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(fx, fy, 13 * scale, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();

  // ขาสั้น (สองตอ)
  ctx.fillStyle = '#3a352e';
  ctx.fillRect(fx - 6 * scale, bodyBottom - 3 * scale, 5 * scale, 6 * scale);
  ctx.fillRect(fx + 1 * scale, bodyBottom - 3 * scale, 5 * scale, 6 * scale);

  // ลำตัว (มน) — สีชุด
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(fx, bodyMidY, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2); ctx.fill();
  // แขนสั้น (สองข้าง)
  ctx.beginPath(); ctx.ellipse(fx - bodyW / 2, bodyMidY, 3.5 * scale, 6 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(fx + bodyW / 2, bodyMidY, 3.5 * scale, 6 * scale, 0, 0, Math.PI * 2); ctx.fill();

  // หัวโต
  ctx.fillStyle = '#f0d2a8';
  ctx.beginPath(); ctx.arc(fx, headCy, headR, 0, Math.PI * 2); ctx.fill();
  // ผม (ครึ่งบนของหัว)
  ctx.fillStyle = '#2a2320';
  ctx.beginPath(); ctx.arc(fx, headCy, headR, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  ctx.beginPath(); ctx.ellipse(fx, headCy - headR * 0.45, headR * 0.95, headR * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  // ตาโต (สองจุด)
  ctx.fillStyle = '#241f1c';
  ctx.beginPath(); ctx.arc(fx - 5.5 * scale, headCy + 3 * scale, 2.1 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(fx + 5.5 * scale, headCy + 3 * scale, 2.1 * scale, 0, Math.PI * 2); ctx.fill();
  // ประกายตา
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(fx - 4.8 * scale, headCy + 2.3 * scale, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(fx + 6.2 * scale, headCy + 2.3 * scale, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
}

/**
 * ป้ายชื่อเหนือหัว: ฉายา / ชื่อ + ตราสำนัก / HP (GDD §C.7)
 * จัดกึ่งกลางที่ fx เสมอ (save/restore กันสถานะ align รั่ว → ป้ายไม่เลื่อนขวา)
 */
export function drawNameplate(ctx, fx, fy, info, scale = 1) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let y = fy - CHIBI_H * scale - 14; // เหนือหัวจิบิ

  if (info.title) {
    ctx.font = `italic 12px "Noto Sans Thai", sans-serif`;
    ctx.fillStyle = '#ffd479';
    outlineText(ctx, `〈${info.title}〉`, fx, y); y += 15;
  }
  ctx.font = `bold 13px "Noto Sans Thai", sans-serif`;
  ctx.fillStyle = info.role ? '#bfe3ff' : '#ffffff';
  outlineText(ctx, info.role ? `〈${info.role}〉` : info.name, fx, y); y += 15;

  if (info.sect) {
    ctx.font = `12px "Noto Sans Thai", sans-serif`;
    ctx.fillStyle = info.sect.color;
    outlineText(ctx, `${info.sect.crest} ${info.sect.name}`, fx, y); y += 14;
  }
  if (info.hpBar) {
    const w = 40 * scale, h = 5, x = fx - w / 2;
    ctx.fillStyle = '#000a'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#b33'; ctx.fillRect(x, y, w, h);
    const pct = Math.max(0, Math.min(1, info.hpBar.hp / info.hpBar.maxHp));
    ctx.fillStyle = '#4caf50'; ctx.fillRect(x, y, w * pct, h);
  }
  ctx.restore();
}

function outlineText(ctx, text, x, y) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; // กันสถานะรั่ว (defensive)
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

export { ARCHETYPE_COLOR };
