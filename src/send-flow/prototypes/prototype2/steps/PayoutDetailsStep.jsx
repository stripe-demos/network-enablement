import React, { useEffect, useMemo, useRef, useState } from 'react';
import SelectChevron from '../ui/SelectChevron';
import { Icon } from '../../../icons/SailIcons';
import { useFlow } from '../flow/FlowProvider';
import { ACCOUNTS, ACCOUNT_GROUPS, account } from '../data/accounts';
import { methodLine } from '../data/payoutMethods';
import {
  currencySymbol,
  exchangeRateLine,
  formatMoney,
  methodFor,
  quoteFor,
  receiveCurrencyFor,
} from '../flow/selectors';
import SplitField from '../ui/SplitField';
import SignedAmountInput from '../ui/SignedAmountInput';
import MethodMark from '../ui/MethodMark';
import CurrencySelect from '../ui/CurrencySelect';
import GroupedDropdown from '../ui/GroupedDropdown';
import Reveal from '../ui/Reveal';
import Checkbox from '../ui/Checkbox';
import FeeLadder from '../ui/FeeLadder';
import { ladderGroups as ladderGroups_ } from '../ui/ladderGroups';
import { feeRows } from '../flow/quote';
import {
  CONDITIONAL_FIELDS,
  deliveryMethod,
  preferredRailFor,
  railsForMethod,
} from '../data/deliveryMethods';
import DeliverySelect from '../ui/DeliverySelect';
import Callout from '../ui/Callout';
import Button from '../../../components/Button';
import { kycPendingFor, missingRailFields } from '../data/kyc';
import { USD_RATES } from '../data/fx';
import TextInput from '../ui/TextInput';
import DatePicker from '../ui/DatePicker';

/**
 * Payout details — 2026-08-24 revision.
 *
 * Two paired split controls instead of stacked fields: "Pay from" carries the
 * money leaving (−) and "Send to" the money arriving (+). They're two-way bound
 * through the FX rate, so editing either side recomputes the other; when source
 * and recipient share a currency the two simply track each other.
 */
export default function PayoutDetailsStep() {
  const { state, patchDraft, enterSubflow, setUi } = useFlow();
  const { amount, timing } = state.draft;

  const { q, recipient } = useMemo(() => quoteFor(state), [state]);
  const chosenAccount = account(state.draft.sourceAccountId);
  const method = methodFor(state);
  // The payout method decides the arrival currency, not the recipient.
  const receiveCurrency = receiveCurrencyFor(state);
  const sourceCurrency = chosenAccount?.currency ?? 'USD';

  const rail = deliveryMethod(state.draft.deliveryMethodId);

  /**
   * The rails this destination can be paid over IN THE CHOSEN CURRENCY.
   *
   * Not the destination's own currency: asking for a UK account to be paid in USD takes
   * it off its local rails entirely, and only SWIFT crosses into a currency the
   * recipient's country doesn't use. So the currency control beside "They will receive"
   * decides what this menu may offer.
   */
  const rails = useMemo(
    () => railsForMethod(method, recipient?.country ?? 'US', receiveCurrency),
    [method, recipient, receiveCurrency],
  );

  /**
   * A currency change can take the selected rail off the list — RTP can't pay a GBP
   * account. Rather than leaving a rail selected that no longer exists, switch to the
   * best of what's left and SAY SO: the fee, the arrival date and any details the new
   * rail needs all just changed, and none of that was the sender's decision.
   *
   * The displaced rail is remembered, which makes the change reversible: put the
   * currency back and the payout returns to the rail it was on, rather than staying on
   * a $25 wire the sender never chose. Picking a rail by hand forgets it — from then on
   * the choice is theirs, and second-guessing it would be worse than the stale wire.
   */
  const railSwitch = state.ui.railSwitch;
  useEffect(() => {
    if (!rails.length) return;
    const railId = state.draft.deliveryMethodId;

    // The reason for a forced change has gone: the old rail is back on offer, and the
    // sender hasn't chosen anything since. Undo it, quietly.
    if (
      railSwitch &&
      railId === railSwitch.toId &&
      rails.some((r) => r.id === railSwitch.fromId)
    ) {
      patchDraft('deliveryMethodId', railSwitch.fromId);
      setUi('railSwitch', null);
      return;
    }

    if (railId && rails.some((r) => r.id === railId)) return;

    const next = preferredRailFor(method, rails);
    if (!next || next.id === railId) return;
    const previous = deliveryMethod(railId);
    patchDraft('deliveryMethodId', next.id);
    // Only worth a notice if a rail was actually displaced. Arriving with nothing
    // selected is the normal opening state, not a change.
    if (previous) {
      setUi('railSwitch', {
        fromId: previous.id,
        from: previous.label,
        toId: next.id,
        to: next.label,
        currency: receiveCurrency,
      });
    }
  }, [
    rails,
    railSwitch,
    state.draft.deliveryMethodId,
    method,
    receiveCurrency,
    patchDraft,
    setUi,
  ]);

  /**
   * Tied to the currency that caused it — change to a third currency and the explanation
   * would be about a decision two steps back — and dropped once the sender has been through
   * the details the new rail asked for, since by then they've answered it.
   */
  const switchedRail =
    railSwitch?.currency === receiveCurrency && !railSwitch.acknowledged;

  /**
   * A beat on the Delivery control after a currency change, while the rails are "worked
   * out".
   *
   * Nothing is actually being fetched — availability is derived synchronously — but a real
   * implementation asks the platform which rails a corridor supports, and the answer can
   * arrive with the rail changed and a new requirement attached. Without the pause those
   * two things appear in the same frame as the keystroke, which reads as a glitch rather
   * than as a consequence.
   *
   * Keyed on the currency rather than on a click: whichever control changed it, the
   * question being answered is the same.
   */
  const RESOLVE_MS = 450;
  const [resolvingRails, setResolvingRails] = useState(false);
  const knownCurrency = useRef(receiveCurrency);
  useEffect(() => {
    if (knownCurrency.current === receiveCurrency) return;
    knownCurrency.current = receiveCurrency;
    setResolvingRails(true);
    const t = setTimeout(() => setResolvingRails(false), RESOLVE_MS);
    return () => clearTimeout(t);
  }, [receiveCurrency]);

  /**
   * The same beat on the fee ladder, keyed on the PAIR: the quote depends on both sides —
   * the rail's fee, the cross-border rate and the FX spread — so paying from a different
   * account re-prices the payout even when the recipient's currency hasn't moved. The rails
   * above don't care about the funding side, which is why these are two flags rather than
   * one.
   */
  const [resolvingQuote, setResolvingQuote] = useState(false);
  const knownPair = useRef(`${sourceCurrency}>${receiveCurrency}`);
  useEffect(() => {
    const pair = `${sourceCurrency}>${receiveCurrency}`;
    if (knownPair.current === pair) return;
    knownPair.current = pair;
    setResolvingQuote(true);
    const t = setTimeout(() => setResolvingQuote(false), RESOLVE_MS);
    return () => clearTimeout(t);
  }, [sourceCurrency, receiveCurrency]);

  /**
   * Is the payout waiting on details the sub-flow collects — the recipient's address for
   * RTP, a SWIFT code for SWIFT, a routing number for a wire?
   *
   * Asked here rather than on Destination because the rail is chosen here, and answered
   * in the sub-flow rather than inline: a SWIFT code is a fact about the recipient's
   * account, not something to improvise beside the amount. Same predicate as the graph's
   * gate, so the banner and the footer can't disagree.
   */
  const missingFields = missingRailFields(
    state.draft.deliveryMethodId,
    state.draft,
  );
  const missingAddress = kycPendingFor(recipient, state.draft.deliveryMethodId);
  const detailsOutstanding = missingFields.length > 0 || missingAddress;

  /**
   * What's missing, named. "Add SWIFT code" tells the sender what they're about to be asked
   * for; "Additional details required" made them open the form to find out — and the form is
   * where the explanation used to live, one screen too late.
   */
  const missingLabels = [
    ...missingFields
      .map((key) => CONDITIONAL_FIELDS[key]?.label)
      .filter(Boolean),
    missingAddress ? 'recipient address' : null,
  ].filter(Boolean);

  /**
   * Preselect the funding account by matching the recipient's currency, so
   * paying a USD recipient defaults to a USD account and no conversion happens
   * unless the user asks for one. Falls back to USD when the recipient's
   * currency isn't held.
   */
  useEffect(() => {
    if (state.draft.sourceAccountId) return;
    const match =
      ACCOUNTS.find((a) => a.currency === receiveCurrency) ??
      ACCOUNTS.find((a) => a.currency === 'USD');
    if (match) patchDraft('sourceAccountId', match.id);
  }, [state.draft.sourceAccountId, receiveCurrency, patchDraft]);

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

  /**
   * Currencies the sender can pay in: the ones they actually hold. Picking one
   * switches the funding account rather than setting a currency beside it — a
   * "send currency" that disagreed with the account it leaves would be fiction.
   */
  const sendCurrencies = useMemo(
    () => [...new Set(ACCOUNTS.map((a) => a.currency))],
    [],
  );

  const onSendCurrency = (code) => {
    const match = ACCOUNTS.find((a) => a.currency === code);
    if (match) patchDraft('sourceAccountId', match.id);
  };

  /**
   * Currencies the recipient can be paid in. Every rate in the table, plus the
   * destination's own so it's always listed, minus the stablecoin — USDC needs a
   * wallet, and offering it against a bank account promises something the rails
   * don't do.
   */
  const receiveCurrencies = useMemo(() => {
    const codes = Object.keys(USD_RATES).filter((c) => c !== 'USDC');
    const own = method?.currency;
    return own && !codes.includes(own) ? [own, ...codes] : codes;
  }, [method]);

  /**
   * Which side the sender typed into. That field echoes their own keystrokes; the
   * other shows what the quote made of them, so only one of the two is ever a
   * source of truth.
   */
  const anchoredPay = amount.edited === 'send';

  /** Left field: the total debited, fees included. */
  const sendValue = anchoredPay
    ? (amount.sendRaw ?? '')
    : amount.value
      ? q.totalPay.toFixed(2)
      : '';

  /** Right field: what the recipient ends up with. */
  const receiveValue = anchoredPay
    ? q.receiveAmount > 0
      ? q.receiveAmount.toFixed(2)
      : ''
    : amount.value;

  /**
   * Has the user committed to a number yet, on either side?
   *
   * Drives the dimming on Will receive. Dimming used to track
   * `edited === 'send'`, which meant a figure the user had just produced by
   * typing still rendered grey — it read as disabled rather than as derived.
   * Now the grey only says "nothing entered yet"; once there's an amount, both
   * sides are real money and both are inked.
   */
  const hasAmount = Number(anchoredPay ? amount.sendRaw : amount.value) > 0;

  /**
   * Editing the debit anchors it, and the quote works backwards from there — it no
   * longer writes a derived receive amount into the draft. Storing both sides meant
   * whichever was written last could contradict the fee direction, and the copy in
   * state didn't know the fees had been deducted.
   */
  const onSendChange = (raw) => {
    patchDraft('amount.edited', 'send');
    patchDraft('amount.sendRaw', raw);
  };

  /**
   * Fee ladder groups — the arithmetic between the two fields, in the direction the
   * sender chose.
   *
   * Anchoring the recipient's amount reads upward to the debit: fees are ADDED, and
   * the ladder ends in "Total you pay". Anchoring the debit reads downward: fees are
   * SUBTRACTED from it, and the ladder ends in what's left to land. The operators
   * carry that difference — a "+" against a fee the sender isn't paying on top would
   * be a lie about their total.
   *
   * Built from the same `quoteFor` selector as Review, so the two screens can't
   * disagree about the total.
   */
  /**
   * The arithmetic between the two fields, built by the shared helper so Review shows the
   * same breakdown with the same collapsible Fees row — see ui/ladderGroups.
   */
  const ladderGroups = useMemo(() => {
    if (!hasAmount || q.totalPay <= 0) return [];
    return ladderGroups_({
      q,
      rows: feeRows(q),
      format: (n) => formatMoney(n, sourceCurrency),
    });
  }, [q, hasAmount, sourceCurrency, receiveCurrency]);

  /**
   * Clearing the amount empties `ladderGroups`, which would unmount the rows
   * instantly and leave the Reveal collapsing an empty box — the exit would snap
   * rather than fade. So the last non-empty set is held and rendered while the
   * Reveal closes over it.
   */
  const lastLadderGroups = useRef([]);
  if (ladderGroups.length) lastLadderGroups.current = ladderGroups;
  const shownLadderGroups = ladderGroups.length
    ? ladderGroups
    : lastLadderGroups.current;

  /**
   * The "You pay" field, so the account menu can hang off the whole thing rather than off the
   * left cell it lives in — see GroupedDropdown's `panelAnchorRef`.
   */
  const payFieldRef = useRef(null);

  /** The receive amount's box, so its currency menu lines up with the field. */
  const receiveBoxRef = useRef(null);

  /** Right field: what the recipient receives. */
  const onReceiveChange = (raw) => {
    patchDraft('amount.edited', 'receive');
    patchDraft('amount.value', raw);
  };

  return (
    <div className="space-y-5">
      {/* 429:223831 groups Pay from + the ladder + Will receive in a column with
          NO gap between them: the ladder's own lead-in and lead-out ARE the
          spacing, which is why the frame shows a full run of dots at each end.
          Grouped the same way here so the rail spans the whole gap rather than
          starting part-way down it.

          `space-y-5` is the fallback: with no fees yet the ladder collapses to
          nothing, and without it the two fields sit flush against each other. The
          ladder cancels it with a negative margin so the spacing doesn't double
          once the fees appear. */}
      <div className="space-y-5">
        <Field label="You pay">
          {/* Three targets, one per decision, each owning its own area (frame
              2147246209): the account selector is the whole left cell, the number
              input is the rest of the amount cell, and the currency control is the
              code. The picker used to wrap the entire field, so a click on blank
              space beside the number opened the account list instead of putting a
              caret where the sender aimed. */}
          <SplitField
            ref={payFieldRef}
            // The account control owns the cell's padding, so its hit area, focus ring and
            // open-state fill all reach the cell's edges.
            leftPadded={false}
            left={
              <GroupedDropdown
                className="flex h-full min-w-0 flex-1"
                value={chosenAccount ? { id: chosenAccount.id } : null}
                groups={accountGroups}
                panelAnchorRef={payFieldRef}
                onSelect={(item) => patchDraft('sourceAccountId', item.id)}
                renderTrigger={(_, open) => (
                  // The padding lives here rather than on the cell, so the row's hit area and
                  // its outline cover the whole cell. 8px on the right: the chevron sits near
                  // the divider, where 12px left it adrift in the middle of the gap.
                  //
                  // Open takes the same purple outline the amount box takes when it has the
                  // caret — one "you're working in this half" signal for both halves of the
                  // field. A grey fill said something different about the same state, and in a
                  // field that is now white boxes on a grey surround it read as disabled.
                  //
                  // Drawn as an inset outline, not a ring: the cell clips its children, so a
                  // shadow spread outside this span's box is cut off at exactly the edge it
                  // was meant to trace.
                  <span
                    className={`flex h-full w-full items-center gap-1.5 rounded-control py-2 pl-3 pr-2 ${
                      open
                        ? 'outline outline-[1.5px] -outline-offset-[1.5px] outline-action'
                        : ''
                    }`}
                  >
                    {/* Same 28px mark as They will receive below, so the two rows
                        line up. The old /logos/fa/*.png baked a panel tile AND an
                        oversized flag into one raster, which is why the two marks
                        didn't match at any size.

                        The flag badge is absolutely positioned, so it contributes
                        nothing to the mark's box and would otherwise crowd whatever
                        sits around it: `pb-2` and `pr-2` reserve the 8px it hangs by
                        on each side. No fixed slot width — a slot wider than the mark
                        pushed it off the 12px inset every other field in the flow
                        uses. */}
                    <span className="flex shrink-0 items-center pb-2 pr-2">
                      <MethodMark
                        country={chosenAccount?.country}
                        group="account"
                      />
                    </span>
                    {/* Name over the currency it holds, with the balance on the right.
                        The balance used to be the sublabel, which put the account's two
                        identifying facts — what it's called, what currency it pays in — on
                        one line and a number in the slot where the recipient row below
                        states its destination. Now the two rows read the same way down the
                        left, and the figure sits where figures belong: the amount column. */}
                    <span className="min-w-0 flex-1">
                      <span className="text-sail-label-medium-emphasized block truncate text-ink">
                        {chosenAccount?.name ?? 'Account'}
                      </span>
                      <span className="text-sail-label-small block truncate text-ink-muted">
                        {chosenAccount?.currency ?? 'Select an account'}
                      </span>
                    </span>
                    {/* The small label, not the medium one: the balance is the third thing
                        in a 250px cell, and at the name's size it took the room the name
                        needs to say which account this is. */}
                    {chosenAccount && (
                      <span className="text-sail-label-small shrink-0 tabular-nums text-ink">
                        {formatMoney(
                          chosenAccount.balance,
                          chosenAccount.currency,
                        )}
                      </span>
                    )}
                    <SelectChevron className="text-ink-muted" />
                  </span>
                )}
              />
            }
            right={
              <SignedAmountInput
                sign="−"
                symbol={currencySymbol(sourceCurrency)}
                value={sendValue}
                onChange={onSendChange}
                ariaLabel="Amount to send"
                autoFocus
                /**
                 * No currency control on this side. Picking a currency here only ever switched
                 * the funding account — a send currency that disagreed with the account it
                 * leaves would be fiction — so the account picker beside it was already the
                 * real control, and two ways to make one choice invited the sender to try the
                 * one that explains itself least.
                 */
              />
            }
          />
        </Field>

        {/* Fee ladder — 429:223599 (domestic) and 429:223890 (cross-border). Sits
          between the two amount fields, unlabelled, as in both frames.

          Wrapped in a Reveal so it doesn't snap into existence the moment an
          amount is typed: the ladder fades in while its expanding height slides
          "Will receive" down. The ladder carries its own vertical padding (the
          rail runs through it), so the Reveal adds none. */}
        <Reveal show={ladderGroups.length > 0} bleed={20}>
          <FeeLadder groups={shownLadderGroups} loading={resolvingQuote} />
        </Reveal>

        <Field label="Recipient receives">
          <SplitField
            rightRef={receiveBoxRef}
            left={
              /**
               * The destination, stated — not a control.
               *
               * It used to drill back to the Destination step, because changing the
               * destination changes which rails it runs on and that pair of decisions
               * lives together one screen back. But a cell that highlights on hover and
               * acts on click, sitting in the half of a field whose other half is an
               * amount input, read as a picker that would swap the recipient in place. The
               * way back is the Back button, which is where a sender looks for it.
               */
              <span className="flex min-w-0 flex-1 items-center gap-2 self-stretch text-left">
                {/* Mirrors You pay above: a 28px mark at the same 12px inset, with
                    `pb-2`/`pr-2` reserving the flag badge's overhang on each side. */}
                <span className="flex shrink-0 items-center pb-2 pr-2">
                  <MethodMark
                    logo={method?.logo ?? recipient?.logo}
                    country={method?.country ?? recipient?.country}
                    group={method?.group}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-sail-label-medium-emphasized block truncate text-ink">
                    {recipient?.name ?? 'Recipient'}
                  </span>
                  <span className="text-sail-label-small block truncate text-ink-faint">
                    {/* methodLine handles the profile case itself, so Review and this row
                        can't disagree about how an account reads. */}
                    {/* "····" alone while no destination is selected. */}
                    {methodLine(method) ?? '····'}
                  </span>
                </span>
              </span>
            }
            right={
              <SignedAmountInput
                sign="+"
                symbol={currencySymbol(receiveCurrency)}
                value={receiveValue}
                onChange={onReceiveChange}
                ariaLabel="Amount the recipient receives"
                derived={!hasAmount}
                leading={
                  <CurrencySelect
                    value={receiveCurrency}
                    options={receiveCurrencies}
                    onSelect={(code) => patchDraft('receiveCurrency', code)}
                    ariaLabel="Currency the recipient is paid in"
                    menuLabel="Recipient receives in"
                    panelAnchorRef={receiveBoxRef}
                  />
                }
              />
            }
          />
        </Field>
      </div>

      {/* Delivery — moved here from the Destination step: how fast the money moves and
          what that costs belong beside the amount, between what lands and when it
          lands. The control and the requirement it can raise are one block, so the
          stack's 20px falls below the pair and the gap inside is the Reveal's 12px. */}
      <div>
        <DeliverySelect
          method={method}
          rails={rails}
          railId={state.draft.deliveryMethodId}
          quote={q}
          loading={resolvingRails}
          onSelect={(id) => {
            patchDraft('deliveryMethodId', id);
            // Their choice now, so the explanation of ours is spent.
            setUi('railSwitch', null);
          }}
        />

        {/* One message for both things that can happen when the rail moves: the flow
            changed it, and the new rail may want details nobody has asked for yet. They
            arrive together often enough — change the currency and a local rail becomes a
            SWIFT wire that needs a SWIFT code — that two stacked panels said one thing
            twice and left the sender guessing which button was for which.

            It carries an action only when something is actually needed; a change with
            nothing outstanding is just news. */}
        {/* Held back until the control has settled: the explanation of a change belongs
            with the change, not half a second ahead of it. */}
        <Reveal
          show={!resolvingRails && (switchedRail || detailsOutstanding)}
          gap="pt-3"
        >
          <Callout
            // The change takes the title whenever there was one: it's the thing that happened
            // without the sender asking, and what it now needs is the consequence. With no
            // change, the ask is the whole message and becomes the title.
            title={
              switchedRail
                ? 'Delivery method changed'
                : `Add ${joinList(missingLabels)}`
            }
            action={
              detailsOutstanding ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    // Destination details first when the rail is missing an identifier;
                    // straight to the personal form when only the address is outstanding.
                    // Entering on the step that has something to ask means the sender never
                    // sees a form with nothing on it.
                    enterSubflow(
                      'kyc',
                      missingRailFields(
                        state.draft.deliveryMethodId,
                        state.draft,
                      ).length
                        ? 'kyc.destination'
                        : 'kyc.details',
                      {
                        attachTo: recipient?.id ?? null,
                        country: recipient?.country ?? 'US',
                        email: recipient?.email ?? '',
                        firstName: recipient?.name?.split(' ')[0] ?? '',
                        lastName:
                          recipient?.name?.split(' ').slice(1).join(' ') ?? '',
                        method: method?.group ?? 'bank',
                        // What the form uses to decide which fields to ask for, and to name
                        // the rail that's asking.
                        railId: state.draft.deliveryMethodId,
                        // The account as it stands, so the form opens on what's on file and
                        // only the missing field is blank. The rail's identifiers come from
                        // the draft first: if they were supplied for THIS payout they belong
                        // to it, not to the stored account.
                        routing: method?.routing ?? '',
                        account: method?.account ?? '',
                        swift: state.draft.swiftCode || method?.swift || '',
                        wire: state.draft.wireNumber || method?.wire || '',
                      },
                    )
                  }
                >
                  Add
                </Button>
              ) : null
            }
          >
            {/* One sentence for the change, naming both rails and the currency that forced
                it, with the new rail's requirement as a closing clause rather than a second
                sentence — the two are one consequence, not two pieces of news. */}
            {switchedRail &&
              `${railSwitch.from} doesn\u2019t support ${railSwitch.currency}. Delivery changed to ${railSwitch.to} to continue${
                detailsOutstanding ? ', extra details required.' : '.'
              }`}
            {!switchedRail &&
              detailsOutstanding &&
              'Required to continue with this payout.'}
          </Callout>
        </Reveal>
      </div>

      {/* "Schedule for later" rather than a "Payout date" field reading "Now": the default
          is to send immediately, and a field showing the default invited a change nobody
          needed to make. Ticking it is the decision; the date is what the decision needs. */}
      <div>
        <Checkbox
          checked={timing.when === 'later'}
          onChange={(v) =>
            // Unticking clears the date as well as the intent — leaving one behind would let
            // a "now" payout carry a date, which Review would then have to explain.
            Object.entries(
              v ? { when: 'later' } : { when: 'now', date: null },
            ).forEach(([k, value]) => patchDraft(`timing.${k}`, value))
          }
          label="Schedule for later"
        />

        <Reveal show={timing.when === 'later'} gap="pt-3">
          {/* Indented to the checkbox's label, the same 22px (16px box + 6px gap) the
              reference and description fields use: the field belongs to the line above it,
              and starting it under the box made it look like a separate control. */}
          <div className="ml-[22px] w-[calc(100%-22px)]">
            <TimingControl
              value={timing}
              onChange={(patch) =>
                Object.entries(patch).forEach(([k, v]) =>
                  patchDraft(`timing.${k}`, v),
                )
              }
            />
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/**
 * "Now", or a scheduled date.
 *
 * Clicking the field opens the calendar straight away — the Now / "Schedule for
 * later" menu that used to sit in front of it was an extrapolation (the frame
 * only draws the collapsed state) and cost a click for nothing.
 *
 * Clearing is how you get back to "Now": picking the already-selected date
 * unschedules it.
 */
function TimingControl({ value, onChange }) {
  const scheduled = value.when === 'later' && value.date;
  const label = scheduled
    ? new Date(`${value.date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Select date';

  return (
    <DatePicker
      value={value.date}
      ariaLabel="Payout date"
      onChange={(date) =>
        // The checkbox owns "now" vs "later", so picking a date only ever sets the date.
        // Re-picking the same one used to switch back to "Now", which read as the calendar
        // rejecting the click.
        onChange({ when: 'later', date: date ?? null })
      }
      renderTrigger={() => (
        <span className="flex h-10 w-full items-center justify-between rounded-control bg-canvas px-3 shadow-[0_0_0_1px_var(--color-border)]">
          <span
            className={`text-sail-label-medium ${scheduled ? 'text-ink' : 'text-ink-faint'}`}
          >
            {label}
          </span>
          <Icon
            name="calendar"
            size="small"
            className="shrink-0 text-ink-muted"
          />
        </span>
      )}
    />
  );
}

/** "SWIFT code", "SWIFT code and recipient address" — a title, not a CSV. */
function joinList(items) {
  if (items.length < 2) return items[0] ?? 'details';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function Field({ label, help, children }) {
  return (
    <div>
      <p className="text-sail-label-medium-emphasized mb-1.5 text-ink">
        {label}
      </p>
      {children}
      {/* Used by the rail's conditional fields, which explain why they're being asked
          for — a wire routing number isn't the one on a cheque. */}
      {help && (
        <p className="text-sail-label-small mt-1.5 text-ink-faint">{help}</p>
      )}
    </div>
  );
}
