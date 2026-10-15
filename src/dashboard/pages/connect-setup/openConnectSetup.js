// Opens the Connect setup dialog from anywhere in the Dashboard.
// ConnectSetupHost (mounted once in DashboardLayout) listens for these events
// and owns the only dialog instance.
export const OPEN_CONNECT_SETUP_EVENT = 'dashboard:open-connect-setup'
export const CLOSE_CONNECT_SETUP_EVENT = 'dashboard:close-connect-setup'

/** Opens the dialog on Describe your business, or on Review setup once setup is complete. */
export function openConnectSetup() {
  window.dispatchEvent(new Event(OPEN_CONNECT_SETUP_EVENT))
}

/** Closes the dialog. No-op when it's closed. */
export function closeConnectSetup() {
  window.dispatchEvent(new Event(CLOSE_CONNECT_SETUP_EVENT))
}
