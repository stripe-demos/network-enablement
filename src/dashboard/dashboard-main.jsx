import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import DashboardApp from './DashboardApp';

createRoot(document.getElementById('dashboard-root')).render(
  <BrowserRouter basename="/dashboard"><DashboardApp /></BrowserRouter>,
);
