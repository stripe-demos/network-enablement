import React, { useEffect, useMemo } from 'react';
import SelectChevron from '../../ui/SelectChevron';
import { Icon } from '../../../../icons/SailIcons';
import Badge from '../../../../components/Badge';
import { useFlow } from '../../flow/FlowProvider';
import { ACCOUNTS, ACCOUNT_GROUPS, account } from '../../data/accounts';
import {
  EXTERNAL_ACCOUNTS,
  EXTERNAL_GROUPS,
  defaultExternalAccount,
  externalAccount,
  externalRailFor,
  externalSublabel,
} from '../../data/externalAccounts';
import { currencySymbol, formatMoney } from '../../flow/selectors';
import GroupedDropdown from '../../ui/GroupedDropdown';
import SplitField from '../../ui/SplitField';
import SignedAmountInput from '../../ui/SignedAmountInput';
import MethodMark from '../../ui/MethodMark';
import Reveal from '../../ui/Reveal';
import Checkbox from '../../ui/Checkbox';
import TextInput from '../../ui/TextInput';

/**
 * Pay out to external account — money leaving Stripe for one of the sender's own accounts.
 *
 * Deliberately shorter than Payout details: there's no recipient to verify, no delivery
 * choice to weigh (a standard payout is the rail, and it's free), and no fee ladder,
 * because nothing is charged. What's left is which account it leaves, which account it
 * lands in, and how much — so the two split fields carry the whole decision.
 *
 * Both amounts show the same figure. That's not a simplification: a standard payout to your
 * own account costs nothing, so what leaves is what arrives.
 */
export default function ExternalPayoutStep() {
  const { state, patchDraft } = useFlow();
  const { amount, reference, note } = state.draft;

  const source = account(state.draft.sourceAccountId);
  const target = externalAccount(state.draft.externalAccountId);
  const sourceCurrency = source?.currency ?? 'USD';

  // Open on the account the sender paid last, and on a funding account in the same
  // currency — the same rules the recipient flow uses, for the same reason.
  useEffect(() => {
    if (!state.draft.externalAccountId) {
      patchDraft('externalAccountId', defaultExternalAccount().id);
    }
  }, [state.draft.externalAccountId, patchDraft]);

  useEffect(() => {
    if (state.draft.sourceAccountId) return;
    const wanted = target?.currency ?? 'USD';
    const match =
      ACCOUNTS.find((a) => a.currency === wanted) ??
      ACCOUNTS.find((a) => a.currency === 'USD');
    if (match) patchDraft('sourceAccountId', match.id);
  }, [state.draft.sourceAccountId, target, patchDraft]);

  /**
   * The rail follows the kind of account: a bank gets the standard payout, a wallet settles
   * on its network. Kept in the draft rather than derived at read time so the quote, Review
   * and the payout record all price the same transfer.
   */
  useEffect(() => {
    if (!target) return;
    const rail = externalRailFor(target);
    if (state.draft.deliveryMethodId !== rail)
      patchDraft('deliveryMethodId', rail);
  }, [target, state.draft.deliveryMethodId, patchDraft]);

  const accountGroups = useMemo(
    () =>
      ACCOUNT_GROUPS.map((g) => ({
        id: g.id,
        label: g.label,
        items: ACCOUNTS.filter((a) => a.group === g.id).map((a) => ({
          id: a.id,
          primary: a.name,
          secondary: a.currency,
          leading: <MethodMark country={a.country} group="account" />,
          leadingOverhang: true,
          trailing: (
            <span className="text-sail-label-small shrink-0 text-ink-faint">
              {formatMoney(a.balance, a.currency)}
            </span>
          ),
        })),
      })),
    [],
  );

  const targetGroups = useMemo(
    () =>
      EXTERNAL_GROUPS.map((g) => ({
        id: g.id,
        label: g.label,
        // Each group owns its own "Add new": a wallet isn't added the way a bank account is,
        // and one shared action at the bottom of the panel couldn't say which it meant.
        action: { label: 'Add new', onClick: () => {} },
        items: EXTERNAL_ACCOUNTS.filter((a) => a.group === g.id).map((a) => ({
          id: a.id,
          primary: a.label,
          secondary: externalSublabel(a),
          leading: (
            <MethodMark
              logo={a.logo}
              country={a.group === 'bank' ? a.country : null}
              group={a.group}
            />
          ),
          // Only the bank rows carry a flag, so only they owe it room.
          leadingOverhang: a.group === 'bank',
          badge:
            a.badge === 'lastUsed' ? (
              <Badge variant="default">Last used</Badge>
            ) : null,
        })),
      })),
    [],
  );

  const value = amount.value;
  const onAmount = (raw) => {
    patchDraft('amount.edited', 'receive');
    patchDraft('amount.value', raw);
  };

  return (
    <div className="space-y-5">
      <Field label="From">
        <SplitField
          // Wider than the recipient rows: these carry a balance or a "Last used" tag
          // beside the account name, and 272px truncated both.
          left={
            <GroupedDropdown
              className="flex h-full min-w-0 flex-1"
              value={source ? { id: source.id } : null}
              groups={accountGroups}
              onSelect={(item) => patchDraft('sourceAccountId', item.id)}
              renderTrigger={(_, open) => (
                <span className="flex h-full w-full items-center gap-2">
                  <span className="flex shrink-0 items-center pb-2 pr-2">
                    <MethodMark country={source?.country} group="account" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sail-label-medium-emphasized block truncate text-ink">
                      {source?.name ?? 'Account'}
                    </span>
                    <span className="text-sail-label-small block truncate text-ink-faint">
                      {source?.currency ?? 'Select an account'}
                    </span>
                  </span>
                  {/* The balance sits with the account rather than in the amount cell, as
                      the frame has it: it's a fact about the account, and the amount cell
                      belongs to the figure being typed. */}
                  {source && (
                    <span className="text-sail-label-small shrink-0 text-ink-muted">
                      {formatMoney(source.balance, source.currency)}
                    </span>
                  )}
                  <Chevron open={open} />
                </span>
              )}
            />
          }
          right={
            <SignedAmountInput
              sign="−"
              symbol={currencySymbol(sourceCurrency)}
              value={value}
              onChange={onAmount}
              ariaLabel="Amount to pay out"
              autoFocus
            />
          }
        />
      </Field>

      <Field label="To">
        <SplitField
          left={
            <GroupedDropdown
              className="flex h-full min-w-0 flex-1"
              value={target ? { id: target.id } : null}
              groups={targetGroups}
              onSelect={(item) => {
                patchDraft('externalAccountId', item.id);
                // The rail follows the account, and a currency chosen against the old one
                // shouldn't follow it either.
                patchDraft('receiveCurrency', null);
              }}
              renderTrigger={(_, open) => (
                <span className="flex h-full w-full items-center gap-2">
                  <span className="flex shrink-0 items-center pb-2 pr-2">
                    <MethodMark
                      logo={target?.logo}
                      country={
                        target?.group === 'bank' ? target?.country : null
                      }
                      group={target?.group ?? 'bank'}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sail-label-medium-emphasized block truncate text-ink">
                      {target?.label ?? 'Select an account'}
                    </span>
                    <span className="text-sail-label-small block truncate text-ink-faint">
                      {externalSublabel(target) ?? 'Your linked accounts'}
                    </span>
                  </span>
                  {target?.badge === 'lastUsed' && (
                    <Badge variant="default">Last used</Badge>
                  )}
                  <Chevron open={open} />
                </span>
              )}
            />
          }
          right={
            <SignedAmountInput
              sign="+"
              symbol={currencySymbol(target?.currency ?? sourceCurrency)}
              value={value}
              onChange={onAmount}
              ariaLabel="Amount arriving"
            />
          }
        />
      </Field>

      {/* "Statement descriptor" rather than "Modify reference": on your own payout the text
          appears on your own statement, and the frame words it that way. It writes to the
          same draft field, so Review and the record don't need to know which screen set it. */}
      <div>
        <Checkbox
          checked={reference.enabled}
          onChange={(v) => patchDraft('reference.enabled', v)}
          label="Statement descriptor"
          description={
            <>
              This is the text your recipient will see on their bank statement.
              You can also configure an account-level statement descriptor in{' '}
              {/* A pointer, not a route: Settings is outside this flow, and the frame draws it
                  as a link because that's where the durable version of this field lives. */}
              <span className="text-action-link">Settings</span>.
            </>
          }
        />

        <Reveal show={reference.enabled} gap="pt-3">
          <TextInput
            value={reference.value}
            onChange={(v) => patchDraft('reference.value', v)}
            placeholder="Statement descriptor"
            autofill="ROCKET RIDES PAYOUT"
            ariaLabel="Statement descriptor"
            className="ml-[22px] w-[calc(100%-22px)]"
          />
        </Reveal>
      </div>

      <div>
        <Checkbox
          checked={note.enabled}
          onChange={(v) => patchDraft('note.enabled', v)}
          label="Internal note"
          description="This is only visible to you."
        />

        <Reveal show={note.enabled} gap="pt-3">
          <TextInput
            multiline
            value={note.value}
            onChange={(v) => patchDraft('note.value', v)}
            placeholder="Only visible to your team"
            autofill="Sweep to operating account."
            ariaLabel="Internal note"
            className="ml-[22px] w-[calc(100%-22px)]"
          />
        </Reveal>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
        {label}
      </p>
      {children}
    </div>
  );
}

function Chevron({ open }) {
  return <SelectChevron className="text-ink-muted" />;
}
