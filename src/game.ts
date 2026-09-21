/**
 * Game — state machine + rAF loop.
 *
 * States: boot → playing → respawning → gameover → playing (restart)
 *
 * Constructor accepts GameOptions so tests can run headless (no canvas).
 */

import { createStorage, GameStorage } from './storage';
import { createAudio, AudioManager } from './audio';
import { createKeyboardInput } from './input/keyboard';
import { createTouchInput } from './input/touch';
import { InputState } from './input/keyboard';

import { createShip, integrateShip, hyperspaceShip, Ship } from './sim/ship';
import {
  Asteroid,
  integrateAsteroids,
  spawnWaveAsteroids,
  splitAsteroid,
  SCORES,
} from './sim/asteroid';
import { createProjectileManager, ProjectileManager } from './sim/projectile';
import { createParticleSystem, ParticleSystem } from './sim/particles';
import { createScoreState, addScore, loseLife, nextWave, isGameOver, resetScore, ScoreState } from './sim/score';
import { circlesOverlap, circleVsPolygon } from './sim/collision';

import { createStarfield } from './render/starfield';
import { drawShip, drawAsteroid, drawBolt, drawParticle } from './render/renderer';
import { drawHUD, drawGameOver, drawWaveBanner, drawTouchControls } from './render/hud';

export type GameOptions = {
  canvas?: HTMLCanvasElement;
  width: number;
  height: number;
  now?: () => number;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  audio?: boolean;
};

type GameState = 'boot' | 'playing' | 'respawning' | 'gameover';

const RESPAWN_DELAY = 2.0; // seconds
const WAVE_CLEAR_DELAY = 2.5; // seconds — time between wave clear and next wave start
const SHIP_RADIUS = 10;

export class Game {
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private width: number;
  private height: number;
  private getNow: () => number;

  private storage: GameStorage;
  private audio: AudioManager;

  private keyboard: ReturnType<typeof createKeyboardInput> | null;
  private touch: ReturnType<typeof createTouchInput> | null;

  private ship: Ship;
  private asteroids: Asteroid[];
  private projectiles: ProjectileManager;
  private particles: ParticleSystem;
  private scoreState: ScoreState;

  private state: GameState = 'boot';
  private respawnTimer = 0;
  private waveClearTimer = 0;
  private waveBannerAlpha = 0;
  private speedMultiplier = 1.0;

  private starfield: ReturnType<typeof createStarfield> | null;
  private rafId: number | null = null;

  private lastTime = 0;
  private muted: boolean;


  constructor(opts: GameOptions) {
    this.canvas = opts.canvas ?? null;
    this.ctx = this.canvas?.getContext('2d') ?? null;
    this.width = opts.width;
    this.height = opts.height;
    this.getNow = opts.now ?? (() => performance.now());

    // Storage
    this.storage = opts.storage
      ? createStorage(opts.storage)
      : createStorage();

    // Audio (disabled in tests by default)
    const useAudio = opts.audio ?? (typeof AudioContext !== 'undefined');
    this.audio = createAudio();
    this.muted = this.storage.getMuted();
    if (useAudio) this.audio.setMuted(this.muted);
    else this.audio.setMuted(true);

    // Input
    if (this.canvas) {
      this.keyboard = createKeyboardInput();
      this.touch = createTouchInput(this.canvas);
    } else {
      this.keyboard = null;
      this.touch = null;
    }

    // Sim
    this.ship = createShip(this.width / 2, this.height / 2);
    this.asteroids = [];
    this.projectiles = createProjectileManager();
    this.particles = createParticleSystem();
    this.scoreState = createScoreState(this.storage.getHighScore());
    this.speedMultiplier = 1.0;

    // Render
    this.starfield = this.canvas ? createStarfield(this.width, this.height) : null;
  }

  /** Attach input, enter playing state, start rAF loop. */
  start(): void {
    this.keyboard?.attach();
    this.touch?.attach();

    this.beginWave();
    this.state = 'playing';
    this.waveBannerAlpha = 1;

    if (this.canvas) {
      this.lastTime = this.getNow();
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  /** Called from main.ts on resize/orientationchange. */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.starfield?.resize(width, height);
  }

  stop(): void {
    this.keyboard?.detach();
    this.touch?.detach();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------------

  private loop = (ts: number): void => {
    const rawDt = (ts - this.lastTime) / 1000;
    this.lastTime = ts;
    const dt = Math.min(rawDt, 1 / 20); // clamp for tab throttle

    this.tick(dt, ts / 1000);
    this.render(ts / 1000);

    this.rafId = requestAnimationFrame(this.loop);
  };

  // ---------------------------------------------------------------------------
  // Tick (simulation)
  // ---------------------------------------------------------------------------

  private tick(dt: number, now: number): void {
    // Merge input
    const input = this.mergeInput();

    // Handle global one-shots
    if (input.mute) {
      this.muted = !this.muted;
      this.audio.setMuted(this.muted);
      this.storage.saveMuted(this.muted);
    }

    // Resume AudioContext on first interaction
    if (input.firing || input.thrusting || input.rotating !== 0) {
      this.audio.resume();
    }

    // State machine
    switch (this.state) {
      case 'playing':
        this.tickPlaying(input, dt, now);
        break;
      case 'respawning':
        this.tickRespawning(input, dt);
        break;
      case 'gameover':
        this.tickGameover(input);
        break;
    }

    // Always tick particles
    this.particles.integrate(dt);

    // Wave banner fade
    if (this.waveBannerAlpha > 0) {
      this.waveBannerAlpha = Math.max(0, this.waveBannerAlpha - dt * 0.6);
    }

    // Starfield
    this.starfield?.update(dt, this.width, this.height);
  }

  private tickPlaying(input: InputState, dt: number, _now: number): void {
    // Wave-clear countdown
    if (this.asteroids.length === 0 && this.waveClearTimer <= 0) {
      this.waveClearTimer = WAVE_CLEAR_DELAY;
      this.audio.playWaveClear();
    }
    if (this.waveClearTimer > 0) {
      this.waveClearTimer -= dt;
      if (this.waveClearTimer <= 0) {
        nextWave(this.scoreState);
        this.speedMultiplier = 1.0 + (this.scoreState.wave - 1) * 0.12;
        this.beginWave();
        this.waveBannerAlpha = 1;
      }
    }

    // Ship input
    integrateShip(this.ship, input, dt, this.width, this.height);

    // Hyperspace
    if (input.hyperspace) {
      hyperspaceShip(this.ship, this.width, this.height);
      this.audio.playHyperspace();
    }

    // Thrust audio
    if (input.thrusting && !this.ship.dead) {
      this.audio.startThrust();
    } else {
      this.audio.stopThrust();
    }

    // Fire
    if (input.firing) {
      const bolt = this.projectiles.tryFire(
        this.ship.x, this.ship.y, this.ship.angle,
        this.ship.vx, this.ship.vy,
      );
      if (bolt) {
        this.audio.playFire();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(8); } catch { /* ignore */ }
        }
      }
    }

    // Integrate projectiles
    this.projectiles.integrate(dt, this.width, this.height);

    // Integrate asteroids
    integrateAsteroids(this.asteroids, dt, this.width, this.height);

    // Collision: bolts vs asteroids
    const bolts = this.projectiles.getBolts();
    const toRemoveBolts: number[] = [];
    const toSplitAsteroids: number[] = [];

    for (const bolt of bolts) {
      for (let ai = 0; ai < this.asteroids.length; ai++) {
        const a = this.asteroids[ai];
        if (
          circlesOverlap(bolt.x, bolt.y, 3, a.x, a.y, a.radius) &&
          circleVsPolygon(bolt.x, bolt.y, 3, a.verts, a.x, a.y, a.angle)
        ) {
          if (!toRemoveBolts.includes(bolt.id)) toRemoveBolts.push(bolt.id);
          if (!toSplitAsteroids.includes(ai)) toSplitAsteroids.push(ai);
        }
      }
    }

    // Process hits (from highest index down to preserve indices)
    toSplitAsteroids.sort((a, b) => b - a);
    for (const ai of toSplitAsteroids) {
      const a = this.asteroids[ai];
      addScore(this.scoreState, a.size);
      this.storage.saveHighScore(this.scoreState.highScore);
      this.particles.spawnExplosion(a.x, a.y,
        a.size === 'large' ? 20 : a.size === 'medium' ? 12 : 6,
        a.size === 'large' ? 120 : a.size === 'medium' ? 80 : 50);
      this.audio.playExplosion(a.size);
      const children = splitAsteroid(a, this.speedMultiplier);
      this.asteroids.splice(ai, 1);
      this.asteroids.push(...children);
    }
    for (const id of toRemoveBolts) {
      this.projectiles.removeBolt(id);
    }

    // Collision: ship vs asteroids
    if (this.ship.shieldTimer <= 0 && !this.ship.dead) {
      for (const a of this.asteroids) {
        if (
          circlesOverlap(this.ship.x, this.ship.y, SHIP_RADIUS, a.x, a.y, a.radius) &&
          circleVsPolygon(this.ship.x, this.ship.y, SHIP_RADIUS, a.verts, a.x, a.y, a.angle)
        ) {
          this.onShipDeath();
          break;
        }
      }
    }

    // Update score state high score
    if (this.scoreState.score > this.scoreState.highScore) {
      this.scoreState.highScore = this.scoreState.score;
      this.storage.saveHighScore(this.scoreState.highScore);
    }
  }

  private tickRespawning(input: InputState, dt: number): void {
    this.respawnTimer -= dt;
    integrateAsteroids(this.asteroids, dt, this.width, this.height);
    this.projectiles.integrate(dt, this.width, this.height);

    if (this.respawnTimer <= 0) {
      if (isGameOver(this.scoreState)) {
        this.state = 'gameover';
        this.audio.stopThrust();
      } else {
        this.respawnShip();
        this.state = 'playing';
      }
    }
    // suppress unused input warnings
    void input;
  }

  private tickGameover(input: InputState): void {
    if (input.restart) {
      this.restartGame();
    }
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  private onShipDeath(): void {
    this.ship.dead = true;
    this.particles.spawnExplosion(this.ship.x, this.ship.y, 25, 150);
    this.audio.playExplosion('large');
    this.audio.stopThrust();
    loseLife(this.scoreState);
    this.respawnTimer = RESPAWN_DELAY;
    this.state = 'respawning';
    this.projectiles.reset();
  }

  private respawnShip(): void {
    this.ship = createShip(this.width / 2, this.height / 2);
  }

  private beginWave(): void {
    this.asteroids = spawnWaveAsteroids(this.scoreState.wave, this.width, this.height);
    this.waveClearTimer = 0;
    this.projectiles.reset();
  }

  private restartGame(): void {
    resetScore(this.scoreState);
    this.scoreState.highScore = this.storage.getHighScore();
    this.speedMultiplier = 1.0;
    this.ship = createShip(this.width / 2, this.height / 2);
    this.particles.clear();
    this.beginWave();
    this.state = 'playing';
    this.waveBannerAlpha = 1;
  }

  // ---------------------------------------------------------------------------
  // Input merge
  // ---------------------------------------------------------------------------

  private mergeInput(): InputState {
    const kb = this.keyboard?.snapshot() ?? {
      rotating: 0 as const, thrusting: false, firing: false,
      hyperspace: false, restart: false, mute: false,
    };
    const tc = this.touch?.snapshot() ?? {};

    // Merge: touch overrides if any touch is active
    const rotating: -1 | 0 | 1 = (tc.rotating ?? 0) !== 0
      ? (tc.rotating as -1 | 0 | 1)
      : kb.rotating;

    return {
      rotating,
      thrusting: (tc.thrusting ?? false) || kb.thrusting,
      firing: (tc.firing ?? false) || kb.firing,
      hyperspace: (tc.hyperspace ?? false) || kb.hyperspace,
      restart: (tc.restart ?? false) || kb.restart,
      mute: (tc.mute ?? false) || kb.mute,
    };
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  private render(now: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    // Starfield
    this.starfield?.draw(ctx);

    // Particles
    for (const p of this.particles.getParticles()) {
      drawParticle(ctx, p);
    }

    // Asteroids
    for (const a of this.asteroids) {
      drawAsteroid(ctx, a, w, h);
    }

    // Bolts
    for (const b of this.projectiles.getBolts()) {
      drawBolt(ctx, b);
    }

    // Ship (if alive or still dying)
    if (!this.ship.dead || this.state === 'respawning') {
      const input = this.mergeInput();
      const thrusting = input.thrusting;
      if (!this.ship.dead) {
        drawShip(ctx, this.ship, thrusting, w, h, now);
      }
    }

    // HUD
    drawHUD(ctx, this.scoreState, this.muted, w, h);

    // Wave banner
    if (this.waveBannerAlpha > 0) {
      drawWaveBanner(ctx, this.scoreState.wave, this.waveBannerAlpha, w, h);
    }

    // Game over overlay
    if (this.state === 'gameover') {
      drawGameOver(ctx, this.scoreState.score, this.scoreState.highScore, w, h);
    }

    // Touch control hints (subtle)
    const touchActive = this.touch?.getTouchActive();
    if (touchActive || 'ontouchstart' in window) {
      drawTouchControls(
        ctx, w, h,
        touchActive?.left ?? false,
        touchActive?.right ?? false,
        touchActive?.thrust ?? false,
        touchActive?.fire ?? false,
      );
    }
  }

  // Expose for tests
  getState(): GameState { return this.state; }
  getScore(): ScoreState { return this.scoreState; }
  getLives(): number { return this.scoreState.lives; }
  getWave(): number { return this.scoreState.wave; }
  getAsteroids(): Asteroid[] { return this.asteroids; }
  getShip(): Ship { return this.ship; }
  getProjectiles(): ProjectileManager { return this.projectiles; }

  /**
   * Test helper: instantly kill the ship 3 times to reach game-over.
   * No-op unless in playing or respawning state.
   */
  cheatGameOver(): void {
    this.scoreState.lives = 0;
    this.ship.dead = true;
    this.state = 'gameover';
    this.audio.stopThrust();
  }

  /**
   * Test helper: clear all asteroids so the wave-clear timer fires.
   */
  cheatClearAsteroids(): void {
    this.asteroids = [];
  }

  /** Expose SCORES for testing */
  static get SCORES() { return SCORES; }
}