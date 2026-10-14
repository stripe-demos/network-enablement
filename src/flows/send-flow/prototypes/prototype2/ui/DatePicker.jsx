import React, { useMemo, useState } from 'react';
import { Icon } from '../../../icons/SailIcons';
import usePopover from './usePopover';
import PopoverPanel from './PopoverPanel';

/**
 * Calendar popover — 507:83739 (Sail's DatePicker).
 *
 * 312px panel at radius 16 with 8px padding: a DateField showing the value as
 * MM / DD / YYYY segments, then the month header and a 7-column grid of 32px
 * cells. Weeks start Monday, as the frame does.
 *
 * The segments are display-only here — Sail's DateField lets you type into each
 * one, which is a lot of machinery for a prototype where the calendar is the
 * point. Flagged rather than half-built.
 *
 * `renderTrigger(open)` keeps the trigger the caller's business: on Payout
 * details it's the full-width Timing field, not the frame's small button.
 */
export default function DatePicker({
  value,
  onChange,
  renderTrigger,
  ariaLabel = 'Choose a date',
}) {
  const { ref, panelRef, open, expanded, animation, toggle, close } =
    usePopover();

  const selected = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? new Date()),
  );

  const weeks = useMemo(() => buildMonth(viewMonth), [viewMonth]);
  const today = startOfDay(new Date());

  const pick = (date) => {
    onChange(toISO(date));
    close();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        aria-label={ariaLabel}
        className="block w-full cursor-pointer text-left"
      >
        {renderTrigger(open)}
      </button>

      {open && (
        <PopoverPanel
          anchorRef={ref}
          panelRef={panelRef}
          animation={animation}
          // The field's width, like every other menu in the flow. 312px was the frame's
          // panel against the frame's small button; under a full-width date field it read
          // as a floating card that belonged to something else on the screen.
          width="anchor"
          radius="rounded-[16px]"
          className="border border-hairline p-2"
        >
          {/* DateField: the value split into segments, per 507:83729 */}
          <div className="p-2">
            <div className="flex min-h-7 items-center rounded-control border border-hairline px-2 py-1">
              <Segment
                value={selected ? pad(selected.getMonth() + 1) : null}
                placeholder="MM"
              />
              <Slash />
              <Segment
                value={selected ? pad(selected.getDate()) : null}
                placeholder="DD"
              />
              <Slash />
              <Segment
                value={selected ? String(selected.getFullYear()) : null}
                placeholder="YYYY"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 p-2">
            {/* Month + nav */}
            <div className="flex items-center justify-between pl-2">
              <p className="text-sail-label-large text-ink">
                {viewMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <div className="flex items-center">
                <NavButton
                  label="Previous month"
                  icon="chevronLeft"
                  onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                />
                <NavButton
                  label="Next month"
                  icon="chevronRight"
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                  <span
                    key={d}
                    className="text-sail-label-small flex w-8 items-center justify-center text-ink"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {weeks.map((week, i) => (
                <div key={i} className="flex items-center justify-between">
                  {week.map((date, j) =>
                    date ? (
                      <Day
                        key={j}
                        date={date}
                        selected={selected && sameDay(date, selected)}
                        isToday={sameDay(date, today)}
                        onPick={pick}
                      />
                    ) : (
                      // Blank cell — keeps the grid square without a clickable target
                      <span key={j} className="h-8 w-8 shrink-0" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}

function Day({ date, selected, isToday, onPick }) {
  return (
    <button
      type="button"
      onClick={() => onPick(date)}
      aria-current={selected ? 'date' : undefined}
      className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${
        selected
          ? 'text-sail-label-medium bg-action text-white'
          : isToday
            ? // The frame marks today by weight alone, not a fill.
              'text-sail-label-medium-emphasized text-ink hover:bg-panel'
            : 'text-sail-label-medium text-ink hover:bg-panel'
      }`}
    >
      {date.getDate()}
    </button>
  );
}

function NavButton({ label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-[4px] text-ink-muted transition-colors hover:bg-panel"
    >
      <Icon name={icon} size="xsmall" className="shrink-0" />
    </button>
  );
}

function Segment({ value, placeholder }) {
  return (
    <span
      className={`text-sail-label-medium px-1 ${value ? 'text-ink' : 'text-ink-faint'}`}
    >
      {value ?? placeholder}
    </span>
  );
}

function Slash() {
  return <span className="text-sail-label-medium text-ink">/</span>;
}

/* ---- date helpers: local time throughout, so a date never shifts a day ---- */

const pad = (n) => String(n).padStart(2, '0');
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** `new Date('2026-09-15')` parses as UTC and can land a day early; this doesn't. */
function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Weeks of `month` as 7-slot rows, Monday first, padded with nulls. */
function buildMonth(month) {
  const first = startOfMonth(month);
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  // getDay() is Sunday-first; the frame starts on Monday.
  const lead = (first.getDay() + 6) % 7;

  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return Array.from({ length: cells.length / 7 }, (_, i) =>
    cells.slice(i * 7, i * 7 + 7),
  );
}
