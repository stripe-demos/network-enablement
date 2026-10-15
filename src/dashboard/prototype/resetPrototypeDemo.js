// The prototype panel's Reset: closes the network and Connect setup dialogs,
// clears both results, sets the network controls back to Swipe and Welcome,
// and puts the Enablement module back on the Enablement page.
import { resetConnectSetup } from '../pages/connect-setup/connectSetupStore'
import { closeConnectSetup } from '../pages/connect-setup/openConnectSetup'
import { resetNetworkOnboarding } from '../pages/network/networkInvites'
import { closeNetworkOnboarding } from '../pages/network/openNetworkOnboarding'
import { resetNetworkPrototypeControls } from './networkPrototypeControls'
import { resetEnablementPrototypeControls } from './enablementPrototypeControls'

export function resetPrototypeDemo() {
  closeNetworkOnboarding()
  closeConnectSetup()
  resetNetworkOnboarding()
  resetConnectSetup()
  resetNetworkPrototypeControls()
  resetEnablementPrototypeControls()
}
