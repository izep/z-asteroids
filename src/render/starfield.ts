import { randRange } from '../math';

interface Star {
  x: number;
  y: number;
  speed: number;  // fraction of "base" drift per second
  size: number;
  alpha: number;
}

/** Two parallax layers of stars that gently drift. */
export function createStarfield(width: number, height: number) {
  const layers: Star[][] = [[], []];

  function populate(w: number, h: number): void {
    layers[0].length = 0;
    layers[1].length = 0;

    // far layer: 80 dim small stars (drift slowly)
    for (let i = 0; i < 80; i++) {
      layers[0].push({
        x: randRange(0, w),
        y: randRange(0, h),
        speed: 0.015,
        size: 0.6,
        alpha: randRange(0.2, 0.5),
      });
    }
    // near layer: 40 brighter stars (drift a bit faster)
    for (let i = 0; i < 40; i++) {
      layers[1].push({
        x: randRange(0, w),
        y: randRange(0, h),
        speed: 0.04,
        size: 1.2,
        alpha: randRange(0.4, 0.8),
      });
    }
  }

  populate(width, height);

  function resize(w: number, h: number): void {
    populate(w, h);
  }

  function update(dt: number, w: number, h: number): void {
    for (const layer of layers) {
      for (const s of layer) {
        s.y += s.speed * h * dt;
        if (s.y > h) { s.y -= h; s.x = randRange(0, w); }
      }
    }
  }

  function draw(ctx: CanvasRenderingContext2D): void {
    for (const layer of layers) {
      for (const s of layer) {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  return { update, draw, resize };
}
