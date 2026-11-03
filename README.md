# Pixel Pet

A cozy, original pixel-art companion. Adopt a cat, bunny, or bear, pick a name and color, and make a little time for a little friend.

**Play:** https://gracebilliris.github.io/pixel-pet/

## Run

Requires Node.js 22.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5189. `npm test` runs the simulation and persistence tests; `npm run build` type-checks and creates the static site in `dist/`.

## Care & play

- Feed: 5 coins for 22 food. Play: earn 3 coins and 5 XP, spend 12 energy. Clean: free freshness boost.
- Sleep restores energy over time; wake your pet before other care or games.
- Berry rhythm: watch and repeat three berry sequences with arrow keys, WASD, or touch. Collect up to 10 coins based on accuracy.
- Spend coins on a reusable bow or crown. Tap an owned accessory to wear/remove it.
- Growth is earned through time or XP. Your pet never permanently dies; needs stop at 15. Offline progression is gently capped at eight hours.
- Pause freezes needs and age, including while away. Still mode and your system’s reduced-motion preference stop animation.
- “New pet” requires confirmation and replaces this browser’s pet.

## Saving & privacy

Care saves automatically to this browser’s localStorage under `pixel-pet-v1`. Reloading restores the pet and advances elapsed time, capped at eight hours. Invalid saves are ignored safely; storage failure shows a warning. A backward clock is rebased without negative progress. Saves do not sync across browsers or devices. Clearing site data clears your pet. No accounts, API, backend, analytics, external images, or network-dependent gameplay. Gameplay works without network after loading; there is no service worker, so reopening offline is not guaranteed.

## Deploy

The GitHub Actions workflow uses Node 22, runs `npm ci`, tests, builds, and deploys `dist/` to GitHub Pages. Enable **Settings → Pages → Source: GitHub Actions**, then push to `main`. Vite uses relative asset paths (`base: './'`) so repository-hosted Pages works correctly.

## Checks

Unit tests cover bounded offline progression, backward clocks, action costs, sleep/wake, pause, rewards, accessories, and valid/malformed/unavailable storage. Browser checks cover adoption, care, game rewards, reload persistence, mobile layout, and the published site.

With Playwright and its Chromium browser available, run `node scripts/browser-check.mjs` against the dev server. Set `PLAYWRIGHT_MODULE` to an existing Playwright module path if it is not installed locally. Set `BASE_URL` to check a deployed site. Screenshots are written to ignored `artifacts/`.
