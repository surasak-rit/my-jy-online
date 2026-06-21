// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// game.js — game state + zone manager + combat orchestration
// core logic (pathfind/combat/mobs) อยู่ใน core/ (pure). ที่นี่ผูกเข้ากับ state + วาด
// ──────────────────────────────────────────────────────────────────────────
import { Camera } from './render/camera.js';
import { drawTileMap } from './render/tilemap.js';
import { drawCharacter, drawNameplate, ARCHETYPE_COLOR } from './render/sprites.js';
import { findPath } from './core/pathfind.js';
import { attack, tileDist } from './core/combat.js';
import { spawnFromZone, updateMobs } from './core/mobs.js';
import { learn, recomputeStats } from './core/skills.js';
import { buy, useConsumable } from './core/economy.js';
import * as Quests from './core/quests.js';
import { save, load } from './state/save.js';

const getJSON = async (url) => (await fetch(url)).json();

export class Game {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   * @param {Record<string,any>} sects
   * @param {Record<string,any>} mobDefs
   * @param {Record<string,any>} [skillDefs]
   */
  constructor(ctx, canvas, sects, mobDefs, skillDefs = {}, itemDefs = {}, questDefs = {}) {
    this.ctx = ctx; this.canvas = canvas; this.sects = sects; this.mobDefs = mobDefs;
    this.skillDefs = skillDefs; this.itemDefs = itemDefs; this.questDefs = questDefs;
    this.cam = new Camera(64, 32);
    // viewport แบบ logical (CSS px) — แยกจาก buffer (รองรับ HiDPI, กันภาพเพี้ยน)
    this.viewW = canvas.width || 800; this.viewH = canvas.height || 600;
    this.cam.viewW = this.viewW; this.cam.viewH = this.viewH;
    const saved = /** @type {any} */ (load()) || {};
    /** @type {any} */
    this.player = {
      id: 'player', displayName: 'จอมยุทธ์น้อย', activeTitle: 'ศิษย์ใหม่',
      sectId: 'vajra_cliff', tile: { x: 14, y: 20 }, pos: { x: 0, y: 0 }, path: [],
      baseAtk: 18, baseDef: 6, baseMaxHp: 100,
      hp: 100, maxHp: 100, atk: 18, def: 6, moveMult: 1, attackCdMs: 700, atkCd: 0, stun: 0,
      skills: saved.skills || {},
      inventory: saved.inventory || [],
      quests: saved.quests || {},
      combatXP: saved.combatXP || 0, skillPoints: saved.skillPoints || 0,
      currency: saved.currency != null ? saved.currency : 30,
    };
    recomputeStats(this.player, this.skillDefs);
    this.player.hp = saved.hp || this.player.maxHp;
    /** ฮุคให้ UI (DOM) เปิดหน้าต่างคุยกับ NPC */
    this.onInteract = (/** @type {any} */ _npc) => {};
    this.interactNpc = null;
    this.zone = null; this.map = null; this.mobs = [];
    this.target = null; this.transitioning = false;
    this.dead = false; this.respawnT = 0;
    /** @type {{wx:number,wy:number,text:string,color:string,t:number}[]} */
    this.dmgNums = [];
    this.startZoneId = saved.zoneId || 'jiuhe_town';
    this.startTile = saved.tile || null;
    this.toast = ''; this.toastT = 0;
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
    this.player.tile = { x: t.x, y: t.y }; this.player.path = [];
    const w = this.tw(t.x, t.y);
    this.player.pos = { x: w.x, y: w.y };
    this.cam.focus = { x: w.x, y: w.y };
    this.target = null;
    this.mobs = spawnFromZone(zone, this.mobDefs, (x, y) => this.isWalkable(x, y), (x, y) => this.tw(x, y));
    this.showToast(zone.name);
    this.saveState();
    this.transitioning = false;
  }

  /** คลิก: มอน→โจมตี, NPC→เข้าคุย, ไม่งั้น→เดิน */
  handlePick(tile) {
    if (this.transitioning || !this.map || this.dead) return;
    const mob = this.mobs.find((m) => m.state !== 'dead' && m.tile.x === tile.x && m.tile.y === tile.y);
    if (mob) { this.target = mob; this.interactNpc = null; this.pathAdjacentTo(mob.tile); return; }
    const npc = (this.zone.npcs || []).find((n) => n.at.x === tile.x && n.at.y === tile.y);
    if (npc) {
      this.target = null; this.interactNpc = npc;
      if (tileDist(this.player.tile, npc.at) <= 1) { this.triggerInteract(); }
      else this.pathAdjacentTo(npc.at);
      return;
    }
    this.target = null; this.interactNpc = null;
    if (this.isWalkable(tile.x, tile.y)) {
      this.player.path = findPath(this.player.tile, tile, (x, y) => this.isWalkable(x, y), { w: this.map.width, h: this.map.height });
    }
  }

  pathAdjacentTo(tile) {
    const path = findPath(this.player.tile, tile, (x, y) => this.isWalkable(x, y), { w: this.map.width, h: this.map.height });
    if (path.length) path.pop(); // หยุดที่ช่องประชิด ไม่ทับเป้า
    this.player.path = path;
  }

  triggerInteract() {
    const n = this.interactNpc; this.interactNpc = null; this.player.path = [];
    if (!n) return;
    Quests.onTalk(this.player, n.id, this.questDefs); // ปิด step คุย NPC
    this.saveState();
    this.onInteract(n);
  }

  /** เรียน/อัปเกรดวิชา (เรียกจาก UI) — คืน true ถ้าสำเร็จ */
  learnSkill(def) {
    const r = learn(this.player, def);
    if (r.ok) { recomputeStats(this.player, this.skillDefs); this.saveState(); this.showToast(`เรียน ${def.name}`); }
    return r;
  }

  saveState() {
    if (!this.zone) return;
    const p = this.player;
    save({ zoneId: this.zone.id, tile: p.tile, hp: p.hp, skills: p.skills, inventory: p.inventory, quests: p.quests, combatXP: p.combatXP, skillPoints: p.skillPoints, currency: p.currency });
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
    for (const d of this.dmgNums) { d.t -= dt; d.wy -= 22 * dt; }
    this.dmgNums = this.dmgNums.filter((d) => d.t > 0);

    if (this.dead) { this.respawnT -= dt; if (this.respawnT <= 0) this.respawn(); return; }

    const p = this.player;
    p.atkCd -= dt;

    // เดินตาม path
    if (p.path.length) {
      const next = p.path[0];
      const target = this.tw(next.x, next.y);
      const dx = target.x - p.pos.x, dy = target.y - p.pos.y, dist = Math.hypot(dx, dy);
      const step = 150 * (p.moveMult || 1) * dt; // วิชาตัวเบาเพิ่มความเร็ว (§3.2)
      if (dist <= step) {
        p.pos.x = target.x; p.pos.y = target.y; p.tile = next; p.path.shift();
        const portal = this.portalAt(p.tile);
        if (portal) { this.loadZone(portal.toZoneId, portal.spawnAt); return; }
      } else { p.pos.x += dx / dist * step; p.pos.y += dy / dist * step; }
    }
    // ถึงตัว NPC ที่จะคุย → เปิดหน้าต่าง
    if (this.interactNpc && p.path.length === 0 && tileDist(p.tile, this.interactNpc.at) <= 1) this.triggerInteract();

    // ต่อสู้กับเป้าหมาย
    if (this.target) {
      if (this.target.state === 'dead') this.target = null;
      else {
        const d = tileDist(p.tile, this.target.tile);
        if (d <= 1) {
          p.path = [];
          if (p.atkCd <= 0) {
            const r = attack(p, this.target, 300);
            this.popDmg(this.target.pos.x, this.target.pos.y, '-' + r.damage, '#7c1f1b');
            p.atkCd = p.attackCdMs / 1000;
            if (r.killed) this.onKill(this.target);
          }
        } else if (p.path.length === 0) this.pathAdjacentTo(this.target.tile);
      }
    }

    // มอน AI
    updateMobs(this.mobs, p, dt, {
      isWalkable: (x, y) => this.isWalkable(x, y),
      tileToWorld: (x, y) => this.tw(x, y),
      onPlayerDamaged: (dmg) => {
        p.hp -= dmg; this.popDmg(p.pos.x, p.pos.y, '-' + dmg, '#9e2b25');
        if (p.hp <= 0) this.die();
      },
    });

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

  die() { this.dead = true; this.respawnT = 3; this.player.path = []; this.target = null; this.showToast('พ่ายแพ้… กลับสู่เมือง'); }
  respawn() { this.dead = false; this.player.hp = this.player.maxHp; this.loadZone('jiuhe_town', { x: 14, y: 18 }); }

  render() {
    const { ctx, cam, map } = this;
    ctx.fillStyle = '#ddd1b3'; ctx.fillRect(0, 0, this.viewW, this.viewH); // กระดาษสาหม่น
    if (!map) return;
    drawTileMap(ctx, map, cam);
    this.drawPortals();

    /** @type {{depth:number, draw:()=>void}[]} */
    const ents = [];
    // เป้าหมาย: วงแหวนใต้เท้า
    if (this.target && this.target.state !== 'dead') {
      const s = cam.worldToScreen(this.target.pos.x, this.target.pos.y); s.y += map.tileHeight / 2;
      ents.push({ depth: -Infinity, draw: () => { ctx.strokeStyle = '#ffcf33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(s.x, s.y, 18, 9, 0, 0, Math.PI * 2); ctx.stroke(); } });
    }
    for (const n of this.zone.npcs) {
      const s = cam.tileToScreen(n.at.x, n.at.y); s.y += map.tileHeight / 2;
      ents.push({ depth: n.at.x + n.at.y, draw: () => { drawCharacter(ctx, s.x, s.y, ARCHETYPE_COLOR[n.archetype] || '#888', 0.85); drawNameplate(ctx, s.x, s.y, { name: n.name, role: n.role || undefined, sect: n.sectId ? this.sectInfo(n.sectId) : null }, 0.85); } });
    }
    for (const m of this.mobs) {
      if (m.state === 'dead') continue;
      const s = cam.worldToScreen(m.pos.x, m.pos.y); s.y += map.tileHeight / 2;
      ents.push({ depth: m.tile.x + m.tile.y, draw: () => { drawCharacter(ctx, s.x, s.y, m.state === 'chase' ? '#8c322b' : (ARCHETYPE_COLOR[m.archetype] || '#777'), 0.8); drawNameplate(ctx, s.x, s.y, { name: m.name, hpBar: { hp: m.hp, maxHp: m.maxHp } }, 0.8); } });
    }
    if (!this.dead) {
      const ps = cam.worldToScreen(this.player.pos.x, this.player.pos.y); ps.y += map.tileHeight / 2;
      ents.push({ depth: this.player.tile.x + this.player.tile.y, draw: () => { drawCharacter(ctx, ps.x, ps.y, '#3f5a6e', 1); drawNameplate(ctx, ps.x, ps.y, { name: this.player.displayName, title: this.player.activeTitle, sect: this.sectInfo(this.player.sectId), hpBar: { hp: this.player.hp, maxHp: this.player.maxHp } }, 1); } });
    }
    ents.sort((a, b) => a.depth - b.depth).forEach((e) => e.draw());

    this.drawDmgNums();
    this.drawToast();
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

  hudText() {
    if (!this.zone) return 'กำลังโหลด…';
    const p = this.player;
    return `${this.zone.name} · ❤️ ${Math.max(0, Math.ceil(p.hp))}/${p.maxHp} · ⚔️XP ${p.combatXP} · ✦SP ${p.skillPoints} · 💰 ${p.currency}`
      + (this.dead ? ' · กำลังฟื้น…' : ' · คลิกศัตรูเพื่อโจมตี / คลิกพื้นเพื่อเดิน');
  }
}
