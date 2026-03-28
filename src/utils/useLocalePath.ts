import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import type { Locale } from '../i18n/translations'

export function useLocalePath() {
  const { locale } = useI18n()

  const getLocalePath = useCallback(
    (path: string): string => {
      const normalized = path.startsWith('/') ? path : `/${path}`
      if (locale === 'en') {
        return normalized
      }
      return `/${locale}${normalized}`
    },
    [locale]
  )

  const getAllLocalePaths = useCallback(
    (path: string, availableLocales: Locale[]): { locale: Locale; path: string }[] => {
      const normalized = path.startsWith('/') ? path : `/${path}`
      return availableLocales.map((loc) => ({
        locale: loc,
        path: loc === 'en' ? normalized : `/${loc}${normalized}`,
      }))
    },
    []
  )

  return { getLocalePath, getAllLocalePaths }
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const match = pathname.match(/^\/(en|ja|zh|zh-TW)(\/|$)/)
  if (match) {
    return match[1] as Locale
  }
  return null
}

export function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/(en|ja|zh-TW|zh)(?=\/|$)/, '')
}

export function getRoutePathname(pathname: string): string {
  const withoutLocale = stripLocalePrefix(pathname) || '/'
  const noQuery = withoutLocale.split('?')[0] ?? ''
  const trimmed = noQuery.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

export function useLocaleFromUrl() {
  const { pathname } = useLocation()
  const { locale: contextLocale, availableLocales } = useI18n()

  const urlLocale = getLocaleFromPath(pathname)

  const activeLocale = urlLocale && availableLocales.includes(urlLocale)
    ? urlLocale
    : contextLocale

  const cleanPath = stripLocalePrefix(pathname)

  return { activeLocale, cleanPath, urlLocale }
}

export function useLocaleNavigate() {
  const { locale } = useI18n()
  const navigate = useNavigate()

  const navigateWithLocale = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      const normalized = path.startsWith('/') ? path : `/${path}`
      const localePath = locale === 'en' ? normalized : `/${locale}${normalized}`
      navigate(localePath, options)
    },
    [locale, navigate]
  )

  const navigateToLocale = useCallback(
    (targetLocale: Locale, path?: string) => {
      const normalized = path?.startsWith('/') ? path : (path ? `/${path}` : '/')
      const localePath = targetLocale === 'en' ? normalized : `/${targetLocale}${normalized}`
      navigate(localePath)
    },
    [navigate]
  )

  return { navigateWithLocale, navigateToLocale }
}
