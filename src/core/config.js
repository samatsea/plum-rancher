// Tuning constants and static ranch layout.

export const TILE = 16;
export const MAPW = 30, MAPH = 17;     // map size in tiles
export const W = MAPW * TILE;          // map width, native px
export const H = MAPH * TILE;          // map height, native px
export const VIEW_W = 480;             // what the screen shows, native px
export const VIEW_H = 272;             //   (canvas is VIEW * SCALE device px)
export const SCALE = 2;
export const DAY_LEN = 75;             // seconds per day
export const MAX_PLUMS = 6;
export const PLUM_PRICE = 5;

// Fence rectangle (tile coords) around the orchard.
export const FENCE = { x1: 8, y1: 3, x2: 26, y2: 15 };
// Gate openings: a run of tiles left open along one side of the fence.
export const GATES = [
  { side: 'bottom', from: 16, to: 18 },   // columns 16-18 of the bottom row
  { side: 'left', from: 8, to: 10 },      // rows 8-10 of the left column
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
