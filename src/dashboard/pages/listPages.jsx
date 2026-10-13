import { useParams } from 'react-router-dom'
import DashboardListViewTemplate from '@dashboard/components/DashboardListViewTemplate'
import transactionsConfig from '@dashboard/app/transactions/config'
import customersConfig from '@dashboard/app/customers/config'
import networkConfig from '@dashboard/app/network/config'
import productCatalogConfig from '@dashboard/app/product-catalog/config'

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

export function NetworkTab() {
  const { tab } = useParams()
  return <DashboardListViewTemplate config={networkConfig} basePath="/network" initialTabId={tab} />
}

export function ProductCatalogTab() {
  const { tab } = useParams()
  return <DashboardListViewTemplate config={productCatalogConfig} basePath="/product-catalog" initialTabId={tab} />
}
