import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { SeoHead } from '../seo/SeoHead'
import type { Locale } from '../../i18n/translations'

/**
 * Extracts the locale prefix from the URL path
 */
function getLocaleFromPath(pathname: string): Locale | null {
  const match = pathname.match(/^\/(en|ja|zh|zh-TW)(\/|$)/)
  if (match) {
    return match[1] as Locale
  }
  return null
}

/**
 * Strips the locale prefix from the URL path
 */
function getCleanPath(pathname: string): string {
  return pathname.replace(/^\/(en|ja|zh|zh-TW)/, '') || '/'
}

/**
 * LocaleRoute wraps routes with language prefix support.
 * It syncs the URL locale with the i18n context and ensures proper SEO handling.
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

  // Sync locale from URL when this route mounts
  useEffect(() => {
    const urlLocale = getLocaleFromPath(pathname)
    if (urlLocale && urlLocale !== locale) {
      setLocale(urlLocale)
    }
  }, [pathname, locale, setLocale])

  // Redirect to correct locale if URL doesn't match
  const actualLocale = getLocaleFromPath(pathname)
  const cleanPath = getCleanPath(pathname)

  // If locale doesn't match, redirect
  if (locale !== 'en') {
    if (actualLocale !== locale) {
      return <Navigate to={`/${locale}${cleanPath}`} replace />
    }
  } else {
    // English should have no prefix
    if (actualLocale !== null) {
      return <Navigate to={cleanPath} replace />
    }
  }

  return (
    <>
      <SeoHead {...seoProps} />
      <Outlet />
    </>
  )
}
