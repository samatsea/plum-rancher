// The single mutable game state, shared by every system.
import { TILE } from './config.js';

export const state = {
  started: false,
  shopOpen: false,
  paused: false,
  idle: false,
  coins: 0,
  plums: 0,
  day: 1,
  dayT: 0,
  upgrades: { fence: false, scarecrow: false, fertilizer: false, treats: false, sapling: false },
  trees: [],
  deer: [],
  particles: [],
  spawnT: 6,
  muted: false,
};

export const player = {
  x: 6 * TILE, y: 6 * TILE,
  dir: 1,            // 1 right, -1 left
  moving: false,
  animT: 0,
  barkCd: 0,
};

export function newTree(pos) {
  return { x: pos.x, y: pos.y, plums: 4, t: 0 };
}
