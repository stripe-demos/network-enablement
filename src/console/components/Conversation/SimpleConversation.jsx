import { TaskPresentation } from './TaskPresentation';
import { useState } from 'react';
import { TaskExpandIcon, TaskSubtitleArrow } from '../icons';
import { MessageIndicator } from './MessageIndicator';
import { ArtifactChips } from './ArtifactChips';
import { CHAT_CONTENT } from '../../data/messages';

// SimpleConversation — port of buildSimpleMessages() from prototypes/main/index.html.
// One user message + one task module + one console response.

export function SimpleConversation({ chat, isLatest = false, onOpenSourceTab }) {
  const data = CHAT_CONTENT[chat.id];
  const [userExpanded, setUserExpanded] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(false);

  if (!data) return null;

  return (
    <>
      <div
        data-chat-nav
        className={`user-message flex items-start justify-between w-full linear-border ${userExpanded ? 'expanded' : ''}`}
        style={{ minHeight: 32, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', boxSizing: 'border-box' }}
        onClick={() => setUserExpanded((v) => !v)}
      >
        <span className="flex-1" style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: 'var(--color-icon-default)' }}>
          {data.prompt}
        </span>
      </div>

      <TaskPresentation preset="simple-records" onTaskToggle={() => setTaskExpanded(value => !value)} data-chat-nav className={`task-module ${taskExpanded ? 'expanded' : ''}`}>
        <div className="task-header" onClick={() => setTaskExpanded((v) => !v)}>
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
              The user is asking for data I can pull directly. I will query the Stripe API for the requested records and confirm the shape before answering.
            </div>
            <div className="code-inline">Fetching requested records</div>
            <div className="task-body-text">
              Records retrieved successfully with the expected fields present.
            </div>
            <div className="task-body-text">
              I have what I need. I'll summarize the result for the user.
            </div>
          </div>
        </div>
      </TaskPresentation>

      <div data-chat-nav className="assistant-message flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={isLatest} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          <div dangerouslySetInnerHTML={{ __html: data.response }} />
          <ArtifactChips
            sourceItems={[{ label: 'Stripe API', type: 'api' }]}
            onOpenSourceTab={onOpenSourceTab}
            onApiClick={() => setTaskExpanded(true)}
            isLatest={isLatest}
          />
        </div>
      </div>
    </>
  );
}
