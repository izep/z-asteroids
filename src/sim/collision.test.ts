import { describe, it, expect } from 'vitest';
import { circlesOverlap, circleVsPolygon, pointInPolygon } from './collision';

describe('collision', () => {
  describe('circlesOverlap', () => {
    it('returns true for overlapping circles', () => {
      expect(circlesOverlap(0, 0, 10, 5, 0, 10)).toBe(true);
    });

    it('returns false for separated circles', () => {
      expect(circlesOverlap(0, 0, 5, 20, 0, 5)).toBe(false);
    });

    it('returns true when circles just touch', () => {
      // distance = 10, sum of radii = 10 (should be < not <=, so false at exact touch)
      expect(circlesOverlap(0, 0, 5, 10, 0, 5)).toBe(false);
    });

    it('returns true when one circle contains the other', () => {
      expect(circlesOverlap(0, 0, 20, 1, 0, 2)).toBe(true);
    });
  });

  describe('pointInPolygon', () => {
    // Triangle: (0,0), (10,0), (5,10)
    const triangle = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
    ];

    it('returns true for a point inside the triangle', () => {
      expect(pointInPolygon(5, 4, triangle)).toBe(true);
    });

    it('returns false for a point outside the triangle', () => {
      expect(pointInPolygon(0, 10, triangle)).toBe(false);
    });

    it('returns false for a point clearly outside', () => {
      expect(pointInPolygon(100, 100, triangle)).toBe(false);
    });
  });

  describe('circleVsPolygon', () => {
    // Square at origin, side 20: verts at (±10, ±10)
    const square = [
      { x: -10, y: -10 },
      { x:  10, y: -10 },
      { x:  10, y:  10 },
      { x: -10, y:  10 },
    ];

    it('detects circle centre inside polygon', () => {
      expect(circleVsPolygon(0, 0, 3, square, 0, 0, 0)).toBe(true);
    });

    it('detects circle overlapping an edge', () => {
      // Circle centred just outside the right edge
      expect(circleVsPolygon(13, 0, 5, square, 0, 0, 0)).toBe(true);
    });

    it('returns false when circle is far away', () => {
      expect(circleVsPolygon(100, 100, 3, square, 0, 0, 0)).toBe(false);
    });

    it('returns false when circle is just outside an edge', () => {
      expect(circleVsPolygon(20, 0, 5, square, 0, 0, 0)).toBe(false);
    });
  });
});
