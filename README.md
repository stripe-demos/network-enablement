# Account configuration demo

A standalone snapshot of the account configuration prototype. It includes the account picker, new-account path, configuration and capability controls, payout collection, onboarding handoff variants, confirmation states, mock account data, and the Options panel.

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The flow launches automatically. Use **Options** in the bottom-left bar to switch between the variants under review. After closing the flow, use **Add configurations** on the list page to launch a fresh run.

## Where to iterate

- `src/components/creation-workspace/account-configuration/AccountConfigurationForm.tsx` — form and interactions
- `src/components/creation-workspace/account-configuration/AccountConfigurationPreview.tsx` — live preview
- `src/components/creation-workspace/account-configuration/AccountConfigurationResult.tsx` — success and toast states
- `src/components/creation-workspace/account-configuration/model.ts` — mock accounts, configurations, and capabilities
- `src/components/creation-workspace/AccountConfigurationOptionsPopover.tsx` — prototype switches and their explanations
- `src/components/AccountConfigurationDemo.tsx` — standalone page wiring

## Notes

- This is a front-end prototype. Submitting, sending email, and copying the onboarding link are simulated locally.
- Prototype choices persist only for the current run of this standalone app.
- The snapshot is intentionally independent of the larger pattern-library repository so changes here will not affect the source prototype.
