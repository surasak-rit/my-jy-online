// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// ui/hud.js — HUD สถานะตัวละคร (DOM): ตราสำนัก + ชื่อ/ฉายา + หลอดเลือด + ค่าสถานะ
// สร้าง DOM ครั้งเดียว แล้วอัปเดตเฉพาะส่วนที่เปลี่ยน (กัน layout thrash ทุกเฟรม)
// ──────────────────────────────────────────────────────────────────────────

/**
 * @param {import('../game.js').Game} game
 * @returns {{update: () => void}}
 */
export function initHud(game) {
  const el = /** @type {HTMLElement} */ (document.getElementById('hud'));
  el.classList.add('hud-card');
  el.innerHTML = `
    <div class="hud-row">
      <span class="hud-crest"></span>
      <div class="hud-main">
        <div class="hud-name"><b class="hud-nm"></b> <span class="hud-title"></span></div>
        <div class="hud-bar"><i class="hud-hp"></i><span class="hud-hplabel"></span></div>
      </div>
    </div>
    <div class="hud-pools">
      <div class="hud-pool" title="內力 — กำลังภายใน (ใช้ออกท่า)"><b>กำลังภายใน</b><div class="hud-pbar"><i class="hud-mp"></i></div><span class="hud-mplabel"></span></div>
      <div class="hud-pool" title="體力 — สติ (เดิน/ออกท่าแล้วลด)"><b>สติ</b><div class="hud-pbar"><i class="hud-st"></i></div><span class="hud-stlabel"></span></div>
      <div class="hud-pool" title="定力 — สมาธิ (สงบนิ่งแล้วสะสม)"><b>สมาธิ</b><div class="hud-pbar"><i class="hud-fo"></i></div><span class="hud-folabel"></span></div>
    </div>
    <div class="hud-chips">
      <span title="พลังโจมตี">⚔️ <b class="hud-atk"></b></span>
      <span title="พลังป้องกัน">🛡️ <b class="hud-def"></b></span>
      <span title="แต้มฝึกวิชา">✦ <b class="hud-sp"></b></span>
      <span title="เงิน">💰 <b class="hud-coin"></b></span>
      <span class="hud-zone"></span>
    </div>`;

  const q = (/** @type {string} */ c) => /** @type {HTMLElement} */ (el.querySelector(c));
  const r = {
    crest: q('.hud-crest'), nm: q('.hud-nm'), title: q('.hud-title'),
    hp: q('.hud-hp'), hplabel: q('.hud-hplabel'),
    mp: q('.hud-mp'), mplabel: q('.hud-mplabel'),
    st: q('.hud-st'), stlabel: q('.hud-stlabel'),
    fo: q('.hud-fo'), folabel: q('.hud-folabel'),
    atk: q('.hud-atk'), def: q('.hud-def'), sp: q('.hud-sp'), coin: q('.hud-coin'), zone: q('.hud-zone'),
  };
  const last = /** @type {Record<string, any>} */ ({});
  const set = (/** @type {HTMLElement} */ node, /** @type {string} */ key, /** @type {string} */ val) => {
    if (last[key] !== val) { node.textContent = val; last[key] = val; }
  };

  return {
    update() {
      const d = game.hudData();
      if (last.accent !== d.accent) { el.style.setProperty('--hud-accent', d.accent); last.accent = d.accent; }
      set(r.crest, 'crest', d.crest);
      set(r.nm, 'name', d.name);
      set(r.title, 'title', d.title ? `〈${d.title}〉` : '');
      // หลอดเลือด: ความกว้าง + เตือนเมื่อใกล้ตาย + ป้ายตัวเลข
      const pct = d.maxHp > 0 ? Math.max(0, Math.min(1, d.hp / d.maxHp)) : 0;
      r.hp.style.width = (pct * 100).toFixed(1) + '%';
      const lowCls = pct <= 0.3 ? 'hud-hp low' : 'hud-hp';
      if (last.hpcls !== lowCls) { r.hp.className = lowCls; last.hpcls = lowCls; }
      set(r.hplabel, 'hpl', d.dead ? 'กำลังฟื้น…' : `❤️ ${d.hp}/${d.maxHp}`);
      // หลอดพื้นฐาน 3 ค่า (內力/體力/定力)
      const pool = (/** @type {HTMLElement} */ bar, /** @type {HTMLElement} */ lbl, /** @type {string} */ key, /** @type {number} */ cur, /** @type {number} */ max) => {
        bar.style.width = (max > 0 ? Math.max(0, Math.min(1, cur / max)) * 100 : 0).toFixed(1) + '%';
        set(lbl, key, `${cur}/${max}`);
      };
      pool(r.mp, r.mplabel, 'mp', d.mp, d.maxMp);
      pool(r.st, r.stlabel, 'st', d.stamina, d.maxStamina);
      pool(r.fo, r.folabel, 'fo', d.focus, d.maxFocus);
      set(r.atk, 'atk', String(d.atk));
      set(r.def, 'def', String(d.def));
      set(r.sp, 'sp', String(d.sp));
      set(r.coin, 'coin', String(d.coins));
      set(r.zone, 'zone', d.zone ? `· ${d.zone}` : '');
    },
  };
}
