'use client'

import { useState } from 'react'
import { BasePathContext } from './contexts/BasePath'
import { FlowProvider, useFlow } from './prototypes/prototype2/flow/FlowProvider'
import SendSheet from './prototypes/prototype2/shell/SendSheet'
import PayoutDetail from './prototypes/prototype2/pages/PayoutDetail'

export function SendFlowApp({ onClose }) {
  return (
    <BasePathContext.Provider value="">
      <div className="sail-2 font-sans">
        <FlowProvider onClose={onClose}>
          <Views />
        </FlowProvider>
      </div>
    </BasePathContext.Provider>
  )
}

function Views() {
  const { state, reset } = useFlow()
  const [view, setView] = useState('sheet')

  if (view === 'payout') {
    return (
      <PayoutDetail
        record={state.result?.snapshot ?? null}
        onBack={() => setView('sheet')}
        onRestart={() => {
          reset()
          setView('sheet')
        }}
      />
    )
  }

  return <SendSheet onViewPayout={() => setView('payout')} />
}
