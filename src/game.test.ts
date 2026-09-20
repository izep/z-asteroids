import { Game } from './game';

describe('Game', () => {
  it('should initialize correctly', () => {
    const game = new Game();
    expect(game).toBeDefined();
  });
});
