import { TaskPresentation } from './TaskPresentation';
import { useState } from 'react';
import {
  TaskExpandIcon,
  TaskSubtitleArrow,
  ExpandArrowIcon,
  CopyIcon,
  ArtifactChartIcon,
  ArtifactTableIcon,
} from '../icons';
import { MessageIndicator } from './MessageIndicator';
import { ArtifactChips } from './ArtifactChips';

export function InteractiveCanvasConversation({ onArtifactClick, onExpandToCanvas, onOpenSourceTab, isLatest = false }) {
  const [userExpanded, setUserExpanded] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [user2Expanded, setUser2Expanded] = useState(false);

  return (
    <>
      {/* USER PROMPT 1 */}
      <div
        data-chat-nav
        className={`user-message linear-border ${userExpanded ? 'expanded' : ''}`}
        style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
        onClick={() => setUserExpanded((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-icon-default)' }}>
          Show me revenue trends alongside platform metrics — I want to see if the Q4 traffic spike correlates with the payment failure uptick.
        </span>
      </div>

      {/* TASK MODULE */}
      <TaskPresentation preset="interactive-canvas" onTaskToggle={() => setTaskExpanded(value => !value)}
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
              <span className="task-name text-shimmer">Correlating platform and payment data</span>
            </div>
            <div className="task-subtitle-wrap">
              <div className="task-subtitle task-subtitle-default">
                <TaskSubtitleArrow />
                Used 5 tools
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
              The user wants revenue read against platform health for Q4. I will pull the revenue time-series first, then join it against request volume, queue depth, and error rate over the same window.
            </div>
            <div className="code-inline">Fetching Q4 revenue time-series</div>
            <div className="task-body-text">
              Revenue retrieved across the full quarter with no gaps, giving a clean baseline to correlate against.
            </div>
            <div className="code-inline">Reading file tax-skill.md</div>
            <div className="task-body-text">
              Loaded the tax skill definition, which documents how regional thresholds are applied to the revenue figures.
            </div>

            {/* MD file — expandable to canvas */}
            <div className="code-block code-block-single" style={{ marginTop: 10 }}>
              <div className="code-header">
                <span>Reading file tax-skill.md</span>
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
              Now I need to cross-correlate traffic spikes against failure-rate increases, normalizing by payment volume so seasonal noise doesn't dominate the signal.
            </div>

            {/* SQL code block — expandable to canvas */}
            <div className="code-block" style={{ marginTop: 10 }}>
              <div className="code-header">
                <span>Querying Failed payments</span>
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
                <div><span className="ln">1</span><span className="op">-- Failed payments over $500 in December 2025</span></div>
                <div><span className="ln">2</span><span className="kw">SELECT</span></div>
                <div><span className="ln">3</span>{'  '}date_trunc(<span className="str">'hour'</span>, created) <span className="kw">AS</span> hour,</div>
                <div><span className="ln">4</span>{'  '}<span className="fn">count</span>(*) <span className="kw">AS</span> request_volume,</div>
                <div><span className="ln">5</span>{'  '}<span className="fn">sum</span>(<span className="kw">case when</span> status = <span className="str">'failed'</span> <span className="kw">then</span> <span className="num">1</span> <span className="kw">else</span> <span className="num">0</span> <span className="kw">end</span>)</div>
                <div><span className="ln">6</span>{'    '}<span className="kw">AS</span> failure_count</div>
              </div>
            </div>
          </div>
        </div>
      </TaskPresentation>

      {/* CONSOLE RESPONSE 1 */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            There's a clear correlation. Request volume peaked at <strong>3.2×</strong> baseline on Dec 18–19, and payment failures lagged by roughly <strong>4 hours</strong> before spiking to 18.4% — well above your 1.2% baseline.
          </p>
          <ul>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Revenue impact:</span> $2.3M in failed charges during the spike window, with the <code>424242</code> BIN range accounting for 34% of declines
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Queue depth:</span> hit 94th-percentile saturation at 11 PM Dec 18, which precedes the failure spike by ~90 minutes
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Error budget:</span> burned 38% in a single day — your 30-day budget is now at risk
            </li>
          </ul>
          <p>
            The platform metrics and revenue data are open in the canvas. The failure table is filtered to the spike window so you can drill into individual charges.
          </p>
          <ArtifactChips
            sourceItems={[
              { label: 'Platform Monitoring', type: 'dashboard' },
              { label: 'Failed payments', type: 'code', sqlId: 'ext01' },
            ]}
            onOpenSourceTab={onOpenSourceTab}
            isLatest={false}
          >
            <div data-chat-nav className="artifact-ref" data-artifact="chart" onClick={() => onArtifactClick?.('chart')}>
              <ArtifactChartIcon />
              <span>Revenue over time</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="multi3" onClick={() => onArtifactClick?.('multi3')}>
              <ArtifactChartIcon />
              <span>Platform metrics</span>
            </div>
            <div data-chat-nav className="artifact-ref" data-artifact="table" onClick={() => onArtifactClick?.('table')}>
              <ArtifactTableIcon />
              <span>Failed payments</span>
            </div>
          </ArtifactChips>
        </div>
      </div>

      {/* USER PROMPT 2 */}
      <div
        data-chat-nav
        className={`user-message linear-border ${user2Expanded ? 'expanded' : ''}`}
        style={{ minHeight: 32, padding: '5px 14px 5px 18px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
        onClick={() => setUser2Expanded((v) => !v)}
      >
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-icon-default)' }}>
          Is this pattern specific to Chase cards or is it across all issuers?
        </span>
      </div>

      {/* CONSOLE RESPONSE 2 */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={isLatest} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            Mostly Chase, but not exclusively. Chase accounts for <strong>34%</strong> of all declines — the <code>424242</code> and <code>4012 88xx</code> BINs alone make up 28%. The next highest issuers are Citi at 14% and Amex at 9%.
          </p>
          <p>
            The failure rate for non-Chase cards during the same window was <strong>4.1%</strong>, which is elevated but far below the <strong>18.4%</strong> Chase rate. This suggests a Chase-side processing issue during the traffic peak rather than a systematic platform problem on your end.
          </p>
          <ArtifactChips
            sourceItems={[{ label: 'Failed payments', type: 'code', sqlId: 'ext01' }]}
            onOpenSourceTab={onOpenSourceTab}
            isLatest={isLatest}
          />
        </div>
      </div>
    </>
  );
}
