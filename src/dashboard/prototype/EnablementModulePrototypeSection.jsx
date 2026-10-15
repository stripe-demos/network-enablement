// Prototype panel section: where the Enablement module shows. One placement
// at a time, picked with radio buttons. Reset lives
// in the panel (resetPrototypeDemo.js); it also brings back dismissed nudges.
import { useId } from 'react'
import { ENABLEMENT_PLACEMENTS, useEnablementPrototypeControls, writeEnablementPrototypeControls } from './enablementPrototypeControls'

export default function EnablementModulePrototypeSection() {
  const radioName = useId()
  const controls = useEnablementPrototypeControls()
  const dismissed = controls.dismissedNudges.length

  return (
    <>
      <div role="radiogroup" aria-label="Placement" className="dash-proto-panel__radio-group">
        {ENABLEMENT_PLACEMENTS.map(({ id, label }) => (
          <label key={id} className="dash-proto-panel__radio-row">
            <span className="dash-proto-panel__label">{label}</span>
            <input
              type="radio"
              name={radioName}
              className="dash-proto-panel__radio"
              checked={controls.placement === id}
              onChange={() => writeEnablementPrototypeControls({ placement: id })}
            />
          </label>
        ))}
      </div>
      {controls.placement === 'nudge' && dismissed > 0 && (
        <button
          type="button"
          className="dash-proto-panel__button"
          onClick={() => writeEnablementPrototypeControls({ dismissedNudges: [] })}
        >
          Show {dismissed} dismissed {dismissed === 1 ? 'nudge' : 'nudges'}
        </button>
      )}
    </>
  )
}
