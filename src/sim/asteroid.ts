import { Vec2, randRange, wrapVec2 } from '../math';

export type AsteroidSize = 'large' | 'medium' | 'small';

export interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;       // rad/s
  angle: number;      // current rotation
  size: AsteroidSize;
  radius: number;
  verts: Vec2[];      // local-space jagged polygon
  id: number;
}

let _nextId = 1;

const RADII: Record<AsteroidSize, number> = {
  large: 38,
  medium: 20,
  small: 10,
};

const BASE_SPEED: Record<AsteroidSize, number> = {
  large: 40,
  medium: 70,
  small: 110,
};

export function asteroidRadius(size: AsteroidSize): number {
  return RADII[size];
}

function makeVerts(radius: number, numVerts = 12): Vec2[] {
  const verts: Vec2[] = [];
  for (let i = 0; i < numVerts; i++) {
    const angle = (i / numVerts) * Math.PI * 2;
    const r = radius * randRange(0.65, 1.2);
    verts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return verts;
}

export function spawnAsteroid(
  x: number,
  y: number,
  size: AsteroidSize,
  speedMultiplier = 1.0,
): Asteroid {
  const radius = RADII[size];
  const baseSpeed = BASE_SPEED[size] * speedMultiplier;
  const speed = randRange(baseSpeed * 0.6, baseSpeed * 1.4);
  const direction = randRange(0, Math.PI * 2);
  return {
    id: _nextId++,
    x,
    y,
    vx: Math.cos(direction) * speed,
    vy: Math.sin(direction) * speed,
    spin: randRange(-1.5, 1.5),
    angle: randRange(0, Math.PI * 2),
    size,
    radius,
    verts: makeVerts(radius),
  };
}

export function spawnWaveAsteroids(
  wave: number,
  width: number,
  height: number,
): Asteroid[] {
  const count = wave + 3; // wave 1 = 4
  const speedMult = 1.0 + (wave - 1) * 0.12;
  const asteroids: Asteroid[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const safeR = 120;

  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    // keep asteroids away from screen centre (ship spawn)
    do {
      x = randRange(0, width);
      y = randRange(0, height);
    } while (Math.hypot(x - cx, y - cy) < safeR);
    asteroids.push(spawnAsteroid(x, y, 'large', speedMult));
  }
  return asteroids;
}

export function splitAsteroid(
  a: Asteroid,
  speedMultiplier = 1.0,
): Asteroid[] {
  if (a.size === 'small') return [];
  const childSize: AsteroidSize = a.size === 'large' ? 'medium' : 'small';
  return [
    spawnAsteroid(a.x, a.y, childSize, speedMultiplier),
    spawnAsteroid(a.x, a.y, childSize, speedMultiplier),
  ];
}

export function integrateAsteroids(
  asteroids: Asteroid[],
  dt: number,
  width: number,
  height: number,
): void {
  for (const a of asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.angle += a.spin * dt;
    const w = wrapVec2({ x: a.x, y: a.y }, width, height);
    a.x = w.x;
    a.y = w.y;
  }
}

export const SCORES: Record<AsteroidSize, number> = {
  large: 20,
  medium: 50,
  small: 100,
};

export function resetAsteroidIds(): void {
  _nextId = 1;
}
