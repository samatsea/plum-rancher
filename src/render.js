// Draws the world: background, fence, y-sorted sprites, particles, HUD.
import { TILE, W, H, SCALE, DAY_LEN, FENCE, GATES, HOUSE, BIN, STAND, SCARECROW } from './core/config.js';
import { state, player } from './core/state.js';
import { nearestPrompt } from './actions.js';
import { drawParticles } from './fx.js';
import { drawHUD, drawPauseOverlay } from './ui/hud.js';
import {
  dogFrames, DOG_W, DOG_H,
  deerFrames, DEER_W, DEER_H,
  treeSprite, TREE_W, TREE_H, PLUM_SLOTS, drawPlum,
  houseSprite, stallSprite, vendingSprite, scarecrowSprite,
  makeBackground, drawFencePost, drawFenceRailH, drawFenceRailV,
} from './sprites.js';

const bg = makeBackground(W, H, TILE);

function drawFence(g) {
  if (!state.upgrades.fence) return;
  const { x1, y1, x2, y2 } = FENCE;
  const isGate = (tx, ty) => GATES.some(gt => Math.abs(gt.tx - tx) <= 1 && gt.ty === ty);
  for (let tx = x1; tx <= x2; tx++) {
    for (const ty of [y1, y2]) {
      if (isGate(tx, ty)) continue;
      drawFenceRailH(g, tx * TILE, ty * TILE + 6);
      if (tx % 2 === 0) drawFencePost(g, tx * TILE, ty * TILE + 6);
    }
  }
  for (let ty = y1 + 1; ty < y2; ty++) {
    for (const tx of [x1, x2]) {
      if (isGate(tx, ty)) continue;
      drawFenceRailV(g, tx * TILE, ty * TILE);
      if (ty % 2 === 0) drawFencePost(g, tx * TILE, ty * TILE + 8);
    }
  }
}

function shadow(g, x, y, w) {
  g.fillStyle = 'rgba(20,40,15,0.3)';
  g.beginPath();
  g.ellipse(x, y, w, w * 0.35, 0, 0, Math.PI * 2);
  g.fill();
}

export function render(ctx) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bg, 0, 0);
  drawFence(ctx);

  // collect y-sorted drawables
  const draws = [];
  draws.push({ y: HOUSE.y + 34, f: () => ctx.drawImage(houseSprite, HOUSE.x, HOUSE.y) });
  draws.push({ y: BIN.y + 26, f: () => ctx.drawImage(stallSprite, BIN.x, BIN.y) });
  draws.push({ y: STAND.y + 34, f: () => ctx.drawImage(vendingSprite, STAND.x, STAND.y) });
  if (state.upgrades.scarecrow)
    draws.push({ y: SCARECROW.y + 24, f: () => ctx.drawImage(scarecrowSprite, SCARECROW.x, SCARECROW.y) });

  for (const t of state.trees) {
    draws.push({
      y: t.y + TREE_H, f: () => {
        shadow(ctx, t.x + TREE_W / 2, t.y + TREE_H - 2, 14);
        ctx.drawImage(treeSprite, t.x, t.y);
        for (let i = 0; i < t.plums; i++) {
          const [sx, sy] = PLUM_SLOTS[i];
          drawPlum(ctx, t.x + sx, t.y + sy);
        }
      }
    });
  }

  for (const d of state.deer) {
    draws.push({
      y: d.y + DEER_H, f: () => {
        shadow(ctx, d.x + DEER_W / 2, d.y + DEER_H, 8);
        const frame = deerFrames[(d.state === 'eat') ? 0 : Math.floor(d.animT * 7) % 2];
        const flip = (d.vx ?? 0) > 0.5; // sprite faces left by default
        ctx.save();
        if (flip) { ctx.translate(d.x + DEER_W, d.y); ctx.scale(-1, 1); }
        else ctx.translate(d.x, d.y);
        ctx.drawImage(frame, 0, 0);
        if (d.ate > 0 && d.state === 'flee') drawPlum(ctx, flip ? 0 : 0, 2);
        ctx.restore();
      }
    });
  }

  draws.push({
    y: player.y + DOG_H, f: () => {
      shadow(ctx, player.x + 8, player.y + DOG_H, 7);
      const frame = dogFrames[player.moving ? Math.floor(player.animT * 9) % 2 : 0];
      ctx.save();
      if (player.dir < 0) { ctx.translate(player.x + DOG_W, player.y); ctx.scale(-1, 1); }
      else ctx.translate(player.x, player.y);
      ctx.drawImage(frame, 0, 0);
      ctx.restore();
    }
  });

  draws.sort((a, b) => a.y - b.y);
  for (const d of draws) d.f();

  drawParticles(ctx);

  // [E] prompt
  if (state.started && !state.shopOpen) {
    const pr = nearestPrompt();
    if (pr) {
      ctx.fillStyle = 'rgba(20,20,10,0.75)';
      ctx.fillRect(pr.x - 5, pr.y - 7, 10, 9);
      ctx.fillStyle = '#ffd76b';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('E', pr.x, pr.y);
    }
  }

  // dusk/dawn tint
  const tod = state.dayT / DAY_LEN;
  let tint = 0;
  if (tod > 0.8) tint = (tod - 0.8) / 0.2 * 0.28;
  if (tod < 0.08) tint = (0.08 - tod) / 0.08 * 0.28;
  if (tint > 0) {
    ctx.fillStyle = `rgba(30, 25, 70, ${tint})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (state.started) drawHUD(ctx);
  if (state.paused) drawPauseOverlay(ctx);
}
