import React, { useEffect, useRef } from 'react';
import { useFlow } from '../../flow/FlowProvider';
import InfoIcon from '../../ui/InfoIcon';
import SegmentedControl from '../../ui/SegmentedControl';
import Reveal from '../../ui/Reveal';
import TextInput from '../../ui/TextInput';
import FieldNote from '../../ui/FieldNote';
import { deliveryMethod } from '../../data/deliveryMethods';
import {
  ADDRESS_FIELDS,
  addressRequired,
  effectiveMethod,
  noPoBox,
} from '../../data/kyc';

/**
 * Personal details — 429:225650.
 *
 * The individual/company switch, then the name fields. Primary action reads
 * "Save".
 *
 * The frame opens with a read-only summary of the method just entered; that card
 * has been dropped. Back edits it, and the account number is not something you
 * check your own name against — so it was repeating the step you just left rather
 * than informing this one.
 */
export default function PersonalDetailsStep() {
  const { state, patchNewRecipient } = useFlow();
  const n = state.newRecipient;
  const needsAddress = needsAddressFor(n);

  /**
   * When the RAIL is what's asking, say so. Entered from the Destination step, the
   * address block appears on a form the sender didn't expect to fill in — and the
   * country requirements line above can't explain it, because the country doesn't
   * require it. The rail does.
   */
  /**
   * When the RAIL is what's asking for the address, name it. Entered from Payout details,
   * the address block appears on a form the sender didn't expect to fill in, and the
   * country requirements line above can't explain it — the country doesn't require it.
   *
   * Only the address is asked for here. A rail's own identifiers (a SWIFT code, a wire
   * routing number) are destination details and have their own step.
   */
  /**
   * Opened from a payout to collect the address, rather than as part of adding a recipient.
   *
   * In that case the name and email are already on file: they're shown for context and
   * locked, and the caret goes to the first address line — the one field the payout is
   * actually waiting on. Same treatment as the destination form, and it keeps the sheet's
   * own "focus the first field" fallback out of the way, since a disabled input is skipped.
   */
  const enteredForAddress = Boolean(n.railId) && needsAddressFor(n);

  const onFile = useRef(null);
  if (onFile.current === null) {
    onFile.current = new Set(
      enteredForAddress
        ? ['firstName', 'lastName', 'companyName'].filter((k) =>
            String(n[k] ?? '').trim(),
          )
        : [],
    );
  }
  const locked = (key) => onFile.current.has(key);

  const railAsking = (() => {
    if (!n.railId) return null;
    // Only when the RAIL is what added the requirement: if the country and type would ask
    // for an address anyway, blaming the rail would be wrong, and the requirements line
    // above already says so.
    const withoutRail = addressRequired({
      country: n.country,
      type: n.type,
      method: effectiveMethod(n),
    });
    return needsAddress && !withoutRail ? deliveryMethod(n.railId) : null;
  })();

  /**
   * The address block can push the form past the fold — a US individual paying by
   * wire needs it, and it sits below the name fields. Save then looks broken:
   * disabled, with the fields it's waiting on off-screen. So scroll it into view
   * when it appears.
   */
  const addressRef = useRef(null);
  useEffect(() => {
    if (!needsAddress) return;
    const el = addressRef.current;
    if (!el) return;
    // After the reveal has animated, so the scroll targets its final position.
    const t = setTimeout(
      () => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      260,
    );
    return () => clearTimeout(t);
  }, [needsAddress]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
          Recipient type
        </p>
        <SegmentedControl
          value={n.type}
          onChange={(v) => patchNewRecipient('type', v)}
          options={[
            { id: 'individual', label: 'Individual', icon: 'person' },
            { id: 'company', label: 'Company', icon: 'office' },
          ]}
        />
        {/* One line, hung off the glyph. The country-requirements summary that used to sit
            under it ("United States requires email, name, address.") is gone: the fields on
            screen already are the requirement, and when a rail added one the note above that
            block says which rail and why — so the summary was a third voice on the same
            subject, and the one most likely to contradict the other two. */}
        <div className="mt-4 flex gap-1.5">
          <InfoIcon className="mt-0.5 text-ink-muted" />
          <p className="text-sail-label-medium text-ink-muted">
            Personal details must match the names on the recipient&rsquo;s
            destination.
          </p>
        </div>
      </div>

      {n.type === 'company' ? (
        <TextField
          label="Company name"
          placeholder="Acme Inc."
          disabled={locked('companyName')}
          value={n.companyName}
          onChange={(v) => patchNewRecipient('companyName', v)}
        />
      ) : (
        <>
          <TextField
            label="First name"
            placeholder="Ada"
            disabled={locked('firstName')}
            value={n.firstName}
            onChange={(v) => patchNewRecipient('firstName', v)}
          />
          <TextField
            label="Last name"
            placeholder="Lovelace"
            disabled={locked('lastName')}
            value={n.lastName}
            onChange={(v) => patchNewRecipient('lastName', v)}
          />
        </>
      )}

      {/* Address comes last: the docs order the requirements email, name, address,
          and it's the only block that appears and disappears, so keeping it at the
          end means the fields above never move. */}
      {/* Last child, so the previous field's space-y-5 margin supplies the gap. */}
      <Reveal show={needsAddress}>
        <div ref={addressRef} className="pb-px">
          {/* Plain text directly above the block it explains, rather than a panel at the top
              of the form: the reason belongs next to the fields it justifies. */}
          {railAsking && (
            <FieldNote className="mb-2">
              To send {article(railAsking.label)} {railAsking.label} payout we
              require the recipient&rsquo;s address.
            </FieldNote>
          )}
          <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
            {n.type === 'company' ? 'Company address' : 'Address'}
          </p>
          {noPoBox(n.country) && (
            <p className="text-sail-label-small mb-1.5 text-ink-faint">
              Can&rsquo;t be a PO box.
            </p>
          )}
          <div className="space-y-3">
            {ADDRESS_FIELDS.map((f, i) => (
              <TextInput
                key={f.key}
                // Only when the address is why this screen opened: in the add-recipient rail
                // the block is mounted but hidden, and autoFocus would pull the caret into a
                // field nobody can see.
                autoFocus={enteredForAddress && i === 0}
                value={n[f.key] ?? ''}
                onChange={(v) => patchNewRecipient(f.key, v)}
                placeholder={f.optional ? `${f.label} (optional)` : f.label}
                autofill={f.placeholder}
                ariaLabel={f.label}
              />
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

/**
 * "an RTP payout", "a Wire payout".
 *
 * The article follows how the name is SAID, which the spelling doesn't tell you: RTP
 * and FPS are read letter by letter and start on a vowel sound, while SEPA and SWIFT
 * are read as words and don't. So the initialisms are listed rather than inferred.
 */
const SPELLED_OUT = new Set(['RTP', 'FPS', 'EFT', 'NPP']);

function article(label) {
  if (SPELLED_OUT.has(label)) return 'an';
  return /^[AEIOU]/i.test(label) ? 'an' : 'a';
}

/** Whether this recipient + rail combination has to supply an address. */
function needsAddressFor(n) {
  return addressRequired({
    country: n.country,
    type: n.type,
    method: effectiveMethod(n),
    railId: n.railId,
  });
}

function TextField({
  label,
  type = 'text',
  placeholder,
  help,
  disabled,
  value,
  onChange,
}) {
  return (
    <div>
      <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
        {label}
      </p>
      <TextInput
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        ariaLabel={label}
      />
      {/* The rail's identifiers need saying why: a wire routing number isn't the one on
          a cheque, and a SWIFT code isn't something most senders have to hand. */}
      {help && (
        <p className="text-sail-label-small mt-1.5 text-ink-faint">{help}</p>
      )}
    </div>
  );
}
