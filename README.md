# Plum Rancher 🐶🍑

A cozy Stardew-style browser game. You are **Brontosaurus**, a brindle French Bulldog
with one great treasure: a plum tree. The local deer think it's a free buffet.

Bark them off, harvest your plums, sell them at the bin, and spend your earnings
at the Ranch Supply stand to build the finest plum ranch in the valley.

## Play

- **WASD / Arrows** — move
- **SPACE** — bark (scares deer away)
- **E** — harvest plums / sell at bin / open shop
- **M** — mute

## Upgrades

| Item | Effect |
|---|---|
| Orchard Fence | Deer show up far less often |
| Scarecrow | Deer eat much more slowly |
| Fertilizer | Plums ripen faster |
| Speedy Treats | Brontosaurus runs 35% faster |
| Plum Sapling | A second plum tree |

Progress saves automatically to localStorage.

## Dev

```bash
npm install
npm run dev
```

Vite + vanilla JS + canvas. All pixel art is drawn procedurally in
[src/sprites.js](src/sprites.js) — no image assets.

There's a debug API on `window.plumDebug` (`give(coins)`, `spawnDeer()`,
`step(seconds)` to advance the simulation manually).
