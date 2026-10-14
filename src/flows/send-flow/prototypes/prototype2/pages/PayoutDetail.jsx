import React from 'react';
import { Icon } from '../../../icons/SailIcons';
import Badge from '../../../components/Badge';
import FlagIcon from '../ui/FlagIcon';
import DashboardSkeleton from './DashboardSkeleton';

/**
 * Payout detail — 502:63579 (domestic) and 502:63738 (cross-border).
 *
 * Reads a frozen payout record (flow/payoutRecord.js), never live draft state, so
 * it shows the payout as sent.
 *
 * Geometry from the frame: 944px content split 636 / 32 / 276. The two
 * cross-border rows in Summary are the only difference between the two frames,
 * so this is one component rather than two.
 */
export default function PayoutDetail({ record, onBack, onRestart }) {
  if (!record) {
    return (
      <DashboardSkeleton>
        <EmptyState onBack={onBack} />
        <RestartButton onRestart={onRestart} />
      </DashboardSkeleton>
    );
  }

  return (
    <DashboardSkeleton>
      <div className="w-full">
        <Breadcrumb onBack={onBack} />

        <div className="mt-4 flex items-start gap-12">
          {/* The left rail takes the slack; Details stays at its 276px. */}
          <div className="min-w-0 flex-1 space-y-6">
            <Header record={record} />
            <Timeline events={record.timeline} />
            <Summary summary={record.summary} />
          </div>

          <Details record={record} />
        </div>
      </div>

      <RestartButton onRestart={onRestart} />
    </DashboardSkeleton>
  );
}

/**
 * Moderator control, not part of the design.
 *
 * The detail page is the end of the road — there's no dashboard to navigate on
 * to — so a session needs a way back to the start without a page reload (which
 * would also wipe any ?step= jump). Pinned bottom-left so it never sits over the
 * content, and visually quiet so it doesn't read as part of the product.
 */
function RestartButton({ onRestart }) {
  if (!onRestart) return null;

  return (
    <button
      type="button"
      onClick={onRestart}
      className="text-sail-label-medium-emphasized fixed bottom-6 left-6 z-50 flex cursor-pointer items-center gap-2 rounded-control border border-hairline bg-canvas px-3 py-2 text-ink-muted shadow-card transition-colors hover:bg-panel"
    >
      <Icon name="refresh" size="xsmall" className="shrink-0" />
      Restart flow
    </button>
  );
}

function Breadcrumb({ onBack }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onBack}
        className="text-sail-label-medium cursor-pointer text-ink-faint hover:underline"
      >
        Payouts
      </button>
      <Icon name="chevronRight" size="xxsmall" className="text-ink-faint" />
      <span className="text-sail-label-medium text-ink">All payouts</span>
    </nav>
  );
}

function Header({ record }) {
  return (
    <div className="space-y-3">
      <Badge variant="success">{record.status}</Badge>

      <div className="space-y-1">
        <div className="flex items-end gap-1">
          {/* Display/Large subdued — the amount is regular weight, not bold */}
          <p className="text-sail-display-large-subdued text-ink">
            {record.amount}
          </p>
          <p className="text-sail-heading-medium-subdued pb-1.5 text-ink-faint">
            {record.currency}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="send" size="small" className="text-action" />
          <p className="text-sail-body-large text-ink">
            Payout to{' '}
            <span className="text-action-link">{record.recipientName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline — Sail's Timeline component. 10px markers on a connecting line, the
 * most recent event first and marked active.
 */
function Timeline({ events }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sail-heading-medium text-ink">Timeline</h2>
      <ol>
        {events.map((event, i) => (
          <li key={event.key} className="flex gap-4">
            <div className="relative w-2.5 shrink-0">
              {/* Line runs from the marker down, except on the last row. */}
              {i < events.length - 1 && (
                <span className="absolute bottom-0 left-1/2 top-[19px] w-px -translate-x-1/2 bg-hairline" />
              )}
              <span
                className={`absolute left-1/2 top-[14px] block h-2.5 w-2.5 -translate-x-1/2 rounded-full ${
                  i === 0 ? 'bg-action ring-2 ring-action-tint' : 'bg-action'
                }`}
              />
            </div>

            <div
              className={`flex flex-1 items-center gap-6 py-2 ${
                i < events.length - 1 ? 'border-b border-neutral-50' : ''
              }`}
            >
              <p className="text-sail-label-medium-emphasized flex-1 text-ink">
                {event.label}
              </p>
              <p className="text-sail-label-medium shrink-0 text-ink-muted">
                {event.at}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Summary — total paid, the fee breakdown at 12px, then what the recipient got.
 * Fee rows come from the same `feeRows` the send flow used, so the detail page
 * can't disagree with the review screen it followed.
 */
function Summary({ summary }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sail-heading-medium text-ink">Summary</h2>

      <div>
        <Row label="Total you paid" value={summary.totalPaid} />
        <Divider />

        <div className="space-y-1 p-2">
          {summary.fees.map((fee) => (
            <div
              key={fee.key}
              className="flex items-center justify-between gap-2"
            >
              <p className="text-sail-label-small text-ink">{fee.label}</p>
              <p className="text-sail-label-small text-ink">{fee.value}</p>
            </div>
          ))}

          {/* Cross-border only — 502:63738 */}
          {summary.converted && (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sail-label-small text-ink">
                  Amount converted
                </p>
                <p className="text-sail-label-small text-ink">
                  {summary.converted.amount}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sail-label-small text-ink">Exchange rate</p>
                <p className="text-sail-label-small text-ink">
                  {summary.converted.rate}
                </p>
              </div>
            </>
          )}
        </div>

        <Divider />
        <Row label="Recipient received" value={summary.received} emphasized />
      </div>
    </section>
  );
}

function Row({ label, value, emphasized = false }) {
  const type = emphasized
    ? 'text-sail-label-medium-emphasized'
    : 'text-sail-label-medium';
  return (
    <div className="flex items-center gap-2 p-2">
      <p className={`${type} min-w-0 flex-1 truncate text-ink`}>{label}</p>
      <p className={`${type} shrink-0 text-ink`}>{value}</p>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-hairline" />;
}

/** Right-hand property list, 276px. */
function Details({ record }) {
  return (
    <section className="w-[276px] shrink-0 space-y-4 py-2">
      <h2 className="text-sail-heading-medium pb-2 text-ink">Details</h2>

      <Group label="Recipient">
        <Line>{record.recipient.name}</Line>
        <Line
          trailing={
            <FlagIcon
              code={record.recipient.country}
              className="block h-3 w-4"
            />
          }
        >
          {record.recipient.countryName}
        </Line>
      </Group>

      <Group label="Destination">
        <Line
          trailing={
            record.method.logo ? (
              <img
                src={record.method.logo}
                alt=""
                className="h-4 w-4 rounded-[3px] object-contain"
              />
            ) : null
          }
        >
          &bull;&bull;&bull;&bull; {record.method.last4}
        </Line>
        <Line>{record.method.routing}</Line>
        <Line>{record.method.rail}</Line>
      </Group>

      <Group label="Paid from">
        <Line
          trailing={
            record.source.logo ? (
              <img
                src={record.source.logo}
                alt=""
                className="h-4 w-4 rounded-[3px] object-contain"
              />
            ) : null
          }
        >
          {record.source.name}
        </Line>
        <Line>{record.source.currency}</Line>
      </Group>

      <Divider />

      <div className="space-y-4 py-2">
        <Group label="Outbound Payment ID">
          <Line>{record.payoutId}</Line>
        </Group>
        <Group label="Created">
          <Line>{record.createdOn}</Line>
        </Group>
        <Group label="Expected arrival">
          <Line>{record.expectedArrival}</Line>
        </Group>
        <Group label="Description">
          <Line muted={!record.description}>
            {record.description ?? 'None'}
          </Line>
        </Group>
        <Group label="Statement descriptor">
          <Line muted={!record.statementDescriptor}>
            {record.statementDescriptor ?? 'None'}
          </Line>
        </Group>
      </div>
    </section>
  );
}

function Group({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-sail-label-medium-emphasized text-ink">{label}</p>
      {children}
    </div>
  );
}

function Line({ children, trailing = null, muted = false }) {
  return (
    <div className="flex items-center gap-2">
      <p
        className={`text-sail-label-medium ${muted ? 'text-ink-faint' : 'text-ink'}`}
      >
        {children}
      </p>
      {trailing}
    </div>
  );
}

/** Reached by deep link with no payout in state. */
function EmptyState({ onBack }) {
  return (
    <div className="w-full py-20 text-center">
      <p className="text-sail-heading-medium text-ink">No payout to show</p>
      <p className="text-sail-label-medium mt-1 text-ink-muted">
        This page shows a payout made in this session.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="text-sail-label-medium-emphasized mt-4 cursor-pointer text-action-link hover:underline"
      >
        Back to the send flow
      </button>
    </div>
  );
}
