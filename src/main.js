import {
  dogFrames, DOG_W, DOG_H,
  deerFrames, DEER_W, DEER_H,
  treeSprite, TREE_W, TREE_H, PLUM_SLOTS, drawPlum,
  houseSprite, stallSprite, vendingSprite, scarecrowSprite,
  makeBackground, drawFencePost, drawFenceRailH, drawFenceRailV,
} from './sprites.js';

/* ---------------- Constants ---------------- */
const TILE = 16;
const MAPW = 30, MAPH = 17;
const W = MAPW * TILE;          // 480 native px
const H = MAPH * TILE;          // 272 native px
const SCALE = 2;
const DAY_LEN = 75;             // seconds per day
const MAX_PLUMS = 6;
const PLUM_PRICE = 5;
const SAVE_KEY = 'plumRancherSaveV1';

// Fence rectangle (tile coords) around the orchard, with two gate openings.
const FENCE = { x1: 8, y1: 3, x2: 26, y2: 15 };
const GATES = [
  { tx: 17, ty: FENCE.y2, x: 17 * TILE + 8, y: FENCE.y2 * TILE + 8 },   // bottom gate
  { tx: FENCE.x1, ty: 9, x: FENCE.x1 * TILE + 8, y: 9 * TILE + 8 },     // left gate
];

const SHOP_ITEMS = [
  { key: 'fence', name: 'Orchard Fence', price: 40,
    desc: 'A proper fence. Deer show up far less often.' },
  { key: 'scarecrow', name: 'Scarecrow', price: 60,
    desc: 'Spooky pumpkin fellow. Deer eat much more slowly.' },
  { key: 'fertilizer', name: 'Fertilizer', price: 90,
    desc: 'Rich compost. Plums ripen noticeably faster.' },
  { key: 'treats', name: 'Speedy Treats', price: 120,
    desc: 'Performance snacks. Brontosaurus runs 35% faster.' },
  { key: 'sapling', name: 'Plum Sapling', price: 160,
    desc: 'A second plum tree for the orchard.' },
];

/* ---------------- State ---------------- */
const state = {
  started: false,
  shopOpen: false,
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

const player = {
  x: 6 * TILE, y: 6 * TILE,
  dir: 1,            // 1 right, -1 left
  moving: false,
  animT: 0,
  barkCd: 0,
};

const TREE_POS = [
  { x: 15 * TILE, y: 6 * TILE },
  { x: 21 * TILE, y: 10 * TILE },  // sapling position
];
const HOUSE = { x: 2 * TILE, y: 2 * TILE };
const BIN = { x: 5 * TILE, y: 12 * TILE };
const STAND = { x: 2 * TILE, y: 8 * TILE };
const SCARECROW = { x: 18 * TILE, y: 5 * TILE };

function newTree(pos) {
  return { x: pos.x, y: pos.y, plums: 4, t: 0 };
}

/* ---------------- Save / load ---------------- */
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      coins: state.coins, plums: state.plums, day: state.day,
      upgrades: state.upgrades,
      trees: state.trees.map(t => ({ plums: t.plums })),
    }));
  } catch { /* private mode etc. */ }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    state.coins = s.coins ?? 0;
    state.plums = s.plums ?? 0;
    state.day = s.day ?? 1;
    Object.assign(state.upgrades, s.upgrades ?? {});
    state.trees = [newTree(TREE_POS[0])];
    if (state.upgrades.sapling) state.trees.push(newTree(TREE_POS[1]));
    (s.trees ?? []).forEach((t, i) => { if (state.trees[i]) state.trees[i].plums = t.plums ?? 3; });
    return true;
  } catch { return false; }
}

/* ---------------- Audio (tiny synth) ---------------- */
let actx = null;
function beep(freq, dur = 0.08, type = 'square', vol = 0.12, delay = 0) {
  if (state.muted) return;
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + delay;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur);
  } catch { /* no audio */ }
}
const sfx = {
  bark() { beep(220, 0.07, 'square', 0.18); beep(150, 0.09, 'square', 0.18, 0.07); },
  harvest() { beep(660, 0.06, 'triangle', 0.15); beep(880, 0.08, 'triangle', 0.15, 0.06); },
  sell() { beep(523, 0.07, 'triangle', 0.15); beep(659, 0.07, 'triangle', 0.15, 0.07); beep(784, 0.1, 'triangle', 0.15, 0.14); },
  buy() { beep(784, 0.08, 'triangle', 0.15); beep(1046, 0.12, 'triangle', 0.15, 0.08); },
  denied() { beep(160, 0.12, 'sawtooth', 0.1); },
  munch() { beep(110, 0.05, 'sawtooth', 0.06); },
};

/* ---------------- Input ---------------- */
const keys = {};
// Normalize to KeyboardEvent.code style; some environments only supply e.key.
function keyId(e) {
  if (e.code) return e.code;
  const k = e.key;
  if (k === ' ') return 'Space';
  if (k.length === 1 && /[a-z]/i.test(k)) return 'Key' + k.toUpperCase();
  if (/^[0-9]$/.test(k)) return 'Digit' + k;
  return k; // 'ArrowLeft', 'Enter', 'Escape', ...
}
window.addEventListener('keydown', (e) => {
  const code = keyId(e);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
  if (keys[code]) return;
  keys[code] = true;

  if (!state.started) {
    if (code === 'Enter') startGame();
    return;
  }
  if (code === 'Space') bark();
  if (code === 'KeyE') interact();
  if (code === 'Escape' && state.shopOpen) toggleShop(false);
  if (code === 'KeyM') { state.muted = !state.muted; toast(player.x, player.y - 14, state.muted ? 'muted' : 'sound on', '#f2e8c9'); }
  if (state.shopOpen && /^Digit[1-5]$/.test(code)) buyItem(Number(code.slice(5)) - 1);
});
window.addEventListener('keyup', (e) => { keys[keyId(e)] = false; });

document.getElementById('title').addEventListener('click', () => { if (!state.started) startGame(); });

function startGame() {
  state.started = true;
  document.getElementById('title').classList.add('hidden');
  if (!load()) state.trees = [newTree(TREE_POS[0])];
  beep(523, 0.08, 'triangle', 0.12); beep(784, 0.12, 'triangle', 0.12, 0.09);
}

/* ---------------- Actions ---------------- */
function bark() {
  if (player.barkCd > 0 || state.shopOpen) return;
  player.barkCd = 1.0;
  sfx.bark();
  state.particles.push({ type: 'ring', x: player.x + 8, y: player.y + 6, r: 6, life: 0.4, max: 0.4 });
  toast(player.x + 8, player.y - 10, 'WOOF!', '#ffd76b');
  for (const d of state.deer) {
    if (dist(d.x + 9, d.y + 7, player.x + 8, player.y + 6) < 85 && d.state !== 'flee') {
      startFlee(d);
    }
  }
}

function interact() {
  if (state.shopOpen) { toggleShop(false); return; }
  const px = player.x + 8, py = player.y + 6;

  // harvest nearest tree with plums
  for (const t of state.trees) {
    if (dist(px, py, t.x + TREE_W / 2, t.y + TREE_H - 6) < 30 && t.plums > 0) {
      state.plums += t.plums;
      toast(t.x + TREE_W / 2, t.y + 10, `+${t.plums} plums`, '#d989c8');
      t.plums = 0; t.t = 0;
      sfx.harvest(); save();
      return;
    }
  }
  // sell bin
  if (dist(px, py, BIN.x + 14, BIN.y + 18) < 30) {
    if (state.plums > 0) {
      const earned = state.plums * PLUM_PRICE;
      state.coins += earned;
      toast(BIN.x + 14, BIN.y - 6, `+${earned}g`, '#ffd76b');
      state.plums = 0;
      sfx.sell(); save();
    } else {
      toast(BIN.x + 14, BIN.y - 6, 'no plums!', '#d97b6c');
      sfx.denied();
    }
    return;
  }
  // shop vending machine
  if (dist(px, py, STAND.x + 11, STAND.y + 26) < 30) {
    toggleShop(true);
  }
}

function toggleShop(open) {
  state.shopOpen = open;
  document.getElementById('shop').classList.toggle('hidden', !open);
  if (open) renderShop();
}

function renderShop() {
  const el = document.getElementById('shop');
  el.innerHTML = `<h2>RANCH SUPPLY</h2>
    <div class="hint">press a number to buy · E or ESC to close · you have <b style="color:#ffd76b">${state.coins}g</b></div>` +
    SHOP_ITEMS.map((it, i) => {
      const owned = state.upgrades[it.key];
      const cant = !owned && state.coins < it.price;
      return `<div class="shop-item ${owned ? 'owned' : cant ? 'cant' : ''}">
        <div class="num">${i + 1}</div>
        <div class="info"><div class="name">${it.name}</div><div class="desc">${it.desc}</div></div>
        <div class="price">${owned ? 'OWNED' : it.price + 'g'}</div>
      </div>`;
    }).join('');
}

function buyItem(i) {
  const it = SHOP_ITEMS[i];
  if (!it || state.upgrades[it.key]) { sfx.denied(); return; }
  if (state.coins < it.price) { sfx.denied(); return; }
  state.coins -= it.price;
  state.upgrades[it.key] = true;
  if (it.key === 'sapling') state.trees.push(newTree(TREE_POS[1]));
  sfx.buy(); save(); renderShop();
  toast(player.x + 8, player.y - 12, it.name + '!', '#8fce6e');
}

/* ---------------- Deer AI ---------------- */
function spawnDeer() {
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

function startFlee(d) {
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

function updateDeer(dt) {
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
        state.particles.push({
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

/* ---------------- Player ---------------- */
function updatePlayer(dt) {
  if (state.shopOpen) { player.moving = false; return; }
  let dx = 0, dy = 0;
  if (keys.KeyA || keys.ArrowLeft) dx -= 1;
  if (keys.KeyD || keys.ArrowRight) dx += 1;
  if (keys.KeyW || keys.ArrowUp) dy -= 1;
  if (keys.KeyS || keys.ArrowDown) dy += 1;
  player.moving = !!(dx || dy);
  if (player.moving) {
    const sp = 72 * (state.upgrades.treats ? 1.35 : 1);
    const n = Math.hypot(dx, dy);
    player.x += dx / n * sp * dt;
    player.y += dy / n * sp * dt;
    if (dx) player.dir = dx > 0 ? 1 : -1;
    player.animT += dt;

    // keep inside map
    player.x = clamp(player.x, 2, W - DOG_W - 2);
    player.y = clamp(player.y, 2, H - DOG_H - 2);

    // soft tree-trunk collision
    for (const t of state.trees) {
      const tx = t.x + TREE_W / 2, ty = t.y + TREE_H - 5;
      const px = player.x + 8, py = player.y + 8;
      const d = dist(px, py, tx, ty);
      if (d < 11 && d > 0.01) {
        player.x += (px - tx) / d * (11 - d);
        player.y += (py - ty) / d * (11 - d);
      }
    }
  }
  player.barkCd = Math.max(0, player.barkCd - dt);
}

/* ---------------- World ---------------- */
function updateWorld(dt) {
  // plum growth
  const growTime = state.upgrades.fertilizer ? 7 : 11;
  for (const t of state.trees) {
    if (t.plums < MAX_PLUMS) {
      t.t += dt;
      if (t.t >= growTime) {
        t.t = 0; t.plums++;
        state.particles.push({ type: 'bit', x: t.x + TREE_W / 2, y: t.y + 12, vx: 0, vy: -10, life: 0.6, max: 0.6, color: '#d9b2d0' });
      }
    }
  }
  // day cycle
  state.dayT += dt;
  if (state.dayT >= DAY_LEN) {
    state.dayT = 0;
    state.day++;
    toast(W / 2, 40, `DAY ${state.day}`, '#f2e8c9');
    save();
  }
  // particles
  for (const p of state.particles) {
    p.life -= dt;
    if (p.type === 'bit') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; }
    if (p.type === 'ring') p.r += 140 * dt;
    if (p.type === 'text') p.y -= 14 * dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);
}

/* ---------------- Rendering ---------------- */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const bg = makeBackground(W, H, TILE);

function drawFence(g) {
  if (!state.upgrades.fence) return;
  const { x1, y1, x2, y2 } = FENCE;
  const isGate = (tx, ty) => GATES.some(gt => Math.abs(gt.tx - tx) <= 1 && gt.ty === ty);
  for (let tx = x1; tx <= x2; tx++) {
    for (const ty of [y1, y2]) {
      if (isGate(tx, ty)) continue;
      drawFenceRailH(g, tx * TILE, ty * TILE + 6);
      if (tx % 2 === 0) drawFencePost(g, tx * TILE, ty * TILE + 6);
    }
  }
  for (let ty = y1 + 1; ty < y2; ty++) {
    for (const tx of [x1, x2]) {
      if (isGate(tx, ty)) continue;
      drawFenceRailV(g, tx * TILE, ty * TILE);
      if (ty % 2 === 0) drawFencePost(g, tx * TILE, ty * TILE + 8);
    }
  }
}

function shadow(g, x, y, w) {
  g.fillStyle = 'rgba(20,40,15,0.3)';
  g.beginPath();
  g.ellipse(x, y, w, w * 0.35, 0, 0, Math.PI * 2);
  g.fill();
}

function toast(x, y, text, color) {
  state.particles.push({ type: 'text', x, y, text, color, life: 1.1, max: 1.1 });
}

function nearestPrompt() {
  // Which interactable is close enough for [E]?
  const px = player.x + 8, py = player.y + 6;
  for (const t of state.trees) {
    if (t.plums > 0 && dist(px, py, t.x + TREE_W / 2, t.y + TREE_H - 6) < 30)
      return { x: t.x + TREE_W / 2, y: t.y - 4, label: 'E' };
  }
  if (dist(px, py, BIN.x + 14, BIN.y + 18) < 30) return { x: BIN.x + 14, y: BIN.y - 4, label: 'E' };
  if (dist(px, py, STAND.x + 11, STAND.y + 26) < 30) return { x: STAND.x + 11, y: STAND.y - 4, label: 'E' };
  return null;
}

function render() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bg, 0, 0);
  drawFence(ctx);

  // collect y-sorted drawables
  const draws = [];
  draws.push({ y: HOUSE.y + 34, f: () => ctx.drawImage(houseSprite, HOUSE.x, HOUSE.y) });
  draws.push({ y: BIN.y + 26, f: () => ctx.drawImage(stallSprite, BIN.x, BIN.y) });
  draws.push({ y: STAND.y + 34, f: () => ctx.drawImage(vendingSprite, STAND.x, STAND.y) });
  if (state.upgrades.scarecrow)
    draws.push({ y: SCARECROW.y + 24, f: () => ctx.drawImage(scarecrowSprite, SCARECROW.x, SCARECROW.y) });

  for (const t of state.trees) {
    draws.push({
      y: t.y + TREE_H, f: () => {
        shadow(ctx, t.x + TREE_W / 2, t.y + TREE_H - 2, 14);
        ctx.drawImage(treeSprite, t.x, t.y);
        for (let i = 0; i < t.plums; i++) {
          const [sx, sy] = PLUM_SLOTS[i];
          drawPlum(ctx, t.x + sx, t.y + sy);
        }
      }
    });
  }

  for (const d of state.deer) {
    draws.push({
      y: d.y + DEER_H, f: () => {
        shadow(ctx, d.x + DEER_W / 2, d.y + DEER_H, 8);
        const frame = deerFrames[(d.state === 'eat') ? 0 : Math.floor(d.animT * 7) % 2];
        const flip = (d.vx ?? 0) > 0.5; // sprite faces left by default
        ctx.save();
        if (flip) { ctx.translate(d.x + DEER_W, d.y); ctx.scale(-1, 1); }
        else ctx.translate(d.x, d.y);
        ctx.drawImage(frame, 0, 0);
        if (d.ate > 0 && d.state === 'flee') drawPlum(ctx, flip ? 0 : 0, 2);
        ctx.restore();
      }
    });
  }

  draws.push({
    y: player.y + DOG_H, f: () => {
      shadow(ctx, player.x + 8, player.y + DOG_H, 7);
      const frame = dogFrames[player.moving ? Math.floor(player.animT * 9) % 2 : 0];
      ctx.save();
      if (player.dir < 0) { ctx.translate(player.x + DOG_W, player.y); ctx.scale(-1, 1); }
      else ctx.translate(player.x, player.y);
      ctx.drawImage(frame, 0, 0);
      ctx.restore();
    }
  });

  draws.sort((a, b) => a.y - b.y);
  for (const d of draws) d.f();

  // particles
  for (const p of state.particles) {
    const a = clamp(p.life / p.max, 0, 1);
    if (p.type === 'ring') {
      ctx.strokeStyle = `rgba(255,215,107,${a * 0.8})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === 'bit') {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.fillRect(p.x, p.y, 2, 2);
      ctx.globalAlpha = 1;
    } else if (p.type === 'text') {
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = a;
      ctx.fillStyle = '#1d1408';
      ctx.fillText(p.text, p.x + 1, p.y + 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }
  }

  // [E] prompt
  if (state.started && !state.shopOpen) {
    const pr = nearestPrompt();
    if (pr) {
      ctx.fillStyle = 'rgba(20,20,10,0.75)';
      ctx.fillRect(pr.x - 5, pr.y - 7, 10, 9);
      ctx.fillStyle = '#ffd76b';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('E', pr.x, pr.y);
    }
  }

  // dusk/dawn tint
  const tod = state.dayT / DAY_LEN;
  let tint = 0;
  if (tod > 0.8) tint = (tod - 0.8) / 0.2 * 0.28;
  if (tod < 0.08) tint = (0.08 - tod) / 0.08 * 0.28;
  if (tint > 0) {
    ctx.fillStyle = `rgba(30, 25, 70, ${tint})`;
    ctx.fillRect(0, 0, W, H);
  }

  // HUD
  if (state.started) drawHUD();
}

function drawHUD() {
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'left';
  // panel
  ctx.fillStyle = 'rgba(20, 28, 12, 0.72)';
  ctx.fillRect(4, 4, 118, 14);
  // coin
  ctx.fillStyle = '#ffd76b'; ctx.fillRect(9, 8, 6, 6);
  ctx.fillStyle = '#b8922e'; ctx.fillRect(11, 10, 2, 2);
  ctx.fillStyle = '#f2e8c9'; ctx.fillText(String(state.coins), 19, 14);
  // plum
  drawPlum(ctx, 52, 8);
  ctx.fillText(String(state.plums), 60, 14);
  // day
  ctx.fillText('DAY ' + state.day, 86, 14);
  // day progress bar
  ctx.fillStyle = 'rgba(20, 28, 12, 0.72)';
  ctx.fillRect(4, 20, 118, 4);
  ctx.fillStyle = '#ffd76b';
  ctx.fillRect(5, 21, 116 * (state.dayT / DAY_LEN), 2);
  // controls hint
  ctx.fillStyle = 'rgba(242,232,201,0.55)';
  ctx.font = '7px monospace';
  ctx.fillText('WASD move · SPACE bark · E use · M mute', 6, H - 5);
}

/* ---------------- Helpers ---------------- */
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }

/* ---------------- Main loop ---------------- */
let last = performance.now();
let saveT = 0;
function tick(dt) {
  updatePlayer(dt);
  updateDeer(dt);
  updateWorld(dt);
  saveT += dt;
  if (saveT > 5) { saveT = 0; save(); }
}
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (state.started) tick(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose a tiny debug API for testing
window.plumDebug = {
  state, player,
  give(coins) { state.coins += coins; if (state.shopOpen) renderShop(); },
  spawnDeer,
  step(seconds = 1) {           // advance simulation manually (for tests)
    const n = Math.round(seconds * 60);
    for (let i = 0; i < n; i++) tick(1 / 60);
    render();
  },
};
