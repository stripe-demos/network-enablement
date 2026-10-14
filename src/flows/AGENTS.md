# Flows workspace

Root [ownership rules](../../AGENTS.md) apply.

- Flows has its own HTML entry at `flows/index.html`, React entry at
  `src/flows/flows-main.tsx` and styles in `globals.css`. It has no router;
  `components/StandardLandingPage.tsx` picks the demo from the URL hash.
- Write TypeScript. `@/` resolves to `src/flows/`. Check with `npm run typecheck`.
- The code came from a Next.js app. `next/image` and `next/dynamic` resolve to
  `lib/next-shim/`; use ES imports, not `require`, which Vite doesn't support.
- Server code goes in the repo-root `api/` folder as web-standard handlers
  (`export async function POST(request: Request)`). Use relative imports there;
  Vercel doesn't resolve `@/`.
- Images and icons are in `public/` (`flags/`, `logos/`, `unified-account-icon.png`).
