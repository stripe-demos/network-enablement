// The attachment the demo stages when a file is picked.
//
// The prototype does not parse what the user actually selects — picking any file
// stages this one, so the flow is deterministic on stage. Name, type label and
// size are verbatim from the design (node `1673:498392`), as is the preview text.

export const STAGED_FILE = {
  name: 'connect-integration.md',
  meta: 'Markdown (38 KB)',
  // Only the first few lines are visible in the 80px preview well; the rest is
  // there so the text runs past the fade rather than stopping short of it.
  preview: `Recommended Connect integration plan
Marketplace for local FIFA viewing parties. Fans buy tickets; the platform collects payment, keeps a commission, and auto-pays out the host.

A. Account configuration
Accounts API: /v2/core/accounts (Accounts v2 — no legacy account type)
Dashboard: Express (lightweight earnings/payout view for hosts)
Fee collection: Your platform manages pricing (fees_collector: application)
Negative balance liability: Your platform (losses_collector: application)
You collect the ticket payment, you're the merchant of record, and you own dispute/refund risk — so liability and fees sit with the platform.

B. Charge pattern: destination charges
Fans check out in your flow; the charge lives on your account and Stripe auto-transfers the host's share via transfer_data, retaining your commission as application_fee_amount.`,
};

// How long the "analyzing" state runs before the checks settle. Not specified in
// the design — long enough to read as work, short enough not to stall a demo.
export const ANALYZE_MS = 1600;

// Replaces the cycling examples once a file is staged: with an attachment present,
// what we need is instruction about the file, not another example business.
//
// Written to Dante's form-field guidance — verb-first, says why the input is
// needed, second person, active voice, no device-specific or hedging language.
// The second clause makes it explicit that writing anything is optional.
// 54 characters, 13 words.
export const STAGED_PLACEHOLDER = 'Tell us how to use this file, or let us figure it out.';
