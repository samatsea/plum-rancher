// Keyboard state. Game logic lives in the onPress handler passed to initInput.

export const keys = {};

// Normalize to KeyboardEvent.code style; some environments only supply e.key.
export function keyId(e) {
  if (e.code) return e.code;
  const k = e.key;
  if (k === ' ') return 'Space';
  if (k.length === 1 && /[a-z]/i.test(k)) return 'Key' + k.toUpperCase();
  if (/^[0-9]$/.test(k)) return 'Digit' + k;
  return k; // 'ArrowLeft', 'Enter', 'Escape', ...
}

export function initInput(onPress) {
  window.addEventListener('keydown', (e) => {
    const code = keyId(e);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
    if (keys[code]) return;
    keys[code] = true;
    onPress(code);
  });
  window.addEventListener('keyup', (e) => { keys[keyId(e)] = false; });
}
