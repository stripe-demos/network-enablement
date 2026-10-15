// Enablement module as a contextual nudge: a slim banner on the page where an
// item is actionable (each item's `nudge.paths`), until it's done or
// dismissed. Home leads with the next unfinished Connect item and a count.
// The banner starts minimized; clicking it expands the full task list in
// place, so nothing navigates away until a task is picked. DashboardLayout
// mounts it above every page except Home, which places its own under the
// console input.
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, CheckCircleIcon, ChevronDownIcon, Collapse, color, radius, tokens, type } from '@dashboard/ui'
import { useEnablementPrototypeControls, writeEnablementPrototypeControls } from '../prototype/enablementPrototypeControls'
import { CONNECT_ITEMS, useEnablementDone } from './enablementItems'

const ASSETS = '/dashboard-assets/enablement'
const HOME_KEY = 'home'

function pickNudge(pathname, done, dismissed) {
  const open = CONNECT_ITEMS.filter(item => !done[item.id])
  if (pathname === '/' || pathname === '/onsite-home') {
    const next = open[0]
    if (!next || dismissed.includes(HOME_KEY)) return null
    return { key: HOME_KEY, item: next, text: `Next up: ${next.shortLabel}`, action: 'Start' }
  }
  const item = open.find(i => !dismissed.includes(i.id) && i.nudge?.paths.some(path => pathname.startsWith(path)))
  return item ? { key: item.id, item, text: item.nudge.text, action: item.nudge.action } : null
}

export default function EnablementNudge({ style }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { placement, dismissedNudges } = useEnablementPrototypeControls()
  const done = useEnablementDone()
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(null)

  const nudge = placement === 'nudge' ? pickNudge(pathname, done, dismissedNudges) : null
  if (!nudge) return null

  const run = item => (item.onOpen ? item.onOpen() : navigate(item.to))
  const dismiss = () => writeEnablementPrototypeControls({ dismissedNudges: [...dismissedNudges, nudge.key] })
  const doneCount = CONNECT_ITEMS.filter(item => done[item.id]).length

  return (
    <aside
      aria-label="Enablement"
      data-wireframe-show=""
      data-wireframe-frame="card"
      style={{
        background: `linear-gradient(90deg, ${color.brand50} 0%, ${color.surface} 100%)`,
        border: `1px solid ${color.neutral50}`,
        borderRadius: radius.lg,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 16px' }}>
        {/* The whole text area toggles the task list. */}
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 0', minWidth: 0, padding: 0, border: 0, background: 'transparent', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
        >
          <img src={`${ASSETS}/checklist-flag.svg`} alt="" style={{ display: 'block', flexShrink: 0 }} />
          <span style={{ ...type.bodySmall, flex: '1 1 0', minWidth: 0, color: color.textStrong }}>
            {nudge.text}
            <span style={{ color: color.subdued }}> · {doneCount} of {CONNECT_ITEMS.length} done</span>
          </span>
          <ChevronDownIcon
            size={10}
            style={{ flexShrink: 0, color: color.subdued, transform: expanded ? 'rotate(180deg)' : 'none', transition: `transform ${tokens.ease.fast}` }}
          />
        </button>
        <Button size="sm" onClick={() => run(nudge.item)}>{nudge.action}</Button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          onMouseEnter={() => setHovered('dismiss')}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: 'inline-flex',
            padding: 4,
            border: 0,
            borderRadius: radius.sm,
            background: hovered === 'dismiss' ? color.neutral50 : 'transparent',
            color: color.subdued,
            cursor: 'pointer',
            transition: `background ${tokens.ease.fast}`,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <Collapse open={expanded}>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: 0, padding: '0 8px 8px', listStyle: 'none' }}>
          {CONNECT_ITEMS.map(item => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => run(item)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${hovered === item.id ? color.borderDefault : color.neutral50}`,
                  borderRadius: radius.md,
                  background: hovered === item.id ? color.neutral25 : color.surface,
                  font: 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: `background ${tokens.ease.fast}, border-color ${tokens.ease.fast}`,
                }}
              >
                <span style={{ ...type.bodySmall, flex: '1 1 0', minWidth: 0, color: color.textStrong }}>
                  {item.before}
                  <span style={{ color: color.actionPrimary }}>{item.highlight}</span>
                  {item.after}
                </span>
                {done[item.id] ? (
                  <span aria-label="Done" role="img" style={{ display: 'inline-flex', flexShrink: 0, color: color.brand500 }}>
                    <CheckCircleIcon size={16} />
                  </span>
                ) : (
                  <img src={`${ASSETS}/progress-ring-0.svg`} alt="" width={16} height={16} style={{ display: 'block', flexShrink: 0 }} />
                )}
              </button>
            </li>
          ))}
        </ul>
      </Collapse>
    </aside>
  )
}
