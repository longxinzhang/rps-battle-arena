export function createEffects({ state, rand }) {
  function emitBurst(x, y, color, count = 10, size = 3) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.9, 4.2);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(380, 720),
        maxLife: 720,
        color,
        size: rand(size * 0.55, size * 1.35),
      });
    }
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= 16.6667 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.985;
      particle.vy *= 0.985;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  return {
    emitBurst,
    updateParticles,
  };
}
