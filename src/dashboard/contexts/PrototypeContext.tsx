import { dashboardStorage } from '../lib/storage';
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface PrototypeContextValue {
  aiSearch: 'mixed' | 'plus' | 'separate';
  setAiSearch: (v: 'mixed' | 'plus' | 'separate') => void;
  tabStyle: 'passive' | 'toggle-r' | 'toggle-l' | 'plus';
  setTabStyle: (v: 'passive' | 'toggle-r' | 'toggle-l' | 'plus') => void;
  foreverLoading: boolean;
  setForeverLoading: (v: boolean | ((prev: boolean) => boolean)) => void;
  columnDragStyle: 'ui' | 'glass';
  setColumnDragStyle: (v: 'ui' | 'glass') => void;
  columnResizeStyle: 'full' | 'header';
  setColumnResizeStyle: (v: 'full' | 'header') => void;
  simulateNoHScroll: boolean;
  setSimulateNoHScroll: (v: boolean | ((prev: boolean) => boolean)) => void;
  autosaveIndicator: 'badge' | 'toast';
  setAutosaveIndicator: (v: 'badge' | 'toast') => void;
  navVisible: boolean;
  setNavVisible: (v: boolean) => void;
  version: 'v1' | 'v2';
  setVersion: (v: 'v1' | 'v2') => void;
  consoleOpen: boolean;
  setConsoleOpen: (v: boolean) => void;
  v2ConsoleOpen: boolean;
  setV2ConsoleOpen: (v: boolean) => void;
  consoleAnchor: { x: number; y: number };
  setConsoleAnchor: (v: { x: number; y: number }) => void;
  consoleDocked: boolean;
  setConsoleDocked: (v: boolean) => void;
  consoleControlledSelection: boolean;
  setConsoleControlledSelection: (v: boolean) => void;
  consoleAction: { type: 'select-chip'; chipLabel: string } | { type: 'select-rows'; indices: number[] } | null;
  setConsoleAction: (v: { type: 'select-chip'; chipLabel: string } | { type: 'select-rows'; indices: number[] } | null) => void;
  rowStatusOverrides: Record<number, string>;
  setRowStatusOverrides: (v: Record<number, string>) => void;
  pendingRows: { pageId: string; row: Record<string, unknown> }[];
  addPendingRow: (pageId: string, row: Record<string, unknown>) => void;
  invoiceDueDate: string;
  setInvoiceDueDate: (v: string) => void;
}

const LS_AI_SEARCH = 'proto-ai-search';
const LS_TAB_STYLE = 'proto-tab-style';

const PrototypeContext = createContext<PrototypeContextValue>({
  aiSearch: 'mixed',
  setAiSearch: () => {},
  tabStyle: 'passive' as const,
  setTabStyle: () => {},
  foreverLoading: false,
  setForeverLoading: () => {},
  columnDragStyle: 'ui',
  setColumnDragStyle: () => {},
  columnResizeStyle: 'header',
  setColumnResizeStyle: () => {},
  simulateNoHScroll: false,
  setSimulateNoHScroll: () => {},
  autosaveIndicator: 'toast',
  setAutosaveIndicator: () => {},
  navVisible: false,
  setNavVisible: () => {},
  version: 'v1',
  setVersion: () => {},
  consoleOpen: false,
  setConsoleOpen: () => {},
  v2ConsoleOpen: false,
  setV2ConsoleOpen: () => {},
  consoleAnchor: { x: 0, y: 68 },
  setConsoleAnchor: () => {},
  consoleDocked: false,
  setConsoleDocked: () => {},
  consoleControlledSelection: false,
  setConsoleControlledSelection: () => {},
  consoleAction: null,
  setConsoleAction: () => {},
  rowStatusOverrides: {},
  setRowStatusOverrides: () => {},
  pendingRows: [],
  addPendingRow: () => {},
  invoiceDueDate: 'Within 30 days',
  setInvoiceDueDate: () => {},
});

const LS_NAV_VISIBLE = 'proto-nav-visible';
const LS_VERSION = 'proto-version';

export function PrototypeProvider({ children }: { children: React.ReactNode }) {
  const [aiSearch, setAiSearchState] = useState<'mixed' | 'plus' | 'separate'>('mixed');
  const setAiSearch = (v: 'mixed' | 'plus' | 'separate') => {
    dashboardStorage.setItem(LS_AI_SEARCH, v);
    setAiSearchState(v);
  };
  const [tabStyle, setTabStyleState] = useState<'passive' | 'toggle-r' | 'toggle-l' | 'plus'>('passive');
  const setTabStyle = (v: 'passive' | 'toggle-r' | 'toggle-l' | 'plus') => {
    dashboardStorage.setItem(LS_TAB_STYLE, v);
    setTabStyleState(v);
  };
  const [foreverLoading, setForeverLoading] = useState(false);
  const [columnDragStyle, setColumnDragStyle] = useState<'ui' | 'glass'>('ui');
  const [columnResizeStyle, setColumnResizeStyle] = useState<'full' | 'header'>('header');
  const [simulateNoHScroll, setSimulateNoHScroll] = useState(false);
  const [autosaveIndicator, setAutosaveIndicator] = useState<'badge' | 'toast'>('toast');
  const [navVisible, setNavVisibleState] = useState(false);
  const [version, setVersionState] = useState<'v1' | 'v2'>('v1');
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [v2ConsoleOpen, setV2ConsoleOpen] = useState(false);
  const [consoleAnchor, setConsoleAnchor] = useState({ x: 0, y: 68 });
  const [consoleDocked, setConsoleDocked] = useState(false);
  const [consoleControlledSelection, setConsoleControlledSelection] = useState(false);
  const [consoleAction, setConsoleAction] = useState<{ type: 'select-chip'; chipLabel: string } | { type: 'select-rows'; indices: number[] } | null>(null);
  const [rowStatusOverrides, setRowStatusOverrides] = useState<Record<number, string>>({});
  const [pendingRows, setPendingRows] = useState<{ pageId: string; row: Record<string, unknown> }[]>([]);
  const addPendingRow = (pageId: string, row: Record<string, unknown>) => {
    setPendingRows(prev => [{ pageId, row }, ...prev]);
  };
  const [invoiceDueDate, setInvoiceDueDate] = useState('Within 30 days');

  useEffect(() => {
    // Position chat right-aligned below toolbar on first load
    setConsoleAnchor({ x: window.innerWidth - 360 - 24, y: 68 });

    const storedNav = dashboardStorage.getItem(LS_NAV_VISIBLE);
    setNavVisibleState(storedNav === null ? true : storedNav === 'true');

    const storedVersion = dashboardStorage.getItem(LS_VERSION);
    if (storedVersion === 'v1' || storedVersion === 'v2') {
      setVersionState(storedVersion);
    }

    const storedAiSearch = dashboardStorage.getItem(LS_AI_SEARCH);
    if (storedAiSearch === 'mixed' || storedAiSearch === 'plus' || storedAiSearch === 'separate') {
      setAiSearchState(storedAiSearch);
    }

    const storedTabStyle = dashboardStorage.getItem(LS_TAB_STYLE);
    if (storedTabStyle === 'passive' || storedTabStyle === 'toggle-r' || storedTabStyle === 'toggle-l' || storedTabStyle === 'plus') {
      setTabStyleState(storedTabStyle);
    }
  }, []);

  const setNavVisible = (v: boolean) => {
    dashboardStorage.setItem(LS_NAV_VISIBLE, String(v));
    setNavVisibleState(v);
  };

  const setVersion = (v: 'v1' | 'v2') => {
    dashboardStorage.setItem(LS_VERSION, v);
    setVersionState(v);
  };

  return (
    <PrototypeContext.Provider value={{
      aiSearch, setAiSearch,
      tabStyle, setTabStyle,
      foreverLoading, setForeverLoading,
      columnDragStyle, setColumnDragStyle,
      columnResizeStyle, setColumnResizeStyle,
      simulateNoHScroll, setSimulateNoHScroll,
      autosaveIndicator, setAutosaveIndicator,
      navVisible, setNavVisible,
      version, setVersion,
      consoleOpen, setConsoleOpen,
      v2ConsoleOpen, setV2ConsoleOpen,
      consoleAnchor, setConsoleAnchor,
      consoleDocked, setConsoleDocked,
      consoleControlledSelection, setConsoleControlledSelection,
      consoleAction, setConsoleAction,
      rowStatusOverrides, setRowStatusOverrides,
      pendingRows, addPendingRow,
      invoiceDueDate, setInvoiceDueDate,
    }}>
      {children}
    </PrototypeContext.Provider>
  );
}

export function usePrototype() {
  return useContext(PrototypeContext);
}
