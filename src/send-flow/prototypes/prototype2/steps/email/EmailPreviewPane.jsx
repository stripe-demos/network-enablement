import React from 'react';
import { useFlow } from '../../flow/FlowProvider';
import { account } from '../../data/accounts';
import {
  PAYOUT_METHOD_CHOICES,
  SENDER,
  acceptWindowDays,
} from '../../data/emailInvite';
import { formatMoney } from '../../flow/selectors';

/**
 * Live email preview — styled to 429:225231.
 *
 * A pure function of `emailInvite`, so it updates as the form is typed into.
 * That live update is the entire demo value of this screen.
 */
export default function EmailPreviewPane() {
  const { state } = useFlow();
  const invite = state.emailInvite;

  const source = account(invite.sourceAccountId);
  const currency = source?.currency ?? 'USD';
  const amount = Number(invite.amount) || 0;
  // No amount yet, no figure: "Rocket Rides is sending you $0" reads as a bug in the subject
  // line, and to a recipient who doesn't know this payout is being drafted, as a scam.
  const subject =
    amount > 0
      ? `${SENDER.name} is sending you ${formatMoney(amount, currency)}`
      : `${SENDER.name} is sending you money`;

  const methods = PAYOUT_METHOD_CHOICES.filter((m) =>
    invite.methods.includes(m.id),
  );

  const note = invite.note.enabled ? invite.note.value.trim() : '';

  return (
    <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-large bg-canvas shadow-card ring-1 ring-hairline">
      {/* From / Subject strip */}
      <div className="flex items-center gap-3 border-b border-hairline p-5">
        <span className="text-sail-label-medium-emphasized flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action text-white">
          {SENDER.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="text-sail-label-small text-ink-muted">
            From: {SENDER.name}
          </p>
          <p className="text-sail-label-small truncate text-ink-muted">
            Subject: {subject}
          </p>
        </div>
      </div>

      <div className="px-10 pb-10 pt-6">
        <p className="text-sail-heading-medium text-ink">{subject}</p>
        <p className="text-sail-label-medium mt-1 text-ink">
          Accept the payout by using the link to enter your details in the
          onboarding portal.
        </p>

        {/* Sender's note sits in its own outlined card */}
        {note && (
          <div className="mt-4 rounded-card px-4 py-3 ring-1 ring-hairline">
            <p className="text-sail-label-small text-ink-muted">
              Note from sender
            </p>
            <p className="text-sail-label-medium mt-0.5 text-ink">{note}</p>
          </div>
        )}

        <div className="mt-4 rounded-card bg-panel px-4 py-3">
          <p className="text-sail-label-small text-ink-muted">
            You can accept this payout with
          </p>
          <ul className="mt-1.5 space-y-1 pl-1">
            {methods.map((m) => (
              <li
                key={m.id}
                className="text-sail-label-medium flex gap-2 text-ink"
              >
                <span className="text-ink-faint">&bull;</span>
                {m.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Recipient-facing CTA: deliberately not the brand purple, since it's
            rendered inside a simulated email rather than in the product. */}
        <div className="text-sail-label-medium-emphasized mt-4 flex h-10 items-center justify-center rounded-control bg-neutral-500 text-white">
          Accept
        </div>

        <p className="text-sail-label-small mt-3 text-center text-ink-muted">
          This link will expire on {expiryLabel()}
        </p>
      </div>
    </div>
  );
}

/**
 * The frame shows a literal "[+ 3 days from sent date]" placeholder; this renders
 * the actual date so the preview reads like a real email.
 */
function expiryLabel() {
  const d = new Date(Date.now() + acceptWindowDays * 86400000);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
