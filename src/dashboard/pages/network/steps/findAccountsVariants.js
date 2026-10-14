// Step 3 ("Find connected accounts") presentations to compare. The prototype
// control panel picks one; each takes the standard step props
// ({ state, setState, onValidChange }) and writes state.selectedAccountIds.
import FindAccountsStep from './FindAccountsStep'
import FindAccountsCardsStep from './FindAccountsCardsStep'
import FindAccountsDeckStep from './FindAccountsDeckStep'

export const FIND_ACCOUNTS_VARIANTS = [
  { id: 'list', label: 'A · List and search', Component: FindAccountsStep },
  { id: 'cards', label: 'B · Profile cards', Component: FindAccountsCardsStep },
  { id: 'deck', label: 'C · Swipe', Component: FindAccountsDeckStep },
]
