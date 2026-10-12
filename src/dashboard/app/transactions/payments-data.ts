// ─── Anthropic — Payments tab row data (100 rows) ────────────────────────────
// Represents API usage charges, subscription payments, and enterprise invoices
// that Anthropic's customers pay via Stripe.
// Status pattern cycles every 10 with Failed at i%10===3 → exactly 10 Failed rows,
// matching the Console scenario (10 total failed, 6 recoverable).

const statuses     = ['Succeeded', 'Succeeded', 'Succeeded', 'Failed', 'Pending', 'Succeeded', 'Succeeded', 'Refunded', 'Succeeded', 'Succeeded'];
const invoiceIds   = ['in_0TLmG7589O8KAxCGLyeqR0Bv', 'in_0TLpD589O8KAxCGxilF1ORT', 'in_0TL9gN589O8KAxCGWjuTlJP0', 'in_0TL3Hl589O8KAxCGzMdMiuzY', 'in_0TKlfu589O8KAxCGyq1tUUjy', 'in_0TKj9Q589O8KAxCG2CH6d1gE', 'in_0TKgoo589O8KAxCGrNSvJOS0', 'in_0TKbRx589O8KAxCGmPqW8vNk', 'in_0TK7Ys589O8KAxCGdFhE3zBc', 'in_0TJvMn589O8KAxCGsQtR7pXw'];
const descriptions = ['API usage — Claude 3.5 Sonnet', 'Claude.ai Pro subscription', 'Claude.ai Team subscription', 'API usage — Claude 3 Opus', 'API credits purchase', 'Claude Enterprise annual license', 'API usage — Claude 3.5 Haiku', 'Subscription renewal — Pro', 'API usage — Claude 3 Sonnet', 'Prepaid API credits top-up'];
const names        = ['Dario Amodei', 'Sam Altman', 'Lior Belenki', 'Priya Nair', 'James Park', 'Yann LeCun', 'Rachel Kim', 'Marcus Chen', 'Aisha Patel', 'Tom Hudson', 'Mei Lin', 'Carlos Rivera', 'Sophie Turner', 'Alex Nguyen', 'Jordan Blake', 'Isabel Costa', 'Ravi Sharma', 'Chloe Bennett', 'Lucas Müller', 'Zara Ahmed', 'Ethan Brooks', 'Nina Patel', 'Leo Zhang', 'Maya Johnson', 'Owen Scott', 'Layla Hassan', 'Felix Wagner', 'Hana Suzuki', 'Diego Ortiz', 'Amara Diallo'];
const emails = ['dev@example.com', 'billing@example.com', 'api@example.com', 'finance@test.com', 'accounts@test.com', 'ops@example.com', 'team@test.com', 'admin@example.com', 'contact@test.com', 'hello@example.com', 'eng@test.com', 'api@example.com'];
const cards        = ['7865', '4321', '1234', '5678', '7421', '6420', '3197', '4902', '8745', '2568', '9012', '3456', '7890', '1357', '2468', '9753', '8642', '0011', '2244', '6677'];

// API usage billing varies widely; subscriptions are predictable
const rawAmounts   = [20.00, 25.00, 150.00, 480.00, 2400.00, 19200.00, 8.50, 72.00, 340.00, 1100.00, 5800.00, 500.00, 1000.00, 3500.00, 75.00, 200.00, 15000.00, 4200.00, 620.00, 96.00, 28.00, 850.00, 45.00, 2800.00, 360.00, 12000.00, 188.00, 9.00, 780.00, 250.00];
const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short' });
const fmt = (n: number) => `$${money.format(n)}`;

const rows: Record<string, unknown>[] = [];
let ms = new Date('2024-06-26T02:30:00').getTime();
for (let i = 0; i < 100; i++) {
  const status    = statuses[i % statuses.length];
  const amount    = rawAmounts[i % rawAmounts.length];
  const amountStr = fmt(amount);
  const customer  = i % 3 === 1 ? emails[i % emails.length] : names[i % names.length];
  const d         = new Date(ms);
  const mon       = monthShort.format(d);
  const day       = d.getDate();
  const h         = d.getHours();
  const min       = d.getMinutes().toString().padStart(2, '0');
  const h12       = h % 12 || 12;
  const period    = h >= 12 ? 'PM' : 'AM';
  rows.push({
    amount:      amountStr,
    'amount-raw': amount,
    currency:    'USD',
    status,
    method:            `•••• ${cards[i % cards.length]}`,
    'method-secondary': i % 5 === 2,
    description: descriptions[i % descriptions.length],
    customer,
    date:        `${mon} ${day}, ${h12}:${min} ${period}`,
    'date-ts':   ms,
    transferred: status === 'Succeeded' && i % 4 === 0 ? amountStr : '',
    invoice:     i % 3 === 0 ? invoiceIds[i % invoiceIds.length] : '',
  });
  ms -= (i % 3 === 0 ? 2 : i % 3 === 1 ? 3 : 1.5) * 60 * 60 * 1000;
}

export const PAYMENTS_DATA: Record<string, unknown>[] = rows;
