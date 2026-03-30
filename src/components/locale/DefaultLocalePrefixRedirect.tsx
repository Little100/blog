import { Navigate, useLocation } from 'react-router-dom'
import type { Locale } from '../../i18n/translations'

/**
 * When defaultLanguage is e.g. `zh`, URLs like /zh/blog are aliases for /blog.
 * Strips the redundant /{defaultLocale} prefix from the pathname.
 */
export function DefaultLocalePrefixRedirect({ defaultLocale }: { defaultLocale: Locale }) {
  const { pathname } = useLocation()
  const prefix = `/${defaultLocale}`
  if (!pathname.startsWith(prefix)) {
    return <Navigate to="/404" replace />
  }
  let rest = pathname.slice(prefix.length)
  if (!rest || rest === '') {
    rest = '/'
  } else if (!rest.startsWith('/')) {
    rest = `/${rest}`
  }
  return <Navigate to={rest} replace />
}
