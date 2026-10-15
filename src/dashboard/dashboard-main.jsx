import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import DashboardApp from './DashboardApp';
import { consumeDashboardHandoff } from '../integration/consoleHandoff';
import { saveNetworkOnboarding } from './pages/network/networkInvites';

// Console can hand back a network onboarding finished in conversation.
const handoff = consumeDashboardHandoff(window.history);
if (handoff?.networkOnboarding) saveNetworkOnboarding(handoff.networkOnboarding);

createRoot(document.getElementById('dashboard-root')).render(
  <BrowserRouter basename="/dashboard"><DashboardApp /></BrowserRouter>,
);
