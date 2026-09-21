import { describe, it, expect } from 'vitest';
import {
  createScoreState,
  addScore,
  loseLife,
  nextWave,
  isGameOver,
  resetScore,
  STARTING_LIVES,
} from './score';

describe('score', () => {
  it('initial state has correct lives and wave', () => {
    const s = createScoreState();
    expect(s.lives).toBe(STARTING_LIVES);
    expect(s.wave).toBe(1);
    expect(s.score).toBe(0);
  });

  it('large asteroid scores 20 points', () => {
    const s = createScoreState();
    addScore(s, 'large');
    expect(s.score).toBe(20);
  });

  it('medium asteroid scores 50 points', () => {
    const s = createScoreState();
    addScore(s, 'medium');
    expect(s.score).toBe(50);
  });

  it('small asteroid scores 100 points', () => {
    const s = createScoreState();
    addScore(s, 'small');
    expect(s.score).toBe(100);
  });

  it('high score only increases', () => {
    const s = createScoreState(1000);
    addScore(s, 'large'); // +20, total 20
    expect(s.highScore).toBe(1000); // 1000 > 20, not replaced

    s.score = 1500;
    addScore(s, 'small'); // +100, total 1600
    expect(s.highScore).toBe(1600);
  });

  it('loseLife decrements lives', () => {
    const s = createScoreState();
    loseLife(s);
    expect(s.lives).toBe(STARTING_LIVES - 1);
  });

  it('loseLife does not go below 0', () => {
    const s = createScoreState();
    for (let i = 0; i < 10; i++) loseLife(s);
    expect(s.lives).toBe(0);
  });

  it('isGameOver when lives reach 0', () => {
    const s = createScoreState();
    expect(isGameOver(s)).toBe(false);
    s.lives = 0;
    expect(isGameOver(s)).toBe(true);
  });

  it('nextWave increments wave', () => {
    const s = createScoreState();
    nextWave(s);
    expect(s.wave).toBe(2);
  });

  it('resetScore resets score, lives, wave but not highScore', () => {
    const s = createScoreState(500);
    s.score = 200;
    s.lives = 1;
    s.wave = 5;
    resetScore(s);
    expect(s.score).toBe(0);
    expect(s.lives).toBe(STARTING_LIVES);
    expect(s.wave).toBe(1);
    expect(s.highScore).toBe(500); // untouched
  });
});
