// Enablement module, embedded: the "Get more from your platform" checklist
// (Figma 11038:39006, "Recommended"). Each row links to the page that completes
// the step; the Stripe network row opens the network onboarding dialog instead,
// and shows as done once the dialog has been completed (it can still be
// reopened). Rows come from enablementItems.js; which pages show the module is
// a prototype control (prototype/enablementPrototypeControls.js).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircleIcon, color, type, radius, tokens } from '@dashboard/ui'
import { CONNECT_ITEMS, useEnablementDone } from './enablementItems'

const ASSETS = '/dashboard-assets/enablement'

const text = { ...type.bodySmall, lineHeight: '18px' }

function ChecklistRow({ item, done = false }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const Row = item.onOpen ? 'button' : Link
  const rowProps = item.onOpen ? { type: 'button', onClick: item.onOpen } : { to: item.to }
  return (
    <Row
      {...rowProps}
      data-wireframe-frame="card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={e => setFocused(e.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: 16,
        background: hovered ? color.neutral25 : color.surface,
        border: `1px solid ${hovered ? color.borderDefault : color.neutral50}`,
        borderRadius: radius.lg,
        outline: 'none',
        boxShadow: focused ? `0 0 0 2px ${color.surface}, 0 0 0 4px ${color.brand500}` : 'none',
        textDecoration: 'none',
        width: '100%',
        textAlign: 'left',
        font: 'inherit',
        cursor: 'pointer',
        transition: `background ${tokens.ease.fast}, border-color ${tokens.ease.fast}`,
      }}
    >
      <span style={{ ...text, flex: '1 0 0', minWidth: 0, color: color.textStrong }}>
        {item.before}
        <span style={{ color: color.actionPrimary }}>{item.highlight}</span>
        {item.after}
      </span>
      {done ? (
        <span aria-label="Done" role="img" style={{ display: 'inline-flex', flexShrink: 0, color: color.brand500 }}>
          <CheckCircleIcon size={20} />
        </span>
      ) : (
        <img src={`${ASSETS}/progress-ring-0.svg`} alt="" style={{ display: 'block', flexShrink: 0 }} />
      )}
    </Row>
  )
}

export default function EnablementModule({ title = 'Get more from your platform' }) {
  const done = useEnablementDone()

  return (
    <section
      aria-label={title}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 4,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}
    >
      {/* Gradient wash, positioned and flipped as in Figma. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -141.23,
          top: -74,
          width: 1265.603,
          height: 358.615,
          transform: 'rotate(180deg) scaleY(-1)',
          pointerEvents: 'none',
        }}
      >
        <img
          src={`${ASSETS}/checklist-gradient.svg`}
          alt=""
          style={{ position: 'absolute', left: '-18.33%', top: '-64.69%', display: 'block', maxWidth: 'none' }}
        />
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
        <img src={`${ASSETS}/checklist-flag.svg`} alt="" style={{ display: 'block', flexShrink: 0 }} />
        <span style={{ ...text, color: color.actionPrimary }}>{title}</span>
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {CONNECT_ITEMS.map(item => <ChecklistRow key={item.id} item={item} done={done[item.id]} />)}
      </div>
    </section>
  )
}
