// Tiny WebAudio synth for sound effects.
import { state } from './state.js';

let actx = null;
export function beep(freq, dur = 0.08, type = 'square', vol = 0.12, delay = 0) {
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

export const sfx = {
  bark() { beep(220, 0.07, 'square', 0.18); beep(150, 0.09, 'square', 0.18, 0.07); },
  harvest() { beep(660, 0.06, 'triangle', 0.15); beep(880, 0.08, 'triangle', 0.15, 0.06); },
  sell() { beep(523, 0.07, 'triangle', 0.15); beep(659, 0.07, 'triangle', 0.15, 0.07); beep(784, 0.1, 'triangle', 0.15, 0.14); },
  buy() { beep(784, 0.08, 'triangle', 0.15); beep(1046, 0.12, 'triangle', 0.15, 0.08); },
  denied() { beep(160, 0.12, 'sawtooth', 0.1); },
  munch() { beep(110, 0.05, 'sawtooth', 0.06); },
};
