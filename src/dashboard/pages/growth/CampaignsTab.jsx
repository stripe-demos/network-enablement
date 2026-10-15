// Growth › Campaigns: a filterable, paged list of growth campaigns.
import { useState } from 'react'
import {
  AddIcon, Badge, Button, DataTable, FilterPill, FilterPillValue, OverflowMenu, PlusCircleIcon, SelectMenu, color, useToast,
} from '@dashboard/ui'
import { CAMPAIGNS_PAGE_SIZE, CAMPAIGN_STATUSES, CAMPAIGN_STATUS_TONES, PRODUCT_TYPES } from './campaigns/campaignsData'
import { deleteCampaign, duplicateCampaign, useCampaigns } from './campaigns/campaignsStore'
import './campaigns/campaigns.css'

const dashed = { borderStyle: 'dashed' }

export function CampaignsActions() {
  const toast = useToast()
  return (
    <Button variant="primary" icon={<AddIcon size={12} />} onClick={() => toast('Create campaign')}>
      Create campaign
    </Button>
  )
}

// Dashed "add filter" pill until a value is picked, then "Label | Value" with a clear button.
function FilterSelect({ label, options, value, onChange }) {
  return (
    <SelectMenu
      label={label}
      value={value}
      options={options.map((o) => ({ value: o, label: o }))}
      onChange={onChange}
      trigger={value
        ? <FilterPill chevron onClear={() => onChange(null)} clearLabel={`Clear ${label.toLowerCase()} filter`}><FilterPillValue label={label} value={value} /></FilterPill>
        : <FilterPill icon={<PlusCircleIcon />} style={dashed}>{label}</FilterPill>}
    />
  )
}

function RowMenu({ campaign }) {
  const toast = useToast()
  return (
    <OverflowMenu
      label={`More options for ${campaign.name}`}
      items={[
        { label: 'Edit', onSelect: () => toast(`Edit ${campaign.name}`) },
        { label: 'Duplicate', onSelect: () => { duplicateCampaign(campaign.id); toast('Campaign duplicated') } },
        { divider: true },
        { label: 'Delete', onSelect: () => { deleteCampaign(campaign.id); toast('Campaign deleted') } },
      ]}
    />
  )
}

const COLUMNS = [
  { id: 'name', label: 'Name', render: (c) => <span style={{ fontWeight: 600 }}>{c.name}</span> },
  { id: 'status', label: 'Status', render: (c) => <Badge tone={CAMPAIGN_STATUS_TONES[c.status]}>{c.status}</Badge> },
  { id: 'productType', label: 'Product type' },
  { id: 'adopted', label: 'Adopted accounts' },
  { id: 'volume', label: 'Volume' },
  { id: 'margin', label: 'Margin' },
  { id: 'start', label: 'Start date' },
  { id: 'end', label: 'End date' },
  { id: 'timezone', label: 'Timezone' },
  // Finished campaigns can't be changed, so they have no menu.
  { id: 'menu', label: '', align: 'right', width: 48, render: (c) => (c.status === 'Completed' ? null : <RowMenu campaign={c} />) },
]

export default function CampaignsTab() {
  const campaigns = useCampaigns()
  const [status, setStatus] = useState(null)
  const [productType, setProductType] = useState(null)
  const [page, setPage] = useState(0)

  const rows = campaigns.filter((c) => (!status || c.status === status) && (!productType || c.productType === productType))
  const pageCount = Math.max(1, Math.ceil(rows.length / CAMPAIGNS_PAGE_SIZE))
  // Deletes can empty the last page; show the last one that still has rows.
  const current = Math.min(page, pageCount - 1)
  const pageRows = rows.slice(current * CAMPAIGNS_PAGE_SIZE, (current + 1) * CAMPAIGNS_PAGE_SIZE)
  const filterBy = (set) => (value) => { set(value); setPage(0) }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-center gap-[6px]">
        <FilterSelect label="Status" options={CAMPAIGN_STATUSES} value={status} onChange={filterBy(setStatus)} />
        <FilterSelect label="Product type" options={PRODUCT_TYPES} value={productType} onChange={filterBy(setProductType)} />
      </div>
      <div className="growth-campaigns-table" style={{ borderTop: `1px solid ${color.borderSubtle}`, overflowX: 'auto' }}>
        <DataTable columns={COLUMNS} rows={pageRows} emptyMessage="No campaigns match these filters" />
      </div>
      <div className="flex items-center justify-end gap-[8px]">
        <Button size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</Button>
        <Button size="sm" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>Next</Button>
      </div>
    </div>
  )
}
