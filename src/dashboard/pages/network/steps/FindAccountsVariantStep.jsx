// Renders whichever step 3 presentation the prototype control panel selects.
import { useNetworkPrototypeControls } from '../../../prototype/networkPrototypeControls'
import { FIND_ACCOUNTS_VARIANTS } from './findAccountsVariants'

export default function FindAccountsVariantStep(props) {
  const { findAccountsVariant } = useNetworkPrototypeControls()
  const variant = FIND_ACCOUNTS_VARIANTS.find(v => v.id === findAccountsVariant) ?? FIND_ACCOUNTS_VARIANTS[0]
  return <variant.Component key={variant.id} {...props} />
}
