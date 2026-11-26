# Third-party assets

Everything not made for this project, with its license. Add an entry *before*
committing any new font, image, sprite sheet, sound or music file, and honor any
attribution requirement in the in-game credits.

| Asset | Used for | Source | License | Attribution required |
|---|---|---|---|---|
| Silkscreen (regular + bold, Latin subset). © 2001 The Silkscreen Project Authors ([googlefonts/silkscreen](https://github.com/googlefonts/silkscreen)) | Canvas HUD, toasts, prompts; title and shop headings | [`@fontsource/silkscreen`](https://www.npmjs.com/package/@fontsource/silkscreen) 5.3.0 (Google Fonts v6) | [SIL Open Font License 1.1](https://openfontlicense.org) | No in-game credit needed; the license text ships in the package. Don't sell the font on its own |

Everything else (Brontosaurus, deer, trees, buildings, ground) is drawn in code in
`src/sprites.js`. Sound effects are synthesized live in `src/core/audio.js`.
