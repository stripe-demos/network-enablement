import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createResponseRun } from '../../data/responseRun';
import { getFutureTasks } from '../../variants/useFutureTasks';

function createRun(chatId, submission, options = {}) {
  return createResponseRun(chatId, submission, { future: getFutureTasks(), ...options });
}

// One scheduler and turn store for every conversation. Each job has its own
// identity so stopped, replaced, or deleted runs cannot publish late results.
export function useSimulatedResponses({ initialSubmission, onArtifactReady, onComplete }) {
  const [initialRun] = useState(() => initialSubmission
    ? createRun(initialSubmission.chatId, initialSubmission.turn)
    : null);
  const [turns, setTurns] = useState(() => initialRun ? { [initialRun.chatId]: [initialRun.turn] } : {});
  const jobs = useRef(new Map());
  const callbacks = useRef({ onArtifactReady, onComplete });
  useLayoutEffect(() => {
    callbacks.current = { onArtifactReady, onComplete };
  }, [onArtifactReady, onComplete]);

  const clearJob = useCallback(chatId => {
    const job = jobs.current.get(chatId);
    job?.timers.forEach(clearTimeout);
    jobs.current.delete(chatId);
    return job;
  }, []);

  const schedule = useCallback(run => {
    const { chatId, turn, timeline } = run;
    const job = { turnId: turn.id, timers: new Set() };
    jobs.current.set(chatId, job);
    timeline.slice(1).forEach(({ delay, update }) => {
      const timer = setTimeout(() => {
        if (jobs.current.get(chatId) !== job) return;
        job.timers.delete(timer);
        setTurns(previous => ({
          ...previous,
          [chatId]: previous[chatId].map(item => item.id === turn.id ? { ...item, ...update } : item),
        }));
        if (update.artifactReady) callbacks.current.onArtifactReady?.(chatId, update);
        if (update.taskPhase === 'complete') {
          jobs.current.delete(chatId);
          callbacks.current.onComplete?.(chatId, update);
        }
      }, delay);
      job.timers.add(timer);
    });
  }, []);

  useEffect(() => {
    const pending = jobs.current;
    if (initialRun) schedule(initialRun);
    return () => {
      pending.forEach(job => job.timers.forEach(clearTimeout));
      pending.clear();
    };
  }, [initialRun, schedule]);

  const cancel = useCallback(chatId => {
    const job = clearJob(chatId);
    if (!job) return;
    setTurns(previous => ({
      ...previous,
      [chatId]: previous[chatId].map(turn => turn.id === job.turnId ? { ...turn, taskPhase: 'cancelled', taskRun: { ...turn.taskRun, stoppedAt: Date.now() } } : turn),
    }));
  }, [clearJob]);

  const start = useCallback((chatId, submission, options) => {
    cancel(chatId);
    const run = createRun(chatId, submission, options);
    setTurns(previous => ({ ...previous, [chatId]: [...(previous[chatId] ?? []), run.turn] }));
    schedule(run);
  }, [cancel, schedule]);

  const remove = useCallback(chatId => {
    clearJob(chatId);
    setTurns(previous => {
      const next = { ...previous };
      delete next[chatId];
      return next;
    });
  }, [clearJob]);

  return { turns, start, cancel, remove };
}
