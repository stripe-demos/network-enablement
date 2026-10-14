// Network onboarding step 3, version A ("Swipe"): a focused matching
// deck built around the 4 accounts it takes to go live. One recommended
// business shows at a time as its business profile card, with why it's a
// match. Skip or Invite (← / →) moves to the next ranked business; Undo takes
// back the last decision. At 4 invites a short success state appears, with
// "Invite more" to keep going. "Browse all businesses" opens search
// and filters inline for people who already know who they want.
//
// State: invites go to state.selectedAccountIds; deck progress (skips, the undo
// history and whether the user chose to keep going past 4) lives in
// state.findAccountsDeck so it survives Back and the step remounting.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button, color } from '@dashboard/ui'
import BusinessProfileCard from '../BusinessProfileCard'
import { StepHeading, TextButton } from '../networkControls'
import { ink, text } from '../networkTokens'
import { DECK, DECK_BY_ID, GO_LIVE_ACCOUNTS, RANK_ORDER, matchReasons, profileFor } from './findAccountsDeckData'
import { BrowseAll, GoalDots, KeyHint, MatchReasons, StackPeek } from './findAccountsDeckParts'

const EMPTY_DECK = { skippedIds: [], history: [], continuing: false }
const EASE = [0.2, 0, 0.1, 1]
// Compact pills centered under the card.
const pillButton = { height: 32, padding: '6px 12px', borderRadius: 9999, fontSize: 13, fontWeight: 500, lineHeight: '20px', letterSpacing: -0.065, boxShadow: 'none', gap: 6 }
// Swipe: a quick throw to the side with a slight tilt, eased out like a flick.
const THROW = [0.32, 0.72, 0, 1]
// The next card settles up out of the stack on a soft spring.
const SETTLE = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }

// `dir` is the last decision: 'skip' | 'invite' | 'undo-skip' | 'undo-invite'.
const cardVariants = {
  enter: ({ dir, reduce }) => {
    if (reduce) return { opacity: 0 }
    // Undo throws the card back in from the side it left.
    if (dir === 'undo-skip') return { opacity: 0, x: -260, rotate: -10 }
    if (dir === 'undo-invite') return { opacity: 0, x: 260, rotate: 10 }
    // Otherwise it starts where the peeking card sits behind the top, so it reads as the next card coming forward.
    return { opacity: 1, y: -8, scale: 0.97 }
  },
  center: ({ reduce }) => ({ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, zIndex: 1, transition: reduce ? { duration: 0.12 } : SETTLE }),
  exit: ({ dir, reduce }) => {
    if (reduce) return { opacity: 0, transition: { duration: 0.12 } }
    if (dir === 'skip') return { opacity: 0, x: -300, y: 16, rotate: -12, zIndex: 2, transition: { duration: 0.34, ease: THROW, opacity: { duration: 0.24, delay: 0.08 } } }
    if (dir === 'invite') return { opacity: 0, x: 300, y: 16, rotate: 12, zIndex: 2, transition: { duration: 0.34, ease: THROW, opacity: { duration: 0.24, delay: 0.08 } } }
    return { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.18, ease: EASE } } // back into the stack
  },
}

function usePrefersReducedMotion() {
  const system = useReducedMotion()
  const prototype = typeof document !== 'undefined' && document.documentElement.getAttribute('data-prototype-reduced-motion') === 'true'
  return Boolean(system || prototype)
}

/** Text-style button that, unlike TextButton, passes through aria and title props. */
function LinkButton({ children, ...rest }) {
  return (
    <button type="button" {...rest} style={{ ...text.link, padding: 0, border: 0, background: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
      {children}
    </button>
  )
}

const isTyping = el => el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName))

/**
 * Shown in the card's place once 4 are invited. After the "Add multi-currency
 * account" card in Figma Sally's Sandbox (329:46431): a light panel with the
 * deck's line art, a white pill of overlapping avatars ending in a + that
 * invites more, and the invited handles underneath. Invites count as sent once
 * swiped.
 */
function SuccessPanel({ invited, onInviteMore, headingRef }) {
  const businesses = invited.map(id => DECK_BY_ID.get(id)?.candidate).filter(Boolean)
  const shown = businesses.slice(0, 4)
  const handles = businesses.map(c => `@${c.handle}`).join(' · ')
  const avatar = { width: 31, height: 31, marginRight: -12, borderRadius: 9999, border: '2px solid #FFFFFF', boxSizing: 'border-box', flexShrink: 0, overflow: 'hidden' }
  return (
    <div
      style={{
        gridArea: '1 / 1',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minHeight: 200,
        padding: 24,
        boxSizing: 'border-box',
        background: ink.areaFill,
        border: '1px solid #D4DEE9',
        borderRadius: 8,
      }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', left: -84.5, right: -90.5, top: -65, height: 288, opacity: 0.6, pointerEvents: 'none' }}>
        <img src="/dashboard-assets/network/card-waves.svg" alt="" width="453" height="288" style={{ display: 'block', width: '100%', height: '100%' }} />
      </span>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px 7px 7px', background: '#FFFFFF', borderRadius: 9999, boxShadow: '0 1px 2px rgba(20,35,51,0.06)' }}>
        <span style={{ display: 'flex', alignItems: 'center', paddingRight: 12 }}>
          {shown.map(c => (
            <span key={c.id} style={avatar}>
              <img src={profileFor(c).logo} alt="" width="27" height="27" style={{ display: 'block', width: 27, height: 27 }} />
            </span>
          ))}
          <button
            type="button"
            onClick={onInviteMore}
            aria-label="Invite more businesses"
            title="Invite more"
            style={{ ...avatar, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: '#D9DBFC', color: '#273951', cursor: 'pointer', fontSize: 16, lineHeight: '16px' }}
          >
            +
          </button>
        </span>
        <h2 ref={headingRef} tabIndex={-1} style={{ margin: 0, outline: 'none', fontSize: 13, fontWeight: 600, lineHeight: '20px', color: '#273951', whiteSpace: 'nowrap' }}>
          {`${businesses.length} ${businesses.length === 1 ? 'business' : 'businesses'} invited`}
        </h2>
      </div>

      {handles && <p style={{ position: 'relative', ...text.body, margin: 0, textAlign: 'center' }}>{handles}</p>}
    </div>
  )
}

/** Shown in the card's place when every business has been decided. */
function EmptyPanel({ skippedCount, onReviewSkipped, onBrowse }) {
  return (
    <div style={{ gridArea: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 24, background: ink.areaFill, borderRadius: 24 }}>
      <h2 style={{ ...text.title, margin: 0 }}>You’ve seen every recommended business.</h2>
      <p style={{ ...text.body, margin: 0 }}>Review the ones you skipped, or browse all businesses to search the network.</p>
      <span style={{ display: 'flex', gap: 16 }}>
        {skippedCount > 0 && <TextButton onClick={onReviewSkipped}>{`Review ${skippedCount} skipped`}</TextButton>}
        <TextButton onClick={onBrowse}>Browse all businesses</TextButton>
      </span>
    </div>
  )
}

export default function FindAccountsDeckStep({ state, setState, onValidChange }) {
  const reduce = usePrefersReducedMotion()
  const [dir, setDir] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [browsing, setBrowsing] = useState(false)
  const successHeadingRef = useRef(null)
  const inviteButtonRef = useRef(null)
  const browseRef = useRef(null)

  const invitedIds = state.selectedAccountIds ?? []
  const invited = new Set(invitedIds)
  const deck = { ...EMPTY_DECK, ...state.findAccountsDeck }
  const skipped = new Set(deck.skippedIds)
  const queue = DECK.filter(r => !invited.has(r.candidate.id) && !skipped.has(r.candidate.id))
  const current = queue[0]
  const showSuccess = invitedIds.length >= GO_LIVE_ACCOUNTS && !deck.continuing
  const showCard = !showSuccess && Boolean(current)
  const lastDecision = deck.history[deck.history.length - 1]

  useEffect(() => { onValidChange?.(true) }, [onValidChange])

  // Move focus to the success message when it replaces the card and buttons.
  const wasSuccess = useRef(showSuccess)
  useEffect(() => {
    if (showSuccess && !wasSuccess.current) successHeadingRef.current?.focus({ preventScroll: true })
    wasSuccess.current = showSuccess
  }, [showSuccess])

  const decide = action => {
    if (!current) return
    const id = current.candidate.id
    const name = current.candidate.name
    setDir(action)
    setState(prev => {
      const prevDeck = { ...EMPTY_DECK, ...prev.findAccountsDeck }
      const ids = prev.selectedAccountIds ?? []
      return {
        selectedAccountIds: action === 'invite' ? [...ids, id] : ids,
        findAccountsDeck: {
          ...prevDeck,
          skippedIds: action === 'skip' ? [...prevDeck.skippedIds, id] : prevDeck.skippedIds,
          history: [...prevDeck.history, { id, action }],
        },
      }
    })
    const nextCount = invitedIds.length + (action === 'invite' ? 1 : 0)
    setAnnouncement(action === 'invite' ? `Invited ${name}. ${nextCount} of ${GO_LIVE_ACCOUNTS} invited.` : `Skipped ${name}.`)
  }

  const undo = () => {
    if (!lastDecision) return
    const { id, action } = lastDecision
    setDir(`undo-${action}`)
    setState(prev => {
      const prevDeck = { ...EMPTY_DECK, ...prev.findAccountsDeck }
      return {
        selectedAccountIds: action === 'invite' ? (prev.selectedAccountIds ?? []).filter(x => x !== id) : prev.selectedAccountIds,
        findAccountsDeck: {
          ...prevDeck,
          skippedIds: action === 'skip' ? prevDeck.skippedIds.filter(x => x !== id) : prevDeck.skippedIds,
          history: prevDeck.history.slice(0, -1),
        },
      }
    })
    const name = DECK_BY_ID.get(id)?.candidate.name ?? 'business'
    setAnnouncement(action === 'invite' ? `Removed invite for ${name}.` : `Brought back ${name}.`)
  }

  const inviteMore = () => {
    setDir(null)
    setState(prev => ({ findAccountsDeck: { ...EMPTY_DECK, ...prev.findAccountsDeck, continuing: true } }))
    requestAnimationFrame(() => inviteButtonRef.current?.focus({ preventScroll: true }))
  }

  const reviewSkipped = () => {
    setDir(null)
    setState(prev => ({ findAccountsDeck: { ...EMPTY_DECK, ...prev.findAccountsDeck, skippedIds: [], history: [] } }))
  }

  const openBrowse = () => {
    setBrowsing(true)
    requestAnimationFrame(() => browseRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }))
  }

  // Browse all toggles invites directly; it isn't a deck decision, so it doesn't enter the undo history.
  const toggleFromBrowse = (id, next) => {
    setState(prev => {
      const set = new Set(prev.selectedAccountIds ?? [])
      if (next) set.add(id)
      else set.delete(id)
      const kept = (prev.selectedAccountIds ?? []).filter(x => set.has(x))
      const added = RANK_ORDER.filter(x => set.has(x) && !kept.includes(x))
      const prevDeck = { ...EMPTY_DECK, ...prev.findAccountsDeck }
      return {
        selectedAccountIds: [...kept, ...added],
        findAccountsDeck: { ...prevDeck, history: prevDeck.history.filter(h => h.id !== id) },
      }
    })
  }

  // ← Skip, → Invite. Ignored while typing in search or a filter.
  const keyActions = useRef({})
  useLayoutEffect(() => { keyActions.current = { showCard, decide } })
  useEffect(() => {
    const onKey = e => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      const { showCard: canDecide, decide: act } = keyActions.current
      if (!canDecide) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); act('skip') }
      else if (e.key === 'ArrowRight') { e.preventDefault(); act('invite') }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const reasons = current ? matchReasons(current) : []
  const custom = { dir, reduce }

  // Undo, under the buttons. Without a card it also carries the goal progress.
  const progressRow = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: showCard ? 'flex-end' : 'space-between', gap: 16 }}>
      {!showCard && <GoalDots count={invitedIds.length} total={DECK.length} />}
      <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastDecision && (
          <LinkButton
            onClick={undo}
            title={`Undo ${lastDecision.action === 'invite' ? 'invite' : 'skip'}`}
            aria-label={`Undo ${lastDecision.action === 'invite' ? 'invite for' : 'skip for'} ${DECK_BY_ID.get(lastDecision.id)?.candidate.name ?? 'last business'}`}
          >
            Undo
          </LinkButton>
        )}
      </span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
        <StepHeading title="Find your first connected accounts.">
          Review businesses already on Stripe one at a time, and invite the ones that fit your platform.
        </StepHeading>
      </div>

      <p className="sr-only" aria-live="polite">{announcement}</p>

      {/* Deck: the next two cards peek out from behind the top, as in Figma Treasury Rewards. */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {showCard && <StackPeek depth={Math.min(2, queue.length - 1)} />}
        <div style={{ display: 'grid' }}>
          <AnimatePresence initial={false} custom={custom}>
            {showCard && (
              <motion.div
                key={current.candidate.id}
                custom={custom}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ gridArea: '1 / 1', position: 'relative', zIndex: 1 }}
              >
                <BusinessProfileCard {...profileFor(current.candidate)} width="100%" handleTooltip surface="deck" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {showSuccess && <SuccessPanel invited={invitedIds} onInviteMore={inviteMore} headingRef={successHeadingRef} />}
        {!showSuccess && !current && <EmptyPanel skippedCount={skipped.size} onReviewSkipped={reviewSkipped} onBrowse={openBrowse} />}
      </div>

      {!showCard && !showSuccess && progressRow}

      {showCard && (
        <>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={current.candidate.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <MatchReasons reasons={reasons} />
            </motion.div>
          </AnimatePresence>

        </>
      )}

      {/* Skip, progress toward 4, Invite: under "Why it's a match". */}
      {showCard && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Button
            variant="secondary"
            onClick={() => decide('skip')}
            aria-label={`Skip ${current.candidate.name}`}
            aria-keyshortcuts="ArrowLeft"
            style={{ ...pillButton, background: '#F1F6FB', color: ink.primary, outline: 'none' }}
          >
            <KeyHint direction="left" />
            Skip
          </Button>
          <GoalDots count={invitedIds.length} total={DECK.length} />
          <Button
            ref={inviteButtonRef}
            variant="primary"
            onClick={() => decide('invite')}
            aria-label={`Invite ${current.candidate.name}`}
            aria-keyshortcuts="ArrowRight"
            style={{ ...pillButton, background: color.actionPrimary }}
          >
            Invite
            <KeyHint direction="right" />
          </Button>
        </div>
      )}

      {showCard && progressRow}

      {showSuccess ? (
        // Once 4 are invited, just point to where they can find more.
        <p style={{ ...text.body, margin: 0, paddingTop: 16, borderTop: `1px solid ${ink.divider}` }}>
          Find more businesses anytime in Network.
        </p>
      ) : (
        <>
          {/* Escape hatch: the full list */}
          <div ref={browseRef} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: `1px solid ${ink.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ ...text.body }}>Know who you want to invite?</span>
              <LinkButton aria-expanded={browsing} onClick={() => (browsing ? setBrowsing(false) : openBrowse())}>
                {browsing ? 'Hide all businesses' : 'Browse all businesses'}
              </LinkButton>
            </div>
            {browsing && <BrowseAll selected={invited} onToggle={toggleFromBrowse} />}
          </div>
        </>
      )}
    </div>
  )
}
