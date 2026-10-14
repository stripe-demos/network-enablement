# Network enablement

A shared prototype for mocking up **Stripe Network** flows. It merges two
earlier prototypes, with their git history:

- **Connect Enablement** ([sallykang-llama/connect-enablement](https://github.com/sallykang-llama/connect-enablement)):
  the Dashboard shell, Connect › Enablement, Network onboarding (globe, opt-in,
  find accounts), the Network list and wireframe mode. Lives in `src/dashboard/`,
  `src/console/` and `src/prototype-settings/`.
- **Unified account creation flow** ([stripe-demos/Unified-account-creation-flow](https://github.com/stripe-demos/Unified-account-creation-flow)):
  account configuration (picker, describe-account, capabilities, payouts,
  onboarding handoff), plus the invoice, subscription, customer and send-money
  creation flows. Lives in `src/flows/`. See [its README](src/flows/README.md).

Everything uses simulated data. The only server code is `api/`, which has a
local heuristic fallback, so no keys are needed.

| Surface | URL | Code |
|---|---|---|
| Network enablement landing page and creation flows | `/` | `src/flows/` (TypeScript) |
| Dashboard | `/dashboard/` | `src/dashboard/` (JSX, React Router) |
| Console | `/console/` | `src/console/` |

The landing page shows the platform, connected account and direct journeys as
rows of clickable steps, defined in
[`src/flows/components/landing/entryPoints.ts`](src/flows/components/landing/entryPoints.ts).

## Routes

Locally, every route is on the URL `npm run dev` prints, by default
**http://localhost:5173**. The same paths work on the Vercel deployment.

### Creation flows (unified account creation)

Open over the landing page from a hash. Old `/flows/#…` links redirect here.

| Flow | URL |
|---|---|
| Account creation (picker, describe account, configurations, capabilities, payouts, onboarding handoff) | http://localhost:5173/#account-creation |
| Single config (add a customer configuration from the Network list) | http://localhost:5173/#single-config |
| Invoice | http://localhost:5173/#invoice |
| Subscription | http://localhost:5173/#subscription |
| Send money | http://localhost:5173/#send-money |

### Dashboard

| Page | URL |
|---|---|
| Connect › Enablement (go-live checklist) | http://localhost:5173/dashboard/connect/enablement |
| Network list | http://localhost:5173/dashboard/network/all |
| Network onboarding: welcome | http://localhost:5173/dashboard/connect/enablement?network-onboarding=welcome |
| Network onboarding: opt in | http://localhost:5173/dashboard/connect/enablement?network-onboarding=opt-in |
| Network onboarding: find accounts | http://localhost:5173/dashboard/connect/enablement?network-onboarding=find-accounts |
| Console | http://localhost:5173/console/ |

### Dashboard link parameters

Add these to any Dashboard URL. Each is applied once, then removed from the
address bar.

| Parameter | What it does |
|---|---|
| `network-onboarding=welcome\|opt-in\|find-accounts` | Opens the Network onboarding dialog on that step. |
| `network-accounts=none\|existing` | Whether the platform already has connected accounts. `existing` shows the sample accounts on the Network list for this tab. |
| `prototype-reset=1` | Resets the network demo, like **Reset network demo** in the prototype controls. The landing page's **Open flow** links add it. |

For example, a platform with existing accounts on the Network list, starting
fresh: http://localhost:5173/dashboard/network/all?network-accounts=existing&prototype-reset=1

## Working together

Two designers work here at once, so:

- Branch off `main` per idea (`yourname/short-idea`) and open a PR to merge.
  Vercel gives every branch a preview URL to share.
- Keep changes inside one surface when you can. Flows and Dashboard both draw a
  Network list today; decide together before reconciling them.
- Run the checks below before pushing.

## Quick start

Use a Node version supported by the locked dependencies (tested with Node
20.19.5 and npm 10.8.2). Use Chrome 118+ or Safari 17.4+ (wireframe mode needs CSS `@scope`).

```bash
npm ci
npm run dev
```

Open the localhost URL Vite prints, then go to `/dashboard/connect/enablement`
(the sidebar's **Connect › Enablement**), or the root for the landing page.

To use the live JEV classifier in the describe-account modal, put
`TYPESAFE_API_KEY` (or `AI_GATEWAY_API_KEY`) in `.env.local`. Without one it
uses the local heuristic.

## The Enablement page

[`src/dashboard/pages/enablement/`](src/dashboard/pages/enablement/)

- **Get more from your platform:** a checklist of the three enablement tasks below.
- **Tabs** for configuring the connected-account experience: Performance,
  Branding, Onboarding, Features and Communication.

## The 3 enablement tasks

The checklist rows live in
[`GoLiveChecklist.jsx`](src/dashboard/pages/enablement/GoLiveChecklist.jsx).

### 1. Onboard faster with accounts already on the Stripe network

**Built.** Opens a full-page dialog that walks a platform through joining the
network and finding its first 4 connected accounts. It's based on the Dashboard
visual refresh designs in Figma: a left progress panel, a 520px step column and
pill buttons.

| Step | Job to be done | What's on it |
|---|---|---|
| Welcome | "Is this right for me, and what happens next?" | Animated globe of platforms (Rocketrides, Hertz, Shopify, DoorDash, OpenAI) sharing businesses, the steps ahead, and when it's a good fit to join |
| Opt in | "What am I agreeing to?" | Short terms (what you share, what you get, your accounts stay private) and one required consent checkbox |
| Find connected accounts | "Pick a few businesses to invite." | Recommendations ranked from the platform's onboarding business description and progress toward 4, in one of two versions (see below) |

Step 3 has two versions to compare, picked in the prototype control panel
(the sliders button): **A · Swipe** (default), one business profile card at a
time with Skip or Invite, plus "Browse all businesses" search and filters; and
**B · Profile cards**, recommendations as business profile cards, 4 per page.
Choosing a version or a "Start on step" option opens the dialog on that step,
or moves an open dialog there. "Reset network demo" closes the dialog, clears
the saved result and sets the controls back to Swipe and Welcome.

Key files, in [`src/dashboard/pages/network/`](src/dashboard/pages/network/):

- `NetworkOnboarding.jsx`: the dialog shell, step routing and footer.
- `steps/`: the three steps.
- `NetworkGlobe.jsx`: the canvas globe (light and dark themes).
- `networkControls.jsx` and `networkTokens.js`: shared heading, checkbox, radio, choice rows and filters from Figma.
- `platformProfile.js`: Rocketrides' simulated onboarding profile.
- `recommendAccounts.js`: the scoring that ranks businesses.
- `networkCandidates.js`: the businesses on the network.

The choices made on Done are saved in `sessionStorage` under the
`dashboard:network-onboarding-v2` key, so each new tab starts with the task not
done. Finishing the flow checks off the task, fills the Network list with the
invited accounts and shows a count on the Network nav item until you open it.

Related: the **Network** item in the sidebar (`/dashboard/network/all`) lists
the platform's connected accounts, with All / Merchants / Recipients / Customers
tabs. Its data is in [`src/dashboard/app/network/`](src/dashboard/app/network/).

### 2. Add capabilities like Capital and Treasury to your connected accounts

**Not built yet.** The row links to `/dashboard/connect/capital`, which shows the
Dashboard's "not built" placeholder.

### 3. Supercharge your platform with prebuilt skills and agents from Platform Apps

**Links to the existing Apps overview** (`/dashboard/apps`), with Discover,
Installed, Created and Connect extensions tabs. No enablement-specific flow has
been built for it yet.

## Wireframe mode

The pen button at the bottom corner turns any page into a wireframe so you can
show only the parts you want to talk about:

1. Click the pen button. The page goes grayscale and a bar docks along the bottom.
2. Click or drag over any part of the page to bring it back at full fidelity.
   Turn on **Color** to keep your picks in full color.
3. Press **Done** to use the page with your picks kept. Save picks as **flows**,
   or use **Export screenshot** to save a PNG.

Picks and flows are saved in your browser's `localStorage`. The tool lives in
[`src/prototype-settings/`](src/prototype-settings/README.md); see its README to
reuse it in another project.

## Project layout

```text
src/dashboard/             Dashboard UI (the surface this prototype extends)
  pages/enablement/        Connect › Enablement page and checklist
  pages/network/           Stripe network onboarding dialog, globe, ranking
  app/network/             Network list page config and data
  components/              Sidebar, list view template, toolbar
  ui/                      Dashboard components and tokens (/dashboard/components)
src/console/               Console UI (separate surface, at /console/)
src/prototype-settings/    Wireframe mode (generic, copyable)
src/flows/                 Landing page and creation flows (TypeScript; `@/` imports point here)
  components/landing/      Landing page: authors and journeys
  components/creation-workspace/account-configuration/   Account configuration
  lib/next-shim/           next/image and next/dynamic, mapped to plain React
src/integration/           Navigation between Dashboard and Console
api/                       Server functions (Vercel; served by Vite in dev)
public/dashboard-assets/   Dashboard images and icons
scripts/                   Routing helpers and Node tests
```

Keep Dashboard and Console changes separate. See [AGENTS.md](AGENTS.md) and the
[Dashboard guidance](src/dashboard/AGENTS.md).

## Validation

```bash
npm run lint        # JS/JSX (Dashboard, Console)
npm run typecheck   # TypeScript (Flows, api)
npm test
npm run build
```

## Deploying

The repo is connected to Vercel. Pushing to `main` deploys production, and other
branches get preview URLs. `vercel.json` routes all three surfaces.
