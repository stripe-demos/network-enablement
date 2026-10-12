# Wireframe mode

A starter for wireframing Stripe Dashboard and Console ideas. It has two UI
shells, **Dashboard** and **Console**, and **wireframe mode**, a pen button that
turns the page grayscale, draws text and icons as blocks, and lets you bring back
only the parts you want to talk about.

Everything uses simulated data. There is no backend.

## Quick start

Use a Node version supported by the locked dependencies (tested with Node
20.19.5 and npm 10.8.2). Use Chrome 118+ or Safari 17.4+ (wireframe mode needs CSS `@scope`).

```bash
npm ci
npm run dev
```

Open the localhost URL Vite prints.

- `/` opens Dashboard (it redirects to `/dashboard/`).
- `/dashboard/` is Dashboard. `/dashboard/components` is its component gallery.
- `/console/` is Console. Its sidebar has a Dashboard link, and Dashboard's Console
  links open Console.

## Using wireframe mode

1. Click the pen button at the bottom corner. The page becomes a wireframe and a
   bar docks along the bottom edge.
2. Click or drag over any part of the page to bring it back at full fidelity.
3. Press **Done** to use the page again with your picks kept, including across pages.
4. Save picks as named **flows**, switch between them from the bar, and
   **Export screenshot** to download a grayscale PNG of the current view.
5. Turn the Wireframe switch off at the right end of the bar to leave wireframe mode.

Your picks and flows are saved in your browser's `localStorage`, so they stay on
your machine.

## Wireframing your own idea

Build your idea inside one of the shells, then use wireframe mode to show it.

- **A new Dashboard page:** add a page under `src/dashboard/pages/`, add a route in
  `src/dashboard/DashboardApp.jsx`, and build it from the components in
  `src/dashboard/ui/` (browse them at `/dashboard/components`). Add a sidebar link in
  `src/dashboard/components/DashboardSidebar.tsx` if you want one.
- **A new Console experience:** conversations, the sidebar and the Canvas live in
  `src/console/`. Sample conversations are in `src/console/components/Conversation/`.
- **Ask Cursor:** this repo has rules in [AGENTS.md](AGENTS.md). Say which surface
  you mean ("add a Dashboard page for X") and it will follow them.

Pick one surface per change. The two surfaces keep separate components, styles and
state on purpose.

## Wireframe mode in your own project

The tool is a single self-contained folder, [`src/prototype-settings/`](src/prototype-settings/README.md),
with one dependency (`modern-screenshot`). It works on any React UI because it
reads computed styles.

- Ask Cursor to follow the [add-wireframe-mode skill](.cursor/skills/add-wireframe-mode/SKILL.md)
  from inside your project, or
- follow the [tool's README](src/prototype-settings/README.md#add-it-to-another-prototype) by hand.

Its props, known limits and how it works are documented there.

## Project layout

```text
src/
  main.jsx                 Console entry; mounts Console and wireframe mode
  App.jsx                  Console routes
  index.css                Console styles and design tokens
  console/                 Console UI: sidebar, conversation, canvas, settings
  dashboard/               Dashboard UI: layout, sidebar, pages, components, tokens, styles
  prototype-settings/      wireframe mode (generic, copyable)
  integration/             navigation between the two surfaces
dashboard/index.html       Dashboard document entry
scripts/                   routing helpers and Node tests
.cursor/skills/            agent skills for wireframe mode
```

Each surface has its own HTML, CSS and React entry. Moving between them loads the
other surface's document. See [AGENTS.md](AGENTS.md) and
[Dashboard guidance](src/dashboard/AGENTS.md).

## Validation

```bash
npm run lint
npm test
npm run build
```

`scripts/wireframeMode.test.mjs` checks that the tool stays portable, small and cheap
while idle.

## Deploying

`vercel.json` routes both surfaces. Import the repo into Vercel as a Vite project
and each push gets a preview URL.
