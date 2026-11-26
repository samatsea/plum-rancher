// Ranch Supply vending machine (HTML overlay).
import { SHOP_ITEMS, TREE_POS } from '../core/config.js';
import { state, player, newTree } from '../core/state.js';
import { save } from '../core/save.js';
import { sfx } from '../core/audio.js';
import { toast } from '../fx.js';

export function toggleShop(open) {
  state.shopOpen = open;
  document.getElementById('shop').classList.toggle('hidden', !open);
  if (open) renderShop();
}

export function renderShop() {
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

export function buyItem(i) {
  const it = SHOP_ITEMS[i];
  if (!it || state.upgrades[it.key]) { sfx.denied(); return; }
  if (state.coins < it.price) { sfx.denied(); return; }
  state.coins -= it.price;
  state.upgrades[it.key] = true;
  if (it.key === 'sapling') state.trees.push(newTree(TREE_POS[1]));
  sfx.buy(); save(); renderShop();
  toast(player.x + 8, player.y - 12, it.name + '!', '#8fce6e');
}
