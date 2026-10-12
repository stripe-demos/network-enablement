import { dashboardStorage } from '../lib/storage';
export const SEARCH_PROTOTYPE_CONTROLS_KEY = 'dashboard:prototype-controls:search'
export const SEARCH_PROTOTYPE_CONTROLS_CHANNEL = 'dashboard:prototype-controls:search'

/* Superseded copy that should fall back to the current default when replayed from storage. */
export const LEGACY_LEGAL_COPY = 'Console is in preview and can make mistakes.'

/* The greetings the clock itself can produce. A stored value matching one of
   these is treated as uncustomised, so an earlier session can't pin the
   greeting to the wrong time of day. */
export const TIME_OF_DAY_GREETINGS = ['Good morning', 'Good afternoon', 'Good evening']

/* Read from the visitor's own clock on every call so the greeting reflects
   where and when they're loading the prototype. */
export function getTimeOfDayGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return TIME_OF_DAY_GREETINGS[0]
  if (hour < 17) return TIME_OF_DAY_GREETINGS[1]
  return TIME_OF_DAY_GREETINGS[2]
}

export const DEFAULT_SEARCH_PROTOTYPE_CONTROLS = {
  defaultIcon: 'search',
  activeSearchIcon: 'search',
  activeConsoleIcon: 'none',
  searchIconOpacity: 50,
  thinkingIconOpacity: 100,
  spotlightGrayBar: 'default',
  spotlightHideSuggestedHeader: false,
  spotlightAnimation: 'fade-in',
  suggestedPromptHeaderCopy: 'Suggestions',
  suggestedFilterHeaderCopy: 'Filters',
  placeholderDefault: 'Search',
  activeRotationEnabled: false,
  uiLanguage: 'en',
  searchPlaceholder: 'Search',
  consolePlaceholder: 'Ask Console',
  /* Blank defers to the visitor's clock; only typed copy overrides it. */
  greetingCopy: '',
  greetingDateEnabled: true,
  greetingWeekdayEnabled: true,
  todayCopy: 'Your overview',
  overviewCopy: 'Performance',
  legalCopy: 'Console is in preview, and AI can make mistakes.',
  consoleButtonCopy: 'Ask Console',
  buttonMorphEnabled: true,
  buttonDefaultVisible: true,
  buttonChromeHidden: false,
  buttonChromeGrey: false,
  buttonChromeHideIcon: true,
  buttonStyleDefault: 'toggle-x',
  buttonStyleActive: 'black',
  buttonToggleXClearInput: true,
  buttonToggleXGrey: true,
  buttonBorderRadius: 6,
  buttonFontSize: 12,
  buttonTextEasing: 'framer-snappy-rotate',
  inputWidth: 480,
  inputHeight: 48,
  inputGrowOnClick: false,
  stickyTransitionMs: 0,
  stickyEasing: 'framer-smooth',
  stickyStyle: 'compact',
  nonStickyBorderRadius: 8,
  stickyBorderRadius: 8,
  inputColor: '#FFFFFF',
  inputShadowPreset: 'current',
  inputShadowFlip: false,
  inputShadowX: 0,
  inputShadowY: 1,
  inputShadowBlur: 4,
  inputShadowOpacity: 4,
  chromeSearchShadow: false,
  promptLaunchThinkingMs: 1000,
  consoleThinkingMs: 600,
  taskStepIntervalMs: 3500,
  ghostBlocks: 'none',
  consoleAutoSubmit: 'off',
  inputBorderColor: 'default',
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function normalizeString(value, fallback) {
  return typeof value === 'string' ? value : fallback
}

function normalizeOption(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

export function normalizeSearchPrototypeControls(values = {}) {
  const legacySelectedIcon = values.selectedIcon
  const iconOptions = ['search', 'thinking', 'none']

  return {
    ...DEFAULT_SEARCH_PROTOTYPE_CONTROLS,
    ...values,
    defaultIcon: normalizeOption(values.defaultIcon ?? legacySelectedIcon, iconOptions, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.defaultIcon),
    activeSearchIcon: normalizeOption(values.activeSearchIcon, iconOptions, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.activeSearchIcon),
    activeConsoleIcon: normalizeOption(values.activeConsoleIcon, iconOptions, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.activeConsoleIcon),
    searchIconOpacity: clampNumber(values.searchIconOpacity, 0, 100, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.searchIconOpacity),
    thinkingIconOpacity: clampNumber(values.thinkingIconOpacity, 0, 100, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.thinkingIconOpacity),
    spotlightGrayBar: normalizeOption(
      values.spotlightGrayBar === true ? 'default' : values.spotlightGrayBar === false ? 'small' : values.spotlightGrayBar,
      ['small', 'default', 'banner'],
      DEFAULT_SEARCH_PROTOTYPE_CONTROLS.spotlightGrayBar,
    ),
    spotlightHideSuggestedHeader: values.spotlightHideSuggestedHeader === true,
    spotlightAnimation: normalizeOption(values.spotlightAnimation, ['slide-down', 'fade-in'], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.spotlightAnimation),
    suggestedPromptHeaderCopy: normalizeString(values.suggestedPromptHeaderCopy, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.suggestedPromptHeaderCopy),
    suggestedFilterHeaderCopy: normalizeString(values.suggestedFilterHeaderCopy, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.suggestedFilterHeaderCopy),
    placeholderDefault: normalizeString(values.placeholderDefault, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.placeholderDefault),
    activeRotationEnabled: (values.activeRotationEnabled ?? values.placeholderRotationEnabled) === true,
    uiLanguage: normalizeOption(values.uiLanguage, ['en', 'ja', 'de'], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.uiLanguage),
    searchPlaceholder: normalizeString(values.searchPlaceholder, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.searchPlaceholder),
    consolePlaceholder: normalizeString(values.consolePlaceholder === 'Ask anything' ? undefined : values.consolePlaceholder, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.consolePlaceholder),
    greetingCopy: normalizeString(TIME_OF_DAY_GREETINGS.includes(values.greetingCopy) ? undefined : values.greetingCopy, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.greetingCopy),
    greetingDateEnabled: values.greetingDateEnabled !== false,
    greetingWeekdayEnabled: values.greetingWeekdayEnabled !== false,
    todayCopy: normalizeString(values.todayCopy === 'Today' ? undefined : values.todayCopy, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.todayCopy),
    overviewCopy: normalizeString(values.overviewCopy, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.overviewCopy),
    legalCopy: normalizeString(values.legalCopy === LEGACY_LEGAL_COPY ? undefined : values.legalCopy, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.legalCopy),
    consoleButtonCopy: normalizeString(values.consoleButtonCopy, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.consoleButtonCopy),
    buttonMorphEnabled: values.buttonMorphEnabled !== false,
    buttonDefaultVisible: values.buttonDefaultVisible !== false,
    buttonChromeHidden: values.buttonChromeHidden === true,
    buttonChromeGrey: values.buttonChromeGrey === true,
    buttonChromeHideIcon: values.buttonChromeHideIcon === true,
    buttonStyleDefault: normalizeOption(values.buttonStyleDefault, ['gray', 'outline', 'cap', 'toggle-x', 'text-string', 'flip-flop', 'flip-flop-2', 'toggle', 'outline-button', 'outline-button-right'], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.buttonStyleDefault),
    buttonStyleActive: normalizeOption(values.buttonStyleActive, ['black', 'outline'], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.buttonStyleActive),
    buttonToggleXClearInput: values.buttonToggleXClearInput === true,
    buttonToggleXGrey: values.buttonToggleXGrey === true,
    buttonBorderRadius: clampNumber(values.buttonBorderRadius, 0, 20, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.buttonBorderRadius),
    buttonFontSize: normalizeOption(Number(values.buttonFontSize), [12, 13, 14], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.buttonFontSize),
    buttonTextEasing: normalizeOption(values.buttonTextEasing, [
      'fluid',
      'snappy',
      'soft',
      'spring',
      'bounce',
      'framer-smooth',
      'framer-snappy',
      'framer-snappy-rotate',
      'framer-back',
      'framer-spring',
      'framer-bouncy',
    ], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.buttonTextEasing),
    inputWidth: clampNumber(values.inputWidth, 240, 560, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputWidth),
    inputHeight: clampNumber(values.inputHeight, 28, 64, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputHeight),
    inputGrowOnClick: (values.inputGrowOnClick ?? DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputGrowOnClick) !== false,
    stickyTransitionMs: clampNumber(values.stickyTransitionMs, 0, 1200, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.stickyTransitionMs),
    stickyEasing: normalizeOption(values.stickyEasing, [
      'standard',
      'ease-out',
      'spring',
      'framer-smooth',
      'framer-soft-slow',
      'framer-snappy',
      'framer-back',
      'framer-spring',
      'framer-bouncy',
    ], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.stickyEasing),
    stickyStyle: normalizeOption(values.stickyStyle, ['compact', 'soft', 'snappy'], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.stickyStyle),
    nonStickyBorderRadius: clampNumber(values.nonStickyBorderRadius, 0, 24, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.nonStickyBorderRadius),
    stickyBorderRadius: clampNumber(values.stickyBorderRadius, 0, 24, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.stickyBorderRadius),
    inputColor: normalizeString(values.inputColor, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputColor),
    inputShadowPreset: normalizeOption(values.inputShadowPreset, ['current', 'current-up', 'shadow-1', 'no-border-1', 'shadow-2', 'shadow-3', 'shadow-4', 'shadow-5'], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputShadowPreset),
    inputShadowFlip: values.inputShadowFlip === true,
    inputShadowX: clampNumber(values.inputShadowX, -8, 8, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputShadowX),
    inputShadowY: clampNumber(values.inputShadowY, -8, 16, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputShadowY),
    inputShadowBlur: clampNumber(values.inputShadowBlur, 0, 32, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputShadowBlur),
    inputShadowOpacity: clampNumber(values.inputShadowOpacity, 0, 30, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputShadowOpacity),
    chromeSearchShadow: (values.chromeSearchShadow ?? DEFAULT_SEARCH_PROTOTYPE_CONTROLS.chromeSearchShadow) !== false,
    promptLaunchThinkingMs: clampNumber(values.promptLaunchThinkingMs, 0, 5000, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.promptLaunchThinkingMs),
    consoleThinkingMs: clampNumber(values.consoleThinkingMs, 0, 3000, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.consoleThinkingMs),
    taskStepIntervalMs: clampNumber(values.taskStepIntervalMs, 500, 5000, DEFAULT_SEARCH_PROTOTYPE_CONTROLS.taskStepIntervalMs),
    ghostBlocks: ['none', 'chat', 'chat+history', 'full'].includes(values.ghostBlocks) ? values.ghostBlocks : DEFAULT_SEARCH_PROTOTYPE_CONTROLS.ghostBlocks,
    consoleAutoSubmit: ['off', 'instant', 'beat'].includes(values.consoleAutoSubmit) ? values.consoleAutoSubmit : DEFAULT_SEARCH_PROTOTYPE_CONTROLS.consoleAutoSubmit,
    inputBorderColor: normalizeOption(values.inputBorderColor, ['default', 'crisp', 'hover'], DEFAULT_SEARCH_PROTOTYPE_CONTROLS.inputBorderColor),
  }
}

const SEARCH_MIGRATION_KEY = 'dashboard:prototype-controls:search-version-12-defaults'
let _searchMigrationDone = false

function ensureSearchMigration() {
  if (_searchMigrationDone) return
  _searchMigrationDone = true
  if (typeof window === 'undefined') return
  if (dashboardStorage.getItem(SEARCH_MIGRATION_KEY) === 'true') return
  dashboardStorage.removeItem(SEARCH_PROTOTYPE_CONTROLS_KEY)
  dashboardStorage.removeItem('dialkit:console-surge-search')
  dashboardStorage.removeItem('dialkit:console-surge-transitions')
  dashboardStorage.removeItem('dialkit:console-surge-collapsed')
  dashboardStorage.removeItem('dialkit:console-surge-back-button')
  dashboardStorage.setItem(SEARCH_MIGRATION_KEY, 'true')
}

export function readSearchPrototypeControls() {
  ensureSearchMigration()
  try {
    const raw = dashboardStorage.getItem(SEARCH_PROTOTYPE_CONTROLS_KEY)
    return normalizeSearchPrototypeControls(raw ? JSON.parse(raw) : {})
  } catch {
    return DEFAULT_SEARCH_PROTOTYPE_CONTROLS
  }
}

export function publishSearchPrototypeControls(values) {
  applySearchPrototypeControls(values)
  dashboardStorage.setItem(SEARCH_PROTOTYPE_CONTROLS_KEY, JSON.stringify(values))
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel(SEARCH_PROTOTYPE_CONTROLS_CHANNEL)
    channel.postMessage(values)
    channel.close()
  }
}

export function applySearchPrototypeControls(values) {
  const controls = normalizeSearchPrototypeControls(values)
  const root = document.documentElement
  const buttonEasing = {
    fluid: { duration: 220, curve: 'cubic-bezier(0.2, 0, 0.1, 1)' },
    snappy: { duration: 180, curve: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    soft: { duration: 260, curve: 'cubic-bezier(0.33, 1, 0.68, 1)' },
    spring: { duration: 280, curve: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    bounce: { duration: 320, curve: 'cubic-bezier(0.22, 1.45, 0.36, 1)' },
    'framer-smooth': { duration: 240, curve: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    'framer-snappy': { duration: 190, curve: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    'framer-snappy-rotate': { duration: 190, curve: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    'framer-back': { duration: 320, curve: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    'framer-spring': { duration: 300, curve: 'cubic-bezier(0.34, 1.2, 0.64, 1)' },
    'framer-bouncy': { duration: 340, curve: 'cubic-bezier(0.22, 1.65, 0.36, 1)' },
  }[controls.buttonTextEasing]
  root.style.setProperty('--prototype-search-icon-opacity', String(controls.searchIconOpacity / 100))
  root.style.setProperty('--prototype-thinking-icon-opacity', String(controls.thinkingIconOpacity / 100))
  root.style.setProperty('--prototype-search-sticky-transition-ms', `${controls.stickyTransitionMs}ms`)
  root.style.setProperty('--prototype-search-button-x-duration', `${buttonEasing.duration}ms`)
  root.style.setProperty('--prototype-search-button-x-opacity-duration', `${Math.round(buttonEasing.duration * 0.82)}ms`)
  root.style.setProperty('--prototype-search-button-x-ease', buttonEasing.curve)
  root.setAttribute('data-prototype-search-icon', controls.defaultIcon)
  root.setAttribute('data-prototype-search-active-icon', controls.activeSearchIcon)
  root.setAttribute('data-prototype-console-active-icon', controls.activeConsoleIcon)
  root.setAttribute('data-prototype-search-button-visible', controls.buttonDefaultVisible ? 'true' : 'false')
  root.setAttribute('data-prototype-search-button-chrome-hidden', controls.buttonChromeHidden ? 'true' : 'false')
  root.setAttribute('data-prototype-search-button-chrome-grey', controls.buttonChromeGrey ? 'true' : 'false')
  root.setAttribute('data-prototype-search-button-chrome-hide-icon', controls.buttonChromeHideIcon ? 'true' : 'false')
  root.setAttribute('data-prototype-search-button-morph', controls.buttonMorphEnabled ? 'true' : 'false')
  root.setAttribute('data-prototype-search-button-default-style', controls.buttonStyleDefault)
  root.setAttribute('data-prototype-search-button-active-style', controls.buttonStyleActive)
  root.setAttribute('data-prototype-search-button-x-easing', controls.buttonTextEasing)
  root.setAttribute('data-prototype-spotlight-animation', controls.spotlightAnimation)
  root.setAttribute('data-prototype-search-sticky-easing', controls.stickyEasing)
  root.setAttribute('data-prototype-search-sticky-style', controls.stickyStyle)
  root.setAttribute('data-prototype-search-input-grow-on-click', controls.inputGrowOnClick ? 'true' : 'false')
  root.setAttribute('data-prototype-search-chrome-shadow', controls.chromeSearchShadow ? 'true' : 'false')
  root.setAttribute('data-prototype-search-shadow-flip', controls.inputShadowFlip ? 'true' : 'false')
  root.setAttribute('data-prototype-search-shadow-preset', controls.inputShadowPreset)
  root.style.setProperty('--prototype-search-radius', `${controls.nonStickyBorderRadius}px`)
  root.style.setProperty('--prototype-search-sticky-radius', `${controls.stickyBorderRadius}px`)
  root.style.setProperty('--prototype-search-input-color', controls.inputColor)
  const inputShadow = {
    current: `${controls.inputShadowX}px ${controls.inputShadowY}px ${controls.inputShadowBlur}px rgba(33, 37, 44, ${controls.inputShadowOpacity / 100}), 0 0.5px 1px rgba(33, 37, 44, ${controls.inputShadowOpacity / 200})`,
    'current-up': `${controls.inputShadowX}px ${controls.inputShadowY + 2}px ${controls.inputShadowBlur + 2}px rgba(33, 37, 44, ${(controls.inputShadowOpacity) / 100}), 0 1px 2px rgba(33, 37, 44, ${controls.inputShadowOpacity / 200})`,
    'shadow-1': '0 2px 4px -1px rgba(20, 34, 52, 0.05), 0 1px 2px 0 rgba(20, 34, 52, 0.06), 0 0 3px 0 rgba(20, 34, 52, 0.07)',
    'no-border-1': '0 2px 4px -1px rgba(20, 34, 52, 0.05), 0 1px 2px 0 rgba(20, 34, 52, 0.06), 0 0 3px 0 rgba(20, 34, 52, 0.07)',
    'shadow-2': '0 6px 12px -3px rgba(20, 34, 52, 0.05), 0 2px 4px -1px rgba(20, 34, 52, 0.05), 0 1px 2px 0 rgba(20, 34, 52, 0.06), 0 0 3px 0 rgba(20, 34, 52, 0.07)',
    'shadow-3': '0 12px 24px -6px rgba(20, 34, 52, 0.04), 0 6px 12px -3px rgba(20, 34, 52, 0.05), 0 2px 4px -1px rgba(20, 34, 52, 0.05), 0 1px 2px 0 rgba(20, 34, 52, 0.06), 0 0 3px 0 rgba(20, 34, 52, 0.07)',
    'shadow-4': '0 24px 48px -12px rgba(20, 34, 52, 0.04), 0 12px 24px -6px rgba(20, 34, 52, 0.04), 0 6px 12px -3px rgba(20, 34, 52, 0.05), 0 2px 4px -1px rgba(20, 34, 52, 0.05), 0 1px 2px 0 rgba(20, 34, 52, 0.06), 0 0 3px 0 rgba(20, 34, 52, 0.07)',
    'shadow-5': '0 48px 96px -24px rgba(20, 34, 52, 0.04), 0 24px 48px -12px rgba(20, 34, 52, 0.04), 0 12px 24px -6px rgba(20, 34, 52, 0.04), 0 6px 12px -3px rgba(20, 34, 52, 0.05), 0 2px 4px -1px rgba(20, 34, 52, 0.05), 0 1px 2px 0 rgba(20, 34, 52, 0.06), 0 0 3px 0 rgba(20, 34, 52, 0.07)',
  }[controls.inputShadowPreset]
  root.style.setProperty(
    '--prototype-search-input-shadow',
    inputShadow,
  )
  const borderColorMap = {
    default: '#EBEEF1',
    crisp: '#E3E8ED',
    hover: '#D4DEE9',
  }
  root.style.setProperty('--prototype-search-input-border-color', borderColorMap[controls.inputBorderColor] || borderColorMap.default)
  return controls
}
