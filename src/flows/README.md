# Flows

Originally a standalone snapshot of the account configuration prototype. It includes the account picker, new-account path, configuration and capability controls, payout collection, onboarding handoff variants, confirmation states, mock account data, and the Options panel.

## Run it

From the repo root, `npm run dev`, then open `/` and pick a creation flow, or go straight to `/#account-creation`. Use **Options** in the bottom-left bar to switch between the variants under review. After closing the flow, use **Add configurations** on the list page to launch a fresh run.

## Where to iterate

- `components/creation-workspace/account-configuration/AccountConfigurationForm.tsx` — form and interactions
- `components/creation-workspace/account-configuration/AccountConfigurationPreview.tsx` — live preview
- `components/creation-workspace/account-configuration/AccountConfigurationResult.tsx` — success and toast states
- `components/creation-workspace/account-configuration/model.ts` — mock accounts, configurations, and capabilities
- `components/creation-workspace/AccountConfigurationOptionsPopover.tsx` — prototype switches and their explanations
- `components/AccountConfigurationDemo.tsx` — standalone page wiring
- `components/StandardLandingPage.tsx` and `components/landing/` — the Network enablement landing page

## Notes

- This is a front-end prototype. Submitting, sending email, and copying the onboarding link are simulated locally.
- Prototype choices persist only for the current run of this standalone app.
- Ported from Next.js to Vite. `next/image` and `next/dynamic` resolve to `lib/next-shim/`; the describe-account API route is `api/recommend-configurations.ts` at the repo root.
