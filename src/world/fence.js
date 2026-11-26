// The orchard fence as tile segments: one list drives drawing and collision.
import { TILE, FENCE, GATES } from '../core/config.js';

function isGate(tx, ty) {
  const { x1, y1, x2, y2 } = FENCE;
  return GATES.some(g => {
    const along = g.side === 'top' || g.side === 'bottom' ? tx : ty;
    if (along < g.from || along > g.to) return false;
    return (g.side === 'top' && ty === y1) || (g.side === 'bottom' && ty === y2) ||
           (g.side === 'left' && tx === x1) || (g.side === 'right' && tx === x2);
  });
}

let segments = null;
// [{tx, ty, dir: 'h' | 'v'}] — horizontal runs along the top/bottom rows
// (including corners), vertical runs down the sides.
export function fenceSegments() {
  if (segments) return segments;
  segments = [];
  const { x1, y1, x2, y2 } = FENCE;
  for (let tx = x1; tx <= x2; tx++) {
    for (const ty of [y1, y2]) if (!isGate(tx, ty)) segments.push({ tx, ty, dir: 'h' });
  }
  for (let ty = y1 + 1; ty < y2; ty++) {
    for (const tx of [x1, x2]) if (!isGate(tx, ty)) segments.push({ tx, ty, dir: 'v' });
  }
  return segments;
}

// Collision box for one segment (covers the rails and posts as drawn).
export function segmentBox(s) {
  return s.dir === 'h'
    ? { x: s.tx * TILE, y: s.ty * TILE + 2, w: TILE, h: 12 }
    : { x: s.tx * TILE + 5, y: s.ty * TILE, w: 6, h: TILE };
}
