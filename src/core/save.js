// Save / load (localStorage). Saves carry a version number; older saves are
// migrated forward on load, so progress survives format changes.
import { TREE_POS, DAY_LEN } from './config.js';
import { state, player, newTree } from './state.js';

const SAVE_KEY = 'plumRancher.save';
const V1_KEY = 'plumRancherSaveV1';      // pre-versioning format (Aug 2026)
const VERSION = 2;

export function snapshotSave() {
  return {
    v: VERSION,
    coins: state.coins, plums: state.plums,
    day: state.day, dayT: state.dayT,
    upgrades: { ...state.upgrades },
    trees: state.trees.map(t => ({ plums: t.plums, t: t.t })),
    player: { x: player.x, y: player.y, dir: player.dir },
    muted: state.muted,
  };
}

export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(snapshotSave())); } catch { /* private mode etc. */ }
}

// v1 → v2: v1 had coins, plums, day, upgrades and per-tree plum counts.
function fromV1(s) {
  return {
    v: 2,
    coins: s.coins, plums: s.plums, day: s.day, dayT: 0,
    upgrades: s.upgrades,
    trees: (s.trees ?? []).map(t => ({ plums: t.plums, t: 0 })),
    player: null, muted: false,
  };
}

// The stored save in current shape, plus whether it needed migrating.
function readRaw() {
  try {
    const cur = localStorage.getItem(SAVE_KEY);
    if (cur) { const s = JSON.parse(cur); return { s, migrated: s?.v !== VERSION }; }
    const old = localStorage.getItem(V1_KEY);
    if (old) return { s: fromV1(JSON.parse(old)), migrated: true };
  } catch { /* corrupt or blocked: start fresh */ }
  return null;
}

const num = (v, fallback, lo = -Infinity, hi = Infinity) =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;

// Apply a saved game to state. Returns false if there's nothing to load.
// `fits(x, y)` says whether Bronto can stand there (positions inside
// something solid, e.g. after a layout change, fall back to the spawn).
export function load(fits = () => true) {
  const raw = readRaw();
  if (!raw?.s || typeof raw.s !== 'object') return false;
  const { s, migrated } = raw;
  state.coins = num(s.coins, 0, 0);
  state.plums = num(s.plums, 0, 0);
  state.day = num(s.day, 1, 1);
  state.dayT = num(s.dayT, 0, 0, DAY_LEN);
  for (const k of Object.keys(state.upgrades)) state.upgrades[k] = !!s.upgrades?.[k];
  state.trees = [newTree(TREE_POS[0])];
  if (state.upgrades.sapling) state.trees.push(newTree(TREE_POS[1]));
  state.trees.forEach((t, i) => {
    const st = s.trees?.[i];
    if (st) { t.plums = num(st.plums, 3, 0, 6); t.t = num(st.t, 0, 0); }
  });
  state.muted = !!s.muted;
  const p = s.player;
  if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && fits(p.x, p.y)) {
    player.x = p.x; player.y = p.y; player.dir = p.dir === -1 ? -1 : 1;
  }
  if (migrated) save();                 // write migrated saves in the current format
  return true;
}
