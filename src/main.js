// Boot, input wiring, main loop, debug API.
import { TREE_POS, W, H } from './core/config.js';
import { state, player, newTree } from './core/state.js';
import { save, load, snapshotSave } from './core/save.js';
import { beep } from './core/audio.js';
import { initInput } from './core/input.js';
import { updateDay } from './core/clock.js';
import { toast, updateParticles } from './fx.js';
import { bark, interact, togglePause } from './actions.js';
import { toggleIdle } from './systems/autopilot.js';
import { updatePlayer } from './systems/player.js';
import { updateDeer, spawnDeer } from './systems/deer.js';
import { updateTrees } from './systems/trees.js';
import { toggleShop, renderShop, buyItem, grantUpgrade } from './ui/shop.js';
import { render } from './render.js';
import { playerBox, deerFeet, PLAYER_BOX } from './world/entities.js';
import { solids, overlaps } from './world/collision.js';
import { camera } from './world/camera.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ---------------- Input ---------------- */
initInput((code) => {
  if (!state.started) {
    if (code === 'Enter') startGame();
    return;
  }
  if (code === 'KeyP') { togglePause(); return; }
  if (state.paused) return;
  if (code === 'Space') bark();
  if (code === 'KeyE') interact();
  if (code === 'KeyI') toggleIdle();
  if (code === 'Escape' && state.shopOpen) toggleShop(false);
  if (code === 'KeyM') { state.muted = !state.muted; save(); toast(player.x, player.y - 14, state.muted ? 'muted' : 'sound on', '#f2e8c9'); }
  if (state.shopOpen && /^Digit[1-5]$/.test(code)) buyItem(Number(code.slice(5)) - 1);
});

document.getElementById('title').addEventListener('click', () => { if (!state.started) startGame(); });

function startGame() {
  state.started = true;
  document.getElementById('title').classList.add('hidden');
  if (!load(canStand)) state.trees = [newTree(TREE_POS[0])];
  beep(523, 0.08, 'triangle', 0.12); beep(784, 0.12, 'triangle', 0.12, 0.09);
}

// Could Bronto stand with his sprite's top-left at (x, y)?
function canStand(x, y) {
  const b = playerBox(x, y);
  return b.x >= 0 && b.y >= 0 && b.x + b.w <= W && b.y + b.h <= H &&
    !solids().some(s => overlaps(b, s));
}

/* ---------------- Main loop ---------------- */
// Fixed 1/60 s simulation step, decoupled from the display's frame rate, so
// real play behaves exactly like plumDebug.step() in tests.
const STEP = 1 / 60;
const MAX_FRAME = 0.25;   // after a long stall (tab hidden), don't fast-forward minutes
let last = performance.now();
let acc = 0;
let saveT = 0;
function tick(dt) {
  updatePlayer(dt);
  updateDeer(dt);
  updateTrees(dt);
  updateDay(dt);
  updateParticles(dt);
  saveT += dt;
  if (saveT > 5) { saveT = 0; save(); }
}
function frame(now) {
  acc += Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  if (state.started && !state.paused) {
    while (acc >= STEP) { tick(STEP); acc -= STEP; }
  } else {
    acc = 0;
  }
  render(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Debug API for testing from the browser console.
window.plumDebug = {
  state, player, camera, spawnDeer,
  // Advance the simulation by fixed steps (works while paused or hidden).
  step(seconds = 1) {
    const n = Math.round(seconds / STEP);
    for (let i = 0; i < n; i++) tick(STEP);
    render(ctx);
  },
  // Put Bronto's feet at (x, y).
  teleport(x, y) {
    player.x = x - PLAYER_BOX.x - PLAYER_BOX.w / 2;
    player.y = y - PLAYER_BOX.y - PLAYER_BOX.h / 2;
    render(ctx);
  },
  // give(50) or give('coins', 50) / give('plums', 6) / give('sapling').
  give(item, n = 1) {
    if (typeof item === 'number') { n = item; item = 'coins'; }
    if (item === 'coins') state.coins += n;
    else if (item === 'plums') state.plums += n;
    else if (!grantUpgrade(item)) return `unknown or already owned: ${item}`;
    if (state.shopOpen) renderShop();
    return this.snapshot();
  },
  // A compact, JSON-friendly picture of the game right now.
  snapshot() {
    const r = Math.round;
    return {
      ...snapshotSave(),
      player: { x: r(player.x), y: r(player.y), dir: player.dir },
      deer: state.deer.map(d => { const f = deerFeet(d); return { state: d.state, x: r(f.x), y: r(f.y) }; }),
      camera: { ...camera },
      idle: state.idle, paused: state.paused, shopOpen: state.shopOpen,
    };
  },
};
if (import.meta.env.DEV) {
  import('./dev/selftest.js').then(m => { window.plumDebug.selftest = m.selftest; });
}
