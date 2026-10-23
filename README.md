# Ameliia [![CI](https://github.com/daggerok/ameliia/actions/workflows/ci.yaml/badge.svg)](https://github.com/daggerok/ameliia/actions/workflows/ci.yaml) [![GitHub Pages](https://github.com/daggerok/ameliia/actions/workflows/github-pages.yml/badge.svg)](https://github.com/daggerok/ameliia/actions/workflows/github-pages.yml)

Tp play Math for Ameliia [open this link](https://daggerok.github.io/ameliia/)

## Math Quest (current version, v20261021-quest)

A game for a 4th grader in New Jersey with Lina (a girl in glasses) and Pip the capybara (a new hobby every time she shows up), in English and Russian. The daily goal is right answers, not time: up to a school test day it is a plan that covers every task type of the homework for that test (one right answer for each of the 48 kinds of tasks on the photos for 2026-10-23; test prep and normal play serve the kinds not covered yet, never a repeat), later 30 right answers a day; a live clock shows today's study time:

- learning time is split 50% division, 25% motion and speed, 25% rounding and estimating
- a wrong answer opens a theory page (with fresh examples and her own task step by step), then a mini quiz; after the quiz comes a new task of the same skill, and the skill returns a few tasks later
- tasks follow NJSLS grade 4: 4.NBT.B.6 division up to 4-digit by 1-digit with remainders, 4.OA.A.3 interpreting remainders and reasonableness, 4.NBT.A.3 rounding, 4.NBT.B.5 multiplication, 4.M.A.1-2 time and distance, 4-PS3-1 and 4-PS3-3 speed and energy; velocity and acceleration are bonus explorer words
- a welcome tour on the first visit (again after a reset or from Settings), a daily practice test card (17 tasks: 6 division, 4 science, 5 of Topic 3 and 2 multiplication strategies), stars that paint a magic picture with a congratulation and her own choice of the next one (6 pictures), a story book that opens chapter by chapter, progress with time per topic
- progress is saved on the device in localStorage with a copy in IndexedDB (the newer one wins), persistent storage is requested, and Settings can save or load progress as a file

- "Fix my mistakes": her 18 homework mistakes of 2026-10-22 (her answer, the right way, a rule), then every wrong answer in the app (tasks and practice tests, last 60); each one is reviewed, then new tasks of the same kind until one is right
- test prep for Friday 2026-10-23 (home screen button, theory first, then tasks): Topic 3 "multiply by 1-digit numbers" (multiples of 10, 100 and 1,000; estimating products; mental math with properties and compensation; "select all that apply" expressions and partial products; bar diagrams and multi-step word problems with tables) and Science Chapter 2 "What affects motion?" (motion, reference point, force, gravity, relative motion, kinds of motion, balanced forces, the speed words of Part II and the point A to D map of the textbook)

Code: `src/engine/` (task generators, `topic3.ts` and `forces.ts` for the test prep, theory, quizzes, game rules), `src/ui/` (Lina and Pip, long division board, area model, number line, trip map, paintings), `src/main.tsx` (screens).

`bun test tests` checks every generated task: answers recomputed independently, every equation in steps and theory checked, realistic speeds and story numbers, no repeats, the 50/25/25 time split.

## Versions

- current version: `src/` -> https://daggerok.github.io/ameliia/, its name for the day it gets archived is in `<meta name="version">` of `src/index.html`
- backups: `backups/vYYYYMMDD-suffix/` -> https://daggerok.github.io/ameliia/vYYYYMMDD-suffix/, the date is when that version was made, the suffix is one lowercase word that says what it is
- list of all of them: https://daggerok.github.io/ameliia/backups/ (dates come from folder names, titles from each page's `<title>`)

`bun run build` builds every version into `dist/` (`bun run build-github-pages` does the same with `/ameliia/` as public url)

To archive the current latest: copy `src/` into `backups/<its meta version>/`, then put the new version into `src/` with a new `<meta name="version" content="vYYYYMMDD-suffix">`

Run one backup locally: `bunx parcel backups/v20230618-addition/index.html`
