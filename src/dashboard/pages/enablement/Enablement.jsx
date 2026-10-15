// Connect › Enablement — configure what connected accounts see. Ported from the
// unbundle-connect prototype's Enablement page, rebuilt on @dashboard/ui.
// The page shows as a wireframe by default (`data-wireframe-default`), except
// its header and the Enablement module (when that placement is on).
import { useSearchParams } from 'react-router-dom'
import { PageHeader, Tabs } from '@dashboard/ui'
import EnablementModule from '../../enablement-module/EnablementModule'
import { useEnablementPrototypeControls } from '../../prototype/enablementPrototypeControls'
import PerformanceView from './PerformanceView'
import BrandingView from './BrandingView'
import OnboardingView from './OnboardingView'
import FeaturesView from './FeaturesView'
import CommunicationView from './CommunicationView'

const TABS = [
  { id: 'performance', label: 'Performance', View: PerformanceView },
  { id: 'branding', label: 'Branding', View: BrandingView },
  { id: 'onboarding', label: 'Onboarding', View: OnboardingView },
  { id: 'features', label: 'Features', View: FeaturesView },
  { id: 'communication', label: 'Communication', View: CommunicationView },
]

export default function Enablement() {
  const [params, setParams] = useSearchParams()
  // Performance is the default; it has no ?tab= so stale or missing values land there.
  const active = TABS.find(t => t.id === params.get('tab')) ?? TABS[0]
  const setTab = (id) => setParams(id === TABS[0].id ? {} : { tab: id }, { replace: true })
  const { placement } = useEnablementPrototypeControls()

  return (
    <div data-wireframe-default="" style={{ paddingBottom: 80 }}>
      <div data-wireframe-show="">
        <PageHeader
          title="Enablement"
          description="Configure branding, onboarding, features, and communications for connected accounts."
        />
        {placement === 'enablementPage' && (
          <div style={{ marginTop: 16 }}>
            <EnablementModule />
          </div>
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        <Tabs tone="brand" tabs={TABS} value={active.id} onChange={setTab} />
      </div>
      <div style={{ marginTop: 16 }}>
        <active.View />
      </div>
    </div>
  )
}
