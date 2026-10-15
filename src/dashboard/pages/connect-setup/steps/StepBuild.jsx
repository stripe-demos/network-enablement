import { useState } from 'react';
import { SetupButton } from '../components/SetupButton';
import { Icon } from '../components/Icon';
import StepHeading from './StepHeading';
import AgentPromptBlock from '../components/AgentPromptBlock';
import Toast from '../components/Toast';

const GUIDE_URL = 'https://docs.stripe.com/connect/saas/quickstart';
const EMAIL = 'sallykang@stripe.com';
const AGENT_LOGOS = '/dashboard-assets/connect-setup/agents';

// The logos shown in the prompt block's copy strip — the agents this prompt is
// meant to be pasted into.
const AGENTS = [
  { src: `${AGENT_LOGOS}/anthropic.svg`, alt: 'Claude' },
  { src: `${AGENT_LOGOS}/openai.svg`, alt: 'ChatGPT' },
  { src: `${AGENT_LOGOS}/cursor.svg`, alt: 'Cursor' },
];

/**
 * The leaner "Build your integration" step: a single prompt block to hand off to
 * an AI coding agent, plus two ways to keep it — email it to yourself or open
 * the personalized integration guide. The agent picker, Stripe Projects, and
 * docs-callout sections from the earlier design are gone.
 */
export default function StepBuild({ prompt, onActionTaken }) {
  const [emailed, setEmailed] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        lead="You're all set."
        rest="Copy this prompt for when you're ready to start building, or view your custom integration guide."
      />

      <section className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-heading-small text-default">Prompt your agent</h3>
          <p className="text-body-small text-subdued">
            Paste this prompt into your AI coding agent of choice.
          </p>
        </div>
        <AgentPromptBlock code={prompt} agents={AGENTS} onCopy={() => onActionTaken?.()} />
      </section>

      <div className="flex items-center gap-2">
        <SetupButton
          variant="secondary"
          size="md"
          icon="email"
          onClick={() => {
            setEmailed(true);
            onActionTaken?.();
          }}
        >
          Email me
        </SetupButton>
        <SetupButton
          variant="secondary"
          size="md"
          href={GUIDE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => onActionTaken?.()}
        >
          View integration guide
          <Icon name="external" size="xsmall" fill="currentColor" />
        </SetupButton>
      </div>

      <Toast
        open={emailed}
        message={`Prompt sent to ${EMAIL}`}
        onClose={() => setEmailed(false)}
      />
    </div>
  );
}
