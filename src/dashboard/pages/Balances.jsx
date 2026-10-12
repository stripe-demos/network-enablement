// Balances — built entirely from the shared component library (@dashboard/ui).
// Use this file as a template when starting a new dashboard page.
import { useMemo, useState } from 'react'
import {
  Button, Card, CardFooterLink, CardGrid, CardHeader, CardMetric, DataTable, Drawer, FadeSlideIn, FilterPill, FilterPillValue,
  Icon, IconButton, KeyValueList, Legend, LineChart, Menu, MeterBar, PageHeader, SectionHeader,
  Stat, StatusBadge, Tabs, TextField, TextLink, Tooltip, ViewChips, Divider, useToast,
} from '@dashboard/ui'

const ACTIVITY = [
  { id: 'po_1', type: 'Payout', amount: '-$11,633.07', status: 'In transit', description: 'STRIPE PAYOUT · Chase ••••6789', date: 'Oct 5, 9:00 AM' },
  { id: 'ch_1', type: 'Charge', amount: '$2,400.00', status: 'Available', description: 'API credits purchase', date: 'Oct 4, 6:00 PM' },
  { id: 'ch_2', type: 'Charge', amount: '$480.00', status: 'Pending', description: 'Team subscription', date: 'Oct 4, 3:12 PM' },
  { id: 're_1', type: 'Refund', amount: '-$72.00', status: 'Refunded', description: 'Subscription renewal — Pro', date: 'Oct 4, 11:30 AM' },
  { id: 'po_2', type: 'Payout', amount: '-$9,812.44', status: 'Paid', description: 'STRIPE PAYOUT · Chase ••••6789', date: 'Oct 3, 9:00 AM' },
  { id: 'ch_3', type: 'Charge', amount: '$19,200.00', status: 'Available', description: 'Enterprise annual license', date: 'Oct 2, 3:00 PM' },
  { id: 'dp_1', type: 'Dispute', amount: '-$340.00', status: 'Disputed', description: 'Chargeback · fraudulent', date: 'Oct 2, 8:30 AM' },
  { id: 'po_3', type: 'Payout', amount: '-$7,410.10', status: 'Paid', description: 'STRIPE PAYOUT · Chase ••••6789', date: 'Oct 1, 9:00 AM' },
]

const VIEWS = [
  { id: 'all', label: 'All', filter: () => true },
  { id: 'payouts', label: 'Payouts', filter: r => r.type === 'Payout' },
  { id: 'charges', label: 'Charges', filter: r => r.type === 'Charge' },
  { id: 'adjustments', label: 'Refunds & disputes', filter: r => r.type === 'Refund' || r.type === 'Dispute' },
]

export default function Balances() {
  const toast = useToast()
  const [currency, setCurrency] = useState('usd')
  const [view, setView] = useState('all')
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [amount, setAmount] = useState('9,257.51')

  const rows = useMemo(() => ACTIVITY.filter(VIEWS.find(v => v.id === view).filter), [view])
  const chips = VIEWS.map(v => ({ id: v.id, label: v.label, count: ACTIVITY.filter(v.filter).length }))

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader
        title="Balances"
        actions={
          <>
            <Tooltip label="Export"><IconButton label="Export" icon={<Icon name="export12" />} onClick={() => toast('Export started')} /></Tooltip>
            <Menu
              trigger={<IconButton label="More" icon={<Icon name="more12" />} />}
              items={[
                { label: 'Manage payout schedule', onSelect: () => toast('Payout schedule') },
                { label: 'View bank accounts', onSelect: () => toast('Bank accounts') },
                { label: 'Add funds', group: 'Balance', onSelect: () => toast('Add funds') },
              ]}
            />
            <Button variant="primary" onClick={() => setPayoutOpen(true)}>Pay out funds</Button>
          </>
        }
      />

      <div style={{ marginTop: 8 }}>
        <Tabs
          value={currency}
          onChange={setCurrency}
          tabs={[{ id: 'usd', label: 'USD' }, { id: 'eur', label: 'EUR' }, { id: 'gbp', label: 'GBP', disabled: true }]}
        />
      </div>

      <FadeSlideIn transitionKey={currency}>
      {/* Summary */}
      <div className="flex gap-[40px]" style={{ marginTop: 32 }}>
        <Stat style={{ width: 220 }} label="Total balance" value={currency === 'usd' ? '$20,890.58' : '€4,120.00'} caption="Across all sources" />
        <Divider vertical />
        <Stat style={{ width: 220 }} label="Available to pay out" value={currency === 'usd' ? '$9,257.51' : '€3,880.00'} caption="Ready now" action={<TextLink onClick={() => setPayoutOpen(true)}>Pay out</TextLink>} />
        <Divider vertical />
        <Stat style={{ width: 220 }} label="Incoming" value={currency === 'usd' ? '$11,633.07' : '€240.00'} caption="Expected Oct 7" size="md" />
      </div>

      <div className="flex items-center gap-[6px]" style={{ marginTop: 40 }}>
        <FilterPill chevron><FilterPillValue label="Date range" value="Last 30 days" /></FilterPill>
        <FilterPill chevron>Daily</FilterPill>
      </div>

      <CardGrid columns={3} style={{ marginTop: 16 }}>
        <Card>
          <CardHeader title="Balance composition" />
          <div style={{ marginTop: 16 }}>
            <MeterBar segments={[{ value: 44 }, { value: 30 }, { value: 18 }, { value: 8 }]} />
            <div style={{ marginTop: 16 }}>
              <Legend items={[
                { label: 'Available', value: '$9,257.51' },
                { label: 'Pending', value: '$6,240.00' },
                { label: 'In transit', value: '$3,720.00' },
                { label: 'Reserved', value: '$1,673.07' },
              ]} />
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Payouts" />
          <CardMetric value="$28,855.61" delta="+6.4%" />
          <div style={{ marginTop: 12 }}>
            <LineChart data={[4, 6, 5, 8, 7, 10, 12]} compareData={[3, 4, 4, 5, 6, 6, 7]} yLabels={['$12k', '$9k', '$6k', '$3k', '0']} xStart="Sep 5" xEnd="Oct 5" height={140} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Upcoming payouts" info={false} />
          <KeyValueList
            style={{ marginTop: 12 }}
            rows={[
              { label: 'Oct 7', meta: 'Chase ••••6789', value: '$11,633.07' },
              { label: 'Oct 8', meta: 'Chase ••••6789', value: '$6,240.00' },
              { label: 'Oct 9', meta: 'Chase ••••6789', value: '$3,720.00' },
            ]}
          />
          <CardFooterLink onClick={() => toast('Payout schedule')}>View payout schedule</CardFooterLink>
        </Card>
      </CardGrid>

      <SectionHeader title="Recent activity" divider={false} style={{ marginTop: 48, marginBottom: 12 }} />
      <ViewChips value={view} onChange={setView} chips={chips} />
      <div style={{ marginTop: 16 }}>
        <DataTable
          columns={[
            { id: 'amount', label: 'Amount', align: 'right', type: 'currency', width: 140 },
            { id: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
            { id: 'type', label: 'Type' },
            { id: 'description', label: 'Description' },
            { id: 'date', label: 'Date', type: 'muted' },
          ]}
          rows={rows}
          onRowClick={r => toast(`Opened ${r.id}`)}
        />
      </div>
      </FadeSlideIn>

      <Drawer
        open={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        title="Pay out funds"
        footer={
          <>
            <Button onClick={() => setPayoutOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { setPayoutOpen(false); toast(`Payout of $${amount} created`) }}>Pay out</Button>
          </>
        }
      >
        <div className="flex flex-col gap-[16px]">
          <Stat label="Available to pay out" value="$9,257.51" />
          <TextField label="Amount" value={amount} onChange={setAmount} hint="Arrives in 1–2 business days." />
          <TextField label="Destination" value="Chase ••••6789" onChange={() => {}} />
        </div>
      </Drawer>
    </div>
  )
}
