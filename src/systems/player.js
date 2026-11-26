// Brontosaurus movement.
import { W, H } from '../core/config.js';
import { state, player } from '../core/state.js';
import { keys } from '../core/input.js';
import { dist, clamp } from '../core/util.js';
import { autoPilot } from './autopilot.js';
import { DOG_W, DOG_H, TREE_W, TREE_H } from '../sprites.js';

export function updatePlayer(dt) {
  if (state.shopOpen) { player.moving = false; return; }
  let dx = 0, dy = 0;
  if (keys.KeyA || keys.ArrowLeft) dx -= 1;
  if (keys.KeyD || keys.ArrowRight) dx += 1;
  if (keys.KeyW || keys.ArrowUp) dy -= 1;
  if (keys.KeyS || keys.ArrowDown) dy += 1;

  // Idle mode drives Brontosaurus, but manual input always takes priority.
  if (state.idle && dx === 0 && dy === 0) [dx, dy] = autoPilot(dt);

  player.moving = !!(dx || dy);
  if (player.moving) {
    const sp = 72 * (state.upgrades.treats ? 1.35 : 1);
    const n = Math.hypot(dx, dy);
    player.x += dx / n * sp * dt;
    player.y += dy / n * sp * dt;
    if (dx) player.dir = dx > 0 ? 1 : -1;
    player.animT += dt;

    // keep inside map
    player.x = clamp(player.x, 2, W - DOG_W - 2);
    player.y = clamp(player.y, 2, H - DOG_H - 2);

    // soft tree-trunk collision
    for (const t of state.trees) {
      const tx = t.x + TREE_W / 2, ty = t.y + TREE_H - 5;
      const px = player.x + 8, py = player.y + 8;
      const d = dist(px, py, tx, ty);
      if (d < 11 && d > 0.01) {
        player.x += (px - tx) / d * (11 - d);
        player.y += (py - ty) / d * (11 - d);
      }
    }
  }
  player.barkCd = Math.max(0, player.barkCd - dt);
}
