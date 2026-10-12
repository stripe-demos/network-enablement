import { isTaskRunning } from '../../data/chartPreparation';

export function ChatStatus({ title, timestamp, phase }) {
  const running = isTaskRunning(phase);
  const status = running ? 'Thinking' : phase === 'complete' ? 'Completed' : phase === 'cancelled' ? 'Stopped' : timestamp;

  return (
    <div className="chat-item-status text-text-muted" role="status" aria-live="polite" aria-atomic="true"
      aria-label={`${title}: ${status}`} data-running={running || undefined}>
      {running ? <>
        <svg className="chat-item-status__spinner" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="21 8" />
        </svg>
        <span>Thinking</span>
      </> : timestamp}
    </div>
  );
}
