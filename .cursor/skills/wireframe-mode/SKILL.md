---
name: wireframe-mode
description: How wireframe mode (the prototype settings pen button, docked bar, wireframe engine, picking, flows, wipe-away outro, screenshot export) works and what must stay true when changing it. Use before editing anything in src/prototype-settings/, or when asked how the tool behaves, why it is built this way, or whether a change keeps it light and portable. To add the tool to another prototype use add-wireframe-mode instead.
---

# Wireframe mode: maintaining the tool

Wireframe mode lives in `src/prototype-settings/`. It is a **generic tool**, not
part of Console or Dashboard. It is mounted by both starter surfaces (`src/main.jsx` for
Console, `mountDashboard.jsx` for Dashboard) but knows nothing about either.
The full behavior, props, and limits are in
`src/prototype-settings/README.md`. Read it first, then this file for the
rules that keep it healthy.

## The three promises

Every change must keep all three. `scripts/wireframeMode.test.mjs` enforces
what can be checked automatically (`npm test`).

1. **Portable.** The folder is copied as-is into other prototypes
   ([add-wireframe-mode](../add-wireframe-mode/SKILL.md)).
   - Import only from the folder, `react`, `react-dom`, and `modern-screenshot`.
   - Never import from `src/console/`, `src/dashboard/`, or `src/integration/`.
   - Never name an app class or selector in the tool's code. App specifics are
     props: `charts`, `pickGroups`, `chartHoverCards`, `fitSelectors`, `palette`,
     `theme`, `bottomOffset`. Surface wiring lives in `mount*.jsx` and in the
     surface's own `prototypeSettingsConfig.js`.
   - `mountDashboard.jsx` is the only repo-only file; it is skipped when copying.
   - A new prop needs a README table row (a test checks).
2. **Light.** It must cost almost nothing when off and little when on.
   - Off: the page pays only for the pen. The pen shimmer and orbit are
     compositor-only (`transform` on a pseudo-element); never animate `mask-position`,
     `background-position`, or `@property` values for something that loops.
   - On: the engine redraws only when something changed (mutation, event,
     resize), never on a free-running loop. Keep these:
     - `TICK_BUDGET_MS` / `TICK_BACKOFF`: a slow redraw makes the engine sit out frames.
     - `ANIMATION_GAP_MS`: style-only mutations (JS-driven animation) redraw at most this often.
     - Content-only mutations (text/node swaps) settle in `QUICK_SETTLE_FRAMES`; class and
       attribute changes use `SETTLE_FRAMES` because they can start CSS transitions.
     - Hit tests (the costliest step) go through `pageElementAt`, which tries
       `elementFromPoint` (about 4x cheaper) before the full `elementsFromPoint`
       stack. Only text a layer overlaps, or pointer-transparent text, gets one.
   - `modern-screenshot` loads on the first export, never up front.
   - Source budget is `SOURCE_BUDGET_BYTES` in the test. Raise it deliberately.
3. **Non-invasive.** Nothing in the page is moved, removed, or restyled
   permanently. The engine marks elements with `data-wf*` attributes and
   `restorePage()` removes every one on stop. Everything the tool adds is marked
   `data-wireframe-ui`, and anything appended to `<html>` is cleaned up. Never
   change the host app's tokens or behavior to suit the tool.

## Files

| File | Owns |
| --- | --- |
| `PrototypeSettings.jsx` | The pen button, docked bar, state, flows, picking, timing of enter/exit |
| `wireframeEngine.js` | `startWireframe()`: classifies elements, draws blocks on `.wf-canvas`, the observer, `stop()` |
| `prototypeSettings.css` | Grayscale flattening via `data-wf*`, bar, pen, marquee, view-transition outro |
| `revealEffect.js` | The outline dissolve in (`playReveal`) and the View Transitions wipe out (`playLeave`) |
| `customPicker.js` | Click-and-drag picking and the marquee |
| `flowPicks.js`, `FlowMenu.jsx`, `FlowDialog.jsx`, `DiscardDialog.jsx` | Saved flows |
| `exportScreenshot.js` | Grayscale PNG export, picks in color when Color is on (lazy `modern-screenshot`) |
| `palette.js` | Colors and theme derived from the page |
| `mount.jsx` | `mountPrototypeSettings()` for entries that don't import the app |
| `mountDashboard.jsx` | Repo-only: Dashboard's mount |

## Rules that are easy to break

- **Layering.** The bar sits above the pen (`.ps-bar { z-index: 1 }`,
  `.ps-trigger { z-index: 0 }`). The `.ps-grayscale` overlay is a
  backdrop-filter at `z-index: 2147483000`. Anything that must stay *colored* (the
  dissolve `.wf-fx`, the marquee) is appended to `<html>` **after** that overlay,
  or it gets desaturated. The Color switch keeps picks colored by masking that
  overlay (`colorRegionsOf` / `applyColorMask` in the engine, recomputed on each
  redraw); never color picks by filtering page elements, which would change
  their containing blocks.
- **The bar host is a child of `<html>`**, outside `<body>`. `html[data-ps-bar]`
  plus the registered `--ps-bar-h` reserve the bar's height on `<body>`.
- **Leaving wireframe** (`stopWireframe` then `playLeave`) is sequenced: the bar slides
  (`BAR_EXIT_MS`), then the View Transition wipes the wireframe snapshot away. A view
  transition ends when its CSS animations end, and ends early if a named element
  unmounts, so the ring is a CSS animation (`ps-leave-ring`) and the bar is not
  named. Keep `.ps-grayscale` rendered while `docked`, or it vanishes at the commit.
  Browsers without the API and reduced-motion users get the plain fallback.
- **Reduced motion.** Every animation has a `prefers-reduced-motion` branch
  (CSS block at the end of `prototypeSettings.css`, `prefersReducedMotion()` in JS).
- **Surface color.** The engine sets `html[data-wf-surface="light"]` from the palette;
  the pen cursor uses `--wf-pen-cursor-dark/light`.
- **Saved state** is two `localStorage` keys prefixed by `storageKey`. Changing the
  stored shape means bumping the `-v1` suffix and handling old data.

## Checking a change

Run `npx eslint src/prototype-settings`, `npm test`, and `npm run build`. Then, with the dev
server running (a persistent background shell; `/` is Dashboard, `/console/` is Console),
look at both surfaces, light and dark, with wireframe on, picking, done, and off.

For anything that could affect weight, measure instead of guessing. Use Playwright with a
CDP session (`Performance.getMetrics`: `TaskDuration`, `ScriptDuration`,
`RecalcStyleCount`, `LayoutCount`) over a few idle seconds in three states: tool dormant,
wireframe off (pen animating), wireframe on. Dashboard is the stress case, because its
rotating prompt animates through inline styles forever. Reference idle numbers on
Dashboard (Chrome, dev build): dormant about 2.7% CPU, wireframe off about 2.4%, wireframe on
about 9% (script about 5%). A change that makes a number clearly worse needs a reason.

## When you change the tool

Update `src/prototype-settings/README.md` (behavior, props, limits), and this file if
a rule above changes. If a change adds a prop or a new way to apply the tool to another
prototype, update [add-wireframe-mode](../add-wireframe-mode/SKILL.md) too. Do not commit
or push unless asked.
