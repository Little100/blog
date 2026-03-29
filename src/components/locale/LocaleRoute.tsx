import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { SeoHead } from '../seo/SeoHead'
import type { Locale } from '../../i18n/translations'

/**
 * LocaleRoute wraps routes with language prefix support.
 *
 * All locales (including English) have a /{locale} prefix in the URL:
 *   /en/, /en/blog, /en/post/:slug
 *   /zh/, /zh/blog, /zh/post/:slug
 *   etc.
 *
 * This component syncs the URL locale with the i18n context and ensures the URL
 * always carries the correct locale prefix (no orphan routes).
 */
export function LocaleRoute({
  locale,
  seoProps,
}: {
  locale: Locale
  seoProps?: {
    title?: string
    description?: string
    image?: string
    type?: 'website' | 'article'
    publishedTime?: string
    author?: string
    titleOnly?: boolean
  }
}) {
  const { pathname } = useLocation()
  const { setLocale } = useI18n()

  useEffect(() => {
    // Extract locale from the first path segment
    const segments = pathname.split('/')
    const urlLocale = segments[1] as Locale | undefined
    if (urlLocale && urlLocale !== locale) {
      setLocale(urlLocale)
    }
  }, [pathname, locale, setLocale])

  // Ensure URL carries the correct locale prefix.
  // If pathname starts with a different locale (or none), redirect to the correct path.
  const segments = pathname.split('/')
  const actualLocale = (segments[1] as Locale) || null

  // Strip the locale prefix to get the inner route path
  const cleanPath = segments.slice(2).join('/') || '/'

  if (actualLocale !== locale) {
    // Redirect to the correct locale-prefixed URL
    return <Navigate to={`/${locale}/${cleanPath}`} replace />
  }

  return (
    <>
      <SeoHead {...seoProps} />
      <Outlet />
    </>
  )
}
