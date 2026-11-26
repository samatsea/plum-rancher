// Player verbs: bark, use (E), pause.
import { BIN, STAND } from './core/config.js';
import { state, player } from './core/state.js';
import { dist } from './core/util.js';
import { beep, sfx } from './core/audio.js';
import { toast, spawnParticle } from './fx.js';
import { startFlee } from './systems/deer.js';
import { harvestTree } from './systems/trees.js';
import { sellPlums } from './systems/economy.js';
import { toggleShop } from './ui/shop.js';
import { TREE_W, TREE_H } from './sprites.js';

export function bark() {
  if (player.barkCd > 0 || state.shopOpen) return;
  player.barkCd = 1.0;
  sfx.bark();
  spawnParticle({ type: 'ring', x: player.x + 8, y: player.y + 6, r: 6, life: 0.4, max: 0.4 });
  toast(player.x + 8, player.y - 10, 'WOOF!', '#ffd76b');
  for (const d of state.deer) {
    if (dist(d.x + 9, d.y + 7, player.x + 8, player.y + 6) < 85 && d.state !== 'flee') {
      startFlee(d);
    }
  }
}

export function interact() {
  if (state.shopOpen) { toggleShop(false); return; }
  const px = player.x + 8, py = player.y + 6;

  for (const t of state.trees) {
    if (t.plums > 0 && dist(px, py, t.x + TREE_W / 2, t.y + TREE_H - 6) < 30) { harvestTree(t); return; }
  }
  if (dist(px, py, BIN.x + 14, BIN.y + 18) < 30) {
    if (!sellPlums()) { toast(BIN.x + 14, BIN.y - 6, 'no plums!', '#d97b6c'); sfx.denied(); }
    return;
  }
  if (dist(px, py, STAND.x + 11, STAND.y + 26) < 30) toggleShop(true);
}

export function togglePause() {
  if (!state.started || state.shopOpen) return;
  state.paused = !state.paused;
  if (state.paused) beep(330, 0.06, 'square', 0.1); else beep(440, 0.06, 'square', 0.1);
}

// Which interactable is close enough for [E]?
export function nearestPrompt() {
  const px = player.x + 8, py = player.y + 6;
  for (const t of state.trees) {
    if (t.plums > 0 && dist(px, py, t.x + TREE_W / 2, t.y + TREE_H - 6) < 30)
      return { x: t.x + TREE_W / 2, y: t.y - 4, label: 'E' };
  }
  if (dist(px, py, BIN.x + 14, BIN.y + 18) < 30) return { x: BIN.x + 14, y: BIN.y - 4, label: 'E' };
  if (dist(px, py, STAND.x + 11, STAND.y + 26) < 30) return { x: STAND.x + 11, y: STAND.y - 4, label: 'E' };
  return null;
}
