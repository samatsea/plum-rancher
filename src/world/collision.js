// Axis-aligned box collision against everything solid in the world.
import { state } from '../core/state.js';
import { entities, solidBox } from './entities.js';
import { fenceSegments, segmentBox } from './fence.js';

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Solid boxes, rebuilt only when what's built changes.
let cache = [], cacheKey = '', version = 0;
export function solids() {
  const key = `${state.upgrades.fence}|${state.upgrades.scarecrow}|${state.trees.length}`;
  if (key !== cacheKey) {
    cache = entities().filter(e => e.solid).map(solidBox);
    if (state.upgrades.fence) for (const s of fenceSegments()) cache.push(segmentBox(s));
    cacheKey = key;
    version++;
  }
  return cache;
}
// Bumps whenever the solid set changes (the nav grid uses it to know when to rebuild).
export function solidsVersion() {
  solids();
  return version;
}

// Move `box` by (dx, dy), stopping flush against solids and sliding along
// them. Returns the movement actually applied. Anything the box already
// overlaps is ignored, so a body that ends up inside something can walk out.
export function slide(box, dx, dy) {
  const blockers = solids().filter(s => !overlaps(box, s));
  const b = { x: box.x, y: box.y, w: box.w, h: box.h };
  if (dx) {
    b.x += dx;
    for (const s of blockers) if (overlaps(b, s)) b.x = dx > 0 ? s.x - b.w : s.x + s.w;
  }
  if (dy) {
    b.y += dy;
    for (const s of blockers) if (overlaps(b, s)) b.y = dy > 0 ? s.y - b.h : s.y + s.h;
  }
  return { dx: b.x - box.x, dy: b.y - box.y };
}
