import { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { SettingsSidebar } from '../components/Settings/SettingsSidebar';
import { PreferencesPage } from '../components/Settings/PreferencesPage';
import { ConversationPanel } from '../components/Conversation/ConversationPanel';
import { Canvas } from '../components/Canvas/Canvas';
import { CANVAS_TAB_ORDER } from '../components/Canvas/canvasTabOrder';
import { expandTabIdsWithPanels, getParentTabId } from '../components/Canvas/canvasArtifactRegistry';
import { ResizeHandle } from '../components/Layout/ResizeHandle';
import { useVariants } from '../variants/useVariants';
import { useTheme } from '../contexts/useTheme';

import { SEED_CHATS } from '../data/chats';
import { isTaskRunning } from '../data/chartPreparation';
import { useSimulatedResponses } from '../components/Conversation/useSimulatedResponses';

const loadDesignSystem = () => import('../components/Settings/DesignSystemPage');
const DesignSystemPage = lazy(() => loadDesignSystem().then(module => ({ default: module.DesignSystemPage })));

const EMPTY_CANVAS = { tabIds: [], activeTab: null };

function initialCanvas(chat) {
  if (chat.canvasEmpty || !chat.rich) return EMPTY_CANVAS;
  const tabIds = chat.canvasTabs ?? CANVAS_TAB_ORDER;
  return { tabIds: [...tabIds], activeTab: tabIds[0] ?? null };
}

// Each "New conversation" gets its own unique id rather than a single
// shared constant so a still-collapsing pending chat (animating out
// after dismiss) can coexist with a freshly-created one — without
// React seeing two rows with identical keys. The downstream code
// already compares against `pendingNewChatId` from state, so the id's
// exact shape doesn't matter beyond uniqueness.
function makePendingId() {
  return `__pending_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

// Shallow order-sensitive array equality — lets state setters bail out when a
// recomputed list is value-identical to the previous one, avoiding needless
// re-renders (and the feedback loop they can create with child effects).
function arraysEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
// Pixel clamps for the conversation panel. The panel is now sized in
// absolute pixels (not a flex ratio) so the canvas — not the conv —
// shrinks when the sidebar rail expands from 60 → 230. The clamps
// keep the panel readable (≥320), keep the canvas usable (≥320),
// and keep the conv from blowing past the chat content's visual cap
// (≤900, matching #messagesList's max-width).
const MIN_CONV_PX = 320;
const MAX_CONV_PX = 900;
const MIN_CANVAS_PX = 320;
// Initial conv width: 40% of the current usable space (typical
// desktop ≈ 480-520px), clamped to the same min/max bounds the drag
// handle uses. SSR fallback uses a sensible middle value.
function computeBaselineConvWidth() {
  if (typeof window === 'undefined') return 480;
  const usable = window.innerWidth - 60 - 4;
  const proportional = 0.4 * usable;
  return Math.max(MIN_CONV_PX, Math.min(MAX_CONV_PX, proportional));
}

export default function Home({ mentionVariant = 'inline', initialSubmission = null }) {
  // `elementOverrides` + `layoutFlags` feed the actual render path so a
  // designer-added variant transparently replaces the matching slot.
  const variants = useVariants();
  const { layoutFlags, elementOverrides } = variants;
  // Layout flag is the one piece of pre-existing state that maps onto the
  // variants system. Absence of the 'large' flag = 'default' (Small layout).
  const layout = layoutFlags.has('large') ? 'large' : 'default';
  const { theme, setTheme } = useTheme();

  function handleSlashCommand(commandId) {
    if (commandId === 'new-conversation') {
      handleNewChat();
    } else if (commandId === 'theme') {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  }

  // Fresh entry: when arriving from the Dashboard (via ?new=1) start Console
  // with a blank conversation + empty canvas + focused input, instead of the
  // seed demo chat. Reuses the existing pending-new-chat plumbing (a pending
  // chat is rich:false, so the Canvas shows CanvasEmptyState and the
  // ConversationPanel renders blank; PromptInput auto-focuses on chat switch).
  const [freshEntry] = useState(() =>
    typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('new') === '1',
  );
  // The entry point consumes the explicit cross-surface handoff once. It never
  // reads Dashboard UI state or imports Dashboard components.
  const pendingSubmission = freshEntry ? initialSubmission : null;
  // A submission (the user typed a query + hit return in the launcher) arrives
  // already "sent": we open Console with the user message populated + a reply,
  // rather than a blank pending chat.
  const hasSubmission = !!(pendingSubmission && (pendingSubmission.prompt || pendingSubmission.thumbnail));

  const [freshChat] = useState(() =>
    freshEntry
      ? {
          id: makePendingId(),
          title: hasSubmission
            ? (pendingSubmission.prompt?.slice(0, 40) || pendingSubmission.artifactLabel || 'New conversation')
            : 'New conversation',
          timestamp: 'Just now',
          rich: false,
          kind: hasSubmission ? 'simulation' : undefined,
          isNewConversation: true,
          // With a submission the chat is a real (non-pending) conversation so
          // it renders the message + reply; without one it stays a blank pending
          // new chat (centered empty state + dismiss X).
          pending: !hasSubmission,
          canvasEmpty: true,
          // Arriving from the Dashboard: the row is present at initial page
          // load, so it must NOT run the "new chat" entrance grow/fade — that
          // animation is only for chats created in-session via "New conversation".
          noEntranceAnim: true,
        }
      : null,
  );

  const [chats, setChats] = useState(() => (freshChat ? [freshChat, ...SEED_CHATS] : SEED_CHATS));
  const [activeChatId, setActiveChatId] = useState(() => (freshChat ? freshChat.id : SEED_CHATS[0].id));
  const [pendingNewChatId, setPendingNewChatId] = useState(() =>
    freshChat && !hasSubmission ? freshChat.id : null,
  );
  const [canvases, setCanvases] = useState(() => Object.fromEntries(chats.map(chat => [chat.id, initialCanvas(chat)])));
  const { tabIds: visibleCanvasTabIds, activeTab } = canvases[activeChatId] ?? EMPTY_CANVAS;
  const setVisibleCanvasTabIds = useCallback(update => {
    setCanvases(previous => {
      const current = previous[activeChatId] ?? EMPTY_CANVAS;
      const tabIds = typeof update === 'function' ? update(current.tabIds) : update;
      return tabIds === current.tabIds ? previous : { ...previous, [activeChatId]: { ...current, tabIds } };
    });
  }, [activeChatId, setCanvases]);
  const setActiveTab = useCallback(update => {
    setCanvases(previous => {
      const current = previous[activeChatId] ?? EMPTY_CANVAS;
      const tab = typeof update === 'function' ? update(current.activeTab) : update;
      return tab === current.activeTab ? previous : { ...previous, [activeChatId]: { ...current, activeTab: tab } };
    });
  }, [activeChatId, setCanvases]);
  const handleArtifactReady = useCallback((chatId, result) => {
    setCanvases(previous => {
      const current = previous[chatId] ?? EMPTY_CANVAS;
      const tabIds = current.tabIds.includes(result.artifactId) ? current.tabIds : [...current.tabIds, result.artifactId];
      return { ...previous, [chatId]: { tabIds, activeTab: result.artifactId } };
    });
  }, [setCanvases]);
  const [convWidth, setConvWidth] = useState(computeBaselineConvWidth);
  // Chats whose row is currently animating out in the sidebar. Kept
  // separate from `chats` so the row can stay rendered (collapsing)
  // even though the rest of the app — the conv panel, the active
  // chat — has already moved past it. The sidebar's ChatItem reads
  // this via its `isDeleting` prop and calls back into
  // handleFinalizeDelete when the collapse transition ends.
  const [deletingChatIds, setDeletingChatIds] = useState(() => new Set());
  // Tracks an in-progress rename. `source` is the surface that
  // triggered it ('sidebar' | 'header'); the only render-time
  // difference is that the header surface also swaps its kebab
  // button for an X close button while editing. Both targets watch
  // `id` to decide whether to render their RenameInput.
  const [renamingChat, setRenamingChat] = useState(null);
  const [view, setView] = useState('console'); // 'console' | 'settings'
  const [settingsItem, setSettingsItem] = useState('memory');

  // Slot map: each entry is the default component, transparently replaced
  // by a designer-added element variant when one targets the same slot.
  const SidebarSlot = elementOverrides.Sidebar || Sidebar;
  const ConversationPanelSlot = elementOverrides.ConversationPanel || ConversationPanel;
  const CanvasSlot = elementOverrides.Canvas || Canvas;
  const responses = useSimulatedResponses({
    initialSubmission: freshChat && hasSubmission ? {
      chatId: freshChat.id,
      turn: {
        user: pendingSubmission.prompt || '',
        userThumbnail: pendingSubmission.thumbnail || null,
        entrance: true,
      },
    } : null,
    onArtifactReady: handleArtifactReady,
  });
  const extraTurns = responses.turns;
  const chatPhases = useMemo(() => Object.fromEntries(
    Object.entries(extraTurns).map(([chatId, turns]) => [chatId, turns.at(-1)?.taskPhase]),
  ), [extraTurns]);
  const [mentionedTabIds, setMentionedTabIds] = useState([]);
  const [openingChatId, setOpeningChatId] = useState(null);
  useEffect(() => {
    if (!openingChatId) return;
    const timer = setTimeout(() => setOpeningChatId(null), 600);
    return () => clearTimeout(timer);
  }, [openingChatId]);
  const [mentionedRawIds, setMentionedRawIds] = useState([]);
  // Legacy path: a reference with no typed query seeds an "@<label>" mention
  // chip into the blank conversation's input. When there's a full submission we
  // populate a sent message instead (see extraTurns above), so skip the chip.
  const [cmdLPendingChip, setCmdLPendingChip] = useState(() => {
    if (hasSubmission) return null;
    const ref = pendingSubmission;
    if (ref?.artifactLabel) return { type: 'artifact', artifactLabel: ref.artifactLabel };
    return null;
  });
  const appRef = useRef(null);

  useEffect(() => {
    document.body.setAttribute('data-layout', layout);
  }, [layout]);

  // Drop the ?new=1 marker from the URL once consumed, so the address bar
  // stays clean and a manual reload of /console shows the standalone demo.
  useEffect(() => {
    if (!freshEntry || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('new');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, [freshEntry]);

  useEffect(() => {
    let raf = null;
    function onResize() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        setConvWidth(computeBaselineConvWidth());
      });
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  function handleExpandToCanvas(tabId) {
    setVisibleCanvasTabIds((prev) => {
      if (prev.includes(tabId)) return prev;
      return [tabId, ...prev];
    });
    setActiveTab(tabId);
  }

  // Opens a Sigma query as a canvas tab from an expanded source list. The tab
  // is inserted just after the multi-chart so it reads as a companion to the
  // result it backs, rather than jumping to the front.
  function handleOpenSourceTab(tabId) {
    setVisibleCanvasTabIds((prev) => {
      if (prev.includes(tabId)) return prev;
      const multi4Idx = prev.indexOf('multi4');
      const insertIdx = multi4Idx >= 0 ? multi4Idx + 1 : 0;
      const next = [...prev];
      next.splice(insertIdx, 0, tabId);
      return next;
    });
    setActiveTab(tabId);
  }

  // Expands a multi-chart panel as a new standalone tab, inserted immediately
  // to the right of the current active tab (the multi-chart it came from).
  function handleExpandPanelToRight(newId) {
    setVisibleCanvasTabIds((prev) => {
      if (prev.includes(newId)) return prev;
      const idx = prev.indexOf(activeTab);
      if (idx === -1) return [...prev, newId];
      const next = [...prev];
      next.splice(idx + 1, 0, newId);
      return next;
    });
    setActiveTab(newId);
  }

  // When a multi-chart is reduced to 1 panel, replace it in-place with a
  // standalone single-chart tab. Atomic so two setVisibleCanvasTabIds don't race.
  function handleCollapseMultiChart(newId, multiTabId) {
    setVisibleCanvasTabIds((prev) => {
      if (prev.includes(newId)) return prev.filter((id) => id !== multiTabId);
      const idx = prev.indexOf(multiTabId);
      const next = prev.filter((id) => id !== multiTabId);
      if (idx !== -1) next.splice(Math.min(idx, next.length), 0, newId);
      else next.push(newId);
      return next;
    });
    setActiveTab(newId);
  }

  function handleCloseCanvasTab(tabId) {
    if (!visibleCanvasTabIds.includes(tabId)) return;
    const next = visibleCanvasTabIds.filter((id) => id !== tabId);
    let nextActive = activeTab;
    if (activeTab === tabId) {
      const order = CANVAS_TAB_ORDER;
      const oldIdx = order.indexOf(tabId);
      let picked = null;
      for (let i = oldIdx + 1; i < order.length; i++) {
        if (next.includes(order[i])) {
          picked = order[i];
          break;
        }
      }
      if (!picked) {
        for (let i = oldIdx - 1; i >= 0; i--) {
          if (next.includes(order[i])) {
            picked = order[i];
            break;
          }
        }
      }
      nextActive = picked ?? next[0] ?? 'chart';
    }
    setVisibleCanvasTabIds(next);
    setActiveTab(nextActive);
  }

  function handleNewChat() {
    if (pendingNewChatId) return;
    const id = makePendingId();
    const item = {
      id,
      title: 'New conversation',
      timestamp: 'Just now',
      rich: false,
      pending: true,
      isNewConversation: true,
    };
    setChats((c) => [item, ...c]);
    setPendingNewChatId(id);
    setActiveChatId(id);
  }

  // Dismissing the pending "New conversation" goes through the same
  // staged-deletion flow as a normal delete: mark for collapse, switch
  // active chat back to a real one, and let handleFinalizeDelete drop
  // it from `chats` once the row's collapse transition ends. This
  // keeps the visual exit consistent across all "row goes away"
  // pathways.
  function handleDismissNewChat() {
    if (!pendingNewChatId) return;
    const dismissingId = pendingNewChatId;
    setDeletingChatIds((prev) => {
      if (prev.has(dismissingId)) return prev;
      const next = new Set(prev);
      next.add(dismissingId);
      return next;
    });
    setPendingNewChatId(null);
    const fallback = SEED_CHATS[0]?.id;
    if (fallback) setActiveChatId(fallback);
  }

  function handleSelectChat(id) {
    if (pendingNewChatId && id !== pendingNewChatId) {
      // Same staged dismiss as the X button — clicking another chat
      // while a pending row is up should also animate it away rather
      // than instantly snapping it out of the list.
      const dismissingId = pendingNewChatId;
      setDeletingChatIds((prev) => {
        if (prev.has(dismissingId)) return prev;
        const next = new Set(prev);
        next.add(dismissingId);
        return next;
      });
      setPendingNewChatId(null);
    }
    setActiveChatId(id);
  }

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const working = (extraTurns[activeChatId] ?? []).some(turn => isTaskRunning(turn.taskPhase));
  const canvasTabIds = visibleCanvasTabIds;
  const canvasActiveTab = activeTab;

  // Stable identity for the prompt's artifact list. Rebuilding this inline in
  // JSX produced a new array every render, which fed a child effect dependency
  // (ArtifactPicker) and drove an infinite render loop.
  const promptArtifactIds = useMemo(
    () => expandTabIdsWithPanels([...(activeChat.artifactIds ?? []), ...canvasTabIds]),
    [activeChat.artifactIds, canvasTabIds],
  );

  function handleResize(clientX) {
    const app = appRef.current;
    if (!app) return;
    // Read the conversation panel's actual left edge instead of
    // hardcoding the sidebar width — the rail expands from 60 → 230
    // on hover, and a 60-only assumption made dragging feel ~170px
    // off whenever the sidebar was open.
    const convEl = document.getElementById('conversation');
    if (!convEl) return;
    const appRect = app.getBoundingClientRect();
    const convRect = convEl.getBoundingClientRect();
    const handleW = 4;
    const railOffset = convRect.left - appRect.left;
    const usable = appRect.width - railOffset - handleW;
    const x = clientX - convRect.left;
    const minX = MIN_CONV_PX;
    const maxX = Math.min(MAX_CONV_PX, usable - MIN_CANVAS_PX);
    // If the viewport is too narrow to honor both mins, fall back to
    // a centered split so neither panel collapses to nothing.
    const clampedX = maxX < minX ? Math.min(usable, MIN_CONV_PX) : Math.max(minX, Math.min(maxX, x));
    setConvWidth(clampedX);
  }

  function handleResetSplit() {
    setConvWidth(computeBaselineConvWidth());
  }

  // Begin a delete. Called from the ChatItemMenu's Yes-then-130ms
  // pipeline (either surface — sidebar row kebab or conv header
  // kebab) at the moment the popup is gone. We mark the chat for
  // deletion and, if it was active, switch the conv panel to the
  // next remaining chat right now so the panel updates in sync with
  // the popup disappearing. The actual removal from `chats` is
  // deferred to handleFinalizeDelete, which fires when the sidebar
  // row's collapse transition ends.
  function handleDeleteChat(chatId) {
    setDeletingChatIds((prev) => {
      if (prev.has(chatId)) return prev;
      const next = new Set(prev);
      next.add(chatId);
      return next;
    });
    if (chatId === activeChatId) {
      // First non-deleting chat that isn't the one we're deleting.
      const fallback = chats.find(
        (c) => c.id !== chatId && !deletingChatIds.has(c.id),
      );
      if (fallback) setActiveChatId(fallback.id);
    }
  }

  // Called by the sidebar ChatItem after its row collapse transition
  // ends. Actually removes the chat from state and clears the
  // deleting flag; also cleans up its extraTurns entry.
  function handleFinalizeDelete(chatId) {
    responses.remove(chatId);
    setDeletingChatIds((prev) => {
      if (!prev.has(chatId)) return prev;
      const next = new Set(prev);
      next.delete(chatId);
      return next;
    });
    setChats((prev) => prev.filter((x) => x.id !== chatId));
    setCanvases(previous => {
      const next = { ...previous };
      delete next[chatId];
      return next;
    });
  }

  // Rename: a single state change updates both surfaces (sidebar row +
  // header title) because they both render off the same `chats[]`
  // entry — no manual cross-element wiring required.
  function handleStartRename(chatId, source) {
    setRenamingChat({ id: chatId, source });
  }

  function handleCommitRename(chatId, newTitle) {
    setChats((c) => c.map((x) => (x.id === chatId ? { ...x, title: newTitle } : x)));
    setRenamingChat(null);
  }

  function handleCancelRename() {
    setRenamingChat(null);
  }

  // Append a turn (user prompt + canned assistant reply) to the active chat.
  // If the user submitted from a pending new chat, promote it to a permanent
  // chat first so subsequent turns persist correctly.
  function handleCmdLSelect(ref) {
    setCmdLPendingChip(ref);
  }

  function handleMentionsChange(artifactIds) {
    const resolved = [...new Set(
      artifactIds
        .map((id) => getParentTabId(id))
        .filter((id) => visibleCanvasTabIds.includes(id)),
    )];
    setMentionedTabIds((prev) => (arraysEqual(prev, resolved) ? prev : resolved));
    setMentionedRawIds((prev) => (arraysEqual(prev, artifactIds) ? prev : artifactIds));
  }

  function handleCancelMessage() {
    responses.cancel(activeChatId);
    setOpeningChatId(current => current === activeChatId ? null : current);
  }

  function handleSubmitMessage(text, mentions = [], segments = []) {
    const trimmed = text.trim();
    if (!trimmed && mentions.length === 0) return;
    let targetId = activeChatId;
    if (activeChat.pending) {
      targetId = `chat-${crypto.randomUUID()}`;
      const title = trimmed || `@${mentions[0].tabId}`;
      setChats(previous => previous.map(chat => chat.id === activeChatId
        ? { ...chat, id: targetId, title: title.slice(0, 40), pending: false, kind: 'simulation' }
        : chat));
      setPendingNewChatId(null);
      setActiveChatId(targetId);
      setOpeningChatId(targetId);
    }
    responses.start(targetId, {
      user: trimmed || mentions.map(mention => `@${mention.tabId}`).join(' '),
      userSegments: segments.length ? segments : null,
    });
  }

  return (
    <div id="app" ref={appRef} className={`h-full flex${openingChatId === activeChatId ? ' conversation-opening' : ''}`} style={{ position: 'relative' }}>

      {view === 'settings' ? (
        <>
          <SettingsSidebar
            activeItem={settingsItem}
            onSelectItem={item => startTransition(() => setSettingsItem(item))}
            onBack={() => setView('console')}
          />
          <Suspense fallback={<div className="flex-1 min-w-0" style={{ background: 'var(--color-surface-0)' }} />}>
            {settingsItem === 'design-system' ? (
              <DesignSystemPage />
            ) : settingsItem === 'preferences' ? (
              <PreferencesPage />
            ) : (
              <div className="flex-1 min-w-0" style={{ background: 'var(--color-surface-0)' }} />
            )}
          </Suspense>
        </>
      ) : (
        <>
          <SidebarSlot
            chats={chats}
            chatPhases={chatPhases}
            activeChatId={activeChatId}
            pendingNewChatId={pendingNewChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDismissNewChat={handleDismissNewChat}
            onDeleteChat={handleDeleteChat}
            deletingChatIds={deletingChatIds}
            onFinalizeDelete={handleFinalizeDelete}
            renamingChat={renamingChat}
            onStartRename={handleStartRename}
            onCommitRename={handleCommitRename}
            onCancelRename={handleCancelRename}
            onOpenSettings={() => {
              // Warm the reference bundle on Settings entry, without delaying
              // navigation. A failed prefetch can be retried by the lazy import.
              void loadDesignSystem().catch(() => {});
              setView('settings');
            }}
          />

          <ConversationPanelSlot
            // Start New with fresh composer measurements, before its first paint.
            // Reusing the previous panel animates its draft/Plan height into New.
            key={activeChat.pending ? activeChat.id : 'conversation'}
            chat={activeChat}
            working={working}
            onCancelMessage={handleCancelMessage}
            centered={activeChat.pending === true}
            activeTabId={canvasTabIds.includes(canvasActiveTab) ? canvasActiveTab : null}
            width={convWidth}
            visibleTabIds={canvasTabIds}
            artifactIds={promptArtifactIds}
            onArtifactClick={(artifact) => {
              if (visibleCanvasTabIds.includes(artifact)) {
                setActiveTab(artifact);
              } else {
                handleExpandToCanvas(artifact);
              }
            }}
            onExpandToCanvas={handleExpandToCanvas}
            onOpenSourceTab={handleOpenSourceTab}
            onDismissNewChat={handleDismissNewChat}
            extraTurns={extraTurns[activeChatId] || []}
            onSubmitMessage={handleSubmitMessage}
            onMentionsChange={handleMentionsChange}
            mentionVariant={mentionVariant}
            onDeleteChat={handleDeleteChat}
            renamingChat={renamingChat}
            onStartRename={handleStartRename}
            onCommitRename={handleCommitRename}
            onCancelRename={handleCancelRename}
            cmdLPendingChip={cmdLPendingChip}
            onCmdLChipConsumed={() => setCmdLPendingChip(null)}
            onSlashCommand={handleSlashCommand}
          />

          {!activeChat.pending && <>
          <ResizeHandle onResize={handleResize} onReset={handleResetSplit} />

          <CanvasSlot
            chat={activeChat}
            preparingChart={!extraTurns[activeChatId]?.at(-1)?.artifactReady && ['preparing', 'streaming'].includes(extraTurns[activeChatId]?.at(-1)?.taskPhase)}
            activeTab={canvasActiveTab}
            onTabChange={setActiveTab}
            onOpenSourceTab={handleOpenSourceTab}
            visibleTabIds={canvasTabIds}
            onCloseTab={handleCloseCanvasTab}
            layout={layout}
            onExpandPanel={handleExpandPanelToRight}
            onCollapseMultiChart={handleCollapseMultiChart}
            mentionedTabIds={mentionedTabIds}
            mentionedRawIds={mentionedRawIds}
            onCmdLSelect={handleCmdLSelect}
          />
          </>}
        </>
      )}
    </div>
  );
}
