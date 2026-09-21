# Requirements Document: z-asteroids

Authoritative architecture for this repo. `ralph/epic.md` describes the player-facing outcome. This file describes **how the software must be built**. Ralph must treat the current `src/` tree as a stub and replace it; console.log placeholders, missing entry files, and status-only git commits are not implementations.

---

## 1. Runtime & Tooling

- **Platform**: Browser web app (mobile Safari / iPhone PWA first, desktop Chromium / Firefox / Safari second). No Node rendering.
- **Language**: TypeScript, `strict: true`, `noUnusedLocals`, `noUnusedParameters`.
- **Bundler**: Vite. Dev server already uses port `5174`.
- **Tests**: Vitest. Every sim module has a colocated `*.test.ts`. Tests import `{ describe, it, expect }` from `vitest` (do not assume globals).
- **Package manager**: `pnpm`. Commands: `pnpm test`, `pnpm build` (`tsc && vite build`).
- **Allowed libraries**: TypeScript, Vite, Vitest, browser APIs. **Forbidden**: `@napi-rs/canvas`, `canvas`, `node-canvas`, any native/Node canvas, game engines, audio sample packs, React.
- **Definition of done (every task)**:
  1. The files named in this document exist and contain real logic (not `console.log` stubs).
  2. `pnpm test` exits 0.
  3. `pnpm build` exits 0.
  4. `index.html` loads `/src/main.ts` and that file exists.
  5. Changing only `ralph/task-status.json` or adding comments is **not** complete.

---

## 2. Boot & DOM Contract

`index.html` is the only HTML page. Restore and keep this contract:

- `<html lang="en">` with:
  - `viewport` including `viewport-fit=cover`, `user-scalable=no`
  - `apple-mobile-web-app-capable` / `mobile-web-app-capable`
  - `theme-color` `#0b0f19`
- Full-viewport dark background `#0b0f19`, `overflow: hidden`
- Wrapper `#game-container` filling the visual viewport, honoring `env(safe-area-inset-*)`
- Canvas **`#game-canvas`** (not `gameCanvas`)
- Module entry: `<script type="module" src="/src/main.ts"></script>`

`src/main.ts` must:

1. Query `#game-canvas`; throw a clear error if missing.
2. Size the canvas to the container using `devicePixelRatio` (high-DPI / Retina).
3. Construct `Game` and call `start()`.
4. Re-size and notify `Game` on `resize` / `orientationchange`.

Never leave `index.html` pointing at a file that does not exist.

---

## 3. Layered Source Layout

Keep simulation pure and testable. Do not put physics inside canvas draw calls.

```
index.html
src/main.ts                 # DOM boot only
src/game.ts                 # Game class: state machine + rAF loop
src/math.ts                 # Vec2 helpers, wrap, clamp, random range
src/sim/ship.ts             # ship state + integrate
src/sim/asteroid.ts         # spawn, wrap, split Large→2 Medium→2 Small
src/sim/projectile.ts       # laser bolts, max 4 alive, range + cooldown
src/sim/collision.ts        # circle–circle and circle–polygon
src/sim/particles.ts        # explosion sparks (data only)
src/sim/score.ts            # score, lives, waves, high-score compare
src/render/renderer.ts      # vector glow stroke drawing
src/render/starfield.ts     # parallax star layers
src/render/hud.ts           # score, lives, wave, game-over text
src/input/keyboard.ts       # arrows / WASD, space fire, shift hyperspace
src/input/touch.ts          # left rotate zone, right thrust+fire
src/audio.ts                # Web Audio synthesizer, no audio files
src/storage.ts              # localStorage high score + mute
public/manifest.json
public/icons/               # PWA icons
public/sw.js                # offline cache of app shell
src/**/*.test.ts            # unit tests for math, sim, score, collision
```

New files are expected. Empty or missing files are the normal starting state — create them.

---

## 4. Game Class & Loop

Export **`class Game`** from `src/game.ts` (tests use `new Game(...)`). A `createGame()` factory is not the public API.

Constructor injects I/O so tests run in Node:

```ts
type GameOptions = {
  canvas?: HTMLCanvasElement;
  width: number;
  height: number;
  now?: () => number;          // default: performance.now
  storage?: Pick<Storage, "getItem" | "setItem">;
  audio?: boolean;             // default true in browser, false in tests
};
```

Loop:

- `requestAnimationFrame` in the browser.
- Integrate with **delta time** in seconds, clamped (e.g. max 1/20s) so tab-throttling cannot teleport objects.
- Target 60 FPS on a 60 Hz display; no unbounded object growth (cap particles and bolts).
- Screen wrap is a math function applied after integration: `(x + w) % w`, `(y + h) % h`. No visual pop — draw wrap ghosts when an object straddles an edge.

State machine: `boot` → `playing` → `respawning` → `gameover` → `playing` (restart).

---

## 5. Simulation Rules

These are architecture invariants, not optional flavor.

### 5.1 Ship

- Pose: `{ x, y, angle, vx, vy }`.
- Thrust adds acceleration along `angle`; velocity retains momentum with light drag.
- Rotate at a constant angular rate while left/right is held.
- Wrap with the same helper as asteroids.
- **Spawn shield**: 3.0 seconds of invulnerability after start and after each death, drawn as a glowing outline. Collisions ignored while shielded.
- **Hyperspace**: teleport to a random in-bounds point; small chance of overlapping an asteroid (no shield granted by hyperspace). Cooldown so it cannot be spammed.

### 5.2 Projectiles

- At most **4** live bolts.
- Spawn at the ship nose, inherit a forward speed, expire by range or lifetime.
- Fire has a cooldown. If 4 are live, fire is a no-op.

### 5.3 Asteroids

- Three sizes: **Large (20 pts)** → split into **2 Medium (50 pts)** → split into **2 Small (100 pts)** → removed.
- Shape: jagged polygon generated once at spawn (stored vertices, not a circle draw).
- Each body has position, velocity, spin.
- Wave N starts with `(N + 3)` large asteroids (wave 1 = 4) and slightly higher max speed than wave N−1.
- Clearing the field starts the next wave after a short beat.

### 5.4 Collision

- Broadphase: circle vs circle using radius.
- Narrowphase ship/bolt vs asteroid: **circle vs polygon** (or polygon vs polygon) against the jagged vertices.
- Bolt vs asteroid: destroy bolt, split/destroy asteroid, spawn particles, add score.
- Ship vs asteroid (unshielded): lose 1 life, explode ship, enter `respawning` or `gameover` at 0 lives.
- Lives start at **3**.

### 5.5 Particles

- CPU-only structs ticked in sim: position, velocity, life.
- Hard cap (e.g. 200). Renderer only strokes them.

---

## 6. Rendering

- HTML5 **Canvas 2D** only. Backing store = CSS size × `devicePixelRatio`; set `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` so sim units are CSS pixels.
- Aesthetic: neon vector wireframes on `#0b0f19`. Stroke with a faint wide glow pass then a sharp core pass.
- Parallax starfield: at least 2 layers, wrap, drift slower than gameplay objects.
- HUD is canvas text (score, lives, wave, high score, mute hint). No DOM UI except the canvas and optional invisible touch hit areas.

---

## 7. Input

**Keyboard (desktop):** Arrow keys or WASD rotate/thrust; Space fire; Shift or H hyperspace; M mute; Enter restart on game over.

**Touch (iPhone):**

- Left half: rotate — either a floating stick or hold-left / hold-right zones. Must work in portrait and landscape.
- Right half: Thrust and Fire buttons with pressed visual state.
- Optional hyperspace control that does not collide with Fire.
- `navigator.vibrate` on fire/hit when the API exists; ignore if missing.
- `touch-action: none` / `preventDefault` so the page does not scroll or pinch-zoom.
- Layout respects safe-area insets (notch / Dynamic Island / home indicator).

Input modules write a `InputState` snapshot; `Game` reads it each tick. Do not bind gameplay logic directly inside DOM event handlers.

---

## 8. Audio

- Web Audio API `AudioContext` only. Resume on first user gesture (browser autoplay policy).
- Synthesize: thrust hum (loop while thrusting), fire pew, explosion rumble, hyperspace, wave-clear chime.
- Zero audio files, zero CDN assets.
- Mute flag persisted via `storage.ts`. Silent no-op if AudioContext is unavailable (tests, old browsers).

---

## 9. Persistence & PWA

- `src/storage.ts` keys under a `z-asteroids:` prefix: `highScore` (number), `muted` (boolean). Guard `localStorage` (private mode may throw).
- `public/manifest.json`: `name` / `short_name`, `display: "standalone"`, `orientation: "any"`, `theme_color` / `background_color` `#0b0f19`, icons 192 and 512.
- `index.html` links the manifest and registers `public/sw.js` in `main.ts`.
- Service worker caches the app shell (html, JS bundle, manifest, icons) for offline play. Network-first for HTML is acceptable; cache-first for hashed assets.

---

## 10. Tests (architecture)

Unit-test **without** jsdom canvas where possible by constructing `Game` with width/height and no canvas, or by testing sim functions directly.

Minimum coverage (must exist before calling physics/collision/scoring “done”):

- `math.ts`: wrap, rotate, magnitude, normalize, zero vector
- `ship.ts`: thrust changes velocity along heading; drag reduces speed; wrap at edges
- `collision.ts`: overlapping circles hit; separated circles miss; point-in / circle-vs-polygon against a known triangle
- `asteroid.ts`: large hit → two medium; medium → two small; small → none
- `projectile.ts`: fifth bolt rejected while four live; expiry removes bolt
- `score.ts`: 20/50/100 scoring; wave increment; lives decrement to game over; high score only increases

QA must **fail** a task if:

- `pnpm test` or `pnpm build` fails
- The claimed feature has no corresponding source file
- `index.html` references a missing module
- Implementation is only `console.log` or empty exports
- Node canvas packages were added
