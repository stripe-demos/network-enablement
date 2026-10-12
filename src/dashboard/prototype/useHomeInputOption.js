import { dashboardStorage } from '../lib/storage';
import { useCallback, useSyncExternalStore } from 'react';

/*
 * Which home input prototype is on screen, and how its switches are set, live in
 * the URL so a setup can be handed to someone as a link and survives a refresh
 * while the rest of the session resets.
 *
 * Storage still backs it, for two things the URL can't cover: the More menu
 * shows every variant's switches at once while the URL only ever describes the
 * one on screen, and the verification scripts seed a session through storage
 * behind `?keep-state`. So the URL wins where it says something, and storage
 * answers for everything else.
 */

const KEY = 'home-input-option';
const VARIANT_PARAM = 'variant';

export const HOME_INPUT_OPTIONS = [
  { id: 'button', label: 'Button' }, // Option 1 — current Ask Console button
  { id: 'toggle', label: 'Toggle' },
  { id: 'shortcut', label: 'Keyboard shortcut' },
];
// Where a visitor with no link and no stored session lands. The menu order still
// runs from the current Ask Console button, but the shortcut prototype is the one
// under review, so it's what an unqualified visit should open on.
const DEFAULT = 'shortcut';
const ids = new Set(HOME_INPUT_OPTIONS.map((option) => option.id));

/*
 * Every switch under More, in menu order. `key` is per variant where the two
 * prototypes each keep their own copy; `variants` is the set that shows the
 * switch at all, and so the set whose URL may name it.
 */
const SETTINGS = [
  {
    // On: the "Ask Console" label stays beside the switch in both modes, and the
    // console hint reads "Ask anything". Off: the label gives way once Console
    // is on and the hint takes over as "Ask Console".
    param: 'persistLabel',
    key: () => 'home-toggle-persist-label',
    defaultOn: true,
    variants: ['toggle'],
  },
  {
    // On: flipping the switch focuses the field and opens the Console
    // suggestions. Off: the switch only changes mode, and suggestions wait until
    // the user clicks into the field.
    param: 'autoFocus',
    key: () => 'home-toggle-auto-focus',
    defaultOn: true,
    variants: ['toggle'],
  },
  /* On: a Spotlight sits beside the input calling out the new way into Console.
     Off by default — the callout is unlikely to ship, so the prototypes should
     open on what they are actually proposing. */
  {
    param: 'showTooltip',
    key: (variant) => `home-${variant}-show-tooltip`,
    defaultOn: false,
    variants: ['toggle', 'shortcut'],
  },
  /*
   * Two takes on the same treatment: switching from Search into Console runs the
   * grey-to-colour swirl and settles the field's outline on a colour. Blurple to
   * lilac sweeps in on blurple and settles to lilac; Refresh gradient settles on
   * the three-stop brand gradient. `group` keeps them exclusive, since the field
   * has only the one outline.
   */
  {
    param: 'blurpleLilacFocus',
    key: (variant) => `home-${variant}-blurple-lilac-focus`,
    defaultOn: false,
    variants: ['toggle', 'shortcut'],
    group: 'focusTint',
  },
  {
    param: 'refreshGradient',
    key: (variant) => `home-${variant}-refresh-gradient`,
    defaultOn: false,
    variants: ['toggle', 'shortcut'],
    group: 'focusTint',
  },
  /*
   * On: the refresh swirl announces, fades back to the grey track, and from
   * there a colour arc grows around the field, its length tracking the query as
   * it's typed. Same focusTint group — the field has one outline.
   */
  {
    param: 'growGradient',
    key: (variant) => `home-${variant}-grow-gradient`,
    defaultOn: false,
    variants: ['toggle', 'shortcut'],
    group: 'focusTint',
  },
  /*
   * On: the refresh swirl announces and fades to the grey track as with Dynamic
   * type, but from there a colour pool follows the pointer around the field
   * rather than the query. Same focusTint group.
   */
  {
    // The decided baseline for now: the refresh swirl announces, fades back to
    // the grey track, and from there the refresh-coloured pool follows the
    // cursor. It's on by default, so it goes unstated in the URL — a bare link
    // renders the agreed set with no parameters, and the URL only fills in when
    // something is changed away from it. Flip back to false to make the clean
    // prototype the plain outline again.
    param: 'traceCursor',
    key: (variant) => `home-${variant}-trace-cursor`,
    defaultOn: true,
    variants: ['toggle', 'shortcut'],
    group: 'focusTint',
  },
  /*
   * The blurple sibling of Trace cursor: the blurple-to-lilac swirl announces
   * and fades to the grey track, then a blurple pool follows the pointer around
   * the field. Same focusTint group — the field has one outline.
   */
  {
    param: 'blurpleTrace',
    key: (variant) => `home-${variant}-blurple-trace`,
    defaultOn: false,
    variants: ['toggle', 'shortcut'],
    group: 'focusTint',
  },
  /* On: the persistent blurple-to-lilac gradient stays on the outline, and the
     blurple pointer pool traces the cursor on top of it. */
  {
    param: 'blurplePersistTrace',
    key: (variant) => `home-${variant}-blurple-persist-trace`,
    defaultOn: false,
    variants: ['toggle', 'shortcut'],
    group: 'focusTint',
  },
  /* On: the hint doubles as an unstyled button into Console. */
  {
    param: 'hiddenButton',
    key: (variant) => `home-${variant}-hidden-button`,
    defaultOn: false,
    variants: ['shortcut'],
  },
  /* On: typing a search query collapses the hint down to an arrow. */
  {
    param: 'typeArrow',
    key: (variant) => `home-${variant}-type-arrow`,
    defaultOn: false,
    variants: ['shortcut'],
  },
  /*
   * Two takes on the one-time shimmer that crosses the hint as the spotlight
   * arrives. Emphasize text runs a single brand band; Emphasize gradient runs
   * the three-stop Refresh gradient through it. `group` keeps them exclusive,
   * since both sweep the same run of text.
   */
  {
    param: 'emphasizeText',
    key: (variant) => `home-${variant}-emphasize-text`,
    defaultOn: false,
    variants: ['shortcut'],
    group: 'emphasis',
  },
  {
    param: 'emphasizeGradient',
    /* On by default: the refresh-gradient text shimmer always plays, and its
       menu control is hidden. Flip back to false to restore the earlier
       off-by-default behaviour if the control is brought back. */
    key: (variant) => `home-${variant}-emphasize-gradient`,
    defaultOn: true,
    variants: ['shortcut'],
    group: 'emphasis',
  },
];

/* ── URL as a subscribable store ─────────────────────────────────────────── */

const listeners = new Set();
let revision = 0;
let snapshot = `0|${window.location.search}`;

function notify() {
  // The counter matters alongside the query because a write can leave the URL
  // untouched — clearing a param that was already absent, or changing a setting
  // for a variant that isn't the one on screen — and still needs to land.
  revision += 1;
  snapshot = `${revision}|${window.location.search}`;
  listeners.forEach((fn) => fn());
}

window.addEventListener('popstate', notify);

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const getSnapshot = () => snapshot;

function param(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const PARAM_ORDER = [VARIANT_PARAM, ...SETTINGS.map((setting) => setting.param)];

// Our params are re-emitted in a fixed order, so the same setup always produces
// the same link however the switches were arrived at. Anything else on the URL
// keeps its place ahead of them.
function canonicalize(sp) {
  const out = new URLSearchParams();
  sp.forEach((value, name) => {
    if (!PARAM_ORDER.includes(name)) out.append(name, value);
  });
  PARAM_ORDER.forEach((name) => {
    if (sp.has(name)) out.set(name, sp.get(name));
  });
  return out;
}

function writeUrl(update) {
  const sp = new URLSearchParams(window.location.search);
  update(sp);
  const qs = canonicalize(sp).toString();
  window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
  // React Router only watches popstate, so a bare replaceState would leave its
  // own location stale and links built from it would drop these params. The
  // event doubles as the nudge for our own subscribers.
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/* ── Reading ─────────────────────────────────────────────────────────────── */

function readVariant() {
  const fromUrl = param(VARIANT_PARAM);
  if (ids.has(fromUrl)) return fromUrl;
  const stored = dashboardStorage.getItem(KEY);
  return ids.has(stored) ? stored : DEFAULT;
}

function readStored(setting, variant) {
  const stored = dashboardStorage.getItem(setting.key(variant));
  if (stored === 'on') return true;
  if (stored === 'off') return false;
  return setting.defaultOn;
}

function readSetting(setting, variant) {
  // A switch param only speaks for a URL that also names its variant. Without
  // that pairing it could be describing a different prototype's copy of the
  // same switch, so storage answers instead.
  if (param(VARIANT_PARAM) === variant) {
    const fromUrl = param(setting.param);
    if (fromUrl === 'on') return true;
    if (fromUrl === 'off') return false;
  }
  return readStored(setting, variant);
}

/* ── Writing ─────────────────────────────────────────────────────────────── */

// Defaults go unstated, so a link only carries what was deliberately changed.
function putSettingParam(sp, setting, variant, value) {
  if (!setting.variants.includes(variant) || value === setting.defaultOn) sp.delete(setting.param);
  else sp.set(setting.param, value ? 'on' : 'off');
}

function setVariant(next) {
  if (!ids.has(next)) return;
  dashboardStorage.setItem(KEY, next);
  writeUrl((sp) => {
    // Always stated, even at its default, so a shared link can't be quietly
    // overridden by whichever variant the recipient last looked at.
    sp.set(VARIANT_PARAM, next);
    // The switch params describe the variant on screen, so restate them for the
    // one being switched to rather than carrying the old variant's over.
    SETTINGS.forEach((setting) => putSettingParam(sp, setting, next, readStored(setting, next)));
  });
}

function setSetting(setting, variant, value) {
  // Raising a switch lowers the others in its group, which are alternatives to
  // it rather than additions. Turning one off leaves the rest alone: the group
  // is at most one on, not exactly one.
  const changes = [[setting, value]];
  if (value && setting.group) {
    SETTINGS.forEach((other) => {
      if (other !== setting && other.group === setting.group && other.variants.includes(variant)) {
        changes.push([other, false]);
      }
    });
  }
  changes.forEach(([entry, next]) => dashboardStorage.setItem(entry.key(variant), next ? 'on' : 'off'));
  // A switch belonging to one of the menu's other sections is stored but not
  // named in the URL, since the URL speaks for the variant on screen.
  if (variant !== readVariant()) {
    notify();
    return;
  }
  writeUrl((sp) => {
    // Stated alongside, so the switch param is never left to be read against
    // whichever variant happens to be showing later.
    sp.set(VARIANT_PARAM, variant);
    changes.forEach(([entry, next]) => putSettingParam(sp, entry, variant, next));
  });
}

// A link wins on arrival: copy what it carries into storage so switching to
// another variant and back doesn't lose it.
(function hydrateFromUrl() {
  const named = param(VARIANT_PARAM);
  if (!ids.has(named)) return;
  dashboardStorage.setItem(KEY, named);
  SETTINGS.forEach((setting) => {
    if (!setting.variants.includes(named)) return;
    const fromUrl = param(setting.param);
    if (fromUrl === 'on' || fromUrl === 'off') dashboardStorage.setItem(setting.key(named), fromUrl);
  });
})();

/* ── Hooks ───────────────────────────────────────────────────────────────── */

export function useHomeInputOption() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const value = readVariant();
  return [value, setVariant];
}

function createSettingHook(name) {
  const setting = SETTINGS.find((s) => s.param === name);
  return function useSetting(variant) {
    useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const value = readSetting(setting, variant);
    const set = useCallback((next) => setSetting(setting, variant, next), [variant]);
    return [value, set];
  };
}

export const useShowTooltip = createSettingHook('showTooltip');
export const useBlurpleLilacFocus = createSettingHook('blurpleLilacFocus');
export const useRefreshGradient = createSettingHook('refreshGradient');
export const useGrowGradient = createSettingHook('growGradient');
export const useTraceCursor = createSettingHook('traceCursor');
export const useBlurpleTrace = createSettingHook('blurpleTrace');
export const useBlurplePersistTrace = createSettingHook('blurplePersistTrace');
export const useHiddenButton = createSettingHook('hiddenButton');
export const useTypeArrow = createSettingHook('typeArrow');
export const useEmphasizeText = createSettingHook('emphasizeText');
export const useEmphasizeGradient = createSettingHook('emphasizeGradient');

const usePersistLabelSetting = createSettingHook('persistLabel');
const useAutoFocusSetting = createSettingHook('autoFocus');

/* Both belong to the Toggle prototype alone, so they don't take a variant. */
export function usePersistToggleLabel() {
  return usePersistLabelSetting('toggle');
}

export function useToggleAutoFocus() {
  return useAutoFocusSetting('toggle');
}
