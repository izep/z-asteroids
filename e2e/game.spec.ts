import { test, expect, Page, ConsoleMessage } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all browser console errors on a page for later assertion. */
function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err: Error) => errors.push(err.message));
  return errors;
}

/** Wait until window.__game is available and the game loop has started. */
async function waitForGame(page: Page): Promise<void> {
  await page.waitForFunction(
    () => typeof window.__game !== 'undefined' && window.__game.getState() !== 'boot',
    { timeout: 8_000 },
  );
}

/** Read the current game state string from the browser. */
async function gameState(page: Page): Promise<string> {
  return page.evaluate(() => window.__game.getState());
}

// ---------------------------------------------------------------------------
// Suite 1: Boot & initial render
// ---------------------------------------------------------------------------

test.describe('boot', () => {
  test('page loads without JS errors and canvas is visible', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await waitForGame(page);

    // Canvas must exist and have non-zero dimensions
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);

    // No JS errors on the happy path
    expect(errors).toHaveLength(0);
  });

  test('game starts in playing state immediately', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await waitForGame(page);

    const state = await gameState(page);
    expect(state).toBe('playing');

    expect(errors).toHaveLength(0);
  });

  test('canvas has correct background fill (dark theme)', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);

    // The page background should be the dark colour
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Accepts rgb(11, 15, 25) — the #0b0f19 colour
    expect(bg).toMatch(/rgb\(\s*11,\s*15,\s*25\s*\)/);
  });

  test('manifest.json is reachable', async ({ page }) => {
    const resp = await page.goto('/manifest.json');
    expect(resp?.status()).toBe(200);
    const json = await resp?.json() as Record<string, unknown>;
    expect(json.name).toBe('z-asteroids');
    expect(json.display).toBe('standalone');
  });

  test('service worker script is reachable', async ({ page }) => {
    const resp = await page.goto('/sw.js');
    expect(resp?.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Game state & simulation
// ---------------------------------------------------------------------------

test.describe('gameplay', () => {
  test('asteroids are present at game start', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await waitForGame(page);

    const count = await page.evaluate(() => window.__game.getAsteroids().length);
    expect(count).toBeGreaterThan(0);

    expect(errors).toHaveLength(0);
  });

  test('starts on wave 1 with 3 lives', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await waitForGame(page);

    const wave = await page.evaluate(() => window.__game.getWave());
    const lives = await page.evaluate(() => window.__game.getLives());
    expect(wave).toBe(1);
    expect(lives).toBe(3);

    expect(errors).toHaveLength(0);
  });

  test('keyboard input: thrust key moves ship', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);

    const posBefore = await page.evaluate(() => {
      const s = window.__game.getShip();
      return { x: s.x, y: s.y, vx: s.vx, vy: s.vy };
    });

    // Hold ArrowUp for a moment to thrust
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowUp');

    const posAfter = await page.evaluate(() => {
      const s = window.__game.getShip();
      return { x: s.x, y: s.y, vx: s.vx, vy: s.vy };
    });

    // Velocity or position should have changed
    const moved =
      Math.abs(posAfter.vx - posBefore.vx) > 0.5 ||
      Math.abs(posAfter.vy - posBefore.vy) > 0.5 ||
      Math.abs(posAfter.x - posBefore.x) > 0.5 ||
      Math.abs(posAfter.y - posBefore.y) > 0.5;

    expect(moved).toBe(true);
  });

  test('keyboard input: rotate key changes ship angle', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);

    const angleBefore = await page.evaluate(() => window.__game.getShip().angle);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');

    const angleAfter = await page.evaluate(() => window.__game.getShip().angle);
    expect(angleAfter).not.toBeCloseTo(angleBefore, 1);
  });

  test('firing a shot creates a projectile', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);

    // Click canvas to unlock AudioContext
    await page.locator('#game-canvas').click();

    // Hold Space for multiple frames (the game samples input each rAF ~16ms)
    await page.keyboard.down('Space');
    await page.waitForTimeout(150);
    await page.keyboard.up('Space');

    // Wait one more frame for the game loop to process it
    await page.waitForTimeout(50);

    const boltCount = await page.evaluate(
      () => window.__game.getProjectiles().getBolts().length,
    );
    expect(boltCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Game-over path (the key "round ends" scenario)
// ---------------------------------------------------------------------------

test.describe('game-over', () => {
  test('cheatGameOver transitions state to gameover without JS errors', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await waitForGame(page);

    // Confirm we start in playing
    expect(await gameState(page)).toBe('playing');

    // Immediately force game-over via the test helper
    await page.evaluate(() => window.__game.cheatGameOver());

    // State should now be gameover
    const state = await gameState(page);
    expect(state).toBe('gameover');

    // Give the render loop a couple of frames to paint the game-over screen
    await page.waitForTimeout(150);

    // No JS errors through this whole path
    expect(errors).toHaveLength(0);
  });

  test('game-over screen is drawn onto canvas (pixel non-blank check)', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);
    await page.evaluate(() => window.__game.cheatGameOver());

    // Wait a few frames for render
    await page.waitForTimeout(200);

    // Sample the canvas — the game-over text draws bright pixels
    const hasContent = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      // Sample a horizontal strip across the middle looking for non-background pixels
      const w = canvas.width;
      const h = canvas.height;
      const data = ctx.getImageData(0, Math.floor(h * 0.4), w, Math.floor(h * 0.25)).data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Any pixel brighter than background #0b0f19 (11,15,25)
        if (r > 30 || g > 30 || b > 30) return true;
      }
      return false;
    });

    expect(hasContent).toBe(true);
  });

  test('pressing Enter after game-over restarts the game', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await waitForGame(page);

    await page.evaluate(() => window.__game.cheatGameOver());
    expect(await gameState(page)).toBe('gameover');

    // Press Enter to restart
    await page.keyboard.press('Enter');

    // Wait for the state to flip back to playing
    await page.waitForFunction(
      () => window.__game.getState() === 'playing',
      { timeout: 5_000 },
    );

    expect(await gameState(page)).toBe('playing');

    // Lives and wave should be reset
    const lives = await page.evaluate(() => window.__game.getLives());
    const wave = await page.evaluate(() => window.__game.getWave());
    expect(lives).toBe(3);
    expect(wave).toBe(1);

    expect(errors).toHaveLength(0);
  });

  test('score resets to 0 on restart', async ({ page }) => {
    await page.goto('/');
    await waitForGame(page);

    // Force some score
    await page.evaluate(() => {
      const g = window.__game;
      // Access internal scoreState via getScore()
      g.getScore().score = 500;
    });

    await page.evaluate(() => window.__game.cheatGameOver());
    await page.keyboard.press('Enter');

    await page.waitForFunction(() => window.__game.getState() === 'playing', { timeout: 5_000 });

    const score = await page.evaluate(() => window.__game.getScore().score);
    expect(score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Wave clear → next wave
// ---------------------------------------------------------------------------

test.describe('wave progression', () => {
  test('clearing all asteroids eventually advances to wave 2', async ({ page }) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await waitForGame(page);

    expect(await gameState(page)).toBe('playing');
    expect(await page.evaluate(() => window.__game.getWave())).toBe(1);

    // Instantly remove all asteroids — the game's wave-clear timer will fire
    await page.evaluate(() => window.__game.cheatClearAsteroids());

    // Wave clear has a 2.5 s delay; wait up to 6 s
    await page.waitForFunction(
      () => window.__game.getWave() === 2,
      { timeout: 6_000 },
    );

    expect(await page.evaluate(() => window.__game.getWave())).toBe(2);

    // New asteroids should have spawned
    const count = await page.evaluate(() => window.__game.getAsteroids().length);
    expect(count).toBeGreaterThan(0);

    expect(errors).toHaveLength(0);
  });
});
