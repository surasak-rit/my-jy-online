// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/create.js — หน้าสร้างตัวละคร (เริ่มเกมใหม่): ชื่อ + เพศ + สีชุด
//   + ทอยค่ากำเนิด 7 ค่า (資質屬性, §สเตตัส C) + ตั้งวันเกิด (生日系統)
// เริ่มต้น "ยังไม่สังกัดสำนัก" (§4.3) — ไปฝากตัวกับอาจารย์ภายหลัง
// ──────────────────────────────────────────────────────────────────────────

const ROBES = ['#3f5a6e', '#6e4a3f', '#3f6e52', '#5b4a6e', '#7a6a3a'];

/** ค่าคุณสมบัติกำเนิด 7 ค่า (資質屬性) — กำหนดตอนสร้างตัว (GDD §สเตตัส C) */
export const BIRTH_ATTRS = [
  { key: 'might', th: 'พลังแขน', cn: '臂力', tip: 'น้ำหนักแบก + ผลโจมตีกายภาพ' },
  { key: 'courage', th: 'ความกล้า', cn: '膽識', tip: 'ออกท่าเร็ว — เงื่อนไขวิชาชั้นสูง' },
  { key: 'insight', th: 'รู้แจ้ง', cn: '悟性', tip: 'ฝึกวิชาเร็ว + ได้แต้มบำเพ็ญมาก' },
  { key: 'fortune', th: 'วาสนา', cn: '福緣', tip: 'โชค/โอกาส drop + เหตุการณ์บังเอิญ' },
  { key: 'focus', th: 'สมาธิ', cn: '定力', tip: 'ต้านทานจิต + สะสมพลัง (เพิ่มป้องกัน)' },
  { key: 'agility', th: 'ปฏิภาณ', cn: '機敏', tip: 'ส่งผลต่อ身法/หลบหลีก' },
  { key: 'bone', th: 'กระดูก', cn: '根骨', tip: 'ความแกร่ง/เลือด — 1 กระดูก = เลือดมากขึ้น' },
];

/** ทอยค่ากำเนิด 1 ชุด — แต่ละค่า 8–22 (คืน object คีย์ตาม BIRTH_ATTRS) */
export function rollAttrs() {
  /** @type {Record<string, number>} */
  const out = {};
  for (const a of BIRTH_ATTRS) out[a.key] = 8 + Math.floor(Math.random() * 15);
  return out;
}

/** รวมแต้มค่ากำเนิด */
const sumAttrs = (/** @type {Record<string,number>} */ a) => BIRTH_ATTRS.reduce((s, x) => s + (a[x.key] || 0), 0);

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

/**
 * แสดงหน้าสร้างตัวละคร แล้ว resolve เมื่อกดเริ่ม (เซ็ตค่าให้ game.player แล้ว)
 * @param {import('../game.js').Game} game
 * @returns {Promise<void>}
 */
export function showCreate(game) {
  const el = /** @type {HTMLElement} */ (document.getElementById('create'));
  let gender = game.player.gender || 'male';
  let robe = game.player.robeColor || ROBES[0];
  let attrs = rollAttrs();

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

      <div class="cc-section">
        <div class="cc-section-head">
          <span>ค่ากำเนิด <em>資質</em></span>
          <span class="cc-total">รวม <b id="cc-sum">0</b></span>
        </div>
        <div class="cc-attrs" id="cc-attrs"></div>
        <button id="cc-roll" class="cc-roll" type="button">🎲 ทอยใหม่</button>
      </div>

      <div class="create-field">
        <span>วันเกิด</span>
        <div class="cc-birth">
          <select id="cc-bmonth" aria-label="เดือนเกิด">
            ${MONTHS.map((m) => `<option value="${m}">เดือน ${m}</option>`).join('')}
          </select>
          <select id="cc-bday" aria-label="วันเกิด">
            ${DAYS.map((d) => `<option value="${d}">วันที่ ${d}</option>`).join('')}
          </select>
        </div>
      </div>
      <p class="create-note">ถึงวันเกิดในเกม (1 ปีในเกม ≈ 1 เดือนจริง) ค่ากำเนิดเพิ่มสุ่ม +0–2 · เริ่มต้นยังไม่สังกัดสำนัก</p>
      <button id="cc-go" class="create-go" disabled>เริ่มออกเดินทาง</button>
    </div>`;
  el.classList.remove('hidden');

  const q = (/** @type {string} */ c) => /** @type {HTMLElement} */ (el.querySelector(c));
  const nameI = /** @type {HTMLInputElement} */ (q('#cc-name'));
  const go = /** @type {HTMLButtonElement} */ (q('#cc-go'));
  const attrsBox = q('#cc-attrs');
  const sumEl = q('#cc-sum');

  const renderAttrs = () => {
    attrsBox.innerHTML = BIRTH_ATTRS.map((a) => `
      <div class="cc-attr" title="${a.cn} — ${a.tip}">
        <span class="cc-attr-name">${a.th}</span>
        <span class="cc-attr-val">${attrs[a.key]}</span>
      </div>`).join('');
    sumEl.textContent = String(sumAttrs(attrs));
  };
  renderAttrs();

  q('#cc-gender').querySelectorAll('button').forEach((b) => {
    b.onclick = () => { gender = /** @type {string} */ (b.dataset.v); q('#cc-gender').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
  });
  q('#cc-robe').querySelectorAll('button').forEach((b) => {
    b.onclick = () => { robe = /** @type {string} */ (b.dataset.c); q('#cc-robe').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
  });
  q('#cc-roll').onclick = () => {
    attrs = rollAttrs();
    attrsBox.classList.remove('cc-rolled'); void attrsBox.offsetWidth; attrsBox.classList.add('cc-rolled'); // re-trigger flash
    renderAttrs();
  };
  nameI.oninput = () => { go.disabled = !nameI.value.trim(); };
  nameI.focus();

  return new Promise((resolve) => {
    go.onclick = () => {
      const month = Number(/** @type {HTMLSelectElement} */ (q('#cc-bmonth')).value);
      const day = Number(/** @type {HTMLSelectElement} */ (q('#cc-bday')).value);
      game.createCharacter({ name: nameI.value, gender, robeColor: robe, birthAttrs: attrs, birthday: { month, day } });
      el.classList.add('hidden'); el.innerHTML = '';
      resolve();
    };
  });
}
