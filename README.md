# วิถีพยัคฆ์ (Tiger's Way) — Wuxia Web MMO

MMO กำลังภายใน 2D isometric บนเว็บ · **vanilla HTML/CSS/JS (ES modules)** ไม่มี framework/build tool
ออกแบบตาม [`game-design-document.md`](game-design-document.md) (อ้างอิงงานวิจัยใน [`jy-online-gdd-reference.md`](jy-online-gdd-reference.md))

## สถานะ: Phase 1 — Vertical Slice ✅ (ครบ 4 เสาหลัก MVP)
ตาม GDD §8 — ผู้เล่นใหม่ → เควส → เลือกสำนัก/เรียนวิชา → ล่ามอน → ใช้เงิน ครบ 1 ลูป

**โลก & การเดิน (เสาหลัก 3)**
- 🗺️ isometric tilemap หลายโซน: `นครจิ่วเหอ` (เมือง) · `ทุ่งต้นหลิว` (โซนล่า) · `โรงฝึก` (interior)
- 🚶 point-to-click + **A\* pathfinding** · 🎥 กล้องตามตัว · 🚪 **portal เปลี่ยนโซน/เข้า-ออกอาคาร**
- 🧍 ตัวละคร/NPC + ป้ายชื่อ ฉายา/ชื่อ/สำนัก (§C.7) · 👥 NPC archetypes (§D.2)

**Combat (เสาหลัก 1)** — ⚔️ คลิกศัตรู→เข้าประชิด→โจมตีตาม cooldown + hit-stun · มอน AI (idle→chase→attack) · damage numbers · ตาย→ฟื้นที่เมือง

**สำนัก & วิชา (เสาหลัก 2)** — 🥋 คุยอาจารย์→เรียน/อัปเกรดวิชา (外功/內功/輕功) ด้วย Skill Points · **ไม่มีเลเวล** (พลังมาจากวิชา)

**เศรษฐกิจ (เสาหลัก 4)** — 💰 ร้านค้า NPC ซื้อของ · 🎒 กระเป๋า (ปุ่ม **I**) ใช้ยาฟื้น HP · ดรอปเหรียญจากมอน

**เควส/onboarding** — 📜 เควสสายมือใหม่ (คุยอาจารย์ → ปราบโจร 3 ตัว) + รางวัล SP/เงิน/ไอเทม

💾 เซฟทุกอย่างใน `localStorage` (โซน/HP/วิชา/กระเป๋า/เควส/เงิน)

## วิธีรัน (ต้องเปิดผ่าน http ไม่ใช่ `file://` เพราะใช้ ES modules + fetch)
```bash
python3 -m http.server 8000
# แล้วเปิด http://localhost:8000
```
คลิกบนพื้นเพื่อสั่งตัวละครเดิน

คลิกพื้น = เดิน · คลิกศัตรู = โจมตี · คลิก NPC = คุย/เรียนวิชา/ร้านค้า/เควส · ปุ่ม **I** = กระเป๋า

## เทสต์ (core เป็น pure logic — รันบน Node ได้, ไม่มี dependency)
```bash
node --test        # pathfind / combat / skills / economy / quests (19 เคส)
```

## โครงไฟล์ (ตาม GDD §7.4)
```
index.html              # entry: <canvas> + UI containers
styles/ui.css           # HUD (DOM)
src/
  core/pathfind.js      # A* (pure, ทดสอบได้, รันบน Node ได้)
  render/               # Canvas 2D: camera (iso), tilemap, sprites, loop
  input/mouse.js        # point-to-click
  state/save.js         # localStorage
  types.js              # JSDoc typedefs (§7.3)
  main.js               # bootstrap: โหลด data → loop + input
data/                   # config JSON (designer แก้ได้): zones / tilemaps / sects
tests/                  # node --test
```

## หลักการที่ยึด (ทำให้ขยายเป็น MMO ได้ — §7.2)
- **`core/` ห้ามแตะ DOM/Canvas** → รันบน Node ได้ → ย้ายขึ้น authoritative server ได้ตอนทำ multiplayer
- **Data-driven** — โซน/สำนัก/แผนที่ เป็น JSON → เพิ่มเนื้อหา = เพิ่มไฟล์ ไม่แก้โค้ด
- **UI = DOM, เกม = Canvas** แยกชั้นชัดเจน

## ถัดไป (Phase 1 — Vertical Slice)
combat เรียลไทม์เชิงยุทธวิธี · 3 สำนัก + เรียนวิชา · โซนล่า + มอน · เควสต์ + onboarding · เศรษฐกิจพื้นฐาน
