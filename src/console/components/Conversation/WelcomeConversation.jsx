import { SimulatedTurn } from './SimulatedTurn';
import { WELCOME_PROMPT, WELCOME_RESPONSE, WELCOME_ARTIFACT_IDS } from '../../data/welcome';

export function WelcomeConversation({ artifactIds, onArtifactClick, isLatest }) {
  return (
      <SimulatedTurn
        user={WELCOME_PROMPT}
        assistant={WELCOME_RESPONSE}
        artifactIds={artifactIds ?? WELCOME_ARTIFACT_IDS}
        onArtifactClick={onArtifactClick}
        isLatest={isLatest}
      />
  );
}
