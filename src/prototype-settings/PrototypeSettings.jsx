import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { startWireframe } from './wireframeEngine';
import { clearReveals, startCustomPicker, startPopupFollower } from './customPicker';
import { describePick, startPickSync } from './flowPicks';
import { exportScreenshot } from './exportScreenshot';
import FlowDialog from './FlowDialog';
import DiscardDialog from './DiscardDialog';
import FlowMenu from './FlowMenu';
import { derivePalette, pageTheme } from './palette';
import { prefersReducedMotion } from './revealEffect';
import './prototypeSettings.css';

// Console and Dashboard share these default keys so wireframe mode and flows
// follow you between them. A prototype that passes `storageKey` gets its own,
// so prototypes served from the same origin don't see each other's flows.
// `picks` is what's shown right now; `flows` are saved sets of picks, and
// `activeFlowId` is the one last loaded or saved (empty for the default flow).
// Height of the docked bar, which the page makes room for.
const BAR_HEIGHT = 44;
// How long the bar takes to slide back down (matches `ps-bar-out`).
const BAR_EXIT_MS = 190;
// How long the pen button takes to shrink away when wireframe turns on.
const PEN_EXIT_MS = 220;

const storageKeys = storageKey => (storageKey
  ? { settings: `${storageKey}-settings-v1`, flows: `${storageKey}-flows-v1` }
  : { settings: 'prototype-settings-v1', flows: 'prototype-flows-v1' });

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The setting still applies for this page when storage is unavailable.
  }
}

function readSettings(key) {
  const saved = readJson(key);
  return {
    enabled: saved?.enabled === true,
    color: saved?.color === true,
  };
}

function readFlows(key) {
  const saved = readJson(key);
  const flows = Array.isArray(saved?.flows) ? saved.flows : [];
  return {
    picks: Array.isArray(saved?.picks) ? saved.picks : [],
    flows,
    activeFlowId: flows.some(f => f.id === saved?.activeFlowId) ? saved.activeFlowId : '',
  };
}

// Lucide "pen-tool", the same nib as the Customize cursor.
function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z" />
      <path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18" />
      <path d="m2.3 2.3 7.286 7.286" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

// Sail "customizeBrand", inlined so the tool stays free of package imports.
function BrandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M5.41979 0.95124C5.72025 0.649918 6.10412 0.498855 6.49997 0.49805C6.89794 0.497241 7.30789 0.648307 7.60996 0.951248L8.5982 1.94236C8.60195 1.94612 8.60511 1.94797 8.60813 1.94921C8.61136 1.95053 8.61709 1.95219 8.62611 1.95219H10.0237C10.8791 1.95219 11.5722 2.65042 11.5722 3.50308V4.90467C11.5722 5.31888 11.2365 5.65467 10.8222 5.65467C10.408 5.65467 10.0722 5.31888 10.0722 4.90467V3.50308C10.0722 3.47834 10.0443 3.45219 10.0237 3.45219H8.62611C8.22274 3.45219 7.83032 3.29665 7.53601 3.00148L6.54776 2.01037C6.53435 1.99692 6.4954 1.99692 6.48198 2.01037L5.49371 3.00148C5.19939 3.29664 4.80697 3.45219 4.4036 3.45219H3.00608C2.98542 3.45219 2.95751 3.47834 2.95751 3.50308V4.90467C2.95751 5.30727 2.80322 5.69979 2.509 5.99486L1.52076 6.98597C1.50712 6.99965 1.50712 7.04445 1.52076 7.05813L2.509 8.04924C2.80324 8.34433 2.95751 8.73689 2.95751 9.13946V10.541C2.95751 10.5658 2.98542 10.5919 3.00608 10.5919H4.4036C4.81782 10.5919 5.1536 10.9277 5.1536 11.3419C5.1536 11.7561 4.81782 12.0919 4.4036 12.0919H3.00608C2.1506 12.0919 1.45751 11.3937 1.45751 10.541V9.13946C1.45751 9.12955 1.45568 9.12302 1.45412 9.11916C1.45264 9.11552 1.45055 9.11211 1.4468 9.10836L0.458562 8.11725C0.155279 7.81309 -0.00264286 7.41195 2.16965e-06 7.01167C0.00260146 6.6183 0.160523 6.22575 0.458562 5.92685L1.4468 4.93574C1.45056 4.93197 1.45265 4.92855 1.45412 4.92493C1.45569 4.92109 1.45751 4.91458 1.45751 4.90467V3.50308C1.45751 2.65042 2.1506 1.95219 3.00608 1.95219H4.4036C4.41262 1.95219 4.41835 1.95053 4.42158 1.94921C4.4246 1.94797 4.42776 1.94612 4.43151 1.94236L5.41979 0.95124Z" />
      <path d="M0.750002 14C0.335789 14 2.16965e-06 14.3358 2.16965e-06 14.75C2.16965e-06 15.1642 0.335789 15.5 0.750002 15.5H4.50337C4.91758 15.5 5.25337 15.1642 5.25337 14.75C5.25337 14.3358 4.91758 14 4.50337 14H0.750002Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12.8629 12.0734L15.692 7.6787C15.8963 7.37146 15.9972 7.02226 15.9998 6.67575C16.0041 6.09385 15.7311 5.51954 15.2051 5.16424C14.3847 4.61013 13.2626 4.80234 12.6934 5.63592L9.64422 9.85562C9.63172 9.85865 9.61924 9.86178 9.60679 9.86501C8.88487 10.05 8.16126 10.5539 7.84241 11.5625C7.47646 12.6718 7.07575 13.4886 6.75954 14.0513C6.60972 14.2871 6.58949 14.5803 6.70273 14.8327C6.81932 15.0926 7.0516 15.2595 7.30562 15.3103C9.98826 15.9246 11.6832 14.9194 12.4038 13.8861C12.7956 13.3342 12.937 12.6888 12.8629 12.0734ZM10.9283 11.4742C10.6898 11.3155 10.2992 11.2349 9.98276 11.3171L9.97979 11.3179C9.68528 11.3932 9.41274 11.5686 9.27175 12.0174L9.26862 12.0274C9.01377 12.8007 8.74164 13.449 8.48543 13.9821C10.0701 14.1126 10.8856 13.4421 11.1747 13.0263L11.1796 13.0194C11.5293 12.5283 11.4095 11.8335 10.9283 11.4742ZM11.3774 10.0182C11.523 10.0818 11.6601 10.1572 11.7851 10.2428L11.7945 10.2492L11.8037 10.2559C11.9065 10.331 12.0026 10.4128 12.0916 10.5002L14.4341 6.86144L14.4421 6.84929C14.5478 6.69199 14.5022 6.49958 14.3655 6.40727C14.2116 6.30329 14.0227 6.34683 13.9305 6.48418C13.9257 6.49132 13.9208 6.49837 13.9158 6.50534L11.3774 10.0182Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M6.49913 8.49932C7.3272 8.49986 7.99892 7.82901 7.99945 7.00093C7.99998 6.17286 7.32913 5.50114 6.50106 5.50061C5.67299 5.50008 5.00127 6.17093 5.00074 6.999C5.0002 7.82707 5.67106 8.49879 6.49913 8.49932ZM9.49945 7.0019C9.49838 8.6584 8.15466 10.0004 6.49816 9.99932C4.84166 9.99826 3.49967 8.65453 3.50074 6.99803C3.5018 5.34154 4.84553 3.99954 6.50203 4.00061C8.15852 4.00168 9.50052 5.3454 9.49945 7.0019Z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <path d="M8 3v5h7M8 21v-7h8v7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

function Switch({ checked, labelledBy, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      className="ps-switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={onToggle}
    >
      <span className="ps-switch-thumb" />
    </button>
  );
}

/**
 * Floating prototype settings. The Wireframe toggle turns the page grayscale
 * and blocks out its content; clicking or dragging over content brings it
 * back at full fidelity. Done makes the page usable again with the
 * picks kept across pages, and the picks can be saved as a flow. Every prop
 * is optional (see README.md): without a `palette` or `theme` they follow the
 * page's own background, and `storageKey` keeps this prototype's saved state
 * separate from others on the same origin.
 */
export default function PrototypeSettings({
  surface = 'prototype',
  palette,
  charts = [],
  chartHoverCards = [],
  pickGroups = [],
  fitSelectors = [],
  defaultFlowLabel = 'Default',
  theme: givenTheme,
  bottomOffset = 16,
  storageKey,
}) {
  const { settings: settingsKey, flows: flowsKey } = storageKeys(storageKey);
  const [settings, setSettings] = useState(() => readSettings(settingsKey));
  const [flowState, setFlowState] = useState(() => readFlows(flowsKey));
  const [detectedTheme] = useState(pageTheme);
  const theme = givenTheme ?? detectedTheme;
  // The controls live in their own element on <html>, outside <body>, so they
  // aren't part of the page that makes room for the bar.
  const [host] = useState(() => {
    const element = document.createElement('div');
    element.setAttribute('data-wireframe-ui', '');
    return element;
  });
  useLayoutEffect(() => {
    document.documentElement.append(host);
    return () => host.remove();
  }, [host]);
  const titleId = useId();
  const colorId = useId();
  // Picking blocks the page, so it only starts on its own when nothing is picked yet.
  const [picking, setPicking] = useState(() => flowState.picks.length === 0);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  // The bar stays up while it slides back down, so wireframe is already off but
  // the bar (and the room the page made for it) lingers.
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(0);
  // The pen button shrinks away as the bar arrives and pops back once the bar is gone.
  const [penLeaving, setPenLeaving] = useState(false);
  const [penPopIn, setPenPopIn] = useState(false);
  const penTimer = useRef(0);
  useEffect(() => () => {
    clearTimeout(closeTimer.current);
    clearTimeout(penTimer.current);
  }, []);
  // Where the outline dissolve starts and ends, handed to the engine by the
  // toggle: only a user toggle plays it, not loading the page with wireframe on.
  const dissolve = useRef({ intro: null, outro: null });
  const { enabled, color } = settings;
  const docked = enabled || closing;
  const { picks, flows, activeFlowId } = flowState;
  const activeFlow = flows.find(f => f.id === activeFlowId);
  const keep = chartHoverCardKeep().join(', ');
  const groupTargets = [...charts, ...pickGroups].join(', ');

  // Chart hover cards render outside their charts, so they follow the hovered
  // chart: always while picking (hovering previews it), otherwise only once picked.
  function chartHoverCardKeep() {
    if (picking) return chartHoverCards;
    const pickedChart = `:is(${charts.join(', ')})[data-wf-reveal]:hover`;
    return chartHoverCards.map(card => `body:has(${pickedChart}) ${card}`);
  }

  function updateFlows(update) {
    setFlowState(state => ({ ...state, ...update(state) }));
  }

  function togglePick(el) {
    const key = el.dataset.wfPick;
    updateFlows(state => ({
      picks: key ? state.picks.filter(p => p.key !== key) : [...state.picks, describePick(el)],
    }));
  }

  // A drag selection adds what it touched, or removes it when it was all picked.
  function selectPicks(els) {
    const unpicked = els.filter(el => !el.dataset.wfPick);
    if (unpicked.length === 0) {
      const keys = new Set(els.map(el => el.dataset.wfPick));
      updateFlows(state => ({ picks: state.picks.filter(p => !keys.has(p.key)) }));
      return;
    }
    const added = unpicked.map(describePick);
    updateFlows(state => ({
      picks: [...state.picks, ...added.filter(pick => !state.picks.some(p => p.key === pick.key))],
    }));
  }

  function selectFlow(id) {
    const flow = flows.find(f => f.id === id);
    updateFlows(() => ({ activeFlowId: id, picks: flow ? flow.picks : [] }));
    setPicking(!flow);
  }

  function saveFlow(name) {
    const id = `flow-${Date.now().toString(36)}`;
    updateFlows(state => ({ flows: [...state.flows, { id, name, picks: state.picks }], activeFlowId: id }));
    setSaving(false);
  }

  function overrideFlow() {
    updateFlows(state => ({
      flows: state.flows.map(f => (f.id === state.activeFlowId ? { ...f, picks: state.picks } : f)),
    }));
    setSaving(false);
  }

  // Deletes the loaded saved flow, if any, and starts over from a fully wireframed page.
  function discardFlow() {
    updateFlows(state => ({
      flows: state.flows.filter(f => f.id !== state.activeFlowId),
      activeFlowId: '',
      picks: [],
    }));
    setDiscarding(false);
    setPicking(true);
  }

  async function onExport() {
    setExporting(true);
    try {
      await exportScreenshot(`${surface}-wireframe`, wireframe.current?.colorRegions());
    } catch (error) {
      console.error('Screenshot export failed', error);
    } finally {
      setExporting(false);
    }
  }

  // `keep` changes when switching between editing and done; it's applied to the
  // running engine rather than restarting it.
  const wireframe = useRef(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const origins = dissolve.current;
    const engine = startWireframe({ palette: palette ?? derivePalette(), keep, color, intro: origins.intro });
    origins.intro = null;
    wireframe.current = engine;
    return () => {
      // The wireframe waits for the bar to slide away before it dissolves.
      engine.stop({ outro: origins.outro, delay: BAR_EXIT_MS });
      origins.outro = null;
      wireframe.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, palette]);

  useEffect(() => {
    wireframe.current?.setKeep(keep);
  }, [keep]);

  useEffect(() => {
    wireframe.current?.setColor(color);
  }, [color]);

  useEffect(() => {
    if (!enabled) return undefined;
    return clearReveals;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    return startPickSync(picks);
  }, [enabled, picks]);

  useEffect(() => {
    if (!enabled || !picking) return undefined;
    return startCustomPicker({ groupTargets, onPick: togglePick, onSelect: selectPicks });
    // `togglePick` and `selectPicks` only use state setters, so stale copies behave the same.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, picking, groupTargets]);

  useEffect(() => {
    if (!enabled || picking) return undefined;
    return startPopupFollower();
  }, [enabled, picking]);

  useEffect(() => writeJson(settingsKey, settings), [settingsKey, settings]);
  useEffect(() => writeJson(flowsKey, flowState), [flowsKey, flowState]);

  useEffect(() => {
    const onStorage = event => {
      if (event.key === settingsKey) setSettings(readSettings(settingsKey));
      if (event.key === flowsKey) setFlowState(readFlows(flowsKey));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [settingsKey, flowsKey]);

  // While the bar is up the page gives up its bottom edge: the root element is
  // marked and the CSS shrinks <body> by the reserved height. That height
  // eases in and out with the bar's slide, so no gap shows beneath the bar.
  useLayoutEffect(() => {
    if (!docked) return undefined;
    const root = document.documentElement;
    return () => {
      delete root.dataset.psBar;
      root.style.removeProperty('--ps-bar-h');
    };
  }, [docked]);
  useLayoutEffect(() => {
    if (!docked) return;
    const root = document.documentElement;
    root.dataset.psBar = enabled ? 'on' : 'closing';
    root.style.setProperty('--ps-bar-h', enabled ? `${BAR_HEIGHT}px` : '0px');
  }, [docked, enabled]);

  // Elements the page sizes to the full viewport (h-screen, 100vh) are listed
  // by the prototype, since a rule on <body> can't shrink them.
  const fitCss = fitSelectors.join(', ');
  useLayoutEffect(() => {
    if (!docked || !fitCss) return undefined;
    const style = document.createElement('style');
    style.setAttribute('data-wireframe-ui', '');
    style.textContent = `html[data-ps-bar] :is(${fitCss}) { height: calc(100vh - var(--ps-bar-h)) !important; }`;
    document.head.append(style);
    return () => style.remove();
  }, [docked, fitCss]);

  function onToggleWireframe() {
    const origin = { x: window.innerWidth - 32, y: window.innerHeight - bottomOffset - 16 };
    const animate = !prefersReducedMotion();
    clearTimeout(closeTimer.current);
    clearTimeout(penTimer.current);
    if (enabled) {
      dissolve.current.outro = origin;
      setClosing(animate);
      setPenLeaving(false);
      // The pen starts growing back while the bar is still sliding away, from beneath it.
      setPenPopIn(animate);
      closeTimer.current = setTimeout(() => setClosing(false), BAR_EXIT_MS);
    } else {
      dissolve.current.intro = origin;
      setClosing(false);
      setPenPopIn(false);
      setPenLeaving(animate);
      penTimer.current = setTimeout(() => setPenLeaving(false), PEN_EXIT_MS);
      // Left alone when turning off, so the bar doesn't change as it slides away.
      setPicking(picks.length === 0);
    }
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }

  return createPortal(
    <>
      {/* Stays up while the bar slides away, until the wireframe starts to dissolve. */}
      {docked && <div className="ps-grayscale" data-wireframe-ui="" aria-hidden="true" />}
      {/* Presses here never reach the page, so its open menus don't treat them
          as outside clicks and close (e.g. before exporting a screenshot). */}
      <div
        className="ps-ui"
        data-theme={theme}
        data-docked={docked}
        data-wireframe-ui=""
        style={{ bottom: docked ? 0 : bottomOffset, '--ps-trigger-bottom': `${bottomOffset}px` }}
        onPointerDown={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()}
        onTouchStart={event => event.stopPropagation()}
      >
        {docked && (
          // Bar buttons don't take focus, which would close menus that close on blur.
          <div
            className="ps-bar"
            data-mode={picking ? 'edit' : 'view'}
            data-closing={!enabled}
            role="status"
            onMouseDown={event => event.preventDefault()}>
            {picking ? (
              <span>Click or drag to select what you want to see</span>
            ) : (
              <FlowMenu
                label={activeFlow?.name ?? 'Customized view'}
                flows={flows}
                defaultLabel={defaultFlowLabel}
                selected={activeFlow ? activeFlow.id : picks.length === 0 ? '' : null}
                onSelect={selectFlow}
              />
            )}
            <span className="ps-toast-divider" aria-hidden="true" />
            <div className="ps-toast-actions">
              <button type="button" className="ps-toast-action" onClick={() => setPicking(p => !p)}>
                {picking ? <CheckIcon /> : <PencilIcon />}
                {picking ? 'Done' : 'Edit'}
              </button>
              {!picking && (
                <>
                  <button type="button" className="ps-toast-action" disabled={exporting} onClick={onExport}>
                    <DownloadIcon />
                    {exporting ? 'Exporting…' : 'Export screenshot'}
                  </button>
                  <button type="button" className="ps-toast-action" onClick={() => setSaving(true)}>
                    <SaveIcon />
                    Save
                  </button>
                  <button type="button" className="ps-toast-action" onClick={() => setDiscarding(true)}>
                    <TrashIcon />
                    Discard
                  </button>
                </>
              )}
              {picking && (
                <button
                  type="button"
                  className="ps-toast-action"
                  disabled={picks.length === 0}
                  onClick={() => updateFlows(() => ({ picks: [] }))}
                >
                  Reset
                </button>
              )}
            </div>
            <span className="ps-bar-spacer" />
            {/* Shows picks in their real colors; the wireframe itself stays gray. */}
            <div className="ps-bar-toggle">
              <BrandIcon />
              <span id={colorId}>Color</span>
              <Switch
                checked={color}
                labelledBy={colorId}
                onToggle={() => setSettings(prev => ({ ...prev, color: !prev.color }))}
              />
            </div>
            <span className="ps-toast-divider" aria-hidden="true" />
            <div className="ps-bar-toggle">
              <PenIcon />
              <span id={titleId}>Wireframe</span>
              <Switch checked labelledBy={titleId} onToggle={onToggleWireframe} />
            </div>
          </div>
        )}
        {discarding && (
          <DiscardDialog existing={activeFlow} onDiscard={discardFlow} onClose={() => setDiscarding(false)} />
        )}
        {saving && (
          <FlowDialog
            existing={activeFlow}
            onSave={saveFlow}
            onOverride={overrideFlow}
            onClose={() => setSaving(false)}
          />
        )}
        {(!docked || penLeaving || penPopIn) && (
          <button
            type="button"
            className="ps-trigger"
            data-state={penLeaving ? 'out' : penPopIn ? 'in' : undefined}
            aria-label="Turn on wireframe"
            onClick={onToggleWireframe}
          >
            <span className="ps-pen" aria-hidden="true" />
          </button>
        )}
      </div>
    </>,
    host,
  );
}
