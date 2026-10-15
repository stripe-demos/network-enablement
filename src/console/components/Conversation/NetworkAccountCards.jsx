// Recommended businesses in the network conversation, each with an Invite
// toggle. Selection lives in networkOnboardingStore, so the canvas matches
// table shows the same toggles. Read-only once invitations are sent or when an
// older turn is no longer the active one.
import { RECOMMENDED_MATCHES } from '../../data/networkOnboarding';
import { toggleNetworkMatch, useNetworkOnboardingState } from '../../data/networkOnboardingStore';

export function NetworkInviteToggle({ id, name, disabled }) {
  const { selectedIds, invitedIds, completed } = useNetworkOnboardingState();
  const on = completed ? invitedIds.includes(id) : selectedIds.includes(id);
  return (
    <button
      type="button"
      className="network-invite-toggle"
      aria-pressed={on}
      aria-label={`Invite ${name}`}
      disabled={disabled || completed}
      onClick={() => toggleNetworkMatch(id)}
    >
      {completed ? (on ? 'Invited' : 'Not invited') : on ? '✓ Invite' : 'Invite'}
    </button>
  );
}

export function NetworkAccountCards({ active, onInvite, onShowMore }) {
  const { selectedIds, completed } = useNetworkOnboardingState();
  const interactive = active && !completed;
  const count = selectedIds.length;

  return (
    <div className="network-cards">
      <ul className="network-cards__list">
        {RECOMMENDED_MATCHES.map(match => (
          <li key={match.id} className="network-card">
            <span className="network-card__logo" aria-hidden="true">{match.name[0]}</span>
            <span className="network-card__body">
              <span className="network-card__name">{match.name}</span>
              <span className="network-card__meta">{match.industry} · {match.country} · {match.volume}</span>
              <span className="network-card__why">{match.why}</span>
            </span>
            <NetworkInviteToggle id={match.id} name={match.name} disabled={!interactive} />
          </li>
        ))}
      </ul>
      {interactive && (
        <div className="network-cards__actions">
          <button type="button" className="network-cards__primary" disabled={count === 0} onClick={onInvite}>
            Invite {count} {count === 1 ? 'business' : 'businesses'}
          </button>
          <button type="button" className="network-cards__secondary" onClick={onShowMore}>
            Show more matches
          </button>
        </div>
      )}
    </div>
  );
}
