import { useMemo } from 'react';
import { createTextStream, getStreamedText } from '../../data/taskStreaming';

// Shares the response cadence and playback clock: pausing, seeking, and
// reopening a task never restart or invent progress in its existing history.
export function TaskNarration({ text, elapsed, start, streaming, className = 'task-body-text' }) {
  const stream = useMemo(() => createTextStream(text), [text]);
  if (elapsed < start) return null;
  const visible = streaming ? getStreamedText(stream, elapsed - start) : text;
  return visible ? <p className={className}>{visible}</p> : null;
}
