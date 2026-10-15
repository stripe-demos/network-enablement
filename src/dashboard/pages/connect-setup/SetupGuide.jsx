// The floating Setup guide on Home (ported from connect-onboarding's
// sail/SetupGuide.jsx and prototype4's setup sections). Only "Get started on
// Connect" is live: it opens the Connect setup dialog. The other sections
// mirror the Dashboard's setup guide so the floatie reads as the real thing.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { color, font } from '@dashboard/ui';
import { Icon } from './components/Icon';
import { useConnectSetup } from './connectSetupStore';
import { openConnectSetup } from './openConnectSetup';
import { GUIDE_BOTTOM, GUIDE_RIGHT, GUIDE_WIDTH, useFloatieStackNode } from './floatieStackNode';
import { useEnablementPrototypeControls } from '../../prototype/enablementPrototypeControls';

const SHADOW = '0px 5px 15px 0px rgba(0, 0, 0, 0.12), 0px 15px 35px 0px rgba(48, 49, 61, 0.08)';

function SectionItem({ label, complete, disabled, onAction }) {
  return (
    <div
      className={`flex items-center justify-between py-2 px-2 rounded-lg group hover:bg-neutral-50 transition-colors ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
      onClick={!disabled ? onAction : undefined}
    >
      <div className="flex items-center">
        {complete ? (
          <Icon name="checkCircleFilled" className="size-[10px] mr-[12px] text-brand shrink-0" />
        ) : disabled ? (
          // Circle with a slash — the design's "not available yet" marker.
          <svg viewBox="0 0 12 12" className="size-[10px] mr-[12px] text-icon-subdued shrink-0" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <circle cx="6" cy="6" r="5.4" />
            <path d="M2.2 9.8 9.8 2.2" />
          </svg>
        ) : (
          <div className="size-[10px] mr-[12px] rounded-full bg-neutral-200 shrink-0" />
        )}
        <span className={`text-body-small ${disabled ? 'text-subdued' : 'text-default'}`}>{label}</span>
      </div>
    </div>
  );
}

function SectionBlock({ id, title, icon, collapsible = true, locked, items = [], expanded, onToggle, onItemAction }) {
  const complete = items.length > 0 && items.every((item) => item.complete);

  return (
    <div className={`transition-colors duration-200 rounded-lg ${expanded ? 'bg-offset' : ''}`}>
      <button
        type="button"
        className="flex items-center justify-between w-full py-2 px-3 text-left"
        onClick={() => collapsible && !locked && onToggle(expanded ? null : id)}
      >
        <span className="flex items-center gap-[8px] min-w-0">
          {icon && <span className="inline-flex shrink-0 text-icon-subdued" aria-hidden="true">{icon}</span>}
          <span className={`text-label-medium-emphasized ${complete ? 'line-through text-subdued' : 'text-default'}`}>{title}</span>
        </span>
        {locked && (
          <Icon name="lock" className="size-[12px] text-icon-subdued" />
        )}
        {collapsible && !locked && (
          <Icon
            name="chevronDown"
            className={`size-[10px] text-icon-subdued transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {collapsible && !locked && items.length > 0 && (
        <div
          className={`grid transition-[grid-template-rows] duration-200 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="px-1 pb-1">
              {items.map((item) => (
                <SectionItem
                  key={item.id}
                  label={item.label}
                  complete={item.complete}
                  disabled={locked || item.disabled}
                  onAction={() => onItemAction?.(item.id, id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The floating panel. P4's sandbox intro and gradient beside it are left out:
 * they covered the Dashboard Home's charts.
 * Manages its own collapsed/expanded UI state; completion comes in `sections`.
 * Also used by the Enablement floatie (enablement-module/EnablementFloatie.jsx).
 * Portals into the shared FloatieStack (falls back to fixed on <body> before
 * the stack has mounted).
 *   sections — [{ id, title, icon?, collapsible?, locked?, items: [{ id, label, complete?, disabled? }] }]
 *   onItemClick(itemId, sectionId)
 *   progress — optional 0–1 fraction for the bar under the title
 *   progressLabel — optional count shown beside the title ("1 of 7")
 *   defaultCollapsed — start as just the header bar
 *   tone — 'default' | 'enablement' (flag, brand title, brand wash and ring;
 *          sits above the Setup guide in the stack)
 */
export function SetupGuidePanel({
  sections = [],
  onItemClick,
  title = 'Setup guide',
  defaultExpandedSection,
  progress,
  progressLabel,
  defaultCollapsed = false,
  tone = 'default',
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedSection, setExpandedSection] = useState(
    defaultExpandedSection ?? sections[0]?.id ?? null
  );

  const stack = useFloatieStackNode();
  const enablement = tone === 'enablement';

  const card = (
    <div
      className={`${stack ? '' : 'fixed z-40 '}bg-surface rounded-xl overflow-hidden`}
      style={{
        ...(stack ? {} : { right: GUIDE_RIGHT, bottom: GUIDE_BOTTOM, width: GUIDE_WIDTH }),
        // Enablement sits above the Setup guide in the stack.
        order: enablement ? 0 : 1,
        pointerEvents: 'auto',
        boxShadow: enablement ? `0 0 0 1px ${color.brand50}, ${SHADOW}` : SHADOW,
      }}
    >
      {/* Header and progress; the Enablement tone puts a brand wash behind them. */}
      <div style={enablement ? { background: `linear-gradient(180deg, ${color.brand50} 0%, ${color.surface} 100%)` } : undefined}>
        {/* Header */}
        <div className="flex items-center justify-between gap-[8px] px-4 py-2">
          <span className="flex items-center gap-[8px] min-w-0">
            {enablement && <img src="/dashboard-assets/enablement/checklist-flag.svg" alt="" className="block shrink-0" />}
            <span className={`text-label-medium-emphasized${enablement ? '' : ' text-default'}`} style={enablement ? { color: color.actionPrimary } : undefined}>{title}</span>
          </span>
          {progressLabel && !collapsed && (
            <span className="ml-auto text-body-small text-subdued whitespace-nowrap">{progressLabel}</span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title.toLowerCase()}`}
            aria-expanded={!collapsed}
            className="cursor-pointer"
          >
            <Icon name={collapsed ? 'chevronUp' : 'cancel'} className="size-[12px] text-icon-subdued" />
          </button>
        </div>

        {progress != null && !collapsed && (
          <div className="mx-4 mb-2 h-[3px] rounded-full bg-hairline overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="py-1 px-1">
          {sections.map((section) => (
            <SectionBlock
              key={section.id}
              {...section}
              expanded={expandedSection === section.id}
              onToggle={setExpandedSection}
              onItemAction={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (stack) return createPortal(card, stack);
  // Before the stack mounts: fixed on <body>, as the guide used to be.
  return createPortal(
    <div data-wireframe-show="" className="text-default" style={{ fontFamily: font.text, WebkitFontSmoothing: 'antialiased' }}>
      {card}
    </div>,
    document.body
  );
}

export default function SetupGuide() {
  const { setupComplete } = useConnectSetup();
  // Matches EnablementFloatie's condition: when it appears above, start collapsed.
  const enablementShown = useEnablementPrototypeControls().placement === 'floatie' && setupComplete;

  const sections = [
    {
      id: 'connect',
      title: 'Set up Connect',
      items: [{ id: 'get-started-connect', label: 'Get started on Connect', complete: setupComplete }],
    },
    {
      id: 'invoices',
      title: 'Set up invoices',
      items: [{ id: 'create-invoice', label: 'Create your first invoice', disabled: true }],
    },
    {
      id: 'verify',
      title: 'Verify your account',
      items: [{ id: 'verify-business', label: 'Add business details', disabled: true }],
    },
    { id: 'business-accounts', title: 'Set up business accounts', locked: true, items: [] },
  ];

  return (
    <SetupGuidePanel
      key={enablementShown ? 'collapsed' : 'open'}
      defaultCollapsed={enablementShown}
      sections={sections}
      defaultExpandedSection="connect"
      progress={setupComplete ? 0.2 : 0.05}
      onItemClick={(itemId) => {
        if (itemId === 'get-started-connect') openConnectSetup();
      }}
    />
  );
}
