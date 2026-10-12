// Customize picks are saved as descriptions of the picked element, so they can
// be found again after navigating, reloading, or switching surfaces. A pick
// matches on its own page by position alone, and on other pages only when the
// text also matches (shared chrome like sidebar links).

const UI_SELECTOR = '[data-wireframe-ui]';
const TEXT_LENGTH = 60;
// React's `useId` values change between renders, so they can't anchor a path.
const STABLE_ID = /^[A-Za-z][\w-]*$/;

const normalizedText = el => el.textContent.replace(/\s+/g, ' ').trim().slice(0, TEXT_LENGTH);

function selectorFor(el) {
  const steps = [];
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    if (node.id && STABLE_ID.test(node.id)) {
      steps.unshift(`#${CSS.escape(node.id)}`);
      return steps.join(' > ');
    }
    let index = 1;
    for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
      if (sibling.localName === node.localName) index += 1;
    }
    steps.unshift(`${node.localName}:nth-of-type(${index})`);
  }
  steps.unshift('body');
  return steps.join(' > ');
}

export function describePick(el) {
  const selector = selectorFor(el);
  const text = normalizedText(el);
  const path = location.pathname;
  return { key: `${selector}|${text || path}`, selector, text, path };
}

function resolve(pick) {
  let el;
  try {
    el = document.querySelector(pick.selector);
  } catch {
    return null;
  }
  if (!el || el.closest(UI_SELECTOR)) return null;
  if (pick.path === location.pathname) return el;
  return pick.text && normalizedText(el) === pick.text ? el : null;
}

function release(el) {
  delete el.dataset.wfPick;
  delete el.dataset.wfReveal;
}

/** Keeps `picks` revealed as the page changes underneath them. */
export function startPickSync(picks) {
  function apply() {
    const wanted = new Map();
    for (const pick of picks) {
      const el = resolve(pick);
      if (el) wanted.set(el, pick.key);
    }
    for (const el of document.querySelectorAll('[data-wf-pick]')) {
      if (!wanted.has(el)) release(el);
    }
    for (const [el, key] of wanted) {
      if (el.dataset.wfPick !== key) el.dataset.wfPick = key;
      if (!el.hasAttribute('data-wf-reveal')) el.dataset.wfReveal = '';
    }
  }

  // Applied synchronously so a newly rendered page never paints its picks as blocks.
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
  apply();

  return function stopPickSync() {
    observer.disconnect();
    for (const el of document.querySelectorAll('[data-wf-pick]')) release(el);
  };
}
