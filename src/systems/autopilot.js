// Idle mode: Brontosaurus runs the ranch on his own.
import { TILE, FENCE } from '../core/config.js';
import { state, player } from '../core/state.js';
import { dist, rand } from '../core/util.js';
import { beep } from '../core/audio.js';
import { toast } from '../fx.js';
import { bark } from '../actions.js';
import { entity, treeEntity, useSpot, approachSpot, playerFeet, deerFeet } from '../world/entities.js';
import { findPath, pointFree } from '../world/nav.js';

export const ai = { target: null, rest: 0, path: null, pi: 0, goal: null, repathT: 0, stuckT: 0, last: null };

export function toggleIdle() {
  state.idle = !state.idle;
  ai.target = null; ai.rest = 0; ai.path = null;
  toast(player.x + 8, player.y - 14, state.idle ? 'auto: ON' : 'auto: OFF', state.idle ? '#8fce6e' : '#f2e8c9');
  beep(state.idle ? 660 : 392, 0.09, 'triangle', 0.12);
}

function steer(px, py, tx, ty) {
  const dx = tx - px, dy = ty - py;
  const n = Math.hypot(dx, dy) || 1;
  return [dx / n, dy / n];
}

// Head toward (gx, gy) along a planned route. Re-plans when the goal moves,
// when we get wedged, and (for moving targets like deer) every so often.
function travel(p, gx, gy, dt, moving = false) {
  if (ai.last && ai.path) {
    const progressed = dist(p.x, p.y, ai.last.x, ai.last.y) > 0.3;
    ai.stuckT = progressed ? 0 : ai.stuckT + dt;
  }
  ai.last = { x: p.x, y: p.y };
  ai.repathT -= dt;
  if (!ai.path || !ai.goal || dist(gx, gy, ai.goal.x, ai.goal.y) > 12 ||
      ai.stuckT > 0.5 || (moving && ai.repathT <= 0)) {
    ai.goal = { x: gx, y: gy };
    ai.path = findPath(p.x, p.y, gx, gy) || [];
    ai.pi = 0; ai.repathT = 1; ai.stuckT = 0;
  }
  let wp = ai.path[ai.pi];
  while (wp && dist(p.x, p.y, wp.x, wp.y) < 2) wp = ai.path[++ai.pi];
  return wp ? steer(p.x, p.y, wp.x, wp.y) : [0, 0];
}

// Walk to an entity's approach spot and use it once in reach.
function goUse(p, e, dt) {
  const u = useSpot(e);
  if (dist(p.x, p.y, u.x, u.y) < u.r) { e.interact(); ai.path = null; return [0, 0]; }
  const a = approachSpot(e);
  return travel(p, a.x, a.y, dt);
}

export function autoPilot(dt) {
  const p = playerFeet();

  // 1. Defend: chase the nearest deer that isn't already fleeing, and bark.
  let deer = null, dbest = Infinity;
  for (const d of state.deer) {
    if (d.state === 'flee') continue;
    const f = deerFeet(d);
    const dd = dist(p.x, p.y, f.x, f.y);
    if (dd < dbest) { dbest = dd; deer = d; }
  }
  if (deer) {
    ai.target = null;
    if (dbest < 62) { bark(); return [0, 0]; }   // bark reaches well past this
    const f = deerFeet(deer);
    return travel(p, f.x, f.y, dt, true);
  }

  // 2. Hands full: go sell.
  if (state.plums >= 6) return goUse(p, entity('stall'), dt);

  // 3. A ripe tree (4+ plums): go harvest it.
  let tree = null, tbest = Infinity;
  for (const t of state.trees) {
    if (t.plums < 4) continue;
    const a = approachSpot(treeEntity(t));
    const dd = dist(p.x, p.y, a.x, a.y);
    if (dd < tbest) { tbest = dd; tree = t; }
  }
  if (tree) return goUse(p, treeEntity(tree), dt);

  // 4. Any leftover plums: sell them.
  if (state.plums > 0) return goUse(p, entity('stall'), dt);

  // 5. Nothing to do: mosey around the orchard.
  return idleWander(p, dt);
}

function idleWander(p, dt) {
  if (ai.rest > 0) { ai.rest -= dt; return [0, 0]; }
  if (!ai.target || dist(p.x, p.y, ai.target.x, ai.target.y) < 8) {
    if (ai.target) { ai.target = null; ai.rest = rand(0.7, 2.2); return [0, 0]; }
    let x, y;
    do {   // somewhere open inside the orchard
      x = rand((FENCE.x1 + 2) * TILE, (FENCE.x2 - 2) * TILE);
      y = rand((FENCE.y1 + 2) * TILE, (FENCE.y2 - 2) * TILE);
    } while (!pointFree(x, y));
    ai.target = { x, y };
  }
  const dir = travel(p, ai.target.x, ai.target.y, dt);
  if (!dir[0] && !dir[1]) ai.target = null;   // route finished or unreachable: pick again
  return dir;
}
