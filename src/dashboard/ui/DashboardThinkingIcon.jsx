import './DashboardThinkingIcon.css'

// Nine-dot mark with a larger rising diagonal, kept local to Dashboard.
const PULSES = [
  [0, 1.8], [0.5, 1.5], [0.2, 2],
  [0.7, 1.4], [0.1, 1.9], [0.9, 1.6],
  [0.4, 2.1], [1.1, 1.3], [0.6, 1.7],
]

export function DashboardThinkingIcon({ size = 16, thinking = false, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={`dashboard-thinking-icon ${className}`.trim()}
      data-thinking={thinking || undefined}
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      {PULSES.map(([delay, duration], index) => (
        <circle
          key={index}
          cx={2.25 + (index % 3) * 3.75}
          cy={2.25 + Math.floor(index / 3) * 3.75}
          r={[2, 4, 6].includes(index) ? 1.125 : 0.75}
          fill="currentColor"
          style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
        />
      ))}
    </svg>
  )
}
