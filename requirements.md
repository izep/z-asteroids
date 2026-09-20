# Requirements Document: z-asteroids

## 1. Product Overview
**z-asteroids** is a retro vector-graphics space shooter game built for web browsers with first-class support for iPhone (mobile Safari & standalone PWA). It brings classic arcade Asteroids gameplay with smooth 60fps canvas rendering, responsive virtual dual-touch controls, procedural particle explosions, dynamic audio effects using the Web Audio API, and full offline/PWA installability.

---

## 2. Core Game Mechanics & Acceptance Criteria

### 2.1 Ship Physics & Controls
- **Inertial Momentum**: Ship accelerates forward in direction of heading; retains momentum with subtle space drag.
- **Rotation**: Smooth rotation left/right.
- **Screen Wrapping**: Ship and asteroids wrap smoothly across screen boundaries with zero teleport glitches.
- **Hyperspace**: Quick button to randomly teleport ship with slight risk of spawning into an asteroid.
- **Shields / Invulnerability**: 3-second spawn shield with glowing vector outline.

### 2.2 Shooting & Weapons
- **Primary Laser**: Fire up to 4 simultaneous laser bolts with range limit and cooldown timer.
- **Collision Detection**: Circle/polygon collision between laser bolts and asteroids.

### 2.3 Asteroid Lifecycle & Splitting
- **Asteroid Sizes**: Large (worth 20 pts) -> splits into 2 Medium (50 pts) -> splits into 2 Small (100 pts) -> destroyed.
- **Irregular Vector Geometry**: Asteroids rendered as randomized jagged vector polygons with rotation.
- **Waves & Difficulty**: Clearing all asteroids triggers the next wave with +1 initial large asteroid and faster speed.

### 2.4 Mobile (iPhone) Experience & PWA
- **Touch Controls**:
  - Left thumb zone: Floating virtual joystick or Left/Right rotation buttons.
  - Right thumb zone: Dedicated Thrust and Fire buttons with visual feedback and haptic vibration (`navigator.vibrate` if supported).
- **Responsive Viewport**: Adapts dynamically to iPhone screen dimensions, safe-area insets (notch / Dynamic Island), landscape and portrait orientations.
- **PWA Manifest & Service Worker**:
  - `manifest.json` with `display: "standalone"`, `orientation: "any"`, icons, and theme color `#0b0f19`.
  - Service worker caching core assets for full offline playability.

### 2.5 Sound & Visual Effects
- **Web Audio Synthesizer**: Procedurally synthesized retro sound effects (Thrust hum, Fire pew, Explosion rumble, Hyperspace warp, Level clear chime) with zero external audio asset dependencies.
- **Vector Glow Visuals**: Glowing neon lines, starfield parallax background, particle sparks on explosion.

### 2.6 High Score & Local State
- Persists High Score and audio settings in `localStorage`.

---

## 3. Technical Architecture
- **Language**: TypeScript (strict mode).
- **Rendering**: HTML5 2D Canvas with high-DPI (Retina) scaling support.
- **Audio**: Web Audio API `AudioContext` with synthesized oscillators and noise generators.
- **Bundler / Test**: Vite + Vitest.
