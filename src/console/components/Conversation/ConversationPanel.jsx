import { useConversationFollow } from './useConversationFollow';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CloseIcon, MenuDotsIcon } from '../icons';
import { RichConversation } from './RichConversation';
import { SuspiciousRefundsConversation } from './SuspiciousRefundsConversation';
import { ChatPatternsConversation } from './ChatPatternsConversation';
import { InteractiveCanvasConversation } from './InteractiveCanvasConversation';
import { SimpleConversation } from './SimpleConversation';
import { WelcomeConversation } from './WelcomeConversation';
import { NetworkOnboardingConversation } from './NetworkOnboardingConversation';
import { SimulatedTurn } from './SimulatedTurn';
import { PromptInput } from './PromptInput';
import { ComposerDock } from './ComposerDock';
import { RotatingTip } from '../RotatingTip';
import { useComposerTips } from '../../variants/useComposerTips';
import { NewConversationSections } from './NewConversationSections';
import { FeedbackElicitation } from './FeedbackElicitation';
import { ChatItemMenu } from '../Menu/ChatItemMenu';
import { RenameInput } from '../RenameInput';
import { RubiksCube } from './RubiksCube';

// ConversationPanel — porting #conversation from prototypes/main/index.html.
// Shows rich content for "failed-payments", simple seed for everything else,
// and an empty state with a dismiss-X for a freshly-created pending new chat.

// When true, submitting from the feedback elicitation container does NOT append
// the typed feedback as a user-message bubble — only Console's acknowledgement
// reply appears. Set to false to restore the earlier version that echoes the
// user's submitted message into the thread.
const HIDE_FEEDBACK_USER_MESSAGE = true;

// When true, submitting feedback appends NO thread message at all. Instead the
// rated message re-plays the right-aligned "Thank you" acknowledgement (same
// treatment/fade as a thumbs-up). Set to false to fall back to appending the
// "Thank you for the feedback. What can I help with next?" reply (which then
// honors HIDE_FEEDBACK_USER_MESSAGE).
const FEEDBACK_SUBMIT_RIGHT_ACK = true;

function hasMessageOverflow(area, list, dock) {
  // The sticky dock can add a few pixels to the scrollable area even when
  // messages fit. Use content height for both scrolling and anchored styling.
  return list.scrollHeight + (dock?.offsetHeight ?? 0) > area.clientHeight + 4;
}

export function ConversationPanel({
  chat,
  working = false,
  onCancelMessage,
  centered = false,
  activeTabId = null,
  onArtifactClick,
  onExpandToCanvas,
  onOpenSourceTab,
  onDismissNewChat,
  onSubmitMessage,
  onMentionsChange,
  onDeleteChat,
  extraTurns = [],
  width = 480,
  renamingChat,
  onStartRename,
  onCommitRename,
  onCancelRename,
  visibleTabIds = [],
  artifactIds = [],
  mentionVariant = 'inline',
  cmdLPendingChip = null,
  onCmdLChipConsumed,
  onSlashCommand,
}) {
  const isPending = chat.pending === true;
  const [tipsVisible, dismissTips] = useComposerTips();
  const isRenamingHeader =
    renamingChat?.id === chat.id && renamingChat?.source === 'header';
  const renameRef = useRef(null);
  const navIdxRef = useRef(null);
  const navActiveRef = useRef(false);

  // Conversation header overflow menu — anchors below the … button.
  const menuBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  function openHeaderMenu() {
    if (menuPos) {
      setMenuPos(null);
      return;
    }
    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
  }

  // "Ask anything" on an empty chat (pending OR no extra turns yet),
  // "Follow up" once there's at least one reply visible.
  const hasAnyReply = !isPending || extraTurns.length > 0;
  const placeholder = hasAnyReply ? 'Follow up' : 'Ask anything';

  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const feedbackOpen = feedbackTarget?.chatId === chat.id;
  const feedbackSubmitTimer = useRef(null);
  const composerFocusTimer = useRef(null);
  useEffect(() => () => {
    clearTimeout(feedbackSubmitTimer.current);
    clearTimeout(composerFocusTimer.current);
  }, [chat.id]);
  const [planChatId, setPlanChatId] = useState(null);
  const planOpen = planChatId === chat.id;
  const [composerDraft, setComposerDraft] = useState(null);
  const [submitClosing, setSubmitClosing] = useState(false);
  const [composerChatId, setComposerChatId] = useState(chat.id);
  if (composerChatId !== chat.id) {
    setComposerChatId(chat.id);
    setFeedbackTarget(null);
    setSubmitClosing(false);
    setPlanChatId(null);
    setComposerDraft(null);
  }
  const dockStageRef = useRef(null);
  const promptLayerRef = useRef(null);
  const elicLayerRef = useRef(null);
  const [dockHeight, setDockHeight] = useState(null);
  // Only animate dock height for feedback open/close — NOT for chat switches
  // or isAnchored settling. We flip this on when feedback toggles and off after
  // the transition completes.
  const [dockAnimating, setDockAnimating] = useState(false);
  const dockAnimTimer = useRef(null);
  const previousFeedbackOpen = useRef(feedbackOpen);
  function handlePromptSubmit(...args) {
    // Swap views immediately, as when opening New. The destination supplies
    // the single short fade; there is no outgoing animation to wait for.
    onSubmitMessage?.(...args);
    setComposerDraft(null);
  }

  function closePlan(answer) {
    if (answer) setComposerDraft({ text: answer, chatId: chat.id });
    setPlanChatId(null);
    clearTimeout(composerFocusTimer.current);
    composerFocusTimer.current = setTimeout(() => document.getElementById('promptInput')?.focus({ preventScroll: true }), 500);
  }

  function handleComposerCommand(commandId) {
    if (commandId !== 'plan') {
      onSlashCommand?.(commandId);
      return;
    }
    clearNavFocus();
    setPlanChatId(chat.id);
  }

  useEffect(() => {
    function open(event) {
      setPlanChatId(null);
      setFeedbackTarget({ chatId: chat.id, feedbackId: event.detail?.feedbackId });
    }
    window.addEventListener('console:provide-feedback', open);
    return () => window.removeEventListener('console:provide-feedback', open);
  }, [chat.id]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('console:feedback-state', { detail: { open: feedbackOpen } }),
    );
    // Initial height measurements must settle without animating the dock.
    if (previousFeedbackOpen.current === feedbackOpen) return;
    previousFeedbackOpen.current = feedbackOpen;
    // Enable dock height animation only for feedback transitions
    clearTimeout(dockAnimTimer.current);
    setDockAnimating(true);
    dockAnimTimer.current = setTimeout(() => setDockAnimating(false), 500);
    return () => clearTimeout(dockAnimTimer.current);
  }, [feedbackOpen]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = feedbackOpen ? elicLayerRef.current : promptLayerRef.current;
      if (el) setDockHeight(el.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (promptLayerRef.current) ro.observe(promptLayerRef.current);
    if (elicLayerRef.current) ro.observe(elicLayerRef.current);
    return () => ro.disconnect();
  }, [feedbackOpen]);

  function closeFeedback() {
    setFeedbackTarget(null);
    clearTimeout(composerFocusTimer.current);
    composerFocusTimer.current = setTimeout(() => document.getElementById('promptInput')?.focus({ preventScroll: true }), 200);
  }

  // Reset on chat switch, and reveal appended turns only when messages overflow.
  const messagesRef = useRef(null);
  const messagesListRef = useRef(null);
  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [chat.id]);
  useLayoutEffect(() => {
    if (extraTurns.length === 0) return;
    const el = messagesRef.current;
    const list = messagesListRef.current;
    if (!el || !list) return;
    if (hasMessageOverflow(el, list, dockStageRef.current)) el.scrollTop = el.scrollHeight;
  }, [extraTurns.length]);

  useConversationFollow({ areaRef: messagesRef, listRef: messagesListRef, dockRef: dockStageRef, chatId: chat.id, turnCount: extraTurns.length });

  // A task block expanded near the bottom of the thread opens past the fold.
  // The markup is inlined per conversation, so watch for the class change here
  // rather than wiring a handler into each one.
  useEffect(() => {
    const area = messagesRef.current;
    if (!area) return undefined;
    const timers = new Set();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const el = record.target;
        if (!(el instanceof HTMLElement)) continue;
        if (el.hasAttribute('data-future-task') || !el.classList.contains('task-module') || !el.classList.contains('expanded')) continue;
        // Measure after the 400ms height transition so we see the final size.
        const timer = setTimeout(() => {
          timers.delete(timer);
          const areaRect = area.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          if (elRect.bottom <= areaRect.bottom) return;
          // Blocks taller than the viewport read from the top; shorter ones
          // just need their tail brought up past the fold.
          const delta = elRect.height > areaRect.height
            ? elRect.top - areaRect.top
            : elRect.bottom - areaRect.bottom + 12;
          area.scrollBy({ top: delta, behavior: 'smooth' });
        }, 420);
        timers.add(timer);
      }
    });
    observer.observe(area, { subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  // Keyboard navigation through chat items.
  // Uses a document-level listener so we never steal DOM focus from the input,
  // which avoids browser scroll-into-focus side effects on the section element.
  function getNavItems() {
    return Array.from(messagesListRef.current?.querySelectorAll('[data-chat-nav]') ?? []);
  }

  function setNavFocus(idx) {
    const items = getNavItems();
    items.forEach((el, i) => el.classList.toggle('chat-nav-focused', i === idx));
    navIdxRef.current = idx;
    items[idx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function clearNavFocus() {
    getNavItems().forEach((el) => el.classList.remove('chat-nav-focused'));
    navIdxRef.current = null;
    navActiveRef.current = false;
  }

  function focusPrompt() {
    clearNavFocus();
    messagesRef.current?.querySelector('[contenteditable]')?.focus();
  }

  function handleNavigateUp() {
    const items = getNavItems();
    if (items.length === 0) return;
    navActiveRef.current = true;
    setNavFocus(items.length - 1);
    // Move focus to the messages area so subsequent ↑/↓ reach the document
    // listener. preventScroll avoids any browser scroll-to-focus side effects.
    messagesRef.current?.focus({ preventScroll: true });
  }

  function handleInputFocus() {
    if (navActiveRef.current) clearNavFocus();
  }

  // Document-level keydown listener — only handles keys when nav is active.
  // Empty deps intentional: all mutable state is in refs (always current).
  useEffect(() => {
    function onKeyDown(e) {
      if (!navActiveRef.current) return;
      // Let the input handle its own keys — ↑ from empty input already
      // stops propagation before reaching here; other input keys pass through.
      if (e.target.closest('[contenteditable]')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        focusPrompt();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const items = getNavItems();
        const current = navIdxRef.current;
        if (current !== null) items[current]?.click();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const items = getNavItems();
        if (items.length === 0) return;
        const current = navIdxRef.current;
        if (current === null) {
          setNavFocus(e.key === 'ArrowUp' ? items.length - 1 : 0);
        } else {
          const next = e.key === 'ArrowUp' ? current - 1 : current + 1;
          if (next < 0) {
            focusPrompt();
          } else {
            setNavFocus(Math.min(next, items.length - 1));
          }
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear nav whenever the active chat changes.
  useEffect(() => {
    clearNavFocus();
  }, [chat.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track whether the chat overflows the visible viewport to style the
  // sticky prompt as a separate anchored bar vs. inline.
  const [isAnchored, setIsAnchored] = useState(false);
  useEffect(() => {
    const area = messagesRef.current;
    const list = messagesListRef.current;
    if (!area || !list) return;
    function check() {
      setIsAnchored(hasMessageOverflow(area, list, dockStageRef.current));
    }
    check();
    const ro1 = new ResizeObserver(check);
    const ro2 = new ResizeObserver(check);
    ro1.observe(area);
    ro2.observe(list);
    if (dockStageRef.current) ro2.observe(dockStageRef.current);
    window.addEventListener('resize', check);
    return () => {
      ro1.disconnect();
      ro2.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [chat.id]);

  const stickyComposer = !centered && (chat.kind === 'simulation' || chat.stickyComposer === true);
  // Keep the landing composer in flow so it never waits a frame for the
  // dock's ResizeObserver to place its bottom-anchored layer.
  const naturalComposerLayout = centered && !feedbackOpen && !dockAnimating;

  // Exactly one conversation body renders per chat, picked in priority order.
  // These used to be five independent JSX conditions, which meant a chat with
  // `kind` set but `rich` unset matched two of them and rendered both bodies.
  // Keeping it a single choice means adding a `kind` can't double-render.
  function renderConversation() {
    if (chat.kind === 'simulation') return null;
    const shared = {
      onArtifactClick,
      onExpandToCanvas,
      onOpenSourceTab,
      isLatest: extraTurns.length === 0,
    };
    if (chat.kind === 'welcome') return <WelcomeConversation {...shared} artifactIds={chat.artifactIds} />;
    if (chat.kind === 'network-onboarding') return <NetworkOnboardingConversation key={chat.id} {...shared} chat={chat} />;
    if (chat.kind === 'patterns') return <ChatPatternsConversation {...shared} />;
    if (chat.kind === 'interactive-canvas') return <InteractiveCanvasConversation {...shared} />;
    if (chat.id === 'suspicious-refunds') return <SuspiciousRefundsConversation {...shared} />;
    if (chat.rich) return <RichConversation {...shared} />;
    return (
      <SimpleConversation
        chat={chat}
        isLatest={shared.isLatest}
        onOpenSourceTab={onOpenSourceTab}
      />
    );
  }

  return (
    <section
      id="conversation"
      className={`panel-transition flex flex-col bg-surface-0${centered ? ' conversation--centered' : ''}${stickyComposer ? ' conversation--sticky-composer' : ''}`}
      style={{ flex: centered ? '1 1 0%' : `0 0 ${width}px`, minWidth: 320, gap: 11, overflow: 'hidden' }}
    >
      <div
        id="convHeader"
        className="conv-header flex items-center"
        style={{ padding: '17px 16px 10px 16px', height: 24, boxSizing: 'content-box', gap: 6 }}
      >
        {isRenamingHeader ? (
          <div
            id="convTitle"
            className="rename-area"
            style={{ flex: 1, minWidth: 0, overflow: 'hidden', fontSize: 13, fontWeight: 500, lineHeight: '24px' }}
          >
            <RenameInput
              ref={renameRef}
              value={chat.title}
              onCommit={(next) => onCommitRename?.(chat.id, next)}
              onCancel={() => onCancelRename?.()}
              style={{
                width: '100%',
                fontSize: 13,
                fontWeight: 500,
                lineHeight: '18px',
                color: 'var(--color-text-primary)',
                caretColor: 'var(--color-text-primary)',
              }}
            />
          </div>
        ) : (
          <span
            id="convTitle"
            style={{ fontSize: 13, fontWeight: 500, lineHeight: '24px', color: 'var(--color-text-secondary)' }}
          >
            {chat.title}
          </span>
        )}
        {isPending ? (
          <div
            id="convNewChatClose"
            className="conv-menu-btn"
            title="Dismiss"
            onClick={() => onDismissNewChat?.()}
          >
            <CloseIcon size={12} />
          </div>
        ) : isRenamingHeader ? (
          <div
            id="convRenameClose"
            className="conv-menu-btn"
            title="Done"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              renameRef.current?.commit();
            }}
          >
            <CloseIcon size={12} />
          </div>
        ) : (
          <div
            id="convMenuBtn"
            ref={menuBtnRef}
            className={`conv-menu-btn ${menuPos ? 'active' : ''}`}
            title="Menu"
            onClick={(e) => {
              e.stopPropagation();
              openHeaderMenu();
            }}
          >
            <MenuDotsIcon size={14} />
          </div>
        )}
      </div>

      <div
        id="messagesArea"
        data-conversation-scroll
        ref={messagesRef}
        tabIndex={-1}
        className="flex-1 overflow-y-auto"
        style={{ padding: 0, marginTop: -24, outline: 'none' }}
      >
        <div
          id="messagesList"
          ref={messagesListRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 900,
            paddingLeft: 16,
            paddingRight: 16,
            // Keep the initial content position while allowing scrolled messages
            // to pass underneath the header's 24px feathered edge.
            paddingTop: (isPending ? 9 : 4) + 24,
            paddingBottom: isPending ? 0 : isAnchored ? 16 : 12,
          }}
        >
          {!isPending && renderConversation()}
          {extraTurns.map((turn, i) => (
            <SimulatedTurn
              key={i}
              user={turn.user}
              userSegments={turn.userSegments}
              userThumbnail={turn.userThumbnail}
              entrance={turn.entrance}
              assistant={turn.assistant}
              isLatest={i === extraTurns.length - 1}
              noFeedback={turn.noFeedback === true}
              hideUser={turn.hideUser === true}
              taskRun={turn.taskRun}
              taskPhase={turn.taskPhase}
              taskCopy={turn.taskCopy}
              taskCalls={turn.taskCalls}
              artifactId={turn.artifactId}
              artifactIds={turn.artifactIds}
              sourceItems={turn.sourceItems}
              onArtifactClick={onArtifactClick}
              onOpenSourceTab={onOpenSourceTab}
            />
          ))}
        </div>
        {centered && <div className="new-conversation-cube-mark intro-cube" aria-hidden="true">
          <RubiksCube playing={false} />
        </div>}
        <ComposerDock
          id="promptDock"
          showFade={isAnchored || stickyComposer || feedbackOpen}
        >
          <div
            ref={dockStageRef}
            style={{
              position: 'relative',
              height: naturalComposerLayout ? undefined : dockHeight ?? undefined,
              overflow: 'visible',
              transition: dockAnimating ? 'height 480ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            }}
          >
            <div
              ref={promptLayerRef}
              inert={feedbackOpen}
              aria-busy={working}
              aria-hidden={feedbackOpen}
              style={{
                position: naturalComposerLayout ? 'relative' : 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                opacity: feedbackOpen ? 0 : 1,
                pointerEvents: feedbackOpen ? 'none' : 'auto',
                transition: feedbackOpen
                  ? 'opacity 200ms ease-out'
                  : 'opacity 360ms cubic-bezier(0.4, 0, 0.2, 1) 120ms',
              }}
            >
              <PromptInput
                inputId="promptInput"
                chatId={chat.id}
                activeTabId={activeTabId}
                contextUsagePercent={hasAnyReply ? 82 : 0}
                placeholder={placeholder}
                hideEmptyFooter={centered}
                onSubmit={handlePromptSubmit}
                working={working}
                onCancel={onCancelMessage}
                preserveOnSubmit={centered}
                onMentionsChange={onMentionsChange}
                onNavigateUp={handleNavigateUp}
                onInputFocus={handleInputFocus}
                isAnchored={isAnchored || stickyComposer}
                visibleTabIds={visibleTabIds}
                artifactIds={artifactIds}
                mentionVariant={mentionVariant}
                cmdLPendingChip={cmdLPendingChip}
                onCmdLChipConsumed={onCmdLChipConsumed}
                onSlashCommand={handleComposerCommand}
                draftToInsert={composerDraft?.chatId === chat.id ? composerDraft : null}
                planOpen={planOpen}
                onPlanSelect={(answer) => { if (answer) closePlan(answer); }}
                onPlanCancel={() => closePlan()}
              />
            </div>
            <div
              ref={elicLayerRef}
              inert={!feedbackOpen}
              aria-hidden={!feedbackOpen}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                opacity: feedbackOpen ? 1 : 0,
                transform: feedbackOpen ? 'translateY(0)' : 'translateY(4px)',
                pointerEvents: feedbackOpen ? 'auto' : 'none',
                transition: feedbackOpen
                  ? 'opacity 460ms cubic-bezier(0.4, 0, 0.2, 1) 80ms, transform 480ms cubic-bezier(0.4, 0, 0.2, 1)'
                  : submitClosing
                    ? 'opacity 440ms cubic-bezier(0.4, 0, 0.2, 1), transform 460ms cubic-bezier(0.4, 0, 0.2, 1)'
                    : 'opacity 220ms ease-out, transform 300ms ease-out',
              }}
            >
              <FeedbackElicitation
                key={chat.id}
                active={feedbackOpen}
                onSubmit={(text) => {
                  if (!text) return;
                  setSubmitClosing(true);
                  setFeedbackTarget(null);
                  clearTimeout(feedbackSubmitTimer.current);
                  feedbackSubmitTimer.current = setTimeout(() => {
                    if (FEEDBACK_SUBMIT_RIGHT_ACK) {
                      window.dispatchEvent(new CustomEvent('console:feedback-submitted', { detail: { feedbackId: feedbackTarget?.feedbackId } }));
                    } else {
                      onSubmitMessage?.(
                        text,
                        'Thank you for the feedback. What can I help with next?',
                        { noFeedback: true, hideUser: HIDE_FEEDBACK_USER_MESSAGE },
                      );
                    }
                    document.getElementById('promptInput')?.focus();
                    setSubmitClosing(false);
                  }, 440);
                }}
                onCancel={() => closeFeedback()}
              />
            </div>
          </div>
        </ComposerDock>
        {centered && (
          <NewConversationSections onChoose={(text) => {
            setPlanChatId(null);
            setComposerDraft({ text, chatId: chat.id });
            requestAnimationFrame(() => {
              document.getElementById('promptInput')?.focus({ preventScroll: true });
            });
          }} />
        )}
      </div>

      <ChatItemMenu
        isOpen={menuPos !== null}
        position={menuPos}
        onClose={() => setMenuPos(null)}
        onRename={() => onStartRename?.(chat.id, 'header')}
        onDelete={() => onDeleteChat?.(chat.id)}
      />
      {centered && tipsVisible && <div className="new-conversation-tip-footer">
        <RotatingTip paused={planOpen} onDismiss={dismissTips} />
      </div>}
    </section>
  );
}
