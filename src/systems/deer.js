// Deer: wander in, eat plums, flee from Brontosaurus.
// Deer walk along planned paths (through gates, around buildings) and
// collide with anything solid.
import { W, H } from '../core/config.js';
import { state } from '../core/state.js';
import { dist, clamp, rand } from '../core/util.js';
import { sfx } from '../core/audio.js';
import { toast, spawnParticle } from '../fx.js';
import { DEER_W } from '../sprites.js';
import { treeEntity, solidBox, playerFeet, deerFeet, deerBox, DEER_BOX } from '../world/entities.js';
import { slide } from '../world/collision.js';
import { findPath, pathOffMap } from '../world/nav.js';

const WALK_SPEED = 34;
const FLEE_SPEED = 95;

// Where a deer stands to eat (feet position): beside the trunk, facing it.
function eatSpot(tree, side) {
  const trunk = solidBox(treeEntity(tree));
  const gap = DEER_BOX.w / 2 + 2;
  return {
    x: side < 0 ? trunk.x - gap : trunk.x + trunk.w + gap,
    y: trunk.y + trunk.h / 2 + rand(-2, 2),
  };
}

// (Re)plan a deer's route for its current state. Returns false if there's no way.
export function replan(d) {
  const f = deerFeet(d);
  d.path = d.state === 'flee' ? pathOffMap(f.x, f.y) : findPath(f.x, f.y, d.eat.x, d.eat.y);
  d.pi = 0;
  d.stuckT = 0;
  return !!d.path;
}

export function spawnDeer() {
  const targets = state.trees.filter(t => t.plums > 0);
  if (!targets.length) return;
  const tree = targets[Math.floor(Math.random() * targets.length)];

  // spawn just off a random edge
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = -20; y = rand(30, H - 40); }
  else if (side === 1) { x = W + 4; y = rand(30, H - 40); }
  else if (side === 2) { x = rand(40, W - 60); y = -18; }
  else { x = rand(40, W - 60); y = H + 4; }

  const eatSide = x < tree.x ? -1 : 1;        // eat on the side we arrive from
  const d = {
    x, y, tree, eat: eatSpot(tree, eatSide), face: -eatSide,   // face the trunk while eating
    state: 'approach', eatT: 0, ate: 0, animT: Math.random() * 10,
  };
  if (replan(d)) state.deer.push(d);
}

export function startFlee(d) {
  d.state = 'flee';
  if (!replan(d)) {
    // boxed in somehow: bolt straight for the nearest edge
    const f = deerFeet(d);
    const exits = [{ x: -30, y: f.y }, { x: W + 30, y: f.y }, { x: f.x, y: -30 }, { x: f.x, y: H + 30 }];
    d.path = [exits.reduce((a, b) => dist(f.x, f.y, a.x, a.y) < dist(f.x, f.y, b.x, b.y) ? a : b)];
    d.pi = 0;
  }
  toast(d.x + DEER_W / 2, d.y - 8, '!', '#d97b6c');
}

// Step a deer along its path. Returns true once the path is finished.
function walk(d, speed, dt) {
  const f = deerFeet(d);
  let wp = d.path[d.pi];
  while (wp && dist(f.x, f.y, wp.x, wp.y) < 1.5) wp = d.path[++d.pi];
  if (!wp) { d.vx = 0; return true; }

  const dd = dist(f.x, f.y, wp.x, wp.y);
  const stepLen = Math.min(speed * dt, dd);
  const mx = (wp.x - f.x) / dd * stepLen, my = (wp.y - f.y) / dd * stepLen;
  const moved = slide(deerBox(d), mx, my);
  d.x += moved.dx; d.y += moved.dy;
  d.vx = (wp.x - f.x) / dd * speed;   // facing follows intent, not wall-sliding

  // Wedged against something for a moment? Plan a fresh route.
  d.stuckT = Math.hypot(moved.dx, moved.dy) < stepLen * 0.3 ? d.stuckT + dt : 0;
  if (d.stuckT > 0.6) replan(d);
  return false;
}

export function updateDeer(dt) {
  const spawnBase = clamp(16 - (state.day - 1) * 1.5, 5, 16);
  const interval = spawnBase * (state.upgrades.fence ? 1.7 : 1);
  const maxDeer = Math.min(2 + state.day, 7);

  state.spawnT -= dt;
  if (state.spawnT <= 0) {
    state.spawnT = interval * rand(0.75, 1.25);
    if (state.deer.length < maxDeer) spawnDeer();
  }

  const eatInterval = state.upgrades.scarecrow ? 5.5 : 2.6;
  const p = playerFeet();

  for (const d of state.deer) {
    d.animT += dt;
    const f = deerFeet(d);

    // proximity scare (any state but flee)
    if (d.state !== 'flee' && dist(f.x, f.y, p.x, p.y) < 30) startFlee(d);

    if (d.state === 'approach') {
      if (walk(d, WALK_SPEED, dt)) { d.state = 'eat'; d.eatT = eatInterval * 0.6; }
    } else if (d.state === 'eat') {
      d.vx = 0;
      if (d.tree.plums <= 0) { startFlee(d); continue; }
      d.eatT += dt;
      if (d.eatT >= eatInterval) {
        d.eatT = 0;
        d.tree.plums--;
        d.ate++;
        sfx.munch();
        spawnParticle({
          type: 'bit', x: d.face > 0 ? d.x + DEER_W : d.x, y: d.y + 4,   // at the mouth
          vx: rand(-8, 8), vy: -20, life: 0.5, max: 0.5, color: '#8e3b76',
        });
        if (d.tree.plums <= 0) startFlee(d);
      }
    } else if (d.state === 'flee') {
      walk(d, FLEE_SPEED, dt);
    }
  }
  // remove deer that made it off the map
  state.deer = state.deer.filter(d => {
    if (d.state !== 'flee') return true;
    const f = deerFeet(d);
    return !(f.x < -20 || f.x > W + 20 || f.y < -20 || f.y > H + 20);
  });
}
