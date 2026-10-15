// State for the Stripe network conversation, shared by the chat (account
// cards) and the canvas (matches table) so an Invite toggle in one shows in
// the other. In memory only: a finished result leaves Console through
// openDashboard(), which hands it to the Dashboard.
import { useSyncExternalStore } from 'react';
import { launchDashboard } from '../../integration/consoleHandoff';
import { RECOMMENDED_MATCHES } from './networkOnboarding';

const listeners = new Set();
let state = {
  selectedIds: RECOMMENDED_MATCHES.map(match => match.id),
  optedIn: false,
  completed: false,
  invitedIds: [],
};

function set(partial) {
  state = { ...state, ...partial };
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNetworkOnboardingState() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function toggleNetworkMatch(id) {
  if (state.completed) return;
  set({ selectedIds: state.selectedIds.includes(id) ? state.selectedIds.filter(x => x !== id) : [...state.selectedIds, id] });
}

export function joinNetwork() {
  set({ optedIn: true });
}

export function inviteSelectedMatches() {
  set({ completed: true, invitedIds: state.selectedIds });
}

/** Opens a Dashboard page, carrying the onboarding result once it's finished. */
export function openDashboard(path) {
  launchDashboard(path, state.completed ? { networkOnboarding: { optedIn: state.optedIn, selectedAccountIds: state.invitedIds } } : undefined);
}

// Composer messages sent while a network chat is open go to its conversation
// (which answers the open question) instead of the default simulated reply.
const inboxListeners = new Set();

export function postToNetworkConversation(chatId, text) {
  inboxListeners.forEach(listener => listener(chatId, text));
}

export function onNetworkConversationMessage(listener) {
  inboxListeners.add(listener);
  return () => inboxListeners.delete(listener);
}
