import { useEffect, useRef, useState } from 'react';
import { PromptInput } from '../Conversation/PromptInput';
import { ComposerDock } from '../Conversation/ComposerDock';
import { useTheme } from '../../contexts/useTheme';
import { DESIGN_SYSTEM_COMMANDS } from './designSystemCommands';

const SAMPLE_MESSAGES = [
  'Show me how revenue is trending this month.',
  'Revenue is up 4.6% month over month. Enterprise growth accounts for most of the increase.',
  'Which plans are contributing most to that growth?',
  'Enterprise added eight accounts in the last two weeks. Pro revenue is also growing, while Starter revenue is slightly lower.',
  'Compare that with the previous month.',
  'The growth overview brings those trends together. You can mention an artifact below to ask a more specific follow-up question.',
];

const SAMPLE_SUGGESTIONS = [
  { label: 'Ask a follow-up', prompt: 'Tell me more about this trend' },
  { label: 'Yes, proceed', prompt: 'Yes, proceed' },
  { label: 'Plan next steps', command: 'plan' },
];

// Only demo data and controls live here. Composer UI and docking are the same
// components used by ConversationPanel; future changes belong in those files.
export function ComposerExample({ followUp = false }) {
  const { theme, setTheme } = useTheme();
  const previewRef = useRef(null);
  const [narrow, setNarrow] = useState(false);
  const [overflow, setOverflow] = useState(true);
  const [status, setStatus] = useState('');
  const [revision, setRevision] = useState(0);
  const [planOpen, setPlanOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [working, setWorking] = useState(false);
  const responseTimer = useRef(null);
  const [suggestionCount, setSuggestionCount] = useState(followUp ? 3 : 0);
  const [showVisionAndContext, setShowVisionAndContext] = useState(true);

  useEffect(() => () => clearTimeout(responseTimer.current), []);

  function cancelResponse() {
    clearTimeout(responseTimer.current);
    setWorking(false);
    setStatus('Stopped.');
  }

  function submitResponse(text) {
    clearTimeout(responseTimer.current);
    setWorking(true);
    setStatus('Thinking…');
    responseTimer.current = setTimeout(() => {
      setWorking(false);
      setStatus(`Finished: ${text}`);
    }, 4000);
  }

  function closePlan(answer) {
    setPlanOpen(false);
    if (answer) setDraft({ text: answer });
    requestAnimationFrame(() => previewRef.current?.querySelector('[contenteditable]')?.focus({ preventScroll: true }));
  }

  function handleCommand(id) {
    if (id === 'plan') {
      setPlanOpen(true);
    } else if (id === 'vision-and-context') {
      setShowVisionAndContext(visible => !visible);
    } else if (id === 'theme') {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    } else if (id === 'new-conversation') {
      cancelResponse();
      setRevision(value => value + 1);
      setDraft(null);
      setStatus('Example reset.');
    } else {
      const name = DESIGN_SYSTEM_COMMANDS.find(skill => skill.id === id)?.name ?? id;
      setStatus(`${name} selected. This example does not open a separate workflow.`);
    }
  }

  return (
    <div className="composer-example">
      <div className="composer-example__controls">
        <label><input type="checkbox" checked={narrow} onChange={event => setNarrow(event.target.checked)} /> Narrow panel</label>
        {followUp && (
          <>
            <label><input type="checkbox" checked={overflow} onChange={event => setOverflow(event.target.checked)} /> Overflowing conversation</label>
            <button
              type="button"
              className="composer-example__control-button"
              onClick={() => setSuggestionCount(count => (count + 1) % 4)}
            >
              Suggestions: {suggestionCount}
            </button>
          </>
        )}
      </div>
      <div
        ref={previewRef}
        className={`composer-example__preview${followUp ? ' composer-example__preview--scroll' : ''}`}
        style={{ maxWidth: narrow ? 360 : 640 }}
        role="region"
        aria-label={followUp ? 'Follow-up composer preview' : 'New conversation composer preview'}
        tabIndex={followUp ? 0 : undefined}
      >
        {followUp && (
          <div className="composer-example__messages">
            {SAMPLE_MESSAGES.slice(0, overflow ? SAMPLE_MESSAGES.length : 1).map((message, index) => (
              <p key={message}>
                <span className="composer-example__speaker">{index % 2 === 0 ? 'You' : 'Console'}</span>
                {message}
              </p>
            ))}
          </div>
        )}
        <ComposerDock showFade={followUp}>
          <PromptInput
            chatId={`composer-example-${followUp ? 'follow-up' : 'new'}-${revision}`}
            disableAutoFocus
            placeholder={followUp ? 'Follow up' : 'Ask anything'}
            isAnchored={followUp}
            activeTabId="multi4"
            visibleTabIds={['multi4']}
            contextUsagePercent={followUp ? 82 : 0}
            artifactIds={['multi4', 'chart', 'table']}
            commands={DESIGN_SYSTEM_COMMANDS}
            showVisionAndContext={showVisionAndContext}
            suggestions={SAMPLE_SUGGESTIONS.slice(0, suggestionCount)}
            onSuggestionSelect={suggestion => {
              if (suggestion.command) handleCommand(suggestion.command);
              else setDraft({ text: suggestion.prompt ?? suggestion.label });
            }}
            working={working}
            onCancel={cancelResponse}
            onSubmit={submitResponse}
            onSlashCommand={handleCommand}
            planOpen={planOpen}
            draftToInsert={draft}
            onPlanSelect={closePlan}
            onPlanCancel={() => closePlan()}
          />
        </ComposerDock>
      </div>
      {status && <p className="composer-example__status" role="status">{status}</p>}
    </div>
  );
}
