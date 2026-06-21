// @ts-check
// ──────────────────────────────────────────────────────────────────────────
// JSDoc typedefs รวม (อ้างอิง GDD §7.3). ไฟล์นี้ไม่ export อะไร —
// ใช้เป็นแหล่ง type สำหรับ editor (เปิด // @ts-check ในไฟล์อื่น)
// ──────────────────────────────────────────────────────────────────────────

/** @typedef {{ x:number, y:number }} TilePos */
/** @typedef {{ x:number, y:number }} Vec2 */
/** @typedef {"external"|"internal"|"movement"} SkillType */
/** @typedef {"saber"|"sword"|"fist"|"staff"|"baton"} WeaponType */
/** @typedef {"morning"|"day"|"evening"|"night"} TimeBand */

// ---------- World ----------
/**
 * @typedef {Object} ZoneDef
 * @property {string} id
 * @property {string} name
 * @property {"hub"|"sect"|"field"|"interior"} type
 * @property {string} tilemapRef
 * @property {string=} parentZoneId
 * @property {{ toZoneId:string, at:TilePos }[]} exits
 * @property {NpcSpawn[]} npcs
 * @property {MobSpawn[]=} spawns
 */

/**
 * @typedef {Object} TileMap
 * @property {number} width
 * @property {number} height
 * @property {number} tileWidth
 * @property {number} tileHeight
 * @property {number[]} ground       // ดัชนีชนิดพื้น (เพื่อการวาด)
 * @property {number[]} collision    // 0 = เดินได้, 1 = บล็อก
 */

/**
 * @typedef {Object} NpcSpawn
 * @property {string} id
 * @property {TilePos} at
 * @property {string} role
 * @property {"villager"|"merchant"|"wanderer"|"monk"|"guard"|"beggar"|"scholar"|"child"} archetype
 * @property {string} name
 * @property {string=} sectId
 */

/**
 * @typedef {Object} MobSpawn
 * @property {string} mobId
 * @property {number} tier
 * @property {number} max
 * @property {{ x:number, y:number, w:number, h:number }} area
 */

// ---------- Sect ----------
/**
 * @typedef {Object} SectDef
 * @property {string} id
 * @property {string} name
 * @property {string} crest          // emoji/สัญลักษณ์ placeholder
 * @property {{ palette:{ primary:string, accent:string }, outfit:string }} art
 */

// ---------- Character (runtime) ----------
/**
 * @typedef {Object} Character
 * @property {string} id
 * @property {string} displayName
 * @property {string|null} activeTitle    // ฉายา (ข้อความ)
 * @property {string|null} sectId
 * @property {TilePos} tile                // ช่องปัจจุบัน
 * @property {Vec2} pos                    // ตำแหน่งพิกเซลใน world (ลื่นไหล)
 * @property {TilePos[]} path              // เส้นทางที่เหลือต้องเดิน
 * @property {number} hp
 * @property {number} maxHp
 */

export {}; // ทำให้เป็น ES module
