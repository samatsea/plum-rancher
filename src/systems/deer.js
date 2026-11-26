// Deer: wander in, eat plums, flee from Brontosaurus.
import { W, H, GATES } from '../core/config.js';
import { state, player } from '../core/state.js';
import { dist, clamp, rand } from '../core/util.js';
import { sfx } from '../core/audio.js';
import { toast, spawnParticle } from '../fx.js';
import { DEER_W, DEER_H, TREE_W, TREE_H } from '../sprites.js';

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

  const eatAngle = Math.random() * Math.PI * 2;
  const eat = {
    x: tree.x + TREE_W / 2 + Math.cos(eatAngle) * 16 - DEER_W / 2,
    y: tree.y + TREE_H - 10 + Math.sin(eatAngle) * 5 - DEER_H / 2,
  };

  const waypoints = [];
  if (state.upgrades.fence) {
    const g = GATES.reduce((a, b) =>
      dist(x, y, a.x, a.y) < dist(x, y, b.x, b.y) ? a : b);
    waypoints.push({ x: g.x - DEER_W / 2, y: g.y - DEER_H / 2 });
  }
  waypoints.push(eat);

  state.deer.push({
    x, y, tree, waypoints, wi: 0,
    state: 'approach', eatT: 0, ate: 0, animT: Math.random() * 10,
  });
}

export function startFlee(d) {
  d.state = 'flee';
  // run to nearest map edge
  const cx = d.x + 9, cy = d.y + 7;
  const exits = [
    { x: -30, y: cy }, { x: W + 30, y: cy },
    { x: cx, y: -30 }, { x: cx, y: H + 30 },
  ];
  d.fleeTo = exits.reduce((a, b) => dist(cx, cy, a.x, a.y) < dist(cx, cy, b.x, b.y) ? a : b);
  toast(d.x + 9, d.y - 8, '!', '#d97b6c');
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
  const pcx = player.x + 8, pcy = player.y + 6;

  for (const d of state.deer) {
    d.animT += dt;
    const cx = d.x + DEER_W / 2, cy = d.y + DEER_H / 2;

    // proximity scare (any state but flee)
    if (d.state !== 'flee' && dist(cx, cy, pcx, pcy) < 30) startFlee(d);

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
          type: 'bit', x: d.x + (d.x < d.tree.x + TREE_W / 2 ? DEER_W : 0), y: d.y + 4,
          vx: rand(-8, 8), vy: -20, life: 0.5, max: 0.5, color: '#8e3b76',
        });
        if (d.tree.plums <= 0) startFlee(d);
      }
    } else if (d.state === 'flee') {
      const dd = dist(d.x, d.y, d.fleeTo.x, d.fleeTo.y);
      const sp = 95;
      d.vx = (d.fleeTo.x - d.x) / dd * sp;
      d.x += d.vx * dt;
      d.y += (d.fleeTo.y - d.y) / dd * sp * dt;
    }
  }
  // remove deer that left the map
  state.deer = state.deer.filter(d =>
    !(d.state === 'flee' && (d.x < -25 || d.x > W + 25 || d.y < -25 || d.y > H + 25)));
}
