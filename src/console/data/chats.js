import { WELCOME_ARTIFACT_IDS } from './welcome';

// Chat metadata seeded into the sidebar.
// Order matters — first item is the default selection.
//
// Which conversation body a chat renders is decided in ConversationPanel:
//   kind: 'patterns'            → ChatPatternsConversation
//   kind: 'interactive-canvas'  → InteractiveCanvasConversation
//   id:   'suspicious-refunds'  → SuspiciousRefundsConversation
//   rich: true                  → RichConversation
//   otherwise                   → SimpleConversation
//
// No chat sets `kind` today, so the first two bodies aren't reachable from the
// running prototype — add `kind` here to bring one back.

export const SEED_CHATS = [
  {
    id: 'failed-payments',
    title: 'Failed payments over $500',
    timestamp: 'Today · 2:38 PM',
    rich: true,
    artifactIds: ['multi4', 'table', 'text', 'chart', 'multi2', 'multi3', 'ext01', 'ext03', 'ext04', 'ext05', 'ext06', 'ext08', 'ext09', 'inline02'],
  },
  {
    id: 'suspicious-refunds',
    stickyComposer: true,
    title: 'Suspicious refund activity',
    timestamp: 'Today · 11:05 AM',
    rich: true,
    canvasEmpty: true,
    artifactIds: ['refund-trend', 'refund-table', 'refund-report', 'refund-bins', 'refund-query'],
  },
  {
    id: 'mrr-breakdown',
    stickyComposer: true,
    title: 'MRR breakdown by plan',
    timestamp: 'Today · 9:12 AM',
    rich: false,
    artifactIds: [],
  },
  {
    id: 'customer-investigation',
    stickyComposer: true,
    title: 'Acme Corp charge disputes',
    timestamp: 'Yesterday · 8:16 AM',
    rich: false,
    artifactIds: [],
  },
  {
    id: 'welcome-to-console',
    title: 'Welcome to Console',
    timestamp: 'Yesterday · 9:00 AM',
    kind: 'welcome',
    rich: true,
    stickyComposer: true,
    canvasTabs: WELCOME_ARTIFACT_IDS,
    artifactIds: WELCOME_ARTIFACT_IDS,
  },
];
