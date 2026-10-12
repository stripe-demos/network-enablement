import { useMemo, useState } from 'react';

// ─── inline01: top customers by revenue ─────────────────────────────────────

// Mirror of the in-line chat table (RichConversation TABLE RESPONSE 1) — must
// stay in sync so the canvas-expanded view shows the same rows and data.
const INLINE01_ROWS = [
  { customer: 'Chloe Brown',    email: 'chloe.brown@example.com',    revenue: '$4,800.00' },
  { customer: 'Emma Davis',     email: 'emma.davis@example.com',     revenue: '$4,500.00' },
  { customer: 'Frank Wilson',   email: 'frank.wilson@example.com',   revenue: '$4,500.00' },
  { customer: 'Henry Martinez', email: 'henry.martinez@example.com', revenue: '$4,100.75' },
  { customer: 'Noah Walker',    email: 'noah.walker@example.com',    revenue: '$2,800.00' },
];

function InlineExpandedTable({ onCmdLSelect }) {
  return (
    <>
      <table className="canvas-table canvas-table--inline01" id="canvasTable">
        <thead>
          <tr>
            <th data-col="customer">Customer</th>
            <th data-col="email">Email</th>
            <th data-col="revenue">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {INLINE01_ROWS.map(({ customer, email, revenue }) => (
            <tr
              key={customer}
              onClick={(e) => {
                if (e.metaKey) {
                  e.stopPropagation();
                  onCmdLSelect?.({ type: 'element', tabId: 'inline01', artifactLabel: 'Revenue by customer', value: customer });
                }
              }}
            >
              <td><span className="col-link">{customer}</span></td>
              <td style={{ fontWeight: 400 }}>{email}</td>
              <td className="col-amount">{revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ height: 50, flexShrink: 0 }} />
    </>
  );
}

// ─── inline02: failed payment detail ────────────────────────────────────────

const INLINE02_ROWS = [
  { customer: 'Chloe Brown',    bin: '4242 42xx', amount: '$4,800.00', date: 'Dec 19, 10:15 PM', code: 'Generic decline' },
  { customer: 'Emma Davis',     bin: '5105 51xx', amount: '$4,500.00', date: 'Dec 18, 9:30 PM',  code: 'Generic decline' },
  { customer: 'Frank Wilson',   bin: '4012 88xx', amount: '$4,500.00', date: 'Dec 6, 9:45 AM',   code: 'Generic decline' },
  { customer: 'Henry Martinez', bin: '3714 49xx', amount: '$4,100.75', date: 'Dec 14, 5:30 PM',  code: 'Do not honor' },
  { customer: 'Noah Walker',    bin: '6011 11xx', amount: '$2,800.00', date: 'Dec 4, 5:30 PM',   code: 'Generic decline' },
  { customer: 'Olivia Hall',    bin: '4539 57xx', amount: '$2,300.00', date: 'Dec 20, 6:15 PM',  code: 'Payment declined' },
  { customer: 'Alice Johnson',  bin: '5425 23xx', amount: '$1,980.50', date: 'Dec 22, 11:00 AM', code: 'Insufficient funds' },
  { customer: 'Bob Smith',      bin: '4716 77xx', amount: '$1,740.00', date: 'Dec 7, 3:20 PM',   code: 'Generic decline' },
];

function InlineDetailTable({ onCmdLSelect }) {
  return (
    <>
      <table className="canvas-table canvas-table--inline02" id="canvasTable">
        <thead>
          <tr>
            <th data-col="customer">Customer</th>
            <th data-col="bin">Card BIN</th>
            <th data-col="amount">Amount</th>
            <th data-col="date">Date</th>
            <th data-col="code">Decline code</th>
          </tr>
        </thead>
        <tbody>
          {INLINE02_ROWS.map(({ customer, bin, amount, date, code }) => (
            <tr key={customer} onClick={(e) => { if (e.metaKey) { e.stopPropagation(); onCmdLSelect?.({ type: 'element', tabId: 'inline02', artifactLabel: 'Decline breakdown', value: customer }); } }}>
              <td><span className="col-link">{customer}</span></td>
              <td style={{ color: 'var(--color-text-tertiary)', fontFamily: "'SF Mono', Menlo, monospace", fontSize: 12 }}>{bin}</td>
              <td className="col-amount">{amount}</td>
              <td style={{ color: 'var(--color-text-tertiary)' }}>{date}</td>
              <td>{code}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ height: 50, flexShrink: 0 }} />
    </>
  );
}

// Failed-payments data table — direct port from prototypes/main/index.html.
// Includes:
//   - Per-row overflow menu (... in last column, visible on row hover)
//   - Sortable column headers (click to cycle asc → desc)

const ROWS = [
  ['Chloe Brown', '$4,800.00', 'Failed', 'Dec 19, 10:15 PM', 'Generic decline'],
  ['Emma Davis', '$4,500.00', 'Failed', 'Dec 18, 9:30 PM', 'Generic decline'],
  ['Frank Wilson', '$4,500.00', 'Failed', 'Dec 6, 9:45 AM', 'Generic decline'],
  ['Henry Martinez', '$4,100.75', 'Failed', 'Dec 14, 5:30 PM', 'Do not honor'],
  ['Noah Walker', '$2,800.00', 'Failed', 'Dec 4, 5:30 PM', 'Generic decline'],
  ['Olivia Hall', '$2,300.00', 'Failed', 'Dec 20, 6:15 PM', 'Payment declined'],
  ['Alice Johnson', '$5,600.00', 'Succeeded', 'Dec 12, 3:50 PM', 'Generic decline'],
  ['Bob Smith', '$5,000.00', 'Succeeded', 'Dec 2, 1:15 PM', 'Generic decline'],
  ['David Lee', '$4,800.00', 'Succeeded', 'Dec 23, 2:25 PM', 'Generic decline'],
  ['Grace Taylor', '$4,200.50', 'Succeeded', 'Dec 23, 2:25 PM', 'Generic decline'],
  ['Isabella Harris', '$3,750.00', 'Succeeded', 'Dec 9, 12:00 PM', 'Payment provider declined'],
  ['Jack Williams', '$3,600.75', 'Succeeded', 'Dec 30, 1:25 PM', 'Do not honor'],
  ['Katherine Clark', '$3,200.50', 'Succeeded', 'Dec 11, 2:15 PM', 'Generic decline'],
  ['Liam Thompson', '$3,100.75', 'Succeeded', 'Dec 12, 3:50 PM', 'Generic decline'],
  ['Mia Robinson', '$2,900.00', 'Succeeded', 'Dec 13, 2:40 PM', 'Generic decline'],
  ['Paul Young', '$2,200.50', 'Succeeded', 'Dec 6, 7:05 PM', 'Generic decline'],
  ['Quinn Lee', '$2,000.00', 'Succeeded', 'Dec 17, 8:50 PM', 'Payment provider declined'],
  ['Rachel King', '$1,800.25', 'Succeeded', 'Dec 28, 9:30 PM', 'Do not honor'],
  ['Sam Scott', '$1,500.50', 'Succeeded', 'Dec 9, 10:15 PM', 'Generic decline'],
  ['Tina Adams', '$987.00', 'Succeeded', 'Dec 2, 11:00 PM', 'Generic decline'],
  ['Uma Allen', '$755.12', 'Succeeded', 'Dec 15, 12:45 PM', 'Generic decline'],
  ['Victor Nelson', '$644.00', 'Succeeded', 'Dec 4, 1:35 PM', 'Payment provider declined'],
  ['Xavier Jones', '$644.00', 'Succeeded', 'Dec 4, 1:35 PM', 'Payment provider declined'],
];

const COLUMNS = [
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
  { key: 'reason', label: 'Decline reason' },
];

function parseAmount(text) {
  return parseFloat(String(text).replace(/[$,]/g, ''));
}
function parseDate(text) {
  return new Date('2025 ' + text).getTime();
}
function getSortVal(row, key) {
  switch (key) {
    case 'customer': return row[0].toLowerCase();
    case 'amount': return parseAmount(row[1]);
    case 'status': return row[2].toLowerCase();
    case 'date': return parseDate(row[3]);
    case 'reason': return row[4].toLowerCase();
    default: return 0;
  }
}

const RowMenuIcon = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <circle cx="3" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="13" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

export function Table({ tabId, onCmdLSelect }) {
  if (tabId === 'inline01') return <InlineExpandedTable onCmdLSelect={onCmdLSelect} />;
  if (tabId === 'inline02') return <InlineDetailTable onCmdLSelect={onCmdLSelect} />;

  return <PaymentsTable onCmdLSelect={onCmdLSelect} />;
}

function PaymentsTable({ onCmdLSelect }) {
  const [sort, setSort] = useState({ key: 'status', dir: 'asc' });

  const sortedRows = useMemo(() => {
    const rows = ROWS.map((row, idx) => ({ row, idx }));
    rows.sort((a, b) => {
      const av = getSortVal(a.row, sort.key);
      const bv = getSortVal(b.row, sort.key);
      const cmp =
        typeof av === 'number' ? av - bv : av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === 'desc' ? -cmp : cmp;
    });
    return rows;
  }, [sort]);

  function onHeaderClick(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  }

  return (
    <>
      <table className="canvas-table" id="canvasTable">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const isSorted = sort.key === col.key;
              return (
                <th
                  key={col.key}
                  data-col={col.key}
                  className={isSorted ? 'sorted' : ''}
                  data-dir={isSorted ? sort.dir : undefined}
                  onClick={() => onHeaderClick(col.key)}
                >
                  {col.label}
                  <span className="sort-arrow">{isSorted ? (sort.dir === 'asc' ? ' ↓' : ' ↑') : ''}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map(({ row: [customer, amount, status, date, reason], idx }) => (
              <tr
                key={idx}
                onClick={(e) => {
                  if (e.metaKey) {
                    e.stopPropagation();
                    onCmdLSelect?.({ type: 'element', tabId: 'table', artifactLabel: 'Failed payments', value: customer });
                  }
                }}
              >
                <td>
                  <span className="col-link">{customer}</span>
                </td>
                <td className="col-amount">{amount}</td>
                <td>
                  <span className={`status-badge ${status === 'Failed' ? 'failed' : 'succeeded'}`}>{status}</span>
                </td>
                <td>{date}</td>
                <td>
                  {reason}
                  <div
                    className="row-menu"
                    onClick={(e) => e.stopPropagation()}
                    title="More"
                  >
                    <RowMenuIcon />
                  </div>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
      <div style={{ height: 50, flexShrink: 0 }} />
    </>
  );
}
