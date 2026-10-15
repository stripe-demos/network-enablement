// Sail checkbox (ported from connect-onboarding src/sail/Input.jsx) for the
// setup dialog's agreement steps.
export const SetupCheckbox = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <label className={`inline-flex items-start gap-2 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`w-[14px] h-[14px] mt-0.5 border rounded-sm transition-colors flex items-center justify-center peer-focus:ring-[rgba(8,142,249,0.36)] peer-focus:ring-4 ${checked
            ? 'bg-brand-500 border-brand-500'
            : 'bg-surface border-hairline group-hover:border-gray-400'
            }`}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={checked ? 'opacity-100' : 'opacity-0'}>
            <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {(label || description) && (
        <div className="space-y-0.5">
          {label && (
            <span className="block text-label-medium-emphasized text-default">{label}</span>
          )}
          {description && (
            <span className="block text-label-small text-subdued">{description}</span>
          )}
        </div>
      )}
    </label>
  );
};

export default SetupCheckbox;
