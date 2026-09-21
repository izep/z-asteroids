# Current Epic: Playable Asteroids on iPhone and Desktop

## Who this is for
You should be able to open z-asteroids in a browser (or as an installed iPhone app) and play a short, fair game of classic Asteroids: fly a wireframe ship, shoot rocks, survive waves, and beat your own high score — including on a plane with no network.

## What “done” feels like
A person who has never seen this repo can:

1. Open the site and immediately see a dark starfield and a glowing triangular ship. The page does not 404, does not show a blank white screen, and does not require a developer console.
2. On a laptop, steer with arrows or WASD, thrust, shoot with space, and wrap off one edge of the screen onto the opposite edge.
3. On an iPhone, play with two thumbs without the page scrolling or zooming: rotate on the left, thrust and fire on the right, with a little haptic tick when firing if the phone supports it. The ship and buttons sit clear of the notch and home indicator, in both portrait and landscape.
4. Shoot a large rock and watch it split into two medium rocks, then two small ones, then vanish. Points read 20 / 50 / 100 for those sizes. Clearing the field starts a harder wave (more rocks, a bit faster).
5. Hear retro synth sounds for thrust, shots, explosions, hyperspace, and wave clear — no music files, no “unmute YouTube” nonsense. Mute stays muted next visit.
6. Die by hitting a rock (unless the respawn shield is still up). Three lives. After a death the ship comes back briefly invulnerable. At zero lives, game over, with the best score remembered on that device.
7. Panic-jump with hyperspace: the ship teleports, sometimes straight into a rock.
8. Install it to the iPhone home screen and play it again later with the radio off.

If any of those beats are missing, this epic is not finished — even if a task board says it is.

## In scope (player-visible)
- The arcade loop: fly, shoot, split rocks, next wave, lives, game over, restart.
- Vector neon look: glowing ship, jagged spinning rocks, sparks when something dies, drifting stars behind it.
- Keyboard on desktop and dual-thumb controls on iPhone.
- Procedural sound and a remembered high score / mute setting.
- Add-to-home-screen install and offline play of this game.

## Out of scope
- Online accounts, global leaderboards, multiplayer.
- Power-ups, saucers, extra lives at 10,000, campaigns, or settings screens beyond mute.
- Native App Store / Play Store wrappers.

## How to judge progress
Judge from the player’s chair, not from git commit titles.

- Early: you can see and steer the ship on a starfield.
- Mid: rocks exist, split, and score; dying and restarting works.
- Late: iPhone thumbs feel usable; sounds and high score work; it still runs if you toggle airplane mode after install.
- Ship it only when `pnpm test` and `pnpm build` pass **and** a human (or a QA pass that actually boots `/src/main.ts`) can play the loop above.
