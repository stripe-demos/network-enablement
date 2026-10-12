'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePrototype } from '@dashboard/contexts/PrototypeContext';
import DashboardHomeSearch from './DashboardHomeSearch';
import AppsMenu from './AppsMenu';
import { ActionMenu } from '@dashboard/ui/ActionMenu';
import { NotificationsMenu } from '@dashboard/ui/NotificationsMenu';
import { DocumentIcon, InvoiceIcon, LinkIcon, PayoutIcon, SubscriptionIcon } from '@dashboard/ui/icons';
import { notifications } from '../data/notifications';
import { HOME_CONTENT_GUTTER, cappedGutter, isListViewPath } from '../constants/layout';

const ThinkingIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9.75" cy="2.25" r="1.125" fill="currentColor"/>
    <circle cx="6"    cy="2.25" r="0.75"  fill="currentColor"/>
    <circle cx="2.25" cy="2.25" r="0.75"  fill="currentColor"/>
    <circle cx="9.75" cy="9.75" r="0.75"  fill="currentColor"/>
    <circle cx="6"    cy="9.75" r="0.75"  fill="currentColor"/>
    <circle cx="2.25" cy="9.75" r="1.125" fill="currentColor"/>
    <circle cx="9.75" cy="6"    r="0.75"  fill="currentColor"/>
    <circle cx="6"    cy="6"    r="1.125" fill="currentColor"/>
    <circle cx="2.25" cy="6"    r="0.75"  fill="currentColor"/>
  </svg>
);

const ChevronDownSmall = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="#2D2D6B" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function AppChromeCluster() {
  return (
    <div className="dashboard-app-chrome">
      <span className="dashboard-app-chrome__tile dashboard-app-chrome__tile--primary" aria-hidden="true">
        <img src="/dashboard-assets/icons/app3.svg" alt="" />
      </span>
      <span className="dashboard-app-chrome__tile dashboard-app-chrome__tile--zapier" aria-hidden="true">zapier</span>
      <span className="dashboard-app-chrome__dot" aria-hidden="true" />
      <span className="dashboard-app-chrome__tile" aria-hidden="true">
        <img src="/dashboard-assets/icons/app2.svg" alt="" />
      </span>
      <span className="dashboard-app-chrome__dot" aria-hidden="true" />
      <AppsMenu />
    </div>
  );
}

const CREATE_ITEMS = [
  { label: 'Invoice', icon: <InvoiceIcon />, shortcut: ['c', 'i'] },
  { label: 'Subscription', icon: <SubscriptionIcon />, shortcut: ['c', 's'] },
  { label: 'Contract', icon: <DocumentIcon />, shortcut: ['c', 'c'] },
  { label: 'Payment link', icon: <LinkIcon />, shortcut: ['c', 'l'] },
  { label: 'Payout', icon: <PayoutIcon />, shortcut: ['c', 'o'] },
];

type ToolbarMenu = 'notifications' | 'create' | null;

/** Help, notifications, settings, and create, with the bell and "+" dropdowns. */
function ToolbarActions() {
  const [menu, setMenu] = useState<ToolbarMenu>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const createRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMenu(null), []);
  const toggle = (next: ToolbarMenu) => setMenu((m) => (m === next ? null : next));
  const openClass = (name: ToolbarMenu) => (menu === name ? ' dashboard-toolbar-action--open' : '');

  return (
    <div className="dashboard-toolbar-actions ml-auto">
      <AppChromeCluster />
      <button className="dashboard-toolbar-action group" aria-label="Help">
        <div className="absolute inset-0 rounded-full group-hover:bg-[#f5f6f8] transition-colors" />
        <img src="/dashboard-assets/icons/Help.svg" width="16" height="16" alt="" className="relative shrink-0" />
      </button>
      <button
        ref={bellRef}
        className={`dashboard-toolbar-action dashboard-toolbar-action--notifications group${openClass('notifications')}`}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={menu === 'notifications'}
        onClick={() => toggle('notifications')}
      >
        <div className="absolute inset-0 rounded-full group-hover:bg-[#f5f6f8] transition-colors" />
        <img src="/dashboard-assets/icons/Notifications.svg" width="16" height="16" alt="" className="relative shrink-0" />
      </button>
      <button className="dashboard-toolbar-action group" aria-label="Settings">
        <div className="absolute inset-0 rounded-full group-hover:bg-[#f5f6f8] transition-colors" />
        <img src="/dashboard-assets/icons/Settings.svg" width="16" height="16" alt="" className="relative shrink-0" />
      </button>
      <button
        ref={createRef}
        className={`dashboard-toolbar-action dashboard-toolbar-action--create group${openClass('create')}`}
        aria-label="Create"
        aria-haspopup="menu"
        aria-expanded={menu === 'create'}
        onClick={() => toggle('create')}
      >
        <div className="absolute inset-0 rounded-full group-hover:bg-[#f5f6f8] transition-colors" />
        <img src="/dashboard-assets/icons/Create.svg" width="20" height="20" alt="" className="relative shrink-0" />
      </button>
      <NotificationsMenu anchorRef={bellRef} open={menu === 'notifications'} onClose={close} notifications={notifications} />
      <ActionMenu anchorRef={createRef} open={menu === 'create'} onClose={close} items={CREATE_ITEMS} label="Create" />
    </div>
  );
}

export default function DashboardToolbar() {
  const pathname = usePathname();
  const { version, setConsoleAnchor } = usePrototype();
  const consoleBtnRef = useRef<HTMLButtonElement>(null);

  // Keep anchor in sync with button position whenever page changes
  useEffect(() => {
    if (version !== 'v1') return;
    const update = () => {
      const rect = consoleBtnRef.current?.getBoundingClientRect();
      if (rect) {
        const x = Math.max(8, Math.min(rect.right - 360, window.innerWidth - 360 - 8));
        setConsoleAnchor({ x, y: rect.bottom + 8 });
      }
    };
    // small delay so the DOM has settled after navigation
    const id = setTimeout(update, 50);
    return () => clearTimeout(id);
  }, [pathname, version, setConsoleAnchor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== '/') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.dispatchEvent(new CustomEvent('dashboard-focus-search'));
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  const isHome = pathname === '/' || pathname === '/onsite-home';

  if (pathname === '/docs' || pathname === '/invoices/draft') return null;

  if (isHome) {

    return (
      <div
        className="h-[60px] w-full dashboard-toolbar--home"
        style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', overflow: 'visible' }}
      >
        <div
          className="flex items-start justify-between gap-[24px] h-full w-full"
          style={{ padding: `12px ${cappedGutter(HOME_CONTENT_GUTTER)} 0` }}
        >
          <div className="dashboard-toolbar-dedicated-search">
            <DashboardHomeSearch fixedMode="search" compact stickyActive />
          </div>
          <ToolbarActions />
        </div>
      </div>
    );
  }

  return (
    <div
      className="dashboard-toolbar--chrome flex items-center gap-[24px] h-[60px] w-full"
      style={{ fontFamily: 'SF Pro Text, system-ui, -apple-system, sans-serif', position: 'relative', zIndex: 200, overflow: 'visible', paddingInline: isListViewPath(pathname) ? 24 : cappedGutter(24) }}
    >
      {/* Search */}
      <div className="dashboard-toolbar-dedicated-search">
        <DashboardHomeSearch fixedMode="search" compact stickyActive />
      </div>

      <ToolbarActions />
    </div>
  );
}
