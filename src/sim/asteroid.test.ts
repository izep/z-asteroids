import { describe, it, expect, beforeEach } from 'vitest';
import { spawnAsteroid, splitAsteroid, resetAsteroidIds } from './asteroid';

beforeEach(() => {
  resetAsteroidIds();
});

describe('asteroid', () => {
  it('large hit produces two medium asteroids', () => {
    const large = spawnAsteroid(100, 100, 'large');
    const children = splitAsteroid(large);
    expect(children).toHaveLength(2);
    expect(children.every((c) => c.size === 'medium')).toBe(true);
  });

  it('medium hit produces two small asteroids', () => {
    const medium = spawnAsteroid(100, 100, 'medium');
    const children = splitAsteroid(medium);
    expect(children).toHaveLength(2);
    expect(children.every((c) => c.size === 'small')).toBe(true);
  });

  it('small hit produces no children', () => {
    const small = spawnAsteroid(100, 100, 'small');
    const children = splitAsteroid(small);
    expect(children).toHaveLength(0);
  });

  it('spawned asteroid has position and velocity', () => {
    const a = spawnAsteroid(50, 75, 'large');
    expect(a.x).toBe(50);
    expect(a.y).toBe(75);
    expect(Math.hypot(a.vx, a.vy)).toBeGreaterThan(0);
  });

  it('asteroid has jagged vertices with non-zero length', () => {
    const a = spawnAsteroid(0, 0, 'large');
    expect(a.verts.length).toBeGreaterThan(3);
  });
});
