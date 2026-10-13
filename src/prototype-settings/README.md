# Prototype settings (wireframe mode)

A pen button that turns any React prototype into a wireframe, then lets you
bring back only the parts you want to talk about. It was built for Console and
Dashboard, but it only reads the page's computed styles, so it works on any UI.
Console and Dashboard are just two configurations of it (see
`src/console/prototypeSettingsConfig.js` and
`src/dashboard/prototype/prototypeSettingsConfig.js`).

What you get:

- **Wireframe** mode: click the pen button at the bottom corner (while wireframe
  is off it idles with a faint purple spark orbiting its edge and a shimmer
  through the icon every few seconds). The button shrinks away when wireframe
  turns on and grows back, with a small overshoot, from beneath the bar as it
  slides down. While wireframe is on, the pen cursor gets a white fill on light
  surfaces (chosen from `palette.bg`). The page goes
  grayscale, with text and icons drawn as rounded blocks and borders evened out
  to 1px. Layout never changes. An outline dissolve sweeps out from the button
  as it happens. Turning wireframe off waits for the bar to slide away, then the
  wireframe is wiped back into the button, so the real UI only appears where the
  wipe has already passed.
- **A docked bar**: the button opens up into a bar along the bottom edge with
  everything below, plus the Wireframe switch at its right end (turn it off
  there). The page shrinks to make room, so the bar never covers anything. The
  bar is purple while you pick and dark slate once you're done.
- **Pick what to show**: click or drag over content to bring it back at full
  fidelity. **Done** makes the page usable again with the picks kept, including
  across pages. Menus opened from picked buttons show too.
- **Color**: a switch on the bar, off by default, that shows picked content in
  its real colors. Everything else stays a gray wireframe either way.
- **Flows**: save the current picks under a name, switch between them (from
  the flow name on the bar), override or save as new, discard.
- **Export screenshot**: downloads the current view as a grayscale PNG (with
  picks in color while Color is on).

## Requirements

- React (developed on 19; it uses `useId` and `createPortal`), and a bundler that handles
  `import './x.css'` and dynamic `import()` (Vite, webpack, etc.).
- `modern-screenshot`, used only by Export screenshot and loaded on first use.
- A browser with CSS `@scope`: Chrome 118+ and Safari 17.4+ (check current
  Firefox support before relying on it there).

## Add it to another prototype

The quickest way is to ask Cursor: the
[add-wireframe-mode skill](../../.cursor/skills/add-wireframe-mode/SKILL.md)
walks an agent through these steps. To do it by hand:

1. Copy this whole folder (`src/prototype-settings/`) into your project. Skip
   `mountDashboard.jsx`; it only wires up this repo's Dashboard.
2. `npm install modern-screenshot`
3. Render it once, anywhere inside your app (it portals into `document.body`):

   ```jsx
   import PrototypeSettings from './prototype-settings/PrototypeSettings';

   <PrototypeSettings storageKey="my-prototype" surface="my-prototype" />
   ```

   For an extra HTML entry that shouldn't import the rest of your app, call
   `mountPrototypeSettings({ ... })` from `mount.jsx` instead. It takes the same
   props and creates its own React root.

That's all that's required. Everything else is optional.

## Props

| Prop | Default | What it does |
| --- | --- | --- |
| `storageKey` | shared default | Prefix for saved state (`<key>-settings-v1`, `<key>-flows-v1`). **Set this** on every prototype: without it, prototypes served from the same origin (including `localhost:5173` on different days) share saved flows. |
| `surface` | `'prototype'` | Name used in exported file names. |
| `palette` | derived from the page | Wireframe colors: `bg`, `block`, `subtle`, `border`, `text`. Add `darkBg`, `darkBlock`, `darkBorder` for dark zones (see below). By default these follow the page's background: light grays on a light page, dark grays on a dark one. |
| `theme` | derived from the page | `'light'` or `'dark'` for the floating controls. |
| `charts` | `[]` | Selectors for charts and similar widgets. Picked as a whole instead of piece by piece. |
| `chartHoverCards` | `[]` | Selectors for hover cards rendered outside their chart (portals). They show at full fidelity while their chart is hovered, once it's picked. |
| `pickGroups` | `[]` | Selectors for other widgets that should be picked as one unit (e.g. a search field with a rotating placeholder). |
| `defaultFlowLabel` | `'Default'` | Label for the unsaved, fully wireframed flow in the Flows menu. |
| `fitSelectors` | `[]` | Selectors for elements the page sizes to the full viewport (`h-screen`, `100vh`). While the bar is up they're shortened by its height. See "The bar and page layout". |
| `bottomOffset` | `16` | Pixels above the bottom edge for the pen button while wireframe is off. Raise it to clear a fixed footer or bar. The docked bar ignores it. |

## The bar and page layout

While the bar is up, `<body>` is made 44px shorter and becomes the containing
block for fixed elements, so the page's own fixed bars, menus and dialogs stay
inside the page area, above the bar. The bar lives in its own element on
`<html>`, outside `<body>`. The reserved height eases in and out with the bar's
slide, so the page's bottom edge always meets the bar. When wireframe is turned
off, none of this applies and the page goes back to full height.

This works on its own for pages whose height comes from `<body>` or a parent.
Anything the page hard-codes to the viewport (`h-screen`, `height: 100vh`,
including inline styles) won't shrink by itself and would be cut off at the
bottom. List those in `fitSelectors` (Dashboard passes `.dashboard-root` and
`.dash-sidebar-nav`). To find them, turn wireframe on and look for content
sitting under the bar.

## Optional hooks in your markup

None are needed. Add them where the default look isn't right:

- `data-wireframe-tone="dark"` on an area that should stay dark in a light
  wireframe (e.g. a dark top bar). Requires `darkBg`, `darkBlock` and
  `darkBorder` in `palette`. Use `data-wireframe-tone-after="dark"` for a dark
  `::after` panel.
- `data-wireframe-frame="card"` on a card that loses its edge once backgrounds
  flatten, and `data-wireframe-frame="tray"` on a gray tray behind a grid of
  cards.
- `data-wireframe-role="chart"` (or any attribute) plus a matching selector in
  `charts`, for widgets with no stable class.

## Saved state

Two `localStorage` keys, shared by every page on the same origin and key prefix:

- `<prefix>-settings-v1`: whether wireframe is on, and whether Color is on.
- `<prefix>-flows-v1`: the current picks, saved flows, and the active flow.

A pick is stored as a CSS path (anchored on a stable `id` where there is one)
plus the element's text. It follows an element across pages and reloads as long
as the markup around it keeps its shape. Picks that no longer match anything are
ignored. Clear the keys to reset everything.

## How it works

`wireframeEngine.js` marks elements with `data-wf-*` attributes (kind, borders,
gradients, layers), and `prototypeSettings.css` flattens colors based on them.
Text, icons and media are drawn as blocks on a fixed canvas overlay
(`.wf-canvas`), so each line keeps its exact position and width. Picked
elements (`data-wf-pick`, `data-wf-reveal`) are skipped by both. Nothing in your
DOM is moved or removed. Everything the tool adds is marked
`data-wireframe-ui` and ignored by the engine. (The bar's host element and the
`html[data-ps-bar]` flag are the only changes outside the page's own content.)

The page is grayscale through one backdrop-filter overlay (`.ps-grayscale`).
With Color on, each redraw also masks that overlay away over the outermost
picks (clipped by their scroll areas), so only they show in color. Where a
layer that isn't picked (menu, dialog, sticky bar) sits on top of a pick, one
hit test confirms it and that part stays gray. The same regions are used by the
export and by the leave transition's snapshot. It adds nothing while Color is off.

The outline dissolve (`revealEffect.js`) is one extra canvas for about 700ms. Each
frame it copies the engine's finished canvas through a few ring-shaped clips and
strokes the engine's existing block shapes once. It measures nothing, so it adds
no layout work, and it is skipped when the user prefers reduced motion. Only a
user's click plays it, not loading a page that already has wireframe on.

Turning wireframe off (`playLeave`) uses the View Transitions API: the browser
snapshots the page while it still looks like a wireframe, the real page is
restored underneath, and the snapshot is masked away by a ring contracting into
the button. Only the pen button and the outline canvas get their own layers
(`view-transition-name`, set only while it plays), so they stay live. The ring
itself is a CSS animation (`ps-leave-ring`), because a view transition ends when
the CSS animations on its layers do. Browsers without the API, and users who
prefer reduced motion, get the older behavior (the real page returns at once and
the blocks retreat over it, or no animation).

Only text that an overlay (menu, dialog, sticky bar, transformed element) could
cover is hit-tested; the rest is drawn without. See the comments at the top of
each file for details.

The draggable rectangle (`.ps-marquee`) has a purple stroke and faint purple fill.
It is appended to `<html>` after the grayscale overlay so it keeps its color.

## Weight

The tool is built to be cheap enough to leave in any prototype:

- Raw size: the whole folder is about 105 kB of source. In a production build the
  tool is roughly 48 kB of JS (14 kB gzipped) and 16 kB of CSS (4 kB gzipped).
  `modern-screenshot` (about 9 kB gzipped) loads on the first export only.
- While wireframe is off, the page pays only for the pen button. Its shimmer and
  orbit animate `transform` on a pseudo-element, which runs on the compositor.
- While wireframe is on, the engine redraws only in response to a change, never on
  a free-running loop. Style-only changes (a page animating through inline styles)
  redraw at most every `ANIMATION_GAP_MS`. Swapped text settles in a few frames.
  A slow redraw makes the engine sit out frames (`TICK_BUDGET_MS`), so it can't
  starve the page. Hit tests try `elementFromPoint` before the full stack.
- Measured idle CPU on Dashboard, which animates a rotating prompt forever
  (Chrome, dev build): about 2.7% with the tool dormant, about 2.4% with wireframe
  off, and about 9% with wireframe on. A static page like Console shows no
  measurable cost.

`scripts/wireframeMode.test.mjs` (run by `npm test` in this repository) checks that the
folder imports nothing outside itself, stays under its size budget, loads
`modern-screenshot` lazily, and keeps the idle-cost guards. The
[wireframe-mode skill](../../.cursor/skills/wireframe-mode/SKILL.md) tells an agent how
the tool works and how to measure a change.

## Known limits

- Content inside an iframe isn't wireframed or picked (the iframe itself shows
  as a block).
- Unstyled native inputs keep their browser-default border style.
- Pointer-transparent text laid over something (e.g. a placeholder `span` over
  an `input`) is treated as covered, so it isn't drawn.
- Saved picks are tied to the page's markup: big restructures can orphan them.
- With Color on, a pick shows color across its whole box: rounded corners and
  transparent gaps let the (flattened, gray) background behind it show through
  in color, and its shadow outside the box stays gray.
- Export screenshot captures the visible page area (the viewport minus the bar),
  not the whole page, and may miss cross-origin images that block it.
- The bar doesn't collapse on narrow screens; it is built for desktop widths.

## Keeping a copy up to date

The folder is self-contained, so a copy can lag behind this repository. To update
one, re-copy the folder and keep your own props. Don't import app code into it:
the tool is meant to stay generic.
