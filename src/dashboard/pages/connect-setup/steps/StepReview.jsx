import StepHeading from './StepHeading';
import ReviewGroup from '../components/ReviewGroup';
import SettingCard from '../components/SettingCard';
import FundsFlowCard from '../components/FundsFlowCard';
import { GROUPS, RECOMMENDED, SETTINGS } from '../data/config';
import { willCascade, disabledLiabilityValues, LIABILITY_DISABLED_REASON } from '../data/dependencies';

export default function StepReview({
  config,
  onConfigChange,
  expandedId,
  onToggleExpanded,
  skipped = false,
}) {
  return (
    <div className="flex flex-col gap-7">
      <StepHeading
        lead={skipped ? "Here's a standard setup." : "Here's what we recommend."}
        rest={
          skipped
            ? 'It’s a common starting point for platforms. You can change anything before you build.'
            : 'Each is based on what you told us. You can change them while you build.'
        }
      />

      <div className="flex flex-col gap-4">
        {GROUPS.map((group) => {
          // Warn in the header while editing a setting in this group whose change
          // will cascade into another setting.
          const showWarning =
            group.settings.includes(expandedId) && willCascade(expandedId, config);
          return (
          <ReviewGroup
            key={group.id}
            icon={group.icon}
            label={group.label}
            warning={showWarning ? 'Editing will change settings below' : null}
          >
            {group.settings.map((settingId) => {
              const shared = {
                setting: SETTINGS[settingId],
                value: config[settingId],
                edited: config[settingId] !== RECOMMENDED[settingId],
                expanded: expandedId === settingId,
                onToggle: () => onToggleExpanded(settingId),
                onChange: (value) => onConfigChange(settingId, value),
                disabledValues:
                  settingId === 'negativeBalanceLiability' ? disabledLiabilityValues(config) : [],
                disabledReason: LIABILITY_DISABLED_REASON,
              };
              return group.variant === 'fundsFlow' ? (
                <FundsFlowCard key={settingId} {...shared} />
              ) : (
                <SettingCard key={settingId} {...shared} />
              );
            })}
          </ReviewGroup>
          );
        })}
      </div>

      <p className="text-body-small text-subdued">
        By confirming, you agree to our{' '}
        <a href="#" className="text-brand hover:underline">
          Connect Platform Agreement.
        </a>
      </p>
    </div>
  );
}
