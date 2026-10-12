import { TaskPresentation } from './TaskPresentation';
import { useRef, useState } from 'react';
import {
  TaskExpandIcon,
  TaskSubtitleArrow,
  CopyIcon,
  ExpandArrowIcon,
  ArtifactChartIcon,
  ArtifactTableIcon,
  ArtifactTextIcon,
  ArtifactCodeIcon,
} from '../icons';
import { MessageIndicator } from './MessageIndicator';
import { ArtifactChips } from './ArtifactChips';
import { CHAT_CONTENT } from '../../data/messages';

// RichConversation — port of buildRichMessages() for failed-payments.
// Markup is preserved 1:1 from prototypes/main/index.html.
// Only the FINAL assistant indicator in the chain is highlighted when this
// is the latest reply — all earlier ones stay muted so the eye lands on
// the most-recent square.

// Inline reference to a named place in the product, used in the closing beat
// of a task block so the agent's handoff points somewhere concrete.
function SourceLink({ children }) {
  return (
    <a style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}>
      {children}
    </a>
  );
}

export function RichConversation({ onArtifactClick, onExpandToCanvas, onOpenSourceTab, isLatest = false }) {
  const data = CHAT_CONTENT['failed-payments'];
  const [userExpanded, setUserExpanded] = useState(false);
  const [user2Expanded, setUser2Expanded] = useState(false);
  const [user3Expanded, setUser3Expanded] = useState(false);
  const [user4Expanded, setUser4Expanded] = useState(false);
  const [user5Expanded, setUser5Expanded] = useState(false);
  const [user6Expanded, setUser6Expanded] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [task2Expanded, setTask2Expanded] = useState(false);
  const [task3Expanded, setTask3Expanded] = useState(false);
  const [task4Expanded, setTask4Expanded] = useState(false);
  const [task5Expanded, setTask5Expanded] = useState(false);
  const [task6Expanded, setTask6Expanded] = useState(false);
  const taskModuleRef = useRef(null);
  const task2Ref = useRef(null);
  const task3Ref = useRef(null);
  const task4Ref = useRef(null);
  const task5Ref = useRef(null);
  const task6Ref = useRef(null);

  return (
    <>
      {/* USER PROMPT */}
      <div
        data-chat-nav
        className={`user-message linear-border ${userExpanded ? 'expanded' : ''}`}
        style={{
          minHeight: 32,
          padding: '5px 14px 5px 18px',
          borderRadius: 6,
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
        onClick={() => setUserExpanded((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{data.prompt}</span>
      </div>

      {/* TASK MODULE */}
      <TaskPresentation preset="failed-payments" onTaskToggle={() => setTaskExpanded(value => !value)}
        ref={taskModuleRef}
        data-chat-nav
        className={`task-module ${taskExpanded ? 'expanded' : ''}`}
        onClick={(e) => {
          if (e.target.closest('button, a, .code-actions')) return;
          setTaskExpanded((v) => !v);
        }}
      >
        <div className="task-header">
          <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '1.5px', background: 'var(--color-border-default)' }} />
          </div>
          <div className="task-header-left">
            <div className="task-header-top">
              <span className="task-label">Task</span>
              <span className="task-name text-shimmer">{data.task}</span>
            </div>
            <div className="task-subtitle-wrap">
              <div className="task-subtitle task-subtitle-default">
                <TaskSubtitleArrow />
                Used {data.tools} tools
              </div>
              <div className="task-subtitle task-subtitle-hover">
                <TaskSubtitleArrow />
                Click to expand
              </div>
            </div>
          </div>
          <TaskExpandIcon size={12} />
        </div>
        <div className="task-detail">
          <div className="task-detail-inner">
            <div className="task-body-text">
              The user is asking for failed payments above $500 in December alongside the growth picture they sit inside. I will query daily active merchants first to establish the baseline, then pull the failed charges and group them by decline code.
            </div>
            <div className="code-inline">Querying active merchants</div>
            <div className="task-body-text">
              Retrieved 31 days of merchant activity showing steady growth across December, which gives a stable denominator for the failure rates.
            </div>
            <div className="code-inline">Fetching conversion funnel breakdown</div>
            <div className="task-body-text">
              The conversion funnel breakdown couldn't be retrieved because the stage field isn't populated before December 1st, so I'll compute the conversion rate directly from the merchants table instead.
            </div>
            <div className="code-inline">Reading file tax-skill.md</div>
            <div className="task-body-text">
              Loaded the tax skill definition, which documents how the $500 threshold is applied per region.
            </div>
            <div className="code-block code-block-single" style={{ marginTop: 10 }}>
              <div className="code-header">
                <span>skill.md</span>
                <div className="code-actions">
                  <button
                    className="code-action-expand"
                    title="Open artifact"
                    onClick={(e) => { e.stopPropagation(); onExpandToCanvas?.('text'); }}
                  >
                    <ExpandArrowIcon size={12} />
                  </button>
                </div>
              </div>
            </div>
            <div className="task-body-text">
              Now I need to cross-reference failed charges above $500 filtered by{' '}
              <code
                style={{
                  fontFamily: "'SF Mono', Menlo, monospace",
                  fontSize: 12,
                  background: 'var(--color-surface-2)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  color: 'var(--color-icon-default)',
                }}
              >
                status: failed
              </code>{' '}
              and group them by decline code to surface the top offenders.
            </div>
            <div className="code-block" style={{ marginTop: 10 }}>
              <div className="code-header">
                <span>Querying Growth overview</span>
                <div className="code-actions">
                  <button title="Copy">
                    <CopyIcon size={12} />
                  </button>
                  <button
                    className="code-action-expand"
                    title="Open artifact"
                    onClick={(e) => { e.stopPropagation(); onExpandToCanvas?.('ext01'); }}
                  >
                    <ExpandArrowIcon size={12} />
                  </button>
                </div>
              </div>
              <div className="code-body">
                <div>
                  <span className="ln">1</span>
                  <span className="op">-- Growth overview: north-star + conversion funnel</span>
                </div>
                <div>
                  <span className="ln">2</span>
                  <span className="kw">SELECT</span>
                </div>
                <div>
                  <span className="ln">3</span>  date_trunc(<span className="str">'day'</span>, m.created) <span className="kw">AS</span> day,
                </div>
                <div>
                  <span className="ln">4</span>  <span className="fn">COUNT</span>(<span className="kw">DISTINCT</span> m.id) <span className="kw">AS</span> active_merchants,
                </div>
                <div>
                  <span className="ln">5</span>  <span className="fn">SUM</span>(<span className="kw">CASE WHEN</span> m.stage = <span className="str">'live'</span>
                </div>
                <div>
                  <span className="ln">6</span>    <span className="kw">THEN</span> <span className="num">1</span> <span className="kw">ELSE</span> <span className="num">0</span> <span className="kw">END</span>) <span className="kw">AS</span> converted,
                </div>
                <div>
                  <span className="ln">7</span>
                  <span className="kw">FROM</span> merchants m
                </div>
              </div>
            </div>
            <div className="task-body-text">
              Found 1,247 failed charges across 340 customers, concentrated in the 424242 BIN range; the full breakdown is available in the <SourceLink>Growth metrics dashboard</SourceLink> for deeper analysis.
            </div>
            <div className="task-body-text">
              I have the growth baseline and the failure detail. I'll summarize the decline pattern and generate the growth overview chart alongside the failed payments table.
            </div>
          </div>
        </div>
      </TaskPresentation>

      {/* CONSOLE TEXT RESPONSE */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            Here are the failed payments over $500 from December. I pulled data from the analytics warehouse and filtered by decline status.
          </p>
          <p>A few things stand out:</p>
          <ul>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Total failed charges:</span> 1,247 across 340 unique customers
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Total volume:</span> $2.3M — up 18% from November
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Most common decline code:</span>{' '}
              <code>card_declined</code> at 68%
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Top issuer:</span> Chase accounting for 34% of all declines
            </li>
          </ul>
          <p>
            The majority came from the <code>424242</code> BIN range at an <strong>18.4%</strong> failure rate vs. the 1.2% baseline.
          </p>
          <ArtifactChips
            sourceItems={[{ label: 'Growth metrics', type: 'dashboard' }]}
            onOpenSourceTab={onOpenSourceTab}
            isLatest={false}
          >
            <div data-chat-nav className="artifact-ref" data-artifact="multi4" onClick={() => onArtifactClick?.('multi4')}>
              <ArtifactChartIcon />
              <span>Growth overview</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="table" onClick={() => onArtifactClick?.('table')}>
              <ArtifactTableIcon />
              <span>Failed payments</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="text" onClick={() => onArtifactClick?.('text')}>
              <ArtifactTextIcon />
              <span>tax-skill.md</span>
            </div>
          </ArtifactChips>
        </div>
      </div>

      {/* USER FOLLOW-UP 2 — Revenue & monitoring */}
      <div
        data-chat-nav
        className={`user-message linear-border ${user2Expanded ? 'expanded' : ''}`}
        style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
        onClick={() => setUser2Expanded((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
          Can you show me revenue trending over the month and also pull up our API health metrics? I want to see if the failures correlate with any latency spikes.
        </span>
      </div>

      {/* TASK MODULE 2 */}
      <TaskPresentation preset="revenue-api" onTaskToggle={() => setTask2Expanded(value => !value)}
        ref={task2Ref}
        data-chat-nav
        className={`task-module ${task2Expanded ? 'expanded' : ''}`}
        onClick={(e) => { if (e.target.closest('button, a, .code-actions')) return; setTask2Expanded((v) => !v); }}
      >
        <div className="task-header">
          <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '1.5px', background: 'var(--color-border-default)' }} />
          </div>
          <div className="task-header-left">
            <div className="task-header-top">
              <span className="task-label">Task</span>
              <span className="task-name text-shimmer">Correlating revenue and API health</span>
            </div>
            <div className="task-subtitle-wrap">
              <div className="task-subtitle task-subtitle-default">
                <TaskSubtitleArrow />
                Used 3 tools
              </div>
              <div className="task-subtitle task-subtitle-hover">
                <TaskSubtitleArrow />
                Click to expand
              </div>
            </div>
          </div>
          <TaskExpandIcon size={12} />
        </div>
        <div className="task-detail">
          <div className="task-detail-inner">
            <div className="task-body-text">
              The user wants to know whether the payment failures correlate with latency. I will pull the daily revenue timeseries from the billing aggregate table first, then overlay the API latency percentiles across the same window to test the correlation.
            </div>
            <div className="code-inline">Querying Revenue trend</div>
            <div className="task-body-text">
              Retrieved 31 days of succeeded charge revenue, showing a clear dip between December 14 and 16 against an otherwise flat month.
            </div>
            <div className="code-inline">Querying API latency percentiles</div>
            <div className="task-body-text">
              Latency percentiles retrieved: p99 spikes to 1.2s across December 14–16, aligning exactly with the revenue dip.
            </div>
            <div className="code-inline">Fetching error budget burn rate</div>
            <div className="task-body-text">
              Error budget analysis confirms 40% of the monthly budget burned in 48 hours, consistent with a partial upstream gateway outage; the full incident timeline is in the <SourceLink>API Monitoring dashboard</SourceLink>.
            </div>
            <div className="task-body-text">
              The correlation holds across all three signals. I'll report the alignment and generate the revenue and API health charts side by side.
            </div>
          </div>
        </div>
      </TaskPresentation>

      {/* RESPONSE 2 — Revenue + API health */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            Good instinct. Revenue dipped around Dec 14–16 which lines up with a p99 latency spike to 1.2s. The error budget burned through 40% in that window — looks like a partial gateway outage upstream.
          </p>
          <ArtifactChips
            sourceItems={[
              { label: 'Revenue trend', type: 'code', sqlId: 'sql-revenue-trend' },
              { label: 'API latency', type: 'code', sqlId: 'sql-api-latency' },
            ]}
            onOpenSourceTab={onOpenSourceTab}
            onApiClick={() => { setTask2Expanded(true); requestAnimationFrame(() => task2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
            isLatest={false}
          >
            <div data-chat-nav className="artifact-ref" data-artifact="chart" onClick={() => onArtifactClick?.('chart')}>
              <ArtifactChartIcon />
              <span>Revenue over time</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="multi2" onClick={() => onArtifactClick?.('multi2')}>
              <ArtifactChartIcon />
              <span>API health</span>
            </div>
          </ArtifactChips>
        </div>
      </div>

      {/* USER FOLLOW-UP 3 — Platform metrics + SQL */}
      <div
        data-chat-nav
        className={`user-message linear-border ${user3Expanded ? 'expanded' : ''}`}
        style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
        onClick={() => setUser3Expanded((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
          Pull the broader platform metrics too — volume, queue depth, error rate. And give me the raw SQL you used so I can run it against staging.
        </span>
      </div>

      {/* TASK MODULE 3 */}
      <TaskPresentation preset="platform-metrics" onTaskToggle={() => setTask3Expanded(value => !value)}
        ref={task3Ref}
        data-chat-nav
        className={`task-module ${task3Expanded ? 'expanded' : ''}`}
        onClick={(e) => { if (e.target.closest('button, a, .code-actions')) return; setTask3Expanded((v) => !v); }}
      >
        <div className="task-header">
          <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '1.5px', background: 'var(--color-border-default)' }} />
          </div>
          <div className="task-header-left">
            <div className="task-header-top">
              <span className="task-label">Task</span>
              <span className="task-name text-shimmer">Fetching platform metrics</span>
            </div>
            <div className="task-subtitle-wrap">
              <div className="task-subtitle task-subtitle-default">
                <TaskSubtitleArrow />
                Used 2 tools
              </div>
              <div className="task-subtitle task-subtitle-hover">
                <TaskSubtitleArrow />
                Click to expand
              </div>
            </div>
          </div>
          <TaskExpandIcon size={12} />
        </div>
        <div className="task-detail">
          <div className="task-detail-inner">
            <div className="task-body-text">
              The user wants the broader platform picture plus the raw SQL to run against staging. I will query request volume and queue depth, then export the combined query as a standalone artifact they can edit.
            </div>
            <div className="code-inline">Querying API throughput</div>
            <div className="task-body-text">
              Request volume retrieved at minute granularity, peaking at 4.2K rpm on December 18.
            </div>
            <div className="code-inline">Fetching error rate by endpoint</div>
            <div className="task-body-text">
              The per-endpoint error rate couldn't be fetched because the metrics service rejected the minute-level granularity, so I'll query the terminal queue depth instead to show where the backlog actually formed.
            </div>
            <div className="code-inline">Querying Queue depth</div>
            <div className="task-body-text">
              Queue depth retrieved in hourly buckets, showing the backlog clearing by 02:00 each night; the live view is in the <SourceLink>Platform Monitoring dashboard</SourceLink>.
            </div>
            <div className="task-body-text">
              I have volume and queue depth. I'll export the combined query as a standalone SQL artifact so the user can re-run it against staging with a different date range.
            </div>
            <div className="code-block code-block-single" style={{ marginTop: 10 }}>
              <div className="code-header">
                <span>Writing file failedpayments.sql</span>
                <div className="code-actions">
                  <button
                    className="code-action-expand"
                    title="Open artifact"
                    onClick={(e) => { e.stopPropagation(); onExpandToCanvas?.('ext01'); }}
                  >
                    <ExpandArrowIcon size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TaskPresentation>

      {/* RESPONSE 3 — Platform metrics + SQL */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            Here's the full platform view. Request volume peaked at 4.2K rpm on Dec 18 — the same day queue depth spiked. Error rate stayed under 0.5% outside of that window. SQL is attached if you want to tweak the date range.
          </p>
          <ArtifactChips
            sourceItems={[
              { label: 'Platform Monitoring', type: 'dashboard' },
              { label: 'API throughput', type: 'code', sqlId: 'sql-api-throughput' },
              { label: 'Queue depth', type: 'code', sqlId: 'sql-queue-depth' },
            ]}
            onOpenSourceTab={onOpenSourceTab}
            onApiClick={() => { setTask3Expanded(true); requestAnimationFrame(() => task3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
            isLatest={false}
          >
            <div data-chat-nav className="artifact-ref" data-artifact="multi3" onClick={() => onArtifactClick?.('multi3')}>
              <ArtifactChartIcon />
              <span>Platform metrics</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="ext01" onClick={() => onArtifactClick?.('ext01')}>
              <ArtifactCodeIcon />
              <span>Failed payments</span>
            </div>
          </ArtifactChips>
        </div>
      </div>

      {/* USER FOLLOW-UP 4 — Radar + shipping + PDF */}
      <div
        data-chat-nav
        className={`user-message linear-border ${user4Expanded ? 'expanded' : ''}`}
        style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
        onClick={() => setUser4Expanded((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
          While we're at it — pull the Radar ruleset diff between staging and prod, the December shipping labels export, and the PDF template localization doc. I need to cross-reference these for the ops review.
        </span>
      </div>

      {/* TASK MODULE 4 */}
      <TaskPresentation preset="ops-documents" onTaskToggle={() => setTask4Expanded(value => !value)}
        ref={task4Ref}
        data-chat-nav
        className={`task-module ${task4Expanded ? 'expanded' : ''}`}
        onClick={(e) => { if (e.target.closest('button, a, .code-actions')) return; setTask4Expanded((v) => !v); }}
      >
        <div className="task-header">
          <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '1.5px', background: 'var(--color-border-default)' }} />
          </div>
          <div className="task-header-left">
            <div className="task-header-top">
              <span className="task-label">Task</span>
              <span className="task-name text-shimmer">Gathering ops documents</span>
            </div>
            <div className="task-subtitle-wrap">
              <div className="task-subtitle task-subtitle-default">
                <TaskSubtitleArrow />
                Used 3 tools
              </div>
              <div className="task-subtitle task-subtitle-hover">
                <TaskSubtitleArrow />
                Click to expand
              </div>
            </div>
          </div>
          <TaskExpandIcon size={12} />
        </div>
        <div className="task-detail">
          <div className="task-detail-inner">
            <div className="task-body-text">
              The user needs three ops artifacts cross-referenced for review. I will search the Stripe documentation for the governing guides first so the diff and the export are interpreted against the documented behavior.
            </div>
            <div className="code-inline">Searching Stripe docs</div>
            <div className="task-body-text">
              Found <SourceLink>Radar rule configuration</SourceLink> — covers how velocity checks are evaluated and how staging and prod rulesets diverge.
            </div>
            <div className="task-body-text">
              Found <SourceLink>Shipping label exports</SourceLink> — documents the December batch format and the per-carrier row schema.
            </div>
            <div className="task-body-text">
              Found <SourceLink>PDF template localization</SourceLink> — lists the supported locales and the string keys required for each.
            </div>
            <div className="code-inline">Computing Radar ruleset diff</div>
            <div className="task-body-text">
              Diff computed: 4 rule changes between staging and prod, including two new velocity checks added December 12 targeting the 424242 BIN range.
            </div>
            <div className="code-inline">Exporting December shipping labels</div>
            <div className="task-body-text">
              Export retrieved with 340 rows across 12 carriers, and the PDF template confirms updated FR and DE strings are present.
            </div>
            <div className="task-body-text">
              All three artifacts are gathered and consistent with the documentation. I'll attach them together for the ops review.
            </div>
          </div>
        </div>
      </TaskPresentation>

      {/* RESPONSE 4 — Radar, shipping, PDF */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            All three are attached. The Radar diff shows 4 rule changes between staging and prod — two new velocity checks were added Dec 12. Shipping labels are the full December batch (340 rows). PDF template has the updated localization strings for FR and DE.
          </p>
          <ArtifactChips
            sourceItems={[
              { label: 'Radar rule configuration', type: 'doc' },
              { label: 'Shipping label exports', type: 'doc' },
              { label: 'PDF template localization', type: 'doc' },
            ]}
            onOpenSourceTab={onOpenSourceTab}
            onApiClick={() => { setTask4Expanded(true); requestAnimationFrame(() => task4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
            isLatest={false}
          >
            <div data-chat-nav className="artifact-ref" data-artifact="ext03" onClick={() => onArtifactClick?.('ext03')}>
              <ArtifactTextIcon />
              <span>Radar ruleset diff</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="ext04" onClick={() => onArtifactClick?.('ext04')}>
              <ArtifactTableIcon />
              <span>Shipping labels export</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="ext05" onClick={() => onArtifactClick?.('ext05')}>
              <ArtifactTextIcon />
              <span>PDF template</span>
            </div>
          </ArtifactChips>
        </div>
      </div>

      {/* USER FOLLOW-UP 5 — Webhook + queue + subscribers */}
      <div
        data-chat-nav
        className={`user-message linear-border ${user5Expanded ? 'expanded' : ''}`}
        style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
        onClick={() => setUser5Expanded((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
          Last thing — show me the webhook handler for payment_intent.succeeded, the terminal queue depth chart, and the weekly active subscribers by cohort.
        </span>
      </div>

      {/* TASK MODULE 5 */}
      <TaskPresentation preset="webhooks-cohorts" onTaskToggle={() => setTask5Expanded(value => !value)}
        ref={task5Ref}
        data-chat-nav
        className={`task-module ${task5Expanded ? 'expanded' : ''}`}
        onClick={(e) => { if (e.target.closest('button, a, .code-actions')) return; setTask5Expanded((v) => !v); }}
      >
        <div className="task-header">
          <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '1.5px', background: 'var(--color-border-default)' }} />
          </div>
          <div className="task-header-left">
            <div className="task-header-top">
              <span className="task-label">Task</span>
              <span className="task-name text-shimmer">Pulling webhook and subscriber data</span>
            </div>
            <div className="task-subtitle-wrap">
              <div className="task-subtitle task-subtitle-default">
                <TaskSubtitleArrow />
                Used 3 tools
              </div>
              <div className="task-subtitle task-subtitle-hover">
                <TaskSubtitleArrow />
                Click to expand
              </div>
            </div>
          </div>
          <TaskExpandIcon size={12} />
        </div>
        <div className="task-detail">
          <div className="task-detail-inner">
            <div className="task-body-text">
              The user wants the deployed webhook handler plus queue and subscriber data. I will read the handler source at{' '}
              <code style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 12, background: 'var(--color-surface-2)', padding: '1px 5px', borderRadius: 3, color: 'var(--color-icon-default)' }}>src/handlers/payment_intent.succeeded.ts</code>
              {' '}and verify it matches what is actually running.
            </div>
            <div className="code-inline">Fetching webhook endpoint configuration</div>
            <div className="task-body-text">
              Endpoint configuration retrieved, confirming the handler is registered for payment_intent.succeeded and the deployed revision matches HEAD.
            </div>
            <div className="code-inline">Fetching terminal queue depth</div>
            <div className="task-body-text">
              Queue depth for the last 24 hours peaked at 180 around 18:00, consistent with the nightly batch window.
            </div>
            <div className="code-inline">Fetching subscriber cohorts</div>
            <div className="task-body-text">
              Weekly active subscriber counts retrieved by cohort with no churn spike; every cohort is stable week over week.
            </div>
            <div className="task-body-text">
              All three came back clean. I'll attach the handler source, the queue chart, and the subscriber table together.
            </div>
          </div>
        </div>
      </TaskPresentation>

      {/* RESPONSE 5 — Webhook, queue, subscribers */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            Here you go. The webhook handler is the TypeScript source for <code>payment_intent.succeeded</code>. Queue depth peaked at 180 around 18:00 yesterday — consistent with the batch processing window. Subscriber cohorts are stable week-over-week, no churn spike.
          </p>
          <ArtifactChips
            sourceItems={[
              { label: 'Webhook endpoints', type: 'api' },
              { label: 'Terminal queue', type: 'api' },
              { label: 'Subscriber cohorts', type: 'api' },
            ]}
            onOpenSourceTab={onOpenSourceTab}
            onApiClick={() => { setTask5Expanded(true); requestAnimationFrame(() => task5Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
            isLatest={false}
          >
            <div data-chat-nav className="artifact-ref" data-artifact="ext06" onClick={() => onArtifactClick?.('ext06')}>
              <ArtifactCodeIcon />
              <span>Webhook handler</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="ext08" onClick={() => onArtifactClick?.('ext08')}>
              <ArtifactChartIcon />
              <span>Queue depth</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="ext09" onClick={() => onArtifactClick?.('ext09')}>
              <ArtifactTableIcon />
              <span>Weekly subscribers</span>
            </div>
          </ArtifactChips>
        </div>
      </div>

      {/* USER FOLLOW-UP 6 — Card details */}
      <div
        data-chat-nav
        className={`user-message linear-border ${user6Expanded ? 'expanded' : ''}`}
        style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
        onClick={() => setUser6Expanded((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
          Can you expand on the card details? I want to see the BIN, date, and decline reason for each one.
        </span>
      </div>

      {/* TASK MODULE 6 */}
      <TaskPresentation preset="card-details" onTaskToggle={() => setTask6Expanded(value => !value)}
        ref={task6Ref}
        data-chat-nav
        className={`task-module ${task6Expanded ? 'expanded' : ''}`}
        onClick={(e) => { if (e.target.closest('button, a, .code-actions')) return; setTask6Expanded((v) => !v); }}
      >
        <div className="task-header">
          <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '1.5px', background: 'var(--color-border-default)' }} />
          </div>
          <div className="task-header-left">
            <div className="task-header-top">
              <span className="task-label">Task</span>
              <span className="task-name text-shimmer">Expanding card details</span>
            </div>
            <div className="task-subtitle-wrap">
              <div className="task-subtitle task-subtitle-default">
                <TaskSubtitleArrow />
                Used 2 tools
              </div>
              <div className="task-subtitle task-subtitle-hover">
                <TaskSubtitleArrow />
                Click to expand
              </div>
            </div>
          </div>
          <TaskExpandIcon size={12} />
        </div>
        <div className="task-detail">
          <div className="task-detail-inner">
            <div className="task-body-text">
              The user wants the card-level detail behind the failures. I will join the failed charges table with card metadata to pull the BIN prefix, timestamp, and issuer decline reason for every charge over $500.
            </div>
            <div className="code-inline">Querying Card details</div>
            <div className="task-body-text">
              Retrieved the joined result set, sorted by amount descending with amounts converted from cents to dollars for display.
            </div>
            <div className="code-inline">Fetching issuer decline descriptions</div>
            <div className="task-body-text">
              The issuer decline descriptions couldn't be fetched because the issuer metadata service is rate limited right now, so I'll fall back to the raw decline codes already present on each charge.
            </div>
            <div className="task-body-text">
              The table is complete with raw decline codes; richer issuer context is available in the <SourceLink>Payments dashboard</SourceLink> if needed.
            </div>
          </div>
        </div>
      </TaskPresentation>

      {/* TABLE RESPONSE 2 — 5 columns, truncated with right-edge fade */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={isLatest} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>And here's the full detail breakdown including card and decline code:</p>
          <div className="inline-table-wrap inline-table-wrap--truncated">
            <button
              type="button"
              className="inline-table-expand-btn"
              title="Open in canvas"
              onClick={(e) => { e.stopPropagation(); onExpandToCanvas?.('inline02'); }}
            >
              <ExpandArrowIcon size={11} />
            </button>
            <div className="inline-table-clip">
            <table style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Card BIN</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Decline code</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Chloe Brown</td>
                  <td >4242 42xx</td>
                  <td>$4,800.00</td>
                  <td>Dec 19, 10:15 PM</td>
                  <td>Generic decline</td>
                </tr>
                <tr>
                  <td>Emma Davis</td>
                  <td >5105 51xx</td>
                  <td>$4,500.00</td>
                  <td>Dec 18, 9:30 PM</td>
                  <td>Generic decline</td>
                </tr>
                <tr>
                  <td>Frank Wilson</td>
                  <td >4012 88xx</td>
                  <td>$4,500.00</td>
                  <td>Dec 6, 9:45 AM</td>
                  <td>Generic decline</td>
                </tr>
                <tr>
                  <td>Henry Martinez</td>
                  <td >3714 49xx</td>
                  <td>$4,100.75</td>
                  <td>Dec 14, 5:30 PM</td>
                  <td>Do not honor</td>
                </tr>
                <tr>
                  <td>Noah Walker</td>
                  <td >6011 11xx</td>
                  <td>$2,800.00</td>
                  <td>Dec 4, 5:30 PM</td>
                  <td>Generic decline</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
          <ArtifactChips
            sourceItems={[
              { label: 'Payments', type: 'dashboard' },
              { label: 'Card details', type: 'code', sqlId: 'sql-card-details' },
              { label: 'Issuer metadata', type: 'api' },
            ]}
            onOpenSourceTab={onOpenSourceTab}
            onApiClick={() => { setTask6Expanded(true); requestAnimationFrame(() => task6Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
            isLatest={isLatest}
          />
        </div>
      </div>
    </>
  );
}
