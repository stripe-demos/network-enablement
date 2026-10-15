// Enablement module as a floatie: the Setup guide's panel in its Enablement
// tone, with one task group per product (Connect, and a placeholder Billing).
// Shows once "Set up Connect" is complete, on every page (mounted once in
// DashboardLayout), stacked above the Setup guide in the FloatieStack; Home's
// Setup guide collapses to its header while this is shown.
import { useNavigate } from 'react-router-dom'
import { BusinessIcon, InvoiceIcon } from '@dashboard/ui'
import { SetupGuidePanel } from '../pages/connect-setup/SetupGuide'
import { useConnectSetup } from '../pages/connect-setup/connectSetupStore'
import { useEnablementPrototypeControls } from '../prototype/enablementPrototypeControls'
import { ALL_ITEMS, ENABLEMENT_PRODUCTS, useEnablementDone } from './enablementItems'

const PRODUCT_ICONS = { connect: <BusinessIcon size={12} />, billing: <InvoiceIcon size={12} /> }

export default function EnablementFloatie() {
  const navigate = useNavigate()
  const done = useEnablementDone()
  const { placement } = useEnablementPrototypeControls()
  const { setupComplete } = useConnectSetup()
  if (placement !== 'floatie' || !setupComplete) return null

  const sections = ENABLEMENT_PRODUCTS.map(product => ({
    id: product.id,
    title: product.title,
    icon: PRODUCT_ICONS[product.id],
    items: product.items.map(item => ({
      id: item.id,
      label: item.shortLabel,
      complete: Boolean(done[item.id]),
      disabled: item.disabled,
    })),
  }))
  const doneCount = ALL_ITEMS.filter(item => done[item.id]).length

  return (
    <SetupGuidePanel
      tone="enablement"
      title="Enablement"
      sections={sections}
      defaultExpandedSection="connect"
      // A sliver of progress even at zero, like the Setup guide.
      progress={Math.max(0.05, doneCount / ALL_ITEMS.length)}
      progressLabel={`${doneCount} of ${ALL_ITEMS.length}`}
      onItemClick={itemId => {
        const item = ALL_ITEMS.find(i => i.id === itemId)
        if (item?.onOpen) item.onOpen()
        else if (item?.to) navigate(item.to)
      }}
    />
  )
}
