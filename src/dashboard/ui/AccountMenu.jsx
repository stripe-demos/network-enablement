import { useState } from 'react'
import { Popover } from './Pickers'
import { TextField } from './Inputs'
import { AddIcon, BusinessIcon, PersonIcon, SailChevronRightIcon, SailInfoIcon, SandboxIcon, SettingsIcon, SignOutIcon } from './icons'
import { color } from './tokens'

/** Initial on a pale square: the stand-in logo for an account without one. */
export function AccountAvatar({ name, size = 24 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: size >= 32 ? 6 : 4, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: color.neutral25, color: color.subdued,
        fontSize: size >= 32 ? 14 : 12, fontWeight: 600, lineHeight: 1,
      }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

function MenuRow({ icon, label, trailing, onClick, strong }) {
  return (
    <button type="button" role="menuitem" className="dui-menu-item" onClick={onClick} style={{ gap: 12, minHeight: 32, padding: '6px 8px', color: color.text }}>
      <span style={{ width: 24, display: 'inline-flex', justifyContent: 'center', flexShrink: 0, color: color.subdued }}>{icon}</span>
      <span className="truncate" style={{ flex: 1, minWidth: 0, fontWeight: strong ? 600 : 400 }}>{label}</span>
      {trailing && <span style={{ display: 'inline-flex', flexShrink: 0, color: color.subdued }}>{trailing}</span>}
    </button>
  )
}

const Divider = () => <div style={{ height: 1, background: color.neutral50, margin: '4px 0' }} />

/**
 * Account switcher dropdown from the sidebar's account header: the current
 * account up top, account settings, a searchable list of other accounts, and
 * the signed-in user. Controlled like Popover.
 *
 * account:  { name, logo? } (logo is a node; falls back to AccountAvatar)
 * accounts: [{ id?, name }] to switch to
 * user:     signed-in user's name
 */
export function AccountMenu({ anchorRef, open, onClose, account, accounts = [], user, onSelectAccount }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = q ? accounts.filter((a) => a.name.toLowerCase().includes(q)) : accounts
  const close = () => { setQuery(''); onClose() }
  const select = (a) => { onSelectAccount?.(a); close() }

  return (
    <Popover anchorRef={anchorRef} open={open} onClose={close} align="left" gap={4} role="menu" label="Account menu" style={{ width: 320, borderRadius: 8, padding: 0 }}>
      <div className="flex flex-col items-center" style={{ padding: '20px 16px 12px', gap: 8 }}>
        {account.logo ?? <AccountAvatar name={account.name} size={40} />}
        <span style={{ fontSize: 16, fontWeight: 700, lineHeight: '24px', letterSpacing: '-0.3px', color: color.text }}>{account.name}</span>
      </div>
      <div style={{ padding: '0 8px 4px' }}>
        <MenuRow icon={<SettingsIcon />} label="Settings" onClick={close} />
        <MenuRow icon={<SandboxIcon />} label="Switch to sandbox" trailing={<SailChevronRightIcon />} onClick={close} />
      </div>
      <Divider />
      <div style={{ padding: '8px 8px 4px' }}>
        <div style={{ padding: '0 0 6px' }}>
          <TextField placeholder="Search" value={query} onChange={setQuery} />
        </div>
        {matches.map((a) => (
          <MenuRow key={a.id ?? a.name} icon={<AccountAvatar name={a.name} />} label={a.name} onClick={() => select(a)} />
        ))}
        {!matches.length && <div style={{ padding: '6px 8px', fontSize: 14, lineHeight: '20px', color: color.subdued }}>No accounts found</div>}
      </div>
      <Divider />
      <div style={{ padding: '0 8px' }}>
        <MenuRow icon={<BusinessIcon />} label="Other accounts" trailing={<SailChevronRightIcon />} onClick={close} />
        <MenuRow icon={<AddIcon />} label="Create account" onClick={close} />
      </div>
      <Divider />
      <div style={{ padding: '0 8px 4px' }}>
        <MenuRow icon={<PersonIcon />} label={user} trailing={<SailInfoIcon />} onClick={close} />
        <MenuRow icon={<SignOutIcon />} label="Sign out" onClick={close} />
      </div>
    </Popover>
  )
}
