import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  localeFromNavigatorOrHeader,
  writeStoredLocale,
} from './parseAcceptLanguage'
import { CONTENT_STRINGS_BY_LOCALE } from './contentBundles'
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
  // Note: zh-TW must appear before zh so the alternation matches the longer variant first.
  const match = pathname.match(/^\/(en|ja|zh-TW|zh)(\/|$)/)
  if (match) {
    return match[1] as Locale
  }
  return null
}

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
  availableLocales: Locale[]
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const availableLocales = useMemo(() => enabledLocales(), [])

  // Initialize synchronously from window so the locale is correct on first render.
  // This avoids the flash-of-wrong-language issue that useEffect would introduce.
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Strip the Vite base path (e.g. /blog/) before extracting the locale.
    // window.location.pathname includes the base path; without stripping it,
    // the first segment would be "blog" instead of "en" or "zh", breaking detection.
    const cleanPath = stripBasePath(window.location.pathname)
    const urlLocale = getLocaleFromPath(cleanPath)
    if (urlLocale && availableLocales.includes(urlLocale)) {
      return urlLocale
    }
    const stored = localStorage.getItem('BLOG-locale')
    if (stored && availableLocales.includes(stored as Locale)) {
      return stored as Locale
    }
    const detected = localeFromNavigatorOrHeader()
    if (availableLocales.includes(detected)) {
      return detected
    }
    return availableLocales[0] ?? 'en'
  })

  useEffect(() => {
    document.documentElement.lang = docLangTag(locale)
  }, [locale])

  const setLocale = useCallback(
    (l: Locale) => {
      if (availableLocales.includes(l)) {
        setLocaleState(l)
        writeStoredLocale(l)
      }
    },
    [availableLocales],
  )

  const t = useCallback(
    (key: string) => {
      const contentLoc = CONTENT_STRINGS_BY_LOCALE[locale] as Record<string, string>
      const stringsLoc = STRINGS[locale] as Record<string, string>
      let primary =
        pickString(contentLoc, key) || pickString(stringsLoc, key)
      if (!primary && locale === 'zh-TW') {
        primary = pickString(CONTENT_STRINGS_BY_LOCALE.zh, key)
      }
      if (primary) return primary
      const contentEn = CONTENT_STRINGS_BY_LOCALE.en as Record<string, string>
      const stringsEn = STRINGS.en as Record<string, string>
      const en = pickString(contentEn, key) || pickString(stringsEn, key)
      return en || key
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, availableLocales }),
    [locale, setLocale, t, availableLocales],
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
