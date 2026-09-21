import { ScoreState } from '../sim/score';

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: ScoreState,
  muted: boolean,
  width: number,
  _height: number,
): void {
  ctx.save();
  ctx.fillStyle = '#aaffee';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${state.score}`, 16, 30);
  ctx.textAlign = 'right';
  ctx.fillText(`HI  ${state.highScore}`, width - 16, 30);
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE  ${state.wave}`, width / 2, 30);

  // Lives as small triangles
  for (let i = 0; i < state.lives; i++) {
    drawLifeIcon(ctx, 20 + i * 22, 52);
  }

  // Mute hint
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '12px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(muted ? '[M] unmute' : '[M] mute', width - 16, _height - 12);
  ctx.restore();
}

function drawLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - 7);
  ctx.lineTo(x - 5, y + 5);
  ctx.lineTo(x - 2, y + 2);
  ctx.lineTo(x + 2, y + 2);
  ctx.lineTo(x + 5, y + 5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.fillText('GAME OVER', width / 2, height / 2 - 40);

  ctx.fillStyle = '#aaffee';
  ctx.font = '22px monospace';
  ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 10);
  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#ffee44';
    ctx.fillText('NEW HIGH SCORE!', width / 2, height / 2 + 42);
  } else {
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`Best: ${highScore}`, width / 2, height / 2 + 42);
  }

  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.7;
  ctx.font = '16px monospace';
  ctx.fillText('Press ENTER or tap to restart', width / 2, height / 2 + 80);
  ctx.restore();
}

export function drawWaveBanner(
  ctx: CanvasRenderingContext2D,
  wave: number,
  alpha: number,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#aaffee';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE  ${wave}`, width / 2, height / 2);
  ctx.restore();
}

export function drawTouchControls(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  leftActive: boolean,
  rightActive: boolean,
  thrustActive: boolean,
  fireActive: boolean,
): void {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#aaffee';
  ctx.lineWidth = 1;
  ctx.font = '13px monospace';
  ctx.fillStyle = '#aaffee';

  // Left zone: rotate left/right labels
  ctx.textAlign = 'center';
  ctx.globalAlpha = leftActive ? 0.55 : 0.2;
  ctx.fillText('◀  ROT  ▶', width * 0.25, height - 30);

  // Right zone: Thrust + Fire
  ctx.textAlign = 'center';
  ctx.globalAlpha = thrustActive ? 0.55 : 0.2;
  ctx.fillText('▲ THRUST', width * 0.62, height - 55);
  ctx.globalAlpha = fireActive ? 0.55 : 0.2;
  ctx.fillText('● FIRE', width * 0.85, height - 55);

  ctx.globalAlpha = rightActive ? 0.55 : 0.2;
  ctx.fillText('right zone', width * 0.75, height - 30);

  ctx.restore();
}
