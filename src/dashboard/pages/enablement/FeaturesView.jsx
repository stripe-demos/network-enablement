// Enablement › Features — which Dashboard features connected accounts can use.
// Ported from unbundle-connect's DashboardControls FeaturesView.
import { Fragment, useState } from 'react'
import { color, Divider, Icon, InvoiceIcon, SailInfoIcon, Switch, TextLink, type } from '@dashboard/ui'

const DEFAULT_FEATURE_STATE = {
  'view-payments': true,
  'issue-refunds': false,
  'manage-disputes': false,
  'smart-disputes': true,
  'manual-payouts': false,
  'edit-payout-schedule': false,
  'top-up-refunds-balance': false,
  reports: true,
  'close-account': true,
  'collect-eventually-due': false,
}

const inlineLink = (label) => <TextLink style={{ fontSize: 13 }}>{label}</TextLink>

const SECTIONS = [
  {
    id: 'payments',
    title: 'Payments',
    icon: <span style={{ display: 'inline-flex', color: color.subdued }}><InvoiceIcon size={14} /></span>,
    payments: true,
    rows: [
      { id: 'view-payments', title: 'View payments', description: 'Allow connected accounts to view the payments tab and additional information such as payment method details and fees.' },
      { id: 'issue-refunds', title: 'Issue refunds', nested: true, showInfo: true, description: 'Allow connected accounts to issue refunds to customers.' },
      { id: 'manage-disputes', title: 'Manage disputes', nested: true, showInfo: true, description: 'Allow connected accounts to view and manage disputed payments.' },
      {
        id: 'smart-disputes',
        title: 'Smart Disputes',
        nested: true,
        description: <>Allow connected accounts to submit a response with Smart Disputes. You can change your {inlineLink('auto-respond settings')}.</>,
      },
    ],
  },
  {
    id: 'balance',
    title: 'Balance',
    icon: <Icon name="balance" size={14} />,
    rows: [
      {
        id: 'manual-payouts',
        title: 'Manual payouts',
        description: <>Allow connected accounts to initiate standard payouts to their bank account or debit card when their automatic payout schedule is set to {inlineLink('manual')}.</>,
      },
      {
        id: 'edit-payout-schedule',
        title: 'Edit payout schedule',
        description: <>Allow connected accounts to enable or disable automatic payouts and adjust their {inlineLink('schedule')}.</>,
      },
      { id: 'top-up-refunds-balance', title: 'Top up refunds and disputes balance', showInfo: true, description: 'Allow connected accounts to add funds to the refunds and disputes balance.' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <Icon name="barChart12" size={14} />,
    rows: [
      { id: 'reports', title: 'Reports', description: 'Allow connected accounts to view and download balance summary and payout reconciliation reports.' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    icon: <Icon name="person" size={14} />,
    rows: [
      { id: 'close-account', title: 'Close account', description: 'Allow connected accounts to close their account if they have no existing disputes or balances.' },
    ],
  },
  {
    id: 'requirements',
    title: 'Requirements',
    icon: <Icon name="clipboard12" size={14} />,
    rows: [
      { id: 'collect-eventually-due', title: 'Collect eventually due requirements', description: 'Allow connected accounts to see and submit missing eventually due requirements.' },
    ],
  },
]

function FeatureRow({ title, description, nested, showInfo, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: nested ? 24 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={type.label}>{title}</span>
          {showInfo && <span style={{ display: 'inline-flex', color: color.subdued }}><SailInfoIcon size={12} /></span>}
        </div>
        <div style={{ ...type.bodySmall, color: color.subdued }}>
          {description} {inlineLink('Preview')}
        </div>
      </div>
      <Switch label={title} hideLabel checked={checked} onChange={onChange} />
    </div>
  )
}

export default function FeaturesView({ showPaymentFeatures = true }) {
  const [features, setFeatures] = useState(DEFAULT_FEATURE_STATE)
  const setFeature = (id) => (checked) => setFeatures(current => ({ ...current, [id]: checked }))
  const sections = SECTIONS.filter(s => showPaymentFeatures || !s.payments)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 16 }}>
      {sections.map((section, i) => (
        <Fragment key={section.id}>
          {i > 0 && <Divider />}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {section.icon}
              <h3 style={{ ...type.label, fontWeight: 700 }}>{section.title}</h3>
            </div>
            {section.rows.map(row => (
              <FeatureRow key={row.id} {...row} checked={features[row.id]} onChange={setFeature(row.id)} />
            ))}
          </section>
        </Fragment>
      ))}
    </div>
  )
}
