/* eslint-disable react-refresh/only-export-components */
import { useLayoutEffect, useRef } from 'react'

/** Shared enter motion for page and tab content. */
export const FADE_SLIDE_IN = { duration: 300, distance: 10, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }

const ANIMATION_ID = 'dui-fade-slide-in'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    || document.documentElement.getAttribute('data-prototype-reduced-motion') === 'true'
}

/**
 * Fades + slides elements up into place. Uses the Web Animations API with
 * `fill: 'backwards'`, so once it finishes the element is back to
 * `transform: none` — a lingering transform would break `position: fixed`
 * descendants. Reduced motion gets a fade only.
 */
export function playFadeSlideIn(elements, { duration = FADE_SLIDE_IN.duration, distance = FADE_SLIDE_IN.distance } = {}) {
  const keyframes = prefersReducedMotion()
    ? [{ opacity: 0 }, { opacity: 1 }]
    : [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'none' }]
  return elements.filter(el => el?.animate).map(el => {
    el.getAnimations().forEach(a => { if (a.id === ANIMATION_ID) a.cancel() })
    const animation = el.animate(keyframes, { duration, easing: FADE_SLIDE_IN.easing, fill: 'backwards' })
    animation.id = ANIMATION_ID
    return animation
  })
}

function siblingsAfter(el) {
  const out = []
  for (let node = el.nextElementSibling; node; node = node.nextElementSibling) out.push(node)
  return out
}

/**
 * Replays the fade-slide-in on `ref` whenever `transitionKey` changes.
 * `target: 'nextSiblings'` animates everything after `ref` in the same parent
 * instead — for content under a tab bar that can't take a wrapper without
 * changing sticky containment.
 */
export function useFadeSlideIn(ref, transitionKey, { appear = false, target = 'self' } = {}) {
  const prevKeyRef = useRef(appear ? Symbol('initial') : transitionKey)
  useLayoutEffect(() => {
    if (prevKeyRef.current === transitionKey) return
    prevKeyRef.current = transitionKey
    const el = ref.current
    if (!el) return
    playFadeSlideIn(target === 'nextSiblings' ? siblingsAfter(el) : [el])
  }, [ref, transitionKey, target])
}

/**
 * Wrapper that fades + slides its children in when `transitionKey` changes
 * (e.g. the active tab). Pass `appear` to also animate on mount.
 */
export function FadeSlideIn({ transitionKey, appear = false, as: Tag = 'div', children, ...rest }) {
  const ref = useRef(null)
  useFadeSlideIn(ref, transitionKey, { appear })
  return <Tag ref={ref} {...rest}>{children}</Tag>
}
