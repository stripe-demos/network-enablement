import { DASHBOARD_URL } from '../../../integration/consoleHandoff';
import { openDashboard } from '../../data/networkOnboardingStore';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PlusIcon, SearchIcon, CloseIcon, MenuDotsIcon } from '../icons';
import { ChatItemMenu } from '../Menu/ChatItemMenu';
import { RenameInput } from '../RenameInput';
import { NavRow } from '../NavRow';
import { ChatStatus } from './ChatStatus';

// Sidebar — click-to-toggle rail (64px ↔ 240px) with search and new-chat creation.
// Direct port of #iconRail logic from prototypes/main/index.html.
//
// State model:
//   - railOpen: false → 64px collapsed, true → 240px expanded
//     (Console's own localStorage preference)
//   - searching: true → swap top header to search input + hide + button + bottom rail
//   - rail can only enter search mode while open (matches original)

// Console sidebar dimensions. Dashboard owns its dimensions independently.
const RAIL_COLLAPSED = 64;
const RAIL_EXPANDED = 240;

export function Sidebar({
  chats,
  chatPhases = {},
  activeChatId,
  onSelectChat,
  onNewChat,
  onDismissNewChat,
  pendingNewChatId,
  onDeleteChat,
  deletingChatIds,
  onFinalizeDelete,
  renamingChat,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onOpenSettings,
}) {
  // Console owns this preference; Dashboard has a separate storage namespace.
  const [railOpen, setRailOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('sidebar-collapsed') !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('sidebar-collapsed', String(!railOpen));
    } catch {
      // Keep sidebar controls usable when browser storage is unavailable.
    }
  }, [railOpen]);
  const [searching, setSearching] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [glowBg, setGlowBg] = useState(null);
  const [glowOpacity, setGlowOpacity] = useState(0);
  // Per-row overflow menu. Anchored at the click point (matching the
  // original prototype which used e.clientX / e.clientY).
  const [menu, setMenu] = useState(null); // { chatId, x, y }

  function openItemMenu(chatId, e) {
    if (menu?.chatId === chatId) {
      setMenu(null);
      return;
    }
    setMenu({ chatId, x: e.clientX, y: e.clientY });
  }

  const searchInputRef = useRef(null);
  const newChatBtnRef = useRef(null);
  const newChatFlashRef = useRef(null);
  useEffect(() => () => newChatFlashRef.current?.cancel(), []);

  function handleNewClick(event) {
    event.stopPropagation();
    if (!pendingNewChatId) {
      onNewChat?.();
      return;
    }
    const row = event.currentTarget.closest('nav')?.querySelector(`[data-chat="${CSS.escape(pendingNewChatId)}"]`);
    if (row) {
      newChatFlashRef.current?.cancel();
      const styles = getComputedStyle(row);
      const base = styles.backgroundColor;
      newChatFlashRef.current = row.animate([
        { backgroundColor: base },
        { backgroundColor: styles.getPropertyValue('--color-surface-3').trim(), offset: 0.25 },
        { backgroundColor: base },
      ], { duration: 650, easing: 'ease-out' });
    }
    document.getElementById('promptInput')?.focus({ preventScroll: true });
  }

  function preserveComposerFocus(event) {
    if (pendingNewChatId) event.preventDefault();
  }
  const tooltipRef = useRef(null);
  // Refs driving the New-button collapse/expand animation when the
  // user toggles search. We cache the natural height + margin-bottom
  // on first mount so the animation has a stable target to grow back
  // to (the wrapper's natural size is set by CSS; we only need to
  // measure it once).
  // New-button visibility is now driven entirely by CSS — the wrapper
  // is absolutely positioned at the top of railExpandedInner (see
  // #newBtnWrap in index.css), so toggling its opacity is enough; we
  // don't need to animate height/margin to get the chat list to slide
  // up. The chat list paddingTop below carries the entrance/exit curve
  // for the list itself.

  // Open/close transitions match the original setRailOpen exactly.
  // Collapsing the rail while in search-mode also exits search, so
  // route through closeSearch() to refocus the prompt.
  function toggleRail() {
    setRailOpen((open) => {
      const next = !open;
      if (!next && searching) closeSearch();
      return next;
    });
  }

  function openSearch() {
    if (!railOpen) return;
    // Close any open chat-row kebab — while searching, the focus is
    // on filtering the list, not managing individual rows. The menu
    // would also be visually orphaned (the kebab buttons hide below).
    setMenu(null);
    setSearching(true);
    setTimeout(() => searchInputRef.current?.focus(), 160);
  }

  function closeSearch() {
    setSearching(false);
    setSearchValue('');
    // Hand focus back to the bottom prompt so the user can keep
    // typing without an extra click. Without this, focus drops to
    // <body> and the prompt's blinking cursor stays hidden (the
    // PromptInput overlay only shows the cursor while focused).
    document.getElementById('promptInput')?.focus();
  }

  // Filter the chat list against the search query (case-insensitive).
  // Highlight is applied inline below.
  const queryLower = searchValue.trim().toLowerCase();
  const filteredChats = queryLower
    ? chats.filter((c) => c.title.toLowerCase().includes(queryLower))
    : chats;

  return (
    <nav
      id="iconRail"
      className={`relative h-full shrink-0 overflow-hidden bg-surface-0 ${railOpen ? 'expanded' : 'collapsed'}`}
      style={{
        width: `${railOpen ? RAIL_EXPANDED : RAIL_COLLAPSED}px`,
        transition:
          'width 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 250ms ease',
      }}
    >
      {/* Right edge: separator line + the open/close handle.
          Click anywhere in this 20px-wide strip to toggle the rail. */}
      <div
        id="railEdge"
        onClick={(e) => {
          e.stopPropagation();
          toggleRail();
        }}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 20, zIndex: 10, cursor: 'pointer' }}
      >
        <div
          id="railSeparator"
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'var(--color-surface-2)', transition: 'background 0.15s ease' }}
        />
        <div
          id="railHandle"
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 2,
            height: 14,
            borderRadius: 1,
            background: 'var(--color-border-rail)',
            transition: 'background 0.15s ease, transform 0.2s cubic-bezier(0, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Top header — default (logo + label + search btn) and search variants
          live in the same slot, swapping via opacity. */}
      <div id="railTop" className="absolute top-0 left-0 right-0" style={{ pointerEvents: railOpen ? 'auto' : 'none', zIndex: 11 }}>
        <div
          id="railTopDefault"
          className="flex items-center"
          style={{
            padding: '17px 13px 0 20px',
            gap: 8,
            overflow: 'hidden',
            transition: 'opacity 150ms ease',
            opacity: searching ? 0 : 1,
            pointerEvents: searching ? 'none' : 'auto',
          }}
        >
          <svg id="customer-logo" className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 4 }}>
            <g clipPath="url(#clip0_rocket_rides)">
              <rect width="24" height="24" rx="4" fill="black"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M15.5294 8C17.7188 8 19.5 9.79437 19.5 12C19.5 14.2056 17.7188 16 15.5294 16H9.47896C9.23527 16 9.03786 15.801 9.03786 15.5555C9.03786 15.31 9.23527 15.1111 9.47896 15.1111H15.5294C17.2323 15.1111 18.6177 13.7155 18.6177 12C18.6177 10.2845 17.2323 8.88888 15.5294 8.88888H5.9496C5.70591 8.88888 5.50837 8.69 5.50837 8.4445C5.50837 8.199 5.70591 8 5.9496 8H15.5294ZM14.2059 12C14.2059 12.7351 14.7996 13.3334 15.5295 13.3334C16.2592 13.3334 16.8529 12.7351 16.8529 12C16.8529 11.2649 16.2592 10.6666 15.5295 10.6666C14.7996 10.6666 14.2059 11.2649 14.2059 12ZM17.7353 12C17.7353 13.2254 16.7457 14.2222 15.5295 14.2222C14.3131 14.2222 13.3236 13.2254 13.3236 12C13.3236 10.7746 14.3131 9.77775 15.5295 9.77775C16.7457 9.77775 17.7353 10.7746 17.7353 12ZM12.5042 10.6667H7.96643C7.72273 10.6667 7.5252 10.4677 7.5252 10.2222C7.5252 9.97669 7.72273 9.77781 7.96643 9.77781H12.5042C12.7479 9.77781 12.9454 9.97669 12.9454 10.2222C12.9454 10.4677 12.7479 10.6667 12.5042 10.6667ZM12.9454 13.7778C12.9454 14.0233 12.7479 14.2223 12.5042 14.2223H7.46225C7.21855 14.2223 7.02102 14.0233 7.02102 13.7778C7.02102 13.5323 7.21855 13.3333 7.46225 13.3333H12.5042C12.7479 13.3333 12.9454 13.5323 12.9454 13.7778ZM12.4412 12C12.4412 12.2455 12.2437 12.4445 12 12.4445H4.94123C4.69754 12.4445 4.5 12.2455 4.5 12C4.5 11.7545 4.69754 11.5555 4.94123 11.5555H12C12.2437 11.5555 12.4412 11.7545 12.4412 12Z" fill="white"/>
            </g>
            <defs>
              <clipPath id="clip0_rocket_rides">
                <rect width="24" height="24" rx="4" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          <span
            className="rail-top-label truncate flex-1"
            style={{
              fontSize: 13,
              fontWeight: 500,
              minWidth: 0,
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              opacity: railOpen ? 1 : 0,
              transition: 'opacity 150ms ease',
            }}
          >
            Rocket Rides
          </span>
          <div
            id="searchBtn"
            className="rail-top-label rail-icon-sm shrink-0"
            title="Search"
            onClick={(e) => {
              e.stopPropagation();
              openSearch();
            }}
            style={{
              width: 32,
              height: 32,
              margin: -4,
              opacity: railOpen ? 1 : 0,
              transition: 'opacity 150ms ease',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 20,
              pointerEvents: railOpen ? 'auto' : 'none',
            }}
          >
            <SearchIcon size={12} />
          </div>
        </div>

        <div
          id="railTopSearch"
          className="flex items-center"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '17px 13px 0 20px',
            gap: 4,
            overflow: 'hidden',
            opacity: searching ? 1 : 0,
            pointerEvents: searching ? 'auto' : 'none',
            transition: 'opacity 150ms ease',
          }}
        >
          <div className="shrink-0 flex items-center justify-center" style={{ width: 24, height: 24, color: 'var(--color-text-secondary)' }}>
            <SearchIcon size={12} />
          </div>
          <input
            id="searchInput"
            ref={searchInputRef}
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeSearch();
            }}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              caretColor: 'var(--color-text-primary)',
              fontFamily: 'inherit',
            }}
          />
          <div
            id="searchCloseBtn"
            className="rail-icon-sm shrink-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              closeSearch();
            }}
            style={{ width: 24, height: 24, cursor: 'pointer' }}
          >
            <CloseIcon size={12} />
          </div>
        </div>
      </div>

      {/* Collapsed view: + button only. Whole area is clickable to expand. */}
      <div
        id="railCollapsed"
        className="absolute inset-0 flex flex-col items-center cursor-pointer"
        onClick={() => {
          if (!railOpen) setRailOpen(true);
        }}
        style={{
          paddingTop: 66,
          transition: 'opacity 250ms ease',
          opacity: railOpen ? 0 : 1,
          pointerEvents: railOpen ? 'none' : 'auto',
        }}
      >
        <div
          id="newChatBtnWrap"
          className="flex flex-col items-center w-full"
          ref={newChatBtnRef}
          onMouseDown={preserveComposerFocus}
          onClick={handleNewClick}
          onMouseMove={(e) => {
            const btn = newChatBtnRef.current?.querySelector('#newChatBtn');
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setGlowBg(`radial-gradient(circle 40px at ${x}px ${y}px, rgba(255,255,255,0.45), transparent)`);
            setGlowOpacity(1);
          }}
          onMouseLeave={() => setGlowOpacity(0)}
          style={{ cursor: 'pointer', position: 'relative', zIndex: 11 }}
        >
          <div className="flex items-center justify-center w-full">
            <div
              id="newChatBtn"
              className="relative flex items-center justify-center linear-border"
              style={{ width: 32, height: 32, borderRadius: 6, cursor: 'pointer', overflow: 'hidden' }}
            >
              <div
                id="newChatBtnGlow"
                style={{
                  position: 'absolute',
                  inset: -1,
                  borderRadius: 'inherit',
                  background: glowBg || undefined,
                  opacity: glowOpacity,
                  transition: 'opacity 0.2s ease',
                  pointerEvents: 'none',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  padding: 1,
                }}
              />
              <span className="relative flex items-center justify-center" style={{ color: 'var(--color-icon-default)', transition: 'color 0.15s ease, filter 0.2s ease' }}>
                <PlusIcon size={8} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded view: + New + chat list */}
      <div
        id="railExpanded"
        className="absolute inset-0 flex flex-col"
        style={{
          width: RAIL_EXPANDED,
          padding: '66px 18px 0 18px',
          opacity: railOpen ? 1 : 0,
          pointerEvents: railOpen ? 'auto' : 'none',
          transition: 'opacity 250ms ease',
        }}
      >
        <div id="railExpandedInner" className="flex flex-col" style={{ gap: 0, minHeight: 0, position: 'relative' }}>
          <div
            id="newBtnWrap"
            // The wrapper is absolutely positioned (see #newBtnWrap in
            // index.css). Toggling opacity hides it without affecting
            // chat-list layout; pointerEvents prevents the invisible
            // button from catching stray clicks.
            style={{
              opacity: searching ? 0 : 1,
              pointerEvents: searching ? 'none' : 'auto',
            }}
          >
            <div
              id="newBtnExpanded"
              className="flex items-center justify-center linear-border"
              onMouseDown={preserveComposerFocus}
              onClick={handleNewClick}
              style={{
                height: 32,
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'height 200ms ease, opacity 200ms ease',
                overflow: 'hidden',
                userSelect: 'none',
              }}
            >
              <span className="flex items-center text-text-primary" style={{ gap: 6 }}>
                <PlusIcon size={8} />
                New
              </span>
            </div>
          </div>

          <div
            id="chatList"
            className="flex-1 overflow-y-auto flex flex-col"
            // NOTE: keep these as longhand properties. Using the `padding`
            // shorthand here causes React to wipe the previously-set
            // padding-right: 18 each time `searching` toggles (style diff
            // only re-applies the changed property), which breaks the
            // -18 / +18 scrollbar-gutter cancellation pattern.
            //
            // paddingTop:
            //   non-search: 58 — clears the absolutely-positioned New
            //     button (button=34 incl. border + 20 paddingBottom on
            //     the wrapper + 4 of breathing room) so the first row
            //     sits visually below it.
            //   search: 0 — first row sits flush at the top of
            //     railExpandedInner, which is exactly where the New
            //     button's top edge is in non-search mode (= same y
            //     as the first reply in the conversation panel).
            // Direction-specific curves match the row animations:
            // decelerate on entrance, ease on exit.
            style={{
              gap: 0,
              minHeight: 0,
              paddingTop: searching ? 0 : 58,
              paddingBottom: 0,
              paddingLeft: 4,
              paddingRight: 18,
              marginRight: -18,
              transition: searching
                ? 'padding-top 200ms cubic-bezier(0.25, 0.1, 0.25, 1)'
                : 'padding-top 200ms cubic-bezier(0, 0, 0.2, 1)',
            }}
          >
            <div id="recentItems" className="flex flex-col" style={{ gap: 2 }}>
              {filteredChats.map((c) =>
                renderChatRow(c, {
                  activeChatId,
                  chatPhases,
                  pendingNewChatId,
                  queryLower,
                  menu,
                  renamingChat,
                  deletingChatIds,
                  searching,
                  onSelectChat,
                  onDismissNewChat,
                  openItemMenu,
                  onCommitRename,
                  onCancelRename,
                  onFinalizeDelete,
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom rail: Settings + Dashboard (Dashboard pinned last, mirroring the
          Console entrypoint at the bottom of the Dashboard nav) (hidden during search) */}
      <div
        id="railBottom"
        className="absolute bottom-0 left-0 right-0 flex flex-col"
        style={{
          padding: '0 18px 18px 18px',
          pointerEvents: searching ? 'none' : 'auto',
          zIndex: 2,
          background: 'var(--color-surface-0)',
          opacity: searching ? 0 : 1,
        }}
      >
        <div className="flex flex-col" style={{ gap: 2 }}>
          <NavRow className="rail-bottom-row" icon={<DashboardSwitcherIcon />} label="Dashboard" railOpen={railOpen} tooltipRef={tooltipRef} onClick={() => openDashboard(DASHBOARD_URL)} />
          <NavRow className="rail-bottom-row" icon={<SettingsGearIcon />} label="Settings" railOpen={railOpen} tooltipRef={tooltipRef} onClick={onOpenSettings} />
        </div>
      </div>

      {/* Shared collapsed-state tooltip — shown on hover when rail is collapsed */}
      <div id="railTooltip" ref={tooltipRef} />

      <ChatItemMenu
        isOpen={menu !== null}
        position={menu}
        onClose={() => setMenu(null)}
        onRename={() => menu && onStartRename?.(menu.chatId, 'sidebar')}
        onDelete={() => menu && onDeleteChat?.(menu.chatId)}
      />
    </nav>
  );
}

// ── renderChatRow ─────────────────────────────────────
// Shared row renderer for the chat list.
// Takes the chat plus the bundle of handlers/state the ChatItem needs.
function renderChatRow(c, ctx) {
  const {
    activeChatId,
    chatPhases,
    pendingNewChatId,
    queryLower,
    menu,
    renamingChat,
    deletingChatIds,
    searching,
    onSelectChat,
    onDismissNewChat,
    openItemMenu,
    onCommitRename,
    onCancelRename,
    onFinalizeDelete,
  } = ctx;
  const isRenaming =
    renamingChat?.id === c.id && renamingChat?.source === 'sidebar';
  const isDeleting = deletingChatIds?.has(c.id) === true;
  return (
    <ChatItem
      key={c.id}
      chat={c}
      responsePhase={chatPhases[c.id]}
      active={c.id === activeChatId}
      isPending={c.id === pendingNewChatId}
      query={queryLower}
      menuOpen={menu?.chatId === c.id}
      isRenaming={isRenaming}
      isDeleting={isDeleting}
      hideMenu={searching === true}
      onSelect={() => onSelectChat(c.id)}
      onDismiss={() => onDismissNewChat?.()}
      onMenuOpen={(e) => openItemMenu(c.id, e)}
      onCommitRename={(next) => onCommitRename?.(c.id, next)}
      onCancelRename={() => onCancelRename?.()}
      onCollapseEnd={() => onFinalizeDelete?.(c.id)}
    />
  );
}

// ── ChatItem ─────────────────────────────────────────
// Renders one row in the sidebar list. The "pending new chat" variant shows
// an X close button; everything else shows the … menu button.

// Easing constants for chat-row entrance / exit animations.
//
// The exit uses cubic-bezier(0.25, 0.1, 0.25, 1) — the standard CSS
// `ease` — which is the same curve the original prototype reused for
// FLIP reflows. On the way OUT this curve reads as "graceful collapse"
// because both control points stack at x=0.25, producing a near-step
// in the middle and a slow tail at the end: the row stays near full
// size for a beat, drops away fast, then trails off to invisible.
//
// On the way IN that same curve gets the user-perceived "stagger"
// they reported — nothing → pop in at near-final size → noticeable
// crawl to actually land. Using a pure decelerate curve for entrance
// (cubic-bezier(0, 0, 0.2, 1) — Material's "decelerate" easing) gives
// a single smooth motion: full velocity from the start, gentle
// landing into the natural state, no plateau in the middle.
//
// Keeping the curves direction-specific so each side feels right.
//
// Entrance also keeps padding OUT of the transition. The row uses
// box-sizing: border-box during the animation so height: 0 collapses
// the row including its padding (clipped via overflow: hidden) —
// without this, animating padding alongside height creates a "double
// bounce" feel where the row grows AND the content shifts down inside.
const ENTRANCE_TRANSITION =
  'height 200ms cubic-bezier(0, 0, 0.2, 1), ' +
  'opacity 200ms cubic-bezier(0, 0, 0.2, 1), ' +
  'margin 200ms cubic-bezier(0, 0, 0.2, 1)';
const EXIT_TRANSITION =
  'height 200ms cubic-bezier(0.25, 0.1, 0.25, 1), ' +
  'opacity 150ms ease, ' +
  'margin 200ms cubic-bezier(0.25, 0.1, 0.25, 1), ' +
  'padding 200ms cubic-bezier(0.25, 0.1, 0.25, 1)';

// Read the parent flex container's rowGap so the entrance/exit
// animations can offset it via negative margin — without this the
// rows below visibly snap up/down by `gap` px at the start/end of
// the transition (when the row's slot effectively appears/disappears
// from the layout). Returns 0 if the parent has no gap configured.
function readParentGap(el) {
  const parent = el.parentElement;
  if (!parent) return 0;
  const gapStr = getComputedStyle(parent).rowGap;
  return parseInt(gapStr, 10) || 0;
}

function ChatItem({
  chat,
  responsePhase,
  active,
  isPending,
  query,
  menuOpen,
  isRenaming,
  isDeleting,
  hideMenu,
  onSelect,
  onDismiss,
  onMenuOpen,
  onCommitRename,
  onCancelRename,
  onCollapseEnd,
}) {
  const titleNode = highlightTitle(chat.title, query);
  const rowRef = useRef(null);
  // The active transitionend listener for whichever animation is in
  // flight (entrance or exit). When the user dismisses a still-
  // expanding chat, the exit takes over and we need to cancel the
  // entrance's listener so its "clear inline styles" cleanup doesn't
  // fire on the exit's transitionend (which would snap the row back
  // to natural height for one frame before unmount).
  const animListenerRef = useRef(null);

  // Entrance animation — only runs once on mount, only for chats that
  // mount as pending (i.e. were just created via "New conversation").
  // Existing chats that were already in the list at app start render
  // at their natural size and skip this entirely.
  useLayoutEffect(() => {
    // chat.pending is the stable flag on the data; flipping it later
    // (when promoted to a real chat via handleSubmitMessage) does not
    // retrigger an animation because the row remounts under a new key.
    if (!chat.pending || chat.noEntranceAnim) return;
    const el = rowRef.current;
    if (!el) return;
    // Capture the natural target height (offsetHeight is border-box,
    // so it already includes the row's natural padding).
    const targetH = el.offsetHeight;
    const gap = readParentGap(el);
    // Switch to border-box so `height: 0` collapses the row including
    // its padding — the padding stays at its natural value but is
    // clipped by overflow: hidden, so we don't have to animate it.
    // This is the key fix for the "extra bounce" feel: with padding
    // animating alongside height, the row grew AND the content
    // shifted down inside it (padding-top: 0 → 6). Now the content
    // stays anchored at its natural position from the top edge and
    // simply reveals as the row's height grows.
    el.style.boxSizing = 'border-box';
    el.style.overflow = 'hidden';
    el.style.height = '0px';
    el.style.opacity = '0';
    el.style.marginTop = '0px';
    el.style.marginBottom = gap ? `-${gap}px` : '0px';
    // Reflow so the browser commits the closed state before we change
    // the targets — otherwise the transition gets optimized out.
    void el.offsetHeight;
    el.style.transition = ENTRANCE_TRANSITION;
    el.style.height = targetH + 'px';
    el.style.opacity = '1';
    el.style.marginBottom = '0px';
    function onEnd(ev) {
      if (ev.propertyName !== 'height') return;
      el.removeEventListener('transitionend', onEnd);
      if (animListenerRef.current === onEnd) animListenerRef.current = null;
      // Strip every inline style we set so the row goes back to
      // participating in normal flex layout — otherwise an explicit
      // `height: <px>` would prevent the row from re-sizing on
      // theme/font changes.
      el.style.boxSizing = '';
      el.style.transition = '';
      el.style.height = '';
      el.style.overflow = '';
      el.style.opacity = '';
      el.style.marginTop = '';
      el.style.marginBottom = '';
    }
    animListenerRef.current = onEnd;
    el.addEventListener('transitionend', onEnd);
    return () => {
      el.removeEventListener('transitionend', onEnd);
      if (animListenerRef.current === onEnd) animListenerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit animation — runs when the row is marked for deletion.
  useLayoutEffect(() => {
    if (!isDeleting) return;
    const el = rowRef.current;
    if (!el) return;
    // If the entrance is still in flight, drop its listener so it
    // doesn't fire on the exit's transitionend.
    if (animListenerRef.current) {
      el.removeEventListener('transitionend', animListenerRef.current);
      animListenerRef.current = null;
    }
    const startH = el.offsetHeight;
    el.style.overflow = 'hidden';
    el.style.height = startH + 'px';
    void el.offsetHeight;
    el.style.transition = EXIT_TRANSITION;
    el.style.opacity = '0';
    el.style.height = '0px';
    el.style.paddingTop = '0px';
    el.style.paddingBottom = '0px';
    el.style.marginTop = '0px';
    const gap = readParentGap(el);
    el.style.marginBottom = gap ? `-${gap}px` : '0px';
    function onEnd(ev) {
      if (ev.propertyName !== 'height') return;
      el.removeEventListener('transitionend', onEnd);
      if (animListenerRef.current === onEnd) animListenerRef.current = null;
      onCollapseEnd?.();
    }
    animListenerRef.current = onEnd;
    el.addEventListener('transitionend', onEnd);
    return () => {
      el.removeEventListener('transitionend', onEnd);
      if (animListenerRef.current === onEnd) animListenerRef.current = null;
    };
  }, [isDeleting, onCollapseEnd]);

  // Use chat.pending (stable flag on the data) for the empty-state
  // visual styling so the row keeps its muted look during the
  // collapse — even after pendingNewChatId has been cleared in Home
  // by the dismiss handler.
  const isEmptyStateVisual = chat.pending === true;

  return (
    <div
      ref={rowRef}
      className={`sidebar-item ${active ? 'active' : ''} ${isEmptyStateVisual ? 'empty-state' : ''}`}
      data-chat={chat.id}
      // Selecting the row while a rename or delete is in progress
      // would unmount the input mid-edit / interrupt the collapse;
      // bail here as a safety net for clicks landing on the row's
      // padding (the RenameInput also stops propagation).
      onClick={isRenaming || isDeleting ? undefined : onSelect}
      style={{ padding: '6px 8px', borderRadius: 6, cursor: isRenaming ? 'text' : 'pointer' }}
    >
      {isRenaming ? (
        // The title slot becomes the editable input. Keep `truncate`
        // off so long titles can scroll horizontally inside the
        // native input as the user types.
        <div style={{ fontSize: 13, fontWeight: 500, minWidth: 0, overflow: 'hidden' }} className="text-text-primary">
          <RenameInput
            value={chat.title}
            onCommit={onCommitRename}
            onCancel={onCancelRename}
            // Explicit line-height 18 instead of `inherit` keeps the
            // native selection highlight a tight box around the
            // glyphs (matches the other prototype's look) rather
            // than the full inherited line-height of the row.
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
        <div style={{ fontSize: 13, fontWeight: 500 }} className="text-text-secondary truncate">
          {titleNode}
        </div>
      )}
      <ChatStatus title={chat.title} timestamp={chat.timestamp} phase={responsePhase} />
      {/* No trailing affordance during the collapse — the row is
          fading + shrinking, and we don't want a kebab/X briefly
          flashing while pendingNewChatId has cleared but the row is
          still on screen. */}
      {isDeleting ? null : isPending ? (
        <div
          className="item-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
        >
          <CloseIcon size={12} />
        </div>
      ) : (
        // Kebab is hidden in two cases:
        //   - isRenaming: the close affordance for a sidebar-source
        //     rename lives in the conv header; keeping the sidebar
        //     row clean avoids a duplicate control.
        //   - hideMenu (search engaged): focus is on filtering the
        //     list, not managing individual rows.
        !isRenaming && !hideMenu && (
          <div
            className={`item-menu-btn ${menuOpen ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onMenuOpen?.(e);
            }}
          >
            <MenuDotsIcon size={14} />
          </div>
        )
      )}
    </div>
  );
}

// Highlight matching substring inside the chat title when filtering.
function highlightTitle(title, query) {
  if (!query) return title;
  const idx = title.toLowerCase().indexOf(query);
  if (idx === -1) return title;
  return (
    <>
      <span style={{ color: '#6a6a70' }}>{title.slice(0, idx)}</span>
      <span style={{ color: 'var(--color-text-primary)' }}>{title.slice(idx, idx + query.length)}</span>
      <span style={{ color: '#6a6a70' }}>{title.slice(idx + query.length)}</span>
    </>
  );
}

// ── NavRow is now imported from ../NavRow.jsx ─────────────────────────────────

function DashboardSwitcherIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g clipPath="url(#clip0_switcher)">
        <path d="M4.01562 5.58594C4.01562 6.76868 4.01562 8.36941 4.01562 9.39124C4.01562 9.94353 4.46334 10.3906 5.01562 10.3906H14.2656C14.8179 10.3906 15.2656 9.94291 15.2656 9.39062V1.78125C15.2656 1.22897 14.8179 0.78125 14.2656 0.78125H5.01563C4.46334 0.78125 4.01562 1.22897 4.01562 1.78125V3.18359" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10.0156 5.58594L1.76563 5.58594C1.21334 5.58594 0.765626 6.03365 0.765626 6.58594L0.765625 14.1953C0.765625 14.7476 1.21334 15.1953 1.76562 15.1953L11.0156 15.1953C11.5679 15.1953 12.0156 14.7476 12.0156 14.1953L12.0156 12.793" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9.00003 7.31155L10.7256 5.58594L9.00003 3.86032" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="clip0_switcher"><rect width="16" height="16" fill="white"/></clipPath>
      </defs>
    </svg>
  );
}

function SettingsGearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M7.99996 10C9.10453 10 9.99996 9.10457 9.99996 8C9.99996 6.89543 9.10453 6 7.99996 6C6.89539 6 5.99996 6.89543 5.99996 8C5.99996 9.10457 6.89539 10 7.99996 10ZM7.99996 11.5C9.93295 11.5 11.5 9.933 11.5 8C11.5 6.067 9.93295 4.5 7.99996 4.5C6.06696 4.5 4.49996 6.067 4.49996 8C4.49996 9.933 6.06696 11.5 7.99996 11.5Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.40917 14.5H8.59082L8.64285 13.6676C8.68604 12.9765 9.12642 12.4062 9.72215 12.1591C10.3207 11.9109 11.0352 12.0054 11.5529 12.4622L12.1784 13.014L13.0139 12.1785L12.4622 11.5531C12.0053 11.0354 11.9109 10.3208 12.1591 9.72222C12.4062 9.12646 12.9765 8.68604 13.6676 8.64285L14.5 8.59082V7.40918L13.6676 7.35715C12.9765 7.31396 12.4062 6.87355 12.1591 6.27781C11.9109 5.67926 12.0053 4.9647 12.4622 4.44695L13.0139 3.82163L12.1784 2.98608L11.553 3.53784C11.0353 3.99467 10.3207 4.0891 9.72218 3.84089C9.12644 3.59384 8.68604 3.02347 8.64285 2.33241L8.59082 1.5H7.40917L7.35715 2.33236C7.31396 3.02345 6.87354 3.59384 6.27778 3.8409C5.67921 4.08913 4.96463 3.99471 4.44686 3.53785L3.82153 2.98609L2.98598 3.82164L3.53784 4.44708C3.99465 4.9648 4.08908 5.67931 3.84088 6.27784C3.59384 6.87357 3.02348 7.31396 2.33245 7.35715L1.5 7.40917V8.59082L2.33241 8.64285C3.02346 8.68604 3.59383 9.12643 3.84089 9.72218C4.0891 10.3207 3.99467 11.0353 3.53784 11.553L2.98597 12.1785L3.82152 13.014L4.44696 12.4622C4.9647 12.0053 5.67925 11.9109 6.27781 12.1591C6.87356 12.4062 7.31396 12.9765 7.35715 13.6676L7.40917 14.5ZM4.51386 14.3779C4.57751 14.3386 4.63866 14.2934 4.69655 14.2424L5.4394 13.5869C5.51167 13.5231 5.61418 13.5078 5.70322 13.5447C5.79219 13.5816 5.85406 13.665 5.86007 13.7612L5.92186 14.7498C5.92668 14.8269 5.93797 14.902 5.95519 14.9748C5.96527 15.0175 5.9774 15.0593 5.99145 15.1002C6.17209 15.6264 6.67094 16 7.2526 16H8.7474C9.32903 16 9.82785 15.6264 10.0085 15.1003C10.0226 15.0594 10.0347 15.0175 10.0448 14.9749C10.062 14.9021 10.0733 14.8269 10.0781 14.7498L10.1399 13.7611C10.1459 13.665 10.2078 13.5816 10.2967 13.5447C10.3858 13.5078 10.4882 13.5232 10.5605 13.5869L11.3033 14.2424C11.3612 14.2935 11.4224 14.3387 11.4861 14.378C11.5234 14.401 11.5615 14.422 11.6004 14.441C12.1001 14.6852 12.717 14.5967 13.1283 14.1854L14.1853 13.1284C14.5966 12.7171 14.6851 12.1002 14.4408 11.6004C14.4218 11.5616 14.4009 11.5234 14.3779 11.4862C14.3385 11.4225 14.2934 11.3614 14.2423 11.3035L13.5869 10.5607C13.5231 10.4884 13.5077 10.3859 13.5447 10.2968C13.5816 10.2078 13.665 10.1459 13.7612 10.1399L14.7498 10.0781C14.8269 10.0733 14.902 10.062 14.9748 10.0448C15.0174 10.0347 15.0593 10.0226 15.1002 10.0086C15.6263 9.82795 16 9.32909 16 8.7474V7.2526C16 6.67093 15.6264 6.17209 15.1002 5.99144C15.0593 5.9774 15.0175 5.96527 14.9748 5.95519C14.902 5.93797 14.8269 5.92668 14.7498 5.92186L13.7612 5.86007C13.665 5.85406 13.5816 5.79219 13.5447 5.70321C13.5078 5.61417 13.5231 5.51166 13.5869 5.43938L14.2423 4.69666C14.2934 4.63873 14.3386 4.57754 14.3779 4.51384C14.4009 4.47658 14.4219 4.43846 14.4409 4.39963C14.6851 3.89987 14.5966 3.28297 14.1853 2.87168L13.1283 1.8147C12.717 1.40342 12.1001 1.31487 11.6004 1.55913C11.5615 1.57811 11.5234 1.5991 11.4861 1.6221C11.4224 1.66142 11.3613 1.70662 11.3033 1.75773L10.5606 2.41309C10.4883 2.47686 10.3858 2.49223 10.2968 2.4553C10.2078 2.41841 10.1459 2.33497 10.1399 2.23884L10.0781 1.25016C10.0733 1.17312 10.062 1.09795 10.0448 1.02516C10.0347 0.982504 10.0226 0.940667 10.0085 0.899751C9.8279 0.373623 9.32906 0 8.7474 0H7.2526C6.67091 0 6.17205 0.373663 5.99142 0.899834C5.97738 0.940737 5.96526 0.982562 5.95518 1.0252C5.93797 1.09798 5.92668 1.17314 5.92186 1.25016L5.86007 2.2388C5.85406 2.33495 5.79218 2.41842 5.70318 2.45532C5.61412 2.49225 5.51159 2.47688 5.43929 2.41309L4.69656 1.75774C4.63865 1.70665 4.57748 1.66146 4.51381 1.62215C4.47655 1.59915 4.43844 1.57817 4.39962 1.55919C3.89985 1.31487 3.2829 1.40341 2.87159 1.81472L1.81461 2.8717C1.40332 3.28298 1.31477 3.89987 1.55903 4.39963C1.57802 4.43848 1.59902 4.47662 1.62203 4.5139C1.66134 4.57758 1.70653 4.63876 1.75763 4.69667L2.41308 5.43951C2.47684 5.51177 2.4922 5.61425 2.45529 5.70326C2.4184 5.79221 2.33499 5.85406 2.23888 5.86007L1.25016 5.92186C1.17311 5.92668 1.09792 5.93797 1.02512 5.9552C0.982451 5.96529 0.940602 5.97742 0.899674 5.99147C0.373587 6.17215 0 6.67097 0 7.2526V8.7474C0 9.32905 0.373619 9.82789 0.899741 10.0085C0.940658 10.0226 0.982497 10.0347 1.02516 10.0448C1.09795 10.062 1.17312 10.0733 1.25016 10.0781L2.23884 10.1399C2.33497 10.1459 2.41841 10.2078 2.4553 10.2968C2.49222 10.3858 2.47686 10.4883 2.41309 10.5606L1.75762 11.3034C1.70654 11.3613 1.66137 11.4225 1.62207 11.4861C1.59906 11.5234 1.57806 11.5615 1.55907 11.6004C1.31475 12.1001 1.40328 12.7171 1.81459 13.1284L2.87157 14.1854C3.28289 14.5967 3.89985 14.6852 4.39963 14.4409C4.43846 14.4219 4.47659 14.4009 4.51386 14.3779Z" fill="currentColor"/>
    </svg>
  );
}
