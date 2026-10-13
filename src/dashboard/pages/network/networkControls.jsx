// Shared building blocks for the Stripe network onboarding steps, matching the
// Dashboard visual refresh frames in Figma (Modal / 86 and 87: nodes 42511:19224
// and 42523:20156). Font stays the Dashboard's SF Pro; sizes, weights and colors
// follow Figma.
import { useState } from 'react'
import { ink, text } from './networkTokens'

const ASSETS = '/dashboard-assets/network'

/** Two-tone step heading: a semibold title followed by a gray sentence (Modal / 87). */
export function StepHeading({ title, children }) {
  return (
    <h1 style={{ margin: 0, fontSize: 20, lineHeight: '28px', letterSpacing: -0.2, fontWeight: 400, color: ink.secondary }}>
      <span style={{ fontWeight: 600, color: ink.primary }}>{title}</span>
      {children && <> {children}</>}
    </h1>
  )
}

/** 16px checkbox: near-black when checked, light outline when not (Modal / 86). */
export function CheckboxBox({ checked }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: 16,
        height: 16,
        boxSizing: 'border-box',
        padding: 1,
        borderRadius: 4,
        background: checked ? ink.strong : '#FFFFFF',
        border: checked ? 'none' : '1px solid #E1E5E5',
      }}
    >
      {checked && <img src={`${ASSETS}/checkmark.svg`} alt="" width="8" height="8" style={{ display: 'block' }} />}
    </span>
  )
}

/** 14px radio: brand fill with a white dot when selected (Modal / 87). */
export function RadioDot({ checked }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 20, height: 20 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          boxSizing: 'border-box',
          borderRadius: 9999,
          background: checked ? ink.brand : '#FFFFFF',
          border: `1px solid ${checked ? '#675DFF' : '#D8DEE4'}`,
          boxShadow: checked ? '0px 1px 1px 0px rgba(10,33,86,0.16)' : '0px 1px 1px 0px rgba(33,37,44,0.16)',
        }}
      >
        {checked && <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#FFFFFF' }} />}
      </span>
    </span>
  )
}

/**
 * Selectable row ("Choicebox" / "Radio Item"). Renders a native, visually hidden
 * input so keyboard and screen readers work; the visual control sits on the right
 * for checkboxes (Modal / 86) and on the left for radios (Modal / 87).
 *   type      'checkbox' | 'radio'
 *   name      radio group name
 *   leading   optional node before the text (e.g. a 72px icon tile)
 */
export function ChoiceRow({ type = 'checkbox', name, checked, onChange, title, description, leading, disabled }) {
  const isRadio = type === 'radio'
  const selectedBorder = isRadio ? ink.brand : ink.divider
  return (
    <label
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: isRadio || !description ? 'flex-start' : 'center',
        gap: isRadio ? 8 : 16,
        width: '100%',
        boxSizing: 'border-box',
        padding: leading ? '8px 16px 8px 8px' : isRadio ? 12 : 16,
        background: '#FFFFFF',
        border: `1px solid ${checked ? selectedBorder : ink.divider}`,
        borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={e => onChange?.(e.target.checked)}
        className="sr-only"
      />
      {isRadio && <RadioDot checked={checked} />}
      {leading}
      <span style={{ flex: '1 0 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={leading ? text.title : text.bodyEmphasized}>{title}</span>
        {description && <span style={text.body}>{description}</span>}
      </span>
      {!isRadio && <span style={{ paddingTop: 2, display: 'flex' }}><CheckboxBox checked={checked} /></span>}
    </label>
  )
}

/** Tinted group that wraps recommended choices (Modal / 86 "Recommended based on your business"). */
export function RecommendedGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 4, background: ink.brandTint, borderRadius: 8 }}>
      <div style={{ ...text.link, padding: '8px 12px' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  )
}

/** Section label row with an optional right-aligned link (Modal / 86 "Popular Stripe products · View more"). */
export function SectionLabel({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '24px 0 8px' }}>
      <span style={{ ...text.body, flex: '1 0 0', color: ink.strong }}>{children}</span>
      {action}
    </div>
  )
}

const FIELD_BORDER = '#D3DEE9'
const FOCUS_RING = '0 0 0 3px rgba(83,58,253,0.16)'

/**
 * 40px search field. Escape clears a non-empty value and calls preventDefault()
 * so a surrounding dialog stays open; with an empty value Escape passes through.
 */
export function SearchInput({ id, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      id={id}
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Escape' && value) {
          e.preventDefault()
          onChange('')
        }
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      autoComplete="off"
      style={{
        width: '100%',
        height: 40,
        boxSizing: 'border-box',
        padding: '0 12px',
        border: `1px solid ${focused ? ink.brand : FIELD_BORDER}`,
        borderRadius: 8,
        boxShadow: focused ? FOCUS_RING : 'none',
        outline: 'none',
        background: '#FFFFFF',
        fontFamily: 'inherit',
        ...text.body,
        color: ink.primary,
      }}
    />
  )
}

function chipStyle(active, focused) {
  return {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 28,
    boxSizing: 'border-box',
    padding: '0 10px',
    border: `1px ${active ? 'solid' : 'dashed'} ${active ? ink.secondary : FIELD_BORDER}`,
    borderRadius: 9999,
    background: '#FFFFFF',
    boxShadow: focused ? FOCUS_RING : 'none',
    ...text.body,
    fontSize: 12,
    lineHeight: '16px',
    color: ink.primary,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  }
}

/**
 * Filter chip with a transparent native <select> laid over it, so the option
 * list is the browser's own and opens above any dialog. Shows "Label" when
 * empty and "Label: Value" when set.
 *   options  [{ value, label }]; value '' means no filter
 */
export function FilterSelect({ label, value, onChange, options, allLabel }) {
  const [focused, setFocused] = useState(false)
  const current = options.find(o => o.value === value)
  return (
    <span style={chipStyle(Boolean(value), focused)}>
      <span>
        {label}
        {current && <span style={{ color: ink.brand }}>{`: ${current.label}`}</span>}
      </span>
      <svg aria-hidden="true" width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
        <path d="M1 2.5 4 5.5 7 2.5" fill="none" stroke={ink.secondary} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
      >
        <option value="">{allLabel ?? `Any ${label.toLowerCase()}`}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </span>
  )
}

/** On/off filter chip, styled to sit in a row of FilterSelects. */
export function FilterToggle({ label, pressed, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...chipStyle(pressed, focused), outline: 'none', fontFamily: 'inherit' }}
    >
      {pressed && (
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
          <path d="M2 5.2 4 7.2 8 2.8" fill="none" stroke={ink.brand} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span style={{ color: pressed ? ink.brand : ink.primary }}>{label}</span>
    </button>
  )
}

/** Inline text button styled as a link (no navigation). */
export function TextButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...text.link, padding: 0, border: 0, background: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
    >
      {children}
    </button>
  )
}
