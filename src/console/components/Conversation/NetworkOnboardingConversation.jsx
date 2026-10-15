// The Stripe network onboarding as a conversation: opt in, review matches,
// invite. Each exchange is a SimulatedTurn (thinking → task → reply); the
// latest one carries the question or cards that move the flow on. Started from
// a network prompt (incl. the Dashboard handoff) or /go-live, which lists
// what's left to go live first. Answers come from the question card, the
// cards' buttons, or the composer (postToNetworkConversation).
import { useEffect, useRef, useState } from 'react';
import { AskQuestion } from './AskQuestion';
import { SimulatedTurn } from './SimulatedTurn';
import { NetworkAccountCards } from './NetworkAccountCards';
import {
  GO_LIVE_OPTIONS,
  JOIN_OPTIONS,
  NETWORK_MATCHES,
  NETWORK_MATCHES_TAB_ID,
  NETWORK_PROFILE_TAB_ID,
  PLATFORM_NAME,
  RECOMMENDED_MATCHES,
  answerKind,
} from '../../data/networkOnboarding';
import {
  inviteSelectedMatches,
  joinNetwork,
  onNetworkConversationMessage,
  openDashboard,
  useNetworkOnboardingState,
} from '../../data/networkOnboardingStore';

const THINK_MS = 700;
const CALL_MS = 550;

let nextId = 0;
const exchange = fields => ({ id: `network-${nextId++}`, ...fields });

function listNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

function introExchange(user) {
  return exchange({
    user,
    task: {
      name: 'Reviewing the Stripe network',
      detail: `Checking ${PLATFORM_NAME}’s platform profile and what joining the network shares.`,
      calls: ['Reading your platform profile', 'Checking network eligibility'],
    },
    text: [
      'The Stripe network has more than 1.8M businesses already verified on Stripe. Here’s how it works: you opt in, get matched with businesses that fit your platform, and invite them to connect.',
      `To get matched, ${PLATFORM_NAME} joins the network. Businesses see your name, industry and countries served. Your connected accounts stay private, and you can leave at any time.`,
    ],
    artifactIds: [NETWORK_PROFILE_TAB_ID],
    widget: 'join',
  });
}

function matchesExchange(user) {
  return exchange({
    user,
    task: {
      name: 'Matching businesses to your description',
      detail: 'Scoring businesses on the network by industry, how they sell, country and size.',
      calls: ['Searching businesses on the Stripe network', 'Scoring matches against your description', 'Keeping accounts that are ready to connect'],
    },
    text: [
      `You’re on the network. These ${RECOMMENDED_MATCHES.length} businesses fit ${PLATFORM_NAME} and are ready to connect. I’ve selected all of them; turn off any you don’t want.`,
    ],
    artifactIds: [NETWORK_MATCHES_TAB_ID],
    widget: 'matches',
  });
}

function doneExchange(user, invitedIds) {
  const names = NETWORK_MATCHES.filter(match => invitedIds.includes(match.id)).map(match => match.name);
  return exchange({
    user,
    task: { name: 'Sending invitations', calls: [`Inviting ${names.length} ${names.length === 1 ? 'business' : 'businesses'}`] },
    text: names.length
      ? [`Done. I’ve sent invitations to ${listNames(names)}. They can reuse details they’ve already given Stripe, so they can start accepting payments sooner.`, 'They show as Invited in Network until they accept.']
      : ['You’re on the network, with no invitations sent yet. You can find businesses anytime in Network.'],
    widget: 'done',
  });
}

const goLiveExchange = (user, text) => exchange({
  user,
  text: [text ?? `Here’s what’s left to get ${PLATFORM_NAME} live. Where do you want to start?`],
  widget: 'go-live',
});

function goLiveOption(text) {
  const value = text.trim().toLowerCase();
  return GO_LIVE_OPTIONS.find(option => option.label.toLowerCase() === value)
    ?? (/network|connected accounts|onboard/.test(value) ? GO_LIVE_OPTIONS[0]
      : /capital|treasury/.test(value) ? GO_LIVE_OPTIONS[1]
        : /pric|fee|pay/.test(value) ? GO_LIVE_OPTIONS[2]
          : /app|skill|agent/.test(value) ? GO_LIVE_OPTIONS[3] : null);
}

export function NetworkOnboardingConversation({ chat, onArtifactClick, onExpandToCanvas, isLatest }) {
  const flow = useNetworkOnboardingState();
  const [exchanges, setExchanges] = useState(() => [
    chat.networkEntry === 'go-live' ? goLiveExchange('/go-live') : introExchange(chat.networkPrompt),
  ]);
  // Progress of the latest exchange: thinking, then its tool calls one by one.
  const [progress, setProgress] = useState({ phase: 'initial-thinking', calls: 0 });
  const latest = exchanges.at(-1);
  const ready = progress.phase === 'complete';

  useEffect(() => {
    const calls = latest.task?.calls.length ?? 0;
    const timers = [setTimeout(() => setProgress({ phase: calls ? 'reading' : 'complete', calls: calls ? 1 : 0 }), THINK_MS)];
    for (let i = 2; i <= calls; i++) timers.push(setTimeout(() => setProgress({ phase: 'reading', calls: i }), THINK_MS + (i - 1) * CALL_MS));
    if (calls) timers.push(setTimeout(() => setProgress({ phase: 'complete', calls }), THINK_MS + calls * CALL_MS));
    return () => timers.forEach(clearTimeout);
  }, [latest]);

  function push(next) {
    setProgress({ phase: 'initial-thinking', calls: 0 });
    setExchanges(previous => [...previous, next]);
  }

  // One answer handler for every way of replying (card, buttons, composer).
  function answer(text) {
    if (!ready) return;
    const widget = latest.widget;
    if (widget === 'join') {
      const kind = answerKind(text, JOIN_OPTIONS);
      if (kind === 'agree') {
        joinNetwork();
        push(matchesExchange(text));
      } else if (kind === 'terms') {
        onExpandToCanvas?.(NETWORK_PROFILE_TAB_ID);
        push(exchange({ user: text, text: ['I’ve opened your network profile and the full terms in the canvas. Want to join?'], widget: 'join' }));
      } else if (kind === 'decline') {
        push(exchange({ user: text, text: ['No problem. You can join anytime: run /go-live or ask me about the Stripe network.'] }));
      } else {
        push(exchange({ user: text, text: ['To get matched, Rocketrides needs to join the network first. Want to join?'], widget: 'join' }));
      }
    } else if (widget === 'matches') {
      if (/\b(more|show|all|list)\b/i.test(text)) {
        onExpandToCanvas?.(NETWORK_MATCHES_TAB_ID);
        push(exchange({ user: text, text: [`I’ve opened all ${NETWORK_MATCHES.length} matches in the canvas. Toggles there and here stay in sync.`], widget: 'matches' }));
      } else if (/\b(invite|send|yes|done|go)\b/i.test(text)) {
        const invitedIds = flow.selectedIds;
        inviteSelectedMatches();
        push(doneExchange(text, invitedIds));
      } else {
        push(exchange({ user: text, text: ['Turn on the businesses you want, then invite them when you’re ready.'], widget: 'matches' }));
      }
    } else if (widget === 'go-live' || widget === 'go-live-link') {
      const option = goLiveOption(text);
      if (option?.id === 'network') push(flow.completed
        ? goLiveExchange(text, `You’ve already joined the network and invited ${flow.invitedIds.length} businesses. What’s next?`)
        : introExchange(text));
      else if (option) push(exchange({ user: text, text: [option.reply], link: option.link, widget: 'go-live-link' }));
      else push(goLiveExchange(text, 'I can help with any of these. Pick one to start.'));
    } else {
      push(exchange({ user: text, text: ['Run /go-live anytime to see what’s left to get your platform live.'] }));
    }
  }

  // Composer messages for this chat answer the open question.
  const answerRef = useRef(answer);
  useEffect(() => { answerRef.current = answer; });
  useEffect(() => onNetworkConversationMessage((chatId, text) => {
    if (chatId === chat.id) answerRef.current(text);
  }), [chat.id]);

  function renderWidget(item) {
    if (item.widget === 'join') {
      return <AskQuestion embedded autoFocus options={Object.values(JOIN_OPTIONS)} onSelect={answer} title="Join the Stripe network?" />;
    }
    if (item.widget === 'go-live' || item.widget === 'go-live-link') {
      return (
        <>
          {item.link && <NetworkLinkButton onClick={() => openDashboard(item.link.path)}>{item.link.label}</NetworkLinkButton>}
          <AskQuestion
            embedded
            autoFocus
            options={GO_LIVE_OPTIONS.map(option => option.id === 'network' && flow.completed ? `${option.label} · Done` : option.label)}
            onSelect={label => answer(label.replace(/ · Done$/, ''))}
            title={item.link ? 'Anything else?' : 'Go live checklist'}
          />
        </>
      );
    }
    if (item.widget === 'done') {
      return <NetworkLinkButton onClick={() => openDashboard('/dashboard/network/all')}>View invites in Dashboard</NetworkLinkButton>;
    }
    return null;
  }

  return exchanges.map((item, index) => {
    const isCurrent = index === exchanges.length - 1;
    const phase = isCurrent ? progress.phase : 'complete';
    const callCount = isCurrent ? progress.calls : item.task?.calls.length ?? 0;
    const done = phase === 'complete';
    return (
      <SimulatedTurn
        key={item.id}
        user={item.user}
        entrance={index > 0}
        taskPhase={item.task || !done ? phase : undefined}
        taskCopy={item.task ? { name: item.task.name, detail: item.task.detail } : undefined}
        taskCalls={item.task ? item.task.calls.slice(0, Math.max(1, callCount)).map((label, i) => ({ id: `${item.id}-${i}`, label })) : undefined}
        assistant={done ? item.text : null}
        artifactIds={item.artifactIds}
        onArtifactClick={onArtifactClick}
        isLatest={isLatest && isCurrent}
      >
        {done && item.widget === 'matches' && (
          <NetworkAccountCards
            active={isCurrent}
            onInvite={() => answer(`Invite ${flow.selectedIds.length} ${flow.selectedIds.length === 1 ? 'business' : 'businesses'}`)}
            onShowMore={() => answer('Show more matches')}
          />
        )}
        {done && isCurrent && renderWidget(item)}
      </SimulatedTurn>
    );
  });
}

function NetworkLinkButton({ onClick, children }) {
  return (
    <button type="button" className="network-link-button" onClick={onClick}>
      {children}
      <span aria-hidden="true">→</span>
    </button>
  );
}
