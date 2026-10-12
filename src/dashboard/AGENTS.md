# Dashboard workspace

Root [ownership rules](../../AGENTS.md) apply.

- Dashboard has its own HTML entry at `dashboard/index.html`, React entry at
  `src/dashboard/dashboard-main.jsx`, routes in `DashboardApp.jsx`, and styles.
  Its Router basename is `/dashboard`; route-local links omit that prefix.
  Native document navigation uses `lib/dashboardRouting.js` to include it.
- Reuse `@dashboard/ui` (`ui/index.js`) and its tokens for Dashboard UI. The gallery is
  `/dashboard/components`; add reusable Dashboard primitives there when needed.
  These components and tokens do not replace Console's components or design.
- Keep Dashboard code here and assets in `public/dashboard-assets/`. Prefix
  public entry components and adapters with Dashboard; private components can
  keep their local names. Imports of Console components or `src/index.css` do
  not belong in this entry point.
- Use `lib/storage.js` for Dashboard preferences. Its prefix prevents cross-surface
  collisions. Prototype controls in `prototype/` are Dashboard-owned.
- Console entry controls use `ui/DashboardConsoleLink.js` or the
  `DashboardConsoleHandoff` route. Only `src/integration/consoleHandoff.js`
  connects the surfaces. Do not recreate a Console drawer or conversation here.
