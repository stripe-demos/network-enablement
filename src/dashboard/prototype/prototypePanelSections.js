// Sections of the prototype control panel (opened from the Developers bar).
// To add a control: write a section component (see
// NetworkOnboardingPrototypeSection.jsx) and append { id, title, Component }
// here. Keep each section's state in its own prototype/*PrototypeControls.js
// module (dashboardStorage, 'dashboard:' event names) so the page it drives can
// subscribe to it.
import NetworkOnboardingPrototypeSection from './NetworkOnboardingPrototypeSection'

export const PROTOTYPE_PANEL_SECTIONS = [
  { id: 'network-onboarding', title: 'Network onboarding', Component: NetworkOnboardingPrototypeSection },
]
