import { useState } from 'react';
import { SimulatedTurn } from '../Conversation/SimulatedTurn';
import { useSimulatedResponses } from '../Conversation/useSimulatedResponses';
import { useFutureTasks } from '../../variants/useFutureTasks';
import { isTaskRunning } from '../../data/chartPreparation';
import { WORK_CYCLE_COUNTS } from '../../data/responseRun';

// A replay uses the same job, streaming clock and renderer as a real query.
export function TaskSequenceExample() {
  const [future] = useFutureTasks();
  const [cycles, setCycles] = useState(3);
  const responses = useSimulatedResponses({});
  const turn = responses.turns.preview?.at(-1);
  const running = isTaskRunning(turn?.taskPhase);
  return <div className="task-sequence-example">
    <div className="composer-example__controls" style={{ marginBottom: 24 }}>
      <label>Work cycles{' '}
        <select value={cycles} onChange={event => setCycles(Number(event.target.value))}>
          {WORK_CYCLE_COUNTS.map(count => <option key={count} value={count}>{count}</option>)}
        </select>
      </label>
      <button type="button" className="composer-example__control-button" onClick={() => responses.start('preview', {}, {
        workCycles: cycles, taskOptions: { analysisCallCount: cycles, chartCallCount: 3 },
      })}>Replay sequence</button>
      {running && <button type="button" className="composer-example__control-button" onClick={() => responses.cancel('preview')}>Stop</button>}
    </div>
    <div className="task-preview-scroll" data-conversation-scroll style={{ maxHeight: 520, overflowY: 'auto', padding: 4 }}>
      {turn ? <SimulatedTurn key={turn.id} hideUser {...turn} /> : <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>Replay the {future ? 'future' : 'current'} task sequence.</p>}
    </div>
  </div>;
}
