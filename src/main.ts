import { Game } from './game';

// Query canvas
const canvasEl = document.getElementById('game-canvas');
if (!(canvasEl instanceof HTMLCanvasElement)) {
  throw new Error('Could not find #game-canvas element in DOM');
}
const canvas: HTMLCanvasElement = canvasEl;

const container = document.getElementById('game-container');

function getSize(): { width: number; height: number } {
  const w = container ? container.clientWidth : window.innerWidth;
  const h = container ? container.clientHeight : window.innerHeight;
  return {
    width: w || window.innerWidth,
    height: h || window.innerHeight,
  };
}

function applyDpr(c: HTMLCanvasElement, width: number, height: number): void {
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.round(width * dpr);
  c.height = Math.round(height * dpr);
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

// Expose for e2e / Playwright access
declare global {
  interface Window { __game: Game; }
}

const { width, height } = getSize();
applyDpr(canvas, width, height);

const game = new Game({ canvas, width, height });
game.start();
window.__game = game;


// Handle resize and orientation change
function onResize(): void {
  const { width: w, height: h } = getSize();
  applyDpr(canvas, w, h);
  game.resize(w, h);
}

window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

// Register service worker for offline play
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failure is non-fatal
    });
  });
}
