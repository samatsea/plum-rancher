// Heads-up display and pause overlay (canvas).
import { VIEW_W as W, VIEW_H as H, DAY_LEN } from '../core/config.js';   // screen size
import { state } from '../core/state.js';
import { drawPlum } from '../sprites.js';

export function drawHUD(ctx) {
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'left';
  // panel
  ctx.fillStyle = 'rgba(20, 28, 12, 0.72)';
  ctx.fillRect(4, 4, 118, 14);
  // coin
  ctx.fillStyle = '#ffd76b'; ctx.fillRect(9, 8, 6, 6);
  ctx.fillStyle = '#b8922e'; ctx.fillRect(11, 10, 2, 2);
  ctx.fillStyle = '#f2e8c9'; ctx.fillText(String(state.coins), 19, 14);
  // plum
  drawPlum(ctx, 52, 8);
  ctx.fillText(String(state.plums), 60, 14);
  // day
  ctx.fillText('DAY ' + state.day, 86, 14);
  // day progress bar
  ctx.fillStyle = 'rgba(20, 28, 12, 0.72)';
  ctx.fillRect(4, 20, 118, 4);
  ctx.fillStyle = '#ffd76b';
  ctx.fillRect(5, 21, 116 * (state.dayT / DAY_LEN), 2);
  // auto-mode badge
  if (state.idle) {
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(20, 28, 12, 0.72)';
    ctx.fillRect(W - 52, 4, 48, 12);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#8fce6e';
    ctx.fillText('● AUTO', W - 8, 13);
    ctx.textAlign = 'left';
  }
  // controls hint
  ctx.fillStyle = 'rgba(242,232,201,0.55)';
  ctx.font = '7px monospace';
  ctx.fillText('WASD move · SPACE bark · E use · P pause · I auto · M mute', 6, H - 5);
}

export function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(15, 20, 10, 0.62)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2e8c9';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('PAUSED', W / 2, H / 2 - 2);
  ctx.font = '8px monospace';
  ctx.fillStyle = 'rgba(242,232,201,0.8)';
  ctx.fillText('press P to resume', W / 2, H / 2 + 12);
  ctx.textAlign = 'left';
}
