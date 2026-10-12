// Customize mode: while picking, hovering content previews it at full fidelity
// (`data-wf-preview`) and clicking toggles it as a pick (see flowPicks.js).
// Dragging draws a selection box that picks everything it touches. Page clicks
// are swallowed so picking content doesn't also navigate or open menus.

const UI_SELECTOR = '[data-wireframe-ui]';
const CONTROLS = 'input, textarea, select, button, a, [role="button"], [role="tab"], [role="menuitem"], [aria-haspopup]';
const TARGETS = `[data-wf-text], [data-wf="icon"], [data-wf="media"], ${CONTROLS}`;
// Larger clickable areas (e.g. a card that's one big link) are picked piece by piece.
const CONTROL_MAX_HEIGHT = 48;
// Text is picked as a whole paragraph, heading, list item, or row, unless that
// block is really a large container.
const INLINE_DISPLAYS = new Set(['inline', 'inline-block', 'inline-flex', 'contents']);
const TEXT_BLOCK_MAX_HEIGHT = 320;

function textBlockOf(el) {
  let block = el;
  while (block.parentElement && block.parentElement !== document.body && INLINE_DISPLAYS.has(getComputedStyle(block).display)) {
    block = block.parentElement;
  }
  return block.getBoundingClientRect().height <= TEXT_BLOCK_MAX_HEIGHT ? block : el;
}
const SWALLOWED_EVENTS = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'dblclick', 'contextmenu'];
// How far the pointer moves before a press becomes a drag selection.
const DRAG_THRESHOLD = 5;

const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/**
 * `groupTargets` (e.g. charts) are picked as a whole rather than piece by piece.
 * `onPick(el)` toggles a pick; already picked elements carry `data-wf-pick`.
 * `onSelect(els)` gets everything touched by a drag selection.
 */
export function startCustomPicker({ groupTargets = '', onPick, onSelect }) {
  const root = document.documentElement;
  root.dataset.wfCustom = 'on';
  let preview = null;
  let drag = null;
  let suppressClick = false;

  const isUi = node => Boolean(node?.closest?.(UI_SELECTOR));

  function targetFrom(node) {
    if (!(node instanceof Element) || isUi(node)) return null;
    const group = groupTargets && node.closest(groupTargets);
    if (group) return group;
    // Links inside a sentence belong to its text block.
    const control = node.closest(CONTROLS);
    if (control && getComputedStyle(control).display !== 'inline' && control.getBoundingClientRect().height <= CONTROL_MAX_HEIGHT) {
      return control;
    }
    const text = node.closest('[data-wf-text]');
    if (text) return textBlockOf(text);
    return node.closest(TARGETS);
  }

  function setPreview(el) {
    const next = el && !el.closest('[data-wf-reveal]') ? el : null;
    if (next === preview) return;
    if (preview) delete preview.dataset.wfPreview;
    preview = next;
    if (preview) preview.dataset.wfPreview = '';
  }

  const onPointerOver = event => {
    if (!drag) setPreview(targetFrom(event.target));
  };
  const onPointerOut = event => {
    if (!event.relatedTarget && !drag) setPreview(null);
  };

  function swallow(event) {
    if (isUi(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  // Everything a drag could pick, resolved once when the drag starts: working
  // out each element's target is the costly part, and it can't change mid-drag.
  function allTargets() {
    const found = new Set();
    for (const candidate of document.querySelectorAll(groupTargets ? `${TARGETS}, ${groupTargets}` : TARGETS)) {
      const target = targetFrom(candidate);
      if (target) found.add(target);
    }
    return [...found];
  }

  // Targets touched by the selection box, outermost only, skipping content
  // that's already showing as part of a larger pick.
  function targetsIn(box, candidates) {
    const touched = new Set();
    for (const target of candidates) {
      const rect = target.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || !intersects(rect, box)) continue;
      const revealed = target.closest('[data-wf-reveal]');
      if (revealed && revealed !== target) continue;
      touched.add(target);
    }
    const hasTouchedAncestor = target => {
      for (let node = target.parentElement; node; node = node.parentElement) if (touched.has(node)) return true;
      return false;
    };
    return [...touched].filter(target => !hasTouchedAncestor(target));
  }

  function dragBox() {
    return {
      left: Math.min(drag.x, drag.currentX),
      right: Math.max(drag.x, drag.currentX),
      top: Math.min(drag.y, drag.currentY),
      bottom: Math.max(drag.y, drag.currentY),
    };
  }

  function setDragPreview(targets) {
    for (const el of drag.previewed) if (!targets.includes(el)) delete el.dataset.wfPreview;
    for (const el of targets) el.dataset.wfPreview = '';
    drag.previewed = targets;
  }

  function updateDrag() {
    drag.frame = 0;
    const box = dragBox();
    Object.assign(drag.marquee.style, {
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.right - box.left}px`,
      height: `${box.bottom - box.top}px`,
    });
    setDragPreview(targetsIn(box, drag.candidates));
  }

  function onPointerDown(event) {
    if (event.button !== 0 || isUi(event.target)) return;
    drag = { x: event.clientX, y: event.clientY, currentX: event.clientX, currentY: event.clientY, marquee: null, candidates: [], previewed: [], frame: 0 };
  }

  function onPointerMove(event) {
    if (!drag) return;
    drag.currentX = event.clientX;
    drag.currentY = event.clientY;
    if (!drag.marquee) {
      if (Math.hypot(drag.currentX - drag.x, drag.currentY - drag.y) < DRAG_THRESHOLD) return;
      setPreview(null);
      drag.candidates = allTargets();
      drag.marquee = document.createElement('div');
      drag.marquee.className = 'ps-marquee';
      drag.marquee.setAttribute('data-wireframe-ui', '');
      // On <html>, after the grayscale overlay, so the purple isn't desaturated.
      document.documentElement.append(drag.marquee);
    }
    if (!drag.frame) drag.frame = requestAnimationFrame(updateDrag);
  }

  function endDrag() {
    if (!drag) return [];
    cancelAnimationFrame(drag.frame);
    const targets = drag.marquee ? targetsIn(dragBox(), drag.candidates) : [];
    for (const el of drag.previewed) delete el.dataset.wfPreview;
    drag.marquee?.remove();
    drag = null;
    return targets;
  }

  function onPointerUp() {
    if (!drag?.marquee) {
      endDrag();
      return;
    }
    // The click that follows a drag lands on whatever's under the pointer.
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    const targets = endDrag();
    if (targets.length) onSelect(targets);
  }

  function onClick(event) {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (isUi(event.target)) return;
    swallow(event);
    const target = targetFrom(event.target);
    if (!target) return;
    const revealed = target.closest('[data-wf-reveal]');
    setPreview(null);
    if (revealed && !revealed.dataset.wfPick) delete revealed.dataset.wfReveal;
    else onPick(revealed ?? target);
  }

  window.addEventListener('pointerover', onPointerOver, true);
  window.addEventListener('pointerout', onPointerOut, true);
  window.addEventListener('click', onClick, true);
  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('pointercancel', endDrag, true);
  for (const type of SWALLOWED_EVENTS) window.addEventListener(type, swallow, true);

  return function stopCustomPicker() {
    window.removeEventListener('pointerover', onPointerOver, true);
    window.removeEventListener('pointerout', onPointerOut, true);
    window.removeEventListener('click', onClick, true);
    window.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('pointermove', onPointerMove, true);
    window.removeEventListener('pointerup', onPointerUp, true);
    window.removeEventListener('pointercancel', endDrag, true);
    for (const type of SWALLOWED_EVENTS) window.removeEventListener(type, swallow, true);
    endDrag();
    setPreview(null);
    delete root.dataset.wfCustom;
  };
}

const POPUP_ROLES = '[role="menu"], [role="listbox"], [role="dialog"]';
// Menus can mount a beat after the press that opens them (state updates, animations).
const POPUP_WINDOW_MS = 500;

function isPopup(el) {
  if (el.parentElement === document.body || el.matches(POPUP_ROLES)) return true;
  const { position } = getComputedStyle(el);
  return position === 'fixed' || position === 'absolute';
}

/**
 * After Done: menus, dropdowns, and other popups opened from picked content
 * show at full fidelity too, since they're usually portaled outside it.
 */
export function startPopupFollower() {
  let armedUntil = 0;

  const onPointerDown = event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-wf-reveal]') && !target.closest(UI_SELECTOR)) {
      armedUntil = performance.now() + POPUP_WINDOW_MS;
    }
  };

  const observer = new MutationObserver(records => {
    if (performance.now() > armedUntil) return;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element) || node.closest(`[data-wf-reveal], ${UI_SELECTOR}`)) continue;
        if (isPopup(node)) node.dataset.wfReveal = '';
      }
    }
  });

  window.addEventListener('pointerdown', onPointerDown, true);
  observer.observe(document.body, { childList: true, subtree: true });

  return function stopPopupFollower() {
    window.removeEventListener('pointerdown', onPointerDown, true);
    observer.disconnect();
  };
}

/** Clears popups revealed alongside picks. */
export function clearReveals() {
  for (const el of document.querySelectorAll('[data-wf-reveal]')) delete el.dataset.wfReveal;
}
