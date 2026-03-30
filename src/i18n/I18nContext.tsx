import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { writeStoredLocale } from './parseAcceptLanguage'
import {
  LOCALE_DEFS,
  STRINGS,
  type Locale,
} from './translations'
import { stripBasePath } from '../config/basePath'
import rawConfig from '../../config.json'

const ALL_LOCALES: Locale[] = LOCALE_DEFS.map((d) => d.code) as Locale[]

function enabledLocales(): Locale[] {
  const configured = (rawConfig as Record<string, unknown>).languages
  if (Array.isArray(configured) && configured.length > 0) {
    return configured.filter((l: unknown) =>
      ALL_LOCALES.includes(l as Locale),
    ) as Locale[]
  }
  return ALL_LOCALES
}

function getLocaleFromPath(pathname: string): Locale | null {
  const match = pathname.match(/^\/(en|ja|zh-TW|zh)(\/|$)/)
  if (match) {
    return match[1] as Locale
  }
  return null
}

function resolveDefaultLocale(avail: Locale[]): Locale {
  const dl = (rawConfig as { defaultLanguage?: string }).defaultLanguage
  if (dl && ALL_LOCALES.includes(dl as Locale) && avail.includes(dl as Locale)) {
    return dl as Locale
  }
  return avail[0] ?? 'en'
}

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
  availableLocales: Locale[]
  defaultLocale: Locale
}

const I18nContext = createContext<I18nContextValue | null>(null)

function pickString(bucket: Record<string, string>, key: string): string {
  if (Object.prototype.hasOwnProperty.call(bucket, key) && bucket[key]) {
    return bucket[key]
  }
  return ''
}

function docLangTag(locale: Locale): string {
  const tag: Record<Locale, string> = {
    en: 'en',
    ja: 'ja',
    zh: 'zh-CN',
    'zh-TW': 'zh-TW',
  }
  return tag[locale] ?? 'en'
}

/**
 * I18nProvider keeps `locale` in sync with the URL.
 *
 * - Paths without a locale segment (`/`, `/blog`, …) always use
 *   `config.defaultLanguage` (not localStorage). That matches SEO: the root
 *   URL is the canonical default language.
 * - Paths with a prefix (`/ja/blog`, …) use that locale.
 *
 * `t()` only handles UI strings. Markdown content uses `/content/{locale}/…`.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const availableLocales = useMemo(() => enabledLocales(), [])
  const defaultLocale = useMemo(
    () => resolveDefaultLocale(availableLocales),
    [availableLocales],
  )

  const [locale, setLocaleState] = useState<Locale>(() => {
    const avail = enabledLocales()
    const def = resolveDefaultLocale(avail)
    const cleanPath = stripBasePath(window.location.pathname)
    const urlLocale = getLocaleFromPath(cleanPath)
    if (urlLocale && avail.includes(urlLocale)) {
      return urlLocale
    }
    return def
  })

  useEffect(() => {
    document.documentElement.lang = docLangTag(locale)
  }, [locale])

  useEffect(() => {
    const cleanPath = stripBasePath(pathname)
    const urlLocale = getLocaleFromPath(cleanPath)
    const target: Locale =
      urlLocale && availableLocales.includes(urlLocale)
        ? urlLocale
        : defaultLocale
    setLocaleState((prev) => {
      if (prev === target) return prev
      writeStoredLocale(target)
      return target
    })
  }, [pathname, defaultLocale, availableLocales])

  const setLocale = useCallback(
    (l: Locale) => {
      if (!availableLocales.includes(l)) return
      setLocaleState((prev) => {
        if (prev === l) return prev
        writeStoredLocale(l)
        return l
      })
    },
    [availableLocales],
  )

  const t = useCallback(
    (key: string) => {
      const stringsLoc = STRINGS[locale] as Record<string, string>
      const found = pickString(stringsLoc, key)
      if (found) return found

      if (locale === 'zh-TW') {
        const zh = STRINGS.zh as Record<string, string>
        const zhFound = pickString(zh, key)
        if (zhFound) return zhFound
      }

      const en = STRINGS.en as Record<string, string>
      const enFound = pickString(en, key)
      if (enFound) return enFound

      return key
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, availableLocales, defaultLocale }),
    [locale, setLocale, t, availableLocales, defaultLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}

/** Dev HMR can remount routes before Provider; avoid crashing the shell. */
export function useI18nOptional() {
  return useContext(I18nContext)
}
