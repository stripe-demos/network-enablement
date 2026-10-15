import StepHeading from './StepHeading';
import PromptComposer from '../components/PromptComposer';
import { PLACEHOLDERS } from '../data/placeholders';
import { MAX_LENGTH } from '../data/promptStrength';

export default function StepDescribe({
  businessName,
  website,
  onWebsiteChange,
  description,
  onDescriptionChange,
  checks,
  analysis,
  onFileIntentChange,
}) {
  return (
    <div className="flex flex-col gap-7">
      <StepHeading
        lead="We need some more information."
        rest={`We'll use it to recommend a Connect integration for ${businessName}.`}
      />

      <PromptComposer
        website={website}
        onWebsiteChange={onWebsiteChange}
        description={description}
        onDescriptionChange={onDescriptionChange}
        checks={checks}
        analysis={analysis}
        placeholders={PLACEHOLDERS}
        maxLength={MAX_LENGTH}
        onFileIntentChange={onFileIntentChange}
      />
    </div>
  );
}
