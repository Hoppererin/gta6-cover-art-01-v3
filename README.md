# Vice Heat — Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Hoppererin/gta6-cover-art-01-v3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Hoppererin/gta6-cover-art-01-v3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photos into GTA-style poster key art — the multi-panel cover look with a
Vice City neon-sunset grade — right in your browser. **100% offline: photos never leave
your machine.** No upload, no watermark, no account.

## What it does

- **Cover Studio** — add your own photos (file picker or drag & drop) or start from the
  3 built-in sample shots.
- **5 multi-panel poster layouts** — Solo (hero full-bleed), Duo, Trio (big + 2 stacked),
  Quad (2×2), and a 7-panel **Epic mosaic** with a big hero.
- **Pop-out hero cut-out** — the hero photo breaks the grid: slight rotation, thick white
  outline and a drop shadow, overlapping its neighbours.
- **Face-aware crops** — drag any photo inside its panel to reposition, scroll to zoom,
  or hit **Focus face** to nudge the crop to the upper third where faces live. Zoom
  slider and per-panel photo picker included.
- **Striped retro-chrome 3D title** — big slanted title with a chrome gradient, horizontal
  retro stripes, extruded 3D offset layers and a heavy outline. Title, tagline and
  billing line are all editable.
- **Cast / role tags** — an editable role pill on every panel (THE DRIVER, THE FIXER,
  THE LOOKOUT, THE INSIDE MAN…). Generic roles only — no game characters.
- **8 Vice grades** — Vice Sunset, Neon Nights, Golden Hour, Noir Drive, Vice Pink,
  Teal Heat, Palm Dusk, Cotton Candy. Each is a canvas filter + colour wash per panel.
- **One-click looks** — 5 presets (Neon Duo, Golden Trio, Noir Solo, Epic Sunset,
  Cotton Quad) that set layout + grade + title + tagline in one tap.
- **Movie-poster furniture** — billing block at the bottom, a round gold "Vice Heat"
  seal stamp, a NEW 2026 starburst callout, and a thin gold frame.
- **Canvas-drawn original art** — retro striped sun, palm silhouettes and a lit skyline,
  all drawn in code. No game artwork, no Rockstar logo, no game font.
- **PNG export in 3 sizes** — 1080×1080, 1080×1350 and 1920×1080, one click each.
  The preview and the export share one render path, so what you see is exactly
  what you get.

## Try it

1. Open `app/index.html` in desktop Chrome (double-click works — no server needed,
   no network requests).
2. Pick a layout, a grade, and a look — or load your own photos.
3. Click a panel to select it, drag the photo to reposition, scroll to zoom.
4. Edit the title, tagline and cast tags.
5. Hit an export button to download the PNG.

## Files

- `app/index.html` — the studio page
- `app/style.css` — editor chrome
- `app/app.js` — the whole studio: state, layouts, grades, canvas renderer, export
- `app/samples/` — 3 built-in sample photos (`boulevard.jpg`, `neon.jpg`, `pier.jpg`)
- `screenshots/` — editor + exported covers
- `main.ts` — entry program: copies `app/` + `screenshots/` to the output dir and
  writes `dossier.json` (Node 22, stdlib only)
- `vendor/makefun-app.ts` — make.fun dossier library, unchanged from the kit

## License

MIT — see `LICENSE`. All art, lettering and fonts in this repo are original or
system fonts; no third-party game assets are used.

---
Entered on [make.fun](https://make.fun/r/dhj53q2r) · ref `dhj53q2r`
