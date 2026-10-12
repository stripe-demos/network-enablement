// Closing removes height above the response. Reducing scrollTop by that same
// amount keeps the response still, even when part of the task is visible.
// If scrolling would hit zero first, the response would be pulled upward.
export function canCollapseWithoutMovingResponse({ scrollTop, collapseHeight }) {
  return [scrollTop, collapseHeight].every(Number.isFinite)
    && collapseHeight > 0
    && scrollTop >= collapseHeight;
}
