import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import type { Locale } from '../i18n/translations'

export function useLocalePath() {
  const { locale, defaultLocale } = useI18n()

  const getLocalePath = useCallback(
    (path: string): string => {
      const normalized = path.startsWith('/') ? path : `/${path}`
      return locale === defaultLocale
        ? normalized
        : `/${locale}${normalized}`
    },
    [locale, defaultLocale],
  )

  const getAllLocalePaths = useCallback(
    (path: string, availableLocales: Locale[]): { locale: Locale; path: string }[] => {
      const normalized = path.startsWith('/') ? path : `/${path}`
      return availableLocales.map((loc) => ({
        locale: loc,
        path: loc === defaultLocale
          ? normalized
          : `/${loc}${normalized}`,
      }))
    },
    [defaultLocale],
  )

  return { getLocalePath, getAllLocalePaths }
}

export function getLocaleFromPath(pathname: string): Locale | null {
  // Note: zh-TW must appear before zh so the alternation matches the longer variant first.
  const match = pathname.match(/^\/(en|ja|zh-TW|zh)(\/|$)/)
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
  const { locale, defaultLocale } = useI18n()
  const navigate = useNavigate()

  const navigateWithLocale = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      const normalized = path.startsWith('/') ? path : `/${path}`
      navigate(
        locale === defaultLocale ? normalized : `/${locale}${normalized}`,
        options,
      )
    },
    [locale, defaultLocale, navigate],
  )

  const navigateToLocale = useCallback(
    (targetLocale: Locale, path?: string) => {
      const normalized = path?.startsWith('/') ? path : (path ? `/${path}` : '/')
      navigate(
        targetLocale === defaultLocale ? normalized : `/${targetLocale}${normalized}`,
      )
    },
    [defaultLocale, navigate],
  )

  return { navigateWithLocale, navigateToLocale }
}
