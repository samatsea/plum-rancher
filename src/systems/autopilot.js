// Idle mode: Brontosaurus runs the ranch on his own.
import { TILE, FENCE } from '../core/config.js';
import { state, player } from '../core/state.js';
import { dist, rand } from '../core/util.js';
import { beep } from '../core/audio.js';
import { toast } from '../fx.js';
import { bark } from '../actions.js';
import { entity, treeEntity, useSpot, approachSpot, playerFeet, deerFeet } from '../world/entities.js';

export const ai = { target: null, rest: 0 };

export function toggleIdle() {
  state.idle = !state.idle;
  ai.target = null; ai.rest = 0;
  toast(player.x + 8, player.y - 14, state.idle ? 'auto: ON' : 'auto: OFF', state.idle ? '#8fce6e' : '#f2e8c9');
  beep(state.idle ? 660 : 392, 0.09, 'triangle', 0.12);
}

function steer(px, py, tx, ty) {
  const dx = tx - px, dy = ty - py;
  const n = Math.hypot(dx, dy) || 1;
  return [dx / n, dy / n];
}

// Walk to an entity's approach spot and use it once in reach.
function goUse(p, e) {
  const u = useSpot(e);
  if (dist(p.x, p.y, u.x, u.y) < u.r) { e.interact(); return [0, 0]; }
  const a = approachSpot(e);
  return steer(p.x, p.y, a.x, a.y);
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
    return steer(p.x, p.y, f.x, f.y);
  }

  // 2. Hands full: go sell.
  if (state.plums >= 6) return goUse(p, entity('stall'));

  // 3. A ripe tree (4+ plums): go harvest it.
  let tree = null, tbest = Infinity;
  for (const t of state.trees) {
    if (t.plums < 4) continue;
    const a = approachSpot(treeEntity(t));
    const dd = dist(p.x, p.y, a.x, a.y);
    if (dd < tbest) { tbest = dd; tree = t; }
  }
  if (tree) return goUse(p, treeEntity(tree));

  // 4. Any leftover plums: sell them.
  if (state.plums > 0) return goUse(p, entity('stall'));

  // 5. Nothing to do: mosey around the orchard.
  return idleWander(p, dt);
}

function idleWander(p, dt) {
  if (ai.rest > 0) { ai.rest -= dt; return [0, 0]; }
  if (!ai.target || dist(p.x, p.y, ai.target.x, ai.target.y) < 8) {
    if (ai.target) { ai.target = null; ai.rest = rand(0.7, 2.2); return [0, 0]; }
    ai.target = {
      x: rand((FENCE.x1 + 2) * TILE, (FENCE.x2 - 2) * TILE),
      y: rand((FENCE.y1 + 2) * TILE, (FENCE.y2 - 2) * TILE),
    };
  }
  return steer(p.x, p.y, ai.target.x, ai.target.y);
}
