import { TaskPresentation } from './TaskPresentation';
import { useState } from 'react';
import {
  ArtifactChartIcon,
  ArtifactTableIcon,
  ArtifactTextIcon,
  ExpandArrowIcon,
  CopyIcon,
  TaskExpandIcon,
  TaskSubtitleArrow,
} from '../icons';
import { MessageIndicator } from './MessageIndicator';
import { ArtifactChips } from './ArtifactChips';

export function SuspiciousRefundsConversation({ onArtifactClick, onExpandToCanvas, onOpenSourceTab, isLatest = false }) {
  const [userExpanded, setUserExpanded] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(false);

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
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-icon-default)' }}>
          Flag any unusual refund patterns from the last 7 days
        </span>
      </div>

      {/* TASK MODULE */}
      <TaskPresentation preset="suspicious-refunds" onTaskToggle={() => setTaskExpanded(value => !value)}
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
              <span className="task-name text-shimmer">Analyzing refund activity</span>
            </div>
            <div className="task-subtitle-wrap">
              <div className="task-subtitle task-subtitle-default">
                <TaskSubtitleArrow />
                Used 4 tools
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
              The user is asking which refunds look suspicious. I will query refund transactions from the last 7 days and group them by{' '}
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
                card_bin
              </code>{' '}
              to surface velocity patterns.
            </div>
            <div className="code-inline">Fetching Radar risk scores</div>
            <div className="task-body-text">
              The Radar risk scores couldn't be fetched because the review queue is still indexing today's events, so I'll compute the velocity signal directly from the refund table instead.
            </div>
            <div className="code-block code-block--peek" style={{ marginTop: 10 }}>
              <div className="code-header">
                <span>Querying Suspicious refunds</span>
                <div className="code-actions">
                  <button title="Copy">
                    <CopyIcon size={12} />
                  </button>
                  <button
                    className="code-action-expand"
                    title="Open artifact"
                    onClick={(e) => { e.stopPropagation(); onExpandToCanvas?.('refund-query'); }}
                  >
                    <ExpandArrowIcon size={12} />
                  </button>
                </div>
              </div>
              <div className="code-body">
                <div>
                  <span className="ln">1</span>
                  <span className="op">-- Suspicious refunds in the last 7 days</span>
                </div>
                <div>
                  <span className="ln">2</span>
                  <span className="kw">SELECT</span>
                </div>
                <div>
                  <span className="ln">3</span>{'  '}refunds.id <span className="kw">AS</span> refund_id,
                </div>
                <div>
                  <span className="ln">4</span>{'  '}refunds.created <span className="kw">AS</span> refund_date,
                </div>
                <div>
                  <span className="ln">5</span>{'  '}<span className="fn">decimalize_amount_no_display</span>(refunds.currency,
                </div>
              </div>
            </div>
            <div className="task-body-text">
              Found 47 flagged refunds totalling $18,240, with a single card BIN refunded across 12 distinct charges inside a 4-hour window.
            </div>
            <div className="task-body-text">
              The velocity pattern is clear enough to act on. I'll summarize the signal and generate the refund rate chart alongside the BIN breakdown.
            </div>
          </div>
        </div>
      </TaskPresentation>

      {/* ASSISTANT REPLY — summary + 3 artifact pills */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            I found several refund patterns worth flagging. Refund volume spiked <strong>3.4×</strong> above
            your 30-day baseline on May 28, concentrated in a single merchant account.
          </p>
          <ul>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Total flagged:</span> 47 refunds totalling $18,240
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Primary signal:</span> same card BIN refunded across
              12 distinct charges within 4 hours
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Risk score:</span> 94 / 100 — recommend review
            </li>
          </ul>
          <p>
            The pattern matches a known refund-abuse playbook: small charges followed by full refunds, cycling
            across cards to stay under velocity thresholds.
          </p>
          <ArtifactChips
            sourceItems={[{ label: 'Suspicious refunds', type: 'code', sqlId: 'refund-query' }]}
            onOpenSourceTab={onOpenSourceTab}
            isLatest={false}
          >
            <div data-chat-nav className="artifact-ref" data-artifact="refund-trend" onClick={() => onArtifactClick?.('refund-trend')}>
              <ArtifactChartIcon />
              <span>Refund rate</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="refund-table" onClick={() => onArtifactClick?.('refund-table')}>
              <ArtifactTableIcon />
              <span>Flagged transactions</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="refund-report" onClick={() => onArtifactClick?.('refund-report')}>
              <ArtifactTextIcon />
              <span>Risk summary</span>
            </div>
          </ArtifactChips>
        </div>
      </div>

      {/* INLINE TABLE — BIN-level refund analysis */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={isLatest} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>The abuse is concentrated in four card BINs — all issued by the same bank:</p>
          <div className="inline-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Card BIN</th>
                  <th>Issuer</th>
                  <th>Refunds</th>
                  <th>Refund rate</th>
                  <th className="expand-th">
                    <button
                      type="button"
                      className="inline-table-expand-btn"
                      title="Open in canvas"
                      onClick={(e) => { e.stopPropagation(); onExpandToCanvas?.('refund-bins'); }}
                    >
                      <ExpandArrowIcon size={11} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td >4242 42xx</td>
                  <td>Chase</td>
                  <td>18</td>
                  <td>91%</td>
                  <td />
                </tr>
                <tr>
                  <td >4012 88xx</td>
                  <td>Chase</td>
                  <td>12</td>
                  <td>86%</td>
                  <td />
                </tr>
                <tr>
                  <td >4111 11xx</td>
                  <td>Chase</td>
                  <td>9</td>
                  <td>75%</td>
                  <td />
                </tr>
                <tr>
                  <td >5500 00xx</td>
                  <td>Mastercard</td>
                  <td>8</td>
                  <td>62%</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <ArtifactChips
            sourceItems={[
              { label: 'Radar', type: 'dashboard' },
              { label: 'Suspicious refunds', type: 'code', sqlId: 'refund-query' },
            ]}
            onOpenSourceTab={onOpenSourceTab}
            isLatest={isLatest}
          />
        </div>
      </div>
    </>
  );
}
