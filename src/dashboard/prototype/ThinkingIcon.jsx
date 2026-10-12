const THINKING_ICON_DOTS = [
  { cx: 9.75, cy: 2.25, r: 1.125, delay: '0.0s', duration: '1.8s' },
  { cx: 6, cy: 2.25, r: 0.75, delay: '0.5s', duration: '1.5s' },
  { cx: 2.25, cy: 2.25, r: 0.75, delay: '0.2s', duration: '2.0s' },
  { cx: 9.75, cy: 9.75, r: 0.75, delay: '0.7s', duration: '1.4s' },
  { cx: 6, cy: 9.75, r: 0.75, delay: '0.1s', duration: '1.9s' },
  { cx: 2.25, cy: 9.75, r: 1.125, delay: '0.9s', duration: '1.6s' },
  { cx: 9.75, cy: 6, r: 0.75, delay: '0.4s', duration: '2.1s' },
  { cx: 6, cy: 6, r: 1.125, delay: '1.1s', duration: '1.3s' },
  { cx: 2.25, cy: 6, r: 0.75, delay: '0.6s', duration: '1.7s' },
]

export function ThinkingIcon({ size = 12, color = 'currentColor', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`.trim()}
      aria-hidden="true"
    >
      {THINKING_ICON_DOTS.map((dot, i) => (
        <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={color} />
      ))}
    </svg>
  )
}

export function AnimatedThinkingIcon({ size = 12, color = 'currentColor', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 thinking-icon-animated ${className}`.trim()}
      aria-hidden="true"
    >
      {THINKING_ICON_DOTS.map((dot, i) => (
        <circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill={color}
          className="thinking-icon-animated__dot"
          style={{ animationDelay: dot.delay, animationDuration: dot.duration }}
        />
      ))}
    </svg>
  )
}
