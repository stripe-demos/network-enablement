import React, { useMemo } from 'react';
import { Icon } from '../../../icons/SailIcons';
import Button from '../../../components/Button';
import { useFlow } from '../flow/FlowProvider';
import {
  ENTITY_FILTERS,
  RECIPIENTS,
  identifierFor,
  recentEntities,
  searchGrouped,
} from '../data/recipients';
import SelectRow from '../ui/SelectRow';
import ExternalAccountsIcon from '../ui/ExternalAccountsIcon';
import Avatar from '../ui/Avatar';
import CountryTag from '../ui/CountryTag';
import { formatMoney } from '../flow/selectors';

/**
 * Recipient selection — 429:226230 (default) and 429:226560 (search results),
 * with the empty state and chip filter carried over from section 1
 * (429:221387 / 429:221069).
 *
 * Owns its heading row rather than using ContentColumn's heading, because the
 * heading line carries the two secondary buttons.
 */
export default function RecipientStep() {
  const { state, dispatch, setUi, enterSubflow, goto, next } = useFlow();
  const { search, filterChip } = state.ui;

  /** Selecting a recipient IS the action on this step — there is no footer. */
  const choose = (recipientId) => {
    dispatch({ type: 'SELECT_RECIPIENT', recipientId });
    next();
  };

  // Session-added recipients surface at the top of Recent.
  const all = useMemo(
    () => [...state.addedRecipients.map(toListShape), ...RECIPIENTS],
    [state.addedRecipients],
  );
  const searching = search.trim().length > 0;

  // Recent is a fixed 20 across both payable types; searching widens to the full
  // set of recipients and Stripe profiles.
  const RECENT_COUNT = 20;
  /**
   * Searching returns two groups; Recent returns one. Both are expressed as
   * sections so the list renders the same way either way.
   */
  const sections = useMemo(() => {
    if (searching) {
      const { saved, discoverable } = searchGrouped(all, search, filterChip);
      return [
        { id: 'saved', label: 'Your Network', rows: saved },
        {
          id: 'discoverable',
          label: 'Stripe profiles',
          // Says why these are here: they're public, not people you've paid.
          hint: 'Pay anyone with a Stripe profile',
          rows: discoverable,
        },
      ].filter((sec) => sec.rows.length > 0);
    }

    const added = all.filter((r) => r.isNew);
    return [
      {
        id: 'recent',
        label: 'Recent',
        rows: [
          ...added,
          ...recentEntities(RECIPIENTS, RECENT_COUNT - added.length),
        ],
      },
    ];
  }, [all, search, filterChip, searching]);

  const total = sections.reduce((n, sec) => n + sec.rows.length, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-sail-heading-large text-ink">Send to</h1>
        {/* Secondary/md with no type override and 8px between them, exactly as the
            reference heading row declares them (SendDialog.tsx:471-474). These were
            size="sm" forced down to Label/Small — a 24px button with 12px text,
            noticeably lighter than the 28px/14px the reference draws. */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon="email"
            onClick={() => enterSubflow('email', 'email.compose')}
          >
            Send by email
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon="add"
            onClick={() => enterSubflow('addRecipient', 'ar.method')}
          >
            Add recipient
          </Button>
        </div>
      </div>

      {/* Paying yourself, above the search rather than inside it: your own accounts aren't
          recipients and would never be found by searching for a name or an email. A drill-in
          row, so the chevron says there's a screen behind it — the accounts themselves are
          chosen there, where the amount is. */}
      <button
        type="button"
        onClick={() => goto('external.details', 'external')}
        className="mb-4 flex w-full cursor-pointer items-center gap-3 rounded-card bg-panel px-3 py-3 text-left transition-colors hover:bg-panel-deep"
      >
        {/* The supplied mark carries its own tile, so there's no wrapper here — see
            ui/ExternalAccountsIcon. */}
        <ExternalAccountsIcon />
        <span className="min-w-0 flex-1">
          <span className="text-sail-label-medium-emphasized block truncate text-ink">
            Your external accounts
          </span>
          <span className="text-sail-label-small block truncate text-ink-faint">
            Send money to yourself using your linked accounts
          </span>
        </span>
        <Icon
          name="chevronRight"
          size="xsmall"
          className="shrink-0 text-ink-muted"
        />
      </button>

      <label className="relative mb-4 block">
        <span className="sr-only">Search recipients</span>
        <Icon
          name="search"
          size="small"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setUi('search', e.target.value)}
          placeholder="Search by name, email, or Stripe ID"
          className="text-sail-label-medium h-10 w-full rounded-control border-0 bg-canvas pl-9 pr-3 text-ink shadow-form outline-none transition-shadow duration-150 placeholder:text-ink-faint focus:shadow-form-focus"
        />
      </label>

      {/* Entity filters — only while searching, since Recent is already scoped */}
      {searching && (
        <div className="mb-4 flex items-center gap-1.5">
          {ENTITY_FILTERS.map((f) => {
            const active = filterChip === f.id;
            return (
              <button
                key={f.id ?? 'all'}
                type="button"
                onClick={() => setUi('filterChip', f.id)}
                className={`text-sail-label-small-emphasized flex h-6 shrink-0 cursor-pointer items-center rounded-full px-2.5 transition-colors ${
                  active
                    ? 'text-action-link shadow-[0_0_0_1px_var(--color-action)]'
                    : 'text-ink shadow-[0_0_0_1px_var(--color-border)] hover:bg-panel'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {total === 0 ? (
        <EmptyState
          onAddRecipient={() => enterSubflow('addRecipient', 'ar.method')}
          onInvite={() => enterSubflow('email', 'email.compose')}
        />
      ) : (
        <div>
          {sections.map((sec, i) => (
            <div key={sec.id} className={i > 0 ? 'mt-5' : ''}>
              <p className="text-sail-label-medium mb-2 text-ink-muted">
                {sec.label}
              </p>
              {sec.hint && (
                <p className="text-sail-label-small mb-2 -mt-1 text-ink-faint">
                  {sec.hint}
                </p>
              )}
              {sec.rows.map((r) => (
                <SelectRow
                  key={r.id}
                  // No selected fill, matching the reference recipient list
                  // (SendDialog.tsx RecipientListItem), which carries hover only.
                  // Picking a row advances immediately, so a row still tinted on
                  // the way back reads as a filter or a disabled state rather than
                  // as "this is who you picked".
                  onClick={() => choose(r.id)}
                  leading={
                    <Avatar name={r.name} initials={r.initials} logo={r.logo} />
                  }
                  primary={r.name}
                  secondary={secondaryLine(r, searching)}
                  trailing={<CountryTag code={r.country} />}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Recent shows the last payout; search results show what you searched by. */
function secondaryLine(r, searching) {
  // Searching is where the entity type matters: a saved recipient shows its email,
  // a Stripe profile its @handle.
  if (searching) return identifierFor(r);
  if (r.isNew) return 'Added today';
  if (!r.lastAmount) return identifierFor(r);
  return `${formatMoney(r.lastAmount, r.currency)} on ${formatDate(r.lastPaidOn)}`;
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * No-match state — 429:221387.
 *
 * Centred on the canvas with no card and no button. The two ways forward are links
 * inside the sentence rather than buttons beneath it: at the moment a search fails,
 * "add them yourself" and "ask them for their details" ARE the content, and the
 * heading row's two buttons are 200px above and easy to miss while reading this.
 *
 * The headline doesn't name what was searched for. It used to track the active
 * chip ("No matching customers"), but the search spans Stripe profiles as well as
 * saved recipients, so naming either one was wrong for the other.
 */
function EmptyState({ onAddRecipient, onInvite }) {
  return (
    <div className="pt-20 text-center">
      <Icon name="search" size="large" className="mx-auto text-ink" />
      <p className="text-sail-label-large-emphasized mt-3 text-ink">
        No matches found
      </p>
      <p className="text-sail-label-large mt-1 text-ink-muted">
        {/* Underlined rather than blue: they sit mid-sentence, and two brand-coloured
            runs in one line would outweigh the sentence carrying them. */}
        <button
          type="button"
          onClick={onAddRecipient}
          className="cursor-pointer underline decoration-1 underline-offset-2 hover:text-ink"
        >
          Add recipient
        </button>{' '}
        details or{' '}
        <button
          type="button"
          onClick={onInvite}
          className="cursor-pointer underline decoration-1 underline-offset-2 hover:text-ink"
        >
          invite a recipient
        </button>{' '}
        to add their details.
      </p>
    </div>
  );
}

function toListShape(added) {
  return {
    ...added,
    initials: initialsFor(added.name),
    entity: 'recipient',
    currency: 'USD',
    lastAmount: null,
    stripeId: 'cus_new',
    email: added.email || '',
  };
}

function initialsFor(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
