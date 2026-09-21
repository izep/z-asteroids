export interface InputState {
  rotating: -1 | 0 | 1;   // -1 = left, 1 = right
  thrusting: boolean;
  firing: boolean;
  hyperspace: boolean;
  restart: boolean;
  mute: boolean;
}


export function createKeyboardInput() {
  const held = new Set<string>();
  let muteTriggered = false;
  let hyperspaceTriggered = false;
  let restartTriggered = false;

  function onKeyDown(e: KeyboardEvent): void {
    held.add(e.code);
    if (e.code === 'KeyM') muteTriggered = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyH') {
      hyperspaceTriggered = true;
    }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') restartTriggered = true;
    // Prevent default for game keys so the page doesn't scroll
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
    ) {
      e.preventDefault();
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    held.delete(e.code);
  }

  function attach(): void {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  function detach(): void {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  /** Call once per frame to get a snapshot and clear one-shot flags. */
  function snapshot(): InputState {
    const left  = held.has('ArrowLeft')  || held.has('KeyA');
    const right = held.has('ArrowRight') || held.has('KeyD');
    const state: InputState = {
      rotating: left && !right ? -1 : right && !left ? 1 : 0,
      thrusting: held.has('ArrowUp') || held.has('KeyW'),
      firing: held.has('Space'),
      hyperspace: hyperspaceTriggered,
      restart: restartTriggered,
      mute: muteTriggered,
    };
    // Clear one-shot flags after reading
    muteTriggered = false;
    hyperspaceTriggered = false;
    restartTriggered = false;
    return state;
  }

  return { attach, detach, snapshot };
}
