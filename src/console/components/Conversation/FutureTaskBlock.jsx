import { useId, useRef, useState } from 'react';
import { DisclosureChevron } from '../Disclosure';
import { TaskLiveText } from './TaskLiveText';
import { TaskNarration } from './TaskNarration';
import { TaskCodeBlock } from './TaskCodeBlock';
import { getPresentedText } from '../../data/taskStreaming';
import { useViewportCollapse } from './useViewportCollapse';

function taskTimer(elapsed) {
  const seconds = Math.max(0, Math.floor(elapsed / 1000));
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}

// The anchored group and nested task disclosures use the source's grid-row
// geometry, chevron, hover and fold timing. Content uses our existing styles.
export function TaskDisclosure({ ref, title, children, timer = 0, busy = false, group = false, preset, enter = false, fold, expanded: controlled, onExpandedChange, defaultExpanded = false }) {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const expanded = controlled ?? localExpanded;
  const id = useId();
  return <div ref={ref} data-chat-nav data-future-task data-preset-task={preset} data-enter={enter || undefined} data-task-group={group || undefined} data-group-phase={fold?.phase}
    className={`task-module future-task${expanded ? ' expanded' : ''}`}
    style={fold ? { '--checkpoint-fold-row': `${fold.heightFactor}fr`, '--checkpoint-height-factor': fold.heightFactor, '--checkpoint-history-opacity': fold.historyOpacity } : undefined}>
    <button type="button" className="task-header disclosure-trigger" aria-expanded={expanded} aria-controls={id} onClick={event => {
      setLocalExpanded(!expanded);
      onExpandedChange?.(!expanded, event);
    }}>
      {group && <span className="future-task-indicator" aria-hidden="true"><span className="simulation-task-dot" /></span>}
      <TaskLiveText text={title} active={busy && (!group || !expanded)} />
      <span className="task-timer">{taskTimer(timer)}</span>
      <DisclosureChevron expanded={expanded} />
    </button>
    <div id={id} className="task-detail" inert={!expanded} aria-hidden={!expanded}><div className="task-detail-inner">{children}</div></div>
  </div>;
}

export function FutureTaskBlock({ run, elapsed, cancelled = false }) {
  const groupRef = useRef(null);
  const [liveExpanded, setLiveExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(null);
  const first = run.steps[0];
  const visible = elapsed >= first.messageStart;
  const complete = elapsed >= run.collapseAt;
  const { expanded, fold } = useViewportCollapse({
    enabled: !cancelled, elapsed, collapseAt: run.collapseAt, visible, groupRef,
    anchored: true, liveExpanded, completedExpanded,
  });
  if (!visible && !cancelled) return null;
  return <TaskDisclosure ref={groupRef} group title={cancelled ? `${run.title} · Stopped` : run.title}
    timer={Math.min(elapsed, run.toolsEnd) - first.start} busy={!cancelled && elapsed < run.toolsEnd}
    fold={fold} expanded={expanded} onExpandedChange={complete ? setCompletedExpanded : setLiveExpanded}>
    <div className="checkpoint-group-history">
      {run.steps.map(step => {
        const message = getPresentedText(step.stream, elapsed - step.messageStart);
        if (!message && (step.message || elapsed < step.taskReveal)) return null;
        return <div className="checkpoint-step" key={step.id}>
          {message && <div className="console-response checkpoint-message" data-enter={!cancelled && elapsed - step.messageStart < 240 || undefined}>{message}</div>}
          {elapsed >= step.taskReveal && <TaskDisclosure title={step.label} enter={!cancelled && elapsed - step.taskReveal < 240} timer={Math.min(elapsed, step.end) - step.start} busy={!cancelled && elapsed < step.end}>
            <TaskNarration text={step.detail} elapsed={elapsed} start={step.taskReveal} streaming />
            {step.code ? <TaskCodeBlock title={step.label} code={step.code} /> : <div className="code-inline">{step.tool ?? step.label}</div>}
            {step.finding && <TaskNarration text={step.finding} elapsed={elapsed} start={step.end} streaming />}
          </TaskDisclosure>}
        </div>;
      })}
    </div>
  </TaskDisclosure>;
}
