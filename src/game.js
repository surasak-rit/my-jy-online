// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// game.js — game state + zone manager (โหลดโซน, portal/เปลี่ยนโซน, update/render)
// main.js เหลือแค่ bootstrap. core logic ที่ pure อยู่ใน core/ (§7.2)
// ──────────────────────────────────────────────────────────────────────────
import { Camera } from './render/camera.js';
import { drawTileMap } from './render/tilemap.js';
import { drawCharacter, drawNameplate, ARCHETYPE_COLOR } from './render/sprites.js';
import { findPath } from './core/pathfind.js';
import { save, load } from './state/save.js';

const getJSON = async (url) => (await fetch(url)).json();

export class Game {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   * @param {Record<string, any>} sects   // sectId → SectDef
   */
  constructor(ctx, canvas, sects) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.sects = sects;
    this.cam = new Camera(64, 32);
    const saved = /** @type {any} */ (load()) || {};
    /** @type {import('./types.js').Character} */
    this.player = {
      id: 'player', displayName: 'จอมยุทธ์น้อย', activeTitle: 'ศิษย์ใหม่',
      sectId: 'vajra_cliff', tile: { x: 14, y: 20 }, pos: { x: 0, y: 0 },
      path: [], hp: 100, maxHp: 100,
    };
    this.zone = null; this.map = null;
    this.transitioning = false;
    this.startZoneId = saved.zoneId || 'jiuhe_town';
    this.startTile = saved.tile || null;
    this.toast = '';
    this.toastT = 0;
  }

  sectInfo(sectId) {
    const s = this.sects[sectId];
    return s ? { name: s.name, crest: s.crest, color: s.art.palette.accent } : null;
  }

  isWalkable(x, y) {
    if (!this.map) return false;
    if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) return false;
    return this.map.collision[y * this.map.width + x] === 0;
  }

  /**
   * โหลดโซนใหม่ + วางผู้เล่นที่ spawn
   * @param {string} zoneId
   * @param {import('./types.js').TilePos|null} spawnAt
   */
  async loadZone(zoneId, spawnAt = null) {
    this.transitioning = true;
    const zone = await getJSON(`data/zones/${zoneId}.json`);
    const map = await getJSON(zone.tilemapRef);
    this.zone = zone; this.map = map;
    this.cam.tileW = map.tileWidth; this.cam.tileH = map.tileHeight;
    const t = spawnAt || this.startTile || { x: 14, y: 20 };
    this.startTile = null; // ใช้ครั้งเดียวตอน boot
    this.player.tile = { x: t.x, y: t.y };
    this.player.path = [];
    const w = this.cam.tileToWorld(t.x, t.y);
    this.player.pos.x = w.x; this.player.pos.y = w.y;
    this.cam.focus.x = w.x; this.cam.focus.y = w.y;
    this.showToast(zone.name);
    save({ zoneId, tile: this.player.tile });
    this.transitioning = false;
  }

  /** สั่งเดินไปยัง tile (point-to-click → A*) */
  setDestination(tile) {
    if (this.transitioning || !this.map) return;
    if (!this.isWalkable(tile.x, tile.y)) return;
    this.player.path = findPath(
      this.player.tile, tile, (x, y) => this.isWalkable(x, y),
      { w: this.map.width, h: this.map.height });
  }

  showToast(text) { this.toast = text; this.toastT = 2.2; }

  /** @param {{x:number,y:number}} tile */
  portalAt(tile) {
    return (this.zone?.portals || []).find(
      (p) => p.at.x === tile.x && p.at.y === tile.y);
  }

  update(dt) {
    if (this.transitioning || !this.map) return;
    this.cam.viewW = this.canvas.width; this.cam.viewH = this.canvas.height;
    if (this.toastT > 0) this.toastT -= dt;

    const p = this.player;
    if (p.path.length) {
      const next = p.path[0];
      const target = this.cam.tileToWorld(next.x, next.y);
      const dx = target.x - p.pos.x, dy = target.y - p.pos.y;
      const dist = Math.hypot(dx, dy);
      const step = 150 * dt;
      if (dist <= step) {
        p.pos.x = target.x; p.pos.y = target.y; p.tile = next; p.path.shift();
        const portal = this.portalAt(p.tile);
        if (portal) { this.loadZone(portal.toZoneId, portal.spawnAt); return; }
        if (!p.path.length) save({ zoneId: this.zone.id, tile: p.tile });
      } else {
        p.pos.x += (dx / dist) * step; p.pos.y += (dy / dist) * step;
      }
    }
    this.cam.follow(p.pos.x, p.pos.y);
  }

  render() {
    const { ctx, cam, map, canvas } = this;
    ctx.fillStyle = '#1b2a1b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!map) return;
    drawTileMap(ctx, map, cam);
    this.drawPortals();

    /** @type {{depth:number, draw:()=>void}[]} */
    const ents = [];
    for (const n of this.zone.npcs) {
      const s = cam.tileToScreen(n.at.x, n.at.y); s.y += map.tileHeight / 2;
      ents.push({
        depth: n.at.x + n.at.y, draw: () => {
          drawCharacter(ctx, s.x, s.y, ARCHETYPE_COLOR[n.archetype] || '#888', 0.85);
          drawNameplate(ctx, s.x, s.y, {
            name: n.name, role: n.role || undefined,
            sect: n.sectId ? this.sectInfo(n.sectId) : null,
          }, 0.85);
        }
      });
    }
    const ps = cam.worldToScreen(this.player.pos.x, this.player.pos.y); ps.y += map.tileHeight / 2;
    ents.push({
      depth: this.player.tile.x + this.player.tile.y, draw: () => {
        drawCharacter(ctx, ps.x, ps.y, '#3b5b8c', 1);
        drawNameplate(ctx, ps.x, ps.y, {
          name: this.player.displayName, title: this.player.activeTitle,
          sect: this.sectInfo(this.player.sectId),
          hpBar: { hp: this.player.hp, maxHp: this.player.maxHp },
        }, 1);
      }
    });
    ents.sort((a, b) => a.depth - b.depth).forEach((e) => e.draw());

    this.drawToast();
  }

  drawPortals() {
    const { ctx, cam, map } = this;
    for (const p of (this.zone.portals || [])) {
      const s = cam.tileToScreen(p.at.x, p.at.y);
      const hw = map.tileWidth / 2, hh = map.tileHeight / 2;
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.2 * Math.sin(performance.now() / 300);
      ctx.fillStyle = '#ffd479';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + hw, s.y + hh);
      ctx.lineTo(s.x, s.y + map.tileHeight); ctx.lineTo(s.x - hw, s.y + hh);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  drawToast() {
    if (this.toastT <= 0) return;
    const { ctx, canvas } = this;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.toastT);
    ctx.font = 'bold 24px "Noto Sans Thai", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(this.toast, canvas.width / 2, 60);
    ctx.fillStyle = '#ffe9b0'; ctx.fillText(this.toast, canvas.width / 2, 60);
    ctx.restore();
  }

  hudText() {
    if (!this.zone) return 'กำลังโหลด…';
    const onPortal = this.portalAt(this.player.tile);
    return `${this.zone.name}  ·  ช่อง (${this.player.tile.x}, ${this.player.tile.y})`
      + (onPortal ? `  ·  ${onPortal.label || 'ทางออก'}` : '  ·  คลิกเพื่อเดิน');
  }
}
