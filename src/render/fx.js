// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// render/fx.js — เอฟเฟกต์ท่าโจมตี/วิทยายุทธ (martial-arts strike VFX) แบบ data-driven
// แต่ละสกิลกำหนดเอฟเฟกต์เองในไฟล์สกิล (fx: {color, arcs, arcSpread, rings, sparks, core, spin})
// drawFx ประกอบเลเยอร์ตามค่าที่ส่งมา → ทุกสกิลหน้าตาไม่ซ้ำกัน + เพิ่มสกิลใหม่ไม่ต้องแก้โค้ด
// spawn/update เป็น pure (ทดสอบได้); draw แตะ canvas เท่านั้น
// ──────────────────────────────────────────────────────────────────────────

/** มุมหัน → เรเดียน (E=ขวา, S=ลง, W=ซ้าย, N=ขึ้น) */
export const FACE_ANGLE = { E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 };

/**
 * เพิ่มเอฟเฟกต์โจมตี 1 ครั้ง (ที่จุดกระทบ)
 * @param {any[]} list
 * @param {number} wx @param {number} wy
 * @param {Object} [opts]
 * @param {string} [opts.color]      สีหลัก
 * @param {number} [opts.arcs]       จำนวนวงเฉือน (crescent)
 * @param {number} [opts.arcSpread]  ความกว้างวงเฉือน (เรเดียน)
 * @param {number} [opts.rings]      จำนวนวงปราณขยาย
 * @param {number} [opts.sparks]     จำนวนเส้นประกายกระทบ
 * @param {boolean}[opts.core]       มีแกนเรืองตรงกลางไหม
 * @param {number} [opts.spin]       หมุนเอฟเฟกต์ (เรเดียน/วินาที)
 * @param {number} [opts.angle]      ทิศโจมตี · @param {number} [opts.power] สเกล · @param {number} [opts.dur]
 */
export function spawnStrike(list, wx, wy, opts = {}) {
  list.push({
    wx, wy, t: 0,
    dur: opts.dur || 0.32,
    color: opts.color || '#e9dec2',
    arcs: opts.arcs || 0,
    arcSpread: opts.arcSpread || 1,
    rings: opts.rings || 0,
    sparks: opts.sparks != null ? opts.sparks : 6,
    core: !!opts.core,
    spin: opts.spin || 0,
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
    const p = Math.min(1, f.t / f.dur);  // ความคืบหน้า 0→1
    const k = 1 - p;                      // จางลงตามเวลา
    const s = cam.worldToScreen(f.wx, f.wy);
    const sz = 16 + f.power * 9;          // ขนาดตาม power (ฝึกยิ่งสูงยิ่งใหญ่)
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(f.angle + f.spin * f.t);   // +x = ทิศโจมตี (+ หมุนถ้ามี spin)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // วงเฉือน/ฝ่ามือ (crescent) — หลายวงซ้อนเหลื่อมรัศมี/เวลา ให้รู้สึก "ชุดท่า"
    for (let i = 0; i < f.arcs; i++) {
      const pp = Math.min(1, p + i * 0.12);
      const reach = sz * (0.7 + pp * 0.8) * (1 + i * 0.18);
      const a0 = -f.arcSpread, a1 = -f.arcSpread + f.arcSpread * 2 * Math.min(1, pp * 1.4);
      ctx.globalAlpha = (1 - pp) * 0.95;
      ctx.strokeStyle = f.color; ctx.lineWidth = (4.5 * (1 - pp) + 1.5) * (f.power * 0.4 + 0.7);
      ctx.beginPath(); ctx.arc(reach * 0.25, 0, reach, a0, a1); ctx.stroke();
      ctx.globalAlpha = (1 - pp) * 0.55; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(reach * 0.25, 0, reach, a0, a1); ctx.stroke();
    }

    // วงปราณขยาย (rings) — ซ้อนเหลื่อมเวลา
    for (let i = 0; i < f.rings; i++) {
      const pp = Math.min(1, p + i * 0.16);
      ctx.globalAlpha = (1 - pp) * 0.7;
      ctx.strokeStyle = f.color; ctx.lineWidth = 3 * (1 - pp) + 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, sz * (0.3 + pp * 1.35), sz * (0.2 + pp * 0.95), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // แกนเรืองตรงกลาง (ช่วงต้น)
    if (f.core && p < 0.5) {
      ctx.globalAlpha = k * 0.5; ctx.fillStyle = f.color;
      ctx.beginPath(); ctx.arc(0, 0, sz * 0.38 * k, 0, Math.PI * 2); ctx.fill();
    }

    // ประกายกระทบ (sparks) — บอกจุดโดน
    ctx.globalAlpha = k * 0.9; ctx.strokeStyle = f.color; ctx.lineWidth = 2 * k + 0.5;
    for (let i = 0; i < f.sparks; i++) {
      const a = (i / f.sparks) * Math.PI * 2 + f.power;
      const r0 = sz * 0.25 * p, r1 = sz * (0.5 + p * 0.7);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke();
    }
    ctx.restore();
  }
}
