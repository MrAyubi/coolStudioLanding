# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a creative portfolio/landing page for "Cool Studio" - an interactive, animated website showcasing team members and services. Built with vanilla JavaScript, GSAP animations, and Parcel bundler.

## Development Commands

### With Docker (recommended - no local Node required)

Full guide: [`../README_DOCKER.md`](../README_DOCKER.md).

Run from the **repository root** (`coolwebsite/`, one level above this file):

```bash
docker compose up dev     # Parcel dev server + hot reload -> http://localhost:1234
docker compose up web     # production build served by nginx -> http://localhost:8080
```

Add `--build` after changing `package.json` (dependencies are baked into the image):
```bash
docker compose up --build dev
```

Notes:
- A bare `docker compose up` starts **both** services at once.
- The `dev` service bind-mounts only `website/src`, so edits on the host hot-reload
  in the container. Everything else (`node_modules`, `dist`) lives inside the image.
- The `web` service runs the real production artifact: Parcel build output served by
  nginx with gzip and long-lived caching for hashed assets. No Node at runtime.
- Hot reload through the bind mount is verified on Linux. It is expected to work on
  macOS via Docker Desktop, but has not been tested there; if the watcher misbehaves,
  `docker compose up web` (rebuild to see changes) is the fallback.

### With local Node

Requires Node 22 (see `.nvmrc`).

**Start development server:**
```bash
npm run dev
```
Opens development server with Parcel at http://localhost:1234 with hot reload enabled.

**Build for production:**
```bash
npm run build
```
Builds both entry points (`src/index.html` and `src/studio-intro.html`) into `dist/`.

## Project Architecture

### Entry Points
- **HTML:** `src/index.html` - Main HTML file
- **JavaScript:** `src/assets/js/app.js` - Main application entry
- **Styles:** `src/assets/js/config.js` - Imports all SCSS modules

### Key Dependencies
- **GSAP** - Animation library with ScrollTrigger plugin for scroll-based animations
- **Swiper** - Touch slider/carousel library (configured but not actively used in current build)
- **Parcel** - Zero-config bundler handling SCSS compilation and module bundling
- **Sass** - CSS preprocessor via @parcel/transformer-sass

### Code Organization

**JavaScript Modules:**
- `app.js` - Main application logic, loading animations, GSAP ScrollTrigger setup
- `config.js` - Stylesheet imports (SCSS and Font Awesome)
- `data.js` - Team member data structures (`players_data`, `players_select_data`)
- `image.js` - Image/GIF path exports
- `injector.js` - DOM injection logic for Swiper reviews and player selection UI
- `coolThings.js` - Player selection hover sound effects

**SCSS Modules:**
- `base.scss` - Global resets, variables, font imports, base styles
- `landing.scss` - Hero section styles (header, hero text, socials)
- `loader.scss` - Loading animation styles
- `services.scss` - Services section with animated text
- `reviews.scss` - Review cards/Swiper styles
- `playerSelect.scss` - Player selection section (retro game-style interface)
- `coolLinks.scss` - Custom link styles
- `coolButton.scss` - Custom button component
- `animations.scss` - Reusable animation definitions
- `swiper.scss` - Swiper override styles

### Design System

**Color Variables (defined in base.scss):**
- `$orange-bg: #f28500` - Primary background
- `$font-dark: #1f262c` - Dark text
- `$font-light: #f4f4f4` - Light text
- `$red-vintage: #ba433f`
- `$yelliw-vintage: #e0a24d`
- `$pastile-purple: #7c4aa8`
- `$dark-orange: #f16131`

**Typography:**
- Primary: "Poppins" (Google Fonts)
- Display: "streetOfRage" (custom woff2), "Cartoonist Kooky", "Bowlby One"
- Icons: Font Awesome 6

### Key Features & Implementation Patterns

**1. Loading Screen Animation (app.js:8-47)**
- Progress bar animation from 0-100%
- Multi-stage GSAP timeline: rotate bar → fade counter → scale text → fade out
- 30ms interval counter simulation

**2. Scroll-Triggered Content (app.js:59-94)**
- Hero section pinned during scroll
- Sequential fade in/out of `.hero-title p` elements
- Uses GSAP ScrollTrigger with 400% scroll range

**3. Dynamic Content Injection (injector.js)**
- `injectSwiperInputs()` - Generates review slides from `players_data` array
- `injectPlayerInputs()` - Populates player stats/bio based on selection
- Pattern: Template literal HTML strings injected via `innerHTML`

**4. Player Selection (injector.js:78-110)**
- Click handler updates active state via CSS class toggle
- Dynamically renders skills with star ratings (Font Awesome stars)
- GIF image swapping based on `data-name` attribute

**5. Audio Interaction (coolThings.js)**
- Single audio instance reused for hover sounds
- Initial click required for audio playback (browser autoplay policy)
- `mouseenter` event triggers sound restart

## Common Pitfalls

**Parcel Caching:**
The `.parcel-cache` directory can cause stale build issues - notably, a deleted CSS
rule can keep being served after the source is reverted. Delete it if experiencing odd
bundling behavior. In Docker this cache is intentionally not persisted across container
recreation, so `docker compose up dev` always starts from a clean cache; if a running
dev container goes stale, `docker compose up -d --force-recreate dev` resets it.

**Asset Path Resolution:**
Parcel transforms paths differently in dev vs production. Use relative paths from `src/` directory (e.g., `./assets/images/file.png`).

**SCSS Import Order:**
`config.js` imports determine CSS cascade. `base.scss` must load first as it contains variables used by other modules.

**Font Loading:**
Custom font `streetOfRage` uses absolute path `/assets/fonts/` - ensure this resolves correctly in production builds.

**Player Data Inconsistency:**
There are two data structures: `players_data` (for reviews) and `players_select_data` (for player selection). They contain similar but not identical information and must be kept in sync manually.

## Adding New Features

**New Team Member:**
1. Add entry to both `players_data` and `players_select_data` in `data.js`
2. Add corresponding images to `src/assets/images/` and GIFs to `src/assets/gifs/`
3. Export image paths in `image.js`
4. Add player card HTML in `src/index.html` (`.player-select__card`)

**New SCSS Module:**
1. Create file in `src/assets/styles/`
2. Import in `config.js` (order matters for cascade)
3. Follow BEM naming convention (block__element--modifier)

**New Animation:**
- GSAP is globally available after import in `app.js`
- ScrollTrigger animations should use the pinned `.landing` section as reference
- Use `gsap.timeline()` for sequential animations
