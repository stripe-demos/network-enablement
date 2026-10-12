import { useLayoutEffect, useRef, useState } from 'react';
import { canCollapseWithoutMovingResponse } from '../../data/collapseVisibility';
import { getCheckpointDisclosure } from '../../data/taskCollapse';

export function useViewportCollapse({ enabled, elapsed, collapseAt, visible, groupRef, anchored, liveExpanded, completedExpanded }) {
  const [decision, setDecision] = useState(null);
  const anchor = useRef(null);
  const complete = elapsed >= collapseAt;
  const disclosure = getCheckpointDisclosure(elapsed, collapseAt, {
    anchored, liveExpanded, completedExpanded,
    autoCollapse: !enabled || (decision?.at === collapseAt && decision.allowed),
  });
  useLayoutEffect(() => {
    const measure = () => {
      if (!enabled || !complete) {
        anchor.current = null;
        if (decision !== null) setDecision(null);
        return;
      }
      if (!visible || decision?.at === collapseAt) return;
      const group = groupRef.current;
      const viewport = group?.closest('[data-conversation-scroll]');
      const response = group?.nextElementSibling;
      const header = group?.querySelector(':scope > .task-header');
      const allowed = Boolean(viewport && response?.classList.contains('assistant-message') && header
        && canCollapseWithoutMovingResponse({
          scrollTop: viewport.scrollTop,
          collapseHeight: Math.max(0, group.getBoundingClientRect().height - header.getBoundingClientRect().height) + 8,
        }));
      anchor.current = allowed ? { viewport, response, top: response.getBoundingClientRect().top } : null;
      setDecision({ at: collapseAt, allowed });
    };
    // Decide before the first collapse frame; later scrolling must not hide
    // history unexpectedly. Seeking back allows a fresh decision next time.
    measure();
  }, [enabled, complete, collapseAt, visible, groupRef, decision]);

  useLayoutEffect(() => {
    if (!enabled || !complete || completedExpanded !== null || !decision?.allowed) return;
    const current = anchor.current;
    if (!current) return;
    const delta = current.response.getBoundingClientRect().top - current.top;
    if (Math.abs(delta) > 0.5) current.viewport.scrollTop += delta;
  }, [enabled, complete, completedExpanded, decision, disclosure.fold.phase, disclosure.fold.heightFactor]);

  return disclosure;
}
