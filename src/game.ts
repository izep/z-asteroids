export function createGame() {
  console.log('Game created!');
  return {
    start: () => {
      console.log('Game started!');
    }
  };
}