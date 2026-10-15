// Canvas body for the network conversation's "All matches" tab: every
// matched business, with the same Invite toggles as the chat cards.
import { NETWORK_MATCHES } from '../../data/networkOnboarding';
import { NetworkInviteToggle } from '../Conversation/NetworkAccountCards';

export function NetworkMatchesTable() {
  return (
    <>
      <table className="canvas-table" id="canvasTable">
        <thead>
          <tr>
            <th data-col="business">Business</th>
            <th data-col="industry">Industry</th>
            <th data-col="country">Country</th>
            <th data-col="volume">Monthly volume</th>
            <th data-col="why">Why it's a match</th>
            <th data-col="invite" aria-label="Invite" />
          </tr>
        </thead>
        <tbody>
          {NETWORK_MATCHES.map(match => (
            <tr key={match.id}>
              <td><span className="col-link">{match.name}</span>{match.recommended && <span className="network-recommended">Recommended</span>}</td>
              <td>{match.industry}</td>
              <td>{match.country}</td>
              <td>{match.volume}</td>
              <td style={{ fontWeight: 400 }}>{match.why}</td>
              <td><NetworkInviteToggle id={match.id} name={match.name} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ height: 50, flexShrink: 0 }} />
    </>
  );
}
