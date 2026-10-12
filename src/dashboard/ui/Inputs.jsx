import { useRef } from 'react'
import { CloseCircleIcon, Icon } from './icons'
import { color, shadow, type } from './tokens'

/** Checkbox using the dashboard's checkbox SVGs. `indeterminate` wins over `checked`. */
export function Checkbox({ checked = false, indeterminate = false, onChange, label, disabled = false }) {
  const src = indeterminate
    ? '/dashboard-assets/icons/checkboxIndeterminate.svg'
    : checked ? '/dashboard-assets/icons/checkboxSelected.svg' : '/dashboard-assets/icons/checkboxPassive.svg'
  return (
    <label className="inline-flex items-center gap-[8px]" style={{ position: 'relative', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, fontSize: 14, lineHeight: '20px', color: '#1A2C44' }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange?.(e.target.checked)}
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: 0, height: 0 }}
      />
      <img src={src} alt="" style={{ width: 14, height: 14 }} />
      {label}
    </label>
  )
}

/** Radio button, as drawn in the list-view date filter. Group several with the same `name`. */
export function Radio({ checked = false, onChange, name, value, label, disabled = false }) {
  return (
    <label className="dui-radio-label inline-flex items-center gap-[8px]" style={{ cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, ...type.label, color: color.textStrong }}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange?.(value)}
        className="dui-radio-input"
      />
      <span
        className="dui-radio"
        aria-hidden="true"
        style={{
          width: 14, height: 14, borderRadius: '50%', flexShrink: 0, background: color.surface, boxShadow: shadow.control,
          border: `1px solid ${checked ? color.brand500 : color.neutral100}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 120ms',
        }}
      >
        {checked && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.brand500 }} />}
      </span>
      {label}
    </label>
  )
}

/** Rounded list-page search field with clear button. Controlled. */
export function SearchField({ value, onChange, placeholder = 'Search by name, email, etc.', style }) {
  const inputRef = useRef(null)
  return (
    <div className="dui-search" style={style} onClick={() => inputRef.current?.focus()}>
      <Icon name="search-12" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        className="flex-1 min-w-0 outline-none bg-transparent"
        style={{ height: 28, fontSize: 14, lineHeight: '20px', letterSpacing: '-0.15px', color: '#1A2C44' }}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="search-clear-btn flex items-center justify-center shrink-0 cursor-pointer"
          style={{ width: 28, height: 28, border: 'none', padding: 0, margin: '0 -8px 0 0', borderRadius: 6 }}
          onClick={e => { e.stopPropagation(); onChange?.('') }}
        >
          <CloseCircleIcon />
        </button>
      )}
    </div>
  )
}

/** Labelled text input for forms and dialogs. */
export function TextField({ label, hint, value, onChange, placeholder, type = 'text', style }) {
  return (
    <label className="flex flex-col gap-[4px]" style={style}>
      {label && <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', letterSpacing: '-0.15px', color: '#353A44' }}>{label}</span>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        style={{
          height: 32,
          padding: '0 10px',
          fontSize: 14,
          color: '#1A2C44',
          border: '1px solid #D8DEE4',
          borderRadius: 6,
          outline: 'none',
          boxShadow: '0 1px 0.5px rgba(33,37,44,0.06)',
        }}
        onFocus={e => { e.target.style.borderColor = '#675DFF' }}
        onBlur={e => { e.target.style.borderColor = '#D8DEE4' }}
      />
      {hint && <span style={{ fontSize: 12, lineHeight: '16px', color: '#596171' }}>{hint}</span>}
    </label>
  )
}
