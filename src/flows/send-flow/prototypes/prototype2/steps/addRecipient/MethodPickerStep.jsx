import React, { useState } from 'react';
import { Icon } from '../../../../icons/SailIcons';
import { useFlow } from '../../flow/FlowProvider';
import CountrySelect from '../../ui/CountrySelect';
import SelectRow from '../../ui/SelectRow';
import EmailMatchField from '../../ui/EmailMatchField';
import { DuplicateAccountNudge } from '@/components/creation-workspace/account-configuration/AccountConfigurationPrimitives';
import { findMatchingNetworkAccount } from '@/components/creation-workspace/account-configuration/model';
import { methodsForRecipient } from '../../data/payoutMethods';

/**
 * Method picker — a drill-in list, not a dropdown (429:225934). Choosing a method
 * advances into its form, mirroring the `‹ Bank account` row on 429:225371 that
 * comes back here.
 */
const METHODS = [
  {
    id: 'bank',
    label: 'Bank account',
    description: 'Local rails or SWIFT',
    icon: 'bank',
  },
  {
    id: 'card',
    label: 'Debit card',
    description: 'Instant to eligible cards',
    icon: 'card',
  },
  {
    id: 'wallet',
    label: 'Stablecoin wallet',
    description: 'USDC on supported networks',
    icon: 'wallet',
  },
];

export default function MethodPickerStep() {
  const { state, dispatch, patchNewRecipient, next } = useFlow();
  const n = state.newRecipient;
  const attaching = Boolean(n.attachTo);
  const [dismissedMatchId, setDismissedMatchId] = useState(null);
  const matchingAccount = findMatchingNetworkAccount(n.email ?? '');
  const showNudge = Boolean(!attaching && matchingAccount && dismissedMatchId !== matchingAccount.id);

  const choose = (id) => {
    patchNewRecipient('method', id);
    next();
  };

  return (
    <div className="space-y-5">
      {attaching ? null : (
        <Field label="Email address">
          <EmailMatchField
            type="email"
            placeholder="accounts@juniperyoga.example"
            value={n.email}
            onChange={(v) => patchNewRecipient('email', v)}
            match={matchingAccount}
            ariaLabel="Email address"
          />
          {showNudge ? (
            <div className="mt-1.5">
              <DuplicateAccountNudge
                account={matchingAccount}
                description="This email matches an account in your Network. Continue with it to pre-fill payout information, save time, and avoid creating a duplicate."
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
      )}

      <Field label="Country">
        <CountrySelect
          value={n.country}
          onChange={(code) => patchNewRecipient('country', code)}
        />
      </Field>

      <div>
        <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
          Destination
        </p>
        <div className="-mx-3">
          {METHODS.map((m) => (
            <SelectRow
              key={m.id}
              // Hover only, no selected fill — same as the recipient list. This is
              // a drill-in: choosing a method leaves the step immediately, so the
              // one thing a tint can mean here is "you came back from this", and it
              // reads as a filter or a disabled row instead.
              onClick={() => choose(m.id)}
              leading={
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-panel">
                  <Icon name={m.icon} size="small" className="text-ink-muted" />
                </span>
              }
              primary={m.label}
              secondary={m.description}
              chevron
            />
          ))}
        </div>
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
