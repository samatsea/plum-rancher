// Boot, input wiring, main loop, debug API.
import { TREE_POS } from './core/config.js';
import { state, player, newTree } from './core/state.js';
import { save, load } from './core/save.js';
import { beep } from './core/audio.js';
import { initInput } from './core/input.js';
import { updateDay } from './core/clock.js';
import { toast, updateParticles } from './fx.js';
import { bark, interact, togglePause } from './actions.js';
import { toggleIdle } from './systems/autopilot.js';
import { updatePlayer } from './systems/player.js';
import { updateDeer, spawnDeer } from './systems/deer.js';
import { updateTrees } from './systems/trees.js';
import { toggleShop, renderShop, buyItem } from './ui/shop.js';
import { render } from './render.js';

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
  if (code === 'KeyM') { state.muted = !state.muted; toast(player.x, player.y - 14, state.muted ? 'muted' : 'sound on', '#f2e8c9'); }
  if (state.shopOpen && /^Digit[1-5]$/.test(code)) buyItem(Number(code.slice(5)) - 1);
});

document.getElementById('title').addEventListener('click', () => { if (!state.started) startGame(); });

function startGame() {
  state.started = true;
  document.getElementById('title').classList.add('hidden');
  if (!load()) state.trees = [newTree(TREE_POS[0])];
  beep(523, 0.08, 'triangle', 0.12); beep(784, 0.12, 'triangle', 0.12, 0.09);
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

// Expose a tiny debug API for testing
window.plumDebug = {
  state, player,
  give(coins) { state.coins += coins; if (state.shopOpen) renderShop(); },
  spawnDeer,
  step(seconds = 1) {           // advance simulation manually (for tests)
    const n = Math.round(seconds / STEP);
    for (let i = 0; i < n; i++) tick(STEP);
    render(ctx);
  },
};
if (import.meta.env.DEV) {
  import('./dev/selftest.js').then(m => { window.plumDebug.selftest = m.selftest; });
}
