import React, { useState } from 'react';
import { BasePathContext } from '../../contexts/BasePath';
import { FlowProvider, useFlow } from './flow/FlowProvider';
import SendSheet from './shell/SendSheet';
import PayoutDetail from './pages/PayoutDetail';

/**
 * prototype2 — MM Flows send sheet.
 *
 * The flow opens straight into the sheet over a flat scrim: no frame in the send
 * designs draws a dashboard behind it.
 *
 * The payout detail page (502:68434) is the one screen that isn't in the sheet.
 * It's reached from "View payout" on the success screen, and it does draw
 * dashboard chrome — rendered as skeleton bars, since this prototype has no
 * dashboard and inventing nav routes would overstate what exists.
 *
 * Two views rather than two routes: the payout record lives in flow state, so a
 * real URL would show nothing on reload. Local view state keeps the trip back
 * intact.
 *
 * The `sail-2` class on the root scopes the token overrides in theme.css —
 * without it the primary button inherits prototype1's #533afd.
 *
 * Moderator step jump: /prototype2?step=email.compose
 */
export default function Prototype2App({ basePath }) {
  // Closing has nowhere to go — there's no dashboard behind the sheet — so it
  // restarts the flow. Revisit if an entry surface is ever designed.
  const handleClose = () => window.location.assign(window.location.pathname);

  return (
    <BasePathContext.Provider value={basePath}>
      <div className="sail-2 font-sans">
        <FlowProvider onClose={handleClose}>
          <Views />
        </FlowProvider>
      </div>
    </BasePathContext.Provider>
  );
}

function Views() {
  const { state, reset } = useFlow();
  const [view, setView] = useState('sheet');

  if (view === 'payout') {
    return (
      <PayoutDetail
        record={state.result?.snapshot ?? null}
        onBack={() => setView('sheet')}
        onRestart={() => {
          reset();
          setView('sheet');
        }}
      />
    );
  }

  return <SendSheet onViewPayout={() => setView('payout')} />;
}
