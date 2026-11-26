export function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function rand(a, b) { return a + Math.random() * (b - a); }
