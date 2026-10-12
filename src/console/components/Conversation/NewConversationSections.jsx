// Sample prompts for the New-screen prototype; choosing one only fills the input.
const SUGGESTIONS = [
  'Find revenue opportunities I might be missing',
  'Show my 5 biggest days by revenue this month',
  'Which customers have cards expiring soon?',
  'Help me understand why payments are failing',
  'Compare subscription retention with last month',
];

export function NewConversationSections({ onChoose, submitting = false }) {
  return (
    <section aria-label="Suggested prompts" inert={submitting} aria-hidden={submitting} className="new-conversation-sections new-conversation-section">
      <div className="new-conversation-section__heading">
        <h2>Suggested prompts</h2>
      </div>
      <ul>
        {SUGGESTIONS.slice(0, 3).map(prompt => (
          <li key={prompt}>
            <button type="button" onClick={() => onChoose(prompt)}>
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
