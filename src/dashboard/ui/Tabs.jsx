/**
 * Underline tab bar (Payments / Payouts / Top-ups …). Controlled:
 * pass `value` and `onChange(id)`.
 *
 * tabs: [{ id, label, disabled? }]
 * tone: 'neutral' (dark active tab) | 'brand' (purple active tab — page-level nav)
 */
export function Tabs({ tabs, value, onChange, tone = 'neutral' }) {
  const activeColor = tone === 'brand' ? '#533AFD' : '#1A2C44'
  return (
    <div role="tablist" style={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #EBEEF1', paddingLeft: 2 }}>
      {tabs.map((tab, idx) => {
        const active = tab.id === value
        const color = tab.disabled ? '#BAC8DA' : active ? activeColor : '#6A7383'
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="dui-tab"
            aria-selected={active}
            aria-disabled={tab.disabled || undefined}
            onClick={() => !tab.disabled && onChange?.(tab.id)}
            style={{
              padding: '10px 12px 0',
              marginLeft: idx === 0 ? -11 : 0,
              background: 'transparent',
              border: 'none',
              cursor: tab.disabled ? 'default' : 'pointer',
              fontSize: 14,
              lineHeight: '20px',
              letterSpacing: '-0.15px',
              fontWeight: 600,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-block', position: 'relative', paddingBottom: 10 }}>
              {tab.label}
              {active && !tab.disabled && (
                <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: activeColor, borderRadius: '2px 2px 0 0' }} />
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Saved-view chips (All 100 / Succeeded 70 …). Controlled single-select.
 *
 * chips: [{ id, label, count? }]
 */
export function ViewChips({ chips, value, onChange }) {
  return (
    <div className="flex items-center gap-[8px] flex-wrap" style={{ padding: 2 }}>
      {chips.map(chip => {
        const selected = chip.id === value
        return (
          <button key={chip.id} type="button" className="dui-view-chip" aria-pressed={selected} onClick={() => onChange?.(chip.id)}>
            <span style={{ fontWeight: 600 }}>{chip.label}</span>
            {chip.count != null && <span style={{ fontWeight: 400 }}>{chip.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
