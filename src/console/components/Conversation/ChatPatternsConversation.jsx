import { TaskPresentation } from './TaskPresentation';
import { useState } from 'react';
import {
  TaskExpandIcon,
  TaskSubtitleArrow,
  ExpandArrowIcon,
  ArtifactChartIcon,
  ArtifactTableIcon,
  ArtifactTextIcon,
} from '../icons';
import { MessageIndicator } from './MessageIndicator';
import { ArtifactChips } from './ArtifactChips';
import { AskQuestion } from './AskQuestion';
import { ThinkingIndicator } from './ThinkingIndicator';

// ChatPatternsConversation — a single chat that demos every conversation
// pattern in the system, top to bottom. Used as a living styleguide.
//
// Sections (in render order):
//   1. User prompt (collapsed/expanded)
//   2. Task module (collapsed/expanded with code blocks)
//   3. Console text response (paragraph + bullets + inline code)
//   4. Artifact pills row
//   5. Console table response
//   6. AskQuestion (pre-seeded multi-choice picker — Figma node 10689:87973)
//   7. Thinking indicator ("Crystallizing...")
//
// All visual patterns are kept identical to RichConversation so any future
// styling updates only need to happen in one source of truth (the CSS).

export function ChatPatternsConversation({ onArtifactClick, onExpandToCanvas, onOpenSourceTab, isLatest = false }) {
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
          Show me an example of every chat pattern we support so I can review the styles in one place.
        </span>
      </div>

      {/* TASK MODULE */}
      <TaskPresentation preset="patterns" onTaskToggle={() => setTaskExpanded(value => !value)}
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
              <span className="task-name text-shimmer">Assemble pattern showcase</span>
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
              The user wants every canonical chat fragment in one place. I will collect the user message, task module, console text, table, artifacts, and elicitation picker, then stitch them into a single reference page.
            </div>
            <div className="code-inline">Building pattern showcase</div>
            <div className="task-body-text">
              All six fragments emitted successfully into the showcase bundle.
            </div>
            <div className="code-inline">Fetching Figma library tokens</div>
            <div className="task-body-text">
              The Figma library tokens couldn't be fetched because the file requires interactive auth, so I'll verify the fragments against the local token definitions instead.
            </div>
            <div className="code-inline">Searching Stripe docs</div>
            <div className="task-body-text">
              Found <a style={{ color: 'var(--color-text-secondary)', textDecoration: 'underline', cursor: 'pointer' }}>Design token reference</a> — confirms every fragment matches the current token values.
            </div>
            <div className="task-body-text">
              Everything reconciles against the documented tokens. I'll write the reference page out as markdown.
            </div>
            <div className="code-block code-block-single" style={{ marginTop: 10 }}>
              <div className="code-header">
                <span>Writing file patterns.md</span>
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
          </div>
        </div>
      </TaskPresentation>

      {/* CONSOLE TEXT RESPONSE */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>
            Here's the full set. Each section uses the locked-in styles, so you can scan top to bottom to compare spacing, type, and color treatments.
          </p>
          <p>This block alone covers a few things:</p>
          <ul>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Paragraph copy:</span> 13px Inter, line-height 1.6, color <code>var(--color-icon-default)</code>
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Inline code:</span>{' '}
              <code>card_declined</code> — slightly brighter background to lift it off the page
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Strong emphasis:</span> <strong>18.4%</strong> uses primary text color and weight 600
            </li>
            <li>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Bulleted list:</span> 6px outer dot, 14px gap to copy
            </li>
          </ul>
          <p>
            Pills below trigger the right-pane canvas — same artifact handler as <code>failed-payments</code>.
          </p>
          <ArtifactChips
            sourceItems={[{ label: 'Design token reference', type: 'doc' }]}
            onOpenSourceTab={onOpenSourceTab}
            isLatest={false}
          >
            <div data-chat-nav className="artifact-ref" data-artifact="chart" onClick={() => onArtifactClick?.('chart')}>
              <ArtifactChartIcon />
              <span>Revenue chart</span>
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

      {/* TABLE RESPONSE */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={false} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>And here's the table treatment — a few rows so the row dividers and email link styles are visible:</p>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Failed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <a className="ext-link" href="#" target="_blank">Acme Corp</a>
                </td>
                <td>billing@acmecorp.io</td>
                <td>$42,800</td>
              </tr>
              <tr>
                <td>
                  <a className="ext-link" href="#" target="_blank">Northwind Ltd</a>
                </td>
                <td>ap@northwind.co</td>
                <td>$31,200</td>
              </tr>
              <tr>
                <td>
                  <a className="ext-link" href="#" target="_blank">Contoso Inc</a>
                </td>
                <td>finance@contoso.com</td>
                <td>$28,450</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ELICITATION INTRO (kept inside the indicator column so it reads as
          part of the assistant's reply). */}
      <div data-chat-nav className="flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={isLatest} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <p>Pick what you'd like to focus on next — arrow keys + enter, or click a row.</p>
          <ArtifactChips
            sourceItems={[
              { label: 'Design token reference', type: 'doc' },
              { label: 'Pattern showcase', type: 'api' },
            ]}
            onOpenSourceTab={onOpenSourceTab}
            isLatest={isLatest}
          />
        </div>
      </div>
      {/* ELICITATION CARD — pulled out of the indicator column so it spans
          the full messages area and respects the 16px conversation gutter. */}
      <AskQuestion options={['Fix login bug', 'Add search filter', 'Update API response']} />

      {/* THINKING INDICATOR */}
      <ThinkingIndicator label="Crystallizing..." />
    </>
  );
}
