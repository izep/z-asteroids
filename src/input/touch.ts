import { InputState } from './keyboard';

/**
 * Touch input for mobile.
 *
 * Layout (portrait / landscape):
 *   Left 45% of screen  → rotate zone (left half = rotate left, right half = rotate right)
 *   Right 55%: top area → thrust button
 *              bottom-right → fire button
 *              hyperspace   → small strip at top-right corner
 */

interface TouchZoneState {
  rotating: -1 | 0 | 1;
  thrusting: boolean;
  firing: boolean;
  hyperspace: boolean;
  restart: boolean;
}

export function createTouchInput(canvas: HTMLCanvasElement) {
  const state: TouchZoneState = {
    rotating: 0,
    thrusting: false,
    firing: false,
    hyperspace: false,
    restart: false,
  };

  let muteTriggered = false;
  let hyperspaceTriggered = false;
  let restartTriggered = false;

  // Track active touch IDs per zone
  const rotateIds = new Set<number>();
  const thrustIds = new Set<number>();
  const fireIds = new Set<number>();
  const hyperspaceIds = new Set<number>();

  // Transient rotate direction from touch position within the left zone
  let touchRotDir: -1 | 0 | 1 = 0;

  function getZone(clientX: number, clientY: number, width: number, height: number): string {
    const x = clientX;
    const y = clientY;
    const leftBoundary = width * 0.45;

    if (x < leftBoundary) {
      return 'rotate';
    }
    // Right side zones
    // Hyperspace: top-right corner (top 15% of height, right 20% of width)
    if (y < height * 0.15 && x > width * 0.8) return 'hyperspace';
    // Thrust: upper-right area (below hyperspace, above 60% height)
    if (y < height * 0.60) return 'thrust';
    // Fire: lower-right area
    return 'fire';
  }

  function updateRotateDir(clientX: number, width: number): void {
    const leftBoundary = width * 0.45;
    const midLeft = leftBoundary / 2;
    touchRotDir = clientX < midLeft ? -1 : 1;
  }

  function onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const cx = t.clientX - rect.left;
      const cy = t.clientY - rect.top;
      const zone = getZone(cx, cy, w, h);

      if (zone === 'rotate') {
        rotateIds.add(t.identifier);
        updateRotateDir(cx, w);
      } else if (zone === 'thrust') {
        thrustIds.add(t.identifier);
      } else if (zone === 'fire') {
        fireIds.add(t.identifier);
        vibrate(10);
      } else if (zone === 'hyperspace') {
        hyperspaceIds.add(t.identifier);
        hyperspaceTriggered = true;
      }
    }
    refreshState();
  }

  function onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (rotateIds.has(t.identifier)) {
        updateRotateDir(t.clientX - rect.left, w);
      }
    }
    refreshState();
  }

  function onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const id = e.changedTouches[i].identifier;
      rotateIds.delete(id);
      thrustIds.delete(id);
      fireIds.delete(id);
      hyperspaceIds.delete(id);
    }
    if (rotateIds.size === 0) touchRotDir = 0;
    refreshState();
  }

  function refreshState(): void {
    state.rotating = rotateIds.size > 0 ? touchRotDir : 0;
    state.thrusting = thrustIds.size > 0;
    state.firing = fireIds.size > 0;
    state.hyperspace = hyperspaceIds.size > 0;
  }

  function vibrate(ms: number): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch { /* ignore */ }
    }
  }

  function attach(): void {
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
  }

  function detach(): void {
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('touchcancel', onTouchEnd);
  }

  function snapshot(): Partial<InputState> {
    const s: Partial<InputState> = {
      rotating: state.rotating,
      thrusting: state.thrusting,
      firing: state.firing,
      hyperspace: hyperspaceTriggered,
      restart: restartTriggered,
      mute: muteTriggered,
    };
    hyperspaceTriggered = false;
    restartTriggered = false;
    muteTriggered = false;
    return s;
  }

  function getTouchActive(): { left: boolean; right: boolean; thrust: boolean; fire: boolean } {
    return {
      left: rotateIds.size > 0 && touchRotDir === -1,
      right: rotateIds.size > 0 && touchRotDir === 1,
      thrust: thrustIds.size > 0,
      fire: fireIds.size > 0,
    };
  }

  return { attach, detach, snapshot, getTouchActive, vibrate };
}
