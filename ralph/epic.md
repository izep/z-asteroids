# Current Epic: MVP Vector Asteroids Engine & iPhone Touch Controls

## Business Outcome
Deliver a playable, polished MVP of z-asteroids that runs smoothly on iPhone and desktop browsers with full physics, asteroid splitting, sound synthesizer, and touch controls.

## Scope Boundaries
- In Scope:
  1. Vector Canvas Renderer with high-DPI scaling and glowing CRT wireframe aesthetics.
  2. Ship physics (inertia, rotation, thrust, boundaries wrap, invulnerability).
  3. Asteroid spawning, movement, and 3-tier splitting (Large -> Medium -> Small).
  4. Projectile shooting, particle explosion effects, score counter, lives system.
  5. Web Audio synthesizer (Fire sound, Thrust sound, Explosion rumble).
  6. Dual-thumb touch controls optimized for mobile/iPhone and keyboard fallback (Arrows/WASD + Space).
  7. Unit tests for physics, collision detection, and scoring logic.

- Out of Scope for this Epic:
  - Online multiplayer / leaderboard backend (local storage only).
  - Power-up drops (future epic).

## Success Criteria
- Unit tests pass with 100% coverage on core math/physics modules.
- Game runs at a stable 60 FPS in canvas.
- Works seamlessly with both touch and keyboard inputs.
