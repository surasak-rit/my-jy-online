// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// game.js — game state + zone manager + combat orchestration
// core logic (pathfind/combat/mobs) อยู่ใน core/ (pure). ที่นี่ผูกเข้ากับ state + วาด
// ──────────────────────────────────────────────────────────────────────────
import { Camera } from './render/camera.js';
import { drawTileMap } from './render/tilemap.js';
import { drawCharacter, drawNameplate, ARCHETYPE_COLOR } from './render/sprites.js';
import { drawProp, FLOOR_PROPS } from './render/props.js';
import { findPath } from './core/pathfind.js';
import { attack, tileDist } from './core/combat.js';
import { spawnFromZone, updateMobs } from './core/mobs.js';
import { spawnNpcs, updateNpcs } from './core/npcs.js';
import { learn, recomputeStats } from './core/skills.js';
import { upgradeNeidan } from './core/neidan.js';
import { buy, useConsumable } from './core/economy.js';
import * as Quests from './core/quests.js';
import { save, load } from './state/save.js';

const getJSON = async (url) => (await fetch(url)).json();

const LEARN_FOCUS_COST = 25; // เรียนวิชา/อ่านคัมภีร์ 1 ครั้ง สิ้นเปลืองสมาธิ (定力)

/** ทิศหันจาก world delta → 'E'|'W'|'S'|'N' */
function facing(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'E' : 'W';
  return dy >= 0 ? 'S' : 'N';
}

export class Game {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   * @param {Record<string,any>} sects
   * @param {Record<string,any>} mobDefs
   * @param {Record<string,any>} [skillDefs]
   */
  constructor(ctx, canvas, sects, mobDefs, skillDefs = {}, itemDefs = {}, questDefs = {}, slot = 0) {
    this.ctx = ctx; this.canvas = canvas; this.sects = sects; this.mobDefs = mobDefs;
    this.skillDefs = skillDefs; this.itemDefs = itemDefs; this.questDefs = questDefs;
    this.slot = slot; // ช่องบันทึกที่กำลังเล่น
    this.cam = new Camera(64, 32);
    // viewport แบบ logical (CSS px) — แยกจาก buffer (รองรับ HiDPI, กันภาพเพี้ยน)
    this.viewW = canvas.width || 800; this.viewH = canvas.height || 600;
    this.cam.viewW = this.viewW; this.cam.viewH = this.viewH;
    const saved = /** @type {any} */ (load(slot)) || {};
    /** @type {any} */
    this.player = {
      id: 'player',
      displayName: saved.displayName || 'จอมยุทธ์น้อย',
      activeTitle: saved.activeTitle || 'พเนจร',
      gender: saved.gender || 'male',
      robeColor: saved.robeColor || '#3f5a6e',
      sectId: saved.sectId || null, // เริ่มเกมยังไม่สังกัดสำนัก (§4.3 เข้าได้หลังเควสมือใหม่)
      birthAttrs: saved.birthAttrs || null, // ค่ากำเนิด 7 ค่า (資質) — ทอยตอนสร้างตัว
      birthday: saved.birthday || null,     // วันเกิดในเกม {month, day} (生日系統)
      neidan: saved.neidan || { tier: 0, element: null }, // เม็ดยาภายใน (五行内丹)
      tile: { x: 14, y: 20 }, pos: { x: 0, y: 0 }, waypoints: [], facing: 'S',
      baseAtk: 18, baseDef: 6, baseMaxHp: 100,
      baseMaxMp: 40, baseMaxStamina: 30, baseMaxFocus: 100, // ค่าพื้นฐาน 內力/體力/定力 (§基本屬性)
      hp: 100, maxHp: 100, atk: 18, def: 6, moveMult: 1, attackCdMs: 700, atkCd: 0, stun: 0,
      mp: 40, maxMp: 40, stamina: 30, maxStamina: 30, focus: 100, maxFocus: 100,
      skills: saved.skills || {},
      inventory: saved.inventory || [],
      quests: saved.quests || {},
      combatXP: saved.combatXP || 0, skillPoints: saved.skillPoints || 0,
      currency: saved.currency != null ? saved.currency : 30,
    };
    recomputeStats(this.player, this.skillDefs);
    this.player.hp = saved.hp || this.player.maxHp;
    this.player.mp = saved.mp != null ? saved.mp : this.player.maxMp;
    this.player.stamina = saved.stamina != null ? saved.stamina : this.player.maxStamina;
    this.player.focus = saved.focus != null ? saved.focus : this.player.maxFocus;
    /** ฮุคให้ UI (DOM) เปิดหน้าต่างคุยกับ NPC */
    this.onInteract = (/** @type {any} */ _npc) => {};
    this.interactNpc = null;
    this.zone = null; this.map = null; this.mobs = []; this.npcs = [];
    this.target = null; this.transitioning = false;
    this.dead = false; this.respawnT = 0;
    /** @type {{wx:number,wy:number,text:string,color:string,t:number}[]} */
    this.dmgNums = [];
    this.startZoneId = saved.zoneId || 'jiuhe_town';
    this.startTile = saved.tile || null;
    this.toast = ''; this.toastT = 0;
    this.needsCreation = !saved.displayName; // ยังไม่เคยสร้างตัวละคร → เปิดหน้าสร้างก่อน
  }

  /** ตั้งขนาด viewport เป็น logical px (เรียกจาก resize) */
  setViewport(w, h) { this.viewW = w; this.viewH = h; this.cam.viewW = w; this.cam.viewH = h; }

  sectInfo(id) { const s = this.sects[id]; return s ? { name: s.name, crest: s.crest, color: s.art.palette.accent } : null; }
  tw(x, y) { return this.cam.tileToWorld(x, y); }
  isWalkable(x, y) {
    if (!this.map) return false;
    if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) return false;
    return this.map.collision[y * this.map.width + x] === 0;
  }

  async loadZone(zoneId, spawnAt = null) {
    this.transitioning = true;
    const zone = await getJSON(`data/zones/${zoneId}.json`);
    const map = await getJSON(zone.tilemapRef);
    this.zone = zone; this.map = map;
    this.cam.tileW = map.tileWidth; this.cam.tileH = map.tileHeight;
    const t = spawnAt || this.startTile || { x: 14, y: 20 }; this.startTile = null;
    this.player.tile = { x: t.x, y: t.y }; this.player.waypoints = [];
    const w = this.tw(t.x, t.y);
    this.player.pos = { x: w.x, y: w.y };
    this.cam.focus = { x: w.x, y: w.y };
    this.target = null;
    this.mobs = spawnFromZone(zone, this.mobDefs, (x, y) => this.isWalkable(x, y), (x, y) => this.tw(x, y));
    this.npcs = spawnNpcs(zone, (x, y) => this.tw(x, y));
    this.showToast(zone.name);
    this.saveState();
    this.transitioning = false;
  }

  /** คลิก: มอน→โจมตี, NPC→เข้าคุย, ไม่งั้น→เดินลื่นไปจุดที่คลิก */
  handlePick(pick) {
    if (this.transitioning || !this.map || this.dead) return;
    const { tile, world, screen } = pick;
    // เลือกเป้าจาก hit-box บนจอ (คลิกโดนตัว ไม่ต้องเล็งช่องเท้าเป๊ะ)
    const hit = screen ? this.pickEntity(screen) : null;
    if (hit && hit.mob) { this.target = hit.mob; this.interactNpc = null; this.routeToTile(hit.mob.tile, true); return; }
    if (hit && hit.npc) {
      const npc = hit.npc;
      this.target = null; this.interactNpc = npc;
      if (tileDist(this.player.tile, npc.tile) <= 1) this.triggerInteract();
      else this.routeToTile(npc.tile, true);
      return;
    }
    this.target = null; this.interactNpc = null;
    if (this.isWalkable(tile.x, tile.y)) this.routeToWorld(world, tile);
  }

  /**
   * หาตัวละคร/NPC ที่อยู่ใต้จุดคลิก (screen px) ด้วย hit-box แนวตั้งครอบสไปรต์
   * ขนาดพอดีตัว (ไม่ล้นไปกินช่องรอบ ๆ) — เลือกตัวที่ "กลางลำตัว" ใกล้คลิกสุด
   * @param {{x:number,y:number}} sc
   * @returns {{mob?:any, npc?:any}|null}
   */
  pickEntity(sc) {
    /** @type {{mob?:any, npc?:any}|null} */
    let best = null; let bestD = Infinity;
    // hit-box: กว้าง ±hw, สูงจากเท้าขึ้นไป top, ต่ำกว่าเท้าเล็กน้อย bot (ปรับตาม scale สไปรต์)
    const test = (/** @type {number} */ fxs, /** @type {number} */ fys, /** @type {number} */ scale, /** @type {{mob?:any,npc?:any}} */ payload) => {
      const hw = 16 * scale, top = 94 * scale, bot = 10 * scale;
      if (sc.x < fxs - hw || sc.x > fxs + hw || sc.y < fys - top || sc.y > fys + bot) return;
      const d = Math.hypot(sc.x - fxs, sc.y - (fys - 38 * scale)); // ระยะถึงกลางลำตัว
      if (d < bestD) { bestD = d; best = payload; }
    };
    for (const m of this.mobs) {
      if (m.state === 'dead') continue;
      const s = this.cam.worldToScreen(m.pos.x, m.pos.y);
      test(s.x, s.y, 0.8, { mob: m });
    }
    for (const n of (this.npcs || [])) {
      const s = this.cam.worldToScreen(n.pos.x, n.pos.y);
      test(s.x, s.y, 0.85, { npc: n });
    }
    return best;
  }

  /** เส้นทางไป world point (ต่อเนื่อง): A* บนกริด → ปรับให้ตรงด้วย line-of-sight */
  routeToWorld(world, tile) {
    const path = findPath(this.player.tile, tile, (x, y) => this.isWalkable(x, y), { w: this.map.width, h: this.map.height });
    /** @type {{x:number,y:number}[]} */
    let pts = path.map((t) => this.tw(t.x, t.y));
    if (pts.length) pts[pts.length - 1] = { x: world.x, y: world.y }; // จุดจบ = ตำแหน่งคลิกจริง (ลื่น ไม่ snap)
    else if (this.hasLOS(this.player.pos, world)) pts = [{ x: world.x, y: world.y }]; // เห็นกันตรง ๆ → เดินตรง
    this.player.waypoints = this.smooth(this.player.pos, pts);
  }

  /** เส้นทางไปประชิด tile เป้าหมาย (สำหรับโจมตี/คุย) */
  routeToTile(tile, adjacent = false) {
    const path = findPath(this.player.tile, tile, (x, y) => this.isWalkable(x, y), { w: this.map.width, h: this.map.height });
    if (adjacent && path.length) path.pop(); // หยุดช่องประชิด ไม่ทับเป้า
    this.player.waypoints = this.smooth(this.player.pos, path.map((t) => this.tw(t.x, t.y)));
  }

  /** line-of-sight ระหว่าง world A→B (สุ่มจุดตามทาง เช็กช่องเดินได้) */
  hasLOS(a, b) {
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / 14));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const wt = this.cam.worldToTile(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
      if (!this.isWalkable(wt.x, wt.y)) return false;
    }
    return true;
  }

  /** ลดจำนวน waypoint ด้วย string-pulling (ตัดจุดกลางที่มองเห็นปลายทางตรง ๆ) */
  smooth(start, pts) {
    if (pts.length <= 1) return pts;
    const out = []; let anchor = start; let i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !this.hasLOS(anchor, pts[j])) j--;
      out.push(pts[j]); anchor = pts[j]; i = j + 1;
    }
    return out;
  }

  triggerInteract() {
    const n = this.interactNpc; this.interactNpc = null; this.player.waypoints = [];
    if (!n) return;
    Quests.onTalk(this.player, n.id, this.questDefs); // ปิด step คุย NPC
    this.saveState();
    this.onInteract(n);
  }

  /** เรียน/อัปเกรดวิชา (เรียกจาก UI) — คืน true ถ้าสำเร็จ */
  learnSkill(def) {
    const r = learn(this.player, def);
    if (r.ok) {
      this.player.focus = Math.max(0, this.player.focus - LEARN_FOCUS_COST); // เรียนวิชาสิ้นเปลืองสมาธิ (定力)
      recomputeStats(this.player, this.skillDefs); this.saveState(); this.showToast(`เรียน ${def.name}`);
    }
    return r;
  }

  /** หลอม/ยกขั้นเม็ดยาภายใน (五行内丹) — element ใช้เฉพาะตอนหลอมครั้งแรก */
  upgradeNeidan(element) {
    const before = this.player.neidan?.tier || 0;
    const r = upgradeNeidan(this.player, element);
    if (r.ok) {
      recomputeStats(this.player, this.skillDefs);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp); // กัน hp เกิน (ไม่ฮีลฟรี)
      this.saveState();
      this.showToast(before === 0 ? 'หลอมเม็ดยาสำเร็จ!' : 'ยกขั้นเม็ดยาสำเร็จ!');
    }
    return r;
  }

  saveState() {
    if (!this.zone) return;
    const p = this.player;
    save(this.slot, {
      displayName: p.displayName, activeTitle: p.activeTitle, gender: p.gender, robeColor: p.robeColor, sectId: p.sectId,
      birthAttrs: p.birthAttrs, birthday: p.birthday, neidan: p.neidan,
      zoneId: this.zone.id, zoneName: this.zone.name, tile: p.tile, hp: p.hp, mp: p.mp, stamina: p.stamina, focus: p.focus,
      skills: p.skills, inventory: p.inventory, quests: p.quests,
      combatXP: p.combatXP, skillPoints: p.skillPoints, currency: p.currency,
    });
  }

  /** สร้างตัวละครใหม่ (จากหน้าสร้างตอนเริ่มเกม) — ยังไม่สังกัดสำนัก */
  createCharacter({ name, gender, robeColor, birthAttrs, birthday }) {
    const p = this.player;
    p.displayName = (name || '').trim().slice(0, 16) || 'จอมยุทธ์น้อย';
    p.gender = gender === 'female' ? 'female' : 'male';
    if (robeColor) p.robeColor = robeColor;
    if (birthAttrs) p.birthAttrs = birthAttrs;   // ค่ากำเนิดที่ทอยได้ (資質)
    if (birthday) p.birthday = birthday;          // วันเกิดในเกม (生日系統)
    p.sectId = null; p.activeTitle = 'พเนจร';
    recomputeStats(p, this.skillDefs);            // ค่ากำเนิดส่งผลต่อ atk/def/maxHp + 內力/體力/定力
    p.hp = p.maxHp; p.mp = p.maxMp; p.stamina = p.maxStamina; p.focus = p.maxFocus;
    this.needsCreation = false;
    this.saveState();
  }

  /** ฝากตัวเข้าสำนัก (จากอาจารย์สำนัก) — §4.3 */
  joinSect(sectId) {
    if (!this.sects[sectId] || this.player.sectId) return false;
    this.player.sectId = sectId;
    this.player.activeTitle = 'ศิษย์ใหม่';
    this.saveState();
    this.showToast(`ฝากตัวเป็นศิษย์${this.sects[sectId].name}แล้ว`);
    return true;
  }

  // ── เควส ──
  getGiverQuest(npcId) {
    const chain = Object.values(this.questDefs).filter((d) => d.giver === npcId).sort((a, b) => a.order - b.order);
    for (const def of chain) {
      const q = this.player.quests[def.id];
      if (!q) return { mode: 'offer', def };
      if (q.state === 'active') return Quests.isComplete(this.player, def) ? { mode: 'turnin', def } : { mode: 'progress', def };
    }
    return { mode: 'none' };
  }
  acceptQuest(def) { Quests.accept(this.player, def); this.saveState(); this.showToast(`รับเควส: ${def.name}`); }
  turnInQuest(def) {
    const r = Quests.complete(this.player, def);
    if (r.ok) { recomputeStats(this.player, this.skillDefs); this.saveState(); this.showToast(`สำเร็จ: ${def.name}!`); }
    return r;
  }

  /** ซื้อไอเทมจากร้าน (เรียกจาก UI) */
  buyItem(def) { const r = buy(this.player, def); if (r.ok) { this.saveState(); this.showToast(`ซื้อ ${def.name}`); } return r; }
  /** ใช้ของกิน (เรียกจาก UI) */
  useItem(def) { const r = useConsumable(this.player, def); if (r.ok) { this.saveState(); this.showToast(`ใช้ ${def.name}`); } return r; }

  showToast(t) { this.toast = t; this.toastT = 2.2; }
  popDmg(wx, wy, text, color) { this.dmgNums.push({ wx, wy: wy - 60, text, color, t: 0.9 }); }
  portalAt(tile) { return (this.zone?.portals || []).find((p) => p.at.x === tile.x && p.at.y === tile.y); }

  update(dt) {
    if (this.transitioning || !this.map) return;
    if (this.toastT > 0) this.toastT -= dt;
    this.animT = (this.animT || 0) + dt; // นาฬิกาแอนิเมชันรวม (idle ของ NPC)
    for (const d of this.dmgNums) { d.t -= dt; d.wy -= 22 * dt; }
    this.dmgNums = this.dmgNums.filter((d) => d.t > 0);

    if (this.dead) { this.respawnT -= dt; if (this.respawnT <= 0) this.respawn(); return; }

    const p = this.player;
    p.atkCd -= dt;
    p.attackT = Math.max(0, (p.attackT || 0) - dt); // อนิเมชันฟันแขน
    p.hurtT = Math.max(0, (p.hurtT || 0) - dt);     // กระพริบแดงโดนตี
    p.breath = (p.breath || 0) + dt * 3; // จังหวะหายใจตอนยืนเฉย
    const ox = p.pos.x, oy = p.pos.y;
    const hadWp = p.waypoints.length > 0;

    // เดินลื่นต่อเนื่องตาม waypoints (world px) — สเต็ปได้หลายช่วงต่อเฟรม กันสะดุด
    if (p.waypoints.length) {
      let budget = 150 * (p.moveMult || 1) * dt; // วิชาตัวเบาเพิ่มความเร็ว (§3.2)
      while (budget > 0 && p.waypoints.length) {
        const w0 = p.waypoints[0];
        const dx = w0.x - p.pos.x, dy = w0.y - p.pos.y, dist = Math.hypot(dx, dy);
        if (dist > 0.5) p.facing = facing(dx, dy);
        if (dist <= budget) { p.pos.x = w0.x; p.pos.y = w0.y; p.waypoints.shift(); budget -= dist; }
        else { p.pos.x += dx / dist * budget; p.pos.y += dy / dist * budget; budget = 0; }
      }
      // อัปเดต tile จากตำแหน่งจริง + เช็ก portal ขณะเดินผ่าน
      const t = this.cam.worldToTile(p.pos.x, p.pos.y);
      if (t.x !== p.tile.x || t.y !== p.tile.y) {
        p.tile = t;
        const portal = this.portalAt(t);
        if (portal) { this.loadZone(portal.toZoneId, portal.spawnAt); return; }
      }
    }
    // จังหวะเดิน: ผูก phase กับระยะที่ขยับจริง (กันเท้าลื่น)
    const moved = Math.hypot(p.pos.x - ox, p.pos.y - oy);
    p.moving = moved > 0.05;
    p.step = (p.step || 0) + moved * 0.22;
    // เดินจบ (waypoints หมด) → บันทึกตำแหน่งล่าสุด ให้รีเฟรชแล้วยืนที่เดิม
    if (hadWp && p.waypoints.length === 0) this.saveState();

    // ถึงตัว NPC ที่จะคุย → เปิดหน้าต่าง
    if (this.interactNpc && p.waypoints.length === 0 && tileDist(p.tile, this.interactNpc.tile) <= 1) this.triggerInteract();

    // ต่อสู้กับเป้าหมาย
    if (this.target) {
      if (this.target.state === 'dead') this.target = null;
      else {
        const d = tileDist(p.tile, this.target.tile);
        if (d <= 1) {
          p.waypoints = [];
          if (p.atkCd <= 0) {
            const r = attack(p, this.target, 300);
            this.popDmg(this.target.pos.x, this.target.pos.y, '-' + r.damage, '#7c1f1b');
            p.atkCd = p.attackCdMs / 1000;
            p.mp = Math.max(0, p.mp - 6); // ออกท่ากินกำลังภายใน (內力) = ทรัพยากรต่อสู้ (clamp ≥0 ไม่บล็อก)
            p.attackT = 0.3; this.target.hurtT = 0.25; // ฟันแขน + เป้าสะดุ้ง
            if (r.killed) this.onKill(this.target);
          }
        } else if (p.waypoints.length === 0) this.routeToTile(this.target.tile, true);
      }
    }

    // NPC เดินเล่น (wander) — ให้เมืองดูมีชีวิต
    updateNpcs(this.npcs, dt, {
      isWalkable: (x, y) => this.isWalkable(x, y),
      tileToWorld: (x, y) => this.tw(x, y),
      playerTile: p.tile,
      interactId: this.interactNpc ? this.interactNpc.id : null,
    });

    // มอน AI
    updateMobs(this.mobs, p, dt, {
      isWalkable: (x, y) => this.isWalkable(x, y),
      tileToWorld: (x, y) => this.tw(x, y),
      onPlayerDamaged: (dmg) => {
        p.hp -= dmg; p.hurtT = 0.25; this.popDmg(p.pos.x, p.pos.y, '-' + dmg, '#9e2b25');
        if (p.hp <= 0) this.die();
      },
    });

    // ฟื้นค่าพื้นฐานตามเวลา — เดินไม่หักสติ/สมาธิ (อิงเว็บจีน: 體力 ผูกกับ生活技能/อาชีพ,
    // 定力 ผูกกับการเรียนวิชา/讀書識字 ไม่เกี่ยวการเดิน/ต่อสู้). 內力 = ทรัพยากรต่อสู้
    p.mp = Math.min(p.maxMp, p.mp + 8 * dt);             // 內力 ฟื้นเรื่อย ๆ (ออกท่าแล้วลด)
    p.stamina = Math.min(p.maxStamina, p.stamina + 4 * dt); // 體力 ฟื้นเรื่อย ๆ — สิ้นเปลืองตอนทำอาชีพ
    p.focus = Math.min(p.maxFocus, p.focus + 5 * dt);    // 定力 ฟื้นเรื่อย ๆ — สิ้นเปลืองตอนเรียนวิชา

    this.cam.follow(p.pos.x, p.pos.y);
  }

  onKill(mob) {
    const def = mob.def_;
    this.player.combatXP += def.xp || 0;
    this.player.skillPoints += def.skillPoints || 0;
    const [lo, hi] = (def.loot && def.loot.soft) || [0, 0];
    const coins = lo + Math.floor(Math.random() * (hi - lo + 1));
    this.player.currency += coins;
    mob.state = 'dead'; mob.respawn = (def.respawnMs || 5000) / 1000;
    this.popDmg(mob.pos.x, mob.pos.y - 16, `+${def.xp} 历练`, '#4f6a2e');
    this.target = null;
    Quests.onKill(this.player, mob.defId, this.questDefs); // นับเควสล่ามอน
    this.saveState();
  }

  die() { this.dead = true; this.respawnT = 3; this.player.waypoints = []; this.target = null; this.showToast('พ่ายแพ้… กลับสู่เมือง'); }
  respawn() { this.dead = false; this.player.hp = this.player.maxHp; this.loadZone('jiuhe_town', { x: 14, y: 18 }); }

  render() {
    const { ctx, cam, map } = this;
    ctx.fillStyle = (this.zone.floor === 'wood') ? '#3a2a18' : '#ddd1b3'; // ผนัง/พื้นนอก
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    if (!map) return;
    drawTileMap(ctx, map, cam, this.zone.floor);
    this.drawPortals();

    // props แบบพื้น (พรม) วาดทับพื้นก่อนตัวละคร
    for (const pr of (this.zone.props || [])) {
      if (!FLOOR_PROPS.has(pr.type)) continue;
      const s = cam.tileToScreen(pr.at.x, pr.at.y); s.y += map.tileHeight / 2;
      drawProp(ctx, pr.type, s.x, s.y, pr.scale || 1);
    }

    /** @type {{depth:number, draw:()=>void}[]} */
    const ents = [];
    // props ทรงสูง (แจกัน/เสา/พระ ฯลฯ) → depth-sort ร่วมกับตัวละคร
    for (const pr of (this.zone.props || [])) {
      if (FLOOR_PROPS.has(pr.type)) continue;
      const s = cam.tileToScreen(pr.at.x, pr.at.y); s.y += map.tileHeight / 2;
      ents.push({ depth: pr.at.x + pr.at.y - 0.5, draw: () => drawProp(ctx, pr.type, s.x, s.y, pr.scale || 1) });
    }
    // เป้าหมาย: วงแหวนใต้เท้า
    if (this.target && this.target.state !== 'dead') {
      const s = cam.worldToScreen(this.target.pos.x, this.target.pos.y); s.y += map.tileHeight / 2;
      ents.push({ depth: -Infinity, draw: () => { ctx.strokeStyle = '#ffcf33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(s.x, s.y, 18, 9, 0, 0, Math.PI * 2); ctx.stroke(); } });
    }
    for (const n of (this.npcs || [])) {
      const s = cam.worldToScreen(n.pos.x, n.pos.y); s.y += map.tileHeight / 2;
      ents.push({ depth: n.tile.x + n.tile.y, draw: () => { drawCharacter(ctx, s.x, s.y, ARCHETYPE_COLOR[n.archetype] || '#888', 0.85, n.facing || 'S', { moving: n.moving, step: n.step, breath: n.breath }); drawNameplate(ctx, s.x, s.y, { name: n.name, role: n.role || undefined, sect: n.sectId ? this.sectInfo(n.sectId) : null, boxed: false }, 0.85); } });
    }
    for (const m of this.mobs) {
      if (m.state === 'dead') continue;
      const s = cam.worldToScreen(m.pos.x, m.pos.y); s.y += map.tileHeight / 2;
      ents.push({ depth: m.tile.x + m.tile.y, draw: () => { drawCharacter(ctx, s.x, s.y, m.state === 'chase' ? '#8c322b' : (ARCHETYPE_COLOR[m.archetype] || '#777'), 0.8, m.facing || 'S', { moving: m.moving, step: m.step, breath: m.breath, attack: (m.attackT || 0) / 0.3, hurt: (m.hurtT || 0) / 0.25 }); drawNameplate(ctx, s.x, s.y, { name: m.name, hpBar: { hp: m.hp, maxHp: m.maxHp }, boxed: false }, 0.8); } });
    }
    if (!this.dead) {
      const ps = cam.worldToScreen(this.player.pos.x, this.player.pos.y); ps.y += map.tileHeight / 2;
      ents.push({ depth: this.player.tile.x + this.player.tile.y, draw: () => { drawCharacter(ctx, ps.x, ps.y, this.player.robeColor, 1, this.player.facing, { moving: this.player.moving, step: this.player.step, breath: this.player.breath, attack: (this.player.attackT || 0) / 0.3, hurt: (this.player.hurtT || 0) / 0.25, gender: this.player.gender }); drawNameplate(ctx, ps.x, ps.y, { name: this.player.displayName, title: this.player.activeTitle, sect: this.sectInfo(this.player.sectId), hpBar: { hp: this.player.hp, maxHp: this.player.maxHp }, boxed: false }, 1); } });
    }
    ents.sort((a, b) => a.depth - b.depth).forEach((e) => e.draw());

    this.drawVignette();
    this.drawDmgNums();
    this.drawToast();
  }

  /** แสงนุ่ม+ขอบมืด ให้บรรยากาศอุ่นแบบเรือนจีน (interior อุ่นกว่า) */
  drawVignette() {
    const { ctx } = this;
    const interior = this.zone.floor === 'wood';
    ctx.save();
    // โทนอุ่นทับบาง ๆ
    ctx.globalAlpha = interior ? 0.12 : 0.06;
    ctx.fillStyle = interior ? '#5a2f10' : '#caa15a';
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    ctx.globalAlpha = 1;
    // ขอบมืด (vignette) — กรอบเฟรมหลายชั้น
    const g = Math.min(this.viewW, this.viewH);
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#1a120a';
      const m = (i + 1) * g * 0.04;
      ctx.fillRect(0, 0, this.viewW, m);
      ctx.fillRect(0, this.viewH - m, this.viewW, m);
      ctx.fillRect(0, 0, m, this.viewH);
      ctx.fillRect(this.viewW - m, 0, m, this.viewH);
    }
    ctx.restore();
  }

  drawPortals() {
    const { ctx, cam, map } = this;
    for (const p of (this.zone.portals || [])) {
      const s = cam.tileToScreen(p.at.x, p.at.y), hw = map.tileWidth / 2, hh = map.tileHeight / 2;
      ctx.save(); ctx.globalAlpha = 0.4 + 0.18 * Math.sin(performance.now() / 320); ctx.fillStyle = '#6f7d5a'; // เรืองหยก
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + hw, s.y + hh); ctx.lineTo(s.x, s.y + map.tileHeight); ctx.lineTo(s.x - hw, s.y + hh); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5; ctx.strokeStyle = '#3f4a32'; ctx.stroke(); ctx.restore();
    }
  }

  drawDmgNums() {
    const { ctx, cam } = this;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 15px "Noto Serif Thai", serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(244,238,222,0.8)';
    for (const d of this.dmgNums) {
      const s = cam.worldToScreen(d.wx, d.wy); ctx.globalAlpha = Math.min(1, d.t * 1.5);
      ctx.strokeText(d.text, s.x, s.y); ctx.fillStyle = d.color; ctx.fillText(d.text, s.x, s.y);
    }
    ctx.restore();
  }

  drawToast() {
    if (this.toastT <= 0) return;
    const { ctx } = this;
    const cx = this.viewW / 2, cy = 56;
    ctx.save(); ctx.globalAlpha = Math.min(1, this.toastT);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '30px "Ma Shan Zheng","Noto Serif Thai",serif';
    const w = Math.max(160, this.toast.length * 20 + 48), h = 44;
    // แบนเนอร์กระดาษสา + ขอบหมึก + แถบชาด
    ctx.fillStyle = 'rgba(233,222,196,0.95)'; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.fillStyle = '#9e2b25'; ctx.fillRect(cx - w / 2, cy - h / 2, w, 4); ctx.fillRect(cx - w / 2, cy + h / 2 - 4, w, 4);
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(42,36,29,0.7)'; ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
    ctx.fillStyle = '#2a241d'; ctx.fillText(this.toast, cx, cy + 2);
    ctx.restore();
  }

  /** ข้อมูลสำหรับ HUD สถานะตัวละคร (UI=DOM อ่านไปแสดง §7.2) */
  hudData() {
    const p = this.player;
    const sect = this.sectInfo(p.sectId);
    return {
      name: p.displayName, title: p.activeTitle,
      crest: sect ? sect.crest : '·', accent: sect ? sect.color : '#9e2b25',
      hp: Math.max(0, Math.ceil(p.hp)), maxHp: p.maxHp,
      mp: Math.max(0, Math.round(p.mp)), maxMp: p.maxMp,
      stamina: Math.max(0, Math.round(p.stamina)), maxStamina: p.maxStamina,
      focus: Math.max(0, Math.round(p.focus)), maxFocus: p.maxFocus,
      atk: Math.round(p.atk), def: Math.round(p.def),
      xp: p.combatXP, sp: p.skillPoints, coins: p.currency,
      zone: this.zone ? this.zone.name : '', dead: this.dead,
    };
  }
}
