import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { SeoHead } from '../seo/SeoHead'
import { stripBasePath } from '../../config/basePath'
import type { Locale } from '../../i18n/translations'

/**
 * LocaleRoute syncs the i18n context with the current route's locale.
 *
 * For the default locale (e.g. /), the URL has no locale prefix.
 * For non-default locales (e.g. /ja/), the URL carries the /{locale} prefix.
 *
 * This component:
 * 1. Reads the locale from the URL (stripping base path first).
 * 2. Syncs the i18n context so `useI18n()` returns the correct locale.
 * 3. Redirects if the URL doesn't match the expected route locale.
 * 4. Renders the nested routes via <Outlet /> with optional SeoHead props.
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
  const { setLocale, locale: activeLocale, availableLocales } = useI18n()

  const cleanPathname = stripBasePath(pathname)
  const segments = cleanPathname.split('/').filter(Boolean)
  const firstSeg = segments[0]
  const urlLocalePrefix =
    firstSeg && availableLocales.includes(firstSeg as Locale)
      ? (firstSeg as Locale)
      : null

  /** Paths like /, /blog, /404 — first segment is not a locale code. */
  const isUnprefixedPath = urlLocalePrefix === null

  useEffect(() => {
    if (isUnprefixedPath) {
      if (locale !== activeLocale && availableLocales.includes(locale)) {
        setLocale(locale)
      }
      return
    }
    if (
      urlLocalePrefix &&
      availableLocales.includes(urlLocalePrefix) &&
      urlLocalePrefix !== activeLocale
    ) {
      setLocale(urlLocalePrefix)
    }
  }, [
    cleanPathname,
    activeLocale,
    availableLocales,
    setLocale,
    locale,
    isUnprefixedPath,
    urlLocalePrefix,
  ])

  // Prefixed URL (/ja/blog) but this layout expects a different locale → fix path.
  if (!isUnprefixedPath && urlLocalePrefix !== locale) {
    const rest = segments.slice(1).join('/')
    const target = rest ? `/${locale}/${rest}` : `/${locale}/`
    return <Navigate to={target} replace />
  }

  return (
    <>
      <SeoHead {...seoProps} />
      <Outlet />
    </>
  )
}
