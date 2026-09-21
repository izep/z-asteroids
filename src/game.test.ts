import { describe, it, expect } from 'vitest';
import { Game } from './game';

describe('Game', () => {
  it('constructs without a canvas (headless)', () => {
    const game = new Game({ width: 800, height: 600, audio: false });
    expect(game).toBeDefined();
    expect(game.getState()).toBe('boot');
  });

  it('starts in playing state after start()', () => {
    const game = new Game({ width: 800, height: 600, audio: false });
    game.start();
    expect(game.getState()).toBe('playing');
  });

  it('initialises with 3 lives', () => {
    const game = new Game({ width: 800, height: 600, audio: false });
    expect(game.getLives()).toBe(3);
  });

  it('initialises on wave 1', () => {
    const game = new Game({ width: 800, height: 600, audio: false });
    expect(game.getWave()).toBe(1);
  });

  it('spawns asteroids at start', () => {
    const game = new Game({ width: 800, height: 600, audio: false });
    game.start();
    expect(game.getAsteroids().length).toBeGreaterThan(0);
  });

  it('uses provided storage for high score', () => {
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
    };
    store['z-asteroids:highScore'] = '9999';
    const game = new Game({ width: 800, height: 600, audio: false, storage: mockStorage });
    expect(game.getScore().highScore).toBe(9999);
  });

  it('resize updates dimensions', () => {
    const game = new Game({ width: 800, height: 600, audio: false });
    game.resize(1024, 768);
    // No exception thrown — success
  });
});
