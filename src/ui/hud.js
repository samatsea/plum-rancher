// Heads-up display and pause overlay (canvas, screen space).
import { VIEW_W as W, VIEW_H as H, DAY_LEN } from '../core/config.js';   // screen size
import { state } from '../core/state.js';
import { drawPlum } from '../sprites.js';
import { text, textWidth } from './font.js';

const PANEL = 'rgba(20, 28, 12, 0.72)';
const INK = '#f2e8c9';
const HUD_W = 124;          // fits a 5-digit coin count and "DAY 100"

export function drawHUD(ctx) {
  // coins · plums · day — text baseline 14 puts capitals on rows 9-13
  ctx.fillStyle = PANEL;
  ctx.fillRect(4, 4, HUD_W, 14);
  ctx.fillStyle = '#ffd76b'; ctx.fillRect(9, 8, 6, 6);
  ctx.fillStyle = '#b8922e'; ctx.fillRect(11, 10, 2, 2);
  text(ctx, String(state.coins), 18, 14);
  drawPlum(ctx, 52, 10);
  text(ctx, String(state.plums), 58, 14);
  text(ctx, 'DAY ' + state.day, 80, 14);

  // day progress bar
  ctx.fillStyle = PANEL;
  ctx.fillRect(4, 20, HUD_W, 4);
  ctx.fillStyle = '#ffd76b';
  ctx.fillRect(5, 21, (HUD_W - 2) * (state.dayT / DAY_LEN), 2);

  // auto-mode badge
  if (state.idle) {
    const label = '• AUTO';
    const w = Math.ceil(textWidth(ctx, label)) + 9;
    ctx.fillStyle = PANEL;
    ctx.fillRect(W - 4 - w, 4, w, 14);
    text(ctx, label, W - 8, 14, { color: '#8fce6e', align: 'right' });
  }

  // controls hint
  text(ctx, 'WASD move · SPACE bark · E use · P pause · I auto · M mute', 6, H - 4,
    { color: 'rgba(242,232,201,0.6)' });
}

export function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(15, 20, 10, 0.62)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSED', W / 2, H / 2 + 2, { size: 16, bold: true, align: 'center', color: INK });
  text(ctx, 'press P to resume', W / 2, H / 2 + 18, { align: 'center', color: 'rgba(242,232,201,0.8)' });
}
