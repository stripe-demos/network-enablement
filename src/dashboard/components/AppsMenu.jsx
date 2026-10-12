import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppIcon, AppListItem, AppsIcon, LinkListItem, Popover, StarIcon, TextLink, color, type, useToast } from '@dashboard/ui'
import { installedApps, popularApps } from '../data/apps'

const sectionTitle = { ...type.body, color: color.text }

/** Grid button at the end of the toolbar app cluster, plus the Apps popover it opens. */
export default function AppsMenu() {
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const close = () => setOpen(false)
  const navigate = useNavigate()
  const act = message => () => { toast(message); close() }
  const go = path => () => { navigate(path); close() }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="dashboard-app-chrome__grid"
        aria-label="Apps"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <AppsIcon size={16} />
      </button>

      <Popover
        anchorRef={triggerRef}
        open={open}
        onClose={close}
        label="Apps"
        align="center"
        motion="slide"
        gap={8}
        style={{ width: 380, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', borderRadius: 12, padding: '20px 20px 16px' }}
      >
        <div className="flex items-center justify-between">
          <span style={sectionTitle}>Installed apps</span>
          <TextLink onClick={go('/apps/installed')} style={{ fontWeight: 400 }}>View all</TextLink>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 48px)', justifyContent: 'space-between', rowGap: 24, marginTop: 20 }}>
          {installedApps.map(app => (
            <button key={app.id} type="button" className="dui-app-tile" aria-label={app.name} title={app.name} onClick={act(`Open ${app.name}`)}>
              <AppIcon src={app.icon} name={app.name} badge={app.badge} />
            </button>
          ))}
        </div>

        <div style={{ ...sectionTitle, marginTop: 32 }}>Popular apps</div>
        <div className="flex flex-col" style={{ gap: 24, marginTop: 20 }}>
          {popularApps.map(app => (
            <AppListItem key={app.id} {...app} onAction={act(`Installing ${app.name}`)} />
          ))}
        </div>

        <div style={{ height: 1, background: color.neutral50, margin: '24px 0 12px' }} />
        <div className="flex flex-col" style={{ gap: 4 }}>
          <LinkListItem icon={<StarIcon size={20} />} title="Perks" description="Save money on business tools" onClick={act('Perks')} />
          <LinkListItem icon={<AppsIcon size={20} />} title="Discover more apps" description="Save time and streamline your business" onClick={go('/apps/discover')} />
        </div>
      </Popover>
    </>
  )
}
