import { Vec2, wrapVec2 } from '../math';

export interface Ship {
  x: number;
  y: number;
  angle: number;   // radians; 0 = pointing up (negative Y)
  vx: number;
  vy: number;
  shieldTimer: number;   // seconds remaining of invulnerability
  hyperspaceTimer: number; // cooldown seconds remaining
  dead: boolean;
}

const THRUST_ACCEL = 200;       // px/s²
const DRAG = 0.985;             // velocity multiplier per second (applied as drag^dt)
const ROTATE_SPEED = 3.5;       // rad/s
const SPAWN_SHIELD = 3.0;       // seconds
const HYPERSPACE_COOLDOWN = 3.0; // seconds

export function createShip(x: number, y: number): Ship {
  return {
    x,
    y,
    angle: -Math.PI / 2, // pointing up
    vx: 0,
    vy: 0,
    shieldTimer: SPAWN_SHIELD,
    hyperspaceTimer: 0,
    dead: false,
  };
}

export interface ShipInput {
  rotating: -1 | 0 | 1;  // -1 = left, 1 = right
  thrusting: boolean;
  hyperspace: boolean;
}

export function integrateShip(
  ship: Ship,
  input: ShipInput,
  dt: number,
  width: number,
  height: number,
): void {
  if (ship.dead) return;

  // Rotation
  ship.angle += input.rotating * ROTATE_SPEED * dt;

  // Thrust
  if (input.thrusting) {
    ship.vx += Math.cos(ship.angle) * THRUST_ACCEL * dt;
    ship.vy += Math.sin(ship.angle) * THRUST_ACCEL * dt;
  }

  // Drag
  const dragFactor = Math.pow(DRAG, dt * 60);
  ship.vx *= dragFactor;
  ship.vy *= dragFactor;

  // Integrate position
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  // Wrap
  const wrapped = wrapVec2({ x: ship.x, y: ship.y }, width, height);
  ship.x = wrapped.x;
  ship.y = wrapped.y;

  // Timers
  if (ship.shieldTimer > 0) ship.shieldTimer = Math.max(0, ship.shieldTimer - dt);
  if (ship.hyperspaceTimer > 0) ship.hyperspaceTimer = Math.max(0, ship.hyperspaceTimer - dt);
}

export function hyperspaceShip(
  ship: Ship,
  width: number,
  height: number,
): void {
  if (ship.hyperspaceTimer > 0 || ship.dead) return;
  ship.x = Math.random() * width;
  ship.y = Math.random() * height;
  ship.vx = 0;
  ship.vy = 0;
  ship.hyperspaceTimer = HYPERSPACE_COOLDOWN;
  // intentionally no shield
}

/** Local-space vertices for the ship triangle (tip pointing in +X direction before rotation). */
export function shipVertices(): Vec2[] {
  return [
    { x: 12, y: 0 },   // nose
    { x: -10, y: 8 },  // bottom-left wing
    { x: -6, y: 0 },   // tail centre
    { x: -10, y: -8 }, // top-right wing
  ];
}

/** Local-space vertices for the thruster flame. */
export function thrustVertices(): Vec2[] {
  return [
    { x: -6, y: 4 },
    { x: -14, y: 0 },
    { x: -6, y: -4 },
  ];
}

export { SPAWN_SHIELD };
