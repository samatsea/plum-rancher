// Day counter. Becomes the full in-game clock (time of day, seasons) in M1.
import { DAY_LEN, W } from './config.js';
import { state } from './state.js';
import { save } from './save.js';
import { toast } from '../fx.js';

export function updateDay(dt) {
  state.dayT += dt;
  if (state.dayT >= DAY_LEN) {
    state.dayT = 0;
    state.day++;
    toast(W / 2, 40, `DAY ${state.day}`, '#f2e8c9');
    save();
  }
}
