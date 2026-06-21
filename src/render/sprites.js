// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/sprites.js — วาดตัวละคร/NPC (placeholder) + ป้ายชื่อเหนือหัว (GDD §C.7)
// ยังไม่มี sprite จริง → วาด humanoid placeholder ตามสัดส่วน §C.1 แบบย่อ
// ──────────────────────────────────────────────────────────────────────────

/** สี placeholder ตามอาร์คีไทป์ NPC (GDD §D.2) */
const ARCHETYPE_COLOR = {
  villager: '#8a8170', merchant: '#9c3b2e', wanderer: '#46505e',
  monk: '#c98b3a', guard: '#33415c', beggar: '#6b6258',
  scholar: '#cdd6e0', child: '#d98fb0',
};

/**
 * วาดตัวละครหนึ่งตัว ณ ตำแหน่งฐานเท้า (screen px)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} fx ฐานเท้า x (screen)
 * @param {number} fy ฐานเท้า y (screen)
 * @param {string} bodyColor
 * @param {number} [scale=1]
 */
export function drawCharacter(ctx, fx, fy, bodyColor, scale = 1) {
  const H = 96 * scale;           // ความสูงตัว (px) — baseline §C.1
  const headR = (H / 7.5) / 2;    // หัว ~1/7.5 ของความสูง
  // เงาใต้เท้า
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(fx, fy, 16 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  // ขา
  ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 5 * scale; ctx.lineCap = 'round';
  const hipY = fy - H * 0.45;
  ctx.beginPath(); ctx.moveTo(fx - 5 * scale, fy - 2); ctx.lineTo(fx - 4 * scale, hipY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fx + 5 * scale, fy - 2); ctx.lineTo(fx + 4 * scale, hipY); ctx.stroke();
  // ลำตัว (ชุด)
  const shoulderY = fy - H * 0.78;
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(fx - 10 * scale, hipY);
  ctx.lineTo(fx + 10 * scale, hipY);
  ctx.lineTo(fx + 8 * scale, shoulderY);
  ctx.lineTo(fx - 8 * scale, shoulderY);
  ctx.closePath(); ctx.fill();
  // แขน
  ctx.strokeStyle = bodyColor; ctx.lineWidth = 5 * scale;
  ctx.beginPath(); ctx.moveTo(fx - 8 * scale, shoulderY + 2); ctx.lineTo(fx - 13 * scale, hipY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fx + 8 * scale, shoulderY + 2); ctx.lineTo(fx + 13 * scale, hipY); ctx.stroke();
  // หัว
  const headCY = shoulderY - headR - 2 * scale;
  ctx.fillStyle = '#e6c8a0';
  ctx.beginPath(); ctx.arc(fx, headCY, headR + 3 * scale, 0, Math.PI * 2); ctx.fill();
}

/**
 * ป้ายชื่อเหนือหัว: ฉายา / ชื่อ + ตราสำนัก / HP (GDD §C.7)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} fx ฐานเท้า x
 * @param {number} fy ฐานเท้า y
 * @param {Object} info
 * @param {string} info.name
 * @param {string|null} [info.title]
 * @param {{ name:string, crest:string, color:string }|null} [info.sect]
 * @param {string} [info.role]            // สำหรับ NPC
 * @param {{ hp:number, maxHp:number }} [info.hpBar]
 * @param {number} [scale=1]
 */
export function drawNameplate(ctx, fx, fy, info, scale = 1) {
  const topY = fy - 96 * scale - 30; // เหนือหัว
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let y = topY;

  // ฉายา (title) — บนสุด
  if (info.title) {
    ctx.font = `italic 12px "Noto Sans Thai", sans-serif`;
    ctx.fillStyle = '#ffd479';
    outlineText(ctx, `〈${info.title}〉`, fx, y);
    y += 15;
  }

  // บรรทัดชื่อ (+ ตราสำนัก / บทบาท NPC)
  ctx.font = `bold 13px "Noto Sans Thai", sans-serif`;
  ctx.fillStyle = info.role ? '#bfe3ff' : '#ffffff';
  const label = info.role ? `〈${info.role}〉` : info.name;
  outlineText(ctx, label, fx, y);
  y += 15;

  // สำนัก (ตรา + ชื่อ + สีประจำสำนัก) — ตัวบอกสังกัดหลัก (§C.7.1)
  if (info.sect) {
    ctx.font = `12px "Noto Sans Thai", sans-serif`;
    ctx.fillStyle = info.sect.color;
    outlineText(ctx, `${info.sect.crest} ${info.sect.name}`, fx, y);
    y += 14;
  }

  // HP bar
  if (info.hpBar) {
    const w = 40 * scale, h = 5, x = fx - w / 2;
    ctx.fillStyle = '#000a'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#b33';  ctx.fillRect(x, y, w, h);
    const pct = Math.max(0, Math.min(1, info.hpBar.hp / info.hpBar.maxHp));
    ctx.fillStyle = '#4caf50'; ctx.fillRect(x, y, w * pct, h);
  }
}

function outlineText(ctx, text, x, y) {
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

export { ARCHETYPE_COLOR };
