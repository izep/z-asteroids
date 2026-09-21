import { describe, it, expect } from 'vitest';
import {
  wrapScalar,
  wrapVec2,
  clamp,
  magnitude,
  normalize,
  rotatePoint,
  randRange,
} from './math';

describe('math', () => {
  describe('wrapScalar', () => {
    it('returns the value when already in range', () => {
      expect(wrapScalar(5, 10)).toBeCloseTo(5);
    });

    it('wraps a value above max back to near 0', () => {
      expect(wrapScalar(15, 10)).toBeCloseTo(5);
    });

    it('wraps a negative value to near max', () => {
      expect(wrapScalar(-3, 10)).toBeCloseTo(7);
    });

    it('wraps exactly at max back to 0', () => {
      expect(wrapScalar(10, 10)).toBeCloseTo(0);
    });
  });

  describe('wrapVec2', () => {
    it('wraps both axes independently', () => {
      const r = wrapVec2({ x: 110, y: -10 }, 100, 200);
      expect(r.x).toBeCloseTo(10);
      expect(r.y).toBeCloseTo(190);
    });

    it('leaves in-range values unchanged', () => {
      const r = wrapVec2({ x: 50, y: 80 }, 100, 200);
      expect(r.x).toBeCloseTo(50);
      expect(r.y).toBeCloseTo(80);
    });
  });

  describe('clamp', () => {
    it('returns min when value is below', () => expect(clamp(-5, 0, 10)).toBe(0));
    it('returns max when value is above', () => expect(clamp(20, 0, 10)).toBe(10));
    it('returns the value when in range', () => expect(clamp(5, 0, 10)).toBe(5));
  });

  describe('magnitude', () => {
    it('returns 0 for zero vector', () => expect(magnitude({ x: 0, y: 0 })).toBe(0));
    it('returns 5 for a 3-4-5 triangle', () => expect(magnitude({ x: 3, y: 4 })).toBeCloseTo(5));
  });

  describe('normalize', () => {
    it('returns zero vector for zero input', () => {
      const r = normalize({ x: 0, y: 0 });
      expect(r.x).toBe(0);
      expect(r.y).toBe(0);
    });

    it('returns a unit vector', () => {
      const r = normalize({ x: 3, y: 4 });
      expect(magnitude(r)).toBeCloseTo(1);
    });
  });

  describe('rotatePoint', () => {
    it('rotates (1,0) by 90 degrees to (0,1)', () => {
      const r = rotatePoint({ x: 1, y: 0 }, Math.PI / 2);
      expect(r.x).toBeCloseTo(0);
      expect(r.y).toBeCloseTo(1);
    });

    it('rotates (0,1) by -90 degrees to (1,0)', () => {
      const r = rotatePoint({ x: 0, y: 1 }, -Math.PI / 2);
      expect(r.x).toBeCloseTo(1);
      expect(r.y).toBeCloseTo(0);
    });
  });

  describe('randRange', () => {
    it('returns values within the specified range', () => {
      for (let i = 0; i < 50; i++) {
        const v = randRange(5, 10);
        expect(v).toBeGreaterThanOrEqual(5);
        expect(v).toBeLessThan(10);
      }
    });
  });
});
