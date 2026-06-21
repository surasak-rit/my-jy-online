// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/sprites.js — ตัวละครผู้ใหญ่สไตล์ JY Online (ชุดคลุมยาว ~7 หัว) + ป้ายชื่อ
// สไตล์นิยายกำลังภายใน: robe คอไขว้ สายคาดเอว แสงเงา หันหน้าตามทิศ; ป้าย = กระดาษสา/ตราชาด
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

const CHAR_H = 100; // ความสูงตัวละครผู้ใหญ่ (px @scale=1) — ใช้จัดตำแหน่งป้าย

/** ผสมสี hex เข้าหาดำ (amt<1) หรือขาว (ส่ง white=true) */
function mix(hex, amt, white = false) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = white ? 255 : 0;
  r = Math.round(r + (t - r) * amt); g = Math.round(g + (t - g) * amt); b = Math.round(b + (t - b) * amt);
  return `rgb(${r},${g},${b})`;
}

/**
 * ตัวละครผู้ใหญ่สไตล์ JY Online — ชุดคลุมยาว (robe), แขนกว้าง, คอไขว้,
 * สายคาดเอว, แสงเงา, หันหน้าตามทิศ. สัดส่วน ~7 หัว
 * anim: { moving, step (เรเดียนผูกระยะเดิน), breath (เรเดียนเวลา) } → ทำให้ขยับเนียน
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} [facing] 'S'|'N'|'E'|'W'
 * @param {{moving?:boolean, step?:number, breath?:number}} [anim]
 */
export function drawCharacter(ctx, fx, fy, bodyColor, scale = 1, facing = 'S', anim = {}) {
  const s = scale;
  const mv = !!anim.moving, step = anim.step || 0, breath = anim.breath || 0;
  // bob: เดิน=เด้งสองครั้ง/รอบ (|sin|), ยืน=หายใจช้า ๆ ; sw: แกว่งแขน/ก้าวเท้า -1..1
  const bob = mv ? Math.abs(Math.sin(step)) * 2.6 * s : (Math.sin(breath) * 0.9 + 0.9) * s;
  const sw = mv ? Math.sin(step) : Math.sin(breath) * 0.18;
  const lean = mv ? (facing === 'E' ? 1.4 * s : facing === 'W' ? -1.4 * s : 0) : 0;
  const by = -bob; // ยกลำตัวขึ้น (สะโพกขึ้นบน, ชายเสื้ออยู่กับพื้น → ยืด/ยุบ)

  const headR = 8 * s, headCy = fy - 90 * s + by;
  const shoulderY = fy - 80 * s + by, shoulderHalf = 12 * s;
  const waistY = fy - 50 * s + by, hemY = fy - 3 * s, hemHalf = 17 * s;
  const dark = mix(bodyColor, 0.30), light = mix(bodyColor, 0.22, true), collar = mix(bodyColor, 0.45);
  const skin = '#e9c9a0';
  ctx.lineJoin = 'round'; ctx.lineWidth = 1.4 * s; ctx.strokeStyle = INK;

  // เงาใต้เท้า (อยู่กับพื้น ไม่เด้ง — ย่อเล็กน้อยตอนตัวลอย)
  ctx.fillStyle = 'rgba(42,36,29,0.25)';
  ctx.beginPath(); ctx.ellipse(fx, fy, 15 * s - bob * 0.5, 5 * s, 0, 0, Math.PI * 2); ctx.fill();

  // เท้า: ก้าวสลับซ้าย-ขวา + ยกตอนก้าว
  const lift = mv ? 2 * s : 0;
  drawFoot(ctx, fx - 5 * s + sw * 3 * s, hemY - Math.max(0, sw) * lift, s);
  drawFoot(ctx, fx + 5 * s - sw * 3 * s, hemY - Math.max(0, -sw) * lift, s);

  // เสื้อคลุมยาว (robe) — บานปลาย (ไหล่เด้งตาม by, ชายอยู่กับพื้น)
  ctx.beginPath();
  ctx.moveTo(fx - shoulderHalf + lean, shoulderY);
  ctx.quadraticCurveTo(fx - shoulderHalf - 2 * s, waistY, fx - hemHalf, hemY);
  ctx.lineTo(fx + hemHalf, hemY);
  ctx.quadraticCurveTo(fx + shoulderHalf + 2 * s, waistY, fx + shoulderHalf + lean, shoulderY);
  ctx.quadraticCurveTo(fx + lean, shoulderY - 4 * s, fx - shoulderHalf + lean, shoulderY);
  ctx.closePath();
  ctx.fillStyle = bodyColor; ctx.fill(); ctx.stroke();

  // แสงเงาภายในทรง robe
  ctx.save(); ctx.clip();
  ctx.fillStyle = dark; // เงาขวา
  ctx.beginPath(); ctx.moveTo(fx + 2 * s, shoulderY); ctx.lineTo(fx + hemHalf + 4 * s, hemY); ctx.lineTo(fx + shoulderHalf + 4 * s, shoulderY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = light; // ไฮไลต์ซ้าย
  ctx.beginPath(); ctx.moveTo(fx - shoulderHalf + 1 * s, shoulderY); ctx.lineTo(fx - hemHalf + 3 * s, hemY); ctx.lineTo(fx - hemHalf + 9 * s, hemY); ctx.lineTo(fx - shoulderHalf + 7 * s, shoulderY); ctx.closePath(); ctx.fill();
  // คอเสื้อไขว้ (交领)
  ctx.fillStyle = collar;
  ctx.beginPath(); ctx.moveTo(fx + lean, shoulderY - 3 * s); ctx.lineTo(fx - 7 * s, shoulderY + 2 * s); ctx.lineTo(fx - 3 * s, waistY); ctx.lineTo(fx + lean, waistY - 6 * s); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(fx + lean, shoulderY - 3 * s); ctx.lineTo(fx + 7 * s, shoulderY + 2 * s); ctx.lineTo(fx + 3 * s, waistY); ctx.lineTo(fx + lean, waistY - 6 * s); ctx.closePath(); ctx.fill();
  ctx.restore();

  // สายคาดเอว + ชายผ้า (แกว่งเล็กน้อยตามจังหวะ)
  ctx.fillStyle = '#caa24a'; ctx.fillRect(fx - shoulderHalf * 0.95, waistY, shoulderHalf * 1.9, 4 * s);
  ctx.fillStyle = '#a8842f'; ctx.fillRect(fx - 2 * s + sw * 2 * s, waistY, 4 * s, 13 * s);

  // แขนเสื้อกว้าง (แกว่งสลับข้าง) + มือ
  ctx.fillStyle = mix(bodyColor, 0.10);
  drapeSleeve(ctx, fx - shoulderHalf + lean, shoulderY, -1, s, skin, sw * 3.5 * s);
  drapeSleeve(ctx, fx + shoulderHalf + lean, shoulderY, 1, s, skin, -sw * 3.5 * s);

  // คอ + หัว (เอียงตามทิศ)
  ctx.fillStyle = skin; ctx.fillRect(fx - 2.5 * s + lean, headCy + headR - 1 * s, 5 * s, 5 * s);
  ctx.fillStyle = '#efd6ae'; ctx.beginPath(); ctx.arc(fx + lean, headCy, headR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // ผม + มวยผม (topknot)
  const hx = fx + lean;
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(hx, headCy, headR, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx, headCy - headR * 0.6, headR * 1.05, headR * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx, headCy - headR * 1.15, 3 * s, 0, Math.PI * 2); ctx.fill();
  if (facing === 'N') {
    ctx.beginPath(); ctx.arc(hx, headCy, headR * 0.92, 0, Math.PI * 2); ctx.fill(); // หันหลัง
  } else {
    const ex = facing === 'E' ? 2 * s : facing === 'W' ? -2 * s : 0;
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(hx - 3 * s + ex, headCy + 1 * s, 1.3 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + 3 * s + ex, headCy + 1 * s, 1.3 * s, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFoot(ctx, x, y, s) {
  ctx.fillStyle = '#2a221c';
  ctx.beginPath(); ctx.ellipse(x, y, 4 * s, 2.4 * s, 0, 0, Math.PI * 2); ctx.fill();
}

/** แขนเสื้อกว้างทรงห้อย (dir = -1 ซ้าย / +1 ขวา) + มือโผล่; sx2 = แกว่งปลายแขน */
function drapeSleeve(ctx, sx, sy, dir, s, skin, sx2 = 0) {
  ctx.beginPath();
  ctx.moveTo(sx, sy + 1 * s);
  ctx.quadraticCurveTo(sx + dir * 9 * s + sx2, sy + 12 * s, sx + dir * 6 * s + sx2, sy + 28 * s);
  ctx.lineTo(sx + dir * 0.5 * s + sx2, sy + 26 * s);
  ctx.quadraticCurveTo(sx - dir * 1 * s, sy + 12 * s, sx, sy + 1 * s);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(sx + dir * 4 * s + sx2, sy + 27 * s, 2 * s, 0, Math.PI * 2); ctx.fill(); ctx.restore();
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
  const topY = fy - CHAR_H * scale - 12 - plaqueH;

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
