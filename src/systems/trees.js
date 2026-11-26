// Plum trees: ripening and harvesting.
import { MAX_PLUMS } from '../core/config.js';
import { state } from '../core/state.js';
import { save } from '../core/save.js';
import { sfx } from '../core/audio.js';
import { toast, spawnParticle } from '../fx.js';
import { TREE_W } from '../sprites.js';

export function updateTrees(dt) {
  const growTime = state.upgrades.fertilizer ? 7 : 11;
  for (const t of state.trees) {
    if (t.plums < MAX_PLUMS) {
      t.t += dt;
      if (t.t >= growTime) {
        t.t = 0; t.plums++;
        spawnParticle({ type: 'bit', x: t.x + TREE_W / 2, y: t.y + 12, vx: 0, vy: -10, life: 0.6, max: 0.6, color: '#d9b2d0' });
      }
    }
  }
}

export function harvestTree(t) {
  if (t.plums <= 0) return false;
  toast(t.x + TREE_W / 2, t.y + 10, `+${t.plums} plums`, '#d989c8');
  state.plums += t.plums;
  t.plums = 0; t.t = 0;
  sfx.harvest(); save();
  return true;
}
