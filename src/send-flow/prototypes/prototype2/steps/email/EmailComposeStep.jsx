import React, { useEffect, useState } from 'react';
import SelectChevron from '../../ui/SelectChevron';
import { Icon } from '../../../../icons/SailIcons';
import { useFlow } from '../../flow/FlowProvider';
import { ACCOUNTS, ACCOUNT_GROUPS, account } from '../../data/accounts';
import { country } from '../../data/countries';
import {
  ALL_PAYOUT_METHOD_IDS,
  PAYOUT_METHOD_CHOICES,
  methodsSummary,
} from '../../data/emailInvite';
import { currencySymbol, formatMoney } from '../../flow/selectors';
import CountrySelect from '../../ui/CountrySelect';
import GroupedDropdown from '../../ui/GroupedDropdown';
import SplitField from '../../ui/SplitField';
import SignedAmountInput from '../../ui/SignedAmountInput';
import MethodMark from '../../ui/MethodMark';
import CurrencySelect from '../../ui/CurrencySelect';
import usePopover from '../../ui/usePopover';
import PopoverPanel from '../../ui/PopoverPanel';
import Reveal from '../../ui/Reveal';
import Checkbox, { CheckboxBox } from '../../ui/Checkbox';
import TextInput from '../../ui/TextInput';
import { DuplicateAccountNudge } from '@/components/creation-workspace/account-configuration/AccountConfigurationPrimitives';
import { findMatchingNetworkAccount } from '@/components/creation-workspace/account-configuration/model';
import { methodsForRecipient } from '../../data/payoutMethods';

/**
 * Send via email — 429:225139 (compose) and 429:225269 (methods open).
 *
 * Every field feeds EmailPreviewPane on the right, which re-renders as you type.
 */
export default function EmailComposeStep() {
  const { state, dispatch, patchEmailInvite } = useFlow();
  const invite = state.emailInvite;
  const [dismissedMatchId, setDismissedMatchId] = useState(null);
  const matchingAccount = findMatchingNetworkAccount(invite.email ?? '');
  const showNudge = Boolean(matchingAccount && dismissedMatchId !== matchingAccount.id);

  const chosenAccount = account(invite.sourceAccountId);
  const sourceCurrency = chosenAccount?.currency ?? 'USD';

  // Same rule as Payout details: match the recipient country's currency, else USD.
  useEffect(() => {
    if (invite.sourceAccountId) return;
    const wanted = country(invite.country).currency;
    const match =
      ACCOUNTS.find((a) => a.currency === wanted) ??
      ACCOUNTS.find((a) => a.currency === 'USD');
    if (match) patchEmailInvite('sourceAccountId', match.id);
  }, [invite.sourceAccountId, invite.country, patchEmailInvite]);

  /**
   * Currencies the sender can pay in: the ones they hold. Picking one switches the
   * funding account, as on Payout details — a currency that disagreed with the
   * account it leaves would be fiction.
   */
  const sendCurrencies = [...new Set(ACCOUNTS.map((a) => a.currency))];

  const onSendCurrency = (code) => {
    const match = ACCOUNTS.find((a) => a.currency === code);
    if (match) patchEmailInvite('sourceAccountId', match.id);
  };

  const accountGroups = ACCOUNT_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    items: ACCOUNTS.filter((a) => a.group === g.id).map((a) => ({
      id: a.id,
      primary: a.name,
      secondary: `${formatMoney(a.balance, a.currency)} available`,
      leading: <MethodMark country={a.country} group="account" />,
      leadingOverhang: true,
      trailing: (
        <span className="text-sail-label-small shrink-0 text-ink-faint">
          {a.currency}
        </span>
      ),
    })),
  }));

  return (
    <div className="space-y-5">
      <Field label="Recipient country">
        <CountrySelect
          value={invite.country}
          onChange={(code) => {
            patchEmailInvite('country', code);
            // Let the currency rule re-run for the new country.
            patchEmailInvite('sourceAccountId', null);
          }}
        />
      </Field>

      <Field label="Recipient email">
        <TextInput
          type="email"
          value={invite.email}
          onChange={(v) => patchEmailInvite('email', v)}
          placeholder="e.g. name@example.com"
          autofill="accounts@juniperyoga.example"
          ariaLabel="Recipient email"
        />
        {showNudge ? (
          <div className="mt-1.5">
            <DuplicateAccountNudge
              account={matchingAccount}
              description="This email is already linked to an account in your Network. Continue with the existing account to save time. We’ll pre-fill identity and payout details."
              onDismiss={() => setDismissedMatchId(matchingAccount.id)}
              onUseExisting={() => {
                dispatch({
                  type: 'ADOPT_RECIPIENT',
                  recipient: {
                    id: matchingAccount.id,
                    name: matchingAccount.name,
                    email: matchingAccount.email,
                    initials: matchingAccount.initials,
                    country: matchingAccount.country === 'UK' ? 'GB' : matchingAccount.country,
                    entity: 'recipient',
                    methods: methodsForRecipient(matchingAccount.id),
                    logo: matchingAccount.hasBrandIcon ? '/unified-account-icon.png' : undefined,
                    hasBrandIcon: matchingAccount.hasBrandIcon,
                  },
                });
              }}
            />
          </div>
        ) : null}
      </Field>

      <Field label="Pay from">
        {/* Same three targets as Payout details: the account selector owns the left
            cell, the number owns the rest of the amount cell, and the currency code is
            its own control. */}
        <SplitField
          left={
            <GroupedDropdown
              className="flex h-full min-w-0 flex-1"
              value={chosenAccount ? { id: chosenAccount.id } : null}
              groups={accountGroups}
              onSelect={(item) => patchEmailInvite('sourceAccountId', item.id)}
              renderTrigger={(_, open) => (
                <span className="flex h-full w-full items-center gap-2">
                  {chosenAccount ? (
                    // pb-2/pr-2 reserve the flag badge's overhang, as on Payout details.
                    <span className="flex shrink-0 items-center pb-2 pr-2">
                      <MethodMark
                        country={chosenAccount.country}
                        group="account"
                      />
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-panel">
                      <Icon
                        name="bank"
                        size="small"
                        className="text-ink-faint"
                      />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="text-sail-label-medium-emphasized block truncate text-ink">
                      {chosenAccount?.name ?? 'Account'}
                    </span>
                    <span className="text-sail-label-small block truncate text-ink-faint">
                      {chosenAccount
                        ? `${formatMoney(chosenAccount.balance, chosenAccount.currency)} available`
                        : 'Select an account'}
                    </span>
                  </span>
                  <SelectChevron className="text-ink-muted" />
                </span>
              )}
            />
          }
          right={
            <SignedAmountInput
              sign="−"
              symbol={currencySymbol(sourceCurrency)}
              value={invite.amount}
              onChange={(raw) => patchEmailInvite('amount', raw)}
              ariaLabel="Amount to send by email"
              trailing={
                <CurrencySelect
                  value={sourceCurrency}
                  options={sendCurrencies}
                  onSelect={onSendCurrency}
                  ariaLabel="Currency you pay in"
                  menuLabel="You pay in"
                />
              }
            />
          }
        />
      </Field>

      {/* Dante's line, and its reasoning: the label plus a multi-select already say
          "pick some of these", so the description spends itself on the consequence the
          sender can't see. It also scales to both states — select everything and the
          recipient can choose anything; select one and that's their only option. */}
      <Field
        label="Destinations"
        help="The recipient chooses from the destinations you select."
      >
        <MethodsSelect
          value={invite.methods}
          onChange={(v) => patchEmailInvite('methods', v)}
        />
      </Field>

      <div>
        <Checkbox
          checked={invite.note.enabled}
          onChange={(v) => patchEmailInvite('note.enabled', v)}
          label="Note to recipient"
          description="Add a message in the email your recipient will see"
        />

        <Reveal show={invite.note.enabled} gap="pt-3">
          <TextInput
            multiline
            value={invite.note.value}
            onChange={(v) => patchEmailInvite('note.value', v)}
            placeholder="Thanks for the work this month"
            ariaLabel="Note to recipient"
            className="ml-[22px] w-[calc(100%-22px)]"
          />
        </Reveal>
      </div>
    </div>
  );
}

/**
 * Which methods the recipient may accept with — drives the preview's bullet list.
 *
 * Multi-select: the recipient chooses from whatever is offered, so this is a set
 * rather than one pick. The panel stays open on toggle (closing after each click
 * would make selecting two methods needlessly slow), and each row is a checkbox
 * rather than an option, so `aria-checked` on a menuitemcheckbox is the right
 * semantic.
 */
function MethodsSelect({ value, onChange }) {
  const { ref, panelRef, open, expanded, animation, toggle } = usePopover();

  const toggleMethod = (id) => {
    const next = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    // Re-sorted into canonical order so the trigger summary and the preview's
    // bullet list don't reorder as methods are toggled.
    onChange(ALL_PAYOUT_METHOD_IDS.filter((v) => next.includes(v)));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={expanded}
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-control bg-canvas px-3 text-left shadow-[0_0_0_1px_var(--color-border)]"
      >
        <span
          className={`truncate ${
            value.length
              ? 'text-sail-label-medium-emphasized text-ink'
              : 'text-sail-label-medium text-ink-placeholder'
          }`}
        >
          {methodsSummary(value)}
        </span>
        <Stepper />
      </button>

      {open && (
        <PopoverPanel
          anchorRef={ref}
          panelRef={panelRef}
          animation={animation}
          className="p-1.5"
        >
          {PAYOUT_METHOD_CHOICES.map((m) => {
            const checked = value.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                onClick={() => toggleMethod(m.id)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-card px-3 py-2.5 text-left transition-colors hover:bg-panel"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-panel">
                  <Icon name={m.icon} size="small" className="text-ink-muted" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="text-sail-label-medium-emphasized block truncate text-ink">
                    {m.label}
                  </span>
                  <span className="text-sail-label-small block truncate text-ink-faint">
                    {m.eta} &middot; {m.rail} &middot;{' '}
                    {m.fee ? `Fee from ${formatMoney(m.fee)}` : 'Free'}
                  </span>
                </span>

                <CheckboxBox checked={checked} />
              </button>
            );
          })}
        </PopoverPanel>
      )}
    </div>
  );
}

function Stepper() {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      className="shrink-0 text-ink-muted"
    >
      <path
        d="M2.5 6.5 6 3l3.5 3.5M2.5 9.5 6 13l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      {/* The label and its description are one block: 2px between them, then 12px
          before the control. Evenly spaced, the description floated between the two and
          read as if it might belong to either. */}
      <p
        className={`text-sail-label-medium-emphasized text-ink ${help ? 'mb-0.5' : 'mb-1.5'}`}
      >
        {label}
      </p>
      {help && (
        <p className="text-sail-label-small mb-3 text-ink-muted">{help}</p>
      )}
      {children}
    </div>
  );
}
