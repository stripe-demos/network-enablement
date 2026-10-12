import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react';

const RAW_CONTENT = {
  ext01: `-- Failed payments over $500 in December 2025
SELECT
    charges.id AS charge_id,
    charges.created AS charge_date,
    decimalize_amount_no_display(charges.currency, charges.amount, 2) AS amount,
    charges.failure_code,
    charges.failure_message,
    customers.id AS customer_id,
    customers.email
FROM
    charges
    JOIN customers ON charges.customer_id = customers.id
WHERE
    charges.failure_code IS NOT NULL
    AND charges.amount > 50000
ORDER BY
    charge_date DESC;`,

  'sql-active-merchants': `-- Daily active merchants since December 2025
SELECT
    date_trunc('day', created) AS day,
    COUNT(DISTINCT merchant_id) AS active_merchants
FROM
    merchants
WHERE
    created > '2025-12-01'
GROUP BY
    1
ORDER BY
    1;`,

  'sql-revenue-trend': `-- Daily succeeded charge revenue
SELECT
    date,
    SUM(amount) AS revenue
FROM
    charges
WHERE
    status = 'succeeded'
GROUP BY
    date
ORDER BY
    date;`,

  'sql-api-latency': `-- p99 API latency by request window
SELECT
    timestamp,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99
FROM
    api_requests
GROUP BY
    1
ORDER BY
    1;`,

  'sql-api-throughput': `-- Requests per minute from the load balancer log
SELECT
    date_trunc('minute', ts) AS minute,
    COUNT(*) AS rpm
FROM
    lb_access_log
GROUP BY
    1
ORDER BY
    1;`,

  'sql-queue-depth': `-- Terminal queue depth by hour
SELECT
    hour,
    queue_depth
FROM
    terminal_queue_stats
WHERE
    date = '2025-12-18'
ORDER BY
    hour;`,

  'sql-card-details': `-- Large failed charges with card BIN detail
SELECT
    c.customer_name,
    pm.card_bin,
    c.amount,
    c.created,
    c.failure_code
FROM
    charges c
    JOIN payment_methods pm ON c.payment_method = pm.id
WHERE
    c.amount > 50000
    AND c.status = 'failed'
ORDER BY
    c.created DESC;`,

  'refund-query': `-- Suspicious refunds in the last 7 days
SELECT
    refunds.id AS refund_id,
    refunds.created AS refund_date,
    decimalize_amount_no_display(refunds.currency, refunds.amount, 2) AS amount,
    charges.id AS charge_id,
    customers.email,
    card_bin(charges.payment_method_id) AS card_bin,
    COUNT(*) OVER (PARTITION BY card_bin(charges.payment_method_id)) AS bin_count
FROM
    refunds
    JOIN charges ON refunds.charge_id = charges.id
    JOIN customers ON charges.customer_id = customers.id
WHERE
    refunds.created >= NOW() - INTERVAL '7 days'
    AND refunds.reason IS NULL
    AND charges.amount > 5000
ORDER BY
    bin_count DESC,
    refund_date DESC;`,

  ext06: `import Stripe from 'stripe';
import express, { Request, Response } from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.WEBHOOK_SECRET!
        );
    } catch (err) {
        return res.status(400).send(\`Webhook Error: \${err.message}\`);
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            // handle success
            break;
        default:
            console.log(\`Unhandled: \${event.type}\`);
    }
    res.json({ received: true });
}`,
};

const DEFAULT_CONTENT = RAW_CONTENT.ext01;

// SQL keywords set (uppercase)
const SQL_KW = new Set([
  'SELECT','FROM','WHERE','ORDER','BY','GROUP','HAVING','JOIN','ON','AS',
  'AND','OR','NOT','NULL','IS','IN','LIKE','BETWEEN','DISTINCT','LIMIT',
  'OFFSET','INNER','LEFT','RIGHT','OUTER','CROSS','UNION','ALL','WITH',
  'CREATE','DROP','ALTER','INSERT','UPDATE','DELETE','SET','VALUES',
  'TABLE','INDEX','VIEW','DATABASE','SCHEMA','DESC','ASC','CASE','WHEN',
  'THEN','ELSE','END','EXISTS','INTO','RETURNS','RETURN','BEGIN','OVER',
  'PARTITION','COUNT','NOW','INTERVAL',
]);

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightSQL(code) {
  let out = '';
  let i = 0;
  while (i < code.length) {
    // Line comment --
    if (code[i] === '-' && code[i + 1] === '-') {
      const end = code.indexOf('\n', i);
      const s = end === -1 ? code.slice(i) : code.slice(i, end);
      out += `<span class="op">${esc(s)}</span>`;
      i += s.length;
      continue;
    }
    // Block comment /* */
    if (code[i] === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const s = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      out += `<span class="op">${esc(s)}</span>`;
      i += s.length;
      continue;
    }
    // String literal
    if (code[i] === "'" || code[i] === '"') {
      const q = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== q) {
        if (code[j] === '\\') j++;
        j++;
      }
      const s = code.slice(i, j + 1);
      out += `<span class="str">${esc(s)}</span>`;
      i = j + 1;
      continue;
    }
    // Number
    if (/[0-9]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[0-9.]/.test(code[j])) j++;
      out += `<span class="num">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // Identifier / keyword / function
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      let k = j;
      while (k < code.length && code[k] === ' ') k++;
      if (code[k] === '(') {
        out += `<span class="fn">${esc(word)}</span>`;
      } else if (SQL_KW.has(word.toUpperCase())) {
        out += `<span class="kw">${esc(word)}</span>`;
      } else {
        out += esc(word);
      }
      i = j;
      continue;
    }
    out += esc(code[i]);
    i++;
  }
  return out;
}

export const CodeView = forwardRef(function CodeView({ tabId, onDirtyChange }, ref) {
  const initialContent = RAW_CONTENT[tabId] ?? DEFAULT_CONTENT;
  const [content, setContent] = useState(initialContent);
  const savedRef = useRef(initialContent);
  const gutterRef = useRef(null);
  const bodyRef = useRef(null);

  useImperativeHandle(ref, () => ({
    save() {
      savedRef.current = content;
      onDirtyChange?.(false);
    },
  }), [content, onDirtyChange]);

  useEffect(() => {
    const initial = RAW_CONTENT[tabId] ?? DEFAULT_CONTENT;
    setContent(initial);
    savedRef.current = initial;
  }, [tabId]);

  function handleChange(e) {
    const val = e.target.value;
    setContent(val);
    onDirtyChange?.(val !== savedRef.current);
  }

  function handleBodyScroll(e) {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  }

  const lines = content.split('\n');
  const highlighted = highlightSQL(content);

  return (
    <div className="cv-editor-wrap">
      <div className="cv-editor-gutter" ref={gutterRef} aria-hidden="true">
        {lines.map((_, i) => (
          <div key={i} className="cv-editor-line-num">{String(i + 1).padStart(2, '0')}</div>
        ))}
      </div>
      <div ref={bodyRef} className="cv-editor-body" onScroll={handleBodyScroll}>
        <pre
          className="cv-editor-pre"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
        />
        <textarea
          className="cv-editor-textarea"
          value={content}
          onChange={handleChange}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
        />
      </div>
    </div>
  );
});
