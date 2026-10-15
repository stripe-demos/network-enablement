// Connect › Pricing — a placeholder for the platform pricing tool, which the
// pricing team is building. Enablement's "Set what connected accounts pay" row
// links here. No controls, so nothing pretends to work.
import { EmptyState, PageHeader } from '@dashboard/ui'

export default function Pricing() {
  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Pricing" description="Set what your connected accounts pay." />
      <EmptyState
        title="The pricing flow is coming from the pricing team"
        description="The platform pricing tool will let you set processing fees and markups for your connected accounts without code."
      />
    </div>
  )
}
