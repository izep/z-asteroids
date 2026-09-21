import { Vec2, transformPoly } from '../math';

// ---------------------------------------------------------------------------
// Circle vs circle broadphase
// ---------------------------------------------------------------------------

export function circlesOverlap(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const dist2 = dx * dx + dy * dy;
  const radSum = ar + br;
  return dist2 < radSum * radSum;
}

// ---------------------------------------------------------------------------
// Point in convex polygon (works for our jagged asteroids)
// ---------------------------------------------------------------------------

/** Returns true when point (px,py) is inside the polygon defined by worldVerts. */
export function pointInPolygon(px: number, py: number, worldVerts: Vec2[]): boolean {
  const n = worldVerts.length;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = worldVerts[i].x, yi = worldVerts[i].y;
    const xj = worldVerts[j].x, yj = worldVerts[j].y;
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ---------------------------------------------------------------------------
// Circle vs polygon narrowphase
// ---------------------------------------------------------------------------

/** Signed distance from point P to the line segment AB. Used for edge tests. */
function distPointToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Circle vs polygon collision.
 * The polygon is given as local-space verts + position + angle.
 * Returns true if the circle overlaps the polygon.
 */
export function circleVsPolygon(
  cx: number, cy: number, cr: number,
  polyVerts: Vec2[], polyX: number, polyY: number, polyAngle: number,
): boolean {
  const world = transformPoly(polyVerts, { x: polyX, y: polyY }, polyAngle);

  // 1. Centre inside polygon?
  if (pointInPolygon(cx, cy, world)) return true;

  // 2. Circle overlaps any edge?
  const n = world.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (distPointToSegment(cx, cy, world[i].x, world[i].y, world[j].x, world[j].y) < cr) {
      return true;
    }
  }

  return false;
}
