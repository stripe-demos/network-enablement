---
name: add-wireframe-mode
description: Add the wireframe-mode tool (prototype settings pen button, docked bar, click-and-drag reveal, flows, screenshot export) to a different React prototype. Use when a user wants wireframe mode, the prototype settings, or "the wireframe toggle" in their own prototype or UI. Not for editing the tool inside this repository.
---

# Add wireframe mode to another prototype

The tool lives in `src/prototype-settings/` and works on any React UI: it reads
computed styles, so the target app needs no matching components. Read
`src/prototype-settings/README.md` first; it documents every prop and limit.

Use this skill from the **target** prototype, with a local clone of this
`wireframe-mode` repository available to copy from. If you are inside the
`wireframe-mode` repository itself, the tool is already mounted
(`src/main.jsx` for Console, `src/prototype-settings/mountDashboard.jsx` for
Dashboard). Edit it there instead of using this skill, and read the
[wireframe-mode skill](../wireframe-mode/SKILL.md) first: it explains how the
tool works and what must stay true (portable, light, non-invasive).

The folder has no app imports and costs almost nothing while the pen is idle, so
a copy needs nothing beyond the steps below. If a copy needs app-specific edits to
work, that is a bug in the tool: report it rather than patching the copy.

## Steps

1. **Check the target.** Confirm it is a React app with a bundler, and find its
   entry (`main.jsx`/`index.jsx`) and any extra HTML entry points. Note the
   prototype's name for the storage key. If it isn't React, stop and say so.
2. **Copy the folder.** Copy `src/prototype-settings/` from the `wireframe-mode` repository
   into the target's `src/`, without `mountDashboard.jsx`, which only wires
   up this repository's Dashboard. Clone the `wireframe-mode` repository, copy
   the folder, then delete `mountDashboard.jsx`. Do not edit the copy's
   internals to fit the app.
3. **Install the dependency.** `npm install modern-screenshot`.
4. **Mount it once.** Render it inside the app's root, after the app content:

   ```jsx
   <PrototypeSettings storageKey="<prototype-name>" surface="<prototype-name>" />
   ```

   `storageKey` is required in practice: without it, prototypes on the same
   origin share saved flows. For an extra HTML entry that shouldn't import the
   app, use `mountPrototypeSettings({ ... })` from `mount.jsx`.
5. **Run it and look.** Start the dev server, click the pen button (it turns wireframe on and opens the bar),
   check that the bar sits below the whole page, pick a few things, press Done,
   and try Export screenshot. Check a light and
   a dark page if the app has both. Fix only what looks wrong, using props
   (never by editing the tool):
   - Charts or widgets that should be picked as one unit: `charts`,
     `pickGroups` (CSS selectors).
   - A hover card that renders in a portal: `chartHoverCards`.
   - Content cut off or hidden under the docked bar (anything sized with
     `h-screen` or `100vh`): list it in `fitSelectors`.
   - A fixed footer or bar covering the pen button while wireframe is off:
     `bottomOffset`.
   - Wrong detected colors: pass `palette` and `theme` (see the README).
   - A dark bar or card that loses its edge: the optional
     `data-wireframe-*` attributes in the README, added to the app's markup.
6. **Keep the app unchanged otherwise.** Do not change the app's design tokens
   or behavior for the tool. The only app edits are the mount, the dependency,
   and any optional attributes above.
7. **Report.** Say what was copied, the `storageKey` used, any props or
   attributes added, and any limits that showed up (README "Known limits").

Do not commit or push unless the user asks. Follow the target repository's own
workflow when they do.
