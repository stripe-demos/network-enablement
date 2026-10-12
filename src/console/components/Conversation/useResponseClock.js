import { useEffect, useState } from 'react';

// Only mounted responses animate. Background jobs use the scheduler's wall
// clock, so switching chats never pauses or restarts their work.
export function useResponseClock(run) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!run || run.stoppedAt != null) return;
    let frame;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time - run.startedAt < run.duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run]);
  return run ? Math.max(0, Math.min(run.duration, (run.stoppedAt ?? now) - run.startedAt)) : 0;
}
