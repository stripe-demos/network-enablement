// Shim for `next/dynamic`: a lazy component behind an empty Suspense fallback.
// Everything here is client-only, so the `ssr` option is ignored.
import { lazy, Suspense, type ComponentType } from "react"

export default function dynamic<P extends object>(
  load: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  options?: { ssr?: boolean; loading?: ComponentType },
) {
  const Lazy = lazy(async () => {
    const mod = await load()
    return "default" in mod ? mod : { default: mod }
  })
  const Loading = options?.loading
  return function DynamicComponent(props: P) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <Lazy {...props} />
      </Suspense>
    )
  }
}
