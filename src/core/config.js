// Tuning constants and static ranch layout.

export const TILE = 16;
export const MAPW = 30, MAPH = 17;
export const W = MAPW * TILE;          // 480 native px
export const H = MAPH * TILE;          // 272 native px
export const SCALE = 2;
export const DAY_LEN = 75;             // seconds per day
export const MAX_PLUMS = 6;
export const PLUM_PRICE = 5;
export const SAVE_KEY = 'plumRancherSaveV1';

// Fence rectangle (tile coords) around the orchard, with two gate openings.
export const FENCE = { x1: 8, y1: 3, x2: 26, y2: 15 };
export const GATES = [
  { tx: 17, ty: FENCE.y2, x: 17 * TILE + 8, y: FENCE.y2 * TILE + 8 },   // bottom gate
  { tx: FENCE.x1, ty: 9, x: FENCE.x1 * TILE + 8, y: 9 * TILE + 8 },     // left gate
];

export const SHOP_ITEMS = [
  { key: 'fence', name: 'Orchard Fence', price: 40,
    desc: 'A proper fence. Deer show up far less often.' },
  { key: 'scarecrow', name: 'Scarecrow', price: 60,
    desc: 'Spooky pumpkin fellow. Deer eat much more slowly.' },
  { key: 'fertilizer', name: 'Fertilizer', price: 90,
    desc: 'Rich compost. Plums ripen noticeably faster.' },
  { key: 'treats', name: 'Speedy Treats', price: 120,
    desc: 'Performance snacks. Brontosaurus runs 35% faster.' },
  { key: 'sapling', name: 'Plum Sapling', price: 160,
    desc: 'A second plum tree for the orchard.' },
];

export const TREE_POS = [
  { x: 15 * TILE, y: 6 * TILE },
  { x: 21 * TILE, y: 10 * TILE },  // sapling position
];
export const HOUSE = { x: 2 * TILE, y: 2 * TILE };
export const BIN = { x: 5 * TILE, y: 12 * TILE };
export const STAND = { x: 2 * TILE, y: 8 * TILE };
export const SCARECROW = { x: 18 * TILE, y: 5 * TILE };
