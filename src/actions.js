// Player verbs: bark, use (E), pause.
import { state, player } from './core/state.js';
import { dist } from './core/util.js';
import { beep, sfx } from './core/audio.js';
import { toast, spawnParticle } from './fx.js';
import { startFlee } from './systems/deer.js';
import { toggleShop } from './ui/shop.js';
import { playerFeet, deerFeet, nearestUsable } from './world/entities.js';

export const BARK_RADIUS = 85;

export function bark() {
  if (player.barkCd > 0 || state.shopOpen) return;
  player.barkCd = 1.0;
  sfx.bark();
  spawnParticle({ type: 'ring', x: player.x + 8, y: player.y + 6, r: 6, life: 0.4, max: 0.4 });
  toast(player.x + 8, player.y - 10, 'WOOF!', '#ffd76b');
  const p = playerFeet();
  for (const d of state.deer) {
    const f = deerFeet(d);
    if (d.state !== 'flee' && dist(f.x, f.y, p.x, p.y) < BARK_RADIUS) startFlee(d);
  }
}

export function interact() {
  if (state.shopOpen) { toggleShop(false); return; }
  const p = playerFeet();
  nearestUsable(p.x, p.y)?.interact();
}

export function togglePause() {
  if (!state.started || state.shopOpen) return;
  state.paused = !state.paused;
  if (state.paused) beep(330, 0.06, 'square', 0.1); else beep(440, 0.06, 'square', 0.1);
}

// Where to draw the [E] hint, if anything is in reach.
export function nearestPrompt() {
  const p = playerFeet();
  const e = nearestUsable(p.x, p.y);
  return e ? { x: e.x + e.sprite.width / 2, y: e.y - 4, label: 'E' } : null;
}
