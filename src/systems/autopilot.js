// Idle mode: Brontosaurus runs the ranch on his own.
import { TILE, FENCE, BIN } from '../core/config.js';
import { state, player } from '../core/state.js';
import { dist, rand } from '../core/util.js';
import { beep } from '../core/audio.js';
import { toast } from '../fx.js';
import { bark } from '../actions.js';
import { harvestTree } from './trees.js';
import { sellPlums } from './economy.js';
import { DEER_W, DEER_H, TREE_W, TREE_H } from '../sprites.js';

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

export function autoPilot(dt) {
  const px = player.x + 8, py = player.y + 6;

  // 1. Defend: chase the nearest deer that isn't already fleeing, and bark.
  let deer = null, dbest = Infinity;
  for (const d of state.deer) {
    if (d.state === 'flee') continue;
    const dd = dist(px, py, d.x + DEER_W / 2, d.y + DEER_H / 2);
    if (dd < dbest) { dbest = dd; deer = d; }
  }
  if (deer) {
    ai.target = null;
    if (dbest < 62) { bark(); return [0, 0]; }   // bark scares all deer within 85px
    return steer(px, py, deer.x + DEER_W / 2, deer.y + DEER_H / 2);
  }

  // 2. Hands full: go sell.
  if (state.plums >= 6) return goSell(px, py);

  // 3. A ripe tree (4+ plums): go harvest it.
  let tree = null, tbest = Infinity;
  for (const t of state.trees) {
    if (t.plums < 4) continue;
    const dd = dist(px, py, t.x + TREE_W / 2, t.y + TREE_H - 6);
    if (dd < tbest) { tbest = dd; tree = t; }
  }
  if (tree) {
    if (tbest < 30) { harvestTree(tree); return [0, 0]; }
    return steer(px, py, tree.x + TREE_W / 2, tree.y + TREE_H - 6);
  }

  // 4. Any leftover plums: sell them.
  if (state.plums > 0) return goSell(px, py);

  // 5. Nothing to do: mosey around the orchard.
  return idleWander(px, py, dt);
}

function goSell(px, py) {
  if (dist(px, py, BIN.x + 14, BIN.y + 18) < 30) { sellPlums(); return [0, 0]; }
  return steer(px, py, BIN.x + 14, BIN.y + 18);
}

function idleWander(px, py, dt) {
  if (ai.rest > 0) { ai.rest -= dt; return [0, 0]; }
  if (!ai.target || dist(px, py, ai.target.x, ai.target.y) < 8) {
    if (ai.target) { ai.target = null; ai.rest = rand(0.7, 2.2); return [0, 0]; }
    ai.target = {
      x: rand((FENCE.x1 + 2) * TILE, (FENCE.x2 - 2) * TILE),
      y: rand((FENCE.y1 + 2) * TILE, (FENCE.y2 - 2) * TILE),
    };
  }
  return steer(px, py, ai.target.x, ai.target.y);
}
