// Shim for `next/link` so ported dashboard components run unchanged under
// react-router. Maps `href` → react-router's `to`, strips Next-only props.
import { Link as RRLink } from 'react-router-dom'

export default function Link({
  href,
  children,
  replace,
  ...rest
}) {
  for (const key of ['prefetch', 'scroll', 'shallow', 'passHref', 'legacyBehavior', 'locale']) delete rest[key]
  const to = href && typeof href === 'object' ? href.pathname || '/' : href

  if (to == null) {
    return <span {...rest}>{children}</span>
  }

  const isExternal = typeof to === 'string' && /^(https?:)?\/\/|^mailto:|^tel:/.test(to)
  if (isExternal) {
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <RRLink to={to} replace={replace} {...rest}>
      {children}
    </RRLink>
  )
}
