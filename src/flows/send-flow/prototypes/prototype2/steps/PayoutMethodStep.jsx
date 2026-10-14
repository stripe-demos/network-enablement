import React, { useEffect, useMemo } from 'react';
import { Icon } from '../../../icons/SailIcons';
import Button from '../../../components/Button';
import { useFlow } from '../flow/FlowProvider';
import { RECIPIENTS, identifierFor } from '../data/recipients';
import {
  METHOD_GROUPS,
  methodSublabel,
  methodsForRecipient,
  payoutMethod,
} from '../data/payoutMethods';
import {
  deliveryMethod,
  preferredRailFor,
  railsForMethod,
} from '../data/deliveryMethods';
import SelectRow from '../ui/SelectRow';
import Avatar from '../ui/Avatar';
import MethodMark from '../ui/MethodMark';
import MethodBadge from '../ui/MethodBadge';
import CountryTag from '../ui/CountryTag';
import GroupedDropdown from '../ui/GroupedDropdown';
import Reveal from '../ui/Reveal';
import Checkbox from '../ui/Checkbox';
import { vopPendingFor } from '../data/vop';
import Callout from '../ui/Callout';
import TextInput from '../ui/TextInput';
import SelectChevron from '../ui/SelectChevron';

/**
 * Destination — 429:221943 (collapsed), 429:221632 (dropdown open),
 * 429:222803 (Modify reference).
 *
 * Who is being paid, and into what. The Delivery control that used to sit under this one
 * now lives on Payout details, beside the amount and the date: how fast the money moves
 * and what that costs are part of the same decision as how much to send. The rail is
 * still RESOLVED here, so the next step opens on a real one — see the effect below.
 */
export default function PayoutMethodStep() {
  const { state, patchDraft, enterSubflow } = useFlow();
  const { recipientId, payoutMethodId, deliveryMethodId, reference, note } =
    state.draft;

  const recipient = useMemo(
    () =>
      // Session copy first — see selectors.recipientFor.
      state.addedRecipients.find((r) => r.id === recipientId) ??
      RECIPIENTS.find((r) => r.id === recipientId) ??
      null,
    [recipientId, state.addedRecipients],
  );

  // A recipient added in this session carries its own method (built at commit
  // time) rather than appearing in the static fixtures.
  const methods = useMemo(
    () => recipient?.methods ?? methodsForRecipient(recipientId),
    [recipient, recipientId],
  );
  const method = useMemo(
    () =>
      methods.find((m) => m.id === payoutMethodId) ??
      payoutMethod(payoutMethodId),
    [methods, payoutMethodId],
  );
  const rails = useMemo(
    () => railsForMethod(method, recipient?.country ?? 'US'),
    [method, recipient],
  );
  const rail = deliveryMethod(deliveryMethodId);

  /**
   * Does this destination still owe a Confirmation of Payee? UK only, and only until
   * the sender resolves it — see data/vop.js. Drives the banner below, and the same
   * predicate gates Continue in the step graph, so the two can't disagree.
   */
  const vopUnresolved = vopPendingFor(method, state.verifiedPayees);

  // The frames open with the destination already resolved: the last-used one.
  useEffect(() => {
    if (!payoutMethodId && methods.length) {
      const preferred =
        methods.find((m) => m.badge === 'lastUsed') ?? methods[0];
      patchDraft('payoutMethodId', preferred.id);
    }
  }, [payoutMethodId, methods, patchDraft]);

  /**
   * Resolve the rail, and re-resolve it whenever the selected one isn't on offer.
   *
   * Stays on this step even though the control moved: the rail depends on the
   * destination, so the moment that changes here the old rail may not exist. History
   * beats advice — the rail this destination was last paid over wins, and only a
   * destination with no history falls through to the recommendation.
   *
   * The second half matters as much as the first: the rail used to be set only when
   * nothing was selected, so a stale one survived a destination change. Pick a Stripe
   * profile (Instant), then add a bank account, and the bank kept the network rail —
   * "Bank account" delivered by "Instant", which isn't a rail a bank account has.
   */
  useEffect(() => {
    if (!payoutMethodId || !rails.length) return;
    const stillOffered = rails.some((d) => d.id === deliveryMethodId);
    if (stillOffered) return;
    const preferred = preferredRailFor(method, rails);
    if (preferred) patchDraft('deliveryMethodId', preferred.id);
  }, [payoutMethodId, deliveryMethodId, method, rails, patchDraft]);

  const methodGroups = METHOD_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    items: methods
      .filter((m) => m.group === g.id)
      .map((m) => ({
        id: m.id,
        primary: m.label,
        secondary: methodSublabel(m),
        leading: (
          <MethodMark logo={m.logo} country={m.country} group={m.group} />
        ),
        leadingOverhang: true,
        badge: <MethodBadge method={m} />,
      })),
  }));

  return (
    <div className="space-y-6">
      {/* No label: the heading already says "Recipient", and a field label repeating it
          directly underneath left the row looking like an answer to a question nobody had
          asked. Everything below it is labelled, because those are choices. */}
      <div>
        {recipient ? (
          <SelectRow
            variant="panel"
            // Both marks sit ON the panel fill, so they take the deeper tone —
            // otherwise tile and row are the same colour and the tile disappears.
            leading={
              <Avatar
                name={recipient.name}
                initials={recipient.initials}
                logo={recipient.logo}
                tone="deep"
              />
            }
            primary={recipient.name}
            secondary={identifierFor(recipient)}
            trailing={<CountryTag code={recipient.country} tone="deep" />}
          />
        ) : (
          <SelectRow variant="panel" primary="Select a recipient" />
        )}
      </div>

      {/* The destination and its payee check are one block: the stack's 24px belongs
          between different things, and the banner is a fact about the control directly
          above it. Wrapping them means the 24px lands below the pair, and the gap
          inside is the Reveal's own 12px — which collapses with it when resolved. */}
      <div>
        <GroupedDropdown
          label="Destination"
          value={method ? { id: method.id } : null}
          groups={methodGroups}
          onSelect={(item) => {
            patchDraft('payoutMethodId', item.id);
            patchDraft('deliveryMethodId', null); // rails differ per method
            // A currency the sender chose against the previous destination shouldn't
            // follow them to this one: its own currency is the right default again.
            patchDraft('receiveCurrency', null);
          }}
          footer={{
            label: 'Add destination',
            // 502:28886 — attaching to someone who already exists. Seeding their
            // details is what lets the rail skip Personal details.
            onClick: () =>
              enterSubflow('addRecipient', 'ar.method', {
                attachTo: recipient?.id ?? null,
                country: recipient?.country ?? 'US',
                email: recipient?.email ?? '',
                firstName: recipient?.name?.split(' ')[0] ?? '',
                lastName: recipient?.name?.split(' ').slice(1).join(' ') ?? '',
              }),
          }}
          emptyMessage="No saved destinations yet"
          renderTrigger={(_, open, { interactive }) => (
            <SelectRow
              variant="field"
              active={open}
              // The flag badge hangs below the mark, so the field owes it 8px.
              leadingOverhang={Boolean(method?.country)}
              leading={
                method ? (
                  <MethodMark
                    logo={method.logo}
                    country={method.country}
                    group={method.group}
                  />
                ) : null
              }
              primary={method ? method.label : 'Select a destination'}
              secondary={
                method ? destinationDetail(method, vopUnresolved) : null
              }
              badge={<MethodBadge method={method} />}
              trailing={interactive ? <Chevron open={open} /> : null}
            />
          )}
        />

        {/* Confirmation of Payee. Sits directly under the destination it's about, and
          under rather than inside the control: the control's job is to say which
          account this is, and the outstanding check is a separate fact about it.

          Mid-stack, so the Reveal's gap replaces the space-y-6 margin below it. */}
        <Reveal show={vopUnresolved} gap="pt-3">
          <Callout
            tone="brand"
            title="Recipient verification"
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  enterSubflow('vop', 'vop.verify', {
                    methodId: method?.id ?? null,
                    // Prefilled with the name the sender holds — the detail the bank
                    // disagreed with, so the difference is readable in the form.
                    firstName: method?.payee?.firstName ?? '',
                    lastName: method?.payee?.lastName ?? '',
                  })
                }
              >
                Verify
              </Button>
            }
          >
            You need to verify recipient details before continuing
          </Callout>
        </Reveal>
      </div>

      {/* "Modify reference" — 429:223074. Stays with the destination: it's what the
          recipient reads on their statement, not a property of the rail. The reference
          is optional, so ticking the box does not gate Continue. Shown for the rails
          that produce a statement at all, which is what `supportsReference` says. */}
      {rail?.supportsReference && (
        <div>
          <Checkbox
            checked={reference.enabled}
            onChange={(v) => patchDraft('reference.enabled', v)}
            label="Modify reference"
            // Present tense: what the recipient sees on their statement is an ongoing fact
            // about the payout, not a one-time future event (Dante).
            description="What your recipient sees on their bank statement"
          />

          <Reveal show={reference.enabled} gap="pt-3">
            <TextInput
              value={reference.value}
              onChange={(v) => patchDraft('reference.value', v)}
              placeholder="Recipient reference"
              autofill="INV-2048"
              ariaLabel="Recipient reference"
              className="ml-[22px] w-[calc(100%-22px)]"
            />
          </Reveal>
        </div>
      )}

      {/* Moved here from Payout details, where it sat below the date and had nothing to do
          with either. It's bookkeeping about this payout, so it keeps company with the
          reference: one line the recipient reads, one line only you read.

          "Add description", not "Add an internal note": the pair reads as one decision about
          what gets written where, and "description" is the word the Dashboard uses for it.
          "Dashboard" is capitalised because it's the product (Dante). */}
      <div>
        <Checkbox
          checked={note.enabled}
          onChange={(v) => patchDraft('note.enabled', v)}
          label="Add description"
          description="What you see in your Dashboard"
        />

        <Reveal show={note.enabled} gap="pt-3">
          {/* One line, not a textarea: a description is a label for your own records, and a
              three-row box invited a paragraph nobody reads back. */}
          <TextInput
            value={note.value}
            onChange={(v) => patchDraft('note.value', v)}
            placeholder="Only visible to you and your team"
            autofill="Q3 contractor payment — approved by Finance."
            ariaLabel="Description"
            className="ml-[22px] w-[calc(100%-22px)]"
          />
        </Reveal>
      </div>
    </div>
  );
}

/**
 * The destination's detail line, with the payee check flagged on it when one is
 * outstanding: the banner below explains it, and the glyph is what ties the two
 * together when the banner is the third panel on the screen.
 */
function destinationDetail(method, vopUnresolved) {
  const text = methodSublabel(method);
  if (!vopUnresolved) return text;
  return (
    <span className="flex items-center gap-1">
      <Icon
        name="warningCircle"
        size="xxsmall"
        className="shrink-0 text-action-link"
      />
      <span className="truncate">{text}</span>
    </span>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <p className="text-sail-label-small-emphasized mb-1.5 text-ink">
        {label}
      </p>
      {children}
      {help && (
        <p className="text-sail-label-small mt-1.5 text-ink-faint">{help}</p>
      )}
    </div>
  );
}

function Chevron({ open }) {
  return <SelectChevron className="text-ink-muted" />;
}
