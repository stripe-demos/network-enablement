// Sections of the prototype control panel (opened from the Developers bar).
// To add a control: write a section component (see
// NetworkOnboardingPrototypeSection.jsx) and append { id, title, Component }
// here. Keep each section's state in its own prototype/*PrototypeControls.js
// module (dashboardStorage, 'dashboard:' event names) so the page it drives can
// subscribe to it.
import NetworkOnboardingPrototypeSection from './NetworkOnboardingPrototypeSection'
import EnablementModulePrototypeSection from './EnablementModulePrototypeSection'

export const PROTOTYPE_PANEL_SECTIONS = [
  { id: 'network-onboarding', title: 'Grow with the network', Component: NetworkOnboardingPrototypeSection },
  { id: 'enablement-module', title: 'Enablement module', Component: EnablementModulePrototypeSection },
]
