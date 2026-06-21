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

/** ผสมสี hex เข้าหาดำ (amt<1) หรือขาว (ส่ง white=true) */
function mix(hex, amt, white = false) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = white ? 255 : 0;
  r = Math.round(r + (t - r) * amt); g = Math.round(g + (t - g) * amt); b = Math.round(b + (t - b) * amt);
  return `rgb(${r},${g},${b})`;
}

/**
 * ตัวละครจิบิลายหมึก + แสงเงา + หันหน้าตามทิศ
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} [facing] 'S'|'N'|'E'|'W'
 */
export function drawCharacter(ctx, fx, fy, bodyColor, scale = 1, facing = 'S') {
  const headR = 16 * scale;
  const bodyW = 22 * scale, bodyH = 17 * scale;
  const bodyBottom = fy - 3 * scale, bodyTop = bodyBottom - bodyH;
  const bodyMidY = (bodyTop + bodyBottom) / 2;
  const headCy = bodyTop - headR + 5 * scale;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.8 * scale; ctx.strokeStyle = INK;

  // เงาหมึกใต้เท้า
  ctx.fillStyle = 'rgba(42,36,29,0.22)';
  ctx.beginPath(); ctx.ellipse(fx, fy, 13 * scale, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();

  // รองเท้า
  ctx.fillStyle = '#241f1c';
  ctx.beginPath(); ctx.ellipse(fx - 4 * scale, bodyBottom + 1 * scale, 3.5 * scale, 2.2 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(fx + 4 * scale, bodyBottom + 1 * scale, 3.5 * scale, 2.2 * scale, 0, 0, Math.PI * 2); ctx.fill();

  // แขน (ชุด)
  ctx.fillStyle = mix(bodyColor, 0.12);
  inkEllipse(ctx, fx - bodyW / 2, bodyMidY, 3.6 * scale, 6 * scale);
  inkEllipse(ctx, fx + bodyW / 2, bodyMidY, 3.6 * scale, 6 * scale);

  // ลำตัว (ชุด) + ไล่แสง: ฐานสี → เงาล่างขวา → ไฮไลต์บนซ้าย
  ctx.fillStyle = bodyColor;
  inkEllipse(ctx, fx, bodyMidY, bodyW / 2, bodyH / 2);
  ctx.save(); ctx.beginPath(); ctx.ellipse(fx, bodyMidY, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = mix(bodyColor, 0.28); // เงาล่างขวา
  ctx.beginPath(); ctx.ellipse(fx + 5 * scale, bodyMidY + 4 * scale, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = mix(bodyColor, 0.30, true); // ไฮไลต์บนซ้าย
  ctx.beginPath(); ctx.ellipse(fx - 5 * scale, bodyMidY - 4 * scale, 5 * scale, 4 * scale, 0, 0, Math.PI * 2); ctx.fill();
  // สายคาดเอว
  ctx.fillStyle = '#caa24a';
  ctx.fillRect(fx - bodyW / 2, bodyMidY + 1 * scale, bodyW, 3 * scale);
  ctx.restore();

  // หัว + ขอบหมึก
  ctx.fillStyle = '#efd6ae';
  inkCircle(ctx, fx, headCy, headR);
  // ผม
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(fx, headCy, headR, Math.PI * 1.0, Math.PI * 2.0); ctx.fill();
  ctx.beginPath(); ctx.ellipse(fx, headCy - headR * 0.5, headR * 0.98, headR * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  if (facing === 'N') {
    // หันหลัง: มวยผม ไม่มีตา
    ctx.beginPath(); ctx.arc(fx, headCy, headR * 0.92, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c1714'; ctx.beginPath(); ctx.arc(fx, headCy - headR * 0.4, 3.5 * scale, 0, Math.PI * 2); ctx.fill();
  } else {
    const ex = facing === 'E' ? 3 * scale : facing === 'W' ? -3 * scale : 0;
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(fx - 5.5 * scale + ex, headCy + 3 * scale, 2.1 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 5.5 * scale + ex, headCy + 3 * scale, 2.1 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(fx - 4.8 * scale + ex, headCy + 2.3 * scale, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 6.2 * scale + ex, headCy + 2.3 * scale, 0.7 * scale, 0, Math.PI * 2); ctx.fill();
  }
}

function inkEllipse(ctx, x, y, rx, ry) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
function inkCircle(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

/**
 * ป้ายชื่อเหนือหัว — ฉายา/ชื่อ + ตราสำนัก (§C.7, ธีมหมึกจีน)
 * info.boxed=false → ไม่มีกรอบ (เช่น NPC) · info.align='left' → ข้อความชิดซ้าย
 */
export function drawNameplate(ctx, fx, fy, info, scale = 1) {
  const boxed = info.boxed !== false;
  const align = info.align || 'center';
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;

  /** @type {{text:string, font:string, color:string}[]} */
  const lines = [];
  if (info.title) lines.push({ text: `〈${info.title}〉`, font: `16px "Ma Shan Zheng","Noto Serif Thai",serif`, color: SEAL });
  lines.push({ text: info.role ? `〈${info.role}〉` : info.name, font: `bold 13px "Noto Serif Thai",serif`, color: info.role ? '#3b5566' : INK });
  if (info.sect) lines.push({ text: `${info.sect.crest} ${info.sect.name}`, font: `12px "Noto Serif Thai",serif`, color: SEAL });

  const lineH = 16 * scale;
  let maxW = 0;
  for (const ln of lines) { ctx.font = ln.font; maxW = Math.max(maxW, textWidth(ctx, ln.text)); }
  const padX = boxed ? 9 * scale : 0, padY = boxed ? 5 * scale : 0;
  const plaqueW = maxW + padX * 2;
  const plaqueH = lines.length * lineH + padY * 2;
  const topY = fy - CHIBI_H * scale - 12 - plaqueH;

  if (boxed) {
    roundRect(ctx, fx - plaqueW / 2, topY, plaqueW, plaqueH, 4 * scale);
    ctx.fillStyle = PAPER; ctx.fill();
    ctx.lineWidth = 1.4 * scale; ctx.strokeStyle = 'rgba(42,36,29,0.7)'; ctx.stroke();
    ctx.fillStyle = SEAL; // ตราชาดมุมป้าย
    ctx.fillRect(fx + plaqueW / 2 - 6 * scale, topY + 3 * scale, 3 * scale, 3 * scale);
  }

  // x ของข้อความ: ชิดซ้าย = เริ่มที่กึ่งกลางตัว (fx), กึ่งกลาง = fx
  const tx = align === 'left' ? (boxed ? fx - plaqueW / 2 + padX : fx) : fx;
  // ไม่มีกรอบ → halo เข้มขึ้นให้อ่านออกบนพื้น
  const halo = boxed ? 'rgba(244,238,222,0.85)' : 'rgba(244,238,222,0.95)';
  let y = topY + padY + lineH / 2;
  for (const ln of lines) {
    ctx.font = ln.font; ctx.lineWidth = boxed ? 2.5 * scale : 3 * scale; ctx.strokeStyle = halo;
    ctx.strokeText(ln.text, tx, y);
    ctx.fillStyle = ln.color; ctx.fillText(ln.text, tx, y);
    y += lineH;
  }

  if (info.hpBar) {
    const w = 40 * scale, h = 5 * scale;
    const x = align === 'left' ? tx : fx - w / 2;
    const by = topY + plaqueH + 3 * scale;
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
