import { useFutureTasks } from '../../variants/useFutureTasks';
import { FutureTaskBlock } from './FutureTaskBlock';
import { useResponseClock } from './useResponseClock';
import { getPresentedText } from '../../data/taskStreaming';
import { useState } from 'react';
import { MessageIndicator } from './MessageIndicator';
import { ArtifactChips } from './ArtifactChips';
import { TaskSubtitleArrow } from '../icons';
import { TaskToolCalls } from './TaskToolCalls';
import { ThinkingIndicator } from './ThinkingIndicator';
import { isTaskRunning } from '../../data/chartPreparation';
import { CANVAS_TAB_DATA, CANVAS_TAB_ICONS } from '../Canvas/canvasArtifactRegistry';

// SimulatedTurn — one user prompt + canned assistant reply, styled to match
// the existing user-message + assistant-message patterns used by both
// SimpleConversation and RichConversation. Used to grow the chat from the
// prompt input so we can test scrolling/anchoring without seeded fixtures.

function renderUserContent(user, userSegments) {
  if (!userSegments) return user;
  return userSegments.map((seg, i) => <span key={i}>{seg.text}</span>);
}

// Preserve the reference short answer's paragraph/list spacing as it streams,
// using the existing response typography rather than extra message components.
function CardResponse({ text }) {
  const blocks = text.split('\n\n');
  const closing = blocks[3];
  const linkText = 'automatic card updates';
  const linkStart = closing?.indexOf(linkText) ?? -1;
  return <>
    {blocks[0] && <p>{blocks[0]}</p>}
    {blocks[1] && <ul>{blocks.slice(1, 3).filter(Boolean).map((block, index) => <li key={index}>{block}</li>)}</ul>}
    {closing && <p>{linkStart < 0 ? closing : <>
      {closing.slice(0, linkStart)}<a style={{ textDecoration: 'underline' }} href="https://docs.stripe.com/saving-cards" target="_blank" rel="noreferrer">{linkText}</a>{closing.slice(linkStart + linkText.length)}
    </>}</p>}
  </>;
}

// A miniature snapshot of the Dashboard element the message references — a
// scaled clone of the captured HTML, framed like the launcher thumbnail
// (Figma 18675:53960 "Checkpoint").
function UserThumbnail({ snapshot }) {
  if (!snapshot?.html || !snapshot.width) return null;
  const W = 40;
  const H = 25;
  const scale = W / snapshot.width;
  return (
    <span
      aria-hidden
      style={{
        display: 'block', flexShrink: 0,
        width: W, height: H,
        background: '#FFFFFF',
        border: '0.78px solid var(--color-border-default)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          display: 'block',
          width: snapshot.width,
          height: snapshot.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        dangerouslySetInnerHTML={{ __html: snapshot.html }}
      />
    </span>
  );
}

export function SimulatedTurn({ user, userSegments, userThumbnail, entrance = false, assistant, isLatest = false, noFeedback = false, hideUser = false, taskRun, sourceItems, onOpenSourceTab, taskPhase, taskCopy, taskCalls, artifactId, artifactIds, onArtifactClick }) {
  const [userExpanded, setUserExpanded] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [futureTasks] = useFutureTasks();
  const elapsed = useResponseClock(taskRun);
  const responseText = taskRun ? getPresentedText(taskRun.responseStream, elapsed - taskRun.responseStart) : assistant;
  const writing = taskRun && elapsed < taskRun.responseEnd;
  const running = isTaskRunning(taskPhase) && taskPhase !== 'streaming';
  const results = artifactIds ?? (artifactId ? [artifactId] : []);

  return (
    <>
      {!hideUser && (
      <div
        data-chat-nav
        className={`user-message flex items-center justify-between w-full linear-border ${
          userExpanded ? 'expanded' : ''
        }`}
        style={{
          minHeight: 32,
          padding: userThumbnail ? '4px 14px 4px 4px' : '5px 14px 5px 18px',
          borderRadius: 6,
          cursor: 'pointer',
          boxSizing: 'border-box',
          animation: entrance ? 'launcherHandoffIn 320ms cubic-bezier(0.16,1,0.3,1) both' : undefined,
        }}
        onClick={() => setUserExpanded((v) => !v)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          {userThumbnail && <UserThumbnail snapshot={userThumbnail} />}
          <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, color: 'var(--color-text-secondary)', minWidth: 0 }}>
            {renderUserContent(user, userSegments)}
          </span>
        </span>
      </div>
      )}

      {taskPhase === 'initial-thinking' && <ThinkingIndicator />}
      {futureTasks && taskRun && taskPhase !== 'initial-thinking' && <FutureTaskBlock run={taskRun} elapsed={elapsed} cancelled={taskPhase === 'cancelled'} />}
      {(!futureTasks || !taskRun) && taskPhase && taskPhase !== 'initial-thinking' && (
        <div data-chat-nav className={`task-module${taskExpanded ? ' expanded' : ''}`} onClick={() => setTaskExpanded(value => !value)}>
          <div className="task-header">
            <div className="task-dot shrink-0" style={{ paddingTop: 7 }}>
              <div className={`simulation-task-dot${running ? ' is-running' : ''}`} />
            </div>
            <div className="task-header-left" aria-live={taskCalls ? undefined : 'polite'}>
              <div className="task-header-top">
                <span className="task-label">Task</span>
                <span className={`task-name${running ? ' text-shimmer' : ''}`}>
                  {taskPhase === 'cancelled' ? 'Stopped' : taskCopy?.name ?? (taskPhase === 'reading' ? 'Reviewing your business metrics' : taskPhase === 'thinking' ? 'Analyzing revenue trends' : 'Reviewed revenue performance')}
                </span>
              </div>
              {taskCalls ? <TaskToolCalls calls={taskCalls} complete={!running} /> :
              <div className="task-subtitle"><TaskSubtitleArrow />{taskCopy?.subtitle ?? (taskPhase === 'reading' ? 'Gathering payment data' : taskPhase === 'thinking' ? 'Thinking · preparing a chart' : 'Used 2 tools')}</div>}
            </div>
          </div>
          <div className="task-detail"><div className="task-detail-inner">
            <div className="task-body-text">{taskCopy?.detail ?? 'Reviewing monthly revenue and comparing it with the previous period.'}</div>
            {taskCalls ? <ol className="task-tool-history">
              {taskCalls.map(call => <li key={call.id}>{call.label}</li>)}
            </ol> : <div className="code-inline">{taskCopy?.subtitle ?? (taskPhase === 'complete' ? 'Revenue chart ready' : 'Preparing revenue overview…')}</div>}
          </div></div>
        </div>
      )}
      {responseText && <div data-chat-nav data-future-response={futureTasks && Boolean(taskRun) || undefined} data-enter={taskRun && taskPhase !== 'cancelled' && elapsed - taskRun.responseStart < 240 || undefined} className="assistant-message flex items-start w-full" style={{ gap: 10, padding: '5px 0' }}>
        <MessageIndicator isLatest={isLatest} />
        <div className="console-response flex-1" style={{ minWidth: 0 }}>
          {futureTasks && taskRun?.responseKind === 'card-expirations' ? <CardResponse text={responseText} /> :
            (Array.isArray(responseText) ? responseText : responseText.split('\n\n')).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          {!writing && !noFeedback && taskPhase !== 'cancelled' ? (
            <ArtifactChips
              sourceItems={sourceItems}
              onOpenSourceTab={onOpenSourceTab}
              isLatest={isLatest}
            >
              {results.map(id => {
                const Icon = CANVAS_TAB_ICONS[id];
                return <button key={id} type="button" data-chat-nav className="artifact-ref" onClick={() => onArtifactClick?.(id)}><Icon size={11} /><span>{CANVAS_TAB_DATA[id].label}</span></button>;
              })}
            </ArtifactChips>
          ) : (
            writing || taskPhase === 'cancelled' ? null : <div aria-hidden style={{ marginTop: 12, minHeight: 18 }} />
          )}
        </div>
      </div>}
    </>
  );
}
