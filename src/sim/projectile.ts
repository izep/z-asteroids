import { wrapVec2 } from '../math';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;   // seconds remaining
  range: number;  // px traveled so far
  id: number;
}

let _nextId = 1;

const MAX_BOLTS = 4;
const BOLT_SPEED = 480;    // px/s
const BOLT_LIFETIME = 1.2; // seconds (max range ≈ 576 px)
const FIRE_COOLDOWN = 0.22; // seconds between shots

export function createProjectileManager() {
  const bolts: Projectile[] = [];
  let cooldown = 0;

  function tryFire(
    shipX: number,
    shipY: number,
    shipAngle: number,
    shipVx: number,
    shipVy: number,
  ): Projectile | null {
    if (bolts.length >= MAX_BOLTS) return null;
    if (cooldown > 0) return null;

    const bolt: Projectile = {
      id: _nextId++,
      x: shipX + Math.cos(shipAngle) * 14,
      y: shipY + Math.sin(shipAngle) * 14,
      vx: shipVx + Math.cos(shipAngle) * BOLT_SPEED,
      vy: shipVy + Math.sin(shipAngle) * BOLT_SPEED,
      life: BOLT_LIFETIME,
      range: 0,
    };
    bolts.push(bolt);
    cooldown = FIRE_COOLDOWN;
    return bolt;
  }

  function integrate(dt: number, width: number, height: number): void {
    if (cooldown > 0) cooldown = Math.max(0, cooldown - dt);

    for (const b of bolts) {
      const speed = Math.hypot(b.vx, b.vy);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.range += speed * dt;
      b.life -= dt;
      const w = wrapVec2({ x: b.x, y: b.y }, width, height);
      b.x = w.x;
      b.y = w.y;
    }

    // Remove expired bolts
    for (let i = bolts.length - 1; i >= 0; i--) {
      if (bolts[i].life <= 0) bolts.splice(i, 1);
    }
  }

  function removeBolt(id: number): void {
    const idx = bolts.findIndex((b) => b.id === id);
    if (idx !== -1) bolts.splice(idx, 1);
  }

  function getBolts(): readonly Projectile[] {
    return bolts;
  }

  function reset(): void {
    bolts.length = 0;
    cooldown = 0;
  }

  return { tryFire, integrate, removeBolt, getBolts, reset };
}

export type ProjectileManager = ReturnType<typeof createProjectileManager>;

export { MAX_BOLTS, BOLT_LIFETIME, FIRE_COOLDOWN };

export function resetProjectileIds(): void {
  _nextId = 1;
}
