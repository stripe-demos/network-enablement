export const CHECKPOINT_RESPONSE_HOLD_MS = 150;
export const CHECKPOINT_FOLD_MS = 220;
export const CHECKPOINT_SETTLE_MS = 200;
export const CHECKPOINT_HANDOFF_MS = CHECKPOINT_FOLD_MS + CHECKPOINT_SETTLE_MS;

export function getCheckpointFold(elapsed, collapseAt) {
  const since = elapsed - collapseAt;
  const progress = Math.max(0, Math.min(1, since / CHECKPOINT_FOLD_MS));
  // Smoothstep gives zero velocity at both ends. Playback drives the fold,
  // so pause, speed changes, and seeking cannot outrun a CSS transition.
  const eased = progress * progress * (3 - 2 * progress);
  return {
    phase: since < 0 ? 'running' : since < CHECKPOINT_HANDOFF_MS ? 'folding' : 'settled',
    heightFactor: 1 - eased,
    historyOpacity: 1 - Math.max(0, Math.min(1, progress / 0.45)),
    summaryOpacity: Math.max(0, Math.min(1, (progress - 0.5) / 0.5)),
  };
}

export function getCheckpointDisclosure(elapsed, collapseAt, { anchored = false, liveExpanded = true, completedExpanded = null, autoCollapse = true } = {}) {
  const complete = elapsed >= collapseAt;
  let fold = getCheckpointFold(elapsed, collapseAt);
  const expanded = complete ? completedExpanded ?? (autoCollapse ? false : anchored ? liveExpanded : true) : anchored ? liveExpanded : true;
  if (complete && !autoCollapse && expanded && completedExpanded === null) {
    // Retain the exact exposed layout instead of inserting a summary.
    fold = { phase: 'running', heightFactor: 1, historyOpacity: 1, summaryOpacity: 0 };
  }
  // Manual closure already has the final collapsed geometry, including the
  // gap to the response. Completion must not tighten that gap a second time.
  if (anchored && !complete && !liveExpanded) {
    fold = { ...fold, heightFactor: 0, historyOpacity: 1, summaryOpacity: 1 };
  }
  // A closed live group has nothing left to fold. A click during the automatic
  // fold takes control immediately and must not restart that fold on re-close.
  if (anchored && complete && (!liveExpanded || completedExpanded !== null)) {
    fold = { ...fold, phase: 'settled', heightFactor: 0, historyOpacity: 1, summaryOpacity: 1 };
  }
  return {
    expanded,
    fold,
  };
}
