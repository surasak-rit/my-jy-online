// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/fx.js — เอฟเฟกต์ท่าโจมตี/วิทยายุทธ (martial-arts strike VFX)
// แยกตามสายวิชา: 外功→ฝ่ามือพลัง(palm) · 內功→คลื่นปราณ(qi) · 輕功→วงเฉือน(slash) · มือเปล่า(fist)
// spawn/update เป็น pure (ทดสอบได้); draw แตะ canvas เท่านั้น
// ──────────────────────────────────────────────────────────────────────────

/** มุมหัน → เรเดียน (E=ขวา, S=ลง, W=ซ้าย, N=ขึ้น) */
export const FACE_ANGLE = { E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 };

/**
 * เพิ่มเอฟเฟกต์โจมตี 1 ครั้ง (ที่จุดกระทบ)
 * @param {any[]} list
 * @param {number} wx @param {number} wy  ตำแหน่ง world (ยกขึ้นระดับอกแล้ว)
 * @param {{style?:string, color?:string, angle?:number, power?:number, dur?:number}} [opts]
 */
export function spawnStrike(list, wx, wy, opts = {}) {
  list.push({
    wx, wy, t: 0,
    dur: opts.dur || 0.32,
    style: opts.style || 'fist',
    color: opts.color || '#e9dec2',
    angle: opts.angle || 0,
    power: opts.power || 1,
  });
}

/** เดินเวลาเอฟเฟกต์ + คัดตัวที่หมดอายุออก (คืน array ใหม่) */
export function updateFx(list, dt) {
  for (const f of list) f.t += dt;
  return list.filter((f) => f.t < f.dur);
}

/**
 * วาดเอฟเฟกต์ทั้งหมด (เรียกใน render หลังวาดตัวละคร)
 * @param {CanvasRenderingContext2D} ctx
 * @param {{worldToScreen:(x:number,y:number)=>{x:number,y:number}}} cam
 * @param {any[]} list
 */
export function drawFx(ctx, cam, list) {
  for (const f of list) {
    const p = Math.min(1, f.t / f.dur);   // ความคืบหน้า 0→1
    const k = 1 - p;                        // จางลงตามเวลา
    const s = cam.worldToScreen(f.wx, f.wy);
    const sz = 16 + f.power * 9;            // ขนาดตาม power (ฝึกยิ่งสูงยิ่งใหญ่)
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(f.angle);                    // +x = ทิศโจมตี
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // วงเฉือน/ฝ่ามือ: arc โค้งกวาดไปด้านหน้า + แกนสว่าง
    if (f.style === 'slash' || f.style === 'palm') {
      const reach = sz * (0.7 + p * 0.8);
      const spread = f.style === 'slash' ? 1.15 : 0.8; // เฉือน=กว้าง, ฝ่ามือ=กระชับ
      const a0 = -spread, a1 = -spread + (spread * 2) * Math.min(1, p * 1.4);
      ctx.globalAlpha = k * 0.95;
      ctx.strokeStyle = f.color; ctx.lineWidth = (4.5 * k + 1.5) * (f.power * 0.5 + 0.7);
      ctx.beginPath(); ctx.arc(reach * 0.25, 0, reach, a0, a1); ctx.stroke();
      ctx.globalAlpha = k * 0.6; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(reach * 0.25, 0, reach, a0, a1); ctx.stroke();
    }

    // คลื่นปราณ: วงแหวนขยายซ้อน (內功) — palm ก็มีวงแรงดันเล็ก ๆ
    if (f.style === 'qi' || f.style === 'palm') {
      const rings = f.style === 'qi' ? 2 : 1;
      for (let i = 0; i < rings; i++) {
        const pp = Math.min(1, p + i * 0.18);
        ctx.globalAlpha = (1 - pp) * 0.7;
        ctx.strokeStyle = f.color; ctx.lineWidth = 3 * (1 - pp) + 1;
        ctx.beginPath();
        ctx.ellipse(sz * 0.3, 0, sz * (0.3 + pp * 1.3), sz * (0.2 + pp * 0.9), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // แกนเรืองตรงกลาง (เฉพาะช่วงต้น)
      if (p < 0.5) { ctx.globalAlpha = k * 0.5; ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(sz * 0.3, 0, sz * 0.35 * k, 0, Math.PI * 2); ctx.fill(); }
    }

    // ประกายกระทบ: เส้นพุ่งรอบทิศ (ทุกสไตล์ — บอกจุดโดน)
    ctx.globalAlpha = k * 0.9;
    ctx.strokeStyle = f.color; ctx.lineWidth = 2 * k + 0.5;
    const n = f.style === 'fist' ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + f.power;
      const r0 = sz * 0.25 * p, r1 = sz * (0.5 + p * 0.7);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke();
    }
    ctx.restore();
  }
}
