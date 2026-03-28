import type { Locale } from './translations'

export function localeFromAcceptLanguageHeader(header: string): Locale {
  if (!header) {
    return 'en'
  }
  const segments = header.split(',')
  for (let i = 0; i < segments.length; i++) {
    const part = segments[i]
    if (!part) continue
    const primary = part.split(';')[0]
    if (!primary) continue
    const code = primary.trim().toLowerCase()

    if (code.startsWith('zh-tw') || code.startsWith('zh-hk') || code.startsWith('zh-mo')) {
      return 'zh-TW'
    }
    if (code.startsWith('zh')) {
      return 'zh'
    }
    if (code.startsWith('ja')) {
      return 'ja'
    }
  }
  return 'en'
}

const COOKIE_NAME = 'BLOG-locale'

const KNOWN_LOCALES = new Set<Locale>(['en', 'ja', 'zh', 'zh-TW'])

export function readStoredLocale(): string {
  try {
    return localStorage.getItem(COOKIE_NAME) ?? ''
  } catch {
    return ''
  }
}

export function writeStoredLocale(code: string) {
  try {
    localStorage.setItem(COOKIE_NAME, code)
  } catch {
  }
}

export function localeFromNavigatorOrHeader(): Locale {
  if (typeof navigator === 'undefined') return 'en'

  const stored = readStoredLocale()
  if (stored && KNOWN_LOCALES.has(stored as Locale)) {
    return stored as Locale
  }

  const browserLangs = navigator.languages ?? []
  for (const tag of browserLangs) {
    if (!tag) continue
    const code = tag.toLowerCase()
    if (code.startsWith('zh-tw') || code.startsWith('zh-hk') || code.startsWith('zh-mo')) {
      return 'zh-TW'
    }
    if (code.startsWith('zh')) {
      return 'zh'
    }
    if (code.startsWith('ja')) {
      return 'ja'
    }
  }

  const navLang = navigator.language ?? ''
  return localeFromAcceptLanguageHeader(navLang)
}
