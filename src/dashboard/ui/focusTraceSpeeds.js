/**
 * FocusTrace's `speed` presets. Slow, Medium and Fast make one lap (an
 * announcement); Loop keeps orbiting while its object has Console's focus.
 */
export const FOCUS_TRACE_SPEEDS = {
  slow: { duration: 5500, loops: 1 },
  medium: { duration: 3000, loops: 1 },
  fast: { duration: 1000, loops: 1 },
  loop: { duration: 5500, loops: Infinity },
}
