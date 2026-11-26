import { SAVE_KEY, TREE_POS } from './config.js';
import { state, newTree } from './state.js';

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      coins: state.coins, plums: state.plums, day: state.day,
      upgrades: state.upgrades,
      trees: state.trees.map(t => ({ plums: t.plums })),
    }));
  } catch { /* private mode etc. */ }
}

export function load() {
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
