// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// core/quests.js — เควส/onboarding (pure, ทดสอบได้ — §5.2)
// steps: kill (ล่ามอน) / talk (คุย NPC). rewards: SP/เงิน/ไอเทม
// ──────────────────────────────────────────────────────────────────────────
import { addItem } from './economy.js';

/** รับเควส */
export function accept(player, def) {
  player.quests[def.id] = { state: 'active', counts: {} };
}

/** อัปเดตเมื่อฆ่ามอน — เพิ่มตัวนับ step kind:kill */
export function onKill(player, mobId, questDefs) {
  for (const id in player.quests) {
    const q = player.quests[id]; if (q.state !== 'active') continue;
    const def = questDefs[id]; if (!def) continue;
    for (const s of def.steps) {
      if (s.kind === 'kill' && s.mobId === mobId) {
        q.counts[mobId] = Math.min((q.counts[mobId] || 0) + 1, s.count);
      }
    }
  }
}

/** อัปเดตเมื่อคุย NPC — ปิด step kind:talk */
export function onTalk(player, npcId, questDefs) {
  for (const id in player.quests) {
    const q = player.quests[id]; if (q.state !== 'active') continue;
    const def = questDefs[id]; if (!def) continue;
    for (const s of def.steps) {
      if (s.kind === 'talk' && s.npcId === npcId) q.counts['talk:' + npcId] = 1;
    }
  }
}

/** ทุก step ครบหรือยัง */
export function isComplete(player, def) {
  const q = player.quests[def.id]; if (!q) return false;
  return def.steps.every((s) =>
    s.kind === 'kill' ? (q.counts[s.mobId] || 0) >= s.count
      : s.kind === 'talk' ? !!q.counts['talk:' + s.npcId]
        : false);
}

/** ส่งเควส: ใส่รางวัล + ปิดสถานะ (คืน rewards ที่ได้) */
export function complete(player, def) {
  const q = player.quests[def.id];
  if (!q || q.state !== 'active' || !isComplete(player, def)) return { ok: false };
  const r = def.rewards || {};
  if (r.skillPoints) player.skillPoints += r.skillPoints;
  if (r.soft) player.currency += r.soft;
  for (const it of (r.items || [])) addItem(player, it.id, it.qty || 1);
  q.state = 'done';
  return { ok: true, rewards: r };
}

/** ข้อความความคืบหน้าแต่ละ step (สำหรับ UI) */
export function progressText(player, def) {
  const q = player.quests[def.id] || { counts: {} };
  return def.steps.map((s) =>
    s.kind === 'kill' ? `ปราบ ${s.label || s.mobId}: ${(q.counts[s.mobId] || 0)}/${s.count}`
      : s.kind === 'talk' ? `พูดคุยกับ ${s.label || s.npcId}: ${q.counts['talk:' + s.npcId] ? '✓' : '✗'}`
        : '');
}
