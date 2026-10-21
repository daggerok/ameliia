# Ameliia [![CI](https://github.com/daggerok/ameliia/actions/workflows/ci.yaml/badge.svg)](https://github.com/daggerok/ameliia/actions/workflows/ci.yaml) [![GitHub Pages](https://github.com/daggerok/ameliia/actions/workflows/github-pages.yml/badge.svg)](https://github.com/daggerok/ameliia/actions/workflows/github-pages.yml)

Tp play Math for Ameliia [open this link](https://daggerok.github.io/ameliia/)

## Versions

- current version: `src/` -> https://daggerok.github.io/ameliia/, its name for the day it gets archived is in `<meta name="version">` of `src/index.html`
- backups: `backups/vYYYYMMDD-suffix/` -> https://daggerok.github.io/ameliia/vYYYYMMDD-suffix/, the date is when that version was made, the suffix is one lowercase word that says what it is
- list of all of them: https://daggerok.github.io/ameliia/backups/ (dates come from folder names, titles from each page's `<title>`)

`bun run build` builds every version into `dist/` (`bun run build-github-pages` does the same with `/ameliia/` as public url)

To archive the current latest: copy `src/` into `backups/<its meta version>/`, then put the new version into `src/` with a new `<meta name="version" content="vYYYYMMDD-suffix">`

Run one backup locally: `bunx parcel backups/v20230618-addition/index.html`
