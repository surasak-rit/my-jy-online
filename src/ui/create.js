// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/create.js — หน้าสร้างตัวละคร (เริ่มเกมใหม่): ชื่อ + เพศ + สีชุด
// เริ่มต้น "ยังไม่สังกัดสำนัก" (§4.3) — ไปฝากตัวกับอาจารย์ภายหลัง
// ──────────────────────────────────────────────────────────────────────────

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

  return new Promise((resolve) => {
    go.onclick = () => {
      game.createCharacter({ name: nameI.value, gender, robeColor: robe });
      el.classList.add('hidden'); el.innerHTML = '';
      resolve();
    };
  });
}
