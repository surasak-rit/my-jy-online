// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/create.js — หน้าสร้างตัวละคร (เริ่มเกมใหม่): ชื่อ + เพศ + สีชุด + พรีวิวสด
// เริ่มต้น "ยังไม่สังกัดสำนัก" (§4.3) — ไปฝากตัวกับอาจารย์ภายหลัง
// ──────────────────────────────────────────────────────────────────────────
import { drawCharacter } from '../render/sprites.js';

const ROBES = ['#3f5a6e', '#6e4a3f', '#3f6e52', '#5b4a6e', '#7a6a3a'];

/**
 * แสดงหน้าสร้างตัวละคร แล้ว resolve เมื่อกดเริ่ม (เซ็ตค่าให้ game.player แล้ว)
 * @param {import('../game.js').Game} game
 * @returns {Promise<void>}
 */
export function showCreate(game) {
  const el = /** @type {HTMLElement} */ (document.getElementById('create'));
  let gender = game.player.gender || 'male';
  let robe = game.player.robeColor || ROBES[0];

  el.innerHTML = `
    <div class="create-card">
      <h1 class="create-title">虎道 · สร้างจอมยุทธ์</h1>
      <canvas class="create-preview"></canvas>
      <label class="create-field">
        <span>ชื่อ</span>
        <input id="cc-name" maxlength="16" placeholder="ตั้งชื่อของเจ้า…" autocomplete="off" />
      </label>
      <div class="create-field">
        <span>เพศ</span>
        <div class="create-opts" id="cc-gender">
          <button data-v="male" class="${gender === 'male' ? 'on' : ''}">♂ ชาย</button>
          <button data-v="female" class="${gender === 'female' ? 'on' : ''}">♀ หญิง</button>
        </div>
      </div>
      <div class="create-field">
        <span>สีชุด</span>
        <div class="create-swatches" id="cc-robe">
          ${ROBES.map((c) => `<button data-c="${c}" class="${c === robe ? 'on' : ''}" style="background:${c}"></button>`).join('')}
        </div>
      </div>
      <p class="create-note">เริ่มต้นยังไม่สังกัดสำนัก — ไปฝากตัวกับอาจารย์ในเมืองภายหลัง</p>
      <button id="cc-go" class="create-go" disabled>เริ่มออกเดินทาง</button>
    </div>`;
  el.classList.remove('hidden');

  const q = (/** @type {string} */ c) => /** @type {HTMLElement} */ (el.querySelector(c));
  const nameI = /** @type {HTMLInputElement} */ (q('#cc-name'));
  const go = /** @type {HTMLButtonElement} */ (q('#cc-go'));

  q('#cc-gender').querySelectorAll('button').forEach((b) => {
    b.onclick = () => { gender = /** @type {string} */ (b.dataset.v); q('#cc-gender').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
  });
  q('#cc-robe').querySelectorAll('button').forEach((b) => {
    b.onclick = () => { robe = /** @type {string} */ (b.dataset.c); q('#cc-robe').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
  });
  nameI.oninput = () => { go.disabled = !nameI.value.trim(); };
  nameI.focus();

  // ── พรีวิวสด: เรนเดอร์ตัวละครจริง เดินอยู่กับที่ + หมุนดูรอบตัว (อัปเดตตามเพศ/สีทันที) ──
  const cv = /** @type {HTMLCanvasElement} */ (q('.create-preview'));
  const pctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
  const W = 150, H = 184, dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const FACES = ['S', 'E', 'N', 'W'];
  let raf = 0; const t0 = performance.now(); let last = t0, step = 0;
  const frame = (/** @type {number} */ now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    step += dt * 6; // เดินอยู่กับที่ให้เห็นแขน/ขาขยับ
    pctx.clearRect(0, 0, W, H);
    drawCharacter(pctx, W / 2, H - 24, robe, 1.35, FACES[Math.floor(t / 2.4) % 4], { moving: true, step, breath: t * 3, gender });
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return new Promise((resolve) => {
    go.onclick = () => {
      cancelAnimationFrame(raf);
      game.createCharacter({ name: nameI.value, gender, robeColor: robe });
      el.classList.add('hidden'); el.innerHTML = '';
      resolve();
    };
  });
}
