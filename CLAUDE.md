# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ameliia is a single-page math learning game for 3rd graders to practice fractions. It runs as a static site deployed to GitHub Pages at https://daggerok.github.io/ameliia/

## Tech Stack

- **Runtime/Package Manager**: Bun (bun.lock present, use `bun install` / `bun run`)
- **Bundler**: Parcel 2 (with SCSS transformer)
- **Testing**: Jest
- **Styling**: SCSS (compiled via Parcel)

## Common Commands

```bash
bun install          # Install dependencies
bun run build        # Production build (no cache, no source maps) → dist/
bun run build-github-pages  # Build for GitHub Pages with correct public-url
bun run serve        # Dev server via Parcel
bun run test         # Run Jest tests (bun run test -- --watchAll for watch mode)
bun run clean        # Remove dist/ folder
```

## Architecture

The app is a single-file application in `src/index.html` containing all HTML, CSS (in `<style>` block), and JavaScript (in `<script>` block). The `src/main.js` file exists but is currently a TODO stub — all logic lives in the HTML file.

### Question System

The app generates 9 types of fraction questions for 3rd grade math:
- `identifyFraction` — identify fraction from shaded circle visual
- `visualFraction` — determine how many parts to shade
- `compareFractions` — compare two fractions with same denominator
- `equivalentFractions` — fill in missing numerator or denominator
- `numberLine` — read fraction from number line position
- `simplifyFraction` — reduce fraction to lowest terms
- `addSameDenominator` — add fractions with same denominator
- `fractionOfGroup` — find fraction of a set of objects
- `wholeAndParts` — convert mixed visuals to improper fraction

Each question generator returns an object with: `type`, `question` text, `visual` function (creates SVG elements), `answerType` (`fraction`/`number`/`comparison`), `correctAnswer`, and `explanation`.

### Visual Rendering

SVG-based visuals are created dynamically via JavaScript:
- `drawCircle(filled, total, index)` — segmented circle with filled/shaded segments
- `drawBar(filled, total)` — horizontal bar chart segments
- `drawNumberLine(denominator, numerator)` — number line from 0 to 1

### Game State

All state is managed in global variables: `currentQuestion`, `stats` (correct/total/streak). Questions are randomly selected from the `questionTypes` array.

## Deployment

- **CI**: `.github/workflows/ci.yaml` — builds on push using Bun
- **Pages**: `.github/workflows/github-pages.yml` — deploys `dist/` to GitHub Pages on push to `main`
- **Bun setup**: `.github/workflows/bun.yml` — reusable workflow for Bun version

## Notes

- The HTML file (lines 1060-1942) contains a commented-out alternative "level-based" version with 4 difficulty levels — this is unused.
- Parcel entry point is `src/index.html` (set in `package.json` `source` field).
- Build output goes to `dist/` (configured in `.gitignore` but required for deployment).

## Specs Driven Development (SSD)

All specifications, requirements, and related materials must be contained within this CLAUDE.md file. Do not create separate spec files unless explicitly requested by the user. When implementing features, consult the specs defined in this file.

### New Feature: Reward & Minecraft Integration

- **Reward Conditions**: After the fraction learning game (src/index.html) the system must track:
  - Total questions answered.
  - Correct answers.
  - Accuracy (correct/total).
  - Cumulative learning time (must be >= 15 minutes).
  - When **at least 25 correct answers**, **accuracy > 75%**, and **learning time >= 15 minutes**, a reward overlay appears offering Minecraft play time.
- **Reward Duration Logic**:
  - 1–2 mistakes → 5 minutes.
  - More than 2 mistakes but less than 25% mistakes → 3 minutes.
  - Accuracy exactly 75% → 1 minute.
  - Accuracy below 75% → no reward.
- **State Persistence**:
  - Fraction game stats are saved to `localStorage` (`fractionStats` and `learningTime`).
  - On each page load, stats are loaded and continued.
  - Before navigating away, stats are persisted.
- **Minecraft Game (src/index-2026-04-26-minecraft4ameliia.html)**:
  - Accepts query param `rewardMinutes` indicating allowed play time.
  - On load, attempts to load saved world state from `localStorage` key `minecraftState`.
  - If no saved state, initializes the preset world.
  - Displays a timer overlay counting down the allowed minutes.
  - When the timer expires, the game auto‑saves, shows an alert, and redirects back to `index.html`.
  - While the timer is active, block placement/removal is permitted; after expiry, interactions are blocked.
  - Game state (block positions and types) is saved to `localStorage` key `blockWorldSave` on page unload and when the timer ends (same key used by the manual Save/Load buttons).
- **Navigation**:
  - Reward overlay’s "Play Minecraft" button navigates to the Minecraft page with the appropriate `rewardMinutes` query parameter.
  - Returning to the fraction game restores previous stats and allows continued play.

Ensure these behaviours are reflected in the code and that all file edits end with a newline.

## Learned Lessons

These are specific instructions for the AI agent to follow in this repository:

1. **No Co-Authored-By in commits**: When creating git commits, never include "Co-Authored-By" lines. Omit that trailer entirely.
2. **No unsolicited refactoring**: Do not apply refactoring or optimizations unless explicitly requested. If you identify important refactoring or optimization opportunities, notify the user and let them decide whether to proceed.
3. **Newline at end of files**: Always ensure any file you write or edit ends with a newline character.
4. **Keep CLAUDE.md in sync**: Always ensure this file reflects the current state of the repository. Update it when architecture, commands, dependencies, or other important details change.
