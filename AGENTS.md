# Network enablement

This repo is a shared prototype for Stripe Network flows. It has three UI
surfaces, Dashboard, Flows and Console, plus **wireframe mode**, a tool that
turns any page into a wireframe. The UI uses simulated data; nothing here talks to a backend.

Dashboard lives under `src/dashboard/` (served at `/dashboard/`, the default).
Console lives under `src/console/` (served at `/console/`). Flows lives under
`src/flows/` (served at `/flows/`): TypeScript creation flows merged from the
Unified account creation prototype, with its own [guidance](src/flows/AGENTS.md). Each has its own HTML
entry, CSS and React entry. Keep each surface's components, styles and state in its
own folder; a similarly named component in each is not shared. Do not import one
surface's components or CSS into the other. The only link between them is
`src/integration/consoleHandoff.js` (routing and a one-time prompt handoff).

Wireframe mode (`src/prototype-settings/`) belongs to neither surface. It is a
generic, copyable tool that both mount. Keep it free of Console and Dashboard
imports and selectors, and keep it light. Read the
[wireframe-mode skill](.cursor/skills/wireframe-mode/SKILL.md) before editing it;
`scripts/wireframeMode.test.mjs` guards portability and weight.

If a request leaves it unclear which surface should change, ask before editing.
Do not assume an edit applies to both.

See [README](README.md) for setup and how to build a wireframe, the
[wireframe-mode skill](.cursor/skills/wireframe-mode/SKILL.md) for the tool's
rules, and the [add-wireframe-mode skill](.cursor/skills/add-wireframe-mode/SKILL.md)
for adding the tool to a different project.
