# Ameliia [![CI](https://github.com/daggerok/ameliia/actions/workflows/ci.yaml/badge.svg)](https://github.com/daggerok/ameliia/actions/workflows/ci.yaml) [![GitHub Pages](https://github.com/daggerok/ameliia/actions/workflows/github-pages.yml/badge.svg)](https://github.com/daggerok/ameliia/actions/workflows/github-pages.yml)

Tp play Math for Ameliia [open this link](https://daggerok.github.io/ameliia/)

## Math Quest (current version, v20261021-quest)

A game for a 4th grader in New Jersey with Lina (a girl in glasses) and Pip the owl, in English and Russian:

- learning time is split 50% division, 25% motion and speed, 25% rounding and estimating
- a wrong answer opens a theory page (with fresh examples and her own task step by step), then a mini quiz; after the quiz comes a new task of the same skill, and the skill returns a few tasks later
- tasks follow NJSLS grade 4: 4.NBT.B.6 division up to 4-digit by 1-digit with remainders, 4.OA.A.3 interpreting remainders and reasonableness, 4.NBT.A.3 rounding, 4.NBT.B.5 multiplication, 4.M.A.1-2 time and distance, 4-PS3-1 and 4-PS3-3 speed and energy; velocity and acceleration are bonus explorer words
- practice test (12 tasks, half division), stars that paint a magic picture, a story book that opens chapter by chapter, progress with time per topic

Code: `src/engine/` (task generators, theory, quizzes, game rules), `src/ui/` (Lina and Pip, long division board, area model, number line, trip map, paintings), `src/main.tsx` (screens).

`bun test tests` checks every generated task: answers recomputed independently, every equation in steps and theory checked, realistic speeds and story numbers, no repeats, the 50/25/25 time split.

## Versions

- current version: `src/` -> https://daggerok.github.io/ameliia/, its name for the day it gets archived is in `<meta name="version">` of `src/index.html`
- backups: `backups/vYYYYMMDD-suffix/` -> https://daggerok.github.io/ameliia/vYYYYMMDD-suffix/, the date is when that version was made, the suffix is one lowercase word that says what it is
- list of all of them: https://daggerok.github.io/ameliia/backups/ (dates come from folder names, titles from each page's `<title>`)

`bun run build` builds every version into `dist/` (`bun run build-github-pages` does the same with `/ameliia/` as public url)

To archive the current latest: copy `src/` into `backups/<its meta version>/`, then put the new version into `src/` with a new `<meta name="version" content="vYYYYMMDD-suffix">`

Run one backup locally: `bunx parcel backups/v20230618-addition/index.html`
