// Deer: wander in, eat plums, flee from Brontosaurus.
import { W, H, GATES } from '../core/config.js';
import { state } from '../core/state.js';
import { dist, clamp, rand } from '../core/util.js';
import { sfx } from '../core/audio.js';
import { toast, spawnParticle } from '../fx.js';
import { DEER_W } from '../sprites.js';
import { treeEntity, solidBox, playerFeet, deerFeet, deerAtFeet, DEER_BOX } from '../world/entities.js';

// Where a deer stands to eat: beside the trunk, facing it.
function eatSpot(tree, side) {
  const trunk = solidBox(treeEntity(tree));
  const gap = DEER_BOX.w / 2 + 2;
  const fx = side < 0 ? trunk.x - gap : trunk.x + trunk.w + gap;
  const fy = trunk.y + trunk.h / 2 + rand(-2, 2);
  return deerAtFeet(fx, fy);
}

export function spawnDeer() {
  const targets = state.trees.filter(t => t.plums > 0);
  if (!targets.length) return;
  const tree = targets[Math.floor(Math.random() * targets.length)];

  // spawn on a random edge
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = -20; y = rand(30, H - 40); }
  else if (side === 1) { x = W + 4; y = rand(30, H - 40); }
  else if (side === 2) { x = rand(40, W - 60); y = -18; }
  else { x = rand(40, W - 60); y = H + 4; }

  const eatSide = x < tree.x ? -1 : 1;        // eat on the side we arrive from
  const eat = eatSpot(tree, eatSide);

  const waypoints = [];
  if (state.upgrades.fence) {
    const g = GATES.reduce((a, b) =>
      dist(x, y, a.x, a.y) < dist(x, y, b.x, b.y) ? a : b);
    waypoints.push(deerAtFeet(g.x, g.y));
  }
  waypoints.push(eat);

  state.deer.push({
    x, y, tree, waypoints, wi: 0, face: -eatSide,  // face the trunk while eating
    state: 'approach', eatT: 0, ate: 0, animT: Math.random() * 10,
  });
}

export function startFlee(d) {
  d.state = 'flee';
  // run to nearest map edge
  const f = deerFeet(d);
  const exits = [
    { x: -30, y: f.y }, { x: W + 30, y: f.y },
    { x: f.x, y: -30 }, { x: f.x, y: H + 30 },
  ];
  const exit = exits.reduce((a, b) => dist(f.x, f.y, a.x, a.y) < dist(f.x, f.y, b.x, b.y) ? a : b);
  d.fleeTo = deerAtFeet(exit.x, exit.y);
  toast(d.x + DEER_W / 2, d.y - 8, '!', '#d97b6c');
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
      const wp = d.waypoints[d.wi];
      const dd = dist(d.x, d.y, wp.x, wp.y);
      if (dd < 3) {
        if (d.wi < d.waypoints.length - 1) d.wi++;
        else { d.state = 'eat'; d.eatT = eatInterval * 0.6; }
      } else {
        const sp = 34;
        d.vx = (wp.x - d.x) / dd * sp;
        d.x += d.vx * dt;
        d.y += (wp.y - d.y) / dd * sp * dt;
      }
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
      const dd = dist(d.x, d.y, d.fleeTo.x, d.fleeTo.y);
      const sp = 95;
      if (dd > 1) {
        d.vx = (d.fleeTo.x - d.x) / dd * sp;
        d.x += d.vx * dt;
        d.y += (d.fleeTo.y - d.y) / dd * sp * dt;
      }
    }
  }
  // remove deer that left the map (flee exits are 30 px past the edge)
  state.deer = state.deer.filter(d => {
    if (d.state !== 'flee') return true;
    const f = deerFeet(d);
    return !(f.x < -20 || f.x > W + 20 || f.y < -20 || f.y > H + 20);
  });
}
