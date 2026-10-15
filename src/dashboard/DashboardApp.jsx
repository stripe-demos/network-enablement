import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardConsoleHandoff from './DashboardConsoleHandoff';
import DashboardLayout from './DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import DashboardNotBuilt from './pages/NotBuilt';
import { lazyPage } from './lib/lazyPage';

const DashboardBalances = lazyPage(() => import('./pages/Balances').then(m => m.default));
const DashboardApps = lazyPage(() => import('./pages/AppsOverview').then(m => m.default));
const DashboardComponents = lazyPage(() => import('./pages/component-library/ComponentLibrary').then(m => m.default));
const DashboardTransactions = lazyPage(() => import('./pages/listPages').then(m => m.TransactionsTab));
const DashboardCustomers = lazyPage(() => import('./pages/listPages').then(m => m.CustomersTab));
const DashboardNetwork = lazyPage(() => import('./pages/listPages').then(m => m.NetworkTab));
const DashboardProducts = lazyPage(() => import('./pages/listPages').then(m => m.ProductCatalogTab));
const DashboardEnablement = lazyPage(() => import('./pages/enablement/Enablement').then(m => m.default));
const DashboardPricing = lazyPage(() => import('./pages/pricing/Pricing').then(m => m.default));
const DashboardGrowth = lazyPage(() => import('./pages/growth/Growth').then(m => m.default));

export default function DashboardApp() {
  return <Routes>
    <Route path="/console" element={<DashboardConsoleHandoff />} />
    <Route element={<DashboardLayout />}>
      <Route index element={<DashboardHome />} />
      <Route path="index.html" element={<Navigate to="/" replace />} />
      <Route path="balances" element={<DashboardBalances />} />
      <Route path="components" element={<DashboardComponents />} />
      <Route path="apps" element={<Navigate to="/apps/discover" replace />} />
      <Route path="apps/:tab" element={<DashboardApps />} />
      <Route path="transactions" element={<Navigate to="/transactions/payments" replace />} />
      <Route path="transactions/:tab" element={<DashboardTransactions />} />
      <Route path="customers" element={<Navigate to="/customers/all-customers" replace />} />
      <Route path="customers/:tab" element={<DashboardCustomers />} />
      <Route path="network" element={<Navigate to="/network/all" replace />} />
      <Route path="network/:tab" element={<DashboardNetwork />} />
      <Route path="product-catalog" element={<Navigate to="/product-catalog/all-products" replace />} />
      <Route path="product-catalog/:tab" element={<DashboardProducts />} />
      <Route path="connect/growth" element={<DashboardGrowth />} />
      <Route path="connect/enablement" element={<DashboardEnablement />} />
      <Route path="connect/pricing" element={<DashboardPricing />} />
      <Route path="*" element={<DashboardNotBuilt />} />
    </Route>
  </Routes>;
}
