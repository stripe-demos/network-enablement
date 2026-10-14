import React from 'react';
import { useFlow } from '../../flow/FlowProvider';
import { bankFieldsFor } from '../../data/countries';
import { TOKEN } from '../../data/networks';
import NetworkSelect from '../../ui/NetworkSelect';
import TextInput from '../../ui/TextInput';

/**
 * Method details — 429:225371.
 *
 * Field labels come from countries.js only, so a UK recipient asks for a Sort
 * code and a French one for an IBAN without this component knowing about either.
 *
 * Only the fields for the chosen method. Two controls used to sit above them and
 * both are gone:
 *
 *   Country      already chosen on the previous step, and repeated here it invites
 *                a change that silently rewrites every field label below it.
 *   `‹ Method`   a drill-out row naming the method. The heading now reads
 *                "[Method] details for [recipient]", so the row restated the
 *                heading, and Back in the footer is the way out.
 *
 * Both are still reachable: Back returns to the picker, which owns the country and
 * the method together.
 */
export default function PayoutMethodFormStep() {
  const { state, patchNewRecipient, enterSubflow } = useFlow();
  const { country, method } = state.newRecipient;

  const fields = bankFieldsFor(country, method);

  // Optional fields sit side by side on one row, as in the frame. `hidden` fields
  // are required but drawn by this component rather than as a generic text input
  // (the wallet's Network picker).
  const required = fields.filter((f) => !f.optional && !f.hidden);
  const optional = fields.filter((f) => f.optional);

  return (
    <div className="space-y-5">
      {/* Wallet gets a Token/Network row above the address field. Token is
          read-only because Digital USD is the only one on offer. */}
      {method === 'wallet' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
              Token
            </p>
            <div className="text-sail-label-medium flex h-10 w-full items-center rounded-control bg-panel px-3 text-ink-faint">
              {TOKEN.label}
            </div>
          </div>
          <div>
            <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
              Network
            </p>
            <NetworkSelect
              value={state.newRecipient.network}
              onChange={(id) => patchNewRecipient('network', id)}
            />
          </div>
        </div>
      )}

      {required.map((f) => (
        <TextField
          key={f.key}
          label={f.label}
          placeholder={f.placeholder}
          autofill={f.autofill}
          value={state.newRecipient[f.key] ?? ''}
          onChange={(v) => patchNewRecipient(f.key, v)}
        />
      ))}

      {optional.length > 0 && (
        <div
          className={`grid gap-4 ${optional.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {optional.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              optional
              placeholder={f.placeholder}
              autofill={f.autofill}
              value={state.newRecipient[f.key] ?? ''}
              onChange={(v) => patchNewRecipient(f.key, v)}
            />
          ))}
        </div>
      )}

      <p className="text-sail-label-medium text-ink-muted">
        Don&rsquo;t have their details?{' '}
        <button
          type="button"
          onClick={() => enterSubflow('email', 'email.compose')}
          className="text-sail-label-medium cursor-pointer text-action-link underline-offset-2 hover:underline"
        >
          Collect with email
        </button>
      </p>
    </div>
  );
}

function TextField({
  label,
  optional,
  placeholder,
  autofill,
  value,
  onChange,
}) {
  return (
    <div>
      <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
        {label}
        {optional && (
          <span className="text-sail-label-medium text-ink-faint">
            {' '}
            (optional)
          </span>
        )}
      </p>
      <TextInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autofill={autofill}
        ariaLabel={label}
      />
    </div>
  );
}
