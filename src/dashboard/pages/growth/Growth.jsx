// Connect › Growth ("Platform growth"), from Figma "Connect Growth Studio".
// Three tabs, chosen with ?tab=: Performance (volume, earnings and account
// growth charts), Recommendations (ways to grow margin) and Campaigns (a list
// of campaigns). Each tab's content and header actions live in its own file.
import { useSearchParams } from 'react-router-dom'
import { PageHeader, Tabs } from '@dashboard/ui'
import PerformanceTab, { PerformanceActions } from './PerformanceTab'
import RecommendationsTab from './RecommendationsTab'
import CampaignsTab, { CampaignsActions } from './CampaignsTab'
import EnablementModule from '../../enablement-module/EnablementModule'
import { useEnablementPrototypeControls } from '../../prototype/enablementPrototypeControls'

const TABS = [
  { id: 'performance', label: 'Performance', View: PerformanceTab, Actions: PerformanceActions },
  { id: 'recommendations', label: 'Recommendations', View: RecommendationsTab },
  { id: 'campaigns', label: 'Campaigns', View: CampaignsTab, Actions: CampaignsActions },
]

export default function Growth() {
  const [params, setParams] = useSearchParams()
  // Performance is the default; it has no ?tab= so stale or missing values land there.
  const active = TABS.find(t => t.id === params.get('tab')) ?? TABS[0]
  const setTab = id => setParams(id === TABS[0].id ? {} : { tab: id }, { replace: true })
  const { placement } = useEnablementPrototypeControls()

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Platform growth" actions={active.Actions ? <active.Actions /> : null} />
      {/* Enablement module placement, set in the prototype panel. */}
      {placement === 'growthPage' && (
        <div style={{ marginTop: 16 }}>
          <EnablementModule />
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <Tabs tone="brand" tabs={TABS} value={active.id} onChange={setTab} />
      </div>
      <div style={{ marginTop: 24 }}>
        <active.View />
      </div>
    </div>
  )
}
