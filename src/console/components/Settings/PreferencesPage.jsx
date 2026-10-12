import { SegmentSwitch } from '../SegmentSwitch';
import { useTheme } from '../../contexts/useTheme';

function PreferenceRow({ label, description, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: 10,
        border: '1px solid var(--color-border-default)',
        background: 'var(--color-surface-0)',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export function PreferencesPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex-1 min-w-0"
      style={{ background: 'var(--color-surface-0)', overflow: 'auto' }}
    >
      <div style={{ padding: '32px 40px', maxWidth: 720 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 20px' }}>
          Preferences
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PreferenceRow label="Appearance" description={theme === 'dark' ? 'Dark mode' : theme === 'light' ? 'Light mode' : 'System'}>
            <SegmentSwitch
              options={[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'System' },
              ]}
              value={theme}
              onChange={setTheme}
            />
          </PreferenceRow>
        </div>
      </div>
    </div>
  );
}
