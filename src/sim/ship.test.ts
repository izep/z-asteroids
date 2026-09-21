import { describe, it, expect } from 'vitest';
import { createShip, integrateShip, ShipInput } from './ship';

const W = 800;
const H = 600;

function makeInput(partial: Partial<ShipInput> = {}): ShipInput {
  return {
    rotating: partial.rotating ?? 0,
    thrusting: partial.thrusting ?? false,
    hyperspace: partial.hyperspace ?? false,
  };
}

describe('ship', () => {
  it('thrust changes velocity along heading', () => {
    const ship = createShip(W / 2, H / 2);
    ship.angle = 0; // pointing right (+X)
    const before = { vx: ship.vx, vy: ship.vy };
    integrateShip(ship, makeInput({ thrusting: true }), 0.1, W, H);
    expect(ship.vx).toBeGreaterThan(before.vx);
    expect(Math.abs(ship.vy)).toBeLessThan(1); // vy stays ~0
  });

  it('drag reduces speed over time', () => {
    const ship = createShip(W / 2, H / 2);
    ship.vx = 200;
    ship.vy = 0;
    // Integrate many frames without thrusting
    for (let i = 0; i < 60; i++) {
      integrateShip(ship, makeInput(), 1 / 60, W, H);
    }
    expect(Math.hypot(ship.vx, ship.vy)).toBeLessThan(200);
  });

  it('rotation changes angle', () => {
    const ship = createShip(W / 2, H / 2);
    const before = ship.angle;
    integrateShip(ship, makeInput({ rotating: 1 }), 0.5, W, H);
    expect(ship.angle).toBeGreaterThan(before);
  });

  it('wrap at edges keeps ship in bounds', () => {
    const ship = createShip(5, 5);
    ship.vx = -200;
    ship.vy = -200;
    integrateShip(ship, makeInput(), 0.5, W, H);
    expect(ship.x).toBeGreaterThanOrEqual(0);
    expect(ship.x).toBeLessThan(W);
    expect(ship.y).toBeGreaterThanOrEqual(0);
    expect(ship.y).toBeLessThan(H);
  });

  it('shield timer counts down', () => {
    const ship = createShip(W / 2, H / 2);
    expect(ship.shieldTimer).toBeGreaterThan(0);
    integrateShip(ship, makeInput(), 1.5, W, H);
    expect(ship.shieldTimer).toBeLessThan(ship.shieldTimer + 1.5);
  });

  it('does not integrate when dead', () => {
    const ship = createShip(100, 100);
    ship.dead = true;
    ship.vx = 500;
    const xBefore = ship.x;
    integrateShip(ship, makeInput(), 1.0, W, H);
    expect(ship.x).toBe(xBefore);
  });
});
