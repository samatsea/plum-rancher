// Draws the world: background, fence, y-sorted sprites, particles, HUD.
import { TILE, W, H, VIEW_W, VIEW_H, SCALE, DAY_LEN } from './core/config.js';
import { fenceSegments } from './world/fence.js';
import { camera, followCamera } from './world/camera.js';
import { state, player } from './core/state.js';
import { nearestPrompt } from './actions.js';
import { drawParticles } from './fx.js';
import { drawHUD, drawPauseOverlay } from './ui/hud.js';
import { text } from './ui/font.js';
import { entities, playerFeet } from './world/entities.js';
import {
  dogFrames, DOG_W, DOG_H,
  deerFrames, DEER_W, DEER_H,
  treeSprite, TREE_W, TREE_H, PLUM_SLOTS, drawPlum,
  makeBackground, drawFencePost, drawFenceRailH, drawFenceRailV,
} from './sprites.js';

const bg = makeBackground(W, H, TILE);

function drawFence(g) {
  if (!state.upgrades.fence) return;
  for (const s of fenceSegments()) {
    if (s.dir === 'h') {
      drawFenceRailH(g, s.tx * TILE, s.ty * TILE + 6);
      if (s.tx % 2 === 0) drawFencePost(g, s.tx * TILE, s.ty * TILE + 6);
    } else {
      drawFenceRailV(g, s.tx * TILE, s.ty * TILE);
      if (s.ty % 2 === 0) drawFencePost(g, s.tx * TILE, s.ty * TILE + 8);
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
  ctx.fillStyle = '#17230f';                 // beyond the map's edge
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // ---- world space (through the camera) ----
  const f = playerFeet();
  followCamera(f.x, f.y);
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.drawImage(bg, 0, 0);
  drawFence(ctx);

  // collect y-sorted drawables
  const draws = [];
  for (const e of entities()) {
    if (e.tree) {
      const t = e.tree;
      draws.push({
        y: t.y + e.sortY, f: () => {
          shadow(ctx, t.x + TREE_W / 2, t.y + TREE_H - 2, 14);
          ctx.drawImage(treeSprite, t.x, t.y);
          for (let i = 0; i < t.plums; i++) {
            const [sx, sy] = PLUM_SLOTS[i];
            drawPlum(ctx, t.x + sx, t.y + sy);
          }
        }
      });
    } else {
      draws.push({ y: e.y + e.sortY, f: () => ctx.drawImage(e.sprite, e.x, e.y) });
    }
  }

  for (const d of state.deer) {
    draws.push({
      y: d.y + DEER_H, f: () => {
        shadow(ctx, d.x + DEER_W / 2, d.y + DEER_H, 8);
        const frame = deerFrames[(d.state === 'eat') ? 0 : Math.floor(d.animT * 7) % 2];
        // sprite faces left by default; eating deer face the trunk
        const flip = d.state === 'eat' ? d.face > 0 : (d.vx ?? 0) > 0.5;
        ctx.save();
        if (flip) { ctx.translate(d.x + DEER_W, d.y); ctx.scale(-1, 1); }
        else ctx.translate(d.x, d.y);
        ctx.drawImage(frame, 0, 0);
        if (d.ate > 0 && d.state === 'flee') drawPlum(ctx, 0, 2);   // plum in its mouth
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
      const bx = Math.round(pr.x) - 5, by = Math.round(pr.y) - 8;
      ctx.fillStyle = 'rgba(20,20,10,0.75)';
      ctx.fillRect(bx, by, 10, 9);
      text(ctx, pr.label, bx + 3, by + 7, { color: '#ffd76b' });   // 5px glyph, 2px margin
    }
  }
  ctx.restore();

  // ---- screen space ----
  // dusk/dawn tint
  const tod = state.dayT / DAY_LEN;
  let tint = 0;
  if (tod > 0.8) tint = (tod - 0.8) / 0.2 * 0.28;
  if (tod < 0.08) tint = (0.08 - tod) / 0.08 * 0.28;
  if (tint > 0) {
    ctx.fillStyle = `rgba(30, 25, 70, ${tint})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  if (state.started) drawHUD(ctx);
  if (state.paused) drawPauseOverlay(ctx);
}
