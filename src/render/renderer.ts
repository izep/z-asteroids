import { Ship, shipVertices, thrustVertices } from '../sim/ship';
import { Asteroid } from '../sim/asteroid';
import { Projectile } from '../sim/projectile';
import { Particle } from '../sim/particles';
import { transformPoly, Vec2 } from '../math';

// ---------------------------------------------------------------------------
// Helper: draw a glow stroke (wide faint pass + narrow bright pass)
// ---------------------------------------------------------------------------

function glowStroke(
  ctx: CanvasRenderingContext2D,
  color: string,
  glowColor: string,
  lineWidth: number,
  fn: () => void,
): void {
  // glow pass
  ctx.save();
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = lineWidth * 4;
  ctx.globalAlpha = 0.18;
  ctx.shadowBlur = 0;
  fn();
  ctx.stroke();
  ctx.restore();

  // core pass
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = 1;
  fn();
  ctx.stroke();
  ctx.restore();
}

function polyPath(ctx: CanvasRenderingContext2D, verts: Vec2[]): void {
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Draw wrap ghosts: re-draws any object that straddles a screen edge
// ---------------------------------------------------------------------------

function withWrapOffsets(
  x: number,
  y: number,
  r: number,
  w: number,
  h: number,
  draw: (ox: number, oy: number) => void,
): void {
  const offsets: [number, number][] = [[0, 0]];
  if (x - r < 0)  offsets.push([w, 0]);
  if (x + r > w)  offsets.push([-w, 0]);
  if (y - r < 0)  offsets.push([0, h]);
  if (y + r > h)  offsets.push([0, -h]);
  if (x - r < 0 && y - r < 0) offsets.push([w, h]);
  if (x + r > w && y - r < 0) offsets.push([-w, h]);
  if (x - r < 0 && y + r > h) offsets.push([w, -h]);
  if (x + r > w && y + r > h) offsets.push([-w, -h]);
  for (const [ox, oy] of offsets) draw(ox, oy);
}

// ---------------------------------------------------------------------------
// Public renderer
// ---------------------------------------------------------------------------

export function drawShip(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  thrusting: boolean,
  width: number,
  height: number,
  now: number,
): void {
  const verts = transformPoly(shipVertices(), { x: ship.x, y: ship.y }, ship.angle);

  const drawShipAt = (ox: number, oy: number): void => {
    const shifted = verts.map((v) => ({ x: v.x + ox, y: v.y + oy }));
    glowStroke(ctx, '#00ffcc', '#00ffcc', 1.5, () => polyPath(ctx, shifted));

    // Shield
    if (ship.shieldTimer > 0) {
      const pulse = Math.sin(now * 6) * 0.3 + 0.7;
      ctx.save();
      ctx.globalAlpha = pulse * 0.6;
      ctx.strokeStyle = '#44ddff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ship.x + ox, ship.y + oy, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Thruster flame (flicker)
    if (thrusting) {
      const flicker = randFlicker();
      const tverts = thrustVertices().map((v) => ({
        x: v.x * flicker,
        y: v.y * flicker,
      }));
      const tw = transformPoly(tverts, { x: ship.x + ox, y: ship.y + oy }, ship.angle);
      glowStroke(ctx, '#ff8800', '#ffaa00', 1.5, () => polyPath(ctx, tw));
    }
  };

  withWrapOffsets(ship.x, ship.y, 18, width, height, drawShipAt);
}

function randFlicker(): number {
  return 0.8 + Math.random() * 0.4;
}

export function drawAsteroid(
  ctx: CanvasRenderingContext2D,
  a: Asteroid,
  width: number,
  height: number,
): void {
  const world = transformPoly(a.verts, { x: a.x, y: a.y }, a.angle);

  const drawAt = (ox: number, oy: number): void => {
    const shifted = world.map((v) => ({ x: v.x + ox, y: v.y + oy }));
    glowStroke(ctx, '#9966ff', '#6633cc', 1.5, () => polyPath(ctx, shifted));
  };

  withWrapOffsets(a.x, a.y, a.radius * 1.3, width, height, drawAt);
}

export function drawBolt(ctx: CanvasRenderingContext2D, b: Projectile): void {
  const len = 6;
  const ex = b.x - Math.cos(Math.atan2(b.vy, b.vx)) * len;
  const ey = b.y - Math.sin(Math.atan2(b.vy, b.vx)) * len;

  glowStroke(ctx, '#ffee44', '#ffcc00', 2, () => {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(ex, ey);
  });
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const alpha = Math.max(0, p.life / p.maxLife);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
