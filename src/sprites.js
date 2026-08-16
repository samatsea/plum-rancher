// Procedural pixel-art sprites. Everything is drawn onto small offscreen
// canvases at 1x and rendered scaled with image smoothing off.

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}

// Build a sprite from a string map + palette. '.' is transparent.
function px(rows, pal) {
  const w = rows[0].length, h = rows.length;
  const [c, g] = canvasOf(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || !pal[ch]) continue;
      g.fillStyle = pal[ch];
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// Filled "pixel circle" blob, for tree canopies etc.
function blob(g, cx, cy, r, color) {
  g.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) g.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

/* ---------------- Brontosaurus the frenchie ---------------- */
// Facing right; flip horizontally for left. B base brindle, D dark stripe,
// W cream chest/muzzle, K black, P pink inner ear.
const DOG_PAL = { B: '#7a5136', D: '#4a3120', W: '#e9dcc2', K: '#181008', P: '#c9857f' };

const DOG_BODY = [
  '..........BB..BB',
  '..........BPB.BP',
  '.........BBBBBBB',
  '.........BBBBBBB',
  '.........BKBBKBB',
  '.BBBBBBBBBBBBBBB',
  'BBBDBBDBBBWWWWKK',
  '.BBBBBBBBBWWWWWW',
  '.BBDBBDBBBWWWWW.',
  '.BBBBBBBBBWWWW..',
];
const DOG_LEGS_A = [
  '..BB...BB..BB...',
  '..BB...BB..BB...',
];
const DOG_LEGS_B = [
  '.BB.....BB..BB..',
  '.BB.....BB..BB..',
];

export const dogFrames = [
  px([...DOG_BODY, ...DOG_LEGS_A], DOG_PAL),
  px([...DOG_BODY, ...DOG_LEGS_B], DOG_PAL),
];
export const DOG_W = 16, DOG_H = 12;

/* ---------------- Deer ---------------- */
// Facing left; flip for right. B tan, L dark brown, C cream, K dark.
const DEER_PAL = { B: '#c49a66', L: '#8d6b42', C: '#efe3cb', K: '#2a1e12' };

// Compact body carried high on long slender legs — reads as deer, not llama.
const DEER_BODY = [
  '..B..B............',
  '..B..B............',
  '..BBBB............',
  '.BBBBB............',
  'KBBKBB............',
  '..BBB.............',
  '..BBBB............',
  '..BBBBBBBBBBB.....',
  '..BBBBBBBBBBBBB...',
  '..BCCBBBBBBBBBB...',
  '...BBBBBBBBBBBB...',
];
const DEER_LEGS_A = [
  '...BB.......BB....',
  '...BB.......BB....',
  '...BB.......BB....',
  '...BB.......BB....',
  '...BB.......BB....',
  '...KK.......KK....',
];
const DEER_LEGS_B = [
  '..BB........BB....',
  '..BB........BB....',
  '..BB.........BB...',
  '.BB..........BB...',
  '.BB..........BB...',
  '.KK..........KK...',
];

export const deerFrames = [
  px([...DEER_BODY, ...DEER_LEGS_A], DEER_PAL),
  px([...DEER_BODY, ...DEER_LEGS_B], DEER_PAL),
];
export const DEER_W = 18, DEER_H = 17;

/* ---------------- Plum tree ---------------- */
export const TREE_W = 56, TREE_H = 64;
// Fixed plum positions inside the canopy (max 6 plums per tree).
export const PLUM_SLOTS = [
  [17, 15], [37, 13], [27, 23], [43, 26], [13, 29], [31, 34],
];

export const treeSprite = (() => {
  const [c, g] = canvasOf(TREE_W, TREE_H);
  // trunk
  g.fillStyle = '#6b4527';
  g.fillRect(24, 38, 9, 26);
  g.fillStyle = '#54351d';
  g.fillRect(24, 38, 3, 26);
  g.fillRect(19, 60, 19, 3); // roots
  g.fillStyle = '#7a5230';
  g.fillRect(31, 40, 2, 20); // trunk highlight
  // canopy
  blob(g, 28, 22, 19, '#2f6627');
  blob(g, 17, 17, 12, '#3e7d32');
  blob(g, 39, 18, 12, '#3e7d32');
  blob(g, 28, 30, 13, '#356f2b');
  blob(g, 20, 12, 6, '#4c9440');
  blob(g, 40, 13, 5, '#4c9440');
  blob(g, 30, 20, 4, '#54a648');
  return c;
})();

export function drawPlum(g, x, y) {
  g.fillStyle = '#5c2a52';
  g.fillRect(x, y, 3, 3);
  g.fillStyle = '#8e3b76';
  g.fillRect(x, y, 2, 2);
  g.fillStyle = '#d9b2d0';
  g.fillRect(x, y, 1, 1);
}

/* ---------------- Doghouse ---------------- */
export const houseSprite = (() => {
  const [c, g] = canvasOf(40, 34);
  // walls
  g.fillStyle = '#a0714a';
  g.fillRect(4, 14, 32, 20);
  g.fillStyle = '#7c5535';
  g.fillRect(4, 14, 32, 2);
  // roof
  g.fillStyle = '#8c3b2e';
  for (let i = 0; i < 8; i++) g.fillRect(4 + i * 2 - i, 14 - i * 1.75, 34 - i * 2 + i * 2, 2);
  g.fillStyle = '#a84a38';
  g.beginPath();
  g.fillRect(2, 12, 36, 3);
  g.fillRect(6, 8, 28, 4);
  g.fillRect(10, 4, 20, 4);
  g.fillRect(15, 1, 10, 3);
  // door arch
  g.fillStyle = '#2b1a0e';
  g.fillRect(14, 20, 12, 14);
  g.fillRect(16, 17, 8, 3);
  // bone over door
  g.fillStyle = '#efe6d2';
  g.fillRect(16, 15, 8, 1);
  g.fillRect(15, 14, 2, 3);
  g.fillRect(23, 14, 2, 3);
  return c;
})();

/* ---------------- Sell stall (striped produce stand — bring plums here) ---------------- */
export const stallSprite = (() => {
  const [c, g] = canvasOf(28, 26);
  // counter
  g.fillStyle = '#9c7040';
  g.fillRect(2, 14, 24, 10);
  g.fillStyle = '#7c5630';
  g.fillRect(2, 14, 24, 2);
  g.fillRect(2, 22, 24, 2);
  // posts
  g.fillStyle = '#6b4a26';
  g.fillRect(2, 4, 2, 10);
  g.fillRect(24, 4, 2, 10);
  // awning (striped)
  for (let i = 0; i < 7; i++) {
    g.fillStyle = i % 2 ? '#e8e0cc' : '#c0503c';
    g.fillRect(i * 4, 2, 4, 4);
  }
  g.fillStyle = '#a84433';
  g.fillRect(0, 6, 28, 1);
  // crate of plums on the counter (this is where you sell)
  g.fillStyle = '#7c5630';
  g.fillRect(9, 15, 11, 7);
  g.fillStyle = '#5c3f22';
  g.fillRect(9, 15, 11, 1);
  drawPlum(g, 10, 16);
  drawPlum(g, 14, 16);
  drawPlum(g, 12, 18);
  drawPlum(g, 16, 18);
  return c;
})();

/* ---------------- Shop vending machine ---------------- */
export const vendingSprite = (() => {
  const [c, g] = canvasOf(22, 34);
  // machine body
  g.fillStyle = '#b0392c';
  g.fillRect(1, 1, 20, 32);
  g.fillStyle = '#8f2b20';
  g.fillRect(1, 1, 20, 2);     // top shadow
  g.fillRect(1, 1, 2, 32);     // left edge
  g.fillStyle = '#d0574a';
  g.fillRect(19, 1, 2, 32);    // right highlight
  // glass display window
  g.fillStyle = '#213c46';
  g.fillRect(3, 4, 12, 20);
  g.fillStyle = '#2f5563';
  g.fillRect(3, 4, 12, 1);
  // three shelves of goods (plums as stock)
  for (let r = 0; r < 3; r++) {
    const y = 6 + r * 6;
    g.fillStyle = '#172a31';
    g.fillRect(3, y + 4, 12, 1); // shelf line
    drawPlum(g, 5, y);
    drawPlum(g, 9, y);
    drawPlum(g, 12, y);
  }
  // control panel (right column)
  g.fillStyle = '#7a2016';
  g.fillRect(16, 4, 4, 20);
  // buttons
  g.fillStyle = '#ffd76b';
  g.fillRect(17, 6, 2, 2);
  g.fillStyle = '#8fce6e';
  g.fillRect(17, 10, 2, 2);
  g.fillStyle = '#e8e0cc';
  g.fillRect(17, 14, 2, 2);
  // coin slot
  g.fillStyle = '#2b1a0e';
  g.fillRect(17, 19, 2, 3);
  g.fillStyle = '#ffd76b';
  g.fillRect(17, 19, 2, 1);
  // dispenser tray
  g.fillStyle = '#2b1a0e';
  g.fillRect(3, 26, 16, 5);
  g.fillStyle = '#17110a';
  g.fillRect(4, 27, 14, 3);
  // little feet
  g.fillStyle = '#5c1c14';
  g.fillRect(2, 32, 3, 2);
  g.fillRect(17, 32, 3, 2);
  return c;
})();

/* ---------------- Scarecrow ---------------- */
export const scarecrowSprite = (() => {
  const [c, g] = canvasOf(16, 24);
  // pole
  g.fillStyle = '#6b4a26';
  g.fillRect(7, 6, 2, 18);
  g.fillRect(2, 10, 12, 2); // arms
  // shirt
  g.fillStyle = '#4a6d9c';
  g.fillRect(5, 10, 6, 7);
  // head (pumpkin-ish)
  g.fillStyle = '#d9903c';
  g.fillRect(4, 2, 8, 7);
  g.fillStyle = '#8c5a20';
  g.fillRect(5, 4, 2, 2);
  g.fillRect(9, 4, 2, 2);
  // hat
  g.fillStyle = '#7a5a2a';
  g.fillRect(3, 1, 10, 2);
  g.fillRect(5, 0, 6, 2);
  return c;
})();

/* ---------------- Ground / background ---------------- */
export function makeBackground(W, H, TILE) {
  const [c, g] = canvasOf(W, H);
  // base grass
  g.fillStyle = '#63a84a';
  g.fillRect(0, 0, W, H);
  // tile variation
  const rng = mulberry32(12345);
  for (let ty = 0; ty < H / TILE; ty++) {
    for (let tx = 0; tx < W / TILE; tx++) {
      const r = rng();
      if (r < 0.28) {
        g.fillStyle = r < 0.12 ? '#5b9c43' : '#6db052';
        g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      }
    }
  }
  // grass tufts + flowers
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rng() * W), y = Math.floor(rng() * H);
    const r = rng();
    if (r < 0.72) {
      g.fillStyle = '#4e8f3a';
      g.fillRect(x, y, 1, 2);
      g.fillRect(x + 2, y + 1, 1, 1);
    } else {
      g.fillStyle = r < 0.86 ? '#f0ead2' : '#e8a7c4';
      g.fillRect(x, y, 2, 2);
      g.fillStyle = '#ffd76b';
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- Fence drawing (per segment) ---------------- */
export function drawFencePost(g, x, y) {
  g.fillStyle = '#8a6134';
  g.fillRect(x + 6, y - 6, 3, 14);
  g.fillStyle = '#6b4a26';
  g.fillRect(x + 6, y - 6, 3, 2);
}
export function drawFenceRailH(g, x, y) {
  g.fillStyle = '#a97c50';
  g.fillRect(x, y - 1, 16, 2);
  g.fillRect(x, y + 4, 16, 2);
}
export function drawFenceRailV(g, x, y) {
  g.fillStyle = '#a97c50';
  g.fillRect(x + 7, y, 2, 16);
}
