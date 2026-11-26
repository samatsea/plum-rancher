// The camera: which part of the map is on screen. Follows Brontosaurus and
// stops at the map's edges (a map smaller than the screen is centered).
import { W, H, VIEW_W, VIEW_H } from '../core/config.js';

export const camera = { x: 0, y: 0 };

function axis(focus, view, size) {
  if (size <= view) return Math.round((size - view) / 2);
  return Math.round(Math.max(0, Math.min(size - view, focus - view / 2)));
}

export function followCamera(fx, fy) {
  camera.x = axis(fx, VIEW_W, W);
  camera.y = axis(fy, VIEW_H, H);
}
