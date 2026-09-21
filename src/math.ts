// Pure math utilities — no browser APIs, fully testable in Node/Vitest.

export interface Vec2 {
  x: number;
  y: number;
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function magnitude(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vec2): Vec2 {
  const m = magnitude(v);
  if (m === 0) return { x: 0, y: 0 };
  return { x: v.x / m, y: v.y / m };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** Wrap x into [0, max). */
export function wrapScalar(x: number, max: number): number {
  return ((x % max) + max) % max;
}

/** Wrap a Vec2 into the rectangle [0, w) × [0, h). */
export function wrapVec2(v: Vec2, w: number, h: number): Vec2 {
  return { x: wrapScalar(v.x, w), y: wrapScalar(v.y, h) };
}

/** Clamp a value into [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Random float in [min, max). */
export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random integer in [min, max] inclusive. */
export function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

/** Rotate a point around the origin by `angle` radians. */
export function rotatePoint(p: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
}

/** Transform local polygon vertices to world space. */
export function transformPoly(verts: Vec2[], pos: Vec2, angle: number): Vec2[] {
  return verts.map((v) => {
    const r = rotatePoint(v, angle);
    return { x: r.x + pos.x, y: r.y + pos.y };
  });
}
