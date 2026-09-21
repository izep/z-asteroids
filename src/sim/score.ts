import { AsteroidSize, SCORES } from './asteroid';

export interface ScoreState {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
}

const STARTING_LIVES = 3;

export function createScoreState(initialHighScore = 0): ScoreState {
  return {
    score: 0,
    highScore: initialHighScore,
    lives: STARTING_LIVES,
    wave: 1,
  };
}

export function addScore(state: ScoreState, size: AsteroidSize): void {
  state.score += SCORES[size];
  if (state.score > state.highScore) {
    state.highScore = state.score;
  }
}

export function loseLife(state: ScoreState): void {
  state.lives = Math.max(0, state.lives - 1);
}

export function nextWave(state: ScoreState): void {
  state.wave += 1;
}

export function isGameOver(state: ScoreState): boolean {
  return state.lives <= 0;
}

export function resetScore(state: ScoreState): void {
  state.score = 0;
  state.lives = STARTING_LIVES;
  state.wave = 1;
}

export { STARTING_LIVES };
