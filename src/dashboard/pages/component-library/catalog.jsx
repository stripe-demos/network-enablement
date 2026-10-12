/* eslint-disable react-refresh/only-export-components */
// Entries rendered by the /components gallery. Adding a component to the
// library? Add an entry here so teammates can find it.
//
// { id, name, category, description, demo: () => JSX, code, props?: [[name, description]] }

import { useCallback, useRef, useState } from 'react'
import {
  AccountMenu, AppIcon, AppListItem, AppsIcon, LinkListItem, Popover, StarIcon, AddIcon, BusinessIcon, EditIcon, PersonIcon, SandboxIcon, SettingsIcon, SignOutIcon, SailChevronRightIcon, SailInfoIcon,
  ActionMenu, NotificationsMenu, InvoiceIcon, SubscriptionIcon, DocumentIcon, LinkIcon, PayoutIcon,
  ChevronUpCircleIcon, ExplorerIcon, TransferIcon, WarningIcon, WebhookIcon,
  Badge, Button, Card, CardFooterLink, CardGrid, ChartHoverCard, ConsoleIcon, DashboardThinkingIcon, ScrollArea, CardHeader, CardMetric, Checkbox, Collapse, DataTable, DateRangePicker, Drawer, FadeSlideIn,
  DatePicker, SelectMenu, StatDropdown, formatDateRange, formatShortDate, getPresetRange,
  EmptyState, FilterPill, FilterPillValue, FOCUS_TRACE_SPEEDS, FocusTrace, Icon, IconButton, ICON_NAMES, InfoIcon, KeyValueList,
  Legend, LineChart, LiveDot, Menu, MeterBar, OverflowMenu, PageHeader, PlusCircleIcon, PlusIcon, SearchField,
  Radio, SectionHeader, SelectButton, Sparkline, Stat, StatusBadge, Tabs, TextField, TextLink, Toast,
  Tooltip, ViewChips, Well, color, setConsoleIconVariant, status, type, useConsoleIconVariant, useDashboardConsole, useToast,
} from '@dashboard/ui'

export const CATEGORIES = ['Foundations', 'Actions', 'Inputs', 'Navigation', 'Data display', 'Charts', 'Layout', 'Overlays', 'Patterns']

function Swatch({ name, value }) {
  return (
    <div className="flex items-center gap-[8px]" style={{ width: 200 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: value, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: color.text }}>{name}</div>
        <div style={{ fontSize: 12, color: color.subdued, fontFamily: 'ui-monospace, monospace' }}>{value}</div>
      </div>
    </div>
  )
}

function PopoverDemo() {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button ref={ref} chevron onClick={() => setOpen(o => !o)}>Open popover</Button>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} motion="slide" gap={8} label="Example" style={{ width: 280, padding: 16, borderRadius: 12 }}>
        <div style={{ ...type.label, marginBottom: 4 }}>Popover</div>
        <div style={{ ...type.body, color: color.subdued }}>Slides down 8px over 200ms with an ease-in-out curve, and reverses on close.</div>
      </Popover>
    </>
  )
}

function AccountMenuDemo() {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button ref={ref} chevron onClick={() => setOpen(o => !o)}>Rocketrides</Button>
      <AccountMenu anchorRef={ref} open={open} onClose={() => setOpen(false)}
        account={{ name: 'Rocketrides' }} accounts={[{ name: 'Cactus Practice' }, { name: 'Lemon Squeezy' }]} user="Kevin Yien" />
    </>
  )
}

function ActionMenuDemo() {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button ref={ref} icon={<AddIcon size={12} />} onClick={() => setOpen(o => !o)}>Create</Button>
      <ActionMenu anchorRef={ref} open={open} onClose={() => setOpen(false)} label="Create" items={[
        { label: 'Invoice', icon: <InvoiceIcon />, shortcut: ['c', 'i'] },
        { label: 'Subscription', icon: <SubscriptionIcon />, shortcut: ['c', 's'] },
        { label: 'Payment link', icon: <LinkIcon />, shortcut: ['c', 'l'] },
      ]} />
    </>
  )
}

function NotificationsMenuDemo() {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button ref={ref} onClick={() => setOpen(o => !o)}>Notifications</Button>
      <NotificationsMenu anchorRef={ref} open={open} onClose={() => setOpen(false)} notifications={[
        { id: 'a', kind: 'action', title: 'Respond to a dispute by Oct 14', body: 'Submit evidence before the deadline to contest it.', time: '3h ago' },
        { id: 'b', kind: 'update', title: 'Your payout is on its way', body: 'It should arrive in your bank account on Oct 8.', time: '2h ago' },
      ]} />
    </>
  )
}

function TabsDemo() {
  const [tab, setTab] = useState('payments')
  return (
    <Tabs
      value={tab}
      onChange={setTab}
      tabs={[
        { id: 'payments', label: 'Payments' },
        { id: 'payouts', label: 'Payouts' },
        { id: 'top-ups', label: 'Top-ups' },
        { id: 'all', label: 'All activity' },
        { id: 'soon', label: 'Coming soon', disabled: true },
      ]}
    />
  )
}

function FadeSlideInDemo() {
  const [tab, setTab] = useState('payments')
  return (
    <div style={{ width: 360 }}>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'payments', label: 'Payments' }, { id: 'payouts', label: 'Payouts' }]} />
      <FadeSlideIn transitionKey={tab} style={{ marginTop: 16 }}>
        <Stat label={tab === 'payments' ? 'Gross volume' : 'Paid out'} value={tab === 'payments' ? '$406.39' : '$28,855.61'} caption="Last 7 days" />
      </FadeSlideIn>
    </div>
  )
}

function LiveDotDemo() {
  const [n, setN] = useState(0)
  return (
    <div className="flex items-center gap-[24px]">
      <div style={{ position: 'relative', width: 80, height: 40 }}>
        <LiveDot pulseKey={n} style={{ left: '50%', top: '50%' }} />
      </div>
      <Button onClick={() => setN((v) => v + 1)}>Pulse</Button>
    </div>
  )
}

function CollapseDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ width: 240 }}>
      <Button onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'Show'} products</Button>
      <Collapse open={open}>
        <div className="flex flex-col gap-[4px]" style={{ paddingTop: 8, ...type.body }}>
          {['Link', 'Tax', 'Identity', 'Issuing'].map((p) => <span key={p}>{p}</span>)}
        </div>
      </Collapse>
    </div>
  )
}

function ViewChipsDemo() {
  const [view, setView] = useState('all')
  return (
    <ViewChips
      value={view}
      onChange={setView}
      chips={[
        { id: 'all', label: 'All', count: 100 },
        { id: 'succeeded', label: 'Succeeded', count: 70 },
        { id: 'refunded', label: 'Refunded', count: 10 },
        { id: 'disputed', label: 'Disputed', count: 0 },
      ]}
    />
  )
}

function FilterPillsDemo() {
  const [compare, setCompare] = useState(true)
  return (
    <div className="flex items-center gap-[6px]">
      <FilterPill chevron><FilterPillValue label="Date range" value="Last 7 days" /></FilterPill>
      <FilterPill chevron><FilterPillValue value="Daily" /></FilterPill>
      {compare
        ? <FilterPill chevron onClear={() => setCompare(false)} clearLabel="Remove comparison"><FilterPillValue label="Compare" value="Previous period" /></FilterPill>
        : <FilterPill icon={<PlusCircleIcon />} chevron onClick={() => setCompare(true)}>Compare</FilterPill>}
      <FilterPill active>Active</FilterPill>
    </div>
  )
}

function SelectMenuDemo() {
  const [value, setValue] = useState('daily')
  const options = [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]
  return (
    <SelectMenu
      label="Interval"
      value={value}
      options={options}
      onChange={setValue}
      trigger={<FilterPill chevron><FilterPillValue value={options.find((o) => o.value === value).label} /></FilterPill>}
    />
  )
}

function DateRangePickerDemo() {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState(() => getPresetRange('last4weeks'))
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <FilterPill ref={ref} chevron aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <FilterPillValue label="Date range" value={formatDateRange(range)} />
      </FilterPill>
      <DateRangePicker anchorRef={ref} open={open} onClose={close} value={range} onApply={setRange} />
    </>
  )
}

function StatDropdownDemo() {
  const [metric, setMetric] = useState('gross')
  const options = [{ value: 'gross', label: 'Gross volume' }, { value: 'net', label: 'Net volume' }]
  return (
    <Stat
      label={<SelectMenu label="Metric" value={metric} options={options} onChange={setMetric} trigger={<StatDropdown>{options.find((o) => o.value === metric).label}</StatDropdown>} />}
      value={metric === 'gross' ? '$452.80' : '$406.39'}
      caption="2:00 PM"
    />
  )
}

function DatePickerDemo() {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1) })
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <span style={type.label}>
        <StatDropdown ref={ref} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{formatShortDate(day)}</StatDropdown>
      </span>
      <DatePicker anchorRef={ref} open={open} onClose={close} value={day} onChange={setDay} />
    </>
  )
}

function SearchDemo() {
  const [q, setQ] = useState('')
  return <SearchField value={q} onChange={setQ} style={{ width: 420 }} />
}

function CheckboxDemo() {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <div className="flex items-center gap-[24px]">
      <Checkbox checked={a} onChange={setA} label="Checked" />
      <Checkbox checked={b} onChange={setB} label="Unchecked" />
      <Checkbox indeterminate label="Indeterminate" />
      <Checkbox disabled label="Disabled" />
    </div>
  )
}

function RadioDemo() {
  const [tz, setTz] = useState('GMT-8')
  return (
    <div className="flex items-center gap-[24px]">
      {['GMT-8', 'UTC'].map((v) => <Radio key={v} name="radio-demo" value={v} checked={tz === v} onChange={setTz} label={v} />)}
      <Radio disabled name="radio-demo-disabled" value="off" label="Disabled" />
    </div>
  )
}

function TextFieldDemo() {
  const [v, setV] = useState('')
  return <TextField label="Customer email" placeholder="jenny@example.com" hint="We'll send the receipt here." value={v} onChange={setV} style={{ width: 320 }} />
}

const TABLE_ROWS = [
  { id: 'py_1', amount: '$20.00', status: 'Succeeded', description: 'API usage', customer: 'jenny.rosen@example.com', date: 'Jun 26, 2:30 AM' },
  { id: 'py_2', amount: '$480.00', status: 'Failed', description: 'Team subscription', customer: 'priya@example.com', date: 'Jun 25, 8:00 PM' },
  { id: 'py_3', amount: '$2,400.00', status: 'Pending', description: 'Credits purchase', customer: 'accounts@test.com', date: 'Jun 25, 6:00 PM' },
  { id: 'py_4', amount: '$72.00', status: 'Refunded', description: 'Renewal — Pro', customer: 'admin@example.com', date: 'Jun 25, 11:30 AM' },
]

function DataTableDemo() {
  const [selected, setSelected] = useState(new Set())
  const toast = useToast()
  return (
    <DataTable
      selectable
      selected={selected}
      onSelectedChange={setSelected}
      onRowClick={row => toast(`Clicked ${row.id}`)}
      columns={[
        { id: 'amount', label: 'Amount', align: 'right', type: 'currency' },
        { id: 'status', label: 'Status', type: 'status' },
        { id: 'description', label: 'Description' },
        { id: 'customer', label: 'Customer' },
        { id: 'date', label: 'Date', type: 'muted' },
      ]}
      rows={TABLE_ROWS}
    />
  )
}

function ToastDemo() {
  const toast = useToast()
  return (
    <div className="flex items-center gap-[16px]">
      <Button onClick={() => toast('Changes saved to "All"')}>Show toast</Button>
      <Toast inline>Changes saved to "All"</Toast>
    </div>
  )
}

function CardMenuDemo() {
  const { askConsole } = useDashboardConsole()
  return (
    <div className="flex items-start gap-[24px]">
      <OverflowMenu label="More options" items={[{ label: 'Rename' }, { label: 'Duplicate' }, { divider: true }, { label: 'Archive' }]} />
      <div style={{ width: 360 }}>
        <Card
          bordered
          menuLabel="Gross volume"
          menu={[
            { label: 'Ask Console', onSelect: () => askConsole({ prompt: "What's driving gross volume over the last 7 days?", card: 'grossVolume' }) },
            { divider: true },
            { label: 'Open chart detail' },
            { label: 'Analyze with Sigma' },
          ]}
        >
          <CardHeader title="Gross volume" />
          <CardMetric value="$160k" delta="+1.2%" />
        </Card>
      </div>
    </div>
  )
}

function DashboardConsoleLinkDemo() {
  const { openConsole, askConsole } = useDashboardConsole()
  return (
    <div className="flex items-center gap-[8px]">
      <Button onClick={openConsole}>Open Console</Button>
      <Button onClick={() => askConsole({ prompt: 'Show me failed payments I should retry' })}>Ask with a prompt</Button>
      <Button onClick={() => askConsole({ prompt: 'Why are payments failing over the last 7 days?', card: 'failedPayments' })}>Ask about a card</Button>
    </div>
  )
}

function FocusTraceDemo() {
  const [speed, setSpeed] = useState('loop')
  const [run, setRun] = useState(0)
  const pick = (id) => { setSpeed(id); setRun((n) => n + 1) }
  return (
    <div className="flex flex-col gap-[12px]">
      <ViewChips
        chips={Object.entries(FOCUS_TRACE_SPEEDS).map(([id, { duration, loops }]) => ({
          id, label: id[0].toUpperCase() + id.slice(1), count: `${duration / 1000}s${Number.isFinite(loops) ? '' : ' ∞'}`,
        }))}
        value={speed}
        onChange={pick}
      />
      <div className="flex items-center gap-[16px]">
        <div style={{ position: 'relative', width: 280, height: 72, borderRadius: 8, border: `1px solid ${color.neutral50}`, display: 'flex', alignItems: 'center', padding: '0 16px', ...type.body }}>
          $480.00 payment from Priya Nair
          <FocusTrace key={run} active speed={speed} radius={8} />
        </div>
        <Button onClick={() => setRun((n) => n + 1)}>Replay</Button>
      </div>
    </div>
  )
}

function ConsoleIconDemo() {
  const [slow, setSlow] = useState(false)
  const [thinking, setThinking] = useState(true)
  const inUse = useConsoleIconVariant()
  const pace = { '--dui-console-icon-pace': slow ? 4 : 1 }
  const tile = (label, el, dark = false) => (
    <div className="flex flex-col items-center gap-[8px]">
      <div className="flex items-center justify-center" style={{ width: 88, height: 88, borderRadius: 8, border: `1px solid ${dark ? color.consoleBlob.night : color.neutral50}`, background: dark ? color.consoleBlob.night : undefined, color: color.textStrong }}>{el}</div>
      <span style={{ fontSize: 12, color: color.subdued }}>{label}</span>
    </div>
  )
  const pick = (variant, label) => (
    <Radio name="console-icon-variant" value={variant} checked={inUse === variant} onChange={setConsoleIconVariant} label={`variant="${variant}" · ${label}${inUse === variant ? ' · in use' : ''}`} />
  )
  return (
    <div className="flex flex-col gap-[20px]">
      <span style={type.caption}>Pick the variant every Console icon in the prototype uses (saved in this browser).</span>
      <div className="flex flex-col gap-[8px]">
        {pick('cube', 'fold + Rubik\'s cube turns')}
        <div className="flex items-end gap-[16px]">
          {tile('8px', <ConsoleIcon variant="cube" size={8} style={pace} />)}
          {tile('16px', <ConsoleIcon variant="cube" size={16} style={pace} />)}
          {tile('24px', <ConsoleIcon variant="cube" size={24} style={pace} />)}
          {tile('8px · thinking', <ConsoleIcon variant="cube" size={8} thinking={thinking} style={pace} />)}
          {tile('16px · thinking', <ConsoleIcon variant="cube" size={16} thinking={thinking} style={pace} />)}
          {tile('24px · thinking', <ConsoleIcon variant="cube" size={24} thinking={thinking} style={pace} />)}
          {tile('64px · inspect', <ConsoleIcon variant="cube" size={64} style={pace} />)}
          {tile('64px · thinking', <ConsoleIcon variant="cube" size={64} thinking={thinking} style={pace} />)}
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        {pick('base', 'fold only')}
        <div className="flex items-end gap-[16px]">
          {tile('8px', <ConsoleIcon variant="base" size={8} style={pace} />)}
          {tile('16px', <ConsoleIcon variant="base" size={16} style={pace} />)}
          {tile('24px', <ConsoleIcon variant="base" size={24} style={pace} />)}
          {tile('8px · thinking', <ConsoleIcon variant="base" size={8} thinking={thinking} style={pace} />)}
          {tile('16px · thinking', <ConsoleIcon variant="base" size={16} thinking={thinking} style={pace} />)}
          {tile('24px · thinking', <ConsoleIcon variant="base" size={24} thinking={thinking} style={pace} />)}
          {tile('64px · inspect', <ConsoleIcon variant="base" size={64} style={pace} />)}
          {tile('64px · thinking', <ConsoleIcon variant="base" size={64} thinking={thinking} style={pace} />)}
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        {pick('blob', 'jelly character')}
        <div className="flex flex-wrap items-end gap-[16px]">
          {tile('8px', <ConsoleIcon variant="blob" size={8} style={pace} />)}
          {tile('16px', <ConsoleIcon variant="blob" size={16} style={pace} />)}
          {tile('24px', <ConsoleIcon variant="blob" size={24} style={pace} />)}
          {tile('8px · thinking', <ConsoleIcon variant="blob" size={8} thinking={thinking} style={pace} />)}
          {tile('16px · thinking', <ConsoleIcon variant="blob" size={16} thinking={thinking} style={pace} />)}
          {tile('24px · thinking', <ConsoleIcon variant="blob" size={24} thinking={thinking} style={pace} />)}
          {tile('64px · inspect', <ConsoleIcon variant="blob" size={64} style={pace} />)}
          {tile('64px · thinking', <ConsoleIcon variant="blob" size={64} thinking={thinking} style={pace} />)}
          {tile('8px · dark', <ConsoleIcon variant="blob" size={8} style={pace} />, true)}
          {tile('24px · dark', <ConsoleIcon variant="blob" size={24} style={pace} />, true)}
          {tile('64px · dark', <ConsoleIcon variant="blob" size={64} style={pace} />, true)}
        </div>
        <div className="flex items-center justify-around" style={{ height: 220, borderRadius: 8, background: color.consoleBlob.night }}>
          <ConsoleIcon variant="blob" size={150} style={pace} />
          <ConsoleIcon variant="blob" size={150} thinking={thinking} style={pace} />
        </div>
      </div>
      <div className="flex items-center gap-[12px]">
        <Button className="dui-console-icon-trigger" icon={<ConsoleIcon size={16} style={{ ...pace, color: color.actionPrimary }} />}>Ask Console</Button>
        <IconButton className="dui-console-icon-trigger" label="Console" icon={<ConsoleIcon size={16} style={pace} />} />
        <Checkbox checked={thinking} onChange={setThinking} label="Thinking" />
        <Checkbox checked={slow} onChange={setSlow} label="Slow motion (4×)" />
      </div>
    </div>
  )
}

function DrawerDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Create payment"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => setOpen(false)}>Create</Button></>}
      >
        <div className="flex flex-col gap-[16px]">
          <TextField label="Amount" placeholder="$0.00" />
          <TextField label="Description" placeholder="Optional" />
        </div>
      </Drawer>
    </>
  )
}

export const CATALOG = [
  // ── Foundations ─────────────────────────────────────────────────────────
  {
    id: 'colors', name: 'Color tokens', category: 'Foundations',
    description: 'Use `color.*` from @dashboard/ui instead of raw hex. Chart series colors are in `color.chart`.',
    demo: () => (
      <div className="flex flex-wrap gap-[16px]">
        {['textStrong', 'text', 'subdued', 'actionPrimary', 'brand500', 'neutral50', 'neutral100', 'borderDefault', 'positive', 'negative'].map(k => (
          <Swatch key={k} name={`color.${k}`} value={color[k]} />
        ))}
        {color.chart.map((c, i) => <Swatch key={c} name={`color.chart[${i}]`} value={c} />)}
      </div>
    ),
    code: `import { color } from '@dashboard/ui'\n<div style={{ color: color.subdued }} />`,
  },
  {
    id: 'typography', name: 'Typography', category: 'Foundations',
    description: 'Spread a `type.*` preset into style. Font is SF Pro Text; titles and metrics use SF Pro Display.',
    demo: () => {
      const presets = ['pageTitle', 'sectionTitle', 'metricLarge', 'metricMedium', 'label', 'body', 'bodySmall', 'caption', 'link']
      return (
        <div className="flex flex-col gap-[12px]">
          {presets.map(p => (
            <div key={p} className="flex items-baseline gap-[24px]">
              <code style={{ width: 160, fontSize: 12, color: color.subdued }}>type.{p}</code>
              <TypeSample preset={p} />
            </div>
          ))}
        </div>
      )
    },
    code: `import { type } from '@dashboard/ui'\n<h2 style={type.sectionTitle}>Your overview</h2>`,
  },
  {
    id: 'icons', name: 'Icons', category: 'Foundations',
    description: 'Inline SVG icons (tint with `color`) plus <Icon name> for any file in /public/icons. SettingsIcon through PayoutIcon are copied from Sail (pay-server frontend/icons); prefer adding Sail glyphs this way over drawing new ones.',
    demo: () => (
      <div className="flex flex-wrap gap-[12px]">
        {[
          ['InfoIcon', <InfoIcon key="i" />], ['PlusIcon', <PlusIcon key="p" />], ['PlusCircleIcon', <PlusCircleIcon key="pc" />],
          ['ExplorerIcon', <ExplorerIcon key="ex" />], ['WarningIcon', <WarningIcon key="w" />], ['TransferIcon', <TransferIcon key="t" />],
          ['WebhookIcon', <WebhookIcon key="wh" />], ['ChevronUpCircleIcon', <ChevronUpCircleIcon key="cu" />],
          ['SettingsIcon', <SettingsIcon key="se" />], ['SandboxIcon', <SandboxIcon key="sb" />], ['BusinessIcon', <BusinessIcon key="bu" />],
          ['AddIcon', <AddIcon key="ad" />], ['EditIcon', <EditIcon key="ed" />], ['PersonIcon', <PersonIcon key="pe" />], ['SignOutIcon', <SignOutIcon key="so" />],
          ['SailChevronRightIcon', <SailChevronRightIcon key="cr" />], ['SailInfoIcon', <SailInfoIcon key="in" />],
          ['InvoiceIcon', <InvoiceIcon key="inv" />], ['SubscriptionIcon', <SubscriptionIcon key="sub" />], ['DocumentIcon', <DocumentIcon key="doc" />], ['LinkIcon', <LinkIcon key="lnk" />], ['PayoutIcon', <PayoutIcon key="po" />],
        ].map(([n, el]) => (
          <IconTile key={n} name={n}>{el}</IconTile>
        ))}
        {ICON_NAMES.map(n => <IconTile key={n} name={n}><Icon name={n} size={16} /></IconTile>)}
      </div>
    ),
    code: `import { Icon, InfoIcon } from '@dashboard/ui'\n<InfoIcon />\n<Icon name="export12" />`,
  },
  {
    id: 'dashboard-thinking-icon', name: 'DashboardThinkingIcon', category: 'Foundations',
    description: 'Nine-dot mark for the Home input, with a larger rising diagonal. Static when idle; pulses while submitting, respecting reduced motion. Color is inherited from its caller.',
    demo: () => <div className="flex items-center gap-[24px]">
      <DashboardThinkingIcon style={{ color: color.muted }} />
      <DashboardThinkingIcon thinking style={{ color: color.actionPrimary }} />
    </div>,
    code: `<DashboardThinkingIcon size={16} thinking={isSubmitting} style={{ color: iconColor }} />`,
    props: [['size', 'Rendered size; defaults to 16'], ['thinking', 'Pulse the dots while submitting'], ['style / className', 'Caller-owned color and layout']],
  },
  {
    id: 'console-icon', name: 'ConsoleIcon (experiment)', category: 'Foundations',
    description: 'Retained cube/blob exploration; not the Home input baseline. Hover folds the cube into four squares, rebuilds it, then twists it (`variant="base"` stops after the rebuild). `thinking` loops flashing tiles and the full animation. Use the trigger class on a parent to preview hover and focus behavior.',
    demo: () => <ConsoleIconDemo />,
    code: `import { ConsoleIcon } from '@dashboard/ui'\n<ConsoleIcon size={16} />\n<ConsoleIcon thinking={isThinking} />\n<ConsoleIcon variant="base" />\n<ConsoleIcon variant="blob" thinking={isThinking} />\n<Button className="dui-console-icon-trigger" icon={<ConsoleIcon />}>Ask Console</Button>`,
    props: [
      ['size', '16 (default), 24, or 8 for tight spots. Other numbers scale the same 16-unit artwork.'],
      ['thinking', 'Loop the animation, e.g. while Console is generating. Turning it off settles back on the two layers.'],
      ['playOn', '"hover" (default) plays when the pointer rests on the icon or trigger for 150ms, or on keyboard focus. "focus" plays only when focus enters the trigger, e.g. an input row. Either way it won\'t replay within 4 seconds.'],
      ['still', 'Never animate.'],
      ['variant', 'Omit it to use the variant picked with the radios above (saved per browser; read it with `useConsoleIconVariant()`, set it with `setConsoleIconVariant()`). "cube" folds back into four squares, rebuilds, then adds Rubik\'s cube turns: the two layers twist a quarter in opposite directions, then the back-left and front-right slices turn a half in opposite directions, back to rest. "base" plays the fold only. "blob" (exploration) is a glowing jelly character: hover waves through the blob, star and lump shapes and back, then blinks; thinking wobbles it through a rounded square, blob, star and lump, its eyes moving with each shape. Halftone shows from 32px, the floor glow from 64px.'],
      ['label', 'Accessible name. Omit when the icon sits next to visible text.'],
      ['--dui-console-icon-pace', 'CSS variable that scales every duration (2 = half speed).'],
    ],
  },

  // ── Actions ─────────────────────────────────────────────────────────────
  {
    id: 'button', name: 'Button', category: 'Actions',
    description: 'Secondary is the default dashboard button (list page headers). Use primary sparingly — one per view. `action` is the Home-page variant with a soft shadow.',
    demo: () => (
      <div className="flex flex-col gap-[16px]">
        <div className="flex items-center gap-[8px]">
          <Button icon={<img src="/dashboard-assets/icons/add12.svg" alt="" style={{ width: 12, height: 12 }} />}>Create payment</Button>
          <Button variant="primary">Apply</Button>
          <Button variant="action">Pay out funds</Button>
          <Button variant="ghost">Learn more</Button>
          <Button variant="destructive">Refund</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex items-center gap-[8px]">
          <Button chevron>Export</Button>
          <SelectButton>Daily</SelectButton>
        </div>
      </div>
    ),
    code: `<Button icon={<Icon name="add12" />}>Create payment</Button>\n<Button variant="primary">Apply</Button>\n<Button variant="action">Pay out funds</Button>`,
    props: [
      ['variant', "'secondary' | 'primary' | 'ghost' | 'destructive' | 'action'"],
      ['size', "'md' | 'sm' — defaults to sm for action, md otherwise"],
      ['icon', 'node shown before the label'],
      ['chevron', 'boolean — trailing dropdown chevron'],
      ['…rest', 'any <button> props (onClick, disabled, …)'],
    ],
  },
  {
    id: 'icon-button', name: 'IconButton', category: 'Actions',
    description: '28×28 square button for header actions (More / Analyze / Export). Wrap in <Tooltip> for the dark hover label.',
    demo: () => (
      <div className="flex items-center gap-[8px]">
        <Tooltip label="More"><IconButton label="More" icon={<Icon name="more12" />} /></Tooltip>
        <Tooltip label="Analyze"><IconButton label="Analyze" icon={<Icon name="barChart12" />} /></Tooltip>
        <Tooltip label="Export"><IconButton label="Export" icon={<Icon name="export12" />} /></Tooltip>
        <div className="flex items-center gap-[12px]" style={{ marginLeft: 16, padding: '10px 16px', borderRadius: 8, background: color.textStrong }}>
          <IconButton variant="dark" label="Inspect" icon={<ExplorerIcon />} />
          <IconButton variant="dark" label="Errors" icon={<WarningIcon />} />
          <IconButton variant="dark" label="Webhooks" icon={<WebhookIcon />} />
        </div>
      </div>
    ),
    code: `<Tooltip label="Export">\n  <IconButton label="Export" icon={<Icon name="export12" />} />\n</Tooltip>\n<IconButton variant="dark" label="Errors" icon={<WarningIcon />} />`,
    props: [['icon', 'node'], ['label', 'string — aria-label and title'], ['variant', 'same as Button, plus "dark" for dark bars like Developers']],
  },
  {
    id: 'filter-pill', name: 'FilterPill', category: 'Actions',
    description: 'Rounded 24px pill for chart and report controls. `FilterPillValue` shows the chosen value in blurple; pass `onClear` for the ⊗ that removes a filter (click it in the demo). Pair with `SelectMenu` or `DateRangePicker` for the dropdowns.',
    demo: FilterPillsDemo,
    code: `<FilterPill chevron>\n  <FilterPillValue label="Date range" value="Last 7 days" />\n</FilterPill>\n<FilterPill chevron><FilterPillValue value="Daily" /></FilterPill>\n<FilterPill chevron onClear={() => setCompare(null)} clearLabel="Remove comparison">\n  <FilterPillValue label="Compare" value="Previous period" />\n</FilterPill>\n<FilterPill icon={<PlusCircleIcon />} chevron>Compare</FilterPill>`,
    props: [['icon', 'node'], ['chevron', 'boolean'], ['active', 'boolean — brand outline'], ['onClear', 'replaces icon with ⊗; called without firing onClick'], ['clearLabel', 'aria-label for the ⊗']],
  },
  {
    id: 'text-link', name: 'TextLink', category: 'Actions',
    description: 'Inline action-colored link ("View", "View all customers").',
    demo: () => <TextLink>View all customers</TextLink>,
    code: `<TextLink onClick={...}>View</TextLink>`,
  },

  // ── Inputs ──────────────────────────────────────────────────────────────
  {
    id: 'search-field', name: 'SearchField', category: 'Inputs',
    description: 'List-page search with clear button. Controlled.',
    demo: SearchDemo,
    code: `const [q, setQ] = useState('')\n<SearchField value={q} onChange={setQ} />`,
    props: [['value / onChange', 'controlled string'], ['placeholder', 'defaults to "Search by name, email, etc."']],
  },
  {
    id: 'text-field', name: 'TextField', category: 'Inputs',
    description: 'Labelled input for forms and drawers.',
    demo: TextFieldDemo,
    code: `<TextField label="Customer email" hint="…" value={v} onChange={setV} />`,
    props: [['label', 'string'], ['hint', 'string'], ['value / onChange', 'controlled string'], ['type', 'input type']],
  },
  {
    id: 'checkbox', name: 'Checkbox', category: 'Inputs',
    description: 'Uses the dashboard checkbox artwork. `indeterminate` wins over `checked`.',
    demo: CheckboxDemo,
    code: `<Checkbox checked={on} onChange={setOn} label="Email receipts" />`,
    props: [['checked', 'boolean'], ['indeterminate', 'boolean'], ['onChange(checked)', 'fn'], ['label', 'node'], ['disabled', 'boolean']],
  },
  {
    id: 'radio', name: 'Radio', category: 'Inputs',
    description: 'Single choice from a small set. Give every radio in a group the same `name`. Controlled.',
    demo: RadioDemo,
    code: `<Radio name="tz" value="UTC" checked={tz === 'UTC'} onChange={setTz} label="UTC" />`,
    props: [['checked', 'boolean'], ['onChange(value)', 'fn, called with this radio\'s `value`'], ['name', 'string, shared by the group'], ['value', 'string'], ['label', 'node'], ['disabled', 'boolean']],
  },

  // ── Navigation ──────────────────────────────────────────────────────────
  {
    id: 'tabs', name: 'Tabs', category: 'Navigation',
    description: 'Underline tab bar used at the top of list pages.',
    demo: TabsDemo,
    code: `<Tabs value={tab} onChange={setTab} tabs={[\n  { id: 'payments', label: 'Payments' },\n  { id: 'payouts', label: 'Payouts' },\n]} />`,
    props: [['tabs', '[{ id, label, disabled? }]'], ['value / onChange(id)', 'controlled'], ['tone', "'neutral' (default) | 'brand' (purple active tab, e.g. Apps overview)"]],
  },
  {
    id: 'view-chips', name: 'ViewChips', category: 'Navigation',
    description: 'Saved-view selector chips (All 100 / Succeeded 70 …).',
    demo: ViewChipsDemo,
    code: `<ViewChips value={view} onChange={setView} chips={[\n  { id: 'all', label: 'All', count: 100 },\n]} />`,
    props: [['chips', '[{ id, label, count? }]'], ['value / onChange(id)', 'controlled']],
  },
  {
    id: 'fade-slide-in', name: 'FadeSlideIn', category: 'Navigation',
    description: 'Page/tab content enter motion: fades in and slides up 10px over 300ms (ease-in-out). Replays when `transitionKey` changes and ends at `transform: none`, so sticky/fixed children keep working. Route changes get this automatically; use it for content under Tabs. `useFadeSlideIn(ref, key)` does the same without a wrapper.',
    demo: FadeSlideInDemo,
    code: `<Tabs value={tab} onChange={setTab} tabs={tabs} />\n<FadeSlideIn transitionKey={tab}>\n  {/* tab content */}\n</FadeSlideIn>`,
    props: [['transitionKey', 'replays the motion when it changes'], ['appear', 'boolean — also animate on mount'], ['as', 'element type (default div)']],
  },
  {
    id: 'collapse', name: 'Collapse', category: 'Navigation',
    description: 'Accordion reveal: content grows open and shrinks closed with a fade, ease-in-out over 200ms. The sidebar\'s More section uses it. Closed content stays mounted but inert.',
    demo: CollapseDemo,
    code: `<NavItem label="More" expandable expanded={open} onClick={() => setOpen((o) => !o)} />\n<Collapse open={open}>\n  {/* sub items */}\n</Collapse>`,
    props: [['open', 'boolean'], ['duration', 'ms (default 200)']],
  },

  // ── Data display ────────────────────────────────────────────────────────
  {
    id: 'badge', name: 'Badge / StatusBadge', category: 'Data display',
    description: 'Status pills. StatusBadge maps common labels (Succeeded, Failed, Pending…) to a tone automatically.',
    demo: () => (
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[8px]">
          {Object.keys(status).map(t => <Badge key={t} tone={t}>{t}</Badge>)}
        </div>
        <div className="flex items-center gap-[8px]">
          {['Succeeded', 'Pending', 'Failed', 'Refunded', 'In transit', 'Blocked'].map(s => <StatusBadge key={s} status={s} />)}
        </div>
      </div>
    ),
    code: `<Badge tone="success">Paid</Badge>\n<StatusBadge status="Failed" />`,
    props: [['tone', "'success' | 'warning' | 'critical' | 'info' | 'default'"], ['status (StatusBadge)', 'label text'], ['map (StatusBadge)', 'override label → tone']],
  },
  {
    id: 'stat', name: 'Stat', category: 'Data display',
    description: 'Headline number with label, caption, optional dropdown chevron and action link.',
    demo: () => (
      <div className="flex gap-[40px]">
        <Stat label="Net volume" dropdown value="$406.39" caption="2:00 PM" />
        <Stat label="Yesterday" dropdown value="$144.37" size="md" />
        <Stat style={{ width: 277 }} label="USD Balance" dropdown value="$9,257.51" caption="Available to pay out" action={<TextLink>View</TextLink>} />
      </div>
    ),
    code: `<Stat label="USD Balance" dropdown value="$9,257.51"\n  caption="Available to pay out" action={<TextLink>View</TextLink>} />`,
    props: [['label / value / caption', 'nodes'], ['dropdown', 'boolean chevron'], ['action', 'node, right-aligned'], ['size', "'lg' | 'md'"], ['live', 'boolean — the value slides in each time it changes (Home Net volume, USD balance)']],
  },
  {
    id: 'stat-dropdown', name: 'StatDropdown', category: 'Data display',
    description: 'Clickable Stat label with a chevron — the Home hero metric, comparison day, and balance switchers. Pass it as the Stat `label`; it takes a ref, so it works as a `SelectMenu` trigger or a `DatePicker` anchor.',
    demo: StatDropdownDemo,
    code: `<Stat\n  label={<SelectMenu value={metric} onChange={setMetric} options={METRICS}\n    trigger={<StatDropdown>Gross volume</StatDropdown>} />}\n  value="$452.80"\n/>`,
    props: [['children', 'label text'], ['…rest', 'passed to the <button> (ref, onClick, aria-*)']],
  },
  {
    id: 'live-dot', name: 'LiveDot', category: 'Charts',
    description: 'The "now" dot at the end of a live line chart. A ring pulses out each time `pulseKey` changes; set `top` and it glides to the new height. The Home hero chart pulses it whenever net volume goes up.',
    demo: LiveDotDemo,
    code: `<div style={{ position: 'relative' }}>\n  <LiveDot pulseKey={increases} style={{ left: '58%', top: y }} />\n</div>`,
    props: [['pulseKey', 'changes to replay the pulse (falsy = no pulse)'], ['color', 'default color.brand500'], ['size', 'px (default 6)'], ['style', 'position: left / top of the centre']],
  },
  {
    id: 'key-value-list', name: 'KeyValueList', category: 'Data display',
    description: 'Hairline-separated label/value rows. Add `description` for a two-line item with a semibold label and value (Home "Top customers"), and `badge` to show a status in place of the value (Home "Failed payments"). Rows without a description stay single-line (Balances).',
    demo: () => (
      <div style={{ width: 320 }}>
        <KeyValueList
          rows={[
            { label: 'Jenny Rosen', description: 'jenny.rosen@example.com', value: '$24,200.00' },
            { label: '$1.00', description: 'Oct 3, 6:35 AM • alex.smith@example.com', badge: <Badge tone="critical">Failed</Badge> },
            { label: 'Card declined', meta: 28, value: '$1,432.00' },
          ]}
        />
        <CardFooterLink note="Updated yesterday">View all</CardFooterLink>
      </div>
    ),
    code: `<KeyValueList rows={[\n  { label: 'Jenny Rosen', description: 'jenny.rosen@example.com', value: '$24,200.00' },\n  { label: '$1.00', description: 'Oct 3 • alex.smith@example.com', badge: <Badge tone="critical">Failed</Badge> },\n]} />\n<CardFooterLink note="Updated yesterday" href="/customers">View all</CardFooterLink>`,
    props: [['rows', '[{ label, meta?, description?, value?, badge?, onClick? }]'], ['description', 'second line; makes the row two-line with semibold label and value'], ['badge', 'node shown instead of value'], ['linkLabels', 'render labels as links'], ['CardFooterLink', `follow the list with it for a "View all" link (children, note?, align?: 'left' | 'right', onClick?, href?)`]],
  },
  {
    id: 'data-table', name: 'DataTable', category: 'Data display',
    description: 'Lightweight table with list-page styling, optional checkboxes and clickable rows. For full list pages with views, filters and column settings use the DashboardListViewTemplate pattern below.',
    demo: DataTableDemo,
    code: `<DataTable\n  columns={[{ id: 'amount', label: 'Amount', align: 'right', type: 'currency' },\n            { id: 'status', label: 'Status', type: 'status' }]}\n  rows={rows}\n  onRowClick={row => …}\n/>`,
    props: [
      ['columns', "[{ id, label, align?, width?, type?: 'text'|'status'|'currency'|'muted', render?(row) }]"],
      ['rows', 'array of objects; `id` is the key'],
      ['selectable / selected / onSelectedChange', 'checkbox selection (Set of ids)'],
      ['onRowClick(row)', 'makes rows clickable'],
    ],
  },
  {
    id: 'card', name: 'Card / CardGrid', category: 'Data display',
    description: 'Overview metric cards. CardGrid either joins cards with 1px hairlines (Balances) or sets rounded cards on a grey tray (the Home "Performance" grid).',
    demo: () => (
      <CardGrid columns={2} variant="tray">
        <Card>
          <CardHeader title="Gross volume" />
          <CardMetric value="$160k" delta="+1.2%" />
          <div style={{ marginTop: 12 }}><LineChart data={[10, 12, 15, 17, 21, 26, 32, 38]} compareData={[8, 9, 9, 11, 14, 16, 18, 21]} yLabels={['$40k', '$30k', '$20k', '$10k', '0']} height={120} /></div>
        </Card>
        <Card>
          <CardHeader title="Refund rate" />
          <CardMetric value="2.4%" delta="-0.3%" />
          <div style={{ marginTop: 12 }}><LineChart data={[3.1, 2.9, 3.0, 2.8, 2.6, 2.5, 2.4]} yLabels={['4%', '3%', '2%', '1%', '0']} height={120} /></div>
        </Card>
      </CardGrid>
    ),
    code: `<CardGrid columns={3} variant="tray">\n  <Card>\n    <CardHeader title="Gross volume" />\n    <CardMetric value="$160k" delta="+1.2%" />\n    <LineChart data={[…]} compareData={[…]} yLabels={[…]} />\n  </Card>\n</CardGrid>`,
    props: [['Card.bordered', 'standalone 12px-radius outline'], ['Card.menu / menuLabel', 'OverflowMenu items for a hover "…" button at the top right'], ['Card.highlighted', 'boolean — looping FocusTrace ring (e.g. Console context)'], ['Card.eyebrow', 'small grey tab label on the top-left edge (Apps overview "For your business")'], ['CardHeader', 'title, info?, action?'], ['CardMetric', 'value, delta (negative → red)'], ['CardFooterLink', 'children, onClick?, href?, note? — 13px subdued link (blurple on hover) pinned to the card bottom; note puts plain text left, link right'], ['CardGrid.columns', 'number'], ['CardGrid.variant', "'hairline' (default) | 'tray' — grey 8px-padded tray, 8px gaps, 8px-radius cards"]],
  },

  // ── Charts ──────────────────────────────────────────────────────────────
  {
    id: 'line-chart', name: 'LineChart', category: 'Charts',
    description: 'Card-sized line chart. Pass number arrays (`data`, `compareData`) or raw SVG paths. `hover` adds a needle that snaps to the nearest point, dots on each series and a ChartHoverCard.',
    demo: () => (
      <div style={{ width: 420 }}>
        <LineChart
          data={[5, 7, 6, 9, 12, 11, 15]} compareData={[4, 5, 5, 6, 7, 8, 9]} yLabels={['20', '15', '10', '5', '0']}
          hover={{ labels: ['Dec 1', 'Dec 2', 'Dec 3', 'Dec 4', 'Dec 5', 'Dec 6', 'Dec 7'], compareLabels: ['Nov 24', 'Nov 25', 'Nov 26', 'Nov 27', 'Nov 28', 'Nov 29', 'Nov 30'] }}
        />
      </div>
    ),
    code: `<LineChart data={[5, 7, 6, 9]} compareData={[4, 5, 5, 6]}\n  yLabels={['20', '15', '10', '5', '0']} xStart="Dec 1" xEnd="Dec 7"\n  hover={{ labels: ['Dec 1', …], compareLabels: ['Nov 24', …], format: (n) => \`$\${n}\` }} />`,
    props: [['data / compareData', 'number[]'], ['path1 / path2', 'raw SVG paths in a 0 0 100 {height} viewBox, points evenly spaced'], ['yLabels', 'string[] top → bottom'], ['xStart / xEnd', 'strings'], ['height', 'px (default 188)'], ['hover', '{ labels, compareLabels?, format?, yMax? } — yMax scales path heights to values when using paths']],
  },
  {
    id: 'chart-hover-card', name: 'ChartHoverCard / LineChartHover', category: 'Charts',
    description: "Sail's chart hover card: swatch, label and value rows, optional title. LineChartHover is the hover layer LineChart uses; drop it over any custom line plot (the Home hero chart) to get the same needle, dots and card.",
    demo: () => (
      <ChartHoverCard title="2:00 PM" rows={[{ color: color.brand500, label: 'Today', value: '$406.39' }, { color: color.neutral100, label: 'Yesterday', value: '$353.95' }]} />
    ),
    code: `<ChartHoverCard title="2:00 PM" rows={[{ color, label: 'Today', value: '$406.39' }]} />\n\n// Over a custom plot (position: relative box)\n<LineChartHover count={25} title={(i) => hourLabel(i)}\n  series={[{ color, points: [{ y, label: 'Today', value: '$12.00' }, …] }]} />`,
    props: [['rows', '[{ color, label, value }]'], ['title', 'string'], ['swatch', "'line' | 'square'"], ['LineChartHover.series', '[{ color, points: [{ y (px), label, value }] }], index-aligned'], ['LineChartHover.count', 'number of evenly spaced x positions'], ['LineChartHover.title', '(index) => string']],
  },
  {
    id: 'meter-bar', name: 'MeterBar / Legend', category: 'Charts',
    description: 'Stacked horizontal bar with a matching swatch legend (Home Payments card).',
    demo: () => (
      <div style={{ width: 320 }}>
        <MeterBar segments={[{ value: 65, label: 'Succeeded', display: '$130k' }, { value: 10, label: 'Uncaptured', display: '$12k' }, { value: 8, label: 'Refunded', display: '$3.2k' }, { value: 6 }, { value: 4 }]} />
        <div style={{ marginTop: 16 }}><Legend items={[{ label: 'Succeeded', value: '$130k' }, { label: 'Uncaptured', value: '$12k' }, { label: 'Refunded', value: '$3.2k' }]} /></div>
      </div>
    ),
    code: `<MeterBar segments={[{ value: 65, label: 'Succeeded', display: '$130k' }, { value: 10 }]} />\n<Legend items={[{ label: 'Succeeded', value: '$130k' }]} />`,
    props: [['segments', '[{ value, color?, label?, display? }] — colors default to color.chart; segments with a label show a hover card and dim the rest'], ['Legend.items', '[{ label, value, color?, onClick? }] — rows with onClick get a hover fill and are keyboard-activatable (Home Payments card links each status to Transactions)'], ['Legend.divided', 'boolean — Dashboard table style: KeyValueList-spaced rows with a hairline under each (Home Payments card, colors from color.paymentStatus)']],
  },
  {
    id: 'sparkline', name: 'Sparkline', category: 'Charts',
    description: 'Tiny axis-less trend line for table cells and compact stats.',
    demo: () => <div className="flex items-center gap-[16px]"><Sparkline data={[3, 4, 3, 6, 5, 8, 9]} /><Sparkline data={[9, 8, 8, 6, 5, 4, 2]} stroke={color.negative} /></div>,
    code: `<Sparkline data={[3, 4, 3, 6, 5, 8]} />`,
  },

  // ── Layout ──────────────────────────────────────────────────────────────
  {
    id: 'page-header', name: 'PageHeader', category: 'Layout',
    description: 'Page <h1> with right-aligned actions, optional breadcrumb and description.',
    demo: () => (
      <PageHeader
        breadcrumb="Balances"
        title="Payouts"
        description="Money moving from your Stripe balance to your bank."
        actions={<><IconButton label="Export" icon={<Icon name="export12" />} /><Button icon={<Icon name="add12" />}>Create payout</Button></>}
      />
    ),
    code: `<PageHeader title="Balances" actions={<Button>Pay out funds</Button>} />`,
    props: [['title', 'node'], ['breadcrumb', 'node above the title'], ['description', 'node below the title'], ['actions', 'node, right-aligned']],
  },
  {
    id: 'section-header', name: 'SectionHeader / Divider', category: 'Layout',
    description: 'Section <h2> with actions and a hairline divider.',
    demo: () => <SectionHeader title="Your overview" actions={<Button variant="action">Pay out funds</Button>} />,
    code: `<SectionHeader title="Your overview" actions={<Button variant="action">Pay out funds</Button>} />\n<Divider />`,
    props: [['title', 'node'], ['actions', 'node'], ['divider', 'boolean (default true)'], ['size', "'lg' (20px, default) | 'md' (16px)"]],
  },
  {
    id: 'well', name: 'Well', category: 'Layout',
    description: 'Subtle grey container, used to group filters and toolbars.',
    demo: () => <Well><div className="flex items-center gap-[6px]"><FilterPill chevron>Status</FilterPill><FilterPill chevron>Date</FilterPill></div></Well>,
    code: `<Well>…</Well>`,
  },
  {
    id: 'empty-state', name: 'EmptyState', category: 'Layout',
    description: 'Centered message for empty lists and unbuilt areas.',
    demo: () => <EmptyState title="No payouts yet" description="Payouts appear here once your balance is paid out to your bank." action={<Button>Add bank account</Button>} />,
    code: `<EmptyState title="No payouts yet" description="…" action={<Button>…</Button>} />`,
  },
  {
    id: 'scroll-area', name: 'ScrollArea', category: 'Layout',
    description: 'Vertical scroll container whose scrollbar floats over the content instead of taking width from it, so nothing shifts when overflow appears. The thumb shows while scrolling or hovering, and can be dragged. Used by the left nav and the main page.',
    demo: () => (
      <ScrollArea style={{ height: 160, width: 280, border: `1px solid ${color.neutral50}`, borderRadius: 8 }} viewportStyle={{ padding: 12 }}>
        {Array.from({ length: 14 }, (_, i) => <div key={i} style={{ fontSize: 14, lineHeight: '28px', color: color.textStrong }}>Row {i + 1}</div>)}
      </ScrollArea>
    ),
    code: `import { ScrollArea } from '@dashboard/ui'\n<ScrollArea className="flex-1" viewportStyle={{ padding: 16 }}>…</ScrollArea>\n<ScrollArea as="main" ref={mainRef}>…</ScrollArea>`,
    props: [
      ['as', 'Element for the scrolling viewport, e.g. "main". Defaults to "div".'],
      ['ref', 'Forwarded to the viewport, the element that actually scrolls.'],
      ['className / style', 'Layout for the outer box, e.g. "flex-1" or a fixed height.'],
      ['viewportClassName / viewportStyle', 'Padding and other styles for the scrolling element.'],
      ['data-scrolled (output)', 'Set on the root once scrolled off the top; the sidebar header uses it for its drop shadow.'],
    ],
  },

  // ── Overlays ────────────────────────────────────────────────────────────
  {
    id: 'tooltip', name: 'Tooltip', category: 'Overlays',
    description: 'Dark label shown below any element on hover. Portalled, so it never gets clipped.',
    demo: () => <Tooltip label="Analyze"><Button>Hover me</Button></Tooltip>,
    code: `<Tooltip label="Analyze"><IconButton … /></Tooltip>`,
  },
  {
    id: 'menu', name: 'Menu', category: 'Overlays',
    description: 'Dropdown anchored to a trigger. Closes on outside click, Escape, or selection.',
    demo: () => (
      <Menu
        align="left"
        trigger={<Button chevron>Actions</Button>}
        items={[
          { label: 'View payment details' },
          { label: 'Copy payment ID' },
          { label: 'Refund payment', group: 'Manage' },
          { label: 'Block card', tone: 'critical' },
        ]}
      />
    ),
    code: `<Menu trigger={<IconButton label="More" icon={<Icon name="more12" />} />}\n  items={[{ label: 'Refund', onSelect: … }, { label: 'Delete', tone: 'critical' }]} />`,
    props: [['trigger', 'single element (receives ref + onClick)'], ['items', "[{ label, onSelect?, tone?: 'critical', group? }]"], ['align', "'right' | 'left'"]],
  },
  {
    id: 'app-icon', name: 'AppIcon', category: 'Data display',
    description: 'Square app logo. Falls back to the app\'s initial on a slate tile when there\'s no image. `badge` adds the purple activity dot.',
    demo: () => (
      <div className="flex items-center" style={{ gap: 16 }}>
        <AppIcon src="/dashboard-assets/icons/apps/zapier.svg" name="Zapier" badge />
        <AppIcon src="/dashboard-assets/icons/apps/linear.svg" name="Linear" />
        <AppIcon name="Revenue tools" badge />
        <AppIcon src="/dashboard-assets/icons/apps/hubspot.svg" name="HubSpot" size={40} />
      </div>
    ),
    code: `<AppIcon src="/dashboard-assets/icons/apps/zapier.svg" name="Zapier" badge />\n<AppIcon name="Revenue tools" />`,
    props: [['src', 'logo image (optional)'], ['name', 'alt text and fallback initial'], ['size', 'px (default 48)'], ['badge', 'show the activity dot'], ['raised', 'adds a soft drop shadow (list rows)']],
  },
  {
    id: 'app-list-item', name: 'AppListItem', category: 'Data display',
    description: 'Marketplace row: 40px logo, app name, short pitch, and an action link on the right.',
    demo: () => (
      <div style={{ width: 340 }} className="flex flex-col gap-[24px]">
        <AppListItem icon="/dashboard-assets/icons/apps/hubspot.svg" name="HubSpot Data Sync" description="Sync HubSpot customers and products with Stripe" />
        <AppListItem icon="/dashboard-assets/icons/apps/intercom.svg" name="Intercom" description="View your customers' Stripe data directly from your Intercom inbox" external />
      </div>
    ),
    code: `<AppListItem icon="/dashboard-assets/icons/apps/hubspot.svg" name="HubSpot Data Sync"\n  description="Sync HubSpot customers…" onAction={install} />`,
    props: [['icon', 'logo image'], ['name', 'app name'], ['description', 'one-line pitch'], ['actionLabel', "default 'Install'"], ['external', 'adds an external-link arrow'], ['onAction', 'click handler for the action'], ['size', "'md' (40px logo, default) | 'sm' (28px logo, 13px text)"]],
  },
  {
    id: 'link-list-item', name: 'LinkListItem', category: 'Data display',
    description: 'Icon well, purple title, and description, for promo links at the bottom of a menu.',
    demo: () => (
      <div style={{ width: 340 }} className="flex flex-col gap-[4px]">
        <LinkListItem icon={<StarIcon size={20} />} title="Perks" description="Save money on business tools" />
        <LinkListItem icon={<AppsIcon size={20} />} title="Discover more apps" description="Save time and streamline your business" />
      </div>
    ),
    code: `<LinkListItem icon={<StarIcon size={20} />} title="Perks"\n  description="Save money on business tools" onClick={…} />`,
    props: [['icon', 'node shown in the 48px well'], ['title', 'link text'], ['description', 'supporting line'], ['onClick', 'click handler']],
  },
  {
    id: 'account-menu', name: 'AccountMenu / AccountAvatar', category: 'Overlays',
    description: 'Account switcher from the sidebar account header: current account, Settings and sandbox, a searchable account list, other/create account, and the signed-in user with Sign out. Built on Popover. AccountAvatar is the initial-on-a-tile stand-in logo.',
    demo: AccountMenuDemo,
    code: `const ref = useRef(null)\nconst [open, setOpen] = useState(false)\n\n<button ref={ref} onClick={() => setOpen(o => !o)}>…</button>\n<AccountMenu anchorRef={ref} open={open} onClose={() => setOpen(false)}\n  account={{ name: 'Rocketrides', logo: <Logo size={40} /> }}\n  accounts={[{ name: 'Cactus Practice' }, { name: 'Lemon Squeezy' }]}\n  user="Kevin Yien" onSelectAccount={switchTo} />`,
    props: [['anchorRef / open / onClose', 'as Popover'], ['account', '{ name, logo? } — logo node shown at the top (defaults to a 40px AccountAvatar)'], ['accounts', '[{ id?, name }] listed under the search field'], ['user', 'signed-in user name'], ['onSelectAccount', '(account) => void'], ['AccountAvatar', 'name, size (default 24)']],
  },
  {
    id: 'action-menu', name: 'ActionMenu / KeyboardShortcut', category: 'Overlays',
    description: 'Command list in a Popover: icon, blurple label, and optional keycaps on the right. The toolbar "+" create menu uses it. KeyboardShortcut renders keycaps on their own.',
    demo: ActionMenuDemo,
    code: `<ActionMenu anchorRef={ref} open={open} onClose={() => setOpen(false)} label="Create"\n  items={[{ label: 'Invoice', icon: <InvoiceIcon />, shortcut: ['c', 'i'], onClick: … }]} />\n\n<KeyboardShortcut keys={['c', 'i']} />`,
    props: [['anchorRef / open / onClose', 'as Popover'], ['items', '[{ label, icon?, shortcut?: string[], onClick? }]'], ['align', "default 'center'"], ['label', 'aria-label'], ['KeyboardShortcut.keys', 'string[] — one keycap each']],
  },
  {
    id: 'notifications-menu', name: 'NotificationsMenu', category: 'Overlays',
    description: 'DashboardToolbar bell dropdown: All / Action required / Updates filter tiles with counts over a scrolling list. Action-required items get an orange (Sail orange.200) leading bar. Content for the toolbar lives in data/notifications.js.',
    demo: NotificationsMenuDemo,
    code: `<NotificationsMenu anchorRef={bellRef} open={open} onClose={() => setOpen(false)}\n  notifications={[{ id, kind: 'action' | 'update', title, body, time }]} />`,
    props: [['anchorRef / open / onClose', 'as Popover'], ['notifications', "[{ id, kind: 'action' | 'update', title, body, time? }]"], ['align', "default 'center'"]],
  },
  {
    id: 'popover', name: 'Popover', category: 'Overlays',
    description: 'Free-form panel anchored to a trigger. Flips above when there\'s no room, follows scroll, and closes on outside click or Escape. `motion="slide"` slides it down over 200ms (ease-in-out) and back up on close; the toolbar Apps menu uses it. The date pickers and SelectMenu are built on it.',
    demo: PopoverDemo,
    code: `const ref = useRef(null)\nconst [open, setOpen] = useState(false)\n\n<Button ref={ref} onClick={() => setOpen(o => !o)}>Apps</Button>\n<Popover anchorRef={ref} open={open} onClose={() => setOpen(false)}\n  align="center" motion="slide" style={{ width: 380, padding: 20 }}>\n  …\n</Popover>`,
    props: [['anchorRef', 'ref to the element it opens from'], ['open / onClose', 'controlled visibility'], ['align', "'left' (default) | 'right' | 'center'"], ['motion', "'pop' (default, 150ms scale-in) | 'slide' (200ms ease-in-out, animates out too)"], ['gap', 'px between anchor and panel (default 6)'], ['label', 'aria-label'], ['role', "default 'dialog'"], ['style', 'merged onto the panel: width, padding, radius']],
  },
  {
    id: 'select-menu', name: 'SelectMenu', category: 'Overlays',
    description: 'Single-choice dropdown under a trigger (the Home "Daily" and "Compare" pills). The selected option shows a check; arrow keys move, Enter picks, Escape closes, and it flips above when there\'s no room below.',
    demo: SelectMenuDemo,
    code: `<SelectMenu\n  label="Interval"\n  value={interval}\n  onChange={setInterval}\n  options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]}\n  trigger={<FilterPill chevron><FilterPillValue value="Daily" /></FilterPill>}\n/>`,
    props: [['trigger', 'single element (receives ref + onClick)'], ['options', '[{ value, label }]'], ['value', 'selected value'], ['onChange', '(value) => void'], ['align', "'left' | 'right'"], ['label', 'aria-label for the list']],
  },
  {
    id: 'date-picker', name: 'DatePicker', category: 'Overlays',
    description: 'Single-date popover: a typed date field over one month. Picking a day calls `onChange` and closes. Future dates are disabled and today is bold. The Home "Yesterday" comparison uses it.',
    demo: DatePickerDemo,
    code: `const ref = useRef(null)\nconst [open, setOpen] = useState(false)\n\n<StatDropdown ref={ref} onClick={() => setOpen(o => !o)}>Yesterday</StatDropdown>\n<DatePicker anchorRef={ref} open={open} onClose={() => setOpen(false)}\n  value={day} onChange={setDay} />`,
    props: [['anchorRef', 'ref to the element it opens from'], ['open / onClose', 'controlled visibility'], ['value', 'Date'], ['onChange', '(date) => void'], ['maxDate', 'latest selectable day (default today)']],
  },
  {
    id: 'date-range-picker', name: 'DateRangePicker', category: 'Overlays',
    description: 'Two-month range picker with presets, typed Start/End fields, and Clear / Apply (the Home "Date range" pill). Edits a draft until Apply. Future dates are disabled. Format the pill with `formatDateRange(range)`; build preset ranges with `getPresetRange(id)`.',
    demo: DateRangePickerDemo,
    code: `const ref = useRef(null)\nconst [open, setOpen] = useState(false)\nconst [range, setRange] = useState(() => getPresetRange('last4weeks'))\n\n<FilterPill ref={ref} chevron onClick={() => setOpen(o => !o)}>\n  <FilterPillValue label="Date range" value={formatDateRange(range)} />\n</FilterPill>\n<DateRangePicker anchorRef={ref} open={open} onClose={() => setOpen(false)}\n  value={range} onApply={setRange} />`,
    props: [['anchorRef', 'ref to the element it opens from'], ['open / onClose', 'controlled visibility'], ['value', '{ preset, start, end }'], ['onApply', '(range) => void; preset is null for hand-picked ranges'], ['presets', 'defaults to DATE_RANGE_PRESETS; [] hides the list'], ['maxDate', 'latest selectable day (default today)']],
  },
  {
    id: 'overflow-menu', name: 'OverflowMenu', category: 'Overlays',
    description: 'The "…" button and menu from the Home Performance cards. Pass `menu` to a Card to get it at the top right, revealed on hover. Arrow keys walk the items, Escape closes, and it flips above when there\'s no room below.',
    demo: CardMenuDemo,
    code: `<Card menuLabel="Gross volume" menu={[\n  { label: 'Ask Console', onSelect: () => askConsole({ prompt, card: 'grossVolume' }) },\n  { divider: true },\n  { label: 'Open chart detail' },\n]}>…</Card>\n\n<OverflowMenu label="More options" items={[{ label: 'Rename' }]} />`,
    props: [['items', "[{ label, onSelect? } | { divider: true }]"], ['label', 'aria-label for the button'], ['reveal', "'always' | 'hover' (needs a .dui-overflow-host ancestor)"]],
  },
  {
    id: 'dashboard-console-link', name: 'DashboardConsoleLink', category: 'Navigation',
    description: 'Opens the canonical Console in its own document. Prompts pass through the shared handoff contract; Dashboard does not render conversation components.',
    demo: DashboardConsoleLinkDemo,
    code: `const { openConsole, askConsole } = useDashboardConsole()\nopenConsole()\naskConsole({ prompt: 'Show me failed payments I should retry' })`,
    props: [['openConsole()', 'Start a blank Console conversation'], ['askConsole({ prompt })', 'Submit a prompt to Console']],
  },
  {
    id: 'focus-trace', name: 'FocusTrace', category: 'Overlays',
    description: "Console's orbiting focus border (from the growth-studio chart cards): a purple band trailing pink and yellow travels around an object's outline over a faint neutral ring. Four speeds: Slow, Medium and Fast make one lap (an announcement, like the Home Ask Console field), Loop keeps orbiting while Console is looking at the object (Home cards via Card's `highlighted`, list rows asked about from their menu). Holds still under reduced motion.",
    demo: FocusTraceDemo,
    code: `// One lap when something gains focus\n<FocusTrace active={focused} speed="fast" />\n\n// Orbit while it's Console's context, inside a position: relative box\n<FocusTrace active={isContext} speed="loop" radius={8} />\n\n// Following an element that can't host an overlay (a table row)\n<FocusTrace active={isContext} target={rowRef} speed="loop" />`,
    props: [['active', 'boolean; fades in and out'], ['speed', "'slow' (one 5.5s lap) | 'medium' (one 3s lap) | 'fast' (one 1s lap; the Home Ask Console field) | 'loop' (5.5s laps, continuous; default)"], ['duration', 'ms per lap, overriding the speed preset'], ['target', 'ref; overlays that element from document.body, trimmed to what its scrolling ancestors show'], ['radius', 'corner radius px (default 8)'], ['weight', 'stroke px (default 1.5)']],
  },
  {
    id: 'toast', name: 'Toast', category: 'Overlays',
    description: 'Bottom-center confirmation. Call `useToast()` anywhere inside the dashboard — DashboardLayout provides it.',
    demo: ToastDemo,
    code: `const toast = useToast()\ntoast('Payout created')`,
  },
  {
    id: 'drawer', name: 'Drawer', category: 'Overlays',
    description: 'Right-hand slide-over for detail views and create flows.',
    demo: DrawerDemo,
    code: `<Drawer open={open} onClose={close} title="Create payment"\n  footer={<Button variant="primary">Create</Button>}>\n  …\n</Drawer>`,
    props: [['open / onClose', 'controlled'], ['title', 'node'], ['footer', 'node, right-aligned'], ['width', 'px (default 480)']],
  },

  // ── Patterns ────────────────────────────────────────────────────────────
  {
    id: 'list-view-template', name: 'List page (DashboardListViewTemplate)', category: 'Patterns',
    description: 'Full Stripe list page — tabs, saved views, search, filters, column settings, bulk select, row menus — driven by a config file. Transactions, Directory and Product catalog all use it. To add a list page: copy src/dashboard/app/transactions/config.ts + data, then add a route in src/dashboard/DashboardApp.jsx.',
    demo: () => (
      <div className="flex items-center gap-[12px]">
        <TextLink href="/transactions/payments">Open Transactions →</TextLink>
        <TextLink href="/customers/all-customers">Open Directory →</TextLink>
      </div>
    ),
    code: `// src/dashboard/app/invoices/config.ts\nimport type { PageConfig } from '@dashboard/lib/listview/types'\n// Define columns and data as in the Transactions config.\nconst config: PageConfig = {\n  pageId: 'invoices',\n  pageTitle: 'Invoices',\n  tabs: [{ tabId: 'all', label: 'All', columns, data, createActionLabel: 'Create invoice' }],\n}\n\n// src/dashboard/DashboardApp.jsx (inside DashboardLayout)\n// Import DashboardListViewTemplate and the config above.\n<Route path="/invoices/:tab" element={<DashboardListViewTemplate config={config} basePath="/invoices" />} />`,
  },
  {
    id: 'balances-page', name: 'Overview page (Balances)', category: 'Patterns',
    description: 'A full page assembled only from library components — a good starting point to copy for a new feature page.',
    demo: () => <TextLink href="/balances">Open Balances →</TextLink>,
    code: `// src/dashboard/pages/Balances.jsx\n<PageHeader title="Balances" actions={…} />\n<CardGrid columns={3}>…</CardGrid>\n<SectionHeader title="Recent activity" />\n<DataTable … />`,
  },
]

function TypeSample({ preset }) {
  return <span style={type[preset]}>The quick brown fox — $9,257.51</span>
}

function IconTile({ name, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[6px]" style={{ width: 96, height: 64, borderRadius: 8, border: `1px solid ${color.neutral50}`, color: color.textStrong }}>
      {children}
      <span style={{ fontSize: 10, color: color.subdued, maxWidth: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  )
}
