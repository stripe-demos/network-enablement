// Apps overview (/apps/:tab) — Discover, Installed, Created, Connect extensions.
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AppListItem, AppsIcon, Button, Card, EmptyState, FadeSlideIn, PageHeader, SectionHeader, Tabs, color, useToast } from '@dashboard/ui'
import { installedApps, recommendedApps } from '../data/apps'

const TABS = [
  { id: 'discover', label: 'Discover' },
  { id: 'installed', label: 'Installed' },
  { id: 'created', label: 'Created' },
  { id: 'connect-extensions', label: 'Connect extensions' },
]

const groupTitle = { fontSize: 13, fontWeight: 600, lineHeight: '18px', letterSpacing: -0.08, color: color.text }

function AppGroup({ title, apps, onInstall }) {
  return (
    <div>
      <div style={groupTitle}>{title}</div>
      <div className="flex flex-col" style={{ gap: 24, marginTop: 12 }}>
        {apps.map(app => <AppListItem key={app.id} size="sm" {...app} onAction={() => onInstall(app)} />)}
      </div>
    </div>
  )
}

function Discover({ onInstall }) {
  const { popular, new: newApps, startups } = recommendedApps
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', columnGap: 32, rowGap: 12, alignItems: 'start' }}>
      <SectionHeader title="Recommended apps" size="md" divider={false} style={{ gridColumn: '1 / 3' }} />
      <div style={{ gridColumn: 3, gridRow: '1 / 3' }}>
        <Card bordered eyebrow={startups.eyebrow} style={{ padding: '14px 14px 24px', borderRadius: 6 }}>
          <AppGroup title={startups.title} apps={startups.apps} onInstall={onInstall} />
        </Card>
      </div>
      <AppGroup {...popular} onInstall={onInstall} />
      <AppGroup {...newApps} onInstall={onInstall} />
    </div>
  )
}

function Installed({ onOpen }) {
  return (
    <>
      <SectionHeader title={`${installedApps.length} installed apps`} size="md" divider={false} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', columnGap: 32, rowGap: 24, marginTop: 16 }}>
        {installedApps.map(app => <AppListItem key={app.id} size="sm" {...app} actionLabel="Open" onAction={() => onOpen(app)} />)}
      </div>
    </>
  )
}

export default function AppsOverview() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  if (!TABS.some(t => t.id === tab)) return <Navigate to="/apps/discover" replace />

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Apps overview" />
      <div style={{ marginTop: 4 }}>
        <Tabs tone="brand" tabs={TABS} value={tab} onChange={id => navigate(`/apps/${id}`)} />
      </div>
      <FadeSlideIn transitionKey={tab} style={{ marginTop: 32 }}>
        {tab === 'discover' && <Discover onInstall={app => toast(`Installing ${app.name}`)} />}
        {tab === 'installed' && <Installed onOpen={app => toast(`Open ${app.name}`)} />}
        {tab === 'created' && (
          <EmptyState
            icon={<span style={{ color: color.subdued }}><AppsIcon size={20} /></span>}
            title="You haven't created any apps"
            description="Build an app to extend the Dashboard with your own tools and workflows."
            action={<Button variant="primary" onClick={() => toast('Create an app')}>Create an app</Button>}
          />
        )}
        {tab === 'connect-extensions' && (
          <EmptyState
            title="No Connect extensions yet"
            description="Extensions add functionality to your connected accounts' Dashboards."
            action={<Button onClick={() => toast('Learn about extensions')}>Learn more</Button>}
          />
        )}
      </FadeSlideIn>
    </div>
  )
}
