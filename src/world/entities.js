// Everything placed in the world, as data. Interaction, autopilot, collision
// and rendering all read from here instead of hard-coding positions.
//
// Entity fields (boxes and spots are relative to the sprite's top-left x,y):
//   sprite     canvas to draw            sortY   depth-sort line (relative y)
//   solid      {x,y,w,h} footprint that blocks movement, or null
//   use        {x,y,r} stand within r of this spot to press E, or null
//   approach   {x,y} where an AI walks to in order to use it
//   prompt()   whether the [E] hint shows        interact()  the E action

import { HOUSE, BIN, STAND, SCARECROW } from '../core/config.js';
import { state, player } from '../core/state.js';
import { dist } from '../core/util.js';
import { sfx } from '../core/audio.js';
import { toast } from '../fx.js';
import { sellPlums } from '../systems/economy.js';
import { harvestTree } from '../systems/trees.js';
import { toggleShop } from '../ui/shop.js';
import { houseSprite, stallSprite, vendingSprite, scarecrowSprite, treeSprite, TREE_H } from '../sprites.js';

/* ---------------- Bodies (feet footprints) ---------------- */
export const PLAYER_BOX = { x: 2, y: 7, w: 12, h: 5 };
export const DEER_BOX = { x: 2, y: 13, w: 14, h: 4 };

export function playerBox(px = player.x, py = player.y) {
  return { x: px + PLAYER_BOX.x, y: py + PLAYER_BOX.y, w: PLAYER_BOX.w, h: PLAYER_BOX.h };
}
export function playerFeet() {
  return { x: player.x + PLAYER_BOX.x + PLAYER_BOX.w / 2, y: player.y + PLAYER_BOX.y + PLAYER_BOX.h / 2 };
}
export function deerBox(d, dx = d.x, dy = d.y) {
  return { x: dx + DEER_BOX.x, y: dy + DEER_BOX.y, w: DEER_BOX.w, h: DEER_BOX.h };
}
export function deerFeet(d) {
  return { x: d.x + DEER_BOX.x + DEER_BOX.w / 2, y: d.y + DEER_BOX.y + DEER_BOX.h / 2 };
}
// Top-left sprite position that puts a deer's feet at (fx, fy).
export function deerAtFeet(fx, fy) {
  return { x: fx - DEER_BOX.x - DEER_BOX.w / 2, y: fy - DEER_BOX.y - DEER_BOX.h / 2 };
}

/* ---------------- Static entities ---------------- */
const STATIC = [
  {
    id: 'house', x: HOUSE.x, y: HOUSE.y, sprite: houseSprite, sortY: 34,
    solid: { x: 3, y: 18, w: 34, h: 16 },
  },
  {
    id: 'stall', x: BIN.x, y: BIN.y, sprite: stallSprite, sortY: 26,
    solid: { x: 2, y: 15, w: 24, h: 9 },
    use: { x: 14, y: 26, r: 24 }, approach: { x: 14, y: 32 },
    interact() {
      if (!sellPlums()) { toast(BIN.x + 14, BIN.y - 6, 'no plums!', '#d97b6c'); sfx.denied(); }
    },
  },
  {
    id: 'vending', x: STAND.x, y: STAND.y, sprite: vendingSprite, sortY: 34,
    solid: { x: 1, y: 24, w: 20, h: 10 },
    use: { x: 11, y: 34, r: 24 }, approach: { x: 11, y: 41 },
    interact() { toggleShop(true); },
  },
  {
    id: 'scarecrow', x: SCARECROW.x, y: SCARECROW.y, sprite: scarecrowSprite, sortY: 24,
    solid: { x: 5, y: 20, w: 6, h: 4 },
    active: () => state.upgrades.scarecrow,
  },
];

/* ---------------- Trees (one entity per tree in state) ---------------- */
const TREE_PROTO = {
  sprite: treeSprite, sortY: TREE_H,
  solid: { x: 21, y: 54, w: 15, h: 9 },          // trunk + roots
  use: { x: 28, y: 62, r: 26 }, approach: { x: 28, y: 70 },
};
const treeEntities = new WeakMap();
export function treeEntity(t) {
  let e = treeEntities.get(t);
  if (!e) {
    e = Object.assign(Object.create(TREE_PROTO), {
      id: 'tree', tree: t, x: t.x, y: t.y,
      prompt: () => t.plums > 0,
      interact: () => harvestTree(t),
    });
    treeEntities.set(t, e);
  }
  return e;
}

/* ---------------- Queries ---------------- */
export function entities() {
  const list = STATIC.filter(e => !e.active || e.active());
  for (const t of state.trees) list.push(treeEntity(t));
  return list;
}
export function entity(id) {
  return STATIC.find(e => e.id === id);
}

export function solidBox(e) {
  const s = e.solid;
  return { x: e.x + s.x, y: e.y + s.y, w: s.w, h: s.h };
}
export function useSpot(e) {
  return { x: e.x + e.use.x, y: e.y + e.use.y, r: e.use.r };
}
export function approachSpot(e) {
  return { x: e.x + e.approach.x, y: e.y + e.approach.y };
}
export function canUse(e) {
  return !!e.use && (!e.prompt || e.prompt());
}

// The usable entity nearest to (x, y) whose use spot is within reach, or null.
export function nearestUsable(x, y) {
  let best = null, bd = Infinity;
  for (const e of entities()) {
    if (!canUse(e)) continue;
    const u = useSpot(e);
    const d = dist(x, y, u.x, u.y);
    if (d < u.r && d < bd) { bd = d; best = e; }
  }
  return best;
}
