import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { launchConsole } from '../integration/consoleHandoff';

export default function DashboardConsoleHandoff() {
  const { state } = useLocation();
  const launched = useRef(false);
  useEffect(() => {
    if (launched.current) return;
    launched.current = true;
    // Replace the intermediate /dashboard/console entry so Back doesn't launch
    // Console again. The originating Dashboard page remains in history.
    launchConsole(state?.launchPrompt, { replace: true });
  }, [state]);
  return null;
}
