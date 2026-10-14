import React, { useRef } from 'react';
import { useFlow } from '../../flow/FlowProvider';
import { bankFieldsFor } from '../../data/countries';
import { deliveryMethod, railFormKeys } from '../../data/deliveryMethods';
import { Icon } from '../../../../icons/SailIcons';
import TextInput from '../../ui/TextInput';
import FieldNote from '../../ui/FieldNote';

/**
 * Destination details — the account, with whatever the chosen rail still needs.
 *
 * The same form as adding a destination (PayoutMethodFormStep), opened on an account that
 * already exists: the details on file arrive prefilled and the one the rail is waiting on
 * is blank and required. Asking for a SWIFT code on its own made it look like a separate
 * kind of thing; it isn't — it's a field on this account that nobody filled in.
 *
 * Fields, labels and order all come from data/countries.js, so a UK account asks for a
 * Sort code and a French one for an IBAN without this component knowing about either.
 */
export default function DestinationDetailsStep() {
  const { state, patchNewRecipient } = useFlow();
  const n = state.newRecipient;

  const rail = deliveryMethod(n.railId);
  const fields = bankFieldsFor(n.country, n.method);

  /**
   * The rail's requirement, in this form's own terms. A field the account form treats as
   * optional stops being optional when the rail can't move without it, so it loses the
   * "(optional)" and joins the gate — see graph.destinationFormReady.
   */
  const required = new Set(railFormKeys(n.railId));
  const isOptional = (f) => f.optional && !required.has(f.key);

  /**
   * Which fields arrived with a value, captured once on mount.
   *
   * Those are the details already on file, and they're locked: the sender came here to
   * supply one missing number, and an account number that's editable invites a change
   * nobody asked for — with no way to tell afterwards which of the two the bank rejected.
   * Read from a ref rather than from the live values so a field doesn't lock itself the
   * moment it's typed into.
   */
  const onFile = useRef(null);
  if (onFile.current === null) {
    onFile.current = new Set(
      fields
        .filter((f) => String(n[f.key] ?? '').trim() && !required.has(f.key))
        .map((f) => f.key),
    );
  }
  const locked = (f) => onFile.current.has(f.key);

  /** The field the payout is waiting on takes the caret, so typing starts in the right box. */
  const focusKey = fields.find((f) => required.has(f.key))?.key ?? null;

  /**
   * Why this screen appeared mid-payout, said once, immediately above the field it's about.
   *
   * Plain text rather than a panel: a callout at the top of the form was a second thing to
   * read before the sender could see which box was theirs to fill, and it sat furthest from
   * the answer. The add-destination form needs no explanation at all — the sender went
   * looking for it — but this one interrupted them, and which rail asked is the part they
   * can't infer.
   */
  const note = rail
    ? `To send by ${rail.label} we require a ${list(
        fields
          .filter((f) => required.has(f.key))
          .map((f) => midSentence(f.label)),
      )}`
    : null;

  const primary = fields.filter((f) => !isOptional(f) && !f.hidden);
  const optional = fields.filter(isOptional);

  return (
    <div className="space-y-5">
      {/* What's being edited: the kind of destination and whose it is. The heading names the
          screen, not the account — and with the account's own fields locked below, the sender
          needs to know which account they're looking at before the one live field means
          anything. */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-panel">
          <Icon
            name={GLYPHS[n.method] ?? 'bank'}
            size="small"
            className="text-ink-muted"
          />
        </span>
        <span className="min-w-0">
          <span className="text-sail-label-medium-emphasized block truncate text-ink">
            {METHOD_TITLES[n.method] ?? 'Destination'}
          </span>
          <span className="text-sail-label-medium block truncate text-ink-muted">
            {[n.firstName, n.lastName].filter(Boolean).join(' ') || 'Recipient'}
          </span>
        </span>
      </div>

      {primary.map((f) => (
        <TextField
          key={f.key}
          label={f.label}
          placeholder={`e.g. ${f.placeholder}`}
          autofill={f.autofill ?? f.placeholder}
          disabled={locked(f)}
          autoFocus={f.key === focusKey}
          note={f.key === focusKey ? note : null}
          value={n[f.key] ?? ''}
          onChange={(v) => patchNewRecipient(f.key, v)}
        />
      ))}

      {/* Optional fields side by side, as on the add-destination form. */}
      {optional.length > 0 && (
        <div
          className={`grid gap-4 ${optional.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {optional.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              optional
              placeholder={`e.g. ${f.placeholder}`}
              autofill={f.autofill ?? f.placeholder}
              disabled={locked(f)}
              autoFocus={f.key === focusKey}
              note={f.key === focusKey ? note : null}
              value={n[f.key] ?? ''}
              onChange={(v) => patchNewRecipient(f.key, v)}
            />
          ))}
        </div>
      )}

      {/* No "Collect with email" here. On the add-destination form it's the way out when you
          don't have the details; here the payout is already built and waiting on one field, and
          emailing the recipient would abandon it. */}
    </div>
  );
}

function TextField({
  label,
  optional,
  placeholder,
  autofill,
  disabled,
  autoFocus,
  note,
  value,
  onChange,
}) {
  return (
    <div>
      {/* Above the label, not below it: it explains why the field is being asked for, and a
          reason that arrives after the question has already been read is late. */}
      {note && <FieldNote className="mb-2">{note}</FieldNote>}
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
        disabled={disabled}
        autoFocus={autoFocus}
      />
    </div>
  );
}

/** What the destination is called, and the glyph that stands for it. */
const METHOD_TITLES = {
  bank: 'Bank account',
  card: 'Debit card',
  wallet: 'Stablecoin wallet',
};
const GLYPHS = { bank: 'bank', card: 'card', wallet: 'wallet' };

/**
 * "an RTP payout", "a Wire payout".
 *
 * The article follows how the name is SAID, which the spelling doesn't tell you: RTP and
 * FPS are read letter by letter and start on a vowel sound, while SEPA and SWIFT are read
 * as words and don't. So the initialisms are listed rather than inferred.
 */
const SPELLED_OUT = new Set(['RTP', 'FPS', 'EFT', 'NPP']);

function article(label) {
  if (SPELLED_OUT.has(label)) return 'an';
  return /^[AEIOU]/i.test(label) ? 'an' : 'a';
}

/**
 * A field label dropped into a sentence: "Wire number" becomes "wire number", but "SWIFT
 * code" keeps its capitals — lowercasing an acronym reads as a typo.
 */
function midSentence(label) {
  if (!label) return null;
  if (/^[A-Z]{2,}/.test(label)) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/** "SWIFT code", "SWIFT code and wire number", "a, b and c". */
function list(items) {
  const clean = items.filter(Boolean);
  if (clean.length < 2) return clean[0] ?? 'details';
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
}
