# Flows workspace

Root [ownership rules](../../AGENTS.md) apply.

- Flows owns the root HTML entry (`index.html`, served at `/`), with its React
  entry at `src/flows/flows-main.tsx` and styles in `globals.css`. It has no
  router; `components/StandardLandingPage.tsx` is the Network enablement landing
  page and picks the demo from the URL hash.
- The landing page's journeys come from `components/landing/entryPoints.ts`.
  Link Dashboard pages by URL; don't import Dashboard code.
- Write TypeScript. `@/` resolves to `src/flows/`. Check with `npm run typecheck`.
- The code came from a Next.js app. `next/image` and `next/dynamic` resolve to
  `lib/next-shim/`; use ES imports, not `require`, which Vite doesn't support.
- Server code goes in the repo-root `api/` folder as web-standard handlers
  (`export async function POST(request: Request)`). Use relative imports there;
  Vercel doesn't resolve `@/`.
- Images and icons are in `public/` (`flags/`, `logos/`, `unified-account-icon.png`).
