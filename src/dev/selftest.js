// Dev-only smoke test: plumDebug.selftest() in the browser console.
// Drives every core verb through the deterministic step() API and returns
// PASS/FAIL per check. Never included in production builds.
import { solids, overlaps } from '../world/collision.js';
import { playerBox, deerBox } from '../world/entities.js';
import { replan } from '../systems/deer.js';

export function selftest() {
  const D = window.plumDebug, S = D.state, P = D.player;
  const press = (key) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key }));
  };
  const at = (cx, cy) => { P.x = cx - 8; P.y = cy - 8; };
  const out = {};
  const ok = (name, cond, extra) => { out[name] = cond ? 'PASS' : 'FAIL ' + JSON.stringify(extra ?? ''); };

  if (!S.started) document.getElementById('title').click();
  if (S.shopOpen) press('Escape');
  // reset to a known state
  S.coins = 0; S.plums = 0; S.day = 1; S.dayT = 0; S.deer.length = 0;
  S.idle = false; S.paused = false;
  Object.keys(S.upgrades).forEach(k => { S.upgrades[k] = false; });
  S.trees.length = 1; S.trees[0].plums = 4; S.trees[0].t = 0;
  S.spawnT = 999;
  ok('started', S.started);

  const t = S.trees[0];
  at(t.x + 28, t.y + 70); press('e');
  ok('harvest', S.plums === 4 && t.plums === 0, { plums: S.plums, tree: t.plums });

  at(94, 226); press('e');
  ok('sell', S.coins === 20 && S.plums === 0, { coins: S.coins });

  at(43, 172); press('e');
  ok('shopOpens', S.shopOpen);
  D.give(500); press('1'); press('2'); press('5'); press('Escape');
  ok('buy', S.upgrades.fence && S.upgrades.scarecrow && S.upgrades.sapling && S.trees.length === 2 && !S.shopOpen,
    { up: S.upgrades, trees: S.trees.length });
  S.spawnT = 999;

  // --- Collision: the fence and doghouse block Bronto ---
  const hold = (key, secs) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    D.step(secs);
    window.dispatchEvent(new KeyboardEvent('keyup', { key }));
  };
  const fenceLeft = 8 * 16 + 5;                  // left fence rail box starts here
  at(fenceLeft - 30, 100); hold('ArrowRight', 1.5);
  ok('fenceBlocks', playerBox().x + playerBox().w <= fenceLeft + 0.01, { right: playerBox().x + playerBox().w, fenceLeft });
  const houseBottom = 2 * 16 + 18 + 16;          // HOUSE.y + solid.y + solid.h
  at(52, houseBottom + 20); hold('ArrowUp', 1.5);
  ok('houseBlocks', playerBox().y >= houseBottom - 0.01, { top: playerBox().y, houseBottom });
  at(fenceLeft - 30, 9 * 16 + 8); hold('ArrowRight', 1.5);   // through the left gate
  ok('gateOpen', playerBox().x > fenceLeft + 6, { x: playerBox().x });

  // --- A deer from the far right routes in through a gate, never clipping a solid ---
  S.trees[0].plums = 6; S.trees[1].plums = 0;
  at(40, 250);
  D.spawnDeer();
  const g = S.deer[S.deer.length - 1];
  g.x = 480 + 4; g.y = 60; g.state = 'approach'; replan(g);
  let clipped = 0, ateBy = null;
  for (let k = 0; k < 120 && g.state === 'approach'; k++) {
    D.step(0.25);
    if (solids().some(s => overlaps(deerBox(g), s))) clipped++;
  }
  ok('deerRoutesIn', g.state === 'eat' && clipped === 0, { st: g.state, clipped, at: [Math.round(g.x), Math.round(g.y)] });
  S.deer.length = 0;

  at(240, 200);
  D.spawnDeer();
  const d = S.deer[S.deer.length - 1];
  d.x = 240 + 40 - 9; d.y = 200 - 15; d.state = 'approach';
  press(' ');
  ok('bark', d.state === 'flee', { st: d.state });
  D.step(6);
  ok('deerLeave', S.deer.length === 0, { n: S.deer.length });

  // A deer walks in (via a gate, fence is owned now), eats beside the trunk, facing it.
  at(40, 250);
  S.trees[0].plums = 6; S.trees[1].plums = 0;      // only tree 0 is a target
  const before = S.trees[0].plums;
  D.spawnDeer();
  const e = S.deer[S.deer.length - 1];
  D.step(30);
  const trunkMid = S.trees[0].x + 28.5, feetX = e.x + 9;
  ok('deerEats', e.state === 'eat' || S.trees[0].plums < before, { st: e.state, plums: S.trees[0].plums });
  ok('deerFacesTree', e.state !== 'eat' || (feetX < trunkMid) === (e.face > 0),
    { feetX: Math.round(feetX), trunkMid, face: e.face });
  S.deer.length = 0;

  S.trees.forEach(tr => { tr.plums = 6; }); S.plums = 0;
  const c0 = S.coins;
  at(60, 60); S.idle = true; S.spawnT = 999;
  let pClip = 0;
  const run = (secs) => {
    for (let k = 0; k < secs * 4; k++) {
      D.step(0.25);
      if (solids().some(s => overlaps(playerBox(), s))) pClip++;
    }
  };
  run(40);
  ok('autoHarvestSell', S.coins >= c0 + 60,
    { gained: S.coins - c0, carrying: S.plums, trees: S.trees.map(x => x.plums), at: [Math.round(P.x), Math.round(P.y)] });

  // One deer, spawner frozen (otherwise a fresh deer can arrive mid-check).
  S.spawnT = 999;
  S.trees.forEach(tr => { tr.plums = 3; });
  D.spawnDeer();
  const intruder = S.deer[S.deer.length - 1];
  run(20);
  ok('autoDefends', !S.deer.includes(intruder) || intruder.state === 'flee',
    { st: intruder?.state, at: intruder && [Math.round(intruder.x), Math.round(intruder.y)], dog: [Math.round(P.x), Math.round(P.y)] });
  ok('autoNeverClips', pClip === 0, { pClip });
  S.idle = false;

  press('p'); const pz = S.paused; press('p');
  ok('pause', pz && !S.paused);

  out.summary = Object.values(out).every(v => v === 'PASS') ? 'ALL PASS' : 'SOME FAILED';
  return out;
}
