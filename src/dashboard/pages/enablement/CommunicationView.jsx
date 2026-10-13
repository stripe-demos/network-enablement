// Enablement › Communication — which emails connected accounts receive.
// Ported from unbundle-connect's DashboardControlsSettingsPanel.
import { useState } from 'react'
import { color, Switch, type } from '@dashboard/ui'

const SETTINGS = [
  { id: 'payment-receipts', label: 'Payment receipts', help: 'Send receipts when connected accounts collect a payment.', defaultChecked: true },
  { id: 'payout-notifications', label: 'Payout notifications', help: 'Email connected accounts when a payout is sent.', defaultChecked: true },
  { id: 'account-status', label: 'Account status emails', help: 'Notify connected accounts about restriction and verification changes.', defaultChecked: false },
]

export default function CommunicationView() {
  const [values, setValues] = useState(() => Object.fromEntries(SETTINGS.map(s => [s.id, s.defaultChecked])))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 24, paddingBottom: 24 }}>
      <h3 style={{ ...type.label, fontWeight: 700 }}>Communication</h3>
      <p style={{ ...type.bodySmall, color: color.subdued }}>Choose which emails connected accounts receive from this Dashboard.</p>
      {SETTINGS.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={type.label}>{s.label}</span>
            <span style={{ ...type.bodySmall, color: color.subdued }}>{s.help}</span>
          </div>
          <Switch
            label={s.label}
            hideLabel
            checked={values[s.id]}
            onChange={checked => setValues(current => ({ ...current, [s.id]: checked }))}
          />
        </div>
      ))}
    </div>
  )
}
