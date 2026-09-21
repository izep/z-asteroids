import { randRange } from '../math';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;    // seconds remaining
  maxLife: number; // initial life (for alpha fade)
}

const MAX_PARTICLES = 200;

export function createParticleSystem() {
  const particles: Particle[] = [];

  function spawnExplosion(x: number, y: number, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      const angle = randRange(0, Math.PI * 2);
      const s = randRange(speed * 0.4, speed);
      const life = randRange(0.4, 1.0);
      particles.push({
        x, y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life,
        maxLife: life,
      });
    }
  }

  function integrate(dt: number): void {
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 2 * dt; // slight air resistance
      p.vy *= 1 - 2 * dt;
      p.life -= dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  function getParticles(): readonly Particle[] {
    return particles;
  }

  function clear(): void {
    particles.length = 0;
  }

  return { spawnExplosion, integrate, getParticles, clear };
}

export type ParticleSystem = ReturnType<typeof createParticleSystem>;
export { MAX_PARTICLES };
