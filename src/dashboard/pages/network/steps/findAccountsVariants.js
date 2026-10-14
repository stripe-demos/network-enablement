// Step 3 ("Find connected accounts") presentations to compare. The prototype
// control panel picks one; each takes the standard step props
// ({ state, setState, onValidChange }) and writes state.selectedAccountIds.
import FindAccountsDeckStep from './FindAccountsDeckStep'
import FindAccountsCardsStep from './FindAccountsCardsStep'

export const FIND_ACCOUNTS_VARIANTS = [
  { id: 'deck', label: 'A · Swipe', Component: FindAccountsDeckStep },
  { id: 'cards', label: 'B · Profile cards', Component: FindAccountsCardsStep },
]
