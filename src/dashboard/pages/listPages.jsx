import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import DashboardListViewTemplate from '@dashboard/components/DashboardListViewTemplate'
import transactionsConfig from '@dashboard/app/transactions/config'
import customersConfig from '@dashboard/app/customers/config'
import { buildNetworkConfig } from '@dashboard/app/network/config'
import productCatalogConfig from '@dashboard/app/product-catalog/config'
import { invitedNetworkRows, isNetworkOnboardingComplete, markNetworkSeen, useNetworkOnboarding } from './network/networkInvites'
import NetworkLanding from './network/NetworkLanding'

// Each dashboard list page is driven by its config + the shared DashboardListViewTemplate
// engine. The active tab comes from the URL (`:tab`), mirroring the Next.js
// `[tab]` dynamic route.

export function TransactionsTab() {
  const { tab } = useParams()
  return <DashboardListViewTemplate config={transactionsConfig} basePath="/transactions" initialTabId={tab} />
}

export function CustomersTab() {
  const { tab } = useParams()
  return <DashboardListViewTemplate config={customersConfig} basePath="/customers" initialTabId={tab} />
}

// Network shows a "Join the Stripe network" landing until the user opts in and
// finishes the onboarding dialog (opting out shows it again). After that it's
// the list, filled with the businesses invited in the dialog. Visiting the page
// clears the sidebar's unseen-invites indicator.
export function NetworkTab() {
  const { tab } = useParams()
  const onboarding = useNetworkOnboarding()
  const networkConfig = useMemo(() => buildNetworkConfig(invitedNetworkRows(onboarding)), [onboarding])
  useEffect(() => { markNetworkSeen() }, [onboarding])
  const complete = isNetworkOnboardingComplete(onboarding)
  if (!complete || !onboarding.optedIn) return <NetworkLanding optedOut={complete} />
  return <DashboardListViewTemplate config={networkConfig} basePath="/network" initialTabId={tab} />
}

export function ProductCatalogTab() {
  const { tab } = useParams()
  return <DashboardListViewTemplate config={productCatalogConfig} basePath="/product-catalog" initialTabId={tab} />
}
