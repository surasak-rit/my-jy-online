# วิถีพยัคฆ์ (Tiger's Way) — Wuxia Web MMO

MMO กำลังภายใน 2D isometric บนเว็บ · **vanilla HTML/CSS/JS (ES modules)** ไม่มี framework/build tool
ออกแบบตาม [`game-design-document.md`](game-design-document.md) (อ้างอิงงานวิจัยใน [`jy-online-gdd-reference.md`](jy-online-gdd-reference.md))

## สถานะ: Phase 0 — Foundation ✅
ตาม GDD §8 — เกณฑ์ผ่าน: *เปิดผ่าน static server แล้วเดินตัวละครในโซน isometric ได้*

สิ่งที่ทำงานแล้ว:
- 🗺️ เรนเดอร์ **isometric tilemap** จาก data (โซน `นครจิ่วเหอ`)
- 🚶 **เดินแบบ point-to-click + A\* pathfinding** (เลี่ยงน้ำ/อาคาร, ไม่ลัดมุมทะลุกำแพง)
- 🎥 **กล้อง isometric** ตามตัวละครแบบนุ่มนวล
- 🧍 ตัวละคร/NPC placeholder (สัดส่วนตาม §C.1) + **ป้ายชื่อเหนือหัว** (ฉายา/ชื่อ/สำนัก — §C.7)
- 👥 NPC หลายอาร์คีไทป์ (อาจารย์/พ่อค้า/ยาม/ขอทาน… — §D.2) z-sort ถูกชั้น
- 💾 จำตำแหน่งผู้เล่นด้วย `localStorage`

## วิธีรัน (ต้องเปิดผ่าน http ไม่ใช่ `file://` เพราะใช้ ES modules + fetch)
```bash
python3 -m http.server 8000
# แล้วเปิด http://localhost:8000
```
คลิกบนพื้นเพื่อสั่งตัวละครเดิน

## เทสต์ (core เป็น pure logic — รันบน Node ได้, ไม่มี dependency)
```bash
node --test        # ทดสอบ A* pathfinding
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
