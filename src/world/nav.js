// Grid pathfinding (A*) over walkable ground, for deer and the autopilot.
// Paths are lists of feet positions; the grid includes an off-map ring so
// deer can be routed in from, and out to, beyond the edges.
import { W, H } from '../core/config.js';
import { dist } from '../core/util.js';
import { solids, solidsVersion } from './collision.js';

const CELL = 8;
const MARGIN = 32;
const COLS = (W + MARGIN * 2) / CELL;
const ROWS = (H + MARGIN * 2) / CELL;
// Half-size of the widest body (deer feet are 14x4), for exact checks...
const BODY_X = 7, BODY_Y = 3;
// ...and a little extra on the grid, since a path may pass anywhere in a cell.
const PAD_X = 9, PAD_Y = 5;
const SQRT2 = Math.SQRT2;
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2]];

function center(i) {
  return { x: (i % COLS) * CELL - MARGIN + CELL / 2, y: ((i / COLS) | 0) * CELL - MARGIN + CELL / 2 };
}
function cellAt(x, y) {
  const c = Math.max(0, Math.min(COLS - 1, Math.floor((x + MARGIN) / CELL)));
  const r = Math.max(0, Math.min(ROWS - 1, Math.floor((y + MARGIN) / CELL)));
  return r * COLS + c;
}
function clearOf(list, x, y, px, py) {
  for (const s of list) {
    if (x > s.x - px && x < s.x + s.w + px && y > s.y - py && y < s.y + s.h + py) return false;
  }
  return true;
}

// Can a body stand with its feet centered here? (Exact, not grid-based.)
export function pointFree(x, y) {
  return clearOf(solids(), x, y, BODY_X, BODY_Y);
}

let grid = null, gridVersion = -1;
function ensureGrid() {
  const v = solidsVersion();
  if (grid && v === gridVersion) return;
  const list = solids();
  grid = new Uint8Array(COLS * ROWS);
  for (let i = 0; i < grid.length; i++) {
    const p = center(i);
    grid[i] = clearOf(list, p.x, p.y, PAD_X, PAD_Y) ? 0 : 1;
  }
  gridVersion = v;
}

// Nearest open cell to i (searching outward ring by ring), or -1.
function openNear(i) {
  if (!grid[i]) return i;
  const c0 = i % COLS, r0 = (i / COLS) | 0;
  for (let rad = 1; rad <= 8; rad++) {
    let best = -1, bd = Infinity;
    for (let r = r0 - rad; r <= r0 + rad; r++) {
      for (let c = c0 - rad; c <= c0 + rad; c++) {
        if (Math.max(Math.abs(c - c0), Math.abs(r - r0)) !== rad) continue;
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS || grid[r * COLS + c]) continue;
        const d = (c - c0) ** 2 + (r - r0) ** 2;
        if (d < bd) { bd = d; best = r * COLS + c; }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

// Minimal binary heap keyed by priority.
class Heap {
  constructor() { this.v = []; this.p = []; }
  get size() { return this.v.length; }
  push(v, p) {
    const a = this.v, b = this.p;
    let i = a.length; a.push(v); b.push(p);
    while (i > 0) {
      const up = (i - 1) >> 1;
      if (b[up] <= b[i]) break;
      [a[up], a[i]] = [a[i], a[up]]; [b[up], b[i]] = [b[i], b[up]];
      i = up;
    }
  }
  pop() {
    const a = this.v, b = this.p, top = a[0];
    const lv = a.pop(), lp = b.pop();
    if (a.length) {
      a[0] = lv; b[0] = lp;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < a.length && b[l] < b[m]) m = l;
        if (r < a.length && b[r] < b[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; [b[m], b[i]] = [b[i], b[m]];
        i = m;
      }
    }
    return top;
  }
}

// Search from start cell s until isGoal(cell); h is the heuristic (0 = Dijkstra).
function search(s, isGoal, h) {
  const N = grid.length;
  const g = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const open = new Heap();
  g[s] = 0; open.push(s, h(s));
  while (open.size) {
    const cur = open.pop();
    if (closed[cur]) continue;
    if (isGoal(cur)) {
      const cells = [cur];
      for (let k = came[cur]; k >= 0; k = came[k]) cells.push(k);
      return cells.reverse();
    }
    closed[cur] = 1;
    const cc = cur % COLS, cr = (cur / COLS) | 0;
    for (const [dx, dy, cost] of DIRS) {
      const nc = cc + dx, nr = cr + dy;
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      const n = nr * COLS + nc;
      if (grid[n] || closed[n]) continue;
      if (dx && dy && (grid[cr * COLS + nc] || grid[nr * COLS + cc])) continue;   // no corner cutting
      const ng = g[cur] + cost;
      if (ng < g[n]) { g[n] = ng; came[n] = cur; open.push(n, ng + h(n)); }
    }
  }
  return null;
}

// Straight walk from a to b stays on open cells? Leaving a blocked cell we
// start in (e.g. standing right against a wall) is allowed.
function lineOpen(a, b) {
  const n = Math.max(1, Math.ceil(dist(a.x, a.y, b.x, b.y) / 2));
  let leaving = !!grid[cellAt(a.x, a.y)];
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    const blocked = grid[cellAt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)];
    if (leaving && blocked) continue;
    leaving = false;
    if (blocked) return false;
  }
  return true;
}

// Drop waypoints that can be skipped with a straight walk.
function smooth(pts) {
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let j = i + 1;
    while (j + 1 < pts.length && lineOpen(pts[i], pts[j + 1])) j++;
    out.push(pts[j]);
    i = j;
  }
  return out;
}

function toWaypoints(start, cells, end) {
  const pts = [start, ...cells.slice(1).map(center)];
  if (end) pts.push(end);
  return smooth(pts).slice(1);
}

// Waypoints from (sx, sy) to (tx, ty), or null if there's no way there.
export function findPath(sx, sy, tx, ty) {
  ensureGrid();
  const s = openNear(cellAt(sx, sy));
  const t = openNear(cellAt(tx, ty));
  if (s < 0 || t < 0) return null;
  const goal = center(t);
  const h = (i) => {
    const p = center(i);
    const dx = Math.abs(p.x - goal.x) / CELL, dy = Math.abs(p.y - goal.y) / CELL;
    return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
  };
  const cells = search(s, (i) => i === t, h);
  if (!cells) return null;
  return toWaypoints({ x: sx, y: sy }, cells, pointFree(tx, ty) ? { x: tx, y: ty } : null);
}

// Waypoints to the nearest point well past the map edge (for fleeing).
export function pathOffMap(sx, sy) {
  ensureGrid();
  const s = openNear(cellAt(sx, sy));
  if (s < 0) return null;
  const off = (i) => {
    const p = center(i);
    return p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20;
  };
  const cells = search(s, off, () => 0);
  return cells ? toWaypoints({ x: sx, y: sy }, cells, null) : null;
}
