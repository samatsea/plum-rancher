// Dev-only smoke test: plumDebug.selftest() in the browser console.
// Drives every core verb through the deterministic step() API and returns
// PASS/FAIL per check. Never included in production builds.

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

  at(240, 200);
  D.spawnDeer();
  const d = S.deer[S.deer.length - 1];
  d.x = 240 + 40 - 9; d.y = 200 - 15; d.state = 'approach';
  press(' ');
  ok('bark', d.state === 'flee', { st: d.state });
  D.step(6);
  ok('deerLeave', S.deer.length === 0, { n: S.deer.length });

  S.trees.forEach(tr => { tr.plums = 6; }); S.plums = 0;
  const c0 = S.coins;
  at(60, 60); S.idle = true; S.spawnT = 999;
  D.step(40);
  ok('autoHarvestSell', S.coins >= c0 + 60,
    { gained: S.coins - c0, carrying: S.plums, trees: S.trees.map(x => x.plums), at: [Math.round(P.x), Math.round(P.y)] });

  S.spawnT = 0.01; D.step(0.1);
  const n = S.deer.length;
  D.step(20);
  ok('autoDefends', S.deer.filter(x => x.state !== 'flee').length === 0, { spawned: n, left: S.deer.map(x => x.state) });
  S.idle = false;

  press('p'); const pz = S.paused; press('p');
  ok('pause', pz && !S.paused);

  out.summary = Object.values(out).every(v => v === 'PASS') ? 'ALL PASS' : 'SOME FAILED';
  return out;
}
