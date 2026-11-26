// Particles: floating text, bark rings, little bits.
import { state } from './core/state.js';
import { clamp } from './core/util.js';
import { text } from './ui/font.js';

export function toast(x, y, text, color) {
  state.particles.push({ type: 'text', x, y, text, color, life: 1.1, max: 1.1 });
}

export function spawnParticle(p) {
  state.particles.push(p);
}

export function updateParticles(dt) {
  for (const p of state.particles) {
    p.life -= dt;
    if (p.type === 'bit') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; }
    if (p.type === 'ring') p.r += 140 * dt;
    if (p.type === 'text') p.y -= 14 * dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);
}

export function drawParticles(ctx) {
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
      ctx.globalAlpha = a;
      text(ctx, p.text, p.x, p.y, { align: 'center', color: p.color, shadow: '#1d1408' });
      ctx.globalAlpha = 1;
    }
  }
}
