// Pixel text. Silkscreen (OFL-1.1, the SAMWERKS wordmark font) is drawn at
// multiples of 8px and snapped to whole pixels so every glyph stays crisp.
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/silkscreen/latin-700.css';

export function font(size = 8, bold = false) {
  return `${bold ? 700 : 400} ${size}px Silkscreen, monospace`;
}

// Start loading now so the first HUD frame doesn't flash a fallback font.
export const fontReady = document.fonts?.load(font(8)).catch(() => {}) ?? Promise.resolve();

export function textWidth(ctx, str, size = 8, bold = false) {
  ctx.font = font(size, bold);
  return ctx.measureText(str).width;
}

// Draw `str` with its baseline at y; capitals occupy the 5 rows above it at
// size 8 (10 at 16). align: 'left' | 'center' | 'right'.
export function text(ctx, str, x, y, { size = 8, bold = false, color = '#f2e8c9', align = 'left', shadow = null } = {}) {
  ctx.font = font(size, bold);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // Chrome: drops the soft fringe so glyphs are pure pixel blocks.
  // Firefox ignores it and draws with a faint fringe, still sharp.
  ctx.textRendering = 'geometricPrecision';
  let left = x;
  if (align !== 'left') {
    const w = ctx.measureText(str).width;
    left = align === 'center' ? x - w / 2 : x - w;
  }
  const lx = Math.round(left), ly = Math.round(y);
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(str, lx + 1, ly + 1); }
  ctx.fillStyle = color;
  ctx.fillText(str, lx, ly);
}
