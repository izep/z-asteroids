import { describe, it, expect } from 'vitest';
import { createProjectileManager } from './projectile';

describe('projectile', () => {
  it('fires a bolt when slot is available', () => {
    const pm = createProjectileManager();
    const bolt = pm.tryFire(100, 100, 0, 0, 0);
    expect(bolt).not.toBeNull();
    expect(pm.getBolts()).toHaveLength(1);
  });

  it('respects the 4-bolt cap — fifth bolt rejected', () => {
    const pm = createProjectileManager();
    // Fire 4 bolts, advancing just enough to clear the cooldown without expiring bolts
    for (let i = 0; i < 4; i++) {
      pm.integrate(0.25, 1000, 1000); // advance past fire cooldown (0.22s)
      pm.tryFire(100, 100, 0, 0, 0);
    }
    expect(pm.getBolts()).toHaveLength(4);
    const extra = pm.tryFire(100, 100, 0, 0, 0);
    expect(extra).toBeNull();
    expect(pm.getBolts()).toHaveLength(4);
  });

  it('bolts expire after their lifetime', () => {
    const pm = createProjectileManager();
    pm.tryFire(100, 100, 0, 0, 0);
    expect(pm.getBolts()).toHaveLength(1);
    // Integrate well past bolt lifetime (1.2s)
    pm.integrate(2.0, 1000, 1000);
    expect(pm.getBolts()).toHaveLength(0);
  });

  it('removeBolt removes the specific bolt by id', () => {
    const pm = createProjectileManager();
    const bolt = pm.tryFire(100, 100, 0, 0, 0);
    expect(bolt).not.toBeNull();
    if (bolt) {
      pm.removeBolt(bolt.id);
      expect(pm.getBolts()).toHaveLength(0);
    }
  });

  it('reset clears all bolts', () => {
    const pm = createProjectileManager();
    pm.tryFire(100, 100, 0, 0, 0);
    pm.reset();
    expect(pm.getBolts()).toHaveLength(0);
  });
});
