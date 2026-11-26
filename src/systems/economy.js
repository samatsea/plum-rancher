// Selling plums for coins.
import { BIN, PLUM_PRICE } from '../core/config.js';
import { state } from '../core/state.js';
import { save } from '../core/save.js';
import { sfx } from '../core/audio.js';
import { toast } from '../fx.js';

export function sellPlums() {
  if (state.plums <= 0) return false;
  const earned = state.plums * PLUM_PRICE;
  state.coins += earned;
  toast(BIN.x + 14, BIN.y - 6, `+${earned}g`, '#ffd76b');
  state.plums = 0;
  sfx.sell(); save();
  return true;
}
