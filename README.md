# Ameliia [![CI](https://github.com/daggerok/ameliia/actions/workflows/ci.yaml/badge.svg)](https://github.com/daggerok/ameliia/actions/workflows/ci.yaml) [![GitHub Pages](https://github.com/daggerok/ameliia/actions/workflows/github-pages.yml/badge.svg)](https://github.com/daggerok/ameliia/actions/workflows/github-pages.yml)

Tp play Math for Ameliia [open this link](https://daggerok.github.io/ameliia/)

## Versions

- latest: `src/` -> https://daggerok.github.io/ameliia/
- older ones: `versions/v0.N/` -> https://daggerok.github.io/ameliia/v0.N/ (v0.1 is the oldest)
- list of all of them: https://daggerok.github.io/ameliia/v/

`bun run build` builds every version into `dist/` (`bun run build-github-pages` does the same with `/ameliia/` as public url)

To archive the current latest: copy `src/` into the next free `versions/v0.N/`, add its label to `versions/versions.json` and put the new version into `src/`

Run one old version locally: `bunx parcel versions/v0.1/index.html`
