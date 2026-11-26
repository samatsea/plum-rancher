# Plum Rancher 🐶🍑

A cozy Stardew-style browser game. You are **Brontosaurus**, a brindle French Bulldog
with one great treasure: a plum tree. The local deer think it's a free buffet.

Bark them off, harvest your plums, sell them at the stall, and spend your earnings
at the Ranch Supply vending machine to build the finest plum ranch in the valley.

Live at [samwerks.com/plumrancher](https://samwerks.com/plumrancher).

## Play

- **WASD / Arrows** — move
- **SPACE** — bark (scares deer away)
- **E** — harvest plums / sell at the stall / open the shop
- **P** — pause
- **I** — auto mode (Bronto shoos deer, harvests and sells on his own; moving takes over)
- **M** — mute

## Upgrades

| Item | Effect |
|---|---|
| Orchard Fence | Deer show up far less often and must come through a gate |
| Scarecrow | Deer eat much more slowly |
| Fertilizer | Plums ripen faster |
| Speedy Treats | Brontosaurus runs 35% faster |
| Plum Sapling | A second plum tree |

Progress saves automatically to localStorage (versioned; older saves migrate).

## Dev

```bash
npm install
npm run dev        # http://localhost:5179 via the plum-rancher launch config
```

Vite + vanilla JS + canvas, fixed 1/60 s simulation step. Sprites are drawn in code
([src/sprites.js](src/sprites.js)); third-party assets are logged in [ASSETS.md](ASSETS.md).

```
src/main.js          boot, input wiring, fixed-step loop, plumDebug
src/core/            config, state, save (v2 + migration), clock, input, audio
src/world/           entities (everything placed, as data), collision, fence,
                     nav (A* pathfinding), camera
src/systems/         player, deer, trees, economy, autopilot
src/ui/              hud, shop, font (pixel text)
src/render.js        camera + y-sorted drawing
src/dev/selftest.js  dev-only smoke test
```

### Debug API (`window.plumDebug`)

| Call | Does |
|---|---|
| `selftest()` | Dev only. Drives every verb deterministically; returns PASS/FAIL per check. Run it after any change. |
| `step(seconds)` | Advance the simulation in fixed steps (works while paused or the tab is in the background) |
| `snapshot()` | JSON picture of the game: save fields, player, deer, camera |
| `teleport(x, y)` | Put Bronto's feet at a map position |
| `give(n)` / `give('coins' \| 'plums', n)` / `give('sapling')` | Add coins/plums or grant an upgrade |
| `spawnDeer()` | Spawn a deer now |

### Deploy (current)

The game is built into the portfolio repo (`~/Projects/samwerks`) and served at
`/plumrancher`:

```bash
npm run build -- --base=/plumrancher/
rm -rf ~/Projects/samwerks/public/plumrancher && cp -R dist ~/Projects/samwerks/public/plumrancher
# then commit + push the samwerks repo
```

Planned: move to its own Vercel project with `samwerks.com/plumrancher` redirecting
to it, so a push to this repo deploys.
