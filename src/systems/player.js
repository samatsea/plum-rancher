// Brontosaurus movement.
import { W, H } from '../core/config.js';
import { state, player } from '../core/state.js';
import { keys } from '../core/input.js';
import { clamp } from '../core/util.js';
import { autoPilot } from './autopilot.js';
import { playerBox } from '../world/entities.js';
import { slide } from '../world/collision.js';
import { DOG_W, DOG_H } from '../sprites.js';

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
    const moved = slide(playerBox(), dx / n * sp * dt, dy / n * sp * dt);
    player.x += moved.dx;
    player.y += moved.dy;
    if (dx) player.dir = dx > 0 ? 1 : -1;
    player.animT += dt;

    // keep inside map
    player.x = clamp(player.x, 2, W - DOG_W - 2);
    player.y = clamp(player.y, 2, H - DOG_H - 2);
  }
  player.barkCd = Math.max(0, player.barkCd - dt);
}
